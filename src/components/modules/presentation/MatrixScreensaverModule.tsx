'use client';

import React, { useEffect, useRef } from 'react';
import { useOSStore } from '@/store/osStore';

export function MatrixScreensaverModule() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { isChaosMode } = useOSStore();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Make canvas full screen inside the module
        const resize = () => {
            canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
            canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Engineering/Math character array
        const chars = 'ΣM=0 τ=Gγ E=mc² α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ τ υ φ χ ψ ω 0 1 2 3 4 5 6 7 8 9 Alu-6061 T6 7075 Yield ∇ ∫ ∬ ∭ ∮ ∯ ∰ ∴ ∵'.split(' ');

        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops: number[] = [];

        // Initialize drop positions
        for (let x = 0; x < columns; x++) {
            drops[x] = 1;
        }

        const draw = () => {
            // Translucent black background to create fading trail effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Chaos mode = red, normal = classic matrix green
            ctx.fillStyle = isChaosMode ? '#ef4444' : '#0F0';
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                // Sending the drop back to the top randomly after it has crossed the screen
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 33); // ~30fps

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', resize);
        };
    }, [isChaosMode]);

    return (
        <div className="w-full h-full bg-black overflow-hidden relative">
            <div className="absolute top-4 left-4 z-10 text-[10px] font-mono opacity-50 text-green-500 pointer-events-none">
                [SYSTEM STANDBY / DATA STREAM ACTIVE]
            </div>
            <canvas ref={canvasRef} className="block w-full h-full" />
        </div>
    );
}
