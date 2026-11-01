/**
 * Profile (region) detection for a sketch — which closed areas can be extruded.
 *
 * Planar-graph face traversal over lines + arcs (shared point ids = topology),
 * plus stand-alone circles. Produces:
 *   • `regions` – every bounded face (what you click in SolidWorks' "Selected Contours")
 *   • `auto`    – even-odd profile of all closed loops (outer boundary minus nested
 *                 loops), the default when nothing is picked: a rectangle with a
 *                 circle inside becomes a plate with a hole.
 * Pure geometry, units mm.
 */
import { type Sketch, type SkEntity, sampleEntity } from './sketch';

export interface Pt { x: number; y: number }

export interface ProfileRegion {
  key: string;
  outer: Pt[];
  holes: Pt[][];
  area: number;
}

export interface ProfileResult {
  regions: ProfileRegion[];
  auto: ProfileRegion[];
  /** open (dangling) edge count — shown as a warning */
  openEdges: number;
}

export function signedArea(poly: Pt[]): number {
  let a = 0;
  for (let i = 0, n = poly.length; i < n; i++) {
    const p = poly[i], q = poly[(i + 1) % n];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

export function pointInPolygon(q: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > q.y) !== (b.y > q.y) && q.x < ((b.x - a.x) * (q.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** A point guaranteed-ish inside a simple polygon (centroid, else nudged edge midpoint). */
export function interiorPoint(poly: Pt[]): Pt {
  let cx = 0, cy = 0, a = 0;
  for (let i = 0, n = poly.length; i < n; i++) {
    const p = poly[i], q = poly[(i + 1) % n];
    const f = p.x * q.y - q.x * p.y;
    a += f; cx += (p.x + q.x) * f; cy += (p.y + q.y) * f;
  }
  if (Math.abs(a) > 1e-12) {
    const c = { x: cx / (3 * a), y: cy / (3 * a) };
    if (pointInPolygon(c, poly)) return c;
  }
  const ccw = signedArea(poly) > 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
    const L = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const nx = (-(q.y - p.y) / L) * (ccw ? 1 : -1), ny = ((q.x - p.x) / L) * (ccw ? 1 : -1);
    for (const eps of [1e-3, 1e-2, 0.1]) {
      const t = { x: mx + nx * eps * L, y: my + ny * eps * L };
      if (pointInPolygon(t, poly)) return t;
    }
  }
  return poly[0];
}

const dedupe = (pts: Pt[]) => {
  const out: Pt[] = [];
  for (const p of pts) {
    const l = out[out.length - 1];
    if (!l || Math.hypot(l.x - p.x, l.y - p.y) > 1e-7) out.push(p);
  }
  if (out.length > 1) {
    const f = out[0], l = out[out.length - 1];
    if (Math.hypot(f.x - l.x, f.y - l.y) < 1e-7) out.pop();
  }
  return out;
};

interface HalfEdge { id: number; edge: string; from: string; to: string; pts: Pt[]; angle: number; twin: number }

interface RawSeg {
  id: string;
  p1: Pt;
  p2: Pt;
  entityId: string;
}

/** Check if two 2D points are within eps distance */
function ptDist(a: Pt, b: Pt): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Line segment intersection between AB and CD.
 * Returns intersection point and parameters (t on AB, u on CD) if segments intersect.
 */
function lineLineIntersection(a: Pt, b: Pt, c: Pt, d: Pt): { pt: Pt; t: number; u: number } | null {
  const dxAB = b.x - a.x;
  const dyAB = b.y - a.y;
  const dxCD = d.x - c.x;
  const dyCD = d.y - c.y;
  const denom = dxAB * dyCD - dyAB * dxCD;
  if (Math.abs(denom) < 1e-9) return null; // parallel or collinear

  const dxAC = c.x - a.x;
  const dyAC = c.y - a.y;
  const t = (dxAC * dyCD - dyAC * dxCD) / denom;
  const u = (dxAC * dyAB - dyAC * dxAB) / denom;

  if (t >= -1e-7 && t <= 1 + 1e-7 && u >= -1e-7 && u <= 1 + 1e-7) {
    return {
      pt: { x: a.x + t * dxAB, y: a.y + t * dyAB },
      t: Math.max(0, Math.min(1, t)),
      u: Math.max(0, Math.min(1, u)),
    };
  }
  return null;
}

/** Projection parameter t of point P onto segment AB, clamped to [0, 1] */
function projectPointOnSegment(p: Pt, a: Pt, b: Pt): { t: number; dist: number; proj: Pt } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-12) return { t: 0, dist: ptDist(p, a), proj: { ...a } };
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  const proj = { x: a.x + t * dx, y: a.y + t * dy };
  return { t, dist: ptDist(p, proj), proj };
}

export function detectProfiles(s: Sketch): ProfileResult {
  const solid = s.entities.filter((e) => !e.construction && !(e.type === 'line' && (e as any).centerline));
  const circles: Pt[][] = [];
  const circleKeys: string[] = [];
  const rawSegments: RawSeg[] = [];

  let segCounter = 0;
  for (const e of solid) {
    if (e.type === 'circle') {
      circles.push(dedupe(sampleEntity(s, e, 96)));
      circleKeys.push(`c:${e.id}`);
      continue;
    }
    const pts = sampleEntity(s, e as SkEntity, 32);
    if (pts.length < 2) continue;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      if (ptDist(p1, p2) > 1e-5) {
        rawSegments.push({
          id: `seg_${++segCounter}`,
          p1: { x: p1.x, y: p1.y },
          p2: { x: p2.x, y: p2.y },
          entityId: e.id,
        });
      }
    }
  }

  // Find all internal split points (t in (1e-4, 1 - 1e-4)) for each segment
  const splits = new Map<string, number[]>();
  const addSplit = (segId: string, t: number) => {
    if (t > 1e-4 && t < 1 - 1e-4) {
      if (!splits.has(segId)) splits.set(segId, []);
      splits.get(segId)!.push(t);
    }
  };

  const nSeg = rawSegments.length;
  for (let i = 0; i < nSeg; i++) {
    const s1 = rawSegments[i];
    for (let j = i + 1; j < nSeg; j++) {
      const s2 = rawSegments[j];
      const hit = lineLineIntersection(s1.p1, s1.p2, s2.p1, s2.p2);
      if (hit) {
        addSplit(s1.id, hit.t);
        addSplit(s2.id, hit.u);
      } else {
        // Check T-junctions: endpoints near other segment interior
        const pr1 = projectPointOnSegment(s2.p1, s1.p1, s1.p2);
        if (pr1.dist < 0.05 && pr1.t > 1e-4 && pr1.t < 1 - 1e-4) addSplit(s1.id, pr1.t);
        const pr2 = projectPointOnSegment(s2.p2, s1.p1, s1.p2);
        if (pr2.dist < 0.05 && pr2.t > 1e-4 && pr2.t < 1 - 1e-4) addSplit(s1.id, pr2.t);
        const pr3 = projectPointOnSegment(s1.p1, s2.p1, s2.p2);
        if (pr3.dist < 0.05 && pr3.t > 1e-4 && pr3.t < 1 - 1e-4) addSplit(s2.id, pr3.t);
        const pr4 = projectPointOnSegment(s1.p2, s2.p1, s2.p2);
        if (pr4.dist < 0.05 && pr4.t > 1e-4 && pr4.t < 1 - 1e-4) addSplit(s2.id, pr4.t);
      }
    }
  }

  // Subdivide segments at sorted split points
  interface AtomicEdge { id: string; aPt: Pt; bPt: Pt; aId: string; bId: string; pts: Pt[]; entityId: string }
  const atomicEdges: AtomicEdge[] = [];
  let atomicCounter = 0;

  for (const seg of rawSegments) {
    const tList = splits.get(seg.id);
    if (!tList || tList.length === 0) {
      atomicEdges.push({
        id: `ae_${++atomicCounter}`,
        aPt: seg.p1,
        bPt: seg.p2,
        aId: '',
        bId: '',
        pts: [seg.p1, seg.p2],
        entityId: seg.entityId,
      });
    } else {
      tList.sort((a, b) => a - b);
      const uniqueT: number[] = [];
      for (const t of tList) {
        if (!uniqueT.length || Math.abs(t - uniqueT[uniqueT.length - 1]) > 1e-4) uniqueT.push(t);
      }
      const allT = [0, ...uniqueT, 1];
      for (let k = 0; k < allT.length - 1; k++) {
        const tA = allT[k], tB = allT[k + 1];
        if (tB - tA < 1e-5) continue;
        const pA: Pt = { x: seg.p1.x + tA * (seg.p2.x - seg.p1.x), y: seg.p1.y + tA * (seg.p2.y - seg.p1.y) };
        const pB: Pt = { x: seg.p1.x + tB * (seg.p2.x - seg.p1.x), y: seg.p1.y + tB * (seg.p2.y - seg.p1.y) };
        atomicEdges.push({
          id: `ae_${++atomicCounter}`,
          aPt: pA,
          bPt: pB,
          aId: '',
          bId: '',
          pts: [pA, pB],
          entityId: seg.entityId,
        });
      }
    }
  }

  // Cluster endpoints into unique vertex IDs within tolerance (0.05 mm)
  const EPS_CLUSTER = 0.05;
  const nodes: Pt[] = [];
  const getNode = (pt: Pt): string => {
    for (let i = 0; i < nodes.length; i++) {
      if (ptDist(pt, nodes[i]) <= EPS_CLUSTER) return `n_${i}`;
    }
    const idx = nodes.length;
    nodes.push({ x: pt.x, y: pt.y });
    return `n_${idx}`;
  };

  for (const e of atomicEdges) {
    e.aId = getNode(e.aPt);
    e.bId = getNode(e.bPt);
    // snap edge endpoints to exact clustered node coordinates
    const na = nodes[parseInt(e.aId.slice(2), 10)];
    const nb = nodes[parseInt(e.bId.slice(2), 10)];
    e.pts[0] = { ...na };
    e.pts[e.pts.length - 1] = { ...nb };
  }

  // Remove degenerate zero-length edges (where aId === bId)
  const validEdges = atomicEdges.filter((e) => e.aId !== e.bId);

  // Prune dangling edges (degree 1) iteratively
  let openEdges = 0;
  let alive = validEdges.slice();
  for (;;) {
    const deg = new Map<string, number>();
    for (const e of alive) {
      deg.set(e.aId, (deg.get(e.aId) || 0) + 1);
      deg.set(e.bId, (deg.get(e.bId) || 0) + 1);
    }
    const next = alive.filter((e) => (deg.get(e.aId) || 0) > 1 && (deg.get(e.bId) || 0) > 1);
    if (next.length === alive.length) break;
    openEdges += alive.length - next.length;
    alive = next;
  }

  // Build directed half-edges from surviving edges
  const hes: HalfEdge[] = [];
  for (const e of alive) {
    const fwd = e.pts, rev = e.pts.slice().reverse();
    const ang = (pts: Pt[]) => Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
    const i = hes.length;
    hes.push({ id: i, edge: e.entityId, from: e.aId, to: e.bId, pts: fwd, angle: ang(fwd), twin: i + 1 });
    hes.push({ id: i + 1, edge: e.entityId, from: e.bId, to: e.aId, pts: rev, angle: ang(rev), twin: i });
  }

  const out = new Map<string, HalfEdge[]>();
  for (const h of hes) {
    if (!out.has(h.from)) out.set(h.from, []);
    out.get(h.from)!.push(h);
  }
  for (const list of out.values()) list.sort((a, b) => a.angle - b.angle);

  const nextOf = (h: HalfEdge): HalfEdge => {
    const list = out.get(h.to)!;
    const twin = hes[h.twin];
    const i = list.indexOf(twin);
    return list[(i - 1 + list.length) % list.length];
  };

  const visited = new Set<number>();
  const faces: { poly: Pt[]; edges: string[]; area: number }[] = [];
  for (const h0 of hes) {
    if (visited.has(h0.id)) continue;
    const poly: Pt[] = [];
    const eids: string[] = [];
    let h = h0;
    let guard = 0;
    while (!visited.has(h.id) && guard++ < 100000) {
      visited.add(h.id);
      poly.push(...h.pts.slice(0, -1));
      eids.push(h.edge);
      h = nextOf(h);
    }
    const p = dedupe(poly);
    if (p.length >= 3) faces.push({ poly: p, edges: eids, area: signedArea(p) });
  }

  const bounded = faces.filter((f) => f.area > 1e-6);
  // component outer boundaries are the clockwise faces; reverse to ccw
  const boundaries = faces.filter((f) => f.area < -1e-6).map((f, idx) => ({
    poly: f.poly.slice().reverse(),
    key: `b:${[...new Set(f.edges)].sort().join(',')}:${Math.round(Math.abs(f.area) * 10)}_${idx}`,
  }));

  const ccw = (p: Pt[]) => (signedArea(p) < 0 ? p.slice().reverse() : p);
  const loops: { poly: Pt[]; key: string; area: number }[] = [
    ...boundaries.map((b) => ({ poly: b.poly, key: b.key, area: Math.abs(signedArea(b.poly)) })),
    ...circles.map((c, i) => ({ poly: ccw(c), key: circleKeys[i], area: Math.abs(signedArea(c)) })),
  ];

  // containment among closed loops (outer boundaries + circles)
  const contains = (outerPoly: Pt[], innerPoly: Pt[]) => pointInPolygon(interiorPoint(innerPoly), outerPoly) && pointInPolygon(innerPoly[0], outerPoly);
  const parent: number[] = loops.map((L, i) => {
    let best = -1;
    loops.forEach((M, j) => {
      if (i === j || M.area <= L.area) return;
      if (contains(M.poly, L.poly) && (best < 0 || M.area < loops[best].area)) best = j;
    });
    return best;
  });
  const depth = (i: number): number => (parent[i] < 0 ? 0 : 1 + depth(parent[i]));

  const auto: ProfileRegion[] = [];
  loops.forEach((L, i) => {
    if (depth(i) % 2 !== 0) return;
    const holes = loops.filter((_, j) => parent[j] === i).map((h) => h.poly.slice().reverse());
    const area = L.area - holes.reduce((a, h) => a + Math.abs(signedArea(h)), 0);
    auto.push({ key: L.key, outer: L.poly, holes, area });
  });

  // selectable regions: each bounded face, minus the closed loops directly inside it
  const regionLoops = [
    ...bounded.map((f, idx) => {
      const c = interiorPoint(f.poly);
      return {
        poly: f.poly,
        key: `f:${[...new Set(f.edges)].sort().join(',')}:${Math.round(f.area * 10)}_${Math.round(c.x)}_${Math.round(c.y)}_${idx}`,
        area: f.area,
      };
    }),
    ...circles.map((c, i) => ({ poly: ccw(c), key: circleKeys[i], area: Math.abs(signedArea(c)) })),
  ];
  const regions: ProfileRegion[] = regionLoops.map((R) => {
    const inner = loops.filter((L) => L.key !== R.key && L.area < R.area && contains(R.poly, L.poly) && !sameLoop(L.poly, R.poly));
    // keep only the outermost ones
    const direct = inner.filter((L) => !inner.some((M) => M !== L && M.area > L.area && contains(M.poly, L.poly)));
    const holes = direct.map((h) => h.poly.slice().reverse());
    return { key: R.key, outer: R.poly, holes, area: R.area - holes.reduce((a, h) => a + Math.abs(signedArea(h)), 0) };
  });

  // If auto found nothing but bounded faces exist, expose bounded faces in auto
  if (auto.length === 0 && regions.length > 0) {
    auto.push(...regions);
  }

  return { regions, auto, openEdges };
}

function sameLoop(a: Pt[], b: Pt[]) {
  return a.length === b.length && Math.abs(signedArea(a) - signedArea(b)) < 1e-6;
}

/** Smallest selectable region containing q (sketch mm), honouring holes. */
export function regionAt(res: ProfileResult, q: Pt): ProfileRegion | null {
  let best: ProfileRegion | null = null;
  for (const r of res.regions) {
    if (!pointInPolygon(q, r.outer)) continue;
    if (r.holes.some((h) => pointInPolygon(q, h))) continue;
    if (!best || r.area < best.area) best = r;
  }
  return best;
}
