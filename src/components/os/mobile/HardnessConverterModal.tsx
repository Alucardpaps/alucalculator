'use client';

import React, { useState } from 'react';
import { X, Layers, RefreshCw } from 'lucide-react';
import { playClickSound } from '@/mobile/services/audioSynth';
import { useMobileStore } from '@/mobile/store/mobileStore';

interface HardnessConverterModalProps {
    isOpen: boolean;
    onClose: () => void;
    ft: any;
    debugMode?: boolean;
}

type ScaleKey = 'hb' | 'hrc' | 'hrb' | 'hv' | 'mpa';

// Conversion nodes matching ASTM E140 / ISO 18265 reference charts
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

// Sort helper to ensure we search table correctly
const getSortedTable = (key: ScaleKey) => {
    return [...CONVERSION_TABLE].sort((a, b) => a[key] - b[key]);
};

function convertHardness(val: number, from: ScaleKey, to: ScaleKey): number {
    const table = getSortedTable(from);
    
    // Boundary checks
    if (val <= table[0][from]) return table[0][to];
    if (val >= table[table.length - 1][from]) return table[table.length - 1][to];

    // Find bounding segments for interpolation
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

export function HardnessConverterModal({ isOpen, onClose, ft }: HardnessConverterModalProps) {
    const soundEnabled = useMobileStore(s => s.soundEnabled);

    const [inputScale, setInputScale] = useState<ScaleKey>('hrc');
    const [inputValue, setInputValue] = useState<number>(30);

    const handleClose = () => {
        playClickSound();
        onClose();
    };

    const handleScaleChange = (scale: ScaleKey) => {
        if (soundEnabled) playClickSound();
        setInputScale(scale);
        // Reset typical default value for scale
        if (scale === 'hrc') setInputValue(30);
        else if (scale === 'hb') setInputValue(285);
        else if (scale === 'hrb') setInputValue(100);
        else if (scale === 'hv') setInputValue(297);
        else if (scale === 'mpa') setInputValue(990);
    };

    // Limits for the sliders depending on the selected input scale
    const limits = {
        hb: { min: 95, max: 615, step: 5, unit: 'HB' },
        hrc: { min: -28, max: 60, step: 1, unit: 'HRC' },
        hrb: { min: 53, max: 120, step: 1, unit: 'HRB' },
        hv: { min: 96, max: 697, step: 5, unit: 'HV' },
        mpa: { min: 325, max: 2180, step: 10, unit: 'MPa' }
    };

    const currentLimit = limits[inputScale];

    // Calculate all outputs
    const hbVal = inputScale === 'hb' ? inputValue : convertHardness(inputValue, inputScale, 'hb');
    const hrcVal = inputScale === 'hrc' ? inputValue : convertHardness(inputValue, inputScale, 'hrc');
    const hrbVal = inputScale === 'hrb' ? inputValue : convertHardness(inputValue, inputScale, 'hrb');
    const hvVal = inputScale === 'hv' ? inputValue : convertHardness(inputValue, inputScale, 'hv');
    const mpaVal = inputScale === 'mpa' ? inputValue : convertHardness(inputValue, inputScale, 'mpa');
    const ksiVal = mpaVal / 6.89476;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#020408]/95 p-4 text-white overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Layers className="text-cyan-400 animate-pulse" size={20} />
                    <div>
                        <h3 className="text-sm font-black italic uppercase tracking-wider">{ft.hardnessConverter || 'Hardness Converter'}</h3>
                        <span className="text-[9px] text-slate-500 font-mono block leading-none">{ft.hardnessConverterDesc}</span>
                    </div>
                </div>
                <button onClick={handleClose} className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5">
                    <X size={16} />
                </button>
            </div>

            {/* Content body */}
            <div className="flex-1 flex flex-col justify-between mt-4 gap-4">
                
                {/* Scale selection row */}
                <div className="space-y-2">
                    <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">{ft.convertFrom || 'Convert From'}</label>
                    <div className="grid grid-cols-5 gap-1.5 bg-black/45 p-1 rounded-xl border border-white/5">
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

                {/* Input Slider */}
                <div className="p-4 bg-slate-950/40 border border-cyan-500/20 rounded-2xl space-y-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent pointer-events-none" />
                    <div className="flex justify-between items-baseline font-mono text-xs">
                        <span className="text-slate-400">{ft.hardnessVal || 'Input Value'}</span>
                        <span className="font-black text-cyan-400 text-lg">
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
                            if (soundEnabled && Math.floor(inputValue) % 5 === 0) playClickSound();
                        }}
                        className="w-full h-1 bg-slate-900 border border-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400 outline-none"
                    />
                </div>

                {/* Converted Outputs Grid */}
                <div className="space-y-2 flex-1 mt-2">
                    <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">{ft.convertedVal || 'Converted Equivalents'}</label>
                    <div className="grid grid-cols-2 gap-3">
                        {inputScale !== 'hrc' && (
                            <div className="p-4 bg-slate-950/20 border border-white/5 rounded-xl text-center space-y-1">
                                <span className="text-[8px] font-mono text-slate-500 block uppercase">Rockwell C (HRC)</span>
                                <span className="text-xl font-black font-mono text-slate-300">{hrcVal.toFixed(1)}</span>
                            </div>
                        )}
                        {inputScale !== 'hb' && (
                            <div className="p-4 bg-slate-950/20 border border-white/5 rounded-xl text-center space-y-1">
                                <span className="text-[8px] font-mono text-slate-500 block uppercase">Brinell (HB)</span>
                                <span className="text-xl font-black font-mono text-slate-300">{Math.round(hbVal)}</span>
                            </div>
                        )}
                        {inputScale !== 'hrb' && (
                            <div className="p-4 bg-slate-950/20 border border-white/5 rounded-xl text-center space-y-1">
                                <span className="text-[8px] font-mono text-slate-500 block uppercase">Rockwell B (HRB)</span>
                                <span className="text-xl font-black font-mono text-slate-300">{hrbVal.toFixed(1)}</span>
                            </div>
                        )}
                        {inputScale !== 'hv' && (
                            <div className="p-4 bg-slate-950/20 border border-white/5 rounded-xl text-center space-y-1">
                                <span className="text-[8px] font-mono text-slate-500 block uppercase">Vickers (HV)</span>
                                <span className="text-xl font-black font-mono text-slate-300">{Math.round(hvVal)}</span>
                            </div>
                        )}
                        {inputScale !== 'mpa' && (
                            <div className="col-span-2 p-4 bg-slate-950/30 border border-white/5 rounded-2xl text-center space-y-1.5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent pointer-events-none" />
                                <span className="text-[8px] font-mono text-slate-500 block uppercase tracking-wider">Tensile Strength (Dayanım)</span>
                                <div className="flex items-baseline justify-center gap-4">
                                    <span className="text-2xl font-black font-mono text-cyan-400">{Math.round(mpaVal)} <span className="text-xs font-normal text-slate-400">MPa</span></span>
                                    <span className="text-lg font-black font-mono text-slate-300">{Math.round(ksiVal)} <span className="text-xs font-normal text-slate-400">ksi</span></span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info disclaimer */}
                <div className="p-3 bg-cyan-950/10 border border-cyan-500/10 rounded-xl flex gap-3.5 items-start mt-2">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                        <RefreshCw size={11} className="animate-spin-slow" />
                    </div>
                    <p className="text-[9px] text-slate-400 leading-relaxed font-sans">
                        Conversions are based on ASTM E140 tables for non-austenitic steels and should be used for engineering comparison and evaluation purposes only.
                    </p>
                </div>

            </div>
        </div>
    );
}
