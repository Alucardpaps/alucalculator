'use client';

import React, { useEffect, useState } from 'react';

/**
 * AutoCAD-Style Crosshair Cursor
 * 
 * Provides a fullscreen crosshair that follows the mouse, 
 * giving that high-precision engineering workstation feel.
 */
export const AutoCADCrosshair: React.FC = () => {
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setPos({ x: e.clientX, y: e.clientY });
            // Only show if the target is something relevant or just always in Desk mode
            setVisible(true);
        };

        const handleMouseLeave = () => setVisible(false);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {/* Horizontal Line */}
            <div 
                className="absolute left-0 right-0 h-[1px] bg-cyan-500/20 shadow-[0_0_5px_rgba(0,229,255,0.2)]"
                style={{ top: pos.y }}
            />
            {/* Vertical Line */}
            <div 
                className="absolute top-0 bottom-0 w-[1px] bg-cyan-500/20 shadow-[0_0_5px_rgba(0,229,255,0.2)]"
                style={{ left: pos.x }}
            />
            {/* Center Aperture */}
            <div 
                className="absolute w-4 h-4 border border-cyan-500/40 -translate-x-1/2 -translate-y-1/2"
                style={{ left: pos.x, top: pos.y }}
            />
            {/* Coordinate Label */}
            <div 
                className="absolute text-[9px] text-cyan-500/60 font-mono translate-x-4 translate-y-4"
                style={{ left: pos.x, top: pos.y }}
            >
                {pos.x}, {pos.y}
            </div>
        </div>
    );
};
