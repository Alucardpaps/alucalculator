import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const mohrCircle3DSchema: CalculatorSchemaV2 = {
    id: 'mohr-circle-3d',
    metadata: {
        title: '3D Mohr\'s Circle',
        description: 'Analyzes a full 3D stress tensor to calculate principal stresses and absolute maximum shear stress using eigenvalues.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-12',
        tags: ['stress', 'tensor', 'mohr', 'principal', 'shear', '3d', 'solid mechanics'],
        verifiedStandards: ['General Solid Mechanics']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Stresses are in equilibrium on an infinitesimal cubic element.', impact: 'high' }
        ],
        standards: [
            { code: 'Mechanics of Materials', title: 'Solid Mechanics Principles' }
        ],
        formulaLatex: '\\det(\\boldsymbol{\\sigma} - \\lambda \\mathbf{I}) = 0 \\implies \\sigma^3 - I_1\\sigma^2 + I_2\\sigma - I_3 = 0'
    },
    inputs: [
        { key: 'sigx', label: 'Normal σx', unit: 'MPa', defaultValue: 100, description: 'Normal stress in x-direction', validation: { required: true } },
        { key: 'sigy', label: 'Normal σy', unit: 'MPa', defaultValue: 50, description: 'Normal stress in y-direction', validation: { required: true } },
        { key: 'sigz', label: 'Normal σz', unit: 'MPa', defaultValue: -20, description: 'Normal stress in z-direction', validation: { required: true } },
        { key: 'tauxy', label: 'Shear τxy', unit: 'MPa', defaultValue: 30, description: 'Shear stress on xy face', validation: { required: true } },
        { key: 'tauyz', label: 'Shear τyz', unit: 'MPa', defaultValue: 0, description: 'Shear stress on yz face', validation: { required: true } },
        { key: 'tauzx', label: 'Shear τzx', unit: 'MPa', defaultValue: 40, description: 'Shear stress on zx face', validation: { required: true } }
    ],
    outputs: [
        { key: 'p1', label: 'Principal σ1', unit: 'MPa', description: 'Maximum Principal Stress', precision: 2, formulaLatex: '\\sigma_1 \\ge \\sigma_2 \\ge \\sigma_3' },
        { key: 'p2', label: 'Principal σ2', unit: 'MPa', description: 'Intermediate Principal Stress', precision: 2, formulaLatex: '\\sigma_2' },
        { key: 'p3', label: 'Principal σ3', unit: 'MPa', description: 'Minimum Principal Stress', precision: 2, formulaLatex: '\\sigma_3' },
        { key: 'taumax', label: 'Max Shear τmax', unit: 'MPa', description: 'Absolute Maximum Shear Stress', precision: 2, formulaLatex: '\\tau_{max} = \\frac{\\sigma_1 - \\sigma_3}{2}' },
        { key: 'vm', label: 'Von Mises (σv)', unit: 'MPa', description: 'Equivalent Von Mises Stress', precision: 2, formulaLatex: '\\sigma_v = \\sqrt{\\frac{1}{2}[(\\sigma_1-\\sigma_2)^2 + ... ]}' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const sx = Number(inputs.sigx.value);
        const sy = Number(inputs.sigy.value);
        const sz = Number(inputs.sigz.value);
        const txy = Number(inputs.tauxy.value);
        const tyz = Number(inputs.tauyz.value);
        const tzx = Number(inputs.tauzx.value);

        // Invariants
        const I1 = sx + sy + sz;
        const I2 = sx * sy + sy * sz + sz * sx - txy * txy - tyz * tyz - tzx * tzx;
        const I3 = sx * sy * sz - sx * tyz * tyz - sy * tzx * tzx - sz * txy * txy + 2 * txy * tyz * tzx;

        // solving cubic: x^3 - I1*x^2 + I2*x - I3 = 0
        // standard form substitution: t = x - I1/3
        const a = -I1;
        const b = I2;
        const c = -I3;

        const Q = (3 * b - a * a) / 9;
        const R = (9 * a * b - 27 * c - 2 * a * a * a) / 54;

        // Characteristic equation of symmetric actual stress tensor guarantees 3 real roots.
        // So D = Q^3 + R^2 <= 0 always.

        let p1 = 0, p2 = 0, p3 = 0;

        if (Q === 0 && R === 0) {
            // all three roots are equal (hydrostatic stress)
            p1 = p2 = p3 = -a / 3;
        } else {
            const theta = Math.acos(R / Math.sqrt(Math.pow(-Q, 3)));

            const r1 = 2 * Math.sqrt(-Q) * Math.cos(theta / 3) - a / 3;
            const r2 = 2 * Math.sqrt(-Q) * Math.cos((theta + 2 * Math.PI) / 3) - a / 3;
            const r3 = 2 * Math.sqrt(-Q) * Math.cos((theta + 4 * Math.PI) / 3) - a / 3;

            const roots = [r1, r2, r3].sort((a, b) => b - a); // descending
            p1 = roots[0];
            p2 = roots[1];
            p3 = roots[2];
        }

        const taumax = (p1 - p3) / 2;
        const vm = Math.sqrt(0.5 * (Math.pow(p1 - p2, 2) + Math.pow(p2 - p3, 2) + Math.pow(p3 - p1, 2)));

        return {
            outputs: {
                p1: createValidatedValue(p1, 'MPa', 'derived'),
                p2: createValidatedValue(p2, 'MPa', 'derived'),
                p3: createValidatedValue(p3, 'MPa', 'derived'),
                taumax: createValidatedValue(taumax, 'MPa', 'derived'),
                vm: createValidatedValue(vm, 'MPa', 'derived')
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: any) => {
            const out = result.outputs || {};
            const p1 = (out.p1?.value as number) || 0;
            const p2 = (out.p2?.value as number) || 0;
            const p3 = (out.p3?.value as number) || 0;

            const tmax = (p1 - p3) / 2;

            // Auto-scale
            const minX = Math.min(p3, 0) - 10;
            const maxX = Math.max(p1, 0) + 10;
            const spread = maxX - minX;
            const maxY = tmax + 10;
            // Map coordinates strictly mapping to 0-300px width and height
            const W = 300;
            const H = 200;

            // padding
            const padX = 20;
            const drawW = W - 2 * padX;

            const scale = drawW / (spread || 1);

            const cx = (val: number) => padX + (val - minX) * scale;
            const cy = (val: number) => H - 20 - (val * scale); // bottom origin

            const y0 = cy(0);

            return (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#05080b]">
                    <div className="relative w-full max-w-[400px]">
                        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" className="overflow-visible bg-[#0a0e14] border border-[#1a1f26] rounded-xl shadow-lg shadow-black/50">
                            {/* Grid/Axes */}
                            <line x1={0} y1={y0} x2={W} y2={y0} stroke="#334155" strokeWidth="1" />
                            <line x1={cx(0)} y1={0} x2={cx(0)} y2={H} stroke="#334155" strokeWidth="1" />

                            <text x={W - 10} y={y0 - 5} fill="#64748b" fontSize="8" textAnchor="end">σ (Normal)</text>
                            <text x={cx(0) + 5} y={10} fill="#64748b" fontSize="8">τ (Shear)</text>

                            {/* Circles */}
                            {/* Circle 1-3 (main) */}
                            <circle cx={cx((p1 + p3) / 2)} cy={y0} r={(p1 - p3) / 2 * scale} fill="rgba(0, 229, 255, 0.05)" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="3 3" />

                            {/* Circle 1-2 */}
                            <circle cx={cx((p1 + p2) / 2)} cy={y0} r={(p1 - p2) / 2 * scale} fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth="1" />

                            {/* Circle 2-3 */}
                            <circle cx={cx((p2 + p3) / 2)} cy={y0} r={(p2 - p3) / 2 * scale} fill="rgba(244, 63, 94, 0.1)" stroke="#f43f5e" strokeWidth="1" />

                            {/* Principal Stress Points */}
                            <circle cx={cx(p1)} cy={y0} r="3" fill="#00e5ff" />
                            <text x={cx(p1)} y={y0 + 12} fill="#00e5ff" fontSize="8" textAnchor="middle">σ1</text>

                            <circle cx={cx(p2)} cy={y0} r="3" fill="#10b981" />
                            <text x={cx(p2)} y={y0 + 12} fill="#10b981" fontSize="8" textAnchor="middle">σ2</text>

                            <circle cx={cx(p3)} cy={y0} r="3" fill="#f43f5e" />
                            <text x={cx(p3)} y={y0 + 12} fill="#f43f5e" fontSize="8" textAnchor="middle">σ3</text>

                            {/* Max Shear Line & Point */}
                            <circle cx={cx((p1 + p3) / 2)} cy={y0 - tmax * scale} r="3" fill="#eab308" />
                            <line x1={cx((p1 + p3) / 2)} y1={y0} x2={cx((p1 + p3) / 2)} y2={y0 - tmax * scale} stroke="#eab308" strokeWidth="1" strokeDasharray="2 2" />
                            <text x={cx((p1 + p3) / 2)} y={y0 - tmax * scale - 5} fill="#eab308" fontSize="8" textAnchor="middle">τmax</text>
                        </svg>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 text-center w-full max-w-[400px]">
                        <div className="bg-[#0a0e14] border border-[#1a1f26] p-2 rounded-lg">
                            <div className="text-[9px] text-gray-500 uppercase">σ1 (Max)</div>
                            <div className="text-sm font-bold text-[#00e5ff] font-mono">{p1.toFixed(1)}</div>
                        </div>
                        <div className="bg-[#0a0e14] border border-[#1a1f26] p-2 rounded-lg">
                            <div className="text-[9px] text-gray-500 uppercase">σ2 (Int)</div>
                            <div className="text-sm font-bold text-[#10b981] font-mono">{p2.toFixed(1)}</div>
                        </div>
                        <div className="bg-[#0a0e14] border border-[#1a1f26] p-2 rounded-lg">
                            <div className="text-[9px] text-gray-500 uppercase">σ3 (Min)</div>
                            <div className="text-sm font-bold text-[#f43f5e] font-mono">{p3.toFixed(1)}</div>
                        </div>
                    </div>
                </div>
            );
        }
    },
    tier: 'pro'
};

export default mohrCircle3DSchema;
