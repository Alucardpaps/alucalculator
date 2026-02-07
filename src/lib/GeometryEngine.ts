import { Point, CADShape } from '@/store/CADCanvasStore';

// ============================================
// Types
// ============================================

export interface IntersectionPoint {
    point: Point;
    t1: number; // Parameter on shape 1 (0-1 for lines)
    t2: number; // Parameter on shape 2
}

// ============================================
// Math Helpers
// ============================================

const EPSILON = 0.0001;

export const distSq = (p1: Point, p2: Point) => (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
export const dist = (p1: Point, p2: Point) => Math.sqrt(distSq(p1, p2));

// ============================================
// Line Math
// ============================================

/**
 * Line-Line Intersection
 * Returns point and parameter t (0 <= t <= 1 means on segment)
 */
export const intersectLineLine = (
    p1: Point, p2: Point,
    p3: Point, p4: Point
): IntersectionPoint | null => {
    const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);

    if (Math.abs(d) < EPSILON) return null; // Parallel

    const t1 = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
    const t2 = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;

    // Standard check is 0 <= t <= 1, but we might want infinite line intersections for Extension
    const point = {
        x: p1.x + t1 * (p2.x - p1.x),
        y: p1.y + t1 * (p2.y - p1.y)
    };

    return { point, t1, t2 };
};

/**
 * Closest point on segment to a point
 */
export const closestPointOnSegment = (p: Point, a: Point, b: Point): Point => {
    const l2 = distSq(a, b);
    if (l2 === 0) return a;

    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = Math.max(0, Math.min(1, t));

    return {
        x: a.x + t * (b.x - a.x),
        y: a.y + t * (b.y - a.y)
    };
};

// ============================================
// Arc/Circle Math
// ============================================

// Todo: Implement Circle-Line and Circle-Circle intersection

// ============================================
// Shape Operations
// ============================================

export const getShapeIntersections = (s1: CADShape, s2: CADShape): Point[] => {
    const intersections: Point[] = [];

    // Simple Line-Line for now
    if (s1.type === 'line' && s2.type === 'line') {
        const result = intersectLineLine(
            s1.points[0], s1.points[1],
            s2.points[0], s2.points[1]
        );

        // Strict segment intersection
        if (result &&
            result.t1 >= 0 && result.t1 <= 1 &&
            result.t2 >= 0 && result.t2 <= 1) {
            intersections.push(result.point);
        }
    }

    // Rectangle decomposition
    if (s1.type === 'rectangle') {
        const lines1 = [
            { p1: s1.points[0], p2: { x: s1.points[1].x, y: s1.points[0].y } },
            { p1: { x: s1.points[1].x, y: s1.points[0].y }, p2: s1.points[1] },
            { p1: s1.points[1], p2: { x: s1.points[0].x, y: s1.points[1].y } },
            { p1: { x: s1.points[0].x, y: s1.points[1].y }, p2: s1.points[0] }
        ];

        if (s2.type === 'line') {
            lines1.forEach(l => {
                const res = intersectLineLine(l.p1, l.p2, s2.points[0], s2.points[1]);
                if (res && res.t1 >= 0 && res.t1 <= 1 && res.t2 >= 0 && res.t2 <= 1) {
                    intersections.push(res.point);
                }
            });
        }
    }

    return intersections;
};
