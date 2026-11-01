/**
 * 🧑‍🏭 WELDMENTS 3D LAYER (CUTTABLE ISO 2553 WELD BEADS & SYMBOLS)
 *
 * Renders physical solid weld beads in the 3D scene.
 * Each weld bead is cuttable via CSG subtraction and responds to click selection.
 */

'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useDesignStore } from '../designStore';
import { createCuttableWeldGeometry } from './weldGeometryFactory';
import type { WeldBead } from './weldmentTypes';

function SingleWeldBeadMesh({
  bead,
  isSelected,
  onSelect,
}: {
  bead: WeldBead;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const globalCuts = useDesignStore((s) => s.cuts);
  const globalHoles = useDesignStore((s) => s.holes);

  // Generate 3D solid cuttable geometry (CSG subtracted)
  const geom = useMemo(() => {
    return createCuttableWeldGeometry(bead, globalCuts, globalHoles);
  }, [
    bead.type,
    bead.legSizeMm,
    bead.lengthMm,
    bead.grooveAngleDeg,
    bead.rootOpeningMm,
    bead.intermittent,
    bead.segmentLengthMm,
    bead.pitchMm,
    bead.cuts,
    bead.holes,
    globalCuts,
    globalHoles,
  ]);

  // Edges geometry for crisp technical CAD contour
  const edgesGeom = useMemo(() => {
    if (!geom) return null;
    return new THREE.EdgesGeometry(geom, 25);
  }, [geom]);

  const pos: [number, number, number] = [
    (bead.position?.x || 0) / 10,
    (bead.position?.y || 0) / 10,
    (bead.position?.z || 0) / 10,
  ];

  const rot: [number, number, number] = [
    ((bead.rotation?.x || 0) * Math.PI) / 180,
    ((bead.rotation?.y || 0) * Math.PI) / 180,
    ((bead.rotation?.z || 0) * Math.PI) / 180,
  ];

  return (
    <group position={pos} rotation={rot}>
      {/* Physical 3D Weld Solid */}
      <mesh
        geometry={geom}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={isSelected ? '#38bdf8' : bead.color || '#f59e0b'}
          metalness={0.75}
          roughness={0.35}
          emissive={isSelected ? '#0284c7' : '#000000'}
          emissiveIntensity={isSelected ? 0.35 : 0}
        />
      </mesh>

      {/* CAD Characteristic Weld Contour Lines */}
      {edgesGeom && (
        <lineSegments geometry={edgesGeom}>
          <lineBasicMaterial
            color={isSelected ? '#38bdf8' : '#78350f'}
            linewidth={isSelected ? 2 : 1}
          />
        </lineSegments>
      )}
    </group>
  );
}

export function WeldmentsLayer() {
  const weldBeads = useDesignStore((s) => s.weldBeads);
  const selectedWeldId = useDesignStore((s) => s.selectedWeldId);
  const setSelectedWeldId = useDesignStore((s) => s.setSelectedWeldId);
  const cadMode = useDesignStore((s) => s.cadMode);

  // Render weld beads in both weldment mode and assembly mode
  if (!weldBeads || weldBeads.length === 0) return null;

  return (
    <group name="WeldmentsLayer">
      {weldBeads.map((bead) => (
        <SingleWeldBeadMesh
          key={bead.id}
          bead={bead}
          isSelected={selectedWeldId === bead.id && cadMode === 'weldment'}
          onSelect={() => setSelectedWeldId(bead.id)}
        />
      ))}
    </group>
  );
}
