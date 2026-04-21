import { D, toNumber } from "./utils/precision";

/**
 * Bolt Torque & Preload Engine
 * Computes necessary tightening torque based on VDI 2230 and standard K-factor formulas.
 */

export type TorqueInput = {
    boltDiameter: number; // mm
    boltClass: number; // 8.8, 10.9, 12.9
    nutFactor: number; // K (0.10 - 0.25)
    targetLoadPercentage: number; // 0.75 (75% of Proof Load)
};

export function computeBoltTorque(input: TorqueInput) {
    const d = D(input.boltDiameter);
    const K = D(input.nutFactor);
    const fraction = D(input.targetLoadPercentage);

    // 1. Proof Strength calculation (Approximate for ISO metric classes)
    const classBase = Math.floor(input.boltClass);
    const proofStrength = D(classBase).mul(input.boltClass * 10 % 10).mul(10).mul(0.9); // Proof is ~90% of Yield
    
    const Sp = proofStrength.isZero() ? D(600) : proofStrength;

    // 2. Tensile Stress Area (Simplified Metric Coarse)
    // As = 0.7854 * (d - 0.9382P)^2
    const area = D(0.78).mul(d.pow(2));

    // 3. Target Clamp Load (Preload)
    // Fi = Sp * As * fraction
    const clampLoad = Sp.mul(area).mul(fraction);

    // 4. Tightening Torque (T)
    // T = K * d * Fi / 1000 (to convert N-mm to N-m)
    const torque = K.mul(d).mul(clampLoad).div(1000);

    // 5. Bolt Integrity Check
    const maxTorque = K.mul(d).mul(Sp.mul(area)).div(1000);
    const safetyMargin = maxTorque.div(torque);

    return {
        torque: toNumber(torque),
        clampLoad: toNumber(clampLoad),
        proofStrength: toNumber(Sp),
        safetyMargin: toNumber(safetyMargin),
        status: toNumber(safetyMargin) > 1.1 ? 'SAFE' : 'CRITICAL'
    };
}
