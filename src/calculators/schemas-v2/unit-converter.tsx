
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

const CONVERSION_FACTORS: Record<string, number> = {
    // Length (to m)
    'mm': 0.001, 'cm': 0.01, 'm': 1, 'in': 0.0254, 'ft': 0.3048,
    // Mass (to kg)
    'g': 0.001, 'kg': 1, 'lbs': 0.453592, 'ton': 1000,
    // Pressure (to Pa)
    'Pa': 1, 'kPa': 1000, 'MPa': 1e6, 'bar': 1e5, 'psi': 6894.76,
    // Power (to W)
    'W': 1, 'kW': 1000, 'HP': 745.7,
    // Torque (to Nm)
    'Nm': 1, 'kNm': 1000, 'lbf-ft': 1.35582,
    // Temp (to K - special)
};

const CATEGORIES = [
    { label: 'Length', units: ['mm', 'cm', 'm', 'in', 'ft'] },
    { label: 'Mass', units: ['g', 'kg', 'lbs', 'ton'] },
    { label: 'Pressure', units: ['Pa', 'kPa', 'MPa', 'bar', 'psi'] },
    { label: 'Power', units: ['W', 'kW', 'HP'] },
    { label: 'Torque', units: ['Nm', 'kNm', 'lbf-ft'] }
];

const unitConverterSchema: CalculatorSchemaV2 = {
    id: 'unit-converter',
    metadata: {
        title: 'Engineering Unit Converter',
        description: 'Convert between common engineering units.',
        category: 'math',
        version: '2.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-10',
        tags: ['conversion', 'units', 'math'],
        verifiedStandards: [],
    },

    inputs: [
        {
            key: 'category',
            label: 'Category',
            unit: '-',
            defaultValue: 1, // 1=Length, 2=Mass, 3=Pressure, 4=Power, 5=Torque
            description: 'Unit category.',
            options: CATEGORIES.map((c, i) => ({ label: c.label, value: i + 1 })),
            validation: { required: true }
        },
        {
            key: 'sourceUnit',
            label: 'From Unit',
            unit: '-', // We assume index in category array
            defaultValue: 1, // mm
            description: 'Source unit index.',
            validation: { required: true }
        },
        {
            key: 'targetUnit',
            label: 'To Unit',
            unit: '-',
            defaultValue: 3, // m
            description: 'Target unit index.',
            validation: { required: true }
        },
        {
            key: 'value',
            label: 'Value',
            unit: '-',
            defaultValue: 1,
            description: 'Value to convert.',
            validation: { required: true }
        }
    ],

    outputs: [
        {
            key: 'result',
            label: 'Converted Value',
            unit: '-',
            formulaLatex: 'Val \\times Factor',
            description: 'Result in target units.',
            precision: 4
        }
    ],

    calculationEngine: (inputs) => {
        const catIdx = (inputs.category.value as number) - 1;
        const fromIdx = (inputs.sourceUnit.value as number) - 1;
        const toIdx = (inputs.targetUnit.value as number) - 1;
        const val = inputs.value.value as number;

        const category = CATEGORIES[catIdx];
        // @ts-ignore
        if (!category) return { outputs: { result: createValidatedValue(0, '-', 'error') }, verified: false, warnings: [], timestamp: Date.now() };

        const fromUnit = category.units[fromIdx];
        const toUnit = category.units[toIdx];

        let res = 0;

        if (fromUnit && toUnit) {
            const baseVal = val * (CONVERSION_FACTORS[fromUnit] || 0);
            res = baseVal / (CONVERSION_FACTORS[toUnit] || 1);
        }

        return {
            outputs: {
                // @ts-ignore
                result: createValidatedValue(res, toUnit || '-', 'converted')
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },

    visualization: {
        type: 'none',
        render: (result, inputs) => {
            const catIdx = (inputs.category || 1) - 1;
            const cat = CATEGORIES[catIdx] || CATEGORIES[0];
            const fromIdx = (inputs.sourceUnit || 1) - 1;
            const toIdx = (inputs.targetUnit || 1) - 1;

            const fromUnit = cat.units[fromIdx] || '?';
            const toUnit = cat.units[toIdx] || '?';

            // Just show text large
            return (
                <div className="flex flex-col items-center justify-center p-4 h-full text-center">
                    <div className="text-[#00e5ff] text-2xl font-bold mb-2">
                        {inputs.value} {fromUnit}
                    </div>
                    <div className="text-gray-500 text-lg">↓</div>
                    <div className="text-white text-3xl font-bold mt-2">
                        {result?.outputs?.result?.value} {toUnit}
                    </div>

                    <div className="mt-4 text-xs text-gray-600 bg-[#0d1f2d] p-2 rounded w-full text-left font-mono">
                        Unit Map: <br />
                        {cat.units.map((u, i) => `${i + 1}:${u}`).join(', ')}
                    </div>
                </div>
            );
        }
    },

    documentation: {
        assumptions: [],
        standards: [],
        formulaLatex: 'Val_{Target} = Val_{Base} \\times Factor'
    },

    tier: 'free'
};

export default unitConverterSchema;
