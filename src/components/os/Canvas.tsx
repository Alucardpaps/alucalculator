'use client';

import { useState, useRef, useEffect } from 'react';
import { useOSStore } from '@/store/osStore';

interface CanvasProps {
    children: React.ReactNode;
}

/**
 * THE CANVAS
 * An infinite 2D engineering workspace.
 * Supports Panning (Middle Mouse / Space + Drag) and Zooming (Wheel).
 */
export function Canvas({ children }: CanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            const newScale = Math.min(Math.max(transform.scale + delta, 0.1), 5);
            setTransform(prev => ({ ...prev, scale: newScale }));
        } else {
            // Pan with scroll if not zooming? Maybe not standard.
            // Let's stick to standard pan: Space+Drag or Middle Click
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // Middle mouse (button 1) or Spacebar held (needs global state for space, simplified to middle mouse or alt-click)
        if (e.button === 1 || e.altKey) {
            e.preventDefault();
            setIsDragging(true);
            setLastMouse({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            const dx = e.clientX - lastMouse.x;
            const dy = e.clientY - lastMouse.y;
            setTransform(prev => ({
                ...prev,
                x: prev.x + dx,
                y: prev.y + dy
            }));
            setLastMouse({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Prevent default browser zoom
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const preventDefault = (e: Event) => e.preventDefault();

        // We can't passively block wheel on React event, need native
        container.addEventListener('wheel', preventDefault, { passive: false });
        return () => container.removeEventListener('wheel', preventDefault);
    }, []);

    return (
        <div
            ref={containerRef}
            className="w-full h-full overflow-hidden relative bg-[#1e1e1e] cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            {/* Grid Pattern */}
            <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, #444 1px, transparent 1px),
                        linear-gradient(to bottom, #444 1px, transparent 1px)
                    `,
                    backgroundSize: `${20 * transform.scale}px ${20 * transform.scale}px`,
                    transform: `translate(${transform.x % (20 * transform.scale)}px, ${transform.y % (20 * transform.scale)}px)`
                }}
            />

            {/* Major Grid */}
            <div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, #888 1px, transparent 1px),
                        linear-gradient(to bottom, #888 1px, transparent 1px)
                    `,
                    backgroundSize: `${100 * transform.scale}px ${100 * transform.scale}px`,
                    transform: `translate(${transform.x % (100 * transform.scale)}px, ${transform.y % (100 * transform.scale)}px)`
                }}
            />

            {/* Content Container */}
            <div
                className="absolute inset-0 origin-top-left"
                style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
                }}
            >
                {children}
            </div>

            {/* Canvas Controls */}
            <div className="absolute bottom-4 right-4 flex gap-2">
                <div className="bg-black/50 text-white px-2 py-1 rounded text-xs font-mono">
                    {Math.round(transform.scale * 100)}%
                </div>
                <div className="bg-black/50 text-white px-2 py-1 rounded text-xs font-mono">
                    {Math.round(transform.x)}, {Math.round(transform.y)}
                </div>
            </div>
        </div>
    );
}
