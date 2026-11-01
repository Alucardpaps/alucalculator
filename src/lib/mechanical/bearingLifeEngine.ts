/**
 * Bearing Analysis Engine — ISO 281:2007
 *
 * Normative tier:
 *   - Basic rating life L10 = (C/P)^p, p = 3 (ball) / 10/3 (roller)            ISO 281 §6/§7
 *   - Reliability factor a1 (Table 12)                                         ISO 281 §9.2
 *   - Life modification factor aISO(ec·Cu/P, κ) (eqs. 15–17 ball, 18–20 roller) ISO 281 §9.3
 *   - Reference viscosity ν1(n, dm) (ISO 281 §9.3.3, Fig. 11 fit)
 *   - Fatigue load limit estimate Cu ≈ C0/22 (ball), C0/8.2 (roller), size-corrected above dm = 100 mm  ISO 281 Annex B.3
 */

import { BearingData, computeEquivalentLoadsAndWarnings, detectBearingType } from '@/data/skfBearings';

export interface LifeResults {
    P: number;            // Equivalent dynamic load (kN)
    P0: number;           // Equivalent static load (kN)
    L10: number;          // Million revolutions
    L10h: number;         // Basic rating life (hours)
    Lna?: number;         // Modified rating life Lnm (hours) = a1 · aISO · L10h
    a1?: number;
    aISO?: number;
    Cu?: number;          // fatigue load limit used (kN)
    nu1?: number;         // reference viscosity (mm²/s)
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
    baseViscosity?: number; // operating viscosity ν (mm²/s at operating temperature)
    ratedViscosity?: number; // override ν1 (mm²/s)
    contamination?: number; // ec (ISO 281 Table 13), default 0.5 (normal cleanliness)
}

/** ISO 281:2007 Table 12 — reliability factor a1 */
export const RELIABILITY_FACTORS: Record<number, number> = {
    90: 1.00,
    95: 0.64,
    96: 0.55,
    97: 0.47,
    98: 0.37,
    99: 0.25,
};

/** ISO 281 Table 13 — contamination factor ec (typical values, dm < 100 mm) */
export const CONTAMINATION_LEVELS: { id: string; ec: number; en: string; tr: string }[] = [
    { id: 'extreme', ec: 1.0, en: 'Extreme cleanliness (lab)', tr: 'Aşırı temiz (laboratuvar)' },
    { id: 'high', ec: 0.7, en: 'High cleanliness (filtered, sealed)', tr: 'Yüksek temizlik (filtreli, kapalı)' },
    { id: 'normal', ec: 0.55, en: 'Normal cleanliness (sealed for life)', tr: 'Normal temizlik (ömür boyu yağlı, keçeli)' },
    { id: 'slight', ec: 0.4, en: 'Slight contamination', tr: 'Hafif kirlilik' },
    { id: 'typical', ec: 0.2, en: 'Typical contamination (no seals)', tr: 'Tipik kirlilik (keçesiz)' },
    { id: 'severe', ec: 0.05, en: 'Severe contamination', tr: 'Ağır kirlilik' },
];

const isRoller = (b: BearingData) => b.type.includes('roller');

/** ISO 281 life exponent p (3 for ball bearings, 10/3 for roller bearings) */
const getLifeExponent = (code: string, bearingType?: string): number => {
    if (bearingType) {
        if (bearingType.includes('roller')) return 10 / 3;
        if (bearingType.includes('ball')) return 3;
    }
    return detectBearingType(code).lifeFactor;
};

export function calculateEquivalentLoad(fr: number, fa: number, bearing: BearingData): number {
    return computeEquivalentLoadsAndWarnings(bearing, fr, fa).P;
}

/**
 * Reference (rated) viscosity ν1 in mm²/s — ISO 281 §9.3.3
 *   n < 1000 rpm : ν1 = 45000 · n^-0.83 · dm^-0.5
 *   n ≥ 1000 rpm : ν1 = 4500  · n^-0.5  · dm^-0.5
 */
export function calculateReferenceViscosity(n: number, dm: number): number {
    if (n <= 0 || dm <= 0) return 0;
    return n < 1000 ? 45000 * Math.pow(n, -0.83) * Math.pow(dm, -0.5) : 4500 * Math.pow(n, -0.5) * Math.pow(dm, -0.5);
}

/** ISO 281 Annex B.3 — approximate fatigue load limit Cu (kN) */
export function estimateFatigueLoadLimit(b: BearingData): number {
    const dm = (b.d + b.D) / 2;
    if (isRoller(b)) return (b.C0 / 8.2) * (dm > 100 ? Math.pow(100 / dm, 0.3) : 1);
    return (b.C0 / 22) * (dm > 100 ? Math.pow(100 / dm, 0.5) : 1);
}

/** ISO 281:2007 eqs. (15)–(20): life modification factor aISO, capped at 50 */
export function aIsoFactor(roller: boolean, kappaIn: number, ecCuP: number): number {
    const kappa = Math.min(4, Math.max(0.1, kappaIn));
    const x = Math.max(0, ecCuP);
    let inner: number;
    if (!roller) {
        const c = kappa < 0.4 ? 2.2649 / Math.pow(kappa, 0.054381) : kappa < 1 ? 1.9987 / Math.pow(kappa, 0.19087) : 1.9987 / Math.pow(kappa, 0.071739);
        inner = 1 - Math.pow(Math.max(0, 2.5671 - c), 0.83) * Math.pow(x, 1 / 3);
        if (inner <= 0) return 50;
        return Math.min(50, 0.1 * Math.pow(inner, -9.3));
    }
    const c = kappa < 0.4 ? 1.3993 / Math.pow(kappa, 0.054381) : kappa < 1 ? 1.2348 / Math.pow(kappa, 0.19087) : 1.2348 / Math.pow(kappa, 0.071739);
    inner = 1 - Math.max(0, 1.5859 - c) * Math.pow(x, 0.4);
    if (inner <= 0) return 50;
    return Math.min(50, 0.1 * Math.pow(inner, -9.185));
}

/** Full ISO 281 analysis */
export function analyzeBearingLife(input: LifeInput): LifeResults {
    const { bearing, fr, fa, rpm, reliability = 90 } = input;
    const p = getLifeExponent(bearing.code, bearing.type);
    const dm = (bearing.d + bearing.D) / 2;

    const { P, P0, warnings } = computeEquivalentLoadsAndWarnings(bearing, fr, fa);
    const Pc = Math.max(1e-6, P);
    const L10 = Math.pow(bearing.C / Pc, p);
    const L10h = (L10 * 1e6) / (60 * Math.max(1, rpm));
    const s0 = bearing.C0 / Math.max(1e-6, P0);
    const a1 = RELIABILITY_FACTORS[reliability] ?? 1.0;

    let kappa: number | undefined;
    let nu1: number | undefined;
    let aISO = 1;
    const Cu = estimateFatigueLoadLimit(bearing);
    if (input.baseViscosity && input.baseViscosity > 0) {
        nu1 = input.ratedViscosity && input.ratedViscosity > 0 ? input.ratedViscosity : calculateReferenceViscosity(rpm, dm);
        kappa = nu1 > 0 ? input.baseViscosity / nu1 : undefined;
        const ec = input.contamination ?? 0.55;
        if (kappa !== undefined) {
            aISO = aIsoFactor(isRoller(bearing), kappa, (ec * Cu) / Pc);
            if (kappa < 0.1) warnings.push('κ < 0.1 — outside ISO 281 validity; lubrication is insufficient.');
            if (kappa < 1) warnings.push('κ < 1: an EP-additive lubricant is recommended (ISO 281 §9.3.3).');
        }
    }
    const Lnm = a1 * aISO * L10h;

    let status: LifeResults['status'] = 'safe';
    if (s0 < 1.0 || Lnm < 5000) status = 'critical';
    else if (s0 < 2.0 || Lnm < 20000 || warnings.length > 0) status = 'warning';

    return { P, P0, L10, L10h, Lna: Lnm, a1, aISO, Cu, nu1, staticSafety: s0, viscosityRatio: kappa, status, warnings };
}

/** Life over a range of radial loads (sensitivity chart) */
export function getLifeSensitivity(input: LifeInput, steps: number = 20) {
    const baseFr = input.fr || 1;
    const minFr = baseFr * 0.4;
    const maxFr = baseFr * 2.5;
    const stepSize = (maxFr - minFr) / steps;
    const series = [];
    for (let i = 0; i <= steps; i++) {
        const curFr = minFr + i * stepSize;
        const res = analyzeBearingLife({ ...input, fr: curFr });
        series.push({ load: curFr, life: Math.min(res.Lna || 0, 500000), status: res.status });
    }
    return series;
}
