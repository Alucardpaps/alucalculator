import { describe, expect, it } from 'vitest';
import { rasterNest, netArea, type NestPartInput, type NestPoint, type RasterPlacement } from '@/lib/nesting/rasterNest';

// ─── exact geometry checks (independent of the raster) ─────────────────────

function segDist(a: NestPoint, b: NestPoint, c: NestPoint, d: NestPoint): number {
  const cross = (o: NestPoint, p: NestPoint, q: NestPoint) => (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x);
  const d1 = cross(a, b, c), d2 = cross(a, b, d), d3 = cross(c, d, a), d4 = cross(c, d, b);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return 0;
  const pd = (p: NestPoint, s: NestPoint, e: NestPoint) => {
    const vx = e.x - s.x, vy = e.y - s.y;
    const len2 = vx * vx + vy * vy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - s.x) * vx + (p.y - s.y) * vy) / len2));
    return Math.hypot(p.x - (s.x + t * vx), p.y - (s.y + t * vy));
  };
  return Math.min(pd(a, c, d), pd(b, c, d), pd(c, a, b), pd(d, a, b));
}

function contourDist(p: NestPoint[], q: NestPoint[]): number {
  let m = Infinity;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    for (let j = 0; j < q.length; j++) m = Math.min(m, segDist(a, b, q[j], q[(j + 1) % q.length]));
  }
  return m;
}

function inside(pt: NestPoint, poly: NestPoint[]): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

const inMaterial = (pt: NestPoint, p: RasterPlacement) => inside(pt, p.outer) && !p.holes.some((h) => inside(pt, h));

/** Every pair of parts on the same sheet keeps ≥ gap between material and never overlaps. */
function assertClean(placements: RasterPlacement[], gap: number, sheetW: number, sheetH: number) {
  for (const p of placements) {
    for (const v of p.outer) {
      expect(v.x).toBeGreaterThanOrEqual(gap / 2 - 1e-6);
      expect(v.y).toBeGreaterThanOrEqual(gap / 2 - 1e-6);
      expect(v.x).toBeLessThanOrEqual(sheetW - gap / 2 + 1e-6);
      expect(v.y).toBeLessThanOrEqual(sheetH - gap / 2 + 1e-6);
    }
  }
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const a = placements[i], b = placements[j];
      if (a.sheetIndex !== b.sheetIndex) continue;
      const ca = [a.outer, ...a.holes], cb = [b.outer, ...b.holes];
      let m = Infinity;
      for (const p of ca) for (const q of cb) m = Math.min(m, contourDist(p, q));
      expect(m).toBeGreaterThanOrEqual(gap - 1e-6);
      expect(inMaterial(b.outer[0], a)).toBe(false);
      expect(inMaterial(a.outer[0], b)).toBe(false);
    }
  }
}

// ─── fixtures ───────────────────────────────────────────────────────────────

const rect = (w: number, h: number): NestPoint[] => [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }];
const lShape = (w: number, h: number, t: number): NestPoint[] => [
  { x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: t }, { x: t, y: t }, { x: t, y: h }, { x: 0, y: h },
];
const disc = (cx: number, cy: number, r: number, n = 48, cw = false): NestPoint[] => {
  const pts = Array.from({ length: n }, (_, i) => ({ x: cx + r * Math.cos((2 * Math.PI * i) / n), y: cy + r * Math.sin((2 * Math.PI * i) / n) }));
  return cw ? pts.reverse() : pts;
};
const triangle = (w: number, h: number): NestPoint[] => [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w / 2, y: h }];

describe('raster nesting — guarantees', () => {
  it('never overlaps and keeps the requested web between irregular parts', () => {
    const parts: NestPartInput[] = [
      { id: 'L', outer: lShape(300, 200, 60), quantity: 6 },
      { id: 'T', outer: triangle(220, 180), quantity: 8 },
      { id: 'D', outer: disc(0, 0, 70), quantity: 6 },
      { id: 'R', outer: rect(260, 90), quantity: 5 },
    ];
    const spacing = 4, kerf = 1.5;
    const res = rasterNest(parts, { sheetWidth: 1500, sheetHeight: 1000, spacing, kerf, maxSheets: 3 });
    expect(res.unplaced).toHaveLength(0);
    expect(res.placements).toHaveLength(25);
    assertClean(res.placements, spacing + kerf, 1500, 1000);
  });

  it('places small parts inside the hole of a frame (part-in-part) and not when disabled', () => {
    const frame: NestPartInput = { id: 'F', outer: rect(800, 600), holes: [rect(600, 400).map((p) => ({ x: p.x + 100, y: p.y + 100 }))], quantity: 1 };
    const small: NestPartInput = { id: 'S', outer: rect(120, 120), quantity: 6 };
    const opts = { sheetWidth: 1200, sheetHeight: 700, spacing: 5, kerf: 1, maxSheets: 2 };

    const on = rasterNest([frame, small], opts);
    const f = on.placements.find((p) => p.partId === 'F')!;
    const insideHole = on.placements.filter((p) => p.partId === 'S' && inside(p.outer[0], f.holes[0]));
    expect(insideHole.length).toBeGreaterThanOrEqual(4);
    assertClean(on.placements, 6, 1200, 700);

    const off = rasterNest([frame, small], { ...opts, partInPart: false });
    const f2 = off.placements.find((p) => p.partId === 'F')!;
    expect(off.placements.filter((p) => p.partId === 'S' && inside(p.outer[0], f2.outer))).toHaveLength(0);
  });

  it('turns a long part to fit a narrow sheet and moves holes with the outline', () => {
    const plate: NestPartInput = { id: 'P', outer: rect(900, 120), holes: [disc(800, 60, 25, 32, true)], quantity: 1 };
    const res = rasterNest([plate], { sheetWidth: 400, sheetHeight: 1000, spacing: 3, kerf: 1 });
    expect(res.placements).toHaveLength(1);
    const p = res.placements[0];
    expect([90, 270]).toContain(p.rotation);
    // same rigid transform for outline and hole
    const t = (p.rotation * Math.PI) / 180;
    const map = (q: NestPoint) => ({ x: Math.cos(t) * q.x - Math.sin(t) * q.y + p.tx, y: Math.sin(t) * q.x + Math.cos(t) * q.y + p.ty });
    plate.outer.forEach((q, i) => {
      expect(p.outer[i].x).toBeCloseTo(map(q).x, 6);
      expect(p.outer[i].y).toBeCloseTo(map(q).y, 6);
    });
    plate.holes![0].forEach((q, i) => {
      expect(p.holes[0][i].x).toBeCloseTo(map(q).x, 6);
      expect(p.holes[0][i].y).toBeCloseTo(map(q).y, 6);
    });
    expect(p.area).toBeCloseTo(netArea(plate.outer, plate.holes), 6);
  });

  it('spills over to further sheets and reports parts that can never fit', () => {
    const res = rasterNest(
      [
        { id: 'big', outer: rect(450, 450), quantity: 5 },
        { id: 'huge', outer: rect(2000, 2000), quantity: 1 },
      ],
      { sheetWidth: 1000, sheetHeight: 1000, spacing: 5, kerf: 1, maxSheets: 5 },
    );
    expect(res.placements.filter((p) => p.partId === 'big')).toHaveLength(5);
    expect(new Set(res.placements.map((p) => p.sheetIndex))).toEqual(new Set([0, 1]));
    expect(res.sheets.map((s) => s.partCount)).toEqual([4, 1]);
    expect(res.unplaced).toEqual([{ partId: 'huge', instanceIndex: 0, reason: 'Part larger than the sheet' }]);
    for (const s of [0, 1]) assertClean(res.placements.filter((p) => p.sheetIndex === s), 6, 1000, 1000);
  });

  it('nests a realistic job quickly', () => {
    const parts: NestPartInput[] = [
      { id: 'flange', outer: disc(0, 0, 90), holes: [disc(0, 0, 40, 32, true)], quantity: 12 },
      { id: 'bracket', outer: lShape(240, 160, 50), quantity: 16 },
      { id: 'gusset', outer: triangle(180, 140), quantity: 20 },
      { id: 'strip', outer: rect(600, 60), quantity: 12 },
    ];
    const t0 = performance.now();
    const res = rasterNest(parts, { sheetWidth: 3000, sheetHeight: 1500, spacing: 5, kerf: 1.5, maxSheets: 4 });
    const ms = performance.now() - t0;
    expect(res.unplaced).toHaveLength(0);
    expect(res.placements).toHaveLength(60);
    expect(ms).toBeLessThan(15000);
    assertClean(res.placements, 6.5, 3000, 1500);
  });
});
