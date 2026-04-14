'use client';

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useCadStore } from '../store/cadStore';
import { commandProcessor } from '../commands/CommandProcessor';
import {
    worldToScreen,
    screenToWorld,
    panViewport,
    zoomViewportAt
} from '../kernel/CoordinateSystem';
import { findSnapPoint } from '../geometry/SnapEngine';
import { findEntityAtPoint } from '../geometry/GeometryUtils';
import { CAD_COLORS } from '../kernel/constants';
import {
    CadEntity,
    Point,
    PointGeometry
} from '../kernel/types';
import { useSketchSolver } from '../hooks/useSketchSolver';
import { RenderPipeline, RenderContext } from '../render/RenderPipeline';
import { spatialIndex } from '../geometry/SpatialIndex';

// ═══════════════════════════════════════════════════════════════
// CAD CANVAS COMPONENT
// ═══════════════════════════════════════════════════════════════

interface CadCanvasProps {
    className?: string;
}

export function CadCanvas({ className }: CadCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pipelineRef = useRef<RenderPipeline | null>(null);

    const isPanningRef = useRef(false);
    const lastMousePosRef = useRef<Point>({ x: 0, y: 0 });

    // Touch state
    const lastTouchDistanceRef = useRef<number | null>(null);
    const lastTouchCenterRef = useRef<Point | null>(null);

    // Initialize Solver Integration
    useSketchSolver();

    // Store access
    const {
        entities,
        viewport,
        setViewport,
        updateViewport,
        showGrid,
        gridSpacing,
        activeCommand,
        snapEnabled,
        activeSnaps,
        currentSnap,
        setCurrentSnap,
        orthoEnabled,
        previewEntity,
        setCursor,
        selectedIds,
        selectEntity,
        deselectAll,
        selectEntitiesInRect,
        constraints
    } = useCadStore();

    // Selection Box State
    const [selectionBox, setSelectionBoxState] = React.useState<{ start: Point; current: Point } | null>(null);

    // Dimension Editing State
    const [editingDimension, setEditingDimension] = React.useState<{ id: string, value: number, screenX: number, screenY: number, isConstraint: boolean } | null>(null);

    // ─────────────────────────────────────────────────────────────
    // PIPELINE LIFECYCLE
    // ─────────────────────────────────────────────────────────────

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Initialize Pipeline
        const pipeline = new RenderPipeline();
        pipeline.attach(canvas);
        pipeline.startLoop();
        pipelineRef.current = pipeline;

        // Resize Observer
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width === 0 || height === 0) return;

                canvas.width = width;
                canvas.height = height;
                pipeline.resize(width, height);
                updateViewport({ width, height });
            }
        });

        resizeObserver.observe(canvas);

        return () => {
            pipeline.detach();
            resizeObserver.disconnect();
        };
    }, [updateViewport]);

    // ─────────────────────────────────────────────────────────────
    // SPATIAL INDEX & RENDER CONTEXT SYNC
    // ─────────────────────────────────────────────────────────────

    // Memoize render context to prevent unnecessary pipeline updates
    const renderContext = useMemo((): RenderContext => ({
        viewport,
        zoom: viewport.zoom,
        entities,
        entityMap: new Map(entities.map(e => [e.id, e])),
        selectedIds: new Set(selectedIds),
        spatialIndex,
        worldToScreen: (p: Point) => worldToScreen(p, viewport),
        screenToWorld: (p: Point) => screenToWorld(p, viewport),
    }), [viewport, entities, selectedIds]);

    useEffect(() => {
        if (!pipelineRef.current) return;
        pipelineRef.current.setRenderContext(renderContext);

        // Rebuild spatial index on entity change
        spatialIndex.rebuild(entities);
        pipelineRef.current.onEntitiesChanged();
    }, [renderContext, entities]);

    useEffect(() => {
        if (!pipelineRef.current) return;
        pipelineRef.current.onViewportChanged();
    }, [viewport]);

    useEffect(() => {
        if (!pipelineRef.current) return;
        pipelineRef.current.setPreviewEntity(previewEntity);
    }, [previewEntity]);

    useEffect(() => {
        if (!pipelineRef.current) return;
        pipelineRef.current.setSnapIndicator(currentSnap);
    }, [currentSnap]);

    useEffect(() => {
        if (!pipelineRef.current) return;

        // Map constraints to glyphs for RenderPipeline
        const glyphs = constraints.filter(c => c.active).map(c => {
            let pos: Point = { x: 0, y: 0 };
            const entIds = (c as any).entityIds || (c as any).entities || [];
            const involved = entIds.map((id: string) => entities.find(e => e.id === id)).filter(Boolean) as CadEntity[];

            if (involved.length > 0) {
                const e0 = involved[0];
                if (e0.geometry.type === 'LINE') {
                    const line = e0.geometry as any;
                    pos = { x: (line.start.x + line.end.x) / 2, y: (line.start.y + line.end.y) / 2 };
                } else if (e0.geometry.type === 'CIRCLE' || e0.geometry.type === 'ARC') {
                    pos = (e0.geometry as any).center;
                } else if (e0.geometry.type === 'POINT') {
                    pos = { x: e0.geometry.x, y: e0.geometry.y };
                }
            }

            return {
                position: pos,
                type: c.type,
                entityIds: entIds,
                value: c.value
            };
        });

        pipelineRef.current.setConstraintGlyphs(glyphs as any);
    }, [constraints, entities]);

    // ─────────────────────────────────────────────────────────────
    // MOUSE HANDLERS
    // ─────────────────────────────────────────────────────────────

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas || !pipelineRef.current) return;

        const rect = canvas.getBoundingClientRect();
        const screenPoint: Point = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        let worldPoint = screenToWorld(screenPoint, viewport);

        // Handle panning
        if (isPanningRef.current) {
            const delta = {
                x: screenPoint.x - lastMousePosRef.current.x,
                y: screenPoint.y - lastMousePosRef.current.y
            };
            const newViewport = panViewport(viewport, delta.x, delta.y);
            setViewport(newViewport);
            lastMousePosRef.current = screenPoint;
            return;
        }

        // Snap detection
        if (snapEnabled && entities.length > 0) {
            const snap = findSnapPoint(worldPoint, entities, activeSnaps, viewport.zoom);
            setCurrentSnap(snap);
            if (snap) {
                worldPoint = snap.point;
            }
        } else {
            setCurrentSnap(null);
        }

        commandProcessor.handleMouseMove(worldPoint);

        // UI Layer Updates (No React state trigger)
        pipelineRef.current.setCursorWorld(worldPoint);
        pipelineRef.current.setSelectionBox(selectionBox ? { start: selectionBox.start, end: worldPoint } : null);

        setCursor(worldPoint, screenPoint);
    }, [viewport, entities, activeSnaps, snapEnabled, setViewport, setCurrentSnap, setCursor, selectionBox]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const screenPoint: Point = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            isPanningRef.current = true;
            lastMousePosRef.current = screenPoint;
            canvas.style.cursor = 'grabbing';
            return;
        }

        if (e.button === 0) {
            const worldPoint = currentSnap ? currentSnap.point : screenToWorld(screenPoint, viewport);

            if (!activeCommand) {
                const clickedEntity = findEntityAtPoint(worldPoint, entities, viewport.zoom);
                if (clickedEntity) {
                    selectEntity(clickedEntity.id, e.shiftKey || e.ctrlKey);
                } else {
                    if (!e.shiftKey && !e.ctrlKey) deselectAll();
                    setSelectionBoxState({ start: worldPoint, current: worldPoint });
                }
            } else {
                commandProcessor.handleMouseDown(worldPoint);
                commandProcessor.handlePointInput(worldPoint);
            }
        }

        if (e.button === 2) {
            e.preventDefault();
            commandProcessor.handleCancel();
        }
    }, [currentSnap, viewport, activeCommand, entities, deselectAll, selectEntity]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        if (e.button === 1 || isPanningRef.current) {
            isPanningRef.current = false;
            const canvas = canvasRef.current;
            if (canvas) canvas.style.cursor = 'crosshair';
            commandProcessor.handleMouseUp();
        }

        if (selectionBox) {
            const p1 = selectionBox.start;
            const rect = canvasRef.current?.getBoundingClientRect();
            const p2 = screenToWorld({ x: e.clientX - (rect?.left || 0), y: e.clientY - (rect?.top || 0) }, viewport);

            const fullyContained = p2.x > p1.x;
            selectEntitiesInRect(p1, p2, fullyContained);
            setSelectionBoxState(null);
            pipelineRef.current?.setSelectionBox(null);
        }
    }, [selectionBox, viewport, selectEntitiesInRect]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const screenPoint: Point = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newViewport = zoomViewportAt(viewport, screenPoint, zoomFactor);
        setViewport(newViewport);

        if (editingDimension) setEditingDimension(null);
    }, [viewport, setViewport, editingDimension]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
    }, []);

    // ─────────────────────────────────────────────────────────────
    // TOUCH HANDLERS (Mobile/Tablet)
    // ─────────────────────────────────────────────────────────────

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (e.touches.length === 1) {
            // Potential single finger pan or point input
            const rect = canvas.getBoundingClientRect();
            const screenPoint = {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
            lastTouchCenterRef.current = screenPoint;

            // If in a command, treat as point input
            if (activeCommand) {
                const worldPoint = screenToWorld(screenPoint, viewport);
                commandProcessor.handleMouseDown(worldPoint);
                commandProcessor.handlePointInput(worldPoint);
            } else {
                isPanningRef.current = true;
            }
        } else if (e.touches.length === 2) {
            // Pinch-zoom start
            isPanningRef.current = false;
            const p1 = e.touches[0];
            const p2 = e.touches[1];
            const dist = Math.sqrt(Math.pow(p2.clientX - p1.clientX, 2) + Math.pow(p2.clientY - p1.clientY, 2));
            lastTouchDistanceRef.current = dist;

            const rect = canvas.getBoundingClientRect();
            lastTouchCenterRef.current = {
                x: (p1.clientX + p2.clientX) / 2 - rect.left,
                y: (p1.clientY + p2.clientY) / 2 - rect.top
            };
        }
    }, [activeCommand, viewport]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Prevent default scrolling only if we are handling the touch
        if (e.touches.length <= 2) {
            e.preventDefault();
        }

        if (e.touches.length === 1 && isPanningRef.current) {
            const rect = canvas.getBoundingClientRect();
            const screenPoint = {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };

            if (lastTouchCenterRef.current) {
                const delta = {
                    x: screenPoint.x - lastTouchCenterRef.current.x,
                    y: screenPoint.y - lastTouchCenterRef.current.y
                };
                const newViewport = panViewport(viewport, delta.x, delta.y);
                setViewport(newViewport);
            }
            lastTouchCenterRef.current = screenPoint;
        } else if (e.touches.length === 2 && lastTouchDistanceRef.current && lastTouchCenterRef.current) {
            const p1 = e.touches[0];
            const p2 = e.touches[1];
            const dist = Math.sqrt(Math.pow(p2.clientX - p1.clientX, 2) + Math.pow(p2.clientY - p1.clientY, 2));

            const rect = canvas.getBoundingClientRect();
            const center = {
                x: (p1.clientX + p2.clientX) / 2 - rect.left,
                y: (p1.clientY + p2.clientY) / 2 - rect.top
            };

            // Zoom
            const zoomFactor = dist / lastTouchDistanceRef.current;
            let newViewport = zoomViewportAt(viewport, center, zoomFactor);

            // Pan to keep center stable
            const deltaX = center.x - lastTouchCenterRef.current.x;
            const deltaY = center.y - lastTouchCenterRef.current.y;
            newViewport = panViewport(newViewport, deltaX, deltaY);

            setViewport(newViewport);
            lastTouchDistanceRef.current = dist;
            lastTouchCenterRef.current = center;
        }
    }, [viewport, setViewport]);

    const handleTouchEnd = useCallback(() => {
        isPanningRef.current = false;
        lastTouchDistanceRef.current = null;
        lastTouchCenterRef.current = null;
        commandProcessor.handleMouseUp();
    }, []);

    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const screenPoint: Point = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        const worldPoint = screenToWorld(screenPoint, viewport);

        // 1. Check if clicked on a constraint text
        for (const c of constraints) {
            if (c.type === 'DISTANCE' && c.value !== undefined) {
                const entIds = (c as any).entityIds || [];
                const involved = entIds.map((id: string) => entities.find(e => e.id === id)).filter(Boolean) as CadEntity[];
                if (involved.length >= 2) {
                    const e1 = involved[0].geometry as any;
                    const e2 = involved[1].geometry as any;
                    const p1 = e1.type === 'POINT' ? e1 : e1.center || e1.start;
                    const p2 = e2.type === 'POINT' ? e2 : e2.center || e2.start;
                    if (p1 && p2) {
                        const midWorld = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
                        const sp = worldToScreen(midWorld, viewport);
                        if (Math.abs(screenPoint.x - sp.x) < 25 && Math.abs(screenPoint.y - sp.y) < 25) {
                            setEditingDimension({ id: c.id, value: c.value, screenX: sp.x, screenY: sp.y, isConstraint: true });
                            return;
                        }
                    }
                }
            }
        }

        // 2. Check if clicked on a DIMENSION entity
        const clickedEntity = findEntityAtPoint(worldPoint, entities, viewport.zoom);
        if (clickedEntity && clickedEntity.geometry.type === 'DIMENSION') {
            const geom = clickedEntity.geometry as any;
            const midX = (geom.start.x + geom.end.x) / 2;
            const midY = (geom.start.y + geom.end.y) / 2;
            const sp = worldToScreen({ x: midX, y: midY }, viewport);
            setEditingDimension({ id: clickedEntity.id, value: geom.value, screenX: sp.x, screenY: sp.y - 10, isConstraint: false });
        }
    }, [viewport, entities, constraints]);

    // ─────────────────────────────────────────────────────────────
    // KEYBOARD HANDLERS
    // ─────────────────────────────────────────────────────────────

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') useCadStore.getState().cancelCommand();
            if (e.key === 'F8') { e.preventDefault(); useCadStore.getState().toggleOrtho(); }
            if (e.key === 'F3') { e.preventDefault(); useCadStore.getState().toggleSnap(); }
            if (e.ctrlKey && e.key === 'z') { e.preventDefault(); useCadStore.getState().undo(); }
            if (e.ctrlKey && e.key === 'y') { e.preventDefault(); useCadStore.getState().redo(); }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────

    return (
        <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
            <canvas
                id="cad-canvas"
                ref={canvasRef}
                className="w-full h-full cursor-crosshair touch-none"
                style={{ background: CAD_COLORS.BACKGROUND }}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                onContextMenu={handleContextMenu}
                onDoubleClick={handleDoubleClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            />
            {editingDimension && (
                <input
                    type="number"
                    autoFocus
                    className="absolute z-10 bg-slate-900/90 text-cyan-400 border border-cyan-500/50 rounded px-1.5 py-0.5 outline-none font-mono text-sm shadow-xl backdrop-blur-md"
                    style={{
                        left: editingDimension.screenX - 35,
                        top: editingDimension.screenY - 15,
                        width: '70px'
                    }}
                    defaultValue={editingDimension.value.toFixed(2)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const val = parseFloat(e.currentTarget.value);
                            if (!isNaN(val)) {
                                if (editingDimension.isConstraint) {
                                    useCadStore.getState().editDimension(editingDimension.id, val);
                                } else {
                                    const entity = entities.find(en => en.id === editingDimension.id);
                                    if (entity) {
                                        useCadStore.getState().updateEntity(editingDimension.id, {
                                            geometry: { ...entity.geometry, value: val, text: val.toFixed(2) } as any
                                        });
                                    }
                                }
                            }
                            setEditingDimension(null);
                        } else if (e.key === 'Escape') setEditingDimension(null);
                    }}
                    onBlur={() => setEditingDimension(null)}
                />
            )}
        </div>
    );
}

export default CadCanvas;
