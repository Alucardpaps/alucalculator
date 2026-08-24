'use client';

import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface KeyMeshProps {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  length?: number;
  width?: number; // key width
  height?: number; // key height
  isSelected: boolean;
  isSnappable: boolean;
  isGhost?: boolean;
  onPointerDown?: (e: any) => void;
  onPointerOver?: (e: any) => void;
  onPointerOut?: (e: any) => void;
}

export const KeyMesh = ({
  id,
  position,
  rotation,
  length = 20,
  width = 6,
  height = 6,
  isSelected,
  isSnappable,
  isGhost = false,
  onPointerDown,
  onPointerOver,
  onPointerOut,
}: KeyMeshProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Convert mm dimensions to world units (1 unit = 200mm)
  const l = length / 200;
  const w = width / 200;
  const h = height / 200;

  const glowRef = useRef(0);
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetGlow = isSelected ? 1.0 : hovered ? 0.6 : isSnappable ? 0.4 : 0;
    glowRef.current = THREE.MathUtils.lerp(glowRef.current, targetGlow, delta * 8);
  });

  const { geometry, edges } = useMemo(() => {
    // Semicircular ends radius
    const r = w / 2;
    // Length of the straight flat section
    const flatLen = Math.max(0.001, l - w);

    const shape = new THREE.Shape();
    // Start at top-left of the flat section
    shape.moveTo(-flatLen / 2, r);
    // Line to top-right
    shape.lineTo(flatLen / 2, r);
    // Right semicircle cap (clockwise arc from +PI/2 to -PI/2)
    shape.absarc(flatLen / 2, 0, r, Math.PI / 2, -Math.PI / 2, true);
    // Line to bottom-left
    shape.lineTo(-flatLen / 2, -r);
    // Left semicircle cap (clockwise arc from -PI/2 to -3PI/2)
    shape.absarc(-flatLen / 2, 0, r, -Math.PI / 2, -Math.PI * 1.5, true);
    shape.closePath();

    const extrudeSettings = {
      depth: h,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: 0.001,
      bevelThickness: 0.001,
      curveSegments: 16,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();

    const edgeGeom = new THREE.EdgesGeometry(geom);

    return { geometry: geom, edges: edgeGeom };
  }, [l, w, h]);

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
    return '#475569'; // Dark metal color
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
        userData={{ componentId: id, type: 'key' }}
      >
        <meshStandardMaterial
          color={color}
          metalness={0.9}
          roughness={0.3}
          transparent={isGhost}
          opacity={opacity}
          emissive={color}
          emissiveIntensity={glowRef.current * 0.3}
        />
      </mesh>

      {/* Selection outline */}
      {(isSelected || hovered) && !isGhost && (
        <lineSegments geometry={edges}>
          <lineBasicMaterial color="#00e5ff" linewidth={2} transparent opacity={0.7} />
        </lineSegments>
      )}
    </group>
  );
};
