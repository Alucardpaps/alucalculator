"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stage, Center, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from 'three';
import ClientOnly from "./ClientOnly";
import React, { useMemo } from "react";
import { usePartStore } from "@/store/usePartStore";

class CustomHelixCurve extends THREE.Curve<THREE.Vector3> {
    constructor(public radius: number, public height: number, public turns: number, public taper: number = 0) {
        super();
    }
    getPoint(t: number, optionalTarget = new THREE.Vector3()) {
        const angle = 2 * Math.PI * t * this.turns;
        // Taper Logic: Radius(t) = Base + (t-0.5)*H*Taper
        const r = this.radius + (t - 0.5) * this.height * this.taper;
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);
        const z = this.height * t - (this.height / 2);
        return optionalTarget.set(x, y, z);
    }
}

import { MetalShape } from "@/hooks/useWeightCalculator";

interface TechnicalDrawing3DProps {
    shape: MetalShape | 'gear' | 'bearing' | 'fastener';
    activeField: string | null;
    inputs?: any;
}

// --- GEOMETRY GENERATORS ---

/**
 * Creates a shape path for extrusion.
 * All shapes are drawn in 2D (X-Y plane) and then extruded along Z (Length).
 */
const useProfileGeometry = (shape: MetalShape, inputs: any) => {
    return useMemo(() => {
        const s = new THREE.Shape();

        // Default small values to prevent crash on empty inputs
        const W = Math.max(parseFloat(inputs?.width) || 50, 1);
        const H = Math.max(parseFloat(inputs?.height) || 50, 1);
        const T = Math.max(parseFloat(inputs?.thickness) || 5, 0.1);
        const WT = Math.max(parseFloat(inputs?.wallThickness) || 5, 0.1);
        const D = Math.max(parseFloat(inputs?.diameter) || 50, 1);
        const Tw = Math.max(parseFloat(inputs?.webThickness) || 5, 0.1);
        const Tf = Math.max(parseFloat(inputs?.flangeThickness) || 5, 0.1);

        switch (shape) {
            case 'box':
                // Outer Rect
                s.moveTo(-W / 2, -H / 2);
                s.lineTo(W / 2, -H / 2);
                s.lineTo(W / 2, H / 2);
                s.lineTo(-W / 2, H / 2);
                s.lineTo(-W / 2, -H / 2);

                // Inner Rect (Hole)
                const hole = new THREE.Path();
                const iw = W - 2 * WT;
                const ih = H - 2 * WT;
                if (iw > 0 && ih > 0) {
                    hole.moveTo(-iw / 2, -ih / 2);
                    hole.lineTo(-iw / 2, ih / 2);
                    hole.lineTo(iw / 2, ih / 2);
                    hole.lineTo(iw / 2, -ih / 2);
                    hole.lineTo(-iw / 2, -ih / 2);
                    s.holes.push(hole);
                }
                break;

            case 'sheet':
                s.moveTo(-W / 2, -T / 2);
                s.lineTo(W / 2, -T / 2);
                s.lineTo(W / 2, T / 2);
                s.lineTo(-W / 2, T / 2);
                s.lineTo(-W / 2, -T / 2); // Close
                break;

            case 'pipe':
                s.absarc(0, 0, D / 2, 0, Math.PI * 2, false);
                if (WT < D / 2) {
                    const pipeHole = new THREE.Path();
                    pipeHole.absarc(0, 0, (D / 2) - WT, 0, Math.PI * 2, true);
                    s.holes.push(pipeHole);
                }
                break;

            case 'bar':
                s.absarc(0, 0, D / 2, 0, Math.PI * 2, false);
                break;

            case 'hex': {
                // Hexagon Flat-to-Flat size is D (inputs.diameter)
                const R = (D / 2) / (Math.sqrt(3) / 2);
                for (let i = 0; i <= 6; i++) { // Go to 6 to close path
                    const angle = (i * 60) * Math.PI / 180;
                    const x = R * Math.cos(angle);
                    const y = R * Math.sin(angle);
                    if (i === 0) s.moveTo(x, y);
                    else s.lineTo(x, y);
                }
                break;
            }

            case 'angle':
                // L-Shape. Origin at bottom-left corner
                const w = W, h = H, t = T;
                s.moveTo(0, 0);
                s.lineTo(w, 0);
                s.lineTo(w, t);
                s.lineTo(t, t);
                s.lineTo(t, h);
                s.lineTo(0, h);
                s.lineTo(0, 0); // Close
                break;

            case 'beam':
                // I-Beam. H = Height, W = Width, Tw = Web, Tf = Flange, R = Root Radius (fillet)
                const R = Math.max(parseFloat(inputs?.rootRadius || inputs?.r) || 0, 0); // Radius
                // Top Flange
                s.moveTo(-W / 2, H / 2);
                s.lineTo(W / 2, H / 2);
                s.lineTo(W / 2, H / 2 - Tf);
                // Fillet from Flange to Web
                if (R > 0) {
                    s.lineTo(Tw / 2 + R, H / 2 - Tf);
                    s.absarc(Tw / 2 + R, H / 2 - Tf - R, R, Math.PI / 2, Math.PI, false); // Just a curve?
                    // Standard absarc(x,y,r, start, end). 
                    // We need a specific arc.
                    // The corner is at (Tw/2, H/2 - Tf).
                    // We want a concave fillet.
                    // Center of arc is at (Tw/2 + R, H/2 - Tf - R).
                    // Start angle: PI (left) -> No, standard coord system.
                    // From Top Flange bottom (Horizontal): going Left.
                    // To Web Right (Vertical): going Down.
                    // Actually easier to use quadraticCurveTo or just L if R=0.
                    // Let's use simple Q for visual fillet.
                    s.lineTo(Tw / 2 + R, H / 2 - Tf);
                    s.quadraticCurveTo(Tw / 2, H / 2 - Tf, Tw / 2, H / 2 - Tf - R);
                } else {
                    s.lineTo(Tw / 2, H / 2 - Tf);
                }

                // Web
                if (R > 0) {
                    s.lineTo(Tw / 2, -H / 2 + Tf + R);
                    s.quadraticCurveTo(Tw / 2, -H / 2 + Tf, Tw / 2 + R, -H / 2 + Tf);
                } else {
                    s.lineTo(Tw / 2, -H / 2 + Tf);
                }

                // Bot Flange
                s.lineTo(W / 2, -H / 2 + Tf);
                s.lineTo(W / 2, -H / 2);
                s.lineTo(-W / 2, -H / 2);
                s.lineTo(-W / 2, -H / 2 + Tf);

                if (R > 0) {
                    s.lineTo(-(Tw / 2 + R), -H / 2 + Tf);
                    s.quadraticCurveTo(-Tw / 2, -H / 2 + Tf, -Tw / 2, -H / 2 + Tf + R);
                } else {
                    s.lineTo(-Tw / 2, -H / 2 + Tf);
                }

                // Web Up
                if (R > 0) {
                    s.lineTo(-Tw / 2, H / 2 - Tf - R);
                    s.quadraticCurveTo(-Tw / 2, H / 2 - Tf, -(Tw / 2 + R), H / 2 - Tf);
                } else {
                    s.lineTo(-Tw / 2, H / 2 - Tf);
                }

                s.lineTo(-W / 2, H / 2 - Tf);
                s.lineTo(-W / 2, H / 2); // Close
                break;

            case 'channel':
                // U-Channel
                const Rc = Math.max(parseFloat(inputs?.rootRadius || inputs?.r) || 0, 0);
                s.moveTo(-W / 2, H / 2); // Top Left Out
                s.lineTo(W / 2, H / 2);  // Top Right Out
                s.lineTo(W / 2, H / 2 - Tf); // Top Right In

                // Top Inner Fillet
                if (Rc > 0) {
                    s.lineTo(-W / 2 + Tw + Rc, H / 2 - Tf);
                    s.quadraticCurveTo(-W / 2 + Tw, H / 2 - Tf, -W / 2 + Tw, H / 2 - Tf - Rc);
                } else {
                    s.lineTo(-W / 2 + Tw, H / 2 - Tf); // Inner corner Top
                }

                // Web
                if (Rc > 0) {
                    s.lineTo(-W / 2 + Tw, -H / 2 + Tf + Rc);
                    s.quadraticCurveTo(-W / 2 + Tw, -H / 2 + Tf, -W / 2 + Tw + Rc, -H / 2 + Tf);
                } else {
                    s.lineTo(-W / 2 + Tw, -H / 2 + Tf); // Inner corner Bot
                }

                s.lineTo(W / 2, -H / 2 + Tf); // Bot Right In
                s.lineTo(W / 2, -H / 2); // Bot Right Out
                s.lineTo(-W / 2, -H / 2); // Bot Left Out
                s.lineTo(-W / 2, H / 2); // Close
                break;

            case 'tee':
                // T-Profile
                s.moveTo(-W / 2, H / 2);
                s.lineTo(W / 2, H / 2);
                s.lineTo(W / 2, H / 2 - Tf);
                s.lineTo(Tw / 2, H / 2 - Tf);
                s.lineTo(Tw / 2, -H / 2);
                s.lineTo(-Tw / 2, -H / 2);
                s.lineTo(-Tw / 2, H / 2 - Tf);
                s.lineTo(-W / 2, H / 2 - Tf);
                s.lineTo(-W / 2, H / 2); // Close
                break;
        }

        return s;
    }, [shape, inputs]);
};


export const TechnicalDrawing3D = ({ shape, inputs }: TechnicalDrawing3DProps) => {
    // Determine if this is a standard extruded profile
    const isStandardProfile = useMemo(() => {
        return ['box', 'sheet', 'pipe', 'bar', 'hex', 'angle', 'beam', 'channel', 'tee'].includes(shape as string);
    }, [shape]);

    // Material with Clipping Planes support
    const { sectionX, sectionY, sectionZ, isSectionActive, visibleComponents } = usePartStore();
    
    const clippingPlanes = useMemo(() => {
        if (!isSectionActive) return [];
        return [
            new THREE.Plane(new THREE.Vector3(-1, 0, 0), sectionX * 500 - 250),
            new THREE.Plane(new THREE.Vector3(0, -1, 0), sectionY * 500 - 250),
            new THREE.Plane(new THREE.Vector3(0, 0, -1), sectionZ * 500 - 250),
        ];
    }, [isSectionActive, sectionX, sectionY, sectionZ]);

    const material = useMemo(() => new THREE.MeshStandardMaterial({
        color: "#1a202c", // Black Oxide Base
        roughness: 0.85,  // Matte
        metalness: 0.3,   // Subtle Metallic Sheen
        side: THREE.DoubleSide,
        clippingPlanes: clippingPlanes,
        clipShadows: true
    }), [clippingPlanes]);

    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isExporting, setIsExporting] = React.useState(false);

    const handleDownload = async () => {
        setIsExporting(true);
        try {
            // Dynamic import to avoid SSR issues
            // @ts-ignore
            const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter');
            const exporter = new GLTFExporter();

            // We need to access the scene. 
            // Since we are outside Canvas, we can't easily access the scene ref unless we lift state.
            // Alternative: Add a component INSIDE Canvas that listens to a trigger.
            // Let's use a trigger state passed to a component inside Canvas.
            setExportTrigger(t => t + 1);
        } catch (e) {
            console.error(e);
            setIsExporting(false);
        }
    };

    const [exportTrigger, setExportTrigger] = React.useState(0);

    return (
        <ClientOnly fallback={<div className="w-full h-full min-h-[300px] bg-[#0a1018] rounded-2xl animate-pulse border border-white/5" />}>
            <div className={`w-full h-full min-h-[300px] relative z-10 transition-colors duration-700 bg-transparent group cursor-move rounded-2xl overflow-hidden`}>
                <Canvas shadows dpr={[1, 2]} camera={{ position: [50, 50, 50], fov: 45 }} gl={{ preserveDrawingBuffer: true, antialias: true, alpha: false }}>
                    <color attach="background" args={['#03060a']} />
                    <PerspectiveCamera makeDefault position={[50, 50, 50]} fov={40} />
                    <Stage environment="city" intensity={0.6} adjustCamera={true} preset="rembrandt" shadows="contact">
                        <Center>
                            {isStandardProfile && (visibleComponents.includes('all') || visibleComponents.includes('main')) && (
                                <StandardProfile inputs={inputs} shape={shape as MetalShape} material={material} />
                            )}
                            {shape === 'gear' && (visibleComponents.includes('all') || visibleComponents.includes('gears')) && (
                                <GearAssembly inputs={inputs} material={material} />
                            )}
                            {shape === 'bearing' && (visibleComponents.includes('all') || visibleComponents.includes('bearing')) && (
                                <BearingAssembly inputs={inputs} material={material} />
                            )}
                            {shape === 'fastener' && (visibleComponents.includes('all') || visibleComponents.includes('fastener')) && (
                                <FastenerAssembly inputs={inputs} material={material} />
                            )}
                        </Center>
                    </Stage>
                    <OrbitControls autoRotate autoRotateSpeed={0.5} makeDefault />
                    <Environment preset="city" />
                    <ambientLight intensity={0.4} />
                    <spotLight position={[50, 50, 50]} angle={0.15} penumbra={1} intensity={1} castShadow />
                    <ContactShadows opacity={0.6} scale={20} blur={2.5} far={10} resolution={256} color="#000000" />

                    <SceneExporter trigger={exportTrigger} onExportEnd={() => setIsExporting(false)} />
                </Canvas>

                <div className="absolute bottom-4 left-4 text-[10px] text-slate-400 font-mono pointer-events-none uppercase tracking-widest flex flex-col gap-1 transition-opacity group-hover:opacity-0">
                    <span>Interactive 3D View</span>
                    <span>{shape} Model</span>
                </div>

                {/* Download Button (Visible on Hover) */}
                <button
                    onClick={handleDownload}
                    disabled={isExporting}
                    className="absolute top-4 right-4 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 disabled:opacity-50"
                    title="Download 3D Model (GLTF)"
                >
                    {isExporting ? (
                        <div className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                    )}
                </button>
            </div>
        </ClientOnly>
    );
};

// --- EXPORTER HELPER ---
const SceneExporter = ({ trigger, onExportEnd }: { trigger: number | 'stl', onExportEnd: () => void }) => {
    const { scene } = useThree();

    React.useEffect(() => {
        if (trigger === 0) return;

        if (trigger === 'stl') {
            // STL Export Logic
            import('three/examples/jsm/exporters/STLExporter.js').then(({ STLExporter }) => {
                const exporter = new STLExporter();
                const result = exporter.parse(scene, { binary: true });
                const blob = new Blob([result], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'model.stl';
                link.click();
                URL.revokeObjectURL(url);
                onExportEnd();
            });
            return;
        }

        if (typeof trigger === 'number' && trigger > 0) {
            // GLTF Export Logic (existing)
            import('three/examples/jsm/exporters/GLTFExporter.js').then(({ GLTFExporter }) => {
                const exporter = new GLTFExporter();
                const prevEnv = scene.environment;
                const prevBg = scene.background;
                scene.environment = null;
                scene.background = null;

                exporter.parse(
                    scene,
                    (gltf: any) => {
                        scene.environment = prevEnv;
                        scene.background = prevBg;
                        const blob = new Blob([JSON.stringify(gltf)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = 'model.gltf';
                        link.click();
                        URL.revokeObjectURL(url);
                        onExportEnd();
                    },
                    (err: any) => {
                        scene.environment = prevEnv;
                        scene.background = prevBg;
                        console.error('GLTF Export Error', err);
                        onExportEnd();
                    },
                    { binary: false }
                );
            });
        }
    }, [trigger, scene]);

    return null;
}

// --- SUB-COMPONENTS ---

const StandardProfile = ({ inputs, shape, material }: { inputs: any, shape: MetalShape, material: any }) => {
    const profileShape = useProfileGeometry(shape, inputs);
    // Default length 200 if not specified
    const length = Math.max(parseFloat(inputs?.length) || 100, 1);
    const extrudeSettings = useMemo(() => ({
        depth: length,
        bevelEnabled: false,
        steps: 1
    }), [length]);

    // OPTIMIZATION: Memoize geometry to prevent re-allocation on every render
    const geometry = useMemo(() => new THREE.ExtrudeGeometry(profileShape, extrudeSettings), [profileShape, extrudeSettings]);
    const edgesGeo = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

    return (
        <mesh castShadow receiveShadow material={material} rotation={[0, 0, 0]} geometry={geometry}>
            <lineSegments geometry={edgesGeo}>
                <lineBasicMaterial color="#64748b" linewidth={1} />
            </lineSegments>
        </mesh>
    );
}

// --- GEAR ASSEMBLY ---
const GearAssembly = ({ inputs, material }: { inputs: any, material: THREE.Material }) => {
    // Inputs: z1, z2, module, helixAngle?
    const z1 = Math.max(parseInt(inputs?.z1) || 20, 5);
    const z2 = Math.max(parseInt(inputs?.z2) || 40, 5);
    const mod = Math.max(parseFloat(inputs?.module) || 2, 0.5);
    const width = Math.max(parseFloat(inputs?.width) || 20, 5);

    // Pitch Diameters
    const d1 = z1 * mod;
    const d2 = z2 * mod;
    const centerDist = (d1 + d2) / 2;

    const GearMesh = ({ teeth, radius, color, width }: any) => {
        const shape = useMemo(() => {
            const s = new THREE.Shape();
            const n = teeth;
            const r = radius;
            const toothDepth = mod * 2.25;
            const dedendum = mod * 1.25;
            const addendum = mod;

            // Simplified Cog
            const step = (Math.PI * 2) / n;

            for (let i = 0; i < n; i++) {
                const angle = i * step;
                const angleNext = (i + 1) * step;
                const angleHalf = angle + step / 2;

                // Base circle point
                const rBase = r - dedendum;
                const rTip = r + addendum;

                if (i === 0) s.moveTo(rBase * Math.cos(angle), rBase * Math.sin(angle));
                else s.lineTo(rBase * Math.cos(angle), rBase * Math.sin(angle));

                // Tooth
                s.lineTo(rTip * Math.cos(angle), rTip * Math.sin(angle)); // Up
                s.lineTo(rTip * Math.cos(angleHalf), rTip * Math.sin(angleHalf)); // Across
                s.lineTo(rBase * Math.cos(angleHalf), rBase * Math.sin(angleHalf)); // Down
            }
            s.closePath();
            // Hole
            const hole = new THREE.Path();
            hole.absarc(0, 0, r * 0.2, 0, Math.PI * 2, true);
            s.holes.push(hole);

            return s;
        }, [teeth, radius]);

        const extrudeSettings = useMemo(() => ({ depth: width, bevelEnabled: true, bevelSize: 0.5, bevelThickness: 0.5 }), [width]);
        const geometry = useMemo(() => new THREE.ExtrudeGeometry(shape, extrudeSettings), [shape, extrudeSettings]);

        return (
            <mesh rotation={[0, 0, 0]} geometry={geometry}>
                <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
            </mesh>
        )
    };

    return (
        <group>
            <group position={[-centerDist / 2, 0, 0]}>
                <GearMesh teeth={z1} radius={d1 / 2} color="#f59e0b" width={width} />
            </group>
            <group position={[centerDist / 2, 0, 0]} rotation={[0, 0, Math.PI / z2]}>
                <GearMesh teeth={z2} radius={d2 / 2} color="#3b82f6" width={width} />
            </group>
        </group>
    );
}
// Note: GearAssembly above doesn't use the 'material' prop yet for individual teeth. 
// Let's refactor GearMesh to support the shared material if clipping is needed.

// --- BEARING ASSEMBLY ---
const BearingAssembly = ({ inputs, material }: { inputs: any, material: THREE.Material }) => {
    // Inputs: OD, ID, width (B), type
    const od = Math.max(parseFloat(inputs?.outerDiameter || inputs?.od) || 80, 20);
    const id = Math.max(parseFloat(inputs?.innerDiameter || inputs?.id) || 40, 10);
    const width = Math.max(parseFloat(inputs?.width) || 20, 5);
    const type = inputs?.type || 'ball'; // ball, roller, tapering, needle

    const outerRadius = od / 2;
    const innerRadius = id / 2;
    const avgRadius = (outerRadius + innerRadius) / 2;
    const radialSpace = (outerRadius - innerRadius);

    // Element Sizing
    // Ball: 0.3 * radialSpace radius
    // Roller: Cylinder
    // Tapered: Conical

    const elementSize = radialSpace * 0.6; // Diameter of rolling element
    const count = type === 'needle' ? 24 : type === 'roller' ? 12 : 10;

    const Elements = () => {
        return (
            <group position={[0, 0, width / 2]}>
                {[...Array(count)].map((_, i) => {
                    const angle = (i * 2 * Math.PI) / count;
                    const x = avgRadius * Math.cos(angle);
                    const y = avgRadius * Math.sin(angle);
                    const rotZ = angle;

                    return (
                        <group key={i} position={[x, y, 0]} rotation={[0, 0, rotZ]}>
                            {type === 'ball' && (
                                <mesh>
                                    <sphereGeometry args={[elementSize / 2, 16, 16]} />
                                    <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
                                </mesh>
                            )}
                            {(type === 'roller' || type === 'needle') && (
                                <mesh rotation={[Math.PI / 2, 0, 0]}>
                                    <cylinderGeometry args={[elementSize / 2 * (type === 'needle' ? 0.6 : 0.9), elementSize / 2 * (type === 'needle' ? 0.6 : 0.9), width * 0.8, 16]} />
                                    <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
                                </mesh>
                            )}
                            {type === 'tapered' && (
                                <group rotation={[Math.PI / 2, -0.1, 0]}>
                                    <cylinderGeometry args={[elementSize / 2 * 0.7, elementSize / 2 * 1.1, width * 0.8, 16]} />
                                    <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
                                </group>
                            )}
                        </group>
                    )
                })}
            </group>
        )
    }

    const OuterRing = () => {
        const geometry = useMemo(() => {
            const shape = new THREE.Shape();
            shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
            const hole = new THREE.Path();
            hole.absarc(0, 0, outerRadius - (type === 'needle' ? radialSpace * 0.1 : radialSpace * 0.2), 0, Math.PI * 2, true);
            shape.holes.push(hole);
            const extrudeSettings = { depth: width, bevelEnabled: false };
            return new THREE.ExtrudeGeometry(shape, extrudeSettings);
        }, [outerRadius, type, radialSpace, width]);

        return (
            <mesh geometry={geometry}>
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>
        );
    }

    const InnerRing = () => {
        const geometry = useMemo(() => {
            const shape = new THREE.Shape();
            const ringThick = type === 'needle' ? radialSpace * 0.1 : radialSpace * 0.2;
            shape.absarc(0, 0, innerRadius + ringThick, 0, Math.PI * 2, false);
            const hole = new THREE.Path();
            hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
            shape.holes.push(hole);
            const extrudeSettings = { depth: width, bevelEnabled: false };
            return new THREE.ExtrudeGeometry(shape, extrudeSettings);
        }, [innerRadius, type, radialSpace, width]);

        return (
            <mesh geometry={geometry}>
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>
        );
    }

    const Cage = () => {
        const r = avgRadius;
        return (
            <group position={[0, 0, width / 2]}>
                <mesh rotation={[0, 0, 0]}>
                    <torusGeometry args={[r, elementSize * 0.1, 4, 32]} />
                    <meshStandardMaterial color="#b45309" metalness={0.5} roughness={0.5} />
                </mesh>
            </group>
        )
    }

    return (
        <group>
            <OuterRing />
            <InnerRing />
            <Elements />
            <Cage />
        </group>
    );
}

// --- FASTENER ASSEMBLY ---
// --- FASTENER ASSEMBLY ---
const FastenerAssembly = ({ inputs, material }: { inputs: any, material: THREE.Material }) => {
    // Determine Unit (Metric default)
    const isInch = inputs?.unit === 'inch' || inputs?.unit === 'in' || inputs?.standard?.includes('UNC') || inputs?.standard?.includes('UNF');

    // Base Values
    let dia = parseFloat(inputs?.diameter);
    let len = parseFloat(inputs?.length);
    let pitchInput = parseFloat(inputs?.pitch);

    // Validate & Convert
    if (isNaN(dia) || dia <= 0) dia = 12; // Default 12mm
    if (isNaN(len) || len <= 0) len = 60; // Default 60mm

    // Normalize to MM for 3D Scene
    if (isInch) {
        // If inputs are in inches, convert to mm for visual consistency
        // BUT, check if they are already converted? 
        // Based on FastenersPageClient, inputs.diameter comes from results.majorDia.
        // If results.majorDia is 0.25 (1/4 inch), we must scale it.
        // If results.majorDia is 6.35 (mm), we don't.
        // Assuming raw results for Imperial are in Inches.

        // Dynamic detection: If diameter < 4 (unlikely for mm bolt in this app context unless tiny), assume inches.
        // Or strictly use isInch flag.
        // Let's rely on isInch flag.
        if (dia < 5) { // Heuristic: No M1 or M2 bolt is usually main focus? M1.6 is 1.6mm.
            // Actually, 0.25 inch = 6.35mm.
            // If we have M1.6 (approx 0.06 inch), they overlap.
            // Check inputs.unit explicitly.
            dia *= 25.4;
            len *= 25.4;
        }
    }

    // Pitch Handling
    let pitch = 1.5; // Default coarse
    if (!isNaN(pitchInput) && pitchInput > 0) {
        if (isInch) {
            // Imperial Pitch Input: usually TPI (e.g. 20) or Inch Pitch (0.05)
            // If TPI (> 1), convert to pitch in mm
            if (pitchInput > 1) {
                // TPI
                pitch = 25.4 / pitchInput;
            } else {
                // Inch Pitch
                pitch = pitchInput * 25.4;
            }
        } else {
            // Metric Pitch (mm)
            pitch = pitchInput;
        }
    } else {
        pitch = dia * 0.15; // Auto fallback
    }

    // Safety Clamp
    const headSize = dia * 1.8;
    const headHeight = dia * 0.65;
    const type = inputs?.type || 'bolt';

    // Thread Length
    const threadLen = len * 0.75;
    const nutHeight = dia * 0.8;
    const nutSize = headSize;

    // Detect Pipe Standard (NPT / BSPT / TR)
    const isPipe = inputs?.standard?.includes('NPT') || inputs?.standard?.includes('BSPT') || inputs?.standard?.includes('BST');
    const isNPT = inputs?.standard?.includes('NPT');
    const isBSPT = inputs?.standard?.includes('BSPT');

    // Taper Ratio (1:16 on diameter => 1:32 on radius)
    const taperRatio = isPipe ? (1 / 32) : 0;

    // Visual Constants (Machined Look)
    const bodyColor = "#cbd5e1";
    const coreColor = "#64748b";

    // --- HELIX CURVE GENERATOR ---
    const HelixCurve = useMemo(() => {
        class CustomHelixCurve extends THREE.Curve<THREE.Vector3> {
            constructor(public radius: number, public height: number, public turns: number, public taper: number = 0) {
                super();
            }
            getPoint(t: number, optionalTarget = new THREE.Vector3()) {
                const angle = 2 * Math.PI * t * this.turns;
                // Taper Logic: Radius(t) = Base + (t-0.5)*H*Taper
                const r = this.radius + (t - 0.5) * this.height * this.taper;
                const x = r * Math.cos(angle);
                const y = r * Math.sin(angle);
                const z = this.height * t - (this.height / 2);
                return optionalTarget.set(x, y, z);
            }
        }
        return CustomHelixCurve;
    }, []);

    // Generic Reusable Thread Component with Safety
    const GenericThreads = ({
        length,
        radius,
        position,
        color = "#94a3b8",
        direction = 1,
        rotation = [Math.PI / 2, 0, 0],
        isNPTFlag = false,
        isBSPTFlag = false
    }: {
        length: number,
        radius: number,
        position: [number, number, number],
        color?: string,
        direction?: number,
        rotation?: [number, number, number],
        isNPTFlag?: boolean,
        isBSPTFlag?: boolean
    }) => {
        // CRITICAL SAFETY: Check for NaN or Zero Pitch
        const safePitch = Math.max(pitch, 0.1);
        // Limit turns to prevent crash
        const rawTurns = length / safePitch;
        const maxTurns = 500; // Hard limit to prevent freeze
        const turns = Math.min(Math.abs(rawTurns), maxTurns) * Math.sign(rawTurns) * direction;

        // Pass taper logic
        const taper = Math.abs(turns) > 0 ? taperRatio : 0;

        const curve = useMemo(() => new CustomHelixCurve(radius, length, turns, taper), [radius, length, turns, taper]);

        // Tube radius - Sharpened for machined look (teeth)
        const tubeRadius = useMemo(() => safePitch * 0.45, [safePitch]);

        const tubeParams = useMemo(() => ({
            tubularSegments: Math.min(Math.floor(Math.abs(turns) * 12), 400), // OPTIMIZED FOR 60FPS
            radialSegments: 3 // Sharp V-cut
        }), [turns]);

        const geometry = useMemo(() =>
            new THREE.TubeGeometry(curve, tubeParams.tubularSegments, tubeRadius, tubeParams.radialSegments, false),
            [curve, tubeParams, tubeRadius]
        );

        return (
            <mesh position={position} rotation={rotation as any} geometry={geometry}>
                <meshStandardMaterial
                    color={color || "#6366f1"} // NEON BLUE ACCENT
                    emissive={color || "#6366f1"}
                    emissiveIntensity={0.5}
                    metalness={0.8}
                    roughness={0.2}
                    flatShading={true}
                />
            </mesh>
        );
    }

    // Bolt Specific Thread Wrapper
    const Threads = () => {
        return (
            <group position={[0, -len / 2 + threadLen / 2, 0]}>
                {/* Core Cylinder under threads to prevent see-through */}
                <mesh>
                    {isPipe ? (
                        <cylinderGeometry args={[dia / 2 * 0.85 + (threadLen * taperRatio / 2), dia / 2 * 0.85 - (threadLen * taperRatio / 2), threadLen, 16]} />
                    ) : (
                        <cylinderGeometry args={[dia / 2 * 0.85, dia / 2 * 0.85, threadLen, 16]} />
                    )}
                    <meshStandardMaterial color={coreColor} metalness={0.5} roughness={0.6} />
                </mesh>
                <GenericThreads
                    length={threadLen}
                    radius={dia / 2 * 0.98}
                    position={[0, 0, 0]}
                    isNPTFlag={isNPT}
                    isBSPTFlag={isBSPT}
                    color="#94a3b8"
                />
            </group>
        )
    }

    // Nut Component
    const Nut = () => {
        const shape = useMemo(() => {
            // Hexagon with Rounded Chamfer
            const r = nutSize / 2;
            const s = new THREE.Shape();
            for (let i = 0; i < 6; i++) {
                const angle = (i * 60) * Math.PI / 180;
                const x = r * Math.cos(angle);
                const y = r * Math.sin(angle);
                if (i === 0) s.moveTo(x, y);
                else s.lineTo(x, y);
            }
            s.closePath();
            // Thread Hole (Inner Dia d1)
            const hole = new THREE.Path();
            hole.absarc(0, 0, dia / 2 * 0.9, 0, Math.PI * 2, true);
            s.holes.push(hole);
            return s;
        }, [nutSize, dia]);

        return (
            <group position={type === 'nut' ? [0, 0, 0] : [0, -len * 0.8, 0]}>
                <mesh>
                    <extrudeGeometry args={[shape, { 
                        depth: nutHeight, 
                        bevelEnabled: true, 
                        bevelSize: dia * 0.08, 
                        bevelThickness: dia * 0.08,
                        bevelSegments: 4
                    }]} />
                    <meshStandardMaterial 
                        color={"#a855f7"} // NEON PURPLE
                        emissive={"#a855f7"}
                        emissiveIntensity={0.4}
                        metalness={0.7} 
                        roughness={0.2} 
                        side={THREE.DoubleSide} 
                    />
                </mesh>

                {/* Machined Internal Threads for Nut */}
                <GenericThreads
                    length={nutHeight}
                    radius={dia / 2 * 0.9}
                    position={[0, 0, nutHeight / 2]}
                    color={"#a855f7"}
                    direction={-1}
                    rotation={[0, 0, 0]}
                />
            </group>
        );
    };

    const isExploded = inputs?.exploded === true;

    return (
        <group rotation={[Math.PI / 2, 0, 0]}> {/* Lay flat for view */}

            {/* GUIDE LINE (If exploded) */}
            {isExploded && (
                <line>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            args={[new Float32Array([0, len / 2, 0, 0, -len * 1.2, 0]), 3]}
                            count={2}
                        />
                    </bufferGeometry>
                    <lineDashedMaterial color="#3b82f6" opacity={0.3} transparent dashSize={2} gapSize={1} scale={1} />
                </line>
            )}

            {/* BOLT PARTS */}
            <group position={[0, isExploded ? len * 0.2 : 0, 0]}>
                {/* Hex Head */}
                <mesh position={[0, len / 2 + headHeight / 2, 0]}>
                    <cylinderGeometry args={[headSize / 2, headSize / 2, headHeight, 6]} />
                    <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.5} />
                </mesh>

                {/* Unthreaded Shank (Major Diameter) */}
                <mesh position={[0, (len / 2) - (len - threadLen) / 2, 0]}>
                    <cylinderGeometry args={[dia / 2, dia / 2, len - threadLen, 32]} />
                    <meshStandardMaterial 
                        color="#6366f1" 
                        emissive="#6366f1"
                        emissiveIntensity={0.2}
                        metalness={0.9} 
                        roughness={0.1} 
                    />
                </mesh>

                {/* Threaded Region Core */}
                <mesh position={[0, -len / 2 + threadLen / 2, 0]}>
                    <cylinderGeometry args={[dia / 2 * 0.82, dia / 2 * 0.82, threadLen, 32]} />
                    <meshStandardMaterial color="#0a0a0a" metalness={0.1} roughness={0.9} />
                </mesh>

                {/* Threads */}
                <Threads />

                {/* Chamfered Tip */}
                <mesh position={[0, -len / 2 - (dia * 0.1), 0]}>
                    <cylinderGeometry args={[dia / 2 * 0.7, dia / 2 * 0.85, dia * 0.2, 32]} />
                    <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.4} />
                </mesh>
            </group>

            {/* NUT (Separated if exploded) */}
            <group position={[0, isExploded ? -len * 0.8 : -len / 2 + threadLen * 0.3, 0]}>
                <Nut />
            </group>
        </group>
    )
}
