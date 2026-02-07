/**
 * CAD Canvas - Main drawing canvas with precision engineering features
 * Supports shapes, dimensions, annotations with Miro-like infinite pan/zoom
 */

'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useCADCanvasStore, Point, CADShape, CADTool } from '@/store/CADCanvasStore';
import { SnapEngine, SNAP_SYMBOLS } from '@/lib/SnapSystem';
import DimensionRenderer from './DimensionRenderer';
import { useCADTools } from '@/hooks/useCADTools';

// ============================================
// Types
// ============================================

interface CADCanvasProps {
    className?: string;
}

// ============================================
// Helper Functions
// ============================================

const screenToWorld = (
    screenPoint: Point,
    viewport: { panX: number; panY: number; zoom: number }
): Point => ({
    x: (screenPoint.x - viewport.panX) / viewport.zoom,
    y: (screenPoint.y - viewport.panY) / viewport.zoom
});

const worldToScreen = (
    worldPoint: Point,
    viewport: { panX: number; panY: number; zoom: number }
): Point => ({
    x: worldPoint.x * viewport.zoom + viewport.panX,
    y: worldPoint.y * viewport.zoom + viewport.panY
});

const distance = (p1: Point, p2: Point): number =>
    Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

// ============================================
// Shape Renderer Component
// ============================================

const ShapeRenderer: React.FC<{
    shapes: CADShape[];
    selectedIds: string[];
    zoom: number;
    onSelect: (id: string, e: React.MouseEvent) => void;
}> = ({ shapes, selectedIds, zoom, onSelect }) => {
    return (
        <g className="shapes-layer">
            {shapes.map(shape => {
                if (!shape.visible) return null;

                const isSelected = selectedIds.includes(shape.id);
                const { strokeColor, strokeWidth, fillColor, fillOpacity, strokeDasharray } = shape.style;

                const baseStyle = {
                    stroke: isSelected ? '#ffff00' : strokeColor,
                    strokeWidth: (strokeWidth + (isSelected ? 1 : 0)) / zoom,
                    fill: fillColor || 'none',
                    fillOpacity: fillOpacity || 0,
                    strokeDasharray: strokeDasharray,
                    cursor: 'pointer'
                };

                switch (shape.type) {
                    case 'line':
                        if (shape.points.length >= 2) {
                            return (
                                <line
                                    key={shape.id}
                                    x1={shape.points[0].x}
                                    y1={shape.points[0].y}
                                    x2={shape.points[1].x}
                                    y2={shape.points[1].y}
                                    {...baseStyle}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect(shape.id, e);
                                    }}
                                />
                            );
                        }
                        break;

                    case 'rectangle':
                        if (shape.points.length >= 2) {
                            const [p1, p2] = shape.points;
                            const x = Math.min(p1.x, p2.x);
                            const y = Math.min(p1.y, p2.y);
                            const width = Math.abs(p2.x - p1.x);
                            const height = Math.abs(p2.y - p1.y);
                            return (
                                <rect
                                    key={shape.id}
                                    x={x}
                                    y={y}
                                    width={width}
                                    height={height}
                                    {...baseStyle}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect(shape.id, e);
                                    }}
                                />
                            );
                        }
                        break;

                    case 'circle':
                        if (shape.points.length >= 2) {
                            const center = shape.points[0];
                            const radius = distance(shape.points[0], shape.points[1]);
                            return (
                                <circle
                                    key={shape.id}
                                    cx={center.x}
                                    cy={center.y}
                                    r={radius}
                                    {...baseStyle}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect(shape.id, e);
                                    }}
                                />
                            );
                        }
                        break;

                    case 'polyline':
                        if (shape.points.length >= 2) {
                            const pathD = shape.points
                                .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                                .join(' ');
                            return (
                                <path
                                    key={shape.id}
                                    d={pathD}
                                    {...baseStyle}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect(shape.id, e);
                                    }}
                                />
                            );
                        }
                        break;
                }
                return null;
            })}
        </g>
    );
};

// ============================================
// Temp Shape Preview Component
// ============================================

const TempShapePreview: React.FC<{
    tool: CADTool;
    points: Point[];
    cursorPos: Point;
    zoom: number;
    strokeColor: string;
}> = ({ tool, points, cursorPos, zoom, strokeColor }) => {
    if (points.length === 0) return null;

    const style = {
        stroke: strokeColor,
        strokeWidth: 2 / zoom,
        strokeDasharray: `${4 / zoom} ${4 / zoom}`,
        fill: 'none',
        pointerEvents: 'none' as const
    };

    switch (tool) {
        case 'line':
            return (
                <line
                    x1={points[0].x}
                    y1={points[0].y}
                    x2={cursorPos.x}
                    y2={cursorPos.y}
                    {...style}
                />
            );

        case 'rectangle':
            const x = Math.min(points[0].x, cursorPos.x);
            const y = Math.min(points[0].y, cursorPos.y);
            const width = Math.abs(cursorPos.x - points[0].x);
            const height = Math.abs(cursorPos.y - points[0].y);
            return <rect x={x} y={y} width={width} height={height} {...style} />;

        case 'circle':
            const radius = distance(points[0], cursorPos);
            return <circle cx={points[0].x} cy={points[0].y} r={radius} {...style} />;

        default:
            return null;
    }
};

// ============================================
// Ruler Component
// ============================================

const Rulers: React.FC<{
    viewport: { panX: number; panY: number; zoom: number };
    width: number;
    height: number;
    gridSize: number;
    unit: string;
}> = ({ viewport, width, height, gridSize, unit }) => {
    const rulerSize = 24;
    const tickStep = gridSize * viewport.zoom;
    const majorTickEvery = 5;

    // Calculate visible range in world coordinates
    const startX = Math.floor(-viewport.panX / viewport.zoom / gridSize) * gridSize;
    const startY = Math.floor(-viewport.panY / viewport.zoom / gridSize) * gridSize;

    const horizontalTicks: { pos: number; label: string; major: boolean }[] = [];
    const verticalTicks: { pos: number; label: string; major: boolean }[] = [];

    // Horizontal ruler ticks
    for (let x = startX; x < (width - viewport.panX) / viewport.zoom; x += gridSize) {
        const screenX = x * viewport.zoom + viewport.panX;
        if (screenX >= rulerSize && screenX <= width) {
            const tickNum = Math.round(x / gridSize);
            horizontalTicks.push({
                pos: screenX,
                label: x.toFixed(0),
                major: tickNum % majorTickEvery === 0
            });
        }
    }

    // Vertical ruler ticks
    for (let y = startY; y < (height - viewport.panY) / viewport.zoom; y += gridSize) {
        const screenY = y * viewport.zoom + viewport.panY;
        if (screenY >= rulerSize && screenY <= height) {
            const tickNum = Math.round(y / gridSize);
            verticalTicks.push({
                pos: screenY,
                label: y.toFixed(0),
                major: tickNum % majorTickEvery === 0
            });
        }
    }

    return (
        <>
            {/* Horizontal Ruler */}
            <div
                className="absolute top-0 left-0 right-0 z-30"
                style={{
                    height: rulerSize,
                    marginLeft: rulerSize,
                    backgroundColor: 'var(--color-os-header)',
                    borderBottom: '1px solid var(--color-os-border)'
                }}
            >
                <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                    {horizontalTicks.map((tick, i) => (
                        <g key={i}>
                            <line
                                x1={tick.pos - rulerSize}
                                y1={tick.major ? 8 : 14}
                                x2={tick.pos - rulerSize}
                                y2={rulerSize}
                                stroke="var(--color-os-text-secondary)"
                                strokeWidth={tick.major ? 1 : 0.5}
                            />
                            {tick.major && (
                                <text
                                    x={tick.pos - rulerSize}
                                    y={10}
                                    textAnchor="middle"
                                    fontSize={8}
                                    fill="var(--color-os-text-secondary)"
                                    fontFamily="monospace"
                                >
                                    {tick.label}
                                </text>
                            )}
                        </g>
                    ))}
                </svg>
            </div>

            {/* Vertical Ruler */}
            <div
                className="absolute top-0 left-0 bottom-0 z-30"
                style={{
                    width: rulerSize,
                    marginTop: rulerSize,
                    backgroundColor: 'var(--color-os-header)',
                    borderRight: '1px solid var(--color-os-border)'
                }}
            >
                <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                    {verticalTicks.map((tick, i) => (
                        <g key={i}>
                            <line
                                x1={tick.major ? 8 : 14}
                                y1={tick.pos - rulerSize}
                                x2={rulerSize}
                                y2={tick.pos - rulerSize}
                                stroke="var(--color-os-text-secondary)"
                                strokeWidth={tick.major ? 1 : 0.5}
                            />
                            {tick.major && (
                                <text
                                    x={6}
                                    y={tick.pos - rulerSize + 3}
                                    textAnchor="middle"
                                    fontSize={8}
                                    fill="var(--color-os-text-secondary)"
                                    fontFamily="monospace"
                                    transform={`rotate(-90, 6, ${tick.pos - rulerSize})`}
                                >
                                    {tick.label}
                                </text>
                            )}
                        </g>
                    ))}
                </svg>
            </div>

            {/* Corner */}
            <div
                className="absolute top-0 left-0 z-40 flex items-center justify-center text-[8px]"
                style={{
                    width: rulerSize,
                    height: rulerSize,
                    backgroundColor: 'var(--color-os-header)',
                    borderRight: '1px solid var(--color-os-border)',
                    borderBottom: '1px solid var(--color-os-border)',
                    color: 'var(--color-os-text-secondary)'
                }}
            >
                {unit}
            </div>
        </>
    );
};

// ============================================
// Snap Indicator Component
// ============================================

const SnapIndicator: React.FC<{
    position: Point;
    mode: string;
    viewport: { panX: number; panY: number; zoom: number };
}> = ({ position, mode, viewport }) => {
    const screen = worldToScreen(position, viewport);
    const snapInfo = SNAP_SYMBOLS[mode as keyof typeof SNAP_SYMBOLS];

    if (!snapInfo) return null;

    return (
        <div
            className="fixed pointer-events-none z-50 flex items-center justify-center"
            style={{
                left: screen.x - 10,
                top: screen.y - 10,
                width: 20,
                height: 20
            }}
        >
            <div
                className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                style={{
                    borderColor: snapInfo.color,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: snapInfo.color
                }}
            >
                {snapInfo.symbol}
            </div>
        </div>
    );
};

// ============================================
// Main CAD Canvas Component
// ============================================

export function CADCanvas({ className }: CADCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [cursorPos, setCursorPos] = useState<Point>({ x: 0, y: 0 });
    const [worldCursor, setWorldCursor] = useState<Point>({ x: 0, y: 0 });
    const [snapIndicator, setSnapIndicator] = useState<{ position: Point; mode: string } | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [lastMousePos, setLastMousePos] = useState<Point>({ x: 0, y: 0 });

    const {
        shapes,
        dimensions,
        annotations,
        currentTool,
        isDrawing,
        tempPoints,
        unit,
        precision,
        snapSettings,
        showRulers,
        showGrid,
        gridSize,
        viewport,
        selectedIds,
        currentShapeStyle,
        setViewport,
        setIsDrawing,
        addTempPoint,
        clearTempPoints,
        addShape,
        addDimension,
        selectShape,
        deselectAll
    } = useCADCanvasStore();

    const { handleTrim, handleExtend, handleSmartDimension, handleFillet, handleChamfer } = useCADTools();

    // Resize observer
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            setContainerSize({ width, height });
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    // Create snap engine
    const snapEngine = new SnapEngine(shapes, snapSettings, viewport);

    // Mouse position handler
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const screenPos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        // Handle panning
        if (isPanning) {
            const dx = screenPos.x - lastMousePos.x;
            const dy = screenPos.y - lastMousePos.y;
            setViewport({
                panX: viewport.panX + dx,
                panY: viewport.panY + dy
            });
            setLastMousePos(screenPos);
            return;
        }

        setCursorPos(screenPos);

        // Convert to world coordinates
        let worldPos = screenToWorld(screenPos, viewport);

        // Apply snap
        const snapResult = snapEngine.snap(worldPos);
        if (snapResult.snapped) {
            worldPos = snapResult.point;
            setSnapIndicator({ position: worldPos, mode: snapResult.mode! });
        } else {
            setSnapIndicator(null);
        }

        setWorldCursor(worldPos);
    }, [viewport, snapSettings, shapes, isPanning, lastMousePos, setViewport]);

    // Mouse down handler
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const screenPos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        // Middle click or pan tool or space+left click - start panning
        if (e.button === 1 || (e.button === 0 && currentTool === 'pan')) {
            e.preventDefault();
            setIsPanning(true);
            setLastMousePos(screenPos);
            return;
        }

        if (e.button !== 0) return;

        const drawingTools: CADTool[] = ['line', 'rectangle', 'circle', 'arc'];

        if (currentTool === 'select') {
            // Deselect on empty canvas click
            deselectAll();
            return;
        }

        if (drawingTools.includes(currentTool)) {
            if (!isDrawing) {
                // Start drawing
                setIsDrawing(true);
                addTempPoint(worldCursor);
            } else {
                // Complete shape
                const finalPoints = [...tempPoints, worldCursor];

                addShape({
                    type: currentTool === 'arc' ? 'arc' : currentTool as CADShape['type'],
                    points: finalPoints,
                    style: currentShapeStyle,
                    locked: false,
                    visible: true,
                    layer: 'default'
                });

                clearTempPoints();
            }
        }

        // Dimension tools
        if (currentTool.startsWith('dimension-')) {
            if (!isDrawing) {
                setIsDrawing(true);
                addTempPoint(worldCursor);
            } else {
                const dimValue = distance(tempPoints[0], worldCursor);
                const dimType = currentTool.replace('dimension-', '') as 'linear' | 'angular' | 'radius';

                addDimension({
                    type: dimType,
                    startPoint: tempPoints[0],
                    endPoint: worldCursor,
                    offsetDistance: 30,
                    value: dimValue,
                    displayValue: `${dimValue.toFixed(precision)} ${unit}`,
                    textPosition: 'center',
                    style: {
                        textColor: '#ffffff',
                        textSize: 12,
                        lineColor: '#00e5ff',
                        arrowSize: 8,
                        extensionLineGap: 2,
                        extensionLineOvershoot: 2
                    }
                });

                clearTempPoints();
            }
        }
    }, [currentTool, isDrawing, worldCursor, tempPoints, currentShapeStyle, unit, precision, deselectAll, setIsDrawing, addTempPoint, addShape, clearTempPoints, addDimension]);

    // Mouse up handler
    const handleMouseUp = useCallback(() => {
        if (isPanning) {
            setIsPanning(false);
        }
    }, [isPanning]);

    const handleShapeClick = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();

        // Calculate world click position
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldPoint = screenToWorld({ x: mouseX, y: mouseY }, viewport);

        if (currentTool === 'trim') {
            handleTrim(worldPoint, id);
        } else if (currentTool === 'extend') {
            handleExtend(worldPoint, id);
        } else if (currentTool === 'smart-dimension') {
            handleSmartDimension(worldPoint, id);
        } else if (currentTool === 'fillet') {
            handleFillet(worldPoint, id);
        } else if (currentTool === 'chamfer') {
            handleChamfer(worldPoint, id);
        } else if (currentTool === 'select') {
            selectShape(id, e.shiftKey);
        }
    }, [currentTool, viewport, handleTrim, handleExtend, handleSmartDimension, selectShape]);

    // Wheel handler for zoom
    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.min(Math.max(viewport.zoom * zoomFactor, 0.1), 10);

            // Zoom towards cursor position
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const worldX = (mouseX - viewport.panX) / viewport.zoom;
                const worldY = (mouseY - viewport.panY) / viewport.zoom;

                const newPanX = mouseX - worldX * newZoom;
                const newPanY = mouseY - worldY * newZoom;

                setViewport({ zoom: newZoom, panX: newPanX, panY: newPanY });
            }
        } else {
            // Pan with scroll
            setViewport({
                panX: viewport.panX - e.deltaX,
                panY: viewport.panY - e.deltaY
            });
        }
    }, [viewport, setViewport]);

    // Keyboard handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                clearTempPoints();
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedIds.length > 0) {
                    // Delete selected is handled by store
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIds, clearTempPoints]);

    const rulerOffset = showRulers ? 24 : 0;

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full overflow-hidden ${className}`}
            style={{
                backgroundColor: '#1a1a1a',
                cursor: isPanning ? 'grabbing' : (currentTool === 'pan' ? 'grab' : 'crosshair')
            }}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Rulers */}
            {showRulers && (
                <Rulers
                    viewport={viewport}
                    width={containerSize.width}
                    height={containerSize.height}
                    gridSize={gridSize}
                    unit={unit}
                />
            )}

            {/* Main SVG Canvas */}
            <svg
                className="absolute"
                style={{
                    left: rulerOffset,
                    top: rulerOffset,
                    width: containerSize.width - rulerOffset,
                    height: containerSize.height - rulerOffset
                }}
            >
                <g transform={`translate(${viewport.panX}, ${viewport.panY}) scale(${viewport.zoom})`}>
                    {/* Grid */}
                    {showGrid && (
                        <g className="grid-layer" opacity={0.3}>
                            <defs>
                                <pattern
                                    id="smallGrid"
                                    width={gridSize}
                                    height={gridSize}
                                    patternUnits="userSpaceOnUse"
                                >
                                    <path
                                        d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                                        fill="none"
                                        stroke="#444"
                                        strokeWidth={0.5 / viewport.zoom}
                                    />
                                </pattern>
                                <pattern
                                    id="largeGrid"
                                    width={gridSize * 5}
                                    height={gridSize * 5}
                                    patternUnits="userSpaceOnUse"
                                >
                                    <rect width={gridSize * 5} height={gridSize * 5} fill="url(#smallGrid)" />
                                    <path
                                        d={`M ${gridSize * 5} 0 L 0 0 0 ${gridSize * 5}`}
                                        fill="none"
                                        stroke="#555"
                                        strokeWidth={1 / viewport.zoom}
                                    />
                                </pattern>
                            </defs>
                            <rect
                                x={-10000}
                                y={-10000}
                                width={20000}
                                height={20000}
                                fill="url(#largeGrid)"
                            />
                        </g>
                    )}

                    {/* Origin marker */}
                    <g className="origin-marker">
                        <line x1={-20} y1={0} x2={20} y2={0} stroke="#ff0000" strokeWidth={1 / viewport.zoom} />
                        <line x1={0} y1={-20} x2={0} y2={20} stroke="#00ff00" strokeWidth={1 / viewport.zoom} />
                        <circle cx={0} cy={0} r={3 / viewport.zoom} fill="#ffffff" />
                    </g>

                    {/* Shapes */}
                    <ShapeRenderer
                        shapes={shapes}
                        selectedIds={selectedIds}
                        zoom={viewport.zoom}
                        onSelect={handleShapeClick}
                    />

                    {/* Dimensions */}
                    <DimensionRenderer dimensions={dimensions} zoom={viewport.zoom} />

                    {/* Temp shape preview */}
                    {isDrawing && tempPoints.length > 0 && (
                        <TempShapePreview
                            tool={currentTool}
                            points={tempPoints}
                            cursorPos={worldCursor}
                            zoom={viewport.zoom}
                            strokeColor={currentShapeStyle.strokeColor}
                        />
                    )}
                </g>
            </svg>

            {/* Snap Indicator */}
            {snapIndicator && (
                <SnapIndicator
                    position={snapIndicator.position}
                    mode={snapIndicator.mode}
                    viewport={viewport}
                />
            )}

            {/* Coordinate Display */}
            <div
                className="absolute bottom-4 right-4 px-3 py-2 rounded text-xs font-mono flex gap-4"
                style={{
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'var(--color-os-text-primary)',
                    border: '1px solid var(--color-os-border)'
                }}
            >
                <span>X: {worldCursor.x.toFixed(precision)}</span>
                <span>Y: {worldCursor.y.toFixed(precision)}</span>
                <span>{unit}</span>
            </div>
        </div>
    );
}

export default CADCanvas;
