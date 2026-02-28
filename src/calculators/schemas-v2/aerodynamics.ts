
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

const aerodynamicsSchema: CalculatorSchemaV2 = {
    id: 'aerodynamics',
    metadata: {
        title: 'Aerodynamics & Drag Calculator',
        description: 'Calculate aerodynamic drag force and the power required to overcome it.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-25',
        tags: ['aerodynamics', 'drag', 'fluid-mechanics', 'power'],
        verifiedStandards: ['Drag Equation']
    },

    inputs: [
        {
            key: 'velocity',
            label: 'Velocity (v)',
            unit: 'km/h' as any,
            defaultValue: 100,
            description: 'Relative speed through the fluid.',
            validation: { required: true, min: 0 }
        },
        {
            key: 'area',
            label: 'Frontal Projected Area (A)',
            unit: 'm2',
            defaultValue: 2.5,
            description: 'The cross-sectional area as seen from the front.',
            validation: { required: true, min: 0.001 }
        },
        {
            key: 'cd',
            label: 'Drag Coefficient (Cd)',
            unit: '-',
            defaultValue: 0.3,
            description: 'Dimensionless coefficient (e.g., Sphere ≈ 0.47, Car ≈ 0.25-0.35, Truck ≈ 0.6-0.8).',
            validation: { required: true, min: 0.01, max: 2.0 }
        },
        {
            key: 'density',
            label: 'Fluid Density (ρ)',
            unit: 'kg/m3' as any,
            defaultValue: 1.225,
            description: 'Density of the fluid (e.g., Air at SL ≈ 1.225, Water ≈ 1000).',
            validation: { required: true, min: 0.1 }
        }
    ],

    outputs: [
        {
            key: 'dragForce',
            label: 'Drag Force (Fd)',
            unit: 'N' as any,
            formulaLatex: 'F_d = \\frac{1}{2} \\rho v^2 C_d A',
            description: 'Total force resisting motion due to fluid friction and pressure.',
            precision: 1
        },
        {
            key: 'dragPower',
            label: 'Drag Power (Pd)',
            unit: 'kW',
            formulaLatex: 'P_d = F_d \\cdot v',
            description: 'Power required to maintain this velocity against drag.',
            precision: 2
        },
        {
            key: 'dynamicPressure',
            label: 'Dynamic Pressure (q)',
            unit: 'Pa' as any,
            formulaLatex: 'q = \\frac{1}{2} \\rho v^2',
            description: 'Kinetic energy per unit volume of the fluid.',
            precision: 1
        }
    ],

    calculationEngine: (inputs) => {
        const v_kmh = Number(inputs.velocity.value);
        const A = Number(inputs.area.value);
        const Cd = Number(inputs.cd.value);
        const rho = Number(inputs.density.value);

        // velocity in m/s
        const v = v_kmh / 3.6;

        // Fd = 0.5 * rho * v^2 * Cd * A
        const Fd_N = 0.5 * rho * Math.pow(v, 2) * Cd * A;

        // Pd = Fd * v
        const Pd_W = Fd_N * v;
        const Pd_kW = Pd_W / 1000;

        // dynamic pressure
        const q_pa = 0.5 * rho * Math.pow(v, 2);

        return {
            outputs: {
                dragForce: createValidatedValue(Fd_N, 'N' as any, 'derived'),
                dragPower: createValidatedValue(Pd_kW, 'kW', 'derived'),
                dynamicPressure: createValidatedValue(q_pa, 'Pa' as any, 'derived')
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },

    documentation: {
        assumptions: [
            { id: 'incompressible', text: 'Fluid is assumed to be incompressible (valid for Mach < 0.3).', impact: 'high' },
            { id: 'constant-rho', text: 'Fluid density is constant throughout the volume.', impact: 'medium' }
        ],
        standards: [
            { code: 'NASA', title: 'The Drag Equation' }
        ],
        formulaLatex: 'F_d = \\frac{1}{2} \\rho v^2 C_d A'
    },

    tier: 'free',
    visualization: {
        type: 'none'
    }
};

export default aerodynamicsSchema;
