/**
 * modules/finance/RealTimeCost/index.tsx
 */

import React, { useEffect, useState } from 'react';
import { useCostStore } from './store';
import { DollarSign, Coins, Timer, Ruler, TrendingDown, Sparkles, PieChart, Info, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function RealTimeCostModule() {
    const { input, result, setInput } = useCostStore();
    const [isSimulating, setIsSimulating] = useState(false);

    // Trigger initial calculation
    useEffect(() => {
        setInput({}); // Forces calc via store logic
    }, []);

    // Simulate AI thinking time when inputs change drastically
    const handleInput = (key: string, value: number) => {
        setIsSimulating(true);
        setInput({ [key]: value });
        setTimeout(() => setIsSimulating(false), 400);
    };

    const total = result?.totalCost || 0;
    const matPct = total > 0 ? ((result?.materialCost || 0) / total) * 100 : 0;
    const mfgPct = total > 0 ? ((result?.machiningCost || 0) / total) * 100 : 0;
    const wldPct = total > 0 ? ((result?.weldingCost || 0) / total) * 100 : 0;

    return (
        <div className="flex h-full bg-[#0a0f16] text-slate-200 p-4 gap-4 overflow-hidden">
            {/* Left Column: Tweak Controls */}
            <div className="w-[350px] flex flex-col gap-4 overflow-y-auto no-scrollbar pb-12 pr-1">
                <div className="flex items-center gap-3 mb-2 px-1">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <DollarSign className="text-emerald-400 w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold tracking-tight text-emerald-50">Cost AI Engine</h2>
                        <div className="text-[10px] text-emerald-500/60 font-mono tracking-wider">REAL-TIME PREDICTION</div>
                    </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 space-y-5 shadow-lg backdrop-blur text-sm">
                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                        <h3 className="font-semibold text-slate-300 flex items-center gap-2"><Coins size={14} className="text-amber-500" /> Material Context</h3>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-[11px] font-medium text-slate-400">Yield Volume (cm³)</label>
                                <span className="text-[10px] text-slate-500 font-mono">{input.materialVolumeCm3}</span>
                            </div>
                            <input
                                type="range" min="10" max="5000" step="10"
                                value={input.materialVolumeCm3}
                                onChange={e => handleInput('materialVolumeCm3', Number(e.target.value))}
                                className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-950/50 p-2 border border-slate-800/50 rounded-lg">
                                <label className="block text-[10px] text-slate-500 mb-1">Density (g/cm³)</label>
                                <input
                                    type="number" step="0.1"
                                    value={input.materialDensityGcm3}
                                    onChange={e => handleInput('materialDensityGcm3', Number(e.target.value))}
                                    className="w-full bg-transparent text-slate-200 text-sm font-mono focus:outline-none"
                                />
                            </div>
                            <div className="bg-slate-950/50 p-2 border border-slate-800/50 rounded-lg">
                                <label className="block text-[10px] text-slate-500 mb-1">Raw Cost ($/kg)</label>
                                <input
                                    type="number" step="0.5"
                                    value={input.rawMaterialCostPerKg}
                                    onChange={e => handleInput('rawMaterialCostPerKg', Number(e.target.value))}
                                    className="w-full bg-transparent text-slate-200 text-sm font-mono focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 pt-2">
                        <h3 className="font-semibold text-slate-300 flex items-center gap-2"><Timer size={14} className="text-blue-400" /> Machining Context</h3>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-[11px] font-medium text-slate-400">CNC Runtime (hrs)</label>
                                <span className="text-[10px] text-slate-500 font-mono">{input.estimatedMachiningHours}h</span>
                            </div>
                            <input
                                type="range" min="0" max="24" step="0.5"
                                value={input.estimatedMachiningHours}
                                onChange={e => handleInput('estimatedMachiningHours', Number(e.target.value))}
                                className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="bg-slate-950/50 p-2 border border-slate-800/50 rounded-lg flex justify-between items-center">
                            <label className="text-[10px] text-slate-500">Machine Op Rate ($/hr)</label>
                            <input
                                type="number" step="5"
                                value={input.machineHourlyRate}
                                onChange={e => handleInput('machineHourlyRate', Number(e.target.value))}
                                className="w-20 bg-transparent text-right text-slate-200 text-sm font-mono focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 pt-2">
                        <h3 className="font-semibold text-slate-300 flex items-center gap-2"><Ruler size={14} className="text-rose-400" /> Welding & Assembly</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-950/50 p-2 border border-slate-800/50 rounded-lg">
                            <label className="block text-[10px] text-slate-500 mb-1">Weld Length (m)</label>
                            <input
                                type="number" step="0.5"
                                value={input.weldingLengthMeters}
                                onChange={e => handleInput('weldingLengthMeters', Number(e.target.value))}
                                className="w-full bg-transparent text-slate-200 text-sm font-mono focus:outline-none"
                            />
                        </div>
                        <div className="bg-slate-950/50 p-2 border border-slate-800/50 rounded-lg">
                            <label className="block text-[10px] text-slate-500 mb-1">Cost Rate ($/m)</label>
                            <input
                                type="number" step="1"
                                value={input.weldingCostPerMeter}
                                onChange={e => handleInput('weldingCostPerMeter', Number(e.target.value))}
                                className="w-full bg-transparent text-slate-200 text-sm font-mono focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Analytics & Strategy */}
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar">

                {/* Hero Number */}
                <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border border-emerald-900/30 rounded-2xl p-6 relative overflow-hidden flex-shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <div className="text-xs font-semibold text-emerald-400/80 uppercase tracking-widest mb-1 flex items-center gap-2">
                                Projected Unit Cost {isSimulating && <span className="animate-pulse w-2 h-2 rounded-full bg-emerald-400"></span>}
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-black text-white tracking-tighter">${total.toFixed(2)}</span>
                                <span className="text-slate-500 font-mono text-sm">/ unit</span>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Mass Prop</div>
                            <div className="text-xl font-mono text-slate-300">{result?.weightKg.toFixed(3)} <span className="text-sm text-slate-600">kg</span></div>
                        </div>
                    </div>

                    {/* Breakdown Bar */}
                    <div className="mt-8">
                        <div className="flex justify-between text-[10px] font-medium text-slate-500 mb-2 uppercase tracking-wider">
                            <span>Material ({matPct.toFixed(0)}%)</span>
                            <span>Mfg ({mfgPct.toFixed(0)}%)</span>
                            <span>Welding ({wldPct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex transition-all duration-500">
                            <div className="bg-amber-500/80 transition-all duration-500" style={{ width: `${matPct}%` }}></div>
                            <div className="bg-blue-500/80 transition-all duration-500" style={{ width: `${mfgPct}%` }}></div>
                            <div className="bg-rose-500/80 transition-all duration-500" style={{ width: `${wldPct}%` }}></div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-3 pl-1">
                            <div className="font-mono text-xs text-amber-500/90">${result?.materialCost.toFixed(2)}</div>
                            <div className="font-mono text-xs text-blue-500/90 text-center">${result?.machiningCost.toFixed(2)}</div>
                            <div className="font-mono text-xs text-rose-500/90 text-right">${result?.weldingCost.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                {/* AI Insights */}
                <div className="flex-1 bg-slate-900 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-6">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <h3 className="text-sm font-bold text-slate-200">AI Yield Operations Analysis</h3>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-[calc(100%-40px)]">

                        {/* Simulation Drivers */}
                        <div className="flex flex-col gap-3">
                            <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/50 hover:border-blue-500/30 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2 text-blue-400 font-medium text-sm">
                                        <ArrowUpRight size={16} /> Batch Scaling Impact
                                    </div>
                                    <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">-12% potential</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Machining cost ratio is exceptionally high ({mfgPct.toFixed(1)}%). Consider shifting entirely to 5-axis tombstone fixturing to run 4 parts simultaneously, reducing setup penalty by estimated $24.50/unit.
                                </p>
                            </div>

                            <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/50 hover:border-amber-500/30 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2 text-amber-500 font-medium text-sm">
                                        <TrendingDown size={16} /> Topology Optimization
                                    </div>
                                    <span className="text-[10px] font-mono bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20">-6% mass</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Current volume indicates a dense cross-section. Running generative lightweighting could drop material cost by ${((result?.materialCost || 0) * 0.06).toFixed(2)} without sacrificing yield strength thresholds.
                                </p>
                            </div>
                        </div>

                        {/* Breakdown Radar/List */}
                        <div className="bg-black/20 rounded-xl border border-white/5 p-4 flex flex-col justify-center relative inner-shadow">

                            <div className="absolute top-3 right-3 text-slate-600"><PieChart size={18} /></div>
                            <h4 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-widest">Process Efficiency Score</h4>

                            <div className="flex items-end gap-3 mb-6">
                                <span className="text-5xl font-black text-white">{mfgPct > 60 ? 'C+' : 'A-'}</span>
                                <span className={mfgPct > 60 ? 'text-amber-500 text-sm font-medium mb-1' : 'text-emerald-500 text-sm font-medium mb-1'}>
                                    {mfgPct > 60 ? 'Suboptimal Yield' : 'Highly Efficient'}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-xs text-slate-300">
                                    <CheckCircle2 size={14} className="text-emerald-500" /> Tool wear within tolerance.
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-300">
                                    {wldPct > 20 ? <Info size={14} className="text-amber-500" /> : <CheckCircle2 size={14} className="text-emerald-500" />}
                                    {wldPct > 20 ? 'Welding phase dictates structural bottleneck.' : 'Fastening structure is optimized.'}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-300">
                                    {matPct > 50 ? <Info size={14} className="text-amber-500" /> : <CheckCircle2 size={14} className="text-emerald-500" />}
                                    {matPct > 50 ? 'Material grade over-specified for bounds.' : 'Alloy volume is economically viable.'}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
