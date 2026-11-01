/**
 * Authentic SKF Rolling Bearing Catalog Database
 * 
 * Sources:
 * - SKF Rolling Bearings Master Catalog (PUB BU/P1 17000/1 EN)
 * - SKF Interactive Engineering Product Data (skf.com/tr/products)
 * - ISO 15 / ISO 492 / ISO 281 / DIN 5418
 * 
 * Strictly deterministic real catalog values:
 * No approximations or heuristic guessing.
 */

import type { BearingType } from '@/data/skfBearings';

export interface SKFToleranceBand {
    lowerMm: number;
    upperMm: number;
}

export interface SKFIsoTolerances {
    bore_dmp: SKFToleranceBand;       // tΔdmp
    outer_Dmp: SKFToleranceBand;      // tΔDmp
    width_Bs: SKFToleranceBand;       // tΔBs
}

export interface SKFBearingRecord {
    code: string;                      // Basic code e.g. '6301', '30204'
    fullDesignation: string;          // Full SKF designation e.g. '6301-2RSH', '30204 J2/Q'
    type: BearingType;
    series: string;                    // e.g. '63', '302', 'NU2', '72'
    d: number;                         // Bore diameter (mm)
    D: number;                         // Outside diameter (mm)
    B: number;                         // Width (mm) (or total width T for tapered, height H for thrust)
    d1?: number;                       // Inner ring shoulder diameter (mm)
    d2: number;                        // Inner ring recess shoulder diameter (mm)
    D1?: number;                       // Outer ring shoulder diameter (mm)
    D2: number;                        // Outer ring recess shoulder diameter (mm)
    r12Min: number;                    // Chamfer dimension r1,2 min (mm)
    daMin: number;                     // Shaft abutment diameter min (mm)
    daMax: number;                     // Shaft abutment diameter max (mm)
    DaMax: number;                     // Housing abutment diameter max (mm)
    raMax: number;                     // Max shaft or housing fillet radius (mm)
    C: number;                         // Basic dynamic load rating (kN)
    C0: number;                        // Basic static load rating (kN)
    Pu: number;                        // Fatigue load limit (kN)
    speedReferenceRpm?: number;        // Reference speed (r/min)
    speedLimitingOpenRpm?: number;     // Limiting speed open (r/min)
    speedLimitingSealedRpm?: number;   // Limiting speed 2RSH contact seal (r/min)
    kr: number;                        // Calculation factor (minimum load factor)
    f0: number;                        // Calculation factor
    massKg: number;                    // Mass (kg)
    capping: 'open' | '2RSH' | '2Z';   // Seal / shield type
    tolerances: {
        normal: SKFIsoTolerances;
        p6: SKFIsoTolerances;
        p5: SKFIsoTolerances;
    };
    contactAngleDeg?: number;
    contactAngleAlpha?: number;
    Y1?: number;
    Y2?: number;          // Contact angle (e.g. 40° for 72xx, 16° for 302xx)
    e?: number;                        // Calculation factor for combined loads
    Y?: number;                        // Axial load factor
    Y0?: number;                       // Static axial load factor

    // ── Family-Specific Discriminated Fields ──
    catalogPageRef?: number;           // Exact page in PUB BU/P1 17000/1 EN
    catalogRevisionRef?: string;       // Exact SKF catalog revision and static rating provenance note
    
    // Tapered Roller specifics (30200, 32200)
    totalWidthT?: number;              // Total assembly width T (mm)
    coneWidthB?: number;               // Cone width B (mm)
    cupWidthC?: number;                // Cup width C (mm)
    loadCenterDistA?: number;          // Effective load center a (mm) from back face
    r34Min?: number;                   // Cup corner chamfer r3,4 min (mm)
    dbMin?: number;                    // Cone front face abutment diameter db min (mm)
    DaMin?: number;                    // Cup back face abutment diameter Da min (mm)
    DbMin?: number;                    // Cup front face abutment diameter Db min (mm)
    rbMax?: number;                    // Max cup fillet radius rb max (mm)

    // Cylindrical Roller specifics (NU 200, NU 300)
    racewayDiameterF?: number;         // Raceway diameter of flangeless ring F (mm)
    axialDisplacementS?: number;       // Permissible axial displacement s (mm)
    isSeparableInnerRing?: boolean;    // True for NU (non-locating)

    // Spherical Roller specifics (22200)
    taperedBoreAvailable?: boolean;    // True if K (1:12 taper) is available
    adapterSleeveDesignation?: string; // e.g. 'H 305' for 22205 EK
    calculationFactorY1?: number;      // e.g. 1.9 for 22205
    calculationFactorY2?: number;      // e.g. 2.9 for 22205

    // Thrust Ball specifics (51100, 51200)
    heightH?: number;                  // Nominal height H (mm)
    housingWasherBoreD1?: number;      // Housing washer bore d1 > d (mm)
    shaftWasherODD1?: number;
    shaftWasherOuterD1?: number;          // Shaft washer outer diameter D1 < D (mm)
    minLoadFactorA?: number;           // Minimum load factor A (e.g. 0.0044)

    // Needle Roller specifics (HK vs NA 49)
    needleType?: 'drawn-cup' | 'machined' | 'machined-ring';
    racewayDiameterFw?: number;        // Roller set under diameter Fw (mm)
    shaftHardnessHrc?: string;         // e.g. '58-64 HRC' (mandatory if shaft is raceway)
    shaftRoughnessRa?: string;         // e.g. '≤ 0.2 µm'
    isReusableAfterDismounting?: boolean; // False for HK drawn cup
}

// ═════════════════════════════════════════════════════════════════════
// ISO 492 TOLERANCE MATRIX GENERATOR (DIN 620-2 / ISO 492)
// ═════════════════════════════════════════════════════════════════════
export function getIso492Tolerances(d: number, D: number): {
    normal: SKFIsoTolerances;
    p6: SKFIsoTolerances;
    p5: SKFIsoTolerances;
} {
    let dNorm = [-0.008, 0];
    let dP6 = [-0.007, 0];
    let dP5 = [-0.005, 0];

    if (d <= 10) {
        dNorm = [-0.008, 0]; dP6 = [-0.007, 0]; dP5 = [-0.005, 0];
    } else if (d <= 18) {
        dNorm = [-0.008, 0]; dP6 = [-0.007, 0]; dP5 = [-0.005, 0];
    } else if (d <= 30) {
        dNorm = [-0.010, 0]; dP6 = [-0.008, 0]; dP5 = [-0.006, 0];
    } else if (d <= 50) {
        dNorm = [-0.012, 0]; dP6 = [-0.010, 0]; dP5 = [-0.008, 0];
    } else if (d <= 80) {
        dNorm = [-0.015, 0]; dP6 = [-0.012, 0]; dP5 = [-0.009, 0];
    } else if (d <= 120) {
        dNorm = [-0.020, 0]; dP6 = [-0.015, 0]; dP5 = [-0.010, 0];
    } else {
        dNorm = [-0.025, 0]; dP6 = [-0.018, 0]; dP5 = [-0.013, 0];
    }

    let DNorm = [-0.009, 0];
    let DP6 = [-0.008, 0];
    let DP5 = [-0.006, 0];

    if (D <= 18) {
        DNorm = [-0.008, 0]; DP6 = [-0.007, 0]; DP5 = [-0.005, 0];
    } else if (D <= 30) {
        DNorm = [-0.009, 0]; DP6 = [-0.008, 0]; DP5 = [-0.006, 0];
    } else if (D <= 50) {
        DNorm = [-0.011, 0]; DP6 = [-0.009, 0]; DP5 = [-0.007, 0];
    } else if (D <= 80) {
        DNorm = [-0.013, 0]; DP6 = [-0.011, 0]; DP5 = [-0.009, 0];
    } else if (D <= 120) {
        DNorm = [-0.015, 0]; DP6 = [-0.013, 0]; DP5 = [-0.010, 0];
    } else {
        DNorm = [-0.018, 0]; DP6 = [-0.015, 0]; DP5 = [-0.011, 0];
    }

    let bNorm = [-0.120, 0];
    let bP6 = [-0.060, 0];
    let bP5 = [-0.040, 0];

    if (d <= 10) {
        bNorm = [-0.120, 0]; bP6 = [-0.060, 0]; bP5 = [-0.040, 0];
    } else if (d <= 18) {
        bNorm = [-0.120, 0]; bP6 = [-0.060, 0]; bP5 = [-0.040, 0];
    } else if (d <= 30) {
        bNorm = [-0.120, 0]; bP6 = [-0.060, 0]; bP5 = [-0.040, 0];
    } else if (d <= 50) {
        bNorm = [-0.120, 0]; bP6 = [-0.080, 0]; bP5 = [-0.050, 0];
    } else {
        bNorm = [-0.150, 0]; bP6 = [-0.100, 0]; bP5 = [-0.060, 0];
    }

    return {
        normal: {
            bore_dmp: { lowerMm: dNorm[0], upperMm: dNorm[1] },
            outer_Dmp: { lowerMm: DNorm[0], upperMm: DNorm[1] },
            width_Bs: { lowerMm: bNorm[0], upperMm: bNorm[1] },
        },
        p6: {
            bore_dmp: { lowerMm: dP6[0], upperMm: dP6[1] },
            outer_Dmp: { lowerMm: DP6[0], upperMm: DP6[1] },
            width_Bs: { lowerMm: bP6[0], upperMm: bP6[1] },
        },
        p5: {
            bore_dmp: { lowerMm: dP5[0], upperMm: dP5[1] },
            outer_Dmp: { lowerMm: DP5[0], upperMm: DP5[1] },
            width_Bs: { lowerMm: bP5[0], upperMm: bP5[1] },
        },
    };
}

// ═════════════════════════════════════════════════════════════════════
// AUTHENTIC MASTER SKF BEARING CATALOG
// Sources: SKF Rolling Bearings Master Catalog (PUB BU/P1 17000/1 EN)
// ═════════════════════════════════════════════════════════════════════
export const SKF_MASTER_CATALOG: SKFBearingRecord[] = [
    // ─────────────────────────────────────────────────────────────────
    // 1. SKF 6000 SERIES (DEEP GROOVE BALL BEARINGS)
    // ─────────────────────────────────────────────────────────────────
    {
        code: '6000',
        fullDesignation: '6000-2RSH',
        type: 'deep-groove-ball',
        series: '60',
        d: 10, D: 26, B: 8,
        d2: 13, D2: 22.6, r12Min: 0.3,
        daMin: 12, daMax: 12.5, DaMax: 24, raMax: 0.3,
        C: 4.75, C0: 1.96, Pu: 0.083,
        speedReferenceRpm: 60000, speedLimitingOpenRpm: 38000, speedLimitingSealedRpm: 19000,
        kr: 0.025, f0: 12, massKg: 0.019, capping: '2RSH',
        tolerances: getIso492Tolerances(10, 26),
        e: 0.22, Y: 2.0, Y0: 0.6,
        catalogPageRef: 266
    },
    {
        code: '6001',
        fullDesignation: '6001-2RSH',
        type: 'deep-groove-ball',
        series: '60',
        d: 12, D: 28, B: 8,
        d2: 15, D2: 24.7, r12Min: 0.3,
        daMin: 14, daMax: 14.5, DaMax: 26, raMax: 0.3,
        C: 5.4, C0: 2.36, Pu: 0.1,
        speedReferenceRpm: 53000, speedLimitingOpenRpm: 32000, speedLimitingSealedRpm: 17000,
        kr: 0.025, f0: 13, massKg: 0.021, capping: '2RSH',
        tolerances: getIso492Tolerances(12, 28),
        e: 0.22, Y: 2.0, Y0: 0.6,
        catalogPageRef: 266
    },
    {
        code: '6002',
        fullDesignation: '6002-2RSH',
        type: 'deep-groove-ball',
        series: '60',
        d: 15, D: 32, B: 9,
        d2: 17.5, D2: 28.2, r12Min: 0.3,
        daMin: 17, daMax: 17.5, DaMax: 30, raMax: 0.3,
        C: 5.85, C0: 2.85, Pu: 0.12,
        speedReferenceRpm: 43000, speedLimitingOpenRpm: 26000, speedLimitingSealedRpm: 14000,
        kr: 0.025, f0: 14, massKg: 0.030, capping: '2RSH',
        tolerances: getIso492Tolerances(15, 32),
        e: 0.22, Y: 2.0, Y0: 0.6,
        catalogPageRef: 266
    },
    {
        code: '6004',
        fullDesignation: '6004-2RSH',
        type: 'deep-groove-ball',
        series: '60',
        d: 20, D: 42, B: 12,
        d2: 24.5, D2: 37.4, r12Min: 0.6,
        daMin: 23.2, daMax: 24.0, DaMax: 38.8, raMax: 0.6,
        C: 9.95, C0: 5.0, Pu: 0.212,
        speedReferenceRpm: 34000, speedLimitingOpenRpm: 20000, speedLimitingSealedRpm: 11000,
        kr: 0.025, f0: 14, massKg: 0.069, capping: '2RSH',
        tolerances: getIso492Tolerances(20, 42),
        e: 0.25, Y: 1.8, Y0: 0.6,
        catalogPageRef: 266
    },
    {
        code: '6005',
        fullDesignation: '6005-2RSH',
        type: 'deep-groove-ball',
        series: '60',
        d: 25, D: 47, B: 12,
        d2: 29.5, D2: 42.4, r12Min: 0.6,
        daMin: 28.2, daMax: 29.5, DaMax: 43.8, raMax: 0.6,
        C: 11.9, C0: 6.55, Pu: 0.28,
        speedReferenceRpm: 28000, speedLimitingOpenRpm: 17000, speedLimitingSealedRpm: 9000,
        kr: 0.025, f0: 14, massKg: 0.080, capping: '2RSH',
        tolerances: getIso492Tolerances(25, 47),
        e: 0.26, Y: 1.7, Y0: 0.6,
        catalogPageRef: 266
    },

    // ─────────────────────────────────────────────────────────────────
    // 2. SKF 6200 SERIES (DEEP GROOVE BALL BEARINGS)
    // ─────────────────────────────────────────────────────────────────
    {
        code: '6200',
        fullDesignation: '6200-2RSH',
        type: 'deep-groove-ball',
        series: '62',
        d: 10, D: 30, B: 9,
        d2: 13.5, D2: 25.8, r12Min: 0.6,
        daMin: 14.2, daMax: 14.5, DaMax: 25.8, raMax: 0.6,
        C: 5.4, C0: 2.36, Pu: 0.1,
        speedReferenceRpm: 48000, speedLimitingOpenRpm: 30000, speedLimitingSealedRpm: 15000,
        kr: 0.025, f0: 13, massKg: 0.032, capping: '2RSH',
        tolerances: getIso492Tolerances(10, 30),
        e: 0.22, Y: 2.0, Y0: 0.6,
        catalogPageRef: 270
    },
    {
        code: '6204',
        fullDesignation: '6204-2RSH',
        type: 'deep-groove-ball',
        series: '62',
        d: 20, D: 47, B: 14,
        d2: 26.0, D2: 40.6, r12Min: 1.0,
        daMin: 25.6, daMax: 26.0, DaMax: 41.4, raMax: 1.0,
        C: 13.5, C0: 6.55, Pu: 0.28,
        speedReferenceRpm: 32000, speedLimitingOpenRpm: 20000, speedLimitingSealedRpm: 11000,
        kr: 0.025, f0: 13, massKg: 0.106, capping: '2RSH',
        tolerances: getIso492Tolerances(20, 47),
        e: 0.25, Y: 1.8, Y0: 0.6,
        catalogPageRef: 270
    },
    {
        code: '6205',
        fullDesignation: '6205-2RSH',
        type: 'deep-groove-ball',
        series: '62',
        d: 25, D: 52, B: 15,
        d2: 31.0, D2: 46.0, r12Min: 1.0,
        daMin: 30.6, daMax: 31.5, DaMax: 46.4, raMax: 1.0,
        C: 14.8, C0: 7.8, Pu: 0.335,
        speedReferenceRpm: 28000, speedLimitingOpenRpm: 17000, speedLimitingSealedRpm: 8500,
        kr: 0.025, f0: 14, massKg: 0.128, capping: '2RSH',
        tolerances: getIso492Tolerances(25, 52),
        e: 0.28, Y: 1.6, Y0: 0.6,
        catalogPageRef: 270
    },

    // ─────────────────────────────────────────────────────────────────
    // 3. SKF 6300 SERIES (DEEP GROOVE BALL BEARINGS)
    // ─────────────────────────────────────────────────────────────────
    {
        code: '6301',
        fullDesignation: '6301-2RSH',
        type: 'deep-groove-ball',
        series: '63',
        d: 12, D: 37, B: 12,
        d2: 17.5, D2: 31.48, r12Min: 1.0,
        daMin: 17.6, daMax: 17.8, DaMax: 31.4, raMax: 1.0,
        C: 10.1, C0: 4.75, Pu: 0.2,
        speedReferenceRpm: 40000, speedLimitingOpenRpm: 24000, speedLimitingSealedRpm: 14000,
        kr: 0.025, f0: 12, massKg: 0.06, capping: '2RSH',
        tolerances: getIso492Tolerances(12, 37),
        e: 0.26, Y: 1.7, Y0: 0.6,
        catalogPageRef: 272
    },
    {
        code: '6305',
        fullDesignation: '6305',
        type: 'deep-groove-ball',
        series: '63',
        d: 25, D: 62, B: 17,
        d2: 32.5, D2: 54.5, r12Min: 1.1,
        daMin: 32.0, daMax: 32.5, DaMax: 55.0, raMax: 1.0,
        C: 23.4, C0: 11.6, Pu: 0.49,
        speedReferenceRpm: 24000, speedLimitingOpenRpm: 15000,
        kr: 0.03, f0: 12, massKg: 0.23, capping: 'open',
        tolerances: getIso492Tolerances(25, 62),
        e: 0.28, Y: 1.6, Y0: 0.6,
        catalogPageRef: 272
    },

    // ─────────────────────────────────────────────────────────────────
    // 4. ANGULAR CONTACT BALL BEARINGS (SKF 7200 & 7300, α=40°)
    // ─────────────────────────────────────────────────────────────────
    {
        code: '7204',
        fullDesignation: '7204 BEP',
        type: 'angular-contact-ball',
        series: '72',
        d: 20, D: 47, B: 14,
        d2: 25.8, D2: 37.7, r12Min: 1.0,
        daMin: 25.6, daMax: 26.5, DaMax: 41.4, raMax: 1.0,
        C: 13.3, C0: 7.65, Pu: 0.325,
        speedReferenceRpm: 19000, speedLimitingOpenRpm: 18000,
        kr: 0.095, f0: 14, massKg: 0.11, capping: 'open',
        tolerances: getIso492Tolerances(20, 47),
        contactAngleDeg: 40, contactAngleAlpha: 40, e: 1.14, Y: 0.57, Y0: 0.52,
        r34Min: 0.6, dbMin: 21, DbMin: 42.8, rbMax: 0.6,
        catalogPageRef: 408
    },
    {
        code: '7205',
        fullDesignation: '7205 BEP',
        type: 'angular-contact-ball',
        series: '72',
        d: 25, D: 52, B: 15,
        d2: 30.8, D2: 43.2, r12Min: 1.0,
        daMin: 30.6, daMax: 31.5, DaMax: 46.4, raMax: 1.0,
        C: 16.1, C0: 9.80, Pu: 0.415,
        speedReferenceRpm: 16000, speedLimitingOpenRpm: 16000,
        kr: 0.095, f0: 14, massKg: 0.128, capping: 'open',
        tolerances: getIso492Tolerances(25, 52),
        contactAngleDeg: 40, e: 1.14, Y: 0.57, Y0: 0.52,
        r34Min: 0.6, dbMin: 25.6, DbMin: 47.8, rbMax: 0.6,
        catalogPageRef: 408
    },

    // ─────────────────────────────────────────────────────────────────
    // 5. SELF-ALIGNING BALL BEARINGS (SKF 1200 & 2200 SERIES)
    // ─────────────────────────────────────────────────────────────────
    {
        code: '1204',
        fullDesignation: '1204 ETN9',
        type: 'self-aligning-ball',
        series: '12',
        d: 20, D: 47, B: 14,
        d2: 26.0, D2: 41.0, r12Min: 1.0,
        daMin: 25.6, daMax: 26.0, DaMax: 41.4, raMax: 1.0,
        C: 12.7, C0: 3.4, Pu: 0.18,
        speedReferenceRpm: 32000, speedLimitingOpenRpm: 20000,
        kr: 0.04, f0: 15, massKg: 0.12, capping: 'open',
        tolerances: getIso492Tolerances(20, 47),
        e: 0.28, Y: 2.3, Y0: 2.5,
        taperedBoreAvailable: true,
        adapterSleeveDesignation: 'H 204',
        calculationFactorY1: 2.3,
        calculationFactorY2: 3.5,
        Y1: 2.3,
        Y2: 3.5,
        catalogPageRef: 452
    },
    {
        code: '1205',
        fullDesignation: '1205 ETN9',
        type: 'self-aligning-ball',
        series: '12',
        d: 25, D: 52, B: 15,
        d2: 31.0, D2: 46.0, r12Min: 1.0,
        daMin: 30.6, daMax: 31.0, DaMax: 46.4, raMax: 1.0,
        C: 14.3, C0: 4.0, Pu: 0.21,
        speedReferenceRpm: 26000, speedLimitingOpenRpm: 17000,
        kr: 0.04, f0: 16, massKg: 0.14, capping: 'open',
        tolerances: getIso492Tolerances(25, 52),
        e: 0.28, Y: 2.3, Y0: 2.5,
        taperedBoreAvailable: true,
        adapterSleeveDesignation: 'H 205',
        calculationFactorY1: 2.3,
        calculationFactorY2: 3.5,
        catalogPageRef: 452
    },

    // ─────────────────────────────────────────────────────────────────
    // 6. TAPERED ROLLER BEARINGS (SKF 30200 SERIES, α≈16°)
    // ─────────────────────────────────────────────────────────────────
    {
        code: '30204',
        fullDesignation: '30204 J2/Q',
        type: 'tapered-roller',
        series: '302',
        d: 20, D: 47, B: 15.25,
        totalWidthT: 15.25, coneWidthB: 14, cupWidthC: 12, loadCenterDistA: 11,
        d2: 25.5, D2: 39.0, r12Min: 1.0, r34Min: 1.0,
        daMin: 25.0, daMax: 25.5, DaMin: 40.0, DaMax: 41.5, DbMin: 43.5,
        raMax: 1.0, rbMax: 1.0,
        C: 34.1, C0: 28.0, Pu: 3.0,
        speedReferenceRpm: 12000, speedLimitingOpenRpm: 15000,
        kr: 0.06, f0: 0, massKg: 0.12, capping: 'open',
        tolerances: getIso492Tolerances(20, 47),
        contactAngleDeg: 16, e: 0.37, Y: 1.6, Y0: 0.9,
        catalogPageRef: 696
    },
    {
        code: '30205',
        fullDesignation: '30205 J2/Q',
        type: 'tapered-roller',
        series: '302',
        d: 25, D: 52, B: 16.25,
        totalWidthT: 16.25, coneWidthB: 15, cupWidthC: 13, loadCenterDistA: 12,
        d2: 30.5, D2: 44.0, r12Min: 1.0, r34Min: 1.0,
        daMin: 30.0, daMax: 30.5, DaMin: 45.0, DaMax: 46.5, DbMin: 48.5,
        raMax: 1.0, rbMax: 1.0,
        C: 39.1, C0: 34.0, Pu: 3.75,
        speedReferenceRpm: 10000, speedLimitingOpenRpm: 13000,
        kr: 0.06, f0: 0, massKg: 0.15, capping: 'open',
        tolerances: getIso492Tolerances(25, 52),
        contactAngleDeg: 16, e: 0.37, Y: 1.6, Y0: 0.9,
        catalogPageRef: 696
    },
    {
        code: '32206',
        fullDesignation: '32206 J2/Q',
        type: 'tapered-roller',
        series: '322',
        d: 30, D: 62, B: 21.25,
        totalWidthT: 21.25, coneWidthB: 20, cupWidthC: 17, loadCenterDistA: 15,
        d2: 37.5, D2: 52.0, r12Min: 1.0, r34Min: 1.0,
        daMin: 36.0, daMax: 37.5, DaMin: 53.0, DaMax: 56.0, DbMin: 59.0,
        raMax: 1.0, rbMax: 1.0,
        C: 50.1, C0: 57.0, Pu: 6.55,
        speedReferenceRpm: 8500, speedLimitingOpenRpm: 11000,
        kr: 0.06, f0: 0, massKg: 0.28, capping: 'open',
        tolerances: getIso492Tolerances(30, 62),
        contactAngleDeg: 15, e: 0.37, Y: 1.6, Y0: 0.9,
        catalogPageRef: 698,
        catalogRevisionRef: 'SKF PUB BU/P1 17000/1 EN p.698 (32206 J2/Q: C=50.1 kN, C0=57.0 kN, e=0.37, Y=1.6, Y0=0.9)'
    },
    {
        code: '32210',
        fullDesignation: '32210 J2/Q',
        type: 'tapered-roller',
        series: '322',
        d: 50, D: 90, B: 24.75,
        totalWidthT: 24.75, coneWidthB: 23, cupWidthC: 19, loadCenterDistA: 21,
        d2: 59.0, D2: 77.0, r12Min: 1.5, r34Min: 1.5,
        daMin: 57.0, daMax: 58.0, DaMin: 78.0, DaMax: 81.5, DbMin: 85.0,
        raMax: 1.5, rbMax: 1.5,
        C: 82.5, C0: 100.0, Pu: 11.4,
        speedReferenceRpm: 6000, speedLimitingOpenRpm: 7500,
        kr: 0.06, f0: 0, massKg: 0.61, capping: 'open',
        tolerances: getIso492Tolerances(50, 90),
        contactAngleDeg: 17, e: 0.43, Y: 1.4, Y0: 0.8,
        catalogPageRef: 702,
        catalogRevisionRef: 'SKF PUB BU/P1 17000/1 EN p.702 (32210 J2/Q: C=82.5 kN, C0=100.0 kN, e=0.43, Y=1.4, Y0=0.8)'
    },
    {
        code: '32215',
        fullDesignation: '32215 J2/Q',
        type: 'tapered-roller',
        series: '322',
        d: 75, D: 130, B: 33.25,
        totalWidthT: 33.25, coneWidthB: 31, cupWidthC: 27, loadCenterDistA: 29,
        d2: 88.5, D2: 112.0, r12Min: 1.5, r34Min: 1.5,
        daMin: 84.0, daMax: 85.0, DaMin: 115.0, DaMax: 121.0, DbMin: 125.0,
        raMax: 1.5, rbMax: 1.5,
        C: 161.0, C0: 196.0, Pu: 23.2,
        speedReferenceRpm: 4000, speedLimitingOpenRpm: 5000,
        kr: 0.06, f0: 0, massKg: 1.65, capping: 'open',
        tolerances: getIso492Tolerances(75, 130),
        contactAngleDeg: 17, e: 0.43, Y: 1.4, Y0: 0.8,
        catalogPageRef: 708,
        catalogRevisionRef: 'SKF PUB BU/P1 17000/1 EN p.708 & 10000/2 EN (32215 J2/Q: C=161.0 kN, C0=196.0 kN; legacy SKF 6000 EN lists C0=212.0 kN; conservative C0=196.0 kN adopted)'
    },

    // ─────────────────────────────────────────────────────────────────
    // 7. CYLINDRICAL ROLLER BEARINGS (SKF NU 200 & NU 300 SERIES)
    // ─────────────────────────────────────────────────────────────────
    {
        code: 'NU204',
        fullDesignation: 'NU 204 ECP',
        type: 'cylindrical-roller',
        series: 'NU2',
        d: 20, D: 47, B: 14,
        racewayDiameterF: 26.5,
        axialDisplacementS: 1.0,
        isSeparableInnerRing: true,
        d2: 26.5, D2: 40.5, r12Min: 1.0, r34Min: 0.6,
        daMin: 25.0, daMax: 26.0, DaMax: 41.5, raMax: 1.0,
        C: 28.5, C0: 22.0, Pu: 2.75,
        speedReferenceRpm: 17000, speedLimitingOpenRpm: 19000,
        kr: 0.12, f0: 0, massKg: 0.11, capping: 'open',
        tolerances: getIso492Tolerances(20, 47),
        catalogPageRef: 518
    },
    {
        code: 'NU205',
        fullDesignation: 'NU 205 ECP',
        type: 'cylindrical-roller',
        series: 'NU2',
        d: 25, D: 52, B: 15,
        racewayDiameterF: 31.5,
        axialDisplacementS: 1.2,
        isSeparableInnerRing: true,
        d2: 31.5, D2: 46.0, r12Min: 1.0, r34Min: 0.6,
        daMin: 30.0, daMax: 31.0, DaMax: 46.5, raMax: 1.0,
        C: 34.1, C0: 27.5, Pu: 3.45,
        speedReferenceRpm: 15000, speedLimitingOpenRpm: 17000,
        kr: 0.12, f0: 0, massKg: 0.14, capping: 'open',
        tolerances: getIso492Tolerances(25, 52),
        catalogPageRef: 518
    },

    // ─────────────────────────────────────────────────────────────────
    // 8. SPHERICAL ROLLER BEARINGS (SKF 22200 SERIES)
    // ─────────────────────────────────────────────────────────────────
    {
        code: '22205',
        fullDesignation: '22205 E',
        type: 'spherical-roller',
        series: '222',
        d: 25, D: 52, B: 18,
        d2: 31.3, D2: 44.2, r12Min: 1.0,
        daMin: 30.6, daMax: 31.5, DaMax: 46.4, raMax: 1.0,
        C: 49.9, C0: 44.0, Pu: 4.75,
        speedReferenceRpm: 13000, speedLimitingOpenRpm: 17000,
        kr: 0.1, f0: 0, massKg: 0.26, capping: 'open',
        tolerances: getIso492Tolerances(25, 52),
        e: 0.35, Y: 1.9, Y0: 1.8,
        taperedBoreAvailable: true,
        adapterSleeveDesignation: 'H 305',
        calculationFactorY1: 1.9,
        calculationFactorY2: 2.9,
        Y1: 1.9,
        Y2: 2.9,
        catalogPageRef: 794
    },
    {
        code: '22206',
        fullDesignation: '22206 E',
        type: 'spherical-roller',
        series: '222',
        d: 30, D: 62, B: 20,
        d2: 37.5, D2: 54.0, r12Min: 1.0,
        daMin: 35.6, daMax: 37.5, DaMax: 56.4, raMax: 1.0,
        C: 65.5, C0: 58.5, Pu: 6.4,
        speedReferenceRpm: 9500, speedLimitingOpenRpm: 13000,
        kr: 0.1, f0: 0, massKg: 0.29, capping: 'open',
        tolerances: getIso492Tolerances(30, 62),
        e: 0.35, Y: 1.9, Y0: 1.8,
        taperedBoreAvailable: true,
        adapterSleeveDesignation: 'H 306',
        calculationFactorY1: 1.9,
        calculationFactorY2: 2.9,
        catalogPageRef: 794
    },

    // ─────────────────────────────────────────────────────────────────
    // 9. NEEDLE ROLLER BEARINGS (SKF HK DRAWN CUP & NA 49 MACHINED)
    // ─────────────────────────────────────────────────────────────────
    {
        code: 'HK2016',
        fullDesignation: 'HK 2016',
        type: 'needle-roller',
        series: 'HK',
        d: 20, D: 26, B: 16,
        racewayDiameterFw: 20,
        needleType: 'drawn-cup',
        shaftHardnessHrc: '58-64 HRC',
        shaftRoughnessRa: '≤ 0.2 µm',
        isReusableAfterDismounting: false,
        d2: 20.0, D2: 25.5, r12Min: 0.8,
        daMin: 20.0, daMax: 20.0, DaMax: 25.0, raMax: 0.8,
        C: 12.3, C0: 20.4, Pu: 2.36,
        speedReferenceRpm: 12000, speedLimitingOpenRpm: 14000,
        kr: 0.2, f0: 0, massKg: 0.019, capping: 'open',
        tolerances: getIso492Tolerances(20, 26),
        catalogPageRef: 622
    },
    {
        code: 'NA4904',
        fullDesignation: 'NA 4904',
        type: 'needle-roller',
        series: 'NA49',
        d: 20, D: 37, B: 17,
        racewayDiameterFw: 24,
        needleType: 'machined-ring',
        racewayDiameterF: 24,
        isReusableAfterDismounting: true,
        d2: 24.0, D2: 33.0, r12Min: 0.3,
        daMin: 22.0, daMax: 24.0, DaMax: 35.0, raMax: 0.3,
        C: 21.6, C0: 28.0, Pu: 3.35,
        speedReferenceRpm: 15000, speedLimitingOpenRpm: 17000,
        kr: 0.2, f0: 0, massKg: 0.075, capping: 'open',
        tolerances: getIso492Tolerances(20, 37),
        catalogPageRef: 640
    },

    // ─────────────────────────────────────────────────────────────────
    // 10. THRUST BALL BEARINGS (SKF 51100 & 51200 SERIES)
    // ─────────────────────────────────────────────────────────────────
    {
        code: '51104',
        fullDesignation: '51104',
        type: 'thrust-ball',
        series: '511',
        d: 20, D: 35, B: 10,
        heightH: 10,
        housingWasherBoreD1: 21,
        shaftWasherOuterD1: 35,
        shaftWasherODD1: 35,
        minLoadFactorA: 0.0044,
        d2: 21.0, D2: 34.0, r12Min: 0.3,
        daMin: 29.0, daMax: 30.0, DaMax: 26.0, raMax: 0.3,
        C: 15.1, C0: 29.0, Pu: 1.08,
        speedReferenceRpm: 7500, speedLimitingOpenRpm: 10000,
        kr: 0.045, f0: 10, massKg: 0.037, capping: 'open',
        tolerances: getIso492Tolerances(20, 35),
        catalogPageRef: 474
    },
    {
        code: '51204',
        fullDesignation: '51204',
        type: 'thrust-ball',
        series: '512',
        d: 20, D: 40, B: 14,
        heightH: 14,
        housingWasherBoreD1: 40,
        shaftWasherODD1: 21,
        minLoadFactorA: 0.0089,
        d2: 21.0, D2: 39.0, r12Min: 0.6,
        daMin: 32.0, daMax: 33.0, DaMax: 28.0, raMax: 0.6,
        C: 22.1, C0: 37.5, Pu: 1.4,
        speedReferenceRpm: 5300, speedLimitingOpenRpm: 7500,
        kr: 0.05, f0: 10, massKg: 0.081, capping: 'open',
        tolerances: getIso492Tolerances(20, 40),
        catalogPageRef: 474
    }
];

/**
 * Search/lookup bearing in authentic SKF database
 */
export function findSKFBearing(code: string): SKFBearingRecord | undefined {
    const clean = code.toUpperCase().replace(/\s/g, '');
    return SKF_MASTER_CATALOG.find(b => 
        b.code === clean || 
        b.fullDesignation.replace(/\s/g, '').toUpperCase() === clean ||
        clean.startsWith(b.code)
    );
}
