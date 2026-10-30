/**
 * Parametric part: history of Sketch → Extrude / Revolve features, regenerated
 * into solid bodies (three.js BufferGeometry, millimetres) with CSG for
 * join / cut / intersect (three-bvh-csg).
 *
 * Every solid starts ON its sketch plane (Inventor/SolidWorks behaviour):
 * "normal" grows along the plane normal, "reverse" against it, "symmetric" half
 * each side. Editing a sketch or a feature and calling `regenerate` rebuilds
 * everything downstream.
 */
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Brush, Evaluator, ADDITION, SUBTRACTION, INTERSECTION } from 'three-bvh-csg';
import { type Sketch, emptySketch } from './sketch';
import { detectProfiles, type ProfileRegion } from './profiles';

export type V3 = [number, number, number];

export interface PlaneFrame {
  origin: V3;
  normal: V3;
  xDir: V3;
}

export type OriginPlaneId = 'XY' | 'XZ' | 'YZ';

export const ORIGIN_PLANES: Record<OriginPlaneId, PlaneFrame & { label: { tr: string; en: string } }> = {
  XY: { origin: [0, 0, 0], normal: [0, 0, 1], xDir: [1, 0, 0], label: { tr: 'Ön düzlem (XY)', en: 'Front plane (XY)' } },
  XZ: { origin: [0, 0, 0], normal: [0, 1, 0], xDir: [1, 0, 0], label: { tr: 'Üst düzlem (XZ)', en: 'Top plane (XZ)' } },
  YZ: { origin: [0, 0, 0], normal: [1, 0, 0], xDir: [0, 0, -1], label: { tr: 'Sağ düzlem (YZ)', en: 'Right plane (YZ)' } },
};

export type Operation = 'new' | 'join' | 'cut' | 'intersect';

export interface SketchFeature {
  id: string;
  type: 'sketch';
  name: string;
  plane: PlaneFrame;
  /** human label of what the sketch sits on */
  planeLabel: string;
  sketch: Sketch;
  visible: boolean;
}

export interface ExtrudeFeature {
  id: string;
  type: 'extrude';
  name: string;
  sketchId: string;
  /** chosen profile regions; empty = automatic (all closed loops, nested = holes) */
  regionKeys: string[];
  distance: number;
  direction: 'normal' | 'reverse' | 'symmetric';
  operation: Operation;
  suppressed?: boolean;
}

export interface RevolveFeature {
  id: string;
  type: 'revolve';
  name: string;
  sketchId: string;
  regionKeys: string[];
  /** 'X' | 'Y' sketch axes through the origin, or the id of a sketch line */
  axis: string;
  angle: number;
  operation: Operation;
  suppressed?: boolean;
}

export type HoleType = 'simple' | 'counterbore' | 'countersink' | 'tapped';

export interface HoleFeature {
  id: string;
  type: 'hole';
  name: string;
  holeType: HoleType;
  standardSize: string; // e.g. "M6", "M8", "Custom"
  diameter: number; // pilot / drill diameter in mm
  depth: number; // depth in mm
  isThroughAll: boolean;
  direction?: 'normal' | 'reverse';
  cboreDiameter?: number;
  cboreDepth?: number;
  csinkDiameter?: number;
  csinkAngle?: number;
  threadPitch?: number;
  plane: PlaneFrame;
  planeLabel?: string;
  center: { x: number; y: number };
  /** Optional linked sketch: points in this sketch define hole positions */
  sketchId?: string;
  suppressed?: boolean;
}

export type ThreadStandard = 'ISO_METRIC' | 'UNC' | 'UNF' | 'G_PIPE' | 'CUSTOM';

export interface ThreadFeature {
  id: string;
  type: 'thread';
  name: string;
  standard: ThreadStandard;
  size: string; // e.g. "M6", "M8"
  nominalDiameter: number; // mm
  pitch: number; // mm
  length: number; // mm
  isInternal: boolean; // true = female / tapped, false = male / bolt
  direction?: 'normal' | 'reverse';
  plane: PlaneFrame;
  planeLabel?: string;
  center: { x: number; y: number };
  suppressed?: boolean;
}

export interface LinearPatternFeature {
  id: string;
  type: 'linearPattern';
  name: string;
  targetFeatureId: string;
  dir1Axis: 'X' | 'Y' | 'Z';
  dir1Count: number;
  dir1Spacing: number; // mm
  dir2Enabled?: boolean;
  dir2Axis?: 'X' | 'Y' | 'Z';
  dir2Count?: number;
  dir2Spacing?: number; // mm
  suppressed?: boolean;
}

export interface CircularPatternFeature {
  id: string;
  type: 'circularPattern';
  name: string;
  targetFeatureId: string;
  axis: 'X' | 'Y' | 'Z';
  count: number;
  totalAngle: number; // degrees, default 360
  suppressed?: boolean;
}

export interface MirrorFeature {
  id: string;
  type: 'mirror';
  name: string;
  targetFeatureId: string;
  plane: 'XY' | 'XZ' | 'YZ';
  suppressed?: boolean;
}

export type Feature =
  | SketchFeature
  | ExtrudeFeature
  | RevolveFeature
  | HoleFeature
  | ThreadFeature
  | LinearPatternFeature
  | CircularPatternFeature
  | MirrorFeature;

export interface PartDoc {
  name: string;
  features: Feature[];
}

export interface Body {
  id: string;
  name: string;
  geometry: THREE.BufferGeometry;
  /** feature that created it */
  featureId: string;
}

export interface RegenResult {
  bodies: Body[];
  errors: Record<string, string>;
  /** tool solid of each solid feature (for previews / highlighting) */
  tools: Record<string, THREE.BufferGeometry>;
}

export const v3 = (a: V3) => new THREE.Vector3(a[0], a[1], a[2]);

export function planeBasis(p: PlaneFrame) {
  const n = v3(p.normal).normalize();
  const x = v3(p.xDir).normalize();
  const y = new THREE.Vector3().crossVectors(n, x).normalize();
  const o = v3(p.origin);
  const m = new THREE.Matrix4().makeBasis(x, y, n).setPosition(o);
  return { o, x, y, n, matrix: m };
}

/** sketch (u,v) mm → world */
export function sketchToWorld(p: PlaneFrame, u: number, v: number): THREE.Vector3 {
  const b = planeBasis(p);
  return b.o.clone().addScaledVector(b.x, u).addScaledVector(b.y, v);
}

/** world → sketch (u,v) of the projection onto the plane */
export function worldToSketch(p: PlaneFrame, w: THREE.Vector3): { x: number; y: number } {
  const b = planeBasis(p);
  const d = w.clone().sub(b.o);
  return { x: d.dot(b.x), y: d.dot(b.y) };
}

/**
 * Plane frame on a picked planar face: through `point` with `normal`; origin is
 * the projection of the world origin so sketch coordinates stay meaningful.
 */
export function planeFromFace(point: THREE.Vector3, normalIn: THREE.Vector3): PlaneFrame {
  const n = normalIn.clone().normalize();
  for (const k of ['x', 'y', 'z'] as const) if (Math.abs(n[k]) < 1e-4) n[k] = 0;
  n.normalize();
  const Y = new THREE.Vector3(0, 1, 0);
  let x = new THREE.Vector3().crossVectors(Y, n);
  if (x.lengthSq() < 1e-6) x = new THREE.Vector3(1, 0, 0);
  x.normalize();
  const o = n.clone().multiplyScalar(point.dot(n));
  const r = (v: THREE.Vector3): V3 => [round(v.x), round(v.y), round(v.z)];
  return { origin: r(o), normal: r(n), xDir: r(x) };
}

const round = (v: number) => Math.round(v * 1e6) / 1e6;

// ───────────────────────────── geometry builders ─────────────────────────────

function shapeFromRegion(r: ProfileRegion): THREE.Shape {
  const shape = new THREE.Shape(r.outer.map((p) => new THREE.Vector2(p.x, p.y)));
  for (const h of r.holes) shape.holes.push(new THREE.Path(h.map((p) => new THREE.Vector2(p.x, p.y))));
  return shape;
}

function signedVolume(g: THREE.BufferGeometry): number {
  const pos = g.getAttribute('position');
  const idx = g.getIndex();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  let v = 0;
  const n = idx ? idx.count : pos.count;
  for (let i = 0; i < n; i += 3) {
    const ia = idx ? idx.getX(i) : i, ib = idx ? idx.getX(i + 1) : i + 1, ic = idx ? idx.getX(i + 2) : i + 2;
    a.fromBufferAttribute(pos, ia); b.fromBufferAttribute(pos, ib); c.fromBufferAttribute(pos, ic);
    v += a.dot(new THREE.Vector3().crossVectors(b, c)) / 6;
  }
  return v;
}

export function volumeOf(g: THREE.BufferGeometry) {
  return Math.abs(signedVolume(g));
}

/** Non-indexed, position+normal only, outward winding — what CSG wants. */
function normalise(g: THREE.BufferGeometry): THREE.BufferGeometry {
  let out = g.index ? g.toNonIndexed() : g.clone();
  for (const k of Object.keys(out.attributes)) if (k !== 'position') out.deleteAttribute(k);
  out.clearGroups();
  if (signedVolume(out) < 0) {
    const p = out.getAttribute('position') as THREE.BufferAttribute;
    const arr = p.array as Float32Array;
    for (let i = 0; i < arr.length; i += 9) {
      for (let k = 0; k < 3; k++) { const t = arr[i + 3 + k]; arr[i + 3 + k] = arr[i + 6 + k]; arr[i + 6 + k] = t; }
    }
    p.needsUpdate = true;
  }
  out.computeVertexNormals();
  return out;
}

/**
 * `pad` (mm) lengthens the tool at both ends. Cut tools are padded by
 * 1 µm so their caps are never exactly coplanar with the body faces they start on
 * (coplanar booleans leave slivers and broken edges) — the same trick SolidWorks
 * applies internally. Invisible at any realistic tolerance.
 */
export function extrudeRegions(plane: PlaneFrame, regions: ProfileRegion[], distance: number, direction: ExtrudeFeature['direction'], pad = 0): THREE.BufferGeometry | null {
  if (!regions.length || !(distance > 0)) return null;
  const basis = planeBasis(plane);
  const z0 = (direction === 'normal' ? 0 : direction === 'reverse' ? -distance : -distance / 2) - pad;
  const depth = distance + 2 * pad;

  const pieces: THREE.BufferGeometry[] = [];
  for (const r of regions) {
    const shape = shapeFromRegion(r);
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1, steps: 1 });
    g.translate(0, 0, z0);
    g.applyMatrix4(basis.matrix);
    pieces.push(normalise(g));
  }

  if (pieces.length === 0) return null;
  if (pieces.length === 1) return pieces[0];
  const merged = BufferGeometryUtils.mergeGeometries(pieces, false);
  return merged ? normalise(merged) : pieces[0];
}

/** Axis of revolution in sketch coords: point + unit direction. */
export function revolveAxis(sk: Sketch, axis: string): { p: { x: number; y: number }; d: { x: number; y: number } } | null {
  if (axis === 'X') return { p: { x: 0, y: 0 }, d: { x: 1, y: 0 } };
  if (axis === 'Y') return { p: { x: 0, y: 0 }, d: { x: 0, y: 1 } };
  const e = sk.entities.find((x) => x.id === axis);
  if (!e || e.type !== 'line') return null;
  const a = sk.points[e.p1], b = sk.points[e.p2];
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  if (L < 1e-9) return null;
  return { p: { x: a.x, y: a.y }, d: { x: (b.x - a.x) / L, y: (b.y - a.y) / L } };
}

function revolvePolygon(poly: { r: number; t: number }[], angleDeg: number): THREE.BufferGeometry {
  const full = angleDeg >= 359.999;
  const ang = (Math.min(360, Math.max(0.1, angleDeg)) * Math.PI) / 180;
  const S = Math.max(8, Math.ceil((ang / (2 * Math.PI)) * 96));
  const pos: number[] = [];
  const P = (r: number, t: number, phi: number) => [r * Math.sin(phi), t, r * Math.cos(phi)];
  const n = poly.length;
  for (let j = 0; j < S; j++) {
    const f0 = (ang * j) / S, f1 = (ang * (j + 1)) / S;
    for (let i = 0; i < n; i++) {
      const a = poly[i], b = poly[(i + 1) % n];
      const A0 = P(a.r, a.t, f0), B0 = P(b.r, b.t, f0), A1 = P(a.r, a.t, f1), B1 = P(b.r, b.t, f1);
      pos.push(...A0, ...B0, ...B1, ...A0, ...B1, ...A1);
    }
  }
  if (!full) {
    const contour = poly.map((p) => new THREE.Vector2(p.r, p.t));
    const tris = THREE.ShapeUtils.triangulateShape(contour, []);
    for (const [i, j, k] of tris) {
      const a = poly[i], b = poly[j], c = poly[k];
      pos.push(...P(a.r, a.t, 0), ...P(c.r, c.t, 0), ...P(b.r, b.t, 0));
      pos.push(...P(a.r, a.t, ang), ...P(b.r, b.t, ang), ...P(c.r, c.t, ang));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

export function revolveRegions(plane: PlaneFrame, sk: Sketch, regions: ProfileRegion[], axisRef: string, angle: number): { geometry: THREE.BufferGeometry | null; error?: string } {
  const ax = revolveAxis(sk, axisRef);
  if (!ax) return { geometry: null, error: 'axis' };
  if (!regions.length) return { geometry: null, error: 'profile' };
  const perp = { x: -ax.d.y, y: ax.d.x };
  const toRT = (q: { x: number; y: number }) => {
    const dx = q.x - ax.p.x, dy = q.y - ax.p.y;
    return { t: dx * ax.d.x + dy * ax.d.y, s: dx * perp.x + dy * perp.y };
  };
  // the profile must lie on one side of the axis
  const allS = regions.flatMap((r) => r.outer.map((q) => toRT(q).s));
  const pos = allS.filter((v) => v > 1e-6).length, neg = allS.filter((v) => v < -1e-6).length;
  if (pos && neg) return { geometry: null, error: 'crosses-axis' };
  const side = neg > pos ? -1 : 1;

  const evaluator = makeEvaluator();
  let acc: Brush | null = null;
  for (const r of regions) {
    const outer = normalise(revolvePolygon(r.outer.map((q) => { const v = toRT(q); return { r: Math.abs(v.s), t: v.t }; }), angle));
    let brush = new Brush(outer);
    for (const h of r.holes) {
      const hole = normalise(revolvePolygon(h.map((q) => { const v = toRT(q); return { r: Math.abs(v.s), t: v.t }; }), angle));
      brush = evaluator.evaluate(brush, new Brush(hole), SUBTRACTION) as Brush;
    }
    acc = acc ? (evaluator.evaluate(acc, brush, ADDITION) as Brush) : brush;
  }
  if (!acc) return { geometry: null, error: 'profile' };
  // local frame: Y = axis, Z = in-plane perpendicular (towards profile side), X = Y × Z
  const ey = new THREE.Vector3(ax.d.x, ax.d.y, 0);
  const ez = new THREE.Vector3(perp.x * side, perp.y * side, 0);
  const ex = new THREE.Vector3().crossVectors(ey, ez);
  const local = new THREE.Matrix4().makeBasis(ex, ey, ez).setPosition(ax.p.x, ax.p.y, 0);
  const g = acc.geometry.clone();
  g.applyMatrix4(local);
  g.applyMatrix4(planeBasis(plane).matrix);
  return { geometry: normalise(g) };
}

function makeEvaluator() {
  const ev = new Evaluator();
  ev.attributes = ['position', 'normal'];
  ev.useGroups = false;
  return ev;
}

const boxOf = (g: THREE.BufferGeometry) => { g.computeBoundingBox(); return g.boundingBox!.clone(); };
const triCount = (g: THREE.BufferGeometry) => (g.index ? g.index.count : g.getAttribute('position').count) / 3;

export function selectRegions(sk: Sketch, keys: string[]): ProfileRegion[] {
  const prof = detectProfiles(sk);
  if (!keys.length) return prof.auto.length > 0 ? prof.auto : prof.regions;
  const set = new Set(keys);
  return [...prof.regions, ...prof.auto].filter((r, i, arr) => set.has(r.key) && arr.findIndex((x) => x.key === r.key) === i);
}

// ───────────────────────────── hole & thread tool builders ─────────────────────────────

/**
 * Hole Tool Generator — Normative Standards Tier:
 * - DIN 912 (Socket head cap screw counterbore)
 * - DIN 7991 (Countersunk screw 90° head)
 * - ISO 261 / ISO 965 (Metric screw threads tap drill clearance)
 */
export function generateHoleTool(f: HoleFeature): THREE.BufferGeometry | null {
  const depth = Math.max(0.5, f.isThroughAll ? 1000 : f.depth);
  const pad = 1.0; // 1mm extension above face for clean CSG puncture
  const pieces: THREE.BufferGeometry[] = [];
  const rotZ = new THREE.Matrix4().makeRotationX(Math.PI / 2);
  const segments = 32;
  const dirSign = f.direction === 'normal' ? 1 : -1;

  const makeCyl = (rTop: number, rBot: number, zStart: number, zEnd: number, cx: number, cy: number) => {
    const H = Math.max(0.01, Math.abs(zEnd - zStart));
    const zMid = (zStart + zEnd) / 2;
    const g = new THREE.CylinderGeometry(rTop, rBot, H, segments);
    g.applyMatrix4(rotZ);
    g.translate(cx, cy, zMid);
    return g;
  };

  if (f.holeType === 'counterbore') {
    const cboreD = Math.max(f.diameter + 0.2, f.cboreDiameter ?? (f.diameter * 1.6));
    const cboreH = Math.min(depth - 0.1, Math.max(0.5, f.cboreDepth ?? (f.diameter * 0.8)));

    // Counterbore pocket
    const zStart1 = dirSign === -1 ? pad : -pad;
    const zEnd1 = dirSign === -1 ? -cboreH : cboreH;
    pieces.push(makeCyl(cboreD / 2, cboreD / 2, zStart1, zEnd1, f.center.x, f.center.y));

    // Pilot drill hole
    const zStart2 = zEnd1;
    const zEnd2 = dirSign === -1 ? -depth : depth;
    pieces.push(makeCyl(f.diameter / 2, f.diameter / 2, zStart2, zEnd2, f.center.x, f.center.y));
  } else if (f.holeType === 'countersink') {
    const csinkD = Math.max(f.diameter + 0.2, f.csinkDiameter ?? (f.diameter * 2.0));
    const angleRad = ((f.csinkAngle ?? 90) * Math.PI) / 180;
    const csinkH = Math.min(depth - 0.1, Math.max(0.5, (csinkD - f.diameter) / (2 * Math.tan(angleRad / 2))));

    // Conical sink
    const zStart1 = dirSign === -1 ? pad : -pad;
    const zEnd1 = dirSign === -1 ? -csinkH : csinkH;
    const rTop = dirSign === -1 ? csinkD / 2 : f.diameter / 2;
    const rBot = dirSign === -1 ? f.diameter / 2 : csinkD / 2;
    pieces.push(makeCyl(rTop, rBot, zStart1, zEnd1, f.center.x, f.center.y));

    // Pilot drill hole
    const zStart2 = zEnd1;
    const zEnd2 = dirSign === -1 ? -depth : depth;
    pieces.push(makeCyl(f.diameter / 2, f.diameter / 2, zStart2, zEnd2, f.center.x, f.center.y));
  } else {
    // Simple or Tapped hole cylinder
    const zStart = dirSign === -1 ? pad : -pad;
    const zEnd = dirSign === -1 ? -depth : depth;
    pieces.push(makeCyl(f.diameter / 2, f.diameter / 2, zStart, zEnd, f.center.x, f.center.y));
  }

  let merged: THREE.BufferGeometry | null = null;
  if (pieces.length === 1) {
    merged = pieces[0];
  } else {
    merged = BufferGeometryUtils.mergeGeometries(pieces, false);
  }
  if (!merged) return null;

  const basis = planeBasis(f.plane);
  merged.applyMatrix4(basis.matrix);
  return normalise(merged);
}

/**
 * Thread Tool Generator — Normative Standard ISO 68-1 / ISO 261:
 * Generates CSG subtraction tool for threaded hole (female) or threaded shaft (male).
 */
export function generateThreadTool(f: ThreadFeature): THREE.BufferGeometry | null {
  const rotZ = new THREE.Matrix4().makeRotationX(Math.PI / 2);
  const pad = 1.0;
  const dirSign = f.direction === 'normal' ? 1 : -1;
  const length = Math.max(1, f.length);
  const d = Math.max(1, f.nominalDiameter);
  const zStart = dirSign === -1 ? pad : -pad;
  const zEnd = dirSign === -1 ? -length : length;
  const H = Math.abs(zEnd - zStart);
  const zMid = (zStart + zEnd) / 2;

  // Internal thread tap bore
  const r = (f.isInternal ? d : Math.max(0.5, d - 1.0825 * f.pitch)) / 2;
  const g = new THREE.CylinderGeometry(r, r, H, 32);
  g.applyMatrix4(rotZ);
  g.translate(f.center.x, f.center.y, zMid);

  const basis = planeBasis(f.plane);
  g.applyMatrix4(basis.matrix);
  return normalise(g);
}

// ───────────────────────────── regeneration ─────────────────────────────

export function regenerate(doc: PartDoc, upToIndex?: number): RegenResult {
  const bodies: Body[] = [];
  const errors: Record<string, string> = {};
  const tools: Record<string, THREE.BufferGeometry> = {};
  const evaluator = makeEvaluator();
  const sketches = new Map<string, SketchFeature>();
  const last = upToIndex ?? doc.features.length - 1;
  let bodySeq = 0;

  doc.features.forEach((f, idx) => {
    if (idx > last) return;
    if (f.type === 'sketch') { sketches.set(f.id, f); return; }
    if (f.suppressed) return;

    if (f.type === 'hole') {
      const sf = f.sketchId ? sketches.get(f.sketchId) : undefined;
      const pointsToDrill: Array<{ x: number; y: number }> = [];
      if (sf) {
        const pointEnts = sf.sketch.entities.filter((e) => e.type === 'point');
        if (pointEnts.length > 0) {
          for (const pe of pointEnts) {
            const pt = sf.sketch.points[pe.p];
            if (pt) pointsToDrill.push({ x: pt.x, y: pt.y });
          }
        } else {
          for (const [pid, pt] of Object.entries(sf.sketch.points)) {
            if (pid !== 'O') pointsToDrill.push({ x: pt.x, y: pt.y });
          }
        }
      }
      if (pointsToDrill.length === 0) {
        pointsToDrill.push(f.center);
      }

      const holeTools: THREE.BufferGeometry[] = [];
      const plane = sf ? sf.plane : f.plane;
      for (const pt of pointsToDrill) {
        const singleTool = generateHoleTool({ ...f, plane, center: pt });
        if (singleTool) holeTools.push(singleTool);
      }
      if (!holeTools.length) { errors[f.id] = 'empty'; return; }
      const tool = holeTools.length === 1 ? holeTools[0] : normalise(BufferGeometryUtils.mergeGeometries(holeTools, false)!);
      tools[f.id] = tool;

      if (bodies.length === 0) { errors[f.id] = 'nothing-to-cut'; return; }
      const tb = boxOf(tool);
      const touched = bodies.filter((b) => boxOf(b.geometry).intersectsBox(tb));
      if (!touched.length) { errors[f.id] = 'no-intersection'; return; }
      for (const b of touched) {
        const res = evaluator.evaluate(new Brush(b.geometry), new Brush(tool), SUBTRACTION) as Brush;
        if (triCount(res.geometry) === 0) bodies.splice(bodies.indexOf(b), 1);
        else b.geometry = normalise(res.geometry);
      }
      return;
    }

    if (f.type === 'thread') {
      const tool = generateThreadTool(f);
      if (!tool) { errors[f.id] = 'empty'; return; }
      tools[f.id] = tool;
      if (bodies.length === 0) { errors[f.id] = 'nothing-to-cut'; return; }
      const tb = boxOf(tool);
      const touched = bodies.filter((b) => boxOf(b.geometry).intersectsBox(tb));
      if (!touched.length) { errors[f.id] = 'no-intersection'; return; }
      for (const b of touched) {
        const res = evaluator.evaluate(new Brush(b.geometry), new Brush(tool), SUBTRACTION) as Brush;
        if (triCount(res.geometry) === 0) bodies.splice(bodies.indexOf(b), 1);
        else b.geometry = normalise(res.geometry);
      }
      return;
    }

    if (f.type === 'linearPattern') {
      const targetTool = tools[f.targetFeatureId];
      if (!targetTool) { errors[f.id] = 'target-missing'; return; }
      const targetFeature = doc.features.find((x) => x.id === f.targetFeatureId);
      const isCut = targetFeature && (targetFeature.type === 'hole' || targetFeature.type === 'thread' || ('operation' in targetFeature && targetFeature.operation === 'cut'));

      const dirVec = (axis: 'X' | 'Y' | 'Z') => (axis === 'X' ? new THREE.Vector3(1, 0, 0) : axis === 'Y' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1));
      const v1 = dirVec(f.dir1Axis);
      const v2 = dirVec(f.dir2Axis || (f.dir1Axis === 'X' ? 'Y' : 'X'));
      const count1 = Math.max(1, f.dir1Count);
      const count2 = f.dir2Enabled ? Math.max(1, f.dir2Count || 1) : 1;

      const patternTools: THREE.BufferGeometry[] = [];
      for (let i = 0; i < count1; i++) {
        for (let j = 0; j < count2; j++) {
          if (i === 0 && j === 0) continue;
          const offset = v1.clone().multiplyScalar(i * f.dir1Spacing).addScaledVector(v2, j * (f.dir2Spacing || 0));
          const clone = targetTool.clone();
          clone.translate(offset.x, offset.y, offset.z);
          patternTools.push(clone);
        }
      }
      if (!patternTools.length) return;
      const combined = patternTools.length === 1 ? patternTools[0] : normalise(BufferGeometryUtils.mergeGeometries(patternTools, false)!);
      tools[f.id] = combined;

      const tb = boxOf(combined);
      const touched = bodies.filter((b) => boxOf(b.geometry).intersectsBox(tb));
      if (!touched.length) { errors[f.id] = 'no-intersection'; return; }
      for (const b of touched) {
        const op = isCut ? SUBTRACTION : ADDITION;
        const res = evaluator.evaluate(new Brush(b.geometry), new Brush(combined), op) as Brush;
        if (triCount(res.geometry) === 0) bodies.splice(bodies.indexOf(b), 1);
        else b.geometry = normalise(res.geometry);
      }
      return;
    }

    if (f.type === 'circularPattern') {
      const targetTool = tools[f.targetFeatureId];
      if (!targetTool) { errors[f.id] = 'target-missing'; return; }
      const targetFeature = doc.features.find((x) => x.id === f.targetFeatureId);
      const isCut = targetFeature && (targetFeature.type === 'hole' || targetFeature.type === 'thread' || ('operation' in targetFeature && targetFeature.operation === 'cut'));

      const count = Math.max(2, f.count);
      const totalAngle = f.totalAngle || 360;
      const stepAngle = (totalAngle / count) * (Math.PI / 180);
      const axisVec = f.axis === 'X' ? new THREE.Vector3(1, 0, 0) : f.axis === 'Y' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);

      const patternTools: THREE.BufferGeometry[] = [];
      for (let i = 1; i < count; i++) {
        const angle = i * stepAngle;
        const rotMat = new THREE.Matrix4().makeRotationAxis(axisVec, angle);
        const clone = targetTool.clone();
        clone.applyMatrix4(rotMat);
        patternTools.push(clone);
      }
      if (!patternTools.length) return;
      const combined = patternTools.length === 1 ? patternTools[0] : normalise(BufferGeometryUtils.mergeGeometries(patternTools, false)!);
      tools[f.id] = combined;

      const tb = boxOf(combined);
      const touched = bodies.filter((b) => boxOf(b.geometry).intersectsBox(tb));
      if (!touched.length) { errors[f.id] = 'no-intersection'; return; }
      for (const b of touched) {
        const op = isCut ? SUBTRACTION : ADDITION;
        const res = evaluator.evaluate(new Brush(b.geometry), new Brush(combined), op) as Brush;
        if (triCount(res.geometry) === 0) bodies.splice(bodies.indexOf(b), 1);
        else b.geometry = normalise(res.geometry);
      }
      return;
    }

    if (f.type === 'mirror') {
      const targetTool = tools[f.targetFeatureId];
      if (!targetTool) { errors[f.id] = 'target-missing'; return; }
      const targetFeature = doc.features.find((x) => x.id === f.targetFeatureId);
      const isCut = targetFeature && (targetFeature.type === 'hole' || targetFeature.type === 'thread' || ('operation' in targetFeature && targetFeature.operation === 'cut'));

      const scale = f.plane === 'YZ' ? new THREE.Vector3(-1, 1, 1) : f.plane === 'XZ' ? new THREE.Vector3(1, -1, 1) : new THREE.Vector3(1, 1, -1);
      const clone = targetTool.clone();
      clone.scale(scale.x, scale.y, scale.z);
      const mirrorTool = normalise(clone);
      tools[f.id] = mirrorTool;

      const tb = boxOf(mirrorTool);
      const touched = bodies.filter((b) => boxOf(b.geometry).intersectsBox(tb));
      if (!touched.length) { errors[f.id] = 'no-intersection'; return; }
      for (const b of touched) {
        const op = isCut ? SUBTRACTION : ADDITION;
        const res = evaluator.evaluate(new Brush(b.geometry), new Brush(mirrorTool), op) as Brush;
        if (triCount(res.geometry) === 0) bodies.splice(bodies.indexOf(b), 1);
        else b.geometry = normalise(res.geometry);
      }
      return;
    }

    const sf = sketches.get(f.sketchId);
    if (!sf) { errors[f.id] = 'sketch-missing'; return; }
    const regions = selectRegions(sf.sketch, f.regionKeys);
    if (!regions.length) { errors[f.id] = 'no-profile'; return; }

    let tool: THREE.BufferGeometry | null = null;
    // pad cut tools so their caps never coincide with body faces (see extrudeRegions)
    const pad = bodies.length > 0 && f.operation === 'cut' ? 1e-3 : 0;
    if (f.type === 'extrude') tool = extrudeRegions(sf.plane, regions, f.distance, f.direction, pad);
    else {
      const r = revolveRegions(sf.plane, sf.sketch, regions, f.axis, f.angle);
      if (r.error) errors[f.id] = r.error;
      tool = r.geometry;
    }
    if (!tool) { errors[f.id] = errors[f.id] || 'empty'; return; }
    tools[f.id] = tool;

    const op: Operation = f.operation === 'new' || bodies.length === 0 ? (f.operation === 'cut' || f.operation === 'intersect' ? f.operation : 'new') : f.operation;
    if (op === 'new') {
      bodies.push({ id: `body-${++bodySeq}`, name: `Body ${bodySeq}`, geometry: tool, featureId: f.id });
      return;
    }
    if (bodies.length === 0) { errors[f.id] = 'nothing-to-cut'; return; }
    const tb = boxOf(tool);
    const touched = bodies.filter((b) => boxOf(b.geometry).intersectsBox(tb));
    if (op === 'join') {
      if (!touched.length) { bodies.push({ id: `body-${++bodySeq}`, name: `Body ${bodySeq}`, geometry: tool, featureId: f.id }); return; }
      let acc = new Brush(tool);
      for (const b of touched) acc = evaluator.evaluate(acc, new Brush(b.geometry), ADDITION) as Brush;
      const keep = touched[0];
      keep.geometry = normalise(acc.geometry);
      for (const b of touched.slice(1)) bodies.splice(bodies.indexOf(b), 1);
      return;
    }
    if (!touched.length) { errors[f.id] = 'no-intersection'; return; }
    for (const b of touched) {
      const res = evaluator.evaluate(new Brush(b.geometry), new Brush(tool), op === 'cut' ? SUBTRACTION : INTERSECTION) as Brush;
      if (triCount(res.geometry) === 0) bodies.splice(bodies.indexOf(b), 1);
      else b.geometry = normalise(res.geometry);
    }
  });
  return { bodies, errors, tools };
}

// ───────────────────────────── doc helpers ─────────────────────────────

let fseq = 0;
export const featureId = (p: string) => `${p}-${Date.now().toString(36)}-${(++fseq).toString(36)}`;

export function nextName(doc: PartDoc, base: string) {
  let n = 1;
  while (doc.features.some((f) => f.name === `${base}${n}`)) n++;
  return `${base}${n}`;
}

export function newSketchFeature(doc: PartDoc, plane: PlaneFrame, planeLabel: string, baseName = 'Sketch'): SketchFeature {
  const id = featureId('sk');
  return { id, type: 'sketch', name: nextName(doc, baseName), plane, planeLabel, sketch: emptySketch(id, id), visible: true };
}

/** Features that depend on `id` (extrudes/revolves using a sketch). */
export function dependents(doc: PartDoc, id: string): Feature[] {
  return doc.features.filter((f) => ('sketchId' in f && f.sketchId === id) || ('targetFeatureId' in f && f.targetFeatureId === id));
}

/** Binary STL (mm) for one or more bodies. */
export function toBinarySTL(geoms: THREE.BufferGeometry[]): ArrayBuffer {
  const tris: number[][] = [];
  for (const g0 of geoms) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i += 3) tris.push([p.getX(i), p.getY(i), p.getZ(i), p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1), p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2)]);
  }
  const buf = new ArrayBuffer(84 + tris.length * 50);
  const dv = new DataView(buf);
  dv.setUint32(80, tris.length, true);
  let o = 84;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), nrm = new THREE.Vector3();
  for (const t of tris) {
    a.set(t[0], t[1], t[2]); b.set(t[3], t[4], t[5]); c.set(t[6], t[7], t[8]);
    nrm.subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b)).normalize();
    for (const v of [nrm.x, nrm.y, nrm.z, ...t]) { dv.setFloat32(o, v, true); o += 4; }
    dv.setUint16(o, 0, true); o += 2;
  }
  return buf;
}

/**
 * Feature (crease) edges of a triangle soup, robust to CSG T-junctions.
 * Triangle edges are grouped by the infinite line they lie on; along each line the
 * covering intervals are swept and a piece is kept only where faces with normals
 * differing by more than `thresholdDeg` meet. Coplanar seams (same normal on both
 * sides) and T-junction fragments therefore disappear; real outlines stay.
 * Returns a flat [x1,y1,z1,x2,y2,z2,...] array (mm).
 */
export function featureEdges(g: THREE.BufferGeometry, thresholdDeg = 25): Float32Array {
  const pos = g.getAttribute('position');
  const idx = g.getIndex();
  const n = idx ? idx.count : pos.count;
  const cosT = Math.cos((thresholdDeg * Math.PI) / 180);
  const Q = 1e4; // breakpoint rounding (0.1 µm)
  type Grp = { d: THREE.Vector3; p0: THREE.Vector3; iv: { t0: number; t1: number; nIdx: number }[] };
  const buckets = new Map<string, Grp[]>();
  const all: Grp[] = [];
  const DQ = 200; // direction bucket ≈ 0.005
  const PQ = 20; // offset bucket 0.05 mm
  const findGroup = (d: THREE.Vector3, p0: THREE.Vector3): Grp => {
    const fx = Math.floor(d.x * DQ), fy = Math.floor(d.y * DQ), fz = Math.floor(d.z * DQ);
    const gx = Math.floor(p0.x * PQ), gy = Math.floor(p0.y * PQ), gz = Math.floor(p0.z * PQ);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++)
      for (let u = -1; u <= 1; u++) for (let v = -1; v <= 1; v++) for (let w = -1; w <= 1; w++) {
        const list = buckets.get(`${fx + i},${fy + j},${fz + k}|${gx + u},${gy + v},${gz + w}`);
        if (!list) continue;
        for (const g0 of list) if (g0.d.dot(d) > 1 - 1e-7 && g0.p0.distanceTo(p0) < 2e-3) return g0;
      }
    const grp: Grp = { d, p0, iv: [] };
    const key = `${Math.floor(d.x * DQ)},${Math.floor(d.y * DQ)},${Math.floor(d.z * DQ)}|${gx},${gy},${gz}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(grp);
    all.push(grp);
    return grp;
  };
  const normals: THREE.Vector3[] = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const get = (i: number, v: THREE.Vector3) => v.fromBufferAttribute(pos, idx ? idx.getX(i) : i);
  for (let i = 0; i < n; i += 3) {
    get(i, a); get(i + 1, b); get(i + 2, c);
    const nrm = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    const len = nrm.length();
    if (len < 1e-12) continue;
    nrm.divideScalar(len);
    const nIdx = normals.push(nrm) - 1;
    const tri = [a.clone(), b.clone(), c.clone()];
    for (let k = 0; k < 3; k++) {
      const p = tri[k], q = tri[(k + 1) % 3];
      const d = new THREE.Vector3().subVectors(q, p);
      const L = d.length();
      if (L < 1e-9) continue;
      d.divideScalar(L);
      // canonical direction
      if (d.x < -1e-9 || (Math.abs(d.x) <= 1e-9 && (d.y < -1e-9 || (Math.abs(d.y) <= 1e-9 && d.z < 0)))) d.negate();
      const p0 = p.clone().addScaledVector(d, -p.dot(d));
      const grp = findGroup(d, p0);
      const t0 = p.dot(grp.d), t1 = q.dot(grp.d);
      grp.iv.push({ t0: Math.min(t0, t1), t1: Math.max(t0, t1), nIdx });
    }
  }
  const out: number[] = [];
  for (const grp of all) {
    if (grp.iv.length < 2) continue;
    const ts = [...new Set(grp.iv.flatMap((v) => [Math.round(v.t0 * Q) / Q, Math.round(v.t1 * Q) / Q]))].sort((x, y) => x - y);
    let runStart: number | null = null;
    const emit = (s: number, e: number) => {
      if (e - s < 1e-6) return;
      const A = grp.p0.clone().addScaledVector(grp.d, s), B = grp.p0.clone().addScaledVector(grp.d, e);
      out.push(A.x, A.y, A.z, B.x, B.y, B.z);
    };
    for (let i = 0; i < ts.length - 1; i++) {
      const m = (ts[i] + ts[i + 1]) / 2;
      const cover = grp.iv.filter((v) => v.t0 <= m + 1e-9 && v.t1 >= m - 1e-9).map((v) => normals[v.nIdx]);
      let crease = false;
      for (let x = 0; x < cover.length && !crease; x++) for (let y = x + 1; y < cover.length; y++) if (cover[x].dot(cover[y]) < cosT) { crease = true; break; }
      if (crease) { if (runStart === null) runStart = ts[i]; }
      else if (runStart !== null) { emit(runStart, ts[i]); runStart = null; }
    }
    if (runStart !== null) emit(runStart, ts[ts.length - 1]);
  }
  return new Float32Array(out);
}
