import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const thermodynamicsSchema: CalculatorSchemaV2 = {
    id: 'thermodynamics',
    metadata: {
        title: 'Thermodynamics (Gibbs Free Energy)',
        description: 'Calculates Enthalpy, Entropy effects and Reaction Spontaneity.',
        category: 'mechanical', // Temporarily bound to mechanical category type
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-12',
        tags: ['thermodynamics', 'gibbs', 'enthalpy', 'entropy', 'energy', 'spontaneity'],
        verifiedStandards: ['IUPAC Thermodynamic Data']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Spontaneity is determined by standard Gibbs Free Energy change.', impact: 'high' }
        ],
        standards: [
            { code: 'IUPAC', title: 'Standard Thermodynamic States' }
        ],
        formulaLatex: '\\Delta G = \\Delta H - T \\Delta S'
    },
    inputs: [
        { key: 'dH', label: 'Enthalpy Change (ΔH)', unit: 'kJ/mol' as any, defaultValue: -50, description: 'Heat of reaction', validation: { required: true } },
        { key: 'dS', label: 'Entropy Change (ΔS)', unit: 'J/(mol·K)' as any, defaultValue: -100, description: 'Change in disorder', validation: { required: true } },
        { key: 'T', label: 'Temperature (T)', unit: 'K', defaultValue: 298.15, description: 'Absolute Temperature', validation: { required: true, min: 1 } }
    ],
    outputs: [
        { key: 'dG', label: 'Gibbs Free Energy (ΔG)', unit: 'kJ/mol' as any, description: 'Available energy', precision: 3, formulaLatex: '\\Delta G' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const dH = Number(inputs.dH.value); // kJ/mol
        const dS = Number(inputs.dS.value); // J/(K*mol)
        const T = Number(inputs.T.value);   // K

        // Convert dS to kJ/(K*mol) for consistency
        const dG = dH - (T * (dS / 1000));

        let stateMsg = '';
        if (dG < -0.001) stateMsg = 'Spontaneous (Exergonic)';
        else if (dG > 0.001) stateMsg = 'Non-Spontaneous (Endergonic)';
        else stateMsg = 'Equilibrium';

        return {
            outputs: {
                dG: createValidatedValue(dG, 'kJ/mol' as any, 'derived')
            },
            verified: true,
            warnings: [
                { field: 'dG', message: stateMsg, severity: dG < 0 ? 'info' : (dG > 0 ? 'warning' : 'info') }
            ],
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: any, inputs: Record<string, any>) => {
            const dH = Number(inputs.dH?.value || -50);
            const dS = Number(inputs.dS?.value || -100);
            const T = Number(inputs.T?.value || 298.15);
            const dG = result?.outputs?.dG?.value || 0;

            const isExothermic = dH < 0;
            const isSpontaneous = dG < 0;

            const baseColor = isSpontaneous ? '#10b981' : '#ef4444';
            const gradientFrom = isSpontaneous ? '#047857' : '#b91c1c';
            const gradientTo = isSpontaneous ? '#34d399' : '#f87171';

            // Entropy visual modifier
            const entropyParticles = Array.from({ length: 20 }).map((_, i) => {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * (Math.abs(dS) > 100 ? 60 : 20); // More chaos if high dS
                return {
                    x: 100 + Math.cos(angle) * distance,
                    y: 100 + Math.sin(angle) * distance,
                    r: Math.random() * 3 + 1
                };
            });

            return (
                <div className="w-full h-full flex items-center justify-center p-8 bg-[#05080b]">
                    <svg viewBox="0 0 400 200" className="w-full max-w-sm drop-shadow-2xl font-mono">
                        <defs>
                            <linearGradient id="energyGrad" x1="0" y1="1" x2="0" y2="0">
                                <stop offset="0%" stopColor={gradientFrom} />
                                <stop offset="100%" stopColor={gradientTo} />
                            </linearGradient>

                            <linearGradient id="enthalpyGrad" x1="0" y1="1" x2="0" y2="0">
                                <stop offset="0%" stopColor={isExothermic ? '#b91c1c' : '#1d4ed8'} />
                                <stop offset="100%" stopColor={isExothermic ? '#ef4444' : '#60a5fa'} />
                            </linearGradient>
                        </defs>

                        {/* Background Container */}
                        <rect x="10" y="10" width="380" height="180" rx="10" fill="#0f172a" stroke="#334155" strokeWidth="2" />

                        {/* Equation Header */}
                        <text x="200" y="35" textAnchor="middle" fill="#94a3b8" fontSize="14" fontWeight="bold">
                            ΔG = ΔH - TΔS
                        </text>

                        {/* Enthalpy Block */}
                        <g transform="translate(40, 60)">
                            <rect x="0" y="0" width="80" height="80" rx="8" fill="url(#enthalpyGrad)" opacity="0.8" />
                            <text x="40" y="40" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">ΔH</text>
                            <text x="40" y="60" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="10">
                                {dH.toFixed(1)} kJ
                            </text>
                        </g>

                        {/* Minus Sign */}
                        <text x="140" y="105" textAnchor="middle" fill="#64748b" fontSize="24" fontWeight="bold">-</text>

                        {/* Temperature * Entropy Block */}
                        <g transform="translate(160, 60)">
                            <rect x="0" y="0" width="80" height="80" rx="8" fill="#334155" />
                            {entropyParticles.map((p, i) => (
                                <circle key={i} cx={p.x * 0.4} cy={p.y * 0.4} r={p.r} fill="#fbbf24" opacity="0.6" />
                            ))}
                            <text x="40" y="40" textAnchor="middle" fill="#fbbf24" fontSize="16" fontWeight="bold">TΔS</text>
                            <text x="40" y="60" textAnchor="middle" fill="rgba(251,191,36,0.8)" fontSize="10">
                                {((T * dS) / 1000).toFixed(1)} kJ
                            </text>
                        </g>

                        {/* Equals Sign */}
                        <text x="260" y="105" textAnchor="middle" fill="#64748b" fontSize="24" fontWeight="bold">=</text>

                        {/* Gibbs Result Block */}
                        <g transform="translate(280, 60)">
                            <rect x="0" y="0" width="80" height="80" rx="8" fill="url(#energyGrad)" />
                            {/* Inner glow / stroke logic */}
                            <rect x="0" y="0" width="80" height="80" rx="8" fill="none" stroke={baseColor} strokeWidth="2" />

                            <text x="40" y="40" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">ΔG</text>
                            <text x="40" y="60" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="12" fontWeight="bold">
                                {dG.toFixed(1)}
                            </text>
                        </g>

                        {/* Footer Status */}
                        <text x="200" y="170" textAnchor="middle" fill={baseColor} fontSize="14" fontWeight="bold" letterSpacing="1">
                            {isSpontaneous ? 'SPONTANEOUS REACTION' : 'NON-SPONTANEOUS REACTION'}
                        </text>
                    </svg>
                </div>
            );
        }
    },
    tier: 'free'
};

export default thermodynamicsSchema;
