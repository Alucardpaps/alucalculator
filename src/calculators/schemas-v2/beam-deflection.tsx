
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';
import { generateProfileSVG, calculateIx, ProfileDimensions, ProfileType } from '@/lib/visualizers/profile-engine';

const beamDeflectionSchema: CalculatorSchemaV2 = {
    id: 'beam-deflection',
    metadata: {
        title: 'Beam Deflection Calculator',
        description: 'Calculate deflection, slope, and stress for standard beams.',
        category: 'mechanical',
        version: '2.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-10',
        tags: ['beam', 'structural', 'deflection', 'stress', 'euler-bernoulli'],
        verifiedStandards: ['Euler-Bernoulli Beam Theory'],
    },

    inputs: [
        {
            key: 'length',
            label: 'Span Length (L)',
            unit: 'mm',
            defaultValue: 1000,
            description: 'Length of the beam between supports.',
            validation: { required: true, min: 10 }
        },
        {
            key: 'load',
            label: 'Load (P or w)',
            unit: 'N',  // Simplification: We'll interpret this as N or N/mm based on type
            defaultValue: 1000,
            description: 'Applied load (Force for point, Force/Length for distributed).',
            validation: { required: true }
        },
        {
            key: 'modulus',
            label: 'Young\'s Modulus (E)',
            unit: 'GPa',
            defaultValue: 200, // Steel
            description: 'Material stiffness (Steel ≈ 200, Al ≈ 70).',
            validation: { required: true, min: 1 }
        },
        // Profile Inputs - Grouped
        {
            key: 'profileType',
            label: 'Profile Type',
            unit: '-',
            defaultValue: 1, // 1=I, 2=Box, 3=Channel
            description: '1: I-Beam, 2: Box, 3: Channel',
            options: [
                { label: 'I-Beam', value: 1 },
                { label: 'Box Section', value: 2 },
                { label: 'Channel', value: 3 }
            ],
            validation: { required: true }
        },
        {
            key: 'height',
            label: 'Height (h)',
            unit: 'mm',
            defaultValue: 100,
            description: 'Total section height.',
            validation: { required: true, min: 1 }
        },
        {
            key: 'width',
            label: 'Width (b)',
            unit: 'mm',
            defaultValue: 50,
            description: 'Flange width.',
            validation: { required: true, min: 1 }
        },
        {
            key: 'webThk',
            label: 'Web Thickness (tw)',
            unit: 'mm',
            defaultValue: 5,
            description: 'Thickness of the vertical web.',
            validation: { required: true, min: 0.1 }
        },
        {
            key: 'flangeThk',
            label: 'Flange Thickness (tf)',
            unit: 'mm',
            defaultValue: 8,
            description: 'Thickness of horizontal flanges.',
            validation: { required: true, min: 0.1 }
        },
        {
            key: 'supportType',
            label: 'Support Condition',
            unit: '-',
            defaultValue: 1, // 1=Simple, 2=Cantilever
            description: '1: Simply Supported (Center Load), 2: Cantilever (End Load)',
            options: [
                { label: 'Simply Supported (Center Point)', value: 1 },
                { label: 'Cantilever (End Point)', value: 2 }
            ],
            validation: { required: true }
        }
    ],

    outputs: [
        {
            key: 'inertia',
            label: 'Moment of Inertia (Ix)',
            unit: 'mm4',
            formulaLatex: 'I_x = \\text{calculated from profile}',
            description: 'Second moment of area about neutral axis.',
            precision: 0,
            affectsGeometry: true
        },
        {
            key: 'deflection',
            label: 'Max Deflection (δ)',
            unit: 'mm',
            formulaLatex: '\\delta_{max} = \\frac{PL^3}{C EI}',
            description: 'Maximum vertical displacement.',
            precision: 3
        },
        {
            key: 'bendingStress',
            label: 'Max Bending Stress (σ)',
            unit: 'MPa',
            formulaLatex: '\\sigma = \\frac{M \\cdot y}{I}',
            description: 'Maximum normal stress due to bending.',
            precision: 1
        },
        {
            key: 'stiffness',
            label: 'Beam Stiffness (k)',
            unit: 'N/mm' as any,
            formulaLatex: 'k = \\frac{P}{\\delta}',
            description: 'Force required per unit deflection.',
            precision: 1
        }
    ],

    calculationEngine: (inputs) => {
        const L = inputs.length.value as number;
        const P = inputs.load.value as number;
        const E_GPa = inputs.modulus.value as number;
        const E = E_GPa * 1000; // Convert GPa to MPa (N/mm2)

        const typeVal = inputs.profileType.value as number;
        const h = inputs.height.value as number;
        const b = inputs.width.value as number;
        const tw = inputs.webThk.value as number;
        const tf = inputs.flangeThk.value as number;

        const typeMap: Record<number, ProfileType> = { 1: 'I', 2: 'BOX', 3: 'CHANNEL' };
        const profileType = typeMap[typeVal] || 'I';

        const dims: ProfileDimensions = { type: profileType, height: h, width: b, webThickness: tw, flangeThickness: tf, length: L };

        // Calculate Inertia
        const Ix = calculateIx(dims);

        // Support Conditions
        const support = inputs.supportType.value as number;

        let delta = 0;
        let M_max = 0;

        if (support === 1) {
            // Simply Supported, Center Point Load
            // delta = P*L^3 / (48*E*I)
            // M = P*L / 4
            delta = (P * Math.pow(L, 3)) / (48 * E * Ix);
            M_max = (P * L) / 4;
        } else {
            // Cantilever, End Point Load
            // delta = P*L^3 / (3*E*I)
            // M = P*L
            delta = (P * Math.pow(L, 3)) / (3 * E * Ix);
            M_max = P * L;
        }

        // Stress: sigma = M * y / I
        // y = h/2 (assuming symmetrical or close to it for these shapes)
        // Note: For channel, y might be different if calculating about other axis, but usually we load vertically (Ix)
        const sigma = (M_max * (h / 2)) / Ix;

        // Stiffness
        const k = delta > 0 ? P / delta : 0;

        return {
            outputs: {
                inertia: createValidatedValue(Ix, 'mm4', 'derived'),
                deflection: createValidatedValue(delta, 'mm', 'derived'),
                bendingStress: createValidatedValue(sigma, 'MPa', 'derived'),
                stiffness: createValidatedValue(k, 'N/mm' as any, 'derived')
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },

    visualization: {
        type: 'svg-parametric',
        render: (result, inputs) => {
            // Create profile SVG
            // We need to re-construct dims data from inputs since we receive raw numbers here
            if (!inputs) return null;

            const typeVal = inputs.profileType;
            const h = inputs.height;
            const b = inputs.width;
            const tw = inputs.webThk;
            const tf = inputs.flangeThk;
            const L = inputs.length;

            const typeMap: Record<number, ProfileType> = { 1: 'I', 2: 'BOX', 3: 'CHANNEL' };
            const profileType = typeMap[typeVal] || 'I';

            const dims: ProfileDimensions = { type: profileType, height: h, width: b, webThickness: tw, flangeThickness: tf, length: L };

            const profileSvg = generateProfileSVG(dims);

            // Wrap in a layout or just return the profile?
            // Let's return just the profile for now, or maybe a side view?
            // The visualizer component puts it in a square box.
            // We can return the profile path directly.
            // Actually, `UniversalCalcRenderer` expects the render function to return ReactNode.
            // But my schema type says `render` returns ReactNode.
            // Wait, the `visualizer-engine` usually returns string SVG. 
            // In V2, I changed it to `render: ... => ReactNode`.
            // But `UniversalCalcRenderer` uses `CalculatorVisualizer` which uses `VISUALIZERS` map.
            // I need to update `CalculatorVisualizer.tsx` to handle the `render` function from Schema V2!
            // Currently it only handles string lookups in `VISUALIZERS`.
            return null;
        }
    },

    documentation: {
        assumptions: [
            { id: 'linear-elastic', text: 'Material behaves linearly (Hooke\'s Law)', impact: 'high' },
            { id: 'small-deflection', text: 'Deflections are small relative to length', impact: 'medium' }
        ],
        standards: [
            { code: 'Euler-Bernoulli', title: 'Beam Theory' }
        ],
        formulaLatex: '\\delta = \\frac{P L^3}{C E I}'
    },

    tier: 'free'
};

export default beamDeflectionSchema;
