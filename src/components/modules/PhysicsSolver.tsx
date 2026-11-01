'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { 
    Activity, Zap, Play, Trash2, Cpu, 
    Binary, Terminal, Layers, Plus, BarChart4, TrendingUp,
    Settings, List, Sliders, ChevronRight, Save, Info,
    Rocket, Orbit
} from 'lucide-react';
import { all, create } from 'mathjs';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

const math = create(all);

const PhysicsKinematicsModule = dynamic(() => import('@/modules/science/PhysicsKinematics'), {
  loading: () => (
    <div className="flex flex-col items-center justify-center w-full h-[600px] text-slate-400">
      <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4" />
      <p className="text-xs font-mono uppercase tracking-widest">Kinematics Simulation Loading...</p>
    </div>
  )
});

interface Parameter {
    id: string;
    name: string;
    value: number;
    unit: string;
}

interface Scenario {
    id: string;
    name: string;
    values: Record<string, number>; // parameterId -> value
    results: Record<string, any>;
    isValid: boolean;
}

export interface PhysicsSolverProps {
    initialTab?: 'kinematics' | 'scenarios';
}

export default function PhysicsSolver({ initialTab = 'kinematics' }: PhysicsSolverProps) {
    const { language } = useI18nStore();
    const [suiteTab, setSuiteTab] = useState<'kinematics' | 'scenarios'>(initialTab);

    // 1. Definition of Variables (The "Logic" or "Blueprint")
    const [script, setScript] = useState('F = m * a\nE = m * c^2\np = m * v');
    
    // 2. Parameters (The "Inputs")
    const [parameters, setParameters] = useState<Parameter[]>([
        { id: 'p1', name: 'm', value: 10, unit: 'kg' },
        { id: 'p2', name: 'a', value: 9.81, unit: 'm/s²' },
        { id: 'p3', name: 'v', value: 5, unit: 'm/s' },
        { id: 'p4', name: 'c', value: 299792458, unit: 'm/s' }
    ]);

    // 3. Scenarios (The "Variations")
    const [scenarios, setScenarios] = useState<Scenario[]>([
        { id: 's1', name: 'Earth Case', values: { p1: 10, p2: 9.81, p3: 5 }, results: {}, isValid: true },
        { id: 's2', name: 'Moon Case', values: { p1: 10, p2: 1.62, p3: 5 }, results: {}, isValid: true }
    ]);

    const [compareVar, setCompareVar] = useState<string>('F');
    const [activeTab, setActiveTab] = useState<'logic' | 'scenarios'>('scenarios');

    // SOLVER KERNEL
    const runAnalysis = useMemo(() => {
        return scenarios.map(scenario => {
            const scope: Record<string, any> = {};
            
            // Apply parameters from this scenario
            parameters.forEach(p => {
                scope[p.name] = scenario.values[p.id] !== undefined ? scenario.values[p.id] : p.value;
            });

            const results: Record<string, any> = {};
            let isValid = true;
            
            const lines = script.split('\n').filter(l => l.trim().length > 0);
            lines.forEach(line => {
                try {
                    const node = math.parse(line);
                    const result = node.evaluate(scope);
                    const parts = line.split('=');
                    if (parts.length > 1) {
                        const varName = parts[0].trim();
                        results[varName] = result;
                    }
                } catch (e) {
                    isValid = false;
                }
            });

            return {
                ...scenario,
                results,
                isValid
            };
        });
    }, [script, parameters, scenarios]);

    const availableComputedVars = useMemo(() => {
        if (runAnalysis.length === 0) return [];
        return Object.keys(runAnalysis[0].results);
    }, [runAnalysis]);

    const chartData = useMemo(() => {
        return runAnalysis.map((s, idx) => ({
            name: s.name,
            value: typeof s.results[compareVar] === 'number' ? s.results[compareVar] : 0,
            color: idx === 0 ? '#00e5ff' : idx === 1 ? '#a855f7' : '#ec4899'
        }));
    }, [runAnalysis, compareVar]);

    return (
        <div className="flex flex-col w-full h-full bg-[var(--bg-0)] text-white overflow-hidden">
            {/* Top Suite Bar */}
            <header className="flex-none px-6 py-2.5 bg-[var(--bg-0)] border-b border-white/5 flex items-center justify-between gap-4 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)]">
                        <Orbit size={16} />
                    </div>
                    <div>
                        <h1 className="text-xs font-black uppercase tracking-wider text-slate-200">
                            {t12(language, 'Computational Physics & Kinematics Lab', 'Hesaplamalı Fizik & Kinematik Laboratuvarı')}
                        </h1>
                        <p className="text-[9px] text-cyan-400/70 font-mono tracking-widest">
                            {t12(language, 'NEWTONIAN DYNAMICS / PROJECTILE AIR DRAG / CAS ENGINE', 'NEWTON MEKANİĞİ / ATIŞ DİNAMİĞİ / CAS ÇÖZÜCÜ')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/5 gap-1">
                    <button
                        onClick={() => setSuiteTab('kinematics')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            suiteTab === 'kinematics'
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Rocket size={14} />
                        <span>{t12(language, '2D Projectile & Trajectory', '2D Atış Hareketi & Yörünge')}</span>
                    </button>
                    <button
                        onClick={() => setSuiteTab('scenarios')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            suiteTab === 'scenarios'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Terminal size={14} />
                        <span>{t12(language, 'Symbolic Physics & Scenarios', 'Sembolik Fizik & Senaryolar')}</span>
                    </button>
                </div>
            </header>

            {/* TAB 1: 2D KINEMATICS & TRAJECTORY SIMULATION */}
            {suiteTab === 'kinematics' && (
                <div className="flex-1 w-full h-[calc(100%-53px)] overflow-hidden">
                    <PhysicsKinematicsModule />
                </div>
            )}

            {/* TAB 2: SYMBOLIC PHYSICS & MULTI-SCENARIO SANDBOX */}
            {suiteTab === 'scenarios' && (
                <div className="flex-1 flex w-full h-[calc(100%-53px)] bg-[var(--bg-0)] overflow-hidden">
                    {/* LEFT PANEL */}
                    <div className="w-[420px] bg-[var(--bg-0)]/90 border-r border-white/5 flex flex-col z-20 shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex gap-2">
                            <button 
                                onClick={() => setActiveTab('scenarios')}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeTab === 'scenarios' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-lg ' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <List size={14} /> {t12(language, 'Scenarios', 'Senaryolar')}
                            </button>
                            <button 
                                onClick={() => setActiveTab('logic')}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeTab === 'logic' ? 'bg-cyan-500 text-black shadow-lg ' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Terminal size={14} /> {t12(language, 'Formula Core', 'Formül Çekirdeği')}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {activeTab === 'logic' ? (
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">{t12(language, 'Physics Blueprint Script', 'Fizik Denklemleri Skripti')}</label>
                                        <textarea 
                                            value={script} 
                                            onChange={(e) => setScript(e.target.value)}
                                            rows={6}
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 font-mono text-xs text-cyan-400 focus:border-cyan-500 outline-none leading-relaxed custom-scrollbar shadow-inner"
                                            placeholder="Write formulas here..."
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t12(language, 'Base Variables Registry', 'Temel Değişkenler Listesi')}</label>
                                        </div>
                                        <div className="space-y-3">
                                            {parameters.map((p, idx) => (
                                                <div key={p.id} className="flex gap-2 items-center bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                                                    <span className="w-8 font-mono text-xs text-cyan-400 font-bold px-2">{p.name}</span>
                                                    <input 
                                                        type="number"
                                                        value={p.value}
                                                        onChange={(e) => {
                                                            const next = [...parameters];
                                                            next[idx].value = parseFloat(e.target.value) || 0;
                                                            setParameters(next);
                                                        }}
                                                        className="w-24 bg-black/40 border border-white/10 rounded-lg px-2 py-1 font-mono text-xs text-white"
                                                    />
                                                    <span className="text-[10px] font-mono text-slate-500 flex-1">{p.unit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t12(language, 'Parametric Variation Cases', 'Parametrik Varyasyon Durumları')}</h3>
                                        <button 
                                            onClick={() => {
                                                const id = `s${scenarios.length + 1}`;
                                                setScenarios([...scenarios, { id, name: `Variation ${scenarios.length + 1}`, values: {}, results: {}, isValid: true }]);
                                            }}
                                            className="px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-500/30 flex items-center gap-1 transition-all"
                                        >
                                            <Plus size={12} /> {t12(language, 'Add Case', 'Durum Ekle')}
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {scenarios.map((sc, scIdx) => (
                                            <div key={sc.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <input 
                                                        type="text" 
                                                        value={sc.name} 
                                                        onChange={(e) => {
                                                            const next = [...scenarios];
                                                            next[scIdx].name = e.target.value;
                                                            setScenarios(next);
                                                        }}
                                                        className="bg-transparent font-black text-sm text-white border-b border-transparent hover:border-white/20 focus:border-cyan-500 outline-none px-1"
                                                    />
                                                    {scenarios.length > 1 && (
                                                        <button 
                                                            onClick={() => setScenarios(scenarios.filter(s => s.id !== sc.id))}
                                                            className="text-slate-600 hover:text-red-400 transition-colors p-1"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="space-y-2 pt-2 border-t border-white/5">
                                                    {parameters.map((p) => (
                                                        <div key={p.id} className="flex justify-between items-center gap-2">
                                                            <span className="text-[10px] font-mono text-slate-400">{p.name} ({p.unit}):</span>
                                                            <input 
                                                                type="number"
                                                                value={sc.values[p.id] !== undefined ? sc.values[p.id] : p.value}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value) || 0;
                                                                    const next = [...scenarios];
                                                                    next[scIdx].values = { ...next[scIdx].values, [p.id]: val };
                                                                    setScenarios(next);
                                                                }}
                                                                className="w-24 bg-black/40 border border-white/10 rounded-lg px-2 py-1 font-mono text-xs text-cyan-400 text-right"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT DASHBOARD */}
                    <div className="flex-1 flex flex-col p-8 gap-6 relative overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-2">
                                   <TrendingUp size={14} /> {t12(language, 'Sensitivity Dashboard', 'Duyarlılık Paneli')}
                                </h2>
                                <div className="text-2xl font-black tracking-tighter mt-1 text-white">{t12(language, 'Comparative Variable Analysis', 'Karşılaştırmalı Değişken Analizi')}</div>
                            </div>
                            
                            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t12(language, 'Compare:', 'Karşılaştır:')}</span>
                                <select 
                                    value={compareVar}
                                    onChange={(e) => setCompareVar(e.target.value)}
                                    className="bg-black/60 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest py-1 px-4 rounded-xl outline-none cursor-pointer"
                                >
                                    {availableComputedVars.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* VISUALIZATION CHART */}
                        <div className="h-[340px] bg-black/40 border border-white/5 rounded-3xl p-8 relative overflow-hidden flex items-end justify-around gap-8 shadow-2xl">
                            {chartData.map((d) => (
                                <div key={d.name} className="flex-1 flex flex-col items-center gap-4 group relative h-full justify-end">
                                    <div className="relative w-full flex flex-col items-center flex-1 justify-end">
                                        <motion.div 
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max(10, Math.min(100, (d.value / (Math.max(...chartData.map(v => Math.abs(v.value))) || 1)) * 100))}%` }}
                                            className="w-full max-w-[100px] rounded-2xl relative shadow-2xl overflow-hidden"
                                            style={{ backgroundColor: d.color, boxShadow: `0 0 30px ${d.color}22` }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20" />
                                        </motion.div>
                                        
                                        <div className="absolute -top-10 flex flex-col items-center">
                                            <span className="text-xl font-black font-mono text-white tracking-tighter tabular-nums">{d.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{compareVar}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="text-center z-10 p-2 bg-white/[0.02] border border-white/5 rounded-xl w-full max-w-[120px]">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-cyan-400 transition-colors">{d.name}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* RESULTS SUMMARY GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
                            {runAnalysis.map((s) => (
                                <div key={s.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 group hover:border-white/10 transition-all relative overflow-hidden">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex justify-between items-center border-b border-white/5 pb-2">
                                        <span className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${s.isValid ? 'bg-cyan-500' : 'bg-red-500'} animate-pulse`} /> {s.name}</span>
                                        <span className="font-mono opacity-40">#{s.id.toUpperCase()}</span>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {Object.entries(s.results).map(([label, val]) => (
                                            <div key={label} className="flex justify-between items-baseline">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${label === compareVar ? 'text-cyan-400' : 'text-slate-400'}`}>{label}</span>
                                                <span className={`text-lg font-black font-mono tracking-tighter tabular-nums ${label === compareVar ? 'text-cyan-400' : 'text-white'}`}>
                                                    {typeof val === 'number' ? val.toLocaleString(undefined, { maximumFractionDigits: 3 }) : String(val)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
