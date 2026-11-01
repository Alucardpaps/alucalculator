/**
 * 🎨 AluCAD CAM — NestingCanvas Component
 * 
 * SVG-based high-precision canvas for visualizing 2D nesting & Plasma Toolpaths:
 * - Proper Cartesian Y-up -> SVG mapping (No vertical mirroring / Y-inversion)
 * - Dual metrics: Total Sheet Utilization (%) vs Used Region Efficiency (%)
 * - Renders outer part contours and inner holes/cutouts with even-odd fill
 * - Remnant rectangle identification and used bounding box overlay
 * - Live Plasma CNC Torch Simulation:
 *   - Play / Pause / Rewind / Scrubbing timeline
 *   - Speed selection (1x, 2x, 5x, 10x, 25x)
 *   - Dynamic torch nozzle with electric arc flare & spark particles
 *   - Live HUD Telemetry (X, Y, Feedrate, Mode, Strategy Badges)
 *   - Progressive cut trail rendering (completed vs active vs pending)
 */

"use client";

import { useMemo, useState, useRef, useEffect } from 'react';
import type { SheetResult, Sheet2D, PlacedPart } from '@/types/nesting2d.types';
import { 
    Eye, EyeOff, Maximize2, Compass, Flame, ZoomIn, ZoomOut, 
    RotateCcw, Layers, Play, Pause, FastForward, Activity, Zap, Sparkles 
} from 'lucide-react';
import type { SequencedJobResult } from '@/cam/toolpath/thermalSequence';
import type { Segment } from '@/cam/core/geometry';

// Industrial color palette
const PART_STROKE_COLOR = '#10B981'; // Emerald green
const PART_FILL_COLOR = 'rgba(16, 185, 129, 0.12)';
const HOLE_STROKE_COLOR = '#00e5ff'; // Cyan
const HOLE_FILL_COLOR = 'rgba(2, 4, 8, 0.85)'; // Dark cutout
const RAPID_STROKE_COLOR = 'rgba(239, 68, 68, 0.6)'; // Red dashed
const LEAD_IN_COLOR = '#f59e0b'; // Amber
const CUT_TRAIL_COLOR = '#00e5ff'; // Glowing cyan cut path

export interface SimStep {
    id: string;
    type: 'rapid' | 'pierce' | 'leadIn' | 'cut' | 'overcut' | 'leadOut' | 'bridgeCut';
    torchOn: boolean;
    start: { x: number; y: number };
    end: { x: number; y: number };
    segment?: Segment;
    feedMmMin: number;
    durationSec: number;
    startTimeSec: number;
    endTimeSec: number;
    isTrueHole?: boolean;
    isCornerLoop?: boolean;
    isCommonLine?: boolean;
    isAnchorTab?: boolean;
    isAnchorEdge?: boolean;
    isBridge?: boolean;
    isMicrojoint?: boolean;
    sequenceStep?: number;
    sequenceLabel?: string;
}

interface NestingCanvasProps {
    sheet: Sheet2D;
    result: SheetResult | null;
    currentSheetIndex?: number;
    sheetCount?: number;
    onSelectSheet?: (index: number) => void;
    toolpathJob?: SequencedJobResult | null;
    className?: string;
}

function formatSimTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function NestingCanvas({
    sheet,
    result,
    currentSheetIndex = 0,
    sheetCount = 1,
    onSelectSheet,
    toolpathJob = null,
    className = ''
}: NestingCanvasProps) {
    const [showLabels, setShowLabels] = useState(false);
    const [showWaste, setShowWaste] = useState(false);
    const [showToolpaths, setShowToolpaths] = useState(true);

    // Pan & Zoom interactive state
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const svgContainerRef = useRef<HTMLDivElement>(null);

    // ─── LIVE CNC SIMULATION STATE ───
    const [isSimPlaying, setIsSimPlaying] = useState(false);
    const [simTime, setSimTime] = useState(0);
    const [simSpeed, setSimSpeed] = useState<number>(5);
    const animFrameRef = useRef<number | null>(null);

    // Calculate dynamic viewBox factoring in pan and zoom
    const padding = 40;
    const viewBox = useMemo(() => {
        const baseW = sheet.width + padding * 2;
        const baseH = sheet.height + padding * 2;
        const curW = baseW / zoom;
        const curH = baseH / zoom;
        const curX = -padding - pan.x + (baseW - curW) / 2;
        const curY = -padding - pan.y + (baseH - curH) / 2;
        return `${curX} ${curY} ${curW} ${curH}`;
    }, [sheet.width, sheet.height, zoom, pan]);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.15 : 0.87;
        setZoom(z => Math.max(0.25, Math.min(10, z * factor)));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0 || e.button === 1) { // Left or middle click
            setIsPanning(true);
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isPanning || !svgContainerRef.current) return;
        const rect = svgContainerRef.current.getBoundingClientRect();
        const scaleX = (sheet.width + padding * 2) / (rect.width * zoom);
        const scaleY = (sheet.height + padding * 2) / (rect.height * zoom);
        const dx = (e.clientX - dragStart.x) * scaleX;
        const dy = (e.clientY - dragStart.y) * scaleY;
        setPan(p => ({ x: p.x + dx, y: p.y + dy }));
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => setIsPanning(false);

    const resetView = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    // Used region boundary
    const usedBounds = useMemo(() => {
        if (!result || result.placedParts.length === 0) return null;
        let maxX = 0;
        let maxY = 0;
        for (const p of result.placedParts) {
            const rx = p.position.x + p.polygon.bounds.width;
            const ry = p.position.y + p.polygon.bounds.height;
            if (rx > maxX) maxX = rx;
            if (ry > maxY) maxY = ry;
        }
        const usedW = Math.min(sheet.width, maxX + sheet.kerf * 2);
        const usedH = Math.min(sheet.height, maxY + sheet.kerf * 2);
        const totalPartsArea = result.placedParts.reduce((s, p) => s + p.polygon.area, 0);
        const usedAreaMm2 = usedW * usedH;
        const regionEff = usedAreaMm2 > 0 ? (totalPartsArea / usedAreaMm2) * 100 : 0;
        const sheetEff = (totalPartsArea / (sheet.width * sheet.height)) * 100;

        return {
            width: usedW,
            height: usedH,
            regionEfficiency: regionEff,
            sheetEfficiency: sheetEff,
            remnantWidth: Math.max(0, sheet.width - usedW),
        };
    }, [result, sheet]);

    // ─── TOOLPATH FLATTENING INTO SIMULATION STEPS ───
    const simSteps = useMemo<SimStep[]>(() => {
        if (!toolpathJob || !toolpathJob.toolpaths || toolpathJob.toolpaths.length === 0) return [];
        const steps: SimStep[] = [];
        let currentPos = { x: 0, y: 0 };
        let accumTime = 0;
        const rapidFeedMmMin = 12000;
        const rapidFeedMmSec = rapidFeedMmMin / 60; // 200 mm/s

        toolpathJob.toolpaths.forEach((tp, tpIdx) => {
            // Rapid move to pierce point
            const dx = tp.piercePoint.x - currentPos.x;
            const dy = tp.piercePoint.y - currentPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0.1) {
                const dur = Math.max(0.01, dist / rapidFeedMmSec);
                steps.push({
                    id: `rapid-lead-${tpIdx}`,
                    type: 'rapid',
                    torchOn: false,
                    start: { ...currentPos },
                    end: { ...tp.piercePoint },
                    feedMmMin: rapidFeedMmMin,
                    durationSec: dur,
                    startTimeSec: accumTime,
                    endTimeSec: accumTime + dur,
                });
                accumTime += dur;
                currentPos = { ...tp.piercePoint };
            }

            tp.operations.forEach((op, opIdx) => {
                if (op.type === 'pierce') {
                    const dur = op.dwellSec || 0.6;
                    steps.push({
                        id: `pierce-${tpIdx}-${opIdx}`,
                        type: 'pierce',
                        torchOn: true,
                        start: { ...currentPos },
                        end: { ...currentPos },
                        feedMmMin: 0,
                        durationSec: dur,
                        startTimeSec: accumTime,
                        endTimeSec: accumTime + dur,
                        isTrueHole: op.isTrueHole,
                    });
                    accumTime += dur;
                } else if (op.type === 'rapid') {
                    const target = op.point || (op.segment ? op.segment.end : currentPos);
                    const rdx = target.x - currentPos.x;
                    const rdy = target.y - currentPos.y;
                    const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
                    if (rdist > 0.1) {
                        const dur = Math.max(0.01, rdist / rapidFeedMmSec);
                        steps.push({
                            id: `rapid-${tpIdx}-${opIdx}`,
                            type: 'rapid',
                            torchOn: false,
                            start: { ...currentPos },
                            end: { ...target },
                            segment: op.segment,
                            feedMmMin: rapidFeedMmMin,
                            durationSec: dur,
                            startTimeSec: accumTime,
                            endTimeSec: accumTime + dur,
                            isAnchorTab: op.isAnchorTab,
                            isAnchorEdge: op.isAnchorEdge,
                            sequenceStep: op.sequenceStep ?? tp.sequenceStep,
                            sequenceLabel: op.sequenceLabel ?? tp.sequenceLabel,
                        });
                        accumTime += dur;
                        currentPos = { ...target };
                    }
                } else if (op.segment) {
                    const seg = op.segment;
                    const feed = op.feedRateMmMin || 3000;
                    const feedSec = feed / 60;
                    const dur = Math.max(0.01, seg.length / feedSec);
                    steps.push({
                        id: `cut-${tpIdx}-${opIdx}`,
                        type: op.type,
                        torchOn: op.torchOn,
                        start: { ...seg.start },
                        end: { ...seg.end },
                        segment: seg,
                        feedMmMin: feed,
                        durationSec: dur,
                        startTimeSec: accumTime,
                        endTimeSec: accumTime + dur,
                        isTrueHole: op.isTrueHole,
                        isCornerLoop: op.isCornerLoop,
                        isCommonLine: op.isCommonLine,
                        isAnchorTab: op.isAnchorTab,
                        isAnchorEdge: op.isAnchorEdge,
                        isBridge: op.isBridge || op.type === 'bridgeCut',
                        isMicrojoint: op.isMicrojoint,
                        sequenceStep: op.sequenceStep ?? tp.sequenceStep,
                        sequenceLabel: op.sequenceLabel ?? tp.sequenceLabel,
                    });
                    accumTime += dur;
                    currentPos = { ...seg.end };
                }
            });
        });

        return steps;
    }, [toolpathJob]);

    const totalSimDuration = useMemo(() => {
        if (simSteps.length === 0) return 0;
        return simSteps[simSteps.length - 1].endTimeSec;
    }, [simSteps]);

    // Reset or clamp simTime when steps change
    useEffect(() => {
        setSimTime(0);
        setIsSimPlaying(false);
    }, [toolpathJob]);

    // Animation Loop
    useEffect(() => {
        if (!isSimPlaying || totalSimDuration === 0) {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            return;
        }

        let lastTimestamp = performance.now();
        const loop = (now: number) => {
            const deltaSec = (now - lastTimestamp) / 1000;
            lastTimestamp = now;

            setSimTime(prev => {
                const next = prev + deltaSec * simSpeed;
                if (next >= totalSimDuration) {
                    setIsSimPlaying(false);
                    return totalSimDuration;
                }
                return next;
            });

            animFrameRef.current = requestAnimationFrame(loop);
        };

        animFrameRef.current = requestAnimationFrame(loop);
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [isSimPlaying, totalSimDuration, simSpeed]);

    // Current Torch Head State Calculation
    const currentTorchState = useMemo(() => {
        if (simSteps.length === 0) return null;
        if (simTime >= totalSimDuration) {
            const last = simSteps[simSteps.length - 1];
            return {
                x: last.end.x,
                y: last.end.y,
                type: 'done' as const,
                torchOn: false,
                feedMmMin: 0,
                activeStepIndex: simSteps.length - 1,
                isTrueHole: false,
                isCornerLoop: false,
                isCommonLine: false,
            };
        }

        const stepIdx = simSteps.findIndex(s => simTime >= s.startTimeSec && simTime < s.endTimeSec);
        const activeIdx = stepIdx >= 0 ? stepIdx : simSteps.length - 1;
        const step = simSteps[activeIdx];
        const alpha = Math.max(0, Math.min(1, (simTime - step.startTimeSec) / Math.max(0.001, step.durationSec)));

        let curX = step.start.x + (step.end.x - step.start.x) * alpha;
        let curY = step.start.y + (step.end.y - step.start.y) * alpha;

        if (step.segment && step.segment.type === 'arc') {
            const arc = step.segment;
            const curAngle = arc.startAngleRad + (arc.clockwise ? -arc.sweepAngleRad : arc.sweepAngleRad) * alpha;
            curX = arc.center.x + arc.radius * Math.cos(curAngle);
            curY = arc.center.y + arc.radius * Math.sin(curAngle);
        }

        return {
            x: curX,
            y: curY,
            type: step.type,
            torchOn: step.torchOn,
            feedMmMin: step.feedMmMin,
            activeStepIndex: activeIdx,
            isTrueHole: step.isTrueHole,
            isCornerLoop: step.isCornerLoop,
            isCommonLine: step.isCommonLine,
            isAnchorTab: step.isAnchorTab,
            isAnchorEdge: step.isAnchorEdge,
            sequenceStep: step.sequenceStep,
            sequenceLabel: step.sequenceLabel,
        };
    }, [simSteps, simTime, totalSimDuration]);

    // Render polygon path with proper Cartesian Y-up to SVG Y-down mapping
    const renderPolygonPath = (part: PlacedPart, pointsOverride?: { x: number; y: number }[]): string => {
        const points = pointsOverride || part.polygon.points;
        if (points.length < 2) return '';

        const isAlreadyPlaced = Math.abs(part.polygon.bounds.x - part.position.x) < 0.01;

        return points
            .map((p, i) => {
                let x = p.x;
                let y = p.y;

                if (!isAlreadyPlaced) {
                    if (part.rotation !== 0) {
                        const bounds = part.polygon.bounds;
                        const cx = bounds.x + bounds.width / 2;
                        const cy = bounds.y + bounds.height / 2;
                        const radians = (part.rotation * Math.PI) / 180;
                        const cos = Math.cos(radians);
                        const sin = Math.sin(radians);
                        const dx = p.x - cx;
                        const dy = p.y - cy;
                        x = cx + dx * cos - dy * sin;
                        y = cy + dx * sin + dy * cos;
                    }
                    x += part.position.x;
                    y += part.position.y;
                }

                // CAD Y-up (0 at bottom) to SVG Y-down (0 at top)
                const svgY = sheet.height - y;
                return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${svgY.toFixed(2)}`;
            })
            .join(' ') + ' Z';
    };

    return (
        <div className={`relative flex flex-col w-full h-full bg-[var(--bg-0)] overflow-hidden select-none ${className}`}>
            {/* Top Toolbar Bar */}
            <div className="h-11 px-4 flex items-center justify-between bg-[var(--bg-1)]/95 border-b border-white/10 shrink-0 z-20">
                {/* Left: Sheet Size, Tabs & Badges */}
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                        <Layers size={13} className="text-cyan-400" />
                        {sheet.width} × {sheet.height} mm
                    </span>

                    {/* Multi-Sheet selector tabs if sheetCount > 1 */}
                    {sheetCount > 1 && (
                        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10">
                            {Array.from({ length: sheetCount }).map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => onSelectSheet && onSelectSheet(i)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                                        currentSheetIndex === i
                                            ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-sm'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Plaka {i + 1}
                                </button>
                            ))}
                        </div>
                    )}

                    {usedBounds && (
                        <div className="hidden sm:flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Sac Doluluğu: {usedBounds.sheetEfficiency.toFixed(1)}%
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                Bölge Verimi: {usedBounds.regionEfficiency.toFixed(1)}%
                            </span>
                            {usedBounds.remnantWidth > 100 && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    Artık Sac: {Math.round(usedBounds.remnantWidth)}×{sheet.height} mm
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Controls & Zoom */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                        type="button"
                        onClick={() => setShowToolpaths(!showToolpaths)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            showToolpaths ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title="Plazma Takım Yolu & Canlı Torç Simülasyonu"
                    >
                        <Compass size={13} />
                        <span className="text-[10px]">Takım Yolu Simülatörü</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowLabels(!showLabels)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${showLabels ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                        title={showLabels ? 'Etiketleri Gizle' : 'Etiketleri Göster'}
                    >
                        {showLabels ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowWaste(!showWaste)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${showWaste ? 'bg-red-500/20 text-red-400' : 'text-slate-500 hover:text-slate-300'}`}
                        title="Boşluk Alanlarını Göster"
                    >
                        <Maximize2 size={15} />
                    </button>

                    <div className="w-px h-4 bg-white/10 mx-1" />

                    {/* Interactive Zoom Controls */}
                    <button
                        type="button"
                        onClick={() => setZoom(z => Math.min(10, z * 1.25))}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                        title="Yakınlaştır (+)"
                    >
                        <ZoomIn size={15} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setZoom(z => Math.max(0.25, z * 0.8))}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                        title="Uzaklaştır (-)"
                    >
                        <ZoomOut size={15} />
                    </button>
                    <button
                        type="button"
                        onClick={resetView}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-cyan-400 hover:bg-white/5 border border-white/10 transition-all flex items-center gap-1 cursor-pointer"
                        title="Tam Ekrana Sığdır / Sıfırla"
                    >
                        <RotateCcw size={11} /> Sığdır
                    </button>
                </div>
            </div>

            {/* Interactive SVG Viewport */}
            <div
                ref={svgContainerRef}
                className={`flex-1 w-full h-full min-h-0 relative overflow-hidden flex items-center justify-center ${
                    isPanning ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDoubleClick={resetView}
            >
                <svg
                    viewBox={viewBox}
                    className="w-full h-full select-none"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Patterns & Glowing Arc Filters */}
                    <defs>
                        <pattern id="grid-clean" width="100" height="100" patternUnits="userSpaceOnUse">
                            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(100, 116, 139, 0.15)" strokeWidth="0.5" />
                        </pattern>
                        <pattern id="remnant-hatch" width="20" height="20" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="20" stroke="rgba(34, 197, 94, 0.15)" strokeWidth="1" />
                        </pattern>
                        {/* Radial Gradient for Plasma Arc Glow */}
                        <radialGradient id="plasma-arc-glow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                            <stop offset="25%" stopColor="#00e5ff" stopOpacity="0.9" />
                            <stop offset="70%" stopColor="#0284c7" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                        </radialGradient>
                        {/* Radial Gradient for Plasma Pierce Spark Flash */}
                        <radialGradient id="plasma-pierce-glow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                            <stop offset="35%" stopColor="#fbbf24" stopOpacity="0.95" />
                            <stop offset="70%" stopColor="#f97316" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    {/* Sheet background */}
                    <rect x={0} y={0} width={sheet.width} height={sheet.height} fill="url(#grid-clean)" stroke="rgba(100, 116, 139, 0.5)" strokeWidth="1.5" />

                    {/* Remnant Stock Rectangle (Usable leftover area) */}
                    {usedBounds && usedBounds.remnantWidth > 50 && (
                        <g>
                            <rect
                                x={usedBounds.width}
                                y={0}
                                width={usedBounds.remnantWidth}
                                height={sheet.height}
                                fill="url(#remnant-hatch)"
                                stroke="rgba(34, 197, 94, 0.4)"
                                strokeWidth="1.5"
                                strokeDasharray="6 3"
                            />
                            <text
                                x={usedBounds.width + usedBounds.remnantWidth / 2}
                                y={sheet.height / 2}
                                fill="rgba(34, 197, 94, 0.7)"
                                fontSize="18"
                                fontWeight="bold"
                                textAnchor="middle"
                                fontFamily="monospace"
                            >
                                {result?.remnantSheet?.id 
                                    ? `KALINTI SAC (${result.remnantSheet.id}): ${result.remnantSheet.width}×${result.remnantSheet.height} mm (${result.remnantSheet.weightKg} kg)`
                                    : `ARTIK SAC (REMNANT): ${Math.round(usedBounds.remnantWidth)}×${sheet.height} mm`}
                            </text>
                        </g>
                    )}

                    {/* SigmaNEST Transverse Guillotine Crop Cut (Sac Kesme / Kalıntı Ayırma Kesimi) */}
                    {result?.cropCut && (
                        <g className="crop-cut-overlay">
                            {result.cropCut.axis === 'x' ? (
                                <>
                                    <line
                                        x1={result.cropCut.coordinate}
                                        y1={0}
                                        x2={result.cropCut.coordinate}
                                        y2={sheet.height}
                                        stroke="#f59e0b"
                                        strokeWidth="2.5"
                                        strokeDasharray="10 5"
                                    />
                                    {/* Pierce point marker */}
                                    <circle
                                        cx={result.cropCut.coordinate}
                                        cy={0}
                                        r="6"
                                        fill="#ef4444"
                                        stroke="#ffffff"
                                        strokeWidth="1.5"
                                    />
                                    <text
                                        x={result.cropCut.coordinate + 8}
                                        y={30}
                                        fill="#f59e0b"
                                        fontSize="14"
                                        fontWeight="bold"
                                        fontFamily="monospace"
                                    >
                                        ✂️ SAC AYIRMA KESİMİ (X = {Math.round(result.cropCut.coordinate)} mm)
                                    </text>
                                </>
                            ) : (
                                <>
                                    <line
                                        x1={0}
                                        y1={sheet.height - result.cropCut.coordinate}
                                        x2={sheet.width}
                                        y2={sheet.height - result.cropCut.coordinate}
                                        stroke="#f59e0b"
                                        strokeWidth="2.5"
                                        strokeDasharray="10 5"
                                    />
                                    <circle
                                        cx={0}
                                        cy={sheet.height - result.cropCut.coordinate}
                                        r="6"
                                        fill="#ef4444"
                                        stroke="#ffffff"
                                        strokeWidth="1.5"
                                    />
                                    <text
                                        x={30}
                                        y={sheet.height - result.cropCut.coordinate - 8}
                                        fill="#f59e0b"
                                        fontSize="14"
                                        fontWeight="bold"
                                        fontFamily="monospace"
                                    >
                                        ✂️ SAC AYIRMA KESİMİ (Y = {Math.round(result.cropCut.coordinate)} mm)
                                    </text>
                                </>
                            )}
                        </g>
                    )}

                    {/* Used Region Bounding Box */}
                    {usedBounds && (
                        <rect
                            x={0}
                            y={sheet.height - usedBounds.height}
                            width={usedBounds.width}
                            height={usedBounds.height}
                            fill="none"
                            stroke="rgba(245, 158, 11, 0.5)"
                            strokeWidth="1.5"
                            strokeDasharray="8 4"
                        />
                    )}

                    {/* Placed parts */}
                    {result?.placedParts.map((part) => (
                        <g key={`${part.partId}-${part.instanceIndex}`}>
                            {/* Outer Contour */}
                            <path
                                d={renderPolygonPath(part)}
                                fill={PART_FILL_COLOR}
                                stroke={PART_STROKE_COLOR}
                                strokeWidth="1.8"
                            />

                            {/* Inner Holes / Cutouts */}
                            {part.innerPolygons && part.innerPolygons.map((inner, hIdx) => (
                                <path
                                    key={`hole-${hIdx}`}
                                    d={renderPolygonPath(part, inner.points)}
                                    fill={HOLE_FILL_COLOR}
                                    stroke={HOLE_STROKE_COLOR}
                                    strokeWidth="1.2"
                                />
                            ))}

                            {/* Optional Label */}
                            {showLabels && (
                                <text
                                    x={part.position.x + part.polygon.bounds.width / 2}
                                    y={sheet.height - (part.position.y + part.polygon.bounds.height / 2)}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="white"
                                    fontSize={Math.max(10, Math.min(part.polygon.bounds.width, part.polygon.bounds.height) / 5)}
                                    fontWeight="bold"
                                    opacity={0.9}
                                >
                                    {part.instanceIndex + 1}
                                </text>
                            )}
                        </g>
                    ))}

                    {/* Waste areas */}
                    {showWaste && result?.freeRectangles.map((rect, index) => (
                        <rect
                            key={`free-${index}`}
                            x={rect.x}
                            y={sheet.height - (rect.y + rect.height)}
                            width={rect.width}
                            height={rect.height}
                            fill="rgba(239, 68, 68, 0.08)"
                            stroke="rgba(239, 68, 68, 0.3)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                        />
                    ))}

                    {/* ─── LIVE TOOLPATH & CUT SIMULATION RENDERING ─── */}
                    {showToolpaths && simSteps.length > 0 && (
                        <g className="toolpath-simulation-layer">
                            {simSteps.map((step) => {
                                const isCompleted = step.endTimeSec <= simTime;
                                const isActive = simTime >= step.startTimeSec && simTime < step.endTimeSec;

                                // Pending future cuts: render in faint preview dashed line
                                if (!isCompleted && !isActive) {
                                    if (step.type === 'rapid') {
                                        return (
                                            <line
                                                key={`f-rap-${step.id}`}
                                                x1={step.start.x}
                                                y1={sheet.height - step.start.y}
                                                x2={step.end.x}
                                                y2={sheet.height - step.end.y}
                                                stroke="rgba(239, 68, 68, 0.2)"
                                                strokeWidth="0.8"
                                                strokeDasharray="3 3"
                                            />
                                        );
                                    }
                                    if (step.segment) {
                                        if (step.segment.type === 'line') {
                                            return (
                                                <line
                                                    key={`f-seg-${step.id}`}
                                                    x1={step.segment.start.x}
                                                    y1={sheet.height - step.segment.start.y}
                                                    x2={step.segment.end.x}
                                                    y2={sheet.height - step.segment.end.y}
                                                    stroke="rgba(100, 116, 139, 0.25)"
                                                    strokeWidth="0.9"
                                                    strokeDasharray="2 3"
                                                />
                                            );
                                        } else if (step.segment.type === 'arc') {
                                            const r = step.segment.radius;
                                            const sweepFlag = step.segment.clockwise ? 0 : 1;
                                            const d = `M ${step.segment.start.x} ${sheet.height - step.segment.start.y} A ${r} ${r} 0 0 ${sweepFlag} ${step.segment.end.x} ${sheet.height - step.segment.end.y}`;
                                            return (
                                                <path
                                                    key={`f-arc-${step.id}`}
                                                    d={d}
                                                    fill="none"
                                                    stroke="rgba(100, 116, 139, 0.25)"
                                                    strokeWidth="0.9"
                                                    strokeDasharray="2 3"
                                                />
                                            );
                                        }
                                    }
                                    return null;
                                }

                                // Completed or partially completed steps
                                if (step.type === 'pierce') {
                                    return (
                                        <circle
                                            key={`p-${step.id}`}
                                            cx={step.start.x}
                                            cy={sheet.height - step.start.y}
                                            r={isCompleted ? 2.5 : 4}
                                            fill={isCompleted ? '#fbbf24' : '#ffffff'}
                                            stroke="#000"
                                            strokeWidth="0.8"
                                        />
                                    );
                                }

                                if (step.type === 'rapid') {
                                    const endX = isCompleted ? step.end.x : currentTorchState?.x || step.start.x;
                                    const endY = isCompleted ? step.end.y : currentTorchState?.y || step.start.y;
                                    return (
                                        <line
                                            key={`rap-${step.id}`}
                                            x1={step.start.x}
                                            y1={sheet.height - step.start.y}
                                            x2={endX}
                                            y2={sheet.height - endY}
                                            stroke={RAPID_STROKE_COLOR}
                                            strokeWidth="1.2"
                                            strokeDasharray="5 3"
                                        />
                                    );
                                }

                                const isLead = step.type === 'leadIn' || step.type === 'leadOut';
                                const isBridge = step.isBridge || step.type === 'bridgeCut';
                                const stroke = isBridge ? '#c084fc' : step.isCommonLine ? '#22c55e' : step.isAnchorEdge ? '#f59e0b' : isLead ? LEAD_IN_COLOR : CUT_TRAIL_COLOR;
                                const strokeW = isBridge ? 3.0 : step.isCommonLine ? 3.2 : step.isAnchorEdge ? 2.5 : isLead ? 1.5 : 2.0;

                                if (step.segment && step.segment.type === 'line') {
                                    const endX = isCompleted ? step.end.x : currentTorchState?.x || step.start.x;
                                    const endY = isCompleted ? step.end.y : currentTorchState?.y || step.start.y;
                                    return (
                                        <g key={`cut-grp-${step.id}`}>
                                            <line
                                                x1={step.start.x}
                                                y1={sheet.height - step.start.y}
                                                x2={endX}
                                                y2={sheet.height - endY}
                                                stroke={stroke}
                                                strokeWidth={strokeW}
                                                strokeDasharray={isBridge ? '6 3' : isLead ? '3 2' : undefined}
                                                strokeLinecap="round"
                                            />
                                            {/* Bridge Cut (Köprü) Badge */}
                                            {isBridge && (showLabels || showToolpaths) && (
                                                <g>
                                                    <rect
                                                        x={(step.start.x + step.end.x) / 2 - 20}
                                                        y={sheet.height - (step.start.y + step.end.y) / 2 - 9}
                                                        width="40"
                                                        height="17"
                                                        rx="4"
                                                        fill="#2e1065"
                                                        stroke="#c084fc"
                                                        strokeWidth="1.2"
                                                    />
                                                    <text
                                                        x={(step.start.x + step.end.x) / 2}
                                                        y={sheet.height - (step.start.y + step.end.y) / 2 + 3}
                                                        fill="#f3e8ff"
                                                        fontSize="8"
                                                        fontWeight="900"
                                                        textAnchor="middle"
                                                        fontFamily="monospace"
                                                    >
                                                        KÖPRÜ
                                                    </text>
                                                </g>
                                            )}
                                            {/* Sequence Step Number Badge (matching Image 2 / CLC) */}
                                            {step.sequenceStep && !isBridge && (showLabels || showToolpaths) && (
                                                <g>
                                                    <circle
                                                        cx={(step.start.x + step.end.x) / 2}
                                                        cy={sheet.height - (step.start.y + step.end.y) / 2}
                                                        r={step.isCommonLine ? 15 : 11}
                                                        fill="#050811"
                                                        stroke={step.isCommonLine ? '#22c55e' : step.isAnchorEdge ? '#f59e0b' : '#00e5ff'}
                                                        strokeWidth="2"
                                                    />
                                                    <text
                                                        x={(step.start.x + step.end.x) / 2}
                                                        y={sheet.height - (step.start.y + step.end.y) / 2 + 3.5}
                                                        fill={step.isCommonLine ? '#22c55e' : step.isAnchorEdge ? '#f59e0b' : '#00e5ff'}
                                                        fontSize={step.isCommonLine ? '8' : '10'}
                                                        fontWeight="900"
                                                        textAnchor="middle"
                                                        fontFamily="monospace"
                                                    >
                                                        {step.isCommonLine ? `CLC ${step.sequenceStep}` : step.sequenceStep}
                                                    </text>
                                                </g>
                                            )}
                                        </g>
                                    );
                                } else if (step.segment && step.segment.type === 'arc') {
                                    const r = step.segment.radius;
                                    const sweepFlag = step.segment.clockwise ? 0 : 1;
                                    const targetX = isCompleted ? step.end.x : currentTorchState?.x || step.start.x;
                                    const targetY = isCompleted ? step.end.y : currentTorchState?.y || step.start.y;
                                    const d = `M ${step.segment.start.x} ${sheet.height - step.segment.start.y} A ${r} ${r} 0 0 ${sweepFlag} ${targetX} ${sheet.height - targetY}`;
                                    return (
                                        <path
                                            key={`cut-arc-${step.id}`}
                                            d={d}
                                            fill="none"
                                            stroke={stroke}
                                            strokeWidth={strokeW}
                                            strokeLinecap="round"
                                        />
                                    );
                                }

                                // Render Anchor Tab Hash Marks (// // - Image 2)
                                if (step.isAnchorTab) {
                                    return (
                                        <g key={`tab-marker-${step.id}`}>
                                            <line
                                                x1={step.start.x}
                                                y1={sheet.height - step.start.y - 12}
                                                x2={step.start.x - 7}
                                                y2={sheet.height - step.start.y + 12}
                                                stroke="#f59e0b"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                            />
                                            <line
                                                x1={step.end.x}
                                                y1={sheet.height - step.end.y - 12}
                                                x2={step.end.x - 7}
                                                y2={sheet.height - step.end.y + 12}
                                                stroke="#f59e0b"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                            />
                                            <text
                                                x={(step.start.x + step.end.x) / 2}
                                                y={sheet.height - step.start.y + 22}
                                                fill="#f59e0b"
                                                fontSize="9"
                                                fontWeight="900"
                                                textAnchor="middle"
                                                fontFamily="monospace"
                                            >
                                                TAB
                                            </text>
                                        </g>
                                    );
                                }

                                return null;
                            })}

                            {/* ─── ANIMATED TORCH HEAD WITH ARC GLOW & SPARKS ─── */}
                            {currentTorchState && (
                                <g
                                    className="plasma-torch-head"
                                    transform={`translate(${currentTorchState.x}, ${sheet.height - currentTorchState.y})`}
                                >
                                    {/* Electric Arc Corona when cutting */}
                                    {currentTorchState.torchOn && currentTorchState.type !== 'pierce' && (
                                        <>
                                            {/* Glowing Plasma Arc Pulse */}
                                            <circle r={10} fill="url(#plasma-arc-glow)" opacity={0.85} />
                                            <circle r={2.5} fill="#ffffff" />
                                            
                                            {/* Dynamic Trail Sparks */}
                                            <line x1={-3} y1={-3} x2={-8} y2={-7} stroke="#38bdf8" strokeWidth="1" strokeLinecap="round" />
                                            <line x1={-4} y1={2} x2={-10} y2={4} stroke="#00e5ff" strokeWidth="0.8" strokeLinecap="round" />
                                            <line x1={-2} y1={4} x2={-6} y2={9} stroke="#fbbf24" strokeWidth="0.8" strokeLinecap="round" />
                                        </>
                                    )}

                                    {/* Piercing Spark Flare when pierce operation is active */}
                                    {currentTorchState.type === 'pierce' && (
                                        <>
                                            <circle r={16} fill="url(#plasma-pierce-glow)" opacity={0.95} />
                                            <circle r={3.5} fill="#ffffff" />
                                            {/* Radiating Spark Flares */}
                                            {[-45, 0, 45, 90, 135, 180, 225, 270].map((deg, i) => (
                                                <line
                                                    key={`spark-${i}`}
                                                    x1={0}
                                                    y1={0}
                                                    x2={14 * Math.cos(deg * Math.PI / 180)}
                                                    y2={14 * Math.sin(deg * Math.PI / 180)}
                                                    stroke="#fef08a"
                                                    strokeWidth="1.2"
                                                    strokeLinecap="round"
                                                />
                                            ))}
                                        </>
                                    )}

                                    {/* Rapid Torch Reticle Indicator */}
                                    {!currentTorchState.torchOn && (
                                        <g>
                                            <circle r={5} fill="none" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="2 2" />
                                            <line x1={-8} y1={0} x2={8} y2={0} stroke="#ef4444" strokeWidth="0.9" />
                                            <line x1={0} y1={-8} x2={0} y2={8} stroke="#ef4444" strokeWidth="0.9" />
                                        </g>
                                    )}

                                    {/* Precision Outer Nozzle Ring & Crosshair Reticle */}
                                    <circle r={7} fill="none" stroke={currentTorchState.torchOn ? '#00e5ff' : '#64748b'} strokeWidth="1" />
                                    <line x1={-11} y1={0} x2={-7} y2={0} stroke={currentTorchState.torchOn ? '#00e5ff' : '#64748b'} strokeWidth="1" />
                                    <line x1={7} y1={0} x2={11} y2={0} stroke={currentTorchState.torchOn ? '#00e5ff' : '#64748b'} strokeWidth="1" />
                                    <line x1={0} y1={-11} x2={0} y2={-7} stroke={currentTorchState.torchOn ? '#00e5ff' : '#64748b'} strokeWidth="1" />
                                    <line x1={0} y1={7} x2={0} y2={11} stroke={currentTorchState.torchOn ? '#00e5ff' : '#64748b'} strokeWidth="1" />
                                </g>
                            )}
                        </g>
                    )}

                    {/* Sheet border */}
                    <rect x={0} y={0} width={sheet.width} height={sheet.height} fill="none" stroke="#3B82F6" strokeWidth="2.5" />
                </svg>
            </div>

            {/* ─── CNC COCKPIT & LIVE SIMULATION CONTROL DOCK ─── */}
            {toolpathJob && simSteps.length > 0 && (
                <div className="absolute bottom-3 left-4 right-4 z-30 flex flex-col md:flex-row items-center justify-between gap-3 bg-[var(--bg-1)]/95 border border-white/10 rounded-2xl px-4 py-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
                    {/* Left: Playback Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                if (simTime >= totalSimDuration) {
                                    setSimTime(0);
                                }
                                setIsSimPlaying(!isSimPlaying);
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                                isSimPlaying
                                    ? 'bg-amber-500 hover:bg-amber-400 text-black '
                                    : 'bg-cyan-500 hover:bg-cyan-400 text-black '
                            }`}
                        >
                            {isSimPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                            <span>{isSimPlaying ? 'Durdur' : 'Canlı Kesim'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setIsSimPlaying(false);
                                setSimTime(0);
                            }}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer"
                            title="Başa Sar (Sıfırla)"
                        >
                            <RotateCcw size={14} />
                        </button>

                        {/* Speed Selectors */}
                        <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10 text-[10px] font-bold font-mono">
                            {[1, 2, 5, 10, 25].map(spd => (
                                <button
                                    key={spd}
                                    type="button"
                                    onClick={() => setSimSpeed(spd)}
                                    className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                                        simSpeed === spd
                                            ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black shadow-sm'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {spd}×
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Center: Timeline Scrubbing Slider & Time */}
                    <div className="flex-1 max-w-md w-full flex items-center gap-3">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 shrink-0">
                            {formatSimTime(simTime)}
                        </span>
                        <input
                            type="range"
                            min="0"
                            max={totalSimDuration || 1}
                            step="0.1"
                            value={simTime}
                            onChange={(e) => {
                                setSimTime(parseFloat(e.target.value));
                            }}
                            className="w-full accent-[var(--cyan)] cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                        />
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {formatSimTime(totalSimDuration)}
                        </span>
                    </div>

                    {/* Right: Live Telemetry HUD Coordinates & Status */}
                    {currentTorchState && (
                        <div className="flex items-center gap-2 shrink-0">
                            {/* State Badge */}
                            <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border ${
                                currentTorchState.type === 'pierce'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                                    : currentTorchState.torchOn
                                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                                <Zap size={11} />
                                <span>
                                    {currentTorchState.type === 'pierce' 
                                        ? 'DELME (PIERCE)' 
                                        : currentTorchState.torchOn 
                                            ? 'KESİM (CUT)' 
                                            : 'BOŞTA GEZİNME (RAPID)'}
                                </span>
                            </div>

                            {/* Feature Badge if True Hole or CLC */}
                            {currentTorchState.isTrueHole && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-cyan-600/30 text-cyan-300 border border-cyan-500/40">
                                    TRUE HOLE™
                                </span>
                            )}
                            {currentTorchState.isCommonLine && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600/30 text-emerald-300 border border-emerald-500/40">
                                    CLC
                                </span>
                            )}
                            {currentTorchState.isAnchorTab && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-600/30 text-amber-300 border border-amber-500/40">
                                    TAB // //
                                </span>
                            )}
                            {currentTorchState.isAnchorEdge && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-600/30 text-amber-300 border border-amber-500/40">
                                    SABİT KENAR
                                </span>
                            )}
                            {currentTorchState.sequenceStep && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-cyan-600/30 text-cyan-200 border border-cyan-500/40">
                                    ADIM {currentTorchState.sequenceStep}
                                </span>
                            )}

                            {/* Coordinates */}
                            <div className="flex items-center gap-2 bg-black/60 px-3 py-1 rounded-xl border border-white/10 font-mono text-[11px]">
                                <span className="text-slate-400">X: <strong className="text-white">{currentTorchState.x.toFixed(1)}</strong></span>
                                <span className="text-slate-400">Y: <strong className="text-white">{currentTorchState.y.toFixed(1)}</strong></span>
                                <span className="text-slate-500">|</span>
                                <span className="text-slate-400">F: <strong className="text-cyan-300">{currentTorchState.feedMmMin}</strong></span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
