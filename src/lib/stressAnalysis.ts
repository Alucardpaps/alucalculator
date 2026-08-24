/**
 * Comprehensive Stress Analysis Library
 * 
 * Analysis Types (inspired by Autodesk Inventor Stress Analysis):
 * - Principal Stresses (σ1, σ2, σ3)
 * - Von Mises (Equivalent) Stress
 * - Mohr's Circle
 * - Tresca (Max Shear) Stress
 * - Factor of Safety
 * - Fatigue Analysis (Goodman, Soderberg)
 * - Buckling (Euler, Johnson)
 * - Beam Bending & Deflection
 * - Torsion
 * - Combined Loading
 * - Pressure Vessel (Thin/Thick Wall)
 */

import { MATERIALS_DB, MaterialProp } from '@/data/materialsData';

// ==================== TYPES ====================

export type AnalysisType =
    | 'principal'
    | 'vonMises'
    | 'mohr'
    | 'tresca'
    | 'fatigue'
    | 'buckling'
    | 'beam'
    | 'torsion'
    | 'combined'
    | 'pressure';

export interface StressState2D {
    sigmaX: number;    // σx - Normal stress in X
    sigmaY: number;    // σy - Normal stress in Y
    tauXY: number;     // τxy - Shear stress
}

export interface StressState3D extends StressState2D {
    sigmaZ: number;    // σz - Normal stress in Z
    tauYZ: number;     // τyz - Shear stress YZ plane
    tauXZ: number;     // τxz - Shear stress XZ plane
}

export interface PrincipalStresses {
    sigma1: number;    // Maximum principal stress
    sigma2: number;    // Intermediate principal stress
    sigma3: number;    // Minimum principal stress
    tauMax: number;    // Maximum shear stress
    angle: number;     // Principal angle (degrees)
}

export interface MaterialStrength {
    name: string;
    Sy: number;        // Yield strength (MPa)
    Su: number;        // Ultimate tensile strength (MPa)
    E: number;         // Young's modulus (GPa)
    Se?: number;       // Endurance limit (MPa) - for fatigue
    G?: number;        // Shear modulus (GPa)
    v?: number;        // Poisson's ratio
}

// ==================== MATERIAL DATABASE ====================

// Map MATERIALS_DB to MaterialStrength for backward compatibility
export const STRENGTH_MATERIALS = MATERIALS_DB.map(m => ({
    name: m.name,
    Sy: m.yield,
    Su: m.tensile,
    E: m.youngsModulus,
    Se: m.enduranceLimit,
    G: m.shearModulus,
    v: m.poissonsRatio
})) as MaterialStrength[];

// ==================== ANALYSIS FUNCTIONS ====================

/**
 * Calculate Principal Stresses from 2D stress state
 */
export function calculatePrincipalStresses2D(state: StressState2D): PrincipalStresses {
    const { sigmaX, sigmaY, tauXY } = state;

    const sigmaAvg = (sigmaX + sigmaY) / 2;
    const R = Math.sqrt(Math.pow((sigmaX - sigmaY) / 2, 2) + Math.pow(tauXY, 2));

    const sigma1 = sigmaAvg + R;
    const sigma2 = sigmaAvg - R;
    const sigma3 = 0; // Plane stress assumption

    const tauMax = R;

    // Principal angle (in degrees)
    const angle = (0.5 * Math.atan2(2 * tauXY, sigmaX - sigmaY)) * (180 / Math.PI);

    return { sigma1, sigma2, sigma3, tauMax, angle };
}

/**
 * Calculate Principal Stresses from 3D stress state
 */
export function calculatePrincipalStresses3D(state: StressState3D): PrincipalStresses {
    const { sigmaX, sigmaY, sigmaZ, tauXY, tauYZ, tauXZ } = state;

    const I1 = sigmaX + sigmaY + sigmaZ;
    const I2 = sigmaX * sigmaY + sigmaY * sigmaZ + sigmaZ * sigmaX
        - tauXY * tauXY - tauYZ * tauYZ - tauXZ * tauXZ;
    const I3 = sigmaX * sigmaY * sigmaZ
        + 2 * tauXY * tauYZ * tauXZ
        - sigmaX * tauYZ * tauYZ
        - sigmaY * tauXZ * tauXZ
        - sigmaZ * tauXY * tauXY;

    const Q = (3 * I2 - I1 * I1) / 9;
    const R = (2 * I1 * I1 * I1 - 9 * I1 * I2 + 27 * I3) / 54;

    const theta = Math.acos(R / Math.sqrt(-Q * Q * Q));
    const sqrtQ = 2 * Math.sqrt(-Q);

    let s1 = sqrtQ * Math.cos(theta / 3) + I1 / 3;
    let s2 = sqrtQ * Math.cos((theta + 2 * Math.PI) / 3) + I1 / 3;
    let s3 = sqrtQ * Math.cos((theta + 4 * Math.PI) / 3) + I1 / 3;

    let res = [s1, s2, s3].sort((a, b) => b - a);
    const sigma1 = res[0];
    const sigma2 = res[1];
    const sigma3 = res[2];

    const tauMax = (sigma1 - sigma3) / 2;

    return { sigma1, sigma2, sigma3, tauMax, angle: 0 };
}

/**
 * Calculate Von Mises (Equivalent) Stress
 */
export function calculateVonMises(principal: PrincipalStresses): number {
    const { sigma1, sigma2, sigma3 } = principal;
    return Math.sqrt(0.5 * (
        Math.pow(sigma1 - sigma2, 2) +
        Math.pow(sigma2 - sigma3, 2) +
        Math.pow(sigma3 - sigma1, 2)
    ));
}

/**
 * Calculate Von Mises from 2D stress state directly
 */
export function calculateVonMises2D(state: StressState2D): number {
    const { sigmaX, sigmaY, tauXY } = state;
    return Math.sqrt(sigmaX * sigmaX - sigmaX * sigmaY + sigmaY * sigmaY + 3 * tauXY * tauXY);
}

/**
 * Calculate Tresca (Maximum Shear) Stress
 */
export function calculateTresca(principal: PrincipalStresses): number {
    return principal.sigma1 - principal.sigma3;
}

/**
 * Calculate Factor of Safety
 */
export function calculateSafetyFactor(
    vonMises: number,
    material: MaterialStrength,
    criterion: 'yield' | 'ultimate' = 'yield'
): { fos: number; status: 'safe' | 'marginal' | 'failure' } {
    const allowable = criterion === 'yield' ? material.Sy : material.Su;
    const fos = allowable / vonMises;

    let status: 'safe' | 'marginal' | 'failure';
    if (fos >= 2.0) status = 'safe';
    else if (fos >= 1.0) status = 'marginal';
    else status = 'failure';

    return { fos, status };
}

/**
 * Mohr's Circle data for visualization
 */
export function getMohrCircleData(state: StressState2D): {
    center: { x: number; y: number };
    radius: number;
    sigma1Point: { x: number; y: number };
    sigma2Point: { x: number; y: number };
    stateXPoint: { x: number; y: number };
    stateYPoint: { x: number; y: number };
} {
    const { sigmaX, sigmaY, tauXY } = state;

    const centerX = (sigmaX + sigmaY) / 2;
    const radius = Math.sqrt(Math.pow((sigmaX - sigmaY) / 2, 2) + Math.pow(tauXY, 2));

    return {
        center: { x: centerX, y: 0 },
        radius,
        sigma1Point: { x: centerX + radius, y: 0 },
        sigma2Point: { x: centerX - radius, y: 0 },
        stateXPoint: { x: sigmaX, y: tauXY },
        stateYPoint: { x: sigmaY, y: -tauXY },
    };
}

// ==================== FATIGUE ANALYSIS ====================

export interface FatigueResult {
    Nf: number;              // Cycles to failure
    safetyCycles: number;    // Safety factor for infinite life
    criterion: string;
    safe: boolean;
}

/**
 * Goodman Fatigue Criterion
 */
export function calculateGoodman(
    sigmaA: number,
    sigmaM: number,
    material: MaterialStrength
): FatigueResult {
    const Se = material.Se || material.Sy * 0.5;
    const Su = material.Su;

    const n = 1 / (sigmaA / Se + sigmaM / Su);
    const safe = n >= 1.5;

    return {
        Nf: safe ? Infinity : Math.pow(10, 6 * n),
        safetyCycles: n,
        criterion: 'Goodman',
        safe
    };
}

/**
 * Soderberg Fatigue Criterion
 */
export function calculateSoderberg(
    sigmaA: number,
    sigmaM: number,
    material: MaterialStrength
): FatigueResult {
    const Se = material.Se || material.Sy * 0.5;
    const Sy = material.Sy;

    const n = 1 / (sigmaA / Se + sigmaM / Sy);
    const safe = n >= 1.5;

    return {
        Nf: safe ? Infinity : Math.pow(10, 6 * n),
        safetyCycles: n,
        criterion: 'Soderberg',
        safe
    };
}

// ==================== BUCKLING ANALYSIS ====================

export interface BucklingResult {
    Pcr: number;
    Scr: number;
    slendernessRatio: number;
    mode: 'Euler' | 'Johnson';
    safe: boolean;
}

/**
 * Column Buckling Analysis
 */
export function calculateBuckling(
    length: number,
    I: number,
    A: number,
    material: MaterialStrength,
    endCondition: 'fixed-fixed' | 'fixed-pinned' | 'pinned-pinned' | 'fixed-free' = 'pinned-pinned',
    appliedLoad: number = 0
): BucklingResult {
    const E = material.E * 1000;
    const Sy = material.Sy;

    const KMap: Record<string, number> = {
        'fixed-fixed': 0.5,
        'fixed-pinned': 0.7,
        'pinned-pinned': 1.0,
        'fixed-free': 2.0
    };
    const kFactor = KMap[endCondition];

    const Le = kFactor * length;
    const r = Math.sqrt(I / A);
    const sl = Le / r;

    const Cc = Math.sqrt((2 * Math.PI * Math.PI * E) / Sy);

    let Scr: number;
    let mode: 'Euler' | 'Johnson';

    if (sl > Cc) {
        Scr = (Math.PI * Math.PI * E) / (sl * sl);
        mode = 'Euler';
    } else {
        Scr = Sy * (1 - (Sy * sl * sl) / (4 * Math.PI * Math.PI * E));
        mode = 'Johnson';
    }

    const Pcr = Scr * A;
    const safe = appliedLoad > 0 ? (Pcr / appliedLoad) >= 2.5 : true;

    return { Pcr, Scr, slendernessRatio: sl, mode, safe };
}

// ==================== BEAM ANALYSIS ====================

export type BeamType = 'cantilever' | 'simply_supported' | 'fixed_both' | 'fixed_pinned';
export type LoadType = 'point_end' | 'point_center' | 'point_any' | 'distributed';

export interface BeamResult {
    maxDeflection: number;
    maxStress: number;
    maxMoment: number;
    maxShear: number;
    deflectionLocation: string;
    formula: string;
}

/**
 * Beam Deflection and Stress Analysis
 */
export function calculateBeam(
    beamType: BeamType,
    loadType: LoadType,
    length: number,
    load: number,
    E: number,
    I: number,
    W: number
): BeamResult {
    const EMpa = E * 1000;
    let delta = 0;
    let M = 0;
    let V = 0;
    let f = '';
    let loc = '';

    if (beamType === 'cantilever') {
        if (loadType === 'point_end') {
            delta = (load * Math.pow(length, 3)) / (3 * EMpa * I);
            M = load * length;
            V = load;
            f = 'δ = PL³/3EI';
            loc = 'Free end';
        } else if (loadType === 'distributed') {
            delta = (load * Math.pow(length, 4)) / (8 * EMpa * I);
            M = (load * length * length) / 2;
            V = load * length;
            f = 'δ = wL⁴/8EI';
            loc = 'Free end';
        }
    } else if (beamType === 'simply_supported') {
        if (loadType === 'point_center') {
            delta = (load * Math.pow(length, 3)) / (48 * EMpa * I);
            M = (load * length) / 4;
            V = load / 2;
            f = 'δ = PL³/48EI';
            loc = 'Center';
        } else if (loadType === 'distributed') {
            delta = (5 * load * Math.pow(length, 4)) / (384 * EMpa * I);
            M = (load * length * length) / 8;
            V = (load * length) / 2;
            f = 'δ = 5wL⁴/384EI';
            loc = 'Center';
        }
    } else if (beamType === 'fixed_both') {
        if (loadType === 'point_center') {
            delta = (load * Math.pow(length, 3)) / (192 * EMpa * I);
            M = (load * length) / 8;
            V = load / 2;
            f = 'δ = PL³/192EI';
            loc = 'Center';
        } else if (loadType === 'distributed') {
            delta = (load * Math.pow(length, 4)) / (384 * EMpa * I);
            M = (load * length * length) / 12;
            V = (load * length) / 2;
            f = 'δ = wL⁴/384EI';
            loc = 'Center';
        }
    }

    const stress = W > 0 ? M / W : 0;

    return { maxDeflection: delta, maxStress: stress, maxMoment: M, maxShear: V, deflectionLocation: loc, formula: f };
}

// ==================== TORSION ANALYSIS ====================

export interface TorsionResult {
    maxShearStress: number;
    angleOfTwist: number;
    angleOfTwistDeg: number;
}

/**
 * Torsion Analysis for Circular Shafts
 */
export function calculateTorsion(
    torque: number,
    length: number,
    diameter: number,
    innerDiameter: number = 0,
    G: number
): TorsionResult {
    const GMpa = G * 1000;
    const J = (Math.PI / 32) * (Math.pow(diameter, 4) - Math.pow(innerDiameter, 4));
    const tau = (torque * (diameter / 2)) / J;
    const theta = (torque * length) / (GMpa * J);
    return { maxShearStress: tau, angleOfTwist: theta, angleOfTwistDeg: theta * (180 / Math.PI) };
}

// ==================== PRESSURE VESSEL ====================

export interface PressureVesselResult {
    hoopStress: number;
    axialStress: number;
    radialStress: number;
    vonMises: number;
    method: 'thin-wall' | 'thick-wall';
}

/**
 * Pressure Vessel Stress Analysis
 */
export function calculatePressureVessel(
    pi: number,
    po: number,
    ri: number,
    ro: number,
    pos: 'inner' | 'outer' = 'inner'
): PressureVesselResult {
    const t = ro - ri;
    const isThin = t / ri < 0.1;

    let sh: number, sa: number, sr: number;

    if (isThin && po === 0) {
        sh = (pi * ri) / t;
        sa = (pi * ri) / (2 * t);
        sr = -pi / 2;
    } else {
        const r = pos === 'inner' ? ri : ro;
        const A = (pi * ri * ri - po * ro * ro) / (ro * ro - ri * ri);
        const B = (pi - po) * ri * ri * ro * ro / (ro * ro - ri * ri);
        sh = A + B / (r * r);
        sr = A - B / (r * r);
        sa = (pi * ri * ri - po * ro * ro) / (ro * ro - ri * ri);
    }

    const vm = Math.sqrt(sh * sh + sa * sa + sr * sr - sh * sa - sa * sr - sr * sh);

    return { hoopStress: sh, axialStress: sa, radialStress: sr, vonMises: vm, method: isThin ? 'thin-wall' : 'thick-wall' };
}

// ==================== COMBINED LOADING ====================

export interface CombinedLoadResult {
    normalStress: number;
    shearStress: number;
    vonMises: number;
    principal: PrincipalStresses;
    safetyFactor: number;
}

/**
 * Combined Loading Analysis
 */
export function calculateCombinedLoading(
    P: number,
    M: number,
    T: number,
    A: number,
    I: number,
    J: number,
    y: number,
    r: number,
    mat: MaterialStrength
): CombinedLoadResult {
    const sn = (P / A) + (M * y / I);
    const ss = (T * r) / J;
    const state = { sigmaX: sn, sigmaY: 0, tauXY: ss };
    const p = calculatePrincipalStresses2D(state);
    const vm = calculateVonMises2D(state);
    const { fos } = calculateSafetyFactor(vm, mat);
    return { normalStress: sn, shearStress: ss, vonMises: vm, principal: p, safetyFactor: fos };
}
