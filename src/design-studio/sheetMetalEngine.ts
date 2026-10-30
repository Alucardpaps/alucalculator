/**
 * Sheet Metal 3D Parametric Engine, DIN 6935 Unfolder & Press Brake Optimizer
 * Methodology Tier 1 (Normative) & Tier 2 (Scientific/Empirical):
 *  - DIN 6935:2011-10 (Cold bending of flat steel products — Bend allowance BA,
 *    Outside Setback OSSB, Bend Deduction BD, Neutral Axis K-factor).
 *  - VDI 3389 / Industrial Press-Brake Air Bending Tonnage: F = (1.42 * Rm * t^2 * L) / (1000 * V).
 *  - Press Brake Collision & Optimal Bending Sequencing (Outer-to-inner & tooling clearance).
 *  - Hole Deformation / Sünme (Tensile Plastic Strain Ovalization near bend tangent line).
 *
 * Bridges `/sheet-metal/` calculator and `/design-studio/` 3D CAD workspace.
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Evaluator, Brush, SUBTRACTION } from 'three-bvh-csg';
import { parseDxfContent } from '@/utils/dxfParser';

export type SheetMetalEdgeType =
  | 'end'            // Uç Kenar (Devam eden büküm)
  | 'start'          // Taban sacı başlangıç kenarı
  | 'side_a'         // Ön / Sol Yan Kenar (Transverse Edge at V=0, 1. Resimdeki beyaz okun gösterdiği kenar!)
  | 'side_b'         // Arka / Sağ Yan Kenar (Transverse Edge at V=L)
  | 'radius_curved'; // Kavisli / Dairesel Radius Kenar (Kalıpla Kase / Derin Çekme Bükümü)

export type SheetMetalWidthMode =
  | 'full'     // Tüm kenar boyunca (Klasik)
  | 'partial'; // Kısmi Büküm (2. Resimdeki y, z, x gibi!)

export interface SheetMetalBendRow {
  id: string;
  /** Bend deviation angle in degrees (90 = 90° right-angle bend, 45 = gentle 45° bend, 135 = sharp 135° bend) */
  angle: number;
  /** Inner bend radius R (mm) */
  radius: number;
  /** Outside mold-line flange length following this bend (mm) */
  flange: number;
  /** Bend direction relative to current flange travel */
  direction: 'up' | 'down';
  /**
   * Hangi flanşın kenarına bağlı olduğu:
   * 0: Taban Sacı (F0), 1: Flanş 1 (F1), 2: Flanş 2 (F2) vb.
   * Tanımlanmazsa sıralı zincir (chain end) olarak davranır.
   */
  targetFlangeIndex?: number;
  /**
   * Seçilen Kenar:
   * - 'end': Flanşın uç kenarı (varsayılan)
   * - 'side_a': Sol / Ön Yan Kenar (1. Resimdeki beyaz okun gösterdiği kenar!)
   * - 'side_b': Sağ / Arka Yan Kenar
   * - 'start': Taban sacı başlangıç kenarı
   * - 'radius_curved': Kavisli / Dairesel Radius Kenar (Kalıp Gerektirir!)
   */
  edge?: SheetMetalEdgeType;
  edgeType?: 'straight' | 'radius_curved';
  /** True if this bend follows a curved radius edge, requiring a deep drawing mould or stamping die */
  requiresMould?: boolean;
  mouldType?: 'stamping_die' | 'deep_drawing';
  curvedRadiusMm?: number;
  /**
   * Büküm Genişlik Modu:
   * - 'full': Kenarın tamamına yayılır.
   * - 'partial': 2. Resimdeki gibi y, z, x olarak bölünmüş kısmi flanş!
   */
  widthMode?: SheetMetalWidthMode;
  /**
   * Kısmi Büküm Parametreleri (2. Resimdeki y, z, x):
   * y = offsetStart (Sol boşluk / Baştan mesafe, mm)
   * z = flangeWidth (Büküm genişliği, mm)
   * x = offsetEnd (Sağ boşluk / Kalan mesafe = EdgeLength - y - z, mm)
   */
  offsetStart?: number; // y (mm)
  flangeWidth?: number; // z (mm)
  offsetEnd?: number;   // x (mm)
  /** Köşe / Kenar yırtılma boşaltması (Relief Cut) genişliği (varsayılan: t veya 1.5mm) */
  reliefWidth?: number;
  reliefDepth?: number;
}

export interface SheetMetalKRow {
  rtMin: number;
  rtMax: number;
  k: number;
}

export type SheetMetalCutoutType =
  | 'round_hole'    // Dairesel Montaj Deliği
  | 'slot'          // Oval Slot Delik
  | 'rect_cutout'   // Dikdörtgen Kesik
  | 'pocket'        // İç Havuz Boşaltması (Pencere / Boşluk)
  | 'tab'           // Balkon / Sac Kulağı Dilim Kesiği (Kenardan içeri U kesim)
  | 'corner_notch'  // Köşe Kertmesi (90° köşe boşaltması veya köşe rahatlatması)
  | 'louver'        // Dinamik Blok: Louver Havalandırma Panjuru
  | 'nema_mount'    // Dinamik Blok: NEMA Step/Servo Motor Yuvası
  | 'din_keyway'    // Dinamik Blok: DIN 6885 Kama Kanalı Slotu
  | 'custom_path';  // DXF / SVG veya Dinamik Bloktan Yüklenen Özel Kontur

export interface SheetMetalCutout {
  id: string;
  name?: string;
  type: SheetMetalCutoutType;
  /** Target flange index: 0 = First Flange F0, 1 = F1, 2 = F2, etc. */
  flangeIndex: number;
  /** Distance along the flange from its start mold-line/edge (mm) */
  posU: number;
  /** Distance across the extrusion width / bend length (0..length mm, L/2 is center) */
  posV: number;
  /** Dimensions (mm) */
  diameter?: number; // for round_hole (e.g. 8.5)
  width?: number; // for slot/rect/pocket/tab (e.g. 12)
  length?: number; // for slot/rect/pocket/tab (e.g. 30)
  rotationDeg?: number;
  /** Corner radius for pocket / rect cutouts (mm) */
  cornerRadius?: number;
  /** Custom 2D contour profile (points in mm relative to cutout center) */
  profile?: Array<{ x: number; y: number }>;
  /**
   * Lazer Rahatlatma Yarığı (Laser Relief Slit):
   * Delik ile büküm çizgisi arasına 1mm genişliğinde kılcal kesi açarak sünmeyi/gerilmeyi soğurur.
   */
  reliefSlit?: {
    enabled: boolean;
    slitWidthMm?: number;        // varsayılan 1.0 mm
    slitLengthMm?: number;       // varsayılan delik çapı + 4 mm
    distanceFromHoleMm?: number; // delik kenarından mesafe (varsayılan 1.5 mm)
  };
  /**
   * Ters Kompanzasyon (Pre-compensated Oval):
   * Açınımda ters basık elips kesilerek, büküldüğünde uzayıp tam dairesel deliğe dönüşmesi sağlanır.
   */
  preCompensated?: boolean;
  /**
   * Büküm Sonrası Delme (Post-Bend Operation):
   * Delik sac abkantta büküldükten sonra deleceği için sünme sıfırlanır.
   */
  postBendOperation?: boolean;
  /** Kaynak dosya adı (e.g. montaj_slotu.dxf, logo.svg) */
  sourceFileName?: string;
  /** Köşe kertmesi için köşe seçimi */
  notchCorner?: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
}

export interface SheetMetalSpec {
  id?: string;
  name: string;
  materialName: string;
  /** Yield strength Ry (MPa) */
  yieldStrengthMpa: number;
  /** Density (g/cm³) */
  densityGcm3: number;
  /** Sheet thickness t (mm) */
  thickness: number;
  /** Extrusion width / press-brake bend length L (mm) */
  length: number;
  /** First outside mold-line flange F0 (mm) */
  firstFlange: number;
  /** Ordered sequence of bends and subsequent flanges */
  bends: SheetMetalBendRow[];
  /** Optional custom K-factor lookup table */
  kTable?: SheetMetalKRow[];
  /** Optional cutouts, holes, slots stamped into the sheet metal */
  cutouts?: SheetMetalCutout[];
  /** Display color hex */
  color?: string;
}

export interface SheetMetalBendAnalysisRow {
  index: number;
  id: string;
  angle: number;
  radius: number;
  flange: number;
  direction: 'up' | 'down';
  targetFlangeIndex?: number;
  edge?: SheetMetalEdgeType;
  widthMode?: SheetMetalWidthMode;
  offsetStart?: number; // y (mm)
  flangeWidth?: number; // z (mm)
  offsetEnd?: number;   // x (mm)
  effectiveBendLengthMm: number;
  rtRatio: number;
  kFactor: number;
  /** Bend Allowance BA (mm) along neutral axis */
  ba: number;
  /** Outside Setback OSSB (mm) */
  ossb: number;
  /** Bend Deduction BD = 2*OSSB - BA (mm) */
  bd: number;
  /** Distance from left edge of flat blank to this bend's centerline x_c (mm) */
  bendLineMm: number;
  /** Straight flat segment length following this bend (mm) */
  straightFlangeMm: number;
  /** Required press-brake air-bending force (metric tons) */
  tonnage: number;
  /** True if inner radius R < thickness t */
  isCrackingRisk: boolean;
}

/**
 * Returns the maximum available edge length for any flange and edge.
 * e.g. for an 'end' or 'start' edge, it is the extrusion length L.
 * For 'side_a' (Front) or 'side_b' (Rear), it is the flange mold-line length.
 */
export function getFlangeAvailableEdgeLength(
  spec: SheetMetalSpec,
  flangeIndex = 0,
  edge: SheetMetalEdgeType = 'end'
): number {
  const L = Math.max(1, spec.length || 100);
  if (edge === 'end' || edge === 'start') {
    return L;
  }
  if (flangeIndex === 0) {
    return Math.max(1, spec.firstFlange || 40);
  }
  const bend = spec.bends[flangeIndex - 1];
  return Math.max(1, bend ? bend.flange : 40);
}

export interface SheetMetalAnalysisResult {
  firstStraightFlangeMm: number;
  totalOutsideSumMm: number;
  totalBendDeductionMm: number;
  totalBendAllowanceMm: number;
  totalFlatLengthMm: number;
  maxTonnage: number;
  totalTonnageSum: number;
  blankAreaCm2: number;
  massKg: number;
  hasCrackingRisk: boolean;
  rows: SheetMetalBendAnalysisRow[];
}

export interface Point2D {
  x: number;
  y: number;
}

export interface SheetMetalContour2D {
  midlinePoints: Point2D[];
  outerPoints: Point2D[];
  innerPoints: Point2D[];
  /** Closed counter-clockwise polygon of the sheet cross-section (width X, height Y) */
  closedPolygon: Point2D[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
}

export const DEFAULT_DIN6935_K_TABLE: SheetMetalKRow[] = [
  { rtMin: 0, rtMax: 1, k: 0.33 },
  { rtMin: 1, rtMax: 3, k: 0.40 },
  { rtMin: 3, rtMax: 5, k: 0.45 },
  { rtMin: 5, rtMax: Infinity, k: 0.50 },
];

export interface SheetMetalPreset {
  id: string;
  labelTr: string;
  labelEn: string;
  descTr: string;
  descEn: string;
  badge: string;
  spec: SheetMetalSpec;
}

export const SHEET_METAL_PRESETS: SheetMetalPreset[] = [
  {
    id: 'l_bracket',
    labelTr: 'L-Braket (90° Köşebent)',
    labelEn: 'L-Bracket (90° Gusset)',
    descTr: 'Standart tek bükümlü 90° montaj braketi',
    descEn: 'Standard single-bend 90° mounting bracket',
    badge: 'L-90°',
    spec: {
      name: 'Sac L-Braket 60x50x3',
      materialName: 'EN AW-5052 H32 (AlMg2.5)',
      yieldStrengthMpa: 195,
      densityGcm3: 2.68,
      thickness: 3,
      length: 120,
      firstFlange: 60,
      bends: [
        { id: 'b1', angle: 90, radius: 3, flange: 50, direction: 'up' },
      ],
      cutouts: [
        { id: 'c1', name: 'Montaj Deliği Ø8.5', type: 'round_hole', flangeIndex: 0, posU: 25, posV: 60, diameter: 8.5 },
        { id: 'c2', name: 'Slot Delik 10x24', type: 'slot', flangeIndex: 1, posU: 25, posV: 60, width: 10, length: 24 },
      ],
      color: '#38bdf8',
    },
  },
  {
    id: 'u_channel',
    labelTr: 'U-Kanal Şasi Profili',
    labelEn: 'U-Channel Chassis',
    descTr: 'Simetrik çift 90° yukarı bükümlü U-kanal sac gövde',
    descEn: 'Symmetric double 90° up-bent U-channel tray',
    badge: 'U-KANAL',
    spec: {
      name: 'Sac U-Kanal 45x90x45',
      materialName: 'EN AW-5754 H22 (AlMg3)',
      yieldStrengthMpa: 185,
      densityGcm3: 2.67,
      thickness: 2.5,
      length: 180,
      firstFlange: 45,
      bends: [
        { id: 'b1', angle: 90, radius: 3, flange: 90, direction: 'up' },
        { id: 'b2', angle: 90, radius: 3, flange: 45, direction: 'up' },
      ],
      cutouts: [
        { id: 'c1', name: 'Kablo Geçiş Deliği Ø20', type: 'round_hole', flangeIndex: 1, posU: 45, posV: 90, diameter: 20 },
      ],
      color: '#22d3ee',
    },
  },
  {
    id: 'z_bracket',
    labelTr: 'Z-Profil (Ofset Sac)',
    labelEn: 'Z-Profile (Offset Bracket)',
    descTr: 'Zıt yönlü (Down + Up) çift 90° bükümlü kademeli Z sac',
    descEn: 'Opposite-direction (Down + Up) stepped Z sheet profile',
    badge: 'Z-SAC',
    spec: {
      name: 'Sac Z-Profil 40x50x40',
      materialName: 'EN AW-5052 H32 (AlMg2.5)',
      yieldStrengthMpa: 195,
      densityGcm3: 2.68,
      thickness: 2,
      length: 140,
      firstFlange: 40,
      bends: [
        { id: 'b1', angle: 90, radius: 2, flange: 50, direction: 'down' },
        { id: 'b2', angle: 90, radius: 2, flange: 40, direction: 'up' },
      ],
      cutouts: [
        { id: 'c1', name: 'Bağlantı Deliği Ø6.5', type: 'round_hole', flangeIndex: 0, posU: 20, posV: 70, diameter: 6.5 },
        { id: 'c2', name: 'Hafifletme Pencereli Kesik', type: 'rect_cutout', flangeIndex: 1, posU: 25, posV: 70, width: 16, length: 45 },
      ],
      color: '#a78bfa',
    },
  },
  {
    id: 'hat_omega',
    labelTr: 'Omega (Şapka) Takviye Sacı',
    labelEn: 'Omega (Hat) Stiffener',
    descTr: '4 bükümlü yüksek ataletli şapka (Omega) kaburga sacı',
    descEn: '4-bend high-stiffness Omega hat channel profile',
    badge: 'OMEGA Ω',
    spec: {
      name: 'Sac Omega Profil 25x45x70',
      materialName: 'EN AW-6061 T6 (AlMg1SiCu)',
      yieldStrengthMpa: 240,
      densityGcm3: 2.70,
      thickness: 2,
      length: 220,
      firstFlange: 25,
      bends: [
        { id: 'b1', angle: 90, radius: 2.5, flange: 45, direction: 'up' },
        { id: 'b2', angle: 90, radius: 2.5, flange: 70, direction: 'down' },
        { id: 'b3', angle: 90, radius: 2.5, flange: 45, direction: 'down' },
        { id: 'b4', angle: 90, radius: 2.5, flange: 25, direction: 'up' },
      ],
      cutouts: [
        { id: 'c1', name: 'Üst Tepe Deliği Ø10', type: 'round_hole', flangeIndex: 2, posU: 35, posV: 110, diameter: 10 },
      ],
      color: '#34d399',
    },
  },
  {
    id: 'c_enclosure',
    labelTr: 'C-Kutu Muhafaza Gövdesi',
    labelEn: 'C-Box Enclosure Tray',
    descTr: 'İçe kıvrımlı dudaklı 4 bükümlü pano / elektronik kutu gövdesi',
    descEn: '4-bend inward-lipped electrical enclosure chassis',
    badge: 'C-KUTU',
    spec: {
      name: 'Sac Kutu Şasi 18x55x120',
      materialName: 'EN AW-5052 H32 (AlMg2.5)',
      yieldStrengthMpa: 195,
      densityGcm3: 2.68,
      thickness: 2,
      length: 200,
      firstFlange: 18,
      bends: [
        { id: 'b1', angle: 90, radius: 2, flange: 55, direction: 'up' },
        { id: 'b2', angle: 90, radius: 2, flange: 120, direction: 'up' },
        { id: 'b3', angle: 90, radius: 2, flange: 55, direction: 'up' },
        { id: 'b4', angle: 90, radius: 2, flange: 18, direction: 'up' },
      ],
      cutouts: [
        { id: 'c1', name: 'Konnektör Kesimi 25x50', type: 'rect_cutout', flangeIndex: 2, posU: 60, posV: 100, width: 25, length: 50 },
        { id: 'c2', name: 'Havalandırma Slotu 8x30', type: 'slot', flangeIndex: 1, posU: 25, posV: 60, width: 8, length: 30 },
      ],
      color: '#f59e0b',
    },
  },
];

/**
 * Look up DIN 6935 K-factor by R/t ratio
 */
export function lookupSheetMetalKFactor(
  rtRatio: number,
  kTable: SheetMetalKRow[] = DEFAULT_DIN6935_K_TABLE
): number {
  const safeRt = Math.max(0, rtRatio);
  const row = kTable.find((r) => safeRt >= r.rtMin && safeRt < r.rtMax);
  return row ? row.k : 0.50;
}

/**
 * DIN 6935 Bend Allowance (mm):
 * BA = (pi * angle / 180) * (R + K * t)
 */
export function calcSheetMetalBA(angleDeg: number, radiusMm: number, kFactor: number, thicknessMm: number): number {
  const clampedAngle = Math.max(0.1, Math.min(179.9, angleDeg));
  return (Math.PI / 180) * clampedAngle * (Math.max(0.1, radiusMm) + kFactor * Math.max(0.1, thicknessMm));
}

/**
 * DIN 6935 Outside Setback (mm):
 * OSSB = (R + t) * tan(angle / 2)
 */
export function calcSheetMetalOSSB(angleDeg: number, radiusMm: number, thicknessMm: number): number {
  if (angleDeg >= 179.5) return radiusMm + thicknessMm;
  const safeAngle = Math.min(179.5, Math.max(0.1, angleDeg));
  return (Math.max(0.1, radiusMm) + Math.max(0.1, thicknessMm)) * Math.tan(((safeAngle * Math.PI) / 180) / 2);
}

/**
 * DIN 6935 Bend Deduction (mm):
 * BD = 2 * OSSB - BA
 */
export function calcSheetMetalBD(angleDeg: number, radiusMm: number, kFactor: number, thicknessMm: number): number {
  return 2 * calcSheetMetalOSSB(angleDeg, radiusMm, thicknessMm) - calcSheetMetalBA(angleDeg, radiusMm, kFactor, thicknessMm);
}

/**
 * Press-Brake Air Bending Force (metric tons):
 * F [ton] = (1.42 * Rm * t^2 * L) / (1000 * V) * 0.10197
 */
export function calcPressBrakeTonnage(
  thicknessMm: number,
  lengthMm: number,
  dieOpeningVMm: number,
  tensileStrengthRmMpa: number
): number {
  if (dieOpeningVMm <= 0 || lengthMm <= 0 || thicknessMm <= 0) return 0;
  return ((1.42 * tensileStrengthRmMpa * thicknessMm * thicknessMm * lengthMm) / (dieOpeningVMm * 1000)) * 0.10197;
}

/**
 * Computes full DIN 6935 flat-pattern & press-brake analysis for a multi-bend sheet metal part.
 */
export function calculateSheetMetalAnalysis(spec: SheetMetalSpec): SheetMetalAnalysisResult {
  const t = Math.max(0.2, spec.thickness || 2);
  const L = Math.max(1, spec.length || 100);
  const f0 = Math.max(1, spec.firstFlange || 40);
  const kTable = spec.kTable && spec.kTable.length > 0 ? spec.kTable : DEFAULT_DIN6935_K_TABLE;
  const Rm = Math.round(Math.max(50, spec.yieldStrengthMpa || 195) * 1.35);

  const ossbs = spec.bends.map((b) => calcSheetMetalOSSB(b.angle, b.radius, t));
  const firstStraightFlangeMm = Math.max(0.5, f0 - (ossbs.length > 0 ? ossbs[0] : 0));

  let runningFlatPos = firstStraightFlangeMm;
  let totalBA = 0;
  let totalBD = 0;
  let maxTonnage = 0;
  let totalTonnageSum = 0;

  const rows: SheetMetalBendAnalysisRow[] = spec.bends.map((b, idx) => {
    const r = Math.max(0.1, b.radius);
    const angle = Math.max(1, Math.min(179, b.angle));
    const rtRatio = r / t;
    const kFactor = lookupSheetMetalKFactor(rtRatio, kTable);
    const ba = calcSheetMetalBA(angle, r, kFactor, t);
    const ossb = ossbs[idx];
    const bd = 2 * ossb - ba;

    const bendLineMm = runningFlatPos + ba / 2;
    const nextOssb = idx + 1 < ossbs.length ? ossbs[idx + 1] : 0;
    const straightFlangeMm = Math.max(0.5, b.flange - ossb - nextOssb);

    runningFlatPos += ba + straightFlangeMm;
    totalBA += ba;
    totalBD += bd;

    const targetIdx = b.targetFlangeIndex ?? idx;
    const edgeType = b.edge ?? 'end';
    const availEdgeLen = getFlangeAvailableEdgeLength(spec, targetIdx, edgeType);
    const isPartial = b.widthMode === 'partial';

    // y = offsetStart, z = flangeWidth, x = offsetEnd
    const offsetStart = isPartial ? Math.max(0, b.offsetStart ?? 25) : 0;
    const defaultZ = Math.max(1, availEdgeLen - offsetStart - 25);
    const flangeWidth = isPartial ? Math.max(1, Math.min(availEdgeLen - offsetStart, b.flangeWidth ?? defaultZ)) : availEdgeLen;
    const offsetEnd = isPartial ? Math.max(0, availEdgeLen - offsetStart - flangeWidth) : 0;
    const effectiveBendLengthMm = isPartial ? flangeWidth : availEdgeLen;

    const dieOpeningV = Math.max(t * 6, r * 6);
    const tonnage = calcPressBrakeTonnage(t, effectiveBendLengthMm, dieOpeningV, Rm);
    if (tonnage > maxTonnage) maxTonnage = tonnage;
    totalTonnageSum += tonnage;

    return {
      index: idx + 1,
      id: b.id,
      angle,
      radius: r,
      flange: b.flange,
      direction: b.direction,
      targetFlangeIndex: targetIdx,
      edge: edgeType,
      widthMode: b.widthMode ?? 'full',
      offsetStart,
      flangeWidth,
      offsetEnd,
      effectiveBendLengthMm,
      rtRatio,
      kFactor,
      ba,
      ossb,
      bd,
      bendLineMm,
      straightFlangeMm,
      tonnage,
      isCrackingRisk: r < t,
    };
  });

  const totalOutsideSumMm = f0 + spec.bends.reduce((acc, b) => acc + b.flange, 0);
  const exactTotalFromBD = Math.max(runningFlatPos, totalOutsideSumMm - totalBD);
  const totalFlatLengthMm = Number(exactTotalFromBD.toFixed(4));

  const blankAreaCm2 = (totalFlatLengthMm * L) / 100;
  const volumeCm3 = (totalFlatLengthMm * L * t) / 1000;
  const density = spec.densityGcm3 || 2.70;
  const massKg = (volumeCm3 * density) / 1000;

  return {
    firstStraightFlangeMm,
    totalOutsideSumMm,
    totalBendDeductionMm: totalBD,
    totalBendAllowanceMm: totalBA,
    totalFlatLengthMm,
    maxTonnage,
    totalTonnageSum,
    blankAreaCm2,
    massKg,
    hasCrackingRisk: rows.some((r) => r.isCrackingRisk),
    rows,
  };
}

/* ─── HOLE & CUTOUT DEFORMATION (SÜNME) PHYSICS ENGINE ───────────────────── */

export interface HoleDeformationResult {
  cutoutId: string;
  cutoutType: string;
  flangeIndex: number;
  flatCoordX: number; // in flat blank coordinate system (0..totalFlatLengthMm)
  flatCoordY: number; // in flat blank coordinate system (0..length)
  distanceToNearestBendMm: number;
  nearestBendIndex: number;
  nearestBendLineX: number;
  /** Safe distance threshold from bend axis (mm): R + 2*t + diameter/2 */
  safeDistanceMm: number;
  /** Strain factor delta (0..1) */
  strainFactor: number;
  /** Percentage of elongation / ovalization (e.g. 18.5%) */
  elongationPercent: number;
  /** Deformed major diameter (mm) */
  deformedMajorMm: number;
  /** Deformed minor diameter (mm) with Poisson contraction */
  deformedMinorMm: number;
  /** Risk classification */
  riskLevel: 'SAFE' | 'MODERATE_DISTORTION' | 'SEVERE_TEARING';
  /** DFM advice text */
  dfmAdviceTr: string;
  dfmAdviceEn: string;
  /** Recommended safe offset along flange posU (mm) */
  recommendedSafePosUMm?: number;
  /** Active engineering remedy */
  activeRemedy?: 'relief_slit' | 'pre_compensated' | 'post_bend' | 'offset_safe' | null;
}

/**
 * Calculates the exact flat-pattern coordinates (X along unfolded strip, Y along bend length)
 * of a cutout positioned on a given flange.
 */
export function calculateCutoutFlatCoordinates(
  spec: SheetMetalSpec,
  cutout: SheetMetalCutout
): { flatX: number; flatY: number; flangeStartFlatX: number } {
  const analysis = calculateSheetMetalAnalysis(spec);
  const t = spec.thickness || 2;
  const ossbs = spec.bends.map((b) => calcSheetMetalOSSB(b.angle, b.radius, t));

  // Determine starting flat X of the requested flange
  let runningX = 0;
  let flangeStartFlatX = 0;

  if (cutout.flangeIndex === 0) {
    flangeStartFlatX = 0;
    runningX = Math.max(0, Math.min(analysis.firstStraightFlangeMm, cutout.posU));
  } else {
    // Accumulate F0 + Bends + subsequent flanges
    runningX = analysis.firstStraightFlangeMm;
    for (let i = 0; i < spec.bends.length; i++) {
      const row = analysis.rows[i];
      runningX += row.ba;
      if (cutout.flangeIndex === i + 1) {
        flangeStartFlatX = runningX;
        const availableFlangeFlat = row.straightFlangeMm;
        runningX += Math.max(0, Math.min(availableFlangeFlat, cutout.posU));
        break;
      }
      runningX += row.straightFlangeMm;
    }
  }

  const flatY = Math.max(0, Math.min(spec.length, cutout.posV));
  return { flatX: runningX, flatY, flangeStartFlatX };
}

/**
 * Analyzes whether a hole or cutout experiences plastic tensile deformation ("sünme" / ovalization)
 * during press-brake bending, and calculates the exact distorted ellipse geometry and DFM feedback.
 */
export function analyzeHoleDeformation(
  spec: SheetMetalSpec,
  cutout: SheetMetalCutout
): HoleDeformationResult {
  const analysis = calculateSheetMetalAnalysis(spec);
  const t = Math.max(0.4, spec.thickness || 2);
  const { flatX, flatY } = calculateCutoutFlatCoordinates(spec, cutout);

  const nominalD = cutout.diameter || cutout.width || 8;
  const radiusCutout = nominalD / 2;

  // Find the nearest bend line
  let nearestBendIndex = 1;
  let nearestBendLineX = analysis.rows[0]?.bendLineMm ?? 0;
  let minAxisDistance = Infinity;

  analysis.rows.forEach((row) => {
    const dist = Math.abs(flatX - row.bendLineMm);
    if (dist < minAxisDistance) {
      minAxisDistance = dist;
      nearestBendIndex = row.index;
      nearestBendLineX = row.bendLineMm;
    }
  });

  const nearestRow = analysis.rows[nearestBendIndex - 1] || analysis.rows[0];
  const rInside = nearestRow ? nearestRow.radius : 2;
  const baHalf = nearestRow ? nearestRow.ba / 2 : 2;

  // Tangent distance from bend center line
  const distanceToBendTangentMm = Math.max(0, minAxisDistance - radiusCutout - baHalf);
  const safeDistanceMm = rInside + 2.0 * t + radiusCutout;
  const recommendedSafePosUMm = Number((safeDistanceMm + 1.0).toFixed(1));

  // Peak outer-fiber bending strain (approx. epsilon = t / (2*R + t))
  const peakStrain = t / (2 * rInside + t);

  // Exponential strain decay outside bend tangent line
  let strainFactor = 0;
  if (minAxisDistance < baHalf + radiusCutout) {
    // Hole is directly inside the bend allowance arc zone! Max distortion
    strainFactor = peakStrain * 0.95;
  } else if (distanceToBendTangentMm < 2.0 * t) {
    // Inside plastic tension zone (d_edge < 2t)
    const decayRatio = (2.0 * t - distanceToBendTangentMm) / (2.0 * t);
    strainFactor = peakStrain * Math.pow(decayRatio, 1.25);
  }

  const elongationPercent = Number((strainFactor * 100).toFixed(1));
  const deformedMajorMm = Number((nominalD * (1 + strainFactor)).toFixed(2));
  const deformedMinorMm = Number((nominalD * (1 - 0.33 * strainFactor)).toFixed(2));

  // ─── CHECK 1: Relief Slit Remedy Active ───
  if (cutout.reliefSlit?.enabled) {
    return {
      cutoutId: cutout.id,
      cutoutType: cutout.type,
      flangeIndex: cutout.flangeIndex,
      flatCoordX: Number(flatX.toFixed(2)),
      flatCoordY: Number(flatY.toFixed(2)),
      distanceToNearestBendMm: Number(minAxisDistance.toFixed(2)),
      nearestBendIndex,
      nearestBendLineX: Number(nearestBendLineX.toFixed(2)),
      safeDistanceMm: Number(safeDistanceMm.toFixed(2)),
      strainFactor: 0,
      elongationPercent: 0,
      deformedMajorMm: nominalD,
      deformedMinorMm: nominalD,
      riskLevel: 'SAFE',
      activeRemedy: 'relief_slit',
      recommendedSafePosUMm,
      dfmAdviceTr: '✅ KORUMALI (Lazer Rahatlatma Yarığı): Delik ile büküm çizgisi arasına açılan 1mm kılcal kesi büküm gerilmesini absorbe etti. Delik daireselliğini korur.',
      dfmAdviceEn: '✅ PROTECTED (Laser Relief Slit): Micro relief slit absorbed tensile bending strain; hole circularity fully preserved.',
    };
  }

  // ─── CHECK 2: Post-Bend Punching/Drilling Remedy Active ───
  if (cutout.postBendOperation) {
    return {
      cutoutId: cutout.id,
      cutoutType: cutout.type,
      flangeIndex: cutout.flangeIndex,
      flatCoordX: Number(flatX.toFixed(2)),
      flatCoordY: Number(flatY.toFixed(2)),
      distanceToNearestBendMm: Number(minAxisDistance.toFixed(2)),
      nearestBendIndex,
      nearestBendLineX: Number(nearestBendLineX.toFixed(2)),
      safeDistanceMm: Number(safeDistanceMm.toFixed(2)),
      strainFactor: 0,
      elongationPercent: 0,
      deformedMajorMm: nominalD,
      deformedMinorMm: nominalD,
      riskLevel: 'SAFE',
      activeRemedy: 'post_bend',
      recommendedSafePosUMm,
      dfmAdviceTr: '✅ BÜKÜM SONRASI DELME: Delik sac abkantta büküldükten sonra işleneceği için sünme ve yırtılma riski sıfırlanmıştır.',
      dfmAdviceEn: '✅ POST-BEND DRILLING: Cutout will be stamped after press brake forming; zero strain distortion.',
    };
  }

  // ─── CHECK 3: Pre-Compensated Oval Remedy Active ───
  if (cutout.preCompensated && strainFactor > 0) {
    const preCompMajorMm = Number((nominalD / (1 + strainFactor)).toFixed(2));
    return {
      cutoutId: cutout.id,
      cutoutType: cutout.type,
      flangeIndex: cutout.flangeIndex,
      flatCoordX: Number(flatX.toFixed(2)),
      flatCoordY: Number(flatY.toFixed(2)),
      distanceToNearestBendMm: Number(minAxisDistance.toFixed(2)),
      nearestBendIndex,
      nearestBendLineX: Number(nearestBendLineX.toFixed(2)),
      safeDistanceMm: Number(safeDistanceMm.toFixed(2)),
      strainFactor: Number(strainFactor.toFixed(3)),
      elongationPercent,
      deformedMajorMm: nominalD, // After bending elongation, it stretches to true nominalD!
      deformedMinorMm: nominalD,
      riskLevel: 'SAFE',
      activeRemedy: 'pre_compensated',
      recommendedSafePosUMm,
      dfmAdviceTr: `✅ TERS KOMPANZASYON: Açınımda ${preCompMajorMm}mm basık kesilip bükümde sünerek tam Ø${nominalD}mm dairesel deliğe dönüşür.`,
      dfmAdviceEn: `✅ PRE-COMPENSATED: Inversely pre-flattened to ${preCompMajorMm}mm on flat blank; stretches to true Ø${nominalD}mm after bending.`,
    };
  }

  let riskLevel: 'SAFE' | 'MODERATE_DISTORTION' | 'SEVERE_TEARING' = 'SAFE';
  let dfmAdviceTr = 'Güvenli Bölge: Delik büküm deformasyon alanının dışında, daireselliğini korur.';
  let dfmAdviceEn = 'Safe Zone: Cutout is outside the plastic bend strain zone; circularity preserved.';

  if (strainFactor >= 0.14 || minAxisDistance < baHalf) {
    riskLevel = 'SEVERE_TEARING';
    dfmAdviceTr = `ŞİDDETLİ SÜNME & YIRTILMA RİSKİ: Delik büküm çizgisine çok yakın (${minAxisDistance.toFixed(1)}mm < Min ${safeDistanceMm.toFixed(1)}mm). %${elongationPercent} eliptik sünme oluşur, cıvata geçmez ve sac kenarı yırtılabilir! Aşağıdaki önerilerden birini uygulayın: Rahatlatma Yarığı Açın, Güvenli Alana Taşıyın veya Ters Kompanzasyon uygulayın.`;
    dfmAdviceEn = `SEVERE DISTORTION & TEAR RISK: Hole is too close to bend axis (${minAxisDistance.toFixed(1)}mm < Min ${safeDistanceMm.toFixed(1)}mm). Hole will ovalize by ~${elongationPercent}%. Apply a relief slit, offset to safe zone, or use pre-compensation.`;
  } else if (strainFactor >= 0.04) {
    riskLevel = 'MODERATE_DISTORTION';
    dfmAdviceTr = `HAFİF SÜNME UYARISI: Delik büküm gerilme sınırında. ~%${elongationPercent} oranında elipsleşme meydana gelir (Çap: ${deformedMajorMm} x ${deformedMinorMm} mm). Kritik montaj deliği ise bükümden en az ${safeDistanceMm.toFixed(1)}mm uzağa taşıyın veya rahatlatma yarığı ekleyin.`;
    dfmAdviceEn = `MODERATE DISTORTION: Hole will distort into an ellipse (~${elongationPercent}% elongation). Shift at least ${safeDistanceMm.toFixed(1)}mm away from bend axis or add a laser relief slit.`;
  }

  return {
    cutoutId: cutout.id,
    cutoutType: cutout.type,
    flangeIndex: cutout.flangeIndex,
    flatCoordX: Number(flatX.toFixed(2)),
    flatCoordY: Number(flatY.toFixed(2)),
    distanceToNearestBendMm: Number(minAxisDistance.toFixed(2)),
    nearestBendIndex,
    nearestBendLineX: Number(nearestBendLineX.toFixed(2)),
    safeDistanceMm: Number(safeDistanceMm.toFixed(2)),
    strainFactor: Number(strainFactor.toFixed(3)),
    elongationPercent,
    deformedMajorMm,
    deformedMinorMm,
    riskLevel,
    dfmAdviceTr,
    dfmAdviceEn,
    recommendedSafePosUMm,
    activeRemedy: null,
  };
}

/**
 * Runs deformation analysis on all cutouts in the spec.
 */
export function analyzeAllCutoutsDeformation(spec: SheetMetalSpec): HoleDeformationResult[] {
  if (!spec.cutouts || spec.cutouts.length === 0) return [];
  return spec.cutouts.map((c) => analyzeHoleDeformation(spec, c));
}

/* ─── PROACTIVE DFM SÜNME REMEDY APPLIERS ─────────────────────────────────── */

/**
 * 💡 Remedy 1: Laser Relief Slit (Lazer Rahatlatma Yarığı)
 * Cuts a narrow 1.0mm micro-slit between the hole and bend tangent to absorb strain.
 */
export function applyReliefSlitRemedy(spec: SheetMetalSpec, cutoutId: string): SheetMetalSpec {
  const nextCutouts = (spec.cutouts || []).map((c) => {
    if (c.id !== cutoutId) return c;
    const dia = c.diameter || c.width || 8.5;
    return {
      ...c,
      reliefSlit: {
        enabled: true,
        slitWidthMm: 1.0,
        slitLengthMm: Number((dia + 4.0).toFixed(1)),
        distanceFromHoleMm: 1.5,
      },
    };
  });
  return { ...spec, cutouts: nextCutouts };
}

/**
 * 💡 Remedy 2: Offset to Safe Zone (Güvenli Alana Ötele)
 * Shifts cutout posU to safe distance >= R + 2*t + diameter/2.
 */
export function offsetCutoutSafeRemedy(spec: SheetMetalSpec, cutoutId: string): SheetMetalSpec {
  const analysis = calculateSheetMetalAnalysis(spec);
  const nextCutouts = (spec.cutouts || []).map((c) => {
    if (c.id !== cutoutId) return c;
    const dia = c.diameter || c.width || 8.5;
    const t = Math.max(0.4, spec.thickness || 2);
    const r = spec.bends[0]?.radius || 2;
    const safeDist = r + 2.0 * t + dia / 2 + 1.5;

    const availFlange =
      c.flangeIndex === 0
        ? analysis.firstStraightFlangeMm
        : analysis.rows[c.flangeIndex - 1]?.straightFlangeMm || 40;

    let targetU: number;
    if (c.flangeIndex === 0) {
      targetU = Math.max(dia / 2 + 2, availFlange - safeDist);
    } else {
      targetU = Math.min(availFlange - dia / 2 - 2, safeDist);
    }

    return {
      ...c,
      posU: Number(targetU.toFixed(1)),
    };
  });
  return { ...spec, cutouts: nextCutouts };
}

/**
 * 💡 Remedy 3: Pre-Compensated Oval (Ters Kompanzasyon)
 * Inverts the oval on the flat pattern so it bends into a true circular hole.
 */
export function togglePreCompensationRemedy(spec: SheetMetalSpec, cutoutId: string): SheetMetalSpec {
  const nextCutouts = (spec.cutouts || []).map((c) => {
    if (c.id !== cutoutId) return c;
    return {
      ...c,
      preCompensated: !c.preCompensated,
    };
  });
  return { ...spec, cutouts: nextCutouts };
}

/**
 * 💡 Remedy 4: Post-Bend Secondary Operation (Büküm Sonrası Delme)
 * Flags cutout to be drilled/punched after press brake bending.
 */
export function togglePostBendRemedy(spec: SheetMetalSpec, cutoutId: string): SheetMetalSpec {
  const nextCutouts = (spec.cutouts || []).map((c) => {
    if (c.id !== cutoutId) return c;
    return {
      ...c,
      postBendOperation: !c.postBendOperation,
    };
  });
  return { ...spec, cutouts: nextCutouts };
}

/* ─── PRESS BRAKE FEASIBILITY & OPTIMAL BEND SEQUENCE ENGINE ────────────── */

export interface PressBrakeStep {
  stepNumber: number;
  bendIndex: number;
  bendId: string;
  angleDeg: number;
  direction: 'up' | 'down';
  radiusMm: number;
  backgaugeStopMm: number;
  dieOpeningV: number;
  tonnage: number;
  collisionWarning?: string;
}

export interface PressBrakeCollision {
  type: 'min_flange' | 'gooseneck_punch' | 'tonnage_exceeded' | 'mould_required';
  bendIndex: number;
  severity: 'warning' | 'error';
  messageTr: string;
  messageEn: string;
}

export interface PressBrakeFeasibility {
  isFeasible: boolean;
  recommendedDieV: number;
  minFlangeRequiredMm: number;
  optimalSequence: number[]; // 1-based bend indices in optimal order
  steps: PressBrakeStep[];
  collisions: PressBrakeCollision[];
  toolingRecommendationTr: string;
  toolingRecommendationEn: string;
}

/**
 * Analyzes press-brake bending feasibility, detects physical tool collisions,
 * and calculates the mathematically optimal bend sequence (dıştan içe büküm kuralı).
 */
export function calculatePressBrakeFeasibility(spec: SheetMetalSpec): PressBrakeFeasibility {
  const analysis = calculateSheetMetalAnalysis(spec);
  const t = Math.max(0.4, spec.thickness || 2);
  const dieV = Math.max(6, Math.round(t * 8));
  const minFlangeRequiredMm = Number((0.7 * dieV).toFixed(1));
  const collisions: PressBrakeCollision[] = [];

  // Check 1: Minimum Flange Length against V-Die opening
  // First flange check:
  if (spec.firstFlange < minFlangeRequiredMm) {
    collisions.push({
      type: 'min_flange',
      bendIndex: 1,
      severity: 'error',
      messageTr: `BÜKÜLEMEZ: İlk Flanş F0 (${spec.firstFlange}mm), V${dieV} kalıp için çok kısa (Min ${minFlangeRequiredMm}mm)! Sac bükümde kalıbın içine kayacaktır.`,
      messageEn: `UNBENDABLE: First Flange F0 (${spec.firstFlange}mm) is shorter than V${dieV} die minimum (${minFlangeRequiredMm}mm)! Sheet will slip into die.`,
    });
  }

  // Intermediate flanges check:
  spec.bends.forEach((b, idx) => {
    if (b.flange < minFlangeRequiredMm) {
      collisions.push({
        type: 'min_flange',
        bendIndex: idx + 1,
        severity: 'error',
        messageTr: `BÜKÜLEMEZ: Flanş #${idx + 1} (${b.flange}mm), V${dieV} kalıp için çok kısa (Min ${minFlangeRequiredMm}mm)!`,
        messageEn: `UNBENDABLE: Flange #${idx + 1} (${b.flange}mm) is shorter than V${dieV} die minimum (${minFlangeRequiredMm}mm)!`,
      });
    }

    // Check 4: Radius / Curved Edge Bend (Deep Drawing Mould Requirement)
    if (b.edge === 'radius_curved' || b.edgeType === 'radius_curved') {
      collisions.push({
        type: 'mould_required',
        bendIndex: idx + 1,
        severity: 'warning',
        messageTr: `⚠️ Büküm #${idx + 1}: Kavisli / Radius Kenar Bükümü — Standart abkant pres yerine Derin Çekme Pres Kalıbı (Stamping Die) gerektirir. Kalıpla kase açınımı uygulanır.`,
        messageEn: `⚠️ Bend #${idx + 1}: Curved / Radius Edge Bend — Requires Deep Drawing Stamping Die instead of standard press brake. Deep-drawn blank development applied.`,
      });
    }
  });

  // Check 2: Gooseneck / Punch Throat Clearance for C-Box / Enclosure channels
  // When multiple 90° bends create an inward lip or channel deeper than 45mm
  if (spec.bends.length >= 3) {
    const hasOpposingUpBends = spec.bends.filter((b) => b.direction === 'up').length >= 3;
    const maxFlangeHeight = Math.max(...spec.bends.map((b) => b.flange));
    if (hasOpposingUpBends && maxFlangeHeight > 45) {
      collisions.push({
        type: 'gooseneck_punch',
        bendIndex: spec.bends.length,
        severity: 'warning',
        messageTr: `ABKANT ÇARPIŞMA RİSKİ: İçe kıvrımlı kutu profili (${maxFlangeHeight}mm yükseklik) standart düz üst bıçağa çarpar. Kuğu Boyunlu (Gooseneck) bıçak kullanılmalıdır!`,
        messageEn: `PRESS BRAKE COLLISION RISK: Deep box channel (${maxFlangeHeight}mm) collides with straight punch body. Gooseneck punch tooling required!`,
      });
    }
  }

  // Check 3: Optimal Bending Sequence
  // Industrial heuristic: bend outer edges first (B1 & BN), then step inwards
  const n = spec.bends.length;
  const optimalSequence: number[] = [];
  const remaining = Array.from({ length: n }, (_, i) => i + 1);

  if (n <= 2) {
    optimalSequence.push(...remaining);
  } else {
    // Alternate from ends towards center: 1, n, 2, n-1, ...
    let left = 0;
    let right = n - 1;
    let takeLeft = true;
    while (left <= right) {
      if (takeLeft) {
        optimalSequence.push(remaining[left]);
        left++;
      } else {
        optimalSequence.push(remaining[right]);
        right--;
      }
      takeLeft = !takeLeft;
    }
  }

  const steps: PressBrakeStep[] = optimalSequence.map((bendIdx, stepIdx) => {
    const row = analysis.rows[bendIdx - 1];
    return {
      stepNumber: stepIdx + 1,
      bendIndex: bendIdx,
      bendId: row ? row.id : `b${bendIdx}`,
      angleDeg: row ? row.angle : 90,
      direction: row ? row.direction : 'up',
      radiusMm: row ? row.radius : 2,
      backgaugeStopMm: row ? Number(row.bendLineMm.toFixed(2)) : 50,
      dieOpeningV: dieV,
      tonnage: row ? Number(row.tonnage.toFixed(2)) : 2.5,
      collisionWarning: collisions.find((c) => c.bendIndex === bendIdx)?.messageTr,
    };
  });

  const hasFatalCollision = collisions.some((c) => c.severity === 'error');

  return {
    isFeasible: !hasFatalCollision,
    recommendedDieV: dieV,
    minFlangeRequiredMm,
    optimalSequence,
    steps,
    collisions,
    toolingRecommendationTr: `Tavsiye Edilen Abkant Takımı: V${dieV} Alt Kalıp (Min Flanş: ${minFlangeRequiredMm}mm), 88° R1.5 Üst Bıçak${
      collisions.some((c) => c.type === 'gooseneck_punch') ? ' + Kuğu Boyunlu (Gooseneck) Adaptör' : ''
    }.`,
    toolingRecommendationEn: `Recommended Tooling: V${dieV} Bottom Die (Min Flange: ${minFlangeRequiredMm}mm), 88° R1.5 Top Punch${
      collisions.some((c) => c.type === 'gooseneck_punch') ? ' + Gooseneck Tool Holder' : ''
    }.`,
  };
}

export interface SheetMetalContourSegment {
  type: 'flange' | 'bend';
  flangeIndex: number;
  bendIndex?: number;
  closedPolygon: Point2D[];
  startPoint: Point2D;
  endPoint: Point2D;
  dirRad: number;
}

export interface SheetMetalContour2D {
  midlinePoints: Point2D[];
  outerPoints: Point2D[];
  innerPoints: Point2D[];
  closedPolygon: Point2D[];
  segments: SheetMetalContourSegment[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
}

/**
 * Generates the 2D thick cross-section contour of a sheet metal part for any
 * unfold state `unfoldProgress01` in [0, 1].
 */
export function computeSheetMetalContour2D(
  spec: SheetMetalSpec,
  unfoldProgress01 = 0,
  arcSubdivisions = 14
): SheetMetalContour2D {
  const t = Math.max(0.4, spec.thickness || 2);
  const halfT = t / 2;
  const analysis = calculateSheetMetalAnalysis(spec);
  const foldFactor = Math.max(0, Math.min(1, 1 - unfoldProgress01));

  const midlinePoints: Point2D[] = [];
  const outerPoints: Point2D[] = [];
  const innerPoints: Point2D[] = [];
  const segments: SheetMetalContourSegment[] = [];

  let curX = 0;
  let curY = 0;
  let curDirRad = 0; // +X direction

  const pushSample = (x: number, y: number, dirRad: number) => {
    const nx = -Math.sin(dirRad);
    const ny = Math.cos(dirRad);
    midlinePoints.push({ x, y });
    outerPoints.push({ x: x + nx * halfT, y: y + ny * halfT });
    innerPoints.push({ x: x - nx * halfT, y: y - ny * halfT });
  };

  pushSample(curX, curY, curDirRad);

  const len0 = analysis.firstStraightFlangeMm;
  const f0StartIdx = 0;
  curX += len0 * Math.cos(curDirRad);
  curY += len0 * Math.sin(curDirRad);
  pushSample(curX, curY, curDirRad);
  const f0EndIdx = 1;

  segments.push({
    type: 'flange',
    flangeIndex: 0,
    closedPolygon: [
      outerPoints[f0StartIdx],
      outerPoints[f0EndIdx],
      innerPoints[f0EndIdx],
      innerPoints[f0StartIdx],
    ],
    startPoint: midlinePoints[f0StartIdx],
    endPoint: midlinePoints[f0EndIdx],
    dirRad: curDirRad,
  });

  analysis.rows.forEach((row) => {
    const bendStartIdx = outerPoints.length - 1;
    const fullDeflectionRad = (Math.max(0.5, Math.min(179, row.angle)) * Math.PI) / 180;
    const effectiveDeflectionRad = fullDeflectionRad * foldFactor;
    const sweepSign = row.direction === 'up' ? 1 : -1;

    if (effectiveDeflectionRad < 1e-4) {
      curX += row.ba * Math.cos(curDirRad);
      curY += row.ba * Math.sin(curDirRad);
      pushSample(curX, curY, curDirRad);
    } else {
      const rMid = Math.max(halfT + 0.05, row.ba / effectiveDeflectionRad + (0.5 - row.kFactor) * t * foldFactor);
      const nx = -sweepSign * Math.sin(curDirRad);
      const ny = sweepSign * Math.cos(curDirRad);
      const cx = curX + rMid * nx;
      const cy = curY + rMid * ny;
      const startArcAngle = Math.atan2(curY - cy, curX - cx);

      const steps = Math.max(4, arcSubdivisions);
      for (let s = 1; s <= steps; s++) {
        const frac = s / steps;
        const theta = startArcAngle + sweepSign * effectiveDeflectionRad * frac;
        const tangentRad = curDirRad + sweepSign * effectiveDeflectionRad * frac;
        const px = cx + rMid * Math.cos(theta);
        const py = cy + rMid * Math.sin(theta);
        pushSample(px, py, tangentRad);
      }

      curDirRad += sweepSign * effectiveDeflectionRad;
      const endArcAngle = startArcAngle + sweepSign * effectiveDeflectionRad;
      curX = cx + rMid * Math.cos(endArcAngle);
      curY = cy + rMid * Math.sin(endArcAngle);
    }
    const bendEndIdx = outerPoints.length - 1;

    const bendOuterSlice = outerPoints.slice(bendStartIdx, bendEndIdx + 1);
    const bendInnerSlice = innerPoints.slice(bendStartIdx, bendEndIdx + 1);
    segments.push({
      type: 'bend',
      flangeIndex: row.index,
      bendIndex: row.index,
      closedPolygon: [...bendOuterSlice, ...[...bendInnerSlice].reverse()],
      startPoint: midlinePoints[bendStartIdx],
      endPoint: midlinePoints[bendEndIdx],
      dirRad: curDirRad,
    });

    const flgStartIdx = outerPoints.length - 1;
    curX += row.straightFlangeMm * Math.cos(curDirRad);
    curY += row.straightFlangeMm * Math.sin(curDirRad);
    pushSample(curX, curY, curDirRad);
    const flgEndIdx = outerPoints.length - 1;

    segments.push({
      type: 'flange',
      flangeIndex: row.index,
      closedPolygon: [
        outerPoints[flgStartIdx],
        outerPoints[flgEndIdx],
        innerPoints[flgEndIdx],
        innerPoints[flgStartIdx],
      ],
      startPoint: midlinePoints[flgStartIdx],
      endPoint: midlinePoints[flgEndIdx],
      dirRad: curDirRad,
    });
  });

  const closedPolygon: Point2D[] = [
    ...outerPoints,
    ...[...innerPoints].reverse(),
  ];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const pt of closedPolygon) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }

  return {
    midlinePoints,
    outerPoints,
    innerPoints,
    closedPolygon,
    segments,
    bounds: {
      minX,
      maxX,
      minY,
      maxY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    },
  };
}

/**
 * Builds a composite 3D BufferGeometry supporting partial flanges (y, z, x in Image 2)
 * and transverse side-edge flanges (arrow in Image 1).
 */
export function buildCompositeSheetMetal3DGeometry(
  spec: SheetMetalSpec,
  unfoldProgress01 = 0
): THREE.BufferGeometry {
  const t = Math.max(0.4, spec.thickness || 2);
  const L = Math.max(1, spec.length || 120);
  const contour = computeSheetMetalContour2D(spec, unfoldProgress01, 16);
  const cx = (contour.bounds.minX + contour.bounds.maxX) / 2;
  const cy = (contour.bounds.minY + contour.bounds.maxY) / 2;

  const pieces: THREE.BufferGeometry[] = [];

  const extrudePolygon = (polygon: Point2D[], depth: number, zOffset: number) => {
    const shape = new THREE.Shape();
    polygon.forEach((pt, idx) => {
      const sx = pt.x - cx;
      const sy = pt.y - cy;
      if (idx === 0) shape.moveTo(sx, sy);
      else shape.lineTo(sx, sy);
    });
    shape.closePath();

    const g = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 16,
      steps: 1,
    });
    g.translate(0, 0, zOffset);
    return g;
  };

  // 1. Process Main Chain Segments (Flange 0, and sequential Bends/Flanges)
  for (const seg of contour.segments) {
    if (seg.type === 'flange' && seg.flangeIndex === 0) {
      // Base Flange F0 spans full width L
      pieces.push(extrudePolygon(seg.closedPolygon, L, -L / 2));
      continue;
    }

    const bendIdx = seg.bendIndex ?? seg.flangeIndex;
    const bendRow = spec.bends[bendIdx - 1];

    // If this bend is configured on a transverse side edge ('side_a' or 'side_b'),
    // it is built separately as a side flange attached to its target flange.
    if (bendRow && (bendRow.edge === 'side_a' || bendRow.edge === 'side_b')) {
      continue;
    }

    if (bendRow && bendRow.widthMode === 'partial') {
      // Partial Flange as in Image 2: y = offsetStart, z = flangeWidth, x = offsetEnd
      const y = Math.max(0, bendRow.offsetStart ?? 25);
      const z = Math.max(1, Math.min(L - y, bendRow.flangeWidth ?? (L - 50)));
      // The bent section extends between Z = -L/2 + y and Z = -L/2 + y + z
      pieces.push(extrudePolygon(seg.closedPolygon, z, -L / 2 + y));
    } else {
      // Full-width bend/flange across full L
      pieces.push(extrudePolygon(seg.closedPolygon, L, -L / 2));
    }
  }

  // 2. Process Transverse Side-Edge Bends (1. Resimdeki Beyaz Ok: 'side_a' at Z = -L/2 or 'side_b' at Z = +L/2)
  spec.bends.forEach((b, bIdx) => {
    if (b.edge !== 'side_a' && b.edge !== 'side_b') return;

    const targetFlangeIdx = b.targetFlangeIndex ?? 0;
    const targetSeg = contour.segments.find(
      (s) => s.type === 'flange' && s.flangeIndex === targetFlangeIdx
    );
    if (!targetSeg) return;

    const p1 = targetSeg.startPoint;
    const p2 = targetSeg.endPoint;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const flangeLen = Math.hypot(dx, dy) || 1;
    const dirRad = targetSeg.dirRad;

    // Available edge length along this side edge equals the flange length
    const availEdgeLen = flangeLen;
    const isPartial = b.widthMode === 'partial';
    const y = isPartial ? Math.max(0, b.offsetStart ?? 0) : 0;
    const z = isPartial ? Math.max(1, Math.min(availEdgeLen - y, b.flangeWidth ?? (availEdgeLen - 20))) : availEdgeLen;

    const foldFactor = Math.max(0, Math.min(1, 1 - unfoldProgress01));
    const bendAngleRad = ((Math.max(1, Math.min(179, b.angle)) * Math.PI) / 180) * foldFactor;
    const isSideA = b.edge === 'side_a';
    const sideZ = isSideA ? -L / 2 : L / 2;

    // Extrude a side flange box along the side edge
    const flangeH = Math.max(2, b.flange);
    const sideBox = new THREE.BoxGeometry(z, flangeH, t);

    // Position box relative to target flange center
    const midFrac = (y + z / 2) / flangeLen;
    const posX = p1.x + dx * midFrac - cx;
    const posY = p1.y + dy * midFrac - cy;
    const posZ = isSideA ? sideZ - (t / 2) : sideZ + (t / 2);

    sideBox.translate(posX, posY, posZ);
    // Rotate by flange inclination and bend angle
    sideBox.rotateZ(dirRad);
    if (isSideA) {
      sideBox.rotateX(-bendAngleRad);
    } else {
      sideBox.rotateX(bendAngleRad);
    }

    pieces.push(sideBox);
  });

  // 3. Process Curved / Radius Edge Bends (Kalıpla Kase / Derin Çekme Bükümü)
  spec.bends.forEach((b) => {
    if (b.edge !== 'radius_curved' && b.edgeType !== 'radius_curved') return;

    const targetFlangeIdx = b.targetFlangeIndex ?? 0;
    const targetSeg = contour.segments.find(
      (s) => s.type === 'flange' && s.flangeIndex === targetFlangeIdx
    );
    if (!targetSeg) return;

    const p2 = targetSeg.endPoint;
    const dirRad = targetSeg.dirRad;
    const foldFactor = Math.max(0, Math.min(1, 1 - unfoldProgress01));
    const bendAngleRad = ((Math.max(1, Math.min(179, b.angle)) * Math.PI) / 180) * foldFactor;
    const flangeH = Math.max(4, b.flange);
    const curvedR = b.curvedRadiusMm || Math.max(15, L / 4);

    // Flared curved dish / bowl flange
    const curvedFlange = new THREE.CylinderGeometry(
      curvedR + flangeH * Math.sin(bendAngleRad),
      curvedR,
      Math.max(t, flangeH * Math.cos(bendAngleRad)),
      32,
      1,
      true
    );
    curvedFlange.translate(p2.x - cx, p2.y - cy + (flangeH / 2) * Math.cos(bendAngleRad), 0);
    curvedFlange.rotateZ(dirRad);
    pieces.push(curvedFlange);
  });

  if (pieces.length === 0) {
    return new THREE.BoxGeometry(spec.firstFlange, t, L);
  }

  const nonIndexedPieces = pieces.map((p) => (p.index ? p.toNonIndexed() : p));
  const merged = nonIndexedPieces.length === 1 ? nonIndexedPieces[0] : BufferGeometryUtils.mergeGeometries(nonIndexedPieces);
  const finalGeom = BufferGeometryUtils.mergeVertices(merged, 1e-3);
  finalGeom.computeVertexNormals();
  finalGeom.computeBoundingBox();
  finalGeom.computeBoundingSphere();
  return finalGeom;
}

/**
 * Performs authentic 3D boolean void CSG subtraction on the sheet metal geometry
 * so holes, pockets, tabs, slots, and laser relief slits are TRUE hollow cutouts!
 */
export function applySheetMetalCutoutsCSG(
  baseGeom: THREE.BufferGeometry,
  spec: SheetMetalSpec,
  unfoldProgress01 = 0
): THREE.BufferGeometry {
  if (!spec.cutouts || spec.cutouts.length === 0) {
    return baseGeom;
  }

  const t = Math.max(0.4, spec.thickness || 2);
  const L = Math.max(1, spec.length || 120);
  const contour = computeSheetMetalContour2D(spec, unfoldProgress01, 16);
  const cx = (contour.bounds.minX + contour.bounds.maxX) / 2;
  const cy = (contour.bounds.minY + contour.bounds.maxY) / 2;
  const deformations = analyzeAllCutoutsDeformation(spec);

  try {
    const evaluator = new Evaluator();
    evaluator.useGroups = false;
    let currentBrush = new Brush(baseGeom);
    currentBrush.updateMatrixWorld();

    spec.cutouts.forEach((cutout, idx) => {
      const def = deformations[idx];
      const targetFlangeIdx = cutout.flangeIndex ?? 0;
      const targetSeg = contour.segments.find(
        (s) => s.type === 'flange' && s.flangeIndex === targetFlangeIdx
      );
      if (!targetSeg) return;

      const p1 = targetSeg.startPoint;
      const p2 = targetSeg.endPoint;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const flangeLen = Math.hypot(dx, dy) || 1;
      const dirRad = targetSeg.dirRad;

      const u = Math.max(0, Math.min(flangeLen, cutout.posU));
      const v = Math.max(0, Math.min(L, cutout.posV));

      const midX = p1.x + Math.cos(dirRad) * u - cx;
      const midY = p1.y + Math.sin(dirRad) * u - cy;
      const midZ = v - L / 2;
      const cutterDepth = t * 4;

      let cutterGeom: THREE.BufferGeometry | null = null;
      const dia = cutout.diameter || 8.5;
      const isDeformed =
        def &&
        def.riskLevel !== 'SAFE' &&
        !cutout.reliefSlit?.enabled &&
        !cutout.postBendOperation &&
        !cutout.preCompensated;
      const majorD = isDeformed ? def.deformedMajorMm : dia;
      const minorD = isDeformed ? def.deformedMinorMm : dia;

      if (cutout.type === 'round_hole') {
        if (isDeformed) {
          // Ovalized distorted hole in bend direction
          const ellipseShape = new THREE.Shape();
          ellipseShape.absellipse(0, 0, majorD / 2, minorD / 2, 0, Math.PI * 2, false);
          cutterGeom = new THREE.ExtrudeGeometry(ellipseShape, { depth: cutterDepth, bevelEnabled: false });
          cutterGeom.center();
          cutterGeom.rotateX(Math.PI / 2);
        } else {
          cutterGeom = new THREE.CylinderGeometry(dia / 2, dia / 2, cutterDepth, 24);
        }
      } else if (cutout.type === 'slot') {
        const sw = cutout.width || 10;
        const sl = cutout.length || 25;
        const r = sw / 2;
        const bodyL = Math.max(0.1, sl - sw);
        const slotShape = new THREE.Shape();
        slotShape.moveTo(-bodyL / 2, -r);
        slotShape.lineTo(bodyL / 2, -r);
        slotShape.absarc(bodyL / 2, 0, r, -Math.PI / 2, Math.PI / 2, false);
        slotShape.lineTo(-bodyL / 2, r);
        slotShape.absarc(-bodyL / 2, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);
        slotShape.closePath();
        cutterGeom = new THREE.ExtrudeGeometry(slotShape, { depth: cutterDepth, bevelEnabled: false });
        cutterGeom.center();
        cutterGeom.rotateX(Math.PI / 2);
      } else if (cutout.type === 'rect_cutout' || cutout.type === 'pocket') {
        const rw = cutout.width || 20;
        const rl = cutout.length || 35;
        const cr = cutout.cornerRadius || (cutout.type === 'pocket' ? 3 : 0);
        if (cr > 0.5) {
          const rectShape = new THREE.Shape();
          const hw = rw / 2;
          const hl = rl / 2;
          const rad = Math.min(cr, hw - 0.5, hl - 0.5);
          rectShape.moveTo(-hl + rad, -hw);
          rectShape.lineTo(hl - rad, -hw);
          rectShape.quadraticCurveTo(hl, -hw, hl, -hw + rad);
          rectShape.lineTo(hl, hw - rad);
          rectShape.quadraticCurveTo(hl, hw, hl - rad, hw);
          rectShape.lineTo(-hl + rad, hw);
          rectShape.quadraticCurveTo(-hl, hw, -hl, hw - rad);
          rectShape.lineTo(-hl, -hw + rad);
          rectShape.quadraticCurveTo(-hl, -hw, -hl + rad, -hw);
          rectShape.closePath();
          cutterGeom = new THREE.ExtrudeGeometry(rectShape, { depth: cutterDepth, bevelEnabled: false });
          cutterGeom.center();
          cutterGeom.rotateX(Math.PI / 2);
        } else {
          cutterGeom = new THREE.BoxGeometry(rl, cutterDepth, rw);
        }
      } else if (cutout.type === 'tab') {
        const tw = cutout.width || 15;
        const tl = cutout.length || 20;
        cutterGeom = new THREE.BoxGeometry(tl, cutterDepth, tw);
      } else if (cutout.type === 'corner_notch') {
        const nw = cutout.width || 15;
        const nl = cutout.length || 15;
        cutterGeom = new THREE.BoxGeometry(nl, cutterDepth, nw);
      } else if (cutout.type === 'louver') {
        const lw = cutout.width || 6;
        const ll = cutout.length || 35;
        cutterGeom = new THREE.BoxGeometry(ll, cutterDepth, lw);
      } else if (cutout.type === 'nema_mount') {
        // NEMA Motor Mount Pattern: Central Bore + 4 bolt mounting holes
        const centerR = (cutout.diameter || 22) / 2;
        const boltDist = (cutout.width || 31) / 2;
        const boltR = 2.0; // 4mm bolt holes
        const mountShape = new THREE.Shape();
        mountShape.absarc(0, 0, centerR, 0, Math.PI * 2, false);
        const bGeom = new THREE.CylinderGeometry(centerR, centerR, cutterDepth, 24);
        const boltHoles: THREE.BufferGeometry[] = [bGeom];
        [
          [-boltDist, -boltDist],
          [boltDist, -boltDist],
          [boltDist, boltDist],
          [-boltDist, boltDist],
        ].forEach(([bx, bz]) => {
          const bg = new THREE.CylinderGeometry(boltR, boltR, cutterDepth, 16);
          bg.translate(bx, 0, bz);
          boltHoles.push(bg);
        });
        cutterGeom = BufferGeometryUtils.mergeGeometries(boltHoles);
      } else if (cutout.type === 'din_keyway') {
        // DIN 6885 shaft keyway slot
        const boreR = (cutout.diameter || 18) / 2;
        const kwW = cutout.width || 6;
        const kwH = cutout.length || 3;
        const boreGeom = new THREE.CylinderGeometry(boreR, boreR, cutterDepth, 24);
        const keyBox = new THREE.BoxGeometry(kwW, cutterDepth, kwH);
        keyBox.translate(0, 0, boreR + kwH / 2 - 0.5);
        cutterGeom = BufferGeometryUtils.mergeGeometries([boreGeom, keyBox]);
      } else if (cutout.type === 'custom_path' && cutout.profile && cutout.profile.length >= 3) {
        const customShape = new THREE.Shape();
        cutout.profile.forEach((pt, pIdx) => {
          if (pIdx === 0) customShape.moveTo(pt.x, pt.y);
          else customShape.lineTo(pt.x, pt.y);
        });
        customShape.closePath();
        cutterGeom = new THREE.ExtrudeGeometry(customShape, { depth: cutterDepth, bevelEnabled: false });
        cutterGeom.center();
        cutterGeom.rotateX(Math.PI / 2);
      }

      if (cutterGeom) {
        const cutterBrush = new Brush(cutterGeom);
        cutterBrush.position.set(midX, midY, midZ);
        cutterBrush.rotation.z = dirRad;
        if (cutout.rotationDeg) {
          cutterBrush.rotation.y = (cutout.rotationDeg * Math.PI) / 180;
        }
        cutterBrush.updateMatrixWorld();
        currentBrush = evaluator.evaluate(currentBrush, cutterBrush, SUBTRACTION);
      }

      // If Laser Relief Slit is enabled, cut the narrow laser slit to absorb plastic strain
      if (cutout.reliefSlit?.enabled) {
        const slitW = cutout.reliefSlit.slitWidthMm || 1.0;
        const slitL = cutout.reliefSlit.slitLengthMm || (dia + 4.0);
        const slitDist = cutout.reliefSlit.distanceFromHoleMm || 1.5;

        // Position slit between hole and bend tangent line
        const slitU = Math.max(0, u - (dia / 2 + slitDist + slitW / 2));
        const slitX = p1.x + Math.cos(dirRad) * slitU - cx;
        const slitY = p1.y + Math.sin(dirRad) * slitU - cy;

        const slitGeom = new THREE.BoxGeometry(slitW, cutterDepth, slitL);
        const slitBrush = new Brush(slitGeom);
        slitBrush.position.set(slitX, slitY, midZ);
        slitBrush.rotation.z = dirRad;
        slitBrush.updateMatrixWorld();

        currentBrush = evaluator.evaluate(currentBrush, slitBrush, SUBTRACTION);
      }
    });

    const finalGeom = currentBrush.geometry;
    finalGeom.computeVertexNormals();
    finalGeom.computeBoundingBox();
    finalGeom.computeBoundingSphere();
    return finalGeom;
  } catch (err) {
    console.warn('[applySheetMetalCutoutsCSG fallback to solid]:', err);
    return baseGeom;
  }
}

/**
 * Builds a centered Three.js BufferGeometry of the folded or partially unfolded sheet metal part.
 * Automatically performs authentic 3D CSG boolean void punching for all holes and cutouts.
 */
export function buildSheetMetal3DGeometry(
  spec: SheetMetalSpec,
  unfoldProgress01 = 0
): THREE.BufferGeometry {
  const hasSpecialBends = spec.bends.some(
    (b) =>
      b.widthMode === 'partial' ||
      b.edge === 'side_a' ||
      b.edge === 'side_b' ||
      b.edge === 'radius_curved' ||
      b.edgeType === 'radius_curved'
  );

  let rawGeom: THREE.BufferGeometry;

  if (hasSpecialBends) {
    rawGeom = buildCompositeSheetMetal3DGeometry(spec, unfoldProgress01);
  } else {
    const contour = computeSheetMetalContour2D(spec, unfoldProgress01, 16);
    const cx = (contour.bounds.minX + contour.bounds.maxX) / 2;
    const cy = (contour.bounds.minY + contour.bounds.maxY) / 2;

    const shape = new THREE.Shape();
    contour.closedPolygon.forEach((pt, idx) => {
      const sx = pt.x - cx;
      const sy = pt.y - cy;
      if (idx === 0) shape.moveTo(sx, sy);
      else shape.lineTo(sx, sy);
    });
    shape.closePath();

    const depth = Math.max(1, spec.length || 120);
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 16,
      steps: 1,
    });

    geom.translate(0, 0, -depth / 2);
    geom.computeVertexNormals();
    geom.computeBoundingBox();
    geom.computeBoundingSphere();
    rawGeom = geom;
  }

  // Apply true through-void boolean cutouts (replaces fake solid black cylinders!)
  return applySheetMetalCutoutsCSG(rawGeom, spec, unfoldProgress01);
}

/* ─── DXF & SVG 2D CUTOUT PARSERS ────────────────────────────────────────── */

export function parseSvgCutout(
  content: string,
  fileName: string
): { name: string; profile: Array<{ x: number; y: number }>; width: number; length: number } | null {
  try {
    const points: Array<{ x: number; y: number }> = [];

    // 1. Polygon points attribute: <polygon points="x1,y1 x2,y2 ..." />
    const polyMatch = content.match(/<polygon[^>]*points=["']([^"']+)["']/i);
    if (polyMatch) {
      const rawPairs = polyMatch[1].trim().split(/[\s,]+/);
      for (let i = 0; i < rawPairs.length - 1; i += 2) {
        const x = parseFloat(rawPairs[i]);
        const y = parseFloat(rawPairs[i + 1]);
        if (!isNaN(x) && !isNaN(y)) points.push({ x, y });
      }
    }

    // 2. Path d attribute: <path d="M ... L ... Z" />
    if (points.length < 3) {
      const pathMatch = content.match(/<path[^>]*d=["']([^"']+)["']/i);
      if (pathMatch) {
        const d = pathMatch[1];
        const commands = d.match(/[a-df-z][^a-df-z]*/gi);
        if (commands) {
          let curX = 0;
          let curY = 0;
          commands.forEach((cmd) => {
            const type = cmd[0];
            const args = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat).filter((n) => !isNaN(n));
            if (type === 'M' || type === 'L') {
              for (let i = 0; i < args.length - 1; i += 2) {
                curX = args[i];
                curY = args[i + 1];
                points.push({ x: curX, y: curY });
              }
            } else if (type === 'm' || type === 'l') {
              for (let i = 0; i < args.length - 1; i += 2) {
                curX += args[i];
                curY += args[i + 1];
                points.push({ x: curX, y: curY });
              }
            } else if (type === 'H') {
              if (args[0] !== undefined) {
                curX = args[0];
                points.push({ x: curX, y: curY });
              }
            } else if (type === 'V') {
              if (args[0] !== undefined) {
                curY = args[0];
                points.push({ x: curX, y: curY });
              }
            }
          });
        }
      }
    }

    // 3. Rect fallback: <rect width="..." height="...">
    if (points.length < 3) {
      const rectMatch = content.match(/<rect[^>]*width=["']([^"']+)["'][^>]*height=["']([^"']+)["']/i);
      if (rectMatch) {
        const w = parseFloat(rectMatch[1]) || 20;
        const h = parseFloat(rectMatch[2]) || 20;
        points.push({ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h });
      }
    }

    if (points.length < 3) return null;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const w = Math.max(1, maxX - minX);
    const l = Math.max(1, maxY - minY);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const normalized = points.map((p) => ({
      x: Number((p.x - midX).toFixed(2)),
      y: Number((p.y - midY).toFixed(2)),
    }));

    return {
      name: fileName.replace(/\.[^/.]+$/, ''),
      profile: normalized,
      width: Number(w.toFixed(1)),
      length: Number(l.toFixed(1)),
    };
  } catch (err) {
    console.warn('[parseSvgCutout error]:', err);
    return null;
  }
}

export function parseDxfCutouts(
  content: string,
  fileName: string
): Array<{ name: string; profile: Array<{ x: number; y: number }>; width: number; length: number; isCircle?: boolean; diameter?: number }> {
  try {
    const result = parseDxfContent(content, fileName, { normalizeOrigin: true });
    if (!result || !result.parts || result.parts.length === 0) return [];

    const cutouts: Array<{ name: string; profile: Array<{ x: number; y: number }>; width: number; length: number; isCircle?: boolean; diameter?: number }> = [];
    const baseName = fileName.replace(/\.[^/.]+$/, '');

    // Process all parts in DXF
    result.parts.forEach((part, partIdx) => {
      // 1. If part has inner polygons (holes/cutouts inside a boundary), treat them as cutouts!
      if (part.innerPolygons && part.innerPolygons.length > 0) {
        part.innerPolygons.forEach((hole, hIdx) => {
          const pts = hole.points;
          if (pts.length < 3) return;

          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          pts.forEach((p) => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          });

          const w = Math.max(1, maxX - minX);
          const l = Math.max(1, maxY - minY);
          const midX = (minX + maxX) / 2;
          const midY = (minY + maxY) / 2;

          const normalized = pts.map((p) => ({
            x: Number((p.x - midX).toFixed(2)),
            y: Number((p.y - midY).toFixed(2)),
          }));

          const isCircle = Math.abs(w - l) < 1.0 && pts.length >= 16;
          cutouts.push({
            name: `${baseName}_delik_${hIdx + 1}`,
            profile: normalized,
            width: Number(w.toFixed(1)),
            length: Number(l.toFixed(1)),
            isCircle,
            diameter: isCircle ? Number(w.toFixed(1)) : undefined,
          });
        });
      }

      // 2. Also, if there are multiple parts or if no inner polygons, extract the outer contour
      if (!part.innerPolygons || part.innerPolygons.length === 0 || result.parts.length > 1) {
        const pts = part.polygon.points;
        if (pts.length >= 3) {
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          pts.forEach((p) => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          });

          const w = Math.max(1, maxX - minX);
          const l = Math.max(1, maxY - minY);
          const midX = (minX + maxX) / 2;
          const midY = (minY + maxY) / 2;

          const normalized = pts.map((p) => ({
            x: Number((p.x - midX).toFixed(2)),
            y: Number((p.y - midY).toFixed(2)),
          }));

          const isCircle = Math.abs(w - l) < 1.0 && pts.length >= 16;
          cutouts.push({
            name: `${baseName}${result.parts.length > 1 ? `_p${partIdx + 1}` : ''}`,
            profile: normalized,
            width: Number(w.toFixed(1)),
            length: Number(l.toFixed(1)),
            isCircle,
            diameter: isCircle ? Number(w.toFixed(1)) : undefined,
          });
        }
      }
    });

    return cutouts;
  } catch (err) {
    console.warn('[parseDxfCutouts error]:', err);
    return [];
  }
}

export function parseDxfCutout(
  content: string,
  fileName: string
): { name: string; profile: Array<{ x: number; y: number }>; width: number; length: number; isCircle?: boolean; diameter?: number } | null {
  const cutouts = parseDxfCutouts(content, fileName);
  return cutouts.length > 0 ? cutouts[0] : null;
}

export function parseDxfOrSvgCutouts(
  content: string,
  fileName: string
): Array<{ name: string; profile: Array<{ x: number; y: number }>; width: number; length: number; isCircle?: boolean; diameter?: number }> {
  const isSvg = fileName.toLowerCase().endsWith('.svg') || content.trim().startsWith('<svg');
  if (isSvg) {
    const single = parseSvgCutout(content, fileName);
    return single ? [single] : [];
  }
  return parseDxfCutouts(content, fileName);
}

export function parseDxfOrSvgCutoutContent(
  content: string,
  fileName: string
): { name: string; profile: Array<{ x: number; y: number }>; width: number; length: number } | null {
  const cutouts = parseDxfOrSvgCutouts(content, fileName);
  return cutouts.length > 0 ? cutouts[0] : null;
}

/**
 * Generates an AutoCAD R12 DXF Flat Pattern file with cut outline, bend axes,
 * bend allowance zones, press-brake bend callouts, and CUTOUTS with SÜNME / deformation dimensions.
 */
export function exportSheetMetalFlatPatternDXF(spec: SheetMetalSpec): string {
  const analysis = calculateSheetMetalAnalysis(spec);
  const deformations = analyzeAllCutoutsDeformation(spec);
  const W = Number(analysis.totalFlatLengthMm.toFixed(3));
  const H = Number(Math.max(1, spec.length).toFixed(3));

  const lines: string[] = [
    '0', 'SECTION',
    '2', 'HEADER',
    '9', '$INSUNITS', '70', '4', // Millimeters
    '0', 'ENDSEC',
    '0', 'SECTION',
    '2', 'ENTITIES',
  ];

  const addLine = (x1: number, y1: number, x2: number, y2: number, layer: string, color: number) => {
    lines.push(
      '0', 'LINE',
      '8', layer,
      '62', String(color),
      '10', x1.toFixed(4),
      '20', y1.toFixed(4),
      '30', '0.0',
      '11', x2.toFixed(4),
      '21', y2.toFixed(4),
      '31', '0.0'
    );
  };

  const addCircle = (cx: number, cy: number, r: number, layer: string, color: number) => {
    lines.push(
      '0', 'CIRCLE',
      '8', layer,
      '62', String(color),
      '10', cx.toFixed(4),
      '20', cy.toFixed(4),
      '30', '0.0',
      '40', r.toFixed(4)
    );
  };

  const addText = (x: number, y: number, height: number, text: string, layer: string, color: number) => {
    lines.push(
      '0', 'TEXT',
      '8', layer,
      '62', String(color),
      '10', x.toFixed(4),
      '20', y.toFixed(4),
      '30', '0.0',
      '40', height.toFixed(2),
      '1', text
    );
  };

  // 1. Outer Blank Cut Contour (Layer: 0_CUT_OUTLINE, Color 7 = White)
  addLine(0, 0, W, 0, '0_CUT_OUTLINE', 7);
  addLine(W, 0, W, H, '0_CUT_OUTLINE', 7);
  addLine(W, H, 0, H, '0_CUT_OUTLINE', 7);
  addLine(0, H, 0, 0, '0_CUT_OUTLINE', 7);

  // 2. Bend Centerlines & Tangent Lines
  analysis.rows.forEach((row) => {
    const xc = row.bendLineMm;
    const xStart = xc - row.ba / 2;
    const xEnd = xc + row.ba / 2;
    const isUp = row.direction === 'up';
    const bendLayer = isUp ? '1_BEND_UP' : '2_BEND_DOWN';
    const bendColor = isUp ? 3 : 2; // 3 = Green (UP), 2 = Yellow (DOWN)

    const isPartial = row.widthMode === 'partial';
    const yStart = isPartial ? Math.max(0, row.offsetStart ?? 0) : 0;
    const yEnd = isPartial ? yStart + Math.max(1, row.flangeWidth ?? H) : H;

    // Center bend axis line (localized to y..y+z if partial)
    addLine(xc, yStart, xc, yEnd, bendLayer, bendColor);
    // Tangent zone lines
    addLine(xStart, yStart, xStart, yEnd, '3_BEND_TANGENT', 8);
    addLine(xEnd, yStart, xEnd, yEnd, '3_BEND_TANGENT', 8);

    const isCurvedMould = row.edge === 'radius_curved';
    const partialInfo = isPartial
      ? ` [Kısmi: y=${yStart.toFixed(1)}, z=${(yEnd - yStart).toFixed(1)}, x=${Math.max(0, H - yEnd).toFixed(1)}mm]`
      : isCurvedMould
      ? ' [KALIP GEREKTİRİR: DERİN ÇEKME KASE BÜKÜMÜ]'
      : '';
    const label = `B${row.index} ${isUp ? 'UP' : 'DOWN'} ${row.angle}deg R${row.radius} (xc=${xc.toFixed(2)}mm)${partialInfo}`;
    addText(xc + 1.5, (yStart + yEnd) * 0.5, Math.min(4, Math.max(2, H * 0.03)), label, '4_ANNOTATION', isCurvedMould ? 1 : bendColor);
  });

  // 3. Stamped Cutouts, Pockets, Notches & Holes (Layer: 5_CUTOUTS)
  if (spec.cutouts && spec.cutouts.length > 0) {
    spec.cutouts.forEach((cutout, idx) => {
      const def = deformations[idx];
      const { flatX, flatY } = calculateCutoutFlatCoordinates(spec, cutout);

      if (cutout.type === 'round_hole') {
        const dia = cutout.diameter || 8;
        const color = def && def.riskLevel === 'SEVERE_TEARING' ? 1 : def && def.riskLevel === 'MODERATE_DISTORTION' ? 2 : 4; // 1 = Red, 2 = Yellow, 4 = Cyan

        if (cutout.preCompensated && def && def.strainFactor > 0) {
          // Pre-compensated oval
          const preW = dia / (1 + def.strainFactor);
          addCircle(flatX, flatY, preW / 2, '5_CUTOUTS', 3);
          addText(flatX + dia / 2 + 1, flatY, 2.0, `TERS KOMP.: ${preW.toFixed(2)}x${dia}mm -> Ø${dia}mm`, '4_ANNOTATION', 3);
        } else {
          addCircle(flatX, flatY, dia / 2, '5_CUTOUTS', color);
          if (def && def.riskLevel !== 'SAFE') {
            addText(
              flatX + dia / 2 + 1,
              flatY,
              2.5,
              `SUNME UYARISI: %${def.elongationPercent} (Maj=${def.deformedMajorMm}mm)`,
              '4_ANNOTATION',
              color
            );
          }
        }

        // Draw laser relief slit if enabled
        if (cutout.reliefSlit?.enabled) {
          const slitW = cutout.reliefSlit.slitWidthMm || 1.0;
          const slitL = cutout.reliefSlit.slitLengthMm || (dia + 4.0);
          const slitDist = cutout.reliefSlit.distanceFromHoleMm || 1.5;
          const slitX = flatX - (dia / 2 + slitDist + slitW / 2);
          addLine(slitX, flatY - slitL / 2, slitX, flatY + slitL / 2, '0_CUT_OUTLINE', 6);
          addText(slitX - 2, flatY, 2.0, 'LAZER RAHATLATMA YARIGI', '4_ANNOTATION', 6);
        }
      } else if (cutout.type === 'slot') {
        const sw = cutout.width || 10;
        const sl = cutout.length || 24;
        const halfL = sl / 2;
        const halfW = sw / 2;
        addLine(flatX - halfL, flatY - halfW, flatX + halfL, flatY - halfW, '5_CUTOUTS', 4);
        addLine(flatX + halfL, flatY - halfW, flatX + halfL, flatY + halfW, '5_CUTOUTS', 4);
        addLine(flatX + halfL, flatY + halfW, flatX - halfL, flatY + halfW, '5_CUTOUTS', 4);
        addLine(flatX - halfL, flatY + halfW, flatX - halfL, flatY - halfW, '5_CUTOUTS', 4);
      } else if (cutout.type === 'rect_cutout' || cutout.type === 'pocket') {
        const rw = cutout.width || 20;
        const rl = cutout.length || 40;
        const halfL = rl / 2;
        const halfW = rw / 2;
        addLine(flatX - halfL, flatY - halfW, flatX + halfL, flatY - halfW, '5_CUTOUTS', 4);
        addLine(flatX + halfL, flatY - halfW, flatX + halfL, flatY + halfW, '5_CUTOUTS', 4);
        addLine(flatX + halfL, flatY + halfW, flatX - halfL, flatY + halfW, '5_CUTOUTS', 4);
        addLine(flatX - halfL, flatY + halfW, flatX - halfL, flatY - halfW, '5_CUTOUTS', 4);
        addText(flatX - halfL + 1, flatY, 2.0, cutout.type === 'pocket' ? 'HAVUZ KESIK' : 'PENCERE', '4_ANNOTATION', 4);
      } else if (cutout.type === 'tab' || cutout.type === 'corner_notch' || cutout.type === 'louver') {
        const tw = cutout.width || 15;
        const tl = cutout.length || 25;
        const halfL = tl / 2;
        const halfW = tw / 2;
        addLine(flatX - halfL, flatY - halfW, flatX + halfL, flatY - halfW, '5_CUTOUTS', 5);
        addLine(flatX + halfL, flatY - halfW, flatX + halfL, flatY + halfW, '5_CUTOUTS', 5);
        addLine(flatX + halfL, flatY + halfW, flatX - halfL, flatY + halfW, '5_CUTOUTS', 5);
        addLine(flatX - halfL, flatY + halfW, flatX - halfL, flatY - halfW, '5_CUTOUTS', 5);
        addText(flatX - halfL + 1, flatY, 2.0, cutout.type.toUpperCase(), '4_ANNOTATION', 5);
      } else if (cutout.type === 'custom_path' && cutout.profile && cutout.profile.length >= 3) {
        // Draw custom 2D polygon profile
        const pts = cutout.profile;
        for (let i = 0; i < pts.length; i++) {
          const pA = pts[i];
          const pB = pts[(i + 1) % pts.length];
          addLine(flatX + pA.x, flatY + pA.y, flatX + pB.x, flatY + pB.y, '5_CUTOUTS', 4);
        }
        addText(flatX, flatY, 2.0, cutout.name || 'OZEL KESIM', '4_ANNOTATION', 4);
      }
    });
  }

  // 4. Part Summary Header below blank
  addText(
    0,
    -8,
    3.5,
    `${spec.name} | DIN 6935 FLAT BLANK: ${W.toFixed(2)} x ${H.toFixed(2)} x ${spec.thickness} mm | ${spec.materialName}`,
    '4_ANNOTATION',
    4
  );

  lines.push('0', 'ENDSEC', '0', 'EOF');
  return lines.join('\n');
}

/* ─── Cross-Page Bridge (/sheet-metal/ <-> /design-studio/) ───────────────── */

export const PENDING_SHEET_METAL_FOR_STUDIO_KEY = 'alucalc_pending_sheet_metal_3d_studio';
export const PENDING_SHEET_METAL_FOR_CALC_KEY = 'alucalc_pending_sheet_metal_calculator';

export function savePendingSheetMetalForStudio(spec: SheetMetalSpec): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PENDING_SHEET_METAL_FOR_STUDIO_KEY, JSON.stringify(spec));
  } catch {
    // Ignore storage quota errors
  }
}

export function consumePendingSheetMetalForStudio(): SheetMetalSpec | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PENDING_SHEET_METAL_FOR_STUDIO_KEY);
    if (!raw) return null;
    window.localStorage.removeItem(PENDING_SHEET_METAL_FOR_STUDIO_KEY);
    return JSON.parse(raw) as SheetMetalSpec;
  } catch {
    return null;
  }
}

export function savePendingSheetMetalForCalculator(spec: SheetMetalSpec): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PENDING_SHEET_METAL_FOR_CALC_KEY, JSON.stringify(spec));
  } catch {
    // Ignore storage quota errors
  }
}

export function consumePendingSheetMetalForCalculator(): SheetMetalSpec | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PENDING_SHEET_METAL_FOR_CALC_KEY);
    if (!raw) return null;
    window.localStorage.removeItem(PENDING_SHEET_METAL_FOR_CALC_KEY);
    return JSON.parse(raw) as SheetMetalSpec;
  } catch {
    return null;
  }
}
