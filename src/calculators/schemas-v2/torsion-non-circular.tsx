import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const torsionNonCircularSchema: CalculatorSchemaV2 = {
    id: 'torsion-non-circular',
    metadata: {
        title: 'Non-Circular Torsion',
        description: 'Analyzes torsion in non-circular cross sections (Rectangle, Ellipse, Equilateral Triangle) to find max shear stress and twist angle.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-12',
        tags: ['torsion', 'shear', 'stress', 'twist', 'rectangle', 'ellipse', 'triangle', 'machine elements'],
        verifiedStandards: ['Roark\'s Formulas for Stress and Strain']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'St. Venant\'s principle applies.', impact: 'high' },
            { id: 'a2', text: 'Cross sections are free to warp (not constrained longitudinally).', impact: 'medium' }
        ],
        standards: [
            { code: 'Roark 7th Ed', title: 'Table 10.1: Formulas for torsional deformation and stress' }
        ],
        formulaLatex: '\\tau_{max} = \\frac{T}{Q} \\quad , \\quad \\theta = \\frac{T L}{K G}'
    },
    inputs: [
        { key: 'T', label: 'Torque (T)', unit: 'N·m' as any, defaultValue: 500, description: 'Applied torsional moment', validation: { required: true, min: 0 } },
        { key: 'G', label: 'Shear Modulus (G)', unit: 'GPa', defaultValue: 79.3, description: 'Shear Modulus of material (79.3 for Steel)', validation: { required: true, min: 1 } },
        { key: 'shape', label: 'Shape (0=Rect, 1=Ellip, 2=Tri)', unit: '-', defaultValue: 0, description: 'Cross section type', validation: { required: true, min: 0, max: 2 } },
        { key: 'a', label: 'Dim a (Width/Major/Side)', unit: 'mm', defaultValue: 40, description: 'Primary dimension (long side for rect, semi-major for ellipse, side length for triangle)', validation: { required: true, min: 1 } },
        { key: 'b', label: 'Dim b (Height/Minor)', unit: 'mm', defaultValue: 20, description: 'Secondary dimension (short side for rect, semi-minor for ellipse). Ignored for triangle.', validation: { required: true, min: 1 } }
    ],
    outputs: [
        { key: 'tauMax', label: 'Max Shear (τmax)', unit: 'MPa', description: 'Maximum shear stress in the cross section', precision: 1, formulaLatex: '\\tau_{max}' },
        { key: 'theta', label: 'Twist per meter (θ/L)', unit: 'deg/m' as any, description: 'Angle of twist per unit length', precision: 3, formulaLatex: '\\frac{\\theta}{L} = \\frac{T}{K G}' },
        { key: 'K', label: 'Torsional Const (K)', unit: 'mm^4' as any, description: 'Torsional stiffness constant (analogous to J)', precision: 0, formulaLatex: 'K' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const T = Number(inputs.T.value) * 1000; // convert N*m to N*mm
        const G_MPa = Number(inputs.G.value) * 1000; // convert GPa to MPa
        const shape = Number(inputs.shape.value);
        let a = Number(inputs.a.value);
        let b = Number(inputs.b.value);

        let tauMax = 0;
        let theta_rad_per_mm = 0;
        let K = 0;

        const warnings: { field: string; message: string; severity: "info" | "warning" | "critical" }[] = [];

        if (shape === 0) {
            // Rectangle
            // By convention for our formulas, 'a' should be the longer side
            if (b > a) {
                const temp = a;
                a = b;
                b = temp;
                warnings.push({ field: 'a', message: 'Swapped a and b so that a >= b (Rectangle standard formulation).', severity: 'info' });
            }

            const c = a / b;

            // From Roark's approx for rectangle:
            // tau_max is at middle of long sides
            // K = a b^3 [ 1/3 - 0.21(b/a)(1 - (b^4)/(12*a^4)) ]
            // tau_max = T / (a b^2 [ 1/3 + 0.15*(b/a) ... wait, exact is complex ])

            // Simplified classical approx by Weber & Prandtl:
            const c1 = 1 / 3 - 0.21 * (b / a) * (1 - Math.pow(b / a, 4) / 12);
            K = a * Math.pow(b, 3) * c1;

            // Approx for tau_max (middle of long edge side 'a'):
            // tau_max = T / (k1 * a * b^2)
            // Or more elegantly: tau_max = T * (3a + 1.8b) / (a^2 * b^2) ... no, that's not right.
            // Using standard roark Table 10.1:
            // tau_max at center of long side:
            const Q = a * Math.pow(b, 2) / (3 + 1.8 * (b / a));
            tauMax = T / Q;
            theta_rad_per_mm = T / (K * G_MPa);

        } else if (shape === 1) {
            // Ellipse (a, b are semi-axes)
            if (b > a) {
                const temp = a;
                a = b;
                b = temp;
            }
            K = (Math.PI * Math.pow(a, 3) * Math.pow(b, 3)) / (Math.pow(a, 2) + Math.pow(b, 2));
            // Max shear is at the ends of the minor axis
            tauMax = (2 * T) / (Math.PI * a * Math.pow(b, 2));
            theta_rad_per_mm = T / (K * G_MPa);

        } else if (shape === 2) {
            // Equilateral Triangle (a = side length)
            K = (Math.sqrt(3) * Math.pow(a, 4)) / 80;
            // Max shear at middle of each side
            tauMax = (20 * T) / Math.pow(a, 3);
            theta_rad_per_mm = T / (K * G_MPa);
        }

        // Convert theta to deg/m
        const theta_deg_per_mm = theta_rad_per_mm * (180 / Math.PI);
        const theta_deg_per_m = theta_deg_per_mm * 1000;

        return {
            outputs: {
                tauMax: createValidatedValue(tauMax, 'MPa', 'derived'),
                theta: createValidatedValue(theta_deg_per_m, 'deg/m' as any, 'derived'),
                K: createValidatedValue(K, 'mm^4' as any, 'derived')
            },
            verified: true,
            warnings,
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: any, inputs: Record<string, any>) => {
            const shape = Number(inputs.shape?.value || 0);
            let a = Number(inputs.a?.value || 40);
            let b = Number(inputs.b?.value || 20);

            // Swap a and b if rectangle and b > a to match math logic
            if (shape === 0 && b > a) {
                const temp = a;
                a = b;
                b = temp;
            }

            const W = 300;
            const H = 200;
            const cx = W / 2;
            const cy = H / 2;

            let pathD = '';
            let maxStressPoint = { x: 0, y: 0 };

            // Auto scale
            let maxDim = Math.max(a, b);
            if (shape === 2) maxDim = a;

            const scale = Math.min((W - 80) / maxDim, (H - 80) / maxDim);

            const scaledA = a * scale;
            const scaledB = b * scale;

            if (shape === 0) {
                // Rectangle
                const rw = scaledA;
                const rh = scaledB;
                pathD = `M ${cx - rw / 2} ${cy - rh / 2} L ${cx + rw / 2} ${cy - rh / 2} L ${cx + rw / 2} ${cy + rh / 2} L ${cx - rw / 2} ${cy + rh / 2} Z`;
                maxStressPoint = { x: cx, y: cy + rh / 2 }; // Center of long edge
            } else if (shape === 1) {
                // Ellipse (a and b are semi-axes)
                // Need to draw ellipse with rx = a, ry = b
                // We'll use SVG ellipse directly later or approximate with path if we must. Let's use standard ellipse SVG node.
                maxStressPoint = { x: cx, y: cy + scaledB }; // End of minor axis
            } else if (shape === 2) {
                // Triangle
                const side = scaledA;
                const h = (Math.sqrt(3) / 2) * side;
                const r = h / 3; // distance from centroid to base
                const R = 2 * r; // distance from centroid to tip

                pathD = `M ${cx} ${cy - R} L ${cx + side / 2} ${cy + r} L ${cx - side / 2} ${cy + r} Z`;
                maxStressPoint = { x: cx, y: cy + r }; // Middle of an edge
            }

            return (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#05080b]">
                    <div className="relative w-full max-w-[400px]">
                        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" className="bg-[#0a0e14] border border-[#1a1f26] rounded-xl shadow-lg">
                            {/* Grid/Axes */}
                            <line x1={0} y1={cy} x2={W} y2={cy} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1={cx} y1={0} x2={cx} y2={H} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

                            {/* Section Shape */}
                            {shape === 1 ? (
                                <ellipse cx={cx} cy={cy} rx={scaledA} ry={scaledB} fill="rgba(0, 229, 255, 0.1)" stroke="#00e5ff" strokeWidth="2" />
                            ) : (
                                <path d={pathD} fill="rgba(0, 229, 255, 0.1)" stroke="#00e5ff" strokeWidth="2" strokeLinejoin="round" />
                            )}

                            {/* Twist Arrow */}
                            <path d={`M ${cx - 30} ${cy - 40} C ${cx + 20} ${cy - 50}, ${cx + 40} ${cy - 20}, ${cx + 30} ${cy - 5}`} fill="none" stroke="#eab308" strokeWidth="2" markerEnd="url(#arrow_torsion)" />
                            <text x={cx + 45} y={cy - 30} fill="#eab308" fontSize="12" fontWeight="bold">T</text>

                            {/* Max Shear Stress Point indicator */}
                            <circle cx={maxStressPoint.x} cy={maxStressPoint.y} r="4" fill="#ef4444" />
                            <path d={`M ${maxStressPoint.x} ${maxStressPoint.y} L ${maxStressPoint.x + 20} ${maxStressPoint.y + 15}`} fill="none" stroke="#ef4444" strokeWidth="1" />
                            <text x={maxStressPoint.x + 25} y={maxStressPoint.y + 20} fill="#ef4444" fontSize="10">Max τ</text>

                            <defs>
                                <marker id="arrow_torsion" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                    <polygon points="0 0, 6 2, 0 4" fill="#eab308" />
                                </marker>
                            </defs>
                        </svg>
                    </div>
                </div>
            );
        }
    },
    tier: 'pro'
};

export default torsionNonCircularSchema;
