'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, Activity, Info, Settings, ArrowRight, 
    Layers, ShieldCheck, Thermometer, Anchor, 
    RotateCcw, Maximize2, Share2, Download
} from 'lucide-react';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

export default function ThreePhasePowerModule() {
    const { language } = useI18nStore();
    const precision = useGlobalPrecision();
    const [connection, setConnection] = useState<'Delta' | 'Wye'>('Wye');
    const [vLine, setVLine] = useState(400); // 400V RMS Line-to-Line
    const [iLine, setILine] = useState(10);  // 10A Line Current
    const [pf, setPF] = useState(0.85);      // Power Factor
    const [freq, setFreq] = useState(50);    // Frequency (Hz)

    const stats = useMemo(() => {
        // Basic 3-Phase Relations
        // P = sqrt(3) * V_L * I_L * cos(phi)
        const s = Math.sqrt(3) * vLine * iLine; // VA (Apparent)
        const p = s * pf;                      // W (Real)
        const phi = Math.acos(pf);
        const q = s * Math.sin(phi);           // VAR (Reactive)
        
        // Phase values
        const vPhase = connection === 'Wye' ? vLine / Math.sqrt(3) : vLine;
        const iPhase = connection === 'Wye' ? iLine : iLine / Math.sqrt(3);
        
        return { s, p, q, vPhase, iPhase, phi };
    }, [connection, vLine, iLine, pf]);

    return (
        <div className="flex w-full h-full bg-[var(--bg-0)] text-white overflow-hidden relative font-sans">
            {/* Ambient Pulse */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.05)_0%,transparent_50%)]" />

            {/* SIDEBAR: Configuration */}
            <div className="w-[360px] bg-[var(--bg-0)]/95 border-r border-white/5 flex flex-col z-20 shadow-2xl">
                <div className="p-8 border-b border-white/5 ">
                    <div className="flex items-center gap-4 mb-6 text-amber-500">
                        <div className="w-12 h-12 rounded-xl bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center ">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter uppercase leading-none text-white">
                                {t12(language, 'Grid Core', 'Şebeke Merkezi')}
                            </h1>
                            <p className="text-[10px] text-amber-500/60 font-mono tracking-widest uppercase mt-1">
                                {t12(language, '3-Phase Power v5.1', '3-Faz Güç Çözücü v5.1')}
                            </p>
                        </div>
                    </div>

                    <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 mb-2">
                        {(['Delta', 'Wye'] as const).map(c => (
                            <button
                                key={c}
                                onClick={() => setConnection(c)}
                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${connection === c ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                {c === 'Delta' ? t12(language, 'Delta', 'Üçgen') : t12(language, 'Wye', 'Yıldız')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    <section className="space-y-6">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Settings size={14} /> {t12(language, 'Line Parameters', 'Hat Parametreleri')}
                        </h3>
                        <div className="grid grid-cols-1 gap-6">
                            <ParameterInput label={t12(language, 'Line Voltage (V_L)', 'Hat Gerilimi (V_L)')} value={vLine} unit="V" icon={<Zap size={14}/>} color="#f59e0b" onChange={setVLine} min={0} max={1000} />
                            <ParameterInput label={t12(language, 'Line Current (I_L)', 'Hat Akımı (I_L)')} value={iLine} unit="A" icon={<Activity size={14}/>} color="#f59e0b" onChange={setILine} min={0} max={1000} />
                            <ParameterInput label={t12(language, 'Power Factor (cosφ)', 'Güç Faktörü (cosφ)')} value={pf} unit="pf" icon={<Layers size={14}/>} color="#f59e0b" onChange={setPF} min={0} max={1} step={0.01} />
                        </div>
                    </section>

                    <section className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                        <div className="flex items-center gap-2 mb-4">
                            <Info size={14} className="text-amber-500" />
                            <span className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest">
                                {t12(language, 'Topology Insight', 'Topoloji Bilgisi')}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed italic border-l border-amber-500/30 pl-4 py-1">
                            {connection === 'Wye' 
                                ? t12(language, 'In Wye (Star), Line Voltage = √3 × Phase Voltage. Neutral connection available.', 'Yıldız bağlantıda Hat Gerilimi = √3 × Faz Gerilimidir. Nötr bağlantısı mevcuttur.') 
                                : t12(language, 'In Delta (Mesh), Line Current = √3 × Phase Current. Line voltage equals phase voltage.', 'Üçgen bağlantıda Hat Akımı = √3 × Faz Akımıdır. Hat gerilimi faz gerilimine eşittir.')}
                        </p>
                    </section>
                </div>

                <div className="p-4 bg-black/20 border-t border-white/5">
                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                         <div className="flex items-center gap-2 mb-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                             <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                                 {t12(language, 'Steady-State Solver', 'Sürekli Rejim Çözücüsü')}
                             </span>
                         </div>
                    </div>
                </div>
            </div>

            {/* MAIN WORKSPACE: Analytics */}
            <div className="flex-1 flex flex-col p-8 lg:p-12 gap-8 overflow-y-auto z-10 custom-scrollbar relative">

                {/* KPI Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <MetricCard 
                        label={t12(language, 'Apparent Power (S)', 'Görünür Güç (S)')} 
                        value={formatEngineeringValue(stats.s / 1000, precision, false)} 
                        unit="kVA" 
                        color="#f59e0b" 
                        label2={t12(language, 'Total Magnitude', 'Toplam Büyüklük')} 
                    />
                    <MetricCard 
                        label={t12(language, 'Real Power (P)', 'Aktif Güç (P)')} 
                        value={formatEngineeringValue(stats.p / 1000, precision, false)} 
                        unit="kW" 
                        color="#10b981" 
                        label2={t12(language, 'Energy Work', 'Faydalı İş')} 
                    />
                    <MetricCard 
                        label={t12(language, 'Reactive Power (Q)', 'Reaktif Güç (Q)')} 
                        value={formatEngineeringValue(stats.q / 1000, precision, false)} 
                        unit="kVAR" 
                        color="#ef4444" 
                        label2={t12(language, 'Field Energy', 'Alan Enerjisi')} 
                    />
                </div>

                {/* Vector Analysis Visualizer */}
                <div className="flex-1 flex flex-col xl:flex-row gap-8 min-h-[400px]">
                    {/* Phasor Visualizer */}
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-12 flex flex-col relative overflow-hidden shadow-2xl">
                         
                         <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-12 flex items-center gap-3 relative z-10">
                             <RotateCcw size={14} className="text-amber-500 animate-spin-slow" />
                             {t12(language, 'Interactive Phasor Plane', 'İnteraktif Fazör Düzlemi')}
                         </h3>

                         <PhasorVisualizer stats={stats} freq={freq} iLine={iLine} language={language} />
                    </div>

                    {/* Industrial Recs Table */}
                    <div className="w-full xl:w-[400px] flex flex-col gap-6">
                         <div className="bg-white/5 border border-white/10 rounded-xl p-8 space-y-6">
                             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                 {t12(language, 'Node Analysis Outcome', 'Düğüm Analizi Sonuçları')}
                             </h4>
                             
                             <ResultItem label={t12(language, 'Phase Voltage (Vp)', 'Faz Gerilimi (Vp)')} value={formatEngineeringValue(stats.vPhase, precision, false)} unit="V" />
                             <ResultItem label={t12(language, 'Phase Current (Ip)', 'Faz Akımı (Ip)')} value={formatEngineeringValue(stats.iPhase, precision, false)} unit="A" />
                             <ResultItem label={t12(language, 'Reactive Charge', 'Reaktif Oran')} value={formatEngineeringValue(stats.q / stats.s * 100, precision, false)} unit="%" />
                             
                             <div className="h-px bg-white/5" />
                             
                             <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex flex-col gap-1">
                                 <div className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                                     {t12(language, 'Efficiency Rating', 'Verimlilik Sınıfı')}
                                 </div>
                                 <div className="text-lg font-black text-emerald-400">
                                     {t12(language, 'OPTIMAL (CAT-1)', 'OPTİMUM (KAT-1)')}
                                 </div>
                             </div>
                         </div>

                         <div className="flex gap-4">
                             <ActionBtn icon={<Download size={18}/>} />
                             <ActionBtn icon={<Share2 size={18}/>} />
                             <button className="flex-1 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl group">
                                 {t12(language, 'Generate Report', 'Rapor Oluştur')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                             </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PhasorVisualizer({ stats, freq, iLine, language }: { stats: any; freq: number; iLine: number; language?: any }) {
    const phiDeg = stats.phi * (180 / Math.PI);
    const spinDur = freq > 0 ? Math.max((50 / freq) * 6, 2) : 6;

    // Generate sinusoidal points for 3 phases + current
    const pointsL1: string[] = [];
    const pointsL2: string[] = [];
    const pointsL3: string[] = [];
    const pointsI: string[] = [];

    const numPoints = 80;
    for (let i = 0; i <= numPoints; i++) {
        const x = (i / numPoints) * 360;
        const rad = (i / numPoints) * 2 * Math.PI * 2; // 2 full cycles
        const y1 = 45 - Math.sin(rad) * 30;
        const y2 = 45 - Math.sin(rad - (2 * Math.PI / 3)) * 30;
        const y3 = 45 - Math.sin(rad - (4 * Math.PI / 3)) * 30;
        const yI = 45 - Math.sin(rad - stats.phi) * 22;

        pointsL1.push(`${x.toFixed(1)},${y1.toFixed(1)}`);
        pointsL2.push(`${x.toFixed(1)},${y2.toFixed(1)}`);
        pointsL3.push(`${x.toFixed(1)},${y3.toFixed(1)}`);
        pointsI.push(`${x.toFixed(1)},${yI.toFixed(1)}`);
    }

    return (
        <div className="flex-1 flex flex-col gap-4">
            <div className="flex-1 flex items-center justify-center relative min-h-[220px]">
                <svg viewBox="-130 -130 260 260" className="w-full h-full max-w-[280px] overflow-visible">
                    <defs>
                        <radialGradient id="phasorHub" cx="35%" cy="35%" r="65%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="50%" stopColor="#475569" />
                            <stop offset="100%" stopColor="#0f172a" />
                        </radialGradient>
                        <linearGradient id="needleL1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                        <linearGradient id="needleL2" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="100%" stopColor="#0284c7" />
                        </linearGradient>
                        <linearGradient id="needleL3" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#c084fc" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                        <filter id="phasorShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.8" />
                        </filter>
                    </defs>

                    <style>{`
                        @keyframes phasorSpin { to { transform: rotate(360deg); } }
                    `}</style>

                    {/* Circular Grid Rings */}
                    {[30, 60, 90, 115].map(r => (
                        <circle key={r} cx="0" cy="0" r={r} fill="none" stroke="white" strokeWidth="0.8" strokeOpacity="0.07" strokeDasharray={r === 115 ? "4 3" : undefined} />
                    ))}
                    <line x1="-120" y1="0" x2="120" y2="0" stroke="white" strokeWidth="0.6" strokeOpacity="0.12" />
                    <line x1="0" y1="-120" x2="0" y2="120" stroke="white" strokeWidth="0.6" strokeOpacity="0.12" />

                    {/* Rotating 3-Phase Vector Bundle */}
                    <g style={{ transformOrigin: '0px 0px', animation: `phasorSpin ${spinDur.toFixed(2)}s linear infinite` }}>
                        {/* L1 Vector */}
                        <g filter="url(#phasorShadow)">
                            <polygon points="0,-4 100,0 0,4" fill="url(#needleL1)" />
                            <circle cx="100" cy="0" r="4" fill="#fbbf24" />
                            <text x="110" y="4" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="monospace">L1</text>
                        </g>

                        {/* L2 Vector (120 deg) */}
                        <g transform="rotate(120)" filter="url(#phasorShadow)">
                            <polygon points="0,-4 100,0 0,4" fill="url(#needleL2)" />
                            <circle cx="100" cy="0" r="4" fill="#38bdf8" />
                            <text x="110" y="4" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">L2</text>
                        </g>

                        {/* L3 Vector (240 deg) */}
                        <g transform="rotate(240)" filter="url(#phasorShadow)">
                            <polygon points="0,-4 100,0 0,4" fill="url(#needleL3)" />
                            <circle cx="100" cy="0" r="4" fill="#c084fc" />
                            <text x="110" y="4" fill="#c084fc" fontSize="10" fontWeight="bold" fontFamily="monospace">L3</text>
                        </g>

                        {/* Current Vector I_line (lagging by phi) */}
                        <g transform={`rotate(${-phiDeg})`}>
                            <line x1="0" y1="0" x2={Math.min(75 + (iLine / 10) * 8, 105)} y2="0" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 3" />
                            <circle cx={Math.min(75 + (iLine / 10) * 8, 105)} cy="0" r="4" fill="#10b981" />
                            <text x={Math.min(75 + (iLine / 10) * 8, 105) + 8} y="4" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">I</text>
                        </g>
                    </g>

                    {/* Central Chrome Hub */}
                    <circle cx="0" cy="0" r="10" fill="url(#phasorHub)" stroke="#64748b" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="3" fill="#ffffff" />
                </svg>
            </div>

            {/* Live 3-Phase AC Sinusoidal Waveform Box */}
            <div className="w-full h-24 bg-black/60 rounded-2xl border border-white/10 p-2 overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-center px-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        {t12(language, 'AC 3-Phase Voltage & Current Waves', 'AC 3-Faz Gerilim & Akım Dalgaları')}
                    </span>
                    <div className="flex gap-3 text-[9px] font-mono font-bold">
                        <span className="text-amber-400">L1</span>
                        <span className="text-sky-400">L2</span>
                        <span className="text-purple-400">L3</span>
                        <span className="text-emerald-400">I</span>
                    </div>
                </div>

                <svg viewBox="0 0 360 90" className="w-full h-16" preserveAspectRatio="none">
                    <line x1="0" y1="45" x2="360" y2="45" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 4" />
                    <polyline points={pointsL1.join(' ')} fill="none" stroke="#fbbf24" strokeWidth="1.8" opacity="0.9" />
                    <polyline points={pointsL2.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="1.8" opacity="0.9" />
                    <polyline points={pointsL3.join(' ')} fill="none" stroke="#c084fc" strokeWidth="1.8" opacity="0.9" />
                    <polyline points={pointsI.join(' ')} fill="none" stroke="#10b981" strokeWidth="1.8" strokeDasharray="3 3" opacity="0.85" />
                </svg>
            </div>
        </div>
    );
}

function ParameterInput({ label, value, unit, icon, color, onChange, min, max, step = 1 }: any) {
    return (
        <div className="space-y-3 group">
            <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                    <div className="text-slate-500 group-hover:text-amber-500 transition-colors">{icon}</div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
                </div>
                <div className="text-[11px] font-mono font-black text-white">{value} <span className="text-[8px] opacity-40">{unit}</span></div>
            </div>
            <input 
                type="range" 
                min={min} max={max} step={step} 
                value={value} 
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-1 bg-white/5 rounded-full appearance-none outline-none cursor-pointer accent-[var(--cyan)]"
            />
        </div>
    );
}

function MetricCard({ label, value, unit, color, label2 }: any) {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-8 flex flex-col relative overflow-hidden hover:bg-white/[0.04] transition-all">
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
             <div className="flex items-baseline gap-2">
                 <motion.div 
                    initial={false}
                    animate={{ color }}
                    className="text-4xl font-black font-mono tracking-tighter"
                 >
                    {value}
                 </motion.div>
                 <span className="text-xs font-bold text-slate-600 uppercase italic">{unit}</span>
             </div>
             <div className="mt-4 text-[9px] font-black text-slate-700 uppercase tracking-[0.2em]">{label2}</div>
        </div>
    );
}

function ResultItem({ label, value, unit }: any) {
    return (
        <div className="flex justify-between items-center">
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
             <div className="flex items-baseline gap-1">
                 <span className="text-sm font-black">{value}</span>
                 <span className="text-[8px] font-bold text-slate-700">{unit}</span>
             </div>
        </div>
    );
}

function ActionBtn({ icon }: any) {
    return (
        <button className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all shadow-xl">
            {icon}
        </button>
    );
}
