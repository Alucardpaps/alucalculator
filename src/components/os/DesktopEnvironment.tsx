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
import { useFlowStore } from '@/store/flowStore';
import { RibbonBar } from '@/components/os/RibbonBar';
import { Taskbar } from '@/components/os/Taskbar';
import { AluDrawCanvas } from '@/components/canvas/AluDrawCanvas';
import FlowCanvas from '@/components/flow/FlowCanvas';
import { DeskCanvas } from '@/components/desk/DeskCanvas';
import { CamWindow } from '@/components/cam/CamWindow';
import { SplitViewport } from '@/cad/presentation';
import { WindowManager } from '@/components/os/WindowManager';
import { WelcomeModal } from '@/components/os/WelcomeModal';
import { CanvasErrorBoundary } from '@/components/os/ErrorBoundary';
import { AluDock } from '@/components/os/AluDock';
import { FEAWindow } from '@/components/modules/fea/FEAWindow';
import dynamic from 'next/dynamic';

const AluCAD = dynamic(() => import('@/cad/components/AluCAD').then(mod => mod.AluCAD), { ssr: false });
// MusicPlayer removed

export default function DesktopEnvironment() {
    const [kernelReady, setKernelReady] = useState(false);
    const [viewMode, setViewMode] = useState<'cad' | 'desk' | 'flow' | 'fea'>('flow');
    const { setLanguage, openWindow } = useOSStore();

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
        // Connect Flow Variables to CAD Command Processor
        commandProcessor.setVariableProvider((varName) => {
            const { nodes } = useFlowStore.getState();

            // Search strategy:
            // 1. Check for exact node ID match: $node-123.output
            // 2. Check for node title match: $WidthCalc.L
            // 3. Since user can't easily type IDs, we need a better way. 
            //    For now, let's flatten all outputs from all calculator nodes 
            //    and match by key property if unique? 
            //    Or better: strict "$NodeTitle.OutputKey" format.

            for (const node of nodes) {
                if (node.data.type === 'calculator' || node.data.type === 'standard-calculator') {
                    const data = node.data as any;
                    // Check if variable name matches any output key
                    if (data.outputs && data.outputs[varName] !== undefined) {
                        return data.outputs[varName];
                    }

                    // Check NodeTitle.OutputKey
                    if (data.schema?.metadata?.title) {
                        const cleanTitle = data.schema.metadata.title.replace(/\s+/g, '');
                        if (varName.startsWith(cleanTitle + '.')) {
                            const key = varName.split('.')[1];
                            return data.outputs[key];
                        }
                    }
                }
            }
            return undefined;
        });

        try {
            // 🚀 BOOT SEQUENCE
            bootEngineeringOS();

            // 🛡️ RUNTIME SAFETY CHECK
            if (!(window as any).__ALUCALC_OS__) {
                throw new Error("Kernel Integrity Violation: Boot failed.");
            }

            setLanguage('en');
            setKernelReady(true);
        } catch (e) {
            console.error("OS CRASH:", e);
        }
    }, [setLanguage]);

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
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-cyan-900/80 uppercase tracking-[0.2em] font-mono">AluCalc OS v5.0</span>
                    </div>
                    {/* View Switcher */}
                    <div className="flex bg-[#0a0f16]/60 rounded p-0.5 border border-cyan-900/30 backdrop-blur">
                        <button
                            onClick={() => setViewMode('flow')}
                            className={`px-3 py-1 text-[10px] tracking-widest rounded transition-all ${viewMode === 'flow' ? 'bg-[#00e5ff] text-black font-bold shadow-[0_0_10px_rgba(0,229,255,0.4)]' : 'text-cyan-900/60 hover:text-cyan-400 font-bold uppercase'}`}
                        >
                            FLOW
                        </button>
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
                <RibbonBar mode={viewMode} />
            </div>

            {/* 2. Infinite Engineering Canvas */}
            <div className="relative flex-1 bg-[#050505] overflow-hidden">
                <CanvasErrorBoundary
                    fallbackMode={viewMode === 'desk' ? 'Flow' : 'Desk'}
                    onSwitchMode={() => setViewMode('desk')}
                >
                    {viewMode === 'cad' && <AluCAD />}
                    {viewMode === 'desk' && <DeskCanvas />}
                    {viewMode === 'flow' && <FlowCanvas className="absolute inset-0" />}
                    {viewMode === 'fea' && <FEAWindow />}
                </CanvasErrorBoundary>

                {/* CAM Floating Window (Isolated) */}
                <CamWindow />
            </div>

            {/* 3. System Taskbar */}
            <Taskbar />

            {/* 4. Welcome/Onboarding Modal */}
            <WelcomeModal />
        </div>
    );
}
