/**
 * AluCalculator V2 - Global Bolt & Nut Standards Database
 * 
 * Covers:
 * - ISO 898-1 (Metric property classes)
 * - DIN 931/933 (Hex bolts)
 * - ASTM A325/A490 (Structural bolts)
 * - JIS B1051 (Japanese fasteners)
 * - BS 1768 (British high tensile)
 * - GOST 7798/7805 (Russian standards)
 * 
 * ALL VALUES IN SI UNITS (mm, MPa, N)
 */

// ============================================
// BOLT PROPERTY CLASSES (ISO 898-1)
// ============================================

export interface BoltPropertyClass {
    class: string;
    standard: 'ISO' | 'SAE' | 'ASTM' | 'JIS' | 'DIN' | 'BS' | 'GOST';
    tensileStrengthMin: number; // MPa
    yieldStrengthMin: number; // MPa (Rp0.2 or ReL)
    elongationMin: number; // %
    hardnessHRC?: [number, number]; // [min, max]
    hardnessHB?: [number, number];
    material: string;
    surfaceTreatment?: string[];
    notes?: string;
}

export const BOLT_PROPERTY_CLASSES: BoltPropertyClass[] = [
    // --- ISO 898-1 (Metric) ---
    { class: '4.6', standard: 'ISO', tensileStrengthMin: 400, yieldStrengthMin: 240, elongationMin: 22, hardnessHB: [114, 209], material: 'Low/Medium Carbon Steel' },
    { class: '4.8', standard: 'ISO', tensileStrengthMin: 420, yieldStrengthMin: 340, elongationMin: 14, hardnessHB: [124, 209], material: 'Low/Medium Carbon Steel' },
    { class: '5.6', standard: 'ISO', tensileStrengthMin: 500, yieldStrengthMin: 300, elongationMin: 20, hardnessHB: [147, 209], material: 'Low/Medium Carbon Steel' },
    { class: '5.8', standard: 'ISO', tensileStrengthMin: 520, yieldStrengthMin: 420, elongationMin: 10, hardnessHB: [152, 238], material: 'Low/Medium Carbon Steel' },
    { class: '6.8', standard: 'ISO', tensileStrengthMin: 600, yieldStrengthMin: 480, elongationMin: 8, hardnessHB: [181, 238], material: 'Low/Medium Carbon Steel' },
    { class: '8.8', standard: 'ISO', tensileStrengthMin: 800, yieldStrengthMin: 640, elongationMin: 12, hardnessHRC: [22, 32], material: 'Medium Carbon Steel, Q&T', surfaceTreatment: ['Zinc', 'Dacromet', 'Geomet'] },
    { class: '9.8', standard: 'ISO', tensileStrengthMin: 900, yieldStrengthMin: 720, elongationMin: 10, hardnessHRC: [28, 34], material: 'Medium Carbon Steel, Q&T' },
    { class: '10.9', standard: 'ISO', tensileStrengthMin: 1040, yieldStrengthMin: 940, elongationMin: 9, hardnessHRC: [32, 39], material: 'Alloy Steel, Q&T', surfaceTreatment: ['Zinc', 'Phosphate', 'Dacromet'] },
    { class: '12.9', standard: 'ISO', tensileStrengthMin: 1220, yieldStrengthMin: 1100, elongationMin: 8, hardnessHRC: [39, 44], material: 'Alloy Steel, Q&T', surfaceTreatment: ['Zinc', 'Black Oxide'] },

    // --- SAE (US Imperial) ---
    { class: 'Grade 2', standard: 'SAE', tensileStrengthMin: 517, yieldStrengthMin: 393, elongationMin: 18, hardnessHB: [100, 207], material: 'Low/Medium Carbon Steel' },
    { class: 'Grade 5', standard: 'SAE', tensileStrengthMin: 827, yieldStrengthMin: 634, elongationMin: 14, hardnessHRC: [25, 34], material: 'Medium Carbon Steel, Q&T' },
    { class: 'Grade 8', standard: 'SAE', tensileStrengthMin: 1034, yieldStrengthMin: 896, elongationMin: 12, hardnessHRC: [33, 39], material: 'Medium Carbon Alloy Steel, Q&T' },

    // --- ASTM A325/A490 (Structural) ---
    { class: 'A325 Type 1', standard: 'ASTM', tensileStrengthMin: 830, yieldStrengthMin: 660, elongationMin: 14, hardnessHRC: [25, 34], material: 'Medium Carbon Steel, Q&T', notes: '1/2" to 1-1/2" dia' },
    { class: 'A325 Type 3', standard: 'ASTM', tensileStrengthMin: 830, yieldStrengthMin: 660, elongationMin: 14, hardnessHRC: [25, 34], material: 'Weathering Steel', notes: 'Atmospheric corrosion resistant' },
    { class: 'A490 Type 1', standard: 'ASTM', tensileStrengthMin: 1035, yieldStrengthMin: 895, elongationMin: 14, hardnessHRC: [33, 38], material: 'Alloy Steel, Q&T', notes: 'No galvanizing allowed' },
    { class: 'A490 Type 3', standard: 'ASTM', tensileStrengthMin: 1035, yieldStrengthMin: 895, elongationMin: 14, hardnessHRC: [33, 38], material: 'Weathering Steel' },

    // --- JIS B1051 (Japanese) ---
    { class: 'F8T', standard: 'JIS', tensileStrengthMin: 800, yieldStrengthMin: 640, elongationMin: 12, hardnessHRC: [22, 32], material: 'Steel, Q&T' },
    { class: 'F10T', standard: 'JIS', tensileStrengthMin: 1000, yieldStrengthMin: 900, elongationMin: 14, hardnessHRC: [27, 38], material: 'Steel, Q&T' },
    { class: 'S10T', standard: 'JIS', tensileStrengthMin: 1000, yieldStrengthMin: 900, elongationMin: 14, hardnessHRC: [27, 38], material: 'Alloy Steel', notes: 'High-strength friction grip' },

    // --- DIN (German) ---
    { class: 'DIN 931 8.8', standard: 'DIN', tensileStrengthMin: 800, yieldStrengthMin: 640, elongationMin: 12, hardnessHRC: [22, 32], material: 'Medium Carbon Steel, Q&T' },
    { class: 'DIN 931 10.9', standard: 'DIN', tensileStrengthMin: 1040, yieldStrengthMin: 940, elongationMin: 9, hardnessHRC: [32, 39], material: 'Alloy Steel, Q&T' },
    { class: 'DIN 931 12.9', standard: 'DIN', tensileStrengthMin: 1220, yieldStrengthMin: 1100, elongationMin: 8, hardnessHRC: [39, 44], material: 'Alloy Steel, Q&T' },

    // --- BS 1768 (British) ---
    { class: 'Grade S', standard: 'BS', tensileStrengthMin: 544, yieldStrengthMin: 326, elongationMin: 15, material: 'Steel' },
    { class: 'Grade T', standard: 'BS', tensileStrengthMin: 695, yieldStrengthMin: 417, elongationMin: 14, material: 'Medium Carbon Steel' },
    { class: 'Grade V', standard: 'BS', tensileStrengthMin: 849, yieldStrengthMin: 634, elongationMin: 13, material: 'Alloy Steel, Q&T' },

    // --- GOST (Russian) ---
    { class: 'GOST 5.6', standard: 'GOST', tensileStrengthMin: 500, yieldStrengthMin: 300, elongationMin: 20, material: 'Steel 10, 20' },
    { class: 'GOST 8.8', standard: 'GOST', tensileStrengthMin: 800, yieldStrengthMin: 640, elongationMin: 12, material: 'Steel 35, 35X' },
    { class: 'GOST 10.9', standard: 'GOST', tensileStrengthMin: 1040, yieldStrengthMin: 940, elongationMin: 9, material: 'Steel 40X, 30KhGSA' },
    { class: 'GOST 12.9', standard: 'GOST', tensileStrengthMin: 1220, yieldStrengthMin: 1100, elongationMin: 8, material: 'Steel 40KhN2MA' },
];

// ============================================
// NUT PROPERTY CLASSES (ISO 898-2)
// ============================================

export interface NutPropertyClass {
    class: string;
    standard: 'ISO' | 'SAE' | 'ASTM' | 'JIS' | 'DIN' | 'GOST';
    proofLoadStress: number; // MPa
    hardnessHRC?: [number, number];
    hardnessHB?: [number, number];
    matingBoltClass: string[];
}

export const NUT_PROPERTY_CLASSES: NutPropertyClass[] = [
    // ISO 898-2
    { class: '4', standard: 'ISO', proofLoadStress: 400, hardnessHB: [130, 302], matingBoltClass: ['4.6', '4.8'] },
    { class: '5', standard: 'ISO', proofLoadStress: 500, hardnessHB: [130, 302], matingBoltClass: ['5.6', '5.8'] },
    { class: '6', standard: 'ISO', proofLoadStress: 600, hardnessHB: [150, 302], matingBoltClass: ['6.8'] },
    { class: '8', standard: 'ISO', proofLoadStress: 800, hardnessHRC: [18, 30], matingBoltClass: ['8.8'] },
    { class: '9', standard: 'ISO', proofLoadStress: 900, hardnessHRC: [26, 36], matingBoltClass: ['9.8'] },
    { class: '10', standard: 'ISO', proofLoadStress: 1040, hardnessHRC: [26, 36], matingBoltClass: ['10.9'] },
    { class: '12', standard: 'ISO', proofLoadStress: 1200, hardnessHRC: [38, 44], matingBoltClass: ['12.9'] },

    // SAE
    { class: 'Grade 2', standard: 'SAE', proofLoadStress: 517, matingBoltClass: ['Grade 2'] },
    { class: 'Grade 5', standard: 'SAE', proofLoadStress: 827, hardnessHRC: [17, 30], matingBoltClass: ['Grade 5'] },
    { class: 'Grade 8', standard: 'SAE', proofLoadStress: 1034, hardnessHRC: [24, 32], matingBoltClass: ['Grade 8'] },

    // ASTM
    { class: 'A563 Grade A', standard: 'ASTM', proofLoadStress: 586, matingBoltClass: ['A307'] },
    { class: 'A563 Grade DH', standard: 'ASTM', proofLoadStress: 862, hardnessHRC: [24, 38], matingBoltClass: ['A325'] },
    { class: 'A563 Grade DH3', standard: 'ASTM', proofLoadStress: 862, hardnessHRC: [24, 38], matingBoltClass: ['A325 Type 3'] },
    { class: 'A194 Grade 2H', standard: 'ASTM', proofLoadStress: 1035, hardnessHRC: [24, 38], matingBoltClass: ['A490'] },
];

// ============================================
// NUT TYPES (Geometry)
// ============================================

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
    // ISO 4032 Hex Nut (Style 1)
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M3', pitch: 0.5, width: 5.5, height: 2.4 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M4', pitch: 0.7, width: 7, height: 3.2 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M5', pitch: 0.8, width: 8, height: 4.7 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M6', pitch: 1.0, width: 10, height: 5.2 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M8', pitch: 1.25, width: 13, height: 6.8 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M10', pitch: 1.5, width: 16, height: 8.4 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M12', pitch: 1.75, width: 18, height: 10.8 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M14', pitch: 2.0, width: 21, height: 12.8 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M16', pitch: 2.0, width: 24, height: 14.8 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M18', pitch: 2.5, width: 27, height: 15.8 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M20', pitch: 2.5, width: 30, height: 18 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M22', pitch: 2.5, width: 34, height: 19.4 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M24', pitch: 3.0, width: 36, height: 21.5 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M27', pitch: 3.0, width: 41, height: 23.8 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M30', pitch: 3.5, width: 46, height: 25.6 },
    { type: 'Hex Nut', standard: 'ISO 4032', size: 'M36', pitch: 4.0, width: 55, height: 31 },

    // ISO 4035 Thin Hex Nut (Jam Nut)
    { type: 'Thin Hex Nut', standard: 'ISO 4035', size: 'M6', pitch: 1.0, width: 10, height: 3.2 },
    { type: 'Thin Hex Nut', standard: 'ISO 4035', size: 'M8', pitch: 1.25, width: 13, height: 4 },
    { type: 'Thin Hex Nut', standard: 'ISO 4035', size: 'M10', pitch: 1.5, width: 16, height: 5 },
    { type: 'Thin Hex Nut', standard: 'ISO 4035', size: 'M12', pitch: 1.75, width: 18, height: 6 },
    { type: 'Thin Hex Nut', standard: 'ISO 4035', size: 'M16', pitch: 2.0, width: 24, height: 8 },
    { type: 'Thin Hex Nut', standard: 'ISO 4035', size: 'M20', pitch: 2.5, width: 30, height: 10 },

    // ISO 7040 Nyloc Nut
    { type: 'Nyloc Nut', standard: 'ISO 7040', size: 'M4', pitch: 0.7, width: 7, height: 5 },
    { type: 'Nyloc Nut', standard: 'ISO 7040', size: 'M5', pitch: 0.8, width: 8, height: 5 },
    { type: 'Nyloc Nut', standard: 'ISO 7040', size: 'M6', pitch: 1.0, width: 10, height: 6 },
    { type: 'Nyloc Nut', standard: 'ISO 7040', size: 'M8', pitch: 1.25, width: 13, height: 8 },
    { type: 'Nyloc Nut', standard: 'ISO 7040', size: 'M10', pitch: 1.5, width: 16, height: 10 },
    { type: 'Nyloc Nut', standard: 'ISO 7040', size: 'M12', pitch: 1.75, width: 18, height: 12 },
    { type: 'Nyloc Nut', standard: 'ISO 7040', size: 'M16', pitch: 2.0, width: 24, height: 16 },
    { type: 'Nyloc Nut', standard: 'ISO 7040', size: 'M20', pitch: 2.5, width: 30, height: 20 },

    // DIN 6923 Flange Nut
    { type: 'Flange Nut', standard: 'DIN 6923', size: 'M5', pitch: 0.8, width: 8, height: 5, widthCorners: 11.5 },
    { type: 'Flange Nut', standard: 'DIN 6923', size: 'M6', pitch: 1.0, width: 10, height: 6, widthCorners: 14.2 },
    { type: 'Flange Nut', standard: 'DIN 6923', size: 'M8', pitch: 1.25, width: 13, height: 8, widthCorners: 17.9 },
    { type: 'Flange Nut', standard: 'DIN 6923', size: 'M10', pitch: 1.5, width: 15, height: 10, widthCorners: 21.8 },
    { type: 'Flange Nut', standard: 'DIN 6923', size: 'M12', pitch: 1.75, width: 18, height: 11.5, widthCorners: 26 },
    { type: 'Flange Nut', standard: 'DIN 6923', size: 'M16', pitch: 2.0, width: 24, height: 14.5, widthCorners: 34.5 },

    // DIN 985 Prevailing Torque (All-Metal)
    { type: 'Prevailing Torque Nut', standard: 'DIN 985', size: 'M6', pitch: 1.0, width: 10, height: 6 },
    { type: 'Prevailing Torque Nut', standard: 'DIN 985', size: 'M8', pitch: 1.25, width: 13, height: 8 },
    { type: 'Prevailing Torque Nut', standard: 'DIN 985', size: 'M10', pitch: 1.5, width: 17, height: 10 },
    { type: 'Prevailing Torque Nut', standard: 'DIN 985', size: 'M12', pitch: 1.75, width: 19, height: 12 },

    // ANSI/ASME B18.2.2 Heavy Hex Nut
    { type: 'Heavy Hex Nut', standard: 'ANSI B18.2.2', size: '1/4-20', pitch: 20, width: 11.11, height: 7.14 },
    { type: 'Heavy Hex Nut', standard: 'ANSI B18.2.2', size: '3/8-16', pitch: 16, width: 15.88, height: 9.53 },
    { type: 'Heavy Hex Nut', standard: 'ANSI B18.2.2', size: '1/2-13', pitch: 13, width: 22.23, height: 12.7 },
    { type: 'Heavy Hex Nut', standard: 'ANSI B18.2.2', size: '5/8-11', pitch: 11, width: 28.58, height: 17.46 },
    { type: 'Heavy Hex Nut', standard: 'ANSI B18.2.2', size: '3/4-10', pitch: 10, width: 34.93, height: 20.63 },
    { type: 'Heavy Hex Nut', standard: 'ANSI B18.2.2', size: '1-8', pitch: 8, width: 44.45, height: 27.78 },

    // JIS B1181 Japanese Hex Nut
    { type: 'JIS Hex Nut', standard: 'JIS B1181', size: 'M6', pitch: 1.0, width: 10, height: 5 },
    { type: 'JIS Hex Nut', standard: 'JIS B1181', size: 'M8', pitch: 1.25, width: 13, height: 6.5 },
    { type: 'JIS Hex Nut', standard: 'JIS B1181', size: 'M10', pitch: 1.5, width: 17, height: 8 },
    { type: 'JIS Hex Nut', standard: 'JIS B1181', size: 'M12', pitch: 1.75, width: 19, height: 10 },
    { type: 'JIS Hex Nut', standard: 'JIS B1181', size: 'M16', pitch: 2.0, width: 24, height: 13 },
    { type: 'JIS Hex Nut', standard: 'JIS B1181', size: 'M20', pitch: 2.5, width: 30, height: 16 },

    // GOST 5915 Russian Hex Nut
    { type: 'GOST Hex Nut', standard: 'GOST 5915', size: 'M6', pitch: 1.0, width: 10, height: 5 },
    { type: 'GOST Hex Nut', standard: 'GOST 5915', size: 'M8', pitch: 1.25, width: 13, height: 6.5 },
    { type: 'GOST Hex Nut', standard: 'GOST 5915', size: 'M10', pitch: 1.5, width: 17, height: 8 },
    { type: 'GOST Hex Nut', standard: 'GOST 5915', size: 'M12', pitch: 1.75, width: 19, height: 10 },
    { type: 'GOST Hex Nut', standard: 'GOST 5915', size: 'M16', pitch: 2.0, width: 24, height: 13 },
    { type: 'GOST Hex Nut', standard: 'GOST 5915', size: 'M20', pitch: 2.5, width: 30, height: 16 },
];

// ============================================
// BOLT HEAD DIMENSIONS (ISO 4014/4017)
// ============================================

export interface BoltHeadDimension {
    type: string;
    standard: string;
    size: string;
    pitch: number;
    headWidth: number; // Across flats (s)
    headHeight: number; // k
    threadLength?: number; // b (for partial thread)
}

export const BOLT_HEAD_DIMENSIONS: BoltHeadDimension[] = [
    // ISO 4017 Full Thread Hex Bolt
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M2', pitch: 0.4, headWidth: 4, headHeight: 1.4 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M2.5', pitch: 0.45, headWidth: 5, headHeight: 1.7 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M3', pitch: 0.5, headWidth: 5.5, headHeight: 2 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M4', pitch: 0.7, headWidth: 7, headHeight: 2.8 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M5', pitch: 0.8, headWidth: 8, headHeight: 3.5 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M6', pitch: 1.0, headWidth: 10, headHeight: 4 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M8', pitch: 1.25, headWidth: 13, headHeight: 5.3 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M8x1', pitch: 1.0, headWidth: 13, headHeight: 5.3 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M10', pitch: 1.5, headWidth: 16, headHeight: 6.4 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M10x1.25', pitch: 1.25, headWidth: 16, headHeight: 6.4 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M12', pitch: 1.75, headWidth: 18, headHeight: 7.5 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M12x1.5', pitch: 1.5, headWidth: 18, headHeight: 7.5 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M12x1.25', pitch: 1.25, headWidth: 18, headHeight: 7.5 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M14', pitch: 2.0, headWidth: 21, headHeight: 8.8 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M14x1.5', pitch: 1.5, headWidth: 21, headHeight: 8.8 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M16', pitch: 2.0, headWidth: 24, headHeight: 10 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M16x1.5', pitch: 1.5, headWidth: 24, headHeight: 10 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M18', pitch: 2.5, headWidth: 27, headHeight: 11.5 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M18x1.5', pitch: 1.5, headWidth: 27, headHeight: 11.5 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M20', pitch: 2.5, headWidth: 30, headHeight: 12.5 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M20x1.5', pitch: 1.5, headWidth: 30, headHeight: 12.5 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M24', pitch: 3.0, headWidth: 36, headHeight: 15 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M24x2', pitch: 2.0, headWidth: 36, headHeight: 15 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M30', pitch: 3.5, headWidth: 46, headHeight: 18.7 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M36', pitch: 4.0, headWidth: 55, headHeight: 22.5 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M39', pitch: 4.0, headWidth: 60, headHeight: 25 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M42', pitch: 4.5, headWidth: 65, headHeight: 26 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M48', pitch: 5.0, headWidth: 70, headHeight: 30 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M56', pitch: 5.5, headWidth: 85, headHeight: 35 },
    { type: 'Hex Bolt Full Thread', standard: 'ISO 4017', size: 'M64', pitch: 6.0, headWidth: 95, headHeight: 40 },

    // DIN 931 Partial Thread Hex Bolt
    { type: 'Hex Bolt Partial Thread', standard: 'DIN 931', size: 'M6', pitch: 1.0, headWidth: 10, headHeight: 4, threadLength: 18 },
    { type: 'Hex Bolt Partial Thread', standard: 'DIN 931', size: 'M8', pitch: 1.25, headWidth: 13, headHeight: 5.3, threadLength: 22 },
    { type: 'Hex Bolt Partial Thread', standard: 'DIN 931', size: 'M10', pitch: 1.5, headWidth: 17, headHeight: 6.4, threadLength: 26 },
    { type: 'Hex Bolt Partial Thread', standard: 'DIN 931', size: 'M12', pitch: 1.75, headWidth: 19, headHeight: 7.5, threadLength: 30 },
    { type: 'Hex Bolt Partial Thread', standard: 'DIN 931', size: 'M16', pitch: 2.0, headWidth: 24, headHeight: 10, threadLength: 38 },
    { type: 'Hex Bolt Partial Thread', standard: 'DIN 931', size: 'M20', pitch: 2.5, headWidth: 30, headHeight: 12.5, threadLength: 46 },
    { type: 'Hex Bolt Partial Thread', standard: 'DIN 931', size: 'M24', pitch: 3.0, headWidth: 36, headHeight: 15, threadLength: 54 },

    // ISO 4762 Socket Head Cap Screw
    { type: 'Socket Head Cap Screw', standard: 'ISO 4762', size: 'M3', pitch: 0.5, headWidth: 5.5, headHeight: 3 },
    { type: 'Socket Head Cap Screw', standard: 'ISO 4762', size: 'M4', pitch: 0.7, headWidth: 7, headHeight: 4 },
    { type: 'Socket Head Cap Screw', standard: 'ISO 4762', size: 'M5', pitch: 0.8, headWidth: 8.5, headHeight: 5 },
    { type: 'Socket Head Cap Screw', standard: 'ISO 4762', size: 'M6', pitch: 1.0, headWidth: 10, headHeight: 6 },
    { type: 'Socket Head Cap Screw', standard: 'ISO 4762', size: 'M8', pitch: 1.25, headWidth: 13, headHeight: 8 },
    { type: 'Socket Head Cap Screw', standard: 'ISO 4762', size: 'M10', pitch: 1.5, headWidth: 16, headHeight: 10 },
    { type: 'Socket Head Cap Screw', standard: 'ISO 4762', size: 'M12', pitch: 1.75, headWidth: 18, headHeight: 12 },
    { type: 'Socket Head Cap Screw', standard: 'ISO 4762', size: 'M16', pitch: 2.0, headWidth: 24, headHeight: 16 },
    { type: 'Socket Head Cap Screw', standard: 'ISO 4762', size: 'M20', pitch: 2.5, headWidth: 30, headHeight: 20 },
];

// ============================================
// TIGHTENING TORQUE (VDI 2230 / ISO 16047)
// ============================================

export interface TorqueSpec {
    size: string;
    pitch: number;
    class: string;
    torqueNm: number; // Assembly torque
    preloadKn: number; // Target preload
    friction: number; // mu (total friction coefficient)
}

export const TORQUE_SPECIFICATIONS: TorqueSpec[] = [
    // mu = 0.12 (lubricated)
    { size: 'M2', pitch: 0.4, class: '8.8', torqueNm: 0.35, preloadKn: 0.9, friction: 0.12 },
    { size: 'M2.5', pitch: 0.45, class: '8.8', torqueNm: 0.7, preloadKn: 1.5, friction: 0.12 },
    { size: 'M3', pitch: 0.5, class: '8.8', torqueNm: 1.2, preloadKn: 2.2, friction: 0.12 },
    { size: 'M4', pitch: 0.7, class: '8.8', torqueNm: 2.9, preloadKn: 4.5, friction: 0.12 },
    { size: 'M5', pitch: 0.8, class: '8.8', torqueNm: 5.7, preloadKn: 7.2, friction: 0.12 },
    { size: 'M6', pitch: 1.0, class: '8.8', torqueNm: 9.9, preloadKn: 10.3, friction: 0.12 },
    { size: 'M8', pitch: 1.25, class: '8.8', torqueNm: 24, preloadKn: 18.7, friction: 0.12 },
    { size: 'M8x1', pitch: 1.0, class: '8.8', torqueNm: 26, preloadKn: 20.2, friction: 0.12 },
    { size: 'M10', pitch: 1.5, class: '8.8', torqueNm: 47, preloadKn: 29.5, friction: 0.12 },
    { size: 'M10x1.25', pitch: 1.25, class: '8.8', torqueNm: 51, preloadKn: 31.9, friction: 0.12 },
    { size: 'M12', pitch: 1.75, class: '8.8', torqueNm: 82, preloadKn: 43, friction: 0.12 },
    { size: 'M12x1.5', pitch: 1.5, class: '8.8', torqueNm: 86, preloadKn: 45, friction: 0.12 },
    { size: 'M12x1.25', pitch: 1.25, class: '8.8', torqueNm: 90, preloadKn: 47, friction: 0.12 },
    { size: 'M14', pitch: 2.0, class: '8.8', torqueNm: 130, preloadKn: 59, friction: 0.12 },
    { size: 'M14x1.5', pitch: 1.5, class: '8.8', torqueNm: 145, preloadKn: 65, friction: 0.12 },
    { size: 'M16', pitch: 2.0, class: '8.8', torqueNm: 200, preloadKn: 80, friction: 0.12 },
    { size: 'M16x1.5', pitch: 1.5, class: '8.8', torqueNm: 215, preloadKn: 86, friction: 0.12 },
    { size: 'M18', pitch: 2.5, class: '8.8', torqueNm: 280, preloadKn: 98, friction: 0.12 },
    { size: 'M18x1.5', pitch: 1.5, class: '8.8', torqueNm: 315, preloadKn: 111, friction: 0.12 },
    { size: 'M20', pitch: 2.5, class: '8.8', torqueNm: 390, preloadKn: 124, friction: 0.12 },
    { size: 'M20x1.5', pitch: 1.5, class: '8.8', torqueNm: 440, preloadKn: 140, friction: 0.12 },
    { size: 'M24', pitch: 3.0, class: '8.8', torqueNm: 680, preloadKn: 180, friction: 0.12 },
    { size: 'M24x2', pitch: 2.0, class: '8.8', torqueNm: 750, preloadKn: 198, friction: 0.12 },

    // 10.9 class
    { size: 'M6', pitch: 1.0, class: '10.9', torqueNm: 14, preloadKn: 14.6, friction: 0.12 },
    { size: 'M8', pitch: 1.25, class: '10.9', torqueNm: 34, preloadKn: 26.6, friction: 0.12 },
    { size: 'M8x1', pitch: 1.0, class: '10.9', torqueNm: 37, preloadKn: 28.5, friction: 0.12 },
    { size: 'M10', pitch: 1.5, class: '10.9', torqueNm: 67, preloadKn: 42, friction: 0.12 },
    { size: 'M10x1.25', pitch: 1.25, class: '10.9', torqueNm: 71, preloadKn: 45, friction: 0.12 },
    { size: 'M12', pitch: 1.75, class: '10.9', torqueNm: 117, preloadKn: 61, friction: 0.12 },
    { size: 'M12x1.5', pitch: 1.5, class: '10.9', torqueNm: 122, preloadKn: 64, friction: 0.12 },
    { size: 'M12x1.25', pitch: 1.25, class: '10.9', torqueNm: 128, preloadKn: 67, friction: 0.12 },
    { size: 'M16', pitch: 2.0, class: '10.9', torqueNm: 285, preloadKn: 114, friction: 0.12 },
    { size: 'M16x1.5', pitch: 1.5, class: '10.9', torqueNm: 305, preloadKn: 122, friction: 0.12 },
    { size: 'M20', pitch: 2.5, class: '10.9', torqueNm: 555, preloadKn: 177, friction: 0.12 },
    { size: 'M20x1.5', pitch: 1.5, class: '10.9', torqueNm: 620, preloadKn: 200, friction: 0.12 },
    { size: 'M24', pitch: 3.0, class: '10.9', torqueNm: 970, preloadKn: 256, friction: 0.12 },
    { size: 'M24x2', pitch: 2.0, class: '10.9', torqueNm: 1060, preloadKn: 280, friction: 0.12 },

    // 12.9 class
    { size: 'M6', pitch: 1.0, class: '12.9', torqueNm: 17, preloadKn: 17.4, friction: 0.12 },
    { size: 'M8', pitch: 1.25, class: '12.9', torqueNm: 40, preloadKn: 31.2, friction: 0.12 },
    { size: 'M8x1', pitch: 1.0, class: '12.9', torqueNm: 43, preloadKn: 33.5, friction: 0.12 },
    { size: 'M10', pitch: 1.5, class: '12.9', torqueNm: 79, preloadKn: 49.3, friction: 0.12 },
    { size: 'M10x1.25', pitch: 1.25, class: '12.9', torqueNm: 83, preloadKn: 53, friction: 0.12 },
    { size: 'M12', pitch: 1.75, class: '12.9', torqueNm: 138, preloadKn: 72, friction: 0.12 },
    { size: 'M12x1.5', pitch: 1.5, class: '12.9', torqueNm: 144, preloadKn: 76, friction: 0.12 },
    { size: 'M12x1.25', pitch: 1.25, class: '12.9', torqueNm: 150, preloadKn: 80, friction: 0.12 },
    { size: 'M16', pitch: 2.0, class: '12.9', torqueNm: 335, preloadKn: 134, friction: 0.12 },
    { size: 'M16x1.5', pitch: 1.5, class: '12.9', torqueNm: 360, preloadKn: 144, friction: 0.12 },
    { size: 'M20', pitch: 2.5, class: '12.9', torqueNm: 650, preloadKn: 207, friction: 0.12 },
    { size: 'M20x1.5', pitch: 1.5, class: '12.9', torqueNm: 730, preloadKn: 235, friction: 0.12 },
    { size: 'M24', pitch: 3.0, class: '12.9', torqueNm: 1140, preloadKn: 300, friction: 0.12 },
    { size: 'M24x2', pitch: 2.0, class: '12.9', torqueNm: 1240, preloadKn: 330, friction: 0.12 },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getBoltClass(classStr: string): BoltPropertyClass | undefined {
    return BOLT_PROPERTY_CLASSES.find(b => b.class === classStr);
}

export function getNutDimensions(size: string, type?: string): NutDimension[] {
    return NUT_DIMENSIONS.filter(n =>
        n.size === size && (!type || n.type === type)
    );
}

export function getTorqueSpec(size: string, boltClass: string): TorqueSpec | undefined {
    return TORQUE_SPECIFICATIONS.find(t =>
        t.size === size && t.class === boltClass
    );
}

export function getCompatibleNutClass(boltClass: string): NutPropertyClass[] {
    return NUT_PROPERTY_CLASSES.filter(n =>
        n.matingBoltClass.includes(boltClass)
    );
}
