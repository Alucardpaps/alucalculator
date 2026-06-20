'use client';

/**
 * 🖥️ DESKTOP ENVIRONMENT - SPA ROOT
 * 
 * The main container for the Client-Side Engineering Runtime.
 * Initializes the Kernel and mounts the Window Manager.
 */

import { useEffect, useState, useCallback } from 'react';
import { bootEngineeringOS } from '@/runtime/boot';
import { useOSStore } from '@/store/osStore';
import { commandProcessor } from '@/cad/commands/CommandProcessor';

import { RibbonBar } from '@/components/os/RibbonBar';
import { Taskbar } from '@/components/os/Taskbar';
// import { AluDrawCanvas } from '@/components/canvas/AluDrawCanvas'; // DELETED

import { DeskCanvas } from '@/components/desk/DeskCanvas';
import { CamWindow } from '@/components/cam/CamWindow';
import { SplitViewport } from '@/cad/presentation';
import { WindowManager } from '@/components/os/WindowManager';
import { WelcomeModal } from '@/components/os/WelcomeModal';
import { CanvasErrorBoundary } from '@/components/os/ErrorBoundary';
import { AluDock } from '@/components/os/AluDock';
import { FEAWindow } from '@/components/modules/fea/FEAWindow';
import { ChaosToggle } from '@/components/ui/ChaosToggle';
import { AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const AluCAD = dynamic(() => import('@/cad/components/AluCAD').then(mod => mod.AluCAD), { ssr: false });
import { ActionTerminal } from '@/components/os/ActionTerminal';
import { EngineeringOven } from '@/components/os/EngineeringOven';
import { AutoCADCommandBar } from '@/components/os/AutoCADCommandBar';
import { AutoCADCrosshair } from '@/components/os/AutoCADCrosshair';

export default function DesktopEnvironment() {
    const [kernelReady, setKernelReady] = useState(false);
    const [viewMode, setViewMode] = useState<'cad' | 'desk' | 'fea' | 'cam'>('desk');
    const [isOvenOpen, setIsOvenOpen] = useState(false);
    const { openWindow } = useOSStore();

    // Ctrl+Shift+P → Open Terminal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                openWindow('terminal');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [openWindow]);

    useEffect(() => {
        // Connect OS Storage to CAD Command Processor if needed
        commandProcessor.setVariableProvider((varName) => {
            // Flow nodes are deprecated. Variables should come from VariableManager or OS Store.
            return undefined;
        });

        try {
            // 🚀 BOOT SEQUENCE
            bootEngineeringOS();

            // 🛡️ RUNTIME SAFETY CHECK
            if (!(window as any).__ALUCALC_OS__) {
                throw new Error("Kernel Integrity Violation: Boot failed.");
            }

            setKernelReady(true);
        } catch (e) {
            console.error("OS CRASH:", e);
        }
    }, []);

    if (!kernelReady) return null;

    return (
        <div
            className="fixed inset-0 flex flex-col overflow-hidden select-none"
            style={{
                backgroundColor: 'var(--color-os-canvas, #0a0e14)',
                color: '#e0e0e0',
                fontFamily: 'var(--font-inter, sans-serif)'
            }}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* 🧩 SHELL LAYOUT: RIBBON (Top) -> CANVAS (Middle) -> DOCK + TASKBAR (Bottom) */}

            {/* 1. Command Ribbon */}
            <div className="flex flex-col z-20">
                <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-b border-cyan-900/30 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-cyan-900/80 uppercase tracking-[0.2em] font-mono">AluCalc OS v5.0</span>
                        <ChaosToggle />
                    </div>
                    {/* View Switcher */}
                    <div className="flex bg-[#0a0f16]/60 rounded p-0.5 border border-cyan-900/30 backdrop-blur">
                        <button
                            onClick={() => setViewMode('cad')}
                            className={`px-3 py-1 text-[10px] tracking-widest rounded transition-all ${viewMode === 'cad' ? 'bg-[#00e5ff] text-black font-bold shadow-[0_0_10px_rgba(0,229,255,0.4)]' : 'text-cyan-900/60 hover:text-cyan-400 font-bold uppercase'}`}
                        >
                            CAD
                        </button>
                        <button
                            onClick={() => setViewMode('fea')}
                            className={`px-3 py-1 text-[10px] tracking-widest rounded transition-all ${viewMode === 'fea' ? 'bg-[#f59e0b] text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'text-cyan-900/60 hover:text-amber-500 font-bold uppercase'}`}
                        >
                            FEA
                        </button>
                        <button
                            onClick={() => setViewMode('desk')}
                            className={`px-3 py-1 text-[10px] tracking-widest rounded transition-all ${viewMode === 'desk' ? 'bg-[#a855f7] text-white font-bold shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'text-cyan-900/60 hover:text-purple-400 font-bold uppercase'}`}
                        >
                            DESK
                        </button>
                    </div>
                </div>
                {viewMode !== 'cad' && <RibbonBar mode={viewMode} />}
            </div>

            {/* 2. Infinite Engineering Canvas */}
            <div className="relative flex-1 bg-[#050505] overflow-hidden">
                <CanvasErrorBoundary
                    fallbackMode="Desk"
                    onSwitchMode={() => setViewMode('desk')}
                >
                    {viewMode === 'cad' && <AluCAD />}
                    {viewMode === 'desk' && <DeskCanvas />}
                    {viewMode === 'fea' && <FEAWindow />}
                </CanvasErrorBoundary>

                {/* CAM Floating Window (Isolated) */}
                <CamWindow />

                {/* macOS Style Quick Launch Dock */}
                <AluDock currentMode={viewMode} onSwitchMode={setViewMode} />
            </div>

            {/* 3. System Taskbar & Command Bar */}
            <div className="relative z-50 flex flex-col">
                <AutoCADCommandBar />
                <Taskbar />
            </div>

            {/* 4. Global Engineering Layer */}
            <AutoCADCrosshair />

            {/* 5. Welcome/Onboarding Modal */}
            <WelcomeModal />

            {/* 5. Engineering Workstation Tools (Floating) */}
            <div className="absolute bottom-16 left-4 z-40 flex flex-col gap-4 pointer-events-none">
                <AnimatePresence>
                    {isOvenOpen && (
                        <div className="pointer-events-auto">
                            <EngineeringOven onClose={() => setIsOvenOpen(false)} />
                        </div>
                    )}
                </AnimatePresence>
                <div className="pointer-events-auto">
                    <ActionTerminal className="w-[380px] h-[220px]" />
                </div>
            </div>

            {/* 6. Workstation Quick Access */}
            <button 
                onClick={() => setIsOvenOpen(!isOvenOpen)}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-50 p-2 bg-orange-600/20 border border-orange-500/30 rounded-full text-orange-400 hover:bg-orange-500 hover:text-white transition-all shadow-[0_0_20px_rgba(255,87,34,0.2)] group"
                title="Sistem Fırınını Aç"
            >
                <div className="relative">
                    <Flame size={20} className={cn(isOvenOpen && "animate-pulse")} />
                    <div className="absolute -right-1 -top-1 w-2 h-2 bg-orange-500 rounded-full animate-ping opacity-75"></div>
                </div>
            </button>
        </div>
    );
}
