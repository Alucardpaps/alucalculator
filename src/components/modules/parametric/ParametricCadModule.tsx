'use client';

import React from 'react';
import { Viewer3D } from '@/components/Viewer3D';
import { PartControls } from '@/components/PartControls';

/**
 * Parametric CAD Module Wrapper
 * 
 * Embeds the 3D viewer and UI controls side-by-side within an OS window.
 */
export default function ParametricCadModule() {
    return (
        <div className="w-full h-full flex items-center justify-center p-6 gap-6 bg-[#020305]">
            {/* 3D Viewer Space */}
            <div className="flex-1 h-full w-full min-w-0 flex items-center justify-center">
                <Viewer3D />
            </div>

            {/* Controls sidebar */}
            <div className="w-[320px] shrink-0 h-full overflow-y-auto custom-scrollbar flex flex-col justify-center">
                <PartControls />
            </div>
        </div>
    );
}
