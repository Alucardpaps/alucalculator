"use client";

import { useState } from "react";
import { useFitCalculator, fitTypes } from "@/hooks/useFitCalculator";
import { CalculatorInput } from "@/components/CalculatorInput";
import { TechnicalDrawing } from "@/components/TechnicalDrawing";

export default function FitsPageClient({ dict, lang }: { dict: any, lang: string }) {
    const {
        diameter, setDiameter,
        selectedFitCode, setSelectedFitCode,
        results
    } = useFitCalculator();

    const [activeField, setActiveField] = useState<string | null>(null);

    // Helper to find current fit type for visualization color
    const currentFitType = fitTypes.find(f => f.code === selectedFitCode)?.type as 'clearance' | 'transition' | 'interference';

    return (
        <main className="min-h-screen bg-blueprint-grid flex flex-col items-center justify-center p-4 lg:p-12 font-sans">
            {/* Header */}
            <header className="w-full max-w-6xl flex justify-between items-center mb-8 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-tech-blue rounded flex items-center justify-center text-white font-black text-xl">F</div>
                    <div>
                        <h1 className="text-xl font-bold text-tech-blue tracking-tight uppercase">{dict.fit.title}</h1>
                        <p className="text-xs text-slate-500">{dict.fit.subtitle}</p>
                    </div>
                </div>
                <div className="text-sm font-bold text-slate-400">ISO 286-1</div>
            </header>

            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT: INPUTS */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="card-tech">
                        <h2 className="text-lg font-bold text-tech-blue mb-4 border-b border-slate-100 pb-2">{dict.common.inputs}</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <CalculatorInput
                                label={dict.fit.inputs.nominalSize}
                                unit="mm"
                                value={diameter}
                                onChange={(e) => setDiameter(Number(e.target.value))}
                                onFocus={() => setActiveField('nominalSize')}
                                onBlur={() => setActiveField(null)}
                                active={activeField === 'nominalSize'}
                            />
                        </div>

                        <label className="field-label">{dict.fit.results.fitType}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {fitTypes.map((ft) => (
                                <button
                                    key={ft.code}
                                    onClick={() => setSelectedFitCode(ft.code)}
                                    className={`p-3 rounded border text-left transition-all ${selectedFitCode === ft.code
                                        ? 'border-tech-blue bg-blue-50 ring-1 ring-tech-blue'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="font-bold text-tech-blue">{ft.code}</div>
                                    <div className="text-[10px] text-slate-500 uppercase font-bold mt-1">
                                        {dict.fit.results[ft.type]}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tolerance Table (Mini) */}
                    <div className="card-tech bg-slate-50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-slate-600 uppercase">{dict.common.toleranceValues} (μm)</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded border border-slate-200 text-center">
                                <div className="text-xs text-slate-400 uppercase font-bold mb-1">{dict.common.hole}</div>
                                <div className="text-xl font-mono text-tech-blue font-bold">
                                    +{results.holeUpper} / +{results.holeLower}
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded border border-slate-200 text-center">
                                <div className="text-xs text-slate-400 uppercase font-bold mb-1">{dict.common.shaft}</div>
                                <div className="text-xl font-mono text-slate-700 font-bold">
                                    +{results.shaftUpper} / +{results.shaftLower}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: VISUALIZATION & RESULTS */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Visualizer */}
                    <div className="bg-white border-2 border-slate-200 rounded-xl h-64 relative overflow-hidden flex items-center justify-center">
                        <div className="absolute top-3 left-4 z-10">
                            <span className={`text-xs font-bold px-2 py-1 rounded text-white ${results.isInterference ? 'bg-error' : 'bg-success'
                                }`}>
                                {results.isInterference ? dict.fit.results.interference : dict.fit.results.clearance}
                            </span>
                        </div>
                        <TechnicalDrawing mode="fit" fitType={currentFitType} activeField={activeField} />
                    </div>

                    {/* Result Dashboard */}
                    <div className="bg-tech-blue text-white rounded-xl p-8 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')]"></div>

                        <div className="relative z-10">
                            <div className="mb-6">
                                <div className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">
                                    {results.isInterference ? dict.fit.results.interferenceAmount : dict.fit.results.clearanceAmount}
                                </div>
                                <div className="flex items-baseline gap-4">
                                    <div>
                                        <span className="text-sm text-blue-300 mr-2">{dict.common.min.toUpperCase()}</span>
                                        <span className="text-4xl font-mono font-bold tracking-tighter">
                                            {results.isInterference ? results.minInterference : results.minClearance}
                                        </span>
                                        <span className="text-sm ml-1 text-blue-300">μm</span>
                                    </div>
                                    <div className="h-8 w-px bg-blue-500/50"></div>
                                    <div>
                                        <span className="text-sm text-blue-300 mr-2">{dict.common.max.toUpperCase()}</span>
                                        <span className="text-4xl font-mono font-bold tracking-tighter">
                                            {results.isInterference ? results.maxInterference : results.maxClearance}
                                        </span>
                                        <span className="text-sm ml-1 text-blue-300">μm</span>
                                    </div>
                                </div>
                            </div>

                            {/* Force Calc Preview */}
                            {results.isInterference && (
                                <div className="pt-6 border-t border-blue-500/30">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-blue-100">{dict.common.force}</span>
                                        <span className="font-mono text-xl font-bold text-ind-orange">{results.force.toFixed(2)} kN</span>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
