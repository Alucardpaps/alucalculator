/**
 * AluCAD — CNC G-code toolpath generator (ISO 6983 / DIN 66025).
 *
 * Generates 2-D profile toolpaths for routers, milling centres, laser, plasma and
 * waterjet tables from the shared primitive decomposition, so every drawn shape — gears,
 * sprockets, rotated rectangles, polygons, ellipses, splines — is cut exactly as drawn:
 *  - G00 rapid, G01 linear, G02 / G03 arcs (I/J relative to the arc start, exact for
 *    arcs, circles and polyline bulges); ellipses and splines are linearised to 0.01 mm.
 *  - Centre/hidden/thin reference lines, text, dimensions, leaders and hatches are not cut.
 *  - Inner contours are cut before the contours that enclose them (the part stays put),
 *    and paths are ordered nearest-neighbour (open paths may be reversed) to cut rapids.
 */

import type { CadEntity, Layer, Point } from '../kernel/types';
import type { Primitive } from '../kernel/primitiveTypes';
import { flattenPrimitive, geometryPrimitives } from '../kernel/primitives';
import { TAU, ccwSweep } from '../kernel/shapes';
import { isLayerShown } from '../kernel/layers';
import { bulgeArc } from '@/lib/dxf/dxfGeometry';

export interface GcodeOptions {
    programName?: string;
    feedRate?: number;       // Cutting feed rate (mm/min, e.g. 1200)
    plungeRate?: number;     // Z-axis plunge feed rate (mm/min, e.g. 300)
    spindleRpm?: number;     // Spindle speed (RPM, e.g. 18000 for router, 0 for laser)
    safeZ?: number;          // Rapid traverse clearance height (mm, e.g. 5.0)
    cutDepth?: number;       // Final cutting depth (mm, e.g. -2.0)
    stepDown?: number;       // Depth per pass (mm, e.g. 1.0)
    coolant?: boolean;       // Enable M08 flood coolant
    /** layer table: paths on layers that are off or frozen are not cut */
    layers?: Layer[];
    /** rapid traverse rate used for the cycle-time estimate (mm/min) */
    rapidRate?: number;
}

export interface GcodeResult {
    gcode: string;
    totalCutDistanceMm: number;
    rapidDistanceMm: number;
    estimatedTimeSec: number;
    totalPaths: number;
}

/** A toolpath segment ending at `to`; arcs carry their centre and direction. */
type Seg = { to: Point; arc?: { c: Point; ccw: boolean; sweep: number; r: number } };

interface Toolpath {
    start: Point;
    segs: Seg[];
    closed: boolean;
    /** polygon used for containment tests (closed paths only) */
    ring?: Point[];
}

const d2 = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

function segLength(from: Point, s: Seg): number {
    return s.arc ? Math.abs(s.arc.sweep) * s.arc.r : d2(from, s.to);
}

function pathFromPrimitive(p: Primitive): Toolpath[] {
    switch (p.kind) {
        case 'line':
            return [{ start: p.a, segs: [{ to: p.b }], closed: false }];
        case 'circle': {
            const s = { x: p.c.x + p.r, y: p.c.y };
            return [{ start: s, segs: [{ to: s, arc: { c: p.c, ccw: true, sweep: TAU, r: p.r } }], closed: true, ring: flattenPrimitive(p, 0.2)[0] }];
        }
        case 'arc': {
            const sweep = ccwSweep(p.start, p.end);
            const a = { x: p.c.x + p.r * Math.cos(p.start), y: p.c.y + p.r * Math.sin(p.start) };
            const b = { x: p.c.x + p.r * Math.cos(p.start + sweep), y: p.c.y + p.r * Math.sin(p.start + sweep) };
            return [{ start: a, segs: [{ to: b, arc: { c: p.c, ccw: true, sweep, r: p.r } }], closed: false }];
        }
        case 'polyline': {
            if (p.points.length < 2) return [];
            const n = p.points.length;
            const segs: Seg[] = [];
            const count = p.closed ? n : n - 1;
            for (let i = 0; i < count; i++) {
                const a = p.points[i], b = p.points[(i + 1) % n];
                const bulge = p.bulges?.[i] ?? 0;
                const arc = Math.abs(bulge) > 1e-12 ? bulgeArc(a, b, bulge) : null;
                segs.push(arc ? { to: b, arc: { c: { x: arc.cx, y: arc.cy }, ccw: arc.sweep > 0, sweep: arc.sweep, r: arc.r } } : { to: b });
            }
            return [{ start: p.points[0], segs, closed: p.closed, ring: p.closed ? flattenPrimitive(p, 0.2)[0] : undefined }];
        }
        case 'ellipse':
        case 'spline':
            return flattenPrimitive(p, 0.01).filter((c) => c.length >= 2).map((chain) => {
                const closed = d2(chain[0], chain[chain.length - 1]) < 1e-6;
                return { start: chain[0], segs: chain.slice(1).map((to) => ({ to })), closed, ring: closed ? chain : undefined };
            });
        default:
            return [];
    }
}

function pointInRing(p: Point, ring: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const a = ring[i], b = ring[j];
        if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
    }
    return inside;
}

/** Same path, travelled backwards. */
function reversed(tp: Toolpath): Toolpath {
    const pts = [tp.start, ...tp.segs.map((s) => s.to)];
    const segs: Seg[] = [];
    for (let i = tp.segs.length - 1; i >= 0; i--) {
        const s = tp.segs[i];
        segs.push(s.arc ? { to: pts[i], arc: { ...s.arc, ccw: !s.arc.ccw, sweep: -s.arc.sweep } } : { to: pts[i] });
    }
    return { start: pts[pts.length - 1], segs, closed: tp.closed, ring: tp.ring };
}

/** Closed path re-started at the vertex closest to `from` (a full circle starts at the nearest point). */
function restarted(tp: Toolpath, from: Point): Toolpath {
    if (!tp.closed) return tp;
    if (tp.segs.length === 1 && tp.segs[0].arc && Math.abs(Math.abs(tp.segs[0].arc.sweep) - TAU) < 1e-9) {
        const { c, r } = tp.segs[0].arc;
        const ang = Math.atan2(from.y - c.y, from.x - c.x);
        const s = { x: c.x + r * Math.cos(ang), y: c.y + r * Math.sin(ang) };
        return { ...tp, start: s, segs: [{ to: s, arc: tp.segs[0].arc }] };
    }
    const pts = [tp.start, ...tp.segs.map((s) => s.to)];
    let best = 0, bestD = Infinity;
    for (let i = 0; i < tp.segs.length; i++) {
        const d = d2(pts[i], from);
        if (d < bestD) { bestD = d; best = i; }
    }
    if (best === 0) return tp;
    return { ...tp, start: pts[best], segs: [...tp.segs.slice(best), ...tp.segs.slice(0, best)] };
}

export function generateGcode(
    entities: CadEntity[],
    options: GcodeOptions = {}
): GcodeResult {
    const feed = options.feedRate || 1200;
    const plunge = options.plungeRate || 400;
    const rpm = options.spindleRpm ?? 18000;
    const safeZ = options.safeZ || 5.0;
    const targetZ = options.cutDepth !== undefined ? options.cutDepth : -2.0;
    const totalDepth = Math.abs(targetZ);
    const step = options.stepDown && options.stepDown > 0 ? options.stepDown : (totalDepth > 0 ? totalDepth : 1.0);
    const passCount = totalDepth > 0 ? Math.max(1, Math.ceil(totalDepth / step - 1e-9)) : 1;
    const useCoolant = options.coolant || false;
    const rapidRate = options.rapidRate || 5000;
    const progName = (options.programName || 'ALUCAD_PART').replace(/[^a-zA-Z0-9_-]/g, '');
    const layerMap = new Map((options.layers ?? []).map((l) => [l.id, l]));

    const fmt = (v: number) => (Math.abs(v) < 5e-4 ? 0 : v).toFixed(3);
    const fX = (v: number) => `X${fmt(v)}`;
    const fY = (v: number) => `Y${fmt(v)}`;
    const fZ = (v: number) => `Z${fmt(v)}`;

    // ── collect cutting paths (visible outline geometry only) ──
    const paths: Toolpath[] = [];
    for (const e of entities) {
        if (!e || e.isVisible === false || !e.geometry) continue;
        if (!isLayerShown(layerMap.get(e.layerId))) continue;
        const t = e.geometry.type;
        if (t === 'DIMENSION' || t === 'LEADER' || t === 'TEXT' || t === 'HATCH' || t === 'POINT') continue;
        for (const p of geometryPrimitives(e.geometry)) {
            if (p.style !== 'continuous') continue;
            paths.push(...pathFromPrimitive(p));
        }
    }

    // ── order: innermost closed contours first, nearest neighbour within each level ──
    const depth = paths.map((tp) => {
        if (!tp.closed || !tp.ring) return 0;
        const probe = tp.ring[0];
        let n = 0;
        for (const other of paths) {
            if (other === tp || !other.closed || !other.ring) continue;
            if (pointInRing(probe, other.ring)) n++;
        }
        return n;
    });
    const levels = [...new Set(depth)].sort((a, b) => b - a);
    const ordered: Toolpath[] = [];
    let cursor: Point = { x: 0, y: 0 };
    for (const level of levels) {
        const pool = paths.filter((_, i) => depth[i] === level);
        while (pool.length) {
            let bi = 0, bestD = Infinity, bestRev = false;
            pool.forEach((tp, i) => {
                const ds = tp.closed ? Math.min(...[tp.start, ...tp.segs.map((s) => s.to)].map((q) => d2(q, cursor))) : d2(tp.start, cursor);
                if (ds < bestD) { bestD = ds; bi = i; bestRev = false; }
                if (!tp.closed) {
                    const de = d2(tp.segs[tp.segs.length - 1].to, cursor);
                    if (de < bestD) { bestD = de; bi = i; bestRev = true; }
                }
            });
            let tp = pool.splice(bi, 1)[0];
            tp = bestRev ? reversed(tp) : restarted(tp, cursor);
            ordered.push(tp);
            cursor = tp.segs[tp.segs.length - 1].to;
        }
    }

    // ── program ──
    const lines: string[] = [];
    lines.push('%');
    lines.push(`(PROGRAM: ${progName})`);
    lines.push('(ALUCAD OS CNC 2D POST-PROCESSOR - ISO 6983)');
    lines.push(`(DATE: ${new Date().toISOString()})`);
    lines.push(`(FEED: ${feed} MM/MIN | PLUNGE: ${plunge} MM/MIN | SPINDLE: ${rpm} RPM)`);
    lines.push(`(TARGET DEPTH: ${targetZ} MM | STEPDOWN: ${step} MM | PASSES: ${passCount} | PATHS: ${ordered.length})`);
    lines.push('');
    lines.push('G21          (Metric Units: Millimeters)');
    lines.push('G90          (Absolute Positioning)');
    lines.push('G17          (XY Plane Selection)');
    lines.push('G40 G49 G80  (Cancel Tool Radius & Height Offsets)');
    lines.push(`G00 ${fZ(safeZ)}  (Retract to Safe Z)`);
    if (rpm > 0) {
        lines.push(`M03 S${rpm}  (Spindle CW ON)`);
        lines.push('G04 P1.5     (Dwell 1.5s for Spindle Spin-up)');
    }
    if (useCoolant) lines.push('M08          (Coolant Flood ON)');
    lines.push('');

    let totalCut = 0;
    let rapid = 0;
    let pos: Point = { x: 0, y: 0 };
    for (let pass = 1; pass <= passCount; pass++) {
        const passZ = totalDepth > 0 ? -Math.min(totalDepth, pass * step) : 0;
        lines.push(`(--- PASS ${pass}/${passCount} : ${fZ(passZ)} ---)`);
        for (const tp of ordered) {
            rapid += d2(pos, tp.start);
            lines.push(`G00 ${fX(tp.start.x)} ${fY(tp.start.y)}`);
            lines.push(`G01 ${fZ(passZ)} F${plunge}`);
            let from = tp.start;
            let first = true;
            for (const s of tp.segs) {
                const f = first ? ` F${feed}` : '';
                if (s.arc) {
                    const g = s.arc.ccw ? 'G03' : 'G02';
                    lines.push(`${g} ${fX(s.to.x)} ${fY(s.to.y)} I${fmt(s.arc.c.x - from.x)} J${fmt(s.arc.c.y - from.y)}${f}`);
                } else {
                    lines.push(`G01 ${fX(s.to.x)} ${fY(s.to.y)}${f}`);
                }
                totalCut += segLength(from, s);
                from = s.to;
                first = false;
            }
            lines.push(`G00 ${fZ(safeZ)}`);
            pos = from;
        }
    }

    lines.push('');
    lines.push('(--- PROGRAM END & SAFETIES ---)');
    lines.push(`G00 ${fZ(safeZ)}  (Final Retract)`);
    lines.push('G00 X0.000 Y0.000 (Return to Machine Origin)');
    rapid += d2(pos, { x: 0, y: 0 });
    if (useCoolant) lines.push('M09          (Coolant OFF)');
    if (rpm > 0) lines.push('M05          (Spindle STOP)');
    lines.push('M30          (End of Program / Rewind)');
    lines.push('%');

    // cycle time: cutting + rapids + plunges/retracts
    const plunges = ordered.length * passCount;
    const cutTimeSec = (totalCut / feed) * 60;
    const rapidTimeSec = (rapid / rapidRate) * 60;
    const zTimeSec = plunges * ((safeZ - targetZ) / plunge + (safeZ - targetZ) / rapidRate) * 60;
    const totalTimeSec = Math.ceil(cutTimeSec + rapidTimeSec + zTimeSec + (rpm > 0 ? 1.5 : 0));

    return {
        gcode: lines.join('\n'),
        totalCutDistanceMm: Math.round(totalCut),
        rapidDistanceMm: Math.round(rapid),
        estimatedTimeSec: totalTimeSec,
        totalPaths: ordered.length,
    };
}
