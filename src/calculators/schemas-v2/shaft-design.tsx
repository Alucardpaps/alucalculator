import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const shaftDesignSchema: CalculatorSchemaV2 = {
    id: 'shaft-design',
    metadata: {
        title: 'Advanced Shaft Design',
        description: 'ASME Dynamic Shaft Design considering Bending, Torsion, and Fatigue (Goodman/Soderberg).',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCAD OS',
        lastUpdated: '2026-02-12',
        tags: ['shaft', 'fatigue', 'goodman', 'soderberg', 'machine elements'],
        verifiedStandards: ['ASME B106.1M']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Constant or reversed bending moments.', impact: 'high' },
            { id: 'a2', text: 'Constant or pulsating torsion.', impact: 'high' },
            { id: 'a3', text: 'Uses DE-Goodman, DE-Gerber, or DE-Soderberg.', impact: 'medium' }
        ],
        standards: [
            { code: 'ASME B106.1M', title: 'ASME Standard for Transmission Shafting' }
        ],
        formulaLatex: 'd = \\left( \\frac{16 n}{\\pi} \\left[ \\frac{\\sqrt{4M_a^2 + 3T_a^2}}{S_e} + \\frac{\\sqrt{4M_m^2 + 3T_m^2}}{S_{ut}} \\right] \\right)^{1/3}'
    },
    inputs: [
        { key: 'Ma', label: 'Alt. Bending (Ma)', unit: 'Nm', defaultValue: 150, description: 'Alternating Bending Moment', validation: { required: true, min: 0 } },
        { key: 'Mm', label: 'Mean Bending (Mm)', unit: 'Nm', defaultValue: 0, description: 'Mean Bending Moment', validation: { required: true, min: 0 } },
        { key: 'Ta', label: 'Alt. Torsion (Ta)', unit: 'Nm', defaultValue: 0, description: 'Alternating Torsional Moment', validation: { required: true, min: 0 } },
        { key: 'Tm', label: 'Mean Torsion (Tm)', unit: 'Nm', defaultValue: 200, description: 'Mean Torsional Moment', validation: { required: true, min: 0 } },
        { key: 'Sut', label: 'Ultimate Strength (Sut)', unit: 'MPa', defaultValue: 600, description: 'Ultimate Tensile Strength', validation: { required: true, min: 10 } },
        { key: 'Sy', label: 'Yield Strength (Sy)', unit: 'MPa', defaultValue: 450, description: 'Yield Strength', validation: { required: true, min: 10 } },
        { key: 'Se', label: 'Endurance Limit (Se)', unit: 'MPa', defaultValue: 200, description: 'Modified Endurance Limit (ka*kb*kc...*Se\')', validation: { required: true, min: 1 } },
        { key: 'Kf', label: 'Fatigue Factor (Kf)', unit: '-', defaultValue: 1.5, description: 'Fatigue stress concentration factor (Bending)', validation: { required: true, min: 1 } },
        { key: 'Kfs', label: 'Fatigue Factor (Kfs)', unit: '-', defaultValue: 1.2, description: 'Fatigue stress concentration factor (Torsion)', validation: { required: true, min: 1 } },
        { key: 'n', label: 'Safety Factor (n)', unit: '-', defaultValue: 2.0, description: 'Target Factor of Safety', validation: { required: true, min: 1 } },
        { key: 'theory', label: 'Failure Theory', unit: '-', defaultValue: 'Goodman', description: '0: Goodman, 1: Soderberg, 2: Gerber', validation: { required: true, min: 0, max: 2 } }
    ],
    outputs: [
        { key: 'dReq', label: 'Required Dia (d)', unit: 'mm', description: 'Minimum required shaft diameter.', precision: 2, formulaLatex: 'd = f(M, T, S_e, S_{ut})' },
        { key: 'sigmaA', label: 'Alt. Von Mises (σa\')', unit: 'MPa', description: 'Alternating equivalent stress.', precision: 1, formulaLatex: '\\sigma_a\' = \\frac{16}{\\pi d^3} \\sqrt{4(K_f M_a)^2 + 3(K_{fs} T_a)^2}' },
        { key: 'sigmaM', label: 'Mean Von Mises (σm\')', unit: 'MPa', description: 'Mean equivalent stress.', precision: 1, formulaLatex: '\\sigma_m\' = \\frac{16}{\\pi d^3} \\sqrt{4(K_f M_m)^2 + 3(K_{fs} T_m)^2}' },
    ],
    calculationEngine: (inputs) => {
        const Ma = Number(inputs.Ma.value);
        const Mm = Number(inputs.Mm.value);
        const Ta = Number(inputs.Ta.value);
        const Tm = Number(inputs.Tm.value);
        const Sut = Number(inputs.Sut.value);
        const Sy = Number(inputs.Sy.value);
        const Se = Number(inputs.Se.value);
        const Kf = Number(inputs.Kf.value);
        const Kfs = Number(inputs.Kfs.value);
        const n = Number(inputs.n.value);
        // We will default to Goodman for text 'Goodman', since V2 UI might pass string or number.
        const theoryStr = String(inputs.theory.value).toLowerCase();

        // Calculate equivalence terms (ignoring the 16/(pi*d^3) initially for diameter solving)
        const A = Math.sqrt(4 * Math.pow(Kf * Ma, 2) + 3 * Math.pow(Kfs * Ta, 2));
        const B = Math.sqrt(4 * Math.pow(Kf * Mm, 2) + 3 * Math.pow(Kfs * Tm, 2));

        let dKub: number;

        if (theoryStr.includes('soderberg') || theoryStr === '1') {
            // DE-Soderberg: 1/n = sigma_a/Se + sigma_m/Sy
            dKub = (16 * n / Math.PI) * ((A / Se) + (B / Sy));
        } else if (theoryStr.includes('gerber') || theoryStr === '2') {
            // DE-Gerber: 1/n = sigma_a/Se + (sigma_m/Sut)^2 * n
            // This requires solving a cubic if we do it backwards, but the standard direct equation is:
            // d = ( (8 * n * A) / (pi * Se) * ( 1 + ( 1 + (2*B*Se/(A*Sut))^2 )^0.5 ) )^(1/3)
            dKub = ((8 * n * A) / (Math.PI * Se)) * (1 + Math.sqrt(1 + Math.pow((2 * B * Se) / (A * Sut), 2)));
        } else {
            // DE-Goodman (Default): 1/n = sigma_a/Se + sigma_m/Sut
            dKub = (16 * n / Math.PI) * ((A / Se) + (B / Sut));
        }

        const d_m = Math.pow(dKub, 1 / 3); // in mm (if M,T were N-mm and S were MPa)
        // WAIT: Ma, Tm are in Nm!
        // We need them in N-mm to get d in mm using MPa (N/mm^2).
        const Ma_nmm = Ma * 1000;
        const Mm_nmm = Mm * 1000;
        const Ta_nmm = Ta * 1000;
        const Tm_nmm = Tm * 1000;

        const A_nmm = Math.sqrt(4 * Math.pow(Kf * Ma_nmm, 2) + 3 * Math.pow(Kfs * Ta_nmm, 2));
        const B_nmm = Math.sqrt(4 * Math.pow(Kf * Mm_nmm, 2) + 3 * Math.pow(Kfs * Tm_nmm, 2));

        let dKub_real = 0;
        if (theoryStr.includes('soderberg') || theoryStr === '1') {
            dKub_real = (16 * n / Math.PI) * ((A_nmm / Se) + (B_nmm / Sy));
        } else if (theoryStr.includes('gerber') || theoryStr === '2') {
            dKub_real = ((8 * n * A_nmm) / (Math.PI * Se)) * (1 + Math.sqrt(1 + Math.pow((2 * B_nmm * Se) / (A_nmm * Sut), 2)));
        } else {
            dKub_real = (16 * n / Math.PI) * ((A_nmm / Se) + (B_nmm / Sut));
        }

        const dReq = Math.pow(dKub_real, 1 / 3);

        // Actual stresses given this diameter
        const factor = 16 / (Math.PI * Math.pow(dReq, 3));
        const sigmaA = factor * A_nmm;
        const sigmaM = factor * B_nmm;

        return {
            outputs: {
                dReq: createValidatedValue(dReq, 'mm', 'derived'),
                sigmaA: createValidatedValue(sigmaA, 'MPa', 'derived'),
                sigmaM: createValidatedValue(sigmaM, 'MPa', 'derived')
            },
            verified: true,
            warnings: dReq > 200 ? [{ field: 'dReq', message: 'Calculated diameter > 200mm. Consider hollow shafts or material upgrade.', severity: 'info' }] : [],
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result) => {
            const out = result.outputs || {};
            const dReq = (out.dReq?.value as number) || 25;
            const Sa = (out.sigmaA?.value as number) || 0;
            const Sm = (out.sigmaM?.value as number) || 0;
            
            // Scaled fatigue plot coordinates
            const maxS = Math.max(Sa, Sm, 150) * 1.4;
            const pxSm = 25 + Math.min(130, (Sm / maxS) * 110);
            const pxSa = 145 - Math.min(110, (Sa / maxS) * 95);

            return (
                <div className="w-full h-full flex flex-col md:flex-row items-center justify-between p-4 bg-[var(--bg-0)] gap-4 font-mono text-slate-300">
                    {/* Visual Shaft CAD & Goodman Fatigue SVG */}
                    <div className="relative w-full md:w-[260px] h-[220px] bg-black/40 rounded-xl border border-white/5 p-2 flex items-center justify-center">
                        <svg viewBox="0 0 240 180" className="w-full h-full overflow-visible select-none">
                            <defs>
                                <linearGradient id="shaftSteelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#94a3b8" />
                                    <stop offset="30%" stopColor="#475569" />
                                    <stop offset="70%" stopColor="#334155" />
                                    <stop offset="100%" stopColor="#0f172a" />
                                </linearGradient>
                            </defs>

                            {/* Goodman Fatigue Coordinate Axes */}
                            <line x1="25" y1="150" x2="215" y2="150" stroke="#475569" strokeWidth="1" />
                            <line x1="25" y1="150" x2="25" y2="25" stroke="#475569" strokeWidth="1" />
                            <text x="210" y="162" fill="#94a3b8" fontSize="7.5" textAnchor="end">σm (Ortalama Gerilme MPa)</text>
                            <text x="28" y="22" fill="#94a3b8" fontSize="7.5" textAnchor="start">σa (Genlik Gerilmesi MPa)</text>

                            {/* Goodman Limit Line */}
                            <line x1="25" y1="45" x2="195" y2="150" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 2" />
                            <text x="185" y="142" fill="#10b981" fontSize="7" textAnchor="end">Goodman Sınırı</text>

                            {/* Soderberg Yield Limit Line */}
                            <line x1="25" y1="65" x2="160" y2="150" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 1" />
                            <text x="150" y="132" fill="#f59e0b" fontSize="6.5" textAnchor="end">Soderberg (Sy)</text>

                            {/* Operating Load Line from Origin */}
                            <line x1="25" y1="150" x2={pxSm} y2={pxSa} stroke="#38bdf8" strokeWidth="1.5" />

                            {/* Active Operating State Point */}
                            <circle cx={pxSm} cy={pxSa} r="4.5" fill="#38bdf8" className="animate-ping" opacity="0.6" />
                            <circle cx={pxSm} cy={pxSa} r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
                            <line x1="25" y1={pxSa} x2={pxSm} y2={pxSa} stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="2 2" />
                            <line x1={pxSm} y1="150" x2={pxSm} y2={pxSa} stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="2 2" />

                            <text x={pxSm + 6} y={pxSa - 3} fill="#38bdf8" fontSize="7.5" fontWeight="bold">
                                Çalışma Noktası ({Sm.toFixed(0)}, {Sa.toFixed(0)})
                            </text>
                        </svg>
                    </div>

                    {/* Engineering Data Summary Cards */}
                    <div className="flex-1 grid grid-cols-2 gap-2 w-full text-[10px]">
                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                            <div className="text-slate-500 uppercase text-[8px] font-bold">Gerekli Mil Çapı (dreq)</div>
                            <div className="text-base font-bold text-cyan-300">
                                Ø{dReq.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">mm</span>
                            </div>
                            <div className="text-[8px] text-slate-500">ASME B106.1M Standardı</div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                            <div className="text-slate-500 uppercase text-[8px] font-bold">Genlik Eşdeğer Gerilme</div>
                            <div className="text-base font-bold text-amber-300">
                                {Sa.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">MPa</span>
                            </div>
                            <div className="text-[8px] text-slate-500">Dönel Eğilme Genliği (σa')</div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                            <div className="text-slate-500 uppercase text-[8px] font-bold">Ortalama Eşdeğer Gerilme</div>
                            <div className="text-base font-bold text-blue-300">
                                {Sm.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">MPa</span>
                            </div>
                            <div className="text-[8px] text-slate-500">Statik Burulma/Eğilme (σm')</div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                            <div className="text-slate-500 uppercase text-[8px] font-bold">Yorulma Güvenliği</div>
                            <div className="text-base font-bold text-emerald-300">
                                n = 2.00 (Hedef)
                            </div>
                            <div className="text-[8px] text-slate-500">DE-Goodman Yorulma Kriteri</div>
                        </div>
                    </div>
                </div>
            );
        }
    },
    tier: 'pro'
};

export default shaftDesignSchema;

