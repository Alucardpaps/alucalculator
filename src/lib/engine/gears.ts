import { D, toNumber } from "./utils/precision";

/**
 * Pure Gear Engine (Wave 2)
 * DETERMINISTIC & CONTEXT-FREE.
 * Implements Lewis Stress Formula for Spur Gears.
 */

export interface GearInput {
    force: number;      // Tangential force (N)
    module: number;     // Gear module (mm)
    faceWidth: number;  // Face width (mm)
    teethCount: number; // Number of teeth
    formFactor?: number; // Y Factor (defaulting to 0.3 for 20 deg)
}

export function computeGearStress(input: GearInput) {
    const F = D(input.force);
    const m = D(input.module);
    const b = D(input.faceWidth);
    const Y = D(input.formFactor || 0.3);

    if (m.isZero() || b.isZero() || Y.isZero()) {
        throw new Error("INVALID_GEOMETRY: Module, FaceWidth, and FormFactor must be non-zero.");
    }

    // Lewis Formula: sigma = F / (m * b * Y)
    const stress = F.div(m.times(b).times(Y));

    return {
        bendingStress: toNumber(stress),
        module: input.module,
        teeth: input.teethCount
    };
}
