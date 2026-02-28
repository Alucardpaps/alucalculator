/**
 * AluCalculator V2 — Calculator Schema Type System
 * GRAND ARCHITECT SCHEMA SYSTEM
 * 
 * This schema is THE DNA of every calculator.
 * Engineers forgive slow. They NEVER forgive wrong.
 * 
 * V2 Changes:
 * - calculationEngine: Function-based calculation (not formula strings)
 * - visualization.render: JSX rendering function
 * - Contextual validation warnings
 * - Full documentation with LaTeX formulas
 */

import type {
    EngineeringUnit,
    ValidatedEngineeringValue,
    CalculationResult,
    ContextualValidationWarning
} from './engineering';

export type {
    EngineeringUnit,
    ValidatedEngineeringValue,
    CalculationResult,
    ContextualValidationWarning
};

// ============================================
// DOMAIN TYPES
// ============================================

export type CalculatorCategory =
    | 'mechanical'
    | 'fabrication'
    | 'materials'
    | 'electrical'
    | 'thermal'
    | 'fluid'
    | 'civil'
    | 'math'
    | 'finance';

// ============================================
// INPUT FIELD DEFINITION
// ============================================

export interface SchemaInputField {
    /** Unique key within calculator (e.g., "module", "toothCount") */
    key: string;

    /** Display label (e.g., "Module (m)") */
    label: string;

    /** Engineering unit */
    unit: EngineeringUnit;

    /** Default value. Set to null if input is REQUIRED without default. */
    defaultValue: number | string | boolean | null;

    /** Validation rules */
    validation: {
        /** Physical minimum */
        min?: number;
        /** Physical maximum */
        max?: number;
        /** Is this input mandatory? */
        required: boolean;
        /** Step increment for UI */
        step?: number;
        /** Contextual warnings (depend on other inputs) */
        warnings?: ContextualValidationWarning[];
    };

    /** Help text for engineers */
    description: string;

    /** Dropdown options (if applicable) */
    options?: Array<{ label: string; value: number | string }>;

    /** UI grouping (for complex calculators) */
    group?: string;

    /** 
     * Conditional visibility. 
     * If provided, field is shown only if function returns true.
     */
    condition?: (inputs: Record<string, ValidatedEngineeringValue>) => boolean;
}

// ============================================
// OUTPUT FIELD DEFINITION
// ============================================

export interface SchemaOutputField {
    /** Unique key (e.g., "pitchDiameter", "bendingStress") */
    key: string;

    /** Display label */
    label: string;

    /** Engineering unit */
    unit: EngineeringUnit;

    /** LaTeX formula for documentation */
    formulaLatex: string;

    /** Plain text description */
    description: string;

    /** Decimal precision */
    precision?: number;

    /** Does this output affect geometry visualization? */
    affectsGeometry?: boolean;

    /** Warning thresholds */
    warningThreshold?: {
        min?: number;
        max?: number;
        message: string;
    };
}

// ============================================
// VISUALIZATION TYPES
// ============================================

export type VisualizationType =
    | 'svg-parametric'  // Dynamic SVG based on inputs
    | 'chart'           // Data chart (line, bar, etc.)
    | '3d-model'        // Three.js model
    | 'generateBoltSVG' // Bolt visualizer
    | 'Bearing3D'       // Bearing visualizer
    | 'none';           // No visualization

export interface VisualizationConfig {
    type: VisualizationType;

    /** 
     * Render function that produces visualization.
     * Receives calculation result and returns JSX.
     */
    render?: (result: CalculationResult, inputs: Record<string, any>) => React.ReactNode;

    /** For SVG: aspect ratio (width/height) */
    aspectRatio?: number;

    /** For 3D: camera settings */
    cameraSettings?: {
        position: [number, number, number];
        fov: number;
    };
}

// ============================================
// DOCUMENTATION & TRUST
// ============================================

export interface CalculatorDocumentation {
    /** Core assumptions made in this calculation */
    assumptions: Array<{
        id: string;
        text: string;
        impact: 'low' | 'medium' | 'high';
        source?: string;
    }>;

    /** Referenced standards */
    standards: Array<{
        code: string;        // e.g., "ISO 6336"
        section?: string;    // e.g., "Section 4.5.3"
        title: string;
    }>;

    /** Main formula in LaTeX (for Trust Panel display) */
    formulaLatex: string;

    /** Additional references (URLs, textbooks) */
    references?: Array<{
        title: string;
        url?: string;
        author?: string;
    }>;
}

// ============================================
// MAIN CALCULATOR SCHEMA (V2)
// ============================================

export interface CalculatorSchemaV2 {
    /** Unique identifier (e.g., "gear-spur", "welding-heat-input") */
    id: string;

    /** Metadata for registry and display */
    metadata: {
        title: string;
        description: string;
        category: CalculatorCategory;
        version: string;
        author: string;
        lastUpdated: string;
        tags?: string[];
        verifiedStandards: string[];  // List of verified standards
    };

    /** Input field definitions */
    inputs: SchemaInputField[];

    /** Output field definitions */
    outputs: SchemaOutputField[];

    /**
     * THE CALCULATION ENGINE
     * 
     * This is a FUNCTION, not a formula string.
     * Receives validated inputs, returns calculation result.
     * 
     * Rules:
     * 1. MUST receive ValidatedEngineeringValue inputs
     * 2. MUST return CalculationResult
     * 3. MUST populate formulaTrace for transparency
     */
    calculationEngine: (
        inputs: Record<string, ValidatedEngineeringValue>
    ) => CalculationResult;

    /** Visualization configuration */
    visualization: VisualizationConfig;

    /** Documentation and trust information */
    documentation: CalculatorDocumentation;

    /** Export engines */
    export?: {
        /** Generate DXF 2D file content */
        dxf?: (result: CalculationResult, inputs: Record<string, any>) => string | Promise<string>;
        /** Generate STEP 3D file content */
        step?: (result: CalculationResult, inputs: Record<string, any>) => string | Promise<string>;
        /** Generate CSV report */
        csv?: (result: CalculationResult, inputs: Record<string, any>) => string | Promise<string>;
    };

    /** Access tier (future feature) */
    tier?: 'free' | 'pro' | 'enterprise';
}

// ============================================
// LEGACY SCHEMA (for backward compatibility)
// ============================================

// Keep the old schema for migration period
export type {
    CalculatorSchema,
    InputField,
    OutputField,
    Assumption,
    Reference,
    CalculatorDomain,
    UnitDefinition,
    UnitSystem,
    ValidationResult,
    ValidationError,
    ValidationWarning,
    ComputationContext,
    ComputationResult,
    CalculatorMedia,
    CalculatorRegistry
} from './calculator-schema-legacy';

// ============================================
// TYPE GUARDS
// ============================================

export function isSchemaV2(schema: unknown): schema is CalculatorSchemaV2 {
    if (!schema || typeof schema !== 'object') return false;
    const s = schema as CalculatorSchemaV2;

    return (
        typeof s.id === 'string' &&
        typeof s.calculationEngine === 'function' &&
        s.metadata?.verifiedStandards !== undefined &&
        Array.isArray(s.inputs) &&
        Array.isArray(s.outputs)
    );
}

// ============================================
// REGISTRY TYPES (V2)
// ============================================

export interface CalculatorRegistryEntryV2 {
    /** Lazy loader for code splitting */
    loader: () => Promise<{ default: CalculatorSchemaV2 }>;

    /** Preloaded metadata (shown before loading full schema) */
    metadata: {
        title: string;
        description: string;
        category: CalculatorCategory;
        icon?: string;
    };
}

export type CalculatorRegistryV2 = Record<string, CalculatorRegistryEntryV2>;
