/**
 * AluCalculator Engineering Kernel — Math Primitives
 * 
 * Core geometric primitives and utility functions.
 * Used by all other math modules.
 */

// ============================================
// TYPES
// ============================================

export interface Point2D {
    x: number;
    y: number;
}

export interface Point3D {
    x: number;
    y: number;
    z: number;
}

export interface Vector2D {
    x: number;
    y: number;
}

export interface Vector3D {
    x: number;
    y: number;
    z: number;
}

export interface Line2D {
    start: Point2D;
    end: Point2D;
}

export interface Arc2D {
    center: Point2D;
    radius: number;
    startAngle: number; // radians
    endAngle: number; // radians
    clockwise?: boolean;
}

export interface Circle2D {
    center: Point2D;
    radius: number;
}

export interface BoundingBox2D {
    min: Point2D;
    max: Point2D;
}

// ============================================
// CONSTANTS
// ============================================

export const PI = Math.PI;
export const TAU = 2 * Math.PI;
export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;
export const EPSILON = 1e-10;

// ============================================
// ANGLE FUNCTIONS
// ============================================

export function degToRad(deg: number): number {
    return deg * DEG_TO_RAD;
}

export function radToDeg(rad: number): number {
    return rad * RAD_TO_DEG;
}

export function normalizeAngle(angle: number): number {
    while (angle < 0) angle += TAU;
    while (angle >= TAU) angle -= TAU;
    return angle;
}

export function angleBetween(v1: Vector2D, v2: Vector2D): number {
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    return Math.acos(clamp(dot / (mag1 * mag2), -1, 1));
}

// ============================================
// POINT OPERATIONS
// ============================================

export function distance(p1: Point2D, p2: Point2D): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

export function distance3D(p1: Point3D, p2: Point3D): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2 + (p2.z - p1.z) ** 2);
}

export function midpoint(p1: Point2D, p2: Point2D): Point2D {
    return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
    };
}

export function lerp(p1: Point2D, p2: Point2D, t: number): Point2D {
    return {
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
    };
}

export function rotatePoint(p: Point2D, angle: number, center: Point2D = { x: 0, y: 0 }): Point2D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    return {
        x: center.x + dx * cos - dy * sin,
        y: center.y + dx * sin + dy * cos,
    };
}

export function scalePoint(p: Point2D, scale: number, center: Point2D = { x: 0, y: 0 }): Point2D {
    return {
        x: center.x + (p.x - center.x) * scale,
        y: center.y + (p.y - center.y) * scale,
    };
}

export function translatePoint(p: Point2D, dx: number, dy: number): Point2D {
    return { x: p.x + dx, y: p.y + dy };
}

// ============================================
// VECTOR OPERATIONS
// ============================================

export function vectorFromPoints(from: Point2D, to: Point2D): Vector2D {
    return { x: to.x - from.x, y: to.y - from.y };
}

export function vectorLength(v: Vector2D): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function normalizeVector(v: Vector2D): Vector2D {
    const len = vectorLength(v);
    if (len < EPSILON) return { x: 0, y: 0 };
    return { x: v.x / len, y: v.y / len };
}

export function scaleVector(v: Vector2D, scale: number): Vector2D {
    return { x: v.x * scale, y: v.y * scale };
}

export function addVectors(v1: Vector2D, v2: Vector2D): Vector2D {
    return { x: v1.x + v2.x, y: v1.y + v2.y };
}

export function dotProduct(v1: Vector2D, v2: Vector2D): number {
    return v1.x * v2.x + v1.y * v2.y;
}

export function crossProduct2D(v1: Vector2D, v2: Vector2D): number {
    return v1.x * v2.y - v1.y * v2.x;
}

export function perpendicularVector(v: Vector2D): Vector2D {
    return { x: -v.y, y: v.x };
}

// ============================================
// LINE OPERATIONS
// ============================================

export function lineLength(line: Line2D): number {
    return distance(line.start, line.end);
}

export function pointOnLine(line: Line2D, t: number): Point2D {
    return lerp(line.start, line.end, t);
}

export function closestPointOnLine(point: Point2D, line: Line2D): Point2D {
    const v = vectorFromPoints(line.start, line.end);
    const w = vectorFromPoints(line.start, point);

    const c1 = dotProduct(w, v);
    const c2 = dotProduct(v, v);

    if (c2 < EPSILON) return line.start;

    const t = clamp(c1 / c2, 0, 1);
    return pointOnLine(line, t);
}

export function distanceToLine(point: Point2D, line: Line2D): number {
    return distance(point, closestPointOnLine(point, line));
}

// ============================================
// CIRCLE/ARC OPERATIONS
// ============================================

export function pointOnCircle(circle: Circle2D, angle: number): Point2D {
    return {
        x: circle.center.x + circle.radius * Math.cos(angle),
        y: circle.center.y + circle.radius * Math.sin(angle),
    };
}

export function arcLength(arc: Arc2D): number {
    let sweep = arc.endAngle - arc.startAngle;
    if (arc.clockwise) sweep = -sweep;
    if (sweep < 0) sweep += TAU;
    return arc.radius * sweep;
}

export function generateArcPoints(arc: Arc2D, numPoints: number): Point2D[] {
    const points: Point2D[] = [];
    let sweep = arc.endAngle - arc.startAngle;
    if (arc.clockwise) sweep = -sweep;
    if (sweep < 0) sweep += TAU;

    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const angle = arc.startAngle + sweep * t * (arc.clockwise ? -1 : 1);
        points.push(pointOnCircle({ center: arc.center, radius: arc.radius }, angle));
    }

    return points;
}

// ============================================
// BOUNDING BOX
// ============================================

export function getBoundingBox(points: Point2D[]): BoundingBox2D {
    if (points.length === 0) {
        return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    points.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    });

    return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
}

export function expandBoundingBox(box: BoundingBox2D, margin: number): BoundingBox2D {
    return {
        min: { x: box.min.x - margin, y: box.min.y - margin },
        max: { x: box.max.x + margin, y: box.max.y + margin },
    };
}

export function boundingBoxCenter(box: BoundingBox2D): Point2D {
    return {
        x: (box.min.x + box.max.x) / 2,
        y: (box.min.y + box.max.y) / 2,
    };
}

export function boundingBoxSize(box: BoundingBox2D): { width: number; height: number } {
    return {
        width: box.max.x - box.min.x,
        height: box.max.y - box.min.y,
    };
}

// ============================================
// POLYLINE OPERATIONS
// ============================================

export function polylineLength(points: Point2D[]): number {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
        total += distance(points[i - 1], points[i]);
    }
    return total;
}

export function closedPolylineArea(points: Point2D[]): number {
    if (points.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }

    return Math.abs(area) / 2;
}

export function polylineCentroid(points: Point2D[]): Point2D {
    if (points.length === 0) return { x: 0, y: 0 };

    let cx = 0, cy = 0;
    points.forEach(p => {
        cx += p.x;
        cy += p.y;
    });

    return { x: cx / points.length, y: cy / points.length };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function almostEqual(a: number, b: number, epsilon: number = EPSILON): boolean {
    return Math.abs(a - b) < epsilon;
}

export function roundTo(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

export function mapRange(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
): number {
    return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}
