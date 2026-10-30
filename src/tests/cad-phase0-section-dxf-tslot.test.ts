import { describe, expect, it } from 'vitest';
import {
    computeSectionProperties,
    shoelaceArea,
    circleSectionProperties,
    ensureWinding,
} from '../cad/geometry/sectionProperties';
import { largestRegion } from '../cad/geometry/contourAssembler';
import { parseDXF } from '../cad/dxf/DxfParser';
import { generateDXF } from '../cad/dxf/DxfGenerator';
import { createLineEntity, createCircleEntity, createRectangleEntity, CadEntity } from '../cad/kernel/types';
import { DEFAULT_LAYER } from '../cad/kernel/constants';
import { Transformer } from '../cad/kernel/Transformer';
import { buildTSlotSection, getTSlotSpec, TSLOT_CATALOG, tSlotMassKg } from '../cad/catalog/tSlotProfiles';
import { buildAssemblyBom } from '../design-studio/bom';
import type { DesignPart } from '../design-studio/designStore';

function square(size: number, cx = 0, cy = 0) {
    const h = size / 2;
    return [
        { x: cx - h, y: cy - h },
        { x: cx + h, y: cy - h },
        { x: cx + h, y: cy + h },
        { x: cx - h, y: cy + h },
    ];
}

describe('Shoelace / Green section properties', () => {
    it('computes area of a 10×10 square as 100 mm²', () => {
        const s = computeSectionProperties(square(10));
        expect(s.area).toBeCloseTo(100, 6);
        expect(s.cx).toBeCloseTo(0, 6);
        expect(s.cy).toBeCloseTo(0, 6);
    });

    it('computes Ix = bh³/12 for a 40×20 rectangle', () => {
        const pts = [
            { x: 0, y: 0 },
            { x: 40, y: 0 },
            { x: 40, y: 20 },
            { x: 0, y: 20 },
        ];
        const s = computeSectionProperties(pts);
        expect(s.area).toBeCloseTo(800, 6);
        expect(s.cx).toBeCloseTo(20, 6);
        expect(s.cy).toBeCloseTo(10, 6);
        // I about centroid: b h^3 / 12 = 40 * 8000 / 12
        expect(s.Ix).toBeCloseTo((40 * 20 ** 3) / 12, 3);
        expect(s.Iy).toBeCloseTo((20 * 40 ** 3) / 12, 3);
    });

    it('matches exact circle formulas', () => {
        const exact = circleSectionProperties(0, 0, 10);
        expect(exact.area).toBeCloseTo(Math.PI * 100, 8);
        expect(exact.Ix).toBeCloseTo((Math.PI * 10000) / 4, 6);
    });

    it('subtracts a hole from the outer area', () => {
        const outer = square(40);
        const hole = ensureWinding(square(10), false);
        const s = computeSectionProperties(outer, [hole]);
        expect(s.area).toBeCloseTo(1600 - 100, 4);
    });

    it('shoelaceArea is winding-insensitive', () => {
        const ccw = square(10);
        expect(shoelaceArea(ccw)).toBeCloseTo(shoelaceArea(ccw.slice().reverse()), 9);
    });
});

describe('Closed contour assembler', () => {
    it('reads a RECTANGLE entity as a closed contour', () => {
        const ent = createRectangleEntity({ x: 0, y: 0 }, 40, 20, 'layer-0', '#fff');
        const region = largestRegion([ent]);
        expect(region).not.toBeNull();
        expect(region!.section.area).toBeCloseTo(800, 4);
    });

    it('stitches four LINE entities into a closed square', () => {
        const L = 'layer-0';
        const lines: CadEntity[] = [
            createLineEntity({ x: 0, y: 0 }, { x: 10, y: 0 }, L, '#fff'),
            createLineEntity({ x: 10, y: 0 }, { x: 10, y: 10 }, L, '#fff'),
            createLineEntity({ x: 10, y: 10 }, { x: 0, y: 10 }, L, '#fff'),
            createLineEntity({ x: 0, y: 10 }, { x: 0, y: 0 }, L, '#fff'),
        ];
        const region = largestRegion(lines);
        expect(region).not.toBeNull();
        expect(region!.section.area).toBeCloseTo(100, 4);
        expect(region!.outer.source).toBe('stitched');
    });

    it('stitches unordered LINE segments from both ends', () => {
        const L = 'layer-0';
        const lines: CadEntity[] = [
            createLineEntity({ x: 10, y: 10 }, { x: 0, y: 10 }, L, '#fff'),
            createLineEntity({ x: 0, y: 0 }, { x: 10, y: 0 }, L, '#fff'),
            createLineEntity({ x: 0, y: 10 }, { x: 0, y: 0 }, L, '#fff'),
            createLineEntity({ x: 10, y: 0 }, { x: 10, y: 10 }, L, '#fff'),
        ];
        const region = largestRegion(lines);
        expect(region).not.toBeNull();
        expect(region!.section.area).toBeCloseTo(100, 4);
    });

    it('treats a circle inside a square as a hole', () => {
        const outer = createRectangleEntity({ x: 0, y: 0 }, 40, 40, 'layer-0', '#fff');
        const hole = createCircleEntity({ x: 0, y: 0 }, 5, 'layer-0', '#fff');
        const region = largestRegion([outer, hole]);
        expect(region).not.toBeNull();
        expect(region!.holes.length).toBe(1);
        expect(region!.section.area).toBeCloseTo(1600 - Math.PI * 25, 0);
    });
});

describe('DXF import', () => {
    it('parses LINE, CIRCLE and closed LWPOLYLINE', () => {
        const N = '\r\n';
        const dxf = [
            '0', 'SECTION', '2', 'HEADER',
            '9', '$INSUNITS', '70', '4',
            '0', 'ENDSEC',
            '0', 'SECTION', '2', 'ENTITIES',
            '0', 'LINE', '8', '0', '10', '0', '20', '0', '11', '10', '21', '0',
            '0', 'CIRCLE', '8', '0', '10', '5', '20', '5', '40', '2.5',
            '0', 'LWPOLYLINE', '8', '0', '90', '4', '70', '1',
            '10', '0', '20', '0',
            '10', '20', '20', '0',
            '10', '20', '20', '10',
            '10', '0', '20', '10',
            '0', 'ENDSEC',
            '0', 'EOF',
        ].join(N);

        const result = parseDXF(dxf);
        expect(result.entities.length).toBe(3);
        expect(result.entities.map((e) => e.geometry.type).sort()).toEqual(['CIRCLE', 'LINE', 'POLYLINE']);
        const pline = result.entities.find((e) => e.geometry.type === 'POLYLINE');
        expect(pline?.geometry.type === 'POLYLINE' && pline.geometry.closed).toBe(true);
        expect(pline?.geometry.type === 'POLYLINE' && pline.geometry.vertices.length).toBe(4);
    });

    it('round-trips a generated LINE+CIRCLE DXF', () => {
        const ents = [
            createLineEntity({ x: 1, y: 2 }, { x: 3, y: 4 }, 'layer-0', '#ffffff'),
            createCircleEntity({ x: 0, y: 0 }, 12, 'layer-0', '#ffffff'),
        ];
        const dxf = generateDXF(ents, [DEFAULT_LAYER]);
        const parsed = parseDXF(dxf);
        expect(parsed.entities.length).toBe(2);
        const line = parsed.entities.find((e) => e.geometry.type === 'LINE');
        const circ = parsed.entities.find((e) => e.geometry.type === 'CIRCLE');
        expect(line?.geometry.type === 'LINE' && line.geometry.start.x).toBeCloseTo(1);
        expect(circ?.geometry.type === 'CIRCLE' && circ.geometry.radius).toBeCloseTo(12);
    });
});

describe('SCALE transformer', () => {
    it('scales a circle radius and center about a base point', () => {
        const c = createCircleEntity({ x: 10, y: 0 }, 5, 'layer-0', '#fff');
        const scaled = Transformer.scale(c, { x: 0, y: 0 }, 2);
        expect(scaled.geometry.type).toBe('CIRCLE');
        if (scaled.geometry.type === 'CIRCLE') {
            expect(scaled.geometry.center.x).toBeCloseTo(20);
            expect(scaled.geometry.radius).toBeCloseTo(10);
        }
    });
});

describe('T-Slot catalog', () => {
    it('exposes full 20, 30, 40, 45, 50, 60, 80 industrial series', () => {
        const series = Array.from(new Set(TSLOT_CATALOG.map((s) => s.series)));
        expect(series).toEqual([20, 30, 40, 45, 50, 60, 80]);
        expect(TSLOT_CATALOG.length).toBeGreaterThanOrEqual(25);
    });

    it.each(TSLOT_CATALOG)('builds a closed $id ($width×$height) section with valid geometry and zero self-intersections', (spec) => {
        const geom = buildTSlotSection(spec);
        expect(geom.outer.length).toBeGreaterThan(20);
        expect(geom.holes.length).toBe(spec.slotsX * spec.slotsY);
        expect(geom.section.area).toBeGreaterThan(spec.width * spec.height * 0.20);
        expect(geom.section.area).toBeLessThan(spec.width * spec.height * 0.85);
        expect(geom.section.Ix).toBeGreaterThan(0);
        expect(geom.section.Iy).toBeGreaterThan(0);
        expect(Math.abs(geom.section.cx)).toBeLessThan(0.6);
        expect(Math.abs(geom.section.cy)).toBeLessThan(0.6);

        // Assert strictly zero self-intersections (prevents detached corner islands in 2D CAD & 3D Extrude)
        const pts = geom.outer;
        const n = pts.length;
        let intersections = 0;
        const ccw = (A: { x: number; y: number }, B: { x: number; y: number }, C: { x: number; y: number }) =>
            (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
        const doIntersect = (p1: any, q1: any, p2: any, q2: any) =>
            ccw(p1, p2, q2) !== ccw(q1, p2, q2) && ccw(p1, q1, p2) !== ccw(p1, q1, q2);

        for (let i = 0; i < n; i++) {
            const p1 = pts[i];
            const q1 = pts[(i + 1) % n];
            for (let j = i + 2; j < n; j++) {
                if (i === 0 && j === n - 1) continue;
                const p2 = pts[j];
                const q2 = pts[(j + 1) % n];
                if (doIntersect(p1, q1, p2, q2)) {
                    intersections++;
                }
            }
        }
        expect(intersections).toBe(0);
    });

    it('generates exact multi-bore holes for rectangular profiles', () => {
        const spec2040 = getTSlotSpec('2040');
        const geom2040 = buildTSlotSection(spec2040);
        expect(geom2040.holes.length).toBe(2);

        const spec4080 = getTSlotSpec('4080');
        const geom4080 = buildTSlotSection(spec4080);
        expect(geom4080.holes.length).toBe(2);

        const spec80160 = getTSlotSpec('80160');
        const geom80160 = buildTSlotSection(spec80160);
        expect(geom80160.holes.length).toBe(8);
    });

    it('catalog mass for 1 m of 40×40 is 1.75 kg and 40×80 is 3.25 kg', () => {
        const spec4040 = getTSlotSpec('4040');
        expect(tSlotMassKg(spec4040, 1000)).toBeCloseTo(1.75, 5);

        const spec4080 = getTSlotSpec('4080');
        expect(tSlotMassKg(spec4080, 1000)).toBeCloseTo(3.25, 5);
    });

    it('BOM groups identical T-slot lengths', () => {
        const spec = getTSlotSpec(40);
        const geom = buildTSlotSection(spec);
        const mk = (id: string): DesignPart => ({
            id,
            kind: 't-slot',
            name: spec.name,
            color: '#38bdf8',
            visible: true,
            locked: false,
            parentId: null,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            params: { series: 40, width: 40, height: 40, length: 500, extrudeDepth: 500, slot: 8, bore: 8 },
            outer: geom.outer,
            inner: geom.holes,
            solidOp: 'extrude',
            materialId: 'al-6061-t6',
        });
        const bom = buildAssemblyBom([mk('a'), mk('b')]);
        expect(bom.lines.length).toBe(1);
        expect(bom.lines[0].qty).toBe(2);
        expect(bom.tSlotMeters).toBeCloseTo(1.0, 5);
        expect(bom.totalMassKg).toBeCloseTo(1.75, 3);
    });
});
