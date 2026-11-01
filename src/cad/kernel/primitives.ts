/**
 * AluCAD — entity → drawing primitives.
 *
 * Every geometry type decomposes into a handful of primitive kinds (line, arc, circle,
 * ellipse, polyline with bulges, spline, text, point, hatch). Exporters (DXF, SVG, PDF,
 * G-code), EXPLODE, hit testing and window selection all consume this one decomposition,
 * so an entity is cut, printed and selected exactly as it is drawn.
 *
 * Parametric machine elements (gear, sprocket, planetary set, fastener, belt drive) are
 * decomposed by replaying their canvas drawing code into a recording context.
 */

import type { CadEntity, GeometryType, Point } from './types';
import type { Primitive, PrimStyle, TextPrim } from './primitiveTypes';
import {
    TAU,
    bulgeFromSweep,
    ccwSweep,
    dist,
    ellipsePoints,
    ellipseRange,
    flattenCubics,
    normAngle,
    polygonVertices,
    rectangleCorners,
    splineSegments,
} from './shapes';
import { hatchPatternName, hatchSegments } from './hatchPatterns';
import { recordDrawing } from '../render/recordingContext';
import * as parametric from '../render/parametricDraw';
import { arcPoints, bulgeArc } from '@/lib/dxf/dxfGeometry';

export type { Primitive, PrimStyle } from './primitiveTypes';

/** ISO 3098 / ISO 129 sizes used when annotations are converted to drawing geometry (mm). */
export const ANNOTATION = {
    textHeight: 3.5,
    toleranceScale: 0.7,
    arrowLength: 3,
    arrowHalfAngle: (15 * Math.PI) / 180,
    extensionOvershoot: 2,
    defaultDimOffset: 10,
    leaderShoulder: 6,
    textGap: 1,
} as const;

// ─── dimension text (shared with the canvas overlay) ───────────────────────

export interface DimensionLabel {
    text: string;
    upper?: string;
    lower?: string;
}

const signed = (v: number, decimals: number, suffix = '') => `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}${suffix}`;

/** The dimension's value text exactly as the canvas shows it (mm or inch display units). */
export function dimensionLabel(g: { text?: string; value?: number; start: Point; end: Point; tolUpper?: number; tolLower?: number }, units: 'mm' | 'in' | string = 'mm'): DimensionLabel {
    const isInch = units === 'in';
    const measured = g.value ?? dist(g.start, g.end);
    let text = g.text;
    if (isInch) {
        if (text && typeof text === 'string') {
            const match = text.match(/^([^\d.-]*)([-+]?\d*\.?\d+)(\s*(?:mm|in|")?)?$/);
            if (match) {
                const valNum = parseFloat(match[2]);
                if (!Number.isNaN(valNum)) {
                    const already = match[3] && (match[3].includes('in') || match[3].includes('"'));
                    const valIn = already ? valNum : valNum / 25.4;
                    text = `${match[1] || ''}${valIn.toFixed(valIn < 1 ? 3 : 2)}"`;
                }
            }
        } else {
            const inVal = measured / 25.4;
            text = `${inVal.toFixed(inVal < 1 ? 3 : 2)}"`;
        }
    } else if (!text) {
        text = `${measured.toFixed(2)} mm`;
    }
    const label: DimensionLabel = { text: text ?? '' };
    if (g.tolUpper !== undefined || g.tolLower !== undefined) {
        const k = isInch ? 1 / 25.4 : 1;
        const dec = isInch ? 4 : 3;
        const suffix = isInch ? '"' : '';
        label.upper = signed((g.tolUpper ?? 0) * k, dec, suffix);
        label.lower = signed((g.tolLower ?? 0) * k, dec, suffix);
    }
    return label;
}

/** Readable text rotation along a direction (never upside down). */
function readableAngle(a: number): number {
    let r = normAngle(a);
    if (r > Math.PI / 2 + 1e-9 && r <= (3 * Math.PI) / 2 + 1e-9) r -= Math.PI;
    return r;
}

/** Approximate advance width of monospace text (the canvas uses a monospace font). */
export const textWidth = (content: string, height: number) => content.length * height * 0.6;

/** Point that is `up` above and `along` along a text baseline direction. */
function offsetPoint(p: Point, rot: number, along: number, up: number): Point {
    return { x: p.x + along * Math.cos(rot) - up * Math.sin(rot), y: p.y + along * Math.sin(rot) + up * Math.cos(rot) };
}

function arrowHead(tip: Point, towards: number, style: PrimStyle = 'continuous'): Primitive {
    const L = ANNOTATION.arrowLength, h = ANNOTATION.arrowHalfAngle;
    return {
        kind: 'polyline',
        points: [
            tip,
            { x: tip.x + L * Math.cos(towards + h), y: tip.y + L * Math.sin(towards + h) },
            { x: tip.x + L * Math.cos(towards - h), y: tip.y + L * Math.sin(towards - h) },
        ],
        closed: true,
        fill: true,
        style,
    };
}

/** Linear/aligned dimension as drawing geometry (extension lines, dimension line, arrows, text). */
export function dimensionPrimitives(g: any, units: string = 'mm'): Primitive[] {
    if (!g?.start || !g?.end) return [];
    const p1: Point = g.start, p2: Point = g.end;
    const len = dist(p1, p2);
    if (len < 1e-9) return [];
    const ux = (p2.x - p1.x) / len, uy = (p2.y - p1.y) / len;
    const nx = -uy, ny = ux;
    let offset: number = ANNOTATION.defaultDimOffset;
    if (g.textPoint) {
        const proj = (g.textPoint.x - p1.x) * nx + (g.textPoint.y - p1.y) * ny;
        if (Math.abs(proj) > 1e-6) offset = proj;
    }
    const sign = offset >= 0 ? 1 : -1;
    const d1 = { x: p1.x + nx * offset, y: p1.y + ny * offset };
    const d2 = { x: p2.x + nx * offset, y: p2.y + ny * offset };
    const over = ANNOTATION.extensionOvershoot * sign;
    const prims: Primitive[] = [
        { kind: 'line', a: p1, b: { x: d1.x + nx * over, y: d1.y + ny * over }, style: 'thin' },
        { kind: 'line', a: p2, b: { x: d2.x + nx * over, y: d2.y + ny * over }, style: 'thin' },
        { kind: 'line', a: d1, b: d2, style: 'thin' },
    ];
    const ang = Math.atan2(uy, ux);
    prims.push(arrowHead(d1, ang, 'thin'), arrowHead(d2, ang + Math.PI, 'thin'));

    const label = dimensionLabel(g, units);
    const h = ANNOTATION.textHeight;
    const rot = readableAngle(ang);
    const mid = { x: (d1.x + d2.x) / 2, y: (d1.y + d2.y) / 2 };
    // ISO 129: the value sits just above the dimension line, read from the bottom or the right
    const top = offsetPoint(mid, rot, 0, ANNOTATION.textGap + h);
    if (label.upper !== undefined) {
        const th = h * ANNOTATION.toleranceScale;
        const nomW = textWidth(label.text, h);
        const tolW = Math.max(textWidth(label.upper, th), textWidth(label.lower ?? '', th));
        const shift = -tolW / 2;
        prims.push(text(offsetPoint(top, rot, shift, 0), label.text, h, rot, 'center'));
        const tolLeft = offsetPoint(top, rot, shift + nomW / 2 + ANNOTATION.textGap, 0);
        prims.push(text(offsetPoint(tolLeft, rot, 0, th * 0.35), label.upper, th, rot, 'left'));
        prims.push(text(offsetPoint(tolLeft, rot, 0, -th * 0.75), label.lower ?? '', th, rot, 'left'));
    } else {
        prims.push(text(top, label.text, h, rot, 'center'));
    }
    return prims;
}

function text(position: Point, content: string, height: number, rotation: number, align: TextPrim['align']): TextPrim {
    return { kind: 'text', position, content, height, rotation, align, style: 'continuous' };
}

/** Leader: line with an arrowhead at its start, a horizontal shoulder and the note text. */
export function leaderPrimitives(g: any): Primitive[] {
    if (!g?.start || !g?.end) return [];
    const s: Point = g.start, e: Point = g.end;
    const right = e.x >= s.x;
    const shoulderEnd = { x: e.x + (right ? 1 : -1) * ANNOTATION.leaderShoulder, y: e.y };
    const prims: Primitive[] = [
        { kind: 'polyline', points: [s, e, shoulderEnd], closed: false, style: 'thin' },
    ];
    if (dist(s, e) > 1e-9) prims.push(arrowHead(s, Math.atan2(e.y - s.y, e.x - s.x), 'thin'));
    const content = String(g.text || 'NOTE');
    const h = ANNOTATION.textHeight;
    const anchor = { x: right ? e.x + ANNOTATION.textGap : e.x - ANNOTATION.textGap, y: e.y + ANNOTATION.textGap + h };
    prims.push(text(anchor, content, h, 0, right ? 'left' : 'right'));
    return prims;
}

// ─── decomposition ──────────────────────────────────────────────────────────

const cache = new WeakMap<object, { sig: string; prims: Primitive[] }>();

function cached(g: object, build: () => Primitive[]): Primitive[] {
    const sig = JSON.stringify(g);
    const hit = cache.get(g);
    if (hit && hit.sig === sig) return hit.prims;
    const prims = build();
    cache.set(g, { sig, prims });
    return prims;
}

/** World-space primitives of a geometry, exactly as the canvas draws it. */
export function geometryPrimitives(g: GeometryType | undefined | null, units: string = 'mm'): Primitive[] {
    if (!g) return [];
    const geo = g as any;
    switch (g.type) {
        case 'LINE':
            return [{ kind: 'line', a: g.start, b: g.end, style: 'continuous' }];
        case 'CIRCLE':
            return g.radius > 0 ? [{ kind: 'circle', c: g.center, r: g.radius, style: 'continuous' }] : [];
        case 'ARC': {
            const sweep = ccwSweep(g.startAngle, g.endAngle);
            if (!(g.radius > 0) || sweep < 1e-12) return [];
            if (sweep >= TAU - 1e-12) return [{ kind: 'circle', c: g.center, r: g.radius, style: 'continuous' }];
            return [{ kind: 'arc', c: g.center, r: g.radius, start: normAngle(g.startAngle), end: normAngle(g.startAngle + sweep), style: 'continuous' }];
        }
        case 'POLYLINE': {
            const pts = (g.vertices ?? (geo.points as Point[]) ?? []).filter(Boolean);
            if (pts.length < 2) return [];
            return [{ kind: 'polyline', points: pts, closed: Boolean(g.closed ?? geo.isClosed) && pts.length > 2, style: 'continuous' }];
        }
        case 'POINT': {
            const x = geo.x ?? geo.position?.x;
            const y = geo.y ?? geo.position?.y;
            return Number.isFinite(x) && Number.isFinite(y) ? [{ kind: 'point', p: { x, y }, style: 'continuous' }] : [];
        }
        case 'RECTANGLE':
            return [{ kind: 'polyline', points: rectangleCorners(geo), closed: true, style: 'continuous' }];
        case 'HEXAGON':
            return [{ kind: 'polyline', points: polygonVertices(geo), closed: true, style: 'continuous' }];
        case 'ELLIPSE': {
            if (!g.center || !(g.radiusX > 0) || !(g.radiusY > 0)) return [];
            const { start, sweep } = ellipseRange(g);
            return [{ kind: 'ellipse', c: g.center, rx: g.radiusX, ry: g.radiusY, rotation: g.rotation || 0, start, sweep, style: 'continuous' }];
        }
        case 'SPLINE': {
            const pts = g.controlPoints ?? [];
            if (pts.length < 2) return [];
            const closed = Boolean(g.closed) && pts.length > 2;
            return [{ kind: 'spline', points: pts, closed, beziers: splineSegments(pts, closed), style: 'continuous' }];
        }
        case 'TEXT': {
            if (!g.position || !String(g.content ?? '').trim()) return [];
            return [{
                kind: 'text', position: g.position, content: String(g.content), height: g.fontSize || 3.5,
                rotation: g.rotation || 0, align: g.justification || 'left', bold: g.bold, italic: g.italic, style: 'continuous',
            }];
        }
        case 'LEADER':
            return leaderPrimitives(g);
        case 'DIMENSION':
            return dimensionPrimitives(g, units);
        case 'HATCH': {
            const outer = g.boundaryVertices ?? [];
            if (outer.length < 3) return [];
            const rings = [outer, ...((g.holes ?? []).filter((h) => h && h.length >= 3))];
            const prims: Primitive[] = [{
                kind: 'hatch', rings, pattern: hatchPatternName(g.pattern), scale: hatchPatternScale(g), angle: g.angle ?? 45, style: 'thin',
            }];
            if (g.strokeBorder !== false) {
                for (const ring of rings) prims.push({ kind: 'polyline', points: ring, closed: true, style: 'continuous' });
            }
            return prims;
        }
        case 'GEAR':
            return cached(g, () => recordDrawing((ctx, w2s, z) => parametric.drawGear(ctx, g, w2s, z)));
        case 'FASTENER':
            return cached(g, () => recordDrawing((ctx, w2s, z) => parametric.drawFastener(ctx, g, w2s, z)));
        case 'BELT_PULLEY':
            return cached(g, () => recordDrawing((ctx, w2s, z) => parametric.drawBeltPulley(ctx, g, w2s, z)));
        case 'PLANETARY_GEAR':
            return cached(g, () => recordDrawing((ctx, w2s, z) => parametric.drawPlanetaryGear(ctx, g, w2s, z)));
        case 'SPROCKET':
            return cached(g, () => recordDrawing((ctx, w2s, z) => parametric.drawSprocket(ctx, g, w2s, z)));
        default:
            return [];
    }
}

export function entityPrimitives(entity: CadEntity, units: string = 'mm'): Primitive[] {
    return geometryPrimitives(entity.geometry, units);
}

/** Hatch scale is the AutoCAD pattern scale (1 → ANSI31 lines 3.175 mm apart, acadiso.pat). */
export function hatchPatternScale(g: { scale?: number }): number {
    return g.scale && g.scale > 0 ? g.scale : 1;
}

// ─── flattening and measurement ─────────────────────────────────────────────

/** Polyline points of a polyline primitive with its bulge arcs expanded. */
export function polylinePrimPoints(p: { points: Point[]; bulges?: number[]; closed: boolean }, tolerance = 0.02): Point[] {
    const pts = p.points;
    const n = pts.length;
    if (!p.bulges || p.bulges.every((b) => !b)) return p.closed && n > 2 ? [...pts, pts[0]] : [...pts];
    const out: Point[] = [];
    const segs = p.closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
        const a = pts[i], b = pts[(i + 1) % n];
        if (i === 0) out.push(a);
        const bulge = p.bulges[i] ?? 0;
        if (Math.abs(bulge) > 1e-12) {
            const arc = bulgeArc(a, b, bulge);
            if (arc) {
                const ap = arcPointsTol(arc.cx, arc.cy, arc.r, arc.a0, arc.sweep, tolerance);
                out.push(...ap.slice(1, -1));
            }
        }
        out.push(b);
    }
    if (n === 1) out.push(pts[0]);
    return out;
}

function arcPointsTol(cx: number, cy: number, r: number, a0: number, sweep: number, tolerance: number): Point[] {
    if (tolerance >= 0.05) return arcPoints(cx, cy, r, a0, sweep);
    const step = 2 * Math.acos(Math.max(-1, 1 - tolerance / Math.max(r, 1e-9)));
    const n = Math.min(2880, Math.max(2, Math.ceil(Math.abs(sweep) / Math.max(step, 1e-4))));
    const out: Point[] = [];
    for (let i = 0; i <= n; i++) {
        const t = a0 + (sweep * i) / n;
        out.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
    }
    return out;
}

/**
 * Primitive as one or more point chains (curves flattened to `tolerance`).
 * Text and points return an empty list; hatches return their pattern lines.
 */
export function flattenPrimitive(p: Primitive, tolerance = 0.02): Point[][] {
    switch (p.kind) {
        case 'line':
            return [[p.a, p.b]];
        case 'circle':
            return [arcPointsTol(p.c.x, p.c.y, p.r, 0, TAU, tolerance)];
        case 'arc':
            return [arcPointsTol(p.c.x, p.c.y, p.r, p.start, ccwSweep(p.start, p.end), tolerance)];
        case 'ellipse':
            return [ellipsePoints({ center: p.c, radiusX: p.rx, radiusY: p.ry, rotation: p.rotation, startAngle: p.sweep >= TAU - 1e-9 ? undefined : p.start, endAngle: p.sweep >= TAU - 1e-9 ? undefined : p.start + p.sweep }, tolerance)];
        case 'polyline':
            return [polylinePrimPoints(p, tolerance)];
        case 'spline': {
            const pts = flattenCubics(p.beziers, tolerance);
            return pts.length ? [pts] : [];
        }
        case 'hatch': {
            if (p.pattern === 'SOLID') return p.rings.map((r) => [...r, r[0]]);
            return hatchSegments(p.rings, p.pattern, p.scale, p.angle).segments.map(([a, b]) => [a, b]);
        }
        default:
            return [];
    }
}

export interface Bounds { minX: number; minY: number; maxX: number; maxY: number }

const emptyBounds = (): Bounds => ({ minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

function grow(b: Bounds, x: number, y: number) {
    if (x < b.minX) b.minX = x;
    if (x > b.maxX) b.maxX = x;
    if (y < b.minY) b.minY = y;
    if (y > b.maxY) b.maxY = y;
}

/** Corners of a text primitive's box (top-anchored, rotated, horizontally aligned). */
export function textBox(t: TextPrim): Point[] {
    const w = textWidth(t.content, t.height);
    const x0 = t.align === 'center' ? -w / 2 : t.align === 'right' ? -w : 0;
    const local = [{ x: x0, y: 0 }, { x: x0 + w, y: 0 }, { x: x0 + w, y: -t.height }, { x: x0, y: -t.height }];
    const c = Math.cos(t.rotation), s = Math.sin(t.rotation);
    return local.map((p) => ({ x: t.position.x + p.x * c - p.y * s, y: t.position.y + p.x * s + p.y * c }));
}

/** Arc bounding box (exact: end points plus the quadrant points inside the sweep). */
function arcBounds(b: Bounds, c: Point, r: number, start: number, sweep: number) {
    grow(b, c.x + r * Math.cos(start), c.y + r * Math.sin(start));
    grow(b, c.x + r * Math.cos(start + sweep), c.y + r * Math.sin(start + sweep));
    for (let k = 0; k < 4; k++) {
        const q = (k * Math.PI) / 2;
        if (normAngle(q - start) <= sweep + 1e-12) grow(b, c.x + r * Math.cos(q), c.y + r * Math.sin(q));
    }
}

export function primitiveBounds(prims: Primitive[]): Bounds | null {
    const b = emptyBounds();
    for (const p of prims) {
        switch (p.kind) {
            case 'line': grow(b, p.a.x, p.a.y); grow(b, p.b.x, p.b.y); break;
            case 'circle': grow(b, p.c.x - p.r, p.c.y - p.r); grow(b, p.c.x + p.r, p.c.y + p.r); break;
            case 'arc': arcBounds(b, p.c, p.r, p.start, ccwSweep(p.start, p.end)); break;
            case 'point': grow(b, p.p.x, p.p.y); break;
            case 'text': for (const q of textBox(p)) grow(b, q.x, q.y); break;
            case 'hatch': for (const r of p.rings) for (const q of r) grow(b, q.x, q.y); break;
            case 'polyline':
                if (p.bulges?.some((x) => x)) { for (const q of polylinePrimPoints(p, 0.05)) grow(b, q.x, q.y); }
                else for (const q of p.points) grow(b, q.x, q.y);
                break;
            default:
                for (const chain of flattenPrimitive(p, 0.05)) for (const q of chain) grow(b, q.x, q.y);
        }
    }
    return Number.isFinite(b.minX) ? b : null;
}

function segDist(p: Point, a: Point, b: Point): number {
    const dx = b.x - a.x, dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    if (l2 < 1e-24) return dist(p, a);
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function pointInRing(p: Point, ring: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const a = ring[i], b = ring[j];
        if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
    }
    return inside;
}

/** Shortest distance from a point to the drawn primitives (inside text boxes and fills = 0). */
export function distanceToPrimitives(p: Point, prims: Primitive[], tolerance = 0.05): number {
    let best = Infinity;
    for (const pr of prims) {
        let d = Infinity;
        switch (pr.kind) {
            case 'line': d = segDist(p, pr.a, pr.b); break;
            case 'circle': d = Math.abs(dist(p, pr.c) - pr.r); break;
            case 'arc': {
                const sweep = ccwSweep(pr.start, pr.end);
                const ang = Math.atan2(p.y - pr.c.y, p.x - pr.c.x);
                if (normAngle(ang - pr.start) <= sweep) d = Math.abs(dist(p, pr.c) - pr.r);
                else {
                    const e0 = { x: pr.c.x + pr.r * Math.cos(pr.start), y: pr.c.y + pr.r * Math.sin(pr.start) };
                    const e1 = { x: pr.c.x + pr.r * Math.cos(pr.end), y: pr.c.y + pr.r * Math.sin(pr.end) };
                    d = Math.min(dist(p, e0), dist(p, e1));
                }
                break;
            }
            case 'point': d = dist(p, pr.p); break;
            case 'text': {
                const box = textBox(pr);
                d = pointInRing(p, box) ? 0 : Math.min(...box.map((q, i) => segDist(p, q, box[(i + 1) % 4])));
                break;
            }
            case 'hatch': {
                // a hatch is picked on its boundary (like AutoCAD) or anywhere inside its area
                let inside = false;
                for (const r of pr.rings) if (pointInRing(p, r)) inside = !inside;
                if (inside) d = 0;
                else for (const r of pr.rings) for (let i = 0; i < r.length; i++) d = Math.min(d, segDist(p, r[i], r[(i + 1) % r.length]));
                break;
            }
            default: {
                if (pr.kind === 'polyline' && pr.fill && pointInRing(p, pr.points)) { d = 0; break; }
                for (const chain of flattenPrimitive(pr, tolerance)) {
                    for (let i = 0; i + 1 < chain.length; i++) d = Math.min(d, segDist(p, chain[i], chain[i + 1]));
                }
            }
        }
        if (d < best) best = d;
        if (best === 0) break;
    }
    return best;
}

function segmentHitsBox(a: Point, b: Point, box: Bounds): boolean {
    // Liang–Barsky clip
    let t0 = 0, t1 = 1;
    const dx = b.x - a.x, dy = b.y - a.y;
    const tests: Array<[number, number]> = [[-dx, a.x - box.minX], [dx, box.maxX - a.x], [-dy, a.y - box.minY], [dy, box.maxY - a.y]];
    for (const [pp, q] of tests) {
        if (Math.abs(pp) < 1e-15) { if (q < 0) return false; continue; }
        const r = q / pp;
        if (pp < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
        else { if (r < t0) return false; if (r < t1) t1 = r; }
    }
    return true;
}

/**
 * Window / crossing selection test (AutoCAD semantics): `window` needs the whole entity
 * inside the box, crossing accepts anything that touches it.
 */
export function primitivesInBox(prims: Primitive[], box: Bounds, mode: 'window' | 'crossing'): boolean {
    const b = primitiveBounds(prims);
    if (!b) return false;
    const inside = b.minX >= box.minX && b.maxX <= box.maxX && b.minY >= box.minY && b.maxY <= box.maxY;
    if (inside) return true;
    if (mode === 'window') return false;
    if (b.maxX < box.minX || b.minX > box.maxX || b.maxY < box.minY || b.minY > box.maxY) return false;
    const corners = [{ x: box.minX, y: box.minY }, { x: box.maxX, y: box.minY }, { x: box.maxX, y: box.maxY }, { x: box.minX, y: box.maxY }];
    const tol = Math.max(1e-3, Math.min(box.maxX - box.minX, box.maxY - box.minY) / 400);
    for (const pr of prims) {
        if (pr.kind === 'point') { if (pr.p.x >= box.minX && pr.p.x <= box.maxX && pr.p.y >= box.minY && pr.p.y <= box.maxY) return true; continue; }
        if (pr.kind === 'text') {
            const tb = textBox(pr);
            for (let i = 0; i < 4; i++) if (segmentHitsBox(tb[i], tb[(i + 1) % 4], box)) return true;
            if (corners.some((c) => pointInRing(c, tb))) return true;
            continue;
        }
        if (pr.kind === 'hatch') {
            for (const r of pr.rings) for (let i = 0; i < r.length; i++) if (segmentHitsBox(r[i], r[(i + 1) % r.length], box)) return true;
            let inside = false;
            for (const r of pr.rings) if (pointInRing(corners[0], r)) inside = !inside;
            if (inside) return true;
            continue;
        }
        for (const chain of flattenPrimitive(pr, tol)) {
            for (let i = 0; i + 1 < chain.length; i++) if (segmentHitsBox(chain[i], chain[i + 1], box)) return true;
        }
        if (pr.kind === 'polyline' && pr.fill && corners.some((c) => pointInRing(c, pr.points))) return true;
    }
    return false;
}

/** Arc primitive → polyline bulge helpers for writers that only know polylines. */
export function arcAsBulgePolyline(c: Point, r: number, start: number, end: number): { points: Point[]; bulges: number[] } {
    const sweep = ccwSweep(start, end);
    const p0 = { x: c.x + r * Math.cos(start), y: c.y + r * Math.sin(start) };
    if (sweep >= TAU - 1e-9) {
        const pm = { x: c.x - (p0.x - c.x), y: c.y - (p0.y - c.y) };
        return { points: [p0, pm], bulges: [1, 1] };
    }
    const p1 = { x: c.x + r * Math.cos(start + sweep), y: c.y + r * Math.sin(start + sweep) };
    return { points: [p0, p1], bulges: [bulgeFromSweep(sweep)] };
}
