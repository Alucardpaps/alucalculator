'use client';

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Center, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { usePartStore, ProfileType } from '@/store/usePartStore';

export function Viewer3D() {
    const {
        profileType, width, height, thickness, holeRadius,
        webHeight, flangeWidth, webThickness, flangeThickness, length,
        setMeshRef
    } = usePartStore();

    const geometry = useMemo(() => {
        const shape = new THREE.Shape();

        let extrudeDepth = thickness; // Default for flat plate

        if (profileType === 'flat') {
            shape.moveTo(-width / 2, -height / 2);
            shape.lineTo(width / 2, -height / 2);
            shape.lineTo(width / 2, height / 2);
            shape.lineTo(-width / 2, height / 2);
            shape.lineTo(-width / 2, -height / 2);

            const safeRadius = Math.min(holeRadius, Math.min(width, height) / 2 - 0.1);
            if (safeRadius > 0) {
                const holePath = new THREE.Path();
                holePath.absarc(0, 0, safeRadius, 0, Math.PI * 2, false);
                shape.holes.push(holePath);
            }
        } else if (profileType === 'L-bracket') {
            extrudeDepth = length;
            const cx = -flangeWidth / 2;
            const cy = -webHeight / 2;
            shape.moveTo(cx, cy);
            shape.lineTo(cx + flangeWidth, cy);
            shape.lineTo(cx + flangeWidth, cy + flangeThickness);
            shape.lineTo(cx + webThickness, cy + flangeThickness);
            shape.lineTo(cx + webThickness, cy + webHeight);
            shape.lineTo(cx, cy + webHeight);
            shape.lineTo(cx, cy);
        } else if (profileType === 'U-channel') {
            extrudeDepth = length;
            const cx = -flangeWidth / 2;
            const cy = -webHeight / 2;
            shape.moveTo(cx, cy);
            shape.lineTo(cx + flangeWidth, cy);
            shape.lineTo(cx + flangeWidth, cy + webHeight);
            shape.lineTo(cx + flangeWidth - flangeThickness, cy + webHeight);
            shape.lineTo(cx + flangeWidth - flangeThickness, cy + webThickness);
            shape.lineTo(cx + flangeThickness, cy + webThickness);
            shape.lineTo(cx + flangeThickness, cy + webHeight);
            shape.lineTo(cx, cy + webHeight);
            shape.lineTo(cx, cy);
        } else if (profileType === 'I-beam') {
            extrudeDepth = length;
            const cx = -flangeWidth / 2;
            const cy = -webHeight / 2;
            shape.moveTo(cx, cy);
            shape.lineTo(cx + flangeWidth, cy);
            shape.lineTo(cx + flangeWidth, cy + flangeThickness);
            shape.lineTo(cx + flangeWidth / 2 + webThickness / 2, cy + flangeThickness);
            shape.lineTo(cx + flangeWidth / 2 + webThickness / 2, cy + webHeight - flangeThickness);
            shape.lineTo(cx + flangeWidth, cy + webHeight - flangeThickness);
            shape.lineTo(cx + flangeWidth, cy + webHeight);
            shape.lineTo(cx, cy + webHeight);
            shape.lineTo(cx, cy + webHeight - flangeThickness);
            shape.lineTo(cx + flangeWidth / 2 - webThickness / 2, cy + webHeight - flangeThickness);
            shape.lineTo(cx + flangeWidth / 2 - webThickness / 2, cy + flangeThickness);
            shape.lineTo(cx, cy + flangeThickness);
            shape.lineTo(cx, cy);
        }

        const extrudeSettings = {
            depth: extrudeDepth,
            bevelEnabled: profileType === 'flat', // Only bevel flat plates for esthetics, real profiles are sharp or filleted
            bevelSegments: 3,
            steps: 1,
            bevelSize: 0.5,
            bevelThickness: 0.5
        };

        const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geom.center();
        return geom;
    }, [profileType, width, height, thickness, holeRadius, webHeight, flangeWidth, webThickness, flangeThickness, length]);

    // Choose base reflection based on profile length or thickness
    const baseZ = profileType === 'flat' ? thickness : length;

    return (
        <div className="w-full h-full min-h-[500px] bg-[#050505] rounded-xl overflow-hidden relative border border-white/5 shadow-2xl">
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVybkVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBoNDBNNDAgMEwwIDQwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==')" }} />

            <Canvas shadows camera={{ position: [200, 200, 300], fov: 45 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[100, 100, 100]} castShadow intensity={1.5} shadow-mapSize={2048} />
                <directionalLight position={[-100, -100, -50]} intensity={0.5} color="#00e5ff" />

                <Environment preset="city" />

                <Center>
                    <mesh ref={setMeshRef} geometry={geometry} castShadow receiveShadow>
                        <meshStandardMaterial
                            color="#94a3b8"
                            metalness={0.85}
                            roughness={0.25}
                            envMapIntensity={1.5}
                        />
                    </mesh>
                </Center>

                <ContactShadows position={[0, -webHeight / 2 - 20, 0]} opacity={0.4} scale={500} blur={2} far={50} />

                <Grid infiniteGrid fadeDistance={400} cellColor="#334155" sectionColor="#1e293b" position={[0, -webHeight / 2 - 20, 0]} />
                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
            </Canvas>

            <div className="absolute top-4 left-4 text-[10px] font-mono text-cyan-500 bg-black/50 px-3 py-1.5 rounded backdrop-blur-md border border-cyan-500/20 tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block mr-2 animate-pulse" />
                {profileType} Profile Render
            </div>
        </div>
    );
}
