'use client';

import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { X, Minus, Maximize2, Move, Minimize2, ChevronLeft } from 'lucide-react';
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
    maximized?: boolean;
    scale?: number;
    minWidth?: number;
    minHeight?: number;
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
    maximized: propMaximized,
    scale = 1,
    minWidth = 300,
    minHeight = 200
}: CanvasWindowProps) {
    const { closeWindow, focusWindow, activeWindowId, minimizeWindow, toggleMaximize, windows } = useOSStore();
    const nodeRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const isActive = activeWindowId === id;
    const defaultWidth = initialSize?.width || 500;
    const defaultHeight = initialSize?.height || 400;

    // Initialize with clamped values
    const [localSize, setLocalSize] = useState({
        width: Math.max(minWidth, defaultWidth),
        height: Math.max(minHeight, defaultHeight)
    });

    // Always use clamped values for rendering
    const currentSize = useMemo(() => ({
        width: Math.max(minWidth, (propSize || localSize).width),
        height: Math.max(minHeight, (propSize || localSize).height)
    }), [propSize, localSize, minWidth, minHeight]);

    const [isResizing, setIsResizing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const isMaximized = propMaximized || false;

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
            const newWidth = Math.max(minWidth, (e.clientX - rect.left) / scale); // Divide by scale
            const newHeight = Math.max(minHeight, (e.clientY - rect.top) / scale); // Divide by scale

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
    const interactionClass = isMaximized
        ? 'transition-all duration-300'
        : (isDragging || isResizing)
            ? 'opacity-90 shadow-none border-cyan-500/50 transition-none'
            : `${isActive ? 'border-cyan-500/60 shadow-[0_0_40px_rgba(0,229,255,0.12),0_8px_32px_rgba(0,0,0,0.5)]' : 'border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.4)]'} transition-all duration-200`;

    return (
        <Draggable
            handle=".window-header"
            position={(isMaximized || isMobile) ? { x: 0, y: 0 } : currentPosition}
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
            disabled={isMaximized || isMobile || isResizing}
        >
            <div
                ref={nodeRef}
                id={id}
                role="dialog"
                aria-labelledby={`${id}-title`}
                data-window-type={id.includes('settings') ? 'settings' : 'other'}
                data-min-width={minWidth}
                data-current-width={currentSize.width}
                style={{
                    zIndex,
                    width: isMaximized || isMobile ? '100%' : `${currentSize.width}px`,
                    height: isMaximized ? '100%' : isMobile ? 'calc(100% - 85px)' : `${currentSize.height}px`,
                    left: isMaximized || isMobile ? 0 : undefined,
                    top: isMaximized || isMobile ? 0 : undefined,
                    position: 'absolute',
                    transform: isMaximized || (isMobile && !isDragging) ? 'none' : undefined,
                    backgroundColor: isMaximized ? '#050505' : 'rgba(18, 22, 30, 0.92)',
                    backdropFilter: isMaximized ? 'none' : 'blur(24px) saturate(1.2)',
                }}
                className={`
                    ${(isMaximized || isMobile) ? 'canvas-window-max border-none rounded-none' : 'border rounded-xl'}
                    flex flex-col overflow-hidden pointer-events-auto ${interactionClass}
                `}
                onPointerDownCapture={() => focusWindow(id)}
            >
                {/* MOBILE HEADER — Full-width touch-friendly bar */}
                {isMobile && (
                    <div className="window-header h-14 flex-none flex items-center gap-3 px-4 bg-[#0a0e14] border-b border-white/10 select-none">
                        <button
                            onClick={(e) => { e.stopPropagation(); closeWindow(id); }}
                            aria-label="Close and go back"
                            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:bg-white/10 transition-colors"
                        >
                            <ChevronLeft size={20} className="text-white/70" />
                        </button>
                        <span
                            id={`${id}-title`}
                            className="text-sm font-semibold text-white/90 truncate flex-1"
                        >
                            {title}
                        </span>
                    </div>
                )}

                {/* DESKTOP HEADER — macOS style (unchanged behavior) */}
                {!isMobile && !isMaximized && (
                    <div
                        className={`window-header h-10 flex-none flex items-center justify-between px-3 cursor-grab active:cursor-grabbing border-b select-none
                            ${isActive
                                ? 'bg-gradient-to-r from-cyan-950/40 via-slate-900/20 to-transparent border-white/[0.06]'
                                : 'bg-white/[0.02] border-white/[0.04]'
                            }
                        `}
                        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
                        onDoubleClick={() => toggleMaximize(id)}
                    >
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); closeWindow(id); }}
                                aria-label="Close Window"
                                className="w-3.5 h-3.5 rounded-full bg-[#ff5f57] hover:brightness-110 transition-all flex items-center justify-center group"
                                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)' }}
                            >
                                <X size={8} className="opacity-0 group-hover:opacity-100 text-[#4a0002] transition-opacity" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); minimizeWindow(id); }}
                                aria-label="Minimize Window"
                                className="w-3.5 h-3.5 rounded-full bg-[#febc2e] hover:brightness-110 transition-all flex items-center justify-center group"
                                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)' }}
                            >
                                <Minus size={8} className="opacity-0 group-hover:opacity-100 text-[#5c4700] transition-opacity" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleMaximize(id); }}
                                aria-label="Toggle Maximize"
                                className="w-3.5 h-3.5 rounded-full bg-[#28c840] hover:brightness-110 transition-all flex items-center justify-center group"
                                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)' }}
                            >
                                <Maximize2 size={7} className="opacity-0 group-hover:opacity-100 text-[#006500] transition-opacity" />
                            </button>
                        </div>
                        <span 
                            id={`${id}-title`}
                            className={`text-[11px] font-semibold tracking-wide truncate max-w-[250px] ${isActive ? 'text-white/80' : 'text-white/30'}`}
                        >
                            {title}
                        </span>
                        <div className="w-[56px]" />
                    </div>
                )}

                {/* Content */}
                <div className={`flex-1 w-full h-full overflow-auto relative scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent ${(isDragging || isResizing) ? 'pointer-events-none' : ''}`}>
                    {children}
                </div>

                {/* Resize Handle — hidden on mobile */}
                {!isMaximized && !isMobile && (
                    <div
                        onMouseDown={handleResizeStart}
                        className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-50 flex items-end justify-end p-1 group"
                    >
                        <svg width="10" height="10" viewBox="0 0 10 10" className="text-white/15 group-hover:text-cyan-400/60 transition-colors">
                            <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1" />
                            <line x1="8" y1="5" x2="5" y2="8" stroke="currentColor" strokeWidth="1" />
                            <line x1="8" y1="8" x2="8" y2="8" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                    </div>
                )}
            </div>
        </Draggable>
    );
}
