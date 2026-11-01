/**
 * AluCAD — canvas paths of derived shapes.
 *
 * The geometry layer, the preview overlay and the ghost renderer all trace rectangles,
 * polygons, splines, ellipses and hatches through these helpers, built on the shared world
 * shape definitions, so screen, hit testing and export can never disagree.
 */

import type { Point } from '../kernel/types';
import { ellipseRange, polygonVertices, rectangleCorners, splineSegments } from '../kernel/shapes';
import { hatchPatternName, hatchSegments } from '../kernel/hatchPatterns';

type W2S = (p: Point) => Point;

function tracePolygon(ctx: CanvasRenderingContext2D, pts: Point[], w2s: W2S) {
    if (pts.length === 0) return;
    const p0 = w2s(pts[0]);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < pts.length; i++) {
        const p = w2s(pts[i]);
        ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
}

/** Adds a (rotated) rectangle to the current path. */
export function pathRectangle(ctx: CanvasRenderingContext2D, g: any, w2s: W2S) {
    tracePolygon(ctx, rectangleCorners(g), w2s);
}

/** Adds a regular N-sided polygon (HEXAGON entity) to the current path. */
export function pathPolygon(ctx: CanvasRenderingContext2D, g: any, w2s: W2S) {
    tracePolygon(ctx, polygonVertices(g), w2s);
}

/** Adds the spline curve (exact cubic Béziers through the picked points) to the current path. */
export function pathSpline(ctx: CanvasRenderingContext2D, points: Point[], closed: boolean, w2s: W2S) {
    const segs = splineSegments(points ?? [], closed && (points?.length ?? 0) > 2);
    if (segs.length === 0) return;
    const s0 = w2s(segs[0].p0);
    ctx.moveTo(s0.x, s0.y);
    for (const s of segs) {
        const c1 = w2s(s.c1), c2 = w2s(s.c2), p1 = w2s(s.p1);
        ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p1.x, p1.y);
    }
    if (closed) ctx.closePath();
}

/** Adds an ellipse or elliptical arc to the current path (world Y-up → canvas Y-down). */
export function pathEllipse(ctx: CanvasRenderingContext2D, g: any, w2s: W2S, zoom: number) {
    const c = w2s(g.center);
    const { start, sweep, full } = ellipseRange(g);
    const rx = Math.max(0.5, g.radiusX * zoom);
    const ry = Math.max(0.5, g.radiusY * zoom);
    if (full) ctx.ellipse(c.x, c.y, rx, ry, -(g.rotation || 0), 0, Math.PI * 2);
    else ctx.ellipse(c.x, c.y, rx, ry, -(g.rotation || 0), -start, -(start + sweep), true);
}

const hatchCache = new WeakMap<object, { key: string; segs: Array<[Point, Point]> }>();

/**
 * Draws a hatch in world space: tinted area, pattern lines (densified only when they
 * would merge on screen) and the boundary.
 */
export function drawHatch(
    ctx: CanvasRenderingContext2D,
    g: any,
    w2s: W2S,
    zoom: number,
    color: string,
    options: { selected?: boolean; tint?: string; border?: boolean } = {},
) {
    const outer: Point[] = g.boundaryVertices ?? [];
    if (outer.length < 3) return;
    const rings: Point[][] = [outer, ...((g.holes ?? []) as Point[][]).filter((h) => h && h.length >= 3)];
    const pattern = hatchPatternName(g.pattern);
    const scale = g.scale > 0 ? g.scale : 1;
    const angle = g.angle ?? 45;

    ctx.save();
    ctx.beginPath();
    for (const ring of rings) tracePolygon(ctx, ring, w2s);
    if (options.tint) {
        ctx.fillStyle = options.tint;
        ctx.fill('evenodd');
    }
    if (pattern === 'SOLID') {
        ctx.fillStyle = color;
        ctx.globalAlpha = options.selected ? 0.45 : 0.35;
        ctx.fill('evenodd');
        ctx.globalAlpha = 1;
    } else {
        // keep at least a few pixels between lines on screen
        const minPx = pattern === 'HONEYCOMB' ? 8 : 4;
        const spacingPx = 3.175 * scale * zoom;
        const displayScale = spacingPx < minPx ? scale * (minPx / Math.max(spacingPx, 1e-9)) : scale;
        const key = `${displayScale.toPrecision(6)}|${JSON.stringify(rings)}|${pattern}|${angle}`;
        let hit = hatchCache.get(g);
        if (!hit || hit.key !== key) {
            hit = { key, segs: hatchSegments(rings, pattern, displayScale, angle, 40_000).segments };
            hatchCache.set(g, hit);
        }
        ctx.beginPath();
        for (const [a, b] of hit.segs) {
            const pa = w2s(a), pb = w2s(b);
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = options.selected ? 1.2 : 0.8;
        ctx.stroke();
    }
    if (options.border !== false) {
        ctx.beginPath();
        for (const ring of rings) tracePolygon(ctx, ring, w2s);
        ctx.strokeStyle = color;
        ctx.lineWidth = options.selected ? 1.5 : 1;
        ctx.stroke();
    }
    ctx.restore();
}

/**
 * Strokes world-space primitives on the canvas (used for ghosts and generic previews, so
 * every entity type — including parametric machine elements — can be previewed).
 */
export function strokePrimitives(
    ctx: CanvasRenderingContext2D,
    prims: import('../kernel/primitiveTypes').Primitive[],
    w2s: W2S,
    zoom: number,
) {
    for (const p of prims) {
        switch (p.kind) {
            case 'line': {
                const a = w2s(p.a), b = w2s(p.b);
                ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                break;
            }
            case 'circle': {
                const c = w2s(p.c);
                ctx.beginPath(); ctx.arc(c.x, c.y, Math.max(0.5, p.r * zoom), 0, Math.PI * 2); ctx.stroke();
                break;
            }
            case 'arc': {
                const c = w2s(p.c);
                ctx.beginPath(); ctx.arc(c.x, c.y, Math.max(0.5, p.r * zoom), -p.start, -p.end, true); ctx.stroke();
                break;
            }
            case 'ellipse': {
                ctx.beginPath();
                const full = p.sweep >= Math.PI * 2 - 1e-9;
                pathEllipse(ctx, {
                    center: p.c, radiusX: p.rx, radiusY: p.ry, rotation: p.rotation,
                    ...(full ? {} : { startAngle: p.start, endAngle: p.start + p.sweep }),
                }, w2s, zoom);
                ctx.stroke();
                break;
            }
            case 'polyline': {
                if (p.points.length < 2) break;
                ctx.beginPath();
                const n = p.points.length;
                const p0 = w2s(p.points[0]);
                ctx.moveTo(p0.x, p0.y);
                const segs = p.closed ? n : n - 1;
                for (let i = 0; i < segs; i++) {
                    const a = p.points[i], b = p.points[(i + 1) % n];
                    const bulge = p.bulges?.[i] ?? 0;
                    if (Math.abs(bulge) > 1e-12) {
                        const theta = 4 * Math.atan(bulge);
                        const chord = Math.hypot(b.x - a.x, b.y - a.y);
                        const r = chord / (2 * Math.sin(Math.abs(theta) / 2));
                        const h = chord / 2 / Math.tan(theta / 2);
                        const cx = (a.x + b.x) / 2 - ((b.y - a.y) / chord) * h;
                        const cy = (a.y + b.y) / 2 + ((b.x - a.x) / chord) * h;
                        const a0 = Math.atan2(a.y - cy, a.x - cx);
                        const sc = w2s({ x: cx, y: cy });
                        // world CCW (θ > 0) is anticlockwise on the Y-down canvas with negated angles
                        ctx.arc(sc.x, sc.y, r * zoom, -a0, -(a0 + theta), theta > 0);
                    } else {
                        const q = w2s(b);
                        ctx.lineTo(q.x, q.y);
                    }
                }
                if (p.closed) ctx.closePath();
                if (p.fill) ctx.fill();
                ctx.stroke();
                break;
            }
            case 'spline':
                ctx.beginPath();
                pathSpline(ctx, p.points, p.closed, w2s);
                ctx.stroke();
                break;
            case 'text': {
                const pos = w2s(p.position);
                const size = Math.max(8, p.height * zoom);
                ctx.save();
                ctx.translate(pos.x, pos.y);
                if (p.rotation) ctx.rotate(-p.rotation);
                ctx.font = `${p.bold ? 'bold ' : ''}${size}px "JetBrains Mono", monospace`;
                ctx.textBaseline = 'top';
                ctx.textAlign = p.align;
                ctx.fillText(p.content, 0, 0);
                ctx.restore();
                break;
            }
            case 'point': {
                const q = w2s(p.p);
                ctx.beginPath(); ctx.moveTo(q.x - 4, q.y); ctx.lineTo(q.x + 4, q.y); ctx.moveTo(q.x, q.y - 4); ctx.lineTo(q.x, q.y + 4); ctx.stroke();
                break;
            }
            case 'hatch':
                drawHatch(ctx, { boundaryVertices: p.rings[0], holes: p.rings.slice(1), pattern: p.pattern, scale: p.scale, angle: p.angle }, w2s, zoom, String(ctx.strokeStyle), { border: false });
                break;
        }
    }
}
