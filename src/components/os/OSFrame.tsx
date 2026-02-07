'use client';

import { useEffect } from 'react';
import { useOSStore } from '@/store/osStore';
import { RibbonBar } from '@/components/os/RibbonBar';
import { Canvas } from '@/components/os/Canvas';
import { Taskbar } from '@/components/os/Taskbar';
import { WindowManager } from './WindowManager';

export function OSFrame({ lang, dictionary }: { lang: string, dictionary: any }) {
    const { setLanguage, setDictionary } = useOSStore();

    useEffect(() => {
        setLanguage(lang);
        setDictionary(dictionary);
    }, [lang, dictionary, setLanguage, setDictionary]);

    return (
        <div
            className="fixed inset-0 flex flex-col overflow-hidden"
            style={{ backgroundColor: 'var(--color-os-canvas)' }}
        >
            {/* Ribbon Bar - Fixed Top */}
            <RibbonBar />

            {/* Canvas - Main Workspace */}
            <div className="relative flex-1">
                <Canvas>
                    <WindowManager />
                </Canvas>
            </div>

            {/* Taskbar - Fixed Bottom */}
            <Taskbar />
        </div>
    );
}
