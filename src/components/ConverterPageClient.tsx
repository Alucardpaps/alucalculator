"use client";

import { useState } from "react";
import { ArrowRightLeft, Ruler, Weight, Gauge, Zap } from 'lucide-react';
import { CalculatorInput } from "@/components/CalculatorInput";

const factors = {
    length: {
        units: { mm: 1, cm: 10, m: 1000, inch: 25.4, ft: 304.8 },
        icon: Ruler
    },
    weight: {
        units: { g: 1, kg: 1000, lb: 453.592, oz: 28.3495 },
        icon: Weight
    },
    pressure: {
        units: { Pa: 1, kPa: 1000, bar: 100000, psi: 6894.76, MPa: 1000000 },
        icon: Gauge
    },
    power: {
        units: { W: 1, kW: 1000, hp: 745.7, PS: 735.5 },
        icon: Zap
    }
};

export default function ConverterPageClient({ dict }: { dict: any }) {
    const [category, setCategory] = useState<keyof typeof factors>('length');
    const [inputValue, setInputValue] = useState(1);
    const [fromUnit, setFromUnit] = useState(Object.keys(factors.length.units)[0]);
    const [toUnit, setToUnit] = useState(Object.keys(factors.length.units)[1]);

    const activeFactors = factors[category].units;
    const Icon = factors[category].icon;

    // Convert: (Input * FromFactor) / ToFactor
    // We store factor relative to base unit (e.g. mm=1).
    // Actually typically factors are: 1 unit = X base.
    // Above: mm:1, m:1000. So 1m = 1000mm.
    // Value(Base) = Value(Input) * Factor(Input)
    // Value(Output) = Value(Base) / Factor(Output)

    // Wait, let's verify.
    // 1 m = 1000 units? If base is mm.
    // Then m factor = 1000.
    // 5m -> 5000 base.
    // 5000 base / 1 (mm factor) = 5000mm. Correct.

    const result = (inputValue * (activeFactors as any)[fromUnit]) / (activeFactors as any)[toUnit];

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-12 font-sans">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-100">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><ArrowRightLeft /></div>
                    <h1 className="text-2xl font-bold text-slate-800">{dict?.converter?.title || 'Unit Converter'}</h1>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {Object.keys(factors).map(k => (
                        <button
                            key={k}
                            onClick={() => {
                                setCategory(k as any);
                                setFromUnit(Object.keys(factors[k as keyof typeof factors].units)[0]);
                                setToUnit(Object.keys(factors[k as keyof typeof factors].units)[1]);
                            }}
                            className={`px-4 py-2 rounded-lg font-bold capitalize flex items-center gap-2 transition-all ${category === k ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            {/* @ts-ignore */}
                            {dict?.converter?.categories?.[k] || k}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">From</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                inputMode="decimal"
                                value={inputValue}
                                onChange={(e) => setInputValue(Number(e.target.value))}
                                className="w-full text-3xl font-black p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 ring-indigo-500 outline-none"
                            />
                            <select
                                value={fromUnit}
                                onChange={(e) => setFromUnit(e.target.value)}
                                className="bg-slate-100 rounded-xl font-bold px-4 appearance-none"
                            >
                                {Object.keys(activeFactors).map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-center md:hidden">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center"><ArrowRightLeft size={16} /></div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">To</label>
                        <div className="flex gap-2 opacity-100">
                            <div className="w-full text-3xl font-black p-4 bg-indigo-50 text-indigo-900 rounded-xl border border-indigo-100 flex items-center">
                                {result.toFixed(4).replace(/\.?0+$/, '')}
                            </div>
                            <select
                                value={toUnit}
                                onChange={(e) => setToUnit(e.target.value)}
                                className="bg-slate-100 rounded-xl font-bold px-4 appearance-none"
                            >
                                {Object.keys(activeFactors).map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
