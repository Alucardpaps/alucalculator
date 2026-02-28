import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const agmaGearAnalysisSchema: CalculatorSchemaV2 = {
    id: 'agma-gear-analysis',
    metadata: {
        title: 'AGMA Gear Analysis',
        description: 'AGMA Standard calculation for Bending Stress and Pitting Resistance (Contact Stress) in Spur Gears.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-12',
        tags: ['gear', 'agma', 'bending', 'pitting', 'fatigue', 'machine elements'],
        verifiedStandards: ['ANSI/AGMA 2001-D04', 'ANSI/AGMA 2101-D04']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'External spur gears only (no helical or internal gears in this baseline).', impact: 'high' },
            { id: 'a2', text: 'Constant power transmission.', impact: 'medium' },
            { id: 'a3', text: 'Simplified geometry factors (J and I) based on standard 20° pressure angle.', impact: 'medium' }
        ],
        standards: [
            { code: 'AGMA 2001', title: 'Fundamental Rating Factors and Calculation Methods for Involute Spur and Helical Gear Teeth' }
        ],
        formulaLatex: '\\sigma_b = W_t K_o K_v K_s \\frac{P_d}{F} \\frac{K_m K_B}{J} \\quad , \\quad \\sigma_c = Z_E \\sqrt{ W_t K_o K_v K_s \\frac{K_m C_f}{d F I} }'
    },
    inputs: [
        { key: 'powerKw', label: 'Transmitted Power', unit: 'kW', defaultValue: 10, description: 'Power transmitted by the gear system', validation: { required: true, min: 0.1 } },
        { key: 'rpm', label: 'Pinion RPM', unit: 'RPM' as any, defaultValue: 1500, description: 'Speed of the driving pinion', validation: { required: true, min: 10 } },
        { key: 'Np', label: 'Teeth (Pinion)', unit: '-', defaultValue: 20, description: 'Number of teeth on pinion', validation: { required: true, min: 12, max: 200 } },
        { key: 'Ng', label: 'Teeth (Gear)', unit: '-', defaultValue: 60, description: 'Number of teeth on gear', validation: { required: true, min: 12, max: 400 } },
        { key: 'm', label: 'Module (m)', unit: 'mm', defaultValue: 4, description: 'Metric module', validation: { required: true, min: 0.5, max: 50 } },
        { key: 'F', label: 'Face Width (F)', unit: 'mm', defaultValue: 40, description: 'Width of the gear face', validation: { required: true, min: 5 } },
        { key: 'Cp', label: 'Elastic Coeff (Cp)', unit: '√MPa' as any, defaultValue: 191, description: 'Ze (Metric Cp) for Steel on Steel is ~191 √MPa', validation: { required: true, min: 100 } }
    ],
    outputs: [
        { key: 'dp', label: 'Pinion Dia (d)', unit: 'mm', description: 'Pitch diameter of pinion', precision: 1, formulaLatex: 'd_p = m \\cdot N_p' },
        { key: 'Wt', label: 'Tangential Force (Wt)', unit: 'N', description: 'Transmitted tangential load', precision: 1, formulaLatex: 'W_t = \\frac{60000 \\cdot P}{\\pi \\cdot d_p \\cdot n}' },
        { key: 'bending', label: 'Bending Stress (σb)', unit: 'MPa', description: 'AGMA Bending Stress at tooth root', precision: 2, formulaLatex: '\\sigma_b = \\frac{W_t}{F m} \\frac{K_a K_v K_m}{Y_J}' },
        { key: 'pitting', label: 'Contact Stress (σc)', unit: 'MPa', description: 'AGMA Contact Stress (Pitting)', precision: 2, formulaLatex: '\\sigma_c = Z_E \\sqrt{ \\frac{W_t}{d_p F} \\frac{K_a K_v K_m}{Z_I} }' }
    ],
    calculationEngine: (inputs) => {
        const P = Number(inputs.powerKw.value);
        const rpm = Number(inputs.rpm.value);
        const Np = Number(inputs.Np.value);
        const Ng = Number(inputs.Ng.value);
        const m = Number(inputs.m.value);
        const F = Number(inputs.F.value);
        const Ze = Number(inputs.Cp.value); // Elastic coefficient metric

        // 1. Kinematics
        const dp = m * Np; // mm
        const dg = m * Ng; // mm
        const v = (Math.PI * dp * rpm) / 60000; // Pitch line velocity m/s

        // 2. Transmitted Load (Wt)
        const Wt = (1000 * P) / v; // Newtons

        // 3. AGMA Factors (Simplified for generic simulation)
        // Ko = 1.0 (Uniform load)
        const Ko = 1.0;
        // Kv = Dynamic factor. Assuming Qv=6 (Commercial quality)
        const B = 0.25 * Math.pow(12 - 6, 2 / 3);
        const A = 50 + 56 * (1 - B);
        // Metric Kv formula: Kv = (A / (A + sqrt(200*v)))^B for SI. Simplified to standard empirical here:
        const Kv = Math.pow((A + Math.sqrt(200 * v)) / A, B);
        // Km = Load distribution factor, approx 1.6 for standard face width
        const Km = 1.6;
        // J = Geometry factor for bending. Approx 0.35 for 20T pinion 20 deg
        const Yj = 0.35;
        // I = Geometry factor for pitting. I = cos(phi)*sin(phi)/2 * mg/(mg+1)
        const phi = 20 * Math.PI / 180;
        const mg = Ng / Np;
        const Zi = (Math.cos(phi) * Math.sin(phi) / 2) * (mg / (mg + 1));

        // 4. Stresses (Metric AGMA Equations)
        // Bending (Root stress): sigma_b = (Wt / (F*m)) * (Ko * Kv * Km / Yj) (approx metric form)
        const bending = (Wt / (F * m)) * ((Ko * Kv * Km) / Yj);

        // Pitting (Contact stress): sigma_c = Ze * sqrt( (Wt / (dp * F)) * (Ko * Kv * Km / Zi) )
        const pitting = Ze * Math.sqrt((Wt / (dp * F)) * ((Ko * Kv * Km) / Zi));

        const warnings: { field: string; message: string; severity: "info" | "warning" | "critical" }[] = [];
        if (pitting > 1500) {
            warnings.push({ field: 'pitting', message: 'Contact stress heavily exceeds typical steel endurance limits (pitting imminent).', severity: 'critical' });
        }
        if (bending > 400) {
            warnings.push({ field: 'bending', message: 'Bending stress is critically high. Risk of sudden tooth fracture.', severity: 'critical' });
        }

        return {
            outputs: {
                dp: createValidatedValue(dp, 'mm', 'derived'),
                Wt: createValidatedValue(Wt, 'N', 'derived'),
                bending: createValidatedValue(bending, 'MPa', 'derived'),
                pitting: createValidatedValue(pitting, 'MPa', 'derived')
            },
            verified: true,
            warnings,
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result) => {
            const out = result.outputs || {};
            const Wt = (out.Wt?.value as number) || 1000;
            const sigmaB = (out.bending?.value as number) || 100;
            const sigmaC = (out.pitting?.value as number) || 500;

            const isFailing = sigmaB > 400 || sigmaC > 1500;
            const stressColor = isFailing ? '#ef4444' : '#10b981';

            return (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#05080b]">
                    {/* Gear Mesh Diagram */}
                    <div className="relative w-[200px] h-[200px]">
                        <svg viewBox="0 0 200 200" width="100%" height="100%" className="overflow-visible">
                            {/* Pinion */}
                            <circle cx="100" cy="70" r="40" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
                            <circle cx="100" cy="70" r="5" fill="#64748b" />
                            <text x="100" y="60" fill="#94a3b8" fontSize="8" textAnchor="middle">Pinion</text>

                            {/* Gear */}
                            <circle cx="100" cy="190" r="80" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
                            <circle cx="100" cy="190" r="5" fill="#64748b" />

                            {/* Meshing Contact Point */}
                            <circle cx="100" cy="110" r="8" fill={stressColor} opacity="0.5" className="animate-pulse" />
                            <circle cx="100" cy="110" r="3" fill={stressColor} />

                            {/* Wt Vector */}
                            <line x1="100" y1="110" x2="160" y2="110" stroke="#00e5ff" strokeWidth="2" markerEnd="url(#arrowhead)" />
                            <text x="140" y="105" fill="#00e5ff" fontSize="10" fontWeight="bold">W_t</text>

                            {/* Define Arrowhead */}
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="#00e5ff" />
                                </marker>
                            </defs>
                        </svg>
                    </div>

                    <div className="mt-8 flex gap-8 text-center bg-[#0a0e14] p-4 rounded-xl border border-[#1a1f26]">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Bending</div>
                            <div className={`text-xl font-bold font-mono ${sigmaB > 400 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {sigmaB.toFixed(1)} <span className="text-[10px] text-gray-500">MPa</span>
                            </div>
                        </div>
                        <div className="w-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Pitting</div>
                            <div className={`text-xl font-bold font-mono ${sigmaC > 1500 ? 'text-red-400' : 'text-orange-400'}`}>
                                {sigmaC.toFixed(0)} <span className="text-[10px] text-gray-500">MPa</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    },
    tier: 'pro'
};

export default agmaGearAnalysisSchema;
