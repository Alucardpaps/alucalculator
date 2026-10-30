'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { SpringOutputs } from '@/data/mechanical/springStandards';
import { DimLine, FrameDefs, LegendPanel, useFrameIds } from './techframe-utils';
import { useI18nStore } from '@/store/i18nStore';
import { getSpringModuleStrings } from '@/locales/springModuleTranslations';

export type SpringViewMode = '3d' | '2d' | 'curve' | 'goodman';

export interface SpringBlueprintProps {
    spring: SpringOutputs;
    appliedForce?: number;
    onForceChange?: (force: number) => void;
    showLegend?: boolean;
    initialViewMode?: SpringViewMode;
}

export function SpringBlueprint({
    spring,
    appliedForce = 0,
    onForceChange,
    showLegend = true,
    initialViewMode = '3d',
}: SpringBlueprintProps) {
    const ids = useFrameIds('spring');
    const { language } = useI18nStore();
    const t = getSpringModuleStrings(language);
    const isExtension = spring.springKind === 'extension';
    const [viewMode, setViewMode] = useState<SpringViewMode>(initialViewMode);
    const [autoOscillate, setAutoOscillate] = useState(false);

    // Interactive deflection state (in mm)
    // Default nominal deflection: s2 (from working load F2) or s1
    const nominalDeflection = spring.s2 > 0 ? spring.s2 : spring.s1;
    const [interactiveDeflection, setInteractiveDeflection] = useState<number>(nominalDeflection);
    const [isDragging, setIsDragging] = useState(false);

    // Keep updated when nominal spring deflection changes from inputs
    useEffect(() => {
        if (!isDragging) {
            setInteractiveDeflection(spring.s2 > 0 ? spring.s2 : spring.s1);
        }
    }, [spring.s2, spring.s1, isDragging]);

    // Physics Animation Ref for Spring Rebound Oscillation
    const animFrameRef = useRef<number | null>(null);
    const reboundRef = useRef<{
        startTime: number;
        startDisp: number;
        targetDisp: number;
        omega: number;
        zeta: number;
    } | null>(null);

    const maxDefl = isExtension
        ? Math.max(spring.s_zul > 0 ? spring.s_zul : 30, spring.s2 > 0 ? spring.s2 * 1.5 : 40)
        : spring.sc;

    // Damped harmonic rebound motion
    const startRebound = useCallback((currentDefl: number, targetDefl: number) => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        const startTime = performance.now();
        reboundRef.current = {
            startTime,
            startDisp: currentDefl - targetDefl,
            targetDisp: targetDefl,
            omega: 24, // natural ringing frequency
            zeta: 0.16, // damping ratio
        };

        const tick = (now: number) => {
            if (!reboundRef.current) return;
            const dt = (now - reboundRef.current.startTime) / 1000;

            if (dt > 1.2) {
                setInteractiveDeflection(reboundRef.current.targetDisp);
                reboundRef.current = null;
                return;
            }

            const decay = Math.exp(-reboundRef.current.zeta * reboundRef.current.omega * dt);
            const omegaD = reboundRef.current.omega * Math.sqrt(1 - reboundRef.current.zeta * reboundRef.current.zeta);
            const disp = reboundRef.current.startDisp * decay * Math.cos(omegaD * dt);
            const currentVal = Math.max(0, Math.min(maxDefl, reboundRef.current.targetDisp + disp));
            setInteractiveDeflection(currentVal);

            animFrameRef.current = requestAnimationFrame(tick);
        };

        animFrameRef.current = requestAnimationFrame(tick);
    }, [maxDefl]);

    // Quick jump to landmark states
    const jumpToState = useCallback((targetDefl: number) => {
        setAutoOscillate(false);
        const boundedTarget = Math.max(0, Math.min(maxDefl, targetDefl));
        startRebound(interactiveDeflection, boundedTarget);
        if (onForceChange && spring.R > 0) {
            const nextF = isExtension ? (boundedTarget > 0 ? spring.F0 + boundedTarget * spring.R : 0) : boundedTarget * spring.R;
            onForceChange(Math.round(nextF));
        }
    }, [interactiveDeflection, maxDefl, spring.R, spring.F0, isExtension, startRebound, onForceChange]);

    // Auto-oscillation loop (simulating working cycle)
    useEffect(() => {
        if (!autoOscillate) return;
        let running = true;
        const startT = performance.now();
        const minS = Math.max(0, spring.s1);
        const maxS = Math.min(maxDefl * 0.95, spring.s2 > spring.s1 ? spring.s2 : spring.s1 * 1.5 + 5);

        const loop = (t: number) => {
            if (!running) return;
            const elapsed = (t - startT) / 1000;
            // Oscillate smoothly at ~1.6 Hz
            const phase = (Math.sin(elapsed * Math.PI * 2 * 1.6) + 1) / 2;
            const curS = minS + phase * (maxS - minS);
            setInteractiveDeflection(curS);
            animFrameRef.current = requestAnimationFrame(loop);
        };

        animFrameRef.current = requestAnimationFrame(loop);
        return () => {
            running = false;
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [autoOscillate, spring.s1, spring.s2, maxDefl]);

    // Drag Interaction Handlers
    const dragStartYRef = useRef<number>(0);
    const dragStartDeflectionRef = useRef<number>(0);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (autoOscillate) setAutoOscillate(false);
        if (reboundRef.current) reboundRef.current = null;
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        setIsDragging(true);
        dragStartYRef.current = e.clientY;
        dragStartDeflectionRef.current = interactiveDeflection;
    }, [autoOscillate, interactiveDeflection]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;
        const deltaPixels = e.clientY - dragStartYRef.current;
        const deltaMm = (isExtension ? -deltaPixels : deltaPixels) * 0.4;
        const nextDefl = Math.max(0, Math.min(maxDefl, dragStartDeflectionRef.current + deltaMm));
        setInteractiveDeflection(nextDefl);

        if (onForceChange && spring.R > 0) {
            const nextF = isExtension ? (nextDefl > 0 ? spring.F0 + nextDefl * spring.R : 0) : nextDefl * spring.R;
            onForceChange(Math.round(nextF));
        }
    }, [isDragging, maxDefl, isExtension, spring.R, spring.F0, onForceChange]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        setIsDragging(false);

        const targetDefl = spring.s2 > 0 ? spring.s2 : spring.s1;
        startRebound(interactiveDeflection, targetDefl);
    }, [isDragging, spring.s2, spring.s1, startRebound, interactiveDeflection]);

    // Mouse wheel support (incremental compression / expansion)
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        if (autoOscillate) setAutoOscillate(false);
        const step = -Math.sign(e.deltaY) * 1.5; // mm
        setInteractiveDeflection(prev => {
            const next = Math.max(0, Math.min(maxDefl, prev + step));
            if (onForceChange && spring.R > 0) {
                const nextF = isExtension ? (next > 0 ? spring.F0 + next * spring.R : 0) : next * spring.R;
                onForceChange(Math.round(nextF));
            }
            return next;
        });
    }, [autoOscillate, maxDefl, isExtension, spring.R, spring.F0, onForceChange]);

    // Double click to reset to nominal
    const handleDoubleClick = useCallback(() => {
        setAutoOscillate(false);
        startRebound(interactiveDeflection, spring.s2 > 0 ? spring.s2 : spring.s1);
    }, [interactiveDeflection, spring.s2, spring.s1, startRebound]);

    // Derived dynamic values
    const currentDeflection = Math.max(0, Math.min(maxDefl, interactiveDeflection));
    const currentLength = isExtension ? spring.L0 + currentDeflection : Math.max(spring.Lc, spring.L0 - currentDeflection);
    const currentForce = isExtension
        ? (currentDeflection > 0 ? spring.F0 + currentDeflection * spring.R : (spring.s1 > 0 ? spring.F1 : 0))
        : currentDeflection * spring.R;
    const currentTau = spring.kw * (8 * Math.max(spring.F0 || 0, currentForce) * spring.Dm) / (Math.PI * Math.pow(spring.d, 3));
    const stressRatio = spring.tauZul > 0 ? currentTau / spring.tauZul : 0;

    // DIN EN 13906-1 Dynamic Radial Expansion ΔDe under compression
    const deflRatio = spring.sc > 0 ? currentDeflection / spring.sc : 0;
    const currentDeltaDe = isExtension ? 0 : (spring.deltaDe_c * deflRatio);
    const currentDynamicDm = spring.Dm + currentDeltaDe;
    const currentDynamicDe = spring.De + currentDeltaDe;

    // Viewport & Dimension-driven Geometry Calculations
    const W = showLegend ? 770 : 610;
    const H = 420;
    const cx = showLegend ? 250 : 295;

    // Scale so that spring comfortably fits the viewport height
    const maxAvailableH = 260;
    const maxAvailableW = 200;
    const maxDisplayL = isExtension ? (spring.L0 + maxDefl * 0.8) : spring.L0;
    const scale = Math.min(
        maxAvailableH / Math.max(30, maxDisplayL),
        maxAvailableW / Math.max(15, spring.De * 1.1)
    );

    const springW = currentDynamicDm * scale;
    const wireR = Math.max(2.8, (spring.d / 2) * scale);
    const wireDiameterPx = wireR * 2;

    // Compression platen positions
    const bottomPlatenY = 350;
    const freeTopPlatenY = bottomPlatenY - spring.L0 * scale;
    const currentTopPlatenY = bottomPlatenY - currentLength * scale;

    // Extension pin & body positions
    const hookHeightPx = Math.max(20, (spring.LH || (spring.Di * 0.9)) * scale);
    const bottomPinY = 355;
    const bottomBodyY = bottomPinY - hookHeightPx;
    const bodyLengthPx = Math.max(wireDiameterPx * 2, (spring.Lk + currentDeflection) * scale);
    const currentTopBodyY = bottomBodyY - bodyLengthPx;
    const currentTopPinY = currentTopBodyY - hookHeightPx;
    const freeTopPinY = bottomPinY - spring.L0 * scale;

    const xLeft = cx - springW / 2;
    const xRight = cx + springW / 2;

    // Coil Generation per DIN 2089 with winding direction support
    const coils = Math.max(2, Math.round(spring.n));
    const pitchH = isExtension
        ? (bodyLengthPx / coils)
        : ((bottomPlatenY - currentTopPlatenY - 2 * wireDiameterPx) / coils);
    const isLeftHand = spring.windingDirection === 'left';

    interface CoilSegment {
        front: string;
        back: string;
        y: number;
    }

    const coilSegments: CoilSegment[] = useMemo(() => {
        const segs: CoilSegment[] = [];
        const startY = isExtension ? currentTopBodyY : (currentTopPlatenY + wireDiameterPx);

        for (let i = 0; i < coils; i++) {
            const yTop = startY + i * pitchH;
            const yMid = yTop + pitchH * 0.5;
            const yBot = yTop + pitchH;

            let back: string;
            let front: string;

            if (isLeftHand) {
                // Left Hand winding (LH)
                back = `M ${xRight} ${yTop} Q ${cx} ${yTop - pitchH * 0.22} ${xLeft} ${yMid}`;
                front = `M ${xLeft} ${yMid} Q ${cx} ${yBot + pitchH * 0.22} ${xRight} ${yBot}`;
            } else {
                // Right Hand winding (RH - Standard)
                back = `M ${xLeft} ${yTop} Q ${cx} ${yTop - pitchH * 0.22} ${xRight} ${yMid}`;
                front = `M ${xRight} ${yMid} Q ${cx} ${yBot + pitchH * 0.22} ${xLeft} ${yBot}`;
            }

            segs.push({ front, back, y: yTop });
        }
        return segs;
    }, [coils, pitchH, currentTopPlatenY, currentTopBodyY, isExtension, wireDiameterPx, xLeft, xRight, cx, isLeftHand]);

    // Dynamic Stress Color Gradient
    const stressColor = useMemo(() => {
        if (stressRatio > 1.0) return '#ef4444'; // Red
        if (stressRatio > 0.85) return '#f59e0b'; // Amber
        if (stressRatio > 0.5) return '#10b981'; // Emerald
        return '#00e5ff'; // Cyan
    }, [stressRatio]);

    // Extension Hook Geometry Paths (DIN 2097 Form A German Loop)
    const hookR = Math.max(8, springW * 0.45);
    const bottomHookPath = useMemo(() => {
        if (!isExtension) return '';
        return `M ${xRight} ${bottomBodyY} C ${xRight} ${bottomBodyY + hookHeightPx * 0.4} ${cx + hookR} ${bottomPinY - hookHeightPx * 0.15} ${cx + hookR * 0.65} ${bottomPinY} A ${hookR * 0.65} ${hookHeightPx * 0.38} 0 0 1 ${cx - hookR * 0.65} ${bottomPinY} C ${cx - hookR * 0.65} ${bottomPinY - hookHeightPx * 0.3} ${cx - 3} ${bottomPinY - hookHeightPx * 0.55} ${cx} ${bottomPinY - hookHeightPx * 0.7}`;
    }, [isExtension, xRight, bottomBodyY, hookHeightPx, cx, hookR, bottomPinY]);

    const topHookPath = useMemo(() => {
        if (!isExtension) return '';
        return `M ${xLeft} ${currentTopBodyY} C ${xLeft} ${currentTopBodyY - hookHeightPx * 0.4} ${cx - hookR} ${currentTopPinY + hookHeightPx * 0.15} ${cx - hookR * 0.65} ${currentTopPinY} A ${hookR * 0.65} ${hookHeightPx * 0.38} 0 0 1 ${cx + hookR * 0.65} ${currentTopPinY} C ${cx + hookR * 0.65} ${currentTopPinY + hookHeightPx * 0.3} ${cx + 3} ${currentTopPinY + hookHeightPx * 0.55} ${cx} ${currentTopPinY + hookHeightPx * 0.7}`;
    }, [isExtension, xLeft, currentTopBodyY, hookHeightPx, cx, hookR, currentTopPinY]);

    return (
        <div
            className="w-full h-full relative select-none cursor-grab active:cursor-grabbing font-mono text-slate-300"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
            title={t.dragHint}
        >
            {/* Top Navigation & View Mode Selector */}
            <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-[var(--bg-1)] p-1 rounded-lg border border-[var(--line)] text-[10px]">
                    <button
                        type="button"
                        onClick={() => setViewMode('3d')}
                        className={`px-2.5 py-1 rounded transition-colors ${viewMode === '3d' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'}`}
                    >
                        {t.view3D}
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('2d')}
                        className={`px-2.5 py-1 rounded transition-colors ${viewMode === '2d' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'}`}
                    >
                        {t.view2D}
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('curve')}
                        className={`px-2.5 py-1 rounded transition-colors ${viewMode === 'curve' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'}`}
                    >
                        {t.viewFs}
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('goodman')}
                        className={`px-2.5 py-1 rounded transition-colors ${viewMode === 'goodman' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40' : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'}`}
                    >
                        {t.viewGoodman}
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => setAutoOscillate(v => !v)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border transition-all flex items-center gap-1.5 ${autoOscillate ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse' : 'bg-[var(--bg-1)] border-[var(--line)] text-[var(--alu-dim)] hover:text-[var(--ink)]'}`}
                >
                    <span className={`w-2 h-2 rounded-full ${autoOscillate ? 'bg-amber-400' : 'bg-slate-500'}`} />
                    {autoOscillate ? t.dynamicOscillating : t.vibrationTest}
                </button>
            </div>

            {/* Quick-Jump Landmark State Buttons */}
            <div className="absolute top-12 left-3 z-20 flex items-center gap-1.5 bg-[var(--bg-1)] px-2 py-1 rounded-md border border-[var(--line)] text-[9px]">
                <span className="text-[var(--alu-dim)] uppercase tracking-widest text-[8px] font-bold mr-1">{t.position}:</span>
                <button
                    type="button"
                    onClick={() => jumpToState(0)}
                    className="px-1.5 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] hover:bg-cyan-500/20 hover:text-cyan-300 text-[var(--ink)] transition-colors"
                    title={`${t.freeLength} L0`}
                >
                    L₀ ({spring.L0.toFixed(0)} mm)
                </button>
                <button
                    type="button"
                    onClick={() => jumpToState(spring.s1)}
                    className="px-1.5 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] hover:bg-cyan-500/20 hover:text-cyan-300 text-[var(--ink)] transition-colors"
                    title={`${t.preloadedLength} L1 (${Math.round(spring.F1)} N)`}
                >
                    L₁ ({spring.L1.toFixed(0)} mm)
                </button>
                <button
                    type="button"
                    onClick={() => jumpToState(spring.s2)}
                    className="px-1.5 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] hover:bg-amber-500/20 hover:text-amber-300 text-[var(--ink)] transition-colors font-bold"
                    title={`${t.workingLength} L2 (${Math.round(spring.F2)} N)`}
                >
                    L₂ ({spring.L2.toFixed(0)} mm)
                </button>
                {isExtension ? (
                    <button
                        type="button"
                        onClick={() => jumpToState(spring.s_zul > 0 ? spring.s_zul : spring.s2 * 1.2)}
                        className="px-1.5 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] hover:bg-red-500/20 hover:text-red-300 text-[var(--ink)] transition-colors font-bold"
                        title={`${t.maxPermissibleStroke} (${Math.round(spring.F_zul)} N)`}
                    >
                        Lzul ({(spring.L0 + (spring.s_zul > 0 ? spring.s_zul : spring.s2 * 1.2)).toFixed(0)} mm)
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => jumpToState(spring.sc)}
                        className="px-1.5 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] hover:bg-red-500/20 hover:text-red-300 text-[var(--ink)] transition-colors"
                        title={`${t.solidHeight} Lc (${Math.round(spring.Fc)} N)`}
                    >
                        Lc ({spring.Lc.toFixed(0)} mm)
                    </button>
                )}
            </div>

            {/* Live Tactile Stress HUD Badge */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-2 pointer-events-none">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-1)] border border-[var(--line)] text-[10px] shadow-xl text-[var(--ink)]">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stressColor }} />
                    <span className="font-bold" style={{ color: stressColor }}>
                        F = {Math.round(currentForce)} N
                    </span>
                    <span className="text-slate-500">|</span>
                    <span className="text-cyan-300 font-bold">δ = {currentDeflection.toFixed(1)} mm</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400">τ = {currentTau.toFixed(0)} MPa</span>
                    {currentDeltaDe > 0.05 && (
                        <>
                            <span className="text-slate-500">|</span>
                            <span className="text-emerald-400 font-mono text-[9px]">+ΔDe: {currentDeltaDe.toFixed(2)} mm</span>
                        </>
                    )}
                </div>
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
                <FrameDefs ids={ids} />
                <defs>
                    {/* Photorealistic 3D Cylindrical Chrome Wire Metallic Gradient */}
                    <linearGradient id="springChromeWire" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="15%" stopColor="#090d16" />
                        <stop offset="35%" stopColor="#475569" />
                        <stop offset="48%" stopColor="#e2e8f0" />
                        <stop offset="54%" stopColor="#ffffff" />
                        <stop offset="68%" stopColor={stressColor} />
                        <stop offset="90%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#080c14" />
                    </linearGradient>

                    {/* Shaded Depth Gradient for Back Wire in Shadow */}
                    <linearGradient id="springWireShadowBack" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0d1522" />
                        <stop offset="45%" stopColor="#070c14" />
                        <stop offset="100%" stopColor="#020408" />
                    </linearGradient>

                    {/* Compression Platen Industrial Steel Gradient */}
                    <linearGradient id="platenSteelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="25%" stopColor="#64748b" />
                        <stop offset="50%" stopColor="#cbd5e1" />
                        <stop offset="75%" stopColor="#475569" />
                        <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>

                    {/* Ground End Contact Polished Face */}
                    <linearGradient id="groundFlatFacetGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#334155" />
                        <stop offset="50%" stopColor="#94a3b8" />
                        <stop offset="100%" stopColor="#334155" />
                    </linearGradient>

                    {/* Cross-section hatching pattern for 2D technical drawing */}
                    <pattern id="wireHatch45" width="6" height="6" patternUnits="userSpaceOnUse">
                        <path d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2" stroke="#00e5ff" strokeWidth="0.9" opacity="0.6" />
                    </pattern>

                    {/* Inter-coil Drop Shadow for Volumetric Overlap */}
                    <filter id="coilInterShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4.5" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.85" />
                    </filter>

                    <filter id="springDropGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor={stressColor} floodOpacity={stressRatio > 0.9 ? 0.65 : 0.25} />
                    </filter>

                    <marker id="arrow-down" viewBox="0 0 10 10" refX="5" refY="8" markerWidth="6" markerHeight="6" orient="auto">
                        <path d="M 1 1 L 5 9 L 9 1 z" fill="#f59e0b" />
                    </marker>
                    <marker id="arrow-up" viewBox="0 0 10 10" refX="5" refY="2" markerWidth="6" markerHeight="6" orient="auto">
                        <path d="M 1 9 L 5 1 L 9 9 z" fill="#f59e0b" />
                    </marker>
                    <marker id="arrow-cad" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                        <path d="M 0 1 L 9 5 L 0 9 z" fill="#00e5ff" />
                    </marker>
                </defs>

                {/* Blueprint Background & Grid */}
                <rect width={W} height={H} fill="var(--bg-2)" stroke="var(--line)" rx="12" />
                <rect width={W} height={H} fill={`url(#${ids.grid})`} />

                {/* Engineering Title Block */}
                <g transform="translate(24, 28)">
                    <text x="0" y="0" fontSize="12" fontWeight="bold" fill="#00e5ff" letterSpacing="0.08em">
                        {isExtension ? 'DIN EN 13906-2 · HELICAL EXTENSION SPRING' : 'DIN EN 13906-1 · HELICAL COMPRESSION SPRING'}
                    </text>
                    <text x="0" y="14" fontSize="8.5" fill="#64748b">
                        d={spring.d} mm · Dm={spring.Dm} mm · L0={spring.L0} mm · n={spring.n} · C={spring.C.toFixed(1)} · {spring.windingDirection === 'left' ? t.coilingDirectionLeft : t.coilingDirectionRight}
                    </text>
                </g>

                {/* ═══ VIEW MODE: 3D VOLUMETRIC / 2D BLUEPRINT ═══ */}
                {(viewMode === '3d' || viewMode === '2d') && (
                    <g transform="translate(0, 0)">
                        {/* Centerline Axis (Eksen Çizgisi) */}
                        <line
                            x1={cx}
                            y1={isExtension ? (currentTopPinY - 45) : (currentTopPlatenY - 35)}
                            x2={cx}
                            y2={isExtension ? (bottomPinY + 35) : (bottomPlatenY + 30)}
                            stroke="#00e5ff"
                            strokeWidth="0.8"
                            strokeDasharray="10 4 2 4"
                            opacity="0.35"
                        />

                        {/* Free Length Reference Ghost Line */}
                        {isExtension ? (
                            currentLength > spring.L0 && (
                                <line
                                    x1={xLeft - 30}
                                    y1={freeTopPinY}
                                    x2={xRight + 30}
                                    y2={freeTopPinY}
                                    stroke="#64748b"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                    opacity="0.4"
                                />
                            )
                        ) : (
                            currentLength < spring.L0 && (
                                <line
                                    x1={xLeft - 30}
                                    y1={freeTopPlatenY}
                                    x2={xRight + 30}
                                    y2={freeTopPlatenY}
                                    stroke="#64748b"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                    opacity="0.4"
                                />
                            )
                        )}

                        {/* 1. Bottom End: Platen (Compression) OR Anchor Bracket + Hook (Extension) */}
                        {!isExtension ? (
                            <>
                                <g transform={`translate(0, ${bottomPlatenY})`}>
                                    <rect
                                        x={cx - springW / 2 - 35}
                                        y="0"
                                        width={springW + 70}
                                        height="16"
                                        rx="3"
                                        fill="url(#platenSteelGrad)"
                                        stroke="#475569"
                                        strokeWidth="1.2"
                                    />
                                    {/* Ground ISO Hatch Marks */}
                                    {[-30, -10, 10, 30].map(offset => (
                                        <line
                                            key={offset}
                                            x1={cx + offset - 8}
                                            y1="16"
                                            x2={cx + offset + 8}
                                            y2="25"
                                            stroke="#475569"
                                            strokeWidth="1.4"
                                        />
                                    ))}
                                </g>

                                {/* Ground Contact Flat Seat (Bottom) */}
                                {spring.endType === 'squared_ground' && (
                                    <rect
                                        x={xLeft}
                                        y={bottomPlatenY - 2}
                                        width={springW}
                                        height="3"
                                        fill="url(#groundFlatFacetGrad)"
                                        opacity="0.85"
                                    />
                                )}

                                {/* Bottom Ground Turn (Flat contact per DIN 2089) */}
                                <path
                                    d={`M ${xLeft} ${bottomPlatenY} L ${xRight} ${bottomPlatenY}`}
                                    stroke={viewMode === '3d' ? 'url(#springChromeWire)' : '#00e5ff'}
                                    strokeWidth={wireDiameterPx}
                                    strokeLinecap="round"
                                    opacity="0.95"
                                />
                            </>
                        ) : (
                            <>
                                {/* Bottom Anchor Lug & Pin per DIN 2097 */}
                                <g transform={`translate(${cx}, ${bottomPinY})`}>
                                    <path d="M -16 0 L -16 26 L 16 26 L 16 0 Z" fill="url(#platenSteelGrad)" stroke="#475569" strokeWidth="1.2" />
                                    {[-12, -4, 4, 12].map(offset => (
                                        <line key={offset} x1={offset - 4} y1="26" x2={offset + 4} y2="33" stroke="#475569" strokeWidth="1.4" />
                                    ))}
                                    <circle cx="0" cy="0" r={Math.max(6, wireR * 1.15)} fill="url(#platenSteelGrad)" stroke="#64748b" strokeWidth="1.4" />
                                    <circle cx="0" cy="0" r={Math.max(2.5, wireR * 0.45)} fill="var(--bg-2)" />
                                </g>

                                {/* Bottom German Hook Path */}
                                <path
                                    d={bottomHookPath}
                                    fill="none"
                                    stroke={viewMode === '3d' ? 'url(#springChromeWire)' : '#00e5ff'}
                                    strokeWidth={wireDiameterPx}
                                    strokeLinecap="round"
                                    filter={viewMode === '3d' ? 'url(#springDropGlow)' : undefined}
                                />
                                {viewMode === '3d' && (
                                    <path
                                        d={bottomHookPath}
                                        fill="none"
                                        stroke="#ffffff"
                                        strokeWidth={Math.max(1, wireDiameterPx * 0.18)}
                                        strokeOpacity="0.55"
                                        strokeLinecap="round"
                                    />
                                )}
                            </>
                        )}

                        {/* 2. Coils Rendering with Overlap Shadows & Specular Crown */}
                        {viewMode === '3d' ? (
                            <>
                                {/* Back Coils (In Deep Ambient Shadow) */}
                                {coilSegments.map((c, i) => (
                                    <path
                                        key={`back-${i}`}
                                        d={c.back}
                                        fill="none"
                                        stroke="url(#springWireShadowBack)"
                                        strokeWidth={wireDiameterPx}
                                        strokeLinecap="round"
                                        opacity="0.9"
                                    />
                                ))}

                                {/* Front Coils (Photorealistic Chrome Shading + Overlap Shadow) */}
                                {coilSegments.map((c, i) => (
                                    <g key={`front-${i}`}>
                                        {/* Drop shadow cast onto back coils */}
                                        <path
                                            d={c.front}
                                            fill="none"
                                            stroke="url(#springChromeWire)"
                                            strokeWidth={wireDiameterPx}
                                            strokeLinecap="round"
                                            filter="url(#coilInterShadow)"
                                        />
                                        {/* Core Metallic Body */}
                                        <path
                                            d={c.front}
                                            fill="none"
                                            stroke="url(#springChromeWire)"
                                            strokeWidth={wireDiameterPx}
                                            strokeLinecap="round"
                                            filter="url(#springDropGlow)"
                                        />
                                        {/* Specular Highlight Crest (Laser Sheen along crown) */}
                                        <path
                                            d={c.front}
                                            fill="none"
                                            stroke="#ffffff"
                                            strokeWidth={Math.max(1, wireDiameterPx * 0.18)}
                                            strokeOpacity="0.55"
                                            strokeLinecap="round"
                                        />
                                    </g>
                                ))}
                            </>
                        ) : (
                            /* 2D Engineering Blueprint (DIN ISO 2162-1 Section View) */
                            <g>
                                {coilSegments.map((c, i) => (
                                    <g key={`2d-wire-${i}`}>
                                        <path d={c.back} fill="none" stroke="#334155" strokeWidth="1.2" strokeDasharray="3 3" />
                                        <path d={c.front} fill="none" stroke="#00e5ff" strokeWidth="1.8" />
                                        <circle cx={xLeft} cy={c.y} r={wireR} fill="url(#wireHatch45)" stroke="#00e5ff" strokeWidth="1.2" />
                                        <circle cx={xRight} cy={c.y + pitchH * 0.5} r={wireR} fill="url(#wireHatch45)" stroke="#00e5ff" strokeWidth="1.2" />
                                    </g>
                                ))}
                            </g>
                        )}

                        {/* 3. Top End: Moving Platen (Compression) OR Pulling Shackle + Hook (Extension) */}
                        {!isExtension ? (
                            <>
                                {/* Top Ground Turn (Flat contact per DIN 2089) */}
                                <path
                                    d={`M ${xLeft} ${currentTopPlatenY + wireDiameterPx} L ${xRight} ${currentTopPlatenY + wireDiameterPx}`}
                                    stroke={viewMode === '3d' ? 'url(#springChromeWire)' : '#00e5ff'}
                                    strokeWidth={wireDiameterPx}
                                    strokeLinecap="round"
                                    opacity="0.95"
                                />

                                {/* Ground Contact Flat Seat (Top) */}
                                {spring.endType === 'squared_ground' && (
                                    <rect
                                        x={xLeft}
                                        y={currentTopPlatenY + wireDiameterPx - 1}
                                        width={springW}
                                        height="3"
                                        fill="url(#groundFlatFacetGrad)"
                                        opacity="0.85"
                                    />
                                )}

                                {/* Moving Top Platen (Baskı Pabuç Plakası) */}
                                <g transform={`translate(0, ${currentTopPlatenY - 14})`}>
                                    <rect
                                        x={cx - springW / 2 - 35}
                                        y="0"
                                        width={springW + 70}
                                        height="14"
                                        rx="3"
                                        fill="url(#platenSteelGrad)"
                                        stroke="#64748b"
                                        strokeWidth="1.2"
                                        filter="url(#springDropGlow)"
                                    />

                                    {/* Applied Dynamic Force Arrow F (Downward) */}
                                    <line
                                        x1={cx}
                                        y1="-32"
                                        x2={cx}
                                        y2="-4"
                                        stroke="#f59e0b"
                                        strokeWidth="3"
                                        markerEnd="url(#arrow-down)"
                                    />
                                    <text
                                        x={cx + 12}
                                        y="-14"
                                        fill="#f59e0b"
                                        fontSize="10"
                                        fontWeight="bold"
                                        fontFamily="monospace"
                                    >
                                        F = {Math.round(currentForce)} N
                                    </text>
                                </g>
                            </>
                        ) : (
                            <>
                                {/* Top German Hook Path */}
                                <path
                                    d={topHookPath}
                                    fill="none"
                                    stroke={viewMode === '3d' ? 'url(#springChromeWire)' : '#00e5ff'}
                                    strokeWidth={wireDiameterPx}
                                    strokeLinecap="round"
                                    filter={viewMode === '3d' ? 'url(#springDropGlow)' : undefined}
                                />
                                {viewMode === '3d' && (
                                    <path
                                        d={topHookPath}
                                        fill="none"
                                        stroke="#ffffff"
                                        strokeWidth={Math.max(1, wireDiameterPx * 0.18)}
                                        strokeOpacity="0.55"
                                        strokeLinecap="round"
                                    />
                                )}

                                {/* Pulling Clevis / Pin (Upward Tensile Pull) */}
                                <g transform={`translate(${cx}, ${currentTopPinY})`}>
                                    <circle cx="0" cy="0" r={Math.max(6, wireR * 1.15)} fill="url(#platenSteelGrad)" stroke="#64748b" strokeWidth="1.4" />
                                    <circle cx="0" cy="0" r={Math.max(2.5, wireR * 0.45)} fill="var(--bg-2)" />
                                    <path d="M -12 0 L -12 -16 L 12 -16 L 12 0" fill="none" stroke="#64748b" strokeWidth="2.5" />

                                    {/* Applied Dynamic Tensile Force Arrow F (Upward) */}
                                    <line
                                        x1="0"
                                        y1="-16"
                                        x2="0"
                                        y2="-44"
                                        stroke="#f59e0b"
                                        strokeWidth="3"
                                        markerEnd="url(#arrow-up)"
                                    />
                                    <text
                                        x="14"
                                        y="-28"
                                        fill="#f59e0b"
                                        fontSize="10"
                                        fontWeight="bold"
                                        fontFamily="monospace"
                                    >
                                        F = {Math.round(currentForce)} N
                                    </text>
                                </g>
                            </>
                        )}

                        {/* ═══ CAD DIMENSIONS & LEADERS ═══ */}
                        {/* Free Length L0 Leader (on right side) */}
                        <g transform={`translate(${cx + springW / 2 + 35}, 0)`}>
                            <line
                                x1="0"
                                y1={isExtension ? freeTopPinY : freeTopPlatenY}
                                x2="0"
                                y2={isExtension ? bottomPinY : bottomPlatenY}
                                stroke="#64748b"
                                strokeWidth="0.8"
                                markerStart="url(#arrow-cad)"
                                markerEnd="url(#arrow-cad)"
                            />
                            <line
                                x1="-8"
                                y1={isExtension ? freeTopPinY : freeTopPlatenY}
                                x2="12"
                                y2={isExtension ? freeTopPinY : freeTopPlatenY}
                                stroke="#64748b"
                                strokeWidth="0.7"
                            />
                            <line
                                x1="-8"
                                y1={isExtension ? bottomPinY : bottomPlatenY}
                                x2="12"
                                y2={isExtension ? bottomPinY : bottomPlatenY}
                                stroke="#64748b"
                                strokeWidth="0.7"
                            />
                            <text
                                x="16"
                                y={((isExtension ? freeTopPinY : freeTopPlatenY) + (isExtension ? bottomPinY : bottomPlatenY)) / 2 + 3}
                                fill="#64748b"
                                fontSize="8.5"
                                fontWeight="bold"
                            >
                                L₀ = {spring.L0} mm
                            </text>
                        </g>

                        {/* Working / Extended Length L Leader (on left side) */}
                        <g transform={`translate(${cx - springW / 2 - 40}, 0)`}>
                            <line
                                x1="0"
                                y1={isExtension ? currentTopPinY : currentTopPlatenY}
                                x2="0"
                                y2={isExtension ? bottomPinY : bottomPlatenY}
                                stroke="#00e5ff"
                                strokeWidth="1"
                                markerStart="url(#arrow-cad)"
                                markerEnd="url(#arrow-cad)"
                            />
                            <line
                                x1="-12"
                                y1={isExtension ? currentTopPinY : currentTopPlatenY}
                                x2="8"
                                y2={isExtension ? currentTopPinY : currentTopPlatenY}
                                stroke="#00e5ff"
                                strokeWidth="0.8"
                            />
                            <line
                                x1="-12"
                                y1={isExtension ? bottomPinY : bottomPlatenY}
                                x2="8"
                                y2={isExtension ? bottomPinY : bottomPlatenY}
                                stroke="#00e5ff"
                                strokeWidth="0.8"
                            />
                            <text
                                x="-16"
                                y={((isExtension ? currentTopPinY : currentTopPlatenY) + (isExtension ? bottomPinY : bottomPlatenY)) / 2 + 3}
                                textAnchor="end"
                                fill="#00e5ff"
                                fontSize="9"
                                fontWeight="bold"
                            >
                                L = {currentLength.toFixed(1)} mm
                            </text>
                            {currentDeflection > 0.5 && (
                                <text
                                    x="-16"
                                    y={((isExtension ? currentTopPinY : currentTopPlatenY) + (isExtension ? bottomPinY : bottomPlatenY)) / 2 + 15}
                                    textAnchor="end"
                                    fill="#f59e0b"
                                    fontSize="8"
                                >
                                    (δ = {currentDeflection.toFixed(1)})
                                </text>
                            )}
                        </g>

                        {/* Extension Body Length Lk Leader (if extension) */}
                        {isExtension && (
                            <g transform={`translate(${cx + springW / 2 + 15}, 0)`}>
                                <line x1="0" y1={currentTopBodyY} x2="0" y2={bottomBodyY} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 2" />
                                <text x="6" y={(currentTopBodyY + bottomBodyY) / 2 + 3} fill="#38bdf8" fontSize="8" fontWeight="bold">
                                    Lk = {spring.Lk.toFixed(1)}
                                </text>
                            </g>
                        )}

                        {/* Mean & Dynamic Outer Diameter Dimension (bottom leader) */}
                        <g transform={`translate(0, ${(isExtension ? bottomPinY : bottomPlatenY) + 38})`}>
                            <line x1={xLeft} y1="0" x2={xRight} y2="0" stroke="#00e5ff" strokeWidth="0.9" markerStart="url(#arrow-cad)" markerEnd="url(#arrow-cad)" />
                            <line x1={xLeft} y1="-10" x2={xLeft} y2="6" stroke="#00e5ff" strokeWidth="0.7" />
                            <line x1={xRight} y1="-10" x2={xRight} y2="6" stroke="#00e5ff" strokeWidth="0.7" />
                            <text x={cx} y="14" textAnchor="middle" fill="#00e5ff" fontSize="8.5" fontWeight="bold">
                                ØDm = {currentDynamicDm.toFixed(1)} mm (De = {currentDynamicDe.toFixed(1)} mm)
                            </text>
                        </g>

                        {/* Wire Diameter d Callout */}
                        <g transform={`translate(${xRight + 10}, ${(isExtension ? currentTopBodyY : currentTopPlatenY) + 35})`}>
                            <line x1="0" y1="0" x2="18" y2="-12" stroke="#38bdf8" strokeWidth="0.8" />
                            <line x1="18" y1="-12" x2="50" y2="-12" stroke="#38bdf8" strokeWidth="0.8" />
                            <text x="22" y="-16" fill="#38bdf8" fontSize="8" fontWeight="bold">
                                d = {spring.d} mm
                            </text>
                        </g>
                    </g>
                )}

                {/* ═══ VIEW MODE: FORCE - DEFLECTION (F - s) CHARACTERISTIC CURVE ═══ */}
                {viewMode === 'curve' && (
                    <g transform="translate(60, 80)">
                        <rect width={showLegend ? 460 : 480} height="260" fill="var(--bg-1)" stroke="var(--line)" rx="8" />
                        <line x1="50" y1="220" x2="430" y2="220" stroke="#475569" strokeWidth="1.5" />
                        <line x1="50" y1="30" x2="50" y2="220" stroke="#475569" strokeWidth="1.5" />

                        <text x="435" y="224" fill="#94a3b8" fontSize="9" fontWeight="bold">s (mm)</text>
                        <text x="45" y="20" fill="#94a3b8" fontSize="9" fontWeight="bold">F (N)</text>

                        {(() => {
                            const graphW = 360;
                            const graphH = 180;
                            const maxS = isExtension
                                ? Math.max((spring.s_zul > 0 ? spring.s_zul : spring.s2 * 1.3) * 1.1, 10)
                                : Math.max(spring.sc * 1.05, 10);
                            const maxF = isExtension
                                ? Math.max((spring.F_zul > 0 ? spring.F_zul : spring.F2 * 1.3) * 1.1, 100)
                                : Math.max(spring.Fc * 1.05, 100);

                            const sToX = (sVal: number) => 50 + (sVal / maxS) * graphW;
                            const fToY = (fVal: number) => 220 - (fVal / maxF) * graphH;

                            const pt0 = { x: sToX(0), y: fToY(isExtension ? spring.F0 : 0) };
                            const pt1 = { x: sToX(spring.s1), y: fToY(spring.F1 || (isExtension ? spring.F0 + spring.s1 * spring.R : spring.s1 * spring.R)) };
                            const pt2 = { x: sToX(spring.s2), y: fToY(spring.F2 || (isExtension ? spring.F0 + spring.s2 * spring.R : spring.s2 * spring.R)) };
                            const ptLimit = isExtension
                                ? { x: sToX(spring.s_zul > 0 ? spring.s_zul : spring.s2 * 1.25), y: fToY(spring.F_zul > 0 ? spring.F_zul : spring.F2 * 1.25) }
                                : { x: sToX(spring.sc), y: fToY(spring.Fc) };
                            const ptCur = { x: sToX(currentDeflection), y: fToY(currentForce) };

                            return (
                                <g>
                                    <polygon
                                        points={`${pt0.x},${pt0.y} ${pt2.x},${pt2.y} ${pt2.x},220 ${pt0.x},220`}
                                        fill="rgba(0, 229, 255, 0.08)"
                                    />
                                    <line
                                        x1={pt0.x}
                                        y1={pt0.y}
                                        x2={ptLimit.x}
                                        y2={ptLimit.y}
                                        stroke="#00e5ff"
                                        strokeWidth="2.5"
                                    />
                                    <line
                                        x1={ptLimit.x}
                                        y1={ptLimit.y}
                                        x2={ptLimit.x}
                                        y2="30"
                                        stroke="#ef4444"
                                        strokeWidth="2"
                                        strokeDasharray="4 3"
                                    />
                                    <text x={ptLimit.x - 4} y="42" textAnchor="end" fill="#ef4444" fontSize="8" fontWeight="bold">
                                        {isExtension ? `s_zul (${spring.s_zul.toFixed(1)} mm)` : `Blok (sc=${spring.sc.toFixed(1)} mm)`}
                                    </text>

                                    {isExtension && spring.F0 > 0 && (
                                        <g>
                                            <circle cx={pt0.x} cy={pt0.y} r="3.5" fill="#f59e0b" />
                                            <text x={pt0.x + 6} y={pt0.y - 4} fill="#f59e0b" fontSize="8" fontWeight="bold">
                                                F₀ = {Math.round(spring.F0)} N
                                            </text>
                                        </g>
                                    )}

                                    {spring.s1 > 0 && (
                                        <g>
                                            <circle cx={pt1.x} cy={pt1.y} r="4" fill="#00e5ff" stroke="#fff" strokeWidth="1" />
                                            <line x1={pt1.x} y1={pt1.y} x2={pt1.x} y2="220" stroke="#00e5ff" strokeWidth="0.8" strokeDasharray="2 2" />
                                            <line x1="50" y1={pt1.y} x2={pt1.x} y2={pt1.y} stroke="#00e5ff" strokeWidth="0.8" strokeDasharray="2 2" />
                                            <text x={pt1.x} y="232" textAnchor="middle" fill="#00e5ff" fontSize="8">s₁={spring.s1.toFixed(1)}</text>
                                            <text x="42" y={pt1.y + 3} textAnchor="end" fill="#00e5ff" fontSize="8">{Math.round(spring.F1)}</text>
                                        </g>
                                    )}

                                    {spring.s2 > 0 && (
                                        <g>
                                            <circle cx={pt2.x} cy={pt2.y} r="4" fill="#f59e0b" stroke="#fff" strokeWidth="1" />
                                            <line x1={pt2.x} y1={pt2.y} x2={pt2.x} y2="220" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2 2" />
                                            <line x1="50" y1={pt2.y} x2={pt2.x} y2={pt2.y} stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2 2" />
                                            <text x={pt2.x} y="232" textAnchor="middle" fill="#f59e0b" fontSize="8">s₂={spring.s2.toFixed(1)}</text>
                                            <text x="42" y={pt2.y + 3} textAnchor="end" fill="#f59e0b" fontSize="8">{Math.round(spring.F2)}</text>
                                        </g>
                                    )}

                                    <circle
                                        cx={ptCur.x}
                                        cy={ptCur.y}
                                        r="6"
                                        fill={stressColor}
                                        stroke="#ffffff"
                                        strokeWidth="2"
                                        filter="url(#springDropGlow)"
                                    />
                                    {(() => {
                                        const isRight = ptCur.x > 280;
                                        const labelText = `F=${Math.round(currentForce)} N (s=${currentDeflection.toFixed(1)})`;
                                        const boxW = Math.max(124, labelText.length * 7 + 14);
                                        const boxX = isRight ? ptCur.x - boxW - 8 : ptCur.x + 8;
                                        const boxY = Math.max(34, ptCur.y - 20);
                                        return (
                                            <g>
                                                <rect
                                                    x={boxX}
                                                    y={boxY}
                                                    width={boxW}
                                                    height="16"
                                                    rx="3"
                                                    fill="rgba(6, 11, 20, 0.92)"
                                                    stroke={stressColor}
                                                    strokeWidth="0.8"
                                                />
                                                <text
                                                    x={boxX + boxW / 2}
                                                    y={boxY + 11.5}
                                                    textAnchor="middle"
                                                    fill={stressColor}
                                                    fontSize="8.5"
                                                    fontWeight="bold"
                                                >
                                                    {labelText}
                                                </text>
                                            </g>
                                        );
                                    })()}

                                    <text x="140" y="70" fill="#38bdf8" fontSize="10" fontWeight="bold">
                                        {t.springRate} R = {spring.R.toFixed(2)} N/mm
                                    </text>
                                </g>
                            );
                        })()}
                    </g>
                )}

                {/* ═══ VIEW MODE: GOODMAN FATIGUE DIAGRAM (DIN EN 13906-1) ═══ */}
                {viewMode === 'goodman' && (
                    <g transform="translate(60, 80)">
                        <rect width={showLegend ? 460 : 480} height="260" fill="var(--bg-1)" stroke="var(--line)" rx="8" />
                        
                        {/* Axes */}
                        <line x1="55" y1="220" x2="430" y2="220" stroke="#475569" strokeWidth="1.5" />
                        <line x1="55" y1="30" x2="55" y2="220" stroke="#475569" strokeWidth="1.5" />

                        <text x="435" y="224" fill="#94a3b8" fontSize="9" fontWeight="bold">τm (MPa)</text>
                        <text x="45" y="20" fill="#94a3b8" fontSize="9" fontWeight="bold">τa (MPa)</text>

                        {(() => {
                            const graphW = 350;
                            const graphH = 175;
                            const maxTauM = Math.max(spring.tauZul * 1.15, 100);
                            const maxTauA = Math.max(spring.tau_O * 1.35, 100);

                            const mToX = (tm: number) => 55 + (tm / maxTauM) * graphW;
                            const aToY = (ta: number) => 220 - (ta / maxTauA) * graphH;

                            const pOrigin = { x: mToX(0), y: aToY(0) };
                            const pTauO = { x: mToX(0), y: aToY(spring.tau_O) };
                            const pTauZul = { x: mToX(spring.tauZul), y: aToY(0) };
                            const pOper = { x: mToX(spring.tau_m), y: aToY(spring.tau_a) };

                            // Shot peening comparison line if unpeened or vice-versa
                            const unpeenedTauO = spring.isShotPeened ? spring.tau_O / 1.25 : spring.tau_O;
                            const pUnpeened = { x: mToX(0), y: aToY(unpeenedTauO) };

                            return (
                                <g>
                                    {/* Safe Fatigue Region Polygon */}
                                    <polygon
                                        points={`${pOrigin.x},${pOrigin.y} ${pTauO.x},${pTauO.y} ${pTauZul.x},${pTauZul.y}`}
                                        fill="rgba(16, 185, 129, 0.12)"
                                        stroke="#10b981"
                                        strokeWidth="1.8"
                                    />

                                    {/* Unpeened baseline reference line if shot-peened */}
                                    {spring.isShotPeened && (
                                        <line
                                            x1={pUnpeened.x}
                                            y1={pUnpeened.y}
                                            x2={pTauZul.x}
                                            y2={pTauZul.y}
                                            stroke="#64748b"
                                            strokeWidth="1.2"
                                            strokeDasharray="3 3"
                                        />
                                    )}

                                    {/* Yield Limit Line (tau_m + tau_a = tau_zul) */}
                                    <line
                                        x1={mToX(spring.tauZul * 0.5)}
                                        y1={aToY(spring.tauZul * 0.5)}
                                        x2={pTauZul.x}
                                        y2={pTauZul.y}
                                        stroke="#ef4444"
                                        strokeWidth="1"
                                        strokeDasharray="2 2"
                                        opacity="0.6"
                                    />

                                    {/* Axis Key Ticks */}
                                    <text x={pTauO.x - 6} y={pTauO.y + 3} textAnchor="end" fill="#10b981" fontSize="8" fontWeight="bold">
                                        τO = {spring.tau_O.toFixed(0)}
                                    </text>
                                    <text x={pTauZul.x} y="234" textAnchor="middle" fill="#94a3b8" fontSize="8">
                                        τzul = {spring.tauZul.toFixed(0)}
                                    </text>

                                    {/* Live Operating Point */}
                                    <line x1={pOper.x} y1={pOper.y} x2={pOper.x} y2="220" stroke="#f59e0b" strokeWidth="0.9" strokeDasharray="3 3" />
                                    <line x1="55" y1={pOper.y} x2={pOper.x} y2={pOper.y} stroke="#f59e0b" strokeWidth="0.9" strokeDasharray="3 3" />

                                    <circle
                                        cx={pOper.x}
                                        cy={pOper.y}
                                        r="6"
                                        fill={spring.isSafeDynamic ? '#10b981' : '#ef4444'}
                                        stroke="#ffffff"
                                        strokeWidth="2"
                                        filter="url(#springDropGlow)"
                                    />

                                    {(() => {
                                        const isRight = pOper.x > 210;
                                        const isHigh = pOper.y < 90;
                                        const labelText = `${t.operatingPoint}: (τm=${spring.tau_m.toFixed(0)}, τa=${spring.tau_a.toFixed(0)}) · Sh=${spring.SF_dynamic.toFixed(2)}x`;
                                        const boxW = Math.max(160, labelText.length * 6.5 + 14);
                                        const boxX = isRight ? Math.max(60, pOper.x - boxW - 8) : pOper.x + 8;
                                        const boxY = isHigh ? pOper.y + 12 : pOper.y - 20;
                                        const col = spring.isSafeDynamic ? '#10b981' : '#ef4444';
                                        return (
                                            <g>
                                                <rect
                                                    x={boxX}
                                                    y={boxY}
                                                    width={boxW}
                                                    height="16"
                                                    rx="3"
                                                    fill="rgba(6, 11, 20, 0.92)"
                                                    stroke={col}
                                                    strokeWidth="0.8"
                                                />
                                                <text
                                                    x={boxX + boxW / 2}
                                                    y={boxY + 11.5}
                                                    textAnchor="middle"
                                                    fill={col}
                                                    fontSize="8"
                                                    fontWeight="bold"
                                                >
                                                    {labelText}
                                                </text>
                                            </g>
                                        );
                                    })()}

                                    {/* Verdict Banner inside graph */}
                                    <g transform="translate(160, 42)">
                                        <rect
                                            width="270"
                                            height="32"
                                            rx="6"
                                            fill={spring.fatigueLifeCategory === 'infinite' ? 'rgba(16, 185, 129, 0.15)' : spring.fatigueLifeCategory === 'finite' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'}
                                            stroke={spring.fatigueLifeCategory === 'infinite' ? '#10b981' : spring.fatigueLifeCategory === 'finite' ? '#f59e0b' : '#ef4444'}
                                            strokeWidth="1"
                                        />
                                        <text
                                            x="135"
                                            y="16"
                                            textAnchor="middle"
                                            fill={spring.fatigueLifeCategory === 'infinite' ? '#34d399' : spring.fatigueLifeCategory === 'finite' ? '#fbbf24' : '#f87171'}
                                            fontSize="9"
                                            fontWeight="bold"
                                        >
                                            {spring.fatigueLifeCategory === 'infinite'
                                                ? t.fatigueInfinite
                                                : spring.fatigueLifeCategory === 'finite'
                                                ? t.fatigueFinite
                                                : t.fatigueDanger}
                                        </text>
                                        <text x="135" y="27" textAnchor="middle" fill="#94a3b8" fontSize="7.5">
                                            {spring.isShotPeened ? t.shotPeenedActive : t.shotPeenedStandard}
                                        </text>
                                    </g>
                                </g>
                            );
                        })()}
                    </g>
                )}

                {/* ═══ LATERAL ENGINEERING SUMMARY (LEGEND) ═══ */}
                {showLegend && (
                    <LegendPanel
                        x={545}
                        y={42}
                        title={viewMode === 'goodman' ? (t.goodmanTitle || 'GOODMAN') : (isExtension ? (t.extensionAnalysisTitle || 'EXTENSION') : (t.compressionAnalysisTitle || 'DIN EN 13906-1'))}
                        rows={viewMode === 'goodman' ? [
                            { label: t.dynamicSafety || t.fatigueCardTitle, value: `${spring.SF_dynamic.toFixed(2)}x`, highlight: spring.isSafeDynamic },
                            { label: t.stressAmp, value: `${spring.tau_a.toFixed(1)} MPa` },
                            { label: t.meanStress, value: `${spring.tau_m.toFixed(1)} MPa` },
                            { label: t.permissibleStress || t.allowableAmp, value: `${spring.tau_A_zul.toFixed(1)} MPa` },
                            { label: t.shotPeening, value: spring.isShotPeened ? (t.shotPeenedActive || 'Active') : (t.shotPeenedStandard || 'Standard') },
                            { label: t.operatingTemp, value: `${(spring.tempDeratingFactor * 100).toFixed(1)}% (${spring.operatingTemp}°C)` },
                            { label: t.relaxationRisk || t.relaxationStatus, value: spring.relaxationRisk.toUpperCase() },
                            { label: t.springRate || t.stiffnessCardTitle, value: `${spring.R.toFixed(2)} N/mm` },
                            { label: isExtension ? (t.hookSafety || 'Hook SF') : (t.radialExpansion || 'Radial Expansion'), value: isExtension ? `${spring.SF_hook.toFixed(2)}x` : `+${spring.deltaDe_2.toFixed(2)} mm` },
                        ] : isExtension ? [
                            { label: t.springRate || t.stiffnessCardTitle, value: `${spring.R.toFixed(2)} N/mm`, highlight: true },
                            { label: t.hookBendingStress, value: `${spring.sigma_b2.toFixed(1)} MPa`, highlight: spring.SF_hook < 1.1 },
                            { label: t.hookSafety || 'Hook SF', value: `${spring.SF_hook.toFixed(2)}x`, highlight: spring.SF_hook >= 1.2 },
                            { label: t.initialTension, value: `${spring.F0.toFixed(1)} N (τ₀=${spring.tau0.toFixed(0)} MPa)` },
                            { label: t.bodyLengthLk || t.bodyLength, value: `${spring.Lk.toFixed(1)} mm` },
                            { label: t.hookHeightLH || 'LH', value: `${spring.LH.toFixed(1)} mm` },
                            { label: t.workingStress || t.stressCardTitle, value: `${spring.tau2.toFixed(1)} MPa` },
                            { label: t.maxPermissibleStroke || t.maxPermissibleDeflection, value: `${spring.s_zul.toFixed(1)} mm` },
                            { label: t.toleranceGrade, value: `Grade ${spring.toleranceGrade}` },
                        ] : [
                            { label: t.springRate || t.stiffnessCardTitle, value: `${spring.R.toFixed(2)} N/mm`, highlight: true },
                            { label: t.workingStress || t.stressCardTitle, value: `${spring.tau2.toFixed(1)} MPa`, highlight: !spring.isSafeStatic },
                            { label: t.staticSafety, value: `${spring.SF_static.toFixed(2)}x` },
                            { label: t.dynamicSafety || t.fatigueCardTitle, value: `${spring.SF_dynamic.toFixed(2)}x` },
                            { label: t.solidHeight || t.stateSolid, value: `${spring.Lc.toFixed(1)} mm` },
                            { label: t.radialExpansion, value: `+${spring.deltaDe_c.toFixed(2)} mm` },
                            { label: t.naturalFrequency || 'fe', value: `${spring.resonanceFreq.toFixed(0)} Hz` },
                            { label: t.slenderness || 'λ', value: `${spring.slenderness.toFixed(1)} ${spring.isBucklingRisk ? '⚠️' : '✓'}` },
                            { label: t.toleranceGrade, value: `Grade ${spring.toleranceGrade}` },
                        ]}
                    />
                )}
            </svg>
        </div>
    );
}

export default SpringBlueprint;
