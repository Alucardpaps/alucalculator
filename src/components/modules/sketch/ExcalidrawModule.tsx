'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useOSStore } from '@/store/osStore';

// Safer dynamic import with type casting to bypass strict checks during rapid iteration
const Excalidraw = dynamic(
    async () => {
        const mod = await import('@excalidraw/excalidraw');
        return { default: mod.Excalidraw as any };
    },
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-400 gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                <div className="text-sm font-mono tracking-wider">LOADING SKETCH ENGINE...</div>
            </div>
        )
    }
) as any;

export function ExcalidrawModule() {
    const theme = useOSStore(state => state.theme);
    const [compMounted, setCompMounted] = useState(false);

    // We can't import the library file directly due to its dependence on Excalidraw types that might crash build if mismatched
    // So we'll fetch/load it dynamically or pass null if failed.
    const [libraryItems, setLibraryItems] = useState<any[]>([]);

    // Ensure component only mounts on client
    useEffect(() => {
        setCompMounted(true);
        // Load initial library items if possible
        // import('./engineering-library').then(lib => setLibraryItems(lib.ENGINEERING_LIBRARY)).catch(() => {});
    }, []);

    if (!compMounted) return null;

    // Map OS theme to Excalidraw theme
    const excalidrawTheme = theme === 'light' ? 'light' : 'dark';

    // Custom background colors based on theme
    const viewBackgroundColor = theme === 'light' ? '#ffffff' : '#121212';
    const strokeColor = theme === 'light' ? '#000000' : '#e0e0e0';

    return (
        <div className="w-full h-full relative" style={{ isolation: 'isolate' }}>
            <Excalidraw
                theme={excalidrawTheme}
                initialData={{
                    appState: {
                        viewBackgroundColor: viewBackgroundColor,
                        currentItemStrokeColor: strokeColor,
                        currentItemBackgroundColor: 'transparent',
                        currentItemFillStyle: 'hachure',
                        currentItemStrokeWidth: 1,
                        currentItemRoughness: 1,
                    },
                    // If we had library items, we would pass them here.
                    // Since generating complex Excalidraw elements manually is error-prone without the specific JSON,
                    // we default to empty but enable the browsing feature.
                    // libraryItems: libraryItems 
                }}
                // Top-level props for modern Excalidraw versions
                zenModeEnabled={false}
                gridModeEnabled={true}
                viewModeEnabled={false}
                name="Sketch"
            // Ensure Library button is visible (it's visible by default usually)
            />
        </div>
    );
}

export default ExcalidrawModule;
