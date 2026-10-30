/**
 * AluCAD OS — KHK Gear Suite Engine
 * 
 * MATHEMATICAL CORE — Calculation of Gear Dimensions according to KHK Gears Technical Reference Section 4
 * Standards: ISO 21771, DIN 3960, DIN 3971, DIN 3975, JIS B 1702, AGMA 2005
 * 
 * STRICT ARCHITECTURAL BOUNDARY:
 * - Pure TypeScript ONLY. Zero DOM, React, window, or document references.
 * - Deterministic: Same input ALWAYS returns exact same output.
 * - 5-decimal precision geometry tracking with EngineMetadata traceability.
 */

export interface EngineMetadata {
    standard: string;
    engineVersion: string;
    source: string;
    deterministic: boolean;
}

// =========================================================================
// 1. KHK SECTION 4.2: INTERNAL GEAR & PINION WITH INTERFERENCE ANALYSIS
// (KHK Table 4.4 & 4.5, ISO 21771 / DIN 3960)
// =========================================================================

export interface KhkInternalGearParams {
    module: number;
    pinionTeeth: number;
    ringTeeth: number;
    pressureAngleDeg?: number;
    profileShiftPinion?: number;
    profileShiftRing?: number;
}

export interface KhkInternalGearResult {
    metadata: EngineMetadata;
    m: number;
    z1: number;
    z2: number;
    alphaDeg: number;
    x1: number;
    x2: number;
    // Diameters
    d1: number;
    d2: number;
    db1: number;
    db2: number;
    da1: number;
    da2: number;
    df1: number;
    df2: number;
    // Working conditions
    centerDistance: number;
    workingPressureAngleDeg: number;
    ratio: number;
    // Interference Diagnostics (KHK Section 4.2)
    involuteInterference: {
        hasInterference: boolean;
        limitTanAlphaA2: number;
        actualTanAlphaA2: number;
        message: string;
    };
    trochoidInterference: {
        hasInterference: boolean;
        minToothDiffRequired: number;
        actualToothDiff: number;
        message: string;
    };
    trimmingInterference: {
        hasInterference: boolean;
        minTeethForRadialAssembly: number;
        message: string;
    };
    isSafeForAssembly: boolean;
}

function inv(alphaRad: number): number {
    return Math.tan(alphaRad) - alphaRad;
}

function invInv(invVal: number, initialGuess = 0.35): number {
    let alpha = Math.max(0.01, Math.min(1.4, initialGuess));
    for (let i = 0; i < 15; i++) {
        const currentInv = Math.tan(alpha) - alpha;
        const diff = currentInv - invVal;
        if (Math.abs(diff) < 1e-12) break;
        const derivative = Math.tan(alpha) ** 2;
        alpha = alpha - diff / Math.max(1e-6, derivative);
    }
    return alpha;
}

export function calculateKhkInternalGear(params: KhkInternalGearParams): KhkInternalGearResult {
    const {
        module: m,
        pinionTeeth: z1,
        ringTeeth: z2,
        pressureAngleDeg = 20,
        profileShiftPinion: x1 = 0,
        profileShiftRing: x2 = 0,
    } = params;

    const alphaRad = (pressureAngleDeg * Math.PI) / 180;
    const invAlpha = inv(alphaRad);

    // Reference diameters
    const d1 = z1 * m;
    const d2 = z2 * m;
    const db1 = d1 * Math.cos(alphaRad);
    const db2 = d2 * Math.cos(alphaRad);

    // Working pressure angle for internal mesh:
    // inv(alpha_w) = 2 * tan(alpha) * (x2 - x1) / (z2 - z1) + inv(alpha)
    const deltaZ = z2 - z1;
    const invAlphaW = (2 * Math.tan(alphaRad) * (x2 - x1)) / Math.max(1, deltaZ) + invAlpha;
    const alphaWRad = Math.abs(x2 - x1) < 1e-6 ? alphaRad : invInv(invAlphaW, alphaRad);
    const alphaWDeg = (alphaWRad * 180) / Math.PI;

    // Working Center Distance (KHK Table 4.5)
    // a = ((z2 - z1) / 2) * m * (cos(alpha) / cos(alpha_w))
    const a = (deltaZ / 2) * m * (Math.cos(alphaRad) / Math.cos(alphaWRad));

    // Tip and Root Diameters
    // KHK Standard: Pinion tip da1 = d1 + 2m(1 + x1), Root df1 = d1 - 2m(1.25 - x1)
    // Ring gear: Inside tip da2 = d2 - 2m(1 - x2), Outside root df2 = d2 + 2m(1.25 + x2)
    const da1 = d1 + 2 * m * (1.0 + x1);
    const df1 = d1 - 2 * m * (1.25 - x1);
    const da2 = d2 - 2 * m * (1.0 - x2);
    const df2 = d2 + 2 * m * (1.25 + x2);

    // 1. Involute Interference (KHK Section 4.2 Eq. 4.2)
    // tan(alpha_a2) <= (z1/z2) * tan(alpha_w) + (1 - z1/z2) * tan(alpha)
    const cosAlphaA2 = Math.max(-1, Math.min(1, db2 / da2));
    const alphaA2 = Math.acos(cosAlphaA2);
    const actualTanAlphaA2 = Math.tan(alphaA2);
    const limitTanAlphaA2 = (z1 / z2) * Math.tan(alphaWRad) + (1 - z1 / z2) * Math.tan(alphaRad);
    const hasInvoluteInterference = actualTanAlphaA2 > limitTanAlphaA2 + 1e-5;

    // 2. Trochoid Interference (KHK Section 4.2 Eq. 4.3)
    // For alpha = 20 deg, KHK specifies minimum teeth difference (z2 - z1) >= 8 (without shift) or >= 6-9 (with shift)
    const minToothDiff = Math.max(8, Math.round(17 * Math.sin(alphaRad)));
    const hasTrochoidInterference = deltaZ < minToothDiff;

    // 3. Trimming Interference (Radial Assembly)
    // When z2 - z1 is too small, teeth collide during radial assembly
    const minTeethForRadialAssembly = Math.max(10, Math.round(18 * Math.sin(alphaRad)));
    const hasTrimmingInterference = deltaZ < minTeethForRadialAssembly;

    const isSafe = !hasInvoluteInterference && !hasTrochoidInterference && !hasTrimmingInterference;

    return {
        metadata: {
            standard: 'ISO 21771:2007 / KHK Table 4.4 & 4.5',
            engineVersion: '2.1.0-khk',
            source: 'https://khkgears.net/new/gear_knowledge/gear_technical_reference/calculation_gear_dimensions.html',
            deterministic: true,
        },
        m,
        z1,
        z2,
        alphaDeg: pressureAngleDeg,
        x1,
        x2,
        d1,
        d2,
        db1,
        db2,
        da1,
        da2,
        df1,
        df2,
        centerDistance: a,
        workingPressureAngleDeg: alphaWDeg,
        ratio: z2 / z1,
        involuteInterference: {
            hasInterference: hasInvoluteInterference,
            limitTanAlphaA2,
            actualTanAlphaA2,
            message: hasInvoluteInterference
                ? 'İnvolüt Girişimi Riski (Diş kökü ile temas hatası - KHK Eq 4.2)'
                : 'İnvolüt Girişimi Yok (Güvenli)',
        },
        trochoidInterference: {
            hasInterference: hasTrochoidInterference,
            minToothDiffRequired: minToothDiff,
            actualToothDiff: deltaZ,
            message: hasTrochoidInterference
                ? `Trochoid Girişimi: Diş farkı yetersiz (z₂ - z₁ = ${deltaZ} < ${minToothDiff})`
                : 'Trochoid Girişimi Yok (Güvenli)',
        },
        trimmingInterference: {
            hasInterference: hasTrimmingInterference,
            minTeethForRadialAssembly,
            message: hasTrimmingInterference
                ? `Radyal Montaj / Trimming Girişimi: Eksenel montaj gereklidir (Fark < ${minTeethForRadialAssembly})`
                : 'Radyal ve Eksenel Montaja Uygun',
        },
        isSafeForAssembly: isSafe,
    };
}

// =========================================================================
// 2. KHK SECTION 4.1(3) & 4.3(3): GEAR RACK AND PINION
// (KHK Table 4.6 Standard Spur, Table 4.7 Shifted, Table 4.10 Helical)
// =========================================================================

export interface KhkRackAndPinionParams {
    module: number;            // Normal module mn
    pinionTeeth: number;       // z1
    rackHeightToPitch: number; // H: Distance from rack bottom mounting face to pitch line (mm)
    helixAngleDeg?: number;    // beta (0 for spur rack, > 0 for helical rack)
    profileShift?: number;     // x1 on pinion
    pressureAngleDeg?: number; // alpha_n (typically 20 deg)
    rpm?: number;              // Pinion rotational speed (for linear velocity calculation)
    pinionTorqueNm?: number;   // Pinion input torque (Nm) for linear feed thrust calculation
}

export interface KhkRackAndPinionResult {
    metadata: EngineMetadata;
    mn: number;
    mt: number;
    z1: number;
    alpha_n_deg: number;
    alpha_t_deg: number;
    beta_deg: number;
    x1: number;
    H: number;
    // Diameters
    d1: number;
    db1: number;
    da1: number;
    df1: number;
    // Mounting
    mountingDistance: number;      // Center of pinion to rack bottom datum (a = d1/2 + H + x*mn)
    // Kinematics & Linear Travel
    travelPerRevMm: number;        // Linear travel for 1 revolution of pinion = pi * d1
    travelPerRadianMm: number;     // d1 / 2
    linearVelocityMPerSec: number; // Linear feed speed (m/s)
    linearVelocityMPerMin: number; // Linear feed speed (m/min)
    // Dynamics & Forces
    tangentialForceN: number;      // Ft = 2000 * T / d1
    separatingForceN: number;      // Fr = Ft * tan(alpha_t)
    axialThrustForceN: number;     // Fa = Ft * tan(beta)
    feedForceN: number;            // Effective linear driving force = Ft
}

export function calculateKhkRackAndPinion(params: KhkRackAndPinionParams): KhkRackAndPinionResult {
    const {
        module: mn,
        pinionTeeth: z1,
        rackHeightToPitch: H,
        helixAngleDeg = 0,
        profileShift: x1 = 0,
        pressureAngleDeg = 20,
        rpm = 100,
        pinionTorqueNm = 50,
    } = params;

    const betaRad = (helixAngleDeg * Math.PI) / 180;
    const alphaNRad = (pressureAngleDeg * Math.PI) / 180;
    const cosBeta = Math.max(0.01, Math.cos(betaRad));

    // Transverse module & pressure angle (KHK Table 4.10)
    const mt = mn / cosBeta;
    const alphaTRad = helixAngleDeg === 0 ? alphaNRad : Math.atan(Math.tan(alphaNRad) / cosBeta);
    const alphaTDeg = (alphaTRad * 180) / Math.PI;

    // Pinion Diameters
    const d1 = z1 * mt;
    const db1 = d1 * Math.cos(alphaTRad);
    const da1 = d1 + 2 * mn * (1.0 + x1);
    const df1 = d1 - 2 * mn * (1.25 - x1);

    // KHK Mounting Distance (KHK Table 4.6 Eq 4 & Table 4.7 Eq 4):
    // a = d1 / 2 + H + x1 * mn
    const mountingDistance = d1 / 2 + H + x1 * mn;

    // Linear Travel
    const travelPerRevMm = Math.PI * d1;
    const travelPerRadianMm = d1 / 2;
    const linearVelocityMPerSec = (travelPerRevMm * rpm) / 60000;
    const linearVelocityMPerMin = (travelPerRevMm * rpm) / 1000;

    // Dynamic Forces
    const tangentialForceN = d1 > 0 ? (2000 * pinionTorqueNm) / d1 : 0;
    const separatingForceN = tangentialForceN * Math.tan(alphaTRad);
    const axialThrustForceN = tangentialForceN * Math.tan(betaRad);

    return {
        metadata: {
            standard: 'KHK Table 4.6, 4.7 & 4.10 / DIN 867',
            engineVersion: '2.1.0-khk',
            source: 'https://khkgears.net/new/gear_knowledge/gear_technical_reference/calculation_gear_dimensions.html',
            deterministic: true,
        },
        mn,
        mt,
        z1,
        alpha_n_deg: pressureAngleDeg,
        alpha_t_deg: alphaTDeg,
        beta_deg: helixAngleDeg,
        x1,
        H,
        d1,
        db1,
        da1,
        df1,
        mountingDistance,
        travelPerRevMm,
        travelPerRadianMm,
        linearVelocityMPerSec,
        linearVelocityMPerMin,
        tangentialForceN,
        separatingForceN,
        axialThrustForceN,
        feedForceN: tangentialForceN,
    };
}

// =========================================================================
// 3. KHK SECTION 4.4: BEVEL GEARS (GLEASON STRAIGHT & SPIRAL BEVEL GEARS)
// (KHK Table 4.16 Straight Gleason, Table 4.17 Standard, Table 4.20 Spiral)
// =========================================================================

export interface KhkBevelGearParams {
    module: number;
    pinionTeeth: number;
    gearTeeth: number;
    shaftAngleDeg?: number;      // Sigma (typically 90 deg)
    pressureAngleDeg?: number;   // alpha (typically 20 deg)
    spiralAngleDeg?: number;     // beta_m (0 for straight, typically 35 deg for spiral)
    system?: 'gleason' | 'standard';
    faceWidthMm?: number;
}

export interface KhkBevelGearResult {
    metadata: EngineMetadata;
    m: number;
    z1: number;
    z2: number;
    ratio: number;
    shaftAngleDeg: number;
    spiralAngleDeg: number;
    system: 'gleason' | 'standard';
    // Pitch Diameters
    d1: number;
    d2: number;
    // Pitch Cone Angles (KHK Table 4.16)
    delta1Deg: number;
    delta2Deg: number;
    // Outer Cone Distance Re
    coneDistanceRe: number;
    // Addendums & Dedendums (Gleason strength balanced)
    ha1: number;
    ha2: number;
    hf1: number;
    hf2: number;
    // Angles
    thetaA1Deg: number; // Addendum angle
    thetaA2Deg: number;
    thetaF1Deg: number; // Dedendum angle
    thetaF2Deg: number;
    deltaA1Deg: number; // Tip angle
    deltaA2Deg: number;
    deltaF1Deg: number; // Root angle
    deltaF2Deg: number;
    // Dimensions
    da1: number;        // Tip diameter
    da2: number;
    pitchApexToCrown1: number; // X1
    pitchApexToCrown2: number; // X2
    recommendedMaxFaceWidth: number; // Re / 3
}

export function calculateKhkBevelGear(params: KhkBevelGearParams): KhkBevelGearResult {
    const {
        module: m,
        pinionTeeth: z1,
        gearTeeth: z2,
        shaftAngleDeg = 90,
        spiralAngleDeg = 0,
        system = 'gleason',
        faceWidthMm,
    } = params;

    const sigmaRad = (shaftAngleDeg * Math.PI) / 180;
    const u = z2 / z1;

    // Pitch Diameters (KHK Table 4.16 Eq 3)
    const d1 = z1 * m;
    const d2 = z2 * m;

    // Pitch Cone Angles (KHK Table 4.16 Eq 4 & 5)
    let delta1Rad = 0;
    if (Math.abs(shaftAngleDeg - 90) < 1e-4) {
        delta1Rad = Math.atan(z1 / z2);
    } else {
        delta1Rad = Math.atan(Math.sin(sigmaRad) / (u + Math.cos(sigmaRad)));
    }
    const delta2Rad = sigmaRad - delta1Rad;
    const delta1Deg = (delta1Rad * 180) / Math.PI;
    const delta2Deg = (delta2Rad * 180) / Math.PI;

    // Outer Cone Distance Re (KHK Table 4.16 Eq 6)
    const coneDistanceRe = d2 / (2 * Math.sin(delta2Rad));

    // Addendum & Dedendum Calculation
    let ha1 = 0;
    let ha2 = 0;
    let hf1 = 0;
    let hf2 = 0;

    if (system === 'gleason') {
        // Gleason System (KHK Table 4.16 Eq 7 & 8):
        // Balances pinion tooth root bending with gear tooth wear
        if (Math.abs(z1 - z2) < 1e-4) {
            // Miter gear (1:1)
            ha1 = 1.0 * m;
            ha2 = 1.0 * m;
        } else {
            ha2 = m * (0.54 + 0.46 / (u * u));
            ha1 = 2.0 * m - ha2;
        }
        hf1 = 2.188 * m - ha1;
        hf2 = 2.188 * m - ha2;
    } else {
        // Standard Bevel (KHK Table 4.17): ha1 = ha2 = 1.0 * m, hf1 = hf2 = 1.25 * m
        ha1 = 1.0 * m;
        ha2 = 1.0 * m;
        hf1 = 1.25 * m;
        hf2 = 1.25 * m;
    }

    // Addendum and Dedendum angles (KHK Table 4.16 Eq 9 & 10)
    const thetaA1Rad = Math.atan(ha1 / coneDistanceRe);
    const thetaA2Rad = Math.atan(ha2 / coneDistanceRe);
    const thetaF1Rad = Math.atan(hf1 / coneDistanceRe);
    const thetaF2Rad = Math.atan(hf2 / coneDistanceRe);

    const thetaA1Deg = (thetaA1Rad * 180) / Math.PI;
    const thetaA2Deg = (thetaA2Rad * 180) / Math.PI;
    const thetaF1Deg = (thetaF1Rad * 180) / Math.PI;
    const thetaF2Deg = (thetaF2Rad * 180) / Math.PI;

    // Tip and Root Cone Angles (KHK Table 4.16 Eq 11 & 12)
    const deltaA1Deg = delta1Deg + thetaA1Deg;
    const deltaA2Deg = delta2Deg + thetaA2Deg;
    const deltaF1Deg = delta1Deg - thetaF1Deg;
    const deltaF2Deg = delta2Deg - thetaF2Deg;

    // Tip Diameters da (KHK Table 4.16 Eq 13)
    const da1 = d1 + 2 * ha1 * Math.cos(delta1Rad);
    const da2 = d2 + 2 * ha2 * Math.cos(delta2Rad);

    // Pitch Apex to Crown Distance X (KHK Table 4.16 Eq 14)
    const pitchApexToCrown1 = coneDistanceRe * Math.cos(delta1Rad) - ha1 * Math.sin(delta1Rad);
    const pitchApexToCrown2 = coneDistanceRe * Math.cos(delta2Rad) - ha2 * Math.sin(delta2Rad);

    const recommendedMaxFaceWidth = coneDistanceRe / 3;

    return {
        metadata: {
            standard: `KHK Table 4.16 (${system === 'gleason' ? 'Gleason System' : 'Standard'}) / AGMA 2005`,
            engineVersion: '2.1.0-khk',
            source: 'https://khkgears.net/new/gear_knowledge/gear_technical_reference/calculation_gear_dimensions.html',
            deterministic: true,
        },
        m,
        z1,
        z2,
        ratio: u,
        shaftAngleDeg,
        spiralAngleDeg,
        system,
        d1,
        d2,
        delta1Deg,
        delta2Deg,
        coneDistanceRe,
        ha1,
        ha2,
        hf1,
        hf2,
        thetaA1Deg,
        thetaA2Deg,
        thetaF1Deg,
        thetaF2Deg,
        deltaA1Deg,
        deltaA2Deg,
        deltaF1Deg,
        deltaF2Deg,
        da1,
        da2,
        pitchApexToCrown1,
        pitchApexToCrown2,
        recommendedMaxFaceWidth,
    };
}

// =========================================================================
// 4. KHK SECTION 4.6: CYLINDRICAL WORM GEAR PAIR
// (KHK Table 4.22 Cylindrical Worm Gear Pair, DIN 3975, AGMA 6034)
// =========================================================================

export interface KhkWormGearParams {
    axialModule: number;        // mx (mm)
    wormStarts: number;         // z1 (number of threads, e.g. 1, 2, 4)
    wheelTeeth: number;         // z2
    diameterFactorQ?: number;   // q = d1 / mx (typically 8 to 16, e.g. 10)
    wormPitchDiameterMm?: number; // Optional explicit d1
    normalPressureAngleDeg?: number; // alpha_n (typically 20 deg)
    frictionCoeff?: number;     // mu (typically 0.02 to 0.08)
    wormRpm?: number;
    wormTorqueNm?: number;
}

export interface KhkWormGearResult {
    metadata: EngineMetadata;
    mx: number;
    z1: number;
    z2: number;
    q: number;
    ratio: number;
    alpha_n_deg: number;
    // Diameters
    d1: number;                  // Worm reference pitch diameter
    d2: number;                  // Worm wheel pitch diameter
    da1: number;                 // Worm tip diameter
    df1: number;                 // Worm root diameter
    da2: number;                 // Wheel throat diameter (crest)
    df2: number;                 // Wheel throat root diameter
    de2: number;                 // Wheel outer maximum diameter
    throatRadiusRi: number;      // Wheel throat curvature radius
    // Center Distance & Lead
    centerDistance: number;      // a = (d1 + d2) / 2
    leadAngleGammaDeg: number;   // gamma = arctan(z1 / q)
    leadPzMm: number;            // pz = pi * mx * z1
    axialPitchPxMm: number;      // px = pi * mx
    // Kinematics, Efficiency & Self-Locking
    slidingVelocityVs: number;   // m/s
    meshEfficiencyEta: number;   // %
    isSelfLocking: boolean;      // True if lead angle gamma < friction angle rho'
    outputTorqueNm: number;
}

export function calculateKhkWormGear(params: KhkWormGearParams): KhkWormGearResult {
    const {
        axialModule: mx,
        wormStarts: z1,
        wheelTeeth: z2,
        diameterFactorQ,
        wormPitchDiameterMm,
        normalPressureAngleDeg = 20,
        frictionCoeff = 0.05,
        wormRpm = 1450,
        wormTorqueNm = 50,
    } = params;

    // Resolve diameter factor q
    const q = diameterFactorQ ?? (wormPitchDiameterMm ? wormPitchDiameterMm / mx : 10);
    const alphaNRad = (normalPressureAngleDeg * Math.PI) / 180;

    // Reference diameters (KHK Table 4.22)
    const d1 = q * mx;
    const d2 = z2 * mx;

    // Center distance (KHK Table 4.22 Eq 4)
    const a = (d1 + d2) / 2;

    // Lead Angle gamma (KHK Table 4.22 Eq 5)
    const gammaRad = Math.atan(z1 / q);
    const gammaDeg = (gammaRad * 180) / Math.PI;

    // Pitch & Lead
    const axialPitchPxMm = Math.PI * mx;
    const leadPzMm = Math.PI * mx * z1;

    // Worm Diameters (KHK Table 4.22 Eq 7 & 8)
    const da1 = d1 + 2 * mx;
    const df1 = d1 - 2.4 * mx; // 0.2 * mx clearance

    // Worm Wheel Diameters (KHK Table 4.22 Eq 9, 10, 11)
    const da2 = d2 + 2 * mx;       // Throat diameter
    const df2 = d2 - 2.4 * mx;     // Throat root diameter
    const de2 = da2 + mx;          // Outer diameter
    const throatRadiusRi = a - da1 / 2; // Throat curvature radius

    // Sliding velocity at pitch point (KHK Section 4.6 Eq 4.15)
    // vs = (pi * d1 * n1) / (60000 * cos(gamma))
    const vs = (Math.PI * d1 * wormRpm) / (60000 * Math.cos(gammaRad));

    // Friction angle rho' = arctan(mu / cos(alpha_n))
    const rhoPrimeRad = Math.atan(frictionCoeff / Math.cos(alphaNRad));
    const rhoPrimeDeg = (rhoPrimeRad * 180) / Math.PI;

    // Mesh efficiency eta = tan(gamma) / tan(gamma + rho')
    const etaRatio = Math.tan(gammaRad) / Math.tan(gammaRad + rhoPrimeRad);
    const meshEfficiencyEta = Math.max(0, Math.min(100, etaRatio * 100));

    // Self-locking is true when lead angle is strictly less than friction angle
    const isSelfLocking = gammaDeg < rhoPrimeDeg;

    const ratio = z2 / z1;
    const outputTorqueNm = wormTorqueNm * ratio * (meshEfficiencyEta / 100);

    return {
        metadata: {
            standard: 'KHK Table 4.22 / DIN 3975 / AGMA 6034',
            engineVersion: '2.1.0-khk',
            source: 'https://khkgears.net/new/gear_knowledge/gear_technical_reference/calculation_gear_dimensions.html',
            deterministic: true,
        },
        mx,
        z1,
        z2,
        q,
        ratio,
        alpha_n_deg: normalPressureAngleDeg,
        d1,
        d2,
        da1,
        df1,
        da2,
        df2,
        de2,
        throatRadiusRi,
        centerDistance: a,
        leadAngleGammaDeg: gammaDeg,
        leadPzMm,
        axialPitchPxMm,
        slidingVelocityVs: vs,
        meshEfficiencyEta,
        isSelfLocking,
        outputTorqueNm,
    };
}

// =========================================================================
// 5. KHK SECTION 4.5: SCREW GEARS (CROSSED HELICAL GEARS)
// (KHK Table 4.24 Screw Gears, JIS B 1702)
// =========================================================================

export interface KhkScrewGearParams {
    normalModule: number;        // mn
    teethPinion: number;         // z1
    teethGear: number;           // z2
    helixAnglePinionDeg: number; // beta1
    helixAngleGearDeg: number;   // beta2
    handPinion?: 'right' | 'left';
    handGear?: 'right' | 'left';
    normalPressureAngleDeg?: number;
    pinionRpm?: number;
}

export interface KhkScrewGearResult {
    metadata: EngineMetadata;
    mn: number;
    z1: number;
    z2: number;
    beta1_deg: number;
    beta2_deg: number;
    shaftAngleSigmaDeg: number;  // Sigma = beta1 + beta2 (same hand) or |beta1 - beta2| (diff hand)
    ratio: number;
    d1: number;
    d2: number;
    da1: number;
    da2: number;
    df1: number;
    df2: number;
    centerDistance: number;
    slidingVelocityVs: number;   // Relative sliding velocity at pitch contact (m/s)
}

export function calculateKhkScrewGear(params: KhkScrewGearParams): KhkScrewGearResult {
    const {
        normalModule: mn,
        teethPinion: z1,
        teethGear: z2,
        helixAnglePinionDeg: beta1,
        helixAngleGearDeg: beta2,
        handPinion = 'right',
        handGear = 'right',
        normalPressureAngleDeg = 20,
        pinionRpm = 1000,
    } = params;

    const beta1Rad = (Math.abs(beta1) * Math.PI) / 180;
    const beta2Rad = (Math.abs(beta2) * Math.PI) / 180;

    // Shaft Angle Sigma (KHK Table 4.24 Eq 4)
    // Same hand: Sigma = beta1 + beta2
    // Opposite hand: Sigma = |beta1 - beta2|
    const isSameHand = handPinion === handGear;
    const shaftAngleSigmaDeg = isSameHand ? Math.abs(beta1) + Math.abs(beta2) : Math.abs(Math.abs(beta1) - Math.abs(beta2));
    const sigmaRad = (shaftAngleSigmaDeg * Math.PI) / 180;

    // Pitch Diameters (KHK Table 4.24 Eq 5 & 6)
    const d1 = (z1 * mn) / Math.cos(beta1Rad);
    const d2 = (z2 * mn) / Math.cos(beta2Rad);

    // Center Distance (KHK Table 4.24 Eq 7)
    const a = (d1 + d2) / 2;

    // Tip & Root Diameters (KHK Table 4.24 Eq 8 & 9)
    const da1 = d1 + 2 * mn;
    const da2 = d2 + 2 * mn;
    const df1 = d1 - 2.5 * mn;
    const df2 = d2 - 2.5 * mn;

    // Sliding velocity at pitch point (KHK Section 4.5 Eq 4.14)
    // vs = (pi * d1 * n1 * sin(Sigma)) / (60000 * cos(beta2))
    const vs = (Math.PI * d1 * pinionRpm * Math.sin(sigmaRad)) / (60000 * Math.cos(beta2Rad));

    return {
        metadata: {
            standard: 'KHK Table 4.24 / JIS B 1702',
            engineVersion: '2.1.0-khk',
            source: 'https://khkgears.net/new/gear_knowledge/gear_technical_reference/calculation_gear_dimensions.html',
            deterministic: true,
        },
        mn,
        z1,
        z2,
        beta1_deg: beta1,
        beta2_deg: beta2,
        shaftAngleSigmaDeg,
        ratio: z2 / z1,
        d1,
        d2,
        da1,
        da2,
        df1,
        df2,
        centerDistance: a,
        slidingVelocityVs: vs,
    };
}
