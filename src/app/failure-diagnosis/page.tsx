"use client";

import { useState } from 'react';
import { WorkstationLayout } from '@/components/os/WorkstationLayout';
import { CalculatorInput } from '@/components/CalculatorInput';
import { ResultPanel } from '@/components/calculation/ResultPanel';
import { useComputation } from '@/hooks/useComputation';
import { Activity, AlertTriangle, ShieldCheck, Zap, BarChart3 } from 'lucide-react';

/**
 * Failure Diagnosis Workstation
 * Analysis tool for mechanical fatigue and fracture diagnostics.
 */
export default function FailureDiagnosisPage() {
    const [params, setParams] = useState({
        operatingStress: 150,
        yieldStrength: 450,
        enduranceLimit: 220,
        stressConcentrationFactor: 1.25,
        cyclesCount: 1000000
    });

    const { contract, isComputing, error, execute } = useComputation("failure");

    const updateParam = (key: string, val: any) => {
        setParams(prev => ({ ...prev, [key]: val }));
    };

    const results = contract?.data;

    return (
        <WorkstationLayout 
            title="Failure Diagnosis" 
            id="DIAG_X1"
            status={results ? 'stable' : 'idle'}
            onCalculate={() => execute(params)}
        >
            {/* Input Section */}
            <div className="lg:col-span-4 space-y-8">
                <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800 space-y-6">
                    <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={12} />
                        Stress Parameters
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <CalculatorInput 
                            label="Operating Stress (σ)" 
                            unit="MPa" 
                            value={params.operatingStress} 
                            onChange={(e) => updateParam('operatingStress', Number(e.target.value))}
                        />
                        <CalculatorInput 
                            label="Kt (Concentration)" 
                            unit="coeff" 
                            value={params.stressConcentrationFactor} 
                            onChange={(e) => updateParam('stressConcentrationFactor', Number(e.target.value))}
                        />
                    </div>
                </div>

                <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800 space-y-6">
                    <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={12} />
                        Material Limits
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <CalculatorInput 
                            label="Yield Strength (Sy)" 
                            unit="MPa" 
                            value={params.yieldStrength} 
                            onChange={(e) => updateParam('yieldStrength', Number(e.target.value))}
                        />
                        <CalculatorInput 
                            label="Endurance Limit (Se)" 
                            unit="MPa" 
                            value={params.enduranceLimit} 
                            onChange={(e) => updateParam('enduranceLimit', Number(e.target.value))}
                        />
                    </div>
                </div>
            </div>

            {/* Analysis & Visualization Section */}
            <div className="lg:col-span-5 space-y-6">
                {error ? (
                    <div className="h-full flex flex-col items-center justify-center p-12 bg-red-950/10 border border-dashed border-red-500/30 rounded-[2.5rem] animate-in shake duration-500">
                        <AlertTriangle size={48} className="mb-4 text-red-500" />
                        <h4 className="text-sm font-black text-red-500 uppercase tracking-widest mb-2">Diagnostic Failed</h4>
                        <p className="text-[10px] font-mono text-red-400/60 uppercase tracking-widest text-center max-w-xs">{error}</p>
                    </div>
                ) : results ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Damage Probability Visualizer */}
                        <div className="p-10 bg-[#0f172a] border border-slate-800 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500/70">Structural Integrity Diagnosis</h3>
                            </div>

                            <div className="mb-10">
                                <h2 className={`text-6xl font-black italic tracking-tighter leading-none ${results.fatigueSafetyFactor > 1.2 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {results.fatigueSafetyFactor > 1.2 ? 'SAFE' : 'CRITICAL'}
                                </h2>
                                <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] mt-4 max-w-sm leading-relaxed">
                                    {results.fatigueSafetyFactor > 1.2 
                                        ? "The component is within safe operating limits for the specified cycles and load conditions." 
                                        : "WARNING: High probability of fatigue failure. The applied cyclic loads exceed the material endurance limit."}
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Primary Failure Mode</h4>
                                    <span className={`text-2xl font-black uppercase tracking-tighter ${results.damageProbability > 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {results.primaryMode.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-800/50">
                                    <div>
                                        <span className="text-[9px] font-bold text-slate-600 uppercase block">Static SF</span>
                                        <span className="text-xl font-mono font-black text-white">{results.staticSafetyFactor.toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold text-slate-600 uppercase block">Fatigue SF</span>
                                        <span className="text-xl font-mono font-black text-white">{results.fatigueSafetyFactor.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Technical Schematic Image */}
                        <div className="p-4 bg-black/40 border border-white/5 rounded-[3rem] overflow-hidden aspect-[16/9] relative group">
                            <img 
                                src="/failure_analysis.png" 
                                alt="Technical Failure Diagram" 
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute bottom-8 left-8">
                                <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em]">Technical Schematic // S-N Fatigue Curve Analysis</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-900/20 border border-dashed border-slate-800 rounded-[2.5rem] opacity-40">
                        <Activity size={48} className="mb-4 text-slate-700" />
                        <p className="text-xs font-mono uppercase tracking-[0.2em] text-slate-600">Waiting for diagnostic input payload...</p>
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
