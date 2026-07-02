'use client';

import React, { useState } from 'react';
import { Layers, RefreshCw } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { getFieldToolsStrings } from '@/locales/fieldToolsTranslations';
import { playClickSound } from '@/mobile/services/audioSynth';

type ScaleKey = 'hb' | 'hrc' | 'hrb' | 'hv' | 'mpa';

const CONVERSION_TABLE = [
    { hb: 615, hrc: 60, hrb: 120, hv: 697, mpa: 2180 },
    { hb: 560, hrc: 55, hrb: 118, hv: 613, mpa: 1980 },
    { hb: 512, hrc: 52, hrb: 116, hv: 550, mpa: 1810 },
    { hb: 475, hrc: 49, hrb: 115, hv: 508, mpa: 1680 },
    { hb: 444, hrc: 47, hrb: 114, hv: 471, mpa: 1570 },
    { hb: 415, hrc: 44, hrb: 113, hv: 438, mpa: 1460 },
    { hb: 388, hrc: 41, hrb: 111, hv: 409, mpa: 1360 },
    { hb: 363, hrc: 39, hrb: 110, hv: 382, mpa: 1270 },
    { hb: 341, hrc: 37, hrb: 109, hv: 358, mpa: 1190 },
    { hb: 321, hrc: 34, hrb: 108, hv: 336, mpa: 1120 },
    { hb: 302, hrc: 32, hrb: 107, hv: 315, mpa: 1050 },
    { hb: 285, hrc: 30, hrb: 105, hv: 297, mpa: 990 },
    { hb: 269, hrc: 28, hrb: 104, hv: 279, mpa: 930 },
    { hb: 255, hrc: 25, hrb: 102, hv: 264, mpa: 880 },
    { hb: 241, hrc: 23, hrb: 100, hv: 249, mpa: 830 },
    { hb: 228, hrc: 20, hrb: 98,  hv: 235, mpa: 785 },
    { hb: 217, hrc: 18, hrb: 96,  hv: 223, mpa: 745 },
    { hb: 207, hrc: 15, hrb: 95,  hv: 212, mpa: 710 },
    { hb: 197, hrc: 13, hrb: 93,  hv: 202, mpa: 675 },
    { hb: 187, hrc: 10, hrb: 91,  hv: 192, mpa: 640 },
    { hb: 179, hrc: 7,  hrb: 89,  hv: 184, mpa: 615 },
    { hb: 170, hrc: 4,  hrb: 86,  hv: 175, mpa: 585 },
    { hb: 163, hrc: 2,  hrb: 84,  hv: 167, mpa: 560 },
    { hb: 156, hrc: 0,  hrb: 82,  hv: 160, mpa: 535 },
    { hb: 149, hrc: -2, hrb: 80,  hv: 152, mpa: 510 },
    { hb: 143, hrc: -5, hrb: 78,  hv: 146, mpa: 490 },
    { hb: 137, hrc: -8, hrb: 75,  hv: 140, mpa: 470 },
    { hb: 131, hrc: -10,hrb: 73,  hv: 134, mpa: 450 },
    { hb: 121, hrc: -15,hrb: 68,  hv: 124, mpa: 415 },
    { hb: 111, hrc: -20,hrb: 63,  hv: 113, mpa: 380 },
    { hb: 101, hrc: -25,hrb: 57,  hv: 103, mpa: 345 },
    { hb: 95,  hrc: -28,hrb: 53,  hv: 96,  mpa: 325 }
];

const getSortedTable = (key: ScaleKey) => {
    return [...CONVERSION_TABLE].sort((a, b) => a[key] - b[key]);
};

function convertHardness(val: number, from: ScaleKey, to: ScaleKey): number {
    const table = getSortedTable(from);
    if (val <= table[0][from]) return table[0][to];
    if (val >= table[table.length - 1][from]) return table[table.length - 1][to];

    for (let i = 0; i < table.length - 1; i++) {
        const p1 = table[i];
        const p2 = table[i + 1];
        if (val >= p1[from] && val <= p2[from]) {
            const range = p2[from] - p1[from];
            if (range === 0) return p1[to];
            const t = (val - p1[from]) / range;
            return p1[to] + t * (p2[to] - p1[to]);
        }
    }
    return val;
}

export default function HardnessConverterModule() {
    const { language } = useI18nStore();
    const ft = getFieldToolsStrings(language);

    const [inputScale, setInputScale] = useState<ScaleKey>('hrc');
    const [inputValue, setInputValue] = useState<number>(30);

    const handleScaleChange = (scale: ScaleKey) => {
        playClickSound();
        setInputScale(scale);
        if (scale === 'hrc') setInputValue(30);
        else if (scale === 'hb') setInputValue(285);
        else if (scale === 'hrb') setInputValue(100);
        else if (scale === 'hv') setInputValue(297);
        else if (scale === 'mpa') setInputValue(990);
    };

    const limits = {
        hb: { min: 95, max: 615, step: 5, unit: 'HB' },
        hrc: { min: -28, max: 60, step: 1, unit: 'HRC' },
        hrb: { min: 53, max: 120, step: 1, unit: 'HRB' },
        hv: { min: 96, max: 697, step: 5, unit: 'HV' },
        mpa: { min: 325, max: 2180, step: 10, unit: 'MPa' }
    };

    const currentLimit = limits[inputScale];

    const hbVal = inputScale === 'hb' ? inputValue : convertHardness(inputValue, inputScale, 'hb');
    const hrcVal = inputScale === 'hrc' ? inputValue : convertHardness(inputValue, inputScale, 'hrc');
    const hrbVal = inputScale === 'hrb' ? inputValue : convertHardness(inputValue, inputScale, 'hrb');
    const hvVal = inputScale === 'hv' ? inputValue : convertHardness(inputValue, inputScale, 'hv');
    const mpaVal = inputScale === 'mpa' ? inputValue : convertHardness(inputValue, inputScale, 'mpa');
    const ksiVal = mpaVal / 6.89476;

    return (
        <div className="flex flex-col h-full bg-[#05090e] p-6 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/5 relative z-10">
                <div>
                    <h2 className="text-lg font-black italic tracking-wider uppercase flex items-center gap-2 text-white">
                        <Layers className="text-cyan-400 animate-pulse" size={20} />
                        {ft.hardnessConverter || 'Hardness & Strength Converter'}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{ft.hardnessConverterDesc || 'ASTM E140 metallurgical conversion tool'}</p>
                </div>
            </div>

            {/* Main Panel */}
            <div className="grid grid-cols-5 gap-6 mt-6 flex-1 min-h-0 relative z-10">
                
                {/* Left: Input values */}
                <div className="col-span-2 space-y-6 flex flex-col justify-between">
                    <div className="space-y-3">
                        <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">{ft.convertFrom || 'Convert From'}</label>
                        <div className="grid grid-cols-5 gap-1.5 bg-black/45 p-1.5 rounded-xl border border-white/5">
                            {(['hrc', 'hb', 'hrb', 'hv', 'mpa'] as ScaleKey[]).map(scale => (
                                <button
                                    key={scale}
                                    onClick={() => handleScaleChange(scale)}
                                    className={`py-2 text-[10px] font-bold font-mono uppercase rounded-lg transition-all ${inputScale === scale ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {scale}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-5 bg-slate-950/40 border border-cyan-500/25 rounded-2xl space-y-4 relative">
                        <div className="flex justify-between items-baseline font-mono text-xs">
                            <span className="text-slate-400">{ft.hardnessVal || 'Input Value'}</span>
                            <span className="font-black text-cyan-400 text-xl">
                                {inputValue.toFixed(inputScale === 'hrc' || inputScale === 'hrb' ? 1 : 0)} {currentLimit.unit}
                            </span>
                        </div>
                        <input 
                            type="range"
                            min={currentLimit.min}
                            max={currentLimit.max}
                            step={currentLimit.step}
                            value={inputValue}
                            onChange={e => {
                                setInputValue(Number(e.target.value));
                                if (Math.floor(inputValue) % 5 === 0) playClickSound();
                            }}
                            className="w-full h-1 bg-slate-900 border border-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400 outline-none"
                        />
                    </div>

                    <div className="p-4 bg-cyan-950/10 border border-cyan-500/10 rounded-2xl flex gap-3.5 items-start">
                        <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                            <RefreshCw size={12} className="animate-spin-slow" />
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                            Conversions are based on standard ASTM E140 tables for carbon and alloy steels. Values are approximate guidelines.
                        </p>
                    </div>
                </div>

                {/* Right: Results Display */}
                <div className="col-span-3 bg-black/45 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                    <div className="grid grid-cols-2 gap-4">
                        {inputScale !== 'hrc' && (
                            <div className="p-4 bg-slate-950/20 border border-white/5 rounded-2xl text-center space-y-1">
                                <span className="text-[9px] font-mono text-slate-500 block uppercase">Rockwell C (HRC)</span>
                                <span className="text-2xl font-black font-mono text-slate-300">{hrcVal.toFixed(1)}</span>
                            </div>
                        )}
                        {inputScale !== 'hb' && (
                            <div className="p-4 bg-slate-950/20 border border-white/5 rounded-2xl text-center space-y-1">
                                <span className="text-[9px] font-mono text-slate-500 block uppercase">Brinell (HB)</span>
                                <span className="text-2xl font-black font-mono text-slate-300">{Math.round(hbVal)}</span>
                            </div>
                        )}
                        {inputScale !== 'hrb' && (
                            <div className="p-4 bg-slate-950/20 border border-white/5 rounded-2xl text-center space-y-1">
                                <span className="text-[9px] font-mono text-slate-500 block uppercase">Rockwell B (HRB)</span>
                                <span className="text-2xl font-black font-mono text-slate-300">{hrbVal.toFixed(1)}</span>
                            </div>
                        )}
                        {inputScale !== 'hv' && (
                            <div className="p-4 bg-slate-950/20 border border-white/5 rounded-2xl text-center space-y-1">
                                <span className="text-[9px] font-mono text-slate-500 block uppercase">Vickers (HV)</span>
                                <span className="text-2xl font-black font-mono text-slate-300">{Math.round(hvVal)}</span>
                            </div>
                        )}
                    </div>

                    {inputScale !== 'mpa' && (
                        <div className="mt-4 p-5 bg-slate-950/40 border border-cyan-500/10 rounded-2xl text-center space-y-2 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent pointer-events-none" />
                            <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-widest">Calculated Tensile Strength (Çekme Dayanımı)</span>
                            <div className="flex items-baseline justify-center gap-6">
                                <span className="text-3xl font-black font-mono text-cyan-400">{Math.round(mpaVal)} <span className="text-sm font-normal text-slate-400">MPa</span></span>
                                <span className="text-2xl font-black font-mono text-slate-300">{Math.round(ksiVal)} <span className="text-sm font-normal text-slate-400">ksi</span></span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
