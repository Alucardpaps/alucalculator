'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Construction, Ruler, Layers, Activity, 
    Zap, Info, Target, Maximize2, Shield, 
    HardHat, Hammer, FileText, Settings, ShieldAlert
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { useOSStore } from '@/store/osStore';
import { getConcreteReinforcementStrings, formatConcreteDeficitMsg } from '@/locales/concreteReinforcementTranslations';

export default function ConcreteReinforcement() {
    const { language } = useI18nStore();
    const { dictionary: dict } = useOSStore();
    const civilDict = dict?.civil || {};
    const c = getConcreteReinforcementStrings(language);

    // Inputs
    const [b, setB] = useState(300); // Width (mm)
    const [h, setH] = useState(600); // Height (mm)
    const [cover, setCover] = useState(35); // Concrete cover (mm)
    const [fck, setFck] = useState(25); // Concrete Class (MPa)
    const [fyk, setFyk] = useState(500); // Steel Grade (MPa)
    const [M_ed, setM_ed] = useState(250); // Design Moment (kNm)
    
    const [barDia, setBarDia] = useState(20); // Main bar diameter (mm)
    const [numBars, setNumBars] = useState(4); // Number of bars
    const [codeStandard, setCodeStandard] = useState<'ec2' | 'aci318'>('ec2');

    // Logic: Dual Engine (Eurocode 2 vs ACI 318-19 / CODE-318-25)
    const stats = useMemo(() => {
        // d: Effective depth
        const d = h - cover - barDia / 2 - 10; // assuming 10mm stirrups
        const As_prov = numBars * (Math.PI * Math.pow(barDia, 2) / 4);
        const M_ed_Nm = M_ed * 1e6;

        if (codeStandard === 'aci318') {
            // ACI 318-19 & ACI CODE-318-25: Whitney equivalent rectangular stress block
            // beta1 factor per ACI 318
            const beta1 = fck <= 28 ? 0.85 : Math.max(0.65, 0.85 - (0.05 * (fck - 28)) / 7);
            const phi = 0.90; // tension-controlled flexural strength reduction factor

            // Required As from quadratic solution of phi * As * fy * (d - a/2) = Mu:
            // (phi * fy^2 / (1.7 * fc * b)) * As^2 - (phi * fy * d) * As + Mu = 0
            const coeffA = (phi * Math.pow(fyk, 2)) / (1.7 * fck * b);
            const coeffB = -(phi * fyk * d);
            const coeffC = M_ed_Nm;
            const disc = Math.pow(coeffB, 2) - 4 * coeffA * coeffC;
            const As_req = disc >= 0 ? (-coeffB - Math.sqrt(disc)) / (2 * coeffA) : 9999;

            // Provided capacity: a = As_prov * fy / (0.85 * fc * b)
            const a = (As_prov * fyk) / (0.85 * fck * b);
            const Mn_kNm = (As_prov * fyk * (d - a / 2)) * 1e-6;
            const phiMn_kNm = phi * Mn_kNm;

            // Neutral axis depth c = a / beta1
            const c_na = a / beta1;
            const cd_ratio = c_na / d; // c/d <= 0.375 ensures tension-controlled section (et >= 0.005)
            const isTensionControlled = cd_ratio <= 0.375;
            const isSafe = phiMn_kNm >= M_ed && isTensionControlled && As_prov >= As_req;
            const z = d - a / 2;
            const K = a / d; // compression block depth ratio

            return {
                d,
                K,
                z,
                As_req,
                As_prov,
                isSafe,
                phiMn_kNm,
                codeLabel: 'ACI 318-19 / CODE-318-25',
                codeStandard: 'aci318' as const,
                kLabel: 'a/d Ratio',
                kLimitText: isTensionControlled ? 'Tension-controlled (φ=0.9)' : 'Compression Failure Risk',
            };
        }

        // Default: Eurocode 2 (EN 1992-1-1:2004+A1:2014)
        // K = M / (b * d^2 * fck)
        const K = M_ed_Nm / (b * Math.pow(d, 2) * fck);
        
        // lever arm z = d * [0.5 + sqrt(0.25 - K/1.134)]
        const z = d * (0.5 + Math.sqrt(0.25 - Math.min(0.225, K / 1.134)));
        
        // Required As = M / (fy / 1.15 * z)
        const As_req = M_ed_Nm / ((fyk / 1.15) * z);
        const isSafe = As_prov >= As_req && K <= 0.167; // 0.167 is typical limit for singly reinforced section
        
        return {
            d,
            K,
            z,
            As_req,
            As_prov,
            isSafe,
            codeLabel: 'EN 1992-1-1 (Eurocode 2)',
            codeStandard: 'ec2' as const,
            kLabel: 'K-Factor',
            kLimitText: K > 0.167 ? c.doubleReinforced : c.singleReinforced,
        };
    }, [b, h, cover, fck, fyk, M_ed, barDia, numBars, codeStandard, c]);

    return (
        <div className="flex w-full h-full bg-[var(--bg-0)] text-white overflow-hidden relative ">
            {/* Visual Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* LEFT PANEL */}
            <div className="w-[340px] bg-[var(--bg-0)]/95 border-r border-white/5 flex flex-col z-20 shadow-2xl">
                <div className="p-8 border-b border-white/5 ">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)] ">
                            <Construction size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter uppercase leading-none">{civilDict.title || "Rebar Node"}</h1>
                            <p className="text-[10px] text-orange-500/60 font-mono tracking-widest uppercase mt-1">{stats.codeLabel}</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    {/* Design Code Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
                            <Layers size={12} /> {c.designCode || "Design Code"}
                        </label>
                        <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                            <button
                                type="button"
                                onClick={() => setCodeStandard('ec2')}
                                className={`py-1.5 px-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                    codeStandard === 'ec2'
                                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-lg '
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                Eurocode 2
                            </button>
                            <button
                                type="button"
                                onClick={() => setCodeStandard('aci318')}
                                className={`py-1.5 px-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                    codeStandard === 'aci318'
                                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-lg '
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                ACI 318-25
                            </button>
                        </div>
                    </div>
                    {/* Beam Geometry */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                           <Ruler size={12} /> {c.beamGeometry}
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <ParameterInput label={c.width} unit="mm" value={b} min={150} max={1000} step={10} onChange={setB} icon={<Maximize2 size={12}/>} />
                            <ParameterInput label={c.height} unit="mm" value={h} min={200} max={2000} step={10} onChange={setH} icon={<Maximize2 size={12}/>} />
                        </div>
                        <ParameterInput label={c.cover} unit="mm" value={cover} min={20} max={100} step={5} onChange={setCover} icon={<Shield size={12}/>} />
                    </div>

                    <div className="w-full h-px bg-white/5" />

                    {/* Material Classes */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                           <Layers size={12} /> {c.propertyMatrix}
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <ParameterInput label={c.concreteFck} unit="MPa" value={fck} min={20} max={60} step={5} onChange={setFck} icon={<Activity size={12}/>} />
                            <ParameterInput label={c.steelFyk} unit="MPa" value={fyk} min={400} max={600} step={10} onChange={setFyk} icon={<Activity size={12}/>} />
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5" />

                    {/* Loading & Rebar */}
                    <div className="space-y-4 pb-8">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                           <Zap size={12} /> {c.designVector}
                        </h2>
                        <ParameterInput label={c.moment} unit="kNm" value={M_ed} min={10} max={1500} step={10} onChange={setM_ed} icon={<Target size={12}/>} />
                        
                        <div className="mt-6 border-t border-white/5 pt-6 space-y-4">
                             <ParameterInput label={c.barDiameter} unit="mm" value={barDia} min={8} max={40} step={2} onChange={setBarDia} icon={<Hammer size={12}/>} />
                             <ParameterInput label={c.quantity} unit="" value={numBars} min={2} max={12} step={1} onChange={setNumBars} icon={<Settings size={12}/>} />
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN DASHBOARD */}
            <div className="flex-1 flex flex-col p-8 lg:p-12 gap-8 overflow-y-auto z-10">

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <ValueCard label={civilDict.requiredAs || "Required Area (As)"} value={stats.As_req.toFixed(0)} unit="mm²" sub={c.tensionRebar} color={stats.isSafe ? '#22d3ee' : '#f87171'} />
                    <ValueCard label={civilDict.actualAs || "Provided Area"} value={stats.As_prov.toFixed(0)} unit="mm²" sub={(stats.As_prov/stats.As_req*100).toFixed(0) + c.percentRatio} color={stats.isSafe ? '#10b981' : '#f59e0b'} />
                    <ValueCard label={stats.kLabel} value={stats.K.toFixed(3)} unit="RATIO" sub={stats.kLimitText} color={stats.K > (stats.codeStandard === 'ec2' ? 0.167 : 0.375) ? '#ef4444' : '#64748b'} />
                </div>

                {/* Cross-Section Visualization */}
                <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-12 flex flex-col relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8">
                        <div className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest ${stats.isSafe ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                           {stats.isSafe ? (stats.codeStandard === 'ec2' ? c.ec2Compliant : 'ACI 318 PASS') : c.reinforcementDeficit}
                        </div>
                    </div>

                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-12 flex items-center gap-3">
                        <HardHat size={14} className="text-orange-500" />
                        {c.profileSection}
                    </h3>

                    <div className="flex-1 flex items-center justify-center relative translate-y-[-20px]">
                        {/* Beam Section SVG */}
                        <svg className="w-full h-full max-w-[400px] max-h-[400px]" viewBox="0 0 100 100">
                             {/* Concrete Outline */}
                             <rect x="25" y="10" width="50" height="80" rx="2" fill="#1e293b" fillOpacity="0.5" stroke="#475569" strokeWidth="2" />
                             
                             {/* Concrete Texture Points */}
                             <circle cx="35" cy="25" r="0.5" fill="white" fillOpacity="0.1" />
                             <circle cx="65" cy="45" r="0.8" fill="white" fillOpacity="0.1" />
                             <circle cx="45" cy="75" r="0.4" fill="white" fillOpacity="0.1" />
                             <circle cx="60" cy="15" r="0.6" fill="white" fillOpacity="0.1" />

                             {/* Stirrups (Links) */}
                             <rect x="28" y="13" width="44" height="74" rx="3" fill="none" stroke="#f87171" strokeWidth="1" strokeDasharray="2 1" />
                             
                             {/* Tension Reinforcement (Bottom) */}
                             {Array.from({ length: numBars }).map((_, i) => (
                                  <motion.circle 
                                     key={i}
                                     cx={32 + (36 / (numBars - 1)) * i} 
                                     cy="82" 
                                     r={barDia / 10} 
                                     fill="#22d3ee" 
                                     initial={{ scale: 0 }}
                                     animate={{ scale: 1 }}
                                     className=""
                                  />
                             ))}

                             {/* Compression Reinforcement (Top - 2 nominal bars) */}
                             <circle cx="32" cy="18" r="1.5" fill="#64748b" />
                             <circle cx="68" cy="18" r="1.5" fill="#64748b" />
                             
                             {/* Dimensions */}
                             <line x1="20" y1="10" x2="20" y2="90" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
                             <text x="15" y="50" transform="rotate(-90 15 50)" fill="#64748b" fontSize="4" fontWeight="bold">{h}mm</text>
                             
                             <line x1="25" y1="100" x2="75" y2="100" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
                             <text x="50" y="105" textAnchor="middle" fill="#64748b" fontSize="4" fontWeight="bold">{b}mm</text>
                        </svg>

                        {/* Annotations */}
                        <div className="absolute top-1/2 left-[calc(50%+100px)] flex flex-col gap-6">
                             <div className="flex gap-4 items-center">
                                  <div className="w-3 h-3 rounded-full bg-[var(--cyan)] " />
                                  <div className="text-[10px] font-bold text-slate-400">{c.mainTension}: {numBars}xØ{barDia}</div>
                             </div>
                             <div className="flex gap-4 items-center">
                                  <div className="w-3 h-3 rounded-full border border-[var(--bad)] bg-[var(--bad)]/20" />
                                  <div className="text-[10px] font-bold text-slate-400">{c.shearLinks}: H8-200</div>
                             </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-between items-end border-t border-white/5 pt-8">
                        <div className="flex gap-10">
                             <div>
                                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{c.designCode}</span>
                                  <div className="text-xl font-black text-white">{stats.codeLabel}</div>
                             </div>
                             <div className="w-px h-8 bg-white/10 self-center" />
                             <div>
                                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{c.steelStrain}</span>
                                  <div className="text-xl font-black text-orange-400">{stats.codeStandard === 'ec2' ? `3.5‰ (${c.yielded})` : `εt ≥ 0.005 (${c.yielded})`}</div>
                             </div>
                        </div>
                        <div className="text-right flex gap-4 items-center">
                             <button className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 transition-all text-slate-500 hover:text-white">
                                  <FileText size={20} />
                             </button>
                             <div className="text-left">
                                  <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{c.civilKernel}</div>
                                  <div className="text-2xl font-black font-mono text-white tracking-tighter">REBAR_CORE_v6.1</div>
                             </div>
                        </div>
                    </div>
                </div>
                
                {/* Warnings Display */}
                {!stats.isSafe && (
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-12 left-12 right-12 mx-auto bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-4 text-red-400 z-50">
                        <ShieldAlert size={24} />
                        <div className="text-xs font-bold uppercase tracking-widest leading-relaxed">
                            {formatConcreteDeficitMsg(c, M_ed)} <br/>
                            {c.deficitHint}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

function ParameterInput({ label, unit, value, min, max, step, onChange, icon }: any) {
    return (
        <div className="space-y-2 group">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">{icon} {label}</span>
                <span className="text-[10px] font-mono text-orange-400">{value} {unit}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--cyan)]" />
        </div>
    );
}

function ValueCard({ label, value, unit, sub, color }: any) {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Construction size={64}/></div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black font-mono text-white leading-none tracking-tighter" style={{ color: color }}>{value}</div>
                {unit && <span className="text-sm font-bold text-slate-600 uppercase italic leading-none">{unit}</span>}
            </div>
            {sub && <div className="text-[9px] font-bold mt-2 uppercase tracking-widest text-[var(--muted)]">{sub}</div>}
        </div>
    );
}
