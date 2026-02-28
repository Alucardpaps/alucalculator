'use client';

/**
 * 🏗️ FEA WINDOW (Finite Element Analysis)
 * 
 * Mounts the full 3D structural analysis canvas (BeamCanvas3D)
 * with physics simulation, stress heatmaps, and presets.
 */

import dynamic from 'next/dynamic';

const BeamCanvas3D = dynamic(
    () => import('./BeamCanvas3D').then(mod => mod.default),
    {
        ssr: false,
        loading: () => (
            <div className="absolute inset-0 bg-[#020305] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-gray-500 font-mono uppercase tracking-widest">Loading FEA Engine...</span>
                </div>
            </div>
        )
    }
);

export function FEAWindow() {
    return (
        <div className="absolute inset-0 z-10 bg-[#020305] overflow-hidden">
            <BeamCanvas3D />
        </div>
    );
}
