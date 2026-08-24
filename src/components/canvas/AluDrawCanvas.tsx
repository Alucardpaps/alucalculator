'use client';

/**
 * 🎨 ALUDRAW CANVAS (The "Metal" Layer)
 * 
 * The core component that replaces ReactFlow.
 * 
 * - Render Loop: requestAnimationFrame
 * - Input: Native PointerEvents
 * - Model: Custom Scene Graph
 */

import React, { useEffect, useRef, useState } from 'react';
import { Camera } from '../../engine/core/Camera';
import { Scene } from '../../engine/core/Scene';
import { Pointer } from '../../engine/core/Pointer';
import { SelectionSystem } from '../../engine/systems/SelectionSystem';
import { TransformSystem } from '../../engine/systems/TransformSystem';
import { ToolSystem, ToolType } from '../../engine/systems/ToolSystem';
import { commandProcessor } from '../../cad/commands/CommandProcessor';
import { useCadStore } from '../../cad/store/cadStore';

export function AluDrawCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Engine State references (Mutable, High Performance)
    const engine = useRef<any>(null); // Lazy init

    // React State for UI (Tools)
    const [activeTool, setActiveTool] = useState<ToolType>('select');

    useEffect(() => {
        // Init Engine once
        if (!engine.current) {
            const scene = new Scene();
            const camera = new Camera();
            const pointer = new Pointer();
            const selection = new SelectionSystem(scene);
            const transform = new TransformSystem(scene, selection);
            const tools = new ToolSystem(scene, camera, pointer, selection, transform);

            engine.current = { scene, camera, pointer, selection, transform, tools };

            // Add Test Shape
            scene.addShape({ id: 'demo-1', type: 'box', x: 0, y: 0, width: 200, height: 150 });
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !engine.current) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const { camera, scene, pointer, tools, selection } = engine.current;

        // Sync React State to Engine
        tools.setTool(activeTool);

        // --- 1. RESIZE HANDLER ---
        const handleResize = () => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            camera.resize(canvas.width, canvas.height);
            render();
        };

        // --- 2. RENDER LOOP ---
        const render = () => {
            // A. Clear
            ctx.fillStyle = '#0a0e14';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // B. Draw Grid
            drawGrid(ctx, camera);

            // C. Draw Shapes
            ctx.save();
            ctx.translate(camera.width / 2, camera.height / 2);
            ctx.scale(camera.zoom, camera.zoom);
            ctx.translate(-camera.x, -camera.y);

            const shapes = scene.getAllShapes();
            shapes.forEach((shape: any) => {
                ctx.fillStyle = shape.selected ? '#1a2b3c' : '#1e1e1e';
                ctx.fillRect(shape.x, shape.y, shape.width || 100, shape.height || 100);

                ctx.strokeStyle = shape.selected ? '#00e5ff' : '#444';
                ctx.lineWidth = shape.selected ? 2 : 1;
                ctx.strokeRect(shape.x, shape.y, shape.width || 100, shape.height || 100);

                // Text
                ctx.fillStyle = '#fff';
                ctx.font = '12px sans-serif';
                ctx.fillText(shape.type, shape.x + 5, shape.y + 15);
            });

            // D. Draw Selection Brush (Blue Box)
            const brush = selection.getBrushBox();
            if (brush) {
                ctx.save();
                ctx.fillStyle = 'rgba(0, 229, 255, 0.1)';
                ctx.strokeStyle = '#00e5ff';
                ctx.lineWidth = 1;
                ctx.fillRect(brush.x, brush.y, brush.width, brush.height);
                ctx.strokeRect(brush.x, brush.y, brush.width, brush.height);
                ctx.restore();
            }

            // E. Selection Bounds & Handles
            const bounds = selection.getSelectionBounds();
            if (bounds) {
                ctx.save();
                // We are still in World Transform space from (C), so we need to be careful
                // Actually, handles should be screen-size independent ? 
                // Tldraw handles stay same size regardless of zoom.
                // So we should probably draw them in Screen Space or Inverse Scale.

                // Let's stick to World Space for positions, but scale size by 1/zoom
                const handleSize = 8 / camera.zoom;
                const hw = handleSize / 2;

                // Bounds Outline
                ctx.strokeStyle = '#00e5ff';
                ctx.lineWidth = 1 / camera.zoom;
                ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

                // Handles (8 points)
                const points = [
                    { x: bounds.x, y: bounds.y }, // TL
                    { x: bounds.x + bounds.width / 2, y: bounds.y }, // T
                    { x: bounds.x + bounds.width, y: bounds.y }, // TR
                    { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 }, // R
                    { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // BR
                    { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height }, // B
                    { x: bounds.x, y: bounds.y + bounds.height }, // BL
                    { x: bounds.x, y: bounds.y + bounds.height / 2 }, // L
                ];

                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#00e5ff';
                ctx.lineWidth = 1 / camera.zoom;

                points.forEach(p => {
                    ctx.fillRect(p.x - hw, p.y - hw, handleSize, handleSize);
                    ctx.strokeRect(p.x - hw, p.y - hw, handleSize, handleSize);
                });

                ctx.restore();
            }

            ctx.restore();

            // F. HUD
            ctx.fillStyle = '#00e5ff';
            ctx.font = '12px monospace';
            ctx.fillText(`TOOL: ${tools.activeTool.toUpperCase()}`, 10, 20);
            ctx.fillText(`CAM: ${camera.x.toFixed(0)},${camera.y.toFixed(0)}`, 10, 35);
        };

        // --- 3. INPUT HANDLERS ---
        const onBoxWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (e.ctrlKey) {
                camera.zoomAt(e.offsetX, e.offsetY, e.deltaY);
            } else {
                camera.pan(e.deltaX, e.deltaY);
            }
            render();
        };

        const onPointerDown = (e: PointerEvent) => {
            container.setPointerCapture(e.pointerId);
            pointer.down();
            pointer.update(e, camera);

            // 1. Middle Mouse Pan Override
            if (e.button === 1 || e.buttons === 4) {
                // Panning handled in move
                return;
            }

            // 2. Command Processor (Priority)
            const worldPt = camera.screenToWorld(pointer.x, pointer.y);
            commandProcessor.handlePointInput(worldPt);

            // 3. Legacy Tool System (Fallback - Disabled for now)
            // tools.onPointerDown(); 
            render();
        };

        const onPointerMove = (e: PointerEvent) => {
            pointer.update(e, camera);

            // Pan Logic
            if (e.buttons === 4 || (pointer.isDown && tools.activeTool === 'hand')) {
                camera.pan(-e.movementX, -e.movementY);
                render();
                return;
            }

            // Command Processor Preview
            const worldPt = camera.screenToWorld(pointer.x, pointer.y);
            commandProcessor.handleMouseMove(worldPt);

            // Tool Logic
            // tools.onPointerMove();
            render();
        };

        const onPointerUp = (e: PointerEvent) => {
            pointer.up();
            container.releasePointerCapture(e.pointerId);
            // tools.onPointerUp();
            render();
        };

        // Attach
        window.addEventListener('resize', handleResize);
        container.addEventListener('wheel', onBoxWheel, { passive: false });
        // Use pointerdown instead of click for better control
        container.addEventListener('pointerdown', onPointerDown);
        container.addEventListener('pointermove', onPointerMove);
        container.addEventListener('pointerup', onPointerUp);

        // Init
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            container.removeEventListener('wheel', onBoxWheel);
            container.removeEventListener('pointerdown', onPointerDown);
            container.removeEventListener('pointermove', onPointerMove);
            container.removeEventListener('pointerup', onPointerUp);
        };

    }, [activeTool]); // Re-attach listeners if tool changes (or better, use ref for tool)

    // --- 4. KEYBOARD INPUT (Dynamic Command Line) ---
    const [cmdInput, setCmdInput] = useState('');

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            // Ignore if active element is input
            if (document.activeElement?.tagName === 'INPUT') return;

            if (e.key === 'Enter') {
                if (cmdInput.trim().length > 0) {
                    commandProcessor.handleValueInput(cmdInput);
                    setCmdInput('');
                }
            } else if (e.key === 'Escape') {
                commandProcessor.handleCancel();
                setCmdInput('');
            } else if (e.key === 'Backspace') {
                setCmdInput(prev => prev.slice(0, -1));
            } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                // Determine if valid char
                if (/^[a-zA-Z0-9.\- ]$/.test(e.key)) {
                    setCmdInput(prev => prev + e.key);
                }
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [cmdInput]);

    // Use CAD Store for prompt
    const { commandPrompt, commandState } = useCadStore();

    return (
        <div className="relative w-full h-full font-mono">
            {/* Toolbar UI Overlay */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 bg-[#1a2332] p-2 rounded-lg border border-[#2a3a4a] z-50">
                <ToolButton active={activeTool === 'select'} onClick={() => setActiveTool('select')} icon="👆" />
                <ToolButton active={activeTool === 'hand'} onClick={() => setActiveTool('hand')} icon="✋" />
                <ToolButton active={activeTool === 'rectangle'} onClick={() => setActiveTool('rectangle')} icon="⬜" />
            </div>

            {/* Dynamic Input / Command Prompt */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[600px] pointer-events-none z-50 flex flex-col items-center gap-2">
                {/* Floating Input near cursor would be better, but fixed is safer for now */}

                {/* Command Prompt Message */}
                {commandPrompt && (
                    <div className="bg-[#0a0e14]/90 border border-[#00e5ff] text-[#00e5ff] px-4 py-2 rounded shadow-lg text-sm font-bold animate-in fade-in slide-in-from-bottom-2">
                        {commandPrompt}
                    </div>
                )}

                {/* User Typed Input */}
                {cmdInput && (
                    <div className="bg-[#1a2332]/90 border border-[#4a5a6a] text-white px-3 py-1 rounded text-xs min-w-[100px] text-center">
                        {cmdInput}<span className="animate-pulse">_</span>
                    </div>
                )}
            </div>

            <div
                ref={containerRef}
                className="w-full h-full cursor-crosshair touch-none"
            >
                <canvas
                    ref={canvasRef}
                    className="block w-full h-full"
                />
            </div>
        </div>
    );
}

function ToolButton({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: string }) {
    return (
        <button
            onClick={onClick}
            className={`w-8 h-8 flex items-center justify-center rounded ${active ? 'bg-[#00e5ff] text-black' : 'text-gray-400 hover:bg-[#2a3a4a]'}`}
        >
            {icon}
        </button>
    )
}

// --- HELPER RENDERING ---

function drawGrid(ctx: CanvasRenderingContext2D, camera: Camera) {
    const zoom = camera.zoom;
    const gridSize = 20 * zoom;

    // Determine grid opacity based on zoom level to fade in/out detailed grids
    // For now, simple fixed dot grid

    const offsetX = (camera.width / 2 - camera.x * zoom) % gridSize;
    const offsetY = (camera.height / 2 - camera.y * zoom) % gridSize;

    ctx.fillStyle = '#333'; // Dot color

    // Optimization: Don't draw if dots are too dense
    if (gridSize < 10) return;

    for (let x = offsetX; x < camera.width; x += gridSize) {
        for (let y = offsetY; y < camera.height; y += gridSize) {
            // Draw 1px dot
            ctx.fillRect(Math.floor(x), Math.floor(y), 1.5, 1.5);
        }
    }
}
