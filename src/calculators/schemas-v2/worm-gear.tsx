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
        author: 'AluCAD OS',
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
        { key: 'Ploss', label: 'Heat Loss Power (Ploss)', unit: 'kW', description: 'Frictional thermal dissipation rate', precision: 3, formulaLatex: 'P_{loss} = P_{in} \\cdot (1 - \\eta)' },
        { key: 'a', label: 'Center Distance (a)', unit: 'mm', description: 'Shaft centre distance of the worm pair', precision: 2, formulaLatex: 'a = (d_1 + d_2)/2' },
        { key: 'Ft1', label: 'Worm Tangential Ft1', unit: 'N', description: 'Tangential force on the worm (axial on the wheel)', precision: 0, formulaLatex: 'F_{t1} = 2000 T_1 / d_1' },
        { key: 'Fa1', label: 'Worm Axial Fa1', unit: 'N', description: 'Axial force on the worm (= wheel tangential Ft2)', precision: 0, formulaLatex: 'F_{a1} = F_{t1} \\frac{\\cos\\alpha_n \\cos\\gamma - \\mu \\sin\\gamma}{\\cos\\alpha_n \\sin\\gamma + \\mu \\cos\\gamma}' },
        { key: 'Fr', label: 'Radial Force Fr', unit: 'N', description: 'Separating force on both shafts', precision: 0, formulaLatex: 'F_r = \\frac{F_{t1} \\sin\\alpha_n}{\\cos\\alpha_n \\sin\\gamma + \\mu \\cos\\gamma}' },
        { key: 'selfLock', label: 'Self-Locking', unit: '-', description: '1 = irreversible (γ < friction angle). 0 = back-drivable.', precision: 0, formulaLatex: '\\gamma < \\arctan(\\mu / \\cos\\alpha_n)' },
        { key: 'muAgma', label: 'AGMA μ(vs)', unit: '-', description: 'AGMA 6034 sliding-speed friction for oil-lubricated steel/bronze', precision: 3, formulaLatex: '\\mu \\approx 0.025 + 0.025 / v_s^{0.45}' }
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
        const a = (d1 + d2) / 2;
        const Ft1 = d1 > 0 ? (2000 * T1) / d1 : 0;
        // Shigley eq. 13-43 (worm driving), friction included so that Fa1 = Ft2 = 2·T2/d2 with T2 = T1·i·η
        const forceDen = cosAlpha * Math.sin(gammaRad) + mu * Math.cos(gammaRad);
        const Fa1 = forceDen > 1e-9 ? (Ft1 * (cosAlpha * Math.cos(gammaRad) - mu * Math.sin(gammaRad))) / forceDen : 0;
        const Fr = forceDen > 1e-9 ? (Ft1 * Math.sin(alphaRad)) / forceDen : 0;
        const muAgma = 0.025 + 0.025 / Math.pow(Math.max(vs, 0.2), 0.45);
        const frictionAngleDeg = Math.atan(mu / Math.max(0.2, Math.cos(alphaRad))) * (180 / Math.PI);
        const selfLock = gamma < frictionAngleDeg ? 1 : 0;

        const warnings: { field: string; message: string; severity: "info" | "warning" | "critical" }[] = [];

        if (selfLock) {
            warnings.push({
                field: 'gamma',
                message: `Self-locking: lead angle ${gamma.toFixed(1)}° < friction angle ${frictionAngleDeg.toFixed(1)}°. Back-driving is blocked.`,
                severity: 'warning'
            });
        } else if (gamma < 5) {
            warnings.push({
                field: 'gamma',
                message: `Low lead angle (${gamma.toFixed(1)}°) leads to high friction and potential low-efficiency self-locking (back-driving is blocked).`,
                severity: 'warning'
            });
        }
        if (Math.abs(mu - muAgma) / muAgma > 0.35) {
            warnings.push({
                field: 'mu',
                message: `Entered μ=${mu.toFixed(3)} differs from AGMA 6034 estimate μ(vs)=${muAgma.toFixed(3)} at vs=${vs.toFixed(2)} m/s.`,
                severity: 'info'
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
                Ploss: createValidatedValue(P_loss, 'kW', 'derived'),
                a: createValidatedValue(a, 'mm', 'derived'),
                Ft1: createValidatedValue(Ft1, 'N', 'derived'),
                Fa1: createValidatedValue(Fa1, 'N', 'derived'),
                Fr: createValidatedValue(Fr, 'N', 'derived'),
                selfLock: createValidatedValue(selfLock, '-', 'derived'),
                muAgma: createValidatedValue(muAgma, '-', 'derived')
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
            const gamma = (out.gamma?.value as number) || 8.5;
            const T2 = (out.T2?.value as number) || 0;
            const Ploss = (out.Ploss?.value as number) || 0;
            const vs = (out.vs?.value as number) || 0;
            
            // Scaled diameters for SVG rendering inside 240x200 viewport
            const r2 = 65;
            const r1 = 26;
            const cx = 110;
            const cyGear = 125;
            const cyWorm = 36;

            return (
                <div className="w-full h-full flex flex-col md:flex-row items-center justify-between p-4 bg-[var(--bg-0)] gap-4 font-mono text-slate-300">
                    {/* Worm-Gear Layout SVG */}
                    <div className="relative w-full md:w-[260px] h-[220px] bg-black/40 rounded-xl border border-white/5 p-2 flex items-center justify-center">
                        <svg viewBox="0 0 240 200" className="w-full h-full overflow-visible select-none">
                            <defs>
                                <linearGradient id="wormShaftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#7dd3fc" />
                                    <stop offset="35%" stopColor="#0284c7" />
                                    <stop offset="70%" stopColor="#0369a1" />
                                    <stop offset="100%" stopColor="#082f49" />
                                </linearGradient>
                                <linearGradient id="wormGearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#22d3ee" />
                                    <stop offset="40%" stopColor="#0891b2" />
                                    <stop offset="80%" stopColor="#0e7490" />
                                    <stop offset="100%" stopColor="#164e63" />
                                </linearGradient>
                                <filter id="wormGlow">
                                    <feGaussianBlur stdDeviation="3" result="glow" />
                                    <feMerge>
                                        <feMergeNode in="glow" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* ─── 1. WORM SHAFT (Horizontal) ─── */}
                            <line x1="15" y1={cyWorm} x2="205" y2={cyWorm} stroke="#334155" strokeWidth="8" strokeLinecap="round" />
                            {/* Worm Thread Body */}
                            <rect x="55" y={cyWorm - r1/2} width="110" height={r1} rx="3" fill="url(#wormShaftGrad)" stroke="#38bdf8" strokeWidth="1.2" />
                            
                            {/* Spiral thread markings with Lead Angle slant */}
                            {[-35, -20, -5, 10, 25, 40].map((offset, idx) => (
                                <line
                                    key={idx}
                                    x1={cx + offset - 6}
                                    y1={cyWorm - r1/2 + 2}
                                    x2={cx + offset + 8}
                                    y2={cyWorm + r1/2 - 2}
                                    stroke="#ffffff"
                                    strokeWidth="2"
                                    strokeOpacity="0.8"
                                    strokeLinecap="round"
                                />
                            ))}

                            {/* ─── 2. WORM GEAR (Vertical Disk) ─── */}
                            {/* Pitch Circle */}
                            <circle cx={cx} cy={cyGear} r={r2} fill="url(#wormGearGrad)" stroke="#00e5ff" strokeWidth="1.5" opacity="0.85" />
                            {/* Inner Rim */}
                            <circle cx={cx} cy={cyGear} r={r2 * 0.72} fill="#06121e" stroke="#00e5ff" strokeWidth="1" opacity="0.5" />
                            {/* Hub & Shaft Bore */}
                            <circle cx={cx} cy={cyGear} r="14" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                            <circle cx={cx} cy={cyGear} r="7" fill="#03060a" stroke="#475569" strokeWidth="1.5" />
                            <path d={`M ${cx - 3} ${cyGear} L ${cx + 3} ${cyGear} M ${cx} ${cyGear - 3} L ${cx} ${cyGear + 3}`} stroke="#ffffff" strokeWidth="1" />

                            {/* Teeth indicators on outer circumference */}
                            {Array.from({ length: 16 }).map((_, idx) => {
                                const angle = (idx * (2 * Math.PI)) / 16;
                                const tx = cx + Math.cos(angle) * r2;
                                const ty = cyGear + Math.sin(angle) * r2;
                                const tx2 = cx + Math.cos(angle) * (r2 + 4);
                                const ty2 = cyGear + Math.sin(angle) * (r2 + 4);
                                return (
                                    <line key={idx} x1={tx} y1={ty} x2={tx2} y2={ty2} stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" />
                                );
                            })}

                            {/* ─── 3. MESH CONTACT ZONE & ACTION ─── */}
                            <g transform={`translate(${cx}, ${(cyWorm + cyGear) / 2 - 4})`}>
                                <circle cx="0" cy="0" r="10" fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="2 2" className="animate-pulse" />
                                <circle cx="0" cy="0" r="3.5" fill="#f59e0b" filter="url(#wormGlow)" />
                            </g>

                            {/* CAD Dimension Leaders */}
                            {/* Center Distance a */}
                            <line x1="210" y1={cyWorm} x2="210" y2={cyGear} stroke="#38bdf8" strokeWidth="1" />
                            <line x1="205" y1={cyWorm} x2="215" y2={cyWorm} stroke="#38bdf8" strokeWidth="1" />
                            <line x1="205" y1={cyGear} x2="215" y2={cyGear} stroke="#38bdf8" strokeWidth="1" />
                            <text x="218" y={(cyWorm + cyGear) / 2 + 3} fill="#38bdf8" fontSize="8" fontWeight="bold">a (Eksenler Arası)</text>
                        </svg>
                    </div>

                    {/* Engineering Data Summary Cards */}
                    <div className="flex-1 grid grid-cols-2 gap-2 w-full text-[10px]">
                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                            <div className="text-slate-500 uppercase text-[8px] font-bold">Mekanik Verim (η)</div>
                            <div className={`text-base font-bold ${eta < 50 ? 'text-red-400' : eta < 75 ? 'text-amber-400' : 'text-emerald-300'}`}>
                                {eta.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">%</span>
                            </div>
                            <div className="text-[8px] text-slate-500">Isı Kaybı: {Ploss.toFixed(2)} kW</div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                            <div className="text-slate-500 uppercase text-[8px] font-bold">Çıkış Torku (T₂)</div>
                            <div className="text-base font-bold text-cyan-300">
                                {T2.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">Nm</span>
                            </div>
                            <div className="text-[8px] text-slate-500">Kayma Hızı: {vs.toFixed(2)} m/s</div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                            <div className="text-slate-500 uppercase text-[8px] font-bold">Helis Eğim Açısı (γ)</div>
                            <div className={`text-base font-bold ${gamma < 5 ? 'text-amber-400' : 'text-cyan-300'}`}>
                                {gamma.toFixed(2)}°
                            </div>
                            <div className="text-[8px] text-slate-500">{gamma < 5 ? 'Oto-Blokaj Riski' : 'Serbest Dönüş'}</div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                            <div className="text-slate-500 uppercase text-[8px] font-bold">Çark Taksimat Çapı</div>
                            <div className="text-base font-bold text-white">
                                Ø{d2.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">mm</span>
                            </div>
                            <div className="text-[8px] text-slate-500">DIN 3975 Standart</div>
                        </div>
                    </div>
                </div>
            );
        }
    },
    tier: 'free'
};

export default wormGearSchema;

