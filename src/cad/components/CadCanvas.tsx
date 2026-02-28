/**
 * AluCAD Canvas - Main CAD Drawing Surface
 * 
 * Paper.js based infinite canvas with pan/zoom, grid, and entity rendering.
 */

'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import paper from 'paper';
import { useCadStore } from '../store/cadStore';
import { commandProcessor } from '../commands/CommandProcessor';
import {
    worldToScreen,
    screenToWorld,
    panViewport,
    zoomViewportAt,
    calculateGridSpacing,
    getVisibleGridLines,
    constrainToOrtho
} from '../kernel/CoordinateSystem';
import { findSnapPoint, findIntersections } from '../geometry/SnapEngine';
import { CAD_COLORS, MAJOR_GRID_INTERVAL } from '../kernel/constants';
import {
    CadEntity,
    Point,
    LineGeometry,
    CircleGeometry,
    ArcGeometry,
    PolylineGeometry,
    PointGeometry,
    createLineEntity,
    Constraint
} from '../kernel/types';
import { useSketchSolver } from '../hooks/useSketchSolver';

// ═══════════════════════════════════════════════════════════════
// CAD CANVAS COMPONENT
// ═══════════════════════════════════════════════════════════════

interface CadCanvasProps {
    className?: string;
}

export function CadCanvas({ className }: CadCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const paperScopeRef = useRef<paper.PaperScope | null>(null);
    const isPanningRef = useRef(false);
    const lastMousePosRef = useRef<Point>({ x: 0, y: 0 });

    // Initialize Solver Integration
    useSketchSolver();

    // Store access
    const {
        entities,
        viewport,
        setViewport,
        updateViewport,
        showGrid,
        gridSpacing: storeGridSpacing,
        activeCommand,
        commandPoints,
        addCommandPoint,
        setCommandPrompt,
        addEntity,
        cancelCommand,
        snapEnabled,
        activeSnaps,
        currentSnap,
        setCurrentSnap,
        orthoEnabled,
        previewEntity,
        setPreviewEntity,
        setCursor,
        cursorWorld
    } = useCadStore();

    // ─────────────────────────────────────────────────────────────
    // INITIALIZATION
    // ─────────────────────────────────────────────────────────────

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Initialize Paper.js
        if (!paperScopeRef.current) {
            const scope = new paper.PaperScope();
            scope.setup(canvas);
            paperScopeRef.current = scope;
        }

        const scope = paperScopeRef.current;

        // Resize Observer for robust layout tracking
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;

                if (width === 0 || height === 0) return;

                // Sync Canvas Buffer Size
                canvas.width = width;
                canvas.height = height;

                // Sync Paper.js View
                if (scope && scope.view) {
                    scope.view.viewSize = new paper.Size(width, height);
                }

                // Sync Store Viewport
                updateViewport({ width, height });
            }
        });

        resizeObserver.observe(canvas);

        return () => {
            resizeObserver.disconnect();
        };
    }, [updateViewport]);

    // ─────────────────────────────────────────────────────────────
    // RENDERING
    // ─────────────────────────────────────────────────────────────

    useEffect(() => {
        const scope = paperScopeRef.current;
        const canvas = canvasRef.current;
        if (!scope || !canvas) return;

        // Ensure canvas buffer dimensions match DOM size
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        if (canvas.width !== Math.round(rect.width) || canvas.height !== Math.round(rect.height)) {
            canvas.width = Math.round(rect.width);
            canvas.height = Math.round(rect.height);
        }

        scope.activate();

        // Sync Paper.js view size with canvas
        if (scope.view) {
            scope.view.viewSize = new paper.Size(canvas.width, canvas.height);
        }

        scope.project.clear();

        // Create layers
        const gridLayer = new paper.Layer({ name: 'grid' });
        const entityLayer = new paper.Layer({ name: 'entities' });
        const previewLayer = new paper.Layer({ name: 'preview' });
        const uiLayer = new paper.Layer({ name: 'ui' });

        // ═══ GRID ═══
        if (showGrid) {
            gridLayer.activate();
            const spacing = calculateGridSpacing(viewport.zoom, storeGridSpacing);
            const gridLines = getVisibleGridLines(viewport, spacing, MAJOR_GRID_INTERVAL);

            // Vertical lines
            for (const { x, isMajor } of gridLines.vertical) {
                const screenX = worldToScreen({ x, y: 0 }, viewport).x;
                const line = new paper.Path.Line(
                    new paper.Point(screenX, 0),
                    new paper.Point(screenX, viewport.height)
                );
                line.strokeColor = new paper.Color(isMajor ? CAD_COLORS.GRID_MAJOR : CAD_COLORS.GRID_MINOR);
                line.strokeWidth = isMajor ? 1 : 0.5;
            }

            // Horizontal lines
            for (const { y, isMajor } of gridLines.horizontal) {
                const screenY = worldToScreen({ x: 0, y }, viewport).y;
                const line = new paper.Path.Line(
                    new paper.Point(0, screenY),
                    new paper.Point(viewport.width, screenY)
                );
                line.strokeColor = new paper.Color(isMajor ? CAD_COLORS.GRID_MAJOR : CAD_COLORS.GRID_MINOR);
                line.strokeWidth = isMajor ? 1 : 0.5;
            }

            // Origin crosshair
            const origin = worldToScreen({ x: 0, y: 0 }, viewport);
            const crossSize = 15;
            const crossX = new paper.Path.Line(
                new paper.Point(origin.x - crossSize, origin.y),
                new paper.Point(origin.x + crossSize, origin.y)
            );
            crossX.strokeColor = new paper.Color(CAD_COLORS.CROSSHAIR);
            crossX.strokeWidth = 1;

            const crossY = new paper.Path.Line(
                new paper.Point(origin.x, origin.y - crossSize),
                new paper.Point(origin.x, origin.y + crossSize)
            );
            crossY.strokeColor = new paper.Color(CAD_COLORS.CROSSHAIR);
            crossY.strokeWidth = 1;
        }

        // ═══ ENTITIES ═══
        entityLayer.activate();
        for (const entity of entities) {
            renderEntity(entity, viewport, scope);
        }

        // ═══ CONSTRAINTS ═══
        uiLayer.activate();
        const { constraints } = useCadStore.getState();
        for (const constraint of constraints) {
            renderConstraintGlyph(constraint, entities, viewport, scope);
        }

        // ═══ PREVIEW ENTITY ═══
        if (previewEntity) {
            previewLayer.activate();
            renderEntity(previewEntity, viewport, scope, true);
        }

        // ═══ SNAP MARKER ═══
        if (currentSnap) {
            uiLayer.activate();
            renderSnapMarker(currentSnap.point, currentSnap.mode, viewport, scope);
        }

        scope.view.update();
    }, [entities, viewport, showGrid, storeGridSpacing, previewEntity, currentSnap]);

    // ─────────────────────────────────────────────────────────────
    // MOUSE HANDLERS
    // ─────────────────────────────────────────────────────────────

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

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

        // Ortho constraint (handled by SnapEngine or Tool, but can keep global logic if needed)
        // For now, let's pass raw worldPoint to commandProcessor, or ortho-constrained if we want global ortho
        // Better: let Command handle Ortho if it wants, OR helper function
        // But LineTool doesn't know about Ortho yet easily without store access.
        // Let's keep Ortho logic here for cursor display?
        // Actually, let's pass the point to commandProcessor.

        commandProcessor.handleMouseMove(worldPoint);

        setCursor(worldPoint, screenPoint);
    }, [viewport, entities, activeSnaps, snapEnabled, orthoEnabled, setViewport, setCurrentSnap, setCursor]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const screenPoint: Point = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        // Middle mouse or Space+Left: Start panning
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            isPanningRef.current = true;
            lastMousePosRef.current = screenPoint;
            canvas.style.cursor = 'grabbing';
            return;
        }

        // Left click: Handle command input
        if (e.button === 0) {
            const worldPoint = currentSnap ? currentSnap.point : screenToWorld(screenPoint, viewport);
            commandProcessor.handleMouseDown(worldPoint);
            commandProcessor.handlePointInput(worldPoint);
        }

        // Right click: Finish command (Enter)
        if (e.button === 2) {
            e.preventDefault();
            commandProcessor.handleCancel();
        }
    }, [currentSnap, viewport, activeCommand]); // activeCommand dependency kept to re-bind if needed, or remove if strictly processor driven

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        if (e.button === 1 || isPanningRef.current) {
            isPanningRef.current = false;
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.style.cursor = 'crosshair';
            }
            commandProcessor.handleMouseUp();
        }
    }, []);

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
    }, [viewport, setViewport]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
    }, []);

    // ─────────────────────────────────────────────────────────────
    // KEYBOARD HANDLERS
    // ─────────────────────────────────────────────────────────────

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // ESC: Cancel command
            if (e.key === 'Escape') {
                cancelCommand();
            }

            // F8: Toggle Ortho
            if (e.key === 'F8') {
                e.preventDefault();
                useCadStore.getState().toggleOrtho();
            }

            // F3: Toggle OSNAP
            if (e.key === 'F3') {
                e.preventDefault();
                useCadStore.getState().toggleSnap();
            }

            // Ctrl+Z: Undo
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                useCadStore.getState().undo();
            }

            // Ctrl+Y: Redo
            if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                useCadStore.getState().redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cancelCommand]);

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────

    return (
        <canvas
            ref={canvasRef}
            className={`w-full h-full cursor-crosshair ${className}`}
            style={{ background: CAD_COLORS.BACKGROUND }}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onContextMenu={handleContextMenu}
        />
    );
}

// ═══════════════════════════════════════════════════════════════
// ENTITY RENDERING
// ═══════════════════════════════════════════════════════════════

function renderEntity(
    entity: CadEntity,
    viewport: any,
    scope: paper.PaperScope,
    isPreview: boolean = false
) {
    const geom = entity.geometry;
    const color = isPreview ? CAD_COLORS.PREVIEW : entity.color;
    const strokeColor = entity.isSelected ? CAD_COLORS.SELECTION : color;

    switch (geom.type) {
        case 'LINE':
            renderLine(geom, viewport, scope, strokeColor, isPreview);
            break;
        case 'CIRCLE':
            renderCircle(geom, viewport, scope, strokeColor, isPreview);
            break;
        case 'ARC':
            renderArc(geom, viewport, scope, strokeColor, isPreview);
            break;
        case 'POLYLINE':
            renderPolyline(geom, viewport, scope, strokeColor, isPreview);
            break;
        case 'POINT':
            renderPoint(geom as PointGeometry, viewport, scope, strokeColor, isPreview);
            break;
    }
}

function renderLine(
    geom: LineGeometry,
    viewport: any,
    scope: paper.PaperScope,
    color: string,
    isPreview: boolean
) {
    const start = worldToScreen(geom.start, viewport);
    const end = worldToScreen(geom.end, viewport);

    const line = new paper.Path.Line(
        new paper.Point(start.x, start.y),
        new paper.Point(end.x, end.y)
    );
    line.strokeColor = new paper.Color(color);
    line.strokeWidth = isPreview ? 1 : 2;
    if (isPreview) {
        line.dashArray = [5, 3];
    }
}

function renderCircle(
    geom: CircleGeometry,
    viewport: any,
    scope: paper.PaperScope,
    color: string,
    isPreview: boolean
) {
    const center = worldToScreen(geom.center, viewport);
    const radiusScreen = geom.radius * viewport.zoom;

    const circle = new paper.Path.Circle(
        new paper.Point(center.x, center.y),
        radiusScreen
    );
    circle.strokeColor = new paper.Color(color);
    circle.strokeWidth = isPreview ? 1 : 2;
    if (isPreview) {
        circle.dashArray = [5, 3];
    }
}

function renderArc(
    geom: ArcGeometry,
    viewport: any,
    scope: paper.PaperScope,
    color: string,
    isPreview: boolean
) {
    const center = worldToScreen(geom.center, viewport);
    const radiusScreen = geom.radius * viewport.zoom;

    // Convert angles to degrees for Paper.js
    const startDeg = geom.startAngle * (180 / Math.PI);
    const endDeg = geom.endAngle * (180 / Math.PI);

    const arc = new paper.Path.Arc(
        new paper.Point(
            center.x + radiusScreen * Math.cos(geom.startAngle),
            center.y - radiusScreen * Math.sin(geom.startAngle)
        ),
        new paper.Point(
            center.x + radiusScreen * Math.cos((geom.startAngle + geom.endAngle) / 2),
            center.y - radiusScreen * Math.sin((geom.startAngle + geom.endAngle) / 2)
        ),
        new paper.Point(
            center.x + radiusScreen * Math.cos(geom.endAngle),
            center.y - radiusScreen * Math.sin(geom.endAngle)
        )
    );
    arc.strokeColor = new paper.Color(color);
    arc.strokeWidth = isPreview ? 1 : 2;
}

function renderPolyline(
    geom: PolylineGeometry,
    viewport: any,
    scope: paper.PaperScope,
    color: string,
    isPreview: boolean
) {
    const points = geom.vertices.map(v => {
        const screen = worldToScreen(v, viewport);
        return new paper.Point(screen.x, screen.y);
    });

    const path = new paper.Path(points);
    if (geom.closed) {
        path.closePath();
    }
    path.strokeColor = new paper.Color(color);
    path.strokeWidth = isPreview ? 1 : 2;
}

function renderPoint(
    geom: PointGeometry,
    viewport: any,
    scope: paper.PaperScope,
    color: string,
    isPreview: boolean
) {
    const screen = worldToScreen({ x: geom.x, y: geom.y }, viewport);
    const circle = new paper.Path.Circle(new paper.Point(screen.x, screen.y), 3);
    circle.fillColor = new paper.Color(color);
    circle.strokeColor = new paper.Color('black');
    circle.strokeWidth = 1;
}

// ═══════════════════════════════════════════════════════════════
// SNAP MARKER RENDERING
// ═══════════════════════════════════════════════════════════════

function renderSnapMarker(
    point: Point,
    mode: string,
    viewport: any,
    scope: paper.PaperScope
) {
    const screenPoint = worldToScreen(point, viewport);
    const size = 8;
    const color = new paper.Color(CAD_COLORS.SNAP_MARKER);

    switch (mode) {
        case 'END': {
            // Square
            const rect = new paper.Path.Rectangle(
                new paper.Point(screenPoint.x - size, screenPoint.y - size),
                new paper.Point(screenPoint.x + size, screenPoint.y + size)
            );
            rect.strokeColor = color;
            rect.strokeWidth = 2;
            break;
        }
        case 'MID': {
            // Triangle
            const tri = new paper.Path.RegularPolygon(
                new paper.Point(screenPoint.x, screenPoint.y),
                3, size
            );
            tri.strokeColor = color;
            tri.strokeWidth = 2;
            break;
        }
        case 'CEN': {
            // Circle
            const circle = new paper.Path.Circle(
                new paper.Point(screenPoint.x, screenPoint.y),
                size
            );
            circle.strokeColor = color;
            circle.strokeWidth = 2;
            break;
        }
        case 'INT': {
            // X cross
            const line1 = new paper.Path.Line(
                new paper.Point(screenPoint.x - size, screenPoint.y - size),
                new paper.Point(screenPoint.x + size, screenPoint.y + size)
            );
            const line2 = new paper.Path.Line(
                new paper.Point(screenPoint.x - size, screenPoint.y + size),
                new paper.Point(screenPoint.x + size, screenPoint.y - size)
            );
            line1.strokeColor = color;
            line2.strokeColor = color;
            line1.strokeWidth = 2;
            line2.strokeWidth = 2;
            break;
        }
        default: {
            // Diamond
            const diamond = new paper.Path.RegularPolygon(
                new paper.Point(screenPoint.x, screenPoint.y),
                4, size
            );
            diamond.strokeColor = color;
            diamond.strokeWidth = 2;
        }
    }
}


// ═══════════════════════════════════════════════════════════════
// CONSTRAINT GLYPH RENDERING
// ═══════════════════════════════════════════════════════════════

function renderConstraintGlyph(
    constraint: Constraint,
    entities: CadEntity[],
    viewport: any,
    scope: paper.PaperScope
) {
    if (!constraint.active) return;

    // Find representative point for the glyph
    let pos: Point = { x: 0, y: 0 };
    const entIds = (constraint as any).entityIds || (constraint as any).entities || [];
    const involvedEntities = entIds.map((id: string) => entities.find(e => e.id === id)).filter(Boolean) as CadEntity[];

    if (involvedEntities.length === 0) return;

    const type = constraint.type.toUpperCase();

    // Logic to find placement position
    if (type === 'HORIZONTAL' || type === 'VERTICAL') {
        const line = involvedEntities[0].geometry as LineGeometry;
        pos = {
            x: (line.start.x + line.end.x) / 2,
            y: (line.start.y + line.end.y) / 2
        };
    } else if (type === 'PARALLEL' || type === 'PERPENDICULAR') {
        const line1 = involvedEntities[0].geometry as LineGeometry;
        pos = {
            x: (line1.start.x + line1.end.x) / 2,
            y: (line1.start.y + line1.end.y) / 2
        };
    } else if (type === 'COINCIDENT') {
        const geom = involvedEntities[0].geometry;
        if (geom.type === 'POINT') {
            pos = { x: geom.x, y: geom.y };
        } else if (geom.type === 'LINE') {
            pos = geom.start;
        }
    } else {
        return;
    }

    const screenPos = worldToScreen(pos, viewport);
    const color = '#3b82f6';
    const size = 6;

    switch (type) {
        case 'HORIZONTAL': {
            const hLine = new paper.Path.Line(
                new paper.Point(screenPos.x - size, screenPos.y + size + 4),
                new paper.Point(screenPos.x + size, screenPos.y + size + 4)
            );
            hLine.strokeColor = new paper.Color(color);
            hLine.strokeWidth = 2;
            break;
        }
        case 'VERTICAL': {
            const vLine = new paper.Path.Line(
                new paper.Point(screenPos.x + size + 4, screenPos.y - size),
                new paper.Point(screenPos.x + size + 4, screenPos.y + size)
            );
            vLine.strokeColor = new paper.Color(color);
            vLine.strokeWidth = 2;
            break;
        }
        case 'COINCIDENT': {
            const circle = new paper.Path.Circle(new paper.Point(screenPos.x, screenPos.y), 4);
            circle.strokeColor = new paper.Color(color);
            circle.strokeWidth = 1;
            break;
        }
    }
}

export default CadCanvas;
