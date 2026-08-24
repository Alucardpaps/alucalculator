'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
    Zap, AlertTriangle, CheckCircle2, ShieldAlert, 
    Info, Scale, Settings2, ArrowRight 
} from 'lucide-react';
import { 
    getFastenerDefaults, 
    METRIC_COARSE_THREADS, 
    BOLT_GRADES_ISO_898_1 
} from '@/data/standards/fasteners';
import { validateStructuralIntegrity } from '@/utils/engineering/validation';

/**
 * <InteractiveFastener />
 * ACADEMY WORKSPACE INTEGRATION — PHASE 3C
 * 
 * An interactive laboratory component that demonstrates 
 * Smart Defaults (3A) and Error Intelligence (3B).
 */
export const InteractiveFastener: React.FC = () => {
    // 1. Local State
    const [selectedSize, setSelectedSize] = useState('M10');
    const [selectedGrade, setSelectedGrade] = useState('8.8');
    const [preload, setPreload] = useState<number>(20000); // [N]

    // 2. REACTIVE INTELLIGENCE: Auto-populate engineering data on selection change
    const fastenerData = useMemo(() => {
        return getFastenerDefaults(selectedSize, selectedGrade);
    }, [selectedSize, selectedGrade]);

    // 3. ERROR INTELLIGENCE: Evaluate structural integrity in real-time
    const validation = useMemo(() => {
        if (!fastenerData) return null;
        
        // Calculate capacity (Yield force = Stress Area * Yield Strength)
        const yieldCapacityForce = fastenerData.stressArea * fastenerData.yieldStrength;
        
        return validateStructuralIntegrity(preload, yieldCapacityForce);
    }, [preload, fastenerData]);

    // 4. UI Color Mapping
    const statusConfig = {
        success: { 
            bg: 'bg-emerald-500/10', 
            border: 'border-emerald-500/30', 
            text: 'text-emerald-400', 
            icon: <CheckCircle2 size={16} /> 
        },
        warning: { 
            bg: 'bg-amber-500/10', 
            border: 'border-amber-500/30', 
            text: 'text-amber-400', 
            icon: <AlertTriangle size={16} /> 
        },
        critical: { 
            bg: 'bg-red-500/10', 
            border: 'border-red-500/30', 
            text: 'text-red-400', 
            icon: <ShieldAlert size={16} /> 
        }
    };

    const currentStatus = validation ? statusConfig[validation.status] : statusConfig.success;

    return (
        <div className="w-full bg-[#05080f] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                        <Zap size={14} className="text-blue-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Interactive Lab: Fastener Analysis</span>
                </div>
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Standard: ISO 898-1</div>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Inputs Section */}
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Bolt Size</label>
                            <select 
                                value={selectedSize}
                                onChange={(e) => setSelectedSize(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                            >
                                {Object.keys(METRIC_COARSE_THREADS).map(size => (
                                    <option key={size} value={size} className="bg-[#0b121d]">{size}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Property Class</label>
                            <select 
                                value={selectedGrade}
                                onChange={(e) => setSelectedGrade(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                            >
                                {Object.keys(BOLT_GRADES_ISO_898_1).map(grade => (
                                    <option key={grade} value={grade} className="bg-[#0b121d]">Class {grade}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex justify-between">
                            Applied Preload Force <span>[N]</span>
                        </label>
                        <input 
                            type="number"
                            value={preload}
                            onChange={(e) => setPreload(Number(e.target.value))}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono font-black text-blue-400 focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                    </div>

                    {/* Smart Defaults Display */}
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                            <Settings2 size={12} /> Auto-Resolved Parameters
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <span className="text-[8px] text-slate-600 font-bold uppercase">Stress Area</span>
                                <span className="text-xs font-mono text-slate-300">{fastenerData?.stressArea} mm²</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] text-slate-600 font-bold uppercase">Yield Strength</span>
                                <span className="text-xs font-mono text-slate-300">{fastenerData?.yieldStrength} MPa</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Validation & Intelligence Output */}
                <div className="flex flex-col gap-4">
                    <div className={`flex-1 p-6 rounded-2xl border transition-all duration-500 flex flex-col justify-center ${currentStatus.bg} ${currentStatus.border}`}>
                        <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${currentStatus.text}`}>
                            {currentStatus.icon} System Integrity Status
                        </div>
                        
                        <div className="space-y-1 mb-6">
                            <h4 className="text-lg font-black text-white leading-tight">
                                {validation?.message}
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed italic">
                                Utilization: <span className={`font-mono font-bold ${currentStatus.text}`}>{validation?.utilizationRatio.toFixed(1)}%</span>
                            </p>
                        </div>

                        {validation?.actionableAdvice && (
                            <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                                <p className="text-[10px] text-slate-300 leading-relaxed">
                                    <Info size={12} className="inline mr-2 text-blue-400" />
                                    <span className="font-bold text-blue-400 uppercase tracking-widest mr-2">Advice:</span>
                                    {validation.actionableAdvice}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-blue-600/20 transition-all">
                        <div className="flex items-center gap-3">
                            <Scale size={16} className="text-blue-400" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Run Full Simulation</span>
                        </div>
                        <ArrowRight size={14} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>
        </div>
    );
};
