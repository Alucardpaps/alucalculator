/**
 * Planetary / epicyclic rating — AGMA 6123 load share + Müller mesh-power efficiency
 * plus ISO 6336 screening of sun–planet (external) and planet–ring (internal) meshes.
 */

import { calculateIso6336Mesh, type Iso6336MeshResult } from './iso6336';

export type PlanetaryFixedMember = 'ring' | 'sun' | 'carrier';

export interface PlanetaryRatingInput {
    zs: number;
    zp?: number;
    zr?: number;
    planetCount: number;
    mn: number;
    betaDeg?: number;
    faceWidth?: number;
    alphaNDeg?: number;
    mode: PlanetaryFixedMember;
    nInRpm: number;
    powerKW: number;
    floatingSun?: boolean;
    muMesh?: number;
    sigmaHlim?: number;
    sigmaFlim?: number;
    E_GPa?: number;
    nu?: number;
    qualityGrade?: number;
}

export interface PlanetaryMeshScreen {
    Ft: number;
    sigmaH: number;
    sigmaF: number;
    SH: number;
    SF: number;
    epsilonAlpha: number;
    epsilonBeta: number;
}

export interface PlanetaryRatingResult {
    zs: number;
    zp: number;
    zr: number;
    N: number;
    mn: number;
    mt: number;
    betaDeg: number;
    faceWidth: number;
    ds: number;
    dp: number;
    dr: number;
    dc: number;
    i: number;
    nOut: number;
    T_in: number;
    T_out: number;
    T_sun: number;
    T_ring: number;
    T_carrier: number;
    eta0: number;
    etaStage: number;
    meshPowerFraction: number;
    couplingPowerFraction: number;
    powerLossKW: number;
    Kgamma: number;
    Ft_sun_total: number;
    Ft_planet: number;
    Fa_sun: number;
    Fr_sun: number;
    F_carrier_pin: number;
    sunPlanet: PlanetaryMeshScreen;
    planetRing: PlanetaryMeshScreen;
    assemblyOk: boolean;
    assemblyRemainder: number;
    coaxialOk: boolean;
    adjacentClearanceMm: number;
    adjacentOk: boolean;
    helixHands: { sun: 'RH' | 'LH' | 'spur'; planets: 'RH' | 'LH' | 'spur'; ring: 'RH' | 'LH' | 'spur' };
    status: 'safe' | 'marginal' | 'unsafe';
    criticalMesh: string;
}

/** AGMA 6123 planet load-sharing factor Kγ. Floating sun is the usual industrial layout. */
export function planetLoadShareFactor(N: number, floatingSun = true): number {
    const n = Math.max(1, Math.round(N));
    if (n <= 1) return 1;
    if (n === 2) return floatingSun ? 1.2 : 1.45;
    if (floatingSun) return 1.1 + 0.05 * (n - 3);
    return 1.25 + 0.15 * (n - 3);
}

/** Buckingham / Müller mesh efficiency for one mesh. */
export function singleMeshEfficiency(zA: number, zB: number, internal: boolean, mu = 0.06): number {
    const za = Math.max(8, Math.abs(zA));
    const zb = Math.max(8, Math.abs(zB));
    const loss = Math.PI * mu * (1 / za + (internal ? -1 : 1) / zb);
    return Math.max(0.88, Math.min(0.995, 1 - Math.max(0.002, loss)));
}

function helixHand(betaDeg: number, flipped: boolean): 'RH' | 'LH' | 'spur' {
    if (Math.abs(betaDeg) < 0.05) return 'spur';
    const positive = betaDeg > 0;
    return (positive !== flipped) ? 'RH' : 'LH';
}

function screenFromMesh(mesh: Iso6336MeshResult, Ft: number): PlanetaryMeshScreen {
    return {
        Ft,
        sigmaH: mesh.sigmaH,
        sigmaF: mesh.sigmaF1,
        SH: mesh.SH,
        SF: mesh.SF1,
        epsilonAlpha: mesh.epsilonAlpha,
        epsilonBeta: mesh.epsilonBeta,
    };
}

export function ratePlanetaryStage(input: PlanetaryRatingInput): PlanetaryRatingResult {
    const zs = Math.max(8, Math.round(input.zs));
    const zpIn = input.zp != null ? Math.round(input.zp) : undefined;
    const zrIn = input.zr != null ? Math.round(input.zr) : undefined;
    const zp = zpIn != null && zpIn > 0 ? zpIn : zrIn != null ? Math.max(4, Math.round((zrIn - zs) / 2)) : 18;
    const zr = zrIn != null && zrIn > zs ? zrIn : zs + 2 * zp;
    const N = Math.max(1, Math.round(input.planetCount));
    const mn = Math.max(0.3, input.mn);
    const betaDeg = input.betaDeg ?? 0;
    const faceWidth = input.faceWidth && input.faceWidth > 0 ? input.faceWidth : 10 * mn;
    const alphaNDeg = input.alphaNDeg ?? 20;
    const mu = input.muMesh ?? 0.06;
    const floating = input.floatingSun !== false;
    const nIn = Math.max(1e-6, input.nInRpm);
    const powerKW = Math.max(0, input.powerKW);

    const betaRad = (betaDeg * Math.PI) / 180;
    const mt = Math.abs(betaDeg) > 0.05 ? mn / Math.cos(betaRad) : mn;
    const ds = mt * zs;
    const dp = mt * zp;
    const dr = mt * zr;
    const dc = ds + dp;

    let i = 1;
    if (input.mode === 'ring') i = 1 + zr / zs;
    else if (input.mode === 'carrier') i = -zr / zs;
    else i = 1 + zs / zr;

    const etaSp = singleMeshEfficiency(zs, zp, false, mu);
    const etaPr = singleMeshEfficiency(zp, zr, true, mu);
    const eta0 = etaSp * etaPr;
    const alpha = zr / zs;
    let etaStage: number;
    let meshPowerFraction: number;
    if (input.mode === 'carrier') {
        etaStage = eta0;
        meshPowerFraction = 1;
    } else if (input.mode === 'sun') {
        meshPowerFraction = 1 / (1 + alpha);
        etaStage = (alpha + eta0) / (1 + alpha);
    } else {
        meshPowerFraction = alpha / (1 + alpha);
        etaStage = (1 + alpha * eta0) / (1 + alpha);
    }
    etaStage = Math.max(0.7, Math.min(0.995, etaStage));
    const couplingPowerFraction = 1 - meshPowerFraction;

    const T_in = (powerKW * 9549.27) / nIn;
    const nOut = nIn / i;
    const T_out = Math.abs(nOut) > 1e-9 ? (powerKW * etaStage * 9549.27) / Math.abs(nOut) * Math.sign(i || 1) : 0;
    const powerLossKW = powerKW * (1 - etaStage);

    // Member torques from statics Ts + Tr + Tc = 0, |Tr/Ts| = zr/zs.
    let T_sun = 0;
    let T_ring = 0;
    let T_carrier = 0;
    if (input.mode === 'ring') {
        T_sun = T_in;
        T_carrier = -T_out;
        T_ring = -T_sun - T_carrier;
    } else if (input.mode === 'carrier') {
        T_sun = T_in;
        T_ring = -T_out;
        T_carrier = -T_sun - T_ring;
    } else {
        T_ring = T_in;
        T_carrier = -T_out;
        T_sun = -T_ring - T_carrier;
    }

    const Kgamma = planetLoadShareFactor(N, floating);
    const Ft_sun_total = ds > 0 ? (2000 * Math.abs(T_sun)) / ds : 0;
    const Ft_planet = N > 0 ? (Ft_sun_total * Kgamma) / N : Ft_sun_total;
    const Fa_sun = Ft_sun_total * Math.tan(Math.abs(betaRad));
    const alphaT = Math.atan(Math.tan((alphaNDeg * Math.PI) / 180) / Math.max(0.15, Math.cos(betaRad)));
    const Fr_sun = Ft_sun_total * Math.tan(alphaT);
    const F_carrier_pin = Ft_planet * (1 + ds / Math.max(ds, dr));

    const T_planet_sun = (Ft_planet * ds) / 2000;
    const n_sun = input.mode === 'sun' ? 0 : input.mode === 'ring' ? nIn : nIn;
    const n_ring = input.mode === 'ring' ? 0 : input.mode === 'sun' ? nIn : nOut;
    const n_carrier = input.mode === 'carrier' ? 0 : input.mode === 'ring' ? nOut : nOut;
    const n_rel_sp = Math.abs(n_sun - n_carrier);

    const common = {
        b: faceWidth,
        alphaNDeg,
        betaDeg,
        applicationFactor: Kgamma,
        qualityGrade: input.qualityGrade ?? 6,
        E1GPa: input.E_GPa ?? 206,
        E2GPa: input.E_GPa ?? 206,
        nu1: input.nu ?? 0.3,
        nu2: input.nu ?? 0.3,
        sigmaHlim: input.sigmaHlim ?? 1500,
        sigmaFlim1: input.sigmaFlim ?? 430,
        sigmaFlim2: input.sigmaFlim ?? 430,
    };

    const sunPlanetMesh = calculateIso6336Mesh({
        ...common,
        mn,
        z1: zs,
        z2: zp,
        torqueNm: T_planet_sun,
        rpmPinion: Math.max(50, n_rel_sp),
        internal: false,
    });

    const T_planet_ring = (Ft_planet * dr) / 2000;
    const n_rel_pr = Math.abs(n_ring - n_carrier);
    const planetRingMesh = calculateIso6336Mesh({
        ...common,
        mn,
        z1: zp,
        z2: zr,
        torqueNm: (Ft_planet * dp) / 2000,
        rpmPinion: Math.max(50, n_rel_pr || n_rel_sp),
        internal: true,
    });

    const sunPlanet = screenFromMesh(sunPlanetMesh, Ft_planet);
    const planetRing = screenFromMesh(planetRingMesh, Ft_planet);

    const assemblyRemainder = (zs + zr) % N;
    const assemblyOk = assemblyRemainder === 0;

    // Coaxial integer tooth feasibility check: zr = zs + 2*zp => (zr - zs) must be even and > 0
    const coaxialOk = (zr - zs) % 2 === 0 && zr > zs;

    // Adjacent planet clearance check (non-interference condition):
    // Center distance between adjacent planets C_adj = 2 * a * sin(pi / N) where a = dc / 2.
    // Planet addendum diameter da_planet = dp + 2 * mn.
    const aOrbit = dc / 2;
    const da_planet = dp + 2 * mn;
    const C_adj = N > 1 ? 2 * aOrbit * Math.sin(Math.PI / N) : 999;
    const adjacentClearanceMm = N > 1 ? Number((C_adj - da_planet).toFixed(3)) : 999;
    const adjacentOk = N <= 1 || adjacentClearanceMm > 0;

    const minSH = Math.min(sunPlanet.SH, planetRing.SH);
    const minSF = Math.min(sunPlanet.SF, planetRing.SF);
    let status: PlanetaryRatingResult['status'];
    if (minSF >= 1.4 && minSH >= 1.0 && assemblyOk && coaxialOk && adjacentOk) status = 'safe';
    else if (minSF >= 1.0 && minSH >= 0.9 && assemblyOk && coaxialOk && adjacentOk) status = 'marginal';
    else status = 'unsafe';

    let criticalMesh = 'sun–planet contact';
    if (!coaxialOk) criticalMesh = 'coaxial integer teeth (odd Zr-Zs)';
    else if (!assemblyOk) criticalMesh = 'assembly spacing ((Zs+Zr)/N)';
    else if (!adjacentOk) criticalMesh = 'adjacent planet collision';
    else if (planetRing.SF <= sunPlanet.SF && planetRing.SF <= minSH) criticalMesh = 'planet–ring bending';
    else if (planetRing.SH <= sunPlanet.SH && planetRing.SH <= minSF) criticalMesh = 'planet–ring pitting';
    else if (sunPlanet.SF <= sunPlanet.SH) criticalMesh = 'sun–planet bending';

    void T_planet_ring;

    return {
        zs,
        zp,
        zr,
        N,
        mn,
        mt,
        betaDeg,
        faceWidth,
        ds,
        dp,
        dr,
        dc,
        i,
        nOut,
        T_in,
        T_out,
        T_sun,
        T_ring,
        T_carrier,
        eta0,
        etaStage,
        meshPowerFraction,
        couplingPowerFraction,
        powerLossKW,
        Kgamma,
        Ft_sun_total,
        Ft_planet,
        Fa_sun,
        Fr_sun,
        F_carrier_pin,
        sunPlanet,
        planetRing,
        assemblyOk,
        assemblyRemainder,
        coaxialOk,
        adjacentClearanceMm,
        adjacentOk,
        helixHands: {
            sun: helixHand(betaDeg, false),
            planets: helixHand(betaDeg, true),
            ring: helixHand(betaDeg, true),
        },
        status,
        criticalMesh,
    };
}
