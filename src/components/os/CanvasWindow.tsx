'use client';

import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { X, Minus, Maximize2, Move, Minimize2 } from 'lucide-react';
import { useOSStore, OSWindow } from '@/store/osStore';
import { ReactNode, useRef, useState, useEffect, useMemo } from 'react';
import { WindowSize } from '@/config/modules';

interface CanvasWindowProps {
    id: string;
    title: string;
    children: ReactNode;
    initialPosition?: { x: number; y: number };
    position?: { x: number; y: number }; // Controlled position
    onPositionChange?: (pos: { x: number; y: number }) => void;
    initialSize?: WindowSize;
    size?: WindowSize; // Controlled size
    onSizeChange?: (size: WindowSize) => void;
    zIndex: number;
    minimized?: boolean;
    scale?: number;
}

const SNAP_THRESHOLD = 15;

export function CanvasWindow({
    id,
    title,
    children,
    initialPosition = { x: 100, y: 100 },
    position: propPosition,
    onPositionChange,
    initialSize = { width: 500, height: 400 },
    size: propSize,
    onSizeChange,
    zIndex,
    minimized,
    scale = 1
}: CanvasWindowProps) {
    const { closeWindow, focusWindow, activeWindowId, minimizeWindow, windows } = useOSStore();
    const nodeRef = useRef<HTMLDivElement>(null);

    const isActive = activeWindowId === id;
    const defaultWidth = initialSize?.width || 500;
    const defaultHeight = initialSize?.height || 400;

    // Use propSize if available (controlled), otherwise local state (though we prefer controlled now)
    const [localSize, setLocalSize] = useState({ width: defaultWidth, height: defaultHeight });
    const currentSize = propSize || localSize;

    const [isResizing, setIsResizing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);

    // Sync local size with prop size if it changes and we aren't resizing
    useEffect(() => {
        if (!isResizing && propSize) {
            setLocalSize(propSize);
        }
    }, [propSize, isResizing]);


    // Local position state for smooth dragging and snapping
    const [currentPosition, setCurrentPosition] = useState(propPosition || initialPosition);

    // Sync with prop position when not dragging
    useEffect(() => {
        if (!isDragging && propPosition) {
            setCurrentPosition(propPosition);
        }
    }, [propPosition, isDragging]);

    // Get other windows for snapping
    const otherWindows = useMemo(() =>
        windows.filter(w => w.id !== id && !w.minimized),
        [windows, id]
    );

    const handleResizeStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        focusWindow(id);
    };

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!nodeRef.current) return;
            const rect = (nodeRef.current as HTMLElement).getBoundingClientRect();

            // Calculate new size handling scale
            const newWidth = Math.max(300, (e.clientX - rect.left) / scale); // Divide by scale
            const newHeight = Math.max(200, (e.clientY - rect.top) / scale); // Divide by scale

            setLocalSize({ width: newWidth, height: newHeight });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            if (onSizeChange) {
                // We use the functional update pattern or just rely on the effect dependency if needed, 
                // but since handleMouseUp is closed over scope, we should be careful.
                // However, the effect re-binds on every render if dependencies change.
                // Since this effect depends on `localSize` (which we will add), it will have the latest state.
                onSizeChange(localSize);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, scale, localSize, onSizeChange]);

    // Snapping Logic
    const handleDrag = (_: DraggableEvent, data: DraggableData) => {
        let { x, y } = data;

        // Skip snapping if holding Shift
        // @ts-ignore - data.lastEvent might not be typed but typically exists or we access the original event from arguments
        // Actually DraggableEvent is MouseEvent | TouchEvent, we can check that.
        const originalEvent = _ as MouseEvent; // Casting for simplicity
        if (originalEvent.shiftKey) {
            setCurrentPosition({ x, y });
            return;
        }

        const myRight = x + currentSize.width;
        const myBottom = y + currentSize.height;

        let snappedX = x;
        let snappedY = y;

        // Check against other windows
        otherWindows.forEach((win) => {
            const otherL = win.position.x;
            const otherT = win.position.y;
            const otherR = win.position.x + win.size.width;
            const otherB = win.position.y + win.size.height;

            // Snap X
            // My Left to Other Right
            if (Math.abs(x - otherR) < SNAP_THRESHOLD) snappedX = otherR;
            // My Right to Other Left
            if (Math.abs(myRight - otherL) < SNAP_THRESHOLD) snappedX = otherL - currentSize.width;
            // My Left to Other Left (Align)
            if (Math.abs(x - otherL) < SNAP_THRESHOLD) snappedX = otherL;
            // My Right to Other Right (Align)
            if (Math.abs(myRight - otherR) < SNAP_THRESHOLD) snappedX = otherR - currentSize.width;

            // Snap Y
            // My Top to Other Bottom
            if (Math.abs(y - otherB) < SNAP_THRESHOLD) snappedY = otherB;
            // My Bottom to Other Top
            if (Math.abs(myBottom - otherT) < SNAP_THRESHOLD) snappedY = otherT - currentSize.height;
            // My Top to Other Top (Align)
            if (Math.abs(y - otherT) < SNAP_THRESHOLD) snappedY = otherT;
            // My Bottom to Other Bottom (Align)
            if (Math.abs(myBottom - otherB) < SNAP_THRESHOLD) snappedY = otherB - currentSize.height;
        });

        setCurrentPosition({ x: snappedX, y: snappedY });
    };

    if (minimized) return null;

    // Performance Optimization Class
    const interactionClass = (isDragging || isResizing)
        ? 'opacity-90 shadow-none border-cyan-500/50 transition-none'
        : `${isActive ? 'border-cyan-500 shadow-[0_0_30px_rgba(0,229,255,0.15)]' : 'border-slate-700/50 shadow-black/50'} transition-all duration-200`;

    return (
        <Draggable
            handle=".window-header"
            position={isMaximized ? { x: 0, y: 0 } : currentPosition}
            scale={scale}
            nodeRef={nodeRef}
            onStart={() => {
                focusWindow(id);
                setIsDragging(true);
            }}
            onDrag={handleDrag}
            onStop={() => {
                setIsDragging(false);
                if (onPositionChange) {
                    onPositionChange(currentPosition);
                }
            }}
            disabled={isMaximized || isResizing}
        >
            <div
                ref={nodeRef}
                style={{
                    zIndex,
                    width: isMaximized ? '100%' : currentSize.width,
                    height: isMaximized ? '100%' : currentSize.height,
                    left: isMaximized ? 0 : undefined,
                    top: isMaximized ? 0 : undefined,
                    position: isMaximized ? 'fixed' : 'absolute',
                    transform: isMaximized ? 'none' : undefined
                }}
                className={`bg-[#1e1e1e]/90 backdrop-blur-md border rounded-lg flex flex-col overflow-hidden pointer-events-auto ${interactionClass}`}
                onClick={() => focusWindow(id)}
            >
                {/* Header */}
                <div
                    className={`window-header h-9 flex-none flex items-center justify-between px-3 cursor-grab active:cursor-grabbing border-b select-none
                        ${isActive ? 'bg-gradient-to-r from-cyan-950/30 to-slate-900/0 border-cyan-500/20' : 'bg-slate-800/10 border-white/5'}
                    `}
                    onDoubleClick={() => setIsMaximized(!isMaximized)}
                >
                    <div className="flex items-center gap-2.5">
                        <Move size={12} className={isActive ? "text-cyan-400" : "text-slate-500"} />
                        <span className={`text-xs font-semibold tracking-wide uppercase truncate max-w-[200px] ${isActive ? "text-cyan-50" : "text-slate-400"}`}>
                            {title}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 pl-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); minimizeWindow(id); }}
                            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                        >
                            <Minus size={12} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); }}
                            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                        >
                            {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); closeWindow(id); }}
                            className="p-1 hover:bg-red-500/80 rounded text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={12} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className={`flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent ${(isDragging || isResizing) ? 'pointer-events-none' : ''}`}>
                    {children}
                </div>

                {/* Resize Handle */}
                {!isMaximized && (
                    <div
                        onMouseDown={handleResizeStart}
                        className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-50 flex items-end justify-end p-1 group"
                    >
                        <div className="w-1.5 h-1.5 bg-slate-500/50 group-hover:bg-cyan-400 rounded-bl-[1px]" />
                    </div>
                )}
            </div>
        </Draggable>
    );
}
