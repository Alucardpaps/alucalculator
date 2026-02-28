
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';
import { CalculationEngine } from '@/lib/CalculationEngine';
import { MATERIALS_DB } from '@/data/materialsData';

const sheetMetalSchema: CalculatorSchemaV2 = {
    id: 'sheet-metal',
    metadata: {
        title: 'Sheet Metal Bending (Deterministic)',
        description: 'Advanced bend analysis using dynamic K-Factor and material-aware validation.',
        category: 'fabrication',
        version: '3.0.0',
        author: 'AluCalc OS Core',
        lastUpdated: '2026-02-25',
        tags: ['bending', 'sheet-metal', 'k-factor', 'fabrication', 'deterministic'],
        verifiedStandards: ['DIN 6935', 'ASTM B209'],
    },

    inputs: [
        {
            key: 'materialName',
            label: 'Material Alloy',
            unit: '-',
            defaultValue: '6061-T6 (US Standard)',
            description: 'Select material to pull engineering properties.',
            validation: { required: true },
            // In a real V2 UI, this would render a dropdown
            options: MATERIALS_DB.map(m => ({ label: m.name, value: m.name }))
        },
        {
            key: 'thickness',
            label: 'Material Thickness (t)',
            unit: 'mm',
            defaultValue: 3,
            description: 'Sheet metal thickness (max 50mm).',
            validation: { required: true, min: 0.1, max: 50 }
        },
        {
            key: 'radius',
            label: 'Inside Bend Radius (R)',
            unit: 'mm',
            defaultValue: 3,
            description: 'Internal radius of the bend.',
            validation: { required: true, min: 0.1, max: 500 }
        },
        {
            key: 'angle',
            label: 'Bend Angle (theta)',
            unit: 'deg',
            defaultValue: 90,
            description: 'Angle of the bend.',
            validation: { required: true, min: 0, max: 180 }
        }
    ],

    outputs: [
        {
            key: 'bendAllowance',
            label: 'Bend Allowance (BA)',
            unit: 'mm',
            formulaLatex: 'BA = \\frac{\\pi A}{180}(R + K t)',
            description: 'Arc length of the bend at neutral axis.',
            precision: 4
        },
        {
            key: 'bendDeduction',
            label: 'Bend Deduction (BD)',
            unit: 'mm',
            formulaLatex: 'BD = 2(OSS) - BA',
            description: 'Amount to subtract from total flange lengths.',
            precision: 4
        },
        {
            key: 'kFactorApplied',
            label: 'Calculated K-Factor',
            unit: '-',
            formulaLatex: 'K = f(R/t)',
            description: 'Dynamically determined based on R/t ratio.',
            precision: 3
        },
        {
            key: 'outsideSetback',
            label: 'Outside Setback (OSSB)',
            unit: 'mm',
            formulaLatex: 'OSS = (R+t) \\tan(A/2)',
            description: 'Distance from tangent point to apex outside.',
            precision: 4
        }
    ],

    calculationEngine: (inputs) => {
        const mat = inputs.materialName.value as string;
        const t = inputs.thickness.value as number;
        const R = inputs.radius.value as number;
        const A = inputs.angle.value as number;

        const engine = new CalculationEngine(mat);
        const result = engine.calculateSheetMetalBend(t, R, A);

        return {
            outputs: {
                bendAllowance: createValidatedValue(result.bendAllowance, 'mm', 'derived'),
                bendDeduction: createValidatedValue(result.bendDeduction, 'mm', 'derived'),
                kFactorApplied: createValidatedValue(result.kFactor, '-', 'derived'),
                outsideSetback: createValidatedValue(result.outsideSetback, 'mm', 'derived')
            },
            verified: true,
            warnings: result.warnings.map(w => ({
                field: 'radius',
                message: w,
                severity: 'warning' as const
            })),
            timestamp: Date.now()
        };
    },

    visualization: {
        type: 'svg-parametric',
        render: (result, inputs) => {
            if (!inputs) return null;

            const t = Number(inputs.thickness) || 3;
            const R = Number(inputs.radius) || 3;
            const A = Number(inputs.angle) || 90;
            const isUnsafe = R < t;

            // Simple visualization with safety warning
            return (
                <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', backgroundColor: '#050505' }}>
                    <defs>
                        <linearGradient id="metal-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#333" />
                            <stop offset="50%" stopColor="#666" />
                            <stop offset="100%" stopColor="#333" />
                        </linearGradient>
                    </defs>

                    {/* Background Grid */}
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#ffffff05" strokeWidth="0.5" />
                    </pattern>
                    <rect width="200" height="200" fill="url(#grid)" />

                    {/* Bend Path */}
                    <path
                        d={`M 50 150 L 100 150 Q ${100 + R} 150 ${100 + R} ${150 - R} L ${100 + R} 50`}
                        fill="none"
                        stroke={isUnsafe ? "#ff3d00" : "#00e5ff"}
                        strokeWidth={t}
                        strokeLinecap="round"
                    />

                    {/* Labels */}
                    <g filter="drop-shadow(0 2px 2px rgba(0,0,0,0.5))">
                        <text x="10" y="20" fill="#888" fontSize="8" fontFamily="monospace">DETERMINISTIC SOLVER v3.0</text>
                        <text x="70" y="160" fill="#fff" fontSize="10">t={t}mm</text>
                        <text x="115" y="145" fill={isUnsafe ? "#ff3d00" : "#fff"} fontSize="10">R={R}mm</text>
                        {isUnsafe && (
                            <text x="10" y="185" fill="#ff3d00" fontSize="10" fontWeight="bold">⚠️ CRACKING RISK: R &lt; t</text>
                        )}
                    </g>
                </svg>
            );
        }
    },

    documentation: {
        assumptions: [
            { id: 'asm-1', text: 'Homogeneous material properties', impact: 'low' },
            { id: 'asm-2', text: 'Isotropic behavior', impact: 'low' },
            { id: 'asm-3', text: 'Neutral axis shifts towards inner radius during bending', impact: 'medium' }
        ],
        standards: [
            { code: 'DIN 6935', title: 'Cold bending of flat steel products' },
            { code: 'ASTM B209', title: 'Standard Specification for Aluminum Alloy Sheet and Plate' }
        ],
        formulaLatex: 'BA = \\frac{\\pi A}{180}(R + K t)'
    },

    tier: 'free'
};

export default sheetMetalSchema;
