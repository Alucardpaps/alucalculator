import { BoltPropertyClass, ThreadStandard } from '@/data/boltNutStandards';

/**
 * Bölüm J / AISC 360 Structural Connection Engine
 */

export interface ConnectionResults {
    tensionCapacity_phi: number;   // kN (phi * Rn)
    shearCapacity_phi: number;     // kN (phi * Rn)
    bearingCapacity_phi: number;   // kN (phi * Rn)
    preload_target: number;        // kN (Fi)
    torque_required: number;       // Nm (T)
    stressArea: number;            // mm^2
}

export interface ConnectionInputs {
    thread: ThreadStandard;
    boltClass: BoltPropertyClass;
    materialF_u: number;           // MPa (Ultimate strength of connected plate)
    plateThickness: number;        // mm
    edgeDistance: number;          // mm (L_c)
    frictionFactor: number;        // mu (K) for torque (default 0.2)
    threadCondition: 'N' | 'X';    // Included or Excluded from shear plane
    safetyMethod: 'LRFD' | 'ASD';
}

export function calculateConnection(inputs: ConnectionInputs): ConnectionResults {
    const { thread, boltClass, materialF_u, plateThickness, edgeDistance, frictionFactor, threadCondition, safetyMethod } = inputs;

    const phi_tension = safetyMethod === 'LRFD' ? 0.75 : 1/2.0;
    const phi_shear = safetyMethod === 'LRFD' ? 0.75 : 1/2.0;
    const phi_bearing = safetyMethod === 'LRFD' ? 0.75 : 1/2.0;

    const Ab = Math.PI * Math.pow(thread.diameter, 2) / 4; // Nominal Area
    const As = thread.area_tensile; // Stress Area

    // 1. Tension Capacity (Rn = F_nt * Ab)
    // Note: AISC use Ab for nominal, but some codes use As. We use BoltClass.nominalTensionStress
    const Fnt = boltClass.nominalTensionStress || (boltClass.tensileStrengthMin * 0.75);
    const Rn_tension = Fnt * Ab / 1000; // kN

    // 2. Shear Capacity (Rn = F_nv * Ab)
    const Fnv = threadCondition === 'X' 
        ? (boltClass.nominalShearStress_X || boltClass.tensileStrengthMin * 0.563)
        : (boltClass.nominalShearStress_N || boltClass.tensileStrengthMin * 0.45);
    const Rn_shear = Fnv * Ab / 1000; // kN

    // 3. Bearing Capacity (Bölüm J3.10)
    // Rn = 1.2 * Lc * t * Fu <= 2.4 * d * t * Fu
    const Lc = edgeDistance - (thread.diameter / 2); // Simplified clear distance
    const Rn_bearing_1 = 1.2 * Lc * plateThickness * materialF_u / 1000;
    const Rn_bearing_limit = 2.4 * thread.diameter * plateThickness * materialF_u / 1000;
    const Rn_bearing = Math.min(Rn_bearing_1, Rn_bearing_limit);

    // 4. Torque / Preload
    // Target Preload is typically 70% of Proof Strength
    // Proof Strength is roughly 0.85 * Yield for Metric
    const ProofStrength = boltClass.yieldStrengthMin * 0.85; 
    const Fi = 0.70 * ProofStrength * As / 1000; // kN
    
    // T = K * D * Fi 
    const T = frictionFactor * thread.diameter * Fi; // Nm

    return {
        tensionCapacity_phi: Rn_tension * phi_tension,
        shearCapacity_phi: Rn_shear * phi_shear,
        bearingCapacity_phi: Rn_bearing * phi_bearing,
        preload_target: Fi,
        torque_required: T,
        stressArea: As
    };
}
