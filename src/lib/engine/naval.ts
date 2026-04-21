import { D, toNumber } from "./utils/precision";

/**
 * Naval Hydrostatics Engine
 * Computes buoyancy, displacement, and metacentric stability (GM).
 */

export type NavalInput = {
    length: number; // m
    beam: number; // m
    draft: number; // m
    blockCoefficient: number; // Cb (0.6 - 0.9)
    centerOfGravity: number; // KG (m)
    waterDensity?: number; // 1025 kg/m3 default (saltwater)
};

export function computeNavalHydrostatics(input: NavalInput) {
    const L = D(input.length);
    const B = D(input.beam);
    const T = D(input.draft);
    const Cb = D(input.blockCoefficient);
    const KG = D(input.centerOfGravity);
    const rho = D(input.waterDensity || 1025);
    const g = D(9.81);

    // 1. Displaced Volume (V) = L * B * T * Cb
    const volume = L.mul(B).mul(T).mul(Cb);

    // 2. Displacement (Delta) = V * rho
    const displacement = volume.mul(rho).div(1000); // in tonnes

    // 3. Buoyancy Force (Fb) = V * rho * g
    const buoyancyForce = volume.mul(rho).mul(g).div(1000); // in kN

    // 4. Metacentric Height (GM) simplified
    // KB (Center of Buoyancy) approx 0.53 * T
    const KB = T.mul(0.53);
    
    // BM (Metacentric Radius) = (I / V)
    // Simplified: BM = (B^2 / (12 * T * Cb)) * constant
    const BM = B.pow(2).div(T.mul(12).mul(Cb));

    // KM = KB + BM
    const KM = KB.add(BM);

    // GM = KM - KG
    const GM = KM.sub(KG);

    // Stability Assessment
    const stabilityStatus = GM.gt(0.15) ? "STABLE" : (GM.gt(0) ? "CRITICAL" : "UNSTABLE");

    return {
        displacement: toNumber(displacement),
        buoyancyForce: toNumber(buoyancyForce),
        metacentricHeight: toNumber(GM),
        centerOfBuoyancy: toNumber(KB),
        stabilityStatus: stabilityStatus,
        volume: toNumber(volume)
    };
}
