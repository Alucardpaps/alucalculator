'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Wireframe } from '@react-three/drei';
import { useOSStore } from '@/store/osStore';
import * as THREE from 'three';

function AluminumExtrusion({ isChaosMode }: { isChaosMode: boolean }) {
    const meshRef = useRef<THREE.Mesh>(null);

    // Create a complex I-Beam geometry
    const geometry = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(-1, -1);
        shape.lineTo(1, -1);
        shape.lineTo(1, -0.8);
        shape.lineTo(0.2, -0.8);
        shape.lineTo(0.2, 0.8);
        shape.lineTo(1, 0.8);
        shape.lineTo(1, 1);
        shape.lineTo(-1, 1);
        shape.lineTo(-1, 0.8);
        shape.lineTo(-0.2, 0.8);
        shape.lineTo(-0.2, -0.8);
        shape.lineTo(-1, -0.8);
        shape.lineTo(-1, -1);

        const extrudeSettings = {
            depth: 4,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 2,
            bevelSize: 0.05,
            bevelThickness: 0.05,
        };

        const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geom.center();
        return geom;
    }, []);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * (isChaosMode ? 2.5 : 0.2);
            meshRef.current.rotation.y += delta * (isChaosMode ? 1.5 : 0.1);
        }
    });

    return (
        <mesh ref={meshRef} geometry={geometry}>
            {isChaosMode ? (
                <meshPhysicalMaterial
                    color={isChaosMode ? "#1f1f1f" : "#a8a9ad"} // Aluminum colored"
                    emissiveIntensity={0.8}
                    wireframe={true}
                />
            ) : (
                <meshPhysicalMaterial
                    color="#b0c4de"
                    metalness={0.9}
                    roughness={0.1}
                    envMapIntensity={2.0}
                    clearcoat={1.0}
                    clearcoatRoughness={0.1}
                />
            )}
        </mesh>
    );
}

export function HolographicViewer() {
    const { isChaosMode } = useOSStore();

    return (
        <div className="w-full h-full relative bg-transparent flex flex-col">
            <div className="absolute top-4 left-4 z-10 font-mono text-cyan-400 text-xs flex flex-col gap-1 drop-shadow-md pointer-events-none">
                <div>[PROJECTION MATRIX ACTIVE]</div>
                <div className="opacity-70">TARGET: Al-6061 T6 EXTRUSION</div>
                <div className="opacity-70">RENDER: {isChaosMode ? 'AVANT-GARDE WIREFRAME' : 'PHOTOREALISTIC PBR'}</div>
            </div>

            <Canvas
                camera={{ position: [5, 3, 5], fov: 45 }}
                className="flex-1"
                gl={{ antialias: true, alpha: true }}
            >
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1.5} />
                <spotLight position={[-10, 10, -5]} intensity={2} color="#00e5ff" />

                {/* Holographic Grid */}
                <Grid
                    infiniteGrid
                    fadeDistance={20}
                    sectionColor={isChaosMode ? "#ff0000" : "#00e5ff"}
                    cellColor={isChaosMode ? "#ff0000" : "#00e5ff"}
                    position={[0, -2, 0]}
                    sectionSize={1}
                />

                <AluminumExtrusion isChaosMode={isChaosMode} />
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    autoRotate={!isChaosMode}
                    autoRotateSpeed={0.5}
                />
                {!isChaosMode && <Environment preset="city" />}
            </Canvas>
        </div>
    );
}
