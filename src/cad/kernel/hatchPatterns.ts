/**
 * AluCAD — hatch pattern engine (world coordinates).
 *
 * Patterns are defined like AutoCAD .pat line families (acadiso.pat, millimetres):
 * each family is a set of parallel lines at `angle` through `base`, repeated by `offset`
 * (x along the line, y perpendicular to it) with an optional dash sequence (+ pen down,
 * − pen up). The same definitions drive the canvas, every exporter's exploded hatch lines
 * and the native DXF HATCH entity, so a hatch looks identical everywhere.
 *
 * AluCAD stores `angle` as the line angle of ANSI31 (default 45°); the pattern rotation is
 * therefore `angle − 45°` for every pattern.
 */

import type { Point } from './types';

export type HatchPatternName = 'ANSI31' | 'SOLID' | 'CROSS' | 'HONEYCOMB';

export interface PatternLineDef {
    /** Line angle in degrees (pattern frame). */
    angle: number;
    base: Point;
    /** Offset between successive lines: x along the line, y perpendicular to it. */
    offset: Point;
    dashes: number[];
}

interface PatternDef {
    /** Name of the matching predefined AutoCAD pattern. */
    dxfName: string;
    lines: PatternLineDef[];
}

export const HATCH_PATTERNS: Readonly<Record<Exclude<HatchPatternName, 'SOLID'>, PatternDef>> = {
    // ISO 128-50 general section lining: 45° lines, 3.175 mm apart
    ANSI31: { dxfName: 'ANSI31', lines: [{ angle: 45, base: { x: 0, y: 0 }, offset: { x: 0, y: 3.175 }, dashes: [] }] },
    // cross hatching (ANSI37): two perpendicular families
    CROSS: {
        dxfName: 'ANSI37',
        lines: [
            { angle: 45, base: { x: 0, y: 0 }, offset: { x: 0, y: 3.175 }, dashes: [] },
            { angle: 135, base: { x: 0, y: 0 }, offset: { x: 0, y: 3.175 }, dashes: [] },
        ],
    },
    // regular honeycomb, edge 3.175 mm (AutoCAD HONEY)
    HONEYCOMB: {
        dxfName: 'HONEY',
        lines: [
            { angle: 0, base: { x: 0, y: 0 }, offset: { x: 4.7625, y: 2.749630645 }, dashes: [3.175, -6.35] },
            { angle: 120, base: { x: 0, y: 0 }, offset: { x: 4.7625, y: 2.749630645 }, dashes: [3.175, -6.35] },
            { angle: 60, base: { x: 0, y: 0 }, offset: { x: 4.7625, y: 2.749630645 }, dashes: [-6.35, 3.175] },
        ],
    },
};

/** Pattern rotation in degrees for the stored AluCAD hatch angle. */
export const hatchRotationDeg = (angle?: number) => (angle ?? 45) - 45;

/** Normalised pattern name (unknown names fall back to ANSI31). */
export function hatchPatternName(p?: string): HatchPatternName {
    return p === 'SOLID' || p === 'CROSS' || p === 'HONEYCOMB' ? p : 'ANSI31';
}

export interface WorldPatternLine {
    /** World line angle (degrees). */
    angle: number;
    base: Point;
    /** World vector between successive lines (already rotated and scaled — DXF codes 45/46). */
    offset: Point;
    dashes: number[];
}

/** Pattern line families rotated by the hatch angle and scaled (DXF HATCH pattern data). */
export function worldPatternLines(pattern: HatchPatternName, scale = 1, angle = 45): WorldPatternLine[] {
    if (pattern === 'SOLID') return [];
    const def = HATCH_PATTERNS[pattern];
    const rot = (hatchRotationDeg(angle) * Math.PI) / 180;
    const s = scale > 0 ? scale : 1;
    const cr = Math.cos(rot), sr = Math.sin(rot);
    return def.lines.map((l) => {
        const a = (l.angle * Math.PI) / 180 + rot;
        const ca = Math.cos(a), sa = Math.sin(a);
        return {
            angle: (l.angle + hatchRotationDeg(angle)),
            base: { x: (l.base.x * cr - l.base.y * sr) * s, y: (l.base.x * sr + l.base.y * cr) * s },
            offset: { x: (l.offset.x * ca - l.offset.y * sa) * s, y: (l.offset.x * sa + l.offset.y * ca) * s },
            dashes: l.dashes.map((d) => d * s),
        };
    });
}

export interface HatchSegmentsResult {
    segments: Array<[Point, Point]>;
    /** True when the segment budget ran out (pattern far too dense for the region). */
    truncated: boolean;
}

/**
 * Pattern lines clipped to the even-odd region formed by `rings` (outer boundary + holes).
 */
export function hatchSegments(
    rings: Point[][],
    pattern: HatchPatternName,
    scale = 1,
    angle = 45,
    maxSegments = 200_000,
): HatchSegmentsResult {
    const segments: Array<[Point, Point]> = [];
    const valid = rings.filter((r) => r && r.length >= 3);
    if (pattern === 'SOLID' || valid.length === 0) return { segments, truncated: false };

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const ring of valid) {
        for (const p of ring) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }
    }
    const corners = [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }];

    for (const fam of worldPatternLines(pattern, scale, angle)) {
        const a = (fam.angle * Math.PI) / 180;
        const u = { x: Math.cos(a), y: Math.sin(a) };
        const v = { x: -u.y, y: u.x };
        const perp = fam.offset.x * v.x + fam.offset.y * v.y;
        if (Math.abs(perp) < 1e-9) continue;
        let dMin = Infinity, dMax = -Infinity;
        for (const c of corners) {
            const d = (c.x - fam.base.x) * v.x + (c.y - fam.base.y) * v.y;
            dMin = Math.min(dMin, d);
            dMax = Math.max(dMax, d);
        }
        let k0 = Math.ceil(dMin / perp), k1 = Math.floor(dMax / perp);
        if (k0 > k1) [k0, k1] = [k1, k0];
        const period = fam.dashes.reduce((s, d) => s + Math.abs(d), 0);

        for (let k = k0; k <= k1; k++) {
            const o = { x: fam.base.x + k * fam.offset.x, y: fam.base.y + k * fam.offset.y };
            // crossings of this line with every ring edge (half-open rule keeps vertex hits consistent)
            const ts: number[] = [];
            for (const ring of valid) {
                for (let i = 0; i < ring.length; i++) {
                    const p = ring[i], q = ring[(i + 1) % ring.length];
                    const sp = (p.x - o.x) * v.x + (p.y - o.y) * v.y;
                    const sq = (q.x - o.x) * v.x + (q.y - o.y) * v.y;
                    if ((sp >= 0) === (sq >= 0)) continue;
                    const f = sp / (sp - sq);
                    const x = p.x + (q.x - p.x) * f, y = p.y + (q.y - p.y) * f;
                    ts.push((x - o.x) * u.x + (y - o.y) * u.y);
                }
            }
            if (ts.length < 2) continue;
            ts.sort((m, n) => m - n);
            for (let i = 0; i + 1 < ts.length; i += 2) {
                const ta = ts[i], tb = ts[i + 1];
                if (tb - ta < 1e-9) continue;
                const emit = (t0: number, t1: number) => {
                    segments.push([
                        { x: o.x + u.x * t0, y: o.y + u.y * t0 },
                        { x: o.x + u.x * t1, y: o.y + u.y * t1 },
                    ]);
                };
                if (period < 1e-9) {
                    emit(ta, tb);
                } else {
                    let pos = Math.floor(ta / period) * period;
                    let guard = 0;
                    while (pos < tb && guard++ < 1_000_000) {
                        for (const d of fam.dashes) {
                            const len = Math.abs(d);
                            const s0 = pos, s1 = pos + len;
                            if (d > 0) {
                                const c0 = Math.max(s0, ta), c1 = Math.min(s1, tb);
                                if (c1 - c0 > 1e-9) emit(c0, c1);
                            }
                            pos = s1;
                            if (pos >= tb) break;
                        }
                    }
                }
                if (segments.length >= maxSegments) return { segments, truncated: true };
            }
        }
    }
    return { segments, truncated: false };
}
