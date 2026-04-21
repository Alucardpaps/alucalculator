"use client";

import { useState } from 'react';
import { WorkstationLayout } from '@/components/os/WorkstationLayout';
import { CalculatorInput } from '@/components/CalculatorInput';
import { ResultPanel } from '@/components/calculation/ResultPanel';
import { useComputation } from '@/hooks/useComputation';
import { Anchor, Compass, Activity, Shield, Waves, Ship, AlertTriangle } from 'lucide-react';

/**
 * Naval Hydrostatics Workstation
 * Analysis tool for ship stability, buoyancy, and metacentric height.
 */

export default function NavalHydrostaticsPage() {
    const [params, setParams] = useState({
        length: 120,
        beam: 20,
        draft: 8.5,
        blockCoefficient: 0.72,
        centerOfGravity: 12.5,
        waterDensity: 1025
    });

    const { contract, isComputing, error, execute } = useComputation("naval");

    const updateParam = (key: string, val: any) => {
        setParams(prev => ({ ...prev, [key]: val }));
    };

    const results = contract?.data;

    return (
        <WorkstationLayout 
            title="Naval Hydrostatics" 
            id="SHIP_STAB_01"
            status={results ? 'stable' : 'idle'}
            onCalculate={() => execute(params)}
        >
            {/* Input Section */}
            <div className="lg:col-span-4 space-y-8">
                <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800 space-y-6">
                    <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        <Ship size={12} />
                        Hull Dimensions
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <CalculatorInput label="Length (Lpp)" unit="m" value={params.length} onChange={(e) => updateParam('length', Number(e.target.value))} />
                        <CalculatorInput label="Beam (B)" unit="m" value={params.beam} onChange={(e) => updateParam('beam', Number(e.target.value))} />
                        <CalculatorInput label="Draft (T)" unit="m" value={params.draft} onChange={(e) => updateParam('draft', Number(e.target.value))} />
                        <CalculatorInput label="Block Coeff (Cb)" unit="index" value={params.blockCoefficient} onChange={(e) => updateParam('blockCoefficient', Number(e.target.value))} />
                    </div>
                </div>

                <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800 space-y-6">
                    <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                        <Anchor size={12} />
                        Loading & Stability
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <CalculatorInput label="Center of Gravity (KG)" unit="m" value={params.centerOfGravity} onChange={(e) => updateParam('centerOfGravity', Number(e.target.value))} />
                        <CalculatorInput label="Water Density" unit="kg/m³" value={params.waterDensity} onChange={(e) => updateParam('waterDensity', Number(e.target.value))} />
                    </div>
                </div>
            </div>

            {/* Nautical Visualization Section */}
            <div className="lg:col-span-5 space-y-8">
                {error ? (
                    <div className="h-full flex flex-col items-center justify-center p-12 bg-red-950/10 border border-dashed border-red-500/30 rounded-[2.5rem] animate-in shake duration-500">
                        <AlertTriangle size={48} className="mb-4 text-red-500" />
                        <h4 className="text-sm font-black text-red-500 uppercase tracking-widest mb-2">Simulation Failed</h4>
                        <p className="text-[10px] font-mono text-red-400/60 uppercase tracking-widest text-center max-w-xs">{error}</p>
                    </div>
                ) : results ? (
                    <div className="space-y-6 animate-in zoom-in duration-500">
                        {/* Stability Compass Visualizer */}
                        <div className="p-10 bg-[#020617] border border-blue-900/30 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-opacity">
                                <Waves size={120} className="text-blue-500 rotate-12" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500/70">Marine Stability Assessment</h3>
                                </div>

                                <div className="mb-12">
                                    <h2 className={`text-7xl font-black italic tracking-tighter leading-none ${results.metacentricHeight > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {results.metacentricHeight > 0 ? 'STABLE' : 'UNSTABLE'}
                                    </h2>
                                    <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] mt-4 max-w-sm leading-relaxed">
                                        {results.metacentricHeight > 0 
                                            ? "The vessel possesses a positive metacentric height, ensuring a self-righting moment during heeling." 
                                            : "WARNING: Negative GM detected. The vessel lacks initial stability and may capsize under external moments."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-10">
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block">Metacentric Height (GM)</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-mono font-black text-white">{results.metacentricHeight.toFixed(3)}</span>
                                            <span className="text-[10px] font-bold text-blue-400">m</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block">Displacement</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-mono font-black text-white">{(results.displacement / 1000).toFixed(1)}k</span>
                                            <span className="text-[10px] font-bold text-blue-400">t</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block">Buoyancy Force</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-mono font-black text-white">{(results.buoyancyForce / 1e6).toFixed(1)}M</span>
                                            <span className="text-[10px] font-bold text-blue-400">kN</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Technical Schematic Image */}
                        <div className="p-4 bg-black/40 border border-white/5 rounded-[3rem] overflow-hidden aspect-[16/9] relative group">
                            <img 
                                src="/naval_stability.png" 
                                alt="Technical Stability Diagram" 
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute bottom-8 left-8">
                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">Technical Schematic // Static Stability Curve</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-12 bg-blue-950/10 border border-dashed border-blue-900/30 rounded-[2.5rem] opacity-40">
                        <Ship size={48} className="mb-4 text-blue-900" />
                        <p className="text-xs font-mono uppercase tracking-[0.2em] text-blue-800">Initiating hydrostatic simulation...</p>
                    </div>
                )}
            </div>

            {/* Results Sidebar */}
            <div className="lg:col-span-3">
                <ResultPanel isComputing={isComputing} contract={contract} />
            </div>
        </WorkstationLayout>
    );
}
