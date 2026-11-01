'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, ShieldAlert, Zap, Layers, Info, BarChart2,
    Clock, Target, Shield, Settings, AlertTriangle, History
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { getFatigueModuleStrings } from '@/locales/fatigueModuleTranslations';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { t12 } from '@/locales/t12';

export interface FatigueAnalysisModuleProps {
    initialTab?: 'sn-curve' | 'weibull';
}

export default function FatigueAnalysisModule({ initialTab = 'sn-curve' }: FatigueAnalysisModuleProps) {
    const precision = useGlobalPrecision();
    const { language } = useI18nStore();
    const f = getFatigueModuleStrings(language);
    const [activeTab, setActiveTab] = useState<'sn-curve' | 'weibull'>(initialTab);

    // --- TAB 1: S-N & Mean Stress State ---
    const [inputs, setInputs] = useState({
        S_ut: 800,     // MPa (Ultimate Strength)
        S_y: 650,      // MPa (Yield Strength)
        sigma_a: 150,  // MPa (Alternating Stress)
        sigma_m: 100,  // MPa (Mean Stress)
        k_a: 0.85,     // Surface condition
        k_b: 0.90,     // Size factor
        k_c: 1.0       // Load factor
    });

    const results = useMemo(() => {
        // Shigley's Mechanical Engineering Design §6.7:
        // For steels: Se' = 0.5 * Sut if Sut <= 1400 MPa, else Se' = 700 MPa
        const S_e_prime = inputs.S_ut <= 1400 ? 0.5 * inputs.S_ut : 700;
        const S_e = inputs.k_a * inputs.k_b * inputs.k_c * S_e_prime;

        // 1. Modified Goodman Criterion: (sigma_a / Se) + (sigma_m / Sut) = 1 / n
        const denG = (inputs.sigma_a / Math.max(S_e, 1e-9)) + (inputs.sigma_m / Math.max(inputs.S_ut, 1e-9));
        const n_goodman = denG > 0 ? 1 / denG : Infinity;

        // 2. Gerber Parabolic Criterion: (n * sigma_a / Se) + (n * sigma_m / Sut)^2 = 1
        const A_gerber = Math.pow(inputs.sigma_m / Math.max(inputs.S_ut, 1e-9), 2);
        const B_gerber = inputs.sigma_a / Math.max(S_e, 1e-9);
        const n_gerber = A_gerber > 0
            ? (-B_gerber + Math.sqrt(B_gerber * B_gerber + 4 * A_gerber)) / (2 * A_gerber)
            : B_gerber > 0 ? 1 / B_gerber : Infinity;

        // 3. Soderberg Conservative Criterion (against yield): (sigma_a / Se) + (sigma_m / Sy) = 1 / n
        const denSod = (inputs.sigma_a / Math.max(S_e, 1e-9)) + (inputs.sigma_m / Math.max(inputs.S_y, 1e-9));
        const n_soderberg = denSod > 0 ? 1 / denSod : Infinity;

        // 4. Langer First-Cycle Yield Line: (sigma_a + sigma_m) <= Sy
        const n_yield = (inputs.sigma_a + inputs.sigma_m) > 0
            ? inputs.S_y / (inputs.sigma_a + inputs.sigma_m)
            : Infinity;

        const isSafe = n_goodman >= 1.0 && n_yield >= 1.0;
        const criticalVal = Math.min(n_goodman, n_yield);
        return { S_e, S_e_prime, n_goodman, n_gerber, n_soderberg, n_yield, isSafe, criticalVal };
    }, [inputs]);

    const activeColor = results.isSafe ? '#10b981' : '#ef4444';

    // Calculate plotting points for the Goodman Diagram
    const MAX_X = Math.max(inputs.S_ut, inputs.S_y, inputs.sigma_m * 1.2);
    const MAX_Y = Math.max(results.S_e, inputs.S_y, inputs.sigma_a * 1.2);
    
    const padding = 60;
    const boxW = 1000 - padding * 2;
    const boxH = 500 - padding * 2;
    
    const scaleX = (val: number) => padding + (val / MAX_X) * boxW;
    const scaleY = (val: number) => 500 - padding - (val / MAX_Y) * boxH;

    // --- TAB 2: Weibull Reliability & Failure Prediction State ---
    const [shape, setShape] = useState(1.5); // Beta (Weibull shape)
    const [scale, setScale] = useState(5000); // Eta (Characteristic life, hours)
    const [time, setTime] = useState(1000);   // Current operating time (hours)
    const [gamma, setGamma] = useState(0);    // Failure location / threshold

    const weibullStats = useMemo(() => {
        // Reliability R(t) = exp(- ((t-gamma)/scale)^shape )
        const t_adj = Math.max(0, time - gamma);
        const reliability = Math.exp(-Math.pow(t_adj / scale, shape));
        
        // Hazard Rate h(t) = (shape/scale) * ((t-gamma)/scale)^(shape-1)
        const hazard = (shape / scale) * Math.pow(t_adj / scale, shape - 1);
        
        // MTBF approximation for Weibull: scale * Gamma(1 + 1/shape)
        const mtbf = scale * (0.89 + 0.11 / shape);
        const probabilityOfFailure = 1 - reliability;
        
        return { reliability, hazard, mtbf, probabilityOfFailure };
    }, [shape, scale, time, gamma]);

    return (
        <div className="flex flex-col w-full h-full bg-[var(--bg-0)] text-white overflow-hidden">
            {/* Master Suite Navigation Bar */}
            <header className="flex-none px-6 py-2.5 bg-[var(--bg-0)] border-b border-white/5 flex items-center justify-between gap-4 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)]">
                        <Activity size={16} />
                    </div>
                    <div>
                        <h1 className="text-xs font-black uppercase tracking-wider text-slate-200">
                            {t12(language, 'Fatigue Life & Reliability Suite', 'Yorulma Ömrü & Güvenilirlik Mühendisliği')}
                        </h1>
                        <p className="text-[9px] text-orange-400/70 font-mono tracking-widest">
                            ISO 12107 / SHIGLEY §6 / WEIBULL RELIABILITY
                        </p>
                    </div>
                </div>

                <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/5 gap-1">
                    <button
                        onClick={() => setActiveTab('sn-curve')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'sn-curve'
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Zap size={14} />
                        <span>{t12(language, 'S-N Curve & Goodman Diagram', 'S-N Eğrisi & Goodman Diyagramı')}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('weibull')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'weibull'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <ShieldAlert size={14} />
                        <span>{t12(language, 'Weibull Reliability & MTBF', 'Weibull Güvenilirlik & MTBF')}</span>
                    </button>
                </div>
            </header>

            {/* TAB 1: S-N FATIGUE & GOODMAN DIAGRAM */}
            {activeTab === 'sn-curve' && (
                <div className="flex-1 flex flex-col lg:flex-row w-full h-[calc(100%-53px)] overflow-y-auto lg:overflow-hidden p-2 gap-4">
                    {/* LEFT PANEL - Control Center (35%) */}
                    <div className="w-full lg:w-[380px] shrink-0 flex flex-col h-auto lg:h-full bg-[var(--bg-1)]/80 rounded-2xl border border-white/5 px-6 py-6 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                            <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 ">
                                <Activity size={20} strokeWidth={2} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold tracking-tight text-gray-100">
                                    {f.fatigueLife}
                                </h2>
                                <p className="text-[10px] text-cyan-400/70 font-semibold uppercase tracking-[0.2em] mt-0.5">
                                    {f.enduranceAnalysis}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4 text-cyan-400">
                            <Layers size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                {f.materialLoad}
                            </span>
                        </div>

                        <div className="space-y-5 flex-1">
                            <PremiumNumBox label={f.ultimateTensile} unit="MPa" value={inputs.S_ut} min={100} max={3000} step={10} onChange={(v: number) => setInputs({ ...inputs, S_ut: v })} color="#00e5ff" />
                            <PremiumNumBox label={f.yieldStrength} unit="MPa" value={inputs.S_y} min={100} max={2500} step={10} onChange={(v: number) => setInputs({ ...inputs, S_y: v })} color="#3b82f6" />
                            
                            <div className="my-6 border-t border-white/5 pt-4"></div>

                            <PremiumNumBox label={f.altStress} unit="MPa" value={inputs.sigma_a} min={0} max={1000} step={5} onChange={(v: number) => setInputs({ ...inputs, sigma_a: v })} color="#f59e0b" />
                            <PremiumNumBox label={f.meanStress} unit="MPa" value={inputs.sigma_m} min={0} max={1000} step={5} onChange={(v: number) => setInputs({ ...inputs, sigma_m: v })} color="#ef4444" />
                            
                            <div className="my-6 border-t border-white/5 pt-4"></div>
                            
                            <div className="bg-[var(--bg-2)] rounded-xl border border-white/5 p-4 space-y-4">
                                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                                    {f.marinFactors}
                                </p>
                                <PremiumNumBox label={f.surfaceKa} unit="" value={inputs.k_a} min={0.1} max={1.0} step={0.05} onChange={(v: number) => setInputs({ ...inputs, k_a: v })} color="#10b981" />
                                <PremiumNumBox label={f.sizeKb} unit="" value={inputs.k_b} min={0.5} max={1.0} step={0.05} onChange={(v: number) => setInputs({ ...inputs, k_b: v })} color="#10b981" />
                                <PremiumNumBox label={f.loadKc} unit="" value={inputs.k_c} min={0.5} max={1.0} step={0.05} onChange={(v: number) => setInputs({ ...inputs, k_c: v })} color="#10b981" />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL - Live Visualization & Output (65%) */}
                    <div className="flex-1 h-auto lg:h-full flex flex-col px-6 min-w-0">
                        {/* Math Results Header */}
                        <div className="flex-none pt-4 pb-2">
                            <div className="flex items-start justify-between">
                                <div>
                                    <motion.div 
                                        className="text-[11px] font-black uppercase tracking-[0.3em] mb-2 flex items-center gap-2" 
                                        animate={{ color: activeColor }}
                                    >
                                        <motion.div className="w-2.5 h-2.5 rounded-full" animate={{ backgroundColor: activeColor, boxShadow: `0 0 15px ${activeColor}` }} />
                                        {results.isSafe 
                                            ? f.infiniteLife 
                                            : f.fatigueWarning
                                        }
                                    </motion.div>
                                    <div className="flex items-baseline gap-4">
                                        <motion.div 
                                            className="text-5xl lg:text-5xl font-black tracking-tighter leading-none"
                                            animate={{ color: activeColor, textShadow: `0 0 40px ${activeColor}40` }}
                                        >
                                            {results.criticalVal === Infinity ? '∞' : results.criticalVal.toFixed(2)}
                                        </motion.div>
                                        <div className="text-gray-500 font-bold uppercase tracking-wider text-xs">
                                            {f.overallFos}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{f.enduranceLimit}</div>
                                    <div className="text-3xl font-black font-mono text-cyan-400">
                                        {results.S_e.toFixed(1)} <span className="text-xs font-normal text-gray-500">MPa</span>
                                    </div>
                                    <div className="text-[10px] text-gray-600 mt-1 font-mono">
                                        S_e' = {results.S_e_prime.toFixed(1)} MPa
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Goodman Diagram SVG */}
                        <div className="flex-1 bg-[var(--bg-0)] rounded-2xl border border-white/5 relative p-4 flex flex-col min-h-[300px]">
                            <div className="absolute top-4 left-4 z-10">
                                <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">{f.goodmanDiagram}</span>
                            </div>
                            
                            <div className="flex-1 w-full h-full relative">
                                <motion.svg viewBox="0 0 1000 500" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                                    <line x1={scaleX(0)} y1={scaleY(0)} x2={scaleX(MAX_X)} y2={scaleY(0)} stroke="#334155" strokeWidth="2" />
                                    <line x1={scaleX(0)} y1={scaleY(0)} x2={scaleX(0)} y2={scaleY(MAX_Y)} stroke="#334155" strokeWidth="2" />

                                    {/* Modified Goodman Line */}
                                    <line x1={scaleX(0)} y1={scaleY(results.S_e)} x2={scaleX(inputs.S_ut)} y2={scaleY(0)} stroke="#00e5ff" strokeWidth="3" opacity="0.8" />
                                    
                                    {/* Langer First-Cycle Yield Line */}
                                    <line x1={scaleX(0)} y1={scaleY(inputs.S_y)} x2={scaleX(inputs.S_y)} y2={scaleY(0)} stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" opacity="0.6" />

                                    {/* Labels */}
                                    <text x={scaleX(inputs.S_ut)} y={scaleY(0)+25} fill="#00e5ff" fontSize="13" fontWeight="bold" textAnchor="middle">S_ut ({inputs.S_ut})</text>
                                    <text x={scaleX(0)-15} y={scaleY(results.S_e)} fill="#00e5ff" fontSize="13" fontWeight="bold" textAnchor="end" dominantBaseline="middle">S_e ({results.S_e.toFixed(0)})</text>
                                    <text x={scaleX(inputs.S_y)} y={scaleY(0)+25} fill="#3b82f6" fontSize="13" fontWeight="bold" textAnchor="middle">S_y ({inputs.S_y})</text>
                                    <text x={scaleX(0)-15} y={scaleY(inputs.S_y)} fill="#3b82f6" fontSize="13" fontWeight="bold" textAnchor="end" dominantBaseline="middle">S_y ({inputs.S_y})</text>

                                    {/* Operating Point */}
                                    <motion.g 
                                        animate={{ x: scaleX(inputs.sigma_m), y: scaleY(inputs.sigma_a) }} 
                                        transition={{ type: 'spring', stiffness: 50 }}
                                    >
                                        <circle cx="0" cy="0" r="8" fill={activeColor} style={{ filter: `drop-shadow(0 0 15px ${activeColor})` }} />
                                        <line x1={scaleX(0) - scaleX(inputs.sigma_m)} y1={scaleY(0) - scaleY(inputs.sigma_a)} x2="0" y2="0" stroke={activeColor} strokeWidth="2" strokeDasharray="3,3" opacity="0.6"/>
                                        <text x="15" y="-15" fill={activeColor} fontSize="14" fontWeight="bold" opacity="0.9">
                                            {`${f.loadPoint} (${inputs.sigma_m}, ${inputs.sigma_a})`}
                                        </text>
                                    </motion.g>
                                </motion.svg>
                            </div>
                        </div>

                        {/* Warning Footer */}
                        <AnimatePresence>
                            {!results.isSafe && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                                    className="flex-none bg-red-500/10 border border-red-500/30 rounded-2xl p-3 my-2 flex items-center gap-4 text-red-400"
                                >
                                    <ShieldAlert className="shrink-0 animate-pulse" size={24} />
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.2em]">
                                            {f.envelopeExceeded}
                                        </p>
                                        <p className="text-[11px] opacity-80">
                                            {f.envelopeExceededDesc}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* TAB 2: WEIBULL RELIABILITY & FAILURE PREDICTION */}
            {activeTab === 'weibull' && (
                <div className="flex-1 flex flex-col lg:flex-row w-full h-[calc(100%-53px)] overflow-y-auto lg:overflow-hidden p-2 gap-4">
                    {/* LEFT PANEL: Parameters */}
                    <div className="w-full lg:w-[380px] shrink-0 flex flex-col h-auto lg:h-full bg-[var(--bg-1)]/80 rounded-2xl border border-white/5 px-6 py-6 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                            <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400 ">
                                <ShieldAlert size={20} strokeWidth={2} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold tracking-tight text-gray-100">
                                    {t12(language, 'Weibull Analysis', 'Weibull Analizörü')}
                                </h2>
                                <p className="text-[10px] text-amber-400/70 font-semibold uppercase tracking-[0.2em] mt-0.5">
                                    {t12(language, 'Stochastic Reliability Engine', 'Stokastik Güvenilirlik Çözücü')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6 flex-1">
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 mb-3">
                                    <Settings size={12} /> {t12(language, 'Weibull Coefficients', 'Weibull Parametreleri')}
                                </h3>
                                <div className="space-y-4">
                                    <ParameterInput label={t12(language, 'Shape (Beta)', 'Şekil Parametresi (Beta)')} value={shape} min={0.5} max={5} step={0.1} onChange={setShape} icon={<Zap size={12}/>} />
                                    <ParameterInput label={t12(language, 'Scale (Eta - Life)', 'Karakteristik Ömür (Eta)')} value={scale} min={100} max={20000} step={100} onChange={setScale} icon={<Clock size={12}/>} />
                                    <ParameterInput label={t12(language, 'Threshold (Gamma)', 'Eşik Değer (Gamma)')} value={gamma} min={0} max={1000} step={10} onChange={setGamma} icon={<History size={12}/>} />
                                </div>
                            </div>

                            <div className="border-t border-white/5 pt-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 mb-3">
                                    <Activity size={12} /> {t12(language, 'Operating Exposure', 'Çalışma Durumu')}
                                </h3>
                                <ParameterInput label={t12(language, 'Current Time (t)', 'Çalışma Süresi (t)')} value={time} min={0} max={scale * 2} step={10} onChange={setTime} icon={<Target size={12}/>} />
                                
                                <div className="bg-amber-900/10 border border-amber-500/20 rounded-2xl p-4 mt-6">
                                    <div className="flex items-center gap-3 text-amber-400/80 mb-2">
                                        <AlertTriangle size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{t12(language, 'Risk Assessment', 'Risk Değerlendirmesi')}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                        {shape < 1 ? t12(language, 'Early-life infant mortality failure profile. Burn-in screening advised.', 'Erken dönem (bebek ölümü) arıza profili. Alıştırma testleri tavsiye edilir.') : 
                                         shape === 1 ? t12(language, 'Constant failure rate (exponential distribution). Purely random external risk.', 'Sabit arıza oranı (üstel dağılım). Tamamen rastgele risk.') : 
                                         t12(language, 'Wear-out failure profile. Preventive maintenance & replacement schedule required.', 'Aşınma ve yorulma profili. Önleyici bakım ve değişim takvimi şarttır.')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Visual Dashboard */}
                    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto z-10">
                        {/* KPI Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <ValueCard label={t12(language, 'Survival Prob R(t)', 'Hayatta Kalma Olasılığı R(t)')} value={(weibullStats.reliability * 100).toFixed(1)} unit="%" sub={t12(language, 'RELIABILITY INDEX', 'GÜVENİLİRLİK İNDEKSİ')} color="#10b981" />
                            <ValueCard label={t12(language, 'Failure Hazard (λ)', 'Arıza Riski (λ)')} value={weibullStats.hazard.toExponential(3)} unit="1/hr" sub={t12(language, 'INSTANTANEOUS HAZARD', 'ANLIK ARIZA HIZI')} color="#f87171" />
                            <ValueCard label={t12(language, 'System MTBF', 'Sistem MTBF')} value={weibullStats.mtbf.toFixed(0)} unit="hrs" sub={t12(language, 'MEAN TIME BETWEEN FAILURES', 'ORTALAMA ARIZA ARASI SÜRE')} color="#38bdf8" />
                        </div>

                        {/* Failure Probability Visualization */}
                        <div className="flex-1 min-h-[360px] bg-[var(--bg-0)] border border-white/10 rounded-2xl p-6 flex flex-col relative overflow-hidden shadow-2xl">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                                <BarChart2 size={14} className="text-amber-500" />
                                {t12(language, 'Probability Density Function (PDF) / Bathtub Curve', 'Olasılık Yoğunluk Fonksiyonu (PDF) / Küvet Eğrisi')}
                            </h3>

                            <div className="flex-1 flex items-end justify-between relative gap-1 px-4">
                                <div className="absolute inset-x-0 h-px bg-white/5 bottom-0" />
                                {Array.from({ length: 50 }).map((_, i) => {
                                    const t_val = (i / 50) * (scale * 2);
                                    const t_adj = Math.max(0, t_val - gamma);
                                    const pdf = (shape / scale) * Math.pow(t_adj / scale, shape - 1) * Math.exp(-Math.pow(t_adj / scale, shape));
                                    const height = Math.min(100, pdf * scale * 50);
                                    const isActive = Math.abs(t_val - time) < (scale / 25);

                                    return (
                                        <div 
                                            key={i}
                                            style={{ 
                                                height: `${Math.max(2, height)}%`,
                                                backgroundColor: isActive ? '#f59e0b' : 'rgba(245,158,11,0.1)',
                                                width: '100%',
                                                borderRadius: '3px 3px 0 0',
                                                border: isActive ? '1px solid #f59e0b' : 'none'
                                            }}
                                            className="transition-all duration-300"
                                        />
                                    );
                                })}

                                {/* Current Time Indicator */}
                                <div className="absolute top-0 bottom-0 w-px bg-amber-500/70 z-20" style={{ left: `${(time / (scale * 2)) * 100}%` }}>
                                     <div className="absolute top-0 -translate-x-1/2 px-2 py-0.5 bg-amber-500 text-black text-[9px] font-black rounded uppercase">NOW ({time}h)</div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-between items-end border-t border-white/5 pt-4">
                                <div className="flex gap-8">
                                     <div>
                                         <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{t12(language, 'Failure Mode', 'Arıza Modu')}</span>
                                         <div className="text-lg font-black text-white">{shape < 1.0 ? t12(language, 'Infant Mortality', 'Erken Hasar') : shape === 1.0 ? t12(language, 'Random Risk', 'Rastgele Risk') : t12(language, 'Wear-Out Failure', 'Yorulma & Aşınma')}</div>
                                     </div>
                                     <div>
                                         <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{t12(language, 'Cumulative Fail Prob F(t)', 'Kümülatif Hasar Olasılığı F(t)')}</span>
                                         <div className="text-lg font-black text-amber-400">{(weibullStats.probabilityOfFailure * 100).toFixed(2)}%</div>
                                     </div>
                                </div>
                                <div className="text-right">
                                     <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Standard Spec</div>
                                     <div className="text-sm font-black font-mono text-cyan-400">IEC 61649 / ISO 12107</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PremiumNumBox({ label, unit, value, min, max, step, onChange, color }: any) {
    return (
        <div className="group relative">
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-focus-within:text-white transition-colors">{label}</span>
            </div>
            <div className="relative flex items-center bg-[var(--bg-2)] border border-white/10 rounded-xl overflow-hidden transition-all duration-300 group-focus-within:border-white/30 ">
                <input
                    type="number" value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
                    min={min} max={max} step={step}
                    className="w-full bg-transparent text-sm font-black font-mono px-3 py-2 text-white outline-none appearance-none"
                    style={{ textShadow: `0 0 10px ${color}40` }}
                />
                {unit && (
                   <div className="px-3 text-[10px] font-bold text-gray-500 border-l border-white/5 bg-white/[0.02] h-full flex flex-col justify-center items-center">
                    <span style={{ color }}>{unit}</span>
                   </div>
                )}
            </div>
            <div className="mt-2 px-1">
                <input
                    type="range" min={min} max={max} step={step} value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer hover:h-1.5 transition-all outline-none"
                    style={{ accentColor: color }}
                />
            </div>
        </div>
    );
}

function ParameterInput({ label, value, min, max, step, onChange, icon }: any) {
    return (
        <div className="space-y-1.5 group">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">{icon} {label}</span>
                <span className="text-[10px] font-mono text-amber-400">{value}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--cyan)]" />
        </div>
    );
}

function ValueCard({ label, value, unit, sub, color }: any) {
    return (
        <div className="bg-[var(--bg-2)] border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Shield size={48}/></div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
            <div className="flex items-baseline gap-2">
                <div className="text-2xl font-black font-mono text-white leading-none tracking-tighter" style={{ color }}>{value}</div>
                {unit && <span className="text-xs font-bold text-slate-500 uppercase italic leading-none">{unit}</span>}
            </div>
            {sub && <div className="text-[9px] font-bold mt-2 uppercase tracking-widest text-[var(--muted)]">{sub}</div>}
        </div>
    );
}
