'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useOSStore } from '@/store/osStore';
import { MODULE_REGISTRY } from '@/config/modules';
import { ENGINEERING_CONSTANTS, EngineeringConstant } from '@/data/engineering-constants';
import { Search, Monitor, Terminal, Bot, Settings, Zap, X, Eye, Focus, Volume2, VolumeX, AlertTriangle, Code, Clock, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function GlobalCommandPalette() {
    const [open, setOpen] = useState(false);
    const {
        openWindow,
        isChaosMode,
        toggleChaosMode,
        isFocusMode,
        toggleFocusMode,
        isAudioEnabled,
        toggleAudio,
        initiateSelfDestruct,
        setTheme,
        theme,
        closeAllWindows
    } = useOSStore();

    const [recentModules, setRecentModules] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [instantAnswer, setInstantAnswer] = useState<EngineeringConstant | null>(null);

    // Track recent modules from local storage or store
    useEffect(() => {
        const saved = localStorage.getItem('alucalc-recent-modules');
        if (saved) setRecentModules(JSON.parse(saved));
    }, []);

    // Instant Answer Logic
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setInstantAnswer(null);
            return;
        }

        const q = searchQuery.toLowerCase();
        const match = ENGINEERING_CONSTANTS.find(c => 
            c.keywords.some(k => q.includes(k) || k.includes(q))
        );
        setInstantAnswer(match || null);
    }, [searchQuery]);

    // Toggle the menu when Alt+S is pressed
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.altKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down, true); // Use capture phase for higher priority
        return () => document.removeEventListener('keydown', down, true);
    }, []);

    if (!open) return null;

    const handleSelectModule = (type: any) => {
        openWindow(type);
        setOpen(false);
        
        // Update recent modules
        const updatedRecent = [type, ...recentModules.filter(m => m !== type)].slice(0, 5);
        setRecentModules(updatedRecent);
        localStorage.setItem('alucalc-recent-modules', JSON.stringify(updatedRecent));
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    {/* Command Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border ${isChaosMode ? 'border-red-500/50 shadow-red-500/20' : 'border-cyan-500/30'}`}
                        style={{
                            backgroundColor: 'rgba(5, 9, 14, 0.95)',
                        }}
                    >
                        <Command
                            className="flex flex-col w-full h-full text-cyan-50"
                            loop
                        >
                            <div className="flex items-center px-4 py-3 border-b border-cyan-900/40">
                                <Search className="w-5 h-5 text-cyan-400 mr-3" />
                                <Command.Input
                                    autoFocus
                                    value={searchQuery}
                                    onValueChange={setSearchQuery}
                                    placeholder="Type a command or search modules..."
                                    className="flex-1 bg-transparent outline-none placeholder:text-cyan-800 text-lg font-mono"
                                />
                                <button onClick={() => setOpen(false)} className="p-1 rounded bg-cyan-900/30 text-cyan-400 hover:bg-cyan-900/50">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Instant AI Answer Section */}
                            <AnimatePresence>
                                {instantAnswer && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden bg-gradient-to-r from-amber-500/10 to-transparent border-b border-amber-500/20"
                                    >
                                        <div className="p-4 flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                                                <Lightbulb size={20} className="animate-pulse" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-baseline gap-2 mb-1">
                                                    <span className="text-xl font-black text-amber-400 font-mono tracking-tighter">{instantAnswer.value}</span>
                                                    <span className="text-xs font-bold text-amber-600 uppercase italic">{instantAnswer.unit}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{instantAnswer.description}</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent">
                                <Command.Empty className="py-6 text-center text-cyan-700 font-mono text-sm">
                                    No results found. Try "vat" or "cad".
                                </Command.Empty>

                                {recentModules.length > 0 && (
                                    <Command.Group heading="Recent Tools" className="px-2 py-3 text-xs font-mono text-amber-500 uppercase tracking-widest border-b border-cyan-900/10 mb-2">
                                        {recentModules.map((id) => {
                                            const mod = MODULE_REGISTRY[id];
                                            if (!mod) return null;
                                            return (
                                                <Command.Item
                                                    key={`recent-${id}`}
                                                    onSelect={() => handleSelectModule(id)}
                                                    className="flex items-center px-3 py-2.5 mt-1 rounded-lg cursor-pointer hover:bg-amber-900/10 aria-selected:bg-amber-900/20 transition-colors"
                                                >
                                                    <Clock className="w-4 h-4 mr-3 text-amber-600" />
                                                    <span className="font-medium text-sm text-amber-100">{mod.title}</span>
                                                </Command.Item>
                                            );
                                        })}
                                    </Command.Group>
                                )}

                                <Command.Group heading="Engineering Modules" className="px-2 py-3 text-xs font-mono text-cyan-600 uppercase tracking-widest">
                                    {Object.values(MODULE_REGISTRY)
                                        .filter(m => ['mechanical', 'manufacturing', 'civil', 'electrical', 'science', 'software'].includes(m.category))
                                        .map((module) => (
                                            <Command.Item
                                                key={module.type}
                                                onSelect={() => handleSelectModule(module.type)}
                                                className="flex items-center px-3 py-2.5 mt-1 rounded-lg cursor-pointer hover:bg-cyan-900/30 aria-selected:bg-cyan-900/40 transition-colors"
                                            >
                                                <Monitor className="w-4 h-4 mr-3 text-cyan-500" />
                                                <span className="font-medium text-sm">{module.title}</span>
                                                <span className="ml-auto text-[10px] text-cyan-700 uppercase">{module.category}</span>
                                            </Command.Item>
                                        ))}
                                </Command.Group>

                                <Command.Group heading="System Actions" className="px-2 py-3 text-xs font-mono text-cyan-600 uppercase tracking-widest border-t border-cyan-900/20 mt-2">
                                    <Command.Item
                                        onSelect={() => {
                                            openWindow('holographic-viewer');
                                            setOpen(false);
                                        }}
                                        className="flex items-center px-3 py-2.5 mt-1 rounded-lg cursor-pointer hover:bg-emerald-900/30 aria-selected:bg-emerald-900/40 transition-colors"
                                    >
                                        <Eye className="w-4 h-4 mr-3 text-emerald-400" />
                                        <span className="font-medium text-sm text-emerald-100">Launch Holographic Projection</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => {
                                            toggleFocusMode();
                                            setOpen(false);
                                        }}
                                        className={`flex items-center px-3 py-2.5 mt-1 rounded-lg cursor-pointer transition-colors ${isFocusMode ? 'hover:bg-purple-900/30 aria-selected:bg-purple-900/40 text-purple-400' : 'hover:bg-cyan-900/30 aria-selected:bg-cyan-900/40'}`}
                                    >
                                        <Focus className={`w-4 h-4 mr-3 ${isFocusMode ? 'text-purple-500' : 'text-slate-400'}`} />
                                        <span className="font-medium text-sm">{isFocusMode ? 'Disable' : 'Enable'} Focus Mode (Zen)</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => {
                                            openWindow('ai-copilot');
                                            setOpen(false);
                                        }}
                                        className="flex items-center px-3 py-2.5 mt-1 rounded-lg cursor-pointer hover:bg-cyan-900/30 aria-selected:bg-cyan-900/40 transition-colors"
                                    >
                                        <Bot className="w-4 h-4 mr-3 text-indigo-400" />
                                        <span className="font-medium text-sm text-indigo-100">Launch AI Copilot</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => {
                                            toggleChaosMode();
                                            setOpen(false);
                                        }}
                                        className={`flex items-center px-3 py-2.5 mt-1 rounded-lg cursor-pointer transition-colors ${isChaosMode ? 'hover:bg-red-900/30 aria-selected:bg-red-900/40 text-red-400' : 'hover:bg-cyan-900/30 aria-selected:bg-cyan-900/40'}`}
                                    >
                                        <Zap className={`w-4 h-4 mr-3 ${isChaosMode ? 'text-red-500' : 'text-yellow-400'}`} />
                                        <span className="font-medium text-sm">{isChaosMode ? 'Disable' : 'Enable'} Chaos Mode (Avant-Garde Overdrive)</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => {
                                            openWindow('matrix-screensaver', true);
                                            setOpen(false);
                                        }}
                                        className="flex items-center px-3 py-2.5 mt-1 rounded-lg cursor-pointer hover:bg-green-900/30 aria-selected:bg-green-900/40 transition-colors"
                                    >
                                        <Code className="w-4 h-4 mr-3 text-green-500" />
                                        <span className="font-medium text-sm text-green-100">Launch Matrix Screensaver</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => {
                                            toggleAudio();
                                            setOpen(false);
                                        }}
                                        className="flex items-center px-3 py-2.5 mt-1 rounded-lg cursor-pointer hover:bg-blue-900/30 aria-selected:bg-blue-900/40 transition-colors text-blue-100"
                                    >
                                        {isAudioEnabled ? <Volume2 className="w-4 h-4 mr-3 text-blue-400" /> : <VolumeX className="w-4 h-4 mr-3 text-slate-500" />}
                                        <span className="font-medium text-sm">{isAudioEnabled ? 'Disable' : 'Enable'} Cyber-Acoustic Feedback</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => {
                                            setTheme(theme === 'dark' ? 'light' : 'dark');
                                            setOpen(false);
                                        }}
                                        className="flex items-center px-3 py-2.5 mt-1 rounded-lg cursor-pointer hover:bg-cyan-900/30 aria-selected:bg-cyan-900/40 transition-colors"
                                    >
                                        <Settings className="w-4 h-4 mr-3 text-cyan-500" />
                                        <span className="font-medium text-sm">Toggle OS Theme</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => {
                                            closeAllWindows();
                                            setOpen(false);
                                        }}
                                        className="flex items-center px-3 py-2.5 mt-1 rounded-lg cursor-pointer hover:bg-red-900/20 aria-selected:bg-red-900/30 transition-colors text-red-200"
                                    >
                                        <Terminal className="w-4 h-4 mr-3 text-red-400" />
                                        <span className="font-medium text-sm">Close All Windows (Panic)</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => {
                                            initiateSelfDestruct();
                                            setOpen(false);
                                        }}
                                        className="flex items-center px-3 py-2.5 mt-2 rounded-lg cursor-pointer bg-red-950/40 hover:bg-red-900/60 aria-selected:bg-red-900/80 transition-colors border border-red-900/50"
                                    >
                                        <AlertTriangle className="w-4 h-4 mr-3 text-red-500 animate-pulse" />
                                        <span className="font-bold tracking-widest text-sm text-red-500 uppercase">Initiate Self-Destruct</span>
                                    </Command.Item>
                                </Command.Group>
                            </Command.List>
                        </Command>

                        <div className="px-4 py-2 border-t border-cyan-900/40 text-[10px] text-cyan-700 font-mono flex items-center justify-between bg-black/40">
                            <span>AluCalc OS Advanced Search</span>
                            <div className="flex gap-2 text-cyan-600">
                                <span><kbd className="bg-cyan-900/30 px-1.5 py-0.5 rounded text-cyan-400">↑↓</kbd> to navigate</span>
                                <span><kbd className="bg-cyan-900/30 px-1.5 py-0.5 rounded text-cyan-400">↵</kbd> to select</span>
                                <span><kbd className="bg-cyan-900/30 px-1.5 py-0.5 rounded text-cyan-400">esc</kbd> to close</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// Global CSS for CMDK to remove default styles
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        [cmdk-root] {
            width: 100%;
        }
        [cmdk-item][aria-selected="true"] {
            background-color: rgba(0, 229, 255, 0.1);
        }
    `;
    document.head.appendChild(style);
}
