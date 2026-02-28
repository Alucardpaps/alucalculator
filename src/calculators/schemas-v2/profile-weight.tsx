
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';
import { generateProfileSVG, ProfileDimensions, ProfileType } from '@/lib/visualizers/profile-engine';

const profileWeightSchema: CalculatorSchemaV2 = {
    id: 'profile-weight',
    metadata: {
        title: 'Profile Weight Calculator',
        description: 'Calculate weight and cost for standard engineering profiles.',
        category: 'fabrication',
        version: '2.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-10',
        tags: ['weight', 'cost', 'profile', 'materials'],
        verifiedStandards: [],
    },

    inputs: [
        {
            key: 'material',
            label: 'Material',
            unit: '-',
            defaultValue: 1, // 1=Steel, 2=Alu, 3=SS
            description: 'Material density selection.',
            options: [
                { label: 'Steel (7850 kg/m3)', value: 1 },
                { label: 'Aluminum (2700 kg/m3)', value: 2 },
                { label: 'Stainless Steel (7900 kg/m3)', value: 3 },
                { label: 'Custom', value: 4 }
            ],
            validation: { required: true }
        },
        {
            key: 'customDensity',
            label: 'Custom Density',
            unit: 'kg', // kg/m3
            defaultValue: 1000,
            description: 'Density in kg/m3 (only if Custom selected).',
            validation: { required: false, min: 1 }
        },
        {
            key: 'profileType',
            label: 'Profile Type',
            unit: '-',
            defaultValue: 1,
            description: 'Shape of the profile.',
            options: [
                { label: 'I-Beam', value: 1 },
                { label: 'Box Section', value: 2 },
                { label: 'Channel', value: 3 },
                { label: 'Angle', value: 4 }
            ],
            validation: { required: true }
        },
        {
            key: 'height',
            label: 'Height (h)',
            unit: 'mm',
            defaultValue: 100,
            description: 'Overall height.',
            validation: { required: true, min: 1 }
        },
        {
            key: 'width',
            label: 'Width (b)',
            unit: 'mm',
            defaultValue: 50,
            description: 'Overall width.',
            validation: { required: true, min: 1 }
        },
        {
            key: 'thickness1',
            label: 'Web/Thickness 1',
            unit: 'mm',
            defaultValue: 5,
            description: 'Web thickness or primary thickness.',
            validation: { required: true, min: 0.1 }
        },
        {
            key: 'thickness2',
            label: 'Flange/Thickness 2',
            unit: 'mm',
            defaultValue: 8,
            description: 'Flange thickness (if applicable).',
            validation: { required: true, min: 0.1 }
        },
        {
            key: 'length',
            label: 'Length (L)',
            unit: 'mm',
            defaultValue: 1000,
            description: 'Total length of the profile.',
            validation: { required: true, min: 1 }
        },
        {
            key: 'costPerKg',
            label: 'Cost per kg',
            unit: 'ratio', // Currency/kg - using ratio as placeholder
            defaultValue: 1.5,
            description: 'Material cost per unit weight.',
            validation: { required: false, min: 0 }
        }
    ],

    outputs: [
        {
            key: 'weight',
            label: 'Total Weight',
            unit: 'kg',
            formulaLatex: 'W = V \\cdot \\rho',
            description: 'Total mass of the profile.',
            precision: 2
        },
        {
            key: 'area',
            label: 'Cross-Section Area',
            unit: 'mm2',
            formulaLatex: 'A = \\text{shape area}',
            description: 'Cross-sectional area.',
            precision: 0
        },
        {
            key: 'volume',
            label: 'Total Volume',
            unit: 'mm3',
            formulaLatex: 'V = A \\cdot L',
            description: 'Total material volume.',
            precision: 0
        },
        {
            key: 'totalCost',
            label: 'Total Cost',
            unit: '-', // Currency
            formulaLatex: 'C = W \\cdot \\text{Rate}',
            description: 'Estimated material cost.',
            precision: 2
        }
    ],

    calculationEngine: (inputs) => {
        const matType = inputs.material.value as number;
        let rho = 0;
        switch (matType) {
            case 1: rho = 7850; break;
            case 2: rho = 2700; break;
            case 3: rho = 7900; break;
            case 4: rho = inputs.customDensity.value as number; break;
            default: rho = 7850;
        }

        const typeVal = inputs.profileType.value as number;
        const h = inputs.height.value as number;
        const b = inputs.width.value as number;
        const t1 = inputs.thickness1.value as number; // Web
        const t2 = inputs.thickness2.value as number; // Flange
        const L = inputs.length.value as number;
        const costRate = inputs.costPerKg.value as number;

        // Area Calculation
        let Area = 0; // mm2

        switch (typeVal) {
            case 1: // I-Beam
                // Flanges: 2 * b * t2
                // Web: (h - 2*t2) * t1
                Area = (2 * b * t2) + ((h - 2 * t2) * t1);
                break;
            case 2: // Box
                // Outer - Inner
                // Outer: b*h
                // Inner: (b-2*t1)*(h-2*t2) -- assuming t1=vertical thk, t2=horiz thk
                // Or simplified uniform thickness if user inputs match. 
                // Let's assume t1 is uniform thickness for Box if t2 is not clear, but we have 2 inputs.
                // Let's assume t1 = web (vertical sides), t2 = flange (horiz sides)
                const innerH = h - 2 * t2;
                const innerB = b - 2 * t1;
                Area = (b * h) - (innerB > 0 && innerH > 0 ? innerB * innerH : 0);
                break;
            case 3: // Channel
                // Flanges: 2 * b * t2
                // Web: (h - 2*t2) * t1 
                // Wait, Channel width `b` includes web thickness? Yes.
                // Area = h*t1 + 2*(b-t1)*t2
                Area = (h * t1) + 2 * (b - t1) * t2;
                break;
            case 4: // Angle
                // Leg 1: h * t1
                // Leg 2: (b - t1) * t2
                Area = (h * t1) + (b - t1) * t2;
                break;
        }

        const Volume_mm3 = Area * L;
        const Volume_m3 = Volume_mm3 / 1e9;

        const Weight_kg = Volume_m3 * rho;
        const Cost = Weight_kg * costRate;

        return {
            outputs: {
                weight: createValidatedValue(Weight_kg, 'kg', 'derived'),
                area: createValidatedValue(Area, 'mm2', 'derived'),
                volume: createValidatedValue(Volume_mm3, 'mm3', 'derived'),
                totalCost: createValidatedValue(Cost, '-', 'derived')
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

            const typeVal = inputs.profileType; // 1..4
            // Map to ProfileType string
            const typeMap: Record<number, ProfileType> = { 1: 'I', 2: 'BOX', 3: 'CHANNEL', 4: 'ANGLE' };
            const pType = typeMap[typeVal] || 'I';

            const dims: ProfileDimensions = {
                type: pType,
                height: inputs.height,
                width: inputs.width,
                webThickness: inputs.thickness1,
                flangeThickness: inputs.thickness2,
                length: inputs.length
            };

            const svgPath = generateProfileSVG(dims);

            return (
                <svg viewBox="-100 -100 200 200" style={{ width: '100%', height: '100%' }}>
                    <g dangerouslySetInnerHTML={{ __html: svgPath }} />
                </svg>
            );
        }
    },

    documentation: {
        assumptions: [],
        standards: [],
        formulaLatex: 'W = A \\cdot L \\cdot \\rho'
    },

    tier: 'free'
};

export default profileWeightSchema;
