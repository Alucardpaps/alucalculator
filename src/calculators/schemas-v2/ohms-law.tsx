
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

// Ohm's Law Solver
// Solves for any 2 unknowns given 2 inputs (V, I, R, P)
// But schema inputs are usually fixed or we need a mode switch.
// V2 Schema inputs are static structure. 
// To allow solving for any, we usually provide 2 inputs and calculate others.
// Or we have a "Calculation Mode" dropdown. 
// Let's use Mode: 1=Find V, 2=Find I, 3=Find R, 4=Find P?
// No, simpler: Inputs for V, I, R. User fills 2, we find 3rd?
// "Zero Fluff": Simple standard mode: Input V and R (or I), output others.
// Let's provide a "Solve For" dropdown.

const ohmsLawSchema: CalculatorSchemaV2 = {
    id: 'ohms-law',
    metadata: {
        title: 'Ohm\'s Law & Power',
        description: 'Calculate relationships between Voltage, Current, Resistance, and Power.',
        category: 'electrical',
        version: '2.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-10',
        tags: ['electrical', 'ohms-law', 'power', 'circuit'],
        verifiedStandards: ['Ohm\'s Law'],
    },

    inputs: [
        {
            key: 'mode',
            label: 'Solve For',
            unit: '-',
            defaultValue: 1, // 1=V & P (from I, R), 2=I & P (from V, R), 3=R & P (from V, I)
            description: 'Select which values to calculate.',
            options: [
                { label: 'Voltage (V) & Power', value: 1 },
                { label: 'Current (I) & Power', value: 2 },
                { label: 'Resistance (R) & Power', value: 3 }
            ],
            validation: { required: true }
        },
        // We show/hide inputs based on mode could be nice, but schema usually static.
        // We'll trust user to ignore irrelevant ones or use the mode logic to pick correct inputs.
        // Actually, V2 schema `inputs` are fixed list.
        // Let's include V, I, R and use `condition` (future feature) valid here:
        // Actually, let's just use 2 main inputs: Value 1 and Value 2, with dynamic labels?
        // No, keep it explicit.
        {
            key: 'voltage',
            label: 'Voltage (V)',
            unit: 'V',
            defaultValue: 12, // DC
            description: 'Electrical potential difference.',
            validation: { required: false, min: 0 } // Not always required
        },
        {
            key: 'current',
            label: 'Current (I)',
            unit: 'A',
            defaultValue: 1,
            description: 'Flow of electric charge.',
            validation: { required: false, min: 0 }
        },
        {
            key: 'resistance',
            label: 'Resistance (R)',
            unit: 'Ω',
            defaultValue: 12,
            description: 'Opposition to current flow.',
            validation: { required: false, min: 0 }
        }
    ],

    outputs: [
        {
            key: 'calculatedVoltage',
            label: 'Voltage (V)',
            unit: 'V',
            formulaLatex: 'V = I \\cdot R',
            description: 'Calculated Voltage.',
            precision: 2
        },
        {
            key: 'calculatedCurrent',
            label: 'Current (I)',
            unit: 'A',
            formulaLatex: 'I = \\frac{V}{R}',
            description: 'Calculated Current.',
            precision: 3
        },
        {
            key: 'calculatedResistance',
            label: 'Resistance (R)',
            unit: 'Ω',
            formulaLatex: 'R = \\frac{V}{I}',
            description: 'Calculated Resistance.',
            precision: 2
        },
        {
            key: 'power',
            label: 'Power (P)',
            unit: 'W',
            formulaLatex: 'P = V \\cdot I',
            description: 'Power dissipation.',
            precision: 2
        }
    ],

    calculationEngine: (inputs) => {
        const mode = inputs.mode.value as number;

        let V = inputs.voltage.value as number;
        let I = inputs.current.value as number;
        let R = inputs.resistance.value as number;
        let P = 0;

        // Reset outputs based on mode
        if (mode === 1) { // Find V (Given I, R)
            V = I * R;
        } else if (mode === 2) { // Find I (Given V, R)
            // Guard Div/0
            if (R > 0) I = V / R;
            else I = 0;
        } else if (mode === 3) { // Find R (Given V, I)
            if (I > 0) R = V / I;
            else R = 0;
        }

        P = V * I;

        return {
            outputs: {
                calculatedVoltage: createValidatedValue(V, 'V', mode === 1 ? 'derived' : 'user'),
                calculatedCurrent: createValidatedValue(I, 'A', mode === 2 ? 'derived' : 'user'),
                calculatedResistance: createValidatedValue(R, 'Ω', mode === 3 ? 'derived' : 'user'),
                power: createValidatedValue(P, 'W', 'derived')
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },

    visualization: {
        type: 'svg-parametric',
        render: (result, inputs) => {
            // Simple Circuit Diagram
            // Simple Circuit Diagram
            return (
                <svg viewBox="0 0 200 150" style={{ width: '100%', height: '100%' }}>
                    {/* Battery */}
                    <g transform="translate(20, 50)">
                        <line x1="0" y1="0" x2="0" y2="20" stroke="#00e5ff" strokeWidth="2" />
                        <line x1="10" y1="5" x2="10" y2="15" stroke="#00e5ff" strokeWidth="2" />
                        <line x1="0" y1="10" x2="-20" y2="10" stroke="#00e5ff" strokeWidth="2" /> {/* Wire Left */}
                        <line x1="10" y1="10" x2="30" y2="10" stroke="#00e5ff" strokeWidth="2" /> {/* Wire Right */}
                        <text x="-5" y="35" fill="#00e5ff" fontSize="10">V</text>
                    </g>

                    {/* Resistor */}
                    <g transform="translate(100, 50)">
                        <polyline points="0,10 5,5 15,15 25,5 35,15 40,10" fill="none" stroke="#f59e0b" strokeWidth="2" />
                        <line x1="-30" y1="10" x2="0" y2="10" stroke="#00e5ff" strokeWidth="2" />
                        <line x1="40" y1="10" x2="80" y2="10" stroke="#00e5ff" strokeWidth="2" />
                        <text x="20" y="30" fill="#f59e0b" fontSize="10" textAnchor="middle">R</text>
                    </g>

                    {/* Loop */}
                    <line x1="0" y1="60" x2="0" y2="120" stroke="#00e5ff" strokeWidth="2" transform="translate(20,0)" />
                    <line x1="0" y1="60" x2="0" y2="120" stroke="#00e5ff" strokeWidth="2" transform="translate(180,0)" />
                    <line x1="20" y1="120" x2="180" y2="120" stroke="#00e5ff" strokeWidth="2" />

                    {/* Current Arrow */}
                    <path d="M 60 120 l 10 -3 l 0 6 z" fill="#fff" />
                    <text x="50" y="115" fill="#fff" fontSize="10">I</text>
                </svg>
            );
        }
    },

    documentation: {
        assumptions: [],
        standards: [],
        formulaLatex: 'V = I \\cdot R'
    },

    tier: 'free'
};

export default ohmsLawSchema;
