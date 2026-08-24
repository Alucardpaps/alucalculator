
import type { CalculatorSchemaV2, CalculationResult } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

const brakesClutchesSchema: CalculatorSchemaV2 = {
    id: 'brakes-clutches',
    metadata: {
        title: 'Brakes & Clutches Calculator',
        description: 'Calculate torque capacity and power for disk clutches and brakes.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-25',
        tags: ['brake', 'clutch', 'friction', 'machine-elements'],
        verifiedStandards: ['Shigley Mechanical Design']
    },

    inputs: [
        {
            key: 'ri',
            label: 'Inner Radius (ri)',
            unit: 'mm',
            defaultValue: 40,
            description: 'Inner radius of the friction surface.',
            validation: { required: true, min: 5 }
        },
        {
            key: 'ro',
            label: 'Outer Radius (ro)',
            unit: 'mm',
            defaultValue: 80,
            description: 'Outer radius of the friction surface.',
            validation: { required: true, min: 10 }
        },
        {
            key: 'force',
            label: 'Applied Actuation Force (F)',
            unit: 'N' as any,
            defaultValue: 1000,
            description: 'Axial force applied to the friction plates.',
            validation: { required: true, min: 1 }
        },
        {
            key: 'mu',
            label: 'Friction Coefficient (μ)',
            unit: '-',
            defaultValue: 0.35,
            description: 'Friction between material surfaces (e.g., Sintered Metal on Steel ≈ 0.3-0.4).',
            validation: { required: true, min: 0.05, max: 0.9 }
        },
        {
            key: 'numSurfaces',
            label: 'Number of Friction Surfaces (n)',
            unit: '-',
            defaultValue: 1,
            description: 'Total number of active friction interfaces (e.g., multidisk clutch).',
            validation: { required: true, min: 1, max: 20 }
        },
        {
            key: 'rpm',
            label: 'Speed (n)',
            unit: 'RPM' as any,
            defaultValue: 1000,
            description: 'Rotational speed for power calculation.',
            validation: { required: true, min: 0 }
        },
        {
            key: 'theory',
            label: 'Theory',
            unit: '-',
            defaultValue: 'uniform-wear',
            options: [
                { label: 'Uniform Wear (Recommended for used)', value: 'uniform-wear' },
                { label: 'Uniform Pressure (New components)', value: 'uniform-pressure' }
            ],
            description: 'Uniform Wear assumes pressure is inversely proportional to radius. Uniform Pressure assumes constant pressure.',
            validation: { required: true }
        }
    ],

    outputs: [
        {
            key: 'torque',
            label: 'Torque Capacity (T)',
            unit: 'Nm',
            formulaLatex: 'T = \\frac{1}{2} n \\mu F (R_o + R_i)',
            description: 'Maximum torque the clutch/brake can transmit without slipping.',
            precision: 2
        },
        {
            key: 'power',
            label: 'Power Capacity (P)',
            unit: 'kW',
            formulaLatex: 'P = \\frac{T \\cdot n}{9550}',
            description: 'Total power capacity at the given RPM.',
            precision: 2
        },
        {
            key: 'surfaceArea',
            label: 'Friction Area (A)',
            unit: 'mm2',
            formulaLatex: 'A = \\pi (r_o^2 - r_i^2)',
            description: 'Total contact area per friction surface.',
            precision: 0
        },
        {
            key: 'maxPressure',
            label: 'Peak Surface Pressure (p_max)',
            unit: 'MPa',
            formulaLatex: 'p_{max} = \\frac{F}{2 \\pi r_i (r_o - r_i)}',
            description: 'Maximum local pressure on the friction material.',
            precision: 3
        }
    ],

    calculationEngine: (inputs) => {
        const ri = Number(inputs.ri.value);
        const ro = Number(inputs.ro.value);
        const F = Number(inputs.force.value);
        const mu = Number(inputs.mu.value);
        const n = Number(inputs.numSurfaces.value);
        const rpm = Number(inputs.rpm.value);
        const theory = inputs.theory.value as string;

        const warnings: CalculationResult['warnings'] = [];
        if (ro <= ri) {
            warnings.push({
                field: 'ro',
                message: 'Outer radius must be greater than inner radius.',
                severity: 'critical'
            });
        }

        let torque_Nm = 0;
        let p_max_MPa = 0;

        // Radii in meters for torque formula to get Nm directly
        const Ri = ri / 1000;
        const Ro = ro / 1000;

        if (ro > ri) {
            if (theory === 'uniform-wear') {
                torque_Nm = 0.5 * n * mu * F * (Ro + Ri);
                p_max_MPa = F / (2 * Math.PI * ri * (ro - ri));
            } else {
                torque_Nm = (2 / 3) * n * mu * F * (Math.pow(Ro, 3) - Math.pow(Ri, 3)) / (Math.pow(Ro, 2) - Math.pow(Ri, 2));
                p_max_MPa = F / (Math.PI * (Math.pow(ro, 2) - Math.pow(ri, 2)));
            }
        }

        const P_kw = (torque_Nm * rpm) / 9550;
        const area = Math.PI * (Math.pow(ro, 2) - Math.pow(ri, 2));

        return {
            outputs: {
                torque: createValidatedValue(torque_Nm, 'Nm', 'derived'),
                power: createValidatedValue(P_kw, 'kW', 'derived'),
                surfaceArea: createValidatedValue(area, 'mm2', 'derived'),
                maxPressure: createValidatedValue(p_max_MPa, 'MPa', 'derived')
            },
            verified: true,
            warnings,
            timestamp: Date.now()
        };
    },

    documentation: {
        assumptions: [
            { id: 'uniform-friction', text: 'Coefficient of friction is constant regardless of temperature or speed.', impact: 'medium' },
            { id: 'rigid-plates', text: 'The pressure plates are perfectly rigid, providing ideal pressure distribution.', impact: 'low' }
        ],
        standards: [
            { code: 'Shigley ME', title: 'Machine Elements: Clutches and Brakes' }
        ],
        formulaLatex: 'T = \\int \\mu p r dA'
    },

    tier: 'free',
    visualization: {
        type: 'none'
    }
};

export default brakesClutchesSchema;
