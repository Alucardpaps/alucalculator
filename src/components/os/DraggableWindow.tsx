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

        e.preventDefault();
        focusWindow(window.id);
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - window.position.x,
            y: e.clientY - window.position.y
        });
    }, [window.id, window.position, focusWindow]);

    // Handle resize start
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        focusWindow(window.id);
        setIsResizing(true);
    }, [window.id, focusWindow]);

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

    return (
        <div
            ref={windowRef}
            className="absolute select-none"
            style={{
                left: window.position.x,
                top: window.position.y,
                width: window.size.width,
                height: window.size.height,
                zIndex: window.zIndex,
            }}
            onMouseDown={() => focusWindow(window.id)}
        >
            {/* Window Container */}
            <div
                className="w-full h-full flex flex-col rounded-lg overflow-hidden shadow-2xl"
                style={{
                    backgroundColor: 'var(--color-os-panel)',
                    border: `1px solid ${isActive ? 'var(--color-os-accent)' : 'var(--color-os-border)'}`,
                    backdropFilter: 'blur(12px)',
                    boxShadow: isActive
                        ? '0 0 30px rgba(0, 229, 255, 0.15), 0 20px 60px rgba(0, 0, 0, 0.5)'
                        : '0 10px 40px rgba(0, 0, 0, 0.4)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-3 h-9 cursor-move shrink-0"
                    style={{ backgroundColor: 'var(--color-os-header)' }}
                    onMouseDown={handleDragStart}
                >
                    <span
                        className="text-xs font-medium truncate"
                        style={{ color: 'var(--color-os-text-primary)' }}
                    >
                        {title}
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => minimizeWindow(window.id)}
                            className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-white/10"
                            style={{ color: 'var(--color-os-text-secondary)' }}
                        >
                            <Minus size={12} />
                        </button>
                        <button
                            className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-white/10"
                            style={{ color: 'var(--color-os-text-secondary)' }}
                        >
                            <Maximize2 size={12} />
                        </button>
                        <button
                            onClick={() => closeWindow(window.id)}
                            className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-red-500/80"
                            style={{ color: 'var(--color-os-text-secondary)' }}
                        >
                            <X size={12} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div
                    className="flex-1 overflow-auto p-4"
                    style={{
                        backgroundColor: 'var(--color-os-panel)',
                        color: 'var(--color-os-text-primary)'
                    }}
                >
                    {children}
                </div>

                {/* Resize Handle */}
                <div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                    onMouseDown={handleResizeStart}
                    style={{
                        background: 'linear-gradient(135deg, transparent 50%, var(--color-os-border) 50%)',
                    }}
                />
            </div>
        </div>
    );
}
