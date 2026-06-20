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
 * Compute Equivalent Loads and Warnings per ISO 281
 */
export function computeEquivalentLoadsAndWarnings(
    bearing: BearingData,
    fr: number, // in kN
    fa: number  // in kN
): { P: number; P0: number; warnings: string[] } {
    let P = fr;
    let P0 = fr;
    const warnings: string[] = [];
    
    const e = bearing.e || 0.25;
    const Y = bearing.Y || 1.5;
    const Y0 = bearing.Y0 || 0.5;

    switch (bearing.type) {
        case 'deep-groove-ball':
            if (fr === 0) {
                P = Y * fa;
            } else if (fa / fr > e) {
                P = 0.56 * fr + Y * fa;
            } else {
                P = fr;
            }
            P0 = Math.max(fr, 0.6 * fr + Y0 * fa);
            if (fr > 0 && fa / fr > 0.5) {
                warnings.push("High axial load ratio for deep groove ball bearing. Check axial limits.");
            }
            break;
            
        case 'angular-contact-ball':
            if (fr === 0) {
                P = Y * fa;
            } else if (fa / fr > e) {
                P = 0.44 * fr + Y * fa;
            } else {
                P = fr;
            }
            P0 = Math.max(fr, 0.5 * fr + (bearing.Y0 || 0.47) * fa);
            if (fr > 0 && fa / fr < 0.1) {
                warnings.push("Angular contact ball bearings require a minimum axial load to prevent ball skidding.");
            }
            break;
            
        case 'cylindrical-roller':
            P = fr;
            P0 = fr;
            if (fa > 0.05 * fr) {
                warnings.push("NU/N cylindrical roller bearings cannot accommodate significant axial loads without special design.");
            }
            break;
            
        case 'tapered-roller':
            if (fr === 0) {
                P = (bearing.Y || 1.6) * fa;
            } else if (fa / fr > e) {
                P = 0.4 * fr + (bearing.Y || 1.6) * fa;
            } else {
                P = fr;
            }
            P0 = Math.max(fr, 0.5 * fr + (bearing.Y0 || 0.9) * fa);
            if (fr > 0 && fa / fr < 0.2) {
                warnings.push("Tapered roller bearings require minimum axial load to maintain roller tracking.");
            }
            break;
            
        case 'spherical-roller':
            if (fr === 0) {
                P = (bearing.Y || 2.0) * fa;
            } else if (fa / fr > e) {
                P = 0.67 * fr + 1.5 * (bearing.Y || 2.0) * fa;
            } else {
                P = fr + (bearing.Y || 2.0) * fa;
            }
            P0 = fr + (bearing.Y0 || 2.5) * fa;
            if (fr > 0 && fa / fr > 0.4) {
                warnings.push("High axial load on spherical roller bearing. Ensure proper housing locking.");
            }
            break;
            
        case 'thrust-ball':
            P = fa;
            P0 = fa;
            if (fr > 0.05 * fa) {
                warnings.push("Thrust ball bearings cannot tolerate radial load. Excessive radial load will cause premature failure.");
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

    return { P, P0, warnings };
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
} {
    const { lifeFactor } = detectBearingType(bearing.code);

    const { P, P0, warnings } = computeEquivalentLoadsAndWarnings(bearing, fr, fa);

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
    const staticSafety = bearing.C0 / Math.max(0.1, P0);

    return { P, P0, L10, L10h, Lna, staticSafety, warnings };
}

