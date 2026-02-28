
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

const voltageDropSchema: CalculatorSchemaV2 = {
    id: 'voltage-drop',
    metadata: {
        title: 'Voltage Drop Calculator',
        description: 'Calculate voltage drop, percent drop, and wire size requirements.',
        category: 'electrical',
        version: '2.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-10',
        tags: ['voltage limit', 'awg', 'cable', 'nec'],
        verifiedStandards: ['NEC 2020', 'IEC 60364'],
    },

    inputs: [
        {
            key: 'voltage',
            label: 'System Voltage',
            unit: 'V',
            defaultValue: 12,
            description: 'Source voltage.',
            validation: { required: true, min: 0 }
        },
        {
            key: 'phase',
            label: 'Phase',
            unit: '-',
            defaultValue: 1, // 1=DC, 2=1-Phase AC, 3=3-Phase AC
            description: '1: DC, 2: Single Phase, 3: Three Phase',
            options: [
                { label: 'DC', value: 1 },
                { label: 'Single Phase AC', value: 2 },
                { label: 'Three Phase AC', value: 3 }
            ],
            validation: { required: true }
        },
        {
            key: 'current',
            label: 'Load Current',
            unit: 'A',
            defaultValue: 10,
            description: 'Current drawn by the load.',
            validation: { required: true, min: 0 }
        },
        {
            key: 'distance',
            label: 'One-Way Length',
            unit: 'm', // Default to meters. We can add 'ft' logic if needed, but keeping SI.
            defaultValue: 10,
            description: 'Distance from source to load.',
            validation: { required: true, min: 0 }
        },
        {
            key: 'material',
            label: 'Conductor Material',
            unit: '-',
            defaultValue: 1, // 1=Copper, 2=Aluminum
            description: 'Wire material (Cu or Al).',
            options: [
                { label: 'Copper (rho=1.68e-8)', value: 1 },
                { label: 'Aluminum (rho=2.82e-8)', value: 2 }
            ],
            validation: { required: true }
        },
        {
            key: 'size',
            label: 'Wire Size (Area)',
            unit: 'mm2', // Allow selecting from standard list preferably
            defaultValue: 2.5,
            description: 'Cross-sectional area.',
            validation: { required: true, min: 0.1 }
        }
    ],

    outputs: [
        {
            key: 'voltageDrop',
            label: 'Voltage Drop',
            unit: 'V',
            formulaLatex: 'V_d = \\frac{K \\cdot I \\cdot L}{A}',
            description: 'Total voltage loss in the circuit.',
            precision: 2
        },
        {
            key: 'percentDrop',
            label: 'Percentage Drop',
            unit: '%',
            formulaLatex: '\\% = \\frac{V_d}{V_{source}} \\times 100',
            description: 'Loss relative to source voltage.',
            precision: 2
        },
        {
            key: 'voltageAtLoad',
            label: 'Voltage at Load',
            unit: 'V',
            formulaLatex: 'V_{load} = V_{source} - V_d',
            description: 'Remaining voltage at the equipment.',
            precision: 2
        }
    ],

    calculationEngine: (inputs) => {
        const V = inputs.voltage.value as number;
        const phase = inputs.phase.value as number;
        const I = inputs.current.value as number;
        const L = inputs.distance.value as number;
        const mat = inputs.material.value as number;
        const A_mm2 = inputs.size.value as number;

        let rho = 0.01724; // Copper ohm.mm2/m (approx)
        if (mat === 2) rho = 0.028; // Aluminum

        let factor = 2; // DC or 1-phase (2 wires: out and back)
        if (phase === 3) factor = Math.sqrt(3); // 3-phase

        // Vd = factor * rho * L * I / A
        const Vd = (factor * rho * L * I) / A_mm2;

        const pct = (Vd / V) * 100;
        const V_load = V - Vd;

        return {
            outputs: {
                voltageDrop: createValidatedValue(Vd, 'V', 'derived'),
                percentDrop: createValidatedValue(pct, '%', 'derived'),
                voltageAtLoad: createValidatedValue(V_load, 'V', 'derived')
            },
            verified: true,
            warnings: [
                ...(pct > 3 ? [{ field: 'percentDrop', message: 'Voltage drop exceeds 3% (NEC recommendation)', severity: 'warning' as const }] : [])
            ],
            timestamp: Date.now()
        };
    },

    visualization: {
        type: 'svg-parametric',
        render: (result, inputs) => {
            const Vd = result?.outputs?.voltageDrop?.value as number || 0;
            const V = inputs.voltage || 12;

            // Draw Wire
            return (
                <svg viewBox="0 0 300 100" style={{ width: '100%', height: '100%' }}>
                    <line x1="20" y1="50" x2="280" y2="50" stroke={Vd / V > 0.05 ? "#ef4444" : "#22c55e"} strokeWidth="4" />
                    <circle cx="20" cy="50" r="5" fill="#fff" />
                    <circle cx="280" cy="50" r="5" fill="#fff" />

                    <text x="20" y="30" fill="#fff" fontSize="10" textAnchor="middle">{V}V</text>
                    <text x="280" y="30" fill="#fff" fontSize="10" textAnchor="middle">{(V - Vd).toFixed(1)}V</text>
                    <text x="150" y="70" fill={Vd / V > 0.05 ? "#ef4444" : "#22c55e"} fontSize="12" textAnchor="middle">
                        -{Vd.toFixed(2)}V ({(Vd / V * 100).toFixed(1)}%)
                    </text>
                </svg>
            );
        }
    },

    documentation: {
        assumptions: [],
        standards: [{ code: 'NEC 2020', title: 'National Electrical Code' }],
        formulaLatex: 'V_d = \\frac{K I L}{A}'
    },

    tier: 'free'
};

export default voltageDropSchema;
