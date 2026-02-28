/**
 * AluCAD - OSNAP Engine
 * 
 * Real-time geometry-based snapping system.
 * Calculates snap points for END, MID, CEN, INT, PER modes.
 */

import {
    Point,
    CadEntity,
    OSnapMode,
    SnapResult,
    LineGeometry,
    CircleGeometry,
    ArcGeometry,
    PolylineGeometry
} from '../kernel/types';
import {
    distance,
    midpoint,
    vector,
    normalize,
    dot,
    add,
    scale,
    perpendicular
} from '../kernel/GeometryKernel';
import { SNAP_DISTANCE_PX, EPSILON, isZero } from '../kernel/constants';
import { screenToWorldDistance } from '../kernel/CoordinateSystem';

// ═══════════════════════════════════════════════════════════════
// SNAP ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Find the best snap point near the cursor
 */
export function findSnapPoint(
    cursorWorld: Point,
    entities: CadEntity[],
    activeSnaps: OSnapMode[],
    zoom: number
): SnapResult | null {
    // Convert snap threshold to world units
    const snapThreshold = screenToWorldDistance(SNAP_DISTANCE_PX, zoom);

    let bestSnap: SnapResult | null = null;
    let bestDistance = snapThreshold;

    for (const entity of entities) {
        if (!entity.isVisible) continue;

        const snaps = getEntitySnapPoints(entity, cursorWorld, activeSnaps);

        for (const snap of snaps) {
            const dist = distance(cursorWorld, snap.point);
            if (dist < bestDistance) {
                bestDistance = dist;
                bestSnap = snap;
            }
        }
    }

    return bestSnap;
}

/**
 * Get all snap points for an entity
 */
function getEntitySnapPoints(
    entity: CadEntity,
    cursor: Point,
    activeSnaps: OSnapMode[]
): SnapResult[] {
    const snaps: SnapResult[] = [];
    const geom = entity.geometry;

    switch (geom.type) {
        case 'LINE':
            snaps.push(...getLineSnaps(geom, cursor, entity.id, activeSnaps));
            break;
        case 'CIRCLE':
            snaps.push(...getCircleSnaps(geom, cursor, entity.id, activeSnaps));
            break;
        case 'ARC':
            snaps.push(...getArcSnaps(geom, cursor, entity.id, activeSnaps));
            break;
        case 'POLYLINE':
            snaps.push(...getPolylineSnaps(geom, cursor, entity.id, activeSnaps));
            break;
    }

    return snaps;
}

// ═══════════════════════════════════════════════════════════════
// LINE SNAPS
// ═══════════════════════════════════════════════════════════════

function getLineSnaps(
    geom: LineGeometry,
    cursor: Point,
    entityId: string,
    activeSnaps: OSnapMode[]
): SnapResult[] {
    const snaps: SnapResult[] = [];

    // END - Endpoints
    if (activeSnaps.includes('END')) {
        snaps.push({ point: geom.start, mode: 'END', entityId });
        snaps.push({ point: geom.end, mode: 'END', entityId });
    }

    // MID - Midpoint
    if (activeSnaps.includes('MID')) {
        snaps.push({
            point: midpoint(geom.start, geom.end),
            mode: 'MID',
            entityId
        });
    }

    // NEA - Nearest point on line
    if (activeSnaps.includes('NEA')) {
        const nearest = nearestPointOnLine(cursor, geom.start, geom.end);
        if (nearest) {
            snaps.push({ point: nearest, mode: 'NEA', entityId });
        }
    }

    // PER - Perpendicular (requires origin point context)
    // This is handled separately in command context

    return snaps;
}

/**
 * Find nearest point on a line segment
 */
export function nearestPointOnLine(
    point: Point,
    lineStart: Point,
    lineEnd: Point
): Point | null {
    const v = vector(lineStart, lineEnd);
    const w = vector(lineStart, point);

    const c1 = dot(w, v);
    const c2 = dot(v, v);

    if (isZero(c2)) return null; // Degenerate line

    const t = Math.max(0, Math.min(1, c1 / c2));

    return add(lineStart, scale(v, t));
}

/**
 * Distance from point to line segment
 */
export function distanceToLine(
    point: Point,
    lineStart: Point,
    lineEnd: Point
): number {
    const nearest = nearestPointOnLine(point, lineStart, lineEnd);
    return nearest ? distance(point, nearest) : Infinity;
}

// ═══════════════════════════════════════════════════════════════
// CIRCLE SNAPS
// ═══════════════════════════════════════════════════════════════

function getCircleSnaps(
    geom: CircleGeometry,
    cursor: Point,
    entityId: string,
    activeSnaps: OSnapMode[]
): SnapResult[] {
    const snaps: SnapResult[] = [];

    // CEN - Center
    if (activeSnaps.includes('CEN')) {
        snaps.push({ point: geom.center, mode: 'CEN', entityId });
    }

    // NEA - Nearest on circle
    if (activeSnaps.includes('NEA')) {
        const nearest = nearestPointOnCircle(cursor, geom.center, geom.radius);
        snaps.push({ point: nearest, mode: 'NEA', entityId });
    }

    // QUADRANT points (0°, 90°, 180°, 270°)
    if (activeSnaps.includes('END')) {
        const quadrants: Point[] = [
            { x: geom.center.x + geom.radius, y: geom.center.y },
            { x: geom.center.x, y: geom.center.y + geom.radius },
            { x: geom.center.x - geom.radius, y: geom.center.y },
            { x: geom.center.x, y: geom.center.y - geom.radius }
        ];
        for (const q of quadrants) {
            snaps.push({ point: q, mode: 'END', entityId });
        }
    }

    return snaps;
}

/**
 * Nearest point on circle
 */
export function nearestPointOnCircle(
    point: Point,
    center: Point,
    radius: number
): Point {
    const v = vector(center, point);
    const dist = Math.sqrt(v.x * v.x + v.y * v.y);

    if (isZero(dist)) {
        return { x: center.x + radius, y: center.y };
    }

    return {
        x: center.x + (v.x / dist) * radius,
        y: center.y + (v.y / dist) * radius
    };
}

// ═══════════════════════════════════════════════════════════════
// ARC SNAPS
// ═══════════════════════════════════════════════════════════════

function getArcSnaps(
    geom: ArcGeometry,
    cursor: Point,
    entityId: string,
    activeSnaps: OSnapMode[]
): SnapResult[] {
    const snaps: SnapResult[] = [];

    // CEN - Center
    if (activeSnaps.includes('CEN')) {
        snaps.push({ point: geom.center, mode: 'CEN', entityId });
    }

    // END - Arc endpoints
    if (activeSnaps.includes('END')) {
        const startPoint = {
            x: geom.center.x + geom.radius * Math.cos(geom.startAngle),
            y: geom.center.y + geom.radius * Math.sin(geom.startAngle)
        };
        const endPoint = {
            x: geom.center.x + geom.radius * Math.cos(geom.endAngle),
            y: geom.center.y + geom.radius * Math.sin(geom.endAngle)
        };
        snaps.push({ point: startPoint, mode: 'END', entityId });
        snaps.push({ point: endPoint, mode: 'END', entityId });
    }

    // MID - Arc midpoint
    if (activeSnaps.includes('MID')) {
        const midAngle = (geom.startAngle + geom.endAngle) / 2;
        const midPoint = {
            x: geom.center.x + geom.radius * Math.cos(midAngle),
            y: geom.center.y + geom.radius * Math.sin(midAngle)
        };
        snaps.push({ point: midPoint, mode: 'MID', entityId });
    }

    return snaps;
}

// ═══════════════════════════════════════════════════════════════
// POLYLINE SNAPS
// ═══════════════════════════════════════════════════════════════

function getPolylineSnaps(
    geom: PolylineGeometry,
    cursor: Point,
    entityId: string,
    activeSnaps: OSnapMode[]
): SnapResult[] {
    const snaps: SnapResult[] = [];
    const vertices = geom.vertices;

    // END - All vertices
    if (activeSnaps.includes('END')) {
        for (const v of vertices) {
            snaps.push({ point: v, mode: 'END', entityId });
        }
    }

    // MID & NEA - For each segment
    for (let i = 0; i < vertices.length - 1; i++) {
        const start = vertices[i];
        const end = vertices[i + 1];

        if (activeSnaps.includes('MID')) {
            snaps.push({
                point: midpoint(start, end),
                mode: 'MID',
                entityId
            });
        }

        if (activeSnaps.includes('NEA')) {
            const nearest = nearestPointOnLine(cursor, start, end);
            if (nearest) {
                snaps.push({ point: nearest, mode: 'NEA', entityId });
            }
        }
    }

    // Handle closed polyline
    if (geom.closed && vertices.length > 2) {
        const start = vertices[vertices.length - 1];
        const end = vertices[0];

        if (activeSnaps.includes('MID')) {
            snaps.push({
                point: midpoint(start, end),
                mode: 'MID',
                entityId
            });
        }
    }

    return snaps;
}

// ═══════════════════════════════════════════════════════════════
// INTERSECTION SNAPS
// ═══════════════════════════════════════════════════════════════

/**
 * Find all intersection points between entities
 */
export function findIntersections(
    entities: CadEntity[],
    activeSnaps: OSnapMode[]
): SnapResult[] {
    if (!activeSnaps.includes('INT')) return [];

    const intersections: SnapResult[] = [];

    for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
            const points = getEntityIntersections(entities[i], entities[j]);
            for (const point of points) {
                intersections.push({
                    point,
                    mode: 'INT',
                    entityId: `${entities[i].id}:${entities[j].id}`
                });
            }
        }
    }

    return intersections;
}

/**
 * Get intersection points between two entities
 */
export function getEntityIntersections(e1: CadEntity, e2: CadEntity): Point[] {
    const g1 = e1.geometry;
    const g2 = e2.geometry;

    // LINE-LINE
    if (g1.type === 'LINE' && g2.type === 'LINE') {
        return lineLineIntersection(g1.start, g1.end, g2.start, g2.end);
    }

    // LINE-CIRCLE
    if (g1.type === 'LINE' && g2.type === 'CIRCLE') {
        return lineCircleIntersection(g1.start, g1.end, g2.center, g2.radius);
    }
    if (g1.type === 'CIRCLE' && g2.type === 'LINE') {
        return lineCircleIntersection(g2.start, g2.end, g1.center, g1.radius);
    }

    // CIRCLE-CIRCLE
    if (g1.type === 'CIRCLE' && g2.type === 'CIRCLE') {
        return circleCircleIntersection(g1.center, g1.radius, g2.center, g2.radius);
    }

    return [];
}

/**
 * Line-Line intersection
 */
export function lineLineIntersection(
    p1: Point, p2: Point,
    p3: Point, p4: Point
): Point[] {
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;
    const x4 = p4.x, y4 = p4.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

    if (Math.abs(denom) < EPSILON) return []; // Parallel

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    // Check if intersection is within both line segments
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return [{
            x: x1 + t * (x2 - x1),
            y: y1 + t * (y2 - y1)
        }];
    }

    return [];
}

/**
 * Line-Circle intersection
 */
export function lineCircleIntersection(
    lineStart: Point,
    lineEnd: Point,
    center: Point,
    radius: number
): Point[] {
    const d = vector(lineStart, lineEnd);
    const f = vector(center, lineStart);

    const a = dot(d, d);
    const b = 2 * dot(f, d);
    const c = dot(f, f) - radius * radius;

    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) return [];

    const points: Point[] = [];
    const sqrtDisc = Math.sqrt(discriminant);

    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);

    if (t1 >= 0 && t1 <= 1) {
        points.push(add(lineStart, scale(d, t1)));
    }
    if (t2 >= 0 && t2 <= 1 && Math.abs(t2 - t1) > EPSILON) {
        points.push(add(lineStart, scale(d, t2)));
    }

    return points;
}

/**
 * Circle-Circle intersection
 */
export function circleCircleIntersection(
    c1: Point, r1: number,
    c2: Point, r2: number
): Point[] {
    const d = distance(c1, c2);

    // Too far apart or one inside other
    if (d > r1 + r2 || d < Math.abs(r1 - r2) || isZero(d)) {
        return [];
    }

    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h = Math.sqrt(r1 * r1 - a * a);

    const p2: Point = {
        x: c1.x + a * (c2.x - c1.x) / d,
        y: c1.y + a * (c2.y - c1.y) / d
    };

    const points: Point[] = [
        {
            x: p2.x + h * (c2.y - c1.y) / d,
            y: p2.y - h * (c2.x - c1.x) / d
        }
    ];

    // Two intersection points
    if (h > EPSILON) {
        points.push({
            x: p2.x - h * (c2.y - c1.y) / d,
            y: p2.y + h * (c2.x - c1.x) / d
        });
    }

    return points;
}
