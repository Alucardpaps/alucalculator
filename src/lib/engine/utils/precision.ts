import Decimal from "decimal.js";

/**
 * Precision Utility
 * Standardizing high-precision math across the SaaS using decimal.js.
 */

export const D = (value: number | string) => new Decimal(value);

export const toNumber = (d: Decimal) => d.toNumber();
