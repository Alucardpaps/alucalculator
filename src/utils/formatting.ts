/**
 * Engineering Output Governance
 * Centralized formatting for all calculator outputs.
 */

export interface FormatOptions {
    decimals?: number;
    sigFigs?: number;
    unit?: string;
    space?: boolean; // Space between value and unit
    trimTrailingZeros?: boolean;
}

/**
 * Standard Engineering Formatter
 * Rules:
 * 1. If absolute value < 1e-6, show 0.
 * 2. If extremely large/small, use scientific notation.
 * 3. Otherwise, use fixed decimals or significant figures.
 */
import { getGlobalDecimalPrecision, formatEngineeringValue as kitFormat } from '@/components/calculator-kit/precisionUtils';

export function formatEngineeringValue(value: number, options: FormatOptions = {}): string {
    const {
        decimals,
        sigFigs,
        unit = '',
        space = true,
        trimTrailingZeros = false
    } = options;

    if (!Number.isFinite(value) || Number.isNaN(value)) return '-';

    const effectiveDecimals = decimals !== undefined ? decimals : getGlobalDecimalPrecision();

    let formatted = '';

    if (Math.abs(value) < 1e-9) {
        formatted = trimTrailingZeros ? '0' : (0).toFixed(effectiveDecimals);
    } else if (sigFigs) {
        formatted = value.toPrecision(sigFigs);
    } else {
        formatted = kitFormat(value, effectiveDecimals, trimTrailingZeros);
    }

    return `${formatted}${unit ? (space ? ' ' : '') + unit : ''}`;
}

export const formatCurrency = (amount: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};
