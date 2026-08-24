import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

// Minimal Database for Core Elements
interface ElementData {
    Z: number;
    symbol: string;
    name: string;
    mass: number;
    en: number; // Electronegativity
    radius: number; // Atomic radius in pm
    group: number;
    period: number;
    type: 'Alkali' | 'Alkaline Earth' | 'Transition Metal' | 'Post-Transition' | 'Metalloid' | 'Nonmetal' | 'Halogen' | 'Noble Gas' | 'Unknown';
}

const ELEMENTS: Record<number, ElementData> = {
    1: { Z: 1, symbol: 'H', name: 'Hydrogen', mass: 1.008, en: 2.20, radius: 53, group: 1, period: 1, type: 'Nonmetal' },
    2: { Z: 2, symbol: 'He', name: 'Helium', mass: 4.0026, en: 0, radius: 31, group: 18, period: 1, type: 'Noble Gas' },
    3: { Z: 3, symbol: 'Li', name: 'Lithium', mass: 6.94, en: 0.98, radius: 167, group: 1, period: 2, type: 'Alkali' },
    4: { Z: 4, symbol: 'Be', name: 'Beryllium', mass: 9.0122, en: 1.57, radius: 112, group: 2, period: 2, type: 'Alkaline Earth' },
    5: { Z: 5, symbol: 'B', name: 'Boron', mass: 10.81, en: 2.04, radius: 87, group: 13, period: 2, type: 'Metalloid' },
    6: { Z: 6, symbol: 'C', name: 'Carbon', mass: 12.011, en: 2.55, radius: 67, group: 14, period: 2, type: 'Nonmetal' },
    7: { Z: 7, symbol: 'N', name: 'Nitrogen', mass: 14.007, en: 3.04, radius: 56, group: 15, period: 2, type: 'Nonmetal' },
    8: { Z: 8, symbol: 'O', name: 'Oxygen', mass: 15.999, en: 3.44, radius: 48, group: 16, period: 2, type: 'Nonmetal' },
    9: { Z: 9, symbol: 'F', name: 'Fluorine', mass: 18.998, en: 3.98, radius: 42, group: 17, period: 2, type: 'Halogen' },
    10: { Z: 10, symbol: 'Ne', name: 'Neon', mass: 20.180, en: 0, radius: 38, group: 18, period: 2, type: 'Noble Gas' },
    11: { Z: 11, symbol: 'Na', name: 'Sodium', mass: 22.990, en: 0.93, radius: 190, group: 1, period: 3, type: 'Alkali' },
    12: { Z: 12, symbol: 'Mg', name: 'Magnesium', mass: 24.305, en: 1.31, radius: 145, group: 2, period: 3, type: 'Alkaline Earth' },
    13: { Z: 13, symbol: 'Al', name: 'Aluminum', mass: 26.982, en: 1.61, radius: 118, group: 13, period: 3, type: 'Post-Transition' },
    14: { Z: 14, symbol: 'Si', name: 'Silicon', mass: 28.085, en: 1.90, radius: 111, group: 14, period: 3, type: 'Metalloid' },
    15: { Z: 15, symbol: 'P', name: 'Phosphorus', mass: 30.974, en: 2.19, radius: 98, group: 15, period: 3, type: 'Nonmetal' },
    16: { Z: 16, symbol: 'S', name: 'Sulfur', mass: 32.06, en: 2.58, radius: 88, group: 16, period: 3, type: 'Nonmetal' },
    17: { Z: 17, symbol: 'Cl', name: 'Chlorine', mass: 35.45, en: 3.16, radius: 79, group: 17, period: 3, type: 'Halogen' },
    18: { Z: 18, symbol: 'Ar', name: 'Argon', mass: 39.95, en: 0, radius: 71, group: 18, period: 3, type: 'Noble Gas' },
    19: { Z: 19, symbol: 'K', name: 'Potassium', mass: 39.098, en: 0.82, radius: 243, group: 1, period: 4, type: 'Alkali' },
    20: { Z: 20, symbol: 'Ca', name: 'Calcium', mass: 40.078, en: 1.00, radius: 194, group: 2, period: 4, type: 'Alkaline Earth' },
    26: { Z: 26, symbol: 'Fe', name: 'Iron', mass: 55.845, en: 1.83, radius: 156, group: 8, period: 4, type: 'Transition Metal' },
    29: { Z: 29, symbol: 'Cu', name: 'Copper', mass: 63.546, en: 1.90, radius: 145, group: 11, period: 4, type: 'Transition Metal' },
    30: { Z: 30, symbol: 'Zn', name: 'Zinc', mass: 65.38, en: 1.65, radius: 142, group: 12, period: 4, type: 'Transition Metal' },
    47: { Z: 47, symbol: 'Ag', name: 'Silver', mass: 107.87, en: 1.93, radius: 165, group: 11, period: 5, type: 'Transition Metal' },
    79: { Z: 79, symbol: 'Au', name: 'Gold', mass: 196.97, en: 2.54, radius: 166, group: 11, period: 6, type: 'Transition Metal' },
    82: { Z: 82, symbol: 'Pb', name: 'Lead', mass: 207.2, en: 2.33, radius: 154, group: 14, period: 6, type: 'Post-Transition' },
};

export const periodicElementSchema: CalculatorSchemaV2 = {
    id: 'chemistry-element',
    metadata: {
        title: 'Element Properties',
        description: 'Interactive lookup for periodic element properties (Mass, Electronegativity, Radius).',
        category: 'mechanical', // Temporarily mapped to mechanical until types are updated
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-12',
        tags: ['chemistry', 'periodic', 'element', 'molar-mass', 'atom'],
        verifiedStandards: ['IUPAC standard atomic weights']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Standard atomic weights apply to typical terrestrial abundance.', impact: 'medium' }
        ],
        standards: [
            { code: 'IUPAC', title: 'Periodic Table of the Elements' }
        ],
        formulaLatex: 'N/A'
    },
    inputs: [
        { key: 'Z', label: 'Atomic Number (Z)', unit: '-', defaultValue: 6, description: 'Enter Atomic Number (1-82 currently supported subsets)', validation: { required: true, min: 1, max: 118 } }
    ],
    outputs: [
        { key: 'mass', label: 'Molar Mass', unit: 'g/mol' as any, description: 'Standard atomic weight', precision: 3, formulaLatex: 'M_w' },
        { key: 'en', label: 'Electronegativity', unit: 'Pauling' as any, description: 'Pauling scale', precision: 2, formulaLatex: '\\chi' },
        { key: 'rad', label: 'Atomic Radius', unit: 'pm' as any, description: 'Empirical atomic radius', precision: 0, formulaLatex: 'r' },
        { key: 'group', label: 'Group', unit: '-', description: 'Periodic Table Group', precision: 0, formulaLatex: 'G' },
        { key: 'period', label: 'Period', unit: '-', description: 'Periodic Table Period', precision: 0, formulaLatex: 'P' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const Z = Math.round(Number(inputs.Z.value));

        const el = ELEMENTS[Z];
        const warnings: { field: string; message: string; severity: "info" | "warning" | "critical" }[] = [];

        if (!el) {
            warnings.push({ field: 'Z', message: `Element Z=${Z} is not in the embedded database yet. Showing placeholders.`, severity: 'warning' });
            return {
                outputs: {
                    mass: createValidatedValue(0, 'g/mol' as any, 'derived'),
                    en: createValidatedValue(0, 'Pauling' as any, 'derived'),
                    rad: createValidatedValue(0, 'pm' as any, 'derived'),
                    group: createValidatedValue(0, '-', 'derived'),
                    period: createValidatedValue(0, '-', 'derived')
                },
                verified: false,
                warnings,
                timestamp: Date.now()
            };
        }

        return {
            outputs: {
                mass: createValidatedValue(el.mass, 'g/mol' as any, 'derived'),
                en: createValidatedValue(el.en, 'Pauling' as any, 'derived'),
                rad: createValidatedValue(el.radius, 'pm' as any, 'derived'),
                group: createValidatedValue(el.group, '-', 'derived'),
                period: createValidatedValue(el.period, '-', 'derived')
            },
            verified: true,
            warnings,
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: any, inputs: Record<string, any>) => {
            const Z = Math.round(Number(inputs.Z?.value || 6));
            const el = ELEMENTS[Z] || { symbol: '?', name: 'Unknown', mass: 0, type: 'Unknown' };

            let bgColor = '#1e293b'; // default slate
            let accentColor = '#94a3b8'; // default

            switch (el.type) {
                case 'Alkali': bgColor = '#7f1d1d'; accentColor = '#fca5a5'; break;
                case 'Alkaline Earth': bgColor = '#7c2d12'; accentColor = '#fdba74'; break;
                case 'Transition Metal': bgColor = '#451a03'; accentColor = '#fcd34d'; break;
                case 'Post-Transition': bgColor = '#064e3b'; accentColor = '#6ee7b7'; break;
                case 'Metalloid': bgColor = '#14532d'; accentColor = '#86efac'; break;
                case 'Nonmetal': bgColor = '#082f49'; accentColor = '#7dd3fc'; break;
                case 'Halogen': bgColor = '#1e3a8a'; accentColor = '#93c5fd'; break;
                case 'Noble Gas': bgColor = '#4c1d95'; accentColor = '#c4b5fd'; break;
                default: break;
            }

            return (
                <div className="w-full h-full flex items-center justify-center p-8 bg-[#05080b]">
                    <div
                        className="relative w-48 h-56 rounded border-2 shadow-2xl flex flex-col items-center justify-between p-4"
                        style={{ backgroundColor: bgColor, borderColor: accentColor }}
                    >
                        {/* Atomic Number */}
                        <div className="self-start text-lg font-bold" style={{ color: accentColor }}>{Z}</div>

                        {/* Symbol */}
                        <div className="text-7xl font-bold text-white tracking-widest">{el.symbol}</div>

                        {/* Details */}
                        <div className="flex flex-col items-center gap-1">
                            <div className="text-sm font-medium text-white/90">{el.name}</div>
                            <div className="text-xs font-mono" style={{ color: accentColor }}>{el.mass.toFixed(3)}</div>
                        </div>

                        {/* Top-right classification */}
                        <div className="absolute top-2 right-2 text-[8px] uppercase font-bold tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {el.type}
                        </div>
                    </div>
                </div>
            );
        }
    },
    tier: 'free'
};

export default periodicElementSchema;
