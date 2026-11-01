/**
 * True-shape 2D nesting on an occupancy raster (no-overlap guaranteed).
 *
 * Methodology tier: Heuristic (documented algorithm + regression tests in
 * src/tests/raster-nesting.test.ts).
 *
 *  - Every part (outer contour + holes, at each allowed rotation) is rasterised
 *    conservatively: a cell is "material" when the part touches it (scanline fill
 *    of cell centres + supercover rasterisation of every boundary edge).
 *  - The material mask is dilated with an exact Euclidean distance transform by
 *    ρ = gap/2 + r·√2 (gap = spacing + kerf, r = cell size). Two dilated masks that
 *    do not share a cell are provably ≥ gap apart in real geometry, so the result
 *    never overlaps and always keeps the requested web between parts.
 *  - Holes stay empty in the mask, so small parts can be nested inside the cut-outs
 *    of large parts (true part-in-part), concave parts interlock, and round parts are
 *    not treated as boxes.
 *  - Placement is bottom-left fill along the chosen axis (default: pack to the
 *    left so the reusable remnant is a clean strip on the right). The sheet is a
 *    bitset per row; a per-column "occupied run" table lets the scan jump over
 *    occupied stretches instead of testing every cell.
 *
 * Coordinates are millimetres, Y up (DXF convention). Returned contours are the
 * exact input geometry rotated about the origin and translated – no faceting is
 * introduced by the raster.
 */

export interface NestPoint { x: number; y: number }

export interface NestPartInput {
    id: string;
    label?: string;
    /** Outer boundary (any orientation, closed implicitly). */
    outer: NestPoint[];
    /** Inner cut-outs. */
    holes?: NestPoint[][];
    quantity: number;
    /** Allowed rotations in degrees (default [0, 90, 180, 270]). */
    rotations?: number[];
    /** Higher priority is placed first (default 0). */
    priority?: number;
}

export interface RasterNestOptions {
    sheetWidth: number;
    sheetHeight: number;
    /** Web between two parts' kerf edges (mm). */
    spacing: number;
    /** Beam width (mm). Total outline-to-outline clearance = spacing + kerf. */
    kerf: number;
    /** Extra clearance to the sheet border (mm). */
    edgeMargin?: number;
    /** Cell size in mm. Default: chosen so the sheet has ≤ maxCells cells. */
    resolution?: number;
    maxCells?: number;
    /** Allow nesting parts inside other parts' holes (default true). */
    partInPart?: boolean;
    maxSheets?: number;
    /** 'x' packs towards x = 0 (remnant on the right), 'y' packs towards y = 0. */
    fillAxis?: 'x' | 'y';
    onProgress?: (placed: number, total: number, sheetIndex: number) => void;
    shouldCancel?: () => boolean;
}

export interface RasterPlacement {
    partId: string;
    label?: string;
    instanceIndex: number;
    sheetIndex: number;
    rotation: number;
    /** World transform: p' = R(rotation)·p + (tx, ty). */
    tx: number;
    ty: number;
    outer: NestPoint[];
    holes: NestPoint[][];
    /** Net material area of the part (outer − holes), mm². */
    area: number;
    bounds: { x: number; y: number; width: number; height: number };
}

export interface RasterSheetStats {
    sheetIndex: number;
    partCount: number;
    usedArea: number;
    /** Extent of the placed material along x / y (mm), for remnant calculation. */
    maxX: number;
    maxY: number;
}

export interface RasterNestResult {
    placements: RasterPlacement[];
    unplaced: { partId: string; instanceIndex: number; reason: string }[];
    sheets: RasterSheetStats[];
    resolution: number;
    cancelled: boolean;
    computeTimeMs: number;
}

// ─── geometry helpers ───────────────────────────────────────────────────────

export function signedArea(pts: NestPoint[]): number {
    let a = 0;
    for (let i = 0, n = pts.length; i < n; i++) {
        const p = pts[i], q = pts[(i + 1) % n];
        a += p.x * q.y - q.x * p.y;
    }
    return a / 2;
}

export function netArea(outer: NestPoint[], holes: NestPoint[][] = []): number {
    return Math.abs(signedArea(outer)) - holes.reduce((s, h) => s + Math.abs(signedArea(h)), 0);
}

function rotatePts(pts: NestPoint[], deg: number): NestPoint[] {
    if (!deg) return pts.map(p => ({ x: p.x, y: p.y }));
    const t = (deg * Math.PI) / 180;
    // exact quarter turns avoid 1e-16 noise in the output geometry
    const q = ((Math.round(deg) % 360) + 360) % 360;
    const c = q === 90 || q === 270 ? 0 : q === 180 ? -1 : q === 0 ? 1 : Math.cos(t);
    const s = q === 0 || q === 180 ? 0 : q === 90 ? 1 : q === 270 ? -1 : Math.sin(t);
    return pts.map(p => ({ x: c * p.x - s * p.y, y: s * p.x + c * p.y }));
}

function boundsOf(contours: NestPoint[][]) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of contours) for (const p of c) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY };
}

// ─── masks ──────────────────────────────────────────────────────────────────

interface Mask {
    w: number; // cells
    h: number;
    words: number; // Uint32 words per row
    rows: Uint32Array; // h * words
    /** local → mask origin (world mm of cell (0,0) lower-left corner, in rotated part coordinates) */
    ox: number;
    oy: number;
    filled: number;
}

/** 1-D squared Euclidean distance transform (Felzenszwalb & Huttenlocher 2012). */
function edt1d(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array) {
    let k = 0;
    v[0] = 0;
    z[0] = -Infinity;
    z[1] = Infinity;
    for (let q = 1; q < n; q++) {
        let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
        while (s <= z[k]) {
            k--;
            s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
        }
        k++;
        v[k] = q;
        z[k] = s;
        z[k + 1] = Infinity;
    }
    k = 0;
    for (let q = 0; q < n; q++) {
        while (z[k + 1] < q) k++;
        const dq = q - v[k];
        d[q] = dq * dq + f[v[k]];
    }
}

/**
 * Rasterise a part (already rotated) and dilate it by `radiusCells` (in cells).
 */
function buildMask(outer: NestPoint[], holes: NestPoint[][], r: number, radiusCells: number): Mask {
    const contours = [outer, ...holes];
    const b = boundsOf(contours);
    const pad = Math.ceil(radiusCells) + 1;
    const ox = Math.floor(b.minX / r) * r - pad * r;
    const oy = Math.floor(b.minY / r) * r - pad * r;
    const w = Math.ceil((b.maxX - ox) / r) + pad + 1;
    const h = Math.ceil((b.maxY - oy) / r) + pad + 1;
    const mat = new Uint8Array(w * h);

    // 1) cell centres inside material (even-odd over all contours)
    const xs: number[] = [];
    for (let j = 0; j < h; j++) {
        const yc = oy + (j + 0.5) * r;
        xs.length = 0;
        for (const c of contours) {
            for (let i = 0, n = c.length; i < n; i++) {
                const p = c[i], q = c[(i + 1) % n];
                if ((p.y <= yc && q.y > yc) || (q.y <= yc && p.y > yc)) {
                    xs.push(p.x + ((yc - p.y) / (q.y - p.y)) * (q.x - p.x));
                }
            }
        }
        xs.sort((a, b2) => a - b2);
        for (let k = 0; k + 1 < xs.length; k += 2) {
            const i0 = Math.max(0, Math.ceil((xs[k] - ox) / r - 0.5));
            const i1 = Math.min(w - 1, Math.floor((xs[k + 1] - ox) / r - 0.5));
            for (let i = i0; i <= i1; i++) mat[j * w + i] = 1;
        }
    }
    // 2) supercover of every edge: cells the boundary passes through are material too
    for (const c of contours) {
        for (let i = 0, n = c.length; i < n; i++) {
            const p = c[i], q = c[(i + 1) % n];
            const x0 = (p.x - ox) / r, y0 = (p.y - oy) / r, x1 = (q.x - ox) / r, y1 = (q.y - oy) / r;
            const len = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
            const steps = Math.max(1, Math.ceil(len * 2));
            let pi = -1, pj = -1;
            for (let s = 0; s <= steps; s++) {
                const t = s / steps;
                const ci = Math.floor(x0 + (x1 - x0) * t), cj = Math.floor(y0 + (y1 - y0) * t);
                if (ci >= 0 && cj >= 0 && ci < w && cj < h) {
                    mat[cj * w + ci] = 1;
                    // diagonal moves: mark both neighbours so the cover is gap-free
                    if (pi >= 0 && ci !== pi && cj !== pj) {
                        mat[pj * w + ci] = 1;
                        mat[cj * w + pi] = 1;
                    }
                }
                pi = ci; pj = cj;
            }
        }
    }

    // 3) dilate by radiusCells using an exact squared EDT
    const INF = 1e20;
    const g = new Float64Array(w * h);
    const n = Math.max(w, h);
    const f = new Float64Array(n), d = new Float64Array(n), z = new Float64Array(n + 1);
    const v = new Int32Array(n);
    for (let i = 0; i < w; i++) { // columns
        for (let j = 0; j < h; j++) f[j] = mat[j * w + i] ? 0 : INF;
        edt1d(f, h, d, v, z);
        for (let j = 0; j < h; j++) g[j * w + i] = d[j];
    }
    const words = (w + 31) >>> 5;
    const rows = new Uint32Array(h * words);
    const r2 = radiusCells * radiusCells + 1e-9;
    let filled = 0;
    for (let j = 0; j < h; j++) { // rows
        for (let i = 0; i < w; i++) f[i] = g[j * w + i];
        edt1d(f, w, d, v, z);
        for (let i = 0; i < w; i++) {
            if (d[i] <= r2) {
                rows[j * words + (i >>> 5)] |= 1 << (i & 31);
                filled++;
            }
        }
    }
    return { w, h, words, rows, ox, oy, filled };
}

// ─── sheet raster ───────────────────────────────────────────────────────────

class SheetGrid {
    readonly words: number;
    readonly rows: Uint32Array;
    /** run[c * H + y] = number of consecutive occupied cells in column c starting at y (upwards) */
    readonly run: Int32Array;
    constructor(readonly W: number, readonly H: number, border: number) {
        this.words = ((W + 31) >>> 5) + 1; // +1 guard word for shifted reads
        this.rows = new Uint32Array(H * this.words);
        this.run = new Int32Array(W * H);
        if (border > 0) {
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
                if (x < border || y < border || x >= W - border || y >= H - border) this.set(x, y);
            }
        }
        this.rebuildRuns(0, W);
    }
    occupied(x: number, y: number): boolean {
        return ((this.rows[y * this.words + (x >>> 5)] >>> (x & 31)) & 1) === 1;
    }
    set(x: number, y: number) {
        this.rows[y * this.words + (x >>> 5)] |= 1 << (x & 31);
    }
    rebuildRuns(x0: number, x1: number) {
        const { H } = this;
        for (let c = Math.max(0, x0); c < Math.min(this.W, x1); c++) {
            let acc = 0;
            const base = c * H;
            for (let y = H - 1; y >= 0; y--) {
                acc = this.occupied(c, y) ? acc + 1 : 0;
                this.run[base + y] = acc;
            }
        }
    }
    /**
     * Test the mask at (x, y). Returns -1 when it fits, otherwise the next y worth
     * testing in the same column offset.
     */
    test(m: Mask, x: number, y: number): number {
        const sw = this.words, b = x & 31, w0 = x >>> 5, rows = this.rows;
        for (let j = 0; j < m.h; j++) {
            const srow = (y + j) * sw + w0;
            const mrow = j * m.words;
            for (let k = 0; k < m.words; k++) {
                const mk = m.rows[mrow + k];
                if (mk === 0) continue;
                const s = b === 0 ? rows[srow + k] : (rows[srow + k] >>> b) | (rows[srow + k + 1] << (32 - b));
                const hit = s & mk;
                if (hit !== 0) {
                    const bit = 31 - Math.clz32(hit & -hit);
                    const c = x + (k << 5) + bit;
                    return y + Math.max(1, this.run[c * this.H + y + j]);
                }
            }
        }
        return -1;
    }
    place(m: Mask, x: number, y: number) {
        const sw = this.words, b = x & 31, w0 = x >>> 5, rows = this.rows;
        for (let j = 0; j < m.h; j++) {
            const srow = (y + j) * sw + w0;
            const mrow = j * m.words;
            for (let k = 0; k < m.words; k++) {
                const mk = m.rows[mrow + k];
                if (mk === 0) continue;
                rows[srow + k] |= mk << b;
                if (b !== 0) rows[srow + k + 1] |= mk >>> (32 - b);
            }
        }
        this.rebuildRuns(x, x + m.w);
    }
    /** Leftmost-then-lowest (fillAxis x) or lowest-then-leftmost (fillAxis y) feasible cell. */
    firstFit(m: Mask, axis: 'x' | 'y', bestLimit: number): { x: number; y: number } | null {
        const maxX = this.W - m.w, maxY = this.H - m.h;
        if (maxX < 0 || maxY < 0) return null;
        if (axis === 'x') {
            for (let x = 0; x <= maxX; x++) {
                if (x + m.w >= bestLimit) return null; // cannot beat the best rotation found so far
                let y = 0;
                while (y <= maxY) {
                    const next = this.test(m, x, y);
                    if (next < 0) return { x, y };
                    y = next;
                }
            }
            return null;
        }
        // axis y: scan rows; reuse the column test by transposed reasoning is costly,
        // so test x positions per row with a simple skip on collision.
        for (let y = 0; y <= maxY; y++) {
            if (y + m.h >= bestLimit) return null;
            for (let x = 0; x <= maxX; x++) {
                if (this.test(m, x, y) < 0) return { x, y };
            }
        }
        return null;
    }
}

// ─── main ───────────────────────────────────────────────────────────────────

const RES_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12.5, 15, 20];

export function chooseResolution(sheetWidth: number, sheetHeight: number, maxCells = 2_500_000): number {
    const ideal = Math.sqrt((sheetWidth * sheetHeight) / maxCells);
    return RES_STEPS.find(s => s >= ideal) ?? Math.ceil(ideal);
}

interface Variant { rotation: number; mask: Mask; outer: NestPoint[]; holes: NestPoint[][] }

export function rasterNest(partsIn: NestPartInput[], opts: RasterNestOptions): RasterNestResult {
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const r = opts.resolution && opts.resolution > 0 ? opts.resolution : chooseResolution(opts.sheetWidth, opts.sheetHeight, opts.maxCells);
    const gap = Math.max(0, (opts.spacing || 0) + (opts.kerf || 0));
    const radiusCells = gap / 2 / r + Math.SQRT2;
    const W = Math.floor(opts.sheetWidth / r);
    const H = Math.floor(opts.sheetHeight / r);
    // dilated masks already keep material ≥ gap/2 from the grid border
    const borderCells = Math.max(0, Math.ceil(((opts.edgeMargin ?? 0) - gap / 2) / r));
    const axis = opts.fillAxis ?? 'x';
    const partInPart = opts.partInPart !== false;
    const maxSheets = Math.max(1, opts.maxSheets ?? 20);

    // variants per part (mask per allowed rotation, identical-shape rotations deduplicated)
    const variants = new Map<string, Variant[]>();
    const areaOf = new Map<string, number>();
    for (const p of partsIn) {
        const holes = p.holes ?? [];
        areaOf.set(p.id, netArea(p.outer, holes));
        const rots = (p.rotations && p.rotations.length ? p.rotations : [0, 90, 180, 270]).map(a => ((a % 360) + 360) % 360);
        const list: Variant[] = [];
        const seen = new Set<string>();
        for (const rot of [...new Set(rots)]) {
            const outer = rotatePts(p.outer, rot);
            const rh = holes.map(h => rotatePts(h, rot));
            const mask = buildMask(outer, partInPart ? rh : [], r, radiusCells);
            const key = `${mask.w}x${mask.h}:${hashMask(mask)}`;
            if (seen.has(key)) continue;
            seen.add(key);
            list.push({ rotation: rot, mask, outer, holes: rh });
        }
        variants.set(p.id, list);
    }

    // instances, large parts first
    type Inst = { part: NestPartInput; index: number; area: number };
    let pending: Inst[] = [];
    for (const p of partsIn) for (let i = 0; i < Math.max(0, Math.floor(p.quantity)); i++) pending.push({ part: p, index: i, area: areaOf.get(p.id) ?? 0 });
    pending.sort((a, b) => (b.part.priority ?? 0) - (a.part.priority ?? 0) || b.area - a.area);
    const total = pending.length;

    const placements: RasterPlacement[] = [];
    const unplaced: RasterNestResult['unplaced'] = [];
    const sheets: RasterSheetStats[] = [];
    let cancelled = false;

    // parts that cannot fit an empty sheet in any rotation are rejected up front
    const emptyFit = new Map<string, boolean>();
    for (const p of partsIn) {
        const fits = (variants.get(p.id) ?? []).some(v => v.mask.w <= W - 2 * borderCells && v.mask.h <= H - 2 * borderCells);
        emptyFit.set(p.id, fits);
    }
    pending = pending.filter(inst => {
        if (emptyFit.get(inst.part.id)) return true;
        unplaced.push({ partId: inst.part.id, instanceIndex: inst.index, reason: 'Part larger than the sheet' });
        return false;
    });

    for (let sheetIndex = 0; sheetIndex < maxSheets && pending.length > 0; sheetIndex++) {
        const grid = new SheetGrid(W, H, borderCells);
        const next: Inst[] = [];
        const stats: RasterSheetStats = { sheetIndex, partCount: 0, usedArea: 0, maxX: 0, maxY: 0 };
        for (const inst of pending) {
            if (opts.shouldCancel?.()) { cancelled = true; next.push(inst); continue; }
            let best: { v: Variant; x: number; y: number; score: number } | null = null;
            for (const v of variants.get(inst.part.id) ?? []) {
                const limit = best ? best.score : Infinity;
                const fit = grid.firstFit(v.mask, axis, limit);
                if (!fit) continue;
                const score = axis === 'x' ? fit.x + v.mask.w + (fit.y + v.mask.h) / (H + 1) : fit.y + v.mask.h + (fit.x + v.mask.w) / (W + 1);
                if (!best || score < best.score) best = { v, x: fit.x, y: fit.y, score };
            }
            if (!best) { next.push(inst); continue; }
            grid.place(best.v.mask, best.x, best.y);
            const tx = best.x * r - best.v.mask.ox;
            const ty = best.y * r - best.v.mask.oy;
            const outer = best.v.outer.map(p => ({ x: p.x + tx, y: p.y + ty }));
            const holes = best.v.holes.map(h => h.map(p => ({ x: p.x + tx, y: p.y + ty })));
            const bb = boundsOf([outer]);
            const area = areaOf.get(inst.part.id) ?? 0;
            placements.push({
                partId: inst.part.id,
                label: inst.part.label,
                instanceIndex: inst.index,
                sheetIndex,
                rotation: best.v.rotation,
                tx, ty, outer, holes, area,
                bounds: { x: bb.minX, y: bb.minY, width: bb.maxX - bb.minX, height: bb.maxY - bb.minY },
            });
            stats.partCount++;
            stats.usedArea += area;
            stats.maxX = Math.max(stats.maxX, bb.maxX);
            stats.maxY = Math.max(stats.maxY, bb.maxY);
            opts.onProgress?.(placements.length, total, sheetIndex);
        }
        if (stats.partCount > 0) sheets.push(stats);
        if (cancelled) { pending = next; break; }
        if (stats.partCount === 0) break; // nothing fits an empty sheet any more
        pending = next;
    }
    for (const inst of pending) {
        unplaced.push({ partId: inst.part.id, instanceIndex: inst.index, reason: cancelled ? 'Cancelled' : 'Max sheets reached' });
    }
    const t1 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    return { placements, unplaced, sheets, resolution: r, cancelled, computeTimeMs: t1 - t0 };
}

function hashMask(m: Mask): number {
    let h = 2166136261;
    for (let i = 0; i < m.rows.length; i += 7) {
        h ^= m.rows[i];
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
