
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue, ValidatedEngineeringValue } from '@/types/engineering';
import { BOLT_HEAD_DIMENSIONS, BOLT_PROPERTY_CLASSES, getBoltClass } from '@/data/boltNutStandards';

// Helper to get stress area
function calculateStressArea(d: number, P: number): number {
    // As = π/4 * (d - 0.9382 P)^2
    return (Math.PI / 4) * Math.pow(d - 0.9382 * P, 2);
}

const boltStressSchema: CalculatorSchemaV2 = {
    id: 'bolt-stress',
    metadata: {
        title: 'Bolt Tensile Stress Calculator',
        description: 'Calculate tensile stress, proof load, and safety factor for standard metric bolts (ISO 898-1).',
        category: 'mechanical',
        version: '2.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-09',
        tags: ['bolt', 'fastener', 'stress', 'iso-898', 'tensile'],
        verifiedStandards: ['ISO 898-1', 'VDI 2230'],
    },

    inputs: [
        {
            key: 'diameter',
            label: 'Nominal Diameter',
            unit: 'mm',
            defaultValue: 10,
            description: 'Standard metric thread size (M)',
            options: BOLT_HEAD_DIMENSIONS.map(b => ({
                label: `${b.size} (Standard)`,
                value: parseFloat(b.size.replace('M', ''))
            })).filter((v, i, a) => a.findIndex(t => t.value === v.value) === i), // Unique values
            validation: {
                required: true,
                min: 1,
                max: 100
            }
        },
        {
            key: 'pitch',
            label: 'Thread Pitch',
            unit: 'mm',
            defaultValue: 1.5,
            description: 'Distance between threads. Standard coarse pitch is assumed.',
            validation: {
                required: true,
                min: 0.2,
                max: 6
            }
        },
        {
            key: 'load',
            label: 'Axial Load',
            unit: 'kN',
            defaultValue: 20,
            description: 'Applied tensile force on the bolt.',
            validation: {
                required: true,
                min: 0
            }
        },
        {
            key: 'grade',
            label: 'Property Class',
            unit: '-',
            defaultValue: 8.8,
            description: 'ISO 898-1 property class (strength grade).',
            options: BOLT_PROPERTY_CLASSES.filter(c => c.standard === 'ISO').map(c => ({
                label: `Class ${c.class} (${c.material})`,
                value: parseFloat(c.class)
            })),
            validation: {
                required: true
            }
        },
        {
            key: 'length',
            label: 'Bolt Length',
            unit: 'mm',
            defaultValue: 50,
            description: 'Total length of the bolt (for visualization).',
            validation: {
                min: 5,
                max: 1000,
                required: false
            }
        }
    ],

    outputs: [
        {
            key: 'pitchDiameter',
            label: 'Pitch Diameter',
            unit: 'mm',
            formulaLatex: 'd_2 = d - 0.6495 P',
            description: 'Effective diameter of the thread.',
            precision: 3
        },
        {
            key: 'minorDiameter',
            label: 'Minor Diameter',
            unit: 'mm',
            formulaLatex: 'd_1 = d - 1.0825 P',
            description: 'Root diameter of the thread.',
            precision: 3
        },
        {
            key: 'stressArea',
            label: 'Stress Area',
            unit: 'mm2',
            formulaLatex: 'A_s = \\frac{\\pi}{4}(d - 0.9382 P)^2',
            description: 'Tensile stress area.',
            precision: 2,
            affectsGeometry: true
        },
        {
            key: 'tensileStress',
            label: 'Tensile Stress',
            unit: 'MPa',
            formulaLatex: '\\sigma_t = \\frac{F}{A_s}',
            description: 'Actual tensile stress under load.',
            precision: 1,
            warningThreshold: {
                max: 800, // Dynamic based on yield would be better
                message: 'Stress is high.'
            }
        },
        {
            key: 'safetyFactor',
            label: 'Safety Factor',
            unit: '-',
            formulaLatex: 'SF = \\frac{S_y}{\\sigma_t}',
            description: 'Factor of safety against yield.',
            precision: 2,
            warningThreshold: {
                min: 2,
                message: 'Safety factor below 2.0. Consider larger bolt or higher grade.'
            }
        },
        {
            key: 'utilization',
            label: 'Utilization',
            unit: '%',
            formulaLatex: 'U = \\frac{\\sigma_t}{S_p} \\times 100',
            description: 'Percentage of proof load utilized.',
            precision: 1
        }
    ],

    calculationEngine: (inputs) => {
        const d = inputs.diameter.value as number;
        const P = inputs.pitch.value as number;
        const F_kN = inputs.load.value as number;
        const gradeVal = inputs.grade.value as number;

        // Find class properties
        // grade value is number (8.8), but database has strings "8.8"
        const gradeStr = gradeVal.toFixed(1);
        const boltClass = getBoltClass(gradeStr);

        // Standard Pitch Check
        const stdBolt = BOLT_HEAD_DIMENSIONS.find(b => parseFloat(b.size.replace('M', '')) === d);
        const stdPitch = stdBolt ? stdBolt.pitch : undefined;

        // Default strengths if not found (fallback to 8.8)
        const Sy = boltClass ? boltClass.yieldStrengthMin : 640;
        const Sp = boltClass ? (boltClass.yieldStrengthMin * 0.9) : 580; // Proof load approx 90% yield for standard grades

        const F_N = F_kN * 1000;

        // Geometry
        const d2 = d - 0.6495 * P;
        const d1 = d - 1.0825 * P;
        const As = calculateStressArea(d, P);

        // Stress
        const sigma_t = F_N / As;

        // Safety
        const SF = Sy / sigma_t;
        const utilization = (sigma_t / Sp) * 100;

        const warnings: any[] = [];
        if (SF < 1.0) {
            warnings.push({
                field: 'safetyFactor',
                message: 'FAILURE PREDICTED: Stress exceeds yield strength!',
                severity: 'critical'
            });
        }

        if (stdPitch && P !== stdPitch) {
            warnings.push({
                field: 'pitch',
                message: `Non-standard pitch! Standard for M${d} is ${stdPitch}mm.`,
                severity: 'warning'
            });
        }

        const safeValue = (val: number, def: number = 0) => (isNaN(val) || !isFinite(val)) ? def : val;

        return {
            outputs: {
                pitchDiameter: createValidatedValue(safeValue(d2), 'mm', 'derived'),
                minorDiameter: createValidatedValue(safeValue(d1), 'mm', 'derived'),
                stressArea: createValidatedValue(safeValue(As), 'mm2', 'derived'),
                tensileStress: createValidatedValue(safeValue(sigma_t), 'MPa', 'derived'),
                safetyFactor: createValidatedValue(safeValue(SF, 0), '-', 'derived'), // SF can be infinity
                utilization: createValidatedValue(safeValue(utilization), '%', 'derived'),
                standardPitch: createValidatedValue(stdPitch || 0, 'mm', 'derived') // Helping user see correct value
            },
            verified: SF >= 1.0,
            warnings,
            timestamp: Date.now()
        };
    },

    documentation: {
        assumptions: [
            { id: 'material', text: 'Material is isotropic and homogeneous', impact: 'low' },
            { id: 'load', text: 'Load is pure axial tension', impact: 'high' }
        ],
        standards: [
            { code: 'ISO 898-1', title: 'Mechanical properties of fasteners made of carbon steel and alloy steel' }
        ],
        formulaLatex: '\\sigma = F / A_s'
    },

    visualization: {
        type: 'generateBoltSVG', // Matches CalculatorVisualizer mapping
        aspectRatio: 0.6
    },

    tier: 'free'
};

export default boltStressSchema;
