import { createEngineeringValue, ValidatedEngineeringValue } from './geometry';

// ------------------------------------------------------------------
// C) BENDING SOLVER
// ------------------------------------------------------------------
export function getKFactor(material: string, thickness: number): number {
    const mat = material.toLowerCase();

    // STRICT LOOKUP TABLE
    if (mat.includes("alu") && mat.includes("soft")) return 0.33; // 5754-H111 etc
    if (mat.includes("alu") && mat.includes("hard")) return 0.40; // 6061-T6
    if (mat.includes("steel") || mat.includes("s235") || mat.includes("s355")) return 0.44;
    if (mat.includes("stainless") || mat.includes("304") || mat.includes("316")) return 0.45;

    throw new Error(`K-Factor undefined for material: ${material}. System requires precise material designation.`);
}

export function calculateBendAllowance(
    angle: number,
    radius: number,
    thickness: number,
    kFactor: number
): ValidatedEngineeringValue {
    // BA = (Angle * PI / 180) * (R + K * T)
    const BA = (angle * Math.PI / 180) * (radius + kFactor * thickness);
    return createEngineeringValue(BA, "mm");
}

// ------------------------------------------------------------------
// D) WELDING SOLVER
// ------------------------------------------------------------------
export interface WeldingResult {
    wireMass: ValidatedEngineeringValue;
    gasVolume: ValidatedEngineeringValue;
    heatInput?: ValidatedEngineeringValue;
}

export function calculateWeldingConsumables(
    process: 'MIG' | 'TIG',
    legSize: number, // a-dimension or z-dimension? Usually leg size (z).
    length: number,
    efficiency: number = 0.85 // Deposition efficiency
): WeldingResult {

    // Volume of weld bead (Triangular approx for fillets)
    // Area = 0.5 * leg * leg
    const area_mm2 = 0.5 * legSize * legSize;
    // Add reinforcement factor (typically 10-20% extra for convexity)
    const area_real = area_mm2 * 1.15;

    const vol_mm3 = area_real * length;
    const vol_cm3 = vol_mm3 / 1000;

    // Density (Steel default)
    const density = 7.85;
    const wireMass_g = vol_cm3 * density / efficiency;

    // Gas Usage
    // Thumb rule: 12-15 L/min. Travel speed approx 30cm/min.
    // Gas (L) = (15 L/min / 300 mm/min) * length_mm
    // Approx 0.05 L per mm
    const gas_L = length * 0.05;

    return {
        wireMass: createEngineeringValue(wireMass_g / 1000, "kg"),
        gasVolume: createEngineeringValue(gas_L, "L")
    };
}
