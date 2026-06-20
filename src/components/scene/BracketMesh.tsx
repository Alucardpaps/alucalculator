'use client';

/**
 * AluCalc OS v5.0 — Bracket Mesh
 *
 * L-shaped bracket connector rendered as grouped box geometry.
 * PURE RENDERING — receives all data via props.
 *
 * Supports FEA stress contour overlay driven by global feaActive state.
 */

import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAssemblyStore } from '@/lib/store/assemblyStore';
import { stressToColor, idToStress } from '@/lib/fea/stressUtils';

// ════════════════════════════════════════════
// Component
// ════════════════════════════════════════════

interface BracketMeshProps {
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

const BRACKET_SIZE = 0.15;
const BRACKET_THICKNESS = 0.025;

export const BracketMesh = ({
  id,
  position,
  rotation,
  isSelected,
  isSnappable,
  isGhost = false,
  onPointerDown,
  onPointerOver,
  onPointerOut,
}: BracketMeshProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Global FEA state
  const feaActive = useAssemblyStore((s) => s.feaActive);

  // FEA stress — deterministic per component ID
  const stressValue = useMemo(() => idToStress(id), [id]);
  const stressColor = useMemo(() => stressToColor(stressValue), [stressValue]);

  // Vertical arm gets slightly higher stress (corner concentration)
  const verticalStress = useMemo(() => Math.min(stressValue + 0.15, 1.0), [stressValue]);
  const verticalStressColor = useMemo(() => stressToColor(verticalStress), [verticalStress]);

  const feaVerticalRef = useRef<THREE.MeshStandardMaterial>(null);
  const feaHorizontalRef = useRef<THREE.MeshStandardMaterial>(null);

  const glowRef = useRef(0);
  useFrame((_, delta) => {
    const target = isSelected ? 1.0 : hovered ? 0.6 : isSnappable ? 0.4 : 0;
    glowRef.current = THREE.MathUtils.lerp(glowRef.current, target, delta * 8);

    // Animate FEA emissive pulse
    if (feaActive && !isGhost) {
      const pulse = (Math.sin(Date.now() * 0.003) + 1) * 0.5;
      const intensity = 0.2 + pulse * 0.4;
      if (feaVerticalRef.current) feaVerticalRef.current.emissiveIntensity = intensity;
      if (feaHorizontalRef.current) feaHorizontalRef.current.emissiveIntensity = intensity;
    }
  });

  const color = useMemo(() => {
    if (isGhost) return '#a78bfa';
    if (isSelected) return '#a78bfa';
    if (isSnappable) return '#34d399';
    return '#8b8fa0';
  }, [isGhost, isSelected, isSnappable]);

  const opacity = isGhost ? 0.35 : 1;
  const showFea = feaActive && !isGhost;

  // Memoize outline geometry to prevent GC thrashing during render loops
  const outlineGeometry = useMemo(() => {
    const box = new THREE.BoxGeometry(BRACKET_SIZE + 0.01, BRACKET_SIZE / 2 + 0.01, BRACKET_SIZE + 0.01);
    const edges = new THREE.EdgesGeometry(box);
    return { box, edges };
  }, []);

  // Clean up GPU memory when component unmounts
  useEffect(() => {
    return () => {
      outlineGeometry.box.dispose();
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
      userData={{ componentId: id, type: 'bracket' }}
    >
      {/* Vertical arm */}
      <mesh position={[-BRACKET_SIZE / 2 + BRACKET_THICKNESS / 2, BRACKET_SIZE / 4, 0]} castShadow>
        <boxGeometry args={[BRACKET_THICKNESS, BRACKET_SIZE / 2, BRACKET_SIZE]} />
        {showFea ? (
          <meshStandardMaterial
            ref={feaVerticalRef}
            color={verticalStressColor}
            metalness={0.3}
            roughness={0.5}
            transparent
            opacity={0.92}
            emissive={verticalStressColor}
            emissiveIntensity={0.3}
          />
        ) : (
          <meshStandardMaterial
            color={color}
            metalness={0.8}
            roughness={0.2}
            transparent={isGhost}
            opacity={opacity}
            emissive={color}
            emissiveIntensity={glowRef.current * 0.3}
          />
        )}
      </mesh>

      {/* FEA Wireframe — Vertical arm */}
      {showFea && (
        <mesh position={[-BRACKET_SIZE / 2 + BRACKET_THICKNESS / 2, BRACKET_SIZE / 4, 0]}>
          <boxGeometry args={[BRACKET_THICKNESS + 0.001, BRACKET_SIZE / 2 + 0.001, BRACKET_SIZE + 0.001]} />
          <meshBasicMaterial wireframe wireframeLinewidth={1} color="#ffffff" transparent opacity={0.15} />
        </mesh>
      )}

      {/* Horizontal arm */}
      <mesh position={[0, -BRACKET_THICKNESS / 2, 0]} castShadow>
        <boxGeometry args={[BRACKET_SIZE, BRACKET_THICKNESS, BRACKET_SIZE]} />
        {showFea ? (
          <meshStandardMaterial
            ref={feaHorizontalRef}
            color={stressColor}
            metalness={0.3}
            roughness={0.5}
            transparent
            opacity={0.92}
            emissive={stressColor}
            emissiveIntensity={0.3}
          />
        ) : (
          <meshStandardMaterial
            color={color}
            metalness={0.8}
            roughness={0.2}
            transparent={isGhost}
            opacity={opacity}
            emissive={color}
            emissiveIntensity={glowRef.current * 0.3}
          />
        )}
      </mesh>

      {/* FEA Wireframe — Horizontal arm */}
      {showFea && (
        <mesh position={[0, -BRACKET_THICKNESS / 2, 0]}>
          <boxGeometry args={[BRACKET_SIZE + 0.001, BRACKET_THICKNESS + 0.001, BRACKET_SIZE + 0.001]} />
          <meshBasicMaterial wireframe wireframeLinewidth={1} color="#ffffff" transparent opacity={0.15} />
        </mesh>
      )}

      {/* Bolt holes (visual detail) */}
      {[[-0.03, -BRACKET_THICKNESS / 2, 0], [0.03, -BRACKET_THICKNESS / 2, 0]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.008, 0.008, BRACKET_THICKNESS + 0.002, 8]} />
          <meshStandardMaterial color="#0a0e14" metalness={0.9} roughness={0.4} />
        </mesh>
      ))}

      {/* Selection outline */}
      {(isSelected || hovered) && !isGhost && (
        <lineSegments geometry={outlineGeometry.edges}>
          <lineBasicMaterial color="#a78bfa" linewidth={2} transparent opacity={0.7} />
        </lineSegments>
      )}

      {/* Connection point (center for bracket) */}
      {isSnappable && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color="#34d399" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
};
