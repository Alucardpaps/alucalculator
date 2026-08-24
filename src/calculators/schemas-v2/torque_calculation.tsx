import { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

const torqueCalculationSchema: CalculatorSchemaV2 = {
    id: 'torque_calculation',
    metadata: {
        title: 'Torque Calculation',
        description: 'Determine shaft torque from motor power and speed.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc Kernel',
        lastUpdated: '2024-04-06',
        verifiedStandards: ['General Engineering Practice']
    },
    inputs: [
        {
            key: 'P',
            label: 'Input Power (P)',
            unit: 'kW',
            defaultValue: 10,
            description: 'The rated power of the input motor or prime mover.',
            validation: {
                min: 0.01,
                required: true,
                step: 0.1
            }
        },
        {
            key: 'n',
            label: 'Rotational Speed (n)',
            unit: 'rpm',
            defaultValue: 1500,
            description: 'The rotational speed of the input shaft.',
            validation: {
                min: 1,
                required: true,
                step: 1
            }
        }
    ],
    outputs: [
        {
            key: 'T',
            label: 'Shaft Torque (T)',
            unit: 'Nm',
            formulaLatex: 'T = \\frac{9550 \\cdot P}{n}',
            description: 'The resulting torque on the shaft in Newton-meters.'
        },
        {
            key: 'omega',
            label: 'Angular Velocity (ω)',
            unit: 'rad',
            formulaLatex: '\\omega = \\frac{2\\pi n}{60}',
            description: 'The angular velocity in radians per second (displayed as rad).'
        }
    ],
    visualization: {
        type: 'none'
    },
    documentation: {
        assumptions: [
            { id: '1', text: 'Steady state operation', impact: 'low' },
            { id: '2', text: 'Lossless transmission for this specific stage', impact: 'medium' }
        ],
        standards: [],
        formulaLatex: 'T = (9550 * P) / n'
    },
    calculationEngine: (inputs) => {
        const P_val = Number(inputs.P.value) || 0;
        const n_val = Number(inputs.n.value) || 0;
        
        const T_val = (9550 * P_val) / n_val;
        const omega_val = (2 * Math.PI * n_val) / 60;

        return {
            outputs: {
                T: createValidatedValue(T_val, 'Nm', 'derived'),
                omega: createValidatedValue(omega_val, 'rad', 'derived')
            },
            warnings: [],
            formulaTrace: {
                T: `(9550 * ${P_val}) / ${n_val} = ${T_val.toFixed(2)} Nm`,
                omega: `(2 * PI * ${n_val}) / 60 = ${omega_val.toFixed(2)} rad/s`
            },
            verified: true,
            timestamp: Date.now()
        };
    }
};

export default torqueCalculationSchema;
