import { IEngine } from "./types";
import { computeBearings } from "./bearings";
import { computeGearStress, GearInput } from "./gears";
import { ShaftEngine } from "./shafts";
import { computeBoltedJoint } from "./boltedJoints";
import { computeThermalExpansion } from "./thermal";
import { computeFailureDiagnosis } from "./failure";
import { computeNavalHydrostatics } from "./naval";
import { computeBoltTorque } from "./torque";


/**
 * Global Registry Force-Refresh (v1.0.1)
 */
/**
 * Bearings Module Implementation
 */
const BearingEngine: IEngine = {
    metadata: {
        id: "bearings",
        name: "Bearings Analysis",
        version: "1.0.0",
        domain: "mechanical"
    },
    validate: (payload) => {
        if (!payload.load || !payload.diameter) {
            throw new Error("MISSING_PARAMS: Load and diameter are required.");
        }
        return payload;
    },
    compute: (input) => computeBearings({ 
        load: input.load, 
        diameter: input.diameter 
    })
};

/**
 * Gears Module Implementation
 */
const GearEngine: IEngine<GearInput> = {
    metadata: {
        id: "gears",
        name: "Gears Analysis",
        version: "1.0.0",
        domain: "mechanical"
    },
    validate: (payload) => {
        if (!payload.force || !payload.module || !payload.faceWidth || !payload.teethCount) {
            throw new Error("MISSING_PARAMS: force, module, faceWidth, and teethCount are required.");
        }
        return payload as GearInput;
    },
    compute: (input) => {
        const res = computeGearStress(input);
        return {
            stress: res.bendingStress,
            metadata: {
                teeth: res.teeth,
                module: res.module
            }
        };
    }
};

/**
 * Bolted Joints Module
 */
const BoltedEngine: IEngine = {
    metadata: { id: "bolts", name: "Bolted Joints", version: "1.0.0", domain: "mechanical" },
    validate: (p) => p,
    compute: (input) => computeBoltedJoint(input as any)
};

/**
 * Thermal Expansion Module
 */
const ThermalEngine: IEngine = {
    metadata: { id: "thermal", name: "Thermal Analysis", version: "1.0.0", domain: "mechanical" },
    validate: (p) => p,
    compute: (input) => computeThermalExpansion(input as any)
};

/**
 * Failure Diagnosis Module
 */
const FailureEngine: IEngine = {
    metadata: { id: "failure", name: "Failure Diagnosis", version: "1.0.0", domain: "diagnostics" },
    validate: (p) => p,
    compute: (input) => computeFailureDiagnosis(input as any)
};

/**
 * Naval Hydrostatics Module
 */
const NavalEngine: IEngine = {
    metadata: { id: "naval", name: "Naval Hydrostatics", version: "1.0.0", domain: "marine" },
    validate: (p) => p,
    compute: (input) => computeNavalHydrostatics(input as any)
};

/**
 * Bolt Torque Module
 */
const TorqueEngine: IEngine = {
    metadata: { id: "bolt-torque", name: "Bolt Torque Analysis", version: "1.0.0", domain: "mechanical" },
    validate: (p) => p,
    compute: (input) => computeBoltTorque(input as any)
};

/**
 * Global Module Registry
 * The Single Source of Truth for all active engine plugins.
 */
export const ModuleRegistry: Record<string, IEngine> = {
    "bearings": BearingEngine,
    "gears": GearEngine,
    "shafts": ShaftEngine,
    "bolts": BoltedEngine,
    "thermal": ThermalEngine,
    "failure": FailureEngine,
    "naval": NavalEngine,
    "bolt-torque": TorqueEngine
};



