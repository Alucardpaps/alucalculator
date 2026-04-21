import { D, toNumber } from "./utils/precision";

/**
 * Failure Diagnosis Engine
 * Analyzes fatigue life, static failure, and stress concentration.
 */

export type FailureInput = {
    operatingStress: number; // MPa
    yieldStrength: number; // MPa
    enduranceLimit: number; // MPa (For fatigue)
    stressConcentrationFactor: number; // Kt
    cyclesCount?: number; // Estimated cycles
};

export function computeFailureDiagnosis(input: FailureInput) {
    const sigma = D(input.operatingStress);
    const Sy = D(input.yieldStrength);
    const Se = D(input.enduranceLimit);
    const Kt = D(input.stressConcentrationFactor);

    // 1. Static Safety Factor (Von-Mises/Tresca simplified)
    const staticSF = Sy.div(sigma.mul(Kt));

    // 2. Fatigue Analysis (Modified Goodman)
    // Assume mean stress is zero for simple case (alternating only)
    const alternatingStress = sigma.mul(Kt);
    const fatigueSF = Se.div(alternatingStress);

    // 3. Damage Probability (%)
    let damageProb = 0;
    if (fatigueSF.lt(1)) damageProb = 95;
    else if (fatigueSF.lt(1.5)) damageProb = 60;
    else if (fatigueSF.lt(2)) damageProb = 25;
    else damageProb = 5;

    // 4. Mode Determination
    const primaryMode = staticSF.lt(1) ? "STATIC_FRACTURE" : (fatigueSF.lt(1.5) ? "FATIGUE_FAILURE" : "STABLE");

    return {
        staticSafetyFactor: toNumber(staticSF),
        fatigueSafetyFactor: toNumber(fatigueSF),
        damageProbability: damageProb,
        primaryMode: primaryMode,
        criticalStress: toNumber(alternatingStress)
    };
}
