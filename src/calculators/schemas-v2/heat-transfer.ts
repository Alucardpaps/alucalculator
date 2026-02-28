
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

const heatTransferSchema: CalculatorSchemaV2 = {
    id: 'heat-transfer',
    metadata: {
        title: 'Heat Transfer Calculator',
        description: 'Calculate heat flow via conduction and convection.',
        category: 'thermal',
        version: '1.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-25',
        tags: ['thermal', 'conduction', 'convection', 'heat-flux'],
        verifiedStandards: ['Fourier Law', 'Newton Law of Cooling']
    },

    inputs: [
        {
            key: 'mode',
            label: 'Transfer Mode',
            unit: '-',
            defaultValue: 'conduction',
            options: [
                { label: 'Conduction (Through Solid)', value: 'conduction' },
                { label: 'Convection (Surface to Fluid)', value: 'convection' }
            ],
            description: 'Select either Conduction (Fourier Law) or Convection (Newton Law).',
            validation: { required: true }
        },
        {
            key: 'area',
            label: 'Surface Area (A)',
            unit: 'm2',
            defaultValue: 1,
            description: 'Total cross-sectional or surface area for heat exchange.',
            validation: { required: true, min: 0.0001 }
        },
        {
            key: 'temp1',
            label: 'Temperature 1 (T1)',
            unit: 'degC' as any,
            defaultValue: 100,
            description: 'High or initial temperature.',
            validation: { required: true }
        },
        {
            key: 'temp2',
            label: 'Temperature 2 (T2)',
            unit: 'degC' as any,
            defaultValue: 20,
            description: 'Low or ambient temperature.',
            validation: { required: true }
        },
        // Conduction specific
        {
            key: 'conductivity',
            label: 'Thermal Conductivity (k)',
            unit: 'W/mK' as any,
            defaultValue: 200,
            description: 'Material property (e.g., Aluminum ≈ 200, Steel ≈ 50).',
            validation: { required: false, min: 0.001 }
        },
        {
            key: 'thickness',
            label: 'Thickness (L)',
            unit: 'mm',
            defaultValue: 10,
            description: 'Thickness of the solid material layer.',
            validation: { required: false, min: 0.1 }
        },
        // Convection specific
        {
            key: 'convCoeff',
            label: 'Convection Coefficient (h)',
            unit: 'W/m2K' as any,
            defaultValue: 25,
            description: 'Heat transfer coefficient (e.g., Free air ≈ 5-25, Forced air ≈ 25-250, Water ≈ 500-10000).',
            validation: { required: false, min: 0.1 }
        }
    ],

    outputs: [
        {
            key: 'heatFlow',
            label: 'Heat Flow Rate (Q)',
            unit: 'W' as any,
            formulaLatex: 'Q = \\frac{k A \\Delta T}{L}',
            description: 'Total rate of heat energy transfer.',
            precision: 2
        },
        {
            key: 'heatFlux',
            label: 'Heat Flux (q)',
            unit: 'W/m2' as any,
            formulaLatex: 'q = Q / A',
            description: 'Heat flow rate per unit area.',
            precision: 2
        },
        {
            key: 'resistance',
            label: 'Thermal Resistance (R)',
            unit: 'K/W' as any,
            formulaLatex: 'R = \\frac{\\Delta T}{Q}',
            description: 'Reciprocal of thermal conductance.',
            precision: 4
        }
    ],

    calculationEngine: (inputs) => {
        const mode = inputs.mode.value as string;
        const A = Number(inputs.area.value);
        const T1 = Number(inputs.temp1.value);
        const T2 = Number(inputs.temp2.value);
        const dT = Math.abs(T1 - T2);

        let Q_W = 0;
        let R_KW = 0;

        if (mode === 'conduction') {
            const k = Number(inputs.conductivity.value);
            const L = Number(inputs.thickness.value) / 1000; // to meters
            Q_W = (k * A * dT) / L;
            R_KW = L / (k * A);
        } else {
            const h = Number(inputs.convCoeff.value);
            Q_W = h * A * dT;
            R_KW = 1 / (h * A);
        }

        const q = Q_W / A;

        return {
            outputs: {
                heatFlow: createValidatedValue(Q_W, 'W' as any, 'derived'),
                heatFlux: createValidatedValue(q, 'W/m2' as any, 'derived'),
                resistance: createValidatedValue(R_KW, 'K/W' as any, 'derived')
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },

    documentation: {
        assumptions: [
            { id: 'one-dimensional', text: 'Heat transfer is assumed to be one-dimensional.', impact: 'high' },
            { id: 'steady-state', text: 'Steady-state conditions (temperatures do not change with time).', impact: 'high' }
        ],
        standards: [
            { code: 'Fourier', title: 'Fourier Law of Heat Conduction' }
        ],
        formulaLatex: 'Q = \\frac{T_{hot} - T_{cold}}{\\sum R_t}'
    },

    tier: 'free',
    visualization: {
        type: 'none'
    }
};

export default heatTransferSchema;
