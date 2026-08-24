import { EngineeringNodeSchema } from '../../types/core';

/**
 * 🧪 Chemistry - Periodic Element Node
 */
export const PeriodicElementNode: EngineeringNodeSchema = {
    id: 'chem-element',
    version: '1.0.0',
    title: 'Periodic Element',
    description: 'Retrieves element properties.',
    category: 'mechanical', // Temporarily bound to mechanical
    deterministic: true,
    inputs: [
        { id: 'Z', label: 'Atomic Number (Z)', type: 'number', required: true, defaultValue: 6 }
    ],
    outputs: [
        { id: 'mass', label: 'Molar Mass (g/mol)', type: 'number' },
        { id: 'en', label: 'Electronegativity', type: 'number' },
        { id: 'rad', label: 'Atomic Radius (pm)', type: 'length_mm' }, // Using length_mm loosely for outputting distance
        { id: 'group', label: 'Group', type: 'number' },
        { id: 'period', label: 'Period', type: 'number' }
    ],
    validate: (inputs: any) => ({ valid: inputs.Z >= 1 && inputs.Z <= 118, errors: [], warnings: [] }),
    compute: (inputs: any) => {
        const Z = inputs.Z;

        // Lightweight database fallback for the node logic
        const elements: Record<number, any> = {
            1: { mass: 1.008, en: 2.20, rad: 53, group: 1, period: 1 },
            2: { mass: 4.0026, en: 0, rad: 31, group: 18, period: 1 },
            6: { mass: 12.011, en: 2.55, rad: 67, group: 14, period: 2 },
            8: { mass: 15.999, en: 3.44, rad: 48, group: 16, period: 2 },
            26: { mass: 55.845, en: 1.83, rad: 156, group: 8, period: 4 }
        };

        const el = elements[Z] || { mass: 0, en: 0, rad: 0, group: 0, period: 0 };

        return {
            mass: el.mass,
            en: el.en,
            rad: el.rad,
            group: el.group,
            period: el.period
        };
    }
};

/**
 * 🌡 Thermodynamics - Ideal & Real Gas Laws Node
 */
export const GasLawsNode: EngineeringNodeSchema = {
    id: 'chem-gas-laws',
    version: '1.0.0',
    title: 'Gas Laws (Van der Waals)',
    description: 'Calculates pressure via Ideal and Real gas laws.',
    category: 'mechanical', // Temporarily mapped to mechanical
    deterministic: true,
    inputs: [
        { id: 'T', label: 'Temperature (K)', type: 'number', required: true, defaultValue: 298.15 },
        { id: 'V', label: 'Volume (L)', type: 'number', required: true, defaultValue: 10 },
        { id: 'n', label: 'Moles (mol)', type: 'number', required: true, defaultValue: 1 },
        { id: 'a', label: 'VDW Constant a', type: 'number', required: true, defaultValue: 1.370 }, // Default N2
        { id: 'b', label: 'VDW Constant b', type: 'number', required: true, defaultValue: 0.0387 }
    ],
    outputs: [
        { id: 'P_ideal', label: 'Ideal Pressure (bar)', type: 'number' },
        { id: 'P_real', label: 'Real Pressure (bar)', type: 'number' },
        { id: 'Z', label: 'Compressibility (Z)', type: 'number' }
    ],
    validate: (inputs: any) => ({ valid: inputs.T > 0 && inputs.V > 0 && inputs.n > 0, errors: [], warnings: [] }),
    compute: (inputs: any) => {
        const { T, V, n, a, b } = inputs;
        const R = 0.083144626; // L*bar/(K*mol)

        const P_ideal = (n * R * T) / V;
        const P_real = ((n * R * T) / (V - n * b)) - (a * Math.pow(n / V, 2));
        const Z = (P_real * V) / (n * R * T);

        return { P_ideal, P_real, Z };
    }
};

/**
 * ⚡ Thermodynamics - Gibbs Free Energy Node
 */
export const ThermodynamicsNode: EngineeringNodeSchema = {
    id: 'chem-thermo',
    version: '1.0.0',
    title: 'Thermodynamics (Gibbs)',
    description: 'Calculates Gibbs Free Energy and spontaneity.',
    category: 'mechanical', // Temporarily mapped to mechanical
    deterministic: true,
    inputs: [
        { id: 'dH', label: 'Enthalpy (ΔH) kJ/mol', type: 'number', required: true, defaultValue: -50 },
        { id: 'dS', label: 'Entropy (ΔS) J/(mol*K)', type: 'number', required: true, defaultValue: -100 },
        { id: 'T', label: 'Temperature (K)', type: 'number', required: true, defaultValue: 298.15 }
    ],
    outputs: [
        { id: 'dG', label: 'Gibbs (ΔG) kJ/mol', type: 'number' },
        { id: 'spontaneous', label: 'Is Spontaneous?', type: 'boolean' } // Simple boolean output mapping
    ],
    validate: (inputs: any) => ({ valid: inputs.T > 0, errors: [], warnings: [] }),
    compute: (inputs: any) => {
        const { dH, dS, T } = inputs;
        const dG = dH - (T * (dS / 1000));
        const spontaneous = dG < 0;

        return { dG, spontaneous };
    }
};

/**
 * ⚗️ Chemistry - Stoichiometry & Solution Node
 */
export const StoichiometryNode: EngineeringNodeSchema = {
    id: 'chem-stoich',
    version: '1.0.0',
    title: 'Solution Concentration',
    description: 'Calculates Molarity, Molality, and Mass Percent.',
    category: 'mechanical', // Temporarily mapped to mechanical
    deterministic: true,
    inputs: [
        { id: 'm_solute', label: 'Mass Solute (g)', type: 'number', required: true, defaultValue: 58.44 },
        { id: 'mw_solute', label: 'Molar Mass (g/mol)', type: 'number', required: true, defaultValue: 58.44 },
        { id: 'v_solution', label: 'Vol Solution (L)', type: 'number', required: true, defaultValue: 1 },
        { id: 'm_solvent', label: 'Mass Solvent (kg)', type: 'number', required: true, defaultValue: 1 }
    ],
    outputs: [
        { id: 'n_solute', label: 'Moles (n)', type: 'number' },
        { id: 'molarity', label: 'Molarity (M)', type: 'number' },
        { id: 'molality', label: 'Molality (m)', type: 'number' },
        { id: 'mass_pct', label: 'Mass Percent (%)', type: 'number' }
    ],
    validate: (inputs: any) => ({ valid: inputs.v_solution > 0 && inputs.m_solvent > 0, errors: [], warnings: [] }),
    compute: (inputs: any) => {
        const { m_solute, mw_solute, v_solution, m_solvent } = inputs;

        const n_solute = m_solute / mw_solute;
        const molarity = n_solute / v_solution;
        const molality = n_solute / m_solvent;
        const mass_pct = (m_solute / (m_solute + (m_solvent * 1000))) * 100;

        return { n_solute, molarity, molality, mass_pct };
    }
};
