
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

const beltDriveSchema: CalculatorSchemaV2 = {
    id: 'belt-drive',
    metadata: {
        title: 'Belt Drive Calculator',
        description: 'Calculate speeds, belt length, and tension for open belt drives.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-25',
        tags: ['belt', 'pulley', 'transmission', 'machine-elements'],
        verifiedStandards: ['Shigley Mechanical Design']
    },

    inputs: [
        {
            key: 'rpm1',
            label: 'Driver Speed (n1)',
            unit: 'RPM' as any,
            defaultValue: 1450,
            description: 'Rotational speed of the driving pulley.',
            validation: { required: true, min: 1 }
        },
        {
            key: 'd1',
            label: 'Driver Diameter (d1)',
            unit: 'mm',
            defaultValue: 100,
            description: 'Pitch diameter of the driving pulley.',
            validation: { required: true, min: 10 }
        },
        {
            key: 'd2',
            label: 'Driven Diameter (d2)',
            unit: 'mm',
            defaultValue: 250,
            description: 'Pitch diameter of the driven pulley.',
            validation: { required: true, min: 10 }
        },
        {
            key: 'centerDist',
            label: 'Center Distance (C)',
            unit: 'mm',
            defaultValue: 500,
            description: 'Distance between the centers of the two pulleys.',
            validation: { required: true, min: 100 }
        },
        {
            key: 'power',
            label: 'Power to Transmit (P)',
            unit: 'kW',
            defaultValue: 5,
            description: 'Design power for the transmission.',
            validation: { required: true, min: 0.1 }
        },
        {
            key: 'beltType',
            label: 'Belt Type',
            unit: '-',
            defaultValue: 'v-belt',
            options: [
                { label: 'Flat Belt', value: 'flat' },
                { label: 'V-Belt (Standard)', value: 'v-belt' }
            ],
            description: 'Select belt profile for friction calculations.',
            validation: { required: true }
        },
        {
            key: 'friction',
            label: 'Friction Coefficient (μ)',
            unit: '-',
            defaultValue: 0.3,
            description: 'Friction between belt and pulley (Rubber on Steel ≈ 0.3).',
            validation: { required: true, min: 0.1, max: 0.8 }
        }
    ],

    outputs: [
        {
            key: 'rpm2',
            label: 'Driven Speed (n2)',
            unit: 'RPM' as any,
            formulaLatex: 'n_2 = n_1 \\cdot \\frac{d_1}{d_2}',
            description: 'Rotational speed of the driven pulley.',
            precision: 0
        },
        {
            key: 'beltVelocity',
            label: 'Belt Velocity (v)',
            unit: 'm/s' as any,
            formulaLatex: 'v = \\frac{\\pi \\cdot d_1 \\cdot n_1}{60000}',
            description: 'Linear speed of the belt.',
            precision: 2
        },
        {
            key: 'beltLength',
            label: 'Belt Length (L)',
            unit: 'mm',
            formulaLatex: 'L \\approx 2C + 1.57(d_1+d_2) + \\frac{(d_2-d_1)^2}{4C}',
            description: 'Approximate geometric pitch length of the belt.',
            precision: 1
        },
        {
            key: 'arcOfContact',
            label: 'Arc of Contact (θ)',
            unit: 'deg' as any,
            formulaLatex: '\\theta = 180 - 2\\arcsin\\left(\\frac{d_2-d_1}{2C}\\right)',
            description: 'Wrap angle around the smaller pulley.',
            precision: 1
        },
        {
            key: 'tensionRatio',
            label: 'Tension Ratio (T1/T2)',
            unit: '-',
            formulaLatex: '\\frac{T_1}{T_2} = e^{\\mu \\theta / \\sin\\beta}',
            description: 'Max allowable ratio of tight side to slack side tension.',
            precision: 2
        }
    ],

    calculationEngine: (inputs) => {
        const n1 = Number(inputs.rpm1.value);
        const d1 = Number(inputs.d1.value);
        const d2 = Number(inputs.d2.value);
        const C = Number(inputs.centerDist.value);
        const P_kw = Number(inputs.power.value);
        const mu = Number(inputs.friction.value);
        const type = inputs.beltType.value as string;

        // Driven RPM
        const n2 = n1 * (d1 / d2);

        // Belt Velocity (m/s)
        const v = (Math.PI * d1 * n1) / 60000;

        // Belt Length
        const L = 2 * C + 1.57 * (d1 + d2) + Math.pow(d2 - d1, 2) / (4 * C);

        // Arc of Contact (smaller pulley)
        // angle in rad
        const theta_rad = Math.PI - 2 * Math.asin((Math.abs(d2 - d1)) / (2 * C));
        const theta_deg = theta_rad * (180 / Math.PI);

        // Tension Ratio
        let ratio = 0;
        if (type === 'v-belt') {
            const beta = 19 * (Math.PI / 180); // Standard 38 deg groove, half angle = 19
            ratio = Math.exp((mu * theta_rad) / Math.sin(beta));
        } else {
            ratio = Math.exp(mu * theta_rad);
        }

        return {
            outputs: {
                rpm2: createValidatedValue(n2, 'RPM' as any, 'derived'),
                beltVelocity: createValidatedValue(v, 'm/s' as any, 'derived'),
                beltLength: createValidatedValue(L, 'mm', 'derived'),
                arcOfContact: createValidatedValue(theta_deg, 'deg' as any, 'derived'),
                tensionRatio: createValidatedValue(ratio, '-', 'derived')
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },

    documentation: {
        assumptions: [
            { id: 'thin-belt', text: 'Belt thickness is much smaller than pulley diameter.', impact: 'low' },
            { id: 'quasi-static', text: 'Centrifugal effects are neglected for simplicity in this version.', impact: 'medium' }
        ],
        standards: [
            { code: 'ISO 5291', title: 'V-belt drives -- Grooved pulleys' }
        ],
        formulaLatex: 'L \\approx 2C + 1.57(d_1+d_2) + \\frac{(d_2-d_1)^2}{4C}'
    },

    tier: 'free',
    visualization: {
        type: 'none'
    }
};

export default beltDriveSchema;
