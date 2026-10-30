
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
        author: 'AluCAD Engineering',
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
            const typeMap: Record<number, ProfileType> = { 1: 'I', 2: 'BOX', 3: 'CHANNEL', 4: 'ANGLE' };
            const pType = typeMap[typeVal] || 'I';

            const dims: ProfileDimensions = {
                type: pType,
                height: inputs.height || 100,
                width: inputs.width || 50,
                webThickness: inputs.thickness1 || 5,
                flangeThickness: inputs.thickness2 || 8,
                length: inputs.length || 1000
            };

            const maxDim = Math.max(dims.width, dims.height, 10);
            const scale = 140 / maxDim;
            const w = dims.width * scale;
            const h = dims.height * scale;
            const tw = dims.webThickness * scale;
            const tf = dims.flangeThickness * scale;

            return (
                <svg viewBox="-150 -130 300 260" className="w-full h-full min-h-[300px]" style={{ background: 'var(--bg-0)' }}>
                    <defs>
                        <pattern id="pw-hatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="8" stroke="#00e5ff" strokeWidth="1" opacity="0.3" />
                        </pattern>
                        <marker id="pw-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0,1.5 L 9,5 L 0,8.5 Z" fill="#00e5ff" />
                        </marker>
                    </defs>

                    {/* Blueprint grid lines */}
                    {[-120, -80, -40, 0, 40, 80, 120].map(x => (
                        <line key={`v${x}`} x1={x} y1={-120} x2={x} y2={120} stroke="#00e5ff" strokeWidth="0.5" opacity="0.05" />
                    ))}
                    {[-100, -60, -20, 20, 60, 100].map(y => (
                        <line key={`h${y}`} x1={-140} y1={y} x2={140} y2={y} stroke="#00e5ff" strokeWidth="0.5" opacity="0.05" />
                    ))}

                    {/* Center Axes */}
                    <line x1={-130} y1={0} x2={130} y2={0} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="8 3 2 3" opacity="0.5" />
                    <line x1={0} y1={-110} x2={0} y2={110} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="8 3 2 3" opacity="0.5" />

                    {/* Profile Contour */}
                    {pType === 'I' && (
                        <path
                            d={`
                                M ${-w/2} ${-h/2} L ${w/2} ${-h/2} L ${w/2} ${-h/2 + tf} L ${tw/2} ${-h/2 + tf}
                                L ${tw/2} ${h/2 - tf} L ${w/2} ${h/2 - tf} L ${w/2} ${h/2} L ${-w/2} ${h/2}
                                L ${-w/2} ${h/2 - tf} L ${-tw/2} ${h/2 - tf} L ${-tw/2} ${-h/2 + tf} L ${-w/2} ${-h/2 + tf} Z
                            `}
                            fill="url(#pw-hatch)" stroke="#00e5ff" strokeWidth="2"
                        />
                    )}

                    {pType === 'BOX' && (
                        <path
                            d={`
                                M ${-w/2} ${-h/2} L ${w/2} ${-h/2} L ${w/2} ${h/2} L ${-w/2} ${h/2} Z
                                M ${-w/2 + tw} ${-h/2 + tf} L ${w/2 - tw} ${-h/2 + tf} L ${w/2 - tw} ${h/2 - tf} L ${-w/2 + tw} ${h/2 - tf} Z
                            `}
                            fillRule="evenodd" fill="url(#pw-hatch)" stroke="#00e5ff" strokeWidth="2"
                        />
                    )}

                    {pType === 'CHANNEL' && (
                        <path
                            d={`
                                M ${-w/2} ${-h/2} L ${w/2} ${-h/2} L ${w/2} ${-h/2 + tf} L ${-w/2 + tw} ${-h/2 + tf}
                                L ${-w/2 + tw} ${h/2 - tf} L ${w/2} ${h/2 - tf} L ${w/2} ${h/2} L ${-w/2} ${h/2} Z
                            `}
                            fill="url(#pw-hatch)" stroke="#00e5ff" strokeWidth="2"
                        />
                    )}

                    {pType === 'ANGLE' && (
                        <path
                            d={`
                                M ${-w/2} ${h/2} L ${w/2} ${h/2} L ${w/2} ${h/2 - tf} L ${-w/2 + tw} ${h/2 - tf}
                                L ${-w/2 + tw} ${-h/2} L ${-w/2} ${-h/2} Z
                            `}
                            fill="url(#pw-hatch)" stroke="#00e5ff" strokeWidth="2"
                        />
                    )}

                    {/* Dimensions */}
                    <line x1={-w/2} y1={-h/2 - 14} x2={w/2} y2={-h/2 - 14} stroke="#00e5ff" strokeWidth="1" markerStart="url(#pw-arr)" markerEnd="url(#pw-arr)" />
                    <text x={0} y={-h/2 - 18} textAnchor="middle" fill="#00e5ff" fontSize="9" fontWeight="bold" fontFamily="monospace">{dims.width} mm</text>

                    <line x1={w/2 + 16} y1={-h/2} x2={w/2 + 16} y2={h/2} stroke="#00e5ff" strokeWidth="1" markerStart="url(#pw-arr)" markerEnd="url(#pw-arr)" />
                    <text x={w/2 + 22} y={3} fill="#00e5ff" fontSize="9" fontWeight="bold" fontFamily="monospace">{dims.height} mm</text>

                    {/* Center of Gravity */}
                    <circle cx="0" cy="0" r="3.5" fill="#f59e0b" stroke="#02050c" strokeWidth="1" />
                    <text x="6" y="-4" fill="#f59e0b" fontSize="8" fontWeight="bold" fontFamily="monospace">G</text>
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
