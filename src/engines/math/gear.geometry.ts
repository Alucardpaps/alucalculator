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
import { calculateIso6336Mesh } from '@/lib/iso6336';

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
// STRENGTH CALCULATIONS (ISO 6336 Method B)
// ============================================

export interface GearStrengthInput {
    mesh: GearMeshResult;
    power: number; // kW
    pinionRPM: number;
    materialYield: number; // MPa
    faceWidth: number; // mm
    qualityGrade: number; // ISO 1328 / AGMA quality (5-12)
    reliabilityFactor?: number; // Kr (default 1.0)
    safetFactor?: number; // default 1.4 (ISO industrial SF min)
}

export interface GearStrengthResult {
    tangentialForce: number; // N
    bendingStressPinion: number; // MPa
    bendingStressGear: number; // MPa
    contactStress: number; // MPa
    allowableBendingStress: number; // MPa
    safetyFactorPinion: number;
    safetyFactorGear: number;
    safetyContact: number;
    status: 'SAFE' | 'MARGINAL' | 'UNSAFE';
    warnings: string[];
}

/**
 * ISO 6336 Method B screening of a meshing pair.
 */
export function calculateBendingStrength(input: GearStrengthInput): GearStrengthResult {
    const warnings: string[] = [];
    const { mesh, power, pinionRPM, materialYield, faceWidth, qualityGrade } = input;
    const targetSF = input.safetFactor || 1.4;
    const Kr = input.reliabilityFactor || 1.0;

    const d1 = mesh.pinionGeometry.pitchRadius * 2;
    const mn = Math.max(0.4, mesh.pinionGeometry.addendumRadius - mesh.pinionGeometry.pitchRadius);
    const z1 = Math.max(8, Math.round(d1 / mn));
    const z2 = Math.max(8, Math.round((mesh.gearGeometry.pitchRadius * 2) / mn));
    const torqueNm = (power * 1000 * 60) / (2 * Math.PI * Math.max(1e-6, pinionRPM));

    const iso = calculateIso6336Mesh({
        mn,
        z1,
        z2,
        b: faceWidth,
        torqueNm,
        rpmPinion: pinionRPM,
        qualityGrade: Math.max(5, Math.min(12, qualityGrade)),
        sigmaFlim1: 0.55 * materialYield * Kr,
        sigmaFlim2: 0.55 * materialYield * Kr,
        sigmaHlim: 1.3 * materialYield,
    });

    const v = iso.pitchVelocity;
    if (v > 25) warnings.push('High pitch line velocity — specify ISO 1328 grade 5 or better.');
    if (iso.SF1 < targetSF) warnings.push(`Bending safety SF1=${iso.SF1.toFixed(2)} is below target ${targetSF}.`);
    if (iso.SH < 1.0) warnings.push(`Pitting safety SH=${iso.SH.toFixed(2)} < 1.0.`);

    const status: GearStrengthResult['status'] =
        iso.status === 'safe' ? 'SAFE' : iso.status === 'marginal' ? 'MARGINAL' : 'UNSAFE';

    return {
        tangentialForce: iso.Ft,
        bendingStressPinion: iso.sigmaF1,
        bendingStressGear: iso.sigmaF2,
        contactStress: iso.sigmaH,
        allowableBendingStress: 0.55 * materialYield * Kr,
        safetyFactorPinion: iso.SF1,
        safetyFactorGear: iso.SF2,
        safetyContact: iso.SH,
        status,
        warnings,
    };
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
