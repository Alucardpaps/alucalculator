'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PresentationControls, Stage } from '@react-three/drei';
import * as THREE from 'three';

// Procedural Bolt Geometry
function Bolt3D({ d_nom, length, headWidth, headHeight, isTapered, color = "#6366f1" }: any) {
    const groupRef = useRef<THREE.Group>(null);
    const radiusBase = d_nom / 2;
    const taperAngle = 1.7899 * Math.PI / 180;
    const radiusTop = isTapered ? radiusBase - (length * Math.tan(taperAngle)) : radiusBase;
    
    return (
        <group ref={groupRef} rotation={[Math.PI / 2, 0, 0]}>
            {/* Bolt Head (Hexagon) */}
            <mesh position={[0, -headHeight / 2, 0]}>
                <cylinderGeometry args={[headWidth / 2, headWidth / 2, headHeight, 6]} />
                <meshStandardMaterial color={color} roughness={0.4} metalness={0.8} />
            </mesh>
            
            {/* Bolt Body */}
            <mesh position={[0, length / 2, 0]}>
                <cylinderGeometry args={[radiusTop, radiusBase, length, 32]} />
                <meshStandardMaterial color={color} roughness={0.3} metalness={0.9} />
            </mesh>

            {/* Threads (Simplified visual representation) */}
            <mesh position={[0, length * 0.75, 0]}>
                <cylinderGeometry args={[radiusTop * 1.05, ((radiusTop+radiusBase)/2) * 1.05, length * 0.5, 32, 1, false]} />
                <meshStandardMaterial color="#4f46e5" roughness={0.5} metalness={0.7} wireframe={true} opacity={0.3} transparent />
            </mesh>
        </group>
    );
}

// Procedural Nipple Geometry (Pipe)
function Nipple3D({ d_nom, length, hexWidth, hexHeight, isTapered, color = "#6366f1" }: any) {
    const radiusBase = d_nom / 2;
    const hexH = Math.max(d_nom * 0.8, 10);
    const hexW = hexWidth || d_nom * 1.5;
    const threadL = Math.max((length - hexH) / 2, 5);
    
    const taperAngle = 1.7899 * Math.PI / 180;
    const radiusTip = isTapered ? radiusBase - (threadL * Math.tan(taperAngle)) : radiusBase;
    
    return (
        <group rotation={[Math.PI / 2, 0, 0]}>
            {/* Center Hex */}
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[hexW / 2, hexW / 2, hexH, 6]} />
                <meshStandardMaterial color={color} roughness={0.4} metalness={0.8} />
            </mesh>
            
            {/* Top Thread */}
            <mesh position={[0, hexH/2 + threadL/2, 0]}>
                <cylinderGeometry args={[radiusTip, radiusBase, threadL, 32]} />
                <meshStandardMaterial color={color} roughness={0.3} metalness={0.9} />
            </mesh>
            <mesh position={[0, hexH/2 + threadL/2, 0]}>
                <cylinderGeometry args={[radiusTip*1.05, radiusBase*1.05, threadL, 32, 1, false]} />
                <meshStandardMaterial color="#4f46e5" roughness={0.5} metalness={0.7} wireframe={true} opacity={0.3} transparent />
            </mesh>
            
            {/* Bottom Thread */}
            <mesh position={[0, -(hexH/2 + threadL/2), 0]}>
                <cylinderGeometry args={[radiusBase, radiusTip, threadL, 32]} />
                <meshStandardMaterial color={color} roughness={0.3} metalness={0.9} />
            </mesh>
            <mesh position={[0, -(hexH/2 + threadL/2), 0]}>
                <cylinderGeometry args={[radiusBase*1.05, radiusTip*1.05, threadL, 32, 1, false]} />
                <meshStandardMaterial color="#4f46e5" roughness={0.5} metalness={0.7} wireframe={true} opacity={0.3} transparent />
            </mesh>
        </group>
    );
}

// Procedural Nut Geometry
function Nut3D({ d_nom, nutWidth, nutHeight, offset, color = "#00e5ff" }: any) {
    const groupRef = useRef<THREE.Group>(null);
    const radius = d_nom / 2;
    
    // Create hexagon shape with a hole
    const shape = new THREE.Shape();
    const hexRadius = nutWidth / 2;
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        if (i === 0) shape.moveTo(Math.cos(angle) * hexRadius, Math.sin(angle) * hexRadius);
        else shape.lineTo(Math.cos(angle) * hexRadius, Math.sin(angle) * hexRadius);
    }
    shape.closePath();

    const holePath = new THREE.Path();
    holePath.absarc(0, 0, radius, 0, Math.PI * 2, false);
    shape.holes.push(holePath);

    const extrudeSettings = {
        depth: nutHeight,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.5,
        bevelThickness: 0.5,
    };

    return (
        <group ref={groupRef} position={[0, 0, offset]} rotation={[0, 0, 0]}>
            <mesh position={[0, 0, -nutHeight / 2]}>
                <extrudeGeometry args={[shape, extrudeSettings]} />
                <meshStandardMaterial color={color} roughness={0.4} metalness={0.8} />
            </mesh>
        </group>
    );
}

export function FastenerVisualizer3D({ 
    d_nom, 
    pitch, 
    headWidth, 
    headHeight, 
    nutWidth, 
    nutHeight, 
    length = 50, 
    nutOffset = 20,
    isPipe = false,
    isTapered = false
}: any) {
    return (
        <Canvas gl={{ preserveDrawingBuffer: true }} shadows dpr={[1, 2]} camera={{ position: [50, 50, 50], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <spotLight position={[50, 50, 50]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
            <PresentationControls speed={1.5} global zoom={1.2} polar={[-0.2, Math.PI / 3]}>
                <Stage environment="city" intensity={0.6}>
                    {isPipe ? (
                        <Nipple3D d_nom={d_nom} length={length} hexWidth={headWidth} isTapered={isTapered} />
                    ) : (
                        <>
                            <Bolt3D d_nom={d_nom} length={length} headWidth={headWidth} headHeight={headHeight} isTapered={isTapered} />
                            <Nut3D d_nom={d_nom} nutWidth={nutWidth} nutHeight={nutHeight} offset={nutOffset} />
                        </>
                    )}
                </Stage>
            </PresentationControls>
        </Canvas>
    );
}
