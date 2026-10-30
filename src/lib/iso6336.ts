/**
 * ISO 6336 / DIN 3990 simplified Method B — cylindrical gear rating.
 *
 * Geometry: DIN 3960 / ISO 21771 (transverse mt, αt, operating αwt).
 * Contact: ISO 6336-2 (ZH, ZE, Zε, Zβ).
 * Bending: ISO 6336-3 (YF, YS, Yβ) with virtual teeth zn.
 * Dynamics: ISO 6336-1 Method C (Kv from quality + pitch velocity).
 *
 * Screening engine for industrial design — not a full Method-A certificate.
 */

export function degToRad(deg: number): number {
    return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
    return (rad * 180) / Math.PI;
}

export function involute(alphaRad: number): number {
    return Math.tan(alphaRad) - alphaRad;
}

/** Newton–Raphson inverse involute inv(α) = tan α − α. */
export function inverseInvolute(invVal: number): number {
    if (invVal <= 1e-16) return 0;
    let a = Math.cbrt(3 * invVal);
    if (!Number.isFinite(a) || a < 0.05) a = 0.3;
    if (a > 1.35) a = 1.0;
    for (let i = 0; i < 16; i++) {
        const ta = Math.tan(a);
        const f = ta - a - invVal;
        const fp = ta * ta;
        if (Math.abs(fp) < 1e-18) break;
        const next = a - f / fp;
        if (!Number.isFinite(next) || next <= 0.01) break;
        if (Math.abs(next - a) < 1e-12) return next;
        a = next;
    }
    return a;
}

export interface Iso6336MeshInput {
    mn: number;
    z1: number;
    z2: number;
    b: number;
    alphaNDeg?: number;
    betaDeg?: number;
    x1?: number;
    x2?: number;
    torqueNm: number;
    rpmPinion: number;
    applicationFactor?: number;
    qualityGrade?: number;
    internal?: boolean;
    E1GPa?: number;
    E2GPa?: number;
    nu1?: number;
    nu2?: number;
    sigmaHlim?: number;
    sigmaHlim1?: number;
    sigmaHlim2?: number;
    sigmaFlim1?: number;
    sigmaFlim2?: number;
    targetSH?: number;
    targetSF?: number;
}

export interface Iso6336MeshResult {
    valid: boolean;
    validationErrors?: string[];
    verificationLevel: 'screening';
    methodScope: string;
    detailedVerificationRequired: boolean;
    targetMet: boolean;
    targetSH: number;
    targetSF: number;
    mn: number;
    mt: number;
    betaDeg: number;
    alphaNDeg: number;
    alphaTDeg: number;
    alphaWtDeg: number;
    z1: number;
    z2: number;
    u: number;
    internal: boolean;
    d1: number;
    d2: number;
    da1: number;
    da2: number;
    df1: number;
    df2: number;
    db1: number;
    db2: number;
    aStandard: number;
    aWorking: number;
    y: number;
    kAddendum: number;
    epsilonAlpha: number;
    epsilonBeta: number;
    epsilonGamma: number;
    zn1: number;
    zn2: number;
    pitchVelocity: number;
    Ft: number;
    Fr: number;
    Fa: number;
    Fn: number;
    Ka: number;
    Kv: number;
    KHbeta: number;
    KFbeta: number;
    KHalpha: number;
    KFalpha: number;
    ZH: number;
    ZE: number;
    Zeps: number;
    Zbeta: number;
    YF1: number;
    YF2: number;
    YS1: number;
    YS2: number;
    Ybeta: number;
    sigmaH: number;
    sigmaF1: number;
    sigmaF2: number;
    SH: number;
    SH1: number;
    SH2: number;
    SF1: number;
    SF2: number;
    status: 'safe' | 'marginal' | 'unsafe' | 'invalid' | 'out_of_scope';
    criticalFactor: string;
}

const STEEL_E_GPA = 206;
const STEEL_NU = 0.3;

export function iso6336DynamicFactor(vMps: number, qualityGrade = 6): number {
    const Q = Math.max(5, Math.min(12, qualityGrade));
    let Cv1: number;
    let Cv2: number;
    if (Q <= 5) {
        Cv1 = 0.22;
        Cv2 = 0.0002;
    } else if (Q === 6) {
        Cv1 = 0.32;
        Cv2 = 0.0004;
    } else if (Q === 7) {
        Cv1 = 0.43;
        Cv2 = 0.0006;
    } else if (Q === 8) {
        Cv1 = 0.55;
        Cv2 = 0.001;
    } else {
        Cv1 = 0.7;
        Cv2 = 0.0016;
    }
    const kv = 1 + Cv1 * (Math.max(0, vMps) / 20) + Cv2 * vMps * vMps;
    return Math.min(1.9, Math.max(1.0, kv));
}

/** ISO 6336-3 virtual teeth zn ≈ z / (cos² βb · cos β). */
export function virtualTeeth(z: number, betaRad: number, alphaNRad: number): number {
    const sinBetaB = Math.sin(betaRad) * Math.cos(alphaNRad);
    const betaB = Math.asin(Math.max(-1, Math.min(1, sinBetaB)));
    const den = Math.max(0.15, Math.cos(betaB) ** 2 * Math.cos(betaRad));
    return Math.abs(z) / den;
}

/**
 * Tooth form factor YF for 20° standard rack (haP*=1, hfP*=1.25, ρfP*=0.38).
 * Curve-fit to ISO 6336-3 Table A.1, with linear profile-shift correction.
 */
export function toothFormFactorYF(zn: number, x = 0): number {
    const zEff = Math.max(10, zn);
    const YF0 = 2.07 + 16.7 / zEff - 12 / (zEff * zEff);
    const dYF = -0.55 * x + 0.12 * x * x;
    return Math.max(1.55, Math.min(4.6, YF0 + dYF));
}

/** Stress correction YS (notch) — ISO 6336-3 screening. */
export function stressCorrectionYS(zn: number): number {
    const zEff = Math.max(10, zn);
    return Math.max(1.55, Math.min(2.25, 1.55 + 4.5 / zEff));
}

export function helixFactorYbeta(epsilonBeta: number, betaDeg: number): number {
    const eb = Math.max(0, Math.min(1, epsilonBeta));
    const yb = 1 - (eb * Math.abs(betaDeg)) / 120;
    return Math.max(0.75, Math.min(1, yb));
}

export function contactRatioFactorZeps(epsilonAlpha: number, epsilonBeta: number): number {
    const ea = Math.max(1.0, Math.min(2.4, epsilonAlpha));
    const eb = Math.max(0, epsilonBeta);
    if (eb < 1e-6) return Math.sqrt((4 - ea) / 3);
    if (eb >= 1) return Math.sqrt(1 / ea);
    return Math.sqrt(((4 - ea) / 3) * (1 - eb) + eb / ea);
}

function faceLoadFactors(b: number, d1: number, mn: number, epsilonBeta: number): { KHbeta: number; KFbeta: number } {
    const bd = d1 > 0 ? b / d1 : 0.5;
    const bm = mn > 0 ? b / (10 * mn) : 1;
    let KHbeta = 1.05 + 0.22 * bd * bd + 0.12 * Math.max(-0.3, bm - 1);
    KHbeta *= 1 - 0.12 * Math.min(1, Math.max(0, epsilonBeta));
    KHbeta = Math.max(1.05, Math.min(1.55, KHbeta));
    const h = 2.25 * Math.max(mn, 0.5);
    const bh = b / h;
    const NF = (bh * bh) / (1 + bh + bh * bh);
    const KFbeta = Math.max(1.02, Math.min(1.5, KHbeta ** Math.max(0.4, Math.min(1, NF))));
    return { KHbeta, KFbeta };
}

export function calculateIso6336Mesh(input: Iso6336MeshInput): Iso6336MeshResult {
    const targetSH = input.targetSH ?? 1.20;
    const targetSF = input.targetSF ?? 1.40;
    const internal = Boolean(input.internal);

    // Strict input validation — never silently clamp non-physical inputs
    const validationErrors: string[] = [];
    if (!Number.isFinite(input.mn) || input.mn <= 0) {
        validationErrors.push('Normal module (mn) must be strictly positive.');
    }
    if (!Number.isFinite(input.z1) || input.z1 < 5 || !Number.isInteger(input.z1)) {
        validationErrors.push('Pinion teeth count (z1) must be an integer >= 5.');
    }
    if (!Number.isFinite(input.z2) || input.z2 < 5 || !Number.isInteger(input.z2)) {
        validationErrors.push('Gear teeth count (z2) must be an integer >= 5.');
    } else if (internal && input.z2 <= input.z1) {
        validationErrors.push('Internal ring gear teeth (z2) must be strictly greater than pinion teeth (z1).');
    }
    if (!Number.isFinite(input.b) || input.b <= 0) {
        validationErrors.push('Face width (b) must be strictly positive.');
    }
    if (!Number.isFinite(input.torqueNm) || input.torqueNm <= 0) {
        validationErrors.push('Operating torque (torqueNm) must be strictly positive for gear stress rating.');
    }
    if (!Number.isFinite(input.rpmPinion) || input.rpmPinion <= 0) {
        validationErrors.push('Pinion speed (rpmPinion) must be strictly positive.');
    }

    if (validationErrors.length > 0) {
        return {
            valid: false,
            validationErrors,
            verificationLevel: 'screening',
            methodScope: 'ISO 6336-2:2019 Simplified Method B (Screening)',
            detailedVerificationRequired: true,
            targetMet: false,
            targetSH,
            targetSF,
            mn: input.mn || 0,
            mt: 0,
            betaDeg: input.betaDeg ?? 0,
            alphaNDeg: input.alphaNDeg ?? 20,
            alphaTDeg: 0,
            alphaWtDeg: 0,
            z1: input.z1 || 0,
            z2: input.z2 || 0,
            u: 0,
            internal,
            d1: 0, d2: 0, da1: 0, da2: 0, df1: 0, df2: 0, db1: 0, db2: 0,
            aStandard: 0, aWorking: 0, y: 0, kAddendum: 0,
            epsilonAlpha: 0, epsilonBeta: 0, epsilonGamma: 0,
            zn1: 0, zn2: 0, pitchVelocity: 0,
            Ft: 0, Fr: 0, Fa: 0, Fn: 0, Ka: 1, Kv: 1, KHbeta: 1, KFbeta: 1, KHalpha: 1, KFalpha: 1,
            ZH: 0, ZE: 0, Zeps: 0, Zbeta: 0, YF1: 0, YF2: 0, YS1: 0, YS2: 0, Ybeta: 0,
            sigmaH: 0, sigmaF1: 0, sigmaF2: 0,
            SH: 0, SH1: 0, SH2: 0, SF1: 0, SF2: 0,
            status: 'invalid',
            criticalFactor: 'Invalid / Out-of-Scope Geometry or Load'
        };
    }

    const mn = input.mn;
    const z1 = input.z1;
    const z2 = input.z2;
    const b = input.b;
    const alphaNDeg = input.alphaNDeg ?? 20;
    const betaDeg = input.betaDeg ?? 0;
    const x1 = input.x1 ?? 0;
    const x2 = input.x2 ?? 0;
    const Ka = input.applicationFactor ?? 1.25;
    const Q = input.qualityGrade ?? 6;
    const E1 = (input.E1GPa ?? STEEL_E_GPA) * 1000;
    const E2 = (input.E2GPa ?? STEEL_E_GPA) * 1000;
    const nu1 = input.nu1 ?? STEEL_NU;
    const nu2 = input.nu2 ?? STEEL_NU;
    const sigmaHlim1 = input.sigmaHlim1 ?? input.sigmaHlim ?? 1500;
    const sigmaHlim2 = input.sigmaHlim2 ?? input.sigmaHlim ?? 1500;
    const sigmaFlim1 = input.sigmaFlim1 ?? 430;
    const sigmaFlim2 = input.sigmaFlim2 ?? sigmaFlim1;

    const betaRad = degToRad(betaDeg);
    const alphaN = degToRad(alphaNDeg);
    const mt = mn / Math.max(0.15, Math.cos(betaRad));
    const alphaT = Math.atan(Math.tan(alphaN) / Math.max(0.15, Math.cos(betaRad)));

    const d1 = z1 * mt;
    const d2 = z2 * mt;
    const aStandard = internal ? (d2 - d1) / 2 : (d1 + d2) / 2;

    const sumX = internal ? x1 - x2 : x1 + x2;
    const sumZ = internal ? Math.max(1, z2 - z1) : z1 + z2;
    const invAlphaWt = involute(alphaT) + (2 * Math.tan(alphaN) * sumX) / sumZ;
    const alphaWt = Math.abs(sumX) < 1e-9 ? alphaT : inverseInvolute(Math.max(0, invAlphaWt));
    const aWorking =
        Math.abs(sumX) < 1e-9
            ? aStandard
            : aStandard * Math.cos(alphaT) / Math.max(0.05, Math.cos(alphaWt));

    const cStar = 0.25;
    const y = Math.abs(sumX) < 1e-9 ? 0 : (aWorking - aStandard) / mn;
    const kAddendum = internal ? 0 : Math.max(0, sumX - y);

    const da1 = d1 + 2 * mn * (1 + x1 - kAddendum);
    const da2 = internal ? d2 - 2 * mn * (1 - x2) : d2 + 2 * mn * (1 + x2 - kAddendum);
    const df1 = d1 - 2 * mn * (1 + cStar - x1);
    const df2 = internal ? d2 + 2 * mn * (1 + cStar + x2) : d2 - 2 * mn * (1 + cStar - x2);

    const db1 = d1 * Math.cos(alphaT);
    const db2 = d2 * Math.cos(alphaT);
    const ra1 = da1 / 2;
    const ra2 = da2 / 2;
    const rb1 = db1 / 2;
    const rb2 = db2 / 2;

    const g1 = Math.sqrt(Math.max(0, ra1 * ra1 - rb1 * rb1));
    const g2 = Math.sqrt(Math.max(0, ra2 * ra2 - rb2 * rb2));
    const gAlpha = internal
        ? g1 - g2 + aWorking * Math.sin(alphaWt)
        : g1 + g2 - aWorking * Math.sin(alphaWt);
    const pbt = Math.PI * mt * Math.cos(alphaT);
    const epsilonAlpha = pbt > 1e-9 ? Math.max(0.2, gAlpha / pbt) : 1.2;
    const epsilonBeta = Math.abs(betaDeg) > 0.05 ? (b * Math.sin(Math.abs(betaRad))) / (Math.PI * mn) : 0;
    const epsilonGamma = epsilonAlpha + epsilonBeta;

    const zn1 = virtualTeeth(z1, betaRad, alphaN);
    const zn2 = virtualTeeth(z2, betaRad, alphaN);

    const rpm = Math.max(1e-6, input.rpmPinion);
    const pitchVelocity = (Math.PI * d1 * rpm) / 60000;
    const torqueNm = input.torqueNm;
    const Ft = d1 > 0 ? (2000 * Math.abs(torqueNm)) / d1 : 0;
    const Fr = Ft * Math.tan(alphaT);
    const Fa = Ft * Math.tan(betaRad);
    const Fn = Math.sqrt(Ft * Ft + Fr * Fr + Fa * Fa);

    const Kv = iso6336DynamicFactor(pitchVelocity, Q);
    const { KHbeta, KFbeta } = faceLoadFactors(b, d1, mn, epsilonBeta);
    const KHalpha = epsilonAlpha >= 2 ? 1.1 : 1.0;
    const KFalpha = KHalpha;

    const Ered = 2 / ((1 - nu1 * nu1) / E1 + (1 - nu2 * nu2) / E2);
    const ZE = Math.sqrt(Ered / (2 * Math.PI));

    const sinBetaB = Math.sin(betaRad) * Math.cos(alphaN);
    const betaB = Math.asin(Math.max(-1, Math.min(1, sinBetaB)));
    const ZH = Math.sqrt(
        (2 * Math.cos(betaB)) / Math.max(0.05, Math.cos(alphaT) ** 2 * Math.sin(Math.max(0.05, alphaWt))),
    );
    const Zeps = contactRatioFactorZeps(epsilonAlpha, epsilonBeta);
    const Zbeta = Math.sqrt(Math.max(0.5, Math.cos(betaB)));

    const u = z2 / z1;
    const curvature = internal ? Math.max(0.05, (u - 1) / u) : (u + 1) / u;
    const FtH = Ft * Ka * Kv * KHbeta * KHalpha;
    const sigmaH =
        ZH * ZE * Zeps * Zbeta * Math.sqrt(Math.max(0, (FtH * curvature) / Math.max(1e-6, d1 * b)));

    const YF1 = toothFormFactorYF(zn1, x1);
    const YF2 = toothFormFactorYF(zn2, internal ? -x2 : x2);
    const YS1 = stressCorrectionYS(zn1);
    const YS2 = stressCorrectionYS(zn2);
    const Ybeta = helixFactorYbeta(epsilonBeta, betaDeg);
    const FtF = Ft * Ka * Kv * KFbeta * KFalpha;
    const sigmaF1 = (FtF * YF1 * YS1 * Ybeta) / (b * mn);
    const sigmaF2 = (FtF * YF2 * YS2 * Ybeta) / (b * mn);

    const SH1 = sigmaH > 1e-6 ? sigmaHlim1 / sigmaH : 0;
    const SH2 = sigmaH > 1e-6 ? sigmaHlim2 / sigmaH : 0;
    const SH = Math.min(SH1, SH2);
    const SF1 = sigmaF1 > 1e-6 ? sigmaFlim1 / sigmaF1 : 0;
    const SF2 = sigmaF2 > 1e-6 ? sigmaFlim2 / sigmaF2 : 0;

    const targetMet = SH1 >= targetSH && SH2 >= targetSH && SF1 >= targetSF && SF2 >= targetSF;
    let status: Iso6336MeshResult['status'];
    if (targetMet) status = 'safe';
    else if (SH1 >= 1.0 && SH2 >= 1.0 && SF1 >= 1.0 && SF2 >= 1.0) status = 'marginal';
    else status = 'unsafe';

    let criticalFactor = 'Bending (pinion)';
    if (SH <= SF1 && SH <= SF2) {
        criticalFactor = SH1 <= SH2 ? 'Pitting (pinion contact)' : 'Pitting (gear contact)';
    } else if (SF2 < SF1) {
        criticalFactor = 'Bending (gear)';
    }

    return {
        valid: true,
        verificationLevel: 'screening',
        methodScope: 'ISO 6336-2:2019 Simplified Method B (Screening)',
        detailedVerificationRequired: true,
        targetMet,
        targetSH,
        targetSF,
        mn,
        mt,
        betaDeg,
        alphaNDeg,
        alphaTDeg: radToDeg(alphaT),
        alphaWtDeg: radToDeg(alphaWt),
        z1,
        z2,
        u,
        internal,
        d1,
        d2,
        da1,
        da2,
        df1,
        df2,
        db1,
        db2,
        aStandard,
        aWorking,
        y,
        kAddendum,
        epsilonAlpha,
        epsilonBeta,
        epsilonGamma,
        zn1,
        zn2,
        pitchVelocity,
        Ft,
        Fr,
        Fa,
        Fn,
        Ka,
        Kv,
        KHbeta,
        KFbeta,
        KHalpha,
        KFalpha,
        ZH,
        ZE,
        Zeps,
        Zbeta,
        YF1,
        YF2,
        YS1,
        YS2,
        Ybeta,
        sigmaH,
        sigmaF1,
        sigmaF2,
        SH,
        SH1,
        SH2,
        SF1,
        SF2,
        status,
        criticalFactor,
    };
}

export function elasticConstantsForGearMaterial(name: string): { E: number; nu: number } {
    const n = name.toLowerCase();
    if (n.includes('pom') || n.includes('nylon') || n.includes('plastic') || n.includes('pa66') || n.includes('delrin')) {
        return { E: 3.1, nu: 0.38 };
    }
    if (n.includes('gg25') || n.includes('cast iron') || n.includes('grey')) {
        return { E: 110, nu: 0.26 };
    }
    if (n.includes('ggg') || n.includes('nodular')) {
        return { E: 170, nu: 0.28 };
    }
    if (n.includes('bronze') || n.includes('cusn')) {
        return { E: 113, nu: 0.34 };
    }
    return { E: 206, nu: 0.3 };
}
