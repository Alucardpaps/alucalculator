'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useOSStore, OSWindow } from '@/store/osStore';
import { X, Minus, Maximize2, PanelLeft, PanelRight } from 'lucide-react';

interface DraggableWindowProps {
    window: OSWindow;
    children: React.ReactNode;
}

// Map ModuleType to Dictionary Key
const MODULE_KEY_MAP: Record<string, string> = {
    'profile-weight': 'aluminum',
    'fits-tolerances': 'fits',
    'gears-bearings': 'gears',
    'mohr-stress': 'strength',
    'bearings': 'bearings',
    'welding': 'welding',
    'sheet-metal': 'sheetMetal',
    'pumps': 'pumps',
    'fasteners': 'fasteners',
    'unit-converter': 'converter',
    'handbook': 'handbook',
    // Civil
    'beam-deflection': 'simulation',
    // Finance
    'vat-calculator': 'vat',
    // Software
    'json-formatter': 'json',
    // Nesting
    'nesting-2d': 'nesting2d',
    'cutting-optimizer': 'nesting'
};

/**
 * DraggableWindow - Resizable, focusable window component
 * CAD-style glassmorphism design
 */
export function DraggableWindow({ window, children }: DraggableWindowProps) {
    const {
        closeWindow,
        focusWindow,
        minimizeWindow,
        toggleMaximize,
        snapWindow,
        updateWindowPosition,
        updateWindowSize,
        activeWindowId,
        isFocusMode,
        dictionary
    } = useOSStore();

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const windowRef = useRef<HTMLDivElement>(null);

    const isActive = activeWindowId === window.id;

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(globalThis.innerWidth < 768);
        checkMobile();
        globalThis.addEventListener('resize', checkMobile);
        return () => globalThis.removeEventListener('resize', checkMobile);
    }, []);

    const isFullyMaximized = window.maximized === true || isMobile;
    const isSnapped = window.maximized === 'left' || window.maximized === 'right';
    const isExpanded = isFullyMaximized || isSnapped;

    // Resolve title from dictionary
    let title = window.title;
    if (dictionary) {
        const key = MODULE_KEY_MAP[window.type] || window.type;
        const translated = dictionary?.modules?.[key]?.title
            || dictionary?.[key]?.title;

        if (window.type === 'beam-deflection' && dictionary?.aluminum?.simulation?.title) {
            title = dictionary.aluminum.simulation.title;
        } else if (translated) {
            title = translated;
        }
    }

    // Handle drag start
    const handleDragStart = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        if (isExpanded) return; // Disable drag when maximized or snapped

        e.preventDefault();
        focusWindow(window.id);
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - window.position.x,
            y: e.clientY - window.position.y
        });
    }, [window.id, window.position, focusWindow, isExpanded]);

    // Handle resize start
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        if (isExpanded) return; // Disable resize when maximized or snapped
        e.preventDefault();
        e.stopPropagation();
        focusWindow(window.id);
        setIsResizing(true);
    }, [window.id, focusWindow, isExpanded]);

    // Mouse move handler
    useEffect(() => {
        if (!isDragging && !isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, globalThis.innerWidth - 100));
                const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, globalThis.innerHeight - 50));
                updateWindowPosition(window.id, { x: newX, y: newY });
            }

            if (isResizing && windowRef.current) {
                const rect = windowRef.current.getBoundingClientRect();
                const newWidth = Math.max(300, e.clientX - rect.left);
                const newHeight = Math.max(200, e.clientY - rect.top);
                updateWindowSize(window.id, { width: newWidth, height: newHeight });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, dragOffset, window.id, updateWindowPosition, updateWindowSize]);

    // Window Styles based on state
    let computedLeft: string | number = window.position.x;
    let computedTop: string | number = window.position.y;
    let computedWidth: string | number = window.size.width;
    let computedHeight: string | number = window.size.height;

    if (isFullyMaximized) {
        computedLeft = 0;
        computedTop = 0;
        computedWidth = '100%';
        computedHeight = isMobile ? 'calc(100% - 85px)' : '100%';
    } else if (window.maximized === 'left') {
        computedLeft = 0;
        computedTop = 0;
        computedWidth = '50%';
        computedHeight = '100%';
    } else if (window.maximized === 'right') {
        computedLeft = '50%';
        computedTop = 0;
        computedWidth = '50%';
        computedHeight = '100%';
    }

    const windowStyle: React.CSSProperties = {
        left: computedLeft,
        top: computedTop,
        width: computedWidth,
        height: computedHeight,
        zIndex: window.zIndex,
        transition: isExpanded ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'all 0.2s ease-out',
        opacity: (isFocusMode && !isActive) ? 0.2 : 1,
        filter: (isFocusMode && !isActive) ? 'saturate(0) blur(2px)' : 'none',
    };

    return (
        <div
            ref={windowRef}
            className={`absolute select-none ${isExpanded ? 'rounded-none' : 'rounded-lg'}`}
            style={windowStyle}
            onPointerDownCapture={() => focusWindow(window.id)}
        >
            {/* Window Container */}
            <div
                className={`w-full h-full flex flex-col overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.6)] ${isExpanded ? 'rounded-none border-none' : 'rounded-xl'}`}
                style={{
                    backgroundColor: 'rgba(5, 9, 14, 0.85)',
                    border: isExpanded ? 'none' : `1px solid ${isActive ? 'rgba(0, 229, 255, 0.4)' : 'rgba(0, 229, 255, 0.1)'}`,
                    backdropFilter: 'blur(24px)',
                    boxShadow: isActive && !isExpanded
                        ? '0 10px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 229, 255, 0.1)'
                        : '0 10px 40px rgba(0, 0, 0, 0.4)',
                }}
            >
                {/* Header (Auto-Hides if Maximized) */}
                <div
                    className={`flex items-center justify-between px-4 cursor-move shrink-0 border-cyan-900/30 transition-all duration-300 ${isExpanded ? 'absolute top-0 left-0 right-0 z-50 h-2 opacity-0 hover:h-10 hover:opacity-100 hover:bg-black/80 backdrop-blur border-b' : 'relative h-9 border-b bg-black/40 opacity-100'}`}
                    onMouseDown={handleDragStart}
                >
                    <span
                        className={`text-[10px] text-[#00e5ff] font-mono tracking-widest uppercase truncate font-bold drop-shadow-md ${isExpanded ? 'opacity-0 transition-opacity duration-300 group-hover:opacity-100' : ''}`}
                        style={isExpanded ? { opacity: 'inherit' } : undefined}
                    >
                        {title}
                    </span>

                    <div className="flex items-center gap-1.5" style={isExpanded ? { opacity: 'inherit' } : undefined}>
                        <button
                            onClick={() => minimizeWindow(window.id)}
                            className="p-1 rounded-full flex items-center justify-center transition-colors hover:bg-cyan-900/30 text-cyan-900/80 hover:text-cyan-400"
                        >
                            <Minus size={12} />
                        </button>
                        <button
                            onClick={() => toggleMaximize(window.id)}
                            className="p-1 rounded-full flex items-center justify-center transition-colors hover:bg-cyan-900/30 text-cyan-900/80 hover:text-cyan-400"
                        >
                            <Maximize2 size={12} className={isFullyMaximized ? 'rotate-180 scale-75' : ''} />
                        </button>
                        {!isMobile && (
                            <>
                                <button
                                    onClick={() => snapWindow(window.id, 'left')}
                                    className={`p-1 rounded-full flex items-center justify-center transition-colors hover:bg-cyan-900/30 ${window.maximized === 'left' ? 'text-cyan-400 bg-cyan-900/30' : 'text-cyan-900/80 hover:text-cyan-400'}`}
                                >
                                    <PanelLeft size={12} />
                                </button>
                                <button
                                    onClick={() => snapWindow(window.id, 'right')}
                                    className={`p-1 rounded-full flex items-center justify-center transition-colors hover:bg-cyan-900/30 ${window.maximized === 'right' ? 'text-cyan-400 bg-cyan-900/30' : 'text-cyan-900/80 hover:text-cyan-400'}`}
                                >
                                    <PanelRight size={12} />
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => closeWindow(window.id)}
                            className="p-1 rounded-full flex items-center justify-center transition-colors hover:bg-red-900/30 text-cyan-900/80 hover:text-red-400"
                        >
                            <X size={12} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div
                    className={`flex-1 overflow-auto bg-transparent text-cyan-50 ${isExpanded ? 'p-0' : 'p-4'}`}
                >
                    {children}
                </div>

                {/* Resize Handle */}
                {!isExpanded && (
                    <div
                        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                        onMouseDown={handleResizeStart}
                        style={{
                            background: 'linear-gradient(135deg, transparent 50%, var(--color-os-border) 50%)',
                        }}
                    />
                )}
            </div>
        </div>
    );
}
