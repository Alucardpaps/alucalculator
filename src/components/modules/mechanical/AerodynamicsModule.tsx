'use client';

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, Activity, Maximize2, Settings2, Box, Plane, Car } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF, Float, Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';

// Aerodynamic logic
export function calculateAerodynamics(velocityMs: number, area: number, cd: number, density: number) {
    const dragForce = 0.5 * density * Math.pow(velocityMs, 2) * cd * area; // N
    const dynamicPressure = 0.5 * density * Math.pow(velocityMs, 2); // Pa
    const powerRequired = dragForce * velocityMs; // W
    return { dragForce, dynamicPressure, powerRequired };
}

const SHAPES = [
    { id: 'cube', name: 'Cube', cd: 1.05, area: 1.0 },
    { id: 'sphere', name: 'Sphere', cd: 0.47, area: 0.785 },
    { id: 'streamlined', name: 'Airfoil/Tear', cd: 0.04, area: 0.5 },
    { id: 'car', name: 'Generic Car', cd: 0.30, area: 2.2 },
];

export default function AerodynamicsModule() {
    const [velocity, setVelocity] = useState(120); // km/h
    const [density, setDensity] = useState(1.225); // kg/m^3 (Air at sea level)
    const [selectedShape, setSelectedShape] = useState(SHAPES[3]); // Car default
    
    // Custom overrides if needed
    const [customCd, setCustomCd] = useState(selectedShape.cd);
    const [customArea, setCustomArea] = useState(selectedShape.area);
    const [useCustom, setUseCustom] = useState(false);

    const cd = useCustom ? customCd : selectedShape.cd;
    const area = useCustom ? customArea : selectedShape.area;
    const velMs = velocity / 3.6; // convert km/h to m/s

    const results = useMemo(() => calculateAerodynamics(velMs, area, cd, density), [velMs, area, cd, density]);

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-[#03060a] text-white overflow-hidden">
            {/* LEFT PANEL - Controls */}
            <div className="w-full lg:w-[350px] shrink-0 flex flex-col h-auto lg:h-full bg-[#080d14]/80 border-r border-white/5 overflow-y-auto">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                            <Wind size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-100">Aerodynamics</h2>
                            <p className="text-[10px] text-blue-400/70 font-semibold uppercase tracking-widest">3D Wind Tunnel</p>
                        </div>
                    </div>
                </div>

                <div className="p-5 space-y-6">
                    {/* Environmental Conditions */}
                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">
                            <Activity size={12} /> Environmental
                        </label>
                        <div className="space-y-4">
                            <div className="bg-[#0e1622] border border-white/5 rounded-xl p-3">
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs text-gray-400">Wind Velocity</span>
                                    <span className="text-xs font-mono text-white">{velocity} km/h</span>
                                </div>
                                <input type="range" min={0} max={300} step={1} value={velocity} onChange={e => setVelocity(Number(e.target.value))} className="w-full accent-blue-500" />
                            </div>
                            <div className="bg-[#0e1622] border border-white/5 rounded-xl p-3">
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs text-gray-400">Air Density (kg/m³)</span>
                                    <span className="text-xs font-mono text-white">{density}</span>
                                </div>
                                <input type="range" min={0.5} max={1.5} step={0.005} value={density} onChange={e => setDensity(Number(e.target.value))} className="w-full accent-blue-500" />
                            </div>
                        </div>
                    </div>

                    {/* Object Profile */}
                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-amber-400 uppercase tracking-widest mb-3">
                            <Box size={12} /> Test Object
                        </label>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            {SHAPES.map(s => (
                                <button key={s.id} onClick={() => { setSelectedShape(s); setUseCustom(false); }}
                                    className={`py-2 px-3 rounded-lg text-left text-xs transition-all border ${selectedShape.id === s.id && !useCustom ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-[#0e1622] border-white/5 text-gray-400 hover:bg-white/5'}`}>
                                    {s.name}
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                            <input type="checkbox" id="useCustom" checked={useCustom} onChange={(e) => setUseCustom(e.target.checked)} className="accent-amber-500" />
                            <label htmlFor="useCustom" className="text-xs text-gray-400 cursor-pointer">Custom Parameters</label>
                        </div>

                        <AnimatePresence>
                            {useCustom && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2 overflow-hidden">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <span className="text-[10px] text-gray-500">Drag Coeff (Cd)</span>
                                            <input type="number" step={0.01} value={customCd} onChange={e => setCustomCd(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 text-white mt-1 outline-none" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[10px] text-gray-500">Ref Area (m²)</span>
                                            <input type="number" step={0.1} value={customArea} onChange={e => setCustomArea(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 text-white mt-1 outline-none" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL - 3D View & Results */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* 3D Scene */}
                <div className="flex-1 bg-gradient-to-b from-[#050a14] to-[#020408] relative">
                    <Canvas camera={{ position: [4, 2, 5], fov: 45 }}>
                        <ambientLight intensity={0.5} />
                        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
                        
                        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                            {selectedShape.id === 'cube' && <mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#3b82f6" roughness={0.2} metalness={0.8} /></mesh>}
                            {selectedShape.id === 'sphere' && <mesh><sphereGeometry args={[0.7, 32, 32]} /><meshStandardMaterial color="#10b981" roughness={0.2} metalness={0.8} /></mesh>}
                            {selectedShape.id === 'streamlined' && <mesh rotation={[0, 0, Math.PI/2]}><capsuleGeometry args={[0.4, 1.5, 4, 16]} /><meshStandardMaterial color="#8b5cf6" roughness={0.2} metalness={0.8} /></mesh>}
                            {selectedShape.id === 'car' && (
                                <mesh position={[0, -0.2, 0]}>
                                    <boxGeometry args={[2.5, 0.8, 1.2]} />
                                    <meshStandardMaterial color="#ef4444" roughness={0.2} metalness={0.8} />
                                    <mesh position={[0, 0.6, 0]}>
                                        <boxGeometry args={[1.2, 0.6, 1]} />
                                        <meshStandardMaterial color="#ef4444" roughness={0.2} metalness={0.8} />
                                    </mesh>
                                </mesh>
                            )}
                        </Float>

                        <WindParticles velocity={velMs} />

                        <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2} far={4} />
                        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2 + 0.1} />
                        <gridHelper args={[20, 20, 0x333333, 0x111111]} position={[0, -1.5, 0]} />
                    </Canvas>

                    {/* Overlay Stats */}
                    <div className="absolute top-6 right-6 flex flex-col gap-3">
                        <StatCard label="Drag Force" value={results.dragForce >= 1000 ? (results.dragForce / 1000).toFixed(2) + ' kN' : results.dragForce.toFixed(1) + ' N'} color="#ef4444" />
                        <StatCard label="Required Power" value={(results.powerRequired / 1000).toFixed(1) + ' kW'} color="#f59e0b" />
                        <StatCard label="Dynamic Pressure" value={results.dynamicPressure.toFixed(1) + ' Pa'} color="#3b82f6" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, color }: { label: string, value: string, color: string }) {
    return (
        <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl min-w-[160px]">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</div>
            <div className="text-2xl font-mono font-black" style={{ color }}>{value}</div>
        </div>
    );
}

// Particle System for Wind Tunnel
function WindParticles({ velocity }: { velocity: number }) {
    const count = 300;
    const ref = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Particle state
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const speed = 0.01 + Math.random() / 200;
            const xFactor = -10 + Math.random() * 20;
            const yFactor = -2 + Math.random() * 4;
            const zFactor = -2 + Math.random() * 4;
            temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
        }
        return temp;
    }, [count]);

    useFrame((state) => {
        if (!ref.current) return;
        const mappedVel = Math.max(0.05, velocity / 50); // Speed factor

        particles.forEach((particle, i) => {
            let { t, speed, xFactor, yFactor, zFactor } = particle;
            t = particle.t += speed * mappedVel;
            
            // X goes from positive to negative (right to left)
            const x = (xFactor - (t * 10)) % 15;
            // Wrap around
            const actualX = x < -10 ? 10 - (x % 10) : x;

            // Give a slight "flow over object" effect in the center
            let y = yFactor;
            let z = zFactor;
            const distToCenter = Math.sqrt(actualX*actualX);
            if (distToCenter < 2) {
                // curve up/down slightly near the object
                y += Math.sin(actualX) * 0.5 * Math.sign(y);
                z += Math.cos(actualX) * 0.5 * Math.sign(z);
            }

            dummy.position.set(actualX, y, z);
            // Scale based on velocity (stretch in wind direction)
            dummy.scale.set(1 + mappedVel * 2, 0.05, 0.05);
            dummy.updateMatrix();
            ref.current!.setMatrixAt(i, dummy.matrix);
        });
        ref.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={ref} args={[undefined, undefined, count]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color="#60a5fa" transparent opacity={0.6} />
        </instancedMesh>
    );
}
