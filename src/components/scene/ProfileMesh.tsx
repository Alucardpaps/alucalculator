'use client';

/**
 * AluCalc OS v5.0 — Profile Mesh
 *
 * Aluminum extrusion profile rendered as box geometry.
 * PURE RENDERING — receives all data via props, zero logic inside.
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
  const feaMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);

  // Global FEA state
  const feaActive = useAssemblyStore((s) => s.feaActive);

  // Get modifiers from state (selective subscription would be better, but we have the id)
  const modifiers = useAssemblyStore((s) => s.components[id]?.modifiers || []);

  // Convert mm length to world units (scale factor: 1 unit = ~200mm)
  const worldLength = (length / 200) * 1.0;
  const profileWidth = 0.08;
  const profileHeight = 0.08;

  // FEA stress — deterministic per component ID
  const stressValue = useMemo(() => idToStress(id), [id]);
  const stressColor = useMemo(() => stressToColor(stressValue), [stressValue]);

  // Glow intensity animation
  const glowRef = useRef(0);
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetGlow = isSelected ? 1.0 : hovered ? 0.6 : isSnappable ? 0.4 : 0;
    glowRef.current = THREE.MathUtils.lerp(glowRef.current, targetGlow, delta * 8);

    // Animate FEA emissive pulse
    if (feaActive && !isGhost && feaMaterialRef.current) {
      const pulse = (Math.sin(Date.now() * 0.003) + 1) * 0.5;
      feaMaterialRef.current.emissiveIntensity = 0.2 + pulse * 0.4;
    }
  });

  const color = useMemo(() => {
    if (isGhost) return '#00e5ff';
    if (isSelected) return '#00e5ff';
    if (isSnappable) return '#34d399';
    return '#a0aec0';
  }, [isGhost, isSelected, isSnappable]);

  const opacity = isGhost ? 0.35 : 1;

  // Resolve material props based on FEA mode
  const showFea = feaActive && !isGhost;

  // Memoize geometry with subtractive cuts to prevent GC thrashing during render loops
  const { geometry, edges } = useMemo(() => {
    const shape = new THREE.Shape();
    // Main profile cross section outline (projected on XZ plane)
    shape.moveTo(-worldLength / 2, -profileWidth / 2);
    shape.lineTo(worldLength / 2, -profileWidth / 2);
    shape.lineTo(worldLength / 2, profileWidth / 2);
    shape.lineTo(-worldLength / 2, profileWidth / 2);
    shape.closePath();

    // Subtract cuts/holes from the profile shape
    modifiers.forEach((mod) => {
      // Map local mm coordinates to 3D units relative to the center
      const localX = (mod.x / 200) * 1.0 - worldLength / 2;
      const localY = (mod.y / 200) * 1.0;

      if (mod.type === 'HOLE' || mod.type === 'THREADED') {
        const r = (mod.diameter || 8) / 400; // radius
        const holePath = new THREE.Path();
        holePath.absarc(localX, localY, r, 0, Math.PI * 2, true);
        shape.holes.push(holePath);
      } else if (mod.type === 'RECT_CUT') {
        const w_cut = (mod.width || 20) / 200;
        const h_cut = (mod.height || 20) / 200;
        const cutPath = new THREE.Path();
        // Clockwise path for clean subtraction
        cutPath.moveTo(localX - w_cut / 2, localY - h_cut / 2);
        cutPath.lineTo(localX - w_cut / 2, localY + h_cut / 2);
        cutPath.lineTo(localX + w_cut / 2, localY + h_cut / 2);
        cutPath.lineTo(localX + w_cut / 2, localY - h_cut / 2);
        cutPath.closePath();
        shape.holes.push(cutPath);
      }
    });

    const extrudeSettings = {
      depth: profileHeight,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.001,
      bevelThickness: 0.001,
      curveSegments: 24,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Rotate geometry so Z-extrusion matches Y-axis height
    geom.rotateX(-Math.PI / 2);
    geom.center(); // Center geometry

    const edgeGeom = new THREE.EdgesGeometry(geom);
    return { geometry: geom, edges: edgeGeom };
  }, [worldLength, profileHeight, profileWidth, modifiers]);

  // Clean up GPU memory when geometry changes or component unmounts
  useEffect(() => {
    return () => {
      geometry.dispose();
      edges.dispose();
    };
  }, [geometry, edges]);

  return (
    <group position={position} rotation={rotation}>
      {/* Main profile body */}
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
        userData={{ componentId: id, type: 'profile' }}
      >
        {showFea ? (
          <meshStandardMaterial
            ref={feaMaterialRef}
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
            metalness={0.85}
            roughness={0.15}
            transparent={isGhost}
            opacity={opacity}
            emissive={color}
            emissiveIntensity={glowRef.current * 0.3}
          />
        )}
      </mesh>

      {/* FEA Wireframe Overlay */}
      {showFea && (
        <mesh geometry={geometry}>
          <meshBasicMaterial wireframe wireframeLinewidth={1} color="#ffffff" transparent opacity={0.15} />
        </mesh>
      )}

      {/* Machining Modifiers Visualization (e.g. thread rings) */}
      {!isGhost && modifiers.map((mod) => {
        const localX = (mod.x / 200) * 1.0 - worldLength / 2;
        const localY = (mod.y / 200) * 1.0;
        const holeDiam = (mod.diameter || 8) / 200;
        
        if (mod.type === 'THREADED') {
          return (
            <group key={mod.id} position={[localX, profileHeight / 2 + 0.001, localY]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.15, 1, 1.15]}>
                <ringGeometry args={[holeDiam / 2, holeDiam / 2 + 0.003, 16]} />
                <meshBasicMaterial color="#60a5fa" transparent opacity={0.8} />
              </mesh>
            </group>
          );
        }
        return null;
        
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
        <lineSegments geometry={edges}>
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
