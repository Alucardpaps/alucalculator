import { describe, expect, it } from 'vitest';
import { generateDXF, mapHexToDxfColor, dxfText } from '../cad/dxf/DxfGenerator';
import { parseDXF } from '../cad/dxf/DxfParser';
import { generateGcode } from '../cad/export/GcodeGenerator';
import { generateSVG } from '../cad/export/SvgGenerator';
import { explodeEntity } from '../cad/kernel/explode';
import {
    createCircleEntity, createFastenerEntity, createGearEntity, createHatchEntity, createLineEntity,
    createRectangleEntity, createSplineEntity, createTextEntity, type CadEntity, type Layer,
} from '../cad/kernel/types';

/** DXF text → [code, value] pairs */
function pairs(dxf: string): Array<[number, string]> {
    const lines = dxf.split(/\r?\n/);
    const out: Array<[number, string]> = [];
    for (let i = 0; i + 1 < lines.length; i += 2) out.push([parseInt(lines[i], 10), lines[i + 1]]);
    return out;
}

const LAYERS: Layer[] = [
    { id: 'layer-0', name: '0', color: '#ffffff', visible: true, locked: false, frozen: false, lineType: 'CONTINUOUS', lineWeight: 1 },
    { id: 'l-cut', name: 'CUT', color: '#ff0000', visible: true, locked: false, frozen: false, lineType: 'CONTINUOUS', lineWeight: 1 },
    { id: 'l-off', name: 'Notlar/Ölçü', color: '#00ff00', visible: false, locked: true, frozen: false, lineType: 'CENTER', lineWeight: 1 },
];

describe('DXF writer — R2000 structure', () => {
    const ents: CadEntity[] = [
        createLineEntity({ x: 0, y: 0 }, { x: 100, y: 0 }, 'l-cut', '#ff0000'),
        createGearEntity({ x: 200, y: 0 }, 2, 20, 'l-cut', '#ff0000'),
        createSplineEntity([{ x: 0, y: 50 }, { x: 50, y: 90 }, { x: 100, y: 50 }], false, 'layer-0', '#ffffff'),
        createHatchEntity([{ x: 0, y: 100 }, { x: 50, y: 100 }, { x: 50, y: 150 }, { x: 0, y: 150 }], 'ANSI31', 'layer-0', '#ffffff'),
        createTextEntity({ x: 0, y: 200 }, 'Ø20 Çelik', 5, 'l-off', '#00ff00'),
    ];
    const dxf = generateDXF(ents, LAYERS, { version: 'AC1015' });
    const p = pairs(dxf);

    it('has every section, table and object AutoCAD needs for R13+ files', () => {
        const sections = p.filter(([c], i) => c === 2 && p[i - 1]?.[1] === 'SECTION').map(([, v]) => v);
        expect(sections).toEqual(['HEADER', 'CLASSES', 'TABLES', 'BLOCKS', 'ENTITIES', 'OBJECTS']);
        const tables = p.filter(([c], i) => c === 2 && p[i - 1]?.[1] === 'TABLE').map(([, v]) => v);
        expect(tables).toEqual(['VPORT', 'LTYPE', 'LAYER', 'STYLE', 'VIEW', 'UCS', 'APPID', 'DIMSTYLE', 'BLOCK_RECORD']);
        const blocks = p.filter(([c], i) => c === 2 && p[i - 1]?.[1] === 'AcDbBlockBegin').map(([, v]) => v);
        expect(blocks).toEqual(expect.arrayContaining(['*Model_Space', '*Paper_Space']));
        expect(dxf).toContain('ACAD_GROUP');
        expect(dxf.endsWith('EOF\r\n')).toBe(true);
    });

    it('gives every object a unique handle below $HANDSEED', () => {
        const seedIdx = p.findIndex(([c, v]) => c === 9 && v === '$HANDSEED');
        const seed = parseInt(p[seedIdx + 1][1], 16);
        const handles = p.filter(([c], i) => (c === 5 || c === 105) && i !== seedIdx + 1).map(([, v]) => parseInt(v, 16));
        expect(new Set(handles).size).toBe(handles.length);
        expect(Math.max(...handles)).toBeLessThan(seed);
    });

    it('writes exact curves and layer states', () => {
        expect(dxf).toContain('\r\nLWPOLYLINE\r\n');
        expect(dxf).toContain('\r\nSPLINE\r\n');
        expect(dxf).toContain('\r\nHATCH\r\n');
        // the gear pitch circle is a centre line on the CENTER layer
        expect(dxf).toMatch(/\r\nLAYER\r\n[\s\S]*?\r\n2\r\nCENTER\r\n/);
        // layer that is off → negative colour, locked → flag 4, non-ASCII escaped
        expect(dxf).toContain('Notlar_\\U+00D6l\\U+00E7\\U+00FC');
        expect(dxf).toMatch(/\r\n70\r\n4\r\n62\r\n-3\r\n/);
        // text: Ø as %%c, Ç as \U+00C7
        expect(dxf).toContain('%%c20 \\U+00C7elik');
    });

    it('round-trips through the importer', () => {
        const back = parseDXF(dxf);
        const types = new Set(back.entities.map((e) => e.geometry.type));
        expect(types.has('LINE')).toBe(true);
        expect(types.has('POLYLINE')).toBe(true);
        expect(types.has('TEXT')).toBe(true);
        const text = back.entities.find((e) => e.geometry.type === 'TEXT')!.geometry as { content: string; position: { x: number; y: number } };
        expect(text.content).toBe('Ø20 Çelik');
        expect(text.position.y).toBeCloseTo(200, 6);
        expect(back.layers.map((l) => l.name)).toEqual(expect.arrayContaining(['CUT', 'Notlar_Ölçü']));
    });
});

describe('DXF writer — R12, units and CAM mode', () => {
    const ents: CadEntity[] = [
        createRectangleEntity({ x: 0, y: 0 }, 100, 50, 'l-cut', '#ff0000'),
        createCircleEntity({ x: 0, y: 0 }, 10, 'l-cut', '#ff0000'),
        createGearEntity({ x: 200, y: 0 }, 2, 20, 'l-cut', '#ff0000'),
        createTextEntity({ x: 0, y: 40 }, 'PART-1', 5, 'layer-0', '#ffffff'),
        createFastenerEntity({ x: 400, y: 0 }, 'BOLT', 10, 40, 1.5, 'layer-0', '#ffffff'),
    ];

    it('R12 uses only R12 entities and no handles', () => {
        const dxf = generateDXF(ents, LAYERS, { version: 'AC1009' });
        expect(dxf).toContain('AC1009');
        expect(dxf).not.toContain('LWPOLYLINE');
        expect(dxf).not.toContain('AcDbEntity');
        expect(dxf).toContain('\r\nPOLYLINE\r\n');
        expect(dxf).toContain('\r\nVERTEX\r\n');
        expect(dxf).toContain('\r\nSEQEND\r\n');
        expect(pairs(dxf).some(([c]) => c === 5)).toBe(false);
    });

    it('converts lengths for inch files', () => {
        const dxf = generateDXF([createCircleEntity({ x: 25.4, y: 0 }, 12.7, 'layer-0', '#fff')], [], { units: 'inch' });
        const p = pairs(dxf);
        const i = p.findIndex(([c, v]) => c === 0 && v === 'CIRCLE');
        const after = p.slice(i);
        expect(parseFloat(after.find(([c]) => c === 10)![1])).toBeCloseTo(1, 9);
        expect(parseFloat(after.find(([c]) => c === 40)![1])).toBeCloseTo(0.5, 9);
        expect(dxf).toMatch(/\$INSUNITS\r\n70\r\n1\r\n/);
    });

    it('CAM profile mode keeps only cutting geometry', () => {
        const dxf = generateDXF(ents, LAYERS, { version: 'AC1009', camProfileOnly: true });
        expect(dxf).not.toContain('\r\nTEXT\r\n');
        expect(dxf).not.toMatch(/\r\n8\r\nCENTER\r\n/); // no pitch circle / bolt axis
        expect(dxf).toContain('\r\nCIRCLE\r\n');
    });
});

describe('colour and text encoding', () => {
    it('maps colours to the nearest ACI', () => {
        expect(mapHexToDxfColor('#ff0000')).toBe(1);
        expect(mapHexToDxfColor('#ffffff')).toBe(7);
        expect(mapHexToDxfColor('#1d232b')).toBe(7);
        expect(mapHexToDxfColor('#0000ff')).toBe(5);
        expect(mapHexToDxfColor('#808080')).toBe(8);
    });

    it('uses AutoCAD control codes and unicode escapes', () => {
        expect(dxfText('Ø10 ±0.1 45°')).toBe('%%c10 %%p0.1 45%%d');
        expect(dxfText('şğı')).toBe('\\U+015F\\U+011F\\U+0131');
    });
});

describe('G-code', () => {
    it('cuts holes before the outer contour with exact arcs', () => {
        const plate = createRectangleEntity({ x: 0, y: 0 }, 100, 60, 'layer-0', '#fff');
        const hole = createCircleEntity({ x: 20, y: 0 }, 5, 'layer-0', '#fff');
        const res = generateGcode([plate, hole], { cutDepth: -1, stepDown: 1 });
        const lines = res.gcode.split('\n');
        const firstArc = lines.findIndex((l) => l.startsWith('G03'));
        const firstLine = lines.findIndex((l) => /^G01 X/.test(l));
        expect(firstArc).toBeGreaterThan(-1);
        expect(firstArc).toBeLessThan(firstLine);
        expect(res.totalPaths).toBe(2);
        expect(res.totalCutDistanceMm).toBe(Math.round(320 + 2 * Math.PI * 5));
    });

    it('does not cut reference lines, text or hidden layers', () => {
        const gear = createGearEntity({ x: 0, y: 0 }, 2, 20, 'layer-0', '#fff');
        const note = createTextEntity({ x: 0, y: 40 }, 'X', 5, 'layer-0', '#fff');
        const hidden = createLineEntity({ x: 0, y: 0 }, { x: 10, y: 0 }, 'l-off', '#fff');
        const res = generateGcode([gear, note, hidden], { layers: LAYERS });
        expect(res.totalPaths).toBe(1); // the involute outline only
    });
});

describe('EXPLODE and SVG', () => {
    it('explodes a gear into its outline and a pitch circle on the CENTER layer', () => {
        const gear = createGearEntity({ x: 0, y: 0 }, 2, 20, 'layer-0', '#fff');
        const res = explodeEntity(gear)!;
        expect(res.layersNeeded.has('center')).toBe(true);
        const circle = res.entities.find((e) => e.geometry.type === 'CIRCLE')!;
        expect(circle.layerId).toBe('layer-ref-center');
        expect(res.entities.filter((e) => e.geometry.type === 'LINE').length).toBeGreaterThan(100);
        expect(explodeEntity(createCircleEntity({ x: 0, y: 0 }, 5, 'layer-0', '#fff'))).toBeNull();
    });

    it('writes SVG for every entity type without skipping parametric ones', () => {
        const svg = generateSVG([createGearEntity({ x: 0, y: 0 }, 2, 20, 'layer-0', '#fff')], LAYERS);
        expect(svg).toContain('stroke-dasharray'); // pitch circle as a centre line
        expect(svg).toContain('<path');
    });
});
