'use client';

import React, { useState } from 'react';
import BeamCanvas from './BeamCanvas';
import BeamCanvas3D from './BeamCanvas3D';

const FeaModule = () => {
    const [is3DMode, setIs3DMode] = useState(false);

    return (
        <div className="w-full h-full relative font-mono text-xs flex flex-col" style={{ backgroundColor: "#020305" }}>
            <div className="absolute top-4 right-20 z-20 pointer-events-none">
                <button
                    onClick={() => setIs3DMode(!is3DMode)}
                    className="pointer-events-auto px-4 py-2 bg-[#0a0e14]/90 backdrop-blur-md border border-[#1e2833] rounded text-[10px] text-white hover:border-[#00e5ff]/50 transition-all font-mono tracking-widest flex items-center gap-2 shadow-xl"
                >
                    <span className={`w-2 h-2 rounded-full ${is3DMode ? 'bg-[#ff0055]' : 'bg-[#00e5ff]'} shadow-[0_0_10px_currentColor]`} />
                    {is3DMode ? 'SWITCH TO 2D ENGINE' : 'SWITCH TO 3D ENGINE'}
                </button>
            </div>
            {is3DMode ? <BeamCanvas3D /> : <BeamCanvas />}
        </div>
    );
};

export default FeaModule;
