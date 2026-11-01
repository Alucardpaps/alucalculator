'use client';

/**
 * Shaft 3D Interactive CAD Viewport (Three.js + React Three Fiber)
 * Visualizes stepped shafts with true 3D procedural geometry, PBR steel materials,
 * keyways, grooves, bearings, and provides direct STL / DXF / Design Studio export actions.
 */

import React, { useMemo, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Center } from '@react-three/drei';
import * as THREE from 'three';
import {
    Box,
    RotateCcw,
    Eye,
    Download,
    Share2,
    Compass,
    Layers,
    FileCode,
    Sparkles
} from 'lucide-react';
import type { ShaftSegment, ShaftBearingSupport } from '@/modules/mechanical/ShaftDesign/engine';
import { downloadShaftSTL } from '@/modules/mechanical/ShaftDesign/stlExporter';
import { downloadShaftDXF } from '@/modules/mechanical/ShaftDesign/dxfExporter';
import { transferShaftToDesignStudio } from '@/modules/mechanical/ShaftDesign/transferTo3D';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

interface Shaft3DViewerProps {
    segments: ShaftSegment[];
    totalLength: number;
    selectedSegmentId?: string | null;
    supportAPos?: number;
    supportBPos?: number;
    supportABearing?: ShaftBearingSupport | null;
    supportBBearing?: ShaftBearingSupport | null;
    onSelectSegment?: (segmentId: string) => void;
}

// 3D Procedural Segment Mesh
function SegmentMesh({
    seg,
    startX,
    isSelected,
    wireframe,
    onSelect
}: {
    seg: ShaftSegment;
    startX: number;
    isSelected: boolean;
    wireframe: boolean;
    onSelect?: () => void;
}) {
    const r = seg.diameter / 2;
    const len = seg.length;
    const posX = startX + len / 2;

    // Geometry is strictly memoized to adhere to AGENTS.md performance guardrails
    const cylinderGeom = useMemo(() => {
        // High fidelity 48-sided cylinder along Y axis, which we rotate to X axis
        return new THREE.CylinderGeometry(r, r, len, 48, 1, false);
    }, [r, len]);

    // Outer Chamfer Meshes (Bevel Cones)
    const leftChamferGeom = useMemo(() => {
        if (!seg.chamferLeft || seg.chamferLeft <= 0) return null;
        const cL = Math.min(seg.chamferLeft, r * 0.4, len * 0.35);
        return new THREE.CylinderGeometry(r, r - cL, cL, 48, 1, false);
    }, [seg.chamferLeft, r, len]);

    const rightChamferGeom = useMemo(() => {
        if (!seg.chamferRight || seg.chamferRight <= 0) return null;
        const cR = Math.min(seg.chamferRight, r * 0.4, len * 0.35);
        return new THREE.CylinderGeometry(r - cR, r, cR, 48, 1, false);
    }, [seg.chamferRight, r, len]);

    return (
        <group position={[posX, 0, 0]}>
            {/* Main Segment Cylinder Body */}
            <mesh
                geometry={cylinderGeom}
                rotation={[0, 0, -Math.PI / 2]}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.();
                }}
            >
                <meshStandardMaterial
                    color={isSelected ? '#4a88cc' : '#7d8c99'}
                    roughness={0.28}
                    metalness={0.88}
                    wireframe={wireframe}
                />
            </mesh>

            {/* Chamfer Overlays if present */}
            {leftChamferGeom && (
                <mesh
                    geometry={leftChamferGeom}
                    position={[-len / 2 + (seg.chamferLeft ?? 1) / 2, 0, 0]}
                    rotation={[0, 0, -Math.PI / 2]}
                >
                    <meshStandardMaterial
                        color={isSelected ? '#5c9ce6' : '#94a4b2'}
                        roughness={0.35}
                        metalness={0.8}
                        wireframe={wireframe}
                    />
                </mesh>
            )}

            {rightChamferGeom && (
                <mesh
                    geometry={rightChamferGeom}
                    position={[len / 2 - (seg.chamferRight ?? 1) / 2, 0, 0]}
                    rotation={[0, 0, -Math.PI / 2]}
                >
                    <meshStandardMaterial
                        color={isSelected ? '#5c9ce6' : '#94a4b2'}
                        roughness={0.35}
                        metalness={0.8}
                        wireframe={wireframe}
                    />
                </mesh>
            )}

            {/* 3D Features (Keyways, Circlips, Gears) */}
            {seg.features?.map((f) => {
                if (f.type === 'keyway') {
                    const kwW = f.width || Math.max(4, r * 0.3);
                    const kwH = f.depth || Math.max(3, r * 0.2);
                    const kwL = f.length;
                    const kwX = -len / 2 + f.offsetFromStart + kwL / 2;

                    return (
                        <mesh key={f.id} position={[kwX, r - kwH / 2, 0]}>
                            <boxGeometry args={[kwL, kwH, kwW]} />
                            <meshStandardMaterial color="#1a1c22" roughness={0.7} metalness={0.3} />
                        </mesh>
                    );
                }

                if (f.type === 'circlip') {
                    const ccW = f.grooveWidth;
                    const grooveDepth = (seg.diameter - f.grooveDia) / 2;
                    const ccX = -len / 2 + f.offsetFromStart + ccW / 2;
                    const ringR = r - grooveDepth / 2;

                    return (
                        <mesh key={f.id} position={[ccX, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                            <cylinderGeometry args={[ringR + 0.2, ringR + 0.2, ccW, 36]} />
                            <meshStandardMaterial color="#101721" roughness={0.8} metalness={0.2} />
                        </mesh>
                    );
                }

                if (f.type === 'gear') {
                    const gearW = f.faceWidth;
                    const tipR = f.tipDiameter / 2;
                    const gX = -len / 2 + f.offsetFromStart + gearW / 2;

                    return (
                        <group key={f.id} position={[gX, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                            {/* Gear Pitch Ring */}
                            <mesh>
                                <cylinderGeometry args={[tipR, tipR, gearW, 40]} />
                                <meshStandardMaterial color="#2d4a6b" roughness={0.3} metalness={0.85} wireframe={wireframe} />
                            </mesh>
                        </group>
                    );
                }

                return null;
            })}
        </group>
    );
}

// 3D Bearing Support Marker Ring
function BearingMarker({
    posX,
    boreDia,
    outerDia,
    width = 15,
    label
}: {
    posX: number;
    boreDia: number;
    outerDia: number;
    width?: number;
    label: string;
}) {
    const rIn = boreDia / 2;
    const rOut = outerDia / 2;

    return (
        <group position={[posX, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <mesh>
                <cylinderGeometry args={[rOut, rOut, width, 32, 1, true]} />
                <meshStandardMaterial color="#3ad0e6" transparent opacity={0.4} roughness={0.2} metalness={0.9} />
            </mesh>
            <mesh>
                <cylinderGeometry args={[rIn, rIn, width, 32, 1, true]} />
                <meshStandardMaterial color="#3ad0e6" transparent opacity={0.3} roughness={0.2} metalness={0.9} />
            </mesh>
        </group>
    );
}

export function Shaft3DViewer({
    segments,
    totalLength,
    selectedSegmentId,
    supportAPos,
    supportBPos,
    supportABearing,
    supportBBearing,
    onSelectSegment
}: Shaft3DViewerProps) {
    const { language } = useI18nStore();
    const [wireframe, setWireframe] = useState(false);
    const [autoRotate, setAutoRotate] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const controlsRef = useRef<any>(null);

    // Compute bounds
    const maxDia = useMemo(() => {
        let maxD = 20;
        for (const s of segments) {
            if (s.diameter > maxD) maxD = s.diameter;
            for (const f of s.features) {
                if (f.type === 'gear' && (f as any).tipDiameter > maxD) {
                    maxD = (f as any).tipDiameter;
                }
            }
        }
        return maxD;
    }, [segments]);

    // Segment bounds
    const segmentBounds = useMemo(() => {
        let x = -totalLength / 2;
        return segments.map((seg) => {
            const startX = x;
            x += seg.length;
            return { seg, startX };
        });
    }, [segments, totalLength]);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Camera Presets
    const setCameraView = (view: 'iso' | 'front' | 'top' | 'side') => {
        if (!controlsRef.current) return;
        const dist = Math.max(120, totalLength * 1.3);

        if (view === 'front') {
            controlsRef.current.object.position.set(0, 0, dist);
        } else if (view === 'top') {
            controlsRef.current.object.position.set(0, dist, 0);
        } else if (view === 'side') {
            controlsRef.current.object.position.set(dist, 0, 0);
        } else {
            // Isometric
            controlsRef.current.object.position.set(dist * 0.7, dist * 0.6, dist * 0.7);
        }
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
    };

    const handleTransferToDesignStudio = () => {
        const result = transferShaftToDesignStudio(segments, t12(language, 'Stepped Shaft', 'Kademeli Mil'));
        if (result.success) {
            showToast(t12(language, '✓ Shaft successfully transferred to 3D CAD Studio', '✓ Mil başarıyla 3D CAD Stüdyosu\'na aktarıldı'));
        }
    };

    const handleDownloadSTL = () => {
        downloadShaftSTL(segments);
        showToast(t12(language, '✓ 3D STL file downloaded', '✓ 3D STL dosyası indirildi'));
    };

    const handleDownloadDXF = () => {
        downloadShaftDXF(segments);
        showToast(t12(language, '✓ 2D DXF drawing downloaded', '✓ 2D DXF teknik resmi indirildi'));
    };

    return (
        <div className="relative w-full h-full flex flex-col bg-[var(--bg-0)] border border-[var(--line)] rounded-lg overflow-hidden select-none font-mono">
            {/* TOP 3D WORKBENCH TOOLBAR */}
            <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[var(--bg-1)] border-b border-[var(--line)] text-xs text-[var(--alu)] gap-2 z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-xs uppercase font-bold text-[var(--cyan)] tracking-wider flex items-center gap-1.5">
                        <Box size={15} /> {t12(language, '3D CAD View (Three.js Solid Model)', '3D CAD Görünüm (Three.js Katı Model)')}
                    </span>
                    <span className="text-[10px] text-[var(--alu-dim)] px-2 py-0.5 rounded bg-[var(--bg-3)] border border-[var(--line)]">
                        L={Math.round(totalLength)} mm · Ømax={Math.round(maxDia)} mm
                    </span>
                </div>

                {/* View Toggles & Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Camera Angles */}
                    <div className="flex items-center rounded bg-[var(--bg-2)] border border-[var(--line)] p-0.5">
                        <button
                            onClick={() => setCameraView('iso')}
                            className="px-2 py-0.5 text-[10px] text-[var(--alu-dim)] hover:text-white rounded"
                            title={t12(language, 'Isometric View', 'İzometrik Görünüm')}
                        >
                            {t12(language, 'Iso', 'İzo')}
                        </button>
                        <button
                            onClick={() => setCameraView('front')}
                            className="px-2 py-0.5 text-[10px] text-[var(--alu-dim)] hover:text-white rounded"
                            title={t12(language, 'Front View', 'Ön Görünüm')}
                        >
                            {t12(language, 'Front', 'Ön')}
                        </button>
                        <button
                            onClick={() => setCameraView('top')}
                            className="px-2 py-0.5 text-[10px] text-[var(--alu-dim)] hover:text-white rounded"
                            title={t12(language, 'Top View', 'Üst Görünüm')}
                        >
                            {t12(language, 'Top', 'Üst')}
                        </button>
                        <button
                            onClick={() => setCameraView('side')}
                            className="px-2 py-0.5 text-[10px] text-[var(--alu-dim)] hover:text-white rounded"
                            title={t12(language, 'Side View', 'Yan Görünüm')}
                        >
                            {t12(language, 'Side', 'Yan')}
                        </button>
                    </div>

                    <div className="w-[1px] h-4 bg-[var(--line)] mx-0.5" />

                    {/* Rendering Mode Controls */}
                    <button
                        onClick={() => setWireframe(!wireframe)}
                        className={`px-2 py-1 rounded text-[10px] border transition-colors flex items-center gap-1 ${
                            wireframe
                                ? 'bg-[var(--cyan)]/20 border-[var(--cyan)]/50 text-[var(--cyan)]'
                                : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:text-white'
                        }`}
                        title={t12(language, 'Toggle Wireframe / Solid', 'Tel Kafes / Katı Model Geçişi')}
                    >
                        <Layers size={12} /> {t12(language, 'Wireframe', 'Tel Kafes')}
                    </button>

                    <button
                        onClick={() => setAutoRotate(!autoRotate)}
                        className={`px-2 py-1 rounded text-[10px] border transition-colors flex items-center gap-1 ${
                            autoRotate
                                ? 'bg-[var(--warn)]/20 border-[var(--warn)]/50 text-[var(--warn)]'
                                : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:text-white'
                        }`}
                        title={t12(language, 'Toggle Auto Rotation', 'Otomatik Döndürmeyi Aç/Kapat')}
                    >
                        <RotateCcw size={12} /> {t12(language, 'Rotate', 'Döndür')}
                    </button>

                    <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={`px-2 py-1 rounded text-[10px] border transition-colors ${
                            showGrid
                                ? 'bg-[var(--bg-3)] border-[var(--line-strong)] text-[var(--alu)]'
                                : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)]'
                        }`}
                        title={t12(language, 'Toggle Ground Grid', 'CAD Zemin Izgarasını Göster/Gizle')}
                    >
                        {t12(language, 'Grid', 'Izgara')}
                    </button>

                    <div className="w-[1px] h-4 bg-[var(--line)] mx-0.5" />

                    {/* Direct Export Actions */}
                    <button
                        onClick={handleDownloadDXF}
                        className="px-2 py-1 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-sky-400 border border-sky-500/40 text-[10px] font-bold flex items-center gap-1 transition-colors"
                        title={t12(language, 'Download 2D AutoCAD DXF Drawing', '2D AutoCAD DXF Teknik Çizimini İndir')}
                    >
                        <FileCode size={12} /> {t12(language, 'Download DXF', 'DXF İndir')}
                    </button>

                    <button
                        onClick={handleDownloadSTL}
                        className="px-2 py-1 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-emerald-400 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 transition-colors"
                        title={t12(language, 'Download 3D STL Solid File', '3D STL Katı Model Dosyasını İndir')}
                    >
                        <Download size={12} /> {t12(language, 'Download STL', 'STL İndir')}
                    </button>

                    <button
                        onClick={handleTransferToDesignStudio}
                        className="px-2.5 py-1 rounded bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 text-[var(--cyan)] border border-[var(--cyan)]/50 text-[10px] font-bold flex items-center gap-1.5 transition-colors"
                        title={t12(language, 'Transfer Shaft to 3D CAD Studio Workspace', 'Mili Doğrudan 3D CAD Stüdyosu Çalışma Alanına Aktar')}
                    >
                        <Share2 size={12} /> {t12(language, 'Transfer to 3D Studio', '3D Stüdyoya Aktar')}
                    </button>
                </div>
            </div>

            {/* THREE.JS 3D CANVAS */}
            <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
                <Canvas
                    camera={{ position: [totalLength * 0.8, totalLength * 0.6, totalLength * 0.8], fov: 42 }}
                    gl={{ antialias: true, preserveDrawingBuffer: true }}
                >
                    {/* Studio Illumination */}
                    <ambientLight intensity={0.65} />
                    <directionalLight position={[100, 150, 100]} intensity={1.2} />
                    <directionalLight position={[-100, -50, -100]} intensity={0.5} />
                    <directionalLight position={[0, -100, 50]} intensity={0.3} />

                    {/* Orbit Controls */}
                    <OrbitControls
                        ref={controlsRef}
                        makeDefault
                        enableDamping
                        dampingFactor={0.06}
                        autoRotate={autoRotate}
                        autoRotateSpeed={1.2}
                        minDistance={10}
                        maxDistance={3500}
                    />

                    {/* CAD Ground Grid Plane */}
                    {showGrid && (
                        <Grid
                            position={[0, -maxDia / 2 - 15, 0]}
                            args={[Math.max(500, totalLength * 2), Math.max(500, totalLength * 2)]}
                            cellSize={10}
                            cellThickness={0.6}
                            cellColor="#1e293b"
                            sectionSize={50}
                            sectionThickness={1.2}
                            sectionColor="#334155"
                            fadeDistance={Math.max(600, totalLength * 2.5)}
                        />
                    )}

                    {/* Stepped Shaft Geometry Group */}
                    <Center>
                        <group>
                            {segmentBounds.map(({ seg, startX }) => (
                                <SegmentMesh
                                    key={seg.id}
                                    seg={seg}
                                    startX={startX}
                                    isSelected={selectedSegmentId === seg.id}
                                    wireframe={wireframe}
                                    onSelect={() => onSelectSegment?.(seg.id)}
                                />
                            ))}

                            {/* Bearing A Support Marker */}
                            {supportAPos !== undefined && supportABearing && (
                                <BearingMarker
                                    posX={-totalLength / 2 + supportAPos}
                                    boreDia={supportABearing.boreDia}
                                    outerDia={supportABearing.outerDia}
                                    label={`${t12(language, 'Bearing', 'Yatak')} A`}
                                />
                            )}

                            {/* Bearing B Support Marker */}
                            {supportBPos !== undefined && supportBBearing && (
                                <BearingMarker
                                    posX={-totalLength / 2 + supportBPos}
                                    boreDia={supportBBearing.boreDia}
                                    outerDia={supportBBearing.outerDia}
                                    label={`${t12(language, 'Bearing', 'Yatak')} B`}
                                />
                            )}
                        </group>
                    </Center>
                </Canvas>

                {/* Floating Notification Toast */}
                {toastMessage && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded bg-[var(--bg-1)] border border-[var(--cyan)]/60 text-[var(--cyan)] text-xs font-bold shadow-lg shadow-black/60 pointer-events-none transition-all">
                        {toastMessage}
                    </div>
                )}

                {/* Bottom Left Navigation Compass Hint */}
                <div className="absolute bottom-2.5 left-3 text-[10px] text-[var(--alu-dim)] flex items-center gap-1.5 pointer-events-none">
                    <Compass size={13} className="text-[var(--cyan)]" />
                    <span>{t12(language, 'Left Click: Rotate · Right Click: Pan · Wheel: Zoom', 'Sol Tık: Döndür · Sağ Tık: Kaydır · Tekerlek: Yakınlaş')}</span>
                </div>
            </div>
        </div>
    );
}
