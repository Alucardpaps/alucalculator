/**
 * modules/mechanical/FailurePrediction/index.tsx
 */

import React, { useEffect } from 'react';
import { useFailureStore } from './store';
import { AlertTriangle, ShieldCheck, Activity, BrainCircuit } from 'lucide-react';

export default function FailurePredictionModule() {
    const { input, result, metadata, setInput, analyze } = useFailureStore();

    useEffect(() => {
        analyze();
    }, [input]);

    const getSafetyColor = (sf: number) => {
        if (sf >= 2.0) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
        if (sf >= 1.2) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
        return 'text-red-400 bg-red-400/10 border-red-400/20';
    };

    const getFatigueColor = (risk: string) => {
        if (risk === 'low') return 'text-emerald-400';
        if (risk === 'medium') return 'text-amber-400';
        return 'text-red-400 font-bold animate-pulse';
    };

    return (
        <div className="flex flex-col h-full bg-[var(--color-os-canvas)] text-slate-200 p-4 overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
                <BrainCircuit className="text-purple-400 w-6 h-6" />
                <h2 className="text-xl font-bold tracking-tight">Failure Prediction Engine</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Boundary Conditions</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Geometry Class</label>
                            <select
                                value={input.geometryType}
                                onChange={e => setInput({ geometryType: e.target.value as any })}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none"
                            >
                                <option value="plate">Flat Plate / Sheet</option>
                                <option value="shaft">Circular Shaft</option>
                                <option value="bracket">L-Bracket / Structural</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Yield Strength (MPa)</label>
                                <input
                                    type="number"
                                    value={input.yieldStrengthMpa}
                                    onChange={e => setInput({ yieldStrengthMpa: Number(e.target.value) })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Est. Max Stress (MPa)</label>
                                <input
                                    type="number"
                                    value={input.estimatedMaxStressMpa}
                                    onChange={e => setInput({ estimatedMaxStressMpa: Number(e.target.value) })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Load Profile</label>
                            <select
                                value={input.appliedLoadType}
                                onChange={e => setInput({ appliedLoadType: e.target.value as any })}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none"
                            >
                                <option value="static">Static (Constant Dead Load)</option>
                                <option value="dynamic">Dynamic (Cyclic/Vibrational)</option>
                                <option value="impact">Impact (Sudden Shock)</option>
                            </select>
                        </div>

                        <hr className="border-slate-800 my-4" />

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={input.hasSharpInternalCorners}
                                    onChange={e => setInput({ hasSharpInternalCorners: e.target.checked })}
                                    className="rounded border-slate-800 bg-slate-950 accent-purple-500"
                                />
                                <label className="text-sm text-slate-300">Sharp Internal Corners (0 fillet)</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={input.hasSuddenCrossSecChange}
                                    onChange={e => setInput({ hasSuddenCrossSecChange: e.target.checked })}
                                    className="rounded border-slate-800 bg-slate-950 accent-purple-500"
                                />
                                <label className="text-sm text-slate-300">Sudden Cross-Section Change</label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Outputs */}
                <div className="flex flex-col gap-4">
                    {result && (
                        <>
                            {/* Safety Factor Block */}
                            <div className={`border rounded-lg p-5 flex flex-col items-center justify-center ${getSafetyColor(result.safetyFactor)}`}>
                                <div className="text-sm font-medium uppercase tracking-widest mb-2 opacity-80">Safety Factor (F.O.S)</div>
                                <div className="text-5xl font-black">{result.safetyFactor.toFixed(2)}</div>

                                {result.safetyFactor < 1.0 ? (
                                    <div className="mt-2 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Predicts Failure</div>
                                ) : (
                                    <div className="mt-2 text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Structurally Safe</div>
                                )}
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
                                    <div className="text-sm text-slate-400">Stress Concentration (Kt)</div>
                                    <div className="font-mono text-purple-400">{result.stressConcentrationFactor.toFixed(2)}x</div>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
                                    <div className="text-sm text-slate-400">Fatigue Risk Estimate</div>
                                    <div className={`font-mono uppercase ${getFatigueColor(result.fatigueRisk)}`}>{result.fatigueRisk}</div>
                                </div>

                                {result.suggestedFilletRadius && (
                                    <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded text-sm text-blue-300">
                                        <strong>AI Suggestion:</strong> Add a minimum internal fillet radius of <strong>R{result.suggestedFilletRadius.toFixed(1)}</strong> to reduce stress concentration at sharp joints.
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
