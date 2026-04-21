import { IEngine } from "./types";
import { D, toNumber } from "./utils/precision";

/**
 * Pure Shafts Engine (Wave 3.1)
 * DETERMINISTIC & CONTEXT-FREE.
 * Implements Static Analysis for a Simply Supported Beam.
 */

export interface ShaftInput {
    length: number;      // Total length L (mm)
    forcePos: number;    // Distance a from Support A (mm)
    force: number;       // Applied Point Load F (N)
}

export const ShaftEngine: IEngine<ShaftInput> = {
    metadata: {
        id: "shafts",
        name: "Shaft Analysis",
        version: "1.0.0",
        domain: "mechanical"
    },

    validate: (payload: any) => {
        const { length, forcePos, force } = payload;
        if (!length || !force) {
            throw new Error("MISSING_PARAMS: length and force are mandatory.");
        }
        if (Number(forcePos) > Number(length)) {
            throw new Error("INVALID_GEOMETRY: Force position cannot exceed total shaft length.");
        }
        return {
            length: Number(length),
            forcePos: Number(forcePos || length / 2),
            force: Number(force)
        };
    },

    compute: (input: ShaftInput) => {
        const L = D(input.length);
        const a = D(input.forcePos);
        const b = L.minus(a); // Distance from Support B
        const F = D(input.force);

        // Reactions: Ra = F * b / L, Rb = F * a / L
        const ra = F.times(b).div(L);
        const rb = F.times(a).div(L);

        // Max Bending Moment: M = F * a * b / L
        const mMax = F.times(a).times(b).div(L);

        return {
            reactionA: toNumber(ra),
            reactionB: toNumber(rb),
            maxMoment: toNumber(mMax),
            metadata: {
                loadPosition: input.forcePos,
                totalLength: input.length
            }
        };
    }
};
