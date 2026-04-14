'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Zap, ArrowRight, Gauge, Activity, PlusCircle, MinusCircle, RefreshCcw } from 'lucide-react';

interface GearStage {
    z1: number;
    z2: number;
    efficiency: number;
}

export default function GearboxDesignModule() {
    const [stages, setStages] = useState<GearStage[]>([
        { z1: 20, z2: 60, efficiency: 0.98 },
        { z1: 15, z2: 45, efficiency: 0.98 }
    ]);
    
    // Motor Inputs
    const [inputRPM, setInputRPM] = useState<number>(1450);
    const [inputPower, setInputPower] = useState<number>(5.5); // kW

    // Calculate Input Torque based on Power and RPM
    const inputTorque = useMemo(() => {
        return (inputPower * 1000 * 60) / (2 * Math.PI * inputRPM); // Nm
    }, [inputPower, inputRPM]);

    // Engine Core Calculation
    const results = useMemo(() => {
        let currentRPM = inputRPM;
        let currentTorque = inputTorque;
        let totalRatio = 1;
        let totalEfficiency = 1;

        const stageResults = stages.map(stage => {
            const ratio = stage.z2 / stage.z1;
            totalRatio *= ratio;
            totalEfficiency *= stage.efficiency;
            
            const outRPM = currentRPM / ratio;
            const outTorque = currentTorque * ratio * stage.efficiency;
            
            currentRPM = outRPM;
            currentTorque = outTorque;

            return { ratio, outRPM, outTorque };
        });

        return {
            totalRatio,
            totalEfficiency,
            finalRPM: currentRPM,
            finalTorque: currentTorque,
            stageResults
        };
    }, [stages, inputRPM, inputTorque]);

    const addStage = () => {
        if (stages.length < 4) {
            setStages([...stages, { z1: 20, z2: 40, efficiency: 0.98 }]);
        }
    };

    const removeStage = () => {
        if (stages.length > 1) {
            setStages(stages.slice(0, -1));
        }
    };

    const updateStage = (index: number, field: keyof GearStage, value: number) => {
        const newStages = [...stages];
        newStages[index] = { ...newStages[index], [field]: Math.max(1, value) };
        if (field === 'efficiency') {
            newStages[index].efficiency = Math.min(1, Math.max(0.1, value));
        }
        setStages(newStages);
    };

    const formatNum = (num: number, digits=2) => {
        return Number(num.toFixed(digits));
    };

    return (
        <div className="flex flex-col w-full h-full bg-[#03060a] text-white overflow-hidden relative selection:bg-purple-500/30">
            {/* Visual Grid Layer */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.1),transparent_50%)] pointer-events-none" />

            <div className="flex flex-col h-full max-w-7xl mx-auto w-full p-6 relative z-10 gap-6 overflow-y-auto custom-scrollbar">
                
                {/* Header */}
                <header className="flex items-center justify-between shrink-0 mb-2 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                            <Settings className="animate-[spin_4s_linear_infinite]" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">Gearbox Ratio Engine</h1>
                            <p className="text-[10px] text-purple-500/60 font-mono tracking-widest uppercase">Multi-Stage Transmission Synthesis</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 px-6 py-3 bg-[#0a101f] border border-white/5 rounded-xl shadow-inner">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Total Global Ratio</span>
                            <span className="text-xl font-black font-mono text-purple-400">1 : {formatNum(results.totalRatio, 2)}</span>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* INPUTS PANEL */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-6">
                        
                        {/* Motor Data */}
                        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-6">
                                <Zap className="text-yellow-500" size={18} />
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Motor Parameters</h2>
                            </div>
                            
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500">
                                        <span>Motor Power (P)</span>
                                        <span className="text-yellow-400 font-mono text-sm">{inputPower} kW</span>
                                    </div>
                                    <input type="range" min="0.1" max="1000" step="0.1" value={inputPower} onChange={e => setInputPower(e.target.valueAsNumber)} className="w-full accent-yellow-500" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500">
                                        <span>Motor Speed (n1)</span>
                                        <span className="text-cyan-400 font-mono text-sm">{inputRPM} RPM</span>
                                    </div>
                                    <input type="range" min="10" max="3600" step="10" value={inputRPM} onChange={e => setInputRPM(e.target.valueAsNumber)} className="w-full accent-cyan-500" />
                                </div>

                                <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Initial Torque</span>
                                    <span className="font-mono font-black text-white">{formatNum(inputTorque)} <span className="text-slate-500 text-xs">Nm</span></span>
                                </div>
                            </div>
                        </div>

                        {/* FINAL OUTPUT DATA */}
                        <div className="bg-purple-900/10 backdrop-blur-xl border border-purple-500/20 rounded-[2rem] p-6 relative overflow-hidden flex-1">
                            <div className="flex items-center gap-3 mb-6">
                                <Gauge className="text-purple-400" size={18} />
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500">Output Shaft Metrics</h2>
                            </div>
                            
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Final RPM</span>
                                    <div className="text-4xl font-black font-mono text-cyan-400">{formatNum(results.finalRPM, 1)}</div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Final Torque</span>
                                    <div className="text-5xl font-black font-mono text-white">{formatNum(results.finalTorque, 0)} <span className="text-xl text-slate-600 font-sans">Nm</span></div>
                                </div>
                                <div className="w-full h-px bg-purple-500/20 my-2" />
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Global Efficiency</span>
                                    <span className="font-black text-emerald-400">{(results.totalEfficiency * 100).toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* STAGES MATRIX */}
                    <div className="w-full lg:w-2/3 bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 flex flex-col relative">
                        <div className="flex items-center justify-between mb-8">
                           <div className="flex items-center gap-3">
                               <RefreshCcw className="text-blue-400" size={18} />
                               <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Transmission Cascade</h2>
                           </div>
                           <div className="flex items-center gap-2">
                               <button onClick={removeStage} disabled={stages.length <= 1} className="p-2 border border-white/10 rounded-lg hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-30">
                                   <MinusCircle size={16}/>
                               </button>
                               <button onClick={addStage} disabled={stages.length >= 4} className="p-2 border border-white/10 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors disabled:opacity-30">
                                   <PlusCircle size={16}/>
                               </button>
                           </div>
                        </div>

                        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                            <AnimatePresence>
                                {stages.map((stage, idx) => {
                                    const stgRes = results.stageResults[idx];
                                    return (
                                        <motion.div 
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="bg-black/30 border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-6"
                                        >
                                            {/* Stage ID */}
                                            <div className="absolute top-0 left-0 bottom-0 w-8 bg-white/5 flex items-center justify-center border-r border-white/5">
                                                <span className="-rotate-90 text-[10px] font-black uppercase tracking-widest text-slate-600">Stage {idx + 1}</span>
                                            </div>

                                            <div className="ml-8 flex-1 grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Pinion (Z1)</span>
                                                    <input 
                                                        type="number" value={stage.z1} 
                                                        onChange={e => updateStage(idx, 'z1', Number(e.target.value))}
                                                        className="w-full bg-[#0a101f] border border-white/10 rounded-lg p-2 font-mono text-white outline-none focus:border-purple-500/50 transition-colors"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Gear (Z2)</span>
                                                    <input 
                                                        type="number" value={stage.z2} 
                                                        onChange={e => updateStage(idx, 'z2', Number(e.target.value))}
                                                        className="w-full bg-[#0a101f] border border-white/10 rounded-lg p-2 font-mono text-white outline-none focus:border-purple-500/50 transition-colors"
                                                    />
                                                </div>
                                                <div className="space-y-1 col-span-2">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Efficiency (0.1 - 1.0)</span>
                                                    <input 
                                                        type="number" step="0.01" value={stage.efficiency} 
                                                        onChange={e => updateStage(idx, 'efficiency', Number(e.target.value))}
                                                        className="w-full bg-[#0a101f] border border-white/10 rounded-lg p-2 font-mono text-emerald-400 outline-none focus:border-emerald-500/50 transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            <div className="hidden md:flex items-center text-slate-700">
                                                <ArrowRight size={24} />
                                            </div>

                                            <div className="w-full md:w-48 bg-purple-900/10 border border-purple-500/20 rounded-xl p-4 flex flex-col gap-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-bold uppercase text-slate-500">Ratio</span>
                                                    <span className="font-mono text-sm text-purple-400">1:{formatNum(stgRes.ratio)}</span>
                                                </div>
                                                <div className="w-full h-px bg-white/5" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-bold uppercase text-slate-500">Out RPM</span>
                                                    <span className="font-mono text-sm text-cyan-400">{formatNum(stgRes.outRPM, 0)}</span>
                                                </div>
                                                <div className="w-full h-px bg-white/5" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-bold uppercase text-slate-500">Out Nm</span>
                                                    <span className="font-mono text-sm text-white font-bold">{formatNum(stgRes.outTorque, 0)}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
