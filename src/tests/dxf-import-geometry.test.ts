import { describe, expect, it } from 'vitest';
import { parseDxfContent } from '@/utils/dxfParser';

// ─── tiny DXF writer ────────────────────────────────────────────────────────

const line = (x1: number, y1: number, x2: number, y2: number, layer = '0') =>
  `0\nLINE\n8\n${layer}\n10\n${x1}\n20\n${y1}\n30\n0\n11\n${x2}\n21\n${y2}\n31\n0\n`;
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) =>
  `0\nARC\n8\n0\n10\n${cx}\n20\n${cy}\n30\n0\n40\n${r}\n50\n${a0}\n51\n${a1}\n`;
const circle = (cx: number, cy: number, r: number) => `0\nCIRCLE\n8\n0\n10\n${cx}\n20\n${cy}\n30\n0\n40\n${r}\n`;
const lwpoly = (pts: Array<[number, number, number?]>, closed: boolean) =>
  `0\nLWPOLYLINE\n8\n0\n90\n${pts.length}\n70\n${closed ? 1 : 0}\n` +
  pts.map(([x, y, b]) => `10\n${x}\n20\n${y}\n` + (b ? `42\n${b}\n` : '')).join('');
const ellipse = (cx: number, cy: number, mx: number, my: number, ratio: number) =>
  `0\nELLIPSE\n8\n0\n10\n${cx}\n20\n${cy}\n30\n0\n11\n${mx}\n21\n${my}\n31\n0\n40\n${ratio}\n41\n0\n42\n${2 * Math.PI}\n`;
const spline = (ctrl: Array<[number, number]>, knots: number[], degree = 3) =>
  `0\nSPLINE\n8\n0\n70\n8\n71\n${degree}\n72\n${knots.length}\n73\n${ctrl.length}\n` +
  knots.map((k) => `40\n${k}\n`).join('') +
  ctrl.map(([x, y]) => `10\n${x}\n20\n${y}\n30\n0\n`).join('');
const insert = (name: string, x: number, y: number, rot = 0) => `0\nINSERT\n8\n0\n2\n${name}\n10\n${x}\n20\n${y}\n30\n0\n50\n${rot}\n`;

const dxf = (entities: string, opts: { units?: number; blocks?: string } = {}) =>
  (opts.units !== undefined ? `0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n${opts.units}\n0\nENDSEC\n` : '') +
  (opts.blocks ? `0\nSECTION\n2\nBLOCKS\n${opts.blocks}0\nENDSEC\n` : '') +
  `0\nSECTION\n2\nENTITIES\n${entities}0\nENDSEC\n0\nEOF\n`;

const block = (name: string, entities: string) => `0\nBLOCK\n8\n0\n2\n${name}\n70\n0\n10\n0\n20\n0\n30\n0\n3\n${name}\n${entities}0\nENDBLK\n8\n0\n`;

const ROUNDED_AREA = 100 * 50 - (4 - Math.PI) * 10 * 10; // 100×50 rectangle, r = 10 corners
const signed = (pts: Array<{ x: number; y: number }>) =>
  pts.reduce((s, p, i) => {
    const q = pts[(i + 1) % pts.length];
    return s + (p.x * q.y - q.x * p.y) / 2;
  }, 0);

describe('DXF import — geometry', () => {
  it('chains loose LINE and ARC entities (any order, any direction) into one closed part', () => {
    const entities = [
      arc(90, 40, 10, 0, 90),
      line(10, 0, 90, 0),
      arc(10, 10, 10, 180, 270),
      line(0, 40, 0, 10), // drawn "backwards"
      arc(90, 10, 10, 270, 360),
      line(90, 50, 10, 50),
      arc(10, 40, 10, 90, 180),
      line(100, 10, 100, 40),
    ].join('');
    const res = parseDxfContent(dxf(entities), 'rounded.dxf');
    expect(res.errors).toEqual([]);
    expect(res.parts).toHaveLength(1);
    const p = res.parts[0];
    expect(p.polygon.bounds.width).toBeCloseTo(100, 3);
    expect(p.polygon.bounds.height).toBeCloseTo(50, 3);
    expect(p.polygon.area).toBeCloseTo(ROUNDED_AREA, -1);
    expect(Math.abs(p.polygon.area - ROUNDED_AREA) / ROUNDED_AREA).toBeLessThan(0.002);
  });

  it('draws clockwise (negative) bulges and the closing bulge of a closed polyline', () => {
    const b = -Math.tan(Math.PI / 8); // quarter circle, clockwise
    const res = parseDxfContent(
      dxf(
        lwpoly(
          [
            [0, 10], [0, 40, b], [10, 50], [90, 50, b], [100, 40], [100, 10, b], [90, 0], [10, 0, b],
          ],
          true,
        ),
      ),
      'cw.dxf',
    );
    expect(res.parts).toHaveLength(1);
    const p = res.parts[0];
    expect(p.polygon.bounds.width).toBeCloseTo(100, 3);
    expect(p.polygon.bounds.height).toBeCloseTo(50, 3);
    expect(Math.abs(p.polygon.area - ROUNDED_AREA) / ROUNDED_AREA).toBeLessThan(0.002);
  });

  it('keeps a bulge on the closing segment (D shape)', () => {
    const res = parseDxfContent(dxf(lwpoly([[0, 0], [100, 0], [100, 100], [0, 100, 1]], true)), 'd.dxf', { normalizeOrigin: false });
    const p = res.parts[0];
    expect(p.polygon.bounds.x).toBeCloseTo(-50, 3);
    expect(p.polygon.bounds.width).toBeCloseTo(150, 3);
    const expected = 100 * 100 + (Math.PI * 50 * 50) / 2;
    expect(Math.abs(p.polygon.area - expected) / expected).toBeLessThan(0.002);
  });

  it('converts inch drawings to millimetres via $INSUNITS', () => {
    const res = parseDxfContent(dxf(lwpoly([[0, 0], [4, 0], [4, 2], [0, 2]], true), { units: 1 }), 'inch.dxf');
    expect(res.unitScale).toBe(25.4);
    expect(res.parts[0].polygon.bounds.width).toBeCloseTo(101.6, 6);
    expect(res.parts[0].polygon.bounds.height).toBeCloseTo(50.8, 6);
    expect(res.warnings.some((w) => w.includes('inch'))).toBe(true);
  });

  it('reads full ellipses and B-spline edges', () => {
    const e = parseDxfContent(dxf(ellipse(0, 0, 50, 0, 0.5)), 'ellipse.dxf');
    expect(e.parts).toHaveLength(1);
    const ellipseArea = Math.PI * 50 * 25;
    expect(Math.abs(e.parts[0].polygon.area - ellipseArea) / ellipseArea).toBeLessThan(0.003);

    // clamped cubic B-spline (= Bézier) from (0,0) to (100,0) closed by a line
    const ctrl: Array<[number, number]> = [[0, 0], [30, 60], [70, 60], [100, 0]];
    const s = parseDxfContent(dxf(spline(ctrl, [0, 0, 0, 0, 1, 1, 1, 1]) + line(100, 0, 0, 0)), 'spline.dxf');
    expect(s.parts).toHaveLength(1);
    expect(s.parts[0].polygon.bounds.height).toBeCloseTo(45, 1); // curve peak at t = 0.5
    // reference area from the Bernstein form
    let ref = 0;
    const N = 20000;
    const bez = (t: number) => {
      const u = 1 - t;
      return {
        x: u * u * u * 0 + 3 * u * u * t * 30 + 3 * u * t * t * 70 + t * t * t * 100,
        y: 3 * u * u * t * 60 + 3 * u * t * t * 60,
      };
    };
    for (let i = 0; i < N; i++) {
      const a = bez(i / N), b2 = bez((i + 1) / N);
      ref += ((b2.x - a.x) * (a.y + b2.y)) / 2;
    }
    expect(Math.abs(s.parts[0].polygon.area - ref) / ref).toBeLessThan(0.003);
  });

  it('expands rotated block references (INSERT)', () => {
    const blocks = block('PLATE', lwpoly([[0, 0], [100, 0], [100, 20], [0, 20]], true));
    const res = parseDxfContent(dxf(insert('PLATE', 500, 500, 90) + insert('PLATE', 0, 0, 0), { blocks }), 'blocks.dxf', { normalizeOrigin: false });
    expect(res.parts).toHaveLength(2);
    const rotated = res.parts.find((p) => p.polygon.bounds.height > 50)!;
    expect(rotated.polygon.bounds.width).toBeCloseTo(20, 6);
    expect(rotated.polygon.bounds.height).toBeCloseTo(100, 6);
    expect(rotated.polygon.bounds.x).toBeCloseTo(480, 6);
    expect(rotated.polygon.bounds.y).toBeCloseTo(500, 6);
  });

  it('finds holes and returns outer CCW / holes CW', () => {
    const square = line(0, 0, 200, 0) + line(200, 0, 200, 200) + line(200, 200, 0, 200) + line(0, 200, 0, 0);
    const res = parseDxfContent(dxf(square + circle(100, 100, 30)), 'holes.dxf');
    expect(res.parts).toHaveLength(1);
    const p = res.parts[0];
    expect(p.innerPolygons).toHaveLength(1);
    expect(signed(p.polygon.points)).toBeGreaterThan(0);
    expect(signed(p.innerPolygons![0].points)).toBeLessThan(0);
    // chordal approximation (≤ 0.05 mm deviation) keeps the area within 0.5 %
    expect(Math.abs(p.innerPolygons![0].area - Math.PI * 900) / (Math.PI * 900)).toBeLessThan(0.005);
  });

  it('closes small drafting gaps and reports what it did', () => {
    const gapped = line(0, 0, 100, 0) + line(100, 0, 100, 100) + line(100, 100, 0, 100) + line(0, 100, 0.02, 0.01);
    const res = parseDxfContent(dxf(gapped), 'gap.dxf');
    expect(res.parts).toHaveLength(1);
    expect(res.warnings.some((w) => w.includes('small gaps'))).toBe(true);

    const open = line(0, 0, 100, 0) + line(100, 0, 100, 100);
    const res2 = parseDxfContent(dxf(open), 'open.dxf');
    expect(res2.parts).toHaveLength(0);
    expect(res2.openContours).toBe(1);
  });

  it('ignores the SHEET layer', () => {
    const res = parseDxfContent(
      dxf(line(0, 0, 3000, 0, 'SHEET') + lwpoly([[10, 10], [60, 10], [60, 60], [10, 60]], true)),
      'sheet.dxf',
    );
    expect(res.parts).toHaveLength(1);
    expect(res.parts[0].polygon.bounds.width).toBeCloseTo(50, 6);
  });
});
