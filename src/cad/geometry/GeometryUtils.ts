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
import { distanceToPrimitives, geometryPrimitives, primitivesInBox } from '../kernel/primitives';
import { isEntityEditable } from '../kernel/layers';

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
        // hidden, frozen and locked layers cannot be picked
        if (!isEntityEditable(entity)) continue;

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
        case 'ARC': {
            const dRad = Math.abs(distance(point, geom.center) - geom.radius);
            let angle = Math.atan2(point.y - geom.center.y, point.x - geom.center.x);
            if (angle < 0) angle += 2 * Math.PI;
            let s = geom.startAngle;
            let e = geom.endAngle;
            while (s < 0) s += 2 * Math.PI;
            while (e < 0) e += 2 * Math.PI;
            let sweep = e - s;
            if (sweep <= 0) sweep += 2 * Math.PI;
            let rel = angle - s;
            if (rel < 0) rel += 2 * Math.PI;
            if (rel <= sweep + 0.05) {
                return dRad;
            }
            const pStart = { x: geom.center.x + geom.radius * Math.cos(geom.startAngle), y: geom.center.y + geom.radius * Math.sin(geom.startAngle) };
            const pEnd = { x: geom.center.x + geom.radius * Math.cos(geom.endAngle), y: geom.center.y + geom.radius * Math.sin(geom.endAngle) };
            return Math.min(distance(point, pStart), distance(point, pEnd));
        }
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
        case 'DIMENSION': {
            const g = geom as any;
            if (!g.start || !g.end) return Infinity;
            const dLine = distanceToLine(point, g.start, g.end);
            const dP1 = distance(point, g.start);
            const dP2 = distance(point, g.end);
            let dText = Infinity;
            if (g.textPoint) {
                dText = distance(point, g.textPoint);
            }
            return Math.min(dLine, dP1, dP2, dText);
        }
        default:
            // rectangles, polygons, ellipses, splines, text, leaders, hatches and the
            // parametric machine elements: measured on exactly what the canvas draws
            return distanceToPrimitives(point, geometryPrimitives(geom));
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
        else if (geom.type === 'ARC') {
            const distToCenter = distance(sidePoint, geom.center);
            let newRadius = distToCenter > geom.radius
                ? geom.radius + offsetDist
                : geom.radius - offsetDist;

            if (newRadius <= 0) return null;

            return {
                id: crypto.randomUUID(),
                layerId: entity.layerId,
                color: entity.color,
                isVisible: true,
                isSelected: false,
                geometry: {
                    type: 'ARC',
                    center: geom.center,
                    radius: newRadius,
                    startAngle: geom.startAngle,
                    endAngle: geom.endAngle
                }
            };
        }
        else if (geom.type === 'RECTANGLE') {
            const g = geom as any;
            const distToCenter = distance(sidePoint, g.center);
            const diag = Math.hypot(g.width, g.height) / 2;
            const isOutside = distToCenter > diag;
            const sign = isOutside ? 1 : -1;
            const newW = g.width + 2 * offsetDist * sign;
            const newH = g.height + 2 * offsetDist * sign;
            if (newW <= 0 || newH <= 0) return null;
            return {
                id: crypto.randomUUID(),
                layerId: entity.layerId,
                color: entity.color,
                isVisible: true,
                isSelected: false,
                geometry: {
                    type: 'RECTANGLE',
                    center: g.center,
                    width: newW,
                    height: newH,
                    rotation: g.rotation || 0,
                }
            };
        }
        else if (geom.type === 'HEXAGON') {
            const g = geom as any;
            const distToCenter = distance(sidePoint, g.center);
            const isOutside = distToCenter > g.radius;
            const sign = isOutside ? 1 : -1;
            const newR = g.radius + offsetDist * sign;
            if (newR <= 0) return null;
            return {
                id: crypto.randomUUID(),
                layerId: entity.layerId,
                color: entity.color,
                isVisible: true,
                isSelected: false,
                geometry: {
                    type: 'HEXAGON',
                    center: g.center,
                    radius: newR,
                    rotation: g.rotation || 0,
                }
            };
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

/** Window selection: the whole entity lies inside the box. */
export function isEntityInsideBox(entity: CadEntity, box: BoundingBox): boolean {
    return primitivesInBox(geometryPrimitives(entity.geometry), box, 'window');
}

/** Crossing selection: the entity lies inside or touches the box. */
export function isEntityIntersectingBox(entity: CadEntity, box: BoundingBox): boolean {
    return primitivesInBox(geometryPrimitives(entity.geometry), box, 'crossing');
}
