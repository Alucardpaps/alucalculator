'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, Zap, Play, Trash2, Cpu, 
    Binary, Terminal, Layers, Plus, BarChart4, TrendingUp,
    Settings, List, Sliders, ChevronRight, Save, Info
} from 'lucide-react';
import { all, create } from 'mathjs';

const math = create(all);

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

export default function PhysicsSolver() {
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
                    if (line.includes('=')) {
                        const varName = line.split('=')[0].trim();
                        results[varName] = result;
                    }
                } catch (e) {
                    isValid = false;
                }
            });

            return { ...scenario, results, isValid };
        });
    }, [script, parameters, scenarios]);

    const chartData = useMemo(() => {
        return runAnalysis.map((s, i) => ({
            name: s.name,
            value: typeof s.results[compareVar] === 'number' ? s.results[compareVar] : 0,
            color: i === 0 ? '#22d3ee' : i === 1 ? '#8b5cf6' : i === 2 ? '#ec4899' : '#10b981'
        }));
    }, [runAnalysis, compareVar]);

    const availableComputedVars = useMemo(() => {
        const vars = new Set<string>();
        runAnalysis.forEach(s => Object.keys(s.results).forEach(v => vars.add(v)));
        return Array.from(vars);
    }, [runAnalysis]);

    return (
        <div className="flex h-full bg-[#020408] text-slate-200 overflow-hidden font-sans selection:bg-cyan-500/30">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* LEFT CONTROL PANEL */}
            <div className="w-[400px] flex flex-col border-r border-white/5 bg-[#05080f]/95 backdrop-blur-3xl z-20">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-cyan-500/5 to-transparent">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                            <Cpu size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black italic tracking-tighter uppercase leading-none">PhysCore V5</h1>
                            <p className="text-[9px] text-cyan-500/50 font-mono tracking-[0.2em] mt-1 uppercase">Parametric Analysis</p>
                        </div>
                    </div>

                    <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
                        <button onClick={() => setActiveTab('scenarios')} className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'scenarios' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-white'}`}>Scenarios</button>
                        <button onClick={() => setActiveTab('logic')} className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'logic' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-white'}`}>Logic Engine</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {activeTab === 'logic' ? (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-2 px-1">
                                    <Terminal size={12} /> Equation Blueprint
                                </label>
                                <textarea 
                                    value={script} 
                                    onChange={(e) => setScript(e.target.value)}
                                    className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-mono text-cyan-400 focus:border-cyan-500/30 outline-none resize-none shadow-inner"
                                    spellCheck={false}
                                />
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Variable Definitions</label>
                                    <button onClick={() => setParameters([...parameters, { id: `p${parameters.length+1}`, name: 'var', value: 0, unit: '' }])} className="p-1 hover:text-cyan-400 transition-colors"><Plus size={14}/></button>
                                </div>
                                <div className="space-y-2">
                                    {parameters.map((p) => (
                                        <div key={p.id} className="flex gap-2 items-center bg-white/[0.02] border border-white/5 p-2 rounded-xl group">
                                            <input value={p.name} onChange={(e) => setParameters(parameters.map(param => param.id === p.id ? {...param, name: e.target.value} : param))} className="w-12 bg-transparent border-none text-[10px] font-black text-cyan-500 outline-none uppercase" />
                                            <input type="number" value={p.value} onChange={(e) => setParameters(parameters.map(param => param.id === p.id ? {...param, value: Number(e.target.value)} : param))} className="flex-1 bg-black/20 border-white/5 rounded px-2 py-1 text-xs font-mono outline-none" />
                                            <input value={p.unit} onChange={(e) => setParameters(parameters.map(param => param.id === p.id ? {...param, unit: e.target.value} : param))} className="w-12 bg-transparent text-[8px] text-slate-600 outline-none uppercase font-bold" placeholder="UNIT" />
                                            <button onClick={() => setParameters(parameters.filter(param => param.id !== p.id))} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:scale-110 transition-all"><Trash2 size={12}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-2">
                                    <Sliders size={12} /> Case Variations
                                </label>
                                <button 
                                    onClick={() => setScenarios([...scenarios, { id: `s${scenarios.length+1}`, name: `Case ${String.fromCharCode(65 + scenarios.length)}`, values: {}, results: {}, isValid: true }])}
                                    className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-all"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {scenarios.map((s) => (
                                    <div key={s.id} className="p-5 bg-white/[0.03] border border-white/5 rounded-[1.5rem] space-y-4 group">
                                        <div className="flex justify-between items-center">
                                            <input 
                                                value={s.name} 
                                                onChange={(e) => setScenarios(scenarios.map(sc => sc.id === s.id ? {...sc, name: e.target.value} : sc))}
                                                className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-slate-500 focus:text-white"
                                            />
                                            <button onClick={() => setScenarios(scenarios.filter(sc => sc.id !== s.id))} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><Trash2 size={12}/></button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {parameters.map(p => (
                                                <div key={p.id} className="space-y-1">
                                                    <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest flex justify-between px-1">
                                                        <span>{p.name} <span className="opacity-40">({p.unit})</span></span>
                                                    </div>
                                                    <input 
                                                        type="number" 
                                                        value={s.values[p.id] !== undefined ? s.values[p.id] : p.value}
                                                        onChange={(e) => setScenarios(scenarios.map(sc => sc.id === s.id ? {...sc, values: {...sc.values, [p.id]: Number(e.target.value)}} : sc))}
                                                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-400 outline-none"
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

            {/* MAIN ANALYTICS VIEW */}
            <div className="flex-1 flex flex-col p-12 gap-8 relative overflow-y-auto custom-scrollbar">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 blur-[200px] rounded-full pointer-events-none" />

                <div className="flex items-center justify-between relative z-10">
                    <div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-2">
                           <TrendingUp size={14} /> Sensitivity Dashboard
                        </h2>
                        <div className="text-4xl font-black italic tracking-tighter mt-2 text-white">Comparative Variable Analysis</div>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-xl">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Primary Y-Axis:</span>
                        <select 
                            value={compareVar}
                            onChange={(e) => setCompareVar(e.target.value)}
                            className="bg-black/60 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest py-2 px-6 rounded-2xl outline-none shadow-lg cursor-pointer transition-all hover:border-cyan-500/50"
                        >
                            {availableComputedVars.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                </div>

                {/* VISUALIZATION CHART */}
                <div className="h-[450px] bg-black/40 border border-white/5 rounded-[4rem] p-16 relative overflow-hidden flex items-end justify-around gap-12 backdrop-blur-3xl shadow-2xl">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none"><Activity size={180}/></div>
                    
                    {chartData.map((d, i) => (
                        <div key={d.name} className="flex-1 flex flex-col items-center gap-10 group relative h-full justify-end">
                            <div className="relative w-full flex flex-col items-center flex-1 justify-end">
                                <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(10, Math.min(100, (d.value / (Math.max(...chartData.map(v => Math.abs(v.value))) || 1)) * 100))}%` }}
                                    className="w-full max-w-[120px] rounded-[2rem] relative shadow-2xl overflow-hidden"
                                    style={{ backgroundColor: d.color, boxShadow: `0 0 50px ${d.color}22` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20" />
                                    <motion.div animate={{ y: [0, -100, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute inset-0 bg-white/5 blur-xl pointer-events-none" />
                                </motion.div>
                                
                                <div className="absolute -top-12 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                    <span className="text-2xl font-black font-mono text-white tracking-tighter tabular-nums">{d.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{compareVar}</span>
                                </div>
                            </div>
                            
                            <div className="text-center z-10 p-4 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-md w-full max-w-[140px]">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-cyan-400 transition-colors">{d.name}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* RESULTS SUMMARY GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10 pb-12">
                    {runAnalysis.map((s) => (
                        <div key={s.id} className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 group hover:border-white/10 transition-all relative overflow-hidden backdrop-blur-xl">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:opacity-10 transition-opacity"><Zap size={40}/></div>
                            
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8 flex justify-between items-center border-b border-white/5 pb-4">
                                <span className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${s.isValid ? 'bg-cyan-500' : 'bg-red-500'} animate-pulse`} /> {s.name} Data</span>
                                <span className="font-mono opacity-40">#{s.id.toUpperCase()}</span>
                            </div>
                            
                            <div className="space-y-6">
                                {Object.entries(s.results).map(([label, val]) => (
                                    <div key={label} className="flex justify-between items-baseline group/row">
                                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${label === compareVar ? 'text-cyan-400' : 'text-slate-500'}`}>{label}</span>
                                        <div className="flex-1 border-b border-white/[0.05] mx-4 self-center opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                        <span className={`text-2xl font-black font-mono tracking-tighter tabular-nums ${label === compareVar ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'text-white'}`}>
                                            {typeof val === 'number' ? val.toLocaleString(undefined, { maximumFractionDigits: 3 }) : String(val)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5 flex gap-2">
                               {parameters.map(p => (
                                    <div key={p.id} className="px-3 py-1 bg-white/[0.03] border border-white/5 rounded-full text-[8px] font-black uppercase tracking-tighter text-slate-500">
                                        {p.name}: <span className="text-slate-300">{s.values[p.id] !== undefined ? s.values[p.id] : p.value}</span>
                                    </div>
                               ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
