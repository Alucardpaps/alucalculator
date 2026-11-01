'use client';
/**
 * Part Studio state: the feature history (PartDoc), the active sketch session
 * (with its own undo stack), the feature-dialog draft and view requests.
 * Geometry is regenerated from the doc; nothing here touches three.js meshes.
 */
import { create } from 'zustand';
import {
  type PartDoc, type Feature, type SketchFeature, type ExtrudeFeature, type RevolveFeature,
  type HoleFeature, type ThreadFeature, type LinearPatternFeature, type CircularPatternFeature, type MirrorFeature,
  type PlaneFrame, newSketchFeature, featureId, nextName, dependents, ORIGIN_PLANES,
} from './features';
import {
  type Sketch, cloneSketch, solveSketch,
  applyLinearPatternToSketch, applyCircularPatternToSketch, applyPointPatternToSketch,
} from './sketch';
import { detectProfiles } from './profiles';
import { stampDynamicBlockToSketch } from './dynamicBlockBridge';

export type Mode = 'model' | 'pickPlane' | 'sketch' | 'feature';
export type SketchTool = 'select' | 'point' | 'line' | 'rect' | 'circle' | 'arc' | 'dimension' | 'trim' | 'fillet' | 'chamfer';
export type ViewPreset = 'iso' | 'front' | 'top' | 'right' | 'normal' | 'fit';

export interface FeatureDraft {
  /** id of the feature being edited, or null for a new one */
  editingId: string | null;
  feature: ExtrudeFeature | RevolveFeature | HoleFeature | ThreadFeature | LinearPatternFeature | CircularPatternFeature | MirrorFeature;
}

const STORAGE_KEY = 'alucad-part-studio-v1';

function loadDoc(): PartDoc {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const d = JSON.parse(raw) as PartDoc;
      if (d && Array.isArray(d.features)) return d;
    }
  } catch { /* storage blocked */ }
  return { name: 'Part1', features: [] };
}

function saveDoc(doc: PartDoc) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(doc)); } catch { /* ignore */ }
}

interface PartState {
  doc: PartDoc;
  docPast: PartDoc[];
  docFuture: PartDoc[];
  mode: Mode;
  /** sketch session */
  sketchFeatureId: string | null;
  draft: Sketch | null;
  draftPast: Sketch[];
  draftFuture: Sketch[];
  tool: SketchTool;
  construction: boolean;
  centerline: boolean;
  setCenterline: (c: boolean) => void;
  gridStep: number;
  filletRadius: number;
  chamferDistance: number;
  setFilletRadius: (r: number) => void;
  setChamferDistance: (d: number) => void;
  selection: string[]; // entity ids / point ids ("pt:<id>") / constraint ids ("cn:<id>")
  /** sketch to start when picking a plane (op that follows) */
  pickIntent: 'sketch';
  featureDraft: FeatureDraft | null;
  selectedFeatureId: string | null;
  viewRequest: { preset: ViewPreset; n: number };
  linkedPartId: string | null;
  /** sketch being created (added to the doc on finish) */
  pendingSketch: SketchFeature | null;

  // doc
  setDoc: (d: PartDoc, record?: boolean) => void;
  undoDoc: () => void;
  redoDoc: () => void;
  newPart: () => void;
  renameFeature: (id: string, name: string) => void;
  deleteFeature: (id: string) => void;
  toggleSuppress: (id: string) => void;
  toggleSketchVisible: (id: string) => void;
  selectFeature: (id: string | null) => void;
  setLinkedPartId: (id: string | null) => void;

  // sketch session
  beginPickPlane: () => void;
  startSketch: (plane: PlaneFrame, label: string) => void;
  editSketch: (featureId: string) => void;
  finishSketch: () => { featureId: string; hasProfile: boolean; isNew: boolean } | null;
  cancelSketch: () => void;
  /** push a sketch change (undoable). `solve` re-runs constraints. */
  commitDraft: (s: Sketch, opts?: { solve?: boolean; locked?: Set<string> }) => void;
  /** live update while dragging (not recorded) */
  previewDraft: (s: Sketch) => void;
  beginDrag: () => void;
  undoSketch: () => void;
  redoSketch: () => void;
  setTool: (t: SketchTool) => void;
  setConstruction: (v: boolean) => void;
  setGridStep: (n: number) => void;
  setSelection: (ids: string[]) => void;

  // features
  openFeature: (type: 'extrude' | 'revolve' | 'hole' | 'thread' | 'linearPattern' | 'circularPattern' | 'mirror', opts?: { sketchId?: string; operation?: ExtrudeFeature['operation'] }) => void;
  editFeature: (id: string) => void;
  patchFeatureDraft: (patch: Partial<ExtrudeFeature> | Partial<RevolveFeature> | Partial<HoleFeature> | Partial<ThreadFeature> | Partial<LinearPatternFeature> | Partial<CircularPatternFeature> | Partial<MirrorFeature>) => void;
  toggleDraftRegion: (key: string) => void;
  applyFeature: () => void;
  cancelFeature: () => void;

  // 2D sketch array / patterns
  applySketchLinearPattern: (countX: number, stepX: number, countY?: number, stepY?: number, angleDeg?: number) => void;
  applySketchCircularPattern: (centerX: number, centerY: number, count: number, totalAngleDeg?: number) => void;
  applySketchPointPattern: (basePoint: { x: number; y: number }, targetPoints: Array<{ x: number; y: number }>) => void;

  /** Stamps a 2D dynamic block onto the active sketch (or starts one if none is open) */
  stampDynamicBlock: (blockId: string, center?: { x: number; y: number }, params?: Record<string, any>) => void;

  requestView: (p: ViewPreset) => void;
}

const isSketch = (f: Feature): f is SketchFeature => f.type === 'sketch';
let dragStart: Sketch | null = null;

export const usePartStore = create<PartState>((set, get) => ({
  doc: loadDoc(),
  docPast: [],
  docFuture: [],
  mode: 'model',
  sketchFeatureId: null,
  draft: null,
  draftPast: [],
  draftFuture: [],
  tool: 'line',
  construction: false,
  centerline: false,
  setCenterline: (centerline) => set({ centerline }),
  gridStep: 5,
  filletRadius: 10,
  chamferDistance: 10,
  setFilletRadius: (filletRadius) => set({ filletRadius: Math.max(0.1, filletRadius) }),
  setChamferDistance: (chamferDistance) => set({ chamferDistance: Math.max(0.1, chamferDistance) }),
  selection: [],
  pickIntent: 'sketch',
  featureDraft: null,
  selectedFeatureId: null,
  viewRequest: { preset: 'iso', n: 0 },
  linkedPartId: null,
  pendingSketch: null,

  setDoc: (doc, record = true) => {
    const prev = get().doc;
    set((s) => ({ doc, docPast: record ? [...s.docPast.slice(-49), prev] : s.docPast, docFuture: record ? [] : s.docFuture }));
    saveDoc(doc);
  },
  undoDoc: () => {
    const { docPast, doc, docFuture } = get();
    if (!docPast.length) return;
    const prev = docPast[docPast.length - 1];
    set({ doc: prev, docPast: docPast.slice(0, -1), docFuture: [doc, ...docFuture] });
    saveDoc(prev);
  },
  redoDoc: () => {
    const { docPast, doc, docFuture } = get();
    if (!docFuture.length) return;
    const nx = docFuture[0];
    set({ doc: nx, docPast: [...docPast, doc], docFuture: docFuture.slice(1) });
    saveDoc(nx);
  },
  newPart: () => {
    get().setDoc({ name: 'Part1', features: [] });
    set({ mode: 'model', draft: null, sketchFeatureId: null, featureDraft: null, selectedFeatureId: null, linkedPartId: null });
  },
  renameFeature: (id, name) => {
    const doc = get().doc;
    get().setDoc({ ...doc, features: doc.features.map((f) => (f.id === id ? { ...f, name } : f)) });
  },
  deleteFeature: (id) => {
    const doc = get().doc;
    const kill = new Set([id, ...dependents(doc, id).map((f) => f.id)]);
    get().setDoc({ ...doc, features: doc.features.filter((f) => !kill.has(f.id)) });
    set({ selectedFeatureId: null });
  },
  toggleSuppress: (id) => {
    const doc = get().doc;
    get().setDoc({ ...doc, features: doc.features.map((f) => (f.id === id && f.type !== 'sketch' ? { ...f, suppressed: !f.suppressed } : f)) });
  },
  toggleSketchVisible: (id) => {
    const doc = get().doc;
    get().setDoc({ ...doc, features: doc.features.map((f) => (f.id === id && f.type === 'sketch' ? { ...f, visible: !f.visible } : f)) }, false);
  },
  selectFeature: (selectedFeatureId) => set({ selectedFeatureId }),
  setLinkedPartId: (linkedPartId) => set({ linkedPartId }),

  beginPickPlane: () => set({ mode: 'pickPlane', featureDraft: null }),
  startSketch: (plane, label) => {
    const doc = get().doc;
    const f = newSketchFeature(doc, plane, label, 'Sketch');
    // sketch is added to the doc on finish; keep it as a pending feature
    set({
      mode: 'sketch', sketchFeatureId: f.id, draft: f.sketch, draftPast: [], draftFuture: [], selection: [], tool: 'line',
      pendingSketch: f,
    });
    get().requestView('normal');
  },
  editSketch: (id) => {
    const f = get().doc.features.find((x) => x.id === id);
    if (!f || !isSketch(f)) return;
    set({ mode: 'sketch', sketchFeatureId: id, draft: cloneSketch(f.sketch), draftPast: [], draftFuture: [], selection: [], tool: 'select', featureDraft: null, selectedFeatureId: id });
    get().requestView('normal');
  },
  finishSketch: () => {
    const { draft, sketchFeatureId, doc } = get();
    if (!draft || !sketchFeatureId) return null;
    const pending = get().pendingSketch;
    const exists = doc.features.some((f) => f.id === sketchFeatureId);
    let features: Feature[];
    if (exists) features = doc.features.map((f) => (f.id === sketchFeatureId && isSketch(f) ? { ...f, sketch: draft } : f));
    else if (pending && pending.id === sketchFeatureId) {
      if (!draft.entities.length) { get().cancelSketch(); return null; }
      features = [...doc.features, { ...pending, sketch: draft }];
    } else return null;
    get().setDoc({ ...doc, features });
    const hasProfile = detectProfiles(draft).auto.length > 0;
    set({ mode: 'model', draft: null, sketchFeatureId: null, selection: [], pendingSketch: null });
    get().requestView('iso');
    return { featureId: sketchFeatureId, hasProfile, isNew: !exists };
  },
  cancelSketch: () => {
    set({ mode: 'model', draft: null, sketchFeatureId: null, selection: [], pendingSketch: null });
    get().requestView('iso');
  },
  commitDraft: (s, opts) => {
    const before = dragStart ?? get().draft;
    dragStart = null;
    const solved = opts?.solve === false ? s : solveSketch(s, { locked: opts?.locked }).sketch;
    set((st) => ({ draft: solved, draftPast: before ? [...st.draftPast.slice(-99), before] : st.draftPast, draftFuture: [] }));
  },
  previewDraft: (s) => set({ draft: s }),
  beginDrag: () => { dragStart = get().draft; },
  undoSketch: () => {
    const { draftPast, draft, draftFuture } = get();
    if (!draftPast.length || !draft) return;
    set({ draft: draftPast[draftPast.length - 1], draftPast: draftPast.slice(0, -1), draftFuture: [draft, ...draftFuture], selection: [] });
  },
  redoSketch: () => {
    const { draftPast, draft, draftFuture } = get();
    if (!draftFuture.length || !draft) return;
    set({ draft: draftFuture[0], draftPast: [...draftPast, draft], draftFuture: draftFuture.slice(1), selection: [] });
  },
  setTool: (tool) => set({ tool }),
  setConstruction: (construction) => set({ construction }),
  setGridStep: (gridStep) => set({ gridStep }),
  setSelection: (selection) => set({ selection }),

  openFeature: (type, opts) => {
    const doc = get().doc;
    if (type === 'hole') {
      const feature: HoleFeature = {
        id: featureId('hl'),
        type: 'hole',
        name: nextName(doc, 'Delik'),
        holeType: 'counterbore',
        standardSize: 'M6',
        diameter: 6.6,
        depth: 20,
        isThroughAll: false,
        direction: 'reverse',
        cboreDiameter: 10.0,
        cboreDepth: 6.0,
        csinkDiameter: 12.4,
        csinkAngle: 90,
        threadPitch: 1.0,
        plane: ORIGIN_PLANES.XZ,
        planeLabel: 'Üst düzlem (XZ)',
        center: { x: 0, y: 0 },
      };
      if (typeof document !== 'undefined') (document.activeElement as HTMLElement | null)?.blur?.();
      set({ mode: 'feature', featureDraft: { editingId: null, feature } });
      return;
    }

    if (type === 'thread') {
      const feature: ThreadFeature = {
        id: featureId('th'),
        type: 'thread',
        name: nextName(doc, 'Diş'),
        standard: 'ISO_METRIC',
        size: 'M6',
        nominalDiameter: 6.0,
        pitch: 1.0,
        length: 15,
        isInternal: true,
        direction: 'reverse',
        plane: ORIGIN_PLANES.XZ,
        planeLabel: 'Üst düzlem (XZ)',
        center: { x: 0, y: 0 },
      };
      if (typeof document !== 'undefined') (document.activeElement as HTMLElement | null)?.blur?.();
      set({ mode: 'feature', featureDraft: { editingId: null, feature } });
      return;
    }

    const nonSketchFeatures = doc.features.filter((f) => f.type !== 'sketch' && !f.suppressed);
    const targetId = nonSketchFeatures[nonSketchFeatures.length - 1]?.id || '';

    if (type === 'linearPattern') {
      const feature: LinearPatternFeature = {
        id: featureId('lp'),
        type: 'linearPattern',
        name: nextName(doc, 'Doğrusal Çoğaltma'),
        targetFeatureId: targetId,
        dir1Axis: 'X',
        dir1Count: 3,
        dir1Spacing: 30,
        dir2Enabled: false,
        dir2Axis: 'Y',
        dir2Count: 2,
        dir2Spacing: 30,
      };
      if (typeof document !== 'undefined') (document.activeElement as HTMLElement | null)?.blur?.();
      set({ mode: 'feature', featureDraft: { editingId: null, feature } });
      return;
    }

    if (type === 'circularPattern') {
      const feature: CircularPatternFeature = {
        id: featureId('cp'),
        type: 'circularPattern',
        name: nextName(doc, 'Dairesel Çoğaltma'),
        targetFeatureId: targetId,
        axis: 'Y',
        count: 4,
        totalAngle: 360,
      };
      if (typeof document !== 'undefined') (document.activeElement as HTMLElement | null)?.blur?.();
      set({ mode: 'feature', featureDraft: { editingId: null, feature } });
      return;
    }

    if (type === 'mirror') {
      const feature: MirrorFeature = {
        id: featureId('mr'),
        type: 'mirror',
        name: nextName(doc, 'Aynalama'),
        targetFeatureId: targetId,
        plane: 'YZ',
      };
      if (typeof document !== 'undefined') (document.activeElement as HTMLElement | null)?.blur?.();
      set({ mode: 'feature', featureDraft: { editingId: null, feature } });
      return;
    }

    const sketches = doc.features.filter(isSketch);
    const sketchId = opts?.sketchId || get().selectedFeatureId && sketches.find((s) => s.id === get().selectedFeatureId)?.id || sketches[sketches.length - 1]?.id;
    if (!sketchId) return;
    const hasBodies = doc.features.some((f) => f.type !== 'sketch' && !f.suppressed);
    const operation = opts?.operation || (hasBodies ? 'join' : 'new');
    const targetSk = sketches.find((s) => s.id === sketchId);
    const defaultCenterline = targetSk?.sketch.entities.find((e) => e.type === 'line' && (e as any).centerline);
    const defaultAxis = defaultCenterline ? defaultCenterline.id : 'Y';
    const feature: ExtrudeFeature | RevolveFeature =
      type === 'extrude'
        ? { id: featureId('ex'), type: 'extrude', name: nextName(doc, operation === 'cut' ? 'Cut' : 'Extrude'), sketchId, regionKeys: [], distance: 10, direction: operation === 'cut' ? 'reverse' : 'normal', operation }
        : { id: featureId('rv'), type: 'revolve', name: nextName(doc, 'Revolve'), sketchId, regionKeys: [], axis: defaultAxis, angle: 360, operation };
    // hide other sketches' clutter: make the profile sketch visible
    if (typeof document !== 'undefined') (document.activeElement as HTMLElement | null)?.blur?.();
    set({ mode: 'feature', featureDraft: { editingId: null, feature } });
  },
  editFeature: (id) => {
    const f = get().doc.features.find((x) => x.id === id);
    if (!f || f.type === 'sketch') return;
    set({ mode: 'feature', featureDraft: { editingId: id, feature: JSON.parse(JSON.stringify(f)) }, selectedFeatureId: id });
  },
  patchFeatureDraft: (patch) => {
    const d = get().featureDraft;
    if (!d) return;
    const next = { ...d.feature, ...patch } as ExtrudeFeature | RevolveFeature | HoleFeature | ThreadFeature;
    // Switching to / from Cut: point the tool into the material (SolidWorks default) and rename
    if ('operation' in patch && patch.operation && 'operation' in d.feature && patch.operation !== d.feature.operation && next.type === 'extrude' && !('direction' in patch)) {
      const toCut = patch.operation === 'cut', fromCut = d.feature.operation === 'cut';
      if (toCut && next.direction === 'normal') next.direction = 'reverse';
      if (fromCut && !toCut && next.direction === 'reverse') next.direction = 'normal';
      if (!d.editingId) {
        const base = toCut ? 'Cut' : 'Extrude';
        if (/^(Cut|Extrude)\d+$/.test(next.name)) next.name = nextName(get().doc, base);
      }
    }
    set({ featureDraft: { ...d, feature: next } });
  },
  toggleDraftRegion: (key) => {
    const d = get().featureDraft;
    if (!d || !('regionKeys' in d.feature)) return;
    const active = d.feature.regionKeys.filter((k) => k !== '__none__');
    const keys = active.includes(key) ? active.filter((k) => k !== key) : [...active, key];
    get().patchFeatureDraft({ regionKeys: keys.length === 0 ? ['__none__'] : keys });
  },
  applyFeature: () => {
    const d = get().featureDraft;
    if (!d) return;
    const doc = get().doc;
    const sketchId = 'sketchId' in d.feature ? d.feature.sketchId : null;
    // like SolidWorks: a sketch consumed by a feature is hidden (eye icon brings it back)
    const features = (d.editingId ? doc.features.map((f) => (f.id === d.editingId ? d.feature : f)) : [...doc.features, d.feature])
      .map((f) => (sketchId && f.type === 'sketch' && f.id === sketchId ? { ...f, visible: false } : f));
    get().setDoc({ ...doc, features });
    set({ mode: 'model', featureDraft: null, selectedFeatureId: d.feature.id });
  },
  cancelFeature: () => set({ mode: 'model', featureDraft: null }),

  applySketchLinearPattern: (countX, stepX, countY = 1, stepY = 0, angleDeg = 0) => {
    const cur = get().draft;
    const sel = get().selection;
    if (!cur || sel.length === 0) return;
    const next = applyLinearPatternToSketch(cur, sel, countX, stepX, countY, stepY, angleDeg);
    get().commitDraft(next);
  },
  applySketchCircularPattern: (centerX, centerY, count, totalAngleDeg = 360) => {
    const cur = get().draft;
    const sel = get().selection;
    if (!cur || sel.length === 0) return;
    const next = applyCircularPatternToSketch(cur, sel, centerX, centerY, count, totalAngleDeg);
    get().commitDraft(next);
  },
  applySketchPointPattern: (basePoint, targetPoints) => {
    const cur = get().draft;
    const sel = get().selection;
    if (!cur || sel.length === 0) return;
    const next = applyPointPatternToSketch(cur, sel, basePoint, targetPoints);
    get().commitDraft(next);
  },

  stampDynamicBlock: (blockId, center = { x: 0, y: 0 }, params = {}) => {
    let curSketch = get().draft;
    if (get().mode !== 'sketch' || !curSketch) {
      // Start a new sketch on XY plane if not in sketch mode
      get().startSketch(ORIGIN_PLANES.XY, 'Front plane (XY)');
      curSketch = get().draft;
    }
    if (!curSketch) return;
    const next = stampDynamicBlockToSketch(curSketch, blockId, center, params);
    get().commitDraft(next);
  },

  requestView: (preset) => set((s) => ({ viewRequest: { preset, n: s.viewRequest.n + 1 } })),
}));

export const activeSketchFeature = (st: PartState): SketchFeature | null => {
  if (!st.sketchFeatureId) return null;
  const f = st.doc.features.find((x) => x.id === st.sketchFeatureId);
  if (f && isSketch(f)) return f;
  const p = st.pendingSketch;
  return p && p.id === st.sketchFeatureId ? p : null;
};
