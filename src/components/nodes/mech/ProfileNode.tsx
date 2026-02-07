'use client';

import React, { memo, useState, useEffect } from 'react';
import BaseNode from '../BaseNode';
import { calculateBoxProfile, BoxProfileResult } from '@/logic/geometry';

export default memo(({ id, data }: any) => {
    // Local state for immediate feedback, sync to global later
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

            // Broadcast changes to output handles?
            // In a real app, this would update the store node data for propagation
        } catch (e: any) {
            setError(e.message);
            setResults(null);
        }
    }, [w, h, t]);

    return (
        <BaseNode id={id} data={{ title: "BOX PROFILE DETECTOR", ...data }}>
            <div className="flex flex-col gap-3">
                {/* Visual Representation (Placeholder for SVG) */}
                <div className="h-24 bg-[#111] rounded border border-[#333] flex items-center justify-center relative overflow-hidden">
                    <div
                        className="border-2 border-accent"
                        style={{
                            width: Math.min(w, 80),
                            height: Math.min(h, 60),
                            borderRadius: 2
                        }}
                    />
                    <div className="absolute bottom-1 right-1 text-[9px] text-gray-500 font-mono">1:10 SCALE</div>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-2 gap-2">
                    <Input label="Width (mm)" value={w} onChange={setW} />
                    <Input label="Height (mm)" value={h} onChange={setH} />
                    <Input label="Thickness" value={t} onChange={setT} />
                    <Input label="Length" value={1000} disabled />
                </div>

                {/* Validation Error */}
                {error && (
                    <div className="p-2 bg-red-900/20 border border-red-500/50 text-red-400 text-[10px] rounded">
                        ⚠ {error}
                    </div>
                )}

                {/* Results - Engineering Grid */}
                {results && !error && (
                    <div className="grid grid-cols-2 gap-1 bg-[#111] p-2 rounded border border-[#333] font-mono text-[10px]">
                        <div className="text-gray-500">Mass</div>
                        <div className="text-right text-accent">{results.mass.value.toFixed(2)} {results.mass.unit}</div>

                        <div className="text-gray-500">Ix</div>
                        <div className="text-right text-white">{results.Ix.value.toFixed(2)} {results.Ix.unit}</div>

                        <div className="text-gray-500">Iy</div>
                        <div className="text-right text-white">{results.Iy.value.toFixed(2)} {results.Iy.unit}</div>
                    </div>
                )}
            </div>
        </BaseNode>
    );
});

// Helper Input
const Input = ({ label, value, onChange, disabled }: { label: string, value: number, onChange?: (v: number) => void, disabled?: boolean }) => (
    <div className="flex flex-col gap-1">
        <label className="text-[9px] text-gray-500 uppercase font-bold">{label}</label>
        <input
            type="number"
            className="w-full bg-[#111] border border-[#333] rounded px-2 py-1 focus:border-accent outline-none font-mono text-white text-xs disabled:opacity-50"
            value={value}
            onChange={e => onChange?.(parseFloat(e.target.value))}
            disabled={disabled}
        />
    </div>
);
