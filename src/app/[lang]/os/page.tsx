'use client';

import { use, useEffect, useState } from 'react';
import { useOSStore } from '@/store/osStore';
import { useCADCanvasStore } from '@/store/CADCanvasStore';
import { MODULE_REGISTRY } from '@/config/modules';
import { DeploymentGuard } from '@/components/DeploymentGuard';
import { RibbonBar } from '@/components/os/RibbonBar';
import { Canvas } from '@/components/os/Canvas';
import { CanvasWindow } from '@/components/os/CanvasWindow';
import { Taskbar } from '@/components/os/Taskbar';
import { CADCanvas, CADToolbar } from '@/components/cad';

// Import modules dynamically or eagerly? Eager for now to verify.
// In Phase 5 (Registry), this will be dynamic.
// Dynamically imported modules
import { WindowContent } from '@/components/os/WindowContent';

type Params = Promise<{ lang: string }>;

export default function OSPage(props: { params: Params }) {
    const params = use(props.params);
    const { lang } = params;

    const { windows, openWindow, setDictionary, dictionary, updateWindowPosition, updateWindowSize } = useOSStore();
    const { viewport } = useCADCanvasStore();
    const [mounted, setMounted] = useState(false);

    const activeWindows = windows.filter(w => !w.minimized);

    useEffect(() => {
        const init = async () => {
            try {
                // Dynamic import for dictionary to avoid server component issues in client
                const { getDictionary } = await import('@/get-dictionary');
                const dict = await getDictionary(lang as any);
                setDictionary(dict);
            } catch (error) {
                console.error('Failed to load dictionary:', error);
            } finally {
                setMounted(true);
            }
        };

        init();
    }, [lang, setDictionary]);

    // Helper to transform world coordinates to screen coordinates
    const toScreen = (worldX: number, worldY: number) => ({
        x: worldX * viewport.zoom + viewport.panX,
        y: worldY * viewport.zoom + viewport.panY
    });

    // Helper to transform screen coordinates to world coordinates
    const toWorld = (screenX: number, screenY: number) => ({
        x: (screenX - viewport.panX) / viewport.zoom,
        y: (screenY - viewport.panY) / viewport.zoom
    });

    if (!mounted) {
        return (
            <div className="bg-[#1e1e1e] w-screen h-screen flex items-center justify-center text-white">
                LOADING OS... (Mounted: {String(mounted)})
            </div>
        );
    }

    return (
        <DeploymentGuard>
            <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#1e1e1e] text-slate-200">
                {/* 1. The Ribbon Interface */}
                <RibbonBar />

                {/* 2. The Infinite Engineering Canvas with CAD Layer */}
                <div className="flex-1 relative overflow-hidden">
                    {/* CAD Drawing Canvas - Primary Drawing Surface */}
                    <CADCanvas className="w-full h-full" />

                    {/* CAD Toolbar - Floating on left */}
                    <CADToolbar />

                    {/* Window Layer (World Space Mapped) */}
                    <div
                        className="pointer-events-none absolute inset-0 origin-top-left will-change-transform"
                        style={{
                            transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`
                        }}
                    >
                        {activeWindows.map((win) => (
                            <div key={win.id} className="pointer-events-none absolute inset-0">
                                {/* CanvasWindow is now in World Coordinates */}
                                <CanvasWindow
                                    id={win.id}
                                    title={MODULE_REGISTRY[win.type as keyof typeof MODULE_REGISTRY]?.title || win.type}
                                    initialPosition={{ x: 100, y: 100 }} // Not used when position is provided
                                    position={win.position}
                                    scale={viewport.zoom}
                                    onPositionChange={(newWorldPos) => {
                                        // No conversion needed, we are in world space
                                        updateWindowPosition(win.id, newWorldPos);
                                    }}
                                    size={win.size}
                                    onSizeChange={(newSize) => {
                                        if (updateWindowSize) {
                                            updateWindowSize(win.id, newSize);
                                        }
                                    }}
                                    zIndex={win.zIndex}
                                >
                                    <div className="h-full w-full overflow-hidden pointer-events-auto">
                                        <WindowContent type={win.type} />
                                    </div>
                                </CanvasWindow>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Taskbar */}
                <Taskbar />
            </div>
        </DeploymentGuard>
    );
}
