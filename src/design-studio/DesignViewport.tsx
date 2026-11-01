'use client';

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import '@/lib/three-cleanup';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, TransformControls, Line, Html } from '@react-three/drei';
import {
  useDesignStore,
  customCADGeometries,
  type DesignPart,
  type RenderMode,
  type SectionAxis,
  type Point2D,
  type Point3D,
  type SculptBrush,
  type SketchEntity,
  create3PointArcPoints,
} from './designStore';
import { SKETCH_DYNAMIC_BLOCKS, type SketchDynamicBlockDef } from './sketchDynamicBlocks';
import { chainAndResolveSketchContours, type ProcessedContour } from './sketchContourEngine';
import { loadCADFile } from './cadImporter';
import { calculateAssemblyMassProperties } from './materialsEngine';
import { checkHoleInterferences, ISO_METRIC_HOLES, type HoleItem, type SurfaceFace, type SurfaceCutItem } from './holeStandards';
import { createCustomGeometry, getPartBoundingMetrics, getSketchPlaneWorldTransform } from './geometryFactory';
import { DesignContextMenu } from './DesignContextMenu';
import { InstancedAssemblyRenderer } from './rendering/InstancedAssemblyRenderer';
import { CAD_CAMERA_ACTION_EVENT, triggerCameraView, type CameraAction } from './cadCameraDispatcher';
import { t12 } from '@/locales/t12';
import { useI18nStore } from '@/store/i18nStore';
import { extractPartFeatures, classifyFeatureFromRaycast, classifySurfaceFaceFromLocalNormal, inferSmartMateKind, getValidMateKinds } from './assembly/featureExtractor';
import type { MateFeature, MateKind } from './assembly/mateTypes';
import { applyPushPull } from './directModelingEngine';
import { WeldmentsLayer } from './weldments/WeldmentsLayer';
import { useViewportLook } from './rendering/viewportTheme';

/**
 * Headless camera dispatcher inside R3F Canvas to manipulate OrbitControls and perspective camera
 */
function CameraDispatcher({
  dispatcherRef,
  parts,
}: {
  dispatcherRef: React.MutableRefObject<((action: CameraAction) => void) | null>;
  parts: DesignPart[];
}) {
  const { camera, controls, scene } = useThree();

  const hasInitialFittedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__cadThree = { camera, controls, scene };
    }
    dispatcherRef.current = (action) => {
      const orbit = controls as any;
      if (!camera) return;

      if (typeof action === 'object' && action.type === 'focus') {
        const part = action.part || (action.partId ? parts.find((p) => p.id === action.partId) : null);
        if (!part) return;
        const targetPos = new THREE.Vector3(
          part.position.x / 10,
          part.position.y / 10,
          part.position.z / 10
        );
        if (orbit && orbit.target) {
          orbit.target.copy(targetPos);
        }
        const dir = new THREE.Vector3().subVectors(camera.position, targetPos).normalize();
        if (dir.lengthSq() < 0.001) dir.set(1.2, 0.9, 1.1).normalize();
        camera.position.copy(targetPos).addScaledVector(dir, 15);
        if (orbit && orbit.update) orbit.update();
        return;
      }

      // SolidWorks / Inventor Normal-To Face camera focus
      if (typeof action === 'object' && action.type === 'focus-face') {
        const part = parts.find((p) => p.id === action.partId);
        if (!part) return;
        const face = action.face as SurfaceFace | undefined;
        const sketchWorld = getSketchPlaneWorldTransform(part, face);

        const worldFaceCenter = new THREE.Vector3(...sketchWorld.position);
        const worldFaceNorm = sketchWorld.normal.clone();

        if (orbit && orbit.target) {
          orbit.target.copy(worldFaceCenter);
        }

        const dist = Math.max(14, Math.max(sketchWorld.planeW, sketchWorld.planeH) * 2.4);
        camera.position.copy(worldFaceCenter).addScaledVector(worldFaceNorm, dist);

        // Align camera.up with the face's vertical bitangent V
        camera.up.copy(sketchWorld.vDir);
        camera.lookAt(worldFaceCenter);
        if (orbit && orbit.update) orbit.update();
        return;
      }

      let currentDist = 20;
      let targetCenter = new THREE.Vector3(0, 0, 0);

      if (orbit && orbit.target) {
        targetCenter.copy(orbit.target);
        currentDist = Math.max(8, camera.position.distanceTo(orbit.target));
      }

      if (action === 'fit') {
        const box = new THREE.Box3();
        let hasContent = false;
        scene.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh && obj.visible && !obj.name.includes('Grid') && !obj.name.includes('Gizmo')) {
            box.expandByObject(obj);
            hasContent = true;
          }
        });

        if (!hasContent || box.isEmpty()) {
          if (parts.length > 0) {
            parts.forEach((p) => {
              const pv = new THREE.Vector3(p.position.x / 10, p.position.y / 10, p.position.z / 10);
              box.expandByPoint(pv);
            });
            box.expandByScalar(5);
            hasContent = true;
          }
        }

        if (hasContent && !box.isEmpty()) {
          const center = new THREE.Vector3();
          box.getCenter(center);
          const sphere = new THREE.Sphere();
          box.getBoundingSphere(sphere);
          const radius = Math.max(sphere.radius, 4);

          if (orbit && orbit.target) {
            orbit.target.copy(center);
          }

          const fov = (camera as THREE.PerspectiveCamera).fov || 40;
          const fitDist = (radius / Math.sin((fov * Math.PI) / 360)) * 0.90;

          let viewDir = new THREE.Vector3().subVectors(camera.position, center).normalize();
          if (viewDir.lengthSq() < 0.001 || Math.abs(viewDir.y) < 0.1) {
            viewDir = new THREE.Vector3(1.2, 0.9, 1.1).normalize();
          }
          camera.position.copy(center).addScaledVector(viewDir, fitDist);
          if (orbit && orbit.update) orbit.update();
          return;
        }
      }

      if (action === 'iso') {
        if (orbit && orbit.target) orbit.target.copy(targetCenter);
        const isoDir = new THREE.Vector3(1, 0.8, 1).normalize();
        camera.position.copy(targetCenter).addScaledVector(isoDir, currentDist);
        camera.up.set(0, 1, 0);
        if (orbit && orbit.update) orbit.update();
      } else if (action === 'top') {
        if (orbit && orbit.target) orbit.target.copy(targetCenter);
        camera.position.set(targetCenter.x, targetCenter.y + currentDist, targetCenter.z + 0.0001);
        camera.up.set(0, 0, -1);
        if (orbit && orbit.update) orbit.update();
      } else if (action === 'bottom') {
        if (orbit && orbit.target) orbit.target.copy(targetCenter);
        camera.position.set(targetCenter.x, targetCenter.y - currentDist, targetCenter.z + 0.0001);
        camera.up.set(0, 0, 1);
        if (orbit && orbit.update) orbit.update();
      } else if (action === 'front') {
        if (orbit && orbit.target) orbit.target.copy(targetCenter);
        camera.position.set(targetCenter.x, targetCenter.y, targetCenter.z + currentDist);
        camera.up.set(0, 1, 0);
        if (orbit && orbit.update) orbit.update();
      } else if (action === 'back') {
        if (orbit && orbit.target) orbit.target.copy(targetCenter);
        camera.position.set(targetCenter.x, targetCenter.y, targetCenter.z - currentDist);
        camera.up.set(0, 1, 0);
        if (orbit && orbit.update) orbit.update();
      } else if (action === 'right') {
        if (orbit && orbit.target) orbit.target.copy(targetCenter);
        camera.position.set(targetCenter.x + currentDist, targetCenter.y, targetCenter.z);
        camera.up.set(0, 1, 0);
        if (orbit && orbit.update) orbit.update();
      } else if (action === 'left') {
        if (orbit && orbit.target) orbit.target.copy(targetCenter);
        camera.position.set(targetCenter.x - currentDist, targetCenter.y, targetCenter.z);
        camera.up.set(0, 1, 0);
        if (orbit && orbit.update) orbit.update();
      }
    };

    if (!hasInitialFittedRef.current && parts.length > 0) {
      hasInitialFittedRef.current = true;
      const t1 = setTimeout(() => dispatcherRef.current?.('fit'), 250);
      const t2 = setTimeout(() => dispatcherRef.current?.('fit'), 700);
      const t3 = setTimeout(() => dispatcherRef.current?.('fit'), 1400);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        dispatcherRef.current = null;
      };
    }

    return () => {
      dispatcherRef.current = null;
    };
  }, [camera, controls, scene, parts]);

  return null;
}


/**
 * Industrial CAD Feature Edge Highlighter (ISO 10303-42 / B-Rep Standard)
 * Filters out internal triangulation seams, planar CSG tessellation lines, and T-junctions.
 * Only renders authentic mechanical feature edges (creases with dihedral angle >= threshold).
 */
function CADEdges({
  geometry,
  color = '#00e5ff',
  threshold = 38,
  clippingPlanes,
}: {
  geometry: THREE.BufferGeometry;
  color?: string;
  threshold?: number;
  clippingPlanes?: THREE.Plane[];
}) {
  const lineGeom = useMemo(() => {
    const lg = new THREE.BufferGeometry();
    if (!geometry) return lg;

    const thresholdDot = Math.cos((threshold * Math.PI) / 180);
    const precision = 1000; // 0.001 units = 0.01 mm tolerance
    const indexAttr = geometry.getIndex();
    const posAttr = geometry.getAttribute('position');
    if (!posAttr) return lg;

    const indexCount = indexAttr ? indexAttr.count : posAttr.count;
    const _tri = new THREE.Triangle();
    const _normal = new THREE.Vector3();
    const vertices: number[] = [];

    interface EdgeRecord {
      normal: THREE.Vector3;
      va: THREE.Vector3;
      vb: THREE.Vector3;
      count: number;
      isFeature: boolean;
    }
    const edgeMap = new Map<string, EdgeRecord>();

    for (let i = 0; i < indexCount; i += 3) {
      const i0 = indexAttr ? indexAttr.getX(i) : i;
      const i1 = indexAttr ? indexAttr.getX(i + 1) : i + 1;
      const i2 = indexAttr ? indexAttr.getX(i + 2) : i + 2;

      _tri.a.fromBufferAttribute(posAttr, i0);
      _tri.b.fromBufferAttribute(posAttr, i1);
      _tri.c.fromBufferAttribute(posAttr, i2);
      _tri.getNormal(_normal);

      const h0 = `${Math.round(_tri.a.x * precision)},${Math.round(_tri.a.y * precision)},${Math.round(_tri.a.z * precision)}`;
      const h1 = `${Math.round(_tri.b.x * precision)},${Math.round(_tri.b.y * precision)},${Math.round(_tri.b.z * precision)}`;
      const h2 = `${Math.round(_tri.c.x * precision)},${Math.round(_tri.c.y * precision)},${Math.round(_tri.c.z * precision)}`;

      if (h0 === h1 || h1 === h2 || h2 === h0) continue;

      const edges: [string, string, THREE.Vector3, THREE.Vector3][] = [
        [h0, h1, _tri.a, _tri.b],
        [h1, h2, _tri.b, _tri.c],
        [h2, h0, _tri.c, _tri.a]
      ];

      for (const [ha, hb, va, vb] of edges) {
        // Undirected key ensures consistent lookup regardless of triangle winding order
        const key = ha < hb ? `${ha}_${hb}` : `${hb}_${ha}`;

        const existing = edgeMap.get(key);
        if (existing) {
          existing.count++;
          const dot = _normal.dot(existing.normal);
          // Only flag as feature edge if dihedral angle >= threshold (dot <= thresholdDot)
          // Coplanar triangles (dot ≈ 1.0) on flat faces are strictly excluded
          if (dot <= thresholdDot) {
            existing.isFeature = true;
          }
        } else {
          edgeMap.set(key, {
            normal: _normal.clone(),
            va: va.clone(),
            vb: vb.clone(),
            count: 1,
            isFeature: false,
          });
        }
      }
    }

    for (const [, edge] of edgeMap) {
      if (edge.isFeature) {
        vertices.push(edge.va.x, edge.va.y, edge.va.z, edge.vb.x, edge.vb.y, edge.vb.z);
      }
    }

    lg.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return lg;
  }, [geometry, threshold]);

  return (
    <lineSegments geometry={lineGeom} renderOrder={10}>
      <lineBasicMaterial
        color={color}
        depthTest={true}
        polygonOffset
        polygonOffsetFactor={-1.5}
        polygonOffsetUnits={-1.5}
        clippingPlanes={clippingPlanes}
      />
    </lineSegments>
  );
}

// ─── BLENDER-STYLE 3D SCULPTING MESH COMPONENT ───
function SolidMesh({ 
  part, 
  renderMode, 
  clippingPlanes,
  isSculptMode,
  onSculptStroke,
  partIndex,
  totalParts,
  onContextMenuPart,
  onHoverMateFeature,
  onMateSuccess,
}: { 
  part: DesignPart; 
  renderMode: RenderMode; 
  clippingPlanes?: THREE.Plane[];
  isSculptMode?: boolean;
  onSculptStroke?: (mutatedGeom: THREE.BufferGeometry) => void;
  partIndex: number;
  totalParts: number;
  onContextMenuPart?: (e: any, partId: string, clickedFeature?: MateFeature | null) => void;
  onHoverMateFeature?: (info: { part: DesignPart; feature: MateFeature; point: THREE.Vector3 } | null) => void;
  onMateSuccess?: (info: { partAName: string; partBName: string; kind: MateKind; mateId: string }) => void;
}) {
  const isSelected = useDesignStore((s) => s.selectedId === part.id);
  const select = useDesignStore((s) => s.select);
  const tool = useDesignStore((s) => s.tool);
  const isSketchMode = tool === 'sketch-add' || tool === 'sketch-cut' || tool === 'sketch-loft';
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
  const showMeshWireframe = useDesignStore((s) => s.showMeshWireframe);
  const showCadEdges = useDesignStore((s) => s.showCadEdges);
  const editingPartId = useDesignStore((s) => s.editingPartId);
  const editingSubAssemblyId = useDesignStore((s) => s.editingSubAssemblyId);

  // Autodesk Inventor In-Place Part/Subassembly Ghosting Mode
  const isGhost = isolatedPartId
    ? isolatedPartId !== part.id
    : editingPartId
    ? editingPartId !== part.id
    : editingSubAssemblyId
    ? part.subAssemblyId !== editingSubAssemblyId
    : false;
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

  // ─── CONTINUOUS ENGINEERING: LIVE FEA STRESS HEATMAP & CAM TOOLPATH ───
  const activeWorkbench = useDesignStore((s) => s.activeWorkbench);
  const showLiveFeaStress = useDesignStore((s) => s.showLiveFeaStress);
  const feaAppliedLoadKn = useDesignStore((s) => s.feaAppliedLoadKn);
  const feaLoadType = useDesignStore((s) => s.feaLoadType);
  const isFeaActive = (showLiveFeaStress || activeWorkbench === 'fea') && isSelected;

  const showCamToolpath = useDesignStore((s) => s.showCamToolpath);
  const camToolDiaMm = useDesignStore((s) => s.camToolDiaMm);
  const isCamActive = (showCamToolpath || activeWorkbench === 'cam') && isSelected;

  // Real-Time FEA von Mises Stress Rainbow Heatmap on 3D Mesh Surface
  const feaColoredGeom = useMemo(() => {
    if (!geom || !isFeaActive) return null;
    const cloned = geom.clone();
    const pos = cloned.attributes.position;
    if (!pos || pos.count === 0) return cloned;

    cloned.computeBoundingBox();
    const bb = cloned.boundingBox || new THREE.Box3();
    const minY = bb.min.y;
    const height = Math.max(bb.max.y - bb.min.y, 0.1);
    const minX = bb.min.x;
    const spanX = Math.max(bb.max.x - bb.min.x, 0.1);

    const count = pos.count;
    const colors = new Float32Array(count * 3);
    const forceN = (feaAppliedLoadKn || 15) * 1000;

    // Estimate nominal maximum stress (MPa) based on section mechanics
    const p = part.params || {};
    const w = Number(p.width || p.diameter || 40);
    const h = Number(p.height || p.thickness || 20);
    const len = Number(p.length || p.extrudeDepth || p.depth || 80);
    const secMod = (w * Math.pow(h, 2)) / 6;
    const maxNominalStress = Math.max(5, (forceN * len) / (4 * Math.max(secMod, 1)));

    for (let i = 0; i < count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);

      let localStress = 0;
      if (feaLoadType === 'bending') {
        // Peak stress at outer fibers (y-distance from neutral axis) and towards fixed base
        const distFromRoot = Math.abs(vx - minX) / spanX;
        const distFromNeutral = Math.abs(vy - (minY + height / 2)) / (height / 2);
        localStress = maxNominalStress * (1.0 - 0.7 * distFromRoot) * (0.2 + 0.8 * distFromNeutral);
      } else if (feaLoadType === 'tension') {
        const distFromRoot = Math.abs(vx - minX) / spanX;
        localStress = maxNominalStress * (0.8 + 0.3 * Math.sin(distFromRoot * Math.PI));
      } else {
        // Torsion shear
        const distFromCenter = Math.hypot(vx, vy) / (height / 2);
        localStress = maxNominalStress * Math.min(distFromCenter, 1.2);
      }

      // Rainbow color ramp: 240° (Blue, zero stress) -> 120° (Green) -> 60° (Yellow) -> 0° (Red, peak stress)
      const ratio = Math.min(Math.max(localStress / Math.max(maxNominalStress * 1.15, 1), 0), 1);
      const hue = (1.0 - ratio) * 240;
      const c = new THREE.Color(`hsl(${hue}, 100%, 50%)`);

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    cloned.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return cloned;
  }, [geom, isFeaActive, feaAppliedLoadKn, feaLoadType, part.params]);

  const displayGeom = isFeaActive && feaColoredGeom ? feaColoredGeom : geom;

  // Real-Time 3D CAM CNC Toolpath Outline around part
  const camToolpathGeom = useMemo(() => {
    if (!geom || !isCamActive) return null;
    geom.computeBoundingBox();
    const bb = geom.boundingBox || new THREE.Box3();
    const minX = bb.min.x - 0.2;
    const maxX = bb.max.x + 0.2;
    const minZ = bb.min.z - 0.2;
    const maxZ = bb.max.z + 0.2;
    const topY = bb.max.y + 0.1;

    const points: number[] = [
      // Approach & Plunge
      minX - 1, topY + 2, minZ - 1,   minX, topY + 2, minZ,
      minX, topY + 2, minZ,           minX, topY, minZ,
      // Perimeter Pass
      minX, topY, minZ,               maxX, topY, minZ,
      maxX, topY, minZ,               maxX, topY, maxZ,
      maxX, topY, maxZ,               minX, topY, maxZ,
      minX, topY, maxZ,               minX, topY, minZ,
      // Retract
      minX, topY, minZ,               minX - 1, topY + 3, minZ - 1,
    ];

    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return lg;
  }, [geom, isCamActive, camToolDiaMm]);

  const wireGeom = useMemo(() => {
    if (!geom) return null;
    return new THREE.WireframeGeometry(geom);
  }, [geom]);

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
  // If ghosted due to isolation, respect the ghostIsolated toggle;
  // If ghosted due to Autodesk Inventor in-place editing, always render as reference geometry
  if (isGhost && isolatedPartId && !ghostIsolated) return null;

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

  // If Ghost mode for non-isolated part in assembly or Autodesk Inventor in-place part edit mode
  if (isGhost) {
    return (
      <mesh 
        ref={meshRef} 
        geometry={geom} 
        position={finalPos} 
        rotation={rot} 
        scale={scale}
        onContextMenu={(e) => {
          e.stopPropagation();
          let clickedFeat: MateFeature | null = null;
          if (e.face && meshRef.current) {
            clickedFeat = classifyFeatureFromRaycast(e.point, e.face.normal, meshRef.current, part);
          }
          onContextMenuPart?.(e, part.id, clickedFeat);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          useDesignStore.getState().openPartStudioForPart(part.id);
        }}
      >
        <meshStandardMaterial
          color="#94a3b8"
          transparent
          opacity={0.20}
          depthWrite={false}
          wireframe={false}
          roughness={0.9}
        />
        <CADEdges geometry={geom} color="#475569" threshold={38} clippingPlanes={clippingPlanes} />
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
        geometry={displayGeom}
        position={finalPos}
        rotation={rot}
        scale={scale}
        renderOrder={3}
        onContextMenu={(e) => {
          e.stopPropagation();
          let clickedFeat: MateFeature | null = null;
          if (e.face && meshRef.current) {
            clickedFeat = classifyFeatureFromRaycast(e.point, e.face.normal, meshRef.current, part);
            const pickedFace = classifySurfaceFaceFromLocalNormal(e.face.normal);
            setActiveFace(pickedFace);
          }

          // If in Mate mode and 1st entity is already selected on another part:
          // Right-clicking directly on the 2nd surface ALSO completes the mate!
          const store = useDesignStore.getState();
          const draft = store.activeMateDraft;
          if (tool === 'mate' && draft?.partAId && draft.partAId !== part.id && clickedFeat) {
            const partA = store.parts.find((p) => p.id === draft.partAId);
            const featsA = partA ? extractPartFeatures(partA, true) : [];
            const featA = featsA.find((f) => f.id === draft.featureAId);

            const smartKind: MateKind = inferSmartMateKind(featA, clickedFeat);

            store.updateMateDraft({
              partBId: part.id,
              featureBId: clickedFeat.id,
              kind: smartKind,
            });

            const success = store.commitMateDraft();
            if (success) {
              onMateSuccess?.({
                partAName: partA?.name || 'Part A',
                partBName: part.name,
                kind: smartKind,
                mateId: store.selectedMateId || 'mate',
              });
            }
            return;
          }

          onContextMenuPart?.(e, part.id, clickedFeat);
        }}
        onClick={(e) => {
          if (isSketchMode) return;
          const storeState = useDesignStore.getState();

          // ─── 0. CLICK-TO-PLACE HOLE & FACE PICK MODE (Yüzeye Tıkla Del / Yüzey Seçimi) ───
          if ((facePickMode || tool === 'hole' || storeState.clickToPlaceHole) && e.face) {
            e.stopPropagation();
            const picked = classifySurfaceFaceFromLocalNormal(e.face.normal);
            select(part.id);
            setActiveFace(picked);

            if (tool === 'hole' || storeState.clickToPlaceHole || facePickMode) {
              let localX = 0;
              let localY = 0;
              const mesh = meshRef.current;
              if (mesh && e.point) {
                mesh.updateMatrixWorld(true);
                const localHit = mesh.worldToLocal(e.point.clone());
                const metrics = getPartBoundingMetrics(part);
                const faceXf = metrics.getFaceTransform(picked);
                const faceMat = new THREE.Matrix4().compose(
                  new THREE.Vector3(...faceXf.pos),
                  new THREE.Quaternion().setFromEuler(new THREE.Euler(...faceXf.rot)),
                  new THREE.Vector3(1, 1, 1)
                );
                const invFaceMat = faceMat.clone().invert();
                const ptOnFace = localHit.clone().applyMatrix4(invFaceMat);
                const rawX = ptOnFace.x * 10;
                const rawY = ptOnFace.y * 10;
                if (Math.hypot(rawX, rawY) < 4) {
                  localX = 0;
                  localY = 0;
                } else {
                  localX = Math.round(rawX);
                  localY = Math.round(rawY);
                }
              }
              const holeCfg = storeState.activeHoleConfig || { size: 'M6', type: 'counterbore' };
              storeState.addHole(part.id, {
                size: (holeCfg.size || 'M6') as any,
                type: (holeCfg.type || 'counterbore') as any,
                face: picked,
                x: localX,
                y: localY,
                depth: 20,
                throughAll: true,
              });
            }

            if (facePickMode) {
              setFacePickMode(false);
            }
            return;
          }

          if (tool === 'measure' || studioMode === 'inspect') {
            e.stopPropagation();
            const mesh = meshRef.current;
            if (!mesh) return;

            mesh.updateMatrixWorld(true);

            let normalWorld: THREE.Vector3 | undefined = undefined;
            if (e.face && e.face.normal) {
              normalWorld = e.face.normal.clone().transformDirection(mesh.matrixWorld).normalize();
            }

            // ─── 0. UNEXPLODED & TRUE NOMINAL CAD COORDINATE CALCULATION ───
            // 1. Transform hit point to part's local coordinate frame
            const localHit = mesh.worldToLocal(e.point.clone());

            // 2. Vertex & Edge Snapping Engine (5 mm threshold)
            let snappedLocal = localHit.clone();
            const geomMesh = mesh.geometry;
            if (geomMesh && geomMesh.attributes.position) {
              const posAttr = geomMesh.attributes.position;
              let minSnapDist = 0.5; // 5 mm in Three.js units (scale: 0.1)
              const pVec = new THREE.Vector3();
              const sampleLimit = Math.min(posAttr.count, 3000);
              for (let vi = 0; vi < sampleLimit; vi++) {
                pVec.fromBufferAttribute(posAttr, vi);
                const d = pVec.distanceTo(localHit);
                if (d < minSnapDist) {
                  minSnapDist = d;
                  snappedLocal.copy(pVec);
                }
              }
            }

            // 3. Transform snapped local point to true unexploded nominal assembly world coordinates
            const nominalMatrix = new THREE.Matrix4();
            const px = part.position.x / 10;
            const py = part.position.y / 10;
            const pz = part.position.z / 10;
            const rx = ((part.rotation?.x || 0) * Math.PI) / 180;
            const ry = ((part.rotation?.y || 0) * Math.PI) / 180;
            const rz = ((part.rotation?.z || 0) * Math.PI) / 180;
            const sx = part.scale?.x ?? 1;
            const sy = part.scale?.y ?? 1;
            const sz = part.scale?.z ?? 1;

            nominalMatrix.compose(
              new THREE.Vector3(px, py, pz),
              new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'XYZ')),
              new THREE.Vector3(sx, sy, sz)
            );

            const nominalWorldPoint = snappedLocal.clone().applyMatrix4(nominalMatrix);

            const pt: { x: number; y: number; z: number; nx?: number; ny?: number; nz?: number } = {
              x: Math.round(nominalWorldPoint.x * 100) / 10,
              y: Math.round(nominalWorldPoint.y * 100) / 10,
              z: Math.round(nominalWorldPoint.z * 100) / 10,
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
                y: Math.round(nominalWorldPoint.y * 10),
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
                  const v0 = new THREE.Vector3().fromBufferAttribute(posAttr, idx0).applyMatrix4(nominalMatrix);
                  const v1 = new THREE.Vector3().fromBufferAttribute(posAttr, idx1).applyMatrix4(nominalMatrix);
                  const v2 = new THREE.Vector3().fromBufferAttribute(posAttr, idx2).applyMatrix4(nominalMatrix);

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

          // ─── 3. SOLIDWORKS ASSEMBLY MATE 3D RAYCASTING & FEATURE SELECTION ───
          if (tool === 'mate') {
            e.stopPropagation();
            const mesh = meshRef.current;
            if (!mesh || !e.face) return;
            mesh.updateMatrixWorld(true);

            const selectedFeature = classifyFeatureFromRaycast(e.point, e.face.normal, mesh, part);
            if (!selectedFeature) return;

            const store = useDesignStore.getState();
            const draft = store.activeMateDraft;

            if (!draft?.partAId || !draft?.featureAId || draft.partAId === part.id) {
              // Set Entity 1
              store.updateMateDraft({
                partAId: part.id,
                featureAId: selectedFeature.id,
                featureAName: selectedFeature.name,
              });
              select(part.id);
            } else {
              // Set Entity 2! -> LIVE SOLIDWORKS SMART MATE SNAP PREVIEW & AUTO-COMMIT!
              const partA = store.parts.find((p) => p.id === draft.partAId);
              const featsA = partA ? extractPartFeatures(partA, true) : [];
              const featA = featsA.find((f) => f.id === draft.featureAId);

              // Smart Mate Type Inference from selected feature pair
              const smartKind: MateKind = inferSmartMateKind(featA, selectedFeature);

              store.updateMateDraft({
                partBId: part.id,
                featureBId: selectedFeature.id,
                featureBName: selectedFeature.name,
                kind: smartKind,
              });

              // Instant Auto-Commit on 2nd Click (SolidWorks 2-Click Smart Mate)
              const success = store.commitMateDraft();
              if (success) {
                onMateSuccess?.({
                  partAName: partA?.name || 'Part A',
                  partBName: part.name,
                  kind: smartKind,
                  mateId: store.selectedMateId || 'mate',
                });
              }
            }
            return;
          }

          if (!isSculptMode && !isSketchMode) {
            e.stopPropagation();
            if (e.face) {
              const pickedFace = classifySurfaceFaceFromLocalNormal(e.face.normal);
              setActiveFace(pickedFace);
            }
            select(part.id);
          }
        }}
        onDoubleClick={(e) => {
          if (!isSculptMode && !isSketchMode) {
            e.stopPropagation();
            useDesignStore.getState().openPartStudioForPart(part.id);
          }
        }}
        onPointerDown={(e) => {
          if (isSketchMode) return;
          if (isSculptMode && isSelected) {
            e.stopPropagation();
            isPointerDownRef.current = true;
            if (e.point && e.face?.normal) {
              applySculptAtPoint(e.point, e.face.normal);
            }
          }
        }}
        onPointerMove={(e) => {
          if (isSketchMode) return;
          if (isSculptMode && isSelected && isPointerDownRef.current) {
            e.stopPropagation();
            if (e.point && e.face?.normal) {
              applySculptAtPoint(e.point, e.face.normal);
            }
            return;
          }

          // Live Hover Indicator for Mate Mode
          if (tool === 'mate' && e.face && meshRef.current) {
            const feat = classifyFeatureFromRaycast(e.point, e.face.normal, meshRef.current, part);
            if (feat) {
              onHoverMateFeature?.({ part, feature: feat, point: e.point.clone() });
            }
          }
        }}
        onPointerUp={() => {
          isPointerDownRef.current = false;
        }}
        onPointerLeave={() => {
          isPointerDownRef.current = false;
          if (tool === 'mate') {
            onHoverMateFeature?.(null);
          }
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
            transparent={part.opacity !== undefined && part.opacity < 1}
            opacity={part.opacity ?? 1}
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
            transparent={part.opacity !== undefined && part.opacity < 1}
            opacity={part.opacity ?? 1}
            roughness={0.4}
            metalness={0.6}
            side={THREE.DoubleSide}
            emissive={isSelected ? '#38bdf8' : '#111'}
            clippingPlanes={clippingPlanes}
            clipShadows
          />
        ) : (
          <meshStandardMaterial
            color={isFeaActive ? '#ffffff' : color}
            transparent={part.opacity !== undefined && part.opacity < 1}
            opacity={part.opacity ?? 1}
            roughness={0.3}
            metalness={0.2}
            side={THREE.DoubleSide}
            emissive={emissive}
            clippingPlanes={clippingPlanes}
            clipShadows
            vertexColors={isFeaActive}
          />
        )}

        {/* Edge Highlights */}
        {(showCadEdges || renderMode === 'edges' || isSelected) && (
          <CADEdges
            geometry={geom}
            threshold={38}
            color={isSelected ? '#00e5ff' : '#475569'}
            clippingPlanes={clippingPlanes}
          />
        )}

        {/* 3D Mesh Wireframe Triangles Overlay */}
        {(showMeshWireframe || renderMode === 'wire') && wireGeom && (
          <lineSegments geometry={wireGeom} renderOrder={15}>
            <lineBasicMaterial
              color={isSelected ? '#00e5ff' : '#94a3b8'}
              transparent
              opacity={0.55}
              depthTest={true}
              polygonOffset
              polygonOffsetFactor={-1.2}
              polygonOffsetUnits={-1.2}
              clippingPlanes={clippingPlanes}
            />
          </lineSegments>
        )}
      </mesh>

      {/* ─── REAL-TIME 3D CAM CNC TOOLPATH OVERLAY ─── */}
      {camToolpathGeom && (
        <lineSegments
          geometry={camToolpathGeom}
          position={finalPos}
          rotation={rot}
          scale={scale}
          renderOrder={20}
        >
          <lineBasicMaterial
            color="#00e5ff"
            transparent
            opacity={0.9}
            depthTest={true}
          />
        </lineSegments>
      )}

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
        <div className="rounded-lg bg-slate-950/90 text-cyan-300 font-mono text-[8px] font-black px-2 py-0.5 shadow-xl border border-cyan-500/40 pointer-events-none select-none whitespace-nowrap flex items-center gap-1">
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
                <div className="flex flex-col gap-1.5 rounded-2xl bg-slate-950/95 p-3 font-mono text-[10px] text-white border border-emerald-400/80 shadow-2xl select-none min-w-[190px] animate-in fade-in zoom-in-95">
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
              <div className="flex flex-col gap-1.5 rounded-2xl bg-slate-950/95 p-3 font-mono text-[10px] text-white border border-cyan-400/80 shadow-2xl select-none min-w-[210px] animate-in fade-in zoom-in-95">
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
        <div className="rounded-xl bg-slate-950/95 border border-rose-500/60 px-2.5 py-1 font-mono text-[9px] text-white shadow-2xl select-none whitespace-nowrap animate-in fade-in">
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

// ─── 3D SOLIDWORKS ASSEMBLY MATES VISUALIZER LAYER ───
function AssemblyMatesVisualizerLayer({
  hoveredMateFeature,
}: {
  hoveredMateFeature?: { part: DesignPart; feature: MateFeature; point: THREE.Vector3 } | null;
}) {
  const mates = useDesignStore((s) => s.mates);
  const selectedMateId = useDesignStore((s) => s.selectedMateId);
  const parts = useDesignStore((s) => s.parts);
  const tool = useDesignStore((s) => s.tool);
  const draft = useDesignStore((s) => s.activeMateDraft);

  const activeMates = useMemo(() => {
    return (mates || []).filter((m) => m.active !== false && !m.suppressed);
  }, [mates]);

  // Entity 1 info in current draft
  const draftA = useMemo(() => {
    if (tool !== 'mate' || !draft?.partAId || !draft?.featureAId) return null;
    const partA = parts.find((p) => p.id === draft.partAId);
    if (!partA) return null;
    const featsA = extractPartFeatures(partA, true);
    const featA = featsA.find((f) => f.id === draft.featureAId);
    if (!featA) return null;
    const getFeatureWorldPos = (feat: MateFeature): [number, number, number] => {
      if (feat.kind === 'planar-face') {
        return [feat.origin.x / 10, feat.origin.y / 10, feat.origin.z / 10];
      }
      return [feat.center.x / 10, feat.center.y / 10, feat.center.z / 10];
    };

    const pos = getFeatureWorldPos(featA);
    return { part: partA, feature: featA, pos };
  }, [tool, draft, parts]);

  // Hovered Candidate info
  const hoverB = useMemo(() => {
    if (tool !== 'mate' || !hoveredMateFeature) return null;
    const { part, feature } = hoveredMateFeature;
    const pos = feature.kind === 'planar-face'
      ? [feature.origin.x / 10, feature.origin.y / 10, feature.origin.z / 10] as [number, number, number]
      : [feature.center.x / 10, feature.center.y / 10, feature.center.z / 10] as [number, number, number];
    const isEntity1 = draftA && draftA.part.id === part.id;
    return { part, feature, pos, isEntity1 };
  }, [tool, hoveredMateFeature, draftA]);

  return (
    <group>
      {/* ─── 1. COMMITTED ACTIVE MATES ─── */}
      {activeMates.map((mate) => {
        const isSelected = selectedMateId === mate.id;
        const partA = parts.find((p) => p.id === mate.partAId);
        const partB = parts.find((p) => p.id === mate.partBId);
        if (!partA || !partB) return null;

        const featsA = extractPartFeatures(partA, true);
        const featsB = extractPartFeatures(partB, true);
        const fA = featsA.find((f) => f.id === mate.featureA.id) || mate.featureA;
        const fB = featsB.find((f) => f.id === mate.featureB.id) || mate.featureB;

        // 1. Concentric Mate Visualizer
        if (mate.kind === 'concentric' && fA.kind === 'hole-axis' && fB.kind === 'hole-axis') {
          const cA: [number, number, number] = [fA.center.x / 10, fA.center.y / 10, fA.center.z / 10];
          const cB: [number, number, number] = [fB.center.x / 10, fB.center.y / 10, fB.center.z / 10];
          const mid: [number, number, number] = [(cA[0] + cB[0]) / 2, (cA[1] + cB[1]) / 2, (cA[2] + cB[2]) / 2];

          // Extend axis line
          const ax = fA.axis;
          const p1: [number, number, number] = [cA[0] - ax.x * 2, cA[1] - ax.y * 2, cA[2] - ax.z * 2];
          const p2: [number, number, number] = [cB[0] + ax.x * 2, cB[1] + ax.y * 2, cB[2] + ax.z * 2];

          const color = isSelected ? '#3ad0e6' : '#3dd68c';

          return (
            <group key={mate.id}>
              {/* Dashed Collinear Alignment Line */}
              <Line points={[p1, p2]} color={color} lineWidth={isSelected ? 3 : 1.5} dashed dashScale={10} dashSize={0.4} gapSize={0.2} />

              {/* Indicator Points at centers */}
              <group position={cA}>
                <mesh>
                  <sphereGeometry args={[0.08, 12, 12]} />
                  <meshBasicMaterial color={color} depthTest={false} />
                </mesh>
              </group>
              <group position={cB}>
                <mesh>
                  <sphereGeometry args={[0.08, 12, 12]} />
                  <meshBasicMaterial color={color} depthTest={false} />
                </mesh>
              </group>

              {isSelected && (
                <Html position={mid} center>
                  <div className="px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-400 text-cyan-300 font-mono text-[8px] font-bold shadow-lg select-none whitespace-nowrap animate-in fade-in">
                    ◎ Concentric (Eşmerkezli)
                  </div>
                </Html>
              )}
            </group>
          );
        }

        // 2. Coincident / Distance Mate Visualizer
        if ((mate.kind === 'coincident' || mate.kind === 'distance') && fA.kind === 'planar-face' && fB.kind === 'planar-face') {
          const oA: [number, number, number] = [fA.origin.x / 10, fA.origin.y / 10, fA.origin.z / 10];
          const oB: [number, number, number] = [fB.origin.x / 10, fB.origin.y / 10, fB.origin.z / 10];
          const mid: [number, number, number] = [(oA[0] + oB[0]) / 2, (oA[1] + oB[1]) / 2, (oA[2] + oB[2]) / 2];

          const color = isSelected ? '#3ad0e6' : '#10b981';

          return (
            <group key={mate.id}>
              <Line points={[oA, oB]} color={color} lineWidth={isSelected ? 3 : 1.5} />
              {isSelected && (
                <Html position={mid} center>
                  <div className="px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-400 text-emerald-300 font-mono text-[8px] font-bold shadow-lg select-none whitespace-nowrap animate-in fade-in">
                    {mate.kind === 'coincident' ? '⫽ Coincident (Çakışık)' : `⇥ Distance (${mate.offset ?? 0} mm)`}
                  </div>
                </Html>
              )}
            </group>
          );
        }

        return null;
      })}

      {/* ─── 2. LIVE DRAFT ENTITY 1 MARKER (CYAN) ─── */}
      {draftA && (
        <group position={draftA.pos}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.45, 32]} />
            <meshBasicMaterial color="#3ad0e6" side={THREE.DoubleSide} transparent opacity={0.9} depthTest={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshBasicMaterial color="#3ad0e6" depthTest={false} />
          </mesh>

          {/* Callout badge */}
          <Html position={[0, 0.5, 0]} center>
            <div className="px-2 py-0.5 rounded bg-cyan-950/95 border border-cyan-400 text-cyan-300 font-mono text-[9px] font-black select-none whitespace-nowrap animate-bounce pointer-events-none">
              [1] {draftA.part.name} · {draftA.feature.name}
            </div>
          </Html>
        </group>
      )}

      {/* ─── 3. LIVE HOVER CANDIDATE MARKER & LASER LINE ─── */}
      {hoverB && (
        <group position={hoverB.pos}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.32, 0.48, 32]} />
            <meshBasicMaterial
              color={hoverB.isEntity1 ? '#3ad0e6' : '#3dd68c'}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
              depthTest={false}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color={hoverB.isEntity1 ? '#3ad0e6' : '#3dd68c'} depthTest={false} />
          </mesh>

          {/* Connecting Laser Guide from Entity 1 to Candidate Entity 2 */}
          {draftA && !hoverB.isEntity1 && (
            <Line
              points={[draftA.pos, hoverB.pos]}
              color="#3dd68c"
              lineWidth={2.5}
              dashed
              dashScale={12}
              dashSize={0.4}
              gapSize={0.2}
            />
          )}

          {/* Interactive Guidance Badge */}
          <Html position={[0, 0.5, 0]} center>
            <div className={`px-2 py-0.5 rounded font-mono text-[9px] font-black shadow-lg select-none whitespace-nowrap pointer-events-none ${
              hoverB.isEntity1
                ? 'bg-cyan-950/90 border border-cyan-400 text-cyan-300'
                : draftA
                ? 'bg-emerald-950/95 border border-emerald-400 text-emerald-300 animate-pulse'
                : 'bg-cyan-950/90 border border-cyan-400 text-cyan-300'
            }`}>
              {hoverB.isEntity1
                ? `[1] ${hoverB.part.name} ▸ ${hoverB.feature.name}`
                : draftA
                ? (() => {
                    const smartK = inferSmartMateKind(draftA.feature, hoverB.feature);
                    const smartLabel = smartK === 'concentric'
                      ? '◎ EŞMERKEZLİ'
                      : smartK === 'coincident'
                      ? '⫽ ÇAKIŞIK'
                      : smartK === 'tangent'
                      ? '⤢ TEĞET'
                      : smartK === 'end-to-slot'
                      ? '⤵ KANAL-UÇ'
                      : '📎 MONTAJ';
                    return `[2] ${hoverB.part.name} ▸ ${hoverB.feature.name} ➔ ${smartLabel} (Tıkla!)`;
                  })()
                : `[1] ${hoverB.part.name} ▸ ${hoverB.feature.name} (1. Unsuru Seç)`}
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

// ─── 3D FASTENER HOLES & THREAD INTERFERENCE LAYER ───
function FastenerHolesLayer() {
  const holes = useDesignStore((s) => s.holes);
  const selectedPart = useDesignStore((s) => s.getSelected());
  const tool = useDesignStore((s) => s.tool);
  const explodeFactor = useDesignStore((s) => s.explodeFactor);
  const explodeDirection = useDesignStore((s) => s.explodeDirection);
  const parts = useDesignStore((s) => s.parts);

  if (!selectedPart || holes.length === 0) return null;

  const metrics = getPartBoundingMetrics(selectedPart);
  const issues = checkHoleInterferences(holes, {
    width: metrics.size.x * 10,
    height: metrics.size.z * 10,
  });

  const partRot: [number, number, number] = [
    (selectedPart.rotation.x * Math.PI) / 180,
    (selectedPart.rotation.y * Math.PI) / 180,
    (selectedPart.rotation.z * Math.PI) / 180,
  ];

  let partPos: [number, number, number] = [
    selectedPart.position.x / 10,
    selectedPart.position.y / 10,
    selectedPart.position.z / 10,
  ];

  if (explodeFactor > 0) {
    const f = explodeFactor / 100;
    const basePos = new THREE.Vector3(...partPos);
    const geomCenter = metrics.center;
    const combinedCenter = new THREE.Vector3().addVectors(basePos, geomCenter);
    const dist = combinedCenter.length();
    const idx = parts.findIndex((p) => p.id === selectedPart.id);
    const total = Math.max(1, parts.length);

    let explodeOffset = new THREE.Vector3();
    if (explodeDirection === 'axial-y') {
      const ySign = combinedCenter.y >= 0 ? 1 : -1;
      const magnitude = Math.max(1.5, Math.abs(combinedCenter.y) * 2.5);
      explodeOffset.set(0, ySign * magnitude * f, 0);
      if (Math.abs(combinedCenter.y) < 0.1) {
        explodeOffset.set(0, ((idx / total) - 0.5) * 8.0 * f, 0);
      }
    } else if (explodeDirection === 'axial-x') {
      const xSign = combinedCenter.x >= 0 ? 1 : -1;
      const magnitude = Math.max(1.5, Math.abs(combinedCenter.x) * 2.5);
      explodeOffset.set(xSign * magnitude * f, 0, 0);
      if (Math.abs(combinedCenter.x) < 0.1) {
        explodeOffset.set(((idx / total) - 0.5) * 8.0 * f, 0, 0);
      }
    } else if (explodeDirection === 'axial-z') {
      const zSign = combinedCenter.z >= 0 ? 1 : -1;
      const magnitude = Math.max(1.5, Math.abs(combinedCenter.z) * 2.5);
      explodeOffset.set(0, 0, zSign * magnitude * f);
      if (Math.abs(combinedCenter.z) < 0.1) {
        explodeOffset.set(0, 0, ((idx / total) - 0.5) * 8.0 * f);
      }
    } else if (explodeDirection === 'linear-sequence') {
      const spacing = 4.0 * f;
      const totalSpan = (total - 1) * spacing;
      const yOffset = -totalSpan / 2 + idx * spacing;
      explodeOffset.set(0, yOffset, 0);
    } else {
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
    partPos = [
      basePos.x + explodeOffset.x,
      basePos.y + explodeOffset.y,
      basePos.z + explodeOffset.z,
    ];
  }

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
        const placement = metrics.getCutPlacement(face, h.x, h.y);

        return (
          <group key={h.id} position={placement.pos} rotation={placement.rot}>
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
            {(hasCritical || hasWarning || tool === 'hole' || holes.length <= 4) && (
              <Html position={[0, 0.35, 0]} center distanceFactor={18} zIndexRange={[50, 0]}>
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
            )}
          </group>
        );
      })}
    </group>
  );
}

// ─── 3D ACTIVE FACE CAD GUIDE & SHAPR3D PUSH-PULL OVERLAY ───
function ActiveFaceGuideLayer() {
  const selectedPart = useDesignStore((s) => s.getSelected());
  const activeFace = useDesignStore((s) => s.activeFace);
  const facePickMode = useDesignStore((s) => s.facePickMode);
  const clickToPlaceHole = useDesignStore((s) => s.clickToPlaceHole);
  const tool = useDesignStore((s) => s.tool);
  const isSketchMode = tool === 'sketch-add';

  if (!selectedPart || isSketchMode) return null;

  const face: SurfaceFace = activeFace || 'top';
  const sketchWorld = getSketchPlaneWorldTransform(selectedPart, face);
  const planeW = sketchWorld.planeW;
  const planeH = sketchWorld.planeH;

  const handleFacePushPull = (deltaMm: number) => {
    const store = useDesignStore.getState();
    store.pushHistory();
    const res = applyPushPull(selectedPart, face, deltaMm);
    store.updatePartParams(selectedPart.id, res.updatedParams);
    store.updatePart(selectedPart.id, { name: res.updatedName });
    store.applyMates();
  };

  return (
    <group position={sketchWorld.position} quaternion={sketchWorld.quaternion}>
        <mesh>
          <planeGeometry args={[planeW, planeH]} />
          <meshBasicMaterial
            color={facePickMode || clickToPlaceHole ? '#f59e0b' : '#00e5ff'}
            transparent
            opacity={facePickMode || clickToPlaceHole ? 0.22 : 0.08}
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
          color={facePickMode || clickToPlaceHole ? '#f59e0b' : '#00e5ff'}
          lineWidth={2}
          dashed
          dashSize={0.2}
          gapSize={0.1}
        />

        {/* Origin (0,0) indicator */}
        <Line points={[[-0.3, 0, 0], [0.3, 0, 0]]} color="#00e5ff" lineWidth={1.5} />
        <Line points={[[0, -0.3, 0], [0, 0.3, 0]]} color="#00e5ff" lineWidth={1.5} />

        {/* 3D Shapr3D-Style Face Normal Push/Pull Arrow */}
        <Line points={[[0, 0, 0], [0, 0, 0.85]]} color="#00e5ff" lineWidth={2.5} depthTest={false} />
        <mesh position={[0, 0, 0.92]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.12, 0.28, 16]} />
          <meshBasicMaterial color="#00e5ff" depthTest={false} />
        </mesh>

        {/* On-Face Interactive Push/Pull & Center Drill Badge */}
        {activeFace && (
          <Html position={[0, 0, 1.25]} center distanceFactor={18} zIndexRange={[45, 0]}>
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--bg-0)]/95 border border-[var(--cyan)]/70 shadow-2xl font-mono text-[9px] text-white select-none whitespace-nowrap"
            >
              <span className="text-[var(--cyan)] font-extrabold uppercase">{face}:</span>
              <button
                type="button"
                onClick={() => handleFacePushPull(-5)}
                className="px-1 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 font-bold cursor-pointer"
                title="Yüzeyi 5mm İt (-5mm)"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => handleFacePushPull(5)}
                className="px-1 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 font-bold cursor-pointer"
                title="Yüzeyi 5mm Çek (+5mm)"
              >
                +5
              </button>
              <button
                type="button"
                onClick={() => {
                  const st = useDesignStore.getState();
                  const cfg = st.activeHoleConfig || { size: 'M6', type: 'counterbore' };
                  st.addHole(selectedPart.id, {
                    size: (cfg.size || 'M6') as any,
                    type: (cfg.type || 'counterbore') as any,
                    face,
                    x: 0,
                    y: 0,
                    depth: 20,
                    throughAll: true,
                  });
                }}
                className="px-1.5 py-0.5 rounded bg-sky-500/25 hover:bg-sky-500/40 text-sky-200 font-bold cursor-pointer"
                title="Bu Yüzeyin Merkezine Delik Del"
              >
                +Delik
              </button>
            </div>
          </Html>
        )}
    </group>
  );
}

// ─── 3D SURFACE CUTS VISUALIZATION LAYER ───
function SurfaceCutsPreviewLayer() {
  const cuts = useDesignStore((s) => s.cuts);
  const pendingCut = useDesignStore((s) => s.pendingCut);
  const selectedPart = useDesignStore((s) => s.getSelected());

  if (!selectedPart || (cuts.length === 0 && !pendingCut)) return null;

  return (
    <group>
      {/* Committed Surface Cuts */}
      {cuts.map((c) => {
        const face: SurfaceFace = c.face || 'top';
        const cw = (c.width || 30) / 10;
        const cl = (c.length || 40) / 10;
        const cd = ((c.diameter || 25) / 10) / 2;

        const sketchWorld = getSketchPlaneWorldTransform(selectedPart, face);
        const cutLocalY = face === 'top' || !face ? -c.y : c.y;
        const worldCutPos = new THREE.Vector3(c.x / 10, cutLocalY / 10, 0.02).applyMatrix4(sketchWorld.matrix);

        return (
          <group key={c.id} position={worldCutPos} quaternion={sketchWorld.quaternion}>
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

      {/* Live Pending Cut Preview */}
      {pendingCut && (() => {
        const face: SurfaceFace = pendingCut.face || 'top';
        const cw = (pendingCut.width || 30) / 10;
        const cl = (pendingCut.length || 40) / 10;
        const cd = ((pendingCut.diameter || 25) / 10) / 2;

        const sketchWorld = getSketchPlaneWorldTransform(selectedPart, face);
        const cutLocalY = face === 'top' || !face ? -pendingCut.y : pendingCut.y;
        const worldCutPos = new THREE.Vector3(pendingCut.x / 10, cutLocalY / 10, 0.02).applyMatrix4(sketchWorld.matrix);

        return (
          <group key="pending-cut-preview" position={worldCutPos} quaternion={sketchWorld.quaternion}>
            {pendingCut.type === 'circle' ? (
              <mesh>
                <ringGeometry args={[cd * 0.88, cd, 32]} />
                <meshBasicMaterial color="#fb7185" side={THREE.DoubleSide} transparent opacity={0.85} />
              </mesh>
            ) : (
              <Line
                points={[
                  [-cw / 2, -cl / 2, 0.01],
                  [cw / 2, -cl / 2, 0.01],
                  [cw / 2, cl / 2, 0.01],
                  [-cw / 2, cl / 2, 0.01],
                  [-cw / 2, -cl / 2, 0.01],
                ]}
                color="#fb7185"
                lineWidth={2.5}
                dashed
                dashSize={0.4}
                gapSize={0.2}
              />
            )}
            <Html position={[0, 0.25, 0]} center>
              <div className="px-1.5 py-0.5 rounded bg-rose-950/95 text-rose-200 font-mono font-bold text-[8px] border border-rose-400 shadow-lg select-none pointer-events-none flex items-center gap-1">
                <span>✂️</span>
                <span>{pendingCut.type === 'rect' ? 'Havuz' : pendingCut.type === 'circle' ? 'Dairesel' : 'Slot'} ({pendingCut.depth}mm)</span>
              </div>
            </Html>
          </group>
        );
      })()}
    </group>
  );
}


// ─── VISUAL ON-CANVAS INTERACTIVE MANIPULATOR GIZMO FOR SKETCH ENTITIES ───
function SketchEntityManipulator({
  entity,
  activeDrag,
  onDragStart,
  showSketchDimensions,
}: {
  entity: SketchEntity;
  activeDrag?: any;
  onDragStart: (e: any, handleType: string, entity: SketchEntity) => void;
  showSketchDimensions?: boolean;
}) {
  const isCircle = entity.type === 'circle' || entity.type === 'circle_2p';

  if (isCircle) {
    const r = (entity.radius || 20) / 10;
    const cx = (entity.center?.x || 0) / 10;
    const cy = (entity.center?.y || 0) / 10;
    return (
      <group position={[cx, cy, 0.05]}>
        {/* Center Target & Move Handle */}
        <group onPointerDown={(e) => onDragStart(e, 'center', entity)}>
          <mesh>
            <ringGeometry args={[0.08, 0.13, 24]} />
            <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshBasicMaterial color="#00e5ff" />
          </mesh>
          <Line points={[[-0.2, 0, 0.005], [0.2, 0, 0.005]]} color="#fbbf24" lineWidth={1.5} />
          <Line points={[[0, -0.2, 0.005], [0, 0.2, 0.005]]} color="#fbbf24" lineWidth={1.5} />
          <Html position={[0, -0.32, 0.02]} center style={{ pointerEvents: 'none' }}>
            <div className="px-1.5 py-0.5 rounded bg-black/90 text-amber-300 font-mono text-[8.5px] font-bold border border-amber-500/40 select-none whitespace-nowrap shadow-lg">
              🎯 X={Math.round(cx * 10)} Y={Math.round(cy * 10)}mm
            </div>
          </Html>
        </group>
        {/* Perimeter Radius Handle */}
        <mesh
          position={[r, 0, 0.02]}
          onPointerDown={(e) => onDragStart(e, 'circle-radius', entity)}
        >
          <sphereGeometry args={[0.065, 16, 16]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        <Html position={[r + 0.35, 0, 0.02]} center style={{ pointerEvents: 'none' }}>
          <div className="px-1.5 py-0.5 rounded bg-black/90 text-cyan-300 font-mono text-[8.5px] font-bold border border-cyan-400 select-none whitespace-nowrap shadow-lg">
            ⭕ R={Math.round(r * 10)}mm (Ø{Math.round(r * 20)}mm)
          </div>
        </Html>
      </group>
    );
  }

  // Rect, Polygon, Profile, Polyline, Line
  let entCx = entity.center?.x ?? 0;
  let entCy = entity.center?.y ?? 0;
  let entW = entity.width ?? 0;
  let entH = entity.height ?? 0;
  const entAngle = entity.angleDeg ?? 0;

  if ((entW === 0 || entH === 0) && entity.points && entity.points.length >= 2) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    entity.points.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    if (!entity.center) {
      entCx = (minX + maxX) / 2;
      entCy = (minY + maxY) / 2;
    }
    entW = Math.max(4, maxX - minX);
    entH = Math.max(4, maxY - minY);
  }

  const hw = entW / 20;
  const hh = entH / 20;
  const angleRad = ((entAngle || 0) * Math.PI) / 180;

  return (
    <group position={[entCx / 10, entCy / 10, 0.05]} rotation={[0, 0, angleRad]}>
      {/* Dashed Bounding Box Outline */}
      <Line
        points={[
          [-hw, -hh, 0.005],
          [hw, -hh, 0.005],
          [hw, hh, 0.005],
          [-hw, hh, 0.005],
          [-hw, -hh, 0.005],
        ]}
        color="#fbbf24"
        lineWidth={2}
        dashed
        dashSize={0.4}
        gapSize={0.25}
      />

      {/* Center Translation Gizmo (Move / Position Handle) */}
      <group
        position={[0, 0, 0.015]}
        onPointerDown={(e) => onDragStart(e, 'center', entity)}
      >
        <mesh>
          <ringGeometry args={[0.09, 0.14, 24]} />
          <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#00e5ff" />
        </mesh>
        <Line points={[[-0.22, 0, 0.008], [0.22, 0, 0.008]]} color="#fbbf24" lineWidth={1.8} />
        <Line points={[[0, -0.22, 0.008], [0, 0.22, 0.008]]} color="#fbbf24" lineWidth={1.8} />
        <Html position={[0, -0.38, 0.02]} center style={{ pointerEvents: 'none' }}>
          <div className="px-1.5 py-0.5 rounded bg-black/90 text-amber-300 font-mono text-[8.5px] font-bold border border-amber-500/40 select-none whitespace-nowrap shadow-xl">
            🎯 X={Math.round(entCx)} Y={Math.round(entCy)}mm
          </div>
        </Html>
      </group>

      {/* 4 Corner Resize Handles */}
      <mesh position={[hw, hh, 0.02]} onPointerDown={(e) => onDragStart(e, 'corner-tr', entity)}>
        <boxGeometry args={[0.13, 0.13, 0.035]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[-hw, hh, 0.02]} onPointerDown={(e) => onDragStart(e, 'corner-tl', entity)}>
        <boxGeometry args={[0.13, 0.13, 0.035]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[hw, -hh, 0.02]} onPointerDown={(e) => onDragStart(e, 'corner-br', entity)}>
        <boxGeometry args={[0.13, 0.13, 0.035]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[-hw, -hh, 0.02]} onPointerDown={(e) => onDragStart(e, 'corner-bl', entity)}>
        <boxGeometry args={[0.13, 0.13, 0.035]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>

      {/* 4 Edge Midpoint Handles */}
      <mesh position={[hw, 0, 0.02]} onPointerDown={(e) => onDragStart(e, 'edge-right', entity)}>
        <boxGeometry args={[0.06, 0.2, 0.03]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[-hw, 0, 0.02]} onPointerDown={(e) => onDragStart(e, 'edge-left', entity)}>
        <boxGeometry args={[0.06, 0.2, 0.03]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[0, hh, 0.02]} onPointerDown={(e) => onDragStart(e, 'edge-top', entity)}>
        <boxGeometry args={[0.2, 0.06, 0.03]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[0, -hh, 0.02]} onPointerDown={(e) => onDragStart(e, 'edge-bottom', entity)}>
        <boxGeometry args={[0.2, 0.06, 0.03]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Rotation Stem & Knob (360°) */}
      <Line
        points={[[0, hh, 0.01], [0, hh + 0.9, 0.01]]}
        color="#38bdf8"
        lineWidth={1.5}
        dashed
        dashSize={0.2}
        gapSize={0.15}
      />
      <mesh
        position={[0, hh + 0.9, 0.02]}
        onPointerDown={(e) => onDragStart(e, 'rotate', entity)}
      >
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <Html position={[0, hh + 1.25, 0.03]} center style={{ pointerEvents: 'none' }}>
        <div className="px-1.5 py-0.2 rounded bg-cyan-950/95 text-cyan-300 font-mono text-[8px] font-bold border border-cyan-400 select-none whitespace-nowrap shadow-lg">
          ⟳ {Math.round(entAngle)}°
        </div>
      </Html>

      {/* Live Dimension Badge */}
      <Html position={[0, hh + 0.38, 0.02]} center style={{ pointerEvents: 'none' }}>
        <div className="px-2 py-0.5 rounded bg-black/90 text-cyan-300 font-mono text-[9px] font-bold border border-cyan-400/60 select-none whitespace-nowrap shadow-xl">
          {Math.round(entW)} × {Math.round(entH)} mm
        </div>
      </Html>

      {/* Vertex Point Handles for Non-Rect Polygons / Lines */}
      {entity.type !== 'rect' && entity.points && entity.points.map((p, idx) => (
        <mesh
          key={`v-${idx}`}
          position={[(p.x - entCx) / 10, (p.y - entCy) / 10, 0.035]}
          onPointerDown={(e) => onDragStart(e, `vertex-${idx}`, entity)}
        >
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      ))}
    </group>
  );
}

// ─── INTERACTIVE 2D SKETCH CANVAS LAYER ON 3D PLANE / ACTIVE FACE ───
function InteractiveSketchPlane() {
  const { controls } = useThree();
  const tool = useDesignStore((s) => s.tool);
  const selectedPart = useDesignStore((s) => s.getSelected());
  const activeFace = useDesignStore((s) => s.activeFace);
  const sketchPoints = useDesignStore((s) => s.sketchPoints);
  const sketchClosed = useDesignStore((s) => s.sketchClosed);
  const addSketchPoint = useDesignStore((s) => s.addSketchPoint);
  const closeSketch = useDesignStore((s) => s.closeSketch);
  const sketchShapeMode = useDesignStore((s) => s.sketchShapeMode);
  const sketchCircleRadius = useDesignStore((s) => s.sketchCircleRadius);
  const addCircleSketch = useDesignStore((s) => s.addCircleSketch);
  const addRectSketch = useDesignStore((s) => s.addRectSketch);
  const addPolygonSketch = useDesignStore((s) => s.addPolygonSketch);
  const constraintOrtho = useDesignStore((s) => s.constraintOrtho);
  const constraintPerpendicular = useDesignStore((s) => s.constraintPerpendicular);
  const constraintParallel = useDesignStore((s) => s.constraintParallel);
  const constraintEqual = useDesignStore((s) => s.constraintEqual);
  const gridSnap = useDesignStore((s) => s.gridSnap);
  const sketchEntities = useDesignStore((s) => s.sketchEntities);
  const isConstructionMode = useDesignStore((s) => s.isConstructionMode);
  const showSketchDimensions = useDesignStore((s) => s.showSketchDimensions);
  const endCurrentLineSegment = useDesignStore((s) => s.endCurrentLineSegment);
  const add2PointCircleEntity = useDesignStore((s) => s.add2PointCircleEntity);
  const addSemiCircleEntity = useDesignStore((s) => s.addSemiCircleEntity);
  const add3PointArcEntity = useDesignStore((s) => s.add3PointArcEntity);
  const addEllipseEntity = useDesignStore((s) => s.addEllipseEntity);
  const selectedSketchEntityId = useDesignStore((s) => s.selectedSketchEntityId);
  const selectSketchEntity = useDesignStore((s) => s.selectSketchEntity);
  const trimSketchEntityAt = useDesignStore((s) => s.trimSketchEntityAt);
  const updateSketchEntity = useDesignStore((s) => s.updateSketchEntity);

  const [hoverPoint, setHoverPoint] = useState<Point2D | null>(null);
  const interactionPlaneRef = useRef<THREE.Mesh>(null);

  // Active Manipulator Dragging State
  const [activeDrag, setActiveDrag] = useState<{
    handleType: string;
    startPointer: { x: number; y: number };
    initialEntity: SketchEntity;
  } | null>(null);

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (activeDrag) {
        setActiveDrag(null);
        if (controls) {
          (controls as any).enabled = true;
        }
      }
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, [activeDrag, controls]);

  const startDragHandle = (
    e: any,
    handleType: string,
    entity: SketchEntity
  ) => {
    e.stopPropagation();
    if (controls) {
      (controls as any).enabled = false;
    }
    if (interactionPlaneRef.current && e.point) {
      const local = interactionPlaneRef.current.worldToLocal(e.point.clone());
      setActiveDrag({
        handleType,
        startPointer: { x: local.x * 10, y: local.y * 10 },
        initialEntity: { ...entity },
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        endCurrentLineSegment();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [endCurrentLineSegment]);

  const parts = useDesignStore((s) => s.parts);
  const editingPartId = useDesignStore((s) => s.editingPartId);
  const editingPart = useMemo(() => parts.find((p) => p.id === editingPartId), [parts, editingPartId]);
  const isSketchMode = tool === 'sketch-add' || tool === 'sketch-cut' || tool === 'sketch-loft';
  const isCutOnPart = tool === 'sketch-cut' && !!selectedPart && !!activeFace;
  const isSketchOnPart = isSketchMode && !!selectedPart && !!activeFace;
  const targetSketchPart = editingPart || (activeFace ? selectedPart : null);

  const sketchWorld = useMemo(() => {
    return getSketchPlaneWorldTransform(
      targetSketchPart,
      activeFace
    );
  }, [targetSketchPart, activeFace]);

  const points3D: [number, number, number][] = sketchPoints.map((pt) => [pt.x / 10, pt.y / 10, 0.04]);
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
        angle: ((Math.atan2(sketchPoints[sketchPoints.length - 1].y - sketchPoints[sketchPoints.length - 2].y, sketchPoints[sketchPoints.length - 1].x - sketchPoints[sketchPoints.length - 2].x) * 180) / Math.PI + 360) % 360,
      } 
    : null;

  let activeLivePoint = hoverPoint;
  let activeConstraintBadge: string | null = null;
  let isClosingSnap = false;
  let liveLength = 0;
  let liveAngle = 0;

  if (hoverPoint && !sketchClosed) {
    let targetX = hoverPoint.x;
    let targetY = hoverPoint.y;

    // A. Magnetic Snap to Point 0 (Loop Closure)
    if (sketchPoints.length >= 3) {
      const p0 = sketchPoints[0];
      const distToP0 = Math.hypot(targetX - p0.x, targetY - p0.y);
      if (distToP0 <= 15) {
        targetX = p0.x;
        targetY = p0.y;
        activeConstraintBadge = '⨂ KAPAT (CLOSE)';
        isClosingSnap = true;
      }
    }

    // B. Geometric constraints if not closing loop and lastPoint exists
    if (lastPoint && !isClosingSnap) {
      const rawDx = targetX - lastPoint.x;
      const rawDy = targetY - lastPoint.y;
      let dist = Math.hypot(rawDx, rawDy);
      let deg = ((Math.atan2(rawDy, rawDx) * 180) / Math.PI + 360) % 360;

      const angleDiff = (a: number, b: number) => Math.abs(((a - b + 180) % 360 + 360) % 360 - 180);

      // 1. Ortho Snap (0, 90, 180, 270)
      if (constraintOrtho) {
        if (angleDiff(deg, 0) < 7) {
          deg = 0;
          activeConstraintBadge = '⟷ YATAY (0°)';
        } else if (angleDiff(deg, 90) < 7) {
          deg = 90;
          activeConstraintBadge = '↕ DİKEY (90°)';
        } else if (angleDiff(deg, 180) < 7) {
          deg = 180;
          activeConstraintBadge = '⟷ YATAY (180°)';
        } else if (angleDiff(deg, 270) < 7) {
          deg = 270;
          activeConstraintBadge = '↕ DİKEY (270°)';
        }
      }

      // 2. Perpendicular Snap (90 deg relative to previous segment)
      if (prevSegment && constraintPerpendicular && !activeConstraintBadge) {
        const perp1 = (prevSegment.angle + 90) % 360;
        const perp2 = (prevSegment.angle + 270) % 360;
        if (angleDiff(deg, perp1) < 6) {
          deg = perp1;
          activeConstraintBadge = '⊥ DİK (90°)';
        } else if (angleDiff(deg, perp2) < 6) {
          deg = perp2;
          activeConstraintBadge = '⊥ DİK (90°)';
        }
      }

      // 3. Parallel Snap (0 or 180 deg relative to previous segment)
      if (prevSegment && constraintParallel && !activeConstraintBadge) {
        const par1 = prevSegment.angle;
        const par2 = (prevSegment.angle + 180) % 360;
        if (angleDiff(deg, par1) < 6) {
          deg = par1;
          activeConstraintBadge = '∥ PARALEL';
        } else if (angleDiff(deg, par2) < 6) {
          deg = par2;
          activeConstraintBadge = '∥ PARALEL';
        }
      }

      // 4. Equal Length Snap
      if (prevSegment && constraintEqual && Math.abs(dist - prevSegment.len) < 6) {
        dist = prevSegment.len;
        activeConstraintBadge = (activeConstraintBadge ? `${activeConstraintBadge} · ` : '') + `= EŞİT (${Math.round(dist)}mm)`;
      }

      const rad = (deg * Math.PI) / 180;
      targetX = Math.round(lastPoint.x + Math.cos(rad) * dist);
      targetY = Math.round(lastPoint.y + Math.sin(rad) * dist);
      liveLength = Math.round(dist);
      liveAngle = Math.round(deg);
    }

    activeLivePoint = { x: targetX, y: targetY };
  }

  // ─── SHAPE DRAWING PREVIEWS ───
  const circlePreview3D = useMemo<[number, number, number][]>(() => {
    if (sketchShapeMode !== 'circle' || !hoverPoint || sketchClosed) return [];
    const r = (sketchCircleRadius || 25) / 10;
    const pts: [number, number, number][] = [];
    const segs = 36;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push([hoverPoint.x / 10 + Math.cos(a) * r, hoverPoint.y / 10 + Math.sin(a) * r, 0.04]);
    }
    return pts;
  }, [sketchShapeMode, hoverPoint, sketchCircleRadius, sketchClosed]);

  const circle2pPreview3D = useMemo<[number, number, number][]>(() => {
    if (sketchShapeMode !== 'circle_2p' || sketchClosed || sketchPoints.length !== 1 || !hoverPoint) return [];
    const p1 = sketchPoints[0];
    const p2 = hoverPoint;
    const cx = (p1.x + p2.x) / 20;
    const cy = (p1.y + p2.y) / 20;
    const r = Math.max(0.2, Math.hypot(p2.x - p1.x, p2.y - p1.y) / 20);
    const pts: [number, number, number][] = [];
    const segs = 36;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0.04]);
    }
    return pts;
  }, [sketchShapeMode, sketchClosed, sketchPoints, hoverPoint]);

  const arcSemiPreview3D = useMemo<[number, number, number][]>(() => {
    if (sketchShapeMode !== 'arc_semi' || sketchClosed || sketchPoints.length !== 1 || !hoverPoint) return [];
    const p1 = sketchPoints[0];
    const p2 = hoverPoint;
    const cx = (p1.x + p2.x) / 20;
    const cy = (p1.y + p2.y) / 20;
    const r = Math.max(0.2, Math.hypot(p2.x - p1.x, p2.y - p1.y) / 20);
    const startA = Math.atan2(p1.y / 10 - cy, p1.x / 10 - cx);
    const pts: [number, number, number][] = [];
    const segs = 24;
    for (let i = 0; i <= segs; i++) {
      const a = startA + (Math.PI * i) / segs;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0.04]);
    }
    return pts;
  }, [sketchShapeMode, sketchClosed, sketchPoints, hoverPoint]);

  const arc3pPreview3D = useMemo<[number, number, number][]>(() => {
    if (sketchShapeMode !== 'arc_3p' || sketchClosed || !hoverPoint) return [];
    if (sketchPoints.length === 1) {
      return [
        [sketchPoints[0].x / 10, sketchPoints[0].y / 10, 0.04],
        [hoverPoint.x / 10, hoverPoint.y / 10, 0.04],
      ];
    }
    if (sketchPoints.length === 2) {
      const pts = create3PointArcPoints(sketchPoints[0], sketchPoints[1], hoverPoint, 24);
      return pts.map((p) => [p.x / 10, p.y / 10, 0.04] as [number, number, number]);
    }
    return [];
  }, [sketchShapeMode, sketchClosed, sketchPoints, hoverPoint]);

  const ellipsePreview3D = useMemo<[number, number, number][]>(() => {
    if (sketchShapeMode !== 'ellipse' || sketchClosed || sketchPoints.length !== 1 || !hoverPoint) return [];
    const center = sketchPoints[0];
    const rx = Math.max(0.2, Math.abs(hoverPoint.x - center.x) / 10);
    const ry = Math.max(0.2, Math.abs(hoverPoint.y - center.y) / 10);
    const pts: [number, number, number][] = [];
    const segs = 36;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push([center.x / 10 + Math.cos(a) * rx, center.y / 10 + Math.sin(a) * ry, 0.04]);
    }
    return pts;
  }, [sketchShapeMode, sketchClosed, sketchPoints, hoverPoint]);

  const rectPreview3D = useMemo<[number, number, number][]>(() => {
    if (sketchShapeMode !== 'rect' || sketchClosed) return [];
    if (sketchPoints.length === 1 && hoverPoint) {
      const p1 = sketchPoints[0];
      const p2 = hoverPoint;
      return [
        [p1.x / 10, p1.y / 10, 0.04],
        [p2.x / 10, p1.y / 10, 0.04],
        [p2.x / 10, p2.y / 10, 0.04],
        [p1.x / 10, p2.y / 10, 0.04],
        [p1.x / 10, p1.y / 10, 0.04],
      ];
    }
    return [];
  }, [sketchShapeMode, sketchPoints, hoverPoint, sketchClosed]);

  const liveLine3D: [number, number, number][] = (lastPoint && activeLivePoint && !sketchClosed && sketchShapeMode === 'line')
    ? [[lastPoint.x / 10, lastPoint.y / 10, 0.04], [activeLivePoint.x / 10, activeLivePoint.y / 10, 0.04]]
    : [];

  const handlePointerMove = (e: any) => {
    e.stopPropagation();
    if (!e.point || !interactionPlaneRef.current) return;
    const local = interactionPlaneRef.current.worldToLocal(e.point.clone());
    const snap = gridSnap || 5;
    const curX = local.x * 10;
    const curY = local.y * 10;

    // Direct Visual Manipulator Dragging Updates
    if (activeDrag) {
      const { handleType, startPointer, initialEntity } = activeDrag;
      const dx = curX - startPointer.x;
      const dy = curY - startPointer.y;

      const initCx = initialEntity.center?.x ?? 0;
      const initCy = initialEntity.center?.y ?? 0;
      const initW = initialEntity.width ?? 40;
      const initH = initialEntity.height ?? 20;

      if (handleType === 'center') {
        const newCx = Math.round((initCx + dx) / snap) * snap;
        const newCy = Math.round((initCy + dy) / snap) * snap;
        updateSketchEntity(initialEntity.id, { cx: newCx, cy: newCy });
      } else if (handleType === 'corner-tr' || handleType === 'corner-br' || handleType === 'corner-tl' || handleType === 'corner-bl') {
        const signX = (handleType === 'corner-tr' || handleType === 'corner-br') ? 1 : -1;
        const signY = (handleType === 'corner-tr' || handleType === 'corner-tl') ? 1 : -1;
        const rawW = Math.max(4, initW + 2 * signX * dx);
        const rawH = Math.max(4, initH + 2 * signY * dy);
        const newW = Math.round(rawW / snap) * snap;
        const newH = Math.round(rawH / snap) * snap;
        updateSketchEntity(initialEntity.id, { width: newW, height: newH });
      } else if (handleType === 'edge-right' || handleType === 'edge-left') {
        const signX = handleType === 'edge-right' ? 1 : -1;
        const rawW = Math.max(4, initW + 2 * signX * dx);
        const newW = Math.round(rawW / snap) * snap;
        updateSketchEntity(initialEntity.id, { width: newW });
      } else if (handleType === 'edge-top' || handleType === 'edge-bottom') {
        const signY = handleType === 'edge-top' ? 1 : -1;
        const rawH = Math.max(4, initH + 2 * signY * dy);
        const newH = Math.round(rawH / snap) * snap;
        updateSketchEntity(initialEntity.id, { height: newH });
      } else if (handleType === 'rotate') {
        const rad = Math.atan2(curY - initCy, curX - initCx);
        let deg = (rad * 180) / Math.PI - 90;
        deg = ((deg % 360) + 360) % 360;
        const snapDeg = 5;
        const snappedDeg = Math.round(deg / snapDeg) * snapDeg;
        updateSketchEntity(initialEntity.id, { angleDeg: snappedDeg });
      } else if (handleType === 'circle-radius') {
        const rawR = Math.hypot(curX - initCx, curY - initCy);
        const newR = Math.max(2, Math.round(rawR / snap) * snap);
        updateSketchEntity(initialEntity.id, { radius: newR });
      } else if (handleType.startsWith('vertex-')) {
        const vIdx = parseInt(handleType.split('-')[1], 10);
        if (initialEntity.points && initialEntity.points[vIdx]) {
          const newPts = [...initialEntity.points];
          newPts[vIdx] = {
            x: Math.round(curX / snap) * snap,
            y: Math.round(curY / snap) * snap,
          };
          updateSketchEntity(initialEntity.id, { points: newPts });
        }
      }
      return;
    }

    const rawX = Math.round(curX / snap) * snap;
    const rawY = Math.round(curY / snap) * snap;
    setHoverPoint({ x: rawX, y: rawY });
  };

  const handlePointerLeave = () => {
    setHoverPoint(null);
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();

    // 1. Right Click or Context Menu action -> Immediately detach / finish current segment
    if (e.button === 2 || e.nativeEvent?.button === 2) {
      endCurrentLineSegment();
      return;
    }

    if (isClosingSnap) {
      closeSketch();
      return;
    }
    const snap = gridSnap || 5;
    let targetPt = activeLivePoint;
    if (!targetPt && e.point && interactionPlaneRef.current) {
      const local = interactionPlaneRef.current.worldToLocal(e.point.clone());
      targetPt = {
        x: Math.round((local.x * 10) / snap) * snap,
        y: Math.round((local.y * 10) / snap) * snap,
      };
    }
    if (!targetPt) return;

    if (sketchShapeMode === 'trim') {
      trimSketchEntityAt(targetPt);
      return;
    }

    if (sketchShapeMode === 'circle') {
      addCircleSketch(targetPt, sketchCircleRadius || 25);
      useDesignStore.setState({ sketchPoints: [], sketchClosed: false });
      return;
    }

    if (sketchShapeMode === 'circle_2p') {
      if (sketchPoints.length === 0) {
        addSketchPoint(targetPt);
      } else {
        const p1 = sketchPoints[0];
        add2PointCircleEntity(p1, targetPt);
        useDesignStore.setState({ sketchPoints: [], sketchClosed: false });
      }
      return;
    }

    if (sketchShapeMode === 'arc_semi') {
      if (sketchPoints.length === 0) {
        addSketchPoint(targetPt);
      } else {
        const p1 = sketchPoints[0];
        addSemiCircleEntity(p1, targetPt);
        useDesignStore.setState({ sketchPoints: [], sketchClosed: false });
      }
      return;
    }

    if (sketchShapeMode === 'arc_3p') {
      if (sketchPoints.length < 2) {
        addSketchPoint(targetPt);
      } else {
        const p1 = sketchPoints[0];
        const p2 = sketchPoints[1];
        add3PointArcEntity(p1, p2, targetPt);
        useDesignStore.setState({ sketchPoints: [], sketchClosed: false });
      }
      return;
    }

    if (sketchShapeMode === 'ellipse') {
      if (sketchPoints.length === 0) {
        addSketchPoint(targetPt);
      } else {
        const center = sketchPoints[0];
        const rx = Math.max(2, Math.abs(targetPt.x - center.x));
        const ry = Math.max(2, Math.abs(targetPt.y - center.y));
        addEllipseEntity(center, rx, ry);
        useDesignStore.setState({ sketchPoints: [], sketchClosed: false });
      }
      return;
    }

    if (sketchShapeMode === 'rect') {
      if (sketchPoints.length === 0) {
        addSketchPoint(targetPt);
      } else {
        const p1 = sketchPoints[0];
        const w = Math.max(2, Math.abs(targetPt.x - p1.x));
        const h = Math.max(2, Math.abs(targetPt.y - p1.y));
        const cx = (p1.x + targetPt.x) / 2;
        const cy = (p1.y + targetPt.y) / 2;
        addRectSketch({ x: cx, y: cy }, w, h);
        useDesignStore.setState({ sketchPoints: [], sketchClosed: false });
      }
      return;
    }

    if (sketchShapeMode === 'polygon') {
      addPolygonSketch(targetPt, sketchCircleRadius || 30, 6);
      useDesignStore.setState({ sketchPoints: [], sketchClosed: false });
      return;
    }

    // Line mode: clicking near the last point (< 3mm) finishes current line chain
    if (sketchShapeMode === 'line' && sketchPoints.length >= 1) {
      const lastPt = sketchPoints[sketchPoints.length - 1];
      const dist = Math.hypot(targetPt.x - lastPt.x, targetPt.y - lastPt.y);
      if (dist < 3) {
        endCurrentLineSegment();
        return;
      }
    }

    addSketchPoint(targetPt);
  };

  if (!isSketchMode) return null;

  return (
    <group position={sketchWorld.position} quaternion={sketchWorld.quaternion}>
      {/* Active Part Face Boundary & Origin Visual Feedback */}
      {isSketchOnPart && !sketchWorld.isGround && (
        <group position={[0, 0, 0.002]}>
          {/* Dashed Face Perimeter Outline */}
          <Line
            points={[
              [-sketchWorld.planeW / 2, -sketchWorld.planeH / 2, 0],
              [sketchWorld.planeW / 2, -sketchWorld.planeH / 2, 0],
              [sketchWorld.planeW / 2, sketchWorld.planeH / 2, 0],
              [-sketchWorld.planeW / 2, sketchWorld.planeH / 2, 0],
              [-sketchWorld.planeW / 2, -sketchWorld.planeH / 2, 0],
            ]}
            color="#00e5ff"
            lineWidth={1.5}
            dashed
            dashSize={0.4}
            gapSize={0.25}
          />
          {/* Subtle Face Translucent Tint */}
          <mesh position={[0, 0, -0.001]}>
            <planeGeometry args={[sketchWorld.planeW, sketchWorld.planeH]} />
            <meshBasicMaterial color="#00e5ff" transparent opacity={0.03} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          {/* Face Origin Crosshair / Indicator (X: Tangent U in Red, Y: Bitangent V in Green) */}
          <Line
            points={[[0, 0, 0.003], [Math.min(1.5, sketchWorld.planeW * 0.25), 0, 0.003]]}
            color="#ef4444"
            lineWidth={2}
          />
          <Line
            points={[[0, 0, 0.003], [0, Math.min(1.5, sketchWorld.planeH * 0.25), 0.003]]}
            color="#22c55e"
            lineWidth={2}
          />
          {/* Center Origin Dot */}
          <mesh position={[0, 0, 0.005]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        </group>
      )}
        {/* Expansive Clickable Interaction Plane for 2D Sketching */}
        <mesh
          ref={interactionPlaneRef}
          position={[0, 0, 0]}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onPointerDown={handlePointerDown}
          onContextMenu={(e: any) => {
            e.stopPropagation();
            e.preventDefault?.();
            endCurrentLineSegment();
          }}
          onDoubleClick={(e: any) => {
            e.stopPropagation();
            endCurrentLineSegment();
          }}
        >
          <planeGeometry args={[10000, 10000]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>

        {/* Live Circle Preview before placement */}
        {circlePreview3D.length > 1 && (
          <group>
            <Line points={circlePreview3D} color="#38bdf8" lineWidth={3} dashed dashSize={0.4} gapSize={0.2} />
            {hoverPoint && (
              <>
                <Line
                  points={[
                    [hoverPoint.x / 10, hoverPoint.y / 10, 0.04],
                    [hoverPoint.x / 10 + (sketchCircleRadius || 25) / 10, hoverPoint.y / 10, 0.04],
                  ]}
                  color="#38bdf8"
                  lineWidth={1.5}
                />
                <Html position={[hoverPoint.x / 10, hoverPoint.y / 10 + (sketchCircleRadius || 25) / 10 + 0.4, 0.05]} center>
                  <div className="px-2 py-0.5 rounded bg-cyan-950/95 border border-cyan-400 text-cyan-300 font-mono text-[9px] font-bold shadow-lg select-none whitespace-nowrap pointer-events-none">
                    ⭕ R={sketchCircleRadius || 25} mm (Ø{(sketchCircleRadius || 25) * 2} mm)
                  </div>
                </Html>
              </>
            )}
          </group>
        )}

        {/* Live 2-Point Diameter Circle Preview */}
        {circle2pPreview3D.length > 1 && (
          <group>
            <Line points={circle2pPreview3D} color="#38bdf8" lineWidth={3} dashed dashSize={0.4} gapSize={0.2} />
            {hoverPoint && sketchPoints[0] && (
              <Html position={[(sketchPoints[0].x + hoverPoint.x) / 20, (sketchPoints[0].y + hoverPoint.y) / 20, 0.05]} center>
                <div className="px-2 py-0.5 rounded bg-cyan-950/95 border border-cyan-400 text-cyan-300 font-mono text-[9px] font-bold shadow-lg select-none whitespace-nowrap pointer-events-none">
                  ⚪ 2P Daire Ø{Math.round(Math.hypot(hoverPoint.x - sketchPoints[0].x, hoverPoint.y - sketchPoints[0].y))} mm
                </div>
              </Html>
            )}
          </group>
        )}

        {/* Live Semi-Circle Preview */}
        {arcSemiPreview3D.length > 1 && (
          <group>
            <Line points={arcSemiPreview3D} color="#38bdf8" lineWidth={3} dashed dashSize={0.4} gapSize={0.2} />
            {hoverPoint && sketchPoints[0] && (
              <Html position={[(sketchPoints[0].x + hoverPoint.x) / 20, (sketchPoints[0].y + hoverPoint.y) / 20, 0.05]} center>
                <div className="px-2 py-0.5 rounded bg-cyan-950/95 border border-cyan-400 text-cyan-300 font-mono text-[9px] font-bold shadow-lg select-none whitespace-nowrap pointer-events-none">
                  🌗 Yarım Daire R{Math.round(Math.hypot(hoverPoint.x - sketchPoints[0].x, hoverPoint.y - sketchPoints[0].y) / 2)} mm
                </div>
              </Html>
            )}
          </group>
        )}

        {/* Live 3-Point Arc Preview */}
        {arc3pPreview3D.length > 1 && (
          <group>
            <Line points={arc3pPreview3D} color="#38bdf8" lineWidth={3} dashed dashSize={0.4} gapSize={0.2} />
            {hoverPoint && (
              <Html position={[hoverPoint.x / 10, hoverPoint.y / 10 + 0.3, 0.05]} center>
                <div className="px-2 py-0.5 rounded bg-cyan-950/95 border border-cyan-400 text-cyan-300 font-mono text-[9px] font-bold shadow-lg select-none whitespace-nowrap pointer-events-none">
                  🏹 3P Yay {sketchPoints.length === 1 ? '(2. Noktayı Seç)' : '(3. Bitiş Noktasını Seç)'}
                </div>
              </Html>
            )}
          </group>
        )}

        {/* Live Ellipse Preview */}
        {ellipsePreview3D.length > 1 && hoverPoint && sketchPoints[0] && (
          <group>
            <Line points={ellipsePreview3D} color="#38bdf8" lineWidth={3} dashed dashSize={0.4} gapSize={0.2} />
            <Html position={[hoverPoint.x / 10, hoverPoint.y / 10 + 0.3, 0.05]} center>
              <div className="px-2 py-0.5 rounded bg-cyan-950/95 border border-cyan-400 text-cyan-300 font-mono text-[9px] font-bold shadow-lg select-none whitespace-nowrap pointer-events-none">
                🥚 Elips {Math.round(Math.abs(hoverPoint.x - sketchPoints[0].x))} × {Math.round(Math.abs(hoverPoint.y - sketchPoints[0].y))} mm
              </div>
            </Html>
          </group>
        )}

        {/* Live Rectangle Preview before 2nd click */}
        {rectPreview3D.length > 1 && hoverPoint && sketchPoints.length === 1 && (
          <group>
            <Line points={rectPreview3D} color="#38bdf8" lineWidth={3} dashed dashSize={0.4} gapSize={0.2} />
            <Html position={[(sketchPoints[0].x + hoverPoint.x) / 20, (sketchPoints[0].y + hoverPoint.y) / 20, 0.05]} center>
              <div className="px-2 py-0.5 rounded bg-cyan-950/95 border border-cyan-400 text-cyan-300 font-mono text-[9px] font-bold shadow-lg select-none whitespace-nowrap pointer-events-none">
                ⬛ {Math.round(Math.abs(hoverPoint.x - sketchPoints[0].x))} × {Math.round(Math.abs(hoverPoint.y - sketchPoints[0].y))} mm
              </div>
            </Html>
          </group>
        )}

        {/* ─── RENDER SAVED SKETCH ENTITIES (MULTI-ENTITY, DYNAMIC BLOCKS, CONSTRUCTION LINES) ─── */}
        {sketchEntities.map((entity) => {
          const isSelected = entity.id === selectedSketchEntityId;
          const isConstruction = entity.isConstruction;
          const strokeColor = isSelected
            ? '#fbbf24'
            : isConstruction
            ? '#94a3b8'
            : entity.isClosed
            ? '#34d399'
            : isCutOnPart
            ? '#f43f5e'
            : '#00e5ff';
          const lineW = isSelected ? 5.5 : isConstruction ? 2 : 3.5;

          const handleEntityClick = (e: any) => {
            e.stopPropagation();
            if (sketchShapeMode === 'trim') {
              const snap = gridSnap || 5;
              if (e.point && interactionPlaneRef.current) {
                const local = interactionPlaneRef.current.worldToLocal(e.point.clone());
                const targetPt = {
                  x: Math.round((local.x * 10) / snap) * snap,
                  y: Math.round((local.y * 10) / snap) * snap,
                };
                trimSketchEntityAt(targetPt);
              }
            } else {
              selectSketchEntity(entity.id);
            }
          };

          if (entity.type === 'circle' && entity.center && entity.radius) {
            const segs = 36;
            const pts: [number, number, number][] = [];
            const r = entity.radius / 10;
            for (let i = 0; i <= segs; i++) {
              const a = (i / segs) * Math.PI * 2;
              pts.push([entity.center.x / 10 + Math.cos(a) * r, entity.center.y / 10 + Math.sin(a) * r, 0.04]);
            }
            return (
              <group key={entity.id} onPointerDown={handleEntityClick}>
                <Line
                  points={pts}
                  color={strokeColor}
                  lineWidth={lineW}
                  dashed={isConstruction}
                  dashSize={0.4}
                  gapSize={0.2}
                />
                {/* Center Mark */}
                <mesh position={[entity.center.x / 10, entity.center.y / 10, 0.05]}>
                  <sphereGeometry args={[isSelected ? 0.045 : 0.035, 12, 12]} />
                  <meshBasicMaterial color={isSelected ? '#fbbf24' : isConstruction ? '#94a3b8' : '#fbbf24'} />
                </mesh>
                {showSketchDimensions && (
                  <Html position={[entity.center.x / 10, entity.center.y / 10 + r + 0.3, 0.1]} center style={{ pointerEvents: 'none' }}>
                    <div className="px-1.5 py-0.2 rounded bg-black/85 text-[8.5px] font-mono font-bold text-cyan-300 border border-cyan-500/30 whitespace-nowrap">
                      {entity.name ? `${entity.name}: ` : ''}Ø{Math.round(entity.radius * 2)}mm{isConstruction ? ' (Ref)' : ''}
                    </div>
                  </Html>
                )}
              </group>
            );
          }

          if (entity.points && entity.points.length > 1) {
            const pts: [number, number, number][] = entity.points.map((p) => [p.x / 10, p.y / 10, 0.04]);
            if (entity.isClosed && pts.length > 2) {
              pts.push(pts[0]);
            }
            const midPt = entity.points[Math.floor(entity.points.length / 2)];
            return (
              <group key={entity.id} onPointerDown={handleEntityClick}>
                <Line
                  points={pts}
                  color={strokeColor}
                  lineWidth={lineW}
                  dashed={isConstruction}
                  dashSize={0.4}
                  gapSize={0.25}
                />
                {/* Selected Entity Endpoint Handles */}
                {isSelected && entity.points.map((p, idx) => (
                  <mesh key={idx} position={[p.x / 10, p.y / 10, 0.06]}>
                    <sphereGeometry args={[0.04, 12, 12]} />
                    <meshBasicMaterial color="#fbbf24" />
                  </mesh>
                ))}
                {showSketchDimensions && entity.name && midPt && (
                  <Html position={[midPt.x / 10, midPt.y / 10, 0.1]} center style={{ pointerEvents: 'none' }}>
                    <div className="px-1.5 py-0.2 rounded bg-black/85 text-[8px] font-mono font-bold text-cyan-200 border border-cyan-500/30 whitespace-nowrap">
                      {entity.name}{isConstruction ? ' (Ref)' : ''}
                    </div>
                  </Html>
                )}
              </group>
            );
          }

          return null;
        })}

        {/* Visual Interactive Manipulator Gizmo for Selected Sketch Entity */}
        {(() => {
          const selEntity = sketchEntities.find((e) => e.id === selectedSketchEntityId);
          if (!selEntity) return null;
          return (
            <SketchEntityManipulator
              entity={selEntity}
              activeDrag={activeDrag}
              onDragStart={startDragHandle}
              showSketchDimensions={showSketchDimensions}
            />
          );
        })()}

        {/* Drawn Profile Lines (Active In-Progress Segment) */}
        {points3D.length > 1 && (
          <Line
            points={points3D}
            color={isConstructionMode ? '#94a3b8' : sketchClosed ? '#34d399' : isCutOnPart ? '#f43f5e' : '#00e5ff'}
            lineWidth={isConstructionMode ? 2.5 : 4}
            dashed={isConstructionMode}
            dashSize={0.4}
            gapSize={0.2}
          />
        )}

        {/* Live Preview Line to Cursor */}
        {liveLine3D.length > 1 && (
          <Line
            points={liveLine3D}
            color={isClosingSnap ? '#34d399' : activeConstraintBadge ? '#34d399' : isCutOnPart ? '#f43f5e' : '#38bdf8'}
            lineWidth={2.5}
            dashed
            dashSize={0.5}
            gapSize={0.25}
          />
        )}

        {/* Loop-closing Magnetic Target Indicator on Point 0 */}
        {isClosingSnap && sketchPoints.length >= 3 && (
          <group position={[sketchPoints[0].x / 10, sketchPoints[0].y / 10, 0.05]}>
            <mesh>
              <ringGeometry args={[0.12, 0.2, 24]} />
              <meshBasicMaterial color="#34d399" side={THREE.DoubleSide} />
            </mesh>
          </group>
        )}

        {/* Live Cursor Tooltip Badge */}
        {activeLivePoint && lastPoint && !sketchClosed && liveLength > 0 && (
          <Html 
            position={[activeLivePoint.x / 10 + 0.6, activeLivePoint.y / 10 + 0.6, 0.2]} 
            center
            style={{ pointerEvents: 'none' }}
          >
            <div className="flex flex-col items-center gap-0.5 rounded-xl bg-black/90 px-2 py-1 font-mono text-[9px] font-bold text-white border border-cyan-400/50 shadow-2xl pointer-events-none select-none">
              <div className="flex items-center gap-2 text-cyan-300">
                <span>📏 {liveLength} mm</span>
                <span>∠ {liveAngle}°</span>
              </div>
              {activeConstraintBadge && (
                <span className={`rounded px-1 py-0.2 text-[8px] font-black border ${
                  isClosingSnap 
                    ? 'bg-emerald-500/40 text-emerald-200 border-emerald-400 animate-pulse' 
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                }`}>
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
          const showSegment = !isEnd || sketchClosed;

          const dist = nextPt ? Math.round(Math.hypot(nextPt.x - pt.x, nextPt.y - pt.y)) : 0;
          const midX = nextPt ? (pt.x + nextPt.x) / 20 : pt.x / 10;
          const midY = nextPt ? (pt.y + nextPt.y) / 20 : pt.y / 10;

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
              {/* Vertex Point Handle - Minimal CAD Dot */}
              <mesh position={[pt.x / 10, pt.y / 10, 0.05]}>
                <sphereGeometry args={[idx === 0 ? 0.045 : 0.035, 12, 12]} />
                <meshBasicMaterial color={idx === 0 ? '#fbbf24' : isCutOnPart ? '#f43f5e' : '#00e5ff'} />
              </mesh>

              {/* Corner Angle Badge at Vertex (filtered for readability to avoid clutter) */}
              {showSketchDimensions && showSegment && idx > 0 && vertexCornerAngle >= 20 && dist >= 14 && (
                <Html position={[pt.x / 10, pt.y / 10, 0.2]} center style={{ pointerEvents: 'none' }}>
                  <span className={`px-1 py-0.2 rounded font-mono text-[8px] font-black border pointer-events-none select-none ${
                    isPerp 
                      ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/60 shadow-md ' 
                      : 'bg-black/70 text-slate-300 border-white/10'
                  }`}>
                    {isPerp ? '⊥ 90°' : `∠ ${Math.round(vertexCornerAngle)}°`}
                  </span>
                </Html>
              )}

              {/* Segment Length & Direction Badge (filtered for readability to avoid clutter) */}
              {showSketchDimensions && showSegment && dist >= 14 && (
                <Html position={[midX, midY, 0.15]} center style={{ pointerEvents: 'none' }}>
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

// ─── SOLIDWORKS INSTANT3D INTERACTIVE DIMENSION CALLOUTS ───
interface InstantDimItem {
  key: string;
  label: string;
  icon: string;
  value: number;
  offset: [number, number, number];
}

function Instant3DDimensions({ part }: { part: DesignPart }) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempVal, setTempVal] = useState<string>('');
  const updatePartParams = useDesignStore((s) => s.updatePartParams);
  const applyMates = useDesignStore((s) => s.applyMates);

  const dims = useMemo<InstantDimItem[]>(() => {
    const p = part.params || {};
    const sx = Math.abs(part.scale?.x ?? 1);
    const sy = Math.abs(part.scale?.y ?? 1);
    const sz = Math.abs(part.scale?.z ?? 1);
    const items: InstantDimItem[] = [];

    if (part.kind === 'box' || part.kind === 'plate' || part.kind === 'slot-plate' || part.kind === 'trapezoid' || part.kind === 'wedge') {
      const curW = Math.round((p.width || 40) * sx * 10) / 10;
      const curH = Math.round((p.height || 40) * sy * 10) / 10;
      const curD = Math.round((p.depth || 20) * sz * 10) / 10;
      const w = curW / 10;
      const h = curH / 10;
      const d = curD / 10;
      items.push({ key: 'width', label: 'W', icon: '↔', value: curW, offset: [0, h / 2 + 0.5, d / 2 + 0.4] });
      items.push({ key: 'height', label: 'H', icon: '↕', value: curH, offset: [w / 2 + 0.6, 0, d / 2 + 0.4] });
      items.push({ key: 'depth', label: 'D', icon: '⤢', value: curD, offset: [w / 2 + 0.4, h / 2 + 0.5, 0] });
    } else if (part.kind === 'cylinder' || part.kind === 'tube' || part.kind === 'cone') {
      const radScale = (sx !== 1 && sz === 1) ? sx : (sz !== 1 && sx === 1) ? sz : Math.max(sx, sz);
      const curDia = Math.round((p.diameter || 30) * radScale * 10) / 10;
      const curLen = Math.round((p.length || 40) * sy * 10) / 10;
      const dia = curDia / 10;
      const len = curLen / 10;
      items.push({ key: 'diameter', label: 'Ø', icon: 'Ø', value: curDia, offset: [0, len / 2 + 0.5, 0] });
      items.push({ key: 'length', label: 'L', icon: '↕', value: curLen, offset: [dia / 2 + 0.6, 0, 0] });
      if (part.kind === 'tube' && p.wall !== undefined) {
        const curWall = Math.round(p.wall * radScale * 10) / 10;
        items.push({ key: 'wall', label: 'Wall', icon: '⫽', value: curWall, offset: [0, len / 2 + 1.1, 0] });
      }
    } else if (part.kind === 'sphere') {
      const s = Math.max(sx, sy, sz);
      const curDia = Math.round((p.diameter || 30) * s * 10) / 10;
      items.push({ key: 'diameter', label: 'Ø', icon: 'Ø', value: curDia, offset: [0, curDia / 20 + 0.5, 0] });
    } else if (part.kind === 'hex-bolt') {
      const radScale = Math.max(sx, sz);
      const curDia = Math.round((p.diameter || 10) * radScale * 10) / 10;
      const curLen = Math.round((p.length || 40) * sy * 10) / 10;
      const curAf = Math.round((p.headSize || 17) * radScale * 10) / 10;
      const dia = curDia / 10;
      const len = curLen / 10;
      items.push({ key: 'diameter', label: 'M', icon: 'Ø', value: curDia, offset: [dia / 2 + 0.5, -len / 4, 0] });
      items.push({ key: 'length', label: 'L', icon: '↕', value: curLen, offset: [-dia / 2 - 0.6, 0, 0] });
      items.push({ key: 'headSize', label: 'AF', icon: '⬡', value: curAf, offset: [0, len / 2 + 0.7, 0] });
    } else if (part.kind === 'hex-nut') {
      const radScale = Math.max(sx, sz);
      const innerD = Math.round((p.innerDiameter || p.diameter || 10) * radScale * 10) / 10;
      const curH = Math.round((p.depth || 8) * sy * 10) / 10;
      const curAf = Math.round((p.headSize || 17) * radScale * 10) / 10;
      const h = curH / 10;
      const af = curAf / 10;
      items.push({ key: 'innerDiameter', label: 'M', icon: 'Ø', value: innerD, offset: [0, h / 2 + 0.6, 0] });
      items.push({ key: 'depth', label: 'H', icon: '↕', value: curH, offset: [af / 2 + 0.6, 0, 0] });
      items.push({ key: 'headSize', label: 'AF', icon: '⬡', value: curAf, offset: [0, -h / 2 - 0.6, 0] });
    } else if (part.kind === 'pulley' || part.kind === 'washer' || part.kind === 'bearing-race') {
      const radScale = Math.max(sx, sz);
      const curDia = Math.round((p.diameter || 40) * radScale * 10) / 10;
      const curId = Math.round((p.innerDiameter || 12) * radScale * 10) / 10;
      const curH = Math.round((p.depth || 15) * sy * 10) / 10;
      const dia = curDia / 10;
      const h = curH / 10;
      items.push({ key: 'diameter', label: 'OD', icon: 'Ø', value: curDia, offset: [0, h / 2 + 0.6, 0] });
      items.push({ key: 'innerDiameter', label: 'ID', icon: 'Ø', value: curId, offset: [0, h / 2 + 1.1, 0] });
      items.push({ key: 'depth', label: 'W', icon: '↕', value: curH, offset: [dia / 2 + 0.6, 0, 0] });
    } else if (part.kind === 'L-bracket' || part.kind === 'U-channel' || part.kind === 'I-beam' || part.kind === 'T-beam') {
      const curFw = Math.round((p.flangeW || 50) * sx * 10) / 10;
      const curWh = Math.round((p.webH || 50) * sy * 10) / 10;
      const curLen = Math.round((p.length || 60) * sz * 10) / 10;
      const fw = curFw / 10;
      const wh = curWh / 10;
      const len = curLen / 10;
      items.push({ key: 'flangeW', label: 'W', icon: '↔', value: curFw, offset: [0, -wh / 2 - 0.5, len / 2 + 0.4] });
      items.push({ key: 'webH', label: 'H', icon: '↕', value: curWh, offset: [fw / 2 + 0.5, 0, len / 2 + 0.4] });
      items.push({ key: 'length', label: 'L', icon: '⤢', value: curLen, offset: [fw / 2 + 0.4, -wh / 2 - 0.5, 0] });
    } else if (part.kind === 't-slot') {
      const curW = Math.round((p.width || 40) * sx * 10) / 10;
      const curLen = Math.round((p.length || p.extrudeDepth || 200) * sy * 10) / 10;
      const s = curW / 10;
      const len = curLen / 10;
      items.push({ key: 'length', label: 'L', icon: '↕', value: curLen, offset: [s / 2 + 0.8, 0, 0] });
      items.push({ key: 'width', label: 'W', icon: '↔', value: curW, offset: [0, -len / 2 - 0.6, 0] });
    } else if (p.extrudeDepth !== undefined) {
      const curD = Math.round(p.extrudeDepth * (sz !== 1 ? sz : sy) * 10) / 10;
      items.push({ key: 'extrudeDepth', label: 'D', icon: '↕', value: curD, offset: [2.5, 0, 0] });
    }

    return items;
  }, [part.kind, part.params, part.scale]);

  const handleCommit = (key: string, valStr: string) => {
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      updatePartParams(part.id, { [key]: num });
      const store = useDesignStore.getState();
      const currentPart = store.parts.find((p) => p.id === part.id);
      if (currentPart) {
        const p = { ...(currentPart.params || {}), [key]: num };
        if (p.width && p.height && p.depth) {
          const updatedName = currentPart.name.replace(
            /\b\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?\b/,
            `${p.width}x${p.height}x${p.depth}`
          );
          if (updatedName !== currentPart.name) {
            store.updatePart(part.id, { name: updatedName });
          }
        }
      }
      applyMates();
    }
    setEditingKey(null);
  };

  if (dims.length === 0) return null;

  return (
    <group>
      {dims.map((dim) => (
        <Html key={dim.key} position={dim.offset} center distanceFactor={18} zIndexRange={[50, 0]}>
          {editingKey === dim.key ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCommit(dim.key, tempVal);
              }}
              className="flex items-center gap-1 bg-[var(--bg-1)] border border-cyan-400 p-0.5 rounded shadow-2xl font-mono text-[10px]"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-cyan-400 font-bold px-1">{dim.icon} {dim.label}:</span>
              <input
                autoFocus
                type="number"
                step="any"
                value={tempVal}
                onChange={(e) => setTempVal(e.target.value)}
                onBlur={() => handleCommit(dim.key, tempVal)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setEditingKey(null);
                }}
                className="w-14 bg-slate-900 border border-slate-700 px-1 py-0.5 text-white font-bold rounded focus:outline-none focus:border-cyan-400 text-center"
              />
              <span className="text-slate-400 text-[8.5px]">mm</span>
              <button type="submit" className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[8px] font-bold cursor-pointer">
                ✔
              </button>
            </form>
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setEditingKey(dim.key);
                setTempVal(String(dim.value));
              }}
              className="group cursor-pointer select-none flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--bg-1)]/95 hover:bg-cyan-950 border border-cyan-500/60 hover:border-cyan-400 text-cyan-300 shadow-lg font-mono text-[9px] font-bold transition-all"
              title="Ölçüyü değiştirmek için tıkla veya -/+ kullan (SolidWorks Instant3D)"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCommit(dim.key, String(Math.max(1, Math.round((dim.value - 5) * 10) / 10)));
                }}
                className="px-1 rounded bg-white/5 hover:bg-rose-500/30 text-slate-300 hover:text-rose-200 font-black cursor-pointer"
                title="-5 mm"
              >
                -
              </button>
              <span className="text-cyan-400 group-hover:text-white transition">{dim.icon}</span>
              <span className="text-slate-400 text-[8px]">{dim.label}:</span>
              <span className="text-white group-hover:text-cyan-200 font-black">{dim.value}</span>
              <span className="text-slate-400 text-[8px]">mm</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCommit(dim.key, String(Math.round((dim.value + 5) * 10) / 10));
                }}
                className="px-1 rounded bg-white/5 hover:bg-emerald-500/30 text-slate-300 hover:text-emerald-200 font-black cursor-pointer"
                title="+5 mm"
              >
                +
              </button>
            </div>
          )}
        </Html>
      ))}
    </group>
  );
}

// ─── THREE.JS TRANSFORM GIZMO WITH DYNAMIC MATE RESOULVER ───
function GizmoTransformControls({ selectedPart }: { selectedPart: DesignPart }) {
  const tool = useDesignStore((s) => s.tool);
  const updateSelectedTransform = useDesignStore((s) => s.updateSelectedTransform);
  const bakeScaleToParams = useDesignStore((s) => s.bakeScaleToParams);
  const applyMates = useDesignStore((s) => s.applyMates);
  const transformRef = useRef<any>(null);

  useEffect(() => {
    const ctrl = transformRef.current;
    if (!ctrl) return;
    const handleMouseUp = () => {
      if (useDesignStore.getState().tool === 'scale') {
        bakeScaleToParams(selectedPart.id);
        if (ctrl.object) {
          ctrl.object.scale.set(1, 1, 1);
        }
      } else {
        applyMates();
      }
    };
    ctrl.addEventListener('mouseUp', handleMouseUp);
    return () => {
      ctrl.removeEventListener('mouseUp', handleMouseUp);
    };
  }, [selectedPart.id, applyMates, bakeScaleToParams]);

  return (
    <TransformControls
      ref={transformRef}
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
  );
}

export function DesignViewport() {
  const { language } = useI18nStore();
  const parts = useDesignStore((s) => s.parts);
  const selectedId = useDesignStore((s) => s.selectedId);
  const editingPartId = useDesignStore((s) => s.editingPartId);
  const subAssemblies = useDesignStore((s) => s.subAssemblies);
  const tool = useDesignStore((s) => s.tool);
  const setTool = useDesignStore((s) => s.setTool);
  const activeMateDraft = useDesignStore((s) => s.activeMateDraft);
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

  // ─── 2D SKETCH & 3D EXTRUDE / CUT PROPERTY MANAGER HOOKS ───
  const activeFace = useDesignStore((s) => s.activeFace);
  const sketchShapeMode = useDesignStore((s) => s.sketchShapeMode);
  const setSketchShapeMode = useDesignStore((s) => s.setSketchShapeMode);
  const sketchCircleRadius = useDesignStore((s) => s.sketchCircleRadius);
  const setSketchCircleRadius = useDesignStore((s) => s.setSketchCircleRadius);
  const sketchPoints = useDesignStore((s) => s.sketchPoints);
  const sketchClosed = useDesignStore((s) => s.sketchClosed);
  const clearSketch = useDesignStore((s) => s.clearSketch);
  const undoSketchPoint = useDesignStore((s) => s.undoSketchPoint);
  const commitExtrude = useDesignStore((s) => s.commitExtrude);
  const applySketchFillet = useDesignStore((s) => s.applySketchFillet);
  const isExtrudeDialogOpen = useDesignStore((s) => s.isExtrudeDialogOpen);
  const extrudeDialogConfig = useDesignStore((s) => s.extrudeDialogConfig);
  const openExtrudeDialog = useDesignStore((s) => s.openExtrudeDialog);
  const closeExtrudeDialog = useDesignStore((s) => s.closeExtrudeDialog);
  const setExtrudeDialogConfig = useDesignStore((s) => s.setExtrudeDialogConfig);
  const applyExtrudeOrCut = useDesignStore((s) => s.applyExtrudeOrCut);
  const sketchEntities = useDesignStore((s) => s.sketchEntities);
  const isConstructionMode = useDesignStore((s) => s.isConstructionMode);
  const toggleConstructionMode = useDesignStore((s) => s.toggleConstructionMode);
  const keepSketchAfterExtrude = useDesignStore((s) => s.keepSketchAfterExtrude);
  const setKeepSketchAfterExtrude = useDesignStore((s) => s.setKeepSketchAfterExtrude);
  const showSketchDimensions = useDesignStore((s) => s.showSketchDimensions);
  const setShowSketchDimensions = useDesignStore((s) => s.setShowSketchDimensions);
  const sketchNumericCoords = useDesignStore((s) => s.sketchNumericCoords);
  const setSketchNumericCoords = useDesignStore((s) => s.setSketchNumericCoords);
  const addCoordinateSketchPoint = useDesignStore((s) => s.addCoordinateSketchPoint);
  const endCurrentLineSegment = useDesignStore((s) => s.endCurrentLineSegment);
  const stampDynamicBlockToSketch = useDesignStore((s) => s.stampDynamicBlockToSketch);
  const selectedSketchEntityId = useDesignStore((s) => s.selectedSketchEntityId);
  const selectSketchEntity = useDesignStore((s) => s.selectSketchEntity);
  const updateSketchEntity = useDesignStore((s) => s.updateSketchEntity);
  const deleteSketchEntity = useDesignStore((s) => s.deleteSketchEntity);
  const trimSketchEntityAt = useDesignStore((s) => s.trimSketchEntityAt);
  const autoTrimOverhangsAction = useDesignStore((s) => s.autoTrimOverhangsAction);

  // Sculpt controls
  const sculptBrush = useDesignStore((s) => s.sculptBrush);
  const setSculptBrush = useDesignStore((s) => s.setSculptBrush);
  const sculptRadius = useDesignStore((s) => s.sculptRadius);
  const setSculptRadius = useDesignStore((s) => s.setSculptRadius);
  const sculptStrength = useDesignStore((s) => s.sculptStrength);
  const setSculptStrength = useDesignStore((s) => s.setSculptStrength);
  const sculptDirection = useDesignStore((s) => s.sculptDirection);
  const setSculptDirection = useDesignStore((s) => s.setSculptDirection);
  const sculptSymmetry = useDesignStore((s) => s.sculptSymmetry);
  const setSculptSymmetry = useDesignStore((s) => s.setSculptSymmetry);
  const subdivideSelectedPartMesh = useDesignStore((s) => s.subdivideSelectedPartMesh);

  const [dynamicBlockDropdownOpen, setDynamicBlockDropdownOpen] = useState(false);
  const [filletRadiusInput, setFilletRadiusInput] = useState<number>(5);

  const [showInstantDims, setShowInstantDims] = useState(true);

  const selectedPart = parts.find((p) => p.id === selectedId) || (editingPartId ? parts.find((p) => p.id === editingPartId) : null);
  const isSketchMode = tool === 'sketch-add' || tool === 'sketch-cut' || tool === 'sketch-loft';
  const isSculptMode = studioMode === 'sculpt';

  // Background, floor grid and ground bounce follow the app theme (or a fixed preset)
  const look = useViewportLook(bg);

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

  const [contextMenu3D, setContextMenu3D] = useState<{
    x: number;
    y: number;
    partId: string | null;
    clickedFeature?: MateFeature | null;
  } | null>(null);

  const [hoveredMateFeature, setHoveredMateFeature] = useState<{
    part: DesignPart;
    feature: MateFeature;
    point: THREE.Vector3;
  } | null>(null);

  const [lastMatedInfo, setLastMatedInfo] = useState<{
    partAName: string;
    partBName: string;
    kind: MateKind;
    mateId: string;
    time: number;
  } | null>(null);

  const mates = useDesignStore((s) => s.mates);
  const selectedMateId = useDesignStore((s) => s.selectedMateId);
  const setSelectedMateId = useDesignStore((s) => s.setSelectedMateId);
  const updateMateKind = useDesignStore((s) => s.updateMateKind);
  const toggleMateFlip = useDesignStore((s) => s.toggleMateFlip);
  const updateMateOffset = useDesignStore((s) => s.updateMateOffset);
  const removeMate = useDesignStore((s) => s.removeMate);

  const handleMateSuccess = useCallback((info: {
    partAName: string;
    partBName: string;
    kind: MateKind;
    mateId: string;
  }) => {
    setLastMatedInfo({ ...info, time: Date.now() });
    setSelectedMateId(info.mateId);
  }, [setSelectedMateId]);

  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const contextMenuPartHandledRef = useRef(false);
  const cameraDispatcherRef = useRef<((action: CameraAction) => void) | null>(null);

  useEffect(() => {
    const handleCameraAction = (e: Event) => {
      const customEvent = e as CustomEvent<CameraAction>;
      if (cameraDispatcherRef.current && customEvent.detail) {
        cameraDispatcherRef.current(customEvent.detail);
      }
    };
    window.addEventListener(CAD_CAMERA_ACTION_EVENT, handleCameraAction);
    return () => {
      window.removeEventListener(CAD_CAMERA_ACTION_EVENT, handleCameraAction);
    };
  }, []);

  // Automatically align camera normal to sketch plane when entering sketch mode
  const prevSketchModeRef = useRef(false);
  useEffect(() => {
    if (isSketchMode && !prevSketchModeRef.current) {
      const state = useDesignStore.getState();
      const targetPart = state.editingPartId
        ? state.parts.find((p) => p.id === state.editingPartId)
        : state.getSelected();
      if (targetPart) {
        triggerCameraView({ type: 'focus-face', partId: targetPart.id, face: state.activeFace || undefined });
      } else {
        triggerCameraView('top');
      }
    } else if (!isSketchMode && prevSketchModeRef.current) {
      triggerCameraView('iso');
    }
    prevSketchModeRef.current = isSketchMode;
  }, [isSketchMode]);

  const handleContainerPointerDown = (e: React.PointerEvent) => {
    if (e.button === 2) {
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleContainerContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (contextMenuPartHandledRef.current) {
      contextMenuPartHandledRef.current = false;
      return;
    }
    if (pointerDownPosRef.current) {
      const dist = Math.hypot(e.clientX - pointerDownPosRef.current.x, e.clientY - pointerDownPosRef.current.y);
      pointerDownPosRef.current = null;
      if (dist > 6) return;
    }
    setContextMenu3D({
      x: e.clientX,
      y: e.clientY,
      partId: null,
      clickedFeature: null,
    });
  };

  const handleContextMenuPart = useCallback((e: any, partId: string, clickedFeature?: MateFeature | null) => {
    contextMenuPartHandledRef.current = true;
    const native = e.nativeEvent || e;
    if (pointerDownPosRef.current && native.clientX !== undefined) {
      const dist = Math.hypot(native.clientX - pointerDownPosRef.current.x, native.clientY - pointerDownPosRef.current.y);
      pointerDownPosRef.current = null;
      if (dist > 6) return;
    }
    select(partId);
    setContextMenu3D({
      x: native.clientX ?? 200,
      y: native.clientY ?? 200,
      partId,
      clickedFeature: clickedFeature || null,
    });
  }, [select]);

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
      onPointerDown={handleContainerPointerDown}
      onContextMenu={handleContainerContextMenu}
    >
      <Canvas
        shadows={parts.length > 250 ? false : { type: THREE.PCFShadowMap }}
        camera={{ position: isSketchMode ? [0, 22, 0.001] : [12, 10, 14], fov: 40, near: 0.1, far: 12000 }}
        gl={{
          powerPreference: 'high-performance',
          localClippingEnabled: true,
          stencil: true,
          precision: 'highp',
          antialias: parts.length > 400 ? false : true,
        }}
        onPointerMissed={() => !isSketchMode && !isSculptMode && select(null)}
        style={{ width: '100%', height: '100%', background: look.background }}
      >
        <ambientLight intensity={lightIntensity * 0.7} />
        <directionalLight position={[30, 45, 25]} intensity={lightIntensity} castShadow={parts.length < 250} shadow-camera-left={-150} shadow-camera-right={150} shadow-camera-top={150} shadow-camera-bottom={-150} shadow-camera-far={3000} />
        <directionalLight position={[-30, -15, -25]} intensity={lightIntensity * 0.4} />
        <hemisphereLight args={['#9bbdff', look.hemiGround, 0.45]} />

        {/* Dynamic Camera Dispatcher for Context Menu Presets */}
        <CameraDispatcher dispatcherRef={cameraDispatcherRef} parts={parts} />

        {/* Expansive Infinite CAD Grid Floor */}
        {showGrid && (
          <Grid
            infiniteGrid
            fadeDistance={240}
            fadeStrength={1.5}
            cellSize={1.0}
            sectionSize={5.0}
            sectionColor={look.gridSection}
            cellColor={look.gridCell}
            sectionThickness={1.0}
            cellThickness={0.5}
            position={[0, -0.01, 0]}
          />
        )}

        {/* 3D Meshes with GPU Instanced Batching (up to 10,000 parts) & Solid Backface Clipping */}
        <InstancedAssemblyRenderer
          parts={parts}
          renderMode={renderMode}
          clippingPlanes={clippingPlanes}
          isSculptMode={isSculptMode}
          renderIndividualMesh={(p, index) => (
            <SolidMesh
              key={p.id}
              part={p}
              renderMode={renderMode}
              clippingPlanes={clippingPlanes}
              isSculptMode={isSculptMode}
              onSculptStroke={incrementSculptVersion}
              partIndex={index}
              totalParts={parts.length}
              onContextMenuPart={handleContextMenuPart}
              onHoverMateFeature={setHoveredMateFeature}
              onMateSuccess={handleMateSuccess}
            />
          )}
        />

        {/* Interactive 2D Sketch Plane */}
        {isSketchMode && <InteractiveSketchPlane />}

        {/* 3D Caliper & Dimension Measuring Layer */}
        <MeasurementLayer />

        {/* 3D Center of Gravity Plumb Line & Target Layer */}
        <CenterOfGravityLayer />

        {/* 3D Section Cutting Plane Visualizer Layer */}
        <SectionPlaneVisualizerLayer />

        {/* 3D Assembly Kinematic Mates Visualizer Layer */}
        <AssemblyMatesVisualizerLayer hoveredMateFeature={hoveredMateFeature} />

        {/* 3D Fastener Holes & Collision Visualization Layer */}
        <FastenerHolesLayer />

        {/* 3D Active Face Guide & Origin Layer */}
        <ActiveFaceGuideLayer />

        {/* 3D Surface Cuts Outline Preview Layer */}
        <SurfaceCutsPreviewLayer />

        {/* 3D Cuttable Weldments & Seams Layer (Mode 2) */}
        <WeldmentsLayer />

        {/* 3D Sculpt Brush Ring Indicator */}
        <SculptBrushCursor />


        {/* SolidWorks Instant3D Dimension Callouts on Selected / In-Place Edited Part */}
        {selectedPart && !isSketchMode && !isSculptMode && showInstantDims && (
          <group
            position={[selectedPart.position.x / 10, selectedPart.position.y / 10, selectedPart.position.z / 10]}
            rotation={[
              (selectedPart.rotation.x * Math.PI) / 180,
              (selectedPart.rotation.y * Math.PI) / 180,
              (selectedPart.rotation.z * Math.PI) / 180,
            ]}
          >
            <Instant3DDimensions part={selectedPart} />
          </group>
        )}

        {/* Interactive Transform Gizmo for Move / Rotate / Scale (disabled if component is grounded or locked) */}
        {selectedPart && !isSketchMode && !isSculptMode && !selectedPart.grounded && !selectedPart.locked && (tool === 'move' || tool === 'rotate' || tool === 'scale') && (
          <GizmoTransformControls selectedPart={selectedPart} />
        )}

        <OrbitControls makeDefault enableDamping dampingFactor={0.05} enableRotate={true} enablePan={true} enableZoom={true} minDistance={0.1} maxDistance={3500} />
      </Canvas>

      {/* ─── ON-SCREEN FLOATING SECTION VIEW CONTROLLER PILL ─── */}
      {sectionAxis !== 'NONE' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-[var(--radius-m)] border border-rose-500/60 bg-[var(--bg-1)]/95 shadow-2xl font-mono text-xs text-white select-none">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-s)] bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/40">
            <span>✂️ {t12(language, 'SECTION', 'KESİT')}</span>
          </div>

          {/* Quick Plane Switchers: X | Y | Z */}
          <div className="flex items-center gap-0.5 bg-[var(--bg-2)] p-0.5 rounded-[var(--radius-s)] border border-[var(--line)]">
            {(['X', 'Y', 'Z'] as const).map((ax) => (
              <button
                key={ax}
                type="button"
                onClick={() => setSectionAxis(ax)}
                className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9.5px] font-bold transition-all ${
                  sectionAxis === ax
                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={`${ax} ${t12(language, 'Plane Cut', 'Düzlem Kesiti')}`}
              >
                {ax}
              </button>
            ))}
          </div>

          {/* Precision Offset Slider with Steppers */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-[var(--line)]">
            <span className="text-[9px] text-slate-400 font-bold">{t12(language, 'Pos:', 'Konum:')}</span>
            <button
              type="button"
              onClick={() => setSectionOffset(Math.max(-300, sectionOffset - 10))}
              className="w-4 h-4 flex items-center justify-center rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-slate-300 font-bold text-[10px] transition"
              title="-10 mm"
            >
              -
            </button>
            <input
              type="range"
              min={-300}
              max={300}
              step={1}
              value={sectionOffset}
              onChange={(e) => setSectionOffset(Number(e.target.value))}
              className="w-24 sm:w-36 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-[var(--cyan)]"
              title={t12(language, 'Section Plane Offset (mm)', 'Kesit Düzlemi Konumu (mm)')}
            />
            <button
              type="button"
              onClick={() => setSectionOffset(Math.min(300, sectionOffset + 10))}
              className="w-4 h-4 flex items-center justify-center rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-slate-300 font-bold text-[10px] transition"
              title="+10 mm"
            >
              +
            </button>
            <span className="text-[10px] text-rose-300 font-bold min-w-[50px] text-right">{sectionOffset} mm</span>
          </div>

          {/* Quick 0 mm Center Button */}
          <button
            type="button"
            onClick={() => setSectionOffset(0)}
            className="px-1.5 py-0.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-slate-300 font-bold text-[9px] border border-[var(--line)] transition"
            title={t12(language, 'Reset to Center (0 mm)', 'Merkeze Sıfırla (0 mm)')}
          >
            0 mm
          </button>

          {/* Invert Direction */}
          <button
            type="button"
            onClick={() => setSectionInvert(!sectionInvert)}
            className="px-2 py-0.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-slate-200 font-bold text-[9px] border border-[var(--line)] transition flex items-center gap-1"
            title={t12(language, 'Invert Cut Direction', 'Kesim Yönünü Ters Çevir')}
          >
            <span>⇄</span>
            <span>{sectionInvert ? t12(language, 'Inv', 'Ters') : t12(language, 'Normal', 'Düz')}</span>
          </button>

          {/* Solid Section Cap Toggle */}
          <button
            type="button"
            onClick={() => setSectionSolidCap(!sectionSolidCap)}
            className={`px-2 py-0.5 rounded-[var(--radius-s)] font-bold text-[9px] transition border ${
              sectionSolidCap
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-[var(--bg-2)] border-[var(--line)] text-slate-400 hover:text-white'
            }`}
            title={t12(language, 'Solid Section Cap (Filled vs Hollow)', 'Kesit içi katı dolgu kapağı (Dolu / Boş)')}
          >
            🧱 {sectionSolidCap ? t12(language, 'Solid Cap', 'Katı Kesit') : t12(language, 'Hollow', 'İçi Boş')}
          </button>

          {/* Close Section View Button */}
          <button
            type="button"
            onClick={() => setSectionAxis('NONE')}
            className="w-5 h-5 rounded-[var(--radius-s)] bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition flex items-center justify-center font-bold text-[10px] ml-0.5"
            title={t12(language, 'Close Section View [X]', 'Kesit Görünümünü Kapat [X]')}
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── INTERACTIVE 3D SOLIDWORKS MATE TOP HUD & FLOATING PROPERTY MANAGER ─── */}
      {tool === 'mate' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] px-3.5 py-1.5 rounded-2xl bg-[var(--bg-1)]/98 border border-[var(--cyan)] text-[var(--ink)] font-mono text-xs flex flex-wrap items-center justify-between gap-2.5 select-none animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-ping shrink-0" />
            <span className="font-bold text-[var(--cyan)] shrink-0">📎 {t12(language, 'MATE', 'MONTAJ')}:</span>

            {activeMateDraft?.partAId && activeMateDraft?.partBId ? (
              // Both entities picked: Show Entity 1 ↔ Entity 2 with real feature names
              <div className="flex items-center gap-1.5 text-[10px] truncate">
                <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-400 text-cyan-200 font-bold truncate">
                  [1] {activeMateDraft.featureAName || parts.find((p) => p.id === activeMateDraft.partAId)?.name || 'Part A'}
                </span>
                <span className="text-slate-500 font-bold">↔</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-400 text-emerald-200 font-bold truncate">
                  [2] {activeMateDraft.featureBName || parts.find((p) => p.id === activeMateDraft.partBId)?.name || 'Part B'}
                </span>
              </div>
            ) : activeMateDraft?.partAId ? (
              // Entity 1 picked: prompt for Entity 2
              <div className="flex items-center gap-2 text-[10px]">
                <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-400 text-cyan-200 font-bold">
                  [1] {activeMateDraft.featureAName || parts.find((p) => p.id === activeMateDraft.partAId)?.name || 'Part A'}
                </span>
                <span className="text-emerald-300 font-bold animate-pulse">
                  → {t12(language, 'Click 2nd surface/hole to snap!', '2. yüzeye/deliğe tıklayın!')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    useDesignStore.getState().updateMateDraft({
                      partAId: null,
                      featureAId: null,
                      featureAName: null,
                    });
                  }}
                  className="px-1.5 py-0.2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-bold border border-slate-600 transition cursor-pointer"
                  title={t12(language, 'Clear 1st selection', '1. seçimi temizle')}
                >
                  ✕
                </button>
              </div>
            ) : (
              <span className="text-[10.5px] text-slate-300">
                {t12(language, 'Click any surface/hole to pick Entity 1 (or right-click)', '1. yüzeyi/deliği seçmek için parçaya tıklayın')}
              </span>
            )}
          </div>

          {/* If both entities picked: Surface-Adaptive Mate Kind Selector & Apply Button */}
          {activeMateDraft?.partAId && activeMateDraft?.partBId && (() => {
            const partA = parts.find((p) => p.id === activeMateDraft.partAId);
            const partB = parts.find((p) => p.id === activeMateDraft.partBId);
            const featA = partA && activeMateDraft.featureAId ? extractPartFeatures(partA, true).find((f) => f.id === activeMateDraft.featureAId) : null;
            const featB = partB && activeMateDraft.featureBId ? extractPartFeatures(partB, true).find((f) => f.id === activeMateDraft.featureBId) : null;
            const kindsInfo = getValidMateKinds(featA, featB);

            return (
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center gap-1 bg-black/70 px-1.5 py-0.5 rounded-lg border border-cyan-500/30">
                  {([
                    { kind: 'concentric', label: 'Eşmerkezli', icon: '◎' },
                    { kind: 'coincident', label: 'Çakışık', icon: '⫽' },
                    { kind: 'tangent', label: 'Teğet', icon: '⤢' },
                    { kind: 'distance', label: 'Mesafe', icon: '⇥' },
                    { kind: 'parallel', label: 'Paralel', icon: '⏸' },
                    { kind: 'perpendicular', label: 'Dik', icon: '⊥' },
                    { kind: 'end-to-slot', label: 'Kanala Montaj', icon: '⤵' },
                  ] as const).map(({ kind, label, icon }) => {
                    const isCompat = kindsInfo.compatible.includes(kind);
                    const isRec = kindsInfo.recommended === kind;
                    const isActive = (activeMateDraft.kind || kindsInfo.recommended) === kind;
                    if (!isCompat) return null;
                    return (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => useDesignStore.getState().updateMateDraft({ kind })}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-sm font-black'
                            : isRec
                            ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-400/80 hover:bg-cyan-900/80'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                        title={isRec ? `${label} (Önerilen / Yüzeye Uygun)` : label}
                      >
                        <span>{icon}</span>
                        <span>{label}</span>
                        {isRec && <span className="text-[7.5px] opacity-80">★</span>}
                      </button>
                    );
                  })}

                  {activeMateDraft.kind === 'distance' && (
                    <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-700">
                      <span className="text-[9px] text-slate-400">Offset:</span>
                      <input
                        type="number"
                        value={activeMateDraft.offset ?? 0}
                        onChange={(e) => useDesignStore.getState().updateMateDraft({ offset: parseFloat(e.target.value) || 0 })}
                        className="w-12 px-1 py-0.2 bg-black/80 border border-slate-600 rounded text-cyan-300 text-[9.5px] font-mono text-center"
                      />
                      <span className="text-[8.5px] text-slate-400">mm</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => useDesignStore.getState().updateMateDraft({ flip: !activeMateDraft.flip })}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ml-0.5 ${
                      activeMateDraft.flip
                        ? 'bg-amber-500/30 text-amber-300 border-amber-500/60'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                    title={t12(language, 'Flip Mate Alignment Direction', 'Hizalama Yönünü Çevir')}
                  >
                    ⇄ {t12(language, 'Flip', 'Çevir')}
                  </button>
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={() => {
                    const success = useDesignStore.getState().commitMateDraft();
                    if (success) {
                      handleMateSuccess({
                        partAName: partA?.name || 'Part A',
                        partBName: partB?.name || 'Part B',
                        kind: activeMateDraft.kind,
                        mateId: useDesignStore.getState().selectedMateId || 'mate',
                      });
                    }
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--ok)] hover:bg-[var(--ok)] text-black font-black text-[9.5px] uppercase tracking-wider shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <span className="text-[10px]">✔</span>
                  <span>{t12(language, 'Apply [Enter]', 'Onayla [Enter]')}</span>
                </button>
              </div>
            );
          })()}

          {/* Exit Mate Mode Button */}
          <button
            type="button"
            onClick={() => {
              setTool('select');
              useDesignStore.getState().closeMateModal();
            }}
            className="px-1.5 py-0.5 rounded-[var(--radius-s)] bg-[var(--bg-3)] hover:bg-rose-500/20 hover:text-rose-300 text-[var(--alu-dim)] font-bold text-[10px] transition border border-[var(--line)] cursor-pointer shrink-0"
            title={t12(language, 'Exit Mate Mode (Esc)', 'Montaj Modundan Çık (Esc)')}
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── SOLIDWORKS / INVENTOR UNIFIED 2D SKETCH TOOLBAR & INSPECTOR HUD ─── */}
      {isSketchMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1.5 max-w-[96vw] pointer-events-none select-none">
          {/* Row 1: Main Sketch HUD Toolbar */}
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-m)] border border-cyan-500/70 bg-[var(--bg-1)]/98 shadow-[0_12px_45px_rgba(0,0,0,0.92)] font-mono text-xs text-white animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Active Face / Sketch Plane Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-s)] bg-cyan-500/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>📐 {selectedPart ? `${selectedPart.name} [${(activeFace || 'top').toUpperCase()}]` : t12(language, 'GROUND GRID', 'ZEMİN IZGARASI')}</span>
            </div>

          {/* Target Face Selector Quick Switcher */}
          <div className="flex items-center gap-0.5 bg-[var(--bg-2)] p-0.5 rounded-[var(--radius-s)] border border-[var(--line)]">
            <button
              type="button"
              onClick={() => {
                useDesignStore.getState().setActiveFace(null);
                select(null);
              }}
              className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition flex items-center gap-1 cursor-pointer ${
                !activeFace || !selectedPart
                  ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={t12(language, 'Switch to Ground Grid (XY Plane)', 'Zemin Izgarasına Dön')}
            >
              <span>🌐</span>
              <span>{t12(language, 'Ground', 'Zemin')}</span>
            </button>

            {parts.length > 0 && (() => {
              const currentPart = selectedPart || parts[parts.length - 1];
              const faces: { key: SurfaceFace; label: string; icon: string }[] = [
                { key: 'top', label: t12(language, 'Top', 'Üst'), icon: '⬆️' },
                { key: 'front', label: t12(language, 'Front', 'Ön'), icon: '➡️' },
                { key: 'right', label: t12(language, 'Right', 'Sağ'), icon: '▶️' },
                { key: 'back', label: t12(language, 'Back', 'Arka'), icon: '⬅️' },
                { key: 'left', label: t12(language, 'Left', 'Sol'), icon: '◀️' },
                { key: 'bottom', label: t12(language, 'Bottom', 'Alt'), icon: '⬇️' },
              ];

              return faces.map((f) => {
                const isSelectedFace = selectedPart?.id === currentPart.id && activeFace === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => {
                      select(currentPart.id);
                      useDesignStore.getState().setActiveFace(f.key);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition flex items-center gap-0.5 cursor-pointer ${
                      isSelectedFace
                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-[var(--bg-3)]'
                    }`}
                    title={`${currentPart.name} • ${f.label}`}
                  >
                    <span>{f.icon}</span>
                    <span>{f.label}</span>
                  </button>
                );
              });
            })()}
          </div>

          {/* Normal To (Yüze Dik Bak) Camera Button */}
          <button
            type="button"
            onClick={() => {
              if (selectedPart) {
                triggerCameraView({ type: 'focus-face', partId: selectedPart.id, face: activeFace || 'top' });
              } else {
                triggerCameraView('top');
              }
            }}
            className="px-2 py-0.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-cyan-300 hover:text-white border border-[var(--line)] text-[9.5px] font-bold transition flex items-center gap-1 cursor-pointer"
            title={t12(language, 'Align Camera Normal to Sketch Face (Space/Ctrl+8)', 'Kamerayı Çizim Yüzeyine Dik Hizala (Ctrl+8)')}
          >
            <span>🎯</span>
            <span>{t12(language, 'Normal To', 'Yüze Dik Bak')}</span>
          </button>

          <div className="w-[1px] h-3.5 bg-slate-700" />

          {/* Shape Selector: Line, Circles, Arcs, Ellipse, Rect, Polygon, Trim */}
          <div className="flex items-center gap-0.5 bg-[var(--bg-2)] p-0.5 rounded-[var(--radius-s)] border border-[var(--line)]">
            <button
              type="button"
              onClick={() => setSketchShapeMode('line')}
              className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                sketchShapeMode === 'line'
                  ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={t12(language, 'Line / Polyline (Continuous)', 'Çizgi / Serbest Çizim')}
            >
              <span>✏️</span>
              <span>{t12(language, 'Line', 'Çizgi')}</span>
            </button>

            <button
              type="button"
              onClick={() => setSketchShapeMode('circle')}
              className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                sketchShapeMode === 'circle'
                  ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={t12(language, 'Circle (Center + Radius)', 'Daire (Merkez + Yarıçap)')}
            >
              <span>⭕</span>
              <span>{t12(language, 'Circle', 'Daire')}</span>
            </button>

            <button
              type="button"
              onClick={() => setSketchShapeMode('circle_2p')}
              className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                sketchShapeMode === 'circle_2p'
                  ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={t12(language, '2-Point Diameter Circle', '2-Nokta Çaplı Daire')}
            >
              <span>⚪</span>
              <span>{t12(language, '2P Circle', '2P Daire')}</span>
            </button>

            <button
              type="button"
              onClick={() => setSketchShapeMode('arc_semi')}
              className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                sketchShapeMode === 'arc_semi'
                  ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={t12(language, 'Semi-Circle (180° Half Circle)', 'Yarım Daire (180° Yay)')}
            >
              <span>🌗</span>
              <span>{t12(language, 'Semi-Circle', 'Yarım Daire')}</span>
            </button>

            <button
              type="button"
              onClick={() => setSketchShapeMode('arc_3p')}
              className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                sketchShapeMode === 'arc_3p'
                  ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={t12(language, '3-Point Arc (Start, Mid, End)', '3-Nokta Yay (Başlangıç, Tepe, Bitiş)')}
            >
              <span>🏹</span>
              <span>{t12(language, '3P Arc', '3P Yay')}</span>
            </button>

            <button
              type="button"
              onClick={() => setSketchShapeMode('ellipse')}
              className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                sketchShapeMode === 'ellipse'
                  ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={t12(language, 'Ellipse (Center, Rx, Ry)', 'Elips (Merkez, Rx, Ry)')}
            >
              <span>🥚</span>
              <span>{t12(language, 'Ellipse', 'Elips')}</span>
            </button>

            <button
              type="button"
              onClick={() => setSketchShapeMode('rect')}
              className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                sketchShapeMode === 'rect'
                  ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={t12(language, 'Rectangle (2-point corner)', 'Dikdörtgen (2 Noktalı Köşe)')}
            >
              <span>⬛</span>
              <span>{t12(language, 'Rectangle', 'Dikdörtgen')}</span>
            </button>

            <button
              type="button"
              onClick={() => setSketchShapeMode('polygon')}
              className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                sketchShapeMode === 'polygon'
                  ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={t12(language, 'Hexagon / Polygon', 'Altıgen / Çokgen')}
            >
              <span>📐</span>
              <span>{t12(language, 'Polygon', 'Çokgen')}</span>
            </button>

            {/* Trim Tool Button (AutoCAD / SolidWorks Trim) */}
            <button
              type="button"
              onClick={() => setSketchShapeMode('trim')}
              className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                sketchShapeMode === 'trim'
                  ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black shadow-sm animate-pulse'
                  : 'text-rose-300 hover:text-white'
              }`}
              title={t12(language, 'Trim Tool: Click any line segment or overhang to cut at intersection (AutoCAD / SolidWorks Trim)', 'Budama / Kırpma Aracı: Tıklanan çizgiyi kesişime kadar kırpar')}
            >
              <span>✂️</span>
              <span>{t12(language, 'Trim', 'Kırp')}</span>
            </button>
          </div>

          {/* Quick Auto-Trim Overhangs Action */}
          <button
            type="button"
            onClick={() => {
              const count = autoTrimOverhangsAction();
              if (count > 0) {
                // feedback
              }
            }}
            disabled={sketchEntities.length === 0}
            className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9.5px] font-bold transition flex items-center gap-1 cursor-pointer border ${
              sketchEntities.length > 0
                ? 'bg-amber-500/25 hover:bg-amber-500/40 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-[var(--bg-2)] opacity-40 pointer-events-none text-slate-500 border-[var(--line)]'
            }`}
            title={t12(
              language,
              'Auto-Trim Overhangs: Automatically removes dangling line tails extending past intersections',
              'Taşan Uçları Otomatik Kırp: Kapalı alanların dışına taşan fazla uçları temizler'
            )}
          >
            <span>✂️✨</span>
            <span>{t12(language, 'Auto-Trim', 'Taşanları Kırp')}</span>
          </button>

          {/* End Current Segment / Start New Independent Line Button (Prevents Forced Chaining) */}
          <button
            type="button"
            onClick={endCurrentLineSegment}
            disabled={sketchPoints.length === 0}
            className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9.5px] font-bold transition flex items-center gap-1 cursor-pointer border ${
              sketchPoints.length > 0
                ? 'bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 border-amber-400 animate-pulse shadow-sm'
                : 'bg-[var(--bg-2)] opacity-40 pointer-events-none text-slate-500 border-[var(--line)]'
            }`}
            title={t12(
              language,
              'Finish Current Segment & Detach Line (Esc / Right-Click / Double-Click)',
              'Mevcut Çizgiyi Bitir & Serbest Bırak (Esc / Sağ Tık / Çift Tık)'
            )}
          >
            <span>✂️</span>
            <span>{t12(language, 'Detach (Esc)', 'Zinciri Bitir (Esc)')}</span>
          </button>

          {/* Construction / Reference Line Toggle (Sanal / Yardımcı Çizgiler) */}
          <button
            type="button"
            onClick={toggleConstructionMode}
            className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9.5px] font-bold transition flex items-center gap-1 cursor-pointer border ${
              isConstructionMode
                ? 'bg-amber-500/30 text-amber-300 border-amber-400 shadow-sm'
                : 'bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-slate-400 hover:text-white border-[var(--line)]'
            }`}
            title={t12(
              language,
              'Toggle Construction / Reference Mode (Dashed line; ignored by Extrude & Cut operations)',
              'Sanal / Referans Kılavuz Çizgisi Modu (Kesim veya katı yapmaz, ölçülendirme ve merkezleme için kullanılır)'
            )}
          >
            <span className="font-mono">--</span>
            <span>{isConstructionMode ? t12(language, 'Ref (Active)', 'Sanal (Açık)') : t12(language, 'Ref Line', 'Sanal Çizgi')}</span>
          </button>

          {/* Dynamic Blocks Catalog Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDynamicBlockDropdownOpen(!dynamicBlockDropdownOpen)}
              className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9.5px] font-bold transition flex items-center gap-1 cursor-pointer border ${
                dynamicBlockDropdownOpen
                  ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black border-cyan-400'
                  : 'bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-cyan-300 hover:text-white border-[var(--line)]'
              }`}
              title={t12(
                language,
                'Stamp Parametric Dynamic Blocks onto Sketch (Bolt circles, vents, keyways, aerofoil, mould cavities, figurine bases)',
                'Dinamik Bloklar: Cıvata Çemberi, Havalandırma, NEMA Motor, Otomotiv Kanat/Kaporta, Kalıp ve Figür Kaideleri'
              )}
            >
              <span>📦</span>
              <span>{t12(language, 'Dynamic Blocks ▾', 'Dinamik Blok ▾')}</span>
            </button>

            {dynamicBlockDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-72 rounded-[var(--radius-m)] bg-[var(--bg-1)]/98 border border-cyan-500/60 shadow-[0_12px_40px_rgba(0,0,0,0.95)] p-1.5 z-50 text-[10px] space-y-1">
                <div className="px-2 py-1 text-[9px] font-bold text-slate-400 border-b border-[var(--line)] flex items-center justify-between">
                  <span>{t12(language, 'PARAMETRIC 2D BLOCKS', 'PARAMETRİK DİNAMİK BLOKLAR')}</span>
                  <button
                    type="button"
                    onClick={() => setDynamicBlockDropdownOpen(false)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1">
                  {SKETCH_DYNAMIC_BLOCKS.map((blk) => (
                    <button
                      key={blk.id}
                      type="button"
                      onClick={() => {
                        stampDynamicBlockToSketch(blk.id, { x: 0, y: 0 });
                        setDynamicBlockDropdownOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-cyan-500/20 hover:border-cyan-500/40 border border-transparent flex items-start gap-2 transition cursor-pointer"
                    >
                      <span className="text-sm shrink-0">{blk.icon}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-cyan-300 truncate">
                          {t12(language, blk.nameEn, blk.nameTr)}
                        </div>
                        <div className="text-[8.5px] text-slate-400 leading-tight truncate">
                          {t12(language, blk.descriptionEn, blk.descriptionTr)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Numeric Coordinate Entry (X / Y) */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[9.5px]">
            <span className="text-slate-400 font-bold">X:</span>
            <input
              type="number"
              value={sketchNumericCoords.x}
              onChange={(e) => setSketchNumericCoords({ ...sketchNumericCoords, x: Number(e.target.value) })}
              className="w-11 bg-slate-900 border border-slate-700 text-cyan-300 font-bold text-center text-[10px] rounded px-1 py-0.2 focus:outline-none focus:border-cyan-400"
            />
            <span className="text-slate-400 font-bold ml-0.5">Y:</span>
            <input
              type="number"
              value={sketchNumericCoords.y}
              onChange={(e) => setSketchNumericCoords({ ...sketchNumericCoords, y: Number(e.target.value) })}
              className="w-11 bg-slate-900 border border-slate-700 text-cyan-300 font-bold text-center text-[10px] rounded px-1 py-0.2 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="button"
              onClick={() => addCoordinateSketchPoint(sketchNumericCoords.x, sketchNumericCoords.y)}
              className="px-1.5 py-0.2 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 font-bold border border-cyan-500/40 transition cursor-pointer"
              title={t12(language, 'Add Point at (X, Y) Coordinate', 'Girilen (X, Y) Koordinatına Nokta Ekle')}
            >
              +
            </button>
          </div>

          {/* Dimensions Visibility Toggle (Show / Hide Badges) */}
          <button
            type="button"
            onClick={() => setShowSketchDimensions(!showSketchDimensions)}
            className={`px-1.5 py-0.5 rounded-[var(--radius-s)] text-[9.5px] font-bold transition flex items-center gap-1 cursor-pointer border ${
              showSketchDimensions
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-[var(--bg-2)] text-slate-400 hover:text-white border-[var(--line)]'
            }`}
            title={t12(language, 'Toggle Sketch Dimensions & Angle Badges', 'Çizim Ölçü ve Açı Etiketlerini Göster/Gizle')}
          >
            <span>📏</span>
          </button>

          {/* Circle / Polygon Radius Controls */}
          {(sketchShapeMode === 'circle' || sketchShapeMode === 'polygon') && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--bg-2)] border border-cyan-500/40">
              <span className="text-[9.5px] text-cyan-300 font-bold">R:</span>
              <input
                type="number"
                min={2}
                max={500}
                value={sketchCircleRadius || 25}
                onChange={(e) => setSketchCircleRadius(Math.max(1, Number(e.target.value)))}
                className="w-12 bg-slate-900 border border-slate-700 text-cyan-300 font-bold text-center text-[10px] rounded px-1 py-0.5 focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[9px] text-slate-400">mm</span>
              <div className="flex items-center gap-0.5 ml-1">
                {[3, 4, 5, 8, 10, 15, 20, 25].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSketchCircleRadius(r)}
                    className={`px-1 py-0.2 rounded text-[8.5px] font-bold ${
                      sketchCircleRadius === r ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Ø{r * 2}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Corner Fillet (Radius) Control - Available when sketch has >= 3 points */}
          {sketchPoints.length >= 3 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--bg-2)] border border-amber-500/40">
              <span className="text-[9.5px] text-amber-300 font-bold">R:</span>
              <input
                type="number"
                min={1}
                max={100}
                value={filletRadiusInput}
                onChange={(e) => setFilletRadiusInput(Math.max(1, Number(e.target.value)))}
                className="w-10 bg-slate-900 border border-slate-700 text-amber-300 font-bold text-center text-[10px] rounded px-1 py-0.5 focus:outline-none focus:border-amber-400"
              />
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 5, 8].map((fr) => (
                  <button
                    key={fr}
                    type="button"
                    onClick={() => {
                      setFilletRadiusInput(fr);
                      applySketchFillet(fr);
                    }}
                    className={`px-1 py-0.2 rounded text-[8.5px] font-bold ${
                      filletRadiusInput === fr ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    R{fr}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => applySketchFillet(filletRadiusInput)}
                className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 font-bold text-[9px] border border-amber-500/40 transition cursor-pointer"
                title={t12(language, 'Round All Corners with Radius (Fillet)', 'Tüm Köşelere Radius Uygula')}
              >
                🪓 {t12(language, 'Fillet', 'Radius Ekle')}
              </button>
            </div>
          )}

          <div className="w-[1px] h-3.5 bg-slate-700" />

          {/* Sketch Status & Undo/Clear Actions */}
          <span className="text-[9.5px] text-slate-400 font-mono">
            {sketchEntities.length > 0 ? `${sketchEntities.length} nesne • ` : ''}
            {sketchPoints.length} {t12(language, 'pts', 'nokta')}
          </span>

          {(sketchPoints.length > 0 || sketchEntities.length > 0) && (
            <>
              <button
                type="button"
                onClick={undoSketchPoint}
                className="px-1.5 py-0.5 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-slate-300 text-[9px] font-bold border border-[var(--line)] transition cursor-pointer"
                title={t12(language, 'Undo Last Point (Ctrl+Z)', 'Son Noktayı Geri Al')}
              >
                ↶ {t12(language, 'Undo', 'Geri')}
              </button>
              <button
                type="button"
                onClick={clearSketch}
                className="px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[9px] font-bold border border-rose-500/30 transition cursor-pointer"
                title={t12(language, 'Clear All Points & Entities', 'Çizimi Temizle')}
              >
                🗑️
              </button>
            </>
          )}

          {/* Finish & Extrude/Cut Button or In-Place Update */}
          <button
            type="button"
            onClick={() => {
              if (editingPartId) {
                commitExtrude();
              } else {
                if (sketchPoints.length >= 2) {
                  endCurrentLineSegment();
                }
                openExtrudeDialog();
              }
            }}
            disabled={sketchPoints.length < 2 && sketchEntities.length === 0}
            className="ml-1 px-3 py-1 rounded-[var(--radius-s)] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-[10px] shadow transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            title={
              editingPartId
                ? t12(language, 'Update Part Geometry In-Place', 'Parçayı Yerinde Güncelle')
                : t12(language, 'Finish Sketch and Open Extrude / Cut Dialog', 'Çizimi Bitir, Katı Ekle veya Kesi Oluştur')
            }
          >
            <span>✔</span>
            <span>
              {editingPartId
                ? t12(language, 'Update Part', 'Parçayı Güncelle')
                : t12(language, 'Finish & Extrude/Cut', 'Bitir & Katı/Kes')}
            </span>
          </button>

          {/* Cancel Sketch */}
          <button
            type="button"
            onClick={() => {
              clearSketch();
              setTool('select');
            }}
            className="w-5 h-5 rounded-[var(--radius-s)] bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition flex items-center justify-center font-bold text-[10px] cursor-pointer ml-0.5"
            title={t12(language, 'Cancel Sketch (Esc)', 'Çizimi İptal Et (Esc)')}
          >
            ✕
          </button>
        </div>

        {/* Row 2: Parametric Entity Property Inspector (Docked cleanly below Row 1 with ZERO overlap) */}
        {selectedSketchEntityId && (() => {
          const ent = sketchEntities.find((e) => e.id === selectedSketchEntityId);
          if (!ent) return null;

          const isLine = ent.points && ent.points.length === 2;
          const p1 = ent.points ? ent.points[0] : null;
          const p2 = ent.points ? ent.points[1] : null;
          const lineLen = p1 && p2 ? Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y) * 10) / 10 : 0;
          const lineAngle = p1 && p2 ? Math.round((((Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI + 360) % 360) * 10) / 10 : 0;

          let entCx = Math.round(ent.center?.x ?? 0);
          let entCy = Math.round(ent.center?.y ?? 0);
          let entW = Math.round(ent.width ?? 0);
          let entH = Math.round(ent.height ?? 0);
          let entAngle = Math.round(ent.angleDeg ?? 0);

          if ((!ent.center || entW === 0 || entH === 0) && ent.points && ent.points.length >= 3) {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            ent.points.forEach((pt) => {
              if (pt.x < minX) minX = pt.x;
              if (pt.x > maxX) maxX = pt.x;
              if (pt.y < minY) minY = pt.y;
              if (pt.y > maxY) maxY = pt.y;
            });
            if (!ent.center) {
              entCx = Math.round(((minX + maxX) / 2) * 10) / 10;
              entCy = Math.round(((minY + maxY) / 2) * 10) / 10;
            }
            if (entW === 0) entW = Math.round((maxX - minX) * 10) / 10;
            if (entH === 0) entH = Math.round((maxY - minY) * 10) / 10;
          }

          const isCircle = ent.type === 'circle' || ent.type === 'circle_2p';
          const isRect = ent.type === 'rect';
          const isPoly = ent.type === 'polygon' || ent.type === 'polyline';

          return (
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3 py-1.5 rounded-[var(--radius-m)] border border-amber-500/80 bg-[var(--bg-1)]/98 shadow-[0_12px_45px_rgba(0,0,0,0.95)] font-mono text-xs text-white animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Header Badge */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-s)] bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>
                  {isLine
                    ? t12(language, 'Line Properties', 'Çizgi Özellikleri')
                    : isCircle
                    ? t12(language, 'Circle Properties', 'Daire Özellikleri')
                    : isRect
                    ? t12(language, 'Rect Properties', 'Dikdörtgen Özellikleri')
                    : isPoly
                    ? t12(language, 'Profile / Polygon', 'Profil / Çokgen')
                    : t12(language, 'Entity Properties', 'Çizim Nesnesi')}
                </span>
              </div>

            {/* Line Specific Parametric Fields */}
            {isLine && p1 && p2 && (
              <>
                {/* Length (mm) */}
                <div className="flex items-center gap-1">
                  <label className="text-[10px] text-slate-400 font-bold">
                    {t12(language, 'Length:', 'Boy:')}
                  </label>
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5">
                    <input
                      type="number"
                      step="1"
                      min="0.1"
                      value={lineLen}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          updateSketchEntity(ent.id, { length: val });
                        }
                      }}
                      className="w-14 bg-transparent text-amber-300 font-bold text-[10px] outline-none text-right font-mono"
                    />
                    <span className="text-[9px] text-slate-400 ml-0.5">mm</span>
                  </div>
                </div>

                {/* Angle (deg) */}
                <div className="flex items-center gap-1">
                  <label className="text-[10px] text-slate-400 font-bold">
                    {t12(language, 'Angle:', 'Açı:')}
                  </label>
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="360"
                      value={lineAngle}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          updateSketchEntity(ent.id, { angleDeg: val });
                        }
                      }}
                      className="w-12 bg-transparent text-amber-300 font-bold text-[10px] outline-none text-right font-mono"
                    />
                    <span className="text-[9px] text-slate-400 ml-0.5">°</span>
                  </div>
                </div>

                <div className="w-[1px] h-3.5 bg-slate-700" />

                {/* Start Coordinates P1 (X, Y) */}
                <div className="flex items-center gap-1 text-[9.5px]">
                  <span className="text-slate-400">P1:</span>
                  <input
                    type="number"
                    step="1"
                    value={Math.round(p1.x)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        updateSketchEntity(ent.id, { p1: { x: val, y: p1.y } });
                      }
                    }}
                    className="w-10 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-cyan-300 font-bold text-[9.5px] outline-none text-right font-mono"
                    title="P1 X"
                  />
                  <input
                    type="number"
                    step="1"
                    value={Math.round(p1.y)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        updateSketchEntity(ent.id, { p1: { x: p1.x, y: val } });
                      }
                    }}
                    className="w-10 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-cyan-300 font-bold text-[9.5px] outline-none text-right font-mono"
                    title="P1 Y"
                  />
                </div>

                {/* End Coordinates P2 (X, Y) */}
                <div className="flex items-center gap-1 text-[9.5px]">
                  <span className="text-slate-400">P2:</span>
                  <input
                    type="number"
                    step="1"
                    value={Math.round(p2.x)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        updateSketchEntity(ent.id, { p2: { x: val, y: p2.y } });
                      }
                    }}
                    className="w-10 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-cyan-300 font-bold text-[9.5px] outline-none text-right font-mono"
                    title="P2 X"
                  />
                  <input
                    type="number"
                    step="1"
                    value={Math.round(p2.y)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        updateSketchEntity(ent.id, { p2: { x: p2.x, y: val } });
                      }
                    }}
                    className="w-10 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-cyan-300 font-bold text-[9.5px] outline-none text-right font-mono"
                    title="P2 Y"
                  />
                </div>
              </>
            )}

            {/* Circle Specific Parametric Fields */}
            {isCircle && (
              <>
                {/* Center Position (X, Y) */}
                <div className="flex items-center gap-1 text-[9.5px]">
                  <span className="text-slate-400 font-bold">X:</span>
                  <input
                    type="number"
                    step="1"
                    value={entCx}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) updateSketchEntity(ent.id, { cx: val });
                    }}
                    className="w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-amber-300 font-bold text-[9.5px] outline-none text-right font-mono"
                    title="Center X"
                  />
                  <span className="text-slate-400 font-bold ml-0.5">Y:</span>
                  <input
                    type="number"
                    step="1"
                    value={entCy}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) updateSketchEntity(ent.id, { cy: val });
                    }}
                    className="w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-amber-300 font-bold text-[9.5px] outline-none text-right font-mono"
                    title="Center Y"
                  />
                </div>

                <div className="w-[1px] h-3.5 bg-slate-700" />

                {/* Radius Field */}
                <div className="flex items-center gap-1">
                  <label className="text-[10px] text-slate-400 font-bold">R:</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={Math.round(ent.radius || 10)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) {
                        updateSketchEntity(ent.id, { radius: val });
                      }
                    }}
                    className="w-12 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-amber-300 font-bold text-[10px] outline-none text-right font-mono"
                  />
                  <span className="text-[9px] text-slate-400">mm</span>
                </div>

                {/* Diameter Field */}
                <div className="flex items-center gap-1">
                  <label className="text-[10px] text-slate-400 font-bold">Ø:</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={Math.round((ent.radius || 10) * 2)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) {
                        updateSketchEntity(ent.id, { diameter: val });
                      }
                    }}
                    className="w-12 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-amber-300 font-bold text-[10px] outline-none text-right font-mono"
                  />
                  <span className="text-[9px] text-slate-400">mm</span>
                </div>
              </>
            )}

            {/* Rectangle Specific Parametric Fields */}
            {isRect && (
              <>
                {/* Quick Alignment / Orientation Tools */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={() => updateSketchEntity(ent.id, { cx: 0, cy: 0 })}
                    className="px-1.5 py-0.5 rounded hover:bg-amber-500/20 text-amber-300 font-bold text-[9px] transition cursor-pointer flex items-center gap-1"
                    title={t12(language, 'Center on Face (X=0, Y=0)', 'Yüzey Merkezine Hizala (X=0, Y=0)')}
                  >
                    <span>🎯</span>
                    <span>{t12(language, 'Center', 'Ortala')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSketchEntity(ent.id, { angleDeg: ((entAngle + 90) % 360) })}
                    className="px-1.5 py-0.5 rounded hover:bg-amber-500/20 text-amber-300 font-bold text-[9px] transition cursor-pointer flex items-center gap-0.5"
                    title={t12(language, 'Rotate +90°', '+90° Döndür')}
                  >
                    <span>📐</span>
                    <span>+90°</span>
                  </button>
                </div>

                <div className="w-[1px] h-3.5 bg-slate-700" />

                {/* Center Position (X, Y) with Nudge Buttons */}
                <div className="flex items-center gap-1 text-[9.5px]">
                  <span className="text-slate-400 font-bold">X:</span>
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateSketchEntity(ent.id, { cx: entCx - 5 })}
                      className="px-1 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white text-[9px] font-bold cursor-pointer"
                      title="-5mm"
                    >-</button>
                    <input
                      type="number"
                      step="1"
                      value={entCx}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) updateSketchEntity(ent.id, { cx: val });
                      }}
                      className="w-10 bg-transparent text-amber-300 font-bold text-[9.5px] outline-none text-right font-mono"
                      title="Center X"
                    />
                    <button
                      type="button"
                      onClick={() => updateSketchEntity(ent.id, { cx: entCx + 5 })}
                      className="px-1 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white text-[9px] font-bold cursor-pointer"
                      title="+5mm"
                    >+</button>
                  </div>

                  <span className="text-slate-400 font-bold ml-1">Y:</span>
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateSketchEntity(ent.id, { cy: entCy - 5 })}
                      className="px-1 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white text-[9px] font-bold cursor-pointer"
                      title="-5mm"
                    >-</button>
                    <input
                      type="number"
                      step="1"
                      value={entCy}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) updateSketchEntity(ent.id, { cy: val });
                      }}
                      className="w-10 bg-transparent text-amber-300 font-bold text-[9.5px] outline-none text-right font-mono"
                      title="Center Y"
                    />
                    <button
                      type="button"
                      onClick={() => updateSketchEntity(ent.id, { cy: entCy + 5 })}
                      className="px-1 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white text-[9px] font-bold cursor-pointer"
                      title="+5mm"
                    >+</button>
                  </div>
                </div>

                <div className="w-[1px] h-3.5 bg-slate-700" />

                {/* Dimensions (W, H) with Nudge Buttons */}
                <div className="flex items-center gap-1">
                  <label className="text-[10px] text-slate-400 font-bold">W:</label>
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateSketchEntity(ent.id, { width: Math.max(2, entW - 5) })}
                      className="px-1 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white text-[9px] font-bold cursor-pointer"
                      title="-5mm"
                    >-</button>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={entW}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          updateSketchEntity(ent.id, { width: val });
                        }
                      }}
                      className="w-11 bg-transparent text-amber-300 font-bold text-[10px] outline-none text-right font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => updateSketchEntity(ent.id, { width: entW + 5 })}
                      className="px-1 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white text-[9px] font-bold cursor-pointer"
                      title="+5mm"
                    >+</button>
                  </div>
                  <span className="text-[9px] text-slate-400">mm</span>
                </div>

                <div className="flex items-center gap-1">
                  <label className="text-[10px] text-slate-400 font-bold">H:</label>
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateSketchEntity(ent.id, { height: Math.max(2, entH - 5) })}
                      className="px-1 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white text-[9px] font-bold cursor-pointer"
                      title="-5mm"
                    >-</button>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={entH}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          updateSketchEntity(ent.id, { height: val });
                        }
                      }}
                      className="w-11 bg-transparent text-amber-300 font-bold text-[10px] outline-none text-right font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => updateSketchEntity(ent.id, { height: entH + 5 })}
                      className="px-1 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white text-[9px] font-bold cursor-pointer"
                      title="+5mm"
                    >+</button>
                  </div>
                  <span className="text-[9px] text-slate-400">mm</span>
                </div>

                {/* Angle (deg) */}
                <div className="flex items-center gap-1">
                  <label className="text-[10px] text-slate-400 font-bold">
                    {t12(language, 'Angle:', 'Açı:')}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="360"
                    value={entAngle}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        updateSketchEntity(ent.id, { angleDeg: val });
                      }
                    }}
                    className="w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-amber-300 font-bold text-[10px] outline-none text-right font-mono"
                  />
                  <span className="text-[9px] text-slate-400">°</span>
                </div>
              </>
            )}

            {/* Polygon / Polyline Parametric Fields */}
            {isPoly && (
              <>
                {/* Quick Alignment / Orientation Tools */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={() => updateSketchEntity(ent.id, { cx: 0, cy: 0 })}
                    className="px-1.5 py-0.5 rounded hover:bg-amber-500/20 text-amber-300 font-bold text-[9px] transition cursor-pointer flex items-center gap-1"
                    title={t12(language, 'Center on Face (X=0, Y=0)', 'Yüzey Merkezine Hizala (X=0, Y=0)')}
                  >
                    <span>🎯</span>
                    <span>{t12(language, 'Center', 'Ortala')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSketchEntity(ent.id, { angleDeg: ((entAngle + 90) % 360) })}
                    className="px-1.5 py-0.5 rounded hover:bg-amber-500/20 text-amber-300 font-bold text-[9px] transition cursor-pointer flex items-center gap-0.5"
                    title={t12(language, 'Rotate +90°', '+90° Döndür')}
                  >
                    <span>📐</span>
                    <span>+90°</span>
                  </button>
                </div>

                <div className="w-[1px] h-3.5 bg-slate-700" />

                {/* Centroid (X, Y) with Nudge Buttons */}
                <div className="flex items-center gap-1 text-[9.5px]">
                  <span className="text-slate-400 font-bold">X:</span>
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateSketchEntity(ent.id, { cx: entCx - 5 })}
                      className="px-1 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white text-[9px] font-bold cursor-pointer"
                      title="-5mm"
                    >-</button>
                    <input
                      type="number"
                      step="1"
                      value={entCx}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) updateSketchEntity(ent.id, { cx: val });
                      }}
                      className="w-10 bg-transparent text-amber-300 font-bold text-[9.5px] outline-none text-right font-mono"
                      title="Centroid X"
                    />
                    <button
                      type="button"
                      onClick={() => updateSketchEntity(ent.id, { cx: entCx + 5 })}
                      className="px-1 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white text-[9px] font-bold cursor-pointer"
                      title="+5mm"
                    >+</button>
                  </div>

                  <span className="text-slate-400 font-bold ml-1">Y:</span>
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateSketchEntity(ent.id, { cy: entCy - 5 })}
                      className="px-1 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white text-[9px] font-bold cursor-pointer"
                      title="-5mm"
                    >-</button>
                    <input
                      type="number"
                      step="1"
                      value={entCy}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) updateSketchEntity(ent.id, { cy: val });
                      }}
                      className="w-10 bg-transparent text-amber-300 font-bold text-[9.5px] outline-none text-right font-mono"
                      title="Centroid Y"
                    />
                    <button
                      type="button"
                      onClick={() => updateSketchEntity(ent.id, { cy: entCy + 5 })}
                      className="px-1 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white text-[9px] font-bold cursor-pointer"
                      title="+5mm"
                    >+</button>
                  </div>
                </div>

                <div className="w-[1px] h-3.5 bg-slate-700" />

                {/* Bounding Dimensions (W, H) with Nudge Buttons */}
                <div className="flex items-center gap-1">
                  <label className="text-[10px] text-slate-400 font-bold">W:</label>
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateSketchEntity(ent.id, { width: Math.max(2, entW - 5) })}
                      className="px-1 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white text-[9px] font-bold cursor-pointer"
                      title="-5mm"
                    >-</button>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={entW}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          updateSketchEntity(ent.id, { width: val });
                        }
                      }}
                      className="w-11 bg-transparent text-amber-300 font-bold text-[10px] outline-none text-right font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => updateSketchEntity(ent.id, { width: entW + 5 })}
                      className="px-1 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white text-[9px] font-bold cursor-pointer"
                      title="+5mm"
                    >+</button>
                  </div>
                  <span className="text-[9px] text-slate-400">mm</span>
                </div>

                <div className="flex items-center gap-1">
                  <label className="text-[10px] text-slate-400 font-bold">H:</label>
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateSketchEntity(ent.id, { height: Math.max(2, entH - 5) })}
                      className="px-1 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white text-[9px] font-bold cursor-pointer"
                      title="-5mm"
                    >-</button>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={entH}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          updateSketchEntity(ent.id, { height: val });
                        }
                      }}
                      className="w-11 bg-transparent text-amber-300 font-bold text-[10px] outline-none text-right font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => updateSketchEntity(ent.id, { height: entH + 5 })}
                      className="px-1 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white text-[9px] font-bold cursor-pointer"
                      title="+5mm"
                    >+</button>
                  </div>
                  <span className="text-[9px] text-slate-400">mm</span>
                </div>

                {/* Angle (deg) */}
                <div className="flex items-center gap-1">
                  <label className="text-[10px] text-slate-400 font-bold">
                    {t12(language, 'Angle:', 'Açı:')}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="360"
                    value={entAngle}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        updateSketchEntity(ent.id, { angleDeg: val });
                      }
                    }}
                    className="w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-amber-300 font-bold text-[10px] outline-none text-right font-mono"
                  />
                  <span className="text-[9px] text-slate-400">°</span>
                </div>
              </>
            )}

            <div className="w-[1px] h-3.5 bg-slate-700" />

            {/* Construction Toggle */}
            <button
              type="button"
              onClick={() => updateSketchEntity(ent.id, { isConstruction: !ent.isConstruction })}
              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                ent.isConstruction
                  ? 'bg-amber-500/30 text-amber-200 border-amber-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title={t12(language, 'Toggle Construction / Reference Line', 'Sanal / Eksen Çizgisi Yap')}
            >
              <span>{ent.isConstruction ? '📏 Ref (Sanal)' : '✏️ Katı (Solid)'}</span>
            </button>

            {/* Delete Entity Button */}
            <button
              type="button"
              onClick={() => deleteSketchEntity(ent.id)}
              className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-white font-bold text-[9px] border border-rose-500/40 transition cursor-pointer flex items-center gap-1"
              title={t12(language, 'Delete Selected Entity (Del)', 'Seçili Nesneyi Sil')}
            >
              <span>🗑️</span>
              <span>{t12(language, 'Delete', 'Sil')}</span>
            </button>

            {/* Close Inspector Button */}
            <button
              type="button"
              onClick={() => selectSketchEntity(null)}
              className="w-5 h-5 rounded hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-[10px] transition cursor-pointer"
              title={t12(language, 'Deselect (Esc)', 'Seçimi Bırak')}
            >
              ✕
            </button>
          </div>
        );
      })()}
    </div>
  )}

      {/* ─── SOLIDWORKS EXTRUDE BOSS & EXTRUDE CUT PROPERTYMANAGER MODAL ─── */}
      {isExtrudeDialogOpen && (
        <div className="absolute top-16 left-4 z-50 w-80 sm:w-96 rounded-[var(--radius-m)] bg-[var(--bg-1)]/98 border-2 border-cyan-500 shadow-[0_20px_60px_rgba(0,0,0,0.95)] text-white font-mono select-none p-4 animate-in fade-in slide-in-from-left-4 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
            <div className="flex items-center gap-2">
              <span className="text-base">🧱</span>
              <div>
                <h4 className="font-bold text-xs text-[var(--ink)] tracking-wider uppercase">
                  {t12(language, 'Extrude & Cut PropertyManager', 'Ekstrüzyon ile Katı & Kesme')}
                </h4>
                <div className="text-[10px] text-cyan-300/90 font-mono">
                  {selectedPart && activeFace ? `${selectedPart.name} • Face: ${activeFace.toUpperCase()}` : t12(language, 'New Solid Part (Ground Grid)', 'Yeni Katı Parça (Zemin Izgarası)')}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={closeExtrudeDialog}
              className="w-5 h-5 rounded hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 flex items-center justify-center text-xs font-bold transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Operation Selector: Extrude, Cut, Revolve, Helix, New Part */}
          <div className="mt-2.5">
            <label className="text-[10px] font-bold text-[var(--alu)] uppercase tracking-wider block mb-1">
              {t12(language, 'Operation Type:', 'İşlem Tipi:')}
            </label>
            <div className="grid grid-cols-4 gap-1 p-0.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)]">
              <button
                type="button"
                onClick={() => setExtrudeDialogConfig({ mode: 'extrude' })}
                className={`py-1 px-1 rounded text-center text-[9.5px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                  extrudeDialogConfig.mode === 'extrude'
                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xs">🧱</span>
                <span>{t12(language, 'Extrude', 'Katı Ekle')}</span>
              </button>
              <button
                type="button"
                onClick={() => setExtrudeDialogConfig({ mode: 'cut' })}
                className={`py-1 px-1 rounded text-center text-[9.5px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                  extrudeDialogConfig.mode === 'cut'
                    ? 'bg-rose-600 text-white font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xs">✂️</span>
                <span>{t12(language, 'Extrude Cut', 'Kesi Yap')}</span>
              </button>
              <button
                type="button"
                onClick={() => setExtrudeDialogConfig({ mode: 'revolve' })}
                className={`py-1 px-1 rounded text-center text-[9.5px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                  extrudeDialogConfig.mode === 'revolve'
                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xs">🔄</span>
                <span>{t12(language, 'Revolve', 'Döndür Katı')}</span>
              </button>
              <button
                type="button"
                onClick={() => setExtrudeDialogConfig({ mode: 'revolve-cut' })}
                className={`py-1 px-1 rounded text-center text-[9.5px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                  extrudeDialogConfig.mode === 'revolve-cut'
                    ? 'bg-orange-600 text-white font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xs">🔃</span>
                <span>{t12(language, 'Revolve Cut', 'Döndür Kes')}</span>
              </button>
              <button
                type="button"
                onClick={() => setExtrudeDialogConfig({ mode: 'helix' })}
                className={`py-1 px-1 rounded text-center text-[9.5px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                  extrudeDialogConfig.mode === 'helix'
                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xs">🌀</span>
                <span>{t12(language, 'Helix Solid', 'Helis Katı')}</span>
              </button>
              <button
                type="button"
                onClick={() => setExtrudeDialogConfig({ mode: 'helix-cut' })}
                className={`py-1 px-1 rounded text-center text-[9.5px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                  extrudeDialogConfig.mode === 'helix-cut'
                    ? 'bg-fuchsia-600 text-white font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xs">🌀✂️</span>
                <span>{t12(language, 'Helix Cut', 'Helis Kes')}</span>
              </button>
              <button
                type="button"
                onClick={() => setExtrudeDialogConfig({ mode: 'new-part' })}
                className={`py-1 px-1 rounded text-center text-[9.5px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer col-span-2 ${
                  extrudeDialogConfig.mode === 'new-part'
                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xs">📦</span>
                <span>{t12(language, 'New Solid Part', 'Ayrı Yeni Parça')}</span>
              </button>
            </div>
          </div>

          {/* ─── SELECTED CONTOURS / PROFILE CHOOSER ─── */}
          {(() => {
            const availableContours = chainAndResolveSketchContours(sketchEntities, sketchPoints, {
              thinWallEnabled: extrudeDialogConfig.thinWallEnabled,
              defaultWallThicknessMm: extrudeDialogConfig.thinWallThickness || 2,
              isConstructionMode,
            });

            if (availableContours.length === 0) return null;

            return (
              <div className="mt-2.5 p-2 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-cyan-500/40 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-cyan-300">
                  <span className="flex items-center gap-1">
                    <span>🎯</span>
                    <span>{t12(language, 'Selected Contours:', 'Seçili Konturlar (Profil Seçimi):')}</span>
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {availableContours.length} {t12(language, 'profiles', 'profil')}
                  </span>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-0.5 pr-0.5">
                  {/* All Contours Option */}
                  <div
                    onClick={() => setExtrudeDialogConfig({ selectedContourId: 'all' })}
                    className={`flex items-center justify-between px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition border ${
                      extrudeDialogConfig.selectedContourId === 'all' || !extrudeDialogConfig.selectedContourId
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1 truncate">
                      <span>🌐</span>
                      <span>{t12(language, 'All Contours', 'Tüm Konturlar')}</span>
                    </div>
                    <span className="text-[8px] text-cyan-400/80">Tümü</span>
                  </div>

                  {/* Individual Contours */}
                  {availableContours.map((c) => {
                    const isSel = extrudeDialogConfig.selectedContourId === c.id;
                    const icon =
                      c.type === 'circle' || c.type === 'circle_2p'
                        ? '⭕'
                        : c.type === 'arc_semi'
                        ? '🌗'
                        : c.type === 'arc' || c.type === 'arc_3p'
                        ? '🏹'
                        : c.type === 'ellipse'
                        ? '🥚'
                        : c.type === 'rect'
                        ? '⬛'
                        : '📐';
                    return (
                      <div
                        key={c.id}
                        className={`flex items-center justify-between px-1.5 py-0.5 rounded text-[8.5px] font-bold border transition ${
                          isSel ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div
                          onClick={() => setExtrudeDialogConfig({ selectedContourId: c.id })}
                          className="flex items-center gap-1.5 truncate cursor-pointer flex-1"
                        >
                          <span>{icon}</span>
                          <span className="truncate">{c.name}</span>
                          {c.wasGapHealed && (
                            <span className="text-[7px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shrink-0">
                              ⚠️ {c.gapSize}mm kapandı
                            </span>
                          )}
                          {c.isOpenProfile && (
                            <span className="text-[7px] px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30 shrink-0">
                              İnce Unsur
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              applyExtrudeOrCut({ mode: 'extrude', selectedContourId: c.id });
                            }}
                            className="px-1 py-0.2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[7.5px] font-black cursor-pointer shadow-sm"
                            title={t12(language, 'Extrude only this contour', 'Yalnızca bu konturdan katı oluştur')}
                          >
                            🧱 Katı
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              applyExtrudeOrCut({ mode: 'cut', selectedContourId: c.id });
                            }}
                            className="px-1 py-0.2 rounded bg-rose-600 hover:bg-rose-500 text-white text-[7.5px] font-black cursor-pointer shadow-sm"
                            title={t12(language, 'Cut only this contour', 'Yalnızca bu konturdan kesi yap')}
                          >
                            ✂️ Kes
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* PARAMETERS SECTION ACCORDING TO MODE */}
          {/* A. Extrude Depth for Extrude / Cut / New Part */}
          {(extrudeDialogConfig.mode === 'extrude' ||
            extrudeDialogConfig.mode === 'cut' ||
            extrudeDialogConfig.mode === 'new-part') && (
            <div className="mt-2.5 space-y-1">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-[var(--alu)] font-bold">
                  {t12(language, 'Extrude Depth (d):', 'Ekstrüzyon Derinliği (d):')}
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={extrudeDialogConfig.depth}
                    onChange={(e) => setExtrudeDialogConfig({ depth: Math.max(1, Number(e.target.value)) })}
                    className="w-14 bg-slate-900 border border-cyan-500/60 text-cyan-300 font-bold text-center text-xs rounded px-1 py-0.2 focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">mm</span>
                </div>
              </div>

              <input
                type="range"
                min={1}
                max={150}
                step={1}
                value={extrudeDialogConfig.depth}
                onChange={(e) => setExtrudeDialogConfig({ depth: Number(e.target.value) })}
                className="w-full accent-[var(--cyan)] cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />

              <div className="flex items-center justify-between pt-0.5">
                {[5, 10, 20, 30, 50, 100].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setExtrudeDialogConfig({ depth: d })}
                    className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold border transition ${
                      extrudeDialogConfig.depth === d
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}mm
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* B. Revolve Parameters (Angle & Axis) */}
          {(extrudeDialogConfig.mode === 'revolve' || extrudeDialogConfig.mode === 'revolve-cut') && (
            <div className="mt-2.5 p-2 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-amber-500/40 space-y-1.5">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-amber-300 font-bold">
                  {t12(language, 'Revolve Angle (θ):', 'Döndürme Açısı (θ):')}
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={360}
                    value={extrudeDialogConfig.revolveAngle || 360}
                    onChange={(e) => setExtrudeDialogConfig({ revolveAngle: Math.min(360, Math.max(1, Number(e.target.value))) })}
                    className="w-14 bg-slate-900 border border-amber-500/60 text-amber-300 font-bold text-center text-xs rounded px-1 py-0.2 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">°</span>
                </div>
              </div>

              <input
                type="range"
                min={1}
                max={360}
                step={5}
                value={extrudeDialogConfig.revolveAngle || 360}
                onChange={(e) => setExtrudeDialogConfig({ revolveAngle: Number(e.target.value) })}
                className="w-full accent-[var(--cyan)] cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />

              <div className="flex items-center justify-between pt-0.5">
                {[90, 180, 270, 360].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => setExtrudeDialogConfig({ revolveAngle: deg })}
                    className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold border transition ${
                      extrudeDialogConfig.revolveAngle === deg
                        ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* C. Helix Parameters (Pitch, Turns, Radius) */}
          {(extrudeDialogConfig.mode === 'helix' || extrudeDialogConfig.mode === 'helix-cut') && (
            <div className="mt-2.5 p-2 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-purple-500/40 space-y-1.5">
              <div className="text-[10px] text-purple-300 font-bold flex items-center gap-1">
                <span>🌀</span>
                <span>{t12(language, 'Helical Path Parameters:', 'Helis Parametreleri (Vida / Yay):')}</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                <div>
                  <label className="text-[8.5px] text-slate-400 block">{t12(language, 'Pitch P (mm)', 'Adım P (mm)')}</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={extrudeDialogConfig.helixPitch || 10}
                    onChange={(e) => setExtrudeDialogConfig({ helixPitch: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-slate-900 border border-purple-500/50 text-purple-200 font-bold text-center text-[10px] rounded px-1 py-0.5"
                  />
                </div>
                <div>
                  <label className="text-[8.5px] text-slate-400 block">{t12(language, 'Turns N', 'Tur Sayısı N')}</label>
                  <input
                    type="number"
                    min={0.5}
                    max={20}
                    step={0.5}
                    value={extrudeDialogConfig.helixTurns || 3}
                    onChange={(e) => setExtrudeDialogConfig({ helixTurns: Math.max(0.5, Number(e.target.value)) })}
                    className="w-full bg-slate-900 border border-purple-500/50 text-purple-200 font-bold text-center text-[10px] rounded px-1 py-0.5"
                  />
                </div>
                <div>
                  <label className="text-[8.5px] text-slate-400 block">{t12(language, 'Radius R (mm)', 'Yarıçap R (mm)')}</label>
                  <input
                    type="number"
                    min={5}
                    max={150}
                    value={extrudeDialogConfig.helixRadius || 25}
                    onChange={(e) => setExtrudeDialogConfig({ helixRadius: Math.max(2, Number(e.target.value)) })}
                    className="w-full bg-slate-900 border border-purple-500/50 text-purple-200 font-bold text-center text-[10px] rounded px-1 py-0.5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* D. DRAFT ANGLE (KALIP ÇIKMA / AÇILI OLUŞTURMA & KESME) */}
          <div className="mt-2.5 p-2 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] space-y-1">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(extrudeDialogConfig.draftAngle || 0) > 0}
                  onChange={(e) => setExtrudeDialogConfig({ draftAngle: e.target.checked ? 5 : 0 })}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                />
                <span className="text-[10px] text-cyan-300 font-bold">
                  📐 {t12(language, 'Draft Angle (Taper / Açılı Kesim & Katı)', 'Kalıp Çıkma Açısı / Eğim (Draft)')}
                </span>
              </label>
              {(extrudeDialogConfig.draftAngle || 0) > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setExtrudeDialogConfig({
                      draftDirection: extrudeDialogConfig.draftDirection === 'outward' ? 'inward' : 'outward',
                    })
                  }
                  className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-slate-800 text-cyan-300 border border-slate-700 cursor-pointer"
                >
                  {extrudeDialogConfig.draftDirection === 'outward' ? 'Dışa ↗' : 'İçe ↘'}
                </button>
              )}
            </div>

            {(extrudeDialogConfig.draftAngle || 0) > 0 && (
              <div className="pt-1 flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={45}
                  value={extrudeDialogConfig.draftAngle || 5}
                  onChange={(e) => setExtrudeDialogConfig({ draftAngle: Number(e.target.value) })}
                  className="flex-1 accent-[var(--cyan)] cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] font-bold text-cyan-300 font-mono w-8 text-right">
                  {extrudeDialogConfig.draftAngle}°
                </span>
                <div className="flex items-center gap-0.5">
                  {[1, 3, 5, 10, 15].map((ang) => (
                    <button
                      key={ang}
                      type="button"
                      onClick={() => setExtrudeDialogConfig({ draftAngle: ang })}
                      className={`px-1 py-0.2 rounded text-[8px] font-bold ${
                        extrudeDialogConfig.draftAngle === ang ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {ang}°
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* E. THIN FEATURE (ÇİZGİYE ET KALINLIĞI VEREREK KATI / KESME) */}
          <div className="mt-2 p-2 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] space-y-1">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={extrudeDialogConfig.thinWallEnabled || false}
                  onChange={(e) => setExtrudeDialogConfig({ thinWallEnabled: e.target.checked })}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-[10px] text-emerald-300 font-bold">
                  📏 {t12(language, 'Thin Feature (Wall Thickness from Single Line)', 'Çizgiye Et Kalınlığı Ver (Thin Feature)')}
                </span>
              </label>
              {extrudeDialogConfig.thinWallEnabled && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0.5}
                    max={50}
                    step={0.5}
                    value={extrudeDialogConfig.thinWallThickness || 2}
                    onChange={(e) => setExtrudeDialogConfig({ thinWallThickness: Math.max(0.2, Number(e.target.value)) })}
                    className="w-11 bg-slate-900 border border-emerald-500/60 text-emerald-300 font-bold text-center text-[9.5px] rounded px-1 py-0.2"
                  />
                  <span className="text-[9px] text-slate-400">mm</span>
                </div>
              )}
            </div>
            {extrudeDialogConfig.thinWallEnabled && (
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[8px] text-slate-400">
                  {t12(language, 'Extrudes walls/ribs or cuts slots from open single lines/arcs', 'Tek çizgi veya açık yaylardan duvar ve kanal kesiği üretir')}
                </span>
                <div className="flex items-center gap-0.5">
                  {[1, 1.5, 2, 3, 5].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setExtrudeDialogConfig({ thinWallThickness: t })}
                      className={`px-1 py-0.2 rounded text-[8px] font-bold ${
                        extrudeDialogConfig.thinWallThickness === t ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {t}mm
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Direction & Cut Options */}
          <div className="mt-2.5 pt-2 border-t border-[var(--line)] space-y-1.5">
            {/* Direction Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] text-slate-300 font-bold">
                {t12(language, 'Direction:', 'Yön:')}
              </span>
              <button
                type="button"
                onClick={() =>
                  setExtrudeDialogConfig({
                    direction: extrudeDialogConfig.direction === 'inward' ? 'outward' : 'inward',
                  })
                }
                className="px-2 py-0.5 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-[9.5px] font-bold text-cyan-300 transition flex items-center gap-1 cursor-pointer"
              >
                <span>⇄</span>
                <span>
                  {extrudeDialogConfig.direction === 'inward'
                    ? t12(language, 'Inward (⇣)', 'İçeriye Doğru (⇣)')
                    : t12(language, 'Outward (⇡)', 'Dışarıya Doğru (⇡)')}
                </span>
              </button>
            </div>

            {/* If Cut: Through All Option */}
            {(extrudeDialogConfig.mode === 'cut' ||
              extrudeDialogConfig.mode === 'revolve-cut' ||
              extrudeDialogConfig.mode === 'helix-cut') && (
              <label className="flex items-center gap-1.5 pt-0.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={extrudeDialogConfig.isThroughAll || false}
                  onChange={(e) =>
                    setExtrudeDialogConfig({
                      isThroughAll: e.target.checked,
                      depth: e.target.checked ? 500 : 20,
                    })
                  }
                  className="rounded border-slate-700 text-rose-500 focus:ring-rose-500 cursor-pointer"
                />
                <span className="text-[9.5px] text-rose-300 font-bold">
                  {t12(language, 'Through All (Boydan Boya Tam Kesim)', 'Tümünden Kes (Boydan Boya Kesim)')}
                </span>
              </label>
            )}

            {/* Re-usable Sketch Option */}
            <label className="flex items-start gap-1.5 cursor-pointer pt-0.5">
              <input
                type="checkbox"
                checked={keepSketchAfterExtrude}
                onChange={(e) => setKeepSketchAfterExtrude(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-[9.5px] text-cyan-300 font-bold">
                  {t12(language, 'Keep Sketch (Re-use for Both Solid & Cut)', 'Çizimi Yüzeyde Koru (Hem Katı Hem Kesi İçin Tekrar Kullan)')}
                </span>
              </div>
            </label>
          </div>

          {/* Modal Action Buttons */}
          <div className="mt-3 pt-2.5 border-t border-[var(--line)] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeExtrudeDialog}
              className="px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-slate-300 font-bold text-[10px] transition cursor-pointer"
            >
              {t12(language, 'Cancel', 'İptal')}
            </button>
            <button
              type="button"
              onClick={() => {
                applyExtrudeOrCut();
              }}
              className={`px-3.5 py-1 rounded-[var(--radius-s)] font-black text-[10.5px] shadow transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                extrudeDialogConfig.mode === 'cut' ||
                extrudeDialogConfig.mode === 'revolve-cut' ||
                extrudeDialogConfig.mode === 'helix-cut'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white '
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white '
              }`}
            >
              <span>✔</span>
              <span>
                {extrudeDialogConfig.mode === 'cut'
                  ? t12(language, 'Apply Cut', 'Kesi Oluştur')
                  : extrudeDialogConfig.mode === 'revolve-cut'
                  ? t12(language, 'Apply Revolve Cut', 'Döndürerek Kes')
                  : extrudeDialogConfig.mode === 'helix-cut'
                  ? t12(language, 'Apply Helix Cut', 'Helis Kes')
                  : extrudeDialogConfig.mode === 'revolve'
                  ? t12(language, 'Apply Revolve', 'Döndürerek Katı')
                  : extrudeDialogConfig.mode === 'helix'
                  ? t12(language, 'Apply Helix Solid', 'Helis Katı Oluştur')
                  : extrudeDialogConfig.mode === 'new-part'
                  ? t12(language, 'Create Solid Part', 'Yeni Parça Oluştur')
                  : t12(language, 'Extrude Boss', 'Katıyı Oluştur')}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ─── BLENDER-STYLE SCULPT & ORGANIC SURFACE STUDIO FLOATING HUD ─── */}
      {isSculptMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-[var(--radius-m)] border border-fuchsia-500/70 bg-[var(--bg-1)]/98 shadow-[0_12px_45px_rgba(0,0,0,0.92)] font-mono text-xs text-white select-none animate-in fade-in slide-in-from-top-2 duration-150 max-w-[95vw]">
          {/* Header Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-s)] bg-fuchsia-500/20 text-fuchsia-300 font-bold text-[10px] border border-fuchsia-500/40">
            <span>🎨 {t12(language, 'SCULPT & SURFACE STUDIO', 'HEYKEL & YÜZEY STUDIOSU')}</span>
          </div>

          <div className="text-[10px] text-slate-300 font-mono truncate max-w-[120px]">
            {selectedPart?.name || t12(language, 'Select a part', 'Parça seçin')}
          </div>

          <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />

          {/* Brush Selector */}
          <div className="flex items-center gap-0.5 bg-[var(--bg-2)] p-0.5 rounded-[var(--radius-s)] border border-[var(--line)]">
            {[
              { id: 'clay' as const, label: '🏺 Kil', title: 'Clay Brush' },
              { id: 'draw' as const, label: '✏️ Çizgi', title: 'Draw Brush' },
              { id: 'inflate' as const, label: '🎈 Şişir', title: 'Inflate Brush' },
              { id: 'smooth' as const, label: '🌊 Düzle', title: 'Smooth Brush' },
              { id: 'pinch' as const, label: '🤏 Çimdik', title: 'Pinch Brush' },
              { id: 'flatten' as const, label: '🔨 Yassı', title: 'Flatten Brush' },
              { id: 'grab' as const, label: '✋ Tut-Çek', title: 'Grab Brush' },
            ].map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSculptBrush(b.id)}
                className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9.5px] font-bold transition-all cursor-pointer ${
                  sculptBrush === b.id
                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={b.title}
              >
                {b.label}
              </button>
            ))}
          </div>

          <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />

          {/* Radius & Strength */}
          <div className="flex items-center gap-2 text-[9.5px]">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">R:</span>
              <input
                type="range"
                min={5}
                max={100}
                value={sculptRadius}
                onChange={(e) => setSculptRadius(Number(e.target.value))}
                className="w-16 accent-[var(--cyan)] cursor-pointer"
              />
              <span className="text-fuchsia-300 font-mono w-6 text-right">{sculptRadius}</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-400">Kuvvet:</span>
              <input
                type="range"
                min={0.05}
                max={1.0}
                step={0.05}
                value={sculptStrength}
                onChange={(e) => setSculptStrength(Number(e.target.value))}
                className="w-14 accent-[var(--cyan)] cursor-pointer"
              />
              <span className="text-fuchsia-300 font-mono w-6 text-right">{Math.round(sculptStrength * 100)}%</span>
            </div>
          </div>

          {/* Add / Sub Direction */}
          <button
            type="button"
            onClick={() => setSculptDirection(sculptDirection === 'add' ? 'sub' : 'add')}
            className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9.5px] font-bold border transition cursor-pointer ${
              sculptDirection === 'add'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
            }`}
            title="Sculpt Stroke Direction (Add vs Sub)"
          >
            {sculptDirection === 'add' ? '+ Ekle' : '- Oy (Sub)'}
          </button>

          {/* X Symmetry */}
          <button
            type="button"
            onClick={() => setSculptSymmetry(!sculptSymmetry)}
            className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9.5px] font-bold border transition cursor-pointer ${
              sculptSymmetry
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-[var(--bg-2)] border-[var(--line)] text-slate-400 hover:text-white'
            }`}
            title="X-Axis Mirror Symmetry"
          >
            🪞 X-Simetri
          </button>

          {/* Subdivide Mesh Button */}
          {selectedPart && (
            <button
              type="button"
              onClick={() => subdivideSelectedPartMesh()}
              className="px-2.5 py-0.5 rounded-[var(--radius-s)] bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-[9.5px] shadow transition flex items-center gap-1 cursor-pointer active:scale-95"
              title="Üçgenleri 4'e böler ve mesh çözünürlüğünü katlar (Blender DynTopo/Multiresolution)"
            >
              <span>🌐</span>
              <span>{t12(language, 'Subdivide Mesh (4x)', 'Alt-Bölümle (4x)')}</span>
            </button>
          )}

          {/* Exit Sculpt Mode */}
          <button
            type="button"
            onClick={() => {
              useDesignStore.getState().setStudioMode('object');
              useDesignStore.getState().setActiveWorkbench('cad');
            }}
            className="w-5 h-5 rounded-[var(--radius-s)] bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition flex items-center justify-center font-bold text-[10px] cursor-pointer ml-1"
            title={t12(language, 'Exit Sculpt Mode (Esc)', 'Heykel Modundan Çık (Esc)')}
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── INVENTOR IN-PLACE PART EDITING VIEWPORT HUD ─── */}
      {editingPartId && subAssemblies && subAssemblies.length > 0 && (
        <div className="absolute top-20 left-4 z-40 px-3 py-1.5 rounded-[var(--radius-m)] bg-[var(--bg-1)]/95 border border-amber-500/60 shadow-[0_8px_30px_rgba(0,0,0,0.85)] font-mono text-xs text-white select-none animate-in fade-in duration-150 flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>🔧 {t12(language, 'EDITING PART:', 'DÜZENLENEN PARÇA:')}</span>
            <span className="text-white bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
              {parts.find((p) => p.id === editingPartId)?.name || 'Part'}
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-slate-700 mx-1" />

          {/* Quick Sketch Button */}
          <button
            type="button"
            onClick={() => {
              const store = useDesignStore.getState();
              store.select(editingPartId);
              store.setTool('sketch-add');
            }}
            className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 font-bold text-[9.5px] border border-emerald-500/30 transition flex items-center gap-1 cursor-pointer"
            title={t12(language, 'Start Sketch on Part', 'Parça Üzerinde Yeni Çizim Aç')}
          >
            <span>✏️</span>
            <span>{t12(language, 'Sketch', 'Çizim')}</span>
          </button>

          {/* Quick Hole Wizard Button */}
          <button
            type="button"
            onClick={() => {
              const store = useDesignStore.getState();
              store.select(editingPartId);
              store.setFacePickMode(true);
            }}
            className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 font-bold text-[9.5px] border border-cyan-500/30 transition flex items-center gap-1 cursor-pointer"
            title={t12(language, 'Add Hole (Click surface)', 'Delik Ekle (Yüzeye tıkla)')}
          >
            <span>🕳️</span>
            <span>{t12(language, 'Hole Wizard', 'Delik Sihirbazı')}</span>
          </button>

          {/* Finish & Return to Assembly */}
          <button
            type="button"
            onClick={() => {
              useDesignStore.getState().setEditingPartId(null);
            }}
            className="ml-1 px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[9.5px] transition flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
            title={t12(language, 'Return to Assembly (Esc)', 'Montaja Dön (Esc)')}
          >
            <span>✔</span>
            <span>{t12(language, 'Finish Edit (Esc)', 'Düzenlemeyi Bitir (Esc)')}</span>
          </button>
        </div>
      )}

      {/* ─── INSTANT MATE SUCCESS TOAST ─── */}
      {lastMatedInfo && !selectedMateId && (Date.now() - lastMatedInfo.time < 3000) && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-full bg-emerald-950/95 border border-emerald-400 text-emerald-300 font-mono text-xs font-bold flex items-center gap-2 select-none animate-in fade-in slide-in-from-top-2 duration-150">
          <span className="text-sm">🎉</span>
          <span>
            {t12(language, 'Mated:', 'Montajlandı:')}{' '}
            <strong className="text-white">{lastMatedInfo.partAName}</strong> ↔ <strong className="text-white">{lastMatedInfo.partBName}</strong> ({lastMatedInfo.kind.toUpperCase()})
          </span>
          <button
            type="button"
            onClick={() => setLastMatedInfo(null)}
            className="ml-1 w-4 h-4 rounded-full hover:bg-emerald-900 flex items-center justify-center text-[10px] cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── SOLIDWORKS IN-CONTEXT FLOATING MATE QUICK-BAR (TOP-16 VIEWPORT CENTER) ─── */}
      {(() => {
        const activeMate = mates.find((m) => m.id === selectedMateId) || (lastMatedInfo ? mates.find((m) => m.id === lastMatedInfo.mateId) : null);
        if (!activeMate) return null;

        const partA = parts.find((p) => p.id === activeMate.partAId);
        const partB = parts.find((p) => p.id === activeMate.partBId);

        return (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-[var(--radius-m)] border border-cyan-500/70 bg-[var(--bg-1)]/95 shadow-[0_12px_45px_rgba(0,0,0,0.92)] font-mono text-xs text-white select-none animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Mate Title Badge */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-s)] bg-cyan-500/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/40">
              <span>📎 {activeMate.kind.toUpperCase()}</span>
            </div>

            <div className="text-[10px] text-slate-300 font-mono truncate max-w-[140px] sm:max-w-[200px]">
              {partA?.name || 'A'} ↔ {partB?.name || 'B'}
            </div>

            {/* Mate Kind Quick Switcher */}
            <div className="flex items-center gap-0.5 bg-[var(--bg-2)] p-0.5 rounded-[var(--radius-s)] border border-[var(--line)]">
              {(['coincident', 'concentric', 'parallel', 'perpendicular', 'tangent', 'distance'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => updateMateKind(activeMate.id, k)}
                  className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9.5px] font-bold transition-all cursor-pointer ${
                    activeMate.kind === k
                      ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={`${k.toUpperCase()} Mate`}
                >
                  {k === 'coincident' ? '⫽ Çakışık' : k === 'concentric' ? '◎ Eşmerkezli' : k === 'parallel' ? '∥ Paralel' : k === 'perpendicular' ? '⟂ Dik' : k === 'tangent' ? '⤢ Teğet' : '📏 Mesafe'}
                </button>
              ))}
            </div>

            {/* Direction Flip */}
            <button
              type="button"
              onClick={() => toggleMateFlip(activeMate.id)}
              className={`px-2 py-0.5 rounded-[var(--radius-s)] text-[9px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                activeMate.flip
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-[var(--bg-2)] border-[var(--line)] text-slate-300 hover:text-white'
              }`}
              title={t12(language, 'Flip Alignment (⇄)', 'Hizalamayı Ters Çevir (⇄)')}
            >
              <span>⇄</span>
              <span>{t12(language, 'Flip', 'Ters')}</span>
            </button>

            {/* Distance Offset Adjuster (if distance mate) */}
            {activeMate.kind === 'distance' && (
              <div className="flex items-center gap-1 pl-1 border-l border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => updateMateOffset(activeMate.id, Math.max(0, (activeMate.offset || 0) - 5))}
                  className="w-4 h-4 flex items-center justify-center rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-slate-300 font-bold text-[10px] cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  value={activeMate.offset || 0}
                  onChange={(e) => updateMateOffset(activeMate.id, Number(e.target.value))}
                  className="w-12 bg-slate-900 border border-slate-700 text-cyan-300 font-bold text-center text-[10px] rounded px-1 py-0.5 focus:outline-none focus:border-cyan-400"
                />
                <span className="text-[10px] text-slate-400">mm</span>
                <button
                  type="button"
                  onClick={() => updateMateOffset(activeMate.id, (activeMate.offset || 0) + 5)}
                  className="w-4 h-4 flex items-center justify-center rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-slate-300 font-bold text-[10px] cursor-pointer"
                >
                  +
                </button>
              </div>
            )}

            {/* Confirm Checkmark Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedMateId(null);
                setLastMatedInfo(null);
                // Keep ready for consecutive mating:
                useDesignStore.getState().openMateModal();
              }}
              className="px-2.5 py-0.5 rounded-[var(--radius-s)] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9.5px] shadow transition flex items-center gap-1 cursor-pointer"
              title={t12(language, 'Done (Enter) - Ready for next mate', 'Tamamla (Enter) - Sonraki montaja hazır')}
            >
              <span>✔</span>
              <span>{t12(language, 'Done', 'Tamam')}</span>
            </button>

            {/* Delete Mate */}
            <button
              type="button"
              onClick={() => {
                removeMate(activeMate.id);
                setSelectedMateId(null);
                setLastMatedInfo(null);
              }}
              className="w-5 h-5 rounded-[var(--radius-s)] bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition flex items-center justify-center font-bold text-[10px] cursor-pointer"
              title={t12(language, 'Delete Mate', 'Montaj İlişkisini Sil')}
            >
              ✕
            </button>
          </div>
        );
      })()}

      {/* ─── EMPTY STATE HELPER OVERLAY (When parts array is empty) ─── */}
      {parts.length === 0 && !isSketchMode && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4 z-20">
          <div className="pointer-events-auto max-w-sm w-full p-5 rounded-[var(--radius-m)] bg-[var(--bg-1)]/95 border border-[var(--cyan)]/40 shadow-2xl text-center space-y-3 font-mono">
            <div className="w-10 h-10 rounded-lg bg-[var(--cyan)]/10 border border-[var(--cyan)]/30 flex items-center justify-center mx-auto text-[var(--cyan)]">
              <span className="text-xl">📐</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--ink)] uppercase">
                {t12(language, '3D CAD Workspace Ready', '3D CAD Çalışma Alanı Hazır')}
              </h3>
              <p className="text-[11px] text-[var(--alu-dim)] mt-1">
                {t12(
                  language,
                  'Add a standard 3D solid or import STEP / STL files to start modeling.',
                  'Modellemeye başlamak için 3D katı şekil ekleyin veya STEP / STL dosyası yükleyin.'
                )}
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  useDesignStore.getState().addPart('box');
                }}
                className="w-full py-2 px-3 rounded-[var(--radius-s)] bg-[var(--cyan)] hover:bg-[var(--cyan-dim)] text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>+ {t12(language, 'Add 3D Solid (Box)', '3D Katı Model Ekle (Kutu)')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  useDesignStore.getState().loadDemoAssemblyWithFasteners();
                }}
                className="w-full py-2 px-3 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-[var(--ink)] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>⚡ {t12(language, 'Load Demo Flange Assembly', 'Örnek Flanş Montajını Yükle')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── INDUSTRIAL 3D STUDIO CONTEXT / MARKING MENU ─── */}
      {contextMenu3D && (
        <DesignContextMenu
          x={contextMenu3D.x}
          y={contextMenu3D.y}
          partId={contextMenu3D.partId}
          clickedFeature={contextMenu3D.clickedFeature}
          onClose={() => setContextMenu3D(null)}
          onSetCameraView={(view) => {
            cameraDispatcherRef.current?.(view);
            setContextMenu3D(null);
          }}
          onFocusPart={(part) => {
            cameraDispatcherRef.current?.({ type: 'focus', part });
            setContextMenu3D(null);
          }}
        />
      )}
    </div>
  );
}

export default DesignViewport;
