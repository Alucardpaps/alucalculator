'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useOSStore, OSWindow } from '@/store/osStore';
import { X, Minus, Maximize2 } from 'lucide-react';

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
        updateWindowPosition,
        updateWindowSize,
        activeWindowId,
        dictionary
    } = useOSStore();

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const windowRef = useRef<HTMLDivElement>(null);

    const isActive = activeWindowId === window.id;
    const isMaximized = window.maximized;

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
        if (isMaximized) return; // Disable drag when maximized

        e.preventDefault();
        focusWindow(window.id);
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - window.position.x,
            y: e.clientY - window.position.y
        });
    }, [window.id, window.position, focusWindow, isMaximized]);

    // Handle resize start
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        if (isMaximized) return; // Disable resize when maximized
        e.preventDefault();
        e.stopPropagation();
        focusWindow(window.id);
        setIsResizing(true);
    }, [window.id, focusWindow, isMaximized]);

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
    const windowStyle: React.CSSProperties = isMaximized
        ? {
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            zIndex: window.zIndex,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }
        : {
            left: window.position.x,
            top: window.position.y,
            width: window.size.width,
            height: window.size.height,
            zIndex: window.zIndex,
            transition: 'all 0.2s ease-out',
        };

    return (
        <div
            ref={windowRef}
            className={`absolute select-none ${isMaximized ? 'rounded-none' : 'rounded-lg'}`}
            style={windowStyle}
            onMouseDown={() => focusWindow(window.id)}
        >
            {/* Window Container */}
            <div
                className={`w-full h-full flex flex-col overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.6)] ${isMaximized ? 'rounded-none border-none' : 'rounded-xl'}`}
                style={{
                    backgroundColor: 'rgba(5, 9, 14, 0.85)',
                    border: isMaximized ? 'none' : `1px solid ${isActive ? 'rgba(0, 229, 255, 0.4)' : 'rgba(0, 229, 255, 0.1)'}`,
                    backdropFilter: 'blur(24px)',
                    boxShadow: isActive && !isMaximized
                        ? '0 10px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 229, 255, 0.1)'
                        : '0 10px 40px rgba(0, 0, 0, 0.4)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 h-9 cursor-move shrink-0 border-b border-cyan-900/30 bg-black/40"
                    onMouseDown={handleDragStart}
                >
                    <span
                        className="text-[10px] text-[#00e5ff] font-mono tracking-widest uppercase truncate font-bold drop-shadow-md"
                    >
                        {title}
                    </span>

                    <div className="flex items-center gap-1.5">
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
                            <Maximize2 size={12} className={isMaximized ? 'rotate-180 scale-75' : ''} />
                        </button>
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
                    className="flex-1 overflow-auto p-4 bg-transparent text-cyan-50"
                >
                    {children}
                </div>

                {/* Resize Handle */}
                {!isMaximized && (
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
