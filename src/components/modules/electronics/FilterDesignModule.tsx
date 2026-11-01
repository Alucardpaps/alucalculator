'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, Zap, Info, Settings, 
    ArrowRight, Waves, Layers, 
    Download, Share2, Maximize2,
    Thermometer, ShieldCheck
} from 'lucide-react';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

export default function FilterDesignModule() {
  const precision = useGlobalPrecision();
  const language = useI18nStore((s) => s.language);
    const [type, setType] = useState<'LowPass' | 'HighPass'>('LowPass');
    const [r, setR] = useState(10000); // 10k Ohm
    const [c, setC] = useState(0.0000001); // 100nF

    const stats = useMemo(() => {
        const fc = 1 / (2 * Math.PI * r * c);
        
        // Generate Bode Data (Logarithmic range)
        const points = [];
        for (let i = 1; i <= 6; i += 0.1) {
            const freq = Math.pow(10, i);
            const w = 2 * Math.PI * freq;
            const wc = 2 * Math.PI * fc;
            
            let gain;
            if (type === 'LowPass') {
                gain = 20 * Math.log10(1 / Math.sqrt(1 + Math.pow(w/wc, 2)));
            } else {
                gain = 20 * Math.log10((w/wc) / Math.sqrt(1 + Math.pow(w/wc, 2)));
            }
            points.push({ freq, gain });
        }
        return { fc, points };
    }, [type, r, c]);

    return (
        <div className="flex w-full h-full bg-[var(--bg-0)] text-white overflow-hidden relative font-sans">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.05)_0%,transparent_50%)]" />

            {/* SIDEBAR: Configuration */}
            <div className="w-[360px] bg-[var(--bg-0)]/95 border-r border-white/5 flex flex-col z-20 shadow-2xl">
                <div className="p-8 border-b border-white/5 ">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)] ">
                            <Waves size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter uppercase leading-none text-white">{t12(language, 'Signal Node', 'Elektronik Filtre')}</h1>
                            <p className="text-[10px] text-blue-500/60 font-mono tracking-widest uppercase mt-1">{t12(language, 'Active Filter Suite v3.2', 'RC Filtre Frekans Cevabı')}</p>
                        </div>
                    </div>

                    <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 mb-2">
                        {(['LowPass', 'HighPass'] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => setType(m)}
                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${type === m ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                {m === 'LowPass' ? t12(language, 'LowPass', 'Alçak Geçiren') : t12(language, 'HighPass', 'Yüksek Geçiren')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    <section className="space-y-6">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Settings size={14} /> {t12(language, 'Component Parameters', 'Bileşen Değerleri')}
                        </h3>
                        <div className="grid grid-cols-1 gap-6">
                             <ParameterInput label={t12(language, 'Resistor (R)', 'Direnç (R)')} value={r} unit="Ω" color="#3b82f6" onChange={setR} min={10} max={1000000} step={100} />
                             <ParameterInput label={t12(language, 'Capacitor (C)', 'Kapasitör (C)')} value={c * 1e9} unit="nF" color="#3b82f6" onChange={(v:any) => setC(v / 1e9)} min={1} max={1000} />
                        </div>
                    </section>

                    <section className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                        <div className="flex items-center gap-2 mb-4">
                            <Info size={14} className="text-blue-500" />
                            <span className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest">{t12(language, 'Scientific Basis', 'Teorik Altyapı')}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed italic border-l border-blue-500/30 pl-4 py-1">
                            {t12(language, 'Current model assumes an ideal Passive RC topology. Frequency response: H(jω) = 1 / (1 + jωRC).', 'Model ideal Pasif RC devresini modeller. Frekans transfer fonksiyonu: H(jω) = 1 / (1 + jωRC).')}
                        </p>
                    </section>
                </div>

                <div className="p-4 bg-black/20 border-t border-white/5">
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                         <div className="flex items-center gap-2 mb-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{t12(language, 'Simulation Stable', 'Simülasyon Kararlı')}</span>
                         </div>
                    </div>
                </div>
            </div>

            {/* MAIN WORKSPACE: Analytics */}
            <div className="flex-1 flex flex-col p-8 lg:p-12 gap-8 overflow-y-auto z-10 custom-scrollbar relative">

                {/* KPI Header */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
                    <div className="md:col-span-2 bg-white/[0.02] border border-white/5 rounded-xl p-8 flex flex-col justify-center">
                         <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t12(language, 'Cut-Off Frequency (fc)', 'Kesim Frekansı (fc)')}</div>
                         <div className="flex items-baseline gap-2">
                             <div className="text-5xl font-black font-mono text-blue-400 tracking-tighter">
                                {stats.fc > 1000 ?formatEngineeringValue((stats.fc / 1000), precision, false) :formatEngineeringValue(stats.fc, precision, false)}
                             </div>
                             <span className="text-lg font-bold text-slate-600 uppercase italic">{stats.fc > 1000 ? 'kHz' : 'Hz'}</span>
                         </div>
                    </div>
                    <MetricCard label={t12(language, 'Time Constant (τ)', 'Zaman Sabiti (τ)')} value={formatEngineeringValue((r * c * 1000), precision, false)} unit="ms" color="#10b981" label2={t12(language, 'System Latency', 'Sistem Tepki Süresi')} />
                    <MetricCard label={t12(language, 'Phase Shift', 'Faz Kayması')} value="45.0" unit="DEG" color="#f59e0b" label2={t12(language, 'at fc', 'fc kesim noktasında')} />
                </div>

                {/* Magnitude Table / Bode Plot */}
                <div className="flex-1 flex flex-col xl:flex-row gap-8 min-h-[400px]">
                    {/* BODE PLOT */}
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-12 flex flex-col relative overflow-hidden shadow-2xl">
                         
                         <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-12 flex items-center gap-3 relative z-10">
                             <Activity size={14} className="text-blue-500" />
                             {t12(language, 'Magnitude Response Terminal', 'Genlik Cevabı (Bode Eğrisi)')}
                         </h3>

                         <div className="flex-1 flex flex-col justify-end relative">
                             {/* SVG BODE GRAPH */}
                             <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                                 {/* Grid Lines */}
                                 {[0, -10, -20, -30, -40, -50].map(db => (
                                     <line key={db} x1="0" y1={-db * 4} x2="500" y2={-db * 4} stroke="white" strokeWidth="0.5" strokeOpacity="0.05" />
                                 ))}
                                 
                                 {/* Data Path */}
                                 <path 
                                     d={stats.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i/stats.points.length)*500} ${-p.gain * 4}`).join(' ')}
                                     fill="none" 
                                     stroke="#3b82f6" 
                                     strokeWidth="2.5" 
                                     strokeLinejoin="round"
                                 />

                                 {/* Cut-off Indicator */}
                                 <line x1="250" y1="0" x2="250" y2="200" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.5" />
                             </svg>
                             
                             <div className="flex justify-between mt-4 text-[8px] font-black text-slate-700 uppercase tracking-widest">
                                 <span>10 Hz</span>
                                 <span>100 Hz</span>
                                 <span>1 kHz</span>
                                 <span>10 kHz</span>
                                 <span>100 kHz</span>
                                 <span>1 MHz</span>
                             </div>
                         </div>
                    </div>

                    {/* Circuit Schematic */}
                    <div className="w-full xl:w-[400px] flex flex-col gap-6">
                         <div className="bg-white/5 border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center">
                             <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-12">{t12(language, 'Circuit Schematic', 'Devre Şematiği')}</div>
                             
                             <svg viewBox="0 0 200 100" className="w-64 h-32">
                                 {/* Simplified RC Circuit */}
                                 <circle cx="20" cy="50" r="10" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
                                 <line x1="30" y1="50" x2="60" y2="50" stroke="white" strokeWidth="2" />
                                 
                                 {/* Resistor */}
                                 <path d="M 60 50 L 70 50 L 75 42 L 85 58 L 95 42 L 105 58 L 115 42 L 125 58 L 130 50 L 140 50" fill="none" stroke="#3b82f6" strokeWidth="2" />
                                 
                                 <line x1="140" y1="50" x2="160" y2="50" stroke="white" strokeWidth="2" />
                                 
                                 {/* Capacitor */}
                                 <line x1="160" y1="35" x2="160" y2="65" stroke="#3b82f6" strokeWidth="3" />
                                 <line x1="170" y1="35" x2="170" y2="65" stroke="#3b82f6" strokeWidth="3" />
                                 
                                 <line x1="170" y1="50" x2="190" y2="50" stroke="white" strokeWidth="2" />
                                 <line x1="165" y1="65" x2="165" y2="85" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
                                 <line x1="155" y1="85" x2="175" y2="85" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
                             </svg>

                             <div className="mt-8 text-center space-y-2">
                                 <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{t12(language, 'Active Topology', 'Aktif Topoloji')}</div>
                                 <div className="text-xs font-bold text-white tracking-widest">{t12(language, 'ORDER-1 RC NETWORK', '1. DERECE RC DEVRESİ')}</div>
                             </div>
                         </div>

                         <div className="flex gap-4">
                             <ActionBtn icon={<Download size={18}/>} />
                             <button className="flex-1 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl group">
                                 {t12(language, 'Export Bode Set', 'Bode Verisini Dışa Aktar')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                             </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, unit, color, label2 }: any) {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-8 flex flex-col relative overflow-hidden hover:bg-white/[0.04] transition-all">
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
             <div className="flex items-baseline gap-2">
                 <div className="text-3xl font-black font-mono text-white tracking-tighter" style={{ color }}>{value}</div>
                 <span className="text-xs font-bold text-slate-600 uppercase italic">{unit}</span>
             </div>
             <div className="mt-4 text-[9px] font-black text-slate-700 uppercase tracking-[0.2em]">{label2}</div>
        </div>
    );
}

function ParameterInput({ label, value, unit, color, onChange, min, max, step = 1 }: any) {
    return (
        <div className="space-y-3 group">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
                <div className="text-[11px] font-mono font-black text-white">{value.toLocaleString()} <span className="text-[8px] opacity-40">{unit}</span></div>
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

function ActionBtn({ icon }: any) {
    return (
        <button className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all shadow-xl">
            {icon}
        </button>
    );
}
