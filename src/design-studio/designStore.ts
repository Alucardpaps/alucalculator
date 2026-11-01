'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as THREE from 'three';
import { type HoleItem, type SurfaceFace, type SurfaceCutItem } from './holeStandards';
import { calculateAssemblyMassProperties } from './materialsEngine';
import { getTSlotSpec, buildTSlotSection, tSlotFormulas, tSlotMassKg } from '@/cad/catalog/tSlotProfiles';
import type { ParametricRegion } from '@/cad/geometry/profileLoop';
import type { MateConstraint, MateKind, MateFeature } from './assembly/mateTypes';
import { solveAssemblyMates } from './assembly/mateSolver';
import { extractPartFeatures, localToWorld } from './assembly/featureExtractor';
import { getPartBoundingMetrics, createCustomGeometry, getSketchPlaneWorldTransform } from './geometryFactory';
import type { SheetMetalSpec } from './sheetMetalEngine';
import { SKETCH_DYNAMIC_BLOCKS } from './sketchDynamicBlocks';
import {
  chainAndResolveSketchContours,
  getContourDiagnosticMessages,
  type ProcessedContour,
  trimEntityAtPoint,
  autoTrimOverhangs,
  updateSketchEntityGeometry,
} from './sketchContourEngine';
import type { WeldBead, WeldJointType } from './weldments/weldmentTypes';
import { detectWeldableJoint } from './weldments/weldmentEngine';
import { openPartInPartStudio } from '@/cad/part/partDocBridge';

export interface MateDraft {
  kind: MateKind;
  partAId: string | null;
  featureAId: string | null;
  featureAName?: string | null;
  partBId: string | null;
  featureBId: string | null;
  featureBName?: string | null;
  offset: number;
  flip: boolean;
}

/**
 * SolidWorks / AutoCAD 2D Polygon Corner Fillet Algorithm
 * Rounds sharp corners of a 2D closed sketch polygon using tangential circular arcs.
 */
export function roundPolygonCorners(pts: Point2D[], radius: number): Point2D[] {
  if (!pts || pts.length < 3 || radius <= 0) return pts ? [...pts] : [];
  const n = pts.length;
  const result: Point2D[] = [];
  const arcSegments = 6;

  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];

    const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };
    const len1 = Math.hypot(v1.x, v1.y);
    const len2 = Math.hypot(v2.x, v2.y);

    if (len1 < 1e-3 || len2 < 1e-3) {
      result.push(curr);
      continue;
    }

    const u1 = { x: v1.x / len1, y: v1.y / len1 };
    const u2 = { x: v2.x / len2, y: v2.y / len2 };

    const dotProd = Math.max(-1, Math.min(1, u1.x * u2.x + u1.y * u2.y));
    const angle = Math.acos(dotProd);

    // If edges are collinear or nearly straight (< 10 deg or > 170 deg), keep vertex unchanged
    if (angle < 0.15 || angle > Math.PI - 0.15) {
      result.push(curr);
      continue;
    }

    const halfAngle = angle / 2;
    const maxDist = Math.min(len1, len2) * 0.45;
    const tangentDist = Math.min(maxDist, radius / Math.tan(halfAngle));
    const effectiveR = tangentDist * Math.tan(halfAngle);

    const t1 = {
      x: Math.round((curr.x + u1.x * tangentDist) * 10) / 10,
      y: Math.round((curr.y + u1.y * tangentDist) * 10) / 10,
    };
    const t2 = {
      x: Math.round((curr.x + u2.x * tangentDist) * 10) / 10,
      y: Math.round((curr.y + u2.y * tangentDist) * 10) / 10,
    };

    const bisector = { x: u1.x + u2.x, y: u1.y + u2.y };
    const bisLen = Math.hypot(bisector.x, bisector.y);
    if (bisLen < 1e-3) {
      result.push(curr);
      continue;
    }
    const uBis = { x: bisector.x / bisLen, y: bisector.y / bisLen };
    const centerDist = effectiveR / Math.sin(halfAngle);
    const arcCenter = {
      x: curr.x + uBis.x * centerDist,
      y: curr.y + uBis.y * centerDist,
    };

    const startAngle = Math.atan2(t1.y - arcCenter.y, t1.x - arcCenter.x);
    const endAngle = Math.atan2(t2.y - arcCenter.y, t2.x - arcCenter.x);

    let diff = endAngle - startAngle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    result.push(t1);
    for (let s = 1; s < arcSegments; s++) {
      const a = startAngle + (diff * s) / arcSegments;
      result.push({
        x: Math.round((arcCenter.x + Math.cos(a) * effectiveR) * 10) / 10,
        y: Math.round((arcCenter.y + Math.sin(a) * effectiveR) * 10) / 10,
      });
    }
    result.push(t2);
  }

  return result;
}

/**
 * Converts a 2D path (open polyline/arc or closed loop) into a closed ribbon polygon with wall thickness.
 * Mimics SolidWorks Thin Feature.
 */
export function convertPathToThinRibbon(
  pts: Point2D[],
  thicknessMm = 2,
  isClosed = false
): Point2D[] {
  if (!pts || pts.length < 2) return pts || [];
  const h = Math.max(0.2, thicknessMm) / 2;

  // If path is explicitly closed or first point equals last point
  const reallyClosed =
    isClosed ||
    (pts.length >= 3 &&
      Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) < 1e-2);

  const cleanPts =
    reallyClosed &&
    pts.length >= 3 &&
    Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) < 1e-2
      ? pts.slice(0, -1)
      : [...pts];

  const N = cleanPts.length;
  if (N < 2) return pts;

  const left: Point2D[] = [];
  const right: Point2D[] = [];

  for (let i = 0; i < N; i++) {
    const prev = reallyClosed ? cleanPts[(i - 1 + N) % N] : cleanPts[Math.max(0, i - 1)];
    const curr = cleanPts[i];
    const next = reallyClosed ? cleanPts[(i + 1) % N] : cleanPts[Math.min(N - 1, i + 1)];

    let nx = 0;
    let ny = 0;

    if (i === 0 && !reallyClosed) {
      const dx = next.x - curr.x;
      const dy = next.y - curr.y;
      const len = Math.hypot(dx, dy) || 1;
      nx = -dy / len;
      ny = dx / len;
    } else if (i === N - 1 && !reallyClosed) {
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      nx = -dy / len;
      ny = dx / len;
    } else {
      const d1x = curr.x - prev.x;
      const d1y = curr.y - prev.y;
      const len1 = Math.hypot(d1x, d1y) || 1;
      const n1x = -d1y / len1;
      const n1y = d1x / len1;

      const d2x = next.x - curr.x;
      const d2y = next.y - curr.y;
      const len2 = Math.hypot(d2x, d2y) || 1;
      const n2x = -d2y / len2;
      const n2y = d2x / len2;

      const avgX = n1x + n2x;
      const avgY = n1y + n2y;
      const avgLen = Math.hypot(avgX, avgY);

      if (avgLen > 1e-3) {
        const dot = n1x * (avgX / avgLen) + n1y * (avgY / avgLen);
        const miter = Math.min(2.5, 1 / Math.max(0.3, dot));
        nx = (avgX / avgLen) * miter;
        ny = (avgY / avgLen) * miter;
      } else {
        nx = n1x;
        ny = n1y;
      }
    }

    right.push({
      x: Math.round((curr.x + nx * h) * 100) / 100,
      y: Math.round((curr.y + ny * h) * 100) / 100,
    });
    left.push({
      x: Math.round((curr.x - nx * h) * 100) / 100,
      y: Math.round((curr.y - ny * h) * 100) / 100,
    });
  }

  if (reallyClosed) {
    return [...right, right[0], ...left.slice().reverse(), left[left.length - 1]];
  }

  // Open path ribbon: Right side from 0 to N-1, then Left side from N-1 down to 0
  return [...right, ...left.reverse()];
}

export function createSemiCirclePoints(p1: Point2D, p2: Point2D, segments = 24): Point2D[] {
  const cx = (p1.x + p2.x) / 2;
  const cy = (p1.y + p2.y) / 2;
  const r = Math.max(1, Math.hypot(p2.x - p1.x, p2.y - p1.y) / 2);
  const startA = Math.atan2(p1.y - cy, p1.x - cx);
  const pts: Point2D[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = startA + (Math.PI * i) / segments;
    pts.push({
      x: Math.round((cx + Math.cos(a) * r) * 100) / 100,
      y: Math.round((cy + Math.sin(a) * r) * 100) / 100,
    });
  }
  return pts;
}

export function create3PointArcPoints(p1: Point2D, p2: Point2D, p3: Point2D, segments = 24): Point2D[] {
  const d = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
  if (Math.abs(d) < 1e-4) {
    return [p1, p2, p3];
  }
  const ux =
    ((p1.x * p1.x + p1.y * p1.y) * (p2.y - p3.y) +
      (p2.x * p2.x + p2.y * p2.y) * (p3.y - p1.y) +
      (p3.x * p3.x + p3.y * p3.y) * (p1.y - p2.y)) /
    d;
  const uy =
    ((p1.x * p1.x + p1.y * p1.y) * (p3.x - p2.x) +
      (p2.x * p2.x + p2.y * p2.y) * (p1.x - p3.x) +
      (p3.x * p3.x + p3.y * p3.y) * (p2.x - p1.x)) /
    d;
  const r = Math.hypot(p1.x - ux, p1.y - uy);

  let a1 = Math.atan2(p1.y - uy, p1.x - ux);
  let a2 = Math.atan2(p2.y - uy, p2.x - ux);
  let a3 = Math.atan2(p3.y - uy, p3.x - ux);

  const twoPi = Math.PI * 2;
  while (a2 < a1) a2 += twoPi;
  while (a3 < a1) a3 += twoPi;

  let totalAngle = a3 - a1;
  let clockwise = false;
  if (a2 > a3) {
    clockwise = true;
    totalAngle = twoPi - (a3 - a1);
  }

  const pts: Point2D[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const a = clockwise ? a1 - t * totalAngle : a1 + t * totalAngle;
    pts.push({
      x: Math.round((ux + Math.cos(a) * r) * 100) / 100,
      y: Math.round((uy + Math.sin(a) * r) * 100) / 100,
    });
  }
  return pts;
}

export function create2PointCirclePoints(p1: Point2D, p2: Point2D, segments = 32): Point2D[] {
  const cx = (p1.x + p2.x) / 2;
  const cy = (p1.y + p2.y) / 2;
  const r = Math.max(1, Math.hypot(p2.x - p1.x, p2.y - p1.y) / 2);
  const pts: Point2D[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push({
      x: Math.round((cx + Math.cos(a) * r) * 100) / 100,
      y: Math.round((cy + Math.sin(a) * r) * 100) / 100,
    });
  }
  return pts;
}

export function createEllipsePoints(center: Point2D, rx = 30, ry = 20, segments = 32): Point2D[] {
  const pts: Point2D[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push({
      x: Math.round((center.x + Math.cos(a) * rx) * 100) / 100,
      y: Math.round((center.y + Math.sin(a) * ry) * 100) / 100,
    });
  }
  return pts;
}
export const customCADGeometries = new Map<string, THREE.BufferGeometry>();

import {
  saveCADGeometry,
  deleteCADGeometry,
  clearAllCADGeometries,
  loadAllCADGeometries,
} from './cadGeometryStorage';

export type DesignKind =
  | 'box' | 'cylinder' | 'tube' | 'cone' | 'sphere' | 'torus' | 'pyramid' | 'wedge'
  | 'plate' | 'hex-prism' | 'trapezoid' | 'L-bracket' | 'U-channel' | 'I-beam' | 'T-beam'
  | 'gear-blank' | 'pulley' | 'washer' | 'hex-bolt' | 'hex-nut' | 'bearing-race'
  | 'keyway-shaft' | 'd-shaft' | 'slot-plate' | 'star-prism' | 'cross-prism' | 'profile'
  | 't-slot' | 'imported-model';

export type DesignTool = 'select' | 'move' | 'rotate' | 'scale' | 'measure' | 'hole' | 'place' | 'sketch-add' | 'sketch-cut' | 'sketch-loft' | 'mate';
export type RenderMode = 'solid' | 'wire' | 'matcap' | 'pbr' | 'xray' | 'normals' | 'edges' | 'grid';
export type StudioMode = 'object' | 'inspect' | 'sculpt';
export type SculptBrush = 'clay' | 'draw' | 'inflate' | 'smooth' | 'pinch' | 'flatten' | 'grab';
export type SectionAxis = 'NONE' | 'X' | 'Y' | 'Z';
export type SketchShapeMode = 'line' | 'circle' | 'circle_2p' | 'arc_semi' | 'arc_3p' | 'ellipse' | 'rect' | 'polygon' | 'trim';

export interface Point2D {
  x: number;
  y: number;
}

export interface SketchEntity {
  id: string;
  type: 'line' | 'polyline' | 'circle' | 'circle_2p' | 'arc' | 'arc_semi' | 'arc_3p' | 'ellipse' | 'rect' | 'slot' | 'polygon' | 'block';
  points: Point2D[];
  center?: Point2D;
  radius?: number;
  radiusX?: number;
  radiusY?: number;
  startAngle?: number;
  endAngle?: number;
  width?: number;
  height?: number;
  angleDeg?: number;
  isClosed: boolean;
  isConstruction: boolean; // Sanal / Yardımcı referans çizgisi (kesik/katı oluşturmayan)
  name?: string;
  blockType?: string;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface ActiveMeasurePoint {
  x: number;
  y: number;
  z: number;
  nx?: number;
  ny?: number;
  nz?: number;
}

export interface Measurement {
  id: string;
  type?: 'distance' | 'diameter';
  p1: Point3D;
  p2: Point3D;
  distance: number;
  dx: number;
  dy: number;
  dz: number;
  normal1?: Point3D;
  normal2?: Point3D;
  perpendicularDist?: number;
  isParallelSurfaces?: boolean;
  angleDeg?: number;
  perpPoint?: Point3D;
  diameter?: number;
  radius?: number;
  center?: Point3D;
  axis?: Point3D;
}

export interface ManufacturingFormula {
  label: string;
  formula: string;
  result: string;
  unit?: string;
  standard?: string;
}

export interface SubAssembly {
  id: string;
  name: string;
  color?: string;
  visible: boolean;
  locked: boolean;
  expanded: boolean;
  parentId?: string | null;
}

export interface DesignPart {
  id: string;
  kind: DesignKind;
  name: string;
  color: string;
  opacity?: number;
  visible: boolean;
  locked: boolean;
  grounded?: boolean;
  parentId: string | null;
  subAssemblyId?: string | null;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  params: Record<string, any>;
  outer?: Point2D[];
  inner?: Point2D[][];
  profileRegion?: ParametricRegion;
  solidOp?: 'extrude' | 'revolve' | 'loft' | 'cut' | 'helix';
  modelUrl?: string;
  customGeometry?: any;
  materialId?: string;
  holes?: HoleItem[];
  cuts?: SurfaceCutItem[];
  manufacturingNotes?: string[];
  manufacturingFormulas?: ManufacturingFormula[];
  designStandard?: string;
  partDoc?: any;
}

export interface GearPairConfig {
  module: number;
  z1: number;
  z2: number;
  faceWidth?: number;
  pressureAngle?: number;
  helixAngle?: number;
  bore1?: number;
  bore2?: number;
  hasKeyway?: boolean;
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
  't-slot': { series: 40, width: 40, height: 40, slot: 8, bore: 8, length: 500, extrudeDepth: 500, slotCount: 4 },
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
    't-slot': ['T-Slot Profile', 'T-Kanal Profil'],
    'imported-model': ['CAD Model', 'CAD Model'],
  };
  const pair = map[kind] || [kind, kind];
  return tr ? pair[1] : pair[0];
}

export interface ExtrudeDialogConfig {
  mode: 'extrude' | 'cut' | 'new-part' | 'revolve' | 'revolve-cut' | 'helix' | 'helix-cut';
  depth: number;
  isThroughAll?: boolean;
  direction?: 'outward' | 'inward';
  selectedContourId?: string;
  revolveAngle?: number;
  revolveAxis?: 'X' | 'Y' | 'center';
  helixPitch?: number;
  helixTurns?: number;
  helixRadius?: number;
  draftAngle?: number;
  draftDirection?: 'inward' | 'outward';
  thinWallEnabled?: boolean;
  thinWallThickness?: number;
  thinWallType?: 'mid' | 'inside' | 'outside';
  face?: { partId?: string; face?: SurfaceFace } | null;
  contours?: any[];
  detectedContours?: ProcessedContour[];
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
  sectionSolidCap: boolean;
  gridSnap: number;
  showGrid: boolean;
  showMeshWireframe: boolean;
  showCadEdges: boolean;
  lightingPreset: string;
  backgroundPreset: string;
  projectName: string;

  // Assembly Inspection & Exploded View State
  explodeFactor: number;
  explodeDirection: 'radial' | 'axial-y' | 'axial-x' | 'axial-z' | 'linear-sequence';
  isolatedPartId: string | null;
  ghostIsolated: boolean;
  measurements: Measurement[];
  activeMeasureStart: ActiveMeasurePoint | null;
  measureMode: 'auto' | 'distance' | 'diameter';

  // Engineering Materials, Holes & Surface Cuts State
  selectedMaterialId: string;
  showCenterOfGravity: boolean;
  showTechnicalDrawingModal: boolean;
  showMaterialsModal: boolean;
  activeFace: SurfaceFace | null;
  facePickMode: boolean;
  clickToPlaceHole: boolean;
  activeHoleConfig?: { size: string; type: 'clearance' | 'tap' | 'counterbore' | 'countersink' };
  holes: HoleItem[];
  cuts: SurfaceCutItem[];
  pendingCut: SurfaceCutItem | null;
  setActiveFace: (activeFace: SurfaceFace | null) => void;
  setFacePickMode: (facePickMode: boolean) => void;
  setClickToPlaceHole: (clickToPlaceHole: boolean) => void;
  setActiveHoleConfig: (cfg: { size: string; type: 'clearance' | 'tap' | 'counterbore' | 'countersink' }) => void;
  addHole: (holeOrPartId: HoleItem | string, maybeHole?: Partial<HoleItem> & { throughAll?: boolean }) => void;
  removeHole: (id: string) => void;
  clearHoles: () => void;
  addCut: (cutOrPartId: SurfaceCutItem | string, maybeCut?: Partial<SurfaceCutItem>) => void;
  removeCut: (id: string) => void;
  clearCuts: () => void;
  setPendingCut: (cut: SurfaceCutItem | null) => void;
  updateCut: (partId: string, cutId: string, patch: Partial<SurfaceCutItem>) => void;
  updateHole: (partId: string, holeId: string, patch: Partial<HoleItem>) => void;

  // Sub-Assembly Hierarchy State & Actions (Autodesk Inventor Workflow)
  subAssemblies: SubAssembly[];
  addSubAssembly: (name?: string, parentId?: string | null) => string;
  removeSubAssembly: (id: string, dissolveOnly?: boolean) => void;
  renameSubAssembly: (id: string, name: string) => void;
  movePartToSubAssembly: (partId: string, subAssemblyId: string | null) => void;
  toggleSubAssemblyVisible: (id: string) => void;
  toggleSubAssemblyLocked: (id: string) => void;
  toggleSubAssemblyExpanded: (id: string) => void;
  demoteToSubAssembly: (partIds: string[], subAssyName?: string) => string;
  pruneEmptySubAssemblies: () => void;
  promotePart: (partId: string) => void;
  togglePartGrounded: (id: string) => void;

  // Tree Expansion State
  expandedPartIds: string[];
  togglePartExpanded: (partId: string) => void;
  expandAllParts: () => void;
  collapseAllParts: () => void;

  // Selected Feature for Fine-Grained Inspector
  selectedFeature: { type: 'sketch' | 'boss' | 'cut' | 'hole'; id?: string; partId?: string } | null;
  setSelectedFeature: (feature: { type: 'sketch' | 'boss' | 'cut' | 'hole'; id?: string; partId?: string } | null) => void;

  // Autodesk Inventor In-Place Part & Sub-Assembly Editing
  editingPartId: string | null;
  setEditingPartId: (id: string | null) => void;
  editingSubAssemblyId: string | null;
  setEditingSubAssemblyId: (id: string | null) => void;
  startEditPartSketch: (partId: string) => void;

  // 3D Assembly Kinematic Mates & SolidWorks Mate PropertyManager
  mates: MateConstraint[];
  selectedMateId: string | null;
  setSelectedMateId: (id: string | null) => void;
  isMateModalOpen: boolean;
  openMateModal: (initialDraft?: Partial<MateDraft>) => void;
  closeMateModal: () => void;
  activeMateDraft: MateDraft | null;
  updateMateDraft: (patch: Partial<MateDraft>) => void;
  commitMateDraft: () => boolean;
  addMate: (mate: MateConstraint) => void;
  removeMate: (mateId: string) => void;
  toggleMateSuppressed: (mateId: string) => void;
  toggleMateFlip: (mateId: string) => void;
  updateMateOffset: (mateId: string, offset: number) => void;
  updateMateKind: (mateId: string, kind: MateKind) => void;
  clearMates: () => void;
  setMates: (mates: MateConstraint[]) => void;
  applyMates: () => void;

  // SolidWorks Smart Fasteners Modal & Ready-Made Assembly Actions
  isFastenersModalOpen: boolean;
  openFastenersModal: () => void;
  closeFastenersModal: () => void;
  loadDemoAssemblyWithFasteners: () => void;

  // 3 Primary CAD Modes: 1. PARÇA (Part) | 2. KAYNAK + ÇATMA + İŞLEME (Weldment) | 3. MONTAJ (Assembly)
  cadMode: 'part' | 'weldment' | 'assembly';
  setCadMode: (mode: 'part' | 'weldment' | 'assembly') => void;

  // Dedicated Studios State (SolidWorks / Inventor Workflow)
  isPartStudioOpen: boolean;
  setPartStudioOpen: (open: boolean) => void;
  isWeldStudioOpen: boolean;
  setWeldStudioOpen: (open: boolean) => void;
  openPartStudioForPart: (partId: string, opts?: { featureId?: string; featureSubtype?: 'sketch' | 'feature' }) => void;

  // Mode 2: Weldment & Structural Fabrication State
  weldBeads: WeldBead[];
  selectedWeldId: string | null;
  setSelectedWeldId: (id: string | null) => void;
  isWeldModalOpen: boolean;
  openWeldModal: (initialDraft?: Partial<WeldBead>) => void;
  closeWeldModal: () => void;
  addWeldBead: (bead: Omit<WeldBead, 'id' | 'createdAt'> | WeldBead) => string;
  removeWeldBead: (id: string) => void;
  updateWeldBead: (id: string, patch: Partial<WeldBead>) => void;
  clearWeldBeads: () => void;
  autoWeldAdjacentParts: (partAId: string, partBId: string, legSizeMm?: number, type?: WeldJointType) => string | null;
  cutWeldBead: (weldId: string, cut: SurfaceCutItem) => void;
  drillWeldBeadHole: (weldId: string, hole: HoleItem) => void;
  loadSampleWeldedChassis: () => void;

  // 3D Sheet Metal Studio Modal Actions & State
  showSheetMetalModal: boolean;
  sheetMetalEditingPartId: string | null;
  sheetMetalInitialSpec: SheetMetalSpec | null;
  sheetMetalInitialTab: 'bends' | 'cutouts' | 'pressbrake';
  openSheetMetalModal: (partId?: string | null, spec?: SheetMetalSpec | null, tab?: 'bends' | 'cutouts' | 'pressbrake') => void;
  closeSheetMetalModal: () => void;

  // 3D Dynamic Block Studio Modal Actions & State
  showDynamicBlockModal: boolean;
  dynamicBlockEditingPartId: string | null;
  dynamicBlockId: string | null;
  dynamicBlockInitialParams: Record<string, any> | null;
  openDynamicBlockModal: (partId?: string | null, blockId?: string | null, params?: Record<string, any> | null) => void;
  closeDynamicBlockModal: () => void;


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
  sketchEntities: SketchEntity[];
  selectedSketchEntityId: string | null;
  isConstructionMode: boolean;
  keepSketchAfterExtrude: boolean;
  showSketchDimensions: boolean;
  sketchNumericCoords: { x: number; y: number };
  extrudeDepth: number;
  revolveAngle: number;
  loftHeight: number;
  pendingOp: 'extrude' | 'revolve' | 'loft' | 'cut' | 'helix';
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
  addTSlotPart: (sizeOrId: number | string, lengthMm?: number) => string;
  addGearPair: (config: GearPairConfig) => { pinionId: string; gearId: string };
  addDynamicBlock3D: (dynamicParts: any[], groupName?: string) => string[];
  select: (id: string | null) => void;
  setTool: (tool: DesignTool) => void;
  setPlaceKind: (kind: DesignKind) => void;
  setRenderMode: (mode: RenderMode) => void;
  setStudioMode: (mode: StudioMode) => void;
  setSectionAxis: (axis: SectionAxis) => void;
  setSectionOffset: (offset: number) => void;
  setSectionInvert: (invert: boolean) => void;
  setSectionSolidCap: (solidCap: boolean) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  updateSelectedParams: (patch: Record<string, any>) => void;
  updatePartParams: (partId: string, patch: Record<string, any>) => void;
  updateSelectedTransform: (patch: { position?: Partial<Point3D>; rotation?: Partial<Point3D>; scale?: Partial<Point3D> }) => void;
  bakeScaleToParams: (partId: string) => void;
  setSelectedColor: (color: string) => void;
  setSelectedName: (name: string) => void;
  toggleVisible: (id: string) => void;
  toggleLocked: (id: string) => void;
  clearScene: () => void;
  setGridSnap: (n: number) => void;
  setShowGrid: (v: boolean) => void;
  setShowMeshWireframe: (v: boolean) => void;
  setShowCadEdges: (v: boolean) => void;
  toggleMeshWireframe: () => void;
  toggleCadEdges: () => void;
  setLightingPreset: (v: string) => void;
  setBackgroundPreset: (v: string) => void;
  setProjectName: (projectName: string) => void;
  getSelected: () => DesignPart | null;
  updatePart: (id: string, patch: Partial<DesignPart>) => void;

  // Engineering Materials & Mass Properties Actions
  setSelectedMaterialId: (id: string) => void;
  setShowCenterOfGravity: (show: boolean) => void;
  setShowTechnicalDrawingModal: (show: boolean) => void;
  setShowMaterialsModal: (show: boolean) => void;


  // Inspection & Assembly Actions
  setExplodeFactor: (f: number) => void;
  setExplodeDirection: (dir: 'radial' | 'axial-y' | 'axial-x' | 'axial-z' | 'linear-sequence') => void;
  setIsolatedPartId: (id: string | null) => void;
  setGhostIsolated: (v: boolean) => void;
  showAllParts: () => void;
  hideAllParts: () => void;
  toggleIsolateSelected: () => void;
  setMeasureMode: (mode: 'auto' | 'distance' | 'diameter') => void;
  setActiveMeasureStart: (pt: ActiveMeasurePoint | null) => void;
  addMeasurement: (p1: ActiveMeasurePoint, p2: ActiveMeasurePoint) => void;
  addDiameterMeasurement: (center: Point3D, diameter: number, normal?: Point3D, hitPoint?: Point3D) => void;
  removeMeasurement: (id: string) => void;
  clearMeasurements: () => void;
  importCADModel: (name: string, geom: any, position?: Point3D, color?: string, initialParams?: Record<string, number>) => string;
  renderTrigger: number;
  hydrateCADGeometries: () => Promise<void>;

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
  applySketchFillet: (radius: number) => void;
  closeSketch: () => void;
  clearSketch: () => void;
  undoSketchPoint: () => void;
  setExtrudeDepth: (depth: number) => void;
  setRevolveAngle: (angle: number) => void;
  setLoftHeight: (height: number) => void;
  commitExtrude: () => string | null;

  // Multi-entity, Construction Line & Dynamic Block Sketch Actions
  toggleConstructionMode: () => void;
  setKeepSketchAfterExtrude: (val: boolean) => void;
  setShowSketchDimensions: (val: boolean) => void;
  setSketchNumericCoords: (coords: { x: number; y: number }) => void;
  endCurrentLineSegment: () => void;
  addCircleEntity: (center: Point2D, radius?: number, isConstruction?: boolean) => string;
  add2PointCircleEntity: (p1: Point2D, p2: Point2D, isConstruction?: boolean) => string;
  addSemiCircleEntity: (p1: Point2D, p2: Point2D, isConstruction?: boolean) => string;
  add3PointArcEntity: (p1: Point2D, p2: Point2D, p3: Point2D, isConstruction?: boolean) => string;
  addArcEntity: (center: Point2D, radius?: number, startAngle?: number, endAngle?: number, isConstruction?: boolean) => string;
  addEllipseEntity: (center: Point2D, rx?: number, ry?: number, isConstruction?: boolean) => string;
  addRectEntity: (center: Point2D, width?: number, height?: number, isConstruction?: boolean) => string;
  addPolygonEntity: (center: Point2D, radius?: number, sides?: number, isConstruction?: boolean) => string;
  addCoordinateSketchPoint: (x: number, y: number, isConstruction?: boolean) => void;
  addSketchEntity: (entity: SketchEntity) => void;
  addSketchEntities: (entities: SketchEntity[]) => void;
  stampDynamicBlockToSketch: (blockId: string, center: Point2D, params?: Record<string, number>) => string[];
  subdivideSelectedPartMesh: () => void;
  selectSketchEntity: (id: string | null) => void;
  updateSketchEntity: (id: string, patch: Parameters<typeof updateSketchEntityGeometry>[1]) => void;
  deleteSketchEntity: (id: string) => void;
  trimSketchEntityAt: (point: Point2D) => boolean;
  autoTrimOverhangsAction: () => number;

  // 3D Extrude & Cut Property Manager Dialog
  isExtrudeDialogOpen: boolean;
  extrudeDialogConfig: ExtrudeDialogConfig;
  openExtrudeDialog: (initialMode?: ExtrudeDialogConfig['mode']) => void;
  closeExtrudeDialog: () => void;
  setExtrudeDialogConfig: (patch: Partial<ExtrudeDialogConfig>) => void;
  applyExtrudeOrCut: (cfg?: Partial<ExtrudeDialogConfig>) => string | null;

  // Enhanced Productivity & Component Actions
  duplicateSelectedPart: () => string | null;
  addStandardBearing: (config: {
    designation: string;
    d: number;
    D: number;
    B: number;
    type?: string;
    Cr?: number;
    C0?: number;
  }) => string;
  addStructuralProfile: (config: {
    type: 'I-beam' | 'U-channel' | 'L-bracket' | 'box' | 'tube';
    designation: string;
    lengthMm: number;
    params: Record<string, number>;
    notes?: string[];
    standard?: string;
  }) => string;
  addKeywayPin: (config: {
    width: number;
    height: number;
    length: number;
    designation?: string;
  }) => string;
  checkInterference: () => Array<{
    partA: { id: string; name: string };
    partB: { id: string; name: string };
    distanceMm: number;
  }>;

  // Continuous Engineering & Multi-Workbench Synchronous Loop
  activeWorkbench: 'cad' | 'weldment' | 'assembly' | 'fea' | 'cam' | 'factory' | 'cost' | 'drawing' | 'sculpt';
  setActiveWorkbench: (wb: 'cad' | 'weldment' | 'assembly' | 'fea' | 'cam' | 'factory' | 'cost' | 'drawing' | 'sculpt') => void;
  feaAppliedLoadKn: number;
  feaLoadType: 'bending' | 'tension' | 'torsion';
  setFeaAppliedLoadKn: (kn: number) => void;
  setFeaLoadType: (type: 'bending' | 'tension' | 'torsion') => void;
  showLiveFeaStress: boolean;
  setShowLiveFeaStress: (show: boolean) => void;
  camToolDiaMm: number;
  setCamToolDiaMm: (dia: number) => void;
  showCamToolpath: boolean;
  setShowCamToolpath: (show: boolean) => void;
}

export const DEFAULT_DEMO_PART: DesignPart = {
  id: 'demo-plate-80x40',
  kind: 'box',
  name: 'Plate 80x40x10 (Ø8 Hole Demo)',
  color: '#6b9fff',
  visible: true,
  locked: false,
  parentId: null,
  subAssemblyId: null,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  params: { width: 80, height: 40, depth: 10 },
  holes: [
    {
      id: 'hole-demo-1',
      size: 'M8',
      x: 40,
      y: 20,
      face: 'top',
      type: 'clearance',
      isThroughAll: true,
      depth: 10,
      diameter: 9.0,
    }
  ],
  materialId: 'al-6061-t6',
  manufacturingNotes: [
    'Material: Aluminum 6061-T6 Plate',
    'General Tolerances: ISO 2768-m',
    'Center Bore: Ø9.0 mm Clearance for ISO 4014 M8 Fastener'
  ],
  designStandard: 'ISO 2768-m / ISO 273'
};

export const useDesignStore = create<DesignState>()(
  persist(
    (set, get) => ({
  parts: [DEFAULT_DEMO_PART],
  selectedId: 'demo-plate-80x40',
  tool: 'select',
  placeKind: 'box',
  renderMode: 'solid',
  studioMode: 'object',
  sectionAxis: 'NONE',
  sectionOffset: 0,
  sectionInvert: false,
  sectionSolidCap: true,
  gridSnap: 5,
  showGrid: true,
  showMeshWireframe: false,
  showCadEdges: true,
  lightingPreset: 'studio',
  backgroundPreset: 'theme',
  projectName: 'Untitled Design',

  // Inspection & Assembly State
  explodeFactor: 0,
  explodeDirection: 'radial' as const,
  isolatedPartId: null,
  ghostIsolated: true,
  measurements: [],
  activeMeasureStart: null,
  measureMode: 'auto',
  customGeometries: {},
  renderTrigger: 0,

  // Materials & Analysis State
  selectedMaterialId: 'al-6061-t6',
  showCenterOfGravity: false,

  // Continuous Engineering & Multi-Workbench State
  activeWorkbench: 'cad' as const,
  cadMode: 'part' as const,
  isPartStudioOpen: false,
  setPartStudioOpen: (isPartStudioOpen) => set((s) => ({
    isPartStudioOpen,
    isWeldStudioOpen: isPartStudioOpen ? false : s.isWeldStudioOpen,
    cadMode: isPartStudioOpen ? 'part' : s.cadMode,
    activeWorkbench: isPartStudioOpen ? 'cad' : s.activeWorkbench,
  })),
  isWeldStudioOpen: false,
  setWeldStudioOpen: (isWeldStudioOpen) => set((s) => ({
    isWeldStudioOpen,
    isPartStudioOpen: isWeldStudioOpen ? false : s.isPartStudioOpen,
    cadMode: isWeldStudioOpen ? 'weldment' : s.cadMode,
    activeWorkbench: isWeldStudioOpen ? 'weldment' : s.activeWorkbench,
  })),
  openPartStudioForPart: (partId, opts) => {
    try {
      openPartInPartStudio(partId, opts);
    } catch (e) {
      console.warn('Failed to open Part Studio for part:', e);
    }
  },
  setCadMode: (cadMode) => set({ 
    cadMode,
    activeWorkbench: cadMode === 'assembly' ? 'assembly' : cadMode === 'weldment' ? 'weldment' : 'cad',
    isPartStudioOpen: cadMode === 'part',
    isWeldStudioOpen: cadMode === 'weldment',
    selectedWeldId: null,
    isWeldModalOpen: false,
  }),
  setActiveWorkbench: (activeWorkbench) => set((s) => ({ 
    activeWorkbench,
    cadMode: activeWorkbench === 'assembly' ? 'assembly' : activeWorkbench === 'weldment' ? 'weldment' : activeWorkbench === 'cad' ? 'part' : s.cadMode,
    isPartStudioOpen: activeWorkbench === 'cad',
    isWeldStudioOpen: activeWorkbench === 'weldment',
    studioMode: activeWorkbench === 'sculpt' ? 'sculpt' : 'object',
    showLiveFeaStress: activeWorkbench === 'fea',
    showCamToolpath: activeWorkbench === 'cam',
  })),
  feaAppliedLoadKn: 15.0,
  feaLoadType: 'bending' as const,
  setFeaAppliedLoadKn: (feaAppliedLoadKn) => set({ feaAppliedLoadKn }),
  setFeaLoadType: (feaLoadType) => set({ feaLoadType }),
  showLiveFeaStress: false,
  setShowLiveFeaStress: (showLiveFeaStress) => set({ showLiveFeaStress }),
  camToolDiaMm: 10,
  setCamToolDiaMm: (camToolDiaMm) => set({ camToolDiaMm }),
  showCamToolpath: false,
  setShowCamToolpath: (showCamToolpath) => set({ showCamToolpath }),
  showTechnicalDrawingModal: false,
  showMaterialsModal: false,
  showSheetMetalModal: false,
  sheetMetalEditingPartId: null,
  sheetMetalInitialSpec: null,
  sheetMetalInitialTab: 'bends',
  openSheetMetalModal: (partId, spec, tab = 'bends') => set({
    showSheetMetalModal: true,
    sheetMetalEditingPartId: partId || null,
    sheetMetalInitialSpec: spec || null,
    sheetMetalInitialTab: tab,
  }),
  closeSheetMetalModal: () => set({
    showSheetMetalModal: false,
    sheetMetalEditingPartId: null,
    sheetMetalInitialSpec: null,
    sheetMetalInitialTab: 'bends',
  }),

  showDynamicBlockModal: false,
  dynamicBlockEditingPartId: null,
  dynamicBlockId: null,
  dynamicBlockInitialParams: null,
  openDynamicBlockModal: (partId, blockId, params) => set({
    showDynamicBlockModal: true,
    dynamicBlockEditingPartId: partId || null,
    dynamicBlockId: blockId || null,
    dynamicBlockInitialParams: params || null,
  }),
  closeDynamicBlockModal: () => set({
    showDynamicBlockModal: false,
    dynamicBlockEditingPartId: null,
    dynamicBlockId: null,
    dynamicBlockInitialParams: null,
  }),

  activeFace: null,
  facePickMode: false,
  clickToPlaceHole: false,
  holes: [],
  cuts: [],
  pendingCut: null,
  mates: [],
  selectedMateId: null,
  setSelectedMateId: (id) => set({ selectedMateId: id }),
  isMateModalOpen: false,
  activeMateDraft: null,
  openMateModal: (initialDraft) => {
    const { parts, selectedId } = get();
    const partA = selectedId ? parts.find((p) => p.id === selectedId) : null;

    set({
      tool: 'mate',
      isMateModalOpen: true,
      activeMateDraft: {
        kind: initialDraft?.kind || 'concentric',
        partAId: initialDraft?.partAId ?? (partA?.id || null),
        featureAId: initialDraft?.featureAId ?? null,
        featureAName: initialDraft?.featureAName ?? null,
        partBId: initialDraft?.partBId ?? null,
        featureBId: initialDraft?.featureBId ?? null,
        featureBName: initialDraft?.featureBName ?? null,
        offset: initialDraft?.offset ?? 0,
        flip: initialDraft?.flip ?? false,
      },
    });
  },
  closeMateModal: () => {
    set({ tool: 'select', isMateModalOpen: false, activeMateDraft: null });
    get().applyMates();
  },
  updateMateDraft: (patch) => {
    set((s) => ({
      activeMateDraft: s.activeMateDraft ? { ...s.activeMateDraft, ...patch } : null,
    }));
    // If draft is complete, solve live preview so parts immediately snap in 3D!
    const { activeMateDraft, parts, mates } = get();
    if (
      activeMateDraft &&
      activeMateDraft.partAId &&
      activeMateDraft.partBId &&
      activeMateDraft.featureAId &&
      activeMateDraft.featureBId &&
      activeMateDraft.partAId !== activeMateDraft.partBId
    ) {
      const partA = parts.find((p) => p.id === activeMateDraft.partAId);
      const partB = parts.find((p) => p.id === activeMateDraft.partBId);
      if (partA && partB) {
        const featsA = extractPartFeatures(partA, true);
        const featsB = extractPartFeatures(partB, true);
        const featA = featsA.find((f) => f.id === activeMateDraft.featureAId) || featsA[0];
        const featB = featsB.find((f) => f.id === activeMateDraft.featureBId) || featsB[0];
        if (featA && featB) {
          const previewConstraint: MateConstraint = {
            id: 'draft-preview',
            kind: activeMateDraft.kind,
            name: 'Preview Mate',
            partAId: activeMateDraft.partAId,
            featureA: featA,
            partBId: activeMateDraft.partBId,
            featureB: featB,
            offset: activeMateDraft.offset || 0,
            flip: activeMateDraft.flip || false,
            active: true,
            suppressed: false,
          };
          const res = solveAssemblyMates(parts, [...mates, previewConstraint], activeMateDraft.partAId);
          set({ parts: res.parts });
        }
      }
    }
  },
  commitMateDraft: () => {
    const { activeMateDraft, parts } = get();
    if (!activeMateDraft) return false;
    const { kind, partAId, featureAId, partBId, featureBId, offset, flip } = activeMateDraft;
    if (!partAId || !partBId || partAId === partBId || !featureAId || !featureBId) return false;

    const partA = parts.find((p) => p.id === partAId);
    const partB = parts.find((p) => p.id === partBId);
    if (!partA || !partB) return false;

    const featsA = extractPartFeatures(partA, true);
    const featsB = extractPartFeatures(partB, true);

    const featA = featsA.find((f) => f.id === featureAId) || featsA[0];
    const featB = featsB.find((f) => f.id === featureBId) || featsB[0];
    if (!featA || !featB) return false;

    const mateId = `mate-${Date.now().toString(36)}-${++seq}`;
    const mateName = `${kind.toUpperCase()}: ${featA.name} ↔ ${featB.name}`;

    const newMate: MateConstraint = {
      id: mateId,
      kind,
      name: mateName,
      partAId,
      featureA: featA,
      partBId,
      featureB: featB,
      offset,
      flip,
      active: true,
      suppressed: false,
    };

    get().addMate(newMate);
    set({
      selectedMateId: mateId,
      activeMateDraft: {
        kind: 'concentric',
        partAId: null,
        featureAId: null,
        featureAName: null,
        partBId: null,
        featureBId: null,
        featureBName: null,
        offset: 0,
        flip: false,
      },
    });
    return true;
  },
  addMate: (mate) => {
    set((state) => ({ mates: [...state.mates, mate] }));
    get().applyMates();
  },
  removeMate: (mateId) => {
    set((state) => ({
      mates: state.mates.filter((m) => m.id !== mateId),
      selectedMateId: state.selectedMateId === mateId ? null : state.selectedMateId,
    }));
    get().applyMates();
  },
  toggleMateSuppressed: (mateId) => {
    set((state) => ({
      mates: state.mates.map((m) => (m.id === mateId ? { ...m, suppressed: !m.suppressed } : m)),
    }));
    get().applyMates();
  },
  toggleMateFlip: (mateId) => {
    set((state) => ({
      mates: state.mates.map((m) => (m.id === mateId ? { ...m, flip: !m.flip } : m)),
    }));
    get().applyMates();
  },
  updateMateOffset: (mateId, offset) => {
    set((state) => ({
      mates: state.mates.map((m) => (m.id === mateId ? { ...m, offset } : m)),
    }));
    get().applyMates();
  },
  updateMateKind: (mateId, kind) => {
    set((state) => ({
      mates: state.mates.map((m) => (m.id === mateId ? { ...m, kind } : m)),
    }));
    get().applyMates();
  },
  clearMates: () => set({ mates: [], selectedMateId: null }),
  setMates: (mates) => set({ mates }),
  applyMates: () => {
    const { parts, mates } = get();
    if (!mates || mates.length === 0) return;
    const res = solveAssemblyMates(parts, mates);
    set({ parts: res.parts });
  },

  // SolidWorks Smart Fasteners Modal & Ready-Made Assembly Actions
  isFastenersModalOpen: false,
  openFastenersModal: () => set({ isFastenersModalOpen: true }),
  closeFastenersModal: () => set({ isFastenersModalOpen: false }),
  loadDemoAssemblyWithFasteners: () => {
    const idA = `plate-a-${Date.now().toString(36)}-${++seq}`;
    const idB = `plate-b-${Date.now().toString(36)}-${++seq}`;

    const holesA: HoleItem[] = [
      { id: 'h1', type: 'clearance', size: 'M6', face: 'top', x: -18, y: 0, depth: 10, isThroughAll: true },
      { id: 'h2', type: 'clearance', size: 'M6', face: 'top', x: 18, y: 0, depth: 10, isThroughAll: true },
    ];
    const holesB: HoleItem[] = [
      { id: 'h1', type: 'clearance', size: 'M6', face: 'top', x: -18, y: 0, depth: 10, isThroughAll: true },
      { id: 'h2', type: 'clearance', size: 'M6', face: 'top', x: 18, y: 0, depth: 10, isThroughAll: true },
    ];

    const partA: DesignPart = {
      id: idA,
      kind: 'box',
      name: 'Flange Plate A (80×50×10mm)',
      color: '#3b82f6',
      visible: true,
      locked: true,
      grounded: true,
      parentId: null,
      subAssemblyId: null,
      position: { x: 0, y: 5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 80, height: 10, depth: 50 },
      holes: holesA,
    };

    const partB: DesignPart = {
      id: idB,
      kind: 'box',
      name: 'Bracket Plate B (80×50×10mm)',
      color: '#10b981',
      visible: true,
      locked: false,
      grounded: false,
      parentId: null,
      subAssemblyId: null,
      position: { x: 0, y: 15, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 80, height: 10, depth: 50 },
      holes: holesB,
    };

    set({
      parts: [partA, partB],
      selectedId: idB,
      mates: [],
      isolatedPartId: null,
      editingPartId: null,
    });

    // Auto-mount fasteners after parts exist
    import('./assembly/fastenerDetect').then((m) => {
      m.executeAutoFastenerAssembly();
    });
  },

  // Mode 2: Weldment & Structural Fabrication Implementation
  weldBeads: [],
  selectedWeldId: null,
  setSelectedWeldId: (selectedWeldId) => set({ selectedWeldId }),
  isWeldModalOpen: false,
  openWeldModal: (initialDraft) => {
    set({ isWeldModalOpen: true });
  },
  closeWeldModal: () => set({ isWeldModalOpen: false }),
  addWeldBead: (beadData) => {
    get().pushHistory();
    const id = 'id' in beadData && beadData.id ? beadData.id : `weld-${Date.now().toString(36)}-${++seq}`;
    const newBead: WeldBead = {
      id,
      name: beadData.name || `Kaynak Dikişi (${beadData.legSizeMm || 5}mm ${beadData.type})`,
      type: beadData.type || 'fillet',
      standard: (beadData.standard as any) || 'ISO 2553',
      partAId: beadData.partAId,
      partBId: beadData.partBId,
      position: beadData.position || { x: 0, y: 0, z: 0 },
      rotation: beadData.rotation || { x: 0, y: 0, z: 0 },
      legSizeMm: beadData.legSizeMm || 5,
      lengthMm: beadData.lengthMm || 80,
      throatThicknessA: beadData.throatThicknessA || Math.round((beadData.legSizeMm || 5) * 0.7071 * 10) / 10,
      grooveAngleDeg: beadData.grooveAngleDeg,
      rootOpeningMm: beadData.rootOpeningMm,
      intermittent: beadData.intermittent,
      segmentLengthMm: beadData.segmentLengthMm,
      pitchMm: beadData.pitchMm,
      material: beadData.material || 'ER70S-6',
      color: beadData.color || '#f59e0b',
      cuts: beadData.cuts || [],
      holes: beadData.holes || [],
      createdAt: Date.now(),
    };
    set((s) => ({
      weldBeads: [...s.weldBeads, newBead],
      selectedWeldId: id,
      cadMode: 'weldment',
    }));
    return id;
  },
  removeWeldBead: (id) => {
    get().pushHistory();
    set((s) => ({
      weldBeads: s.weldBeads.filter((w) => w.id !== id),
      selectedWeldId: s.selectedWeldId === id ? null : s.selectedWeldId,
    }));
  },
  updateWeldBead: (id, patch) => {
    set((s) => ({
      weldBeads: s.weldBeads.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    }));
  },
  clearWeldBeads: () => set({ weldBeads: [], selectedWeldId: null }),
  autoWeldAdjacentParts: (partAId, partBId, legSizeMm = 6, type = 'fillet') => {
    const { parts } = get();
    const partA = parts.find((p) => p.id === partAId);
    const partB = parts.find((p) => p.id === partBId);
    if (!partA || !partB) return null;
    const detected = detectWeldableJoint(partA, partB);
    if (!detected) return null;
    return get().addWeldBead({
      name: `Otomatik Köşe Kaynağı: ${partA.name} ↔ ${partB.name}`,
      type: type || detected.suggestedType,
      standard: 'ISO 2553',
      partAId,
      partBId,
      position: detected.position,
      rotation: detected.rotation,
      legSizeMm: legSizeMm || detected.defaultLegSizeMm,
      lengthMm: detected.lengthMm,
      material: 'ER70S-6',
      color: '#f59e0b',
    });
  },
  cutWeldBead: (weldId, cut) => {
    get().pushHistory();
    set((s) => ({
      weldBeads: s.weldBeads.map((w) => {
        if (w.id !== weldId) return w;
        const existing = w.cuts || [];
        return { ...w, cuts: [...existing, cut] };
      }),
    }));
  },
  drillWeldBeadHole: (weldId, hole) => {
    get().pushHistory();
    set((s) => ({
      weldBeads: s.weldBeads.map((w) => {
        if (w.id !== weldId) return w;
        const existing = w.holes || [];
        return { ...w, holes: [...existing, hole] };
      }),
    }));
  },
  loadSampleWeldedChassis: () => {
    get().pushHistory();
    const baseId = `plate-base-${Date.now().toString(36)}`;
    const colId = `col-vert-${Date.now().toString(36)}`;
    const weld1Id = `weld-f1-${Date.now().toString(36)}`;
    const weld2Id = `weld-f2-${Date.now().toString(36)}`;

    const basePlate: DesignPart = {
      id: baseId,
      kind: 'box',
      name: 'Taban Plakası / Alt Şasi (S235JR)',
      color: '#64748b',
      visible: true,
      locked: false,
      grounded: true,
      parentId: null,
      subAssemblyId: null,
      position: { x: 0, y: 6, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 140, height: 12, depth: 160 },
      materialId: 'steel-s235jr',
      holes: [
        { id: 'h-flange-1', size: 'M12', type: 'clearance', face: 'top', x: -50, y: -60, depth: 12, isThroughAll: true },
        { id: 'h-flange-2', size: 'M12', type: 'clearance', face: 'top', x: 50, y: -60, depth: 12, isThroughAll: true },
        { id: 'h-flange-3', size: 'M12', type: 'clearance', face: 'top', x: -50, y: 60, depth: 12, isThroughAll: true },
        { id: 'h-flange-4', size: 'M12', type: 'clearance', face: 'top', x: 50, y: 60, depth: 12, isThroughAll: true },
      ],
    };

    const vertColumn: DesignPart = {
      id: colId,
      kind: 'box',
      name: 'Dikey Çatma Kolon (Kutu Profil)',
      color: '#475569',
      visible: true,
      locked: false,
      grounded: false,
      parentId: null,
      subAssemblyId: null,
      position: { x: 0, y: 52, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 60, height: 80, depth: 60 },
      materialId: 'steel-s235jr',
    };

    // Two Continuous Fillet Welds bonding Column to Base Plate
    const filletWeld1: WeldBead = {
      id: weld1Id,
      name: 'Köşe Kaynağı (Ön Dikiş a=6mm)',
      type: 'fillet',
      standard: 'ISO 2553',
      partAId: baseId,
      partBId: colId,
      position: { x: 0, y: 12, z: 30 },
      rotation: { x: 0, y: 90, z: 0 },
      legSizeMm: 6,
      lengthMm: 60,
      throatThicknessA: 4.2,
      material: 'ER70S-6',
      color: '#f59e0b',
      createdAt: Date.now(),
      // KESİLEBİLİR KAYNAK: Post-weld machined slot cutting through the weld!
      cuts: [
        {
          id: 'cut-weld-relief',
          type: 'slot',
          face: 'top',
          x: 0,
          y: 0,
          width: 16,
          length: 24,
          depth: 10,
          isThroughAll: true,
        },
      ],
    };

    const filletWeld2: WeldBead = {
      id: weld2Id,
      name: 'Köşe Kaynağı (Arka Dikiş a=6mm)',
      type: 'fillet',
      standard: 'ISO 2553',
      partAId: baseId,
      partBId: colId,
      position: { x: 0, y: 12, z: -30 },
      rotation: { x: 0, y: 90, z: 180 },
      legSizeMm: 6,
      lengthMm: 60,
      throatThicknessA: 4.2,
      material: 'ER70S-6',
      color: '#f59e0b',
      createdAt: Date.now(),
      // KESİLEBİLİR KAYNAK: Post-weld drilled hole penetrating right through weld bead!
      holes: [
        {
          id: 'hole-weld-drill',
          size: 'M10',
          type: 'clearance',
          face: 'top',
          x: 10,
          y: 0,
          depth: 15,
          isThroughAll: true,
        },
      ],
    };

    set({
      parts: [basePlate, vertColumn],
      weldBeads: [filletWeld1, filletWeld2],
      selectedId: colId,
      selectedWeldId: weld1Id,
      cadMode: 'weldment',
      activeWorkbench: 'cad',
      mates: [],
    });
  },


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
  sketchEntities: [],
  selectedSketchEntityId: null,
  isConstructionMode: false,
  keepSketchAfterExtrude: false,
  showSketchDimensions: false,
  sketchNumericCoords: { x: 0, y: 0 },
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
  isExtrudeDialogOpen: false,
  extrudeDialogConfig: {
    mode: 'extrude',
    depth: 20,
    isThroughAll: false,
    direction: 'outward',
    selectedContourId: 'all',
    revolveAngle: 360,
    revolveAxis: 'Y',
    helixPitch: 10,
    helixTurns: 3,
    helixRadius: 25,
    draftAngle: 0,
    draftDirection: 'inward',
    thinWallEnabled: false,
    thinWallThickness: 2,
    thinWallType: 'mid',
  },

  historyPast: [],
  historyFuture: [],

  pushHistory: () => {
    const { parts, historyPast } = get();
    // Exclude customGeometry instances from JSON serialization to avoid corrupting BufferGeometry instances
    const cleanParts = parts.map((p) => {
      if (p.customGeometry) {
        const { customGeometry, ...rest } = p;
        return rest;
      }
      return p;
    });
    const nextPast = [...historyPast.slice(-19), JSON.parse(JSON.stringify(cleanParts))];
    set({ historyPast: nextPast, historyFuture: [] });
  },

  undo: () => {
    const { parts, historyPast, historyFuture, customGeometries } = get();
    if (historyPast.length === 0) return;
    const prev = historyPast[historyPast.length - 1];
    const newPast = historyPast.slice(0, -1);
    const restored = prev.map((p) => ({
      ...p,
      customGeometry: p.kind === 'imported-model' ? (customCADGeometries.get(p.id) || customGeometries[p.id] || p.customGeometry) : p.customGeometry,
    }));
    const cleanCurrent = parts.map((p) => {
      if (p.customGeometry) {
        const { customGeometry, ...rest } = p;
        return rest;
      }
      return p;
    });
    set({
      parts: restored,
      historyPast: newPast,
      historyFuture: [JSON.parse(JSON.stringify(cleanCurrent)), ...historyFuture],
      selectedId: prev.some(p => p.id === get().selectedId) ? get().selectedId : null,
    });
  },

  redo: () => {
    const { parts, historyPast, historyFuture, customGeometries } = get();
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    const newFuture = historyFuture.slice(1);
    const restored = next.map((p) => ({
      ...p,
      customGeometry: p.kind === 'imported-model' ? (customCADGeometries.get(p.id) || customGeometries[p.id] || p.customGeometry) : p.customGeometry,
    }));
    const cleanCurrent = parts.map((p) => {
      if (p.customGeometry) {
        const { customGeometry, ...rest } = p;
        return rest;
      }
      return p;
    });
    set({
      parts: restored,
      historyPast: [...historyPast, JSON.parse(JSON.stringify(cleanCurrent))],
      historyFuture: newFuture,
      selectedId: next.some(p => p.id === get().selectedId) ? get().selectedId : null,
    });
  },

  addPart: (kind) => {
    get().pushHistory();
    const id = `${kind}-${Date.now().toString(36)}-${++seq}`;
    const n = get().parts.filter((p) => p.kind === kind).length + 1;
    const defaultParams = { ...(KIND_DEFAULTS[kind] || KIND_DEFAULTS.box) };
    const count = get().parts.length;
    const posX = count === 0 ? 0 : (count % 5) * 60;
    const posZ = count === 0 ? 0 : Math.floor(count / 5) * 60;
    const posY = (defaultParams.height || defaultParams.diameter || defaultParams.length || 40) / 2;

    const part: DesignPart = {
      id,
      kind,
      name: `${kindLabel(kind)} ${n}`,
      color: PART_COLORS[count % PART_COLORS.length],
      visible: true,
      locked: false,
      parentId: null,
      subAssemblyId: null,
      position: { x: posX, y: posY, z: posZ },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: defaultParams,
    };
    set((s) => ({ parts: [...s.parts, part], selectedId: id, activeFace: 'top' }));
    return id;
  },
  addTSlotPart: (sizeOrId, lengthMm = 500) => {
    get().pushHistory();
    const spec = getTSlotSpec(sizeOrId);
    const geom = buildTSlotSection(spec);
    const length = Math.max(10, lengthMm);
    const id = `t-slot-${spec.id}-${Date.now().toString(36)}-${++seq}`;
    const n = get().parts.filter((p) => p.kind === 't-slot' && (p.params?.specId === spec.id || p.params?.series === spec.series)).length + 1;
    const count = get().parts.length;
    const posX = count === 0 ? 0 : (count % 5) * 60;
    const posZ = count === 0 ? 0 : Math.floor(count / 5) * 60;
    const part: DesignPart = {
      id,
      kind: 't-slot',
      name: `${spec.name} ${n}`,
      color: PART_COLORS[count % PART_COLORS.length],
      visible: true,
      locked: false,
      parentId: null,
      subAssemblyId: null,
      position: { x: posX, y: 0, z: posZ },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: {
        specId: spec.id,
        series: spec.series,
        width: spec.width,
        height: spec.height,
        slot: spec.slot,
        bore: spec.bore,
        length,
        extrudeDepth: length,
        slotCount: (spec.slotsX + spec.slotsY) * 2,
        sectionAreaMm2: Number(geom.section.area.toFixed(3)),
        ix_mm4: Number(geom.section.Ix.toFixed(1)),
        iy_mm4: Number(geom.section.Iy.toFixed(1)),
        massPerM: spec.massKgPerM,
      },
      outer: geom.outer,
      inner: geom.holes,
      solidOp: 'extrude',
      materialId: 'al-6061-t6',
      manufacturingFormulas: tSlotFormulas(spec, length, geom.section),
      manufacturingNotes: [
        `${spec.name} (${spec.width}×${spec.height} mm) · T-kanal ${spec.slot} mm · ${spec.slotsX * spec.slotsY}× Ø${spec.bore} mm · ${spec.alloy}`,
        `Katalog ${spec.massKgPerM} kg/m · ${tSlotMassKg(spec, length).toFixed(3)} kg @ ${length} mm`,
      ],
      designStandard: spec.standard,
    };
    set((s) => ({ parts: [...s.parts, part], selectedId: id, placeKind: 't-slot' }));
    return id;
  },
  addGearPair: (config) => {
    get().pushHistory();
    const mod = Number(config.module) || 2.0;
    const z1 = Math.max(6, Math.round(Number(config.z1) || 18));
    const z2 = Math.max(6, Math.round(Number(config.z2) || 36));
    const faceWidth = Math.max(5, Number(config.faceWidth) || 20);
    const alpha = Number(config.pressureAngle) || 20;
    const beta = Number(config.helixAngle) || 0;
    const hasKeyway = config.hasKeyway !== false;

    // ISO 6336 / DIN 867 / DIN 3960 Kinematic Gear Pair Equations
    const d1 = mod * z1; // Pitch diameter pinion
    const d2 = mod * z2; // Pitch diameter twin gear
    const da1 = d1 + 2 * mod; // Outside tip diameter
    const da2 = d2 + 2 * mod;
    const df1 = d1 - 2.5 * mod; // Root dedendum diameter
    const df2 = d2 - 2.5 * mod;
    const centerDistance = (mod * (z1 + z2)) / 2; // a = m*(z1 + z2)/2
    const ratio = Number((z2 / z1).toFixed(2));
    const bore1 = Number(config.bore1) || Math.max(10, Math.round(d1 * 0.3));
    const bore2 = Number(config.bore2) || Math.max(12, Math.round(d2 * 0.3));

    const id1 = `gear-pinion-${Date.now().toString(36)}-${++seq}`;
    const id2 = `gear-wheel-${Date.now().toString(36)}-${++seq}`;

    // Center base position
    const existingCount = get().parts.length;
    const isOnlyDemo = existingCount === 1 && get().parts[0].id === 'demo-plate-80x40';
    const baseOffsetX = isOnlyDemo || existingCount === 0
      ? -centerDistance / 2
      : (existingCount % 4) * 80 - 100;
    const baseOffsetY = 0;
    const baseOffsetZ = isOnlyDemo || existingCount === 0
      ? 0
      : Math.floor(existingCount / 4) * 80;

    const pinionPart: DesignPart = {
      id: id1,
      kind: 'gear-blank',
      name: `Pinyon Dişli m=${mod} z=${z1} (d=${d1.toFixed(1)}mm)`,
      color: '#38bdf8', // Sky Blue
      visible: true,
      locked: false,
      parentId: null,
      subAssemblyId: null,
      position: { x: baseOffsetX, y: baseOffsetY, z: baseOffsetZ },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: {
        module: mod,
        teeth: z1,
        depth: faceWidth,
        faceWidth,
        bore: bore1,
        pressureAngle: alpha,
        helixAngle: beta,
        hasKeyway,
        pitchDiameter: d1,
        outsideDiameter: da1,
        rootDiameter: df1,
        centerDistance,
        gearRatio: ratio,
        matingGearId: id2,
        role: 'pinion',
      },
      materialId: 'steel-42crmo4',
      designStandard: 'ISO 6336 / DIN 867 / DIN 3960',
      manufacturingNotes: [
        `ISO 6336 / DIN 867 Evolvent Pinyon: m=${mod} mm, z₁=${z1}, b=${faceWidth} mm`,
        `Taksimat Çapı d₁=${d1.toFixed(1)} mm, Diş Üstü da₁=${da1.toFixed(1)} mm, Diş Dibi df₁=${df1.toFixed(1)} mm`,
        `Eksen Mesafesi a=${centerDistance.toFixed(2)} mm (İkiz Çark: z₂=${z2})`,
        `Çevrim Oranı i=${ratio}:1 · DIN 6885-1 Kamalı Mil Yuvası: Ø${bore1} mm`,
      ],
    };

    const matingPart: DesignPart = {
      id: id2,
      kind: 'gear-blank',
      name: `İkiz Çark m=${mod} z=${z2} (d=${d2.toFixed(1)}mm)`,
      color: '#34d399', // Emerald Green
      visible: true,
      locked: false,
      parentId: null,
      subAssemblyId: null,
      position: { x: baseOffsetX + centerDistance, y: baseOffsetY, z: baseOffsetZ },
      rotation: { x: 0, y: 180 / z2, z: 0 }, // Half-pitch tooth offset for engagement mesh
      scale: { x: 1, y: 1, z: 1 },
      params: {
        module: mod,
        teeth: z2,
        depth: faceWidth,
        faceWidth,
        bore: bore2,
        pressureAngle: alpha,
        helixAngle: beta,
        hasKeyway,
        pitchDiameter: d2,
        outsideDiameter: da2,
        rootDiameter: df2,
        centerDistance,
        gearRatio: ratio,
        matingGearId: id1,
        role: 'wheel',
      },
      materialId: 'steel-42crmo4',
      designStandard: 'ISO 6336 / DIN 867 / DIN 3960',
      manufacturingNotes: [
        `ISO 6336 / DIN 867 Evolvent İkiz Çark: m=${mod} mm, z₂=${z2}, b=${faceWidth} mm`,
        `Taksimat Çapı d₂=${d2.toFixed(1)} mm, Diş Üstü da₂=${da2.toFixed(1)} mm, Diş Dibi df₂=${df2.toFixed(1)} mm`,
        `Eksen Mesafesi a=${centerDistance.toFixed(2)} mm (Pinyon: z₁=${z1})`,
        `Çevrim Oranı i=${ratio}:1 · DIN 6885-1 Kamalı Mil Yuvası: Ø${bore2} mm`,
      ],
    };

    const nextParts = isOnlyDemo
      ? [pinionPart, matingPart]
      : [...get().parts, pinionPart, matingPart];

    set({ parts: nextParts, selectedId: id1, placeKind: 'gear-blank' });
    return { pinionId: id1, gearId: id2 };
  },

  addDynamicBlock3D: (dynamicParts, groupName) => {
    if (!dynamicParts || dynamicParts.length === 0) return [];
    get().pushHistory();
    const createdIds: string[] = [];
    const shouldCreateSubAssy = Boolean(groupName && dynamicParts.length > 1);
    const subAssId = shouldCreateSubAssy ? get().addSubAssembly(groupName!) : null;
    const currentParts = [...get().parts];
    for (const dp of dynamicParts) {
      const kind = (dp.kind || dp.shape || 'box') as DesignKind;
      const id = `${kind}-${Date.now().toString(36)}-${++seq}`;
      createdIds.push(id);

      // Auto-normalize rotation if passed in radians (< 2*PI and nonzero)
      const rot = { ...(dp.rotation || { x: 0, y: 0, z: 0 }) };
      if (Math.abs(rot.x) > 0 && Math.abs(rot.x) <= Math.PI * 2) rot.x = Math.round((rot.x * 180) / Math.PI);
      if (Math.abs(rot.y) > 0 && Math.abs(rot.y) <= Math.PI * 2) rot.y = Math.round((rot.y * 180) / Math.PI);
      if (Math.abs(rot.z) > 0 && Math.abs(rot.z) <= Math.PI * 2) rot.z = Math.round((rot.z * 180) / Math.PI);

      const rawParams = { ...(dp.dimensions || {}), ...(dp.params || {}) };
      if (rawParams.radius !== undefined && rawParams.diameter === undefined) {
        rawParams.diameter = rawParams.radius * 2;
      }

      // Safe parameter resolution for industrial mechanical & architectural blocks
      if (kind === 'cylinder' || kind === 'tube') {
        if (rawParams.diameter === undefined) {
          rawParams.diameter = rawParams.dBody ?? rawParams.dShaft ?? rawParams.dOutput ?? rawParams.dFlange ?? rawParams.dFlangeB5;
        }
        if (rawParams.length === undefined) {
          rawParams.length = rawParams.lTotal ?? rawParams.lShaft ?? rawParams.lOutput ?? rawParams.lengthTotal ?? rawParams.height;
        }
      } else if (kind === 'box') {
        if (rawParams.width === undefined) rawParams.width = rawParams.lengthTotal ?? rawParams.lTotal;
        if (rawParams.height === undefined) rawParams.height = rawParams.heightTotal ?? rawParams.hAxis;
        if (rawParams.depth === undefined) rawParams.depth = rawParams.widthTotal ?? rawParams.bFoot ?? rawParams.aFoot;
      }

      const isMeters = Boolean(dp.dimensions?.unit === 'm' || dp.dimensions?.isMeters);
      if (isMeters) {
        if (rawParams.width > 0 && rawParams.width < 15) rawParams.width *= 1000;
        if (rawParams.height > 0 && rawParams.height < 15) rawParams.height *= 1000;
        if (rawParams.depth > 0 && rawParams.depth < 15) rawParams.depth *= 1000;
        if (rawParams.length > 0 && rawParams.length < 15) rawParams.length *= 1000;
        if (rawParams.diameter > 0 && rawParams.diameter < 5) rawParams.diameter *= 1000;
      }

      const pos = { ...(dp.position || { x: 0, y: 0, z: 0 }) };
      if (isMeters && Math.abs(pos.x) < 15 && Math.abs(pos.y) < 15 && Math.abs(pos.z) < 15) {
        pos.x *= 1000;
        pos.y *= 1000;
        pos.z *= 1000;
      }
      if (dp.dynamicBlockId) rawParams.dynamicBlockId = dp.dynamicBlockId;
      if (dp.dynamicParams) rawParams.dynamicParams = dp.dynamicParams;

      const newPart: DesignPart = {
        id,
        kind,
        name: dp.name,
        color: dp.color || PART_COLORS[currentParts.length % PART_COLORS.length],
        visible: true,
        locked: false,
        parentId: null,
        subAssemblyId: subAssId,
        position: pos,
        rotation: rot,
        scale: { x: 1, y: 1, z: 1 },
        params: { ...(KIND_DEFAULTS[kind] || {}), ...rawParams },
        designStandard: dp.designStandard || 'ISO/DIN'
      };
      currentParts.push(newPart);
    }

    // Auto-prune orphaned empty sub-assemblies so adding dynamic blocks never clutters with empty folders
    const usedSubAssemblyIds = new Set(currentParts.map((p) => p.subAssemblyId).filter(Boolean));
    const activeIds = new Set<string>();
    const existingSubAssemblies = get().subAssemblies;
    usedSubAssemblyIds.forEach((id) => {
      let curr = existingSubAssemblies.find((sa) => sa.id === id);
      while (curr) {
        activeIds.add(curr.id);
        curr = curr.parentId ? existingSubAssemblies.find((sa) => sa.id === curr!.parentId) : undefined;
      }
    });

    set({
      parts: currentParts,
      subAssemblies: existingSubAssemblies.filter((sa) => activeIds.has(sa.id)),
      selectedId: createdIds[0] || null,
    });
    return createdIds;
  },
  select: (id) => {
    const part = get().parts.find((p) => p.id === id);
    set({
      selectedId: id,
      holes: part?.holes || [],
      cuts: part?.cuts || [],
      ...(get().subAssemblies.length === 0 ? { editingPartId: null } : {}),
    });
  },

  setTool: (tool) => {
    if (tool === 'mate') {
      get().openMateModal();
    } else {
      const isSketch = tool === 'sketch-add' || tool === 'sketch-cut' || tool === 'sketch-loft';
      const { selectedId, parts, activeFace } = get();
      const selPart = selectedId ? parts.find((p) => p.id === selectedId) : null;
      set({
        tool,
        isMateModalOpen: false,
        activeMateDraft: null,
        ...(isSketch && selPart ? { activeFace: activeFace || 'top' } : {}),
      });
    }
  },
  setPlaceKind: (kind) => set({ placeKind: kind }),
  setRenderMode: (renderMode) => set({ renderMode }),
  setStudioMode: (studioMode) => set({ studioMode }),
  setSectionAxis: (axis) => set({ sectionAxis: axis }),
  setSectionOffset: (sectionOffset) => set({ sectionOffset }),
  setSectionInvert: (sectionInvert) => set({ sectionInvert }),
  setSectionSolidCap: (sectionSolidCap) => set({ sectionSolidCap }),
  deleteSelected: () => {
    const id = get().selectedId;
    if (!id) return;
    get().pushHistory();
    customCADGeometries.delete(id);
    deleteCADGeometry(id).catch(() => {});
    set((s) => ({ parts: s.parts.filter((p) => p.id !== id), selectedId: null }));
  },
  duplicateSelected: () => {
    const sel = get().getSelected();
    if (!sel) return;
    get().pushHistory();
    const id = `${sel.kind}-${Date.now().toString(36)}-${++seq}`;
    if (sel.kind === 'imported-model' && customCADGeometries.has(sel.id)) {
      const clonedGeom = customCADGeometries.get(sel.id)!.clone();
      customCADGeometries.set(id, clonedGeom);
      saveCADGeometry(id, clonedGeom).catch(() => {});
    }
    set((s) => ({
      parts: [...s.parts, { ...sel, id, name: `${sel.name} copy`, position: { ...sel.position, x: sel.position.x + 30 } }],
      selectedId: id,
    }));
  },
  duplicateSelectedPart: () => {
    const sel = get().getSelected();
    if (!sel) return null;
    get().pushHistory();
    const id = `${sel.kind}-${Date.now().toString(36)}-${++seq}`;
    if (sel.kind === 'imported-model' && customCADGeometries.has(sel.id)) {
      const clonedGeom = customCADGeometries.get(sel.id)!.clone();
      customCADGeometries.set(id, clonedGeom);
      saveCADGeometry(id, clonedGeom).catch(() => {});
    }
    const newPart: DesignPart = {
      ...sel,
      id,
      name: `${sel.name} (Kopya)`,
      position: { ...sel.position, x: sel.position.x + 30, z: sel.position.z + 10 },
    };
    set((s) => ({
      parts: [...s.parts, newPart],
      selectedId: id,
    }));
    return id;
  },
  addStandardBearing: ({ designation, d, D, B, type = 'deep-groove-ball', Cr, C0 }) => {
    get().pushHistory();
    const id = `bearing-${Date.now().toString(36)}-${++seq}`;
    const newPart: DesignPart = {
      id,
      name: `Rulman ${designation}`,
      kind: 'bearing-race',
      color: '#d97706',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: B / 2, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: {
        diameter: D,
        innerDiameter: d,
        depth: B,
        bearingType: type,
        dynamicLoadCr_kN: Cr,
        staticLoadC0_kN: C0,
      },
      materialId: 'steel-100cr6',
      designStandard: 'ISO 15 / ISO 281 / DIN 625',
      manufacturingNotes: [
        `SKF/FAG Standart Rulman: ${designation} (ISO 15)`,
        `İç Çap d = ${d} mm, Dış Çap D = ${D} mm, Genişlik B = ${B} mm`,
        Cr ? `Dinamik Yük Sayısı Cr = ${Cr} kN, Statik Yük C₀ = ${C0 || '-'} kN (ISO 281)` : 'Hassas Rulman Çeliği (100Cr6 / 1.3505)',
      ],
    };
    set((s) => ({
      parts: [...s.parts, newPart],
      selectedId: id,
      placeKind: 'bearing-race',
    }));
    return id;
  },
  addStructuralProfile: ({ type, designation, lengthMm, params, notes, standard = 'EN 10025 / EN 10034' }) => {
    get().pushHistory();
    const id = `struct-${Date.now().toString(36)}-${++seq}`;
    const newPart: DesignPart = {
      id,
      name: `${designation} (L=${lengthMm}mm)`,
      kind: type as any,
      color: '#3b82f6',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: (params.webH || params.height || 40) / 2, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: {
        ...params,
        length: lengthMm,
      },
      materialId: 'steel-s235jr',
      designStandard: standard,
      manufacturingNotes: notes || [
        `Yapısal Profil: ${designation} (${standard})`,
        `Boy: ${lengthMm} mm · EN 10025 S235JR Yapı Çeliği`,
      ],
    };
    set((s) => ({
      parts: [...s.parts, newPart],
      selectedId: id,
      placeKind: type as any,
    }));
    return id;
  },
  addKeywayPin: ({ width, height, length, designation }) => {
    get().pushHistory();
    const id = `key-${Date.now().toString(36)}-${++seq}`;
    const des = designation || `DIN 6885-A ${width}x${height}x${length}`;
    const newPart: DesignPart = {
      id,
      name: des,
      kind: 'box',
      color: '#8b5cf6',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: height / 2, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: {
        width,
        height,
        depth: length,
        length,
      },
      materialId: 'steel-c45',
      designStandard: 'DIN 6885-1 (Form A)',
      manufacturingNotes: [
        `Paralel Kama (Feather Key): ${des}`,
        `Genişlik b = ${width} mm, Yükseklik h = ${height} mm, Boy L = ${length} mm`,
        `Malzeme: C45+C / 1.0503 Çekme Çelik`,
      ],
    };
    set((s) => ({
      parts: [...s.parts, newPart],
      selectedId: id,
    }));
    return id;
  },
  checkInterference: () => {
    const parts = get().parts;
    const interferences: Array<{
      partA: { id: string; name: string };
      partB: { id: string; name: string };
      distanceMm: number;
    }> = [];

    for (let i = 0; i < parts.length; i++) {
      for (let j = i + 1; j < parts.length; j++) {
        const pA = parts[i];
        const pB = parts[j];

        const dimA = {
          x: (pA.params?.width || pA.params?.diameter || pA.params?.outsideDiameter || 40) * (pA.scale?.x || 1),
          y: (pA.params?.height || pA.params?.depth || pA.params?.faceWidth || 40) * (pA.scale?.y || 1),
          z: (pA.params?.length || pA.params?.depth || pA.params?.diameter || 40) * (pA.scale?.z || 1),
        };
        const dimB = {
          x: (pB.params?.width || pB.params?.diameter || pB.params?.outsideDiameter || 40) * (pB.scale?.x || 1),
          y: (pB.params?.height || pB.params?.depth || pB.params?.faceWidth || 40) * (pB.scale?.y || 1),
          z: (pB.params?.length || pB.params?.depth || pB.params?.diameter || 40) * (pB.scale?.z || 1),
        };

        const dx = Math.abs(pA.position.x - pB.position.x);
        const dy = Math.abs(pA.position.y - pB.position.y);
        const dz = Math.abs(pA.position.z - pB.position.z);

        const gapX = dx - (dimA.x + dimB.x) / 2;
        const gapY = dy - (dimA.y + dimB.y) / 2;
        const gapZ = dz - (dimA.z + dimB.z) / 2;

        if (gapX < 0 && gapY < 0 && gapZ < 0) {
          const penetration = Math.max(gapX, gapY, gapZ);
          interferences.push({
            partA: { id: pA.id, name: pA.name },
            partB: { id: pB.id, name: pB.name },
            distanceMm: Number(penetration.toFixed(2)),
          });
        }
      }
    }
    return interferences;
  },
  updateSelectedParams: (patch) => {
    const id = get().selectedId;
    if (!id) return;
    set((s) => ({
      parts: s.parts.map((p) => (p.id === id ? { ...p, params: { ...p.params, ...patch } } : p)),
    }));
    get().applyMates();
  },
  updatePartParams: (partId, patch) => {
    set((s) => ({
      parts: s.parts.map((p) => (p.id === partId ? { ...p, params: { ...p.params, ...patch } } : p)),
    }));
    get().applyMates();
  },
  updateSelectedTransform: (patch) => {
    const id = get().selectedId;
    if (!id) return;
    const part = get().parts.find((p) => p.id === id);
    if (part?.grounded || part?.locked) return; // Autodesk Inventor: Grounded components are anchored in place
    set((s) => ({
      parts: s.parts.map((p) => (p.id === id ? {
        ...p,
        position: { ...p.position, ...(patch.position || {}) },
        rotation: { ...p.rotation, ...(patch.rotation || {}) },
        scale: { ...p.scale, ...(patch.scale || {}) },
      } : p)),
    }));
  },
  bakeScaleToParams: (partId: string) => {
    const state = get();
    const part = state.parts.find((p) => p.id === partId);
    if (!part) return;
    const sx = Math.abs(part.scale?.x ?? 1);
    const sy = Math.abs(part.scale?.y ?? 1);
    const sz = Math.abs(part.scale?.z ?? 1);

    // If scale is virtually (1, 1, 1), no baking needed
    if (Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001 && Math.abs(sz - 1) < 0.001) {
      return;
    }

    const p = { ...(part.params || {}) };
    let newName = part.name;

    if (
      part.kind === 'box' ||
      part.kind === 'plate' ||
      part.kind === 'slot-plate' ||
      part.kind === 'trapezoid' ||
      part.kind === 'wedge'
    ) {
      const origW = p.width ?? 40;
      const origH = p.height ?? 40;
      const origD = p.depth ?? 20;
      const newW = Math.round(origW * sx * 10) / 10;
      const newH = Math.round(origH * sy * 10) / 10;
      const newD = Math.round(origD * sz * 10) / 10;
      p.width = newW;
      p.height = newH;
      p.depth = newD;

      // Update name dimensions if pattern matches (e.g. Plate 80x40x10 -> Plate 160x80x20)
      const replaced3D = newName.replace(
        /\b\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?\b/,
        `${newW}x${newH}x${newD}`
      );
      if (replaced3D !== newName) {
        newName = replaced3D;
      } else {
        newName = newName.replace(
          /\b\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?\b/,
          `${newW}x${newH}`
        );
      }
    } else if (part.kind === 'cylinder' || part.kind === 'tube' || part.kind === 'cone') {
      const radScale = (sx !== 1 && sz === 1) ? sx : (sz !== 1 && sx === 1) ? sz : Math.max(sx, sz);
      const origDia = p.diameter ?? 30;
      const origLen = p.length ?? p.height ?? 40;
      const newDia = Math.round(origDia * radScale * 10) / 10;
      const newLen = Math.round(origLen * sy * 10) / 10;
      p.diameter = newDia;
      p.length = newLen;
      if (p.height !== undefined) p.height = newLen;
      if (p.wall !== undefined) {
        p.wall = Math.round(p.wall * radScale * 10) / 10;
      }
      newName = newName.replace(
        /⌀?\d+(?:\.\d+)?\s*[xX×]\s*L?\d+(?:\.\d+)?/i,
        `⌀${newDia}xL${newLen}`
      );
    } else if (part.kind === 'sphere') {
      const s = Math.max(sx, sy, sz);
      p.diameter = Math.round((p.diameter ?? 30) * s * 10) / 10;
    } else if (part.kind === 'hex-bolt') {
      const radScale = Math.max(sx, sz);
      p.diameter = Math.round((p.diameter ?? 10) * radScale * 10) / 10;
      p.length = Math.round((p.length ?? 40) * sy * 10) / 10;
      p.headSize = Math.round((p.headSize ?? 17) * radScale * 10) / 10;
    } else if (part.kind === 'hex-nut') {
      const radScale = Math.max(sx, sz);
      p.diameter = Math.round((p.diameter ?? 10) * radScale * 10) / 10;
      p.innerDiameter = Math.round((p.innerDiameter ?? p.diameter ?? 10) * radScale * 10) / 10;
      p.depth = Math.round((p.depth ?? 8) * sy * 10) / 10;
      p.headSize = Math.round((p.headSize ?? 17) * radScale * 10) / 10;
    } else if (part.kind === 'pulley' || part.kind === 'washer' || part.kind === 'bearing-race') {
      const radScale = Math.max(sx, sz);
      p.diameter = Math.round((p.diameter ?? 40) * radScale * 10) / 10;
      if (p.innerDiameter !== undefined) {
        p.innerDiameter = Math.round(p.innerDiameter * radScale * 10) / 10;
      }
      p.depth = Math.round((p.depth ?? 15) * sy * 10) / 10;
    } else if (part.kind === 'L-bracket' || part.kind === 'U-channel' || part.kind === 'I-beam' || part.kind === 'T-beam') {
      p.flangeW = Math.round((p.flangeW ?? 50) * sx * 10) / 10;
      p.webH = Math.round((p.webH ?? 50) * sy * 10) / 10;
      p.length = Math.round((p.length ?? 60) * sz * 10) / 10;
    } else if (part.kind === 't-slot') {
      p.width = Math.round((p.width ?? 40) * sx * 10) / 10;
      if (p.height !== undefined) p.height = Math.round(p.height * sz * 10) / 10;
      p.length = Math.round((p.length ?? 200) * sy * 10) / 10;
    } else if (p.extrudeDepth !== undefined) {
      p.extrudeDepth = Math.round(p.extrudeDepth * (sz !== 1 ? sz : sy) * 10) / 10;
    }

    // Scale relative hole positions
    const newHoles = (part.holes || []).map((h) => ({
      ...h,
      x: Math.round(h.x * sx * 10) / 10,
      y: Math.round(h.y * sy * 10) / 10,
      depth: Math.round((h.depth || 10) * sz * 10) / 10,
    }));

    // Scale relative surface cuts
    const newCuts = (part.cuts || []).map((c) => ({
      ...c,
      x: Math.round(c.x * sx * 10) / 10,
      y: Math.round(c.y * sy * 10) / 10,
      width: c.width !== undefined ? Math.round(c.width * sx * 10) / 10 : undefined,
      length: c.length !== undefined ? Math.round(c.length * sy * 10) / 10 : undefined,
      diameter: c.diameter !== undefined ? Math.round(c.diameter * Math.max(sx, sy) * 10) / 10 : undefined,
      depth: Math.round(c.depth * sz * 10) / 10,
    }));

    set((s) => ({
      parts: s.parts.map((item) =>
        item.id === partId
          ? {
              ...item,
              name: newName,
              params: p,
              scale: { x: 1, y: 1, z: 1 },
              holes: newHoles,
              cuts: newCuts,
            }
          : item
      ),
      holes: s.selectedId === partId ? newHoles : s.holes,
      cuts: s.selectedId === partId ? newCuts : s.cuts,
    }));

    get().applyMates();
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
  clearScene: () => {
    customCADGeometries.clear();
    clearAllCADGeometries().catch(() => {});
    set({
      parts: [],
      subAssemblies: [],
      selectedId: null,
      measurements: [],
      isolatedPartId: null,
      holes: [],
      editingPartId: null,
      editingSubAssemblyId: null,
    });
  },
  setGridSnap: (n) => set({ gridSnap: n }),
  setShowGrid: (v) => set({ showGrid: v }),
  setShowMeshWireframe: (v) => set({ showMeshWireframe: v }),
  setShowCadEdges: (v) => set({ showCadEdges: v }),
  toggleMeshWireframe: () => set((s) => ({ showMeshWireframe: !s.showMeshWireframe })),
  toggleCadEdges: () => set((s) => ({ showCadEdges: !s.showCadEdges })),
  setLightingPreset: (v) => set({ lightingPreset: v }),
  setBackgroundPreset: (v) => set({ backgroundPreset: v }),
  setProjectName: (projectName) => set({ projectName }),
  getSelected: () => get().parts.find((p) => p.id === get().selectedId) || null,
  updatePart: (id, patch) => set((s) => ({ parts: s.parts.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

  // Materials, Analysis, Holes & Surface Cuts Actions
  setSelectedMaterialId: (selectedMaterialId) => set({ selectedMaterialId }),
  setShowCenterOfGravity: (showCenterOfGravity) => set({ showCenterOfGravity }),
  setShowTechnicalDrawingModal: (showTechnicalDrawingModal) => set({ showTechnicalDrawingModal }),
  setShowMaterialsModal: (showMaterialsModal) => set({ showMaterialsModal }),
  setActiveFace: (activeFace) => set({ activeFace }),
  setFacePickMode: (facePickMode) => set({ facePickMode }),
  setClickToPlaceHole: (clickToPlaceHole) => set({ clickToPlaceHole }),
  setActiveHoleConfig: (activeHoleConfig) => set({ activeHoleConfig }),
  addHole: (holeOrPartId, maybeHole) => {
    const { selectedId, parts, holes } = get();
    const targetPartId = typeof holeOrPartId === 'string' ? holeOrPartId : selectedId;
    const rawHole = typeof holeOrPartId === 'string' ? (maybeHole || {}) : holeOrPartId;
    const holeItem: HoleItem = {
      id: rawHole.id || `hole-${Date.now()}-${Math.round(Math.random() * 999)}`,
      size: rawHole.size || 'M6',
      type: rawHole.type || 'counterbore',
      face: rawHole.face || 'top',
      x: Number(rawHole.x ?? 0),
      y: Number(rawHole.y ?? 0),
      depth: Number(rawHole.depth ?? 20),
      isThroughAll: rawHole.isThroughAll ?? (rawHole as { throughAll?: boolean }).throughAll ?? true,
    };
    if (targetPartId) {
      const targetPart = parts.find((p) => p.id === targetPartId);
      const baseHoles = targetPart?.holes || holes;
      const newHoles = [...baseHoles, holeItem];
      set({
        holes: newHoles,
        parts: parts.map((p) => (p.id === targetPartId ? { ...p, holes: newHoles } : p)),
      });
    } else {
      const newHoles = [...holes, holeItem];
      set({ holes: newHoles });
    }
  },
  removeHole: (id) => {
    const { selectedId, parts, holes } = get();
    const newHoles = holes.filter((h) => h.id !== id);
    if (selectedId) {
      set({
        holes: newHoles,
        parts: parts.map((p) => (p.id === selectedId ? { ...p, holes: newHoles } : p)),
      });
    } else {
      set({ holes: newHoles });
    }
  },
  clearHoles: () => {
    const { selectedId, parts } = get();
    if (selectedId) {
      set({
        holes: [],
        parts: parts.map((p) => (p.id === selectedId ? { ...p, holes: [] } : p)),
      });
    } else {
      set({ holes: [] });
    }
  },
  addCut: (cutOrPartId, maybeCut) => {
    const { selectedId, parts, cuts } = get();
    const targetPartId = typeof cutOrPartId === 'string' ? cutOrPartId : selectedId;
    const rawCut = typeof cutOrPartId === 'string' ? (maybeCut || {}) : cutOrPartId;
    const cutItem: SurfaceCutItem = {
      id: rawCut.id || `cut-${Date.now()}-${Math.round(Math.random() * 999)}`,
      type: rawCut.type || 'slot',
      face: rawCut.face || 'top',
      width: Number(rawCut.width ?? 12),
      length: Number(rawCut.length ?? 30),
      depth: Number(rawCut.depth ?? 5),
      x: Number(rawCut.x ?? 0),
      y: Number(rawCut.y ?? 0),
      diameter: rawCut.diameter !== undefined ? Number(rawCut.diameter) : undefined,
      isThroughAll: rawCut.isThroughAll,
      angle: rawCut.angle,
      angleDeg: rawCut.angleDeg,
      profile: rawCut.profile,
      cutOp: rawCut.cutOp,
      draftAngle: rawCut.draftAngle,
      draftDirection: rawCut.draftDirection,
      revolveAngle: rawCut.revolveAngle,
      revolveAxis: rawCut.revolveAxis,
      helixPitch: rawCut.helixPitch,
      helixTurns: rawCut.helixTurns,
      helixRadius: rawCut.helixRadius,
    };
    if (targetPartId) {
      const targetPart = parts.find((p) => p.id === targetPartId);
      const baseCuts = targetPart?.cuts || cuts;
      const newCuts = [...baseCuts, cutItem];
      set({
        cuts: newCuts,
        pendingCut: null,
        parts: parts.map((p) => (p.id === targetPartId ? { ...p, cuts: newCuts } : p)),
      });
    } else {
      const newCuts = [...cuts, cutItem];
      set({ cuts: newCuts, pendingCut: null });
    }
  },
  removeCut: (id) => {
    const { selectedId, parts, cuts } = get();
    const newCuts = cuts.filter((c) => c.id !== id);
    if (selectedId) {
      set({
        cuts: newCuts,
        parts: parts.map((p) => (p.id === selectedId ? { ...p, cuts: newCuts } : p)),
      });
    } else {
      set({ cuts: newCuts });
    }
  },
  clearCuts: () => {
    const { selectedId, parts } = get();
    if (selectedId) {
      set({
        cuts: [],
        pendingCut: null,
        parts: parts.map((p) => (p.id === selectedId ? { ...p, cuts: [] } : p)),
      });
    } else {
      set({ cuts: [], pendingCut: null });
    }
  },
  setPendingCut: (pendingCut) => set({ pendingCut }),
  updateCut: (partId, cutId, patch) => {
    const { parts } = get();
    const targetPart = parts.find((p) => p.id === partId);
    if (!targetPart || !targetPart.cuts) return;
    const newCuts = targetPart.cuts.map((c) => (c.id === cutId ? { ...c, ...patch } : c));
    set((s) => ({
      parts: s.parts.map((p) => (p.id === partId ? { ...p, cuts: newCuts } : p)),
      cuts: s.selectedId === partId ? newCuts : s.cuts,
    }));
  },
  updateHole: (partId, holeId, patch) => {
    const { parts } = get();
    const targetPart = parts.find((p) => p.id === partId);
    if (!targetPart || !targetPart.holes) return;
    const newHoles = targetPart.holes.map((h) => (h.id === holeId ? { ...h, ...patch } : h));
    set((s) => ({
      parts: s.parts.map((p) => (p.id === partId ? { ...p, holes: newHoles } : p)),
      holes: s.selectedId === partId ? newHoles : s.holes,
    }));
  },

  // Sub-Assembly Hierarchy State & Actions
  subAssemblies: [],
  addSubAssembly: (name, parentId = null) => {
    const id = `subassy-${Date.now().toString(36)}-${++seq}`;
    const count = get().subAssemblies.length + 1;
    const subAssy: SubAssembly = {
      id,
      name: name || `Alt Montaj ${count}`,
      visible: true,
      locked: false,
      expanded: true,
      parentId,
    };
    set((s) => ({ subAssemblies: [...s.subAssemblies, subAssy] }));
    return id;
  },
  removeSubAssembly: (id, dissolveOnly = true) => {
    const { subAssemblies, parts } = get();
    if (dissolveOnly) {
      const updatedParts = parts.map((p) => (p.subAssemblyId === id ? { ...p, subAssemblyId: null } : p));
      set({
        subAssemblies: subAssemblies.filter((sa) => sa.id !== id),
        parts: updatedParts,
      });
    } else {
      const updatedParts = parts.filter((p) => p.subAssemblyId !== id);
      set({
        subAssemblies: subAssemblies.filter((sa) => sa.id !== id),
        parts: updatedParts,
      });
    }
  },
  renameSubAssembly: (id, name) => {
    set((s) => ({
      subAssemblies: s.subAssemblies.map((sa) => (sa.id === id ? { ...sa, name } : sa)),
    }));
  },
  movePartToSubAssembly: (partId, subAssemblyId) => {
    set((s) => ({
      parts: s.parts.map((p) => (p.id === partId ? { ...p, subAssemblyId } : p)),
    }));
  },
  toggleSubAssemblyVisible: (id) => {
    const subAssy = get().subAssemblies.find((sa) => sa.id === id);
    if (!subAssy) return;
    const nextVis = !subAssy.visible;
    set((s) => ({
      subAssemblies: s.subAssemblies.map((sa) => (sa.id === id ? { ...sa, visible: nextVis } : sa)),
      parts: s.parts.map((p) => (p.subAssemblyId === id ? { ...p, visible: nextVis } : p)),
    }));
  },
  toggleSubAssemblyLocked: (id) => {
    const subAssy = get().subAssemblies.find((sa) => sa.id === id);
    if (!subAssy) return;
    const nextLock = !subAssy.locked;
    set((s) => ({
      subAssemblies: s.subAssemblies.map((sa) => (sa.id === id ? { ...sa, locked: nextLock } : sa)),
      parts: s.parts.map((p) => (p.subAssemblyId === id ? { ...p, locked: nextLock } : p)),
    }));
  },
  toggleSubAssemblyExpanded: (id) => {
    set((s) => ({
      subAssemblies: s.subAssemblies.map((sa) => (sa.id === id ? { ...sa, expanded: !sa.expanded } : sa)),
    }));
  },
  demoteToSubAssembly: (partIds, subAssyName) => {
    const id = `subassy-${Date.now().toString(36)}-${++seq}`;
    const count = get().subAssemblies.length + 1;
    const subAssy: SubAssembly = {
      id,
      name: subAssyName || `Alt Montaj ${count}`,
      visible: true,
      locked: false,
      expanded: true,
      parentId: null,
    };
    set((s) => ({
      subAssemblies: [...s.subAssemblies, subAssy],
      parts: s.parts.map((p) => (partIds.includes(p.id) ? { ...p, subAssemblyId: id } : p)),
    }));
    return id;
  },
  pruneEmptySubAssemblies: () => {
    const { subAssemblies, parts } = get();
    const usedSubAssemblyIds = new Set(parts.map((p) => p.subAssemblyId).filter(Boolean));
    const activeIds = new Set<string>();
    usedSubAssemblyIds.forEach((id) => {
      let curr = subAssemblies.find((sa) => sa.id === id);
      while (curr) {
        activeIds.add(curr.id);
        curr = curr.parentId ? subAssemblies.find((sa) => sa.id === curr!.parentId) : undefined;
      }
    });
    set({ subAssemblies: subAssemblies.filter((sa) => activeIds.has(sa.id)) });
  },
  promotePart: (partId) => {
    const part = get().parts.find((p) => p.id === partId);
    if (!part || !part.subAssemblyId) return;
    const currentSubAssy = get().subAssemblies.find((sa) => sa.id === part.subAssemblyId);
    const targetParentId = currentSubAssy?.parentId || null;
    set((s) => ({
      parts: s.parts.map((p) => (p.id === partId ? { ...p, subAssemblyId: targetParentId } : p)),
    }));
  },
  togglePartGrounded: (id) => {
    set((s) => ({
      parts: s.parts.map((p) => (p.id === id ? { ...p, grounded: !p.grounded } : p)),
    }));
  },

  // Tree Expansion State
  expandedPartIds: ['demo-plate-80x40'],
  togglePartExpanded: (partId) => {
    set((s) => {
      const exists = s.expandedPartIds.includes(partId);
      return {
        expandedPartIds: exists
          ? s.expandedPartIds.filter((id) => id !== partId)
          : [...s.expandedPartIds, partId],
      };
    });
  },
  expandAllParts: () => {
    set((s) => ({
      expandedPartIds: s.parts.map((p) => p.id),
      subAssemblies: s.subAssemblies.map((sa) => ({ ...sa, expanded: true })),
    }));
  },
  collapseAllParts: () => {
    set((s) => ({
      expandedPartIds: [],
      subAssemblies: s.subAssemblies.map((sa) => ({ ...sa, expanded: false })),
    }));
  },

  // Selected Feature for Fine-Grained Inspector
  selectedFeature: null,
  setSelectedFeature: (selectedFeature) => set({ selectedFeature }),

  // Autodesk Inventor In-Place Part & Sub-Assembly Editing
  editingPartId: null,
  setEditingPartId: (id) => {
    const part = id ? get().parts.find((p) => p.id === id) : null;
    set({
      editingPartId: id,
      selectedId: id ? id : get().selectedId,
      holes: part?.holes || [],
      cuts: part?.cuts || [],
    });
  },
  editingSubAssemblyId: null,
  setEditingSubAssemblyId: (id) => {
    set({ editingSubAssemblyId: id });
  },
  startEditPartSketch: (partId) => {
    const part = get().parts.find((p) => p.id === partId);
    if (!part) return;

    // Check if this part was extruded on another part's face or has a native face
    const parentPartId = part.params?.parentPartId || part.parentId;
    const parentPart = parentPartId ? get().parts.find((p) => p.id === parentPartId) : null;
    const targetFace: SurfaceFace = (part.params?.face || (parentPart ? 'top' : 'top')) as SurfaceFace;

    let points: Point2D[] = [];
    let entities: SketchEntity[] = [];

    // If original sketch points/entities were preserved, restore them directly
    if (part.params?.originalSketchPoints && part.params.originalSketchPoints.length >= 3) {
      points = [...part.params.originalSketchPoints];
      if (part.params?.originalEntities && part.params.originalEntities.length > 0) {
        entities = part.params.originalEntities.map((e: any) => ({
          ...e,
          center: e.center ? { x: Math.round(e.center.x * 10) / 10, y: Math.round(e.center.y * 10) / 10 } : { x: 0, y: 0 },
        }));
      }
    } else if (part.outer && part.outer.length >= 3) {
      // Local points on part base
      points = part.outer.map((pt) => ({
        x: Math.round(pt.x * 10) / 10,
        y: Math.round(pt.y * 10) / 10,
      }));

      // Check if outer contour is rectangular
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      points.forEach((pt) => {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      });
      const cx = Math.round(((minX + maxX) / 2) * 10) / 10;
      const cy = Math.round(((minY + maxY) / 2) * 10) / 10;
      const w = Math.max(2, Math.round((maxX - minX) * 10) / 10);
      const h = Math.max(2, Math.round((maxY - minY) * 10) / 10);

      const p4 = points.length === 5 && Math.hypot(points[0].x - points[4].x, points[0].y - points[4].y) < 0.2
        ? points.slice(0, 4)
        : points;
      const isRect = p4.length === 4 && [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
      ].every((c) => p4.some((pt) => Math.hypot(pt.x - c.x, pt.y - c.y) < 0.5));

      if (isRect) {
        entities = [
          {
            id: `ent-edit-${Date.now().toString(36)}`,
            type: 'rect',
            points: [...points],
            center: { x: cx, y: cy },
            width: w,
            height: h,
            angleDeg: 0,
            isClosed: true,
            isConstruction: false,
            name: `Dikdörtgen ${w}x${h}`,
          },
        ];
      } else {
        entities = [
          {
            id: `ent-edit-${Date.now().toString(36)}`,
            type: 'polygon',
            points: [...points],
            center: { x: cx, y: cy },
            width: w,
            height: h,
            angleDeg: 0,
            isClosed: true,
            isConstruction: false,
            name: part.name || 'Taban Çizimi',
          },
        ];
      }
    } else if (part.kind === 'box') {
      const w = part.params.width || 40;
      const d = part.params.depth || part.params.length || 20;
      const hw = Math.round(w / 2);
      const hd = Math.round(d / 2);
      points = [
        { x: -hw, y: -hd },
        { x: hw, y: -hd },
        { x: hw, y: hd },
        { x: -hw, y: hd },
      ];
      entities = [
        {
          id: `ent-edit-${Date.now().toString(36)}`,
          type: 'rect',
          points: [...points],
          center: { x: 0, y: 0 },
          width: w,
          height: d,
          isClosed: true,
          isConstruction: false,
          name: `Taban Dikdörtgen ${w}x${d}`,
        },
      ];
    } else if (part.kind === 'cylinder' || part.kind === 'tube') {
      const dia = part.params.diameter || 30;
      const r = Math.round(dia / 2);
      const segs = 24;
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        points.push({ x: Math.round(Math.cos(a) * r * 10) / 10, y: Math.round(Math.sin(a) * r * 10) / 10 });
      }
      entities = [
        {
          id: `ent-edit-${Date.now().toString(36)}`,
          type: 'circle',
          points: [...points],
          center: { x: 0, y: 0 },
          radius: r,
          isClosed: true,
          isConstruction: false,
          name: `Taban Dairesi Ø${dia}`,
        },
      ];
    } else {
      points = [
        { x: -25, y: -15 },
        { x: 25, y: -15 },
        { x: 25, y: 15 },
        { x: -25, y: 15 },
      ];
      entities = [
        {
          id: `ent-edit-${Date.now().toString(36)}`,
          type: 'rect',
          points: [...points],
          center: { x: 0, y: 0 },
          width: 50,
          height: 30,
          isClosed: true,
          isConstruction: false,
          name: `Çizim 50x30`,
        },
      ];
    }

    if (entities.length === 0 && points.length >= 3) {
      entities = [
        {
          id: `ent-edit-${Date.now().toString(36)}`,
          type: 'polygon',
          points: [...points],
          isClosed: true,
          isConstruction: false,
          name: part.name || 'Taban Çizimi',
        },
      ];
    }

    const op = part.solidOp || (part.params.revolveAngle ? 'revolve' : 'extrude');
    const depth = part.params.extrudeDepth || part.params.depth || part.params.height || part.params.length || 20;

    set({
      tool: 'sketch-add',
      pendingOp: op,
      sketchPoints: points,
      sketchEntities: entities,
      sketchClosed: true,
      extrudeDepth: depth,
      editingPartId: partId,
      selectedId: partId,
      activeFace: targetFace,
      selectedFeature: { type: 'sketch', partId },
      selectedSketchEntityId: entities.length > 0 ? entities[0].id : null,
    });

    // Auto-align camera Normal-To the sketch face for intuitive 2D CAD editing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('alucalc:camera', {
          detail: { type: 'focus-face', partId, face: targetFace },
        })
      );
    }
  },


  // Assembly Inspection Actions
  setExplodeFactor: (explodeFactor) => set({ explodeFactor }),
  setExplodeDirection: (explodeDirection) => set({ explodeDirection }),
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
    const dx = Math.round(Math.abs(p2.x - p1.x) * 10) / 10;
    const dy = Math.round(Math.abs(p2.y - p1.y) * 10) / 10;
    const dz = Math.round(Math.abs(p2.z - p1.z) * 10) / 10;
    const distance = Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z) * 10) / 10;

    let perpendicularDist: number | undefined = undefined;
    let isParallelSurfaces: boolean | undefined = undefined;
    let angleDeg: number | undefined = undefined;
    let perpPoint: Point3D | undefined = undefined;

    const normal1 = (p1.nx !== undefined && p1.ny !== undefined && p1.nz !== undefined)
      ? { x: p1.nx, y: p1.ny, z: p1.nz }
      : undefined;

    const normal2 = (p2.nx !== undefined && p2.ny !== undefined && p2.nz !== undefined)
      ? { x: p2.nx, y: p2.ny, z: p2.nz }
      : undefined;

    if (normal1) {
      // Vector from p1 to p2 in mm
      const vx = p2.x - p1.x;
      const vy = p2.y - p1.y;
      const vz = p2.z - p1.z;

      // Project onto normal1 to get perpendicular distance to Face 1
      const dot1 = vx * normal1.x + vy * normal1.y + vz * normal1.z;
      const perpDistVal = Math.round(Math.abs(dot1) * 10) / 10;
      perpendicularDist = perpDistVal;

      // Perpendicular projection point on plane 2
      perpPoint = {
        x: Math.round((p1.x + normal1.x * dot1) * 10) / 10,
        y: Math.round((p1.y + normal1.y * dot1) * 10) / 10,
        z: Math.round((p1.z + normal1.z * dot1) * 10) / 10,
      };

      if (normal2) {
        // Angle between normals
        const nDot = normal1.x * normal2.x + normal1.y * normal2.y + normal1.z * normal2.z;
        const absDot = Math.min(1.0, Math.abs(nDot));
        const angle = Math.round((Math.acos(absDot) * 180) / Math.PI * 10) / 10;
        angleDeg = angle;
        // Parallel if within 15 degrees
        isParallelSurfaces = absDot >= 0.96;
      }
    }

    const id = `measure-${Date.now().toString(36)}-${++seq}`;
    set((s) => ({
      measurements: [
        ...s.measurements,
        {
          id,
          p1: { x: p1.x, y: p1.y, z: p1.z },
          p2: { x: p2.x, y: p2.y, z: p2.z },
          distance,
          dx,
          dy,
          dz,
          normal1,
          normal2,
          perpendicularDist,
          isParallelSurfaces,
          angleDeg,
          perpPoint,
        },
      ],
      activeMeasureStart: null,
    }));
  },
  setMeasureMode: (measureMode) => set({ measureMode }),
  addDiameterMeasurement: (center, diameter, normal, hitPoint) => {
    const id = `measure-dia-${Date.now().toString(36)}-${++seq}`;
    const radius = Math.round((diameter / 2) * 100) / 100;
    const roundedDia = Math.round(diameter * 100) / 100;
    const p1 = hitPoint || { x: center.x + radius, y: center.y, z: center.z };
    const p2 = { x: center.x - (p1.x - center.x), y: center.y - (p1.y - center.y), z: center.z - (p1.z - center.z) };

    set((s) => ({
      measurements: [
        ...s.measurements,
        {
          id,
          type: 'diameter',
          p1,
          p2,
          center,
          diameter: roundedDia,
          radius,
          normal1: normal,
          distance: roundedDia,
          dx: Math.round(Math.abs(p2.x - p1.x)),
          dy: Math.round(Math.abs(p2.y - p1.y)),
          dz: Math.round(Math.abs(p2.z - p1.z)),
        },
      ],
      activeMeasureStart: null,
    }));
  },
  removeMeasurement: (id) => set((s) => ({ measurements: s.measurements.filter((m) => m.id !== id) })),
  clearMeasurements: () => set({ measurements: [], activeMeasureStart: null }),

  // CAD Import Model Action
  importCADModel: (name, geom, position = { x: 0, y: 0, z: 0 }, color = '#60a5fa', initialParams?: Record<string, number>) => {
    get().pushHistory();
    const id = `cad-${Date.now().toString(36)}-${++seq}`;
    const params = initialParams || { width: 50, height: 50, depth: 50 };
    if (geom) {
      customCADGeometries.set(id, geom);
      saveCADGeometry(id, geom).catch(() => {});
    }
    const part: DesignPart = {
      id,
      kind: 'imported-model',
      name: name || `Imported Part ${seq}`,
      color,
      visible: true,
      locked: false,
      parentId: null,
      subAssemblyId: null,
      position,
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params,
      customGeometry: geom,
    };
    set((s) => ({
      parts: [...s.parts, part],
      customGeometries: { ...s.customGeometries, [id]: geom },
      selectedId: id,
    }));
    return id;
  },

  // Hydrate CAD Geometries from IndexedDB on startup/refresh
  hydrateCADGeometries: async () => {
    try {
      const loaded = await loadAllCADGeometries();
      if (loaded && loaded.size > 0) {
        loaded.forEach((geom, partId) => {
          customCADGeometries.set(partId, geom);
        });
        set((s) => {
          const updatedParts = s.parts.map((p) => {
            if (p.kind === 'imported-model' && loaded.has(p.id)) {
              return { ...p, customGeometry: loaded.get(p.id) };
            }
            return p;
          });
          const updatedGeometries = { ...s.customGeometries };
          loaded.forEach((geom, partId) => {
            updatedGeometries[partId] = geom;
          });
          return {
            parts: updatedParts,
            customGeometries: updatedGeometries,
            renderTrigger: (s.renderTrigger || 0) + 1,
          };
        });
      }
    } catch (e) {
      console.warn('Failed to hydrate CAD geometries from IndexedDB:', e);
    }
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
    const { selectedId, parts, activeFace } = get();
    const selPart = selectedId ? parts.find((p) => p.id === selectedId) : null;
    set({
      tool: op === 'loft' ? 'sketch-loft' : 'sketch-add',
      pendingOp: op,
      sketchPoints: [],
      sketchClosed: false,
      activeFace: selPart ? (activeFace || 'top') : null,
    });
  },
  startSketchCut: () => {
    const { selectedId, parts, activeFace } = get();
    const selPart = selectedId ? parts.find((p) => p.id === selectedId) : null;
    set({
      tool: 'sketch-cut',
      pendingOp: 'cut',
      sketchPoints: [],
      sketchClosed: false,
      activeFace: selPart ? (activeFace || 'top') : null,
    });
  },
  setSketchShapeMode: (sketchShapeMode) => {
    const { sketchPoints, sketchClosed, sketchEntities, isConstructionMode } = get();
    if (sketchPoints.length >= 2) {
      const newEnt: SketchEntity = {
        id: `ent-${Date.now().toString(36)}-${++seq}`,
        type: sketchPoints.length === 2 ? 'line' : 'polyline',
        points: [...sketchPoints],
        isClosed: sketchClosed,
        isConstruction: isConstructionMode,
        name: isConstructionMode ? 'Sanal Çizgi (Ref)' : 'Çizgi Grubu',
      };
      set({
        sketchShapeMode,
        sketchEntities: [...sketchEntities, newEnt],
        sketchPoints: [],
        sketchClosed: false,
      });
    } else {
      set({
        sketchShapeMode,
        sketchPoints: [],
        sketchClosed: false,
      });
    }
  },
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
    if (pts.length >= 4) {
      const first = pts[0];
      const last = pts[pts.length - 1];
      if (Math.hypot(first.x - last.x, first.y - last.y) <= Math.max(15, snap * 2)) {
        pts.pop();
        closed = true;
      }
    }
    set({ sketchPoints: pts, sketchClosed: closed });
  },
  addCircleSketch: (center, radius = 25) => {
    const { sketchPoints, isConstructionMode, sketchEntities } = get();
    let currentEntities = [...sketchEntities];
    if (sketchPoints.length >= 2) {
      currentEntities.push({
        id: `ent-${Date.now().toString(36)}-${++seq}`,
        type: sketchPoints.length === 2 ? 'line' : 'polyline',
        points: [...sketchPoints],
        isClosed: false,
        isConstruction: isConstructionMode,
        name: isConstructionMode ? 'Sanal Çizgi (Ref)' : 'Çizgi Grubu',
      });
    }
    const pts: Point2D[] = [];
    const segments = 32;
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push({
        x: center.x + Math.cos(a) * radius,
        y: center.y + Math.sin(a) * radius,
      });
    }
    const isConst = isConstructionMode;
    const newEnt: SketchEntity = {
      id: `ent-${Date.now().toString(36)}-${++seq}`,
      type: 'circle',
      points: pts,
      center,
      radius,
      isClosed: true,
      isConstruction: isConst,
      name: isConst ? `Sanal Daire Ø${radius * 2}` : `Daire Ø${radius * 2}`,
    };
    set({
      sketchPoints: [],
      sketchClosed: false,
      sketchEntities: [...currentEntities, newEnt],
    });
  },
  addRectSketch: (center, width = 50, height = 40) => {
    const { sketchPoints, isConstructionMode, sketchEntities } = get();
    let currentEntities = [...sketchEntities];
    if (sketchPoints.length >= 2) {
      currentEntities.push({
        id: `ent-${Date.now().toString(36)}-${++seq}`,
        type: sketchPoints.length === 2 ? 'line' : 'polyline',
        points: [...sketchPoints],
        isClosed: false,
        isConstruction: isConstructionMode,
        name: isConstructionMode ? 'Sanal Çizgi (Ref)' : 'Çizgi Grubu',
      });
    }
    const hw = width / 2;
    const hh = height / 2;
    const pts: Point2D[] = [
      { x: center.x - hw, y: center.y - hh },
      { x: center.x + hw, y: center.y - hh },
      { x: center.x + hw, y: center.y + hh },
      { x: center.x - hw, y: center.y + hh },
    ];
    const isConst = isConstructionMode;
    const newEnt: SketchEntity = {
      id: `ent-${Date.now().toString(36)}-${++seq}`,
      type: 'rect',
      points: pts,
      center,
      width,
      height,
      isClosed: true,
      isConstruction: isConst,
      name: isConst ? `Sanal Dikdörtgen ${width}x${height}` : `Dikdörtgen ${width}x${height}`,
    };
    set({
      sketchPoints: [],
      sketchClosed: false,
      sketchEntities: [...currentEntities, newEnt],
    });
  },
  addPolygonSketch: (center, radius = 30, sides = 6) => {
    const { sketchPoints, isConstructionMode, sketchEntities } = get();
    let currentEntities = [...sketchEntities];
    if (sketchPoints.length >= 2) {
      currentEntities.push({
        id: `ent-${Date.now().toString(36)}-${++seq}`,
        type: sketchPoints.length === 2 ? 'line' : 'polyline',
        points: [...sketchPoints],
        isClosed: false,
        isConstruction: isConstructionMode,
        name: isConstructionMode ? 'Sanal Çizgi (Ref)' : 'Çizgi Grubu',
      });
    }
    const pts: Point2D[] = [];
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
      pts.push({
        x: center.x + Math.cos(a) * radius,
        y: center.y + Math.sin(a) * radius,
      });
    }
    const isConst = isConstructionMode;
    const newEnt: SketchEntity = {
      id: `ent-${Date.now().toString(36)}-${++seq}`,
      type: 'polygon',
      points: pts,
      center,
      radius,
      isClosed: true,
      isConstruction: isConst,
      name: isConst ? `Sanal Çokgen (${sides})` : `Çokgen (${sides})`,
    };
    set({
      sketchPoints: [],
      sketchClosed: false,
      sketchEntities: [...currentEntities, newEnt],
    });
  },
  applySketchFillet: (radius: number) => {
    const { sketchPoints, sketchEntities, selectedSketchEntityId } = get();
    if (sketchPoints.length >= 3 && radius > 0) {
      const rounded = roundPolygonCorners(sketchPoints, radius);
      const targetEnt = sketchEntities.find((e) => e.id === selectedSketchEntityId) || sketchEntities[sketchEntities.length - 1];
      const updatedEntities = targetEnt
        ? sketchEntities.map((e) => (e.id === targetEnt.id ? { ...e, points: rounded } : e))
        : sketchEntities;
      set({ sketchPoints: rounded, sketchClosed: true, sketchEntities: updatedEntities });
      return;
    }
    const targetEnt = sketchEntities.find((e) => e.id === selectedSketchEntityId) || sketchEntities[sketchEntities.length - 1];
    if (targetEnt && targetEnt.points && targetEnt.points.length >= 3 && radius > 0) {
      const rounded = roundPolygonCorners(targetEnt.points, radius);
      const updatedEntities = sketchEntities.map((e) => (e.id === targetEnt.id ? { ...e, points: rounded } : e));
      set({ sketchPoints: rounded, sketchClosed: true, sketchEntities: updatedEntities });
    }
  },
  closeSketch: () => {
    if (get().sketchPoints.length >= 3) {
      set({ sketchClosed: true });
    }
  },
  clearSketch: () => {
    set({
      sketchPoints: [],
      sketchClosed: false,
      sketchEntities: [],
      selectedSketchEntityId: null,
      tool: 'select',
      editingPartId: null,
      isExtrudeDialogOpen: false,
      activeFace: null,
    });
  },
  undoSketchPoint: () => {
    const { sketchPoints, sketchEntities } = get();
    if (sketchPoints.length > 0) {
      const pts = sketchPoints.slice(0, -1);
      set({ sketchPoints: pts, sketchClosed: false });
    } else if (sketchEntities.length > 0) {
      set({ sketchEntities: sketchEntities.slice(0, -1) });
    }
  },
  setExtrudeDepth: (extrudeDepth) =>
    set((s) => ({
      extrudeDepth,
      extrudeDialogConfig: { ...s.extrudeDialogConfig, depth: extrudeDepth },
    })),
  setRevolveAngle: (revolveAngle) => set({ revolveAngle }),
  setLoftHeight: (loftHeight) => set({ loftHeight }),

  toggleConstructionMode: () => set((s) => ({ isConstructionMode: !s.isConstructionMode })),
  setKeepSketchAfterExtrude: (keepSketchAfterExtrude) => set({ keepSketchAfterExtrude }),
  setShowSketchDimensions: (showSketchDimensions) => set({ showSketchDimensions }),
  setSketchNumericCoords: (sketchNumericCoords) => set({ sketchNumericCoords }),

  endCurrentLineSegment: () => {
    const { sketchPoints, sketchClosed, sketchEntities, isConstructionMode } = get();
    if (sketchPoints.length >= 2) {
      const newEnt: SketchEntity = {
        id: `ent-${Date.now().toString(36)}-${++seq}`,
        type: sketchPoints.length === 2 ? 'line' : 'polyline',
        points: [...sketchPoints],
        isClosed: sketchClosed,
        isConstruction: isConstructionMode,
        name: isConstructionMode ? 'Sanal Çizgi (Ref)' : 'Çizgi Grubu',
      };
      set({
        sketchEntities: [...sketchEntities, newEnt],
        sketchPoints: [],
        sketchClosed: false,
      });
    } else {
      set({ sketchPoints: [], sketchClosed: false });
    }
  },

  addCircleEntity: (center, radius = 25, isConstruction) => {
    const pts: Point2D[] = [];
    const segments = 32;
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push({
        x: center.x + Math.cos(a) * radius,
        y: center.y + Math.sin(a) * radius,
      });
    }
    const constFlag = isConstruction !== undefined ? isConstruction : get().isConstructionMode;
    const entId = `ent-${Date.now().toString(36)}-${++seq}`;
    const newEnt: SketchEntity = {
      id: entId,
      type: 'circle',
      points: pts,
      center,
      radius,
      isClosed: true,
      isConstruction: constFlag,
      name: constFlag ? `Sanal Daire Ø${radius * 2}` : `Daire Ø${radius * 2}`,
    };
    set((s) => ({
      sketchEntities: [...s.sketchEntities, newEnt],
    }));
    return entId;
  },

  add2PointCircleEntity: (p1, p2, isConstruction) => {
    const pts = create2PointCirclePoints(p1, p2, 32);
    const r = Math.max(1, Math.hypot(p2.x - p1.x, p2.y - p1.y) / 2);
    const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const constFlag = isConstruction !== undefined ? isConstruction : get().isConstructionMode;
    const entId = `ent-${Date.now().toString(36)}-${++seq}`;
    const newEnt: SketchEntity = {
      id: entId,
      type: 'circle_2p',
      points: pts,
      center,
      radius: r,
      isClosed: true,
      isConstruction: constFlag,
      name: constFlag ? `Sanal 2P Daire Ø${Math.round(r * 2)}` : `2-Nokta Daire Ø${Math.round(r * 2)}`,
    };
    set((s) => ({ sketchEntities: [...s.sketchEntities, newEnt] }));
    return entId;
  },

  addSemiCircleEntity: (p1, p2, isConstruction) => {
    const pts = createSemiCirclePoints(p1, p2, 24);
    const r = Math.max(1, Math.hypot(p2.x - p1.x, p2.y - p1.y) / 2);
    const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const constFlag = isConstruction !== undefined ? isConstruction : get().isConstructionMode;
    const entId = `ent-${Date.now().toString(36)}-${++seq}`;
    const newEnt: SketchEntity = {
      id: entId,
      type: 'arc_semi',
      points: pts,
      center,
      radius: r,
      isClosed: true,
      isConstruction: constFlag,
      name: constFlag ? `Sanal Yarım Daire R${Math.round(r)}` : `Yarım Daire R${Math.round(r)}`,
    };
    set((s) => ({ sketchEntities: [...s.sketchEntities, newEnt] }));
    return entId;
  },

  add3PointArcEntity: (p1, p2, p3, isConstruction) => {
    const pts = create3PointArcPoints(p1, p2, p3, 24);
    const constFlag = isConstruction !== undefined ? isConstruction : get().isConstructionMode;
    const entId = `ent-${Date.now().toString(36)}-${++seq}`;
    const newEnt: SketchEntity = {
      id: entId,
      type: 'arc_3p',
      points: pts,
      isClosed: false,
      isConstruction: constFlag,
      name: constFlag ? 'Sanal 3-Nokta Yay' : '3-Nokta Yay',
    };
    set((s) => ({ sketchEntities: [...s.sketchEntities, newEnt] }));
    return entId;
  },

  addArcEntity: (center, radius = 25, startAngle = 0, endAngle = Math.PI, isConstruction) => {
    const pts: Point2D[] = [];
    const segments = 24;
    for (let i = 0; i <= segments; i++) {
      const a = startAngle + ((endAngle - startAngle) * i) / segments;
      pts.push({
        x: Math.round((center.x + Math.cos(a) * radius) * 100) / 100,
        y: Math.round((center.y + Math.sin(a) * radius) * 100) / 100,
      });
    }
    const constFlag = isConstruction !== undefined ? isConstruction : get().isConstructionMode;
    const entId = `ent-${Date.now().toString(36)}-${++seq}`;
    const newEnt: SketchEntity = {
      id: entId,
      type: 'arc',
      points: pts,
      center,
      radius,
      startAngle,
      endAngle,
      isClosed: false,
      isConstruction: constFlag,
      name: constFlag ? `Sanal Yay R${radius}` : `Yay R${radius}`,
    };
    set((s) => ({ sketchEntities: [...s.sketchEntities, newEnt] }));
    return entId;
  },

  addEllipseEntity: (center, rx = 30, ry = 20, isConstruction) => {
    const pts = createEllipsePoints(center, rx, ry, 32);
    const constFlag = isConstruction !== undefined ? isConstruction : get().isConstructionMode;
    const entId = `ent-${Date.now().toString(36)}-${++seq}`;
    const newEnt: SketchEntity = {
      id: entId,
      type: 'ellipse',
      points: pts,
      center,
      radiusX: rx,
      radiusY: ry,
      isClosed: true,
      isConstruction: constFlag,
      name: constFlag ? `Sanal Elips ${rx}x${ry}` : `Elips ${rx}x${ry}`,
    };
    set((s) => ({ sketchEntities: [...s.sketchEntities, newEnt] }));
    return entId;
  },

  addRectEntity: (center, width = 50, height = 40, isConstruction) => {
    const hw = width / 2;
    const hh = height / 2;
    const pts: Point2D[] = [
      { x: center.x - hw, y: center.y - hh },
      { x: center.x + hw, y: center.y - hh },
      { x: center.x + hw, y: center.y + hh },
      { x: center.x - hw, y: center.y + hh },
    ];
    const constFlag = isConstruction !== undefined ? isConstruction : get().isConstructionMode;
    const entId = `ent-${Date.now().toString(36)}-${++seq}`;
    const newEnt: SketchEntity = {
      id: entId,
      type: 'rect',
      points: pts,
      center,
      width,
      height,
      isClosed: true,
      isConstruction: constFlag,
      name: constFlag ? `Sanal Dikdörtgen ${width}x${height}` : `Dikdörtgen ${width}x${height}`,
    };
    set((s) => ({
      sketchEntities: [...s.sketchEntities, newEnt],
    }));
    return entId;
  },

  addPolygonEntity: (center, radius = 30, sides = 6, isConstruction) => {
    const pts: Point2D[] = [];
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
      pts.push({
        x: center.x + Math.cos(a) * radius,
        y: center.y + Math.sin(a) * radius,
      });
    }
    const constFlag = isConstruction !== undefined ? isConstruction : get().isConstructionMode;
    const entId = `ent-${Date.now().toString(36)}-${++seq}`;
    const newEnt: SketchEntity = {
      id: entId,
      type: 'polygon',
      points: pts,
      center,
      radius,
      isClosed: true,
      isConstruction: constFlag,
      name: constFlag ? `Sanal Çokgen (${sides})` : `Çokgen (${sides})`,
    };
    set((s) => ({
      sketchEntities: [...s.sketchEntities, newEnt],
    }));
    return entId;
  },

  addCoordinateSketchPoint: (x, y, isConstruction) => {
    const pt: Point2D = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    const { sketchPoints, isConstructionMode } = get();
    const pts = [...sketchPoints, pt];
    set({
      sketchPoints: pts,
      sketchNumericCoords: pt,
      ...(isConstruction !== undefined ? { isConstructionMode: isConstruction } : {}),
    });
  },

  addSketchEntity: (entity: SketchEntity) => {
    set((s) => ({
      sketchEntities: [...s.sketchEntities, entity],
      sketchPoints: [],
      sketchClosed: false,
    }));
  },

  addSketchEntities: (entities: SketchEntity[]) => {
    set((s) => ({
      sketchEntities: [...s.sketchEntities, ...entities],
      sketchPoints: [],
      sketchClosed: false,
    }));
  },

  stampDynamicBlockToSketch: (blockId, center, params = {}) => {
    const block = SKETCH_DYNAMIC_BLOCKS.find((b) => b.id === blockId);
    if (!block) return [];

    const defaultParams: Record<string, number> = {};
    Object.entries(block.params).forEach(([k, v]) => {
      defaultParams[k] = v.default;
    });
    const merged = { ...defaultParams, ...params };

    const { solidLoops, constructionLoops } = block.generate(center, merged);
    const createdIds: string[] = [];
    const newEntities: SketchEntity[] = [];

    solidLoops.forEach((loop, lIdx) => {
      const id = `blk-${blockId}-${Date.now().toString(36)}-${++seq}-${lIdx}`;
      createdIds.push(id);
      newEntities.push({
        id,
        type: 'block',
        points: loop,
        isClosed: true,
        isConstruction: false,
        name: `${block.nameTr} #${lIdx + 1}`,
        blockType: blockId,
      });
    });

    if (constructionLoops) {
      constructionLoops.forEach((cLoop, cIdx) => {
        const id = `blk-c-${blockId}-${Date.now().toString(36)}-${++seq}-${cIdx}`;
        createdIds.push(id);
        newEntities.push({
          id,
          type: 'block',
          points: cLoop,
          isClosed: true,
          isConstruction: true,
          name: `${block.nameTr} (Ref)`,
          blockType: blockId,
        });
      });
    }

    set((s) => ({
      sketchEntities: [...s.sketchEntities, ...newEntities],
      sketchPoints: [],
      sketchClosed: false,
    }));

    return createdIds;
  },

  selectSketchEntity: (id) => set({ selectedSketchEntityId: id }),

  updateSketchEntity: (id, patch) => {
    set((s) => {
      const nextEntities = s.sketchEntities.map((e) => (e.id === id ? updateSketchEntityGeometry(e, patch) : e));
      const target = nextEntities.find((e) => e.id === id);
      return {
        sketchEntities: nextEntities,
        ...(target?.points && target.points.length >= 3
          ? { sketchPoints: [...target.points], sketchClosed: target.isClosed ?? true }
          : {}),
      };
    });
  },

  deleteSketchEntity: (id) => {
    set((s) => ({
      sketchEntities: s.sketchEntities.filter((e) => e.id !== id),
      selectedSketchEntityId: s.selectedSketchEntityId === id ? null : s.selectedSketchEntityId,
    }));
  },

  trimSketchEntityAt: (point) => {
    const { sketchEntities, selectedSketchEntityId } = get();
    const res = trimEntityAtPoint(sketchEntities, point, 8);
    if (res.trimmed) {
      set({
        sketchEntities: res.updatedEntities,
        selectedSketchEntityId: res.trimmedId === selectedSketchEntityId ? null : selectedSketchEntityId,
      });
      return true;
    }
    return false;
  },

  autoTrimOverhangsAction: () => {
    const { sketchEntities } = get();
    const res = autoTrimOverhangs(sketchEntities);
    if (res.trimmedCount > 0) {
      set({ sketchEntities: res.updatedEntities });
    }
    return res.trimmedCount;
  },

  subdivideSelectedPartMesh: () => {
    const selected = get().getSelected();
    if (!selected) return;
    const partId = selected.id;

    let geom: THREE.BufferGeometry | null = null;
    const cached = customCADGeometries.get(partId);
    if (cached instanceof THREE.BufferGeometry) {
      geom = cached;
    } else if (selected.customGeometry instanceof THREE.BufferGeometry) {
      geom = selected.customGeometry;
    } else if (
      selected.customGeometry &&
      typeof selected.customGeometry === 'object' &&
      'positions' in selected.customGeometry &&
      Array.isArray((selected.customGeometry as any).positions)
    ) {
      geom = new THREE.BufferGeometry();
      geom.setAttribute(
        'position',
        new THREE.Float32BufferAttribute((selected.customGeometry as any).positions, 3)
      );
      if ((selected.customGeometry as any).normals) {
        geom.setAttribute(
          'normal',
          new THREE.Float32BufferAttribute((selected.customGeometry as any).normals, 3)
        );
      } else {
        geom.computeVertexNormals();
      }
    } else {
      geom = createCustomGeometry(selected);
    }
    if (!geom) return;

    const nonIndexed = (typeof (geom as any).toNonIndexed === 'function' && geom.index)
      ? geom.toNonIndexed()
      : geom;
    const posAttr = nonIndexed.getAttribute('position');
    if (!posAttr) return;
    const oldVertCount = posAttr.count;

    const newPositions: number[] = [];
    const pA = new THREE.Vector3();
    const pB = new THREE.Vector3();
    const pC = new THREE.Vector3();

    for (let i = 0; i < oldVertCount; i += 3) {
      pA.fromBufferAttribute(posAttr, i);
      pB.fromBufferAttribute(posAttr, i + 1);
      pC.fromBufferAttribute(posAttr, i + 2);

      const mAB = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
      const mBC = new THREE.Vector3().addVectors(pB, pC).multiplyScalar(0.5);
      const mCA = new THREE.Vector3().addVectors(pC, pA).multiplyScalar(0.5);

      newPositions.push(pA.x, pA.y, pA.z, mAB.x, mAB.y, mAB.z, mCA.x, mCA.y, mCA.z);
      newPositions.push(pB.x, pB.y, pB.z, mBC.x, mBC.y, mBC.z, mAB.x, mAB.y, mAB.z);
      newPositions.push(pC.x, pC.y, pC.z, mCA.x, mCA.y, mCA.z, mBC.x, mBC.y, mBC.z);
      newPositions.push(mAB.x, mAB.y, mAB.z, mBC.x, mBC.y, mBC.z, mCA.x, mCA.y, mCA.z);
    }

    const subGeom = new THREE.BufferGeometry();
    subGeom.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
    subGeom.computeVertexNormals();

    const normAttr = subGeom.getAttribute('normal');
    const customData = {
      positions: Array.from(subGeom.getAttribute('position').array),
      normals: normAttr ? Array.from(normAttr.array) : undefined,
    };

    customCADGeometries.set(partId, subGeom);
    saveCADGeometry(partId, subGeom).catch(() => {});
    set((s) => ({
      parts: s.parts.map((p) => (p.id === partId ? { ...p, customGeometry: customData } : p)),
      sculptVersion: s.sculptVersion + 1,
    }));
  },

  openExtrudeDialog: (initialMode) => {
    const { pendingOp, sketchPoints, sketchEntities, isConstructionMode, activeFace, selectedId } = get();
    const resolvedContours = chainAndResolveSketchContours(sketchEntities, sketchPoints, {
      isConstructionMode,
    });
    const hasAnyOpen = resolvedContours.some((c) => c.isOpenProfile);
    set((s) => ({
      isExtrudeDialogOpen: true,
      extrudeDialogConfig: {
        ...s.extrudeDialogConfig,
        mode: initialMode || (pendingOp === 'cut' ? 'cut' : s.extrudeDialogConfig.mode) || 'extrude',
        detectedContours: resolvedContours,
        thinWallEnabled: s.extrudeDialogConfig.thinWallEnabled || hasAnyOpen,
        face: activeFace && selectedId ? { partId: selectedId, face: activeFace } : undefined,
      },
    }));
  },
  closeExtrudeDialog: () => set({ isExtrudeDialogOpen: false }),
  setExtrudeDialogConfig: (patch) => {
    set((s) => ({
      extrudeDialogConfig: { ...s.extrudeDialogConfig, ...patch },
      ...(patch.depth !== undefined ? { extrudeDepth: patch.depth } : {}),
    }));
  },

  applyExtrudeOrCut: (cfg?: Partial<ExtrudeDialogConfig>) => {
    const {
      sketchPoints,
      sketchEntities,
      pendingOp,
      parts,
      selectedId,
      activeFace,
      extrudeDepth,
      extrudeDialogConfig,
      addCut,
      sketchShapeMode,
      sketchCircleRadius,
      keepSketchAfterExtrude,
      isConstructionMode,
    } = get();

    const config = {
      mode: cfg?.mode || (pendingOp === 'cut' ? 'cut' : extrudeDialogConfig.mode) || 'extrude',
      depth: cfg?.depth || extrudeDialogConfig.depth || extrudeDepth || 20,
      isThroughAll: cfg?.isThroughAll ?? extrudeDialogConfig.isThroughAll ?? false,
      direction: cfg?.direction || extrudeDialogConfig.direction || 'outward',
      selectedContourId: cfg?.selectedContourId ?? extrudeDialogConfig.selectedContourId ?? 'all',
      revolveAngle: cfg?.revolveAngle ?? extrudeDialogConfig.revolveAngle ?? 360,
      revolveAxis: cfg?.revolveAxis ?? extrudeDialogConfig.revolveAxis ?? 'Y',
      helixPitch: cfg?.helixPitch ?? extrudeDialogConfig.helixPitch ?? 10,
      helixTurns: cfg?.helixTurns ?? extrudeDialogConfig.helixTurns ?? 3,
      helixRadius: cfg?.helixRadius ?? extrudeDialogConfig.helixRadius ?? 25,
      draftAngle: cfg?.draftAngle ?? extrudeDialogConfig.draftAngle ?? 0,
      draftDirection: cfg?.draftDirection ?? extrudeDialogConfig.draftDirection ?? 'inward',
      thinWallEnabled: cfg?.thinWallEnabled ?? extrudeDialogConfig.thinWallEnabled ?? false,
      thinWallThickness: cfg?.thinWallThickness ?? extrudeDialogConfig.thinWallThickness ?? 2,
    };

    // When editing an existing part's sketch, update the part in place instead of creating duplicates
    if (get().editingPartId && config.mode !== 'cut') {
      return get().commitExtrude();
    }

    // 1. Resolve contours using smart gap-healing and open-profile (thin feature) engine
    const resolvedContours = chainAndResolveSketchContours(sketchEntities, sketchPoints, {
      thinWallEnabled: config.thinWallEnabled,
      defaultWallThicknessMm: config.thinWallThickness || 2,
      isConstructionMode,
    });

    const diagMsgs = getContourDiagnosticMessages(resolvedContours);
    if (typeof window !== 'undefined' && diagMsgs.length > 0) {
      diagMsgs.forEach((msg) => {
        window.dispatchEvent(new CustomEvent('alucalc:toast', { detail: msg }));
      });
    }

    const cfgContours = ((cfg?.contours || (extrudeDialogConfig as any).detectedContours || []) as any[]).map((c: any, idx: number) => ({
      id: c.id || `contour-${idx}`,
      name: c.name || `Kontur #${idx + 1}`,
      points: (config.thinWallEnabled
        ? convertPathToThinRibbon(c.points, config.thinWallThickness, c.isClosed)
        : c.points) as Point2D[],
      type: c.type || 'polygon',
      radius: c.radius,
    }));

    const allLoops = resolvedContours.length > 0 ? resolvedContours : cfgContours;
    if (allLoops.length === 0) return null;

    // Filter by selectedContourId if specific contour chosen
    const targetLoops =
      config.selectedContourId && config.selectedContourId !== 'all'
        ? allLoops.filter(
            (loop, idx) =>
              loop.id === config.selectedContourId ||
              `contour-${idx}` === config.selectedContourId
          )
        : allLoops;

    const loopsToProcess = targetLoops.length > 0 ? targetLoops : allLoops;

    const isCutOperation =
      config.mode === 'cut' || config.mode === 'revolve-cut' || config.mode === 'helix-cut';

    // Face and Part resolution: only attach to a part face if a face is explicitly specified or active
    const targetPartId =
      cfg?.face?.partId ||
      extrudeDialogConfig.face?.partId ||
      (activeFace && selectedId ? selectedId : null) ||
      (isCutOperation && parts.length > 0 ? (selectedId || parts[parts.length - 1].id) : null);

    const face: SurfaceFace | null =
      cfg?.face?.face ||
      extrudeDialogConfig.face?.face ||
      (targetPartId ? (activeFace || (isCutOperation ? 'top' : null)) : null);

    const selectedPart = (targetPartId && face) ? parts.find((p) => p.id === targetPartId) || null : null;

    // ─── A. SOLIDWORKS EXTRUDE CUT, REVOLVE CUT & HELIX CUT ───
    if (isCutOperation) {
      if (!selectedPart) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('alucalc:toast', {
              detail: '⚠️ Kesme işlemi için sahnede kesilecek bir katı gövde bulunmalıdır.',
            })
          );
        }
        return null;
      }

      const cutOp =
        config.mode === 'revolve-cut'
          ? 'revolve'
          : config.mode === 'helix-cut'
          ? 'helix'
          : 'extrude';

      loopsToProcess.forEach((loop) => {
        let minX = Infinity,
          maxX = -Infinity,
          minY = Infinity,
          maxY = -Infinity;
        loop.points.forEach((pt: Point2D) => {
          if (pt.x < minX) minX = pt.x;
          if (pt.x > maxX) maxX = pt.x;
          if (pt.y < minY) minY = pt.y;
          if (pt.y > maxY) maxY = pt.y;
        });

        const rawCx = Math.round(((minX + maxX) / 2) * 10) / 10;
        const rawCy = Math.round(((minY + maxY) / 2) * 10) / 10;
        const cutX = rawCx;
        const cutY = face === 'top' || !face ? -rawCy : rawCy;
        const width = Math.max(2, Math.round(Math.abs(maxX - minX)));
        const length = Math.max(2, Math.round(Math.abs(maxY - minY)));
        const depth = config.depth;

        const isCircle = loop.type === 'circle' || (loop.radius !== undefined && loop.radius > 0);
        const cutId = `cut-${Date.now().toString(36)}-${++seq}`;
        const newCut: SurfaceCutItem = {
          id: cutId,
          type: isCircle && cutOp === 'extrude' ? 'circle' : 'profile',
          face: face || 'top',
          x: cutX,
          y: cutY,
          width,
          length,
          diameter: isCircle ? (loop.radius ? loop.radius * 2 : Math.max(width, length)) : undefined,
          depth,
          isThroughAll: config.isThroughAll,
          profile: loop.points,
          cutOp,
          draftAngle: config.draftAngle,
          draftDirection: config.draftDirection,
          revolveAngle: config.revolveAngle,
          revolveAxis: config.revolveAxis,
          helixPitch: config.helixPitch,
          helixTurns: config.helixTurns,
          helixRadius: config.helixRadius,
        };

        addCut(selectedPart.id, newCut);
      });

      if (!keepSketchAfterExtrude && (config.selectedContourId === 'all' || !config.selectedContourId)) {
        set({
          sketchPoints: [],
          sketchClosed: false,
          sketchEntities: [],
          tool: 'select',
          isExtrudeDialogOpen: false,
          activeFace: null,
          selectedId: selectedPart.id,
        });
      } else {
        set({
          isExtrudeDialogOpen: false,
          selectedId: selectedPart.id,
        });
      }
      return selectedPart.id;
    }

    // ─── B. SOLIDWORKS EXTRUDE BOSS, REVOLVE BOSS & HELIX BOSS ───
    let lastCreatedId: string | null = null;
    const solidOp =
      config.mode === 'revolve'
        ? 'revolve'
        : config.mode === 'helix'
        ? 'helix'
        : 'extrude';

    loopsToProcess.forEach((loop) => {
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      loop.points.forEach((pt: Point2D) => {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      });

      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const depth = config.depth;

      const localOuter = loop.points.map((pt: Point2D) => ({
        x: pt.x - cx,
        y: pt.y - cy,
      }));

      const id = `profile-${Date.now().toString(36)}-${++seq}`;
      const n = parts.filter((p) => p.kind === 'profile').length + 1;

      let newPos: { x: number; y: number; z: number };
      let newRot: { x: number; y: number; z: number };

      // Calculate exact world position and orientation from canonical sketch datum plane
      const sketchWorld = getSketchPlaneWorldTransform(selectedPart, face);
      const dirSign = config.direction === 'inward' ? -1 : 1;

      // Centroid offset in sketch plane coordinates
      const solidLocalInSketchPlane = new THREE.Vector3(
        cx / 10,
        cy / 10,
        (depth / 20) * dirSign
      );

      // Solid world position
      const worldPos = solidLocalInSketchPlane.clone().applyMatrix4(sketchWorld.matrix);

      // Solid world rotation matrix
      const uDir = sketchWorld.uDir.clone();
      const vDir = sketchWorld.vDir.clone().multiplyScalar(dirSign);
      const nDir = sketchWorld.normal.clone().multiplyScalar(dirSign);
      const mRot = new THREE.Matrix4().makeBasis(uDir, vDir, nDir);

      const worldQuat = new THREE.Quaternion().setFromRotationMatrix(mRot);
      const worldEuler = new THREE.Euler().setFromQuaternion(worldQuat, 'XYZ');

      const cleanVal = (v: number) => (Math.abs(v) < 1e-4 ? 0 : v);
      newPos = {
        x: cleanVal(Math.round((worldPos.x * 10 + 1e-6) * 10) / 10),
        y: cleanVal(Math.round((worldPos.y * 10 + 1e-6) * 10) / 10),
        z: cleanVal(Math.round((worldPos.z * 10 + 1e-6) * 10) / 10),
      };
      newRot = {
        x: cleanVal(Math.round(((worldEuler.x * 180) / Math.PI) * 10) / 10),
        y: cleanVal(Math.round(((worldEuler.y * 180) / Math.PI) * 10) / 10),
        z: cleanVal(Math.round(((worldEuler.z * 180) / Math.PI) * 10) / 10),
      };

      const partName =
        solidOp === 'revolve'
          ? `Revolved Solid ${n}`
          : solidOp === 'helix'
          ? `Helix Solid ${n}`
          : config.mode === 'cut'
          ? `Cut Solid ${n}`
          : `Extruded Solid ${n}`;

      const newPart: DesignPart = {
        id,
        kind: 'profile',
        name: partName,
        color: PART_COLORS[parts.length % PART_COLORS.length],
        visible: true,
        locked: false,
        parentId: selectedPart ? selectedPart.id : null,
        subAssemblyId: selectedPart ? selectedPart.subAssemblyId : null,
        position: newPos,
        rotation: newRot,
        scale: { x: 1, y: 1, z: 1 },
        params: {
          extrudeDepth: depth,
          profileAxis: 'normal',
          onFace: !!selectedPart,
          parentPartId: selectedPart ? selectedPart.id : undefined,
          face: activeFace || undefined,
          originalEntities: sketchEntities.length > 0 ? [...sketchEntities] : undefined,
          originalSketchPoints: [...localOuter],
          centroid: { x: cx, y: cy },
          revolveAngle: config.revolveAngle || 360,
          revolveRadius: 0,
          helixPitch: config.helixPitch || 10,
          helixTurns: config.helixTurns || 3,
          helixRadius: config.helixRadius || 25,
          draftAngle: config.draftAngle || 0,
          draftDirection: config.draftDirection || 'inward',
          thinWallEnabled: config.thinWallEnabled || false,
          thinWallThickness: config.thinWallThickness || 2,
          loftHeight: depth,
          loftScale: 50,
          loftTwist: 0,
          filletR: 0,
          chamferD: 0,
          shellT: 0,
        },
        outer: localOuter,
        solidOp,
      };

      set((s) => ({
        parts: [...s.parts, newPart],
        selectedId: id,
      }));
      lastCreatedId = id;
    });

    if (!keepSketchAfterExtrude && (config.selectedContourId === 'all' || !config.selectedContourId)) {
      set({
        sketchPoints: [],
        sketchClosed: false,
        sketchEntities: [],
        tool: 'select',
        isExtrudeDialogOpen: false,
        activeFace: null,
      });
    } else {
      set({
        isExtrudeDialogOpen: false,
      });
    }

    return lastCreatedId;
  },

  commitExtrude: () => {
    const { sketchPoints, pendingOp, extrudeDepth, revolveAngle, loftHeight, parts, selectedId, editingPartId, activeFace, sketchEntities } = get();
    if (sketchPoints.length < 2 && sketchEntities.length === 0) return null;

    // ─── 0. EDIT EXISTING PART BASE SKETCH ───
    if (editingPartId) {
      if (sketchPoints.length < 3) return null;
      const targetPart = parts.find((p) => p.id === editingPartId);
      if (targetPart) {
        const depth = extrudeDepth || loftHeight || targetPart.params.extrudeDepth || 20;

        const localOuter = sketchPoints.map((pt) => ({
          x: Math.round(pt.x * 10) / 10,
          y: Math.round(pt.y * 10) / 10,
        }));

        const updatedPart: DesignPart = {
          ...targetPart,
          kind: 'profile',
          outer: localOuter,
          solidOp: pendingOp,
          // Retain existing assembly world position and rotation
          position: targetPart.position,
          rotation: targetPart.rotation,
          params: {
            ...targetPart.params,
            profileAxis: 'normal',
            extrudeDepth: depth,
            revolveAngle: revolveAngle || targetPart.params.revolveAngle || 360,
            loftHeight: loftHeight || depth,
            originalEntities: sketchEntities.length > 0 ? [...sketchEntities] : targetPart.params.originalEntities,
            originalSketchPoints: [...sketchPoints],
          },
        };

        // Invalidate geometry cache so 3D viewport and Technical Drawing recompute instantly
        customCADGeometries.delete(editingPartId);

        set((s) => ({
          parts: s.parts.map((p) => (p.id === editingPartId ? updatedPart : p)),
          sketchPoints: [],
          sketchClosed: false,
          sketchEntities: [],
          tool: 'select',
          editingPartId: null,
          selectedFeature: null,
          selectedSketchEntityId: null,
          isExtrudeDialogOpen: false,
        }));

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('alucalc:toast', {
              detail: '✨ Parça çizimi ve katı gövde başarıyla güncellendi!',
            })
          );
        }

        return editingPartId;
      }
    }

    return get().applyExtrudeOrCut();
  },
}),
{
  name: 'alucalc-design-studio-parts-v1',
  partialize: (state) => ({
    parts: state.parts.map((p) => {
      if (p.customGeometry) {
        const { customGeometry, ...rest } = p;
        return rest;
      }
      return p;
    }),
    selectedId: state.selectedId,
    subAssemblies: state.subAssemblies,
    projectName: state.projectName,
    selectedMaterialId: state.selectedMaterialId,
    cadMode: state.cadMode,
    weldBeads: state.weldBeads,
    backgroundPreset: state.backgroundPreset,
  }),
  onRehydrateStorage: () => (state) => {
    if (state && typeof state.hydrateCADGeometries === 'function') {
      state.hydrateCADGeometries();
    }
  },
}
));

// Wire changes to the high-speed local auto-save & disk sync engine
if (typeof window !== 'undefined') {
  useDesignStore.subscribe((state, prevState) => {
    if (
      state.parts !== prevState.parts ||
      state.mates !== prevState.mates ||
      state.subAssemblies !== prevState.subAssemblies ||
      state.projectName !== prevState.projectName
    ) {
      import('@/cad/persistence/autoSaveManager').then(({ autoSaveManager }) => {
        autoSaveManager.triggerChange();
      }).catch(() => {});
    }
  });
}
