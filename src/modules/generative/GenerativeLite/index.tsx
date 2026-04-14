/**
 * modules/generative/GenerativeLite/index.tsx
 */

import React from 'react';
import { useGenerativeStore } from './store';
import { Cpu, Play, Square, Layers, Activity } from 'lucide-react';

export default function GenerativeLiteModule() {
    const {
        input,
        result,
        isRunning,
        progress,
        currentIteration,
        liveVolume,
        setInput,
        startOptimization,
        cancel
    } = useGenerativeStore();

    return (
        <div className="flex flex-col h-full bg-[var(--color-os-canvas)] text-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur">
                <div className="flex items-center gap-3">
                    <Cpu className="text-cyan-400 w-6 h-6" />
                    <div>
                        <h2 className="text-xl font-bold tracking-tight leading-none">Generative Lite</h2>
                        <span className="text-xs text-slate-500 uppercase tracking-widest">Topology Optimization</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    {isRunning ? (
                        <button onClick={cancel} className="px-3 py-1.5 bg-red-600/20 text-red-500 hover:bg-red-600/30 rounded border border-red-500/30 flex items-center gap-2 text-sm transition-colors">
                            <Square className="w-4 h-4" /> Stop Solver
                        </button>
                    ) : (
                        <button onClick={startOptimization} className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded shadow-lg shadow-cyan-900/20 flex items-center gap-2 text-sm transition-all active:scale-95 font-medium">
                            <Play className="w-4 h-4" fill="currentColor" /> Generate
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Controls */}
                <div className="w-80 border-r border-slate-800 p-4 bg-slate-900/30 overflow-y-auto flex flex-col gap-6">
                    <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Layers className="w-4 h-4" /> Design Goals
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <label className="text-slate-300">Target Volume Fraction</label>
                                    <span className="text-cyan-400 font-mono">{(input.targetVolumeFraction * 100).toFixed(0)}%</span>
                                </div>
                                <input
                                    type="range" min="0.1" max="0.9" step="0.05"
                                    value={input.targetVolumeFraction}
                                    onChange={e => setInput({ targetVolumeFraction: Number(e.target.value) })}
                                    className="w-full accent-cyan-500"
                                    disabled={isRunning}
                                />
                                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                                    Lowering this forces the AI to cut more material, increasing stress on remaining structures.
                                </p>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-800" />

                    {/* Active Progress Panel */}
                    {(isRunning || result) && (
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-xl">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-300">
                                    {isRunning ? 'Solving...' : 'Optimization Complete'}
                                </span>
                                {isRunning && <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />}
                            </div>

                            <div className="w-full bg-slate-950 rounded-full h-2 mb-4 overflow-hidden border border-slate-800">
                                <div
                                    className="bg-cyan-500 h-2 rounded-full transition-all duration-200"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>

                            <div className="space-y-2 text-sm font-mono text-slate-400">
                                <div className="flex justify-between">
                                    <span>Iteration:</span>
                                    <span className="text-slate-200">{currentIteration}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Live Volume:</span>
                                    <span className="text-amber-400">{liveVolume.toFixed(0)} cm³</span>
                                </div>
                                {result && (
                                    <div className="flex justify-between pt-2 border-t border-slate-700 mt-2">
                                        <span>Mass Saved:</span>
                                        <span className="text-emerald-400 font-bold">{result.massSavedKg.toFixed(2)} kg</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Visualization Mock Window */}
                <div className="flex-1 relative flex items-center justify-center p-8">
                    {/* Placeholder for 3D/2D Canvas Overlay */}
                    <div className={`w-full h-full max-w-2xl max-h-[500px] border-2 border-dashed ${isRunning ? 'border-cyan-500/50' : 'border-slate-800'} rounded-2xl flex flex-col items-center justify-center transition-colors duration-500 relative overflow-hidden`}>

                        {!isRunning && !result && (
                            <div className="text-center opacity-50">
                                <Cpu className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                                <p>Select boundary conditions and press Generate.</p>
                            </div>
                        )}

                        {isRunning && (
                            <>
                                {/* Simulated Heatmap Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-cyan-900/10 to-red-900/5 animate-pulse rounded-2xl" />
                                <div className="z-10 text-center">
                                    <div className="text-4xl font-black text-cyan-500/80 mb-2 font-mono">{progress}%</div>
                                    <div className="text-xs text-cyan-400 uppercase tracking-widest animate-pulse">Removing Low-Stress Artifacts</div>
                                </div>
                            </>
                        )}

                        {result && !isRunning && (
                            <div className="z-10 text-center">
                                <div className="text-emerald-500 flex justify-center mb-4">
                                    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2">Geometry Optimized</h4>
                                <p className="text-slate-400 text-sm">Target volume reached successfully.<br />Saved {result.massSavedKg.toFixed(2)}kg of material.</p>
                                <button className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-sm transition-colors ring-1 ring-slate-700">
                                    Export to CAD Editor
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
