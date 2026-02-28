import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue, type CalculationResult } from '@/types/engineering';

export const torsionShaftSchema: CalculatorSchemaV2 = {
    id: 'torsion-shaft',
    metadata: {
        title: 'Torsion of Shafts',
        description: 'Calculate shear stress and angle of twist for circular shafts.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-12',
        tags: ['torsion', 'shaft', 'shear', 'twist', 'mechanics'],
        verifiedStandards: ['Mechanics of Materials']
    },
    inputs: [
        {
            key: 'torque',
            label: 'Torque (T)',
            description: 'Applied torque',
            unit: 'Nm',
            defaultValue: 100,
            validation: { required: true, step: 10 }
        },
        {
            key: 'diameter',
            label: 'Shaft Diameter (d)',
            description: 'Outer diameter',
            unit: 'mm',
            defaultValue: 20,
            validation: { required: true, min: 1, step: 1 }
        },
        {
            key: 'length',
            label: 'Length (L)',
            description: 'Shaft length',
            unit: 'mm',
            defaultValue: 500,
            validation: { required: true, min: 1, step: 10 }
        },
        {
            key: 'modulusG',
            label: 'Shear Modulus (G)',
            description: 'Material property',
            unit: 'GPa',
            defaultValue: 79, // Steel
            validation: { required: true, min: 1, step: 1 }
        }
    ],
    outputs: [
        {
            key: 'shearStress',
            label: 'Max Shear Stress (τmax)',
            unit: 'MPa',
            description: 'Maximum shear stress on outer surface',
            formulaLatex: '\\tau_{max} = \\frac{16 T}{\\pi d^3}'
        },
        {
            key: 'angleTwist',
            label: 'Angle of Twist (φ)',
            unit: 'deg',
            description: 'Total angle of twist over length L',
            formulaLatex: '\\phi = \\frac{T L}{J G}'
        },
        {
            key: 'polarInertia',
            label: 'Polar Moment (J)',
            unit: 'mm4',
            description: 'Polar moment of inertia',
            formulaLatex: 'J = \\frac{\\pi d^4}{32}'
        }
    ],
    calculationEngine: (inputs) => {
        const T_Nm = inputs.torque.value as number;
        const d = inputs.diameter.value as number;
        const L = inputs.length.value as number;
        const G_GPa = inputs.modulusG.value as number;

        const T = T_Nm * 1000; // Nmm
        const G = G_GPa * 1000; // MPa

        // Polar Moment J = (pi * d^4) / 32
        const J = (Math.PI * Math.pow(d, 4)) / 32;

        // Shear Stress tau = (T * r) / J = (T * (d/2)) / J
        // Simplified: (16 * T) / (pi * d^3)
        const tau = (16 * T) / (Math.PI * Math.pow(d, 3));

        // Angle of twist phi (rad) = (T * L) / (J * G)
        const phi_rad = (T * L) / (J * G);
        const phi_deg = (phi_rad * 180) / Math.PI;

        return {
            outputs: {
                shearStress: createValidatedValue(tau, 'MPa', 'derived'),
                angleTwist: createValidatedValue(phi_deg, 'deg', 'derived'),
                polarInertia: createValidatedValue(J, 'mm4', 'derived')
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result, inputs) => {
            const phi = result.outputs?.angleTwist?.value as number || 0;
            // Draw shaft with twist lines
            return (
                <svg viewBox="0 0 300 150">
                    {/* Shaft Body */}
                    <rect x="50" y="50" width="200" height="50" fill="url(#grad1)" stroke="#555" />

                    {/* Measurement Lines */}
                    <line x1="50" y1="50" x2="250" y2="50" stroke="#00e5ff" strokeDasharray="4,4" />

                    {/* Twisted Line */}
                    {/* Start at top-left, go to... top-right displaced by phi scaled? */}
                    {/* Actually twist is rotation. */}
                    {/* Let's draw a spiral line to visualize torsion */}
                    <path d="M50,75 Q150,25 250,75" stroke="#00e5ff" fill="none" opacity="0.5" />

                    {/* Torque Arrows */}
                    <path d="M40,60 A10,10 0 1,0 40,90" stroke="#ef4444" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                    <path d="M260,90 A10,10 0 1,0 260,60" stroke="#ef4444" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />

                    <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#333', stopOpacity: 1 }} />
                            <stop offset="50%" style={{ stopColor: '#666', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#333', stopOpacity: 1 }} />
                        </linearGradient>
                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"> <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" /> </marker>
                    </defs>
                    <text x="150" y="120" fill="#00e5ff" textAnchor="middle"> Twist: {phi.toFixed(2)}°</text>
                </svg>
            );
        }
    },
    documentation: {
        assumptions: [
            {
                id: 'linear-elastic',
                text: 'Material behaves in a linear elastic manner (Hooke\'s Law applies).',
                impact: 'high',
                source: 'Mechanics of Materials'
            },
            {
                id: 'uniform-section',
                text: 'Shaft has a uniform circular cross-section.',
                impact: 'high'
            }
        ],
        standards: [],
        formulaLatex: '\\tau_{max} = \\frac{16 T}{\\pi d^3}, \\quad \\phi = \\frac{T L}{J G}'
    }
};
