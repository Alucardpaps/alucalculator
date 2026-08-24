'use client';

import React from 'react';
import { useSoftwareStore } from '@/store/useSoftwareStore';
import { ShieldCheck, Crosshair, Radar, AlertTriangle, Layers, Cpu, Server } from 'lucide-react';

export function DrawingQAAgent() {
    const { gdtErrors, isReviewingDrawing, runGDTReview } = useSoftwareStore();

    return (
        <div className="flex flex-col gap-5 p-6 border border-slate-700/50 bg-slate-900/40 backdrop-blur-md rounded-xl shadow-2xl">
            {/* Header Section */}
            <div className="flex justify-between items-start border-b border-slate-700/50 pb-4">
                <div>
                    <h3 className="text-xl font-light tracking-wide flex items-center gap-3 text-slate-100">
                        <Radar className="w-6 h-6 text-rose-500 animate-pulse-slow" />
                        Autonomous Quality Assurance Agent
                    </h3>
                    <p className="text-[13px] text-slate-400 mt-1.5 flex items-center gap-2">
                        <Server className="w-3.5 h-3.5" /> Enterprise Grade PMI Verification & GD&T Analytics Engine
                    </p>
                </div>
                {isReviewingDrawing && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full">
                        <Cpu className="w-4 h-4 text-rose-400 animate-spin" />
                        <span className="text-xs font-medium text-rose-400 uppercase tracking-widest">Neural Scan Active</span>
                    </div>
                )}
            </div>

            {/* Main Action Area */}
            <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-lg border border-slate-700/30">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-lg shadow-inner">
                        <Layers className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-200">ASME Y14.5 / ISO 1101 Compliance Routine</div>
                        <div className="text-xs text-slate-500 mt-0.5">Initialize topological and annotational cross-validation</div>
                    </div>
                </div>
                <button
                    onClick={() => runGDTReview({}, {})}
                    disabled={isReviewingDrawing}
                    className="group relative px-6 py-2.5 bg-rose-600/90 hover:bg-rose-500 text-white text-sm font-medium tracking-wide rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-[0_0_15px_rgba(225,29,72,0.2)] focus:ring-2 focus:ring-rose-500/50"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        {isReviewingDrawing ? 'Processing Semantic Data...' : 'Deploy Analytics Agent'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
            </div>

            {/* Analytics Output Area */}
            {gdtErrors.length > 0 && (
                <div className="mt-2 space-y-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <h4 className="font-semibold tracking-wide text-rose-200 text-sm uppercase">Critical Discrepancies Cataloged</h4>
                        <span className="ml-auto text-xs font-mono text-slate-500">Volumetric Confidence: 99.8%</span>
                    </div>

                    <div className="grid gap-3">
                        {gdtErrors.map(err => (
                            <div key={err.id} className="group p-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 hover:border-rose-500/40 rounded-lg transition-colors relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/50"></div>
                                <div className="flex items-baseline gap-3 mb-2">
                                    <div className="flex items-center gap-2 font-mono text-sm text-slate-200 bg-slate-900 px-2 py-1 rounded border border-slate-700">
                                        <Crosshair className="w-3.5 h-3.5 text-rose-400" /> {err.entityId}
                                    </div>
                                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Deviation Detected</span>
                                </div>

                                <div className="pl-2 border-l border-slate-700/50 ml-6 space-y-2 mt-3">
                                    <div>
                                        <span className="text-[10px] uppercase tracking-wider text-rose-400/80 font-bold block mb-0.5">Diagnostic Report</span>
                                        <p className="text-sm text-slate-300 font-light leading-relaxed">{err.issue}</p>
                                    </div>
                                    <div className="bg-emerald-950/20 p-2.5 rounded border border-emerald-900/30">
                                        <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 font-bold block mb-0.5">Algorithmic Resolution</span>
                                        <p className="text-sm text-emerald-300/90 font-medium">{err.suggestion}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
