import { D, toNumber } from "./utils/precision";

/**
 * Bolted Joints Engine
 * Computes tensile stress and safety factors for structural fasteners.
 */

export type BoltedJointInput = {
    appliedLoad: number; // N
    boltDiameter: number; // mm
    boltClass: number; // e.g. 8.8, 10.9
    preLoadFraction?: number; // 0.75 default
};

export function computeBoltedJoint(input: BoltedJointInput) {
    const P = D(input.appliedLoad);
    const d = D(input.boltDiameter);
    const fraction = D(input.preLoadFraction || 0.75);

    // Calculate Stress Area (Simplified formula for metric)
    // As = (pi/4) * (d - 0.9382 * P_pitch)^2
    // For standard coarse: As ≈ 0.78 * d^2
    const area = D(0.78).mul(d.pow(2));

    // Yield Strength based on class (e.g. 8.8 -> 8 * 8 * 10 = 640 MPa)
    const classBase = Math.floor(input.boltClass);
    const yieldStrength = D(classBase).mul(input.boltClass * 10 % 10).mul(10); 
    
    const actualYield = yieldStrength.isZero() ? D(640) : yieldStrength; // Default to 8.8

    // Pre-load (Fp)
    const preLoad = area.mul(actualYield).mul(fraction);

    // Total Force (Ft) - Simplified
    const totalForce = preLoad.add(P);

    // Actual Stress
    const stress = totalForce.div(area);

    // Safety Factor
    const safetyFactor = actualYield.div(stress);

    return {
        stress: toNumber(stress),
        safetyFactor: toNumber(safetyFactor),
        clampingForce: toNumber(preLoad),
        yieldLimit: toNumber(actualYield)
    };
}
