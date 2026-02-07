/**
 * AluCalc OS — Calculator Schema Type System
 * THE DNA OF EVERY CALCULATOR
 * 
 * This schema is NON-NEGOTIABLE. Every calculator must conform to this interface.
 * Engineers forgive slow. They NEVER forgive wrong.
 */

// ============================================
// Domain Types
// ============================================

export type CalculatorDomain =
    | 'mechanical'
    | 'civil'
    | 'fluid'
    | 'electrical'
    | 'thermal';

// ============================================
// Unit System
// ============================================

export type UnitSystem = 'SI' | 'Imperial';

export interface UnitDefinition {
    symbol: string;           // e.g., "mm", "psi", "N"
    name: string;             // e.g., "millimeter", "pounds per square inch"
    system: UnitSystem;
    dimension: string;        // e.g., "length", "pressure", "force"
    toSI?: number;            // Conversion factor to SI base unit
}

// ============================================
// Input Field Definition
// ============================================

export interface InputField {
    key: string;              // Unique identifier within calculator (e.g., "diameter")
    name: string;             // Display name (e.g., "Bolt Diameter")
    unit: string;             // Unit symbol (e.g., "mm")
    default: number;          // Default value
    min?: number;             // Minimum allowed value (inclusive)
    max?: number;             // Maximum allowed value (inclusive)
    step?: number;            // Input step increment
    description: string;      // Help text for engineers
    required?: boolean;       // Default true

    // Validation
    validation?: {
        pattern?: string;     // Regex for complex validation
        customValidator?: string;  // Reference to validator function name
    };
}

// ============================================
// Output Field Definition
// ============================================

export interface OutputField {
    key: string;              // Unique identifier (e.g., "tensile_stress")
    name: string;             // Display name (e.g., "Tensile Stress")
    unit: string;             // Unit symbol (e.g., "MPa")
    formula: string;          // Math expression referencing input keys
    description: string;      // What this output represents

    // Safety & Trust
    precision?: number;       // Decimal places to display (default 3)
    warningThreshold?: {
        min?: number;
        max?: number;
        message: string;      // Warning shown when threshold exceeded
    };

    // Visualization hook
    affectsGeometry?: boolean; // If true, changes trigger CAD update
}

// ============================================
// Assumptions & References
// ============================================

export interface Assumption {
    id: string;
    text: string;             // Clear statement of assumption
    impact: 'low' | 'medium' | 'high';  // How much this affects results
    source?: string;          // Reference to standard or source
}

export interface Reference {
    standard: string;         // e.g., "ISO 898-1", "DIN 931", "ASTM A325"
    section?: string;         // Specific section reference
    title: string;            // Descriptive title
    url?: string;             // Link to standard (if publicly available)
}

// ============================================
// Media & Educational Content
// ============================================

export interface CalculatorMedia {
    youtubeId?: string;       // YouTube video ID for tutorial
    pdfUrl?: string;          // Link to reference PDF
    diagramUrl?: string;      // Explanatory diagram
}

// ============================================
// MAIN SCHEMA INTERFACE
// ============================================

export interface CalculatorSchema {
    // Identity (immutable)
    id: string;               // Unique, immutable identifier (e.g., "bolt-stress-v1")
    version: string;          // Semantic version (e.g., "1.0.0")

    // Classification
    domain: CalculatorDomain;

    // Metadata
    metadata: {
        title: string;        // Display title
        description: string;  // Brief description
        author?: string;      // Creator/maintainer
        lastUpdated?: string; // ISO date string
        tags?: string[];      // Searchable tags
    };

    // Core Schema
    inputs: InputField[];
    outputs: OutputField[];

    // Trust & Transparency
    assumptions: Assumption[];
    references: Reference[];

    // Visualization
    visualizer?: string;      // Geometry generator function name (e.g., "generateBoltSVG")

    // Educational
    media?: CalculatorMedia;

    // Future: Tier/Feature flags
    tier?: 'free' | 'pro' | 'enterprise';
}

// ============================================
// Validation Types
// ============================================

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    field: string;
    message: string;
    value: unknown;
}

export interface ValidationWarning {
    field: string;
    message: string;
    value: number;
    threshold: 'min' | 'max';
}

// ============================================
// Computation Types
// ============================================

export interface ComputationContext {
    inputs: Record<string, number>;
    constants?: Record<string, number>;
}

export interface ComputationResult {
    success: boolean;
    outputs: Record<string, number>;
    errors?: string[];
    warnings?: string[];
}

// ============================================
// Type Guards
// ============================================

export function isValidSchema(obj: unknown): obj is CalculatorSchema {
    if (!obj || typeof obj !== 'object') return false;
    const schema = obj as CalculatorSchema;

    return (
        typeof schema.id === 'string' &&
        typeof schema.version === 'string' &&
        typeof schema.domain === 'string' &&
        Array.isArray(schema.inputs) &&
        Array.isArray(schema.outputs) &&
        Array.isArray(schema.assumptions) &&
        Array.isArray(schema.references)
    );
}

// ============================================
// Registry Type
// ============================================

export type CalculatorRegistry = Record<string, CalculatorSchema>;
