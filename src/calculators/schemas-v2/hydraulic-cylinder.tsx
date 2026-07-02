import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const hydraulicCylinderSchema: CalculatorSchemaV2 = {
    id: 'hydraulic-cylinder',
    metadata: {
        title: 'Hydraulic Cylinder Sizing',
        description: 'Bore and rod diameter sizing, operating fluid volume, flow rate, and Euler buckling check for hydraulic cylinders.',
        category: 'fluid',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-06-28',
        tags: ['hydraulic cylinder', 'bore diameter', 'rod size', 'buckling', 'oil volume', 'fluid power'],
        verifiedStandards: ['ISO 6020', 'ISO 6022']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Steady state hydraulic pressure (no dynamic peak shock waves).', impact: 'high' },
            { id: 'a2', text: 'Rod is made of high-tensile steel with Young\'s modulus of 210 GPa.', impact: 'medium' }
        ],
        standards: [
            { code: 'ISO 6020', title: 'Fluid power - Mounting dimensions for single-rod cylinders, 160 bar series' },
            { code: 'ISO 6022', title: 'Fluid power - Mounting dimensions for single-rod cylinders, 250 bar series' }
        ],
        formulaLatex: 'A_p = \\frac{F}{P} \\cdot 10 \\quad , \\quad D = \\sqrt{\\frac{4 A_p}{\\pi}} \\quad , \\quad F_{cr} = \\frac{\\pi^2 E I}{L_e^2}'
    },
    inputs: [
        { key: 'F', label: 'Push Force (F)', unit: 'kN', defaultValue: 50, description: 'Required linear push force', validation: { required: true, min: 0.1, max: 10000 } },
        { key: 'P', label: 'System Pressure (P)', unit: 'bar', defaultValue: 160, description: 'Operating system relief pressure', validation: { required: true, min: 10, max: 700 } },
        { key: 'stroke', label: 'Stroke Length (L)', unit: 'mm', defaultValue: 500, description: 'Total stroke travel of the cylinder', validation: { required: true, min: 10, max: 10000 } },
        {
            key: 'mount',
            label: 'Mounting Style (K)',
            unit: '-',
            defaultValue: 'pinned',
            description: 'Fixing configuration factor for rod buckling calculations',
            options: [
                { label: 'Fixed-Fixed (Rigidly Guided, K=0.5)', value: 'fixed' },
                { label: 'Pinned-Pinned (Spherical Bearings, K=1.0)', value: 'pinned' },
                { label: 'Fixed-Free (Cantilever Cylinder, K=2.0)', value: 'free' }
            ],
            validation: { required: true }
        },
        { key: 'E', label: 'Young\'s Modulus (E)', unit: 'GPa', defaultValue: 210, description: 'Modulus of elasticity of the rod material', validation: { required: true, min: 70, max: 220 } }
    ],
    outputs: [
        { key: 'Ap', label: 'Required Area (Ap)', unit: 'cm2', description: 'Minimum required piston cross-sectional area', precision: 2, formulaLatex: 'A_p = \\frac{F}{P} \\cdot 10' },
        { key: 'bore', label: 'Bore Diameter (D)', unit: 'mm', description: 'Calculated internal cylinder bore diameter', precision: 1, formulaLatex: 'D = \\sqrt{4 A_p / \\pi} \\cdot 10' },
        { key: 'boreStd', label: 'ISO Standard Bore', unit: 'mm', description: 'Nearest standard size in ISO 6020', precision: 0, formulaLatex: 'D_{std} \\in \\{40, 50, 63, 80, 100, 125, 160\\}' },
        { key: 'rodStd', label: 'ISO Standard Rod', unit: 'mm', description: 'Standard rod diameter corresponding to selected bore', precision: 0, formulaLatex: 'd_{std} \\in \\{22, 28, 36, 45, 56, 70, 90, 110\\}' },
        { key: 'vol', label: 'Oil Volume', unit: 'L' as any, description: 'Required oil volume per full stroke extension', precision: 2, formulaLatex: 'V = A_{p,std} \\cdot L \\cdot 10^{-3}' },
        { key: 'Fcr', label: 'Critical Buckling (Fcr)', unit: 'kN', description: 'Euler critical linear buckling limit force', precision: 1, formulaLatex: 'F_{cr} = \\frac{\\pi^2 E I}{(K \\cdot L)^2}' },
        { key: 'SF', label: 'Buckling Safety Factor', unit: '-', description: 'Ratio of critical buckling force to push force', precision: 2, formulaLatex: 'SF = F_{cr} / F' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const F = Number(inputs.F.value);
        const P = Number(inputs.P.value);
        const stroke = Number(inputs.stroke.value);
        const mount = String(inputs.mount.value);
        const E_GPa = Number(inputs.E.value);

        const E_Pa = E_GPa * 1e9;

        // 1. Required piston area in cm²
        // F(kN) = P(bar) * Ap(cm²) / 10  --> Ap = 10 * F / P
        const Ap = (10 * F) / P;

        // 2. Minimum bore diameter in mm
        const bore = Math.sqrt((4 * Ap) / Math.PI) * 10;

        // 3. Select nearest standard ISO 6020 size
        const standardBores = [40, 50, 63, 80, 100, 125, 160, 200, 250, 320];
        let boreStd = standardBores.find(b => b >= bore) || standardBores[standardBores.length - 1];

        // ISO 6020 Piston-to-Rod standard pairings (Standard 2:1 or 1.4:1 ratios)
        const rodPairings: Record<number, number> = {
            40: 22,
            50: 28,
            63: 36,
            80: 45,
            100: 56,
            125: 70,
            160: 90,
            200: 110,
            250: 140,
            320: 180
        };
        const rodStd = rodPairings[boreStd] || Math.round(boreStd * 0.56);

        // 4. Actual area and volume
        const actualAp_cm2 = (Math.PI * Math.pow(boreStd / 10, 2)) / 4;
        const vol_L = (actualAp_cm2 * stroke * 1e-4) * 10; // cm2 * mm to Liters

        // 5. Buckling calculation
        // I = pi * d^4 / 64 (mm4)
        const I_mm4 = (Math.PI * Math.pow(rodStd, 4)) / 64;
        const I_m4 = I_mm4 * 1e-12;

        let K = 1.0;
        if (mount === 'fixed') K = 0.5;
        else if (mount === 'free') K = 2.0;

        const Le_m = (K * stroke) / 1000; // effective length in meters
        const Fcr_N = Le_m > 0 ? (Math.PI * Math.PI * E_Pa * I_m4) / (Le_m * Le_m) : 0;
        const Fcr_kN = Fcr_N / 1000;

        const safetyIndex = F > 0 ? Fcr_kN / F : Number.MAX_VALUE;

        const warnings: { field: string; message: string; severity: "info" | "warning" | "critical" }[] = [];

        if (safetyIndex < 3.5) {
            warnings.push({
                field: 'stroke',
                message: `Low buckling safety factor (${safetyIndex.toFixed(2)}). Standard practice requires SF > 3.5 to prevent rod bending under compressive load. Increase rod diameter or reduce stroke/operating force.`,
                severity: 'warning'
            });
        }
        if (safetyIndex < 1.5) {
            warnings.push({
                field: 'stroke',
                message: `Critical buckling risk! Cylinder rod will collapse/buckle under full load pressure. SF = ${safetyIndex.toFixed(2)}.`,
                severity: 'critical'
            });
        }

        return {
            outputs: {
                Ap: createValidatedValue(Ap, 'cm2', 'derived'),
                bore: createValidatedValue(bore, 'mm', 'derived'),
                boreStd: createValidatedValue(boreStd, 'mm', 'derived'),
                rodStd: createValidatedValue(rodStd, 'mm', 'derived'),
                vol: createValidatedValue(vol_L, 'L' as any, 'derived'),
                Fcr: createValidatedValue(Fcr_kN, 'kN', 'derived'),
                SF: createValidatedValue(safetyIndex, '-', 'derived')
            },
            verified: true,
            warnings,
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: any) => {
            const out = result.outputs || {};
            const safety = (out.SF?.value as number) || 4;
            const isFailing = safety < 1.5;

            return (
                <div className="w-full h-full flex flex-row items-center justify-center p-6 bg-[#05080b] gap-12">
                    {/* Cylinder representation */}
                    <div className="relative w-[220px] h-[150px]">
                        <svg viewBox="0 0 220 150" width="100%" height="100%" className="overflow-visible">
                            {/* Cylinder Tube */}
                            <rect x="20" y="45" width="100" height="60" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" rx="3" />
                            
                            {/* Piston Rod (extending to the right) */}
                            <rect x="80" y="65" width="110" height="20" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
                            
                            {/* Piston Head inside */}
                            <rect x="60" y="47" width="20" height="56" fill="#00e5ff" stroke="#00e5ff" strokeWidth="1" />
                            
                            {/* Rear Mount Eye */}
                            <circle cx="10" cy="75" r="10" fill="none" stroke="#38bdf8" strokeWidth="3" />
                            <circle cx="10" cy="75" r="4" fill="#38bdf8" />
                            
                            {/* Rod Clevis Eye */}
                            <circle cx="195" cy="75" r="10" fill="none" stroke="#94a3b8" strokeWidth="3" />
                            <circle cx="195" cy="75" r="4" fill="#94a3b8" />
                            
                            {/* Oil Inlet Ports */}
                            <rect x="30" y="37" width="10" height="8" fill="#38bdf8" />
                            <rect x="100" y="37" width="10" height="8" fill="#38bdf8" />
                        </svg>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col gap-5 w-36 border border-[#1a1f26] bg-[#0a0e14] p-4 rounded-xl">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Standard Bore</div>
                            <div className="text-xl font-bold font-mono text-white">
                                {((out.boreStd?.value as number) || 0)} <span className="text-[10px] text-gray-500">mm</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Standard Rod</div>
                            <div className="text-xl font-bold font-mono text-white">
                                {((out.rodStd?.value as number) || 0)} <span className="text-[10px] text-gray-500">mm</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Buckling SF</div>
                            <div className={`text-xs font-bold font-mono ${isFailing ? 'text-red-400' : 'text-emerald-400'}`}>
                                {safety.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    },
    tier: 'free'
};

export default hydraulicCylinderSchema;
