/**
 * components/visualizers/ShaftDrawingSVG.tsx
 * 
 * Interactive 2D SVG CAD Workbench for Stepped Shafts (DIN 743 / ISO 128)
 * Full direct-manipulation on canvas:
 * - Drag shoulder boundaries to resize segment lengths
 * - Drag top edge to resize diameter
 * - Drag features (kama, segman, delik, pim, dişli) along the segment
 * - Drag supports (Yatak A, B) and radial loads
 * - On-canvas floating HUD for adding features & splitting segments
 * - Inline dimension editing on click
 */

'use client';

import React, { useMemo, useState, useRef } from 'react';
import { 
    ShaftSegment, 
    ShaftRadialLoad, 
    ShaftFeature,
    ShaftFeatureType,
    ShaftBearingSupport,
    getStandardUndercutDIN509,
    getStandardKeywayDIN6885
} from '@/modules/mechanical/ShaftDesign/engine';
import { 
    ZoomIn, 
    ZoomOut, 
    Maximize2, 
    Download, 
    Layers, 
    Scissors, 
    Trash2, 
    Plus, 
    Move, 
    ArrowLeftRight,
    ArrowUpDown,
    Check, 
    X, 
    Crosshair
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

interface ShaftDrawingSVGProps {
    totalLength: number;
    segments: ShaftSegment[];
    selectedSegmentId: string | null;
    selectedFeatureId: string | null;
    supportAPos: number;
    supportBPos: number;
    supportABearing?: ShaftBearingSupport;
    supportBBearing?: ShaftBearingSupport;
    radialLoads: ShaftRadialLoad[];
    torqueNm?: number;
    onSelectSegment?: (id: string) => void;
    onSelectFeature?: (id: string | null) => void;
    onUpdateSegment?: (id: string, updates: Partial<ShaftSegment>) => void;
    onMoveBoundary?: (boundaryIndex: number, newX: number) => void;
    onSplitSegment?: (segmentId: string, splitOffsetMm: number) => void;
    onRemoveSegment?: (id: string) => void;
    onAddFeature?: (segmentId: string, type: ShaftFeatureType) => void;
    onUpdateFeature?: (segmentId: string, featureId: string, updates: any) => void;
    onRemoveFeature?: (segmentId: string, featureId: string) => void;
    onSetSupports?: (a: number, b: number) => void;
    onOpenBearingModal?: (supportId: 'A' | 'B') => void;
    onUpdateRadialLoad?: (id: string, updates: Partial<ShaftRadialLoad>) => void;
    onOpenDetailModal?: (featureOrType?: string) => void;
    onToggleShoulderTransition?: (segmentIndex: number, transition: 'undercut' | 'radius') => void;
}

type DragMode = 
    | { type: 'boundary'; boundaryIndex: number; initialX: number }
    | { type: 'diameter'; segmentId: string; initialDia: number }
    | { type: 'feature'; segmentId: string; featureId: string; initialOffset: number }
    | { type: 'support'; target: 'A' | 'B'; initialX: number }
    | { type: 'load'; loadId: string; initialX: number; initialF: number }
    | { type: 'pan'; startClientX: number; startClientY: number; initialPanX: number; initialPanY: number };

export function ShaftDrawingSVG({
    totalLength,
    segments,
    selectedSegmentId,
    selectedFeatureId,
    supportAPos,
    supportBPos,
    supportABearing,
    supportBBearing,
    radialLoads,
    torqueNm = 0,
    onSelectSegment,
    onSelectFeature,
    onUpdateSegment,
    onMoveBoundary,
    onSplitSegment,
    onRemoveSegment,
    onAddFeature,
    onUpdateFeature,
    onRemoveFeature,
    onSetSupports,
    onOpenBearingModal,
    onUpdateRadialLoad,
    onOpenDetailModal,
    onToggleShoulderTransition
}: ShaftDrawingSVGProps) {
    const { language } = useI18nStore();
    const svgRef = useRef<SVGSVGElement | null>(null);

    // Canvas Navigation State
    const [zoom, setZoom] = useState(1.0);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    const [showDimensions, setShowDimensions] = useState(true);
    const [showLoads, setShowLoads] = useState(true);
    const [showCenterline, setShowCenterline] = useState(true);

    // Active Interactive Drag State
    const [dragState, setDragState] = useState<DragMode | null>(null);
    const [dragTooltip, setDragTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

    // On-Canvas Hover Cut/Split Indicator
    const [hoverSplit, setHoverSplit] = useState<{ segmentId: string; shaftX: number; localOffset: number } | null>(null);

    // Inline Dimension Editing Modal/Popup
    const [editingDim, setEditingDim] = useState<{
        type: 'segment_len' | 'segment_dia' | 'total_len' | 'load_f';
        id?: string;
        currentVal: number;
        screenX: number;
        screenY: number;
    } | null>(null);
    const [editInputVal, setEditInputVal] = useState<string>('');

    // Precalculate segment bounds and maximum diameter
    const { segmentBounds, maxDia } = useMemo(() => {
        let x = 0;
        let maxD = 20;
        const bounds: Array<{ seg: ShaftSegment; startX: number; endX: number; index: number }> = [];

        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            bounds.push({ seg, startX: x, endX: x + seg.length, index: i });
            x += seg.length;
            if (seg.diameter > maxD) maxD = seg.diameter;
        }

        return { segmentBounds: bounds, maxDia: maxD };
    }, [segments]);

    // Calculate effective radial envelope including features (gears, bearings, etc.)
    const effectiveMaxDia = useMemo(() => {
        let maxR = maxDia / 2;
        // Check gear tip diameters
        for (const seg of segments) {
            for (const feat of seg.features) {
                if (feat.type === 'gear' && (feat as any).tipDiameter) {
                    const rGear = (feat as any).tipDiameter / 2;
                    if (rGear > maxR) maxR = rGear;
                }
            }
        }
        // Check bearing outer diameters mounted on their segments
        if (supportABearing) {
            const segA = segmentBounds.find(b => supportAPos >= b.startX && supportAPos <= b.endX)?.seg;
            const dA = segA ? segA.diameter : (segments[0]?.diameter ?? 30);
            const rA = dA / 2 + Math.max(6, (supportABearing.outerDia - supportABearing.boreDia) / 2);
            if (rA > maxR) maxR = rA;
        }
        if (supportBBearing) {
            const segB = segmentBounds.find(b => supportBPos >= b.startX && supportBPos <= b.endX)?.seg;
            const dB = segB ? segB.diameter : (segments[segments.length - 1]?.diameter ?? 30);
            const rB = dB / 2 + Math.max(6, (supportBBearing.outerDia - supportBBearing.boreDia) / 2);
            if (rB > maxR) maxR = rB;
        }
        return Math.max(20, maxR * 2);
    }, [maxDia, segments, segmentBounds, supportABearing, supportBBearing, supportAPos, supportBPos]);

    const selectedSeg = segments.find(s => s.id === selectedSegmentId) ?? segments[0];
    const selectedSegBound = segmentBounds.find(b => b.seg.id === selectedSegmentId);

    // SVG Viewport coordinate setup (1040 x 500)
    const svgWidth = 1040;
    const svgHeight = 500;

    // Clearances for annotations:
    // Left/Right: 95px for chamfer leaders (e.g. 1.5x45°) and DIN 332 center drill callouts
    const marginLeft = 95;
    const marginRight = 95;
    const drawWidth = svgWidth - marginLeft - marginRight; // 850 px

    // Top/Bottom headroom:
    // Above shaft: 80px (diameter badges, chamfer leaders, radial load badge/arrows)
    // Below shaft: 120px (bearing symbols, bearing info badges, dimension lines)
    // Available height for the physical geometry: 500 - 80 - 120 = 300 px
    const topAnnotationSpace = 80;
    const bottomAnnotationSpace = 120;
    const drawHeight = svgHeight - topAnnotationSpace - bottomAnnotationSpace; // 300 px

    // True 1:1 Engineering CAD Scale (Isotropic uniform scale: 1mm in X === 1mm in Y)
    const fitScaleX = totalLength > 0 ? drawWidth / totalLength : 2.5;
    const fitScaleY = effectiveMaxDia > 0 ? drawHeight / effectiveMaxDia : 2.5;
    const baseScale = Math.min(fitScaleX, fitScaleY);
    // Dynamic scale: min 0.04 supports massive industrial shafts/rotors; max 3.5 prevents microscopic shafts from blowing up
    const scale = Math.max(0.04, Math.min(3.5, baseScale));
    const scaleX = scale;
    const scaleY = scale;

    // Horizontally center the shaft on canvas
    const shaftPixelWidth = totalLength * scale;
    const offsetX = Math.max(0, (drawWidth - shaftPixelWidth) / 2);

    // Centerline is placed so top headroom (80px) and bottom headroom (120px) balance exactly
    const centerY = topAnnotationSpace + drawHeight / 2; // 80 + 150 = 230 px

    const toSvgX = (shaftX: number) => marginLeft + offsetX + shaftX * scale;
    const toSvgY = (shaftR: number) => centerY - shaftR * scale;
    const fromSvgX = (svgX: number) => (svgX - marginLeft - offsetX) / scale;
    const fromSvgY = (svgY: number) => (centerY - svgY) / scale;

    // Convert screen client coordinates to SVG user units
    const getSvgCoordinates = (e: React.PointerEvent) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();
        // Account for viewbox scaling and user pan/zoom
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        const normalizedX = (clientX / rect.width) * svgWidth;
        const normalizedY = (clientY / rect.height) * svgHeight;
        return { x: normalizedX, y: normalizedY };
    };

    // POINTER DOWN HANDLERS FOR DRAGGING
    const startBoundaryDrag = (e: React.PointerEvent, boundaryIndex: number) => {
        e.stopPropagation();
        (e.target as Element).setPointerCapture(e.pointerId);
        const { x } = getSvgCoordinates(e);
        const shaftX = fromSvgX(x);
        setDragState({ type: 'boundary', boundaryIndex, initialX: shaftX });
    };

    const startDiameterDrag = (e: React.PointerEvent, seg: ShaftSegment) => {
        e.stopPropagation();
        (e.target as Element).setPointerCapture(e.pointerId);
        setDragState({ type: 'diameter', segmentId: seg.id, initialDia: seg.diameter });
    };

    const startFeatureDrag = (e: React.PointerEvent, segmentId: string, featureId: string, currentOffset: number) => {
        e.stopPropagation();
        (e.target as Element).setPointerCapture(e.pointerId);
        onSelectFeature?.(featureId);
        setDragState({ type: 'feature', segmentId, featureId, initialOffset: currentOffset });
    };

    const startSupportDrag = (e: React.PointerEvent, target: 'A' | 'B', currentX: number) => {
        e.stopPropagation();
        (e.target as Element).setPointerCapture(e.pointerId);
        setDragState({ type: 'support', target, initialX: currentX });
    };

    const startLoadDrag = (e: React.PointerEvent, load: ShaftRadialLoad) => {
        e.stopPropagation();
        (e.target as Element).setPointerCapture(e.pointerId);
        setDragState({ type: 'load', loadId: load.id, initialX: load.position, initialF: load.forceN });
    };

    // Canvas Background Pan
    const startCanvasPan = (e: React.PointerEvent) => {
        if (e.button === 0 || e.button === 1) { // Left or middle click on background
            setDragState({
                type: 'pan',
                startClientX: e.clientX,
                startClientY: e.clientY,
                initialPanX: panX,
                initialPanY: panY
            });
        }
    };

    // GLOBAL POINTER MOVE
    const handlePointerMove = (e: React.PointerEvent) => {
        const { x: svgX, y: svgY } = getSvgCoordinates(e);
        const shaftX = fromSvgX(svgX);
        const shaftR = fromSvgY(svgY);

        if (!dragState) {
            // Hover check for segment splitting
            if (e.altKey || true) {
                for (const b of segmentBounds) {
                    if (shaftX >= b.startX + 10 && shaftX <= b.endX - 10 && Math.abs(shaftR) <= b.seg.diameter / 2 + 5) {
                        setHoverSplit({
                            segmentId: b.seg.id,
                            shaftX: Math.round(shaftX),
                            localOffset: Math.round(shaftX - b.startX)
                        });
                        return;
                    }
                }
            }
            setHoverSplit(null);
            return;
        }

        // Active Dragging Logic
        if (dragState.type === 'boundary') {
            // Snap to 1mm or 5mm
            const snappedX = Math.round(shaftX / 5) * 5;
            onMoveBoundary?.(dragState.boundaryIndex, snappedX);
            setDragTooltip({
                text: `Omuz Konumu: ${snappedX} mm`,
                x: toSvgX(snappedX),
                y: centerY - (maxDia / 2) * scaleY - 35
            });
        } else if (dragState.type === 'diameter') {
            // Radius to diameter
            const rawDia = Math.abs(shaftR) * 2;
            const snappedDia = Math.max(8, Math.min(1000, Math.round(rawDia)));
            onUpdateSegment?.(dragState.segmentId, { diameter: snappedDia });
            setDragTooltip({
                text: `${t12(language, 'Dia', 'Çap')}: Ø${snappedDia} mm`,
                x: svgX,
                y: toSvgY(snappedDia / 2) - 15
            });
        } else if (dragState.type === 'feature') {
            const bound = segmentBounds.find(b => b.seg.id === dragState.segmentId);
            if (bound) {
                const localOffset = Math.max(2, Math.min(bound.seg.length - 10, Math.round(shaftX - bound.startX)));
                onUpdateFeature?.(dragState.segmentId, dragState.featureId, { offsetFromStart: localOffset });
                setDragTooltip({
                    text: `${t12(language, 'Pos', 'Konum')}: +${localOffset} mm`,
                    x: toSvgX(bound.startX + localOffset),
                    y: toSvgY(bound.seg.diameter / 2) - 25
                });
            }
        } else if (dragState.type === 'support') {
            const snappedX = Math.max(5, Math.min(totalLength - 5, Math.round(shaftX / 5) * 5));
            if (dragState.target === 'A') {
                onSetSupports?.(snappedX, supportBPos);
                setDragTooltip({ text: `${t12(language, 'Bearing A', 'Yatak A')}: ${snappedX} mm`, x: toSvgX(snappedX), y: centerY + 45 });
            } else {
                onSetSupports?.(supportAPos, snappedX);
                setDragTooltip({ text: `${t12(language, 'Bearing B', 'Yatak B')}: ${snappedX} mm`, x: toSvgX(snappedX), y: centerY + 45 });
            }
        } else if (dragState.type === 'load') {
            const snappedX = Math.max(5, Math.min(totalLength - 5, Math.round(shaftX / 5) * 5));
            onUpdateRadialLoad?.(dragState.loadId, { position: snappedX });
            const segAtLoad = segmentBounds.find(b => snappedX >= b.startX && snappedX <= b.endX)?.seg;
            const segDia = segAtLoad ? segAtLoad.diameter : maxDia;
            setDragTooltip({ text: `${t12(language, 'Load Pos', 'Yük Konumu')}: ${snappedX} mm`, x: toSvgX(snappedX), y: toSvgY(segDia / 2) - 60 });
        } else if (dragState.type === 'pan') {
            const dx = e.clientX - dragState.startClientX;
            const dy = e.clientY - dragState.startClientY;
            setPanX(dragState.initialPanX + dx);
            setPanY(dragState.initialPanY + dy);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (dragState) {
            setDragState(null);
            setDragTooltip(null);
        }
    };

    // Open Inline Dimension Editor
    const openDimEdit = (type: 'segment_len' | 'segment_dia' | 'total_len', val: number, screenX: number, screenY: number, id?: string) => {
        setEditingDim({ type, id, currentVal: val, screenX, screenY });
        setEditInputVal(String(val));
    };

    const submitDimEdit = () => {
        if (!editingDim) return;
        const num = Number(editInputVal);
        if (Number.isFinite(num) && num > 0) {
            if (editingDim.type === 'segment_len' && editingDim.id) {
                onUpdateSegment?.(editingDim.id, { length: Math.round(num) });
            } else if (editingDim.type === 'segment_dia' && editingDim.id) {
                onUpdateSegment?.(editingDim.id, { diameter: Math.round(num) });
            } else if (editingDim.type === 'total_len') {
                // scale segments proportionally or adjust
                onMoveBoundary?.(segments.length, Math.round(num));
            }
        }
        setEditingDim(null);
    };

    // Export SVG
    const exportSVG = () => {
        const svgEl = svgRef.current;
        if (!svgEl) return;
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svgEl);
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alucalc_shaft_drawing_${Math.round(totalLength)}mm.svg`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Mouse Wheel Zoom
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const zoomDelta = e.deltaY > 0 ? -0.12 : 0.12;
        setZoom(prev => Math.max(0.2, Math.min(3.5, Number((prev + zoomDelta).toFixed(2)))));
    };

    return (
        <div className="relative w-full h-full flex flex-col bg-[var(--bg-0)] border border-[var(--line)] rounded-lg overflow-hidden select-none font-mono">
            {/* TOP CAD WORKBENCH TOOLBAR */}
            <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[var(--bg-1)] border-b border-[var(--line)] text-xs text-[var(--alu)] gap-2 z-10">
                <div className="flex items-center gap-3">
                    <span className="text-xs uppercase font-bold text-[var(--cyan)] tracking-wider flex items-center gap-1.5">
                        <Crosshair size={15} /> {t12(language, '2D CAD Visual Workspace', '2D CAD Görsel Çalışma Alanı')}
                    </span>
                    <span className="text-[10px] text-[var(--alu-dim)] px-2 py-0.5 rounded bg-[var(--bg-3)] border border-[var(--line)]">
                        L={Math.round(totalLength)} mm · {segments.length} {t12(language, 'Segments', 'Kademe')}
                    </span>
                </div>

                {/* View Filters & Helpers */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setShowDimensions(!showDimensions)}
                        className={`px-2 py-1 rounded text-[10px] border transition-colors ${
                            showDimensions ? 'bg-[var(--cyan)]/20 border-[var(--cyan)]/50 text-[var(--cyan)]' : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)]'
                        }`}
                    >
                        {t12(language, 'Dimensions', 'Ölçüler')}
                    </button>
                    <button
                        onClick={() => setShowLoads(!showLoads)}
                        className={`px-2 py-1 rounded text-[10px] border transition-colors ${
                            showLoads ? 'bg-[var(--warn)]/20 border-[var(--warn)]/50 text-[var(--warn)]' : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)]'
                        }`}
                    >
                        {t12(language, 'Bearing/Load', 'Yatak/Yük')}
                    </button>

                    <div className="w-[1px] h-4 bg-[var(--line)] mx-1" />

                    <button
                        onClick={() => setZoom(prev => Math.max(0.2, prev - 0.15))}
                        className="p-1 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-[var(--alu)] border border-[var(--line)]"
                        title={t12(language, 'Zoom Out', 'Uzaklaş')}
                    >
                        <ZoomOut size={13} />
                    </button>
                    <span className="text-[10px] px-1 text-[var(--alu-dim)]">{Math.round(zoom * 100)}%</span>
                    <button
                        onClick={() => setZoom(prev => Math.min(3.5, prev + 0.15))}
                        className="p-1 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-[var(--alu)] border border-[var(--line)]"
                        title={t12(language, 'Zoom In', 'Yakınlaş')}
                    >
                        <ZoomIn size={13} />
                    </button>
                    <button
                        onClick={() => { setZoom(1.0); setPanX(0); setPanY(0); }}
                        className="p-1 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-[var(--alu)] border border-[var(--line)] flex items-center gap-1 text-[10px] px-1.5"
                        title={t12(language, 'Fit to Screen / Reset', 'Ekrana Sığdır / Sıfırla')}
                    >
                        <Maximize2 size={13} /> {t12(language, 'Fit', 'Sığdır')}
                    </button>
                    <button
                        onClick={exportSVG}
                        className="p-1 rounded bg-[var(--cyan)]/10 hover:bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/40 ml-1 flex items-center gap-1 text-[10px] px-2 font-bold"
                        title={t12(language, 'Download 2D SVG Vector Drawing', '2D SVG Vektör Çizimini İndir')}
                    >
                        <Download size={13} /> {t12(language, 'Download SVG', 'SVG İndir')}
                    </button>
                </div>
            </div>

            {/* DIRECT SVG WORKBENCH */}
            <div 
                className="relative flex-1 w-full overflow-hidden flex items-center justify-center p-2 bg-[var(--bg-0)] cursor-crosshair"
                onPointerDown={startCanvasPan}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onWheel={handleWheel}
            >
                <svg
                    ref={svgRef}
                    id="shaft-cad-svg"
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-auto max-h-[550px]"
                    style={{
                        transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
                        transformOrigin: 'center center',
                        transition: dragState?.type === 'pan' ? 'none' : 'transform 0.08s ease-out'
                    }}
                >
                    <defs>
                        {/* Blueprint Grid */}
                        <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0e1624" strokeWidth="0.5" />
                        </pattern>

                        {/* Steel Hatching */}
                        <pattern id="steelHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="8" stroke="#1f3047" strokeWidth="0.8" />
                        </pattern>

                        {/* Dimension Arrowhead */}
                        <marker id="dimArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <path d="M 0 1.5 L 6 3 L 0 4.5 Z" fill="#7aa2ff" />
                        </marker>
                        <marker id="dimArrowRev" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
                            <path d="M 6 1.5 L 0 3 L 6 4.5 Z" fill="#7aa2ff" />
                        </marker>

                        {/* Load Force Marker */}
                        <marker id="loadArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                            <path d="M 1 2 L 7 4 L 1 6 Z" fill="#e85d5d" />
                        </marker>
                    </defs>

                    {/* Background Grid */}
                    <rect width={svgWidth} height={svgHeight} fill="url(#cadGrid)" />

                    {/* SHAFT SEGMENTS WITH ISO 128 CHAMFERS (NO SHARP CORNERS) */}
                    {segmentBounds.map(({ seg, startX, endX, index }) => {
                        const x1 = toSvgX(startX);
                        const x2 = toSvgX(endX);
                        const w = x2 - x1;
                        const r = seg.diameter / 2;
                        const yTop = toSvgY(r);
                        const yBot = toSvgY(-r);
                        const h = yBot - yTop;
                        const isSelected = selectedSegmentId === seg.id;
                        const isFirst = index === 0;
                        const isLast = index === segmentBounds.length - 1;

                        const prevSeg = index > 0 ? segmentBounds[index - 1].seg : null;
                        const nextSeg = index < segmentBounds.length - 1 ? segmentBounds[index + 1].seg : null;

                        // Left transition:
                        const isLeftFirst = index === 0;
                        const isLeftOuter = isLeftFirst || (prevSeg !== null && seg.diameter > prevSeg.diameter);
                        const isLeftInner = prevSeg !== null && seg.diameter < prevSeg.diameter;

                        // Right transition:
                        const isRightLast = index === segmentBounds.length - 1;
                        const isRightOuter = isRightLast || (nextSeg !== null && seg.diameter > nextSeg.diameter);
                        const isRightInner = nextSeg !== null && seg.diameter < nextSeg.diameter;

                        const maxChamfer = Math.min(seg.length * 0.35, (seg.diameter / 2) * 0.4);

                        const cL = isLeftOuter ? Math.max(0, Math.min(
                            seg.chamferLeft !== undefined ? seg.chamferLeft : (isFirst ? 1.5 : 1.0),
                            maxChamfer
                        )) : 0;

                        const cR = isRightOuter ? Math.max(0, Math.min(
                            seg.chamferRight !== undefined ? seg.chamferRight : (isLast ? 1.5 : 1.0),
                            maxChamfer
                        )) : 0;

                        // 45° Chamfer: horizontal span (cLx) MUST equal vertical span (cLy)
                        const cL_px = cL * scale;
                        const cR_px = cR * scale;
                        const cLx = cL_px;
                        const cLy = cL_px;
                        const cRx = cR_px;
                        const cRy = cR_px;

                        // Cubic Bézier constant for 90° circular arcs (guarantees convex hull bounding: NO outward tooth/bulges)
                        const k = 0.5523;

                        // Right Inner Corner Transition (when seg is smaller than nextSeg)
                        const rightTrans = seg.shoulderTransition ?? 'undercut';
                        const rightRadVal = seg.shoulderFilletRadius || 1.5;
                        const rightUc = getStandardUndercutDIN509(seg.diameter, seg.shoulderUndercutForm ?? 'E');
                        const rightUcW = Math.max(5, Math.min(13, rightUc.grooveWidth * scale * 1.3));
                        const rightUcT = Math.max(2.5, Math.min(6, 1.2 + rightUc.depth * scale * 2.8));
                        const rightUcR = Math.max(2, Math.min(4.5, rightUcT * 0.75));
                        const rightFlatW = Math.max(1.5, Math.min(4, (rightUcW - rightUcR) * 0.35));
                        const rightRx = Math.max(3, rightRadVal * scale);

                        // Left Inner Corner Transition (when seg is smaller than prevSeg)
                        const leftTrans = seg.shoulderTransition ?? 'undercut';
                        const leftRadVal = seg.shoulderFilletRadius || 1.5;
                        const leftUc = getStandardUndercutDIN509(seg.diameter, seg.shoulderUndercutForm ?? 'E');
                        const leftUcW = Math.max(5, Math.min(13, leftUc.grooveWidth * scale * 1.3));
                        const leftUcT = Math.max(2.5, Math.min(6, 1.2 + leftUc.depth * scale * 2.8));
                        const leftUcR = Math.max(2, Math.min(4.5, leftUcT * 0.75));
                        const leftFlatW = Math.max(1.5, Math.min(4, (leftUcW - leftUcR) * 0.35));
                        const leftRx = Math.max(3, leftRadVal * scale);

                        // Authentic CAD Contour Path: seamlessly embeds DIN 509 relief grooves & DIN 743 fillets into metal
                        const startTopLeft = isLeftOuter
                            ? `M ${x1} ${yTop + cLy} L ${x1 + cLx} ${yTop}`
                            : (isLeftInner
                                ? (leftTrans === 'undercut'
                                    ? `M ${x1} ${yTop + leftUcT - leftUcR} C ${x1} ${yTop + leftUcT - leftUcR * (1 - k)}, ${x1 + leftUcR * (1 - k)} ${yTop + leftUcT}, ${x1 + leftUcR} ${yTop + leftUcT} L ${x1 + leftUcR + leftFlatW} ${yTop + leftUcT} L ${x1 + leftUcW} ${yTop}`
                                    : `M ${x1} ${yTop - leftRx} C ${x1} ${yTop - leftRx * (1 - k)}, ${x1 + leftRx * (1 - k)} ${yTop}, ${x1 + leftRx} ${yTop}`)
                                : `M ${x1} ${yTop}`);

                        const topEdgeToRight = isRightOuter
                            ? `L ${x2 - cRx} ${yTop} L ${x2} ${yTop + cRy}`
                            : (isRightInner
                                ? (rightTrans === 'undercut'
                                    ? `L ${x2 - rightUcW} ${yTop} L ${x2 - rightUcR - rightFlatW} ${yTop + rightUcT} L ${x2 - rightUcR} ${yTop + rightUcT} C ${x2 - rightUcR * (1 - k)} ${yTop + rightUcT}, ${x2} ${yTop + rightUcT - rightUcR * (1 - k)}, ${x2} ${yTop + rightUcT - rightUcR}`
                                    : `L ${x2 - rightRx} ${yTop} C ${x2 - rightRx * (1 - k)} ${yTop}, ${x2} ${yTop - rightRx * (1 - k)}, ${x2} ${yTop - rightRx}`)
                                : `L ${x2} ${yTop}`);

                        const rightEdgeToBot = isRightOuter
                            ? `L ${x2} ${yBot - cRy}`
                            : (isRightInner
                                ? (rightTrans === 'undercut'
                                    ? `L ${x2} ${yBot - rightUcT + rightUcR}`
                                    : `L ${x2} ${yBot + rightRx}`)
                                : `L ${x2} ${yBot}`);

                        const rightBotCorner = isRightOuter
                            ? `L ${x2 - cRx} ${yBot}`
                            : (isRightInner
                                ? (rightTrans === 'undercut'
                                    ? `C ${x2} ${yBot - rightUcT + rightUcR * (1 - k)}, ${x2 - rightUcR * (1 - k)} ${yBot - rightUcT}, ${x2 - rightUcR} ${yBot - rightUcT} L ${x2 - rightUcR - rightFlatW} ${yBot - rightUcT} L ${x2 - rightUcW} ${yBot}`
                                    : `C ${x2} ${yBot + rightRx * (1 - k)}, ${x2 - rightRx * (1 - k)} ${yBot}, ${x2 - rightRx} ${yBot}`)
                                : '');

                        const xLeftCornerTarget = isLeftOuter
                            ? (x1 + cLx)
                            : (isLeftInner
                                ? (x1 + (leftTrans === 'undercut' ? leftUcW : leftRx))
                                : x1);

                        const bottomHorizontalLine = `L ${xLeftCornerTarget} ${yBot}`;

                        const leftBotCorner = isLeftOuter
                            ? `L ${x1} ${yBot - cLy}`
                            : (isLeftInner
                                ? (leftTrans === 'undercut'
                                    ? `L ${x1 + leftUcR + leftFlatW} ${yBot - leftUcT} L ${x1 + leftUcR} ${yBot - leftUcT} C ${x1 + leftUcR * (1 - k)} ${yBot - leftUcT}, ${x1} ${yBot - leftUcT + leftUcR * (1 - k)}, ${x1} ${yBot - leftUcT + leftUcR}`
                                    : `C ${x1 + leftRx * (1 - k)} ${yBot}, ${x1} ${yBot + leftRx * (1 - k)}, ${x1} ${yBot + leftRx}`)
                                : '');

                        const leftEdgeUp = `L ${x1} ${isLeftOuter ? yTop + cLy : (isLeftInner ? (leftTrans === 'undercut' ? yTop + leftUcT - leftUcR : yTop - leftRx) : yTop)}`;

                        const contourPath = `
                            ${startTopLeft}
                            ${topEdgeToRight}
                            ${rightEdgeToBot}
                            ${rightBotCorner}
                            ${bottomHorizontalLine}
                            ${leftBotCorner}
                            ${leftEdgeUp}
                            Z
                        `;

                        return (
                            <g key={seg.id} className="group">
                                {/* Segment Body with Seamless Machined Contour & Steel Hatching */}
                                <path
                                    d={contourPath}
                                    fill={isSelected ? '#122338' : '#0b1320'}
                                    stroke={isSelected ? '#3ad0e6' : '#4d6785'}
                                    strokeWidth={isSelected ? 2 : 1.2}
                                    onClick={(e) => { e.stopPropagation(); onSelectSegment?.(seg.id); }}
                                    className="cursor-pointer transition-all hover:stroke-[var(--cyan)] hover:fill-[#15273d]"
                                />
                                <path
                                    d={contourPath}
                                    fill="url(#steelHatch)"
                                    opacity={0.6}
                                    pointerEvents="none"
                                />

                                {/* ISO 128 Chamfer Crease Lines (Shows 3D conical bevel turn on free outer ends only) */}
                                {isFirst && cLx > 0.5 && (
                                    <line
                                        x1={x1 + cLx}
                                        y1={yTop}
                                        x2={x1 + cLx}
                                        y2={yBot}
                                        stroke={isSelected ? '#3ad0e6' : '#3d526b'}
                                        strokeWidth="0.8"
                                        strokeDasharray="2,1"
                                        pointerEvents="none"
                                    />
                                )}
                                {isLast && cRx > 0.5 && (
                                    <line
                                        x1={x2 - cRx}
                                        y1={yTop}
                                        x2={x2 - cRx}
                                        y2={yBot}
                                        stroke={isSelected ? '#3ad0e6' : '#3d526b'}
                                        strokeWidth="0.8"
                                        strokeDasharray="2,1"
                                        pointerEvents="none"
                                    />
                                )}

                                {/* Step Vertical Shoulder Transition Face Lines & Grinding Relinquish Accents */}
                                {nextSeg && seg.diameter !== nextSeg.diameter && (() => {
                                    const d1 = seg.diameter;
                                    const d2 = nextSeg.diameter;
                                    const y1Top = toSvgY(d1 / 2);
                                    const y1Bot = toSvgY(-d1 / 2);
                                    const y2Top = toSvgY(d2 / 2);
                                    const y2Bot = toSvgY(-d2 / 2);

                                    const isStepUp = d1 < d2;
                                    const smallerSeg = isStepUp ? seg : nextSeg;
                                    const smallerIdx = isStepUp ? index : index + 1;
                                    const trans = smallerSeg.shoulderTransition ?? 'undercut';
                                    const radVal = smallerSeg.shoulderFilletRadius || 1.5;

                                    // Undercut & fillet params for the smaller segment
                                    const uc = getStandardUndercutDIN509(smallerSeg.diameter, smallerSeg.shoulderUndercutForm ?? 'E');
                                    const ucW = Math.max(5, Math.min(13, uc.grooveWidth * scale * 1.3));
                                    const ucT = Math.max(2.5, Math.min(6, 1.2 + uc.depth * scale * 2.8));
                                    const ucR = Math.max(2, Math.min(4.5, ucT * 0.75));
                                    const flatW = Math.max(1.5, Math.min(4, (ucW - ucR) * 0.35));
                                    const rx = Math.max(3, radVal * scale);

                                    // Outer chamfer on larger cylinder
                                    const outerChamfer = (isStepUp 
                                        ? (nextSeg.chamferLeft !== undefined ? nextSeg.chamferLeft : 1.0) 
                                        : (seg.chamferRight !== undefined ? seg.chamferRight : 1.0)) * scale;

                                    const yTopOuter = isStepUp ? (y2Top + outerChamfer) : (y1Top + outerChamfer);
                                    const yBotOuter = isStepUp ? (y2Bot - outerChamfer) : (y1Bot - outerChamfer);

                                    // Inner meeting point seamlessly connecting with the smaller segment's groove
                                    const ySmallTop = isStepUp ? y1Top : y2Top;
                                    const ySmallBot = isStepUp ? y1Bot : y2Bot;
                                    const yTopInner = trans === 'undercut' ? ySmallTop + ucT - ucR : ySmallTop - rx;
                                    const yBotInner = trans === 'undercut' ? ySmallBot - ucT + ucR : ySmallBot + rx;

                                    return (
                                        <g key={`shoulder-${seg.id}`}>
                                            {/* Clean Vertical Shoulder Face Line meeting the groove root exactly */}
                                            <line
                                                x1={x2}
                                                y1={yTopOuter}
                                                x2={x2}
                                                y2={yTopInner}
                                                stroke={isSelected ? '#3ad0e6' : '#4d6785'}
                                                strokeWidth={1.4}
                                            />
                                            <line
                                                x1={x2}
                                                y1={yBotOuter}
                                                x2={x2}
                                                y2={yBotInner}
                                                stroke={isSelected ? '#3ad0e6' : '#4d6785'}
                                                strokeWidth={1.4}
                                            />

                                            {/* Precision Ground Surface Accent Stroke (DIN 509 Form E / F) */}
                                            {trans === 'undercut' ? (
                                                <g pointerEvents="none">
                                                    {isStepUp ? (
                                                        <>
                                                            <path
                                                                d={`M ${x2 - ucW} ${y1Top} L ${x2 - ucR - flatW} ${y1Top + ucT} L ${x2 - ucR} ${y1Top + ucT} C ${x2 - ucR * (1 - k)} ${y1Top + ucT}, ${x2} ${y1Top + ucT - ucR * (1 - k)}, ${x2} ${y1Top + ucT - ucR}`}
                                                                fill="none"
                                                                stroke="#38bdf8"
                                                                strokeWidth="1.2"
                                                            />
                                                            <path
                                                                d={`M ${x2 - ucW} ${y1Bot} L ${x2 - ucR - flatW} ${y1Bot - ucT} L ${x2 - ucR} ${y1Bot - ucT} C ${x2 - ucR * (1 - k)} ${y1Bot - ucT}, ${x2} ${y1Bot - ucT + ucR * (1 - k)}, ${x2} ${y1Bot - ucT + ucR}`}
                                                                fill="none"
                                                                stroke="#38bdf8"
                                                                strokeWidth="1.2"
                                                            />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <path
                                                                d={`M ${x2} ${y2Top + ucT - ucR} C ${x2} ${y2Top + ucT - ucR * (1 - k)}, ${x2 + ucR * (1 - k)} ${y2Top + ucT}, ${x2 + ucR} ${y2Top + ucT} L ${x2 + ucR + flatW} ${y2Top + ucT} L ${x2 + ucW} ${y2Top}`}
                                                                fill="none"
                                                                stroke="#38bdf8"
                                                                strokeWidth="1.2"
                                                            />
                                                            <path
                                                                d={`M ${x2} ${y2Bot - ucT + ucR} C ${x2} ${y2Bot - ucT + ucR * (1 - k)}, ${x2 + ucR * (1 - k)} ${y2Bot - ucT}, ${x2 + ucR} ${y2Bot - ucT} L ${x2 + ucR + flatW} ${y2Bot - ucT} L ${x2 + ucW} ${y2Bot}`}
                                                                fill="none"
                                                                stroke="#38bdf8"
                                                                strokeWidth="1.2"
                                                            />
                                                        </>
                                                    )}
                                                </g>
                                            ) : (
                                                <g pointerEvents="none">
                                                    {isStepUp ? (
                                                        <>
                                                            <path
                                                                d={`M ${x2 - rx} ${y1Top} C ${x2 - rx * (1 - k)} ${y1Top}, ${x2} ${y1Top - rx * (1 - k)}, ${x2} ${y1Top - rx}`}
                                                                fill="none"
                                                                stroke="#34d399"
                                                                strokeWidth="1.4"
                                                            />
                                                            <path
                                                                d={`M ${x2 - rx} ${y1Bot} C ${x2 - rx * (1 - k)} ${y1Bot}, ${x2} ${y1Bot + rx * (1 - k)}, ${x2} ${y1Bot + rx}`}
                                                                fill="none"
                                                                stroke="#34d399"
                                                                strokeWidth="1.4"
                                                            />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <path
                                                                d={`M ${x2} ${y2Top - rx} C ${x2} ${y2Top - rx * (1 - k)}, ${x2 + rx * (1 - k)} ${y2Top}, ${x2 + rx} ${y2Top}`}
                                                                fill="none"
                                                                stroke="#34d399"
                                                                strokeWidth="1.4"
                                                            />
                                                            <path
                                                                d={`M ${x2} ${y2Bot + rx} C ${x2} ${y2Bot + rx * (1 - k)}, ${x2 + rx * (1 - k)} ${y2Bot}, ${x2 + rx} ${y2Bot}`}
                                                                fill="none"
                                                                stroke="#34d399"
                                                                strokeWidth="1.4"
                                                            />
                                                        </>
                                                    )}
                                                </g>
                                            )}

                                            {/* INTERACTIVE SHOULDER TOGGLE BADGE (One-click toggle between DIN 509 and Radius) */}
                                            <g
                                                transform={`translate(${x2}, ${Math.min(y1Top, y2Top) - 16})`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const nextTrans = trans === 'undercut' ? 'radius' : 'undercut';
                                                    onToggleShoulderTransition?.(smallerIdx, nextTrans);
                                                }}
                                                className="cursor-pointer group/trans"
                                            >
                                                {trans === 'undercut' ? (
                                                    <g>
                                                        <rect x="-26" y="-8.5" width="52" height="17" rx="3.5" fill="#082f49" stroke="#38bdf8" strokeWidth="1" className="group-hover/trans:fill-[#0c4a6e] group-hover/trans:stroke-white transition-colors" />
                                                        <text x="0" y="3.5" textAnchor="middle" fontSize="7.5" fill="#38bdf8" fontWeight="bold" fontFamily="monospace">⚙️ DIN 509</text>
                                                    </g>
                                                ) : (
                                                    <g>
                                                        <rect x="-22" y="-8.5" width="44" height="17" rx="3.5" fill="#064e3b" stroke="#34d399" strokeWidth="1" className="group-hover/trans:fill-[#065f46] group-hover/trans:stroke-white transition-colors" />
                                                        <text x="0" y="3.5" textAnchor="middle" fontSize="7.5" fill="#34d399" fontWeight="bold" fontFamily="monospace">⌒ R{radVal}</text>
                                                    </g>
                                                )}
                                            </g>
                                        </g>
                                    );
                                })()}

                                {/* Chamfer Callout Annotations on Shaft Ends (Smart placement preventing margin clipping) */}
                                {isFirst && cL > 0 && showDimensions && (() => {
                                    const calloutX = x1 + cLx / 2;
                                    const calloutY = yTop + cLy / 2;
                                    const angleRight = (calloutX - 55) < 15;
                                    const midX = angleRight ? calloutX + 16 : calloutX - 16;
                                    const midY = yTop - 16;
                                    const endX = angleRight ? midX + 32 : midX - 32;
                                    return (
                                        <g pointerEvents="none">
                                            <polyline
                                                points={`${calloutX},${calloutY} ${midX},${midY} ${endX},${midY}`}
                                                fill="none"
                                                stroke="#7aa2ff"
                                                strokeWidth="0.9"
                                            />
                                            <circle cx={calloutX} cy={calloutY} r="2" fill="#7aa2ff" />
                                            <text
                                                x={angleRight ? endX + 3 : endX - 3}
                                                y={midY - 2}
                                                textAnchor={angleRight ? "start" : "end"}
                                                fontSize="8.5"
                                                fill="#7aa2ff"
                                                fontWeight="bold"
                                                fontFamily="monospace"
                                            >
                                                {cL}×45°
                                            </text>
                                        </g>
                                    );
                                })()}
                                {isLast && cR > 0 && showDimensions && (() => {
                                    const calloutX = x2 - cRx / 2;
                                    const calloutY = yTop + cRy / 2;
                                    const angleLeft = (calloutX + 55) > (svgWidth - 25);
                                    const midX = angleLeft ? calloutX - 16 : calloutX + 16;
                                    const midY = yTop - 16;
                                    const endX = angleLeft ? midX - 32 : midX + 32;
                                    return (
                                        <g pointerEvents="none">
                                            <polyline
                                                points={`${calloutX},${calloutY} ${midX},${midY} ${endX},${midY}`}
                                                fill="none"
                                                stroke="#7aa2ff"
                                                strokeWidth="0.9"
                                            />
                                            <circle cx={calloutX} cy={calloutY} r="2" fill="#7aa2ff" />
                                            <text
                                                x={angleLeft ? endX - 3 : endX + 3}
                                                y={midY - 2}
                                                textAnchor={angleLeft ? "end" : "start"}
                                                fontSize="8.5"
                                                fill="#7aa2ff"
                                                fontWeight="bold"
                                                fontFamily="monospace"
                                            >
                                                {cR}×45°
                                            </text>
                                        </g>
                                    );
                                })()}

                                {/* TOP DIAMETER RESIZE DRAG HANDLE (Subtle: visible on hover only to avoid cluttering CAD drawing) */}
                                <g 
                                    transform={`translate(${(x1 + x2) / 2}, ${yTop})`}
                                    onPointerDown={(e) => startDiameterDrag(e, seg)}
                                    className="cursor-ns-resize group/diaHandle opacity-0 group-hover:opacity-75 transition-opacity"
                                >
                                    <rect
                                        x="-16"
                                        y="-5"
                                        width="32"
                                        height="10"
                                        fill={isSelected ? '#3ad0e6' : '#24344d'}
                                        rx="3"
                                        stroke="#ffffff"
                                        strokeWidth="0.8"
                                        className="hover:fill-[var(--warn)]"
                                    />
                                    <line x1="-8" y1="0" x2="8" y2="0" stroke="#ffffff" strokeWidth="1" />
                                    <polyline points="-4,-2 0,-4 4,-2" fill="none" stroke="#ffffff" strokeWidth="1" />
                                    <polyline points="-4,2 0,4 4,2" fill="none" stroke="#ffffff" strokeWidth="1" />
                                </g>

                                {/* Segment S-Index badge inside */}
                                {w > 30 && (
                                    <text
                                        x={x1 + w / 2}
                                        y={centerY + 3}
                                        textAnchor="middle"
                                        fill={isSelected ? '#3ad0e6' : '#728294'}
                                        fontSize="9.5"
                                        fontWeight="bold"
                                        pointerEvents="none"
                                    >
                                        S{index + 1}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* SHOULDER BOUNDARY RESIZE HANDLES (Horizontal Drag Grips between steps) */}
                    {segmentBounds.map(({ seg, endX, index }) => {
                        const boundX = toSvgX(endX);
                        const isLast = index === segmentBounds.length - 1;

                        return (
                            <g 
                                key={`bound-handle-${index}`}
                                transform={`translate(${boundX}, ${centerY})`}
                                onPointerDown={(e) => startBoundaryDrag(e, index + 1)}
                                className="cursor-ew-resize group/bHandle"
                            >
                                {/* Invisible wide hit area */}
                                <rect x="-8" y="-70" width="16" height="140" fill="transparent" />
                                
                                {/* Subtle Drag Guideline (Only visible on hover or during drag to avoid slicing across CAD drawing) */}
                                <line 
                                    x1="0" 
                                    y1="-50" 
                                    x2="0" 
                                    y2="50" 
                                    stroke="#3ad0e6" 
                                    strokeWidth="1.5" 
                                    strokeDasharray="3,2" 
                                    className="opacity-0 group-hover/bHandle:opacity-50 transition-opacity" 
                                />
                                <g className="opacity-40 group-hover/bHandle:opacity-100 transition-opacity">
                                    <circle cx="0" cy="0" r="7" fill="#0c1016" stroke="#3ad0e6" strokeWidth="1.5" />
                                    <polyline points="-3,-2 -5,0 -3,2" fill="none" stroke="#3ad0e6" strokeWidth="1.2" />
                                    <polyline points="3,-2 5,0 3,2" fill="none" stroke="#3ad0e6" strokeWidth="1.2" />
                                </g>
                            </g>
                        );
                    })}

                    {/* HOVER SPLIT INDICATOR (Visual Scissors Cutting Indicator) */}
                    {hoverSplit && (
                        <g transform={`translate(${toSvgX(hoverSplit.shaftX)}, ${centerY})`} pointerEvents="none">
                            <line x1="0" y1="-55" x2="0" y2="55" stroke="#e6b84a" strokeWidth="1.5" strokeDasharray="3,3" />
                            <rect x="-30" y="-75" width="60" height="18" rx="3" fill="#181309" stroke="#e6b84a" strokeWidth="1" />
                            <text x="0" y="-63" textAnchor="middle" fontSize="9" fill="#e6b84a" fontWeight="bold">
                                ✂️ {t12(language, 'Split Segment', 'Kademeyi Böl')}
                            </text>
                        </g>
                    )}

                    {/* FEATURES RENDERING WITH DRAGGABLE HANDLES */}
                    {segmentBounds.map(({ seg, startX, endX, index }) => {
                        const segX1 = toSvgX(startX);
                        const r = seg.diameter / 2;
                        const yTop = toSvgY(r);
                        const yBot = toSvgY(-r);

                        return seg.features.map(f => {
                            const isFeatSelected = selectedFeatureId === f.id;

                            if (f.type === 'keyway') {
                                // DIN 6885 standardından mil çapına göre derinlik (t1) ve profil boyutlarını al
                                const stdKw = getStandardKeywayDIN6885(seg.diameter);
                                const actualDepth = (typeof f.depth === 'number' && f.depth > 0) ? f.depth : stdKw.depth;
                                const actualWidth = (typeof f.width === 'number' && f.width > 0) ? f.width : stdKw.width;
                                
                                const kwX = toSvgX(startX + f.offsetFromStart);
                                const kwW = f.length * scaleX;
                                // Kesit görünümü: Gerçek DIN 6885-1 t1 derinliği (1:1 ölçekli)
                                const kwDepthH = actualDepth * scaleY;
                                const yFloor = yTop + kwDepthH;

                                // Sivri / Düz 90° Keskin Köşeli Dikdörtgen Kama Yuvası (DIN 6885 / ISO 128 Kesit Görünümü)
                                const slotPath = `
                                    M ${kwX} ${yTop}
                                    L ${kwX} ${yFloor}
                                    L ${kwX + kwW} ${yFloor}
                                    L ${kwX + kwW} ${yTop}
                                    Z
                                `;

                                // Akıllı Lider Çizgisi: Kademede çakışmayı önleyecek yöne açılır
                                const isLeftHalf = (f.offsetFromStart + f.length / 2) < (seg.length / 2);
                                const leaderStartX = kwX + kwW / 2;
                                const leaderStartY = yTop + kwDepthH / 2;
                                const leaderMidX = isLeftHalf ? leaderStartX - 16 : leaderStartX + 16;
                                const leaderMidY = yTop - 36;
                                const leaderEndX = isLeftHalf ? leaderMidX - 70 : leaderMidX + 70;

                                const isFormA = f.standard?.includes('Form A');
                                const formLabel = isFormA ? 'DIN 6885-A' : 'DIN 6885-B';

                                return (
                                    <g
                                        key={f.id}
                                        onPointerDown={(e) => startFeatureDrag(e, seg.id, f.id, f.offsetFromStart)}
                                        onClick={(e) => { e.stopPropagation(); onSelectFeature?.(f.id); }}
                                        className="cursor-grab active:cursor-grabbing group/keyway"
                                    >
                                        {/* Kesit Görünümü Boşaltması: Orijinal mil taramasını keser ve maskeler (opak arka plan) */}
                                        <path
                                            d={slotPath}
                                            fill={isFeatSelected ? '#152e1a' : '#07090c'}
                                            stroke={isFeatSelected ? '#ffffff' : '#e6b84a'}
                                            strokeWidth={isFeatSelected ? 2.0 : 1.4}
                                            className="transition-colors group-hover/keyway:stroke-[var(--warn)]"
                                        />

                                        {/* Form A ise parmak freze teğet çizgileri */}
                                        {isFormA && (() => {
                                            const rEnd = Math.min(kwW * 0.2, ((actualWidth / 2) * scaleY) || 8);
                                            return (
                                                <>
                                                    <line
                                                        x1={kwX + rEnd}
                                                        y1={yTop}
                                                        x2={kwX + rEnd}
                                                        y2={yFloor}
                                                        stroke="#e6b84a"
                                                        strokeWidth="0.8"
                                                        strokeDasharray="2,2"
                                                        opacity={0.7}
                                                        pointerEvents="none"
                                                    />
                                                    <line
                                                        x1={kwX + kwW - rEnd}
                                                        y1={yTop}
                                                        x2={kwX + kwW - rEnd}
                                                        y2={yFloor}
                                                        stroke="#e6b84a"
                                                        strokeWidth="0.8"
                                                        strokeDasharray="2,2"
                                                        opacity={0.7}
                                                        pointerEvents="none"
                                                    />
                                                </>
                                            );
                                        })()}

                                        {/* Kama Yuvası Eksen Çizgisi */}
                                        <line
                                            x1={kwX - 4}
                                            y1={yTop + kwDepthH / 2}
                                            x2={kwX + kwW + 4}
                                            y2={yTop + kwDepthH / 2}
                                            stroke="#e6b84a"
                                            strokeWidth="0.75"
                                            strokeDasharray="5,2,1,2"
                                            opacity={0.6}
                                            pointerEvents="none"
                                        />

                                        {/* Kesit Görünümü Derinlik (t1) Ölçülendirmesi */}
                                        <g pointerEvents="none" opacity={0.9}>
                                            <line x1={kwX - 3} y1={yTop} x2={kwX - 3} y2={yFloor} stroke="#e6b84a" strokeWidth="0.8" />
                                            <line x1={kwX - 6} y1={yTop} x2={kwX} y2={yTop} stroke="#e6b84a" strokeWidth="0.6" />
                                            <line x1={kwX - 6} y1={yFloor} x2={kwX} y2={yFloor} stroke="#e6b84a" strokeWidth="0.6" />
                                            <polyline points={`${kwX - 4.5},${yTop + 2.5} ${kwX - 3},${yTop} ${kwX - 1.5},${yTop + 2.5}`} fill="none" stroke="#e6b84a" strokeWidth="0.8" />
                                            <polyline points={`${kwX - 4.5},${yFloor - 2.5} ${kwX - 3},${yFloor} ${kwX - 1.5},${yFloor - 2.5}`} fill="none" stroke="#e6b84a" strokeWidth="0.8" />
                                            <text
                                                x={kwX - 6}
                                                y={(yTop + yFloor) / 2 + 2.5}
                                                textAnchor="end"
                                                fontSize="7"
                                                fill="#e6b84a"
                                                fontWeight="bold"
                                                fontFamily="monospace"
                                            >
                                                t₁={actualDepth}
                                            </text>
                                        </g>

                                        {/* CAD Lider Çizgisi ve DIN 6885 Boyut Gösterimi */}
                                        <circle cx={leaderStartX} cy={leaderStartY} r="2.5" fill="#e6b84a" />
                                        <polyline
                                            points={`${leaderStartX},${leaderStartY} ${leaderMidX},${leaderMidY} ${leaderEndX},${leaderMidY}`}
                                            fill="none"
                                            stroke="#e6b84a"
                                            strokeWidth="1"
                                        />
                                        <text
                                            x={isLeftHalf ? leaderEndX : leaderMidX + 2}
                                            y={leaderMidY - 3}
                                            textAnchor="start"
                                            fontSize="8"
                                            fill="#e6b84a"
                                            fontWeight="bold"
                                            fontFamily="monospace"
                                        >
                                            {formLabel} {actualWidth}×{stdKw.height}×{f.length} (t₁={actualDepth} P9)
                                        </text>
                                    </g>
                                );
                            }

                            if (f.type === 'gear') {
                                const gearX = toSvgX(startX + f.offsetFromStart);
                                const gearW = Math.max(12, f.faceWidth * scaleX);
                                const tipR = (f.tipDiameter / 2) * scaleY;
                                const pitchR = (f.pitchDiameter / 2) * scaleY;
                                const rootR = (f.rootDiameter / 2) * scaleY;

                                const yTipTop = centerY - tipR;
                                const yPitchTop = centerY - pitchR;
                                const yRootTop = centerY - rootR;

                                const yTipBot = centerY + tipR;
                                const yPitchBot = centerY + pitchR;
                                const yRootBot = centerY + rootR;

                                const isFeatSelected = selectedFeatureId === f.id;
                                const isHelical = (f.helixAngleDeg || 0) > 0;

                                // Leader line for gear callout
                                const leaderStartX = gearX + gearW / 2;
                                const leaderStartY = yTipTop;
                                const isLeftHalf = (startX + f.offsetFromStart + f.faceWidth / 2) < (totalLength / 2);
                                const leaderMidX = isLeftHalf ? leaderStartX - 24 : leaderStartX + 24;
                                const leaderMidY = yTipTop - 28;
                                const leaderEndX = isLeftHalf ? leaderMidX - 90 : leaderMidX + 90;

                                return (
                                    <g
                                        key={f.id}
                                        onPointerDown={(e) => startFeatureDrag(e, seg.id, f.id, f.offsetFromStart)}
                                        onClick={(e) => { e.stopPropagation(); onSelectFeature?.(f.id); }}
                                        className="cursor-grab active:cursor-grabbing group/gear"
                                    >
                                        {/* Upper Tooth Section (DIN 3960 / ISO 2203) */}
                                        <rect
                                            x={gearX}
                                            y={yTipTop}
                                            width={gearW}
                                            height={Math.max(4, tipR - rootR)}
                                            fill={isFeatSelected ? '#162e4a' : '#0d1829'}
                                            stroke={isFeatSelected ? '#ffffff' : '#3ad0e6'}
                                            strokeWidth={isFeatSelected ? 2.0 : 1.4}
                                            className="transition-colors group-hover/gear:stroke-[var(--warn)]"
                                        />

                                        {/* Upper Tooth Cross Hatching (45° section lines) */}
                                        {Array.from({ length: Math.max(3, Math.floor(gearW / 8)) }).map((_, hIdx) => {
                                            const count = Math.max(3, Math.floor(gearW / 8));
                                            const hX = gearX + (hIdx + 1) * (gearW / (count + 1));
                                            return (
                                                <line
                                                    key={`hatch-top-${hIdx}`}
                                                    x1={hX - 3}
                                                    y1={yTipTop}
                                                    x2={hX + 3}
                                                    y2={yRootTop}
                                                    stroke="#3ad0e6"
                                                    strokeWidth="0.8"
                                                    opacity={0.55}
                                                    pointerEvents="none"
                                                />
                                            );
                                        })}

                                        {/* Upper Pitch Line (ISO 2203 d0 Centerline: amber dash-dot) */}
                                        <line
                                            x1={gearX - 6}
                                            y1={yPitchTop}
                                            x2={gearX + gearW + 6}
                                            y2={yPitchTop}
                                            stroke="#f59e0b"
                                            strokeWidth="1.2"
                                            strokeDasharray="8,2,2,2"
                                            pointerEvents="none"
                                        />

                                        {/* Upper Hub & Web Body (DIN 3960 solid connection from root df to shaft surface) */}
                                        {yTop > yRootTop && (
                                            <g pointerEvents="none">
                                                <rect
                                                    x={gearX}
                                                    y={yRootTop}
                                                    width={gearW}
                                                    height={yTop - yRootTop}
                                                    fill={isFeatSelected ? '#12253d' : '#0a1424'}
                                                    stroke={isFeatSelected ? '#ffffff' : '#3ad0e6'}
                                                    strokeWidth={1.2}
                                                />
                                                {Array.from({ length: Math.max(3, Math.floor(gearW / 8)) }).map((_, hIdx) => {
                                                    const count = Math.max(3, Math.floor(gearW / 8));
                                                    const hX = gearX + (hIdx + 1) * (gearW / (count + 1));
                                                    return (
                                                        <line
                                                            key={`hub-top-hatch-${hIdx}`}
                                                            x1={hX - 3}
                                                            y1={yRootTop}
                                                            x2={hX + 3}
                                                            y2={yTop}
                                                            stroke="#3ad0e6"
                                                            strokeWidth="0.8"
                                                            opacity={0.4}
                                                        />
                                                    );
                                                })}
                                            </g>
                                        )}

                                        {/* Lower Hub & Web Body (DIN 3960 solid connection from shaft surface to lower root df) */}
                                        {yRootBot > yBot && (
                                            <g pointerEvents="none">
                                                <rect
                                                    x={gearX}
                                                    y={yBot}
                                                    width={gearW}
                                                    height={yRootBot - yBot}
                                                    fill={isFeatSelected ? '#12253d' : '#0a1424'}
                                                    stroke={isFeatSelected ? '#ffffff' : '#3ad0e6'}
                                                    strokeWidth={1.2}
                                                />
                                                {Array.from({ length: Math.max(3, Math.floor(gearW / 8)) }).map((_, hIdx) => {
                                                    const count = Math.max(3, Math.floor(gearW / 8));
                                                    const hX = gearX + (hIdx + 1) * (gearW / (count + 1));
                                                    return (
                                                        <line
                                                            key={`hub-bot-hatch-${hIdx}`}
                                                            x1={hX - 3}
                                                            y1={yBot}
                                                            x2={hX + 3}
                                                            y2={yRootBot}
                                                            stroke="#3ad0e6"
                                                            strokeWidth="0.8"
                                                            opacity={0.4}
                                                        />
                                                    );
                                                })}
                                            </g>
                                        )}

                                        {/* Lower Tooth Section */}
                                        <rect
                                            x={gearX}
                                            y={yRootBot}
                                            width={gearW}
                                            height={Math.max(4, tipR - rootR)}
                                            fill={isFeatSelected ? '#162e4a' : '#0d1829'}
                                            stroke={isFeatSelected ? '#ffffff' : '#3ad0e6'}
                                            strokeWidth={isFeatSelected ? 2.0 : 1.4}
                                            className="transition-colors group-hover/gear:stroke-[var(--warn)]"
                                        />

                                        {/* Lower Tooth Cross Hatching */}
                                        {Array.from({ length: Math.max(3, Math.floor(gearW / 8)) }).map((_, hIdx) => {
                                            const count = Math.max(3, Math.floor(gearW / 8));
                                            const hX = gearX + (hIdx + 1) * (gearW / (count + 1));
                                            return (
                                                <line
                                                    key={`hatch-bot-${hIdx}`}
                                                    x1={hX - 3}
                                                    y1={yRootBot}
                                                    x2={hX + 3}
                                                    y2={yTipBot}
                                                    stroke="#3ad0e6"
                                                    strokeWidth="0.8"
                                                    opacity={0.55}
                                                    pointerEvents="none"
                                                />
                                            );
                                        })}

                                        {/* Lower Pitch Line (d0 Centerline) */}
                                        <line
                                            x1={gearX - 6}
                                            y1={yPitchBot}
                                            x2={gearX + gearW + 6}
                                            y2={yPitchBot}
                                            stroke="#f59e0b"
                                            strokeWidth="1.2"
                                            strokeDasharray="8,2,2,2"
                                            pointerEvents="none"
                                        />

                                        {/* Root lines df */}
                                        <line x1={gearX} y1={yRootTop} x2={gearX + gearW} y2={yRootTop} stroke="#3ad0e6" strokeWidth="0.8" opacity={0.8} pointerEvents="none" />
                                        <line x1={gearX} y1={yRootBot} x2={gearX + gearW} y2={yRootBot} stroke="#3ad0e6" strokeWidth="0.8" opacity={0.8} pointerEvents="none" />

                                        {/* CAD Callout Leader Line */}
                                        <circle cx={leaderStartX} cy={leaderStartY} r="2.5" fill="#f59e0b" />
                                        <polyline
                                            points={`${leaderStartX},${leaderStartY} ${leaderMidX},${leaderMidY} ${leaderEndX},${leaderMidY}`}
                                            fill="none"
                                            stroke="#f59e0b"
                                            strokeWidth="1"
                                        />
                                        <text
                                            x={isLeftHalf ? leaderEndX : leaderMidX + 2}
                                            y={leaderMidY - 3}
                                            textAnchor="start"
                                            fontSize="8"
                                            fill="#f59e0b"
                                            fontWeight="bold"
                                            fontFamily="monospace"
                                        >
                                            {isHelical ? t12(language, 'HELICAL GEAR', 'HELİSEL DİŞLİ') : t12(language, 'SPUR GEAR', 'DÜZ DİŞLİ')} m={f.module} z={f.numTeeth} (d₀=Ø{f.pitchDiameter} da=Ø{f.tipDiameter}) b={f.faceWidth}
                                        </text>
                                    </g>
                                );
                            }

                            if (f.type === 'circlip') {
                                const ccX = toSvgX(startX + f.offsetFromStart);
                                const ccW = Math.max(3, f.grooveWidth * scaleX);
                                const grooveDepth = ((seg.diameter - f.grooveDia) / 2) * scaleY;
                                const isNearLeftShoulder = (ccX - toSvgX(startX)) < 35;
                                const isNearRightShoulder = (toSvgX(endX) - ccX) < 35;
                                const labelY = (isNearLeftShoulder || isNearRightShoulder) ? yBot + 14 : yTop - 10;

                                return (
                                    <g
                                        key={f.id}
                                        onPointerDown={(e) => startFeatureDrag(e, seg.id, f.id, f.offsetFromStart)}
                                        onClick={(e) => { e.stopPropagation(); onSelectFeature?.(f.id); }}
                                        className="cursor-grab active:cursor-grabbing group"
                                    >
                                        <rect x={ccX} y={yTop} width={ccW} height={grooveDepth} fill="#07090c" stroke="#38bdf8" strokeWidth={1.2} />
                                        <rect x={ccX} y={yBot - grooveDepth} width={ccW} height={grooveDepth} fill="#07090c" stroke="#38bdf8" strokeWidth={1.2} />
                                        <text x={ccX + ccW / 2} y={labelY} textAnchor="middle" fontSize="8" fill="#38bdf8" fontWeight="bold" fontFamily="monospace">
                                            DIN 471 Ø{f.grooveDia}
                                        </text>
                                    </g>
                                );
                            }

                            if (f.type === 'thread') {
                                const maxAvailable = Math.max(0, seg.length - f.offsetFromStart);
                                const thLen = Math.min(f.length, maxAvailable);
                                const thX = toSvgX(startX + f.offsetFromStart);
                                const thW = thLen * scale;
                                const rootDepth = Math.min((seg.diameter / 2) * 0.25, (f.pitch * 0.8) * scale);

                                return (
                                    <g
                                        key={f.id}
                                        onPointerDown={(e) => startFeatureDrag(e, seg.id, f.id, f.offsetFromStart)}
                                        onClick={(e) => { e.stopPropagation(); onSelectFeature?.(f.id); }}
                                        className="cursor-grab active:cursor-grabbing group"
                                    >
                                        <line x1={thX} y1={yTop + rootDepth} x2={thX + thW} y2={yTop + rootDepth} stroke="#3ad0e6" strokeWidth="0.8" strokeDasharray="3,2" />
                                        <line x1={thX} y1={yBot - rootDepth} x2={thX + thW} y2={yBot - rootDepth} stroke="#3ad0e6" strokeWidth="0.8" strokeDasharray="3,2" />
                                        <text x={thX + thW / 2} y={yTop - 6} textAnchor="middle" fontSize="8" fill="#3ad0e6" fontWeight="bold">
                                            {f.designation}
                                        </text>
                                    </g>
                                );
                            }

                            if (f.type === 'cross_hole') {
                                const holeX = toSvgX(startX + f.offsetFromStart);
                                const holeR = (f.diameter / 2) * scale;

                                return (
                                    <g
                                        key={f.id}
                                        onPointerDown={(e) => startFeatureDrag(e, seg.id, f.id, f.offsetFromStart)}
                                        onClick={(e) => { e.stopPropagation(); onSelectFeature?.(f.id); }}
                                        className="cursor-grab active:cursor-grabbing group"
                                    >
                                        <line x1={holeX - holeR} y1={yTop} x2={holeX - holeR} y2={yBot} stroke="#ffaa55" strokeWidth="0.9" strokeDasharray="3,2" />
                                        <line x1={holeX + holeR} y1={yTop} x2={holeX + holeR} y2={yBot} stroke="#ffaa55" strokeWidth="0.9" strokeDasharray="3,2" />
                                        <circle cx={holeX} cy={centerY} r={holeR} fill="#ffaa55" fillOpacity={0.3} stroke="#ffaa55" strokeWidth="1" />
                                        <text x={holeX} y={yTop - 6} textAnchor="middle" fontSize="8" fill="#ffaa55" fontWeight="bold">
                                            Ø{f.diameter} {t12(language, 'HOLE', 'DELİK')}
                                        </text>
                                    </g>
                                );
                            }

                            if (f.type === 'imbus') {
                                const isLeft = f.face === 'left_end';
                                const faceX = isLeft ? toSvgX(startX) : toSvgX(endX);
                                const cbW = f.counterboreDepth * scale * (isLeft ? 1 : -1);
                                const cbH = f.counterboreDia * scale;
                                const tapW = f.tapDepth * scale * (isLeft ? 1 : -1);

                                return (
                                    <g
                                        key={f.id}
                                        onClick={(e) => { e.stopPropagation(); onSelectFeature?.(f.id); }}
                                        className="cursor-pointer"
                                    >
                                        <rect x={isLeft ? faceX : faceX + cbW} y={centerY - cbH / 2} width={Math.abs(cbW)} height={cbH} fill="#0c1016" stroke="#7aa2ff" strokeWidth="1.2" />
                                        <line x1={faceX + cbW} y1={centerY} x2={faceX + tapW} y2={centerY} stroke="#7aa2ff" strokeWidth="1.2" strokeDasharray="2,2" />
                                        <text x={isLeft ? faceX - 5 : faceX + 5} y={centerY - cbH / 2 - 4} textAnchor={isLeft ? "end" : "start"} fontSize="8" fill="#7aa2ff" fontWeight="bold">
                                            {t12(language, 'SOCKET HEAD', 'İMBUS')} {f.thread}
                                        </text>
                                    </g>
                                );
                            }

                            if (f.type === 'pin') {
                                const pinX = toSvgX(startX + f.offsetFromStart);
                                const pinR = (f.diameter / 2) * scale;

                                return (
                                    <g
                                        key={f.id}
                                        onPointerDown={(e) => startFeatureDrag(e, seg.id, f.id, f.offsetFromStart)}
                                        onClick={(e) => { e.stopPropagation(); onSelectFeature?.(f.id); }}
                                        className="cursor-grab active:cursor-grabbing group"
                                    >
                                        {/* Hidden cross-hole bore lines through the shaft body */}
                                        <line x1={pinX - pinR} y1={yTop} x2={pinX - pinR} y2={yBot} stroke="#7aa2ff" strokeWidth="0.8" strokeDasharray="3,2" opacity={0.6} />
                                        <line x1={pinX + pinR} y1={yTop} x2={pinX + pinR} y2={yBot} stroke="#7aa2ff" strokeWidth="0.8" strokeDasharray="3,2" opacity={0.6} />
                                        
                                        {/* Centerline Cross */}
                                        <line x1={pinX - pinR - 3} y1={centerY} x2={pinX + pinR + 3} y2={centerY} stroke="#7aa2ff" strokeWidth="0.8" strokeDasharray="4,2" opacity={0.7} />
                                        <line x1={pinX} y1={centerY - pinR - 3} x2={pinX} y2={centerY + pinR + 3} stroke="#7aa2ff" strokeWidth="0.8" strokeDasharray="4,2" opacity={0.7} />
                                        
                                        {/* Steel Pin Cross-Section Circle */}
                                        <circle cx={pinX} cy={centerY} r={pinR} fill="#121821" stroke="#7aa2ff" strokeWidth="1.2" />
                                        <text x={pinX} y={yBot + 14} textAnchor="middle" fontSize="8" fill="#7aa2ff" fontWeight="bold" fontFamily="monospace">
                                            DIN 7 Ø{f.diameter}
                                        </text>
                                    </g>
                                );
                            }

                            if (f.type === 'undercut') {
                                // Undercut is now automatically drawn as part of the shoulder transitions!
                                return null;
                            }

                            if (f.type === 'center_drill') {
                                const isLeft = f.face === 'left_end';
                                // Strictly allowed ONLY on first segment (left end) or last segment (right end)
                                const isActualEnd = (isLeft && index === 0) || (!isLeft && index === segmentBounds.length - 1);
                                if (!isActualEnd) return null;

                                // Prevent colliding with imbus hole on the exact same face
                                const hasImbusOnSameFace = seg.features.some(other => other.type === 'imbus' && (other as any).face === f.face);
                                if (hasImbusOnSameFace) return null;

                                const faceX = isLeft ? toSvgX(startX) : toSvgX(endX);
                                const form = f.form ?? 'B';
                                const d1 = f.pilotDia ?? 2.5;
                                const d2 = f.coneDia ?? 5.3;
                                const d3 = f.protectingDia ?? 8.0;
                                const totalDepth = f.totalDepth ?? 8.0;

                                const pilotR = (d1 / 2) * scale;
                                const coneR = (d2 / 2) * scale;
                                const rimR = (d3 / 2) * scale;
                                const depthDir = isLeft ? 1 : -1;
                                const coneDepth = Math.max(5, (d2 * 0.5) * scale * depthDir);
                                const pilotDepth = Math.max(10, totalDepth * scale * depthDir);

                                return (
                                    <g
                                        key={f.id}
                                        onClick={(e) => { e.stopPropagation(); onSelectFeature?.(f.id); }}
                                        className="cursor-pointer group"
                                    >
                                        {/* Center Drill Conical Outline (60° cone + pilot hole) */}
                                        <path
                                            d={`M ${faceX} ${centerY - (form === 'B' ? rimR : coneR)} 
                                                L ${faceX + coneDepth} ${centerY - pilotR} 
                                                L ${faceX + pilotDepth} ${centerY - pilotR} 
                                                L ${faceX + pilotDepth + 4 * depthDir} ${centerY} 
                                                L ${faceX + pilotDepth} ${centerY + pilotR} 
                                                L ${faceX + coneDepth} ${centerY + pilotR} 
                                                L ${faceX} ${centerY + (form === 'B' ? rimR : coneR)} Z`}
                                            fill="#0a1526"
                                            stroke="#00e5ff"
                                            strokeWidth={1.3}
                                            strokeDasharray="3,1"
                                        />
                                        <polyline
                                            points={`${faceX + pilotDepth + 4 * depthDir},${centerY} ${isLeft ? faceX - 14 : faceX + 14},${centerY + 18} ${isLeft ? faceX - 44 : faceX + 44},${centerY + 18}`}
                                            fill="none"
                                            stroke="#00e5ff"
                                            strokeWidth="0.9"
                                        />
                                        <circle cx={faceX + pilotDepth + 4 * depthDir} cy={centerY} r="2" fill="#00e5ff" />
                                        <text
                                            x={isLeft ? faceX - 46 : faceX + 46}
                                            y={centerY + 15}
                                            textAnchor={isLeft ? "end" : "start"}
                                            fontSize="8"
                                            fill="#00e5ff"
                                            fontWeight="bold"
                                            fontFamily="monospace"
                                        >
                                            DIN 332-{form} {d1}/{d2}
                                        </text>
                                    </g>
                                );
                            }

                            return null;
                        });
                    })}

                    {/* ISO 128 CENTERLINE */}
                    {showCenterline && (
                        <line
                            x1={toSvgX(0) - 25}
                            y1={centerY}
                            x2={toSvgX(totalLength) + 25}
                            y2={centerY}
                            stroke="#3ad0e6"
                            strokeWidth="0.9"
                            strokeDasharray="18,3,3,3"
                            opacity={0.6}
                        />
                    )}

                    {/* DRAGGABLE SUPPORTS & LOADS */}
                    {showLoads && (() => {
                        const bXA = toSvgX(supportAPos);
                        const bXB = toSvgX(supportBPos);
                        const isBearingBadgesColliding = Math.abs(bXB - bXA) < 135;

                        return (
                        <g>
                            {/* Support A: Rolling Bearing (ISO 128 / DIN 616) */}
                            {(() => {
                                const bA = supportABearing || {
                                    supportId: 'A' as const,
                                    positionMm: supportAPos,
                                    bearingCode: '6205',
                                    boreDia: 25,
                                    outerDia: 52,
                                    width: 15,
                                    dynamicLoadRatingKN: 14.8,
                                    staticLoadRatingKN: 7.8,
                                    reactionForceN: 1200,
                                    lifeHoursL10h: 50000,
                                    bearingType: 'deep-groove-ball'
                                };
                                const bX = toSvgX(supportAPos);
                                const segA = segmentBounds.find(b => supportAPos >= b.startX && supportAPos <= b.endX)?.seg ?? segments[0];
                                const shaftDiaA = segA.diameter;
                                const isDiaMismatch = bA.boreDia !== shaftDiaA;

                                // Bearing inner ring sits flush on the shaft surface
                                const rInner = (shaftDiaA / 2) * scale;
                                const radialSectionMm = Math.max(6, (bA.outerDia - bA.boreDia) / 2);
                                const rOuter = rInner + radialSectionMm * scale;
                                const rSpan = rOuter - rInner;
                                const ringT = rSpan * 0.25;
                                const bW = Math.max(12, bA.width * scale);
                                const isRoller = bA.bearingType?.includes('roller');
                                const ballR = (rSpan - 2 * ringT) * 0.44;

                                const yTopInner = centerY - rInner;
                                const yTopOuter = centerY - rOuter;
                                const yBotInner = centerY + rInner;
                                const yBotOuter = centerY + rOuter;

                                return (
                                    <g key="support-A" className="group/supA">
                                        {/* Upper Bearing Half */}
                                        <g pointerEvents="none">
                                            <rect
                                                x={bX - bW / 2}
                                                y={yTopOuter}
                                                width={bW}
                                                height={ringT}
                                                fill="#162233"
                                                stroke="#3ad0e6"
                                                strokeWidth="1.2"
                                            />
                                            <rect
                                                x={bX - bW / 2}
                                                y={yTopInner - ringT}
                                                width={bW}
                                                height={ringT}
                                                fill="#162233"
                                                stroke="#3ad0e6"
                                                strokeWidth="1.2"
                                            />
                                            {isRoller ? (
                                                <rect
                                                    x={bX - bW * 0.35}
                                                    y={yTopOuter + ringT}
                                                    width={bW * 0.7}
                                                    height={rSpan - 2 * ringT}
                                                    fill="#223a54"
                                                    stroke="#3ad0e6"
                                                    strokeWidth="1"
                                                />
                                            ) : (
                                                <circle
                                                    cx={bX}
                                                    cy={(yTopOuter + ringT + yTopInner - ringT) / 2}
                                                    r={ballR}
                                                    fill="#223a54"
                                                    stroke="#3ad0e6"
                                                    strokeWidth="1.2"
                                                />
                                            )}
                                        </g>

                                        {/* Lower Bearing Half */}
                                        <g pointerEvents="none">
                                            <rect
                                                x={bX - bW / 2}
                                                y={yBotInner}
                                                width={bW}
                                                height={ringT}
                                                fill="#162233"
                                                stroke="#3ad0e6"
                                                strokeWidth="1.2"
                                            />
                                            <rect
                                                x={bX - bW / 2}
                                                y={yBotOuter - ringT}
                                                width={bW}
                                                height={ringT}
                                                fill="#162233"
                                                stroke="#3ad0e6"
                                                strokeWidth="1.2"
                                            />
                                            {isRoller ? (
                                                <rect
                                                    x={bX - bW * 0.35}
                                                    y={yBotInner + ringT}
                                                    width={bW * 0.7}
                                                    height={rSpan - 2 * ringT}
                                                    fill="#223a54"
                                                    stroke="#3ad0e6"
                                                    strokeWidth="1"
                                                />
                                            ) : (
                                                <circle
                                                    cx={bX}
                                                    cy={(yBotInner + ringT + yBotOuter - ringT) / 2}
                                                    r={ballR}
                                                    fill="#223a54"
                                                    stroke="#3ad0e6"
                                                    strokeWidth="1.2"
                                                />
                                            )}
                                        </g>

                                        {/* Ground Pinned Support Symbol */}
                                        <polygon
                                            points={`${bX},${yBotOuter + 2} ${bX - 8},${yBotOuter + 14} ${bX + 8},${yBotOuter + 14}`}
                                            fill="#142233"
                                            stroke="#3ad0e6"
                                            strokeWidth="1.3"
                                            pointerEvents="none"
                                        />
                                        <line
                                            x1={bX - 12}
                                            y1={yBotOuter + 16}
                                            x2={bX + 12}
                                            y2={yBotOuter + 16}
                                            stroke="#3ad0e6"
                                            strokeWidth="1.3"
                                            pointerEvents="none"
                                        />

                                        {/* Draggable Anchor & Bearing Badge */}
                                        <g
                                            transform={`translate(${bX}, ${yBotOuter + 18})`}
                                            onPointerDown={(e) => startSupportDrag(e, 'A', supportAPos)}
                                            className="cursor-ew-resize"
                                        >
                                            {isDiaMismatch ? (
                                                <g
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onOpenBearingModal?.('A');
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <rect
                                                        x="-68"
                                                        y="3"
                                                        width="136"
                                                        height="26"
                                                        rx="4"
                                                        fill="#261010"
                                                        stroke="#ef4444"
                                                        strokeWidth="1.2"
                                                        className="hover:stroke-white transition-colors"
                                                    />
                                                    <text
                                                        x="0"
                                                        y="14"
                                                        textAnchor="middle"
                                                        fontSize="8"
                                                        fill="#fca5a5"
                                                        fontWeight="bold"
                                                        fontFamily="monospace"
                                                    >
                                                        SKF {bA.bearingCode} (Ø{bA.boreDia}) ⚠️ Mil Ø{shaftDiaA}
                                                    </text>
                                                    <text
                                                        x="0"
                                                        y="24"
                                                        textAnchor="middle"
                                                        fontSize="7"
                                                        fill="#f87171"
                                                        fontFamily="monospace"
                                                    >
                                                        [{t12(language, 'Click to Match Dia', 'Tıkla & Çapı Eşitle')}]
                                                    </text>
                                                </g>
                                            ) : (
                                                <g
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onOpenBearingModal?.('A');
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <rect
                                                        x="-60"
                                                        y="3"
                                                        width="120"
                                                        height="26"
                                                        rx="4"
                                                        fill="#070b12"
                                                        stroke="#3ad0e6"
                                                        strokeWidth="1"
                                                        className="group-hover/supA:stroke-white transition-colors"
                                                    />
                                                    <text
                                                        x="0"
                                                        y="14"
                                                        textAnchor="middle"
                                                        fontSize="8.5"
                                                        fill="#3ad0e6"
                                                        fontWeight="bold"
                                                        fontFamily="monospace"
                                                    >
                                                        {t12(language, 'BEARING A: SKF', 'YATAK A: SKF')} {bA.bearingCode}
                                                    </text>
                                                    <text
                                                        x="0"
                                                        y="24"
                                                        textAnchor="middle"
                                                        fontSize="7.5"
                                                        fill="#8b96a4"
                                                        fontFamily="monospace"
                                                    >
                                                        Ø{bA.boreDia}xØ{bA.outerDia} · Ra={Math.round(bA.reactionForceN || 0)}N
                                                    </text>
                                                </g>
                                            )}
                                        </g>
                                    </g>
                                );
                            })()}

                            {/* Support B: Rolling Bearing (ISO 128 / DIN 616) */}
                            {(() => {
                                const bB = supportBBearing || {
                                    supportId: 'B' as const,
                                    positionMm: supportBPos,
                                    bearingCode: '6207',
                                    boreDia: 35,
                                    outerDia: 72,
                                    width: 17,
                                    dynamicLoadRatingKN: 27.0,
                                    staticLoadRatingKN: 15.3,
                                    reactionForceN: 1800,
                                    lifeHoursL10h: 40000,
                                    bearingType: 'deep-groove-ball'
                                };
                                const bX = toSvgX(supportBPos);
                                const segB = segmentBounds.find(b => supportBPos >= b.startX && supportBPos <= b.endX)?.seg ?? segments[segments.length - 1];
                                const shaftDiaB = segB.diameter;
                                const isDiaMismatch = bB.boreDia !== shaftDiaB;

                                // Bearing inner ring sits flush on the shaft surface
                                const rInner = (shaftDiaB / 2) * scale;
                                const radialSectionMm = Math.max(6, (bB.outerDia - bB.boreDia) / 2);
                                const rOuter = rInner + radialSectionMm * scale;
                                const rSpan = rOuter - rInner;
                                const ringT = rSpan * 0.25;
                                const bW = Math.max(12, bB.width * scale);
                                const isRoller = bB.bearingType?.includes('roller');
                                const ballR = (rSpan - 2 * ringT) * 0.44;

                                const yTopInner = centerY - rInner;
                                const yTopOuter = centerY - rOuter;
                                const yBotInner = centerY + rInner;
                                const yBotOuter = centerY + rOuter;

                                return (
                                    <g key="support-B" className="group/supB">
                                        {/* Upper Bearing Half */}
                                        <g pointerEvents="none">
                                            <rect
                                                x={bX - bW / 2}
                                                y={yTopOuter}
                                                width={bW}
                                                height={ringT}
                                                fill="#162233"
                                                stroke="#3ad0e6"
                                                strokeWidth="1.2"
                                            />
                                            <rect
                                                x={bX - bW / 2}
                                                y={yTopInner - ringT}
                                                width={bW}
                                                height={ringT}
                                                fill="#162233"
                                                stroke="#3ad0e6"
                                                strokeWidth="1.2"
                                            />
                                            {isRoller ? (
                                                <rect
                                                    x={bX - bW * 0.35}
                                                    y={yTopOuter + ringT}
                                                    width={bW * 0.7}
                                                    height={rSpan - 2 * ringT}
                                                    fill="#223a54"
                                                    stroke="#3ad0e6"
                                                    strokeWidth="1"
                                                />
                                            ) : (
                                                <circle
                                                    cx={bX}
                                                    cy={(yTopOuter + ringT + yTopInner - ringT) / 2}
                                                    r={ballR}
                                                    fill="#223a54"
                                                    stroke="#3ad0e6"
                                                    strokeWidth="1.2"
                                                />
                                            )}
                                        </g>

                                        {/* Lower Bearing Half */}
                                        <g pointerEvents="none">
                                            <rect
                                                x={bX - bW / 2}
                                                y={yBotInner}
                                                width={bW}
                                                height={ringT}
                                                fill="#162233"
                                                stroke="#3ad0e6"
                                                strokeWidth="1.2"
                                            />
                                            <rect
                                                x={bX - bW / 2}
                                                y={yBotOuter - ringT}
                                                width={bW}
                                                height={ringT}
                                                fill="#162233"
                                                stroke="#3ad0e6"
                                                strokeWidth="1.2"
                                            />
                                            {isRoller ? (
                                                <rect
                                                    x={bX - bW * 0.35}
                                                    y={yBotInner + ringT}
                                                    width={bW * 0.7}
                                                    height={rSpan - 2 * ringT}
                                                    fill="#223a54"
                                                    stroke="#3ad0e6"
                                                    strokeWidth="1"
                                                />
                                            ) : (
                                                <circle
                                                    cx={bX}
                                                    cy={(yBotInner + ringT + yBotOuter - ringT) / 2}
                                                    r={ballR}
                                                    fill="#223a54"
                                                    stroke="#3ad0e6"
                                                    strokeWidth="1.2"
                                                />
                                            )}
                                        </g>

                                        {/* Ground Roller Support Symbol */}
                                        <polygon
                                            points={`${bX},${yBotOuter + 2} ${bX - 8},${yBotOuter + 12} ${bX + 8},${yBotOuter + 12}`}
                                            fill="#142233"
                                            stroke="#3ad0e6"
                                            strokeWidth="1.3"
                                            pointerEvents="none"
                                        />
                                        <circle cx={bX - 5} cy={yBotOuter + 15} r="1.8" fill="#3ad0e6" pointerEvents="none" />
                                        <circle cx={bX + 5} cy={yBotOuter + 15} r="1.8" fill="#3ad0e6" pointerEvents="none" />
                                        <line
                                            x1={bX - 12}
                                            y1={yBotOuter + 18}
                                            x2={bX + 12}
                                            y2={yBotOuter + 18}
                                            stroke="#3ad0e6"
                                            strokeWidth="1.3"
                                            pointerEvents="none"
                                        />

                                        {/* Draggable Anchor & Bearing Badge */}
                                        <g
                                            transform={`translate(${bX}, ${yBotOuter + (isBearingBadgesColliding ? 56 : 20)})`}
                                            onPointerDown={(e) => startSupportDrag(e, 'B', supportBPos)}
                                            className="cursor-ew-resize"
                                        >
                                            {/* Vertical leader guideline to ground fixture when vertically staggered */}
                                            {isBearingBadgesColliding && (
                                                <line x1="0" y1="-36" x2="0" y2="0" stroke="#3ad0e6" strokeWidth="1" strokeDasharray="3,2" pointerEvents="none" />
                                            )}
                                            {isDiaMismatch ? (
                                                <g
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onOpenBearingModal?.('B');
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <rect
                                                        x="-68"
                                                        y="3"
                                                        width="136"
                                                        height="26"
                                                        rx="4"
                                                        fill="#261010"
                                                        stroke="#ef4444"
                                                        strokeWidth="1.2"
                                                        className="hover:stroke-white transition-colors"
                                                    />
                                                    <text
                                                        x="0"
                                                        y="14"
                                                        textAnchor="middle"
                                                        fontSize="8"
                                                        fill="#fca5a5"
                                                        fontWeight="bold"
                                                        fontFamily="monospace"
                                                    >
                                                        SKF {bB.bearingCode} (Ø{bB.boreDia}) ⚠️ Mil Ø{shaftDiaB}
                                                    </text>
                                                    <text
                                                        x="0"
                                                        y="24"
                                                        textAnchor="middle"
                                                        fontSize="7"
                                                        fill="#f87171"
                                                        fontFamily="monospace"
                                                    >
                                                        [{t12(language, 'Click to Match Dia', 'Tıkla & Çapı Eşitle')}]
                                                    </text>
                                                </g>
                                            ) : (
                                                <g
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onOpenBearingModal?.('B');
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <rect
                                                        x="-60"
                                                        y="3"
                                                        width="120"
                                                        height="26"
                                                        rx="4"
                                                        fill="#070b12"
                                                        stroke="#3ad0e6"
                                                        strokeWidth="1"
                                                        className="group-hover/supB:stroke-white transition-colors"
                                                    />
                                                    <text
                                                        x="0"
                                                        y="14"
                                                        textAnchor="middle"
                                                        fontSize="8.5"
                                                        fill="#3ad0e6"
                                                        fontWeight="bold"
                                                        fontFamily="monospace"
                                                    >
                                                        {t12(language, 'BEARING B: SKF', 'YATAK B: SKF')} {bB.bearingCode}
                                                    </text>
                                                    <text
                                                        x="0"
                                                        y="24"
                                                        textAnchor="middle"
                                                        fontSize="7.5"
                                                        fill="#8b96a4"
                                                        fontFamily="monospace"
                                                    >
                                                        Ø{bB.boreDia}xØ{bB.outerDia} · Rb={Math.round(bB.reactionForceN || 0)}N
                                                    </text>
                                                </g>
                                            )}
                                        </g>
                                    </g>
                                );
                            })()}

                            {/* Applied Radial Loads (Draggable) */}
                            {radialLoads.map(load => {
                                const loadX = toSvgX(load.position);
                                const segBound = segmentBounds.find(b => load.position >= b.startX && load.position <= b.endX);
                                const segAtLoad = segBound?.seg;
                                const segDia = segAtLoad ? segAtLoad.diameter : maxDia;

                                // Check if there is a gear mounted at the load position
                                const gearAtLoad = segAtLoad?.features.find(f => {
                                    if (f.type !== 'gear' || !segBound) return false;
                                    const gStart = segBound.startX + f.offsetFromStart;
                                    const gEnd = gStart + f.faceWidth;
                                    return load.position >= gStart - 2 && load.position <= gEnd + 2;
                                }) as ({ type: 'gear'; tipDiameter: number } | undefined);

                                const ySurface = gearAtLoad 
                                    ? centerY - (gearAtLoad.tipDiameter / 2) * scaleY 
                                    : toSvgY(segDia / 2);

                                return (
                                    <g 
                                        key={load.id} 
                                        transform={`translate(${loadX}, ${ySurface})`}
                                        onPointerDown={(e) => startLoadDrag(e, load)}
                                        className="cursor-grab active:cursor-grabbing group/load"
                                    >
                                        <line x1="0" y1="-38" x2="0" y2="-2" stroke="#e85d5d" strokeWidth="2.5" markerEnd="url(#loadArrow)" />
                                        <rect x="-35" y="-56" width="70" height="16" rx="3" fill="#180e12" stroke="#e85d5d" strokeWidth="1" />
                                        <text x="0" y="-44" textAnchor="middle" fontSize="9" fill="#e85d5d" fontWeight="bold" fontFamily="monospace">
                                            F = {load.forceN} N
                                        </text>
                                    </g>
                                );
                            })}
                        </g>
                        );
                    })()}

                    {/* ENGINEERING DIMENSION LINES WITH INLINE EDIT TRIGGER */}
                    {showDimensions && (() => {
                        // Calculate maximum downward radius including shaft and bearing outer rings
                        const segA = segmentBounds.find(b => supportAPos >= b.startX && supportAPos <= b.endX)?.seg;
                        const dA = segA ? segA.diameter : (segments[0]?.diameter ?? 30);
                        const rOuterA = supportABearing ? (dA / 2 + Math.max(6, (supportABearing.outerDia - supportABearing.boreDia) / 2)) : 0;

                        const segB = segmentBounds.find(b => supportBPos >= b.startX && supportBPos <= b.endX)?.seg;
                        const dB = segB ? segB.diameter : (segments[segments.length - 1]?.diameter ?? 30);
                        const rOuterB = supportBBearing ? (dB / 2 + Math.max(6, (supportBBearing.outerDia - supportBBearing.boreDia) / 2)) : 0;

                        const maxBottomR = Math.max(effectiveMaxDia / 2, rOuterA, rOuterB);
                        const bXA = toSvgX(supportAPos);
                        const bXB = toSvgX(supportBPos);
                        const isBearingBadgesColliding = Math.abs(bXB - bXA) < 135;

                        const yBotOuterA = centerY + rOuterA * scale;
                        const yBotOuterB = centerY + rOuterB * scale;
                        const badgeABottom = yBotOuterA + 18 + 28;
                        const badgeBBottom = isBearingBadgesColliding ? (yBotOuterB + 56 + 28) : (yBotOuterB + 20 + 28);
                        const maxBadgeBottom = Math.max(badgeABottom, badgeBBottom);

                        // Ensure dimension lines stay well below bearing badges and support grounds
                        const dimY = Math.max(centerY + maxBottomR * scale + 56, maxBadgeBottom + 16);
                        const hasNarrowSegments = segmentBounds.some(b => (toSvgX(b.endX) - toSvgX(b.startX)) < 44);
                        const totDimY = dimY + (hasNarrowSegments ? 38 : 22);

                        return (
                            <g opacity={0.9}>
                                {/* Diameters Click-to-Edit (Smart collision-free placement avoiding gears/loads/bearings) */}
                                {(() => {
                                    // Pre-calculate positions to check distance between consecutive diameter badges
                                    const diaBadgePositions = segmentBounds.map(({ seg, startX, endX }, idx) => {
                                        const xMid = toSvgX((startX + endX) / 2);
                                        const r = seg.diameter / 2;
                                        const yTop = toSvgY(r);

                                        const midShaftPos = (startX + endX) / 2;
                                        const hasFeatureAtMid = seg.features.some(f => {
                                            if (!('offsetFromStart' in f)) return false;
                                            const fOffset = (f as { offsetFromStart: number }).offsetFromStart;
                                            const fStart = startX + fOffset;
                                            const fLen = f.type === 'gear' ? (f as any).faceWidth : (f.type === 'keyway' ? (f as any).length : 12);
                                            return midShaftPos >= fStart - 8 && midShaftPos <= fStart + fLen + 8;
                                        });
                                        const hasLoadAtMid = radialLoads.some(load => 
                                            Math.abs(load.position - midShaftPos) < 22
                                        );
                                        const hasBearingAtMid = (supportAPos >= startX && supportAPos <= endX && Math.abs(supportAPos - midShaftPos) < 22) ||
                                                                (supportBPos >= startX && supportBPos <= endX && Math.abs(supportBPos - midShaftPos) < 22);

                                        const isMidOccupied = hasFeatureAtMid || hasLoadAtMid || hasBearingAtMid;

                                        let badgeX = xMid;
                                        let baseY = yTop - 19;

                                        if (isMidOccupied && seg.length > 45) {
                                            const candidateLeft = startX + 20;
                                            const leftBusy = seg.features.some(f => {
                                                if (!('offsetFromStart' in f)) return false;
                                                const fOffset = (f as { offsetFromStart: number }).offsetFromStart;
                                                const fStart = startX + fOffset;
                                                const fLen = f.type === 'gear' ? (f as any).faceWidth : (f.type === 'keyway' ? (f as any).length : 10);
                                                return candidateLeft >= fStart - 6 && candidateLeft <= fStart + fLen + 6;
                                            }) || radialLoads.some(l => Math.abs(l.position - candidateLeft) < 16);

                                            badgeX = toSvgX(leftBusy ? endX - 20 : candidateLeft);
                                        } else {
                                            const gearFeat = seg.features.find(f => f.type === 'gear') as { tipDiameter: number } | undefined;
                                            if (gearFeat) {
                                                baseY = centerY - (gearFeat.tipDiameter / 2) * scaleY - 18;
                                            }
                                        }

                                        return { seg, badgeX, baseY, yTop, index: idx };
                                    });

                                    return diaBadgePositions.map((pos, idx) => {
                                        // Detect if close to previous or next badge in X
                                        const prev = idx > 0 ? diaBadgePositions[idx - 1] : null;
                                        const next = idx < diaBadgePositions.length - 1 ? diaBadgePositions[idx + 1] : null;
                                        const isCloseToAdjacent = (prev && Math.abs(pos.badgeX - prev.badgeX) < 56) || (next && Math.abs(pos.badgeX - next.badgeX) < 56);
                                        const isStaggered = isCloseToAdjacent && (idx % 2 === 1);
                                        const badgeY = isStaggered ? pos.baseY - 16 : pos.baseY;

                                        return (
                                            <g 
                                                key={`dia-dim-${pos.seg.id}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openDimEdit('segment_dia', pos.seg.diameter, pos.badgeX, badgeY, pos.seg.id);
                                                }}
                                                className="cursor-pointer hover:opacity-100"
                                            >
                                                {/* Vertical leader indicator if staggered */}
                                                {isStaggered && (
                                                    <line
                                                        x1={pos.badgeX}
                                                        y1={badgeY + 4}
                                                        x2={pos.badgeX}
                                                        y2={pos.yTop}
                                                        stroke="#7aa2ff"
                                                        strokeWidth="0.75"
                                                        strokeDasharray="2,2"
                                                        opacity={0.6}
                                                    />
                                                )}
                                                <rect x={pos.badgeX - 25} y={badgeY - 12} width="50" height="15" rx="2" fill="#0a101a" stroke="#7aa2ff" strokeWidth="0.8" />
                                                <text x={pos.badgeX} y={badgeY - 1} textAnchor="middle" fontSize="8.5" fill="#7aa2ff" fontWeight="bold" fontFamily="monospace">
                                                    Ø{pos.seg.diameter} {pos.seg.toleranceGrade}
                                                </text>
                                            </g>
                                        );
                                    });
                                })()}

                                {/* Segment Lengths Click-to-Edit with Staggered Tiers for Narrow Steps */}
                                {segmentBounds.map(({ seg, startX, endX, index }) => {
                                    const x1 = toSvgX(startX);
                                    const x2 = toSvgX(endX);
                                    const w = x2 - x1;
                                    const isNarrow = w < 44;
                                    // Alternate tiers for narrow segments so text boxes (width 32) never collide
                                    const tier = isNarrow && (index % 2 === 1) ? 1 : 0;
                                    const currentDimY = dimY + tier * 18;
                                    const isVeryNarrow = w < 24;
                                    const boxW = isVeryNarrow ? 22 : 32;
                                    const boxH = isVeryNarrow ? 11 : 12;

                                    return (
                                        <g key={`len-dim-${seg.id}`}>
                                            {/* Extension lines stretching from dimY - 6 down to currentDimY + 6 */}
                                            <line x1={x1} y1={dimY - 6} x2={x1} y2={currentDimY + 6} stroke="#24344d" strokeWidth="0.8" />
                                            <line x1={x2} y1={dimY - 6} x2={x2} y2={currentDimY + 6} stroke="#24344d" strokeWidth="0.8" />
                                            
                                            {/* Dimension line with arrows */}
                                            {isVeryNarrow ? (
                                                // External arrows pointing inward per ISO 129-1
                                                <>
                                                    <line x1={x1 - 10} y1={currentDimY} x2={x1} y2={currentDimY} stroke="#7aa2ff" strokeWidth="0.9" markerEnd="url(#dimArrow)" />
                                                    <line x1={x1} y1={currentDimY} x2={x2} y2={currentDimY} stroke="#7aa2ff" strokeWidth="0.9" />
                                                    <line x1={x2 + 10} y1={currentDimY} x2={x2} y2={currentDimY} stroke="#7aa2ff" strokeWidth="0.9" markerEnd="url(#dimArrowRev)" />
                                                </>
                                            ) : (
                                                <line x1={x1} y1={currentDimY} x2={x2} y2={currentDimY} stroke="#7aa2ff" strokeWidth="0.9" markerStart="url(#dimArrowRev)" markerEnd="url(#dimArrow)" />
                                            )}

                                            <g 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openDimEdit('segment_len', seg.length, (x1 + x2) / 2, currentDimY - 4, seg.id);
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <rect x={(x1 + x2) / 2 - boxW / 2} y={currentDimY - boxH} width={boxW} height={boxH} rx="2" fill="#07090c" stroke="#7aa2ff" strokeWidth="0.6" />
                                                <text x={(x1 + x2) / 2} y={currentDimY - 3} textAnchor="middle" fontSize={isVeryNarrow ? "7.5" : "8.5"} fill="#7aa2ff">
                                                    {seg.length}
                                                </text>
                                            </g>
                                        </g>
                                    );
                                })}

                                {/* Overall Total Length */}
                                {(() => {
                                    const x1 = toSvgX(0);
                                    const x2 = toSvgX(totalLength);

                                    return (
                                        <g>
                                            <line x1={x1} y1={totDimY - 8} x2={x1} y2={totDimY + 8} stroke="#334863" strokeWidth="1" />
                                            <line x1={x2} y1={totDimY - 8} x2={x2} y2={totDimY + 8} stroke="#334863" strokeWidth="1" />
                                            <line x1={x1} y1={totDimY} x2={x2} y2={totDimY} stroke="#3ad0e6" strokeWidth="1.2" markerStart="url(#dimArrowRev)" markerEnd="url(#dimArrow)" />
                                            <g 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openDimEdit('total_len', totalLength, (x1 + x2) / 2, totDimY - 3);
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <rect x={(x1 + x2) / 2 - 40} y={totDimY - 14} width="80" height="14" rx="2" fill="#07090c" stroke="#3ad0e6" strokeWidth="0.8" />
                                                <text x={(x1 + x2) / 2} y={totDimY - 3} textAnchor="middle" fontSize="9.5" fill="#3ad0e6" fontWeight="bold">
                                                    L = {Math.round(totalLength)} mm
                                                </text>
                                            </g>
                                        </g>
                                    );
                                })()}
                            </g>
                        );
                    })()}

                    {/* DRAG TOOLTIP (Live Dimension Floating Badge) */}
                    {dragTooltip && (
                        <g transform={`translate(${dragTooltip.x}, ${dragTooltip.y})`} pointerEvents="none">
                            <rect x="-60" y="-12" width="120" height="22" rx="4" fill="#0c1016" stroke="#3ad0e6" strokeWidth="1.2" />
                            <text x="0" y="3" textAnchor="middle" fontSize="10" fill="#3ad0e6" fontWeight="bold">
                                {dragTooltip.text}
                            </text>
                        </g>
                    )}
                </svg>

                {/* ON-CANVAS FLOATING ACTION BAR FOR SELECTED SEGMENT */}
                {selectedSeg && selectedSegBound && (
                    <div 
                        className="absolute z-20 flex items-center gap-1 p-1 bg-[var(--bg-1)] border border-[var(--cyan)] rounded-md shadow-2xl text-[10px] font-mono pointer-events-auto"
                        style={{
                            top: 12,
                            left: '50%',
                            transform: 'translateX(-50%)'
                        }}
                    >
                        <span className="text-[var(--cyan)] font-bold px-2 py-0.5 border-r border-[var(--line)] flex items-center gap-1">
                            S{selectedSeg.segmentIndex + 1} (Ø{selectedSeg.diameter}x{selectedSeg.length})
                        </span>

                        <button
                            onClick={() => onAddFeature?.(selectedSeg.id, 'keyway')}
                            className="px-2 py-1 rounded bg-[var(--bg-3)] hover:bg-[var(--warn)]/20 hover:text-[var(--warn)] border border-[var(--line)] flex items-center gap-1"
                            title={t12(language, 'Add Keyway (DIN 6885)', 'Kama Ekle (DIN 6885)')}
                        >
                            + {t12(language, 'Keyway', 'Kama')}
                        </button>
                        <button
                            onClick={() => onAddFeature?.(selectedSeg.id, 'gear')}
                            className="px-2 py-1 rounded bg-[var(--bg-3)] hover:bg-[var(--cyan)]/20 hover:text-[var(--cyan)] border border-[var(--line)] flex items-center gap-1 font-bold"
                            title={t12(language, 'Add Gear (DIN 3960 / ISO 54)', 'Dişli Çark Ekle (DIN 3960 / ISO 54)')}
                        >
                            + {t12(language, 'Gear', 'Dişli')}
                        </button>
                        <button
                            onClick={() => onAddFeature?.(selectedSeg.id, 'circlip')}
                            className="px-2 py-1 rounded bg-[var(--bg-3)] hover:bg-[var(--bad)]/20 hover:text-[var(--bad)] border border-[var(--line)] flex items-center gap-1"
                            title={t12(language, 'Add Circlip (DIN 471)', 'Segman Ekle (DIN 471)')}
                        >
                            + {t12(language, 'Circlip', 'Segman')}
                        </button>
                        <button
                            onClick={() => onAddFeature?.(selectedSeg.id, 'thread')}
                            className="px-2 py-1 rounded bg-[var(--bg-3)] hover:bg-[var(--cyan)]/20 hover:text-[var(--cyan)] border border-[var(--line)] flex items-center gap-1"
                            title={t12(language, 'Add Thread (ISO 965)', 'Diş/Vida Ekle (ISO 965)')}
                        >
                            + {t12(language, 'Thread', 'Vida')}
                        </button>
                        <button
                            onClick={() => onAddFeature?.(selectedSeg.id, 'cross_hole')}
                            className="px-2 py-1 rounded bg-[var(--bg-3)] hover:bg-orange-500/20 hover:text-orange-400 border border-[var(--line)] flex items-center gap-1"
                            title={t12(language, 'Add Cross Hole', 'Delik Ekle')}
                        >
                            + {t12(language, 'Hole', 'Delik')}
                        </button>
                        <button
                            onClick={() => onAddFeature?.(selectedSeg.id, 'imbus')}
                            className="px-2 py-1 rounded bg-[var(--bg-3)] hover:bg-blue-500/20 hover:text-blue-400 border border-[var(--line)] flex items-center gap-1"
                            title={t12(language, 'Add Socket Head Bolt Recess (DIN 912)', 'Alın İmbus Cıvata Yuvası Ekle (DIN 912)')}
                        >
                            + {t12(language, 'Socket Head', 'İmbus')}
                        </button>
                        <button
                            onClick={() => onAddFeature?.(selectedSeg.id, 'pin')}
                            className="px-2 py-1 rounded bg-[var(--bg-3)] hover:bg-emerald-500/20 hover:text-emerald-400 border border-[var(--line)] flex items-center gap-1"
                            title={t12(language, 'Add Pin Hole (DIN 7)', 'Pim Deliği Ekle (DIN 7)')}
                        >
                            + {t12(language, 'Pin', 'Pim')}
                        </button>
                        {/* Shoulder Transition Toggle (One click between DIN 509 Undercut and Radius) */}
                        {(() => {
                            const curTrans = selectedSeg.shoulderTransition ?? 'undercut';
                            const radVal = selectedSeg.shoulderFilletRadius || 1.5;
                            return (
                                <button
                                    onClick={() => onToggleShoulderTransition?.(selectedSeg.segmentIndex, curTrans === 'undercut' ? 'radius' : 'undercut')}
                                    className={`px-2 py-1 rounded border flex items-center gap-1 font-bold transition-colors ${
                                        curTrans === 'undercut'
                                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 hover:bg-sky-500/30'
                                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                                    }`}
                                    title={t12(language, 'Shoulder Transition: DIN 509 Undercut ⟷ DIN 743 Fillet', 'Omuz Geçiş Tipi: DIN 509 Taşlama ⟷ DIN 743 Radyüs')}
                                >
                                    {curTrans === 'undercut' ? '⚙️ DIN 509' : `⌒ R${radVal}`}
                                </button>
                            );
                        })()}

                        {/* Punta: ONLY on first segment (left end) or last segment (right end) */}
                        {(selectedSeg.segmentIndex === 0 || selectedSeg.segmentIndex === segments.length - 1) && (
                            <button
                                onClick={() => onAddFeature?.(selectedSeg.id, 'center_drill')}
                                className="px-2 py-1 rounded bg-[var(--bg-3)] hover:bg-teal-500/20 hover:text-teal-400 border border-[var(--line)] flex items-center gap-1"
                                title={t12(language, 'DIN 332 Center Drill Hole (End Face)', 'DIN 332 Punta Deliği (Alın Yüzü)')}
                            >
                                + {t12(language, 'Center Drill', 'Punta')}
                            </button>
                        )}
                        <button
                            onClick={() => onUpdateSegment?.(selectedSeg.id, { chamferLeft: 1.5, chamferRight: 1.5 })}
                            className="px-2 py-1 rounded bg-[var(--bg-3)] hover:bg-indigo-500/20 hover:text-indigo-400 border border-[var(--line)] flex items-center gap-1"
                            title={t12(language, 'Apply 1.5x45° Chamfer to Corners', 'Köşelere 1.5x45° Pah Uygula')}
                        >
                            + {t12(language, 'Chamfer (1.5x45°)', 'Pah (1.5x45°)')}
                        </button>

                        <div className="w-[1px] h-4 bg-[var(--line)] mx-0.5" />

                        <button
                            onClick={() => onOpenDetailModal?.(selectedSeg.id)}
                            className="px-2.5 py-1 rounded bg-[var(--cyan)]/20 hover:bg-[var(--cyan)]/30 text-[var(--cyan)] border border-[var(--cyan)]/50 flex items-center gap-1 font-bold"
                            title={t12(language, '1:1 Detail Inspection per Standards (Keyway, Circlip, Undercut, Center Drill, Socket Head)', 'Standartlara Göre 1:1 Detay Muayenesi (Kama, Segman, Taşlama, Punta, İmbus)')}
                        >
                            🔍 {t12(language, '1:1 Inspect', '1:1 Muayene')}
                        </button>

                        <div className="w-[1px] h-4 bg-[var(--line)] mx-0.5" />

                        <button
                            onClick={() => onSplitSegment?.(selectedSeg.id, Math.round(selectedSeg.length / 2))}
                            className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 flex items-center gap-1"
                            title={t12(language, 'Split This Segment in Half', 'Bu Kademeyi Ortadan İkiye Böl')}
                        >
                            <Scissors size={12} /> {t12(language, 'Split', 'Böl')}
                        </button>

                        {segments.length > 1 && (
                            <button
                                onClick={() => onRemoveSegment?.(selectedSeg.id)}
                                className="px-1.5 py-1 rounded bg-[var(--bad)]/15 hover:bg-[var(--bad)]/25 text-[var(--bad)] border border-[var(--bad)]/40"
                                title={t12(language, 'Delete Segment', 'Kademeyi Sil')}
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                )}

                {/* INLINE NUMERIC EDIT MODAL */}
                {editingDim && (
                    <div 
                        className="absolute z-30 p-2 bg-[var(--bg-1)] border border-[var(--cyan)] rounded-md shadow-2xl flex items-center gap-1.5 text-xs font-mono"
                        style={{
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        <span className="text-[var(--alu-dim)] text-[10px]">
                            {editingDim.type === 'segment_dia' ? t12(language, 'Dia (mm):', 'Çap (mm):') : t12(language, 'Length (mm):', 'Boy (mm):')}
                        </span>
                        <input
                            type="number"
                            autoFocus
                            value={editInputVal}
                            onChange={(e) => setEditInputVal(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') submitDimEdit();
                                if (e.key === 'Escape') setEditingDim(null);
                            }}
                            className="w-20 px-1.5 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-white text-xs text-center font-bold"
                        />
                        <button
                            onClick={submitDimEdit}
                            className="p-1 rounded bg-[var(--ok)]/20 text-[var(--ok)] border border-[var(--ok)]/40"
                        >
                            <Check size={13} />
                        </button>
                        <button
                            onClick={() => setEditingDim(null)}
                            className="p-1 rounded bg-[var(--bad)]/20 text-[var(--bad)] border border-[var(--bad)]/40"
                        >
                            <X size={13} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
