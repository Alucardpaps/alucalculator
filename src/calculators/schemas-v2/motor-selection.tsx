import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

const motorSelectionSchema: CalculatorSchemaV2 = {
    id: 'motor-selection',
    metadata: {
        title: 'Motor Selection Engine',
        description: 'Calculate required motor power and match to nearest IEC standard motor size.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-04-06',
        tags: ['motor', 'power', 'drivetrain', 'IEC', 'selection'],
        verifiedStandards: ['IEC 60034-1']
    },
    inputs: [
        { key: 'torque', label: 'Load Torque (T)', unit: 'Nm' as any, defaultValue: 50, description: 'Required torque at the load.', validation: { required: true, min: 0.01 } },
        { key: 'speed', label: 'Required Speed (n)', unit: 'RPM' as any, defaultValue: 1500, description: 'Required rotational speed at the load.', validation: { required: true, min: 1 } },
        { key: 'efficiency', label: 'Drive Efficiency (η)', unit: '-', defaultValue: 0.9, description: 'Overall drivetrain efficiency (0 to 1).', validation: { required: true, min: 0.1, max: 1 } },
        { key: 'serviceFactor', label: 'Service Factor (Ks)', unit: '-', defaultValue: 1.25, description: 'Safety/service factor for the application.', validation: { required: true, min: 1, max: 3 } }
    ],
    outputs: [
        { key: 'omega', label: 'Angular Velocity (ω)', unit: 'rad/s' as any, formulaLatex: '\\omega = \\frac{2\\pi n}{60}', precision: 2, description: 'Rotational speed in radians per second.' },
        { key: 'pLoad', label: 'Load Power', unit: 'kW', formulaLatex: 'P_{load} = \\frac{T \\times \\omega}{1000}', precision: 3, description: 'Theoretical power required at the load.' },
        { key: 'pRequired', label: 'Required Motor Power', unit: 'kW', formulaLatex: 'P_{req} = \\frac{P_{load} \\times K_s}{\\eta}', precision: 3, description: 'Power required from the motor after efficiency and safety factors.' },
        { key: 'pStandard', label: 'Standard IEC Motor', unit: 'kW', formulaLatex: 'P_{std} = \\text{next IEC size} \\geq P_{req}', precision: 1, description: 'Next available standard IEC motor size.' },
        { key: 'utilization', label: 'Utilization', unit: '%' as any, formulaLatex: '\\text{Util} = \\frac{P_{req}}{P_{std}} \\times 100', precision: 1, description: 'How much of the motor capacity is being utilized.' }
    ],
    calculationEngine: (inputs) => {
        const T = Number(inputs.torque.value);
        const n = Number(inputs.speed.value);
        const eta = Number(inputs.efficiency.value);
        const Ks = Number(inputs.serviceFactor.value);

        const omega = (2 * Math.PI * n) / 60;
        const pLoad = (T * omega) / 1000;
        const pRequired = (pLoad * Ks) / eta;

        const IEC_SIZES = [0.12, 0.18, 0.25, 0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75, 90, 110, 132, 160, 200, 250, 315];
        const pStandard = IEC_SIZES.find(s => s >= pRequired) ?? IEC_SIZES[IEC_SIZES.length - 1];
        const utilization = (pRequired / pStandard) * 100;

        return {
            outputs: {
                omega: createValidatedValue(omega, 'rad/s' as any, 'derived'),
                pLoad: createValidatedValue(pLoad, 'kW', 'derived'),
                pRequired: createValidatedValue(pRequired, 'kW', 'derived'),
                pStandard: createValidatedValue(pStandard, 'kW', 'derived'),
                utilization: createValidatedValue(utilization, '%' as any, 'derived'),
            },
            verified: true,
            warnings: utilization > 95 ? [{ field: 'utilization', message: 'Motor utilization exceeds 95%. Consider next size up for thermal margin.', severity: 'warning' as const }] : [],
            timestamp: Date.now()
        };
    },
    documentation: {
        assumptions: [
            { id: 'steady-load', text: 'Load is assumed to be steady-state. For cyclic loads, increase the service factor.', impact: 'medium' }
        ],
        standards: [{ code: 'IEC 60034-1', title: 'Rotating Electrical Machines - Rating and Performance' }],
        formulaLatex: 'P_{motor} = \\frac{T \\times \\omega \\times K_s}{\\eta \\times 1000}'
    },
    tier: 'free',
    visualization: { type: 'none' }
};

export default motorSelectionSchema;
