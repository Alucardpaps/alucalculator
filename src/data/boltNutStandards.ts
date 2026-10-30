import { FASTENERS_DB, type Fastener, type FastenerStandardId } from '@/data/fastenersData';

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

    // --- SAE (US J429) & ASTM (Inch Fasteners) ---
    { class: 'Grade 2', standard: 'SAE', tensileStrengthMin: 517, yieldStrengthMin: 393, elongationMin: 18, material: 'Low/Medium Carbon' },
    { class: 'Grade 5', standard: 'SAE', tensileStrengthMin: 827, yieldStrengthMin: 634, elongationMin: 14, material: 'Medium Carbon, Q&T' },
    { class: 'Grade 8', standard: 'SAE', tensileStrengthMin: 1034, yieldStrengthMin: 896, elongationMin: 12, material: 'Medium Carbon Alloy, Q&T' },
    { class: 'A193 B7', standard: 'ASTM', tensileStrengthMin: 860, yieldStrengthMin: 725, elongationMin: 16, material: 'Alloy Steel AISI 4140 Q&T', notes: 'High-Temp Pressure Vessel Bolting' },

    // --- Pipe Fittings & Flanges (NPT / BSPP / BSPT) ---
    { class: 'ASTM A105', standard: 'ASTM', tensileStrengthMin: 485, yieldStrengthMin: 250, elongationMin: 22, material: 'Forged Carbon Steel', notes: 'Piping & Threaded Fittings' },
    { class: 'A182 F316', standard: 'ASTM', tensileStrengthMin: 515, yieldStrengthMin: 205, elongationMin: 30, material: 'Forged Stainless Steel 316', notes: 'Corrosion Resistant Fittings' },
    { class: 'A350 LF2', standard: 'ASTM', tensileStrengthMin: 485, yieldStrengthMin: 250, elongationMin: 22, material: 'Low-Temp Forged Carbon Steel' },
    { class: 'Grade B', standard: 'ASTM', tensileStrengthMin: 415, yieldStrengthMin: 240, elongationMin: 30, material: 'Seamless Pipe ASTM A106/A53' },

    // --- British Whitworth (BS 1083) ---
    { class: 'Grade A', standard: 'BS', tensileStrengthMin: 430, yieldStrengthMin: 250, elongationMin: 17, material: 'Low Carbon Mild Steel' },
    { class: 'Grade R', standard: 'BS', tensileStrengthMin: 700, yieldStrengthMin: 500, elongationMin: 18, material: 'Medium Carbon Steel Q&T' },
    { class: 'Grade T', standard: 'BS', tensileStrengthMin: 850, yieldStrengthMin: 650, elongationMin: 15, material: 'Alloy Steel Q&T' },
    { class: 'Grade V', standard: 'BS', tensileStrengthMin: 1000, yieldStrengthMin: 800, elongationMin: 12, material: 'High Tensile Alloy Steel' },

    // --- Power Screws / Lead Screws & Bronze (DIN 103 / ASME B1.5) ---
    { class: 'A2-70', standard: 'ISO', tensileStrengthMin: 700, yieldStrengthMin: 450, elongationMin: 40, material: 'Austenitic Stainless Steel 304' },
    { class: 'A4-70', standard: 'ISO', tensileStrengthMin: 700, yieldStrengthMin: 450, elongationMin: 40, material: 'Austenitic Stainless Steel 316' },
    { class: 'A2-80', standard: 'ISO', tensileStrengthMin: 800, yieldStrengthMin: 600, elongationMin: 30, material: 'Austenitic Stainless Steel 304, cold worked' },
    { class: 'A4-80', standard: 'ISO', tensileStrengthMin: 800, yieldStrengthMin: 600, elongationMin: 30, material: 'Austenitic Stainless Steel 316, cold worked' },
    { class: 'CuSn7', standard: 'DIN', tensileStrengthMin: 260, yieldStrengthMin: 120, elongationMin: 12, material: 'CuSn7Zn4Pb7-C (RG7 Lead Screw Bronze Nut)' },
    { class: 'CuSn12', standard: 'DIN', tensileStrengthMin: 300, yieldStrengthMin: 150, elongationMin: 8, material: 'CuSn12-C (High-Load Bronze Nut)' },
];

// ============================================
// THREAD TYPES
// ============================================

export interface ThreadStandard {
    type: 'Metric Coarse' | 'Metric Fine' | 'UNC' | 'UNF' | 'UNEF' | 'Trapezoidal' | 'BSW' | 'BSF' | 'ACME' | 'Buttress' | 'Square' | 'Round' | 'Pipe' | string;
    size: string;
    diameter: number; // Nominal d (mm)
    pitch?: number; // mm
    tpi?: number; // Threads per inch
    area_tensile: number; // mm^2 (A_s)
    minorDiameter?: number; // d_3 / d_1 (mm)
    pitchDiameter?: number; // d_2 (mm)
    tapDrill: number; // mm
    threadAngle?: number; // 60, 55, 30, 29, 0, 80 etc.
    tapered?: boolean;
    taperRatio?: string; // e.g. '1:16', '3:25'
    standard?: string; // e.g. 'ISO 261', 'ASME B1.1', etc.
    profileShape?: 'triangular' | 'trapezoidal' | 'round' | 'square' | 'buttress';
}

const THREAD_STANDARDS_BASE: ThreadStandard[] = [
    // --- Metric Coarse (ISO 262) ---
    { type: 'Metric Coarse', size: 'M2', diameter: 2, pitch: 0.4, area_tensile: 2.07, tapDrill: 1.6 },
    { type: 'Metric Coarse', size: 'M2.5', diameter: 2.5, pitch: 0.45, area_tensile: 3.39, tapDrill: 2.05 },
    { type: 'Metric Coarse', size: 'M3', diameter: 3, pitch: 0.5, area_tensile: 5.03, tapDrill: 2.5 },
    { type: 'Metric Coarse', size: 'M4', diameter: 4, pitch: 0.7, area_tensile: 8.78, tapDrill: 3.3 },
    { type: 'Metric Coarse', size: 'M5', diameter: 5, pitch: 0.8, area_tensile: 14.2, tapDrill: 4.2 },
    { type: 'Metric Coarse', size: 'M6', diameter: 6, pitch: 1.0, area_tensile: 20.1, minorDiameter: 4.77, tapDrill: 5.0 },
    { type: 'Metric Coarse', size: 'M8', diameter: 8, pitch: 1.25, area_tensile: 36.6, minorDiameter: 6.47, tapDrill: 6.8 },
    { type: 'Metric Coarse', size: 'M10', diameter: 10, pitch: 1.5, area_tensile: 58.0, minorDiameter: 8.16, tapDrill: 8.5 },
    { type: 'Metric Coarse', size: 'M12', diameter: 12, pitch: 1.75, area_tensile: 84.3, minorDiameter: 9.85, tapDrill: 10.2 },
    { type: 'Metric Coarse', size: 'M14', diameter: 14, pitch: 2.0, area_tensile: 115, tapDrill: 12.0 },
    { type: 'Metric Coarse', size: 'M16', diameter: 16, pitch: 2.0, area_tensile: 157, minorDiameter: 13.55, tapDrill: 14.0 },
    { type: 'Metric Coarse', size: 'M18', diameter: 18, pitch: 2.5, area_tensile: 192, tapDrill: 15.5 },
    { type: 'Metric Coarse', size: 'M20', diameter: 20, pitch: 2.5, area_tensile: 245, minorDiameter: 16.93, tapDrill: 17.5 },
    { type: 'Metric Coarse', size: 'M22', diameter: 22, pitch: 2.5, area_tensile: 303, tapDrill: 19.5 },
    { type: 'Metric Coarse', size: 'M24', diameter: 24, pitch: 3.0, area_tensile: 353, minorDiameter: 20.32, tapDrill: 21.0 },
    { type: 'Metric Coarse', size: 'M27', diameter: 27, pitch: 3.0, area_tensile: 459, tapDrill: 24.0 },
    { type: 'Metric Coarse', size: 'M30', diameter: 30, pitch: 3.5, area_tensile: 561, minorDiameter: 25.71, tapDrill: 26.5 },
    { type: 'Metric Coarse', size: 'M33', diameter: 33, pitch: 3.5, area_tensile: 694, tapDrill: 29.5 },
    { type: 'Metric Coarse', size: 'M36', diameter: 36, pitch: 4.0, area_tensile: 817, tapDrill: 32.0 },
    { type: 'Metric Coarse', size: 'M42', diameter: 42, pitch: 4.5, area_tensile: 1120, tapDrill: 37.5 },
    { type: 'Metric Coarse', size: 'M48', diameter: 48, pitch: 5.0, area_tensile: 1470, tapDrill: 43.0 },

    // --- Metric Fine ---
    { type: 'Metric Fine', size: 'M8x1', diameter: 8, pitch: 1.0, area_tensile: 39.2, tapDrill: 7.0 },
    { type: 'Metric Fine', size: 'M10x1.25', diameter: 10, pitch: 1.25, area_tensile: 61.2, tapDrill: 8.8 },
    { type: 'Metric Fine', size: 'M12x1.25', diameter: 12, pitch: 1.25, area_tensile: 92.1, tapDrill: 10.8 },
    { type: 'Metric Fine', size: 'M12x1.5', diameter: 12, pitch: 1.5, area_tensile: 88.1, tapDrill: 10.5 },
    { type: 'Metric Fine', size: 'M16x1.5', diameter: 16, pitch: 1.5, area_tensile: 167, tapDrill: 14.5 },
    { type: 'Metric Fine', size: 'M20x1.5', diameter: 20, pitch: 1.5, area_tensile: 272, tapDrill: 18.5 },
    { type: 'Metric Fine', size: 'M24x2', diameter: 24, pitch: 2.0, area_tensile: 384, tapDrill: 22.0 },

    // --- UNC (Unified Coarse) ---
    { type: 'UNC', size: '#4-40', diameter: 2.84, tpi: 40, area_tensile: 3.89, tapDrill: 2.35 },
    { type: 'UNC', size: '#6-32', diameter: 3.5, tpi: 32, area_tensile: 5.86, tapDrill: 2.85 },
    { type: 'UNC', size: '#8-32', diameter: 4.16, tpi: 32, area_tensile: 9.03, tapDrill: 3.5 },
    { type: 'UNC', size: '#10-24', diameter: 4.82, tpi: 24, area_tensile: 11.3, tapDrill: 3.9 },
    { type: 'UNC', size: '1/4-20', diameter: 6.35, tpi: 20, area_tensile: 20.5, tapDrill: 5.1 },
    { type: 'UNC', size: '5/16-18', diameter: 7.93, tpi: 18, area_tensile: 33.8, tapDrill: 6.6 },
    { type: 'UNC', size: '3/8-16', diameter: 9.53, tpi: 16, area_tensile: 50.1, tapDrill: 8.0 },
    { type: 'UNC', size: '1/2-13', diameter: 12.7, tpi: 13, area_tensile: 91.5, tapDrill: 10.8 },
    { type: 'UNC', size: '5/8-11', diameter: 15.88, tpi: 11, area_tensile: 145.8, tapDrill: 13.5 },
    { type: 'UNC', size: '3/4-10', diameter: 19.05, tpi: 10, area_tensile: 215.5, tapDrill: 16.5 },
    { type: 'UNC', size: '7/8-9', diameter: 22.22, tpi: 9, area_tensile: 298, tapDrill: 19.5 },
    { type: 'UNC', size: '1-8', diameter: 25.4, tpi: 8, area_tensile: 391, tapDrill: 22.25 },
    { type: 'UNC', size: '1 1/4-7', diameter: 31.75, tpi: 7, area_tensile: 625, tapDrill: 28.0 },

    // --- UNF (Unified Fine) ---
    { type: 'UNF', size: '#10-32', diameter: 4.82, tpi: 32, area_tensile: 12.9, tapDrill: 4.1 },
    { type: 'UNF', size: '1/4-28', diameter: 6.35, tpi: 28, area_tensile: 23.2, tapDrill: 5.5 },
    { type: 'UNF', size: '5/16-24', diameter: 7.93, tpi: 24, area_tensile: 37.4, tapDrill: 6.9 },
    { type: 'UNF', size: '3/8-24', diameter: 9.53, tpi: 24, area_tensile: 56.7, tapDrill: 8.5 },
    { type: 'UNF', size: '1/2-20', diameter: 12.7, tpi: 20, area_tensile: 103.1, tapDrill: 11.5 },
    { type: 'UNF', size: '5/8-18', diameter: 15.88, tpi: 18, area_tensile: 165, tapDrill: 14.5 },
    { type: 'UNF', size: '3/4-16', diameter: 19.05, tpi: 16, area_tensile: 241, tapDrill: 17.5 },
    { type: 'UNF', size: '1-12', diameter: 25.4, tpi: 12, area_tensile: 434, tapDrill: 23.25 },

    // --- Trapezoidal (ISO 2901) ---
    { type: 'Trapezoidal', size: 'TR10x2', diameter: 10, pitch: 2.0, area_tensile: 45, tapDrill: 8.0 },
    { type: 'Trapezoidal', size: 'TR12x3', diameter: 12, pitch: 3.0, area_tensile: 68.5, tapDrill: 9.0 },
    { type: 'Trapezoidal', size: 'TR16x4', diameter: 16, pitch: 4.0, area_tensile: 125.1, tapDrill: 12.0 },
    { type: 'Trapezoidal', size: 'TR20x4', diameter: 20, pitch: 4.0, area_tensile: 211.5, tapDrill: 16.0 },
    { type: 'Trapezoidal', size: 'TR24x5', diameter: 24, pitch: 5.0, area_tensile: 298, tapDrill: 19.0 },
    { type: 'Trapezoidal', size: 'TR30x6', diameter: 30, pitch: 6.0, area_tensile: 480, tapDrill: 24.0 },
    { type: 'Trapezoidal', size: 'TR36x6', diameter: 36, pitch: 6.0, area_tensile: 720, tapDrill: 30.0 },

    // --- Pipe Threads (BSP/G, NPT) ---
    { type: 'Pipe', size: 'G 1/8', diameter: 9.728, tpi: 28, area_tensile: 55, tapDrill: 8.6 },
    { type: 'Pipe', size: 'G 1/4', diameter: 13.157, tpi: 19, area_tensile: 104, tapDrill: 11.8 },
    { type: 'Pipe', size: 'G 3/8', diameter: 16.662, tpi: 19, area_tensile: 172, tapDrill: 15.2 },
    { type: 'Pipe', size: 'G 1/2', diameter: 20.955, tpi: 14, area_tensile: 245, tapDrill: 19.0 },
    { type: 'Pipe', size: 'G 3/4', diameter: 26.441, tpi: 14, area_tensile: 405, tapDrill: 24.5 },
    { type: 'Pipe', size: 'G 1', diameter: 33.249, tpi: 11, area_tensile: 640, tapDrill: 30.5 },
    { type: 'Pipe', size: 'G 1 1/4', diameter: 41.910, tpi: 11, area_tensile: 1050, tapDrill: 39.5 },
    { type: 'Pipe', size: 'G 1 1/2', diameter: 47.803, tpi: 11, area_tensile: 1400, tapDrill: 45.0 },
    { type: 'Pipe', size: 'G 2', diameter: 59.614, tpi: 11, area_tensile: 2250, tapDrill: 57.0 },

    { type: 'Pipe', size: 'NPT 1/8', diameter: 10.287, tpi: 27, area_tensile: 58, tapDrill: 8.5 },
    { type: 'Pipe', size: 'NPT 1/4', diameter: 13.716, tpi: 18, area_tensile: 108, tapDrill: 11.0 },
    { type: 'Pipe', size: 'NPT 3/8', diameter: 17.145, tpi: 18, area_tensile: 180, tapDrill: 14.5 },
    { type: 'Pipe', size: 'NPT 1/2', diameter: 21.223, tpi: 14, area_tensile: 250, tapDrill: 17.8 },
    { type: 'Pipe', size: 'NPT 3/4', diameter: 26.67, tpi: 14, area_tensile: 410, tapDrill: 23.0 },
    { type: 'Pipe', size: 'NPT 1', diameter: 33.401, tpi: 11.5, area_tensile: 645, tapDrill: 29.0 },
    { type: 'Pipe', size: 'NPT 1 1/2', diameter: 48.260, tpi: 11.5, area_tensile: 1420, tapDrill: 44.0 },
    { type: 'Pipe', size: 'NPT 2', diameter: 60.325, tpi: 11.5, area_tensile: 2280, tapDrill: 56.0 },
];

const TORQUE_TYPE_FROM_GEOMETRY: Record<FastenerStandardId, ThreadStandard['type']> = {
    'ISO Metric': 'Metric Coarse',
    'ISO Metric Fine': 'Metric Fine',
    UNC: 'UNC',
    UNF: 'UNF',
    UNEF: 'UNEF',
    BSW: 'BSW',
    BSF: 'BSF',
    'BSPP (G)': 'BSPP (G)',
    'BSPT (R)': 'BSPT (R)',
    NPT: 'NPT',
    NPTF: 'NPTF',
    NPSM: 'NPSM',
    'JIC 37°': 'JIC 37°',
    ORFS: 'ORFS',
    'Trapezoidal (Tr)': 'Trapezoidal',
    ACME: 'ACME',
    'Buttress (S)': 'Buttress',
    Square: 'Square',
    'Round (Rd)': 'Round',
    'Panzergewinde (Pg)': 'Panzergewinde (Pg)',
    'Edison (E)': 'Edison (E)',
    'Valve (Vg)': 'Valve (Vg)',
    'Gas Cylinder (W)': 'Gas Cylinder (W)',
};

const IMPERIAL_GEOMETRY = new Set<FastenerStandardId>([
    'UNC', 'UNF', 'UNEF', 'BSW', 'BSF', 'BSPP (G)', 'BSPT (R)', 'NPT', 'NPTF', 'NPSM', 'JIC 37°', 'ORFS', 'ACME',
]);

function fastenerToThreadStandard(f: Fastener): ThreadStandard {
    const imperial = IMPERIAL_GEOMETRY.has(f.standard);
    const isWhitworth = ['BSW', 'BSF', 'BSPP (G)', 'BSPT (R)', 'Gas Cylinder (W)'].includes(f.standard);
    const isTrapezoidal = f.standard === 'Trapezoidal (Tr)';
    const isAcme = f.standard === 'ACME';
    const isButtress = f.standard === 'Buttress (S)';
    const isSquare = f.standard === 'Square';
    const isRound = f.standard === 'Round (Rd)' || f.standard === 'Edison (E)';
    const isPg = f.standard === 'Panzergewinde (Pg)';
    const isTapered = ['BSPT (R)', 'NPT', 'NPTF', 'Gas Cylinder (W)'].includes(f.standard);

    let angle = 60;
    if (isWhitworth) angle = 55;
    else if (isTrapezoidal) angle = 30;
    else if (isAcme) angle = 29;
    else if (isButtress) angle = 45;
    else if (isSquare) angle = 0;
    else if (isRound) angle = f.standard === 'Edison (E)' ? 0 : 30;
    else if (isPg) angle = 80;

    let shape: 'triangular' | 'trapezoidal' | 'round' | 'square' | 'buttress' = 'triangular';
    if (isTrapezoidal || isAcme) shape = 'trapezoidal';
    else if (isButtress) shape = 'buttress';
    else if (isSquare) shape = 'square';
    else if (isRound) shape = 'round';

    return {
        type: TORQUE_TYPE_FROM_GEOMETRY[f.standard],
        size: f.size,
        diameter: f.majorDia,
        pitch: imperial ? undefined : f.pitch,
        tpi: imperial ? f.pitch : undefined,
        area_tensile: f.stressArea,
        minorDiameter: f.minorDia,
        pitchDiameter: f.pitchDia,
        tapDrill: f.tapDrill,
        threadAngle: angle,
        tapered: isTapered,
        taperRatio: isTapered ? (f.standard === 'Gas Cylinder (W)' ? '3:25' : '1:16') : undefined,
        standard: f.standard,
        profileShape: shape,
    };
}

const BASE_KEYS = new Set(THREAD_STANDARDS_BASE.map((t) => `${t.type}|${t.size}`));

export const THREAD_STANDARDS: ThreadStandard[] = [
    ...THREAD_STANDARDS_BASE,
    ...FASTENERS_DB
        .map(fastenerToThreadStandard)
        .filter((t) => !BASE_KEYS.has(`${t.type}|${t.size}`)),
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
    // ISO 4014 / ISO 4017 hex head (s, k nominal; e min). Matches HEX_BOLT_DATA and ISO 4032 nuts.
    { size: 'M2', s: 4, k: 1.4, e: 4.32 },
    { size: 'M2.5', s: 5, k: 1.7, e: 5.45 },
    { size: 'M3', s: 5.5, k: 2, e: 6.01 },
    { size: 'M4', s: 7, k: 2.8, e: 7.66 },
    { size: 'M5', s: 8, k: 3.5, e: 8.79 },
    { size: 'M6', s: 10, k: 4, e: 11.05 },
    { size: 'M8', s: 13, k: 5.3, e: 14.38 },
    { size: 'M10', s: 16, k: 6.4, e: 17.77 },
    { size: 'M12', s: 18, k: 7.5, e: 20.03 },
    { size: 'M14', s: 21, k: 8.8, e: 23.36 },
    { size: 'M16', s: 24, k: 10, e: 26.75 },
    { size: 'M18', s: 27, k: 11.5, e: 30.14 },
    { size: 'M20', s: 30, k: 12.5, e: 33.53 },
    { size: 'M22', s: 34, k: 14, e: 37.72 },
    { size: 'M24', s: 36, k: 15, e: 39.98 },
    { size: 'M27', s: 41, k: 17, e: 45.2 },
    { size: 'M30', s: 46, k: 18.7, e: 50.85 },
    { size: 'M33', s: 50, k: 21, e: 55.37 },
    { size: 'M36', s: 55, k: 22.5, e: 60.79 },
    { size: 'M42', s: 65, k: 26, e: 71.3 },
    { size: 'M48', s: 75, k: 30, e: 82.6 },
];

function metricSizeKey(size: string): string | null {
    const m = size.match(/^M(\d+(?:\.\d+)?)/i);
    if (!m) return null;
    const n = parseFloat(m[1]);
    return `M${Number.isInteger(n) ? n : n}`;
}

export function getFastenerGeometry(size: string, overrideDiameter?: number): FastenerGeometry {
    const found = HEX_BOLT_GEOMETRY.find(g => g.size === size);
    if (found) return found;

    const metricKey = metricSizeKey(size);
    if (metricKey) {
        const byPrefix = HEX_BOLT_GEOMETRY.find(g => g.size === metricKey);
        if (byPrefix) return { ...byPrefix, size };
    }
    
    // Heuristic scaling if not in DB
    let d = overrideDiameter;
    if (!d) {
        const match = size.match(/[\d.]+/);
        d = match ? parseFloat(match[0]) : 10;
        
        if (size.includes('1/2')) d = 12.7;
        else if (size.includes('1/4')) d = 6.35;
        else if (size.includes('3/8')) d = 9.53;
        else if (size.includes('5/8')) d = 15.88;
        else if (size.includes('3/4')) d = 19.05;
        
        if (size.includes('G ') || size.includes('NPT')) d = d * 25.4 + 10; 
    }
    
    return {
        size,
        s: Math.round(d * 1.6 * 10) / 10,
        k: Math.round(d * 0.7 * 10) / 10,
        e: Math.round(d * 1.1547 * 1.6 * 100) / 100,
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

export const BOLT_HEAD_DIMENSIONS: BoltHeadDimension[] = HEX_BOLT_GEOMETRY.map((g) => {
    const row = THREAD_STANDARDS.find((t) => t.type === 'Metric Coarse' && t.size === g.size);
    return {
        type: 'Hex Bolt',
        standard: 'ISO 4017',
        size: g.size,
        pitch: row?.pitch ?? 0,
        headWidth: g.s,
        headHeight: g.k,
    };
});

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
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M2', pitch: 0.4, width: 4, height: 1.6, widthCorners: 4.32 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M2.5', pitch: 0.45, width: 5, height: 2.0, widthCorners: 5.45 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M3', pitch: 0.5, width: 5.5, height: 2.4, widthCorners: 6.01 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M4', pitch: 0.7, width: 7, height: 3.2, widthCorners: 7.66 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M5', pitch: 0.8, width: 8, height: 4.7, widthCorners: 8.79 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M6', pitch: 1.0, width: 10, height: 5.2, widthCorners: 11.05 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M8', pitch: 1.25, width: 13, height: 6.8, widthCorners: 14.38 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M10', pitch: 1.5, width: 16, height: 8.4, widthCorners: 17.77 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M12', pitch: 1.75, width: 18, height: 10.8, widthCorners: 20.03 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M14', pitch: 2.0, width: 21, height: 12.8, widthCorners: 23.36 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M16', pitch: 2.0, width: 24, height: 14.8, widthCorners: 26.75 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M18', pitch: 2.5, width: 27, height: 15.8, widthCorners: 29.56 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M20', pitch: 2.5, width: 30, height: 18, widthCorners: 33.53 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M22', pitch: 2.5, width: 34, height: 19.4, widthCorners: 37.72 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M24', pitch: 3.0, width: 36, height: 21.5, widthCorners: 39.98 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M27', pitch: 3.0, width: 41, height: 23.8, widthCorners: 45.20 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M30', pitch: 3.5, width: 46, height: 25.6, widthCorners: 51.28 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M33', pitch: 3.5, width: 50, height: 28.7, widthCorners: 55.37 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M36', pitch: 4.0, width: 55, height: 31, widthCorners: 60.79 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M42', pitch: 4.5, width: 65, height: 34, widthCorners: 72.61 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M48', pitch: 5.0, width: 75, height: 38, widthCorners: 82.60 },
];

export function getNutDimension(size: string, pitch?: number, threadStandard?: string): NutDimension {
    const found = NUT_DIMENSIONS.find((n) => n.size === size);
    if (found && (!threadStandard || threadStandard.toLowerCase().includes('metric') || threadStandard.toLowerCase().includes('iso'))) return found;
    const metricKey = metricSizeKey(size);
    if (metricKey && (!threadStandard || threadStandard.toLowerCase().includes('metric') || threadStandard.toLowerCase().includes('iso'))) {
        const byPrefix = NUT_DIMENSIONS.find((n) => n.size === metricKey);
        if (byPrefix) return { ...byPrefix, size, pitch: pitch ?? byPrefix.pitch };
    }
    const geom = getFastenerGeometry(size);
    const sizeUpper = (size || '').toUpperCase();
    const stdLower = (threadStandard || '').toLowerCase();

    let nutStandard = 'ISO 4032 (estimated)';
    if (stdLower.includes('unc') || stdLower.includes('unf') || stdLower.includes('unef') || sizeUpper.includes('UNC') || sizeUpper.includes('UNF') || sizeUpper.includes('UNEF')) {
        nutStandard = 'ASME B18.2.2';
    } else if (stdLower.includes('npt') || sizeUpper.includes('NPT')) {
        nutStandard = 'ASME B16.11 (Coupling / Port)';
    } else if (stdLower.includes('bspp') || sizeUpper.startsWith('G ')) {
        nutStandard = 'ISO 228-2 (Locknut)';
    } else if (stdLower.includes('bspt') || sizeUpper.startsWith('R ')) {
        nutStandard = 'ISO 7-1 (Rc Port)';
    } else if (stdLower.includes('bsw') || stdLower.includes('bsf') || sizeUpper.includes('BSW') || sizeUpper.includes('BSF')) {
        nutStandard = 'BS 1083 Nut';
    } else if (stdLower.includes('acme') || sizeUpper.includes('ACME')) {
        nutStandard = 'ASME B1.5 Acme Nut';
    } else if (stdLower.includes('trapezoidal') || sizeUpper.startsWith('TR')) {
        nutStandard = 'DIN 103-9 (Tr Nut)';
    }

    return {
        type: 'Hex Nut',
        standard: nutStandard,
        size,
        pitch: pitch ?? 0,
        width: geom.s,
        height: Math.round(geom.k * 1.44 * 10) / 10,
        widthCorners: geom.e,
    };
}

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
