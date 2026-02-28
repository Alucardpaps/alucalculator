'use client';

import { useEffect, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { useOSStore } from '@/store/osStore';
import { useI18nStore } from '@/store/i18nStore';
import { RibbonBar } from '@/components/os/RibbonBar';
import { Taskbar } from '@/components/os/Taskbar';
import { WelcomeModal } from '@/components/os/WelcomeModal';
import dynamic from 'next/dynamic';
import { WindowManager } from '@/components/os/WindowManager';
import { UnifiedDock } from '@/components/modules/desk/UnifiedDock';
import { GlobalUtilityLayer } from '@/components/os/GlobalUtilityLayer';
import { StartMenu } from '@/components/os/StartMenu';

const DeskCanvas = dynamic(() => import('@/components/modules/desk/DeskCanvas'), { ssr: false });

/**
 * OS Page - Unified Desk Architecture
 */
export default function OSPage() {
    const {
        theme,
        windows,
        activeWindowId,
        workspaceMode,
        startMenuOpen,
        setStartMenuOpen
    } = useOSStore();
    const { t } = useI18nStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Derived state for Ribbon visibility
    const activeWindow = windows.find(w => w.id === activeWindowId);
    const hideRibbon = activeWindow?.maximized && workspaceMode === 'desk';

    if (!mounted) return null;

    return (
        <ReactFlowProvider>
            <div
                className="flex flex-col w-screen h-screen overflow-hidden bg-[var(--color-os-canvas)] text-slate-200"
                data-theme={theme}
            >
                {/* 1. Header / App Launcher - Hidden in Focus Mode */}
                {!hideRibbon && (
                    <div className="flex flex-col shrink-0 z-50">
                        <RibbonBar mode={workspaceMode} dock={true} />
                    </div>
                )}

                {/* 2. Main Workspace (Desk is always the background) */}
                <div className="flex-1 relative overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <DeskCanvas />
                    </div>
                    <div className="absolute inset-0 z-10 pointer-events-none">
                        <WindowManager />
                    </div>
                </div>

                <UnifiedDock />
                <Taskbar />
                <WelcomeModal />

                <StartMenu
                    isOpen={startMenuOpen}
                    onClose={() => setStartMenuOpen(false)}
                />

                <GlobalUtilityLayer />
            </div>
        </ReactFlowProvider>
    );
}
