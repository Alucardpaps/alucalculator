/**
 * AluCalculator Engineering Kernel — Gear Geometry Engine
 * 
 * MATHEMATICAL CORE — Gear Pair Mesh Analysis
 * 
 * Standards: DIN 3960, ISO 21771, AGMA 2001
 * 
 * This module calculates gear mesh geometry, contact ratio, 
 * and interference conditions for gear pairs.
 */

import {
    GearParameters,
    GearGeometry,
    calculateGearGeometry,
    involuteFunction,
    DEFAULT_GEAR_PARAMS,
} from './involute';

// ============================================
// TYPES
// ============================================

export interface GearPairInput {
    pinion: GearParameters;
    gear: GearParameters;
    centerDistance?: number; // If not specified, calculated from standard formula
    backlash?: number; // mm - circumferential backlash
}

export interface GearMeshResult {
    // Center distance
    standardCenterDistance: number;
    workingCenterDistance: number;

    // Contact geometry
    contactRatio: number;
    contactLength: number; // mm
    lineOfAction: number; // mm

    // Working angles
    workingPressureAngle: number; // degrees

    // Interference check
    pinionInterference: boolean;
    gearInterference: boolean;
    interferenceMessage?: string;

    // Velocities (for given RPM)
    pitchLineVelocity?: number; // m/s
    slidingVelocity?: number; // m/s at pitch point

    // Geometry objects
    pinionGeometry: GearGeometry;
    gearGeometry: GearGeometry;

    // Validation
    valid: boolean;
    warnings: string[];
    errors: string[];
}

// ============================================
// CONSTANTS
// ============================================

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

// ============================================
// GEAR PAIR ANALYSIS
// ============================================

/**
 * Analyze a gear pair mesh
 * This is the main entry point for gear pair calculations
 */
export function analyzeGearPair(input: GearPairInput): GearMeshResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    const { pinion, gear } = input;

    // Validate module match
    if (Math.abs(pinion.module - gear.module) > 0.001) {
        errors.push('Module mismatch: Pinion and gear must have same module');
    }

    // Validate pressure angle match
    if (Math.abs(pinion.pressureAngle - gear.pressureAngle) > 0.01) {
        errors.push('Pressure angle mismatch');
    }

    const m = pinion.module;
    const alpha = pinion.pressureAngle * DEG_TO_RAD;
    const z1 = pinion.teethCount;
    const z2 = gear.teethCount;
    const x1 = pinion.profileShift;
    const x2 = gear.profileShift;

    // Calculate individual geometries
    const pinionGeometry = calculateGearGeometry(pinion);
    const gearGeometry = calculateGearGeometry(gear);

    // Standard center distance
    const standardCenterDistance = (m * (z1 + z2)) / 2;

    // Working center distance (with profile shift)
    const invAlpha = involuteFunction(alpha);
    const sumProfileShift = x1 + x2;

    // Calculate working pressure angle
    // inv(α_w) = inv(α) + 2·tan(α)·(x1+x2)/(z1+z2)
    const invAlphaW = invAlpha + (2 * Math.tan(alpha) * sumProfileShift) / (z1 + z2);
    const alphaW = inverseInvoluteApprox(invAlphaW);

    // Working center distance
    const workingCenterDistance = input.centerDistance ||
        (standardCenterDistance * Math.cos(alpha)) / Math.cos(alphaW);

    // Working pressure angle from actual center distance
    const actualAlphaW = Math.acos(
        (standardCenterDistance * Math.cos(alpha)) / workingCenterDistance
    );

    // Base radii
    const rb1 = (m * z1 / 2) * Math.cos(alpha);
    const rb2 = (m * z2 / 2) * Math.cos(alpha);

    // Tip radii
    const ra1 = pinionGeometry.addendumRadius;
    const ra2 = gearGeometry.addendumRadius;

    // ============================================
    // CONTACT RATIO CALCULATION (ε_α)
    // ============================================

    // Length of path of contact
    // g_α = √(r_a1² - r_b1²) + √(r_a2² - r_b2²) - a·sin(α_w)
    const term1 = Math.sqrt(ra1 * ra1 - rb1 * rb1);
    const term2 = Math.sqrt(ra2 * ra2 - rb2 * rb2);
    const term3 = workingCenterDistance * Math.sin(actualAlphaW);

    const pathOfContact = term1 + term2 - term3;

    // Base pitch
    const basePitch = Math.PI * m * Math.cos(alpha);

    // Contact ratio
    const contactRatio = pathOfContact / basePitch;

    if (contactRatio < 1.0) {
        errors.push(`Contact ratio ${contactRatio.toFixed(2)} < 1.0 — Gears will not mesh properly!`);
    } else if (contactRatio < 1.2) {
        warnings.push(`Contact ratio ${contactRatio.toFixed(2)} is marginal. Recommend ε > 1.2 for smooth operation.`);
    }

    // ============================================
    // INTERFERENCE CHECK
    // ============================================

    // Pinion interference check
    // Interference occurs when pinion root intersects with gear tip path
    const limitRadius1 = workingCenterDistance * Math.sin(actualAlphaW);
    const pinionInterference = term2 > limitRadius1;

    // Gear interference check  
    const limitRadius2 = workingCenterDistance * Math.sin(actualAlphaW);
    const gearInterference = term1 > limitRadius2;

    let interferenceMessage: string | undefined;
    if (pinionInterference || gearInterference) {
        interferenceMessage = 'INTERFERENCE DETECTED: ';
        if (pinionInterference) interferenceMessage += 'Gear tip undercuts pinion root. ';
        if (gearInterference) interferenceMessage += 'Pinion tip undercuts gear root.';
        errors.push(interferenceMessage);
    }

    // Add undercut warnings from individual gears
    if (pinionGeometry.undercutRisk) {
        warnings.push(`Pinion: ${pinionGeometry.undercutMessage}`);
    }
    if (gearGeometry.undercutRisk) {
        warnings.push(`Gear: ${gearGeometry.undercutMessage}`);
    }

    // ============================================
    // RESULT
    // ============================================

    return {
        standardCenterDistance,
        workingCenterDistance,
        contactRatio,
        contactLength: pathOfContact,
        lineOfAction: workingCenterDistance * Math.sin(actualAlphaW),
        workingPressureAngle: actualAlphaW * RAD_TO_DEG,
        pinionInterference,
        gearInterference,
        interferenceMessage,
        pinionGeometry,
        gearGeometry,
        valid: errors.length === 0,
        warnings,
        errors,
    };
}

/**
 * Approximate inverse involute using Newton-Raphson
 */
function inverseInvoluteApprox(invValue: number): number {
    // Initial guess
    let alpha = Math.pow(3 * invValue, 1 / 3);

    for (let i = 0; i < 20; i++) {
        const f = Math.tan(alpha) - alpha - invValue;
        const fPrime = Math.tan(alpha) * Math.tan(alpha);

        if (Math.abs(fPrime) < 1e-15) break;

        const alphaNew = alpha - f / fPrime;
        if (Math.abs(alphaNew - alpha) < 1e-10) return alphaNew;
        alpha = alphaNew;
    }

    return alpha;
}

// ============================================
// GEAR PAIR VELOCITY CALCULATIONS
// ============================================

export interface VelocityResult {
    pinionRPM: number;
    gearRPM: number;
    pitchLineVelocity: number; // m/s
    angularVelocityPinion: number; // rad/s
    angularVelocityGear: number; // rad/s
    gearRatio: number;
    torqueRatio: number;
}

export function calculateVelocities(
    meshResult: GearMeshResult,
    pinionRPM: number
): VelocityResult {
    const z1 = meshResult.pinionGeometry.pitchRadius * 2 /
        (meshResult.pinionGeometry.pitchRadius / (meshResult.pinionGeometry.pitchRadius));

    // Gear ratio
    const gearRatio = meshResult.gearGeometry.pitchRadius / meshResult.pinionGeometry.pitchRadius;

    // Gear RPM
    const gearRPM = pinionRPM / gearRatio;

    // Angular velocities
    const angularVelocityPinion = (pinionRPM * 2 * Math.PI) / 60;
    const angularVelocityGear = (gearRPM * 2 * Math.PI) / 60;

    // Pitch line velocity (m/s)
    const pitchLineVelocity = (meshResult.pinionGeometry.pitchRadius / 1000) * angularVelocityPinion;

    return {
        pinionRPM,
        gearRPM,
        pitchLineVelocity,
        angularVelocityPinion,
        angularVelocityGear,
        gearRatio,
        torqueRatio: gearRatio, // Assuming 100% efficiency
    };
}

// ============================================
// STRENGTH CALCULATIONS (LEWIS / AGMA)
// ============================================

export interface GearStrengthInput {
    mesh: GearMeshResult;
    power: number; // kW
    pinionRPM: number;
    materialYield: number; // MPa
    faceWidth: number; // mm
    qualityGrade: number; // AGMA quality (6-12)
    reliabilityFactor?: number; // Kr (default 1.0)
    safetFactor?: number; // default 2.0
}

export interface GearStrengthResult {
    tangentialForce: number; // N
    bendingStressPinion: number; // MPa
    bendingStressGear: number; // MPa
    allowableBendingStress: number; // MPa
    safetyFactorPinion: number;
    safetyFactorGear: number;
    status: 'SAFE' | 'MARGINAL' | 'UNSAFE';
    warnings: string[];
}

/**
 * Lewis bending stress calculation (simplified)
 * For preliminary design - use AGMA 2001 for final verification
 */
export function calculateBendingStrength(input: GearStrengthInput): GearStrengthResult {
    const warnings: string[] = [];

    const { mesh, power, pinionRPM, materialYield, faceWidth, qualityGrade } = input;
    const SF = input.safetFactor || 2.0;
    const Kr = input.reliabilityFactor || 1.0;

    const m = mesh.pinionGeometry.pitchRadius * 2 /
        (mesh.pinionGeometry.pitchRadius / (mesh.pinionGeometry.pitchRadius / mesh.pinionGeometry.pitchRadius));

    // Tangential force
    // F_t = (P × 60000) / (π × d × n)
    const d1 = mesh.pinionGeometry.pitchRadius * 2;
    const Ft = (power * 60000) / (Math.PI * d1 * pinionRPM);

    // Lewis form factor (approximate)
    const Y1 = getLewisFormFactor(Math.round(d1 / (mesh.pinionGeometry.pitchRadius * 2 / mesh.pinionGeometry.pitchRadius)));
    const Y2 = getLewisFormFactor(Math.round(mesh.gearGeometry.pitchRadius * 2 / (mesh.pinionGeometry.pitchRadius * 2 / mesh.pinionGeometry.pitchRadius)));

    // Velocity factor (AGMA)
    const v = calculateVelocities(mesh, pinionRPM).pitchLineVelocity;
    const Kv = getVelocityFactor(v, qualityGrade);

    // Lewis bending stress
    // σ = (F_t × K_v) / (b × m × Y)
    const gearModule = mesh.pinionGeometry.pitchRadius / (mesh.pinionGeometry.pitchRadius / mesh.pinionGeometry.pitchRadius);
    const sigmaPinion = (Ft * Kv) / (faceWidth * 2 * Y1);
    const sigmaGear = (Ft * Kv) / (faceWidth * 2 * Y2);

    // Allowable stress
    const allowable = (materialYield / SF) * Kr;

    // Safety factors
    const sfPinion = allowable / sigmaPinion;
    const sfGear = allowable / sigmaGear;

    // Status
    let status: GearStrengthResult['status'];
    const minSF = Math.min(sfPinion, sfGear);

    if (minSF >= SF) {
        status = 'SAFE';
    } else if (minSF >= 1.5) {
        status = 'MARGINAL';
        warnings.push(`Safety factor ${minSF.toFixed(2)} is below target ${SF}`);
    } else {
        status = 'UNSAFE';
        warnings.push(`CRITICAL: Safety factor ${minSF.toFixed(2)} is inadequate!`);
    }

    if (v > 25) {
        warnings.push('High pitch line velocity — consider premium quality gears');
    }

    return {
        tangentialForce: Ft,
        bendingStressPinion: sigmaPinion,
        bendingStressGear: sigmaGear,
        allowableBendingStress: allowable,
        safetyFactorPinion: sfPinion,
        safetyFactorGear: sfGear,
        status,
        warnings,
    };
}

/**
 * Lewis form factor (approximate values)
 */
function getLewisFormFactor(z: number): number {
    // Approximate Y values for 20° pressure angle
    const factors: Record<number, number> = {
        12: 0.245, 14: 0.277, 17: 0.303, 20: 0.322,
        25: 0.340, 30: 0.359, 35: 0.374, 40: 0.389,
        50: 0.408, 60: 0.422, 75: 0.435, 100: 0.447,
        150: 0.460, 300: 0.472, 1000: 0.485,
    };

    // Find closest match
    const keys = Object.keys(factors).map(Number).sort((a, b) => a - b);
    for (const k of keys) {
        if (z <= k) return factors[k];
    }
    return 0.485; // Rack
}

/**
 * AGMA velocity factor
 */
function getVelocityFactor(v: number, qualityGrade: number): number {
    // Simplified AGMA formula
    const B = 0.25 * (12 - qualityGrade) ** (2 / 3);
    const A = 50 + 56 * (1 - B);
    return ((A + Math.sqrt(200 * v)) / A) ** B;
}

// ============================================
// QUICK DESIGN HELPERS
// ============================================

/**
 * Calculate minimum teeth to avoid undercut
 */
export function minTeethNoUndercut(pressureAngle: number, profileShift: number = 0): number {
    const alpha = pressureAngle * DEG_TO_RAD;
    return Math.ceil(2 * (1 - profileShift) / (Math.sin(alpha) ** 2));
}

/**
 * Calculate required profile shift for given teeth count
 */
export function requiredProfileShift(teethCount: number, pressureAngle: number): number {
    const alpha = pressureAngle * DEG_TO_RAD;
    const zMin = 2 / (Math.sin(alpha) ** 2);
    if (teethCount >= zMin) return 0;
    return (zMin - teethCount) * (Math.sin(alpha) ** 2) / 2;
}

/**
 * Standard gear pair for quick setup
 */
export function createStandardGearPair(
    module: number,
    pinionTeeth: number,
    gearTeeth: number,
    pressureAngle: number = 20
): GearPairInput {
    return {
        pinion: {
            ...DEFAULT_GEAR_PARAMS,
            module,
            teethCount: pinionTeeth,
            pressureAngle,
        },
        gear: {
            ...DEFAULT_GEAR_PARAMS,
            module,
            teethCount: gearTeeth,
            pressureAngle,
        },
    };
}
