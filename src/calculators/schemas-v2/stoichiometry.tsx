import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const stoichiometrySchema: CalculatorSchemaV2 = {
    id: 'stoichiometry',
    metadata: {
        title: 'Solution Concentration',
        description: 'Calculates Molarity, Molality, and Mass Percent of a solution.',
        category: 'mechanical', // Temporarily mapped to mechanical
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-12',
        tags: ['stoichiometry', 'molarity', 'molality', 'concentration', 'solution'],
        verifiedStandards: ['Chemical Stoichiometry Principles']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Assumes ideal solution behavior where volumes might be strictly additive.', impact: 'low' }
        ],
        standards: [
            { code: 'CHEM-01', title: 'Basic Stoichiometry' }
        ],
        formulaLatex: 'M = \\frac{n}{V}, \\quad m = \\frac{n}{m_{solvent}}'
    },
    inputs: [
        { key: 'm_solute', label: 'Mass of Solute', unit: 'g', defaultValue: 58.44, description: 'Grams of solute (e.g. NaCl)', validation: { required: true, min: 0 } },
        { key: 'mw_solute', label: 'Molar Mass', unit: 'g/mol' as any, defaultValue: 58.44, description: 'Molecular weight', validation: { required: true, min: 0.1 } },
        { key: 'v_solution', label: 'Volume (Solution)', unit: 'mm3' as any, defaultValue: 1, description: 'Total volume in Liters', validation: { required: true, min: 0.0001 } },
        { key: 'm_solvent', label: 'Mass (Solvent)', unit: 'kg', defaultValue: 1, description: 'Mass of solvent in kg', validation: { required: true, min: 0.0001 } }
    ],
    outputs: [
        { key: 'n_solute', label: 'Moles of Solute', unit: 'mol' as any, description: 'Amount of substance', precision: 4, formulaLatex: 'n' },
        { key: 'molarity', label: 'Molarity (M)', unit: 'mol/L' as any, description: 'Moles per liter of solution', precision: 4, formulaLatex: 'M' },
        { key: 'molality', label: 'Molality (m)', unit: 'mol/kg' as any, description: 'Moles per kg of solvent', precision: 4, formulaLatex: 'm' },
        { key: 'mass_pct', label: 'Mass Percent', unit: '%' as any, description: 'Percentage by mass', precision: 2, formulaLatex: '\\% w/w' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const m_solute = Number(inputs.m_solute.value); // g
        const mw_solute = Number(inputs.mw_solute.value); // g/mol
        const v_solution = Number(inputs.v_solution.value); // L
        const m_solvent = Number(inputs.m_solvent.value); // kg

        const n_solute = m_solute / mw_solute;
        const molarity = n_solute / v_solution;
        const molality = n_solute / m_solvent;
        const m_solvent_g = m_solvent * 1000;
        const mass_pct = (m_solute / (m_solute + m_solvent_g)) * 100;

        return {
            outputs: {
                n_solute: createValidatedValue(n_solute, 'mol' as any, 'derived'),
                molarity: createValidatedValue(molarity, 'mol/L' as any, 'derived'),
                molality: createValidatedValue(molality, 'mol/kg' as any, 'derived'),
                mass_pct: createValidatedValue(mass_pct, '%' as any, 'derived')
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: any, inputs: Record<string, any>) => {
            const molarity = result?.outputs?.molarity?.value || 0;
            const mass_pct = result?.outputs?.mass_pct?.value || 0;

            // Visual concentration (opacity of liquid based on mass %)
            // Cap visual concentration at 50% for display purposes
            const visualConcentration = Math.min(mass_pct / 50, 1);

            // Generate some random dots based on molarity
            const dotCount = Math.min(Math.floor(molarity * 20), 100);

            const dots = Array.from({ length: dotCount }).map((_, i) => ({
                x: 80 + Math.random() * 80, // between 80 and 160 (inside beaker)
                y: 110 + Math.random() * 70, // between 110 and 180 (liquid area)
                r: Math.random() * 2 + 1
            }));

            return (
                <div className="w-full h-full flex items-center justify-center p-8 bg-[#05080b]">
                    <svg viewBox="0 0 400 240" className="w-full max-w-sm drop-shadow-2xl font-mono">

                        {/* Information Panel */}
                        <g transform="translate(200, 40)">
                            <text x="0" y="0" fill="#94a3b8" fontSize="12" fontWeight="bold" letterSpacing="1">CONCENTRATION DATA</text>

                            <text x="0" y="30" fill="#64748b" fontSize="10">Molarity (M)</text>
                            <text x="0" y="45" fill="#38bdf8" fontSize="16" fontWeight="bold">{molarity.toFixed(4)} mol/L</text>

                            <text x="0" y="75" fill="#64748b" fontSize="10">Mass Percent</text>
                            <text x="0" y="90" fill="#a78bfa" fontSize="16" fontWeight="bold">{mass_pct.toFixed(2)} %</text>
                        </g>

                        {/* Beaker / Flask Drawing */}
                        <g transform="translate(20, 20)">
                            {/* Beaker Back Lines */}
                            <path d="M 60 20 L 60 180 A 20 20 0 0 0 80 200 L 160 200 A 20 20 0 0 0 180 180 L 180 20" fill="none" stroke="#1e293b" strokeWidth="4" />

                            {/* Liquid */}
                            <path
                                d="M 62 100 L 178 100 L 178 180 A 18 18 0 0 1 160 198 L 80 198 A 18 18 0 0 1 62 180 Z"
                                fill="#38bdf8"
                                opacity={0.2 + (visualConcentration * 0.6)}
                            />

                            {/* Top surface of liquid */}
                            <ellipse cx="120" cy="100" rx="58" ry="8" fill="#7dd3fc" opacity={0.3 + (visualConcentration * 0.5)} />

                            {/* Solute Particles */}
                            {dots.map((dot, i) => (
                                <circle key={i} cx={dot.x} cy={dot.y} r={dot.r} fill="#f43f5e" opacity="0.8" />
                            ))}

                            {/* Beaker Front Lines (Glass reflection) */}
                            <path d="M 60 20 L 60 180 A 20 20 0 0 0 80 200 L 160 200 A 20 20 0 0 0 180 180 L 180 20" fill="none" stroke="#cbd5e1" strokeWidth="3" opacity="0.5" />
                            <path d="M 50 20 L 190 20" fill="none" stroke="#cbd5e1" strokeWidth="4" opacity="0.7" strokeLinecap="round" />
                            <path d="M 70 40 L 70 160" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.2" strokeLinecap="round" />

                            {/* Measurement Marks */}
                            <line x1="60" y1="50" x2="70" y2="50" stroke="#cbd5e1" strokeWidth="1" opacity="0.5" />
                            <line x1="60" y1="80" x2="75" y2="80" stroke="#cbd5e1" strokeWidth="2" opacity="0.5" />
                            <line x1="60" y1="110" x2="70" y2="110" stroke="#cbd5e1" strokeWidth="1" opacity="0.5" />
                            <line x1="60" y1="140" x2="75" y2="140" stroke="#cbd5e1" strokeWidth="2" opacity="0.5" />
                            <line x1="60" y1="170" x2="70" y2="170" stroke="#cbd5e1" strokeWidth="1" opacity="0.5" />
                        </g>
                    </svg>
                </div>
            );
        }
    },
    tier: 'free'
};

export default stoichiometrySchema;
