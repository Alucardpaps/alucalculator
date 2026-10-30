/**
 * ISO 6336 / AGMA Gear Strength Calculations
 *
 * Wraps the ISO 6336 simplified Method B kernel (`iso6336.ts`):
 * - Contact (pitting) stress (ISO 6336-2)
 * - Root (bending) stress (ISO 6336-3)
 * - Helical transverse geometry (DIN 3960)
 * - Safety factors SH / SF
 */

import { calculateIso6336Mesh, iso6336DynamicFactor } from './iso6336';

export interface GearParams {
    module: number;           // Module (mm)
    teethPinion: number;      // Number of teeth - pinion
    teethGear: number;        // Number of teeth - gear
    faceWidth: number;        // Face width (mm)
    pressureAngle?: number;   // Pressure angle (degrees), default 20°
    helixAngle?: number;      // Helix angle (degrees), default 0° for spur
    qualityGrade?: number;    // ISO quality grade (5-12), default 6
}

export interface LoadParams {
    power: number;            // Power (kW)
    rpm: number;              // Pinion speed (rpm)
    applicationFactor?: number; // Ka, default 1.25
    dynamicFactor?: number;   // Kv, default 1.1
}

export interface MaterialParams {
    youngsModulus: number;    // E (GPa)
    poissonRatio: number;     // ν
    allowableBending: number; // σFP (MPa) - allowable bending stress
    allowableContact: number; // σHP (MPa) - allowable contact stress
    hardness?: number;        // HB or HRC
}

export interface GearStrengthResults {
    // Geometry
    pitchDiameterPinion: number;  // mm
    pitchDiameterGear: number;    // mm
    centerDistance: number;       // mm
    transmissionRatio: number;
    transverseContactRatio: number;
    overlapRatio: number;
    totalContactRatio: number;
    transverseModule: number;
    transversePressureAngle: number;

    // Forces
    tangentialForce: number;      // Ft (N)
    radialForce: number;          // Fr (N)
    axialForce: number;           // Fa (N) - for helical

    // Stresses
    contactStress: number;        // σH (MPa) - Hertz contact stress
    bendingStressPinion: number;  // σF1 (MPa) - root bending stress
    bendingStressGear: number;    // σF2 (MPa) - root bending stress

    // Factors
    Kv: number;
    ZH: number;
    ZE: number;
    YF1: number;
    YF2: number;

    // Safety Factors
    safetyContact: number;        // SH
    safetyBendingPinion: number;  // SF1
    safetyBendingGear: number;    // SF2

    // Status
    status: 'safe' | 'marginal' | 'unsafe' | 'invalid' | 'out_of_scope';
    criticalFactor: string;
}

/**
 * Calculate gear strength per ISO 6336 simplified Method B.
 * Helical pairs use transverse module mt = mn / cos β (DIN 3960).
 */
export function calculateGearStrength(
    gear: GearParams,
    load: LoadParams,
    pinionMaterial: MaterialParams,
    gearMaterial: MaterialParams = pinionMaterial
): GearStrengthResults {
    const torquePinion = (load.power * 1000 * 60) / (2 * Math.PI * Math.max(1e-6, load.rpm));
    const mesh = calculateIso6336Mesh({
        mn: gear.module,
        z1: gear.teethPinion,
        z2: gear.teethGear,
        b: gear.faceWidth,
        alphaNDeg: gear.pressureAngle ?? 20,
        betaDeg: gear.helixAngle ?? 0,
        torqueNm: torquePinion,
        rpmPinion: load.rpm,
        applicationFactor: load.applicationFactor ?? 1.25,
        qualityGrade: gear.qualityGrade ?? 6,
        E1GPa: pinionMaterial.youngsModulus,
        E2GPa: gearMaterial.youngsModulus,
        nu1: pinionMaterial.poissonRatio,
        nu2: gearMaterial.poissonRatio,
        sigmaHlim: Math.min(pinionMaterial.allowableContact, gearMaterial.allowableContact),
        sigmaHlim1: pinionMaterial.allowableContact,
        sigmaHlim2: gearMaterial.allowableContact,
        sigmaFlim1: pinionMaterial.allowableBending,
        sigmaFlim2: gearMaterial.allowableBending,
    });

    return {
        pitchDiameterPinion: mesh.d1,
        pitchDiameterGear: mesh.d2,
        centerDistance: mesh.aWorking,
        transmissionRatio: mesh.u,
        transverseContactRatio: mesh.epsilonAlpha,
        overlapRatio: mesh.epsilonBeta,
        totalContactRatio: mesh.epsilonGamma,
        transverseModule: mesh.mt,
        transversePressureAngle: mesh.alphaTDeg,

        tangentialForce: mesh.Ft,
        radialForce: mesh.Fr,
        axialForce: mesh.Fa,

        contactStress: mesh.sigmaH,
        bendingStressPinion: mesh.sigmaF1,
        bendingStressGear: mesh.sigmaF2,

        Kv: mesh.Kv,
        ZH: mesh.ZH,
        ZE: mesh.ZE,
        YF1: mesh.YF1,
        YF2: mesh.YF2,

        safetyContact: mesh.SH,
        safetyBendingPinion: mesh.SF1,
        safetyBendingGear: mesh.SF2,

        status: mesh.status,
        criticalFactor: mesh.criticalFactor,
    };
}

/**
 * Standard gear material allowables
 */
export const GEAR_MATERIALS = {
    'Steel 42CrMo4 (Hardened)': {
        youngsModulus: 210,
        poissonRatio: 0.3,
        allowableBending: 400,
        allowableContact: 1200,
        hardness: 300,
    },
    'Steel 16MnCr5 (Case Hardened)': {
        youngsModulus: 210,
        poissonRatio: 0.3,
        allowableBending: 500,
        allowableContact: 1500,
        hardness: 60, // HRC
    },
    'Steel C45 (Normalized)': {
        youngsModulus: 210,
        poissonRatio: 0.3,
        allowableBending: 250,
        allowableContact: 800,
        hardness: 180,
    },
    'Steel 18CrNiMo7-6 (Case Hardened)': {
        youngsModulus: 210,
        poissonRatio: 0.3,
        allowableBending: 550,
        allowableContact: 1650,
        hardness: 62, // HRC
    },
    'Bronze (CuSn12)': {
        youngsModulus: 113,
        poissonRatio: 0.34,
        allowableBending: 80,
        allowableContact: 400,
        hardness: 100,
    },
    'Cast Iron GG25': {
        youngsModulus: 110,
        poissonRatio: 0.26,
        allowableBending: 90,
        allowableContact: 500,
        hardness: 200,
    },
    'Nylon PA66': {
        youngsModulus: 3,
        poissonRatio: 0.4,
        allowableBending: 40,
        allowableContact: 50,
        hardness: 0, // N/A
    },
    'POM (Delrin)': {
        youngsModulus: 3.1,
        poissonRatio: 0.35,
        allowableBending: 50,
        allowableContact: 60,
        hardness: 0,
    },
} as const;

export type GearMaterialName = keyof typeof GEAR_MATERIALS;

/**
 * Get material params from name
 */
export function getGearMaterial(name: GearMaterialName): MaterialParams {
    return GEAR_MATERIALS[name];
}

/**
 * Application factors for different machine types (Ka)
 */
export const APPLICATION_FACTORS = {
    'Uniform load (electric motors)': 1.0,
    'Light shocks (fans, pumps)': 1.25,
    'Moderate shocks (compressors)': 1.5,
    'Heavy shocks (mining, crushers)': 1.75,
    'Very heavy (rolling mills)': 2.0,
} as const;

/**
 * Dynamic factors based on quality and pitch velocity (Kv - simplified)
 */
export function getDynamicFactor(pitchVelocity: number, qualityGrade: number = 6): number {
    return iso6336DynamicFactor(pitchVelocity, qualityGrade);
}
