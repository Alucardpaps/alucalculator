'use client';

import React, { useState, useEffect } from 'react';
import { calculateBoxProfile, BoxProfileResult } from '@/logic/geometry';

interface BoxProfileModuleProps {
    lang: string;
    dict: any;
}

export default function BoxProfileModule({ lang, dict }: BoxProfileModuleProps) {
    // Local state for immediate feedback
    const [w, setW] = useState<number>(100);
    const [h, setH] = useState<number>(50);
    const [t, setT] = useState<number>(3);
    const [results, setResults] = useState<BoxProfileResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const res = calculateBoxProfile(w, h, t, 1000); // 1m default length
            setResults(res);
            setError(null);
        } catch (e: any) {
            setError(e.message);
            setResults(null);
        }
    }, [w, h, t]);

    return (
        <div className="flex flex-col gap-3 p-4 bg-[#1e1e1e] h-full overflow-y-auto text-slate-200">
            {/* Visual Representation */}
            <div className="h-32 bg-[#111] rounded border border-[#333] flex items-center justify-center relative overflow-hidden shrink-0">
                <div
                    className="border-2 border-cyan-400"
                    style={{
                        width: Math.min(w, 120),
                        height: Math.min(h, 80),
                        borderRadius: 2
                    }}
                />
                <div className="absolute bottom-1 right-1 text-[9px] text-gray-500 font-mono">1:10 SCALE</div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-3">
                <Input label="Width (mm)" value={w} onChange={setW} />
                <Input label="Height (mm)" value={h} onChange={setH} />
                <Input label="Thickness" value={t} onChange={setT} />
                <Input label="Length" value={1000} disabled />
            </div>

            {/* Validation Error */}
            {error && (
                <div className="p-3 bg-red-900/20 border border-red-500/50 text-red-400 text-xs rounded">
                    ⚠ {error}
                </div>
            )}

            {/* Results - Engineering Grid */}
            {results && !error && (
                <div className="grid grid-cols-2 gap-2 bg-[#111] p-3 rounded border border-[#333] font-mono text-xs">
                    <div className="text-gray-500">Mass</div>
                    <div className="text-right text-cyan-400 font-bold">{results.mass.value.toFixed(2)} {results.mass.unit}</div>

                    <div className="text-gray-500">Ix</div>
                    <div className="text-right text-white">{results.Ix.value.toFixed(2)} {results.Ix.unit}</div>

                    <div className="text-gray-500">Iy</div>
                    <div className="text-right text-white">{results.Iy.value.toFixed(2)} {results.Iy.unit}</div>

                    <div className="text-gray-500">Section Area</div>
                    <div className="text-right text-white">{results.area.value.toFixed(2)} {results.area.unit}</div>
                </div>
            )}

            <div className="mt-auto text-[10px] text-gray-600 text-center pt-2">
                Aluminum 6063-T6 Density: 2.7 g/cm³
            </div>
        </div>
    );
}

// Helper Input Component
const Input = ({ label, value, onChange, disabled }: { label: string, value: number, onChange?: (v: number) => void, disabled?: boolean }) => (
    <div className="flex flex-col gap-1">
        <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{label}</label>
        <input
            type="number"
            className="w-full bg-[#252526] border border-[#333] rounded px-3 py-2 focus:border-cyan-500 outline-none font-mono text-white text-sm disabled:opacity-50 transition-colors"
            value={value}
            onChange={e => onChange?.(parseFloat(e.target.value))}
            disabled={disabled}
        />
    </div>
);
