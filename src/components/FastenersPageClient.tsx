"use client";
import { useState } from "react";

import { useFastenerCalculator } from "@/hooks/useFastenerCalculator";
import { TechnicalDrawing } from "@/components/TechnicalDrawing";
import { TheorySection } from "@/components/TheorySection";

export default function FastenersPageClient({ lang, dict }: { lang: string, dict: any }) {
    const {
        standard, setStandard,
        size, setSize,
        availableSizes,
        customParams, setCustomParams,
        results,
        manualUnit, setManualUnit
    } = useFastenerCalculator();

    // Local state for 3D visualization length, default 50mm
    const [length, setLength] = useState(50);
    // New: Bolt vs Nut Toggle
    const [fastenerType, setFastenerType] = useState<'bolt' | 'nut'>('bolt');

    return (
        <main className="min-h-screen bg-blueprint-grid flex flex-col items-center justify-center p-4 lg:p-12 font-sans overflow-hidden">

            {/* Header */}
            <header className="w-full max-w-6xl flex justify-between items-center mb-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-700 dark:bg-slate-600 rounded flex items-center justify-center text-white font-black text-xl">M</div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">{dict.fastener.title}</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{dict.fastener.subtitle}</p>
                    </div>
                </div>

                {/* Bolt / Nut Switcher */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                        onClick={() => setFastenerType('bolt')}
                        className={`px-6 py-2 text-sm font-bold uppercase rounded-md transition-all ${fastenerType === 'bolt' ? 'bg-brand-orange text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {dict.fastener.types?.bolt || 'CIVATA'}
                    </button>
                    <button
                        onClick={() => setFastenerType('nut')}
                        className={`px-6 py-2 text-sm font-bold uppercase rounded-md transition-all ${fastenerType === 'nut' ? 'bg-brand-orange text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {dict.fastener.types?.nut || 'SOMUN'}
                    </button>
                </div>
            </header>

            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT: INPUTS */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Standard Tabs - Only show if relevant, keeping global for now */}
                    <div className="flex flex-wrap gap-2 p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
                        {(['ISO Metric', 'ISO Metric Fine', 'UNC', 'UNF', 'BSPP (G)', 'BSPT (R)', 'NPT', 'Trapezoidal (Tr)'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setStandard(s as any)}
                                className={`flex-1 min-w-[80px] py-2 text-[10px] font-bold uppercase rounded-md transition-all ${standard === s ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                {s.replace('ISO ', '')}
                            </button>
                        ))}
                    </div>

                    {/* Unit Toggle */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
                        <button onClick={() => setManualUnit('mm')} className={`px-4 py-1 text-xs font-bold rounded ${manualUnit === 'mm' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'}`}>Metric (mm)</button>
                        <button onClick={() => setManualUnit('inch')} className={`px-4 py-1 text-xs font-bold rounded ${manualUnit === 'inch' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'}`}>Imperial (inch)</button>
                    </div>

                    <div className="card-tech">
                        <label className="field-label mb-2">{dict.fastener.inputs.size}</label>
                        <select
                            className="input-tech font-bold"
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                        >
                            {availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="mt-2 text-xs text-slate-400 text-right font-mono">
                            {results.displayPitch}
                        </div>
                    </div>

                    <div className="card-tech">
                        <label className="field-label mb-2">{dict.common?.length || 'Length'} ({manualUnit === 'inch' ? 'in' : 'mm'})</label>
                        <input
                            type="number"
                            className="input-tech font-bold"
                            value={length}
                            onChange={(e) => setLength(Number(e.target.value))}
                        />
                    </div>

                    {/* Quick Results List */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="card-tech border-blue-100 dark:border-blue-900/30 flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10">
                            <div>
                                <div className="field-label text-blue-300 dark:text-blue-700">{dict.fastener.results.tapDrill}</div>
                                <div className="text-2xl font-mono font-bold text-brand-blue dark:text-blue-400">{results.tapDrill}</div>
                            </div>
                            <span className="text-xs font-bold text-slate-300 dark:text-slate-600">{results.unit}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex justify-between items-center">
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{dict.fastener.results.clearingDrill}</div>
                                <div className="text-2xl font-mono font-bold text-slate-700 dark:text-slate-300">{results.clearance}</div>
                            </div>
                            <span className="text-xs font-bold text-slate-300 dark:text-slate-600">{results.unit}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30 shadow-sm flex justify-between items-center">
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{dict.fastener.results.tensileArea}</div>
                                <div className="text-2xl font-mono font-bold text-orange-600 dark:text-orange-400">{results.stressArea}</div>
                            </div>
                            <span className="text-xs font-bold text-slate-300 dark:text-slate-600">{results.unit}²</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT: VISUALIZATION */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl h-[500px] relative overflow-hidden flex items-center justify-center">
                        <TechnicalDrawing mode="fastener" activeField={null} data={{ ...results, diameter: results.majorDia, length: length, type: fastenerType }} />
                        <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-2 shadow-sm min-w-[200px]">
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-1">
                                <span className="text-slate-400">{dict.fastener.results.majorDia}</span>
                                <span className="dark:text-slate-200">{results.majorDia.toFixed(3)} {results.unit}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-1">
                                <span className="text-slate-400">{dict.fastener.inputs.pitch}</span>
                                <span className="dark:text-slate-200">{results.displayPitch}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-1">
                                <span className="text-slate-400">{dict.fastener.results.tapDrill}</span>
                                <span className="text-blue-600 dark:text-blue-400 font-bold">{results.tapDrill} {results.unit}</span>
                            </div>
                            <div className="flex justify-between pt-1">
                                <span className="text-slate-400">{dict.fastener.results.tensileArea}</span>
                                <span className="text-orange-600 dark:text-orange-400 font-bold">{results.stressArea} {results.unit}²</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <TheorySection title="Thread Mechanics Guide">
                <p className="mb-4">
                    The <strong>Tensile Stress Area (As)</strong> is the effective cross-sectional area of a threaded bolt used to calculate its failure load under tension.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2">Metric Formula (ISO)</h4>
                        <code className="block bg-slate-100 p-2 rounded text-sm mb-2">As = 0.7854 × (d - 0.9382 × P)²</code>
                        <p className="text-sm">Where <strong>d</strong> is nominal diameter and <strong>P</strong> is pitch.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2">Imperial Formula (UNC/UNF)</h4>
                        <code className="block bg-slate-100 p-2 rounded text-sm mb-2">As = 0.7854 × (d - 0.9743 / TPI)²</code>
                        <p className="text-sm">Where <strong>TPI</strong> is Threads Per Inch.</p>
                    </div>
                </div>
            </TheorySection>
        </main >
    );
}
