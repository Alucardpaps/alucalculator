/**
 * AluCalculator V2 — Core Engineering Types
 * GRAND ARCHITECT TYPE SYSTEM
 * 
 * "No raw number passes through this system unchallenged."
 * 
 * This module defines the absolute foundation:
 * - EngineeringUnit: Strict unit taxonomy
 * - ValidatedEngineeringValue: The ONLY acceptable value container
 * - CalculationResult: Output wrapper with verification state
 */

// ============================================
// ENGINEERING UNIT TAXONOMY
// ============================================

/**
 * Strict union of all allowed engineering units.
 * Extending this list requires engineering review.
 */
export type EngineeringUnit =
    // Length
    | 'mm' | 'm' | 'inch' | 'ft'
    // Area/Volume/Section
    | 'mm2' | 'm2' | 'cm2' | 'mm3' | 'cm3' | 'mm4' | 'cm4'
    // Mass/Force
    | 'kg' | 'g' | 'N' | 'kN' | 'lbf'
    // Pressure/Stress
    | 'MPa' | 'GPa' | 'Pa' | 'bar' | 'psi'
    // Torque/Energy
    | 'Nm' | 'kNm' | 'J' | 'kJ'
    // Power
    | 'W' | 'kW' | 'HP'
    // Angle
    | 'deg' | 'rad'
    // Velocity
    | 'm/s' | 'mm/s' | 'rpm'
    // Temperature
    | '°C' | '°F' | 'K'
    // Electrical
    | 'V' | 'A' | 'Ω' | 'kWh'
    // Current/Heat
    | 'A' | 'kJ/mm'
    // Dimensionless
    | '-' | '%' | 'ratio'
    // Time/Life
    | 'Mrev' | 'hours' | 'min' | 's'
    // Finance
    | 'TRY' | 'USD' | 'EUR' | 'Currency' | '/10';

export type UnitCategory =
    | 'length'
    | 'mass'
    | 'force'
    | 'torque'
    | 'pressure'
    | 'power'
    | 'velocity'
    | 'temperature'
    | 'angle'
    | 'electrical'
    | 'energy'
    | 'dimensionless';

// ============================================
// VALIDATED ENGINEERING VALUE (THE LAW)
// ============================================

/**
 * THE ABSOLUTE LAW:
 * No calculation function is allowed to accept a raw `number`.
 * It must work with `ValidatedEngineeringValue` exclusively.
 * 
 * This ensures:
 * 1. All values are unit-tagged
 * 2. Source is traceable (user input vs derived vs assumed)
 * 3. Assumptions cannot hide in the shadows
 */
export interface ValidatedEngineeringValue {
    /** The numeric or categorical value */
    value: number | string | boolean;

    /** Engineering unit (strictly typed) */
    unit: EngineeringUnit;

    /** Origin of this value */
    source: 'user' | 'derived' | 'assumed';

    /** Has this value passed validation? */
    verified: boolean;

    /** If source is 'assumed', this MUST be populated */
    assumptionNote?: string;

    /** Reference standard defining limits (e.g., "DIN 3960") */
    standardRef?: string;

    /** Number of significant figures to display */
    precision?: number;

    /** 
     * Internal validation seal. 
     * Do NOT forge this manually.
     */
    readonly __validated: true;
}

// ============================================
// VALIDATION WARNING SYSTEM
// ============================================

/**
 * Contextual validation warning.
 * Unlike simple min/max limits, these can consider
 * the full calculation context.
 */
export interface ContextualValidationWarning {
    /** 
     * Condition function that receives:
     * - value: The input value being validated
     * - context: All other input values in the calculation
     */
    condition: (value: number, context: Record<string, number>) => boolean;

    /** Warning message to display */
    message: string;

    /** Severity level affects UI treatment */
    severity: 'info' | 'warning' | 'critical';

    /** Reference standard (e.g., "DIN 3960", "ISO 6336") */
    standardRef?: string;
}

// ============================================
// CALCULATION RESULT
// ============================================

/**
 * Output of any calculation engine.
 * Every result carries its verification state.
 */
export interface CalculationResult {
    /** All output values, keyed by output ID */
    outputs: Record<string, ValidatedEngineeringValue>;

    /** 
     * Overall verification status.
     * If ANY input was invalid or assumed without disclosure,
     * this is false.
     */
    verified: boolean;

    /** Accumulated warnings from validation */
    warnings: Array<{
        field: string;
        message: string;
        severity: 'info' | 'warning' | 'critical';
    }>;

    /** Calculation timestamp (UTC) */
    timestamp: number;

    /** Formula trace for transparency (LaTeX strings) */
    formulaTrace?: Record<string, string>;
}

// ============================================
// VALIDATION ENGINE
// ============================================

export class EngineeringValidationError extends Error {
    constructor(
        message: string,
        public field: string,
        public value: unknown,
        public context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'EngineeringValidationError';
    }
}

/**
 * Creates a validated engineering value from raw input.
 * This is the ONLY sanctioned way to create a ValidatedEngineeringValue.
 */
export function createValidatedValue(
    value: number | string | boolean,
    unit: EngineeringUnit,
    source: 'user' | 'derived' | 'assumed',
    options?: {
        min?: number;
        max?: number;
        assumptionNote?: string;
        standardRef?: string;
        precision?: number;
    }
): ValidatedEngineeringValue {
    // Numeric validation logic
    if (typeof value === 'number') {
        // NaN check
        if (isNaN(value)) {
            throw new EngineeringValidationError(
                'Invalid engineering value: NaN',
                'value',
                value
            );
        }

        // Infinity check
        if (!isFinite(value)) {
            throw new EngineeringValidationError(
                'Invalid engineering value: Infinite',
                'value',
                value
            );
        }

        // Range validation
        if (options?.min !== undefined && value < options.min) {
            throw new EngineeringValidationError(
                `Value ${value} ${unit} is below minimum ${options.min}`,
                'value',
                value,
                { min: options.min }
            );
        }

        if (options?.max !== undefined && value > options.max) {
            throw new EngineeringValidationError(
                `Value ${value} ${unit} exceeds maximum ${options.max}`,
                'value',
                value,
                { max: options.max }
            );
        }
    }

    // Assumption disclosure enforcement
    if (source === 'assumed' && !options?.assumptionNote) {
        throw new EngineeringValidationError(
            'Assumed values MUST have an assumptionNote',
            'source',
            source
        );
    }

    return {
        value,
        unit,
        source,
        verified: true,
        assumptionNote: options?.assumptionNote,
        standardRef: options?.standardRef,
        precision: options?.precision ?? 3,
        __validated: true,
    };
}

/**
 * Creates an unverified value (for display purposes when validation fails).
 * This value carries a WARNING badge in the UI.
 */
export function createUnverifiedValue(
    value: number,
    unit: EngineeringUnit,
    reason: string
): ValidatedEngineeringValue {
    return {
        value,
        unit,
        source: 'derived',
        verified: false,
        assumptionNote: `UNVERIFIED: ${reason}`,
        precision: 3,
        __validated: true,
    };
}

// ============================================
// UNIT CONVERSION REGISTRY
// ============================================

const UNIT_CONVERSIONS: Record<string, { toSI: number; siUnit: EngineeringUnit }> = {
    // Length (base: m)
    'mm': { toSI: 0.001, siUnit: 'm' },
    'm': { toSI: 1, siUnit: 'm' },
    'inch': { toSI: 0.0254, siUnit: 'm' },
    'ft': { toSI: 0.3048, siUnit: 'm' },

    // Force (base: N)
    'N': { toSI: 1, siUnit: 'N' },
    'kN': { toSI: 1000, siUnit: 'N' },
    'lbf': { toSI: 4.44822, siUnit: 'N' },

    // Pressure (base: Pa)
    'Pa': { toSI: 1, siUnit: 'Pa' },
    'MPa': { toSI: 1e6, siUnit: 'Pa' },
    'GPa': { toSI: 1e9, siUnit: 'Pa' },
    'bar': { toSI: 1e5, siUnit: 'Pa' },
    'psi': { toSI: 6894.76, siUnit: 'Pa' },

    // Angle (base: rad)
    'deg': { toSI: Math.PI / 180, siUnit: 'rad' },
    'rad': { toSI: 1, siUnit: 'rad' },
};

/**
 * Convert value to SI base unit.
 */
export function toSI(val: ValidatedEngineeringValue): ValidatedEngineeringValue {
    const conv = UNIT_CONVERSIONS[val.unit];
    if (!conv) return val; // Already SI or no conversion defined

    if (typeof val.value !== 'number') return val;

    return createValidatedValue(
        (val.value as number) * conv.toSI,
        conv.siUnit,
        'derived',
        { precision: val.precision }
    );
}

