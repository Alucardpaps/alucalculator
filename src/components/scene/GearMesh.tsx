'use client';

import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GearMeshProps {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  teeth?: number;
  module?: number;
  width?: number; // face width (mm)
  isSelected: boolean;
  isSnappable: boolean;
  isGhost?: boolean;
  onPointerDown?: (e: any) => void;
  onPointerOver?: (e: any) => void;
  onPointerOut?: (e: any) => void;
}

export const GearMesh = ({
  id,
  position,
  rotation,
  teeth = 24,
  module = 2,
  width = 20,
  isSelected,
  isSnappable,
  isGhost = false,
  onPointerDown,
  onPointerOver,
  onPointerOut,
}: GearMeshProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Convert mm dimensions to world units (1 unit = 200mm)
  const faceWidth = width / 200;
  const m = module / 200;
  const N = teeth;

  const glowRef = useRef(0);
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetGlow = isSelected ? 1.0 : hovered ? 0.6 : isSnappable ? 0.4 : 0;
    glowRef.current = THREE.MathUtils.lerp(glowRef.current, targetGlow, delta * 8);
  });

  const { geometry, edges } = useMemo(() => {
    // Pitch radius, Outer radius, Root radius
    const Rp = (m * N) / 2;
    const Ro = Rp + m;
    const Rr = Rp - 1.25 * m;
    const Rb = Rp * 0.4; // Center bore radius (e.g. 40% of pitch radius)

    // 1. Generate Gear Outer Shape
    const gearShape = new THREE.Shape();
    const anglePerTooth = (Math.PI * 2) / N;

    for (let i = 0; i < N; i++) {
      const theta0 = i * anglePerTooth;
      // 5-point tooth geometry approximation
      const theta1 = theta0 + anglePerTooth * 0.25;
      const theta2 = theta0 + anglePerTooth * 0.4;
      const theta3 = theta0 + anglePerTooth * 0.6;
      const theta4 = theta0 + anglePerTooth * 0.75;
      const thetaEnd = (i + 1) * anglePerTooth;

      // Point 0: Root start
      const p0 = [Math.cos(theta0) * Rr, Math.sin(theta0) * Rr];
      // Point 1: Flank base rise
      const p1 = [Math.cos(theta1) * Rr, Math.sin(theta1) * Rr];
      // Point 2: Tip peak start
      const p2 = [Math.cos(theta2) * Ro, Math.sin(theta2) * Ro];
      // Point 3: Tip peak end
      const p3 = [Math.cos(theta3) * Ro, Math.sin(theta3) * Ro];
      // Point 4: Flank base fall
      const p4 = [Math.cos(theta4) * Rr, Math.sin(theta4) * Rr];
      // Point End: Root end
      const pEnd = [Math.cos(thetaEnd) * Rr, Math.sin(thetaEnd) * Rr];

      if (i === 0) {
        gearShape.moveTo(p0[0], p0[1]);
      }
      gearShape.lineTo(p1[0], p1[1]);
      gearShape.lineTo(p2[0], p2[1]);
      gearShape.lineTo(p3[0], p3[1]);
      gearShape.lineTo(p4[0], p4[1]);
      gearShape.lineTo(pEnd[0], pEnd[1]);
    }
    gearShape.closePath();

    // 2. Generate Center Bore Hole + Keyway
    // Keyway parameters (scaled)
    const kw = 0.012; // width
    const kh = 0.008; // height/depth
    const boreHole = new THREE.Path();
    
    // Construct clockwise circular path with a square keyway notch at the top
    boreHole.moveTo(0, Rb + kh);
    boreHole.lineTo(kw / 2, Rb + kh);
    boreHole.lineTo(kw / 2, Math.sqrt(Rb*Rb - (kw/2)*(kw/2)));
    
    // Add clockwise arc
    const startAngle = Math.asin(kw / (2 * Rb));
    boreHole.absarc(0, 0, Rb, startAngle, Math.PI * 2 - startAngle, true);
    
    boreHole.lineTo(-kw / 2, Rb + kh);
    boreHole.closePath();

    // Subtract the bore hole from the gear body
    gearShape.holes.push(boreHole);

    // 3. Extrude Geometry
    const extrudeSettings = {
      depth: faceWidth,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.002,
      bevelThickness: 0.002,
      curveSegments: 24,
    };

    const geom = new THREE.ExtrudeGeometry(gearShape, extrudeSettings);
    // Center geometry along extrusion depth
    geom.center();

    const edgeGeom = new THREE.EdgesGeometry(geom);

    return { geometry: geom, edges: edgeGeom };
  }, [N, m, faceWidth]);

  // Clean up WebGL assets on unmount or parameter changes
  useEffect(() => {
    return () => {
      geometry.dispose();
      edges.dispose();
    };
  }, [geometry, edges]);

  const color = useMemo(() => {
    if (isGhost) return '#00e5ff';
    if (isSelected) return '#00e5ff';
    if (isSnappable) return '#34d399';
    return '#64748b'; // Steel color
  }, [isGhost, isSelected, isSnappable]);

  const opacity = isGhost ? 0.35 : 1;

  return (
    <group position={position} rotation={rotation}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        castShadow
        receiveShadow
        onPointerDown={(e) => {
          e.stopPropagation();
          onPointerDown?.(e);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onPointerOver?.(e);
        }}
        onPointerOut={(e) => {
          setHovered(false);
          onPointerOut?.(e);
        }}
        userData={{ componentId: id, type: 'gear' }}
      >
        <meshStandardMaterial
          color={color}
          metalness={0.9}
          roughness={0.2}
          transparent={isGhost}
          opacity={opacity}
          emissive={color}
          emissiveIntensity={glowRef.current * 0.3}
        />
      </mesh>

      {/* Selection/Hover Outline */}
      {(isSelected || hovered) && !isGhost && (
        <lineSegments geometry={edges}>
          <lineBasicMaterial color="#00e5ff" linewidth={2} transparent opacity={0.7} />
        </lineSegments>
      )}
    </group>
  );
};
