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

const BORE_STEPS = [
    5, 6, 7, 8, 9, 10, 12, 15, 17, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120
];

function generateCatalog(): BearingData[] {
    const catalog: BearingData[] = [];

    BORE_STEPS.forEach(d => {
        const suffix = d < 10 ? d.toString() : d === 10 ? '00' : d === 12 ? '01' : d === 15 ? '02' : d === 17 ? '03' : (d / 5).toString().padStart(2, '0');

        // ─── DEEP GROOVE BALL (60, 62, 63, 64) ───
        [
            { s: '60', Df: 1.4, Bf: 0.3, Cf: 0.5, C0f: 0.3, e: 0.22, Y: 2.0 },
            { s: '62', Df: 1.8, Bf: 0.4, Cf: 0.8, C0f: 0.5, e: 0.25, Y: 1.8 },
            { s: '63', Df: 2.2, Bf: 0.5, Cf: 1.2, C0f: 0.8, e: 0.30, Y: 1.4 },
            { s: '64', Df: 2.8, Bf: 0.6, Cf: 1.8, C0f: 1.2, e: 0.35, Y: 1.2 }
        ].forEach(ser => {
            if (d < 10 && ser.s !== '60') return;
            const D = Math.round(d * ser.Df + 10);
            const B = Math.round(d * ser.Bf + 5);
            const C = Number((Math.pow(d, 1.2) * ser.Cf + 2).toFixed(2));
            const C0 = Number((Math.pow(d, 1.1) * ser.C0f + 1).toFixed(2));
            catalog.push({
                code: `${ser.s}${suffix}`, type: 'deep-groove-ball', d, D, B, C, C0,
                mass: Number((D * D * B * 0.000003).toFixed(3)), nMax: Math.round(400000 / D), e: ser.e, Y: ser.Y
            });
        });

        // ─── ANGULAR CONTACT (72, 73) ───
        [
            { s: '72', Df: 1.8, Bf: 0.45, Cf: 0.9, C0f: 0.6, e: 0.68, Y: 0.87 },
            { s: '73', Df: 2.3, Bf: 0.55, Cf: 1.4, C0f: 1.0, e: 0.68, Y: 0.87 }
        ].forEach(ser => {
            if (d < 10) return;
            const D = Math.round(d * ser.Df + 12);
            const B = Math.round(d * ser.Bf + 6);
            catalog.push({
                code: `${ser.s}${suffix}`, type: 'angular-contact-ball', d, D, B,
                C: Number((Math.pow(d, 1.2) * ser.Cf + 5).toFixed(2)),
                C0: Number((Math.pow(d, 1.1) * ser.C0f + 3).toFixed(2)),
                mass: Number((D * D * B * 0.0000035).toFixed(3)),
                nMax: Math.round(350000 / D), e: ser.e, Y: ser.Y
            });
        });

        // ─── CYLINDRICAL ROLLER (NU 2, NU 3) ───
        [
            { s: 'NU2', Df: 1.8, Bf: 0.4, Cf: 1.5, C0f: 1.2 },
            { s: 'NU3', Df: 2.2, Bf: 0.5, Cf: 2.2, C0f: 1.8 }
        ].forEach(ser => {
            if (d < 15) return;
            const D = Math.round(d * ser.Df + 10);
            const B = Math.round(d * ser.Bf + 5);
            catalog.push({
                code: `${ser.s}${suffix}`, type: 'cylindrical-roller', d, D, B,
                C: Number((Math.pow(d, 1.3) * ser.Cf).toFixed(2)),
                C0: Number((Math.pow(d, 1.3) * ser.C0f).toFixed(2)),
                mass: Number((D * D * B * 0.000004).toFixed(3)),
                nMax: Math.round(300000 / D)
            });
        });

        // ─── SPHERICAL ROLLER (222, 223) ───
        [
            { s: '222', Df: 1.9, Bf: 0.6, Cf: 4.5, C0f: 5.2, e: 0.25, Y: 2.7 },
            { s: '223', Df: 2.4, Bf: 0.9, Cf: 7.5, C0f: 8.8, e: 0.33, Y: 2.0 }
        ].forEach(ser => {
            if (d < 20) return;
            const D = Math.round(d * ser.Df + 15);
            const B = Math.round(d * ser.Bf + 8);
            catalog.push({
                code: `${ser.s}${suffix}`, type: 'spherical-roller', d, D, B,
                C: Number((Math.pow(d, 1.4) * ser.Cf).toFixed(2)),
                C0: Number((Math.pow(d, 1.4) * ser.C0f).toFixed(2)),
                mass: Number((D * D * B * 0.0000045).toFixed(3)),
                nMax: Math.round(150000 / D), e: ser.e, Y: ser.Y
            });
        });

        // ─── TAPERED ROLLER (302, 322) ───
        [
            { s: '302', Df: 1.8, Bf: 0.4, Cf: 2.5, C0f: 2.8, e: 0.35, Y: 1.7 },
            { s: '322', Df: 1.8, Bf: 0.55, Cf: 3.5, C0f: 4.2, e: 0.37, Y: 1.6 }
        ].forEach(ser => {
            if (d < 15) return;
            const D = Math.round(d * ser.Df + 10);
            const B = Math.round(d * ser.Bf + 5);
            catalog.push({
                code: `${ser.s}${suffix}`, type: 'tapered-roller', d, D, B,
                C: Number((Math.pow(d, 1.35) * ser.Cf).toFixed(2)),
                C0: Number((Math.pow(d, 1.35) * ser.C0f).toFixed(2)),
                mass: Number((D * D * B * 0.0000042).toFixed(3)),
                nMax: Math.round(200000 / D), e: ser.e, Y: ser.Y
            });
        });

        // ─── THRUST BALL (511, 512) ───
        [
            { s: '511', Df: 1.3, Bf: 0.25, Cf: 0.8, C0f: 1.5 },
            { s: '512', Df: 1.6, Bf: 0.35, Cf: 1.2, C0f: 2.5 }
        ].forEach(ser => {
            if (d < 10) return;
            const D = Math.round(d * ser.Df + 8);
            const B = Math.round(d * ser.Bf + 4);
            catalog.push({
                code: `${ser.s}${suffix}`, type: 'thrust-ball', d, D, B,
                C: Number((Math.pow(d, 1.1) * ser.Cf + 2).toFixed(2)),
                C0: Number((Math.pow(d, 1.0) * ser.C0f + 5).toFixed(2)),
                mass: Number((D * D * B * 0.0000025).toFixed(3)),
                nMax: Math.round(100000 / D)
            });
        });
    });

    return catalog;
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

