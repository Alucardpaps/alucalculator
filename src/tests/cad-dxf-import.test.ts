import { describe, expect, it } from 'vitest';
import { parseDXF } from '../cad/dxf/DxfParser';
import { generateDXF } from '../cad/dxf/DxfGenerator';
import { DEFAULT_LAYER } from '../cad/kernel/constants';
import { createArcEntity, createEllipseEntity, createTextEntity, type CadEntity } from '../cad/kernel/types';

const header = (units: number) => `0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n${units}\n0\nENDSEC\n`;
const tables = (layers: Array<[string, number]>) =>
  `0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n${layers.length}\n` +
  layers.map(([n, c]) => `0\nLAYER\n2\n${n}\n70\n0\n62\n${c}\n6\nCONTINUOUS\n`).join('') +
  `0\nENDTAB\n0\nENDSEC\n`;
const blocks = (body: string) => `0\nSECTION\n2\nBLOCKS\n${body}0\nENDSEC\n`;
const block = (name: string, ents: string) => `0\nBLOCK\n8\n0\n2\n${name}\n70\n0\n10\n0\n20\n0\n30\n0\n3\n${name}\n${ents}0\nENDBLK\n8\n0\n`;
const entitiesSection = (body: string) => `0\nSECTION\n2\nENTITIES\n${body}0\nENDSEC\n0\nEOF\n`;

const line = (x1: number, y1: number, x2: number, y2: number, layer = '0', color?: number) =>
  `0\nLINE\n8\n${layer}\n${color !== undefined ? `62\n${color}\n` : ''}10\n${x1}\n20\n${y1}\n30\n0\n11\n${x2}\n21\n${y2}\n31\n0\n`;
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) =>
  `0\nARC\n8\n0\n10\n${cx}\n20\n${cy}\n30\n0\n40\n${r}\n50\n${a0}\n51\n${a1}\n`;
const text = (x: number, y: number, h: number, s: string, rot = 0) => `0\nTEXT\n8\n0\n10\n${x}\n20\n${y}\n30\n0\n40\n${h}\n50\n${rot}\n1\n${s}\n`;
const mtext = (x: number, y: number, h: number, s: string) => `0\nMTEXT\n8\n0\n10\n${x}\n20\n${y}\n30\n0\n40\n${h}\n71\n1\n1\n${s}\n`;
const ellipse = (cx: number, cy: number, mx: number, my: number, ratio: number, t0 = 0, t1 = 2 * Math.PI) =>
  `0\nELLIPSE\n8\n0\n10\n${cx}\n20\n${cy}\n30\n0\n11\n${mx}\n21\n${my}\n31\n0\n40\n${ratio}\n41\n${t0}\n42\n${t1}\n`;
const spline = (ctrl: Array<[number, number]>, knots: number[]) =>
  `0\nSPLINE\n8\n0\n70\n8\n71\n3\n72\n${knots.length}\n73\n${ctrl.length}\n` +
  knots.map((k) => `40\n${k}\n`).join('') + ctrl.map(([x, y]) => `10\n${x}\n20\n${y}\n30\n0\n`).join('');
const insert = (name: string, x: number, y: number, rot = 0, sx = 1, layer = '0') =>
  `0\nINSERT\n8\n${layer}\n2\n${name}\n10\n${x}\n20\n${y}\n30\n0\n41\n${sx}\n42\n1\n50\n${rot}\n`;

const geo = <T extends CadEntity['geometry']['type']>(ents: CadEntity[], type: T) =>
  ents.filter((e) => e.geometry.type === type).map((e) => e.geometry as Extract<CadEntity['geometry'], { type: T }>);

describe('AluCAD DXF import', () => {
  it('reads text, multiline text and their control codes', () => {
    const res = parseDXF(entitiesSection(text(10, 20, 5, 'Ø%%c20 H7') + mtext(0, 50, 3.5, '{\\fArial|b1;Line one}\\PLine two')));
    const texts = geo(res.entities, 'TEXT');
    expect(texts.map((t) => t.content)).toEqual(['ØØ20 H7', 'Line one Line two']);
    // TEXT anchors on its baseline; AluCAD draws from the top edge → moved up by the height
    expect(texts[0].position.x).toBeCloseTo(10, 6);
    expect(texts[0].position.y).toBeCloseTo(25, 6);
    expect(texts[0].fontSize).toBeCloseTo(5, 6);
    expect(texts[1].position.y).toBeCloseTo(50, 6);
  });

  it('keeps ellipses and turns splines into exact polylines', () => {
    const res = parseDXF(entitiesSection(ellipse(0, 0, 30, 30, 0.5) + spline([[0, 0], [30, 60], [70, 60], [100, 0]], [0, 0, 0, 0, 1, 1, 1, 1])));
    const [el] = geo(res.entities, 'ELLIPSE');
    expect(el.radiusX).toBeCloseTo(Math.hypot(30, 30), 6);
    expect(el.radiusY).toBeCloseTo(Math.hypot(30, 30) * 0.5, 6);
    expect(el.rotation).toBeCloseTo(Math.PI / 4, 6);
    expect(el.startAngle).toBeUndefined();
    const [pl] = geo(res.entities, 'POLYLINE');
    const ys = pl.vertices.map((v) => v.y);
    expect(Math.max(...ys)).toBeCloseTo(45, 1); // Bézier peak at t = 0.5
    expect(pl.vertices[0]).toEqual({ x: 0, y: 0 });
    expect(pl.vertices[pl.vertices.length - 1].x).toBeCloseTo(100, 6);
  });

  it('expands block references with rotation and takes the insert layer for layer-0 content', () => {
    const dxf =
      tables([['0', 7], ['PARTS', 1]]) +
      blocks(block('BRACKET', line(0, 0, 100, 0) + arc(100, 20, 20, 270, 360))) +
      entitiesSection(insert('BRACKET', 500, 500, 90, 1, 'PARTS'));
    const res = parseDXF(dxf);
    const [ln] = geo(res.entities, 'LINE');
    expect(ln.start.x).toBeCloseTo(500, 6);
    expect(ln.start.y).toBeCloseTo(500, 6);
    expect(ln.end.x).toBeCloseTo(500, 6);
    expect(ln.end.y).toBeCloseTo(600, 6);
    const [a] = geo(res.entities, 'ARC');
    expect(a.center.x).toBeCloseTo(480, 6);
    expect(a.center.y).toBeCloseTo(600, 6);
    // 270°…360° rotated by +90° → 0°…90° (angles normalised to [0, 2π))
    expect(a.startAngle).toBeCloseTo(0, 6);
    expect(a.endAngle).toBeCloseTo(Math.PI / 2, 6);
    const lineEnt = res.entities.find((e) => e.geometry.type === 'LINE')!;
    expect(lineEnt.layerId).toBe('layer-PARTS');
    expect(lineEnt.color).toBe('#ff0000'); // BYLAYER → layer colour (ACI 1)
    expect(res.layers.map((l) => l.name)).toEqual(['0', 'PARTS']);
  });

  it('mirrored inserts keep arcs on the right side', () => {
    const dxf = blocks(block('A', arc(0, 0, 10, 0, 90))) + entitiesSection(insert('A', 0, 0, 0, -1));
    const [a] = geo(parseDXF(dxf).entities, 'ARC');
    // the quarter arc (1,0)…(0,1) mirrored in X becomes (−1,0)…(0,1): CCW from 90° to 180°
    expect(a.startAngle).toBeCloseTo(Math.PI / 2, 6);
    expect(a.endAngle).toBeCloseTo(Math.PI, 6);
  });

  it('honours inch units and explicit colours', () => {
    const res = parseDXF(header(1) + entitiesSection(line(0, 0, 2, 0, '0', 3)));
    expect(res.unitScale).toBe(25.4);
    const [ln] = geo(res.entities, 'LINE');
    expect(ln.end.x).toBeCloseTo(50.8, 6);
    expect(res.entities[0].color).toBe('#00ff00');
  });

  it('round-trips arcs, ellipses and text through export', () => {
    const ents = [
      createArcEntity({ x: 5, y: 5 }, 12, 0.2, 2.4, 'layer-0', '#ffffff'),
      createEllipseEntity({ x: 0, y: 0 }, 40, 15, 'layer-0', '#ffffff', 0.5),
      createTextEntity({ x: 10, y: 10 }, 'R12', 4, 'layer-0', '#ffffff'),
    ];
    const back = parseDXF(generateDXF(ents, [DEFAULT_LAYER]));
    const [a] = geo(back.entities, 'ARC');
    expect(a.radius).toBeCloseTo(12, 4);
    expect(a.startAngle).toBeCloseTo(0.2, 3);
    expect(a.endAngle).toBeCloseTo(2.4, 3);
    const [el] = geo(back.entities, 'ELLIPSE');
    expect(el.radiusX).toBeCloseTo(40, 4);
    expect(el.radiusY).toBeCloseTo(15, 4);
    expect(el.rotation).toBeCloseTo(0.5, 4);
    expect(geo(back.entities, 'TEXT')[0].content).toBe('R12');
  });
});
