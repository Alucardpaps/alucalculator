'use client';

/**
 * AluCalc OS v5.0 — Workspace Page
 * 
 * Restored 3D Engineering Workspace & Integrated Workstation Tabs.
 */

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ComponentPalette } from '@/components/ui/workspace/ComponentPalette';
import { MassPropertiesHUD } from '@/components/visualizer/MassPropertiesHUD';
import { BOMPanel } from '@/components/ui/workspace/BOMPanel';
import { AssemblyPropertiesPanel } from '@/components/ui/workspace/AssemblyPropertiesPanel';
import { WorkspaceHeader } from '@/components/ui/workspace/WorkspaceHeader';
import { useAssemblyStore } from '@/lib/store/assemblyStore';
import { useWorkspaceTabStore } from '@/lib/store/workspaceTabStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Cpu, GraduationCap, ChevronRight, X, ShieldAlert, Wrench, Settings, Layers } from 'lucide-react';
import { useCalculatorBridge } from '@/hooks/engineering/useCalculatorBridge';
import { InteractiveFormula } from '@/components/os/InteractiveFormula';

// Loading Placeholder for dynamic imports
function ModuleLoading({ label }: { label: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#080c12]">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-t-[#00e5ff] border-white/10 rounded-full animate-spin mx-auto" />
        <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
          {label}
        </p>
      </div>
    </div>
  );
}

// Dynamic import for R3F (no SSR)
const AssemblyScene = dynamic(
  () => import('@/components/scene/AssemblyScene').then((m) => ({ default: m.AssemblyScene })),
  {
    ssr: false,
    loading: () => <ModuleLoading label="Loading 3D Assembly Engine..." />,
  }
);

// Dynamic imports for other workstation tabs
const DragAndBuildModule = dynamic(
  () => import('@/modules/mechanical/DragAndBuild').then((m) => m.default as any),
  {
    ssr: false,
    loading: () => <ModuleLoading label="Loading Machine Builder..." />,
  }
);

const CadEditorModule = dynamic(
  () => import('@/cad/components/AluCAD').then((m) => m.AluCAD),
  {
    ssr: false,
    loading: () => <ModuleLoading label="Loading CAD Editor..." />,
  }
);

const ExcalidrawModule = dynamic(
  () => import('@/components/modules/sketch/ExcalidrawModule').then((m) => m.default),
  {
    ssr: false,
    loading: () => <ModuleLoading label="Loading Sketch Pad..." />,
  }
);

const SimulationFEAModule = dynamic(
  () => import('@/components/modules/mechanical/SimulationFEAModule').then((m) => m.SimulationFEAModule as any),
  {
    ssr: false,
    loading: () => <ModuleLoading label="Loading FEA Simulator..." />,
  }
);

const Nesting2DModule = dynamic<any>(
  () => import('@/components/modules/mechanical/Nesting2DModule').then((m) => m.default),
  {
    ssr: false,
    loading: () => <ModuleLoading label="Loading Nesting Optimizer..." />,
  }
);

const CuttingOptimizerModule = dynamic<any>(
  () => import('@/components/modules/mechanical/CuttingOptimizerModule').then((m) => m.CuttingOptimizerModule),
  {
    ssr: false,
    loading: () => <ModuleLoading label="Loading Cut Optimizer..." />,
  }
);

export default function WorkspacePage() {
  const [activePanelTab, setActivePanelTab] = useState<'props' | 'bom'>('props');
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  const selectedId = useAssemblyStore((s) => s.selectedId);
  const components = useAssemblyStore((s) => s.components);
  const selectedComponent = selectedId ? components[selectedId] : null;
  const initialLength = selectedComponent?.metadata?.length || 500;

  const { activeTab } = useWorkspaceTabStore();
  const bridge = useCalculatorBridge();

  React.useEffect(() => {
    const handleOpenBridge = () => {
      bridge.openBridge();
    };
    window.addEventListener('open-calculator-bridge', handleOpenBridge);
    return () => window.removeEventListener('open-calculator-bridge', handleOpenBridge);
  }, [bridge]);

  // Auto-switch to props when something is selected
  React.useEffect(() => {
    if (selectedId) setActivePanelTab('props');
  }, [selectedId]);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-transparent">
      {/* Header */}
      <WorkspaceHeader />

      {/* Conditionally Render Workstation Screen Content */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {activeTab === '3d-assembly' && (
          <div className="flex-1 flex overflow-hidden relative">
            {/* Mobile Sidebar Backdrop Overlay */}
            {(isLeftSidebarOpen || isRightSidebarOpen) && (
              <div 
                className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
                onClick={() => {
                  setIsLeftSidebarOpen(false);
                  setIsRightSidebarOpen(false);
                }}
              />
            )}

            {/* Left: Component Palette */}
            <div className={`fixed lg:relative inset-y-0 left-0 z-40 w-56 border-r border-white/5 bg-[#0a0e14]/95 lg:bg-[#0a0e14]/50 backdrop-blur-md overflow-hidden transition-transform duration-300 ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shrink-0`}>
              <ComponentPalette />
              {/* Close Button on Mobile */}
              <button 
                onClick={() => setIsLeftSidebarOpen(false)}
                className="absolute top-3 right-3 lg:hidden p-1 rounded bg-white/5 text-white/40 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            {/* Center: 3D Canvas */}
            <div className="flex-1 relative flex flex-col min-w-0">
              <div className="flex-1 relative">
                <AssemblyScene />

                {/* Mobile Drawer Toggles */}
                <div className="absolute top-4 left-4 z-20 flex gap-2 lg:hidden">
                  <button 
                    onClick={() => setIsLeftSidebarOpen(true)}
                    className="p-2 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 text-blue-400 hover:text-white hover:bg-black/80 transition-all flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase"
                  >
                    <Layers size={14} />
                    <span>Components</span>
                  </button>
                </div>

                <div className="absolute top-4 right-4 z-20 flex gap-2 lg:hidden">
                  <button 
                    onClick={() => setIsRightSidebarOpen(true)}
                    className="p-2 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 text-[#00e5ff] hover:text-white hover:bg-black/80 transition-all flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase"
                  >
                    <span>Specs & BOM</span>
                    <Wrench size={14} />
                  </button>
                </div>

                {/* Real-Time Spatial Telemetry HUD Overlay */}
                <div className="absolute top-16 right-4 z-20 w-80 max-w-[calc(100vw-2rem)] pointer-events-auto hidden sm:block lg:block">
                  <MassPropertiesHUD 
                    initialLength={initialLength}
                    initialWidth={selectedComponent?.type === 'profile' ? 40 : 100}
                    initialHeight={selectedComponent?.type === 'profile' ? 40 : 50}
                  />
                </div>

                {/* Floating Workspace Info */}
                <div className="absolute top-16 left-4 pointer-events-none z-20 hidden md:block">
                  <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full flex items-center gap-4">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_#3b82f6]" />
                     <span className="text-[10px] font-mono tracking-widest text-slate-300 uppercase">3D PROTOTYPE ENGINE v5.0</span>
                  </div>
                </div>

                {/* Floating Keyboard Shortcuts Help */}
                <div className="absolute bottom-4 left-4 z-20 px-4 py-3 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 hidden md:block">
                  <div className="flex items-center gap-6 text-[10px] font-mono text-white/40 mb-1">
                    <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 text-white/60 mr-1.5">LMB</kbd>Select / Drag</span>
                    <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 text-white/60 mr-1.5">RMB</kbd>Orbit</span>
                  </div>
                </div>
              </div>

              {/* Expert Command Ribbon (Phase 3 Integration) */}
              <div className="h-16 border-t border-white/5 bg-[#080c12]/80 backdrop-blur-3xl flex items-center px-6 justify-between shrink-0">
                 <div className="flex items-center gap-8">
                   <div className="flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                     <span className="text-[10px] font-mono text-emerald-500/70 uppercase hidden xs:inline">Kernel v5.0.1 Stable</span>
                   </div>
                 </div>
                 <div className="flex items-center gap-4">
                   <button className="p-2 text-slate-500 hover:text-white transition-colors"><Settings size={18} /></button>
                   <div className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-blue-500 transition-colors">Export BOM</div>
                 </div>
              </div>
            </div>

            {/* Right: Properties & BOM Panel */}
            <div className={`fixed lg:relative inset-y-0 right-0 z-40 w-72 border-l border-white/5 bg-[#0a0e14]/95 lg:bg-[#0a0e14]/80 backdrop-blur-2xl flex flex-col transition-transform duration-300 ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} shrink-0`}>
              {/* Tab Switcher */}
              <div className="flex border-b border-white/5 bg-black/20 pr-10 lg:pr-0">
                <button 
                  onClick={() => setActivePanelTab('props')}
                  className={`flex-1 py-4 text-[10px] font-mono uppercase tracking-widest transition-all relative cursor-pointer ${activePanelTab === 'props' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Properties
                  {activePanelTab === 'props' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
                </button>
                <button 
                  onClick={() => setActivePanelTab('bom')}
                  className={`flex-1 py-4 text-[10px] font-mono uppercase tracking-widest transition-all relative cursor-pointer ${activePanelTab === 'bom' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  BOM
                  {activePanelTab === 'bom' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
                </button>
              </div>

              {/* Close Button on Mobile */}
              <button 
                onClick={() => setIsRightSidebarOpen(false)}
                className="absolute top-3 right-3 lg:hidden p-1 rounded bg-white/5 text-white/40 hover:text-white z-50"
              >
                <X size={14} />
              </button>

              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {activePanelTab === 'props' ? (
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
        )}

        {activeTab === 'machine-assembly' && <DragAndBuildModule />}
        {activeTab === 'cad-editor' && <CadEditorModule className="w-full h-full" />}
        {activeTab === 'sketch-pad' && <ExcalidrawModule />}
        {activeTab === 'simulation-fea' && <SimulationFEAModule />}
        {activeTab === 'nesting-2d' && <Nesting2DModule lang="en" dict={{}} />}
        {activeTab === 'cutting-optimizer' && <CuttingOptimizerModule lang="en" dict={{}} />}
      </div>

      {/* Dynamic Calculator Bridge Modal */}
      {bridge.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0A1628] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="bg-white/[0.02] border-b border-white/5 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">
                  Workspace Spec Solver
                </h3>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">
                  Calculating parameters for part: {bridge.selectedComponent?.id} ({bridge.selectedComponent?.type})
                </p>
              </div>
              <button 
                onClick={() => bridge.setIsOpen(false)}
                className="p-1 rounded bg-white/5 text-white/40 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar bg-black/20 text-white">
              <InteractiveFormula 
                id={bridge.calcId}
                formula={bridge.calcId === 'beam-deflection-calc' ? 'delta = 5 * w * L^4 / (384 * E * I)' : bridge.calcId === 'bolt-torque-calc' ? 'T = K * F * d' : 'd_min = (16 * T / (pi * tau))^(1/3)'}
                variables={
                  bridge.calcId === 'beam-deflection-calc' 
                    ? { delta: 'Deflection (m)', w: 'Distributed load (N/m)', L: 'Span length (m)', E: "Young's modulus (Pa)", I: 'Inertia (m4)' }
                    : bridge.calcId === 'bolt-torque-calc'
                    ? { T: 'Tightening torque (N·m)', K: 'Nut factor', F: 'Preload (N)', d: 'Diameter (m)' }
                    : { d_min: 'Min Diameter (m)', T: 'Torque (N·m)', tau: 'Allowable shear stress (Pa)' }
                }
              />
            </div>

            {/* Modal Footer */}
            <div className="bg-[#0f192b] border-t border-white/5 px-6 py-4 flex justify-end gap-3">
              <button 
                onClick={() => bridge.setIsOpen(false)}
                className="px-4 py-2 border border-white/10 rounded-lg text-[10px] font-mono uppercase text-white/60 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const historyKey = `calc_history_${bridge.calcId}`;
                  const historyRaw = localStorage.getItem(historyKey);
                  const history = historyRaw ? JSON.parse(historyRaw) : [];
                  if (history.length > 0) {
                    const latest = history[0];
                    let resultStr = '';
                    if (bridge.calcId === 'bolt-torque-calc') {
                      resultStr = `Torque: ${Number(latest.result).toFixed(1)} N·m`;
                    } else if (bridge.calcId === 'beam-deflection-calc') {
                      resultStr = `Deflection: ${(Number(latest.result) * 1000).toFixed(2)} mm`;
                    } else {
                      resultStr = `Min Diameter: ${(Number(latest.result) * 1000).toFixed(1)} mm`;
                    }
                    bridge.saveResult(resultStr);
                  } else {
                    bridge.saveResult("Verified");
                  }
                }}
                className="px-4 py-2 bg-[#00e5ff] hover:bg-[#00e5ff]/80 text-black font-extrabold rounded-lg text-[10px] font-mono uppercase transition-all shadow-[0_0_10px_rgba(0,229,255,0.2)] cursor-pointer"
              >
                Apply spec to BOM
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
