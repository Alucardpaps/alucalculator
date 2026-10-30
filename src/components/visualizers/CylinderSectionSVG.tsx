/**
 * components/visualizers/CylinderSectionSVG.tsx
 * 
 * Master-Grade 1:1 Parametric Longitudinal Cross-Section CAD Cutaway for Hydraulic & Pneumatic Cylinders
 * Compliant with ISO 128 (Technical Drawings), ISO 6020-2, ISO 6022, ISO 6982, DIN 2413, ISO 12240-1.
 * 
 * Features:
 * - True UNIFORM Metric Scaling (1 mm = scale * px on both X and Y, no artificial distortion)
 * - Authentic Forged Mounting Eyes (ISO MP5 / AP4) with GE..ES spherical plain bearings, grease nipple & DIN 472 circlips
 * - ISO MT4 Intermediate Trunnion with non-intrusive outer collar & DIN 332 ground pivot pins
 * - Heavy-duty Bolted & Welded Flanges (ISO 6022 Mill Duty, ISO MF3 / MF4) with counterbored DIN 912 screws
 * - Detailed Chrome Piston Rod with DIN 76-A thread undercut, wrench flats (anahtar ağzı) & ISO metric thread
 * - Kastaş original seal profiles: K16/K17 piston seal with anti-extrusion rings, K33 rod seal, K27 wiper, K73 guide rings
 * - ISO 6149 / BSPP welded port bosses with drilled internal fluid passages
 * - Complete ISO 128 drafting standards: differentiated 45° metal hatchings, dash-dot centerlines, extension lines & H8/f7 tolerances
 * - Interactive Pan, Zoom, Auto-Fit, Stroke Slider & Dynamic Cycle Playback
 */

'use client';

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { 
    CylinderDesignResult, 
    CylinderMountingStyle, 
    BarrelConnectionStyle, 
    RodEndType 
} from '@/modules/mechanical/CylinderDesign/engine';
import { useI18nStore } from '@/store/i18nStore';
import { 
    ZoomIn, 
    ZoomOut, 
    Maximize2, 
    Download, 
    Layers, 
    Play, 
    Pause, 
    Sliders, 
    Eye, 
    RotateCcw,
    Wrench,
    Activity,
    ShieldCheck
} from 'lucide-react';
import { t12 } from '@/locales/t12';

interface CylinderSectionSVGProps {
    boreD: number;
    rodD: number;
    strokeS: number;
    strokeProgress: number; // 0.0 to 1.0
    selectedPartNumber: number | null;
    result: CylinderDesignResult | null;
    isPlaying?: boolean;
    playbackSpeed?: number;
    mountingStyle?: CylinderMountingStyle;
    barrelConnectionStyle?: BarrelConnectionStyle;
    rodEndType?: RodEndType;
    cylinderConstruction?: 'tie_rod_iso6020_2' | 'welded_round_iso6022' | 'mill_duty';
    pistonSealType?: 'K16' | 'K21' | 'K40';
    rodSealType?: 'K33' | 'K35';
    wiperType?: 'K01' | 'K03';
    hasCushioningFront?: boolean;
    hasCushioningRear?: boolean;
    fluidMedium?: string;
    operatingPressureBar?: number;
    trunnionPositionMm?: number;
    footMountOffsetMm?: number;
    onStrokeProgressChange?: (p: number) => void;
    onSelectPart?: (partNo: number | null) => void;
    onTogglePlay?: () => void;
    onPlaybackSpeedChange?: (speed: number) => void;
}

export function CylinderSectionSVG({
    boreD,
    rodD,
    strokeS,
    strokeProgress,
    selectedPartNumber,
    result,
    isPlaying = false,
    playbackSpeed = 1.0,
    mountingStyle,
    barrelConnectionStyle,
    rodEndType,
    cylinderConstruction,
    pistonSealType = 'K16',
    rodSealType = 'K33',
    wiperType = 'K01',
    hasCushioningFront = true,
    hasCushioningRear = true,
    fluidMedium = 'hydraulic_mineral_oil',
    operatingPressureBar = 160,
    trunnionPositionMm,
    footMountOffsetMm,
    onStrokeProgressChange,
    onSelectPart,
    onTogglePlay,
    onPlaybackSpeedChange
}: CylinderSectionSVGProps) {
    const { language } = useI18nStore();
    
    // Viewport & Pan/Zoom State
    const [zoom, setZoom] = useState(1.0);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showDimensions, setShowDimensions] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [showJointDetails, setShowJointDetails] = useState(true);
    const [showHud, setShowHud] = useState(true);
    const [containerSize, setContainerSize] = useState({ width: 1200, height: 560 });

    const svgContainerRef = useRef<HTMLDivElement>(null);

    // Dynamic viewport tracking: automatically size viewBox to match container proportions
    useEffect(() => {
        if (!svgContainerRef.current) return;
        const updateSize = () => {
            if (svgContainerRef.current) {
                const rect = svgContainerRef.current.getBoundingClientRect();
                if (rect.width > 200 && rect.height > 200) {
                    setContainerSize({
                        width: Math.round(rect.width),
                        height: Math.round(rect.height),
                    });
                }
            }
        };
        updateSize();
        const ro = new ResizeObserver(updateSize);
        ro.observe(svgContainerRef.current);
        return () => ro.disconnect();
    }, []);

    // Active configurations
    const activeMount = mountingStyle || 'cap_spherical_eye_mp5';
    const activeBarrel = barrelConnectionStyle || 
        (cylinderConstruction === 'tie_rod_iso6020_2' ? 'tie_rod_studs' : 
         cylinderConstruction === 'mill_duty' ? 'bolted_flange' : 'welded_cap_bolted_gland');
    const activeRodEnd: RodEndType = rodEndType || 'spherical_rod_eye_ap4';

    // Engineering geometry dimensions (in true millimeters)
    const tubeOD = result?.tubeOuterDiaDo ?? (boreD + (boreD > 100 ? 30 : 20));
    const tubeWallT = (tubeOD - boreD) / 2;
    const pistonLen = result?.pistonLengthMm ?? Math.max(50, Math.round(boreD * 0.65));
    const glandLen = result?.glandLengthMm ?? Math.max(45, Math.round(rodD * 1.05 + 15));
    const rearCapLen = result?.rearCapLengthMm ?? Math.max(40, Math.round(boreD * 0.48));
    const rodExtRetracted = Math.max(35, Math.round(rodD * 0.75 + 20));
    const currentStrokeMm = strokeProgress * strokeS;

    // Pin & Spherical bearing specs (ISO 6982 / ISO 12240-1)
    const clevisPinDia = result?.clevisPinDiaMm ?? (result?.hasSphericalBearing ? 35 : Math.max(20, Math.round(boreD * 0.35)));
    const eyeOuterDia = Math.max(clevisPinDia * 2.1, tubeOD * 0.75);
    const eyeRadius = eyeOuterDia / 2;

    // Trunnion specs (ISO MT4)
    const hasTrunnion = activeMount === 'intermediate_trunnion_mt4' || activeMount === 'trunnion_mid' || activeMount === 'head_trunnion_mt1';
    const trunnionPinDia = result?.trunnionPinDiaMm ?? Math.max(25, Math.round(boreD * 0.38));
    const trunnionPinLen = result?.trunnionPinLengthMm ?? Math.max(30, Math.round(trunnionPinDia * 0.9));
    const trunnionCollarThickness = Math.max(12, Math.round(tubeWallT * 1.3));

    // Flange specs (ISO MF3 / MF4 / Bolted)
    const hasFrontFlange = activeMount === 'head_flange_mf3' || activeMount === 'flange_front' || activeBarrel === 'bolted_flange';
    const hasRearFlange = activeMount === 'cap_flange_mf4' || activeMount === 'flange_rear' || activeBarrel === 'bolted_flange';
    const flangeThickness = result?.flangeThicknessMm ?? Math.max(20, Math.round(boreD * 0.22));
    const flangeOuterDia = Math.max(tubeOD + 50, Math.round(boreD * 1.55));

    // Stop tube metrics
    const hasStopTube = (result?.needsStopTube ?? false) && (result?.stopTubeRecommendedLengthMm ?? 0) > 0;
    const stopTubeLenMm = result?.stopTubeRecommendedLengthMm ?? 0;

    // Cushioning spear metrics
    const cushionLengthMm = result?.cushionLengthMm ?? 28;
    const cushionSpearDia = result?.cushionSpearDiaMm ?? Math.round(rodD * 0.85);

    // ─────────────────────────────────────────────────────────────────────────────
    // UNIFORM SCALING & BOUNDING BOX CALCULATION (1 mm = scale * px on BOTH X and Y)
    // ─────────────────────────────────────────────────────────────────────────────
    const viewBoxWidth = Math.max(800, containerSize.width);
    const viewBoxHeight = Math.max(420, containerSize.height);
    const paddingX = 45;
    const paddingY = 35;

    // Physical millimeter space layout along X:
    // x = 0 is at the tube start (interface between rear cap and tube bore)
    // Rear features extend in negative X direction
    // Front features extend in positive X direction

    // Rear extension (mm)
    let rearExtMm = rearCapLen;
    if (activeMount === 'cap_spherical_eye_mp5' || activeMount === 'cap_plain_eye_mp3' || activeMount === 'cap_male_eye_mp4') {
        rearExtMm = rearCapLen + eyeRadius * 1.7;
    } else if (activeMount === 'cap_clevis_mp1' || activeMount === 'clevis_rear') {
        rearExtMm = rearCapLen + clevisPinDia * 1.6 + 15;
    } else if (hasRearFlange) {
        rearExtMm = rearCapLen + flangeThickness + 10;
    } else if (activeMount === 'extended_tie_rods_mx2' || activeMount === 'extended_tie_rods_mx3') {
        rearExtMm = rearCapLen + 35;
    }

    // Barrel bore chamber length (mm)
    // Port A is located in the Rear Cap block, and Port B is located in the Front Gland block.
    // This standard ISO 6020-2 / DIN 24554 placement guarantees that ports A & B are 100% free of
    // the piston hub & seal package across the entire stroke range (0% to 100%), completely
    // eliminating hydraulic lock, fluid starvation, and seal clipping.
    const portClearanceA = 0;
    const portClearanceB = (hasStopTube ? stopTubeLenMm : 0);
    const cushionSpearLenA = cushionLengthMm;
    const cushionSpearLenB = cushionLengthMm;
    const barrelBoreLenMm = strokeS + pistonLen + portClearanceB;
    const glandStartMm = barrelBoreLenMm;
    const tubeEndMm = glandStartMm + glandLen;

    // Maximum Front extension envelope at full extension stroke (mm) for steady, jitter-free CAD scaling
    let frontExtMaxMm = glandLen + rodExtRetracted + strokeS;
    if (activeRodEnd === 'spherical_rod_eye_ap4' || activeRodEnd === 'spherical_eye') {
        frontExtMaxMm += eyeRadius * 1.8 + 25;
    } else if (activeRodEnd === 'rod_clevis_ap2' || activeRodEnd === 'clevis_pin') {
        frontExtMaxMm += clevisPinDia * 1.6 + 25;
    } else if (activeRodEnd === 'male_thread') {
        frontExtMaxMm += Math.max(35, Math.round(rodD * 0.95)) + 15;
    } else if (activeRodEnd === 'flanged_rod_end') {
        frontExtMaxMm += 35;
    } else {
        frontExtMaxMm += 25;
    }
    if (activeMount === 'extended_tie_rods_mx1' || activeMount === 'extended_tie_rods_mx3') {
        frontExtMaxMm = Math.max(frontExtMaxMm, glandLen + 35);
    }

    const totalPhysicalLengthMm = rearExtMm + barrelBoreLenMm + frontExtMaxMm + 60;

    // Physical millimeter height (radial Y)
    let maxPhysicalTopMm = tubeOD / 2 + 25;
    let maxPhysicalBottomMm = tubeOD / 2 + 55;

    const hasTieRods = activeBarrel === 'tie_rod_studs';
    const hasCushF = hasCushioningFront !== false;
    const hasCushR = hasCushioningRear !== false;

    // Tie-rod nominal diameter (ISO 6020-2 / DIN 24554)
    const tieDiaMm = result?.boltedJoints?.tieRodStuds?.size
        ? (parseInt(result.boltedJoints.tieRodStuds.size.replace(/\D/g, ''), 10) || (boreD <= 40 ? 10 : boreD <= 63 ? 12 : boreD <= 100 ? 16 : 22))
        : (boreD <= 40 ? 10 : boreD <= 63 ? 12 : boreD <= 100 ? 16 : 22);

    // ISO 6020-2 / DIN 24554 Square Head & Cap dimension E (mm)
    const iso6020SquareE = (() => {
        if (boreD <= 25) return 40;
        if (boreD <= 32) return 45;
        if (boreD <= 40) return 63;
        if (boreD <= 50) return 75;
        if (boreD <= 63) return 90;
        if (boreD <= 80) return 115;
        if (boreD <= 100) return 126;
        if (boreD <= 125) return 165;
        if (boreD <= 160) return 200;
        if (boreD <= 200) return 250;
        return Math.max(tubeOD + 24, Math.round(boreD * 1.42));
    })();
    // In 2D longitudinal cutaway view, ensure square block fully encloses corner tie-rod through-holes and nuts with steel margin
    const squareE = Math.max(iso6020SquareE, Math.round(tubeOD + tieDiaMm * 2 + 18));
    const rSquare = squareE / 2;

    // Tie-rod radial distance in 2D cutaway view (positioned at corner through-holes, clearing tube OD)
    const rTie = Math.round(tubeOD / 2 + tieDiaMm / 2 + 4);

    if (hasTieRods) {
        maxPhysicalTopMm = Math.max(maxPhysicalTopMm, rSquare + 40);
        maxPhysicalBottomMm = Math.max(maxPhysicalBottomMm, rSquare + 44);
    }
    if (hasTrunnion) {
        maxPhysicalTopMm = Math.max(maxPhysicalTopMm, (tubeOD / 2) + trunnionCollarThickness + trunnionPinLen + 20);
        maxPhysicalBottomMm = Math.max(maxPhysicalBottomMm, (tubeOD / 2) + trunnionCollarThickness + trunnionPinLen + 65);
    }
    if (hasFrontFlange || hasRearFlange) {
        maxPhysicalTopMm = Math.max(maxPhysicalTopMm, flangeOuterDia / 2 + 18);
        maxPhysicalBottomMm = Math.max(maxPhysicalBottomMm, flangeOuterDia / 2 + 35);
    }
    if (activeMount === 'side_lugs_ms2' || activeMount === 'foot_mount') {
        maxPhysicalBottomMm = Math.max(maxPhysicalBottomMm, (tubeOD / 2) + 85);
    }
    if (activeMount === 'cap_spherical_eye_mp5' || activeMount === 'cap_plain_eye_mp3' || activeMount === 'cap_male_eye_mp4' || activeRodEnd === 'spherical_rod_eye_ap4' || activeRodEnd === 'plain_welded_eye') {
        maxPhysicalTopMm = Math.max(maxPhysicalTopMm, eyeRadius + 18);
        maxPhysicalBottomMm = Math.max(maxPhysicalBottomMm, eyeRadius + 18);
    }

    const totalPhysicalHeightMm = maxPhysicalTopMm + maxPhysicalBottomMm + 24;

    // SINGLE UNIFORM SCALE: 1 mm is strictly 'scale' SVG pixels in both axes!
    const uniformScale = useMemo(() => {
        const availableW = viewBoxWidth - paddingX * 2;
        const availableH = viewBoxHeight - paddingY * 2;
        const sX = availableW / Math.max(1, totalPhysicalLengthMm);
        const sY = availableH / Math.max(1, totalPhysicalHeightMm);
        // Cleanly scale the cylinder to fill ~94% of available space (no artificial 0.95 cap!)
        return Math.min(sX, sY) * 0.94;
    }, [viewBoxWidth, viewBoxHeight, totalPhysicalLengthMm, totalPhysicalHeightMm, paddingX, paddingY]);

    // Compute actual rendered dimensions and symmetrically center the entire assembly
    const drawnWidth = totalPhysicalLengthMm * uniformScale;
    const drawnHeight = totalPhysicalHeightMm * uniformScale;
    const leftMargin = Math.max(paddingX, (viewBoxWidth - drawnWidth) / 2);
    const topMargin = Math.max(paddingY, (viewBoxHeight - drawnHeight) / 2);

    // Centerline Y coordinate in SVG space (dynamically balanced & centered)
    const centerY = topMargin + maxPhysicalTopMm * uniformScale;

    // X origin in SVG space (where rear cap meets tube inner bore, dynamically centered)
    const originX = leftMargin + (rearExtMm + 20) * uniformScale;

    // Helper functions to map physical mm to SVG pixels
    const toPxX = useCallback((mm: number) => originX + mm * uniformScale, [originX, uniformScale]);
    const toPxY = useCallback((radialMm: number) => centerY + radialMm * uniformScale, [centerY, uniformScale]);
    const toDeltaPx = useCallback((mm: number) => mm * uniformScale, [uniformScale]);

    // Key SVG pixel coordinates
    const pxTubeStart = toPxX(0);
    const pxGlandStart = toPxX(glandStartMm);
    const pxTubeEnd = toPxX(tubeEndMm);
    const pxRearCapEnd = toPxX(-rearCapLen);
    const isThreadedGland = activeBarrel === 'welded_cap_threaded_gland';
    const pxTubeWallEnd = isThreadedGland ? pxTubeEnd : pxGlandStart;

    // Oil Ports & Internal Gland Anchor Coordinates (Single-Source-of-Truth)
    const pxPortA = pxRearCapEnd + toDeltaPx(rearCapLen * 0.55);
    const pxPortB = hasTieRods 
        ? (pxGlandStart + toDeltaPx(glandLen * 0.45))
        : (pxGlandStart + toDeltaPx(Math.max(10, Math.round(glandLen * 0.18))));
    const pxOring = pxGlandStart + toDeltaPx(glandLen * 0.38);
    const pxRodSeal = pxGlandStart + toDeltaPx(glandLen * 0.55);
    const pxGuide = pxGlandStart + toDeltaPx(glandLen * 0.72);

    // Dynamic animated piston coordinates (retracted piston rests against rear cap at x = 0)
    const pistonXLeftMm = currentStrokeMm;
    const pistonXRightMm = pistonXLeftMm + pistonLen;
    const pxPistonLeft = toPxX(pistonXLeftMm);
    const pxPistonRight = toPxX(pistonXRightMm);

    // Rod neck and rod end coordinates
    const rodNeckDia = Math.max(16, Math.round(rodD * 0.72));
    const rodEndMm = tubeEndMm + (rodExtRetracted + currentStrokeMm);
    const pxRodStart = pxPistonLeft + toDeltaPx(14);
    const pxRodEnd = toPxX(rodEndMm);

    // Radial coordinates
    const rBore = boreD / 2;
    const rOD = tubeOD / 2;
    const rRod = rodD / 2;

    const yTopBore = toPxY(-rBore);
    const yBotBore = toPxY(rBore);
    const yTopOD = toPxY(-rOD);
    const yBotOD = toPxY(rOD);
    const yTopRod = toPxY(-rRod);
    const yBotRod = toPxY(rRod);

    const yTopSquare = toPxY(-rSquare);
    const yBotSquare = toPxY(rSquare);
    const yTopTie = toPxY(-rTie);
    const yBotTie = toPxY(rTie);

    // Intermediate Trunnion Position
    const trunnionPosMm = (activeMount === 'head_trunnion_mt1')
        ? (glandStartMm + glandLen * 0.45)
        : (trunnionPositionMm || (barrelBoreLenMm / 2));
    const pxTrunnionCenter = toPxX(trunnionPosMm);

    // Pan & Zoom Mouse handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.12 : -0.12;
        setZoom((prev) => Math.min(4.0, Math.max(0.35, Number((prev + delta).toFixed(2)))));
    };

    const resetView = () => {
        setZoom(1.0);
        setPan({ x: 0, y: 0 });
    };

    // Export SVG
    const exportSVG = () => {
        const svgEl = document.getElementById('cylinder-cad-master-svg');
        if (!svgEl) return;
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svgEl);
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alucalculator_1to1_cad_cylinder_Ø${boreD}xØ${rodD}_S${strokeS}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="relative w-full h-full flex flex-col bg-[var(--bg-0)] border border-[var(--line)] rounded-lg overflow-hidden select-none font-mono">
            {/* Top Precision Instrument Toolbar */}
            <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[var(--bg-1)] border-b border-[var(--line)] text-xs text-[var(--alu)] gap-2 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-[var(--cyan)] tracking-wider flex items-center gap-1.5">
                        <Layers size={14} /> {t12(language, '1:1 Master CAD Blueprint', '1:1 Kesit CAD Teknik Resmi')}
                    </span>
                    <span className="text-[10px] text-[var(--alu-dim)] px-2 py-0.5 rounded bg-[var(--bg-3)] border border-[var(--line)]">
                        ISO 6020-2 / DIN 2413 · Ø{boreD}H8 / Ø{rodD}f7 · S={strokeS} mm
                    </span>
                    <span className="hidden lg:inline text-[9px] text-[var(--ok)] px-1.5 py-0.5 rounded bg-[var(--ok)]/10 border border-[var(--ok)]/30">
                        {t12(language, 'Scale 1:1 Uniform', '1:1 Gerçek Orantılı')}
                    </span>
                </div>

                {/* Strok slider & Cycle Playback */}
                <div className="flex items-center gap-2 bg-[var(--bg-2)] px-2.5 py-1 rounded border border-[var(--line)]">
                    {onTogglePlay && (
                        <button
                            onClick={onTogglePlay}
                            title={isPlaying ? t12(language, 'Pause Cycle', 'Durdur') : t12(language, 'Automatic Cycle', 'Otomatik Çevrim (Cycle)')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                                isPlaying
                                    ? 'bg-[var(--cyan)] text-black border-[var(--cyan)] '
                                    : 'bg-[var(--cyan)]/15 border-[var(--cyan)]/40 text-[var(--cyan)] hover:bg-[var(--cyan)]/25'
                            }`}
                        >
                            {isPlaying ? <Pause size={11} /> : <Play size={11} />}
                            <span>{isPlaying ? t12(language, 'PAUSE', 'DURDUR') : t12(language, 'CYCLE', 'ÇEVRİM')}</span>
                        </button>
                    )}

                    {onPlaybackSpeedChange && (
                        <button
                            onClick={() => {
                                const next = playbackSpeed === 1.0 ? 2.0 : (playbackSpeed === 2.0 ? 0.5 : 1.0);
                                onPlaybackSpeedChange(next);
                            }}
                            className="px-1.5 py-0.5 rounded bg-[var(--bg-0)] text-[9px] text-[var(--alu-dim)] hover:text-white border border-[var(--line)]"
                        >
                            {playbackSpeed}x
                        </button>
                    )}

                    <span className="text-[10px] text-[var(--cyan)] font-bold flex items-center gap-1 font-mono">
                        <Sliders size={11} /> {Math.round(currentStrokeMm)} mm ({Math.round(strokeProgress * 100)}%)
                    </span>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.005}
                        value={strokeProgress}
                        onChange={(e) => onStrokeProgressChange?.(Number(e.target.value))}
                        className="w-24 sm:w-36 accent-[var(--cyan)] h-1.5 bg-[var(--bg-0)] rounded cursor-pointer"
                    />
                </div>

                {/* Technical Drawing View Controls */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setShowHud(!showHud)}
                        className={`px-2 py-1 rounded text-[10px] border transition-colors flex items-center gap-1 ${
                            showHud ? 'bg-[var(--cyan)]/20 border-[var(--cyan)]/50 text-[var(--cyan)] font-bold' : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)]'
                        }`}
                        title={t12(language, 'Toggle Precision Telemetry HUD', 'Telemetri HUD Aç/Kapat')}
                    >
                        <Activity size={11} />
                        HUD
                    </button>
                    <button
                        onClick={() => setShowDimensions(!showDimensions)}
                        className={`px-2 py-1 rounded text-[10px] border transition-colors ${
                            showDimensions ? 'bg-[var(--cyan)]/20 border-[var(--cyan)]/50 text-[var(--cyan)]' : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)]'
                        }`}
                        title={t12(language, 'Toggle ISO Dimension Lines', 'ISO Ölçülendirme Çizgilerini Aç/Kapat')}
                    >
                        {t12(language, 'Dimensions', 'Ölçüler')}
                    </button>
                    <button
                        onClick={() => setShowLabels(!showLabels)}
                        className={`px-2 py-1 rounded text-[10px] border transition-colors ${
                            showLabels ? 'bg-[var(--warn)]/20 border-[var(--warn)]/50 text-[var(--warn)]' : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)]'
                        }`}
                        title={t12(language, 'Toggle BOM Part Balloons', 'Parça Numarası Balonlarını Aç/Kapat')}
                    >
                        {t12(language, 'Labels', 'Etiketler')}
                    </button>
                    <button
                        onClick={() => setShowJointDetails(!showJointDetails)}
                        className={`px-2 py-1 rounded text-[10px] border transition-colors flex items-center gap-1 ${
                            showJointDetails ? 'bg-[var(--warn)]/20 border-[var(--warn)]/50 text-[var(--warn)]' : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)]'
                        }`}
                        title={t12(language, 'Toggle Welding, Bolting & Thread Joint Callouts', 'Kaynak, Cıvata ve Diş Bağlantı Detaylarını Aç/Kapat')}
                    >
                        <Wrench size={10} />
                        {t12(language, 'Joints', 'Bağlantılar')}
                    </button>
                    
                    {/* Zoom / Reset Buttons */}
                    <div className="flex items-center rounded border border-[var(--line)] bg-[var(--bg-2)] overflow-hidden">
                        <button
                            onClick={() => setZoom(prev => Math.max(0.35, prev - 0.15))}
                            className="p-1 hover:bg-[var(--bg-3)] text-[var(--alu)]"
                            title={t12(language, 'Zoom Out', 'Uzaklaştır')}
                        >
                            <ZoomOut size={12} />
                        </button>
                        <span className="text-[9px] px-1 text-[var(--alu-dim)] font-mono">{Math.round(zoom * 100)}%</span>
                        <button
                            onClick={() => setZoom(prev => Math.min(4.0, prev + 0.15))}
                            className="p-1 hover:bg-[var(--bg-3)] text-[var(--alu)]"
                            title={t12(language, 'Zoom In', 'Yakınlaştır')}
                        >
                            <ZoomIn size={12} />
                        </button>
                        <button
                            onClick={resetView}
                            className="p-1 hover:bg-[var(--bg-3)] text-[var(--cyan)] border-l border-[var(--line)]"
                            title={t12(language, 'Fit to View (1:1)', 'Görünümü Sıfırla (1:1)')}
                        >
                            <RotateCcw size={12} />
                        </button>
                    </div>

                    <button
                        onClick={exportSVG}
                        className="px-2 py-1 rounded bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 text-[var(--cyan)] border border-[var(--cyan)]/40 flex items-center gap-1 text-[10px] font-bold"
                        title={t12(language, 'Export Vector SVG Blueprint', 'Vektörel SVG Teknik Resim İndir')}
                    >
                        <Download size={12} /> SVG
                    </button>
                </div>
            </div>

            {/* Drawing Canvas Area with Interactive Pan & Zoom */}
            <div 
                ref={svgContainerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onDoubleClick={resetView}
                className={`relative flex-1 w-full overflow-hidden flex items-center justify-center p-0 bg-[var(--bg-0)] ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
            >
                {/* Floating Precision CAD Telemetry HUD */}
                {showHud && (
                    <div className="absolute top-3 left-3 z-10 pointer-events-none flex flex-col gap-1.5 font-mono select-none">
                        <div className="pointer-events-auto bg-[var(--bg-0)]/90 border border-[var(--line-strong)] rounded-[var(--radius-s)] p-2.5 shadow-2xl text-xs space-y-2 min-w-[250px] max-w-[320px]">
                            {/* HUD Header */}
                            <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5 text-[10px]">
                                <div className="flex items-center gap-1.5 font-bold text-[var(--cyan)]">
                                    <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-pulse" />
                                    <span className="tracking-wider">{t12(language, 'CAD TELEMETRY', 'CAD TELEMETRİSİ')}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--bg-3)] text-[var(--alu-dim)] font-bold">
                                        {isPlaying ? `${playbackSpeed}x ${t12(language, 'ACTIVE', 'AKTİF')}` : t12(language, 'STATIC', 'STATİK')}
                                    </span>
                                    <button
                                        onClick={() => setShowHud(false)}
                                        className="text-[var(--alu-dim)] hover:text-white px-1 text-[11px] cursor-pointer"
                                        title={t12(language, 'Minimize HUD', 'HUD Gizle')}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Live Stroke Position & Progress Bar */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-[var(--alu-dim)] font-bold">{t12(language, 'STROKE:', 'STROK:')}</span>
                                    <span className="text-white font-bold font-mono">
                                        {Math.round(currentStrokeMm)} mm <span className="text-[var(--cyan)]">({Math.round(strokeProgress * 100)}%)</span>
                                    </span>
                                </div>
                                <div className="w-full bg-[var(--bg-0)] h-1.5 rounded-full overflow-hidden border border-[var(--line)]">
                                    <div
                                        className="bg-[var(--cyan)] h-full transition-all duration-75"
                                        style={{ width: `${Math.round(strokeProgress * 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Thrust & Pressure readouts */}
                            {result && (
                                <div className="space-y-1 pt-1 border-t border-[var(--line)]/60 text-[10px]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Thrust (F_push):', 'İtme Kuvveti (F_itme):')}</span>
                                        <span className="text-[var(--cyan)] font-bold">
                                            {result.pushForceKN.toFixed(1)} kN <span className="text-[var(--alu-dim)] font-normal">({Math.round(result.pushForceKN * 101.97)} kgf)</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Retract (F_pull):', 'Çekme Kuvveti (F_çekme):')}</span>
                                        <span className="text-[var(--warn)] font-bold">
                                            {result.pullForceKN.toFixed(1)} kN <span className="text-[var(--alu-dim)] font-normal">({Math.round(result.pullForceKN * 101.97)} kgf)</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Buckling Safety:', 'Burkulma Güvenliği:')}</span>
                                        <span className={`font-bold flex items-center gap-1 ${
                                            result.isBucklingSafe ? 'text-[var(--ok)]' : 'text-[var(--bad)]'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${result.isBucklingSafe ? 'bg-[var(--ok)]' : 'bg-[var(--bad)]'}`} />
                                            SF = {result.bucklingSafetyFactor.toFixed(1)} ({result.isBucklingSafe ? t12(language, 'PASS', 'UYGUN') : t12(language, 'FAIL', 'UYGUN DEĞİL')})
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Tube Hoop SF:', 'Boru Çeper Emniyeti:')}</span>
                                        <span className="text-[var(--ok)] font-bold">SF = {result.tubeYieldSafetyFactor} (DIN 2413)</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Hydraulic Power:', 'Hidrolik Güç:')}</span>
                                        <span className="text-white font-bold">{result.hydraulicPowerKW.toFixed(1)} kW</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <svg
                    id="cylinder-cad-master-svg"
                    viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                    className="w-full h-full pointer-events-auto"
                >
                    <defs>
                        {/* 1. Industrial Millimeter Drafting Grid */}
                        <pattern id="cadGridSmall" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#0e1622" strokeWidth="0.5" />
                        </pattern>
                        <pattern id="cadGridMajor" width="50" height="50" patternUnits="userSpaceOnUse">
                            <rect width="50" height="50" fill="url(#cadGridSmall)" />
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#172436" strokeWidth="0.8" />
                        </pattern>

                        {/* 2. ISO 128 Differentiated Metal Cross-Hatching Patterns */}
                        {/* Honed Tube (St52-3) - 45° Dense Steel Hatch */}
                        <pattern id="hatchSteelTube" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="6" stroke="#486581" strokeWidth="0.8" />
                        </pattern>

                        {/* Piston Body (42CrMo4 / GGG-40) - -45° Hatch */}
                        <pattern id="hatchPiston" width="6" height="6" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="6" stroke="#627d98" strokeWidth="0.85" />
                        </pattern>

                        {/* Front Gland (C45 / GGG-50) - 30° Hatch */}
                        <pattern id="hatchGland" width="7" height="7" patternTransform="rotate(30 0 0)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="7" stroke="#4a637d" strokeWidth="0.8" />
                        </pattern>

                        {/* Rear Cap - 60° Hatch */}
                        <pattern id="hatchRearCap" width="7" height="7" patternTransform="rotate(60 0 0)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="7" stroke="#3e566e" strokeWidth="0.8" />
                        </pattern>

                        {/* Bearing Bronze / Guide Composite - Cross-Hatch */}
                        <pattern id="hatchBronzeGuide" width="4" height="4" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="4" stroke="#3dd68c" strokeWidth="0.6" />
                            <line x1="0" y1="0" x2="4" y2="0" stroke="#3dd68c" strokeWidth="0.6" />
                        </pattern>

                        {/* Stop Tube (St52-3 spacer) - Amber Double Hatch */}
                        <pattern id="hatchStopTube" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="8" stroke="#f59e0b" strokeWidth="1.1" />
                            <line x1="3" y1="0" x2="3" y2="8" stroke="#f59e0b" strokeWidth="0.5" />
                        </pattern>

                        {/* 3. Photorealistic Chrome Rod Gradient */}
                        <linearGradient id="masterChromeRod" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#485c6e" />
                            <stop offset="12%" stopColor="#8da0b0" />
                            <stop offset="28%" stopColor="#ffffff" />
                            <stop offset="42%" stopColor="#cbd7e3" />
                            <stop offset="70%" stopColor="#7a8d9e" />
                            <stop offset="90%" stopColor="#3d4e5e" />
                            <stop offset="100%" stopColor="#25323d" />
                        </linearGradient>

                        {/* Honed Bore Mirror Specular Gradient */}
                        <linearGradient id="honedBoreGleam" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3ad0e6" stopOpacity="0.4" />
                            <stop offset="50%" stopColor="#3ad0e6" stopOpacity="0.05" />
                            <stop offset="100%" stopColor="#3ad0e6" stopOpacity="0.3" />
                        </linearGradient>

                        {/* Active Fluid Chamber Gradient (Pressure Tint) */}
                        <linearGradient id="highPressureOilA" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={fluidMedium === 'pneumatic_air' ? '#bae6fd' : fluidMedium === 'water_glycol_hfc' ? '#f43f5e' : fluidMedium === 'synthetic_ester_hfdu' ? '#f59e0b' : '#0891b2'} stopOpacity={fluidMedium === 'pneumatic_air' ? 0.2 : 0.35} />
                            <stop offset="70%" stopColor={fluidMedium === 'pneumatic_air' ? '#e0f2fe' : fluidMedium === 'water_glycol_hfc' ? '#fb7185' : fluidMedium === 'synthetic_ester_hfdu' ? '#fbbf24' : '#06b6d4'} stopOpacity={fluidMedium === 'pneumatic_air' ? 0.12 : 0.22} />
                            <stop offset="100%" stopColor={fluidMedium === 'pneumatic_air' ? '#f0f9ff' : fluidMedium === 'water_glycol_hfc' ? '#fda4af' : fluidMedium === 'synthetic_ester_hfdu' ? '#fde68a' : '#22d3ee'} stopOpacity={fluidMedium === 'pneumatic_air' ? 0.05 : 0.12} />
                        </linearGradient>

                        {/* Annular Return Fluid Chamber B */}
                        <linearGradient id="returnOilB" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={fluidMedium === 'pneumatic_air' ? '#94a3b8' : fluidMedium === 'water_glycol_hfc' ? '#be123c' : fluidMedium === 'synthetic_ester_hfdu' ? '#b45309' : '#1e3a8a'} stopOpacity={fluidMedium === 'pneumatic_air' ? 0.1 : 0.2} />
                            <stop offset="100%" stopColor={fluidMedium === 'pneumatic_air' ? '#cbd5e1' : fluidMedium === 'water_glycol_hfc' ? '#e11d48' : fluidMedium === 'synthetic_ester_hfdu' ? '#d97706' : '#1e3a8a'} stopOpacity={fluidMedium === 'pneumatic_air' ? 0.03 : 0.08} />
                        </linearGradient>

                        {/* DIN/ISO Dimension Arrow Markers */}
                        <marker id="masterCadArrowEnd" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                            <path d="M 0 0.5 L 7 3 L 0 5.5 Z" fill="#7aa2ff" />
                        </marker>
                        <marker id="masterCadArrowStart" markerWidth="8" markerHeight="8" refX="0" refY="3" orient="auto">
                            <path d="M 7 0.5 L 0 3 L 7 5.5 Z" fill="#7aa2ff" />
                        </marker>
                        <marker id="masterCyanArrowEnd" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                            <path d="M 0 0.5 L 7 3 L 0 5.5 Z" fill="#3ad0e6" />
                        </marker>
                        <marker id="masterCyanArrowStart" markerWidth="8" markerHeight="8" refX="0" refY="3" orient="auto">
                            <path d="M 7 0.5 L 0 3 L 7 5.5 Z" fill="#3ad0e6" />
                        </marker>
                    </defs>

                    {/* Canvas Background Grid */}
                    <rect width={viewBoxWidth} height={viewBoxHeight} fill="url(#cadGridMajor)" />

                    {/* TRANSFORM GROUP (Supports Pan & Zoom smoothly) */}
                    <g 
                        transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
                        style={{ transformOrigin: 'center center', transition: isDragging ? 'none' : 'transform 0.15s ease-out' }}
                    >
                        {/* ─────────────────────────────────────────────────────────────
                            CHAMBER A & B: INTERNAL HYDRAULIC FLUID PRESSURES
                            ───────────────────────────────────────────────────────────── */}
                        {/* Chamber A (Bore Side) */}
                        <rect
                            x={pxTubeStart}
                            y={yTopBore}
                            width={Math.max(2, pxPistonLeft - pxTubeStart)}
                            height={yBotBore - yTopBore}
                            fill="url(#highPressureOilA)"
                        />
                        {/* Chamber B (Annular Rod Side) */}
                        <rect
                            x={pxPistonRight}
                            y={yTopBore}
                            width={Math.max(2, pxGlandStart - pxPistonRight)}
                            height={yBotBore - yTopBore}
                            fill="url(#returnOilB)"
                        />

                        {/* Honed bore specular highlight lines */}
                        <line x1={pxTubeStart} y1={yTopBore + 0.5} x2={pxTubeWallEnd} y2={yTopBore + 0.5} stroke="#3ad0e6" strokeWidth="1" opacity="0.6" />
                        <line x1={pxTubeStart} y1={yBotBore - 0.5} x2={pxTubeWallEnd} y2={yBotBore - 0.5} stroke="#3ad0e6" strokeWidth="1" opacity="0.6" />

                        {/* ─────────────────────────────────────────────────────────────
                            1. HONED TUBE (SILINDIR BORUSU) - ISO 3320 / DIN 2413
                            ───────────────────────────────────────────────────────────── */}
                        <g 
                            onClick={() => onSelectPart?.(1)}
                            className="cursor-pointer group"
                        >
                            {/* Top Tube Wall (extends over threaded gland or stops at gland start) */}
                            <rect
                                x={pxTubeStart}
                                y={yTopOD}
                                width={pxTubeWallEnd - pxTubeStart}
                                height={yTopBore - yTopOD}
                                fill="#0c141f"
                                stroke={selectedPartNumber === 1 ? '#3ad0e6' : '#556d8a'}
                                strokeWidth={selectedPartNumber === 1 ? 2 : 1.2}
                            />
                            <rect
                                x={pxTubeStart}
                                y={yTopOD}
                                width={pxTubeWallEnd - pxTubeStart}
                                height={yTopBore - yTopOD}
                                fill="url(#hatchSteelTube)"
                                pointerEvents="none"
                            />

                            {/* Bottom Tube Wall */}
                            <rect
                                x={pxTubeStart}
                                y={yBotBore}
                                width={pxTubeWallEnd - pxTubeStart}
                                height={yBotOD - yBotBore}
                                fill="#0c141f"
                                stroke={selectedPartNumber === 1 ? '#3ad0e6' : '#556d8a'}
                                strokeWidth={selectedPartNumber === 1 ? 2 : 1.2}
                            />
                            <rect
                                x={pxTubeStart}
                                y={yBotBore}
                                width={pxTubeWallEnd - pxTubeStart}
                                height={yBotOD - yBotBore}
                                fill="url(#hatchSteelTube)"
                                pointerEvents="none"
                            />
                        </g>

                        {/* ─────────────────────────────────────────────────────────────
                            2. REAR CAP & REAR MOUNTINGS (ARKA KAPAK & MESNETLEMELER)
                            ───────────────────────────────────────────────────────────── */}
                        <g 
                            onClick={() => onSelectPart?.(5)}
                            className="cursor-pointer group"
                        >
                            {/* Base Rear Cap Body */}
                            {hasTieRods ? (
                                <g>
                                    {/* ISO 6020-2 Square Rear Cap Solid Block (E x E) */}
                                    <rect
                                        x={pxRearCapEnd}
                                        y={yTopSquare}
                                        width={toDeltaPx(rearCapLen)}
                                        height={yBotSquare - yTopSquare}
                                        fill={selectedPartNumber === 5 ? '#17273a' : '#101724'}
                                        stroke={selectedPartNumber === 5 ? '#3ad0e6' : '#556d8a'}
                                        strokeWidth={selectedPartNumber === 5 ? 2 : 1.4}
                                    />
                                    <rect
                                        x={pxRearCapEnd}
                                        y={yTopSquare}
                                        width={toDeltaPx(rearCapLen)}
                                        height={yBotSquare - yTopSquare}
                                        fill="url(#hatchRearCap)"
                                        pointerEvents="none"
                                    />

                                    {/* Counterbore Pilot Recess where Tube End Nests (Depth ~10mm) */}
                                    <rect
                                        x={pxTubeStart - toDeltaPx(10)}
                                        y={yTopOD}
                                        width={toDeltaPx(10)}
                                        height={yBotOD - yTopOD}
                                        fill="#080c14"
                                        stroke="#3ad0e6"
                                        strokeWidth="0.8"
                                        strokeDasharray="3,2"
                                    />
                                    {/* Static Tube Spigot O-Ring Seals (ISO 3601) in Counterbore */}
                                    <ellipse
                                        cx={pxTubeStart - toDeltaPx(5)}
                                        cy={toPxY(-tubeOD / 2 + tubeWallT / 2)}
                                        rx={toDeltaPx(1.8)}
                                        ry={toDeltaPx(1.4)}
                                        fill="#18181b"
                                        stroke="#e6b84a"
                                        strokeWidth="0.8"
                                    />
                                    <ellipse
                                        cx={pxTubeStart - toDeltaPx(5)}
                                        cy={toPxY(tubeOD / 2 - tubeWallT / 2)}
                                        rx={toDeltaPx(1.8)}
                                        ry={toDeltaPx(1.4)}
                                        fill="#18181b"
                                        stroke="#e6b84a"
                                        strokeWidth="0.8"
                                    />

                                    {/* Tie-Rod Through-Holes across Square Cap */}
                                    {/* Top Tie-Rod Through-Hole */}
                                    <line x1={pxRearCapEnd} y1={yTopTie - toDeltaPx(tieDiaMm * 0.55)} x2={pxTubeStart} y2={yTopTie - toDeltaPx(tieDiaMm * 0.55)} stroke="#3ad0e6" strokeWidth="0.7" strokeDasharray="3,2" />
                                    <line x1={pxRearCapEnd} y1={yTopTie + toDeltaPx(tieDiaMm * 0.55)} x2={pxTubeStart} y2={yTopTie + toDeltaPx(tieDiaMm * 0.55)} stroke="#3ad0e6" strokeWidth="0.7" strokeDasharray="3,2" />
                                    <line x1={pxRearCapEnd - toDeltaPx(4)} y1={yTopTie} x2={pxTubeStart + toDeltaPx(4)} y2={yTopTie} stroke="#7aa2ff" strokeWidth="0.6" strokeDasharray="6,2,2,2" />

                                    {/* Bottom Tie-Rod Through-Hole */}
                                    <line x1={pxRearCapEnd} y1={yBotTie - toDeltaPx(tieDiaMm * 0.55)} x2={pxTubeStart} y2={yBotTie - toDeltaPx(tieDiaMm * 0.55)} stroke="#3ad0e6" strokeWidth="0.7" strokeDasharray="3,2" />
                                    <line x1={pxRearCapEnd} y1={yBotTie + toDeltaPx(tieDiaMm * 0.55)} x2={pxTubeStart} y2={yBotTie + toDeltaPx(tieDiaMm * 0.55)} stroke="#3ad0e6" strokeWidth="0.7" strokeDasharray="3,2" />
                                    <line x1={pxRearCapEnd - toDeltaPx(4)} y1={yBotTie} x2={pxTubeStart + toDeltaPx(4)} y2={yBotTie} stroke="#7aa2ff" strokeWidth="0.6" strokeDasharray="6,2,2,2" />
                                </g>
                            ) : (
                                <g>
                                    <rect
                                        x={pxRearCapEnd}
                                        y={yTopOD}
                                        width={toDeltaPx(rearCapLen)}
                                        height={yBotOD - yTopOD}
                                        fill={selectedPartNumber === 5 ? '#17273a' : '#101724'}
                                        stroke={selectedPartNumber === 5 ? '#3ad0e6' : '#556d8a'}
                                        strokeWidth={selectedPartNumber === 5 ? 2 : 1.2}
                                    />
                                    <rect
                                        x={pxRearCapEnd}
                                        y={yTopOD}
                                        width={toDeltaPx(rearCapLen)}
                                        height={yBotOD - yTopOD}
                                        fill="url(#hatchRearCap)"
                                        pointerEvents="none"
                                    />
                                </g>
                            )}

                            {/* Rear Cushioning Throttle Well (Yastıklama Yuvası) */}
                            {hasCushR && (
                                <rect
                                    x={pxTubeStart - toDeltaPx(Math.min(rearCapLen - 8, cushionSpearLenA + 4))}
                                    y={toPxY(-(cushionSpearDia / 2 + 1.5))}
                                    width={toDeltaPx(Math.min(rearCapLen - 8, cushionSpearLenA + 4))}
                                    height={toDeltaPx(cushionSpearDia + 3)}
                                    fill="#070a0f"
                                    stroke="#3ad0e6"
                                    strokeWidth="0.9"
                                    strokeDasharray="3,2"
                                />
                            )}

                            {/* Welded Seams between Tube and Rear Cap (DIN EN ISO 5817 Level B) */}
                            {!hasTieRods && activeBarrel !== 'bolted_flange' && (() => {
                                const aw = result?.weldedJoints.tubeRearCapWeld.throatAwMm ?? Math.max(5, Math.round(tubeWallT * 0.7));
                                const awPx = toDeltaPx(aw);
                                return (
                                    <g>
                                        {/* Multi-pass welded bead top */}
                                        <path
                                            d={`M ${pxTubeStart - awPx} ${yTopOD} 
                                               Q ${pxTubeStart} ${yTopOD - awPx * 1.2} ${pxTubeStart + awPx} ${yTopOD} 
                                               Z`}
                                            fill="#e6b84a"
                                            stroke="#ffe17d"
                                            strokeWidth="1"
                                        />
                                        <path
                                            d={`M ${pxTubeStart - awPx * 0.6} ${yTopOD - awPx * 0.35} Q ${pxTubeStart} ${yTopOD - awPx * 0.85} ${pxTubeStart + awPx * 0.6} ${yTopOD - awPx * 0.35}`}
                                            fill="none"
                                            stroke="#fff"
                                            strokeWidth="0.6"
                                            opacity="0.8"
                                        />

                                        {/* Multi-pass welded bead bottom */}
                                        <path
                                            d={`M ${pxTubeStart - awPx} ${yBotOD} 
                                               Q ${pxTubeStart} ${yBotOD + awPx * 1.2} ${pxTubeStart + awPx} ${yBotOD} 
                                               Z`}
                                            fill="#e6b84a"
                                            stroke="#ffe17d"
                                            strokeWidth="1"
                                        />
                                        <path
                                            d={`M ${pxTubeStart - awPx * 0.6} ${yBotOD + awPx * 0.35} Q ${pxTubeStart} ${yBotOD + awPx * 0.85} ${pxTubeStart + awPx * 0.6} ${yBotOD + awPx * 0.35}`}
                                            fill="none"
                                            stroke="#fff"
                                            strokeWidth="0.6"
                                            opacity="0.8"
                                        />

                                        {/* ISO 2553 Technical Weld Callout Flag & Leader at Bottom Seam */}
                                        {showJointDetails && (
                                            <g transform={`translate(${pxTubeStart}, ${yBotOD + awPx + 2})`}>
                                                <line x1={0} y1={0} x2={-14} y2={12} stroke="#e6b84a" strokeWidth="0.9" />
                                                <line x1={-14} y1={12} x2={-78} y2={12} stroke="#e6b84a" strokeWidth="0.9" />
                                                {/* Weld symbol triangle on reference line */}
                                                <polygon
                                                    points="-26,12 -18,12 -26,20"
                                                    fill="none"
                                                    stroke="#e6b84a"
                                                    strokeWidth="0.8"
                                                />
                                                <text
                                                    x={-30}
                                                    y={10}
                                                    textAnchor="end"
                                                    fontSize="7.5"
                                                    fill="#ffe17d"
                                                    fontWeight="bold"
                                                >
                                                    a={aw}mm (ISO 5817-B)
                                                </text>
                                            </g>
                                        )}
                                    </g>
                                );
                            })()}

                            {/* ── MOUNTING STYLE: REAR ── */}

                            {/* A. ISO MP5 (Spherical Eye) / ISO MP3 (Plain Eye) / ISO MP4 (Male Eye) */}
                            {(activeMount === 'cap_spherical_eye_mp5' || activeMount === 'cap_plain_eye_mp3' || activeMount === 'cap_male_eye_mp4') && (() => {
                                const pxPinCenter = pxRearCapEnd - toDeltaPx(eyeRadius * 0.95);
                                const rEyeOuterPx = toDeltaPx(eyeRadius);
                                const rBearingOuterPx = toDeltaPx(clevisPinDia * 0.78);
                                const rPinHolePx = toDeltaPx(clevisPinDia / 2);
                                const isSpherical = activeMount === 'cap_spherical_eye_mp5';
                                const isMaleEye = activeMount === 'cap_male_eye_mp4';

                                return (
                                    <g>
                                        {/* Forged Shank Neck Transition */}
                                        <path
                                            d={`M ${pxRearCapEnd} ${yTopOD + toDeltaPx(isMaleEye ? 12 : 8)} 
                                               C ${pxRearCapEnd - toDeltaPx(10)} ${yTopOD + toDeltaPx(isMaleEye ? 12 : 8)}, 
                                                 ${pxPinCenter} ${centerY - rEyeOuterPx}, 
                                                 ${pxPinCenter} ${centerY - rEyeOuterPx}
                                               A ${rEyeOuterPx} ${rEyeOuterPx} 0 0 0 ${pxPinCenter} ${centerY + rEyeOuterPx}
                                               C ${pxPinCenter} ${centerY + rEyeOuterPx}, 
                                                 ${pxRearCapEnd - toDeltaPx(10)} ${yBotOD - toDeltaPx(isMaleEye ? 12 : 8)}, 
                                                 ${pxRearCapEnd} ${yBotOD - toDeltaPx(isMaleEye ? 12 : 8)}
                                               Z`}
                                            fill={selectedPartNumber === 5 ? '#17273a' : '#101724'}
                                            stroke={selectedPartNumber === 5 ? '#3ad0e6' : '#556d8a'}
                                            strokeWidth="1.4"
                                        />
                                        <path
                                            d={`M ${pxRearCapEnd} ${yTopOD + toDeltaPx(isMaleEye ? 12 : 8)} 
                                               C ${pxRearCapEnd - toDeltaPx(10)} ${yTopOD + toDeltaPx(isMaleEye ? 12 : 8)}, 
                                                 ${pxPinCenter} ${centerY - rEyeOuterPx}, 
                                                 ${pxPinCenter} ${centerY - rEyeOuterPx}
                                               A ${rEyeOuterPx} ${rEyeOuterPx} 0 0 0 ${pxPinCenter} ${centerY + rEyeOuterPx}
                                               C ${pxPinCenter} ${centerY + rEyeOuterPx}, 
                                                 ${pxRearCapEnd - toDeltaPx(10)} ${yBotOD - toDeltaPx(isMaleEye ? 12 : 8)}, 
                                                 ${pxRearCapEnd} ${yBotOD - toDeltaPx(isMaleEye ? 12 : 8)}
                                               Z`}
                                            fill="url(#hatchRearCap)"
                                            pointerEvents="none"
                                        />

                                        {/* Stepped Shoulder Lines for MP4 Male Tongue */}
                                        {isMaleEye && (
                                            <g>
                                                <line x1={pxRearCapEnd - toDeltaPx(4)} y1={yTopOD + toDeltaPx(12)} x2={pxRearCapEnd + toDeltaPx(6)} y2={yTopOD + toDeltaPx(12)} stroke="#7aa2ff" strokeWidth="1" />
                                                <line x1={pxRearCapEnd - toDeltaPx(4)} y1={yBotOD - toDeltaPx(12)} x2={pxRearCapEnd + toDeltaPx(6)} y2={yBotOD - toDeltaPx(12)} stroke="#7aa2ff" strokeWidth="1" />
                                            </g>
                                        )}

                                        {/* Spherical Bearing Outer Race & Circlip Grooves for MP5 */}
                                        {isSpherical && (
                                            <>
                                                <circle cx={pxPinCenter} cy={centerY} r={rBearingOuterPx} fill="#1a2736" stroke="#e6b84a" strokeWidth="1.2" />
                                                <circle cx={pxPinCenter} cy={centerY} r={rBearingOuterPx + toDeltaPx(1.5)} fill="none" stroke="#64748b" strokeWidth="0.8" strokeDasharray="3,1.5" />
                                                <circle cx={pxPinCenter} cy={centerY} r={rPinHolePx + toDeltaPx(3)} fill="#283a4f" stroke="#3dd68c" strokeWidth="1.3" />
                                            </>
                                        )}

                                        {/* Hardened Bushing Collar for Plain Eye MP3 & Male Eye MP4 */}
                                        {!isSpherical && (
                                            <circle cx={pxPinCenter} cy={centerY} r={rPinHolePx + toDeltaPx(3.5)} fill="#223244" stroke="#e6b84a" strokeWidth="1.1" />
                                        )}

                                        {/* Precision Ground Pin Bore Hole */}
                                        <circle cx={pxPinCenter} cy={centerY} r={rPinHolePx} fill="#06090e" stroke="#3ad0e6" strokeWidth="1.4" />

                                        {/* Center Crosshairs */}
                                        <line x1={pxPinCenter - toDeltaPx(8)} y1={centerY} x2={pxPinCenter + toDeltaPx(8)} y2={centerY} stroke="#3ad0e6" strokeWidth="0.8" strokeDasharray="2,2" />
                                        <line x1={pxPinCenter} y1={centerY - toDeltaPx(8)} x2={pxPinCenter} y2={centerY + toDeltaPx(8)} stroke="#3ad0e6" strokeWidth="0.8" strokeDasharray="2,2" />

                                        {/* DIN 71412 Grease Lubrication Nipple */}
                                        <g transform={`translate(${pxPinCenter}, ${centerY - rEyeOuterPx})`}>
                                            <rect x={-toDeltaPx(3)} y={-toDeltaPx(7)} width={toDeltaPx(6)} height={toDeltaPx(7)} fill="#e6b84a" stroke="#ffe17d" strokeWidth="0.8" rx="1" />
                                            <circle cx={0} cy={-toDeltaPx(4)} r={toDeltaPx(1.2)} fill="#000" />
                                            <line x1={0} y1={0} x2={0} y2={toDeltaPx(rEyeOuterPx - (isSpherical ? rBearingOuterPx : rPinHolePx + 3.5))} stroke="#3ad0e6" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
                                        </g>

                                        {/* Standard Eye Label */}
                                        {showLabels && (
                                            <text x={pxPinCenter} y={centerY - rEyeOuterPx - 10} textAnchor="middle" fontSize="7.5" fill="#3ad0e6" fontWeight="bold">
                                                {isSpherical ? `ISO MP5 (GE ${clevisPinDia} ES)` : isMaleEye ? `ISO MP4 (Ø${clevisPinDia})` : `ISO MP3 (Ø${clevisPinDia})`}
                                            </text>
                                        )}
                                    </g>
                                );
                            })()}

                            {/* B. ISO MP1: Cap Fixed Clevis (Arka Çatal Mafsal) */}
                            {(activeMount === 'cap_clevis_mp1' || activeMount === 'clevis_rear') && (() => {
                                const pxPinCenter = pxRearCapEnd - toDeltaPx(clevisPinDia * 0.95);
                                const rPinHolePx = toDeltaPx(clevisPinDia / 2);

                                return (
                                    <g>
                                        <path
                                            d={`M ${pxRearCapEnd} ${yTopOD + toDeltaPx(6)}
                                               L ${pxPinCenter + toDeltaPx(6)} ${yTopOD + toDeltaPx(10)}
                                               A ${toDeltaPx(clevisPinDia * 0.9)} ${toDeltaPx(clevisPinDia * 0.9)} 0 0 0 ${pxPinCenter + toDeltaPx(6)} ${yBotOD - toDeltaPx(10)}
                                               L ${pxRearCapEnd} ${yBotOD - toDeltaPx(6)}
                                               Z`}
                                            fill={selectedPartNumber === 5 ? '#17273a' : '#101724'}
                                            stroke={selectedPartNumber === 5 ? '#3ad0e6' : '#556d8a'}
                                            strokeWidth="1.4"
                                        />
                                        {/* Machined U-Fork Cheeks Slot */}
                                        <rect
                                            x={pxPinCenter - toDeltaPx(clevisPinDia * 0.85)}
                                            y={toPxY(-clevisPinDia * 0.45)}
                                            width={toDeltaPx(clevisPinDia * 1.7)}
                                            height={toDeltaPx(clevisPinDia * 0.9)}
                                            fill="#06090e"
                                            stroke="#3ad0e6"
                                            strokeWidth="0.9"
                                            strokeDasharray="3,2"
                                        />
                                        {/* Ground Clevis Pin (ISO 2341) */}
                                        <circle cx={pxPinCenter} cy={centerY} r={rPinHolePx} fill="#1e2c3d" stroke="#7aa2ff" strokeWidth="1.4" />
                                        {showLabels && (
                                            <text x={pxPinCenter} y={centerY + toDeltaPx(clevisPinDia * 0.9) + 14} textAnchor="middle" fontSize="7.5" fill="#7aa2ff" fontWeight="bold">
                                                ISO MP1 (Clevis Pin Ø{clevisPinDia})
                                            </text>
                                        )}
                                    </g>
                                );
                            })()}

                            {/* C. ISO MF4: Cap Rectangular/Round Flange (Arka Flanş) */}
                            {(hasRearFlange) && (() => {
                                const boltCount = result?.flangeBoltCount ?? 6;
                                const rawBoltSize = result?.flangeBoltSize ?? 'M16';
                                const cleanBoltSize = rawBoltSize.replace(/^\d+x\s*/i, '');
                                const torque = result?.boltedJoints.flangeBolts?.tighteningTorqueNm ?? (result?.flangeBoltTorqueNm ?? 280);
                                const cxBolt = pxRearCapEnd - toDeltaPx(flangeThickness / 2);
                                const cyTop = toPxY(-flangeOuterDia / 2 + 14);
                                const cyBot = toPxY(flangeOuterDia / 2 - 14);
                                const rBolt = toDeltaPx(5);

                                return (
                                    <g>
                                        <rect
                                            x={pxRearCapEnd - toDeltaPx(flangeThickness)}
                                            y={toPxY(-flangeOuterDia / 2)}
                                            width={toDeltaPx(flangeThickness)}
                                            height={toDeltaPx(flangeOuterDia)}
                                            fill="#162231"
                                            stroke="#7aa2ff"
                                            strokeWidth="1.4"
                                        />
                                        <rect
                                            x={pxRearCapEnd - toDeltaPx(flangeThickness)}
                                            y={toPxY(-flangeOuterDia / 2)}
                                            width={toDeltaPx(flangeThickness)}
                                            height={toDeltaPx(flangeOuterDia)}
                                            fill="url(#hatchRearCap)"
                                            pointerEvents="none"
                                        />
                                        {/* DIN 912 Flange Bolt Counterbore & Hex Socket */}
                                        <circle cx={cxBolt} cy={cyTop} r={rBolt} fill="#06090e" stroke="#3ad0e6" strokeWidth="1.2" />
                                        <polygon points={`${cxBolt - 2.5},${cyTop - 1.5} ${cxBolt},${cyTop - 3} ${cxBolt + 2.5},${cyTop - 1.5} ${cxBolt + 2.5},${cyTop + 1.5} ${cxBolt},${cyTop + 3} ${cxBolt - 2.5},${cyTop + 1.5}`} fill="#7aa2ff" />
                                        <circle cx={cxBolt} cy={cyBot} r={rBolt} fill="#06090e" stroke="#3ad0e6" strokeWidth="1.2" />
                                        <polygon points={`${cxBolt - 2.5},${cyBot - 1.5} ${cxBolt},${cyBot - 3} ${cxBolt + 2.5},${cyBot - 1.5} ${cxBolt + 2.5},${cyBot + 1.5} ${cxBolt},${cyBot + 3} ${cxBolt - 2.5},${cyBot + 1.5}`} fill="#7aa2ff" />
                                        <line x1={pxRearCapEnd - toDeltaPx(flangeThickness + 4)} y1={cyTop} x2={pxRearCapEnd + toDeltaPx(4)} y2={cyTop} stroke="#3ad0e6" strokeWidth="0.8" strokeDasharray="3,2" />
                                        <line x1={pxRearCapEnd - toDeltaPx(flangeThickness + 4)} y1={cyBot} x2={pxRearCapEnd + toDeltaPx(4)} y2={cyBot} stroke="#3ad0e6" strokeWidth="0.8" strokeDasharray="3,2" />

                                        {/* Flange Torque Callout */}
                                        {showJointDetails && (
                                            <g transform={`translate(${cxBolt}, ${toPxY(-flangeOuterDia / 2) - 10})`}>
                                                <rect x={-toDeltaPx(42)} y={-toDeltaPx(13)} width={toDeltaPx(84)} height={toDeltaPx(13)} fill="#0c1016" stroke="#7aa2ff" strokeWidth="0.8" rx="2" />
                                                <text x={0} y={-toDeltaPx(3.5)} textAnchor="middle" fontSize="7" fill="#7aa2ff" fontWeight="bold">
                                                    {boltCount}x {cleanBoltSize} (M_A={torque}Nm)
                                                </text>
                                            </g>
                                        )}
                                    </g>
                                );
                            })()}
                        </g>

                        {/* ─────────────────────────────────────────────────────────────
                            3. INTERMEDIATE TRUNNION (ISO MT4 / MT1)
                            Solid forged collar encircling tube OD with precision ground pins
                            CRITICAL: Does NOT block internal fluid cutaway!
                            ───────────────────────────────────────────────────────────── */}
                        {hasTrunnion && (
                            <g className="cursor-pointer">
                                {/* Top Collar Section (Above Tube OD) */}
                                <rect
                                    x={pxTrunnionCenter - toDeltaPx(18)}
                                    y={yTopOD - toDeltaPx(trunnionCollarThickness)}
                                    width={toDeltaPx(36)}
                                    height={toDeltaPx(trunnionCollarThickness)}
                                    fill="#1e2c3d"
                                    stroke="#3ad0e6"
                                    strokeWidth="1.3"
                                    rx="2"
                                />
                                {/* Top Collar Bilateral Welds */}
                                <polygon points={`${pxTrunnionCenter - toDeltaPx(18)},${yTopOD} ${pxTrunnionCenter - toDeltaPx(22)},${yTopOD} ${pxTrunnionCenter - toDeltaPx(18)},${yTopOD - toDeltaPx(4)}`} fill="#e6b84a" stroke="#ffe17d" strokeWidth="0.6" />
                                <polygon points={`${pxTrunnionCenter + toDeltaPx(18)},${yTopOD} ${pxTrunnionCenter + toDeltaPx(22)},${yTopOD} ${pxTrunnionCenter + toDeltaPx(18)},${yTopOD - toDeltaPx(4)}`} fill="#e6b84a" stroke="#ffe17d" strokeWidth="0.6" />
                                {/* Top Pivot Pin (Ø trunnionPinDia x trunnionPinLen) */}
                                <rect
                                    x={pxTrunnionCenter - toDeltaPx(trunnionPinDia / 2)}
                                    y={yTopOD - toDeltaPx(trunnionCollarThickness + trunnionPinLen)}
                                    width={toDeltaPx(trunnionPinDia)}
                                    height={toDeltaPx(trunnionPinLen)}
                                    fill="#2f435a"
                                    stroke="#7aa2ff"
                                    strokeWidth="1.4"
                                />
                                {/* DIN 332 Center Drill Hole (Punta Deliği) on Top Pin */}
                                <polygon
                                    points={`${pxTrunnionCenter - toDeltaPx(3)},${yTopOD - toDeltaPx(trunnionCollarThickness + trunnionPinLen)} 
                                            ${pxTrunnionCenter + toDeltaPx(3)},${yTopOD - toDeltaPx(trunnionCollarThickness + trunnionPinLen)} 
                                            ${pxTrunnionCenter},${yTopOD - toDeltaPx(trunnionCollarThickness + trunnionPinLen - 4)}`}
                                    fill="#070a0f"
                                    stroke="#3ad0e6"
                                    strokeWidth="0.8"
                                />

                                {/* Bottom Collar Section (Below Tube OD) */}
                                <rect
                                    x={pxTrunnionCenter - toDeltaPx(18)}
                                    y={yBotOD}
                                    width={toDeltaPx(36)}
                                    height={toDeltaPx(trunnionCollarThickness)}
                                    fill="#1e2c3d"
                                    stroke="#3ad0e6"
                                    strokeWidth="1.3"
                                    rx="2"
                                />
                                {/* Bottom Collar Bilateral Welds */}
                                <polygon points={`${pxTrunnionCenter - toDeltaPx(18)},${yBotOD} ${pxTrunnionCenter - toDeltaPx(22)},${yBotOD} ${pxTrunnionCenter - toDeltaPx(18)},${yBotOD + toDeltaPx(4)}`} fill="#e6b84a" stroke="#ffe17d" strokeWidth="0.6" />
                                <polygon points={`${pxTrunnionCenter + toDeltaPx(18)},${yBotOD} ${pxTrunnionCenter + toDeltaPx(22)},${yBotOD} ${pxTrunnionCenter + toDeltaPx(18)},${yBotOD + toDeltaPx(4)}`} fill="#e6b84a" stroke="#ffe17d" strokeWidth="0.6" />
                                {/* Bottom Pivot Pin */}
                                <rect
                                    x={pxTrunnionCenter - toDeltaPx(trunnionPinDia / 2)}
                                    y={yBotOD + toDeltaPx(trunnionCollarThickness)}
                                    width={toDeltaPx(trunnionPinDia)}
                                    height={toDeltaPx(trunnionPinLen)}
                                    fill="#2f435a"
                                    stroke="#7aa2ff"
                                    strokeWidth="1.4"
                                />
                                {/* DIN 332 Center Drill Hole on Bottom Pin */}
                                <polygon
                                    points={`${pxTrunnionCenter - toDeltaPx(3)},${yBotOD + toDeltaPx(trunnionCollarThickness + trunnionPinLen)} 
                                            ${pxTrunnionCenter + toDeltaPx(3)},${yBotOD + toDeltaPx(trunnionCollarThickness + trunnionPinLen)} 
                                            ${pxTrunnionCenter},${yBotOD + toDeltaPx(trunnionCollarThickness + trunnionPinLen - 4)}`}
                                    fill="#070a0f"
                                    stroke="#3ad0e6"
                                    strokeWidth="0.8"
                                />

                                {/* Trunnion Axis Centerlines */}
                                <line 
                                    x1={pxTrunnionCenter} 
                                    y1={yTopOD - toDeltaPx(trunnionCollarThickness + trunnionPinLen + 8)} 
                                    x2={pxTrunnionCenter} 
                                    y2={yBotOD + toDeltaPx(trunnionCollarThickness + trunnionPinLen + 8)} 
                                    stroke="#3ad0e6" 
                                    strokeWidth="0.8" 
                                    strokeDasharray="6,3,1.5,3" 
                                />

                                {showLabels && (
                                    <text 
                                        x={pxTrunnionCenter} 
                                        y={yTopOD - toDeltaPx(trunnionCollarThickness + trunnionPinLen + 12)} 
                                        textAnchor="middle" 
                                        fontSize="8.5" 
                                        fill="#3ad0e6" 
                                        fontWeight="bold"
                                    >
                                        TRUNNION {activeMount === 'head_trunnion_mt1' ? 'MT1' : 'MT4'} (Ø{trunnionPinDia}x{trunnionPinLen})
                                    </text>
                                )}
                                {showJointDetails && (
                                    <g>
                                        {/* Leader line from trunnion bottom weld */}
                                        <line 
                                            x1={pxTrunnionCenter + toDeltaPx(20)} 
                                            y1={yBotOD + toDeltaPx(2)} 
                                            x2={pxTrunnionCenter + toDeltaPx(36)} 
                                            y2={yBotOD + toDeltaPx(14)} 
                                            stroke="#ffe17d" 
                                            strokeWidth="0.8" 
                                        />
                                        <line 
                                            x1={pxTrunnionCenter + toDeltaPx(36)} 
                                            y1={yBotOD + toDeltaPx(14)} 
                                            x2={pxTrunnionCenter + toDeltaPx(72)} 
                                            y2={yBotOD + toDeltaPx(14)} 
                                            stroke="#ffe17d" 
                                            strokeWidth="0.8" 
                                        />
                                        <text 
                                            x={pxTrunnionCenter + toDeltaPx(38)} 
                                            y={yBotOD + toDeltaPx(11)} 
                                            textAnchor="start" 
                                            fontSize="7" 
                                            fill="#ffe17d" 
                                            fontWeight="bold"
                                        >
                                            2x WELD a={result?.weldedJoints.trunnionWelds?.throatAwMm ?? 6}mm (DIN EN ISO 5817)
                                        </text>
                                    </g>
                                )}
                            </g>
                        )}

                        {/* ─────────────────────────────────────────────────────────────
                            4. SIDE LUGS / FOOT MOUNT (ISO MS2)
                            ───────────────────────────────────────────────────────────── */}
                        {(activeMount === 'side_lugs_ms2' || activeMount === 'foot_mount') && (() => {
                            const defaultOffset = Math.round((boreD + 40) / 2 + 15);
                            const nominalOffset = footMountOffsetMm || result?.footOffsetMm || defaultOffset;
                            const footDropMm = Math.max(16, nominalOffset - (tubeOD / 2));
                            const footPadH = toDeltaPx(14);
                            const footTotalH = toDeltaPx(footDropMm + 14);
                            const footWebH = footTotalH - footPadH;

                            return (
                                <g>
                                    {/* Rear Foot Lug */}
                                    <path
                                        d={`M ${pxRearCapEnd + toDeltaPx(10)} ${yBotOD} 
                                           L ${pxRearCapEnd + toDeltaPx(10)} ${yBotOD + footWebH} 
                                           L ${pxRearCapEnd - toDeltaPx(20)} ${yBotOD + footWebH} 
                                           L ${pxRearCapEnd - toDeltaPx(20)} ${yBotOD + footTotalH} 
                                           L ${pxRearCapEnd + toDeltaPx(38)} ${yBotOD + footTotalH} 
                                           L ${pxRearCapEnd + toDeltaPx(38)} ${yBotOD} Z`}
                                        fill="#182332"
                                        stroke="#7aa2ff"
                                        strokeWidth="1.3"
                                    />
                                    <circle cx={pxRearCapEnd - toDeltaPx(5)} cy={yBotOD + footTotalH - footPadH / 2} r={toDeltaPx(4.5)} fill="#06090e" stroke="#3ad0e6" strokeWidth="1" />

                                    {/* Front Foot Lug */}
                                    <path
                                        d={`M ${pxGlandStart - toDeltaPx(20)} ${yBotOD} 
                                           L ${pxGlandStart - toDeltaPx(20)} ${yBotOD + footWebH} 
                                           L ${pxGlandStart - toDeltaPx(35)} ${yBotOD + footWebH} 
                                           L ${pxGlandStart - toDeltaPx(35)} ${yBotOD + footTotalH} 
                                           L ${pxGlandStart + toDeltaPx(22)} ${yBotOD + footTotalH} 
                                           L ${pxGlandStart + toDeltaPx(22)} ${yBotOD} Z`}
                                        fill="#182332"
                                        stroke="#7aa2ff"
                                        strokeWidth="1.3"
                                    />
                                    <circle cx={pxGlandStart - toDeltaPx(6)} cy={yBotOD + footTotalH - footPadH / 2} r={toDeltaPx(4.5)} fill="#06090e" stroke="#3ad0e6" strokeWidth="1" />
                                </g>
                            );
                        })()}

                        {/* ─────────────────────────────────────────────────────────────
                            5. OIL PORTS: REAR CAP (PORT A) & FRONT GLAND (PORT B)
                            Standard Hydraulic Engineering (ISO 6020-2 / DIN 24554):
                            Port A is machined/welded on the Rear Cap block feeding Chamber A behind piston.
                            Port B is machined/welded on the Front Gland block feeding Chamber B in front of piston.
                            Guarantees 100% zero overlap with piston hub & seals at stroke limits (0% to 100%).
                            Eliminates hydraulic lock, flow starvation, and seal clipping.
                            ───────────────────────────────────────────────────────────── */}
                        {/* Port A (Rear Inlet Port - Deep Machined into Rear Cap Block) */}
                        {(() => {
                            const pxPortA = pxRearCapEnd + toDeltaPx(rearCapLen * 0.55);
                            const holeDia = toDeltaPx(Math.max(10, (result?.portInnerDiaMm ?? 14)));
                            const spotfaceDia = holeDia + toDeltaPx(8);
                            const spotfaceDepth = toDeltaPx(3.5);
                            const bossW = toDeltaPx(24);
                            const bossH = toDeltaPx(11); // Low-profile industrial welded boss
                            const yTopSurface = hasTieRods ? yTopSquare : yTopOD;
                            const wallDepth = yTopBore - yTopSurface;
                            const extraDrillDepthA = toDeltaPx(15); // Deep penetration into rear cap solid block
                            const drillDepthA = wallDepth + extraDrillDepthA;
                            const threadDepthA = toDeltaPx(18); // Deep ISO 6410 thread engagement
                            const coneH = toDeltaPx(3.5); // 118° drill point tip
                            const galleryH = toDeltaPx(Math.max(10, (result?.portInnerDiaMm ?? 14)));

                            return (
                                <g transform={`translate(${pxPortA}, ${yTopSurface})`}>
                                    {hasTieRods ? (
                                        <>
                                            {/* Counterbore Spotface for ISO 6149 / BSPP Bonded Seal */}
                                            <rect x={-spotfaceDia / 2} y={0} width={spotfaceDia} height={spotfaceDepth} fill="#06090e" stroke="#3ad0e6" strokeWidth="0.9" />
                                            {/* Deep Vertical Drilled Hole */}
                                            <rect x={-holeDia / 2} y={spotfaceDepth} width={holeDia} height={drillDepthA - spotfaceDepth} fill="#06090e" stroke="#3ad0e6" strokeWidth="0.9" />
                                        </>
                                    ) : (
                                        <>
                                            {/* Welded Boss Block on Rear Cap */}
                                            <rect x={-bossW / 2} y={-bossH} width={bossW} height={bossH} fill="#1a2736" stroke="#3ad0e6" strokeWidth="1.2" rx="1.5" />
                                            {/* Welded Boss Fillet Beads (a=4mm) */}
                                            <polygon points={`${-bossW / 2},0 ${-bossW / 2 - toDeltaPx(3.5)},0 ${-bossW / 2},${-toDeltaPx(3.5)}`} fill="#e6b84a" stroke="#ffe17d" strokeWidth="0.6" />
                                            <polygon points={`${bossW / 2},0 ${bossW / 2 + toDeltaPx(3.5)},0 ${bossW / 2},${-toDeltaPx(3.5)}`} fill="#e6b84a" stroke="#ffe17d" strokeWidth="0.6" />
                                            {/* Deep Vertical Port Hole through Rear Cap Block */}
                                            <rect x={-holeDia / 2} y={-bossH} width={holeDia} height={bossH + drillDepthA} fill="#06090e" stroke="#3ad0e6" strokeWidth="0.8" />
                                        </>
                                    )}

                                    {/* 118° Drill Point Cone Tip at Bottom of Hole */}
                                    <polygon points={`${-holeDia / 2},${drillDepthA} 0,${drillDepthA + coneH} ${holeDia / 2},${drillDepthA}`} fill="#06090e" stroke="#3ad0e6" strokeWidth="0.8" />

                                    {/* Deep Horizontal Internal Fluid Gallery into Chamber A (enters at pxTubeStart) */}
                                    <rect x={-holeDia / 2} y={wallDepth} width={pxTubeStart - pxPortA + holeDia / 2} height={galleryH} fill="#06090e" stroke="#3ad0e6" strokeWidth="0.9" />

                                    {/* Deep Female Port Thread Lines (ISO 6410) */}
                                    <line x1={-holeDia / 2 - 1.5} y1={hasTieRods ? spotfaceDepth : -bossH + 2} x2={-holeDia / 2 - 1.5} y2={threadDepthA} stroke="#7aa2ff" strokeWidth="0.8" strokeDasharray="2,1" />
                                    <line x1={holeDia / 2 + 1.5} y1={hasTieRods ? spotfaceDepth : -bossH + 2} x2={holeDia / 2 + 1.5} y2={threadDepthA} stroke="#7aa2ff" strokeWidth="0.8" strokeDasharray="2,1" />

                                    {/* Dynamic Fluid Flow Inflow Arrow */}
                                    <path d={`M 0 ${hasTieRods ? -12 : -bossH - 8} L 0 ${hasTieRods ? 6 : 5} M -3 ${hasTieRods ? 1 : 0} L 0 ${hasTieRods ? 6 : 5} L 3 ${hasTieRods ? 1 : 0}`} stroke="#3ad0e6" strokeWidth="1.5" fill="none" />
                                    {/* Gallery flow turn arrow into Chamber A */}
                                    <path d={`M 0 ${wallDepth + galleryH / 2} L ${pxTubeStart - pxPortA - 4} ${wallDepth + galleryH / 2} M ${pxTubeStart - pxPortA - 8} ${wallDepth + galleryH / 2 - 3} L ${pxTubeStart - pxPortA - 4} ${wallDepth + galleryH / 2} L ${pxTubeStart - pxPortA - 8} ${wallDepth + galleryH / 2 + 3}`} stroke="#3ad0e6" strokeWidth="1.2" fill="none" opacity="0.85" />

                                    {/* Chamber A fluid streamline spread */}
                                    <path d={`M ${pxTubeStart - pxPortA} ${wallDepth + galleryH / 2} C ${pxTubeStart - pxPortA + toDeltaPx(8)} ${wallDepth + galleryH / 2 + toDeltaPx(4)}, ${pxTubeStart - pxPortA + toDeltaPx(14)} ${wallDepth + galleryH / 2 + toDeltaPx(10)}, ${pxTubeStart - pxPortA + toDeltaPx(20)} ${wallDepth + galleryH / 2 + toDeltaPx(12)}`} stroke="#3ad0e6" strokeWidth="1.1" fill="none" opacity="0.8" strokeDasharray="3,1.5" />

                                    {showLabels && (
                                        <text x={0} y={hasTieRods ? -12 : -bossH - 8} textAnchor="middle" fontSize="8" fill="#3ad0e6" fontWeight="bold">
                                            PORT A ({result?.recommendedPortSize ?? 'G 1/2"'})
                                        </text>
                                    )}
                                    {showJointDetails && (
                                        <text x={hasTieRods ? spotfaceDia / 2 + 6 : bossW / 2 + 5} y={hasTieRods ? 6 : -bossH + 7} fontSize="6.5" fill={hasTieRods ? "#7aa2ff" : "#ffe17d"} fontWeight="bold">
                                            {hasTieRods ? 'ISO 6149' : 'a=4'}
                                        </text>
                                    )}
                                </g>
                            );
                        })()}

                        {/* Port B (Front Return Port - ISO 6020-2 / DIN 24554) */}
                        {(() => {
                            const holeDia = toDeltaPx(Math.max(10, (result?.portInnerDiaMm ?? 14)));
                            const spotfaceDia = holeDia + toDeltaPx(8);
                            const spotfaceDepth = toDeltaPx(3.5);
                            const bossW = toDeltaPx(24);
                            const bossH = toDeltaPx(11); // Low-profile industrial welded boss
                            const yTopSurface = hasTieRods ? yTopSquare : yTopOD;
                            const wallDepth = yTopBore - yTopSurface;
                            const extraDrillDepthB = hasTieRods ? toDeltaPx(15) : 0;
                            const drillDepthB = wallDepth + extraDrillDepthB;
                            const threadDepthB = toDeltaPx(18); // Deep ISO 6410 thread engagement
                            const coneH = toDeltaPx(3.5); // 118° drill point tip
                            const galleryH = toDeltaPx(Math.max(10, (result?.portInnerDiaMm ?? 14)));

                            return (
                                <g transform={`translate(${pxPortB}, ${yTopSurface})`}>
                                    {hasTieRods ? (
                                        <>
                                            {/* Counterbore Spotface for ISO 6149 / BSPP Bonded Seal */}
                                            <rect x={-spotfaceDia / 2} y={0} width={spotfaceDia} height={spotfaceDepth} fill="#06090e" stroke="#3ad0e6" strokeWidth="0.9" />
                                            {/* Deep Vertical Drilled Hole in Square Head */}
                                            <rect x={-holeDia / 2} y={spotfaceDepth} width={holeDia} height={drillDepthB - spotfaceDepth} fill="#06090e" stroke="#3ad0e6" strokeWidth="0.9" />
                                            {/* 118° Drill Point Cone Tip at Bottom of Hole */}
                                            <polygon points={`${-holeDia / 2},${drillDepthB} 0,${drillDepthB + coneH} ${holeDia / 2},${drillDepthB}`} fill="#06090e" stroke="#3ad0e6" strokeWidth="0.8" />
                                            {/* Horizontal Internal Fluid Gallery into Chamber B */}
                                            <rect x={-(pxPortB - pxGlandStart)} y={wallDepth} width={pxPortB - pxGlandStart + holeDia / 2} height={galleryH} fill="#06090e" stroke="#3ad0e6" strokeWidth="0.9" />
                                            {/* Gallery flow turn arrow */}
                                            <path d={`M ${-(pxPortB - pxGlandStart) + 4} ${wallDepth + galleryH / 2} L 0 ${wallDepth + galleryH / 2} M -4 ${wallDepth + galleryH / 2 - 3} L 0 ${wallDepth + galleryH / 2} L -4 ${wallDepth + galleryH / 2 + 3}`} stroke="#e6b84a" strokeWidth="1.2" fill="none" opacity="0.85" />
                                        </>
                                    ) : (
                                        <>
                                            {/* Welded Boss Block on Tube Wall */}
                                            <rect x={-bossW / 2} y={-bossH} width={bossW} height={bossH} fill="#1a2736" stroke="#3ad0e6" strokeWidth="1.2" rx="1.5" />
                                            {/* Welded Boss Fillet Beads (a=4mm) */}
                                            <polygon points={`${-bossW / 2},0 ${-bossW / 2 - toDeltaPx(3.5)},0 ${-bossW / 2},${-toDeltaPx(3.5)}`} fill="#e6b84a" stroke="#ffe17d" strokeWidth="0.6" />
                                            <polygon points={`${bossW / 2},0 ${bossW / 2 + toDeltaPx(3.5)},0 ${bossW / 2},${-toDeltaPx(3.5)}`} fill="#e6b84a" stroke="#ffe17d" strokeWidth="0.6" />
                                            {/* Vertical Port Hole drilling directly through Tube Wall into Chamber B */}
                                            <rect x={-holeDia / 2} y={-bossH} width={holeDia} height={bossH + drillDepthB} fill="#06090e" stroke="#3ad0e6" strokeWidth="0.8" />
                                            {/* Chamber B fluid flow turn arrow */}
                                            <path d={`M 0 ${wallDepth + toDeltaPx(2)} L 0 ${wallDepth + toDeltaPx(10)} M -3 ${wallDepth + toDeltaPx(6)} L 0 ${wallDepth + toDeltaPx(10)} L 3 ${wallDepth + toDeltaPx(6)}`} stroke="#e6b84a" strokeWidth="1.2" fill="none" opacity="0.85" />
                                        </>
                                    )}

                                    {/* Deep Female Port Thread Lines (ISO 6410) */}
                                    <line x1={-holeDia / 2 - 1.5} y1={hasTieRods ? spotfaceDepth : -bossH + 2} x2={-holeDia / 2 - 1.5} y2={threadDepthB} stroke="#7aa2ff" strokeWidth="0.8" strokeDasharray="2,1" />
                                    <line x1={holeDia / 2 + 1.5} y1={hasTieRods ? spotfaceDepth : -bossH + 2} x2={holeDia / 2 + 1.5} y2={threadDepthB} stroke="#7aa2ff" strokeWidth="0.8" strokeDasharray="2,1" />

                                    {/* Dynamic Fluid Flow Outflow Arrow */}
                                    <path d={`M 0 ${hasTieRods ? 6 : 5} L 0 ${hasTieRods ? -12 : -bossH - 8} M -3 ${hasTieRods ? -7 : -bossH - 3} L 0 ${hasTieRods ? -12 : -bossH - 8} L 3 ${hasTieRods ? -7 : -bossH - 3}`} stroke="#e6b84a" strokeWidth="1.5" fill="none" />

                                    {showLabels && (
                                        <text x={0} y={hasTieRods ? -12 : -bossH - 8} textAnchor="middle" fontSize="8" fill="#3ad0e6" fontWeight="bold">
                                            PORT B ({result?.recommendedPortSize ?? 'G 1/2"'})
                                        </text>
                                    )}
                                    {showJointDetails && (
                                        <text x={hasTieRods ? -spotfaceDia / 2 - 6 : bossW / 2 + 5} y={hasTieRods ? 6 : -bossH + 7} textAnchor={hasTieRods ? "end" : "start"} fontSize="6.5" fill={hasTieRods ? "#7aa2ff" : "#ffe17d"} fontWeight="bold">
                                            {hasTieRods ? 'ISO 6149' : 'a=4'}
                                        </text>
                                    )}
                                </g>
                            );
                        })()}

                        {/* ─────────────────────────────────────────────────────────────
                            6. CHROME PISTON ROD (MOVING WITH STROKE)
                            Induction Hardened, Precision Ground Hard Chrome Layer
                            ───────────────────────────────────────────────────────────── */}
                        <g 
                            onClick={() => onSelectPart?.(2)}
                            className="cursor-pointer group"
                        >
                            {/* Main Chrome Cylinder Shaft */}
                            <rect
                                x={pxRodStart}
                                y={yTopRod}
                                width={Math.max(10, pxRodEnd - pxRodStart)}
                                height={yBotRod - yTopRod}
                                fill="url(#masterChromeRod)"
                                stroke={selectedPartNumber === 2 ? '#3ad0e6' : '#72889c'}
                                strokeWidth={selectedPartNumber === 2 ? 2 : 1.2}
                            />

                            {/* Front Cushioning Spear Collar on Rod */}
                            {hasCushF && (
                                <g>
                                    <rect
                                        x={pxPistonRight}
                                        y={toPxY(-cushionSpearDia / 2)}
                                        width={toDeltaPx(cushionSpearLenB)}
                                        height={toDeltaPx(cushionSpearDia)}
                                        fill="#2f4255"
                                        stroke="#3ad0e6"
                                        strokeWidth="1"
                                    />
                                    {/* Tapered 15° lead-in chamfer on cushioning spear */}
                                    <polygon
                                        points={`${pxPistonRight + toDeltaPx(cushionSpearLenB)},${toPxY(-cushionSpearDia / 2)} 
                                                ${pxPistonRight + toDeltaPx(cushionSpearLenB + 6)},${yTopRod} 
                                                ${pxPistonRight + toDeltaPx(cushionSpearLenB + 6)},${yBotRod} 
                                                ${pxPistonRight + toDeltaPx(cushionSpearLenB)},${toPxY(cushionSpearDia / 2)}`}
                                        fill="#202e3d"
                                        stroke="#3ad0e6"
                                        strokeWidth="0.8"
                                    />
                                </g>
                            )}

                            {/* Wrench Flats (Anahtar Ağzı) on Rod Diameter near Rod End */}
                            <g transform={`translate(${pxRodEnd - toDeltaPx(28)}, ${centerY})`}>
                                <rect
                                    x={0}
                                    y={toPxY(-rodD * 0.42) - centerY}
                                    width={toDeltaPx(14)}
                                    height={toDeltaPx(rodD * 0.84)}
                                    fill="#1c2836"
                                    stroke="#3ad0e6"
                                    strokeWidth="0.9"
                                    strokeDasharray="2,2"
                                />
                                <text x={toDeltaPx(7)} y={toDeltaPx(2.5)} textAnchor="middle" fontSize="6.5" fill="#8b96a4">SW</text>
                            </g>

                            {/* DIN 76-A Thread Undercut / Relief Groove between Rod Shoulder and Thread */}
                            <rect
                                x={pxRodEnd}
                                y={toPxY(-rodD * 0.4)}
                                width={toDeltaPx(4)}
                                height={toDeltaPx(rodD * 0.8)}
                                fill="#090d14"
                                stroke="#7aa2ff"
                                strokeWidth="0.8"
                            />

                            {/* ── ROD END ATTACHMENTS (MIL UCU BAĞLANTILARI) ── */}

                            {/* A. ISO 6982 / AP4 Spherical Rod Eye with Clamping Split */}
                            {(activeRodEnd === 'spherical_rod_eye_ap4' || activeRodEnd === 'spherical_eye') && (() => {
                                const pxEyeCenter = pxRodEnd + toDeltaPx(eyeRadius * 1.05 + 16);
                                const rEyeOuterPx = toDeltaPx(eyeRadius);
                                const rBearingOuterPx = toDeltaPx(clevisPinDia * 0.78);
                                const rPinHolePx = toDeltaPx(clevisPinDia / 2);

                                return (
                                    <g>
                                        {/* Lock Nut (DIN 439) on Rod */}
                                        <rect
                                            x={pxRodEnd + toDeltaPx(4)}
                                            y={toPxY(-rodD * 0.65)}
                                            width={toDeltaPx(Math.max(12, rodD * 0.35))}
                                            height={toDeltaPx(rodD * 1.3)}
                                            fill="#223142"
                                            stroke="#7aa2ff"
                                            strokeWidth="1.2"
                                            rx="1"
                                        />

                                        {/* Forged AP4 Eye Body with Tangential Shank */}
                                        <path
                                            d={`M ${pxRodEnd + toDeltaPx(18)} ${yTopRod - toDeltaPx(2)} 
                                               C ${pxEyeCenter - toDeltaPx(12)} ${yTopRod - toDeltaPx(6)}, 
                                                 ${pxEyeCenter} ${centerY - rEyeOuterPx}, 
                                                 ${pxEyeCenter} ${centerY - rEyeOuterPx}
                                               A ${rEyeOuterPx} ${rEyeOuterPx} 0 0 1 ${pxEyeCenter} ${centerY + rEyeOuterPx}
                                               C ${pxEyeCenter} ${centerY + rEyeOuterPx}, 
                                                 ${pxEyeCenter - toDeltaPx(12)} ${yBotRod + toDeltaPx(6)}, 
                                                 ${pxRodEnd + toDeltaPx(18)} ${yBotRod + toDeltaPx(2)}
                                               Z`}
                                            fill="#1e2c3d"
                                            stroke="#3ad0e6"
                                            strokeWidth="1.4"
                                        />
                                        <path
                                            d={`M ${pxRodEnd + toDeltaPx(18)} ${yTopRod - toDeltaPx(2)} 
                                               C ${pxEyeCenter - toDeltaPx(12)} ${yTopRod - toDeltaPx(6)}, 
                                                 ${pxEyeCenter} ${centerY - rEyeOuterPx}, 
                                                 ${pxEyeCenter} ${centerY - rEyeOuterPx}
                                               A ${rEyeOuterPx} ${rEyeOuterPx} 0 0 1 ${pxEyeCenter} ${centerY + rEyeOuterPx}
                                               C ${pxEyeCenter} ${centerY + rEyeOuterPx}, 
                                                 ${pxEyeCenter - toDeltaPx(12)} ${yBotRod + toDeltaPx(6)}, 
                                                 ${pxRodEnd + toDeltaPx(18)} ${yBotRod + toDeltaPx(2)}
                                               Z`}
                                            fill="url(#hatchGland)"
                                            pointerEvents="none"
                                        />

                                        {/* Bearing Outer Race (DIN 24338) */}
                                        <circle cx={pxEyeCenter} cy={centerY} r={rBearingOuterPx} fill="#1a2736" stroke="#e6b84a" strokeWidth="1.2" />

                                        {/* Spherical Plain Bearing Ball */}
                                        <circle cx={pxEyeCenter} cy={centerY} r={rPinHolePx + toDeltaPx(3)} fill="#283a4f" stroke="#3dd68c" strokeWidth="1.3" />

                                        {/* Precision Pin Bore */}
                                        <circle cx={pxEyeCenter} cy={centerY} r={rPinHolePx} fill="#06090e" stroke="#3ad0e6" strokeWidth="1.4" />

                                        {/* Center Crosshairs */}
                                        <line x1={pxEyeCenter - toDeltaPx(8)} y1={centerY} x2={pxEyeCenter + toDeltaPx(8)} y2={centerY} stroke="#3ad0e6" strokeWidth="0.8" strokeDasharray="2,2" />
                                        <line x1={pxEyeCenter} y1={centerY - toDeltaPx(8)} x2={pxEyeCenter} y2={centerY + toDeltaPx(8)} stroke="#3ad0e6" strokeWidth="0.8" strokeDasharray="2,2" />

                                        {/* DIN 71412 Grease Nipple on Eye Head */}
                                        <g transform={`translate(${pxEyeCenter}, ${centerY - rEyeOuterPx})`}>
                                            <rect x={-toDeltaPx(3)} y={-toDeltaPx(6)} width={toDeltaPx(6)} height={toDeltaPx(6)} fill="#e6b84a" stroke="#ffe17d" strokeWidth="0.8" rx="1" />
                                        </g>

                                        {/* Rexroth CGKD Clamping Slit in Shank */}
                                        <line
                                            x1={pxRodEnd + toDeltaPx(18)}
                                            y1={centerY}
                                            x2={pxEyeCenter - toDeltaPx(eyeRadius * 0.42)}
                                            y2={centerY}
                                            stroke="#06090e"
                                            strokeWidth="2.5"
                                        />
                                        <line
                                            x1={pxRodEnd + toDeltaPx(18)}
                                            y1={centerY}
                                            x2={pxEyeCenter - toDeltaPx(eyeRadius * 0.42)}
                                            y2={centerY}
                                            stroke="#3ad0e6"
                                            strokeWidth="0.8"
                                            strokeDasharray="2,2"
                                        />

                                        {/* Rexroth CGKD Transverse Clamping Pinch Screw (DIN 912 Grade 10.9 per RE 17042) */}
                                        {(() => {
                                            const pxPinchBolt = pxRodEnd + toDeltaPx(25);
                                            const boltDiaPx = toDeltaPx(Math.max(5, Math.round(rodD * 0.16)));
                                            const headDiaPx = boltDiaPx * 1.5;
                                            const headHeightPx = boltDiaPx * 1.0;
                                            const clampTorque = result?.boltedJoints.clampableEyePinchBolts?.tighteningTorqueNm ?? (rodD >= 50 ? 250 : 59);
                                            const clampBolt = result?.boltedJoints.clampableEyePinchBolts?.screwSize ?? (rodD >= 50 ? 'M16' : 'M10');

                                            return (
                                                <g>
                                                    {/* Screw counterbore well top */}
                                                    <rect x={pxPinchBolt - headDiaPx / 2} y={yTopRod - toDeltaPx(1)} width={headDiaPx} height={headHeightPx} fill="#090d14" stroke="#7aa2ff" strokeWidth="0.9" />
                                                    {/* Hex socket in head */}
                                                    <polygon points={`${pxPinchBolt - headDiaPx * 0.28},${yTopRod + toDeltaPx(2)} ${pxPinchBolt + headDiaPx * 0.28},${yTopRod + toDeltaPx(2)} ${pxPinchBolt + headDiaPx * 0.14},${yTopRod + toDeltaPx(5)} ${pxPinchBolt - headDiaPx * 0.14},${yTopRod + toDeltaPx(5)}`} fill="#3ad0e6" />
                                                    {/* Screw shank crossing the slit */}
                                                    <rect x={pxPinchBolt - boltDiaPx / 2} y={yTopRod + headHeightPx - toDeltaPx(1)} width={boltDiaPx} height={toDeltaPx(rodD * 0.65)} fill="#1e2c3d" stroke="#7aa2ff" strokeWidth="0.8" />
                                                    {/* Threaded lower part */}
                                                    <line x1={pxPinchBolt - boltDiaPx / 2} y1={centerY + toDeltaPx(2)} x2={pxPinchBolt + boltDiaPx / 2} y2={centerY + toDeltaPx(2)} stroke="#7aa2ff" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
                                                    <line x1={pxPinchBolt - boltDiaPx / 2} y1={centerY + toDeltaPx(6)} x2={pxPinchBolt + boltDiaPx / 2} y2={centerY + toDeltaPx(6)} stroke="#7aa2ff" strokeWidth="0.8" strokeDasharray="1.5,1.5" />

                                                    {showJointDetails && (
                                                        <g transform={`translate(${pxPinchBolt}, ${yBotRod + toDeltaPx(12)})`}>
                                                            <line x1={0} y1={-toDeltaPx(8)} x2={0} y2={toDeltaPx(4)} stroke="#e6b84a" strokeWidth="0.8" />
                                                            <rect x={-toDeltaPx(46)} y={toDeltaPx(4)} width={toDeltaPx(92)} height={toDeltaPx(12)} fill="#0c1016" stroke="#e6b84a" strokeWidth="0.8" rx="2" />
                                                            <text x={0} y={toDeltaPx(12.5)} textAnchor="middle" fontSize="7" fill="#ffe17d" fontWeight="bold">
                                                                CGKD {clampBolt} 10.9 (M_A={clampTorque}Nm)
                                                            </text>
                                                        </g>
                                                    )}
                                                </g>
                                            );
                                        })()}

                                        {showLabels && (
                                            <text x={pxEyeCenter} y={centerY - rEyeOuterPx - 10} textAnchor="middle" fontSize="8" fill="#e6b84a" fontWeight="bold">
                                                ISO AP4 ({result?.sphericalBearingDesignation ?? 'GE 35 ES'})
                                            </text>
                                        )}
                                    </g>
                                );
                            })()}

                            {/* B. ISO 8132 / AP2 Rod Clevis Fork */}
                            {(activeRodEnd === 'rod_clevis_ap2' || activeRodEnd === 'clevis_pin') && (() => {
                                const pxPinCenter = pxRodEnd + toDeltaPx(clevisPinDia * 0.95 + 24);
                                const rPinHolePx = toDeltaPx(clevisPinDia / 2);

                                return (
                                    <g>
                                        {/* DIN 439 / ISO 4035 Thin Hex Jam Nut (Kontra Somun) */}
                                        <rect
                                            x={pxRodEnd}
                                            y={toPxY(-rodD * 0.58)}
                                            width={toDeltaPx(8)}
                                            height={toDeltaPx(rodD * 1.16)}
                                            fill="#253547"
                                            stroke="#7aa2ff"
                                            strokeWidth="1.2"
                                            rx="1"
                                        />
                                        <line x1={pxRodEnd + toDeltaPx(2.5)} y1={toPxY(-rodD * 0.58)} x2={pxRodEnd + toDeltaPx(2.5)} y2={toPxY(rodD * 0.58)} stroke="#3ad0e6" strokeWidth="0.7" />
                                        <line x1={pxRodEnd + toDeltaPx(5.5)} y1={toPxY(-rodD * 0.58)} x2={pxRodEnd + toDeltaPx(5.5)} y2={toPxY(rodD * 0.58)} stroke="#3ad0e6" strokeWidth="0.7" />

                                        {/* Clevis Body */}
                                        <path
                                            d={`M ${pxRodEnd + toDeltaPx(8)} ${yTopRod} 
                                               L ${pxPinCenter + toDeltaPx(6)} ${yTopRod - toDeltaPx(8)} 
                                               A ${toDeltaPx(clevisPinDia * 0.9)} ${toDeltaPx(clevisPinDia * 0.9)} 0 0 1 ${pxPinCenter + toDeltaPx(6)} ${yBotRod + toDeltaPx(8)} 
                                               L ${pxRodEnd + toDeltaPx(8)} ${yBotRod} Z`}
                                            fill="#1e2c3d"
                                            stroke="#3ad0e6"
                                            strokeWidth="1.3"
                                        />
                                        <rect
                                            x={pxPinCenter - toDeltaPx(clevisPinDia * 0.85)}
                                            y={toPxY(-clevisPinDia * 0.45)}
                                            width={toDeltaPx(clevisPinDia * 1.7)}
                                            height={toDeltaPx(clevisPinDia * 0.9)}
                                            fill="#06090e"
                                            stroke="#3ad0e6"
                                            strokeWidth="0.9"
                                            strokeDasharray="3,2"
                                        />
                                        <circle cx={pxPinCenter} cy={centerY} r={rPinHolePx} fill="#1e2c3d" stroke="#7aa2ff" strokeWidth="1.4" />
                                        {showLabels && (
                                            <text x={pxPinCenter} y={yTopRod - toDeltaPx(14)} textAnchor="middle" fontSize="8" fill="#3ad0e6" fontWeight="bold">
                                                ISO 8132 AP2 (Ø{clevisPinDia})
                                            </text>
                                        )}
                                    </g>
                                );
                            })()}

                            {/* C. ISO Metric Male Thread with 45° Chamfered Tip */}
                            {(activeRodEnd === 'male_thread') && (() => {
                                const threadLenMm = Math.max(30, Math.round(rodD * 0.95));
                                const pxThreadEnd = pxRodEnd + toDeltaPx(threadLenMm);
                                const rThread = toDeltaPx(rodD * 0.45);
                                const rCore = toDeltaPx(rodD * 0.38);

                                return (
                                    <g>
                                        {/* Thread Cylinder Body */}
                                        <rect
                                            x={pxRodEnd}
                                            y={centerY - rThread}
                                            width={toDeltaPx(threadLenMm - 4)}
                                            height={rThread * 2}
                                            fill="#253547"
                                            stroke="#7aa2ff"
                                            strokeWidth="1.2"
                                        />
                                        {/* 45° Tip Chamfer */}
                                        <polygon
                                            points={`${pxThreadEnd - toDeltaPx(4)},${centerY - rThread} 
                                                    ${pxThreadEnd},${centerY - rThread + toDeltaPx(3)} 
                                                    ${pxThreadEnd},${centerY + rThread - toDeltaPx(3)} 
                                                    ${pxThreadEnd - toDeltaPx(4)},${centerY + rThread}`}
                                            fill="#1a2736"
                                            stroke="#7aa2ff"
                                            strokeWidth="1.2"
                                        />
                                        {/* ISO Standard Thread Convention: Thin continuous root lines */}
                                        <line x1={pxRodEnd + toDeltaPx(3)} y1={centerY - rCore} x2={pxThreadEnd - toDeltaPx(5)} y2={centerY - rCore} stroke="#7aa2ff" strokeWidth="0.8" />
                                        <line x1={pxRodEnd + toDeltaPx(3)} y1={centerY + rCore} x2={pxThreadEnd - toDeltaPx(5)} y2={centerY + rCore} stroke="#7aa2ff" strokeWidth="0.8" />
                                        {/* Thread Crest Pitch Dashes */}
                                        <line x1={pxRodEnd + toDeltaPx(10)} y1={centerY - rThread} x2={pxRodEnd + toDeltaPx(10)} y2={centerY + rThread} stroke="#7aa2ff" strokeWidth="0.7" strokeDasharray="2,2" />
                                        <line x1={pxRodEnd + toDeltaPx(20)} y1={centerY - rThread} x2={pxRodEnd + toDeltaPx(20)} y2={centerY + rThread} stroke="#7aa2ff" strokeWidth="0.7" strokeDasharray="2,2" />

                                        {showLabels && (
                                            <text x={pxRodEnd + toDeltaPx(threadLenMm / 2)} y={centerY - rThread - 6} textAnchor="middle" fontSize="8" fill="#7aa2ff" fontWeight="bold">
                                                {result?.rodEndThread ?? `M${Math.round(rodD * 0.85)}x2-6g`}
                                            </text>
                                        )}
                                    </g>
                                );
                            })()}

                            {/* D. Female Metric Thread (ISO 6410 Blind Tapped Hole with 118° Drill Point) */}
                            {(activeRodEnd === 'female_thread') && (() => {
                                const threadDepth = 30;
                                const drillDepth = threadDepth + 8;
                                const pxHoleBottom = pxRodEnd - toDeltaPx(drillDepth);
                                const pxThreadLimit = pxRodEnd - toDeltaPx(threadDepth);
                                const rThd = toDeltaPx(rodD * 0.28);
                                const rDrill = toDeltaPx(rodD * 0.24);
                                const coneH = toDeltaPx(4); // 118° drill point cone

                                return (
                                    <g>
                                        {/* Tap Drill Hole Cylinder */}
                                        <rect
                                            x={pxHoleBottom}
                                            y={centerY - rDrill}
                                            width={toDeltaPx(drillDepth)}
                                            height={rDrill * 2}
                                            fill="#070a0f"
                                            stroke="#3ad0e6"
                                            strokeWidth="0.9"
                                            strokeDasharray="3,2"
                                        />
                                        {/* 118° Drill Point Cone Tip */}
                                        <polygon
                                            points={`${pxHoleBottom},${centerY - rDrill} ${pxHoleBottom - coneH},${centerY} ${pxHoleBottom},${centerY + rDrill}`}
                                            fill="#070a0f"
                                            stroke="#3ad0e6"
                                            strokeWidth="0.9"
                                        />
                                        {/* Thread Crest Solid Lines (Inner Diameter) */}
                                        <line x1={pxThreadLimit} y1={centerY - rThd} x2={pxRodEnd} y2={centerY - rThd} stroke="#7aa2ff" strokeWidth="1.1" strokeDasharray="4,2" />
                                        <line x1={pxThreadLimit} y1={centerY + rThd} x2={pxRodEnd} y2={centerY + rThd} stroke="#7aa2ff" strokeWidth="1.1" strokeDasharray="4,2" />
                                        {/* Transverse Thread Runout Limit Line */}
                                        <line x1={pxThreadLimit} y1={centerY - rThd} x2={pxThreadLimit} y2={centerY + rThd} stroke="#7aa2ff" strokeWidth="1.1" strokeDasharray="3,2" />

                                        {showLabels && (
                                            <text x={pxRodEnd - toDeltaPx(drillDepth / 2)} y={yTopRod - 7} textAnchor="middle" fontSize="8" fill="#7aa2ff" fontWeight="bold">
                                                ISO 6410 M{Math.round(rodD * 0.6)} Internal
                                            </text>
                                        )}
                                    </g>
                                );
                            })()}

                            {/* E. Heavy Flanged Rod End (ISO 6022 Mill Duty) */}
                            {(activeRodEnd === 'flanged_rod_end') && (() => {
                                const flgD = Math.max(rodD * 1.5, rodD + 40);
                                const flgT = Math.max(20, Math.round(rodD * 0.32));
                                const pilotD = Math.round(rodD * 0.85);

                                return (
                                    <g>
                                        {/* Main Circular Flange Plate */}
                                        <rect
                                            x={pxRodEnd}
                                            y={toPxY(-flgD / 2)}
                                            width={toDeltaPx(flgT)}
                                            height={toDeltaPx(flgD)}
                                            fill="#1e2c3d"
                                            stroke="#7aa2ff"
                                            strokeWidth="1.4"
                                            rx="1.5"
                                        />
                                        <rect
                                            x={pxRodEnd}
                                            y={toPxY(-flgD / 2)}
                                            width={toDeltaPx(flgT)}
                                            height={toDeltaPx(flgD)}
                                            fill="url(#hatchGland)"
                                            pointerEvents="none"
                                        />

                                        {/* Welded Collar Fillet Beads joining rod to flange */}
                                        <polygon points={`${pxRodEnd},${yTopRod} ${pxRodEnd},${toPxY(-flgD / 2)} ${pxRodEnd - toDeltaPx(6)},${yTopRod}`} fill="#e6b84a" stroke="#ffe17d" strokeWidth="0.8" />
                                        <polygon points={`${pxRodEnd},${yBotRod} ${pxRodEnd},${toPxY(flgD / 2)} ${pxRodEnd - toDeltaPx(6)},${yBotRod}`} fill="#e6b84a" stroke="#ffe17d" strokeWidth="0.8" />

                                        {/* Register Pilot Boss on Front Face */}
                                        <rect
                                            x={pxRodEnd + toDeltaPx(flgT)}
                                            y={toPxY(-pilotD / 2)}
                                            width={toDeltaPx(6)}
                                            height={toDeltaPx(pilotD)}
                                            fill="#253547"
                                            stroke="#7aa2ff"
                                            strokeWidth="1.2"
                                        />

                                        {/* DIN 912 Bolt Counterbore Holes & Centerlines */}
                                        <circle cx={pxRodEnd + toDeltaPx(flgT / 2)} cy={toPxY(-flgD / 2 + 10)} r={toDeltaPx(4)} fill="#06090e" stroke="#3ad0e6" strokeWidth="1.1" />
                                        <circle cx={pxRodEnd + toDeltaPx(flgT / 2)} cy={toPxY(flgD / 2 - 10)} r={toDeltaPx(4)} fill="#06090e" stroke="#3ad0e6" strokeWidth="1.1" />
                                        <line x1={pxRodEnd - toDeltaPx(3)} y1={toPxY(-flgD / 2 + 10)} x2={pxRodEnd + toDeltaPx(flgT + 3)} y2={toPxY(-flgD / 2 + 10)} stroke="#3ad0e6" strokeWidth="0.8" strokeDasharray="2,2" />
                                        <line x1={pxRodEnd - toDeltaPx(3)} y1={toPxY(flgD / 2 - 10)} x2={pxRodEnd + toDeltaPx(flgT + 3)} y2={toPxY(flgD / 2 - 10)} stroke="#3ad0e6" strokeWidth="0.8" strokeDasharray="2,2" />

                                        {showLabels && (
                                            <text x={pxRodEnd + toDeltaPx(flgT / 2)} y={toPxY(-flgD / 2) - 8} textAnchor="middle" fontSize="8" fill="#7aa2ff" fontWeight="bold">
                                                FLANGED END (Ø{Math.round(flgD)})
                                            </text>
                                        )}
                                    </g>
                                );
                            })()}

                            {/* F. Plain Welded Eye (Düz Kaynaklı Kulak) */}
                            {(activeRodEnd === 'plain_welded_eye') && (() => {
                                const pxEyeCenter = pxRodEnd + toDeltaPx(eyeRadius * 1.05 + 12);
                                const rEyeOuterPx = toDeltaPx(eyeRadius);
                                const rPinHolePx = toDeltaPx(clevisPinDia / 2);

                                return (
                                    <g>
                                        <path
                                            d={`M ${pxRodEnd} ${yTopRod} 
                                               C ${pxEyeCenter - toDeltaPx(10)} ${yTopRod}, 
                                                 ${pxEyeCenter} ${centerY - rEyeOuterPx}, 
                                                 ${pxEyeCenter} ${centerY - rEyeOuterPx}
                                               A ${rEyeOuterPx} ${rEyeOuterPx} 0 0 1 ${pxEyeCenter} ${centerY + rEyeOuterPx}
                                               C ${pxEyeCenter} ${centerY + rEyeOuterPx}, 
                                                 ${pxEyeCenter - toDeltaPx(10)} ${yBotRod}, 
                                                 ${pxRodEnd} ${yBotRod}
                                               Z`}
                                            fill="#1e2c3d"
                                            stroke="#3ad0e6"
                                            strokeWidth="1.4"
                                        />
                                        <circle cx={pxEyeCenter} cy={centerY} r={rPinHolePx + toDeltaPx(3)} fill="#283a4f" stroke="#e6b84a" strokeWidth="1.2" />
                                        <circle cx={pxEyeCenter} cy={centerY} r={rPinHolePx} fill="#06090e" stroke="#3ad0e6" strokeWidth="1.3" />
                                        {/* Weld fillet bead joining shank to rod shoulder */}
                                        <polygon points={`${pxRodEnd},${yTopRod} ${pxRodEnd + toDeltaPx(5)},${yTopRod} ${pxRodEnd},${yTopRod - toDeltaPx(4)}`} fill="#e6b84a" stroke="#ffe17d" strokeWidth="0.8" />
                                        <polygon points={`${pxRodEnd},${yBotRod} ${pxRodEnd + toDeltaPx(5)},${yBotRod} ${pxRodEnd},${yBotRod + toDeltaPx(4)}`} fill="#e6b84a" stroke="#ffe17d" strokeWidth="0.8" />
                                        {showJointDetails && (
                                            <text x={pxRodEnd + toDeltaPx(6)} y={yTopRod - toDeltaPx(6)} fontSize="7.5" fill="#ffe17d" fontWeight="bold">
                                                WELD a={result?.weldedJoints.weldEyeShank?.throatAwMm ?? 6}mm (DIN EN ISO 5817-B)
                                            </text>
                                        )}
                                        {showLabels && (
                                            <text x={pxEyeCenter} y={centerY - rEyeOuterPx - 8} textAnchor="middle" fontSize="8" fill="#3ad0e6" fontWeight="bold">
                                                WELDED EYE (Ø{clevisPinDia})
                                            </text>
                                        )}
                                    </g>
                                );
                            })()}
                        </g>

                        {/* ─────────────────────────────────────────────────────────────
                            7. STOP TUBE SPACER (MESAFE BİLEZİĞİ) - Burkulma Önleyici
                            ───────────────────────────────────────────────────────────── */}
                        {hasStopTube && (() => {
                            const pxStopStart = pxGlandStart - toDeltaPx(stopTubeLenMm);
                            const stopW = toDeltaPx(stopTubeLenMm);

                            return (
                                <g className="cursor-pointer">
                                    {/* Top Spacer Half */}
                                    <rect x={pxStopStart} y={yTopBore + 1} width={stopW} height={yTopRod - yTopBore - 2} fill="#291e0a" stroke="#f59e0b" strokeWidth="1.3" />
                                    <rect x={pxStopStart} y={yTopBore + 1} width={stopW} height={yTopRod - yTopBore - 2} fill="url(#hatchStopTube)" pointerEvents="none" />

                                    {/* Bottom Spacer Half */}
                                    <rect x={pxStopStart} y={yBotRod + 1} width={stopW} height={yBotBore - yBotRod - 2} fill="#291e0a" stroke="#f59e0b" strokeWidth="1.3" />
                                    <rect x={pxStopStart} y={yBotRod + 1} width={stopW} height={yBotBore - yBotRod - 2} fill="url(#hatchStopTube)" pointerEvents="none" />

                                    {showLabels && (
                                        <text x={pxStopStart + stopW / 2} y={yTopBore - 8} textAnchor="middle" fontSize="8" fill="#f59e0b" fontWeight="bold">
                                            STOP TUBE ({stopTubeLenMm} mm)
                                        </text>
                                    )}
                                </g>
                            );
                        })()}

                        {/* ─────────────────────────────────────────────────────────────
                            8. PISTON ASSEMBLY & KASTAŞ K16/K17 SEALS (PİSTON VE KEÇELER)
                            ───────────────────────────────────────────────────────────── */}
                        <g 
                            onClick={() => onSelectPart?.(3)}
                            className="cursor-pointer group"
                        >
                            {/* Piston Body Solid Cross-Section */}
                            <rect
                                x={pxPistonLeft}
                                y={yTopBore + 0.8}
                                width={toDeltaPx(pistonLen)}
                                height={yBotBore - yTopBore - 1.6}
                                fill={selectedPartNumber === 3 ? '#1c2d42' : '#141e2b'}
                                stroke={selectedPartNumber === 3 ? '#3ad0e6' : '#5a7394'}
                                strokeWidth={selectedPartNumber === 3 ? 2 : 1.2}
                            />
                            <rect
                                x={pxPistonLeft}
                                y={yTopBore + 0.8}
                                width={toDeltaPx(pistonLen)}
                                height={yBotBore - yTopBore - 1.6}
                                fill="url(#hatchPiston)"
                                pointerEvents="none"
                            />

                            {/* Rear Cushion Spear Boss on Piston Back (Yastıklama Konisi) */}
                            {hasCushR && (
                                <g>
                                    <rect
                                        x={pxPistonLeft - toDeltaPx(cushionSpearLenA)}
                                        y={toPxY(-cushionSpearDia / 2)}
                                        width={toDeltaPx(cushionSpearLenA)}
                                        height={toDeltaPx(cushionSpearDia)}
                                        fill="#253547"
                                        stroke="#3ad0e6"
                                        strokeWidth="1"
                                    />
                                    <polygon
                                        points={`${pxPistonLeft - toDeltaPx(cushionSpearLenA)},${toPxY(-cushionSpearDia / 2)} 
                                                ${pxPistonLeft - toDeltaPx(cushionSpearLenA + 4)},${centerY} 
                                                ${pxPistonLeft - toDeltaPx(cushionSpearLenA)},${toPxY(cushionSpearDia / 2)}`}
                                        fill="#1a2736"
                                        stroke="#3ad0e6"
                                        strokeWidth="0.8"
                                    />
                                </g>
                            )}

                            {/* Internal Piston-to-Rod Static O-Ring (Part 9 / ISO 3601-1) in Neck Groove */}
                            <g onClick={(e) => { e.stopPropagation(); onSelectPart?.(9); }}>
                                {(() => {
                                    const pxORingNeck = pxPistonLeft + toDeltaPx(14);
                                    const oringNeckW = toDeltaPx(4.8);
                                    const oringNeckDepth = toDeltaPx(2.4);
                                    const rNeck = rodNeckDia / 2;
                                    return (
                                        <g>
                                            {/* Top Machined Groove in Rod Neck */}
                                            <rect x={pxORingNeck - oringNeckW / 2} y={toPxY(-rNeck)} width={oringNeckW} height={oringNeckDepth} fill="#070a0f" stroke="#556d8a" strokeWidth="0.6" />
                                            {/* Top Compressed NBR O-Ring */}
                                            <ellipse cx={pxORingNeck} cy={toPxY(-rNeck + 1.2)} rx={toDeltaPx(1.8)} ry={toDeltaPx(1.3)} fill={selectedPartNumber === 9 ? '#3ad0e6' : '#18181b'} stroke={selectedPartNumber === 9 ? '#fff' : '#e6b84a'} strokeWidth="0.8" />

                                            {/* Bottom Machined Groove in Rod Neck */}
                                            <rect x={pxORingNeck - oringNeckW / 2} y={toPxY(rNeck) - oringNeckDepth} width={oringNeckW} height={oringNeckDepth} fill="#070a0f" stroke="#556d8a" strokeWidth="0.6" />
                                            {/* Bottom Compressed NBR O-Ring */}
                                            <ellipse cx={pxORingNeck} cy={toPxY(rNeck - 1.2)} rx={toDeltaPx(1.8)} ry={toDeltaPx(1.3)} fill={selectedPartNumber === 9 ? '#3ad0e6' : '#18181b'} stroke={selectedPartNumber === 9 ? '#fff' : '#e6b84a'} strokeWidth="0.8" />
                                        </g>
                                    );
                                })()}
                            </g>

                            {/* Self-Locking Piston Retaining Nut (Part 11) */}
                            <g onClick={(e) => { e.stopPropagation(); onSelectPart?.(11); }}>
                                <rect
                                    x={pxPistonLeft - toDeltaPx(16)}
                                    y={toPxY(-(rodNeckDia / 2 + 3))}
                                    width={toDeltaPx(16)}
                                    height={toDeltaPx(rodNeckDia + 6)}
                                    fill="#263649"
                                    stroke="#7aa2ff"
                                    strokeWidth="1.2"
                                    rx="1"
                                />
                                {/* Castellated Nut Cotter Pin */}
                                <line x1={pxPistonLeft - toDeltaPx(8)} y1={toPxY(-(rodNeckDia / 2 + 5))} x2={pxPistonLeft - toDeltaPx(8)} y2={toPxY(rodNeckDia / 2 + 5)} stroke="#ffaa55" strokeWidth="1.2" />
                            </g>

                            {/* ── KASTAŞ K16 COMPACT PISTON SEAL PROFILE & GUIDE BANDS (Part 6) ── */}
                            {(() => {
                                const pxSealCenter = pxPistonLeft + toDeltaPx(pistonLen * 0.5);
                                const sealW = toDeltaPx(14);
                                const sealDepth = toDeltaPx(6);
                                const energizerW = toDeltaPx(8.5);
                                const energizerH = toDeltaPx(2.8);
                                const guideW = toDeltaPx(9.5);
                                const guideH = toDeltaPx(3.0);
                                const xLeftGuide = pxPistonLeft + toDeltaPx(pistonLen * 0.16);
                                const xRightGuide = pxPistonLeft + toDeltaPx(pistonLen * 0.84) - guideW;

                                return (
                                    <g onClick={(e) => { e.stopPropagation(); onSelectPart?.(6); }}>
                                        {/* 1. TOP PISTON SEALS */}
                                        {/* Machined ISO 7425 Groove Cavity in Piston OD */}
                                        <rect x={pxSealCenter - sealW / 2} y={yTopBore} width={sealW} height={sealDepth} fill="#070a0f" stroke="#556d8a" strokeWidth="0.8" />
                                        
                                        {pistonSealType === 'K21' ? (
                                            /* Kastaş K21 Polyurethane U-Cup Piston Seal */
                                            <g>
                                                <path
                                                    d={`M ${pxSealCenter - toDeltaPx(6)} ${yTopBore}
                                                       L ${pxSealCenter - toDeltaPx(6)} ${yTopBore + sealDepth - toDeltaPx(1)}
                                                       L ${pxSealCenter + toDeltaPx(6)} ${yTopBore + sealDepth - toDeltaPx(1)}
                                                       L ${pxSealCenter + toDeltaPx(6)} ${yTopBore}
                                                       L ${pxSealCenter + toDeltaPx(4)} ${yTopBore + toDeltaPx(1.2)}
                                                       L ${pxSealCenter + toDeltaPx(2)} ${yTopBore + sealDepth - toDeltaPx(2.2)}
                                                       L ${pxSealCenter - toDeltaPx(2)} ${yTopBore + sealDepth - toDeltaPx(2.2)}
                                                       L ${pxSealCenter - toDeltaPx(4)} ${yTopBore + toDeltaPx(1.2)}
                                                       Z`}
                                                    fill={selectedPartNumber === 6 ? '#38bdf8' : '#0284c7'}
                                                    stroke={selectedPartNumber === 6 ? '#fff' : '#38bdf8'}
                                                    strokeWidth="0.8"
                                                />
                                            </g>
                                        ) : pistonSealType === 'K40' ? (
                                            /* Kastaş K40 PTFE + 40% Bronze Slipper Seal with Elastomer O-Ring Energizer */
                                            <g>
                                                {/* Elastomer O-Ring Energizer at Groove Root */}
                                                <ellipse
                                                    cx={pxSealCenter}
                                                    cy={yTopBore + sealDepth - toDeltaPx(1.6)}
                                                    rx={toDeltaPx(3.6)}
                                                    ry={toDeltaPx(1.5)}
                                                    fill="#18181b"
                                                    stroke="#e6b84a"
                                                    strokeWidth="0.8"
                                                />
                                                {/* Low-Friction Bronze PTFE Stepped Slider Ring */}
                                                <rect
                                                    x={pxSealCenter - toDeltaPx(5.5)}
                                                    y={yTopBore}
                                                    width={toDeltaPx(11)}
                                                    height={toDeltaPx(3.2)}
                                                    fill={selectedPartNumber === 6 ? '#f59e0b' : '#d97706'}
                                                    stroke={selectedPartNumber === 6 ? '#fff' : '#fbbf24'}
                                                    strokeWidth="0.8"
                                                    rx="0.4"
                                                />
                                                {/* Stepped Hydrodynamic Oil Notches on Outer Ring Face */}
                                                <line x1={pxSealCenter - toDeltaPx(2)} y1={yTopBore} x2={pxSealCenter - toDeltaPx(2)} y2={yTopBore + toDeltaPx(1.2)} stroke="#92400e" strokeWidth="0.8" />
                                                <line x1={pxSealCenter + toDeltaPx(2)} y1={yTopBore} x2={pxSealCenter + toDeltaPx(2)} y2={yTopBore + toDeltaPx(1.2)} stroke="#92400e" strokeWidth="0.8" />
                                            </g>
                                        ) : (
                                            /* Kastaş K16 Compact Polyurethane Seal with NBR Core and POM Rings */
                                            <g>
                                                {/* NBR Rubber Energizer Preload Core at Groove Root */}
                                                <rect x={pxSealCenter - energizerW / 2} y={yTopBore + sealDepth - energizerH} width={energizerW} height={energizerH} fill="#1e293b" stroke="#38bdf8" strokeWidth="0.7" rx="0.5" />
                                                
                                                {/* Dynamic Profiled Sealing Ring (Kastaş K16 Polyurethane) */}
                                                <polygon 
                                                    points={`${pxSealCenter - toDeltaPx(4)},${yTopBore + toDeltaPx(1.8)} 
                                                            ${pxSealCenter - toDeltaPx(2.5)},${yTopBore + toDeltaPx(0.8)} 
                                                            ${pxSealCenter},${yTopBore} 
                                                            ${pxSealCenter + toDeltaPx(2.5)},${yTopBore + toDeltaPx(0.8)} 
                                                            ${pxSealCenter + toDeltaPx(4)},${yTopBore + toDeltaPx(1.8)} 
                                                            ${pxSealCenter + toDeltaPx(3)},${yTopBore + toDeltaPx(3.2)} 
                                                            ${pxSealCenter - toDeltaPx(3)},${yTopBore + toDeltaPx(3.2)}`} 
                                                    fill={selectedPartNumber === 6 ? '#ffaa00' : '#f59e0b'} 
                                                    stroke={selectedPartNumber === 6 ? '#fff' : '#fbbf24'} 
                                                    strokeWidth="0.8" 
                                                />

                                                {/* Dual Stepped POM Anti-Extrusion Back-Up Rings (L-Shaped Destek Ringleri) */}
                                                <path
                                                    d={`M ${pxSealCenter - toDeltaPx(7)} ${yTopBore} 
                                                       L ${pxSealCenter - toDeltaPx(4)} ${yTopBore} 
                                                       L ${pxSealCenter - toDeltaPx(4)} ${yTopBore + toDeltaPx(1.8)} 
                                                       L ${pxSealCenter - toDeltaPx(3)} ${yTopBore + toDeltaPx(1.8)} 
                                                       L ${pxSealCenter - toDeltaPx(3)} ${yTopBore + toDeltaPx(3.2)} 
                                                       L ${pxSealCenter - toDeltaPx(7)} ${yTopBore + toDeltaPx(3.2)} 
                                                       Z`}
                                                    fill="#f8fafc"
                                                    stroke="#475569"
                                                    strokeWidth="0.6"
                                                />
                                                <path
                                                    d={`M ${pxSealCenter + toDeltaPx(7)} ${yTopBore} 
                                                       L ${pxSealCenter + toDeltaPx(4)} ${yTopBore} 
                                                       L ${pxSealCenter + toDeltaPx(4)} ${yTopBore + toDeltaPx(1.8)} 
                                                       L ${pxSealCenter + toDeltaPx(3)} ${yTopBore + toDeltaPx(1.8)} 
                                                       L ${pxSealCenter + toDeltaPx(3)} ${yTopBore + toDeltaPx(3.2)} 
                                                       L ${pxSealCenter + toDeltaPx(7)} ${yTopBore + toDeltaPx(3.2)} 
                                                       Z`}
                                                    fill="#f8fafc"
                                                    stroke="#475569"
                                                    strokeWidth="0.6"
                                                />
                                            </g>
                                        )}

                                        {/* 2. BOTTOM PISTON SEALS (Symmetrically Mirrored across Centerline) */}
                                        {/* Machined ISO 7425 Groove Cavity */}
                                        <rect x={pxSealCenter - sealW / 2} y={yBotBore - sealDepth} width={sealW} height={sealDepth} fill="#070a0f" stroke="#556d8a" strokeWidth="0.8" />
                                        
                                        {pistonSealType === 'K21' ? (
                                            /* Kastaş K21 Bottom U-Cup */
                                            <g>
                                                <path
                                                    d={`M ${pxSealCenter - toDeltaPx(6)} ${yBotBore}
                                                       L ${pxSealCenter - toDeltaPx(6)} ${yBotBore - sealDepth + toDeltaPx(1)}
                                                       L ${pxSealCenter + toDeltaPx(6)} ${yBotBore - sealDepth + toDeltaPx(1)}
                                                       L ${pxSealCenter + toDeltaPx(6)} ${yBotBore}
                                                       L ${pxSealCenter + toDeltaPx(4)} ${yBotBore - toDeltaPx(1.2)}
                                                       L ${pxSealCenter + toDeltaPx(2)} ${yBotBore - sealDepth + toDeltaPx(2.2)}
                                                       L ${pxSealCenter - toDeltaPx(2)} ${yBotBore - sealDepth + toDeltaPx(2.2)}
                                                       L ${pxSealCenter - toDeltaPx(4)} ${yBotBore - toDeltaPx(1.2)}
                                                       Z`}
                                                    fill={selectedPartNumber === 6 ? '#38bdf8' : '#0284c7'}
                                                    stroke={selectedPartNumber === 6 ? '#fff' : '#38bdf8'}
                                                    strokeWidth="0.8"
                                                />
                                            </g>
                                        ) : pistonSealType === 'K40' ? (
                                            /* Kastaş K40 Bottom Slipper */
                                            <g>
                                                <ellipse
                                                    cx={pxSealCenter}
                                                    cy={yBotBore - sealDepth + toDeltaPx(1.6)}
                                                    rx={toDeltaPx(3.6)}
                                                    ry={toDeltaPx(1.5)}
                                                    fill="#18181b"
                                                    stroke="#e6b84a"
                                                    strokeWidth="0.8"
                                                />
                                                <rect
                                                    x={pxSealCenter - toDeltaPx(5.5)}
                                                    y={yBotBore - toDeltaPx(3.2)}
                                                    width={toDeltaPx(11)}
                                                    height={toDeltaPx(3.2)}
                                                    fill={selectedPartNumber === 6 ? '#f59e0b' : '#d97706'}
                                                    stroke={selectedPartNumber === 6 ? '#fff' : '#fbbf24'}
                                                    strokeWidth="0.8"
                                                    rx="0.4"
                                                />
                                                <line x1={pxSealCenter - toDeltaPx(2)} y1={yBotBore} x2={pxSealCenter - toDeltaPx(2)} y2={yBotBore - toDeltaPx(1.2)} stroke="#92400e" strokeWidth="0.8" />
                                                <line x1={pxSealCenter + toDeltaPx(2)} y1={yBotBore} x2={pxSealCenter + toDeltaPx(2)} y2={yBotBore - toDeltaPx(1.2)} stroke="#92400e" strokeWidth="0.8" />
                                            </g>
                                        ) : (
                                            /* Kastaş K16 Bottom Compact Seal */
                                            <g>
                                                {/* NBR Energizer at Root */}
                                                <rect x={pxSealCenter - energizerW / 2} y={yBotBore - sealDepth} width={energizerW} height={energizerH} fill="#1e293b" stroke="#38bdf8" strokeWidth="0.7" rx="0.5" />
                                                
                                                {/* Dynamic Profiled Sealing Ring */}
                                                <polygon 
                                                    points={`${pxSealCenter - toDeltaPx(4)},${yBotBore - toDeltaPx(1.8)} 
                                                            ${pxSealCenter - toDeltaPx(2.5)},${yBotBore - toDeltaPx(0.8)} 
                                                            ${pxSealCenter},${yBotBore} 
                                                            ${pxSealCenter + toDeltaPx(2.5)},${yBotBore - toDeltaPx(0.8)} 
                                                            ${pxSealCenter + toDeltaPx(4)},${yBotBore - toDeltaPx(1.8)} 
                                                            ${pxSealCenter + toDeltaPx(3)},${yBotBore - toDeltaPx(3.2)} 
                                                            ${pxSealCenter - toDeltaPx(3)},${yBotBore - toDeltaPx(3.2)}`} 
                                                    fill={selectedPartNumber === 6 ? '#ffaa00' : '#f59e0b'} 
                                                    stroke={selectedPartNumber === 6 ? '#fff' : '#fbbf24'} 
                                                    strokeWidth="0.8" 
                                                />

                                                {/* Dual Stepped POM Anti-Extrusion Back-Up Rings */}
                                                <path
                                                    d={`M ${pxSealCenter - toDeltaPx(7)} ${yBotBore} 
                                                       L ${pxSealCenter - toDeltaPx(4)} ${yBotBore} 
                                                       L ${pxSealCenter - toDeltaPx(4)} ${yBotBore - toDeltaPx(1.8)} 
                                                       L ${pxSealCenter - toDeltaPx(3)} ${yBotBore - toDeltaPx(1.8)} 
                                                       L ${pxSealCenter - toDeltaPx(3)} ${yBotBore - toDeltaPx(3.2)} 
                                                       L ${pxSealCenter - toDeltaPx(7)} ${yBotBore - toDeltaPx(3.2)} 
                                                       Z`}
                                                    fill="#f8fafc"
                                                    stroke="#475569"
                                                    strokeWidth="0.6"
                                                />
                                                <path
                                                    d={`M ${pxSealCenter + toDeltaPx(7)} ${yBotBore} 
                                                       L ${pxSealCenter + toDeltaPx(4)} ${yBotBore} 
                                                       L ${pxSealCenter + toDeltaPx(4)} ${yBotBore - toDeltaPx(1.8)} 
                                                       L ${pxSealCenter + toDeltaPx(3)} ${yBotBore - toDeltaPx(1.8)} 
                                                       L ${pxSealCenter + toDeltaPx(3)} ${yBotBore - toDeltaPx(3.2)} 
                                                       L ${pxSealCenter + toDeltaPx(7)} ${yBotBore - toDeltaPx(3.2)} 
                                                       Z`}
                                                    fill="#f8fafc"
                                                    stroke="#475569"
                                                    strokeWidth="0.6"
                                                />
                                            </g>
                                        )}

                                        {/* 3. DUAL KASTAŞ K73 POM/PTFE GUIDE RINGS (Kılavuz Yataklama Bantları) */}
                                        {/* Left Guide Ring - Top */}
                                        <rect x={xLeftGuide} y={yTopBore} width={guideW} height={guideH} fill="#070a0f" stroke="#556d8a" strokeWidth="0.6" />
                                        <polygon
                                            points={`${xLeftGuide + toDeltaPx(1)},${yTopBore} 
                                                    ${xLeftGuide},${yTopBore + guideH} 
                                                    ${xLeftGuide + guideW},${yTopBore + guideH} 
                                                    ${xLeftGuide + guideW - toDeltaPx(1)},${yTopBore}`}
                                            fill="#10b981"
                                            stroke="#34d399"
                                            strokeWidth="0.6"
                                        />
                                        {/* Left Guide Ring - Bottom */}
                                        <rect x={xLeftGuide} y={yBotBore - guideH} width={guideW} height={guideH} fill="#070a0f" stroke="#556d8a" strokeWidth="0.6" />
                                        <polygon
                                            points={`${xLeftGuide + toDeltaPx(1)},${yBotBore} 
                                                    ${xLeftGuide},${yBotBore - guideH} 
                                                    ${xLeftGuide + guideW},${yBotBore - guideH} 
                                                    ${xLeftGuide + guideW - toDeltaPx(1)},${yBotBore}`}
                                            fill="#10b981"
                                            stroke="#34d399"
                                            strokeWidth="0.6"
                                        />

                                        {/* Right Guide Ring - Top */}
                                        <rect x={xRightGuide} y={yTopBore} width={guideW} height={guideH} fill="#070a0f" stroke="#556d8a" strokeWidth="0.6" />
                                        <polygon
                                            points={`${xRightGuide + toDeltaPx(1)},${yTopBore} 
                                                    ${xRightGuide},${yTopBore + guideH} 
                                                    ${xRightGuide + guideW},${yTopBore + guideH} 
                                                    ${xRightGuide + guideW - toDeltaPx(1)},${yTopBore}`}
                                            fill="#10b981"
                                            stroke="#34d399"
                                            strokeWidth="0.6"
                                        />
                                        {/* Right Guide Ring - Bottom */}
                                        <rect x={xRightGuide} y={yBotBore - guideH} width={guideW} height={guideH} fill="#070a0f" stroke="#556d8a" strokeWidth="0.6" />
                                        <polygon
                                            points={`${xRightGuide + toDeltaPx(1)},${yBotBore} 
                                                    ${xRightGuide},${yBotBore - guideH} 
                                                    ${xRightGuide + guideW},${yBotBore - guideH} 
                                                    ${xRightGuide + guideW - toDeltaPx(1)},${yBotBore}`}
                                            fill="#10b981"
                                            stroke="#34d399"
                                            strokeWidth="0.6"
                                        />
                                    </g>
                                );
                            })()}
                        </g>

                        {/* ─────────────────────────────────────────────────────────────
                            9. FRONT GLAND (ÖN BOĞAZ) & HEAD FLANGE (ISO MF3)
                            ───────────────────────────────────────────────────────────── */}
                        <g 
                            onClick={() => onSelectPart?.(4)}
                            className="cursor-pointer group"
                        >
                            {/* ISO MF3: Head Flange Plate */}
                            {hasFrontFlange && (
                                <g>
                                    <rect
                                        x={pxGlandStart + toDeltaPx(6)}
                                        y={toPxY(-flangeOuterDia / 2)}
                                        width={toDeltaPx(flangeThickness)}
                                        height={toDeltaPx(flangeOuterDia)}
                                        fill="#162231"
                                        stroke="#7aa2ff"
                                        strokeWidth="1.4"
                                    />
                                    <rect
                                        x={pxGlandStart + toDeltaPx(6)}
                                        y={toPxY(-flangeOuterDia / 2)}
                                        width={toDeltaPx(flangeThickness)}
                                        height={toDeltaPx(flangeOuterDia)}
                                        fill="url(#hatchGland)"
                                        pointerEvents="none"
                                    />
                                    {/* DIN 912 Flange Screws with Counterbore Pocket & Hex Socket */}
                                    {(() => {
                                        const boltCount = result?.flangeBoltCount ?? 6;
                                        const rawBoltSize = result?.flangeBoltSize ?? 'M16';
                                        const cleanBoltSize = rawBoltSize.replace(/^\d+x\s*/i, '');
                                        const torque = result?.boltedJoints.flangeBolts?.tighteningTorqueNm ?? (result?.flangeBoltTorqueNm ?? 280);
                                        const cxBolt = pxGlandStart + toDeltaPx(6 + flangeThickness / 2);
                                        const cyTop = toPxY(-flangeOuterDia / 2 + 14);
                                        const cyBot = toPxY(flangeOuterDia / 2 - 14);
                                        const rBolt = toDeltaPx(5);
                                        return (
                                            <g>
                                                {/* Top screw */}
                                                <circle cx={cxBolt} cy={cyTop} r={rBolt} fill="#06090e" stroke="#3ad0e6" strokeWidth="1.2" />
                                                <polygon points={`${cxBolt - 2.5},${cyTop - 1.5} ${cxBolt},${cyTop - 3} ${cxBolt + 2.5},${cyTop - 1.5} ${cxBolt + 2.5},${cyTop + 1.5} ${cxBolt},${cyTop + 3} ${cxBolt - 2.5},${cyTop + 1.5}`} fill="#7aa2ff" />
                                                {/* Bottom screw */}
                                                <circle cx={cxBolt} cy={cyBot} r={rBolt} fill="#06090e" stroke="#3ad0e6" strokeWidth="1.2" />
                                                <polygon points={`${cxBolt - 2.5},${cyBot - 1.5} ${cxBolt},${cyBot - 3} ${cxBolt + 2.5},${cyBot - 1.5} ${cxBolt + 2.5},${cyBot + 1.5} ${cxBolt},${cyBot + 3} ${cxBolt - 2.5},${cyBot + 1.5}`} fill="#7aa2ff" />

                                                {showJointDetails && (
                                                    <g transform={`translate(${cxBolt}, ${toPxY(-flangeOuterDia / 2) - 10})`}>
                                                        <rect x={-toDeltaPx(44)} y={-toDeltaPx(13)} width={toDeltaPx(88)} height={toDeltaPx(13)} fill="#0c1016" stroke="#7aa2ff" strokeWidth="0.8" rx="2" />
                                                        <text x={0} y={-toDeltaPx(3.5)} textAnchor="middle" fontSize="7" fill="#7aa2ff" fontWeight="bold">
                                                            {boltCount}x {cleanBoltSize} (M_A={torque}Nm)
                                                        </text>
                                                    </g>
                                                )}
                                            </g>
                                        );
                                    })()}
                                </g>
                            )}

                            {/* Gland / Head Body Section */}
                            {hasTieRods ? (
                                <g>
                                    {/* ISO 6020-2 Square Front Head Solid Block (E x E) - Top Section */}
                                    <rect
                                        x={pxGlandStart}
                                        y={yTopSquare}
                                        width={toDeltaPx(glandLen)}
                                        height={yTopRod - yTopSquare}
                                        fill={selectedPartNumber === 4 ? '#192b3d' : '#111a27'}
                                        stroke={selectedPartNumber === 4 ? '#3ad0e6' : '#556d8a'}
                                        strokeWidth={selectedPartNumber === 4 ? 2 : 1.4}
                                    />
                                    <rect
                                        x={pxGlandStart}
                                        y={yTopSquare}
                                        width={toDeltaPx(glandLen)}
                                        height={yTopRod - yTopSquare}
                                        fill="url(#hatchGland)"
                                        pointerEvents="none"
                                    />

                                    {/* ISO 6020-2 Square Front Head Solid Block (E x E) - Bottom Section */}
                                    <rect
                                        x={pxGlandStart}
                                        y={yBotRod}
                                        width={toDeltaPx(glandLen)}
                                        height={yBotSquare - yBotRod}
                                        fill={selectedPartNumber === 4 ? '#192b3d' : '#111a27'}
                                        stroke={selectedPartNumber === 4 ? '#3ad0e6' : '#556d8a'}
                                        strokeWidth={selectedPartNumber === 4 ? 2 : 1.4}
                                    />
                                    <rect
                                        x={pxGlandStart}
                                        y={yBotRod}
                                        width={toDeltaPx(glandLen)}
                                        height={yBotSquare - yBotRod}
                                        fill="url(#hatchGland)"
                                        pointerEvents="none"
                                    />

                                    {/* Counterbore Pilot Recess where Front Tube End Nests (Depth ~10mm) */}
                                    <rect
                                        x={pxGlandStart}
                                        y={yTopOD}
                                        width={toDeltaPx(10)}
                                        height={yBotOD - yTopOD}
                                        fill="#080c14"
                                        stroke="#3ad0e6"
                                        strokeWidth="0.8"
                                        strokeDasharray="3,2"
                                    />
                                    {/* Static Tube Spigot O-Ring Seals in Front Counterbore Recess */}
                                    <ellipse
                                        cx={pxGlandStart + toDeltaPx(5)}
                                        cy={toPxY(-tubeOD / 2 + tubeWallT / 2)}
                                        rx={toDeltaPx(1.8)}
                                        ry={toDeltaPx(1.4)}
                                        fill="#18181b"
                                        stroke="#e6b84a"
                                        strokeWidth="0.8"
                                    />
                                    <ellipse
                                        cx={pxGlandStart + toDeltaPx(5)}
                                        cy={toPxY(tubeOD / 2 - tubeWallT / 2)}
                                        rx={toDeltaPx(1.8)}
                                        ry={toDeltaPx(1.4)}
                                        fill="#18181b"
                                        stroke="#e6b84a"
                                        strokeWidth="0.8"
                                    />

                                    {/* Circular Register Spigot on Front Face of Square Head */}
                                    <rect
                                        x={pxTubeEnd}
                                        y={toPxY(-boreD * 0.48)}
                                        width={toDeltaPx(4)}
                                        height={toDeltaPx(boreD * 0.96)}
                                        fill="#162231"
                                        stroke="#556d8a"
                                        strokeWidth="1"
                                    />

                                    {/* Tie-Rod Through-Holes in Square Front Head */}
                                    {/* Top Tie-Rod Hole */}
                                    <line x1={pxGlandStart} y1={yTopTie - toDeltaPx(tieDiaMm * 0.55)} x2={pxTubeEnd} y2={yTopTie - toDeltaPx(tieDiaMm * 0.55)} stroke="#3ad0e6" strokeWidth="0.7" strokeDasharray="3,2" />
                                    <line x1={pxGlandStart} y1={yTopTie + toDeltaPx(tieDiaMm * 0.55)} x2={pxTubeEnd} y2={yTopTie + toDeltaPx(tieDiaMm * 0.55)} stroke="#3ad0e6" strokeWidth="0.7" strokeDasharray="3,2" />
                                    <line x1={pxGlandStart - toDeltaPx(4)} y1={yTopTie} x2={pxTubeEnd + toDeltaPx(4)} y2={yTopTie} stroke="#7aa2ff" strokeWidth="0.6" strokeDasharray="6,2,2,2" />

                                    {/* Bottom Tie-Rod Hole */}
                                    <line x1={pxGlandStart} y1={yBotTie - toDeltaPx(tieDiaMm * 0.55)} x2={pxTubeEnd} y2={yBotTie - toDeltaPx(tieDiaMm * 0.55)} stroke="#3ad0e6" strokeWidth="0.7" strokeDasharray="3,2" />
                                    <line x1={pxGlandStart} y1={yBotTie + toDeltaPx(tieDiaMm * 0.55)} x2={pxTubeEnd} y2={yBotTie + toDeltaPx(tieDiaMm * 0.55)} stroke="#3ad0e6" strokeWidth="0.7" strokeDasharray="3,2" />
                                    <line x1={pxGlandStart - toDeltaPx(4)} y1={yBotTie} x2={pxTubeEnd + toDeltaPx(4)} y2={yBotTie} stroke="#7aa2ff" strokeWidth="0.6" strokeDasharray="6,2,2,2" />
                                </g>
                            ) : (
                                <g>
                                    {/* Gland Body Top Section (Full OD flush with tube OD) */}
                                    <rect
                                        x={pxGlandStart}
                                        y={isThreadedGland ? yTopBore : yTopOD}
                                        width={toDeltaPx(glandLen)}
                                        height={isThreadedGland ? (yTopRod - yTopBore) : (yTopRod - yTopOD)}
                                        fill={selectedPartNumber === 4 ? '#192b3d' : '#111a27'}
                                        stroke={selectedPartNumber === 4 ? '#3ad0e6' : '#556d8a'}
                                        strokeWidth={selectedPartNumber === 4 ? 2 : 1.2}
                                    />
                                    <rect
                                        x={pxGlandStart}
                                        y={isThreadedGland ? yTopBore : yTopOD}
                                        width={toDeltaPx(glandLen)}
                                        height={isThreadedGland ? (yTopRod - yTopBore) : (yTopRod - yTopOD)}
                                        fill="url(#hatchGland)"
                                        pointerEvents="none"
                                    />

                                    {/* Gland Body Bottom Section (Full OD flush with tube OD) */}
                                    <rect
                                        x={pxGlandStart}
                                        y={yBotRod}
                                        width={toDeltaPx(glandLen)}
                                        height={isThreadedGland ? (yBotBore - yBotRod) : (yBotOD - yBotRod)}
                                        fill={selectedPartNumber === 4 ? '#192b3d' : '#111a27'}
                                        stroke={selectedPartNumber === 4 ? '#3ad0e6' : '#556d8a'}
                                        strokeWidth={selectedPartNumber === 4 ? 2 : 1.2}
                                    />
                                    <rect
                                        x={pxGlandStart}
                                        y={yBotRod}
                                        width={toDeltaPx(glandLen)}
                                        height={isThreadedGland ? (yBotBore - yBotRod) : (yBotOD - yBotRod)}
                                        fill="url(#hatchGland)"
                                        pointerEvents="none"
                                    />

                                    {/* Tube-to-Gland Seam Interface Line */}
                                    {!isThreadedGland && (
                                        <>
                                            <line x1={pxGlandStart} y1={yTopOD} x2={pxGlandStart} y2={yTopBore} stroke="#556d8a" strokeWidth="1.2" />
                                            <line x1={pxGlandStart} y1={yBotBore} x2={pxGlandStart} y2={yBotOD} stroke="#556d8a" strokeWidth="1.2" />
                                        </>
                                    )}
                                </g>
                            )}

                            {/* Threaded Gland Engagement & DIN 3116 Pin Spanner Holes (MAG KHS Style) */}
                            {(activeBarrel === 'welded_cap_threaded_gland') && (() => {
                                const thdLen = toDeltaPx(Math.max(20, Math.round(glandLen * 0.62)));
                                const glandThread = result?.threadedJoints.glandThread.size ?? result?.glandThreadSize ?? `M${Math.round(boreD * 0.95)}x2`;
                                const pinDia = 8;
                                const pinDiaPx = toDeltaPx(pinDia);
                                const pinDepthPx = toDeltaPx(8);
                                const collarLenPx = toDeltaPx(8);

                                return (
                                    <g>
                                        {/* Metric Thread Root & Crest Teeth Representation on Top Interface */}
                                        <line x1={pxGlandStart} y1={yTopBore - 1.5} x2={pxGlandStart + thdLen} y2={yTopBore - 1.5} stroke="#3ad0e6" strokeWidth="0.8" strokeDasharray="2,2" />
                                        <line x1={pxGlandStart} y1={yTopBore + 1.5} x2={pxGlandStart + thdLen} y2={yTopBore + 1.5} stroke="#7aa2ff" strokeWidth="0.8" />
                                        
                                        {/* Metric Thread Teeth on Bottom Interface */}
                                        <line x1={pxGlandStart} y1={yBotBore - 1.5} x2={pxGlandStart + thdLen} y2={yBotBore - 1.5} stroke="#7aa2ff" strokeWidth="0.8" />
                                        <line x1={pxGlandStart} y1={yBotBore + 1.5} x2={pxGlandStart + thdLen} y2={yBotBore + 1.5} stroke="#3ad0e6" strokeWidth="0.8" strokeDasharray="2,2" />

                                        {/* Gland Stop Collar Flush Against Honed Tube End Face */}
                                        {/* Tube End Face Seam Line */}
                                        <line x1={pxTubeEnd} y1={yTopOD} x2={pxTubeEnd} y2={yTopBore} stroke="#556d8a" strokeWidth="1" />
                                        <line x1={pxTubeEnd} y1={yBotBore} x2={pxTubeEnd} y2={yBotOD} stroke="#556d8a" strokeWidth="1" />
                                        
                                        {/* Stop Collar Upper Section matching Tube OD */}
                                        <rect x={pxTubeEnd} y={yTopOD} width={collarLenPx} height={yTopRod - yTopOD} fill={selectedPartNumber === 4 ? '#192b3d' : '#111a27'} stroke={selectedPartNumber === 4 ? '#3ad0e6' : '#556d8a'} strokeWidth={selectedPartNumber === 4 ? 2 : 1.2} />
                                        <rect x={pxTubeEnd} y={yTopOD} width={collarLenPx} height={yTopRod - yTopOD} fill="url(#hatchGland)" pointerEvents="none" />
                                        
                                        {/* Stop Collar Lower Section matching Tube OD */}
                                        <rect x={pxTubeEnd} y={yBotRod} width={collarLenPx} height={yBotOD - yBotRod} fill={selectedPartNumber === 4 ? '#192b3d' : '#111a27'} stroke={selectedPartNumber === 4 ? '#3ad0e6' : '#556d8a'} strokeWidth={selectedPartNumber === 4 ? 2 : 1.2} />
                                        <rect x={pxTubeEnd} y={yBotRod} width={collarLenPx} height={yBotOD - yBotRod} fill="url(#hatchGland)" pointerEvents="none" />

                                        {/* DIN 3116 Face Pin Spanner Blind Holes on Gland Collar Front Face */}
                                        <rect x={pxTubeEnd + collarLenPx - pinDepthPx} y={toPxY(-boreD * 0.38) - pinDiaPx / 2} width={pinDepthPx} height={pinDiaPx} fill="#06090e" stroke="#ffe17d" strokeWidth="0.9" rx="0.5" />
                                        <line x1={pxTubeEnd + collarLenPx - pinDepthPx - 2} y1={toPxY(-boreD * 0.38)} x2={pxTubeEnd + collarLenPx + 2} y2={toPxY(-boreD * 0.38)} stroke="#e6b84a" strokeWidth="0.7" strokeDasharray="2,1" />

                                        <rect x={pxTubeEnd + collarLenPx - pinDepthPx} y={toPxY(boreD * 0.38) - pinDiaPx / 2} width={pinDepthPx} height={pinDiaPx} fill="#06090e" stroke="#ffe17d" strokeWidth="0.9" rx="0.5" />
                                        <line x1={pxTubeEnd + collarLenPx - pinDepthPx - 2} y1={toPxY(boreD * 0.38)} x2={pxTubeEnd + collarLenPx + 2} y2={toPxY(boreD * 0.38)} stroke="#e6b84a" strokeWidth="0.7" strokeDasharray="2,1" />

                                        {/* Thread Spec & DIN 3116 Spanner Callout */}
                                        {showJointDetails && (
                                            <g transform={`translate(${pxGlandStart + thdLen / 2}, ${yTopOD - toDeltaPx(10)})`}>
                                                <line x1={0} y1={toDeltaPx(8)} x2={0} y2={0} stroke="#3ad0e6" strokeWidth="0.8" />
                                                <rect x={-toDeltaPx(48)} y={-toDeltaPx(12)} width={toDeltaPx(96)} height={toDeltaPx(12)} fill="#0c1016" stroke="#3ad0e6" strokeWidth="0.8" rx="2" />
                                                <text x={0} y={-toDeltaPx(3.5)} textAnchor="middle" fontSize="7" fill="#3ad0e6" fontWeight="bold">
                                                    THD {glandThread} · DIN 3116 (2x Ø{pinDia})
                                                </text>
                                            </g>
                                        )}
                                    </g>
                                );
                            })()}

                            {/* Front Cushioning Throttle Pocket in Gland Body */}
                            {hasCushF && (
                                <rect
                                    x={pxGlandStart}
                                    y={toPxY(-(cushionSpearDia / 2 + 1.5))}
                                    width={toDeltaPx(Math.min(glandLen - 8, cushionSpearLenB + 4))}
                                    height={toDeltaPx(cushionSpearDia + 3)}
                                    fill="#070a0f"
                                    stroke="#3ad0e6"
                                    strokeWidth="0.9"
                                    strokeDasharray="3,2"
                                />
                            )}

                            {/* ── KASTAŞ INDUSTRIAL SEALS IN FRONT GLAND ── */}
                            {(() => {
                                // 1. STATIC TUBE-TO-GLAND O-RING WITH PARBAK BACK-UP RING (Part 10 / ISO 3601-1)
                                const oringGrooveW = toDeltaPx(6.8);
                                const oringGrooveDepth = toDeltaPx(3.6);
                                const oringRad = toDeltaPx(1.9);
                                const backupW = toDeltaPx(1.8);

                                // 2. PRIMARY ROD U-CUP SEAL (Part 7 / Kastaş K33 / ISO 5597)
                                const rodSealGrooveW = toDeltaPx(9.5);
                                const rodSealGrooveDepth = toDeltaPx(5.8);
                                const xLeftRS = pxRodSeal - rodSealGrooveW / 2 + 0.4;
                                const xRightRS = pxRodSeal + rodSealGrooveW / 2 - 0.4;

                                // 3. ROD GUIDE BUSHING / WEAR BAND (Kastaş K73 / K75)
                                const guideW = toDeltaPx(13.0);
                                const guideDepth = toDeltaPx(3.2);

                                // 4. METAL-CAGED WIPER / SCRAPER SEAL (Part 8 / Kastaş K27 / ISO 6195 Type B)
                                const collarLenPx = (activeBarrel === 'welded_cap_threaded_gland') ? toDeltaPx(8) : 0;
                                const pxGlandFront = pxTubeEnd + collarLenPx;
                                const wiperSeatDepth = toDeltaPx(7.0);
                                const wiperSeatHeight = toDeltaPx(5.0);
                                const pxWiperSeat = pxGlandFront - wiperSeatDepth;
                                const scraperExt = toDeltaPx(3.2); // Protrudes outward past gland front face

                                return (
                                    <g>
                                        {/* ── 1. TUBE-TO-GLAND STATIC O-RING & BACK-UP RING (Part 10) ── */}
                                        <g onClick={(e) => { e.stopPropagation(); onSelectPart?.(10); }}>
                                            {/* Top OD Groove */}
                                            <rect x={pxOring - oringGrooveW / 2} y={yTopBore} width={oringGrooveW} height={oringGrooveDepth} fill="#070a0f" stroke="#556d8a" strokeWidth="0.8" />
                                            {/* Top POM/PTFE Parbak Back-Up Ring (Atmospheric / Right side) */}
                                            <rect x={pxOring + oringGrooveW / 2 - backupW} y={yTopBore} width={backupW} height={oringGrooveDepth} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.6" rx="0.3" />
                                            {/* Top Compressed NBR O-Ring (Pressure / Left side) */}
                                            <ellipse cx={pxOring - oringGrooveW / 2 + oringRad + 0.4} cy={yTopBore + oringGrooveDepth / 2} rx={oringRad} ry={oringRad * 0.88} fill={selectedPartNumber === 10 ? '#3ad0e6' : '#18181b'} stroke={selectedPartNumber === 10 ? '#fff' : '#e6b84a'} strokeWidth="0.8" />

                                            {/* Bottom OD Groove */}
                                            <rect x={pxOring - oringGrooveW / 2} y={yBotBore - oringGrooveDepth} width={oringGrooveW} height={oringGrooveDepth} fill="#070a0f" stroke="#556d8a" strokeWidth="0.8" />
                                            {/* Bottom POM/PTFE Back-Up Ring */}
                                            <rect x={pxOring + oringGrooveW / 2 - backupW} y={yBotBore - oringGrooveDepth} width={backupW} height={oringGrooveDepth} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.6" rx="0.3" />
                                            {/* Bottom Compressed NBR O-Ring */}
                                            <ellipse cx={pxOring - oringGrooveW / 2 + oringRad + 0.4} cy={yBotBore - oringGrooveDepth / 2} rx={oringRad} ry={oringRad * 0.88} fill={selectedPartNumber === 10 ? '#3ad0e6' : '#18181b'} stroke={selectedPartNumber === 10 ? '#fff' : '#e6b84a'} strokeWidth="0.8" />
                                        </g>

                                        {/* ── 2. PRIMARY ROD SEAL (Part 7 / Kastaş K33 or K35) ── */}
                                        <g onClick={(e) => { e.stopPropagation(); onSelectPart?.(7); }}>
                                            {/* Top ISO 5597 Groove Cavity */}
                                            <rect x={pxRodSeal - rodSealGrooveW / 2} y={yTopRod - rodSealGrooveDepth} width={rodSealGrooveW} height={rodSealGrooveDepth} fill="#070a0f" stroke="#556d8a" strokeWidth="0.8" />
                                            
                                            {rodSealType === 'K35' ? (
                                                /* Kastaş K35 Heavy Duty Tandem Twin-Lip Rod Seal with POM Back-Up Ring */
                                                <g>
                                                    {/* Stepped POM Anti-Extrusion Back-Up Ring (Atmospheric / Right side) */}
                                                    <rect
                                                        x={xRightRS - toDeltaPx(2.5)}
                                                        y={yTopRod - rodSealGrooveDepth}
                                                        width={toDeltaPx(2.5)}
                                                        height={rodSealGrooveDepth}
                                                        fill="#f8fafc"
                                                        stroke="#94a3b8"
                                                        strokeWidth="0.6"
                                                        rx="0.3"
                                                    />
                                                    {/* Twin-Lip PU Body (Primary Lip + Secondary Hydrodynamic Stabilizing Lip) */}
                                                    <path
                                                        d={`M ${xLeftRS} ${yTopRod - rodSealGrooveDepth + toDeltaPx(0.8)} 
                                                           L ${xLeftRS + toDeltaPx(3.5)} ${yTopRod - rodSealGrooveDepth * 0.45} 
                                                           L ${xLeftRS} ${yTopRod - toDeltaPx(0.6)} 
                                                           L ${xLeftRS + toDeltaPx(1.5)} ${yTopRod} 
                                                           L ${xLeftRS + toDeltaPx(4.5)} ${yTopRod - toDeltaPx(1.5)} 
                                                           L ${xLeftRS + toDeltaPx(6.2)} ${yTopRod} 
                                                           L ${xRightRS - toDeltaPx(2.5)} ${yTopRod} 
                                                           L ${xRightRS - toDeltaPx(2.5)} ${yTopRod - rodSealGrooveDepth} 
                                                           L ${xLeftRS + toDeltaPx(1.5)} ${yTopRod - rodSealGrooveDepth} 
                                                           Z`}
                                                        fill={selectedPartNumber === 7 ? '#ffaa00' : '#f59e0b'}
                                                        stroke={selectedPartNumber === 7 ? '#fff' : '#fbbf24'}
                                                        strokeWidth="0.9"
                                                    />
                                                </g>
                                            ) : (
                                                /* Kastaş K33 Single Lip Asymmetric U-Cup */
                                                <path
                                                    d={`M ${xLeftRS} ${yTopRod - rodSealGrooveDepth + toDeltaPx(0.8)} 
                                                       L ${xLeftRS + toDeltaPx(4.8)} ${yTopRod - rodSealGrooveDepth * 0.52} 
                                                       L ${xLeftRS} ${yTopRod - toDeltaPx(0.6)} 
                                                       L ${xLeftRS + toDeltaPx(1.8)} ${yTopRod} 
                                                       L ${xRightRS} ${yTopRod} 
                                                       L ${xRightRS} ${yTopRod - rodSealGrooveDepth} 
                                                       L ${xLeftRS + toDeltaPx(1.8)} ${yTopRod - rodSealGrooveDepth} 
                                                       Z`}
                                                    fill={selectedPartNumber === 7 ? '#ffaa00' : '#f59e0b'}
                                                    stroke={selectedPartNumber === 7 ? '#fff' : '#fbbf24'}
                                                    strokeWidth="0.9"
                                                />
                                            )}

                                            {/* Bottom ISO 5597 Groove Cavity */}
                                            <rect x={pxRodSeal - rodSealGrooveW / 2} y={yBotRod} width={rodSealGrooveW} height={rodSealGrooveDepth} fill="#070a0f" stroke="#556d8a" strokeWidth="0.8" />
                                            
                                            {rodSealType === 'K35' ? (
                                                /* Bottom K35 Twin-Lip Seal */
                                                <g>
                                                    <rect
                                                        x={xRightRS - toDeltaPx(2.5)}
                                                        y={yBotRod}
                                                        width={toDeltaPx(2.5)}
                                                        height={rodSealGrooveDepth}
                                                        fill="#f8fafc"
                                                        stroke="#94a3b8"
                                                        strokeWidth="0.6"
                                                        rx="0.3"
                                                    />
                                                    <path
                                                        d={`M ${xLeftRS} ${yBotRod + rodSealGrooveDepth - toDeltaPx(0.8)} 
                                                           L ${xLeftRS + toDeltaPx(3.5)} ${yBotRod + rodSealGrooveDepth * 0.45} 
                                                           L ${xLeftRS} ${yBotRod + toDeltaPx(0.6)} 
                                                           L ${xLeftRS + toDeltaPx(1.5)} ${yBotRod} 
                                                           L ${xLeftRS + toDeltaPx(4.5)} ${yBotRod + toDeltaPx(1.5)} 
                                                           L ${xLeftRS + toDeltaPx(6.2)} ${yBotRod} 
                                                           L ${xRightRS - toDeltaPx(2.5)} ${yBotRod} 
                                                           L ${xRightRS - toDeltaPx(2.5)} ${yBotRod + rodSealGrooveDepth} 
                                                           L ${xLeftRS + toDeltaPx(1.5)} ${yBotRod + rodSealGrooveDepth} 
                                                           Z`}
                                                        fill={selectedPartNumber === 7 ? '#ffaa00' : '#f59e0b'}
                                                        stroke={selectedPartNumber === 7 ? '#fff' : '#fbbf24'}
                                                        strokeWidth="0.9"
                                                    />
                                                </g>
                                            ) : (
                                                /* Bottom K33 Single Lip */
                                                <path
                                                    d={`M ${xLeftRS} ${yBotRod + rodSealGrooveDepth - toDeltaPx(0.8)} 
                                                       L ${xLeftRS + toDeltaPx(4.8)} ${yBotRod + rodSealGrooveDepth * 0.52} 
                                                       L ${xLeftRS} ${yBotRod + toDeltaPx(0.6)} 
                                                       L ${xLeftRS + toDeltaPx(1.8)} ${yBotRod} 
                                                       L ${xRightRS} ${yBotRod} 
                                                       L ${xRightRS} ${yBotRod + rodSealGrooveDepth} 
                                                       L ${xLeftRS + toDeltaPx(1.8)} ${yBotRod + rodSealGrooveDepth} 
                                                       Z`}
                                                    fill={selectedPartNumber === 7 ? '#ffaa00' : '#f59e0b'}
                                                    stroke={selectedPartNumber === 7 ? '#fff' : '#fbbf24'}
                                                    strokeWidth="0.9"
                                                />
                                            )}
                                        </g>

                                        {/* ── 3. KASTAŞ K73 COMPOSITE ROD GUIDE BUSHING / WEAR BAND ── */}
                                        {/* Top Guide Groove & Chamfered Strip */}
                                        <rect x={pxGuide - guideW / 2} y={yTopRod - guideDepth} width={guideW} height={guideDepth} fill="#070a0f" stroke="#556d8a" strokeWidth="0.7" />
                                        <polygon
                                            points={`${pxGuide - guideW / 2 + toDeltaPx(1.2)},${yTopRod} 
                                                    ${pxGuide - guideW / 2},${yTopRod - guideDepth} 
                                                    ${pxGuide + guideW / 2},${yTopRod - guideDepth} 
                                                    ${pxGuide + guideW / 2 - toDeltaPx(1.2)},${yTopRod}`}
                                            fill="#10b981"
                                            stroke="#34d399"
                                            strokeWidth="0.7"
                                        />
                                        {/* Bottom Guide Groove & Chamfered Strip */}
                                        <rect x={pxGuide - guideW / 2} y={yBotRod} width={guideW} height={guideDepth} fill="#070a0f" stroke="#556d8a" strokeWidth="0.7" />
                                        <polygon
                                            points={`${pxGuide - guideW / 2 + toDeltaPx(1.2)},${yBotRod} 
                                                    ${pxGuide - guideW / 2},${yBotRod + guideDepth} 
                                                    ${pxGuide + guideW / 2},${yBotRod + guideDepth} 
                                                    ${pxGuide + guideW / 2 - toDeltaPx(1.2)},${yBotRod}`}
                                            fill="#10b981"
                                            stroke="#34d399"
                                            strokeWidth="0.7"
                                        />

                                        {/* ── 4. WIPER / SCRAPER SEAL (Part 8 / Kastaş K01 or K03/K27) ── */}
                                        <g onClick={(e) => { e.stopPropagation(); onSelectPart?.(8); }}>
                                            {wiperType === 'K01' ? (
                                                /* Kastaş K01 Polyurethane Snap-In Wiper (ISO 6195 Type A) */
                                                <g>
                                                    {/* Top Internal Snap Groove in Gland Front Bore */}
                                                    <rect x={pxWiperSeat} y={yTopRod - toDeltaPx(4.2)} width={wiperSeatDepth} height={toDeltaPx(4.2)} fill="#070a0f" stroke="#556d8a" strokeWidth="0.8" />
                                                    {/* Top PU Snap-In Body with Bulbous Retaining Heel & Flexible Scraper Lip */}
                                                    <path
                                                        d={`M ${pxWiperSeat} ${yTopRod}
                                                           L ${pxWiperSeat} ${yTopRod - toDeltaPx(3.5)}
                                                           L ${pxWiperSeat + toDeltaPx(3)} ${yTopRod - toDeltaPx(4.2)}
                                                           L ${pxGlandFront} ${yTopRod - toDeltaPx(2.5)}
                                                           L ${pxGlandFront + scraperExt} ${yTopRod}
                                                           L ${pxGlandFront + toDeltaPx(0.8)} ${yTopRod}
                                                           L ${pxWiperSeat + toDeltaPx(2)} ${yTopRod - toDeltaPx(1.2)}
                                                           Z`}
                                                        fill={selectedPartNumber === 8 ? '#ffaa00' : '#0284c7'}
                                                        stroke={selectedPartNumber === 8 ? '#fff' : '#38bdf8'}
                                                        strokeWidth="0.8"
                                                    />

                                                    {/* Bottom Internal Snap Groove */}
                                                    <rect x={pxWiperSeat} y={yBotRod} width={wiperSeatDepth} height={toDeltaPx(4.2)} fill="#070a0f" stroke="#556d8a" strokeWidth="0.8" />
                                                    {/* Bottom PU Snap-In Body */}
                                                    <path
                                                        d={`M ${pxWiperSeat} ${yBotRod}
                                                           L ${pxWiperSeat} ${yBotRod + toDeltaPx(3.5)}
                                                           L ${pxWiperSeat + toDeltaPx(3)} ${yBotRod + toDeltaPx(4.2)}
                                                           L ${pxGlandFront} ${yBotRod + toDeltaPx(2.5)}
                                                           L ${pxGlandFront + scraperExt} ${yBotRod}
                                                           L ${pxGlandFront + toDeltaPx(0.8)} ${yBotRod}
                                                           L ${pxWiperSeat + toDeltaPx(2)} ${yBotRod + toDeltaPx(1.2)}
                                                           Z`}
                                                        fill={selectedPartNumber === 8 ? '#ffaa00' : '#0284c7'}
                                                        stroke={selectedPartNumber === 8 ? '#fff' : '#38bdf8'}
                                                        strokeWidth="0.8"
                                                    />
                                                </g>
                                            ) : (
                                                /* Kastaş K03 / K27 Metal-Caged Press-Fit Wiper (ISO 6195 Type B) */
                                                <g>
                                                    {/* Top Counterbore Seat in Gland Front Face */}
                                                    <rect x={pxWiperSeat} y={yTopRod - wiperSeatHeight} width={wiperSeatDepth} height={wiperSeatHeight} fill="#070a0f" stroke="#556d8a" strokeWidth="0.8" />
                                                    {/* Top Press-Fit L-Shaped Steel Casing */}
                                                    <path
                                                        d={`M ${pxWiperSeat} ${yTopRod - toDeltaPx(1.6)} 
                                                           L ${pxWiperSeat} ${yTopRod - wiperSeatHeight} 
                                                           L ${pxGlandFront} ${yTopRod - wiperSeatHeight} 
                                                           L ${pxGlandFront} ${yTopRod - wiperSeatHeight + toDeltaPx(1.1)} 
                                                           L ${pxWiperSeat + toDeltaPx(1.1)} ${yTopRod - wiperSeatHeight + toDeltaPx(1.1)} 
                                                           L ${pxWiperSeat + toDeltaPx(1.1)} ${yTopRod - toDeltaPx(1.6)} 
                                                           Z`}
                                                        fill="#64748b"
                                                        stroke="#94a3b8"
                                                        strokeWidth="0.6"
                                                    />
                                                    {/* Top Vulcanized PU Body with 35° Acute Scraper Knife Lip */}
                                                    <polygon
                                                        points={`${pxWiperSeat + toDeltaPx(1.1)},${yTopRod - wiperSeatHeight + toDeltaPx(1.1)} 
                                                                ${pxGlandFront},${yTopRod - wiperSeatHeight + toDeltaPx(1.1)} 
                                                                ${pxGlandFront},${yTopRod - toDeltaPx(2.5)} 
                                                                ${pxGlandFront + scraperExt},${yTopRod} 
                                                                ${pxGlandFront + toDeltaPx(0.8)},${yTopRod} 
                                                                ${pxWiperSeat + toDeltaPx(1.1)},${yTopRod - toDeltaPx(1.6)}`}
                                                        fill={selectedPartNumber === 8 ? '#ffaa00' : '#e85d5d'}
                                                        stroke={selectedPartNumber === 8 ? '#fff' : '#f87171'}
                                                        strokeWidth="0.8"
                                                    />

                                                    {/* Bottom Counterbore Seat in Gland Front Face */}
                                                    <rect x={pxWiperSeat} y={yBotRod} width={wiperSeatDepth} height={wiperSeatHeight} fill="#070a0f" stroke="#556d8a" strokeWidth="0.8" />
                                                    {/* Bottom Press-Fit L-Shaped Steel Casing */}
                                                    <path
                                                        d={`M ${pxWiperSeat} ${yBotRod + toDeltaPx(1.6)} 
                                                           L ${pxWiperSeat} ${yBotRod + wiperSeatHeight} 
                                                           L ${pxGlandFront} ${yBotRod + wiperSeatHeight} 
                                                           L ${pxGlandFront} ${yBotRod + wiperSeatHeight - toDeltaPx(1.1)} 
                                                           L ${pxWiperSeat + toDeltaPx(1.1)} ${yBotRod + wiperSeatHeight - toDeltaPx(1.1)} 
                                                           L ${pxWiperSeat + toDeltaPx(1.1)} ${yBotRod + toDeltaPx(1.6)} 
                                                           Z`}
                                                        fill="#64748b"
                                                        stroke="#94a3b8"
                                                        strokeWidth="0.6"
                                                    />
                                                    {/* Bottom Vulcanized PU Body with 35° Acute Scraper Knife Lip */}
                                                    <polygon
                                                        points={`${pxWiperSeat + toDeltaPx(1.1)},${yBotRod + wiperSeatHeight - toDeltaPx(1.1)} 
                                                                ${pxGlandFront},${yBotRod + wiperSeatHeight - toDeltaPx(1.1)} 
                                                                ${pxGlandFront},${yBotRod + toDeltaPx(2.5)} 
                                                                ${pxGlandFront + scraperExt},${yBotRod} 
                                                                ${pxGlandFront + toDeltaPx(0.8)},${yBotRod} 
                                                                ${pxWiperSeat + toDeltaPx(1.1)},${yBotRod + toDeltaPx(1.6)}`}
                                                        fill={selectedPartNumber === 8 ? '#ffaa00' : '#e85d5d'}
                                                        stroke={selectedPartNumber === 8 ? '#fff' : '#f87171'}
                                                        strokeWidth="0.8"
                                                    />
                                                </g>
                                            )}
                                        </g>
                                    </g>
                                );
                            })()}
                        </g>

                        {/* ─────────────────────────────────────────────────────────────
                            10. TIE-RODS (ISO 6020-2 / DIN 24554 GERGİ SAPLAMALARI)
                            Solid through-bolts clamped onto square head and cap
                            ───────────────────────────────────────────────────────────── */}
                        {(hasTieRods) && (() => {
                            const rodThicknessPx = toDeltaPx(tieDiaMm);
                            const washerThkMm = 3.0;
                            const washerDiaMm = Math.round(tieDiaMm * 1.8);
                            const washerThkPx = toDeltaPx(washerThkMm);
                            const washerDiaPx = toDeltaPx(washerDiaMm);

                            const nutLenMm = Math.round(tieDiaMm * 0.85);
                            const nutDiaMm = Math.round(tieDiaMm * 1.6);
                            const nutLenPx = toDeltaPx(nutLenMm);
                            const nutDiaPx = toDeltaPx(nutDiaMm);

                            const isRearExtended = activeMount === 'extended_tie_rods_mx2' || activeMount === 'extended_tie_rods_mx3';
                            const isFrontExtended = activeMount === 'extended_tie_rods_mx1' || activeMount === 'extended_tie_rods_mx3';
                            const extLenMm = 35;
                            const extLenPx = toDeltaPx(extLenMm);
                            const standardStudExtPx = toDeltaPx(3.5);

                            // Rear stud endpoint:
                            // Nut seats against washer at pxRearCapEnd - washerThkPx.
                            // Nut outer face is at pxRearCapEnd - washerThkPx - nutLenPx.
                            const xRearNutOuter = pxRearCapEnd - washerThkPx - nutLenPx;
                            const xRearStudTip = isRearExtended ? (xRearNutOuter - extLenPx) : (xRearNutOuter - standardStudExtPx);

                            // Front stud endpoint:
                            // Nut seats against washer at pxTubeEnd + washerThkPx.
                            // Nut outer face is at pxTubeEnd + washerThkPx + nutLenPx.
                            const xFrontNutOuter = pxTubeEnd + washerThkPx + nutLenPx;
                            const xFrontStudTip = isFrontExtended ? (xFrontNutOuter + extLenPx) : (xFrontNutOuter + standardStudExtPx);

                            const torqueVal = result?.boltedJoints?.tieRodStuds?.tighteningTorqueNm ?? 125;

                            return (
                                <g opacity={0.95}>
                                    {/* ── TOP TIE-ROD BAR & CLAMPING ELEMENTS ── */}
                                    {/* Main Continuous Tie-Rod Bar (Alloy Steel Cylindrical Rod) */}
                                    <line
                                        x1={xRearStudTip}
                                        y1={yTopTie}
                                        x2={xFrontStudTip}
                                        y2={yTopTie}
                                        stroke="#64748b"
                                        strokeWidth={rodThicknessPx}
                                        strokeLinecap="round"
                                    />
                                    {/* Specular Metallic Highlight on Bar */}
                                    <line
                                        x1={pxRearCapEnd}
                                        y1={yTopTie - rodThicknessPx * 0.22}
                                        x2={pxTubeEnd}
                                        y2={yTopTie - rodThicknessPx * 0.22}
                                        stroke="#cbd5e1"
                                        strokeWidth={Math.max(0.8, rodThicknessPx * 0.25)}
                                        opacity="0.8"
                                    />

                                    {/* Rear Top Hardened Washer (ISO 7089) */}
                                    <rect
                                        x={pxRearCapEnd - washerThkPx}
                                        y={yTopTie - washerDiaPx / 2}
                                        width={washerThkPx}
                                        height={washerDiaPx}
                                        fill="#475569"
                                        stroke="#334155"
                                        strokeWidth="0.8"
                                    />
                                    {/* Rear Top Heavy Hex Nut (ISO 4032) */}
                                    <rect
                                        x={xRearNutOuter}
                                        y={yTopTie - nutDiaPx / 2}
                                        width={nutLenPx}
                                        height={nutDiaPx}
                                        fill="#94a3b8"
                                        stroke="#334155"
                                        strokeWidth="1"
                                        rx="1"
                                    />
                                    {/* Hex Nut Chamfer & Flank Line */}
                                    <line x1={xRearNutOuter} y1={yTopTie - nutDiaPx * 0.28} x2={xRearNutOuter + nutLenPx} y2={yTopTie - nutDiaPx * 0.28} stroke="#475569" strokeWidth="0.8" />
                                    <line x1={xRearNutOuter} y1={yTopTie + nutDiaPx * 0.28} x2={xRearNutOuter + nutLenPx} y2={yTopTie + nutDiaPx * 0.28} stroke="#475569" strokeWidth="0.8" />

                                    {/* Front Top Hardened Washer (ISO 7089) */}
                                    <rect
                                        x={pxTubeEnd}
                                        y={yTopTie - washerDiaPx / 2}
                                        width={washerThkPx}
                                        height={washerDiaPx}
                                        fill="#475569"
                                        stroke="#334155"
                                        strokeWidth="0.8"
                                    />
                                    {/* Front Top Heavy Hex Nut (ISO 4032) */}
                                    <rect
                                        x={pxTubeEnd + washerThkPx}
                                        y={yTopTie - nutDiaPx / 2}
                                        width={nutLenPx}
                                        height={nutDiaPx}
                                        fill="#94a3b8"
                                        stroke="#334155"
                                        strokeWidth="1"
                                        rx="1"
                                    />
                                    <line x1={pxTubeEnd + washerThkPx} y1={yTopTie - nutDiaPx * 0.28} x2={xFrontNutOuter} y2={yTopTie - nutDiaPx * 0.28} stroke="#475569" strokeWidth="0.8" />
                                    <line x1={pxTubeEnd + washerThkPx} y1={yTopTie + nutDiaPx * 0.28} x2={xFrontNutOuter} y2={yTopTie + nutDiaPx * 0.28} stroke="#475569" strokeWidth="0.8" />

                                    {/* ── BOTTOM TIE-ROD BAR & CLAMPING ELEMENTS ── */}
                                    {/* Main Continuous Tie-Rod Bar */}
                                    <line
                                        x1={xRearStudTip}
                                        y1={yBotTie}
                                        x2={xFrontStudTip}
                                        y2={yBotTie}
                                        stroke="#64748b"
                                        strokeWidth={rodThicknessPx}
                                        strokeLinecap="round"
                                    />
                                    {/* Specular Highlight on Bar */}
                                    <line
                                        x1={pxRearCapEnd}
                                        y1={yBotTie - rodThicknessPx * 0.22}
                                        x2={pxTubeEnd}
                                        y2={yBotTie - rodThicknessPx * 0.22}
                                        stroke="#cbd5e1"
                                        strokeWidth={Math.max(0.8, rodThicknessPx * 0.25)}
                                        opacity="0.8"
                                    />

                                    {/* Rear Bottom Hardened Washer */}
                                    <rect
                                        x={pxRearCapEnd - washerThkPx}
                                        y={yBotTie - washerDiaPx / 2}
                                        width={washerThkPx}
                                        height={washerDiaPx}
                                        fill="#475569"
                                        stroke="#334155"
                                        strokeWidth="0.8"
                                    />
                                    {/* Rear Bottom Heavy Hex Nut */}
                                    <rect
                                        x={xRearNutOuter}
                                        y={yBotTie - nutDiaPx / 2}
                                        width={nutLenPx}
                                        height={nutDiaPx}
                                        fill="#94a3b8"
                                        stroke="#334155"
                                        strokeWidth="1"
                                        rx="1"
                                    />
                                    <line x1={xRearNutOuter} y1={yBotTie - nutDiaPx * 0.28} x2={xRearNutOuter + nutLenPx} y2={yBotTie - nutDiaPx * 0.28} stroke="#475569" strokeWidth="0.8" />
                                    <line x1={xRearNutOuter} y1={yBotTie + nutDiaPx * 0.28} x2={xRearNutOuter + nutLenPx} y2={yBotTie + nutDiaPx * 0.28} stroke="#475569" strokeWidth="0.8" />

                                    {/* Front Bottom Hardened Washer */}
                                    <rect
                                        x={pxTubeEnd}
                                        y={yBotTie - washerDiaPx / 2}
                                        width={washerThkPx}
                                        height={washerDiaPx}
                                        fill="#475569"
                                        stroke="#334155"
                                        strokeWidth="0.8"
                                    />
                                    {/* Front Bottom Heavy Hex Nut */}
                                    <rect
                                        x={pxTubeEnd + washerThkPx}
                                        y={yBotTie - nutDiaPx / 2}
                                        width={nutLenPx}
                                        height={nutDiaPx}
                                        fill="#94a3b8"
                                        stroke="#334155"
                                        strokeWidth="1"
                                        rx="1"
                                    />
                                    <line x1={pxTubeEnd + washerThkPx} y1={yBotTie - nutDiaPx * 0.28} x2={xFrontNutOuter} y2={yBotTie - nutDiaPx * 0.28} stroke="#475569" strokeWidth="0.8" />
                                    <line x1={pxTubeEnd + washerThkPx} y1={yBotTie + nutDiaPx * 0.28} x2={xFrontNutOuter} y2={yBotTie + nutDiaPx * 0.28} stroke="#475569" strokeWidth="0.8" />

                                    {/* ── EXTENDED TIE-ROD THREADS (ISO MX1, MX2, MX3) ── */}
                                    {/* Front Extended Stud Threads (ISO MX1 / MX3) */}
                                    {isFrontExtended && (
                                        <g>
                                            {/* Thread Root Lines */}
                                            <line x1={xFrontNutOuter} y1={yTopTie - rodThicknessPx * 0.42} x2={xFrontStudTip - toDeltaPx(3)} y2={yTopTie - rodThicknessPx * 0.42} stroke="#7aa2ff" strokeWidth="0.8" strokeDasharray="3,1" />
                                            <line x1={xFrontNutOuter} y1={yTopTie + rodThicknessPx * 0.42} x2={xFrontStudTip - toDeltaPx(3)} y2={yTopTie + rodThicknessPx * 0.42} stroke="#7aa2ff" strokeWidth="0.8" strokeDasharray="3,1" />
                                            <line x1={xFrontNutOuter} y1={yBotTie - rodThicknessPx * 0.42} x2={xFrontStudTip - toDeltaPx(3)} y2={yBotTie - rodThicknessPx * 0.42} stroke="#7aa2ff" strokeWidth="0.8" strokeDasharray="3,1" />
                                            <line x1={xFrontNutOuter} y1={yBotTie + rodThicknessPx * 0.42} x2={xFrontStudTip - toDeltaPx(3)} y2={yBotTie + rodThicknessPx * 0.42} stroke="#7aa2ff" strokeWidth="0.8" strokeDasharray="3,1" />

                                            {/* 45° Lead-in Chamfer Tips */}
                                            <polygon points={`${xFrontStudTip},${yTopTie} ${xFrontStudTip - toDeltaPx(3)},${yTopTie - rodThicknessPx * 0.5} ${xFrontStudTip - toDeltaPx(3)},${yTopTie + rodThicknessPx * 0.5}`} fill="#64748b" />
                                            <polygon points={`${xFrontStudTip},${yBotTie} ${xFrontStudTip - toDeltaPx(3)},${yBotTie - rodThicknessPx * 0.5} ${xFrontStudTip - toDeltaPx(3)},${yBotTie + rodThicknessPx * 0.5}`} fill="#64748b" />

                                            {showLabels && (
                                                <g>
                                                    <line x1={xFrontStudTip + 1} y1={yBotTie} x2={xFrontStudTip + 10} y2={yBotTie} stroke="#7aa2ff" strokeWidth="0.8" />
                                                    <text x={xFrontStudTip + 12} y={yBotTie + 2.5} textAnchor="start" fontSize="7.5" fill="#7aa2ff" fontWeight="bold">
                                                        4x M{tieDiaMm} ({activeMount === 'extended_tie_rods_mx3' ? 'ISO MX3 (Front)' : 'ISO MX1'})
                                                    </text>
                                                </g>
                                            )}
                                        </g>
                                    )}

                                    {/* Rear Extended Stud Threads (ISO MX2 / MX3) */}
                                    {isRearExtended && (
                                        <g>
                                            {/* Thread Root Lines */}
                                            <line x1={xRearNutOuter} y1={yTopTie - rodThicknessPx * 0.42} x2={xRearStudTip + toDeltaPx(3)} y2={yTopTie - rodThicknessPx * 0.42} stroke="#7aa2ff" strokeWidth="0.8" strokeDasharray="3,1" />
                                            <line x1={xRearNutOuter} y1={yTopTie + rodThicknessPx * 0.42} x2={xRearStudTip + toDeltaPx(3)} y2={yTopTie + rodThicknessPx * 0.42} stroke="#7aa2ff" strokeWidth="0.8" strokeDasharray="3,1" />
                                            <line x1={xRearNutOuter} y1={yBotTie - rodThicknessPx * 0.42} x2={xRearStudTip + toDeltaPx(3)} y2={yBotTie - rodThicknessPx * 0.42} stroke="#7aa2ff" strokeWidth="0.8" strokeDasharray="3,1" />
                                            <line x1={xRearNutOuter} y1={yBotTie + rodThicknessPx * 0.42} x2={xRearStudTip + toDeltaPx(3)} y2={yBotTie + rodThicknessPx * 0.42} stroke="#7aa2ff" strokeWidth="0.8" strokeDasharray="3,1" />

                                            {/* 45° Lead-in Chamfer Tips */}
                                            <polygon points={`${xRearStudTip},${yTopTie} ${xRearStudTip + toDeltaPx(3)},${yTopTie - rodThicknessPx * 0.5} ${xRearStudTip + toDeltaPx(3)},${yTopTie + rodThicknessPx * 0.5}`} fill="#64748b" />
                                            <polygon points={`${xRearStudTip},${yBotTie} ${xRearStudTip + toDeltaPx(3)},${yBotTie - rodThicknessPx * 0.5} ${xRearStudTip + toDeltaPx(3)},${yBotTie + rodThicknessPx * 0.5}`} fill="#64748b" />

                                            {showLabels && (
                                                <g>
                                                    <line x1={xRearStudTip - 10} y1={yTopTie} x2={xRearStudTip - 1} y2={yTopTie} stroke="#7aa2ff" strokeWidth="0.8" />
                                                    <text x={xRearStudTip - 12} y={yTopTie + 2.5} textAnchor="end" fontSize="7.5" fill="#7aa2ff" fontWeight="bold">
                                                        4x M{tieDiaMm} ({activeMount === 'extended_tie_rods_mx3' ? 'ISO MX3 (Rear)' : 'ISO MX2'})
                                                    </text>
                                                </g>
                                            )}
                                        </g>
                                    )}

                                    {/* Technical Fastener Details Callout (VDI 2230 / ISO 898-1) */}
                                    {showJointDetails && (
                                        <g transform={`translate(${pxRearCapEnd - 25}, ${yBotTie + 22})`}>
                                            <line x1={0} y1={0} x2={14} y2={-14} stroke="#7aa2ff" strokeWidth="0.8" />
                                            <rect x={-124} y={-8} width={124} height={16} fill="#0c1016" stroke="#7aa2ff" strokeWidth="0.8" rx="2" />
                                            <text x={-62} y={3.5} textAnchor="middle" fontSize="7" fill="#7aa2ff" fontWeight="bold">
                                                4x M{tieDiaMm}-10.9 · M_A={torqueVal}Nm (ISO 6020-2)
                                            </text>
                                        </g>
                                    )}
                                </g>
                            );
                        })()}

                        {/* ─────────────────────────────────────────────────────────────
                            ISO 128 TECHNICAL CENTERLINE (EKSEN ÇİZGİSİ)
                            Dash-dot-dash pattern extending symmetrically past boundaries
                            ───────────────────────────────────────────────────────────── */}
                        <line
                            x1={pxRearCapEnd - toDeltaPx(40)}
                            y1={centerY}
                            x2={pxRodEnd + toDeltaPx(50)}
                            y2={centerY}
                            stroke="#3ad0e6"
                            strokeWidth="1.1"
                            strokeDasharray="22,4,4,4"
                            opacity="0.8"
                        />

                        {/* ─────────────────────────────────────────────────────────────
                            PART NUMBER BALLOONS & LEADER LINES (PARÇA ETİKETLERİ - ISO 6433)
                            Clean two-tier layout above the cylinder prevents any overlap with dimensions
                            ───────────────────────────────────────────────────────────── */}
                        {showLabels && (() => {
                            const topTier1Y = Math.min(yTopOD, hasTieRods ? yTopSquare : yTopOD, yTopBore - 22) - 22;
                            const topTier2Y = topTier1Y - 26;
                            const topTier3Y = topTier2Y - 26;

                            const collarLenPx = (activeBarrel === 'welded_cap_threaded_gland') ? toDeltaPx(8) : 0;
                            const pxGlandFront = pxTubeEnd + collarLenPx;
                            const pxWiperSeat = pxGlandFront - toDeltaPx(7);

                            // Dynamic chamber clear space for Honed Tube (ISO 6433 BOM #1)
                            const pxChamberAStart = pxTubeStart;
                            const pxChamberAEnd = pxPistonLeft - 22;
                            const chamberAW = pxChamberAEnd - pxChamberAStart;

                            const pxChamberBStart = pxPistonLeft + toDeltaPx(pistonLen) + 24;
                            const pxChamberBEnd = pxGlandStart - toDeltaPx(28);
                            const chamberBW = pxChamberBEnd - pxChamberBStart;

                            let tubeBalloonX = toPxX(strokeS * 0.45);
                            if (chamberBW >= 60) {
                                // Plentiful open space in Chamber B between piston and front gland
                                tubeBalloonX = pxChamberBStart + chamberBW * 0.45;
                            } else if (chamberAW >= 60) {
                                // Cylinder extended past 75% — plentiful open space in Chamber A
                                tubeBalloonX = pxChamberAStart + chamberAW * 0.55;
                            }

                            // Clean, standard ISO 6433 Balloon Layout
                            const rawBalloons = [
                                // 2. Rear Mounting Cap (Far left stationary, safely clear of Port A)
                                { no: 2, tx: pxRearCapEnd - toDeltaPx(6), ty: yTopOD, bx: pxRearCapEnd - 48, by: topTier1Y, color: '#3ad0e6' },
                                
                                // 1. Honed Cylinder Tube (In open chamber, 100% collision-free from moving piston cluster)
                                { no: 1, tx: tubeBalloonX, ty: yTopOD, bx: tubeBalloonX, by: topTier2Y, color: '#3ad0e6' },

                                // Piston Moving Group (4-badge alternating Tier 2 / Tier 1 array)
                                // 9. Piston-to-Rod Connection / Lock Nut
                                { no: 9, tx: pxPistonLeft + toDeltaPx(12), ty: toPxY(rodNeckDia / 2), bx: pxPistonLeft - 22, by: topTier2Y, color: '#3ad0e6' },
                                // 3. Piston Body
                                { no: 3, tx: pxPistonLeft + toDeltaPx(pistonLen * 0.28), ty: yTopBore, bx: pxPistonLeft + 4, by: topTier1Y, color: '#3ad0e6' },
                                // 6. Piston Double-Acting Seal (Kastaş K16/K40)
                                { no: 6, tx: pxPistonLeft + toDeltaPx(pistonLen * 0.52), ty: yTopBore, bx: pxPistonLeft + 30, by: topTier2Y, color: '#e6b84a' },
                                // 11. Piston Guide Rings (Kastaş K73)
                                { no: 11, tx: pxPistonLeft + toDeltaPx(pistonLen * 0.8), ty: yTopBore, bx: pxPistonLeft + 56, by: topTier1Y, color: '#10b981' },

                                // Front Gland Stationary Group (Safely offset past Port B text)
                                // 10. Tube-to-Gland Static O-Ring (ISO 3601)
                                { no: 10, tx: pxOring, ty: yTopBore, bx: Math.max(pxPortB + 54, pxOring + 8), by: topTier2Y, color: '#3ad0e6' },
                                // 7. Primary Rod Seal (Kastaş K33/K35)
                                { no: 7, tx: pxRodSeal, ty: yTopRod, bx: Math.max(pxPortB + 82, pxRodSeal + 8), by: topTier1Y, color: '#f59e0b' },
                                // 4. Front Rod Gland Body (Inside gland metal)
                                { no: 4, tx: pxGuide, ty: (yTopOD + yTopRod) / 2, bx: Math.max(pxPortB + 110, pxGuide + 16), by: topTier2Y, color: '#3ad0e6' },
                                // 8. Wiper / Scraper Seal (Kastaş K01/K27)
                                { no: 8, tx: pxWiperSeat + toDeltaPx(2), ty: yTopRod, bx: Math.max(pxPortB + 138, pxGlandFront + 16), by: topTier1Y, color: '#e85d5d' },
                                // 5. Chrome Piston Rod
                                { no: 5, tx: pxGlandFront + Math.max(35, toDeltaPx(rodExtRetracted * 0.5)), ty: yTopRod, bx: Math.max(pxPortB + 166, pxGlandFront + Math.max(40, toDeltaPx(rodExtRetracted * 0.5)) + 18), by: topTier2Y, color: '#3ad0e6' },
                            ];

                            // Anti-Clash Iterative Repulsion Pass:
                            // 1. Same tier: minGap >= 26px (prevents circle badge collision)
                            // 2. Different tier: minGap >= 18px (prevents vertical stacking / leader line overlap)
                            const balloons = rawBalloons.map(b => ({ ...b }));
                            for (let pass = 0; pass < 8; pass++) {
                                for (let i = 0; i < balloons.length; i++) {
                                    for (let j = 0; j < balloons.length; j++) {
                                        if (i === j) continue;
                                        const sameTier = Math.abs(balloons[i].by - balloons[j].by) < 14;
                                        const minGap = sameTier ? 26 : 18;
                                        const dx = balloons[j].bx - balloons[i].bx;
                                        if (Math.abs(dx) < minGap) {
                                            const shift = (minGap - Math.abs(dx)) / 2;
                                            if (dx >= 0) {
                                                balloons[i].bx -= shift;
                                                balloons[j].bx += shift;
                                            } else {
                                                balloons[i].bx += shift;
                                                balloons[j].bx += shift;
                                            }
                                        }
                                    }
                                }
                            }

                            return (
                                <g>
                                    {balloons.map((b) => (
                                        <g key={b.no} onClick={(e) => { e.stopPropagation(); onSelectPart?.(b.no); }} className="cursor-pointer">
                                            {/* Target anchor dot */}
                                            <circle cx={b.tx} cy={b.ty} r="2" fill={b.color} />
                                            {/* Leader line */}
                                            <line x1={b.tx} y1={b.ty} x2={b.bx} y2={b.by} stroke={b.color} strokeWidth="0.85" opacity="0.85" />
                                            {/* Circular balloon badge */}
                                            <circle
                                                cx={b.bx}
                                                cy={b.by}
                                                r="9.5"
                                                fill="#080e18"
                                                stroke={selectedPartNumber === b.no ? '#ffffff' : b.color}
                                                strokeWidth={selectedPartNumber === b.no ? '2' : '1.3'}
                                            />
                                            <text
                                                x={b.bx}
                                                y={b.by + 3.5}
                                                textAnchor="middle"
                                                fontSize="9"
                                                fontWeight="bold"
                                                fill={selectedPartNumber === b.no ? '#ffffff' : b.color}
                                            >
                                                {b.no}
                                            </text>
                                        </g>
                                    ))}
                                </g>
                            );
                        })()}

                        {/* ─────────────────────────────────────────────────────────────
                            ISO 128 PRECISION CAD DIMENSIONING CHAIN (ÖLÇÜLENDİRME)
                            Guaranteed non-clipping text boxes and non-colliding leader lines
                            ───────────────────────────────────────────────────────────── */}
                        {showDimensions && (
                            <g opacity={0.95}>
                                {/* Diameter: Bore Ø boreD H8 */}
                                <g transform={`translate(${pxTubeStart + toDeltaPx(50)}, ${centerY})`}>
                                    <line x1={0} y1={-toDeltaPx(rBore)} x2={0} y2={toDeltaPx(rBore)} stroke="#7aa2ff" strokeWidth="1.1" markerStart="url(#masterCadArrowStart)" markerEnd="url(#masterCadArrowEnd)" />
                                    <rect x={4} y={-8} width={50} height={16} rx={3} fill="#070a0f" stroke="#7aa2ff" strokeWidth="0.8" opacity="0.95" />
                                    <text x={7} y={3.5} fontSize="8.5" fill="#7aa2ff" fontWeight="bold">Ø{boreD} H8</text>
                                </g>

                                {/* Diameter: Rod Ø rodD f7 (Placed on exposed rod shank midpoint to avoid rod-end collisions) */}
                                {(() => {
                                    const pxRodMid = Math.max(pxTubeEnd + 25, (pxTubeEnd + pxRodEnd) / 2);
                                    return (
                                        <g transform={`translate(${pxRodMid}, ${centerY})`}>
                                            <line x1={0} y1={-toDeltaPx(rRod)} x2={0} y2={toDeltaPx(rRod)} stroke="#7aa2ff" strokeWidth="1.1" markerStart="url(#masterCadArrowStart)" markerEnd="url(#masterCadArrowEnd)" />
                                            <rect x={4} y={-8} width={48} height={16} rx={3} fill="#070a0f" stroke="#7aa2ff" strokeWidth="0.8" opacity="0.95" />
                                            <text x={7} y={3.5} fontSize="8.5" fill="#7aa2ff" fontWeight="bold">Ø{rodD} f7</text>
                                        </g>
                                    );
                                })()}

                                {/* Diameter: Tube OD Ø tubeOD */}
                                <g transform={`translate(${pxTubeStart + toDeltaPx(18)}, ${centerY})`}>
                                    <line x1={0} y1={-toDeltaPx(rOD)} x2={0} y2={toDeltaPx(rOD)} stroke="#556d8a" strokeWidth="0.9" markerStart="url(#masterCadArrowStart)" markerEnd="url(#masterCadArrowEnd)" />
                                    <rect x={-44} y={-8} width={40} height={16} rx={3} fill="#070a0f" stroke="#556d8a" strokeWidth="0.8" opacity="0.95" />
                                    <text x={-41} y={3.5} fontSize="8" fill="#8b96a4">Ø{tubeOD}</text>
                                </g>

                                {/* Dimension: STROKE S (Strok Boyu) */}
                                {(() => {
                                    const footLugExtraMm = Math.max(45, (footMountOffsetMm || result?.footOffsetMm || 60) - (tubeOD / 2) + 20);
                                    const bottomFeaturesMaxY = Math.max(
                                        yBotOD,
                                        hasTieRods ? yBotTie + toDeltaPx(tieDiaMm * 0.8) : yBotOD,
                                        hasTrunnion ? toPxY(tubeOD / 2 + trunnionCollarThickness + trunnionPinLen) : yBotOD,
                                        (activeMount === 'side_lugs_ms2' || activeMount === 'foot_mount') ? yBotOD + toDeltaPx(footLugExtraMm) : yBotOD
                                    );
                                    const dimY = bottomFeaturesMaxY + 34;
                                    const x1 = toPxX(0);
                                    const x2 = toPxX(strokeS);
                                    const strokeLabel = `${t12(language, 'STROKE', 'STROK')} = ${strokeS} mm`;
                                    const boxW = Math.max(82, strokeLabel.length * 7 + 16);

                                    return (
                                        <g>
                                            <line x1={x1} y1={yBotOD + 4} x2={x1} y2={dimY + 6} stroke="#24344d" strokeWidth="0.8" />
                                            <line x1={x2} y1={yBotOD + 4} x2={x2} y2={dimY + 6} stroke="#24344d" strokeWidth="0.8" />
                                            <line x1={x1} y1={dimY} x2={x2} y2={dimY} stroke="#3ad0e6" strokeWidth="1.2" markerStart="url(#masterCyanArrowStart)" markerEnd="url(#masterCyanArrowEnd)" />
                                            <rect x={(x1 + x2) / 2 - boxW / 2} y={dimY - 8} width={boxW} height={16} rx={3} fill="#05070a" stroke="#3ad0e6" strokeWidth="0.8" />
                                            <text x={(x1 + x2) / 2} y={dimY + 3.5} textAnchor="middle" fontSize="8.5" fill="#3ad0e6" fontWeight="bold">
                                                {strokeLabel}
                                            </text>
                                        </g>
                                    );
                                })()}

                                {/* Dimension: CLOSED LENGTH L (Kapalı Boy) */}
                                {result && (() => {
                                    const footLugExtraMm = Math.max(45, (footMountOffsetMm || result?.footOffsetMm || 60) - (tubeOD / 2) + 20);
                                    const bottomFeaturesMaxY = Math.max(
                                        yBotOD,
                                        hasTieRods ? yBotTie + toDeltaPx(tieDiaMm * 0.8) : yBotOD,
                                        hasTrunnion ? toPxY(tubeOD / 2 + trunnionCollarThickness + trunnionPinLen) : yBotOD,
                                        (activeMount === 'side_lugs_ms2' || activeMount === 'foot_mount') ? yBotOD + toDeltaPx(footLugExtraMm) : yBotOD
                                    );
                                    const dimY = bottomFeaturesMaxY + 62;
                                    const x1 = hasRearFlange ? pxRearCapEnd - toDeltaPx(flangeThickness) : pxRearCapEnd;
                                    const collarLenPx = (activeBarrel === 'welded_cap_threaded_gland') ? toDeltaPx(8) : 0;
                                    const pxGlandFront = pxTubeEnd + collarLenPx;
                                    const x2 = pxGlandFront + toDeltaPx(rodExtRetracted);
                                    const closedLabel = `${t12(language, 'CLOSED LEN', 'KAPALI BOY')} = ${result.closedLengthMm} mm`;
                                    const boxW = Math.max(98, closedLabel.length * 7 + 16);

                                    return (
                                        <g>
                                            <line x1={x1} y1={yBotOD + 6} x2={x1} y2={dimY + 6} stroke="#1e2c3d" strokeWidth="0.8" />
                                            <line x1={x2} y1={yBotOD + 6} x2={x2} y2={dimY + 6} stroke="#1e2c3d" strokeWidth="0.8" />
                                            <line x1={x1} y1={dimY} x2={x2} y2={dimY} stroke="#7aa2ff" strokeWidth="1.2" markerStart="url(#masterCadArrowStart)" markerEnd="url(#masterCadArrowEnd)" />
                                            <rect x={(x1 + x2) / 2 - boxW / 2} y={dimY - 8} width={boxW} height={16} rx={3} fill="#05070a" stroke="#7aa2ff" strokeWidth="0.8" />
                                            <text x={(x1 + x2) / 2} y={dimY + 3.5} textAnchor="middle" fontSize="8.5" fill="#7aa2ff" fontWeight="bold">
                                                {closedLabel}
                                            </text>
                                        </g>
                                    );
                                })()}
                            </g>
                        )}
                    </g>
                </svg>
            </div>
        </div>
    );
}
