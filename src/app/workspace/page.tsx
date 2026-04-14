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
  const [showWorkbench, setShowWorkbench] = useState(true);
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

            {/* PHASE 3: MASTER WORKBENCH OVERLAY */}
            <AnimatePresence>
              {showWorkbench && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="absolute inset-8 z-30 rounded-[32px] bg-[#0c1017]/90 backdrop-blur-3xl border border-blue-500/20 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
                >
                  <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                        <Cpu className="text-blue-400" size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white italic tracking-tight">ENGINEERING NEXUS</h2>
                        <p className="text-[10px] font-mono text-blue-400 uppercase tracking-[0.2em]">Phase 3: High-Fidelity Workbench</p>
                      </div>
                    </div>
                    <button onClick={() => setShowWorkbench(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex-1 p-12 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <WorkbenchCard 
                        title="Bearing Dynamics" 
                        icon={<Activity />} 
                        desc="Real-time ISO 281 L10 life calculations integrated with assembly loads."
                        link="/learn/bearing-life-iso-281"
                      />
                      <WorkbenchCard 
                        title="Bolt Strength" 
                        icon={<Wrench />} 
                        desc="Fastener integrity analysis, friction K-factors, and ISO 898-1 compliance."
                        link="/learn/bolt-torque-calculator"
                      />
                      <WorkbenchCard 
                        title="Structural Flow" 
                        icon={<Layers />} 
                        desc="Euler-Bernoulli beam theory and 3D deflection mapping modules."
                        link="/learn/beam-deflection-calculator"
                      />
                    </div>

                    <div className="mt-16 p-8 rounded-[24px] bg-blue-600/5 border border-blue-500/10 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <GraduationCap className="text-blue-400" size={48} />
                        <div>
                          <h3 className="text-lg font-bold text-white uppercase tracking-widest">Academy Linkage</h3>
                          <p className="text-sm text-slate-500">All workbench tools are synchronized with the AluCalc Master Academy.</p>
                        </div>
                      </div>
                      <Link href="/learn" className="px-8 py-4 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-all">Visit Academy</Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Expert Command Ribbon (Phase 3 Integration) */}
          <div className="h-16 border-t border-white/5 bg-[#080c12]/80 backdrop-blur-3xl flex items-center px-6 justify-between">
             <div className="flex items-center gap-8">
               <button onClick={() => setShowWorkbench(true)} className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors">
                 <ShieldAlert size={14} /> Open Workbench
               </button>
               <div className="h-4 w-[1px] bg-white/10" />
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
function DataBit({ label, value }: { label: string; value: string }) {
    return (
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] transition-all">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors">{value}</div>
        </div>
    );
}

function WorkbenchCard({ title, icon, desc, link }: { title: string, icon: any, desc: string, link: string }) {
  return (
    <Link href={link} className="group p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-blue-600/10 hover:border-blue-500/30 transition-all flex flex-col h-full">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.05] group-hover:bg-blue-600/20 flex items-center justify-center text-slate-400 group-hover:text-blue-400 mb-6 transition-all">
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">{desc}</p>
      <div className="flex items-center text-[10px] font-black text-blue-400 uppercase tracking-widest mt-auto opacity-0 group-hover:opacity-100 transition-all">
        Analyze Expert Data <ChevronRight size={14} className="ml-1" />
      </div>
    </Link>
  );
}
