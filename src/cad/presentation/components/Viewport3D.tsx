'use client';

/**
 * 🧊 3D VIEWPORT (Three.js / R3F)
 * 
 * Renders the 3D representation of the geometry.
 * Focuses on material fidelity and lighting to look "Premium Industrial".
 */

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Grid, Environment } from '@react-three/drei';

export function Viewport3D() {
    return (
        <div className="w-full h-full">
            <Canvas shadows dpr={[1, 2]} camera={{ position: [50, 50, 50], fov: 50 }}>
                {/* Environment */}
                <color attach="background" args={['#080c10']} />

                <group position={[0, -5, 0]}>
                    <Grid
                        renderOrder={-1}
                        position={[0, 0, 0]}
                        infiniteGrid
                        cellSize={10}
                        sectionSize={100}
                        fadeDistance={500}
                        sectionColor="#1e2833"
                        cellColor="#0f1620"
                    />
                </group>

                {/* Lights */}
                <ambientLight intensity={0.5} />
                <pointLight position={[100, 100, 100]} intensity={1} castShadow />

                {/* Placeholder Geometry: Gear-like Cylinder */}
                <mesh position={[0, 10, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[20, 20, 10, 32]} />
                    <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.8} />
                </mesh>

                <OrbitControls makeDefault />
                <Environment preset="city" />
            </Canvas>
        </div>
    );
}
