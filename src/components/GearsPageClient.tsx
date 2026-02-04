"use client";
import { useState } from "react";

import { useDriveTrainCalculator } from "@/hooks/useDriveTrainCalculator";
import { TechnicalDrawing } from "@/components/TechnicalDrawing";
import { TheorySection } from "@/components/TheorySection";
import { IEC_MOTORS } from "@/data/motorData";
import { GEAR_MODULES_ISO, GEAR_MATERIALS, APPLICATION_FACTORS } from "@/data/gearsData";
import { CalculatorInput } from "@/components/CalculatorInput";

export default function GearsPageClient({ dict, lang }: { dict: any, lang: string }) {
    const {
        selectedPower, setSelectedPower,
        selectedPoles, setSelectedPoles,
        motor,
        applicationName, setApplicationName,
        gearType, setGearType,
        module, setModule,
        z1, setZ1,
        z2, setZ2,
        helixAngle, setHelixAngle,
        pressureAngle, setPressureAngle,
        faceWidth, setFaceWidth,
        materialName, setMaterialName,
        results,
        x1, setX1, x2, setX2,
        pinDia1, setPinDia1, pinDia2, setPinDia2
    } = useDriveTrainCalculator();

    const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

    // Helper for display
    const dist = (val: number) => unit === 'metric' ? `${val.toFixed(3)} mm` : `${(val / 25.4).toFixed(4)} in`;
    const force = (val: number) => unit === 'metric' ? `${val.toFixed(0)} N` : `${(val * 0.2248).toFixed(1)} lbf`;
    const stress = (val: number) => unit === 'metric' ? `${val.toFixed(0)} MPa` : `${(val * 145.038).toFixed(0)} psi`;
    const torque = (val: number) => unit === 'metric' ? `${val.toFixed(1)} Nm` : `${(val * 0.7376).toFixed(1)} lb-ft`;

    return (
        <main className="min-h-screen bg-blueprint-grid flex flex-col items-center p-4 lg:p-8 font-sans">

            {/* Header */}
            <header className="w-full max-w-7xl flex flex-col lg:flex-row justify-between items-center mb-8 bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 mb-4 lg:mb-0">
                    <div className="w-12 h-12 bg-brand-orange rounded-lg flex items-center justify-center text-white font-black text-2xl shadow-lg">DT</div>
                    <div>
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 tracking-tight uppercase">{dict.driveTrain.title}</h1>
                        <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">{dict.driveTrain.subtitle}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex bg-slate-200 rounded p-1 h-fit self-center mr-4">
                        <button onClick={() => setUnit('metric')} className={`px-3 py-1 text-xs font-bold rounded ${unit === 'metric' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
                            {dict.common?.metric?.toUpperCase() ?? (lang === 'tr' ? 'METRİK' : 'METRIC')}
                        </button>
                        <button onClick={() => setUnit('imperial')} className={`px-3 py-1 text-xs font-bold rounded ${unit === 'imperial' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
                            {dict.common?.imperial?.toUpperCase() ?? (lang === 'tr' ? 'İNÇ' : 'IMPERIAL')}
                        </button>
                    </div>
                    <div className="bg-slate-100 rounded-lg p-2 text-center min-w-[100px]">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{dict.motor.inputPower}</div>
                        <div className="text-lg font-bold text-slate-700">{selectedPower} kW</div>
                    </div>
                    <div className="bg-slate-100 rounded-lg p-2 text-center min-w-[100px]">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{dict.motor.ratio}</div>
                        <div className="text-lg font-bold text-tech-blue">{results.ratio.toFixed(2)}:1</div>
                    </div>
                    <div className="bg-slate-100 rounded-lg p-2 text-center min-w-[100px]">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{dict.motor.torqueOut}</div>
                        <div className="text-lg font-bold text-ind-orange">{torque(results.outputTorque)}</div>
                    </div>
                </div>
            </header>

            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* COL 1: MOTOR & APPLICATION */}
                <div className="lg:col-span-3 space-y-6">
                    {/* MOTOR SECTION */}
                    <div className="card-tech shadow-md border-l-4 border-l-slate-800">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                            {dict.driveTrain.primeMover}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="label-tech">{dict.motor.nominalPower}</label>
                                <select
                                    className="input-tech text-lg"
                                    value={selectedPower}
                                    onChange={(e) => setSelectedPower(Number(e.target.value))}
                                >
                                    {IEC_MOTORS.map(m => (
                                        <option key={m.power} value={m.power}>{m.power} kW ({m.frame})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="label-tech">{dict.motor.speedPoles}</label>
                                <div className="flex gap-1 bg-slate-100 p-1 rounded-md">
                                    {[2, 4, 6].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setSelectedPoles(p as any)}
                                            className={`flex-1 py-1 text-xs font-bold rounded ${selectedPoles === p ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}
                                        >
                                            {p}P
                                        </button>
                                    ))}
                                </div>
                                <div className="text-right text-xs font-mono text-slate-400 mt-1">
                                    {motor.speed_4p} rpm @ 50Hz
                                </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded border border-slate-100">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-500">{dict.motor.nominalTorque}</span>
                                    <span className="font-bold">{results.motorTorque.toFixed(1)} Nm</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">{dict.motor.efficiency}</span>
                                    <span className="font-bold text-green-600">{motor.efficiency}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* APPLICATION SECTION */}
                    <div className="card-tech shadow-md border-l-4 border-l-slate-400">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">
                            {dict.driveTrain.application}
                        </h2>
                        <div>
                            <label className="label-tech">{dict.safety.serviceFactor}</label>
                            <select
                                className="input-tech text-sm"
                                value={applicationName}
                                onChange={(e) => setApplicationName(e.target.value)}
                            >
                                {APPLICATION_FACTORS.map(a => (
                                    <option key={a.name} value={a.name}>{a.name} (KA {a.Ka})</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-slate-400 mt-2 leading-tight">
                                {APPLICATION_FACTORS.find(a => a.name === applicationName)?.desc}
                            </p>
                        </div>
                    </div>
                </div>

                {/* COL 2: GEARBOX DESIGN */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="card-tech h-full shadow-lg border-t-4 border-t-tech-blue">
                        <h2 className="text-sm font-bold text-tech-blue uppercase tracking-widest mb-4 flex items-center justify-between">
                            <span>{dict.driveTrain.transmission}</span>
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">{dict.gear.inputs.module} {module}</span>
                        </h2>

                        <div className="mb-6 flex justify-center bg-slate-50 rounded-xl border border-slate-100 py-8">
                            {/* Reusing Gear Viz but we should update it to accept new props if needed or just generic */}
                            <TechnicalDrawing mode="gear" activeField={null} data={{ z1, z2, module, width: faceWidth }} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <CalculatorInput label={dict.manufacturing.pinion} unit="" value={z1} onChange={(e) => setZ1(Number(e.target.value))} />
                            <CalculatorInput label={dict.manufacturing.gear} unit="" value={z2} onChange={(e) => setZ2(Number(e.target.value))} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="label-tech">{dict.gear.inputs.module}</label>
                                <select
                                    className="input-tech font-mono font-bold"
                                    value={module}
                                    onChange={(e) => setModule(Number(e.target.value))}
                                >
                                    {GEAR_MODULES_ISO[0].modules.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <CalculatorInput
                                label={dict.gear.inputs.faceWidth}
                                unit={unit === 'metric' ? "mm" : "in"}
                                value={unit === 'metric' ? faceWidth : parseFloat((faceWidth / 25.4).toFixed(3))}
                                onChange={(e) => unit === 'metric' ? setFaceWidth(Number(e.target.value)) : setFaceWidth(Number(e.target.value) * 25.4)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <CalculatorInput label={dict.gear.inputs.helixAngle} unit="deg" value={helixAngle} onChange={(e) => setHelixAngle(Number(e.target.value))} />
                            <div>
                                <label className="label-tech">{dict.sheetMetal.inputs.material}</label>
                                <select
                                    className="input-tech text-xs"
                                    value={materialName}
                                    onChange={(e) => setMaterialName(e.target.value)}
                                >
                                    {GEAR_MATERIALS.map(m => (
                                        <option key={m.name} value={m.name}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* NEW: Manufacturing Section (Profile Shift) */}
                        <div className="border-t border-slate-100 pt-4 mb-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{dict.manufacturing.profileMod}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <CalculatorInput label={`${dict.manufacturing.shiftCoeff} (x1)`} unit="" value={x1} onChange={(e) => setX1(Number(e.target.value))} />
                                <CalculatorInput label={`${dict.manufacturing.shiftCoeff} (x2)`} unit="" value={x2} onChange={(e) => setX2(Number(e.target.value))} />
                            </div>
                        </div>

                        <div className="bg-slate-100 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-slate-500 text-xs">{dict.common.centerDist || 'Center Dist'}</div>
                                <div className="font-bold text-slate-800">{dist(results.a)}</div>
                            </div>
                            <div>
                                <div className="text-slate-500 text-xs">{dict.common.outputSpeed || 'Output Speed'}</div>
                                <div className="font-bold text-slate-800">{results.outputSpeed.toFixed(0)} rpm</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COL 3: ANALYSIS */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="card-tech shadow-md border-r-4 border-r-ind-orange h-full flex flex-col gap-6">
                        {/* 4A. MANUFACTURING DATA */}
                        <div className="">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 border-b border-orange-100 pb-2 flex items-center gap-2">
                                {dict.driveTrain.manufacturing}
                            </h2>
                            <div className="bg-surface-50 dark:bg-surface-800 p-4 rounded-xl border border-surface-100 dark:border-surface-700 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="field-label mb-1 text-[9px]">{dict.manufacturing.checkPin} (Z1)</label>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded px-2 py-1 text-sm font-bold font-mono text-surface-900 dark:text-surface-100"
                                            value={pinDia1}
                                            onChange={(e) => setPinDia1(Number(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="field-label mb-1 text-[9px]">{dict.manufacturing.checkPin} (Z2)</label>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded px-2 py-1 text-sm font-bold font-mono text-surface-900 dark:text-surface-100"
                                            value={pinDia2}
                                            onChange={(e) => setPinDia2(Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <div className="col-span-2 field-label border-b border-surface-200 dark:border-surface-700 pb-1 mt-2">{dict.manufacturing.overPins}</div>
                                    <div className="flex justify-between"><span className="text-surface-600 dark:text-surface-400 font-bold">{dict.manufacturing.pinion}:</span> <span className="font-mono text-surface-900 dark:text-surface-200">{dist(results.M1)}</span></div>
                                    <div className="flex justify-between"><span className="text-surface-600 dark:text-surface-400 font-bold">{dict.manufacturing.gear}:</span> <span className="font-mono text-surface-900 dark:text-surface-200">{dist(results.M2)}</span></div>

                                    <div className="col-span-2 field-label border-b border-surface-200 dark:border-surface-700 pb-1 mt-2">{dict.manufacturing.baseTangent}</div>
                                    <div className="flex justify-between"><span className="text-surface-600 dark:text-surface-400 font-bold">{dict.manufacturing.pinion} ({results.Wk1.k} {dict.manufacturing.teeth}):</span> <span className="font-mono text-surface-900 dark:text-surface-200">{dist(results.Wk1.W)}</span></div>
                                    <div className="flex justify-between"><span className="text-surface-600 dark:text-surface-400 font-bold">{dict.manufacturing.gear} ({results.Wk2.k} {dict.manufacturing.teeth}):</span> <span className="font-mono text-surface-900 dark:text-surface-200">{dist(results.Wk2.W)}</span></div>
                                </div>
                            </div>
                        </div>


                        {/* 4B. ENGINEERING ANALYSIS */}
                        <div className="flex-1">
                            <h2 className="text-sm font-bold text-ind-orange uppercase tracking-widest mb-6 border-b border-orange-100 pb-2">
                                {dict.driveTrain.engineering}
                            </h2>

                            {/* Forces */}
                            <div className="mb-8">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">{dict.safety.loadFactors}</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center group">
                                        <span className="text-sm text-slate-600 group-hover:text-ind-orange transition-colors">{dict.safety.tangentialForce}</span>
                                        <span className="font-mono font-bold text-slate-800">{force(results.Ft)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-400">{dict.safety.radialForce}</span>
                                        <span className="font-mono font-bold text-slate-400">{force(results.Fr)}</span>
                                    </div>
                                    {helixAngle > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-400">{dict.safety.axialForce}</span>
                                            <span className="font-mono font-bold text-slate-400">{force(results.Fa)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Safety Factors */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">{dict.safety.safetyEst}</h3>

                                {/* Bending */}
                                <div className={`p-4 rounded-xl border-l-4 ${results.SF_bending > 1.4 ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-xs font-bold uppercase text-slate-500">{dict.safety.bendingSafety}</span>
                                        <span className={`text-2xl font-black ${results.SF_bending > 1.4 ? 'text-green-600' : 'text-red-600'}`}>
                                            {results.SF_bending.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                        {dict.safety.stress}: {stress(results.estBendingStress)} / {dict.safety.limit}: {stress(GEAR_MATERIALS.find(m => m.name === materialName)?.sigma_Flim || 0)}
                                    </div>
                                </div>

                                {/* Contact */}
                                <div className={`p-4 rounded-xl border-l-4 ${results.SF_contact > 1.0 ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-xs font-bold uppercase text-slate-500">{dict.safety.pittingSafety}</span>
                                        <span className={`text-2xl font-black ${results.SF_contact > 1.0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {results.SF_contact.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                        {dict.safety.contactStress}: {stress(results.estContactStress)} / {dict.safety.limit}: {stress(GEAR_MATERIALS.find(m => m.name === materialName)?.sigma_Hlim || 0)}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 text-[10px] text-slate-300 italic">
                                * {dict.safety.safetyWarning}
                            </div>
                        </div>


                    </div>
                </div>

            </div>
        </main>
    );
}
