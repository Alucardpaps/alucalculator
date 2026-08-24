'use client';

/**
 * 🪟 SPLIT VIEWPORT
 * 
 * Professional engineering layout inspired by AutoCAD/Fusion360.
 * Uses react-resizable-panels for flexible workspace management.
 */

import React from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { Technical2D } from './components/Technical2D';
import { Viewport3D } from './components/Viewport3D';
import { ValidationPanel } from './components/ValidationPanel';
import { LayoutGrid, Cuboid, Activity, Settings2, Maximize2 } from 'lucide-react';

export default function SplitViewport() {
    return (
        <div className="w-full h-full flex flex-col bg-[#05090e] text-slate-300 font-sans select-none overflow-hidden">

            {/* 1. TOP STATUS BAR (Integrated into Ribbon or separate here) */}
            <div className="h-10 bg-[#0f1419] border-b border-[#1e2833] flex items-center px-4 justify-between z-20">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-2 py-1 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded text-[10px] text-green-400 font-bold uppercase tracking-widest">
                        <Activity size={12} />
                        Solver Active
                    </div>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                    <span>GRID: 10.0mm</span>
                    <span className="text-[#1e2833]">|</span>
                    <span>SNAP: ON</span>
                    <span className="text-[#1e2833]">|</span>
                    <span>ORTHO: OFF</span>
                </div>
            </div>

            {/* 2. MAIN WORKSPACE (Resizable) */}
            <div className="flex-1 relative">
                <Group orientation="vertical">

                    {/* TOP HALF: Drawing Areas (Split Horizontally) */}
                    <Panel defaultSize={75} minSize={30}>
                        <Group orientation="horizontal">

                            {/* LEFT: 2D Engineering View */}
                            <Panel defaultSize={50} minSize={20}>
                                <div className="w-full h-full bg-[#080c10] relative flex flex-col border-r border-[#1e2833]/50">
                                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-2 py-1 bg-black/40 backdrop-blur rounded border border-white/5 shadow-xl">
                                        <LayoutGrid size={14} className="text-cyan-400" />
                                        <span className="text-[10px] font-bold uppercase tracking-tighter text-cyan-50 opacity-80">Top View (2D)</span>
                                    </div>
                                    <Technical2D />
                                </div>
                            </Panel>

                            <Separator className="w-1 bg-[#1e2833] hover:bg-cyan-500/50 transition-colors cursor-col-resize relative z-10">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 bg-[#0f1419] border border-[#1e2833] rounded-sm flex items-center justify-center">
                                    <div className="h-3 w-px bg-slate-700" />
                                </div>
                            </Separator>

                            {/* RIGHT: 3D Visualization */}
                            <Panel defaultSize={50} minSize={20}>
                                <div className="w-full h-full bg-[#080c10] relative flex flex-col">
                                    <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-2 py-1 bg-black/40 backdrop-blur rounded border border-white/5 shadow-xl">
                                        <Cuboid size={14} className="text-amber-400" />
                                        <span className="text-[10px] font-bold uppercase tracking-tighter text-amber-50 opacity-80">Iso Perspective (3D)</span>
                                    </div>
                                    <Viewport3D />
                                </div>
                            </Panel>

                        </Group>
                    </Panel>

                    <Separator className="h-1 bg-[#1e2833] hover:bg-cyan-500/50 transition-colors cursor-row-resize relative z-10">
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-8 bg-[#0f1419] border border-[#1e2833] rounded-sm flex items-center justify-center">
                            <div className="w-3 h-px bg-slate-700" />
                        </div>
                    </Separator>

                    {/* BOTTOM HALF: Validation & Console */}
                    <Panel defaultSize={25} minSize={15}>
                        <div className="w-full h-full bg-[#0a0e14]">
                            <ValidationPanel />
                        </div>
                    </Panel>

                </Group>
            </div>

            {/* 3. FOOTER INFO */}
            <div className="h-6 bg-[#0f1419] border-t border-[#1e2833] flex items-center px-4 justify-between gap-4">
                <div className="flex items-center gap-3 text-[9px] font-mono text-gray-600">
                    <span className="text-cyan-600">READY</span>
                    <span>X: 0.000</span>
                    <span>Y: 0.000</span>
                    <span>Z: 0.000</span>
                </div>
                <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                    ALUCAD CORE V1.0 • PENDING CHANGES
                </div>
            </div>

        </div>
    );
}
