/**
 * modules/mechanical/SheetMetal/index.tsx
 * 
 * Main UI Component for the Sheet Metal advanced module.
 * Adheres to the Project Phoenix dark UI and minimalist UX guidelines.
 */

import React, { useEffect } from 'react';
import { useSheetMetalStore } from './store';
import { WindowAPI } from '@/engine/os/WindowAPI';
import { Layers, FileDown, RotateCcw } from 'lucide-react';
import { generateSheetMetalPDF } from './pdf';

interface Props {
    windowId: string;
}

export default function SheetMetalModule({ windowId }: Props) {
    const { input, result, metadata, isCalculating, setInput, calculate, reset } = useSheetMetalStore();

    // Auto-calculate on mount if needed or wait for user
    useEffect(() => {
        calculate();
    }, []);

    const handleExport = async () => {
        if (!metadata || !result) return;
        await generateSheetMetalPDF(input, result, metadata);
    };

    return (
        <div className="flex flex-col h-full bg-[var(--color-os-canvas)] text-slate-200 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <Layers className="text-blue-400 w-6 h-6" />
                    <h2 className="text-xl font-bold tracking-tight">Sheet Metal Advanced</h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={reset}
                        className="p-2 hover:bg-slate-800 rounded-md transition-colors"
                        title="Reset"
                    >
                        <RotateCcw className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={!result}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-md font-medium text-sm transition-colors disabled:opacity-50"
                    >
                        <FileDown className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inputs Section */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5 backdrop-blur-sm">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Parameters</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Thickness (mm)</label>
                            <input
                                type="number"
                                value={input.thickness}
                                onChange={e => { setInput({ thickness: Number(e.target.value) }); calculate(); }}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                step="0.1"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Bend Angle (deg)</label>
                            <input
                                type="number"
                                value={input.bendAngle}
                                onChange={e => { setInput({ bendAngle: Number(e.target.value) }); calculate(); }}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Inner Radius (mm)</label>
                            <input
                                type="number"
                                value={input.innerRadius}
                                onChange={e => { setInput({ innerRadius: Number(e.target.value) }); calculate(); }}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                step="0.1"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">K-Factor</label>
                            <input
                                type="number"
                                value={input.kFactor}
                                onChange={e => { setInput({ kFactor: Number(e.target.value) }); calculate(); }}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                step="0.01"
                            />
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="flex flex-col gap-4">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5 backdrop-blur-sm flex-1">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Results</h3>

                        {result ? (
                            <div className="space-y-6">
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">Bend Allowance (BA)</div>
                                    <div className="text-3xl font-mono text-emerald-400">{result.bendAllowance} <span className="text-sm text-slate-500">mm</span></div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">Bend Deduction (BD)</div>
                                    <div className="text-3xl font-mono text-blue-400">{result.bendDeduction} <span className="text-sm text-slate-500">mm</span></div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">Outside Setback (OSSB)</div>
                                    <div className="text-3xl font-mono text-amber-400">{result.outsideSetback} <span className="text-sm text-slate-500">mm</span></div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500 italic">Enter parameters to calculate.</div>
                        )}
                    </div>

                    {/* Engine Metadata Panel */}
                    {metadata && (
                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs font-mono text-slate-500">
                            <div className="flex justify-between mb-2">
                                <span>Engine: {metadata.engineVersion}</span>
                                <span>Status: <span className={metadata.validationStatus === 'success' ? 'text-emerald-500' : 'text-amber-500'}>{metadata.validationStatus.toUpperCase()}</span></span>
                            </div>
                            <div className="truncate">Hash: {metadata.calculationHash}</div>
                            {metadata.warnings && metadata.warnings.length > 0 && (
                                <div className="mt-2 text-amber-500">
                                    {metadata.warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
