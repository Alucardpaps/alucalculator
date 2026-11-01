import { D, toNumber } from "./utils/precision";
import { stressCorrectionYS, toothFormFactorYF } from "../iso6336";

/**
 * Pure Gear Engine
 * ISO 6336-3 root stress σF0 = Ft/(b mn) · YF · YS  (no KA/Kv — those need speed).
 */

export interface GearInput {
    force: number;      // Tangential force (N)
    module: number;     // Gear module (mm)
    faceWidth: number;  // Face width (mm)
    teethCount: number; // Number of teeth
    formFactor?: number; // Optional override of YF·YS product
}

export function computeGearStress(input: GearInput) {
    const F = D(input.force);
    const m = D(input.module);
    const b = D(input.faceWidth);
    const YF = toothFormFactorYF(Math.max(10, input.teethCount), 0);
    const YS = stressCorrectionYS(Math.max(10, input.teethCount));
    const Y = D(input.formFactor || YF * YS);

    if (m.isZero() || b.isZero() || Y.isZero()) {
        throw new Error("INVALID_GEOMETRY: Module, FaceWidth, and FormFactor must be non-zero.");
    }

    // ISO 6336-3: σF0 = Ft · YF · YS / (b · mn)
    const stress = F.times(Y).div(m.times(b));

    return {
        bendingStress: toNumber(stress),
        module: input.module,
        teeth: input.teethCount,
        YF,
        YS,
    };
}
