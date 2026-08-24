/**
 * AluCAD Studio - Unified 2D CAD Interface
 * Matching the sleek, dark glass theme with top-centered floating tool ribbon,
 * unified right sidebar (Layers & Feature Tree), and embedded command bar.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { LayerManager } from './LayerManager';
import { PropertiesPanel } from './PropertiesPanel';
import { FeatureTree } from './FeatureTree';
import { ToolPropertyPanel } from './ToolPropertyPanel';
import { CadMcpPanel } from './CadMcpPanel';
import { AegisFloatingWidget } from '@/components/copilot/AegisFloatingWidget';
import { useCadStore, useDOFCount, useConstraintStatus } from '../store/cadStore';
import { commandProcessor } from '../commands/CommandProcessor';
import {
  MousePointer2, Minus, Pencil, Square, Circle,
  Scissors, Maximize, CornerUpRight, Ruler, Copy, RotateCw, Move,
  FlipHorizontal, Scan, Spline, Blend, Pentagon, Hexagon,
  Download, FileText, Printer, Magnet, Keyboard, Box,
  Crosshair, Grid3X3, Layers as LayersIcon, Sliders, Type, Cog, Nut, HelpCircle,
  Folder, Lock, CheckCircle2, ChevronRight, ChevronDown, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDXF } from '../dxf/DxfGenerator';
import { generatePDF } from '../export/PdfGenerator';

// Dynamic import to avoid Paper.js SSR issues
const CadCanvas = dynamic(() => import('./CadCanvas').then((mod) => mod.CadCanvas), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#07090e]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 border-2 border-t-cyan-400 border-white/10 rounded-full animate-spin" />
        <span className="text-xs font-mono text-cyan-400/80 uppercase tracking-widest">
          Loading 2D AluCAD Engine...
        </span>
      </div>
    </div>
  ),
});

// ═══════════════════════════════════════════════════════════════
// HORIZONTAL DRAWING TOOL RIBBON DEFINITION
// ═══════════════════════════════════════════════════════════════

const PRIMARY_TOOLS = [
  { id: 'SELECT', label: 'Select (ESC)', Icon: MousePointer2, shortcut: 'Esc' },
  { id: 'LINE', label: 'Line (L)', Icon: Minus, shortcut: 'L' },
  { id: 'CIRCLE', label: 'Circle (C)', Icon: Circle, shortcut: 'C' },
  { id: 'ARC', label: 'Arc (A)', Icon: Spline, shortcut: 'A' },
  { id: 'PLINE', label: 'Polyline (PL)', Icon: Pencil, shortcut: 'PL' },
  { id: 'RECTANGLE', label: 'Rectangle (REC)', Icon: Square, shortcut: 'REC' },
  { id: 'HEXAGON', label: 'Hexagon (HEX)', Icon: Hexagon, shortcut: 'HEX' },
] as const;

const MODIFY_TOOLS = [
  { id: 'DIMENSION', label: 'Dimension (DIM)', Icon: Scan, shortcut: 'DIM' },
  { id: 'MOVE', label: 'Move (M)', Icon: Move, shortcut: 'M' },
  { id: 'ROTATE', label: 'Rotate (RO)', Icon: RotateCw, shortcut: 'RO' },
  { id: 'SCALE', label: 'Scale (SC)', Icon: Maximize, shortcut: 'SC' },
  { id: 'MIRROR', label: 'Mirror (MI)', Icon: FlipHorizontal, shortcut: 'MI' },
  { id: 'TRIM', label: 'Trim (TR)', Icon: Scissors, shortcut: 'TR' },
  { id: 'FILLET', label: 'Fillet (F)', Icon: Blend, shortcut: 'F' },
  { id: 'OFFSET', label: 'Offset (O)', Icon: CornerUpRight, shortcut: 'O' },
  { id: 'TEXT', label: 'Text (T)', Icon: Type, shortcut: 'T' },
] as const;

const MECHANICAL_TOOLS = [
  { id: 'GEAR', label: 'Gear (G)', Icon: Cog, shortcut: 'G' },
  { id: 'FASTENER', label: 'Bolt / Fastener (BOLT)', Icon: Nut, shortcut: 'BOLT' },
  { id: 'PLOT', label: 'Plot / Print', Icon: Printer, shortcut: 'PLOT' },
] as const;

interface AluCADProps {
  className?: string;
}

export function AluCAD({ className = '' }: AluCADProps) {
  const [activeTab, setActiveTab] = useState<'layers' | 'props'>('layers');
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const commandInputRef = useRef<HTMLInputElement>(null);

  const {
    activeCommand,
    selectedIds,
    entities,
    snapEnabled,
    toggleSnap,
    orthoEnabled,
    toggleOrtho,
    showGrid,
    toggleGrid,
    cursorWorld,
    commandPrompt,
  } = useCadStore();

  const dof = useDOFCount();
  const constraintStatus = useConstraintStatus();

  // Auto-switch to Properties tab when entity is selected
  useEffect(() => {
    if (selectedIds.length > 0) {
      setActiveTab('props');
    }
  }, [selectedIds]);

  const handleToolClick = (id: string) => {
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

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = commandInput.trim().toUpperCase();
    if (!val) {
      if (activeCommand) {
        commandProcessor.getActiveCommand()?.onKeyInput('Enter');
      }
      return;
    }
    if (activeCommand) {
      commandProcessor.handleValueInput(val);
    } else {
      commandProcessor.startCommand(val);
    }
    setCommandInput('');
  };

  return (
    <div className={`relative flex flex-col w-full h-full bg-[#080a11] text-slate-300 font-sans select-none overflow-hidden ${className}`}>
      {/* ─── 1. TOP HEADER NAVIGATION ─── */}
      <header className="flex-none h-12 border-b border-white/5 bg-[#0b0e17]/95 backdrop-blur-xl flex items-center justify-between px-4 z-40">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.2)]">
            <Pencil size={14} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white">AluCAD Studio</span>
            <span className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-widest hidden sm:inline">Drafting</span>
            <span className="text-[9px] font-mono text-slate-500 ml-2 hidden md:inline">{entities.length} entities</span>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2">
          {/* Snap Mode Toggle */}
          <button
            type="button"
            onClick={toggleSnap}
            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
              snapEnabled
                ? 'bg-blue-600/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                : 'bg-white/5 text-slate-500 border-white/10 hover:text-slate-300'
            }`}
          >
            <Magnet size={13} />
            <span>SNAP {snapEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Grid Toggle */}
          <button
            type="button"
            onClick={toggleGrid}
            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
              showGrid
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                : 'bg-white/5 text-slate-500 border-white/10 hover:text-slate-300'
            }`}
          >
            <Grid3X3 size={13} />
            <span className="hidden sm:inline">GRID</span>
          </button>

          {/* Shortcuts Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowShortcuts((s) => !s)}
            className="px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider border border-white/10 bg-white/5 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all flex items-center gap-1.5"
            title="Keyboard Shortcuts"
          >
            <Keyboard size={13} />
            <span className="hidden md:inline">SHORTCUTS</span>
          </button>

          {/* Import DXF */}
          <button
            type="button"
            onClick={() => {
              const fileInput = document.createElement('input');
              fileInput.type = 'file';
              fileInput.accept = '.dxf,.json';
              fileInput.onchange = (e: any) => {
                const file = e.target.files?.[0];
                if (file) {
                  alert(`Loaded 2D CAD file: ${file.name}`);
                }
              };
              fileInput.click();
            }}
            className="px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition-all flex items-center gap-1.5"
          >
            <Download size={13} className="rotate-180" />
            <span className="hidden sm:inline">IMPORT</span>
          </button>

          {/* Export DXF */}
          <button
            type="button"
            onClick={handleExportDXF}
            className="px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
          >
            <Download size={13} />
            <span>DXF</span>
          </button>

          {/* Sync to 3D Design Studio */}
          <button
            type="button"
            onClick={() => {
              window.location.href = '/design-studio';
            }}
            className="px-3 py-1.5 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider border border-blue-500/40 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 shadow-[0_0_12px_rgba(37,99,235,0.25)] transition-all flex items-center gap-1.5"
          >
            <Box size={13} />
            <span className="hidden sm:inline">SYNC TO 3D</span>
          </button>

          {/* Toggle Right Panel */}
          <button
            type="button"
            onClick={() => setShowRightSidebar((s) => !s)}
            className={`p-1.5 rounded-xl border transition-all ${
              showRightSidebar
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
            title="Toggle Sidebar"
          >
            <LayersIcon size={14} />
          </button>
        </div>
      </header>

      {/* Shortcuts Popup Floating Dialog */}
      {showShortcuts && (
        <div className="absolute top-14 right-4 z-50 w-72 bg-[#0c101a]/95 border border-cyan-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl text-[11px] font-mono space-y-1.5 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between text-cyan-400 font-black uppercase tracking-widest mb-2 border-b border-white/10 pb-1.5">
            <span>CAD SHORTCUTS</span>
            <button onClick={() => setShowShortcuts(false)} className="text-slate-500 hover:text-white">✕</button>
          </div>
          {[
            ['L', 'Line'],
            ['C', 'Circle'],
            ['REC', 'Rectangle'],
            ['PL', 'Polyline'],
            ['M', 'Move'],
            ['CO', 'Copy'],
            ['TR', 'Trim'],
            ['F', 'Fillet'],
            ['DIM', 'Dimension'],
            ['G', 'Involute Gear'],
            ['Esc', 'Select / Cancel'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-slate-400 hover:text-slate-200">
              <span>{v}</span>
              <span className="text-cyan-400 font-bold bg-white/5 px-1.5 rounded">{k}</span>
            </div>
          ))}
        </div>
      )}

      {/* ─── 2. MAIN CAD WORKSPACE (CANVAS + FLOATING TOOLBAR + RIGHT SIDEBAR) ─── */}
      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        {/* ─── CENTER: 2D PAPER.JS CAD CANVAS ─── */}
        <div className="relative flex-1 h-full min-w-0 bg-[#07090e] overflow-hidden">
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute top-[-15%] right-[-10%] w-[45%] h-[45%] bg-cyan-900/10 rounded-full blur-[140px] pointer-events-none z-0" />
          <div className="absolute bottom-[-15%] left-[-10%] w-[45%] h-[45%] bg-blue-900/10 rounded-full blur-[140px] pointer-events-none z-0" />

          {/* Cad Canvas */}
          <CadCanvas className="absolute inset-0 z-10" />

          {/* ─── TOP-CENTERED FLOATING DRAWING TOOL RIBBON (THE PILL) ─── */}
          <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="pointer-events-auto flex items-center p-1 rounded-2xl bg-[#0d111d]/90 backdrop-blur-2xl border border-white/10 shadow-[0_12px_45px_rgba(0,0,0,0.7)] gap-0.5">
              {/* Primary Draw Tools */}
              {PRIMARY_TOOLS.map((t) => {
                const isActive = activeCommand === t.id || (t.id === 'SELECT' && !activeCommand);
                const Icon = t.Icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleToolClick(t.id)}
                    className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-[0_0_14px_rgba(37,99,235,0.7)] ring-1 ring-blue-400/50'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={t.label}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}

              {/* Vertical Divider */}
              <div className="h-5 w-[1px] bg-white/10 mx-1" />

              {/* Modify Tools */}
              {MODIFY_TOOLS.map((t) => {
                const isActive = activeCommand === t.id;
                const Icon = t.Icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleToolClick(t.id)}
                    className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-[0_0_14px_rgba(37,99,235,0.7)] ring-1 ring-blue-400/50'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={t.label}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}

              {/* Vertical Divider */}
              <div className="h-5 w-[1px] bg-white/10 mx-1" />

              {/* Mechanical & Annotation Tools */}
              {MECHANICAL_TOOLS.map((t) => {
                const isActive = activeCommand === t.id;
                const Icon = t.Icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleToolClick(t.id)}
                    className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-[0_0_14px_rgba(37,99,235,0.7)] ring-1 ring-blue-400/50'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={t.label}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tool Dynamic Parameter Panel */}
          <AnimatePresence>
            {activeCommand && <ToolPropertyPanel />}
          </AnimatePresence>

          {/* AI MCP Analysis Overlay */}
          <CadMcpPanel />
        </div>

        {/* ─── RIGHT: UNIFIED LAYERS & FEATURE TREE / PROPERTIES SIDEBAR ─── */}
        {showRightSidebar && (
          <aside className="w-80 border-l border-white/5 bg-[#0b0e17]/95 backdrop-blur-2xl flex flex-col z-30 shadow-[-15px_0_40px_rgba(0,0,0,0.5)]">
            {/* Top Tab Switcher: [Layers] | [Properties] */}
            <div className="flex border-b border-white/5 bg-black/40 text-[10px] font-mono tracking-[0.2em] uppercase">
              <button
                type="button"
                onClick={() => setActiveTab('layers')}
                className={`flex-1 py-3 text-center transition-all relative ${
                  activeTab === 'layers'
                    ? 'text-cyan-400 font-bold bg-cyan-500/10'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                Layers
                {activeTab === 'layers' && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 inset-x-0 h-[2px] bg-cyan-400 shadow-[0_0_8px_#00e5ff]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('props')}
                className={`flex-1 py-3 text-center transition-all relative ${
                  activeTab === 'props'
                    ? 'text-cyan-400 font-bold bg-cyan-500/10'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                Properties
                {activeTab === 'props' && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 inset-x-0 h-[2px] bg-cyan-400 shadow-[0_0_8px_#00e5ff]" />
                )}
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col">
              {activeTab === 'layers' ? (
                <div className="flex flex-col h-full divide-y divide-white/5">
                  {/* Top: Layer Manager */}
                  <div className="h-1/2 min-h-[160px] overflow-hidden flex flex-col">
                    <LayerManager />
                  </div>

                  {/* Bottom: Feature Tree */}
                  <div className="h-1/2 min-h-[220px] overflow-y-auto flex flex-col bg-black/20">
                    <FeatureTree />
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  <PropertiesPanel />
                </div>
              )}
            </div>

            {/* Quick Export Strip at Sidebar Bottom */}
            <div className="p-3 border-t border-white/5 bg-black/40 flex items-center gap-2">
              <button
                type="button"
                onClick={() => commandProcessor.startCommand('PLOT')}
                className="flex-1 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
              >
                <Printer size={12} /> PLOT
              </button>
              <button
                type="button"
                onClick={handleExportDXF}
                className="flex-1 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
              >
                <Download size={12} /> DXF
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ─── 3. BOTTOM COMMAND BAR & STATUS BAR ─── */}
      <footer className="flex-none h-10 border-t border-white/5 bg-[#090b13]/95 backdrop-blur-xl flex items-center justify-between px-4 z-40 gap-4">
        {/* Left: AutoCAD Style Command Line Input */}
        <form onSubmit={handleCommandSubmit} className="flex items-center gap-2 flex-1 max-w-xl">
          <span className="text-[11px] font-mono font-bold text-cyan-400 whitespace-nowrap">
            CAD &gt;
          </span>
          <input
            ref={commandInputRef}
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder={commandPrompt || 'Type a command (e.g. LINE, CIRCLE, TRIM)...'}
            className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-white placeholder:text-slate-600 focus:placeholder:text-slate-500"
          />
        </form>

        {/* Right: Mode Indicators, Coordinates, AeGiS Widget */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 shrink-0">
          {/* Constraint Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white/[0.03] px-2 py-0.5 rounded-lg border border-white/5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                constraintStatus === 'FULLY_CONSTRAINED'
                  ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                  : constraintStatus === 'OVER_CONSTRAINED'
                  ? 'bg-rose-400'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">
              {constraintStatus === 'FULLY_CONSTRAINED'
                ? '100% Fully Constrained'
                : `DOF: ${dof}`}
            </span>
          </div>

          {/* Mode Toggles */}
          <button
            type="button"
            onClick={toggleGrid}
            className={`px-1.5 py-0.5 rounded border transition-colors ${
              showGrid ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'text-slate-600 border-transparent hover:text-slate-400'
            }`}
          >
            GRID
          </button>
          <button
            type="button"
            onClick={toggleOrtho}
            className={`px-1.5 py-0.5 rounded border transition-colors ${
              orthoEnabled ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'text-slate-600 border-transparent hover:text-slate-400'
            }`}
          >
            ORTHO
          </button>
          <button
            type="button"
            onClick={toggleSnap}
            className={`px-1.5 py-0.5 rounded border transition-colors ${
              snapEnabled ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'text-slate-600 border-transparent hover:text-slate-400'
            }`}
          >
            SNAP
          </button>

          {/* Coordinates Readout */}
          <div className="flex items-center gap-2 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 font-mono text-cyan-300 text-[10px]">
            <span>X: {cursorWorld.x.toFixed(2)}</span>
            <span>Y: {cursorWorld.y.toFixed(2)}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AluCAD;
