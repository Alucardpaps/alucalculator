'use client';

import React from 'react';
import { Undo, Redo, Grid, Maximize, Save } from 'lucide-react';

export default function Dock() {
    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#252526]/80 backdrop-blur border border-[#333] rounded-full px-4 py-2 flex items-center gap-4 shadow-2xl z-50">
            <DockIcon icon={<Undo size={16} />} tooltip="Undo" />
            <DockIcon icon={<Redo size={16} />} tooltip="Redo" />
            <div className="w-[1px] h-4 bg-[#444]" />
            <DockIcon icon={<Grid size={16} />} tooltip="Toggle Grid" active />
            <DockIcon icon={<Maximize size={16} />} tooltip="Fit View" />
            <div className="w-[1px] h-4 bg-[#444]" />
            <DockIcon icon={<Save size={16} />} tooltip="Save Project" />
        </div>
    );
}

function DockIcon({ icon, tooltip, active }: { icon: any, tooltip: string, active?: boolean }) {
    return (
        <button
            className={`p-2 rounded-full transition-all hover:scale-110 ${active ? 'bg-accent text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            title={tooltip}
        >
            {icon}
        </button>
    );
}
