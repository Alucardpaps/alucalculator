import {
    Point,
    CadEntity,
    LineGeometry,
    PolylineGeometry,
    createLineEntity,
    createPolylineEntity,
    createCircleEntity
} from '../kernel/types';
import {
    distance,
    vector,
    normalize,
    scale,
    add,
    perpendicular
} from '../kernel/GeometryKernel';
import { screenToWorldDistance } from '../kernel/CoordinateSystem';

// ═══════════════════════════════════════════════════════════════
// SELECTION UTILS
// ═══════════════════════════════════════════════════════════════

export function findEntityAtPoint(
    point: Point,
    entities: CadEntity[],
    zoom: number,
    tolerancePx: number = 10
): CadEntity | null {
    const tolerance = screenToWorldDistance(tolerancePx, zoom);

    let closestEntity: CadEntity | null = null;
    let minDistance = tolerance;

    for (const entity of entities) {
        if (!entity.isVisible) continue;

        const d = distanceToEntity(point, entity);
        if (d <= minDistance) {
            // Prioritize points over lines if distances are similar
            if (closestEntity && closestEntity.geometry.type !== 'POINT' && entity.geometry.type === 'POINT' && Math.abs(d - minDistance) < 5) {
                closestEntity = entity;
                minDistance = d;
            } else if (d < minDistance) {
                closestEntity = entity;
                minDistance = d;
            } else if (!closestEntity) {
                closestEntity = entity;
                minDistance = d;
            }
        }
    }
    return closestEntity;
}

export function distanceToEntity(point: Point, entity: CadEntity): number {
    const geom = entity.geometry;
    switch (geom.type) {
        case 'POINT':
            return distance(point, { x: geom.x, y: geom.y });
        case 'LINE':
            return distanceToLine(point, geom.start, geom.end);
        case 'CIRCLE':
            return Math.abs(distance(point, geom.center) - geom.radius);
        case 'POLYLINE':
            // Min distance to any segment
            let minDist = Infinity;
            const vertices = geom.vertices;
            for (let i = 0; i < vertices.length - 1; i++) {
                const d = distanceToLine(point, vertices[i], vertices[i + 1]);
                if (d < minDist) minDist = d;
            }
            if (geom.closed) {
                const d = distanceToLine(point, vertices[vertices.length - 1], vertices[0]);
                if (d < minDist) minDist = d;
            }
            return minDist;
        default:
            return Infinity;
    }
}

function distanceToLine(p: Point, start: Point, end: Point): number {
    const l2 = distanceSquared(start, end);
    if (l2 === 0) return distance(p, start);

    // Projection t
    let t = ((p.x - start.x) * (end.x - start.x) + (p.y - start.y) * (end.y - start.y)) / l2;
    t = Math.max(0, Math.min(1, t)); // Clamp to segment

    const proj = {
        x: start.x + t * (end.x - start.x),
        y: start.y + t * (end.y - start.y)
    };
    return distance(p, proj);
}

function distanceSquared(p1: Point, p2: Point): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return dx * dx + dy * dy;
}

// ═══════════════════════════════════════════════════════════════
// OFFSET UTILS
// ═══════════════════════════════════════════════════════════════

export function offsetEntity(
    entity: CadEntity,
    offsetDist: number,
    sidePoint: Point
): CadEntity | null {
    const geom = entity.geometry;

    try {
        if (geom.type === 'LINE') {
            const v = vector(geom.start, geom.end);
            const norm = normalize(perpendicular(v));

            // Determine direction based on sidePoint
            // Vector from start to sidePoint
            const vSide = vector(geom.start, sidePoint);
            // Dot product with normal
            const dotProd = norm.x * vSide.x + norm.y * vSide.y;

            const offsetDir = dotProd >= 0 ? 1 : -1;
            const finalOffset = scale(norm, offsetDist * offsetDir);

            return createLineEntity(
                add(geom.start, finalOffset),
                add(geom.end, finalOffset),
                entity.layerId,
                entity.color
            );
        }
        else if (geom.type === 'CIRCLE') {
            const distToCenter = distance(sidePoint, geom.center);
            let newRadius = distToCenter > geom.radius
                ? geom.radius + offsetDist
                : geom.radius - offsetDist;

            if (newRadius <= 0) return null;

            return createCircleEntity(
                geom.center,
                newRadius,
                entity.layerId,
                entity.color
            );
        }
        else if (geom.type === 'POLYLINE') {
            // Simple polyline offset
            const vertices = geom.vertices;
            const len = vertices.length;
            const loop = geom.closed;

            // Helper to get segment normal
            const getNormal = (p1: Point, p2: Point) => normalize(perpendicular(vector(p1, p2)));

            // Check One segment's side to determine sign
            const p0 = vertices[0];
            const p1 = vertices[1];
            const n0 = getNormal(p0, p1);
            const vSide = vector(p0, sidePoint);
            const dotProd = n0.x * vSide.x + n0.y * vSide.y;
            const sign = dotProd >= 0 ? 1 : -1;

            const newVertices: Point[] = [];

            for (let i = 0; i < len; i++) {
                const curr = vertices[i];

                // Get prev and next points
                let prev = i > 0 ? vertices[i - 1] : (loop ? vertices[len - 1] : null);
                let next = i < len - 1 ? vertices[i + 1] : (loop ? vertices[0] : null);

                let offsetV: Point;

                if (!prev) {
                    // Start of open polyline
                    const n = getNormal(curr, next!);
                    offsetV = scale(n, offsetDist * sign);
                    newVertices.push(add(curr, offsetV));
                }
                else if (!next) {
                    // End of open polyline
                    const n = getNormal(prev, curr);
                    offsetV = scale(n, offsetDist * sign);
                    newVertices.push(add(curr, offsetV));
                }
                else {
                    // Middle vertex
                    const n1 = getNormal(prev, curr);
                    const n2 = getNormal(curr, next);

                    // Average normal (bisector)
                    let bisector = add(n1, n2);
                    bisector = normalize(bisector);

                    // Correction factor for miter (k=1 for now)
                    const k = 1;

                    offsetV = scale(bisector, offsetDist * sign * k);
                    newVertices.push(add(curr, offsetV));
                }
            }

            return createPolylineEntity(
                newVertices,
                geom.closed,
                entity.layerId,
                entity.color
            );
        }
    } catch (e) {
        console.error('Offset error', e);
        return null;
    }

    return null;
}

// ═══════════════════════════════════════════════════════════════
// TRIM / SPLIT UTILS
// ═══════════════════════════════════════════════════════════════

export interface SplitResult {
    newEntities: CadEntity[]; // Entities replacing the original
    removeOriginal: boolean;
}

export function splitEntityAtPoints(
    entity: CadEntity,
    points: Point[]
): SplitResult | null {
    const geom = entity.geometry;

    if (geom.type === 'LINE') {
        // Sort points from start to end
        const sortedPoints = [...points].sort((a, b) => distance(geom.start, a) - distance(geom.start, b));

        const newEntities: CadEntity[] = [];
        let curr = geom.start;

        // Add segments
        for (const p of sortedPoints) {
            // Avoid zero length
            if (distance(curr, p) > 0.001) {
                newEntities.push(createLineEntity(curr, p, entity.layerId, entity.color));
            }
            curr = p;
        }
        // Last segment
        if (distance(curr, geom.end) > 0.001) {
            newEntities.push(createLineEntity(curr, geom.end, entity.layerId, entity.color));
        }

        return { newEntities, removeOriginal: true };
    }

    return null; // Not supported yet
}

// ═══════════════════════════════════════════════════════════════
// BOX SELECTION UTILS
// ═══════════════════════════════════════════════════════════════

export interface BoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export function isEntityInsideBox(entity: CadEntity, box: BoundingBox): boolean {
    const geom = entity.geometry;
    if (geom.type === 'POINT') {
        return isPointInBox(geom, box);
    } else if (geom.type === 'LINE') {
        return isPointInBox(geom.start, box) && isPointInBox(geom.end, box);
    } else if (geom.type === 'CIRCLE') {
        // Simple bounding box check for circle
        return (
            geom.center.x - geom.radius >= box.minX &&
            geom.center.x + geom.radius <= box.maxX &&
            geom.center.y - geom.radius >= box.minY &&
            geom.center.y + geom.radius <= box.maxY
        );
    } else if (geom.type === 'POLYLINE') {
        return geom.vertices.every(v => isPointInBox(v, box));
    }
    return false;
}

export function isEntityIntersectingBox(entity: CadEntity, box: BoundingBox): boolean {
    // If inside, it intersects
    if (isEntityInsideBox(entity, box)) return true;

    const geom = entity.geometry;

    if (geom.type === 'LINE') {
        return lineIntersectsBox(geom.start, geom.end, box);
    } else if (geom.type === 'CIRCLE') {
        return circleIntersectsBox(geom.center, geom.radius, box);
    } else if (geom.type === 'POLYLINE') {
        const vertices = geom.vertices;
        for (let i = 0; i < vertices.length - 1; i++) {
            if (lineIntersectsBox(vertices[i], vertices[i + 1], box)) return true;
        }
        if (geom.closed) {
            if (lineIntersectsBox(vertices[vertices.length - 1], vertices[0], box)) return true;
        }
        return false;
    }
    return false;
}

function isPointInBox(p: { x: number, y: number }, box: BoundingBox): boolean {
    return p.x >= box.minX && p.x <= box.maxX && p.y >= box.minY && p.y <= box.maxY;
}

function lineIntersectsBox(p1: Point, p2: Point, box: BoundingBox): boolean {
    // Cohen-Sutherland algorithm or simple line intersection with box edges

    // Trivial accept/reject
    if (isPointInBox(p1, box) || isPointInBox(p2, box)) return true;
    if (Math.max(p1.x, p2.x) < box.minX || Math.min(p1.x, p2.x) > box.maxX) return false;
    if (Math.max(p1.y, p2.y) < box.minY || Math.min(p1.y, p2.y) > box.maxY) return false;

    // Check intersection with 4 edges
    const edges = [
        [{ x: box.minX, y: box.minY }, { x: box.maxX, y: box.minY }], // Top
        [{ x: box.maxX, y: box.minY }, { x: box.maxX, y: box.maxY }], // Right
        [{ x: box.maxX, y: box.maxY }, { x: box.minX, y: box.maxY }], // Bottom
        [{ x: box.minX, y: box.maxY }, { x: box.minX, y: box.minY }]  // Left
    ];

    for (const [e1, e2] of edges) {
        if (segmentsIntersect(p1, p2, e1, e2)) return true;
    }
    return false;
}

function circleIntersectsBox(center: Point, radius: number, box: BoundingBox): boolean {
    // Find closest point on box to circle center
    const closestX = Math.max(box.minX, Math.min(center.x, box.maxX));
    const closestY = Math.max(box.minY, Math.min(center.y, box.maxY));

    const dx = center.x - closestX;
    const dy = center.y - closestY;

    return (dx * dx + dy * dy) <= (radius * radius);
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
    const det = (b.x - a.x) * (d.y - c.y) - (d.x - c.x) * (b.y - a.y);
    if (det === 0) return false;

    const lambda = ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det;
    const gamma = ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det;

    return (0 <= lambda && lambda <= 1) && (0 <= gamma && gamma <= 1);
}
