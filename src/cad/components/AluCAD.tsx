/**
 * AluCAD Wrapper - Complete CAD Interface
 * 
 * Professional 2D CAD environment with:
 * - Paper.js canvas with infinite grid
 * - Floating vertical toolbar for quick drawing access
 * - AutoCAD-style command line
 * - Layer manager & Properties panel
 * - Coordinate readout overlay
 */

'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { CommandLine } from './CommandLine';
import { LayerManager } from './LayerManager';
import { PropertiesPanel } from './PropertiesPanel';
import { FeatureTree } from './FeatureTree';
import { StatusBar } from './StatusBar';
import { useCadStore } from '../store/cadStore';
import { commandProcessor } from '../commands/CommandProcessor';
import {
    Layers, Settings, MousePointer2, Minus, Pencil, Square, Circle,
    Scissors, Maximize, CornerUpRight, Ruler, Copy, RotateCw,
    FlipHorizontal, Scan, ChevronLeft, ChevronRight
} from 'lucide-react';

// Dynamic import to avoid Paper.js SSR issues
const CadCanvas = dynamic(() => import('./CadCanvas').then(mod => mod.CadCanvas), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-transparent">
            <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-500">Loading CAD Engine...</span>
            </div>
        </div>
    )
});

// ═══════════════════════════════════════════════════════════════
// TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const DRAW_TOOLS = [
    { id: 'SELECT', label: 'Select (ESC)', Icon: MousePointer2, shortcut: 'Esc' },
    { id: 'LINE', label: 'Line (L)', Icon: Minus, shortcut: 'L' },
    { id: 'PLINE', label: 'Polyline (PL)', Icon: Pencil, shortcut: 'PL' },
    { id: 'RECTANGLE', label: 'Rectangle (REC)', Icon: Square, shortcut: 'REC' },
    { id: 'CIRCLE', label: 'Circle (C)', Icon: Circle, shortcut: 'C' },
] as const;

const MODIFY_TOOLS = [
    { id: 'COPY', label: 'Copy (CO)', Icon: Copy },
    { id: 'ROTATE', label: 'Rotate (RO)', Icon: RotateCw },
    { id: 'MIRROR', label: 'Mirror (MI)', Icon: FlipHorizontal },
    { id: 'TRIM', label: 'Trim (TR)', Icon: Scissors },
    { id: 'EXTEND', label: 'Extend (EX)', Icon: Maximize },
    { id: 'OFFSET', label: 'Offset (O)', Icon: CornerUpRight },
] as const;

const DIM_TOOLS = [
    { id: 'DIMENSION', label: 'Smart Dimension', Icon: Scan },
    { id: 'DIMENSION_LINEAR', label: 'Linear Dimension', Icon: Ruler },
] as const;

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

interface AluCADProps {
    className?: string;
}

export function AluCAD({ className }: AluCADProps) {
    const [activePanel, setActivePanel] = useState<'layers' | 'props' | null>(null);
    const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
    const [featureTreeCollapsed, setFeatureTreeCollapsed] = useState(false);
    const { activeCommand } = useCadStore();

    const handleToolClick = (id: string) => {
        if (id === 'SELECT') {
            commandProcessor.setActiveCommand(null);
        } else {
            commandProcessor.startCommand(id);
        }
    };

    return (
        <div className={`flex flex-col w-full h-full ${className}`}>
            {/* ─── MAIN ROW: Feature Tree | Viewport | Right Panel ─── */}
            <div className="flex flex-1 min-h-0">

                {/* LEFT: Feature Tree */}
                {!featureTreeCollapsed && (
                    <div className="w-[240px] shrink-0">
                        <FeatureTree />
                    </div>
                )}

                {/* Feature Tree Toggle */}
                <button
                    onClick={() => setFeatureTreeCollapsed(!featureTreeCollapsed)}
                    className="w-4 shrink-0 flex items-center justify-center bg-[#020408]/60 border-x border-cyan-900/30 hover:bg-[#00e5ff]/10 text-cyan-900/50 hover:text-[#00e5ff] transition-colors"
                    title={featureTreeCollapsed ? 'Show Feature Tree' : 'Hide Feature Tree'}
                >
                    {featureTreeCollapsed ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
                </button>

                {/* CENTER: Viewport + Toolbar + Command Line */}
                <div className="flex-1 relative flex flex-col min-w-0">
                    {/* Canvas Area */}
                    <div className="flex-1 relative min-h-0">
                        <CadCanvas className="absolute inset-0" />

                        {/* Floating Vertical Toolbar */}
                        <div
                            className={`absolute left-3 top-1/2 -translate-y-1/2 z-20 transition-all duration-300 ${toolbarCollapsed ? 'w-8' : 'w-11'}`}
                        >
                            <div className="bg-[#05090e]/95 backdrop-blur-xl border border-cyan-900/40 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                                {/* Collapse Toggle */}
                                <button
                                    onClick={() => setToolbarCollapsed(!toolbarCollapsed)}
                                    className="w-full py-2 flex items-center justify-center text-cyan-900/60 hover:text-[#00e5ff] hover:bg-[#00e5ff]/5 transition-colors border-b border-cyan-900/30"
                                >
                                    {toolbarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                                </button>

                                {!toolbarCollapsed && (
                                    <>
                                        {/* Draw Section */}
                                        <div className="px-1 py-1.5 border-b border-cyan-900/30">
                                            <div className="text-[6px] font-mono text-cyan-900/60 text-center uppercase tracking-[0.2em] mb-1">Draw</div>
                                            {DRAW_TOOLS.map(t => (
                                                <ToolbarButton
                                                    key={t.id}
                                                    Icon={t.Icon}
                                                    label={t.label}
                                                    isActive={activeCommand === t.id || (t.id === 'SELECT' && !activeCommand)}
                                                    onClick={() => handleToolClick(t.id)}
                                                />
                                            ))}
                                        </div>

                                        {/* Modify Section */}
                                        <div className="px-1 py-1.5 border-b border-cyan-900/30">
                                            <div className="text-[6px] font-mono text-cyan-900/60 text-center uppercase tracking-[0.2em] mb-1">Modify</div>
                                            {MODIFY_TOOLS.map(t => (
                                                <ToolbarButton
                                                    key={t.id}
                                                    Icon={t.Icon}
                                                    label={t.label}
                                                    isActive={activeCommand === t.id}
                                                    onClick={() => handleToolClick(t.id)}
                                                />
                                            ))}
                                        </div>

                                        {/* Dim Section */}
                                        <div className="px-1 py-1.5">
                                            <div className="text-[6px] font-mono text-cyan-900/60 text-center uppercase tracking-[0.2em] mb-1">Dim</div>
                                            {DIM_TOOLS.map(t => (
                                                <ToolbarButton
                                                    key={t.id}
                                                    Icon={t.Icon}
                                                    label={t.label}
                                                    isActive={activeCommand === t.id}
                                                    onClick={() => handleToolClick(t.id)}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Embedded Command Line */}
                    <div className="h-24 border-t border-cyan-900/40 bg-[#020408]/80 shrink-0">
                        <CommandLine className="w-full h-full" />
                    </div>
                </div>

                {/* RIGHT: Sidebar toggle buttons + Panel content */}
                <div className="flex shrink-0">
                    {/* Panel Content (collapsible) */}
                    {activePanel === 'layers' && <LayerManager />}
                    {activePanel === 'props' && <PropertiesPanel />}

                    {/* Icon Strip */}
                    <div className="w-10 border-l border-cyan-900/40 bg-[#020408]/80 flex flex-col items-center py-2 gap-2">
                        <button
                            onClick={() => setActivePanel(activePanel === 'layers' ? null : 'layers')}
                            className={`p-2 rounded-lg transition-colors ${activePanel === 'layers' ? 'bg-[#00e5ff]/20 text-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.2)]' : 'text-cyan-900/60 hover:text-[#00e5ff]'}`}
                            title="Layers"
                        >
                            <Layers size={18} />
                        </button>
                        <button
                            onClick={() => setActivePanel(activePanel === 'props' ? null : 'props')}
                            className={`p-2 rounded-lg transition-colors ${activePanel === 'props' ? 'bg-[#00e5ff]/20 text-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.2)]' : 'text-cyan-900/60 hover:text-[#00e5ff]'}`}
                            title="Properties"
                        >
                            <Settings size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── BOTTOM: Status Bar ─── */}
            <StatusBar />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// TOOLBAR BUTTON
// ═══════════════════════════════════════════════════════════════

function ToolbarButton({ Icon, label, isActive, onClick }: {
    Icon: React.ComponentType<{ size?: number }>;
    label: string;
    isActive?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`
                w-full aspect-square flex items-center justify-center rounded-md transition-all my-0.5
                ${isActive
                    ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40 shadow-[0_0_8px_rgba(0,229,255,0.3)]'
                    : 'text-cyan-900/60 hover:text-[#00e5ff] hover:bg-[#00e5ff]/10 border border-transparent border-dashed hover:border-[#00e5ff]/30'
                }
            `}
            title={label}
        >
            <Icon size={16} />
        </button>
    );
}

export default AluCAD;
