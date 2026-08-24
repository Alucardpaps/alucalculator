import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';
import { calculateIsoFit } from '@/lib/engines/math/iso286';

const fitsTolerancesSchema: CalculatorSchemaV2 = {
    id: 'fits-tolerances',
    metadata: {
        title: 'Fits & Tolerances (ISO 286)',
        description: 'Calculate clearance, interference, and limits for shaft/hole fits.',
        category: 'materials',
        version: '2.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-10',
        verifiedStandards: ['ISO 286-1', 'ISO 286-2'],
    },

    inputs: [
        {
            key: 'nominalSize',
            label: 'Nominal Size (Ø)',
            unit: 'mm',
            defaultValue: 50,
            description: 'Basic size of the feature.',
            validation: { required: true, min: 1, max: 3150 }
        },
        {
            key: 'holeClass',
            label: 'Hole Class',
            unit: '-',
            defaultValue: 'H7',
            description: 'ISO Tolerance Class (e.g., H7)',
            validation: { required: true },
            options: ['H7', 'H8', 'H9', 'H11'].map(v => ({ label: v, value: v }))
        },
        {
            key: 'shaftClass',
            label: 'Shaft Class',
            unit: '-',
            defaultValue: 'g6',
            description: 'ISO Tolerance Class (e.g., g6)',
            validation: { required: true },
            options: ['f7', 'g6', 'h6', 'k6', 'p6'].map(v => ({ label: v, value: v }))
        }
    ],

    outputs: [
        { key: 'fitType', label: 'Fit Type', unit: '-', formulaLatex: '\\text{Result}', description: 'Resulting fit type.', precision: 0 },
        { key: 'maxClearance', label: 'Max Clearance', unit: 'mm', formulaLatex: 'C_{max}', description: 'Max deviation.', precision: 3 },
        { key: 'minClearance', label: 'Min Clearance', unit: 'mm', formulaLatex: 'C_{min}', description: 'Min deviation.', precision: 3 },
        { key: 'holeTol', label: 'Hole IT', unit: 'mm', formulaLatex: 'IT_{hole}', description: 'Hole Tolerance', precision: 3 },
        { key: 'shaftTol', label: 'Shaft IT', unit: 'mm', formulaLatex: 'IT_{shaft}', description: 'Shaft Tolerance', precision: 3 },
        { key: 'holeES', label: 'Hole ES', unit: 'mm', formulaLatex: 'ES', description: 'Upper Deviation', precision: 3 },
        { key: 'holeEI', label: 'Hole EI', unit: 'mm', formulaLatex: 'EI', description: 'Lower Deviation', precision: 3 },
        { key: 'shaftes', label: 'Shaft es', unit: 'mm', formulaLatex: 'es', description: 'Upper Deviation', precision: 3 },
        { key: 'shaftei', label: 'Shaft ei', unit: 'mm', formulaLatex: 'ei', description: 'Lower Deviation', precision: 3 },
    ],

    calculationEngine: (inputs) => {
        const nom = inputs.nominalSize.value as number;
        const holeClass = inputs.holeClass.value as string; // e.g. "H7"
        const shaftClass = inputs.shaftClass.value as string; // e.g. "g6"

        // ISO 286 fit engine (algorithmic IT grades + fundamental deviations).
        const res = calculateIsoFit(nom, holeClass, shaftClass);

        return {
            outputs: {
                fitType: createValidatedValue(res.fit.type, '-', 'derived'),
                maxClearance: createValidatedValue(res.fit.maxClearance, 'mm', 'derived'),
                minClearance: createValidatedValue(res.fit.minClearance, 'mm', 'derived'),
                holeTol: createValidatedValue(res.hole.tol, 'mm', 'derived'),
                shaftTol: createValidatedValue(res.shaft.tol, 'mm', 'derived'),
                holeES: createValidatedValue(res.hole.ES, 'mm', 'derived'),
                holeEI: createValidatedValue(res.hole.EI, 'mm', 'derived'),
                shaftes: createValidatedValue(res.shaft.es, 'mm', 'derived'),
                shaftei: createValidatedValue(res.shaft.ei, 'mm', 'derived'),
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },

    visualization: {
        type: 'svg-parametric',
        render: (result, inputs) => {
            if (!inputs) return null;

            const nom = Number(inputs.nominalSize?.value ?? inputs.nominalSize) || 50;

            // Get deviation values from OUTPUTS
            const getVal = (key: string) => {
                const val = result.outputs?.[key]?.value;
                if (typeof val === 'number' && Number.isFinite(val)) {
                    return val;
                }
                return 0;
            };

            const ES = getVal('holeES') * 1000;
            const EI = getVal('holeEI') * 1000;
            const es = getVal('shaftes') * 1000;
            const ei = getVal('shaftei') * 1000;

            // Visualization scaling
            const maxDev = Math.max(Math.abs(ES), Math.abs(EI), Math.abs(es), Math.abs(ei));
            // Prevent division by zero or Infinity if maxDev is huge or 0
            const safeMax = (Number.isFinite(maxDev) && maxDev > 0) ? maxDev : 10;
            const scale = 200 / (safeMax * 2 + 10);
            const zeroY = 100;

            const y_ES = zeroY - ES * scale;
            const y_EI = zeroY - EI * scale;

            // Shaft block (Bottom)
            const y_es = zeroY - es * scale;
            const y_ei = zeroY - ei * scale;

            // Format helper
            const fmt = (key: string) => getVal(key).toFixed(3);

            return (
                <svg viewBox="0 0 300 300" style={{ width: '100%', height: '100%' }}>
                    {/* Zero Line */}
                    <line x1="0" y1={zeroY} x2="300" y2={zeroY} stroke="#444" strokeDasharray="5,5" />
                    <text x="290" y={zeroY - 5} fill="#666" textAnchor="end" fontSize="10">Nominal Ø{nom}</text>

                    {/* HOLE Zone (Hatched) */}
                    <defs>
                        <pattern id="hatchHole" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <line stroke="#00e5ff" strokeWidth="1" x1="0" y1="0" x2="0" y2="4" />
                        </pattern>
                        <pattern id="hatchShaft" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                            <line stroke="#f59e0b" strokeWidth="1" x1="0" y1="0" x2="0" y2="4" />
                        </pattern>
                    </defs>

                    {/* Hole Tolerance Band */}
                    <rect x="50" y={Math.min(y_ES, y_EI)} width="100" height={Math.abs(y_EI - y_ES)} fill="url(#hatchHole)" stroke="#00e5ff" opacity="0.8" />
                    {/* Material above Hole */}
                    <rect x="50" y={0} width="100" height={Math.min(y_ES, y_EI)} fill="#0d1f2d" opacity="0.5" />

                    {/* Shaft Tolerance Band */}
                    <rect x="150" y={Math.min(y_es, y_ei)} width="100" height={Math.abs(y_ei - y_es)} fill="url(#hatchShaft)" stroke="#f59e0b" opacity="0.8" />
                    {/* Shaft Body */}
                    <rect x="150" y={Math.max(y_es, y_ei)} width="100" height={300 - Math.max(y_es, y_ei)} fill="#f59e0b" opacity="0.2" />

                    {/* Labels */}
                    <text x="100" y={y_ES - 5} fill="#00e5ff" textAnchor="middle" fontSize="10">ES {fmt('holeES')}</text>
                    <text x="100" y={y_EI + 10} fill="#00e5ff" textAnchor="middle" fontSize="10">EI {fmt('holeEI')}</text>

                    <text x="200" y={y_es - 5} fill="#f59e0b" textAnchor="middle" fontSize="10">es {fmt('shaftes')}</text>
                    <text x="200" y={y_ei + 10} fill="#f59e0b" textAnchor="middle" fontSize="10">ei {fmt('shaftei')}</text>

                </svg>
            );
        }
    },

    documentation: {
        assumptions: [
            { id: 'temp-20', text: 'Standard reference temperature 20°C', impact: 'medium' }
        ],
        standards: [
            { code: 'ISO 286-1', title: 'Geometrical product specifications (GPS) - ISO code system for tolerances on linear sizes' }
        ],
        formulaLatex: 'Fit = Hole_{tol} - Shaft_{tol}'
    },

    tier: 'free'
};

export default fitsTolerancesSchema;
