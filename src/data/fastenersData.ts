import {
    computeThreadProfile,
    kindOf,
    pitchMmFromTpi,
    roundedCatalogRow,
    unStressAreaMm2,
    type ThreadTypeCode,
} from '@/lib/fastener/threadProfiles';

export type FastenerStandardId =
    | 'ISO Metric'
    | 'ISO Metric Fine'
    | 'UNC'
    | 'UNF'
    | 'UNEF'
    | 'BSW'
    | 'BSF'
    | 'BSPP (G)'
    | 'BSPT (R)'
    | 'NPT'
    | 'NPTF'
    | 'NPSM'
    | 'JIC 37°'
    | 'ORFS'
    | 'Trapezoidal (Tr)'
    | 'ACME'
    | 'Buttress (S)'
    | 'Square'
    | 'Round (Rd)'
    | 'Panzergewinde (Pg)'
    | 'Edison (E)'
    | 'Valve (Vg)'
    | 'Gas Cylinder (W)';

export interface Fastener {
    standard: FastenerStandardId;
    size: string;
    pitch: number; // mm (or TPI for imperial, handled by logic)
    majorDia: number; // mm
    minorDia: number; // mm
    pitchDia: number; // mm
    tapDrill: number; // mm
    stressArea: number; // mm^2 (approx for pipe)
}

const MM = 25.4;

function r3(n: number) { return Math.round(n * 1000) / 1000; }
function r2(n: number) { return Math.round(n * 100) / 100; }

function isoRow(standard: FastenerStandardId, size: string, d: number, P: number, type: ThreadTypeCode = 'M'): Fastener {
    const g = roundedCatalogRow(computeThreadProfile(type, d, P));
    return { standard, size, pitch: P, ...g };
}

function imperialRow(
    standard: FastenerStandardId,
    size: string,
    dInch: number,
    tpi: number,
    type: ThreadTypeCode,
): Fastener {
    const d = dInch * MM;
    const P = pitchMmFromTpi(tpi);
    const g = roundedCatalogRow(computeThreadProfile(type, d, P));
    const kind = kindOf(type);
    const stressArea = kind === 'iso60' ? unStressAreaMm2(dInch, tpi) : g.stressArea;
    return {
        standard,
        size,
        pitch: tpi,
        majorDia: r3(d),
        minorDia: g.minorDia,
        pitchDia: g.pitchDia,
        tapDrill: g.tapDrill > 0 ? g.tapDrill : r2(Math.max(d - P, 0)),
        stressArea: Math.round(stressArea * 10) / 10,
    };
}

function pipeRow(standard: FastenerStandardId, size: string, majorMm: number, tpi: number, type: ThreadTypeCode): Fastener {
    const P = pitchMmFromTpi(tpi);
    const g = roundedCatalogRow(computeThreadProfile(type, majorMm, P));
    return {
        standard,
        size,
        pitch: tpi,
        majorDia: r3(majorMm),
        minorDia: g.minorDia,
        pitchDia: g.pitchDia,
        tapDrill: g.tapDrill > 0 ? g.tapDrill : r2(type === 'BSPT' || type === 'NPT' || type === 'NPTF' ? Math.max(majorMm - 1.1 * P, 0) : Math.max(majorMm - P, 0)),
        stressArea: g.stressArea,
    };
}

/** ISO 261 preferred fine pitches beyond the original five rows. */
const METRIC_FINE_EXTRA: Fastener[] = [
    isoRow('ISO Metric Fine', 'M3x0.35', 3, 0.35, 'MF'),
    isoRow('ISO Metric Fine', 'M4x0.5', 4, 0.5, 'MF'),
    isoRow('ISO Metric Fine', 'M5x0.5', 5, 0.5, 'MF'),
    isoRow('ISO Metric Fine', 'M6x0.75', 6, 0.75, 'MF'),
    isoRow('ISO Metric Fine', 'M8x0.75', 8, 0.75, 'MF'),
    isoRow('ISO Metric Fine', 'M14x1.5', 14, 1.5, 'MF'),
    isoRow('ISO Metric Fine', 'M16x1.5', 16, 1.5, 'MF'),
    isoRow('ISO Metric Fine', 'M18x1.5', 18, 1.5, 'MF'),
    isoRow('ISO Metric Fine', 'M18x2', 18, 2, 'MF'),
    isoRow('ISO Metric Fine', 'M20x1.5', 20, 1.5, 'MF'),
    isoRow('ISO Metric Fine', 'M20x2', 20, 2, 'MF'),
    isoRow('ISO Metric Fine', 'M22x1.5', 22, 1.5, 'MF'),
    isoRow('ISO Metric Fine', 'M22x2', 22, 2, 'MF'),
    isoRow('ISO Metric Fine', 'M24x2', 24, 2, 'MF'),
    isoRow('ISO Metric Fine', 'M27x2', 27, 2, 'MF'),
    isoRow('ISO Metric Fine', 'M30x2', 30, 2, 'MF'),
    isoRow('ISO Metric Fine', 'M33x2', 33, 2, 'MF'),
    isoRow('ISO Metric Fine', 'M36x3', 36, 3, 'MF'),
    isoRow('ISO Metric Fine', 'M42x3', 42, 3, 'MF'),
    isoRow('ISO Metric Fine', 'M48x3', 48, 3, 'MF'),
    isoRow('ISO Metric Fine', 'M56x4', 56, 4, 'MF'),
    isoRow('ISO Metric Fine', 'M64x4', 64, 4, 'MF'),
];

/** UNC/UNF gaps + full UNEF (ASME B1.1). pitch stored as TPI. */
const UN_SERIES_EXTRA: Fastener[] = [
    imperialRow('UNC', '#0-80', 0.0600, 80, 'UNC'),
    imperialRow('UNC', '#3-48', 0.0990, 48, 'UNC'),
    imperialRow('UNC', '#5-40', 0.1250, 40, 'UNC'),
    imperialRow('UNC', '#12-24', 0.2160, 24, 'UNC'),
    imperialRow('UNC', '9/16-12', 0.5625, 12, 'UNC'),
    imperialRow('UNC', '1-3/8-6', 1.375, 6, 'UNC'),
    imperialRow('UNC', '2-1/4-4.5', 2.250, 4.5, 'UNC'),
    imperialRow('UNC', '2-3/4-4', 2.750, 4, 'UNC'),
    imperialRow('UNC', '3-1/2-4', 3.500, 4, 'UNC'),
    imperialRow('UNF', '#0-80', 0.0600, 80, 'UNF'),
    imperialRow('UNF', '#1-72', 0.0730, 72, 'UNF'),
    imperialRow('UNF', '#2-64', 0.0860, 64, 'UNF'),
    imperialRow('UNF', '#3-56', 0.0990, 56, 'UNF'),
    imperialRow('UNF', '#4-48', 0.1120, 48, 'UNF'),
    imperialRow('UNF', '#5-44', 0.1250, 44, 'UNF'),
    imperialRow('UNF', '#6-40', 0.1380, 40, 'UNF'),
    imperialRow('UNF', '#8-36', 0.1640, 36, 'UNF'),
    imperialRow('UNF', '#12-28', 0.2160, 28, 'UNF'),
    imperialRow('UNF', '9/16-18', 0.5625, 18, 'UNF'),
    imperialRow('UNF', '1-1/8-12', 1.125, 12, 'UNF'),
    imperialRow('UNF', '1-3/8-12', 1.375, 12, 'UNF'),
    imperialRow('UNEF', '#12-32', 0.2160, 32, 'UNEF'),
    imperialRow('UNEF', '1/4-32', 0.2500, 32, 'UNEF'),
    imperialRow('UNEF', '5/16-32', 0.3125, 32, 'UNEF'),
    imperialRow('UNEF', '3/8-32', 0.3750, 32, 'UNEF'),
    imperialRow('UNEF', '7/16-28', 0.4375, 28, 'UNEF'),
    imperialRow('UNEF', '1/2-28', 0.5000, 28, 'UNEF'),
    imperialRow('UNEF', '9/16-24', 0.5625, 24, 'UNEF'),
    imperialRow('UNEF', '5/8-24', 0.6250, 24, 'UNEF'),
    imperialRow('UNEF', '3/4-20', 0.7500, 20, 'UNEF'),
    imperialRow('UNEF', '7/8-20', 0.8750, 20, 'UNEF'),
    imperialRow('UNEF', '1-20', 1.0000, 20, 'UNEF'),
    imperialRow('UNEF', '1-1/8-18', 1.125, 18, 'UNEF'),
    imperialRow('UNEF', '1-1/4-18', 1.250, 18, 'UNEF'),
    imperialRow('UNEF', '1-3/8-18', 1.375, 18, 'UNEF'),
    imperialRow('UNEF', '1-1/2-18', 1.500, 18, 'UNEF'),
];

/** BS 84 Whitworth coarse (BSW) and fine (BSF). */
const WHITWORTH_EXTRA: Fastener[] = [
    imperialRow('BSW', 'W 1/8', 0.125, 40, 'W'),
    imperialRow('BSW', 'W 3/16', 0.1875, 24, 'W'),
    imperialRow('BSW', 'W 1/4', 0.250, 20, 'W'),
    imperialRow('BSW', 'W 5/16', 0.3125, 18, 'W'),
    imperialRow('BSW', 'W 3/8', 0.375, 16, 'W'),
    imperialRow('BSW', 'W 7/16', 0.4375, 14, 'W'),
    imperialRow('BSW', 'W 1/2', 0.500, 12, 'W'),
    imperialRow('BSW', 'W 9/16', 0.5625, 12, 'W'),
    imperialRow('BSW', 'W 5/8', 0.625, 11, 'W'),
    imperialRow('BSW', 'W 3/4', 0.750, 10, 'W'),
    imperialRow('BSW', 'W 7/8', 0.875, 9, 'W'),
    imperialRow('BSW', 'W 1', 1.000, 8, 'W'),
    imperialRow('BSW', 'W 1-1/8', 1.125, 7, 'W'),
    imperialRow('BSW', 'W 1-1/4', 1.250, 7, 'W'),
    imperialRow('BSW', 'W 1-1/2', 1.500, 6, 'W'),
    imperialRow('BSW', 'W 1-3/4', 1.750, 5, 'W'),
    imperialRow('BSW', 'W 2', 2.000, 4.5, 'W'),
    imperialRow('BSF', 'BSF 3/16', 0.1875, 32, 'BSF'),
    imperialRow('BSF', 'BSF 1/4', 0.250, 26, 'BSF'),
    imperialRow('BSF', 'BSF 5/16', 0.3125, 22, 'BSF'),
    imperialRow('BSF', 'BSF 3/8', 0.375, 20, 'BSF'),
    imperialRow('BSF', 'BSF 7/16', 0.4375, 18, 'BSF'),
    imperialRow('BSF', 'BSF 1/2', 0.500, 16, 'BSF'),
    imperialRow('BSF', 'BSF 9/16', 0.5625, 16, 'BSF'),
    imperialRow('BSF', 'BSF 5/8', 0.625, 14, 'BSF'),
    imperialRow('BSF', 'BSF 3/4', 0.750, 12, 'BSF'),
    imperialRow('BSF', 'BSF 7/8', 0.875, 11, 'BSF'),
    imperialRow('BSF', 'BSF 1', 1.000, 10, 'BSF'),
    imperialRow('BSF', 'BSF 1-1/8', 1.125, 9, 'BSF'),
    imperialRow('BSF', 'BSF 1-1/4', 1.250, 9, 'BSF'),
    imperialRow('BSF', 'BSF 1-1/2', 1.500, 8, 'BSF'),
    imperialRow('BSF', 'BSF 1-3/4', 1.750, 7, 'BSF'),
    imperialRow('BSF', 'BSF 2', 2.000, 7, 'BSF'),
];

/**
 * ISO 228-1 BSPP sizes missing from the original 11-row table,
 * plus NPTF dryseal clones of the common NPT gauge-OD set.
 * Major diameters: ISO 228-1 table 1.
 */
const PIPE_EXTRA: Fastener[] = [
    pipeRow('BSPP (G)', 'G 1/16', 7.723, 28, 'G'),
    pipeRow('BSPP (G)', 'G 5/8', 22.911, 14, 'G'),
    pipeRow('BSPP (G)', 'G 7/8', 30.201, 14, 'G'),
    pipeRow('BSPP (G)', 'G 1-1/8', 37.897, 11, 'G'),
    pipeRow('BSPP (G)', 'G 1-3/8', 44.323, 11, 'G'),
    pipeRow('BSPP (G)', 'G 1-3/4', 53.746, 11, 'G'),
    pipeRow('BSPP (G)', 'G 2-1/4', 65.710, 11, 'G'),
    pipeRow('BSPP (G)', 'G 2-3/4', 81.534, 11, 'G'),
    pipeRow('BSPP (G)', 'G 3-1/4', 93.980, 11, 'G'),
    pipeRow('BSPP (G)', 'G 3-1/2', 100.330, 11, 'G'),
    pipeRow('BSPP (G)', 'G 3-3/4', 106.680, 11, 'G'),
    pipeRow('BSPP (G)', 'G 4', 113.030, 11, 'G'),
    pipeRow('BSPP (G)', 'G 5', 138.430, 11, 'G'),
    pipeRow('BSPP (G)', 'G 6', 163.830, 11, 'G'),
    pipeRow('BSPT (R)', 'R 5/8', 22.911, 14, 'BSPT'),
    pipeRow('BSPT (R)', 'R 7/8', 30.201, 14, 'BSPT'),
    pipeRow('BSPT (R)', 'R 3-1/4', 93.980, 11, 'BSPT'),
    pipeRow('BSPT (R)', 'R 3-3/4', 106.680, 11, 'BSPT'),
    pipeRow('NPTF', '1/16 NPTF', 7.950, 27, 'NPTF'),
    pipeRow('NPTF', '1/8 NPTF', 10.287, 27, 'NPTF'),
    pipeRow('NPTF', '1/4 NPTF', 13.716, 18, 'NPTF'),
    pipeRow('NPTF', '3/8 NPTF', 17.145, 18, 'NPTF'),
    pipeRow('NPTF', '1/2 NPTF', 21.336, 14, 'NPTF'),
    pipeRow('NPTF', '3/4 NPTF', 26.670, 14, 'NPTF'),
    pipeRow('NPTF', '1 NPTF', 33.401, 11.5, 'NPTF'),
    pipeRow('NPTF', '1-1/4 NPTF', 42.164, 11.5, 'NPTF'),
    pipeRow('NPTF', '1-1/2 NPTF', 48.260, 11.5, 'NPTF'),
    pipeRow('NPTF', '2 NPTF', 60.325, 11.5, 'NPTF'),
];

const POWER_SCREW_EXTRA: Fastener[] = [
    isoRow('Trapezoidal (Tr)', 'Tr 8x1.5', 8, 1.5, 'Tr'),
    isoRow('Trapezoidal (Tr)', 'Tr 14x3', 14, 3, 'Tr'),
    isoRow('Trapezoidal (Tr)', 'Tr 18x4', 18, 4, 'Tr'),
    isoRow('Trapezoidal (Tr)', 'Tr 22x5', 22, 5, 'Tr'),
    isoRow('Trapezoidal (Tr)', 'Tr 26x5', 26, 5, 'Tr'),
    isoRow('Trapezoidal (Tr)', 'Tr 28x5', 28, 5, 'Tr'),
    isoRow('Trapezoidal (Tr)', 'Tr 30x6', 30, 6, 'Tr'),
    isoRow('Trapezoidal (Tr)', 'Tr 32x6', 32, 6, 'Tr'),
    isoRow('Trapezoidal (Tr)', 'Tr 36x6', 36, 6, 'Tr'),
    isoRow('Trapezoidal (Tr)', 'Tr 40x7', 40, 7, 'Tr'),
    isoRow('Trapezoidal (Tr)', 'Tr 48x8', 48, 8, 'Tr'),
    imperialRow('ACME', 'Acme 1/4-16', 0.250, 16, 'Acme'),
    imperialRow('ACME', 'Acme 3/8-12', 0.375, 12, 'Acme'),
    imperialRow('ACME', 'Acme 1/2-10', 0.500, 10, 'Acme'),
    imperialRow('ACME', 'Acme 5/8-8', 0.625, 8, 'Acme'),
    imperialRow('ACME', 'Acme 3/4-6', 0.750, 6, 'Acme'),
    imperialRow('ACME', 'Acme 1-5', 1.000, 5, 'Acme'),
    imperialRow('ACME', 'Acme 1-1/2-4', 1.500, 4, 'Acme'),
    imperialRow('ACME', 'Acme 2-4', 2.000, 4, 'Acme'),
    isoRow('Buttress (S)', 'S 16x4', 16, 4, 'S'),
    isoRow('Buttress (S)', 'S 20x5', 20, 5, 'S'),
    isoRow('Buttress (S)', 'S 24x5', 24, 5, 'S'),
    isoRow('Buttress (S)', 'S 32x6', 32, 6, 'S'),
    isoRow('Buttress (S)', 'S 40x7', 40, 7, 'S'),
    isoRow('Buttress (S)', 'S 48x8', 48, 8, 'S'),
    isoRow('Square', 'Sq 16x4', 16, 4, 'Sq'),
    isoRow('Square', 'Sq 20x5', 20, 5, 'Sq'),
    isoRow('Square', 'Sq 24x6', 24, 6, 'Sq'),
    isoRow('Square', 'Sq 32x6', 32, 6, 'Sq'),
    isoRow('Square', 'Sq 40x8', 40, 8, 'Sq'),
    isoRow('Round (Rd)', 'Rd 12', 12, 2.54, 'Rd'),
    isoRow('Round (Rd)', 'Rd 16', 16, 2.54, 'Rd'),
    isoRow('Round (Rd)', 'Rd 20', 20, 2.54, 'Rd'),
    isoRow('Round (Rd)', 'Rd 24', 24, 3.175, 'Rd'),
    isoRow('Round (Rd)', 'Rd 30', 30, 3.175, 'Rd'),
    isoRow('Round (Rd)', 'Rd 36', 36, 3.175, 'Rd'),
    isoRow('Round (Rd)', 'Rd 40', 40, 3.175, 'Rd'),
    isoRow('Round (Rd)', 'Rd 48', 48, 6.35, 'Rd'),
    isoRow('Round (Rd)', 'Rd 60', 60, 6.35, 'Rd'),
];

const SPECIALTY_EXTRA: Fastener[] = [
    // --- Panzergewinde (Pg - DIN 40430) 80° Flank Angle ---
    isoRow('Panzergewinde (Pg)', 'Pg 7', 12.5, 1.27, 'Pg'),
    isoRow('Panzergewinde (Pg)', 'Pg 9', 15.2, 1.41, 'Pg'),
    isoRow('Panzergewinde (Pg)', 'Pg 11', 18.6, 1.41, 'Pg'),
    isoRow('Panzergewinde (Pg)', 'Pg 13.5', 20.4, 1.41, 'Pg'),
    isoRow('Panzergewinde (Pg)', 'Pg 16', 22.5, 1.41, 'Pg'),
    isoRow('Panzergewinde (Pg)', 'Pg 21', 28.3, 1.588, 'Pg'),
    isoRow('Panzergewinde (Pg)', 'Pg 29', 37.0, 1.588, 'Pg'),
    isoRow('Panzergewinde (Pg)', 'Pg 36', 47.0, 1.588, 'Pg'),
    isoRow('Panzergewinde (Pg)', 'Pg 42', 54.0, 1.588, 'Pg'),
    isoRow('Panzergewinde (Pg)', 'Pg 48', 59.3, 1.588, 'Pg'),

    // --- Edison Sockets (IEC 60061) Round Wave ---
    isoRow('Edison (E)', 'E10', 10.0, 1.81, 'Edison'),
    isoRow('Edison (E)', 'E12', 12.0, 2.54, 'Edison'),
    isoRow('Edison (E)', 'E14', 14.0, 2.82, 'Edison'),
    isoRow('Edison (E)', 'E27', 27.0, 3.628, 'Edison'),
    isoRow('Edison (E)', 'E40', 40.0, 6.35, 'Edison'),

    // --- JIC 37° Flared Hydraulic (SAE J514 / ISO 8434-2) ---
    imperialRow('JIC 37°', '7/16-20 (-04)', 7 / 16, 20, 'JIC'),
    imperialRow('JIC 37°', '1/2-20 (-05)', 1 / 2, 20, 'JIC'),
    imperialRow('JIC 37°', '9/16-18 (-06)', 9 / 16, 18, 'JIC'),
    imperialRow('JIC 37°', '3/4-16 (-08)', 3 / 4, 16, 'JIC'),
    imperialRow('JIC 37°', '7/8-14 (-10)', 7 / 8, 14, 'JIC'),
    imperialRow('JIC 37°', '1-1/16-12 (-12)', 17 / 16, 12, 'JIC'),
    imperialRow('JIC 37°', '1-5/16-12 (-16)', 21 / 16, 12, 'JIC'),
    imperialRow('JIC 37°', '1-5/8-12 (-20)', 26 / 16, 12, 'JIC'),

    // --- ORFS (O-Ring Face Seal SAE J1453) ---
    imperialRow('ORFS', '9/16-18 (-04)', 9 / 16, 18, 'ORFS'),
    imperialRow('ORFS', '11/16-16 (-06)', 11 / 16, 16, 'ORFS'),
    imperialRow('ORFS', '13/16-16 (-08)', 13 / 16, 16, 'ORFS'),
    imperialRow('ORFS', '1-14 (-10)', 1.0, 14, 'ORFS'),
    imperialRow('ORFS', '1-3/16-12 (-12)', 19 / 16, 12, 'ORFS'),
    imperialRow('ORFS', '1-7/16-12 (-16)', 23 / 16, 12, 'ORFS'),

    // --- Pneumatic Tire Valves (Vg - DIN 7756 / ISO 4570) ---
    isoRow('Valve (Vg)', 'Vg 5', 5.2, 0.907, 'Vg'),
    isoRow('Valve (Vg)', 'Vg 8', 7.7, 0.794, 'Vg'),
    isoRow('Valve (Vg)', 'Vg 10', 10.3, 0.907, 'Vg'),
    isoRow('Valve (Vg)', 'Vg 12', 12.2, 0.907, 'Vg'),

    // --- Gas Cylinder Valves (DIN 477-1) ---
    isoRow('Gas Cylinder (W)', 'W 19.8x1/14"', 19.8, 1.814, 'W'),
    isoRow('Gas Cylinder (W)', 'W 21.8x1/14"', 21.8, 1.814, 'W'),
    isoRow('Gas Cylinder (W)', 'W 24.32x1/14"', 24.32, 1.814, 'W'),
    isoRow('Gas Cylinder (W)', 'W 31.3x1/14"', 31.3, 1.814, 'W'),

    // --- NPSM (Straight Mechanical Pipe - ASME B1.20.1 Table 8 / Machining Doctor) ---
    pipeRow('NPSM', '1/8 NPSM', 10.084, 27, 'NPSM'),
    pipeRow('NPSM', '1/4 NPSM', 13.360, 18, 'NPSM'),
    pipeRow('NPSM', '3/8 NPSM', 16.815, 18, 'NPSM'),
    pipeRow('NPSM', '1/2 NPSM', 20.904, 14, 'NPSM'),
    pipeRow('NPSM', '3/4 NPSM', 26.264, 14, 'NPSM'),
    pipeRow('NPSM', '1 NPSM', 32.842, 11.5, 'NPSM'),
    pipeRow('NPSM', '1-1/4 NPSM', 41.605, 11.5, 'NPSM'),
    pipeRow('NPSM', '1-1/2 NPSM', 47.676, 11.5, 'NPSM'),
    pipeRow('NPSM', '2 NPSM', 59.715, 11.5, 'NPSM'),
    pipeRow('NPSM', '2-1/2 NPSM', 72.161, 8, 'NPSM'),
    pipeRow('NPSM', '3 NPSM', 88.062, 8, 'NPSM'),
    pipeRow('NPSM', '4 NPSM', 113.436, 8, 'NPSM'),
];

export const FASTENERS_DB: Fastener[] = [
    // --- ISO Metric Coarse (Full Range) ---
    { standard: 'ISO Metric', size: 'M1.6', pitch: 0.35, majorDia: 1.6, minorDia: 1.075, pitchDia: 1.373, tapDrill: 1.25, stressArea: 1.27 },
    { standard: 'ISO Metric', size: 'M2', pitch: 0.4, majorDia: 2, minorDia: 1.509, pitchDia: 1.740, tapDrill: 1.6, stressArea: 2.07 },
    { standard: 'ISO Metric', size: 'M2.5', pitch: 0.45, majorDia: 2.5, minorDia: 1.948, pitchDia: 2.208, tapDrill: 2.05, stressArea: 3.39 },
    { standard: 'ISO Metric', size: 'M3', pitch: 0.5, majorDia: 3, minorDia: 2.459, pitchDia: 2.675, tapDrill: 2.5, stressArea: 5.03 },
    { standard: 'ISO Metric', size: 'M3.5', pitch: 0.6, majorDia: 3.5, minorDia: 2.764, pitchDia: 3.110, tapDrill: 2.9, stressArea: 6.78 },
    { standard: 'ISO Metric', size: 'M4', pitch: 0.7, majorDia: 4, minorDia: 3.242, pitchDia: 3.545, tapDrill: 3.3, stressArea: 8.78 },
    { standard: 'ISO Metric', size: 'M5', pitch: 0.8, majorDia: 5, minorDia: 4.134, pitchDia: 4.480, tapDrill: 4.2, stressArea: 14.2 },
    { standard: 'ISO Metric', size: 'M6', pitch: 1.0, majorDia: 6, minorDia: 4.917, pitchDia: 5.350, tapDrill: 5.0, stressArea: 20.1 },
    { standard: 'ISO Metric', size: 'M8', pitch: 1.25, majorDia: 8, minorDia: 6.647, pitchDia: 7.188, tapDrill: 6.8, stressArea: 36.6 },
    { standard: 'ISO Metric', size: 'M10', pitch: 1.5, majorDia: 10, minorDia: 8.376, pitchDia: 9.026, tapDrill: 8.5, stressArea: 58.0 },
    { standard: 'ISO Metric', size: 'M12', pitch: 1.75, majorDia: 12, minorDia: 10.106, pitchDia: 10.863, tapDrill: 10.2, stressArea: 84.3 },
    { standard: 'ISO Metric', size: 'M14', pitch: 2.0, majorDia: 14, minorDia: 11.835, pitchDia: 12.701, tapDrill: 12.0, stressArea: 115 },
    { standard: 'ISO Metric', size: 'M16', pitch: 2.0, majorDia: 16, minorDia: 13.835, pitchDia: 14.701, tapDrill: 14.0, stressArea: 157 },
    { standard: 'ISO Metric', size: 'M18', pitch: 2.5, majorDia: 18, minorDia: 15.294, pitchDia: 16.376, tapDrill: 15.5, stressArea: 192 },
    { standard: 'ISO Metric', size: 'M20', pitch: 2.5, majorDia: 20, minorDia: 17.294, pitchDia: 18.376, tapDrill: 17.5, stressArea: 245 },
    { standard: 'ISO Metric', size: 'M22', pitch: 2.5, majorDia: 22, minorDia: 19.294, pitchDia: 20.376, tapDrill: 19.5, stressArea: 303 },
    { standard: 'ISO Metric', size: 'M24', pitch: 3.0, majorDia: 24, minorDia: 20.752, pitchDia: 22.051, tapDrill: 21.0, stressArea: 353 },
    { standard: 'ISO Metric', size: 'M27', pitch: 3.0, majorDia: 27, minorDia: 23.752, pitchDia: 25.051, tapDrill: 24.0, stressArea: 459 },
    { standard: 'ISO Metric', size: 'M30', pitch: 3.5, majorDia: 30, minorDia: 26.211, pitchDia: 27.727, tapDrill: 26.5, stressArea: 561 },
    { standard: 'ISO Metric', size: 'M33', pitch: 3.5, majorDia: 33, minorDia: 29.211, pitchDia: 30.727, tapDrill: 29.5, stressArea: 694 },
    { standard: 'ISO Metric', size: 'M36', pitch: 4.0, majorDia: 36, minorDia: 31.670, pitchDia: 33.402, tapDrill: 32.0, stressArea: 817 },
    { standard: 'ISO Metric', size: 'M42', pitch: 4.5, majorDia: 42, minorDia: 37.129, pitchDia: 39.077, tapDrill: 37.5, stressArea: 1121 },
    { standard: 'ISO Metric', size: 'M48', pitch: 5.0, majorDia: 48, minorDia: 42.587, pitchDia: 44.752, tapDrill: 43.0, stressArea: 1473 },
    { standard: 'ISO Metric', size: 'M56', pitch: 5.5, majorDia: 56, minorDia: 50.046, pitchDia: 52.428, tapDrill: 50.5, stressArea: 2030 },
    { standard: 'ISO Metric', size: 'M64', pitch: 6.0, majorDia: 64, minorDia: 57.505, pitchDia: 60.103, tapDrill: 58.0, stressArea: 2676 },

    // --- ISO Metric Fine (ISO 261 / ISO 262 preferred) ---
    { standard: 'ISO Metric Fine', size: 'M8x1', pitch: 1.0, majorDia: 8, minorDia: 6.917, pitchDia: 7.350, tapDrill: 7.0, stressArea: 39.2 },
    { standard: 'ISO Metric Fine', size: 'M10x1', pitch: 1.0, majorDia: 10, minorDia: 8.917, pitchDia: 9.350, tapDrill: 9.0, stressArea: 64.5 },
    { standard: 'ISO Metric Fine', size: 'M10x1.25', pitch: 1.25, majorDia: 10, minorDia: 8.647, pitchDia: 9.188, tapDrill: 8.8, stressArea: 61.2 },
    { standard: 'ISO Metric Fine', size: 'M12x1.25', pitch: 1.25, majorDia: 12, minorDia: 10.647, pitchDia: 11.188, tapDrill: 10.8, stressArea: 92.1 },
    { standard: 'ISO Metric Fine', size: 'M12x1.5', pitch: 1.5, majorDia: 12, minorDia: 10.376, pitchDia: 11.026, tapDrill: 10.5, stressArea: 88.1 },
    ...METRIC_FINE_EXTRA,

    // --- UNC (Unified Coarse) ---
    { standard: 'UNC', size: '#1-64', pitch: 64, majorDia: 0.0730 * MM, minorDia: 0.0538 * MM, pitchDia: 0.0629 * MM, tapDrill: 1.5, stressArea: 0.00263 * 645.16 },
    { standard: 'UNC', size: '#2-56', pitch: 56, majorDia: 0.0860 * MM, minorDia: 0.0641 * MM, pitchDia: 0.0744 * MM, tapDrill: 1.85, stressArea: 0.00370 * 645.16 },
    { standard: 'UNC', size: '#4-40', pitch: 40, majorDia: 0.1120 * MM, minorDia: 0.0813 * MM, pitchDia: 0.0958 * MM, tapDrill: 2.35, stressArea: 0.00604 * 645.16 },
    { standard: 'UNC', size: '#6-32', pitch: 32, majorDia: 0.1380 * MM, minorDia: 0.0997 * MM, pitchDia: 0.1177 * MM, tapDrill: 2.85, stressArea: 0.00909 * 645.16 },
    { standard: 'UNC', size: '#8-32', pitch: 32, majorDia: 0.1640 * MM, minorDia: 0.1257 * MM, pitchDia: 0.1437 * MM, tapDrill: 3.5, stressArea: 0.0140 * 645.16 },
    { standard: 'UNC', size: '#10-24', pitch: 24, majorDia: 0.1900 * MM, minorDia: 0.1389 * MM, pitchDia: 0.1629 * MM, tapDrill: 3.9, stressArea: 0.0175 * 645.16 },
    { standard: 'UNC', size: '1/4-20', pitch: 20, majorDia: 0.250 * MM, minorDia: 0.1887 * MM, pitchDia: 0.2175 * MM, tapDrill: 5.1, stressArea: 0.0318 * 645.16 },
    { standard: 'UNC', size: '5/16-18', pitch: 18, majorDia: 0.3125 * MM, minorDia: 0.2443 * MM, pitchDia: 0.2764 * MM, tapDrill: 6.6, stressArea: 0.0524 * 645.16 },
    { standard: 'UNC', size: '3/8-16', pitch: 16, majorDia: 0.375 * MM, minorDia: 0.2983 * MM, pitchDia: 0.3344 * MM, tapDrill: 8.0, stressArea: 0.0775 * 645.16 },
    { standard: 'UNC', size: '7/16-14', pitch: 14, majorDia: 0.4375 * MM, minorDia: 0.3499 * MM, pitchDia: 0.3911 * MM, tapDrill: 9.4, stressArea: 0.1063 * 645.16 },
    { standard: 'UNC', size: '1/2-13', pitch: 13, majorDia: 0.500 * MM, minorDia: 0.4069 * MM, pitchDia: 0.4500 * MM, tapDrill: 10.7, stressArea: 0.1419 * 645.16 },
    { standard: 'UNC', size: '5/8-11', pitch: 11, majorDia: 0.625 * MM, minorDia: 0.5135 * MM, pitchDia: 0.566 * MM, tapDrill: 13.5, stressArea: 0.2260 * 645.16 },
    { standard: 'UNC', size: '3/4-10', pitch: 10, majorDia: 0.750 * MM, minorDia: 0.6273 * MM, pitchDia: 0.685 * MM, tapDrill: 16.5, stressArea: 0.3344 * 645.16 },
    { standard: 'UNC', size: '7/8-9', pitch: 9, majorDia: 0.875 * MM, minorDia: 0.7387 * MM, pitchDia: 0.8028 * MM, tapDrill: 19.5, stressArea: 0.4617 * 645.16 },
    { standard: 'UNC', size: '1-8', pitch: 8, majorDia: 1.000 * MM, minorDia: 0.8466 * MM, pitchDia: 0.9188 * MM, tapDrill: 22.25, stressArea: 0.6057 * 645.16 },
    { standard: 'UNC', size: '1-1/8-7', pitch: 7, majorDia: 1.125 * MM, minorDia: 0.9497 * MM, pitchDia: 1.0322 * MM, tapDrill: 25.0, stressArea: 0.7633 * 645.16 },
    { standard: 'UNC', size: '1-1/4-7', pitch: 7, majorDia: 1.250 * MM, minorDia: 1.0747 * MM, pitchDia: 1.1572 * MM, tapDrill: 28.0, stressArea: 0.9691 * 645.16 },
    { standard: 'UNC', size: '1-1/2-6', pitch: 6, majorDia: 1.500 * MM, minorDia: 1.2955 * MM, pitchDia: 1.3917 * MM, tapDrill: 34.0, stressArea: 1.4053 * 645.16 },
    { standard: 'UNC', size: '1-3/4-5', pitch: 5, majorDia: 1.750 * MM, minorDia: 1.5065 * MM, pitchDia: 1.6201 * MM, tapDrill: 39.5, stressArea: 1.8995 * 645.16 },
    { standard: 'UNC', size: '2-4.5', pitch: 4.5, majorDia: 2.000 * MM, minorDia: 1.7286 * MM, pitchDia: 1.8557 * MM, tapDrill: 45.0, stressArea: 2.4982 * 645.16 },
    { standard: 'UNC', size: '2-1/2-4', pitch: 4, majorDia: 2.500 * MM, minorDia: 2.193 * MM, pitchDia: 2.3376 * MM, tapDrill: 57.0, stressArea: 3.9988 * 645.16 },
    { standard: 'UNC', size: '3-4', pitch: 4, majorDia: 3.000 * MM, minorDia: 2.693 * MM, pitchDia: 2.8376 * MM, tapDrill: 70.0, stressArea: 5.9674 * 645.16 },
    { standard: 'UNC', size: '4-4', pitch: 4, majorDia: 4.000 * MM, minorDia: 3.693 * MM, pitchDia: 3.8376 * MM, tapDrill: 95.0, stressArea: 10.902 * 645.16 },

    // --- UNF (Unified Fine) ---
    { standard: 'UNF', size: '#10-32', pitch: 32, majorDia: 0.190 * MM, minorDia: 0.1517 * MM, pitchDia: 0.1697 * MM, tapDrill: 4.1, stressArea: 0.0199 * 645.16 },
    { standard: 'UNF', size: '1/4-28', pitch: 28, majorDia: 0.250 * MM, minorDia: 0.2062 * MM, pitchDia: 0.2268 * MM, tapDrill: 5.5, stressArea: 0.0364 * 645.16 },
    { standard: 'UNF', size: '5/16-24', pitch: 24, majorDia: 0.3125 * MM, minorDia: 0.2614 * MM, pitchDia: 0.2854 * MM, tapDrill: 6.9, stressArea: 0.0581 * 645.16 },
    { standard: 'UNF', size: '3/8-24', pitch: 24, majorDia: 0.375 * MM, minorDia: 0.3239 * MM, pitchDia: 0.3479 * MM, tapDrill: 8.5, stressArea: 0.0878 * 645.16 },
    { standard: 'UNF', size: '7/16-20', pitch: 20, majorDia: 0.4375 * MM, minorDia: 0.3762 * MM, pitchDia: 0.4050 * MM, tapDrill: 9.9, stressArea: 0.1187 * 645.16 },
    { standard: 'UNF', size: '1/2-20', pitch: 20, majorDia: 0.500 * MM, minorDia: 0.4387 * MM, pitchDia: 0.4675 * MM, tapDrill: 11.5, stressArea: 0.1599 * 645.16 },
    { standard: 'UNF', size: '5/8-18', pitch: 18, majorDia: 0.625 * MM, minorDia: 0.5568 * MM, pitchDia: 0.5889 * MM, tapDrill: 14.5, stressArea: 0.2560 * 645.16 },
    { standard: 'UNF', size: '3/4-16', pitch: 16, majorDia: 0.750 * MM, minorDia: 0.6733 * MM, pitchDia: 0.7094 * MM, tapDrill: 17.5, stressArea: 0.3730 * 645.16 },
    { standard: 'UNF', size: '7/8-14', pitch: 14, majorDia: 0.875 * MM, minorDia: 0.7874 * MM, pitchDia: 0.8286 * MM, tapDrill: 20.25, stressArea: 0.5095 * 645.16 },
    { standard: 'UNF', size: '1-12', pitch: 12, majorDia: 1.000 * MM, minorDia: 0.8978 * MM, pitchDia: 0.9459 * MM, tapDrill: 23.25, stressArea: 0.6630 * 645.16 },
    { standard: 'UNF', size: '1-1/4-12', pitch: 12, majorDia: 1.250 * MM, minorDia: 1.1478 * MM, pitchDia: 1.1959 * MM, tapDrill: 29.5, stressArea: 1.0729 * 645.16 },
    { standard: 'UNF', size: '1-1/2-12', pitch: 12, majorDia: 1.500 * MM, minorDia: 1.3978 * MM, pitchDia: 1.4459 * MM, tapDrill: 36.0, stressArea: 1.5810 * 645.16 },

    // --- BSPP (G) Parallel Pipe ---
    // Pitch is TPI. Angle 55.
    { standard: 'BSPP (G)', size: 'G 1/8', pitch: 28, majorDia: 9.728, minorDia: 8.566, pitchDia: 9.147, tapDrill: 8.8, stressArea: 61.6 },
    { standard: 'BSPP (G)', size: 'G 1/4', pitch: 19, majorDia: 13.157, minorDia: 11.445, pitchDia: 12.301, tapDrill: 11.8, stressArea: 110.7 },
    { standard: 'BSPP (G)', size: 'G 3/8', pitch: 19, majorDia: 16.662, minorDia: 14.950, pitchDia: 15.806, tapDrill: 15.25, stressArea: 185.8 },
    { standard: 'BSPP (G)', size: 'G 1/2', pitch: 14, majorDia: 20.955, minorDia: 18.631, pitchDia: 19.793, tapDrill: 19.0, stressArea: 290.0 },
    { standard: 'BSPP (G)', size: 'G 3/4', pitch: 14, majorDia: 26.441, minorDia: 24.117, pitchDia: 25.279, tapDrill: 24.5, stressArea: 479.1 },
    { standard: 'BSPP (G)', size: 'G 1', pitch: 11, majorDia: 33.249, minorDia: 30.291, pitchDia: 31.770, tapDrill: 30.75, stressArea: 756.2 },
    { standard: 'BSPP (G)', size: 'G 1-1/4', pitch: 11, majorDia: 41.910, minorDia: 38.952, pitchDia: 40.431, tapDrill: 39.5, stressArea: 1237.3 },
    { standard: 'BSPP (G)', size: 'G 1-1/2', pitch: 11, majorDia: 47.803, minorDia: 44.845, pitchDia: 46.324, tapDrill: 45.0, stressArea: 1632.0 },
    { standard: 'BSPP (G)', size: 'G 2', pitch: 11, majorDia: 59.614, minorDia: 56.656, pitchDia: 58.135, tapDrill: 57.0, stressArea: 2587.3 },
    { standard: 'BSPP (G)', size: 'G 2-1/2', pitch: 11, majorDia: 75.184, minorDia: 72.226, pitchDia: 73.705, tapDrill: 72.5, stressArea: 4181.4 },
    { standard: 'BSPP (G)', size: 'G 3', pitch: 11, majorDia: 87.884, minorDia: 84.926, pitchDia: 86.405, tapDrill: 85.0, stressArea: 5763.7 },

    // --- BSPT (R) Tapered Pipe (ISO 7) ---
    // Pitch is TPI. Angle 55. Major Dia is Gauge Plane Diameter.
    { standard: 'BSPT (R)', size: 'R 1/16', pitch: 28, majorDia: 7.723, minorDia: 6.561, pitchDia: 7.142, tapDrill: 6.5, stressArea: 37.5 },
    { standard: 'BSPT (R)', size: 'R 1/8', pitch: 28, majorDia: 9.728, minorDia: 8.566, pitchDia: 9.147, tapDrill: 8.2, stressArea: 61.6 },
    { standard: 'BSPT (R)', size: 'R 1/4', pitch: 19, majorDia: 13.157, minorDia: 11.445, pitchDia: 12.301, tapDrill: 11.1, stressArea: 110.7 },
    { standard: 'BSPT (R)', size: 'R 3/8', pitch: 19, majorDia: 16.662, minorDia: 14.950, pitchDia: 15.806, tapDrill: 14.5, stressArea: 185.8 },
    { standard: 'BSPT (R)', size: 'R 1/2', pitch: 14, majorDia: 20.955, minorDia: 18.631, pitchDia: 19.793, tapDrill: 18.0, stressArea: 290.0 },
    { standard: 'BSPT (R)', size: 'R 3/4', pitch: 14, majorDia: 26.441, minorDia: 24.117, pitchDia: 25.279, tapDrill: 23.5, stressArea: 479.1 },
    { standard: 'BSPT (R)', size: 'R 1', pitch: 11, majorDia: 33.249, minorDia: 30.291, pitchDia: 31.770, tapDrill: 29.5, stressArea: 756.2 },
    { standard: 'BSPT (R)', size: 'R 1-1/4', pitch: 11, majorDia: 41.910, minorDia: 38.952, pitchDia: 40.431, tapDrill: 38.0, stressArea: 1237.3 },
    { standard: 'BSPT (R)', size: 'R 1-1/2', pitch: 11, majorDia: 47.803, minorDia: 44.845, pitchDia: 46.324, tapDrill: 44.0, stressArea: 1632.0 },
    { standard: 'BSPT (R)', size: 'R 2', pitch: 11, majorDia: 59.614, minorDia: 56.656, pitchDia: 58.135, tapDrill: 55.5, stressArea: 2587.3 },
    { standard: 'BSPT (R)', size: 'R 2-1/2', pitch: 11, majorDia: 75.184, minorDia: 72.226, pitchDia: 73.705, tapDrill: 71.0, stressArea: 4181.4 },
    { standard: 'BSPT (R)', size: 'R 3', pitch: 11, majorDia: 87.884, minorDia: 84.926, pitchDia: 86.405, tapDrill: 84.0, stressArea: 5763.7 },
    { standard: 'BSPT (R)', size: 'R 4', pitch: 11, majorDia: 113.030, minorDia: 110.072, pitchDia: 111.551, tapDrill: 109.5, stressArea: 9644.0 },
    { standard: 'BSPT (R)', size: 'R 5', pitch: 11, majorDia: 138.430, minorDia: 135.472, pitchDia: 136.951, tapDrill: 134.5, stressArea: 14572.0 },
    { standard: 'BSPT (R)', size: 'R 6', pitch: 11, majorDia: 163.830, minorDia: 160.872, pitchDia: 162.351, tapDrill: 160.0, stressArea: 20513.0 },

    // --- NPT Tapered Pipe (ANSI B1.20.1) ---
    // Angle 60. Taper 1:16. Major Dia is Pipe OD (approx).
    // Tap Drill is for Tapered Reamer or Commercial use.
    // Stored in Metric equiv for DB consistency, converted to Inch for display.
    { standard: 'NPT', size: '1/16 NPT', pitch: 27, majorDia: 7.950, minorDia: 6.388, pitchDia: 7.142, tapDrill: 6.15, stressArea: 35.9 },
    { standard: 'NPT', size: '1/8 NPT', pitch: 27, majorDia: 10.287, minorDia: 8.730, pitchDia: 9.489, tapDrill: 8.43, stressArea: 65.2 },
    { standard: 'NPT', size: '1/4 NPT', pitch: 18, majorDia: 13.716, minorDia: 11.359, pitchDia: 12.487, tapDrill: 11.13, stressArea: 111.6 },
    { standard: 'NPT', size: '3/8 NPT', pitch: 18, majorDia: 17.145, minorDia: 14.796, pitchDia: 15.926, tapDrill: 14.27, stressArea: 185.3 },
    { standard: 'NPT', size: '1/2 NPT', pitch: 14, majorDia: 21.336, minorDia: 18.321, pitchDia: 19.772, tapDrill: 17.86, stressArea: 284.9 },
    { standard: 'NPT', size: '3/4 NPT', pitch: 14, majorDia: 26.670, minorDia: 23.665, pitchDia: 25.117, tapDrill: 23.01, stressArea: 467.2 },
    { standard: 'NPT', size: '1 NPT', pitch: 11.5, majorDia: 33.401, minorDia: 29.726, pitchDia: 31.461, tapDrill: 28.98, stressArea: 735.1 },
    { standard: 'NPT', size: '1-1/4 NPT', pitch: 11.5, majorDia: 42.164, minorDia: 38.451, pitchDia: 40.218, tapDrill: 37.69, stressArea: 1215.2 },
    { standard: 'NPT', size: '1-1/2 NPT', pitch: 11.5, majorDia: 48.260, minorDia: 44.524, pitchDia: 46.287, tapDrill: 43.66, stressArea: 1619.2 },
    { standard: 'NPT', size: '2 NPT', pitch: 11.5, majorDia: 60.325, minorDia: 56.558, pitchDia: 58.325, tapDrill: 55.58, stressArea: 2591.4 },
    { standard: 'NPT', size: '2-1/2 NPT', pitch: 8, majorDia: 73.025, minorDia: 67.628, pitchDia: 69.952, tapDrill: 66.68, stressArea: 3716.5 },
    { standard: 'NPT', size: '3 NPT', pitch: 8, majorDia: 88.900, minorDia: 83.503, pitchDia: 85.801, tapDrill: 82.55, stressArea: 5628.1 },
    { standard: 'NPT', size: '3-1/2 NPT', pitch: 8, majorDia: 101.600, minorDia: 96.203, pitchDia: 98.501, tapDrill: 95.25, stressArea: 7443.5 },
    { standard: 'NPT', size: '4 NPT', pitch: 8, majorDia: 114.300, minorDia: 108.903, pitchDia: 111.201, tapDrill: 107.95, stressArea: 9512.3 },
    { standard: 'NPT', size: '5 NPT', pitch: 8, majorDia: 141.300, minorDia: 135.903, pitchDia: 138.125, tapDrill: 134.94, stressArea: 14744.2 },
    { standard: 'NPT', size: '6 NPT', pitch: 8, majorDia: 168.275, minorDia: 162.878, pitchDia: 165.100, tapDrill: 161.93, stressArea: 21121.3 },

    // --- Trapezoidal (Tr) ---
    // DIN 103
    { standard: 'Trapezoidal (Tr)', size: 'Tr 10x2', pitch: 2, majorDia: 10, minorDia: 7.5, pitchDia: 9, tapDrill: 8.2, stressArea: 52 },
    { standard: 'Trapezoidal (Tr)', size: 'Tr 12x3', pitch: 3, majorDia: 12, minorDia: 8.5, pitchDia: 10.5, tapDrill: 9.2, stressArea: 69 },
    { standard: 'Trapezoidal (Tr)', size: 'Tr 16x4', pitch: 4, majorDia: 16, minorDia: 11.5, pitchDia: 14, tapDrill: 12.2, stressArea: 126 },
    { standard: 'Trapezoidal (Tr)', size: 'Tr 20x4', pitch: 4, majorDia: 20, minorDia: 15.5, pitchDia: 18, tapDrill: 16.2, stressArea: 217 },
    { standard: 'Trapezoidal (Tr)', size: 'Tr 24x5', pitch: 5, majorDia: 24, minorDia: 18.5, pitchDia: 21.5, tapDrill: 19.2, stressArea: 304 },

    ...UN_SERIES_EXTRA,
    ...WHITWORTH_EXTRA,
    ...PIPE_EXTRA,
    ...POWER_SCREW_EXTRA,
    ...SPECIALTY_EXTRA,
];
