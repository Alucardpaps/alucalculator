
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';
import { BOLT_HEAD_DIMENSIONS, BOLT_PROPERTY_CLASSES, THREAD_STANDARDS } from '@/data/boltNutStandards';
import { computeBoltAssembly } from '@/lib/fastener/sharedEngine';

const fastenerSelectionSchema: CalculatorSchemaV2 = {
    id: 'fasteners',
    metadata: {
        title: 'Fastener Selection Calculator',
        description: 'Calculate tightening torque, preload, and joint clamping force (VDI 2230 simplified).',
        category: 'mechanical',
        version: '2.0.0',
        author: 'AluCAD Engineering',
        lastUpdated: '2026-02-09',
        tags: ['bolt', 'torque', 'preload', 'clamp-force', 'vdi-2230'],
        verifiedStandards: ['VDI 2230', 'ISO 898-1'],
    },

    inputs: [
        {
            key: 'diameter',
            label: 'Thread Size (M)',
            unit: 'mm',
            defaultValue: 10,
            description: 'Metric thread size.',
            options: BOLT_HEAD_DIMENSIONS.map(b => ({
                label: `${b.size}`,
                value: parseFloat(b.size.replace('M', ''))
            })).filter((v, i, a) => a.findIndex(t => t.value === v.value) === i),
            validation: {
                required: true,
                min: 3,
                max: 64
            }
        },
        {
            key: 'pitch',
            label: 'Thread Pitch',
            unit: 'mm',
            defaultValue: 1.5,
            description: 'Axial distance between threads.',
            validation: {
                required: true,
                min: 0.35,
                max: 6
            }
        },
        {
            key: 'propertyClass',
            label: 'Property Class',
            unit: '-',
            defaultValue: 8.8,
            description: 'Bolt grade (strength class).',
            options: BOLT_PROPERTY_CLASSES.filter(c => c.standard === 'ISO').map(c => ({
                label: `Class ${c.class}`,
                value: parseFloat(c.class)
            })),
            validation: {
                required: true
            }
        },
        {
            key: 'friction',
            label: 'Friction Coefficient',
            unit: '-',
            defaultValue: 0.14,
            description: 'Total friction (thread + head). Oiled ≈ 0.12, Dry ≈ 0.15-0.18.',
            validation: {
                required: true,
                min: 0.08,
                max: 0.3
            }
        },
        {
            key: 'utilization',
            label: 'Preload Utilization',
            unit: '%',
            defaultValue: 90,
            description: 'Target % of yield strength for preload (typically 90%).',
            validation: {
                required: true,
                min: 50,
                max: 100
            }
        },
        {
            key: 'length',
            label: 'Bolt Length',
            unit: 'mm',
            defaultValue: 40,
            description: 'Total bolt length (for visualization).',
            validation: {
                required: false,
                min: 5
            }
        }
    ],

    outputs: [
        {
            key: 'pitchDiameter',
            label: 'Pitch Diameter',
            unit: 'mm',
            formulaLatex: 'd_2 = d - 0.6495 P',
            description: 'Effective thread diameter.',
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
            key: 'preloadForce',
            label: 'Target Preload (Fp)',
            unit: 'kN',
            formulaLatex: 'F_p = \\nu \\cdot R_{p0.2} \\cdot A_s',
            description: 'Assembly preload force.',
            precision: 2
        },
        {
            key: 'tighteningTorque',
            label: 'Tightening Torque',
            unit: 'Nm',
            formulaLatex: 'M_A = F_p \\cdot [0.16P + 0.58d_2\\mu_G + \\frac{D_{Km}}{2}\\mu_K]',
            description: 'Required assembly torque (simplified approximation K=0.2).',
            precision: 1
        },
        {
            key: 'yieldStrength',
            label: 'Yield Strength',
            unit: 'MPa',
            formulaLatex: 'R_{p0.2}',
            description: 'Material yield strength.',
            precision: 0
        }
    ],

    calculationEngine: (inputs) => {
        const d = inputs.diameter.value as number;
        const P = inputs.pitch.value as number;
        const gradeVal = inputs.propertyClass.value as number;
        const mu = inputs.friction.value as number;
        const v = (inputs.utilization.value as number) / 100;

        // Same solver as the /bolt-torque module (VDI 2230 torque split with ISO 4014 bearing face
        // and ISO 273 medium clearance hole, ISO 898-1 strengths). ν applies to Rp0.2 here.
        const gradeStr = gradeVal.toFixed(1);
        const coarseSize = `M${d}`;
        const isCoarse = THREAD_STANDARDS.some((t) => t.type === 'Metric Coarse' && t.size === coarseSize && Math.abs((t.pitch ?? 0) - P) < 1e-6);
        const solved = computeBoltAssembly({
            threadStandard: isCoarse ? 'Metric Coarse' : 'Custom',
            size: isCoarse ? coarseSize : `Custom ${d}`,
            customDia: d,
            pitch: P,
            grade: gradeStr,
            muThread: mu,
            muHead: mu,
            yieldUtilization: v * 100,
            useProofStress: false,
        });
        const d2 = solved.d2;
        const As = solved.As;
        const Sy = solved.Sy;
        const Fp_kN = solved.Fm_max;
        const Ma_Nm = solved.MA;

        return {
            outputs: {
                pitchDiameter: createValidatedValue(d2, 'mm', 'derived'),
                stressArea: createValidatedValue(As, 'mm2', 'derived'),
                preloadForce: createValidatedValue(Fp_kN, 'kN', 'derived'),
                tighteningTorque: createValidatedValue(Ma_Nm, 'Nm', 'derived'),
                yieldStrength: createValidatedValue(Sy, 'MPa', 'derived')
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },

    documentation: {
        assumptions: [
            { id: 'friction', text: 'Friction coefficient is constant', impact: 'medium' },
            { id: 'k-factor', text: 'Simplified torque coefficient K used', impact: 'medium' }
        ],
        standards: [
            { code: 'VDI 2230', title: 'Systematic calculation of high duty bolted joints' }
        ],
        formulaLatex: 'M_A = F_M \\left(0.16P + 0.58 d_2 \\mu_G + \\tfrac{D_{Km}}{2} \\mu_K\\right)'
    },

    visualization: {
        type: 'generateBoltSVG', // Matches CalculatorVisualizer
        aspectRatio: 0.6
    },

    tier: 'free'
};

export default fastenerSelectionSchema;
