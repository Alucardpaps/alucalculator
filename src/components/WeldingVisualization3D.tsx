"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, PerspectiveCamera, OrthographicCamera, Center, Environment } from "@react-three/drei";
import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { ShapeType } from "@/utils/sectionProperties";
import ClientOnly from "@/components/ClientOnly";

export type WeldJointType3D = 'fillet' | 'butt' | 'vgroove' | 'tee' | 'lap' | 'corner';

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

interface WeldingVisualization3DProps {
    jointType: WeldJointType3D;
    legSize?: number;
    thickness?: number;
    grooveAngle?: number;
    length?: number;
    material1?: MaterialProfile;
    material2?: MaterialProfile;
    is2D?: boolean;
}

// === HELPER: GET PROFILE DIMENSIONS (BOUNDING BOX) ===
const getProfileBBox = (shape: ShapeType, dims: any = {}) => {
    let width = dims.width || 50;
    let height = dims.height || 50;

    // Normalize dimensions based on shape
    if (shape === 'pipe' || shape === 'bar') {
        const D = dims.diameter || 50;
        width = D;
        height = D;
    } else if (shape === 'ibeam' || shape === 'channel' || shape === 'tee') {
        height = dims.height || 100;
        width = dims.flangeWidth || 60;
    } else if (shape === 'angle') {
        height = dims.legWidth || 50;
        width = dims.legWidth || 50;
    } else if (shape === 'sheet') {
        // For sheet, height in cross-section is thickness
        height = dims.thickness || 10;
        // Width is width
        width = dims.width || 60;
    }

    return { width, height };
};

// === PROFILE GEOMETRY GENERATOR ===
const useProfileShape = (shape: ShapeType, dims: any = {}) => {
    return useMemo(() => {
        const s = new THREE.Shape();
        const W = dims.width || 50;
        const H = shape === 'sheet' ? (dims.thickness || 10) : (dims.height || 50);
        const T = dims.thickness || 5;
        const WT = dims.wallThickness || 4;
        const D = dims.diameter || 50;

        // Specific dimensions for structural shapes
        const H_beam = dims.height || 100;
        const W_flange = dims.flangeWidth || 60;
        const T_flange = dims.flangeThickness || 8;
        const T_web = dims.webThickness || 6;
        const W_leg = dims.legWidth || 50;
        const T_leg = dims.legThickness || 6;

        switch (shape) {
            case 'box':
                s.moveTo(-W / 2, -H / 2);
                s.lineTo(W / 2, -H / 2);
                s.lineTo(W / 2, H / 2);
                s.lineTo(-W / 2, H / 2);
                s.lineTo(-W / 2, -H / 2);
                if (WT < W / 2 && WT < H / 2) {
                    const hole = new THREE.Path();
                    const iw = W - 2 * WT;
                    const ih = H - 2 * WT;
                    hole.moveTo(-iw / 2, -ih / 2);
                    hole.lineTo(-iw / 2, ih / 2);
                    hole.lineTo(iw / 2, ih / 2);
                    hole.lineTo(iw / 2, -ih / 2);
                    hole.lineTo(-iw / 2, -ih / 2);
                    s.holes.push(hole);
                }
                break;

            case 'pipe':
                s.absarc(0, 0, D / 2, 0, Math.PI * 2, false);
                if (WT < D / 2) {
                    const hole = new THREE.Path();
                    hole.absarc(0, 0, (D / 2) - WT, 0, Math.PI * 2, true);
                    s.holes.push(hole);
                }
                break;

            case 'bar':
                s.absarc(0, 0, D / 2, 0, Math.PI * 2, false);
                break;

            case 'sheet':
                // Sheet implies thickness is the "Height" in cross-section
                const sheetThick = dims.thickness || 10;
                s.moveTo(-W / 2, -sheetThick / 2);
                s.lineTo(W / 2, -sheetThick / 2);
                s.lineTo(W / 2, sheetThick / 2);
                s.lineTo(-W / 2, sheetThick / 2);
                s.lineTo(-W / 2, -sheetThick / 2);
                break;

            case 'ibeam':
                s.moveTo(-W_flange / 2, H_beam / 2);
                s.lineTo(W_flange / 2, H_beam / 2);
                s.lineTo(W_flange / 2, H_beam / 2 - T_flange);
                s.lineTo(T_web / 2, H_beam / 2 - T_flange);
                s.lineTo(T_web / 2, -H_beam / 2 + T_flange);
                s.lineTo(W_flange / 2, -H_beam / 2 + T_flange);
                s.lineTo(W_flange / 2, -H_beam / 2);
                s.lineTo(-W_flange / 2, -H_beam / 2);
                s.lineTo(-W_flange / 2, -H_beam / 2 + T_flange);
                s.lineTo(-T_web / 2, -H_beam / 2 + T_flange);
                s.lineTo(-T_web / 2, H_beam / 2 - T_flange);
                s.lineTo(-W_flange / 2, H_beam / 2 - T_flange);
                s.lineTo(-W_flange / 2, H_beam / 2);
                break;

            case 'channel':
                s.moveTo(-W_flange / 2, H_beam / 2);
                s.lineTo(W_flange / 2, H_beam / 2);
                s.lineTo(W_flange / 2, H_beam / 2 - T_flange);
                s.lineTo(-W_flange / 2 + T_web, H_beam / 2 - T_flange);
                s.lineTo(-W_flange / 2 + T_web, -H_beam / 2 + T_flange);
                s.lineTo(W_flange / 2, -H_beam / 2 + T_flange);
                s.lineTo(W_flange / 2, -H_beam / 2);
                s.lineTo(-W_flange / 2, -H_beam / 2);
                s.lineTo(-W_flange / 2, H_beam / 2);
                break;

            case 'angle':
                const cx = W_leg / 2;
                const cy = W_leg / 2;
                s.moveTo(-cx, -cy);
                s.lineTo(-cx + W_leg, -cy);
                s.lineTo(-cx + W_leg, -cy + T_leg);
                s.lineTo(-cx + T_leg, -cy + T_leg);
                s.lineTo(-cx + T_leg, -cy + W_leg);
                s.lineTo(-cx, -cy + W_leg);
                s.lineTo(-cx, -cy);
                break;

            case 'tee':
                s.moveTo(-W_flange / 2, H_beam / 2);
                s.lineTo(W_flange / 2, H_beam / 2);
                s.lineTo(W_flange / 2, H_beam / 2 - T_flange);
                s.lineTo(T_web / 2, H_beam / 2 - T_flange);
                s.lineTo(T_web / 2, -H_beam / 2);
                s.lineTo(-T_web / 2, -H_beam / 2);
                s.lineTo(-T_web / 2, H_beam / 2 - T_flange);
                s.lineTo(-W_flange / 2, H_beam / 2 - T_flange);
                s.lineTo(-W_flange / 2, H_beam / 2);
                break;

            default:
                const defT = dims.thickness || 10;
                s.moveTo(-W / 2, -defT / 2);
                s.lineTo(W / 2, -defT / 2);
                s.lineTo(W / 2, defT / 2);
                s.lineTo(-W / 2, defT / 2);
                s.lineTo(-W / 2, -defT / 2);
        }

        return s;
    }, [shape, dims]);
};

// === EXTRUDED PROFILE MESH ===
const ProfileMesh = ({
    shape = 'sheet',
    dims = {},
    length = 100,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    color = "#94a3b8"
}: {
    shape: ShapeType;
    dims?: any;
    length: number;
    position?: [number, number, number];
    rotation?: [number, number, number];
    color?: string;
}) => {
    const profileShape = useProfileShape(shape, dims);
    const extrudeSettings = useMemo(() => ({
        depth: length,
        bevelEnabled: false,
        steps: 1
    }), [length]);

    return (
        <group position={position} rotation={rotation as any}>
            <mesh castShadow receiveShadow position={[0, 0, -length / 2]}>
                <extrudeGeometry args={[profileShape, extrudeSettings]} />
                <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} side={THREE.DoubleSide} />
            </mesh>
            <lineSegments position={[0, 0, -length / 2]}>
                <edgesGeometry args={[new THREE.ExtrudeGeometry(profileShape, extrudeSettings)]} />
                <lineBasicMaterial color="#334155" linewidth={1} />
            </lineSegments>
        </group>
    );
};

// === WELD BEAD ===
const WeldBead = ({ size, length, color = "#f59e0b" }: { size: number, length: number, color?: string }) => {
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(0, 0);
        s.lineTo(size, 0);
        s.quadraticCurveTo(size * 0.4, size * 0.4, 0, size);
        s.lineTo(0, 0);
        return s;
    }, [size]);

    return (
        <mesh castShadow position={[0, 0, -length / 2]}>
            <extrudeGeometry args={[shape, { depth: length, bevelEnabled: false }]} />
            <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
        </mesh>
    );
};

// === JOINT: FILLET (T-Joint) ===
const FilletTJoint = ({ legSize, length, mat1, mat2 }: any) => {
    const bb1 = getProfileBBox(mat1.shape, mat1.dimensions);
    const bb2 = getProfileBBox(mat2.shape, mat2.dimensions);

    // Mat 1 = Base (Horizontal) -> Lying Flat
    // Top surface at Y=0.
    const p1 = [0, -(bb1.height / 2), 0];

    // Mat 2 = Stem (Vertical) -> Standing Up
    // Bottom surface at Y=0.
    // For a profile to stand up:
    // 1. If it's a pipe/box, it's already "Vertical" in cross section? No.
    // ProfileMesh draws cross-section in XY plane. Extrudes in Z.
    // So "Standing Up" means the Cross Section (XY) is rotated?
    // In T-Joint, Mat 2 is usually perpendicular to Mat 1.
    // If Mat 1 is "Flat" (XY cross section, Z extrusion), then Mat 2 should be...
    // Actually, "T-Joint" usually implies joining Plates or Beams.
    // Case 1: Plate to Plate (T shape).
    // Mat 1: Flat plate. Width=W1, Height=T1.
    // Mat 2: Vertical plate. Width=W2, Height=T2.
    // We want Mat 2 to stand on Mat 1.
    // Mat 2 Cross Section (W2 x T2) needs to be rotated 90 degrees?
    // If we rotate 90 deg around Z:
    // W2 becomes vertical. T2 becomes horizontal.
    // This makes it a "Wall" standing on the floor. Correct.

    // So if Rot Z = 90:
    // New Height = bb2.width. New Width = bb2.height.
    const p2Offset = bb2.width / 2; // Center offset after rotation
    const p2 = [0, p2Offset, 0];

    // Weld Beads at corners
    // Mat 2 is centered at X=0 (after rotation, its thickness is centered at 0).
    // Its thickness is bb2.height.
    // So corners are at X = +/- bb2.height / 2.
    const weldX = bb2.height / 2;

    return (
        <group>
            <ProfileMesh shape={mat1.shape} dims={mat1.dimensions} length={length} position={p1 as any} color={mat1.color} />

            <ProfileMesh
                shape={mat2.shape}
                dims={mat2.dimensions}
                length={length}
                position={p2 as any}
                rotation={[0, 0, Math.PI / 2]} // Rotate to stand up
                color={mat2.color}
            />

            {/* Weld Bead Right */}
            <group position={[weldX, 0, 0]}>
                <WeldBead size={legSize} length={length} />
            </group>

            {/* Weld Bead Left */}
            <group position={[-weldX, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, -1, 1]}>
                <group rotation={[0, 0, -Math.PI / 2]}>
                    <WeldBead size={legSize} length={length} />
                </group>
            </group>
        </group>
    );
};

// === JOINT: BUTT ===
const ButtJoint = ({ thickness, length, mat1, mat2 }: any) => {
    const gap = 2;
    const bb1 = getProfileBBox(mat1.shape, mat1.dimensions);
    const bb2 = getProfileBBox(mat2.shape, mat2.dimensions);

    const p1 = [-gap / 2 - bb1.width / 2, 0, 0];
    const p2 = [gap / 2 + bb2.width / 2, 0, 0];

    return (
        <group>
            <ProfileMesh shape={mat1.shape} dims={mat1.dimensions} length={length} position={p1 as any} color={mat1.color} />
            <ProfileMesh shape={mat2.shape} dims={mat2.dimensions} length={length} position={p2 as any} color={mat2.color} />

            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[gap, Math.min(bb1.height, bb2.height), length]} />
                <meshStandardMaterial color="#f59e0b" metalness={0.3} roughness={0.7} />
            </mesh>

            <group position={[0, Math.min(bb1.height, bb2.height) / 2, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[gap, gap, length, 8]} />
                    <meshStandardMaterial color="#f59e0b" />
                </mesh>
            </group>
        </group>
    );
};

// === JOINT: LAP ===
const LapJoint = ({ legSize, length, mat1, mat2 }: any) => {
    const bb1 = getProfileBBox(mat1.shape, mat1.dimensions);
    const bb2 = getProfileBBox(mat2.shape, mat2.dimensions);
    const overlap = Math.min(bb1.width, bb2.width) * 0.5;

    const p1 = [0, -bb1.height / 2, 0];
    // Mat 2 Top -> Shifted Right
    const p2 = [(bb1.width / 2 - overlap) + bb2.width / 2, bb2.height / 2, 0];
    const weldPos = [(bb1.width / 2 - overlap), 0, 0];

    return (
        <group>
            <ProfileMesh shape={mat1.shape} dims={mat1.dimensions} length={length} position={p1 as any} color={mat1.color} />
            <ProfileMesh shape={mat2.shape} dims={mat2.dimensions} length={length} position={p2 as any} color={mat2.color} />

            <group position={weldPos as any} rotation={[0, 0, 0]}>
                <group scale={[-1, 1, 1]}>
                    <WeldBead size={legSize} length={length} />
                </group>
            </group>
        </group>
    );
};

// === JOINT: CORNER ===
const CornerJoint = ({ legSize, length, mat1, mat2 }: any) => {
    const bb1 = getProfileBBox(mat1.shape, mat1.dimensions);
    const bb2 = getProfileBBox(mat2.shape, mat2.dimensions);

    // Mat 1 Horizontal. Top Right Corner at (0,0)
    const p1 = [-bb1.width / 2, -bb1.height / 2, 0];

    // Mat 2 Vertical. Bottom Left Corner at (0,0)
    // Rotate 90 deg to stand up?
    // Standard Corner Joint for box/plates:
    // If we use 'sheet', it's flat. 
    // Mat 2 needs to stand up (Rotate 90 Z).
    // If Rot Z=90, Width becomes vertical. Height becomes horizontal.
    // Bottom Left after rotation:
    // Center X = bb2.height/2. Center Y = bb2.width/2.
    // Left Face X=0. Bottom Face Y=0.

    const p2 = [bb2.height / 2, bb2.width / 2, 0];

    return (
        <group>
            <ProfileMesh shape={mat1.shape} dims={mat1.dimensions} length={length} position={p1 as any} color={mat1.color} />
            <ProfileMesh
                shape={mat2.shape}
                dims={mat2.dimensions}
                length={length}
                position={p2 as any}
                rotation={[0, 0, Math.PI / 2]}
                color={mat2.color}
            />

            <group scale={[-1, 1, 1]}>
                <WeldBead size={legSize} length={length} />
            </group>
        </group>
    );
};

// === JOINT: V-GROOVE ===
const VGrooveJoint = ({ thickness, length, mat1, mat2 }: any) => {
    return <ButtJoint thickness={thickness} length={length} mat1={mat1} mat2={mat2} />;
}

// === MAIN COMPONENT ===
export const WeldingVisualization3D = ({
    jointType = 'fillet',
    legSize = 6,
    thickness = 12,
    grooveAngle = 60,
    length = 100,
    material1 = { color: "#94a3b8", name: "Steel", shape: 'sheet' as ShapeType },
    material2 = { color: "#64748b", name: "Steel", shape: 'sheet' as ShapeType },
    is2D = false
}: WeldingVisualization3DProps) => {

    const mat1: MaterialProfile = {
        ...material1,
        shape: material1.shape || 'sheet',
        dimensions: material1.dimensions || { width: 60, height: thickness, thickness }
    };
    const mat2: MaterialProfile = {
        ...material2,
        shape: material2.shape || 'sheet',
        dimensions: material2.dimensions || { width: 60, height: thickness, thickness }
    };

    const commonProps = { legSize, thickness, length, grooveAngle, mat1, mat2 };

    return (
        <ClientOnly fallback={<div className="w-full h-full min-h-[400px] bg-[#0a1018] rounded-3xl animate-pulse" />}>
            <div className={`w-full h-full min-h-[400px] cursor-move bg-transparent rounded-3xl overflow-hidden relative group border border-white/5 shadow-inner`}>
                <Canvas shadows dpr={[1, 2]} gl={{ preserveDrawingBuffer: true, antialias: true }}>
                    {is2D ? (
                        <OrthographicCamera makeDefault position={[0, 0, 100]} zoom={4} />
                    ) : (
                        <PerspectiveCamera makeDefault position={[60, 60, 60]} fov={45} />
                    )}

                    {is2D ? (
                        <Center>
                            {/* In 2D mode, we just show simple ambient light and the mesh from front */}
                            <ambientLight intensity={1} />
                            <directionalLight position={[10, 10, 10]} intensity={1} />
                            {jointType === 'fillet' && <FilletTJoint {...commonProps} />}
                            {jointType === 'tee' && <FilletTJoint {...commonProps} />}
                            {jointType === 'butt' && <ButtJoint {...commonProps} />}
                            {jointType === 'vgroove' && <VGrooveJoint {...commonProps} />}
                            {jointType === 'lap' && <LapJoint {...commonProps} />}
                            {jointType === 'corner' && <CornerJoint {...commonProps} />}
                        </Center>
                    ) : (
                        <Stage environment="apartment" intensity={0.5} adjustCamera={true} preset="rembrandt" shadows="contact">
                            <Center>
                                {jointType === 'fillet' && <FilletTJoint {...commonProps} />}
                                {jointType === 'tee' && <FilletTJoint {...commonProps} />}
                                {jointType === 'butt' && <ButtJoint {...commonProps} />}
                                {jointType === 'vgroove' && <VGrooveJoint {...commonProps} />}
                                {jointType === 'lap' && <LapJoint {...commonProps} />}
                                {jointType === 'corner' && <CornerJoint {...commonProps} />}
                            </Center>
                        </Stage>
                    )}

                    {!is2D && <OrbitControls autoRotate autoRotateSpeed={0.5} makeDefault />}
                    {!is2D && <Environment preset="apartment" />}
                    {!is2D && <ambientLight intensity={0.5} />}
                </Canvas>

                {/* Legend */}
                <div className="absolute bottom-6 left-6 bg-[#080d14]/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-[10px] font-mono space-y-2 z-10 pointer-events-none select-none shadow-xl">
                    <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mat1.color, boxShadow: `0 0 8px ${mat1.color}40` }}></span>
                        <span className="text-gray-300">{mat1.name} <span className="text-gray-600">({mat1.shape})</span></span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mat2.color, boxShadow: `0 0 8px ${mat2.color}40` }}></span>
                        <span className="text-gray-300">{mat2.name} <span className="text-gray-600">({mat2.shape})</span></span>
                    </div>
                    <div className="flex items-center gap-2.5 pt-1 border-t border-white/5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]"></span>
                        <span className="text-amber-400 font-bold uppercase tracking-widest">Weld Bead</span>
                    </div>
                </div>

                {/* Joint Type Badge */}
                <div className="absolute top-6 left-6 bg-[#080d14]/80 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] z-10 shadow-lg flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                    {jointType} Joint <span className="text-white/20 px-2">|</span> {is2D ? 'Schematic' : 'ISO Perspective'}
                </div>
            </div>
        </ClientOnly>
    );
};
