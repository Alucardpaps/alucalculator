'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { StructuralEngine, Node2D, Element2D, PointLoad } from '@/engines/structure/StructuralEngine';
import { MATERIALS, MaterialService } from '@/engines/materials/MaterialDatabase';

// ============================================
// COLORS & STYLES (Avant-Garde)
// ============================================
const COLORS = {
    bg: '#0a0e14',
    grid: '#1e2833',
    node: '#ffffff',
    nodeFixed: '#ff0055',
    nodePin: '#00e5ff',
    element: '#8899ac',
    elementSelected: '#00e5ff',
    load: '#ffaa00',
    text: '#ffffff',
    sfd: 'rgba(0, 229, 255, 0.2)',
    bmd: 'rgba(255, 0, 85, 0.2)',
    deflection: '#00ffaa'
};

// ============================================
// CANVAS COMPONENT
// ============================================

export default function BeamCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const engine = useRef(new StructuralEngine());

    // UI State
    const [results, setResults] = useState<any>(null);
    const [hoverPos, setHoverPos] = useState<{ x: number, y: number } | null>(null);

    // Engineering State
    const [selectedMatId, setSelectedMatId] = useState<string>('alu_6061');
    const [selectedTreatId, setSelectedTreatId] = useState<string>('t6');
    const [tempChange, setTempChange] = useState<number>(0);
    const [loadValue, setLoadValue] = useState<number>(-1000);

    // Physics / Game State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPhysicsMode, setIsPhysicsMode] = useState(false);
    const physicsFrameRef = useRef<number>(0);
    const dragNodeRef = useRef<string | null>(null);

    // Camera State
    const [camera, setCamera] = useState({ x: 2500, y: 0, zoom: 0.15 });

    // Computed Properties for Display
    const activeMaterial = MaterialService.resolveProperties(selectedMatId, selectedTreatId);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && canvasRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                canvasRef.current.width = clientWidth;
                canvasRef.current.height = clientHeight;
                // Force re-render
                setCamera(prev => ({ ...prev }));
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Init

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // UPDATE ENGINE ON STATE CHANGE
    useEffect(() => {
        const eng = engine.current;
        eng.nodes = []; eng.elements = []; eng.materials = []; eng.sections = []; eng.loads = []; // Reset

        // 1. Define Structure
        const n1 = eng.addNode(0, 0, { x: true, y: true, moment: true }); // Fixed
        const n2 = eng.addNode(5000, 0); // Free end

        // 2. Add Material (Dynamic)
        const mat = eng.addMaterial(selectedMatId, selectedTreatId);

        // 3. Add Section (Static for now, but could be dynamic)
        const sec = eng.addSection("IPE 100", 1000, 8000000, 100);

        // 4. Add Element with Thermal Load
        const elemId = eng.addElement(n1, n2, mat, sec);
        eng.elements.find(e => e.id === elemId)!.tempChange = tempChange;

        // 5. Add Load
        eng.addLoad(n2, 0, loadValue, 0);

        // 6. SOLVE
        const res = eng.solve();
        setResults(res);

    }, [selectedMatId, selectedTreatId, tempChange, loadValue]); // Re-solve on any change

    // PHYSICS LOOP
    useEffect(() => {
        if (!isPlaying) {
            cancelAnimationFrame(physicsFrameRef.current);
            return;
        }

        const loop = () => {
            // Sub-steps for stability (10 steps of 1.6ms)
            for (let i = 0; i < 10; i++) {
                engine.current.stepSimulation(0.0016, true);
            }
            physicsFrameRef.current = requestAnimationFrame(loop);
        };
        loop();

        return () => cancelAnimationFrame(physicsFrameRef.current);
    }, [isPlaying]);

    // TOGGLE MODE
    const togglePhysics = () => {
        if (!isPhysicsMode) {
            // Enter Physics Mode
            engine.current.initSimulation();
            setIsPlaying(true);
            setIsPhysicsMode(true);
        } else {
            // Reset to Editor
            setIsPlaying(false);
            setIsPhysicsMode(false);
            // We should re-solve static here or allow user to edit
            // For now, just stop.
        }
    };

    // --- RENDER LOOP ---
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Clear
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Transform
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(camera.zoom, -camera.zoom); // Flip Y
        ctx.translate(-camera.x, -camera.y);

        // 1. Draw Infinite Grid
        drawEngineeringGrid(ctx, camera);

        // 2. Draw Elements
        // If Physics Mode, draw straight lines between current node positions
        // If Static Mode, draw result curves if avail

        engine.current.elements.forEach(elem => {
            const n1 = engine.current.nodes.find(n => n.id === elem.startNodeId);
            const n2 = engine.current.nodes.find(n => n.id === elem.endNodeId);
            if (!n1 || !n2) return;

            if (elem.broken) return; // Don't draw broken elements or draw them faint

            ctx.save();
            ctx.lineCap = 'round';

            if (isPhysicsMode) {
                // Dynamic Style
                // Calculate strain color
                // This requires re-calc length every frame here? Or assume logic is fast.
                const curLen = Math.hypot(n2.x - n1.x, n2.y - n1.y);
                const L0 = elem.initialLength || curLen;
                const strain = (curLen - L0) / L0;

                // Color based on tension/compression
                ctx.lineWidth = 60; // Visual thickness
                if (strain > 0) ctx.strokeStyle = `rgba(0, 255, 170, ${Math.min(1, strain * 100 + 0.5)})`; // Tension (Green)
                else ctx.strokeStyle = `rgba(255, 0, 85, ${Math.min(1, Math.abs(strain) * 100 + 0.5)})`; // Compression (Red)

                ctx.beginPath();
                ctx.moveTo(n1.x, n1.y);
                ctx.lineTo(n2.x, n2.y);
                ctx.stroke();
            } else {
                // Static Style (Original)
                const thickness = 100; // Visual thickness (mm)

                // Determine Color based on Stress
                let color = COLORS.element;
                if (results && results.stresses && results.stresses[elem.id]) {
                    const stress = results.stresses[elem.id];
                    const sf = stress.safety_factor;

                    // Heatmap Logic: Red < 1.0 < Yellow < 2.0 < Green
                    if (sf < 1.0) color = '#ff0000'; // Fail
                    else if (sf < 1.5) color = '#ffaa00'; // Warning
                    else if (sf < 3.0) color = '#00e5ff'; // Optimal
                    else color = '#00ffaa'; // Safe
                }

                ctx.strokeStyle = color;
                ctx.lineWidth = thickness / 2;
                ctx.lineCap = 'butt';
                ctx.shadowColor = color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(n1.x, n1.y);
                ctx.lineTo(n2.x, n2.y);
                ctx.stroke();

                // Draw Centerline
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 2 / camera.zoom;
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.moveTo(n1.x, n1.y);
                ctx.lineTo(n2.x, n2.y);
                ctx.stroke();

                // Draw Deflection curve if results exist
                if (results && results.success && results.displacements[n1.id]) {
                    // ... (keep loose deflection drawing if wanted)
                    ctx.save();
                    ctx.strokeStyle = 'rgba(0, 255, 170, 0.3)';
                    ctx.lineWidth = 2 / camera.zoom;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();

                    const d1 = results.displacements[n1.id];
                    const d2 = results.displacements[n2.id];

                    if (n1 && n2 && d1 && d2) {
                        const scale = 50;
                        ctx.moveTo(n1.x + d1.u * scale, n1.y + d1.v * scale);
                        ctx.lineTo(n2.x + d2.u * scale, n2.y + d2.v * scale);
                    }
                    ctx.stroke();
                    ctx.restore();
                }
            }
            ctx.restore();
        });

        // 3. Draw Nodes
        engine.current.nodes.forEach(node => {
            drawSupport(ctx, node, camera.zoom);
        });

        // 4. Draw Loads (Stylized Arrows) - Only in static mode
        if (!isPhysicsMode) {
            engine.current.loads.forEach(load => {
                drawLoad(ctx, load, engine.current.nodes, camera.zoom);
            });
        }


        // 5. Mouse Spring (Game Mode)
        if (isPhysicsMode && dragNodeRef.current && hoverPos && containerRef.current) {
            const node = engine.current.nodes.find(n => n.id === dragNodeRef.current);
            if (node) {
                // Mouse Pos in Global Coords
                // rect is handled in hook, but here we need global.
                // Re-calculate mouse world pos... this is tricky inside render without state.
                // Actually we just use the cursor interaction to apply force,
                // but visual line is nice.
            }
        }

        ctx.restore();
    }, [camera, results, isPhysicsMode]);

    useEffect(() => {
        const frame = requestAnimationFrame(render);
        return () => cancelAnimationFrame(frame);
    }, [render]);

    // --- INPUT HANDLERS ---
    const isDragging = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });

    const getWorldPos = (e: React.PointerEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Inverse Transform
        // Screen = (World - Cam) * Zoom + Center
        // World = ((Screen - Center) / Zoom) + Cam
        // Y is flipped! ScreenY = CenterY - (WorldY - CamY) * Zoom
        // => WorldY - CamY = (CenterY - ScreenY) / Zoom
        // => WorldY = CamY + (CenterY - ScreenY) / Zoom

        const cx = canvasRef.current.width / 2;
        const cy = canvasRef.current.height / 2;

        const wx = camera.x + (mx - cx) / camera.zoom;
        const wy = camera.y + (cy - my) / camera.zoom;

        return { x: wx, y: wy };
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);

        if (isPhysicsMode) {
            // Check for node hit
            const wPos = getWorldPos(e);
            // Find nearest node
            const hitNode = engine.current.nodes.find(n => Math.hypot(n.x - wPos.x, n.y - wPos.y) < (100 / camera.zoom)); // Hit radius depends on zoom? or fixed world radius?
            if (hitNode) {
                dragNodeRef.current = hitNode.id;
            }
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;

        if (isDragging.current) {
            if (isPhysicsMode && dragNodeRef.current) {
                // Apply Force to Node
                // Spring force: F = k * (Mouse - Node)
                const node = engine.current.nodes.find(n => n.id === dragNodeRef.current);
                if (node) {
                    const wPos = getWorldPos(e);
                    const k_mouse = 5000; // Stiffness

                    // Directly modify force accumulator (hacky but fast)
                    node.forceX = (node.forceX || 0) + (wPos.x - node.x) * k_mouse;
                    node.forceY = (node.forceY || 0) + (wPos.y - node.y) * k_mouse;

                    // Also wake up velocity
                    node.vx = (node.vx || 0) * 0.9;
                    node.vy = (node.vy || 0) * 0.9;
                }
            } else {
                // Pan Camera
                setCamera(prev => ({
                    ...prev,
                    x: prev.x - dx / prev.zoom,
                    y: prev.y + dy / prev.zoom
                }));
            }
        }

        lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        isDragging.current = false;
        dragNodeRef.current = null;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    // --- ZOOM HANDLER ---
    const handleWheel = (e: React.WheelEvent) => {
        const zoomSensitivity = 0.001;
        const newZoom = camera.zoom * (1 - e.deltaY * zoomSensitivity);
        setCamera(prev => ({ ...prev, zoom: Math.max(0.01, Math.min(newZoom, 5)) }));
    };

    return (
        <div className="w-full h-full relative font-mono bg-[#050505] overflow-hidden">

            {/* TOP BAR */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-2xl bg-[#1a1a1a]/60 backdrop-blur-xl border border-white/10 shadow-2xl z-10">
                <div className="text-[#00e5ff] font-bold text-sm tracking-wider flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isPhysicsMode ? 'bg-[#ff0055] animate-ping' : 'bg-[#00e5ff]'}`} />
                    {isPhysicsMode ? 'SIMULATION MODE' : 'BEAM ENGINE'}
                </div>
                <div className="h-4 w-px bg-white/20 mx-2" />

                {!isPhysicsMode ? (
                    <button
                        onClick={togglePhysics}
                        className="px-4 py-1.5 bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/50 rounded hover:bg-[#00e5ff] hover:text-black transition-all text-xs font-bold tracking-widest flex items-center gap-2"
                    >
                        <span>ENTER GAME MODE</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className={`px-4 py-1.5 rounded border transition-all text-xs font-bold tracking-widest ${isPlaying
                                ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50'
                                : 'bg-green-500/20 text-green-500 border-green-500/50'
                                }`}
                        >
                            {isPlaying ? 'PAUSE' : 'RESUME'}
                        </button>
                        <button
                            onClick={togglePhysics}
                            className="px-4 py-1.5 bg-red-500/10 text-red-500 border border-red-500/50 rounded hover:bg-red-500 hover:text-white transition-all text-xs font-bold tracking-widest"
                        >
                            RESET
                        </button>
                    </div>
                )}
            </div>

            {/* LEFT SIDEBAR - ENGINEERING CONTROLS */}
            <div className="absolute top-24 left-6 w-80 flex flex-col gap-4 z-20 pointer-events-auto">

                {/* MATERIAL PANEL */}
                <div className="bg-[#0a0e14]/90 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-xl">
                    <h3 className="text-white text-xs font-bold mb-4 flex items-center gap-2">
                        <span className="w-1 h-3 bg-[#00e5ff] rounded-full" /> MATERIAL SCIENCE
                    </h3>

                    {/* Material Select */}
                    <div className="mb-4">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Base Alloy</label>
                        <select
                            value={selectedMatId}
                            onChange={(e) => {
                                setSelectedMatId(e.target.value);
                                // Reset treatment to default for new mat
                                const newMat = MATERIALS.find(m => m.id === e.target.value);
                                if (newMat) setSelectedTreatId(newMat.treatments[0].id);
                            }}
                            className="w-full bg-black/50 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-[#00e5ff] outline-none appearance-none cursor-pointer"
                        >
                            {MATERIALS.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Treatment Select */}
                    <div className="mb-4">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Heat Treatment / Condition</label>
                        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto custom-scrollbar">
                            {MATERIALS.find(m => m.id === selectedMatId)?.treatments.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTreatId(t.id)}
                                    className={`text-left px-2 py-1.5 rounded border text-xs transition-all w-full mb-1 ${selectedTreatId === t.id
                                        ? 'bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff]'
                                        : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <div className="font-bold">{t.name}</div>
                                    <div className="text-[9px] opacity-70">{t.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Properties Display */}
                    {activeMaterial && (
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-400 bg-black/30 p-2 rounded border border-white/5">
                            <div>Yield: <span className="text-white">{activeMaterial.yieldStrength} MPa</span></div>
                            <div>Ultimate: <span className="text-white">{activeMaterial.ultimateStrength} MPa</span></div>
                            <div>Hardness: <span className="text-white">{activeMaterial.hardnessHv} HV</span></div>
                            <div>Density: <span className="text-white">{activeMaterial.density} kg/m³</span></div>
                        </div>
                    )}
                </div>

                {/* PHYSICS LOADS PANEL */}
                <div className="bg-[#0a0e14]/90 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-xl">
                    <h3 className="text-white text-xs font-bold mb-4 flex items-center gap-2">
                        <span className="w-1 h-3 bg-[#ff0055] rounded-full" /> LOADS & ENV
                    </h3>

                    {/* Thermal Slider */}
                    <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Thermal ΔT</span>
                            <span className={tempChange > 0 ? "text-red-400" : tempChange < 0 ? "text-blue-400" : "text-gray-300"}>
                                {tempChange > 0 ? '+' : ''}{tempChange}°C
                            </span>
                        </div>
                        <input
                            type="range" min="-100" max="100" step="1"
                            value={tempChange}
                            onChange={(e) => setTempChange(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ff0055]"
                        />
                    </div>

                    {/* Load Slider */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Vertical Load</span>
                            <span className="text-white">{loadValue} N</span>
                        </div>
                        <input
                            type="range" min="-5000" max="5000" step="100"
                            value={loadValue}
                            onChange={(e) => setLoadValue(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ffaa00]"
                        />
                    </div>
                </div>

            </div>

            {/* RESULTS PANEL */}
            {results && (
                <div className="absolute top-24 right-6 w-64 bg-[#0a0e14]/90 backdrop-blur-md border border-[#00e5ff]/30 rounded-lg p-4 shadow-[0_0_30px_rgba(0,229,255,0.1)]">
                    <h3 className="text-[#00e5ff] text-xs font-bold mb-3 border-b border-[#00e5ff]/20 pb-2 flex justify-between">
                        <span>ANALYSIS RESULTS</span>
                        <span className={results.success ? "text-green-500" : "text-red-500"}>●</span>
                    </h3>

                    {results.success ? (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400">Max Deflection</span>
                                <span className="text-white font-mono bg-[#00e5ff]/10 px-2 py-0.5 rounded border border-[#00e5ff]/20">
                                    {Math.max(...Object.values(results.displacements).map((d: any) => Math.abs(d.v))).toFixed(3)} mm
                                </span>
                            </div>

                            <div className="text-[10px] text-gray-500 font-mono mt-2">
                                <div className="mb-1">REACTIONS (N, Nmm)</div>
                                {Object.entries(results.reactions).map(([id, r]: any) => (
                                    <div key={id} className="flex justify-between border-t border-white/5 py-1">
                                        <span>{id}</span>
                                        <span className="text-gray-300">
                                            {r.fy.toFixed(0)} N / {(r.moment / 1000).toFixed(1)} Nm
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-red-400 text-xs">{results.error}</div>
                    )}
                </div>
            )}

            <div ref={containerRef} className="w-full h-full relative">
                <canvas
                    ref={canvasRef}
                    className="block w-full h-full cursor-crosshair touch-none"
                    style={{ touchAction: 'none' }}
                    onWheel={handleWheel}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                />
            </div>
        </div>
    );
}

// --- HELPER DRAWING FUNCTIONS ---

function drawEngineeringGrid(ctx: CanvasRenderingContext2D, camera: any) {
    const zoom = camera.zoom;
    const majorGrid = 1000; // 1m
    const minorGrid = 100;  // 100mm

    const startX = Math.floor((camera.x - (ctx.canvas.width / 2) / zoom) / minorGrid) * minorGrid;
    const endX = Math.ceil((camera.x + (ctx.canvas.width / 2) / zoom) / minorGrid) * minorGrid;
    const startY = Math.floor((camera.y - (ctx.canvas.height / 2) / zoom) / minorGrid) * minorGrid;
    const endY = Math.ceil((camera.y + (ctx.canvas.height / 2) / zoom) / minorGrid) * minorGrid;

    ctx.save();
    ctx.lineWidth = 1 / zoom;

    // Minor Grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.beginPath();
    for (let x = startX; x <= endX; x += minorGrid) {
        ctx.moveTo(x, startY); ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += minorGrid) {
        ctx.moveTo(startX, y); ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Major Grid
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    for (let x = startX; x <= endX; x += minorGrid) {
        if (x % majorGrid === 0) { ctx.moveTo(x, startY); ctx.lineTo(x, endY); }
    }
    for (let y = startY; y <= endY; y += minorGrid) {
        if (y % majorGrid === 0) { ctx.moveTo(startX, y); ctx.lineTo(endX, y); }
    }
    ctx.stroke();

    // Origin
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    ctx.moveTo(-100, 0); ctx.lineTo(100, 0);
    ctx.moveTo(0, -100); ctx.lineTo(0, 100);
    ctx.stroke();

    ctx.restore();
}

function drawSupport(ctx: CanvasRenderingContext2D, node: Node2D, zoom: number) {
    const size = 300; // mm visual size
    ctx.save();
    ctx.translate(node.x, node.y);

    ctx.fillStyle = COLORS.node;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2); // Node Joint
    ctx.fill();

    if (node.restraints.x && node.restraints.y && node.restraints.moment) {
        // FIXED SUPPORT (Hatch)
        ctx.strokeStyle = COLORS.nodeFixed;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -size / 2); ctx.lineTo(0, size / 2); // Vertical wall
        ctx.stroke();

        // Hatches
        ctx.strokeStyle = '#555';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const y = -size / 2 + (i * size) / 4;
            ctx.moveTo(0, y); ctx.lineTo(-50, y - 50);
        }
        ctx.stroke();
    }
    else if (node.restraints.x && node.restraints.y) {
        // PIN SUPPORT (Triangle)
        ctx.fillStyle = COLORS.nodePin;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-size / 3, -size / 2);
        ctx.lineTo(size / 3, -size / 2);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

function drawLoad(ctx: CanvasRenderingContext2D, load: PointLoad, nodes: Node2D[], zoom: number) {
    const node = nodes.find(n => n.id === load.nodeId);
    if (!node) return;

    const scale = 1; // Visual scale for load vector
    const len = 800; // Fixed arrow length in world units

    ctx.save();
    ctx.translate(node.x, node.y);
    ctx.strokeStyle = COLORS.load;
    ctx.fillStyle = COLORS.load;
    ctx.lineWidth = 5;

    if (load.fy < 0) {
        // Down Arrow
        ctx.beginPath();
        ctx.moveTo(0, len);
        ctx.lineTo(0, 0);
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(-50, 100);
        ctx.lineTo(0, 0);
        ctx.lineTo(50, 100);
        ctx.fill();

        // Text
        ctx.scale(1, -1); // Unflip text
        ctx.font = '100px monospace';
        ctx.fillText(`${Math.abs(load.fy)} N`, 20, -len / 2);
    }

    ctx.restore();
}
