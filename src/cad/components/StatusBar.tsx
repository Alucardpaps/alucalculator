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
        <div className="flex items-center h-6 bg-[#0d1117] border-t border-white/10 px-3 gap-4 text-[10px] font-mono select-none shrink-0">

            {/* Constraint Status */}
            <div className={`flex items-center gap-1 ${STATUS_COLORS[status]}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${status === 'FULLY_CONSTRAINED' ? 'bg-green-400' : status === 'OVER_CONSTRAINED' ? 'bg-red-400' : 'bg-amber-400'}`} />
                {STATUS_LABELS[status]}
            </div>

            {/* DOF */}
            <div className="text-slate-500">
                DOF: <span className={STATUS_COLORS[status]}>{dof}</span>
            </div>

            {/* Separator */}
            <div className="w-px h-3 bg-white/10" />

            {/* Entity / Constraint Count */}
            <div className="text-slate-500">
                Ent: <span className="text-slate-300">{entities.length}</span>
                {' · '}
                Con: <span className="text-slate-300">{constraints.length}</span>
            </div>

            {/* Separator */}
            <div className="w-px h-3 bg-white/10" />

            {/* Toggle Indicators */}
            <div className="flex items-center gap-2">
                <span className={`flex items-center gap-0.5 ${snapEnabled ? 'text-cyan-400' : 'text-slate-600'}`}>
                    <Magnet size={10} /> SNAP
                </span>
                <span className={`flex items-center gap-0.5 ${orthoEnabled ? 'text-cyan-400' : 'text-slate-600'}`}>
                    <Crosshair size={10} /> ORTHO
                </span>
                <span className={`flex items-center gap-0.5 ${showGrid ? 'text-cyan-400' : 'text-slate-600'}`}>
                    <Grid3X3 size={10} /> GRID
                </span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Active Command */}
            {activeCommand && (
                <div className="text-cyan-400 truncate max-w-[200px]">
                    {commandPrompt || activeCommand}
                </div>
            )}

            {/* Cursor Coordinates */}
            <div className="text-slate-500 tabular-nums">
                X: <span className="text-slate-300">{cursorWorld.x.toFixed(2)}</span>
                {' '}
                Y: <span className="text-slate-300">{cursorWorld.y.toFixed(2)}</span>
            </div>
        </div>
    );
}

export default StatusBar;
