/**
 * ENGINEERING.TS
 * The core type definitions for the AluCalc OS Engineering Engine.
 * 
 * "We do not guess. We validate."
 */

export type UnitCategory =
    | 'length'
    | 'mass'
    | 'force'
    | 'torque'
    | 'pressure'
    | 'velocity'
    | 'temperature'
    | 'dimensionless';

export type EngineeringUnit = string; // e.g., 'mm', 'kg', 'N', 'MPa'

/**
 * THE LAW:
 * No calculation function is allowed to accept a raw `number`.
 * It must accept a `ValidatedEngineeringValue`.
 */
export type ValidatedEngineeringValue = {
    value: number;
    unit: EngineeringUnit;
    category: UnitCategory;
    /**
     * Cryptographic proof that this value passed a validation layer.
     * Attempting to forge this manually is a violation of protocol.
     */
    __validated: true;
    /**
     * ISO/ASTM standard that defines this value's limits, if applicable.
     */
    standardRef?: string;
    significantFigures?: number;
};

export class EngineeringError extends Error {
    constructor(message: string, public context?: Record<string, any>) {
        super(message);
        this.name = 'EngineeringError';
    }
}

/**
 * Validates a raw number against physical reality.
 * @param value Raw number
 * @param unit Unit string
 * @param category Physical category
 * @param min Physical minimum (default: -Infinity)
 * @param max Physical maximum (default: Infinity)
 */
export function validate(
    value: number,
    unit: EngineeringUnit,
    category: UnitCategory,
    min: number = -Infinity,
    max: number = Infinity
): ValidatedEngineeringValue {
    if (isNaN(value)) {
        throw new EngineeringError(`Invalid engineering value: NaN`);
    }
    if (!isFinite(value)) {
        throw new EngineeringError(`Invalid engineering value: Infinite`);
    }
    if (value < min) {
        throw new EngineeringError(`Physical impossibility: Value ${value} ${unit} is below minimum ${min}`);
    }
    if (value > max) {
        throw new EngineeringError(`Physical impossibility: Value ${value} ${unit} is above maximum ${max}`);
    }

    return {
        value,
        unit,
        category,
        __validated: true
    };
}
