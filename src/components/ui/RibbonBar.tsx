'use client';

import React from 'react';
import { useCanvasStore } from '@/store/canvas-store';
import { Square, Bot, DollarSign, Settings, Plus } from 'lucide-react';

export default function RibbonBar() {
    const addNode = useCanvasStore(state => state.addNode);

    const handleAddNode = (type: string, title: string) => {
        addNode({
            id: `node-${Date.now()}`,
            type,
            position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
            data: { title }
        });
    };

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#252526] border border-[#333] rounded-lg shadow-2xl p-1 flex gap-1 z-50">
            <RibbonBtn
                icon={<Square size={16} />}
                label="Profile"
                onClick={() => handleAddNode('profileNode', 'BOX PROFILE DETECTOR')}
            />
            <RibbonBtn
                icon={<DollarSign size={16} />}
                label="Cost"
                onClick={() => handleAddNode('costNode', 'COST ESTIMATOR')}
            />
            <RibbonBtn
                icon={<Bot size={16} />}
                label="Co-Pilot"
                onClick={() => handleAddNode('aiNode', 'AI CO-PILOT')}
            />
            <div className="w-[1px] bg-[#333] mx-1 my-1" />
            <RibbonBtn
                icon={<Settings size={16} />}
                label="Settings"
                onClick={() => alert('Settings Modal Placeholder')}
            />
        </div>
    );
}

function RibbonBtn({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center w-16 h-14 hover:bg-[#333] rounded transition-colors group gap-1"
        >
            <div className="text-gray-400 group-hover:text-accent transition-colors">{icon}</div>
            <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wide">{label}</span>
        </button>
    );
}
