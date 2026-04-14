'use client';

/**
 * AluCalc OS v5.0 — Profile Mesh
 *
 * Aluminum extrusion profile rendered as box geometry.
 * PURE RENDERING — receives all data via props, zero logic inside.
 */

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAssemblyStore } from '@/lib/store/assemblyStore';

interface ProfileMeshProps {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  length?: number;
  isSelected: boolean;
  isSnappable: boolean;
  isGhost?: boolean;
  onPointerDown?: (e: any) => void;
  onPointerOver?: (e: any) => void;
  onPointerOut?: (e: any) => void;
}

export const ProfileMesh = ({
  id,
  position,
  rotation,
  length = 200,
  isSelected,
  isSnappable,
  isGhost = false,
  onPointerDown,
  onPointerOver,
  onPointerOut,
}: ProfileMeshProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Get modifiers from state (selective subscription would be better, but we have the id)
  const modifiers = useAssemblyStore((s) => s.components[id]?.modifiers || []);

  // Convert mm length to world units (scale factor: 1 unit = ~200mm)
  const worldLength = (length / 200) * 1.0;
  const profileWidth = 0.08;
  const profileHeight = 0.08;

  // Glow intensity animation
  const glowRef = useRef(0);
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetGlow = isSelected ? 1.0 : hovered ? 0.6 : isSnappable ? 0.4 : 0;
    glowRef.current = THREE.MathUtils.lerp(glowRef.current, targetGlow, delta * 8);
  });

  const color = useMemo(() => {
    if (isGhost) return '#00e5ff';
    if (isSelected) return '#00e5ff';
    if (isSnappable) return '#34d399';
    return '#a0aec0';
  }, [isGhost, isSelected, isSnappable]);

  const opacity = isGhost ? 0.35 : 1;

  return (
    <group position={position} rotation={rotation}>
      {/* Main profile body */}
      <mesh
        ref={meshRef}
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
        userData={{ componentId: id, type: 'profile' }}
      >
        <boxGeometry args={[worldLength, profileHeight, profileWidth]} />
        <meshStandardMaterial
          color={color}
          metalness={0.85}
          roughness={0.15}
          transparent={isGhost}
          opacity={opacity}
          emissive={color}
          emissiveIntensity={glowRef.current * 0.3}
        />
      </mesh>

      {/* Machining Modifiers Visualization */}
      {!isGhost && modifiers.map((mod) => {
        // Convert local machining coordinates to 3D positions
        // x is along the profile length
        // y is across the profile width
        const localX = (mod.x / 200) * 1.0 - worldLength / 2;
        const localY = (mod.y / 200) * 1.0; 
        
        if (mod.type === 'HOLE' || mod.type === 'THREADED') {
          const holeDiam = (mod.diameter || 8) / 200;
          return (
            <group key={mod.id} position={[localX, profileHeight / 2, localY]}>
              {/* Hole visual (subtractive look) */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[holeDiam / 2, holeDiam / 2, 0.02, 16]} />
                <meshBasicMaterial color="#000000" />
              </mesh>
              {/* Highlight for threads */}
              {mod.type === 'THREADED' && (
                <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.2, 1, 1.2]}>
                  <ringGeometry args={[holeDiam / 2, holeDiam / 2 + 0.005, 16]} />
                  <meshBasicMaterial color="#60a5fa" transparent opacity={0.6} />
                </mesh>
              )}
            </group>
          );
        }
        
        if (mod.type === 'SURFACE_MILLED') {
          return (
            <mesh key={mod.id} position={[localX, profileHeight / 2, localY]}>
              <boxGeometry args={[0.05, 0.005, 0.05]} />
              <meshBasicMaterial color="#1e293b" transparent opacity={0.6} />
            </mesh>
          );
        }

        return null;
      })}

      {/* Inner channel (profile slot detail) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[worldLength - 0.02, profileHeight * 0.4, profileWidth * 0.4]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.9}
          roughness={0.3}
          transparent={isGhost}
          opacity={isGhost ? 0.2 : 0.8}
        />
      </mesh>

      {/* Selection outline */}
      {(isSelected || hovered) && !isGhost && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(worldLength + 0.01, profileHeight + 0.01, profileWidth + 0.01)]} />
          <lineBasicMaterial color="#00e5ff" linewidth={2} transparent opacity={0.7} />
        </lineSegments>
      )}

      {/* Connection point indicators */}
      {isSnappable && (
        <>
          <mesh position={[-worldLength / 2, 0, 0]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="#34d399" transparent opacity={0.8} />
          </mesh>
          <mesh position={[worldLength / 2, 0, 0]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="#34d399" transparent opacity={0.8} />
          </mesh>
        </>
      )}
    </group>
  );
};
