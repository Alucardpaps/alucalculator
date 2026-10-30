/**
 * Assemble closed 2D contours from AluCAD entities.
 *
 * Used by CrossSectionTool (Shoelace/Green), the 2D→3D extrusion bridge,
 * and T-slot insertion. LINE/ARC chains are stitched analytically.
 * Preserves parametric ProfileLoop alongside tessellation point caches.
 */

import { CadEntity, Point } from '../kernel/types';
import { polygonVertices } from '../kernel/shapes';
import {
    Point2,
    computeSectionProperties,
    ensureWinding,
    pointDist,
    PolygonSectionProperties,
    sampleArc,
    sampleCircle,
    sanitizePolygon,
    shoelaceArea,
} from './sectionProperties';
import {
    ProfileEdge,
    ProfileLoop,
    ParametricRegion,
    circleLoop,
    rectangleLoop,
    pointsToProfileLoop,
    sampleLoop,
    stitchProfileEdges,
} from './profileLoop';

export interface ClosedContour {
    points: Point2[];
    area: number;
    source: 'polyline' | 'rectangle' | 'hexagon' | 'circle' | 'stitched';
    loop?: ProfileLoop;
}

export interface AssembledRegion {
    outer: ClosedContour;
    holes: ClosedContour[];
    section: PolygonSectionProperties;
    parametricRegion?: ParametricRegion;
}

const STITCH_TOL = 0.05; // mm

function rectangleVertices(center: Point, width: number, height: number, rotation = 0): Point2[] {
    const hw = width / 2;
    const hh = height / 2;
    const local: Point2[] = [
        { x: -hw, y: -hh },
        { x: hw, y: -hh },
        { x: hw, y: hh },
        { x: -hw, y: hh },
    ];
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    return local.map((p) => ({
        x: center.x + p.x * c - p.y * s,
        y: center.y + p.x * s + p.y * c,
    }));
}

function hexagonVertices(center: Point, radius: number, rotation = 0, sides = 6): Point2[] {
    return polygonVertices({ center, radius, rotation, sides });
}

function entityClosedPolygon(entity: CadEntity): ClosedContour | null {
    const g = entity.geometry;
    switch (g.type) {
        case 'POLYLINE': {
            if (!g.vertices || g.vertices.length < 3) return null;
            const pts = sanitizePolygon(g.vertices);
            if (pts.length < 3) return null;
            const closed = g.closed || pointDist(pts[0], pts[pts.length - 1]) < STITCH_TOL;
            if (!closed) return null;
            const clean = ensureWinding(pts, true);
            return {
                points: clean,
                area: shoelaceArea(clean),
                source: 'polyline',
                loop: pointsToProfileLoop(clean, 'ccw'),
            };
        }
        case 'RECTANGLE': {
            const pts = rectangleVertices(g.center, g.width, g.height, g.rotation || 0);
            return {
                points: pts,
                area: Math.abs(g.width * g.height),
                source: 'rectangle',
                loop: rectangleLoop(g.center, g.width, g.height, g.rotation || 0),
            };
        }
        case 'HEXAGON': {
            const pts = hexagonVertices(g.center, g.radius, g.rotation || 0, (g as { sides?: number }).sides);
            return {
                points: pts,
                area: shoelaceArea(pts),
                source: 'hexagon',
                loop: pointsToProfileLoop(pts, 'ccw'),
            };
        }
        case 'CIRCLE': {
            const pts = sampleCircle(g.center.x, g.center.y, g.radius, 72, false);
            return {
                points: pts,
                area: Math.PI * g.radius * g.radius,
                source: 'circle',
                loop: circleLoop(g.center, g.radius, true),
            };
        }
        default:
            return null;
    }
}

function profileEdgesFromEntity(entity: CadEntity): ProfileEdge[] {
    const g = entity.geometry;
    switch (g.type) {
        case 'LINE':
            return [{ kind: 'line', a: { ...g.start }, b: { ...g.end } }];
        case 'ARC':
            return [{
                kind: 'arc',
                center: { ...g.center },
                radius: g.radius,
                a0: g.startAngle,
                a1: g.endAngle,
                ccw: g.ccw ?? true,
            }];
        case 'POLYLINE': {
            if (g.closed) return [];
            if (!g.vertices || g.vertices.length < 2) return [];
            const edges: ProfileEdge[] = [];
            for (let i = 0; i < g.vertices.length - 1; i++) {
                edges.push({
                    kind: 'line',
                    a: { ...g.vertices[i] },
                    b: { ...g.vertices[i + 1] },
                });
            }
            return edges;
        }
        default:
            return [];
    }
}

function stitchEdgesToContours(rawEdges: ProfileEdge[]): ClosedContour[] {
    const loops = stitchProfileEdges(rawEdges, STITCH_TOL);
    const contours: ClosedContour[] = [];

    for (const loop of loops) {
        const pts = sampleLoop(loop, 16);
        const clean = sanitizePolygon(pts, STITCH_TOL);
        if (clean.length >= 3) {
            const oriented = ensureWinding(clean, loop.winding === 'ccw');
            contours.push({
                points: oriented,
                area: Math.abs(shoelaceArea(oriented)),
                source: 'stitched',
                loop,
            });
        }
    }

    return contours;
}

function pointInPolygon(pt: Point2, poly: Point2[]): boolean {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].x, yi = poly[i].y;
        const xj = poly[j].x, yj = poly[j].y;
        const intersect = (yi > pt.y) !== (yj > pt.y)
            && pt.x < ((xj - xi) * (pt.y - yi)) / ((yj - yi) || 1e-30) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

function classifyRegions(contours: ClosedContour[]): AssembledRegion[] {
    const sorted = contours
        .filter((c) => c.points.length >= 3 && c.area > 1e-6)
        .sort((a, b) => b.area - a.area);

    const used = new Set<number>();
    const regions: AssembledRegion[] = [];

    for (let i = 0; i < sorted.length; i++) {
        if (used.has(i)) continue;
        const outer = sorted[i];
        const holes: ClosedContour[] = [];
        for (let j = i + 1; j < sorted.length; j++) {
            if (used.has(j)) continue;
            const cand = sorted[j];
            if (cand.area >= outer.area * 0.999) continue;
            const test = cand.points[0];
            if (pointInPolygon(test, outer.points)) {
                // Skip if contained in an already-claimed hole (nested)
                const inExistingHole = holes.some((h) => pointInPolygon(test, h.points));
                if (inExistingHole) continue;
                holes.push(cand);
                used.add(j);
            }
        }
        used.add(i);
        const holePts = holes.map((h) => ensureWinding(h.points, false));
        const section = computeSectionProperties(outer.points, holePts);

        const outerLoop: ProfileLoop = outer.loop || pointsToProfileLoop(outer.points, 'ccw');
        const holeLoops: ProfileLoop[] = holes.map(
            (h) => h.loop || pointsToProfileLoop(h.points, 'cw')
        );

        const parametricRegion: ParametricRegion = {
            outer: outerLoop,
            holes: holeLoops,
            tessellation: {
                outer: outer.points,
                holes: holePts,
            },
        };

        regions.push({ outer, holes, section, parametricRegion });
    }
    return regions;
}

export function extractClosedContours(entities: CadEntity[]): ClosedContour[] {
    const closed: ClosedContour[] = [];
    const openEdges: ProfileEdge[] = [];

    for (const e of entities) {
        if (!e || e.isVisible === false) continue;
        const c = entityClosedPolygon(e);
        if (c) {
            closed.push(c);
            continue;
        }
        openEdges.push(...profileEdgesFromEntity(e));
    }
    if (openEdges.length > 0) {
        closed.push(...stitchEdgesToContours(openEdges));
    }
    return closed;
}

export function assembleRegions(entities: CadEntity[]): AssembledRegion[] {
    return classifyRegions(extractClosedContours(entities));
}

export function largestRegion(entities: CadEntity[]): AssembledRegion | null {
    const regions = assembleRegions(entities);
    if (regions.length === 0) return null;
    return regions.reduce((best, r) => (r.section.area > best.section.area ? r : best), regions[0]);
}

export function regionToExtrusionProfile(region: AssembledRegion): {
    outer: Point2[];
    holes: Point2[][];
    section: PolygonSectionProperties;
    parametricRegion?: ParametricRegion;
} {
    return {
        outer: ensureWinding(region.outer.points, true),
        holes: region.holes.map((h) => ensureWinding(h.points, false)),
        section: region.section,
        parametricRegion: region.parametricRegion,
    };
}
