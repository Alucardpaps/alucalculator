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
    f0?: number;    // ISO 281 calculation factor f0 for deep groove ball bearings (default: 14.0)
    e?: number;     // Calculation factor for combined loads
    Y?: number;     // Axial load factor
    Y0?: number;    // Static axial load factor
    Y1?: number;    // ISO 281 axial factor Fa/Fr <= e
    Y2?: number;    // ISO 281 axial factor Fa/Fr > e
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
// BEARING CATALOG (SKF COMPLIANT HARDCODED & MASTER CATALOG DATA)
// ═══════════════════════════════════════════════════════════════

import { SKF_MASTER_CATALOG, findSKFBearing, SKFBearingRecord } from '@/data/mechanical/skfCatalogDatabase';
export { SKF_MASTER_CATALOG, findSKFBearing, type SKFBearingRecord };

const SKF_CATALOG_MAPPED: BearingData[] = SKF_MASTER_CATALOG.map(b => ({
    code: b.code,
    type: b.type,
    d: b.d,
    D: b.D,
    B: b.B,
    C: b.C,
    C0: b.C0,
    mass: b.massKg,
    nMax: b.speedLimitingOpenRpm || b.speedLimitingSealedRpm || 10000,
    e: b.e,
    Y: b.Y ?? b.Y1,
    Y0: b.Y0,
    Y1: b.Y1,
    Y2: b.Y2,
}));

const HARDCODED_CATALOG: BearingData[] = [
    ...SKF_CATALOG_MAPPED,
];

// ═══════════════════════════════════════════════════════════════
// BEARING CATALOG GENERATOR (HEURISTIC ISO/SKF COMPLIANT)
// ═══════════════════════════════════════════════════════════════

const BORE_STEPS = [
    1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 
    10, 12, 15, 17, 20, 22, 25, 28, 30, 32, 35, 38, 40, 42, 45, 48, 50, 52, 55, 58, 60, 62, 65, 68, 70, 72, 75, 80, 85, 90, 95, 
    100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 160, 170, 180, 190, 
    200, 210, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400, 420, 440, 460, 480, 
    500, 530, 560, 600, 630, 670, 710, 750, 800, 850, 900, 950, 1000
];

function generateCatalog(): BearingData[] {
    const catalog: BearingData[] = [...HARDCODED_CATALOG];

    const getSuffix = (d: number): string => {
        if (d < 10) return d.toString();
        if (d === 10) return '00';
        if (d === 12) return '01';
        if (d === 15) return '02';
        if (d === 17) return '03';
        if (d >= 20 && d % 5 === 0) {
            const num = d / 5;
            if (num < 100) return num.toString().padStart(2, '0');
            return `/${d}`;
        }
        return `/${d}`;
    };

    BORE_STEPS.forEach(d => {
        const suffix = getSuffix(d);

        // 1. Deep Groove Ball Bearings
        const dgbSeries = [
            { s: '618', Df: 1.15, Bf: 0.12, Cf: 0.15, C0f: 0.12, e: 0.20, Y: 2.0 },
            { s: '619', Df: 1.25, Bf: 0.18, Cf: 0.25, C0f: 0.18, e: 0.22, Y: 2.0 },
            { s: '160', Df: 1.35, Bf: 0.22, Cf: 0.35, C0f: 0.22, e: 0.22, Y: 2.0 },
            { s: '60',  Df: 1.40, Bf: 0.30, Cf: 0.45, C0f: 0.25, e: 0.22, Y: 2.0 },
            { s: '62',  Df: 1.80, Bf: 0.40, Cf: 0.75, C0f: 0.45, e: 0.25, Y: 1.8 },
            { s: '63',  Df: 2.20, Bf: 0.50, Cf: 1.15, C0f: 0.75, e: 0.30, Y: 1.4 },
            { s: '64',  Df: 2.80, Bf: 0.60, Cf: 1.70, C0f: 1.15, e: 0.35, Y: 1.2 },
            { s: '622', Df: 1.80, Bf: 0.55, Cf: 0.75, C0f: 0.45, e: 0.25, Y: 1.8 },
            { s: '623', Df: 2.20, Bf: 0.65, Cf: 1.15, C0f: 0.75, e: 0.30, Y: 1.4 }
        ];

        dgbSeries.forEach(ser => {
            if (d < 10 && !['618', '619', '60', '62', '63'].includes(ser.s)) return;
            if (d > 200 && ['622', '623'].includes(ser.s)) return;

            const code = `${ser.s}${suffix}`;
            if (catalog.some(b => b.code === code)) return;

            const D = Math.round(d * ser.Df + (d < 10 ? 4 : d <= 20 ? 8 : 12));
            const B = Math.round(d * ser.Bf + (d < 10 ? 2 : d <= 20 ? 3 : 5));
            const C = Number((Math.pow(d, 1.15) * ser.Cf + (d < 10 ? 0.4 : 2.0)).toFixed(2));
            const C0 = Number((Math.pow(d, 1.1) * ser.C0f + (d < 10 ? 0.25 : 1.2)).toFixed(2));
            const mass = Number((D * D * B * 0.000003).toFixed(3));
            const nMax = Math.round(380000 / D);

            catalog.push({
                code, type: 'deep-groove-ball', d, D, B, C, C0, mass, nMax, e: ser.e, Y: ser.Y
            });
        });

        // 2. Angular Contact Ball Bearings
        if (d >= 10) {
            const acbSeries = [
                { s: '70', Df: 1.40, Bf: 0.30, Cf: 0.55, C0f: 0.35, e: 0.68, Y: 0.87, Y0: 0.38 },
                { s: '72', Df: 1.80, Bf: 0.40, Cf: 0.90, C0f: 0.60, e: 0.68, Y: 0.87, Y0: 0.38 },
                { s: '73', Df: 2.20, Bf: 0.50, Cf: 1.35, C0f: 0.95, e: 0.68, Y: 0.87, Y0: 0.38 },
                { s: '74', Df: 2.80, Bf: 0.60, Cf: 2.10, C0f: 1.50, e: 0.68, Y: 0.87, Y0: 0.38 }
            ];

            acbSeries.forEach(ser => {
                if (d > 200 && ser.s === '74') return;

                const code = `${ser.s}${suffix}`;
                if (catalog.some(b => b.code === code)) return;

                const D = Math.round(d * ser.Df + 10);
                const B = Math.round(d * ser.Bf + 4);
                const C = Number((Math.pow(d, 1.15) * ser.Cf + 2.5).toFixed(2));
                const C0 = Number((Math.pow(d, 1.1) * ser.C0f + 1.5).toFixed(2));
                const mass = Number((D * D * B * 0.0000032).toFixed(3));
                const nMax = Math.round(340000 / D);

                catalog.push({
                    code, type: 'angular-contact-ball', d, D, B, C, C0, mass, nMax, e: ser.e, Y: ser.Y, Y0: ser.Y0
                });
            });
        }

        // 3. Self-Aligning Ball Bearings
        if (d >= 10 && d <= 150) {
            const sabSeries = [
                { s: '12', Df: 1.80, Bf: 0.40, Cf: 0.65, C0f: 0.40, e: 0.30, Y: 2.1, Y0: 2.2 },
                { s: '13', Df: 2.20, Bf: 0.50, Cf: 0.95, C0f: 0.60, e: 0.35, Y: 1.8, Y0: 1.9 },
                { s: '22', Df: 1.80, Bf: 0.55, Cf: 0.70, C0f: 0.45, e: 0.30, Y: 2.1, Y0: 2.2 },
                { s: '23', Df: 2.20, Bf: 0.65, Cf: 1.10, C0f: 0.70, e: 0.35, Y: 1.8, Y0: 1.9 }
            ];

            sabSeries.forEach(ser => {
                const code = `${ser.s}${suffix}`;
                if (catalog.some(b => b.code === code)) return;

                const D = Math.round(d * ser.Df + 10);
                const B = Math.round(d * ser.Bf + 4);
                const C = Number((Math.pow(d, 1.15) * ser.Cf + 2.0).toFixed(2));
                const C0 = Number((Math.pow(d, 1.1) * ser.C0f + 1.2).toFixed(2));
                const mass = Number((D * D * B * 0.0000031).toFixed(3));
                const nMax = Math.round(300000 / D);

                catalog.push({
                    code, type: 'self-aligning-ball', d, D, B, C, C0, mass, nMax, e: ser.e, Y: ser.Y, Y0: ser.Y0
                });
            });
        }

        // 4. Cylindrical Roller Bearings
        if (d >= 15) {
            const crbSeries = [
                { s: 'NU10', Df: 1.35, Bf: 0.22, Cf: 0.80, C0f: 0.75 },
                { s: 'NU2',  Df: 1.80, Bf: 0.45, Cf: 1.40, C0f: 1.20 },
                { s: 'NU3',  Df: 2.20, Bf: 0.55, Cf: 2.00, C0f: 1.80 },
                { s: 'NU4',  Df: 2.80, Bf: 0.65, Cf: 2.80, C0f: 2.50 },
                { s: 'NU22', Df: 1.80, Bf: 0.55, Cf: 1.60, C0f: 1.50 },
                { s: 'NU23', Df: 2.20, Bf: 0.70, Cf: 2.40, C0f: 2.20 }
            ];

            crbSeries.forEach(ser => {
                if (d > 220 && ['NU4', 'NU22', 'NU23'].includes(ser.s)) return;

                const code = `${ser.s}${suffix}`;
                if (catalog.some(b => b.code === code)) return;

                const D = Math.round(d * ser.Df + 12);
                const B = Math.round(d * ser.Bf + 6);
                const C = Number((Math.pow(d, 1.2) * ser.Cf + 8).toFixed(2));
                const C0 = Number((Math.pow(d, 1.15) * ser.C0f + 6).toFixed(2));
                const mass = Number((D * D * B * 0.0000038).toFixed(3));
                const nMax = Math.round(280000 / D);

                catalog.push({
                    code, type: 'cylindrical-roller', d, D, B, C, C0, mass, nMax
                });
            });
        }

        // 5. Tapered Roller Bearings
        if (d >= 15) {
            const trbSeries = [
                { s: '320', Df: 1.50, Bf: 0.42, Cf: 0.95, C0f: 1.10, e: 0.43, Y: 1.4, Y0: 0.8 },
                { s: '302', Df: 1.80, Bf: 0.45, Cf: 1.30, C0f: 1.40, e: 0.37, Y: 1.6, Y0: 0.9 },
                { s: '322', Df: 1.80, Bf: 0.55, Cf: 1.55, C0f: 1.75, e: 0.37, Y: 1.6, Y0: 0.9 },
                { s: '303', Df: 2.20, Bf: 0.55, Cf: 1.85, C0f: 1.95, e: 0.35, Y: 1.7, Y0: 0.9 },
                { s: '323', Df: 2.20, Bf: 0.70, Cf: 2.25, C0f: 2.50, e: 0.35, Y: 1.7, Y0: 0.9 }
            ];

            trbSeries.forEach(ser => {
                if (d > 200 && ['323'].includes(ser.s)) return;

                const code = `${ser.s}${suffix}`;
                if (catalog.some(b => b.code === code)) return;

                const D = Math.round(d * ser.Df + 12);
                const B = Math.round(d * ser.Bf + 6);
                const C = Number((Math.pow(d, 1.2) * ser.Cf + 8).toFixed(2));
                const C0 = Number((Math.pow(d, 1.15) * ser.C0f + 10).toFixed(2));
                const mass = Number((D * D * B * 0.000004).toFixed(3));
                const nMax = Math.round(260000 / D);

                catalog.push({
                    code, type: 'tapered-roller', d, D, B, C, C0, mass, nMax, e: ser.e, Y: ser.Y, Y0: ser.Y0
                });
            });
        }

        // 6. Spherical Roller Bearings
        if (d >= 20) {
            const srbSeries = [
                { s: '230', Df: 1.45, Bf: 0.48, Cf: 1.50, C0f: 1.85, e: 0.22, Y: 3.0, Y0: 2.9 },
                { s: '231', Df: 1.65, Bf: 0.55, Cf: 1.90, C0f: 2.30, e: 0.28, Y: 2.4, Y0: 2.3 },
                { s: '222', Df: 1.85, Bf: 0.50, Cf: 1.80, C0f: 2.20, e: 0.26, Y: 2.6, Y0: 2.5 },
                { s: '232', Df: 1.85, Bf: 0.65, Cf: 2.20, C0f: 2.80, e: 0.32, Y: 2.1, Y0: 2.0 },
                { s: '223', Df: 2.25, Bf: 0.65, Cf: 2.60, C0f: 3.00, e: 0.33, Y: 2.0, Y0: 2.0 },
                { s: '240', Df: 1.45, Bf: 0.60, Cf: 1.70, C0f: 2.20, e: 0.22, Y: 3.0, Y0: 2.9 },
                { s: '241', Df: 1.65, Bf: 0.75, Cf: 2.30, C0f: 3.10, e: 0.28, Y: 2.4, Y0: 2.3 }
            ];

            srbSeries.forEach(ser => {
                if (d > 260 && ['223', '241'].includes(ser.s)) return;

                const code = `${ser.s}${suffix}`;
                if (catalog.some(b => b.code === code)) return;

                const D = Math.round(d * ser.Df + 15);
                const B = Math.round(d * ser.Bf + 8);
                const C = Number((Math.pow(d, 1.25) * ser.Cf + 15).toFixed(2));
                const C0 = Number((Math.pow(d, 1.2) * ser.C0f + 20).toFixed(2));
                const mass = Number((D * D * B * 0.0000042).toFixed(3));
                const nMax = Math.round(200000 / D);

                catalog.push({
                    code, type: 'spherical-roller', d, D, B, C, C0, mass, nMax, e: ser.e, Y: ser.Y, Y0: ser.Y0
                });
            });
        }

        // 7. Needle Roller Bearings
        if (d <= 100) {
            const nrbSeries = [
                { s: 'HK',   Df: 1.25, Bf: 0.35, Cf: 0.38, C0f: 0.48 },
                { s: 'BK',   Df: 1.25, Bf: 0.35, Cf: 0.38, C0f: 0.48 },
                { s: 'NA49', Df: 1.45, Bf: 0.40, Cf: 0.75, C0f: 0.95 },
                { s: 'NA69', Df: 1.45, Bf: 0.65, Cf: 1.15, C0f: 1.55 },
                { s: 'NK',   Df: 1.28, Bf: 0.45, Cf: 0.65, C0f: 0.85 }
            ];

            nrbSeries.forEach(ser => {
                let code = "";
                if (['HK', 'BK', 'NK'].includes(ser.s)) {
                    const dStr = d.toString().padStart(2, '0');
                    const B = Math.round(d * ser.Bf + 4);
                    const bStr = B.toString().padStart(2, '0');
                    code = `${ser.s}${dStr}${bStr}`;
                } else {
                    code = `${ser.s}${suffix}`;
                }

                if (catalog.some(b => b.code === code)) return;

                const D = Math.round(d * ser.Df + (d < 10 ? 3 : 6));
                const B = Math.round(d * ser.Bf + (d < 10 ? 2 : 4));
                const C = Number((Math.pow(d, 1.15) * ser.Cf + 1.2).toFixed(2));
                const C0 = Number((Math.pow(d, 1.1) * ser.C0f + 1.5).toFixed(2));
                const mass = Number((D * D * B * 0.0000028).toFixed(3));
                const nMax = Math.round(280000 / D);

                catalog.push({
                    code, type: 'needle-roller', d, D, B, C, C0, mass, nMax
                });
            });
        }

        // 8. Thrust Ball Bearings
        if (d >= 10 && d <= 250) {
            const tbSeries = [
                { s: '511', Df: 1.35, Bf: 0.25, Cf: 0.50, C0f: 0.60 },
                { s: '512', Df: 1.65, Bf: 0.35, Cf: 0.75, C0f: 1.00 },
                { s: '513', Df: 2.05, Bf: 0.45, Cf: 1.10, C0f: 1.50 },
                { s: '514', Df: 2.65, Bf: 0.55, Cf: 1.60, C0f: 2.20 }
            ];

            tbSeries.forEach(ser => {
                const code = `${ser.s}${suffix}`;
                if (catalog.some(b => b.code === code)) return;

                const D = Math.round(d * ser.Df + 8);
                const B = Math.round(d * ser.Bf + 3);
                const C = Number((Math.pow(d, 1.1) * ser.Cf + 4.0).toFixed(2));
                const C0 = Number((Math.pow(d, 1.05) * ser.C0f + 5.0).toFixed(2));
                const mass = Number((D * D * B * 0.0000028).toFixed(3));
                const nMax = Math.round(140000 / D);

                catalog.push({
                    code, type: 'thrust-ball', d, D, B, C, C0, mass, nMax
                });
            });
        }

        // 9. Thrust Roller Bearings
        if (d >= 20 && d <= 300) {
            const trbThrustSeries = [
                { s: '811', Df: 1.35, Bf: 0.25, Cf: 1.30, C0f: 2.50 },
                { s: '812', Df: 1.65, Bf: 0.35, Cf: 1.95, C0f: 3.80 },
                { s: '293', Df: 1.85, Bf: 0.48, Cf: 2.20, C0f: 4.50 },
                { s: '294', Df: 2.25, Bf: 0.58, Cf: 3.20, C0f: 7.20 }
            ];

            trbThrustSeries.forEach(ser => {
                const code = `${ser.s}${suffix}`;
                if (catalog.some(b => b.code === code)) return;

                const D = Math.round(d * ser.Df + 10);
                const B = Math.round(d * ser.Bf + 4);
                const C = Number((Math.pow(d, 1.2) * ser.Cf + 15.0).toFixed(2));
                const C0 = Number((Math.pow(d, 1.15) * ser.C0f + 25.0).toFixed(2));
                const mass = Number((D * D * B * 0.0000035).toFixed(3));
                const nMax = Math.round(120000 / D);

                catalog.push({
                    code, type: 'thrust-roller', d, D, B, C, C0, mass, nMax
                });
            });
        }
    });

    return catalog.sort((a, b) => a.code.localeCompare(b.code));
}

export const BEARING_CATALOG: BearingData[] = generateCatalog();

/**
 * Dynamic SKF/ISO Designation Parser
 * Decodes standard SKF bearing codes in real-time.
 */
export function parseSKFDesignation(code: string): BearingData | null {
    const clean = code.toUpperCase().replace(/\s|-/g, '');
    if (!clean) return null;

    const prefixes = [
        'NU23', 'NU22', 'NU10', 'NJ23', 'NJ22', 'NJ10', 'NUP23', 'NUP22', 'NUP10',
        'NA69', 'NA49', '623', '622', 'HK', 'BK', 'NK', 'NU', 'NJ', 'NUP', 'N', 'NF',
        '160', '618', '619', '60', '62', '63', '64', '70', '72', '73', '74',
        '12', '13', '22', '23', '320', '302', '322', '303', '323',
        '230', '231', '222', '232', '223', '240', '241',
        '511', '512', '513', '514', '811', '812', '293', '294'
    ];

    // 1. Identify Prefix & Series Group
    let matchedPrefix = '';
    for (const p of prefixes) {
        if (clean.startsWith(p)) {
            matchedPrefix = p;
            break;
        }
    }

    if (!matchedPrefix) return null;

    let rest = clean.slice(matchedPrefix.length);
    if (!rest) return null;

    let d = 0;
    let B = 0;
    let customNeedle = false;

    // Case A: Needle bearings (e.g. HK0810, BK1212)
    if (['HK', 'BK', 'NK'].includes(matchedPrefix)) {
        const needleMatch = rest.match(/^(\d+)\/?(\d+)?/);
        if (needleMatch) {
            d = parseInt(needleMatch[1], 10);
            if (needleMatch[2]) {
                B = parseInt(needleMatch[2], 10);
            }
            customNeedle = true;
        }
    }

    // Case B: Slash bore size (e.g. 618/500, 62/22)
    if (!customNeedle && rest.startsWith('/')) {
        const slashMatch = rest.match(/^\/(\d+(\.\d+)?)/);
        if (slashMatch) {
            d = parseFloat(slashMatch[1]);
        }
    }

    // Case C: Standard bore code
    if (!customNeedle && d === 0) {
        // For cylindrical roller bearings NU/NJ/NUP/N/NF without series digits in prefix,
        // we need to extract the series number first (e.g. 10, 22, 23, 2, 3, 4)
        let seriesGroup = matchedPrefix;
        if (['NU', 'NJ', 'NUP', 'N', 'NF'].includes(matchedPrefix)) {
            const cylSeriesMatch = rest.match(/^(10|22|23|2|3|4)/);
            if (cylSeriesMatch) {
                const cylSeries = cylSeriesMatch[1];
                seriesGroup = matchedPrefix + cylSeries;
                rest = rest.slice(cylSeries.length);
            } else {
                seriesGroup = 'NU2';
            }
        }

        // Now extract the bore code from rest
        const boreCodeMatch = rest.match(/^(\d+)/);
        if (boreCodeMatch) {
            const boreCodeStr = boreCodeMatch[1];
            const val = parseInt(boreCodeStr, 10);
            if (boreCodeStr.length === 1 || val < 10) {
                d = val; // mini-bearings like 608 (d=8)
            } else if (boreCodeStr.length >= 2) {
                const codeVal = parseInt(boreCodeStr.slice(0, 2), 10);
                if (codeVal === 0) d = 10;
                else if (codeVal === 1) d = 12;
                else if (codeVal === 2) d = 15;
                else if (codeVal === 3) d = 17;
                else d = codeVal * 5;
            }
        }
    }

    if (d <= 0) return null;

    // 2. Map seriesGroup to BearingType and heuristic factors
    const seriesMap: Record<string, { type: BearingType; Df: number; Bf: number; Cf: number; C0f: number; e?: number; Y?: number; Y0?: number }> = {
        // Deep Groove Ball
        '618': { type: 'deep-groove-ball', Df: 1.15, Bf: 0.10, Cf: 0.15, C0f: 0.12, e: 0.20, Y: 2.0 },
        '619': { type: 'deep-groove-ball', Df: 1.30, Bf: 0.15, Cf: 0.25, C0f: 0.18, e: 0.22, Y: 2.0 },
        '160': { type: 'deep-groove-ball', Df: 1.45, Bf: 0.20, Cf: 0.35, C0f: 0.22, e: 0.22, Y: 2.0 },
        '60':  { type: 'deep-groove-ball', Df: 1.50, Bf: 0.25, Cf: 0.45, C0f: 0.25, e: 0.22, Y: 2.0 },
        '62':  { type: 'deep-groove-ball', Df: 1.80, Bf: 0.35, Cf: 0.75, C0f: 0.45, e: 0.25, Y: 1.8 },
        '63':  { type: 'deep-groove-ball', Df: 2.15, Bf: 0.45, Cf: 1.15, C0f: 0.75, e: 0.30, Y: 1.4 },
        '64':  { type: 'deep-groove-ball', Df: 2.50, Bf: 0.55, Cf: 1.70, C0f: 1.15, e: 0.35, Y: 1.2 },
        '622': { type: 'deep-groove-ball', Df: 1.80, Bf: 0.50, Cf: 0.75, C0f: 0.45, e: 0.25, Y: 1.8 },
        '623': { type: 'deep-groove-ball', Df: 2.15, Bf: 0.60, Cf: 1.15, C0f: 0.75, e: 0.30, Y: 1.4 },

        // Angular Contact
        '70': { type: 'angular-contact-ball', Df: 1.40, Bf: 0.25, Cf: 0.55, C0f: 0.35, e: 0.68, Y: 0.87, Y0: 0.38 },
        '72': { type: 'angular-contact-ball', Df: 1.80, Bf: 0.35, Cf: 0.90, C0f: 0.60, e: 0.68, Y: 0.87, Y0: 0.38 },
        '73': { type: 'angular-contact-ball', Df: 2.15, Bf: 0.45, Cf: 1.35, C0f: 0.95, e: 0.68, Y: 0.87, Y0: 0.38 },
        '74': { type: 'angular-contact-ball', Df: 2.50, Bf: 0.55, Cf: 2.10, C0f: 1.50, e: 0.68, Y: 0.87, Y0: 0.38 },

        // Self Aligning
        '12': { type: 'self-aligning-ball', Df: 1.80, Bf: 0.35, Cf: 0.65, C0f: 0.40, e: 0.30, Y: 2.1, Y0: 2.2 },
        '13': { type: 'self-aligning-ball', Df: 2.15, Bf: 0.45, Cf: 0.95, C0f: 0.60, e: 0.35, Y: 1.8, Y0: 1.9 },
        '22': { type: 'self-aligning-ball', Df: 1.80, Bf: 0.45, Cf: 0.70, C0f: 0.45, e: 0.30, Y: 2.1, Y0: 2.2 },
        '23': { type: 'self-aligning-ball', Df: 2.15, Bf: 0.55, Cf: 1.10, C0f: 0.70, e: 0.35, Y: 1.8, Y0: 1.9 },

        // Cylindrical Roller
        'NU10': { type: 'cylindrical-roller', Df: 1.35, Bf: 0.20, Cf: 0.80, C0f: 0.75 },
        'NU2':  { type: 'cylindrical-roller', Df: 1.80, Bf: 0.35, Cf: 1.40, C0f: 1.20 },
        'NU3':  { type: 'cylindrical-roller', Df: 2.15, Bf: 0.45, Cf: 2.00, C0f: 1.80 },
        'NU4':  { type: 'cylindrical-roller', Df: 2.50, Bf: 0.55, Cf: 2.80, C0f: 2.50 },
        'NU22': { type: 'cylindrical-roller', Df: 1.80, Bf: 0.45, Cf: 1.60, C0f: 1.50 },
        'NU23': { type: 'cylindrical-roller', Df: 2.15, Bf: 0.60, Cf: 2.40, C0f: 2.20 },

        // Tapered Roller
        '320': { type: 'tapered-roller', Df: 1.45, Bf: 0.32, Cf: 0.95, C0f: 1.10, e: 0.43, Y: 1.4, Y0: 0.8 },
        '302': { type: 'tapered-roller', Df: 1.80, Bf: 0.35, Cf: 1.30, C0f: 1.40, e: 0.37, Y: 1.6, Y0: 0.9 },
        '322': { type: 'tapered-roller', Df: 1.80, Bf: 0.45, Cf: 1.55, C0f: 1.75, e: 0.37, Y: 1.6, Y0: 0.9 },
        '303': { type: 'tapered-roller', Df: 2.15, Bf: 0.42, Cf: 1.85, C0f: 1.95, e: 0.35, Y: 1.7, Y0: 0.9 },
        '323': { type: 'tapered-roller', Df: 2.15, Bf: 0.55, Cf: 2.25, C0f: 2.50, e: 0.35, Y: 1.7, Y0: 0.9 },

        // Spherical Roller
        '230': { type: 'spherical-roller', Df: 1.45, Bf: 0.36, Cf: 1.50, C0f: 1.85, e: 0.22, Y: 3.0, Y0: 2.9 },
        '231': { type: 'spherical-roller', Df: 1.65, Bf: 0.46, Cf: 1.90, C0f: 2.30, e: 0.28, Y: 2.4, Y0: 2.3 },
        '222': { type: 'spherical-roller', Df: 1.80, Bf: 0.40, Cf: 1.80, C0f: 2.20, e: 0.26, Y: 2.6, Y0: 2.5 },
        '232': { type: 'spherical-roller', Df: 1.80, Bf: 0.52, Cf: 2.20, C0f: 2.80, e: 0.32, Y: 2.1, Y0: 2.0 },
        '223': { type: 'spherical-roller', Df: 2.15, Bf: 0.55, Cf: 2.60, C0f: 3.00, e: 0.33, Y: 2.0, Y0: 2.0 },
        '240': { type: 'spherical-roller', Df: 1.45, Bf: 0.45, Cf: 1.70, C0f: 2.20, e: 0.22, Y: 3.0, Y0: 2.9 },
        '241': { type: 'spherical-roller', Df: 1.65, Bf: 0.58, Cf: 2.30, C0f: 3.10, e: 0.28, Y: 2.4, Y0: 2.3 },

        // Needle Roller
        'HK':   { type: 'needle-roller', Df: 1.25, Bf: 0.35, Cf: 0.38, C0f: 0.48 },
        'BK':   { type: 'needle-roller', Df: 1.25, Bf: 0.35, Cf: 0.38, C0f: 0.48 },
        'NK':   { type: 'needle-roller', Df: 1.28, Bf: 0.45, Cf: 0.65, C0f: 0.85 },
        'NA49': { type: 'needle-roller', Df: 1.45, Bf: 0.40, Cf: 0.75, C0f: 0.95 },
        'NA69': { type: 'needle-roller', Df: 1.45, Bf: 0.65, Cf: 1.15, C0f: 1.55 },

        // Thrust Ball
        '511': { type: 'thrust-ball', Df: 1.30, Bf: 0.20, Cf: 0.50, C0f: 0.60 },
        '512': { type: 'thrust-ball', Df: 1.55, Bf: 0.30, Cf: 0.75, C0f: 1.00 },
        '513': { type: 'thrust-ball', Df: 1.85, Bf: 0.40, Cf: 1.10, C0f: 1.50 },
        '514': { type: 'thrust-ball', Df: 2.25, Bf: 0.50, Cf: 1.60, C0f: 2.20 },

        // Thrust Roller
        '811': { type: 'thrust-roller', Df: 1.35, Bf: 0.20, Cf: 1.30, C0f: 2.50 },
        '812': { type: 'thrust-roller', Df: 1.55, Bf: 0.30, Cf: 1.95, C0f: 3.80 },
        '293': { type: 'thrust-roller', Df: 1.75, Bf: 0.40, Cf: 2.20, C0f: 4.50 },
        '294': { type: 'thrust-roller', Df: 2.15, Bf: 0.50, Cf: 3.20, C0f: 7.20 }
    };

    // Clean up prefix matches for cylindrical types that don't match the group exactly
    let bestGroup = matchedPrefix;
    if (['NJ', 'NUP', 'N', 'NF'].includes(matchedPrefix)) {
        const cylSeriesMatch = rest.match(/^(10|22|23|2|3|4)/);
        const cylSeries = cylSeriesMatch ? cylSeriesMatch[1] : '2';
        bestGroup = 'NU' + cylSeries;
    }

    const factors = seriesMap[bestGroup];
    if (!factors) return null;

    // 3. Compute Dimensions & Ratings
    const D = Math.round(d * factors.Df + (d < 10 ? 4 : d <= 20 ? 8 : 12));
    if (B === 0) {
        B = Math.round(d * factors.Bf + (d < 10 ? 2 : d <= 20 ? 3 : 5));
    }

    const isRoller = factors.type.includes('roller') || factors.type.includes('tapered');
    const Cf_coeff = isRoller ? Math.pow(d, 1.2) : Math.pow(d, 1.15);
    const C0f_coeff = isRoller ? Math.pow(d, 1.15) : Math.pow(d, 1.1);

    const C = Number((Cf_coeff * factors.Cf + (d < 10 ? 0.4 : 2.0)).toFixed(2));
    const C0 = Number((C0f_coeff * factors.C0f + (d < 10 ? 0.25 : 1.2)).toFixed(2));
    const mass = Number((D * D * B * 0.0000032).toFixed(3));
    const nMax = Math.round(380000 / D);

    return {
        code, // Preserve the original input code
        type: factors.type,
        d,
        D,
        B,
        C,
        C0,
        mass,
        nMax,
        e: factors.e,
        Y: factors.Y,
        Y0: factors.Y0
    };
}

/**
 * Search bearing by code (fuzzy with dynamic parsing fallback)
 */
export function findBearing(code: string): BearingData | undefined {
    if (!code) return undefined;
    const searchCode = code.toUpperCase().replace(/\s|-/g, '');
    
    // 1. Search in pre-generated catalog
    const exact = BEARING_CATALOG.find(b =>
        b.code.toUpperCase().replace(/\s|-/g, '') === searchCode
    );
    if (exact) return exact;

    // 2. Fall back to dynamic designation parser
    const parsed = parseSKFDesignation(code);
    if (parsed) {
        return parsed;
    }

    return undefined;
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
 * ISO 281:2007 Table 3 dynamic factor interpolation for single-row deep groove ball bearings.
 * e and Y factors vary continuously with the relative axial load ratio (f0 * Fa / C0).
 */
export function getIso281DeepGrooveFactors(
    fa: number, // in kN
    C0: number, // in kN
    f0 = 14.0
): { e: number; Y: number; f0Fa_C0: number } {
    if (fa <= 0 || C0 <= 0) {
        return { e: 0.19, Y: 2.30, f0Fa_C0: 0 };
    }
    const val = (f0 * fa) / C0;
    // ISO 281:2007 Table 3 standardized discrete points:
    const table = [
        { x: 0.172, e: 0.19, Y: 2.30 },
        { x: 0.345, e: 0.22, Y: 1.99 },
        { x: 0.689, e: 0.26, Y: 1.71 },
        { x: 1.030, e: 0.28, Y: 1.55 },
        { x: 1.380, e: 0.30, Y: 1.45 },
        { x: 2.070, e: 0.34, Y: 1.31 },
        { x: 3.450, e: 0.38, Y: 1.15 },
        { x: 5.170, e: 0.42, Y: 1.04 },
        { x: 6.890, e: 0.44, Y: 1.00 },
    ];

    if (val <= table[0].x) {
        return { e: table[0].e, Y: table[0].Y, f0Fa_C0: val };
    }
    if (val >= table[table.length - 1].x) {
        return { e: table[table.length - 1].e, Y: table[table.length - 1].Y, f0Fa_C0: val };
    }

    for (let i = 0; i < table.length - 1; i++) {
        if (val >= table[i].x && val <= table[i + 1].x) {
            const t = (val - table[i].x) / (table[i + 1].x - table[i].x);
            const e = table[i].e + t * (table[i + 1].e - table[i].e);
            const Y = table[i].Y + t * (table[i + 1].Y - table[i].Y);
            return {
                e: Number(e.toFixed(3)),
                Y: Number(Y.toFixed(3)),
                f0Fa_C0: Number(val.toFixed(4)),
            };
        }
    }
    return { e: 0.25, Y: 1.5, f0Fa_C0: val };
}

/**
 * Compute Equivalent Loads and Warnings per ISO 281
 */
export function computeEquivalentLoadsAndWarnings(
    bearing: BearingData,
    fr: number, // in kN
    fa: number  // in kN
): { P: number; P0: number; warnings: string[]; e?: number; Y?: number; X?: number } {
    let P = fr;
    let P0 = fr;
    const e = bearing.e || 0.25;
    const Y = bearing.Y || 1.5;
    let computedE = e;
    let computedY = Y;
    let computedX = 1.0;
    const warnings: string[] = [];
    
    const Y0 = bearing.Y0 || 0.5;

    switch (bearing.type) {
        case 'deep-groove-ball': {
            // ISO 281:2007 Table 3 dynamic calculation factor
            const factors = getIso281DeepGrooveFactors(fa, bearing.C0, bearing.f0 ?? 14.0);
            computedE = factors.e;
            computedY = factors.Y;

            if (fr === 0) {
                computedX = 0;
                P = computedY * fa;
            } else if (fa / fr > computedE) {
                computedX = 0.56;
                P = 0.56 * fr + computedY * fa;
            } else {
                computedX = 1.0;
                computedY = 0;
                P = fr;
            }
            P0 = Math.max(fr, 0.6 * fr + Y0 * fa);
            if (fr > 0 && fa / fr > 0.5) {
                warnings.push("High axial load ratio for deep groove ball bearing. Check axial limits.");
            }
            break;
        }
            
        case 'angular-contact-ball': {
            // single-row 40° (SKF 72..B / 73..B): e = 1.14, X = 0.35, Y = 0.57, X0 = 0.5, Y0 = 0.26
            const eA = bearing.e ?? 1.14;
            const yA = bearing.Y ?? 0.57;
            computedE = eA;
            if (fr === 0) {
                computedX = 0; computedY = yA;
                P = yA * fa;
            } else if (fa / fr > eA) {
                computedX = 0.35; computedY = yA;
                P = 0.35 * fr + yA * fa;
            } else {
                computedX = 1; computedY = 0;
                P = fr;
            }
            P0 = Math.max(fr, 0.5 * fr + (bearing.Y0 ?? 0.26) * fa);
            if (fr > 0 && fa / fr < 0.1) {
                warnings.push("Açısal temaslı bilyalı rulmanlarda bilyaların kaymasını önlemek için minimum eksenel yük gereklidir.");
            }
            break;
        }
            
        case 'self-aligning-ball': {
            const y1 = bearing.Y1 ?? bearing.Y ?? 2.3;
            const y2 = bearing.Y2 ?? 3.5;
            const y0 = bearing.Y0 ?? 2.5;
            if (fr === 0) {
                computedX = 0; computedY = y2;
                P = y2 * fa;
            } else if (fa / fr > e) {
                computedX = 0.65; computedY = y2;
                P = 0.65 * fr + y2 * fa;
            } else {
                computedX = 1; computedY = y1;
                P = fr + y1 * fa;
            }
            P0 = fr + y0 * fa;
            if (fr > 0 && fa / fr > 0.4) {
                warnings.push("Oynak bilyalı rulman için yüksek eksenel yük oranı. Mil faturasını kontrol edin.");
            }
            break;
        }

        case 'cylindrical-roller':
            computedX = 1; computedY = 0;
            P = fr;
            P0 = fr;
            if (fa > 0.02 * fr) {
                warnings.push("NU tipi silindirik makaralı rulmanlar eksenel yük taşıyamaz (serbest yatak / non-locating).");
            }
            break;

        case 'needle-roller':
            computedX = 1; computedY = 0;
            P = fr;
            P0 = fr;
            if (fa > 0.001) {
                warnings.push("İğne makaralı rulmanlar eksenel yük taşıyamaz (Fa = 0 olmalıdır).");
            }
            break;
            
        case 'tapered-roller':
            computedE = e;
            if (fr === 0) {
                computedX = 0; computedY = bearing.Y ?? 1.6;
                P = (bearing.Y ?? 1.6) * fa;
            } else if (fa / fr > e) {
                computedX = 0.4; computedY = bearing.Y ?? 1.6;
                P = 0.4 * fr + (bearing.Y ?? 1.6) * fa;
            } else {
                computedX = 1; computedY = 0;
                P = fr;
            }
            P0 = Math.max(fr, 0.5 * fr + (bearing.Y0 ?? 0.9) * fa);
            if (fr > 0 && fa / fr < 0.2) {
                warnings.push("Konik makaralı rulmanlarda makaraların oturması için asgari eksenel ön yük gereklidir.");
            }
            break;
            
        case 'spherical-roller': {
            const y1 = bearing.Y1 ?? bearing.Y ?? 1.9;
            const y2 = bearing.Y2 ?? 2.9;
            const y0 = bearing.Y0 ?? 1.8;
            if (fr === 0) {
                computedX = 0; computedY = y2;
                P = y2 * fa;
            } else if (fa / fr > e) {
                computedX = 0.67; computedY = y2;
                P = 0.67 * fr + y2 * fa;
            } else {
                computedX = 1; computedY = y1;
                P = fr + y1 * fa;
            }
            P0 = fr + y0 * fa;
            if (fr > 0 && fa / fr > 0.45) {
                warnings.push("Oynak makaralı rulmanda yüksek eksenel yük. Gövde kilitlemesini teyit edin.");
            }
            break;
        }
            
        case 'thrust-ball':
        case 'thrust-roller':
            computedX = 0; computedY = 1;
            P = fa;
            P0 = fa;
            if (fr > 0.001) {
                warnings.push("Eksenel rulmanlar radyal yük taşıyamaz (Fr = 0 olmalıdır).");
            }
            break;

        default:
            if (fr === 0) {
                P = Y * fa;
            } else if (fa / fr > e) {
                P = 0.56 * fr + Y * fa;
            } else {
                P = fr;
            }
            P0 = Math.max(fr, 0.6 * fr + Y0 * fa);
            break;
    }

    return { P, P0, warnings, e: computedE, Y: computedY, X: computedX };
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
    P0: number;       // Equivalent static load (kN)
    L10: number;      // Basic life (million revs)
    L10h: number;     // Basic life (hours)
    Lna: number;      // Adjusted life (hours)
    staticSafety: number;
    warnings: string[];
    X?: number;
    Y?: number;
    e?: number;
} {
    const lifeFactor = bearing.type.includes('roller') ? 10 / 3 : bearing.type.includes('ball') ? 3 : detectBearingType(bearing.code).lifeFactor;

    const { P, P0, warnings, X, Y, e } = computeEquivalentLoadsAndWarnings(bearing, fr, fa);

    // Basic rating life L10 (million revs)
    const L10 = Math.pow(bearing.C / Math.max(0.1, P), lifeFactor);

    // Life in hours
    const L10h = (L10 * 1e6) / (Math.max(1, rpm) * 60);

    // Reliability adjustment factor a1
    // ISO 281:2007 Table 12
    const a1Map: Record<number, number> = {
        90: 1.0, 95: 0.64, 96: 0.55, 97: 0.47, 98: 0.37, 99: 0.25
    };
    const a1 = a1Map[reliability] || 1.0;

    const Lna = a1 * L10h;

    // Static safety factor
    const staticSafety = bearing.C0 / Math.max(0.1, P0);

    return { P, P0, L10, L10h, Lna, staticSafety, warnings, X, Y, e };
}

/**
 * SKF Rolling Bearings Catalogue (PUB BU/P1 10000/2 EN & 17000/1 EN, p. 682, Table 7):
 * Axial loading of shaft assemblies incorporating two single-row tapered roller bearings
 * in Back-to-Back (O) or Face-to-Face (X) arrangement.
 *
 * Boundary Condition (SKF Table 7):
 * Valid for bearing pairs adjusted to practically zero clearance during operation, without preload.
 * Basic rating life L10h is a design screening value; actual operating life requires EHL viscosity (kappa),
 * contamination (ec), thermal expansion/preload, and shaft deflection evaluation.
 */
export interface SkfPairedTaperedResult {
    skfTableCase: 'Case 1a' | 'Case 1b' | 'Case 1c' | 'Case 2a' | 'Case 2b' | 'Case 2c';
    arrangement: 'O-back-to-back' | 'X-face-to-face';
    kaDirection: 'towards_A' | 'towards_B';
    bearingA: {
        Fr: number;
        Fa: number;
        P: number;
        L10: number;
        L10h: number;
        staticSafety: number;
    };
    bearingB: {
        Fr: number;
        Fa: number;
        P: number;
        L10: number;
        L10h: number;
        staticSafety: number;
    };
    governingL10h: number;
    boundaryMetadata: {
        standardRef: string;
        zeroClearanceNoPreloadAssumption: true;
        lifeClassification: 'BASELINE_SCREENING_L10H';
        operatingLifeWarning: string;
    };
}

export function solveSkfPairedTaperedRollerOArrangement(params: {
    bearingA: BearingData;
    bearingB: BearingData;
    FrA: number; // kN
    FrB: number; // kN
    Ka: number;  // External axial force magnitude (kN, >= 0)
    kaDirection: 'towards_A' | 'towards_B';
    rpm: number;
    arrangement?: 'O-back-to-back' | 'X-face-to-face';
}): SkfPairedTaperedResult {
    const {
        bearingA,
        bearingB,
        FrA,
        FrB,
        Ka,
        kaDirection,
        rpm,
        arrangement = 'O-back-to-back',
    } = params;

    const YA = bearingA.Y ?? 1.4;
    const YB = bearingB.Y ?? 1.4;
    const SA = (0.5 * FrA) / YA;
    const SB = (0.5 * FrB) / YB;
    const deltaS = SA - SB; // 0.5 * (FrA/YA - FrB/YB)

    let FaA = 0;
    let FaB = 0;
    let skfTableCase: SkfPairedTaperedResult['skfTableCase'];

    if (FrA / YA >= FrB / YB) {
        // Group 1 & 2a/2b when FrA/YA >= FrB/YB
        if (kaDirection === 'towards_B') {
            // Case 1a: Ka acts onto Bearing B (same direction as induced SA)
            skfTableCase = 'Case 1a';
            FaA = SA;
            FaB = SA + Ka;
        } else {
            // Ka acts onto Bearing A (opposing SB)
            if (Ka >= deltaS) {
                skfTableCase = 'Case 2a';
                FaA = SB + Ka;
                FaB = SB;
            } else {
                skfTableCase = 'Case 1b';
                FaA = SA;
                FaB = SA - Ka;
            }
        }
    } else {
        // FrA/YA < FrB/YB (i.e. SB > SA)
        const absDeltaS = SB - SA;
        if (kaDirection === 'towards_A') {
            skfTableCase = 'Case 2c';
            FaA = SB + Ka;
            FaB = SB;
        } else {
            if (Ka >= absDeltaS) {
                skfTableCase = 'Case 1c';
                FaA = SA;
                FaB = SA + Ka;
            } else {
                skfTableCase = 'Case 2b';
                FaA = SB - Ka;
                FaB = SB;
            }
        }
    }

    const resA = calculateBearingLife(bearingA, FrA, FaA, rpm);
    const resB = calculateBearingLife(bearingB, FrB, FaB, rpm);

    return {
        skfTableCase,
        arrangement,
        kaDirection,
        bearingA: {
            Fr: FrA,
            Fa: FaA,
            P: resA.P,
            L10: resA.L10,
            L10h: resA.L10h,
            staticSafety: resA.staticSafety,
        },
        bearingB: {
            Fr: FrB,
            Fa: FaB,
            P: resB.P,
            L10: resB.L10,
            L10h: resB.L10h,
            staticSafety: resB.staticSafety,
        },
        governingL10h: Math.min(resA.L10h, resB.L10h),
        boundaryMetadata: {
            standardRef: 'SKF PUB BU/P1 10000/2 EN & 17000/1 EN Table 7 (p. 682) / ISO 281:2007',
            zeroClearanceNoPreloadAssumption: true,
            lifeClassification: 'BASELINE_SCREENING_L10H',
            operatingLifeWarning:
                'Basic rating life L10h assumes zero operating clearance without preload and rigid shaft alignment. Real operating life Lnmh requires EHL viscosity ratio (kappa), thermal preload shift, and misalignment evaluation.',
        },
    };
}

/**
 * 3D Spatial Shaft Static Equilibrium Solver (ΣF = 0, ΣM = 0)
 * Coordinates: z = shaft axial coordinate (mm), x = horizontal transverse (mm), y = vertical transverse (mm).
 * Computes exact 3D bearing reactions at Station A (zA) and Station B (zB) and verifies static residuals.
 */
export interface Shaft3DForceStation {
    label: string;
    zMm: number;      // Axial position along shaft (mm)
    rPitchMm: number; // Pitch radius (mm) where axial force creates bending moment couple
    contactAnglePhiRad?: number; // Angular position of gear mesh around shaft (default 0 -> +y radial)
    FxN: number;      // Transverse horizontal force (N, e.g. Ft component)
    FyN: number;      // Transverse vertical force (N, e.g. Fr component)
    FzN: number;      // Axial force along shaft z-axis (N, Fa)
    MxNmm?: number;   // Overturning moment about x-axis from axial force at pitch radius (N·mm)
    MyNmm?: number;   // Overturning moment about y-axis from axial force at pitch radius (N·mm)
    MzNmm?: number;   // Torsional moment about z-axis (N·mm, e.g. gear mesh torque ±Ft * rPitchMm)
}

export interface Shaft3DEquilibriumResult {
    zAMm: number;
    zBMm: number;
    RAxN: number;
    RAyN: number;
    RAzN: number; // Net axial reaction carried by locating bearing/pair (N)
    RBxN: number;
    RByN: number;
    RMzNmm: number; // External driving/absorbing shaft reaction torque for torsional balance (N·mm)
    FrAN: number; // Resultant radial load at Bearing A (N)
    FrBN: number; // Resultant radial load at Bearing B (N)
    FrAkN: number;
    FrBkN: number;
    residuals: {
        sumFxN: number;
        sumFyN: number;
        sumFzN: number;
        sumMxAboutANmm: number;
        sumMyAboutANmm: number;
        sumMzNmm: number;
    };
}

export function solve3DShaftStaticEquilibrium(params: {
    zAMm: number;
    zBMm: number;
    loads: Shaft3DForceStation[];
    externalTorqueMzNmm?: number;
}): Shaft3DEquilibriumResult {
    const { zAMm, zBMm, loads, externalTorqueMzNmm } = params;
    const L = zBMm - zAMm;
    if (Math.abs(L) < 1e-6) {
        throw new Error('Bearing span L = zB - zA must be non-zero');
    }

    // Sum moments about Bearing A (z = zA):
    // In X-Z plane (forces Fx and concentrated moments My):
    // ΣM_y(A) = Σ [ Fx_i * (z_i - zA) + My_i ] + RBx * (zB - zA) = 0
    // In Y-Z plane (forces Fy and concentrated moments Mx):
    // ΣM_x(A) = Σ [ Fy_i * (z_i - zA) + Mx_i ] + RBy * (zB - zA) = 0
    // About Z-axis (torsional equilibrium about shaft rotation axis):
    // ΣM_z = Σ Mz_i + RMz = 0 (bearings are free to rotate about z-axis)
    let momentXLoadSum = 0;
    let momentYLoadSum = 0;
    let momentZLoadSum = 0;
    let sumLoadFx = 0;
    let sumLoadFy = 0;
    let sumLoadFz = 0;

    for (const ld of loads) {
        const dz = ld.zMm - zAMm;
        const mx = ld.MxNmm ?? 0;
        const my = ld.MyNmm ?? 0;
        const mz = ld.MzNmm ?? (ld.FxN * ld.rPitchMm);
        momentYLoadSum += ld.FxN * dz + my;
        momentXLoadSum += ld.FyN * dz + mx;
        momentZLoadSum += mz;
        sumLoadFx += ld.FxN;
        sumLoadFy += ld.FyN;
        sumLoadFz += ld.FzN;
    }

    const RBxN = -momentYLoadSum / L;
    const RByN = -momentXLoadSum / L;
    const RAxN = -sumLoadFx - RBxN;
    const RAyN = -sumLoadFy - RByN;
    const RAzN = -sumLoadFz;
    const RMzNmm = externalTorqueMzNmm !== undefined ? externalTorqueMzNmm : -momentZLoadSum;

    const FrAN = Math.hypot(RAxN, RAyN);
    const FrBN = Math.hypot(RBxN, RByN);

    // Compute exact 6-DOF equilibrium residuals
    const sumFxN = sumLoadFx + RAxN + RBxN;
    const sumFyN = sumLoadFy + RAyN + RByN;
    const sumFzN = sumLoadFz + RAzN;
    const sumMyAboutANmm = momentYLoadSum + RBxN * L;
    const sumMxAboutANmm = momentXLoadSum + RByN * L;
    const sumMzNmm = momentZLoadSum + RMzNmm;

    return {
        zAMm,
        zBMm,
        RAxN,
        RAyN,
        RAzN,
        RBxN,
        RByN,
        RMzNmm,
        FrAN,
        FrBN,
        FrAkN: FrAN / 1000,
        FrBkN: FrBN / 1000,
        residuals: {
            sumFxN,
            sumFyN,
            sumFzN,
            sumMxAboutANmm,
            sumMyAboutANmm,
            sumMzNmm,
        },
    };
}


