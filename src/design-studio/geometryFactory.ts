'use client';

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Evaluator, Brush, SUBTRACTION } from 'three-bvh-csg';
import { DesignPart, customCADGeometries, useDesignStore, Point2D } from './designStore';
import { loadCADGeometry } from './cadGeometryStorage';
import { ISO_METRIC_HOLES, type HoleItem, type SurfaceFace, type SurfaceCutItem } from './holeStandards';
import { getTSlotSpec, buildTSlotSection } from '@/cad/catalog/tSlotProfiles';
import { type ProfileLoop, edgeStart } from '@/cad/geometry/profileLoop';
import {
  calculateInvoluteGearSpecs,
  generateExternalGearContour,
  generateInternalGearContour,
  generateBoreAndKeywayContour,
  type Point2D as GearPoint2D,
} from '@/engines/math/gear-involute-factory';
import { generateSprocketContour, calculateSprocketSpecs } from '@/engines/math/sprocket-geometry-factory';
import { generateTimingPulleyContour, calculatePulleySpecs, type PulleyProfileType } from '@/engines/math/pulley-geometry-factory';
import { createDriveLoop } from '@/engines/math/drive-loop-engine';


// Revolve Solid Generator (Lathe / Axis-Symmetric Revolve)
export function createRevolveGeometry(pts: Point2D[], angleDeg = 360, axisOffset = 0): THREE.BufferGeometry {
  if (!pts || pts.length < 2) return new THREE.BufferGeometry();

  const angle = ((angleDeg || 360) * Math.PI) / 180;
  const segments = Math.max(12, Math.round((angleDeg / 360) * 48));
  const off = (axisOffset || 0) / 10;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const N = pts.length;
  const S = segments;

  for (let s = 0; s <= S; s++) {
    const theta = (s / S) * angle;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    for (let i = 0; i < N; i++) {
      const origX = pts[i].x / 10 + off;
      const origY = pts[i].y / 10;

      const x = origX * cosT;
      const y = origY;
      const z = origX * sinT;

      positions.push(x, y, z);
      uvs.push(s / S, i / (N - 1));
    }
  }

  for (let s = 0; s < S; s++) {
    for (let i = 0; i < N - 1; i++) {
      const a = s * N + i;
      const b = s * N + (i + 1);
      const c = (s + 1) * N + (i + 1);
      const d = (s + 1) * N + i;

      indices.push(a, b, c);
      indices.push(a, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

// Loft Solid Generator (Morphing / Tapered Loft)
export function createLoftGeometry(pts: Point2D[], heightMm = 40, topScale = 0.5, twistDeg = 0): THREE.BufferGeometry {
  const H = (heightMm || 40) / 10;
  const N = pts.length;
  if (N < 3) return new THREE.BufferGeometry();

  const twist = ((twistDeg || 0) * Math.PI) / 180;
  const numSteps = 16;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let s = 0; s <= numSteps; s++) {
    const t = s / numSteps;
    const curH = t * H;
    const curScale = 1.0 - t * (1.0 - topScale);
    const curAngle = t * twist;
    const cosA = Math.cos(curAngle);
    const sinA = Math.sin(curAngle);

    for (let i = 0; i < N; i++) {
      const origX = (pts[i].x / 10) * curScale;
      const origZ = (pts[i].y / 10) * curScale;

      const x = origX * cosA - origZ * sinA;
      const z = origX * sinA + origZ * cosA;

      positions.push(x, curH - H / 2, z);
      uvs.push(t, i / N);
    }
  }

  for (let s = 0; s < numSteps; s++) {
    for (let i = 0; i < N; i++) {
      const nextI = (i + 1) % N;
      const a = s * N + i;
      const b = s * N + nextI;
      const c = (s + 1) * N + nextI;
      const d = (s + 1) * N + i;

      indices.push(a, b, c);
      indices.push(a, c, d);
    }
  }

  const shape = new THREE.Shape();
  shape.moveTo(pts[0].x / 10, pts[0].y / 10);
  for (let i = 1; i < N; i++) {
    shape.lineTo(pts[i].x / 10, pts[i].y / 10);
  }
  shape.closePath();
  const capGeom = new THREE.ShapeGeometry(shape);
  const capPos = capGeom.attributes.position;
  const capIndices = capGeom.index?.array || [];

  const bottomOffset = positions.length / 3;
  for (let i = 0; i < capPos.count; i++) {
    positions.push(capPos.getX(i), -H / 2, capPos.getY(i));
    uvs.push(0, 0);
  }
  for (let i = 0; i < capIndices.length; i += 3) {
    indices.push(bottomOffset + capIndices[i], bottomOffset + capIndices[i + 2], bottomOffset + capIndices[i + 1]);
  }

  if (topScale > 0.01) {
    const topOffset = positions.length / 3;
    const cosT = Math.cos(twist);
    const sinT = Math.sin(twist);
    for (let i = 0; i < capPos.count; i++) {
      const origX = capPos.getX(i) * topScale;
      const origZ = capPos.getY(i) * topScale;
      const x = origX * cosT - origZ * sinT;
      const z = origX * sinT + origZ * cosT;
      positions.push(x, H / 2, z);
      uvs.push(1, 1);
    }
    for (let i = 0; i < capIndices.length; i += 3) {
      indices.push(topOffset + capIndices[i], topOffset + capIndices[i + 1], topOffset + capIndices[i + 2]);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

// Helix Solid & Cut Generator (Coil / Spring / Thread Flute)
export function createHelixGeometry(
  pts: Point2D[],
  pitchMm = 10,
  turns = 3,
  helixRadiusMm = 25
): THREE.BufferGeometry {
  const pitch = (pitchMm || 10) / 10;
  const numTurns = Math.max(0.5, turns || 3);
  const R = Math.max(0.5, (helixRadiusMm || 25) / 10);

  let sectionR = 0.2; // default ~2mm
  if (pts && pts.length >= 2) {
    let maxDist = 0;
    pts.forEach((pt) => {
      const d = Math.sqrt(pt.x * pt.x + pt.y * pt.y) / 10;
      if (d > maxDist) maxDist = d;
    });
    if (maxDist > 0.05) sectionR = Math.min(R * 0.8, maxDist);
  }

  class HelixCurve extends THREE.Curve<THREE.Vector3> {
    constructor(public r: number, public p: number, public tCount: number) {
      super();
    }
    getPoint(t: number, optionalTarget = new THREE.Vector3()) {
      const angle = t * Math.PI * 2 * this.tCount;
      const x = this.r * Math.cos(angle);
      const z = this.r * Math.sin(angle);
      const y = (t - 0.5) * this.p * this.tCount;
      return optionalTarget.set(x, y, z);
    }
  }

  const path = new HelixCurve(R, pitch, numTurns);
  const tubularSegments = Math.max(64, Math.round(numTurns * 36));
  const radialSegments = 16;
  const geom = new THREE.TubeGeometry(path, tubularSegments, sectionR, radialSegments, false);
  geom.computeVertexNormals();
  return geom;
}

// Helper to apply metric holes and surface cuts to 2D extrusion shapes
export function applyHolesAndCutsToShape(shape: THREE.Shape, holes: HoleItem[] = [], p: Record<string, any> = {}) {
  if (holes && holes.length > 0) {
    holes.forEach((h) => {
      const std = ISO_METRIC_HOLES.find((s) => s.size === h.size) || {
        nominalDiameter: 6,
        counterboreDiameter: 10,
        tapDrillDiameter: 5,
        clearanceMedium: 6.6,
      };
      const dia = std.nominalDiameter;
      const r = (dia / 10) / 2;
      if (r > 0.02) {
        const holePath = new THREE.Path();
        holePath.absarc(h.x / 10, h.y / 10, r, 0, Math.PI * 2, true);
        shape.holes.push(holePath);
      }
    });
  }

  // Surface cuts / pockets
  if (p && p.hasSurfaceCut) {
    const cutType = String(p.cutType || '');
    if (cutType === 'rect') {
      const cutW = (p.cutWidth || 30) / 10;
      const cutL = (p.cutLength || 40) / 10;
      const ox = (p.cutOffsetX || 0) / 10;
      const oy = (p.cutOffsetY || 0) / 10;
      const pocketPath = new THREE.Path();
      pocketPath.moveTo(ox - cutW / 2, oy - cutL / 2);
      pocketPath.lineTo(ox + cutW / 2, oy - cutL / 2);
      pocketPath.lineTo(ox + cutW / 2, oy + cutL / 2);
      pocketPath.lineTo(ox - cutW / 2, oy + cutL / 2);
      pocketPath.closePath();
      shape.holes.push(pocketPath);
    } else if (cutType === 'circle') {
      const cutR = ((p.cutDiameter || 25) / 2) / 10;
      const ox = (p.cutOffsetX || 0) / 10;
      const oy = (p.cutOffsetY || 0) / 10;
      const circPath = new THREE.Path();
      circPath.absarc(ox, oy, cutR, 0, Math.PI * 2, true);
      shape.holes.push(circPath);
    } else if (cutType === 'slot') {
      const sl = (p.cutLength || 50) / 10;
      const sw = (p.cutWidth || 12) / 10;
      const ox = (p.cutOffsetX || 0) / 10;
      const oy = (p.cutOffsetY || 0) / 10;
      const slotPath = new THREE.Path();
      slotPath.moveTo(ox - sl / 2, oy - sw / 2);
      slotPath.lineTo(ox + sl / 2, oy - sw / 2);
      slotPath.lineTo(ox + sl / 2, oy + sw / 2);
      slotPath.lineTo(ox - sl / 2, oy + sw / 2);
      slotPath.closePath();
      shape.holes.push(slotPath);
    }
  }
}

/**
 * Performs robust manifold 3D CSG boolean subtraction for multi-face holes and pocket cuts
 */
export function applyCSGHolesAndCuts(
  baseGeom: THREE.BufferGeometry,
  part: DesignPart,
  holes: HoleItem[] = [],
  cuts: SurfaceCutItem[] = []
): THREE.BufferGeometry {
  const p = part.params || {};
  const allHoles = [...(holes || []), ...(part.holes || [])];
  const uniqueHoles = Array.from(new Map(allHoles.map((h) => [h.id, h])).values());

  const allCuts = [...(cuts || []), ...(part.cuts || [])];
  if (p && p.hasSurfaceCut) {
    allCuts.push({
      id: 'legacy-surface-cut',
      type: p.cutType || 'rect',
      face: p.cutFace || 'top',
      x: p.cutOffsetX || 0,
      y: p.cutOffsetY || 0,
      width: p.cutWidth || 30,
      length: p.cutLength || 40,
      diameter: p.cutDiameter || 25,
      depth: p.cutDepth || 10,
      angle: p.cutAngle || 0,
    });
  }
  const uniqueCuts = Array.from(new Map(allCuts.map((c) => [c.id, c])).values());

  if (uniqueHoles.length === 0 && uniqueCuts.length === 0) {
    return baseGeom;
  }

  // Ensure vertex normals and bounding box are computed
  if (!baseGeom.attributes.normal) {
    baseGeom.computeVertexNormals();
  }
  baseGeom.computeBoundingBox();
  const bbox = baseGeom.boundingBox || new THREE.Box3(new THREE.Vector3(-2, -2, -2), new THREE.Vector3(2, 2, 2));
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const center = new THREE.Vector3();
  bbox.getCenter(center);

  try {
    const evaluator = new Evaluator();
    evaluator.useGroups = false;
    let currentBrush = new Brush(baseGeom);
    currentBrush.updateMatrixWorld();

    // 1. Process Holes
    for (const h of uniqueHoles) {
      const std = ISO_METRIC_HOLES.find((s) => s.size === h.size) || {
        size: h.size,
        nominalDiameter: 6,
        tapDrillDiameter: 5,
        clearanceMedium: 6.6,
        counterboreDiameter: 10,
        counterboreDepth: 6,
        countersinkDiameter: 12.4,
      };

      const dia = (h.type === 'tap' ? std.tapDrillDiameter : h.type === 'clearance' ? std.clearanceMedium : std.nominalDiameter) / 10;
      const r = dia / 2;
      const cbDia = (std.counterboreDiameter || 10) / 10;
      const cbR = cbDia / 2;
      const cbDepth = (std.counterboreDepth || 6) / 10;
      const face: SurfaceFace = h.face || 'top';

      const hx = h.x / 10;
      const hy = h.y / 10;

      const dimNormal = face === 'top' || face === 'bottom' ? size.y : face === 'front' || face === 'back' ? size.z : size.x;
      const isThrough = h.isThroughAll !== false;
      const nominalDepth = (h.depth || 15) / 10;
      const depth = isThrough ? (dimNormal + 4.0) : (nominalDepth + 1.0);

      // Main drill cylinder cutter (48 radial segments for ultra-smooth circles)
      const drillGeom = new THREE.CylinderGeometry(r, r, depth, 48);
      const drillBrush = new Brush(drillGeom);

      if (face === 'top') {
        drillBrush.position.set(hx, isThrough ? center.y : bbox.max.y - nominalDepth / 2 + 0.5, hy);
      } else if (face === 'bottom') {
        drillBrush.position.set(hx, isThrough ? center.y : bbox.min.y + nominalDepth / 2 - 0.5, hy);
      } else if (face === 'front') {
        drillBrush.rotation.x = Math.PI / 2;
        drillBrush.position.set(hx, hy, isThrough ? center.z : bbox.max.z - nominalDepth / 2 + 0.5);
      } else if (face === 'back') {
        drillBrush.rotation.x = Math.PI / 2;
        drillBrush.position.set(-hx, hy, isThrough ? center.z : bbox.min.z + nominalDepth / 2 - 0.5);
      } else if (face === 'right') {
        drillBrush.rotation.z = Math.PI / 2;
        drillBrush.position.set(isThrough ? center.x : bbox.max.x - nominalDepth / 2 + 0.5, hy, hx);
      } else if (face === 'left') {
        drillBrush.rotation.z = Math.PI / 2;
        drillBrush.position.set(isThrough ? center.x : bbox.min.x + nominalDepth / 2 - 0.5, hy, -hx);
      }
      drillBrush.updateMatrixWorld();
      currentBrush = evaluator.evaluate(currentBrush, drillBrush, SUBTRACTION);

      // If counterbore, apply top stepped recess cutter (extending 1.0 into air to prevent non-manifold boundary tears)
      if (h.type === 'counterbore') {
        const cbH = cbDepth + 1.0;
        const cbGeom = new THREE.CylinderGeometry(cbR, cbR, cbH, 48);
        const cbBrush = new Brush(cbGeom);

        if (face === 'top') {
          cbBrush.position.set(hx, bbox.max.y - cbDepth / 2 + 0.5, hy);
        } else if (face === 'bottom') {
          cbBrush.position.set(hx, bbox.min.y + cbDepth / 2 - 0.5, hy);
        } else if (face === 'front') {
          cbBrush.rotation.x = Math.PI / 2;
          cbBrush.position.set(hx, hy, bbox.max.z - cbDepth / 2 + 0.5);
        } else if (face === 'back') {
          cbBrush.rotation.x = Math.PI / 2;
          cbBrush.position.set(-hx, hy, bbox.min.z + cbDepth / 2 - 0.5);
        } else if (face === 'right') {
          cbBrush.rotation.z = Math.PI / 2;
          cbBrush.position.set(bbox.max.x - cbDepth / 2 + 0.5, hy, hx);
        } else if (face === 'left') {
          cbBrush.rotation.z = Math.PI / 2;
          cbBrush.position.set(bbox.min.x + cbDepth / 2 - 0.5, hy, -hx);
        }
        cbBrush.updateMatrixWorld();
        currentBrush = evaluator.evaluate(currentBrush, cbBrush, SUBTRACTION);
      } else if (h.type === 'countersink') {
        const csDia = (std.countersinkDiameter || 12.4) / 10;
        const csR = csDia / 2;
        const csDepth = Math.max(0.05, csR - r); // Standard 90° ISO Countersink
        const ext = 0.5;
        const topR = csR + ext;
        const botR = r;
        const csH = csDepth + ext;
        const csGeom = new THREE.CylinderGeometry(topR, botR, csH, 48);
        const csBrush = new Brush(csGeom);

        if (face === 'top') {
          csBrush.position.set(hx, bbox.max.y - csDepth / 2 + ext / 2, hy);
        } else if (face === 'bottom') {
          csBrush.position.set(hx, bbox.min.y + csDepth / 2 - ext / 2, hy);
        } else if (face === 'front') {
          csBrush.rotation.x = Math.PI / 2;
          csBrush.position.set(hx, hy, bbox.max.z - csDepth / 2 + ext / 2);
        } else if (face === 'back') {
          csBrush.rotation.x = Math.PI / 2;
          csBrush.position.set(-hx, hy, bbox.min.z + csDepth / 2 - ext / 2);
        } else if (face === 'right') {
          csBrush.rotation.z = Math.PI / 2;
          csBrush.position.set(bbox.max.x - csDepth / 2 + ext / 2, hy, hx);
        } else if (face === 'left') {
          csBrush.rotation.z = Math.PI / 2;
          csBrush.position.set(bbox.min.x + csDepth / 2 - ext / 2, hy, -hx);
        }
        csBrush.updateMatrixWorld();
        currentBrush = evaluator.evaluate(currentBrush, csBrush, SUBTRACTION);
      }
    }

    // 2. Process Surface Cuts (Pocket / Slot / Circular Cut)
    for (const c of uniqueCuts) {
      const face: SurfaceFace = c.face || 'top';
      const dimNormal = face === 'top' || face === 'bottom' ? size.y : face === 'front' || face === 'back' ? size.z : size.x;
      const isThrough = c.isThroughAll === true;
      const nominalDepth = (c.depth || 10) / 10;
      const depth = isThrough ? (dimNormal + 4.0) : (nominalDepth + 1.0);
      const cx = c.x / 10;
      const cy = c.y / 10;

      let cutGeom: THREE.BufferGeometry;
      if (c.cutOp === 'revolve') {
        const revProfile =
          c.profile && c.profile.length >= 2
            ? c.profile
            : [
                { x: 0, y: 0 },
                { x: c.width || 20, y: 0 },
                { x: c.width || 20, y: c.depth || 10 },
                { x: 0, y: c.depth || 10 },
              ];
        cutGeom = createRevolveGeometry(revProfile, c.revolveAngle || 360, 0);
      } else if (c.cutOp === 'helix') {
        cutGeom = createHelixGeometry(c.profile || [], c.helixPitch, c.helixTurns, c.helixRadius);
      } else if (c.type === 'circle') {
        const r = (c.diameter || 25) / 10 / 2;
        if (c.draftAngle && c.draftAngle > 0) {
          const deltaR = Math.tan((c.draftAngle * Math.PI) / 180) * depth;
          const rTop = c.draftDirection === 'outward' ? r + deltaR : Math.max(0.05, r - deltaR);
          cutGeom = new THREE.CylinderGeometry(rTop, r, depth, 48);
        } else {
          cutGeom = new THREE.CylinderGeometry(r, r, depth, 48);
        }
      } else if (c.type === 'slot') {
        const slotL = (c.length || c.width || 40) / 10;
        const slotW = (c.width || 12) / 10;
        const r = slotW / 2;
        const straightL = Math.max(0.1, slotL - slotW);
        const slotShape = new THREE.Shape();
        slotShape.absarc(-straightL / 2, 0, r, Math.PI / 2, (3 * Math.PI) / 2);
        slotShape.absarc(straightL / 2, 0, r, (3 * Math.PI) / 2, Math.PI / 2);
        slotShape.closePath();
        cutGeom = new THREE.ExtrudeGeometry(slotShape, { depth, bevelEnabled: false });
        cutGeom.center();
      } else if (c.profile && c.profile.length >= 3) {
        if (c.draftAngle && c.draftAngle > 0) {
          let maxR = 0;
          c.profile.forEach((p) => {
            const d = Math.hypot(p.x, p.y) / 10;
            if (d > maxR) maxR = d;
          });
          maxR = Math.max(1, maxR);
          const deltaR = Math.tan((c.draftAngle * Math.PI) / 180) * depth;
          const topScale =
            c.draftDirection === 'outward'
              ? (maxR + deltaR) / maxR
              : Math.max(0.05, (maxR - deltaR) / maxR);
          cutGeom = createLoftGeometry(c.profile, depth * 10, topScale, 0);
          cutGeom.center();
        } else {
          const shape = new THREE.Shape();
          let minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity;
          c.profile.forEach((p) => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          });
          const pcx = (minX + maxX) / 2;
          const pcy = (minY + maxY) / 2;
          shape.moveTo((c.profile[0].x - pcx) / 10, (c.profile[0].y - pcy) / 10);
          for (let i = 1; i < c.profile.length; i++) {
            shape.lineTo((c.profile[i].x - pcx) / 10, (c.profile[i].y - pcy) / 10);
          }
          shape.closePath();
          cutGeom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
          cutGeom.center();
        }
      } else {
        const rw = (c.width || 30) / 10;
        const rl = (c.length || 40) / 10;
        cutGeom = new THREE.BoxGeometry(rw, depth, rl);
      }

      const cutBrush = new Brush(cutGeom);
      const isExtruded2D = c.type === 'slot' || (c.profile && c.profile.length >= 3);

      if (face === 'top') {
        if (isExtruded2D) cutBrush.rotation.x = Math.PI / 2;
        cutBrush.position.set(center.x + cx, isThrough ? center.y : bbox.max.y - nominalDepth / 2 + 0.5, center.z + cy);
      } else if (face === 'bottom') {
        if (isExtruded2D) cutBrush.rotation.x = Math.PI / 2;
        cutBrush.position.set(center.x + cx, isThrough ? center.y : bbox.min.y + nominalDepth / 2 - 0.5, center.z + cy);
      } else if (face === 'front') {
        cutBrush.rotation.x = Math.PI / 2;
        cutBrush.position.set(center.x + cx, center.y + cy, isThrough ? center.z : bbox.max.z - nominalDepth / 2 + 0.5);
      } else if (face === 'back') {
        cutBrush.rotation.x = Math.PI / 2;
        cutBrush.position.set(center.x - cx, center.y + cy, isThrough ? center.z : bbox.min.z + nominalDepth / 2 - 0.5);
      } else if (face === 'right') {
        cutBrush.rotation.z = Math.PI / 2;
        cutBrush.position.set(isThrough ? center.x : bbox.max.x - nominalDepth / 2 + 0.5, center.y + cy, center.z + cx);
      } else if (face === 'left') {
        cutBrush.rotation.z = Math.PI / 2;
        cutBrush.position.set(isThrough ? center.x : bbox.min.x + nominalDepth / 2 - 0.5, center.y + cy, center.z - cx);
      }

      if (c.angle) {
        cutBrush.rotateY((c.angle * Math.PI) / 180);
      }

      cutBrush.updateMatrixWorld();
      currentBrush = evaluator.evaluate(currentBrush, cutBrush, SUBTRACTION);
    }

    let resultGeom = currentBrush.geometry;
    try {
      resultGeom = BufferGeometryUtils.mergeVertices(resultGeom, 1e-3);
    } catch (mergeErr) {
      console.warn('[CSG Merge Vertices Warning]:', mergeErr);
    }
    resultGeom.computeVertexNormals();
    return resultGeom;
  } catch (err) {
    console.warn('[CSG Boolean Evaluation Warning]:', err);
    return baseGeom;
  }
}

/**
 * Builds a THREE.Shape or THREE.Path from an analytical ProfileLoop, preserving arcs and circles.
 */
export function buildShapeFromProfileLoop(target: THREE.Shape | THREE.Path, loop: ProfileLoop) {
  if (!loop || !loop.edges || loop.edges.length === 0) return;
  if (loop.edges.length === 1 && loop.edges[0].kind === 'circle') {
    const c = loop.edges[0];
    target.absarc(c.center.x / 10, c.center.y / 10, c.radius / 10, 0, Math.PI * 2, loop.winding === 'cw');
    return;
  }

  for (let i = 0; i < loop.edges.length; i++) {
    const e = loop.edges[i];
    if (i === 0) {
      const s = edgeStart(e);
      target.moveTo(s.x / 10, s.y / 10);
    }
    if (e.kind === 'line') {
      target.lineTo(e.b.x / 10, e.b.y / 10);
    } else if (e.kind === 'arc') {
      target.absarc(
        e.center.x / 10,
        e.center.y / 10,
        e.radius / 10,
        e.a0,
        e.a1,
        !e.ccw
      );
    } else if (e.kind === 'circle') {
      target.absarc(e.center.x / 10, e.center.y / 10, e.radius / 10, 0, Math.PI * 2, loop.winding === 'cw');
    }
  }
  target.closePath();
}

/**
 * Universal Parametric 3D Geometry Factory for all 27 CAD shapes & imported models.
 * Used identically by 3D WebGL Viewport, 2D Technical Drawing Engine, and STL/STEP Exporters.
 */
export function createCustomGeometry(
  part: DesignPart,
  isSculpt = false,
  activeHoles: HoleItem[] = [],
  activeCuts: SurfaceCutItem[] = []
): THREE.BufferGeometry {
  const baseGeom = createRawBaseShapeGeometry(part, isSculpt);
  const effectiveHoles = activeHoles && activeHoles.length > 0 ? activeHoles : (part.holes || []);
  const effectiveCuts = activeCuts && activeCuts.length > 0 ? activeCuts : (part.cuts || []);
  return applyCSGHolesAndCuts(baseGeom, part, effectiveHoles, effectiveCuts);
}

export interface PartFaceTransform {
  pos: [number, number, number];
  rot: [number, number, number];
  planeW: number;
  planeH: number;
  normal: [number, number, number];
}

export interface PartBoundingMetrics {
  bbox: THREE.Box3;
  size: THREE.Vector3;
  center: THREE.Vector3;
  getFaceTransform: (face: SurfaceFace) => PartFaceTransform;
  getCutPlacement: (
    face: SurfaceFace,
    cxMm: number,
    cyMm: number
  ) => { pos: [number, number, number]; rot: [number, number, number] };
  sketchToCutCoords: (
    face: SurfaceFace,
    sketchX: number,
    sketchY: number
  ) => { x: number; y: number };
}

/**
 * Calculates exact, deterministic 3D bounding metrics and flush face transformations
 * directly from the part's underlying BufferGeometry.
 * Cites ISO 10303-42 (Geometric and topological representation).
 */
export function getPartBoundingMetrics(part: DesignPart): PartBoundingMetrics {
  let geom: THREE.BufferGeometry | null = null;
  try {
    geom = createRawBaseShapeGeometry(part, false);
  } catch (err) {
    console.warn('[getPartBoundingMetrics Error]:', err);
  }

  const bbox = new THREE.Box3();
  if (geom) {
    geom.computeBoundingBox();
    if (geom.boundingBox) {
      bbox.copy(geom.boundingBox);
    }
  }

  if (bbox.isEmpty()) {
    const p = part.params || {};
    const hw = (p.width || p.diameter || 40) / 20;
    const hh = (p.height || p.length || 40) / 20;
    const hd = (p.depth || p.length || p.diameter || 20) / 20;
    bbox.set(new THREE.Vector3(-hw, -hh, -hd), new THREE.Vector3(hw, hh, hd));
  }

  const size = new THREE.Vector3();
  bbox.getSize(size);
  const center = new THREE.Vector3();
  bbox.getCenter(center);

  const getFaceTransform = (face: SurfaceFace): PartFaceTransform => {
    switch (face) {
      case 'bottom':
        return {
          pos: [center.x, bbox.min.y - 0.015, center.z],
          rot: [Math.PI / 2, 0, 0],
          planeW: size.x,
          planeH: size.z,
          normal: [0, -1, 0],
        };
      case 'front':
        return {
          pos: [center.x, center.y, bbox.max.z + 0.015],
          rot: [0, 0, 0],
          planeW: size.x,
          planeH: size.y,
          normal: [0, 0, 1],
        };
      case 'back':
        return {
          pos: [center.x, center.y, bbox.min.z - 0.015],
          rot: [0, Math.PI, 0],
          planeW: size.x,
          planeH: size.y,
          normal: [0, 0, -1],
        };
      case 'right':
        return {
          pos: [bbox.max.x + 0.015, center.y, center.z],
          rot: [0, Math.PI / 2, 0],
          planeW: size.z,
          planeH: size.y,
          normal: [1, 0, 0],
        };
      case 'left':
        return {
          pos: [bbox.min.x - 0.015, center.y, center.z],
          rot: [0, -Math.PI / 2, 0],
          planeW: size.z,
          planeH: size.y,
          normal: [-1, 0, 0],
        };
      case 'top':
      default:
        return {
          pos: [center.x, bbox.max.y + 0.015, center.z],
          rot: [-Math.PI / 2, 0, 0],
          planeW: size.x,
          planeH: size.z,
          normal: [0, 1, 0],
        };
    }
  };

  const getCutPlacement = (
    face: SurfaceFace,
    cxMm: number,
    cyMm: number
  ): { pos: [number, number, number]; rot: [number, number, number] } => {
    const cx = cxMm / 10;
    const cy = cyMm / 10;
    switch (face) {
      case 'bottom':
        return {
          pos: [center.x + cx, bbox.min.y - 0.02, center.z + cy],
          rot: [Math.PI / 2, 0, 0],
        };
      case 'front':
        return {
          pos: [center.x + cx, center.y + cy, bbox.max.z + 0.02],
          rot: [0, 0, 0],
        };
      case 'back':
        return {
          pos: [center.x - cx, center.y + cy, bbox.min.z - 0.02],
          rot: [0, Math.PI, 0],
        };
      case 'right':
        return {
          pos: [bbox.max.x + 0.02, center.y + cy, center.z + cx],
          rot: [0, Math.PI / 2, 0],
        };
      case 'left':
        return {
          pos: [bbox.min.x - 0.02, center.y + cy, center.z - cx],
          rot: [0, -Math.PI / 2, 0],
        };
      case 'top':
      default:
        return {
          pos: [center.x + cx, bbox.max.y + 0.02, center.z + cy],
          rot: [-Math.PI / 2, 0, 0],
        };
    }
  };

  const sketchToCutCoords = (
    face: SurfaceFace,
    sx: number,
    sy: number
  ): { x: number; y: number } => {
    return {
      x: sx,
      y: (face === 'top' || !face) ? -sy : sy,
    };
  };

  return {
    bbox,
    size,
    center,
    getFaceTransform,
    getCutPlacement,
    sketchToCutCoords,
  };
}

export interface SketchPlaneWorldTransform {
  position: [number, number, number];
  quaternion: THREE.Quaternion;
  rotation: [number, number, number]; // Euler XYZ in radians
  rotationDeg: { x: number; y: number; z: number }; // Euler XYZ in degrees
  matrix: THREE.Matrix4;
  uDir: THREE.Vector3; // Tangent (sketch +X) in world
  vDir: THREE.Vector3; // Bitangent (sketch +Y) in world
  normal: THREE.Vector3; // Normal (sketch +Z / extrude direction) in world
  planeW: number; // Face width in CAD units
  planeH: number; // Face height in CAD units
  isGround: boolean;
}

/**
 * Calculates the exact World/Assembly Datum Plane for 2D sketching.
 * SolidWorks / Inventor architecture: The sketch plane is a top-level world coordinate datum.
 * Part coordinate space and Assembly coordinate space are decoupled.
 * Orthonormal basis: U (tangent, sketch +X), V (bitangent, sketch +Y), N (normal, sketch +Z).
 * Cites ISO 10303-42 (Geometric and topological representation).
 */
/**
 * Calculates the exact World/Assembly Datum Plane for a Part's Base 2D Sketch.
 * SolidWorks / Autodesk Inventor architecture:
 * When editing a part's base sketch, the sketch plane is anchored to the part's base datum plane
 * in world coordinates, moving and rotating seamlessly with the part.
 * Cites ISO 10303-42 (Geometric and topological representation).
 */
export function getPartBaseSketchWorldTransform(part: DesignPart): SketchPlaneWorldTransform {
  const p = part.params || {};
  const kind = part.kind;

  let localBase = new THREE.Vector3();
  let localNormal = new THREE.Vector3(0, 0, 1);
  let localU = new THREE.Vector3(1, 0, 0);
  let localV = new THREE.Vector3(0, 1, 0);
  let planeW = 40;
  let planeH = 40;

  if (kind === 'profile' || kind === 't-slot') {
    const depth = (p.extrudeDepth || p.length || 20) / 10;
    // Always anchor base sketch to the extrusion base face, aligned with the solid's datum basis
    localBase.set(0, 0, -depth / 2);
    localNormal.set(0, 0, 1);
    localU.set(1, 0, 0);
    localV.set(0, 1, 0);
    const metrics = getPartBoundingMetrics(part);
    planeW = metrics.size.x || 40;
    planeH = metrics.size.y || metrics.size.z || 40;
  } else if (kind === 'box') {
    const w = (p.width || 40) / 10;
    const h = (p.height || 40) / 10;
    const d = (p.depth || p.length || 20) / 10;
    localBase.set(0, -h / 2, 0);
    localNormal.set(0, 1, 0);
    localU.set(1, 0, 0);
    localV.set(0, 0, -1);
    planeW = w;
    planeH = d;
  } else if (kind === 'cylinder' || kind === 'tube') {
    const dia = (p.diameter || 30) / 10;
    const h = (p.height || p.length || 40) / 10;
    localBase.set(0, -h / 2, 0);
    localNormal.set(0, 1, 0);
    localU.set(1, 0, 0);
    localV.set(0, 0, -1);
    planeW = dia;
    planeH = dia;
  } else {
    const metrics = getPartBoundingMetrics(part);
    localBase.set(metrics.center.x, metrics.bbox.min.y, metrics.center.z);
    localNormal.set(0, 1, 0);
    localU.set(1, 0, 0);
    localV.set(0, 0, -1);
    planeW = metrics.size.x || 40;
    planeH = metrics.size.z || 40;
  }

  // World transform of the part
  const partPos = new THREE.Vector3(
    (part.position?.x || 0) / 10,
    (part.position?.y || 0) / 10,
    (part.position?.z || 0) / 10
  );
  const partQuat = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      ((part.rotation?.x || 0) * Math.PI) / 180,
      ((part.rotation?.y || 0) * Math.PI) / 180,
      ((part.rotation?.z || 0) * Math.PI) / 180,
      'XYZ'
    )
  );
  const partScale = new THREE.Vector3(
    part.scale?.x ?? 1,
    part.scale?.y ?? 1,
    part.scale?.z ?? 1
  );
  const mPartWorld = new THREE.Matrix4().compose(partPos, partQuat, partScale);

  // Transform face basis and center to World coordinates
  const worldCenter = localBase.clone().applyMatrix4(mPartWorld);
  const normal = localNormal.clone().applyQuaternion(partQuat).normalize();
  const uDir = localU.clone().applyQuaternion(partQuat).normalize();
  const vDir = localV.clone().applyQuaternion(partQuat).normalize();

  // Offset slightly along world normal to prevent z-fighting with the base face
  const worldOrigin = worldCenter.clone().addScaledVector(normal, 0.015);

  const matrix = new THREE.Matrix4().makeBasis(uDir, vDir, normal);
  matrix.setPosition(worldOrigin);

  const quaternion = new THREE.Quaternion().setFromRotationMatrix(matrix);
  const euler = new THREE.Euler().setFromQuaternion(quaternion, 'XYZ');

  const cleanVal = (v: number) => (Math.abs(v) < 1e-4 ? 0 : v);
  const rotation: [number, number, number] = [euler.x, euler.y, euler.z];
  const rotationDeg = {
    x: cleanVal(Math.round(((euler.x * 180) / Math.PI) * 10) / 10),
    y: cleanVal(Math.round(((euler.y * 180) / Math.PI) * 10) / 10),
    z: cleanVal(Math.round(((euler.z * 180) / Math.PI) * 10) / 10),
  };

  return {
    position: [worldOrigin.x, worldOrigin.y, worldOrigin.z],
    quaternion,
    rotation,
    rotationDeg,
    matrix,
    uDir,
    vDir,
    normal,
    planeW,
    planeH,
    isGround: false,
  };
}

export function getSketchPlaneWorldTransform(
  part: DesignPart | null | undefined,
  face: SurfaceFace | null | undefined
): SketchPlaneWorldTransform {
  if (!part) {
    // ─── GROUND GRID DATUM PLANE (XZ plane, Y=0) ───
    const worldOrigin = new THREE.Vector3(0, 0, 0);
    const uDir = new THREE.Vector3(1, 0, 0);
    const vDir = new THREE.Vector3(0, 0, -1);
    const normal = new THREE.Vector3(0, 1, 0);

    const matrix = new THREE.Matrix4().makeBasis(uDir, vDir, normal);
    matrix.setPosition(worldOrigin);

    const quaternion = new THREE.Quaternion().setFromRotationMatrix(matrix);
    const rotation: [number, number, number] = [-Math.PI / 2, 0, 0];
    const rotationDeg = { x: -90, y: 0, z: 0 };

    return {
      position: [worldOrigin.x, worldOrigin.y, worldOrigin.z],
      quaternion,
      rotation,
      rotationDeg,
      matrix,
      uDir,
      vDir,
      normal,
      planeW: 200,
      planeH: 200,
      isGround: true,
    };
  }

  // If part is provided without an active surface face, anchor to part's base sketch datum
  if (!face) {
    return getPartBaseSketchWorldTransform(part);
  }

  // ─── PART FACE DATUM PLANE IN ASSEMBLY / WORLD COORDINATES ───
  const metrics = getPartBoundingMetrics(part);
  const bbox = metrics.bbox;
  const size = metrics.size;
  const center = metrics.center;

  let localCenter = new THREE.Vector3();
  let localNormal = new THREE.Vector3();
  let localTangentU = new THREE.Vector3();
  let localBitangentV = new THREE.Vector3();
  let planeW = size.x;
  let planeH = size.z;

  switch (face) {
    case 'bottom':
      localCenter.set(center.x, bbox.min.y, center.z);
      localNormal.set(0, -1, 0);
      localTangentU.set(1, 0, 0);
      localBitangentV.set(0, 0, 1);
      planeW = size.x;
      planeH = size.z;
      break;
    case 'front':
      localCenter.set(center.x, center.y, bbox.max.z);
      localNormal.set(0, 0, 1);
      localTangentU.set(1, 0, 0);
      localBitangentV.set(0, 1, 0);
      planeW = size.x;
      planeH = size.y;
      break;
    case 'back':
      localCenter.set(center.x, center.y, bbox.min.z);
      localNormal.set(0, 0, -1);
      localTangentU.set(-1, 0, 0);
      localBitangentV.set(0, 1, 0);
      planeW = size.x;
      planeH = size.y;
      break;
    case 'right':
      localCenter.set(bbox.max.x, center.y, center.z);
      localNormal.set(1, 0, 0);
      localTangentU.set(0, 0, -1);
      localBitangentV.set(0, 1, 0);
      planeW = size.z;
      planeH = size.y;
      break;
    case 'left':
      localCenter.set(bbox.min.x, center.y, center.z);
      localNormal.set(-1, 0, 0);
      localTangentU.set(0, 0, 1);
      localBitangentV.set(0, 1, 0);
      planeW = size.z;
      planeH = size.y;
      break;
    case 'top':
    default:
      localCenter.set(center.x, bbox.max.y, center.z);
      localNormal.set(0, 1, 0);
      localTangentU.set(1, 0, 0);
      localBitangentV.set(0, 0, -1);
      planeW = size.x;
      planeH = size.z;
      break;
  }

  // World transform of the part
  const partPos = new THREE.Vector3(
    (part.position?.x || 0) / 10,
    (part.position?.y || 0) / 10,
    (part.position?.z || 0) / 10
  );
  const partQuat = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      ((part.rotation?.x || 0) * Math.PI) / 180,
      ((part.rotation?.y || 0) * Math.PI) / 180,
      ((part.rotation?.z || 0) * Math.PI) / 180,
      'XYZ'
    )
  );
  const partScale = new THREE.Vector3(
    part.scale?.x ?? 1,
    part.scale?.y ?? 1,
    part.scale?.z ?? 1
  );
  const mPartWorld = new THREE.Matrix4().compose(partPos, partQuat, partScale);

  // Transform face basis and center to World coordinates
  const worldCenter = localCenter.clone().applyMatrix4(mPartWorld);
  const normal = localNormal.clone().applyQuaternion(partQuat).normalize();
  const uDir = localTangentU.clone().applyQuaternion(partQuat).normalize();
  const vDir = localBitangentV.clone().applyQuaternion(partQuat).normalize();

  // Offset slightly along world normal to prevent z-fighting with the solid's face (0.015 CAD units = 0.15 mm)
  const worldOrigin = worldCenter.clone().addScaledVector(normal, 0.015);

  const matrix = new THREE.Matrix4().makeBasis(uDir, vDir, normal);
  matrix.setPosition(worldOrigin);

  const quaternion = new THREE.Quaternion().setFromRotationMatrix(matrix);
  const euler = new THREE.Euler().setFromQuaternion(quaternion, 'XYZ');

  const cleanVal = (v: number) => (Math.abs(v) < 1e-4 ? 0 : v);
  const rotation: [number, number, number] = [euler.x, euler.y, euler.z];
  const rotationDeg = {
    x: cleanVal(Math.round(((euler.x * 180) / Math.PI) * 10) / 10),
    y: cleanVal(Math.round(((euler.y * 180) / Math.PI) * 10) / 10),
    z: cleanVal(Math.round(((euler.z * 180) / Math.PI) * 10) / 10),
  };

  return {
    position: [worldOrigin.x, worldOrigin.y, worldOrigin.z],
    quaternion,
    rotation,
    rotationDeg,
    matrix,
    uDir,
    vDir,
    normal,
    planeW: Math.max(0.5, planeW),
    planeH: Math.max(0.5, planeH),
    isGround: false,
  };
}

const CAD_MM = 10; // 10 mm in reality = 1.0 CAD unit

function signedAreaMm(pts: GearPoint2D[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return a / 2;
}

function contourToShape(pts: GearPoint2D[]): THREE.Shape {
  const shape = new THREE.Shape();
  if (pts.length < 3) return shape;
  shape.moveTo(pts[0].x / CAD_MM, pts[0].y / CAD_MM);
  for (let i = 1; i < pts.length; i++) {
    shape.lineTo(pts[i].x / CAD_MM, pts[i].y / CAD_MM);
  }
  shape.closePath();
  return shape;
}

/** Hole winding must oppose the outer contour for THREE.ExtrudeGeometry. */
function addContourHole(shape: THREE.Shape, holePts: GearPoint2D[]) {
  if (holePts.length < 3) return;
  const outerPts = shape.getPoints();
  const outerCCW = signedAreaMm(outerPts.map((p) => ({ x: p.x, y: p.y }))) >= 0;
  const holeCCW = signedAreaMm(holePts) >= 0;
  const pts = holeCCW === outerCCW ? [...holePts].reverse() : holePts;
  const path = new THREE.Path();
  path.moveTo(pts[0].x / CAD_MM, pts[0].y / CAD_MM);
  for (let i = 1; i < pts.length; i++) {
    path.lineTo(pts[i].x / CAD_MM, pts[i].y / CAD_MM);
  }
  path.closePath();
  shape.holes.push(path);
}

function extrudeClosedContour(shape: THREE.Shape, depthMm: number, steps = 1): THREE.ExtrudeGeometry {
  const depth = Math.max(0.05, depthMm / CAD_MM);
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: Math.max(1, steps),
    bevelEnabled: false,
    curveSegments: 8,
  });
  return geom;
}

/** Extrude +Z then stand the solid so its axis is +Y (same as cylinders / lathe pulleys). */
function finishAxialSolid(geom: THREE.BufferGeometry): THREE.BufferGeometry {
  geom.center();
  geom.rotateX(-Math.PI / 2);
  return geom;
}

function createOpenDriveTubeGeometry(p: Record<string, any>): THREE.BufferGeometry {
  const d1 = Math.max(1, Number(p.d1 || 100));
  const d2 = Math.max(1, Number(p.d2 || 250));
  const C = Math.max(d1 / 2 + d2 / 2 + 1, Number(p.centerDist || 500));
  const loop = createDriveLoop(-C / 2, 0, d1 / 2, C / 2, 0, d2 / 2);
  if (!loop) {
    return new THREE.TorusGeometry(C / 20, 0.35, 8, 32);
  }
  const n = 180;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const pt = loop.getPointAt((i / n) * loop.totalLength);
    pts.push(new THREE.Vector3(pt.x / CAD_MM, 0, pt.y / CAD_MM));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.05);
  const tubeR = Math.max(0.06, Number(p.tubeRadiusMm || p.beltHeight || 8) / (2 * CAD_MM));
  return new THREE.TubeGeometry(curve, n, tubeR, 10, true);
}

export function createRawBaseShapeGeometry(part: DesignPart, isSculpt = false): THREE.BufferGeometry {
  const p = part.params || {};
  const kind = part.kind;

  if (p.form === 'drive-loop') {
    return createOpenDriveTubeGeometry(p);
  }


  // 0. Imported CAD Model (STL, OBJ, GLTF, STEP, X_T, X_B, IGES)
  if (kind === 'imported-model' || part.customGeometry || customCADGeometries.has(part.id)) {
    // Check 1: Direct part.customGeometry with isBufferGeometry or position attributes
    if (part.customGeometry) {
      if ((part.customGeometry as THREE.BufferGeometry).isBufferGeometry || (part.customGeometry.attributes && part.customGeometry.attributes.position)) {
        return part.customGeometry as THREE.BufferGeometry;
      }
    }
    // Check 2: Module-level customCADGeometries map
    if (customCADGeometries.has(part.id)) {
      const g = customCADGeometries.get(part.id)!;
      if (g && (g.isBufferGeometry || (g.attributes && g.attributes.position))) {
        return g;
      }
    }
    // Check 3: Zustand store customGeometries dictionary
    const cache = useDesignStore.getState().customGeometries;
    if (cache && cache[part.id]) {
      const g = cache[part.id];
      if (g && (g.isBufferGeometry || (g.attributes && g.attributes.position))) {
        return g;
      }
    }
    // Check 4: Serialized JSON geometry deserialization
    if (part.customGeometry && (part.customGeometry.data || part.customGeometry.metadata)) {
      try {
        const loader = new THREE.BufferGeometryLoader();
        const parsed = loader.parse(part.customGeometry);
        if (parsed && parsed.attributes && parsed.attributes.position) {
          customCADGeometries.set(part.id, parsed);
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse serialized BufferGeometry:', e);
      }
    }
    if (kind === 'imported-model') {
      if (typeof window !== 'undefined' && !customCADGeometries.has(part.id)) {
        loadCADGeometry(part.id).then((loaded) => {
          if (loaded) {
            customCADGeometries.set(part.id, loaded);
            useDesignStore.getState().hydrateCADGeometries();
          }
        }).catch(() => {});
      }
      const w = (p.width || 40) / 10;
      const h = (p.height || 40) / 10;
      const d = (p.depth || 20) / 10;
      return new THREE.BoxGeometry(w, h, d);
    }
  }

  // 1. Custom 2D Profile / T-Slot Solid (Extrude, Revolve, Loft, Cut)
  if (kind === 't-slot' || (kind === 'profile' && part.outer && part.outer.length >= 3)) {
    let pts = part.outer;
    let holes2d = part.inner || [];

    if (kind === 't-slot' && (!pts || pts.length < 3)) {
      const spec = getTSlotSpec(p.specId || p.series || p.width || 40);
      const geom = buildTSlotSection(spec);
      pts = geom.outer;
      holes2d = geom.holes;
    }

    if (pts && pts.length >= 3) {
      if (part.solidOp === 'revolve') {
        return createRevolveGeometry(pts, p.revolveAngle || 360, p.revolveRadius || 0);
      }

      if (part.solidOp === 'helix') {
        return createHelixGeometry(pts, p.helixPitch || 10, p.helixTurns || 3, p.helixRadius || 25);
      }

      if (part.solidOp === 'loft') {
        const scale = (p.loftScale ?? 50) / 100;
        return createLoftGeometry(pts, p.loftHeight || 40, scale, p.loftTwist || 0);
      }

      // Extrusion with Draft Angle (Kalıp Çıkma Açılı Katı)
      if (p.draftAngle && p.draftAngle > 0) {
        const depth = (p.extrudeDepth || p.length || 20) / 10;
        let maxR = 0;
        pts.forEach((pt) => {
          const d = Math.hypot(pt.x, pt.y) / 10;
          if (d > maxR) maxR = d;
        });
        maxR = Math.max(1, maxR);
        const deltaR = Math.tan((p.draftAngle * Math.PI) / 180) * depth;
        const topScale =
          p.draftDirection === 'outward'
            ? Math.min(3.0, (maxR + deltaR) / maxR)
            : Math.max(0.05, (maxR - deltaR) / maxR);
        const loft = createLoftGeometry(pts, p.extrudeDepth || p.length || 20, topScale, 0);
        if (p.profileAxis === 'normal') {
          loft.rotateX(-Math.PI / 2);
          return loft;
        }
        loft.rotateX(Math.PI / 2);
        loft.translate(0, depth / 2, 0);
        return loft;
      }

      const shape = new THREE.Shape();
      if (part.profileRegion && part.profileRegion.outer) {
        buildShapeFromProfileLoop(shape, part.profileRegion.outer);
      } else {
        shape.moveTo(pts[0].x / 10, pts[0].y / 10);
        for (let i = 1; i < pts.length; i++) {
          shape.lineTo(pts[i].x / 10, pts[i].y / 10);
        }
        shape.closePath();
      }

      if (part.profileRegion && part.profileRegion.holes && part.profileRegion.holes.length > 0) {
        for (const holeLoop of part.profileRegion.holes) {
          const path = new THREE.Path();
          buildShapeFromProfileLoop(path, holeLoop);
          shape.holes.push(path);
        }
      } else {
        for (const hole of holes2d) {
          if (!hole || hole.length < 3) continue;
          const path = new THREE.Path();
          path.moveTo(hole[0].x / 10, hole[0].y / 10);
          for (let i = 1; i < hole.length; i++) {
            path.lineTo(hole[i].x / 10, hole[i].y / 10);
          }
          path.closePath();
          shape.holes.push(path);
        }
      }

      const depth = (p.extrudeDepth || p.length || 20) / 10;
      const extrude = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: (p.filletR || 0) > 0,
        bevelSize: (p.filletR || 0) / 10,
        bevelThickness: (p.filletR || 0) / 10,
        curveSegments: isSculpt ? 32 : 12,
      });

      // If extruded normal to a face/sketch plane, center along Z and return directly
      if (p.profileAxis === 'normal') {
        extrude.translate(0, 0, -depth / 2);
        return extrude;
      }

      // Rotate +90 deg around X so 2D profile (u=X, v=Z) sits flat in XZ plane
      extrude.rotateX(Math.PI / 2);
      extrude.translate(0, depth / 2, 0);
      return extrude;
    }
  }

  // 2. Involute spur/helical/internal gears OR ISO 606 sprockets (true factory contours)
  if (kind === 'gear-blank') {
    const depthMm = p.depth || 15;
    const isSprocket = p.form === 'sprocket' || Number(p.sprocketPitch || p.pitchMm) > 0;

    if (isSprocket) {
      const teeth = Math.max(6, Math.round(p.teeth || 19));
      const pitch = Number(p.sprocketPitch || p.pitchMm || 15.875);
      const sprocketParams = {
        teeth,
        pitch,
        rollerDiameter: p.rollerDiameter > 0 ? p.rollerDiameter : undefined,
        boreDiameter: p.bore > 0 ? p.bore : undefined,
        hasKeyway: p.hasKeyway !== false,
        pointsPerTooth: 12,
      };
      const specs = calculateSprocketSpecs(sprocketParams);
      const contour = generateSprocketContour(sprocketParams);
      if (contour.length >= 3) {
        const shape = contourToShape(contour);
        if (specs.boreDiameter > 0) {
          const borePts = generateBoreAndKeywayContour(
            { x: 0, y: 0 },
            specs.boreDiameter,
            p.hasKeyway !== false,
            specs.keyway
          );
          addContourHole(shape, borePts);
        }
        const geom = extrudeClosedContour(shape, depthMm, 1);
        return finishAxialSolid(geom);
      }
    }

    // --- 2A. 3D Gear Rack (DIN 867 / KHK Table 4.6) ---
    if (p.form === 'rack') {
      const mod = Number(p.module || 2);
      const rackH = Number(p.rackPitchHeight || p.heightMm || mod * 8);
      const lengthMm = Number(p.length || p.rackLength || 300);
      const bMm = Number(p.depth || p.faceWidth || 20);
      const pPitch = Math.PI * mod;
      const teethCount = Math.max(4, Math.floor(lengthMm / pPitch));
      const totalL = teethCount * pPitch;
      const ha = mod;
      const hf = 1.25 * mod;
      const tanA = Math.tan((20 * Math.PI) / 180);

      const shape = new THREE.Shape();
      const startX = -totalL / (2 * CAD_MM);
      const yDatum = -rackH / CAD_MM;
      const yTip = ha / CAD_MM;
      const yRoot = -hf / CAD_MM;

      shape.moveTo(startX, yDatum);
      shape.lineTo(startX, yRoot);

      for (let i = 0; i < teethCount; i++) {
        const xc = startX + (i * pPitch) / CAD_MM;
        const xRootL = xc - (pPitch * 0.25) / CAD_MM - (hf * tanA) / CAD_MM;
        const xTipL = xc - (pPitch * 0.25) / CAD_MM + (ha * tanA) / CAD_MM;
        const xTipR = xc + (pPitch * 0.25) / CAD_MM - (ha * tanA) / CAD_MM;
        const xRootR = xc + (pPitch * 0.25) / CAD_MM + (hf * tanA) / CAD_MM;

        shape.lineTo(xRootL, yRoot);
        shape.lineTo(xTipL, yTip);
        shape.lineTo(xTipR, yTip);
        shape.lineTo(xRootR, yRoot);
      }

      const endX = startX + totalL / CAD_MM;
      shape.lineTo(endX, yRoot);
      shape.lineTo(endX, yDatum);
      shape.closePath();

      const geom = extrudeClosedContour(shape, bMm, 1);
      return finishAxialSolid(geom);
    }

    // --- 2B. 3D Gleason Bevel Gear (DIN 3971 / KHK Table 4.16) ---
    if (p.form === 'bevel') {
      const mod = Number(p.module || 2);
      const teeth = Math.max(10, Math.round(p.teeth || 20));
      const deltaDeg = Number(p.pitchConeAngle || p.pitchConeAngleDeg || 45);
      const deltaRad = (deltaDeg * Math.PI) / 180;
      const bMm = Number(p.faceWidth || p.depth || 15);
      const d = mod * teeth;
      const Re = Number(p.coneDistance || (d / (2 * Math.sin(deltaRad))));
      const k = Math.max(0.2, (Re - bMm) / Re);
      const boreMm = Number(p.bore || Math.max(8, Math.round(d * 0.3)));

      const gearParams = {
        module: mod,
        teeth,
        pressureAngle: 20,
        boreDiameter: boreMm,
        hasKeyway: p.hasKeyway !== false,
        pointsPerFlank: 8,
      };
      const outerPts = generateExternalGearContour(gearParams);
      if (outerPts.length >= 3) {
        const shape = contourToShape(outerPts);
        if (boreMm > 0) {
          const specs = calculateInvoluteGearSpecs(gearParams);
          const borePts = generateBoreAndKeywayContour({ x: 0, y: 0 }, boreMm, gearParams.hasKeyway, specs.keyway);
          addContourHole(shape, borePts);
        }
        const geom = extrudeClosedContour(shape, bMm, 10);
        const pos = geom.attributes.position;
        const v = new THREE.Vector3();
        const halfDepth = bMm / (2 * CAD_MM);
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i);
          const tFrac = Math.max(0, Math.min(1, (v.z + halfDepth) / (2 * halfDepth)));
          const scaleFactor = 1.0 - tFrac * (1.0 - k);
          pos.setXYZ(i, v.x * scaleFactor, v.y * scaleFactor, v.z);
        }
        geom.computeVertexNormals();
        return finishAxialSolid(geom);
      }
    }

    // --- 2C. 3D Cylindrical Worm Screw (DIN 3975 / KHK Table 4.22) ---
    if (p.form === 'worm') {
      const mx = Number(p.axialModule || p.module || 2);
      const z1 = Math.max(1, Math.round(p.wormStarts || p.teeth || 1));
      const q = Number(p.diameterFactorQ || (p.pitchDiameter ? p.pitchDiameter / mx : 10));
      const d1 = mx * q;
      const da1 = Number(p.tipDiameter || (d1 + 2 * mx));
      const df1 = Number(p.rootDiameter || (d1 - 2.4 * mx));
      const lengthMm = Number(p.length || p.depth || 14 * mx);
      const boreMm = Number(p.bore || Math.max(8, Math.round(df1 * 0.45)));

      const rRoot = (df1 / 2) / CAD_MM;
      const rTip = (da1 / 2) / CAD_MM;
      const rBore = (boreMm / 2) / CAD_MM;
      const depth = lengthMm / CAD_MM;
      const numTeeth = 32;
      const toothAngle = (Math.PI * 2) / numTeeth;

      const shape = new THREE.Shape();
      for (let i = 0; i < numTeeth; i++) {
        const a0 = i * toothAngle;
        const isTip = (i % 2 === 0);
        const r = isTip ? rTip : rRoot;
        const x = Math.cos(a0) * r;
        const y = Math.sin(a0) * r;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();

      if (rBore > 0.05) {
        const hole = new THREE.Path();
        hole.absarc(0, 0, rBore, 0, Math.PI * 2, true);
        shape.holes.push(hole);
      }

      const steps = Math.max(20, Math.round(depth * 10));
      const geom = extrudeClosedContour(shape, lengthMm, steps);
      const pz = Math.PI * mx * z1; // lead
      const totalTwist = (lengthMm / pz) * Math.PI * 2;
      const pos = geom.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const frac = (v.z + depth / 2) / depth;
        const angle = frac * totalTwist;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        pos.setXYZ(i, v.x * cosA - v.y * sinA, v.x * sinA + v.y * cosA, v.z);
      }
      geom.computeVertexNormals();
      return finishAxialSolid(geom);
    }

    // --- 2D. 3D Globoid Worm Wheel (DIN 3975) ---
    if (p.form === 'worm-wheel') {
      const mx = Number(p.axialModule || p.module || 2);
      const z2 = Math.max(12, Math.round(p.wheelTeeth || p.teeth || 30));
      const bMm = Number(p.faceWidth || p.depth || 16);
      const d2 = mx * z2;
      const boreMm = Number(p.bore || Math.max(10, Math.round(d2 * 0.3)));

      const gearParams = {
        module: mx,
        teeth: z2,
        pressureAngle: 20,
        boreDiameter: boreMm,
        hasKeyway: p.hasKeyway !== false,
        pointsPerFlank: 8,
      };
      const outerPts = generateExternalGearContour(gearParams);
      if (outerPts.length >= 3) {
        const shape = contourToShape(outerPts);
        if (boreMm > 0) {
          const specs = calculateInvoluteGearSpecs(gearParams);
          const borePts = generateBoreAndKeywayContour({ x: 0, y: 0 }, boreMm, gearParams.hasKeyway, specs.keyway);
          addContourHole(shape, borePts);
        }
        const geom = extrudeClosedContour(shape, bMm, 8);
        const pos = geom.attributes.position;
        const v = new THREE.Vector3();
        const halfB = bMm / (2 * CAD_MM);
        const pitchR = (d2 / 2) / CAD_MM;
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i);
          const r = Math.sqrt(v.x * v.x + v.y * v.y);
          if (r > pitchR * 0.8) {
            const zNorm = v.z / halfB;
            const throatDepress = (1.0 - zNorm * zNorm) * (mx * 0.35 / CAD_MM);
            const factor = Math.max(0.75, (r - throatDepress) / r);
            pos.setXYZ(i, v.x * factor, v.y * factor, v.z);
          }
        }
        geom.computeVertexNormals();
        return finishAxialSolid(geom);
      }
    }

    const teeth = Math.max(4, Math.round(p.teeth || 24));
    const mod = p.module || 1.5;
    const isInternal = Boolean(p.isInternal || p.gearType === 'internal');
    const betaDeg = Number(p.helixAngle || 0);
    const xShift = Number(p.profileShift ?? p.x ?? 0);
    const alpha = Number(p.pressureAngle || 20);
    const boreMm = isInternal ? 0 : (p.bore > 0 ? p.bore : (p.boreDiameter > 0 ? p.boreDiameter : undefined));

    let rimThickness: number | undefined;
    if (isInternal) {
      const probe = calculateInvoluteGearSpecs({
        module: mod,
        teeth,
        pressureAngle: alpha,
        helixAngle: betaDeg,
        profileShift: xShift,
        isInternal: true,
      });
      if (p.ringOuterDia > 0) {
        rimThickness = Math.max(2, (p.ringOuterDia - probe.rootDiameter) / 2);
      } else {
        rimThickness = Math.max(12, 3.5 * mod);
      }
    }

    const gearParams = {
      module: mod,
      teeth,
      pressureAngle: alpha,
      helixAngle: betaDeg,
      profileShift: xShift,
      isInternal,
      rimThickness,
      boreDiameter: boreMm,
      hasKeyway: isInternal ? false : p.hasKeyway !== false,
      pointsPerFlank: 10,
    };

    const specs = calculateInvoluteGearSpecs(gearParams);
    let shape: THREE.Shape | null = null;
    try {
      if (isInternal) {
        const { innerTeethContour, outerRimContour } = generateInternalGearContour(gearParams);
        if (outerRimContour.length >= 3 && innerTeethContour.length >= 3) {
          shape = contourToShape(outerRimContour);
          addContourHole(shape, innerTeethContour);
        }
      } else {
        const outer = generateExternalGearContour(gearParams);
        if (outer.length >= 3) {
          shape = contourToShape(outer);
          if (specs.boreDiameter > 0) {
            const borePts = generateBoreAndKeywayContour(
              { x: 0, y: 0 },
              specs.boreDiameter,
              gearParams.hasKeyway,
              specs.keyway
            );
            addContourHole(shape, borePts);
          }
        }
      }
    } catch {
      shape = null;
    }

    if (shape) {
      const steps = Math.abs(betaDeg) > 0.1 ? Math.max(16, Math.round((depthMm / CAD_MM) * 15)) : 1;
      const geom = extrudeClosedContour(shape, depthMm, steps);
      if (Math.abs(betaDeg) > 0.1 && specs.pitchRadius > 0.01) {
        const betaRad = (betaDeg * Math.PI) / 180;
        const pitchR = specs.pitchRadius / CAD_MM;
        const depth = Math.max(0.05, depthMm / CAD_MM);
        const posAttr = geom.attributes.position;
        const v = new THREE.Vector3();
        for (let i = 0; i < posAttr.count; i++) {
          v.fromBufferAttribute(posAttr, i);
          const twistAngle = ((v.z - depth / 2) * Math.tan(betaRad)) / pitchR;
          const cosT = Math.cos(twistAngle);
          const sinT = Math.sin(twistAngle);
          posAttr.setXYZ(i, v.x * cosT - v.y * sinT, v.x * sinT + v.y * cosT, v.z);
        }
        geom.computeVertexNormals();
      }
      return finishAxialSolid(geom);
    }

    // Fallback: should not run if involute factory succeeds
    const pitchR = specs.pitchRadius / CAD_MM;
    const tipR = specs.outsideRadius / CAD_MM;
    const rootR = Math.max(0.05, specs.rootRadius / CAD_MM);
    const fallback = new THREE.Shape();
    const toothAngle = (Math.PI * 2) / teeth;
    for (let i = 0; i < teeth; i++) {
      const a0 = i * toothAngle;
      const x0 = Math.cos(a0) * rootR;
      const y0 = Math.sin(a0) * rootR;
      if (i === 0) fallback.moveTo(x0, y0);
      fallback.lineTo(Math.cos(a0 + toothAngle * 0.25) * rootR, Math.sin(a0 + toothAngle * 0.25) * rootR);
      fallback.lineTo(Math.cos(a0 + toothAngle * 0.4) * tipR, Math.sin(a0 + toothAngle * 0.4) * tipR);
      fallback.lineTo(Math.cos(a0 + toothAngle * 0.6) * tipR, Math.sin(a0 + toothAngle * 0.6) * tipR);
      fallback.lineTo(Math.cos(a0 + toothAngle * 0.75) * rootR, Math.sin(a0 + toothAngle * 0.75) * rootR);
    }
    fallback.closePath();
    const geom = extrudeClosedContour(fallback, depthMm, 1);
    return finishAxialSolid(geom);
  }

  // 3. Timing pulley (ISO 13050 extruded pockets) or V/flat pulley (ISO 4183 lathe)
  if (kind === 'pulley') {
    const depthMm = p.depth || p.beltWidth || 20;
    const boreMm = p.innerDiameter || p.bore || 12;
    const isTiming = p.form === 'timing' || (Number(p.teeth) > 0 && Number(p.pitch) > 0);

    if (isTiming) {
      const type: PulleyProfileType =
        p.pulleyProfileType === 'timing-gt' || p.pulleyProfileType === 'timing-t' || p.pulleyProfileType === 'timing-htd'
          ? p.pulleyProfileType
          : 'timing-htd';
      const pulleyParams = {
        type,
        teeth: Math.max(8, Math.round(p.teeth || 24)),
        pitch: Number(p.pitch || 8),
        outsideDiameter: p.outsideDiameter > 0 ? p.outsideDiameter : undefined,
        boreDiameter: boreMm,
        hasKeyway: p.hasKeyway !== false,
        pointsPerTooth: 12,
      };
      const specs = calculatePulleySpecs(pulleyParams);
      const contour = generateTimingPulleyContour(pulleyParams);
      if (contour.length >= 3) {
        const shape = contourToShape(contour);
        if (specs.boreDiameter > 0) {
          const borePts = generateBoreAndKeywayContour(
            { x: 0, y: 0 },
            specs.boreDiameter,
            p.hasKeyway !== false,
            specs.keyway
          );
          addContourHole(shape, borePts);
        }
        const geom = extrudeClosedContour(shape, depthMm, 1);
        return finishAxialSolid(geom);
      }
    }

    const dd = p.diameter || 50;
    const specs = calculatePulleySpecs({
      type: 'v-belt',
      datumDiameter: dd,
      outsideDiameter: p.outsideDiameter > 0 ? p.outsideDiameter : dd + Math.max(6, (p.heightMm || 8) * 0.4),
      boreDiameter: boreMm,
    });
    const rBore = Math.max(0.1, specs.boreDiameter / (2 * CAD_MM));
    const rOuter = specs.outsideRadius / CAD_MM;
    const rDatum = specs.pitchRadius / CAD_MM;
    const halfW = Math.max(0.15, depthMm / (2 * CAD_MM));
    const grooveH = Math.max(0.2, (p.heightMm || p.grooveDepth || 8) / CAD_MM);
    const topHalf = Math.max(0.15, (p.topWidthMm || 13) / (2 * CAD_MM));
    const rGroove = Math.max(rBore + 0.15, rDatum - grooveH * 0.25);
    const isFlat = p.form === 'flat' || p.beltType === 'flat';

    const profilePts = isFlat
      ? [
          new THREE.Vector2(rBore, -halfW),
          new THREE.Vector2(rOuter, -halfW),
          new THREE.Vector2(rOuter, halfW),
          new THREE.Vector2(rBore, halfW),
        ]
      : [
          new THREE.Vector2(rBore, -halfW),
          new THREE.Vector2(rOuter, -halfW),
          new THREE.Vector2(rOuter, -Math.min(halfW * 0.85, topHalf + 0.05)),
          new THREE.Vector2(rGroove, 0),
          new THREE.Vector2(rOuter, Math.min(halfW * 0.85, topHalf + 0.05)),
          new THREE.Vector2(rOuter, halfW),
          new THREE.Vector2(rBore, halfW),
        ];
    const lathe = new THREE.LatheGeometry(profilePts, 64);
    lathe.center();
    return lathe;
  }

// ── Helical Thread Generators for 3D CAD Fasteners ──
function createHelicalMaleThread(
  Ro: number,
  Ri: number,
  pitch: number,
  thLen: number,
  startY: number,
  taperRate = 0
): THREE.BufferGeometry {
  const nTurns = Math.max(1, thLen / pitch);
  // Adaptive steps per turn: ensure each step is at most 15-20° so triangles never self-intersect or alias into polygons
  const S = nTurns > 120 ? 18 : (nTurns > 60 ? 24 : 32);
  const totalSteps = Math.max(32, Math.round(nTurns * S));

  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= totalSteps; i++) {
    const u = i / totalSteps;
    const theta = u * nTurns * Math.PI * 2;
    const yStep = startY - u * thLen;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    const localDrop = u * thLen * taperRate;
    const localRi = Math.max(0.03, Ri - localDrop);
    const localRo = Math.max(0.04, Ro - localDrop);

    const fade = Math.min(1, i / S, (totalSteps - i) / S);
    const Rcrest = localRi + (localRo - localRi) * Math.max(0.05, fade);

    // 0: Upper root
    positions.push(localRi * cosT, yStep + pitch * 0.40, localRi * sinT);
    // 1: Upper crest
    positions.push(Rcrest * cosT, yStep + pitch * 0.06, Rcrest * sinT);
    // 2: Lower crest
    positions.push(Rcrest * cosT, yStep - pitch * 0.06, Rcrest * sinT);
    // 3: Lower root
    positions.push(localRi * cosT, yStep - pitch * 0.40, localRi * sinT);
  }

  const uvs: number[] = [];
  for (let i = 0; i <= totalSteps; i++) {
    const u = i / totalSteps;
    uvs.push(u, 0.0, u, 0.35, u, 0.65, u, 1.0);
  }

  for (let i = 0; i < totalSteps; i++) {
    const b0 = i * 4;
    const b1 = (i + 1) * 4;

    // Quad 1: Upper flank
    indices.push(b0 + 0, b0 + 1, b1 + 1);
    indices.push(b0 + 0, b1 + 1, b1 + 0);

    // Quad 2: Crest flat
    indices.push(b0 + 1, b0 + 2, b1 + 2);
    indices.push(b0 + 1, b1 + 2, b1 + 1);

    // Quad 3: Lower flank
    indices.push(b0 + 2, b0 + 3, b1 + 3);
    indices.push(b0 + 2, b1 + 3, b1 + 2);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

function createHelicalFemaleThread(
  Rmajor: number,
  Rminor: number,
  pitch: number,
  depth: number,
  startY: number,
  taperRate = 0
): THREE.BufferGeometry {
  const nTurns = Math.max(1, depth / pitch);
  const S = nTurns > 120 ? 18 : (nTurns > 60 ? 24 : 32);
  const totalSteps = Math.max(32, Math.round(nTurns * S));

  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= totalSteps; i++) {
    const u = i / totalSteps;
    const theta = u * nTurns * Math.PI * 2;
    const yStep = startY - u * depth;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    const localDrop = u * depth * taperRate;
    const localRmajor = Math.max(0.05, Rmajor - localDrop);
    const localRminor = Math.max(0.04, Rminor - localDrop);

    const fade = Math.min(1, i / S, (totalSteps - i) / S);
    const Rcrest = localRmajor - (localRmajor - localRminor) * Math.max(0.05, fade);

    // 0: Upper root (at Rmajor)
    positions.push(localRmajor * cosT, yStep + pitch * 0.40, localRmajor * sinT);
    // 1: Upper crest (inward at Rcrest)
    positions.push(Rcrest * cosT, yStep + pitch * 0.06, Rcrest * sinT);
    // 2: Lower crest (inward at Rcrest)
    positions.push(Rcrest * cosT, yStep - pitch * 0.06, Rcrest * sinT);
    // 3: Lower root (at Rmajor)
    positions.push(localRmajor * cosT, yStep - pitch * 0.40, localRmajor * sinT);
  }

  const uvs: number[] = [];
  for (let i = 0; i <= totalSteps; i++) {
    const u = i / totalSteps;
    uvs.push(u, 0.0, u, 0.35, u, 0.65, u, 1.0);
  }

  for (let i = 0; i < totalSteps; i++) {
    const b0 = i * 4;
    const b1 = (i + 1) * 4;

    indices.push(b0 + 0, b1 + 1, b0 + 1);
    indices.push(b0 + 0, b1 + 0, b1 + 1);

    indices.push(b0 + 1, b1 + 2, b0 + 2);
    indices.push(b0 + 1, b1 + 1, b1 + 2);

    indices.push(b0 + 2, b1 + 3, b0 + 3);
    indices.push(b0 + 2, b1 + 2, b1 + 3);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

  // 4. Hex Bolt (Parametric ISO 4014 / ISO 4017 with 3D Helical Threads)
  if (kind === 'hex-bolt') {
    const dia = (p.diameter || 10) / 10;
    const len = (p.length || 40) / 10;
    const s_val = p.headSize || p.headWidth || (p.diameter ? p.diameter * 1.6 : 17);
    const hexRadius = p.cornerWidth ? (p.cornerWidth / 20) : ((s_val / 10) / Math.sqrt(3));
    const headH = (p.headHeight !== undefined ? p.headHeight : 7) / 10;
    const pitch = (p.pitch ? p.pitch / 10 : dia * 0.15);
    const bType = p.boltType || 'hex_bolt';
    const isTapered = Boolean(p.tapered || p.isTapered);
    const threadTypeUpper = String(p.threadType || '').toUpperCase();
    const isPipe = Boolean(
      p.isPipe ||
      isTapered ||
      threadTypeUpper === 'BSPP' ||
      threadTypeUpper === 'G' ||
      threadTypeUpper === 'NPSM' ||
      threadTypeUpper === 'NPT' ||
      threadTypeUpper === 'NPTF' ||
      threadTypeUpper === 'BSPT'
    );

    // For pipe fittings/nipples: full length is threaded (no unthreaded bolt shank)
    const thLen = isPipe ? len : Math.min(len, (p.threadLength !== undefined ? p.threadLength / 10 : len * 0.75));
    const shankLen = isPipe ? 0 : Math.max(0, len - thLen);
    const d3 = (p.minorDiameter ? p.minorDiameter / 10 : Math.max(0.05, dia - 1.22687 * pitch));
    const Ro = dia / 2;
    const Ri = Math.max(0.04, d3 / 2);
    const chamfer = Math.min(pitch * 0.8, Ro * 0.25);

    const taperRate = isTapered ? ((p.taperSlope || (1 / 16)) / 2) : 0;
    const R_root_tip = isTapered ? Math.max(0.03, Ri - thLen * taperRate) : Ri;
    const R_crest_tip = isTapered ? Math.max(0.04, Ro - thLen * taperRate) : Ro;

    const partsToMerge: THREE.BufferGeometry[] = [];

    // Head generation based on boltType
    if (bType === 'socket_cap' || bType === 'low_head_socket') {
      const dkR = (p.headDiameter ? p.headDiameter / 20 : (s_val * 1.15) / 20) || (dia * 1.5) / 2;
      const sockS = p.socketSize || (dia * 10 * 0.8);
      const sockHexR = (sockS / 10) / Math.sqrt(3);
      const sockDepth = Math.min(headH * 0.65, (p.socketDepth ? p.socketDepth / 10 : headH * 0.5));
      const lowerH = Math.max(0.05, headH - sockDepth);

      const lowerHead = new THREE.CylinderGeometry(dkR, dkR, lowerH, 32);
      lowerHead.translate(0, lowerH / 2, 0);
      partsToMerge.push(lowerHead);

      if (sockDepth > 0.02) {
        const sockShape = new THREE.Shape();
        sockShape.absarc(0, 0, dkR, 0, Math.PI * 2, false);
        const sockHole = new THREE.Path();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const x = Math.cos(a) * sockHexR;
          const y = Math.sin(a) * sockHexR;
          if (i === 0) sockHole.moveTo(x, y);
          else sockHole.lineTo(x, y);
        }
        sockHole.closePath();
        sockShape.holes.push(sockHole);
        const upperHead = new THREE.ExtrudeGeometry(sockShape, { depth: sockDepth, bevelEnabled: false });
        upperHead.rotateX(-Math.PI / 2);
        upperHead.translate(0, lowerH, 0);
        const indexedUpperHead = BufferGeometryUtils.mergeVertices(upperHead);
        partsToMerge.push(indexedUpperHead);
      }
    } else if (bType === 'countersunk') {
      const dkR = (p.headDiameter ? p.headDiameter / 20 : (dia * 2.0) / 2);
      const cskGeom = new THREE.CylinderGeometry(dkR, Ro, headH, 32);
      cskGeom.translate(0, headH / 2, 0);
      partsToMerge.push(cskGeom);
    } else if (bType === 'flange_hex') {
      const flgDia = (p.flangeDiameter ? p.flangeDiameter / 20 : (s_val * 1.25) / 20);
      const flgThick = Math.min(headH * 0.4, (p.flangeThickness ? p.flangeThickness / 10 : headH * 0.28));
      const flgGeom = new THREE.CylinderGeometry(flgDia, flgDia, flgThick, 32);
      flgGeom.translate(0, flgThick / 2, 0);
      partsToMerge.push(flgGeom);

      const hexH = Math.max(0.05, headH - flgThick);
      const hexShape = new THREE.Shape();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const x = Math.cos(a) * hexRadius;
        const y = Math.sin(a) * hexRadius;
        if (i === 0) hexShape.moveTo(x, y);
        else hexShape.lineTo(x, y);
      }
      hexShape.closePath();

      const bevelSize = Math.min(0.03, hexH * 0.08);
      const coreDepth = Math.max(0.02, hexH - bevelSize);
      const hexExtrude = new THREE.ExtrudeGeometry(hexShape, {
        depth: coreDepth,
        bevelEnabled: true,
        bevelSize,
        bevelThickness: bevelSize,
        bevelSegments: 1,
      });
      hexExtrude.translate(0, 0, bevelSize);
      hexExtrude.rotateX(-Math.PI / 2);
      hexExtrude.translate(0, flgThick, 0);
      partsToMerge.push(BufferGeometryUtils.mergeVertices(hexExtrude));
    } else if (bType === 'button_head') {
      const dkR = (p.headDiameter ? p.headDiameter / 20 : (dia * 1.8) / 2);
      const domeGeom = new THREE.CylinderGeometry(dkR * 0.7, dkR, headH, 32);
      domeGeom.translate(0, headH / 2, 0);
      partsToMerge.push(domeGeom);
    } else if (bType === 'set_screw') {
      // Headless set screw: no head geometry
    } else {
      // Standard hexagon bolt head (ISO 4014 / DIN 931 / ISO 4017 / DIN 933)
      // 1. Underhead circular washer face bearing boss (ISO 4014 dw)
      const dw = (s_val * 0.95) / 20;
      const washerH = Math.min(0.03, headH * 0.06);
      if (washerH > 0.005 && dw > Ro) {
        const washerGeom = new THREE.CylinderGeometry(dw, dw, washerH, 32);
        washerGeom.translate(0, washerH / 2, 0);
        partsToMerge.push(washerGeom);
      }

      // 2. Full 3D Hexagonal Prism Head with 30°/45° top chamfer
      const hexH = Math.max(0.05, headH - (washerH > 0.005 && dw > Ro ? washerH : 0));
      const hexShape = new THREE.Shape();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const x = Math.cos(a) * hexRadius;
        const y = Math.sin(a) * hexRadius;
        if (i === 0) hexShape.moveTo(x, y);
        else hexShape.lineTo(x, y);
      }
      hexShape.closePath();

      const bevelSize = Math.min(0.03, hexH * 0.08);
      const coreDepth = Math.max(0.02, hexH - bevelSize);
      const headExtrude = new THREE.ExtrudeGeometry(hexShape, {
        depth: coreDepth,
        bevelEnabled: true,
        bevelSize,
        bevelThickness: bevelSize,
        bevelSegments: 1,
      });
      headExtrude.translate(0, 0, bevelSize);
      headExtrude.rotateX(-Math.PI / 2);
      if (washerH > 0.005 && dw > Ro) {
        headExtrude.translate(0, washerH, 0);
      }
      partsToMerge.push(BufferGeometryUtils.mergeVertices(headExtrude));
    }

    // Smooth unthreaded shank (if any) with DIN 76 / ISO 3508 thread runout transition
    if (shankLen > 0.05) {
      const transLen = Math.min(pitch * 0.8, shankLen * 0.4);
      const pureShankLen = shankLen - transLen;

      if (pureShankLen > 0.01) {
        const shankGeom = new THREE.CylinderGeometry(Ro, Ro, pureShankLen, 32);
        shankGeom.translate(0, -pureShankLen / 2, 0);
        partsToMerge.push(shankGeom);
      }

      if (transLen > 0.01) {
        const transGeom = new THREE.CylinderGeometry(Ro, Ri, transLen, 32);
        transGeom.translate(0, -pureShankLen - transLen / 2, 0);
        partsToMerge.push(transGeom);
      }
    }

    // Threaded section: root core cylinder + physical 3D helical ridges
    if (thLen > 0.1) {
      // For tapered threads, core cylinder tapers down to R_root_tip
      const coreGeom = new THREE.CylinderGeometry(Ri, R_root_tip, thLen, 32);
      coreGeom.translate(0, -shankLen - thLen / 2, 0);
      partsToMerge.push(coreGeom);

      const threadHelix = createHelicalMaleThread(Ro, Ri, pitch, thLen, -shankLen, taperRate);
      partsToMerge.push(threadHelix);

      // Tip chamfer (ISO 4753 45° chamfer)
      if (chamfer > 0.01) {
        const chamferGeom = new THREE.CylinderGeometry(R_root_tip, Math.max(0.02, R_root_tip - chamfer), chamfer, 32);
        chamferGeom.translate(0, -len - chamfer / 2, 0);
        partsToMerge.push(chamferGeom);
      }
    } else {
      const fullShank = isTapered
        ? new THREE.CylinderGeometry(Ro, R_crest_tip, len, 32)
        : new THREE.CylinderGeometry(Ro, Ro, len, 32);
      fullShank.translate(0, -len / 2, 0);
      partsToMerge.push(fullShank);
    }

    const merged = BufferGeometryUtils.mergeGeometries(partsToMerge);
    if (merged) {
      merged.computeVertexNormals();
      return merged;
    }
    return partsToMerge[0] || new THREE.CylinderGeometry(Ro, Ro, len, 32);
  }

  // 5. Hex Nut (Parametric ISO 4032 / DIN 934 with ISO 68-1 Internal 3D Metric Threads)
  if (kind === 'hex-nut') {
    // Standard CAD coordinate scaling: 10 mm in reality = 1.0 unit in 3D CAD space
    const nomDia = (p.nominalDiameter || p.innerDiameter || p.diameter || 10) / 10;
    const s_val = p.headSize || p.headWidth || (nomDia * 10 * 1.6) || 17;
    const nutRadius = p.cornerWidth ? (p.cornerWidth / 20) : ((s_val / 10) / Math.sqrt(3));
    const depth = (p.depth || p.height || (nomDia * 10 * 0.84) || 8) / 10;
    const pitch = (p.pitch ? p.pitch / 10 : nomDia * 0.15);
    const Rmajor = nomDia / 2; // Nominal major radius D/2 (e.g. 0.50 for M10)
    const threadDepth = Math.min(Rmajor * 0.35, 0.54127 * pitch);
    const Rminor = Math.max(0.04, Rmajor - threadDepth); // Minor radius D1/2 (e.g. 0.419 for M10)
    const isTapered = Boolean(p.tapered || p.isTapered);
    const taperRate = isTapered ? ((p.taperSlope || (1 / 16)) / 2) : 0;

    const shape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const x = Math.cos(a) * nutRadius;
      const y = Math.sin(a) * nutRadius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    // ISO 4032 top & bottom 30° chamfer bevels
    const bevelSize = Math.min(0.04, depth * 0.08);
    const coreDepth = Math.max(0.02, depth - bevelSize * 2);
    const rawNutBody = new THREE.ExtrudeGeometry(shape, {
      depth: coreDepth,
      bevelEnabled: true,
      bevelSize,
      bevelThickness: bevelSize,
      bevelSegments: 2,
    });
    rawNutBody.center();
    rawNutBody.rotateX(Math.PI / 2); // align bore coaxial with Y axis
    const nutBody = BufferGeometryUtils.mergeVertices(rawNutBody);

    const halfH = depth / 2;
    const margin = 0.05;
    const cutterPts: THREE.Vector2[] = [];

    // ISO 4032 45° entrance countersink outer radius
    const R_cs = Rmajor * 1.05;
    const chamferH = Math.min(R_cs - Rminor, halfH * 0.25);
    const topThreadY = halfH - chamferH;
    const botThreadY = -halfH + chamferH;

    // ORDERED FROM BOTTOM TO TOP (Y ascending) so LatheGeometry normals point OUTWARD:
    // 1. Bottom center (r = 0)
    cutterPts.push(new THREE.Vector2(0, -halfH - margin));
    // 2. Clearance past bottom face
    cutterPts.push(new THREE.Vector2(R_cs + margin, -halfH - margin));
    // 3. 45° entrance chamfer into thread start
    cutterPts.push(new THREE.Vector2(Rminor, botThreadY));

    // 4. ISO 68-1 60° metric thread grooves ascending along Y
    const thLen = topThreadY - botThreadY;
    const nThreads = Math.max(2, Math.floor(thLen / pitch));
    const actualPitch = thLen / nThreads;

    for (let i = 0; i < nThreads; i++) {
      const yBot = botThreadY + i * actualPitch;
      const yMid = yBot + actualPitch * 0.5;
      const yTop = yBot + actualPitch;
      const crestFlat = actualPitch * 0.08;

      const localDropBot = taperRate > 0 ? (halfH - yBot) * taperRate : 0;
      const localDropMid = taperRate > 0 ? (halfH - yMid) * taperRate : 0;
      const localDropTop = taperRate > 0 ? (halfH - yTop) * taperRate : 0;

      const curRminorBot = Math.max(0.04, Rminor - localDropBot);
      const curRmajorMid = Math.max(0.05, Rmajor - localDropMid);
      const curRminorTop = Math.max(0.04, Rminor - localDropTop);

      // Lower crest flat
      cutterPts.push(new THREE.Vector2(curRminorBot, yBot + crestFlat));
      // 60° flank to root
      cutterPts.push(new THREE.Vector2(curRmajorMid, yMid));
      // 60° flank to upper crest
      cutterPts.push(new THREE.Vector2(curRminorTop, yTop - crestFlat));
    }

    // 5. 45° exit chamfer into top face
    cutterPts.push(new THREE.Vector2(Rminor, topThreadY));
    cutterPts.push(new THREE.Vector2(R_cs + margin, halfH + margin));
    // 6. Top center (r = 0)
    cutterPts.push(new THREE.Vector2(0, halfH + margin));

    const rawCutter = new THREE.LatheGeometry(cutterPts, 36);
    const cutterGeom = BufferGeometryUtils.mergeVertices(rawCutter);

    try {
      const hexBrush = new Brush(nutBody);
      hexBrush.updateMatrixWorld();
      const cutterBrush = new Brush(cutterGeom);
      cutterBrush.updateMatrixWorld();

      const evaluator = new Evaluator();
      evaluator.useGroups = false;
      const result = evaluator.evaluate(hexBrush, cutterBrush, SUBTRACTION);
      const finalGeom = BufferGeometryUtils.mergeVertices(result.geometry);
      finalGeom.computeVertexNormals();
      return finalGeom;
    } catch (e) {
      console.warn('[AluCAD] CSG nut generation fallback to extruded bore:', e);
      const fallbackShape = new THREE.Shape();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const x = Math.cos(a) * nutRadius;
        const y = Math.sin(a) * nutRadius;
        if (i === 0) fallbackShape.moveTo(x, y);
        else fallbackShape.lineTo(x, y);
      }
      fallbackShape.closePath();
      const hole = new THREE.Path();
      hole.absarc(0, 0, Math.max(0.05, Rminor), 0, Math.PI * 2, true);
      fallbackShape.holes.push(hole);
      const fallbackBody = new THREE.ExtrudeGeometry(fallbackShape, {
        depth: coreDepth,
        bevelEnabled: true,
        bevelSize,
        bevelThickness: bevelSize,
        bevelSegments: 2,
      });
      fallbackBody.center();
      fallbackBody.rotateX(Math.PI / 2);
      return fallbackBody;
    }
  }

  // 6. Authentic Parametric 3D CAD Rolling Bearing Assembly (All 8 Families)
  if (kind === 'bearing-race') {
    const diaOuter = p.diameter || 47;
    const diaInner = p.innerDiameter || 20;
    const depth = p.depth || 14;

    // Detect family from params or part name
    let type = p.bearingType;
    if (type === 'roller') type = 'cylindrical-roller';
    if (type === 'ball') type = 'deep-groove-ball';
    const nameUpper = (part.name || '').toUpperCase();
    if (!type) {
      if (nameUpper.includes('302') || nameUpper.includes('322') || nameUpper.includes('TAPER')) type = 'tapered-roller';
      else if (nameUpper.includes('NU') || nameUpper.includes('NJ') || nameUpper.includes('CYLINDRICAL')) type = 'cylindrical-roller';
      else if (nameUpper.includes('HK') || nameUpper.includes('NA') || nameUpper.includes('NEEDLE')) type = 'needle-roller';
      else if (nameUpper.includes('222') || nameUpper.includes('223') || nameUpper.includes('SPHERICAL')) type = 'spherical-roller';
      else if (nameUpper.includes('511') || nameUpper.includes('512') || nameUpper.includes('THRUST')) type = 'thrust-ball';
      else if (nameUpper.includes('720') || nameUpper.includes('730') || nameUpper.includes('ANGULAR')) type = 'angular-contact-ball';
      else if (nameUpper.includes('120') || nameUpper.includes('220') || nameUpper.includes('SELF-ALIGNING')) type = 'self-aligning-ball';
      else type = 'deep-groove-ball';
    }

    // CAD Coordinates: 10 mm in reality = 1.0 unit in 3D CAD space
    const Ro = diaOuter / 20;
    const Ri = diaInner / 20;
    const W = depth / 10;
    const Rp = (Ro + Ri) / 2;
    const radialSpace = Math.max(0.2, Ro - Ri);
    const geoms: THREE.BufferGeometry[] = [];

    try {
      if (type === 'thrust-ball' || type === 'thrust-roller') {
        // ─── 1. EKSENEL BİLYALI RULMAN (THRUST BALL BEARING) ───
        const washerThick = W * 0.32;
        const ballR = Math.min(W * 0.22, radialSpace * 0.32);
        const nBalls = 14;

        // Shaft Washer (Tight on shaft: Ri)
        const shaftPts = [
          new THREE.Vector2(Ri, -W / 2),
          new THREE.Vector2(Ro, -W / 2),
          new THREE.Vector2(Ro, -W / 2 + washerThick),
          new THREE.Vector2(Ri, -W / 2 + washerThick),
        ];
        geoms.push(new THREE.LatheGeometry(shaftPts, 36));

        // Housing Washer (Clearance bore: Ri + 0.12)
        const housingRi = Ri + 0.12;
        const housingPts = [
          new THREE.Vector2(housingRi, W / 2 - washerThick),
          new THREE.Vector2(Ro, W / 2 - washerThick),
          new THREE.Vector2(Ro, W / 2),
          new THREE.Vector2(housingRi, W / 2),
        ];
        geoms.push(new THREE.LatheGeometry(housingPts, 36));

        // Horizontal Ball Circle Sandwich
        for (let i = 0; i < nBalls; i++) {
          const a = (i / nBalls) * Math.PI * 2;
          const sphere = new THREE.SphereGeometry(ballR, 12, 12);
          sphere.translate(Math.cos(a) * Rp, 0, Math.sin(a) * Rp);
          geoms.push(sphere);
        }
      } else if (type === 'tapered-roller') {
        // ─── 2. KONİK MAKARALI RULMAN (TAPERED ROLLER BEARING) ───
        const nRollers = 14;
        const alpha = 0.26; // ~15 deg cone angle
        const rollerLen = W * 0.65;
        const rTop = radialSpace * 0.22;
        const rBot = radialSpace * 0.30;

        // Outer Cup (Separable conical inner raceway)
        const cupPts = [
          new THREE.Vector2(Rp + rTop * 1.05, -W / 2),
          new THREE.Vector2(Ro, -W / 2),
          new THREE.Vector2(Ro, W / 2),
          new THREE.Vector2(Rp + rBot * 1.05, W / 2),
        ];
        geoms.push(new THREE.LatheGeometry(cupPts, 36));

        // Inner Cone (with Large Retaining Rib at back face)
        const conePts = [
          new THREE.Vector2(Ri, -W / 2),
          new THREE.Vector2(Rp - rTop * 0.95, -W / 2),
          new THREE.Vector2(Rp - rTop * 1.05, -W / 2 + 0.12),
          new THREE.Vector2(Rp - rBot * 1.05, W / 2 - 0.18),
          new THREE.Vector2(Rp - rBot * 0.65, W / 2),
          new THREE.Vector2(Ri, W / 2),
        ];
        geoms.push(new THREE.LatheGeometry(conePts, 36));

        // Angled Truncated Conical Rollers
        for (let i = 0; i < nRollers; i++) {
          const a = (i / nRollers) * Math.PI * 2;
          const roller = new THREE.CylinderGeometry(rTop, rBot, rollerLen, 12);
          roller.rotateX(alpha);
          roller.translate(0, 0, Rp);
          roller.rotateY(a);
          geoms.push(roller);
        }
      } else if (type === 'cylindrical-roller') {
        // ─── 3. SİLİNDİRİK MAKARALI (NU SERİSİ - FLANŞSIZ İÇ BİLEZİK) ───
        const nRollers = 13;
        const rollerR = radialSpace * 0.26;
        const rollerLen = W * 0.62;

        // Outer Ring (Has two retaining ribs)
        const outerPts = [
          new THREE.Vector2(Rp + rollerR * 0.7, -W / 2),
          new THREE.Vector2(Ro, -W / 2),
          new THREE.Vector2(Ro, W / 2),
          new THREE.Vector2(Rp + rollerR * 0.7, W / 2),
          new THREE.Vector2(Rp + rollerR * 1.02, W / 2 - 0.12),
          new THREE.Vector2(Rp + rollerR * 1.02, -W / 2 + 0.12),
        ];
        geoms.push(new THREE.LatheGeometry(outerPts, 36));

        // Inner Ring (NU Series: completely flat flangeless raceway!)
        const innerPts = [
          new THREE.Vector2(Ri, -W / 2),
          new THREE.Vector2(Rp - rollerR * 1.02, -W / 2),
          new THREE.Vector2(Rp - rollerR * 1.02, W / 2),
          new THREE.Vector2(Ri, W / 2),
        ];
        geoms.push(new THREE.LatheGeometry(innerPts, 36));

        // Cylindrical Rollers
        for (let i = 0; i < nRollers; i++) {
          const a = (i / nRollers) * Math.PI * 2;
          const roller = new THREE.CylinderGeometry(rollerR, rollerR, rollerLen, 12);
          roller.translate(0, 0, Rp);
          roller.rotateY(a);
          geoms.push(roller);
        }
      } else if (type === 'needle-roller') {
        // ─── 4. İĞNELİ MAKARALI (HK SAC KOVAN VEYA NA BİLEZİKLİ) ───
        const isHK = nameUpper.includes('HK') || p.needleType === 'drawn-cup' || p.hasInnerRing === false;
        const nNeedles = 24;
        const needleR = isHK ? radialSpace * 0.38 : radialSpace * 0.22;
        const needleLen = W * 0.78;

        // Thin Outer Cup / Ring
        const cupThick = isHK ? 0.08 : 0.25;
        const outerPts = [
          new THREE.Vector2(Ro - cupThick, -W / 2),
          new THREE.Vector2(Ro, -W / 2),
          new THREE.Vector2(Ro, W / 2),
          new THREE.Vector2(Ro - cupThick, W / 2),
        ];
        geoms.push(new THREE.LatheGeometry(outerPts, 36));

        // Inner Ring (Only for NA machined ring series, HK has no inner ring!)
        if (!isHK) {
          const innerPts = [
            new THREE.Vector2(Ri, -W / 2),
            new THREE.Vector2(Rp - needleR * 1.02, -W / 2),
            new THREE.Vector2(Rp - needleR * 1.02, W / 2),
            new THREE.Vector2(Ri, W / 2),
          ];
          geoms.push(new THREE.LatheGeometry(innerPts, 36));
        }

        // Dense Array of Thin Needle Rollers
        for (let i = 0; i < nNeedles; i++) {
          const a = (i / nNeedles) * Math.PI * 2;
          const needle = new THREE.CylinderGeometry(needleR, needleR, needleLen, 10);
          needle.translate(0, 0, isHK ? (Ro - cupThick - needleR) : Rp);
          needle.rotateY(a);
          geoms.push(needle);
        }
      } else if (type === 'spherical-roller') {
        // ─── 5. OYNAK MAKARALI (22200 SERİSİ - ÇİFT SIRA FIÇI MAKARA) ───
        const nRollers = 12;
        const rollerR = radialSpace * 0.25;
        const rollerLen = W * 0.42;
        const tilt = 0.18;

        // Outer Ring (Continuous concave spherical raceway)
        const outerPts = [
          new THREE.Vector2(Rp + rollerR * 0.85, -W / 2),
          new THREE.Vector2(Ro, -W / 2),
          new THREE.Vector2(Ro, W / 2),
          new THREE.Vector2(Rp + rollerR * 0.85, W / 2),
          new THREE.Vector2(Rp + rollerR * 1.15, 0),
        ];
        geoms.push(new THREE.LatheGeometry(outerPts, 36));

        // Inner Ring (Two raceways with center guide rib)
        const innerPts = [
          new THREE.Vector2(Ri, -W / 2),
          new THREE.Vector2(Rp - rollerR * 0.9, -W / 2),
          new THREE.Vector2(Rp - rollerR * 1.1, -W / 4),
          new THREE.Vector2(Rp - rollerR * 0.75, 0),
          new THREE.Vector2(Rp - rollerR * 1.1, W / 4),
          new THREE.Vector2(Rp - rollerR * 0.9, W / 2),
          new THREE.Vector2(Ri, W / 2),
        ];
        geoms.push(new THREE.LatheGeometry(innerPts, 36));

        // Double Row Barrel Rollers
        for (let i = 0; i < nRollers; i++) {
          const a = (i / nRollers) * Math.PI * 2;
          
          const r1 = new THREE.CylinderGeometry(rollerR * 0.85, rollerR, rollerLen, 12);
          r1.rotateX(tilt);
          r1.translate(0, W * 0.22, Rp);
          r1.rotateY(a);
          geoms.push(r1);

          const r2 = new THREE.CylinderGeometry(rollerR, rollerR * 0.85, rollerLen, 12);
          r2.rotateX(-tilt);
          r2.translate(0, -W * 0.22, Rp);
          r2.rotateY(a + Math.PI / nRollers);
          geoms.push(r2);
        }
      } else if (type === 'angular-contact-ball') {
        // ─── 6. AÇISAL TEMASLI BİLYALI (7200 SERİSİ - 40° TEMAS HATTI) ───
        const nBalls = 10;
        const ballR = radialSpace * 0.32;

        const outerPts = [
          new THREE.Vector2(Rp + ballR * 0.4, -W / 2), // Counterbore shoulder
          new THREE.Vector2(Ro, -W / 2),
          new THREE.Vector2(Ro, W / 2),
          new THREE.Vector2(Rp + ballR * 0.9, W / 2),  // High thrust shoulder
          new THREE.Vector2(Rp + ballR * 1.05, 0),
        ];
        geoms.push(new THREE.LatheGeometry(outerPts, 36));

        const innerPts = [
          new THREE.Vector2(Ri, -W / 2),
          new THREE.Vector2(Rp - ballR * 0.9, -W / 2),
          new THREE.Vector2(Rp - ballR * 1.05, 0),
          new THREE.Vector2(Rp - ballR * 0.4, W / 2),
          new THREE.Vector2(Ri, W / 2),
        ];
        geoms.push(new THREE.LatheGeometry(innerPts, 36));

        for (let i = 0; i < nBalls; i++) {
          const a = (i / nBalls) * Math.PI * 2;
          const sphere = new THREE.SphereGeometry(ballR, 12, 12);
          sphere.translate(Math.cos(a) * Rp, 0, Math.sin(a) * Rp);
          geoms.push(sphere);
        }
      } else if (type === 'self-aligning-ball') {
        // ─── 7. KENDİNDEN AYARLI OYNAK BİLYALI (1200 SERİSİ - ÇİFT SIRA BİLYA) ───
        const nBalls = 10;
        const ballR = radialSpace * 0.22;

        const outerPts = [
          new THREE.Vector2(Rp + ballR * 0.9, -W / 2),
          new THREE.Vector2(Ro, -W / 2),
          new THREE.Vector2(Ro, W / 2),
          new THREE.Vector2(Rp + ballR * 0.9, W / 2),
          new THREE.Vector2(Rp + ballR * 1.15, 0),
        ];
        geoms.push(new THREE.LatheGeometry(outerPts, 36));

        const innerPts = [
          new THREE.Vector2(Ri, -W / 2),
          new THREE.Vector2(Rp - ballR * 0.8, -W / 2),
          new THREE.Vector2(Rp - ballR * 1.05, -W * 0.22),
          new THREE.Vector2(Rp - ballR * 0.7, 0),
          new THREE.Vector2(Rp - ballR * 1.05, W * 0.22),
          new THREE.Vector2(Rp - ballR * 0.8, W / 2),
          new THREE.Vector2(Ri, W / 2),
        ];
        geoms.push(new THREE.LatheGeometry(innerPts, 36));

        for (let i = 0; i < nBalls; i++) {
          const a = (i / nBalls) * Math.PI * 2;
          
          const s1 = new THREE.SphereGeometry(ballR, 12, 12);
          s1.translate(Math.cos(a) * Rp, W * 0.22, Math.sin(a) * Rp);
          geoms.push(s1);

          const s2 = new THREE.SphereGeometry(ballR, 12, 12);
          s2.translate(Math.cos(a + Math.PI / nBalls) * Rp, -W * 0.22, Math.sin(a + Math.PI / nBalls) * Rp);
          geoms.push(s2);
        }
      } else {
        // ─── 8. DERİN OLUKLU SABİT BİLYALI (6000 / 6200 / 6300 SERİSİ) ───
        const nBalls = 9;
        const ballR = radialSpace * 0.32;

        const outerPts = [
          new THREE.Vector2(Rp + ballR * 0.75, -W / 2),
          new THREE.Vector2(Ro, -W / 2),
          new THREE.Vector2(Ro, W / 2),
          new THREE.Vector2(Rp + ballR * 0.75, W / 2),
          new THREE.Vector2(Rp + ballR * 1.08, 0),
        ];
        geoms.push(new THREE.LatheGeometry(outerPts, 36));

        const innerPts = [
          new THREE.Vector2(Ri, -W / 2),
          new THREE.Vector2(Rp - ballR * 0.75, -W / 2),
          new THREE.Vector2(Rp - ballR * 1.08, 0),
          new THREE.Vector2(Rp - ballR * 0.75, W / 2),
          new THREE.Vector2(Ri, W / 2),
        ];
        geoms.push(new THREE.LatheGeometry(innerPts, 36));

        for (let i = 0; i < nBalls; i++) {
          const a = (i / nBalls) * Math.PI * 2;
          const sphere = new THREE.SphereGeometry(ballR, 12, 12);
          sphere.translate(Math.cos(a) * Rp, 0, Math.sin(a) * Rp);
          geoms.push(sphere);
        }

        // Add 2RS / 2Z Protective Seals if specified
        const cap = (p.capping || '').toLowerCase();
        if (cap.includes('2z') || cap.includes('2r') || cap.includes('seal')) {
          const sealThick = 0.04;
          const sealPts1 = [
            new THREE.Vector2(Ri + 0.08, -W / 2 + 0.02),
            new THREE.Vector2(Ro - 0.08, -W / 2 + 0.02),
            new THREE.Vector2(Ro - 0.08, -W / 2 + 0.02 + sealThick),
            new THREE.Vector2(Ri + 0.08, -W / 2 + 0.02 + sealThick),
          ];
          geoms.push(new THREE.LatheGeometry(sealPts1, 36));

          const sealPts2 = [
            new THREE.Vector2(Ri + 0.08, W / 2 - 0.02 - sealThick),
            new THREE.Vector2(Ro - 0.08, W / 2 - 0.02 - sealThick),
            new THREE.Vector2(Ro - 0.08, W / 2 - 0.02),
            new THREE.Vector2(Ri + 0.08, W / 2 - 0.02),
          ];
          geoms.push(new THREE.LatheGeometry(sealPts2, 36));
        }
      }

      if (geoms.length > 0) {
        const merged = BufferGeometryUtils.mergeGeometries(geoms);
        if (merged) {
          merged.center();
          return merged;
        }
      }
    } catch (err) {
      console.warn('Failed to build 3D bearing assembly geometry, falling back to lathe race:', err);
    }

    // Fallback simple lathe ring
    const pts = [
      new THREE.Vector2(Ri, -W / 2),
      new THREE.Vector2(Ro, -W / 2),
      new THREE.Vector2(Ro, W / 2),
      new THREE.Vector2(Ri, W / 2),
    ];
    const lathe = new THREE.LatheGeometry(pts, 36);
    lathe.center();
    return lathe;
  }

  // 7. Keyway Shaft
  if (kind === 'keyway-shaft') {
    const dia = (p.diameter || 20) / 20;
    const len = (p.length || 60) / 10;
    const keyW = (p.keyWidth || 6) / 20;
    const keyD = (p.keyDepth || 3.5) / 10;

    const shape = new THREE.Shape();
    const steps = 48;
    const angleLimit = Math.asin(Math.min(0.95, keyW / dia));
    for (let i = 0; i <= steps; i++) {
      const theta = angleLimit + (i / steps) * (Math.PI * 2 - 2 * angleLimit);
      const x = Math.cos(theta) * dia;
      const y = Math.sin(theta) * dia;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.lineTo(dia - keyD, -keyW);
    shape.lineTo(dia - keyD, keyW);
    shape.closePath();

    const geom = new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: false });
    geom.center();
    return geom;
  }

  // 8. D-Shaft
  if (kind === 'd-shaft') {
    const dia = (p.diameter || 20) / 20;
    const len = (p.length || 50) / 10;
    const flatOff = (p.flatOffset || 7) / 10;
    const flatX = Math.min(dia - 0.1, flatOff);
    const halfChord = Math.sqrt(Math.max(0.01, dia * dia - flatX * flatX));

    const shape = new THREE.Shape();
    const startAngle = Math.atan2(halfChord, flatX);
    const endAngle = Math.atan2(-halfChord, flatX) + Math.PI * 2;
    const steps = 48;

    for (let i = 0; i <= steps; i++) {
      const theta = startAngle + (i / steps) * (endAngle - startAngle);
      const x = Math.cos(theta) * dia;
      const y = Math.sin(theta) * dia;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.lineTo(flatX, halfChord);
    shape.closePath();

    const geom = new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: false });
    geom.center();
    return geom;
  }

  // 9. Slot Plate
  if (kind === 'slot-plate') {
    const w = (p.width || 60) / 10;
    const h = (p.height || 40) / 10;
    const depth = (p.depth || 6) / 10;
    const slotL = (p.slotLength || 30) / 10;
    const slotW = (p.slotWidth || 10) / 10;

    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, -h / 2);
    shape.lineTo(w / 2, -h / 2);
    shape.lineTo(w / 2, h / 2);
    shape.lineTo(-w / 2, h / 2);
    shape.closePath();

    const slotR = slotW / 2;
    const straightHalf = Math.max(0, slotL / 2 - slotR);
    const hole = new THREE.Path();
    hole.absarc(straightHalf, 0, slotR, -Math.PI / 2, Math.PI / 2, false);
    hole.absarc(-straightHalf, 0, slotR, Math.PI / 2, 3 * Math.PI / 2, false);
    hole.closePath();
    shape.holes.push(hole);

    const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    geom.center();
    return geom;
  }

  // 10. Star Prism
  if (kind === 'star-prism') {
    const outerR = (p.diameter || 36) / 20;
    const innerR = (p.innerRadius || 14) / 10;
    const pts = Math.max(3, Math.round(p.starPoints || 5));
    const depth = (p.depth || 10) / 10;

    const shape = new THREE.Shape();
    const total = pts * 2;
    for (let i = 0; i < total; i++) {
      const theta = (i / total) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const x = Math.cos(theta) * r;
      const y = Math.sin(theta) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    geom.center();
    return geom;
  }

  // 11. Cross Prism
  if (kind === 'cross-prism') {
    const w = (p.width || 40) / 10;
    const wall = (p.wall || 10) / 10;
    const depth = (p.depth || 15) / 10;
    const a = w / 2;
    const b = wall / 2;

    const shape = new THREE.Shape();
    shape.moveTo(-b, -a);
    shape.lineTo(b, -a);
    shape.lineTo(b, -b);
    shape.lineTo(a, -b);
    shape.lineTo(a, b);
    shape.lineTo(b, b);
    shape.lineTo(b, a);
    shape.lineTo(-b, a);
    shape.lineTo(-b, b);
    shape.lineTo(-a, b);
    shape.lineTo(-a, -b);
    shape.lineTo(-b, -b);
    shape.closePath();

    const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    geom.center();
    return geom;
  }

  // 12. Torus
  if (kind === 'torus') {
    const r = (p.diameter || 30) / 20;
    const tube = (p.tube || 8) / 20;
    return new THREE.TorusGeometry(r, tube, isSculpt ? 32 : 24, isSculpt ? 64 : 48);
  }

  // 13. Pyramid
  if (kind === 'pyramid') {
    const r = (p.width || 40) / 20;
    const h = (p.height || p.length || 40) / 10;
    return new THREE.ConeGeometry(r * 1.414, h, 4, isSculpt ? 16 : 1);
  }

  // 14. Wedge (Right-angled triangular prism / ramp)
  if (kind === 'wedge') {
    const w = (p.width || 40) / 10;
    const h = (p.height || 40) / 10;
    const d = (p.depth || 30) / 10;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(w, 0);
    shape.lineTo(0, h);
    shape.closePath();
    const geom = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
    geom.center();
    return geom;

  }

  // 15. Hex Prism
  if (kind === 'hex-prism') {
    const r = (p.diameter || 32) / 20;
    const h = (p.length || 40) / 10;
    return new THREE.CylinderGeometry(r, r, h, 6, isSculpt ? 16 : 1);
  }

  // 16. Cylinder
  if (kind === 'cylinder') {
    const r = (p.diameter || 30) / 20;
    const h = (p.length || 40) / 10;
    return new THREE.CylinderGeometry(r, r, h, isSculpt ? 48 : 32, isSculpt ? 32 : 1);
  }

  // 17. Cone
  if (kind === 'cone') {
    const r = (p.diameter || 30) / 20;
    const h = (p.length || 40) / 10;
    return new THREE.ConeGeometry(r, h, isSculpt ? 48 : 32, isSculpt ? 32 : 1);
  }

  // 18. Sphere
  if (kind === 'sphere') {
    const r = (p.diameter || 30) / 20;
    return new THREE.SphereGeometry(r, isSculpt ? 48 : 32, isSculpt ? 48 : 24);
  }

  // 19. Tube & Washer (ISO 3320 / DIN 2413 / Kastaş Standard Cylindrical Solids)
  if (kind === 'tube' || kind === 'washer') {
    const rOuter = (p.diameter || 30) / 20;
    const rInner = (p.innerDiameter || (p.diameter ? p.diameter - 2 * (p.wall || 4) : 16)) / 20;
    const h = (p.length || p.depth || 30) / 10;
    const curveSegments = isSculpt ? 48 : 36;

    if (p.cutaway === 'quarter' || p.cutawayAngle === 90) {
      // 270° inspection cutaway barrel: opens front 90° window (from -45° to +45° across +X) to inspect internal piston, seals & guides
      // The solid 270° wall encompasses top (+Y, 90°) where oil ports are welded, bottom (-Y), and back (-X)
      const shape = new THREE.Shape();
      const aStart = -Math.PI / 4; // -45° (315°)
      const aEnd = Math.PI / 4;    // +45°
      shape.moveTo(rInner * Math.cos(aEnd), rInner * Math.sin(aEnd));
      shape.lineTo(rOuter * Math.cos(aEnd), rOuter * Math.sin(aEnd));
      shape.absarc(0, 0, rOuter, aEnd, aStart + Math.PI * 2, false); // Counter-clockwise 270° sweep across +Y (90°), -X (180°), -Y (270°)
      shape.lineTo(rInner * Math.cos(aStart), rInner * Math.sin(aStart));
      shape.absarc(0, 0, rInner, aStart + Math.PI * 2, aEnd, true); // Clockwise 270° sweep back along inner wall
      shape.closePath();
      const geom = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments });
      return finishAxialSolid(geom);
    }

    if (p.cutaway === 'cover' || p.cutawayCover === true) {
      // 90° complementary closure shell (from -45° to +45° across +X)
      const shape = new THREE.Shape();
      const aStart = -Math.PI / 4;
      const aEnd = Math.PI / 4;
      shape.moveTo(rInner * Math.cos(aStart), rInner * Math.sin(aStart));
      shape.lineTo(rOuter * Math.cos(aStart), rOuter * Math.sin(aStart));
      shape.absarc(0, 0, rOuter, aStart, aEnd, false); // 90° sweep across front (+X)
      shape.lineTo(rInner * Math.cos(aEnd), rInner * Math.sin(aEnd));
      shape.absarc(0, 0, rInner, aEnd, aStart, true);
      shape.closePath();
      const geom = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments });
      return finishAxialSolid(geom);
    }

    const shape = new THREE.Shape();
    shape.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, Math.max(0.1, rInner), 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const geom = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments });
    return finishAxialSolid(geom);
  }

  // 20. L-Bracket
  if (kind === 'L-bracket') {
    const w = (p.flangeW || p.width || 50) / 10;
    const h = (p.webH || p.height || 50) / 10;
    const tf = (p.flangeT || p.thickness || 6) / 10;
    const tw = (p.webT || p.thickness || 6) / 10;
    const d = (p.length || p.depth || 40) / 10;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(w, 0);
    shape.lineTo(w, tf);
    shape.lineTo(tw, tf);
    shape.lineTo(tw, h);
    shape.lineTo(0, h);
    shape.closePath();
    const geom = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
    geom.center();
    return geom;
  }

  // 21. U-Channel
  if (kind === 'U-channel') {
    const w = (p.flangeW || p.width || 50) / 10;
    const h = (p.webH || p.height || 35) / 10;
    const tf = (p.flangeT || p.thickness || 5) / 10;
    const tw = (p.webT || p.thickness || 5) / 10;
    const d = (p.length || p.depth || 60) / 10;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(w, 0);
    shape.lineTo(w, h);
    shape.lineTo(w - tf, h);
    shape.lineTo(w - tf, tw);
    shape.lineTo(tf, tw);
    shape.lineTo(tf, h);
    shape.lineTo(0, h);
    shape.closePath();
    const geom = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
    geom.center();
    return geom;
  }

  // 22. I-Beam
  if (kind === 'I-beam') {
    const w = (p.flangeW || p.width || 50) / 10;
    const h = (p.webH || p.height || 60) / 10;
    const tf = (p.flangeT || 6) / 10;
    const tw = (p.webT || 5) / 10;
    const d = (p.length || 80) / 10;
    const shape = new THREE.Shape();
    const xMid = w / 2;
    const xWebL = xMid - tw / 2;
    const xWebR = xMid + tw / 2;
    shape.moveTo(0, 0);
    shape.lineTo(w, 0);
    shape.lineTo(w, tf);
    shape.lineTo(xWebR, tf);
    shape.lineTo(xWebR, h - tf);
    shape.lineTo(w, h - tf);
    shape.lineTo(w, h);
    shape.lineTo(0, h);
    shape.lineTo(0, h - tf);
    shape.lineTo(xWebL, h - tf);
    shape.lineTo(xWebL, tf);
    shape.lineTo(0, tf);
    shape.closePath();
    const geom = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
    geom.center();
    return geom;
  }

  // 23. T-Beam
  if (kind === 'T-beam') {
    const w = (p.flangeW || p.width || 50) / 10;
    const h = (p.webH || p.height || 50) / 10;
    const tf = (p.flangeT || 6) / 10;
    const tw = (p.webT || 5) / 10;
    const d = (p.length || 80) / 10;
    const xMid = w / 2;

    const shape = new THREE.Shape();
    shape.moveTo(xMid - tw / 2, 0);
    shape.lineTo(xMid + tw / 2, 0);
    shape.lineTo(xMid + tw / 2, h - tf);
    shape.lineTo(w, h - tf);
    shape.lineTo(w, h);
    shape.lineTo(0, h);
    shape.lineTo(0, h - tf);
    shape.lineTo(xMid - tw / 2, h - tf);
    shape.closePath();

    const geom = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
    geom.center();
    return geom;
  }

  // 24. Trapezoid / Truncated Pyramid
  if (kind === 'trapezoid') {
    const wTop = (p.widthTop || 25) / 10;
    const wBot = (p.widthBottom || p.width || 45) / 10;
    const h = (p.height || 35) / 10;
    const d = (p.depth || 25) / 10;
    const shape = new THREE.Shape();
    const diff = (wBot - wTop) / 2;
    shape.moveTo(0, 0);
    shape.lineTo(wBot, 0);
    shape.lineTo(wBot - diff, h);
    shape.lineTo(diff, h);
    shape.closePath();
    const geom = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
    geom.center();
    return geom;
  }

  // 25. Plate
  if (kind === 'plate') {
    const w = (p.width || 60) / 10;
    const h = (p.height || 40) / 10;
    const d = (p.depth || 6) / 10;
    const holeR = (p.holeRadius || 0) / 10;

    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, -h / 2);
    shape.lineTo(w / 2, -h / 2);
    shape.lineTo(w / 2, h / 2);
    shape.lineTo(-w / 2, h / 2);
    shape.closePath();

    if (holeR > 0.1) {
      const hole = new THREE.Path();
      hole.absarc(0, 0, holeR, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }
    const geom = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
    geom.center();
    return geom;
  }

  // Default Box (subdivided for sculpt if sculpt mode)
  const w = (p.width || 40) / 10;
  const h = (p.height || 40) / 10;
  const d = (p.depth || p.length || 20) / 10;
  const boreR = (p.holeRadius || (p.innerDiameter ? p.innerDiameter / 2 : p.bore ? p.bore / 2 : 0)) / 10;

  if (boreR > 0.1) {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, -h / 2);
    shape.lineTo(w / 2, -h / 2);
    shape.lineTo(w / 2, h / 2);
    shape.lineTo(-w / 2, h / 2);
    shape.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 0, boreR, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const geom = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false, curveSegments: isSculpt ? 48 : 36 });
    geom.center();
    return geom;
  }

  return new THREE.BoxGeometry(w, h, d, isSculpt ? 32 : 1, isSculpt ? 32 : 1, isSculpt ? 32 : 1);
}

