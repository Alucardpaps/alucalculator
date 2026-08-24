/**
 * Bearing Analysis Engine (ISO 281 / L10)
 * 
 * Central calculation service for bearing life, equivalent loads,
 * and safety factors.
 */

import { BearingData, computeEquivalentLoadsAndWarnings } from '@/data/skfBearings';

export interface LifeResults {
    P: number;            // Equivalent dynamic load (kN)
    P0: number;           // Equivalent static load (kN)
    L10: number;          // Million revolutions
    L10h: number;         // Basic rating life (hours)
    Lna?: number;         // Adjusted rating life (hours)
    staticSafety: number; // s0 factor
    viscosityRatio?: number; // kappa
    status: 'safe' | 'warning' | 'critical';
    warnings?: string[];
}

export interface LifeInput {
    bearing: BearingData;
    fr: number;           // Radial Load (kN)
    fa: number;           // Axial Load (kN)
    rpm: number;
    reliability?: number; // 90 to 99
    baseViscosity?: number; // mm2/s (at op temp)
    ratedViscosity?: number; // mm2/s
}

/**
 * Reliability factor a1 (ISO 281)
 */
const RELIABILITY_FACTORS: Record<number, number> = {
    90: 1.00,
    95: 0.64,
    96: 0.55,
    97: 0.47,
    98: 0.37,
    99: 0.25
};

/**
 * ISO 281 life exponent p
 */
const getLifeExponent = (code: string): number => {
    // 3 for ball, 10/3 for roller
    const upper = code.toUpperCase();
    if (/^[NU|NJ|NF|RNA|NA|NK|3|2]/.test(upper)) return 10/3; // Roller types
    return 3; // Ball types
};

/**
 * Calculate Equivalent Dynamic Load (P)
 */
export function calculateEquivalentLoad(fr: number, fa: number, bearing: BearingData): number {
    const { P } = computeEquivalentLoadsAndWarnings(bearing, fr, fa);
    return P;
}

/**
 * Calculate Reference Viscosity (nu1) in mm2/s
 * Based on n and dm = (d+D)/2
 */
export function calculateReferenceViscosity(n: number, dm: number): number {
    if (n <= 0 || dm <= 0) return 0;
    // nu1 = 45000 * n^-0.83 * dm^-0.5 (Approx SKF formula)
    return 45000 * Math.pow(n, -0.83) * Math.pow(dm, -0.5);
}

/**
 * Calculate Bearing Life & Stats (Enhanced)
 */
export function analyzeBearingLife(input: LifeInput): LifeResults {
    const { bearing, fr, fa, rpm, reliability = 90 } = input;
    const p = getLifeExponent(bearing.code);
    const dm = (bearing.d + bearing.D) / 2;

    // Unified Analysis
    const { P, P0, warnings } = computeEquivalentLoadsAndWarnings(bearing, fr, fa);
    const L10 = Math.pow(bearing.C / Math.max(0.1, P), p);
    const L10h = (L10 * 1e6) / (60 * (rpm || 1));
    
    // Static Analysis Safety
    const s0 = bearing.C0 / Math.max(0.1, P0);
    
    // Adjusted Life (a1)
    const a1 = RELIABILITY_FACTORS[reliability] || 1.0;
    
    // Viscosity Ratio κ
    let kappa = 1.0;
    if (input.baseViscosity) {
        const nu1 = calculateReferenceViscosity(rpm, dm);
        kappa = input.baseViscosity / nu1;
    }

    // Advanced Life Factor a_iso (Simple estimate)
    const a_iso = Math.min(Math.max(0.1, Math.pow(kappa, 0.4)), 3.0);
    const Lnm = a1 * a_iso * L10h;

    // Status logic
    let status: LifeResults['status'] = 'safe';
    if (s0 < 1.0 || Lnm < 5000 || warnings.length > 0) status = 'critical';
    else if (s0 < 2.0 || Lnm < 20000) status = 'warning';

    return {
        P,
        P0,
        L10,
        L10h,
        Lna: Lnm, // Using Lnm (ISO model) as Lna
        staticSafety: s0,
        viscosityRatio: kappa,
        status,
        warnings
    };
}

/**
 * Generate Life Sensitivity Chart Data
 */
export function getLifeSensitivity(input: LifeInput, steps: number = 20) {
    const baseFr = input.fr || 1;
    const minFr = baseFr * 0.4;
    const maxFr = baseFr * 2.5;
    const stepSize = (maxFr - minFr) / steps;
    
    const series = [];
    for (let i = 0; i <= steps; i++) {
        const curFr = minFr + i * stepSize;
        const res = analyzeBearingLife({ ...input, fr: curFr });
        series.push({
            load: curFr,
            life: Math.min(res.Lna || 0, 500000), 
            status: res.status
        });
    }
    return series;
}
