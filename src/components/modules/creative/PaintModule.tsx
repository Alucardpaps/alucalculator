'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Pencil, Eraser, Trash2, Download, Undo, Redo, Square, Circle } from 'lucide-react';

export const PaintModule: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(5);
    const [tool, setTool] = useState<'brush' | 'eraser' | 'rectangle' | 'circle'>('brush');
    const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const resizeCanvas = () => {
            // Save content before resize
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Only resize if dimensions changed significantly to avoid flicker
            if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
                ctx.putImageData(imageData, 0, 0);

                // Reset context properties after resize
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }
        };

        // Initial setup
        resizeCanvas();

        // Setup initial white background
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            saveHistory();
        }

        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    const saveHistory = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    }, [history, historyStep]);

    const handleUndo = () => {
        if (historyStep > 0) {
            const newStep = historyStep - 1;
            setHistoryStep(newStep);
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx && history[newStep]) {
                ctx.putImageData(history[newStep], 0, 0);
            }
        }
    };

    const handleRedo = () => {
        if (historyStep < history.length - 1) {
            const newStep = historyStep + 1;
            setHistoryStep(newStep);
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx && history[newStep]) {
                ctx.putImageData(history[newStep], 0, 0);
            }
        }
    };

    const getMousePos = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent) => {
        const { x, y } = getMousePos(e);
        setIsDrawing(true);
        setStartPos({ x, y });

        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
        ctx.lineWidth = lineWidth;
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing) return;

        const { x, y } = getMousePos(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        if (tool === 'brush' || tool === 'eraser') {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        // For shapes, we would need a preview layer or clear/redraw loop
        // Simplified: Brush only dynamic drawing
    };

    const stopDrawing = (e: React.MouseEvent) => {
        if (!isDrawing) return;

        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx || !startPos) return;

        const { x, y } = getMousePos(e);

        if (tool === 'rectangle') {
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
        } else if (tool === 'circle') {
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
            ctx.beginPath();
            ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
            ctx.stroke();
        }

        ctx.closePath();
        setIsDrawing(false);
        setStartPos(null);
        saveHistory();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            saveHistory();
        }
    };

    const downloadImage = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = 'painting.png';
        link.href = canvas.toDataURL();
        link.click();
    };

    return (
        <div className="flex flex-col h-full bg-[#f0f0f0]">
            {/* Toolbar */}
            <div className="flex items-center gap-4 p-2 bg-white border-b border-gray-300 shadow-sm">
                <div className="flex gap-1 border-r pr-4">
                    <Button
                        variant={tool === 'brush' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setTool('brush')}
                    >
                        <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                        variant={tool === 'eraser' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setTool('eraser')}
                    >
                        <Eraser className="w-4 h-4" />
                    </Button>
                    <Button
                        variant={tool === 'rectangle' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setTool('rectangle')}
                    >
                        <Square className="w-4 h-4" />
                    </Button>
                    <Button
                        variant={tool === 'circle' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setTool('circle')}
                    >
                        <Circle className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2 border-r pr-4">
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                    <div className="w-32">
                        <Slider
                            value={[lineWidth]}
                            min={1}
                            max={50}
                            step={1}
                            onValueChange={(val) => setLineWidth(val[0])}
                        />
                    </div>
                    <span className="text-xs w-6 text-center">{lineWidth}px</span>
                </div>

                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={handleUndo} disabled={historyStep <= 0}>
                        <Undo className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleRedo} disabled={historyStep >= history.length - 1}>
                        <Redo className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={clearCanvas} className="text-red-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={downloadImage}>
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Canvas Area */}
            <div ref={containerRef} className="flex-1 overflow-hidden relative cursor-crosshair">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="absolute top-0 left-0 touch-none block"
                />
            </div>
        </div>
    );
};
