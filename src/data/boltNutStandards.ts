/**
 * AluCalculator V2 - Global Bolt & Nut Standards Database
 * 
 * Covers:
 * - ISO 898-1 (Metric property classes)
 * - ISO 898-2 (Nuts)
 * - DIN 931/933 (Hex bolts)
 * - ASTM A325/A490 (Structural bolts)
 * - JIS B1051 (Japanese fasteners)
 * - Thread Geometry (ISO, UNC, UNF, TR)
 * 
 * ALL VALUES IN SI UNITS (mm, MPa, N, kNm)
 */

// ============================================
// BOLT PROPERTY CLASSES
// ============================================

export interface BoltPropertyClass {
    class: string;
    standard: 'ISO' | 'SAE' | 'ASTM' | 'JIS' | 'DIN' | 'BS' | 'GOST';
    tensileStrengthMin: number; // MPa
    yieldStrengthMin: number; // MPa
    elongationMin: number; // %
    hardnessHRC?: [number, number];
    hardnessHB?: [number, number];
    material: string;
    notes?: string;
    // Structural Capacities (per AISC / Bölüm J)
    nominalTensionStress?: number; // MPa (F_nt)
    nominalShearStress_N?: number; // MPa (F_nv Threads Included)
    nominalShearStress_X?: number; // MPa (F_nv Threads Excluded)
}

export const BOLT_PROPERTY_CLASSES: BoltPropertyClass[] = [
    // --- ISO 898-1 (Metric) ---
    { class: '4.6', standard: 'ISO', tensileStrengthMin: 400, yieldStrengthMin: 240, elongationMin: 22, material: 'Low Carbon Steel' },
    { class: '4.8', standard: 'ISO', tensileStrengthMin: 420, yieldStrengthMin: 340, elongationMin: 14, material: 'Low Carbon Steel' },
    { class: '5.6', standard: 'ISO', tensileStrengthMin: 500, yieldStrengthMin: 300, elongationMin: 20, material: 'Medium Carbon Steel' },
    { class: '5.8', standard: 'ISO', tensileStrengthMin: 520, yieldStrengthMin: 420, elongationMin: 10, material: 'Medium Carbon Steel' },
    { class: '8.8', standard: 'ISO', tensileStrengthMin: 800, yieldStrengthMin: 640, elongationMin: 12, material: 'Medium Carbon Steel, Q&T', nominalTensionStress: 620, nominalShearStress_N: 372, nominalShearStress_X: 469 },
    { class: '10.9', standard: 'ISO', tensileStrengthMin: 1040, yieldStrengthMin: 940, elongationMin: 9, material: 'Alloy Steel, Q&T', nominalTensionStress: 780, nominalShearStress_N: 469, nominalShearStress_X: 579 },
    { class: '12.9', standard: 'ISO', tensileStrengthMin: 1220, yieldStrengthMin: 1100, elongationMin: 8, material: 'Alloy Steel, Q&T', nominalTensionStress: 900, nominalShearStress_N: 540, nominalShearStress_X: 630 },

    // --- ASTM (Structural) ---
    { class: 'A325', standard: 'ASTM', tensileStrengthMin: 830, yieldStrengthMin: 660, elongationMin: 14, material: 'Medium Carbon Steel, Q&T', notes: 'High Strength Structural', nominalTensionStress: 620, nominalShearStress_N: 372, nominalShearStress_X: 469 },
    { class: 'A490', standard: 'ASTM', tensileStrengthMin: 1035, yieldStrengthMin: 895, elongationMin: 14, material: 'Alloy Steel, Q&T', notes: 'Heavy Structural', nominalTensionStress: 780, nominalShearStress_N: 469, nominalShearStress_X: 579 },
    { class: 'A307', standard: 'ASTM', tensileStrengthMin: 414, yieldStrengthMin: 0, elongationMin: 18, material: 'Low Carbon Steel', notes: 'Standard Bolting', nominalTensionStress: 310, nominalShearStress_N: 186, nominalShearStress_X: 186 },

    // --- SAE (US J429) ---
    { class: 'Grade 2', standard: 'SAE', tensileStrengthMin: 517, yieldStrengthMin: 393, elongationMin: 18, material: 'Low/Medium Carbon' },
    { class: 'Grade 5', standard: 'SAE', tensileStrengthMin: 827, yieldStrengthMin: 634, elongationMin: 14, material: 'Medium Carbon, Q&T' },
    { class: 'Grade 8', standard: 'SAE', tensileStrengthMin: 1034, yieldStrengthMin: 896, elongationMin: 12, material: 'Medium Carbon Alloy, Q&T' },
];

// ============================================
// THREAD TYPES
// ============================================

export interface ThreadStandard {
    type: 'Metric Coarse' | 'Metric Fine' | 'UNC' | 'UNF' | 'Trapezoidal' | 'BSW' | 'Pipe';
    size: string;
    diameter: number; // Nominal d (mm)
    pitch?: number; // mm
    tpi?: number; // Threads per inch
    area_tensile: number; // mm^2 (A_s)
    minorDiameter?: number; // d_3 (mm)
    tapDrill: number; // mm
}

export const THREAD_STANDARDS: ThreadStandard[] = [
    // --- Metric Coarse (ISO 262) ---
    { type: 'Metric Coarse', size: 'M3', diameter: 3, pitch: 0.5, area_tensile: 5.03, tapDrill: 2.5 },
    { type: 'Metric Coarse', size: 'M4', diameter: 4, pitch: 0.7, area_tensile: 8.78, tapDrill: 3.3 },
    { type: 'Metric Coarse', size: 'M5', diameter: 5, pitch: 0.8, area_tensile: 14.2, tapDrill: 4.2 },
    { type: 'Metric Coarse', size: 'M6', diameter: 6, pitch: 1.0, area_tensile: 20.1, minorDiameter: 4.77, tapDrill: 5.0 },
    { type: 'Metric Coarse', size: 'M8', diameter: 8, pitch: 1.25, area_tensile: 36.6, minorDiameter: 6.47, tapDrill: 6.8 },
    { type: 'Metric Coarse', size: 'M10', diameter: 10, pitch: 1.5, area_tensile: 58.0, minorDiameter: 8.16, tapDrill: 8.5 },
    { type: 'Metric Coarse', size: 'M12', diameter: 12, pitch: 1.75, area_tensile: 84.3, minorDiameter: 9.85, tapDrill: 10.2 },
    { type: 'Metric Coarse', size: 'M16', diameter: 16, pitch: 2.0, area_tensile: 157, minorDiameter: 13.55, tapDrill: 14.0 },
    { type: 'Metric Coarse', size: 'M20', diameter: 20, pitch: 2.5, area_tensile: 245, minorDiameter: 16.93, tapDrill: 17.5 },
    { type: 'Metric Coarse', size: 'M24', diameter: 24, pitch: 3.0, area_tensile: 353, minorDiameter: 20.32, tapDrill: 21.0 },
    { type: 'Metric Coarse', size: 'M30', diameter: 30, pitch: 3.5, area_tensile: 561, minorDiameter: 25.71, tapDrill: 26.5 },

    // --- Metric Fine ---
    { type: 'Metric Fine', size: 'M10x1.25', diameter: 10, pitch: 1.25, area_tensile: 61.2, tapDrill: 8.8 },
    { type: 'Metric Fine', size: 'M12x1.25', diameter: 12, pitch: 1.25, area_tensile: 92.1, tapDrill: 10.8 },
    { type: 'Metric Fine', size: 'M12x1.5', diameter: 12, pitch: 1.5, area_tensile: 88.1, tapDrill: 10.5 },

    // --- UNC (Unified Coarse) ---
    { type: 'UNC', size: '1/4-20', diameter: 6.35, tpi: 20, area_tensile: 20.5, tapDrill: 5.1 },
    { type: 'UNC', size: '3/8-16', diameter: 9.53, tpi: 16, area_tensile: 50.1, tapDrill: 8.0 },
    { type: 'UNC', size: '1/2-13', diameter: 12.7, tpi: 13, area_tensile: 91.5, tapDrill: 10.8 },
    { type: 'UNC', size: '5/8-11', diameter: 15.88, tpi: 11, area_tensile: 145.8, tapDrill: 13.5 },
    { type: 'UNC', size: '3/4-10', diameter: 19.05, tpi: 10, area_tensile: 215.5, tapDrill: 16.5 },

    // --- UNF (Unified Fine) ---
    { type: 'UNF', size: '1/4-28', diameter: 6.35, tpi: 28, area_tensile: 23.2, tapDrill: 5.5 },
    { type: 'UNF', size: '3/8-24', diameter: 9.53, tpi: 24, area_tensile: 56.7, tapDrill: 8.5 },
    { type: 'UNF', size: '1/2-20', diameter: 12.7, tpi: 20, area_tensile: 103.1, tapDrill: 11.5 },

    // --- Trapezoidal (ISO 2901) ---
    { type: 'Trapezoidal', size: 'TR12x3', diameter: 12, pitch: 3.0, area_tensile: 68.5, tapDrill: 9.0 },
    { type: 'Trapezoidal', size: 'TR16x4', diameter: 16, pitch: 4.0, area_tensile: 125.1, tapDrill: 12.0 },
    { type: 'Trapezoidal', size: 'TR20x4', diameter: 20, pitch: 4.0, area_tensile: 211.5, tapDrill: 16.0 },
];

// ============================================
// NUT PROPERTY CLASSES
// ============================================

export interface NutPropertyClass {
    class: string;
    standard: 'ISO' | 'SAE' | 'ASTM' | 'JIS' | 'DIN' | 'GOST';
    proofLoadStress: number; // MPa
    matingBoltClass: string[];
}

export const NUT_PROPERTY_CLASSES: NutPropertyClass[] = [
    { class: '8', standard: 'ISO', proofLoadStress: 800, matingBoltClass: ['8.8'] },
    { class: '10', standard: 'ISO', proofLoadStress: 1040, matingBoltClass: ['10.9'] },
    { class: '12', standard: 'ISO', proofLoadStress: 1200, matingBoltClass: ['12.9'] },
    { class: 'DH', standard: 'ASTM', proofLoadStress: 862, matingBoltClass: ['A325'] },
    { class: 'Heavy DH', standard: 'ASTM', proofLoadStress: 1035, matingBoltClass: ['A490'] },
];

// ============================================
// GEOMETRY DATA
// ============================================

export interface FastenerGeometry {
    size: string;
    s: number; // Across Flats
    k: number; // Head Height
    e: number; // Across Corners
}

export const HEX_BOLT_GEOMETRY: FastenerGeometry[] = [
    { size: 'M3', s: 5.5, k: 2, e: 6.01 },
    { size: 'M4', s: 7, k: 2.8, e: 7.66 },
    { size: 'M5', s: 8, k: 3.5, e: 8.79 },
    { size: 'M6', s: 10, k: 4, e: 11.05 },
    { size: 'M8', s: 13, k: 5.3, e: 14.38 },
    { size: 'M10', s: 16, k: 6.4, e: 17.77 },
    { size: 'M12', s: 18, k: 7.5, e: 20.03 },
    { size: 'M16', s: 24, k: 10, e: 26.75 },
    { size: 'M20', s: 30, k: 12.5, e: 33.53 },
    { size: 'M24', s: 36, k: 15, e: 39.98 },
    { size: 'M30', s: 46, k: 18.7, e: 51.28 },
];

export function getFastenerGeometry(size: string): FastenerGeometry {
    const found = HEX_BOLT_GEOMETRY.find(g => g.size === size);
    if (found) return found;
    
    // Heuristic scaling if not in DB
    const dStr = size.replace(/[^\d.]/g, '');
    const d = parseFloat(dStr) || 10;
    return {
        size,
        s: d * 1.6,
        k: d * 0.7,
        e: d * 1.8
    };
}

/** 
 * LEGACY EXPORTS FOR BACKWARD COMPATIBILITY 
 * These match the expectations of existing calculators (e.g. bolt-stress.ts)
 */

export interface BoltHeadDimension {
    type: string;
    standard: string;
    size: string;
    pitch: number;
    headWidth: number; 
    headHeight: number;
}

export const BOLT_HEAD_DIMENSIONS: BoltHeadDimension[] = [
    { type: 'Hex Bolt', standard: 'ISO 4017', size: 'M3', pitch: 0.5, headWidth: 5.5, headHeight: 2 },
    { type: 'Hex Bolt', standard: 'ISO 4017', size: 'M4', pitch: 0.7, headWidth: 7, headHeight: 2.8 },
    { type: 'Hex Bolt', standard: 'ISO 4017', size: 'M5', pitch: 0.8, headWidth: 8, headHeight: 3.5 },
    { type: 'Hex Bolt', standard: 'ISO 4017', size: 'M6', pitch: 1.0, headWidth: 10, headHeight: 4 },
    { type: 'Hex Bolt', standard: 'ISO 4017', size: 'M8', pitch: 1.25, headWidth: 13, headHeight: 5.3 },
    { type: 'Hex Bolt', standard: 'ISO 4017', size: 'M10', pitch: 1.5, headWidth: 16, headHeight: 6.4 },
    { type: 'Hex Bolt', standard: 'ISO 4017', size: 'M12', pitch: 1.75, headWidth: 18, headHeight: 7.5 },
    { type: 'Hex Bolt', standard: 'ISO 4017', size: 'M16', pitch: 2.0, headWidth: 24, headHeight: 10 },
    { type: 'Hex Bolt', standard: 'ISO 4017', size: 'M20', pitch: 2.5, headWidth: 30, headHeight: 12.5 },
    { type: 'Hex Bolt', standard: 'ISO 4017', size: 'M24', pitch: 3.0, headWidth: 36, headHeight: 15 },
    { type: 'Hex Bolt', standard: 'ISO 4017', size: 'M30', pitch: 3.5, headWidth: 46, headHeight: 18.7 },
];

export interface NutDimension {
    type: string;
    standard: string;
    size: string;
    pitch: number;
    width: number; // Across flats (s)
    height: number; // m
    widthCorners?: number; // e
}

export const NUT_DIMENSIONS: NutDimension[] = [
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M6', pitch: 1.0, width: 10, height: 5.2 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M8', pitch: 1.25, width: 13, height: 6.8 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M10', pitch: 1.5, width: 16, height: 8.4 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M12', pitch: 1.75, width: 18, height: 10.8 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M16', pitch: 2.0, width: 24, height: 14.8 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M20', pitch: 2.5, width: 30, height: 18 },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getBoltClass(classStr: string): BoltPropertyClass | undefined {
    return BOLT_PROPERTY_CLASSES.find(b => b.class === classStr);
}

export function getCompatibleNutClass(boltClass: string): NutPropertyClass[] {
    return NUT_PROPERTY_CLASSES.filter(n =>
        n.matingBoltClass.includes(boltClass)
    );
}

export function getTorqueSpec(size: string, boltClass: string) {
    // Legacy support shim
    return undefined; 
}
