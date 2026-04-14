'use client';

/**
 * CAD Status Bar — Bottom bar with DOF, constraint status, and snap mode
 */

import React from 'react';
import { useCadStore, useDOFCount, useConstraintStatus } from '../store/cadStore';
import { Crosshair, Grid3X3, Magnet } from 'lucide-react';

const STATUS_COLORS = {
    FULLY_CONSTRAINED: 'text-green-400',
    UNDER_CONSTRAINED: 'text-amber-400',
    OVER_CONSTRAINED: 'text-red-400',
} as const;

const STATUS_LABELS = {
    FULLY_CONSTRAINED: 'Fully Constrained',
    UNDER_CONSTRAINED: 'Under Constrained',
    OVER_CONSTRAINED: 'Over Constrained',
} as const;

export function StatusBar() {
    const dof = useDOFCount();
    const status = useConstraintStatus();
    const entities = useCadStore(s => s.entities);
    const constraints = useCadStore(s => s.constraints);
    const snapEnabled = useCadStore(s => s.snapEnabled);
    const orthoEnabled = useCadStore(s => s.orthoEnabled);
    const showGrid = useCadStore(s => s.showGrid);
    const cursorWorld = useCadStore(s => s.cursorWorld);
    const activeCommand = useCadStore(s => s.activeCommand);
    const commandPrompt = useCadStore(s => s.commandPrompt);

    return (
        <div className="flex items-center h-8 bg-[#020408]/80 backdrop-blur-md border-t border-white/5 px-4 gap-6 text-[10px] font-mono select-none shrink-0 text-slate-400">

            {/* Constraint Status */}
            <div className={`flex items-center gap-2 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/5 ${STATUS_COLORS[status]}`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor] ${status === 'FULLY_CONSTRAINED' ? 'bg-green-400' : status === 'OVER_CONSTRAINED' ? 'bg-red-400' : 'bg-amber-400'}`} />
                <span className="tracking-widest uppercase text-[9px]">{STATUS_LABELS[status]}</span>
            </div>

            {/* DOF */}
            <div className="flex items-center gap-2">
                <span className="text-slate-600 uppercase tracking-widest text-[9px]">DOF</span>
                <span className={`font-bold ${STATUS_COLORS[status]}`}>{dof}</span>
            </div>

            <div className="w-[1px] h-3 bg-white/5" />

            {/* Entity / Constraint Count */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                    <span className="text-slate-600 uppercase tracking-widest text-[9px]">Entities</span>
                    <span className="text-slate-300">{entities.length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-slate-600 uppercase tracking-widest text-[9px]">Constraints</span>
                    <span className="text-slate-300">{constraints.length}</span>
                </div>
            </div>

            <div className="w-[1px] h-3 bg-white/5" />

            {/* Toggle Indicators */}
            <div className="flex items-center gap-4">
                <button className={`flex items-center gap-1.5 transition-colors ${snapEnabled ? 'text-cyan-400' : 'text-slate-700 hover:text-slate-500'}`}>
                    <Magnet size={12} strokeWidth={snapEnabled ? 2.5 : 1.5} />
                    <span className="uppercase tracking-[0.2em] text-[9px]">Snap</span>
                </button>
                <button className={`flex items-center gap-1.5 transition-colors ${orthoEnabled ? 'text-cyan-400' : 'text-slate-700 hover:text-slate-500'}`}>
                    <Crosshair size={12} strokeWidth={orthoEnabled ? 2.5 : 1.5} />
                    <span className="uppercase tracking-[0.2em] text-[9px]">Ortho</span>
                </button>
                <button className={`flex items-center gap-1.5 transition-colors ${showGrid ? 'text-cyan-400' : 'text-slate-700 hover:text-slate-500'}`}>
                    <Grid3X3 size={12} strokeWidth={showGrid ? 2.5 : 1.5} />
                    <span className="uppercase tracking-[0.2em] text-[9px]">Grid</span>
                </button>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Active Command Prompt */}
            {commandPrompt && (
                <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-400 text-[9px] uppercase tracking-[0.2em] animate-in fade-in slide-in-from-right-4">
                    {commandPrompt}
                </div>
            )}

            {/* Cursor Coordinates */}
            <div className="flex items-center gap-3 tabular-nums bg-white/[0.02] px-3 py-1 rounded-md border border-white/5">
                <div className="flex items-center gap-1">
                    <span className="text-slate-600 text-[9px]">X</span>
                    <span className="text-slate-200 w-12 text-right">{cursorWorld.x.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-slate-600 text-[9px]">Y</span>
                    <span className="text-slate-200 w-12 text-right">{cursorWorld.y.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
}

export default StatusBar;
