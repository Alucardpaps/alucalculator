/**
 * 🧠 AluCalculator OS - Flow Engine Types
 * 
 * Strict Type System for Engineering Nodes.
 * This file is part of the System Identity Lock.
 */

export type EngineeringPortType =
    // --- GEOMETRY ---
    | 'dxf_file'           // Validated DXF content
    | 'step_file'          // Validated STEP content
    | 'svg_geometry'       // 2D preview data
    | 'three_geometry'     // 3D preview data

    // --- MECHANICAL VALUES ---
    | 'module_mm'          // Gear module
    | 'tooth_count'        // Integer
    | 'pressure_angle_deg' // Angle
    | 'diameter_mm'        // General diameter
    | 'length_mm'          // General length
    | 'torque_nm'          // Torque
    | 'force_n'            // Force
    | 'stress_mpa'         // Stress
    | 'power_kw'           // Power
    | 'rpm'                // Rotational speed
    | 'ratio'              // Unitless ratio

    // --- MATERIAL ---
    | 'material_id'        // ID from material DB
    | 'density_g_cm3'      // Density
    | 'yield_strength_mpa' // Sy

    // --- VALIDATION ---
    | 'validation_report'  // Error/Warning list
    | 'safety_factor'      // Resulting SF

    // --- GENERIC (RESTRICTED) ---
    | 'string'
    | 'number'
    | 'boolean'
    | 'json';              // Only for config, not engineering flow

export interface PortDefinition {
    id: string;
    label: string;
    type: EngineeringPortType;
    required?: boolean;
    defaultValue?: any;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * The Contract. All nodes must implement this.
 */
export interface EngineeringNodeSchema<TInput = any, TOutput = any> {
    id: string;                // Unique ID (e.g., 'mech-gear-spur')
    version: string;           // Semantic Version (e.g., '1.0.0')
    title: string;             // User facing title
    description: string;       // User facing description
    category: 'input' | 'mechanical' | 'validation' | 'export' | 'visualizer' | 'utility';
    deterministic: boolean;       // MUST BE TRUE for pure nodes, FALSE for IO

    // ISO Standard Reference (optional but recommended)
    isoStandard?: string;

    // Port Definitions
    inputs: PortDefinition[];
    outputs: PortDefinition[];

    // Strict Functions
    validate: (input: TInput) => ValidationResult;
    compute: (input: TInput) => TOutput;
}
