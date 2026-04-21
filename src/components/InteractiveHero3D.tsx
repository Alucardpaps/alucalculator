"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars, PerspectiveCamera, Environment, Text, Line, useCursor } from "@react-three/drei";
import { useRef, useState, useMemo } from "react";
import * as THREE from "three";

// --- 3D ELEMENTS --- //

const FloatingGear = ({ position, color, speed, scale }: any) => {
    const mesh = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (mesh.current) {
            mesh.current.rotation.z += delta * speed;
            mesh.current.rotation.x += delta * speed * 0.2;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5} position={position}>
            <group ref={mesh} scale={scale}>
                {/* Gear Body */}
                <mesh>
                    <cylinderGeometry args={[1, 1, 0.2, 12]} />
                    <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} wireframe />
                </mesh>
                {/* Teeth */}
                {[...Array(12)].map((_, i) => (
                    <mesh key={i} rotation={[0, (Math.PI * 2 / 12) * i, 0]} position={[1, 0, 0]}>
                        <boxGeometry args={[0.3, 0.2, 0.3]} />
                        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} wireframe />
                    </mesh>
                ))}
            </group>
        </Float>
    );
};

const AbstractBolt = ({ position, color }: any) => {
    return (
        <Float speed={1.5} rotationIntensity={1} floatIntensity={1} position={position}>
            <group rotation={[Math.PI / 4, Math.PI / 4, 0]}>
                <mesh>
                    <cylinderGeometry args={[0.3, 0.3, 2, 6]} />
                    <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} wireframe={false} />
                </mesh>
                <mesh position={[0, 1.2, 0]}>
                    <cylinderGeometry args={[0.5, 0.5, 0.4, 6]} />
                    <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} wireframe={false} />
                </mesh>
            </group>
        </Float>
    );
};

const BlueprintGrid = () => {
    return (
        <gridHelper args={[50, 50, "#1e40af", "#1e3a8a"]} position={[0, -5, 0]} rotation={[0, 0, 0]} />
    );
}

const Scene = () => {
    // Parallax effect
    useFrame(({ mouse, camera }) => {
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 2, 0.05);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, mouse.y * 2 + 2, 0.05);
        camera.lookAt(0, 0, 0);
    });

    return (
        <>
            <ambientLight intensity={0.5} color="#3b82f6" />
            <pointLight position={[10, 10, 10]} intensity={2} color="#60a5fa" />
            <pointLight position={[-10, -5, -10]} intensity={1} color="#f472b6" />

            <FloatingGear position={[-3, 1, -2]} color="#60a5fa" speed={0.5} scale={1} />
            <FloatingGear position={[4, -1, -5]} color="#a78bfa" speed={-0.3} scale={1.5} />
            <FloatingGear position={[-5, -2, 0]} color="#34d399" speed={0.2} scale={0.8} />

            <AbstractBolt position={[2, 2, -1]} color="#f472b6" />
            <AbstractBolt position={[-2, -3, 2]} color="#fbbf24" />

            {/* Connecting Lines for "Network" feel */}
            <Line points={[[-3, 1, -2], [4, -1, -5]]} color="#1e40af" lineWidth={1} transparent opacity={0.3} />
            <Line points={[[-3, 1, -2], [2, 2, -1]]} color="#1e40af" lineWidth={1} transparent opacity={0.3} />

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <BlueprintGrid />
        </>
    );
};

import ClientOnly from './ClientOnly';
import { useOSStore } from '@/store/osStore';
import { useWebGLDetector } from '@/hooks/useWebGLDetector';

export const InteractiveHero3D = ({ lang, dict }: { lang: string, dict: any }) => {
    useWebGLDetector();
    const { isWebGLSupported } = useOSStore();

    return (
        <ClientOnly fallback={<div className="w-full h-[600px] bg-slate-950" />}>
            <section className="relative w-full h-[600px] bg-slate-950 overflow-hidden flex items-center justify-center">
                
                {/* 3D Background with Fallback */}
                <div className="absolute inset-0 z-0">
                    {isWebGLSupported ? (
                        <Canvas dpr={[1, 2]}>
                            <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={50} />
                            <Scene />
                        </Canvas>
                    ) : (
                        <div className="absolute inset-0 bg-[#020408]">
                            <div className="absolute inset-0 opacity-[0.1]" 
                                style={{ 
                                    backgroundImage: 'radial-gradient(circle at 50% 50%, #3b82f6 0%, transparent 70%)',
                                    filter: 'blur(100px)'
                                }} 
                            />
                            {/* Static Grid Fallback */}
                            <div className="absolute inset-0 opacity-[0.05]"
                                style={{
                                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                                    backgroundSize: '100px 100px',
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Overlay Gradient for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent z-10 pointer-events-none"></div>

                {/* Text Content */}
                <div className="relative z-20 text-center space-y-6 max-w-4xl px-4 mt-16 pointer-events-none">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md">
                        <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">v4.0.0 STABLE</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 tracking-tighter drop-shadow-2xl">
                        ENGINEERING<br />
                        <span className="text-blue-500">INTELLIGENCE</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        The advanced toolkit for mechanical engineers. Compute weight, fits, gears, and thermodynamics with precision.
                    </p>

                    <div className="pt-8 pointer-events-auto">
                        {/* Search Bar Placeholder for future interactivity */}
                        <div className="bg-white/5 border border-white/10 p-2 rounded-full max-w-md mx-auto flex backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search calculator (e.g. 'Bolt', 'Gear')..."
                                className="bg-transparent border-none outline-none text-white placeholder-slate-500 flex-1 px-4 font-medium"
                            />
                            <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-full font-bold transition-colors text-sm">
                                GO
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </ClientOnly>
    );
};
