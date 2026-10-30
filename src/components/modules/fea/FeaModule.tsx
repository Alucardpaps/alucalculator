'use client';

import React, { useState } from 'react';
import BeamCanvas from './BeamCanvas';
import dynamic from 'next/dynamic';
const BeamCanvas3D = dynamic(() => import('./BeamCanvas3D'), { ssr: false });

const FeaModule = () => {
    const [is3DMode, setIs3DMode] = useState(false);

    return (
        <div className="w-full h-full relative font-mono text-xs flex flex-col" style={{ backgroundColor: "var(--bg-0)" }}>
            <div className="absolute top-4 right-20 z-20 pointer-events-none">
                <button
                    onClick={() => setIs3DMode(!is3DMode)}
                    className="pointer-events-auto px-4 py-2 bg-[var(--bg-1)]/90 border border-[var(--line)] rounded text-[10px] text-white hover:border-[var(--cyan)]/50 transition-all font-mono tracking-widest flex items-center gap-2 shadow-xl"
                >
                    <span className={`w-2 h-2 rounded-full ${is3DMode ? 'bg-[var(--bad)]' : 'bg-[var(--cyan)]'} `} />
                    {is3DMode ? 'SWITCH TO 2D ENGINE' : 'SWITCH TO 3D ENGINE'}
                </button>
            </div>
            {is3DMode ? <BeamCanvas3D /> : <BeamCanvas />}
        </div>
    );
};

export default FeaModule;
