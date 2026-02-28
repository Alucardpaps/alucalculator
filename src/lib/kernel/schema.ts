/**
 * 🏛️ ALUCALCULATOR KERNEL - SCHEMA
 * "The Legislature"
 */

import { Unit, EngineeringValue } from './types';

export interface FieldSchema {
    key: string;
    label: string;
    unit: Unit;
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
    description?: string;
}

export interface OutputSchema {
    key: string;
    label: string;
    unit: Unit;
    derive?: string; // Formula string for traceability
}

export interface CalculatorSchema {
    readonly id: string;
    readonly version: string; // semver
    readonly category: string;
    readonly inputs: ReadonlyArray<FieldSchema>;
    readonly outputs: ReadonlyArray<OutputSchema>;
    readonly standards: ReadonlyArray<string>;
    readonly assumptions: ReadonlyArray<string>;

    /**
     * Deterministic compute function.
     * Input keys map to numeric values (in the schema-defined unit).
     * Returns output keys mapping to EngineeringValue.
     */
    readonly compute: (inputs: Record<string, number>) => Record<string, EngineeringValue>;
}

/**
 * Freezes the schema to ensure immutability.
 */
export function defineSchema(schema: CalculatorSchema): CalculatorSchema {
    // Deep freeze could be implemented here, for now using shallow freeze on top properties
    // and relying on ReadonlyArray types
    return Object.freeze(schema);
}
