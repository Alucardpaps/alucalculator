"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Play, Pause, RotateCcw, Activity, ShieldAlert, Thermometer, Layers } from "lucide-react";
import { ShapeType } from "@/utils/sectionProperties";

export type WeldJointType2D = 'fillet' | 'butt' | 'vgroove' | 'tee' | 'lap' | 'corner';

interface MaterialProfile {
    color: string;
    name: string;
    shape: ShapeType;
    dimensions?: {
        width?: number;
        height?: number;
        thickness?: number;
        diameter?: number;
        wallThickness?: number;
        flangeWidth?: number;
        flangeThickness?: number;
        webThickness?: number;
        legWidth?: number;
        legThickness?: number;
    };
}

interface WeldingVisualization2DProps {
    jointType: WeldJointType2D;
    legSize?: number;
    thickness?: number;
    grooveAngle?: number;
    length?: number;
    material1?: MaterialProfile;
    material2?: MaterialProfile;
    is2D?: boolean; // Kept for compatibility with parent components
}

export function WeldingVisualization2D({
    jointType = 'fillet',
    legSize = 6,
    thickness = 12,
    grooveAngle = 60,
    length = 200,
    material1,
    material2,
}: WeldingVisualization2DProps) {
    const [activeTab, setActiveTab] = useState<'blueprint' | 'simulation'>('blueprint');
    
    // Simulation state
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const [sparks, setSparks] = useState<{ id: number; cx: number; cy: number; vx: number; vy: number; size: number; alpha: number }[]>([]);
    
    const requestRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);

    // Normalize inputs
    const mat1 = useMemo(() => ({
        color: material1?.color || "#94a3b8",
        name: material1?.name || "Steel 1",
        shape: material1?.shape || 'sheet',
        dimensions: material1?.dimensions || { width: 60, height: thickness, thickness }
    }), [material1, thickness]);

    const mat2 = useMemo(() => ({
        color: material2?.color || "#64748b",
        name: material2?.name || "Steel 2",
        shape: material2?.shape || 'sheet',
        dimensions: material2?.dimensions || { width: 60, height: thickness, thickness }
    }), [material2, thickness]);

    // Dimensions Scale Factor (pixels per mm)
    const scale = 3;
    const padding = 50;

    // SVG Canvas Box (600x400)
    const viewWidth = 600;
    const viewHeight = 400;
    const cx = viewWidth / 2;
    const cy = viewHeight / 2;

    // 1. HELPERS FOR BLUEPRINT GEOMETRY DRAWING
    const drawProfile2D = (shape: ShapeType, dims: any, scaleFactor: number, isVertical = false) => {
        const w = (dims.width || 60) * scaleFactor;
        const h = (shape === 'sheet' ? (dims.thickness || thickness) : (dims.height || 60)) * scaleFactor;
        const t = (dims.thickness || 6) * scaleFactor;
        const wt = (dims.wallThickness || 4) * scaleFactor;
        const dia = (dims.diameter || 50) * scaleFactor;
        
        // Structural dimension conversions
        const hBeam = (dims.height || 80) * scaleFactor;
        const wFlange = (dims.flangeWidth || 50) * scaleFactor;
        const tFlange = (dims.flangeThickness || 8) * scaleFactor;
        const tWeb = (dims.webThickness || 6) * scaleFactor;
        const wLeg = (dims.legWidth || 50) * scaleFactor;
        const tLeg = (dims.legThickness || 6) * scaleFactor;

        // Returns { path: string, holePath?: string }
        switch (shape) {
            case 'box':
                return {
                    outer: `M ${-w/2} ${-h/2} L ${w/2} ${-h/2} L ${w/2} ${h/2} L ${-w/2} ${h/2} Z`,
                    inner: `M ${-(w - 2 * wt)/2} ${-(h - 2 * wt)/2} L ${-(w - 2 * wt)/2} ${(h - 2 * wt)/2} L ${(w - 2 * wt)/2} ${(h - 2 * wt)/2} L ${(w - 2 * wt)/2} ${-(h - 2 * wt)/2} Z`
                };
            case 'pipe':
                // Using SVG nested path for double circles
                return {
                    outer: `M 0 ${-dia/2} A ${dia/2} ${dia/2} 0 1 0 0.01 ${-dia/2} Z`,
                    inner: `M 0 ${-(dia/2 - wt)} A ${(dia/2 - wt)} ${(dia/2 - wt)} 0 1 1 -0.01 ${-(dia/2 - wt)} Z`
                };
            case 'bar':
                return {
                    outer: `M 0 ${-dia/2} A ${dia/2} ${dia/2} 0 1 0 0.01 ${-dia/2} Z`
                };
            case 'sheet':
                return {
                    outer: `M ${-w/2} ${-h/2} L ${w/2} ${-h/2} L ${w/2} ${h/2} L ${-w/2} ${h/2} Z`
                };
            case 'ibeam':
                return {
                    outer: `M ${-wFlange/2} ${-hBeam/2} 
                            L ${wFlange/2} ${-hBeam/2} 
                            L ${wFlange/2} ${-hBeam/2 + tFlange} 
                            L ${tWeb/2} ${-hBeam/2 + tFlange} 
                            L ${tWeb/2} ${hBeam/2 - tFlange} 
                            L ${wFlange/2} ${hBeam/2 - tFlange} 
                            L ${wFlange/2} ${hBeam/2} 
                            L ${-wFlange/2} ${hBeam/2} 
                            L ${-wFlange/2} ${hBeam/2 - tFlange} 
                            L ${-tWeb/2} ${hBeam/2 - tFlange} 
                            L ${-tWeb/2} ${-hBeam/2 + tFlange} 
                            L ${-wFlange/2} ${-hBeam/2 + tFlange} Z`
                };
            case 'channel':
                return {
                    outer: `M ${-wFlange/2} ${-hBeam/2} 
                            L ${wFlange/2} ${-hBeam/2} 
                            L ${wFlange/2} ${-hBeam/2 + tFlange} 
                            L ${-wFlange/2 + tWeb} ${-hBeam/2 + tFlange} 
                            L ${-wFlange/2 + tWeb} ${hBeam/2 - tFlange} 
                            L ${wFlange/2} ${hBeam/2 - tFlange} 
                            L ${wFlange/2} ${hBeam/2} 
                            L ${-wFlange/2} ${hBeam/2} Z`
                };
            case 'angle':
                return {
                    outer: `M ${-wLeg/2} ${wLeg/2} 
                            L ${wLeg/2} ${wLeg/2} 
                            L ${wLeg/2} ${wLeg/2 - tLeg} 
                            L ${-wLeg/2 + tLeg} ${wLeg/2 - tLeg} 
                            L ${-wLeg/2 + tLeg} ${-wLeg/2} 
                            L ${-wLeg/2} ${-wLeg/2} Z`
                };
            case 'tee':
                return {
                    outer: `M ${-wFlange/2} ${-hBeam/2} 
                            L ${wFlange/2} ${-hBeam/2} 
                            L ${wFlange/2} ${-hBeam/2 + tFlange} 
                            L ${tWeb/2} ${-hBeam/2 + tFlange} 
                            L ${tWeb/2} ${hBeam/2} 
                            L ${-tWeb/2} ${hBeam/2} 
                            L -${tWeb/2} ${-hBeam/2 + tFlange} 
                            L ${-wFlange/2} ${-hBeam/2 + tFlange} Z`
                };
            default:
                return { outer: `M -30 -10 L 30 -10 L 30 10 L -30 10 Z` };
        }
    };

    // Calculate dimensions for positioning elements in cross-section
    const geom = useMemo(() => {
        const t1 = (mat1.dimensions.thickness || thickness) * scale;
        const t2 = (mat2.dimensions.thickness || thickness) * scale;
        const a = legSize * scale;

        // Heights for profiles in cross-section bounding boxes
        const h1 = mat1.shape === 'sheet' ? t1 : 50 * scale;
        const h2 = mat2.shape === 'sheet' ? t2 : 50 * scale;
        const w1 = (mat1.dimensions.width || 60) * scale;
        const w2 = (mat2.dimensions.width || 60) * scale;

        return { t1, t2, a, h1, h2, w1, w2 };
    }, [mat1, mat2, legSize, thickness]);

    // Active weld speed variables
    const cycleDuration = useMemo(() => {
        // base speed on travel speed: mm per min
        // length in mm. Duration = length / (speed / 60)
        // Clamp duration between 3s and 15s for preview aesthetics
        return 8; // fixed aesthetic default
    }, []);

    // 2. SIMULATION TICK ENGINE
    useEffect(() => {
        if (!isPlaying || activeTab !== 'simulation') {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            return;
        }

        const animate = (time: number) => {
            if (lastTimeRef.current === null) lastTimeRef.current = time;
            const delta = (time - lastTimeRef.current) / 1000;
            lastTimeRef.current = time;

            setProgress((prev) => {
                const next = prev + (delta / cycleDuration);
                return next >= 1 ? 0 : next;
            });

            // Spark generation at active arc tip
            setSparks((prevSparks) => {
                // Decay existing sparks
                const decayed = prevSparks
                    .map((s) => ({
                        ...s,
                        cx: s.cx + s.vx,
                        cy: s.cy + s.vy,
                        vy: s.vy + 0.1, // gravity
                        alpha: s.alpha - 0.03,
                        size: s.size * 0.95,
                    }))
                    .filter((s) => s.alpha > 0);

                // Add new sparks
                if (Math.random() < 0.6) {
                    const arcX = padding + progress * (viewWidth - 2 * padding);
                    const arcY = cy - 2;
                    const angle = (Math.random() * Math.PI * 1.6) - Math.PI * 0.8;
                    const speed = 2 + Math.random() * 4;
                    decayed.push({
                        id: Math.random(),
                        cx: arcX,
                        cy: arcY,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 1, // push upward initially
                        size: 1.5 + Math.random() * 2.5,
                        alpha: 1.0,
                    });
                }
                return decayed.slice(-40); // Cap sparks
            });

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, progress, cycleDuration, activeTab]);

    const handleRestart = () => {
        setProgress(0);
        setSparks([]);
        setIsPlaying(true);
        lastTimeRef.current = null;
    };

    // Render blueprint shapes relative to joint types
    const renderJointBlueprint = () => {
        const { t1, t2, a, h1, h2, w1, w2 } = geom;
        const strokeColor = "#1e293b";

        switch (jointType) {
            case 'fillet':
            case 'tee': {
                // Mat 1 (horizontal, lying flat at bottom)
                // Center Y of mat 1 is cy + h1/2. Top edge at cy
                const path1 = drawProfile2D(mat1.shape, mat1.dimensions, scale);
                const path2 = drawProfile2D(mat2.shape, mat2.dimensions, scale);
                
                // Mat 2 is vertical, bottom edge sits at cy. Center Y of mat 2 is cy - h2/2
                // We rotate Mat 2 if it's a sheet/plate to represent it standing
                const transform2 = mat2.shape === 'sheet' 
                    ? `translate(${cx}, ${cy - w2/2}) rotate(90)`
                    : `translate(${cx}, ${cy - h2/2})`;
                
                // The vertical stem width at the junction (its thickness)
                const thicknessOffset = mat2.shape === 'sheet' ? t2 : (mat2.dimensions.width || 40) * scale;
                const rightWeldX = cx + thicknessOffset / 2;
                const leftWeldX = cx - thicknessOffset / 2;

                return (
                    <g>
                        {/* HAZ Glowing Area */}
                        <ellipse cx={cx} cy={cy} rx={a * 1.5} ry={a * 1.5} fill="url(#hazGradient)" />

                        {/* Material 1 */}
                        <g transform={`translate(${cx}, ${cy + h1/2})`}>
                            <path d={path1.outer} fill={mat1.color} stroke={strokeColor} strokeWidth="1.5" />
                            {path1.inner && <path d={path1.inner} fill="#020408" stroke={strokeColor} strokeWidth="1" />}
                        </g>

                        {/* Material 2 */}
                        <g transform={transform2}>
                            <path d={path2.outer} fill={mat2.color} stroke={strokeColor} strokeWidth="1.5" />
                            {path2.inner && <path d={path2.inner} fill="#020408" stroke={strokeColor} strokeWidth="1" />}
                        </g>

                        {/* Weld Beads */}
                        {/* Right Fillet Bead */}
                        <path d={`M ${rightWeldX} ${cy} L ${rightWeldX + a} ${cy} Q ${rightWeldX + a * 0.1} ${cy - a * 0.9} ${rightWeldX} ${cy - a} Z`} fill="url(#weldGradient)" stroke="#d97706" strokeWidth="1" />
                        {/* Left Fillet Bead */}
                        <path d={`M ${leftWeldX} ${cy} L ${leftWeldX - a} ${cy} Q ${leftWeldX - a * 0.1} ${cy - a * 0.9} ${leftWeldX} ${cy - a} Z`} fill="url(#weldGradient)" stroke="#d97706" strokeWidth="1" />

                        {/* Dimensions & Annotations */}
                        <g className="opacity-80">
                            {/* Leg Size dimension right */}
                            <line x1={rightWeldX} y1={cy + 15} x2={rightWeldX + a} y2={cy + 15} stroke="#00e5ff" strokeWidth="1" />
                            <circle cx={rightWeldX} cy={cy + 15} r="1.5" fill="#00e5ff" />
                            <circle cx={rightWeldX + a} cy={cy + 15} r="1.5" fill="#00e5ff" />
                            <text x={rightWeldX + a/2} y={cy + 27} fill="#00e5ff" fontSize="9" textAnchor="middle" fontFamily="monospace">a={legSize}mm</text>

                            {/* Throat depth line */}
                            <line x1={rightWeldX} y1={cy} x2={rightWeldX + a * 0.707} y2={cy - a * 0.707} stroke="#06b6d4" strokeWidth="1" strokeDasharray="2,2" />
                            <text x={rightWeldX + a * 0.707 + 4} y={cy - a * 0.707} fill="#06b6d4" fontSize="8" textAnchor="start" fontFamily="monospace">t={(legSize * 0.707).toFixed(1)}</text>
                            
                            {/* Materials tags */}
                            <text x={cx - w1/2 + 10} y={cy + h1/2 + 4} fill="#a0aec0" fontSize="8" fontWeight="bold">{mat1.name}</text>
                            <text x={cx + 10} y={cy - h2/2 - 10} fill="#a0aec0" fontSize="8" fontWeight="bold">{mat2.name}</text>
                        </g>
                    </g>
                );
            }
            case 'butt':
            case 'vgroove': {
                const gap = 8; // 2mm gap scaled
                const path1 = drawProfile2D(mat1.shape, mat1.dimensions, scale);
                const path2 = drawProfile2D(mat2.shape, mat2.dimensions, scale);

                // For V-groove, we bevel the facing edges of the plates
                // Height = t1. We cut beveled triangles out of the inner edges.
                const bevelW = Math.tan((grooveAngle / 2) * Math.PI / 180) * h1;

                return (
                    <g>
                        {/* HAZ Glowing Area */}
                        <ellipse cx={cx} cy={cy} rx={bevelW + gap + 15} ry={h1 * 0.8} fill="url(#hazGradient)" />

                        {/* Left Plate (material 1) */}
                        <g transform={`translate(${cx - gap/2 - w1/2}, ${cy})`}>
                            {mat1.shape === 'sheet' ? (
                                // Draw beveled sheet
                                <polygon 
                                    points={`
                                        ${-w1/2},${-h1/2} 
                                        ${w1/2 - bevelW},${-h1/2} 
                                        ${w1/2},${h1/2} 
                                        ${-w1/2},${h1/2}
                                    `} 
                                    fill={mat1.color} 
                                    stroke={strokeColor} 
                                    strokeWidth="1.5" 
                                />
                            ) : (
                                <g>
                                    <path d={path1.outer} fill={mat1.color} stroke={strokeColor} strokeWidth="1.5" />
                                    {path1.inner && <path d={path1.inner} fill="#020408" stroke={strokeColor} strokeWidth="1" />}
                                </g>
                            )}
                        </g>

                        {/* Right Plate (material 2) */}
                        <g transform={`translate(${cx + gap/2 + w2/2}, ${cy})`}>
                            {mat2.shape === 'sheet' ? (
                                // Draw beveled sheet opposite
                                <polygon 
                                    points={`
                                        ${w2/2},${-h2/2} 
                                        ${-w2/2 + bevelW},${-h2/2} 
                                        ${-w2/2},${h2/2} 
                                        ${w2/2},${h2/2}
                                    `} 
                                    fill={mat2.color} 
                                    stroke={strokeColor} 
                                    strokeWidth="1.5" 
                                />
                            ) : (
                                <g>
                                    <path d={path2.outer} fill={mat2.color} stroke={strokeColor} strokeWidth="1.5" />
                                    {path2.inner && <path d={path2.inner} fill="#020408" stroke={strokeColor} strokeWidth="1" />}
                                </g>
                            )}
                        </g>

                        {/* Weld Metal filling the V-Groove */}
                        <polygon 
                            points={`
                                ${cx - gap/2 - bevelW},${cy - h1/2} 
                                ${cx + gap/2 + bevelW},${cy - h2/2} 
                                ${cx + gap/2},${cy + h2/2} 
                                ${cx - gap/2},${cy + h1/2}
                            `} 
                            fill="url(#weldGradient)" 
                            stroke="#d97706" 
                            strokeWidth="1" 
                        />
                        
                        {/* Top Reinforcement Cap */}
                        <path 
                            d={`M ${cx - gap/2 - bevelW - 4} ${cy - h1/2} Q ${cx} ${cy - h1/2 - 6} ${cx + gap/2 + bevelW + 4} ${cy - h2/2}`} 
                            fill="url(#weldGradient)" 
                            stroke="#d97706" 
                            strokeWidth="1" 
                        />

                        {/* Dimensions & Annotations */}
                        <g className="opacity-80">
                            {/* Groove Angle Arc & Label */}
                            <path d={`M ${cx - 15} ${cy - h1/2 - 10} Q ${cx} ${cy - h1/2 - 25} ${cx + 15} ${cy - h1/2 - 10}`} fill="none" stroke="#00e5ff" strokeWidth="1" />
                            <text x={cx} y={cy - h1/2 - 30} fill="#00e5ff" fontSize="9" textAnchor="middle" fontFamily="monospace">{grooveAngle}° Groove</text>

                            {/* Root Gap Dimension */}
                            <line x1={cx - gap/2} y1={cy + h1/2 + 10} x2={cx + gap/2} y2={cy + h1/2 + 10} stroke="#06b6d4" strokeWidth="1" />
                            <text x={cx} y={cy + h1/2 + 22} fill="#06b6d4" fontSize="8" textAnchor="middle" fontFamily="monospace">Gap</text>

                            {/* Thickness Label */}
                            <line x1={cx - gap/2 - w1/2 - 15} y1={cy - h1/2} x2={cx - gap/2 - w1/2 - 15} y2={cy + h1/2} stroke="#a0aec0" strokeWidth="1" />
                            <text x={cx - gap/2 - w1/2 - 22} y={cy + 3} fill="#a0aec0" fontSize="9" textAnchor="end" fontFamily="monospace">t={thickness}mm</text>
                        </g>
                    </g>
                );
            }
            case 'lap': {
                // Lap joint: Mat 1 on bottom left, Mat 2 overlapping on top right
                const path1 = drawProfile2D(mat1.shape, mat1.dimensions, scale);
                const path2 = drawProfile2D(mat2.shape, mat2.dimensions, scale);

                const overlap = Math.min(w1, w2) * 0.4;
                const offset1 = -w1/2 + overlap/2;
                const offset2 = w2/2 - overlap/2;

                const topY = cy - h2;
                const midY = cy;
                const botY = cy + h1;

                // Weld Joint Corner
                const rightWeldCornerX = cx + overlap/2;

                return (
                    <g transform={`translate(0, -${(h1 + h2)/4})`}>
                        {/* HAZ */}
                        <ellipse cx={rightWeldCornerX} cy={midY} rx={a * 1.5} ry={a * 1.5} fill="url(#hazGradient)" />

                        {/* Bottom Plate */}
                        <g transform={`translate(${cx + offset1}, ${cy + h1/2})`}>
                            <path d={path1.outer} fill={mat1.color} stroke={strokeColor} strokeWidth="1.5" />
                        </g>

                        {/* Top Plate */}
                        <g transform={`translate(${cx + offset2}, ${cy - h2/2})`}>
                            <path d={path2.outer} fill={mat2.color} stroke={strokeColor} strokeWidth="1.5" />
                        </g>

                        {/* Weld Fillet at Bottom Plate step */}
                        <path d={`M ${rightWeldCornerX} ${midY} L ${rightWeldCornerX} ${midY - a} Q ${rightWeldCornerX + a * 0.9} ${midY - a * 0.1} ${rightWeldCornerX + a} ${midY} Z`} fill="url(#weldGradient)" stroke="#d97706" strokeWidth="1" />

                        {/* Dimensions */}
                        <g className="opacity-80">
                            {/* Overlap dimension */}
                            <line x1={cx - overlap/2} y1={cy + h1 + 15} x2={cx + overlap/2} y2={cy + h1 + 15} stroke="#00e5ff" strokeWidth="1" />
                            <text x={cx} y={cy + h1 + 27} fill="#00e5ff" fontSize="9" textAnchor="middle" fontFamily="monospace">Overlap={Math.round(overlap/scale)}mm</text>
                            
                            {/* Weld Leg Size */}
                            <text x={rightWeldCornerX + a + 5} y={midY - 4} fill="#06b6d4" fontSize="8" textAnchor="start" fontFamily="monospace">a={legSize}</text>
                        </g>
                    </g>
                );
            }
            case 'corner': {
                // Corner joint: Mat 1 lies horizontal, Mat 2 vertical standing at the very edge
                const path1 = drawProfile2D(mat1.shape, mat1.dimensions, scale);
                const path2 = drawProfile2D(mat2.shape, mat2.dimensions, scale);

                const leftPlateX = cx - w1/2;
                const rightFaceX = cx + w1/2;
                const bottomFaceY = cy + h1;

                // Standing plate: right edge aligned to right edge of horizontal plate
                // Center X of standing plate = rightFaceX - t2/2
                // Center Y of standing plate = cy - h2/2
                const standX = rightFaceX - t2/2;

                return (
                    <g>
                        {/* HAZ */}
                        <ellipse cx={rightFaceX} cy={cy} rx={a * 1.5} ry={a * 1.5} fill="url(#hazGradient)" />

                        {/* Horizontal Plate (bottom) */}
                        <g transform={`translate(${cx}, ${cy + h1/2})`}>
                            <path d={path1.outer} fill={mat1.color} stroke={strokeColor} strokeWidth="1.5" />
                        </g>

                        {/* Vertical Plate (right corner) */}
                        <g transform={`translate(${standX}, ${cy - h2/2})`}>
                            <path d={path2.outer} fill={mat2.color} stroke={strokeColor} strokeWidth="1.5" />
                        </g>

                        {/* Corner Weld Bead (outer corner V) */}
                        <path d={`M ${rightFaceX - t2} ${cy} L ${rightFaceX} ${cy} L ${rightFaceX} ${cy + h1} Z`} fill="url(#weldGradient)" stroke="#d97706" strokeWidth="1" />

                        {/* Label */}
                        <text x={rightFaceX - 10} y={cy - h2/2 - 10} fill="#00e5ff" fontSize="9" textAnchor="middle" fontFamily="monospace">Corner Joint</text>
                    </g>
                );
            }
            default:
                return null;
        }
    };

    // Render Weld Simulation (animated view along length L)
    const renderWeldSimulation = () => {
        const weldLineY = cy - 2;
        const progressX = padding + progress * (viewWidth - 2 * padding);
        const beadWidth = scale * legSize;

        return (
            <g>
                {/* 1. Base metal plates side-by-side (showing the seam) */}
                <rect x={padding} y={cy - 40} width={viewWidth - 2 * padding} height={38} fill={mat1.color} opacity="0.8" rx="2" />
                <rect x={padding} y={cy + 2} width={viewWidth - 2 * padding} height={38} fill={mat2.color} opacity="0.9" rx="2" />

                {/* Seam line */}
                <line x1={padding} y1={weldLineY} x2={viewWidth - padding} y2={weldLineY} stroke="#101725" strokeWidth="2.5" />

                {/* 2. Weld Bead laying down dynamically */}
                {progress > 0 && (
                    <g>
                        {/* Laid and Cooled Weld Bead (grey-blue solid pattern) */}
                        <path 
                            d={`M ${padding} ${weldLineY} L ${progressX - 15} ${weldLineY}`}
                            stroke="#475569"
                            strokeWidth={beadWidth}
                            strokeLinecap="round"
                            strokeDasharray="4,2"
                            fill="none"
                            style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.4))" }}
                        />

                        {/* Actively cooling glowing bead behind electrode */}
                        <path 
                            d={`M ${Math.max(padding, progressX - 45)} ${weldLineY} L ${progressX} ${weldLineY}`}
                            stroke="url(#coolingGradient)"
                            strokeWidth={beadWidth + 1}
                            strokeLinecap="round"
                            fill="none"
                        />
                    </g>
                )}

                {/* 3. Spark Particles */}
                {sparks.map((spark) => (
                    <circle
                        key={spark.id}
                        cx={spark.cx}
                        cy={spark.cy}
                        r={spark.size}
                        fill="#ff9f1c"
                        opacity={spark.alpha}
                        style={{ filter: "drop-shadow(0 0 3px #ff4d4d)" }}
                    />
                ))}

                {/* 4. Moving Electrode Gun / Torch */}
                <g transform={`translate(${progressX}, ${weldLineY})`}>
                    {/* Electric Arc white-hot core */}
                    <circle cx="0" cy="0" r="10" fill="#ffffff" style={{ filter: "url(#arcGlow)" }} />
                    <circle cx="0" cy="0" r="4" fill="#00e5ff" />

                    {/* Weld pool arc light flares */}
                    <path d="M -20 0 L 20 0 M 0 -20 L 0 20" stroke="#00e5ff" strokeWidth="1" opacity="0.5" />

                    {/* Electrode holder nozzle (slanted) */}
                    <path d="M -12 -55 L 12 -55 L 5 -8 L -5 -8 Z" fill="#2d3748" stroke="#1a202c" strokeWidth="1.5" transform="rotate(-25)" />
                    {/* Glowing contact tip */}
                    <rect x="-3" y="-8" width="6" height="8" fill="#e2e8f0" transform="rotate(-25)" />
                    {/* Spun copper wire feeding */}
                    <line x1="0" y1="-55" x2="0" y2="-4" stroke="#d97706" strokeWidth="1.5" transform="rotate(-25)" />
                    
                    {/* Travel direction arrow */}
                    <g transform="translate(25, -35)">
                        <path d="M 0 0 L 15 0 M 10 -4 L 15 0 L 10 4" stroke="#00e5ff" strokeWidth="1.5" fill="none" />
                        <text x="7" y="-7" fill="#00e5ff" fontSize="7" fontWeight="bold" textAnchor="middle">TRAVEL</text>
                    </g>
                </g>

                {/* Weld Path Indicators */}
                <text x={padding} y={cy - 50} fill="#a0aec0" fontSize="8" fontFamily="monospace">START</text>
                <text x={viewWidth - padding} y={cy - 50} fill="#a0aec0" fontSize="8" fontFamily="monospace" textAnchor="end">L={length}mm</text>
            </g>
        );
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#020408] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Visualizer Tabs Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#121b28] border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Flame size={14} className="text-orange-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Weld Visualizer</span>
                </div>
                
                <div className="flex bg-[#080d14] rounded-lg p-0.5 border border-white/5">
                    <button
                        onClick={() => setActiveTab('blueprint')}
                        className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${
                            activeTab === 'blueprint' 
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Layers size={10} />
                        Blueprint Cross-Section
                    </button>
                    <button
                        onClick={() => setActiveTab('simulation')}
                        className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${
                            activeTab === 'simulation' 
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Activity size={10} />
                        Live Weld Sim
                    </button>
                </div>
            </div>

            {/* SVG Visualizer Area */}
            <div className="flex-1 relative bg-gradient-to-b from-[#080d14] to-[#03060a] min-h-[300px] flex items-center justify-center">
                {/* Engineering Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                
                <svg
                    viewBox={`0 0 ${viewWidth} ${viewHeight}`}
                    className="w-full h-full max-h-[360px]"
                >
                    <defs>
                        {/* Weld metal gradient */}
                        <linearGradient id="weldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="50%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#b45309" />
                        </linearGradient>

                        {/* HAZ Gradient */}
                        <radialGradient id="hazGradient" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="rgba(249, 115, 22, 0.4)" />
                            <stop offset="60%" stopColor="rgba(239, 68, 68, 0.15)" />
                            <stop offset="100%" stopColor="rgba(220, 38, 38, 0)" />
                        </radialGradient>

                        {/* Arc Glow Filter */}
                        <filter id="arcGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="8" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>

                        {/* Cooling Bead Gradient (Orange/Yellow at tip, transitioning to Red/Black cooling down) */}
                        <linearGradient id="coolingGradient" x1="100%" y1="0%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="10%" stopColor="#f59e0b" />
                            <stop offset="45%" stopColor="#ef4444" />
                            <stop offset="80%" stopColor="#7f1d1d" />
                            <stop offset="100%" stopColor="#475569" />
                        </linearGradient>
                    </defs>

                    {activeTab === 'blueprint' ? renderJointBlueprint() : renderWeldSimulation()}
                </svg>

                {/* HUD Overlay for active weld parameter monitoring */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3.5 py-2.5 rounded-xl pointer-events-none select-none font-mono text-[9px] text-gray-400 space-y-1 shadow-lg">
                    <div className="text-[10px] font-black uppercase text-orange-400 tracking-wider mb-1">Process Feed</div>
                    <div className="flex items-center gap-3 justify-between">
                        <span>JOINT TYPE:</span>
                        <span className="text-white font-bold uppercase">{jointType}</span>
                    </div>
                    <div className="flex items-center gap-3 justify-between">
                        <span>WELD L:</span>
                        <span className="text-white font-bold">{length} mm</span>
                    </div>
                    <div className="flex items-center gap-3 justify-between">
                        <span>LEG SIZE (a):</span>
                        <span className="text-white font-bold">{legSize} mm</span>
                    </div>
                </div>

                {/* Bottom Simulation Controller */}
                {activeTab === 'simulation' && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#0d1520]/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-4 shadow-xl z-20">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="p-1.5 bg-orange-600 hover:bg-orange-500 rounded-lg text-white transition-colors"
                        >
                            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                        </button>
                        
                        <button
                            onClick={handleRestart}
                            className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
                            title="Restart Weld Bead Run"
                        >
                            <RotateCcw size={12} />
                        </button>
                        
                        <div className="w-24 bg-gray-800 h-1.5 rounded-full overflow-hidden relative">
                            <div 
                                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
                                style={{ width: `${progress * 100}%` }}
                            />
                        </div>
                        
                        <span className="text-[9px] font-mono text-gray-400 w-10 text-right">
                            {Math.round(progress * 100)}%
                        </span>
                    </div>
                )}
            </div>
            
            {/* Visualizer Footer Info Card */}
            <div className="px-5 py-3 bg-[#0c121c] border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <div className="flex items-center gap-1.5">
                    <Thermometer size={11} className="text-amber-500" />
                    <span>HAZ Boundary Estimated: <strong className="text-gray-300">{(legSize * 1.5).toFixed(1)} mm</strong></span>
                </div>
                <span>AWS D1.1 Code Standards</span>
            </div>
        </div>
    );
}
