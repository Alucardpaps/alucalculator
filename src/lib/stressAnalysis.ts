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

export const STRENGTH_MATERIALS: MaterialStrength[] = [
    { name: 'Steel AISI 1020', Sy: 350, Su: 450, E: 200, Se: 225, G: 79, v: 0.29 },
    { name: 'Steel AISI 1045', Sy: 530, Su: 625, E: 200, Se: 312, G: 79, v: 0.29 },
    { name: 'Steel AISI 4140', Sy: 655, Su: 1020, E: 200, Se: 410, G: 79, v: 0.29 },
    { name: 'Stainless 304', Sy: 215, Su: 505, E: 193, Se: 170, G: 77, v: 0.29 },
    { name: 'Stainless 316', Sy: 290, Su: 580, E: 193, Se: 200, G: 77, v: 0.29 },
    { name: 'Aluminum 6061-T6', Sy: 275, Su: 310, E: 69, Se: 95, G: 26, v: 0.33 },
    { name: 'Aluminum 7075-T6', Sy: 503, Su: 572, E: 71, Se: 160, G: 27, v: 0.33 },
    { name: 'Titanium Ti-6Al-4V', Sy: 880, Su: 950, E: 114, Se: 350, G: 44, v: 0.34 },
    { name: 'Cast Iron (Gray)', Sy: 150, Su: 200, E: 100, Se: 60, G: 41, v: 0.26 },
    { name: 'Brass C36000', Sy: 140, Su: 340, E: 97, Se: 100, G: 37, v: 0.34 },
    { name: 'Bronze C93200', Sy: 125, Su: 240, E: 100, Se: 80, G: 38, v: 0.34 },
];

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
 * Uses eigenvalue solution of stress tensor
 */
export function calculatePrincipalStresses3D(state: StressState3D): PrincipalStresses {
    const { sigmaX, sigmaY, sigmaZ, tauXY, tauYZ, tauXZ } = state;

    // Stress invariants
    const I1 = sigmaX + sigmaY + sigmaZ;
    const I2 = sigmaX * sigmaY + sigmaY * sigmaZ + sigmaZ * sigmaX
        - tauXY * tauXY - tauYZ * tauYZ - tauXZ * tauXZ;
    const I3 = sigmaX * sigmaY * sigmaZ
        + 2 * tauXY * tauYZ * tauXZ
        - sigmaX * tauYZ * tauYZ
        - sigmaY * tauXZ * tauXZ
        - sigmaZ * tauXY * tauXY;

    // Solve cubic equation using trigonometric method
    const Q = (3 * I2 - I1 * I1) / 9;
    const R = (2 * I1 * I1 * I1 - 9 * I1 * I2 + 27 * I3) / 54;

    const theta = Math.acos(R / Math.sqrt(-Q * Q * Q));
    const sqrtQ = 2 * Math.sqrt(-Q);

    let sigma1 = sqrtQ * Math.cos(theta / 3) + I1 / 3;
    let sigma2 = sqrtQ * Math.cos((theta + 2 * Math.PI) / 3) + I1 / 3;
    let sigma3 = sqrtQ * Math.cos((theta + 4 * Math.PI) / 3) + I1 / 3;

    // Sort descending
    [sigma1, sigma2, sigma3] = [sigma1, sigma2, sigma3].sort((a, b) => b - a);

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
 * σa/Se + σm/Su = 1/n
 */
export function calculateGoodman(
    sigmaA: number,    // Alternating stress amplitude
    sigmaM: number,    // Mean stress
    material: MaterialStrength
): FatigueResult {
    const Se = material.Se || material.Sy * 0.5;
    const Su = material.Su;

    const n = 1 / (sigmaA / Se + sigmaM / Su);
    const safe = n >= 1.5;

    return {
        Nf: safe ? Infinity : Math.pow(10, 6 * n), // Simplified
        safetyCycles: n,
        criterion: 'Goodman',
        safe
    };
}

/**
 * Soderberg Fatigue Criterion (more conservative)
 * σa/Se + σm/Sy = 1/n
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
    Pcr: number;           // Critical load (N)
    Scr: number;           // Critical stress (MPa)
    slendernessRatio: number;
    mode: 'Euler' | 'Johnson';
    safe: boolean;
}

/**
 * Column Buckling Analysis (Euler/Johnson)
 */
export function calculateBuckling(
    length: number,        // Effective length (mm)
    I: number,             // Moment of inertia (mm⁴)
    A: number,             // Cross-section area (mm²)
    material: MaterialStrength,
    endCondition: 'fixed-fixed' | 'fixed-pinned' | 'pinned-pinned' | 'fixed-free' = 'pinned-pinned',
    appliedLoad: number = 0
): BucklingResult {
    const E = material.E * 1000; // Convert GPa to MPa
    const Sy = material.Sy;

    // End condition factor K
    const K: Record<string, number> = {
        'fixed-fixed': 0.5,
        'fixed-pinned': 0.7,
        'pinned-pinned': 1.0,
        'fixed-free': 2.0
    };
    const k = K[endCondition];

    const Le = k * length; // Effective length
    const r = Math.sqrt(I / A); // Radius of gyration
    const slendernessRatio = Le / r;

    // Transition slenderness ratio
    const Cc = Math.sqrt((2 * Math.PI * Math.PI * E) / Sy);

    let Scr: number;
    let mode: 'Euler' | 'Johnson';

    if (slendernessRatio > Cc) {
        // Euler (long column)
        Scr = (Math.PI * Math.PI * E) / (slendernessRatio * slendernessRatio);
        mode = 'Euler';
    } else {
        // Johnson (intermediate column)
        Scr = Sy * (1 - (Sy * slendernessRatio * slendernessRatio) / (4 * Math.PI * Math.PI * E));
        mode = 'Johnson';
    }

    const Pcr = Scr * A;
    const safe = appliedLoad > 0 ? (Pcr / appliedLoad) >= 2.5 : true;

    return { Pcr, Scr, slendernessRatio, mode, safe };
}

// ==================== BEAM ANALYSIS ====================

export type BeamType = 'cantilever' | 'simply_supported' | 'fixed_both' | 'fixed_pinned';
export type LoadType = 'point_end' | 'point_center' | 'point_any' | 'distributed';

export interface BeamResult {
    maxDeflection: number;     // mm
    maxStress: number;         // MPa
    maxMoment: number;         // N·mm
    maxShear: number;          // N
    deflectionLocation: string;
    formula: string;
}

/**
 * Beam Deflection and Stress Analysis
 */
export function calculateBeam(
    beamType: BeamType,
    loadType: LoadType,
    length: number,        // mm
    load: number,          // N (point) or N/mm (distributed)
    E: number,             // GPa
    I: number,             // mm⁴
    W: number,             // mm³ (section modulus)
    loadPosition?: number  // mm from left (for point_any)
): BeamResult {
    const E_MPa = E * 1000;
    let maxDeflection = 0;
    let maxMoment = 0;
    let maxShear = 0;
    let formula = '';
    let deflectionLocation = '';

    if (beamType === 'cantilever') {
        if (loadType === 'point_end') {
            maxDeflection = (load * Math.pow(length, 3)) / (3 * E_MPa * I);
            maxMoment = load * length;
            maxShear = load;
            formula = 'δ = PL³/3EI';
            deflectionLocation = 'Free end';
        } else if (loadType === 'distributed') {
            maxDeflection = (load * Math.pow(length, 4)) / (8 * E_MPa * I);
            maxMoment = (load * length * length) / 2;
            maxShear = load * length;
            formula = 'δ = wL⁴/8EI';
            deflectionLocation = 'Free end';
        }
    } else if (beamType === 'simply_supported') {
        if (loadType === 'point_center') {
            maxDeflection = (load * Math.pow(length, 3)) / (48 * E_MPa * I);
            maxMoment = (load * length) / 4;
            maxShear = load / 2;
            formula = 'δ = PL³/48EI';
            deflectionLocation = 'Center';
        } else if (loadType === 'distributed') {
            maxDeflection = (5 * load * Math.pow(length, 4)) / (384 * E_MPa * I);
            maxMoment = (load * length * length) / 8;
            maxShear = (load * length) / 2;
            formula = 'δ = 5wL⁴/384EI';
            deflectionLocation = 'Center';
        }
    } else if (beamType === 'fixed_both') {
        if (loadType === 'point_center') {
            maxDeflection = (load * Math.pow(length, 3)) / (192 * E_MPa * I);
            maxMoment = (load * length) / 8;
            maxShear = load / 2;
            formula = 'δ = PL³/192EI';
            deflectionLocation = 'Center';
        } else if (loadType === 'distributed') {
            maxDeflection = (load * Math.pow(length, 4)) / (384 * E_MPa * I);
            maxMoment = (load * length * length) / 12;
            maxShear = (load * length) / 2;
            formula = 'δ = wL⁴/384EI';
            deflectionLocation = 'Center';
        }
    }

    const maxStress = W > 0 ? maxMoment / W : 0;

    return { maxDeflection, maxStress, maxMoment, maxShear, deflectionLocation, formula };
}

// ==================== TORSION ANALYSIS ====================

export interface TorsionResult {
    maxShearStress: number;   // MPa
    angleOfTwist: number;     // radians
    angleOfTwistDeg: number;  // degrees
}

/**
 * Torsion Analysis for Circular Shafts
 */
export function calculateTorsion(
    torque: number,        // N·mm
    length: number,        // mm
    diameter: number,      // mm (outer)
    innerDiameter: number = 0, // mm (for hollow shafts)
    G: number              // GPa (shear modulus)
): TorsionResult {
    const G_MPa = G * 1000;
    const d = diameter;
    const di = innerDiameter;

    // Polar moment of inertia
    const J = (Math.PI / 32) * (Math.pow(d, 4) - Math.pow(di, 4));

    // Maximum shear stress at outer surface
    const maxShearStress = (torque * (d / 2)) / J;

    // Angle of twist
    const angleOfTwist = (torque * length) / (G_MPa * J);
    const angleOfTwistDeg = angleOfTwist * (180 / Math.PI);

    return { maxShearStress, angleOfTwist, angleOfTwistDeg };
}

// ==================== PRESSURE VESSEL ====================

export interface PressureVesselResult {
    hoopStress: number;      // σh (MPa) - Circumferential
    axialStress: number;     // σa (MPa) - Longitudinal
    radialStress: number;    // σr (MPa)
    vonMises: number;        // MPa
    method: 'thin-wall' | 'thick-wall';
}

/**
 * Pressure Vessel Stress Analysis
 */
export function calculatePressureVessel(
    innerPressure: number,   // MPa
    outerPressure: number,   // MPa (usually 0)
    innerRadius: number,     // mm
    outerRadius: number,     // mm
    position: 'inner' | 'outer' = 'inner'
): PressureVesselResult {
    const ri = innerRadius;
    const ro = outerRadius;
    const t = ro - ri;
    const pi = innerPressure;
    const po = outerPressure;

    // Check if thin-wall approximation is valid (t/r < 0.1)
    const isThinWall = t / ri < 0.1;

    let hoopStress: number;
    let axialStress: number;
    let radialStress: number;

    if (isThinWall && po === 0) {
        // Thin-wall approximation
        hoopStress = (pi * ri) / t;
        axialStress = (pi * ri) / (2 * t);
        radialStress = -pi / 2; // Average
    } else {
        // Thick-wall (Lamé equations)
        const r = position === 'inner' ? ri : ro;
        const k = (ro * ro) / (ri * ri);

        const A = (pi * ri * ri - po * ro * ro) / (ro * ro - ri * ri);
        const B = (pi - po) * ri * ri * ro * ro / (ro * ro - ri * ri);

        hoopStress = A + B / (r * r);
        radialStress = A - B / (r * r);
        axialStress = (pi * ri * ri - po * ro * ro) / (ro * ro - ri * ri); // Capped ends
    }

    // Von Mises for pressure vessel
    const vonMises = Math.sqrt(
        hoopStress * hoopStress
        + axialStress * axialStress
        + radialStress * radialStress
        - hoopStress * axialStress
        - axialStress * radialStress
        - radialStress * hoopStress
    );

    return {
        hoopStress,
        axialStress,
        radialStress,
        vonMises,
        method: isThinWall ? 'thin-wall' : 'thick-wall'
    };
}

// ==================== COMBINED LOADING ====================

export interface CombinedLoadResult {
    normalStress: number;      // From axial + bending
    shearStress: number;       // From torsion + transverse shear
    vonMises: number;
    principal: PrincipalStresses;
    safetyFactor: number;
}

/**
 * Combined Loading Analysis (Axial + Bending + Torsion)
 */
export function calculateCombinedLoading(
    axialLoad: number,       // N (+ tension, - compression)
    bendingMoment: number,   // N·mm
    torque: number,          // N·mm
    area: number,            // mm²
    I: number,               // mm⁴ (moment of inertia)
    J: number,               // mm⁴ (polar moment of inertia)
    distanceFromNA: number,  // mm (distance from neutral axis)
    outerRadius: number,     // mm (for torsional stress)
    material: MaterialStrength
): CombinedLoadResult {
    // Normal stress from axial load
    const sigmaAxial = axialLoad / area;

    // Normal stress from bending (My/I)
    const sigmaBending = (bendingMoment * distanceFromNA) / I;

    // Total normal stress
    const normalStress = sigmaAxial + sigmaBending;

    // Shear stress from torsion (Tr/J)
    const shearStress = (torque * outerRadius) / J;

    // 2D stress state at critical location
    const stressState: StressState2D = {
        sigmaX: normalStress,
        sigmaY: 0,
        tauXY: shearStress
    };

    const principal = calculatePrincipalStresses2D(stressState);
    const vonMises = calculateVonMises2D(stressState);
    const { fos } = calculateSafetyFactor(vonMises, material);

    return {
        normalStress,
        shearStress,
        vonMises,
        principal,
        safetyFactor: fos
    };
}
