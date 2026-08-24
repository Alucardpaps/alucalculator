import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid, Html, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { StructuralEngine3D, Node3D, Element3D } from '../../../engines/structure/StructuralEngine3D';
import { MaterialService, MATERIALS } from '../../../engines/materials/MaterialDatabase';
import { SIGMA_PROFILES } from '../../../data/mechanical/profiles';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Box, Activity, Layers, MousePointer2, PlusCircle, Maximize, Trash2, Cpu, Settings2, Zap, Link, MousePointer } from 'lucide-react';

// --- SUB-COMPONENTS ---

// 1. Node Mesh (Sphere)
const NodeMesh = ({ node, isSelected, onPointerDown, onPointerOver, onPointerOut, deformationScale = 1 }: any) => {
    let color = isSelected ? '#ff0055' : (node.fixed ? '#ffaa00' : '#00e5ff');
    const [hovered, setHover] = useState(false);
    useCursor(hovered);

    const restX = node.restX ?? node.x;
    const restY = node.restY ?? node.y;
    const restZ = node.restZ ?? node.z;

    const posX = (restX + (node.x - restX) * deformationScale) / 1000;
    const posY = (restY + (node.y - restY) * deformationScale) / 1000;
    const posZ = (restZ + (node.z - restZ) * deformationScale) / 1000;

    if (hovered) color = '#ffffff';

    return (
        <group position={[posX, posY, posZ]}>
            <mesh
                onPointerDown={(e) => { e.stopPropagation(); onPointerDown(node.id, e); }}
                onPointerOver={() => { setHover(true); onPointerOver(node.id); }}
                onPointerOut={() => { setHover(false); onPointerOut(); }}
            >
                <sphereGeometry args={[hovered ? 0.08 : 0.05, 16, 16]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
                {node.fixed && (
                    <mesh position={[0, -0.1, 0]}>
                        <coneGeometry args={[0.08, 0.15, 4]} />
                        <meshStandardMaterial color="#ffaa00" wireframe />
                    </mesh>
                )}
            </mesh>
        </group>
    );
};

// 2. Beam Mesh (True Geometry)
const BeamMesh = ({ element, nodes, engine, deformationScale = 1 }: { element: Element3D, nodes: Node3D[], engine: StructuralEngine3D, deformationScale?: number }) => {
    const n1 = nodes.find(n => n.id === element.startNodeId);
    const n2 = nodes.find(n => n.id === element.endNodeId);
    const section = engine.sections.find(s => s.id === element.sectionId);
    const [hovered, setHover] = useState(false);

    // If not found or broken, don't render
    if (!n1 || !n2 || element.broken || !section) return null;

    // Helper for scaled position
    const getPos = (n: Node3D) => {
        const rX = n.restX ?? n.x;
        const rY = n.restY ?? n.y;
        const rZ = n.restZ ?? n.z;
        return new THREE.Vector3(
            (rX + (n.x - rX) * deformationScale) / 1000,
            (rY + (n.y - rY) * deformationScale) / 1000,
            (rZ + (n.z - rZ) * deformationScale) / 1000
        );
    };

    // Geometry Calculation
    const start = getPos(n1);
    const end = getPos(n2);
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();

    // VERY IMPORTANT: Prevent NaN errors if the nodes are at the exact same position
    if (length < 0.001) return null;

    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    // Quaternion points Y up to Direction
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction.clone().normalize());

    // Color Logic (Stress Heatmap)
    const getHeatmapColor = (val: number, max: number) => {
        const ratio = Math.min(val / max, 1);
        if (ratio < 0.25) return new THREE.Color(0, 4 * ratio, 1); // Blue to Cyan
        if (ratio < 0.5) return new THREE.Color(0, 1, 1 - 4 * (ratio - 0.25)); // Cyan to Green
        if (ratio < 0.75) return new THREE.Color(4 * (ratio - 0.5), 1, 0); // Green to Yellow
        return new THREE.Color(1, 1 - 4 * (ratio - 0.75), 0); // Yellow to Red
    };

    const stress = element.stress || 0;
    const mat = engine.materials.find(m => m.id === element.materialId);
    const yieldStress = mat?.yieldStrength || 250;
    const color = getHeatmapColor(stress, yieldStress);

    const isYielded = (element as any).isYielded;
    const isBuckled = (element as any).isBuckled;
    const fatigueLife = (element as any).fatigueLife;
    const bucklingLoad = (element as any).bucklingLoad;

    let finalColor = color;
    if (isBuckled) finalColor = new THREE.Color(1, 0, 1); // Magenta for buckling warning
    if (isYielded) finalColor = new THREE.Color(0.8, 0, 0); // Deep red for plastic yielding
    if (element.broken) finalColor = new THREE.Color(0.2, 0.2, 0.2); // Dark grey

    // Pulse animation logic if needed, but static override is fine for now
    const beamLenMm = Math.round(length * 1000);

    const extrudeSettings = useMemo(() => ({
        depth: length,
        bevelEnabled: false,
        steps: 1
    }), [length]);

    const shape = useMemo(() => {
        const s = new THREE.Shape();
        let w = 0.04; let h = 0.04;
        const name = section.name.toLowerCase();

        if (name.includes('ipe')) {
            w = 0.05; h = 0.1;
            const tf = 0.008; const tw = 0.005;
            s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, -h / 2 + tf); s.lineTo(tw / 2, -h / 2 + tf); s.lineTo(tw / 2, h / 2 - tf); s.lineTo(w / 2, h / 2 - tf); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.lineTo(-w / 2, h / 2 - tf); s.lineTo(-tw / 2, h / 2 - tf); s.lineTo(-tw / 2, -h / 2 + tf); s.lineTo(-w / 2, -h / 2 + tf); s.lineTo(-w / 2, -h / 2);
        } else if (name.includes('sigma') || name.includes('series')) {
            w = (parseInt(name.match(/\d+/)?.[0] || '40') / 1000) || 0.04; h = (parseInt(name.match(/x(\d+)/)?.[1] || name.match(/\d+/)?.[0] || '40') / 1000) || 0.04;
            s.moveTo(-w / 2 + 0.002, -h / 2); s.lineTo(w / 2 - 0.002, -h / 2); s.lineTo(w / 2, -h / 2 + 0.002); s.lineTo(w / 2, h / 2 - 0.002); s.lineTo(w / 2 - 0.002, h / 2); s.lineTo(-w / 2 + 0.002, h / 2); s.lineTo(-w / 2, h / 2 - 0.002); s.lineTo(-w / 2, -h / 2 + 0.002);
        } else {
            s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.lineTo(-w / 2, -h / 2);
        }
        return s;
    }, [section.name]);

    return (
        <group position={midPoint} quaternion={quaternion}>
            <mesh
                rotation={[Math.PI / 2, 0, 0]}
                position={[0, length / 2, 0]}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
            >
                <extrudeGeometry args={[shape, extrudeSettings]} />
                <meshStandardMaterial
                    color={hovered ? '#ffffff' : finalColor}
                    emissive={finalColor}
                    emissiveIntensity={hovered ? 0.3 : (isYielded || isBuckled ? 0.8 : 0.5)}
                    transparent
                    opacity={hovered ? 1 : 0.9}
                    metalness={0.8}
                    roughness={0.2}
                />
            </mesh>
            {hovered && (
                <Html distanceFactor={10} position={[0, 0, 0]}>
                    <div className="bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 text-[9px] text-white font-mono pointer-events-none whitespace-nowrap shadow-2xl flex flex-col gap-1 min-w-[160px]">
                        <div className="flex justify-between items-center border-b border-white/10 pb-1 mb-1">
                            <span className="text-[#00e5ff] font-bold text-[10px]">{section.name}</span>
                            <span className="text-gray-500">{beamLenMm} mm</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Yield:</span>
                            <span>{yieldStress} MPa</span>
                        </div>
                        <div className="flex justify-between font-bold">
                            <span className="text-gray-400">Stress:</span>
                            <span className={stress > yieldStress ? 'text-red-400' : stress > yieldStress * 0.7 ? 'text-amber-400' : 'text-emerald-400'}>
                                {stress.toFixed(2)} MPa
                            </span>
                        </div>
                        <div className="flex justify-between text-[8px]">
                            <span className="text-gray-500">SF:</span>
                            <span className="text-white">{(yieldStress / (stress || 1)).toFixed(2)}</span>
                        </div>

                        {(isYielded || isBuckled || fatigueLife !== undefined) && (
                            <div className="mt-1 pt-1 border-t border-white/10 flex flex-col gap-1">
                                {isYielded && <div className="text-red-400 font-black animate-pulse">! YIELDED (PLASTIC)</div>}
                                {isBuckled && <div className="text-[#ff00ff] font-black animate-pulse">! EULER BUCKLED</div>}
                                {fatigueLife && fatigueLife < Infinity && <div className="text-amber-400">Fatigue: {fatigueLife.toLocaleString()} cycles</div>}
                            </div>
                        )}
                    </div>
                </Html>
            )}
        </group>
    );
};

// 3. Physics & Controls Handler
const SceneContent = ({
    engine,
    onUpdate,
    interactionMode,
    selectedNodes,
    setSelectedNodes,
    isPlaying,
    deformationScale = 1
}: {
    engine: StructuralEngine3D,
    onUpdate: () => void,
    interactionMode: 'DRAG' | 'ADD_NODE' | 'INSPECT',
    selectedNodes: string[],
    setSelectedNodes: React.Dispatch<React.SetStateAction<string[]>>,
    isPlaying: boolean,
    deformationScale?: number
}) => {
    const { camera, raycaster, scene, gl } = useThree();
    const dragNodeRef = useRef<string | null>(null);
    const planeIntersect = new THREE.Vector3();
    const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

    useFrame((state, delta) => {
        if (dragNodeRef.current) {
            const node = engine.nodes.find(n => n.id === dragNodeRef.current);
            if (node) {
                raycaster.setFromCamera(state.pointer, camera);
                raycaster.ray.intersectPlane(dragPlane, planeIntersect);
                node.x = planeIntersect.x * 1000;
                node.z = planeIntersect.z * 1000;
                node.vx = 0; node.vy = 0; node.vz = 0;
            }
        }
        if (isPlaying) {
            engine.stepSimulation(delta * 1000);
            onUpdate();
        }
    });

    const handlePointerDown = (id: string, e: any) => {
        e.stopPropagation();
        const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;

        if (interactionMode === 'DRAG') {
            dragNodeRef.current = id;
            const node = engine.nodes.find(n => n.id === id);
            if (node) dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(node.x / 1000, node.y / 1000, node.z / 1000));
        }

        // Selection Logic
        if (isMulti) {
            setSelectedNodes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        } else {
            setSelectedNodes([id]);
        }
    };

    const handlePointerUp = () => { dragNodeRef.current = null; };

    return (
        <group onPointerUp={handlePointerUp}>
            {engine.nodes.map(node => (
                <NodeMesh
                    key={node.id}
                    node={node}
                    isSelected={selectedNodes.includes(node.id)}
                    deformationScale={deformationScale}
                    onPointerDown={handlePointerDown}
                    onPointerOver={() => { }}
                    onPointerOut={() => { }}
                />
            ))}
            {engine.elements.map(elem => (
                <BeamMesh
                    key={elem.id}
                    element={elem}
                    nodes={engine.nodes}
                    engine={engine}
                    deformationScale={deformationScale}
                />
            ))}
        </group>
    );
};

// --- MAIN CANVAS COMPONENT ---
const BeamCanvas3D = () => {
    const engine = useRef(new StructuralEngine3D());
    const [tick, setTick] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [interactionMode, setInteractionMode] = useState<'DRAG' | 'ADD_NODE' | 'INSPECT'>('DRAG');
    const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
    const [activeMaterial, setActiveMaterial] = useState(MATERIALS[0].id);
    const [activeSection, setActiveSection] = useState(SIGMA_PROFILES[0].name); // Match engine initialization ID
    const [deformationScale, setDeformationScale] = useState(1.0);

    const [chassisW, setChassisW] = useState(2000);
    const [chassisD, setChassisD] = useState(2000);
    const [chassisH, setChassisH] = useState(4000);

    const [manualX, setManualX] = useState(0);
    const [manualY, setManualY] = useState(0);
    const [manualZ, setManualZ] = useState(0);

    const handleUpdate = useCallback(() => setTick(t => t + 1), []);

    // 0. INITIALIZE ENGINE DATA
    useEffect(() => {
        const eng = engine.current;
        // Populate Materials
        eng.materials = MATERIALS.map(m => ({
            ...m,
            activeTreatmentId: 't0',
            activeCoatingId: 'none'
        }));
        // Populate Sections from SIGMA_PROFILES
        eng.sections = SIGMA_PROFILES.map(p => ({
            id: p.name,
            name: p.name,
            A: p.w * p.h, // Simplification for now
            I: p.ix * 10000, // cm4 to mm4
            J: p.iy * 10000 // cm4 to mm4
        }));
        eng.initSimulation();
    }, []);

    // 1. KEYBOARD SHORTCUTS
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                const eng = engine.current;
                eng.nodes = eng.nodes.filter(n => !selectedNodes.includes(n.id));
                // Also remove dangling elements
                eng.elements = eng.elements.filter(el =>
                    !selectedNodes.includes(el.startNodeId) && !selectedNodes.includes(el.endNodeId)
                );
                setSelectedNodes([]);
                setTick(t => t + 1);
            }
            if (e.key === 'Escape') setSelectedNodes([]);
            if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                setSelectedNodes(engine.current.nodes.map(n => n.id));
            }
            if (e.key === 'f') {
                // Toggle fixed status for selected nodes
                engine.current.nodes.forEach(n => {
                    if (selectedNodes.includes(n.id)) n.fixed = !n.fixed;
                });
                engine.current.initSimulation();
                setTick(t => t + 1);
            }
            if (e.key === ' ') {
                e.preventDefault();
                setIsPlaying(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodes]);

    // PRESETS
    const generateChassis = (type: 'TOWER' | 'BEAM' | 'PORTAL' | 'TRUSS') => {
        const eng = engine.current;
        eng.nodes = []; eng.elements = [];

        // Safety check: ensure activeSection exists in engine
        const currentSec = eng.sections.find(s => s.id === activeSection) || eng.sections[0];
        const secId = currentSec ? currentSec.id : SIGMA_PROFILES[0].name;

        if (type === 'TOWER') {
            const n1 = eng.addNode(0, 0, 0, true);
            const n2 = eng.addNode(chassisW, 0, 0, true);
            const n3 = eng.addNode(chassisW, 0, chassisD, true);
            const n4 = eng.addNode(0, 0, chassisD, true);
            const n5 = eng.addNode(0, chassisH, 0);
            const n6 = eng.addNode(chassisW, chassisH, 0);
            const n7 = eng.addNode(chassisW, chassisH, chassisD);
            const n8 = eng.addNode(0, chassisH, chassisD);
            [[n1, n2], [n2, n3], [n3, n4], [n4, n1], [n5, n6], [n6, n7], [n7, n8], [n8, n5], [n1, n5], [n2, n6], [n3, n7], [n4, n8]].forEach(pair => eng.addElement(pair[0], pair[1], activeMaterial, secId));
        } else if (type === 'BEAM') {
            const start = eng.addNode(0, 0, 0, true);
            const end = eng.addNode(chassisW, 0, 0, true);
            eng.addElement(start, end, activeMaterial, secId);
        } else if (type === 'PORTAL') {
            const b1 = eng.addNode(0, 0, 0, true);
            const b2 = eng.addNode(chassisW, 0, 0, true);
            const t1 = eng.addNode(0, chassisH, 0);
            const t2 = eng.addNode(chassisW, chassisH, 0);
            eng.addElement(b1, t1, activeMaterial, secId);
            eng.addElement(b2, t2, activeMaterial, secId);
            eng.addElement(t1, t2, activeMaterial, secId);
        } else if (type === 'TRUSS') {
            const h = chassisH * 0.5;
            const b1 = eng.addNode(0, 0, 0, true);
            const b2 = eng.addNode(chassisW * 0.5, 0, 0);
            const b3 = eng.addNode(chassisW, 0, 0, true);
            const t1 = eng.addNode(chassisW * 0.25, h, 0);
            const t2 = eng.addNode(chassisW * 0.75, h, 0);

            [[b1, b2], [b2, b3], [b1, t1], [t1, b2], [b2, t2], [t2, b3], [t1, t2]].forEach(pair => eng.addElement(pair[0], pair[1], activeMaterial, secId));
        }

        eng.initSimulation(); setTick(t => t + 1);
    };

    return (
        <div className="relative w-full h-full bg-[#020305] overflow-hidden flex font-sans select-none">
            {/* LEFT PANEL: BUILDER */}
            <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="absolute left-6 top-48 bottom-6 w-[280px] z-20 pointer-events-none flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 pointer-events-auto shadow-2xl flex flex-col gap-4">
                    <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.15em] mb-1 flex items-center gap-2">
                        <Cpu size={12} className="text-[#00e5ff]" /> Builder
                    </h3>
                    <div>
                        <h3 className="text-[8px] text-gray-500 font-bold uppercase tracking-[0.15em] mb-2">Material</h3>
                        <select value={activeMaterial} onChange={e => setActiveMaterial(e.target.value)} className="w-full bg-black/50 border border-white/10 text-white text-[11px] p-2 rounded-xl outline-none focus:border-[#00e5ff]">
                            {engine.current.materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <h3 className="text-[8px] text-gray-500 font-bold uppercase tracking-[0.15em] mb-2">Section</h3>
                        <select value={activeSection} onChange={e => setActiveSection(e.target.value)} className="w-full bg-black/50 border border-white/10 text-white text-[11px] p-2 rounded-xl outline-none focus:border-[#00e5ff]">
                            {engine.current.sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <button onClick={() => {
                        if (selectedNodes.length >= 2) {
                            const nodes = selectedNodes.map(id => engine.current.nodes.find(n => n.id === id)).filter(Boolean) as Node3D[];
                            for (let i = 0; i < nodes.length - 1; i++) {
                                engine.current.addElement(nodes[i], nodes[i + 1], activeMaterial, activeSection);
                            }
                            engine.current.initSimulation();
                            setSelectedNodes([]);
                            setTick(t => t + 1);
                        }
                    }} disabled={selectedNodes.length < 2} className={"w-full py-3 text-[10px] font-black tracking-widest rounded-xl transition-all uppercase " + (selectedNodes.length >= 2 ? "bg-[#00e5ff] text-black shadow-[0_0_20px_rgba(0,229,255,0.3)]" : "bg-white/5 text-gray-600 cursor-not-allowed")}>
                        Connect {selectedNodes.length > 0 ? `(${selectedNodes.length})` : ''}
                    </button>

                    <div className="h-px bg-white/5 my-2" />

                    <div className="space-y-3">
                        <h3 className="text-[8px] text-gray-500 font-bold uppercase tracking-[0.15em]">Coordinate Entry (mm)</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {['X', 'Y', 'Z'].map(axis => (
                                <div key={axis}>
                                    <div className="text-[7px] text-gray-600 mb-1 ml-1">{axis}</div>
                                    <input
                                        type="number"
                                        value={axis === 'X' ? manualX : axis === 'Y' ? manualY : manualZ}
                                        onChange={e => {
                                            const v = Number(e.target.value);
                                            if (axis === 'X') setManualX(v);
                                            else if (axis === 'Y') setManualY(v);
                                            else setManualZ(v);
                                        }}
                                        className="w-full bg-black/50 border border-white/5 text-white text-[10px] p-1.5 rounded-lg text-center outline-none focus:border-[#00e5ff]/50"
                                    />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                engine.current.addNode(manualX, manualY, manualZ, true);
                                engine.current.initSimulation();
                                setTick(t => t + 1);
                            }}
                            className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[9px] font-bold text-[#00e5ff] tracking-widest uppercase transition-all"
                        >
                            Add Node (X,Y,Z)
                        </button>
                    </div>

                    <div className="h-px bg-white/5 my-2" />

                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                            { id: 'TOWER', label: 'KULE (TOWER)', icon: Layers },
                            { id: 'BEAM', label: 'RROJE (BEAM)', icon: Link },
                            { id: 'PORTAL', label: 'PORTAL', icon: Maximize },
                            { id: 'TRUSS', label: 'MAKAS (TRUSS)', icon: Zap }
                        ].map(preset => (
                            <button
                                key={preset.id}
                                onClick={() => generateChassis(preset.id as any)}
                                className="py-2.5 text-[9px] bg-white/5 hover:bg-[#00e5ff]/10 border border-white/5 hover:border-[#00e5ff]/30 rounded-xl font-black text-gray-400 hover:text-white transition-all flex flex-col items-center gap-1 group pointer-events-auto"
                            >
                                <preset.icon size={14} className="text-gray-500 group-hover:text-[#00e5ff] transition-colors" />
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* RIGHT PANEL: ANALYZER */}
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="absolute right-6 top-48 bottom-6 w-[320px] z-20 pointer-events-none flex flex-col gap-4">
                <AnimatePresence>
                    {selectedNodes.length > 0 && (
                        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 pointer-events-auto shadow-2xl">
                            <JointAnalyzer nodeId={selectedNodes[0]} engine={engine.current} activeMaterial={activeMaterial} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* TOP CENTER: COMPACT MODE ICONS (Relocated from bottom) */}
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                <div className="flex bg-black/40 backdrop-blur-xl border border-white/10 rounded-full p-1 shadow-2xl items-center gap-1">
                    {[
                        { id: 'DRAG', icon: MousePointer, color: '#00e5ff' },
                        { id: 'ADD_NODE', icon: PlusCircle, color: '#f59e0b' },
                        { id: 'INSPECT', icon: Activity, color: '#ff0055' }
                    ].map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => { setInteractionMode(mode.id as any); setSelectedNodes([]); }}
                            className={"w-10 h-10 flex items-center justify-center rounded-full transition-all relative overflow-hidden " + (interactionMode === mode.id ? "bg-white/10" : "text-gray-500 hover:text-gray-300")}
                            title={mode.id}
                        >
                            {interactionMode === mode.id && (
                                <motion.div layoutId="activeModeGlow" className="absolute inset-0 bg-white/5" />
                            )}
                            <mode.icon size={18} style={{ color: interactionMode === mode.id ? mode.color : 'inherit' }} />
                            {interactionMode === mode.id && (
                                <motion.div layoutId="activeModeDot" className="absolute bottom-1 w-1 h-1 rounded-full" style={{ backgroundColor: mode.color }} />
                            )}
                        </button>
                    ))}
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <button onClick={() => setIsPlaying(!isPlaying)} className={"w-10 h-10 flex items-center justify-center rounded-full transition-all " + (isPlaying ? "text-amber-400 bg-amber-400/5" : "text-emerald-400 bg-emerald-400/5")}>
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button onClick={() => { engine.current.nodes = []; engine.current.elements = []; setTick(t => t + 1); }} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white transition-colors"><RotateCcw size={18} /></button>
                </div>
            </motion.div>

            {/* TOP LEFT: VISUALIZATION CONTROLS */}
            <div className="absolute top-6 left-6 z-30 pointer-events-auto">
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3.5 flex flex-col gap-3 shadow-2xl min-w-[180px]">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                            <span>Deformation</span>
                            <span className="text-[#00e5ff]">{deformationScale.toFixed(1)}x</span>
                        </div>
                        <input type="range" min="1" max="100" step="1" value={deformationScale} onChange={e => setDeformationScale(Number(e.target.value))} className="w-full accent-[#00e5ff] h-1 rounded-full appearance-none bg-white/5 cursor-pointer" />
                    </div>
                    <div className="h-px w-full bg-white/5" />
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase text-[#00e5ff] tracking-widest">
                        <Activity size={12} /> Stress Heatmap
                    </div>
                </div>
            </div>

            {/* TOP RIGHT: LEGEND */}
            <div className="absolute top-6 right-6 z-30 pointer-events-none">
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex flex-col gap-3 min-w-[110px]">
                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest border-b border-white/5 pb-2 text-center">Stress (MPa)</div>
                    <div className="h-32 w-full rounded-md relative overflow-hidden" style={{ background: 'linear-gradient(to top, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)' }}>
                        <div className="absolute inset-x-0 bottom-0 px-2 flex flex-col justify-between h-full pointer-events-none">
                            {[250, 125, 0].map(val => <div key={val} className="flex items-center gap-1.5"><div className="w-1 h-0.5 bg-white/50" /><span className="text-[8px] text-white font-mono font-bold">{val}</span></div>)}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3D SCENE OVERLAY */}
            <div className="absolute inset-0 z-0 bg-[#020305]">
                <Canvas shadows dpr={[1, 2]} camera={{ position: [8, 6, 8], fov: 45 }} gl={{ alpha: false, antialias: true }} onCreated={({ gl, scene }) => { scene.background = new THREE.Color("#020305"); gl.setClearColor("#020305"); }}>
                    <color attach="background" args={["#020305"]} />
                    <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={45} />
                    <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.8} enableDamping dampingFactor={0.05} />
                    <ambientLight intensity={0.4} />
                    <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
                    <spotLight position={[-10, 10, -10]} intensity={1} color="#00e5ff" angle={0.8} />
                    <Environment preset="night" />
                    <Grid infiniteGrid fadeDistance={60} cellColor={'#1e293b'} sectionColor={'#334155'} position={[0, -0.05, 0]} />

                    {/* Ground Plane for Add Node & Deselect */}
                    <mesh
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[0, -0.01, 0]}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            if (interactionMode === 'ADD_NODE') {
                                const p = e.point;
                                // Snap to 100mm grid for precision
                                const snap = 0.5; // meters
                                const sx = Math.round(p.x / snap) * snap;
                                const sz = Math.round(p.z / snap) * snap;

                                // Engineering coordinates are in mm
                                engine.current.addNode(sx * 1000, 0, sz * 1000, true);
                                engine.current.initSimulation();
                                setTick(t => t + 1);
                            } else {
                                setSelectedNodes([]);
                            }
                        }}
                    >
                        <planeGeometry args={[2000, 2000]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>

                    <SceneContent
                        engine={engine.current}
                        onUpdate={handleUpdate}
                        interactionMode={interactionMode}
                        selectedNodes={selectedNodes}
                        setSelectedNodes={setSelectedNodes}
                        isPlaying={isPlaying}
                        deformationScale={deformationScale}
                    />
                </Canvas>
            </div>

            {/* STATUS BAR */}
            <div className="absolute bottom-0 left-0 right-0 h-7 bg-black/70 backdrop-blur-md border-t border-white/5 flex items-center px-6 gap-6 z-30 text-[9px] font-mono text-gray-500">
                <span>Nodes: <span className="text-white">{engine.current.nodes.length}</span></span>
                <span>Elements: <span className="text-white">{engine.current.elements.filter(e => !e.broken).length}</span></span>
                <span className="ml-auto">Physics: <span className={isPlaying ? 'text-emerald-400' : 'text-amber-400'}>{isPlaying ? 'RUNNING' : 'PAUSED'}</span></span>
            </div>
        </div>
    );
};

const JointAnalyzer = ({ nodeId, engine, activeMaterial }: { nodeId: string, engine: StructuralEngine3D, activeMaterial: string }) => {
    const node = engine.nodes.find(n => n.id === nodeId);
    const [jointType, setJointType] = useState<'BOLT' | 'WELD' | 'KEY' | 'PIN'>('BOLT');
    const [forceN, setForceN] = useState(5000);
    const [torqueNm, setTorqueNm] = useState(500);
    const [boltDia, setBoltDia] = useState(12);
    const [boltCount, setBoltCount] = useState(4);
    const [weldS, setWeldS] = useState(5);
    const [weldL, setWeldL] = useState(50);
    const [shaftDia, setShaftDia] = useState(50);
    const [keyW, setKeyW] = useState(14);
    const [keyH, setKeyH] = useState(9);
    const [keyL, setKeyL] = useState(40);
    const [pinDia, setPinDia] = useState(10);
    const [pinT, setPinT] = useState(5);

    if (!node) return null;
    const matProps = engine.materials.find(m => m.id === activeMaterial);
    const yieldStress = matProps?.yieldStrength || 250;
    let result = { stress: 0, sf: 0, status: 'UNKNOWN' };

    switch (jointType) {
        case 'BOLT':
            const areaBolt = (Math.PI * Math.pow(boltDia, 2)) / 4;
            const tauBolt = forceN / (boltCount * areaBolt);
            result.stress = tauBolt; result.sf = yieldStress / (tauBolt || 1);
            break;
        case 'WELD':
            const tauWeld = forceN / (0.707 * weldS * weldL);
            result.stress = tauWeld; result.sf = yieldStress / (tauWeld || 1);
            break;
        case 'KEY':
            const torqueNmm = torqueNm * 1000;
            const tauKey = (2 * torqueNmm) / (shaftDia * keyW * keyL);
            const sigmaKey = (4 * torqueNmm) / (shaftDia * keyH * keyL);
            result.stress = Math.max(tauKey, sigmaKey); result.sf = yieldStress / (result.stress || 1);
            break;
        case 'PIN':
            const areaPin = (Math.PI * Math.pow(pinDia, 2)) / 4;
            const tauPin = forceN / areaPin;
            const sigmaBearing = forceN / (pinDia * pinT);
            result.stress = Math.max(tauPin, sigmaBearing); result.sf = yieldStress / (result.stress || 1);
            break;
    }

    if (result.sf < 1.0) result.status = 'FAIL'; else if (result.sf < 1.5) result.status = 'MARGINAL'; else result.status = 'SAFE';
    const statusColor = result.status === 'SAFE' ? 'text-emerald-400' : result.status === 'MARGINAL' ? 'text-amber-400' : 'text-[#ff0055]';

    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-[#ff0055] text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-2"><Zap size={12} /> Joint Analyzer <span className="ml-auto text-white/40">{node.id.substring(0, 4)}</span></h3>
            <div className="flex bg-black/50 border border-white/10 rounded-xl p-1">
                {['BOLT', 'WELD', 'KEY', 'PIN'].map(type => (
                    <button key={type} onClick={() => setJointType(type as any)} className={"flex-1 py-1 text-[8px] font-bold rounded-lg " + (jointType === type ? "bg-white/10 text-white" : "text-gray-500")}>{type}</button>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2 bg-black/50 p-2 rounded-xl border border-white/5"><span className="text-[8px] text-gray-500 uppercase block text-center mb-1">Load Force (N)</span><input type="number" value={forceN} onChange={e => setForceN(Number(e.target.value))} className="w-full bg-transparent text-[#ff0055] text-center font-mono outline-none text-xs" /></div>
            </div>
            <div className={"mt-2 bg-black/40 p-3 rounded-xl border " + (result.status === 'SAFE' ? 'border-emerald-500/20' : 'border-red-500/20')}>
                <div className="flex justify-between items-center text-[9px] mb-1"><span className="text-gray-400">Stress</span><span className="text-white font-mono">{result.stress.toFixed(2)} MPa</span></div>
                <div className="flex justify-between items-end"><span className={"text-[10px] font-black " + statusColor}>{result.status}</span><span className={"text-2xl font-black font-mono " + statusColor}>{isFinite(result.sf) ? result.sf.toFixed(2) : 'INF'}</span></div>
            </div>
        </div>
    );
};

export default BeamCanvas3D;