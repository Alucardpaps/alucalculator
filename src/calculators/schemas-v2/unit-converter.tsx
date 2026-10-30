
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
    { label: 'Torque', units: ['Nm', 'kNm', 'lbf-ft'] },
    { label: 'Hardness (ASTM E140)', units: ['HRC', 'HB', 'HV', 'HRB', 'MPa'] }
];

const HARDNESS_CONV_TABLE = [
    { hb: 615, hrc: 60, hrb: 120, hv: 697, mpa: 2180 },
    { hb: 560, hrc: 55, hrb: 118, hv: 613, mpa: 1980 },
    { hb: 512, hrc: 52, hrb: 116, hv: 550, mpa: 1810 },
    { hb: 475, hrc: 49, hrb: 115, hv: 508, mpa: 1680 },
    { hb: 444, hrc: 47, hrb: 114, hv: 471, mpa: 1570 },
    { hb: 415, hrc: 44, hrb: 113, hv: 438, mpa: 1460 },
    { hb: 388, hrc: 41, hrb: 111, hv: 409, mpa: 1360 },
    { hb: 363, hrc: 39, hrb: 110, hv: 382, mpa: 1270 },
    { hb: 341, hrc: 37, hrb: 109, hv: 358, mpa: 1190 },
    { hb: 321, hrc: 34, hrb: 108, hv: 336, mpa: 1120 },
    { hb: 302, hrc: 32, hrb: 107, hv: 315, mpa: 1050 },
    { hb: 285, hrc: 30, hrb: 105, hv: 297, mpa: 990 },
    { hb: 269, hrc: 28, hrb: 104, hv: 279, mpa: 930 },
    { hb: 255, hrc: 25, hrb: 102, hv: 264, mpa: 880 },
    { hb: 241, hrc: 23, hrb: 100, hv: 249, mpa: 830 },
    { hb: 228, hrc: 20, hrb: 98,  hv: 235, mpa: 785 },
    { hb: 217, hrc: 18, hrb: 96,  hv: 223, mpa: 745 },
    { hb: 207, hrc: 15, hrb: 95,  hv: 212, mpa: 710 },
    { hb: 197, hrc: 13, hrb: 93,  hv: 202, mpa: 675 },
    { hb: 187, hrc: 10, hrb: 91,  hv: 192, mpa: 640 },
    { hb: 179, hrc: 7,  hrb: 89,  hv: 184, mpa: 615 },
    { hb: 170, hrc: 4,  hrb: 86,  hv: 175, mpa: 585 },
    { hb: 163, hrc: 2,  hrb: 84,  hv: 167, mpa: 560 },
    { hb: 156, hrc: 0,  hrb: 82,  hv: 160, mpa: 535 },
    { hb: 149, hrc: -2, hrb: 80,  hv: 152, mpa: 510 },
    { hb: 143, hrc: -5, hrb: 78,  hv: 146, mpa: 490 },
    { hb: 137, hrc: -8, hrb: 75,  hv: 140, mpa: 470 },
    { hb: 131, hrc: -10,hrb: 73,  hv: 134, mpa: 450 },
    { hb: 121, hrc: -15,hrb: 68,  hv: 124, mpa: 415 },
    { hb: 111, hrc: -20,hrb: 63,  hv: 113, mpa: 380 },
    { hb: 101, hrc: -25,hrb: 57,  hv: 103, mpa: 345 },
    { hb: 95,  hrc: -28,hrb: 53,  hv: 96,  mpa: 325 }
];

function calcHardnessInterp(val: number, from: string, to: string): number {
    const fKey = from.toLowerCase() as 'hb' | 'hrc' | 'hrb' | 'hv' | 'mpa';
    const tKey = to.toLowerCase() as 'hb' | 'hrc' | 'hrb' | 'hv' | 'mpa';
    if (fKey === tKey) return val;
    const table = [...HARDNESS_CONV_TABLE].sort((a, b) => a[fKey] - b[fKey]);
    if (val <= table[0][fKey]) return table[0][tKey];
    if (val >= table[table.length - 1][fKey]) return table[table.length - 1][tKey];
    for (let i = 0; i < table.length - 1; i++) {
        const p1 = table[i];
        const p2 = table[i + 1];
        if (val >= p1[fKey] && val <= p2[fKey]) {
            const range = p2[fKey] - p1[fKey];
            if (range === 0) return p1[tKey];
            const t = (val - p1[fKey]) / range;
            return p1[tKey] + t * (p2[tKey] - p1[tKey]);
        }
    }
    return val;
}

const unitConverterSchema: CalculatorSchemaV2 = {
    id: 'unit-converter',
    metadata: {
        title: 'Engineering Unit Converter',
        description: 'Convert between common engineering units including length, pressure, torque and ASTM E140 hardness scales.',
        category: 'math',
        version: '2.1.0',
        author: 'AluCAD Engineering',
        lastUpdated: '2026-02-10',
        tags: ['conversion', 'units', 'math', 'hardness', 'hrc', 'hb', 'vickers', 'tensile'],
        verifiedStandards: ['ISO 18265', 'ASTM E140'],
    },

    inputs: [
        {
            key: 'category',
            label: 'Category',
            unit: '-',
            defaultValue: 1,
            description: 'Unit category.',
            options: CATEGORIES.map((c, i) => ({ label: c.label, value: i + 1 })),
            validation: { required: true }
        },
        {
            key: 'sourceUnit',
            label: 'From Unit',
            unit: '-',
            defaultValue: 1,
            description: 'Source unit index.',
            validation: { required: true }
        },
        {
            key: 'targetUnit',
            label: 'To Unit',
            unit: '-',
            defaultValue: 2,
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

        const fromUnit = category.units[fromIdx] || category.units[0];
        const toUnit = category.units[toIdx] || category.units[1];

        let res = 0;

        if (category.label.includes('Hardness')) {
            res = calcHardnessInterp(val, fromUnit, toUnit);
        } else if (fromUnit && toUnit) {
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
                    <div className="text-[var(--cyan)] text-2xl font-bold mb-2">
                        {inputs.value} {fromUnit}
                    </div>
                    <div className="text-gray-500 text-lg">↓</div>
                    <div className="text-white text-3xl font-bold mt-2">
                        {result?.outputs?.result?.value} {toUnit}
                    </div>

                    <div className="mt-4 text-xs text-gray-600 bg-[var(--bg-3)] p-2 rounded w-full text-left font-mono">
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
