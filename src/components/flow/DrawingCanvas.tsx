import React, { useRef } from 'react';
import { useViewport } from 'reactflow';
import { useCADCanvasStore, Point } from '@/store/CADCanvasStore';

export const DrawingCanvas: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const { x, y, zoom } = useViewport();

    const {
        isDrawing,
        setIsDrawing,
        currentTool,
        addFreehandStroke,
        addPointToCurrentStroke,
        freehandStrokes,
        shapes, // Get shapes
        addShape, // Get addShape
        tempPoints,
        currentShapeStyle,
        clearTempPoints
    } = useCADCanvasStore();

    // Define which tools activate the drawing layer
    const isDrawingTool = ['pen', 'highlighter', 'line', 'rectangle', 'circle', 'arrow'].includes(currentTool);

    const getPoint = (e: React.PointerEvent): Point => {
        // Convert screen coordinates to world coordinates
        // world = (screen - pan) / zoom
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();

        // Mouse relative to the SVG element (viewport)
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        return {
            x: (clientX - x) / zoom,
            y: (clientY - y) / zoom
        };
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isDrawingTool) return;

        // Only capture left click
        if (e.button !== 0) return;

        e.preventDefault();
        e.stopPropagation();

        const point = getPoint(e);
        setIsDrawing(true);
        addPointToCurrentStroke(point);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDrawing || !isDrawingTool) return;
        e.preventDefault();
        e.stopPropagation();

        const point = getPoint(e);
        addPointToCurrentStroke(point);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDrawing || !isDrawingTool) return;
        e.preventDefault();
        e.stopPropagation();

        if (tempPoints.length > 1) {
            if (currentTool === 'pen' || currentTool === 'highlighter') {
                addFreehandStroke({
                    points: [...tempPoints],
                    color: currentTool === 'highlighter' ? '#ffff00' : currentShapeStyle.strokeColor,
                    width: currentTool === 'highlighter' ? 20 : currentShapeStyle.strokeWidth, // Use store width
                    opacity: currentTool === 'highlighter' ? 0.3 : 1,
                    tool: currentTool as 'pen' | 'highlighter'
                });
            } else {
                // Shape Creation
                const start = tempPoints[0];
                const end = tempPoints[tempPoints.length - 1]; // Last point is current mouse pos

                let points: Point[] = [start, end];
                let type: any = currentTool;

                if (currentTool === 'rectangle') {
                    // Rect is defined by p1, p2 (diagonal)
                    // We store it as such, renderer handles it
                }

                addShape({
                    type: type,
                    points: points,
                    style: currentShapeStyle,
                    locked: false,
                    visible: true,
                    layer: '0'
                });
            }
        }

        setIsDrawing(false);
        clearTempPoints();
    };

    // Helper to convert points to SVG path d attribute
    const pointsToPath = (points: Point[]) => {
        if (points.length < 2) return '';

        let d = `M ${points[0].x} ${points[0].y}`;

        // Simple linear interpolation
        for (let i = 1; i < points.length; i++) {
            const p = points[i];
            d += ` L ${p.x} ${p.y}`;
        }

        return d;
    };

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-10">
            <svg
                ref={svgRef}
                className="w-full h-full"
                style={{
                    pointerEvents: isDrawingTool ? 'all' : 'none',
                    cursor: isDrawingTool ? 'crosshair' : 'default'
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                <g transform={`translate(${x}, ${y}) scale(${zoom})`}>
                    {/* Render Shapes */}
                    {shapes.map(shape => {
                        if (!shape.visible) return null;
                        const style = shape.style;

                        if (shape.type === 'line' || shape.type === 'arrow') {
                            return (
                                <g key={shape.id}>
                                    <line
                                        x1={shape.points[0].x} y1={shape.points[0].y}
                                        x2={shape.points[1].x} y2={shape.points[1].y}
                                        stroke={style.strokeColor}
                                        strokeWidth={style.strokeWidth}
                                        strokeLinecap="round"
                                    />
                                    {shape.type === 'arrow' && <ArrowHead p1={shape.points[0]} p2={shape.points[1]} color={style.strokeColor} />}
                                </g>
                            );
                        } else if (shape.type === 'rectangle') {
                            const x = Math.min(shape.points[0].x, shape.points[1].x);
                            const y = Math.min(shape.points[0].y, shape.points[1].y);
                            const w = Math.abs(shape.points[0].x - shape.points[1].x);
                            const h = Math.abs(shape.points[0].y - shape.points[1].y);
                            return (
                                <rect
                                    key={shape.id}
                                    x={x} y={y} width={w} height={h}
                                    stroke={style.strokeColor}
                                    strokeWidth={style.strokeWidth}
                                    fill="none"
                                />
                            );
                        } else if (shape.type === 'circle') {
                            const r = Math.sqrt(Math.pow(shape.points[1].x - shape.points[0].x, 2) + Math.pow(shape.points[1].y - shape.points[0].y, 2));
                            return (
                                <circle
                                    key={shape.id}
                                    cx={shape.points[0].x} cy={shape.points[0].y} r={r}
                                    stroke={style.strokeColor}
                                    strokeWidth={style.strokeWidth}
                                    fill="none"
                                />
                            );
                        }
                        return null;
                    })}

                    {/* Render Existing Strokes */}
                    {freehandStrokes.map(stroke => (
                        <path
                            key={stroke.id}
                            d={pointsToPath(stroke.points)}
                            stroke={stroke.color}
                            strokeWidth={stroke.width}
                            strokeOpacity={stroke.opacity}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ pointerEvents: 'none' }}
                        />
                    ))}

                    {/* Render Current Preview */}
                    {tempPoints.length > 0 && (() => {
                        const start = tempPoints[0];
                        const end = tempPoints[tempPoints.length - 1]; // Use last point for shape preview

                        if (currentTool === 'pen' || currentTool === 'highlighter') {
                            return (
                                <path
                                    d={pointsToPath(tempPoints)}
                                    stroke={currentTool === 'highlighter' ? '#ffff00' : currentShapeStyle.strokeColor}
                                    strokeWidth={currentTool === 'highlighter' ? 20 : currentShapeStyle.strokeWidth}
                                    strokeOpacity={currentTool === 'highlighter' ? 0.3 : 1}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            );
                        } else if (currentTool === 'line' || currentTool === 'arrow') {
                            return (
                                <g>
                                    <line
                                        x1={start.x} y1={start.y}
                                        x2={end.x} y2={end.y}
                                        stroke={currentShapeStyle.strokeColor}
                                        strokeWidth={currentShapeStyle.strokeWidth}
                                    />
                                    {currentTool === 'arrow' && <ArrowHead p1={start} p2={end} color={currentShapeStyle.strokeColor} />}
                                </g>
                            );
                        } else if (currentTool === 'rectangle') {
                            const x = Math.min(start.x, end.x);
                            const y = Math.min(start.y, end.y);
                            const w = Math.abs(start.x - end.x);
                            const h = Math.abs(start.y - end.y);
                            return (
                                <rect
                                    x={x} y={y} width={w} height={h}
                                    stroke={currentShapeStyle.strokeColor}
                                    strokeWidth={currentShapeStyle.strokeWidth}
                                    fill="none"
                                />
                            );
                        } else if (currentTool === 'circle') {
                            const r = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
                            return (
                                <circle
                                    cx={start.x} cy={start.y} r={r}
                                    stroke={currentShapeStyle.strokeColor}
                                    strokeWidth={currentShapeStyle.strokeWidth}
                                    fill="none"
                                />
                            );
                        }
                    })()}
                </g>
            </svg>
        </div>
    );
};

// Helper for Arrow Head
const ArrowHead = ({ p1, p2, color }: { p1: Point, p2: Point, color: string }) => {
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const headLen = 10;
    return (
        <path
            d={`M ${p2.x} ${p2.y} L ${p2.x - headLen * Math.cos(angle - Math.PI / 6)} ${p2.y - headLen * Math.sin(angle - Math.PI / 6)} M ${p2.x} ${p2.y} L ${p2.x - headLen * Math.cos(angle + Math.PI / 6)} ${p2.y - headLen * Math.sin(angle + Math.PI / 6)}`}
            stroke={color}
            strokeWidth={2}
            fill="none"
        />
    );
};
