"use client";
import { useState } from "react";

import { useDriveTrainCalculator } from "@/hooks/useDriveTrainCalculator";
import { TechnicalDrawing } from "@/components/TechnicalDrawing";
import { TheorySection } from "@/components/TheorySection";
import { IEC_MOTORS } from "@/data/motorData";
import { GEAR_MODULES_ISO, GEAR_MATERIALS, APPLICATION_FACTORS } from "@/data/gearsData";
import { CalculatorInput } from "@/components/CalculatorInput";
import { UndercutDiagram, ServiceFactorDiagram } from "@/components/mechanical/EducationalAssets";
import { SaveButton } from "@/components/calculation/SaveButton";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function GearsPageClient({ dict, lang }: { dict: any, lang: string }) {
    const {
        selectedPower, setSelectedPower,
        selectedPoles, setSelectedPoles,
        motor,
        gearType, setGearType,
        gearModule, setGearModule,
        z1, setZ1,
        z2, setZ2,
        helixAngle, setHelixAngle,
        pressureAngle, setPressureAngle,
        faceWidth, setFaceWidth,
        materialName, setMaterialName,
        results,
        x1, setX1, x2, setX2,
        pinDia1, setPinDia1, pinDia2, setPinDia2,
        // YR Inputs
        loadClass, setLoadClass,
        dailyHours, setDailyHours,
        startsPerHour, setStartsPerHour,
        connectionType, setConnectionType,
    } = useDriveTrainCalculator();

    const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

    // ... (helpers remain same)
    const dist = (val: number) => unit === 'metric' ? `${val.toFixed(3)} mm` : `${(val / 25.4).toFixed(4)} in`;
    const force = (val: number) => unit === 'metric' ? `${val.toFixed(0)} N` : `${(val * 0.2248).toFixed(1)} lbf`;
    const stress = (val: number) => unit === 'metric' ? `${val.toFixed(0)} MPa` : `${(val * 145.038).toFixed(0)} psi`;
    const torque = (val: number) => unit === 'metric' ? `${val.toFixed(1)} Nm` : `${(val * 0.7376).toFixed(1)} lb-ft`;
    const [activeTab, setActiveTab] = useState<'design' | 'analysis'>('design');

    return (
        <main className="min-h-screen bg-[#0f1115] text-slate-300 font-sans selection:bg-brand-orange selection:text-white pb-20">
            {/* 1. HERO HEADER */}
            <header className="border-b border-slate-800 bg-[#0f1115] sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-brand-orange to-red-600 flex items-center justify-center text-white font-black text-xs shadow-[0_0_15px_rgba(249,115,22,0.5)]">DT</div>
                        <div>
                            <h1 className="text-sm font-bold text-white tracking-wider uppercase">DriveTrain <span className="text-brand-orange">Pro</span></h1>
                        </div>
                    </div>

                    {/* KPI BAR */}
                    <div className="hidden lg:flex items-center gap-8 text-xs font-mono">
                        <div className="flex flex-col items-end">
                            <span className="text-slate-500 uppercase text-[10px]">Ratio</span>
                            <span className="text-white font-bold">{results.ratio.toFixed(2)}:1</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-slate-500 uppercase text-[10px]">{dict.motor.torqueOut}</span>
                            <span className="text-ind-orange font-bold text-sm">{torque(results.outputTorque)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-slate-500 uppercase text-[10px]">Service Factor</span>
                            <span className={`font-bold text-sm ${results.requiredFs > 2 ? 'text-red-400' : 'text-emerald-400'}`}>{results.requiredFs.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-800/50 rounded p-1">
                            <button onClick={() => setUnit('metric')} className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${unit === 'metric' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-400'}`}>MM</button>
                            <button onClick={() => setUnit('imperial')} className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${unit === 'imperial' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-400'}`}>IN</button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COL: INPUTS & CONTEXT (3 Cols) */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Section: Prime Mover */}
                    <section className="relative group">
                        <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-slate-700 to-transparent opacity-50 rounded-full" />
                        <h2 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-500" />
                            {dict.driveTrain.primeMover}
                        </h2>

                        <div className="space-y-4">
                            <div className="p-4 bg-[#151921] rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                                <label className="label-tech text-slate-400 mb-2 block">{dict.motor.nominalPower}</label>
                                <div className="flex gap-2">
                                    <select
                                        className="bg-black/20 border border-slate-700 text-white text-sm rounded px-3 py-2 w-full focus:outline-none focus:border-brand-orange transition-colors"
                                        value={selectedPower}
                                        onChange={(e) => setSelectedPower(Number(e.target.value))}
                                    >
                                        {IEC_MOTORS.map(m => <option key={m.power} value={m.power}>{m.power} kW - {m.frame}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="p-4 bg-[#151921] rounded-xl border border-slate-800">
                                <label className="label-tech text-slate-400 mb-2 block">{dict.motor.speedPoles}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[2, 4, 6].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setSelectedPoles(p as any)}
                                            className={`py-2 text-xs font-bold rounded border transition-all ${selectedPoles === p
                                                ? 'bg-brand-orange/10 border-brand-orange text-brand-orange'
                                                : 'bg-black/20 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                                        >
                                            {p}P
                                        </button>
                                    ))}
                                </div>
                                <div className="text-right text-[10px] font-mono text-slate-500 mt-2">
                                    Sync: {motor.speed_4p} rpm
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section: Environment (YR) */}
                    <section className="relative">
                        <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-900 to-transparent opacity-50 rounded-full" />
                        <h2 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                            Conditions
                        </h2>

                        <div className="p-5 bg-gradient-to-br from-[#151921] to-[#0f1115] rounded-xl border border-slate-800 space-y-5">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Load Class</label>
                                    <span className="text-[9px] text-blue-400 bg-blue-950/30 px-1 rounded border border-blue-900/50">YR Std.</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                    {['U', 'M', 'H'].map((lc) => (
                                        <button
                                            key={lc}
                                            onClick={() => setLoadClass(lc as any)}
                                            className={`text-[10px] font-bold py-1.5 rounded transition-colors ${loadClass === lc ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                                        >
                                            {lc === 'U' ? 'Uniform' : lc === 'M' ? 'Moderate' : 'Heavy'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Hrs / Day</label>
                                    <select
                                        className="bg-black/20 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 w-full"
                                        value={dailyHours}
                                        onChange={(e) => setDailyHours(Number(e.target.value))}
                                    >
                                        <option value={2}>&lt; 3h</option>
                                        <option value={8}>3 - 10h</option>
                                        <option value={12}>&gt; 10h</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Starts/Hr</label>
                                    <input
                                        type="number"
                                        className="bg-black/20 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 w-full"
                                        value={startsPerHour}
                                        onChange={(e) => setStartsPerHour(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* Educational Feature: Service Factor */}
                            <div className="pt-2 border-t border-slate-800/50">
                                <div className="flex items-start gap-3">
                                    <div className="w-16 opacity-70">
                                        <ServiceFactorDiagram />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 leading-tight">
                                            High shock loads or frequent starts require a higher safety margin ($f_s$).
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>


                {/* CENTER COL: STAGE (5 Cols) */}
                <div className="lg:col-span-6 flex flex-col gap-6">

                    {/* VISUALIZATION CARD */}
                    <div className="relative aspect-[4/3] bg-[#0A0C10] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                        <div className="absolute top-4 left-4 z-10 flex gap-2">
                            <div className="px-3 py-1 bg-slate-900/80 backdrop-blur rounded border border-slate-700 text-[10px] text-slate-400 font-mono">
                                A = <span className="text-white font-bold">{results.a.toFixed(2)}</span> mm
                            </div>
                        </div>

                        {/* RENDER */}
                        <div className="absolute inset-0 flex items-center justify-center p-8">
                            <TechnicalDrawing mode="gear" activeField={null} data={{ z1, z2, module: gearModule, width: faceWidth, x1, x2, pressureAngle }} />
                        </div>

                        {/* FLOATING CONTROLS (Glassmorphism) */}
                        <div className="absolute bottom-6 left-6 right-6 bg-slate-900/60 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex justify-between text-xs mb-1 text-slate-300">
                                    <span>Pinion (Z1)</span>
                                    <span className="font-bold">{z1}</span>
                                </div>
                                <input type="range" min="10" max="100" value={z1} onChange={e => setZ1(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-orange" />
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="flex-1">
                                <div className="flex justify-between text-xs mb-1 text-slate-300">
                                    <span>Gear (Z2)</span>
                                    <span className="font-bold">{z2}</span>
                                </div>
                                <input type="range" min="10" max="200" value={z2} onChange={e => setZ2(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-tech-blue" />
                            </div>
                        </div>
                    </div>

                    {/* MAIN GEOMETRY CONFIG */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-[#151921] rounded-xl border border-slate-800">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-4">Base Geometry</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <label className="label-tech text-slate-400">Module (m)</label>
                                        <span className="text-xs font-mono text-slate-500">ISO</span>
                                    </div>
                                    <select
                                        className="input-tech-dark w-full font-mono font-bold text-lg"
                                        value={gearModule}
                                        onChange={(e) => setGearModule(Number(e.target.value))}
                                    >
                                        {GEAR_MODULES_ISO[0].modules.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <CalculatorInput
                                    label="Face Width (b)"
                                    unit="mm"
                                    value={faceWidth}
                                    onChange={(e) => setFaceWidth(Number(e.target.value))}
                                    className="bg-black/20 border-slate-700 text-white"
                                />
                            </div>
                        </div>

                        <div className="p-5 bg-[#151921] rounded-xl border border-slate-800 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-brand-orange/10 to-transparent rounded-bl-3xl" />
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-[10px] font-bold text-brand-orange uppercase">Refinement</h3>
                                <div className="text-[9px] px-1.5 py-0.5 rounded bg-brand-orange/20 text-brand-orange border border-brand-orange/30">ADVANCED</div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <CalculatorInput label="Shift (x1)" unit="" value={x1} onChange={(e) => setX1(Number(e.target.value))} className="bg-black/20 border-slate-700 text-white" />
                                    <CalculatorInput label="Shift (x2)" unit="" value={x2} onChange={(e) => setX2(Number(e.target.value))} className="bg-black/20 border-slate-700 text-white" />
                                </div>

                                {/* Educational Trigger */}
                                <div className="group relative cursor-help">
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Why use Profile Shift?
                                    </div>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-800 rounded-lg shadow-xl border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                        <UndercutDiagram />
                                        <p className="mt-2 text-[9px] text-slate-400">
                                            Shift (x) prevents undercut in small pinions (z{'<'}17) and strengthens the tooth root.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* RIGHT COL: ANALYSIS (4 Cols) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* TRAFFIC LIGHTS */}
                    <div className="bg-[#151921] rounded-2xl border border-slate-800 p-1">
                        <div className="grid grid-cols-2 divide-x divide-slate-800">
                            <div className="p-4 flex flex-col items-center text-center">
                                <div className={`w-3 h-3 rounded-full mb-2 shadow-[0_0_10px_currentColor] ${results.SF_bending > 1.4 ? 'bg-emerald-500 text-emerald-500' : 'bg-red-500 text-red-500'}`} />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Bending</span>
                                <span className="text-xl font-black text-white mt-1">{results.SF_bending.toFixed(2)}</span>
                                <span className="text-[9px] text-slate-600 mt-1">Safety Factor</span>
                            </div>
                            <div className="p-4 flex flex-col items-center text-center">
                                <div className={`w-3 h-3 rounded-full mb-2 shadow-[0_0_10px_currentColor] ${results.SF_contact > 1.0 ? 'bg-emerald-500 text-emerald-500' : 'bg-red-500 text-red-500'}`} />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Contact</span>
                                <span className="text-xl font-black text-white mt-1">{results.SF_contact.toFixed(2)}</span>
                                <span className="text-[9px] text-slate-600 mt-1">Safety Factor</span>
                            </div>
                        </div>
                    </div>

                    {/* DETAILED SPECS LIST */}
                    <div className="bg-[#151921] rounded-xl border border-slate-800 p-5">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Geometry Output</h3>
                        <div className="space-y-3 font-mono text-xs">
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                <span className="text-slate-500">Center Dist (a)</span>
                                <span className="text-white bg-slate-800 px-2 py-0.5 rounded">{dist(results.a)}</span>
                            </div>
                            <div className="flex justify-between items-center text-brand-orange">
                                <span>Tip Dia (da1)</span>
                                <span>{dist(results.da1)}</span>
                            </div>
                            <div className="flex justify-between items-center text-tech-blue">
                                <span>Tip Dia (da2)</span>
                                <span>{dist(results.da2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600 pt-2">
                                <span>Root Dia (df1)</span>
                                <span>{dist(results.df1)}</span>
                            </div>
                        </div>
                    </div>

                    {/* FORCES */}
                    <div className="bg-[#151921] rounded-xl border border-slate-800 p-5">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Load Analysis</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                    <span>Tangential Force</span>
                                    <span>{force(results.Ft)}</span>
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-slate-500 h-full rounded-full" style={{ width: '40%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                    <span>Radial (Bearing)</span>
                                    <span className="text-red-400">{force(results.Fr)}</span>
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-red-500 h-full rounded-full" style={{ width: '25%' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* FOOTER */}
            <div className="fixed bottom-0 left-0 right-0 h-6 bg-[#0A0C10] border-t border-slate-800 flex items-center px-4 text-[10px] text-slate-600 justify-between z-50">
                <div className="flex items-center gap-4">
                    <span>READY</span>
                    <span className="text-emerald-500">CALCULATION SYNCED</span>
                </div>
                <div className="font-mono">
                    ALUCALC OS v2.1
                </div>
            </div>

        </main>
    );
}
