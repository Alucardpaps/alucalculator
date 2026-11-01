/**
 * AluCAD — shared 2-D shape helpers.
 *
 * One definition of every derived shape (rectangle corners, regular polygons, the spline
 * curve, ellipse samples), used by the renderer, hit testing, snapping, the geometry
 * kernel and every exporter, so that what is drawn is exactly what is selected and exported.
 *
 * World coordinates are Y-up; angles are radians, counter-clockwise.
 */

import type { Point } from './types';

export const TAU = Math.PI * 2;

export const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Angle normalised to [0, 2π). */
export function normAngle(a: number): number {
    const t = a % TAU;
    return t < 0 ? t + TAU : t;
}

/**
 * Counter-clockwise sweep of an arc from `start` to `end`, matching how the canvas draws it
 * (an end angle a full turn or more past the start is a full circle).
 */
export function ccwSweep(start: number, end: number): number {
    if (end - start >= TAU - 1e-12) return TAU;
    return normAngle(end - start);
}

/** Polyline bulge for a signed sweep (+ counter-clockwise). */
export const bulgeFromSweep = (sweep: number) => Math.tan(sweep / 4);

// ─── rectangles and regular polygons ───────────────────────────────────────

export interface RectangleLike {
    center?: Point;
    width: number;
    height: number;
    rotation?: number;
    /** legacy top-left origin used when no centre is stored */
    x?: number;
    y?: number;
}

/** Corners counter-clockwise from the local bottom-left, rotation applied about the centre. */
export function rectangleCorners(g: RectangleLike): Point[] {
    const hw = (g.width || 0) / 2;
    const hh = (g.height || 0) / 2;
    const cx = g.center ? g.center.x : (g.x ?? 0) + hw;
    const cy = g.center ? g.center.y : (g.y ?? 0) + hh;
    const rot = g.rotation || 0;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    return [
        { x: -hw, y: -hh },
        { x: hw, y: -hh },
        { x: hw, y: hh },
        { x: -hw, y: hh },
    ].map((p) => ({ x: cx + p.x * cos - p.y * sin, y: cy + p.x * sin + p.y * cos }));
}

export interface PolygonLike {
    center?: Point;
    radius: number;
    rotation?: number;
    /** number of sides (the HEXAGON entity doubles as the N-sided polygon) */
    sides?: number;
    x?: number;
    y?: number;
}

export const polygonSides = (g: { sides?: number }) => Math.max(3, Math.round(g.sides ?? 6));

/** Vertices of a regular polygon; vertex 0 sits at `rotation` on the circumscribed circle. */
export function polygonVertices(g: PolygonLike): Point[] {
    const n = polygonSides(g);
    const cx = g.center ? g.center.x : (g.x ?? 0);
    const cy = g.center ? g.center.y : (g.y ?? 0);
    const r = g.radius || 0;
    const rot = g.rotation || 0;
    const pts: Point[] = [];
    for (let i = 0; i < n; i++) {
        const a = rot + (TAU * i) / n;
        pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
    return pts;
}

// ─── spline: centripetal Catmull-Rom through the picked points ─────────────

/** Cubic Bézier segment from `p0` to `p1` with control points `c1`, `c2`. */
export interface CubicSegment {
    p0: Point;
    c1: Point;
    c2: Point;
    p1: Point;
}

function dedupe(points: Point[], closed: boolean): Point[] {
    const out: Point[] = [];
    for (const p of points) {
        const last = out[out.length - 1];
        if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 1e-9) out.push({ x: p.x, y: p.y });
    }
    if (closed && out.length > 2) {
        const a = out[0];
        const b = out[out.length - 1];
        if (Math.hypot(a.x - b.x, a.y - b.y) <= 1e-9) out.pop();
    }
    return out;
}

/**
 * The spline curve as cubic Bézier segments: a centripetal (α = 0.5) Catmull-Rom curve that
 * passes through every picked point, never forms cusps or self-loops within a segment, and
 * is periodic when closed.
 */
export function splineSegments(points: Point[], closed = false): CubicSegment[] {
    const pts = dedupe(points ?? [], closed);
    const n = pts.length;
    if (n < 2) return [];
    if (n === 2) {
        const [a, b] = pts;
        const seg: CubicSegment = {
            p0: a,
            c1: { x: a.x + (b.x - a.x) / 3, y: a.y + (b.y - a.y) / 3 },
            c2: { x: a.x + (2 * (b.x - a.x)) / 3, y: a.y + (2 * (b.y - a.y)) / 3 },
            p1: b,
        };
        return closed ? [seg, { p0: b, c1: seg.c2, c2: seg.c1, p1: a }] : [seg];
    }
    const at = (i: number): Point => {
        if (closed) return pts[((i % n) + n) % n];
        return pts[Math.min(n - 1, Math.max(0, i))];
    };
    const segCount = closed ? n : n - 1;
    const segments: CubicSegment[] = [];
    const EPS = 1e-12;
    for (let i = 0; i < segCount; i++) {
        const P0 = at(i - 1);
        const P1 = at(i);
        const P2 = at(i + 1);
        const P3 = at(i + 2);
        // |Δ|^α and |Δ|^{2α} with α = 0.5
        const l01 = Math.hypot(P1.x - P0.x, P1.y - P0.y);
        const l12 = Math.hypot(P2.x - P1.x, P2.y - P1.y);
        const l23 = Math.hypot(P3.x - P2.x, P3.y - P2.y);
        const d1 = Math.sqrt(l01), d2 = Math.sqrt(l12), d3 = Math.sqrt(l23);
        let c1: Point = { x: P1.x, y: P1.y };
        if (d1 > EPS) {
            const a = 2 * l01 + 3 * d1 * d2 + l12;
            const m = 3 * d1 * (d1 + d2);
            c1 = { x: (P1.x * a - P0.x * l12 + P2.x * l01) / m, y: (P1.y * a - P0.y * l12 + P2.y * l01) / m };
        }
        let c2: Point = { x: P2.x, y: P2.y };
        if (d3 > EPS) {
            const b = 2 * l23 + 3 * d3 * d2 + l12;
            const m = 3 * d3 * (d3 + d2);
            c2 = { x: (P2.x * b + P1.x * l23 - P3.x * l12) / m, y: (P2.y * b + P1.y * l23 - P3.y * l12) / m };
        }
        segments.push({ p0: P1, c1, c2, p1: P2 });
    }
    return segments;
}

export function cubicPoint(s: CubicSegment, t: number): Point {
    const u = 1 - t;
    const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return {
        x: a * s.p0.x + b * s.c1.x + c * s.c2.x + d * s.p1.x,
        y: a * s.p0.y + b * s.c1.y + c * s.c2.y + d * s.p1.y,
    };
}

/** Uniform subdivision count that keeps the chord error of a cubic below `tolerance`. */
export function cubicSubdivisions(s: CubicSegment, tolerance: number): number {
    const ax = s.p0.x - 2 * s.c1.x + s.c2.x, ay = s.p0.y - 2 * s.c1.y + s.c2.y;
    const bx = s.c1.x - 2 * s.c2.x + s.p1.x, by = s.c1.y - 2 * s.c2.y + s.p1.y;
    const m = 6 * Math.max(Math.hypot(ax, ay), Math.hypot(bx, by));
    return Math.min(256, Math.max(1, Math.ceil(Math.sqrt(m / (8 * Math.max(tolerance, 1e-6))))));
}

/** Points along cubic segments (first point included once). */
export function flattenCubics(segments: CubicSegment[], tolerance = 0.02): Point[] {
    if (segments.length === 0) return [];
    const out: Point[] = [{ ...segments[0].p0 }];
    for (const s of segments) {
        const n = cubicSubdivisions(s, tolerance);
        for (let i = 1; i <= n; i++) out.push(cubicPoint(s, i / n));
    }
    return out;
}

/** Sampled spline curve; for a closed spline the last point equals the first. */
export function splinePoints(points: Point[], closed = false, tolerance = 0.02): Point[] {
    const segs = splineSegments(points, closed);
    if (segs.length === 0) return (points ?? []).map((p) => ({ x: p.x, y: p.y }));
    return flattenCubics(segs, tolerance);
}

// ─── ellipse ───────────────────────────────────────────────────────────────

export interface EllipseLike {
    center: Point;
    radiusX: number;
    radiusY: number;
    rotation?: number;
    startAngle?: number;
    endAngle?: number;
}

export function ellipsePoint(g: EllipseLike, t: number): Point {
    const rot = g.rotation || 0;
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const lx = g.radiusX * Math.cos(t);
    const ly = g.radiusY * Math.sin(t);
    return { x: g.center.x + lx * cos - ly * sin, y: g.center.y + lx * sin + ly * cos };
}

/** Parametric range of an ellipse (start, sweep); a missing range is the full ellipse. */
export function ellipseRange(g: EllipseLike): { start: number; sweep: number; full: boolean } {
    if (g.startAngle === undefined && g.endAngle === undefined) return { start: 0, sweep: TAU, full: true };
    const start = g.startAngle ?? 0;
    const sweep = ccwSweep(start, g.endAngle ?? start + TAU);
    return { start, sweep, full: sweep >= TAU - 1e-9 };
}

/** Sampled ellipse (or elliptical arc) with chord error below `tolerance`. */
export function ellipsePoints(g: EllipseLike, tolerance = 0.02): Point[] {
    const { start, sweep, full } = ellipseRange(g);
    const r = Math.max(Math.abs(g.radiusX), Math.abs(g.radiusY), 1e-9);
    const step = 2 * Math.acos(Math.max(-1, 1 - Math.max(tolerance, 1e-6) / r));
    const n = Math.min(1440, Math.max(full ? 24 : 4, Math.ceil(sweep / Math.max(step, 1e-3))));
    const pts: Point[] = [];
    for (let i = 0; i <= n; i++) pts.push(ellipsePoint(g, start + (sweep * i) / n));
    if (full) pts[pts.length - 1] = { ...pts[0] };
    return pts;
}
