/**
 * Enhanced Bearing Database with SKF Code Detection
 * 
 * Supports: Ball, Roller, Tapered, Needle, Spherical, Thrust
 * Based on SKF catalog naming conventions
 */

export type BearingType =
    | 'deep-groove-ball'
    | 'angular-contact-ball'
    | 'self-aligning-ball'
    | 'cylindrical-roller'
    | 'tapered-roller'
    | 'spherical-roller'
    | 'needle-roller'
    | 'thrust-ball'
    | 'thrust-roller';

export interface BearingData {
    code: string;
    type: BearingType;
    d: number;      // Bore diameter (mm)
    D: number;      // Outer diameter (mm)
    B: number;      // Width (mm)
    C: number;      // Dynamic load rating (kN)
    C0: number;     // Static load rating (kN)
    mass?: number;  // Weight (kg)
    nMax?: number;  // Max speed (rpm)
    e?: number;     // Calculation factor for combined loads
    Y?: number;     // Axial load factor
    Y0?: number;    // Static axial load factor
}

/**
 * Detect bearing type from SKF code
 */
export function detectBearingType(code: string): { type: BearingType; series: string; lifeFactor: number } {
    const upperCode = code.toUpperCase().replace(/\s/g, '');

    // Tapered Roller: 30xxx, 31xxx, 32xxx, 33xxx
    if (/^3[0-3]\d{3}/.test(upperCode)) {
        return { type: 'tapered-roller', series: upperCode.slice(0, 2) + '000', lifeFactor: 10 / 3 };
    }

    // Cylindrical Roller: NUxxx, Nxxx, NJxxx, NFxxx, NUPxxx
    if (/^(NU|NJ|NF|NUP|N)\d{3}/.test(upperCode)) {
        return { type: 'cylindrical-roller', series: 'NU', lifeFactor: 10 / 3 };
    }

    // Spherical Roller: 21xxx, 22xxx, 23xxx, 24xxx
    if (/^2[1-4]\d{3}/.test(upperCode)) {
        return { type: 'spherical-roller', series: upperCode.slice(0, 2) + '000', lifeFactor: 10 / 3 };
    }

    // Needle Roller: NAxxx, NKxxx, HKxxx, BKxxx, RNAxxx
    if (/^(NA|NK|HK|BK|RNA)\d{3,4}/.test(upperCode)) {
        return { type: 'needle-roller', series: upperCode.match(/^[A-Z]+/)?.[0] || 'NA', lifeFactor: 10 / 3 };
    }

    // Angular Contact Ball: 72xx, 73xx, QJ
    if (/^7[2-3]\d{2}/.test(upperCode) || /^QJ/.test(upperCode)) {
        return { type: 'angular-contact-ball', series: upperCode.slice(0, 2) + '00', lifeFactor: 3 };
    }

    // Self-Aligning Ball: 12xx, 13xx, 22xx, 23xx with 2RS/ZZ suffix
    if (/^1[2-3]\d{2}/.test(upperCode)) {
        return { type: 'self-aligning-ball', series: upperCode.slice(0, 2) + '00', lifeFactor: 3 };
    }

    // Thrust Ball: 511xx, 512xx, 513xx, 514xx
    if (/^51[1-4]\d{2}/.test(upperCode)) {
        return { type: 'thrust-ball', series: '51000', lifeFactor: 3 };
    }

    // Thrust Roller: 811xx, 812xx, 292xx, 293xx, 294xx
    if (/^81[1-2]\d{2}/.test(upperCode) || /^29[2-4]\d{2}/.test(upperCode)) {
        return { type: 'thrust-roller', series: '81000', lifeFactor: 10 / 3 };
    }

    // Deep Groove Ball (default): 6xxx, 60xx, 62xx, 63xx
    if (/^6[0-3]\d{2}/.test(upperCode)) {
        return { type: 'deep-groove-ball', series: upperCode.slice(0, 2) + '00', lifeFactor: 3 };
    }

    // Default to deep groove ball
    return { type: 'deep-groove-ball', series: '6200', lifeFactor: 3 };
}

/**
 * Get bearing type display info
 */
export function getBearingTypeInfo(type: BearingType): {
    name: string;
    nameTr: string;
    icon: string;
    color: string;
    description: string;
} {
    const types: Record<BearingType, { name: string; nameTr: string; icon: string; color: string; description: string }> = {
        'deep-groove-ball': {
            name: 'Deep Groove Ball',
            nameTr: 'Sabit Bilyalı',
            icon: '⚙️',
            color: '#6366f1',
            description: 'Most common type. Handles radial and moderate axial loads.'
        },
        'angular-contact-ball': {
            name: 'Angular Contact Ball',
            nameTr: 'Açısal Temaslı Bilyalı',
            icon: '📐',
            color: '#8b5cf6',
            description: 'For combined radial and axial loads. Often used in pairs.'
        },
        'self-aligning-ball': {
            name: 'Self-Aligning Ball',
            nameTr: 'Kendinden Ayarlı Bilyalı',
            icon: '🔄',
            color: '#06b6d4',
            description: 'Compensates for shaft misalignment and deflection.'
        },
        'cylindrical-roller': {
            name: 'Cylindrical Roller',
            nameTr: 'Silindirik Makaralı',
            icon: '🛢️',
            color: '#10b981',
            description: 'High radial load capacity, allows axial displacement.'
        },
        'tapered-roller': {
            name: 'Tapered Roller',
            nameTr: 'Konik Makaralı',
            icon: '📉',
            color: '#f59e0b',
            description: 'Handles heavy combined radial and axial loads.'
        },
        'spherical-roller': {
            name: 'Spherical Roller',
            nameTr: 'Küresel Makaralı',
            icon: '🌐',
            color: '#ef4444',
            description: 'Self-aligning with very high load capacity.'
        },
        'needle-roller': {
            name: 'Needle Roller',
            nameTr: 'İğne Makaralı',
            icon: '📍',
            color: '#ec4899',
            description: 'Compact design for tight spaces, high radial loads.'
        },
        'thrust-ball': {
            name: 'Thrust Ball',
            nameTr: 'Eksenel Bilyalı',
            icon: '⬆️',
            color: '#14b8a6',
            description: 'Handles purely axial loads in one direction.'
        },
        'thrust-roller': {
            name: 'Thrust Roller',
            nameTr: 'Eksenel Makaralı',
            icon: '⏫',
            color: '#a855f7',
            description: 'Heavy axial loads, slow to moderate speeds.'
        }
    };
    return types[type];
}

// Extended Bearing Database - SKF Catalog Based
export const BEARING_CATALOG: BearingData[] = [
    // ===== DEEP GROOVE BALL - 6000 Series =====
    { code: '6000', type: 'deep-groove-ball', d: 10, D: 26, B: 8, C: 4.62, C0: 1.96, mass: 0.02, nMax: 32000, e: 0.22, Y: 2.0 },
    { code: '6001', type: 'deep-groove-ball', d: 12, D: 28, B: 8, C: 5.07, C0: 2.24, mass: 0.023, nMax: 28000, e: 0.22, Y: 2.0 },
    { code: '6002', type: 'deep-groove-ball', d: 15, D: 32, B: 9, C: 5.59, C0: 2.60, mass: 0.030, nMax: 24000, e: 0.22, Y: 2.0 },
    { code: '6003', type: 'deep-groove-ball', d: 17, D: 35, B: 10, C: 6.37, C0: 3.10, mass: 0.039, nMax: 22000, e: 0.22, Y: 2.0 },
    { code: '6004', type: 'deep-groove-ball', d: 20, D: 42, B: 12, C: 9.36, C0: 5.00, mass: 0.070, nMax: 18000, e: 0.24, Y: 1.8 },
    { code: '6005', type: 'deep-groove-ball', d: 25, D: 47, B: 12, C: 10.1, C0: 5.60, mass: 0.078, nMax: 16000, e: 0.24, Y: 1.8 },
    { code: '6006', type: 'deep-groove-ball', d: 30, D: 55, B: 13, C: 13.3, C0: 7.80, mass: 0.115, nMax: 14000, e: 0.27, Y: 1.6 },
    { code: '6008', type: 'deep-groove-ball', d: 40, D: 68, B: 15, C: 16.8, C0: 11.5, mass: 0.185, nMax: 11000, e: 0.27, Y: 1.6 },
    { code: '6010', type: 'deep-groove-ball', d: 50, D: 80, B: 16, C: 21.2, C0: 15.0, mass: 0.265, nMax: 9000, e: 0.31, Y: 1.4 },
    { code: '6012', type: 'deep-groove-ball', d: 60, D: 95, B: 18, C: 29.6, C0: 23.2, mass: 0.420, nMax: 7500, e: 0.31, Y: 1.4 },

    // ===== DEEP GROOVE BALL - 6200 Series =====
    { code: '6200', type: 'deep-groove-ball', d: 10, D: 30, B: 9, C: 5.07, C0: 2.36, mass: 0.034, nMax: 26000, e: 0.22, Y: 2.0 },
    { code: '6201', type: 'deep-groove-ball', d: 12, D: 32, B: 10, C: 6.89, C0: 3.10, mass: 0.043, nMax: 24000, e: 0.22, Y: 2.0 },
    { code: '6202', type: 'deep-groove-ball', d: 15, D: 35, B: 11, C: 7.80, C0: 3.75, mass: 0.052, nMax: 22000, e: 0.24, Y: 1.8 },
    { code: '6203', type: 'deep-groove-ball', d: 17, D: 40, B: 12, C: 9.95, C0: 4.75, mass: 0.073, nMax: 18000, e: 0.24, Y: 1.8 },
    { code: '6204', type: 'deep-groove-ball', d: 20, D: 47, B: 14, C: 12.7, C0: 6.55, mass: 0.106, nMax: 15000, e: 0.27, Y: 1.6 },
    { code: '6205', type: 'deep-groove-ball', d: 25, D: 52, B: 15, C: 14.8, C0: 7.80, mass: 0.130, nMax: 13000, e: 0.27, Y: 1.6 },
    { code: '6206', type: 'deep-groove-ball', d: 30, D: 62, B: 16, C: 20.3, C0: 11.2, mass: 0.198, nMax: 11000, e: 0.31, Y: 1.4 },
    { code: '6207', type: 'deep-groove-ball', d: 35, D: 72, B: 17, C: 25.7, C0: 14.0, mass: 0.285, nMax: 9500, e: 0.31, Y: 1.4 },
    { code: '6208', type: 'deep-groove-ball', d: 40, D: 80, B: 18, C: 29.1, C0: 17.6, mass: 0.370, nMax: 8500, e: 0.37, Y: 1.2 },
    { code: '6209', type: 'deep-groove-ball', d: 45, D: 85, B: 19, C: 32.5, C0: 19.6, mass: 0.415, nMax: 8000, e: 0.37, Y: 1.2 },
    { code: '6210', type: 'deep-groove-ball', d: 50, D: 90, B: 20, C: 35.1, C0: 22.0, mass: 0.475, nMax: 7500, e: 0.37, Y: 1.2 },
    { code: '6212', type: 'deep-groove-ball', d: 60, D: 110, B: 22, C: 52.0, C0: 36.0, mass: 0.780, nMax: 6300, e: 0.44, Y: 1.0 },

    // ===== DEEP GROOVE BALL - 6300 Series =====
    { code: '6300', type: 'deep-groove-ball', d: 10, D: 35, B: 11, C: 8.06, C0: 3.45, mass: 0.054, nMax: 22000, e: 0.24, Y: 1.8 },
    { code: '6304', type: 'deep-groove-ball', d: 20, D: 52, B: 15, C: 15.9, C0: 7.80, mass: 0.145, nMax: 13000, e: 0.31, Y: 1.4 },
    { code: '6305', type: 'deep-groove-ball', d: 25, D: 62, B: 17, C: 22.5, C0: 11.4, mass: 0.230, nMax: 11000, e: 0.31, Y: 1.4 },
    { code: '6306', type: 'deep-groove-ball', d: 30, D: 72, B: 19, C: 28.1, C0: 15.3, mass: 0.335, nMax: 9500, e: 0.37, Y: 1.2 },
    { code: '6308', type: 'deep-groove-ball', d: 40, D: 90, B: 23, C: 40.3, C0: 24.0, mass: 0.580, nMax: 7500, e: 0.37, Y: 1.2 },
    { code: '6310', type: 'deep-groove-ball', d: 50, D: 110, B: 27, C: 62.0, C0: 40.0, mass: 1.05, nMax: 6000, e: 0.44, Y: 1.0 },

    // ===== ANGULAR CONTACT BALL - 7200 Series =====
    { code: '7200', type: 'angular-contact-ball', d: 10, D: 30, B: 9, C: 4.80, C0: 2.50, mass: 0.033, nMax: 28000, e: 0.68, Y: 0.87 },
    { code: '7204', type: 'angular-contact-ball', d: 20, D: 47, B: 14, C: 14.0, C0: 8.30, mass: 0.105, nMax: 17000, e: 0.68, Y: 0.87 },
    { code: '7205', type: 'angular-contact-ball', d: 25, D: 52, B: 15, C: 17.4, C0: 10.4, mass: 0.130, nMax: 15000, e: 0.68, Y: 0.87 },
    { code: '7206', type: 'angular-contact-ball', d: 30, D: 62, B: 16, C: 24.2, C0: 15.3, mass: 0.198, nMax: 12000, e: 0.68, Y: 0.87 },
    { code: '7208', type: 'angular-contact-ball', d: 40, D: 80, B: 18, C: 34.5, C0: 24.0, mass: 0.370, nMax: 9500, e: 0.68, Y: 0.87 },
    { code: '7210', type: 'angular-contact-ball', d: 50, D: 90, B: 20, C: 44.0, C0: 32.0, mass: 0.475, nMax: 8000, e: 0.68, Y: 0.87 },
    { code: '7212', type: 'angular-contact-ball', d: 60, D: 110, B: 22, C: 71.0, C0: 54.0, mass: 0.780, nMax: 6700, e: 0.68, Y: 0.87 },

    // ===== TAPERED ROLLER - 30200 Series =====
    { code: '30204', type: 'tapered-roller', d: 20, D: 47, B: 14, C: 28.0, C0: 32.0, mass: 0.11, nMax: 11000, e: 0.37, Y: 1.6 },
    { code: '30205', type: 'tapered-roller', d: 25, D: 52, B: 15, C: 32.0, C0: 39.0, mass: 0.13, nMax: 9500, e: 0.37, Y: 1.6 },
    { code: '30206', type: 'tapered-roller', d: 30, D: 62, B: 16, C: 44.0, C0: 52.0, mass: 0.19, nMax: 8000, e: 0.40, Y: 1.5 },
    { code: '30207', type: 'tapered-roller', d: 35, D: 72, B: 17, C: 57.0, C0: 67.0, mass: 0.28, nMax: 7000, e: 0.40, Y: 1.5 },
    { code: '30208', type: 'tapered-roller', d: 40, D: 80, B: 18, C: 68.0, C0: 83.0, mass: 0.37, nMax: 6300, e: 0.43, Y: 1.4 },
    { code: '30210', type: 'tapered-roller', d: 50, D: 90, B: 20, C: 79.0, C0: 100, mass: 0.44, nMax: 5600, e: 0.43, Y: 1.4 },
    { code: '30212', type: 'tapered-roller', d: 60, D: 110, B: 22, C: 130, C0: 160, mass: 0.83, nMax: 4800, e: 0.46, Y: 1.3 },

    // ===== TAPERED ROLLER - 32000 Series =====
    { code: '32004', type: 'tapered-roller', d: 20, D: 42, B: 15, C: 25.0, C0: 29.0, mass: 0.085, nMax: 12000, e: 0.35, Y: 1.7 },
    { code: '32005', type: 'tapered-roller', d: 25, D: 47, B: 15, C: 29.0, C0: 35.0, mass: 0.10, nMax: 10000, e: 0.35, Y: 1.7 },
    { code: '32006', type: 'tapered-roller', d: 30, D: 55, B: 17, C: 40.0, C0: 49.0, mass: 0.15, nMax: 8500, e: 0.37, Y: 1.6 },
    { code: '32008', type: 'tapered-roller', d: 40, D: 68, B: 19, C: 54.0, C0: 72.0, mass: 0.24, nMax: 7000, e: 0.40, Y: 1.5 },
    { code: '32010', type: 'tapered-roller', d: 50, D: 80, B: 20, C: 68.0, C0: 93.0, mass: 0.33, nMax: 6000, e: 0.43, Y: 1.4 },
    { code: '32012', type: 'tapered-roller', d: 60, D: 95, B: 23, C: 95.0, C0: 130, mass: 0.52, nMax: 5000, e: 0.46, Y: 1.3 },

    // ===== CYLINDRICAL ROLLER - NU 200 Series =====
    { code: 'NU204', type: 'cylindrical-roller', d: 20, D: 47, B: 14, C: 26.0, C0: 20.0, mass: 0.10, nMax: 13000 },
    { code: 'NU205', type: 'cylindrical-roller', d: 25, D: 52, B: 15, C: 32.0, C0: 26.0, mass: 0.13, nMax: 11000 },
    { code: 'NU206', type: 'cylindrical-roller', d: 30, D: 62, B: 16, C: 44.0, C0: 36.0, mass: 0.19, nMax: 9500 },
    { code: 'NU208', type: 'cylindrical-roller', d: 40, D: 80, B: 18, C: 62.0, C0: 56.0, mass: 0.36, nMax: 8000 },
    { code: 'NU210', type: 'cylindrical-roller', d: 50, D: 90, B: 20, C: 78.0, C0: 75.0, mass: 0.48, nMax: 6700 },
    { code: 'NU212', type: 'cylindrical-roller', d: 60, D: 110, B: 22, C: 120, C0: 110, mass: 0.76, nMax: 5600 },

    // ===== NEEDLE ROLLER - NA 49 Series =====
    { code: 'NA4904', type: 'needle-roller', d: 20, D: 37, B: 17, C: 19.0, C0: 22.0, mass: 0.050 },
    { code: 'NA4905', type: 'needle-roller', d: 25, D: 42, B: 17, C: 23.0, C0: 29.0, mass: 0.060 },
    { code: 'NA4906', type: 'needle-roller', d: 30, D: 47, B: 17, C: 27.0, C0: 36.0, mass: 0.070 },
    { code: 'NA4907', type: 'needle-roller', d: 35, D: 55, B: 20, C: 39.0, C0: 52.0, mass: 0.11 },
    { code: 'NA4908', type: 'needle-roller', d: 40, D: 62, B: 22, C: 50.0, C0: 69.0, mass: 0.15 },
    { code: 'NA4910', type: 'needle-roller', d: 50, D: 72, B: 22, C: 56.0, C0: 85.0, mass: 0.18 },

    // ===== THRUST BALL - 511 Series =====
    { code: '51104', type: 'thrust-ball', d: 20, D: 35, B: 10, C: 15.3, C0: 31.5, mass: 0.035 },
    { code: '51105', type: 'thrust-ball', d: 25, D: 42, B: 11, C: 19.9, C0: 41.5, mass: 0.055 },
    { code: '51106', type: 'thrust-ball', d: 30, D: 47, B: 11, C: 22.5, C0: 50.0, mass: 0.065 },
    { code: '51107', type: 'thrust-ball', d: 35, D: 52, B: 12, C: 25.5, C0: 57.0, mass: 0.080 },
    { code: '51108', type: 'thrust-ball', d: 40, D: 60, B: 13, C: 32.0, C0: 73.5, mass: 0.115 },
    { code: '51110', type: 'thrust-ball', d: 50, D: 70, B: 14, C: 38.0, C0: 95.0, mass: 0.150 },
];

/**
 * Search bearing by code (fuzzy)
 */
export function findBearing(code: string): BearingData | undefined {
    const searchCode = code.toUpperCase().replace(/\s|-/g, '');
    return BEARING_CATALOG.find(b =>
        b.code.toUpperCase().replace(/\s|-/g, '') === searchCode
    );
}

/**
 * Filter bearings by type
 */
export function getBearingsByType(type: BearingType): BearingData[] {
    return BEARING_CATALOG.filter(b => b.type === type);
}

/**
 * Filter bearings by bore diameter range
 */
export function getBearingsByBore(minD: number, maxD: number): BearingData[] {
    return BEARING_CATALOG.filter(b => b.d >= minD && b.d <= maxD);
}

/**
 * Calculate bearing life per ISO 281
 */
export function calculateBearingLife(
    bearing: BearingData,
    fr: number,       // Radial load (kN)
    fa: number,       // Axial load (kN)
    rpm: number,
    reliability: number = 90  // L10 = 90%
): {
    P: number;        // Equivalent load (kN)
    L10: number;      // Basic life (million revs)
    L10h: number;     // Basic life (hours)
    Lna: number;      // Adjusted life (hours)
    staticSafety: number;
} {
    const { lifeFactor } = detectBearingType(bearing.code);

    // Equivalent load calculation
    let P = fr;
    const e = bearing.e || 0.3;
    const Y = bearing.Y || 1.5;

    if (fa / fr > e) {
        const X = 0.56;
        P = X * fr + Y * fa;
    }

    // Basic rating life L10 (million revs)
    const L10 = Math.pow(bearing.C / P, lifeFactor);

    // Life in hours
    const L10h = (L10 * 1e6) / (rpm * 60);

    // Reliability adjustment factor a1
    let a1 = 1.0;
    if (reliability === 95) a1 = 0.62;
    else if (reliability === 96) a1 = 0.53;
    else if (reliability === 97) a1 = 0.44;
    else if (reliability === 98) a1 = 0.33;
    else if (reliability === 99) a1 = 0.21;

    const Lna = a1 * L10h;

    // Static safety factor
    const staticSafety = bearing.C0 / Math.max(fr, P);

    return { P, L10, L10h, Lna, staticSafety };
}
