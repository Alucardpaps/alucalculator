
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

const pumpsSchema: CalculatorSchemaV2 = {
    id: 'pumps',
    metadata: {
        title: 'Pump Sizing Calculator',
        description: 'Calculate hydraulic power, shaft power, and motor power requirements.',
        category: 'fluid',
        version: '2.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-10',
        tags: ['pump', 'power', 'head', 'flow', 'efficiency'],
        verifiedStandards: [],
    },

    inputs: [
        {
            key: 'flowRate',
            label: 'Flow Rate (Q)',
            unit: 'm3/s' as any, // We can use m3/h if we convert
            defaultValue: 0.01,
            description: 'Volumetric flow rate.',
            validation: { required: true, min: 0 }
        },
        {
            key: 'head',
            label: 'Total Head (H)',
            unit: 'm',
            defaultValue: 10,
            description: 'Total dynamic head (elevation + friction + pressure).',
            validation: { required: true, min: 0 }
        },
        {
            key: 'gravity',
            label: 'Gravity (g)',
            unit: 'm/s', // m/s2 - assuming m/s unit type exists or close enough
            defaultValue: 9.81,
            description: 'Gravitational acceleration.',
            validation: { required: true, min: 0 }
        },
        {
            key: 'density',
            label: 'Fluid Density (rho)',
            unit: 'kg',
            defaultValue: 1000,
            description: 'Fluid density (Water ≈ 1000 kg/m3).',
            validation: { required: true, min: 0 }
        },
        {
            key: 'pumpEfficiency',
            label: 'Pump Efficiency (eta_p)',
            unit: '%',
            defaultValue: 70,
            description: 'Efficiency of the pump (0-100%).',
            validation: { required: true, min: 1, max: 100 }
        },
        {
            key: 'motorEfficiency',
            label: 'Motor Efficiency (eta_m)',
            unit: '%',
            defaultValue: 90,
            description: 'Efficiency of the electric motor (0-100%).',
            validation: { required: true, min: 1, max: 100 }
        }
    ],

    outputs: [
        {
            key: 'hydraulicPower',
            label: 'Hydraulic Power (Ph)',
            unit: 'kW',
            formulaLatex: 'P_h = \\rho g Q H',
            description: 'Power transferred to the fluid.',
            precision: 2
        },
        {
            key: 'shaftPower',
            label: 'Shaft Power (Ps)',
            unit: 'kW',
            formulaLatex: 'P_s = \\frac{P_h}{\\eta_p}',
            description: 'Power required at the pump shaft.',
            precision: 2
        },
        {
            key: 'motorPower',
            label: 'Motor Power (Pm)',
            unit: 'kW',
            formulaLatex: 'P_m = \\frac{P_s}{\\eta_m}',
            description: 'Electrical power required by the motor.',
            precision: 2
        }
    ],

    calculationEngine: (inputs) => {
        const Q = inputs.flowRate.value as number;
        const H = inputs.head.value as number;
        const g = inputs.gravity.value as number;
        const rho = inputs.density.value as number;
        const eta_p = (inputs.pumpEfficiency.value as number) / 100;
        const eta_m = (inputs.motorEfficiency.value as number) / 100;

        // Ph = rho * g * Q * H (Watts)
        const Ph_W = rho * g * Q * H;
        const Ph_kW = Ph_W / 1000;

        const Ps_kW = Ph_kW / eta_p;
        const Pm_kW = Ps_kW / eta_m;

        return {
            outputs: {
                hydraulicPower: createValidatedValue(Ph_kW, 'kW', 'derived'),
                shaftPower: createValidatedValue(Ps_kW, 'kW', 'derived'),
                motorPower: createValidatedValue(Pm_kW, 'kW', 'derived')
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },

    visualization: {
        type: 'svg-parametric',
        render: (result, inputs) => {
            const Q = inputs.flowRate || 0.01;
            const H = inputs.head || 10;
            const Ps = result?.outputs?.shaftPower?.value as number || 0;
            const Pm = result?.outputs?.motorPower?.value as number || 0;

            // Draw schematic: Tank -> Pump -> Lift -> Tank
            return (
                <svg viewBox="0 0 200 150" style={{ width: '100%', height: '100%' }}>
                    {/* Lower Tank */}
                    <rect x="20" y="120" width="60" height="20" fill="#0ea5e9" opacity="0.5" />
                    <line x1="20" y1="120" x2="80" y2="120" stroke="#0ea5e9" strokeWidth="2" />

                    {/* Pipe Up */}
                    <polyline points="50,130 50,100 100,100 100,40 150,40" fill="none" stroke="#cbd5e1" strokeWidth="4" />

                    {/* Pump Symbol */}
                    <circle cx="50" cy="100" r="10" fill="#2a3a4a" stroke="#fff" strokeWidth="2" />
                    <path d="M 50 100 L 60 90 L 60 110 Z" fill="#fff" />

                    {/* Upper Tank */}
                    <rect x="150" y="30" width="40" height="20" fill="#0ea5e9" opacity="0.5" />

                    {/* Labels */}
                    <text x="50" y="115" fill="#fff" fontSize="8" textAnchor="middle">Pump</text>
                    <text x="120" y="70" fill="#fff" fontSize="8" textAnchor="middle">H = {H}m</text>

                    {/* Power Flow */}
                    <foreignObject x="110" y="110" width="80" height="40">
                        <div style={{ fontSize: '8px', color: '#94a3b8' }}>
                            Shaft: {(Ps).toFixed(1)} kW <br />
                            Motor: {(Pm).toFixed(1)} kW
                        </div>
                    </foreignObject>
                </svg>
            );
        }
    },

    documentation: {
        assumptions: [],
        standards: [],
        formulaLatex: 'P_h = \\rho g Q H'
    },

    tier: 'free'
};

export default pumpsSchema;
