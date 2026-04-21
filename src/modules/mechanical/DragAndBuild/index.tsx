'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { 
    Settings2, Wrench, Circle, Square, RotateCw, Trash2, 
    Maximize2, MoveVertical, Layers, Box, Cpu, Grid3X3, 
    Layers3, Activity, Command, Component, Plus, Play,
    Share2, Info, Layout
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { useDragBuildStore } from './store';

export default function DragAndBuildModule() {
    const { components, addComponent, startDrag, onDragMove, endDrag, snapTarget, rotatePart, removePart } = useDragBuildStore();
    const boardRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [activeTool, setActiveTool] = useState<'transform' | 'logic'>('transform');

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (boardRef.current) {
                const rect = boardRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                setMousePos({ x, y });
                onDragMove(x, y);
            }
        };

        const handleMouseUp = () => endDrag();

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [onDragMove, endDrag]);

    const dof = useMemo(() => {
        const n = components.length;
        if (n === 0) return 0;
        return Math.max(0, 3 * (n - 1)); // Simplified Gruebler for this UI
    }, [components]);

    return (
        <div className="flex w-full h-full bg-[#020408] text-slate-200 overflow-hidden font-sans relative">
            {/* Ambient FX */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.05)_0%,transparent_50%)] pointer-events-none" />
            
            {/* Sidebar Library */}
            <div className="w-[340px] h-full p-6 z-20 flex flex-col bg-[#05080f]/95 border-r border-white/5 backdrop-blur-3xl shadow-2xl">
                <div className="mb-10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                            <Layout size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black italic tracking-tighter uppercase leading-none">Assembly Node</h1>
                            <p className="text-[10px] text-blue-500/60 font-mono tracking-widest uppercase mt-1">Modular Synthesis v2.4</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Standard Modules</div>
                    <PartButton 
                        icon={<Square size={16}/>} 
                        title="Actuator" 
                        sub="NEMA 17 Stepper" 
                        onClick={() => addComponent({ id: uuidv4(), type: 'motor', name: 'NEMA 17', position: { x: 400, y: 300 }, rotation: 0, connectors: [] })}
                    />
                    <PartButton 
                        icon={<Circle size={16}/>} 
                        title="Support" 
                        sub="KFL08 Bearing" 
                        onClick={() => addComponent({ id: uuidv4(), type: 'bearing', name: 'KFL Bearing', position: { x: 400, y: 300 }, rotation: 0, connectors: [] })}
                    />
                    <PartButton 
                        icon={<Maximize2 size={16}/>} 
                        title="Structure" 
                        sub="2020 Aluminum" 
                        onClick={() => addComponent({ id: uuidv4(), type: 'profile', name: 'Extrusion', position: { x: 400, y: 300 }, rotation: 0, connectors: [] })}
                    />
                    <PartButton 
                        icon={<MoveVertical size={16}/>} 
                        title="Motion" 
                        sub="MGN12 Linear" 
                        onClick={() => addComponent({ id: uuidv4(), type: 'rail', name: 'Linear Rail', position: { x: 400, y: 300 }, rotation: 0, connectors: [] })}
                    />
                </div>

                <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Mobility Factor</span>
                            <span className="text-xl font-mono font-black text-white">{dof}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div animate={{ width: `${Math.min(100, (dof/12)*100)}%` }} className="h-full bg-blue-500 shadow-[0_0_15px_#3b82f6]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Assembly Surface */}
            <div 
                ref={boardRef}
                className="flex-1 relative z-10 cursor-crosshair overflow-hidden"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }}
            >
                {/* HUD Controls */}
                <div className="absolute top-8 right-8 flex gap-4 z-50">
                    <button className="px-5 py-2.5 bg-[#0a0f18]/90 backdrop-blur-xl border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3">
                        <Play size={14} className="text-emerald-400" /> Solve Physics
                    </button>
                    <button className="p-2.5 bg-[#0a0f18]/90 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-white/10 transition-all shadow-2xl">
                        <Share2 size={16} />
                    </button>
                </div>

                {components.map((comp) => (
                    <RenderComponent 
                        key={comp.id} 
                        comp={comp} 
                        isTarget={snapTarget?.id === comp.id}
                        onStartDrag={startDrag}
                        onRotate={rotatePart}
                        onDelete={removePart}
                    />
                ))}

                {components.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none">
                        <Box size={80} strokeWidth={1} className="text-slate-500 mb-6" />
                        <h2 className="text-lg font-black uppercase tracking-[0.4em] text-slate-500 italic">Surface Initialized</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700 mt-2">Deploy hardware from the vault</p>
                    </div>
                )}

                <div className="absolute bottom-8 left-8 text-[10px] font-black text-slate-700 uppercase tracking-widest bg-black/40 px-4 py-2 rounded-lg border border-white/5 backdrop-blur-md">
                    Coordinates: {Math.round(mousePos.x)}, {Math.round(mousePos.y)}
                </div>
            </div>
        </div>
    );
}

function PartButton({ icon, title, sub, onClick }: any) {
    return (
        <button onClick={onClick} className="w-full p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-left group hover:bg-blue-500/10 hover:border-blue-500/30 transition-all flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
                {icon}
            </div>
            <div>
                <div className="text-[11px] font-black text-white uppercase tracking-wider">{title}</div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">{sub}</div>
            </div>
        </button>
    );
}

function RenderComponent({ comp, isTarget, onStartDrag, onRotate, onDelete }: any) {
    const isMotor = comp.type === 'motor';
    const isBearing = comp.type === 'bearing';
    const isProfile = comp.type === 'profile';
    const isRail = comp.type === 'rail';

    return (
        <motion.div
            layoutId={comp.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, x: comp.position.x, y: comp.position.y, rotate: comp.rotation || 0 }}
            className={`absolute cursor-grab active:cursor-grabbing group p-1`}
            onMouseDown={() => onStartDrag(comp.id)}
            onContextMenu={(e) => { e.preventDefault(); onRotate(comp.id, 90); }}
            onDoubleClick={(e) => { e.stopPropagation(); onDelete(comp.id); }}
            style={{ x: comp.position.x, y: comp.position.y }}
        >
            <div className={`relative transition-all duration-300 ${isTarget ? 'ring-2 ring-cyan-400 shadow-[0_0_30px_rgba(0,255,255,0.3)]' : 'shadow-2xl'}`}>
                {isMotor && (
                    <div className="w-12 h-12 bg-[#1e2330] border border-white/10 rounded-lg flex items-center justify-center relative shadow-inner">
                        <div className="absolute inset-1 border border-white/5 bg-[#0a0c10]/80 flex items-center justify-center">
                            <Square size={12} className="text-slate-800" />
                        </div>
                        <div className="absolute -right-3 top-4 w-3 h-3 bg-gradient-to-r from-slate-400 to-slate-200 border border-slate-500 rounded-r-sm shadow-xl" />
                    </div>
                )}
                {isBearing && (
                    <div className="w-10 h-10 bg-cyan-900/40 border border-cyan-500/30 rounded-full flex items-center justify-center relative shadow-inner">
                        <div className="w-5 h-5 bg-[#05070a] border border-cyan-500/20 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-black rounded-full" />
                        </div>
                    </div>
                )}
                {isProfile && (
                    <div className="w-24 h-6 bg-[#2a2f3a] border border-white/10 rounded-sm relative shadow-inner flex flex-col justify-around py-1">
                        <div className="h-0.5 bg-black/40 w-full" />
                        <div className="h-0.5 bg-black/40 w-full" />
                    </div>
                )}
                {isRail && (
                    <div className="w-24 h-3 bg-gradient-to-b from-slate-400 to-slate-300 border border-slate-500 rounded-px relative shadow-inner">
                        <div className="absolute inset-0 bg-black/10 h-0.5 mt-1" />
                        <div className="absolute left-8 -top-1 w-8 h-5 bg-[#141b27] border border-slate-500 rounded shadow-md group-hover:border-cyan-500/50" />
                    </div>
                )}
            </div>
            
            {/* Tooltip */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#0a0e14] border border-white/10 rounded text-[8px] font-black uppercase text-blue-400 opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-2xl backdrop-blur-md">
                {comp.name}
            </div>
        </motion.div>
    );
}
