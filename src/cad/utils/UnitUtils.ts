/**
 * Unit Conversion Utilities
 * 
 * Internal CAD kernel always uses "units" (treated as mm).
 * This utility converts internal values to display strings based on global unit settings.
 */

import { CadUnit } from '../kernel/types';

export const UNIT_FACTORS: Record<CadUnit, number> = {
    mm: 1,
    m: 0.001,
    in: 0.0393701,  // 1 / 25.4
    ft: 0.00328084  // 1 / 304.8
};

/**
 * Converts internal value (mm) to display unit
 */
export function toDisplay(value: number, unit: CadUnit): number {
    return value * UNIT_FACTORS[unit];
}

/**
 * Converts display value back to internal unit (mm)
 */
export function fromDisplay(value: number, unit: CadUnit): number {
    return value / UNIT_FACTORS[unit];
}

/**
 * Formats a value for UI display
 */
export function formatUnit(value: number, unit: CadUnit, precision: number = 3): string {
    const converted = toDisplay(value, unit);
    return `${converted.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: precision
    })} ${unit}`;
}

/**
 * Formats a coordinate point
 */
export function formatPoint(x: number, y: number, unit: CadUnit): string {
    return `${toDisplay(x, unit).toFixed(2)}, ${toDisplay(y, unit).toFixed(2)} ${unit}`;
}
