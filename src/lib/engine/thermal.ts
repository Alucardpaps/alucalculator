import { D, toNumber } from "./utils/precision";

/**
 * Thermal Expansion Engine
 * Computes linear expansion based on material coefficient and delta T.
 */

export type ThermalInput = {
    length: number; // mm
    tempStart: number; // C
    tempEnd: number; // C
    materialAlpha: number; // e.g. 23.1e-6 for Aluminum
};

export function computeThermalExpansion(input: ThermalInput) {
    const L = D(input.length);
    const dT = D(input.tempEnd).sub(input.tempStart);
    const alpha = D(input.materialAlpha);

    // Delta L = L * alpha * dT
    const expansion = L.mul(alpha).mul(dT);
    const finalLength = L.add(expansion);

    return {
        deltaL: toNumber(expansion),
        finalLength: toNumber(finalLength),
        tempDelta: toNumber(dT)
    };
}
