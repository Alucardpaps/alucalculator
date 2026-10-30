'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Zap, ArrowRight, Gauge, Activity, PlusCircle, MinusCircle, RefreshCcw } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { getGearboxModuleStrings, formatGearboxStage } from '@/locales/gearboxModuleTranslations';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

interface GearStage {
    z1: number;
    z2: number;
    efficiency: number;
}

export default function GearboxDesignModule() {
  const precision = useGlobalPrecision();
    const { language } = useI18nStore();
    const g = getGearboxModuleStrings(language);

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
        <div className="flex flex-col w-full h-full bg-[var(--bg-0)] text-[var(--ink)] overflow-hidden relative selection:bg-[var(--cyan-glow)]">
            <div className="flex flex-col h-full max-w-7xl mx-auto w-full p-4 sm:p-6 relative z-10 gap-5 overflow-y-auto custom-scrollbar font-mono">
                
                {/* Header */}
                <header className="flex items-center justify-between shrink-0 border-b border-[var(--line)] pb-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-center text-[var(--cyan)] shadow-xs">
                            <Settings className="animate-[spin_6s_linear_infinite]" size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-black tracking-tight text-[var(--ink)] uppercase">
                                {g.ratioEngine}
                            </h1>
                            <p className="text-[10px] text-[var(--alu-dim)] font-mono tracking-widest uppercase">
                                {g.multiStage}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 px-4 py-2 bg-[var(--bg-2)] border border-[var(--line)] rounded-[var(--radius-s)] shadow-xs">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-[var(--alu-dim)] uppercase tracking-widest">
                                {g.totalRatio}
                            </span>
                            <span className="text-lg sm:text-xl font-black font-mono text-[var(--cyan)]">1 : {formatNum(results.totalRatio, 2)}</span>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-5">
                    {/* INPUTS PANEL */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-4">
                        
                        {/* Motor Data */}
                        <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-[var(--radius-m)] p-4 sm:p-5 relative overflow-hidden">
                            <div className="flex items-center gap-2.5 mb-4">
                                <Zap className="text-[var(--warn)]" size={16} />
                                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--alu)]">
                                    {g.motorParams}
                                </h2>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-[var(--alu-dim)]">
                                        <span>{g.motorPower}</span>
                                        <span className="text-[var(--warn)] font-mono text-xs">{inputPower} kW</span>
                                    </div>
                                    <input type="range" min="0.1" max="1000" step="0.1" value={inputPower} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputPower(e.target.valueAsNumber)} className="w-full accent-[var(--warn)]" />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-[var(--alu-dim)]">
                                        <span>{g.motorSpeed}</span>
                                        <span className="text-[var(--cyan)] font-mono text-xs">{inputRPM} RPM</span>
                                    </div>
                                    <input type="range" min="10" max="3600" step="10" value={inputRPM} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputRPM(e.target.valueAsNumber)} className="w-full accent-[var(--cyan)]" />
                                </div>

                                <div className="p-3 bg-[var(--bg-2)] rounded-[var(--radius-s)] border border-[var(--line)] flex items-center justify-between">
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--alu-dim)]">
                                        {g.initialTorque}
                                    </span>
                                    <span className="font-mono font-bold text-[var(--ink)]">{formatNum(inputTorque)} <span className="text-[var(--alu-dim)] text-xs">Nm</span></span>
                                </div>
                            </div>
                        </div>

                        {/* FINAL OUTPUT DATA */}
                        <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-[var(--radius-m)] p-4 sm:p-5 relative overflow-hidden flex-1">
                            <div className="flex items-center gap-2.5 mb-4">
                                <Gauge className="text-[var(--cyan)]" size={16} />
                                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--cyan)]">
                                    {g.outputMetrics}
                                </h2>
                            </div>
                            
                            <div className="flex flex-col gap-3.5">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9.5px] uppercase tracking-widest font-bold text-[var(--alu-dim)]">
                                        {g.finalRpm}
                                    </span>
                                    <div className="text-3xl sm:text-4xl font-black font-mono text-[var(--cyan)]">{formatNum(results.finalRPM, 1)}</div>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9.5px] uppercase tracking-widest font-bold text-[var(--alu-dim)]">
                                        {g.finalTorque}
                                    </span>
                                    <div className="text-3xl sm:text-4xl font-black font-mono text-[var(--ink)]">{formatNum(results.finalTorque, 0)} <span className="text-base text-[var(--alu-dim)] font-sans">Nm</span></div>
                                </div>
                                <div className="w-full h-px bg-[var(--line)] my-1" />
                                <div className="flex items-center justify-between">
                                    <span className="text-[9.5px] uppercase tracking-widest font-bold text-[var(--alu-dim)]">
                                        {g.globalEfficiency}
                                    </span>
                                    <span className="font-bold text-[var(--ok)]">{formatEngineeringValue((results.totalEfficiency * 100), precision, false)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* STAGES MATRIX */}
                    <div className="w-full lg:w-2/3 bg-[var(--bg-1)] border border-[var(--line)] rounded-[var(--radius-m)] p-4 sm:p-6 flex flex-col relative">
                        {/* Multi-Stage Animated Gearbox Train Visualizer */}
                        <div className="w-full h-52 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)] p-2 mb-5 overflow-hidden flex items-center justify-center relative">
                            <svg viewBox="0 0 600 190" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                                <defs>
                                    <linearGradient id="gbPinionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#818cf8" />
                                        <stop offset="35%" stopColor="#4f46e5" />
                                        <stop offset="70%" stopColor="#312e81" />
                                        <stop offset="100%" stopColor="#1e1b4b" />
                                    </linearGradient>
                                    <linearGradient id="gbGearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#00e5ff" />
                                        <stop offset="35%" stopColor="#0891b2" />
                                        <stop offset="70%" stopColor="#0e7490" />
                                        <stop offset="100%" stopColor="#164e63" />
                                    </linearGradient>
                                    <filter id="gbShadow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.8" />
                                    </filter>
                                </defs>

                                <style>{`
                                    @keyframes spin-cw-slow { 100% { transform: rotate(360deg); } }
                                    @keyframes spin-ccw-slow { 100% { transform: rotate(-360deg); } }
                                    @media (prefers-reduced-motion: reduce) {
                                        .gb-spin-cw, .gb-spin-ccw { animation: none !important; }
                                    }
                                `}</style>

                                {(() => {
                                    const nStages = stages.length;
                                    const stageWidth = 560 / nStages;

                                    return stages.map((stg, i) => {
                                        const res = results.stageResults[i];
                                        const inRpm = i === 0 ? inputRPM : results.stageResults[i - 1].outRPM;
                                        const outRpm = res.outRPM;

                                        // Smooth, calm rotation speed
                                        const speedFactor = inRpm > 0 ? Math.max(0.2, Math.min(2.5, inRpm / 1450)) : 0;
                                        const dur1 = speedFactor > 0 ? (10 / speedFactor) : 0;
                                        const dur2 = dur1 > 0 ? dur1 * (stg.z2 / stg.z1) : 0;

                                        const boxX = 20 + i * stageWidth;
                                        const boxW = stageWidth - 10;
                                        const stageCenter = boxX + boxW / 2;
                                        const cy = 95;

                                        // Scale radii so they fit inside boxW while staying strictly adjacent (meshing at pitch circle)
                                        const totalZ = stg.z1 + stg.z2;
                                        const maxSpan = boxW * 0.76;
                                        const m = Math.min(maxSpan / totalZ, 2.2);
                                        const r1 = Math.max(12, (stg.z1 * m) / 2);
                                        const r2 = Math.max(20, (stg.z2 * m) / 2);
                                        const a = r1 + r2; // Exact center distance (no gap!)

                                        const cx1 = stageCenter - a / 2;
                                        const cx2 = cx1 + a;

                                        // Generate tooth paths for realistic meshing appearance
                                        const toothStep1 = (2 * Math.PI) / stg.z1;
                                        let path1 = `M ${cx1 + r1},${cy} `;
                                        for (let t = 0; t < stg.z1; t++) {
                                            const ang = t * toothStep1;
                                            const tipR = r1 + m * 0.9;
                                            const rootR = r1 - m * 1.1;
                                            const xTip = cx1 + Math.cos(ang) * tipR;
                                            const yTip = cy + Math.sin(ang) * tipR;
                                            const xRoot = cx1 + Math.cos(ang + toothStep1 * 0.5) * rootR;
                                            const yRoot = cy + Math.sin(ang + toothStep1 * 0.5) * rootR;
                                            path1 += `L ${formatEngineeringValue(xTip, precision, false)},${formatEngineeringValue(yTip, precision, false)} L ${formatEngineeringValue(xRoot, precision, false)},${formatEngineeringValue(yRoot, precision, false)} `;
                                        }
                                        path1 += 'Z';

                                        const toothStep2 = (2 * Math.PI) / stg.z2;
                                        let path2 = `M ${cx2 - r2},${cy} `;
                                        for (let t = 0; t < stg.z2; t++) {
                                            const ang = Math.PI + t * toothStep2;
                                            const tipR = r2 + m * 0.9;
                                            const rootR = r2 - m * 1.1;
                                            const xTip = cx2 + Math.cos(ang) * tipR;
                                            const yTip = cy + Math.sin(ang) * tipR;
                                            const xRoot = cx2 + Math.cos(ang + toothStep2 * 0.5) * rootR;
                                            const yRoot = cy + Math.sin(ang + toothStep2 * 0.5) * rootR;
                                            path2 += `L ${formatEngineeringValue(xTip, precision, false)},${formatEngineeringValue(yTip, precision, false)} L ${formatEngineeringValue(xRoot, precision, false)},${formatEngineeringValue(yRoot, precision, false)} `;
                                        }
                                        path2 += 'Z';

                                        return (
                                            <g key={i} filter="url(#gbShadow)">
                                                {/* Stage Box Background */}
                                                <rect x={boxX} y={15} width={boxW} height="160" rx="10" className="fill-[var(--bg-2)] stroke-[var(--line)]" strokeWidth="1" />
                                                
                                                {/* Stage Header & Ratio Tag */}
                                                <text x={boxX + 10} y={32} fill="currentColor" className="text-[var(--alu-dim)]" fontSize="9" fontWeight="bold" fontFamily="monospace">STAGE {i + 1}</text>
                                                <text x={boxX + boxW - 10} y={32} textAnchor="end" fill="#818cf8" fontSize="9" fontWeight="bold" fontFamily="monospace">i = {formatEngineeringValue((stg.z2/stg.z1), precision, false)}</text>
                                                
                                                {/* Output Speed Readout */}
                                                <text x={boxX + 10} y={164} fill="#00e5ff" fontSize="9" fontWeight="bold" fontFamily="monospace">{formatEngineeringValue(outRpm, precision, false)} RPM</text>
                                                <text x={boxX + boxW - 10} y={164} textAnchor="end" fill="currentColor" className="text-[var(--alu-dim)]" fontSize="8" fontFamily="monospace">z1={stg.z1} z2={stg.z2}</text>

                                                {/* Centerline linking centers */}
                                                <line x1={cx1} y1={cy} x2={cx2} y2={cy} stroke="currentColor" className="text-[var(--line-strong)]" strokeWidth="0.8" strokeDasharray="3 3" />

                                                {/* Pinion (Driver) - Solid Metallic Body with Involute Teeth */}
                                                <g style={dur1 > 0 ? { transformOrigin: `${cx1}px ${cy}px`, transformBox: 'view-box', animation: `spin-cw-slow ${dur1.toFixed(3)}s linear infinite` } : undefined}>
                                                    <path d={path1} fill="url(#gbPinionGrad)" stroke="#818cf8" strokeWidth="1" strokeLinejoin="round" />
                                                    {/* Solid Raised Hub */}
                                                    <circle cx={cx1} cy={cy} r={r1 * 0.45} fill="url(#gbPinionGrad)" stroke="#818cf8" strokeWidth="0.8" />
                                                    {/* Center Shaft Bore */}
                                                    <circle cx={cx1} cy={cy} r={r1 * 0.28} className="fill-[var(--bg-0)] stroke-[var(--line)]" strokeWidth="1" />
                                                    {/* Crosshair indicator */}
                                                    <line x1={cx1 - 3} y1={cy} x2={cx1 + 3} y2={cy} stroke="#818cf8" strokeWidth="0.8" />
                                                    <line x1={cx1} y1={cy - 3} x2={cx1} y2={cy + 3} stroke="#818cf8" strokeWidth="0.8" />
                                                </g>

                                                {/* Gear (Driven) - Solid Metallic Body with Involute Teeth, Meshing Exactly at cx1 + r1 */}
                                                <g style={dur2 > 0 ? { transformOrigin: `${cx2}px ${cy}px`, transformBox: 'view-box', animation: `spin-ccw-slow ${dur2.toFixed(3)}s linear infinite` } : undefined}>
                                                    <path d={path2} fill="url(#gbGearGrad)" stroke="#00e5ff" strokeWidth="1" strokeLinejoin="round" />
                                                    {/* Concentric Rim Ring */}
                                                    <circle cx={cx2} cy={cy} r={r2 * 0.85} fill="none" stroke="#00e5ff" strokeWidth="0.6" opacity="0.4" />
                                                    {/* Solid Raised Hub */}
                                                    <circle cx={cx2} cy={cy} r={r2 * 0.4} fill="url(#gbGearGrad)" stroke="#00e5ff" strokeWidth="0.8" />
                                                    {/* Center Shaft Bore & Keyway */}
                                                    <circle cx={cx2} cy={cy} r={r2 * 0.24} className="fill-[var(--bg-0)] stroke-[var(--line)]" strokeWidth="1" />
                                                    <rect x={cx2 - 1.5} y={cy - r2 * 0.24 - 2} width="3" height="3" className="fill-[var(--bg-0)] stroke-[var(--line)]" strokeWidth="0.7" />
                                                    {/* Crosshair indicator */}
                                                    <line x1={cx2 - 4} y1={cy} x2={cx2 + 4} y2={cy} stroke="#00e5ff" strokeWidth="0.8" />
                                                    <line x1={cx2} y1={cy - 4} x2={cx2} y2={cy + 4} stroke="#00e5ff" strokeWidth="0.8" />
                                                </g>

                                                {/* Pitch Mesh Point Dot */}
                                                <circle cx={cx1 + r1} cy={cy} r="2" fill="#f59e0b" opacity="0.9" />

                                                {/* Rigid Connecting Shaft to Next Stage */}
                                                {i < nStages - 1 && (() => {
                                                    const nextBoxX = 20 + (i + 1) * stageWidth;
                                                    const nextTotalZ = stages[i+1].z1 + stages[i+1].z2;
                                                    const nextM = Math.min((stageWidth - 10) * 0.76 / nextTotalZ, 2.2);
                                                    const nextR1 = Math.max(12, (stages[i+1].z1 * nextM) / 2);
                                                    const nextR2 = Math.max(20, (stages[i+1].z2 * nextM) / 2);
                                                    const nextCx1 = (nextBoxX + (stageWidth - 10) / 2) - (nextR1 + nextR2) / 2;

                                                    return (
                                                        <rect
                                                            x={cx2}
                                                            y={cy - 2.5}
                                                            width={nextCx1 - cx2}
                                                            height="5"
                                                            rx="1"
                                                            className="fill-[var(--bg-3)] stroke-[var(--line)]"
                                                            strokeWidth="0.8"
                                                        />
                                                    );
                                                })()}
                                            </g>
                                        );
                                    });
                                })()}
                            </svg>
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
                                            className="bg-[var(--bg-2)] border border-[var(--line)] rounded-[var(--radius-s)] p-4 sm:p-5 relative overflow-hidden flex flex-col md:flex-row items-center gap-5"
                                        >
                                            {/* Stage ID */}
                                            <div className="absolute top-0 left-0 bottom-0 w-7 bg-[var(--bg-3)] flex items-center justify-center border-r border-[var(--line)]">
                                                <span className="-rotate-90 text-[9px] font-black uppercase tracking-widest text-[var(--alu-dim)]">
                                                    {formatGearboxStage(g, idx + 1)}
                                                </span>
                                            </div>

                                            <div className="ml-6 flex-1 grid grid-cols-2 gap-3.5">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-[var(--alu-dim)] uppercase tracking-widest">
                                                        {g.pinion}
                                                    </span>
                                                    <input 
                                                        type="number" value={stage.z1} 
                                                        onChange={e => updateStage(idx, 'z1', Number(e.target.value))}
                                                        className="w-full bg-[var(--bg-1)] border border-[var(--line)] rounded-[var(--radius-s)] p-1.5 font-mono text-[var(--ink)] outline-none focus:border-[var(--cyan)] transition-colors"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-[var(--alu-dim)] uppercase tracking-widest">
                                                        {g.gear}
                                                    </span>
                                                    <input 
                                                        type="number" value={stage.z2} 
                                                        onChange={e => updateStage(idx, 'z2', Number(e.target.value))}
                                                        className="w-full bg-[var(--bg-1)] border border-[var(--line)] rounded-[var(--radius-s)] p-1.5 font-mono text-[var(--ink)] outline-none focus:border-[var(--cyan)] transition-colors"
                                                    />
                                                </div>
                                                <div className="space-y-1 col-span-2">
                                                    <span className="text-[9px] font-bold text-[var(--alu-dim)] uppercase tracking-widest">
                                                        {g.efficiency}
                                                    </span>
                                                    <input 
                                                        type="number" step="0.01" value={stage.efficiency} 
                                                        onChange={e => updateStage(idx, 'efficiency', Number(e.target.value))}
                                                        className="w-full bg-[var(--bg-1)] border border-[var(--line)] rounded-[var(--radius-s)] p-1.5 font-mono text-[var(--ok)] outline-none focus:border-[var(--ok)] transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            <div className="hidden md:flex items-center text-[var(--alu-dim)]">
                                                <ArrowRight size={20} />
                                            </div>

                                            <div className="w-full md:w-48 bg-[var(--bg-3)] border border-[var(--line)] rounded-[var(--radius-s)] p-3.5 flex flex-col gap-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-bold uppercase text-[var(--alu-dim)]">
                                                        {g.ratio}
                                                    </span>
                                                    <span className="font-mono text-xs font-bold text-[var(--cyan)]">1:{formatNum(stgRes.ratio)}</span>
                                                </div>
                                                <div className="w-full h-px bg-[var(--line)]" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-bold uppercase text-[var(--alu-dim)]">
                                                        {g.outRpm}
                                                    </span>
                                                    <span className="font-mono text-xs text-[var(--cyan)]">{formatNum(stgRes.outRPM, 0)}</span>
                                                </div>
                                                <div className="w-full h-px bg-[var(--line)]" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-bold uppercase text-[var(--alu-dim)]">
                                                        {g.outNm}
                                                    </span>
                                                    <span className="font-mono text-xs text-[var(--ink)] font-bold">{formatNum(stgRes.outTorque, 0)}</span>
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
