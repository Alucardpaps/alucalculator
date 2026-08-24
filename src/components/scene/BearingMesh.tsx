'use client';

import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BearingMeshProps {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  innerDia?: number;
  outerDia?: number;
  width?: number;
  isSelected: boolean;
  isSnappable: boolean;
  isGhost?: boolean;
  onPointerDown?: (e: any) => void;
  onPointerOver?: (e: any) => void;
  onPointerOut?: (e: any) => void;
}

export const BearingMesh = ({
  id,
  position,
  rotation,
  innerDia = 20,
  outerDia = 47,
  width = 14,
  isSelected,
  isSnappable,
  isGhost = false,
  onPointerDown,
  onPointerOver,
  onPointerOut,
}: BearingMeshProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Convert dimensions to world units (1 unit = 200mm)
  const d = innerDia / 200;
  const D = outerDia / 200;
  const B = width / 200;

  const glowRef = useRef(0);
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetGlow = isSelected ? 1.0 : hovered ? 0.6 : isSnappable ? 0.4 : 0;
    glowRef.current = THREE.MathUtils.lerp(glowRef.current, targetGlow, delta * 8);
  });

  const { outerRingGeom, innerRingGeom, cageGeom, ballGeom, outerEdges, innerEdges, ballsInfo } = useMemo(() => {
    const rBore = d / 2;
    const rOuter = D / 2;
    
    // Boundary of rings in the radial gap
    const rInnerMax = rBore + (rOuter - rBore) * 0.25;
    const rOuterMin = rOuter - (rOuter - rBore) * 0.25;
    
    const rCage = (rInnerMax + rOuterMin) / 2;
    const rBall = (rOuterMin - rInnerMax) / 2 * 0.85;

    const extrudeSettings = {
      depth: B,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.001,
      bevelThickness: 0.001,
      curveSegments: 32,
    };

    // 1. Outer Ring Shape (D/2 down to rOuterMin)
    const outerShape = new THREE.Shape();
    outerShape.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
    const outerHole = new THREE.Path();
    outerHole.absarc(0, 0, rOuterMin, 0, Math.PI * 2, true);
    outerShape.holes.push(outerHole);
    const oGeom = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
    oGeom.center();

    // 2. Inner Ring Shape (rInnerMax down to d/2)
    const innerShape = new THREE.Shape();
    innerShape.absarc(0, 0, rInnerMax, 0, Math.PI * 2, false);
    const innerHole = new THREE.Path();
    innerHole.absarc(0, 0, rBore, 0, Math.PI * 2, true);
    innerShape.holes.push(innerHole);
    const iGeom = new THREE.ExtrudeGeometry(innerShape, extrudeSettings);
    iGeom.center();

    // 3. Cage Ring (torus-like geometry)
    const cGeom = new THREE.TorusGeometry(rCage, rBall * 0.2, 8, 32);

    // 4. Ball Geometry
    const bGeom = new THREE.SphereGeometry(rBall, 16, 16);

    // Generate positions for 8 ball bearings
    const ballCount = 8;
    const bInfo = [];
    for (let j = 0; j < ballCount; j++) {
      const angle = (j * Math.PI * 2) / ballCount;
      bInfo.push({
        x: Math.cos(angle) * rCage,
        y: Math.sin(angle) * rCage,
      });
    }

    const oEdges = new THREE.EdgesGeometry(oGeom);
    const iEdges = new THREE.EdgesGeometry(iGeom);

    return {
      outerRingGeom: oGeom,
      innerRingGeom: iGeom,
      cageGeom: cGeom,
      ballGeom: bGeom,
      outerEdges: oEdges,
      innerEdges: iEdges,
      ballsInfo: bInfo,
    };
  }, [d, D, B]);

  useEffect(() => {
    return () => {
      outerRingGeom.dispose();
      innerRingGeom.dispose();
      cageGeom.dispose();
      ballGeom.dispose();
      outerEdges.dispose();
      innerEdges.dispose();
    };
  }, [outerRingGeom, innerRingGeom, cageGeom, ballGeom, outerEdges, innerEdges]);

  const color = useMemo(() => {
    if (isGhost) return '#00e5ff';
    if (isSelected) return '#00e5ff';
    if (isSnappable) return '#34d399';
    return '#94a3b8'; // Polished steel look
  }, [isGhost, isSelected, isSnappable]);

  const opacity = isGhost ? 0.35 : 1;

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
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
      userData={{ componentId: id, type: 'bearing' }}
    >
      {/* Outer Ring */}
      <mesh geometry={outerRingGeom} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          metalness={0.95}
          roughness={0.1}
          transparent={isGhost}
          opacity={opacity}
          emissive={color}
          emissiveIntensity={glowRef.current * 0.15}
        />
      </mesh>

      {/* Inner Ring */}
      <mesh geometry={innerRingGeom} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          metalness={0.95}
          roughness={0.1}
          transparent={isGhost}
          opacity={opacity}
          emissive={color}
          emissiveIntensity={glowRef.current * 0.15}
        />
      </mesh>

      {/* Balls (Steel Spheres) */}
      {!isGhost && ballsInfo.map((ball, index) => (
        <mesh key={index} geometry={ballGeom} position={[ball.x, ball.y, 0]} castShadow>
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={1.0}
            roughness={0.05}
          />
        </mesh>
      ))}

      {/* Cage (Brass retainer ring) */}
      {!isGhost && (
        <mesh geometry={cageGeom} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#b45309" // Brass color
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
      )}

      {/* Selection outlines */}
      {(isSelected || hovered) && !isGhost && (
        <>
          <lineSegments geometry={outerEdges}>
            <lineBasicMaterial color="#00e5ff" linewidth={1} transparent opacity={0.6} />
          </lineSegments>
          <lineSegments geometry={innerEdges}>
            <lineBasicMaterial color="#00e5ff" linewidth={1} transparent opacity={0.6} />
          </lineSegments>
        </>
      )}
    </group>
  );
};
