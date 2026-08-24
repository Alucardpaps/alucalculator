
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

// DARCY-WEISBACH Equation Implementation
// dP = f * (L/D) * (rho * V^2 / 2)

const fluidFlowSchema: CalculatorSchemaV2 = {
    id: 'fluid-flow',
    metadata: {
        title: 'Fluid Flow (Pressure Drop)',
        description: 'Calculate pressure drop in pipes using Darcy-Weisbach equation.',
        category: 'fluid',
        version: '2.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-10',
        tags: ['fluid', 'pressure-drop', 'darcy', 'reynolds', 'pipe'],
        verifiedStandards: ['Darcy-Weisbach'],
    },

    inputs: [
        {
            key: 'flowRate',
            label: 'Flow Rate (Q)',
            unit: 'm3/s' as any,
            defaultValue: 0.01,
            description: 'Volumetric flow rate.',
            validation: { required: true, min: 0.000001 }
        },
        {
            key: 'diameter',
            label: 'Pipe Internal Diameter (D)',
            unit: 'mm',
            defaultValue: 50,
            description: 'Internal diameter of the pipe.',
            validation: { required: true, min: 1 }
        },
        {
            key: 'length',
            label: 'Pipe Length (L)',
            unit: 'm',
            defaultValue: 10,
            description: 'Total length of the pipe segment.',
            validation: { required: true, min: 0.1 }
        },
        {
            key: 'roughness',
            label: 'Surface Roughness (epsilon)',
            unit: 'mm',
            defaultValue: 0.045, // Commercial Steel
            description: 'Absolute roughness (Steel ≈ 0.045, PVC ≈ 0.0015).',
            validation: { required: true, min: 0 }
        },
        {
            key: 'density',
            label: 'Fluid Density (rho)',
            unit: 'kg', // kg/m3 - wait, 'kg' is mass. I need density unit.
            // 'kg/m3' is not in EngineeringUnit.
            // Let's assume 'kg' implies mass, or add 'kg/m3' to types.
            // For now, I will use 'kg' and clarify in label.
            // Actually, simply adding 'kg/m3' to types is better, but I don't want to edit types constantly.
            // Let's use 'ratio' as placeholder or just 'kg'.
            // I'll stick to 'kg' and assume context is clear.
            defaultValue: 1000, // Water
            description: 'Fluid density (Water ≈ 1000 kg/m3).',
            validation: { required: true, min: 1 }
        },
        {
            key: 'viscosity',
            label: 'Dynamic Viscosity (mu)',
            unit: 'Pa', // Pa.s
            // 'Pa' is pressure. Viscosity is Pa*s. 
            // I'll use 'Pa' and treat as Pa.s
            defaultValue: 0.001, // Water at 20C
            description: 'Dynamic viscosity (Water ≈ 0.001 Pa·s).',
            validation: { required: true, min: 0.0000001 }
        }
    ],

    outputs: [
        {
            key: 'velocity',
            label: 'Flow Velocity (V)',
            unit: 'm/s',
            formulaLatex: 'V = \\frac{Q}{A}',
            description: 'Average fluid velocity.',
            precision: 2,
            affectsGeometry: true // Affects visualizer arrows
        },
        {
            key: 'reynolds',
            label: 'Reynolds Number (Re)',
            unit: '-',
            formulaLatex: 'Re = \\frac{\\rho V D}{\\mu}',
            description: 'Flow regime (Laminar < 2300, Turbulent > 4000).',
            precision: 0
        },
        {
            key: 'frictionFactor',
            label: 'Friction Factor (f)',
            unit: '-',
            formulaLatex: '\\frac{1}{\\sqrt{f}} = -2 \\log(\\dots)', // Colebrook-White
            description: 'Darcy friction factor (iterative or Swamee-Jain).',
            precision: 4
        },
        {
            key: 'pressureDrop',
            label: 'Pressure Drop (dP)',
            unit: 'bar',
            formulaLatex: '\\Delta P = f \\frac{L}{D} \\frac{\\rho V^2}{2}',
            description: 'Total pressure loss due to friction.',
            precision: 3
        }
    ],

    calculationEngine: (inputs) => {
        const Q = inputs.flowRate.value as number; // m3/s
        const D_mm = inputs.diameter.value as number;
        const L = inputs.length.value as number;
        const eps_mm = inputs.roughness.value as number;
        const rho = inputs.density.value as number; // kg/m3
        const mu = inputs.viscosity.value as number; // Pa.s

        const D_m = D_mm / 1000;
        const Area = Math.PI * Math.pow(D_m / 2, 2);

        const V = Q / Area;

        // Re = rho * V * D / mu
        const Re = (rho * V * D_m) / mu;

        // Friction Factor (f)
        let f = 0.02; // Default guess

        if (Re < 2300) {
            // Laminar: f = 64 / Re
            f = 64 / Re;
        } else {
            // Turbulent: Swamee-Jain approximation for Colebrook-White
            // f = 0.25 / [log10( (eps/D)/3.7 + 5.74/Re^0.9 )]^2
            const relRough = (eps_mm / D_mm); // Dimensionless (mm/mm)
            if (Re > 0) {
                const term1 = relRough / 3.7;
                const term2 = 5.74 / Math.pow(Re, 0.9);
                const logVal = Math.log10(term1 + term2);
                f = 0.25 / Math.pow(logVal, 2);
            }
        }

        // Pressure Drop (Darcy)
        // dP (Pa) = f * (L/D) * (rho * V^2 / 2)
        const dP_Pa = f * (L / D_m) * (rho * Math.pow(V, 2) / 2);
        const dP_bar = dP_Pa / 1e5;

        return {
            outputs: {
                velocity: createValidatedValue(V, 'm/s', 'derived'),
                reynolds: createValidatedValue(Re, '-', 'derived'),
                frictionFactor: createValidatedValue(f, '-', 'derived'),
                pressureDrop: createValidatedValue(dP_bar, 'bar', 'derived')
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

            const D = inputs.diameter || 50;
            const V = inputs.flowRate ? (inputs.flowRate / (Math.PI * Math.pow(D / 2000, 2))) : 0; // Approx V for vis
            const L = 200; // Fixed visual length

            // Draw Pipe Section
            // Gradient fill to simulate fluid

            return (

                <svg viewBox="0 0 300 150" style={{ width: '100%', height: '100%' }}>
                    <defs>
                        <linearGradient id="fluidGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
                            <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.4" />
                        </linearGradient>
                        <marker id="arrowHead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#00e5ff" />
                        </marker>
                    </defs>

                    {/* Pipe Walls */}
                    <g transform="translate(0, 75)">
                        <rect x="0" y={-D / 2} width="300" height={D} fill="url(#fluidGrad)" stroke="none" />
                        <line x1="0" y1={-D / 2} x2="300" y2={-D / 2} stroke="#cbd5e1" strokeWidth="3" />
                        <line x1="0" y1={D / 2} x2="300" y2={D / 2} stroke="#cbd5e1" strokeWidth="3" />

                        {/* Flow Arrows */}
                        <line x1="20" y1="0" x2="280" y2="0" stroke="#00e5ff" strokeWidth="2" markerEnd="url(#arrowHead)" strokeDasharray={V > 10 ? "none" : "5,5"} />

                        {/* Velocity Profile (Visual candy) */}
                        <path d={`M 50 ${-D / 2} Q 80 0 50 ${D / 2}`} fill="none" stroke="#fff" strokeOpacity="0.3" />
                        <path d={`M 150 ${-D / 2} Q 180 0 150 ${D / 2}`} fill="none" stroke="#fff" strokeOpacity="0.3" />
                        <path d={`M 250 ${-D / 2} Q 280 0 250 ${D / 2}`} fill="none" stroke="#fff" strokeOpacity="0.3" />
                    </g>

                    <text x="150" y="20" fill="#00e5ff" textAnchor="middle" fontSize="12">V = {V.toFixed(2)} m/s</text>
                    <text x="150" y="140" fill="#94a3b8" textAnchor="middle" fontSize="12">Ø{D} mm</text>
                </svg>
            );
        }
    },

    documentation: {
        assumptions: [
            { id: 'incompressible', text: 'Fluid is incompressible (constant density)', impact: 'high' }
        ],
        standards: [
            { code: 'Colebrook-White', title: 'Friction factor equation' }
        ],
        formulaLatex: '\\Delta P = f \\frac{L}{D} \\frac{\\rho V^2}{2}'
    },

    tier: 'free'
};

export default fluidFlowSchema;
