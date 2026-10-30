/**
 * 📐 AluCAD — Universal Geometry Engine
 * 
 * Provides advanced geometric operations (Trim, Fillet, Chamfer) that work
 * across ALL entity types: Line, Circle, Arc, Rectangle, Polyline.
 * 
 * Architecture: Sits between the raw GeometryKernel math and the Command Tools.
 * Tools call GeometryEngine; GeometryEngine calls GeometryKernel primitives.
 */

import { Point, CadEntity, GeometryType, RectangleGeometry, HexagonGeometry, PolylineGeometry } from './types';
import { polygonVertices } from './shapes';
import { flattenPrimitive, geometryPrimitives, type Primitive } from './primitives';
import { bulgeArc } from '@/lib/dxf/dxfGeometry';
import { distance, intersectLineLine, add, scale, normalize, vector, perpendicular } from './GeometryKernel';
import {
    getEntityIntersections,
    lineCircleIntersection,
    circleCircleIntersection,
    nearestPointOnCircle
} from '../geometry/SnapEngine';

const EPSILON = 0.0001;

// ═══════════════════════════════════════════════════════════════
// UNIVERSAL INTERSECTION FINDER
// ═══════════════════════════════════════════════════════════════

/**
 * Finds all intersection points between two CadEntities.
 * Extends SnapEngine's getEntityIntersections with Arc support.
 */
export function findAllIntersections(e1: CadEntity, e2: CadEntity): Point[] {
    const g1 = e1.geometry;
    const g2 = e2.geometry;

    // Decompose complex shapes to lines/arcs for intersection
    const edges1 = decomposeToEdges(g1);
    const edges2 = decomposeToEdges(g2);

    const intersections: Point[] = [];

    for (const edge1 of edges1) {
        for (const edge2 of edges2) {
            const pts = intersectEdges(edge1, edge2);
            intersections.push(...pts);
        }
    }

    // Deduplicate points that are very close
    return deduplicatePoints(intersections);
}

// ═══════════════════════════════════════════════════════════════
// EDGE DECOMPOSITION
// ═══════════════════════════════════════════════════════════════

export interface LineEdge { kind: 'line'; start: Point; end: Point }
export interface ArcEdge { kind: 'arc'; center: Point; radius: number; startAngle: number; endAngle: number }
export interface CircleEdge { kind: 'circle'; center: Point; radius: number }

export type Edge = LineEdge | ArcEdge | CircleEdge;

/**
 * Finds all intersection points between a line segment (p1->p2) and any CadEntity.
 * Used by fence/trail trimming and cutting checks.
 */
export function findSegmentEntityIntersections(p1: Point, p2: Point, entity: CadEntity): Point[] {
    const edges = decomposeToEdges(entity.geometry);
    const fenceEdge: Edge = { kind: 'line', start: p1, end: p2 };
    const results: Point[] = [];
    for (const edge of edges) {
        const pts = intersectEdges(edge, fenceEdge);
        results.push(...pts);
    }
    return deduplicatePoints(results);
}

/**
 * Decomposes any GeometryType into primitive edges for intersection.
 */
export function decomposeToEdges(geom: GeometryType): Edge[] {
    switch (geom.type) {
        case 'LINE':
            return [{ kind: 'line', start: geom.start, end: geom.end }];

        case 'CIRCLE':
            return [{ kind: 'circle', center: geom.center, radius: geom.radius }];

        case 'ARC':
            return [{ kind: 'arc', center: geom.center, radius: geom.radius, startAngle: geom.startAngle, endAngle: geom.endAngle }];

        case 'RECTANGLE': {
            const hw = geom.width / 2;
            const hh = geom.height / 2;
            const cx = geom.center.x;
            const cy = geom.center.y;
            const rot = geom.rotation || 0;
            const cos = Math.cos(rot);
            const sin = Math.sin(rot);
            const localCorners: Point[] = [
                { x: -hw, y: -hh },
                { x: hw, y: -hh },
                { x: hw, y: hh },
                { x: -hw, y: hh }
            ];
            const corners = localCorners.map(p => ({
                x: cx + p.x * cos - p.y * sin,
                y: cy + p.x * sin + p.y * cos
            }));
            return [
                { kind: 'line', start: corners[0], end: corners[1] },
                { kind: 'line', start: corners[1], end: corners[2] },
                { kind: 'line', start: corners[2], end: corners[3] },
                { kind: 'line', start: corners[3], end: corners[0] }
            ];
        }

        case 'HEXAGON': {
            const v = polygonVertices(geom);
            return v.map((p, i): LineEdge => ({ kind: 'line', start: p, end: v[(i + 1) % v.length] }));
        }

        case 'POLYLINE': {
            const edges: LineEdge[] = [];
            for (let i = 0; i < geom.vertices.length - 1; i++) {
                edges.push({ kind: 'line', start: geom.vertices[i], end: geom.vertices[i + 1] });
            }
            if (geom.closed && geom.vertices.length > 2) {
                edges.push({ kind: 'line', start: geom.vertices[geom.vertices.length - 1], end: geom.vertices[0] });
            }
            return edges;
        }

        case 'ELLIPSE': {
            const edges: LineEdge[] = [];
            const steps = 36;
            const rot = geom.rotation || 0;
            const cos = Math.cos(rot);
            const sin = Math.sin(rot);
            const startA = geom.startAngle ?? 0;
            const endA = geom.endAngle ?? (2 * Math.PI);
            const span = endA >= startA ? (endA - startA) : (endA - startA + 2 * Math.PI);
            const pts: Point[] = [];
            for (let i = 0; i <= steps; i++) {
                const theta = startA + (span * i) / steps;
                const lx = geom.radiusX * Math.cos(theta);
                const ly = geom.radiusY * Math.sin(theta);
                pts.push({
                    x: geom.center.x + lx * cos - ly * sin,
                    y: geom.center.y + lx * sin + ly * cos
                });
            }
            for (let i = 0; i < pts.length - 1; i++) {
                edges.push({ kind: 'line', start: pts[i], end: pts[i + 1] });
            }
            return edges;
        }

        case 'SPLINE': {
            if (!geom.controlPoints || geom.controlPoints.length < 2) return [];
            // the drawn curve, not its control polygon
            return primitivesToEdges(geometryPrimitives(geom));
        }

        default:
            // gears, sprockets, fasteners, belts, hatches, leaders, text …: what the canvas draws
            return primitivesToEdges(geometryPrimitives(geom));
    }
}

/** Lines and exact arcs/circles of drawing primitives (curves flattened finely). */
export function primitivesToEdges(prims: Primitive[]): Edge[] {
    const edges: Edge[] = [];
    const chainEdges = (pts: Point[]) => {
        for (let i = 0; i + 1 < pts.length; i++) {
            if (distance(pts[i], pts[i + 1]) > 1e-9) edges.push({ kind: 'line', start: pts[i], end: pts[i + 1] });
        }
    };
    for (const p of prims) {
        switch (p.kind) {
            case 'line': edges.push({ kind: 'line', start: p.a, end: p.b }); break;
            case 'circle': edges.push({ kind: 'circle', center: p.c, radius: p.r }); break;
            case 'arc': edges.push({ kind: 'arc', center: p.c, radius: p.r, startAngle: p.start, endAngle: p.end }); break;
            case 'polyline': {
                const n = p.points.length;
                const segs = p.closed ? n : n - 1;
                for (let i = 0; i < segs; i++) {
                    const a = p.points[i], b = p.points[(i + 1) % n];
                    const bulge = p.bulges?.[i] ?? 0;
                    const arc = Math.abs(bulge) > 1e-12 ? bulgeArc(a, b, bulge) : null;
                    if (arc) {
                        const c = { x: arc.cx, y: arc.cy };
                        const angA = Math.atan2(a.y - c.y, a.x - c.x), angB = Math.atan2(b.y - c.y, b.x - c.x);
                        // edges run counter-clockwise from start to end
                        edges.push(arc.sweep > 0
                            ? { kind: 'arc', center: c, radius: arc.r, startAngle: angA, endAngle: angB }
                            : { kind: 'arc', center: c, radius: arc.r, startAngle: angB, endAngle: angA });
                    } else if (distance(a, b) > 1e-9) {
                        edges.push({ kind: 'line', start: a, end: b });
                    }
                }
                break;
            }
            case 'text':
            case 'point':
                break;
            case 'hatch':
                for (const r of p.rings) chainEdges([...r, r[0]]);
                break;
            default:
                for (const chain of flattenPrimitive(p, 0.01)) chainEdges(chain);
        }
    }
    return edges;
}

// ═══════════════════════════════════════════════════════════════
// EDGE-LEVEL INTERSECTIONS
// ═══════════════════════════════════════════════════════════════

export function intersectEdges(e1: Edge, e2: Edge): Point[] {
    // LINE-LINE
    if (e1.kind === 'line' && e2.kind === 'line') {
        const pt = intersectLineLine(e1.start, e1.end, e2.start, e2.end, true);
        return pt ? [pt] : [];
    }

    // LINE-CIRCLE
    if (e1.kind === 'line' && e2.kind === 'circle') {
        return lineCircleIntersection(e1.start, e1.end, e2.center, e2.radius);
    }
    if (e1.kind === 'circle' && e2.kind === 'line') {
        return lineCircleIntersection(e2.start, e2.end, e1.center, e1.radius);
    }

    // LINE-ARC
    if (e1.kind === 'line' && e2.kind === 'arc') {
        return lineArcIntersection(e1.start, e1.end, e2);
    }
    if (e1.kind === 'arc' && e2.kind === 'line') {
        return lineArcIntersection(e2.start, e2.end, e1);
    }

    // CIRCLE-CIRCLE
    if (e1.kind === 'circle' && e2.kind === 'circle') {
        return circleCircleIntersection(e1.center, e1.radius, e2.center, e2.radius);
    }

    // CIRCLE-ARC
    if (e1.kind === 'circle' && e2.kind === 'arc') {
        const pts = circleCircleIntersection(e1.center, e1.radius, e2.center, e2.radius);
        return pts.filter(p => isPointOnArc(p, e2));
    }
    if (e1.kind === 'arc' && e2.kind === 'circle') {
        const pts = circleCircleIntersection(e1.center, e1.radius, e2.center, e2.radius);
        return pts.filter(p => isPointOnArc(p, e1));
    }

    // ARC-ARC
    if (e1.kind === 'arc' && e2.kind === 'arc') {
        const pts = circleCircleIntersection(e1.center, e1.radius, e2.center, e2.radius);
        return pts.filter(p => isPointOnArc(p, e1) && isPointOnArc(p, e2));
    }

    return [];
}

// ═══════════════════════════════════════════════════════════════
// ARC HELPERS
// ═══════════════════════════════════════════════════════════════

function lineArcIntersection(lineStart: Point, lineEnd: Point, arc: ArcEdge): Point[] {
    // First find line-circle intersections
    const pts = lineCircleIntersection(lineStart, lineEnd, arc.center, arc.radius);
    // Then filter to points that lie on the arc's angular span
    return pts.filter(p => isPointOnArc(p, arc));
}

function isPointOnArc(point: Point, arc: ArcEdge): boolean {
    let angle = Math.atan2(point.y - arc.center.y, point.x - arc.center.x);
    if (angle < 0) angle += 2 * Math.PI;

    let start = arc.startAngle;
    let end = arc.endAngle;
    while (start < 0) start += 2 * Math.PI;
    while (end < 0) end += 2 * Math.PI;

    let sweep = end - start;
    if (sweep < 0) sweep += 2 * Math.PI;

    let relative = angle - start;
    if (relative < 0) relative += 2 * Math.PI;

    return relative <= sweep + EPSILON;
}

// ═══════════════════════════════════════════════════════════════
// UNIVERSAL TRIM
// ═══════════════════════════════════════════════════════════════

/**
 * Trims an entity at intersection points with cutting edges.
 * The segment closest to the pickPoint is removed.
 * 
 * Returns: array of new CadEntities to replace the original, or null if no trim possible.
 */
export function universalTrim(
    entity: CadEntity,
    cuttingEdges: CadEntity[],
    pickPoint: Point
): CadEntity[] | null {
    const geom = entity.geometry;

    // Collect all intersection points between entity and all cutters
    let allIntersections: Point[] = [];
    for (const cutter of cuttingEdges) {
        if (cutter.id === entity.id) continue;
        const pts = findAllIntersections(entity, cutter);
        allIntersections.push(...pts);
    }

    allIntersections = deduplicatePoints(allIntersections);
    if (allIntersections.length === 0) return null;

    // Dispatch to type-specific trim
    switch (geom.type) {
        case 'LINE':
            return trimLine(entity, geom, allIntersections, pickPoint);
        case 'CIRCLE':
            return trimCircle(entity, geom, allIntersections, pickPoint);
        case 'ARC':
            return trimArc(entity, geom, allIntersections, pickPoint);
        case 'POLYLINE':
            return trimPolyline(entity, geom, allIntersections, pickPoint);
        case 'RECTANGLE':
            return trimRectangle(entity, geom, allIntersections, pickPoint);
        case 'HEXAGON':
            return trimHexagon(entity, geom, allIntersections, pickPoint);
        default:
            return null; // Unsupported for now
    }
}

function trimLine(
    entity: CadEntity,
    geom: { start: Point; end: Point },
    intersections: Point[],
    pickPoint: Point
): CadEntity[] | null {
    // Sort intersections by distance from start
    const sorted = intersections
        .filter(p => distance(geom.start, p) > EPSILON && distance(geom.end, p) > EPSILON)
        .sort((a, b) => distance(geom.start, a) - distance(geom.start, b));

    if (sorted.length === 0) return null;

    // Build segments
    const segments: { start: Point; end: Point }[] = [];
    let currStart = geom.start;
    for (const pt of sorted) {
        segments.push({ start: currStart, end: pt });
        currStart = pt;
    }
    segments.push({ start: currStart, end: geom.end });

    // Find segment closest to pickPoint (by midpoint distance)
    let bestIdx = 0;
    let bestDist = Infinity;
    segments.forEach((seg, i) => {
        const mid = { x: (seg.start.x + seg.end.x) / 2, y: (seg.start.y + seg.end.y) / 2 };
        const d = distance(pickPoint, mid);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
    });

    // Return all segments except the picked one
    return segments
        .filter((_, i) => i !== bestIdx)
        .map(seg => ({
            ...entity,
            id: crypto.randomUUID(),
            isSelected: false,
            geometry: { type: 'LINE' as const, start: seg.start, end: seg.end }
        }));
}

function trimCircle(
    entity: CadEntity,
    geom: { center: Point; radius: number },
    intersections: Point[],
    pickPoint: Point
): CadEntity[] | null {
    if (intersections.length < 2) return null;

    // Sort intersections by angle from center
    const angles = intersections.map(p => {
        let a = Math.atan2(p.y - geom.center.y, p.x - geom.center.x);
        if (a < 0) a += 2 * Math.PI;
        return { point: p, angle: a };
    }).sort((a, b) => a.angle - b.angle);

    // Build arc segments between consecutive intersection points
    const arcs: { startAngle: number; endAngle: number }[] = [];
    for (let i = 0; i < angles.length; i++) {
        const next = (i + 1) % angles.length;
        arcs.push({ startAngle: angles[i].angle, endAngle: angles[next].angle });
    }

    // Find which arc the pickPoint falls into
    let pickAngle = Math.atan2(pickPoint.y - geom.center.y, pickPoint.x - geom.center.x);
    if (pickAngle < 0) pickAngle += 2 * Math.PI;

    let removeIdx = 0;
    for (let i = 0; i < arcs.length; i++) {
        let sweep = arcs[i].endAngle - arcs[i].startAngle;
        if (sweep <= 0) sweep += 2 * Math.PI;
        let rel = pickAngle - arcs[i].startAngle;
        if (rel < 0) rel += 2 * Math.PI;
        if (rel <= sweep) { removeIdx = i; break; }
    }

    // Return all arcs except the picked one
    return arcs
        .filter((_, i) => i !== removeIdx)
        .map(arc => ({
            ...entity,
            id: crypto.randomUUID(),
            isSelected: false,
            geometry: {
                type: 'ARC' as const,
                center: geom.center,
                radius: geom.radius,
                startAngle: arc.startAngle,
                endAngle: arc.endAngle
            }
        }));
}

function trimArc(
    entity: CadEntity,
    geom: { center: Point; radius: number; startAngle: number; endAngle: number },
    intersections: Point[],
    pickPoint: Point
): CadEntity[] | null {
    // Convert intersection points to angles, filter to those within arc span
    const arcAngles = intersections
        .map(p => {
            let a = Math.atan2(p.y - geom.center.y, p.x - geom.center.x);
            if (a < 0) a += 2 * Math.PI;
            return a;
        })
        .filter(a => {
            let sweep = geom.endAngle - geom.startAngle;
            if (sweep < 0) sweep += 2 * Math.PI;
            let rel = a - geom.startAngle;
            if (rel < 0) rel += 2 * Math.PI;
            return rel <= sweep + EPSILON;
        })
        .sort((a, b) => {
            let ra = a - geom.startAngle; if (ra < 0) ra += 2 * Math.PI;
            let rb = b - geom.startAngle; if (rb < 0) rb += 2 * Math.PI;
            return ra - rb;
        });

    if (arcAngles.length === 0) return null;

    // Build sub-arcs
    const subArcs: { startAngle: number; endAngle: number }[] = [];
    let currAngle = geom.startAngle;
    for (const a of arcAngles) {
        subArcs.push({ startAngle: currAngle, endAngle: a });
        currAngle = a;
    }
    subArcs.push({ startAngle: currAngle, endAngle: geom.endAngle });

    // Find which sub-arc pickPoint is in
    let pickAngle = Math.atan2(pickPoint.y - geom.center.y, pickPoint.x - geom.center.x);
    if (pickAngle < 0) pickAngle += 2 * Math.PI;

    let removeIdx = 0;
    for (let i = 0; i < subArcs.length; i++) {
        let sweep = subArcs[i].endAngle - subArcs[i].startAngle;
        if (sweep < 0) sweep += 2 * Math.PI;
        let rel = pickAngle - subArcs[i].startAngle;
        if (rel < 0) rel += 2 * Math.PI;
        if (rel <= sweep) { removeIdx = i; break; }
    }

    return subArcs
        .filter((_, i) => i !== removeIdx)
        .filter(a => { let s = a.endAngle - a.startAngle; if (s < 0) s += 2 * Math.PI; return s > EPSILON; })
        .map(arc => ({
            ...entity,
            id: crypto.randomUUID(),
            isSelected: false,
            geometry: {
                type: 'ARC' as const,
                center: geom.center,
                radius: geom.radius,
                startAngle: arc.startAngle,
                endAngle: arc.endAngle
            }
        }));
}

function trimRectangle(
    entity: CadEntity,
    geom: RectangleGeometry,
    intersections: Point[],
    pickPoint: Point
): CadEntity[] | null {
    const hw = geom.width / 2;
    const hh = geom.height / 2;
    const cx = geom.center.x;
    const cy = geom.center.y;
    const rot = geom.rotation || 0;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const localCorners: Point[] = [
        { x: -hw, y: -hh },
        { x: hw, y: -hh },
        { x: hw, y: hh },
        { x: -hw, y: hh }
    ];
    const corners = localCorners.map(p => ({
        x: cx + p.x * cos - p.y * sin,
        y: cy + p.x * sin + p.y * cos
    }));

    const sides: { start: Point; end: Point }[] = [
        { start: corners[0], end: corners[1] },
        { start: corners[1], end: corners[2] },
        { start: corners[2], end: corners[3] },
        { start: corners[3], end: corners[0] }
    ];

    let pickedSideIdx = -1;
    let minPickDist = Infinity;
    sides.forEach((side, idx) => {
        const d = distToSegment(pickPoint, side.start, side.end);
        if (d < minPickDist) {
            minPickDist = d;
            pickedSideIdx = idx;
        }
    });

    if (pickedSideIdx === -1) return null;

    const pickedSide = sides[pickedSideIdx];
    const sideIntersections = intersections.filter(p => isPointOnSegment(p, pickedSide.start, pickedSide.end));
    if (sideIntersections.length === 0) return null;

    const trimmedSideEntities = trimLine(
        entity,
        pickedSide,
        sideIntersections,
        pickPoint
    );

    if (!trimmedSideEntities) return null;

    const intactSides: CadEntity[] = [];
    sides.forEach((side, idx) => {
        if (idx !== pickedSideIdx) {
            intactSides.push({
                ...entity,
                id: crypto.randomUUID(),
                isSelected: false,
                geometry: {
                    type: 'LINE',
                    start: side.start,
                    end: side.end
                }
            });
        }
    });

    return [...intactSides, ...trimmedSideEntities];
}

function trimHexagon(
    entity: CadEntity,
    geom: HexagonGeometry,
    intersections: Point[],
    pickPoint: Point
): CadEntity[] | null {
    const verts = polygonVertices(geom);
    const sides: { start: Point; end: Point }[] = verts.map((v, i) => ({ start: v, end: verts[(i + 1) % verts.length] }));

    let pickedSideIdx = -1;
    let minPickDist = Infinity;
    sides.forEach((side, idx) => {
        const d = distToSegment(pickPoint, side.start, side.end);
        if (d < minPickDist) {
            minPickDist = d;
            pickedSideIdx = idx;
        }
    });

    if (pickedSideIdx === -1) return null;

    const pickedSide = sides[pickedSideIdx];
    const sideIntersections = intersections.filter(p => isPointOnSegment(p, pickedSide.start, pickedSide.end));
    if (sideIntersections.length === 0) return null;

    const trimmedSideEntities = trimLine(
        entity,
        pickedSide,
        sideIntersections,
        pickPoint
    );

    if (!trimmedSideEntities) return null;

    const intactSides: CadEntity[] = [];
    sides.forEach((side, idx) => {
        if (idx !== pickedSideIdx) {
            intactSides.push({
                ...entity,
                id: crypto.randomUUID(),
                isSelected: false,
                geometry: {
                    type: 'LINE',
                    start: side.start,
                    end: side.end
                }
            });
        }
    });

    return [...intactSides, ...trimmedSideEntities];
}

function trimPolyline(
    entity: CadEntity,
    geom: PolylineGeometry,
    intersections: Point[],
    pickPoint: Point
): CadEntity[] | null {
    if (geom.vertices.length < 2) return null;

    const segments: { start: Point; end: Point; index: number }[] = [];
    for (let i = 0; i < geom.vertices.length - 1; i++) {
        segments.push({ start: geom.vertices[i], end: geom.vertices[i + 1], index: i });
    }
    if (geom.closed && geom.vertices.length > 2) {
        segments.push({
            start: geom.vertices[geom.vertices.length - 1],
            end: geom.vertices[0],
            index: geom.vertices.length - 1
        });
    }

    let pickedIdx = -1;
    let minPickDist = Infinity;
    segments.forEach((seg, i) => {
        const d = distToSegment(pickPoint, seg.start, seg.end);
        if (d < minPickDist) {
            minPickDist = d;
            pickedIdx = i;
        }
    });

    if (pickedIdx === -1) return null;

    const pickedSeg = segments[pickedIdx];
    const segIntersections = intersections.filter(p => isPointOnSegment(p, pickedSeg.start, pickedSeg.end));
    if (segIntersections.length === 0) return null;

    const trimmedPieces = trimLine(entity, pickedSeg, segIntersections, pickPoint);
    if (!trimmedPieces) return null;

    const resultEntities: CadEntity[] = [];
    segments.forEach((seg, i) => {
        if (i !== pickedIdx) {
            resultEntities.push({
                ...entity,
                id: crypto.randomUUID(),
                isSelected: false,
                geometry: {
                    type: 'LINE',
                    start: seg.start,
                    end: seg.end
                }
            });
        }
    });

    resultEntities.push(...trimmedPieces);
    return resultEntities;
}

function distToSegment(p: Point, a: Point, b: Point): number {
    const l2 = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
    if (l2 < EPSILON) return distance(p, a);
    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return distance(p, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
}

function isPointOnSegment(p: Point, a: Point, b: Point, tolerance = 0.05): boolean {
    return distToSegment(p, a, b) <= tolerance;
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function deduplicatePoints(points: Point[]): Point[] {
    const result: Point[] = [];
    for (const p of points) {
        if (!result.some(r => distance(r, p) < EPSILON)) {
            result.push(p);
        }
    }
    return result;
}
