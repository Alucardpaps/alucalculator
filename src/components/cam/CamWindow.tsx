'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useCADCanvasStore, CADShape } from '@/store/CADCanvasStore';
import { Scissors, Zap, Clock, Settings, LayoutGrid, X, MonitorPlay } from 'lucide-react';

type CAMMode = 'laser' | 'punch';

interface CAMSettings {
    laserSpeed: number; // mm/min
    pierceTime: number; // sec
    punchHitRate: number; // hits/min
    punchToolStride: number; // mm (distance between hits)
    sheetCost: number; // currency/unit
}

// ------------------------------------------------------------------------
// GEOMETRY HELPERS
// ------------------------------------------------------------------------

function calculateShapePerimeter(shape: CADShape): number {
    let perimeter = 0;
    const pts = shape.points;

    if (shape.type === 'circle') {
        const r = Math.sqrt(Math.pow(pts[1].x - pts[0].x, 2) + Math.pow(pts[1].y - pts[0].y, 2));
        return 2 * Math.PI * r;
    }

    if (shape.type === 'rectangle') {
        const w = Math.abs(pts[0].x - pts[1].x);
        const h = Math.abs(pts[0].y - pts[1].y);
        return 2 * (w + h);
    }

    // Polyline / Line
    for (let i = 0; i < pts.length - 1; i++) {
        perimeter += Math.sqrt(Math.pow(pts[i + 1].x - pts[i].x, 2) + Math.pow(pts[i + 1].y - pts[i].y, 2));
    }

    return perimeter;
}

export const CamWindow: React.FC = () => {
    const { shapes } = useCADCanvasStore();
    const [mode, setMode] = useState<CAMMode>('laser');
    const [isVisible, setIsVisible] = useState(false); // Hidden by default, toggled by Ribbon
    const [settings, setSettings] = useState<CAMSettings>({
        laserSpeed: 1500,
        pierceTime: 0.5,
        punchHitRate: 300,
        punchToolStride: 10,
        sheetCost: 0
    });

    // Listen for Ribbon Events
    useEffect(() => {
        const handleCamAction = (e: CustomEvent) => {
            if (e.detail.action === 'toggle-window' || e.detail.action === 'start') {
                setIsVisible(true);
            }
        };
        window.addEventListener('cam:action', handleCamAction as EventListener);
        return () => window.removeEventListener('cam:action', handleCamAction as EventListener);
    }, []);

    // --------------------------------------------------------------------
    // METRICS ENGINE
    // --------------------------------------------------------------------
    const metrics = useMemo(() => {
        let totalLength = 0; // mm
        let entityCount = 0;

        shapes.forEach(shape => {
            if (!shape.visible) return;
            totalLength += calculateShapePerimeter(shape);
            entityCount++;
        });

        // LASER CALCS
        const laserTimeMin = (totalLength / settings.laserSpeed) + (entityCount * settings.pierceTime / 60);

        // PUNCH CALCS
        const totalHits = Math.ceil(totalLength / settings.punchToolStride);
        const punchTimeMin = totalHits / settings.punchHitRate;

        return {
            totalLength,
            entityCount,
            laserTimeMin,
            totalHits,
            punchTimeMin
        };
    }, [shapes, settings]);

    if (!isVisible) return null;

    return (
        <div className="absolute top-20 right-4 z-[100] w-80 bg-[var(--bg-1)]/95 border border-[var(--line-strong)] rounded-xl shadow-2xl flex flex-col overflow-hidden font-mono text-xs animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-[var(--line-strong)] bg-[var(--bg-3)]/50">
                <div className="flex items-center gap-2 text-[var(--cyan)] font-bold tracking-wider">
                    <LayoutGrid size={14} />
                    <span>CAM OPS CONTROLLER</span>
                </div>
                <button onClick={() => setIsVisible(false)} className="text-gray-500 hover:text-white">
                    <X size={14} />
                </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 p-2 bg-[var(--bg-1)]">
                <button
                    onClick={() => setMode('laser')}
                    className={`flex items-center justify-center gap-2 py-2 rounded transition-colors ${mode === 'laser' ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/50' : 'bg-[var(--bg-3)] text-gray-400 hover:text-white'}`}
                >
                    <Zap size={14} /> LASER
                </button>
                <button
                    onClick={() => setMode('punch')}
                    className={`flex items-center justify-center gap-2 py-2 rounded transition-colors ${mode === 'punch' ? 'bg-[var(--warn)]/20 text-[var(--warn)] border border-[var(--warn)]/50' : 'bg-[var(--bg-3)] text-gray-400 hover:text-white'}`}
                >
                    <MonitorPlay size={14} /> PUNCH
                </button>
            </div>

            {/* Metrics */}
            <div className="p-4 flex flex-col gap-4">

                {/* Primary Metric: Time */}
                <div className="flex items-center justify-between bg-[var(--bg-2)] p-3 rounded border border-[var(--line-strong)]">
                    <span className="text-gray-400 flex items-center gap-2">
                        <Clock size={14} /> Est. Time
                    </span>
                    <span className="text-xl font-bold text-white">
                        {mode === 'laser' ? metrics.laserTimeMin.toFixed(2) : metrics.punchTimeMin.toFixed(2)}
                        <span className="text-xs text-gray-500 ml-1 font-normal">min</span>
                    </span>
                </div>

                {/* Secondary Metrics */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[var(--bg-2)] p-2 rounded border border-[var(--line-strong)]">
                        <div className="text-[10px] text-gray-500 uppercase mb-1">Total Length</div>
                        <div className="text-white font-bold">{(metrics.totalLength / 1000).toFixed(2)} m</div>
                    </div>
                    {mode === 'punch' ? (
                        <div className="bg-[var(--bg-2)] p-2 rounded border border-[var(--line-strong)]">
                            <div className="text-[10px] text-gray-500 uppercase mb-1">Total Hits</div>
                            <div className="text-[var(--warn)] font-bold">{metrics.totalHits}</div>
                        </div>
                    ) : (
                        <div className="bg-[var(--bg-2)] p-2 rounded border border-[var(--line-strong)]">
                            <div className="text-[10px] text-gray-500 uppercase mb-1">Pierces</div>
                            <div className="text-[var(--cyan)] font-bold">{metrics.entityCount}</div>
                        </div>
                    )}
                </div>

                {/* Settings Inputs */}
                <div className="border-t border-[var(--line-strong)] pt-4 mt-2">
                    <div className="flex items-center gap-2 text-gray-400 mb-3 text-[10px] uppercase font-bold">
                        <Settings size={10} /> Machine Parameters
                    </div>

                    <div className="grid gap-2">
                        {mode === 'laser' ? (
                            <>
                                <LabelInput
                                    label="Cutting Speed (mm/min)"
                                    value={settings.laserSpeed}
                                    onChange={v => setSettings(s => ({ ...s, laserSpeed: parseFloat(v) || 0 }))}
                                />
                                <LabelInput
                                    label="Pierce Time (sec)"
                                    value={settings.pierceTime}
                                    onChange={v => setSettings(s => ({ ...s, pierceTime: parseFloat(v) || 0 }))}
                                />
                            </>
                        ) : (
                            <>
                                <LabelInput
                                    label="Hit Rate (hits/min)"
                                    value={settings.punchHitRate}
                                    onChange={v => setSettings(s => ({ ...s, punchHitRate: parseFloat(v) || 0 }))}
                                />
                                <LabelInput
                                    label="Tool Stride (mm)"
                                    value={settings.punchToolStride}
                                    onChange={v => setSettings(s => ({ ...s, punchToolStride: parseFloat(v) || 0 }))}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper UI Component
const LabelInput = ({ label, value, onChange }: { label: string, value: number, onChange: (val: string) => void }) => (
    <div className="flex items-center justify-between">
        <span className="text-gray-500">{label}</span>
        <input
            type="number"
            className="w-16 bg-[var(--bg-1)] border border-[var(--line-strong)] rounded px-2 py-1 text-right text-white focus:border-[var(--cyan)] focus:outline-none transition-colors"
            value={value}
            onChange={e => onChange(e.target.value)}
        />
    </div>
);
