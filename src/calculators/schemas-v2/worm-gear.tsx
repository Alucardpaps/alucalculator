import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const wormGearSchema: CalculatorSchemaV2 = {
    id: 'worm-gear',
    metadata: {
        title: 'Worm Gear Calculator',
        description: 'Geometry, efficiency, sliding velocity, output torque, and thermal heat generation of worm gear sets.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-06-28',
        tags: ['worm gear', 'gear ratio', 'efficiency', 'torque', 'heat loss', 'machine elements'],
        verifiedStandards: ['DIN 3975', 'AGMA 6034']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Worm is the driving element.', impact: 'high' },
            { id: 'a2', text: 'Steady state temperature and lubrication conditions.', impact: 'medium' }
        ],
        standards: [
            { code: 'DIN 3975', title: 'Design and calculation of worm gear pairs' },
            { code: 'AGMA 6034', title: 'Practice for Design of Industrial Worm Gearing' }
        ],
        formulaLatex: '\\gamma = \\arctan\\left(\\frac{z_1 \\cdot m}{d_1}\\right) \\quad , \\quad \\eta = \\frac{\\cos \\alpha_n - \\mu \\tan \\gamma}{\\cos \\alpha_n + \\mu \\cot \\gamma} \\quad , \\quad T_2 = T_1 \\cdot i \\cdot \\eta'
    },
    inputs: [
        { key: 'm', label: 'Axial Module (m)', unit: 'mm', defaultValue: 4, description: 'Pitch of the worm gear teeth', validation: { required: true, min: 0.5, max: 50 } },
        { key: 'z1', label: 'Worm Starts (z1)', unit: '-', defaultValue: 2, description: 'Number of threads on the worm', validation: { required: true, min: 1, max: 10, step: 1 } },
        { key: 'z2', label: 'Gear Teeth (z2)', unit: '-', defaultValue: 40, description: 'Number of teeth on the worm gear', validation: { required: true, min: 12, max: 120, step: 1 } },
        { key: 'd1', label: 'Worm Pitch Diameter (d1)', unit: 'mm', defaultValue: 50, description: 'Reference diameter of the worm', validation: { required: true, min: 10, max: 500 } },
        { key: 'alpha', label: 'Normal Pressure Angle', unit: 'deg', defaultValue: 20, description: 'Pressure angle of the cutter/tooth profile', validation: { required: true, min: 10, max: 30 } },
        { key: 'mu', label: 'Friction Coefficient (μ)', unit: '-', defaultValue: 0.05, description: 'Coefficient of friction at mesh (typically 0.02 - 0.10)', validation: { required: true, min: 0.01, max: 0.20 } },
        { key: 'n1', label: 'Worm Speed (n1)', unit: 'rpm', defaultValue: 1450, description: 'Rotational speed of the worm', validation: { required: true, min: 1, max: 10000 } },
        { key: 'T1', label: 'Worm Input Torque (T1)', unit: 'Nm', defaultValue: 50, description: 'Torque applied to the worm shaft', validation: { required: true, min: 0.1, max: 10000 } }
    ],
    outputs: [
        { key: 'i', label: 'Gear Ratio (i)', unit: '-', description: 'Ratio of gear speed to worm speed (z2/z1)', precision: 2, formulaLatex: 'i = z_2 / z_1' },
        { key: 'd2', label: 'Gear Pitch Diameter (d2)', unit: 'mm', description: 'Pitch diameter of the worm gear', precision: 2, formulaLatex: 'd_2 = m \\cdot z_2' },
        { key: 'gamma', label: 'Lead Angle (γ)', unit: 'deg', description: 'Helix lead angle of the worm thread', precision: 2, formulaLatex: '\\gamma = \\arctan(z_1 \\cdot m / d_1)' },
        { key: 'vs', label: 'Sliding Velocity (vs)', unit: 'm/s', description: 'Relative sliding speed at the mesh', precision: 2, formulaLatex: 'v_s = \\frac{\\pi \\cdot d_1 \\cdot n_1}{60000 \\cdot \\cos \\gamma}' },
        { key: 'eta', label: 'Mesh Efficiency (η)', unit: '%', description: 'Power transmission efficiency of the gear mesh', precision: 1, formulaLatex: '\\eta = \\frac{\\cos \\alpha_n - \\mu \\tan \\gamma}{\\cos \\alpha_n + \\mu \\cot \\gamma}' },
        { key: 'T2', label: 'Output Torque (T2)', unit: 'Nm', description: 'Torque transmitted to the worm gear shaft', precision: 1, formulaLatex: 'T_2 = T_1 \\cdot i \\cdot \\eta' },
        { key: 'Ploss', label: 'Heat Loss Power (Ploss)', unit: 'kW', description: 'Frictional thermal dissipation rate', precision: 3, formulaLatex: 'P_{loss} = P_{in} \\cdot (1 - \\eta)' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const m = Number(inputs.m.value);
        const z1 = Number(inputs.z1.value);
        const z2 = Number(inputs.z2.value);
        const d1 = Number(inputs.d1.value);
        const alphaRad = (Number(inputs.alpha.value) * Math.PI) / 180;
        const mu = Number(inputs.mu.value);
        const n1 = Number(inputs.n1.value);
        const T1 = Number(inputs.T1.value);

        // 1. Gear Ratio
        const i = z2 / z1;

        // 2. Pitch Diameter of Gear
        const d2 = m * z2;

        // 3. Lead Angle
        const gammaRad = Math.atan((z1 * m) / d1);
        const gamma = (gammaRad * 180) / Math.PI;

        // 4. Sliding Velocity
        const vs = (Math.PI * d1 * n1) / (60000 * Math.cos(gammaRad));

        // 5. Efficiency
        const cosAlpha = Math.cos(alphaRad);
        const tanGamma = Math.tan(gammaRad);
        const cotGamma = 1 / tanGamma;

        let eta = (cosAlpha - mu * tanGamma) / (cosAlpha + mu * cotGamma);
        if (eta < 0) eta = 0;

        // 6. Torques & Powers
        const P_in_kW = (T1 * 2 * Math.PI * n1) / 60000;
        const P_loss = P_in_kW * (1 - eta);
        const T2 = T1 * i * eta;

        const warnings: { field: string; message: string; severity: "info" | "warning" | "critical" }[] = [];

        if (gamma < 5) {
            warnings.push({
                field: 'gamma',
                message: `Low lead angle (${gamma.toFixed(1)}°) leads to high friction and potential low-efficiency self-locking (back-driving is blocked).`,
                severity: 'warning'
            });
        }
        if (eta < 0.5) {
            warnings.push({
                field: 'eta',
                message: `Mesh efficiency is extremely low (${(eta * 100).toFixed(1)}%). Consider a higher lead angle, more worm starts, or lower friction coefficient.`,
                severity: 'critical'
            });
        }
        if (vs > 15) {
            warnings.push({
                field: 'vs',
                message: `High sliding velocity (${vs.toFixed(1)} m/s) may trigger severe wear or lubrication failure without synthetic lubrication.`,
                severity: 'warning'
            });
        }

        return {
            outputs: {
                i: createValidatedValue(i, '-', 'derived'),
                d2: createValidatedValue(d2, 'mm', 'derived'),
                gamma: createValidatedValue(gamma, 'deg', 'derived'),
                vs: createValidatedValue(vs, 'm/s', 'derived'),
                eta: createValidatedValue(eta * 100, '%', 'derived'),
                T2: createValidatedValue(T2, 'Nm', 'derived'),
                Ploss: createValidatedValue(P_loss, 'kW', 'derived')
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
            const d2 = (out.d2?.value as number) || 160;
            const eta = (out.eta?.value as number) || 80;
            
            // Scaled diameters for SVG rendering
            const scale = 100 / Math.max(d2, 80);
            const r2 = (d2 * scale);
            const r1 = 30; // constant visual size for worm

            const centerDistance = r2 + r1;

            return (
                <div className="w-full h-full flex flex-row items-center justify-center p-6 bg-[#05080b] gap-12">
                    {/* Worm-Gear Layout SVG */}
                    <div className="relative w-[220px] h-[220px]">
                        <svg viewBox="0 0 220 220" width="100%" height="100%" className="overflow-visible">
                            {/* Worm Gear Circle (Center at 110, 110 + r1) */}
                            <circle cx="110" cy={110 + r1} r={r2} fill="none" stroke="#00e5ff" strokeWidth="2" strokeDasharray="3,3" />
                            <circle cx="110" cy={110 + r1} r={r2 * 0.9} fill="none" stroke="#00e5ff" strokeWidth="1" strokeOpacity="0.4" />
                            <circle cx="110" cy={110 + r1} r={8} fill="#00e5ff" fillOpacity="0.8" />
                            
                            {/* Worm Shaft (Horizontal center at 110, 110 - r2) */}
                            <line x1="20" y1={110 - r1} x2="200" y2={110 - r1} stroke="#38bdf8" strokeWidth="8" />
                            <rect x="70" y={110 - r1 - 10} width="80" height="20" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="2" rx="2" />
                            
                            {/* Spiral thread markings on worm */}
                            <line x1="80" y1={110 - r1 - 10} x2="90" y2={110 - r1 + 10} stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.6" />
                            <line x1="95" y1={110 - r1 - 10} x2="105" y2={110 - r1 + 10} stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.6" />
                            <line x1="110" y1={110 - r1 - 10} x2="120" y2={110 - r1 + 10} stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.6" />
                            <line x1="125" y1={110 - r1 - 10} x2="135" y2={110 - r1 + 10} stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.6" />
                            <line x1="140" y1={110 - r1 - 10} x2="150" y2={110 - r1 + 10} stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.6" />

                            {/* Mesh Point Highlight */}
                            <circle cx="110" cy="110" r="12" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2,2" className="animate-pulse" />
                            <circle cx="110" cy="110" r="3" fill="#f59e0b" />
                        </svg>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col gap-5 w-36 border border-[#1a1f26] bg-[#0a0e14] p-4 rounded-xl">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Efficiency</div>
                            <div className={`text-xl font-bold font-mono ${eta < 50 ? 'text-red-400' : eta < 75 ? 'text-orange-400' : 'text-emerald-400'}`}>
                                {eta.toFixed(1)}%
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Gear Dia (d2)</div>
                            <div className="text-xl font-bold font-mono text-white">
                                {d2.toFixed(1)} <span className="text-[10px] text-gray-500">mm</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Output Torque</div>
                            <div className="text-xl font-bold font-mono text-[#00e5ff]">
                                {((out.T2?.value as number) || 0).toFixed(0)} <span className="text-[10px] text-gray-500">Nm</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    },
    tier: 'free'
};

export default wormGearSchema;
