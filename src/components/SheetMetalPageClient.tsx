"use client";

import { useSheetMetalCalculator } from "@/hooks/useSheetMetalCalculator";
import { useState } from "react";
import { CalculatorInput } from "@/components/CalculatorInput";
import { TechnicalDrawing } from "@/components/TechnicalDrawing";
import { TheorySection } from "@/components/TheorySection";
import { Layers } from 'lucide-react';

export default function SheetMetalPageClient({ dict, lang }: { dict: any, lang: string }) {
    const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

    // We use the hook for the core calculation logic, but we might need to handle unit wrapping
    // Since the hook is likely pure metric internally, we will feed it metric values
    const {
        materialIdx, setMaterialIdx,
        thickness, setThickness,
        angle, setAngle,
        radius, setRadius,
        length, setLength,
        vOpening, setVOpening,
        flangeA, setFlangeA,
        flangeB, setFlangeB,
        results,
        materials
    } = useSheetMetalCalculator();

    // Helpers to convert display values <-> hook values
    const toImp = (mm: number) => parseFloat((mm / 25.4).toFixed(3));
    const toMet = (inch: number) => inch * 25.4;

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-12 font-sans overflow-hidden">
            {/* Header */}
            <header className="w-full max-w-6xl flex justify-between items-center mb-8 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white font-black text-xl"><Layers size={20} /></div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase">{dict.sheetMetal.title}</h1>
                        <p className="text-xs text-slate-500">{dict.sheetMetal.subtitle}</p>
                    </div>
                </div>
                <div className="flex bg-slate-200 rounded p-1">
                    <button onClick={() => setUnit('metric')} className={`px-3 py-1 text-xs font-bold rounded ${unit === 'metric' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>METRIC</button>
                    <button onClick={() => setUnit('imperial')} className={`px-3 py-1 text-xs font-bold rounded ${unit === 'imperial' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>IMPERIAL</button>
                </div>
            </header>

            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT: INPUTS */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="card-tech">
                        {/* Material Select */}
                        <div className="mb-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">{dict.sheetMetal.inputs.material}</label>
                            <select
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono text-sm"
                                value={materialIdx}
                                onChange={(e) => setMaterialIdx(Number(e.target.value))}
                            >
                                {materials.map((m, i) => (
                                    <option key={i} value={i}>{m.name} (yield={m.yield} MPa)</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <CalculatorInput
                                label={dict.sheetMetal.inputs.thickness}
                                unit={unit === 'metric' ? "mm" : "in"}
                                value={unit === 'metric' ? thickness : toImp(thickness)}
                                onChange={(e) => unit === 'metric' ? setThickness(Number(e.target.value)) : setThickness(toMet(Number(e.target.value)))}
                            />
                            <CalculatorInput label={dict.sheetMetal.inputs.angle} unit="deg" value={angle} onChange={(e) => setAngle(Number(e.target.value))} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <CalculatorInput
                                label={dict.sheetMetal.inputs.radius}
                                unit={unit === 'metric' ? "mm" : "in"}
                                value={unit === 'metric' ? radius : toImp(radius)}
                                onChange={(e) => unit === 'metric' ? setRadius(Number(e.target.value)) : setRadius(toMet(Number(e.target.value)))}
                            />
                            <CalculatorInput
                                label={dict.sheetMetal.inputs.length}
                                unit={unit === 'metric' ? "mm" : "in"}
                                value={unit === 'metric' ? length : toImp(length)}
                                onChange={(e) => unit === 'metric' ? setLength(Number(e.target.value)) : setLength(toMet(Number(e.target.value)))}
                            />
                        </div>

                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-500 uppercase">Machine V-Die</span>
                                <span className="text-[10px] text-blue-500">Rec: {unit === 'metric' ? `${results.recV}mm` : `${toImp(results.recV)}"`}</span>
                            </div>
                            <CalculatorInput
                                label={dict.sheetMetal.inputs.vOpening}
                                unit={unit === 'metric' ? "mm" : "in"}
                                value={unit === 'metric' ? vOpening : toImp(vOpening)}
                                onChange={(e) => unit === 'metric' ? setVOpening(Number(e.target.value)) : setVOpening(toMet(Number(e.target.value)))}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <CalculatorInput
                                label={dict.sheetMetal.inputs.flange1}
                                unit={unit === 'metric' ? "mm" : "in"}
                                value={unit === 'metric' ? flangeA : toImp(flangeA)}
                                onChange={(e) => unit === 'metric' ? setFlangeA(Number(e.target.value)) : setFlangeA(toMet(Number(e.target.value)))}
                            />
                            <CalculatorInput
                                label={dict.sheetMetal.inputs.flange2}
                                unit={unit === 'metric' ? "mm" : "in"}
                                value={unit === 'metric' ? flangeB : toImp(flangeB)}
                                onChange={(e) => unit === 'metric' ? setFlangeB(Number(e.target.value)) : setFlangeB(toMet(Number(e.target.value)))}
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT: RESULTS */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Visualizer */}
                    <div className="bg-white border-2 border-slate-200 rounded-xl h-48 relative overflow-hidden flex items-center justify-center">
                        <TechnicalDrawing mode="sheetMetal" data={{ angle }} activeField={null} />
                    </div>

                    {/* Result Dashboard */}
                    <div className="bg-gradient-to-br from-slate-900 to-blue-900 text-white rounded-xl p-6 shadow-xl relative overflow-hidden">

                        {/* Tonnage */}
                        <div className="mb-6 text-center">
                            <div className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-1">{dict.sheetMetal.results.force}</div>
                            <div className="text-5xl font-black">
                                {unit === 'metric' ? results.forceTon.toFixed(1) : (results.forceTon * 1.102).toFixed(1)}
                                <span className="text-xl font-medium text-slate-400"> {unit === 'metric' ? 'ton' : 'US ton'}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">Air Bending / {unit === 'metric' ? `${length}mm` : `${toImp(length)}"`}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                            <div className="bg-white/5 p-3 rounded-lg">
                                <div className="text-blue-300 text-[10px] uppercase mb-1">{dict.sheetMetal.results.flatLength}</div>
                                <div className="font-mono text-xl font-bold">
                                    {unit === 'metric' ? `${results.flatLength.toFixed(1)} mm` : `${toImp(results.flatLength).toFixed(2)}"`}
                                </div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-lg">
                                <div className="text-blue-300 text-[10px] uppercase mb-1">Bend Ded (BD)</div>
                                <div className="font-mono text-xl font-bold">
                                    {unit === 'metric' ? `${results.BD.toFixed(2)} mm` : `${toImp(results.BD).toFixed(3)}"`}
                                </div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-lg">
                                <div className="text-blue-300 text-[10px] uppercase mb-1">K-Factor</div>
                                <div className="font-mono text-xl font-bold">{results.K}</div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-lg">
                                <div className="text-blue-300 text-[10px] uppercase mb-1">Bend Allow (BA)</div>
                                <div className="font-mono text-xl font-bold">
                                    {unit === 'metric' ? `${results.BA.toFixed(2)} mm` : `${toImp(results.BA).toFixed(3)}"`}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <TheorySection title="Bend Allowance Theory">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2">K-Factor</h4>
                        <p className="text-sm text-slate-600 mb-2">
                            The ratio of the neutral axis to the material thickness.
                        </p>
                        <code className="block bg-slate-100 p-2 rounded text-sm mb-2">k = t / T</code>
                        <p className="text-xs text-slate-500">Typically 0.33 for Air Bending (R {'<'} 2T) and 0.50 for R {'>'} 2T.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2">Bend Allowance (BA)</h4>
                        <p className="text-sm text-slate-600 mb-2">
                            The arc length of the neutral axis in the bend region.
                        </p>
                        <code className="block bg-slate-100 p-2 rounded text-xs mb-2">BA = A × (π/180) × (R + K×T)</code>
                        <p className="text-xs text-slate-500">A = Bend Angle (deg), R = Inside Radius, T = Thickness.</p>
                    </div>
                </div>
            </TheorySection>
        </main>
    );
}
