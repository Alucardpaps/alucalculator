/**
 * 🧑‍🏭 WELDMENT & FABRICATION TYPES (ISO 2553 / EN 1993-1-8 / AWS D1.1)
 *
 * Defines structural welding data contracts for AluCAD OS CAD Mode 2:
 * "KAYNAK + ÇATMA + İŞLEME" (Welded Structures & Post-Weld Machining).
 */

import type { SurfaceCutItem, HoleItem } from '../holeStandards';
import type { Point3D } from '../designStore';

export type WeldJointType = 'fillet' | 'butt' | 'seam' | 'bevel' | 'plug';

export type WeldFillerWire =
  | 'ER70S-6'       // Structural Steel MIG/MAG (EN ISO 14341-A: G 42 4 M21 3Si1)
  | 'E7018'         // Low-hydrogen stick electrode (AWS A5.1)
  | 'AlSi5_4043'    // Aluminum Silicon alloy for 6000 series (AWS A5.10 ER4043)
  | 'AlMg5_5356'    // Aluminum Magnesium alloy for marine/chassis (AWS A5.10 ER5356)
  | 'ER308L';       // Austenitic Stainless Steel (EN ISO 14343-A)

export interface WeldBead {
  id: string;
  name: string;
  type: WeldJointType;
  standard: 'ISO 2553' | 'AWS D1.1' | 'EN 1993-1-8' | 'DIN EN ISO 5817';
  partAId: string;
  partBId: string;

  // 3D Joint Placement & Orientation (in mm & degrees)
  position: Point3D;
  rotation: Point3D;

  // Primary Weld Dimensions
  legSizeMm: number;        // Leg length 'z' or throat thickness 'a' (e.g. 5 mm)
  lengthMm: number;         // Bead length along joint (e.g. 100 mm)
  throatThicknessA?: number;// a = z * 0.707 (computed if omitted)

  // Groove Parameters (for Butt & Bevel welds)
  grooveAngleDeg?: number;  // e.g. 60°
  rootOpeningMm?: number;   // e.g. 2 mm

  // Intermittent Welding (Kesintili Kaynak: l (e))
  intermittent?: boolean;
  segmentLengthMm?: number; // Bead segment length (e.g. 40 mm)
  pitchMm?: number;         // Center-to-center pitch (e.g. 80 mm)

  // Material & Aesthetics
  material: WeldFillerWire;
  color?: string;           // Amber metallic '#f59e0b' or stainless steel '#cbd5e1'

  // Post-Weld Machining: Cuts & Holes directly slicing through this weld bead
  cuts?: SurfaceCutItem[];
  holes?: HoleItem[];

  createdAt: number;
}

export interface WeldCalculationReport {
  throatThicknessMm: number;
  totalLengthMm: number;
  effectiveLengthMm: number;
  weldVolumeCm3: number;
  weldMassKg: number;
  designResistanceKn: number; // Design shear capacity per EN 1993-1-8 Clause 4.5.3
  heatInputKjPerMm: number;   // Heat input Q = η * (U * I * 60) / (v * 1000) (EN 1011-1)
  hazWidthMm: number;         // Estimated heat-affected zone boundary
}
