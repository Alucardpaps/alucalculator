/**
 * 🏛️ ALUCALCULATOR KERNEL - TYPES
 * "The Atomic Engineering Unit"
 */

export enum Unit {
    // Length
    MILLIMETER = 'mm',
    METER = 'm',
    MICRON = 'µm',
    INCH = 'in',

    // Angle
    DEGREE = 'deg',
    RADIAN = 'rad',

    // Force
    NEWTON = 'N',
    KILONEWTON = 'kN',

    // Stress / Pressure
    PASCAL = 'Pa',
    MEGAPASCAL = 'MPa',
    GIGAPASCAL = 'GPa',

    // Mass
    KILOGRAM = 'kg',
    GRAM = 'g',

    // Time
    SECOND = 's',

    // Dimensionless
    UNITLESS = 'unitless',
    PERCENT = '%',
    COUNT = 'count'
}

export type UnitType =
    | 'length'
    | 'angle'
    | 'force'
    | 'pressure'
    | 'mass'
    | 'time'
    | 'dimensionless';

export interface EngineeringValue {
    readonly value: number;
    readonly unit: Unit;
    readonly type: UnitType;
}

export const conversionTable: Record<Unit, number> = {
    // Base: mm
    [Unit.MILLIMETER]: 1,
    [Unit.METER]: 1000,
    [Unit.MICRON]: 0.001,
    [Unit.INCH]: 25.4,

    // Base: rad
    [Unit.RADIAN]: 1,
    [Unit.DEGREE]: Math.PI / 180,

    // Base: N
    [Unit.NEWTON]: 1,
    [Unit.KILONEWTON]: 1000,

    // Base: MPa
    [Unit.MEGAPASCAL]: 1,
    [Unit.PASCAL]: 1e-6,
    [Unit.GIGAPASCAL]: 1000,

    // Base: kg
    [Unit.KILOGRAM]: 1,
    [Unit.GRAM]: 0.001,

    // Base: s
    [Unit.SECOND]: 1,

    // Base: unitless
    [Unit.UNITLESS]: 1,
    [Unit.PERCENT]: 0.01,
    [Unit.COUNT]: 1
};

export const unitTypes: Record<Unit, UnitType> = {
    [Unit.MILLIMETER]: 'length',
    [Unit.METER]: 'length',
    [Unit.MICRON]: 'length',
    [Unit.INCH]: 'length',
    [Unit.DEGREE]: 'angle',
    [Unit.RADIAN]: 'angle',
    [Unit.NEWTON]: 'force',
    [Unit.KILONEWTON]: 'force',
    [Unit.PASCAL]: 'pressure',
    [Unit.MEGAPASCAL]: 'pressure',
    [Unit.GIGAPASCAL]: 'pressure',
    [Unit.KILOGRAM]: 'mass',
    [Unit.GRAM]: 'mass',
    [Unit.SECOND]: 'time',
    [Unit.UNITLESS]: 'dimensionless',
    [Unit.PERCENT]: 'dimensionless',
    [Unit.COUNT]: 'dimensionless'
};

/**
 * Creates an immutable EngineeringValue.
 */
export function createVal(value: number, unit: Unit): EngineeringValue {
    return Object.freeze({
        value,
        unit,
        type: unitTypes[unit]
    });
}

/**
 * Converts a value to a target unit.
 * Throws error if types are incompatible.
 */
export function convert(val: EngineeringValue, targetUnit: Unit): EngineeringValue {
    if (unitTypes[targetUnit] !== val.type) {
        throw new Error(`Unit mismatch: Cannot convert ${val.unit} to ${targetUnit}`);
    }

    const baseValue = val.value * conversionTable[val.unit];
    const targetValue = baseValue / conversionTable[targetUnit];

    return createVal(targetValue, targetUnit);
}

/**
 * Asserts that two values have compatible units (same type).
 */
export function assertUnitMatch(val1: EngineeringValue, val2: EngineeringValue): void {
    if (val1.type !== val2.type) {
        throw new Error(`Unit mismatch: Expected ${val1.type}, got ${val2.type}`);
    }
}
