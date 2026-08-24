'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Shield, Zap, RefreshCw, Maximize2, Minimize2, Play, Pause, Volume2, VolumeX } from 'lucide-react';

const ENGINEERING_GLYPHS = [
    'Σ', 'Δ', 'Ω', 'π', 'σ', 'τ', 'Φ', 'λ', 'μ', 'ε', 'θ', 'ω',
    '∫', '∂', '∇', '≈', '≠', '±', '√', '∞', '∝', '∠', '⊗', '⊕',
    '0', '1', '0', '1', '1', '0', 'A', 'L', 'U', 'C', 'A', 'L', 'C',
    'F=ma', 'E=mc²', 'σ=Eε', 'τ=Tr/J', 'PV=nRT', 'V=IR', 'P=VI'
];

export function MatrixScreensaverModule() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isRunning, setIsRunning] = useState(true);
    const [colorMode, setColorMode] = useState<'emerald' | 'cyan' | 'amber' | 'crimson'>('emerald');
    const [fontSize, setFontSize] = useState(15);
    const [fps, setFps] = useState(60);
    const [density, setDensity] = useState<'normal' | 'dense' | 'light'>('normal');

    const colorPalette = {
        emerald: { head: '#a7f3d0', body: '#10b981', glow: '#059669', bg: 'rgba(5, 10, 8, 0.08)' },
        cyan: { head: '#cffafe', body: '#06b6d4', glow: '#0891b2', bg: 'rgba(4, 12, 18, 0.08)' },
        amber: { head: '#fef3c7', body: '#f59e0b', glow: '#d97706', bg: 'rgba(18, 12, 4, 0.08)' },
        crimson: { head: '#fecdd3', body: '#f43f5e', glow: '#e11d48', bg: 'rgba(18, 4, 8, 0.08)' },
    }[colorMode];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let frameCount = 0;
        let lastFpsUpdate = performance.now();

        // Resize
        const resizeCanvas = () => {
            if (!canvas.parentElement) return;
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const columns = Math.floor(canvas.width / fontSize);
        const drops: number[] = [];
        const dropSpeeds: number[] = [];

        for (let i = 0; i < columns; i++) {
            drops[i] = Math.floor(Math.random() * -50);
            dropSpeeds[i] = Math.random() * 0.6 + 0.7;
        }

        // Draw Loop
        const render = (time: number) => {
            if (!isRunning) {
                animationFrameId = requestAnimationFrame(render);
                return;
            }

            frameCount++;
            if (time - lastFpsUpdate >= 1000) {
                setFps(Math.round((frameCount * 1000) / (time - lastFpsUpdate)));
                frameCount = 0;
                lastFpsUpdate = time;
            }

            ctx.fillStyle = colorPalette.bg;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = `bold ${fontSize}px "JetBrains Mono", "Courier New", monospace`;

            const stepChance = density === 'dense' ? 0.98 : density === 'light' ? 0.85 : 0.95;

            for (let i = 0; i < drops.length; i++) {
                if (Math.random() > stepChance && drops[i] > 0) {
                    continue;
                }

                const char = ENGINEERING_GLYPHS[Math.floor(Math.random() * ENGINEERING_GLYPHS.length)];
                const x = i * fontSize;
                const y = drops[i] * fontSize;

                ctx.shadowBlur = 8;
                ctx.shadowColor = colorPalette.glow;
                ctx.fillStyle = colorPalette.head;
                ctx.fillText(char, x, y);

                if (drops[i] > 1) {
                    ctx.shadowBlur = 3;
                    ctx.fillStyle = colorPalette.body;
                    ctx.fillText(char, x, y - fontSize);
                }

                if (y > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                    dropSpeeds[i] = Math.random() * 0.6 + 0.7;
                }
                drops[i] += dropSpeeds[i];
            }

            ctx.shadowBlur = 0;
            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isRunning, colorMode, fontSize, density, colorPalette]);

    return (
        <div className="relative w-full h-full bg-[#030609] overflow-hidden flex flex-col font-mono select-none">
            <div className="relative flex-1 w-full h-full overflow-hidden">
                <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

                {/* HUD */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs text-slate-300 shadow-xl">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                        <span className="font-bold tracking-widest uppercase text-[10px] text-white">ALUCALC OS // MATRIX ENGINE</span>
                    </div>
                    <div className="h-3 w-[1px] bg-white/20" />
                    <div className="text-[10px] font-mono text-emerald-400">
                        FPS: <span className="font-bold">{fps}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-black/70 backdrop-blur-lg p-2 rounded-2xl border border-white/10 shadow-2xl">
                    <button
                        onClick={() => setIsRunning(!isRunning)}
                        className={`p-2 rounded-xl border transition-all ${
                            isRunning 
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30' 
                                : 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30'
                        }`}
                        title={isRunning ? 'Pause Stream' : 'Resume Stream'}
                    >
                        {isRunning ? <Pause size={14} /> : <Play size={14} />}
                    </button>

                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setColorMode('emerald')}
                            className={`w-5 h-5 rounded-lg transition-all ${colorMode === 'emerald' ? 'ring-2 ring-emerald-400 scale-110' : 'opacity-60 hover:opacity-100'}`}
                            style={{ backgroundColor: '#10b981' }}
                            title="Matrix Green"
                        />
                        <button
                            onClick={() => setColorMode('cyan')}
                            className={`w-5 h-5 rounded-lg transition-all ${colorMode === 'cyan' ? 'ring-2 ring-cyan-400 scale-110' : 'opacity-60 hover:opacity-100'}`}
                            style={{ backgroundColor: '#06b6d4' }}
                            title="Cyber Cyan"
                        />
                        <button
                            onClick={() => setColorMode('amber')}
                            className={`w-5 h-5 rounded-lg transition-all ${colorMode === 'amber' ? 'ring-2 ring-amber-400 scale-110' : 'opacity-60 hover:opacity-100'}`}
                            style={{ backgroundColor: '#f59e0b' }}
                            title="Amber Phosphor"
                        />
                        <button
                            onClick={() => setColorMode('crimson')}
                            className={`w-5 h-5 rounded-lg transition-all ${colorMode === 'crimson' ? 'ring-2 ring-rose-400 scale-110' : 'opacity-60 hover:opacity-100'}`}
                            style={{ backgroundColor: '#f43f5e' }}
                            title="Crimson Alert"
                        />
                    </div>

                    <button
                        onClick={() => setDensity(d => d === 'normal' ? 'dense' : d === 'dense' ? 'light' : 'normal')}
                        className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-300 transition-all"
                    >
                        {density}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MatrixScreensaverModule;
