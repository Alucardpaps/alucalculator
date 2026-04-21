import { D, toNumber } from "./utils/precision";

/**
 * Pure Bearings Engine
 * DETERMINISTIC & CONTEXT-FREE.
 * No DB, No User, No Projects. Just Math.
 */

export type BearingsInput = {
    load: number;
    diameter: number;
};

export function computeBearings(input: BearingsInput) {
    const load = D(input.load);
    const diameter = D(input.diameter);

    if (diameter.isZero()) {
        throw new Error("ZERO_DIAMETER");
    }

    // Pure math
    const stress = load.div(diameter);

    return {
        stress: toNumber(stress)
    };
}
