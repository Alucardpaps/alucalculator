'use client';

/**
 * AluCalc OS v5.0 — Bolt Mesh
 *
 * Hexagonal head + cylindrical shaft fastener.
 * PURE RENDERING — receives all data via props.
 */

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BoltMeshProps {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  isSelected: boolean;
  isSnappable: boolean;
  isGhost?: boolean;
  onPointerDown?: (e: any) => void;
  onPointerOver?: (e: any) => void;
  onPointerOut?: (e: any) => void;
}

const HEAD_RADIUS = 0.025;
const HEAD_HEIGHT = 0.015;
const SHAFT_RADIUS = 0.012;
const SHAFT_LENGTH = 0.08;

export const BoltMesh = ({
  id,
  position,
  rotation,
  isSelected,
  isSnappable,
  isGhost = false,
  onPointerDown,
  onPointerOver,
  onPointerOut,
}: BoltMeshProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const glowRef = useRef(0);
  useFrame((_, delta) => {
    const target = isSelected ? 1.0 : hovered ? 0.6 : isSnappable ? 0.4 : 0;
    glowRef.current = THREE.MathUtils.lerp(glowRef.current, target, delta * 8);
  });

  const color = useMemo(() => {
    if (isGhost) return '#f472b6';
    if (isSelected) return '#f472b6';
    if (isSnappable) return '#34d399';
    return '#94a3b8';
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
      userData={{ componentId: id, type: 'bolt' }}
    >
      {/* Hex head */}
      <mesh position={[0, SHAFT_LENGTH / 2 + HEAD_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[HEAD_RADIUS, HEAD_RADIUS, HEAD_HEIGHT, 6]} />
        <meshStandardMaterial
          color={color}
          metalness={0.92}
          roughness={0.08}
          transparent={isGhost}
          opacity={opacity}
          emissive={color}
          emissiveIntensity={glowRef.current * 0.3}
        />
      </mesh>

      {/* Shaft */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[SHAFT_RADIUS, SHAFT_RADIUS, SHAFT_LENGTH, 12]} />
        <meshStandardMaterial
          color={color}
          metalness={0.88}
          roughness={0.12}
          transparent={isGhost}
          opacity={opacity}
          emissive={color}
          emissiveIntensity={glowRef.current * 0.2}
        />
      </mesh>

      {/* Thread spirals (visual detail — flat rings) */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={i}
          position={[0, -SHAFT_LENGTH / 4 + (i * SHAFT_LENGTH * 0.6) / 6, 0]}
        >
          <torusGeometry args={[SHAFT_RADIUS + 0.002, 0.001, 4, 12]} />
          <meshStandardMaterial
            color={isGhost ? '#334155' : '#1e293b'}
            transparent={isGhost}
            opacity={isGhost ? 0.2 : 0.6}
          />
        </mesh>
      ))}

      {/* Selection outline */}
      {(isSelected || hovered) && !isGhost && (
        <lineSegments>
          <edgesGeometry
            args={[new THREE.CylinderGeometry(HEAD_RADIUS + 0.005, HEAD_RADIUS + 0.005, SHAFT_LENGTH + HEAD_HEIGHT + 0.01, 6)]}
          />
          <lineBasicMaterial color="#f472b6" linewidth={2} transparent opacity={0.7} />
        </lineSegments>
      )}
    </group>
  );
};
