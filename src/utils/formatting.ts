/**
 * Engineering Output Governance
 * Centralized formatting for all calculator outputs.
 */

export interface FormatOptions {
    decimals?: number;
    sigFigs?: number;
    unit?: string;
    space?: boolean; // Space between value and unit
}

/**
 * Standard Engineering Formatter
 * Rules:
 * 1. If absolute value < 1e-6, show 0.
 * 2. If extremely large/small, use scientific notation.
 * 3. Otherwise, use fixed decimals or significant figures.
 */
export function formatEngineeringValue(value: number, options: FormatOptions = {}): string {
    const {
        decimals = 2,
        sigFigs,
        unit = '',
        space = true
    } = options;

    if (!Number.isFinite(value) || Number.isNaN(value)) return '-';

    let formatted = '';

    if (Math.abs(value) < 1e-9) {
        formatted = '0';
    } else if (sigFigs) {
        formatted = value.toPrecision(sigFigs);
    } else {
        // Default strategy: Smart rounding
        // If value is integer-like, show no decimals?
        // For now, respect explicit decimals.
        formatted = value.toFixed(decimals);
    }

    // Remove trailing zeros if they are decimals? No, engineering precision implies trailing zeros matter.
    // But for UI "cleanliness", sometimes we want to trim.
    // Let's stick to strict formatting for now.

    return `${formatted}${unit ? (space ? ' ' : '') + unit : ''}`;
}

export const formatCurrency = (amount: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};
