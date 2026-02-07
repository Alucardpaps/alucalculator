'use client';

import { useOSStore } from '@/store/osStore'; // Adjust path if needed
import { motion, AnimatePresence } from 'framer-motion';
import { AppWindow, Minus, X, Maximize2, Grid3X3, Search, Battery, Wifi, Volume2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getModuleIcon, MODULE_REGISTRY } from '@/config/modules';
import { StartMenu } from './StartMenu';

export function Taskbar() {
    const {
        windows,
        activeWindowId,
        toggleWindow,
        closeWindow,
        minimizeWindow,
        restoreWindow,
        bringToFront,
        dictionary
    } = useOSStore();

    const [time, setTime] = useState(new Date());
    const [isStartOpen, setStartOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="h-12 bg-[#0a0a0f]/90 backdrop-blur-md border-t border-white/5 flex items-center px-4 justify-between z-50 select-none relative">

            {/* Start / Menu Area */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setStartOpen(!isStartOpen)}
                    className={`p-2 rounded-lg transition-colors group ${isStartOpen ? 'bg-blue-600' : 'hover:bg-white/10'}`}
                >
                    <Grid3X3 size={20} className={`${isStartOpen ? 'text-white' : 'text-blue-400 group-hover:text-blue-300'} transition-colors`} />
                </button>
                <div className="h-6 w-px bg-white/10 mx-1" />
            </div>

            {/* Window List */}
            <div className="flex-1 flex items-center gap-2 px-4 overflow-x-auto no-scrollbar">
                <AnimatePresence mode="popLayout">
                    {windows.map((win) => {
                        const moduleInfo = MODULE_REGISTRY[win.type];
                        const Icon = getModuleIcon(moduleInfo?.iconName || 'Circle');
                        const isActive = activeWindowId === win.id && !win.minimized;

                        return (
                            <motion.button
                                key={win.id}
                                layout
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, width: 0 }}
                                onClick={() => {
                                    if (isActive) {
                                        minimizeWindow(win.id);
                                    } else {
                                        if (win.minimized) restoreWindow(win.id);
                                        bringToFront(win.id);
                                    }
                                }}
                                className={`
                                    group relative flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all min-w-[140px] max-w-[200px]
                                    ${isActive
                                        ? 'bg-blue-600/20 border-blue-500/30 text-blue-100 shadow-[0_0_15px_rgba(37,99,235,0.2)]'
                                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10'
                                    }
                                `}
                            >
                                <Icon size={16} className={isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
                                <span className="text-xs truncate font-medium flex-1 text-left">
                                    {win.title}
                                </span>

                                {/* Hover Close Button */}
                                <div
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeWindow(win.id);
                                    }}
                                >
                                    <X size={12} />
                                </div>

                                {/* Active Indicator Line */}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-indicator"
                                        className="absolute bottom-[-10px] left-2 right-2 h-[2px] bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* System Tray */}
            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                <div className="flex items-center gap-3 text-slate-400">
                    <Wifi size={16} />
                    <Volume2 size={16} />
                    <Battery size={16} />
                </div>
                <div className="flex flex-col items-end leading-none cursor-default group">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                        {formatTime(time)}
                    </span>
                    <span className="text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors">
                        {formatDate(time)}
                    </span>
                </div>
            </div>

            {/* Start Menu Overlay */}
            <StartMenu
                isOpen={isStartOpen}
                onClose={() => setStartOpen(false)}
                dict={dictionary}
            />
        </div>
    );
}
