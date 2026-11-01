'use client';
/**
 * Part Studio 3D viewport (react-three-fiber, orthographic like Inventor/SolidWorks).
 *
 * Model mode: bodies + edges, origin planes, visible sketches.
 * Pick-plane mode: click an origin plane or a planar body face to start a sketch.
 * Sketch mode: drawing tools, snapping (points / midpoints / grid / H-V inference),
 *   drag-to-edit with live constraint solving, dimensions edited in place.
 * Feature mode: profile regions shown on the sketch plane (click to pick), live
 *   preview of the extrude / revolve tool body.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import { usePartStore, activeSketchFeature, type SketchTool } from './partStore';
import {
  type PartDoc, type RegenResult, type SketchFeature, type PlaneFrame,
  ORIGIN_PLANES, type OriginPlaneId, planeBasis, worldToSketch, planeFromFace, sketchToWorld, featureEdges,
} from './features';
import {
  type Sketch, type SkEntity, type SkConstraint, sampleEntity, distanceToEntity, addPoint, addPointEntity, addLine, addRectangle,
  addCircle, arcFrom3Points, skId, solveSketch, sketchBounds, ORIGIN_ID, arcSweep, mergePoints,
  trimEntity, filletCorner, chamferCorner, filletBetweenLines, chamferBetweenLines,
} from './sketch';
import { detectProfiles, regionAt, type ProfileRegion } from './profiles';
import { usePartColors, type PartColors } from './theme';
import { create } from 'zustand';

// ───────────────────────────── HUD (cursor readout, shared with the shell) ─────────────────────────────

export interface HudState {
  cursor: { x: number; y: number } | null;
  readout: string | null;
  snap: string | null;
  set: (p: Partial<Omit<HudState, 'set'>>) => void;
}
export const usePartHud = create<HudState>((set) => ({ cursor: null, readout: null, snap: null, set: (p) => set(p) }));

// ───────────────────────────── helpers ─────────────────────────────

const Z = { grid: -0.02, region: 0.01, entity: 0.03, point: 0.05, dim: 0.06 };
type P2 = { x: number; y: number };

function tri(points: P2[]): [number, number, number][] {
  return points.map((p) => [p.x, p.y, Z.entity] as [number, number, number]);
}

function regionShapeGeometry(r: ProfileRegion) {
  const shape = new THREE.Shape(r.outer.map((p) => new THREE.Vector2(p.x, p.y)));
  for (const h of r.holes) shape.holes.push(new THREE.Path(h.map((p) => new THREE.Vector2(p.x, p.y))));
  return new THREE.ShapeGeometry(shape);
}

/** Group placed on a sketch plane (local XY = sketch u,v). */
function OnPlane({ plane, children }: { plane: PlaneFrame; children: React.ReactNode }) {
  const m = useMemo(() => planeBasis(plane).matrix, [plane]);
  const ref = useRef<THREE.Group>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.matrix.copy(m);
    ref.current.matrixWorldNeedsUpdate = true;
  }, [m]);
  return (
    <group ref={ref} matrixAutoUpdate={false}>
      {children}
    </group>
  );
}

// ───────────────────────────── camera rig ─────────────────────────────

function CameraRig({ regen, sketchPlane }: { regen: RegenResult; sketchPlane: PlaneFrame | null }) {
  const { camera, size, controls } = useThree() as unknown as { camera: THREE.OrthographicCamera; size: { width: number; height: number }; controls: { target: THREE.Vector3; update: () => void } | null };
  const req = usePartStore((s) => s.viewRequest);
  const draft = usePartStore((s) => s.draft);
  const anim = useRef<{ t: number; fromPos: THREE.Vector3; toPos: THREE.Vector3; fromT: THREE.Vector3; toT: THREE.Vector3; fromUp: THREE.Vector3; toUp: THREE.Vector3; fromZ: number; toZ: number } | null>(null);

  useEffect(() => {
    const box = new THREE.Box3();
    regen.bodies.forEach((b) => { b.geometry.computeBoundingBox(); box.union(b.geometry.boundingBox!); });
    let dir = new THREE.Vector3(1, 0.8, 1).normalize();
    let up = new THREE.Vector3(0, 1, 0);
    let target = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
    let extent = box.isEmpty() ? 150 : Math.max(40, box.getSize(new THREE.Vector3()).length());
    switch (req.preset) {
      case 'front': dir = new THREE.Vector3(0, 0, 1); break;
      case 'top': dir = new THREE.Vector3(0, 1, 0); up = new THREE.Vector3(0, 0, -1); break;
      case 'right': dir = new THREE.Vector3(1, 0, 0); break;
      case 'normal': {
        if (!sketchPlane) break;
        const b = planeBasis(sketchPlane);
        dir = b.n.clone();
        up = b.y.clone();
        if (draft && draft.entities.length) {
          const bb = sketchBounds(draft);
          target = sketchToWorld(sketchPlane, (bb.minX + bb.maxX) / 2, (bb.minY + bb.maxY) / 2);
          extent = Math.max(60, Math.hypot(bb.maxX - bb.minX, bb.maxY - bb.minY) * 1.4);
        } else {
          target = b.o.clone();
          extent = Math.max(extent, 150);
        }
        break;
      }
      default: break;
    }
    const zoom = Math.min(size.width, size.height) / (extent * 1.15);
    anim.current = {
      t: 0,
      fromPos: camera.position.clone(), toPos: target.clone().addScaledVector(dir, 2000),
      fromT: controls?.target.clone() ?? new THREE.Vector3(), toT: target,
      fromUp: camera.up.clone(), toUp: up,
      fromZ: camera.zoom, toZ: zoom,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req.n]);

  useFrame((_, dt) => {
    const a = anim.current;
    if (!a) return;
    a.t = Math.min(1, a.t + dt / 0.35);
    const k = 1 - Math.pow(1 - a.t, 3);
    camera.position.lerpVectors(a.fromPos, a.toPos, k);
    camera.up.lerpVectors(a.fromUp, a.toUp, k).normalize();
    camera.zoom = a.fromZ + (a.toZ - a.fromZ) * k;
    camera.updateProjectionMatrix();
    if (controls) { controls.target.lerpVectors(a.fromT, a.toT, k); controls.update(); }
    camera.lookAt(controls?.target ?? a.toT);
    if (a.t >= 1) anim.current = null;
  });
  return null;
}

// ───────────────────────────── bodies ─────────────────────────────

function Bodies({ regen, colors, ghost, pickable, onPickFace }: { regen: RegenResult; colors: PartColors; ghost: boolean; pickable: boolean; onPickFace: (p: THREE.Vector3, n: THREE.Vector3) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <>
      {regen.bodies.map((b) => (
        <group key={b.id}>
          <mesh
            geometry={b.geometry}
            userData={{ isBody: true }}
            onPointerMove={pickable ? (e) => { e.stopPropagation(); setHover(b.id); } : undefined}
            onPointerOut={pickable ? () => setHover(null) : undefined}
            onClick={pickable ? (e) => {
              e.stopPropagation();
              if (!e.face) return;
              onPickFace(e.point.clone(), e.face.normal.clone());
            } : undefined}
          >
            <meshStandardMaterial
              color={pickable && hover === b.id ? colors.accent : colors.body}
              metalness={0.25}
              roughness={0.55}
              transparent={ghost}
              opacity={ghost ? 0.28 : 1}
              depthWrite={!ghost}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
              side={THREE.DoubleSide}
            />
          </mesh>
          <BodyEdges geometry={b.geometry} color={ghost ? colors.muted : colors.ink} />
        </group>
      ))}
    </>
  );
}

function BodyEdges({ geometry, color }: { geometry: THREE.BufferGeometry; color: string }) {
  const edges = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(featureEdges(geometry, 25), 3));
    return g;
  }, [geometry]);
  return (
    <lineSegments geometry={edges}>
      <lineBasicMaterial color={color} />
    </lineSegments>
  );
}

// ───────────────────────────── origin planes ─────────────────────────────

function OriginPlanes({ colors, pickable, isTr }: { colors: PartColors; pickable: boolean; isTr: boolean }) {
  const startSketch = usePartStore((s) => s.startSketch);
  const [hover, setHover] = useState<OriginPlaneId | null>(null);
  const S = 60;
  return (
    <>
      {(Object.keys(ORIGIN_PLANES) as OriginPlaneId[]).map((id) => {
        const pl = ORIGIN_PLANES[id];
        const active = hover === id;
        return (
          <OnPlane key={id} plane={pl}>
            <mesh
              position={[0, 0, 0]}
              onPointerMove={pickable ? (e) => {
                // a solid face under the cursor wins over the (transparent) datum plane
                if (e.intersections.some((i) => i.object.userData?.isBody)) { setHover((h) => (h === id ? null : h)); return; }
                e.stopPropagation(); setHover(id);
              } : undefined}
              onPointerOut={pickable ? () => setHover((h) => (h === id ? null : h)) : undefined}
              onClick={pickable ? (e) => {
                if (e.intersections.some((i) => i.object.userData?.isBody)) return;
                e.stopPropagation(); startSketch(pl, id);
              } : undefined}
            >
              <planeGeometry args={[S * 2, S * 2]} />
              <meshBasicMaterial color={colors.accent} transparent opacity={active ? 0.22 : pickable ? 0.08 : 0.035} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <Line points={[[-S, -S, 0], [S, -S, 0], [S, S, 0], [-S, S, 0], [-S, -S, 0]]} color={colors.accent} lineWidth={active ? 2 : 1} transparent opacity={pickable ? 0.9 : 0.35} />
            {(pickable || active) && (
              <Html position={[-S + 2, S - 2, 0]} style={{ pointerEvents: 'none' }}>
                <div className="whitespace-nowrap rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink)]">
                  {pl.label[isTr ? 'tr' : 'en']}
                </div>
              </Html>
            )}
          </OnPlane>
        );
      })}
      {/* origin triad */}
      <Line points={[[0, 0, 0], [25, 0, 0]]} color={colors.bad} lineWidth={2} />
      <Line points={[[0, 0, 0], [0, 25, 0]]} color={colors.ok} lineWidth={2} />
      <Line points={[[0, 0, 0], [0, 0, 25]]} color={colors.accent} lineWidth={2} />
    </>
  );
}

// ───────────────────────────── passive sketch display ─────────────────────────────

function SketchWire({ sk, colors, dim }: { sk: Sketch; colors: PartColors; dim?: boolean }) {
  return (
    <>
      {sk.entities.map((e) => (
        <Line key={e.id} points={tri(sampleEntity(sk, e, 96))} color={e.construction ? colors.warn : dim ? colors.muted : colors.accent} lineWidth={1.2} dashed={!!e.construction} dashSize={3} gapSize={2} />
      ))}
    </>
  );
}

// ───────────────────────────── feature mode: regions + preview ─────────────────────────────

function FeatureLayer({ doc, previewTool, colors }: { doc: PartDoc; previewTool: THREE.BufferGeometry | null; colors: PartColors }) {
  const fd = usePartStore((s) => s.featureDraft);
  const toggle = usePartStore((s) => s.toggleDraftRegion);
  if (!fd) return null;
  const isDirectTool = fd.feature.type === 'hole' || fd.feature.type === 'thread' || fd.feature.type === 'linearPattern' || fd.feature.type === 'circularPattern' || fd.feature.type === 'mirror';
  if (isDirectTool) {
    return previewTool ? (
      <mesh geometry={previewTool} renderOrder={2}>
        <meshStandardMaterial color={colors.bad} transparent opacity={0.55} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    ) : null;
  }
  const feat = fd.feature;
  const sketchId = 'sketchId' in feat ? feat.sketchId : undefined;
  const sf = sketchId ? (doc.features.find((f) => f.id === sketchId) as SketchFeature | undefined) : undefined;
  const prof = useMemo(() => (sf ? detectProfiles(sf.sketch) : null), [sf]);
  const regionGeoms = useMemo(() => (prof ? prof.regions.map((r) => ({ r, g: regionShapeGeometry(r) })) : []), [prof]);
  const autoGeoms = useMemo(() => (prof ? prof.auto.map((r) => ({ r, g: regionShapeGeometry(r) })) : []), [prof]);
  if (!sf || !prof) return null;
  const keys = 'regionKeys' in feat ? feat.regionKeys : [];
  const isCut = 'operation' in feat && feat.operation === 'cut';
  const fill = isCut ? colors.bad : colors.ok;
  return (
    <>
      <OnPlane plane={sf.plane}>
        <SketchWire sk={sf.sketch} colors={colors} />
        {keys.length === 0
          ? autoGeoms.map(({ r, g }) => (
              <mesh key={r.key} geometry={g} position={[0, 0, Z.region]}>
                <meshBasicMaterial color={fill} transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
              </mesh>
            ))
          : regionGeoms.map(({ r, g }) => (
              <mesh key={r.key} geometry={g} position={[0, 0, Z.region]}>
                <meshBasicMaterial color={keys.includes(r.key) ? fill : colors.muted} transparent opacity={keys.includes(r.key) ? 0.35 : 0.08} side={THREE.DoubleSide} depthWrite={false} />
              </mesh>
            ))}
        {/* region picking surface */}
        <mesh
          position={[0, 0, Z.region + 0.001]}
          onClick={(e) => {
            e.stopPropagation();
            const q = worldToSketch(sf.plane, e.point);
            const r = regionAt(prof, q);
            if (r) toggle(r.key);
          }}
        >
          <planeGeometry args={[100000, 100000]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </OnPlane>
      {previewTool && (
        <mesh geometry={previewTool} renderOrder={2}>
          <meshStandardMaterial color={fill} transparent opacity={0.45} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}
    </>
  );
}

// ───────────────────────────── sketch editor ─────────────────────────────

interface DragState {
  kind: 'point' | 'entity';
  id: string;
  start: P2;
  base: Sketch;
}

function entityPointIds(e: SkEntity): string[] {
  return e.type === 'line' ? [e.p1, e.p2] : e.type === 'circle' ? [e.c] : e.type === 'point' ? [e.p] : [e.c, e.p1, e.p2];
}

function SketchEditor({ colors, isTr, plane }: { colors: PartColors; isTr: boolean; plane: PlaneFrame }) {
  const { camera, gl } = useThree() as unknown as { camera: THREE.OrthographicCamera; gl: THREE.WebGLRenderer };
  const draft = usePartStore((s) => s.draft)!;
  const tool = usePartStore((s) => s.tool);
  const construction = usePartStore((s) => s.construction);
  const gridStep = usePartStore((s) => s.gridStep);
  const filletRadius = usePartStore((s) => s.filletRadius);
  const chamferDistance = usePartStore((s) => s.chamferDistance);
  const selection = usePartStore((s) => s.selection);
  const { commitDraft, previewDraft, beginDrag, setSelection } = usePartStore.getState();
  const hudSet = usePartHud((s) => s.set);

  const [cursor, setCursor] = useState<P2 | null>(null);
  const [snapInfo, setSnapInfo] = useState<{ kind: 'point' | 'mid' | 'grid' | 'none'; pointId?: string; hv?: 'H' | 'V' } | null>(null);
  const [clicks, setClicks] = useState<{ p: P2; id?: string }[]>([]);
  const [chainFrom, setChainFrom] = useState<{ p: P2; id?: string } | null>(null);
  const [dimPick, setDimPick] = useState<string | null>(null); // first point id for point-point dims
  const [dimCenterlinePick, setDimCenterlinePick] = useState<string | null>(null); // centerline line id for diametric dims
  const [twoLinePick, setTwoLinePick] = useState<string | null>(null); // first line for fillet/chamfer
  const [editingDim, setEditingDim] = useState<string | null>(null);
  const drag = useRef<DragState | null>(null);
  const [zoom, setZoom] = useState(camera.zoom);

  useFrame(() => { if (Math.abs(camera.zoom - zoom) / zoom > 0.02) setZoom(camera.zoom); });
  const tol = 9 / zoom; // ~9 px in mm

  // reset transient state when tool changes
  useEffect(() => { setClicks([]); setChainFrom(null); setDimPick(null); setDimCenterlinePick(null); setTwoLinePick(null); }, [tool]);

  // keyboard: Esc aborts current operation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input,textarea,select')) return;
      if (e.key === 'Escape') {
        if (clicks.length || chainFrom || dimPick || dimCenterlinePick || twoLinePick) {
          setClicks([]); setChainFrom(null); setDimPick(null); setDimCenterlinePick(null); setTwoLinePick(null); e.stopPropagation();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [clicks.length, chainFrom, dimPick]);

  const anchor: P2 | null = useMemo(() => {
    if (tool === 'line' && chainFrom) return chainFrom.id && draft.points[chainFrom.id] ? draft.points[chainFrom.id] : chainFrom.p;
    if (clicks.length) return clicks[0].p;
    return null;
  }, [tool, chainFrom, clicks, draft.points]);

  const snap = (raw: P2, exclude?: Set<string>) => {
    let best: { d: number; p: P2; id?: string; kind: 'point' | 'mid' } | null = null;
    for (const p of Object.values(draft.points)) {
      if (exclude?.has(p.id)) continue;
      const d = Math.hypot(p.x - raw.x, p.y - raw.y);
      if (d < tol && (!best || d < best.d)) best = { d, p: { x: p.x, y: p.y }, id: p.id, kind: 'point' };
    }
    if (!best) {
      for (const e of draft.entities) {
        if (e.type !== 'line') continue;
        const a = draft.points[e.p1], b = draft.points[e.p2];
        if (exclude?.has(e.p1) || exclude?.has(e.p2)) continue;
        const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const d = Math.hypot(m.x - raw.x, m.y - raw.y);
        if (d < tol && (!best || d < best.d)) best = { d, p: m, kind: 'mid' };
      }
    }
    if (best) return { p: best.p, id: best.id, kind: best.kind as 'point' | 'mid', hv: undefined as 'H' | 'V' | undefined };
    let p = gridStep > 0 ? { x: Math.round(raw.x / gridStep) * gridStep, y: Math.round(raw.y / gridStep) * gridStep } : { ...raw };
    let hv: 'H' | 'V' | undefined;
    if (anchor && (tool === 'line')) {
      if (Math.abs(raw.y - anchor.y) < tol * 0.8) { p = { x: p.x, y: anchor.y }; hv = 'H'; }
      else if (Math.abs(raw.x - anchor.x) < tol * 0.8) { p = { x: anchor.x, y: p.y }; hv = 'V'; }
    }
    return { p, id: undefined, kind: gridStep > 0 ? ('grid' as const) : ('none' as const), hv };
  };

  const hitPoint = (q: P2) => {
    let best: { id: string; d: number } | null = null;
    for (const p of Object.values(draft.points)) {
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < tol && (!best || d < best.d)) best = { id: p.id, d };
    }
    return best?.id ?? null;
  };
  const hitEntity = (q: P2) => {
    let best: { id: string; d: number } | null = null;
    for (const e of draft.entities) {
      const d = distanceToEntity(draft, e, q);
      if (d < tol && (!best || d < best.d)) best = { id: e.id, d };
    }
    return best?.id ?? null;
  };

  const toSketch = (e: ThreeEvent<PointerEvent>): P2 => worldToSketch(plane, e.point);

  const ensurePoint = (s: Sketch, p: P2, id?: string) => {
    if (id && s.points[id]) return { sketch: s, id };
    const r = addPoint(s, p.x, p.y);
    return { sketch: r.sketch, id: r.id };
  };

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const raw = toSketch(e);
    const d = drag.current;
    if (d) {
      e.stopPropagation();
      const dx = raw.x - d.start.x, dy = raw.y - d.start.y;
      const s = JSON.parse(JSON.stringify(d.base)) as Sketch;
      let locked: Set<string>;

      // Check if dragging an un-deformable dynamic block
      const blkId = d.kind === 'point'
        ? d.base.points[d.id]?.blockInstanceId
        : d.base.entities.find((x) => x.id === d.id)?.blockInstanceId;

      if (blkId) {
        // Move ALL points belonging to this dynamic block rigidly together
        const blockPointIds = Object.keys(d.base.points).filter(
          (k) => d.base.points[k]?.blockInstanceId === blkId
        );
        for (const pid of blockPointIds) {
          s.points[pid].x = d.base.points[pid].x + dx;
          s.points[pid].y = d.base.points[pid].y + dy;
        }
        locked = new Set(blockPointIds);
      } else if (d.kind === 'point') {
        const sn = snap(raw, new Set([d.id]));
        s.points[d.id].x = sn.p.x; s.points[d.id].y = sn.p.y;
        locked = new Set([d.id]);
      } else {
        const ent = s.entities.find((x) => x.id === d.id)!;
        const ids = entityPointIds(ent);
        for (const pid of ids) if (!s.points[pid].fixed) { s.points[pid].x = d.base.points[pid].x + dx; s.points[pid].y = d.base.points[pid].y + dy; }
        locked = new Set(ids);
      }
      previewDraft(solveSketch(s, { locked, iterations: 80 }).sketch);
      hudSet({ cursor: raw });
      return;
    }
    const sn = snap(raw);
    setCursor(sn.p);
    setSnapInfo({ kind: sn.kind, pointId: sn.id, hv: sn.hv });
    let readout: string | null = null;
    if (anchor && (tool === 'line')) {
      const L = Math.hypot(sn.p.x - anchor.x, sn.p.y - anchor.y);
      const a = (Math.atan2(sn.p.y - anchor.y, sn.p.x - anchor.x) * 180) / Math.PI;
      readout = `L ${L.toFixed(2)} mm · ∠ ${a.toFixed(1)}°`;
    } else if (anchor && tool === 'rect') readout = `${Math.abs(sn.p.x - anchor.x).toFixed(2)} × ${Math.abs(sn.p.y - anchor.y).toFixed(2)} mm`;
    else if (anchor && tool === 'circle') readout = `Ø ${(2 * Math.hypot(sn.p.x - anchor.x, sn.p.y - anchor.y)).toFixed(2)} mm`;
    hudSet({ cursor: sn.p, readout, snap: sn.kind === 'point' ? (sn.id === ORIGIN_ID ? 'origin' : 'point') : sn.kind === 'mid' ? 'mid' : sn.hv ?? null });
  };

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const raw = toSketch(e);
    const sn = snap(raw);
    const s0 = draft;

    if (tool === 'select') {
      const pid = hitPoint(raw);
      const eid = pid ? null : hitEntity(raw);
      if (pid && pid !== ORIGIN_ID) {
        const pt = s0.points[pid];
        const blkId = pt?.blockInstanceId;
        if (blkId) {
          const blockEntIds = s0.entities.filter((x) => x.blockInstanceId === blkId).map((x) => x.id);
          setSelection(blockEntIds);
        } else {
          setSelection([`pt:${pid}`]);
        }
        beginDrag();
        drag.current = { kind: 'point', id: pid, start: raw, base: s0 };
        (gl.domElement as HTMLElement).setPointerCapture?.(e.pointerId);
      } else if (eid) {
        const ent = s0.entities.find((x) => x.id === eid);
        const blkId = ent?.blockInstanceId;
        const add = e.shiftKey || e.ctrlKey || e.metaKey;
        if (blkId) {
          const blockEntIds = s0.entities.filter((x) => x.blockInstanceId === blkId).map((x) => x.id);
          setSelection(add ? [...new Set([...selection, ...blockEntIds])] : blockEntIds);
        } else {
          setSelection(add ? (selection.includes(eid) ? selection.filter((x) => x !== eid) : [...selection, eid]) : [eid]);
        }
        beginDrag();
        drag.current = { kind: 'entity', id: eid, start: raw, base: s0 };
      } else setSelection([]);
      return;
    }

    if (tool === 'point') {
      const res = addPointEntity(s0, sn.p.x, sn.p.y, construction);
      commitDraft(res.sketch, { solve: false });
      return;
    }

    if (tool === 'trim') {
      const eid = hitEntity(raw);
      if (eid) {
        const res = trimEntity(s0, eid, raw);
        if (res.success) {
          commitDraft(res.sketch, { solve: false });
        }
      }
      return;
    }

    if (tool === 'fillet') {
      const pid = hitPoint(raw);
      if (pid) {
        const res = filletCorner(s0, pid, filletRadius);
        if (res.success) {
          commitDraft(res.sketch);
        }
        return;
      }
      const eid = hitEntity(raw);
      if (eid) {
        if (!twoLinePick) {
          setTwoLinePick(eid);
        } else if (twoLinePick !== eid) {
          const res = filletBetweenLines(s0, twoLinePick, eid, filletRadius);
          setTwoLinePick(null);
          if (res.success) {
            commitDraft(res.sketch);
          }
        }
      }
      return;
    }

    if (tool === 'chamfer') {
      const pid = hitPoint(raw);
      if (pid) {
        const res = chamferCorner(s0, pid, chamferDistance);
        if (res.success) {
          commitDraft(res.sketch);
        }
        return;
      }
      const eid = hitEntity(raw);
      if (eid) {
        if (!twoLinePick) {
          setTwoLinePick(eid);
        } else if (twoLinePick !== eid) {
          const res = chamferBetweenLines(s0, twoLinePick, eid, chamferDistance);
          setTwoLinePick(null);
          if (res.success) {
            commitDraft(res.sketch);
          }
        }
      }
      return;
    }

    if (tool === 'dimension') {
      const eid = hitEntity(raw);
      const pid = hitPoint(raw);

      // Check if user clicked a Centerline line
      const hitCenterline = eid ? s0.entities.find((x) => x.id === eid && x.type === 'line' && (x as any).centerline) : null;

      // 1. If dimPick is active (user previously picked a point) and now clicks a Centerline:
      if (dimPick && hitCenterline) {
        const l = hitCenterline as Extract<SkEntity, { type: 'line' }>;
        const a = s0.points[l.p1], b = s0.points[l.p2];
        const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const pt = s0.points[dimPick];
        if (pt) {
          const perpDist = Math.abs((b.x - a.x) * (a.y - pt.y) - (a.x - pt.x) * (b.y - pt.y)) / L;
          const c: SkConstraint = {
            id: skId('D'),
            type: 'diameter_dim',
            centerline: l.id,
            point: dimPick,
            value: Math.round(perpDist * 2000) / 1000,
          };
          commitDraft({ ...s0, constraints: [...s0.constraints, c] });
          setDimPick(null);
          setEditingDim(c.id);
          return;
        }
      }

      // 2. If dimCenterlinePick is active (user clicked Centerline first):
      if (dimCenterlinePick) {
        const l = s0.entities.find((x) => x.id === dimCenterlinePick && x.type === 'line') as Extract<SkEntity, { type: 'line' }> | undefined;
        if (l) {
          const a = s0.points[l.p1], b = s0.points[l.p2];
          const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
          const targetPtId = pid || (eid ? (s0.entities.find((x) => x.id === eid)?.type === 'line' ? (s0.entities.find((x) => x.id === eid) as any).p1 : null) : null);
          const pt = targetPtId ? s0.points[targetPtId] : null;
          if (pt && targetPtId !== l.p1 && targetPtId !== l.p2) {
            const perpDist = Math.abs((b.x - a.x) * (a.y - pt.y) - (a.x - pt.x) * (b.y - pt.y)) / L;
            const c: SkConstraint = {
              id: skId('D'),
              type: 'diameter_dim',
              centerline: l.id,
              point: targetPtId!,
              value: Math.round(perpDist * 2000) / 1000,
            };
            commitDraft({ ...s0, constraints: [...s0.constraints, c] });
            setDimCenterlinePick(null);
            setEditingDim(c.id);
            return;
          }
        }
        if (hitCenterline && hitCenterline.id === dimCenterlinePick) {
          setDimCenterlinePick(null);
          return;
        }
      }

      // 3. User clicks Centerline line (first pick for diametric dimension):
      if (hitCenterline && !dimPick) {
        setDimCenterlinePick(hitCenterline.id);
        hudSet({ readout: isTr ? 'Eksen seçildi — Çap ölçüsü (Ø) için bir noktaya veya kenara tıklayın' : 'Centerline selected — click a point or edge for diametric dimension (Ø)' });
        return;
      }

      if (pid) {
        if (!dimPick) { setDimPick(pid); return; }
        if (dimPick === pid) { setDimPick(null); return; }
        const a = s0.points[dimPick], b = s0.points[pid];
        if (a?.blockInstanceId && b?.blockInstanceId && a.blockInstanceId === b.blockInstanceId) {
          hudSet({ readout: isTr ? 'Bloğun iç ölçüleri sabittir (blok ile dış noktalar/orijin arasına ölçü verin)' : 'Block internal shape is fixed (dimension to external points/origin)' });
          setDimPick(null);
          return;
        }
        const horiz = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
        const c: SkConstraint = { id: skId('D'), type: horiz ? 'dx' : 'dy', a: dimPick, b: pid, value: Math.round((horiz ? b.x - a.x : b.y - a.y) * 1000) / 1000 };
        commitDraft({ ...s0, constraints: [...s0.constraints, c] });
        setDimPick(null);
        setEditingDim(c.id);
        return;
      }
      if (eid) {
        const ent = s0.entities.find((x) => x.id === eid)!;
        if (ent.blockInstanceId) {
          hudSet({ readout: isTr ? 'Bloğun elemanlarına nokta-nokta (orijine veya dış çizgilere) ölçü verin' : 'Dimension block vertices to origin or external geometry' });
          return;
        }
        let c: SkConstraint;
        if (ent.type === 'line') {
          const a = s0.points[ent.p1], b = s0.points[ent.p2];
          c = { id: skId('D'), type: 'length', line: eid, value: Math.round(Math.hypot(b.x - a.x, b.y - a.y) * 1000) / 1000 };
        } else if (ent.type === 'circle') c = { id: skId('D'), type: 'diameter', entity: eid, value: Math.round(ent.r * 2000) / 1000 };
        else if (ent.type === 'arc') c = { id: skId('D'), type: 'radius', entity: eid, value: Math.round(arcSweep(s0, ent).r * 1000) / 1000 };
        else return;
        const existing = s0.constraints.find((k) => (k.type === 'length' && c.type === 'length' && k.line === eid) || ((k.type === 'diameter' || k.type === 'radius') && (c.type === 'diameter' || c.type === 'radius') && k.entity === eid));
        if (existing) { setEditingDim(existing.id); return; }
        commitDraft({ ...s0, constraints: [...s0.constraints, c] });
        setEditingDim(c.id);
      }
      return;
    }

    if (tool === 'line') {
      if (!chainFrom) { setChainFrom({ p: sn.p, id: sn.id }); return; }
      const st = ensurePoint(s0, chainFrom.p, chainFrom.id);
      const startId = st.id;
      const r = ensurePoint(st.sketch, sn.p, sn.id);
      if (r.id === startId || Math.hypot(sn.p.x - (st.sketch.points[startId]?.x ?? 0), sn.p.y - (st.sketch.points[startId]?.y ?? 0)) < 1e-9) return;
      let s = r.sketch;
      const isCl = usePartStore.getState().centerline;
      const l = addLine(s, startId, r.id, construction, isCl);
      s = l.sketch;
      // relation inferred while drawing, or exact alignment when snapping onto an existing point
      let hv = sn.hv;
      if (!hv && l.ids[0]) {
        const pa = s.points[startId], pb = s.points[r.id];
        if (Math.abs(pa.y - pb.y) < 1e-6) hv = 'H';
        else if (Math.abs(pa.x - pb.x) < 1e-6) hv = 'V';
      }
      if (hv && l.ids[0]) s = { ...s, constraints: [...s.constraints, { id: skId(hv), type: hv === 'H' ? 'horizontal' : 'vertical', line: l.ids[0] }] };
      commitDraft(s, { solve: !!hv });
      // hitting an existing point closes / ends the chain
      setChainFrom(sn.id && sn.id !== startId ? null : { p: s.points[r.id], id: r.id });
      return;
    }

    if (tool === 'rect') {
      if (!clicks.length) { setClicks([{ p: sn.p, id: sn.id }]); return; }
      const a = clicks[0].p;
      if (Math.abs(sn.p.x - a.x) < 1e-6 || Math.abs(sn.p.y - a.y) < 1e-6) return;
      commitDraft(addRectangle(s0, a, sn.p, construction).sketch);
      setClicks([]);
      return;
    }

    if (tool === 'circle') {
      if (!clicks.length) { setClicks([{ p: sn.p, id: sn.id }]); return; }
      const c = clicks[0];
      const r = Math.hypot(sn.p.x - c.p.x, sn.p.y - c.p.y);
      if (r < 1e-6) return;
      commitDraft(addCircle(s0, c.p, r, construction, c.id && s0.points[c.id] ? c.id : undefined).sketch, { solve: false });
      setClicks([]);
      return;
    }

    if (tool === 'arc') {
      if (clicks.length < 2) { setClicks([...clicks, { p: sn.p, id: sn.id }]); return; }
      const [A, B] = clicks;
      const arc = arcFrom3Points(A.p, B.p, sn.p);
      if (!arc) return;
      let s = s0;
      const ra = ensurePoint(s, A.p, A.id); s = ra.sketch;
      const rb = ensurePoint(s, B.p, B.id); s = rb.sketch;
      const rc = addPoint(s, arc.cx, arc.cy); s = rc.sketch;
      const id = skId('A');
      const ent: SkEntity = arc.ccw ? { id, type: 'arc', c: rc.id, p1: ra.id, p2: rb.id, construction } : { id, type: 'arc', c: rc.id, p1: rb.id, p2: ra.id, construction };
      commitDraft({ ...s, entities: [...s.entities, ent] });
      setClicks([]);
    }
  };

  const onUp = (e: ThreeEvent<PointerEvent>) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    (gl.domElement as HTMLElement).releasePointerCapture?.(e.pointerId);
    const cur = usePartStore.getState().draft!;
    const moved = JSON.stringify(cur.points) !== JSON.stringify(d.base.points);
    if (!moved) { usePartStore.setState({ draft: d.base }); return; }
    // merge onto an existing point when a dragged point lands on one (coincident)
    if (d.kind === 'point') {
      const p = cur.points[d.id];
      const other = Object.values(cur.points).find((q) => q.id !== d.id && Math.hypot(q.x - p.x, q.y - p.y) < 1e-6);
      if (other) {
        commitDraft(mergePoints(cur, d.id, other.id));
        return;
      }
    }
    commitDraft(cur);
  };

  // double-click with line tool ends the chain
  const onDouble = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); setChainFrom(null); setClicks([]); };

  const selected = new Set(selection);
  const selPoints = new Set(selection.filter((s) => s.startsWith('pt:')).map((s) => s.slice(3)));

  // rubber band preview
  let preview: React.ReactNode = null;
  if (cursor && anchor) {
    const col = construction ? colors.warn : colors.accent;
    if (tool === 'line') preview = <Line points={tri([anchor, cursor])} color={col} lineWidth={1.5} dashed dashSize={2} gapSize={1.5} />;
    if (tool === 'rect') preview = <Line points={tri([anchor, { x: cursor.x, y: anchor.y }, cursor, { x: anchor.x, y: cursor.y }, anchor])} color={col} lineWidth={1.5} dashed dashSize={2} gapSize={1.5} />;
    if (tool === 'circle') {
      const r = Math.hypot(cursor.x - anchor.x, cursor.y - anchor.y);
      preview = <Line points={tri(Array.from({ length: 97 }, (_, i) => ({ x: anchor.x + r * Math.cos((i / 96) * 2 * Math.PI), y: anchor.y + r * Math.sin((i / 96) * 2 * Math.PI) })))} color={col} lineWidth={1.5} dashed dashSize={2} gapSize={1.5} />;
    }
    if (tool === 'arc') {
      if (clicks.length === 1) preview = <Line points={tri([clicks[0].p, cursor])} color={col} lineWidth={1} dashed dashSize={2} gapSize={1.5} />;
      if (clicks.length === 2) {
        const arc = arcFrom3Points(clicks[0].p, clicks[1].p, cursor);
        if (arc) {
          const a1 = Math.atan2(clicks[0].p.y - arc.cy, clicks[0].p.x - arc.cx);
          const a2 = Math.atan2(clicks[1].p.y - arc.cy, clicks[1].p.x - arc.cx);
          const r = Math.hypot(clicks[0].p.x - arc.cx, clicks[0].p.y - arc.cy);
          let s = arc.ccw ? a1 : a2, t = arc.ccw ? a2 : a1;
          while (t <= s) t += 2 * Math.PI;
          preview = <Line points={tri(Array.from({ length: 49 }, (_, i) => { const u = s + ((t - s) * i) / 48; return { x: arc.cx + r * Math.cos(u), y: arc.cy + r * Math.sin(u) }; }))} color={col} lineWidth={1.5} dashed dashSize={2} gapSize={1.5} />;
        }
      }
    }
  }

  const pointsGeom = useMemo(() => {
    const ids = Object.keys(draft.points);
    const arr = new Float32Array(ids.length * 3);
    ids.forEach((id, i) => { arr[i * 3] = draft.points[id].x; arr[i * 3 + 1] = draft.points[id].y; arr[i * 3 + 2] = Z.point; });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return g;
  }, [draft.points]);

  const bounds = sketchBounds(draft);
  const ext = Math.max(500, Math.abs(bounds.minX), Math.abs(bounds.maxX), Math.abs(bounds.minY), Math.abs(bounds.maxY)) * 4;

  return (
    <OnPlane plane={plane}>
      <GridLines step={gridStep > 0 ? gridStep : 5} zoom={zoom} center={{ x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 }} colors={colors} />
      <Line points={[[-ext, 0, Z.grid / 2], [ext, 0, Z.grid / 2]]} color={colors.bad} lineWidth={1} transparent opacity={0.6} />
      <Line points={[[0, -ext, Z.grid / 2], [0, ext, Z.grid / 2]]} color={colors.ok} lineWidth={1} transparent opacity={0.6} />

      {/* event catcher */}
      <mesh onPointerMove={onMove} onPointerDown={onDown} onPointerUp={onUp} onDoubleClick={onDouble} onPointerLeave={() => { setCursor(null); hudSet({ cursor: null, readout: null, snap: null }); }}>
        <planeGeometry args={[ext * 4, ext * 4]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* entities */}
      {draft.entities.map((e) => {
        const sel = selected.has(e.id);
        const isCl = e.type === 'line' && !!(e as any).centerline;
        const isClPicked = dimCenterlinePick === e.id;
        const col = sel ? colors.warn : isClPicked ? colors.accent : isCl ? colors.cyan : e.construction ? colors.warn : colors.ink;
        const lw = sel || isClPicked ? 2.8 : isCl ? 2 : 1.8;
        const dashed = isCl || !!e.construction;
        const dashSize = isCl ? 6 : 3;
        const gapSize = isCl ? 2.5 : 2;
        return <Line key={e.id} points={tri(sampleEntity(draft, e, 96))} color={sel ? colors.accent : col} lineWidth={lw} dashed={dashed} dashSize={dashSize} gapSize={gapSize} />;
      })}

      {/* points (constant pixel size) */}
      <points geometry={pointsGeom}>
        <pointsMaterial color={colors.accent} size={7} sizeAttenuation={false} />
      </points>
      {[...selPoints].map((pid) => draft.points[pid] && (
        <mesh key={pid} position={[draft.points[pid].x, draft.points[pid].y, Z.point + 0.001]}>
          <circleGeometry args={[6 / zoom, 16]} />
          <meshBasicMaterial color={colors.warn} />
        </mesh>
      ))}

      {/* dimensions + relations */}
      <Dimensions sk={draft} colors={colors} zoom={zoom} editingId={editingDim} setEditingId={setEditingDim} isTr={isTr} />

      {preview}

      {/* snap marker */}
      {cursor && (tool !== 'select') && (
        <group position={[cursor.x, cursor.y, Z.dim]}>
          <mesh>
            <ringGeometry args={[4 / zoom, 6 / zoom, 20]} />
            <meshBasicMaterial color={snapInfo?.kind === 'point' || snapInfo?.kind === 'mid' ? colors.ok : colors.accent} />
          </mesh>
          {snapInfo?.hv && (
            <Html position={[10 / zoom, 10 / zoom, 0]} style={{ pointerEvents: 'none' }}>
              <span className="rounded-[var(--radius-s)] bg-[var(--bg-1)] px-1 font-mono text-[10px] font-bold text-[var(--ok)] border border-[var(--line)]">{snapInfo.hv}</span>
            </Html>
          )}
        </group>
      )}
      {dimPick && draft.points[dimPick] && (
        <mesh position={[draft.points[dimPick].x, draft.points[dimPick].y, Z.dim]}>
          <ringGeometry args={[5 / zoom, 8 / zoom, 20]} />
          <meshBasicMaterial color={colors.warn} />
        </mesh>
      )}
    </OnPlane>
  );
}

/** Sketch grid: minor lines adapt so they are never denser than ~8 px; every 10th is a major line. */
function GridLines({ step, zoom, center, colors }: { step: number; zoom: number; center: P2; colors: PartColors }) {
  const geoms = useMemo(() => {
    const seq = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    const s = seq.find((v) => v >= step && v * zoom >= 8) ?? 1000;
    const major = s * 10;
    const half = Math.max(400, 1400 / zoom);
    const cx = Math.round(center.x / major) * major, cy = Math.round(center.y / major) * major;
    const minor: number[] = [], maj: number[] = [];
    const n = Math.ceil(half / s);
    for (let i = -n; i <= n; i++) {
      const x = cx + i * s, y = cy + i * s;
      const isMajX = Math.abs(Math.round(x / major) * major - x) < 1e-6;
      const isMajY = Math.abs(Math.round(y / major) * major - y) < 1e-6;
      (isMajX ? maj : minor).push(x, cy - half, Z.grid, x, cy + half, Z.grid);
      (isMajY ? maj : minor).push(cx - half, y, Z.grid, cx + half, y, Z.grid);
    }
    const mk = (arr: number[]) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); return g; };
    return { minor: mk(minor), major: mk(maj) };
    // re-grid only on meaningful zoom changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, Math.round(Math.log2(zoom) * 4), Math.round(center.x / 100), Math.round(center.y / 100)]);
  return (
    <>
      <lineSegments geometry={geoms.minor}><lineBasicMaterial color={colors.line} transparent opacity={0.55} depthWrite={false} /></lineSegments>
      <lineSegments geometry={geoms.major}><lineBasicMaterial color={colors.muted} transparent opacity={0.45} depthWrite={false} /></lineSegments>
    </>
  );
}

function Dimensions({ sk, colors, zoom, editingId, setEditingId, isTr }: { sk: Sketch; colors: PartColors; zoom: number; editingId: string | null; setEditingId: (id: string | null) => void; isTr: boolean }) {
  const commitDraft = usePartStore((s) => s.commitDraft);
  const off = 18 / zoom;
  const items: React.ReactNode[] = [];
  const label = (c: SkConstraint, pos: P2, text: string) => (
    <Html key={`lbl-${c.id}`} position={[pos.x, pos.y, Z.dim]} center zIndexRange={[20, 0]}>
      {editingId === c.id ? (
        <DimInput
          initial={'value' in c ? c.value : 0}
          allowNegative={c.type === 'dx' || c.type === 'dy'}
          onDone={(v) => {
            setEditingId(null);
            if (v === null || !('value' in c)) return;
            const next = { ...sk, constraints: sk.constraints.map((k) => (k.id === c.id ? ({ ...k, value: v } as SkConstraint) : k)) };
            commitDraft(next);
          }}
        />
      ) : (
        <button
          type="button"
          onDoubleClick={(e) => { e.stopPropagation(); setEditingId(c.id); }}
          onClick={(e) => { e.stopPropagation(); setEditingId(c.id); }}
          onContextMenu={(e) => { e.preventDefault(); commitDraft({ ...sk, constraints: sk.constraints.filter((k) => k.id !== c.id) }); }}
          title={isTr ? 'Tıkla: değeri düzenle · Sağ tık: ölçüyü sil' : 'Click: edit value · Right-click: delete dimension'}
          className="whitespace-nowrap rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] px-1 font-mono text-[11px] text-[var(--ink)] hover:border-[var(--cyan)]"
        >
          {text}
        </button>
      )}
    </Html>
  );
  for (const c of sk.constraints) {
    if (c.type === 'length') {
      const l = sk.entities.find((e) => e.id === c.line);
      if (!l || l.type !== 'line') continue;
      const a = sk.points[l.p1], b = sk.points[l.p2];
      const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const nx = -(b.y - a.y) / L, ny = (b.x - a.x) / L;
      const a2 = { x: a.x + nx * off, y: a.y + ny * off }, b2 = { x: b.x + nx * off, y: b.y + ny * off };
      items.push(<Line key={c.id} points={[[a.x, a.y, Z.dim], [a2.x, a2.y, Z.dim], [b2.x, b2.y, Z.dim], [b.x, b.y, Z.dim]]} color={colors.muted} lineWidth={1} />);
      items.push(label(c, { x: (a2.x + b2.x) / 2, y: (a2.y + b2.y) / 2 }, fmt(c.value)));
    } else if (c.type === 'dx' || c.type === 'dy') {
      const a = sk.points[c.a], b = sk.points[c.b];
      if (!a || !b) continue;
      if (c.type === 'dx') {
        const y = Math.min(a.y, b.y) - off;
        items.push(<Line key={c.id} points={[[a.x, a.y, Z.dim], [a.x, y, Z.dim], [b.x, y, Z.dim], [b.x, b.y, Z.dim]]} color={colors.muted} lineWidth={1} />);
        items.push(label(c, { x: (a.x + b.x) / 2, y }, fmt(c.value)));
      } else {
        const x = Math.max(a.x, b.x) + off;
        items.push(<Line key={c.id} points={[[a.x, a.y, Z.dim], [x, a.y, Z.dim], [x, b.y, Z.dim], [b.x, b.y, Z.dim]]} color={colors.muted} lineWidth={1} />);
        items.push(label(c, { x, y: (a.y + b.y) / 2 }, fmt(c.value)));
      }
    } else if (c.type === 'diameter' || c.type === 'radius') {
      const e = sk.entities.find((x) => x.id === c.entity);
      if (!e || e.type === 'line' || e.type === 'point') continue;
      const ctr = sk.points[e.c];
      const r = e.type === 'circle' ? e.r : arcSweep(sk, e).r;
      const p = { x: ctr.x + r * Math.SQRT1_2, y: ctr.y + r * Math.SQRT1_2 };
      const q = { x: p.x + off, y: p.y + off };
      items.push(<Line key={c.id} points={[[ctr.x, ctr.y, Z.dim], [q.x, q.y, Z.dim]]} color={colors.muted} lineWidth={1} />);
      items.push(label(c, q, `${c.type === 'diameter' ? 'Ø' : 'R'}${fmt(c.value)}`));
    } else if (c.type === 'diameter_dim') {
      const l = sk.entities.find((e) => e.id === c.centerline);
      const pt = sk.points[c.point];
      if (!l || l.type !== 'line' || !pt) continue;
      const a = sk.points[l.p1], b = sk.points[l.p2];
      const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const dx = (b.x - a.x) / L, dy = (b.y - a.y) / L;
      const t = (pt.x - a.x) * dx + (pt.y - a.y) * dy;
      const proj = { x: a.x + t * dx, y: a.y + t * dy };
      const mirror = { x: 2 * proj.x - pt.x, y: 2 * proj.y - pt.y };
      const nx = -dy, ny = dx;
      const tick = 4 / zoom;
      items.push(<Line key={`ext-${c.id}`} points={[[mirror.x, mirror.y, Z.dim], [pt.x, pt.y, Z.dim]]} color={colors.cyan} lineWidth={1.2} dashed dashSize={2} gapSize={1.5} />);
      items.push(<Line key={`t1-${c.id}`} points={[[pt.x - nx * tick, pt.y - ny * tick, Z.dim], [pt.x + nx * tick, pt.y + ny * tick, Z.dim]]} color={colors.cyan} lineWidth={1.2} />);
      items.push(<Line key={`t2-${c.id}`} points={[[mirror.x - nx * tick, mirror.y - ny * tick, Z.dim], [mirror.x + nx * tick, mirror.y + ny * tick, Z.dim]]} color={colors.cyan} lineWidth={1.2} />);
      items.push(label(c, { x: (mirror.x + pt.x) / 2, y: (mirror.y + pt.y) / 2 }, `Ø${fmt(c.value)}`));
    } else if (c.type === 'horizontal' || c.type === 'vertical' || c.type === 'perpendicular' || c.type === 'parallel' || c.type === 'equal') {
      const lid = 'line' in c ? c.line : c.b;
      const l = sk.entities.find((e) => e.id === lid);
      if (!l || l.type !== 'line') continue;
      const a = sk.points[l.p1], b = sk.points[l.p2];
      const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const m = { x: (a.x + b.x) / 2 - ((b.y - a.y) / L) * (off * 0.55), y: (a.y + b.y) / 2 + ((b.x - a.x) / L) * (off * 0.55) };
      const g = { horizontal: '—', vertical: '|', perpendicular: '⊥', parallel: '∥', equal: '=' }[c.type];
      items.push(
        <Html key={`rel-${c.id}`} position={[m.x, m.y, Z.dim]} center zIndexRange={[10, 0]}>
          <button
            type="button"
            onContextMenu={(ev) => { ev.preventDefault(); commitDraft({ ...sk, constraints: sk.constraints.filter((k) => k.id !== c.id) }, { solve: false }); }}
            title={isTr ? 'Sağ tık: ilişkiyi sil' : 'Right-click: delete relation'}
            className="rounded-[var(--radius-s)] bg-[var(--bg-2)] px-0.5 font-mono text-[9px] leading-none text-[var(--ok)] opacity-80 hover:opacity-100"
          >
            {g}
          </button>
        </Html>,
      );
    }
  }
  return <>{items}</>;
}

const fmt = (v: number) => (Math.round(v * 100) / 100).toString();

function DimInput({ initial, onDone, allowNegative = false }: { initial: number; onDone: (v: number | null) => void; allowNegative?: boolean }) {
  const [v, setV] = useState(String(Math.round(initial * 1000) / 1000));
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  const finish = (ok: boolean) => {
    if (!ok) return onDone(null);
    const sanitized = v.trim().replace(',', '.');
    let n: number;
    try {
      // allow simple arithmetic like "40+2.5", "-20", "- 20", or "100/2"
      n = /^[-+\d\s.*/()]+$/.test(sanitized) ? Number(Function(`"use strict";return (${sanitized})`)()) : Number(sanitized);
    } catch { n = NaN; }
    const valid = isFinite(n) && (allowNegative ? true : n > 0);
    onDone(valid ? n : null);
  };
  return (
    <input
      ref={ref}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false); }}
      onBlur={() => finish(true)}
      onPointerDown={(e) => e.stopPropagation()}
      className="w-20 rounded-[var(--radius-s)] border border-[var(--cyan)] bg-[var(--bg-1)] px-1 py-0.5 font-mono text-[12px] text-[var(--ink)] outline-none shadow-md"
    />
  );
}

// ───────────────────────────── root ─────────────────────────────

export interface PartViewportProps {
  doc: PartDoc;
  regen: RegenResult;
  previewTool: THREE.BufferGeometry | null;
  isTr: boolean;
}

export function PartViewport({ doc, regen, previewTool, isTr }: PartViewportProps) {
  const colors = usePartColors();
  const mode = usePartStore((s) => s.mode);
  const tool = usePartStore((s) => s.tool);
  const sketchFeature = usePartStore(activeSketchFeature);
  const startSketch = usePartStore((s) => s.startSketch);
  const fd = usePartStore((s) => s.featureDraft);
  const patchFeatureDraft = usePartStore((s) => s.patchFeatureDraft);
  const isHoleOrThread = fd ? (fd.feature.type === 'hole' || fd.feature.type === 'thread') : false;
  const showPlanes = mode === 'pickPlane' || (mode === 'model' && regen.bodies.length === 0);

  const mouseButtons = mode === 'sketch'
    ? { LEFT: undefined as unknown as THREE.MOUSE, MIDDLE: THREE.MOUSE.ROTATE, RIGHT: THREE.MOUSE.PAN }
    : { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN };

  return (
    <Canvas
      orthographic
      camera={{ position: [1200, 1000, 1200], zoom: 2.5, near: 1, far: 8000 }}
      dpr={[1, 2]}
      onContextMenu={(e) => e.preventDefault()}
      style={{ background: colors.bg, cursor: mode === 'sketch' && tool !== 'select' ? 'crosshair' : (mode === 'pickPlane' || (mode === 'feature' && isHoleOrThread)) ? 'pointer' : 'default' }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
    >
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#ffffff', '#444444', 0.5]} />
      <directionalLight position={[300, 500, 400]} intensity={1.1} />
      <directionalLight position={[-400, -200, -300]} intensity={0.35} />

      <OrbitControls makeDefault enableDamping={false} mouseButtons={mouseButtons} zoomToCursor />
      <CameraRig regen={regen} sketchPlane={sketchFeature?.plane ?? null} />

      {showPlanes && <OriginPlanes colors={colors} pickable={mode === 'pickPlane'} isTr={isTr} />}
      {!showPlanes && mode !== 'sketch' && (
        <>
          <Line points={[[0, 0, 0], [20, 0, 0]]} color={colors.bad} lineWidth={2} />
          <Line points={[[0, 0, 0], [0, 20, 0]]} color={colors.ok} lineWidth={2} />
          <Line points={[[0, 0, 0], [0, 0, 20]]} color={colors.accent} lineWidth={2} />
        </>
      )}

      <Bodies
        regen={regen}
        colors={colors}
        ghost={mode === 'sketch' || mode === 'feature'}
        pickable={mode === 'pickPlane' || (mode === 'feature' && isHoleOrThread)}
        onPickFace={(p, n) => {
          if (mode === 'pickPlane') {
            startSketch(planeFromFace(p, n), isTr ? 'Yüzey' : 'Face');
          } else if (mode === 'feature' && isHoleOrThread) {
            const pl = planeFromFace(p, n);
            const center = worldToSketch(pl, p);
            patchFeatureDraft({ plane: pl, planeLabel: isTr ? 'Seçili Yüzey' : 'Selected Face', center });
          }
        }}
      />

      {mode === 'model' && doc.features.map((f) => (f.type === 'sketch' && f.visible ? (
        <OnPlane key={f.id} plane={f.plane}><SketchWire sk={f.sketch} colors={colors} dim /></OnPlane>
      ) : null))}

      {mode === 'feature' && <FeatureLayer doc={doc} previewTool={previewTool} colors={colors} />}
      {mode === 'sketch' && sketchFeature && <SketchEditor colors={colors} isTr={isTr} plane={sketchFeature.plane} />}
    </Canvas>
  );
}

export type { SketchTool };
