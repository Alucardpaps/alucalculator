'use client';

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, TransformControls, Edges, Line, Html } from '@react-three/drei';
import {
  useDesignStore,
  customCADGeometries,
  type DesignPart,
  type RenderMode,
  type SectionAxis,
  type Point2D,
  type Point3D,
  type SculptBrush
} from './designStore';
import { loadCADFile } from './cadImporter';
import { calculateAssemblyMassProperties } from './materialsEngine';
import { checkHoleInterferences, ISO_METRIC_HOLES, type HoleItem, type SurfaceFace, type SurfaceCutItem } from './holeStandards';
import { createCustomGeometry } from './geometryFactory';


// ─── BLENDER-STYLE 3D SCULPTING MESH COMPONENT ───
function SolidMesh({ 
  part, 
  renderMode, 
  clippingPlanes,
  isSculptMode,
  onSculptStroke,
  partIndex,
  totalParts,
}: { 
  part: DesignPart; 
  renderMode: RenderMode; 
  clippingPlanes?: THREE.Plane[];
  isSculptMode?: boolean;
  onSculptStroke?: (mutatedGeom: THREE.BufferGeometry) => void;
  partIndex: number;
  totalParts: number;
}) {
  const isSelected = useDesignStore((s) => s.selectedId === part.id);
  const select = useDesignStore((s) => s.select);
  const tool = useDesignStore((s) => s.tool);
  const studioMode = useDesignStore((s) => s.studioMode);
  const explodeFactor = useDesignStore((s) => s.explodeFactor);
  const explodeDirection = useDesignStore((s) => s.explodeDirection);
  const sculptBrush = useDesignStore((s) => s.sculptBrush);
  const sculptRadius = useDesignStore((s) => s.sculptRadius);
  const sculptStrength = useDesignStore((s) => s.sculptStrength);
  const sculptDirection = useDesignStore((s) => s.sculptDirection);
  const sculptSymmetry = useDesignStore((s) => s.sculptSymmetry);
  const sculptVersion = useDesignStore((s) => s.sculptVersion);
  const isolatedPartId = useDesignStore((s) => s.isolatedPartId);
  const ghostIsolated = useDesignStore((s) => s.ghostIsolated);
  const addMeasurement = useDesignStore((s) => s.addMeasurement);
  const addDiameterMeasurement = useDesignStore((s) => s.addDiameterMeasurement);
  const activeMeasureStart = useDesignStore((s) => s.activeMeasureStart);
  const setActiveMeasureStart = useDesignStore((s) => s.setActiveMeasureStart);

  const measureMode = useDesignStore((s) => s.measureMode);
  const sectionSolidCap = useDesignStore((s) => s.sectionSolidCap);
  const facePickMode = useDesignStore((s) => s.facePickMode);
  const setActiveFace = useDesignStore((s) => s.setActiveFace);
  const setFacePickMode = useDesignStore((s) => s.setFacePickMode);
  const clickToPlaceHole = useDesignStore((s) => s.clickToPlaceHole);
  const activeFace = useDesignStore((s) => s.activeFace);

  const isGhost = isolatedPartId ? isolatedPartId !== part.id : false;
  const holes = useDesignStore((s) => s.holes);
  const cuts = useDesignStore((s) => s.cuts);
  const effectiveHoles = useMemo(() => {
    if (isSelected && holes && holes.length > 0) return holes;
    return part.holes || [];
  }, [isSelected, holes, part.holes]);
  const effectiveCuts = useMemo(() => {
    if (isSelected && cuts && cuts.length > 0) return cuts;
    return part.cuts || [];
  }, [isSelected, cuts, part.cuts]);

  const meshRef = useRef<THREE.Mesh>(null);
  const isPointerDownRef = useRef(false);

  // Generate base geometry (with dense subdivision if sculpt mode is active and boolean CSG cuts)
  const geom = useMemo(() => {
    return createCustomGeometry(part, isSculptMode, effectiveHoles, effectiveCuts);
  }, [part.id, part.kind, part.params, part.outer, part.solidOp, isSculptMode, sculptVersion, part.customGeometry, effectiveHoles, effectiveCuts]);

  // ─── 3D RADIAL CAD ASSEMBLY EXPLODED VIEW ENGINE ───
  const geomCenter = useMemo(() => {
    if (!geom) return new THREE.Vector3(0, 0, 0);
    geom.computeBoundingBox();
    const c = new THREE.Vector3();
    if (geom.boundingBox) {
      geom.boundingBox.getCenter(c);
    }
    return c;
  }, [geom]);

  // ─── BLENDER REAL-TIME VERTEX DEFORMATION ENGINE ───
  const applySculptAtPoint = useCallback((worldHitPoint: THREE.Vector3, worldNormal: THREE.Vector3) => {
    const mesh = meshRef.current;
    if (!mesh || !mesh.geometry) return;

    const geometry = mesh.geometry;
    const posAttr = geometry.attributes.position;
    if (!posAttr) return;

    const localHit = mesh.worldToLocal(worldHitPoint.clone());
    const localNormal = worldNormal.clone().transformDirection(new THREE.Matrix4().copy(mesh.matrixWorld).invert()).normalize();

    const brushR = (sculptRadius || 30) / 10;
    const strength = (sculptStrength || 0.5) * 0.4;
    const isAdd = sculptDirection === 'add';
    const dirFactor = isAdd ? 1 : -1;

    const p = new THREE.Vector3();
    const count = posAttr.count;
    let modified = false;

    // Helper for vertex deformation at a specific hit center
    const deformCenter = (targetLocalHit: THREE.Vector3, targetLocalNorm: THREE.Vector3) => {
      for (let i = 0; i < count; i++) {
        p.fromBufferAttribute(posAttr, i);
        const dist = p.distanceTo(targetLocalHit);

        if (dist < brushR) {
          // Smooth cosine bell falloff
          const factor = Math.pow(Math.cos((dist / brushR) * (Math.PI / 2)), 2);
          const delta = strength * factor;

          if (sculptBrush === 'clay' || sculptBrush === 'draw') {
            p.addScaledVector(targetLocalNorm, delta * dirFactor);
          } else if (sculptBrush === 'inflate') {
            const outDir = p.clone().sub(targetLocalHit).normalize();
            if (outDir.lengthSq() < 0.001) outDir.copy(targetLocalNorm);
            p.addScaledVector(outDir, delta * dirFactor);
          } else if (sculptBrush === 'smooth') {
            p.lerp(targetLocalHit, delta * 0.3);
          } else if (sculptBrush === 'pinch') {
            p.lerp(targetLocalHit, delta * 0.5 * dirFactor);
          } else if (sculptBrush === 'flatten') {
            const diff = p.clone().sub(targetLocalHit);
            const planeDist = diff.dot(targetLocalNorm);
            p.addScaledVector(targetLocalNorm, -planeDist * delta * 0.8);
          } else if (sculptBrush === 'grab') {
            p.addScaledVector(targetLocalNorm, delta * dirFactor * 1.5);
          }

          posAttr.setXYZ(i, p.x, p.y, p.z);
          modified = true;
        }
      }
    };

    // 1. Primary Brush Stroke
    deformCenter(localHit, localNormal);

    // 2. X-Symmetry Mirror Stroke (Blender-style)
    if (sculptSymmetry) {
      const symHit = new THREE.Vector3(-localHit.x, localHit.y, localHit.z);
      const symNorm = new THREE.Vector3(-localNormal.x, localNormal.y, localNormal.z);
      deformCenter(symHit, symNorm);
    }

    if (modified) {
      posAttr.needsUpdate = true;
      geometry.computeVertexNormals();
      if (onSculptStroke) onSculptStroke(geometry);
    }
  }, [sculptBrush, sculptRadius, sculptStrength, sculptDirection, sculptSymmetry, onSculptStroke]);


  // Solid Section Stencil Capping Plane calculation
  const capPlaneData = useMemo(() => {
    if (!sectionSolidCap || !clippingPlanes || clippingPlanes.length === 0) return null;
    const p = clippingPlanes[0];
    const normal = p.normal;
    const d = p.constant;
    const pos: [number, number, number] = [normal.x * -d, normal.y * -d, normal.z * -d];
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    return { pos, quat };
  }, [sectionSolidCap, clippingPlanes]);

  // Safe visibility check after all hooks have run
  if (!part.visible && !isGhost) return null;
  if (isGhost && !ghostIsolated) return null;

  let finalPos: [number, number, number] = [part.position.x / 10, part.position.y / 10, part.position.z / 10];
  if (explodeFactor > 0) {
    const f = explodeFactor / 100;
    const basePos = new THREE.Vector3(part.position.x / 10, part.position.y / 10, part.position.z / 10);
    const combinedCenter = new THREE.Vector3().addVectors(basePos, geomCenter);
    const dist = combinedCenter.length();

    let explodeOffset = new THREE.Vector3();
    const idx = partIndex || 0;
    const total = Math.max(1, totalParts || 1);

    if (explodeDirection === 'axial-y') {
      // Vertical explosion: spread parts along Y axis based on their Y position
      const ySign = combinedCenter.y >= 0 ? 1 : -1;
      const magnitude = Math.max(1.5, Math.abs(combinedCenter.y) * 2.5);
      explodeOffset.set(0, ySign * magnitude * f, 0);
      if (Math.abs(combinedCenter.y) < 0.1) {
        // Concentric on Y — use index-based vertical spread
        explodeOffset.set(0, ((idx / total) - 0.5) * 8.0 * f, 0);
      }
    } else if (explodeDirection === 'axial-x') {
      // Horizontal X explosion
      const xSign = combinedCenter.x >= 0 ? 1 : -1;
      const magnitude = Math.max(1.5, Math.abs(combinedCenter.x) * 2.5);
      explodeOffset.set(xSign * magnitude * f, 0, 0);
      if (Math.abs(combinedCenter.x) < 0.1) {
        explodeOffset.set(((idx / total) - 0.5) * 8.0 * f, 0, 0);
      }
    } else if (explodeDirection === 'axial-z') {
      // Depth Z explosion
      const zSign = combinedCenter.z >= 0 ? 1 : -1;
      const magnitude = Math.max(1.5, Math.abs(combinedCenter.z) * 2.5);
      explodeOffset.set(0, 0, zSign * magnitude * f);
      if (Math.abs(combinedCenter.z) < 0.1) {
        explodeOffset.set(0, 0, ((idx / total) - 0.5) * 8.0 * f);
      }
    } else if (explodeDirection === 'linear-sequence') {
      // Spread parts sequentially along Y axis with even spacing
      const spacing = 4.0 * f;
      const totalSpan = (total - 1) * spacing;
      const yOffset = -totalSpan / 2 + idx * spacing;
      explodeOffset.set(0, yOffset, 0);
    } else {
      // Default: radial explosion (original behavior)
      if (dist > 0.1) {
        const dir = combinedCenter.clone().normalize();
        const radialMagnitude = Math.max(1.8, dist * 2.2);
        explodeOffset = dir.multiplyScalar(radialMagnitude * f);
      } else {
        const angle = (idx / total) * Math.PI * 2;
        const elev = ((idx % 3) - 1) * 0.5;
        explodeOffset = new THREE.Vector3(
          Math.cos(angle) * 4.0 * f,
          elev * 4.0 * f,
          Math.sin(angle) * 4.0 * f
        );
      }
    }

    finalPos = [
      basePos.x + explodeOffset.x,
      basePos.y + explodeOffset.y,
      basePos.z + explodeOffset.z,
    ];
  }

  const rot: [number, number, number] = [
    (part.rotation.x * Math.PI) / 180,
    (part.rotation.y * Math.PI) / 180,
    (part.rotation.z * Math.PI) / 180,
  ];
  const scale: [number, number, number] = [part.scale.x, part.scale.y, part.scale.z];

  const color = isGhost ? '#94a3b8' : part.color;
  const emissive = isSelected ? '#1e3a8a' : '#000000';

  // If Ghost mode for non-isolated part in assembly
  if (isGhost) {
    return (
      <mesh ref={meshRef} geometry={geom} position={finalPos} rotation={rot} scale={scale}>
        <meshStandardMaterial
          color="#94a3b8"
          transparent
          opacity={0.15}
          wireframe={false}
          roughness={0.9}
        />
        <Edges scale={1.001} color="#64748b" threshold={35} />
      </mesh>
    );
  }

  return (
    <group>
      {/* ─── STENCIL PASS 1: BACK FACES INCREMENT STENCIL ─── */}
      {sectionSolidCap && clippingPlanes && clippingPlanes.length > 0 && (
        <mesh
          geometry={geom}
          position={finalPos}
          rotation={rot}
          scale={scale}
          renderOrder={1}
        >
          <meshBasicMaterial
            colorWrite={false}
            depthWrite={false}
            side={THREE.BackSide}
            clippingPlanes={clippingPlanes}
            stencilWrite={true}
            stencilRef={0}
            stencilZPass={THREE.IncrementWrapStencilOp}
          />
        </mesh>
      )}

      {/* ─── STENCIL PASS 2: FRONT FACES DECREMENT STENCIL ─── */}
      {sectionSolidCap && clippingPlanes && clippingPlanes.length > 0 && (
        <mesh
          geometry={geom}
          position={finalPos}
          rotation={rot}
          scale={scale}
          renderOrder={2}
        >
          <meshBasicMaterial
            colorWrite={false}
            depthWrite={false}
            side={THREE.FrontSide}
            clippingPlanes={clippingPlanes}
            stencilWrite={true}
            stencilRef={0}
            stencilZPass={THREE.DecrementWrapStencilOp}
          />
        </mesh>
      )}

      {/* ─── MAIN SOLID VISIBLE MESH ─── */}
      <mesh
        ref={meshRef}
        geometry={geom}
        position={finalPos}
        rotation={rot}
        scale={scale}
        renderOrder={3}
        onClick={(e) => {
          // ─── 0. FACE PICK MODE (Yüzey Seçimi) ───
          if (facePickMode && e.face && meshRef.current) {
            e.stopPropagation();
            const mesh = meshRef.current;
            mesh.updateMatrixWorld(true);
            const norm = e.face.normal.clone().transformDirection(mesh.matrixWorld).normalize();
            const absX = Math.abs(norm.x);
            const absY = Math.abs(norm.y);
            const absZ = Math.abs(norm.z);
            let picked: SurfaceFace = 'top';
            if (absY >= absX && absY >= absZ) {
              picked = norm.y > 0 ? 'top' : 'bottom';
            } else if (absZ >= absX && absZ >= absY) {
              picked = norm.z > 0 ? 'front' : 'back';
            } else {
              picked = norm.x > 0 ? 'right' : 'left';
            }
            setActiveFace(picked);
            setFacePickMode(false);
            return;
          }

          if (tool === 'measure' || studioMode === 'inspect') {
            e.stopPropagation();
            const mesh = meshRef.current;

            let normalWorld: THREE.Vector3 | undefined = undefined;
            if (e.face && e.face.normal && mesh) {
              mesh.updateMatrixWorld(true);
              normalWorld = e.face.normal.clone().transformDirection(mesh.matrixWorld).normalize();
            }

            const pt: { x: number; y: number; z: number; nx?: number; ny?: number; nz?: number } = {
              x: Math.round(e.point.x * 100) / 10,
              y: Math.round(e.point.y * 100) / 10,
              z: Math.round(e.point.z * 100) / 10,
              nx: normalWorld ? Math.round(normalWorld.x * 1000) / 1000 : undefined,
              ny: normalWorld ? Math.round(normalWorld.y * 1000) / 1000 : undefined,
              nz: normalWorld ? Math.round(normalWorld.z * 1000) / 1000 : undefined,
            };

            // ─── 1. CYLINDER / HOLE / DIAMETER AUTO-DETECTION ───
            const p = part.params || {};
            let detectedDiameter: number | null = null;
            let detectedCenter: { x: number; y: number; z: number } | null = null;

            if (part.kind === 'cylinder' || part.kind === 'tube' || part.kind === 'pulley') {
              const r = p.radius || (p.diameter ? p.diameter / 2 : 25);
              detectedDiameter = Math.round(r * 2 * 10) / 10;
              detectedCenter = {
                x: Math.round(part.position.x),
                y: Math.round(e.point.y * 10),
                z: Math.round(part.position.z),
              };
            } else if (part.kind === 'sphere') {
              const r = p.radius || 25;
              detectedDiameter = Math.round(r * 2 * 10) / 10;
              detectedCenter = {
                x: Math.round(part.position.x),
                y: Math.round(part.position.y),
                z: Math.round(part.position.z),
              };
            } else {
              // Check if click is near a fastener hole
              const checkHoles = effectiveHoles || [];
              for (const h of checkHoles) {
                const hx = part.position.x + h.x;
                const hz = part.position.z + h.y;
                const distToHole = Math.hypot(pt.x - hx, pt.z - hz);
                const dia = h.size === 'M3' ? 3.4 : h.size === 'M4' ? 4.5 : h.size === 'M5' ? 5.5 : h.size === 'M6' ? 6.6 : h.size === 'M8' ? 9.0 : h.size === 'M10' ? 11.0 : 6.0;
                if (distToHole < dia * 1.6) {
                  detectedDiameter = dia;
                  detectedCenter = { x: Math.round(hx), y: Math.round(pt.y), z: Math.round(hz) };
                  break;
                }
              }

              // If in diameter mode or curved mesh triangle
              if (!detectedDiameter && e.face && mesh) {
                const geomMesh = mesh.geometry;
                const posAttr = geomMesh.attributes.position;
                if (posAttr) {
                  const idx0 = e.face.a;
                  const idx1 = e.face.b;
                  const idx2 = e.face.c;
                  const v0 = new THREE.Vector3().fromBufferAttribute(posAttr, idx0).applyMatrix4(mesh.matrixWorld);
                  const v1 = new THREE.Vector3().fromBufferAttribute(posAttr, idx1).applyMatrix4(mesh.matrixWorld);
                  const v2 = new THREE.Vector3().fromBufferAttribute(posAttr, idx2).applyMatrix4(mesh.matrixWorld);

                  const a = v0.distanceTo(v1);
                  const b = v1.distanceTo(v2);
                  const c = v2.distanceTo(v0);
                  const s = (a + b + c) / 2;
                  const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
                  if (area > 0.0001) {
                    const circumR = (a * b * c) / (4 * area) * 10;
                    if (circumR >= 1.0 && circumR <= 800) {
                      if (measureMode === 'diameter' || (measureMode === 'auto' && e.shiftKey)) {
                        detectedDiameter = Math.round(circumR * 2 * 10) / 10;
                        detectedCenter = {
                          x: Math.round(((v0.x + v1.x + v2.x) / 3) * 10),
                          y: Math.round(((v0.y + v1.y + v2.y) / 3) * 10),
                          z: Math.round(((v0.z + v1.z + v2.z) / 3) * 10),
                        };
                      }
                    }
                  }
                }
              }
            }

            if (detectedDiameter && detectedCenter && (measureMode === 'diameter' || (!activeMeasureStart && (part.kind === 'cylinder' || part.kind === 'tube' || part.kind === 'pulley')))) {
              addDiameterMeasurement(
                detectedCenter,
                detectedDiameter,
                normalWorld ? { x: normalWorld.x, y: normalWorld.y, z: normalWorld.z } : undefined,
                pt
              );
              return;
            }

            // ─── 2. SURFACE & POINT DISTANCE MEASUREMENT ───
            if (!activeMeasureStart) {
              setActiveMeasureStart(pt);
            } else {
              addMeasurement(activeMeasureStart, pt);
            }
            return;
          }
          if (!isSculptMode) {
            e.stopPropagation();
            select(part.id);
          }
        }}
        onPointerDown={(e) => {
          if (isSculptMode && isSelected) {
            e.stopPropagation();
            isPointerDownRef.current = true;
            if (e.point && e.face?.normal) {
              applySculptAtPoint(e.point, e.face.normal);
            }
          }
        }}
        onPointerMove={(e) => {
          if (isSculptMode && isSelected && isPointerDownRef.current) {
            e.stopPropagation();
            if (e.point && e.face?.normal) {
              applySculptAtPoint(e.point, e.face.normal);
            }
          }
        }}
        onPointerUp={() => {
          isPointerDownRef.current = false;
        }}
        onPointerLeave={() => {
          isPointerDownRef.current = false;
        }}
      >
        {renderMode === 'wire' ? (
          <meshBasicMaterial 
            color={color} 
            wireframe 
            side={THREE.DoubleSide}
            clippingPlanes={clippingPlanes} 
            clipShadows 
          />
        ) : renderMode === 'normals' ? (
          <meshNormalMaterial 
            side={THREE.DoubleSide}
            clippingPlanes={clippingPlanes} 
            clipShadows 
          />
        ) : renderMode === 'xray' ? (
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.35}
            roughness={0.1}
            metalness={0.8}
            side={THREE.DoubleSide}
            emissive={isSelected ? '#38bdf8' : '#000'}
            clippingPlanes={clippingPlanes}
            clipShadows
          />
        ) : renderMode === 'pbr' ? (
          <meshPhysicalMaterial
            color={color}
            roughness={0.15}
            metalness={0.7}
            clearcoat={0.3}
            side={THREE.DoubleSide}
            emissive={emissive}
            clippingPlanes={clippingPlanes}
            clipShadows
          />
        ) : renderMode === 'matcap' ? (
          <meshStandardMaterial
            color={color}
            roughness={0.4}
            metalness={0.6}
            side={THREE.DoubleSide}
            emissive={isSelected ? '#38bdf8' : '#111'}
            clippingPlanes={clippingPlanes}
            clipShadows
          />
        ) : (
          <meshStandardMaterial
            color={color}
            roughness={0.3}
            metalness={0.2}
            side={THREE.DoubleSide}
            emissive={emissive}
            clippingPlanes={clippingPlanes}
            clipShadows
          />
        )}

        {/* Edge Highlights */}
        {(renderMode === 'edges' || isSelected) && (
          <Edges
            scale={1.002}
            threshold={35}
            color={isSelected ? '#00e5ff' : '#ffffff'}
          />
        )}
      </mesh>

      {/* ─── STENCIL CAP PLANE: FILLS SOLID CROSS-SECTION INTERIOR ─── */}
      {capPlaneData && (
        <mesh
          position={capPlaneData.pos}
          quaternion={capPlaneData.quat}
          renderOrder={4}
        >
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial
            color={color}
            roughness={0.35}
            metalness={0.2}
            side={THREE.DoubleSide}
            stencilWrite={true}
            stencilRef={0}
            stencilFunc={THREE.NotEqualStencilFunc}
            stencilFail={THREE.ReplaceStencilOp}
            stencilZFail={THREE.ReplaceStencilOp}
            stencilZPass={THREE.ReplaceStencilOp}
          />
        </mesh>
      )}
    </group>
  );
}

// ─── HIGH-PRECISION CAD SURFACE TARGET MARKER ───
function CADSurfaceMarker({
  pos,
  normal,
  label,
  color = '#00e5ff',
}: {
  pos: [number, number, number];
  normal?: { x: number; y: number; z: number };
  label: string;
  color?: string;
}) {
  const normVec = useMemo(() => {
    if (!normal) return null;
    const len = Math.hypot(normal.x, normal.y, normal.z);
    if (len < 0.001) return null;
    return new THREE.Vector3(normal.x / len, normal.y / len, normal.z / len);
  }, [normal]);

  const quat = useMemo(() => {
    if (!normVec) return null;
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normVec);
  }, [normVec]);

  // Elevation slightly off the surface to avoid z-fighting
  const elevatedPos: [number, number, number] = useMemo(() => {
    if (!normVec) return pos;
    return [
      pos[0] + normVec.x * 0.04,
      pos[1] + normVec.y * 0.04,
      pos[2] + normVec.z * 0.04,
    ];
  }, [pos, normVec]);

  return (
    <group position={elevatedPos}>
      {/* 1. Center Target Dot */}
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.95} />
      </mesh>

      {/* 2. Precision CAD Reticle Rings & Crosshairs */}
      {quat && (
        <group quaternion={quat}>
          <mesh>
            <ringGeometry args={[0.22, 0.28, 32]} />
            <meshBasicMaterial color={color} side={THREE.DoubleSide} depthTest={false} transparent opacity={0.85} />
          </mesh>
          <mesh>
            <ringGeometry args={[0.42, 0.45, 32]} />
            <meshBasicMaterial color={color} side={THREE.DoubleSide} depthTest={false} transparent opacity={0.4} />
          </mesh>
          <Line points={[[-0.55, 0, 0], [0.55, 0, 0]]} color={color} lineWidth={1.5} depthTest={false} transparent opacity={0.7} />
          <Line points={[[0, -0.55, 0], [0, 0.55, 0]]} color={color} lineWidth={1.5} depthTest={false} transparent opacity={0.7} />
        </group>
      )}

      {/* 3. Surface Normal Laser Ray & Arrowhead */}
      {normVec && (
        <group>
          <Line points={[[0, 0, 0], [normVec.x * 0.6, normVec.y * 0.6, normVec.z * 0.6]]} color={color} lineWidth={2} depthTest={false} />
          <mesh
            position={[normVec.x * 0.65, normVec.y * 0.65, normVec.z * 0.65]}
            quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normVec)}
          >
            <coneGeometry args={[0.07, 0.18, 16]} />
            <meshBasicMaterial color={color} depthTest={false} />
          </mesh>
        </group>
      )}

      {/* 4. Minimalist Leader Label */}
      <Html position={[0, 0.35, 0]} center distanceFactor={22}>
        <div className="rounded-lg bg-slate-950/90 text-cyan-300 font-mono text-[8px] font-black px-2 py-0.5 shadow-xl border border-cyan-500/40 pointer-events-none select-none backdrop-blur-md whitespace-nowrap flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>{label}</span>
        </div>
      </Html>
    </group>
  );
}

// ─── 3D CALIPER & DIMENSION MEASUREMENTS LAYER ───
function MeasurementLayer() {
  const measurements = useDesignStore((s) => s.measurements);
  const activeMeasureStart = useDesignStore((s) => s.activeMeasureStart);
  const removeMeasurement = useDesignStore((s) => s.removeMeasurement);

  return (
    <group>
      {/* Active Measurement Start Pin & Surface Indicator */}
      {activeMeasureStart && (
        <CADSurfaceMarker
          pos={[activeMeasureStart.x / 10, activeMeasureStart.y / 10, activeMeasureStart.z / 10]}
          normal={
            activeMeasureStart.nx !== undefined
              ? { x: activeMeasureStart.nx, y: activeMeasureStart.ny || 0, z: activeMeasureStart.nz || 0 }
              : undefined
          }
          label="YÜZEY 1 (BAŞLANGIÇ)"
          color="#f59e0b"
        />
      )}

      {/* Saved 3D Surface, Distance & Diameter Measurements */}
      {measurements.map((m) => {
        // ─── CASE A: DIAMETER / RADIUS MEASUREMENT ───
        if (m.type === 'diameter' && m.center) {
          const centerPos: [number, number, number] = [m.center.x / 10, m.center.y / 10, m.center.z / 10];
          const r = (m.radius || 10) / 10;
          const diaMm = m.diameter || Math.round(r * 20);
          const radMm = m.radius || Math.round(r * 10);
          const norm = m.normal1 ? new THREE.Vector3(m.normal1.x, m.normal1.y, m.normal1.z).normalize() : new THREE.Vector3(0, 1, 0);
          const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), norm);

          return (
            <group key={m.id} position={centerPos}>
              {/* 1. Center Mark Crosshairs */}
              <group quaternion={quat}>
                {/* Diameter Boundary Ring */}
                <mesh>
                  <ringGeometry args={[r * 0.97, r * 1.03, 64]} />
                  <meshBasicMaterial color="#10b981" side={THREE.DoubleSide} depthTest={false} transparent opacity={0.9} />
                </mesh>
                <mesh>
                  <circleGeometry args={[r, 64]} />
                  <meshBasicMaterial color="#10b981" side={THREE.DoubleSide} transparent opacity={0.12} />
                </mesh>

                {/* Center Reticle Crosshairs */}
                <mesh>
                  <sphereGeometry args={[0.15, 16, 16]} />
                  <meshBasicMaterial color="#10b981" depthTest={false} />
                </mesh>
                <Line points={[[-r * 1.25, 0, 0], [r * 1.25, 0, 0]]} color="#10b981" lineWidth={2} depthTest={false} />
                <Line points={[[0, -r * 1.25, 0], [0, r * 1.25, 0]]} color="#10b981" lineWidth={2} depthTest={false} />

                {/* Diameter Arrowheads across circumference */}
                <mesh position={[-r, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <coneGeometry args={[0.1, 0.25, 16]} />
                  <meshBasicMaterial color="#10b981" depthTest={false} />
                </mesh>
                <mesh position={[r, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                  <coneGeometry args={[0.1, 0.25, 16]} />
                  <meshBasicMaterial color="#10b981" depthTest={false} />
                </mesh>
              </group>

              {/* Floating Diameter HUD Callout */}
              <Html position={[0, r + 0.6, 0]} center>
                <div className="flex flex-col gap-1.5 rounded-2xl bg-slate-950/95 p-3 font-mono text-[10px] text-white border border-emerald-400/80 shadow-2xl backdrop-blur-xl select-none min-w-[190px] animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1">
                    <span className="text-[10px] font-black text-emerald-300 flex items-center gap-1">
                      ⌀ ÇAP & RADYUS ÖLÇÜSÜ
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMeasurement(m.id);
                      }}
                      className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white flex items-center justify-center text-[10px] font-bold transition-all ml-2"
                      title="Ölçüyü Sil"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between bg-emerald-950/50 rounded-xl px-2.5 py-1.5 border border-emerald-500/40">
                    <span className="text-emerald-300 text-[9px] font-bold">Çap (Diameter ⌀):</span>
                    <span className="text-emerald-400 font-black text-[15px]">⌀ {diaMm} mm</span>
                  </div>

                  <div className="flex items-baseline justify-between px-1 text-[9px] text-slate-300">
                    <span>Yarıçap (Radius R):</span>
                    <span className="text-cyan-300 font-bold text-[11px]">R {radMm} mm</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 pt-1 text-[8px] text-slate-400">
                    <span>Çevre: <b className="text-slate-200">{(Math.PI * diaMm).toFixed(1)}</b> mm</span>
                    <span>Alan: <b className="text-slate-200">{(Math.PI * Math.pow(radMm, 2)).toFixed(1)}</b> mm²</span>
                  </div>
                </div>
              </Html>
            </group>
          );
        }

        // ─── CASE B: DISTANCE & SURFACE MEASUREMENT ───
        const p1: [number, number, number] = [m.p1.x / 10, m.p1.y / 10, m.p1.z / 10];
        const p2: [number, number, number] = [m.p2.x / 10, m.p2.y / 10, m.p2.z / 10];
        const mid: [number, number, number] = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2 + 0.4, (p1[2] + p2[2]) / 2];

        const perpPos: [number, number, number] | null = m.perpPoint
          ? [m.perpPoint.x / 10, m.perpPoint.y / 10, m.perpPoint.z / 10]
          : null;

        return (
          <group key={m.id}>
            {/* Precision CAD Surface Markers */}
            <CADSurfaceMarker
              pos={p1}
              normal={m.normal1}
              label="YÜZEY A"
              color={m.isParallelSurfaces ? '#10b981' : '#38bdf8'}
            />
            <CADSurfaceMarker
              pos={p2}
              normal={m.normal2}
              label="YÜZEY B"
              color={m.isParallelSurfaces ? '#10b981' : '#38bdf8'}
            />

            {/* Direct Line between Click Points */}
            <Line points={[p1, p2]} color={m.isParallelSurfaces ? '#34d399' : '#00e5ff'} lineWidth={2.5} depthTest={false} />

            {/* Perpendicular Projection Line for Surface-to-Surface Gap */}
            {perpPos && m.perpendicularDist !== undefined && m.perpendicularDist > 0.1 && (
              <Line
                points={[p1, perpPos]}
                color="#fbbf24"
                lineWidth={2}
                dashed
                dashScale={1.5}
                dashSize={0.5}
                gapSize={0.3}
                depthTest={false}
              />
            )}

            {/* Rich Engineering Dimension Callout Card */}
            <Html position={mid} center>
              <div className="flex flex-col gap-1.5 rounded-2xl bg-slate-950/95 p-3 font-mono text-[10px] text-white border border-cyan-400/80 shadow-2xl backdrop-blur-xl select-none min-w-[210px] animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-white/10 pb-1">
                  <span className="text-[10px] font-black text-cyan-300 flex items-center gap-1">
                    {m.isParallelSurfaces
                      ? '⫽ PARALEL YÜZEY MESAFESİ'
                      : m.perpendicularDist !== undefined
                      ? '📐 YÜZEY DİK MESAFESİ'
                      : '📏 3D KUMPAS ÖLÇÜSÜ'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMeasurement(m.id);
                    }}
                    className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white flex items-center justify-center text-[10px] font-bold transition-all ml-2"
                    title="Ölçüyü Sil"
                  >
                    ✕
                  </button>
                </div>

                {m.perpendicularDist !== undefined && (
                  <div className="flex items-baseline justify-between bg-emerald-950/40 rounded-xl px-2.5 py-1.5 border border-emerald-500/40">
                    <span className="text-emerald-300 text-[9px] font-bold">Yüzeyler Arası (Dik):</span>
                    <span className="text-emerald-400 font-black text-[14px]">{m.perpendicularDist} mm</span>
                  </div>
                )}

                <div className="flex items-baseline justify-between px-1 text-[9px] text-slate-300">
                  <span>Noktadan Noktaya:</span>
                  <span className="text-cyan-300 font-bold text-[11px]">{m.distance} mm</span>
                </div>

                {m.angleDeg !== undefined && m.angleDeg > 0.5 && !m.isParallelSurfaces && (
                  <div className="flex items-baseline justify-between px-1 text-[9px] text-amber-300">
                    <span>Yüzey Açısı:</span>
                    <span className="font-bold">{m.angleDeg}°</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-white/10 pt-1 text-[8px] text-slate-400">
                  <span>ΔX: <b className="text-slate-200 font-bold">{m.dx}</b></span>
                  <span>ΔY: <b className="text-slate-200 font-bold">{m.dy}</b></span>
                  <span>ΔZ: <b className="text-slate-200 font-bold">{m.dz}</b> mm</span>
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

// ─── 3D CENTER OF GRAVITY (AĞIRLIK MERKEZİ) MARKER LAYER ───
function CenterOfGravityLayer() {
  const showCoG = useDesignStore((s) => s.showCenterOfGravity);
  const parts = useDesignStore((s) => s.parts);
  const selectedMaterialId = useDesignStore((s) => s.selectedMaterialId);

  const massProps = useMemo(() => {
    if (!showCoG || parts.length === 0) return null;
    return calculateAssemblyMassProperties(parts, selectedMaterialId);
  }, [showCoG, parts, selectedMaterialId]);

  if (!showCoG || !massProps || parts.length === 0) return null;

  const cog = massProps.centerOfGravity;
  const pos: [number, number, number] = [cog.x / 10, cog.y / 10, cog.z / 10];

  return (
    <group position={pos}>
      {/* Target Sphere */}
      <mesh>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial color="#f43f5e" wireframe />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#fb7185" />
      </mesh>

      {/* Axis Crosshairs */}
      <Line points={[[-0.8, 0, 0], [0.8, 0, 0]]} color="#f43f5e" lineWidth={2} />
      <Line points={[[0, -0.8, 0], [0, 0.8, 0]]} color="#f43f5e" lineWidth={2} />
      <Line points={[[0, 0, -0.8], [0, 0, 0.8]]} color="#f43f5e" lineWidth={2} />

      {/* Ground Plumb Line */}
      <Line points={[[0, 0, 0], [0, -pos[1], 0]]} color="#f43f5e" lineWidth={1} />

      {/* CoG Callout Badge */}
      <Html position={[0, 0.6, 0]} center>
        <div className="rounded-xl bg-slate-950/95 border border-rose-500/60 px-2.5 py-1 font-mono text-[9px] text-white shadow-2xl backdrop-blur-md select-none whitespace-nowrap animate-in fade-in">
          <div className="flex items-center gap-1 font-black text-rose-400">
            <span>🎯 CoG (Ağırlık Merkezi)</span>
            <span className="text-slate-300 font-bold">· {massProps.massKg} kg</span>
          </div>
          <div className="text-[8px] text-slate-400">
            X: {cog.x}mm · Y: {cog.y}mm · Z: {cog.z}mm
          </div>
        </div>
      </Html>
    </group>
  );
}

// ─── 3D FASTENER HOLES & THREAD INTERFERENCE LAYER ───
function FastenerHolesLayer() {
  const holes = useDesignStore((s) => s.holes);
  const selectedPart = useDesignStore((s) => s.getSelected());

  if (!selectedPart || holes.length === 0) return null;

  const p = selectedPart.params || {};
  const partW = (p.width || p.diameter || 60) / 10;
  const partH = (p.height || p.length || 40) / 10;
  const partD = (p.depth || p.length || p.diameter || 40) / 10;

  const halfW = partW / 2;
  const halfH = partH / 2;
  const halfD = partD / 2;

  const issues = checkHoleInterferences(holes, { width: partW * 10, height: partH * 10 });

  const partPos: [number, number, number] = [
    selectedPart.position.x / 10,
    selectedPart.position.y / 10,
    selectedPart.position.z / 10,
  ];
  const partRot: [number, number, number] = [
    (selectedPart.rotation.x * Math.PI) / 180,
    (selectedPart.rotation.y * Math.PI) / 180,
    (selectedPart.rotation.z * Math.PI) / 180,
  ];

  return (
    <group position={partPos} rotation={partRot}>
      {holes.map((h) => {
        const std = ISO_METRIC_HOLES.find((s) => s.size === h.size) || {
          size: h.size,
          nominalDiameter: 6,
          tapDrillDiameter: 5,
          counterboreDiameter: 10,
        };

        const r = (std.nominalDiameter / 10) / 2;
        const cbR = (std.counterboreDiameter / 10) / 2;

        const hasCritical = issues.some((iss) => (iss.holeIdA === h.id || iss.holeIdB === h.id) && iss.severity === 'CRITICAL');
        const hasWarning = issues.some((iss) => (iss.holeIdA === h.id || iss.holeIdB === h.id) && iss.severity === 'WARNING');

        const color = hasCritical ? '#ef4444' : hasWarning ? '#f59e0b' : '#00e5ff';
        const face: SurfaceFace = h.face || 'top';
        const hx = h.x / 10;
        const hy = h.y / 10;

        let pos: [number, number, number] = [hx, halfH + 0.02, hy];
        let rot: [number, number, number] = [-Math.PI / 2, 0, 0];

        if (face === 'bottom') {
          pos = [hx, -halfH - 0.02, hy];
          rot = [Math.PI / 2, 0, 0];
        } else if (face === 'front') {
          pos = [hx, hy, halfD + 0.02];
          rot = [0, 0, 0];
        } else if (face === 'back') {
          pos = [-hx, hy, -halfD - 0.02];
          rot = [0, Math.PI, 0];
        } else if (face === 'right') {
          pos = [halfW + 0.02, hy, hx];
          rot = [0, Math.PI / 2, 0];
        } else if (face === 'left') {
          pos = [-halfW - 0.02, hy, -hx];
          rot = [0, -Math.PI / 2, 0];
        }

        return (
          <group key={h.id} position={pos} rotation={rot}>
            {/* Outer Bore Ring */}
            <mesh>
              <ringGeometry args={[r * 0.85, r, 32]} />
              <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.9} />
            </mesh>

            {/* Counterbore Outer Ring */}
            {h.type === 'counterbore' && (
              <mesh>
                <ringGeometry args={[cbR * 0.95, cbR, 32]} />
                <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.6} />
              </mesh>
            )}

            {/* Crosshair */}
            <Line points={[[-r * 1.5, 0, 0], [r * 1.5, 0, 0]]} color={color} lineWidth={1.5} />
            <Line points={[[0, -r * 1.5, 0], [0, r * 1.5, 0]]} color={color} lineWidth={1.5} />

            {/* Adaptive Hole Callout Badge */}
            <Html position={[0, 0.35, 0]} center>
              <div className={`px-1.5 py-0.5 rounded font-mono font-bold shadow-lg select-none whitespace-nowrap pointer-events-none transition-all ${
                hasCritical
                  ? 'bg-rose-600 text-white text-[9px] animate-pulse border border-rose-300 font-black'
                  : hasWarning
                  ? 'bg-amber-500 text-slate-950 text-[8px] font-black border border-amber-300'
                  : 'bg-slate-900/90 text-cyan-300 text-[8px] border border-cyan-500/40'
              }`}>
                {h.size} {h.type === 'tap' ? '(Diş)' : h.type === 'counterbore' ? '(İmbus)' : '(Düz)'}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

// ─── 3D ACTIVE FACE CAD GUIDE OVERLAY ───
function ActiveFaceGuideLayer() {
  const selectedPart = useDesignStore((s) => s.getSelected());
  const activeFace = useDesignStore((s) => s.activeFace);
  const facePickMode = useDesignStore((s) => s.facePickMode);

  if (!selectedPart) return null;

  const p = selectedPart.params || {};
  const partW = (p.width || p.diameter || 60) / 10;
  const partH = (p.height || p.length || 40) / 10;
  const partD = (p.depth || p.length || p.diameter || 40) / 10;

  const halfW = partW / 2;
  const halfH = partH / 2;
  const halfD = partD / 2;

  let planeW = partW;
  let planeH = partD;
  let pos: [number, number, number] = [0, halfH + 0.015, 0];
  let rot: [number, number, number] = [-Math.PI / 2, 0, 0];

  if (activeFace === 'bottom') {
    planeW = partW;
    planeH = partD;
    pos = [0, -halfH - 0.015, 0];
    rot = [Math.PI / 2, 0, 0];
  } else if (activeFace === 'front') {
    planeW = partW;
    planeH = partH;
    pos = [0, 0, halfD + 0.015];
    rot = [0, 0, 0];
  } else if (activeFace === 'back') {
    planeW = partW;
    planeH = partH;
    pos = [0, 0, -halfD - 0.015];
    rot = [0, Math.PI, 0];
  } else if (activeFace === 'right') {
    planeW = partD;
    planeH = partH;
    pos = [halfW + 0.015, 0, 0];
    rot = [0, Math.PI / 2, 0];
  } else if (activeFace === 'left') {
    planeW = partD;
    planeH = partH;
    pos = [-halfW - 0.015, 0, 0];
    rot = [0, -Math.PI / 2, 0];
  }

  const partPos: [number, number, number] = [
    selectedPart.position.x / 10,
    selectedPart.position.y / 10,
    selectedPart.position.z / 10,
  ];
  const partRot: [number, number, number] = [
    (selectedPart.rotation.x * Math.PI) / 180,
    (selectedPart.rotation.y * Math.PI) / 180,
    (selectedPart.rotation.z * Math.PI) / 180,
  ];

  return (
    <group position={partPos} rotation={partRot}>
      <group position={pos} rotation={rot}>
        <mesh>
          <planeGeometry args={[planeW, planeH]} />
          <meshBasicMaterial
            color={facePickMode ? '#f59e0b' : '#00e5ff'}
            transparent
            opacity={facePickMode ? 0.22 : 0.08}
            side={THREE.DoubleSide}
          />
        </mesh>

        <Line
          points={[
            [-planeW / 2, -planeH / 2, 0],
            [planeW / 2, -planeH / 2, 0],
            [planeW / 2, planeH / 2, 0],
            [-planeW / 2, planeH / 2, 0],
            [-planeW / 2, -planeH / 2, 0],
          ]}
          color={facePickMode ? '#f59e0b' : '#00e5ff'}
          lineWidth={2}
          dashed
          dashSize={0.2}
          gapSize={0.1}
        />

        {/* Origin (0,0) indicator */}
        <Line points={[[-0.3, 0, 0], [0.3, 0, 0]]} color="#00e5ff" lineWidth={1.5} />
        <Line points={[[0, -0.3, 0], [0, 0.3, 0]]} color="#00e5ff" lineWidth={1.5} />
      </group>
    </group>
  );
}

// ─── 3D SURFACE CUTS VISUALIZATION LAYER ───
function SurfaceCutsPreviewLayer() {
  const cuts = useDesignStore((s) => s.cuts);
  const selectedPart = useDesignStore((s) => s.getSelected());

  if (!selectedPart || cuts.length === 0) return null;

  const p = selectedPart.params || {};
  const partW = (p.width || p.diameter || 60) / 10;
  const partH = (p.height || p.length || 40) / 10;
  const partD = (p.depth || p.length || p.diameter || 40) / 10;

  const halfW = partW / 2;
  const halfH = partH / 2;
  const halfD = partD / 2;

  const partPos: [number, number, number] = [
    selectedPart.position.x / 10,
    selectedPart.position.y / 10,
    selectedPart.position.z / 10,
  ];
  const partRot: [number, number, number] = [
    (selectedPart.rotation.x * Math.PI) / 180,
    (selectedPart.rotation.y * Math.PI) / 180,
    (selectedPart.rotation.z * Math.PI) / 180,
  ];

  return (
    <group position={partPos} rotation={partRot}>
      {cuts.map((c) => {
        const face: SurfaceFace = c.face || 'top';
        const cx = c.x / 10;
        const cy = c.y / 10;
        const cw = (c.width || 30) / 10;
        const cl = (c.length || 40) / 10;
        const cd = ((c.diameter || 25) / 10) / 2;

        let pos: [number, number, number] = [cx, halfH + 0.02, cy];
        let rot: [number, number, number] = [-Math.PI / 2, 0, 0];

        if (face === 'bottom') {
          pos = [cx, -halfH - 0.02, cy];
          rot = [Math.PI / 2, 0, 0];
        } else if (face === 'front') {
          pos = [cx, cy, halfD + 0.02];
          rot = [0, 0, 0];
        } else if (face === 'back') {
          pos = [-cx, cy, -halfD - 0.02];
          rot = [0, Math.PI, 0];
        } else if (face === 'right') {
          pos = [halfW + 0.02, cy, cx];
          rot = [0, Math.PI / 2, 0];
        } else if (face === 'left') {
          pos = [-halfW - 0.02, cy, -cx];
          rot = [0, -Math.PI / 2, 0];
        }

        return (
          <group key={c.id} position={pos} rotation={rot}>
            {c.type === 'circle' ? (
              <mesh>
                <ringGeometry args={[cd * 0.9, cd, 32]} />
                <meshBasicMaterial color="#f43f5e" side={THREE.DoubleSide} transparent opacity={0.8} />
              </mesh>
            ) : (
              <Line
                points={[
                  [-cw / 2, -cl / 2, 0],
                  [cw / 2, -cl / 2, 0],
                  [cw / 2, cl / 2, 0],
                  [-cw / 2, cl / 2, 0],
                  [-cw / 2, -cl / 2, 0],
                ]}
                color="#f43f5e"
                lineWidth={1.8}
              />
            )}
            <Html position={[0, 0.2, 0]} center>
              <div className="px-1.5 py-0.5 rounded bg-rose-950/90 text-rose-300 font-mono font-bold text-[8px] border border-rose-500/40 select-none pointer-events-none">
                ✂️ {c.type === 'rect' ? 'Havuz' : c.type === 'circle' ? 'Dairesel' : 'Slot'} ({c.depth}mm)
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}


// ─── INTERACTIVE 2D SKETCH CANVAS LAYER ON 3D PLANE ───
function InteractiveSketchPlane() {
  const tool = useDesignStore((s) => s.tool);
  const sketchPoints = useDesignStore((s) => s.sketchPoints);
  const sketchClosed = useDesignStore((s) => s.sketchClosed);
  const addSketchPoint = useDesignStore((s) => s.addSketchPoint);
  const constraintOrtho = useDesignStore((s) => s.constraintOrtho);
  const constraintPerpendicular = useDesignStore((s) => s.constraintPerpendicular);
  const constraintParallel = useDesignStore((s) => s.constraintParallel);
  const constraintEqual = useDesignStore((s) => s.constraintEqual);
  const gridSnap = useDesignStore((s) => s.gridSnap);

  const [hoverPoint, setHoverPoint] = useState<Point2D | null>(null);

  const isSketchMode = tool === 'sketch-add' || tool === 'sketch-cut' || tool === 'sketch-loft';
  if (!isSketchMode) return null;

  const points3D: [number, number, number][] = sketchPoints.map((pt) => [pt.x / 10, 0.05, pt.y / 10]);
  if (sketchClosed && points3D.length > 2) {
    points3D.push(points3D[0]);
  }

  // Calculate live snapped cursor position and active geometric constraints
  const lastPoint = sketchPoints.length > 0 ? sketchPoints[sketchPoints.length - 1] : null;
  const prevSegment = sketchPoints.length >= 2 
    ? { 
        p1: sketchPoints[sketchPoints.length - 2], 
        p2: sketchPoints[sketchPoints.length - 1],
        len: Math.hypot(sketchPoints[sketchPoints.length - 1].x - sketchPoints[sketchPoints.length - 2].x, sketchPoints[sketchPoints.length - 1].y - sketchPoints[sketchPoints.length - 2].y),
        angle: (Math.atan2(sketchPoints[sketchPoints.length - 1].y - sketchPoints[sketchPoints.length - 2].y, sketchPoints[sketchPoints.length - 1].x - sketchPoints[sketchPoints.length - 2].x) * 180) / Math.PI,
      } 
    : null;

  let activeLivePoint = hoverPoint;
  let activeConstraintBadge: string | null = null;
  let liveLength = 0;
  let liveAngle = 0;

  if (lastPoint && hoverPoint && !sketchClosed) {
    const rawDx = hoverPoint.x - lastPoint.x;
    const rawDy = hoverPoint.y - lastPoint.y;
    let dist = Math.hypot(rawDx, rawDy);
    let deg = ((Math.atan2(rawDy, rawDx) * 180) / Math.PI + 360) % 360;

    // 1. Ortho Snap (0, 90, 180, 270)
    if (constraintOrtho) {
      const snapDeg = Math.round(deg / 90) * 90;
      if (Math.abs(deg - snapDeg) < 20) {
        deg = snapDeg % 360;
        activeConstraintBadge = deg % 180 === 0 ? '⟷ YATAY' : '↕ DİKEY';
      }
    }

    // 2. Perpendicular Snap relative to previous segment (90 deg)
    if (prevSegment && constraintPerpendicular && !activeConstraintBadge) {
      const perp1 = (prevSegment.angle + 90 + 360) % 360;
      const perp2 = (prevSegment.angle - 90 + 360) % 360;
      if (Math.abs(deg - perp1) < 8 || Math.abs(deg - (perp1 - 360)) < 8) {
        deg = perp1;
        activeConstraintBadge = '⊥ DİK (90°)';
      } else if (Math.abs(deg - perp2) < 8 || Math.abs(deg - (perp2 + 360)) < 8) {
        deg = perp2;
        activeConstraintBadge = '⊥ DİK (90°)';
      }
    }

    // 3. Parallel Snap relative to previous segment (0 or 180 deg)
    if (prevSegment && constraintParallel && !activeConstraintBadge) {
      const par1 = (prevSegment.angle + 360) % 360;
      const par2 = (prevSegment.angle + 180 + 360) % 360;
      if (Math.abs(deg - par1) < 8 || Math.abs(deg - (par1 - 360)) < 8) {
        deg = par1;
        activeConstraintBadge = '∥ PARALEL';
      } else if (Math.abs(deg - par2) < 8 || Math.abs(deg - (par2 + 360)) < 8) {
        deg = par2;
        activeConstraintBadge = '∥ PARALEL';
      }
    }

    // 4. Equal Length Snap
    if (prevSegment && constraintEqual && Math.abs(dist - prevSegment.len) < 6) {
      dist = prevSegment.len;
      activeConstraintBadge = (activeConstraintBadge ? `${activeConstraintBadge} · ` : '') + '= EŞİT';
    }

    const rad = (deg * Math.PI) / 180;
    activeLivePoint = {
      x: lastPoint.x + Math.cos(rad) * dist,
      y: lastPoint.y + Math.sin(rad) * dist,
    };
    liveLength = Math.round(dist);
    liveAngle = Math.round(deg);
  }

  const liveLine3D: [number, number, number][] = (lastPoint && activeLivePoint && !sketchClosed)
    ? [[lastPoint.x / 10, 0.05, lastPoint.y / 10], [activeLivePoint.x / 10, 0.05, activeLivePoint.y / 10]]
    : [];

  return (
    <group>
      {/* Clickable Grid Raycast Plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        onPointerMove={(e) => {
          const snap = gridSnap || 5;
          setHoverPoint({
            x: Math.round((e.point.x * 10) / snap) * snap,
            y: Math.round((e.point.z * 10) / snap) * snap,
          });
        }}
        onPointerLeave={() => setHoverPoint(null)}
        onPointerDown={(e) => {
          e.stopPropagation();
          const targetPt = activeLivePoint || { x: e.point.x * 10, y: e.point.z * 10 };
          addSketchPoint(targetPt);
        }}
      >
        <planeGeometry args={[300, 300]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Drawn Profile Lines */}
      {points3D.length > 1 && (
        <Line
          points={points3D}
          color={sketchClosed ? '#34d399' : '#00e5ff'}
          lineWidth={4}
        />
      )}

      {/* Live Preview Line to Cursor */}
      {liveLine3D.length > 1 && (
        <Line
          points={liveLine3D}
          color={activeConstraintBadge ? '#34d399' : '#38bdf8'}
          lineWidth={2.5}
          dashed
          dashSize={0.5}
          gapSize={0.25}
        />
      )}

      {/* Live Cursor Tooltip Badge */}
      {activeLivePoint && lastPoint && !sketchClosed && liveLength > 0 && (
        <Html position={[activeLivePoint.x / 10, 0.4, activeLivePoint.y / 10]} center>
          <div className="flex flex-col items-center gap-0.5 rounded-xl bg-black/90 px-2 py-1 font-mono text-[9px] font-bold text-white border border-cyan-400/50 shadow-2xl backdrop-blur-md pointer-events-none select-none">
            <div className="flex items-center gap-2 text-cyan-300">
              <span>📏 {liveLength} mm</span>
              <span>∠ {liveAngle}°</span>
            </div>
            {activeConstraintBadge && (
              <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[8px] font-black text-emerald-400 border border-emerald-500/40">
                {activeConstraintBadge}
              </span>
            )}
          </div>
        </Html>
      )}

      {/* Point Handles, Segments, Angles & Constraint Badges */}
      {sketchPoints.map((pt, idx) => {
        const nextPt = sketchPoints[(idx + 1) % sketchPoints.length];
        const prevPt = sketchPoints[(idx - 1 + sketchPoints.length) % sketchPoints.length];
        const isEnd = idx === sketchPoints.length - 1;
        if (isEnd && !sketchClosed) return null;

        const dist = nextPt ? Math.round(Math.hypot(nextPt.x - pt.x, nextPt.y - pt.y)) : 0;
        const midX = nextPt ? (pt.x + nextPt.x) / 20 : pt.x / 10;
        const midZ = nextPt ? (pt.y + nextPt.y) / 20 : pt.y / 10;

        const curAngle = nextPt ? ((Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x) * 180) / Math.PI + 360) % 360 : 0;
        const prevAngle = prevPt ? ((Math.atan2(pt.y - prevPt.y, pt.x - prevPt.x) * 180) / Math.PI + 360) % 360 : 0;

        // Interior angle at vertex
        let vertexCornerAngle = Math.abs(curAngle - prevAngle);
        if (vertexCornerAngle > 180) vertexCornerAngle = 360 - vertexCornerAngle;
        const isPerp = Math.abs(vertexCornerAngle - 90) < 2.0;

        const isHoriz = nextPt && Math.abs(nextPt.y - pt.y) < 1;
        const isVert = nextPt && Math.abs(nextPt.x - pt.x) < 1;

        return (
          <group key={idx}>
            {/* Vertex Point Handle */}
            <mesh position={[pt.x / 10, 0.06, pt.y / 10]}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshBasicMaterial color={idx === 0 ? '#fbbf24' : '#00e5ff'} />
            </mesh>

            {/* Corner Angle Badge at Vertex */}
            {idx > 0 && vertexCornerAngle > 10 && (
              <Html position={[pt.x / 10, 0.25, pt.y / 10]} center>
                <span className={`px-1 py-0.2 rounded font-mono text-[8px] font-black border pointer-events-none select-none ${
                  isPerp 
                    ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/60 shadow-md shadow-emerald-500/30' 
                    : 'bg-black/70 text-slate-300 border-white/10'
                }`}>
                  {isPerp ? '⊥ 90°' : `∠ ${Math.round(vertexCornerAngle)}°`}
                </span>
              </Html>
            )}

            {/* Segment Length & Direction Badge */}
            {dist > 0 && (
              <Html position={[midX, 0.15, midZ]} center>
                <div className="flex items-center gap-1 rounded bg-black/85 px-1.5 py-0.5 font-mono text-[9px] font-bold text-cyan-300 border border-cyan-500/40 pointer-events-none select-none">
                  <span>{dist}mm</span>
                  {isHoriz && <span className="text-amber-400 font-mono text-[8px]">⟷</span>}
                  {isVert && <span className="text-amber-400 font-mono text-[8px]">↕</span>}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

// ─── 3D BLENDER-STYLE BRUSH CURSOR RING ON MESH ───
function SculptBrushCursor() {
  const studioMode = useDesignStore((s) => s.studioMode);
  const sculptRadius = useDesignStore((s) => s.sculptRadius);
  const sculptDirection = useDesignStore((s) => s.sculptDirection);
  const [cursorPos, setCursorPos] = useState<THREE.Vector3 | null>(null);
  const [cursorNormal, setCursorNormal] = useState<THREE.Vector3>(new THREE.Vector3(0, 1, 0));

  const { raycaster, camera, scene } = useThree();

  useEffect(() => {
    if (studioMode !== 'sculpt') {
      setCursorPos(null);
      return;
    }

    const handlePointerMove = (e: MouseEvent) => {
      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      const hit = intersects.find((i) => i.object.type === 'Mesh' && i.face?.normal);
      if (hit && hit.face) {
        setCursorPos(hit.point);
        setCursorNormal(hit.face.normal.clone());
      } else {
        setCursorPos(null);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [studioMode, raycaster, camera, scene]);

  if (!cursorPos || studioMode !== 'sculpt') return null;

  const r = (sculptRadius || 30) / 10;
  const isAdd = sculptDirection === 'add';

  return (
    <group position={cursorPos}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[r * 0.95, r, 32]} />
        <meshBasicMaterial 
          color={isAdd ? '#00e5ff' : '#f43f5e'} 
          side={THREE.DoubleSide} 
          transparent 
          opacity={0.8} 
        />
      </mesh>
    </group>
  );
}

// ─── 3D CUTTING PLANE VISUALIZER LAYER ───
function SectionPlaneVisualizerLayer() {
  const sectionAxis = useDesignStore((s) => s.sectionAxis);
  const sectionOffset = useDesignStore((s) => s.sectionOffset);
  const sectionInvert = useDesignStore((s) => s.sectionInvert);

  const pos: [number, number, number] = useMemo(() => {
    const d = (sectionInvert ? -1 : 1) * (sectionOffset / 10);
    if (sectionAxis === 'X') return [d, 0, 0];
    if (sectionAxis === 'Y') return [0, d, 0];
    if (sectionAxis === 'Z') return [0, 0, d];
    return [0, 0, 0];
  }, [sectionAxis, sectionOffset, sectionInvert]);

  const rot: [number, number, number] = useMemo(() => {
    if (sectionAxis === 'X') return [0, Math.PI / 2, 0];
    if (sectionAxis === 'Y') return [Math.PI / 2, 0, 0];
    return [0, 0, 0];
  }, [sectionAxis]);

  if (sectionAxis === 'NONE') return null;

  return (
    <group position={pos} rotation={rot}>
      {/* Translucent Cutting Grid Plane */}
      <mesh>
        <planeGeometry args={[18, 18]} />
        <meshBasicMaterial color="#f43f5e" transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Line
        points={[
          [-9, -9, 0],
          [9, -9, 0],
          [9, 9, 0],
          [-9, 9, 0],
          [-9, -9, 0],
        ]}
        color="#f43f5e"
        lineWidth={2}
        transparent
        opacity={0.6}
      />
    </group>
  );
}

export function DesignViewport() {
  const parts = useDesignStore((s) => s.parts);
  const selectedId = useDesignStore((s) => s.selectedId);
  const tool = useDesignStore((s) => s.tool);
  const renderMode = useDesignStore((s) => s.renderMode);
  const studioMode = useDesignStore((s) => s.studioMode);
  const showGrid = useDesignStore((s) => s.showGrid);
  const bg = useDesignStore((s) => s.backgroundPreset);
  const lighting = useDesignStore((s) => s.lightingPreset);
  const sectionAxis = useDesignStore((s) => s.sectionAxis);
  const sectionOffset = useDesignStore((s) => s.sectionOffset);
  const sectionInvert = useDesignStore((s) => s.sectionInvert);
  const sectionSolidCap = useDesignStore((s) => s.sectionSolidCap);
  const setSectionSolidCap = useDesignStore((s) => s.setSectionSolidCap);
  const setSectionOffset = useDesignStore((s) => s.setSectionOffset);
  const setSectionInvert = useDesignStore((s) => s.setSectionInvert);
  const setSectionAxis = useDesignStore((s) => s.setSectionAxis);
  const select = useDesignStore((s) => s.select);
  const updateSelectedTransform = useDesignStore((s) => s.updateSelectedTransform);
  const incrementSculptVersion = useDesignStore((s) => s.incrementSculptVersion);

  const selectedPart = parts.find((p) => p.id === selectedId);
  const isSketchMode = tool === 'sketch-add' || tool === 'sketch-cut' || tool === 'sketch-loft';
  const isSculptMode = studioMode === 'sculpt';

  // Background color palette
  const bgMap: Record<string, string> = {
    dark: '#070b10',
    charcoal: '#121417',
    steel: '#1c242c',
    navy: '#0b1220',
    blueprint: '#0a2540',
    light: '#dbe4ee',
    white: '#f4f4f5',
  };

  // Section Clipping Planes (X, Y, Z with offset and invert)
  const clippingPlanes = useMemo(() => {
    const d = (sectionInvert ? -1 : 1) * (sectionOffset / 10);
    const sign = sectionInvert ? 1 : -1;
    if (sectionAxis === 'X') return [new THREE.Plane(new THREE.Vector3(sign, 0, 0), d)];
    if (sectionAxis === 'Y') return [new THREE.Plane(new THREE.Vector3(0, sign, 0), d)];
    if (sectionAxis === 'Z') return [new THREE.Plane(new THREE.Vector3(0, 0, sign), d)];
    return [];
  }, [sectionAxis, sectionOffset, sectionInvert]);

  const lightIntensity = lighting === 'off' ? 0.15 : lighting === 'dramatic' ? 1.6 : lighting === 'soft' ? 0.6 : 1.0;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        await loadCADFile(file);
      }
    }
  };

  return (
    <div 
      className="relative w-full h-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Canvas
        shadows
        camera={{ position: isSketchMode ? [0, 22, 0.001] : [12, 10, 14], fov: 40, near: 0.1, far: 8000 }}
        gl={{ localClippingEnabled: true, stencil: true }}
        onPointerMissed={() => !isSketchMode && !isSculptMode && select(null)}
        style={{ width: '100%', height: '100%', background: bgMap[bg] || '#070b10' }}
      >
        <ambientLight intensity={lightIntensity * 0.7} />
        <directionalLight position={[30, 45, 25]} intensity={lightIntensity} castShadow shadow-camera-left={-150} shadow-camera-right={150} shadow-camera-top={150} shadow-camera-bottom={-150} shadow-camera-far={3000} />
        <directionalLight position={[-30, -15, -25]} intensity={lightIntensity * 0.4} />
        <hemisphereLight args={['#9bbdff', '#1a1f2a', 0.45]} />

        {/* Expansive Infinite CAD Grid Floor */}
        {showGrid && (
          <Grid
            infiniteGrid
            fadeDistance={800}
            fadeStrength={1.2}
            cellSize={0.5}
            sectionSize={2.5}
            sectionColor="#00e5ff"
            cellColor="#1e293b"
            sectionThickness={1.2}
            cellThickness={0.6}
            position={[0, -0.01, 0]}
          />
        )}

        {/* Interactive 2D Sketch Plane */}
        <InteractiveSketchPlane />

        {/* 3D Meshes with Solid Backface Double-Sided Clipping & Real-Time Sculpt Engine */}
        {parts.map((p, index) => (
          <SolidMesh
            key={p.id}
            part={p}
            renderMode={renderMode}
            clippingPlanes={clippingPlanes}
            isSculptMode={isSculptMode}
            onSculptStroke={incrementSculptVersion}
            partIndex={index}
            totalParts={parts.length}
          />
        ))}

        {/* 3D Caliper & Dimension Measuring Layer */}
        <MeasurementLayer />

        {/* 3D Center of Gravity Plumb Line & Target Layer */}
        <CenterOfGravityLayer />

        {/* 3D Section Cutting Plane Visualizer Layer */}
        <SectionPlaneVisualizerLayer />

        {/* 3D Fastener Holes & Collision Visualization Layer */}
        <FastenerHolesLayer />

        {/* 3D Active Face Guide & Origin Layer */}
        <ActiveFaceGuideLayer />

        {/* 3D Surface Cuts Outline Preview Layer */}
        <SurfaceCutsPreviewLayer />

        {/* 3D Sculpt Brush Ring Indicator */}
        <SculptBrushCursor />


        {/* Interactive Transform Gizmo for Move / Rotate / Scale */}
        {selectedPart && !isSketchMode && !isSculptMode && (tool === 'move' || tool === 'rotate' || tool === 'scale') && (
          <TransformControls
            position={[selectedPart.position.x / 10, selectedPart.position.y / 10, selectedPart.position.z / 10]}
            rotation={[
              (selectedPart.rotation.x * Math.PI) / 180,
              (selectedPart.rotation.y * Math.PI) / 180,
              (selectedPart.rotation.z * Math.PI) / 180,
            ]}
            scale={[selectedPart.scale.x, selectedPart.scale.y, selectedPart.scale.z]}
            mode={tool === 'move' ? 'translate' : tool === 'rotate' ? 'rotate' : 'scale'}
            onObjectChange={(e: any) => {
              const obj = e?.target?.object;
              if (!obj) return;
              updateSelectedTransform({
                position: {
                  x: Math.round(obj.position.x * 10),
                  y: Math.round(obj.position.y * 10),
                  z: Math.round(obj.position.z * 10),
                },
                rotation: {
                  x: Math.round((obj.rotation.x * 180) / Math.PI),
                  y: Math.round((obj.rotation.y * 180) / Math.PI),
                  z: Math.round((obj.rotation.z * 180) / Math.PI),
                },
                scale: {
                  x: Number(obj.scale.x.toFixed(2)),
                  y: Number(obj.scale.y.toFixed(2)),
                  z: Number(obj.scale.z.toFixed(2)),
                },
              });
            }}
          />
        )}

        <OrbitControls makeDefault enableDamping dampingFactor={0.05} enabled={!isSketchMode} minDistance={0.1} maxDistance={3500} />
      </Canvas>

      {/* ─── ON-SCREEN FLOATING SECTION VIEW CONTROLLER PILL ─── */}
      {sectionAxis !== 'NONE' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-rose-500/50 bg-slate-950/95 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 font-mono text-xs text-white select-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 font-black text-[11px] border border-rose-500/30">
            <span>✂️ {sectionAxis} KESİTİ</span>
          </div>

          {/* Precision Offset Slider */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-slate-400 font-bold">Konum:</span>
            <input
              type="range"
              min={-150}
              max={150}
              step={1}
              value={sectionOffset}
              onChange={(e) => setSectionOffset(Number(e.target.value))}
              className="w-28 sm:w-44 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <span className="text-[11px] text-rose-300 font-black min-w-[50px] text-right">{sectionOffset} mm</span>
          </div>

          {/* Quick 0 mm Center Button */}
          <button
            type="button"
            onClick={() => setSectionOffset(0)}
            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-[10px] transition"
            title="Merkeze Sıfırla (0 mm)"
          >
            0 mm
          </button>

          {/* Invert Direction */}
          <button
            type="button"
            onClick={() => setSectionInvert(!sectionInvert)}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-[10px] transition flex items-center gap-1"
            title="Kesim Yönünü Ters Çevir"
          >
            <span>⇄</span>
            <span>{sectionInvert ? 'Ters' : 'Düz'}</span>
          </button>

          {/* Solid Section Cap Toggle */}
          <button
            type="button"
            onClick={() => setSectionSolidCap(!sectionSolidCap)}
            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition border ${
              sectionSolidCap
                ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300 shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Kesit içi katı dolgu kapağı (Solid Section Cap)"
          >
            🧱 {sectionSolidCap ? 'Katı Kesit' : 'İçi Boş'}
          </button>

          {/* Close Section View Button */}
          <button
            type="button"
            onClick={() => setSectionAxis('NONE')}
            className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition flex items-center justify-center font-bold text-[11px] ml-1"
            title="Kesit Görünümünü Kapat"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default DesignViewport;
