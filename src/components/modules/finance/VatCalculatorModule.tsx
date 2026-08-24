'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Calculator, Receipt, TrendingUp, Download, PieChart,
    ArrowRightLeft, Plus, DollarSign, Percent, AlertTriangle
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { useOSStore } from '@/store/osStore';

export default function VatCalculatorModule() {
    const { t } = useI18nStore();

    const [inputs, setInputs] = useState({
        amount: 1000,
        rate: 20,
        mode: 'exclude' as 'include' | 'exclude'
    });
    const { isChaosMode } = useOSStore();
    const [volatileRate, setVolatileRate] = useState(20);
    const [volatileAmount, setVolatileAmount] = useState(1000);

    // Chaos Mode: Market Volatility Injector
    React.useEffect(() => {
        if (!isChaosMode) {
            setVolatileRate(inputs.rate);
            setVolatileAmount(inputs.amount);
            return;
        }

        const interval = setInterval(() => {
            // Random fluctuations: Rate +/- 2.5%, Amount +/- 0.5%
            setVolatileRate(inputs.rate + (Math.random() * 5 - 2.5));
            setVolatileAmount(inputs.amount * (1 + (Math.random() * 0.01 - 0.005)));
        }, 150); // Aggressive refresh rate

        return () => clearInterval(interval);
    }, [isChaosMode, inputs.rate, inputs.amount]);

    const results = useMemo(() => {
        const amt = isChaosMode ? volatileAmount : inputs.amount;
        const rate = (isChaosMode ? volatileRate : inputs.rate) / 100;

        let net = 0;
        let vat = 0;
        let total = 0;

        if (inputs.mode === 'exclude') {
            net = amt;
            vat = amt * rate;
            total = amt + vat;
        } else {
            total = amt;
            net = amt / (1 + rate);
            vat = amt - net;
        }

        return { net, vat, total };
    }, [inputs, isChaosMode, volatileAmount, volatileRate]);

    return (
        <div className="flex flex-col h-full bg-[#030507] text-gray-200 p-8 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-emerald-500/20 rounded-[24px] border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10">
                        <Receipt size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tighter">{t.modules?.vatCalculator?.title || 'Tax Calculator'}</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">Institutional Finance • OS Global Core</p>
                    </div>
                </div>

                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 shadow-inner">
                    <button
                        onClick={() => setInputs({ ...inputs, mode: 'exclude' })}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inputs.mode === 'exclude' ? 'bg-emerald-500 text-white shadow-xl' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        VAT Excluded
                    </button>
                    <button
                        onClick={() => setInputs({ ...inputs, mode: 'include' })}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inputs.mode === 'include' ? 'bg-emerald-500 text-white shadow-xl' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        VAT Included
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Inputs & Controls */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px] space-y-8 backdrop-blur-3xl">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <DollarSign size={12} className="text-emerald-400" /> Transaction Amount
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={inputs.amount}
                                    onChange={(e) => setInputs({ ...inputs, amount: Number(e.target.value) })}
                                    className={`w-full bg-black/40 border rounded-2xl px-6 py-4 text-2xl font-black font-mono focus:outline-none transition-colors ${isChaosMode ? 'text-rose-500 border-rose-500/50 shadow-[inset_0_0_20px_rgba(225,29,72,0.2)]' : 'text-white border-white/10 focus:border-emerald-500/50'
                                        }`}
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600 font-black">CUR</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Percent size={12} className="text-emerald-400" /> Tax Rate
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 8, 18, 20].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setInputs({ ...inputs, rate: r })}
                                        className={`py-3 rounded-xl text-[10px] font-black border transition-all ${inputs.rate === r ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black/20 border-white/5 text-gray-500 hover:border-white/20'}`}
                                    >
                                        {r}%
                                    </button>
                                ))}
                            </div>
                            <input
                                type="range" min="0" max="100" step="1"
                                value={inputs.rate}
                                onChange={(e) => setInputs({ ...inputs, rate: Number(e.target.value) })}
                                className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-ew-resize accent-emerald-500"
                            />
                        </div>
                    </div>

                    <div className={`p-8 bg-black/20 border rounded-[40px] flex items-center gap-6 transition-all ${isChaosMode ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/5'}`}>
                        {isChaosMode ? <AlertTriangle size={32} className="text-rose-500 animate-pulse" /> : <TrendingUp size={32} className="text-gray-700" />}
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${isChaosMode ? 'text-rose-500' : 'text-gray-500'}`}>
                                {isChaosMode ? 'VOLATILITY INJECTOR ACTIVE' : 'Live Inflation Adjustment'}
                            </p>
                            <p className={`text-xs mt-1 ${isChaosMode ? 'text-rose-400 font-mono tracking-tighter' : 'text-gray-600'}`}>
                                {isChaosMode ? 'WARNING: Non-deterministic financial projections. Extreme risk.' : 'Experimental feature enabled'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Results Display */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 p-10 rounded-[48px] relative overflow-hidden flex flex-col justify-between h-full min-h-[400px]">
                        <div className="absolute top-0 right-0 p-10 opacity-10">
                            <PieChart size={240} strokeWidth={1} className={isChaosMode ? 'text-rose-500 animate-[spin_3s_linear_infinite]' : ''} />
                        </div>

                        <div className="relative z-10">
                            <div className={`text-[10px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-2 ${isChaosMode ? 'text-rose-500' : 'text-emerald-500'}`}>
                                <div className={`w-2 h-2 rounded-full animate-pulse ${isChaosMode ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                {isChaosMode ? 'ERRATIC YIELD ANALYSIS' : 'Comprehensive Breakdown'}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Net Amount</h4>
                                    <div className={`text-5xl font-black italic tracking-tighter ${isChaosMode ? 'text-rose-100 font-mono' : 'text-white'}`}>
                                        {results.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                        VAT Amount ({isChaosMode ? volatileRate.toFixed(2) : inputs.rate}%)
                                    </h4>
                                    <div className={`text-5xl font-black italic tracking-tighter ${isChaosMode ? 'text-rose-500 font-mono' : 'text-emerald-400'}`}>
                                        {results.vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`relative z-10 mt-12 pt-12 border-t flex items-end justify-between ${isChaosMode ? 'border-rose-500/20' : 'border-white/5'}`}>
                            <div>
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Total Gross</h4>
                                <div className={`text-8xl font-black tracking-tighter mix-blend-plus-lighter ${isChaosMode ? 'text-white font-mono blur-[0.5px]' : 'text-white'}`}>
                                    {results.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>

                            <button className={`flex items-center gap-3 px-8 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 shadow-xl ${isChaosMode ? 'bg-rose-500 text-black shadow-rose-500/20' : 'bg-white text-black shadow-white/5'
                                }`}>
                                {isChaosMode ? 'EXECUTE HIGH-RISK TRADE' : 'Download Invoice'} <Download size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
