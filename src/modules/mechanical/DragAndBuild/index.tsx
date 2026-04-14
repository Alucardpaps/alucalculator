/**
 * modules/mechanical/DragAndBuild/index.tsx
 * Ultra-Professional Avant-Garde Assembly Workspace
 */

import React, { useRef, useState, useEffect } from 'react';
import { useDragBuildStore } from './store';
import { Settings2, Wrench, Circle, Square, RotateCw, Trash2, Maximize2, MoveVertical, Layers, Box, Cpu, Grid3X3, Layers3, Activity, Command, Component } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

export default function DragAndBuildModule() {
    const { components, addComponent, startDrag, onDragMove, endDrag, snapTarget, rotatePart, removePart } = useDragBuildStore();
    const boardRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isCtrlPressed, setIsCtrlPressed] = useState(false);

    // Handle global mouse move during drag
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

        const handleMouseUp = () => {
            endDrag();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Control') setIsCtrlPressed(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Control') setIsCtrlPressed(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [onDragMove, endDrag]);

    const spawnMotor = () => {
        addComponent({
            id: uuidv4(),
            type: 'motor',
            name: 'NEMA 17 Stepper',
            position: { x: window.innerWidth / 2 - 25, y: window.innerHeight / 2 - 25 },
            rotation: 0,
            connectors: [
                { id: 'shaft-out', type: 'male', axis: 'x', position: { x: 40, y: 25 } },
                { id: 'mount-face', type: 'surface', axis: 'y', position: { x: 0, y: 0 } }
            ]
        });
    };

    const spawnBearing = () => {
        addComponent({
            id: uuidv4(),
            type: 'bearing',
            name: 'KFL08 Pillow B.',
            position: { x: window.innerWidth / 2 - 20, y: window.innerHeight / 2 - 20 },
            rotation: 0,
            connectors: [
                { id: 'shaft-in', type: 'female', axis: 'x', position: { x: 20, y: 20 } },
                { id: 'base-mount', type: 'surface', axis: 'y', position: { x: 20, y: 40 } }
            ]
        });
    };

    const spawnProfile = () => {
        addComponent({
            id: uuidv4(),
            type: 'profile',
            name: '2020 Extrusion',
            position: { x: window.innerWidth / 2 - 50, y: window.innerHeight / 2 - 10 },
            rotation: 0,
            connectors: [
                { id: 'slot-top', type: 'slot', axis: 'y', position: { x: 50, y: 0 } },
                { id: 'slot-bot', type: 'slot', axis: 'y', position: { x: 50, y: 20 } },
                { id: 'end-face-1', type: 'surface', axis: 'x', position: { x: 0, y: 10 } },
                { id: 'end-face-2', type: 'surface', axis: 'x', position: { x: 100, y: 10 } }
            ]
        });
    };

    const spawnRail = () => {
        addComponent({
            id: uuidv4(),
            type: 'rail',
            name: 'MGN12 Guide',
            position: { x: window.innerWidth / 2 - 50, y: window.innerHeight / 2 - 6 },
            rotation: 0,
            connectors: [
                { id: 'rail-bottom', type: 'surface', axis: 'y', position: { x: 50, y: 12 } }
            ]
        });
    };

    const renderComponent = (comp: any) => {
        const isTarget = snapTarget?.id === comp.id;

        const style: React.CSSProperties = {
            position: 'absolute',
            left: comp.position.x,
            top: comp.position.y,
            touchAction: 'none',
            transform: `rotate(${comp.rotation || 0}deg)`,
            transformOrigin: 'center',
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s',
            zIndex: isTarget ? 50 : 10
        };

        const handleRightClick = (e: React.MouseEvent) => {
            e.preventDefault();
            rotatePart(comp.id, 90);
        };

        const handleDoubleClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            removePart(comp.id);
        }

        let content = null;
        if (comp.type === 'motor') {
            content = (
                <div
                    onMouseDown={() => startDrag(comp.id)}
                    onContextMenu={handleRightClick}
                    onDoubleClick={handleDoubleClick}
                    className={`w-[50px] h-[50px] bg-gradient-to-br from-[#1e2330] to-[#12151e] border border-white/10 rounded-lg ${isTarget ? 'ring-2 ring-cyan-400/50 shadow-[0_0_30px_rgba(0,229,255,0.3)]' : 'shadow-2xl'} flex items-center justify-center cursor-grab active:cursor-grabbing group relative backdrop-blur-md`}
                >
                    <div className="absolute inset-1 rounded bg-[#0a0c10] border border-white/5 flex items-center justify-center">
                        <Square className="w-4 h-4 text-slate-600/50" />
                    </div>
                    {/* Shaft */}
                    <div className="absolute right-[-14px] top-[19px] w-[14px] h-[12px] bg-gradient-to-r from-slate-400 to-slate-200 rounded-r-sm border border-slate-500 shadow-inner" />
                </div>
            );
        } else if (comp.type === 'bearing') {
            content = (
                <div
                    onMouseDown={() => startDrag(comp.id)}
                    onContextMenu={handleRightClick}
                    onDoubleClick={handleDoubleClick}
                    className={`w-[40px] h-[40px] bg-gradient-to-t from-cyan-950/80 to-[#1e2d3d]/90 border border-cyan-500/30 rounded-full ${isTarget ? 'ring-2 ring-cyan-400 shadow-[0_0_30px_rgba(0,229,255,0.4)]' : 'shadow-[0_10px_20px_rgba(0,0,0,0.5)]'} flex items-center justify-center cursor-grab active:cursor-grabbing group relative backdrop-blur`}
                >
                    <div className="w-[20px] h-[20px] rounded-full bg-[#05070a] border border-cyan-500/20 shadow-inner flex items-center justify-center">
                        <div className="w-[12px] h-[12px] rounded-full bg-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]" />
                    </div>
                </div>
            );
        } else if (comp.type === 'profile') {
            content = (
                <div
                    onMouseDown={() => startDrag(comp.id)}
                    onContextMenu={handleRightClick}
                    onDoubleClick={handleDoubleClick}
                    className={`w-[100px] h-[20px] bg-[#2a2f3a] border border-white/10 ${isTarget ? 'ring-2 ring-cyan-400/50' : 'shadow-xl'} cursor-grab active:cursor-grabbing group overflow-hidden flex flex-col justify-between py-[3px]`}
                    style={{ backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)' }}
                >
                    <div className="w-full h-[3px] bg-black/40 shadow-inner" />
                    <div className="w-full h-[3px] bg-black/40 shadow-inner" />
                </div>
            );
        } else if (comp.type === 'rail') {
            content = (
                <div
                    onMouseDown={() => startDrag(comp.id)}
                    onContextMenu={handleRightClick}
                    onDoubleClick={handleDoubleClick}
                    className={`w-[100px] h-[12px] bg-gradient-to-b from-slate-400 to-slate-300 border border-slate-500 ${isTarget ? 'ring-2 ring-cyan-400/50' : 'shadow-xl'} cursor-grab active:cursor-grabbing relative group`}
                >
                    <div className="absolute top-[3px] left-0 right-0 h-[6px] bg-black/20" />
                    <div className="absolute left-[30px] top-[-6px] w-[34px] h-[24px] bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-500 rounded flex items-center justify-center shadow-lg group-hover:border-cyan-400/50 transition-colors">
                        <div className="w-2 h-2 rounded-full border border-slate-500/50" />
                    </div>
                </div>
            );
        }

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                key={comp.id}
                style={style}
            >
                {content}
                <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 text-[10px] text-cyan-400/80 whitespace-nowrap bg-[#0a0e14]/90 px-2 py-1 rounded-md border border-cyan-900/50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl backdrop-blur-md transform translate-y-2 group-hover:translate-y-0">
                    <span className="font-mono">{comp.name}</span>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="flex w-full h-full bg-[#05070a] text-slate-200 overflow-hidden font-sans relative">

            {/* Ambient Background Lights */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

            {/* Left Library Panel (Floating Glassmorphism) */}
            <div className="w-[300px] h-full p-4 z-20 flex flex-col">
                <div className="bg-[#0a0e14]/60 backdrop-blur-2xl border border-white/5 rounded-2xl h-full flex flex-col shadow-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                <Component className="text-cyan-400 w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="font-bold tracking-wide text-sm text-white">Engineering Vault</h2>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Tier-1 Validated Parts</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        <LibraryItem
                            icon={Square}
                            title="Stepper Motor" subtitle="NEMA 17 / Male Shaft"
                            desc="Precision rotary actuator"
                            onClick={spawnMotor}
                        />
                        <LibraryItem
                            icon={Circle}
                            title="Pillow Block" subtitle="KFL08 Bearing"
                            desc="Low-friction rotary support"
                            onClick={spawnBearing}
                        />
                        <LibraryItem
                            icon={Maximize2}
                            title="Extrusion Profile" subtitle="20x20mm Aluminum"
                            desc="Structural framework element"
                            onClick={spawnProfile}
                        />
                        <LibraryItem
                            icon={MoveVertical}
                            title="Linear Guide" subtitle="MGN12 w/ Block"
                            desc="High-precision linear motion"
                            onClick={spawnRail}
                        />
                    </div>

                    <div className="p-4 bg-black/20 border-t border-white/5">
                        <div className="p-4 bg-gradient-to-br from-cyan-950/20 to-blue-900/10 border border-cyan-900/30 rounded-xl text-[11px] text-cyan-100/70 leading-relaxed">
                            <div className="font-bold text-cyan-400 mb-2 flex items-center gap-2 tracking-wide uppercase text-[10px]">
                                <Command size={12} /> System Controls
                            </div>
                            <ul className="space-y-2 opacity-90">
                                <li className="flex gap-2 items-start"><span className="text-cyan-500 font-bold">•</span> Drag parts to snap automatically.</li>
                                <li className="flex gap-2 items-start"><span className="text-cyan-500 font-bold">•</span> Right-Click to rotate 90°.</li>
                                <li className="flex gap-2 items-start"><span className="text-cyan-500 font-bold">•</span> Double-Click to delete part.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Assembly Canvas */}
            <div
                ref={boardRef}
                className="flex-1 relative z-10 cursor-crosshair"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
                        radial-gradient(circle at center, rgba(0,229,255,0.05) 0%, transparent 60%)
                    `,
                    backgroundSize: '40px 40px, 40px 40px, 100% 100%',
                    backgroundPosition: 'center center'
                }}
            >
                {/* HUD Overlay */}
                <div className="absolute top-6 right-6 flex flex-col gap-2 z-30 pointer-events-none">
                    <div className="bg-[#0a0e14]/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full flex items-center gap-4 shadow-xl">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00e5ff]" />
                            <span className="text-[10px] font-mono tracking-widest text-slate-300 uppercase">Kinematic Solver</span>
                        </div>
                        <div className="w-[1px] h-3 bg-white/10" />
                        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-tighter">Active</span>
                    </div>
                </div>

                <div className="absolute bottom-6 right-6 bg-[#0a0e14]/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl flex shadow-xl z-30 pointer-events-none text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                    XYZ: {Math.round(mousePos.x)} , {Math.round(mousePos.y)}
                </div>

                {/* Constraint Visualization */}
                <AnimatePresence>
                    {snapTarget && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute pointer-events-none z-40"
                            style={{ left: snapTarget.position.x + 25, top: snapTarget.position.y - 40 }}
                        >
                            <div className="flex flex-col items-center">
                                <div className="bg-cyan-500 text-black text-[9px] font-bold px-2 py-0.5 rounded shadow-[0_0_15px_rgba(0,229,255,0.5)]">MATING CONFLICT RESOLVED</div>
                                <div className="h-10 w-px bg-cyan-400"></div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {components.map(renderComponent)}

                {components.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20 text-slate-400">
                        <Box size={64} className="mb-6 drop-shadow-2xl" strokeWidth={1} />
                        <p className="font-mono uppercase tracking-[0.3em] text-sm font-bold">Workspace Empty</p>
                        <p className="text-[10px] uppercase tracking-widest mt-2">Deploy components from the vault</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Sub-component for Library Items
function LibraryItem({ icon: Icon, title, subtitle, desc, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="w-full relative p-3 bg-white/[0.02] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 rounded-xl text-left transition-all duration-300 group overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex gap-4 relative z-10">
                <div className="w-10 h-10 shrink-0 bg-[#05070a] border border-white/10 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all duration-300">
                    <Icon className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </div>
                <div className="flex flex-col justify-center">
                    <div className="font-bold text-slate-200 text-xs tracking-wide group-hover:text-white transition-colors">{title}</div>
                    <div className="text-[10px] text-cyan-500/70 font-mono tracking-wider mt-0.5">{subtitle}</div>
                    <div className="text-[9px] text-slate-500 mt-1.5 leading-tight pr-2">{desc}</div>
                </div>
            </div>
        </button>
    );
}
