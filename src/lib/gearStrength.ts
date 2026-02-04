/**
 * ISO 6336 / AGMA Gear Strength Calculations
 * 
 * Implements simplified calculations for:
 * - Contact (pitting) stress (ISO 6336-2 / AGMA 2001)
 * - Root (bending) stress (ISO 6336-3 / AGMA 2001)
 * - Safety factors
 */

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

    // Forces
    tangentialForce: number;      // Ft (N)
    radialForce: number;          // Fr (N)
    axialForce: number;           // Fa (N) - for helical

    // Stresses
    contactStress: number;        // σH (MPa) - Hertz contact stress
    bendingStressPinion: number;  // σF1 (MPa) - root bending stress
    bendingStressGear: number;    // σF2 (MPa) - root bending stress

    // Safety Factors
    safetyContact: number;        // SH
    safetyBendingPinion: number;  // SF1
    safetyBendingGear: number;    // SF2

    // Status
    status: 'safe' | 'marginal' | 'unsafe';
    criticalFactor: string;
}

// Lewis form factor (simplified approximation)
function lewisFormFactor(teeth: number, pressureAngle: number): number {
    const phi = (pressureAngle * Math.PI) / 180;
    // Simplified Lewis formula
    return 0.154 - 0.912 / teeth + (2.87 * Math.sin(phi) * Math.sin(phi)) / teeth;
}

// Geometry factor for pitting (ZH * ZE approximation)
function contactGeometryFactor(z1: number, z2: number, pressureAngle: number): number {
    const phi = (pressureAngle * Math.PI) / 180;
    const u = z2 / z1; // gear ratio

    // ZH - zone factor (simplified)
    const ZH = Math.sqrt(2 * Math.cos(phi) * Math.cos(phi) / (Math.sin(phi) * Math.cos(phi)));

    // Geometry factor sqrt((u+1)/u)
    const ZR = Math.sqrt((u + 1) / u);

    return ZH * ZR;
}

// Transverse contact ratio
function calculateContactRatio(z1: number, z2: number, m: number, alpha: number): number {
    const alphaRad = (alpha * Math.PI) / 180;
    const a = (z1 + z2) * m / 2; // center distance
    const ra1 = (z1 * m / 2) + m; // tip radius pinion
    const ra2 = (z2 * m / 2) + m; // tip radius gear
    const rb1 = (z1 * m / 2) * Math.cos(alphaRad); // base radius pinion
    const rb2 = (z2 * m / 2) * Math.cos(alphaRad); // base radius gear

    const pb = Math.PI * m * Math.cos(alphaRad); // base pitch

    // Contact ratio calculation
    const epsilon = (
        Math.sqrt(ra1 * ra1 - rb1 * rb1) +
        Math.sqrt(ra2 * ra2 - rb2 * rb2) -
        a * Math.sin(alphaRad)
    ) / pb;

    return epsilon;
}

/**
 * Calculate gear strength per ISO 6336 simplified method
 */
export function calculateGearStrength(
    gear: GearParams,
    load: LoadParams,
    pinionMaterial: MaterialParams,
    gearMaterial: MaterialParams = pinionMaterial
): GearStrengthResults {
    const alpha = gear.pressureAngle ?? 20;
    const beta = gear.helixAngle ?? 0;
    const Ka = load.applicationFactor ?? 1.25;
    const Kv = load.dynamicFactor ?? 1.1;

    // Geometry calculations
    const d1 = gear.module * gear.teethPinion;  // Pitch diameter pinion
    const d2 = gear.module * gear.teethGear;    // Pitch diameter gear
    const a = (d1 + d2) / 2;                     // Center distance
    const u = gear.teethGear / gear.teethPinion; // Transmission ratio

    // Contact ratio
    const epsilonAlpha = calculateContactRatio(
        gear.teethPinion,
        gear.teethGear,
        gear.module,
        alpha
    );

    // Force calculations
    const torquePinion = (load.power * 1000 * 60) / (2 * Math.PI * load.rpm); // Nm
    const Ft = (2000 * torquePinion) / d1;  // Tangential force (N)
    const alphaRad = (alpha * Math.PI) / 180;
    const betaRad = (beta * Math.PI) / 180;
    const Fr = Ft * Math.tan(alphaRad) / Math.cos(betaRad);  // Radial force
    const Fa = Ft * Math.tan(betaRad);                        // Axial force

    // Load factors
    const KHbeta = 1.15;  // Face load factor for contact (simplified)
    const KFbeta = 1.10;  // Face load factor for bending (simplified)
    const KHalpha = 1.0;  // Transverse load factor contact
    const KFalpha = 1.0;  // Transverse load factor bending

    // Combined elasticity modulus (reduced modulus)
    const E1 = pinionMaterial.youngsModulus * 1000; // GPa to MPa
    const E2 = gearMaterial.youngsModulus * 1000;
    const nu1 = pinionMaterial.poissonRatio;
    const nu2 = gearMaterial.poissonRatio;
    const Ered = 2 / ((1 - nu1 * nu1) / E1 + (1 - nu2 * nu2) / E2);

    // ZE - Elasticity factor
    const ZE = Math.sqrt(Ered / (2 * Math.PI));

    // ZH - Zone factor (simplified)
    const ZH = contactGeometryFactor(gear.teethPinion, gear.teethGear, alpha);

    // Zesilon - Contact ratio factor
    const Zepsilon = Math.sqrt((4 - epsilonAlpha) / 3);

    // Contact stress (σH) - ISO 6336-2
    const sigmaH = ZH * ZE * Zepsilon * Math.sqrt(
        (Ft * Ka * Kv * KHbeta * KHalpha * (u + 1)) /
        (d1 * gear.faceWidth * u)
    );

    // Lewis form factors
    const YF1 = lewisFormFactor(gear.teethPinion, alpha);
    const YF2 = lewisFormFactor(gear.teethGear, alpha);

    // Stress correction factor (simplified)
    const YS = 1.0;

    // Helix angle factor
    const Ybeta = 1 - (beta / 120);

    // Bending stress (σF) - ISO 6336-3
    const sigmaF1 = (Ft * Ka * Kv * KFbeta * KFalpha * YF1 * YS * Ybeta) /
        (gear.faceWidth * gear.module);
    const sigmaF2 = (Ft * Ka * Kv * KFbeta * KFalpha * YF2 * YS * Ybeta) /
        (gear.faceWidth * gear.module);

    // Safety factors
    const SH = Math.min(pinionMaterial.allowableContact, gearMaterial.allowableContact) / sigmaH;
    const SF1 = pinionMaterial.allowableBending / sigmaF1;
    const SF2 = gearMaterial.allowableBending / sigmaF2;

    // Determine overall status
    const minSafety = Math.min(SH, SF1, SF2);
    let status: 'safe' | 'marginal' | 'unsafe';
    let criticalFactor: string;

    if (minSafety >= 1.5) {
        status = 'safe';
    } else if (minSafety >= 1.0) {
        status = 'marginal';
    } else {
        status = 'unsafe';
    }

    if (SH === minSafety) {
        criticalFactor = 'Pitting (Contact)';
    } else if (SF1 === minSafety) {
        criticalFactor = 'Bending (Pinion)';
    } else {
        criticalFactor = 'Bending (Gear)';
    }

    return {
        pitchDiameterPinion: d1,
        pitchDiameterGear: d2,
        centerDistance: a,
        transmissionRatio: u,
        transverseContactRatio: epsilonAlpha,

        tangentialForce: Ft,
        radialForce: Fr,
        axialForce: Fa,

        contactStress: sigmaH,
        bendingStressPinion: sigmaF1,
        bendingStressGear: sigmaF2,

        safetyContact: SH,
        safetyBendingPinion: SF1,
        safetyBendingGear: SF2,

        status,
        criticalFactor,
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
    // Simplified calculation based on ISO 6336-1 Method B
    const v = pitchVelocity; // m/s
    if (qualityGrade <= 6) {
        return 1 + 0.02 * v;
    } else if (qualityGrade <= 8) {
        return 1 + 0.05 * v;
    } else {
        return 1 + 0.1 * v;
    }
}
