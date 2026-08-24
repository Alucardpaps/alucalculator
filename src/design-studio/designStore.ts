'use client';

import { create } from 'zustand';
import { type HoleItem } from './holeStandards';

export type DesignKind =
  | 'box' | 'cylinder' | 'tube' | 'cone' | 'sphere' | 'torus' | 'pyramid' | 'wedge'
  | 'plate' | 'hex-prism' | 'trapezoid' | 'L-bracket' | 'U-channel' | 'I-beam' | 'T-beam'
  | 'gear-blank' | 'pulley' | 'washer' | 'hex-bolt' | 'hex-nut' | 'bearing-race'
  | 'keyway-shaft' | 'd-shaft' | 'slot-plate' | 'star-prism' | 'cross-prism' | 'profile'
  | 'imported-model';

export type DesignTool = 'select' | 'move' | 'rotate' | 'scale' | 'measure' | 'hole' | 'place' | 'sketch-add' | 'sketch-cut' | 'sketch-loft';
export type RenderMode = 'solid' | 'wire' | 'matcap' | 'pbr' | 'xray' | 'normals' | 'edges' | 'grid';
export type StudioMode = 'object' | 'inspect' | 'sculpt';
export type SculptBrush = 'clay' | 'draw' | 'inflate' | 'smooth' | 'pinch' | 'flatten' | 'grab';
export type SectionAxis = 'NONE' | 'X' | 'Y' | 'Z';
export type SketchShapeMode = 'line' | 'circle' | 'rect' | 'polygon';

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Measurement {
  id: string;
  p1: Point3D;
  p2: Point3D;
  distance: number;
  dx: number;
  dy: number;
  dz: number;
}

export interface DesignPart {
  id: string;
  kind: DesignKind;
  name: string;
  color: string;
  visible: boolean;
  locked: boolean;
  parentId: string | null;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  params: Record<string, number>;
  outer?: Point2D[];
  solidOp?: 'extrude' | 'revolve' | 'loft' | 'cut';
  modelUrl?: string;
  customGeometry?: any;
  materialId?: string;
  holes?: HoleItem[];
}

export const PART_COLORS = ['#6b9fff', '#34d399', '#fbbf24', '#f97316', '#c084fc', '#f43f5e', '#22d3ee', '#a3e635'];

export const KIND_DEFAULTS: Record<string, Record<string, number>> = {
  box: { width: 40, height: 40, depth: 20 },
  cylinder: { diameter: 30, length: 40 },
  tube: { diameter: 30, wall: 4, length: 40 },
  cone: { diameter: 30, length: 40 },
  sphere: { diameter: 30 },
  torus: { diameter: 30, tube: 8 },
  pyramid: { width: 40, height: 40, length: 40 },
  wedge: { width: 40, height: 40, depth: 30 },
  plate: { width: 60, height: 40, depth: 6, holeRadius: 6 },
  'hex-prism': { diameter: 32, length: 40 },
  trapezoid: { widthTop: 25, widthBottom: 45, height: 35, depth: 25 },
  'L-bracket': { flangeW: 50, webH: 50, flangeT: 6, webT: 6, length: 40 },
  'U-channel': { flangeW: 50, webH: 35, flangeT: 5, webT: 5, length: 60 },
  'I-beam': { flangeW: 50, webH: 60, flangeT: 6, webT: 5, length: 80 },
  'T-beam': { flangeW: 50, webH: 50, flangeT: 6, webT: 5, length: 80 },
  'gear-blank': { module: 1.5, teeth: 24, depth: 15, bore: 12 },
  pulley: { diameter: 50, innerDiameter: 12, depth: 20, grooveDepth: 4 },
  washer: { diameter: 24, innerDiameter: 12, depth: 3 },
  'hex-bolt': { diameter: 10, length: 40, headSize: 17, headHeight: 7 },
  'hex-nut': { headSize: 17, innerDiameter: 10, depth: 8 },
  'bearing-race': { diameter: 47, innerDiameter: 20, depth: 14, shoulder: 2.5 },
  'keyway-shaft': { diameter: 20, length: 60, keyWidth: 6, keyDepth: 3.5 },
  'd-shaft': { diameter: 20, length: 50, flatOffset: 7 },
  'slot-plate': { width: 60, height: 40, depth: 6, slotLength: 30, slotWidth: 10 },
  'star-prism': { diameter: 36, innerRadius: 14, starPoints: 5, depth: 10 },
  'cross-prism': { width: 40, wall: 10, depth: 15 },
  profile: { extrudeDepth: 20, revolveAngle: 360, revolveRadius: 0, loftHeight: 40, loftScale: 50, loftTwist: 0, filletR: 0, chamferD: 0, shellT: 0 },
  'imported-model': { width: 50, height: 50, depth: 50 },
};

let seq = 0;

export function kindLabel(kind: string, tr = false): string {
  const map: Record<string, [string, string]> = {
    box: ['Box', 'Kutu'],
    cylinder: ['Cylinder', 'Silindir'],
    tube: ['Tube', 'Boru'],
    cone: ['Cone', 'Koni'],
    sphere: ['Sphere', 'Küre'],
    torus: ['Torus', 'Halka'],
    pyramid: ['Pyramid', 'Piramit'],
    wedge: ['Wedge', 'Kama'],
    plate: ['Plate', 'Plaka'],
    'hex-prism': ['Hex Prism', 'Altıgen'],
    trapezoid: ['Trapezoid', 'Yamuk'],
    'L-bracket': ['L-Bracket', 'L Profil'],
    'U-channel': ['U-Channel', 'U Profil'],
    'I-beam': ['I-Beam', 'I Kiriş'],
    'T-beam': ['T-Beam', 'T Kiriş'],
    'gear-blank': ['Spur Gear', 'Düz Dişli'],
    pulley: ['V-Pulley', 'Kasnak'],
    washer: ['Washer', 'Rondela'],
    'hex-bolt': ['Hex Bolt', 'Cıvata'],
    'hex-nut': ['Hex Nut', 'Somun'],
    'bearing-race': ['Bearing Race', 'Rulman Bileziği'],
    'keyway-shaft': ['Keyway Shaft', 'Kama Milli'],
    'd-shaft': ['D-Shaft', 'D Mil'],
    'slot-plate': ['Slot Plate', 'Slot Plaka'],
    'star-prism': ['Star Prism', 'Yıldız'],
    'cross-prism': ['Cross Beam', 'Artı Profil'],
    profile: ['Sketch Solid', 'Eskiz Katı'],
    'imported-model': ['CAD Model', 'CAD Model'],
  };
  const pair = map[kind] || [kind, kind];
  return tr ? pair[1] : pair[0];
}

interface DesignState {
  parts: DesignPart[];
  selectedId: string | null;
  tool: DesignTool;
  placeKind: DesignKind;
  renderMode: RenderMode;
  studioMode: StudioMode;
  sectionAxis: SectionAxis;
  sectionOffset: number;
  sectionInvert: boolean;
  gridSnap: number;
  showGrid: boolean;
  lightingPreset: string;
  backgroundPreset: string;
  projectName: string;

  // Assembly Inspection & Exploded View State
  explodeFactor: number;
  isolatedPartId: string | null;
  ghostIsolated: boolean;
  measurements: Measurement[];
  activeMeasureStart: Point3D | null;

  // Engineering Materials & Mass Properties State
  selectedMaterialId: string;
  showCenterOfGravity: boolean;
  showTechnicalDrawingModal: boolean;
  showMaterialsModal: boolean;
  holes: HoleItem[];

  // Custom Geometries Cache for Imported STL / OBJ / GLTF models
  customGeometries: Record<string, any>;

  // Sculpt State (Blender Mode)
  sculptBrush: SculptBrush;
  sculptRadius: number;
  sculptStrength: number;
  sculptDirection: 'add' | 'sub';
  sculptSymmetry: boolean;
  sculptVersion: number;

  // 2D Sketch state for Freeform Extrude / Revolve / Loft / Cut
  sketchPoints: Point2D[];
  sketchClosed: boolean;
  extrudeDepth: number;
  revolveAngle: number;
  loftHeight: number;
  pendingOp: 'extrude' | 'revolve' | 'loft' | 'cut';
  sketchShapeMode: SketchShapeMode;
  sketchCircleRadius: number;
  constraintOrtho: boolean;
  constraintPerpendicular: boolean;
  constraintParallel: boolean;
  constraintEqual: boolean;

  historyPast: DesignPart[][];
  historyFuture: DesignPart[][];
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  addPart: (kind: DesignKind) => string;
  select: (id: string | null) => void;
  setTool: (tool: DesignTool) => void;
  setPlaceKind: (kind: DesignKind) => void;
  setRenderMode: (mode: RenderMode) => void;
  setStudioMode: (mode: StudioMode) => void;
  setSectionAxis: (axis: SectionAxis) => void;
  setSectionOffset: (offset: number) => void;
  setSectionInvert: (invert: boolean) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  updateSelectedParams: (patch: Record<string, number>) => void;
  updateSelectedTransform: (patch: { position?: Partial<Point3D>; rotation?: Partial<Point3D>; scale?: Partial<Point3D> }) => void;
  setSelectedColor: (color: string) => void;
  setSelectedName: (name: string) => void;
  toggleVisible: (id: string) => void;
  toggleLocked: (id: string) => void;
  clearScene: () => void;
  setGridSnap: (n: number) => void;
  setShowGrid: (v: boolean) => void;
  setLightingPreset: (v: string) => void;
  setBackgroundPreset: (v: string) => void;
  setProjectName: (v: string) => void;
  getSelected: () => DesignPart | null;

  // Engineering Materials & Mass Properties Actions
  setSelectedMaterialId: (id: string) => void;
  setShowCenterOfGravity: (show: boolean) => void;
  setShowTechnicalDrawingModal: (show: boolean) => void;
  setShowMaterialsModal: (show: boolean) => void;
  addHole: (hole: HoleItem) => void;
  removeHole: (id: string) => void;
  clearHoles: () => void;

  // Inspection & Assembly Actions
  setExplodeFactor: (f: number) => void;
  setIsolatedPartId: (id: string | null) => void;
  setGhostIsolated: (v: boolean) => void;
  showAllParts: () => void;
  hideAllParts: () => void;
  toggleIsolateSelected: () => void;
  setActiveMeasureStart: (pt: Point3D | null) => void;
  addMeasurement: (p1: Point3D, p2: Point3D) => void;
  removeMeasurement: (id: string) => void;
  clearMeasurements: () => void;
  importCADModel: (name: string, geom: any, position?: Point3D, color?: string) => string;

  // Sculpt actions
  setSculptBrush: (brush: SculptBrush) => void;
  setSculptRadius: (radius: number) => void;
  setSculptStrength: (strength: number) => void;
  setSculptDirection: (direction: 'add' | 'sub') => void;
  setSculptSymmetry: (symmetry: boolean) => void;
  incrementSculptVersion: () => void;
  resetSculpt: () => void;

  // Sketch methods
  startSketchAdd: (op?: 'extrude' | 'revolve' | 'loft') => void;
  startSketchCut: () => void;
  setSketchShapeMode: (mode: SketchShapeMode) => void;
  setSketchCircleRadius: (r: number) => void;
  toggleConstraint: (type: 'ortho' | 'perp' | 'parallel' | 'equal') => void;
  addSketchPoint: (pt: Point2D) => void;
  addCircleSketch: (center: Point2D, radius?: number) => void;
  addRectSketch: (center: Point2D, width?: number, height?: number) => void;
  addPolygonSketch: (center: Point2D, radius?: number, sides?: number) => void;
  closeSketch: () => void;
  clearSketch: () => void;
  undoSketchPoint: () => void;
  setExtrudeDepth: (depth: number) => void;
  setRevolveAngle: (angle: number) => void;
  setLoftHeight: (height: number) => void;
  commitExtrude: () => string | null;
}

export const useDesignStore = create<DesignState>((set, get) => ({
  parts: [],
  selectedId: null,
  tool: 'select',
  placeKind: 'box',
  renderMode: 'solid',
  studioMode: 'object',
  sectionAxis: 'NONE',
  sectionOffset: 0,
  sectionInvert: false,
  gridSnap: 5,
  showGrid: true,
  lightingPreset: 'studio',
  backgroundPreset: 'dark',
  projectName: 'Untitled Design',

  // Inspection & Assembly State
  explodeFactor: 0,
  isolatedPartId: null,
  ghostIsolated: true,
  measurements: [],
  activeMeasureStart: null,
  customGeometries: {},

  // Materials & Analysis State
  selectedMaterialId: 'al-6061-t6',
  showCenterOfGravity: false,
  showTechnicalDrawingModal: false,
  showMaterialsModal: false,
  holes: [
    { id: 'h1', size: 'M6', x: -20, y: 0, type: 'counterbore' },
    { id: 'h2', size: 'M6', x: 20, y: 0, type: 'counterbore' },
  ],

  // Sculpt State
  sculptBrush: 'clay',
  sculptRadius: 30,
  sculptStrength: 0.5,
  sculptDirection: 'add',
  sculptSymmetry: false,
  sculptVersion: 0,

  // Sketch Initial State
  sketchPoints: [],
  sketchClosed: false,
  extrudeDepth: 20,
  revolveAngle: 360,
  loftHeight: 40,
  pendingOp: 'extrude',
  sketchShapeMode: 'line',
  sketchCircleRadius: 25,
  constraintOrtho: false,
  constraintPerpendicular: true,
  constraintParallel: true,
  constraintEqual: true,

  historyPast: [],
  historyFuture: [],

  pushHistory: () => {
    const { parts, historyPast } = get();
    const nextPast = [...historyPast.slice(-19), JSON.parse(JSON.stringify(parts))];
    set({ historyPast: nextPast, historyFuture: [] });
  },

  undo: () => {
    const { parts, historyPast, historyFuture } = get();
    if (historyPast.length === 0) return;
    const prev = historyPast[historyPast.length - 1];
    const newPast = historyPast.slice(0, -1);
    set({
      parts: prev,
      historyPast: newPast,
      historyFuture: [JSON.parse(JSON.stringify(parts)), ...historyFuture],
      selectedId: prev.some(p => p.id === get().selectedId) ? get().selectedId : null,
    });
  },

  redo: () => {
    const { parts, historyPast, historyFuture } = get();
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    const newFuture = historyFuture.slice(1);
    set({
      parts: next,
      historyPast: [...historyPast, JSON.parse(JSON.stringify(parts))],
      historyFuture: newFuture,
      selectedId: next.some(p => p.id === get().selectedId) ? get().selectedId : null,
    });
  },

  addPart: (kind) => {
    get().pushHistory();
    const id = `${kind}-${Date.now().toString(36)}-${++seq}`;
    const n = get().parts.filter((p) => p.kind === kind).length + 1;
    const part: DesignPart = {
      id,
      kind,
      name: `${kindLabel(kind)} ${n}`,
      color: PART_COLORS[get().parts.length % PART_COLORS.length],
      visible: true,
      locked: false,
      parentId: null,
      position: { x: (get().parts.length % 5) * 60 - 120, y: 0, z: Math.floor(get().parts.length / 5) * 60 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { ...(KIND_DEFAULTS[kind] || KIND_DEFAULTS.box) },
    };
    set((s) => ({ parts: [...s.parts, part], selectedId: id }));
    return id;
  },
  select: (id) => set({ selectedId: id }),
  setTool: (tool) => set({ tool }),
  setPlaceKind: (kind) => set({ placeKind: kind }),
  setRenderMode: (renderMode) => set({ renderMode }),
  setStudioMode: (studioMode) => set({ studioMode }),
  setSectionAxis: (sectionAxis) => set({ sectionAxis }),
  setSectionOffset: (sectionOffset) => set({ sectionOffset }),
  setSectionInvert: (sectionInvert) => set({ sectionInvert }),
  deleteSelected: () => {
    const id = get().selectedId;
    if (!id) return;
    get().pushHistory();
    set((s) => ({ parts: s.parts.filter((p) => p.id !== id), selectedId: null }));
  },
  duplicateSelected: () => {
    const sel = get().getSelected();
    if (!sel) return;
    get().pushHistory();
    const id = `${sel.kind}-${Date.now().toString(36)}-${++seq}`;
    set((s) => ({
      parts: [...s.parts, { ...sel, id, name: `${sel.name} copy`, position: { ...sel.position, x: sel.position.x + 30 } }],
      selectedId: id,
    }));
  },
  updateSelectedParams: (patch) => {
    const id = get().selectedId;
    if (!id) return;
    set((s) => ({
      parts: s.parts.map((p) => (p.id === id ? { ...p, params: { ...p.params, ...patch } } : p)),
    }));
  },
  updateSelectedTransform: (patch) => {
    const id = get().selectedId;
    if (!id) return;
    set((s) => ({
      parts: s.parts.map((p) => (p.id === id ? {
        ...p,
        position: { ...p.position, ...(patch.position || {}) },
        rotation: { ...p.rotation, ...(patch.rotation || {}) },
        scale: { ...p.scale, ...(patch.scale || {}) },
      } : p)),
    }));
  },
  setSelectedColor: (color) => {
    const id = get().selectedId;
    if (!id) return;
    set((s) => ({ parts: s.parts.map((p) => (p.id === id ? { ...p, color } : p)) }));
  },
  setSelectedName: (name) => {
    const id = get().selectedId;
    if (!id) return;
    set((s) => ({ parts: s.parts.map((p) => (p.id === id ? { ...p, name } : p)) }));
  },
  toggleVisible: (id) => set((s) => ({ parts: s.parts.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p)) })),
  toggleLocked: (id) => set((s) => ({ parts: s.parts.map((p) => (p.id === id ? { ...p, locked: !p.locked } : p)) })),
  clearScene: () => set({ parts: [], selectedId: null, measurements: [], isolatedPartId: null }),
  setGridSnap: (n) => set({ gridSnap: n }),
  setShowGrid: (v) => set({ showGrid: v }),
  setLightingPreset: (v) => set({ lightingPreset: v }),
  setBackgroundPreset: (v) => set({ backgroundPreset: v }),
  setProjectName: (v) => set({ projectName: v }),
  getSelected: () => get().parts.find((p) => p.id === get().selectedId) || null,

  // Materials, Analysis & Drawing Actions
  setSelectedMaterialId: (selectedMaterialId) => set({ selectedMaterialId }),
  setShowCenterOfGravity: (showCenterOfGravity) => set({ showCenterOfGravity }),
  setShowTechnicalDrawingModal: (showTechnicalDrawingModal) => set({ showTechnicalDrawingModal }),
  setShowMaterialsModal: (showMaterialsModal) => set({ showMaterialsModal }),
  addHole: (hole) => set((s) => ({ holes: [...s.holes, hole] })),
  removeHole: (id) => set((s) => ({ holes: s.holes.filter((h) => h.id !== id) })),
  clearHoles: () => set({ holes: [] }),

  // Assembly Inspection Actions
  setExplodeFactor: (explodeFactor) => set({ explodeFactor }),
  setIsolatedPartId: (isolatedPartId) => set({ isolatedPartId }),
  setGhostIsolated: (ghostIsolated) => set({ ghostIsolated }),
  showAllParts: () => set((s) => ({ parts: s.parts.map((p) => ({ ...p, visible: true })), isolatedPartId: null })),
  hideAllParts: () => set((s) => ({ parts: s.parts.map((p) => ({ ...p, visible: false })) })),
  toggleIsolateSelected: () => {
    const { selectedId, isolatedPartId } = get();
    if (!selectedId) return;
    if (isolatedPartId === selectedId) {
      set({ isolatedPartId: null });
    } else {
      set({ isolatedPartId: selectedId });
    }
  },
  setActiveMeasureStart: (activeMeasureStart) => set({ activeMeasureStart }),
  addMeasurement: (p1, p2) => {
    const dx = Math.round(Math.abs(p2.x - p1.x));
    const dy = Math.round(Math.abs(p2.y - p1.y));
    const dz = Math.round(Math.abs(p2.z - p1.z));
    const distance = Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z));
    const id = `measure-${Date.now().toString(36)}-${++seq}`;
    set((s) => ({
      measurements: [...s.measurements, { id, p1, p2, distance, dx, dy, dz }],
      activeMeasureStart: null,
    }));
  },
  removeMeasurement: (id) => set((s) => ({ measurements: s.measurements.filter((m) => m.id !== id) })),
  clearMeasurements: () => set({ measurements: [], activeMeasureStart: null }),

  // CAD Import Model Action
  importCADModel: (name, geom, position = { x: 0, y: 0, z: 0 }, color = '#60a5fa') => {
    const id = `cad-${Date.now().toString(36)}-${++seq}`;
    const part: DesignPart = {
      id,
      kind: 'imported-model',
      name: name || `Imported Part ${seq}`,
      color,
      visible: true,
      locked: false,
      parentId: null,
      position,
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 50, height: 50, depth: 50 },
      customGeometry: geom,
    };
    set((s) => ({
      parts: [...s.parts, part],
      customGeometries: { ...s.customGeometries, [id]: geom },
      selectedId: id,
    }));
    return id;
  },

  // Sculpt Actions
  setSculptBrush: (sculptBrush) => set({ sculptBrush }),
  setSculptRadius: (sculptRadius) => set({ sculptRadius }),
  setSculptStrength: (sculptStrength) => set({ sculptStrength }),
  setSculptDirection: (sculptDirection) => set({ sculptDirection }),
  setSculptSymmetry: (sculptSymmetry) => set({ sculptSymmetry }),
  incrementSculptVersion: () => set((s) => ({ sculptVersion: s.sculptVersion + 1 })),
  resetSculpt: () => {
    const id = get().selectedId;
    if (!id) return;
    set((s) => ({ sculptVersion: s.sculptVersion + 1 }));
  },

  // Sketch Actions & Constraints
  startSketchAdd: (op = 'extrude') => {
    set({
      tool: op === 'loft' ? 'sketch-loft' : 'sketch-add',
      pendingOp: op,
      sketchPoints: [],
      sketchClosed: false,
    });
  },
  startSketchCut: () => {
    set({
      tool: 'sketch-cut',
      pendingOp: 'cut',
      sketchPoints: [],
      sketchClosed: false,
    });
  },
  setSketchShapeMode: (sketchShapeMode) => set({ sketchShapeMode }),
  setSketchCircleRadius: (sketchCircleRadius) => set({ sketchCircleRadius }),
  toggleConstraint: (type) => {
    if (type === 'ortho') set((s) => ({ constraintOrtho: !s.constraintOrtho }));
    if (type === 'perp') set((s) => ({ constraintPerpendicular: !s.constraintPerpendicular }));
    if (type === 'parallel') set((s) => ({ constraintParallel: !s.constraintParallel }));
    if (type === 'equal') set((s) => ({ constraintEqual: !s.constraintEqual }));
  },
  addSketchPoint: (pt) => {
    const { sketchShapeMode, sketchCircleRadius, gridSnap } = get();
    const snap = gridSnap || 5;
    const snapped: Point2D = {
      x: Math.round(pt.x / snap) * snap,
      y: Math.round(pt.y / snap) * snap,
    };

    // 1. Circle Mode: One-click / Two-click circle polygon
    if (sketchShapeMode === 'circle') {
      const r = sketchCircleRadius || 25;
      const pts: Point2D[] = [];
      const segments = 32;
      for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        pts.push({
          x: snapped.x + Math.cos(a) * r,
          y: snapped.y + Math.sin(a) * r,
        });
      }
      set({ sketchPoints: pts, sketchClosed: true });
      return;
    }

    // 2. Rectangle Mode
    if (sketchShapeMode === 'rect') {
      const currentPts = get().sketchPoints;
      if (currentPts.length === 0) {
        set({ sketchPoints: [snapped], sketchClosed: false });
      } else {
        const p1 = currentPts[0];
        const p2 = snapped;
        const rectPts: Point2D[] = [
          { x: p1.x, y: p1.y },
          { x: p2.x, y: p1.y },
          { x: p2.x, y: p2.y },
          { x: p1.x, y: p2.y },
        ];
        set({ sketchPoints: rectPts, sketchClosed: true });
      }
      return;
    }

    // 3. Regular Polygon Mode
    if (sketchShapeMode === 'polygon') {
      const r = sketchCircleRadius || 30;
      const sides = 6;
      const pts: Point2D[] = [];
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
        pts.push({
          x: snapped.x + Math.cos(a) * r,
          y: snapped.y + Math.sin(a) * r,
        });
      }
      set({ sketchPoints: pts, sketchClosed: true });
      return;
    }

    // 4. Standard Line Mode with Auto-Close Detection
    const pts = [...get().sketchPoints, snapped];
    let closed = false;
    if (pts.length >= 3) {
      const first = pts[0];
      const last = pts[pts.length - 1];
      if (pts.length > 3 && Math.hypot(first.x - last.x, first.y - last.y) < snap * 1.5) {
        pts.pop();
        closed = true;
      }
    }
    set({ sketchPoints: pts, sketchClosed: closed });
  },
  addCircleSketch: (center, radius = 25) => {
    const pts: Point2D[] = [];
    const segments = 32;
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push({
        x: center.x + Math.cos(a) * radius,
        y: center.y + Math.sin(a) * radius,
      });
    }
    set({ sketchPoints: pts, sketchClosed: true });
  },
  addRectSketch: (center, width = 50, height = 40) => {
    const hw = width / 2;
    const hh = height / 2;
    const pts: Point2D[] = [
      { x: center.x - hw, y: center.y - hh },
      { x: center.x + hw, y: center.y - hh },
      { x: center.x + hw, y: center.y + hh },
      { x: center.x - hw, y: center.y + hh },
    ];
    set({ sketchPoints: pts, sketchClosed: true });
  },
  addPolygonSketch: (center, radius = 30, sides = 6) => {
    const pts: Point2D[] = [];
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
      pts.push({
        x: center.x + Math.cos(a) * radius,
        y: center.y + Math.sin(a) * radius,
      });
    }
    set({ sketchPoints: pts, sketchClosed: true });
  },
  closeSketch: () => {
    if (get().sketchPoints.length >= 3) {
      set({ sketchClosed: true });
    }
  },
  clearSketch: () => {
    set({ sketchPoints: [], sketchClosed: false, tool: 'select' });
  },
  undoSketchPoint: () => {
    const pts = get().sketchPoints.slice(0, -1);
    set({ sketchPoints: pts, sketchClosed: false });
  },
  setExtrudeDepth: (extrudeDepth) => set({ extrudeDepth }),
  setRevolveAngle: (revolveAngle) => set({ revolveAngle }),
  setLoftHeight: (loftHeight) => set({ loftHeight }),
  commitExtrude: () => {
    const { sketchPoints, pendingOp, extrudeDepth, revolveAngle, loftHeight, parts } = get();
    if (sketchPoints.length < 3) return null;

    // Calculate centroid of the 2D sketch points in world coordinates (X, Z on ground plane)
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    sketchPoints.forEach((pt) => {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minZ) minZ = pt.y; // note pt.y corresponds to Z in 3D ground plane
      if (pt.y > maxZ) maxZ = pt.y;
    });
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const depth = extrudeDepth || loftHeight || 20;

    // Center the 2D points relative to centroid (cx, cz)
    const localOuter = sketchPoints.map((pt) => ({
      x: pt.x - cx,
      y: pt.y - cz,
    }));

    const id = `profile-${Date.now().toString(36)}-${++seq}`;
    const n = parts.filter((p) => p.kind === 'profile').length + 1;
    const isCut = pendingOp === 'cut';
    const isRevolve = pendingOp === 'revolve';

    const part: DesignPart = {
      id,
      kind: 'profile',
      name: `${pendingOp.toUpperCase()} Solid ${n}`,
      color: isCut ? '#f43f5e' : PART_COLORS[parts.length % PART_COLORS.length],
      visible: true,
      locked: false,
      parentId: null,
      position: { x: cx, y: isRevolve ? 0 : depth / 2, z: cz },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: {
        extrudeDepth: depth,
        revolveAngle: revolveAngle || 360,
        revolveRadius: 0,
        loftHeight: loftHeight || depth || 40,
        loftScale: 50,
        loftTwist: 0,
        filletR: 0,
        chamferD: 0,
        shellT: 0,
      },
      outer: localOuter,
      solidOp: pendingOp,
    };

    set((s) => ({
      parts: [...s.parts, part],
      selectedId: id,
      sketchPoints: [],
      sketchClosed: false,
      tool: 'select',
    }));

    return id;
  },
}));
