import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Edges } from '@react-three/drei';

type Props = {
    width?: number;   // Along X
    height?: number;  // Along Y
    thickness?: number; // Along Z
};

export const Interactive3DBox: React.FC<Props> = ({ width = 100, height = 50, thickness = 30 }) => {
    // Normalizing scales for easier viewing in a confined component space (optional scale tuning)
    const scaleFactor = 0.05;
    const w = width * scaleFactor;
    const h = height * scaleFactor;
    const t = thickness * scaleFactor;

    return (
        <div className="w-full h-full min-h-[250px] relative bg-gradient-to-br from-[#0a0e14] to-[#121820] rounded-b-lg overflow-hidden">
            <Canvas camera={{ position: [5, 5, 5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <Environment preset="city" />

                <mesh position={[0, h / 2, 0]}>
                    <boxGeometry args={[w, h, t]} />
                    <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.2} />
                    {/* Add wireframe-style edges for CAD look */}
                    <Edges scale={1} threshold={15} color="#00e5ff" />
                </mesh>

                <Grid
                    infiniteGrid
                    fadeDistance={50}
                    sectionColor="#00e5ff"
                    sectionThickness={1}
                    cellColor="#3a4b5c"
                    cellThickness={0.5}
                />
                <OrbitControls makeDefault />
            </Canvas>

            {/* Dimensional Callouts Overlay */}
            <div className="absolute top-2 left-2 bg-[#000000]/60 backdrop-blur-sm border border-[#2a3a4a] text-cyan-400 font-mono text-[10px] px-2 py-1 flex flex-col gap-0.5 pointer-events-none rounded">
                <span>W: {width.toFixed(1)}</span>
                <span>H: {height.toFixed(1)}</span>
                <span>T: {thickness.toFixed(1)}</span>
            </div>
        </div>
    );
};
