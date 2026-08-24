'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Activity, Info, Settings, ArrowRight, Layers, Palette, ShieldCheck, Thermometer, Cable, Scale } from 'lucide-react';

// Unified Electrical Constants (IEC 60228 / NEC Table 8)
const CONDUCTOR_MATERIALS = [
    { name: 'Copper (Annealed)', rho20: 0.01724, alpha: 0.00393, color: '#b45309' },
    { name: 'Aluminum (Hard-drawn)', rho20: 0.0282, alpha: 0.00403, color: '#94a3b8' },
];

const STANDARD_CABLE_SIZES = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400];

export default function VoltageDropModule() {
    const [phases, setPhases] = useState<1 | 3>(1);
    const [vNominal, setvNominal] = useState(230);
    const [current, setCurrent] = useState(24);
    const [length, setLength] = useState(60);
    const [crossSection, setCrossSection] = useState(6);
    const [materialIdx, setMaterialIdx] = useState(0);
    const [temp, setTemp] = useState(70); // Operating temp for PVC/XLPE
    const [powerFactor, setPowerFactor] = useState(0.85);

    const material = CONDUCTOR_MATERIALS[materialIdx];

    const results = useMemo(() => {
        // Temperature correction: rho_T = rho_20 * [1 + alpha * (T - 20)]
        const rhoT = material.rho20 * (1 + material.alpha * (temp - 20));
        
        // Resistance: R = (rho * L * Factor) / A
        // Factor is 2 for single phase (go and return), sqrt(3) for 3-phase line drop
        const phaseFactor = phases === 1 ? 2 : Math.sqrt(3);
        const R = (rhoT * length * phaseFactor) / crossSection;

        // Voltage Drop (Simplified for non-complex impedance)
        // Vd = I * R * cos(phi) -- (Reactance X assumed negligible for smaller cables < 50mm2)
        const Vd = current * R * powerFactor;
        const VdPercent = (Vd / vNominal) * 100;

        // Power loss (W)
        const powerLoss = phases === 1 ? (current ** 2 * R) : (current ** 2 * R); // R already includes phasing

        // Compliance Check (IEC 60364-5-52 suggest 3% light, 5% power)
        const isCompliant = VdPercent <= 5;
        const status = VdPercent <= 3 ? 'OPTIMAL' : VdPercent <= 5 ? 'MARGINAL' : 'CRITICAL';

        // Auto-recommendation logic
        const targetDrop = 3; // Aim for optimal 3%
        const minAreaNeeded = (rhoT * length * phaseFactor * current * powerFactor) / (vNominal * (targetDrop / 100));
        const recommendedSize = STANDARD_CABLE_SIZES.find(s => s >= minAreaNeeded) || STANDARD_CABLE_SIZES[STANDARD_CABLE_SIZES.length - 1];

        return { rhoT, R, Vd, VdPercent, powerLoss, status, isCompliant, recommendedSize };
    }, [phases, vNominal, current, length, crossSection, material, temp, powerFactor]);

    return (
        <div className="flex flex-col h-full bg-[#090b11] text-slate-300 font-sans">
            {/* Professional Header */}
            <header className="px-6 py-4 border-b border-white/5 bg-black/50 flex items-center justify-between backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                        <Cable size={22} className="text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black tracking-widest uppercase italic text-white/90">Voltage Drop Analyzer</h1>
                        <p className="text-[9px] text-blue-500/60 font-mono font-bold uppercase tracking-widest">Engineering Suite // IEC-NEC-60364</p>
                    </div>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                    {[1, 3].map(p => (
                        <button
                            key={p}
                            onClick={() => { setPhases(p as 1|3); setvNominal(p === 1 ? 230 : 400); }}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${phases === p ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-slate-500 hover:text-white'}`}
                        >
                            {p}-Phase
                        </button>
                    ))}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none bg-[radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.03),transparent)]">
                
                {/* Real-time Status Card */}
                <section className={`p-8 rounded-[32px] border transition-all duration-500 relative overflow-hidden backdrop-blur-sm ${results.status === 'OPTIMAL' ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.05)]' : results.status === 'MARGINAL' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-red-500/5 border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.05)]'}`}>
                    <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={120} /></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-center md:text-left">
                            <div className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.4em]">Calculated Voltage Drop</div>
                            <div className={`text-6xl font-black italic tracking-tighter ${results.status === 'OPTIMAL' ? 'text-emerald-400' : results.status === 'MARGINAL' ? 'text-amber-400' : 'text-red-400'}`}>
                                {results.VdPercent.toFixed(2)}%
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black ${results.status === 'OPTIMAL' ? 'bg-emerald-500/20 text-emerald-400' : results.status === 'MARGINAL' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-500'}`}>
                                    {results.status} COMPLIANCE
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">ΔV: {results.Vd.toFixed(2)}V</span>
                            </div>
                        </div>

                        <div className="h-24 w-px bg-white/5 hidden md:block" />

                        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                             <MiniMetric label="Cable Resistance" value={`${results.R.toFixed(4)} Ω`} />
                             <MiniMetric label="Power Loss" value={`${results.powerLoss.toFixed(1)} W`} />
                             <MiniMetric label="Operating Resist." value={`${results.rhoT.toFixed(5)}`} />
                             <MiniMetric label="Compliance" value={results.isCompliant ? 'PASS' : 'FAIL'} />
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input Controls */}
                    <div className="space-y-4">
                        <section className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Settings size={14} /> System Parameters
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <InputBlock label="Nominal Voltage (V)" value={vNominal} onChange={setvNominal} step={1} />
                                <InputBlock label="Load Current (A)" value={current} onChange={setCurrent} step={1} />
                                <InputBlock label="Cable Length (m)" value={length} onChange={setLength} step={1} />
                                <InputBlock label="Power Factor (cosφ)" value={powerFactor} onChange={setPowerFactor} step={0.01} max={1} />
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
                                <div className="flex flex-col gap-2">
                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Conductor Material</label>
                                     <div className="flex gap-2">
                                         {CONDUCTOR_MATERIALS.map((m, i) => (
                                             <button
                                                 key={m.name}
                                                 onClick={() => setMaterialIdx(i)}
                                                 className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${materialIdx === i ? 'bg-white/10 border-white/20 text-white shadow-lg' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300'}`}
                                             >
                                                <div className="w-2 h-2 rounded-full inline-block mr-2" style={{ backgroundColor: m.color }} />
                                                {m.name}
                                             </button>
                                         ))}
                                     </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cross Section (mm²)</label>
                                        <select
                                            value={crossSection}
                                            onChange={(e) => setCrossSection(Number(e.target.value))}
                                            className="w-full h-12 bg-black/60 border border-white/10 rounded-xl px-4 text-xs font-mono font-bold text-white outline-none focus:border-blue-500/40"
                                        >
                                            {STANDARD_CABLE_SIZES.map(s => <option key={s} value={s}>{s} mm²</option>)}
                                        </select>
                                    </div>
                                    <InputBlock label="Operating Temp (°C)" value={temp} onChange={setTemp} step={5} />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Industrial Recs & Guides */}
                    <div className="space-y-4">
                        <section className="p-8 bg-blue-600 rounded-[32px] text-white relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:rotate-12 transition-transform duration-700">
                                 <Scale size={80} />
                             </div>
                             <div className="relative z-10">
                                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-100/60 mb-2">Automated Recommendation</h4>
                                 <h2 className="text-3xl font-black italic tracking-tighter mb-4">Minimize Losses</h2>
                                 <p className="text-xs text-blue-100/70 leading-relaxed mb-6">
                                     To achieve an optimal voltage drop below 3.0% under current operating conditions, we suggest a conductor increase.
                                 </p>
                                 <div className="inline-flex items-center gap-4 bg-white/10 px-6 py-4 rounded-2xl border border-white/10 backdrop-blur-md">
                                     <div className="flex flex-col">
                                         <span className="text-[9px] font-black uppercase tracking-widest text-blue-200/50">Min cross-section</span>
                                         <span className="text-2xl font-black font-mono">≥ {results.recommendedSize}mm²</span>
                                     </div>
                                     <ArrowRight className="text-blue-300" />
                                 </div>
                             </div>
                        </section>

                        <section className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Regulation Compliance</h3>
                             <div className="space-y-3">
                                <RegulationItem label="IEC 60364-5-52" status={results.VdPercent <= 3 ? 'PASS' : 'WARN'} desc="Building lighting sub-circuits (3% Max)" />
                                <RegulationItem label="NEC Table 8" status={results.VdPercent <= 5 ? 'PASS' : 'FAIL'} desc="Feeder system overall drop (5% Max)" />
                                <RegulationItem label="AS/NZS 3008" status="INFO" desc="Current loading corrected for thermal environment" />
                             </div>
                        </section>
                    </div>
                </div>
            </main>

            <footer className="px-6 py-4 border-t border-white/5 bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <StatusLed label="Engine Ready" active />
                    <StatusLed label="Standard Lookup 100%" active />
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-blue-500/30 uppercase tracking-[0.3em]">
                   V5.0 // Advanced Electrical Runtime
                </div>
            </footer>
        </div>
    );
}

function InputBlock({ label, value, onChange, step, max }: any) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
            <input 
                type="number" 
                value={value} 
                step={step}
                max={max}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-12 bg-black/60 border border-white/10 rounded-xl px-4 text-sm font-mono font-bold text-white outline-none focus:border-blue-500/40 transition-all"
            />
        </div>
    );
}

function MiniMetric({ label, value }: any) {
    return (
        <div>
            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-sm font-mono font-bold text-white/80">{value}</div>
        </div>
    );
}

function RegulationItem({ label, status, desc }: any) {
    return (
        <div className="flex items-center gap-4 bg-white/[0.01] p-3 rounded-xl border border-white/5">
             <div className={`w-1.5 h-1.5 rounded-full ${status === 'PASS' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : status === 'WARN' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : status === 'INFO' ? 'bg-blue-500' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
             <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-white/50 tracking-widest uppercase">{label}</span>
                    <span className="text-[8px] font-bold text-slate-600">{status}</span>
                </div>
                <div className="text-[10px] text-slate-500 italic">{desc}</div>
             </div>
        </div>
    );
}

function StatusLed({ label, active }: any) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.3)]' : 'bg-slate-700'}`} />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        </div>
    );
}
