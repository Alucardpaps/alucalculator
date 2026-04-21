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

// ═══════════════════════════════════════════════════════════════
// BEARING CATALOG GENERATOR (SKF COMPLIANT)
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// BEARING CATALOG (SKF COMPLIANT HARDCODED DATA)
// ═══════════════════════════════════════════════════════════════

const HARDCODED_CATALOG: BearingData[] = [
    // ===== DEEP GROOVE BALL - 6000 Series =====
    { code: '6000', type: 'deep-groove-ball', d: 10, D: 26, B: 8, C: 4.62, C0: 1.96, mass: 0.019, nMax: 30000, e: 0.22, Y: 2.0 },
    { code: '6004', type: 'deep-groove-ball', d: 20, D: 42, B: 12, C: 9.36, C0: 5.0, mass: 0.069, nMax: 18000, e: 0.25, Y: 1.8 },
    { code: '6005', type: 'deep-groove-ball', d: 25, D: 47, B: 12, C: 11.2, C0: 5.85, mass: 0.080, nMax: 15000, e: 0.25, Y: 1.8 },
    { code: '6006', type: 'deep-groove-ball', d: 30, D: 55, B: 13, C: 13.3, C0: 8.3, mass: 0.12, nMax: 13000, e: 0.28, Y: 1.6 },
    { code: '6008', type: 'deep-groove-ball', d: 40, D: 68, B: 15, C: 16.8, C0: 11.6, mass: 0.19, nMax: 10000, e: 0.30, Y: 1.4 },

    // ===== DEEP GROOVE BALL - 6200 Series =====
    { code: '6200', type: 'deep-groove-ball', d: 10, D: 30, B: 9, C: 5.4, C0: 2.36, mass: 0.032, nMax: 24000, e: 0.22, Y: 2.0 },
    { code: '6204', type: 'deep-groove-ball', d: 20, D: 47, B: 14, C: 13.5, C0: 6.55, mass: 0.106, nMax: 18000, e: 0.25, Y: 1.8 },
    { code: '6205', type: 'deep-groove-ball', d: 25, D: 52, B: 15, C: 14.8, C0: 7.8, mass: 0.128, nMax: 15000, e: 0.28, Y: 1.6 },
    { code: '6206', type: 'deep-groove-ball', d: 30, D: 62, B: 16, C: 20.3, C0: 11.2, mass: 0.199, nMax: 13000, e: 0.30, Y: 1.4 },
    { code: '6208', type: 'deep-groove-ball', d: 40, D: 80, B: 18, C: 32.5, C0: 19.0, mass: 0.366, nMax: 9000, e: 0.31, Y: 1.3 },

    // ===== DEEP GROOVE BALL - 6300 Series =====
    { code: '6300', type: 'deep-groove-ball', d: 10, D: 35, B: 11, C: 8.52, C0: 3.4, mass: 0.053, nMax: 22000, e: 0.24, Y: 1.8 },
    { code: '6304', type: 'deep-groove-ball', d: 20, D: 52, B: 15, C: 16.8, C0: 7.8, mass: 0.144, nMax: 14000, e: 0.28, Y: 1.6 },
    { code: '6305', type: 'deep-groove-ball', d: 25, D: 62, B: 17, C: 23.4, C0: 11.6, mass: 0.232, nMax: 12000, e: 0.30, Y: 1.4 },
    { code: '6306', type: 'deep-groove-ball', d: 30, D: 72, B: 19, C: 29.6, C0: 16.0, mass: 0.346, nMax: 10000, e: 0.31, Y: 1.3 },
    { code: '6308', type: 'deep-groove-ball', d: 40, D: 90, B: 23, C: 42.3, C0: 24.0, mass: 0.633, nMax: 8000, e: 0.31, Y: 1.3 },

    // ===== ANGULAR CONTACT BALL - 7200 Series =====
    { code: '7204', type: 'angular-contact-ball', d: 20, D: 47, B: 14, C: 14.3, C0: 8.15, mass: 0.10, nMax: 15000, e: 0.68, Y: 0.87 },
    { code: '7205', type: 'angular-contact-ball', d: 25, D: 52, B: 15, C: 16.1, C0: 9.80, mass: 0.13, nMax: 13000, e: 0.68, Y: 0.87 },
    { code: '7206', type: 'angular-contact-ball', d: 30, D: 62, B: 16, C: 23.4, C0: 14.6, mass: 0.20, nMax: 11000, e: 0.68, Y: 0.87 },

    // ===== CYLINDRICAL ROLLER - NU 2 Series =====
    { code: 'NU204', type: 'cylindrical-roller', d: 20, D: 47, B: 14, C: 28.5, C0: 22.0, mass: 0.11, nMax: 13000 },
    { code: 'NU205', type: 'cylindrical-roller', d: 25, D: 52, B: 15, C: 32.0, C0: 26.5, mass: 0.14, nMax: 11000 },
    { code: 'NU206', type: 'cylindrical-roller', d: 30, D: 62, B: 16, C: 44.0, C0: 36.5, mass: 0.21, nMax: 9500 },

    // ===== TAPERED ROLLER - 302 Series =====
    { code: '30204', type: 'tapered-roller', d: 20, D: 47, B: 14, C: 28.1, C0: 32.5, mass: 0.12, nMax: 11000, e: 0.35, Y: 1.7 },
    { code: '30205', type: 'tapered-roller', d: 25, D: 52, B: 15, C: 32.5, C0: 39.0, mass: 0.14, nMax: 9500, e: 0.37, Y: 1.6 },
    { code: '30206', type: 'tapered-roller', d: 30, D: 62, B: 16, C: 44.0, C0: 53.0, mass: 0.22, nMax: 8000, e: 0.37, Y: 1.6 },
];

// ═══════════════════════════════════════════════════════════════
// BEARING CATALOG GENERATOR (HEURISTIC FALLBACK)
// ═══════════════════════════════════════════════════════════════

const BORE_STEPS = [
    5, 6, 7, 8, 9, 10, 12, 15, 17, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120
];

function generateCatalog(): BearingData[] {
    const catalog: BearingData[] = [...HARDCODED_CATALOG];

    BORE_STEPS.forEach(d => {
        const suffix = d < 10 ? d.toString() : d === 10 ? '00' : d === 12 ? '01' : d === 15 ? '02' : d === 17 ? '03' : (d / 5).toString().padStart(2, '0');

        // ─── DEEP GROOVE BALL (60, 62, 63, 64) ───
        [
            { s: '60', Df: 1.4, Bf: 0.3, Cf: 0.45, C0f: 0.25, e: 0.22, Y: 2.0 },
            { s: '62', Df: 1.8, Bf: 0.4, Cf: 0.75, C0f: 0.45, e: 0.25, Y: 1.8 },
            { s: '63', Df: 2.2, Bf: 0.5, Cf: 1.15, C0f: 0.75, e: 0.30, Y: 1.4 },
            { s: '64', Df: 2.8, Bf: 0.6, Cf: 1.70, C0f: 1.15, e: 0.35, Y: 1.2 }
        ].forEach(ser => {
            if (d < 10 && ser.s !== '60') return;
            const code = `${ser.s}${suffix}`;
            if (HARDCODED_CATALOG.some(b => b.code === code)) return;

            const D = Math.round(d * ser.Df + 10);
            const B = Math.round(d * ser.Bf + 5);
            const C = Number((Math.pow(d, 1.15) * ser.Cf + 1.5).toFixed(2));
            const C0 = Number((Math.pow(d, 1.1) * ser.C0f + 0.8).toFixed(2));
            catalog.push({
                code, type: 'deep-groove-ball', d, D, B, C, C0,
                mass: Number((D * D * B * 0.000003).toFixed(3)), nMax: Math.round(400000 / D), e: ser.e, Y: ser.Y
            });
        });

        // ─── ANGULAR CONTACT (72, 73) ───
        [
            { s: '72', Df: 1.8, Bf: 0.45, Cf: 0.8, C0f: 0.5, e: 0.68, Y: 0.87 },
            { s: '73', Df: 2.3, Bf: 0.55, Cf: 1.3, C0f: 0.9, e: 0.68, Y: 0.87 }
        ].forEach(ser => {
            if (d < 10) return;
            const code = `${ser.s}${suffix}`;
            if (HARDCODED_CATALOG.some(b => b.code === code)) return;

            const D = Math.round(d * ser.Df + 12);
            const B = Math.round(d * ser.Bf + 6);
            catalog.push({
                code, type: 'angular-contact-ball', d, D, B,
                C: Number((Math.pow(d, 1.15) * ser.Cf + 4).toFixed(2)),
                C0: Number((Math.pow(d, 1.1) * ser.C0f + 2).toFixed(2)),
                mass: Number((D * D * B * 0.0000035).toFixed(3)),
                nMax: Math.round(350000 / D), e: ser.e, Y: ser.Y
            });
        });

        // Add other types similarly if needed...
    });

    return catalog.sort((a, b) => a.code.localeCompare(b.code));
}

export const BEARING_CATALOG: BearingData[] = generateCatalog();

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

    if (fr === 0) {
        // Pure axial load
        P = Y * fa;
    } else if (fa / fr > e) {
        const X = bearing.type === 'tapered-roller' || bearing.type === 'spherical-roller' ? 0.67 : 0.56;
        P = X * fr + Y * fa;
    }

    // Basic rating life L10 (million revs)
    const L10 = Math.pow(bearing.C / Math.max(0.1, P), lifeFactor);

    // Life in hours
    const L10h = (L10 * 1e6) / (Math.max(1, rpm) * 60);

    // Reliability adjustment factor a1
    const a1Map: Record<number, number> = {
        90: 1.0, 95: 0.62, 96: 0.53, 97: 0.44, 98: 0.33, 99: 0.21
    };
    const a1 = a1Map[reliability] || 1.0;

    const Lna = a1 * L10h;

    // Static safety factor
    const staticSafety = bearing.C0 / Math.max(0.1, fr, P);

    return { P, L10, L10h, Lna, staticSafety };
}

