'use client';

/**
 * AluCalc OS — Unified OS Frame
 * 
 * Combines ReactFlow-based Flow Canvas with OS chrome (RibbonBar, Taskbar).
 * This is the main frame that renders the entire application.
 */

import { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { useOSStore } from '@/store/osStore';
import { RibbonBar } from '@/components/os/RibbonBar';
import { Taskbar } from '@/components/os/Taskbar';
import FlowCanvas from '@/components/flow/FlowCanvas';

export function OSFrame({ lang, dictionary }: { lang: string, dictionary: any }) {
    const { setLanguage, setDictionary } = useOSStore();

    useEffect(() => {
        setLanguage(lang);
        setDictionary(dictionary);
    }, [lang, dictionary, setLanguage, setDictionary]);

    return (
        <ReactFlowProvider>
            <div
                className="fixed inset-0 flex flex-col overflow-hidden"
                style={{ backgroundColor: 'var(--color-os-canvas, #0a0e14)' }}
            >
                {/* Ribbon Bar - Fixed Top */}
                <RibbonBar />

                {/* Flow Canvas - Main Workspace */}
                <div className="relative flex-1">
                    <FlowCanvas className="absolute inset-0" />
                </div>

                {/* Taskbar - Fixed Bottom */}
                <Taskbar />
            </div>
        </ReactFlowProvider>
    );
}
