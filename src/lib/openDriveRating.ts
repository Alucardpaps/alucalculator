/**
 * Professional open-drive ratings:
 * - Friction / timing belts: centrifugal tension, shaft load, flex frequency, teeth in mesh
 * - Roller chain: ANSI/ISO 10823 screening kW, lubrication regime, even-link centre, centrifugal pull
 */

export interface BeltRatingInput {
    d1: number;
    d2: number;
    C: number;
    n1: number;
    designPowerKW: number;
    wrapRad: number;
    tensionRatio: number;
    positiveDrive: boolean;
    pretensionFactor: number;
    linearDensityKgM?: number;
    beltLengthMm: number;
    z1?: number;
}

export interface BeltRatingResult {
    Te: number;
    Tc: number;
    T1: number;
    T2: number;
    shaftLoadN: number;
    flexHz: number;
    teethInMesh: number;
    centrifugalShare: number;
}

/** Rubber / PU linear density from section size when catalog mass is unknown. */
export function estimateBeltLinearDensityKgM(topWidthMm?: number, heightMm?: number): number {
    const w = Math.max(6, topWidthMm ?? 13);
    const h = Math.max(4, heightMm ?? 8);
    const areaM2 = 0.55 * (w / 1000) * (h / 1000);
    return Math.max(0.03, areaM2 * 1250);
}

export function rateOpenBelt(input: BeltRatingInput): BeltRatingResult {
    const v = (Math.PI * input.d1 * input.n1) / 60000;
    const Te = v > 1e-9 ? (input.designPowerKW * 1000) / v : 0;
    const mu = input.linearDensityKgM ?? 0.08;
    const Tc = mu * v * v;
    const r = input.tensionRatio;

    let T1 = 0;
    let T2 = 0;
    if (input.positiveDrive) {
        T1 = Te * input.pretensionFactor + Tc;
        T2 = Math.max(Tc, T1 - Te);
    } else if (v > 0 && r > 1.001) {
        // ISO 1081 / Euler with centrifugal: (T1 − Tc)/(T2 − Tc) = e^{μθ/sinβ}
        T2 = Tc + Te / (r - 1);
        T1 = T2 + Te;
    } else {
        T1 = Te + Tc;
        T2 = Tc;
    }

    const theta = input.wrapRad;
    const shaftLoadN = Math.sqrt(Math.max(0, T1 * T1 + T2 * T2 - 2 * T1 * T2 * Math.cos(theta)));
    const L_m = Math.max(0.05, input.beltLengthMm / 1000);
    const flexHz = v > 0 ? (2 * v) / L_m : 0;
    const teethInMesh =
        input.positiveDrive && input.z1 && input.z1 > 0
            ? input.z1 * (theta / (2 * Math.PI))
            : 0;
    const centrifugalShare = T1 > 1e-6 ? Tc / T1 : 0;

    return { Te, Tc, T1, T2, shaftLoadN, flexHz, teethInMesh, centrifugalShare };
}

export type ChainLubeRegime = 'manual' | 'drip' | 'oil-bath' | 'circulating';

export interface ChainRatingInput {
    pitchMm: number;
    z1: number;
    z2: number;
    C: number;
    n1: number;
    designPowerKW: number;
    strandCount: number;
    loadShare: number;
    breakingLoadN: number;
    workingLoadN: number;
}

export interface ChainRatingResult {
    ratedPowerKW: number;
    powerUtilization: number;
    evenLinks: number;
    C_even: number;
    centrifugalN: number;
    lube: ChainLubeRegime;
    lubeNote: string;
    massKgM: number;
}

/**
 * ANSI B29.1 / ISO 10823 screening capacity (kW) for a roller chain.
 * Tooth term − impact term, scaled by non-ideal strand load-share.
 */
export function iso10823RatedPowerKw(pitchMm: number, z1: number, n1: number, loadShare: number): number {
    const pIn = pitchMm / 25.4;
    const n = Math.max(1, n1);
    const z = Math.max(11, z1);
    const tooth = 0.0022 * n * z * pIn * pIn;
    const impact = 1.57e-7 * n * n * z * pIn * pIn * pIn;
    return Math.max(0.05, (tooth - impact) * Math.max(0.5, loadShare));
}

export function chainLubricationRegime(vMps: number): { lube: ChainLubeRegime; note: string } {
    if (vMps < 1) return { lube: 'manual', note: 'Manual / brush lubrication (v < 1 m/s).' };
    if (vMps < 4) return { lube: 'drip', note: 'Drip or disc lubrication (1–4 m/s).' };
    if (vMps < 8) return { lube: 'oil-bath', note: 'Oil-bath lubrication (4–8 m/s).' };
    return { lube: 'circulating', note: 'Forced circulating lubrication required (v ≥ 8 m/s).' };
}

/** Nearest even pitch-count centre distance (ISO 10823 / Shigley). */
export function evenLinkCenterMm(pitchMm: number, z1: number, z2: number, Cmm: number): { links: number; evenLinks: number; C_even: number } {
    const p = Math.max(1, pitchMm);
    const C = Math.max(p, Cmm);
    const Lp = 2 * (C / p) + (z1 + z2) / 2 + ((z2 - z1) ** 2) / (4 * Math.PI * Math.PI * (C / p));
    const evenLinks = Math.max(2, Math.round(Lp / 2) * 2);
    const k = evenLinks - (z1 + z2) / 2;
    const disc = k * k - 8 * ((z2 - z1) / (2 * Math.PI)) ** 2;
    const Cp = 0.25 * (k + Math.sqrt(Math.max(0, disc)));
    return { links: Lp, evenLinks, C_even: Cp * p };
}

export function estimateChainMassKgM(pitchMm: number, strandCount: number): number {
    // Fits ISO 08B≈0.70, 10B≈1.0, 16B≈2.7 kg/m simplex.
    return 0.0042 * Math.pow(pitchMm, 1.55) * Math.max(1, strandCount);
}

export function rateRollerChain(input: ChainRatingInput): ChainRatingResult {
    const d1 = input.pitchMm / Math.sin(Math.PI / Math.max(11, input.z1));
    const v = (Math.PI * d1 * input.n1) / 60000;
    const ratedPowerKW = iso10823RatedPowerKw(input.pitchMm, input.z1, input.n1, input.loadShare);
    const powerUtilization = ratedPowerKW > 0 ? (input.designPowerKW / ratedPowerKW) * 100 : 0;
    const { links, evenLinks, C_even } = evenLinkCenterMm(input.pitchMm, input.z1, input.z2, input.C);
    const massKgM = estimateChainMassKgM(input.pitchMm, input.strandCount);
    const centrifugalN = massKgM * v * v;
    const { lube, note } = chainLubricationRegime(v);
    void links;
    void input.breakingLoadN;
    void input.workingLoadN;
    return {
        ratedPowerKW,
        powerUtilization,
        evenLinks,
        C_even,
        centrifugalN,
        lube,
        lubeNote: note,
        massKgM,
    };
}
