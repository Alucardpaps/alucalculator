/**
 * 📐 AluCAD — Universal Geometry Engine
 * 
 * Provides advanced geometric operations (Trim, Fillet, Chamfer) that work
 * across ALL entity types: Line, Circle, Arc, Rectangle, Polyline.
 * 
 * Architecture: Sits between the raw GeometryKernel math and the Command Tools.
 * Tools call GeometryEngine; GeometryEngine calls GeometryKernel primitives.
 */

import { Point, CadEntity, GeometryType } from './types';
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

interface LineEdge { kind: 'line'; start: Point; end: Point }
interface ArcEdge { kind: 'arc'; center: Point; radius: number; startAngle: number; endAngle: number }
interface CircleEdge { kind: 'circle'; center: Point; radius: number }

type Edge = LineEdge | ArcEdge | CircleEdge;

/**
 * Decomposes any GeometryType into primitive edges for intersection.
 */
function decomposeToEdges(geom: GeometryType): Edge[] {
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
            const corners: Point[] = [
                { x: cx - hw, y: cy - hh },
                { x: cx + hw, y: cy - hh },
                { x: cx + hw, y: cy + hh },
                { x: cx - hw, y: cy + hh }
            ];
            return [
                { kind: 'line', start: corners[0], end: corners[1] },
                { kind: 'line', start: corners[1], end: corners[2] },
                { kind: 'line', start: corners[2], end: corners[3] },
                { kind: 'line', start: corners[3], end: corners[0] }
            ];
        }

        case 'HEXAGON': {
            const edges: LineEdge[] = [];
            for (let i = 0; i < 6; i++) {
                const angle1 = (Math.PI / 3) * i + (geom.rotation || 0);
                const angle2 = (Math.PI / 3) * (i + 1) + (geom.rotation || 0);
                edges.push({
                    kind: 'line',
                    start: { x: geom.center.x + geom.radius * Math.cos(angle1), y: geom.center.y + geom.radius * Math.sin(angle1) },
                    end: { x: geom.center.x + geom.radius * Math.cos(angle2), y: geom.center.y + geom.radius * Math.sin(angle2) }
                });
            }
            return edges;
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

        default:
            return [];
    }
}

// ═══════════════════════════════════════════════════════════════
// EDGE-LEVEL INTERSECTIONS
// ═══════════════════════════════════════════════════════════════

function intersectEdges(e1: Edge, e2: Edge): Point[] {
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
