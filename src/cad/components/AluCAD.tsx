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
import { CadMcpPanel } from './CadMcpPanel';
import { StatusBar } from './StatusBar';
import { ReferenceSidebar } from './ReferenceSidebar';
import { useCadStore } from '../store/cadStore';
import { commandProcessor } from '../commands/CommandProcessor';
import {
    Layers, Settings, MousePointer2, Minus, Pencil, Square, Circle,
    Scissors, Maximize, CornerUpRight, Ruler, Copy, RotateCw, Move,
    FlipHorizontal, Scan, ChevronLeft, ChevronRight, Spline,
    Blend, Pentagon, Grid2X2, RotateCcw, Download, FileText,
    History, Info, Bot, Activity, Hammer as HammerIcon, Hexagon, CircleDot, Wrench
} from 'lucide-react';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDXF } from '../dxf/DxfGenerator';
import { generatePDF } from '../export/PdfGenerator';

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
    { id: 'HEXAGON', label: 'Hexagon (HEX)', Icon: Hexagon, shortcut: 'HEX' },
    { id: 'ARC', label: 'Arc (A)', Icon: Spline, shortcut: 'A' },
] as const;

const MODIFY_TOOLS = [
    { id: 'MOVE', label: 'Move (M)', Icon: Move },
    { id: 'COPY', label: 'Copy (CO)', Icon: Copy },
    { id: 'ROTATE', label: 'Rotate (RO)', Icon: RotateCw },
    { id: 'MIRROR', label: 'Mirror (MI)', Icon: FlipHorizontal },
    { id: 'TRIM', label: 'Trim (TR)', Icon: Scissors },
    { id: 'EXTEND', label: 'Extend (EX)', Icon: Maximize },
    { id: 'OFFSET', label: 'Offset (O)', Icon: CornerUpRight },
    { id: 'FILLET', label: 'Fillet (F)', Icon: Blend },
    { id: 'CHAMFER', label: 'Chamfer (CHA)', Icon: Pentagon },
] as const;

const ARRAY_TOOLS = [
    { id: 'RECTARRAY', label: 'Rectangular Array', Icon: Grid2X2 },
    { id: 'CIRCARRAY', label: 'Circular Array', Icon: RotateCcw },
] as const;

const DIM_TOOLS = [
    { id: 'DIMENSION', label: 'Smart Dimension', Icon: Scan },
    { id: 'DIMENSION_LINEAR', label: 'Linear Dimension', Icon: Ruler },
] as const;

const AI_TOOLS = [
    { id: 'AI_ANALYZE', label: 'AI Stress Analysis', Icon: Activity },
    { id: 'AI_GCODE', label: 'Auto CAM (G-Code)', Icon: HammerIcon },
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
    const { activeCommand, selectedIds, setActiveMcpTool, activeMcpTool } = useCadStore();

    // Auto-open Properties panel when entities selected
    React.useEffect(() => {
        if (selectedIds.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768) {
            setActivePanel('props');
        }
    }, [selectedIds]);

    // Responsive Mobile Handling
    React.useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleResize = () => {
            if (window.innerWidth < 768) {
                setFeatureTreeCollapsed(true);
                setActivePanel(null);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleToolClick = (id: string) => {
        if (id.startsWith('AI_')) {
            setActiveMcpTool(activeMcpTool === id ? null : id);
            return;
        }
        
        setActiveMcpTool(null); // Close panel if regular tool is used
        if (id === 'SELECT') {
            commandProcessor.setActiveCommand(null);
        } else {
            commandProcessor.startCommand(id);
        }
    };

    const handleExportDXF = () => {
        const { entities, layers } = useCadStore.getState();
        const dxfStr = generateDXF(entities, layers);
        const blob = new Blob([dxfStr], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'AluCAD_Export.dxf';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportPDF = async () => {
        const { entities, layers } = useCadStore.getState();
        const canvas = document.getElementById('cad-canvas') as HTMLCanvasElement;
        const pdfBytes = await generatePDF(entities, layers, canvas);
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'AluCAD_Export.pdf';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className={`flex flex-col w-full h-full bg-[#020408] text-slate-300 font-sans selection:bg-cyan-500/30 ${className}`}>
            {/* ─── MAIN WORKSPACE ─── */}
            <div className="flex flex-1 min-h-0 relative">

                <PanelGroup orientation="horizontal" className="h-full">
                    {/* LEFT: Feature Tree Panel */}
                    <Panel
                        defaultSize={15}
                        minSize={10}
                        collapsible
                        className={`bg-[#05090e]/40 backdrop-blur-md border-r border-white/5 flex flex-col transition-all duration-300`}
                    >
                        <FeatureTree />
                    </Panel>

                    <PanelResizeHandle className="w-1.5 hover:w-2 bg-transparent hover:bg-cyan-500/20 transition-all cursor-col-resize active:bg-cyan-500/40 relative z-50 group">
                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/5 group-hover:bg-cyan-500/40" />
                    </PanelResizeHandle>

                    {/* CENTER: Viewport + Toolbar + Command Line */}
                    <Panel className="relative flex flex-col min-w-0 bg-[#020306] z-10">
                        <div className="flex-1 relative overflow-hidden group">

                            {/* Ambient Glows */}
                            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
                            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

                            <CadCanvas className="absolute inset-0 z-10" />

                            {/* Floating Toolbar - Ultra Premium styling */}
                            <AnimatePresence>
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="absolute left-6 top-6 z-20"
                                >
                                    <div className="bg-[#0a0e14]/60 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col w-12 p-1 gap-1 relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.05] before:to-transparent before:pointer-events-none pb-2">
                                        {DRAW_TOOLS.map(t => (
                                            <ToolbarButton
                                                key={t.id}
                                                Icon={t.Icon}
                                                label={t.label}
                                                isActive={activeCommand === t.id || (t.id === 'SELECT' && !activeCommand)}
                                                onClick={() => handleToolClick(t.id)}
                                            />
                                        ))}
                                        <div className="h-px w-6 mx-auto bg-gradient-to-r from-transparent via-white/20 to-transparent my-1.5" />
                                        {MODIFY_TOOLS.map(t => (
                                            <ToolbarButton
                                                key={t.id}
                                                Icon={t.Icon}
                                                label={t.label}
                                                isActive={activeCommand === t.id}
                                                onClick={() => handleToolClick(t.id)}
                                            />
                                        ))}
                                        <div className="h-px w-6 mx-auto bg-gradient-to-r from-transparent via-white/20 to-transparent my-1.5" />
                                        {DIM_TOOLS.map(t => (
                                            <ToolbarButton
                                                key={t.id}
                                                Icon={t.Icon}
                                                label={t.label}
                                                isActive={activeCommand === t.id}
                                                onClick={() => handleToolClick(t.id)}
                                            />
                                        ))}
                                        <div className="h-px w-6 mx-auto bg-gradient-to-r from-transparent via-white/20 to-transparent my-1.5" />
                                        {ARRAY_TOOLS.map(t => (
                                            <ToolbarButton
                                                key={t.id}
                                                Icon={t.Icon}
                                                label={t.label}
                                                isActive={activeCommand === t.id}
                                                onClick={() => handleToolClick(t.id)}
                                            />
                                        ))}
                                        <div className="h-px w-6 mx-auto bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent my-1.5" />
                                        {AI_TOOLS.map(t => (
                                            <ToolbarButton
                                                key={t.id}
                                                Icon={t.Icon}
                                                label={t.label}
                                                isActive={activeMcpTool === t.id}
                                                onClick={() => handleToolClick(t.id)}
                                                isAiTool={true}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Viewport Info Overlay (Avant-Garde) */}
                            <div className="absolute right-6 top-6 flex flex-col gap-3 pointer-events-none z-30">
                                <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full flex items-center gap-4 shadow-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00e5ff]" />
                                        <span className="text-[10px] font-mono tracking-widest text-slate-300 uppercase drop-shadow">WCS Active</span>
                                    </div>
                                    <div className="w-[1px] h-3 bg-white/10" />
                                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">Drafting 2D</span>
                                </div>

                                <div className="bg-[#0a0e14]/80 backdrop-blur-md border border-white/5 px-4 py-1.5 rounded-lg flex flex-col shadow-lg items-end self-end">
                                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-0.5">Engine</span>
                                    <span className="text-[10px] font-mono text-cyan-50/80 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1 h-1 bg-green-400 rounded-full" /> Hardware Accel
                                    </span>
                                </div>
                            </div>
                            
                            {/* AI MCP Overlay Panel */}
                            <CadMcpPanel />
                        </div>

                        {/* Professional Embedded Command Line */}
                        <div className="h-40 border-t border-cyan-900/30 bg-[#05080f]/80 backdrop-blur-2xl shrink-0 overflow-hidden shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20">
                            <CommandLine className="w-full h-full" />
                        </div>
                    </Panel>

                    <PanelResizeHandle className="w-1.5 hover:w-2 bg-transparent hover:bg-cyan-500/20 transition-all cursor-col-resize active:bg-cyan-500/40 relative z-50 group">
                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-cyan-900/30 group-hover:bg-cyan-500/80 shadow-[0_0_10px_rgba(0,229,255,0.5)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </PanelResizeHandle>

                    {/* RIGHT: Property / Layers Panel */}
                    <Panel
                        defaultSize={20}
                        minSize={15}
                        collapsible
                        collapsedSize={0}
                        className="bg-[#05080f]/60 backdrop-blur-2xl border-l border-cyan-900/30 flex flex-col z-30 transition-all duration-500 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                        <div className="flex flex-col h-full overflow-hidden relative z-10">
                            {/* Panel Switcher Tabs */}
                            <div className="flex border-b border-white/10 text-[9px] font-mono tracking-[0.2em] uppercase bg-black/40">
                                <button
                                    onClick={() => setActivePanel('layers')}
                                    className={`flex-1 py-4 transition-all relative ${activePanel === 'layers' ? 'text-cyan-400 bg-cyan-900/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                                >
                                    Layers
                                    {activePanel === 'layers' && (
                                        <motion.div layoutId="activeTabProp" className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_10px_#00e5ff]" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setActivePanel('props')}
                                    className={`flex-1 py-4 transition-all relative ${activePanel === 'props' ? 'text-cyan-400 bg-cyan-900/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                                >
                                    Properties
                                    {activePanel === 'props' && (
                                        <motion.div layoutId="activeTabProp" className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_10px_#00e5ff]" />
                                    )}
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                                <AnimatePresence mode="wait">
                                    {activePanel === 'layers' && (
                                        <motion.div key="layers" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                                            <LayerManager />
                                        </motion.div>
                                    )}
                                    {activePanel === 'props' && (
                                        <motion.div key="props" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                                            <PropertiesPanel />
                                        </motion.div>
                                    )}
                                    {!activePanel && (
                                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center p-8 opacity-40 text-center">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden">
                                                <div className="absolute inset-0 bg-cyan-500/10" />
                                                <Info size={28} className="text-cyan-500" strokeWidth={1.5} />
                                            </div>
                                            <p className="text-[10px] leading-relaxed uppercase tracking-widest font-mono text-slate-400">Select an entity or use the toolbar to start creating geometry.</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Quick Export Strip */}
                            <div className="p-4 border-t border-white/10 flex items-center justify-between gap-3 bg-black/40 backdrop-blur-md">
                                <button onClick={handleExportPDF} className="group relative flex-1 py-3 rounded-xl bg-gradient-to-b from-white/10 to-transparent hover:from-white/20 border border-white/10 text-[10px] font-mono uppercase tracking-widest transition-all text-slate-300 hover:text-white flex items-center justify-center gap-2 overflow-hidden">
                                    <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 transition-colors" />
                                    <FileText size={14} className="group-hover:text-red-400 transition-colors" /> PDF
                                </button>
                                <button onClick={handleExportDXF} className="group relative flex-1 py-3 rounded-xl bg-gradient-to-b from-cyan-900/30 to-transparent hover:from-cyan-900/50 border border-cyan-500/20 text-[10px] font-mono uppercase tracking-widest transition-all text-cyan-500 hover:text-cyan-300 flex items-center justify-center gap-2 overflow-hidden shadow-[0_0_15px_rgba(0,229,255,0.1)] group-hover:shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                                    <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-colors" />
                                    <Download size={14} className="drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]" /> DXF
                                </button>
                            </div>
                        </div>
                    </Panel>
                </PanelGroup>

                {/* Floating Elements */}
                <ReferenceSidebar />
            </div>

            {/* ─── BOTTOM: Status Bar ─── */}
            <StatusBar />

            {/* Float HUD for alerts (Undo/Redo/Commands) */}
            <HudAlert />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// TOOLBAR BUTTON
// ═══════════════════════════════════════════════════════════════

function ToolbarButton({ Icon, label, isActive, onClick, isAiTool }: {
    Icon: React.ComponentType<{ size?: number, className?: string }>;
    label: string;
    isActive?: boolean;
    onClick: () => void;
    isAiTool?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`
                w-full aspect-square flex items-center justify-center rounded-md transition-all my-0.5
                ${isActive
                    ? isAiTool 
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 ring-1 ring-cyan-500/30 shadow-[0_0_20px_rgba(0,229,255,0.4)]'
                        : 'bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] ring-1 ring-white/10'
                    : isAiTool
                        ? 'text-cyan-600/60 hover:text-cyan-400 hover:bg-cyan-500/10 border border-transparent'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent translate-y-0 active:translate-y-0.5'
                }
            `}
            title={label}
        >
            <Icon size={18} className={isAiTool ? "drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]" : ""} />
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════
// HUD ALERT
// ═══════════════════════════════════════════════════════════════

function HudAlert() {
    // This will listen to global events or store state for undo/redo
    const { activeCommand } = useCadStore();

    return (
        <AnimatePresence>
            {activeCommand && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100]"
                >
                    <div className="bg-cyan-500/20 backdrop-blur-3xl border border-cyan-500/30 px-6 py-2 rounded-full shadow-[0_0_30px_rgba(0,229,255,0.2)]">
                        <div className="flex items-center gap-3">
                            <Info size={14} className="text-cyan-400" />
                            <span className="text-[10px] font-mono tracking-[0.2em] text-cyan-400 uppercase">CMD: {activeCommand}</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default AluCAD;
