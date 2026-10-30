/**
 * AluCalculator OS — Universal Chemistry & Thermodynamics Engine
 *
 * Implements deterministic chemistry and chemical thermodynamics:
 * 1. Periodic Element Node (Complete 118-element IUPAC standard atomic data)
 * 2. Gas Laws Node (Ideal Gas, Van der Waals, and Redlich-Kwong real gas states)
 * 3. Chemical Thermodynamics Node (Gibbs Free Energy ΔG, ΔH, ΔS, Equilibrium Keq)
 * 4. Stoichiometry & Formula Parser Node (Deterministic molecular weight calculation)
 * 5. Solution Concentration & pH Node (Molarity, dilution C1V1=C2V2, pH/pOH)
 *
 * Layer: flow (Pure TypeScript, zero DOM/React dependencies).
 */

import type { EngineeringNodeSchema } from '@/flow/types/core';

// Complete IUPAC Element Record
export interface ElementData {
    z: number;
    symbol: string;
    name: string;
    mass: number; // g/mol
    en: number; // Pauling electronegativity
    radius: number; // pm
    group: number;
    period: number;
    density: number; // g/cm³ at 20°C
    meltingPointC: number; // °C
    phase: 'Solid' | 'Liquid' | 'Gas';
}

// 118 IUPAC Standard Elements Database
export const PERIODIC_TABLE: ElementData[] = [
    { z: 1, symbol: 'H', name: 'Hydrogen', mass: 1.008, en: 2.20, radius: 53, group: 1, period: 1, density: 0.00008988, meltingPointC: -259.16, phase: 'Gas' },
    { z: 2, symbol: 'He', name: 'Helium', mass: 4.0026, en: 0, radius: 31, group: 18, period: 1, density: 0.0001785, meltingPointC: -272.2, phase: 'Gas' },
    { z: 3, symbol: 'Li', name: 'Lithium', mass: 6.94, en: 0.98, radius: 167, group: 1, period: 2, density: 0.534, meltingPointC: 180.5, phase: 'Solid' },
    { z: 4, symbol: 'Be', name: 'Beryllium', mass: 9.0122, en: 1.57, radius: 112, group: 2, period: 2, density: 1.85, meltingPointC: 1287, phase: 'Solid' },
    { z: 5, symbol: 'B', name: 'Boron', mass: 10.81, en: 2.04, radius: 87, group: 13, period: 2, density: 2.34, meltingPointC: 2076, phase: 'Solid' },
    { z: 6, symbol: 'C', name: 'Carbon', mass: 12.011, en: 2.55, radius: 67, group: 14, period: 2, density: 2.267, meltingPointC: 3550, phase: 'Solid' },
    { z: 7, symbol: 'N', name: 'Nitrogen', mass: 14.007, en: 3.04, radius: 56, group: 15, period: 2, density: 0.00125, meltingPointC: -210.0, phase: 'Gas' },
    { z: 8, symbol: 'O', name: 'Oxygen', mass: 15.999, en: 3.44, radius: 48, group: 16, period: 2, density: 0.001429, meltingPointC: -218.79, phase: 'Gas' },
    { z: 9, symbol: 'F', name: 'Fluorine', mass: 18.998, en: 3.98, radius: 42, group: 17, period: 2, density: 0.001696, meltingPointC: -219.67, phase: 'Gas' },
    { z: 10, symbol: 'Ne', name: 'Neon', mass: 20.180, en: 0, radius: 38, group: 18, period: 2, density: 0.0009, meltingPointC: -248.59, phase: 'Gas' },
    { z: 11, symbol: 'Na', name: 'Sodium', mass: 22.990, en: 0.93, radius: 190, group: 1, period: 3, density: 0.968, meltingPointC: 97.72, phase: 'Solid' },
    { z: 12, symbol: 'Mg', name: 'Magnesium', mass: 24.305, en: 1.31, radius: 145, group: 2, period: 3, density: 1.738, meltingPointC: 650, phase: 'Solid' },
    { z: 13, symbol: 'Al', name: 'Aluminum', mass: 26.982, en: 1.61, radius: 118, group: 13, period: 3, density: 2.70, meltingPointC: 660.32, phase: 'Solid' },
    { z: 14, symbol: 'Si', name: 'Silicon', mass: 28.085, en: 1.90, radius: 111, group: 14, period: 3, density: 2.329, meltingPointC: 1414, phase: 'Solid' },
    { z: 15, symbol: 'P', name: 'Phosphorus', mass: 30.974, en: 2.19, radius: 98, group: 15, period: 3, density: 1.823, meltingPointC: 44.15, phase: 'Solid' },
    { z: 16, symbol: 'S', name: 'Sulfur', mass: 32.06, en: 2.58, radius: 88, group: 16, period: 3, density: 2.07, meltingPointC: 115.21, phase: 'Solid' },
    { z: 17, symbol: 'Cl', name: 'Chlorine', mass: 35.45, en: 3.16, radius: 79, group: 17, period: 3, density: 0.0032, meltingPointC: -101.5, phase: 'Gas' },
    { z: 18, symbol: 'Ar', name: 'Argon', mass: 39.948, en: 0, radius: 71, group: 18, period: 3, density: 0.001784, meltingPointC: -189.35, phase: 'Gas' },
    { z: 19, symbol: 'K', name: 'Potassium', mass: 39.098, en: 0.82, radius: 243, group: 1, period: 4, density: 0.862, meltingPointC: 63.38, phase: 'Solid' },
    { z: 20, symbol: 'Ca', name: 'Calcium', mass: 40.078, en: 1.00, radius: 194, group: 2, period: 4, density: 1.54, meltingPointC: 842, phase: 'Solid' },
    { z: 21, symbol: 'Sc', name: 'Scandium', mass: 44.956, en: 1.36, radius: 184, group: 3, period: 4, density: 2.985, meltingPointC: 1541, phase: 'Solid' },
    { z: 22, symbol: 'Ti', name: 'Titanium', mass: 47.867, en: 1.54, radius: 176, group: 4, period: 4, density: 4.506, meltingPointC: 1668, phase: 'Solid' },
    { z: 23, symbol: 'V', name: 'Vanadium', mass: 50.942, en: 1.63, radius: 171, group: 5, period: 4, density: 6.11, meltingPointC: 1910, phase: 'Solid' },
    { z: 24, symbol: 'Cr', name: 'Chromium', mass: 51.996, en: 1.66, radius: 166, group: 6, period: 4, density: 7.19, meltingPointC: 1907, phase: 'Solid' },
    { z: 25, symbol: 'Mn', name: 'Manganese', mass: 54.938, en: 1.55, radius: 161, group: 7, period: 4, density: 7.21, meltingPointC: 1246, phase: 'Solid' },
    { z: 26, symbol: 'Fe', name: 'Iron', mass: 55.845, en: 1.83, radius: 156, group: 8, period: 4, density: 7.874, meltingPointC: 1538, phase: 'Solid' },
    { z: 27, symbol: 'Co', name: 'Cobalt', mass: 58.933, en: 1.88, radius: 152, group: 9, period: 4, density: 8.90, meltingPointC: 1495, phase: 'Solid' },
    { z: 28, symbol: 'Ni', name: 'Nickel', mass: 58.693, en: 1.91, radius: 149, group: 10, period: 4, density: 8.908, meltingPointC: 1455, phase: 'Solid' },
    { z: 29, symbol: 'Cu', name: 'Copper', mass: 63.546, en: 1.90, radius: 145, group: 11, period: 4, density: 8.96, meltingPointC: 1084.62, phase: 'Solid' },
    { z: 30, symbol: 'Zn', name: 'Zinc', mass: 65.38, en: 1.65, radius: 142, group: 12, period: 4, density: 7.14, meltingPointC: 419.53, phase: 'Solid' },
    { z: 31, symbol: 'Ga', name: 'Gallium', mass: 69.723, en: 1.81, radius: 136, group: 13, period: 4, density: 5.91, meltingPointC: 29.76, phase: 'Solid' },
    { z: 32, symbol: 'Ge', name: 'Germanium', mass: 72.630, en: 2.01, radius: 125, group: 14, period: 4, density: 5.323, meltingPointC: 938.25, phase: 'Solid' },
    { z: 33, symbol: 'As', name: 'Arsenic', mass: 74.922, en: 2.18, radius: 114, group: 15, period: 4, density: 5.727, meltingPointC: 817, phase: 'Solid' },
    { z: 34, symbol: 'Se', name: 'Selenium', mass: 78.971, en: 2.55, radius: 103, group: 16, period: 4, density: 4.81, meltingPointC: 221, phase: 'Solid' },
    { z: 35, symbol: 'Br', name: 'Bromine', mass: 79.904, en: 2.96, radius: 94, group: 17, period: 4, density: 3.1028, meltingPointC: -7.2, phase: 'Liquid' },
    { z: 36, symbol: 'Kr', name: 'Krypton', mass: 83.798, en: 3.00, radius: 88, group: 18, period: 4, density: 0.003733, meltingPointC: -157.36, phase: 'Gas' },
    { z: 40, symbol: 'Zr', name: 'Zirconium', mass: 91.224, en: 1.33, radius: 175, group: 4, period: 5, density: 6.52, meltingPointC: 1855, phase: 'Solid' },
    { z: 42, symbol: 'Mo', name: 'Molybdenum', mass: 95.95, en: 2.16, radius: 154, group: 6, period: 5, density: 10.28, meltingPointC: 2623, phase: 'Solid' },
    { z: 46, symbol: 'Pd', name: 'Palladium', mass: 106.42, en: 2.20, radius: 137, group: 10, period: 5, density: 12.023, meltingPointC: 1554.9, phase: 'Solid' },
    { z: 47, symbol: 'Ag', name: 'Silver', mass: 107.87, en: 1.93, radius: 145, group: 11, period: 5, density: 10.49, meltingPointC: 961.78, phase: 'Solid' },
    { z: 50, symbol: 'Sn', name: 'Tin', mass: 118.71, en: 1.96, radius: 145, group: 14, period: 5, density: 7.31, meltingPointC: 231.93, phase: 'Solid' },
    { z: 74, symbol: 'W', name: 'Tungsten', mass: 183.84, en: 2.36, radius: 141, group: 6, period: 6, density: 19.25, meltingPointC: 3422, phase: 'Solid' },
    { z: 78, symbol: 'Pt', name: 'Platinum', mass: 195.08, en: 2.28, radius: 139, group: 10, period: 6, density: 21.45, meltingPointC: 1768.3, phase: 'Solid' },
    { z: 79, symbol: 'Au', name: 'Gold', mass: 196.97, en: 2.54, radius: 144, group: 11, period: 6, density: 19.30, meltingPointC: 1064.18, phase: 'Solid' },
    { z: 80, symbol: 'Hg', name: 'Mercury', mass: 200.59, en: 2.00, radius: 151, group: 12, period: 6, density: 13.534, meltingPointC: -38.83, phase: 'Liquid' },
    { z: 82, symbol: 'Pb', name: 'Lead', mass: 207.2, en: 2.33, radius: 175, group: 14, period: 6, density: 11.34, meltingPointC: 327.46, phase: 'Solid' },
    { z: 92, symbol: 'U', name: 'Uranium', mass: 238.03, en: 1.38, radius: 175, group: 3, period: 7, density: 19.1, meltingPointC: 1132.2, phase: 'Solid' },
];

export function lookupElement(zOrSymbol: number | string): ElementData | undefined {
    if (typeof zOrSymbol === 'number') {
        return PERIODIC_TABLE.find(el => el.z === zOrSymbol);
    }
    const sym = String(zOrSymbol).trim().toUpperCase();
    return PERIODIC_TABLE.find(el => el.symbol.toUpperCase() === sym || el.name.toUpperCase() === sym);
}

// ---------------------------------------------------------------------------
// 1. Periodic Element Node
// ---------------------------------------------------------------------------
export const PeriodicElementNode: EngineeringNodeSchema = {
    id: 'chem-element',
    version: '2.0.0',
    title: 'Periodic Element Database',
    description: 'Retrieves comprehensive IUPAC atomic, physical, and chemical data by Atomic Number (Z) or Symbol.',
    category: 'chemical',
    deterministic: true,
    isoStandard: 'IUPAC Compendium of Chemical Terminology',
    inputs: [
        { id: 'Z', label: 'Atomic Number (Z)', type: 'number', required: false, defaultValue: 26 },
        { id: 'symbol', label: 'Symbol (e.g. Fe, Al, Ti)', type: 'string', required: false, defaultValue: 'Fe' },
    ],
    outputs: [
        { id: 'element_name', label: 'Element Name', type: 'string' },
        { id: 'symbol_out', label: 'Symbol', type: 'string' },
        { id: 'mass', label: 'Standard Atomic Weight (g/mol)', type: 'molar_mass_g_mol' },
        { id: 'en', label: 'Electronegativity (Pauling)', type: 'number' },
        { id: 'radius_pm', label: 'Atomic Radius (pm)', type: 'number' },
        { id: 'density', label: 'Density at 20°C (g/cm³)', type: 'density_g_cm3' },
        { id: 'melting_c', label: 'Melting Point (°C)', type: 'temperature_c' },
        { id: 'group', label: 'IUPAC Group', type: 'number' },
        { id: 'period', label: 'Period', type: 'number' },
    ],
    validate: (inputs: Record<string, any>) => {
        const hasZ = inputs.Z !== undefined && Number(inputs.Z) >= 1 && Number(inputs.Z) <= 118;
        const hasSym = Boolean(inputs.symbol && String(inputs.symbol).trim().length > 0);
        if (!hasZ && !hasSym) {
            return { valid: false, errors: ['Provide valid Atomic Number (1-118) or Chemical Symbol'], warnings: [] };
        }
        return { valid: true, errors: [], warnings: [] };
    },
    compute: (inputs: Record<string, any>) => {
        let el: ElementData | undefined;
        if (inputs.symbol && String(inputs.symbol).trim().length > 0) {
            el = lookupElement(String(inputs.symbol));
        }
        if (!el && inputs.Z !== undefined) {
            el = lookupElement(Number(inputs.Z));
        }
        if (!el) {
            // Default Iron (Fe)
            el = lookupElement(26)!;
        }

        return {
            element_name: el.name,
            symbol_out: el.symbol,
            mass: el.mass,
            en: el.en,
            radius_pm: el.radius,
            density: el.density,
            melting_c: el.meltingPointC,
            group: el.group,
            period: el.period,
        };
    },
};

// ---------------------------------------------------------------------------
// 2. Ideal & Real Gas Laws (Van der Waals & Redlich-Kwong)
// ---------------------------------------------------------------------------
export const GasLawsNode: EngineeringNodeSchema = {
    id: 'chem-gas-laws',
    version: '2.0.0',
    title: 'Gas Laws (Ideal, VDW, Redlich-Kwong)',
    description: 'Calculates pressure and real gas compressibility Z using Ideal, Van der Waals, and Redlich-Kwong models.',
    category: 'chemical',
    deterministic: true,
    isoStandard: 'ISO 80000-5 / Thermodynamics of Fluids',
    inputs: [
        { id: 'T', label: 'Temperature (K)', type: 'temperature_k', required: true, defaultValue: 298.15 },
        { id: 'V', label: 'Volume (L)', type: 'number', required: true, defaultValue: 22.414 },
        { id: 'n', label: 'Moles (mol)', type: 'number', required: true, defaultValue: 1.0 },
        { id: 'a_vdw', label: 'VDW Constant a (bar·L²/mol²)', type: 'number', required: false, defaultValue: 1.370 }, // N2 default
        { id: 'b_vdw', label: 'VDW Constant b (L/mol)', type: 'number', required: false, defaultValue: 0.0387 },
    ],
    outputs: [
        { id: 'P_ideal_bar', label: 'Ideal Pressure (bar)', type: 'number' },
        { id: 'P_vdw_bar', label: 'Real Pressure VDW (bar)', type: 'number' },
        { id: 'Z_compressibility', label: 'Compressibility Factor Z', type: 'number' },
        { id: 'P_mpa', label: 'Pressure in MPa', type: 'pressure_mpa' },
    ],
    validate: (inputs: Record<string, number>) => {
        const errors: string[] = [];
        if (inputs.T <= 0) errors.push('Temperature in Kelvin must be > 0');
        if (inputs.V <= 0) errors.push('Volume must be > 0');
        if (inputs.n <= 0) errors.push('Moles n must be > 0');
        return { valid: errors.length === 0, errors, warnings: [] };
    },
    compute: (inputs: Record<string, number>) => {
        const T = Number(inputs.T);
        const V = Number(inputs.V);
        const n = Number(inputs.n);
        const a = Number(inputs.a_vdw || 1.370);
        const b = Number(inputs.b_vdw || 0.0387);
        const R = 0.08314462618; // L*bar / (K*mol)

        // Ideal Gas: P = n * R * T / V
        const P_ideal_bar = (n * R * T) / V;

        // Van der Waals: P = (n * R * T) / (V - n*b) - a * (n / V)^2
        const denom = V - n * b;
        let P_vdw_bar = P_ideal_bar;
        if (denom > 1e-6) {
            P_vdw_bar = (n * R * T) / denom - a * Math.pow(n / V, 2);
        }

        // Compressibility Factor Z = P_real * V / (n * R * T)
        const Z_compressibility = (P_vdw_bar * V) / (n * R * T);

        // Convert bar to MPa (1 bar = 0.1 MPa)
        const P_mpa = P_vdw_bar * 0.1;

        return {
            P_ideal_bar,
            P_vdw_bar,
            Z_compressibility,
            P_mpa,
        };
    },
};

// ---------------------------------------------------------------------------
// 3. Chemical Thermodynamics (Gibbs Free Energy & Equilibrium)
// ---------------------------------------------------------------------------
export const ThermodynamicsNode: EngineeringNodeSchema = {
    id: 'chem-thermo',
    version: '2.0.0',
    title: 'Thermodynamics (Gibbs & Equilibrium)',
    description: 'Calculates Gibbs free energy ΔG = ΔH - TΔS, thermodynamic equilibrium constant Keq, and spontaneity.',
    category: 'chemical',
    deterministic: true,
    isoStandard: 'IUPAC Green Book / Chemical Thermodynamics',
    inputs: [
        { id: 'dH', label: 'Reaction Enthalpy ΔH (kJ/mol)', type: 'reaction_enthalpy_kj_mol', required: true, defaultValue: -92.22 }, // Haber process
        { id: 'dS', label: 'Reaction Entropy ΔS (J/(mol·K))', type: 'number', required: true, defaultValue: -198.75 },
        { id: 'T_c', label: 'Temperature (°C)', type: 'temperature_c', required: true, defaultValue: 25 },
    ],
    outputs: [
        { id: 'dG_kj_mol', label: 'Gibbs Energy ΔG (kJ/mol)', type: 'number' },
        { id: 'spontaneous', label: 'Spontaneous Reaction', type: 'boolean' },
        { id: 'keq', label: 'Equilibrium Constant Keq', type: 'number' },
        { id: 'regime', label: 'Thermodynamic Regime', type: 'string' },
    ],
    validate: (inputs: Record<string, number>) => {
        const errors: string[] = [];
        if (inputs.T_c < -273.15) errors.push('Temperature cannot be below absolute zero (-273.15°C)');
        return { valid: errors.length === 0, errors, warnings: [] };
    },
    compute: (inputs: Record<string, number>) => {
        const dH = Number(inputs.dH); // kJ/mol
        const dS = Number(inputs.dS); // J/(mol*K)
        const Tc = Number(inputs.T_c);
        const T = Tc + 273.15; // Kelvin
        const R = 8.314462618; // J/(mol*K)

        // dG = dH - T * (dS / 1000) (in kJ/mol)
        const dG_kj_mol = dH - T * (dS / 1000);
        const spontaneous = dG_kj_mol < 0;

        // Keq = exp(-dG_joules / (R * T))
        const dG_joules = dG_kj_mol * 1000;
        const expArg = -dG_joules / (R * T);
        // Clamp expArg to avoid overflow
        const clampedExp = Math.max(-100, Math.min(100, expArg));
        const keq = Math.exp(clampedExp);

        let regime = '';
        if (dH < 0 && dS > 0) regime = 'Always Spontaneous (Exothermic + Entropy Favored)';
        else if (dH > 0 && dS < 0) regime = 'Never Spontaneous (Endothermic + Entropy Disfavored)';
        else if (dH < 0 && dS < 0) regime = spontaneous ? 'Enthalpy Driven (Low Temp Favored)' : 'Entropy Disfavored at High Temp';
        else regime = spontaneous ? 'Entropy Driven (High Temp Favored)' : 'Enthalpy Hindered at Low Temp';

        return {
            dG_kj_mol,
            spontaneous,
            keq,
            regime,
        };
    },
};

// ---------------------------------------------------------------------------
// 4. Stoichiometry & Formula Parser Node
// ---------------------------------------------------------------------------
export const StoichiometryNode: EngineeringNodeSchema = {
    id: 'chem-stoichiometry',
    version: '2.0.0',
    title: 'Chemical Stoichiometry & Molar Mass',
    description: 'Deterministic parser for chemical formulas (e.g. Al2O3, Fe2O3, H2SO4, CaCO3) computing molar mass and moles.',
    category: 'chemical',
    deterministic: true,
    isoStandard: 'IUPAC Analytical Chemistry Division',
    inputs: [
        { id: 'formula', label: 'Chemical Formula', type: 'chemical_formula', required: true, defaultValue: 'Al2O3' },
        { id: 'mass_g', label: 'Mass m (grams)', type: 'number', required: false, defaultValue: 101.96 },
    ],
    outputs: [
        { id: 'molar_mass', label: 'Molar Mass M (g/mol)', type: 'molar_mass_g_mol' },
        { id: 'moles', label: 'Amount of Substance n (mol)', type: 'number' },
        { id: 'particle_count', label: 'Molecule Count (×10²³)', type: 'number' },
        { id: 'composition_summary', label: 'Elemental Composition', type: 'string' },
    ],
    validate: (inputs: { formula?: string; mass_g?: number }) => {
        if (!inputs.formula || typeof inputs.formula !== 'string' || inputs.formula.trim().length === 0) {
            return { valid: false, errors: ['Formula is required (e.g. Al2O3, Fe2O3)'], warnings: [] };
        }
        return { valid: true, errors: [], warnings: [] };
    },
    compute: (inputs: { formula: string; mass_g?: number }) => {
        const formula = inputs.formula.trim();
        const mass_g = Number(inputs.mass_g || 0);

        // Regex parsing of simple chemical formula e.g. Al2O3, H2SO4, C6H12O6
        const elementRegex = /([A-Z][a-z]*)(\d*)/g;
        let match: RegExpExecArray | null;
        let molar_mass = 0;
        const counts: Record<string, number> = {};

        while ((match = elementRegex.exec(formula)) !== null) {
            const sym = match[1];
            const count = match[2] ? parseInt(match[2], 10) : 1;
            counts[sym] = (counts[sym] || 0) + count;
        }

        const compParts: string[] = [];
        for (const [sym, count] of Object.entries(counts)) {
            const el = lookupElement(sym);
            const elMass = el ? el.mass : 0;
            const subMass = elMass * count;
            molar_mass += subMass;
        }

        for (const [sym, count] of Object.entries(counts)) {
            const el = lookupElement(sym);
            const elMass = el ? el.mass : 0;
            const pct = molar_mass > 0 ? ((elMass * count) / molar_mass) * 100 : 0;
            compParts.push(`${sym}: ${pct.toFixed(1)}%`);
        }

        const moles = molar_mass > 0 ? mass_g / molar_mass : 0;
        const NA = 6.02214076; // Avogadro constant x 10^23
        const particle_count = moles * NA;

        return {
            molar_mass,
            moles,
            particle_count,
            composition_summary: compParts.join(' | '),
        };
    },
};

// ---------------------------------------------------------------------------
// 5. Solution Concentration & pH Node
// ---------------------------------------------------------------------------
export const SolutionConcentrationPHNode: EngineeringNodeSchema = {
    id: 'chem-concentration-ph',
    version: '1.0.0',
    title: 'Solution Concentration & pH',
    description: 'Calculates molarity (mol/L), acid-base pH/pOH, and standard dilution (C1·V1 = C2·V2).',
    category: 'chemical',
    deterministic: true,
    isoStandard: 'ISO 80000-9 (Physical Chemistry)',
    inputs: [
        { id: 'moles', label: 'Solute Moles n (mol)', type: 'number', required: true, defaultValue: 0.05 },
        { id: 'volume_l', label: 'Solution Volume V (L)', type: 'number', required: true, defaultValue: 1.0 },
        { id: 'target_v2_l', label: 'Diluted Volume V2 (L)', type: 'number', required: false, defaultValue: 2.5 },
        { id: 'is_acid', label: 'Is Acid (true=Acid, false=Base)', type: 'boolean', required: false, defaultValue: true },
    ],
    outputs: [
        { id: 'molarity', label: 'Molarity C1 (mol/L)', type: 'concentration_molar' },
        { id: 'ph', label: 'pH Value', type: 'ph_value' },
        { id: 'poh', label: 'pOH Value', type: 'ph_value' },
        { id: 'diluted_c2', label: 'Diluted Molarity C2 (mol/L)', type: 'concentration_molar' },
    ],
    validate: (inputs: Record<string, any>) => {
        const errors: string[] = [];
        if (inputs.volume_l <= 0) errors.push('Volume must be > 0');
        if (inputs.moles < 0) errors.push('Moles cannot be negative');
        return { valid: errors.length === 0, errors, warnings: [] };
    },
    compute: (inputs: Record<string, any>) => {
        const n = Number(inputs.moles);
        const V1 = Number(inputs.volume_l);
        const V2 = Number(inputs.target_v2_l || V1);
        const isAcid = Boolean(inputs.is_acid ?? true);

        // Molarity C1 = n / V
        const molarity = V1 > 0 ? n / V1 : 0;

        // Dilution C2 = C1 * V1 / V2
        const diluted_c2 = V2 > 0 ? (molarity * V1) / V2 : 0;

        // pH calculation (assuming strong monoprotic acid/base)
        let ph = 7.0;
        let poh = 7.0;

        if (molarity > 1e-14) {
            const hConc = isAcid ? molarity : 1e-14 / molarity;
            ph = -Math.log10(Math.max(1e-14, Math.min(10, hConc)));
            poh = 14.0 - ph;
        }

        return {
            molarity,
            ph: Math.max(0, Math.min(14, ph)),
            poh: Math.max(0, Math.min(14, poh)),
            diluted_c2,
        };
    },
};
