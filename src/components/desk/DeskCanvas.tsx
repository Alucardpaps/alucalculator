'use client';

/**
 * 🎨 CREATIVE DESK CANVAS
 * 
 * A simplified canvas for sticky notes, images, and freehand sketching.
 * distinct from the Engineering CAD canvas.
 */

import React, { useRef, useEffect } from 'react';

export function DeskCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Simple render loop for now
        const render = () => {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Gradient Background
            const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            grad.addColorStop(0, '#fdfbf7'); // Paper-like top left
            grad.addColorStop(1, '#e2e2e2'); // Slightly darker bottom right

            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Grid (Dot pattern)
            ctx.fillStyle = '#ccc';
            for (let x = 0; x < canvas.width; x += 40) {
                for (let y = 0; y < canvas.height; y += 40) {
                    ctx.beginPath();
                    ctx.arc(x, y, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Placeholder Text
            ctx.fillStyle = '#9c27b0';
            ctx.font = 'bold 24px sans-serif';
            ctx.fillText("Creative Desk Mode", 50, 50);
            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#666';
            ctx.fillText("Double-click to add a note", 50, 80);
        };

        window.addEventListener('resize', render);
        render();

        return () => window.removeEventListener('resize', render);
    }, []);

    return (
        <div className="w-full h-full relative overflow-hidden bg-[#fdfbf7]">
            <canvas ref={canvasRef} className="block" />
        </div>
    );
}
