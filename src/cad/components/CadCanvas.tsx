'use client';

import React, { useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
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
import { useTheme } from '@/lib/theme/themeStore';
import { getTheme } from '@/lib/theme/themes';
import { DARK_CANVAS, LIGHT_CANVAS, setCanvasPalette } from '../render/canvasTheme';
import {
    CadEntity,
    Point,
    PointGeometry,
    SnapResult
} from '../kernel/types';
import { useSketchSolver } from '../hooks/useSketchSolver';
import { RenderPipeline, RenderContext } from '../render/RenderPipeline';
import { spatialIndex } from '../geometry/SpatialIndex';
import { DynamicBlockRegistry } from '../blocks/dynamic/registry';
import { DynamicBlockEngine } from '../blocks/dynamic/DynamicBlockEngine';
import { DynamicGrip, LinearParameter } from '../blocks/dynamic/types';

// ═══════════════════════════════════════════════════════════════
// CAD CANVAS COMPONENT
// ═══════════════════════════════════════════════════════════════

interface ActiveGripDrag {
    blockInstanceId: string;
    paramId: string;
    initialParamValue: number;
    grip: DynamicGrip;
    startMouseWorld: Point;
    direction: Point;
    linearParam?: LinearParameter;
    dynamicBasePoint: Point;
    dynamicScale: number;
    dynamicRotationRad: number;
}

interface CadCanvasProps {
    className?: string;
    onContextMenuOpen?: (screenX: number, screenY: number) => void;
}

export function CadCanvas({ className, onContextMenuOpen }: CadCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pipelineRef = useRef<RenderPipeline | null>(null);

    // Dark model space on dark themes, white drafting paper on light themes
    const { theme } = useTheme();
    const lightCanvas = getTheme(theme).kind === 'light';
    useLayoutEffect(() => {
        if (setCanvasPalette(lightCanvas)) pipelineRef.current?.forceFullRedraw();
    }, [lightCanvas]);

    const isPanningRef = useRef(false);
    const lastMousePosRef = useRef<Point>({ x: 0, y: 0 });

    // Dynamic Grip Dragging State
    const activeGripDragRef = useRef<ActiveGripDrag | null>(null);
    const [activeGripTooltip, setActiveGripTooltip] = React.useState<{
        text: string;
        screenX: number;
        screenY: number;
    } | null>(null);

    // Direct Entity Drag-to-Move State
    const dragEntitiesRef = useRef<{
        isDragging: boolean;
        startWorld: Point;
        lastWorld: Point;
        entityIds: string[];
    } | null>(null);

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
        cursorScreen,
        setCursor,
        selectedIds,
        selectEntity,
        deselectAll,
        selectEntitiesInRect,
        constraints,
        units,
        updateDynamicBlock,
        moveEntities,
        layers
    } = useCadStore();

    // Selection Box State
    const [selectionBox, setSelectionBoxState] = React.useState<{ start: Point; current: Point } | null>(null);

    // Dynamic Input (DYNMODE) on-canvas HUD state
    const [dynamicInput, setDynamicInput] = React.useState<string | null>(null);
    const dynamicInputRef = useRef<string | null>(null);
    dynamicInputRef.current = dynamicInput;

    useEffect(() => {
        setDynamicInput(null);
    }, [activeCommand]);

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
        pipeline.setCustomPreview((ctx, worldToScreen) => {
            commandProcessor.renderPreview(ctx, worldToScreen);
        });
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
        units,
        layers,
        worldToScreen: (p: Point) => worldToScreen(p, viewport),
        screenToWorld: (p: Point) => screenToWorld(p, viewport),
    }), [viewport, entities, selectedIds, units, layers]);

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

    // Global release listener to safely finish grip dragging outside canvas
    useEffect(() => {
        const onGlobalMouseUp = () => {
            if (activeGripDragRef.current) {
                useCadStore.getState().pushHistory('Stretch dynamic block');
                activeGripDragRef.current = null;
                setActiveGripTooltip(null);
                if (canvasRef.current) canvasRef.current.style.cursor = 'crosshair';
            }
            if (dragEntitiesRef.current) {
                if (dragEntitiesRef.current.isDragging) {
                    useCadStore.getState().pushHistory('Move');
                }
                dragEntitiesRef.current = null;
                if (canvasRef.current) canvasRef.current.style.cursor = 'crosshair';
            }
        };
        window.addEventListener('mouseup', onGlobalMouseUp);
        return () => window.removeEventListener('mouseup', onGlobalMouseUp);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas || !pipelineRef.current) return;

        const rect = canvas.getBoundingClientRect();
        const screenPoint: Point = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        let worldPoint = screenToWorld(screenPoint, viewport);

        // 1. Dynamic block grip dragging (Live stretch & slide / base point move)
        if (activeGripDragRef.current) {
            const drag = activeGripDragRef.current;
            if (drag.paramId === '__move_base_point__') {
                const dx = worldPoint.x - drag.startMouseWorld.x;
                const dy = worldPoint.y - drag.startMouseWorld.y;
                const newBase = {
                    x: Math.round(drag.dynamicBasePoint.x + dx),
                    y: Math.round(drag.dynamicBasePoint.y + dy)
                };
                updateDynamicBlock(drag.blockInstanceId, {}, { skipHistory: true, newBasePoint: newBase });
                setActiveGripTooltip({
                    text: `Konum: (${newBase.x}, ${newBase.y}) mm`,
                    screenX: screenPoint.x + 16,
                    screenY: screenPoint.y - 12
                });
            } else {
                const dx = worldPoint.x - drag.startMouseWorld.x;
                const dy = worldPoint.y - drag.startMouseWorld.y;
                const dir = drag.direction;
                const dirLenSq = dir.x * dir.x + dir.y * dir.y;
                const dot = (dx * dir.x + dy * dir.y) / (dirLenSq || 1);
                const deltaParam = dot / drag.dynamicScale;

                let newVal = drag.initialParamValue + deltaParam;

                if (drag.linearParam) {
                    const step = drag.linearParam.step || 10;
                    newVal = Math.round(newVal / step) * step;
                    newVal = Math.max(drag.linearParam.min, Math.min(drag.linearParam.max, newVal));
                } else {
                    newVal = Math.round(newVal);
                }

                updateDynamicBlock(drag.blockInstanceId, { [drag.paramId]: newVal }, { skipHistory: true });

                const label = drag.linearParam?.labelTr || drag.linearParam?.label || drag.paramId;
                const unit = drag.linearParam?.unit || 'mm';
                setActiveGripTooltip({
                    text: `${label}: ${Math.round(newVal)} ${unit}`,
                    screenX: screenPoint.x + 16,
                    screenY: screenPoint.y - 12
                });
            }

            pipelineRef.current.setCursorWorld(worldPoint);
            setCursor(worldPoint, screenPoint);
            return;
        }

        // 2. Direct Drag-to-Move for selected entities/blocks
        if (dragEntitiesRef.current) {
            const drag = dragEntitiesRef.current;
            const distScreen = Math.hypot(
                screenPoint.x - worldToScreen(drag.startWorld, viewport).x,
                screenPoint.y - worldToScreen(drag.startWorld, viewport).y
            );
            if (!drag.isDragging && distScreen > 4) {
                drag.isDragging = true;
                canvas.style.cursor = 'move';
            }

            if (drag.isDragging) {
                const dx = worldPoint.x - drag.lastWorld.x;
                const dy = worldPoint.y - drag.lastWorld.y;
                if (dx !== 0 || dy !== 0) {
                    drag.lastWorld = worldPoint;
                    moveEntities(drag.entityIds, { x: dx, y: dy }, true);
                }
                pipelineRef.current.setCursorWorld(worldPoint);
                setCursor(worldPoint, screenPoint);
                return;
            }
        }

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

        // Dynamic Grip Hover Detection & Visual Cursor Feedback
        if (!activeCommand && selectedIds.length > 0) {
            const selDynamicEnt = entities.find(ent =>
                selectedIds.includes(ent.id) && ent.isDynamic && ent.dynamicBlockId && ent.blockInstanceId
            );
            if (selDynamicEnt && selDynamicEnt.dynamicBlockId) {
                const blockDef = DynamicBlockRegistry.getById(selDynamicEnt.dynamicBlockId);
                if (blockDef) {
                    const grips = DynamicBlockEngine.getGripsWorld(
                        blockDef,
                        selDynamicEnt.dynamicParams || {},
                        selDynamicEnt.dynamicBasePoint || { x: 0, y: 0 },
                        selDynamicEnt.dynamicScale ?? 1,
                        selDynamicEnt.dynamicRotationRad ?? 0
                    );
                    const hoveredGrip = grips.find(g => {
                        const sp = worldToScreen(g.position, viewport);
                        return Math.hypot(sp.x - screenPoint.x, sp.y - screenPoint.y) <= 18;
                    });

                    if (hoveredGrip) {
                        if (hoveredGrip.type === 'stretch' || hoveredGrip.type === 'linear') {
                            const isHoriz = Math.abs(hoveredGrip.direction?.x || 1) >= Math.abs(hoveredGrip.direction?.y || 0);
                            canvas.style.cursor = isHoriz ? 'ew-resize' : 'ns-resize';
                        } else if (hoveredGrip.type === 'point') {
                            canvas.style.cursor = 'move';
                        } else {
                            canvas.style.cursor = 'pointer';
                        }
                    } else if (['ew-resize', 'ns-resize', 'move', 'pointer'].includes(canvas.style.cursor)) {
                        canvas.style.cursor = 'crosshair';
                    }
                }
            }

            // Visual feedback: show move cursor when hovering over selected entity body
            if (!activeGripDragRef.current && !dragEntitiesRef.current?.isDragging) {
                const hoveredEnt = findEntityAtPoint(worldPoint, entities, viewport.zoom);
                if (hoveredEnt && selectedIds.includes(hoveredEnt.id)) {
                    canvas.style.cursor = 'move';
                }
            }
        }

        commandProcessor.handleMouseMove(worldPoint);

        // UI Layer Updates (No React state trigger)
        pipelineRef.current.setCursorWorld(worldPoint);
        pipelineRef.current.setSelectionBox(selectionBox ? { start: selectionBox.start, end: worldPoint } : null);

        setCursor(worldPoint, screenPoint);
    }, [viewport, entities, selectedIds, activeSnaps, snapEnabled, setViewport, setCurrentSnap, setCursor, selectionBox, updateDynamicBlock, moveEntities, activeCommand]);

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
                // Interactive dynamic grip click / drag detection
                if (selectedIds.length > 0) {
                    const selDynamicEnt = entities.find(ent =>
                        selectedIds.includes(ent.id) && ent.isDynamic && ent.dynamicBlockId && ent.blockInstanceId
                    );
                    if (selDynamicEnt && selDynamicEnt.dynamicBlockId) {
                        const blockDef = DynamicBlockRegistry.getById(selDynamicEnt.dynamicBlockId);
                        if (blockDef) {
                            const grips = DynamicBlockEngine.getGripsWorld(
                                blockDef,
                                selDynamicEnt.dynamicParams || {},
                                selDynamicEnt.dynamicBasePoint || { x: 0, y: 0 },
                                selDynamicEnt.dynamicScale ?? 1,
                                selDynamicEnt.dynamicRotationRad ?? 0
                            );

                            for (const grip of grips) {
                                const gripScreen = worldToScreen(grip.position, viewport);
                                const dist = Math.hypot(gripScreen.x - screenPoint.x, gripScreen.y - screenPoint.y);
                                if (dist <= 18) {
                                    if (grip.type === 'flip') {
                                        const cur = !!(selDynamicEnt.dynamicParams?.[grip.paramId]);
                                        updateDynamicBlock(selDynamicEnt.blockInstanceId!, { [grip.paramId]: !cur });
                                        return;
                                    } else if (grip.type === 'visibility' && blockDef.visibilityParam) {
                                        const states = blockDef.visibilityParam.states;
                                        const curId = selDynamicEnt.dynamicParams?.[grip.paramId] || blockDef.visibilityParam.default;
                                        const idx = states.findIndex(s => s.id === curId);
                                        const nextState = states[(idx + 1) % states.length].id;
                                        updateDynamicBlock(selDynamicEnt.blockInstanceId!, { [grip.paramId]: nextState });
                                        return;
                                    } else if (grip.type === 'lookup' && blockDef.lookupParams && blockDef.lookupParams.length > 0) {
                                        const lookup = blockDef.lookupParams[0];
                                        const curIdx = lookup.options.findIndex(o =>
                                            Object.entries(o.values).every(([k, v]) => selDynamicEnt.dynamicParams?.[k] === v)
                                        );
                                        const nextOption = lookup.options[(curIdx + 1) % lookup.options.length];
                                        updateDynamicBlock(selDynamicEnt.blockInstanceId!, nextOption.values);
                                        return;
                                    } else if (grip.type === 'stretch' || grip.type === 'linear') {
                                        // Start dragging stretch/linear grip
                                        const linearParam = blockDef.linearParams?.find(p => p.id === grip.paramId);
                                        const initialVal = Number(selDynamicEnt.dynamicParams?.[grip.paramId] ?? linearParam?.default ?? 0);
                                        let dir = grip.direction;
                                        if (!dir || (dir.x === 0 && dir.y === 0)) {
                                            if (linearParam?.axis === 'y') dir = { x: 0, y: 1 };
                                            else dir = { x: 1, y: 0 };
                                        }

                                        activeGripDragRef.current = {
                                            blockInstanceId: selDynamicEnt.blockInstanceId!,
                                            paramId: grip.paramId,
                                            initialParamValue: initialVal,
                                            grip,
                                            startMouseWorld: worldPoint,
                                            direction: dir,
                                            linearParam,
                                            dynamicBasePoint: selDynamicEnt.dynamicBasePoint || { x: 0, y: 0 },
                                            dynamicScale: selDynamicEnt.dynamicScale ?? 1.0,
                                            dynamicRotationRad: selDynamicEnt.dynamicRotationRad ?? 0,
                                        };

                                        const isHoriz = Math.abs(dir.x) >= Math.abs(dir.y);
                                        canvas.style.cursor = isHoriz ? 'ew-resize' : 'ns-resize';

                                        const label = linearParam?.labelTr || linearParam?.label || grip.paramId;
                                        const unit = linearParam?.unit || 'mm';
                                        setActiveGripTooltip({
                                            text: `${label}: ${Math.round(initialVal)} ${unit}`,
                                            screenX: screenPoint.x + 16,
                                            screenY: screenPoint.y - 12
                                        });
                                        return;
                                    } else if (grip.type === 'point' && (grip.paramId === 'origin' || grip.id.includes('origin') || grip.id.includes('base') || grip.id.includes('center'))) {
                                        activeGripDragRef.current = {
                                            blockInstanceId: selDynamicEnt.blockInstanceId!,
                                            paramId: '__move_base_point__',
                                            initialParamValue: 0,
                                            grip,
                                            startMouseWorld: worldPoint,
                                            direction: { x: 1, y: 0 },
                                            dynamicBasePoint: selDynamicEnt.dynamicBasePoint || { x: 0, y: 0 },
                                            dynamicScale: selDynamicEnt.dynamicScale ?? 1.0,
                                            dynamicRotationRad: selDynamicEnt.dynamicRotationRad ?? 0,
                                        };
                                        canvas.style.cursor = 'move';
                                        setActiveGripTooltip({
                                            text: `Blok Konumu: (${Math.round(selDynamicEnt.dynamicBasePoint?.x || 0)}, ${Math.round(selDynamicEnt.dynamicBasePoint?.y || 0)}) mm`,
                                            screenX: screenPoint.x + 16,
                                            screenY: screenPoint.y - 12
                                        });
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }

                const clickedEntity = findEntityAtPoint(worldPoint, entities, viewport.zoom);
                if (clickedEntity) {
                    const isAlreadySelected = selectedIds.includes(clickedEntity.id);
                    let idsToMove: string[] = [];

                    if (isAlreadySelected && !e.shiftKey && !e.ctrlKey) {
                        idsToMove = [...selectedIds];
                    } else {
                        selectEntity(clickedEntity.id, e.shiftKey || e.ctrlKey);
                        if (clickedEntity.blockInstanceId) {
                            idsToMove = entities.filter(ent => ent.blockInstanceId === clickedEntity.blockInstanceId).map(ent => ent.id);
                        } else if (clickedEntity.groupId) {
                            idsToMove = entities.filter(ent => ent.groupId === clickedEntity.groupId).map(ent => ent.id);
                        } else {
                            idsToMove = [clickedEntity.id];
                        }
                    }

                    if (!e.shiftKey && !e.ctrlKey) {
                        dragEntitiesRef.current = {
                            isDragging: false,
                            startWorld: worldPoint,
                            lastWorld: worldPoint,
                            entityIds: idsToMove
                        };
                    }
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
    }, [currentSnap, viewport, activeCommand, entities, selectedIds, deselectAll, selectEntity, updateDynamicBlock]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        if (activeGripDragRef.current) {
            useCadStore.getState().pushHistory('Stretch dynamic block');
            activeGripDragRef.current = null;
            setActiveGripTooltip(null);
            const canvas = canvasRef.current;
            if (canvas) canvas.style.cursor = 'crosshair';
            return;
        }

        if (dragEntitiesRef.current) {
            if (dragEntitiesRef.current.isDragging) {
                const totalDx = dragEntitiesRef.current.lastWorld.x - dragEntitiesRef.current.startWorld.x;
                const totalDy = dragEntitiesRef.current.lastWorld.y - dragEntitiesRef.current.startWorld.y;
                if (Math.hypot(totalDx, totalDy) > 0.05) {
                    useCadStore.getState().pushHistory('Move');
                }
                const canvas = canvasRef.current;
                if (canvas) canvas.style.cursor = 'crosshair';
            }
            dragEntitiesRef.current = null;
        }

        if (e.button === 1 || isPanningRef.current) {
            isPanningRef.current = false;
            const canvas = canvasRef.current;
            if (canvas) canvas.style.cursor = 'crosshair';
            commandProcessor.handleMouseUp();
        } else if (e.button === 0) {
            const rect = canvasRef.current?.getBoundingClientRect();
            const p = screenToWorld({ x: e.clientX - (rect?.left || 0), y: e.clientY - (rect?.top || 0) }, viewport);
            commandProcessor.handleMouseUp(p);
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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const onWheel = (e: WheelEvent) => {
            if (e.cancelable) {
                e.preventDefault();
            }
            const rect = canvas.getBoundingClientRect();
            const screenPoint: Point = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };

            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            const currentViewport = useCadStore.getState().viewport;
            const newViewport = zoomViewportAt(currentViewport, screenPoint, zoomFactor);
            useCadStore.getState().setViewport(newViewport);

            setEditingDimension(null);
        };

        canvas.addEventListener('wheel', onWheel, { passive: false });
        return () => {
            canvas.removeEventListener('wheel', onWheel);
        };
    }, []);

    // ─────────────────────────────────────────────────────────────
    // TOUCH HANDLERS (Mobile / Tablet AutoCAD Engine)
    // ─────────────────────────────────────────────────────────────

    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const touchMovedRef = useRef<boolean>(false);
    const isPinchingRef = useRef<boolean>(false);
    const lastSnapRef = useRef<SnapResult | null>(null);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (e.touches.length >= 2) {
            // Multi-touch: Pinch zoom & 2-finger pan
            isPinchingRef.current = true;
            touchMovedRef.current = true;
            isPanningRef.current = false;

            const p1 = e.touches[0];
            const p2 = e.touches[1];
            const dist = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);
            lastTouchDistanceRef.current = dist;

            const rect = canvas.getBoundingClientRect();
            lastTouchCenterRef.current = {
                x: (p1.clientX + p2.clientX) / 2 - rect.left,
                y: (p1.clientY + p2.clientY) / 2 - rect.top
            };
            return;
        }

        if (e.touches.length === 1) {
            isPinchingRef.current = false;
            const rect = canvas.getBoundingClientRect();
            const screenPoint = {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
            lastTouchCenterRef.current = screenPoint;
            touchStartRef.current = { x: screenPoint.x, y: screenPoint.y, time: Date.now() };
            touchMovedRef.current = false;

            let worldPoint = screenToWorld(screenPoint, viewport);

            // Dynamic Grip Touch Detection
            if (!activeCommand && selectedIds.length > 0) {
                const selDynamicEnt = entities.find(ent =>
                    selectedIds.includes(ent.id) && ent.isDynamic && ent.dynamicBlockId && ent.blockInstanceId
                );
                if (selDynamicEnt && selDynamicEnt.dynamicBlockId) {
                    const blockDef = DynamicBlockRegistry.getById(selDynamicEnt.dynamicBlockId);
                    if (blockDef) {
                        const grips = DynamicBlockEngine.getGripsWorld(
                            blockDef,
                            selDynamicEnt.dynamicParams || {},
                            selDynamicEnt.dynamicBasePoint || { x: 0, y: 0 },
                            selDynamicEnt.dynamicScale ?? 1,
                            selDynamicEnt.dynamicRotationRad ?? 0
                        );
                        for (const grip of grips) {
                            const gripScreen = worldToScreen(grip.position, viewport);
                            if (Math.hypot(gripScreen.x - screenPoint.x, gripScreen.y - screenPoint.y) <= 24) {
                                if (grip.type === 'flip') {
                                    const cur = !!(selDynamicEnt.dynamicParams?.[grip.paramId]);
                                    updateDynamicBlock(selDynamicEnt.blockInstanceId!, { [grip.paramId]: !cur });
                                    touchMovedRef.current = true;
                                    return;
                                } else if (grip.type === 'visibility' && blockDef.visibilityParam) {
                                    const states = blockDef.visibilityParam.states;
                                    const curId = selDynamicEnt.dynamicParams?.[grip.paramId] || blockDef.visibilityParam.default;
                                    const idx = states.findIndex(s => s.id === curId);
                                    const nextState = states[(idx + 1) % states.length].id;
                                    updateDynamicBlock(selDynamicEnt.blockInstanceId!, { [grip.paramId]: nextState });
                                    touchMovedRef.current = true;
                                    return;
                                } else if (grip.type === 'lookup' && blockDef.lookupParams && blockDef.lookupParams.length > 0) {
                                    const lookup = blockDef.lookupParams[0];
                                    const curIdx = lookup.options.findIndex(o =>
                                        Object.entries(o.values).every(([k, v]) => selDynamicEnt.dynamicParams?.[k] === v)
                                    );
                                    const nextOption = lookup.options[(curIdx + 1) % lookup.options.length];
                                    updateDynamicBlock(selDynamicEnt.blockInstanceId!, nextOption.values);
                                    touchMovedRef.current = true;
                                    return;
                                } else if (grip.type === 'stretch' || grip.type === 'linear') {
                                    const linearParam = blockDef.linearParams?.find(p => p.id === grip.paramId);
                                    const initialVal = Number(selDynamicEnt.dynamicParams?.[grip.paramId] ?? linearParam?.default ?? 0);
                                    let dir = grip.direction;
                                    if (!dir || (dir.x === 0 && dir.y === 0)) {
                                        if (linearParam?.axis === 'y') dir = { x: 0, y: 1 };
                                        else dir = { x: 1, y: 0 };
                                    }
                                    activeGripDragRef.current = {
                                        blockInstanceId: selDynamicEnt.blockInstanceId!,
                                        paramId: grip.paramId,
                                        initialParamValue: initialVal,
                                        grip,
                                        startMouseWorld: worldPoint,
                                        direction: dir,
                                        linearParam,
                                        dynamicBasePoint: selDynamicEnt.dynamicBasePoint || { x: 0, y: 0 },
                                        dynamicScale: selDynamicEnt.dynamicScale ?? 1.0,
                                        dynamicRotationRad: selDynamicEnt.dynamicRotationRad ?? 0,
                                    };
                                    touchMovedRef.current = true;
                                    const label = linearParam?.labelTr || linearParam?.label || grip.paramId;
                                    const unit = linearParam?.unit || 'mm';
                                    setActiveGripTooltip({
                                        text: `${label}: ${Math.round(initialVal)} ${unit}`,
                                        screenX: screenPoint.x + 16,
                                        screenY: screenPoint.y - 12
                                    });
                                    return;
                                } else if (grip.type === 'point') {
                                    activeGripDragRef.current = {
                                        blockInstanceId: selDynamicEnt.blockInstanceId!,
                                        paramId: '__move_base_point__',
                                        initialParamValue: 0,
                                        grip,
                                        startMouseWorld: worldPoint,
                                        direction: { x: 1, y: 0 },
                                        dynamicBasePoint: selDynamicEnt.dynamicBasePoint || { x: 0, y: 0 },
                                        dynamicScale: selDynamicEnt.dynamicScale ?? 1.0,
                                        dynamicRotationRad: selDynamicEnt.dynamicRotationRad ?? 0,
                                    };
                                    touchMovedRef.current = true;
                                    return;
                                }
                            }
                        }
                    }
                }
            }

            // Compute snap & preview at touch start without committing point
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
            if (activeCommand) {
                commandProcessor.handleMouseDown(worldPoint);
            }
            pipelineRef.current?.setCursorWorld(worldPoint);
            setCursor(worldPoint, screenPoint);
        }
    }, [viewport, activeSnaps, snapEnabled, entities, selectedIds, setCursor, setCurrentSnap, activeCommand, updateDynamicBlock]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (e.cancelable) {
            e.preventDefault();
        }

        // 1. Two-finger pinch to zoom & pan
        if (e.touches.length >= 2) {
            const p1 = e.touches[0];
            const p2 = e.touches[1];
            const dist = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);

            const rect = canvas.getBoundingClientRect();
            const center = {
                x: (p1.clientX + p2.clientX) / 2 - rect.left,
                y: (p1.clientY + p2.clientY) / 2 - rect.top
            };

            if (lastTouchDistanceRef.current && lastTouchCenterRef.current) {
                const zoomFactor = dist / lastTouchDistanceRef.current;
                let newViewport = zoomViewportAt(viewport, center, zoomFactor);

                const deltaX = center.x - lastTouchCenterRef.current.x;
                const deltaY = center.y - lastTouchCenterRef.current.y;
                newViewport = panViewport(newViewport, deltaX, deltaY);

                setViewport(newViewport);
            }

            lastTouchDistanceRef.current = dist;
            lastTouchCenterRef.current = center;
            return;
        }

        // 2. Single finger move
        if (e.touches.length === 1 && !isPinchingRef.current) {
            const rect = canvas.getBoundingClientRect();
            const screenPoint = {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };

            if (touchStartRef.current) {
                const dx = screenPoint.x - touchStartRef.current.x;
                const dy = screenPoint.y - touchStartRef.current.y;
                if (Math.hypot(dx, dy) > 6) {
                    touchMovedRef.current = true;
                }
            }

            let worldPoint = screenToWorld(screenPoint, viewport);

            // Handle Dynamic Grip Drag on Touch
            if (activeGripDragRef.current) {
                const drag = activeGripDragRef.current;
                if (drag.paramId === '__move_base_point__') {
                    const dx = worldPoint.x - drag.startMouseWorld.x;
                    const dy = worldPoint.y - drag.startMouseWorld.y;
                    const newBase = {
                        x: Math.round(drag.dynamicBasePoint.x + dx),
                        y: Math.round(drag.dynamicBasePoint.y + dy)
                    };
                    updateDynamicBlock(drag.blockInstanceId, {}, { skipHistory: true, newBasePoint: newBase });
                    setActiveGripTooltip({
                        text: `Konum: (${newBase.x}, ${newBase.y}) mm`,
                        screenX: screenPoint.x + 16,
                        screenY: screenPoint.y - 12
                    });
                } else {
                    const dx = worldPoint.x - drag.startMouseWorld.x;
                    const dy = worldPoint.y - drag.startMouseWorld.y;
                    const dir = drag.direction;
                    const dirLenSq = dir.x * dir.x + dir.y * dir.y;
                    const dot = (dx * dir.x + dy * dir.y) / (dirLenSq || 1);
                    const deltaParam = dot / drag.dynamicScale;

                    let newVal = drag.initialParamValue + deltaParam;
                    if (drag.linearParam) {
                        const step = drag.linearParam.step || 10;
                        newVal = Math.round(newVal / step) * step;
                        newVal = Math.max(drag.linearParam.min, Math.min(drag.linearParam.max, newVal));
                    } else {
                        newVal = Math.round(newVal);
                    }
                    updateDynamicBlock(drag.blockInstanceId, { [drag.paramId]: newVal }, { skipHistory: true });
                    const label = drag.linearParam?.labelTr || drag.linearParam?.label || drag.paramId;
                    const unit = drag.linearParam?.unit || 'mm';
                    setActiveGripTooltip({
                        text: `${label}: ${Math.round(newVal)} ${unit}`,
                        screenX: screenPoint.x + 16,
                        screenY: screenPoint.y - 12
                    });
                }
                touchMovedRef.current = true;
                lastTouchCenterRef.current = screenPoint;
                return;
            }

            if (activeCommand) {
                // When in a command, dragging moves crosshair and updates snap & live preview
                if (snapEnabled && entities.length > 0) {
                    const snap = findSnapPoint(worldPoint, entities, activeSnaps, viewport.zoom);
                    setCurrentSnap(snap);
                    if (snap) {
                        worldPoint = snap.point;
                        if (!lastSnapRef.current || lastSnapRef.current.point.x !== snap.point.x || lastSnapRef.current.point.y !== snap.point.y) {
                            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                                navigator.vibrate(12);
                            }
                        }
                        lastSnapRef.current = snap;
                    } else {
                        lastSnapRef.current = null;
                    }
                } else {
                    setCurrentSnap(null);
                }

                commandProcessor.handleMouseMove(worldPoint);
                pipelineRef.current?.setCursorWorld(worldPoint);
                setCursor(worldPoint, screenPoint);
            } else {
                // When in select/idle mode, dragging pans the canvas!
                if (lastTouchCenterRef.current) {
                    const deltaX = screenPoint.x - lastTouchCenterRef.current.x;
                    const deltaY = screenPoint.y - lastTouchCenterRef.current.y;
                    const newViewport = panViewport(viewport, deltaX, deltaY);
                    setViewport(newViewport);
                }
            }

            lastTouchCenterRef.current = screenPoint;
        }
    }, [viewport, setViewport, activeCommand, snapEnabled, entities, activeSnaps, setCurrentSnap, setCursor, updateDynamicBlock]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (activeGripDragRef.current) {
            useCadStore.getState().pushHistory('Stretch dynamic block');
            activeGripDragRef.current = null;
            setActiveGripTooltip(null);
            touchStartRef.current = null;
            touchMovedRef.current = false;
            return;
        }

        if (isPinchingRef.current) {
            if (e.touches.length === 0) {
                isPinchingRef.current = false;
                lastTouchDistanceRef.current = null;
                lastTouchCenterRef.current = null;
            }
            return;
        }

        const canvas = canvasRef.current;
        const start = touchStartRef.current;

        if (canvas && start) {
            const currentPoint = lastTouchCenterRef.current || { x: start.x, y: start.y };
            let worldPoint = screenToWorld(currentPoint, viewport);

            if (snapEnabled && entities.length > 0) {
                const snap = findSnapPoint(worldPoint, entities, activeSnaps, viewport.zoom);
                if (snap) {
                    worldPoint = snap.point;
                }
            }

            if (activeCommand) {
                // In drawing/editing command, tap or release after aiming commits the point
                commandProcessor.handleMouseMove(worldPoint);
                commandProcessor.handlePointInput(worldPoint);
                commandProcessor.handleMouseUp(worldPoint);
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(15);
                }
            } else {
                // In select mode, tap selects/deselects entities
                const totalDist = Math.hypot(currentPoint.x - start.x, currentPoint.y - start.y);
                if (totalDist < 25) {
                    const clickedEntity = findEntityAtPoint(worldPoint, entities, viewport.zoom);
                    if (clickedEntity) {
                        selectEntity(clickedEntity.id, false);
                    } else {
                        deselectAll();
                    }
                }
            }
        }

        touchStartRef.current = null;
        touchMovedRef.current = false;
        lastTouchDistanceRef.current = null;
        lastTouchCenterRef.current = null;
        commandProcessor.handleMouseUp();
    }, [viewport, activeCommand, snapEnabled, entities, activeSnaps, selectEntity, deselectAll]);

    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const screenPoint: Point = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        const worldPoint = screenToWorld(screenPoint, viewport);

        // If a command is active (e.g. Spline, Polyline, Hatch), double-click finishes it!
        if (activeCommand) {
            commandProcessor.handleValueInput('ENTER');
            return;
        }

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

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const { activeCommand } = useCadStore.getState();
        if (activeCommand) {
            // Commit / finish active command like in AutoCAD
            commandProcessor.handleValueInput('ENTER');
        } else if (onContextMenuOpen) {
            onContextMenuOpen(e.clientX, e.clientY);
        }
    }, [onContextMenuOpen]);

    // ─────────────────────────────────────────────────────────────
    // KEYBOARD HANDLERS
    // ─────────────────────────────────────────────────────────────

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

            if (isInput) return;

            const currentDynamic = dynamicInputRef.current;
            const { activeCommand } = useCadStore.getState();

            if (e.key === 'Escape') {
                if (currentDynamic !== null) {
                    e.preventDefault();
                    setDynamicInput(null);
                    return;
                }
                useCadStore.getState().cancelCommand();
                return;
            }

            if (e.key === 'F8') { e.preventDefault(); useCadStore.getState().toggleOrtho(); return; }
            if (e.key === 'F3') { e.preventDefault(); useCadStore.getState().toggleSnap(); return; }
            if (e.ctrlKey && e.key === 'z') { e.preventDefault(); useCadStore.getState().undo(); return; }
            if (e.ctrlKey && e.key === 'y') { e.preventDefault(); useCadStore.getState().redo(); return; }

            // Single-key shortcut: 'm' or 'M' activates MEASURE
            if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.toLowerCase() === 'm' && currentDynamic === null) {
                e.preventDefault();
                commandProcessor.startCommand('MEASURE');
                return;
            }

            if (activeCommand) {
                if (e.key === 'Enter' || (e.key === ' ' && currentDynamic !== null && currentDynamic.length > 0)) {
                    if (currentDynamic !== null && currentDynamic.trim().length > 0) {
                        e.preventDefault();
                        commandProcessor.handleValueInput(currentDynamic.trim());
                        setDynamicInput(null);
                        return;
                    }
                }
                if (e.key === 'Backspace') {
                    if (currentDynamic !== null) {
                        e.preventDefault();
                        setDynamicInput(prev => (prev && prev.length > 1 ? prev.slice(0, -1) : null));
                        return;
                    }
                }
                if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) {
                    if (/^[0-9.,\-+xX<@dDrRcCfFeEaAø⌀*\/=]$/.test(e.key)) {
                        e.preventDefault();
                        setDynamicInput(prev => (prev === null ? e.key : prev + e.key));
                        return;
                    }
                }
            } else {
                // Space or Enter repeats last command when idle
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    commandProcessor.repeatLastCommand();
                }
            }
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
                style={{ background: (lightCanvas ? LIGHT_CANVAS : DARK_CANVAS).background }}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onContextMenu={handleContextMenu}
                onDoubleClick={handleDoubleClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            />

            {/* Dynamic Input (DYNMODE) on-cursor HUD */}
            {activeCommand && dynamicInput !== null && (
                <div
                    className="absolute z-30 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded shadow-2xl border select-none transition-all duration-75"
                    style={{
                        left: Math.min(
                            Math.max(10, (cursorScreen?.x || 100) + 18),
                            (containerRef.current?.clientWidth || 800) - 230
                        ),
                        top: Math.max(
                            10,
                            (cursorScreen?.y || 100) - 32
                        ),
                        background: '#0c1016',
                        borderColor: '#3ad0e6',
                        color: '#e7edf4',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7), 0 0 12px rgba(58, 208, 230, 0.3)',
                    }}
                >
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--cyan)]">
                        {activeCommand === 'CIRCLE'
                            ? 'ÇAP / YARIÇAP'
                            : activeCommand === 'RECTANGLE'
                            ? 'ÖLÇÜ W,H'
                            : activeCommand === 'LINE'
                            ? 'UZUNLUK / AÇI'
                            : activeCommand === 'POLYGON'
                            ? 'ÇAP / AF / KENAR'
                            : activeCommand === 'ELLIPSE'
                            ? 'YARIÇAPLAR (Rx,Ry)'
                            : activeCommand === 'ARC'
                            ? 'YARIÇAP / AÇI'
                            : activeCommand === 'DIMENSION'
                            ? 'ÖLÇÜ DEĞERİ'
                            : 'ÖLÇÜ'}
                        :
                    </span>
                    <span className="bg-[var(--bg-2)] px-2 py-0.5 rounded text-[var(--cyan)] font-bold border border-[var(--line)] min-w-[40px] text-center">
                        {dynamicInput}
                        <span className="inline-block w-1.5 h-3.5 bg-[var(--cyan)] ml-0.5 animate-pulse align-middle" />
                    </span>
                    <span className="text-[9px] text-[var(--alu-dim)] bg-[var(--bg-3)] px-1 py-0.5 rounded border border-[var(--line)]">
                        ↵ Enter
                    </span>
                </div>
            )}
            {editingDimension && (
                <input
                    type="number"
                    autoFocus
                    className="absolute z-10 bg-slate-900/90 text-cyan-400 border border-cyan-500/50 rounded px-1.5 py-0.5 outline-none font-mono text-sm shadow-xl"
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
            {/* Dynamic Block Stretch HUD Tooltip */}
            {activeGripTooltip && (
                <div
                    className="absolute z-40 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded shadow-2xl border select-none transition-all duration-75"
                    style={{
                        left: Math.min(
                            Math.max(10, activeGripTooltip.screenX),
                            (containerRef.current?.clientWidth || 800) - 220
                        ),
                        top: Math.max(10, activeGripTooltip.screenY),
                        background: '#07090c',
                        borderColor: '#00e5ff',
                        color: '#f8fafc',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8), 0 0 12px rgba(0, 229, 255, 0.4)',
                    }}
                >
                    <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-ping inline-block mr-1" />
                    <span className="font-bold text-[var(--cyan)]">
                        {activeGripTooltip.text}
                    </span>
                </div>
            )}
        </div>
    );
}

export default CadCanvas;
