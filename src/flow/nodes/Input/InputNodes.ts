import type { EngineeringNodeSchema, ValidationResult } from '@/flow/types/core';

/**
 * Input nodes — constants, ISO selector.
 * Material selector lives in Mechanical/EngineeringNodes.ts (mech-material).
 */

export const ConstantNode: EngineeringNodeSchema<{ value: number }, { value: number }> = {
    id: 'input-constant',
    version: '1.0.0',
    title: 'Constant Value',
    description: 'Numeric constant. Output type is unitless number — wire through typed engineering nodes, never implicit-cast.',
    category: 'input',
    deterministic: true,
    inputs: [
        { id: 'value', label: 'Value', type: 'number', required: true, defaultValue: 0 },
    ],
    outputs: [
        { id: 'value', label: 'Value', type: 'number' },
    ],
    validate: (input): ValidationResult => ({
        valid: typeof input.value === 'number' && Number.isFinite(input.value),
        errors: typeof input.value === 'number' && Number.isFinite(input.value) ? [] : ['Constant must be a finite number.'],
        warnings: [],
    }),
    compute: (input) => ({ value: input.value }),
};

export const ConstantLengthNode: EngineeringNodeSchema<{ value: number }, { value: number }> = {
    id: 'input-constant-length',
    version: '1.0.0',
    title: 'Constant Length',
    description: 'Length constant in millimetres.',
    category: 'input',
    deterministic: true,
    inputs: [
        { id: 'value', label: 'Length', type: 'length_mm', required: true, defaultValue: 10 },
    ],
    outputs: [
        { id: 'value', label: 'Length', type: 'length_mm' },
    ],
    validate: (input): ValidationResult => ({
        valid: typeof input.value === 'number' && Number.isFinite(input.value),
        errors: typeof input.value === 'number' && Number.isFinite(input.value) ? [] : ['Length must be a finite number.'],
        warnings: input.value < 0 ? ['Negative length.'] : [],
    }),
    compute: (input) => ({ value: input.value }),
};

export const ConstantModuleNode: EngineeringNodeSchema<{ value: number }, { value: number }> = {
    id: 'input-constant-module',
    version: '1.0.0',
    title: 'Constant Module',
    description: 'Gear module constant in millimetres.',
    category: 'input',
    deterministic: true,
    inputs: [
        { id: 'value', label: 'Module', type: 'module_mm', required: true, defaultValue: 2 },
    ],
    outputs: [
        { id: 'value', label: 'Module', type: 'module_mm' },
    ],
    validate: (input): ValidationResult => ({
        valid: typeof input.value === 'number' && input.value > 0,
        errors: input.value > 0 ? [] : ['Module must be positive.'],
        warnings: input.value < 0.1 ? ['Micro-module — special manufacturing.'] : [],
    }),
    compute: (input) => ({ value: input.value }),
};

export const ConstantTorqueNode: EngineeringNodeSchema<{ value: number }, { value: number }> = {
    id: 'input-constant-torque',
    version: '1.0.0',
    title: 'Constant Torque',
    description: 'Torque constant in N·m.',
    category: 'input',
    deterministic: true,
    inputs: [
        { id: 'value', label: 'Torque', type: 'torque_nm', required: true, defaultValue: 50 },
    ],
    outputs: [
        { id: 'value', label: 'Torque', type: 'torque_nm' },
    ],
    validate: (input): ValidationResult => ({
        valid: typeof input.value === 'number' && Number.isFinite(input.value),
        errors: Number.isFinite(input.value) ? [] : ['Torque must be finite.'],
        warnings: [],
    }),
    compute: (input) => ({ value: input.value }),
};

export const IsoSelectorNode: EngineeringNodeSchema<{ standard: string }, { standard: string }> = {
    id: 'input-iso-selector',
    version: '1.0.0',
    title: 'ISO Selector',
    description: 'Selects a locked ISO / DIN standard identifier for downstream validation nodes.',
    category: 'input',
    deterministic: true,
    isoStandard: 'ISO',
    inputs: [
        { id: 'standard', label: 'Standard', type: 'string', required: true, defaultValue: 'ISO 6336' },
    ],
    outputs: [
        { id: 'standard', label: 'Standard', type: 'string' },
    ],
    validate: (input): ValidationResult => {
        const allowed = [
            'ISO 6336',
            'DIN 3960',
            'ISO 281',
            'ISO 286',
            'ISO 898-1',
            'VDI 2230',
            'ISO 5291',
            'ISO 606',
            'DIN 743',
            'ASME VIII Div 1',
            'EN 13445',
            'DIN EN 13906-1',
            'EN 1993-1-1',
            'DIN 4114',
            'EN 1993-1-8',
            'AWS D1.1',
            'ISO 4184',
            'DIN 2215',
            'DIN 8187',
            'ISO 6020',
        ];
        const ok = allowed.includes(input.standard);
        return {
            valid: ok,
            errors: ok ? [] : [`Unknown standard '${input.standard}'. Allowed: ${allowed.join(', ')}`],
            warnings: [],
        };
    },
    compute: (input) => ({ standard: input.standard }),
};

export const ConstantTeethNode: EngineeringNodeSchema<{ value: number }, { value: number }> = {
    id: 'input-constant-teeth',
    version: '1.0.0',
    title: 'Tooth Count (z)',
    description: 'Number of gear teeth or sprocket teeth. Must be integer ≥ 6.',
    category: 'input',
    deterministic: true,
    inputs: [
        { id: 'value', label: 'Teeth (z)', type: 'tooth_count', required: true, defaultValue: 20 },
    ],
    outputs: [
        { id: 'value', label: 'Teeth (z)', type: 'tooth_count' },
    ],
    validate: (input): ValidationResult => ({
        valid: typeof input.value === 'number' && input.value >= 1,
        errors: input.value >= 1 ? [] : ['Tooth count must be ≥ 1.'],
        warnings: input.value < 6 ? ['Undercut risk if z < 6.'] : [],
    }),
    compute: (input) => ({ value: Math.round(input.value) }),
};

export const ConstantAngleNode: EngineeringNodeSchema<{ value: number }, { value: number }> = {
    id: 'input-constant-angle',
    version: '1.0.0',
    title: 'Pressure Angle (α)',
    description: 'Gear pressure angle in degrees (standard is 20°).',
    category: 'input',
    deterministic: true,
    inputs: [
        { id: 'value', label: 'Angle (°)', type: 'pressure_angle_deg', required: true, defaultValue: 20 },
    ],
    outputs: [
        { id: 'value', label: 'Angle (°)', type: 'pressure_angle_deg' },
    ],
    validate: (input): ValidationResult => ({
        valid: typeof input.value === 'number' && input.value > 0 && input.value < 90,
        errors: input.value > 0 && input.value < 90 ? [] : ['Angle must be between 0° and 90°.'],
        warnings: input.value !== 20 && input.value !== 14.5 && input.value !== 25 ? ['Non-standard pressure angle.'] : [],
    }),
    compute: (input) => ({ value: input.value }),
};

export const ConstantForceNode: EngineeringNodeSchema<{ value: number }, { value: number }> = {
    id: 'input-constant-force',
    version: '1.0.0',
    title: 'Applied Force (F)',
    description: 'Mechanical applied force in Newtons (N).',
    category: 'input',
    deterministic: true,
    inputs: [
        { id: 'value', label: 'Force (N)', type: 'force_n', required: true, defaultValue: 1000 },
    ],
    outputs: [
        { id: 'value', label: 'Force (N)', type: 'force_n' },
    ],
    validate: (input): ValidationResult => ({
        valid: typeof input.value === 'number' && Number.isFinite(input.value),
        errors: Number.isFinite(input.value) ? [] : ['Force must be a finite number.'],
        warnings: input.value < 0 ? ['Negative force (tensile vs compressive).'] : [],
    }),
    compute: (input) => ({ value: input.value }),
};

export const ConstantPowerNode: EngineeringNodeSchema<{ value: number }, { value: number }> = {
    id: 'input-constant-power',
    version: '1.0.0',
    title: 'Motor Power (P)',
    description: 'Mechanical or electrical rated power in kilowatts (kW).',
    category: 'input',
    deterministic: true,
    inputs: [
        { id: 'value', label: 'Power (kW)', type: 'power_kw', required: true, defaultValue: 7.5 },
    ],
    outputs: [
        { id: 'value', label: 'Power (kW)', type: 'power_kw' },
    ],
    validate: (input): ValidationResult => ({
        valid: typeof input.value === 'number' && input.value > 0,
        errors: input.value > 0 ? [] : ['Power must be positive.'],
        warnings: [],
    }),
    compute: (input) => ({ value: input.value }),
};

export const ConstantRpmNode: EngineeringNodeSchema<{ value: number }, { value: number }> = {
    id: 'input-constant-rpm',
    version: '1.0.0',
    title: 'Shaft Speed (n)',
    description: 'Rotational shaft speed in revolutions per minute (RPM).',
    category: 'input',
    deterministic: true,
    inputs: [
        { id: 'value', label: 'Speed (RPM)', type: 'rpm', required: true, defaultValue: 1450 },
    ],
    outputs: [
        { id: 'value', label: 'Speed (RPM)', type: 'rpm' },
    ],
    validate: (input): ValidationResult => ({
        valid: typeof input.value === 'number' && input.value > 0,
        errors: input.value > 0 ? [] : ['RPM must be positive.'],
        warnings: input.value > 30000 ? ['High-speed regime (> 30,000 rpm).'] : [],
    }),
    compute: (input) => ({ value: input.value }),
};

export const ConstantRatioNode: EngineeringNodeSchema<{ value: number }, { value: number }> = {
    id: 'input-constant-ratio',
    version: '1.0.0',
    title: 'Ratio / Shift Factor',
    description: 'Dimensionless ratio (e.g. profile shift coefficient x or transmission ratio i).',
    category: 'input',
    deterministic: true,
    inputs: [
        { id: 'value', label: 'Ratio (x / i)', type: 'ratio', required: true, defaultValue: 0 },
    ],
    outputs: [
        { id: 'value', label: 'Ratio (x / i)', type: 'ratio' },
    ],
    validate: (input): ValidationResult => ({
        valid: typeof input.value === 'number' && Number.isFinite(input.value),
        errors: Number.isFinite(input.value) ? [] : ['Ratio must be a finite number.'],
        warnings: [],
    }),
    compute: (input) => ({ value: input.value }),
};

export const ConstantDiameterNode: EngineeringNodeSchema<{ value: number }, { value: number }> = {
    id: 'input-constant-diameter',
    version: '1.0.0',
    title: 'Constant Diameter',
    description: 'Diameter constant in millimetres. Distinct from length_mm — ports do not implicit-cast.',
    category: 'input',
    deterministic: true,
    inputs: [
        { id: 'value', label: 'Diameter (mm)', type: 'diameter_mm', required: true, defaultValue: 30 },
    ],
    outputs: [
        { id: 'value', label: 'Diameter (mm)', type: 'diameter_mm' },
    ],
    validate: (input): ValidationResult => ({
        valid: typeof input.value === 'number' && input.value > 0,
        errors: input.value > 0 ? [] : ['Diameter must be positive.'],
        warnings: [],
    }),
    compute: (input) => ({ value: input.value }),
};

export const ConstantHelixAngleNode: EngineeringNodeSchema<{ value: number }, { value: number }> = {
    id: 'input-constant-helix',
    version: '1.0.0',
    title: 'Helix Angle (β)',
    description: 'Helical gear helix angle in degrees. Distinct from pressure angle α — ports do not implicit-cast.',
    category: 'input',
    deterministic: true,
    isoStandard: 'DIN 3960',
    inputs: [
        { id: 'value', label: 'Helix β (°)', type: 'helix_angle_deg', required: true, defaultValue: 15 },
    ],
    outputs: [
        { id: 'value', label: 'Helix β (°)', type: 'helix_angle_deg' },
    ],
    validate: (input): ValidationResult => ({
        valid: typeof input.value === 'number' && input.value > 0 && input.value < 45,
        errors: input.value > 0 && input.value < 45 ? [] : ['Helix angle β must be between 0° and 45°.'],
        warnings: input.value > 30 ? ['β > 30° produces large axial thrust.'] : [],
    }),
    compute: (input) => ({ value: input.value }),
};

export const ConstantPressureNode: EngineeringNodeSchema<{ value: number }, { value: number }> = {
    id: 'input-constant-pressure',
    version: '1.0.0',
    title: 'Design Pressure (P)',
    description: 'Design pressure in MPa. Distinct from stress_mpa — ports do not implicit-cast.',
    category: 'input',
    deterministic: true,
    isoStandard: 'ASME VIII Div 1',
    inputs: [
        { id: 'value', label: 'Pressure (MPa)', type: 'pressure_mpa', required: true, defaultValue: 1.6 },
    ],
    outputs: [
        { id: 'value', label: 'Pressure (MPa)', type: 'pressure_mpa' },
    ],
    validate: (input): ValidationResult => ({
        valid: typeof input.value === 'number' && input.value > 0,
        errors: input.value > 0 ? [] : ['Design pressure must be positive.'],
        warnings: input.value > 30 ? ['High-pressure regime (> 30 MPa).'] : [],
    }),
    compute: (input) => ({ value: input.value }),
};

