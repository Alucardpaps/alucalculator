/**
 * 📐 ALUCAD GEOMETRY KERNEL
 * 
 * Strict mathematical core for 2D CAD operations.
 * Handles intersections, projections, and trimming logic.
 */

import { Point } from './types';

// Tolerance for floating point comparisons
const EPSILON = 0.0001;

// ============================================
// BASIC MATH
// ============================================

export function distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function distanceSquared(p1: Point, p2: Point): number {
    return Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
}

export function sub(p1: Point, p2: Point): Point {
    return { x: p1.x - p2.x, y: p1.y - p2.y };
}

export function add(p1: Point, p2: Point): Point {
    return { x: p1.x + p2.x, y: p1.y + p2.y };
}

export function scale(p: Point, s: number): Point {
    return { x: p.x * s, y: p.y * s };
}

export function dot(v1: Point, v2: Point): number {
    return v1.x * v2.x + v1.y * v2.y;
}

export function normalize(v: Point): Point {
    const len = Math.sqrt(v.x * v.x + v.y * v.y);
    return len === 0 ? { x: 0, y: 0 } : { x: v.x / len, y: v.y / len };
}

export function vector(p1: Point, p2: Point): Point {
    return { x: p2.x - p1.x, y: p2.y - p1.y };
}

export function perpendicular(v: Point): Point {
    return { x: -v.y, y: v.x };
}

export function midpoint(p1: Point, p2: Point): Point {
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

// Removed duplicates

// ============================================
// INTERSECTIONS
// ============================================

export function intersectLineLine(
    p1: Point, p2: Point,
    p3: Point, p4: Point,
    strict: boolean = true
): Point | null {
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;
    const x4 = p4.x, y4 = p4.y;

    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

    if (denom === 0) return null; // Parallel

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    // Strict intersection (segment to segment)
    if (strict) {
        if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
            return {
                x: x1 + ua * (x2 - x1),
                y: y1 + ua * (y2 - y1)
            };
        }
        return null; // Intersects outside segments
    }

    // Infinite line intersection
    return {
        x: x1 + ua * (x2 - x1),
        y: y1 + ua * (y2 - y1)
    };
}

// ============================================
// PROJECTION / NEAREST POINT
// ============================================

export function projectPointOnLine(p: Point, start: Point, end: Point, clamp: boolean = true): Point {
    const ap = sub(p, start);
    const ab = sub(end, start);
    const ab2 = distanceSquared(start, end);

    if (ab2 === 0) return start;

    let t = dot(ap, ab) / ab2;

    if (clamp) {
        if (t < 0) t = 0;
        else if (t > 1) t = 1;
    }

    return add(start, scale(ab, t));
}

// ============================================
// TRIM LOGIC
// ============================================

/**
 * Calculates new segments for a line being trimmed by a cutter.
 * Returns an array of resulting line segments (0, 1, or 2 lines).
 */
export function trimLineByCutter(
    target: { start: Point, end: Point },
    cutter: { start: Point, end: Point }
): { start: Point, end: Point }[] {

    const intersection = intersectLineLine(
        target.start, target.end,
        cutter.start, cutter.end,
        true // Strict intersection for now
    );

    if (!intersection) return [target]; // No intersection, no trim

    // Return two segments split by intersection
    return [
        { start: target.start, end: intersection },
        { start: intersection, end: target.end }
    ];
}

/**
 * Basic Extend Logic
 * Projects current line to intersect with boundary line (infinite).
 */
export function extendLineToBoundary(
    target: { start: Point, end: Point },
    boundary: { start: Point, end: Point }
): { start: Point, end: Point } | null {

    // Find intersection of infinite lines
    const intersection = intersectLineLine(
        target.start, target.end,
        boundary.start, boundary.end,
        false
    );

    if (!intersection) return null; // Parallel

    // To extend, the intersection must be "ahead" of one of the endpoints
    // Check which endpoint is closer to intersection and extend THAT one.

    const dStart = distanceSquared(target.start, intersection);
    const dEnd = distanceSquared(target.end, intersection);

    // If intersection is within the segment, we can't "extend" to it (it's already there)
    // But for simplicity, we'll assume we want to extend OUTWARDS.

    if (dEnd < dStart) {
        // Extend End
        return { start: target.start, end: intersection };
    } else {
        // Extend Start
        return { start: intersection, end: target.end };
    }
}

// ============================================
// TRANSFORMATIONS
// ============================================

export function rotatePoint(p: Point, center: Point, angleRad: number): Point {
    const s = Math.sin(angleRad);
    const c = Math.cos(angleRad);

    const px = p.x - center.x;
    const py = p.y - center.y;

    const xNew = px * c - py * s;
    const yNew = px * s + py * c;

    return {
        x: xNew + center.x,
        y: yNew + center.y
    };
}

export function mirrorPoint(p: Point, axisStart: Point, axisEnd: Point): Point {
    const dx = axisEnd.x - axisStart.x;
    const dy = axisEnd.y - axisStart.y;
    const a = (dx * (dx) - dy * (dy));
    const b = (2 * dx * dy);

    const x2 = axisStart.x + (a * (p.x - axisStart.x) + b * (p.y - axisStart.y)) / (dx * dx + dy * dy);
    const y2 = axisStart.y + (b * (p.x - axisStart.x) - a * (p.y - axisStart.y)) / (dx * dx + dy * dy);

    return { x: x2, y: y2 };
}
