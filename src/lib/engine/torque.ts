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

/** ISO 261 coarse pitch (mm). */
function coarsePitch(d: number): number {
    const table: [number, number][] = [[3, 0.5], [4, 0.7], [5, 0.8], [6, 1], [8, 1.25], [10, 1.5], [12, 1.75], [14, 2], [16, 2], [18, 2.5], [20, 2.5], [22, 2.5], [24, 3], [27, 3], [30, 3.5], [33, 3.5], [36, 4], [39, 4]];
    let best = table[0];
    for (const row of table) if (Math.abs(row[0] - d) < Math.abs(best[0] - d)) best = row;
    return best[1];
}

/**
 * @deprecated Simple K-factor estimate kept for the legacy engine registry.
 * The site's bolt solver is `computeBoltAssembly` in '@/lib/fastener/sharedEngine'.
 */
export function computeBoltTorque(input: TorqueInput) {
    const d = D(input.boltDiameter);
    const K = D(input.nutFactor);
    const fraction = D(input.targetLoadPercentage);

    // 1. Proof stress Sp — ISO 898-1:2013 Table 3 (8.8 is 580 MPa for d ≤ 16 mm, 600 MPa above)
    const dNum = input.boltDiameter;
    const cls = Math.round(input.boltClass * 10) / 10;
    const spMpa = cls === 8.8 ? (dNum <= 16 ? 580 : 600) : cls === 10.9 ? 830 : cls === 12.9 ? 970 : cls === 5.8 ? 380 : cls === 4.6 ? 225 : 580;
    const Sp = D(spMpa);

    // 2. Tensile stress area — ISO 898-1: As = π/4 · ((d2 + d3)/2)², ISO 261 coarse pitch
    const P = coarsePitch(dNum);
    const dMean = dNum - 0.9382 * P;
    const area = D(Math.PI / 4).mul(D(dMean).pow(2));

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
