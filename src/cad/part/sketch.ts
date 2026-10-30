/**
 * Parametric 2D sketch — data model + geometric constraint relaxation solver.
 *
 * Topology follows Inventor / SolidWorks: entities reference shared point ids, so
 * a rectangle's corners are coincident by construction and dragging one corner
 * drags both edges that meet there. Dimensions and H/V relations are explicit
 * constraints, re-satisfied after every edit by `solveSketch`.
 *
 * Units: millimetres in sketch (u, v) coordinates. Pure — no DOM / React / three.
 */

export interface SkPoint {
  id: string;
  x: number;
  y: number;
  /** fixed points (sketch origin) are never moved by the solver */
  fixed?: boolean;
  /** if this point belongs to an un-deformable dynamic block */
  blockInstanceId?: string;
}

export type SkEntity =
  | { id: string; type: 'point'; p: string; construction?: boolean; blockInstanceId?: string; blockId?: string }
  | { id: string; type: 'line'; p1: string; p2: string; construction?: boolean; centerline?: boolean; blockInstanceId?: string; blockId?: string }
  | { id: string; type: 'circle'; c: string; r: number; construction?: boolean; blockInstanceId?: string; blockId?: string }
  /** counter-clockwise from p1 to p2 around centre c */
  | { id: string; type: 'arc'; c: string; p1: string; p2: string; construction?: boolean; blockInstanceId?: string; blockId?: string };

export type SkConstraint =
  | { id: string; type: 'horizontal' | 'vertical'; line: string }
  | { id: string; type: 'length'; line: string; value: number }
  | { id: string; type: 'diameter' | 'radius'; entity: string; value: number }
  /** signed horizontal / vertical distance from point a to point b (b − a) */
  | { id: string; type: 'dx' | 'dy'; a: string; b: string; value: number }
  | { id: string; type: 'equal'; a: string; b: string }
  | { id: string; type: 'perpendicular' | 'parallel'; a: string; b: string }
  /** Diametric dimension: full diameter (2x perpendicular distance) from a centerline to a point */
  | { id: string; type: 'diameter_dim'; centerline: string; point: string; value: number };

export interface Sketch {
  id: string;
  name: string;
  points: Record<string, SkPoint>;
  entities: SkEntity[];
  constraints: SkConstraint[];
  blockInstances?: Record<string, { id: string; blockId: string; name: string }>;
}

export const ORIGIN_ID = 'O';

let _seq = 0;
export const skId = (p: string) => `${p}${Date.now().toString(36)}${(++_seq).toString(36)}`;

export function emptySketch(id: string, name: string): Sketch {
  return { id, name, points: { [ORIGIN_ID]: { id: ORIGIN_ID, x: 0, y: 0, fixed: true } }, entities: [], constraints: [] };
}

export const cloneSketch = (s: Sketch): Sketch => JSON.parse(JSON.stringify(s));

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(b.x - a.x, b.y - a.y);

/** Remove points no entity references (except the origin). */
export function pruneOrphanPoints(s: Sketch): Sketch {
  const used = new Set<string>([ORIGIN_ID]);
  for (const e of s.entities) {
    if (e.type === 'point') used.add(e.p);
    else if (e.type === 'line') { used.add(e.p1); used.add(e.p2); }
    else if (e.type === 'circle') used.add(e.c);
    else { used.add(e.c); used.add(e.p1); used.add(e.p2); }
  }
  const points: Record<string, SkPoint> = {};
  for (const id of Object.keys(s.points)) if (used.has(id)) points[id] = s.points[id];
  const entIds = new Set(s.entities.map((e) => e.id));
  const ptOk = (id: string) => !!points[id];
  const constraints = s.constraints.filter((c) => {
    switch (c.type) {
      case 'horizontal': case 'vertical': case 'length': return entIds.has(c.line);
      case 'diameter': case 'radius': return entIds.has(c.entity);
      case 'dx': case 'dy': return ptOk(c.a) && ptOk(c.b);
      case 'diameter_dim': return entIds.has(c.centerline) && ptOk(c.point);
      default: return entIds.has(c.a) && entIds.has(c.b);
    }
  });
  return { ...s, points, constraints };
}

/** Delete entities (and dangling points / constraints). */
export function deleteEntities(s: Sketch, ids: string[]): Sketch {
  const del = new Set(ids);
  return pruneOrphanPoints({ ...s, entities: s.entities.filter((e) => !del.has(e.id)) });
}

/** Entities that reference point `pid`. */
export const entitiesAtPoint = (s: Sketch, pid: string) =>
  s.entities.filter((e) => (
    e.type === 'line' ? e.p1 === pid || e.p2 === pid :
    e.type === 'circle' ? e.c === pid :
    e.type === 'point' ? e.p === pid :
    e.c === pid || e.p1 === pid || e.p2 === pid
  ));

/** Merge point `from` into `into` (coincident). */
export function mergePoints(s: Sketch, from: string, into: string): Sketch {
  if (from === into || !s.points[from] || !s.points[into]) return s;
  const rp = (id: string) => (id === from ? into : id);
  const entities = s.entities
    .map((e): SkEntity => (
      e.type === 'line' ? { ...e, p1: rp(e.p1), p2: rp(e.p2) } :
      e.type === 'circle' ? { ...e, c: rp(e.c) } :
      e.type === 'point' ? { ...e, p: rp(e.p) } :
      { ...e, c: rp(e.c), p1: rp(e.p1), p2: rp(e.p2) }
    ))
    .filter((e) => !(e.type === 'line' && e.p1 === e.p2));
  const constraints = s.constraints.map((c) => (
    c.type === 'dx' || c.type === 'dy' ? { ...c, a: rp(c.a), b: rp(c.b) } :
    c.type === 'diameter_dim' ? { ...c, point: rp(c.point) } :
    c
  ));
  const points = { ...s.points };
  delete points[from];
  return pruneOrphanPoints({ ...s, entities, constraints, points });
}

// ─────────────────────────── solver ───────────────────────────

export interface SolveOptions {
  /** points held in place this solve (e.g. the one being dragged) */
  locked?: Set<string>;
  iterations?: number;
}

export interface SolveResult {
  sketch: Sketch;
  /** max residual in mm after solving */
  residual: number;
  converged: boolean;
}

function lineOf(s: Sketch, id: string) {
  const e = s.entities.find((x) => x.id === id);
  return e && e.type === 'line' ? e : null;
}

/**
 * Relaxation solver: repeatedly projects each constraint onto its manifold,
 * moving only free points (inverse-mass weighting). Fast and robust for the
 * well-posed sketches typical in part modelling; over-constrained sketches end
 * with residual > 0 and are reported as not converged.
 */
export function solveSketch(input: Sketch, opts: SolveOptions = {}): SolveResult {
  const s = cloneSketch(input);
  const P = s.points;
  const locked = opts.locked ?? new Set<string>();
  const w = (id: string) => (P[id]?.fixed || locked.has(id) ? 0 : 1);
  const iters = opts.iterations ?? 200;

  // Group all points belonging to the same dynamic block so dimensions move the entire block rigidly
  const blockPointsMap = new Map<string, string[]>();
  for (const [pid, pt] of Object.entries(P)) {
    if (pt.blockInstanceId) {
      const arr = blockPointsMap.get(pt.blockInstanceId) || [];
      arr.push(pid);
      blockPointsMap.set(pt.blockInstanceId, arr);
    }
  }

  const translatePoint = (pid: string, dx: number, dy: number) => {
    const pt = P[pid];
    if (!pt || pt.fixed || locked.has(pid)) return;
    if (pt.blockInstanceId) {
      const allPts = blockPointsMap.get(pt.blockInstanceId) || [pid];
      for (const id of allPts) {
        if (!locked.has(id)) {
          P[id].x += dx;
          P[id].y += dy;
        }
      }
    } else {
      pt.x += dx;
      pt.y += dy;
    }
  };

  const moveSplit = (a: string, b: string, dax: number, day: number) => {
    // If both a and b belong to the exact same block, internal distances are rigid
    if (P[a]?.blockInstanceId && P[a].blockInstanceId === P[b]?.blockInstanceId) return;
    const wa = w(a), wb = w(b);
    const tot = wa + wb;
    if (tot === 0) return;
    translatePoint(a, (-dax * wa) / tot, (-day * wa) / tot);
    translatePoint(b, (dax * wb) / tot, (day * wb) / tot);
  };

  const setLength = (a: string, b: string, L: number) => {
    const pa = P[a], pb = P[b];
    let dx = pb.x - pa.x, dy = pb.y - pa.y;
    let cur = Math.hypot(dx, dy);
    if (cur < 1e-9) { dx = 1; dy = 0; cur = 1e-9; }
    const k = (L - cur) / cur;
    moveSplit(a, b, dx * k, dy * k);
  };

  const radiusOf = (e: SkEntity): number => (e.type === 'circle' ? e.r : e.type === 'arc' ? dist(P[e.c], P[e.p1]) : 0);

  const residuals = (): number => {
    let r = 0;
    for (const c of s.constraints) {
      if (c.type === 'horizontal' || c.type === 'vertical') {
        const l = lineOf(s, c.line); if (!l) continue;
        r = Math.max(r, Math.abs(c.type === 'horizontal' ? P[l.p2].y - P[l.p1].y : P[l.p2].x - P[l.p1].x));
      } else if (c.type === 'length') {
        const l = lineOf(s, c.line); if (!l) continue;
        r = Math.max(r, Math.abs(dist(P[l.p1], P[l.p2]) - c.value));
      } else if (c.type === 'dx' || c.type === 'dy') {
        if (!P[c.a] || !P[c.b]) continue;
        r = Math.max(r, Math.abs((c.type === 'dx' ? P[c.b].x - P[c.a].x : P[c.b].y - P[c.a].y) - c.value));
      } else if (c.type === 'diameter' || c.type === 'radius') {
        const e = s.entities.find((x) => x.id === c.entity); if (!e || e.type === 'line') continue;
        const want = c.type === 'diameter' ? c.value / 2 : c.value;
        r = Math.max(r, Math.abs(radiusOf(e) - want));
      } else if (c.type === 'diameter_dim') {
        const l = lineOf(s, c.centerline);
        const pt = P[c.point];
        if (!l || !pt) continue;
        const p1 = P[l.p1], p2 = P[l.p2];
        const L = dist(p1, p2);
        if (L < 1e-9) continue;
        const perpDist = Math.abs((p2.x - p1.x) * (p1.y - pt.y) - (p1.x - pt.x) * (p2.y - p1.y)) / L;
        r = Math.max(r, Math.abs(perpDist - c.value / 2));
      }
    }
    for (const e of s.entities) if (e.type === 'arc') r = Math.max(r, Math.abs(dist(P[e.c], P[e.p1]) - dist(P[e.c], P[e.p2])));
    return r;
  };

  for (let it = 0; it < iters; it++) {
    for (const c of s.constraints) {
      switch (c.type) {
        case 'horizontal':
        case 'vertical': {
          const l = lineOf(s, c.line); if (!l) break;
          if (c.type === 'horizontal') moveSplit(l.p1, l.p2, 0, -(P[l.p2].y - P[l.p1].y));
          else moveSplit(l.p1, l.p2, -(P[l.p2].x - P[l.p1].x), 0);
          break;
        }
        case 'length': {
          const l = lineOf(s, c.line); if (!l) break;
          setLength(l.p1, l.p2, Math.max(1e-6, c.value));
          break;
        }
        case 'dx':
        case 'dy': {
          if (!P[c.a] || !P[c.b]) break;
          const cur = c.type === 'dx' ? P[c.b].x - P[c.a].x : P[c.b].y - P[c.a].y;
          const d = c.value - cur;
          if (c.type === 'dx') moveSplit(c.a, c.b, d, 0); else moveSplit(c.a, c.b, 0, d);
          break;
        }
        case 'diameter':
        case 'radius': {
          const e = s.entities.find((x) => x.id === c.entity); if (!e) break;
          const want = Math.max(1e-6, c.type === 'diameter' ? c.value / 2 : c.value);
          if (e.type === 'circle') e.r = want;
          else if (e.type === 'arc') { setLength(e.c, e.p1, want); setLength(e.c, e.p2, want); }
          break;
        }
        case 'diameter_dim': {
          const l = lineOf(s, c.centerline);
          const pt = P[c.point];
          if (!l || !pt) break;
          const p1 = P[l.p1], p2 = P[l.p2];
          const L = dist(p1, p2);
          if (L < 1e-9) break;

          const dx = (p2.x - p1.x) / L;
          const dy = (p2.y - p1.y) / L;
          const nx = -dy;
          const ny = dx;

          const signedDist = (pt.x - p1.x) * nx + (pt.y - p1.y) * ny;
          const curDist = Math.abs(signedDist);
          const want = Math.max(1e-6, c.value / 2);
          const sign = signedDist >= 0 ? 1 : -1;
          const delta = (want - curDist) * sign;

          if (w(c.point)) {
            pt.x += nx * delta;
            pt.y += ny * delta;
          }
          break;
        }
        case 'equal': {
          const a = s.entities.find((x) => x.id === c.a), b = s.entities.find((x) => x.id === c.b);
          if (!a || !b) break;
          if (a.type === 'line' && b.type === 'line') {
            const la = dist(P[a.p1], P[a.p2]), lb = dist(P[b.p1], P[b.p2]);
            const m = (la + lb) / 2; setLength(a.p1, a.p2, m); setLength(b.p1, b.p2, m);
          } else if (a.type !== 'line' && b.type !== 'line') {
            const m = (radiusOf(a) + radiusOf(b)) / 2;
            for (const e of [a, b]) if (e.type === 'circle') e.r = m; else if (e.type === 'arc') { setLength(e.c, e.p1, m); setLength(e.c, e.p2, m); }
          }
          break;
        }
        case 'perpendicular':
        case 'parallel': {
          const a = lineOf(s, c.a), b = lineOf(s, c.b); if (!a || !b) break;
          const angA = Math.atan2(P[a.p2].y - P[a.p1].y, P[a.p2].x - P[a.p1].x);
          const vb = { x: P[b.p2].x - P[b.p1].x, y: P[b.p2].y - P[b.p1].y };
          const Lb = Math.hypot(vb.x, vb.y);
          let target = c.type === 'parallel' ? angA : angA + Math.PI / 2;
          const angB = Math.atan2(vb.y, vb.x);
          // choose the nearer of target / target+π so the line doesn't flip
          let dAng = Math.atan2(Math.sin(target - angB), Math.cos(target - angB));
          if (Math.abs(dAng) > Math.PI / 2) { target += Math.PI; dAng = Math.atan2(Math.sin(target - angB), Math.cos(target - angB)); }
          const ang = angB + dAng;
          const mid = { x: (P[b.p1].x + P[b.p2].x) / 2, y: (P[b.p1].y + P[b.p2].y) / 2 };
          const nx = Math.cos(ang) * (Lb / 2), ny = Math.sin(ang) * (Lb / 2);
          const want1 = { x: mid.x - nx, y: mid.y - ny }, want2 = { x: mid.x + nx, y: mid.y + ny };
          if (w(b.p1)) { P[b.p1].x = want1.x; P[b.p1].y = want1.y; }
          if (w(b.p2)) { P[b.p2].x = want2.x; P[b.p2].y = want2.y; }
          break;
        }
      }
    }
    // implicit: arc end points share the radius
    for (const e of s.entities) {
      if (e.type !== 'arc') continue;
      const r = (dist(P[e.c], P[e.p1]) + dist(P[e.c], P[e.p2])) / 2;
      setLength(e.c, e.p1, r); setLength(e.c, e.p2, r);
    }
    if (it % 10 === 9 && residuals() < 1e-6) break;
  }
  const residual = residuals();
  return { sketch: s, residual, converged: residual < 1e-3 };
}

// ─────────────────────── degrees of freedom (status) ───────────────────────

/** Rough DOF count (Inventor's "n dimensions needed"): 2 per free point + 1 per circle − constraints. */
export function remainingDof(s: Sketch): number {
  let dof = 0;
  for (const p of Object.values(s.points)) if (!p.fixed) dof += 2;
  for (const e of s.entities) { if (e.type === 'circle') dof += 1; if (e.type === 'arc') dof -= 1; }
  for (const c of s.constraints) dof -= c.type === 'equal' ? 1 : 1;
  return Math.max(0, dof);
}

// ─────────────────────────── helpers ───────────────────────────

export interface AddResult { sketch: Sketch; ids: string[] }

/** Add a point (or reuse an existing one within `snapTol` mm). */
export function addPoint(s: Sketch, x: number, y: number, snapTol = 0): { sketch: Sketch; id: string } {
  if (snapTol > 0) {
    for (const p of Object.values(s.points)) if (Math.hypot(p.x - x, p.y - y) <= snapTol) return { sketch: s, id: p.id };
  }
  const id = skId('p');
  return { sketch: { ...s, points: { ...s.points, [id]: { id, x, y } } }, id };
}

export function addLine(s: Sketch, p1: string, p2: string, construction = false, centerline = false): AddResult {
  if (p1 === p2) return { sketch: s, ids: [] };
  const id = skId('L');
  const sketch = { ...s, entities: [...s.entities, { id, type: 'line' as const, p1, p2, construction: construction || centerline, centerline }] };
  return { sketch, ids: [id] };
}

/** Axis-aligned rectangle from two opposite corners: 4 lines sharing corner points + H/V relations. */
export function addRectangle(s: Sketch, a: { x: number; y: number }, b: { x: number; y: number }, construction = false): AddResult {
  let sk = s;
  const corners = [a, { x: b.x, y: a.y }, b, { x: a.x, y: b.y }];
  const pid: string[] = [];
  for (const c of corners) { const r = addPoint(sk, c.x, c.y, 1e-6); sk = r.sketch; pid.push(r.id); }
  const ids: string[] = [];
  for (let i = 0; i < 4; i++) { const r = addLine(sk, pid[i], pid[(i + 1) % 4], construction); sk = r.sketch; ids.push(...r.ids); }
  sk = {
    ...sk,
    constraints: [
      ...sk.constraints,
      { id: skId('H'), type: 'horizontal', line: ids[0] },
      { id: skId('V'), type: 'vertical', line: ids[1] },
      { id: skId('H'), type: 'horizontal', line: ids[2] },
      { id: skId('V'), type: 'vertical', line: ids[3] },
    ],
  };
  return { sketch: sk, ids };
}

export function addCircle(s: Sketch, c: { x: number; y: number }, r: number, construction = false, centerId?: string): AddResult {
  let sk = s;
  let cid = centerId;
  if (!cid) { const p = addPoint(sk, c.x, c.y); sk = p.sketch; cid = p.id; }
  const id = skId('C');
  return { sketch: { ...sk, entities: [...sk.entities, { id, type: 'circle', c: cid, r: Math.max(0.01, r), construction }] }, ids: [id] };
}

/** Arc through 3 points (start, end, a point on the arc). Returns null when collinear. */
export function arcFrom3Points(a: { x: number; y: number }, b: { x: number; y: number }, m: { x: number; y: number }) {
  const d = 2 * (a.x * (b.y - m.y) + b.x * (m.y - a.y) + m.x * (a.y - b.y));
  if (Math.abs(d) < 1e-9) return null;
  const a2 = a.x * a.x + a.y * a.y, b2 = b.x * b.x + b.y * b.y, m2 = m.x * m.x + m.y * m.y;
  const cx = (a2 * (b.y - m.y) + b2 * (m.y - a.y) + m2 * (a.y - b.y)) / d;
  const cy = (a2 * (m.x - b.x) + b2 * (a.x - m.x) + m2 * (b.x - a.x)) / d;
  // orientation: ccw from a to b passing m?
  const ang = (p: { x: number; y: number }) => Math.atan2(p.y - cy, p.x - cx);
  const norm = (t: number) => ((t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const ccw = norm(ang(m) - ang(a)) < norm(ang(b) - ang(a));
  return { cx, cy, ccw };
}

export function arcSweep(s: Sketch, e: Extract<SkEntity, { type: 'arc' }>) {
  const P = s.points;
  const c = P[e.c], p1 = P[e.p1], p2 = P[e.p2];
  const a1 = Math.atan2(p1.y - c.y, p1.x - c.x);
  let a2 = Math.atan2(p2.y - c.y, p2.x - c.x);
  while (a2 <= a1 + 1e-9) a2 += 2 * Math.PI;
  return { a1, a2, r: dist(c, p1) };
}

/** Sample an entity as a polyline (sketch mm). */
export function sampleEntity(s: Sketch, e: SkEntity, segPerTurn = 96): { x: number; y: number }[] {
  const P = s.points;
  if (e.type === 'point') return [{ ...P[e.p] }];
  if (e.type === 'line') return [{ ...P[e.p1] }, { ...P[e.p2] }];
  if (e.type === 'circle') {
    const c = P[e.c];
    const n = segPerTurn;
    return Array.from({ length: n + 1 }, (_, i) => ({ x: c.x + e.r * Math.cos((2 * Math.PI * i) / n), y: c.y + e.r * Math.sin((2 * Math.PI * i) / n) }));
  }
  const { a1, a2, r } = arcSweep(s, e);
  const c = P[e.c];
  const n = Math.max(4, Math.ceil(((a2 - a1) / (2 * Math.PI)) * segPerTurn));
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = a1 + ((a2 - a1) * i) / n;
    return { x: c.x + r * Math.cos(t), y: c.y + r * Math.sin(t) };
  });
}

/** Distance from point to entity (for picking). */
export function distanceToEntity(s: Sketch, e: SkEntity, q: { x: number; y: number }): number {
  const P = s.points;
  if (e.type === 'point') return dist(P[e.p], q);
  if (e.type === 'circle') return Math.abs(dist(P[e.c], q) - e.r);
  const pts = sampleEntity(s, e, 64);
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const vx = b.x - a.x, vy = b.y - a.y;
    const L2 = vx * vx + vy * vy || 1e-12;
    const t = Math.max(0, Math.min(1, ((q.x - a.x) * vx + (q.y - a.y) * vy) / L2));
    best = Math.min(best, Math.hypot(a.x + vx * t - q.x, a.y + vy * t - q.y));
  }
  return best;
}

export function addPointEntity(s: Sketch, x: number, y: number, construction = false): { sketch: Sketch; id: string } {
  const r = addPoint(s, x, y);
  const id = skId('ptEnt');
  const e: SkEntity = { id, type: 'point', p: r.id, construction };
  return { sketch: { ...r.sketch, entities: [...r.sketch.entities, e] }, id };
}

// ───────────────────────────── 2D Sketch Pattern / Array ─────────────────────────────

/**
 * 2D Linear Array / Pattern on selected sketch entities
 */
export function applyLinearPatternToSketch(
  s: Sketch,
  entityIds: string[],
  countX: number,
  stepX: number,
  countY = 1,
  stepY = 0,
  angleDeg = 0
): Sketch {
  if (entityIds.length === 0 || (countX <= 1 && countY <= 1)) return s;
  const targetEnts = s.entities.filter((e) => entityIds.includes(e.id));
  if (targetEnts.length === 0) return s;

  // Gather referenced point ids
  const usedPids = new Set<string>();
  for (const e of targetEnts) {
    if (e.type === 'point') usedPids.add(e.p);
    else if (e.type === 'line') { usedPids.add(e.p1); usedPids.add(e.p2); }
    else if (e.type === 'circle') usedPids.add(e.c);
    else if (e.type === 'arc') { usedPids.add(e.c); usedPids.add(e.p1); usedPids.add(e.p2); }
  }

  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);

  const newPoints: Record<string, SkPoint> = { ...s.points };
  const newEntities: SkEntity[] = [...s.entities];

  const nX = Math.max(1, countX);
  const nY = Math.max(1, countY);

  for (let ix = 0; ix < nX; ix++) {
    for (let iy = 0; iy < nY; iy++) {
      if (ix === 0 && iy === 0) continue; // original already in sketch
      const rawX = ix * stepX;
      const rawY = iy * stepY;
      const dx = rawX * cos - rawY * sin;
      const dy = rawX * sin + rawY * cos;

      // Map old point id -> cloned point id
      const ptMap = new Map<string, string>();
      for (const pid of usedPids) {
        const oldPt = s.points[pid];
        if (!oldPt) continue;
        const newId = skId('p');
        newPoints[newId] = {
          id: newId,
          x: oldPt.x + dx,
          y: oldPt.y + dy,
        };
        ptMap.set(pid, newId);
      }

      // Clone entities using mapped points
      for (const e of targetEnts) {
        const entId = skId(e.type);
        if (e.type === 'point') {
          newEntities.push({ id: entId, type: 'point', p: ptMap.get(e.p)!, construction: e.construction });
        } else if (e.type === 'line') {
          newEntities.push({ id: entId, type: 'line', p1: ptMap.get(e.p1)!, p2: ptMap.get(e.p2)!, construction: e.construction });
        } else if (e.type === 'circle') {
          newEntities.push({ id: entId, type: 'circle', c: ptMap.get(e.c)!, r: e.r, construction: e.construction });
        } else if (e.type === 'arc') {
          newEntities.push({ id: entId, type: 'arc', c: ptMap.get(e.c)!, p1: ptMap.get(e.p1)!, p2: ptMap.get(e.p2)!, construction: e.construction });
        }
      }
    }
  }

  return { ...s, points: newPoints, entities: newEntities };
}

// ─────────────────────────── Trim, Fillet & Chamfer ───────────────────────────

/**
 * Trim an entity (e.g. line) between intersections with other sketch entities.
 * If no internal intersections exist, deletes the entity.
 */
export function trimEntity(
  s: Sketch,
  entityId: string,
  clickPt: { x: number; y: number }
): { sketch: Sketch; success: boolean } {
  const target = s.entities.find((e) => e.id === entityId);
  if (!target) return { sketch: s, success: false };

  if (target.type !== 'line') {
    return { sketch: deleteEntities(s, [entityId]), success: true };
  }

  const pA = s.points[target.p1];
  const pB = s.points[target.p2];
  if (!pA || !pB) return { sketch: s, success: false };

  const dx = pB.x - pA.x;
  const dy = pB.y - pA.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-8) {
    return { sketch: deleteEntities(s, [entityId]), success: true };
  }

  interface CutPoint {
    t: number;
    pt: { x: number; y: number };
  }
  const cuts: CutPoint[] = [];

  for (const other of s.entities) {
    if (other.id === target.id) continue;

    if (other.type === 'line') {
      const oA = s.points[other.p1];
      const oB = s.points[other.p2];
      if (!oA || !oB) continue;

      const odx = oB.x - oA.x;
      const ody = oB.y - oA.y;
      const denom = dx * ody - dy * odx;
      if (Math.abs(denom) < 1e-8) continue; // Parallel or collinear

      const wx = oA.x - pA.x;
      const wy = oA.y - pA.y;
      const t = (wx * ody - wy * odx) / denom;
      const u = (wx * dy - wy * dx) / denom;

      if (t > 1e-4 && t < 1 - 1e-4 && u >= -1e-4 && u <= 1 + 1e-4) {
        cuts.push({
          t,
          pt: { x: pA.x + t * dx, y: pA.y + t * dy },
        });
      }
    } else if (other.type === 'circle' || other.type === 'arc') {
      const c = s.points[other.c];
      if (!c) continue;
      const r = other.type === 'circle' ? other.r : dist(c, s.points[other.p1]);

      const fx = pA.x - c.x;
      const fy = pA.y - c.y;
      const a = lenSq;
      const b = 2 * (fx * dx + fy * dy);
      const cq = fx * fx + fy * fy - r * r;
      const disc = b * b - 4 * a * cq;
      if (disc >= 0) {
        const sq = Math.sqrt(disc);
        for (const t of [(-b - sq) / (2 * a), (-b + sq) / (2 * a)]) {
          if (t > 1e-4 && t < 1 - 1e-4) {
            const ix = pA.x + t * dx;
            const iy = pA.y + t * dy;
            if (other.type === 'arc') {
              const { a1, a2 } = arcSweep(s, other);
              let ang = Math.atan2(iy - c.y, ix - c.x);
              while (ang < a1) ang += 2 * Math.PI;
              if (ang > a2) continue;
            }
            cuts.push({ t, pt: { x: ix, y: iy } });
          }
        }
      }
    }
  }

  // If no internal cuts, delete the whole line (standard CAD trim)
  if (cuts.length === 0) {
    return { sketch: deleteEntities(s, [entityId]), success: true };
  }

  cuts.sort((a, b) => a.t - b.t);
  const uniqueCuts: CutPoint[] = [];
  for (const c of cuts) {
    if (uniqueCuts.length === 0 || c.t - uniqueCuts[uniqueCuts.length - 1].t > 1e-4) {
      uniqueCuts.push(c);
    }
  }

  const intervals: Array<{ t0: number; t1: number; pt0: { x: number; y: number }; pt1: { x: number; y: number } }> = [];
  let curT = 0;
  let curPt = { x: pA.x, y: pA.y };

  for (const c of uniqueCuts) {
    intervals.push({ t0: curT, t1: c.t, pt0: curPt, pt1: c.pt });
    curT = c.t;
    curPt = c.pt;
  }
  intervals.push({ t0: curT, t1: 1, pt0: curPt, pt1: { x: pB.x, y: pB.y } });

  const tClick = Math.max(0, Math.min(1, ((clickPt.x - pA.x) * dx + (clickPt.y - pA.y) * dy) / lenSq));
  let trimIdx = 0;
  for (let i = 0; i < intervals.length; i++) {
    if (tClick >= intervals[i].t0 && tClick <= intervals[i].t1) {
      trimIdx = i;
      break;
    }
  }

  const keepIntervals = intervals.filter((_, i) => i !== trimIdx);
  if (keepIntervals.length === 0) {
    return { sketch: deleteEntities(s, [entityId]), success: true };
  }

  const nextPoints = { ...s.points };
  const getOrCreatePoint = (pt: { x: number; y: number }, preferredId?: string): string => {
    if (preferredId && nextPoints[preferredId]) return preferredId;
    for (const [id, p] of Object.entries(nextPoints)) {
      if (Math.hypot(p.x - pt.x, p.y - pt.y) < 1e-3) return id;
    }
    const newId = skId('p');
    nextPoints[newId] = { id: newId, x: pt.x, y: pt.y };
    return newId;
  };

  const newEntities: SkEntity[] = s.entities.filter((e) => e.id !== entityId);

  for (const inv of keepIntervals) {
    const startId = inv.t0 === 0 ? target.p1 : getOrCreatePoint(inv.pt0);
    const endId = inv.t1 === 1 ? target.p2 : getOrCreatePoint(inv.pt1);
    if (startId !== endId) {
      newEntities.push({
        id: skId('line'),
        type: 'line',
        p1: startId,
        p2: endId,
        construction: target.construction,
      });
    }
  }

  return {
    sketch: pruneOrphanPoints({ ...s, points: nextPoints, entities: newEntities }),
    success: true,
  };
}

/**
 * Fillet a corner between two lines meeting at a vertex point.
 * Creates a tangent arc of radius R and trims back both lines.
 */
export function filletCorner(
  s: Sketch,
  vertexPtId: string,
  radius: number
): { sketch: Sketch; success: boolean; error?: string } {
  if (radius <= 0) return { sketch: s, success: false, error: 'Radius must be positive' };
  const V = s.points[vertexPtId];
  if (!V) return { sketch: s, success: false, error: 'Vertex point not found' };

  const connectedLines = s.entities.filter(
    (e): e is Extract<SkEntity, { type: 'line' }> => e.type === 'line' && (e.p1 === vertexPtId || e.p2 === vertexPtId)
  );

  if (connectedLines.length !== 2) {
    return {
      sketch: s,
      success: false,
      error: `Corner must have exactly 2 meeting lines (found ${connectedLines.length})`,
    };
  }

  const [L1, L2] = connectedLines;
  const pAId = L1.p1 === vertexPtId ? L1.p2 : L1.p1;
  const pBId = L2.p1 === vertexPtId ? L2.p2 : L2.p1;
  const pA = s.points[pAId];
  const pB = s.points[pBId];
  if (!pA || !pB) return { sketch: s, success: false };

  const v1x = pA.x - V.x, v1y = pA.y - V.y;
  const v2x = pB.x - V.x, v2y = pB.y - V.y;
  const lenA = Math.hypot(v1x, v1y);
  const lenB = Math.hypot(v2x, v2y);
  if (lenA < 1e-4 || lenB < 1e-4) return { sketch: s, success: false, error: 'Line too short' };

  const u1x = v1x / lenA, u1y = v1y / lenA;
  const u2x = v2x / lenB, u2y = v2y / lenB;

  const dot = Math.max(-0.99999, Math.min(0.99999, u1x * u2x + u1y * u2y));
  const alpha = Math.acos(dot);
  if (alpha < 0.05 || alpha > Math.PI - 0.05) {
    return { sketch: s, success: false, error: 'Corner angle too acute or parallel' };
  }

  const tanHalf = Math.tan(alpha / 2);
  let d = radius / tanHalf;

  const maxD = Math.min(lenA, lenB) * 0.95;
  let effectiveR = radius;
  if (d > maxD) {
    d = maxD;
    effectiveR = d * tanHalf;
  }

  const t1 = { x: V.x + d * u1x, y: V.y + d * u1y };
  const t2 = { x: V.x + d * u2x, y: V.y + d * u2y };

  const bisX = u1x + u2x;
  const bisY = u1y + u2y;
  const bisLen = Math.hypot(bisX, bisY);
  if (bisLen < 1e-6) return { sketch: s, success: false };

  const ubisX = bisX / bisLen;
  const ubisY = bisY / bisLen;
  const distC = effectiveR / Math.sin(alpha / 2);
  const C = { x: V.x + distC * ubisX, y: V.y + distC * ubisY };

  const cross = (t1.x - C.x) * (t2.y - C.y) - (t1.y - C.y) * (t2.x - C.x);
  const startPt = cross > 0 ? t1 : t2;

  const ptT1Id = skId('p');
  const ptT2Id = skId('p');
  const ptCId = skId('p');

  const nextPoints: Record<string, SkPoint> = {
    ...s.points,
    [ptT1Id]: { id: ptT1Id, x: t1.x, y: t1.y },
    [ptT2Id]: { id: ptT2Id, x: t2.x, y: t2.y },
    [ptCId]: { id: ptCId, x: C.x, y: C.y },
  };

  const nextEntities: SkEntity[] = s.entities.map((e) => {
    if (e.id === L1.id && e.type === 'line') {
      return {
        ...e,
        p1: e.p1 === vertexPtId ? ptT1Id : e.p1,
        p2: e.p2 === vertexPtId ? ptT1Id : e.p2,
      };
    }
    if (e.id === L2.id && e.type === 'line') {
      return {
        ...e,
        p1: e.p1 === vertexPtId ? ptT2Id : e.p1,
        p2: e.p2 === vertexPtId ? ptT2Id : e.p2,
      };
    }
    return e;
  });

  const arcStartId = startPt === t1 ? ptT1Id : ptT2Id;
  const arcEndId = startPt === t1 ? ptT2Id : ptT1Id;
  nextEntities.push({
    id: skId('arc'),
    type: 'arc',
    c: ptCId,
    p1: arcStartId,
    p2: arcEndId,
    construction: L1.construction || L2.construction,
  });

  return {
    sketch: pruneOrphanPoints({ ...s, points: nextPoints, entities: nextEntities }),
    success: true,
  };
}

/**
 * Chamfer a corner between two lines meeting at a vertex point.
 * Cuts back both lines by distance d and inserts a bevel line.
 */
export function chamferCorner(
  s: Sketch,
  vertexPtId: string,
  distance: number
): { sketch: Sketch; success: boolean; error?: string } {
  if (distance <= 0) return { sketch: s, success: false, error: 'Distance must be positive' };
  const V = s.points[vertexPtId];
  if (!V) return { sketch: s, success: false, error: 'Vertex point not found' };

  const connectedLines = s.entities.filter(
    (e): e is Extract<SkEntity, { type: 'line' }> => e.type === 'line' && (e.p1 === vertexPtId || e.p2 === vertexPtId)
  );

  if (connectedLines.length !== 2) {
    return {
      sketch: s,
      success: false,
      error: `Corner must have exactly 2 meeting lines (found ${connectedLines.length})`,
    };
  }

  const [L1, L2] = connectedLines;
  const pAId = L1.p1 === vertexPtId ? L1.p2 : L1.p1;
  const pBId = L2.p1 === vertexPtId ? L2.p2 : L2.p1;
  const pA = s.points[pAId];
  const pB = s.points[pBId];
  if (!pA || !pB) return { sketch: s, success: false };

  const v1x = pA.x - V.x, v1y = pA.y - V.y;
  const v2x = pB.x - V.x, v2y = pB.y - V.y;
  const lenA = Math.hypot(v1x, v1y);
  const lenB = Math.hypot(v2x, v2y);
  if (lenA < 1e-4 || lenB < 1e-4) return { sketch: s, success: false, error: 'Line too short' };

  const u1x = v1x / lenA, u1y = v1y / lenA;
  const u2x = v2x / lenB, u2y = v2y / lenB;

  const d = Math.min(distance, Math.min(lenA, lenB) * 0.95);

  const p1 = { x: V.x + d * u1x, y: V.y + d * u1y };
  const p2 = { x: V.x + d * u2x, y: V.y + d * u2y };

  const pt1Id = skId('p');
  const pt2Id = skId('p');

  const nextPoints: Record<string, SkPoint> = {
    ...s.points,
    [pt1Id]: { id: pt1Id, x: p1.x, y: p1.y },
    [pt2Id]: { id: pt2Id, x: p2.x, y: p2.y },
  };

  const nextEntities: SkEntity[] = s.entities.map((e) => {
    if (e.id === L1.id && e.type === 'line') {
      return {
        ...e,
        p1: e.p1 === vertexPtId ? pt1Id : e.p1,
        p2: e.p2 === vertexPtId ? pt1Id : e.p2,
      };
    }
    if (e.id === L2.id && e.type === 'line') {
      return {
        ...e,
        p1: e.p1 === vertexPtId ? pt2Id : e.p1,
        p2: e.p2 === vertexPtId ? pt2Id : e.p2,
      };
    }
    return e;
  });

  nextEntities.push({
    id: skId('line'),
    type: 'line',
    p1: pt1Id,
    p2: pt2Id,
    construction: L1.construction || L2.construction,
  });

  return {
    sketch: pruneOrphanPoints({ ...s, points: nextPoints, entities: nextEntities }),
    success: true,
  };
}

/**
 * Fillet between two lines (identifies their common corner vertex).
 */
export function filletBetweenLines(
  s: Sketch,
  lineId1: string,
  lineId2: string,
  radius: number
): { sketch: Sketch; success: boolean; error?: string } {
  const l1 = s.entities.find((e) => e.id === lineId1);
  const l2 = s.entities.find((e) => e.id === lineId2);
  if (!l1 || !l2 || l1.type !== 'line' || l2.type !== 'line') {
    return { sketch: s, success: false, error: 'Both entities must be lines' };
  }
  const common = [l1.p1, l1.p2].find((p) => p === l2.p1 || p === l2.p2);
  if (!common) {
    return { sketch: s, success: false, error: 'Lines do not share a common corner vertex' };
  }
  return filletCorner(s, common, radius);
}

/**
 * Chamfer between two lines (identifies their common corner vertex).
 */
export function chamferBetweenLines(
  s: Sketch,
  lineId1: string,
  lineId2: string,
  distance: number
): { sketch: Sketch; success: boolean; error?: string } {
  const l1 = s.entities.find((e) => e.id === lineId1);
  const l2 = s.entities.find((e) => e.id === lineId2);
  if (!l1 || !l2 || l1.type !== 'line' || l2.type !== 'line') {
    return { sketch: s, success: false, error: 'Both entities must be lines' };
  }
  const common = [l1.p1, l1.p2].find((p) => p === l2.p1 || p === l2.p2);
  if (!common) {
    return { sketch: s, success: false, error: 'Lines do not share a common corner vertex' };
  }
  return chamferCorner(s, common, distance);
}

/**
 * 2D Circular Array / Pattern around a center point
 */
export function applyCircularPatternToSketch(
  s: Sketch,
  entityIds: string[],
  centerX: number,
  centerY: number,
  count: number,
  totalAngleDeg = 360
): Sketch {
  if (entityIds.length === 0 || count <= 1) return s;
  const targetEnts = s.entities.filter((e) => entityIds.includes(e.id));
  if (targetEnts.length === 0) return s;

  const usedPids = new Set<string>();
  for (const e of targetEnts) {
    if (e.type === 'point') usedPids.add(e.p);
    else if (e.type === 'line') { usedPids.add(e.p1); usedPids.add(e.p2); }
    else if (e.type === 'circle') usedPids.add(e.c);
    else if (e.type === 'arc') { usedPids.add(e.c); usedPids.add(e.p1); usedPids.add(e.p2); }
  }

  const newPoints: Record<string, SkPoint> = { ...s.points };
  const newEntities: SkEntity[] = [...s.entities];
  const stepAngle = (totalAngleDeg / count) * (Math.PI / 180);

  for (let i = 1; i < count; i++) {
    const theta = i * stepAngle;
    const cos = Math.cos(theta), sin = Math.sin(theta);

    const ptMap = new Map<string, string>();
    for (const pid of usedPids) {
      const oldPt = s.points[pid];
      if (!oldPt) continue;
      const rx = oldPt.x - centerX;
      const ry = oldPt.y - centerY;
      const rotX = centerX + rx * cos - ry * sin;
      const rotY = centerY + rx * sin + ry * cos;
      const newId = skId('p');
      newPoints[newId] = { id: newId, x: rotX, y: rotY };
      ptMap.set(pid, newId);
    }

    for (const e of targetEnts) {
      const entId = skId(e.type);
      if (e.type === 'point') {
        newEntities.push({ id: entId, type: 'point', p: ptMap.get(e.p)!, construction: e.construction });
      } else if (e.type === 'line') {
        newEntities.push({ id: entId, type: 'line', p1: ptMap.get(e.p1)!, p2: ptMap.get(e.p2)!, construction: e.construction });
      } else if (e.type === 'circle') {
        newEntities.push({ id: entId, type: 'circle', c: ptMap.get(e.c)!, r: e.r, construction: e.construction });
      } else if (e.type === 'arc') {
        newEntities.push({ id: entId, type: 'arc', c: ptMap.get(e.c)!, p1: ptMap.get(e.p1)!, p2: ptMap.get(e.p2)!, construction: e.construction });
      }
    }
  }

  return { ...s, points: newPoints, entities: newEntities };
}

/**
 * 2D Point/Curve-Driven Custom Pattern
 */
export function applyPointPatternToSketch(
  s: Sketch,
  entityIds: string[],
  basePoint: { x: number; y: number },
  targetPoints: Array<{ x: number; y: number }>
): Sketch {
  if (entityIds.length === 0 || targetPoints.length === 0) return s;
  const targetEnts = s.entities.filter((e) => entityIds.includes(e.id));
  if (targetEnts.length === 0) return s;

  const usedPids = new Set<string>();
  for (const e of targetEnts) {
    if (e.type === 'point') usedPids.add(e.p);
    else if (e.type === 'line') { usedPids.add(e.p1); usedPids.add(e.p2); }
    else if (e.type === 'circle') usedPids.add(e.c);
    else if (e.type === 'arc') { usedPids.add(e.c); usedPids.add(e.p1); usedPids.add(e.p2); }
  }

  const newPoints: Record<string, SkPoint> = { ...s.points };
  const newEntities: SkEntity[] = [...s.entities];

  for (const tp of targetPoints) {
    const dx = tp.x - basePoint.x;
    const dy = tp.y - basePoint.y;
    if (Math.hypot(dx, dy) < 1e-6) continue;

    const ptMap = new Map<string, string>();
    for (const pid of usedPids) {
      const oldPt = s.points[pid];
      if (!oldPt) continue;
      const newId = skId('p');
      newPoints[newId] = { id: newId, x: oldPt.x + dx, y: oldPt.y + dy };
      ptMap.set(pid, newId);
    }

    for (const e of targetEnts) {
      const entId = skId(e.type);
      if (e.type === 'point') {
        newEntities.push({ id: entId, type: 'point', p: ptMap.get(e.p)!, construction: e.construction });
      } else if (e.type === 'line') {
        newEntities.push({ id: entId, type: 'line', p1: ptMap.get(e.p1)!, p2: ptMap.get(e.p2)!, construction: e.construction });
      } else if (e.type === 'circle') {
        newEntities.push({ id: entId, type: 'circle', c: ptMap.get(e.c)!, r: e.r, construction: e.construction });
      } else if (e.type === 'arc') {
        newEntities.push({ id: entId, type: 'arc', c: ptMap.get(e.c)!, p1: ptMap.get(e.p1)!, p2: ptMap.get(e.p2)!, construction: e.construction });
      }
    }
  }

  return { ...s, points: newPoints, entities: newEntities };
}

/** Bounding box of all non-construction geometry. */
export function sketchBounds(s: Sketch) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const e of s.entities) for (const p of sampleEntity(s, e, 32)) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  if (!isFinite(minX)) return { minX: -50, minY: -50, maxX: 50, maxY: 50 };
  return { minX, minY, maxX, maxY };
}
