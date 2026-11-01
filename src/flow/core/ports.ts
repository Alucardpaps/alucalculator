/**
 * Strong type port system.
 * Exact match only. Implicit casting is forbidden.
 * Layer: flow/core (no UI).
 */

import type { EngineeringNodeSchema, EngineeringPortType, FlowGraphEdge, FlowGraphNode, PortDefinition } from '../types/core';

export const PORT_UNITS: Record<EngineeringPortType, string> = {
    // Geometry & Files
    dxf_file: 'DXF',
    pdf_file: 'PDF',
    step_file: 'STEP',
    svg_geometry: 'SVG',
    three_geometry: '3D',
    gear_geometry: 'GEAR',
    stress_result: 'STRESS',
    section_profile: 'PROF',
    moment_of_inertia_mm4: 'mm⁴',
    section_modulus_mm3: 'mm³',
    area_mm2: 'mm²',
    perimeter_mm: 'mm',
    radius_of_gyration_mm: 'mm',
    centroid_mm: 'mm',

    // Mechanical & Physics
    module_mm: 'mm',
    tooth_count: 'z',
    pressure_angle_deg: 'deg',
    helix_angle_deg: 'deg',
    diameter_mm: 'mm',
    length_mm: 'mm',
    torque_nm: 'N·m',
    force_n: 'N',
    stress_mpa: 'MPa',
    pressure_mpa: 'MPa',
    power_kw: 'kW',
    rpm: 'rpm',
    ratio: '—',
    life_hours: 'h',
    mass_kg: 'kg',
    velocity_m_s: 'm/s',
    acceleration_m_s2: 'm/s²',
    angular_velocity_rad_s: 'rad/s',
    energy_joules: 'J',
    frequency_hz: 'Hz',
    damping_ratio: 'ζ',
    dynamic_viscosity_pa_s: 'Pa·s',
    heat_transfer_coeff_w_m2k: 'W/(m²·K)',
    thermal_conductivity_w_mk: 'W/(m·K)',
    voltage_v: 'V',
    current_a: 'A',
    resistance_ohm: 'Ω',
    capacitance_f: 'F',
    inductance_h: 'H',

    // Materials & Heat Treatment
    material_id: 'ID',
    density_g_cm3: 'g/cm³',
    yield_strength_mpa: 'MPa',
    material_mpa: 'MPa',
    hardness_hrc: 'HRC',
    hardness_hbw: 'HBW',
    hardness_hv: 'HV',
    elongation_pct: '%',
    temperature_c: '°C',
    temperature_k: 'K',
    effective_case_depth_mm: 'mm',

    // Chemistry
    molar_mass_g_mol: 'g/mol',
    concentration_molar: 'mol/L',
    ph_value: 'pH',
    chemical_formula: 'FORMULA',
    reaction_enthalpy_kj_mol: 'kJ/mol',

    // Validation
    validation_report: 'RPT',
    safety_factor: 'SF',

    // Utility & Math
    vector3: 'vec3',
    matrix3: 'mat3',
    string: 'str',
    number: 'num',
    boolean: 'bool',
    json: 'json',
};

export function describePort(port: PortDefinition): string {
    const unit = PORT_UNITS[port.type] ?? port.type;
    return `${port.label}  ${port.type} [${unit}]`;
}

export function arePortsCompatible(sourceType: EngineeringPortType, targetType: EngineeringPortType): boolean {
    return sourceType === targetType;
}

export function findPort(schema: EngineeringNodeSchema | undefined, portId: string | null | undefined, kind: 'input' | 'output'): PortDefinition | undefined {
    if (!schema || !portId) return undefined;
    const list = kind === 'input' ? schema.inputs : schema.outputs;
    return list.find((p) => p.id === portId);
}

export interface PortMismatch {
    edgeId: string;
    source: string;
    target: string;
    sourceHandle: string;
    targetHandle: string;
    sourceType?: EngineeringPortType;
    targetType?: EngineeringPortType;
    message: string;
}

export function validateGraphPorts(
    nodes: FlowGraphNode[],
    edges: FlowGraphEdge[],
    registry: Map<string, EngineeringNodeSchema>
): { valid: boolean; mismatches: PortMismatch[] } {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const mismatches: PortMismatch[] = [];

    for (const edge of edges) {
        const sourceNode = nodeMap.get(edge.source);
        const targetNode = nodeMap.get(edge.target);
        if (!sourceNode || !targetNode) continue;

        const sourceSchemaId = typeof sourceNode.data?.schemaId === 'string' ? sourceNode.data.schemaId : '';
        const targetSchemaId = typeof targetNode.data?.schemaId === 'string' ? targetNode.data.schemaId : '';
        const sourceSchema = registry.get(sourceSchemaId);
        const targetSchema = registry.get(targetSchemaId);

        if (!sourceSchema || !targetSchema) continue;
        if (!edge.sourceHandle || !edge.targetHandle) {
            mismatches.push({
                edgeId: edge.id,
                source: edge.source,
                target: edge.target,
                sourceHandle: String(edge.sourceHandle ?? ''),
                targetHandle: String(edge.targetHandle ?? ''),
                message: 'Edge is missing sourceHandle or targetHandle.',
            });
            continue;
        }

        const sourcePort = findPort(sourceSchema, edge.sourceHandle, 'output');
        const targetPort = findPort(targetSchema, edge.targetHandle, 'input');

        if (!sourcePort || !targetPort) {
            mismatches.push({
                edgeId: edge.id,
                source: edge.source,
                target: edge.target,
                sourceHandle: edge.sourceHandle,
                targetHandle: edge.targetHandle,
                message: `Unknown port: ${edge.sourceHandle} → ${edge.targetHandle}`,
            });
            continue;
        }

        if (!arePortsCompatible(sourcePort.type, targetPort.type)) {
            mismatches.push({
                edgeId: edge.id,
                source: edge.source,
                target: edge.target,
                sourceHandle: edge.sourceHandle,
                targetHandle: edge.targetHandle,
                sourceType: sourcePort.type,
                targetType: targetPort.type,
                message: `Unit mismatch: ${sourcePort.type} cannot connect to ${targetPort.type}`,
            });
        }
    }

    return { valid: mismatches.length === 0, mismatches };
}
