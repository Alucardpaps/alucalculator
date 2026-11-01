/**
 * AluCAD — DXF writer (AutoCAD R2000 / AC1015 and R12 / AC1009).
 *
 *  - R2000 files carry the full structure AutoCAD requires for R13+ files: handles and
 *    owners on every object, CLASSES, all nine symbol tables, *Model_Space / *Paper_Space
 *    block records and blocks, and the OBJECTS root dictionary. Curves stay exact:
 *    LWPOLYLINE with bulges, ELLIPSE, SPLINE (exact piecewise Bézier), native HATCH.
 *  - R12 files contain only R12 entities (LINE, ARC, CIRCLE, POLYLINE/VERTEX, TEXT, SOLID,
 *    POINT); ellipses, splines and hatch patterns are written as geometry. R12 is the most
 *    widely accepted format for laser, plasma and waterjet CAM.
 *
 * Every entity is written from the shared primitive decomposition (`kernel/primitives`), so
 * gears, sprockets, fasteners, belt drives and planetary sets export exactly as drawn.
 * Centre, hidden and dashed reference lines go to CENTER / HIDDEN / DASHED layers so they
 * can be switched off before cutting; `camProfileOnly` leaves them (and all annotation) out.
 */

import type { CadEntity, Layer, Point } from '../kernel/types';
import type { Primitive, PrimStyle, TextPrim } from '../kernel/primitiveTypes';
import { dimensionLabel, dimensionPrimitives, flattenPrimitive, geometryPrimitives, primitiveBounds } from '../kernel/primitives';
import { TAU, normAngle } from '../kernel/shapes';
import { HATCH_PATTERNS, hatchRotationDeg, hatchSegments, worldPatternLines } from '../kernel/hatchPatterns';
import { LINETYPES, LINETYPE_NAMES, linetypeName, type LinetypeName } from '../kernel/layers';

export interface DxfExportOptions {
    /** AC1015 = AutoCAD 2000 (default), AC1009 = R12 */
    version?: 'AC1015' | 'AC1009';
    /** drawing units of the file; inch output converts every length */
    units?: 'mm' | 'inch';
    /** write dimensions as lines + text (default) instead of associative DIMENSION entities */
    explodeDimensions?: boolean;
    /** only cutting geometry: no centre/hidden/thin lines, text, dimensions, leaders, hatches or points */
    camProfileOnly?: boolean;
    /** unit the canvas shows dimension values in */
    displayUnits?: string;
    author?: string;
    company?: string;
}

const N = '\r\n';
const MM_PER_INCH = 25.4;

/** Number → DXF value (finite, no exponent, ≤ 8 decimals, no "-0"). */
function num(v: number): string {
    if (!Number.isFinite(v)) return '0.0';
    let s = v.toFixed(8);
    s = s.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '.0');
    if (!s.includes('.')) s += '.0';
    return s === '-0.0' ? '0.0' : s;
}

// ─── AutoCAD colour index ───────────────────────────────────────────────────

let aciTable: Array<[number, number, number]> | null = null;

/** AutoCAD Color Index palette (1–255). */
export function aciPalette(): Array<[number, number, number]> {
    if (aciTable) return aciTable;
    const t: Array<[number, number, number]> = new Array(256);
    t[0] = [0, 0, 0];
    const base: Array<[number, number, number]> = [
        [255, 0, 0], [255, 255, 0], [0, 255, 0], [0, 255, 255], [0, 0, 255], [255, 0, 255], [255, 255, 255], [128, 128, 128], [192, 192, 192],
    ];
    base.forEach((c, i) => { t[i + 1] = c; });
    const levels = [255, 165, 127, 76, 38];
    for (let i = 10; i <= 249; i++) {
        const hue = (Math.floor((i - 10) / 10) * 15) % 360;
        const k = (i - 10) % 10;
        const v = levels[Math.floor(k / 2)];
        const light = k % 2 === 1;
        const h = hue / 60;
        const x = 1 - Math.abs((h % 2) - 1);
        const [r, g, b] = h < 1 ? [1, x, 0] : h < 2 ? [x, 1, 0] : h < 3 ? [0, 1, x] : h < 4 ? [0, x, 1] : h < 5 ? [x, 0, 1] : [1, 0, x];
        const ch = (c: number) => Math.round(light ? v / 2 + (c * v) / 2 : c * v);
        t[i] = [ch(r), ch(g), ch(b)];
    }
    [51, 91, 132, 173, 214, 255].forEach((g, j) => { t[250 + j] = [g, g, g]; });
    aciTable = t;
    return t;
}

/** Nearest ACI colour; white and near-black map to 7 (follows the CAD background). */
export function mapHexToDxfColor(hex: string = '#ffffff'): number {
    const clean = String(hex || '').trim().replace('#', '').toLowerCase();
    let r: number, g: number, b: number;
    const rgb = /^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(String(hex));
    if (rgb) {
        r = +rgb[1]; g = +rgb[2]; b = +rgb[3];
    } else if (/^[0-9a-f]{6}/.test(clean)) {
        r = parseInt(clean.slice(0, 2), 16); g = parseInt(clean.slice(2, 4), 16); b = parseInt(clean.slice(4, 6), 16);
    } else if (/^[0-9a-f]{3}$/.test(clean)) {
        r = parseInt(clean[0] + clean[0], 16); g = parseInt(clean[1] + clean[1], 16); b = parseInt(clean[2] + clean[2], 16);
    } else {
        return 7;
    }
    if ((r > 225 && g > 225 && b > 225) || (r < 48 && g < 48 && b < 48)) return 7;
    const pal = aciPalette();
    let best = 7, bestD = Infinity;
    for (let i = 1; i <= 255; i++) {
        if (i === 7) continue;
        const [pr, pg, pb] = pal[i];
        // weighted RGB distance (perceptual approximation)
        const d = 2 * (r - pr) ** 2 + 4 * (g - pg) ** 2 + 3 * (b - pb) ** 2;
        if (d < bestD) { bestD = d; best = i; }
    }
    return best;
}

// ─── names and text ─────────────────────────────────────────────────────────

/** Valid, unique DXF symbol name. */
function symbolName(name: string, used: Set<string>): string {
    let base = String(name || '').replace(/[<>/\\":;?*|=`,]/g, '_').trim() || 'LAYER';
    // characters outside ASCII use AutoCAD's \U+XXXX notation (file code page is ANSI_1252)
    base = [...base].map((ch) => {
        const cp = ch.codePointAt(0)!;
        return cp < 128 ? ch : cp <= 0xffff ? `\\U+${cp.toString(16).toUpperCase().padStart(4, '0')}` : '_';
    }).join('');
    if (base.length > 255) base = base.slice(0, 255);
    let candidate = base;
    let i = 2;
    while (used.has(candidate.toUpperCase())) candidate = `${base}_${i++}`;
    used.add(candidate.toUpperCase());
    return candidate;
}

/** Text value for TEXT entities: control codes for Ø ° ±, \U+XXXX for other non-ASCII. */
export function dxfText(s: string): string {
    let out = '';
    for (const ch of String(s ?? '').replace(/\r?\n/g, ' ')) {
        const cp = ch.codePointAt(0)!;
        if (ch === 'Ø' || ch === 'ø' || ch === '⌀') out += '%%c';
        else if (ch === '°') out += '%%d';
        else if (ch === '±') out += '%%p';
        else if (cp < 32) out += ' ';
        else if (cp < 128) out += ch;
        else if (cp <= 0xffff) out += `\\U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
        else out += '?';
    }
    return out;
}

// ─── writer ─────────────────────────────────────────────────────────────────

class Out {
    readonly buf: string[] = [];
    g(code: number, value: string | number) {
        this.buf.push(String(code), typeof value === 'number' ? (Number.isInteger(value) && !isFloatCode(code) ? String(value) : num(value)) : value);
    }
    toString() { return this.buf.join(N) + N; }
}

/** Group codes whose values are reals. */
function isFloatCode(code: number): boolean {
    return (code >= 10 && code <= 59) || (code >= 110 && code <= 149) || (code >= 210 && code <= 239) || (code >= 1010 && code <= 1059);
}

interface LayerOut {
    name: string;
    color: number;
    linetype: LinetypeName;
    off: boolean;
    frozen: boolean;
    locked: boolean;
}

interface DimBlock {
    name: string;
    handle: string;
    recordHandle: string;
    endHandle: string;
    body: Out;
}

const STYLE_LAYER: Partial<Record<PrimStyle, { layer: string; linetype: LinetypeName }>> = {
    center: { layer: 'CENTER', linetype: 'CENTER' },
    hidden: { layer: 'HIDDEN', linetype: 'HIDDEN' },
    dashed: { layer: 'DASHED', linetype: 'DASHED' },
};

class DxfDocument {
    private nextHandle = 0x20;
    readonly r2000: boolean;
    readonly k: number;
    private readonly layers = new Map<string, LayerOut>(); // by AluCAD layer id
    private readonly usedNames = new Set<string>();
    private readonly refLayers = new Map<string, LayerOut>(); // CENTER / HIDDEN / DASHED
    private readonly linetypesUsed = new Set<LinetypeName>(['CONTINUOUS']);
    readonly entities = new Out();
    readonly dimBlocks: DimBlock[] = [];
    readonly h = {
        vportTable: '', ltypeTable: '', layerTable: '', styleTable: '', viewTable: '', ucsTable: '', appidTable: '',
        dimstyleTable: '', blockRecordTable: '', modelRecord: '', paperRecord: '', modelBlock: '', modelEnd: '',
        paperBlock: '', paperEnd: '', rootDict: '', groupDict: '', style: '',
    };
    private bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

    constructor(readonly opts: Required<Pick<DxfExportOptions, 'version' | 'units' | 'explodeDimensions' | 'camProfileOnly'>> & DxfExportOptions) {
        this.r2000 = opts.version !== 'AC1009';
        this.k = opts.units === 'inch' ? 1 / MM_PER_INCH : 1;
        for (const key of Object.keys(this.h) as Array<keyof typeof this.h>) this.h[key] = this.handle();
    }

    handle(): string { return (this.nextHandle++).toString(16).toUpperCase(); }
    get handseed(): string { return this.nextHandle.toString(16).toUpperCase(); }

    // ── layers ──
    registerLayers(layers: Layer[]) {
        const list = layers.some((l) => l.name === '0') ? layers : [{ id: '__0', name: '0', color: '#ffffff', visible: true, locked: false, frozen: false, lineType: 'CONTINUOUS', lineWeight: 1 } as Layer, ...layers];
        for (const l of list) {
            let name: string;
            if (l.name === '0' && !this.usedNames.has('0')) {
                this.usedNames.add('0');
                name = '0';
            } else {
                name = symbolName(l.name, this.usedNames);
            }
            const linetype = linetypeName(l.lineType);
            this.linetypesUsed.add(linetype);
            this.layers.set(l.id, { name, color: mapHexToDxfColor(l.color), linetype, off: l.visible === false, frozen: Boolean(l.frozen) && name !== '0', locked: Boolean(l.locked) });
        }
    }

    layerName(layerId: string): string {
        return this.layers.get(layerId)?.name ?? '0';
    }

    private refLayer(style: PrimStyle): string | null {
        const def = STYLE_LAYER[style];
        if (!def) return null;
        let l = this.refLayers.get(def.layer);
        if (!l) {
            const name = this.usedNames.has(def.layer) ? def.layer : symbolName(def.layer, this.usedNames);
            l = { name, color: 8, linetype: def.linetype, off: false, frozen: false, locked: false };
            this.refLayers.set(def.layer, l);
            this.linetypesUsed.add(def.linetype);
        }
        return l.name;
    }

    // ── geometry ──
    private grow(x: number, y: number) {
        if (x < this.bounds.minX) this.bounds.minX = x;
        if (x > this.bounds.maxX) this.bounds.maxX = x;
        if (y < this.bounds.minY) this.bounds.minY = y;
        if (y > this.bounds.maxY) this.bounds.maxY = y;
    }

    private xy(o: Out, p: Point, codeX = 10, withZ = true) {
        const x = p.x * this.k, y = p.y * this.k;
        this.grow(x, y);
        o.g(codeX, x);
        o.g(codeX + 10, y);
        if (withZ) o.g(codeX + 20, 0);
    }

    private head(o: Out, type: string, layer: string, color: number, owner: string, extra?: { linetype?: string; lineweight?: number }) {
        o.g(0, type);
        if (this.r2000) {
            o.g(5, this.handle());
            o.g(330, owner);
            o.g(100, 'AcDbEntity');
        }
        o.g(8, layer);
        if (extra?.linetype) o.g(6, extra.linetype);
        o.g(62, color);
        if (this.r2000 && extra?.lineweight !== undefined) o.g(370, extra.lineweight);
    }

    /** Writes one primitive; `o`/`owner` select model space or a dimension block. */
    writePrimitive(p: Primitive, layerId: string, color: number, o: Out = this.entities, owner = this.h.modelRecord) {
        if (this.opts.camProfileOnly && (p.style !== 'continuous' || p.kind === 'text' || p.kind === 'point' || p.kind === 'hatch')) return;
        const layer = this.refLayer(p.style) ?? this.layerName(layerId);
        const extra = p.style === 'thin' ? { lineweight: 18 } : undefined;
        const k = this.k;
        switch (p.kind) {
            case 'line': {
                this.head(o, 'LINE', layer, color, owner, extra);
                if (this.r2000) o.g(100, 'AcDbLine');
                this.xy(o, p.a, 10);
                this.xy(o, p.b, 11);
                break;
            }
            case 'circle': {
                if (p.fill && this.r2000) { this.writeSolidRegion([circleRing(p.c, p.r)], layer, color, o, owner); }
                this.head(o, 'CIRCLE', layer, color, owner, extra);
                if (this.r2000) o.g(100, 'AcDbCircle');
                this.xy(o, p.c, 10);
                o.g(40, p.r * k);
                this.growCircle(p.c, p.r);
                break;
            }
            case 'arc': {
                this.head(o, 'ARC', layer, color, owner, extra);
                if (this.r2000) o.g(100, 'AcDbCircle');
                this.xy(o, p.c, 10);
                o.g(40, p.r * k);
                if (this.r2000) o.g(100, 'AcDbArc');
                o.g(50, (normAngle(p.start) * 180) / Math.PI);
                o.g(51, (normAngle(p.end) * 180) / Math.PI);
                this.growCircle(p.c, p.r);
                break;
            }
            case 'ellipse': {
                if (!this.r2000) { this.writeFlattened(p, layer, color, o, owner, extra); break; }
                const majorX = p.rx >= p.ry;
                const major = majorX ? p.rx : p.ry;
                const minor = majorX ? p.ry : p.rx;
                const ang = majorX ? p.rotation : p.rotation + Math.PI / 2;
                const full = p.sweep >= TAU - 1e-9;
                // parameters are measured from the major axis
                const t0 = full ? 0 : majorX ? p.start : p.start - Math.PI / 2;
                const t1 = full ? TAU : t0 + p.sweep;
                this.head(o, 'ELLIPSE', layer, color, owner, extra);
                o.g(100, 'AcDbEllipse');
                this.xy(o, p.c, 10);
                o.g(11, major * Math.cos(ang) * k);
                o.g(21, major * Math.sin(ang) * k);
                o.g(31, 0);
                o.g(40, Math.max(1e-6, Math.min(1, minor / major)));
                o.g(41, full ? 0 : normAngle(t0));
                o.g(42, full ? TAU : normAngle(t0) + (t1 - t0));
                for (const chain of flattenPrimitive(p, 0.5)) for (const q of chain) this.grow(q.x * k, q.y * k);
                break;
            }
            case 'polyline': {
                if (p.points.length < 2) break;
                if (p.fill && p.points.length >= 3 && p.points.length <= 4 && !p.bulges?.some((b) => b)) {
                    this.writeSolid(p.points, layer, color, o, owner);
                    break;
                }
                this.writePolyline(p.points, p.bulges, p.closed, layer, color, o, owner, extra);
                break;
            }
            case 'spline': {
                if (!this.r2000 || p.beziers.length === 0) { this.writeFlattened(p, layer, color, o, owner, extra); break; }
                const segs = p.beziers;
                const ctrl: Point[] = [segs[0].p0];
                for (const s of segs) ctrl.push(s.c1, s.c2, s.p1);
                const m = segs.length;
                const knots: number[] = [0, 0, 0, 0];
                for (let i = 1; i < m; i++) knots.push(i, i, i);
                knots.push(m, m, m, m);
                this.head(o, 'SPLINE', layer, color, owner, extra);
                o.g(100, 'AcDbSpline');
                o.g(210, 0); o.g(220, 0); o.g(230, 1);
                o.g(70, 8); // planar
                o.g(71, 3);
                o.g(72, knots.length);
                o.g(73, ctrl.length);
                o.g(74, 0);
                for (const kv of knots) o.g(40, kv);
                for (const c of ctrl) this.xy(o, c, 10);
                break;
            }
            case 'text':
                this.writeText(p, layer, color, o, owner);
                break;
            case 'point': {
                this.head(o, 'POINT', layer, color, owner);
                if (this.r2000) o.g(100, 'AcDbPoint');
                this.xy(o, p.p, 10);
                break;
            }
            case 'hatch': {
                if (this.r2000) { this.writeHatch(p, layer, color, o, owner); break; }
                // R12: pattern lines as geometry
                if (p.pattern === 'SOLID') break;
                for (const [a, b] of hatchSegments(p.rings, p.pattern, p.scale, p.angle).segments) {
                    this.head(o, 'LINE', layer, color, owner);
                    this.xy(o, a, 10);
                    this.xy(o, b, 11);
                }
                break;
            }
        }
    }

    private growCircle(c: Point, r: number) {
        this.grow((c.x - r) * this.k, (c.y - r) * this.k);
        this.grow((c.x + r) * this.k, (c.y + r) * this.k);
    }

    private writeFlattened(p: Primitive, layer: string, color: number, o: Out, owner: string, extra?: { lineweight?: number }) {
        const closed = (p.kind === 'spline' && p.closed) || (p.kind === 'ellipse' && p.sweep >= TAU - 1e-9);
        for (const chain of flattenPrimitive(p, 0.01)) {
            const pts = closed && chain.length > 2 ? chain.slice(0, -1) : chain;
            if (pts.length >= 2) this.writePolyline(pts, undefined, closed, layer, color, o, owner, extra);
        }
    }

    private writePolyline(points: Point[], bulges: number[] | undefined, closed: boolean, layer: string, color: number, o: Out, owner: string, extra?: { lineweight?: number }) {
        const k = this.k;
        if (this.r2000) {
            this.head(o, 'LWPOLYLINE', layer, color, owner, extra);
            o.g(100, 'AcDbPolyline');
            o.g(90, points.length);
            o.g(70, closed ? 1 : 0);
            o.g(43, 0);
            points.forEach((v, i) => {
                o.g(10, v.x * k);
                o.g(20, v.y * k);
                this.grow(v.x * k, v.y * k);
                const b = bulges?.[i] ?? 0;
                if (Math.abs(b) > 1e-12) o.g(42, b);
            });
        } else {
            this.head(o, 'POLYLINE', layer, color, owner);
            o.g(66, 1);
            o.g(10, 0); o.g(20, 0); o.g(30, 0);
            o.g(70, closed ? 1 : 0);
            points.forEach((v, i) => {
                o.g(0, 'VERTEX');
                o.g(8, layer);
                this.xy(o, v, 10);
                const b = bulges?.[i] ?? 0;
                if (Math.abs(b) > 1e-12) o.g(42, b);
            });
            o.g(0, 'SEQEND');
            o.g(8, layer);
        }
        if (bulges?.some((b) => b)) {
            for (const chain of flattenPrimitive({ kind: 'polyline', points, bulges, closed, style: 'continuous' }, 0.5)) {
                for (const q of chain) this.grow(q.x * k, q.y * k);
            }
        }
    }

    /** 2-D SOLID (filled triangle / quad; DXF vertex order is zig-zag). */
    private writeSolid(points: Point[], layer: string, color: number, o: Out, owner: string) {
        const [a, b, c, d] = points.length === 3 ? [points[0], points[1], points[2], points[2]] : [points[0], points[1], points[3], points[2]];
        this.head(o, 'SOLID', layer, color, owner);
        if (this.r2000) o.g(100, 'AcDbTrace');
        this.xy(o, a, 10);
        this.xy(o, b, 11);
        this.xy(o, c, 12);
        this.xy(o, d, 13);
    }

    private writeText(t: TextPrim, layer: string, color: number, o: Out, owner: string) {
        const k = this.k;
        const h = t.height;
        // AluCAD anchors text at its top edge; DXF TEXT sits on its baseline
        const base = { x: t.position.x + Math.sin(t.rotation) * h, y: t.position.y - Math.cos(t.rotation) * h };
        const halign = t.align === 'center' ? 1 : t.align === 'right' ? 2 : 0;
        this.head(o, 'TEXT', layer, color, owner);
        if (this.r2000) o.g(100, 'AcDbText');
        this.xy(o, base, 10);
        o.g(40, h * k);
        o.g(1, dxfText(t.content));
        const deg = (normAngle(t.rotation) * 180) / Math.PI;
        if (Math.abs(deg) > 1e-9) o.g(50, deg);
        o.g(7, 'Standard');
        if (halign) {
            o.g(72, halign);
            this.xy(o, base, 11);
        }
        if (this.r2000) o.g(100, 'AcDbText');
        // extents: rough text box
        const w = t.content.length * h * 0.6;
        this.grow((base.x + Math.cos(t.rotation) * w) * k, (base.y + Math.sin(t.rotation) * w) * k);
        this.grow(t.position.x * k, t.position.y * k);
    }

    private hatchHeader(o: Out, layer: string, color: number, owner: string, patternName: string, solid: boolean, rings: Point[][]) {
        this.head(o, 'HATCH', layer, color, owner);
        o.g(100, 'AcDbHatch');
        o.g(10, 0); o.g(20, 0); o.g(30, 0);
        o.g(210, 0); o.g(220, 0); o.g(230, 1);
        o.g(2, patternName);
        o.g(70, solid ? 1 : 0);
        o.g(71, 0);
        o.g(91, rings.length);
        rings.forEach((ring, i) => {
            o.g(92, i === 0 ? 3 : 2); // polyline path; the first one is the external boundary
            o.g(72, 0);
            o.g(73, 1);
            o.g(93, ring.length);
            for (const v of ring) {
                o.g(10, v.x * this.k);
                o.g(20, v.y * this.k);
                this.grow(v.x * this.k, v.y * this.k);
            }
            o.g(97, 0);
        });
        o.g(75, 0); // normal (odd parity) island detection
        o.g(76, 1); // predefined pattern
    }

    private writeHatch(p: Extract<Primitive, { kind: 'hatch' }>, layer: string, color: number, o: Out, owner: string) {
        const rings = p.rings.filter((r) => r.length >= 3).map((r) => dedupeRing(r));
        if (rings.length === 0) return;
        if (p.pattern === 'SOLID') {
            this.writeSolidRegion(rings, layer, color, o, owner);
            return;
        }
        const def = HATCH_PATTERNS[p.pattern];
        this.hatchHeader(o, layer, color, owner, def.dxfName, false, rings);
        o.g(52, normAngle((hatchRotationDeg(p.angle) * Math.PI) / 180) * (180 / Math.PI));
        o.g(41, p.scale);
        o.g(77, 0);
        const fams = worldPatternLines(p.pattern, p.scale, p.angle);
        o.g(78, fams.length);
        for (const f of fams) {
            o.g(53, f.angle);
            o.g(43, f.base.x * this.k);
            o.g(44, f.base.y * this.k);
            o.g(45, f.offset.x * this.k);
            o.g(46, f.offset.y * this.k);
            o.g(79, f.dashes.length);
            for (const d of f.dashes) o.g(49, d * this.k);
        }
        o.g(98, 0);
    }

    private writeSolidRegion(rings: Point[][], layer: string, color: number, o: Out, owner: string) {
        this.hatchHeader(o, layer, color, owner, 'SOLID', true, rings);
        o.g(98, 0);
    }

    // ── dimensions ──
    writeDimension(entity: CadEntity, color: number) {
        const g = entity.geometry as any;
        const prims = dimensionPrimitives(g, this.opts.displayUnits ?? 'mm');
        if (prims.length === 0) return;
        const layer = this.layerName(entity.layerId);
        if (this.opts.explodeDimensions) {
            for (const p of prims) this.writePrimitive(p, entity.layerId, color);
            return;
        }
        // associative DIMENSION + its anonymous *D block holding the graphics
        const block: DimBlock = { name: `*D${this.dimBlocks.length + 1}`, handle: this.handle(), recordHandle: this.handle(), endHandle: this.handle(), body: new Out() };
        // block content on layer 0 with colour BYBLOCK inherits the dimension's layer and colour
        for (const p of prims) this.writePrimitive(p, '__block_layer_0', 0, block.body, block.recordHandle);
        this.dimBlocks.push(block);

        const p1: Point = g.start, p2: Point = g.end;
        const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const nx = -(p2.y - p1.y) / len, ny = (p2.x - p1.x) / len;
        let off = 10;
        if (g.textPoint) {
            const proj = (g.textPoint.x - p1.x) * nx + (g.textPoint.y - p1.y) * ny;
            if (Math.abs(proj) > 1e-6) off = proj;
        }
        const d2 = { x: p2.x + nx * off, y: p2.y + ny * off };
        const textPrim = prims.find((p): p is TextPrim => p.kind === 'text');
        const mid = textPrim ? { x: textPrim.position.x, y: textPrim.position.y } : { x: (p1.x + p2.x) / 2 + nx * off, y: (p1.y + p2.y) / 2 + ny * off };
        const label = dimensionLabel(g, this.opts.displayUnits ?? 'mm');
        let override = g.text ? dxfText(g.text) : '<>';
        if (label.upper !== undefined) override += `\\S${label.upper}^${label.lower};`;

        const o = this.entities;
        this.head(o, 'DIMENSION', layer, color, this.h.modelRecord);
        if (this.r2000) o.g(100, 'AcDbDimension');
        o.g(2, block.name);
        this.xy(o, d2, 10);
        this.xy(o, mid, 11);
        o.g(70, 1 + 32); // aligned, block used by this dimension only
        if (this.r2000) o.g(71, 5); // text attachment: middle centre
        o.g(1, override);
        o.g(3, 'Standard');
        if (this.r2000) o.g(100, 'AcDbAlignedDimension');
        this.xy(o, p1, 13);
        this.xy(o, p2, 14);
    }

    // ── sections ──
    build(): string {
        const ext = Number.isFinite(this.bounds.minX) ? this.bounds : { minX: 0, minY: 0, maxX: 100, maxY: 100 };
        // tables, blocks and objects allocate handles: write them before the header so
        // $HANDSEED ends up above every handle in the file
        const tables = new Out();
        this.tables(tables, ext);
        const blocks = new Out();
        this.blocks(blocks);
        const objects = new Out();
        if (this.r2000) this.objects(objects);

        const out = new Out();
        this.header(out, ext);
        if (this.r2000) {
            out.g(0, 'SECTION'); out.g(2, 'CLASSES'); out.g(0, 'ENDSEC');
        }
        out.buf.push(...tables.buf, ...blocks.buf);
        out.g(0, 'SECTION'); out.g(2, 'ENTITIES');
        out.buf.push(...this.entities.buf);
        out.g(0, 'ENDSEC');
        out.buf.push(...objects.buf);
        out.g(0, 'EOF');
        return out.toString();
    }

    private header(o: Out, ext: { minX: number; minY: number; maxX: number; maxY: number }) {
        const inch = this.opts.units === 'inch';
        o.g(0, 'SECTION'); o.g(2, 'HEADER');
        const v = (name: string, code: number, value: string | number) => { o.g(9, name); o.g(code, value); };
        v('$ACADVER', 1, this.r2000 ? 'AC1015' : 'AC1009');
        if (this.r2000) v('$ACADMAINTVER', 70, 6);
        v('$DWGCODEPAGE', 3, 'ANSI_1252');
        o.g(9, '$INSBASE'); o.g(10, 0); o.g(20, 0); o.g(30, 0);
        o.g(9, '$EXTMIN'); o.g(10, ext.minX); o.g(20, ext.minY); o.g(30, 0);
        o.g(9, '$EXTMAX'); o.g(10, ext.maxX); o.g(20, ext.maxY); o.g(30, 0);
        o.g(9, '$LIMMIN'); o.g(10, ext.minX); o.g(20, ext.minY);
        o.g(9, '$LIMMAX'); o.g(10, ext.maxX); o.g(20, ext.maxY);
        v('$LTSCALE', 40, 1);
        v('$TEXTSIZE', 40, 3.5 * this.k);
        v('$TEXTSTYLE', 7, 'Standard');
        v('$CLAYER', 8, '0');
        v('$CELTYPE', 6, this.r2000 ? 'ByLayer' : 'BYLAYER');
        v('$DIMSTYLE', 2, 'Standard');
        v('$DIMASZ', 40, 3 * this.k);
        v('$DIMTXT', 40, 3.5 * this.k);
        v('$LUNITS', 70, 2);
        v('$LUPREC', 70, 4);
        v('$AUNITS', 70, 0);
        v('$AUPREC', 70, 2);
        v('$ANGBASE', 50, 0);
        v('$ANGDIR', 70, 0);
        v('$PDMODE', 70, 34);
        v('$PDSIZE', 40, 0);
        v('$MEASUREMENT', 70, inch ? 0 : 1);
        v('$INSUNITS', 70, inch ? 1 : 4);
        if (this.r2000) v('$HANDSEED', 5, this.handseed);
        o.g(0, 'ENDSEC');
    }

    private tableHead(o: Out, name: string, handle: string, count: number, dimstyle = false) {
        o.g(0, 'TABLE');
        o.g(2, name);
        if (this.r2000) {
            o.g(5, handle);
            o.g(330, '0');
            o.g(100, 'AcDbSymbolTable');
        }
        o.g(70, count);
        if (dimstyle && this.r2000) o.g(100, 'AcDbDimStyleTable');
    }

    private record(o: Out, type: string, table: string, subclass: string, handleCode = 5) {
        o.g(0, type);
        if (this.r2000) {
            o.g(handleCode, this.handle());
            o.g(330, table);
            o.g(100, 'AcDbSymbolTableRecord');
            o.g(100, subclass);
        }
    }

    private tables(o: Out, ext: { minX: number; minY: number; maxX: number; maxY: number }) {
        o.g(0, 'SECTION'); o.g(2, 'TABLES');
        const h = this.h;

        // VPORT: open zoomed to the drawing extents
        this.tableHead(o, 'VPORT', h.vportTable, 1);
        this.record(o, 'VPORT', h.vportTable, 'AcDbViewportTableRecord');
        o.g(2, '*ACTIVE'); o.g(70, 0);
        o.g(10, 0); o.g(20, 0); o.g(11, 1); o.g(21, 1);
        o.g(12, (ext.minX + ext.maxX) / 2); o.g(22, (ext.minY + ext.maxY) / 2);
        o.g(13, 0); o.g(23, 0); o.g(14, 10 * this.k); o.g(24, 10 * this.k); o.g(15, 10 * this.k); o.g(25, 10 * this.k);
        o.g(16, 0); o.g(26, 0); o.g(36, 1); o.g(17, 0); o.g(27, 0); o.g(37, 0);
        o.g(40, Math.max(1, (ext.maxY - ext.minY) * 1.15, (ext.maxX - ext.minX) * 1.15 / 1.6));
        o.g(41, 1.6); o.g(42, 50); o.g(43, 0); o.g(44, 0); o.g(50, 0); o.g(51, 0);
        o.g(71, 0); o.g(72, 1000); o.g(73, 1); o.g(74, 3); o.g(75, 0); o.g(76, 0); o.g(77, 0); o.g(78, 0);
        if (this.r2000) { o.g(281, 0); o.g(65, 1); o.g(146, 0); }
        o.g(0, 'ENDTAB');

        // LTYPE
        const lts = LINETYPE_NAMES.filter((n) => this.linetypesUsed.has(n) || n === 'CONTINUOUS');
        const extraLt = this.r2000 ? ['ByBlock', 'ByLayer'] : [];
        this.tableHead(o, 'LTYPE', h.ltypeTable, lts.length + extraLt.length);
        for (const name of extraLt) {
            this.record(o, 'LTYPE', h.ltypeTable, 'AcDbLinetypeTableRecord');
            o.g(2, name); o.g(70, 0); o.g(3, ''); o.g(72, 65); o.g(73, 0); o.g(40, 0);
        }
        for (const name of lts) {
            const def = LINETYPES[name];
            this.record(o, 'LTYPE', h.ltypeTable, 'AcDbLinetypeTableRecord');
            o.g(2, name === 'CONTINUOUS' && this.r2000 ? 'Continuous' : name);
            o.g(70, 0);
            o.g(3, def.description);
            o.g(72, 65);
            o.g(73, def.pattern.length);
            o.g(40, def.pattern.reduce((s, d) => s + Math.abs(d), 0) * this.k);
            for (const d of def.pattern) {
                o.g(49, d * this.k);
                if (this.r2000) o.g(74, 0);
            }
        }
        o.g(0, 'ENDTAB');

        // LAYER
        const all = [...this.layers.values(), ...this.refLayers.values()];
        this.tableHead(o, 'LAYER', h.layerTable, all.length);
        for (const l of all) {
            this.record(o, 'LAYER', h.layerTable, 'AcDbLayerTableRecord');
            o.g(2, l.name);
            o.g(70, (l.frozen ? 1 : 0) | (l.locked ? 4 : 0));
            o.g(62, l.off ? -l.color : l.color);
            o.g(6, l.linetype === 'CONTINUOUS' && this.r2000 ? 'Continuous' : l.linetype);
            if (this.r2000) o.g(370, -3);
        }
        o.g(0, 'ENDTAB');

        // STYLE
        this.tableHead(o, 'STYLE', h.styleTable, 1);
        o.g(0, 'STYLE');
        if (this.r2000) { o.g(5, h.style); o.g(330, h.styleTable); o.g(100, 'AcDbSymbolTableRecord'); o.g(100, 'AcDbTextStyleTableRecord'); }
        o.g(2, 'Standard'); o.g(70, 0); o.g(40, 0); o.g(41, 1); o.g(50, 0); o.g(71, 0); o.g(42, 3.5 * this.k); o.g(3, 'txt'); o.g(4, '');
        o.g(0, 'ENDTAB');

        // VIEW, UCS (empty)
        this.tableHead(o, 'VIEW', h.viewTable, 0); o.g(0, 'ENDTAB');
        this.tableHead(o, 'UCS', h.ucsTable, 0); o.g(0, 'ENDTAB');

        // APPID
        this.tableHead(o, 'APPID', h.appidTable, 1);
        this.record(o, 'APPID', h.appidTable, 'AcDbRegAppTableRecord');
        o.g(2, 'ACAD'); o.g(70, 0);
        o.g(0, 'ENDTAB');

        // DIMSTYLE (ISO-like: 3.5 mm text above the line, 3 mm arrows)
        this.tableHead(o, 'DIMSTYLE', h.dimstyleTable, 1, true);
        this.record(o, 'DIMSTYLE', h.dimstyleTable, 'AcDbDimStyleTableRecord', 105);
        o.g(2, 'Standard'); o.g(70, 0);
        o.g(3, this.opts.units === 'inch' ? '<>"' : (this.opts.displayUnits ?? 'mm') === 'in' ? '<>' : '<> mm');
        o.g(40, 1); o.g(41, 3 * this.k); o.g(42, 0); o.g(43, 3.75 * this.k); o.g(44, 2 * this.k);
        o.g(140, 3.5 * this.k); o.g(147, 1 * this.k);
        // text aligned with the line, above it; keep trailing zeros like the canvas (120.00)
        o.g(73, 0); o.g(74, 0); o.g(77, 1); o.g(78, 0);
        if (this.r2000) { o.g(271, 2); o.g(278, 46); o.g(340, h.style); }
        o.g(0, 'ENDTAB');

        // BLOCK_RECORD
        if (this.r2000) {
            this.tableHead(o, 'BLOCK_RECORD', h.blockRecordTable, 2 + this.dimBlocks.length);
            const br = (handle: string, name: string) => {
                o.g(0, 'BLOCK_RECORD'); o.g(5, handle); o.g(330, h.blockRecordTable);
                o.g(100, 'AcDbSymbolTableRecord'); o.g(100, 'AcDbBlockTableRecord'); o.g(2, name);
            };
            br(h.modelRecord, '*Model_Space');
            br(h.paperRecord, '*Paper_Space');
            for (const b of this.dimBlocks) br(b.recordHandle, b.name);
            o.g(0, 'ENDTAB');
        }
        o.g(0, 'ENDSEC');
    }

    private blocks(o: Out) {
        const h = this.h;
        if (!this.r2000 && this.dimBlocks.length === 0) return;
        o.g(0, 'SECTION'); o.g(2, 'BLOCKS');
        const begin = (handle: string, owner: string, name: string, flags: number, paper = false) => {
            o.g(0, 'BLOCK');
            if (this.r2000) { o.g(5, handle); o.g(330, owner); o.g(100, 'AcDbEntity'); }
            if (paper && this.r2000) o.g(67, 1);
            o.g(8, '0');
            if (this.r2000) o.g(100, 'AcDbBlockBegin');
            o.g(2, name); o.g(70, flags); o.g(10, 0); o.g(20, 0); o.g(30, 0); o.g(3, name); o.g(1, '');
        };
        const end = (handle: string, owner: string, paper = false) => {
            o.g(0, 'ENDBLK');
            if (this.r2000) { o.g(5, handle); o.g(330, owner); o.g(100, 'AcDbEntity'); }
            if (paper && this.r2000) o.g(67, 1);
            o.g(8, '0');
            if (this.r2000) o.g(100, 'AcDbBlockEnd');
        };
        if (this.r2000) {
            begin(h.modelBlock, h.modelRecord, '*Model_Space', 0);
            end(h.modelEnd, h.modelRecord);
            begin(h.paperBlock, h.paperRecord, '*Paper_Space', 0, true);
            end(h.paperEnd, h.paperRecord, true);
        }
        for (const b of this.dimBlocks) {
            begin(b.handle, b.recordHandle, b.name, 1);
            o.buf.push(...b.body.buf);
            end(b.endHandle, b.recordHandle);
        }
        o.g(0, 'ENDSEC');
    }

    private objects(o: Out) {
        const h = this.h;
        o.g(0, 'SECTION'); o.g(2, 'OBJECTS');
        o.g(0, 'DICTIONARY'); o.g(5, h.rootDict); o.g(330, '0'); o.g(100, 'AcDbDictionary'); o.g(281, 1);
        o.g(3, 'ACAD_GROUP'); o.g(350, h.groupDict);
        o.g(0, 'DICTIONARY'); o.g(5, h.groupDict); o.g(330, h.rootDict); o.g(100, 'AcDbDictionary'); o.g(281, 1);
        o.g(0, 'ENDSEC');
    }
}

function circleRing(c: Point, r: number): Point[] {
    const pts: Point[] = [];
    const n = 72;
    for (let i = 0; i < n; i++) pts.push({ x: c.x + r * Math.cos((i / n) * TAU), y: c.y + r * Math.sin((i / n) * TAU) });
    return pts;
}

function dedupeRing(r: Point[]): Point[] {
    const out: Point[] = [];
    for (const p of r) {
        const last = out[out.length - 1];
        if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 1e-9) out.push(p);
    }
    if (out.length > 2 && Math.hypot(out[0].x - out[out.length - 1].x, out[0].y - out[out.length - 1].y) <= 1e-9) out.pop();
    return out;
}

/**
 * Writes entities and layers as a DXF document (CRLF line endings).
 */
export function generateDXF(entities: CadEntity[], layers: Layer[] = [], options: DxfExportOptions = {}): string {
    const doc = new DxfDocument({
        ...options,
        version: options.version ?? 'AC1015',
        units: options.units ?? 'mm',
        explodeDimensions: options.explodeDimensions ?? true,
        camProfileOnly: options.camProfileOnly ?? false,
    });
    doc.registerLayers(layers);
    const layerColor = new Map(layers.map((l) => [l.id, l.color]));

    for (const entity of entities) {
        if (!entity || entity.isVisible === false || !entity.geometry) continue;
        const color = mapHexToDxfColor(entity.color || layerColor.get(entity.layerId) || '#ffffff');
        const type = entity.geometry.type;
        if (type === 'DIMENSION') {
            if (!options.camProfileOnly) doc.writeDimension(entity, color);
            continue;
        }
        if (options.camProfileOnly && type === 'LEADER') continue;
        for (const p of geometryPrimitives(entity.geometry, options.displayUnits ?? 'mm')) {
            doc.writePrimitive(p, entity.layerId, color);
        }
    }
    return doc.build();
}

/** Bounding box (mm) of what `generateDXF` would write — used by the export dialog. */
export function drawingExtents(entities: CadEntity[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
    const prims: Primitive[] = [];
    for (const e of entities) if (e.isVisible !== false) prims.push(...geometryPrimitives(e.geometry));
    return primitiveBounds(prims);
}
