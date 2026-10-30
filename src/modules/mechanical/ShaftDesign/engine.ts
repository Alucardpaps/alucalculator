/**
 * modules/mechanical/ShaftDesign/engine.ts
 * 
 * Industrial Stepped Shaft Design, Sizing & Stress Analysis Engine
 * 
 * Standards cited:
 * - DIN 743 (Teil 1-4): Tragfähigkeitsberechnung von Wellen und Achsen (Shaft capacity calculation)
 * - DIN 6885-1: Passfedern und Nuten (Parallel keys and keyways)
 * - DIN 471: Sicherungsringe für Wellen (Retaining rings for shafts)
 * - ISO 965: ISO general purpose metric screw threads
 * - DIN 5480: Passverzahnungen mit Evolventenflanken (Involute splines)
 * - DIN 912 / ISO 4762: Zylinderschrauben mit Innensechskant (Hexagon socket head cap screws)
 * - DIN 7 / ISO 2338 / DIN 1481: Zylinderstifte und Spannstifte (Dowel and spring pins)
 * - DIN 332: Zentrierbohrungen (Center holes)
 */

import { EngineMetadata } from '@/engine/project/ProjectSchema';
import { betaFactors, din743Check, roughnessForGrade, type Din743Material, type NotchKind, type SteelClass } from './din743';

// ============================================================================
// 1. DATA TYPES & INTERFACES
// ============================================================================

export type ShaftFeatureType = 
    | 'keyway' 
    | 'circlip' 
    | 'thread' 
    | 'spline' 
    | 'cross_hole' 
    | 'imbus' 
    | 'pin'
    | 'undercut'
    | 'center_drill'
    | 'gear';

export interface GearFeature {
    type: 'gear';
    id: string;
    standard: 'DIN 3960 / ISO 54';
    gearType: 'spur' | 'helical';
    module: number;           // m_n (mm)
    numTeeth: number;         // z
    pressureAngleDeg: number; // alpha (20°)
    helixAngleDeg: number;    // beta (0° for spur, e.g. 15° for helical)
    faceWidth: number;        // b (mm)
    offsetFromStart: number;  // mm from segment start
    mounting: 'integral' | 'mounted'; // integral pinion vs mounted gear
    pitchDiameter: number;    // d0 = m * z
    tipDiameter: number;      // da = d0 + 2m
    rootDiameter: number;     // df = d0 - 2.5m
    tangentialForceN?: number;
    radialForceN?: number;
    callout?: string;         // e.g. "DİŞLİ: m=2.5 z=28 (d₀=Ø70)"
}

export interface ShaftBearingSupport {
    supportId: 'A' | 'B';
    positionMm: number;
    segmentIndex?: number;
    bearingCode: string;          // e.g. "6207"
    fullDesignation?: string;     // e.g. "SKF 6207-2RSH"
    bearingType: string;          // e.g. "deep-groove-ball", "cylindrical-roller", "tapered-roller"
    boreDia: number;              // d (mm)
    outerDia: number;             // D (mm)
    width: number;                // B (mm)
    dynamicLoadRatingKN: number;  // C (kN)
    staticLoadRatingKN: number;   // C0 (kN)
    limitingSpeedRpm?: number;
    massKg?: number;
    reactionForceN?: number;
    lifeHoursL10h?: number;       // ISO 281 L10h calculated life
    status?: 'ok' | 'warning' | 'critical';
}

export interface KeywayFeature {
    type: 'keyway';
    id: string;
    standard: 'DIN 6885-1 Form A' | 'DIN 6885-1 Form B';
    width: number;       // b (mm)
    depth: number;       // t1 in shaft (mm)
    length: number;      // L_k (mm)
    offsetFromStart: number; // mm from start of this segment
    contactPressureMPa?: number;
    shearStressMPa?: number;
    hubMaterialId?: string;
    fitClass?: 'normal' | 'tight' | 'free';
}

export interface CirclipFeature {
    type: 'circlip';
    id: string;
    standard: 'DIN 471';
    grooveDia: number;   // d2 (mm)
    grooveWidth: number; // m (mm)
    offsetFromStart: number; // mm from start of this segment
    retainingCapacityKN?: number;
    edgeMarginMm?: number;
    leadInChamferAngle?: number; // 15° lead-in
}

export interface ThreadFeature {
    type: 'thread';
    id: string;
    standard: 'ISO 965 Metric';
    designation: string; // e.g. "M24x1.5"
    pitch: number;       // P (mm)
    length: number;      // mm
    offsetFromStart: number;
}

export interface SplineFeature {
    type: 'spline';
    id: string;
    standard: 'DIN 5480';
    module: number;      // m (mm)
    numTeeth: number;    // z
    length: number;      // mm
    offsetFromStart: number;
}

export interface CrossHoleFeature {
    type: 'cross_hole';
    id: string;
    diameter: number;    // d_h (mm)
    offsetFromStart: number;
    through: boolean;
}

export interface ImbusFeature {
    type: 'imbus';
    id: string;
    standard: 'DIN 912 / ISO 4762';
    thread: string;      // "M6", "M8", "M10", "M12", "M16"
    counterboreDia: number; // D (mm) per DIN 74 Form H
    counterboreDepth: number; // T (mm)
    clearanceDia?: number;    // dh (mm) per ISO 273
    screwHeadHeight?: number; // k (mm)
    tapDepth: number;        // L_tap (mm)
    face: 'left_end' | 'right_end';
    callout?: string;
}

export interface PinFeature {
    type: 'pin';
    id: string;
    standard: 'DIN 7 / ISO 2338';
    diameter: number;    // d_p (mm)
    offsetFromStart: number;
    fit: 'H7/m6' | 'H7/h8';
}

export interface UndercutFeature {
    type: 'undercut';
    id: string;
    standard: 'DIN 509';
    form: 'E' | 'F' | 'G' | 'H';
    radius: number;          // r (mm)
    cylinderDepth: number;   // t1 (mm)
    faceDepth?: number;      // t2 (mm)
    grooveWidth?: number;    // f (mm)
    rampAngle?: number;      // 15°
    offsetFromStart: number; // at shoulder boundary
    callout: string;         // e.g. "DIN 509 - E 1 x 0.2"
}

export interface CenterDrillFeature {
    type: 'center_drill';
    id: string;
    standard: 'DIN 332-1';
    form: 'A' | 'B' | 'R';
    pilotDia: number;        // d1 (mm)
    coneDia: number;         // d2 (mm)
    protectingDia?: number;  // d3 (mm) (Form B 120° rim)
    totalDepth: number;      // t (mm)
    face: 'left_end' | 'right_end';
    callout: string;         // e.g. "DIN 332 - B 2.5x5.3"
}

export type ShaftFeature = 
    | KeywayFeature 
    | CirclipFeature 
    | ThreadFeature 
    | SplineFeature 
    | CrossHoleFeature 
    | ImbusFeature 
    | PinFeature
    | UndercutFeature
    | CenterDrillFeature
    | GearFeature;

export interface ShaftSegment {
    id: string;
    segmentIndex: number;
    length: number;      // mm
    diameter: number;    // mm
    shoulderFilletRadius: number; // mm (fillet transition to next step, e.g. 1.5)
    shoulderTransition?: 'undercut' | 'radius'; // DIN 509 relief groove vs DIN 743 shoulder fillet (default: 'undercut')
    shoulderUndercutForm?: 'E' | 'F'; // Form E (cylinder only) or Form F (cylinder + face) (default: 'E')
    chamferLeft?: number;        // mm (pah on outer left corner, e.g. 1.5)
    chamferRight?: number;       // mm (pah on outer right corner, e.g. 1.5)
    chamferAngle?: number;       // degrees, default 45° or 15° lead-in
    toleranceGrade: string; // e.g. "k6", "h7", "js6", "m5", "g6"
    features: ShaftFeature[];
}

export interface ShaftRadialLoad {
    id: string;
    position: number;    // mm from shaft left origin
    forceN: number;      // N (positive = downwards)
    description?: string;
}

export interface ShaftTorqueLoad {
    torqueNm: number;    // N·m
    inputPosition: number;  // mm
    outputPosition: number; // mm
}

export interface ShaftMaterial {
    id: string;
    name: string;
    standard: string;
    Sy: number;  // Yield Strength Re (MPa)
    Sut: number; // Tensile Strength Rm (MPa)
    E: number;   // Young's Modulus (MPa), typically 210000
    G: number;   // Shear Modulus (MPa), typically 81000
    densityKgM3: number; // 7850
    steelClass?: SteelClass; // DIN 743-2 K1 class
}

export const SHAFT_MATERIALS: ShaftMaterial[] = [
    { id: 'c45', name: 'C45 / AISI 1045 (İmalat Çeliği)', standard: 'EN 10083-2', Sy: 370, Sut: 630, E: 210000, G: 81000, densityKgM3: 7850, steelClass: 'quenched-tempered' },
    { id: '42crmo4', name: '42CrMo4 / AISI 4140 (Islah Çeliği)', standard: 'EN 10083-3', Sy: 750, Sut: 1000, E: 210000, G: 81000, densityKgM3: 7850, steelClass: 'quenched-tempered' },
    { id: '16mncr5', name: '16MnCr5 / AISI 5115 (Sementasyon Çeliği)', standard: 'EN 10084', Sy: 590, Sut: 880, E: 210000, G: 81000, densityKgM3: 7850, steelClass: 'case-hardening' },
    { id: 's355', name: 'S355J2 / St 52-3 (Yapı Çeliği)', standard: 'EN 10025-2', Sy: 355, Sut: 510, E: 210000, G: 81000, densityKgM3: 7850, steelClass: 'structural' },
    { id: 'aisi304', name: 'AISI 304 / 1.4301 (Paslanmaz Çelik)', standard: 'EN 10088-3', Sy: 230, Sut: 540, E: 195000, G: 75000, densityKgM3: 7900, steelClass: 'structural' },
    { id: '34crnimo6', name: '34CrNiMo6 / AISI 4340 (Yüksek Mukavemet)', standard: 'EN 10083-3', Sy: 800, Sut: 1050, E: 210000, G: 81000, densityKgM3: 7850, steelClass: 'quenched-tempered' },
];

export interface ShaftDesignInput {
    totalLength: number; // mm
    segments: ShaftSegment[];
    materialId: string;
    supportAPos: number; // mm from left (Pinned bearing)
    supportBPos: number; // mm from left (Roller bearing)
    radialLoads: ShaftRadialLoad[];
    torque: ShaftTorqueLoad;
    targetSafetyFactor: number; // e.g. 1.5 - 2.0
}

export interface ShaftAnalysisPoint {
    x: number;           // mm from left
    segmentIndex: number;
    diameter: number;    // mm
    shearForceN: number; // V(x) N
    bendingMomentNm: number; // M(x) N·m
    torqueNm: number;    // T(x) N·m
    bendingStressMPa: number; // sigma_b
    torsionalStressMPa: number; // tau
    stressConcentrationKt: number; // Kt
    vonMisesStressMPa: number; // sigma_vm
    effectivePeakStressMPa: number; // indicative σvm·βσ
    safetyFactor: number; // DIN 743: min(S_F, S_D)
    staticSafety?: number; // DIN 743-1 §7 S_F
    fatigueSafety?: number; // DIN 743-1 §6 S_D
    deflectionMm: number; // y(x) mm
    slopeRad: number;     // theta(x)
}

export interface ShaftCriticalFeatureCheck {
    featureId: string;
    featureType: ShaftFeatureType | 'shoulder';
    segmentIndex: number;
    positionX: number;
    description: string;
    localDiameter: number;
    nominalStressMPa: number;
    Kt: number;
    peakStressMPa: number;
    safetyFactor: number;
    status: 'PASS' | 'WARN' | 'FAIL';
    notes?: string;
}

export interface ShaftDesignResult {
    totalLength: number;
    totalMassKg: number;
    supportReactions: {
        RaN: number;
        RbN: number;
    };
    maxBendingMomentNm: number;
    maxBendingMomentX: number;
    maxDeflectionMm: number;
    maxDeflectionX: number;
    bearingSlopeARad: number;
    bearingSlopeBRad: number;
    minSafetyFactor: number;
    minSafetyFactorX: number;
    minStaticSafety?: number;
    minFatigueSafety?: number;
    criticalSpeedRpm: number;
    isSafeOverall: boolean;
    points: ShaftAnalysisPoint[];
    criticalChecks: ShaftCriticalFeatureCheck[];
    summaryWarnings: string[];
}

// ============================================================================
// 2. STANDARD LOOKUP FUNCTIONS
// ============================================================================

/**
 * Standard DIN 6885-1 Keyway dimensions based on shaft diameter
 */
export function getStandardKeywayDIN6885(diameter: number): { width: number; height: number; depth: number; minLength: number; maxLength: number } {
    const d = Math.max(6, diameter);
    if (d <= 8) return { width: 2, height: 2, depth: 1.2, minLength: 6, maxLength: 20 };
    if (d <= 10) return { width: 3, height: 3, depth: 1.8, minLength: 8, maxLength: 36 };
    if (d <= 12) return { width: 4, height: 4, depth: 2.5, minLength: 10, maxLength: 45 };
    if (d <= 17) return { width: 5, height: 5, depth: 3.0, minLength: 12, maxLength: 56 };
    if (d <= 22) return { width: 6, height: 6, depth: 3.5, minLength: 14, maxLength: 70 };
    if (d <= 30) return { width: 8, height: 7, depth: 4.0, minLength: 18, maxLength: 90 };
    if (d <= 38) return { width: 10, height: 8, depth: 5.0, minLength: 22, maxLength: 110 };
    if (d <= 44) return { width: 12, height: 8, depth: 5.0, minLength: 28, maxLength: 140 };
    if (d <= 50) return { width: 14, height: 9, depth: 5.5, minLength: 36, maxLength: 160 };
    if (d <= 58) return { width: 16, height: 10, depth: 6.0, minLength: 45, maxLength: 180 };
    if (d <= 65) return { width: 18, height: 11, depth: 7.0, minLength: 50, maxLength: 200 };
    if (d <= 75) return { width: 20, height: 12, depth: 7.5, minLength: 56, maxLength: 220 };
    if (d <= 85) return { width: 22, height: 14, depth: 9.0, minLength: 63, maxLength: 250 };
    if (d <= 95) return { width: 25, height: 14, depth: 9.0, minLength: 70, maxLength: 280 };
    if (d <= 110) return { width: 28, height: 16, depth: 10.0, minLength: 80, maxLength: 320 };
    return { width: 32, height: 18, depth: 11.0, minLength: 90, maxLength: 360 };
}

/**
 * Standard DIN 471 External Circlip groove dimensions based on shaft diameter
 */
export function getStandardCirclipDIN471(diameter: number): { grooveDia: number; grooveWidth: number; thickness: number; maxAxialForceKN: number } {
    const d = Math.round(Math.max(10, diameter));
    // Standard table mappings
    const table: Record<number, { d2: number; m: number; s: number; fn: number }> = {
        10: { d2: 9.6, m: 1.1, s: 1.0, fn: 2.5 },
        12: { d2: 11.5, m: 1.1, s: 1.0, fn: 3.1 },
        15: { d2: 14.3, m: 1.1, s: 1.0, fn: 4.8 },
        17: { d2: 16.2, m: 1.1, s: 1.0, fn: 5.8 },
        20: { d2: 19.0, m: 1.3, s: 1.2, fn: 8.6 },
        22: { d2: 21.0, m: 1.3, s: 1.2, fn: 9.5 },
        25: { d2: 23.9, m: 1.3, s: 1.2, fn: 12.0 },
        28: { d2: 26.6, m: 1.6, s: 1.5, fn: 16.5 },
        30: { d2: 28.6, m: 1.6, s: 1.5, fn: 18.0 },
        32: { d2: 30.3, m: 1.6, s: 1.5, fn: 20.0 },
        35: { d2: 33.0, m: 1.6, s: 1.5, fn: 22.5 },
        40: { d2: 37.5, m: 1.85, s: 1.75, fn: 31.0 },
        45: { d2: 42.5, m: 1.85, s: 1.75, fn: 36.0 },
        50: { d2: 47.0, m: 2.15, s: 2.0, fn: 46.0 },
        55: { d2: 52.0, m: 2.15, s: 2.0, fn: 51.0 },
        60: { d2: 57.0, m: 2.15, s: 2.0, fn: 56.0 },
        65: { d2: 62.0, m: 2.65, s: 2.5, fn: 69.0 },
        70: { d2: 67.0, m: 2.65, s: 2.5, fn: 75.0 },
        75: { d2: 72.0, m: 2.65, s: 2.5, fn: 82.0 },
        80: { d2: 76.5, m: 2.65, s: 2.5, fn: 99.0 },
        85: { d2: 81.5, m: 3.15, s: 3.0, fn: 110.0 },
        90: { d2: 86.5, m: 3.15, s: 3.0, fn: 118.0 },
        95: { d2: 91.5, m: 3.15, s: 3.0, fn: 125.0 },
        100: { d2: 96.5, m: 3.15, s: 3.0, fn: 135.0 },
    };

    if (table[d]) {
        return {
            grooveDia: table[d].d2,
            grooveWidth: table[d].m,
            thickness: table[d].s,
            maxAxialForceKN: table[d].fn
        };
    }

    // Fallback formula per DIN 471
    const grooveDepth = d <= 30 ? 0.05 * d : 0.04 * d;
    const s = d <= 25 ? 1.2 : (d <= 50 ? 1.75 : 2.5);
    return {
        grooveDia: Number((d - 2 * grooveDepth).toFixed(2)),
        grooveWidth: Number((s + 0.15).toFixed(2)),
        thickness: s,
        maxAxialForceKN: Number((d * 0.9).toFixed(1))
    };
}

/**
 * Standard DIN 912 Socket Head Screw end tap configuration
 */
export function getRecommendedImbusDIN912(diameter: number): { thread: string; counterboreDia: number; counterboreDepth: number; tapDepth: number; clearanceDia: number } {
    if (diameter <= 16) return { thread: 'M5', counterboreDia: 10, counterboreDepth: 5.5, tapDepth: 12, clearanceDia: 5.5 };
    if (diameter <= 24) return { thread: 'M6', counterboreDia: 11, counterboreDepth: 6.5, tapDepth: 15, clearanceDia: 6.6 };
    if (diameter <= 32) return { thread: 'M8', counterboreDia: 15, counterboreDepth: 8.5, tapDepth: 20, clearanceDia: 9.0 };
    if (diameter <= 42) return { thread: 'M10', counterboreDia: 18, counterboreDepth: 10.5, tapDepth: 25, clearanceDia: 11.0 };
    if (diameter <= 55) return { thread: 'M12', counterboreDia: 20, counterboreDepth: 12.5, tapDepth: 30, clearanceDia: 13.5 };
    if (diameter <= 75) return { thread: 'M16', counterboreDia: 26, counterboreDepth: 16.5, tapDepth: 38, clearanceDia: 17.5 };
    return { thread: 'M20', counterboreDia: 33, counterboreDepth: 20.5, tapDepth: 45, clearanceDia: 22.0 };
}

/**
 * Standard DIN 7 / ISO 2338 Dowel Pin diameter recommendation
 */
export function getRecommendedPinDIN7(diameter: number): { diameter: number; fit: 'H7/m6' | 'H7/h8' } {
    const dp = Math.max(3, Math.min(16, Math.round(diameter * 0.2)));
    return { diameter: dp, fit: 'H7/m6' };
}

/**
 * Metric Thread recommendation (ISO 965)
 */
export function getRecommendedThreadISO965(diameter: number): { designation: string; pitch: number } {
    const d = Math.round(diameter);
    if (d <= 12) return { designation: `M${d}x1.25`, pitch: 1.25 };
    if (d <= 20) return { designation: `M${d}x1.5`, pitch: 1.5 };
    if (d <= 35) return { designation: `M${d}x1.5`, pitch: 1.5 };
    if (d <= 60) return { designation: `M${d}x2`, pitch: 2.0 };
    return { designation: `M${d}x3`, pitch: 3.0 };
}

/**
 * Standard DIN 509 Relief Undercuts (Form E / Form F)
 * Per DIN 509:2006 for Cylindrical & Face Grinding
 */
export function getStandardUndercutDIN509(diameter: number, form: 'E' | 'F' = 'E'): {
    form: 'E' | 'F';
    radius: number;
    depth: number;
    faceDepth?: number;
    grooveWidth: number;
    rampAngle: number;
    callout: string;
} {
    const d = Math.max(1.6, diameter);
    const r = d <= 10 ? 0.6 : (d <= 50 ? 1.0 : (d <= 125 ? 1.6 : 2.5));
    const t1 = d <= 10 ? 0.2 : (d <= 50 ? 0.2 : (d <= 125 ? 0.3 : 0.4));
    const t2 = form === 'F' ? (d <= 10 ? 0.1 : (d <= 50 ? 0.1 : 0.2)) : 0;
    const f = d <= 10 ? 2.5 : (d <= 50 ? 2.5 : (d <= 125 ? 4.0 : 5.0));
    const callout = form === 'E' ? `DIN 509 - E ${r} x ${t1}` : `DIN 509 - F ${r} x ${t1} x ${t2}`;
    return {
        form,
        radius: r,
        depth: t1,
        faceDepth: t2,
        grooveWidth: f,
        rampAngle: 15,
        callout
    };
}

/**
 * Standard DIN 332-1 Center Drill Holes
 * Form A (60° cone), Form B (60° cone + 120° protecting rim), Form R (radiused)
 */
export function getStandardCenterDrillDIN332(diameter: number, form: 'A' | 'B' | 'R' = 'B'): {
    form: 'A' | 'B' | 'R';
    pilotDia: number;
    coneDia: number;
    protectingDia?: number;
    totalDepth: number;
    callout: string;
} {
    const d = Math.max(5, diameter);
    let d1 = 2.5;
    let d2 = 5.3;
    let d3 = 8.0;
    let t = 4.6;

    if (d <= 8) {
        d1 = 1.0; d2 = 2.12; d3 = 3.15; t = 1.9;
    } else if (d <= 16) {
        d1 = 1.6; d2 = 3.35; d3 = 5.0; t = 2.9;
    } else if (d <= 30) {
        d1 = 2.0; d2 = 4.25; d3 = 6.3; t = 3.6;
    } else if (d <= 50) {
        d1 = 2.5; d2 = 5.3; d3 = 8.0; t = 4.6;
    } else if (d <= 80) {
        d1 = 3.15; d2 = 6.7; d3 = 10.0; t = 5.7;
    } else if (d <= 120) {
        d1 = 4.0; d2 = 8.5; d3 = 12.5; t = 7.1;
    } else {
        d1 = 5.0; d2 = 10.6; d3 = 16.0; t = 9.0;
    }

    const callout = `DIN 332 - ${form} ${d1}x${d2}`;
    return {
        form,
        pilotDia: d1,
        coneDia: d2,
        protectingDia: form === 'B' ? d3 : undefined,
        totalDepth: t,
        callout
    };
}

/**
 * 1:1 Complete DIN 6885 Shaft-Hub Connection Calculation (Image 3)
 */
export function calculateKeywayFullDIN6885(params: {
    shaftDiameter: number;
    torqueNm: number;
    keyLength?: number;
    applicationFactor?: number;
    keyForm?: 'A' | 'B';
    hubMaterialId?: string;
    fitClass?: 'normal' | 'tight' | 'free';
}) {
    const d = Math.max(6, params.shaftDiameter);
    const T = Math.max(0, params.torqueNm);
    const KA = params.applicationFactor ?? 1.25;
    const std = getStandardKeywayDIN6885(d);
    const L = params.keyLength ?? Math.min(std.maxLength, Math.max(std.minLength, Math.round(d * 1.5)));
    const form = params.keyForm ?? 'A';
    const fit = params.fitClass ?? 'normal';

    // b, h, t1, t2
    const b = std.width;
    const h = std.height;
    const t1 = std.depth;
    const t2 = Number((h - t1 + 0.3).toFixed(1)); // hub keyway depth
    const clearanceC = Number((t1 + t2 - h).toFixed(1)); // ~0.5 mm

    // 1. Tangential Force: Ft = (2 * T * KA) / (d - t1)
    const T_Nmm = T * 1000;
    const effectiveDia = d - t1;
    const Ft = effectiveDia > 0 ? Number(((2 * T_Nmm * KA) / effectiveDia).toFixed(1)) : 0;

    // 2. Effective Bearing Length: Form A: L - b, Form B: L
    const lEff = form === 'A' ? Math.max(1, L - b) : L;

    // 3. Hub Contact Pressure: p_hub = Ft / (lEff * t2)
    const pHub = (lEff * t2 > 0) ? Number((Ft / (lEff * t2)).toFixed(1)) : 0;

    // 4. Key Shear Stress: tau = Ft / (lEff * b)
    const tau = (lEff * b > 0) ? Number((Ft / (lEff * b)).toFixed(1)) : 0;

    // Allowables
    const pAllowable = 100; // MPa for GG-25 / standard cast iron, 150 for steel
    const tauAllowable = 90; // MPa for C45 key steel
    const safetyPressure = pHub > 0 ? Number((pAllowable / pHub).toFixed(2)) : 99;
    const safetyShear = tau > 0 ? Number((tauAllowable / tau).toFixed(2)) : 99;

    // Tolerance strings
    const shaftTolStr = fit === 'tight' ? `${b} N9` : (fit === 'free' ? `${b} D10` : `${b} P9`);
    const hubTolStr = fit === 'tight' ? `${b} P9` : (fit === 'free' ? `${b} H11` : `${b} JS9`);

    return {
        d,
        b,
        h,
        t1,
        t2,
        L,
        lEff,
        clearanceC,
        Ft,
        pHub,
        tau,
        pAllowable,
        tauAllowable,
        safetyPressure,
        safetyShear,
        isSafe: safetyPressure >= 1.0 && safetyShear >= 1.0,
        shaftTolStr,
        hubTolStr,
        callout: `DIN 6885 - ${form} ${b}x${h}x${L}`
    };
}

/**
 * 1:1 Complete DIN 471 Retaining Ring Calculation (Image 2)
 */
export function calculateCirclipFullDIN471(params: {
    shaftDiameter: number;
    yieldStrengthMPa?: number;
}) {
    const d = Math.max(10, params.shaftDiameter);
    const std = getStandardCirclipDIN471(d);
    const Sy = params.yieldStrengthMPa ?? 370;

    // Groove depth t = (d - d2) / 2
    const depthT = Number(((d - std.grooveDia) / 2).toFixed(2));
    // Minimum edge margin: n >= 3t
    const minEdgeMargin = Number((depthT * 3).toFixed(2));

    // Axial load capacity: FN = (pi * d * t * Sy) / S
    const S = 3.0; // safety factor for shaft collar shear
    const FN_calculated = Number(((Math.PI * d * depthT * Sy) / (S * 1000)).toFixed(1)); // kN
    const FN = std.maxAxialForceKN || FN_calculated;

    return {
        d,
        d2: std.grooveDia,
        m: std.grooveWidth,
        s: std.thickness,
        depth: depthT,
        minEdgeMargin,
        FN_KN: FN,
        leadInChamferAngle: 15, // 15° lead-in chamfer
        callout: `DIN 471 - ${Math.round(d)} x ${std.thickness}`
    };
}

// ============================================================================
// 3. CORE CALCULATION ENGINE
// ============================================================================

export class ShaftDesignEngine {
    static readonly VERSION = '1.0.0';

    /**
     * Executes complete DIN 743 static and fatigue analysis, deflection profile,
     * stress concentration check, and returns full traceable metadata.
     */
    static analyze(input: ShaftDesignInput): { result: ShaftDesignResult; metadata: EngineMetadata } {
        const warnings: string[] = [];
        const material = SHAFT_MATERIALS.find(m => m.id === input.materialId) ?? SHAFT_MATERIALS[0];
        const mat743: Din743Material = { Rm: material.Sut, Re: material.Sy, steelClass: material.steelClass ?? 'quenched-tempered' };

        // 1. Segment boundaries
        let currentX = 0;
        const segmentSpans: Array<{ startX: number; endX: number; segment: ShaftSegment }> = [];
        for (const seg of input.segments) {
            segmentSpans.push({ startX: currentX, endX: currentX + seg.length, segment: seg });
            currentX += seg.length;
        }
        const totalCalculatedLength = currentX;

        // 2. Mass
        let totalMassKg = 0;
        for (const span of segmentSpans) {
            const r_m = span.segment.diameter / 2000;
            totalMassKg += Math.PI * r_m * r_m * (span.segment.length / 1000) * material.densityKgM3;
        }

        // 3. Support reactions (statics, two supports)
        const xA = input.supportAPos;
        const xB = input.supportBPos;
        const spanAB = xB - xA;
        if (Math.abs(spanAB) < 1e-4) {
            warnings.push('Yataklar arasındaki mesafe sıfır olamaz. Lütfen Yatak A ve Yatak B konumlarını kontrol ediniz.');
        }
        let sumMomentAboutA = 0;
        let sumForces = 0;
        for (const load of input.radialLoads) {
            sumForces += load.forceN;
            sumMomentAboutA += load.forceN * (load.position - xA);
        }
        const RbN = spanAB !== 0 ? sumMomentAboutA / spanAB : sumForces / 2;
        const RaN = sumForces - RbN;

        // 4. Stations
        const numBaseStations = 160;
        const baseDx = totalCalculatedLength / (numBaseStations - 1);
        const stationSet = new Set<number>();
        for (let i = 0; i < numBaseStations; i++) stationSet.add(Number((i * baseDx).toFixed(2)));
        stationSet.add(Number(xA.toFixed(2)));
        stationSet.add(Number(xB.toFixed(2)));
        for (const l of input.radialLoads) stationSet.add(Number(l.position.toFixed(2)));
        for (const sp of segmentSpans) {
            stationSet.add(Number(sp.startX.toFixed(2)));
            stationSet.add(Number(sp.endX.toFixed(2)));
        }
        const xStations = Array.from(stationSet).filter(x => x >= 0 && x <= totalCalculatedLength).sort((a, b) => a - b);
        const numStations = xStations.length;

        const getSegmentAt = (x: number): { seg: ShaftSegment; idx: number } => {
            for (let i = 0; i < segmentSpans.length; i++) {
                if (x >= segmentSpans[i].startX && (x < segmentSpans[i].endX || i === segmentSpans.length - 1)) {
                    return { seg: segmentSpans[i].segment, idx: i };
                }
            }
            return { seg: segmentSpans[segmentSpans.length - 1].segment, idx: segmentSpans.length - 1 };
        };

        const tIn = Math.min(input.torque.inputPosition, input.torque.outputPosition);
        const tOut = Math.max(input.torque.inputPosition, input.torque.outputPosition);
        const torqueAt = (x: number) => (x >= tIn && x <= tOut ? Math.abs(input.torque.torqueNm) : 0);

        /** signed internal bending moment (N·mm) from the external loads and reactions */
        const momentAt = (x: number) => {
            let M = 0;
            if (x >= xA) M += RaN * (x - xA);
            if (x >= xB) M += RbN * (x - xB);
            for (const load of input.radialLoads) if (x >= load.position) M -= load.forceN * (x - load.position);
            return M;
        };
        const shearAt = (x: number) => {
            let V = 0;
            if (x >= xA) V += RaN;
            if (x >= xB) V += RbN;
            for (const load of input.radialLoads) if (x >= load.position) V -= load.forceN;
            return V;
        };

        /** governing DIN 743 notch at x (largest βσ), with the notch-root diameter used for the stresses */
        const notchAt = (x: number, seg: ShaftSegment, idx: number): { notch: NotchKind; dRoot: number; label: string } => {
            const cands: { notch: NotchKind; dRoot: number; label: string }[] = [{ notch: { kind: 'none' }, dRoot: seg.diameter, label: '' }];
            for (let s = 0; s < segmentSpans.length - 1; s++) {
                const shoulderX = segmentSpans[s].endX;
                if (Math.abs(x - shoulderX) > 3.0) continue;
                const d1 = segmentSpans[s].segment.diameter;
                const d2 = segmentSpans[s + 1].segment.diameter;
                if (d1 === d2) continue;
                const dSmall = Math.min(d1, d2), dBig = Math.max(d1, d2);
                const trans = segmentSpans[s].segment.shoulderTransition ?? 'undercut';
                if (trans === 'undercut') {
                    const uc = getStandardUndercutDIN509(dSmall, segmentSpans[s].segment.shoulderUndercutForm ?? 'E');
                    cands.push({ notch: { kind: 'groove', d: dSmall - 2 * uc.depth, t: uc.depth, r: uc.radius }, dRoot: dSmall - 2 * uc.depth, label: uc.callout });
                } else {
                    const r = Math.max(0.2, segmentSpans[s].segment.shoulderFilletRadius || 1.5);
                    cands.push({ notch: { kind: 'shoulder', D: dBig, d: dSmall, r }, dRoot: dSmall, label: `R${r}` });
                }
            }
            const local = x - segmentSpans[idx].startX;
            for (const f of seg.features) {
                if (f.type === 'keyway' && local >= f.offsetFromStart && local <= f.offsetFromStart + f.length) {
                    cands.push({ notch: { kind: 'keyway', d: seg.diameter }, dRoot: seg.diameter, label: 'DIN 6885' });
                } else if (f.type === 'circlip' && Math.abs(local - f.offsetFromStart) <= f.grooveWidth + 2) {
                    cands.push({ notch: { kind: 'circlip', d: f.grooveDia, t: Math.max(0.05, (seg.diameter - f.grooveDia) / 2), m: f.grooveWidth }, dRoot: f.grooveDia, label: 'DIN 471' });
                } else if (f.type === 'cross_hole' && Math.abs(local - f.offsetFromStart) <= f.diameter + 2) {
                    cands.push({ notch: { kind: 'cross-hole', d: seg.diameter, dh: f.diameter }, dRoot: seg.diameter, label: `Ø${f.diameter}` });
                } else if (f.type === 'pin' && Math.abs(local - f.offsetFromStart) <= f.diameter + 2) {
                    cands.push({ notch: { kind: 'cross-hole', d: seg.diameter, dh: f.diameter }, dRoot: seg.diameter, label: `pin Ø${f.diameter}` });
                } else if (f.type === 'thread' && local >= f.offsetFromStart && local <= f.offsetFromStart + f.length) {
                    cands.push({ notch: { kind: 'thread', d: seg.diameter }, dRoot: seg.diameter - 1.226869 * f.pitch, label: f.designation });
                } else if (f.type === 'spline' && local >= f.offsetFromStart && local <= f.offsetFromStart + f.length) {
                    cands.push({ notch: { kind: 'spline', d: seg.diameter }, dRoot: seg.diameter - 2.2 * f.module, label: 'DIN 5480' });
                } else if (f.type === 'gear' && f.mounting === 'mounted' && local >= f.offsetFromStart && local <= f.offsetFromStart + f.faceWidth) {
                    cands.push({ notch: { kind: 'press-fit', d: seg.diameter }, dRoot: seg.diameter, label: 'hub fit' });
                } else if (f.type === 'undercut' && Math.abs(local - f.offsetFromStart) <= (f.grooveWidth ?? 2) + 2) {
                    cands.push({ notch: { kind: 'groove', d: seg.diameter - 2 * f.cylinderDepth, t: f.cylinderDepth, r: f.radius }, dRoot: seg.diameter - 2 * f.cylinderDepth, label: f.callout });
                }
            }
            let best = cands[0];
            let bestB = 1;
            for (const c of cands) {
                const b = betaFactors(c.notch, mat743, c.dRoot).bs;
                if (b > bestB) { bestB = b; best = c; }
            }
            return best;
        };

        const points: ShaftAnalysisPoint[] = [];
        const Msigned: number[] = [];
        let maxBendingMoment = 0, maxBendingMomentX = 0;
        let minSafetyFactor = Infinity, minSafetyFactorX = 0;
        let minStatic = Infinity, minFatigue = Infinity;

        for (let i = 0; i < numStations; i++) {
            const x = xStations[i];
            const { seg, idx } = getSegmentAt(x);
            const M = momentAt(x);
            const V = shearAt(x);
            Msigned.push(M);
            const M_Nm = Math.abs(M) / 1000;
            if (M_Nm > maxBendingMoment) { maxBendingMoment = M_Nm; maxBendingMomentX = x; }
            const T_Nm = torqueAt(x);

            const nt = notchAt(x, seg, idx);
            const d = Math.max(1, nt.dRoot);
            const sigma_b = Math.abs(M) / ((Math.PI * d ** 3) / 32);
            const tau = (T_Nm * 1000) / ((Math.PI * d ** 3) / 16);
            const sigma_vm = Math.sqrt(sigma_b ** 2 + 3 * tau ** 2);
            const chk = din743Check({ sigmaB: sigma_b, tau, d, notch: nt.notch, Rz: roughnessForGrade(seg.toleranceGrade) }, mat743);
            const sf = Math.min(chk.SF, chk.SD);
            if (sf < minSafetyFactor) { minSafetyFactor = sf; minSafetyFactorX = x; }
            minStatic = Math.min(minStatic, chk.SF);
            minFatigue = Math.min(minFatigue, chk.SD);

            points.push({
                x: Number(x.toFixed(2)),
                segmentIndex: idx,
                diameter: seg.diameter,
                shearForceN: Number(V.toFixed(1)),
                bendingMomentNm: Number(M_Nm.toFixed(2)),
                torqueNm: Number(T_Nm.toFixed(1)),
                bendingStressMPa: Number(sigma_b.toFixed(2)),
                torsionalStressMPa: Number(tau.toFixed(2)),
                stressConcentrationKt: Number(chk.betaS.toFixed(2)),
                vonMisesStressMPa: Number(sigma_vm.toFixed(2)),
                effectivePeakStressMPa: Number((sigma_vm * chk.betaS).toFixed(2)),
                safetyFactor: Number(Math.min(999, sf).toFixed(2)),
                staticSafety: Number(Math.min(999, chk.SF).toFixed(2)),
                fatigueSafety: Number(Math.min(999, chk.SD).toFixed(2)),
                deflectionMm: 0,
                slopeRad: 0,
            });
        }

        // 5. Deflection: y'' = M(x)/(E·I(x)) with the SIGNED moment, y(xA) = y(xB) = 0
        const E = material.E;
        const idxOf = (xq: number) => {
            let best = 0, bd = Infinity;
            for (let i = 0; i < numStations; i++) { const dd = Math.abs(xStations[i] - xq); if (dd < bd) { bd = dd; best = i; } }
            return best;
        };
        const idxA = idxOf(xA), idxB = idxOf(xB);
        const integrate = (Mx: number[]) => {
            const curv = Mx.map((m, i) => m / (E * (Math.PI * points[i].diameter ** 4) / 64));
            const th: number[] = [0];
            for (let i = 1; i < numStations; i++) th.push(th[i - 1] + ((curv[i - 1] + curv[i]) / 2) * (xStations[i] - xStations[i - 1]));
            const yy: number[] = [0];
            for (let i = 1; i < numStations; i++) yy.push(yy[i - 1] + ((th[i - 1] + th[i]) / 2) * (xStations[i] - xStations[i - 1]));
            const span = xStations[idxB] - xStations[idxA];
            const C1 = idxB !== idxA && span !== 0 ? (yy[idxA] - yy[idxB]) / span : 0;
            const C2 = -yy[idxA] - C1 * xStations[idxA];
            return { y: yy.map((v, i) => v + C1 * xStations[i] + C2), slope: th.map((v) => v + C1) };
        };
        const defl = integrate(Msigned);
        let maxDeflection = 0, maxDeflectionX = 0;
        for (let i = 0; i < numStations; i++) {
            points[i].deflectionMm = Number(Math.abs(defl.y[i]).toFixed(4));
            points[i].slopeRad = Number(defl.slope[i].toFixed(6));
            if (Math.abs(defl.y[i]) > maxDeflection) { maxDeflection = Math.abs(defl.y[i]); maxDeflectionX = xStations[i]; }
        }
        const bearingSlopeA = Math.abs(defl.slope[idxA] ?? 0);
        const bearingSlopeB = Math.abs(defl.slope[idxB] ?? 0);

        // 6. First bending critical speed — Rayleigh with the self-weight deflection line
        //    n = 30/π · √( g Σ mᵢ|yᵢ| / Σ mᵢ yᵢ² )
        const g = 9810; // mm/s²
        const qAt = (i: number) => (material.densityKgM3 * 1e-9) * (Math.PI * points[i].diameter ** 2 / 4) * g * 1e-3; // N/mm
        const mAt: number[] = [];
        for (let i = 0; i < numStations; i++) {
            const dx = (i > 0 ? xStations[i] - xStations[i - 1] : 0) / 2 + (i < numStations - 1 ? xStations[i + 1] - xStations[i] : 0) / 2;
            mAt.push(qAt(i) * dx); // N (weight of the station slice)
        }
        let sW = 0, sWx = 0;
        for (let i = 0; i < numStations; i++) { sW += mAt[i]; sWx += mAt[i] * xStations[i]; }
        const RbG = spanAB !== 0 ? (sWx - sW * xA) / spanAB : sW / 2;
        const RaG = sW - RbG;
        const Mg: number[] = [];
        for (let i = 0; i < numStations; i++) {
            const x = xStations[i];
            let M = 0;
            if (x >= xA) M += RaG * (x - xA);
            if (x >= xB) M += RbG * (x - xB);
            for (let j = 0; j <= i; j++) M -= mAt[j] * (x - xStations[j]);
            Mg.push(M);
        }
        const yg = integrate(Mg).y;
        let num = 0, den = 0;
        for (let i = 0; i < numStations; i++) { num += mAt[i] * Math.abs(yg[i]); den += mAt[i] * yg[i] * yg[i]; }
        const criticalSpeedRpm = den > 0 ? Math.round((30 / Math.PI) * Math.sqrt((g * num) / den)) : 0;

        // 7. Notch checks (features + shoulders)
        const criticalChecks: ShaftCriticalFeatureCheck[] = [];
        const pushCheck = (featureId: string, featureType: ShaftCriticalFeatureCheck['featureType'], sIdx: number, posX: number, desc: string, seg: ShaftSegment) => {
            const pi = idxOf(posX);
            const pt = points[pi];
            const sf = pt.safetyFactor;
            let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
            if (sf < 1.0) status = 'FAIL';
            else if (sf < input.targetSafetyFactor) status = 'WARN';
            criticalChecks.push({
                featureId, featureType, segmentIndex: sIdx, positionX: Number(posX.toFixed(1)), description: desc,
                localDiameter: seg.diameter, nominalStressMPa: pt.vonMisesStressMPa, Kt: pt.stressConcentrationKt,
                peakStressMPa: pt.effectivePeakStressMPa, safetyFactor: sf, status,
                notes: `DIN 743: S_F = ${pt.staticSafety}, S_D = ${pt.fatigueSafety}`,
            });
        };
        for (let sIdx = 0; sIdx < input.segments.length; sIdx++) {
            const seg = input.segments[sIdx];
            const span = segmentSpans[sIdx];
            if (sIdx < input.segments.length - 1 && seg.diameter !== input.segments[sIdx + 1].diameter) {
                const trans = seg.shoulderTransition ?? 'undercut';
                pushCheck(`shoulder-${sIdx}`, 'shoulder', sIdx, span.endX, trans === 'undercut' ? `Omuz ${sIdx + 1}/${sIdx + 2} · DIN 509 boşaltma` : `Omuz ${sIdx + 1}/${sIdx + 2} · R${seg.shoulderFilletRadius}`, seg);
            }
            for (const f of seg.features) {
                let posX = span.startX;
                let desc = '';
                if (f.type === 'keyway') {
                    posX += f.offsetFromStart + f.length / 2;
                    desc = `${f.standard} (${f.width}x${f.depth}x${f.length}mm)`;
                    const keywayStd = getStandardKeywayDIN6885(seg.diameter);
                    const contactHeight = keywayStd.height - f.depth;
                    const T_Nm = Math.abs(input.torque.torqueNm);
                    const lEff = f.standard === 'DIN 6885-1 Form A' ? Math.max(1, f.length - f.width) : f.length; // rounded ends do not carry
                    const pContact = contactHeight > 0 && lEff > 0 ? (2000 * T_Nm) / (seg.diameter * contactHeight * lEff) : 0;
                    f.contactPressureMPa = Number(pContact.toFixed(1));
                    f.shearStressMPa = Number(((f.width > 0 && lEff > 0) ? (2000 * T_Nm) / (seg.diameter * f.width * lEff) : 0).toFixed(1));
                    const pAllow = material.Sy * 0.45;
                    if (pContact > pAllow) warnings.push(`Kademe ${sIdx + 1} üzerindeki kama temas yüzey basıncı (${pContact.toFixed(1)} MPa), izin verilen sınırı (${pAllow.toFixed(0)} MPa) aşıyor. Kama boyunu uzatınız.`);
                } else if (f.type === 'circlip') {
                    posX += f.offsetFromStart; desc = `${f.standard} (Oluk Ø${f.grooveDia} x ${f.grooveWidth}mm)`;
                } else if (f.type === 'thread') {
                    posX += f.offsetFromStart + f.length / 2; desc = `${f.standard} ${f.designation} (L=${f.length}mm)`;
                } else if (f.type === 'spline') {
                    posX += f.offsetFromStart + f.length / 2; desc = `${f.standard} m=${f.module} z=${f.numTeeth}`;
                } else if (f.type === 'cross_hole') {
                    posX += f.offsetFromStart; desc = `Enine Delik Ø${f.diameter}mm`;
                } else if (f.type === 'imbus') {
                    posX = f.face === 'left_end' ? span.startX : span.endX; desc = `${f.standard} ${f.thread} (${f.face === 'left_end' ? 'Sol Alın' : 'Sağ Alın'})`;
                } else if (f.type === 'pin') {
                    posX += f.offsetFromStart; desc = `${f.standard} Ø${f.diameter}mm (${f.fit})`;
                } else if (f.type === 'undercut') {
                    posX += f.offsetFromStart; desc = `${f.standard} Form ${f.form} (${f.callout})`;
                } else if (f.type === 'center_drill') {
                    posX = f.face === 'left_end' ? span.startX : span.endX; desc = `${f.standard} Form ${f.form} (${f.callout})`;
                } else if (f.type === 'gear') {
                    posX += f.offsetFromStart + f.faceWidth / 2; desc = f.callout ?? `m=${f.module} z=${f.numTeeth}`;
                }
                pushCheck(f.id, f.type, sIdx, posX, desc, seg);
            }
        }

        // Global warnings
        if (minSafetyFactor < 1.0) {
            warnings.push(`Kritik Mukavemet Uyarısı: Minimum güvenlik katsayısı (${minSafetyFactor.toFixed(2)}) 1.0'ın altındadır (DIN 743: S_F = ${minStatic.toFixed(2)}, S_D = ${minFatigue.toFixed(2)}).`);
        } else if (minSafetyFactor < input.targetSafetyFactor) {
            warnings.push(`Güvenlik faktörü (${minSafetyFactor.toFixed(2)}), hedeflenen emniyet katsayısının (${input.targetSafetyFactor}) altındadır (DIN 743 S_min = 1.2).`);
        }
        const maxAllowableDeflection = Math.abs(spanAB) / 3000; // DIN 743 / common gear-shaft limit l/3000
        if (maxDeflection > maxAllowableDeflection) {
            warnings.push(`Sehim Limiti Uyarısı: Maksimum sehim (${maxDeflection.toFixed(3)} mm), dişli milleri için yaygın l/3000 limitini (${maxAllowableDeflection.toFixed(3)} mm) aşmaktadır.`);
        }
        const slopeLimit = 0.001; // rad — deep-groove ball bearings tolerate ~2–10′, cylindrical rollers ~3′ (0.001 rad)
        if (Math.max(bearingSlopeA, bearingSlopeB) > slopeLimit) {
            warnings.push(`Yatak eğim açısı ${(Math.max(bearingSlopeA, bearingSlopeB) * 1000).toFixed(2)} mrad > 1 mrad (silindirik makaralı rulman sınırı ≈ 3′).`);
        }

        const result: ShaftDesignResult = {
            totalLength: Number(totalCalculatedLength.toFixed(1)),
            totalMassKg: Number(totalMassKg.toFixed(2)),
            supportReactions: { RaN: Number(RaN.toFixed(1)), RbN: Number(RbN.toFixed(1)) },
            maxBendingMomentNm: Number(maxBendingMoment.toFixed(2)),
            maxBendingMomentX: Number(maxBendingMomentX.toFixed(1)),
            maxDeflectionMm: Number(maxDeflection.toFixed(4)),
            maxDeflectionX: Number(maxDeflectionX.toFixed(1)),
            bearingSlopeARad: Number(bearingSlopeA.toFixed(5)),
            bearingSlopeBRad: Number(bearingSlopeB.toFixed(5)),
            minSafetyFactor: Number(minSafetyFactor.toFixed(2)),
            minSafetyFactorX: Number(minSafetyFactorX.toFixed(1)),
            minStaticSafety: Number(minStatic.toFixed(2)),
            minFatigueSafety: Number(minFatigue.toFixed(2)),
            criticalSpeedRpm,
            isSafeOverall: minSafetyFactor >= input.targetSafetyFactor && maxDeflection <= maxAllowableDeflection,
            points,
            criticalChecks,
            summaryWarnings: warnings,
        };

        const metadata: EngineMetadata = {
            calculationId: `SHAFT-DIN743-${Date.now()}`,
            engineVersion: this.VERSION,
            moduleName: 'ShaftDesignEngine',
            timestamp: Date.now(),
            inputSnapshot: input as any,
            standardReference: 'DIN 743-1/-2/-3:2012 (static §7, fatigue §6 load case 1), DIN 509, DIN 6885-1, DIN 471, ISO 965, DIN 5480',
            assumptions: [
                'Euler-Bernoulli kiriş teorisi; işaretli M(x)/EI(x) çift integrasyonu, y(A) = y(B) = 0',
                'DIN 743 yük durumu 1: dönen milde eğilme tam değişken (σba = σb), tork sabit (τm = τ)',
                'βσ/βτ: omuz ve oluk için DIN 743-2 αk + gerilme gradyanı G′ ile n; kama ve segman oluğu DIN 743-2 tablo formülleri; diş, kanal ve enine delik için muhafazakâr yaklaşık değerler',
                'Statik: DIN 743-1 §7, K2F = 1.2, γF = 1.0; S = min(S_F, S_D), DIN 743 asgari 1.2',
                'Kritik hız: öz ağırlık sehim eğrisi ile Rayleigh yöntemi (dişli/kasnak kütleleri hariç)',
            ],
            safetyFactors: {
                staticBendingAndTorsion: minStatic,
                fatigue: minFatigue,
                targetSafetyFactor: input.targetSafetyFactor,
            },
            validationStatus: result.isSafeOverall ? 'success' : (minSafetyFactor >= 1.0 ? 'warning' : 'error'),
            warnings,
            calculationHash: btoa(JSON.stringify({ L: totalCalculatedLength, mass: totalMassKg, sf: minSafetyFactor, def: maxDeflection })),
        };

        return { result, metadata };
    }

}

/**
 * Calculate DIN 3960 / ISO 54 Gear Tooth Geometry and Forces
 */
export function calculateGearGeometry(
    module: number,
    numTeeth: number,
    faceWidth: number,
    helixAngleDeg = 0,
    pressureAngleDeg = 20,
    torqueNm?: number
): {
    pitchDiameter: number;
    tipDiameter: number;
    rootDiameter: number;
    baseDiameter: number;
    circularPitch: number;
    toothHeight: number;
    tangentialForceN?: number;
    radialForceN?: number;
    callout: string;
} {
    const mn = Math.max(0.5, Number(module) || 2.5);
    const z = Math.max(8, Math.round(Number(numTeeth) || 24));
    const betaRad = ((helixAngleDeg || 0) * Math.PI) / 180;
    const mt = (helixAngleDeg || 0) === 0 ? mn : mn / Math.cos(betaRad);
    const d0 = Number((mt * z).toFixed(2));
    const ha = mn;
    const hf = 1.25 * mn;
    const da = Number((d0 + 2 * ha).toFixed(2));
    const df = Number((d0 - 2 * hf).toFixed(2));
    const alphaRad = ((pressureAngleDeg || 20) * Math.PI) / 180;
    const db = Number((d0 * Math.cos(alphaRad)).toFixed(2));
    const circularPitch = Number((Math.PI * mt).toFixed(2));
    const toothHeight = Number((ha + hf).toFixed(2));

    let tangentialForceN: number | undefined;
    let radialForceN: number | undefined;

    if (typeof torqueNm === 'number' && torqueNm > 0) {
        tangentialForceN = Math.round((2 * torqueNm) / (d0 * 1e-3));
        const tanAlpha = Math.tan(alphaRad);
        const cosBeta = Math.cos(betaRad);
        radialForceN = Math.round((tangentialForceN * tanAlpha) / cosBeta);
    }

    const typeStr = (helixAngleDeg || 0) > 0 ? `Helisel Dişli (β=${helixAngleDeg}°)` : 'Düz Dişli';
    const callout = `${typeStr} m=${mn} z=${z} (d₀=Ø${d0} da=Ø${da}) b=${faceWidth}mm`;

    return {
        pitchDiameter: d0,
        tipDiameter: da,
        rootDiameter: df,
        baseDiameter: db,
        circularPitch,
        toothHeight,
        tangentialForceN,
        radialForceN,
        callout
    };
}

/**
 * Calculate ISO 281 L10h Rolling Bearing Rating Life
 */
export function calculateBearingL10h(
    C_kN: number,
    loadN: number,
    rpm = 1450,
    isRoller = false
): number {
    const C_N = C_kN * 1000;
    const P = Math.max(10, Math.abs(loadN));
    const p = isRoller ? 10 / 3 : 3;
    const speed = Math.max(1, rpm);
    // ISO 281 formula: L10h = (10^6 / (60 * n)) * (C / P)^p
    const l10h = (1e6 / (60 * speed)) * Math.pow(C_N / P, p);
    return Math.round(Math.min(2000000, l10h));
}
