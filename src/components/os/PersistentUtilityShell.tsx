'use client';

import React from 'react';
import { motion, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';

interface PersistentUtilityShellProps {
    id: string;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    position: { x: number; y: number };
    onPositionChange: (x: number, y: number) => void;
    width?: number;
}

export function PersistentUtilityShell({
    id, title, icon, children, isOpen, onClose, position, onPositionChange, width = 320
}: PersistentUtilityShellProps) {
    const controls = useDragControls();

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            drag
            dragControls={controls}
            dragMomentum={false}
            dragListener={false}
            onDragEnd={(_, info) => {
                onPositionChange(position.x + info.offset.x, position.y + info.offset.y);
            }}
            style={{
                left: position.x,
                top: position.y,
                width: width,
                zIndex: 9999 + (id === 'calculator' ? 1 : 0)
            }}
            className="fixed bg-[#0a0e14]/60 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col group select-none pointer-events-auto"
        >
            {/* Header/Drag Handle */}
            <div
                className="flex items-center justify-between p-3 border-b border-white/5 bg-white/5 cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => controls.start(e)}
            >
                <div className="flex items-center gap-2 pointer-events-none">
                    <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400">
                        {icon}
                    </div>
                    <span className="font-bold text-[10px] tracking-[0.2em] uppercase text-slate-300">
                        {title}
                    </span>
                </div>

                <div className="flex items-center gap-1 relative z-10">
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors text-slate-500"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Content Container */}
            <div className="p-3 flex-1 pointer-events-auto">
                {children}
            </div>

            {/* Subtle Footer Accent */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent opacity-50" />
        </motion.div>
    );
}
