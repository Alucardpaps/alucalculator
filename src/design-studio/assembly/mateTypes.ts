/**
 * 3D Assembly Mate Definitions & Feature Schema
 *
 * Provides typed parametric mate primitives for:
 * - Concentric (Hole ↔ Bolt, Hole ↔ Hole, Bore ↔ Shaft)
 * - Coincident (Planar Face ↔ Planar Face, End Face ↔ Bracket)
 * - End-to-Slot (Profile End Face ↔ T-Slot Channel Centerline)
 * - Distance (Planar Offset)
 */

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type MateKind =
  | 'concentric'
  | 'coincident'
  | 'distance'
  | 'parallel'
  | 'perpendicular'
  | 'tangent'
  | 'end-to-slot';

export interface HoleAxisFeature {
  kind: 'hole-axis';
  id: string;
  name: string;
  center: Point3D; // World or part-local coordinate
  axis: Point3D;   // Direction unit vector (e.g. [0, 1, 0] or [0, 0, 1])
  radius: number;  // mm
  depth: number;   // mm
}

export interface PlanarFaceFeature {
  kind: 'planar-face';
  id: string;
  name: string;
  origin: Point3D; // Point on the plane
  normal: Point3D; // Outward unit normal
  width?: number;
  height?: number;
}

export interface SlotChannelFeature {
  kind: 'slot-channel';
  id: string;
  name: string;
  center: Point3D;    // Point on the slot center line
  direction: Point3D; // Slot longitudinal direction (e.g. extrusion axis)
  normal: Point3D;    // Slot opening normal (pointing out of the profile)
  slotWidth: number;  // e.g. 6, 8, 10 mm
  slotDepth: number;  // mm
}

export type MateFeature = HoleAxisFeature | PlanarFaceFeature | SlotChannelFeature;

export interface MateConstraint {
  id: string;
  kind: MateKind;
  name?: string;
  partAId: string;
  featureA: MateFeature;
  partBId: string;
  featureB: MateFeature;
  offset?: number;     // mm offset along axis or normal
  flip?: boolean;      // Invert alignment direction
  active?: boolean;    // Enable/disable mate
  suppressed?: boolean;// SolidWorks Suppress/Unsuppress state
}

export interface MateSolveResult {
  success: boolean;
  message: string;
  appliedMates: number;
  overconstrainedMates: string[];
}
