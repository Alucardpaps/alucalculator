import { describe, expect, it } from 'vitest';
import {
    createBeltPulleyEntity,
    createFastenerEntity,
    createGearEntity,
    createHatchEntity,
    createPlanetaryGearEntity,
    createSplineEntity,
    createSprocketEntity,
    type CadEntity,
} from '../cad/kernel/types';
import { entityPrimitives, distanceToPrimitives, primitivesInBox, primitiveBounds, geometryPrimitives } from '../cad/kernel/primitives';
import { polygonVertices, rectangleCorners, splinePoints, splineSegments } from '../cad/kernel/shapes';
import { hatchSegments, worldPatternLines } from '../cad/kernel/hatchPatterns';
import { recordDrawing } from '../cad/render/recordingContext';
import { distanceToEntity, isEntityInsideBox, isEntityIntersectingBox } from '../cad/geometry/GeometryUtils';

const kinds = (e: CadEntity) => entityPrimitives(e).map((p) => `${p.kind}:${p.style}`);

describe('shared 2D shapes', () => {
    it('rotates rectangles counter-clockwise about their centre', () => {
        const c = rectangleCorners({ center: { x: 0, y: 0 }, width: 20, height: 10, rotation: Math.PI / 2 });
        // local bottom-left (−10, −5) rotated +90° → (5, −10)
        expect(c[0].x).toBeCloseTo(5, 9);
        expect(c[0].y).toBeCloseTo(-10, 9);
    });

    it('builds N-sided polygons (HEXAGON entity with sides)', () => {
        const v = polygonVertices({ center: { x: 0, y: 0 }, radius: 10, sides: 5, rotation: Math.PI / 2 });
        expect(v).toHaveLength(5);
        expect(v[0].x).toBeCloseTo(0, 9);
        expect(v[0].y).toBeCloseTo(10, 9);
        expect(polygonVertices({ center: { x: 0, y: 0 }, radius: 1 })).toHaveLength(6);
    });

    it('passes the spline through every picked point', () => {
        const pts = [{ x: 0, y: 0 }, { x: 30, y: 40 }, { x: 70, y: -10 }, { x: 100, y: 30 }];
        const segs = splineSegments(pts, false);
        expect(segs).toHaveLength(3);
        segs.forEach((s, i) => {
            expect(s.p0).toEqual(pts[i]);
            expect(s.p1).toEqual(pts[i + 1]);
        });
        const curve = splinePoints(pts, false, 0.01);
        for (const p of pts) {
            const d = Math.min(...curve.map((q) => Math.hypot(q.x - p.x, q.y - p.y)));
            expect(d).toBeLessThan(1e-9);
        }
        const closed = splineSegments(pts, true);
        expect(closed).toHaveLength(4);
        expect(closed[3].p1).toEqual(pts[0]);
    });
});

describe('canvas recording → primitives', () => {
    it('records arcs, ellipses and transforms in world coordinates', () => {
        const prims = recordDrawing((ctx, w2s) => {
            const c = w2s({ x: 10, y: 20 });
            ctx.beginPath();
            ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            // world CCW quarter from 0° to 90° drawn the way the renderer does it
            ctx.arc(c.x, c.y, 8, -0, -Math.PI / 2, true);
            ctx.stroke();
        });
        expect(prims[0]).toMatchObject({ kind: 'circle', r: 5, c: { x: 10, y: 20 } });
        expect(prims[1].kind).toBe('arc');
        if (prims[1].kind === 'arc') {
            expect(prims[1].start).toBeCloseTo(0, 9);
            expect(prims[1].end).toBeCloseTo(Math.PI / 2, 9);
        }
    });

    it('decomposes a gear into its involute outline and a centre-line pitch circle', () => {
        const gear = createGearEntity({ x: 0, y: 0 }, 2, 20, 'layer-0', '#fff');
        const prims = entityPrimitives(gear);
        expect(prims[0]).toMatchObject({ kind: 'polyline', closed: true, style: 'continuous' });
        const pitch = prims.find((p) => p.kind === 'circle');
        expect(pitch).toMatchObject({ style: 'center', r: 20 });
        const b = primitiveBounds(prims)!;
        expect(b.maxX).toBeCloseTo(22, 0); // tip radius m(z+2)/2
    });

    it('decomposes sprocket, planetary set, belt drive and fasteners', () => {
        expect(kinds(createSprocketEntity({ x: 0, y: 0 }, 18, 12.7, 8.51, 20, 'layer-0', '#fff'))).toEqual([
            'polyline:continuous', 'circle:center', 'circle:continuous',
        ]);
        const planet = entityPrimitives(createPlanetaryGearEntity({ x: 0, y: 0 }, 2, 20, 16, 'layer-0', '#fff'));
        expect(planet.filter((p) => p.kind === 'polyline').length).toBe(1 + 3 + 2); // sun, 3 planets, ring teeth + rim
        expect(kinds(createBeltPulleyEntity({ x: 0, y: 0 }, 40, { x: 200, y: 0 }, 25, 'layer-0', '#fff'))).toEqual([
            'circle:continuous', 'circle:continuous', 'line:dashed', 'line:dashed',
        ]);
        const bolt = kinds(createFastenerEntity({ x: 0, y: 0 }, 'BOLT', 10, 40, 1.5, 'layer-0', '#fff'));
        expect(bolt[0]).toBe('line:center');
        expect(bolt).toContain('line:thin');
        const nutTop = kinds(createFastenerEntity({ x: 0, y: 0 }, 'NUT', 10, 0, 1.5, 'layer-0', '#fff', 0, 'TOP'));
        expect(nutTop.slice(0, 3)).toEqual(['polyline:continuous', 'circle:continuous', 'arc:thin']);
    });
});

describe('hatch patterns', () => {
    const square = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }];

    it('spaces ANSI31 lines 3.175 mm × scale apart at the stored angle', () => {
        const fam = worldPatternLines('ANSI31', 2, 45)[0];
        expect(fam.angle).toBe(45);
        expect(Math.hypot(fam.offset.x, fam.offset.y)).toBeCloseTo(6.35, 9);
        const { segments } = hatchSegments([square], 'ANSI31', 2, 45);
        for (const [a, b] of segments) {
            expect(Math.atan2(b.y - a.y, b.x - a.x)).toBeCloseTo(Math.PI / 4, 9);
            for (const p of [a, b]) {
                expect(p.x).toBeGreaterThanOrEqual(-1e-9);
                expect(p.x).toBeLessThanOrEqual(100 + 1e-9);
            }
        }
        // diagonal 141.4 mm / 6.35 mm ≈ 22 lines
        expect(segments.length).toBeGreaterThan(20);
        expect(segments.length).toBeLessThan(25);
    });

    it('CROSS hatches in two perpendicular families and leaves holes empty', () => {
        const hole = [{ x: 40, y: 40 }, { x: 60, y: 40 }, { x: 60, y: 60 }, { x: 40, y: 60 }];
        const { segments } = hatchSegments([square, hole], 'CROSS', 1, 45);
        const angles = new Set(segments.map(([a, b]) => Math.round((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI)));
        expect([...angles].sort((a, b) => a - b)).toEqual([45, 135]);
        for (const [a, b] of segments) {
            const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
            expect(m.x > 40 && m.x < 60 && m.y > 40 && m.y < 60).toBe(false);
        }
    });

    it('hatch entities pick inside their area and expose the boundary', () => {
        const h = createHatchEntity(square, 'ANSI31', 'layer-0', '#fff');
        expect(distanceToEntity({ x: 50, y: 50 }, h)).toBe(0);
        expect(geometryPrimitives(h.geometry).some((p) => p.kind === 'polyline')).toBe(true);
    });
});

describe('hit testing and window selection use the drawn shape', () => {
    it('rotated rectangles, polygons, ellipses and splines', () => {
        const rect: CadEntity = { id: 'r', layerId: 'layer-0', color: '#fff', isVisible: true, isSelected: false, geometry: { type: 'RECTANGLE', center: { x: 0, y: 0 }, width: 100, height: 10, rotation: Math.PI / 2 } };
        // after a 90° rotation the long side is vertical: (5, 30) lies on it
        expect(distanceToEntity({ x: 5, y: 30 }, rect)).toBeLessThan(1e-9);
        const ell: CadEntity = { id: 'e', layerId: 'layer-0', color: '#fff', isVisible: true, isSelected: false, geometry: { type: 'ELLIPSE', center: { x: 0, y: 0 }, radiusX: 50, radiusY: 10 } };
        expect(distanceToEntity({ x: 0, y: 10 }, ell)).toBeLessThan(0.05);
        expect(distanceToEntity({ x: 50, y: 0 }, ell)).toBeLessThan(0.05);
        const spl = createSplineEntity([{ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 0 }], false, 'layer-0', '#fff');
        expect(distanceToEntity({ x: 50, y: 50 }, spl)).toBeLessThan(1e-6);

        const box = { minX: -60, minY: -60, maxX: 60, maxY: 60 };
        expect(isEntityInsideBox(ell, box)).toBe(true);
        expect(isEntityInsideBox(ell, { minX: -40, minY: -60, maxX: 60, maxY: 60 })).toBe(false);
        expect(isEntityIntersectingBox(ell, { minX: -40, minY: -60, maxX: 60, maxY: 60 })).toBe(true);
        // crossing box fully inside the ellipse's hole touches nothing
        expect(isEntityIntersectingBox(ell, { minX: -5, minY: -2, maxX: 5, maxY: 2 })).toBe(false);
    });

    it('measures distance to gear teeth, not to the pitch circle only', () => {
        const gear = createGearEntity({ x: 0, y: 0 }, 2, 20, 'layer-0', '#fff');
        const prims = entityPrimitives(gear);
        expect(distanceToPrimitives({ x: 0, y: 0 }, prims)).toBeGreaterThan(15);
        expect(primitivesInBox(prims, { minX: -30, minY: -30, maxX: 30, maxY: 30 }, 'window')).toBe(true);
    });
});
