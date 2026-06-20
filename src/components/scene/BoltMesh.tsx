'use client';

/**
 * AluCalc OS v5.0 — Bolt Mesh
 *
 * Hexagonal head + cylindrical shaft fastener.
 * PURE RENDERING — receives all data via props.
 *
 * Supports FEA stress contour overlay driven by global feaActive state.
 * Bolts typically show highest stress at the head-shaft junction.
 */

import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAssemblyStore } from '@/lib/store/assemblyStore';
import { stressToColor, idToStress } from '@/lib/fea/stressUtils';

// ════════════════════════════════════════════
// Component
// ════════════════════════════════════════════

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

  // Global FEA state
  const feaActive = useAssemblyStore((s) => s.feaActive);

  // FEA stress — deterministic per component ID
  const stressValue = useMemo(() => idToStress(id), [id]);

  // Head-shaft junction shows highest stress (bolt tensile concentration)
  const headStress = useMemo(() => Math.min(stressValue + 0.2, 1.0), [stressValue]);
  const shaftStress = useMemo(() => stressValue, [stressValue]);
  const headStressColor = useMemo(() => stressToColor(headStress), [headStress]);
  const shaftStressColor = useMemo(() => stressToColor(shaftStress), [shaftStress]);

  const feaHeadRef = useRef<THREE.MeshStandardMaterial>(null);
  const feaShaftRef = useRef<THREE.MeshStandardMaterial>(null);

  const glowRef = useRef(0);
  useFrame((_, delta) => {
    const target = isSelected ? 1.0 : hovered ? 0.6 : isSnappable ? 0.4 : 0;
    glowRef.current = THREE.MathUtils.lerp(glowRef.current, target, delta * 8);

    // Animate FEA emissive pulse
    if (feaActive && !isGhost) {
      const pulse = (Math.sin(Date.now() * 0.003) + 1) * 0.5;
      const intensity = 0.2 + pulse * 0.4;
      if (feaHeadRef.current) feaHeadRef.current.emissiveIntensity = intensity;
      if (feaShaftRef.current) feaShaftRef.current.emissiveIntensity = intensity;
    }
  });

  const color = useMemo(() => {
    if (isGhost) return '#f472b6';
    if (isSelected) return '#f472b6';
    if (isSnappable) return '#34d399';
    return '#94a3b8';
  }, [isGhost, isSelected, isSnappable]);

  const opacity = isGhost ? 0.35 : 1;
  const showFea = feaActive && !isGhost;

  // Memoize outline geometry to prevent GC thrashing during render loops
  const outlineGeometry = useMemo(() => {
    const cyl = new THREE.CylinderGeometry(HEAD_RADIUS + 0.005, HEAD_RADIUS + 0.005, SHAFT_LENGTH + HEAD_HEIGHT + 0.01, 6);
    const edges = new THREE.EdgesGeometry(cyl);
    return { cyl, edges };
  }, []);

  // Clean up GPU memory when component unmounts
  useEffect(() => {
    return () => {
      outlineGeometry.cyl.dispose();
      outlineGeometry.edges.dispose();
    };
  }, [outlineGeometry]);

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
        {showFea ? (
          <meshStandardMaterial
            ref={feaHeadRef}
            color={headStressColor}
            metalness={0.3}
            roughness={0.5}
            transparent
            opacity={0.92}
            emissive={headStressColor}
            emissiveIntensity={0.3}
          />
        ) : (
          <meshStandardMaterial
            color={color}
            metalness={0.92}
            roughness={0.08}
            transparent={isGhost}
            opacity={opacity}
            emissive={color}
            emissiveIntensity={glowRef.current * 0.3}
          />
        )}
      </mesh>

      {/* FEA Wireframe — Head */}
      {showFea && (
        <mesh position={[0, SHAFT_LENGTH / 2 + HEAD_HEIGHT / 2, 0]}>
          <cylinderGeometry args={[HEAD_RADIUS + 0.001, HEAD_RADIUS + 0.001, HEAD_HEIGHT + 0.001, 6]} />
          <meshBasicMaterial wireframe wireframeLinewidth={1} color="#ffffff" transparent opacity={0.15} />
        </mesh>
      )}

      {/* Shaft */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[SHAFT_RADIUS, SHAFT_RADIUS, SHAFT_LENGTH, 12]} />
        {showFea ? (
          <meshStandardMaterial
            ref={feaShaftRef}
            color={shaftStressColor}
            metalness={0.3}
            roughness={0.5}
            transparent
            opacity={0.92}
            emissive={shaftStressColor}
            emissiveIntensity={0.3}
          />
        ) : (
          <meshStandardMaterial
            color={color}
            metalness={0.88}
            roughness={0.12}
            transparent={isGhost}
            opacity={opacity}
            emissive={color}
            emissiveIntensity={glowRef.current * 0.2}
          />
        )}
      </mesh>

      {/* FEA Wireframe — Shaft */}
      {showFea && (
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[SHAFT_RADIUS + 0.001, SHAFT_RADIUS + 0.001, SHAFT_LENGTH + 0.001, 12]} />
          <meshBasicMaterial wireframe wireframeLinewidth={1} color="#ffffff" transparent opacity={0.15} />
        </mesh>
      )}

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
        <lineSegments geometry={outlineGeometry.edges}>
          <lineBasicMaterial color="#f472b6" linewidth={2} transparent opacity={0.7} />
        </lineSegments>
      )}
    </group>
  );
};
