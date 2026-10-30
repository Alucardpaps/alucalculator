/**
 * AluCAD — recording canvas context.
 *
 * A minimal CanvasRenderingContext2D stand-in that turns path calls into world-space
 * primitives instead of pixels. Drawing code receives `worldToScreen = p => (x, −y)` and
 * `zoom = 1`, so one canvas unit is one millimetre and the Y flip is undone here.
 * Arcs and ellipses stay exact under similarity transforms; Béziers are flattened.
 */

import type { Point } from '../kernel/types';
import type { Primitive, PrimStyle } from '../kernel/primitiveTypes';
import { TAU, normAngle, cubicSubdivisions, cubicPoint, bulgeFromSweep, dist } from '../kernel/shapes';

type Affine = [number, number, number, number, number, number];

const IDENTITY: Affine = [1, 0, 0, 1, 0, 0];

function mul(m: Affine, n: Affine): Affine {
    return [
        m[0] * n[0] + m[2] * n[1],
        m[1] * n[0] + m[3] * n[1],
        m[0] * n[2] + m[2] * n[3],
        m[1] * n[2] + m[3] * n[3],
        m[0] * n[4] + m[2] * n[5] + m[4],
        m[1] * n[4] + m[3] * n[5] + m[5],
    ];
}

/** ISO meaning of a canvas dash pattern used by the AluCAD drawing code. */
export function styleForDash(dash: number[], lineWidth: number): PrimStyle {
    if (!dash.length) return lineWidth < 0.99 ? 'thin' : 'continuous';
    if (dash.length >= 4) return 'center';
    const [on, off] = dash;
    if (Math.abs(on - off) < 1e-9) return 'center'; // pitch circles ([5, 5])
    if (on <= 4) return 'hidden';
    return 'dashed';
}

type Seg =
    | { kind: 'line'; to: Point }
    | { kind: 'arc'; c: Point; r: number; start: number; sweep: number; to: Point }
    | { kind: 'ellipse'; c: Point; rx: number; ry: number; rotation: number; start: number; sweep: number; pts: Point[]; to: Point }
    | { kind: 'curve'; pts: Point[]; to: Point };

interface SubPath { start: Point; segs: Seg[]; closed: boolean }

interface State {
    m: Affine;
    dash: number[];
    lineWidth: number;
    font: string;
    textAlign: string;
    textBaseline: string;
    strokeStyle: unknown;
    fillStyle: unknown;
    globalAlpha: number;
}

const TOL = 0.005;

class Recorder {
    readonly out: Primitive[] = [];
    private state: State = {
        m: [...IDENTITY] as Affine,
        dash: [],
        lineWidth: 1,
        font: '10px sans-serif',
        textAlign: 'start',
        textBaseline: 'alphabetic',
        strokeStyle: '#000',
        fillStyle: '#000',
        globalAlpha: 1,
    };
    private stack: State[] = [];
    private path: SubPath[] = [];
    private emitted: Primitive[] | null = null;
    readonly canvas = { width: 1_000_000, height: 1_000_000 };
    lineCap = 'butt';
    lineJoin = 'miter';
    miterLimit = 10;
    lineDashOffset = 0;
    shadowBlur = 0;
    shadowColor = 'transparent';
    globalCompositeOperation = 'source-over';
    imageSmoothingEnabled = true;

    // ── style properties ──
    get lineWidth() { return this.state.lineWidth; }
    set lineWidth(v: number) { if (Number.isFinite(v) && v > 0) this.state.lineWidth = v; }
    get font() { return this.state.font; }
    set font(v: string) { this.state.font = String(v); }
    get textAlign() { return this.state.textAlign; }
    set textAlign(v: string) { this.state.textAlign = String(v); }
    get textBaseline() { return this.state.textBaseline; }
    set textBaseline(v: string) { this.state.textBaseline = String(v); }
    get strokeStyle() { return this.state.strokeStyle; }
    set strokeStyle(v: unknown) { this.state.strokeStyle = v; }
    get fillStyle() { return this.state.fillStyle; }
    set fillStyle(v: unknown) { this.state.fillStyle = v; }
    get globalAlpha() { return this.state.globalAlpha; }
    set globalAlpha(v: number) { this.state.globalAlpha = v; }

    save() { this.stack.push({ ...this.state, m: [...this.state.m] as Affine, dash: [...this.state.dash] }); }
    restore() { const s = this.stack.pop(); if (s) this.state = s; }
    setLineDash(d: number[]) { this.state.dash = Array.isArray(d) ? d.filter((x) => Number.isFinite(x)).map(Number) : []; }
    getLineDash() { return [...this.state.dash]; }

    // ── transforms ──
    translate(x: number, y: number) { this.state.m = mul(this.state.m, [1, 0, 0, 1, x, y]); }
    rotate(a: number) { const c = Math.cos(a), s = Math.sin(a); this.state.m = mul(this.state.m, [c, s, -s, c, 0, 0]); }
    scale(x: number, y: number) { this.state.m = mul(this.state.m, [x, 0, 0, y, 0, 0]); }
    transform(a: number, b: number, c: number, d: number, e: number, f: number) { this.state.m = mul(this.state.m, [a, b, c, d, e, f]); }
    setTransform(a?: number | { a: number; b: number; c: number; d: number; e: number; f: number }, b?: number, c?: number, d?: number, e?: number, f?: number) {
        if (typeof a === 'object' && a) this.state.m = [a.a, a.b, a.c, a.d, a.e, a.f];
        else if (typeof a === 'number') this.state.m = [a, b ?? 0, c ?? 0, d ?? 1, e ?? 0, f ?? 0];
        else this.state.m = [...IDENTITY] as Affine;
    }
    resetTransform() { this.state.m = [...IDENTITY] as Affine; }
    getTransform() { const [a, b, c, d, e, f] = this.state.m; return { a, b, c, d, e, f }; }

    /** Canvas (local) → world. */
    private w(x: number, y: number): Point {
        const m = this.state.m;
        return { x: m[0] * x + m[2] * y + m[4], y: -(m[1] * x + m[3] * y + m[5]) };
    }

    /** Linear part of canvas → world, its uniform scale, orientation and x-axis angle (or null when sheared). */
    private linear(): { s: number; det: number; phi: number } | null {
        const [a, b, c, d] = this.state.m;
        // world = F·L with F = diag(1, −1)
        const A = a, B = -b, C = c, D = -d;
        const sx = Math.hypot(A, B), sy = Math.hypot(C, D);
        const dot = A * C + B * D;
        if (Math.abs(sx - sy) > 1e-9 * Math.max(1, sx) || Math.abs(dot) > 1e-9 * Math.max(1, sx * sy)) return null;
        return { s: sx, det: A * D - B * C, phi: Math.atan2(B, A) };
    }

    // ── paths ──
    beginPath() { this.path = []; this.emitted = null; }

    private current(): SubPath | null { return this.path.length ? this.path[this.path.length - 1] : null; }

    private currentPoint(): Point | null {
        const sp = this.current();
        if (!sp) return null;
        return sp.segs.length ? sp.segs[sp.segs.length - 1].to : sp.start;
    }

    moveTo(x: number, y: number) { this.path.push({ start: this.w(x, y), segs: [], closed: false }); }

    lineTo(x: number, y: number) {
        const p = this.w(x, y);
        const sp = this.current();
        if (!sp) { this.path.push({ start: p, segs: [], closed: false }); return; }
        // after closePath the pen is back at the subpath start and a new subpath begins there
        if (sp.closed) this.path.push({ start: sp.start, segs: [], closed: false });
        this.current()!.segs.push({ kind: 'line', to: p });
    }

    closePath() {
        const sp = this.current();
        if (!sp) return;
        sp.closed = true;
    }

    private ensureStart(p: Point) {
        const sp = this.current();
        const cur = this.currentPoint();
        if (!sp || sp.closed) { this.path.push({ start: p, segs: [], closed: false }); return; }
        if (cur && dist(cur, p) > 1e-9) sp.segs.push({ kind: 'line', to: p });
    }

    rect(x: number, y: number, w: number, h: number) {
        this.moveTo(x, y);
        this.lineTo(x + w, y);
        this.lineTo(x + w, y + h);
        this.lineTo(x, y + h);
        this.closePath();
    }

    private canvasSweep(a0: number, a1: number, acw?: boolean): number {
        if (!acw) { const d = a1 - a0; return d >= TAU ? TAU : normAngle(d); }
        const d = a0 - a1;
        return -(d >= TAU ? TAU : normAngle(d));
    }

    arc(cx: number, cy: number, r: number, a0: number, a1: number, acw?: boolean) {
        if (!(r >= 0)) return;
        const sweepC = this.canvasSweep(a0, a1, acw);
        const lin = this.linear();
        if (!lin) { this.flattenLocal((t) => ({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) }), a0, sweepC); return; }
        const c = this.w(cx, cy);
        const start = lin.det > 0 ? lin.phi + a0 : lin.phi - a0;
        const sweep = lin.det > 0 ? sweepC : -sweepC;
        const rr = r * lin.s;
        const p0 = { x: c.x + rr * Math.cos(start), y: c.y + rr * Math.sin(start) };
        const p1 = { x: c.x + rr * Math.cos(start + sweep), y: c.y + rr * Math.sin(start + sweep) };
        this.ensureStart(p0);
        if (Math.abs(sweep) < 1e-12) return;
        this.current()!.segs.push({ kind: 'arc', c, r: rr, start, sweep, to: p1 });
    }

    ellipse(cx: number, cy: number, rx: number, ry: number, rot: number, a0: number, a1: number, acw?: boolean) {
        if (!(rx >= 0) || !(ry >= 0)) return;
        const sweepC = this.canvasSweep(a0, a1, acw);
        const local = (t: number) => {
            const lx = rx * Math.cos(t), ly = ry * Math.sin(t);
            return { x: cx + lx * Math.cos(rot) - ly * Math.sin(rot), y: cy + lx * Math.sin(rot) + ly * Math.cos(rot) };
        };
        const lin = this.linear();
        if (!lin) { this.flattenLocal(local, a0, sweepC); return; }
        const c = this.w(cx, cy);
        const rotation = lin.det > 0 ? lin.phi + rot : lin.phi - rot;
        const start = lin.det > 0 ? a0 : -a0;
        const sweep = lin.det > 0 ? sweepC : -sweepC;
        const n = Math.min(1024, Math.max(8, Math.ceil(Math.abs(sweepC) / (TAU / 128))));
        const pts: Point[] = [];
        for (let i = 1; i <= n; i++) { const p = local(a0 + (sweepC * i) / n); pts.push(this.w(p.x, p.y)); }
        const first = local(a0);
        this.ensureStart(this.w(first.x, first.y));
        if (Math.abs(sweep) < 1e-12) return;
        this.current()!.segs.push({ kind: 'ellipse', c, rx: rx * lin.s, ry: ry * lin.s, rotation, start, sweep, pts, to: pts[pts.length - 1] });
    }

    private flattenLocal(f: (t: number) => Point, a0: number, sweep: number) {
        const n = Math.min(1024, Math.max(8, Math.ceil(Math.abs(sweep) / (TAU / 128))));
        const first = f(a0);
        this.ensureStart(this.w(first.x, first.y));
        const pts: Point[] = [];
        for (let i = 1; i <= n; i++) { const p = f(a0 + (sweep * i) / n); pts.push(this.w(p.x, p.y)); }
        this.current()!.segs.push({ kind: 'curve', pts, to: pts[pts.length - 1] });
    }

    arcTo(x1: number, y1: number) { this.lineTo(x1, y1); }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
        const p0 = this.currentPoint() ?? this.w(cpx, cpy);
        const c = this.w(cpx, cpy), p1 = this.w(x, y);
        // exact degree elevation to a cubic, then flatten
        const seg = {
            p0,
            c1: { x: p0.x + (2 / 3) * (c.x - p0.x), y: p0.y + (2 / 3) * (c.y - p0.y) },
            c2: { x: p1.x + (2 / 3) * (c.x - p1.x), y: p1.y + (2 / 3) * (c.y - p1.y) },
            p1,
        };
        this.pushCubic(seg);
    }

    bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) {
        const p1 = this.w(x, y);
        const p0 = this.currentPoint() ?? p1;
        this.pushCubic({ p0, c1: this.w(c1x, c1y), c2: this.w(c2x, c2y), p1 });
    }

    private pushCubic(seg: { p0: Point; c1: Point; c2: Point; p1: Point }) {
        if (!this.current()) this.path.push({ start: seg.p0, segs: [], closed: false });
        const n = cubicSubdivisions(seg, TOL);
        const pts: Point[] = [];
        for (let i = 1; i <= n; i++) pts.push(cubicPoint(seg, i / n));
        this.current()!.segs.push({ kind: 'curve', pts, to: seg.p1 });
    }

    // ── painting ──
    stroke() {
        if (this.emitted) return;
        this.emitted = this.emitPath(false);
    }

    fill() {
        if (this.emitted) {
            for (const p of this.emitted) if (p.kind === 'polyline' || p.kind === 'circle') p.fill = true;
            return;
        }
        this.emitted = this.emitPath(true);
    }

    clip() { /* clipping is not recorded */ }

    strokeRect(x: number, y: number, w: number, h: number) {
        const keep = this.path, keepEmitted = this.emitted;
        this.path = [];
        this.rect(x, y, w, h);
        this.emitPath(false);
        this.path = keep; this.emitted = keepEmitted;
    }

    fillRect(x: number, y: number, w: number, h: number) {
        const keep = this.path, keepEmitted = this.emitted;
        this.path = [];
        this.rect(x, y, w, h);
        this.emitPath(true);
        this.path = keep; this.emitted = keepEmitted;
    }

    clearRect() { /* no-op */ }

    private style(): PrimStyle { return styleForDash(this.state.dash, this.state.lineWidth); }

    private emitPath(fill: boolean): Primitive[] {
        const style = this.style();
        const made: Primitive[] = [];
        for (const sp of this.path) {
            const prim = this.subPathPrimitive(sp, style, fill);
            if (prim) { made.push(prim); this.out.push(prim); }
        }
        return made;
    }

    private subPathPrimitive(sp: SubPath, style: PrimStyle, fill: boolean): Primitive | null {
        const segs = sp.segs;
        if (segs.length === 0) return null;
        if (segs.length === 1) {
            const s = segs[0];
            if (s.kind === 'arc') {
                if (Math.abs(s.sweep) >= TAU - 1e-9) return { kind: 'circle', c: s.c, r: s.r, style, ...(fill ? { fill: true } : {}) };
                if (!fill && !sp.closed) {
                    const start = s.sweep > 0 ? s.start : s.start + s.sweep;
                    return { kind: 'arc', c: s.c, r: s.r, start: normAngle(start), end: normAngle(start + Math.abs(s.sweep)), style };
                }
            }
            if (s.kind === 'ellipse' && !fill && (!sp.closed || Math.abs(s.sweep) >= TAU - 1e-9)) {
                const start = s.sweep > 0 ? s.start : s.start + s.sweep;
                return { kind: 'ellipse', c: s.c, rx: s.rx, ry: s.ry, rotation: s.rotation, start: normAngle(start), sweep: Math.abs(s.sweep), style };
            }
            if (s.kind === 'line' && !sp.closed && !fill) return { kind: 'line', a: sp.start, b: s.to, style };
        }
        // general case: polyline with bulges for arcs, flattened curves
        const points: Point[] = [sp.start];
        const bulges: number[] = [];
        let hasBulge = false;
        for (const s of segs) {
            if (s.kind === 'line') {
                bulges.push(0);
                points.push(s.to);
            } else if (s.kind === 'arc') {
                if (Math.abs(s.sweep) >= TAU - 1e-9) {
                    const half = s.sweep / 2;
                    const mid = { x: s.c.x + s.r * Math.cos(s.start + half), y: s.c.y + s.r * Math.sin(s.start + half) };
                    bulges.push(bulgeFromSweep(half)); points.push(mid);
                    bulges.push(bulgeFromSweep(half)); points.push(s.to);
                } else {
                    bulges.push(bulgeFromSweep(s.sweep));
                    points.push(s.to);
                }
                hasBulge = true;
            } else {
                for (const p of s.pts) { bulges.push(0); points.push(p); }
            }
        }
        let closed = sp.closed;
        // a path that returns to its start is closed; drop the duplicate vertex
        if (points.length > 2 && dist(points[0], points[points.length - 1]) < 1e-7) {
            points.pop();
            closed = true;
        } else if (closed) {
            bulges.push(0); // closing segment is straight
        }
        if (!closed) bulges.length = points.length - 1;
        else bulges.length = points.length;
        return {
            kind: 'polyline',
            points,
            ...(hasBulge ? { bulges } : {}),
            closed: closed || fill,
            style,
            ...(fill ? { fill: true } : {}),
        };
    }

    // ── text ──
    private fontPx(): number {
        const m = /(\d+(?:\.\d+)?)px/.exec(this.state.font);
        return m ? parseFloat(m[1]) : 10;
    }

    measureText(text: string) {
        const w = String(text ?? '').length * this.fontPx() * 0.6;
        return { width: w, actualBoundingBoxAscent: this.fontPx() * 0.8, actualBoundingBoxDescent: this.fontPx() * 0.2 } as TextMetrics;
    }

    fillText(text: string, x: number, y: number) {
        const content = String(text ?? '');
        if (!content.trim()) return;
        const lin = this.linear();
        const s = lin?.s ?? 1;
        const hLocal = this.fontPx();
        const kUp = this.state.textBaseline === 'top' || this.state.textBaseline === 'hanging' ? 0
            : this.state.textBaseline === 'middle' ? 0.5 : 1;
        const top = this.w(x, y - kUp * hLocal);
        const align = this.state.textAlign === 'center' ? 'center'
            : this.state.textAlign === 'right' || this.state.textAlign === 'end' ? 'right' : 'left';
        const bold = /\bbold\b|\b[6-9]00\b/.test(this.state.font);
        const italic = /\bitalic\b/.test(this.state.font);
        this.out.push({
            kind: 'text', position: top, content, height: hLocal * s, rotation: lin?.phi ?? 0, align, bold, italic,
            style: 'continuous',
        });
    }

    strokeText(text: string, x: number, y: number) { this.fillText(text, x, y); }

    // ── unused canvas API surface ──
    createLinearGradient() { return { addColorStop() { /* no-op */ } }; }
    createRadialGradient() { return { addColorStop() { /* no-op */ } }; }
    createPattern() { return null; }
    drawImage() { /* no-op */ }
    putImageData() { /* no-op */ }
    getImageData() { return { data: new Uint8ClampedArray(4), width: 1, height: 1 }; }
    isPointInPath() { return false; }
    isPointInStroke() { return false; }
}

export type DrawFn = (ctx: CanvasRenderingContext2D, worldToScreen: (p: Point) => Point, zoom: number) => void;

/** Runs canvas drawing code and returns what it drew as world-space primitives. */
export function recordDrawing(draw: DrawFn): Primitive[] {
    const rec = new Recorder();
    const ctx = rec as unknown as CanvasRenderingContext2D;
    try {
        draw(ctx, (p) => ({ x: p.x, y: -p.y }), 1);
    } catch {
        // drawing code may expect browser-only APIs; keep what was recorded so far
    }
    return rec.out;
}
