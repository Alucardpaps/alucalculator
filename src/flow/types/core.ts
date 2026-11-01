/**
 * AluCalculator OS — Flow Engine Types
 *
 * Strict type system for engineering nodes.
 * Layer: flow (no React, no DOM, no UI store).
 */

export type EngineeringPortType =
    // --- GEOMETRY / FILES ---
    | 'dxf_file'
    | 'pdf_file'
    | 'step_file'
    | 'svg_geometry'
    | 'three_geometry'
    | 'gear_geometry'
    | 'stress_result'
    | 'section_profile'
    | 'moment_of_inertia_mm4'
    | 'section_modulus_mm3'
    | 'area_mm2'
    | 'perimeter_mm'
    | 'radius_of_gyration_mm'
    | 'centroid_mm'

    // --- MECHANICAL & PHYSICS VALUES ---
    | 'module_mm'
    | 'tooth_count'
    | 'pressure_angle_deg'
    | 'helix_angle_deg'
    | 'diameter_mm'
    | 'length_mm'
    | 'torque_nm'
    | 'force_n'
    | 'stress_mpa'
    | 'pressure_mpa'
    | 'power_kw'
    | 'rpm'
    | 'ratio'
    | 'life_hours'
    | 'mass_kg'
    | 'velocity_m_s'
    | 'acceleration_m_s2'
    | 'angular_velocity_rad_s'
    | 'energy_joules'
    | 'frequency_hz'
    | 'damping_ratio'
    | 'dynamic_viscosity_pa_s'
    | 'heat_transfer_coeff_w_m2k'
    | 'thermal_conductivity_w_mk'
    | 'voltage_v'
    | 'current_a'
    | 'resistance_ohm'
    | 'capacitance_f'
    | 'inductance_h'

    // --- MATERIAL & HEAT TREATMENT ---
    | 'material_id'
    | 'density_g_cm3'
    | 'yield_strength_mpa'
    | 'material_mpa'
    | 'hardness_hrc'
    | 'hardness_hbw'
    | 'hardness_hv'
    | 'elongation_pct'
    | 'temperature_c'
    | 'temperature_k'
    | 'effective_case_depth_mm'

    // --- CHEMISTRY ---
    | 'molar_mass_g_mol'
    | 'concentration_molar'
    | 'ph_value'
    | 'chemical_formula'
    | 'reaction_enthalpy_kj_mol'

    // --- VALIDATION ---
    | 'validation_report'
    | 'safety_factor'

    // --- UTILITY / MATH / VECTORS ---
    | 'vector3'
    | 'matrix3'
    | 'string'
    | 'number'
    | 'boolean'
    | 'json';

export type NodeCategory =
    | 'input'
    | 'mechanical'
    | 'geometry'
    | 'physics'
    | 'chemical'
    | 'material'
    | 'validation'
    | 'export'
    | 'visualizer'
    | 'utility';

export type NodeRunStatus = 'idle' | 'computed' | 'cached' | 'error' | 'blocked' | 'skipped';

export interface PortDefinition {
    id: string;
    label: string;
    type: EngineeringPortType;
    required?: boolean;
    defaultValue?: unknown;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export interface NodeMetadata {
    version: string;
    deterministic: true | false;
    isoStandard?: string;
}

/**
 * The Contract. All nodes must implement this.
 */
export interface EngineeringNodeSchema<TInput = any, TOutput = any> {
    id: string;
    version: string;
    title: string;
    description: string;
    category: NodeCategory;
    deterministic: boolean;
    isoStandard?: string;
    heavy?: boolean;

    inputs: PortDefinition[];
    outputs: PortDefinition[];

    validate: (input: TInput) => ValidationResult;
    compute: (input: TInput) => TOutput;
}

/** Graph primitives — independent of React Flow. */
export interface FlowGraphNode<T = any> {
    id: string;
    type?: string;
    data?: T;
}

export interface FlowGraphEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
}

export const NODE_DATA_META_KEYS = new Set([
    'schemaId',
    'type',
    'outputs',
    'executionStatus',
    'executionErrors',
    'executionWarnings',
    'executionTimeMs',
    'nodeVersion',
    'collapsed',
    'cached',
    'title',
]);
