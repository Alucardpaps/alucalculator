'use client';

/**
 * AluCalc OS v5.0 — Workspace Page
 * 
 * Restored 3D Engineering Workspace.
 * Layout: Header (top) | Palette (left) | 3D Canvas (center) | Properties/BOM (right)
 */

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ComponentPalette } from '@/components/ui/workspace/ComponentPalette';
import { BOMPanel } from '@/components/ui/workspace/BOMPanel';
import { AssemblyPropertiesPanel } from '@/components/ui/workspace/AssemblyPropertiesPanel';
import { WorkspaceHeader } from '@/components/ui/workspace/WorkspaceHeader';
import { useAssemblyStore } from '@/lib/store/assemblyStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Cpu, GraduationCap, ChevronRight, X, ShieldAlert, Wrench, Settings, Layers } from 'lucide-react';

// Dynamic import for R3F (no SSR)
const AssemblyScene = dynamic(
  () => import('@/components/scene/AssemblyScene').then((m) => ({ default: m.AssemblyScene })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#080c12]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-t-[#00e5ff] border-white/10 rounded-full animate-spin mx-auto" />
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
            Loading 3D Assembly Engine...
          </p>
        </div>
      </div>
    ),
  }
);

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<'props' | 'bom'>('props');
  const selectedId = useAssemblyStore((s) => s.selectedId);

  // Auto-switch to props when something is selected
  React.useEffect(() => {
    if (selectedId) setActiveTab('props');
  }, [selectedId]);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#0a0e14]">
      {/* Header */}
      <WorkspaceHeader />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Component Palette */}
        <div className="w-56 shrink-0 border-r border-white/5 bg-[#0a0e14]/50 backdrop-blur-md overflow-hidden">
          <ComponentPalette />
        </div>

        {/* Center: 3D Canvas */}
        <div className="flex-1 relative flex flex-col">
          <div className="flex-1 relative">
            <AssemblyScene />

            {/* Floating Workspace Info */}
            <div className="absolute top-4 left-4 pointer-events-none z-20">
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full flex items-center gap-4">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_#3b82f6]" />
                 <span className="text-[10px] font-mono tracking-widest text-slate-300 uppercase">3D PROTOTYPE ENGINE v5.0</span>
              </div>
            </div>

            {/* Floating Keyboard Shortcuts Help */}
            <div className="absolute bottom-4 left-4 z-20 px-4 py-3 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10">
              <div className="flex items-center gap-6 text-[10px] font-mono text-white/40 mb-1">
                <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 text-white/60 mr-1.5">LMB</kbd>Select / Drag</span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 text-white/60 mr-1.5">RMB</kbd>Orbit</span>
              </div>
            </div>


          </div>

          {/* Expert Command Ribbon (Phase 3 Integration) */}
          <div className="h-16 border-t border-white/5 bg-[#080c12]/80 backdrop-blur-3xl flex items-center px-6 justify-between">
             <div className="flex items-center gap-8">
               <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                 <span className="text-[10px] font-mono text-emerald-500/70 uppercase">Kernel v5.0.1 Stable</span>
               </div>
             </div>
             <div className="flex items-center gap-4">
               <button className="p-2 text-slate-500 hover:text-white transition-colors"><Settings size={18} /></button>
               <div className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest">Export BOM</div>
             </div>
          </div>
        </div>

        {/* Right: Properties & BOM Panel */}
        <div className="w-72 shrink-0 border-l border-white/5 bg-[#0a0e14]/80 backdrop-blur-2xl flex flex-col">
          {/* Tab Switcher */}
          <div className="flex border-b border-white/5 bg-black/20">
            <button 
              onClick={() => setActiveTab('props')}
              className={`flex-1 py-4 text-[10px] font-mono uppercase tracking-widest transition-all relative ${activeTab === 'props' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Properties
              {activeTab === 'props' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
            </button>
            <button 
              onClick={() => setActiveTab('bom')}
              className={`flex-1 py-4 text-[10px] font-mono uppercase tracking-widest transition-all relative ${activeTab === 'bom' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              BOM
              {activeTab === 'bom' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'props' ? (
                <motion.div key="props" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                  <AssemblyPropertiesPanel />
                </motion.div>
              ) : (
                <motion.div key="bom" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                  <BOMPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
