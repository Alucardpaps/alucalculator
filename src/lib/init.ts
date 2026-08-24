/**
 * 🏛️ ALUCALCULATOR - EXAMPLE MODULE
 * "The Proof of Concept"
 */

import { CalculatorRegistry } from "./kernel/registry";
import { Unit, createVal } from "./kernel/types";
import { CalculatorSchema, defineSchema } from "./kernel/schema";
import { InvoluteEngine } from "./engines/math/involute";
import { GearValidator } from "./engines/validation/gear.validation";

// Define the Gear Schema
const GearCalculator: CalculatorSchema = defineSchema({
    id: "mech.gear.spur.v1",
    version: "1.0.0",
    category: "Mechanical / Power Transmission",
    standards: ["DIN 3960", "ISO 53"],
    assumptions: ["Standard Involute", "No Undercut Correction Applied automatically"],

    inputs: [
        { key: "m", label: "Module", unit: Unit.MILLIMETER, defaultValue: 2, min: 0.1 },
        { key: "z", label: "Teeth Count", unit: Unit.COUNT, defaultValue: 20, min: 3, step: 1 },
        { key: "alpha", label: "Pressure Angle", unit: Unit.DEGREE, defaultValue: 20 },
        { key: "x", label: "Profile Shift", unit: Unit.UNITLESS, defaultValue: 0 }
    ],

    outputs: [
        { key: "d", label: "Pitch Diameter", unit: Unit.MILLIMETER },
        { key: "da", label: "Tip Diameter", unit: Unit.MILLIMETER },
        { key: "df", label: "Root Diameter", unit: Unit.MILLIMETER },
        { key: "db", label: "Base Diameter", unit: Unit.MILLIMETER }
    ],

    compute: (inputs) => {
        // 1. Extract inputs
        const params = {
            module: inputs.m,
            teeth: inputs.z,
            pressureAngleDeg: inputs.alpha,
            profileShift: inputs.x
        };

        // 2. Validate
        GearValidator.validate(params);

        // 3. Compute Core Geometry
        const geo = InvoluteEngine.compute(params);

        // 4. Return formatted EngineeringValues
        return {
            d: createVal(geo.pitchDiameter, Unit.MILLIMETER),
            da: createVal(geo.tipDiameter, Unit.MILLIMETER),
            df: createVal(geo.rootDiameter, Unit.MILLIMETER),
            db: createVal(geo.baseDiameter, Unit.MILLIMETER)
        };
    }
});

// Bootstrapper function to be called at app startup
export function bootstrapRegistry() {
    console.log("🛠️ Bootstrapping Engineering Kernel...");
    try {
        CalculatorRegistry.register(GearCalculator);
        console.log("✅ Registry Initialized.");
    } catch (e) {
        console.error("❌ Registry Failed:", e);
    }
}
