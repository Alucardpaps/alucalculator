'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Terminal, Zap, Hash, MousePointer2 } from 'lucide-react';
import { useOSStore } from '@/store/osStore';

/**
 * AutoCAD-Style Command Bar
 * 
 * Provides a text-based interface for the engineering workstation.
 * Supports commands like:
 * - OPEN [module]
 * - CALC [expr]
 * - SET [var] [val]
 * - MAT [query]
 */
export const AutoCADCommandBar: React.FC = () => {
    const [command, setCommand] = useState('');
    const [history, setHistory] = useState<string[]>(['Welcome to AluCalc OS v5.0 Command Engine.', 'Type HELP for a list of available commands.']);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const inputRef = useRef<HTMLInputElement>(null);
    const { openWindow } = useOSStore();

    // Mouse coordinate tracking
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setCoords({ x: Math.round(e.clientX), y: Math.round(e.clientY) });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const executeCommand = (cmd: string) => {
        const parts = cmd.trim().split(' ');
        const action = parts[0].toUpperCase();
        const args = parts.slice(1);

        setHistory(prev => [...prev, `> ${cmd}`]);

        switch (action) {
            case 'OPEN':
                if (args[0]) {
                    openWindow(args[0] as any);
                    setHistory(prev => [...prev, `Opening module: ${args[0]}`]);
                }
                break;
            case 'HELP':
                setHistory(prev => [...prev, 'Available: OPEN, CALC, SET, MAT, CLEAR, EXIT']);
                break;
            case 'CLEAR':
                setHistory([]);
                break;
            case 'MAT':
                openWindow('material-selector-ai');
                setHistory(prev => [...prev, `Invoking Material AI for: ${args.join(' ')}`]);
                break;
            default:
                setHistory(prev => [...prev, `Unknown command: ${action}`]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!command.trim()) return;
        executeCommand(command);
        setCommand('');
    };

    return (
        <div className="absolute bottom-0 left-0 right-0 z-[100] bg-[#0c111a] border-t border-cyan-500/20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] font-mono">
            {/* Status Line */}
            <div className="flex items-center justify-between px-4 py-1 bg-black/40 border-b border-cyan-900/10 text-[9px] text-cyan-900/60 font-bold uppercase tracking-widest">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1"><MousePointer2 size={10} /> X: {coords.x} Y: {coords.y}</span>
                    <span className="flex items-center gap-1 text-cyan-600/40"><Hash size={10} /> SNAP: OFF</span>
                    <span className="flex items-center gap-1 text-emerald-600/40 font-black"><Zap size={10} /> KERNEL: ACTIVE</span>
                </div>
                <div className="flex gap-3">
                    <span>UNIT: METRIC (MM)</span>
                    <span>GRID: 10MM</span>
                </div>
            </div>

            {/* Input & Output Split */}
            <div className="flex h-12">
                {/* Console History (Single line preview) */}
                <div className="hidden md:flex w-1/3 border-r border-cyan-900/20 bg-black/20 items-center px-4 overflow-hidden">
                    <span className="text-[10px] text-slate-500 truncate italic">
                        {history[history.length - 1]}
                    </span>
                </div>

                {/* Command Input Area */}
                <div className="flex-1 relative flex items-center group">
                    <div className="pl-4 pr-2 text-cyan-400 font-black flex items-center gap-2">
                        <Terminal size={14} className="animate-pulse" />
                        <span>COMMAND:</span>
                    </div>
                    <form onSubmit={handleSubmit} className="flex-1">
                        <input
                            ref={inputRef}
                            type="text"
                            autoFocus
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            className="w-full bg-transparent border-none text-white text-sm focus:outline-none placeholder-cyan-900/30 uppercase font-black"
                            placeholder="Type command (e.g. OPEN MOTOR)..."
                        />
                    </form>
                    <div className="px-4 flex items-center gap-2 text-[10px] text-cyan-900/40">
                        <span className="bg-cyan-950/40 px-1 rounded border border-cyan-900/20">CTRL+K</span>
                        <ChevronRight size={14} />
                    </div>
                </div>
            </div>
        </div>
    );
};
