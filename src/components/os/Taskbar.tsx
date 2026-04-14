'use client';

/**
 * AluCalc OS — Command Dock (Taskbar)
 * 
 * PREMIUM DOCK UX
 * - Shows active window modules
 * - Quick access to engineering database
 * - Glassmorphism & technical status readout
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Grid3X3, Database, Trash2, 
    Settings, Zap, Cpu, Activity,
    Box, Monitor
} from 'lucide-react';
import { useOSStore } from '@/store/osStore';
import { useI18nStore } from '@/store/i18nStore';
import { CALCULATOR_REGISTRY_V2 } from '@/calculators/registry-v2';

export function Taskbar() {
    const { windows, activeWindowId, focusWindow, closeWindow, closeAllWindows: clearWindows } = useOSStore();
    const { t, language } = useI18nStore();
    const [time, setTime] = useState(new Date());
    const [confirmClear, setConfirmClear] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString(language, { hour: 'numeric', minute: '2-digit', hour12: false });
    };

    // Get module icon and title from registry
    const getWindowInfo = (moduleId: string) => {
        const registryEntry = CALCULATOR_REGISTRY_V2[moduleId];
        if (registryEntry) {
            return {
                title: registryEntry.metadata.title,
                iconName: registryEntry.metadata.icon || 'Settings'
            };
        }
        return { title: moduleId, iconName: 'Monitor' };
    };

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center w-auto pointer-events-none group/dock">
            <div className="bg-[#0b121d]/70 backdrop-blur-3xl border border-white/10 rounded-[24px] px-4 py-2.5 flex items-center gap-4 shadow-[0_32px_64px_rgba(0,0,0,0.8)] pointer-events-auto ring-1 ring-white/10 transition-all duration-500 hover:translate-y-[-4px]">
                
                {/* System Status */}
                <div className="px-4 border-r border-white/5 flex items-center gap-2.5">
                    <div className="relative">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-blue-400 animate-ping opacity-40" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-100 uppercase tracking-widest">{formatTime(time)}</span>
                        <span className="text-[7px] font-black text-blue-500/60 uppercase tracking-[0.3em]">OS CORE V6.2</span>
                    </div>
                </div>

                {/* Window Items */}
                <div className="flex items-center gap-2 max-w-[60vw] overflow-x-auto no-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {windows.map((win) => {
                            const { title } = getWindowInfo(win.type);
                            const isActive = activeWindowId === win.id;

                            return (
                                <motion.button
                                    key={win.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => focusWindow(win.id)}
                                    className={`
                                        group relative flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-300 whitespace-nowrap
                                        ${isActive 
                                            ? 'bg-blue-500/20 border border-blue-500/30 text-white shadow-[0_0_30px_rgba(59,130,246,0.15)]' 
                                            : 'bg-white/5 border border-transparent text-gray-500 hover:bg-white/10 hover:text-gray-300'
                                        }
                                    `}
                                >
                                    <Activity size={14} className={isActive ? 'text-blue-400' : 'text-gray-600'} />
                                    <span className="text-[11px] font-black tracking-tight">{title}</span>

                                    {/* App indicator dot */}
                                    <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500 transition-all ${isActive ? 'opacity-100' : 'opacity-0 scale-0'}`} />

                                    <div 
                                        className="ml-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
                                        onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                                    >
                                        <X size={12} />
                                    </div>
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>

                    {windows.length === 0 && (
                        <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-6 italic opacity-50">
                            Engineering Workspace Empty
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 border-l border-white/5 pl-4 ml-2">
                    <button 
                        onClick={() => useOSStore.getState().openWindow('engineering-selection')}
                        className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 hover:bg-blue-500 hover:text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all"
                        title="Open Database"
                    >
                        <Database size={16} />
                    </button>

                    <button 
                        onClick={() => {
                            if (confirmClear) { clearWindows(); setConfirmClear(false); }
                            else { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); }
                        }}
                        className={`p-3 rounded-2xl transition-all ${confirmClear ? 'bg-red-500 text-white shadow-lg' : 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white'}`}
                        title="Clear Workspace"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
