/**
 * modules/mechanical/MfgReadiness/index.tsx
 * 
 * Manufacturing Readiness Analyzer Interface
 */

import React, { useEffect, useState } from 'react';
import { useMfgStore } from './store';
import { Factory, AlertTriangle, CheckCircle, Activity, Lightbulb, Settings, Cpu, Microscope } from 'lucide-react';

export default function MfgReadinessModule() {
    const { input, result, metadata, isAnalyzing, setInput, analyze } = useMfgStore();
    const [activeTab, setActiveTab] = useState<'geo' | 'sim'>('geo');

    useEffect(() => {
        analyze();
    }, [input]);

    const getScoreColor = (score: number) => {
        if (score >= 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]';
        if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.2)]';
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.2)]';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 85) return 'Production Ready';
        if (score >= 60) return 'Needs Review';
        return 'Critical Redesign';
    }

    return (
        <div className="flex h-full bg-[#0a0f16] text-slate-200 p-4 gap-4 overflow-hidden">

            {/* Left Panel: Configuration */}
            <div className="w-[320px] flex flex-col gap-4 overflow-y-auto no-scrollbar pr-1 pb-12">

                {/* Header */}
                <div className="flex items-center gap-3 mb-2 px-1">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Microscope className="text-blue-400 w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold tracking-tight text-blue-50">DFM Analyzer</h2>
                        <div className="flex items-center gap-2 text-[10px] text-blue-500/60 font-mono tracking-wider">
                            <span>V-2.4</span>
                            <span className="w-1 h-1 rounded-full bg-blue-500/50"></span>
                            <span className="flex items-center gap-1"><Activity size={10} className={isAnalyzing ? 'animate-pulse text-blue-400' : ''} /> {isAnalyzing ? 'COMPUTING' : 'IDLE'}</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-900/80 p-1 rounded-lg border border-slate-800/80">
                    <button
                        onClick={() => setActiveTab('geo')}
                        className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${activeTab === 'geo' ? 'bg-slate-800 text-blue-400 shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Geometry
                    </button>
                    <button
                        onClick={() => setActiveTab('sim')}
                        className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${activeTab === 'sim' ? 'bg-slate-800 text-purple-400 shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Process Target
                    </button>
                </div>

                {/* Config Area */}
                <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 shadow-lg backdrop-blur text-sm flex-1">

                    {activeTab === 'geo' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-[11px] font-medium text-slate-400">Min. Inner Radius (mm)</label>
                                    <span className="text-[10px] text-slate-500 font-mono">R{input.minInnerRadius.toFixed(1)}</span>
                                </div>
                                <input
                                    type="range" min="0" max="15" step="0.5"
                                    value={input.minInnerRadius}
                                    onChange={e => setInput({ minInnerRadius: Number(e.target.value) })}
                                    className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-[11px] font-medium text-slate-400">Wall Tck. (mm)</label>
                                    <span className="text-[10px] text-slate-500 font-mono">T{input.wallThicknessMin.toFixed(1)}</span>
                                </div>
                                <input
                                    type="range" min="0.1" max="10" step="0.1"
                                    value={input.wallThicknessMin}
                                    onChange={e => setInput({ wallThicknessMin: Number(e.target.value) })}
                                    className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-800/50 space-y-3">
                                <label className="flex items-center justify-between cursor-pointer group">
                                    <span className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors">Contains Undercuts</span>
                                    <div className={`w-8 h-4 rounded-full transition-colors relative ${input.hasUndercuts ? 'bg-blue-500' : 'bg-slate-800'}`}>
                                        <input
                                            type="checkbox"
                                            checked={input.hasUndercuts}
                                            onChange={e => setInput({ hasUndercuts: e.target.checked })}
                                            className="sr-only"
                                        />
                                        <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform ${input.hasUndercuts ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                </label>

                                <label className="flex items-center justify-between cursor-pointer group">
                                    <span className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors">Deep/Tight Pockets</span>
                                    <div className={`w-8 h-4 rounded-full transition-colors relative ${input.hasTightPockets ? 'bg-blue-500' : 'bg-slate-800'}`}>
                                        <input
                                            type="checkbox"
                                            checked={input.hasTightPockets}
                                            onChange={e => setInput({ hasTightPockets: e.target.checked })}
                                            className="sr-only"
                                        />
                                        <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform ${input.hasTightPockets ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sim' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-2">Primary Process</label>
                                <div className="space-y-2">
                                    {[
                                        { id: 'cnc', label: 'CNC Machining', desc: 'Subtractive 3-Axis', icon: Settings },
                                        { id: '3d-print', label: '3D Printing', desc: 'Additive FDM/SLA', icon: Cpu },
                                        { id: 'sheet-metal', label: 'Sheet Metal', desc: 'Bending & Laser', icon: Factory }
                                    ].map(proc => (
                                        <button
                                            key={proc.id}
                                            onClick={() => setInput({ processTarget: proc.id as any })}
                                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${input.processTarget === proc.id ? 'bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/20' : 'bg-slate-900 border-slate-800/50 hover:bg-slate-800/50'}`}
                                        >
                                            <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center ${input.processTarget === proc.id ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                                                <proc.icon size={16} />
                                            </div>
                                            <div>
                                                <div className={`text-xs font-semibold ${input.processTarget === proc.id ? 'text-purple-100' : 'text-slate-300'}`}>{proc.label}</div>
                                                <div className="text-[10px] text-slate-500">{proc.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Right Panel: Results Dashboard */}
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar shadow-xl">

                {/* Score Widget */}
                {result ? (
                    <>
                        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl flex relative overflow-hidden flex-shrink-0">

                            {/* Score Circle Area */}
                            <div className="w-[200px] border-r border-slate-800/80 flex flex-col items-center justify-center py-8 relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-[#0a0f16] z-0"></div>
                                <div className={`relative z-10 w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center bg-slate-950 transition-colors duration-500 ${getScoreColor(result.score)}`}>
                                    <div className="flex items-baseline">
                                        <span className="text-5xl font-black">{result.score}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500 mt-1 uppercase">Readiness</span>
                                </div>
                            </div>

                            {/* Summary Text */}
                            <div className="flex-1 p-6 flex flex-col justify-center bg-gradient-to-r from-slate-900 to-transparent">
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">System Evaluation</div>
                                <h3 className={`text-2xl font-bold mb-3 ${getScoreColor(result.score).split(' ')[0]}`}>
                                    {getScoreLabel(result.score)}
                                </h3>
                                <p className="text-sm text-slate-400 max-w-md leading-relaxed">
                                    The current geometry has been evaluated against {input.processTarget.toUpperCase()} standards.
                                    {result.score < 80 ? ' Structural or tooling modifications are highly recommended before committing to production.' : ' The design falls within acceptable manufacturing tolerances.'}
                                </p>
                            </div>
                        </div>

                        {/* Diagnostics Log */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Warnings */}
                            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 flex flex-col relative inner-shadow overflow-hidden">
                                <div className="flex items-center gap-2 mb-4">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    <h4 className="text-sm font-bold text-slate-200">Critical Diagnostics</h4>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                    {result.criticalWarnings.length > 0 ? (
                                        <div className="space-y-3">
                                            {result.criticalWarnings.map((w, i) => (
                                                <div key={i} className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 100}ms` }}>
                                                    <div className="mt-0.5 shadow-[0_0_10px_rgba(245,158,11,0.3)] bg-amber-500/20 text-amber-500 rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 text-[10px] font-bold border border-amber-500/40">!</div>
                                                    <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-2.5 rounded border border-slate-800/50">{w}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                            </div>
                                            <div className="text-sm font-medium text-emerald-400/80">Clean Bill of Health</div>
                                            <div className="text-[11px] text-slate-500 mt-1">No major CAM translation issues found.</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Suggestions */}
                            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 flex flex-col relative inner-shadow overflow-hidden">
                                <div className="flex items-center gap-2 mb-4">
                                    <Activity className="w-4 h-4 text-blue-400" />
                                    <h4 className="text-sm font-bold text-slate-200">Engineering Optimizations</h4>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                    {result.suggestions.length > 0 ? (
                                        <div className="space-y-3">
                                            {result.suggestions.map((s, i) => (
                                                <div key={i} className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 100}ms` }}>
                                                    <div className="mt-0.5 flex-shrink-0">
                                                        <Lightbulb className="w-4 h-4 text-blue-400" />
                                                    </div>
                                                    <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-2.5 rounded border border-slate-800/50">{s}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                            <div className="text-sm font-medium text-slate-400">Yield Optimized</div>
                                            <div className="text-[11px] text-slate-500 mt-1">Further engineering changes yield diminishing returns.</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center border border-slate-800/50 rounded-2xl bg-slate-900/50 p-8">
                        <Activity className="w-10 h-10 text-blue-500 animate-spin mb-4 shadow-[0_0_20px_rgba(59,130,246,0.5)] rounded-full" />
                        <div className="text-sm font-bold text-slate-200 mb-1 tracking-wide">ANALYZING TOPOLOGY</div>
                        <div className="text-xs font-mono text-slate-500">Calculating DFM heuristics...</div>
                    </div>
                )}
            </div>
        </div>
    );
}
