'use client';

import React from 'react';
import { useManufacturingStore } from '@/store/useManufacturingStore';
import { Bot, GitBranch, GitMerge, Network, Cpu, HardDrive, CheckCircle2 } from 'lucide-react';

export function AiAssemblyEngine() {
    const { fasteners, triggerAiAssembly, branches, activeBranchId, createBranch } = useManufacturingStore();

    return (
        <div className="flex flex-col gap-6 p-6 border border-slate-700/50 bg-slate-900/40 backdrop-blur-md rounded-xl shadow-2xl">
            {/* Header Section */}
            <div className="flex justify-between items-start border-b border-slate-700/50 pb-4">
                <div>
                    <h3 className="text-xl font-light tracking-wide flex items-center gap-3 text-slate-100">
                        <Network className="w-6 h-6 text-blue-500" />
                        Autonomous Spatial Assembly Matrix
                    </h3>
                    <p className="text-[13px] text-slate-400 mt-1.5 flex items-center gap-2">
                        <HardDrive className="w-3.5 h-3.5" /> High-Performance Mating Inference Engine
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Auto Detection Module */}
                <div className="flex flex-col h-full p-5 bg-gradient-to-b from-slate-800/80 to-slate-900 border border-slate-700/40 rounded-lg shadow-inner">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-md text-blue-400">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold tracking-wide text-slate-200">Kinematic Auto-Detection</h4>
                            <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">Topological Graph Traversal</p>
                        </div>
                    </div>

                    <button
                        onClick={() => triggerAiAssembly({})}
                        className="w-full mt-auto py-2.5 bg-blue-600/90 hover:bg-blue-500 text-white text-sm font-medium tracking-wide rounded-md transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.2)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex items-center justify-center gap-2"
                    >
                        <Bot className="w-4 h-4" /> Initialize Inference Sequence
                    </button>

                    {fasteners && (
                        <div className="mt-4 p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-md flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400/80 uppercase tracking-widest border-b border-emerald-900/30 pb-2">
                                <span>Confidence Interval</span>
                                <span className="text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded">{fasteners.confidence}%</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-emerald-300 font-medium pt-1">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                <span>{fasteners.detected} Fastener nodes successfully mated and locked.</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Cloud Branching Module */}
                <div className="flex flex-col h-full p-5 bg-gradient-to-b from-slate-800/80 to-slate-900 border border-slate-700/40 rounded-lg shadow-inner">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-md text-indigo-400">
                                <GitBranch className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold tracking-wide text-slate-200">Parametric Versioning</h4>
                                <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">Concurrent Cloud State</p>
                            </div>
                        </div>
                        <button
                            onClick={() => createBranch('iteration-v' + branches.length)}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[11px] font-medium tracking-wide uppercase shadow-sm border border-slate-600 transition-colors"
                        >
                            Fork State
                        </button>
                    </div>

                    <div className="flex flex-col gap-2 mt-auto overflow-y-auto max-h-32 pr-2 custom-scrollbar">
                        {branches.map(b => (
                            <div key={b.id} className={`flex items-center justify-between p-2.5 rounded border transition-colors ${b.id === activeBranchId
                                    ? 'bg-indigo-950/30 border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.1)]'
                                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                                }`}>
                                <div className="flex items-center gap-2">
                                    <GitBranch className={`w-3.5 h-3.5 ${b.id === activeBranchId ? 'text-indigo-400' : 'text-slate-500'}`} />
                                    <span className={`text-xs font-mono tracking-wide ${b.id === activeBranchId ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        {b.branchName}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    {b.isMerged ? (
                                        <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                                            <GitMerge className="w-3 h-3" /> Merged
                                        </span>
                                    ) : (
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${b.id === activeBranchId ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 bg-slate-700/50'
                                            }`}>
                                            {b.id === activeBranchId ? 'Active Node' : 'Dormant'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
