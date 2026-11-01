/**
 * Shared DXF geometry helpers (used by the nesting importer and the 2D CAD importer).
 *
 *  - polyline bulges (signed: + counter-clockwise, − clockwise; closing segment included)
 *  - B-spline evaluation (de Boor) for SPLINE entities
 *  - ellipse sampling for ELLIPSE entities
 *  - 2-D affine transforms for INSERT block references and OCS mirroring
 *  - $INSUNITS → millimetres
 *
 * dxf-parser 1.x conventions: ARC/CIRCLE angles in radians, LINE end points in `vertices`,
 * ELLIPSE start/end are parameters (radians), INSERT rotation in degrees.
 */

export interface Pt { x: number; y: number }

/** Max chord deviation when approximating arcs, ellipses and splines (mm). */
export const ARC_TOLERANCE = 0.05;

/** $INSUNITS code → millimetres per drawing unit (0 = unitless, treated as mm). */
export const INSUNITS_TO_MM: Readonly<Record<number, number>> = {
  0: 1, 1: 25.4, 2: 304.8, 3: 1_609_344, 4: 1, 5: 10, 6: 1000, 7: 1_000_000,
  8: 25.4e-6, 9: 0.0254, 10: 914.4, 11: 1e-7, 12: 1e-6, 13: 1e-3, 14: 100, 15: 10_000, 16: 100_000,
};

export const INSUNITS_NAMES: Readonly<Record<number, string>> = {
  1: 'inch', 2: 'foot', 3: 'mile', 5: 'cm', 6: 'm', 7: 'km', 8: 'microinch', 9: 'mil', 10: 'yard',
  11: 'ångström', 12: 'nm', 13: 'µm', 14: 'dm', 15: 'dam', 16: 'hm',
};

export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** Number of segments so that the chord deviation stays below ARC_TOLERANCE. */
export function arcSegments(radius: number, sweep: number, tolerance = ARC_TOLERANCE): number {
  const span = Math.abs(sweep);
  if (radius <= 0 || span <= 0) return 1;
  const maxStep = 2 * Math.acos(Math.max(-1, 1 - tolerance / radius));
  const steps = Math.ceil(span / Math.max(maxStep, 1e-3));
  return Math.min(720, Math.max(span > Math.PI ? 8 : 2, steps));
}

/** Points on a circular arc from a0 sweeping by `sweep` radians (sign = direction), both ends included. */
export function arcPoints(cx: number, cy: number, r: number, a0: number, sweep: number): Pt[] {
  const n = arcSegments(r, sweep);
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = a0 + (sweep * i) / n;
    pts.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
  }
  return pts;
}

/** Centre, radius and signed sweep of a bulge segment a → b (bulge = tan(θ/4)). */
export function bulgeArc(a: Pt, b: Pt, bulge: number): { cx: number; cy: number; r: number; a0: number; sweep: number } | null {
  const theta = 4 * Math.atan(bulge);
  const chord = dist(a, b);
  if (chord < 1e-12 || Math.abs(theta) < 1e-9) return null;
  const r = chord / (2 * Math.sin(Math.abs(theta) / 2));
  // signed distance from the chord midpoint to the centre along the left normal
  const h = chord / 2 / Math.tan(theta / 2);
  const nx = -(b.y - a.y) / chord;
  const ny = (b.x - a.x) / chord;
  const cx = (a.x + b.x) / 2 + nx * h;
  const cy = (a.y + b.y) / 2 + ny * h;
  return { cx, cy, r, a0: Math.atan2(a.y - cy, a.x - cx), sweep: theta };
}

/** Interior points of a bulge segment (end points excluded). */
export function bulgeInterior(a: Pt, b: Pt, bulge: number): Pt[] {
  const arc = bulgeArc(a, b, bulge);
  if (!arc) return [];
  return arcPoints(arc.cx, arc.cy, arc.r, arc.a0, arc.sweep).slice(1, -1);
}

/** Polyline vertices with bulge arcs (the closing segment's bulge included when closed). */
export function polylinePoints(vertices: Array<{ x: number; y: number; bulge?: number }>, closed: boolean): Pt[] {
  const out: Pt[] = [];
  const n = vertices.length;
  const segments = closed ? n : n - 1;
  for (let i = 0; i < n; i++) {
    const a = vertices[i];
    out.push({ x: a.x, y: a.y });
    if (i < segments) {
      const b = vertices[(i + 1) % n];
      if (a.bulge && Math.abs(a.bulge) > 1e-12) out.push(...bulgeInterior(a, b, a.bulge));
    }
  }
  return out;
}

/** de Boor evaluation of a non-rational B-spline. */
export function deBoor(t: number, degree: number, knots: number[], ctrl: Pt[]): Pt {
  const n = ctrl.length;
  let k = degree;
  while (k < n - 1 && t >= knots[k + 1]) k++;
  const d: Pt[] = [];
  for (let j = 0; j <= degree; j++) {
    const c = ctrl[Math.min(n - 1, Math.max(0, j + k - degree))];
    d.push({ x: c.x, y: c.y });
  }
  for (let r = 1; r <= degree; r++) {
    for (let j = degree; j >= r; j--) {
      const i = j + k - degree;
      const denom = knots[i + degree - r + 1] - knots[i];
      const alpha = denom === 0 ? 0 : (t - knots[i]) / denom;
      d[j] = { x: (1 - alpha) * d[j - 1].x + alpha * d[j].x, y: (1 - alpha) * d[j - 1].y + alpha * d[j].y };
    }
  }
  return d[degree];
}

export interface SplineLike {
  controlPoints?: Pt[];
  fitPoints?: Pt[];
  knotValues?: number[];
  degreeOfSplineCurve?: number;
}

/** Sampled points of a DXF SPLINE (true B-spline; fit points or control polygon as fallback). */
export function splinePoints(e: SplineLike): Pt[] {
  const ctrl = e.controlPoints ?? [];
  const knots = e.knotValues ?? [];
  const degree = Math.max(1, e.degreeOfSplineCurve ?? 3);
  if (ctrl.length > degree && knots.length === ctrl.length + degree + 1) {
    let length = 0;
    for (let i = 1; i < ctrl.length; i++) length += dist(ctrl[i - 1], ctrl[i]);
    const samples = Math.min(4000, Math.max(ctrl.length * 12, Math.ceil(length / 2), 24));
    const t0 = knots[degree];
    const t1 = knots[knots.length - degree - 1];
    const pts: Pt[] = [];
    for (let i = 0; i <= samples; i++) pts.push(deBoor(t0 + ((t1 - t0) * i) / samples, degree, knots, ctrl));
    return pts;
  }
  const fit = e.fitPoints ?? [];
  if (fit.length >= 2) return fit.map((p) => ({ x: p.x, y: p.y }));
  return ctrl.map((p) => ({ x: p.x, y: p.y }));
}

export interface EllipseLike {
  center: Pt;
  majorAxisEndPoint: Pt;
  axisRatio?: number;
  startAngle?: number;
  endAngle?: number;
}

/** Sampled ELLIPSE (parameters in radians); closed when it is a full ellipse. */
export function ellipsePoints(e: EllipseLike): { points: Pt[]; closed: boolean } {
  const c = e.center;
  const m = e.majorAxisEndPoint;
  const k = e.axisRatio ?? 1;
  const t0 = e.startAngle ?? 0;
  let t1 = e.endAngle ?? Math.PI * 2;
  if (t1 <= t0) t1 += Math.PI * 2;
  const sweep = t1 - t0;
  const closed = Math.abs(sweep - Math.PI * 2) < 1e-6;
  const major = Math.hypot(m.x, m.y);
  const n = Math.ceil(arcSegments(major, sweep) * 1.5);
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 + (sweep * i) / n;
    const cos = Math.cos(t), sin = Math.sin(t);
    pts.push({ x: c.x + m.x * cos - k * m.y * sin, y: c.y + m.y * cos + k * m.x * sin });
  }
  if (closed) pts.pop();
  return { points: pts, closed };
}

// ─── affine transforms ──────────────────────────────────────────────────────

/** 2-D affine transform: x' = a·x + c·y + e,  y' = b·x + d·y + f */
export type Affine = [number, number, number, number, number, number];

export const IDENTITY: Affine = [1, 0, 0, 1, 0, 0];
export const MIRROR_X: Affine = [-1, 0, 0, 1, 0, 0];

export function compose(outer: Affine, inner: Affine): Affine {
  const [a1, b1, c1, d1, e1, f1] = outer;
  const [a2, b2, c2, d2, e2, f2] = inner;
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

export function apply(m: Affine, p: Pt): Pt {
  return { x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] };
}

/** Linear part only (for direction vectors). */
export function applyLinear(m: Affine, v: Pt): Pt {
  return { x: m[0] * v.x + m[2] * v.y, y: m[1] * v.x + m[3] * v.y };
}

export const determinant = (m: Affine) => m[0] * m[3] - m[1] * m[2];

/** Uniform scale factor of a similarity transform (√|det|). */
export const scaleOf = (m: Affine) => Math.sqrt(Math.abs(determinant(m)));

/** Rotation angle (radians) of the transform's x axis. */
export const rotationOf = (m: Affine) => Math.atan2(m[1], m[0]);

/** True when the transform is a similarity (no shear, equal axis scales). */
export function isSimilarity(m: Affine, tol = 1e-9): boolean {
  const sx = Math.hypot(m[0], m[1]);
  const sy = Math.hypot(m[2], m[3]);
  const dot = m[0] * m[2] + m[1] * m[3];
  return Math.abs(sx - sy) <= tol * Math.max(1, sx) && Math.abs(dot) <= tol * Math.max(1, sx * sy);
}

export interface InsertLike {
  type?: string;
  position?: Pt;
  xScale?: number;
  yScale?: number;
  rotation?: number;
  extrusionDirection?: { x: number; y: number; z: number };
  extrusionDirectionZ?: number;
}

/** Entities whose coordinates are stored in the OCS: extrusion Z < 0 mirrors X. */
export function ocsMirrored(e: InsertLike & { type?: string }): boolean {
  const z = e.extrusionDirectionZ ?? e.extrusionDirection?.z;
  return typeof z === 'number' && z < 0 && ['ARC', 'CIRCLE', 'LWPOLYLINE', 'POLYLINE', 'INSERT'].includes(e.type ?? '');
}

/** INSERT → transform from block coordinates to the parent's coordinates. */
export function insertTransform(e: InsertLike, base: Pt): Affine {
  const sx = e.xScale ?? 1;
  const sy = e.yScale ?? 1;
  const rot = ((e.rotation ?? 0) * Math.PI) / 180;
  const cos = Math.cos(rot), sin = Math.sin(rot);
  const px = e.position?.x ?? 0;
  const py = e.position?.y ?? 0;
  // p' = P + R·S·(p − base)
  const a = cos * sx, b = sin * sx, c = -sin * sy, d = cos * sy;
  let m: Affine = [a, b, c, d, px - (a * base.x + c * base.y), py - (b * base.x + d * base.y)];
  if (ocsMirrored({ ...e, type: 'INSERT' })) m = compose(MIRROR_X, m);
  return m;
}

/** AutoCAD \U+XXXX escapes (used for characters outside the file code page) → characters. */
export function decodeDxfUnicode(s: string): string {
  return String(s ?? '').replace(/\\U\+([0-9A-Fa-f]{4})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

/** 0xRRGGBB integer → #rrggbb */
export function rgbIntToHex(n: number): string {
  return `#${(n & 0xffffff).toString(16).padStart(6, '0')}`;
}
