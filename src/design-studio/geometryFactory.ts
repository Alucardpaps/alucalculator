'use client';

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Evaluator, Brush, SUBTRACTION } from 'three-bvh-csg';
import { DesignPart, customCADGeometries, useDesignStore, Point2D } from './designStore';
import { ISO_METRIC_HOLES, type HoleItem, type SurfaceFace, type SurfaceCutItem } from './holeStandards';


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
      if (c.type === 'circle') {
        const r = ((c.diameter || 25) / 10) / 2;
        cutGeom = new THREE.CylinderGeometry(r, r, depth, 48);
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
      } else {
        const rw = (c.width || 30) / 10;
        const rl = (c.length || 40) / 10;
        cutGeom = new THREE.BoxGeometry(rw, depth, rl);
      }

      const cutBrush = new Brush(cutGeom);

      if (face === 'top') {
        if (c.type === 'slot') cutBrush.rotation.x = Math.PI / 2;
        cutBrush.position.set(cx, isThrough ? center.y : bbox.max.y - nominalDepth / 2 + 0.5, cy);
      } else if (face === 'bottom') {
        if (c.type === 'slot') cutBrush.rotation.x = Math.PI / 2;
        cutBrush.position.set(cx, isThrough ? center.y : bbox.min.y + nominalDepth / 2 - 0.5, cy);
      } else if (face === 'front') {
        cutBrush.rotation.x = Math.PI / 2;
        cutBrush.position.set(cx, cy, isThrough ? center.z : bbox.max.z - nominalDepth / 2 + 0.5);
      } else if (face === 'back') {
        cutBrush.rotation.x = Math.PI / 2;
        cutBrush.position.set(-cx, cy, isThrough ? center.z : bbox.min.z + nominalDepth / 2 - 0.5);
      } else if (face === 'right') {
        cutBrush.rotation.z = Math.PI / 2;
        cutBrush.position.set(isThrough ? center.x : bbox.max.x - nominalDepth / 2 + 0.5, cy, cx);
      } else if (face === 'left') {
        cutBrush.rotation.z = Math.PI / 2;
        cutBrush.position.set(isThrough ? center.x : bbox.min.x + nominalDepth / 2 - 0.5, cy, -cx);
      }

      if (c.angle) {
        cutBrush.rotateY((c.angle * Math.PI) / 180);
      }

      cutBrush.updateMatrixWorld();
      currentBrush = evaluator.evaluate(currentBrush, cutBrush, SUBTRACTION);
    }

    let resultGeom = currentBrush.geometry;
    try {
      resultGeom = BufferGeometryUtils.mergeVertices(resultGeom, 1e-4);
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

function createRawBaseShapeGeometry(part: DesignPart, isSculpt = false): THREE.BufferGeometry {
  const p = part.params || {};
  const kind = part.kind;


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
      const w = (p.width || 40) / 10;
      const h = (p.height || 40) / 10;
      const d = (p.depth || 20) / 10;
      return new THREE.BoxGeometry(w, h, d);
    }
  }

  // 1. Custom 2D Profile Solid (Extrude, Revolve, Loft, Cut)
  if (kind === 'profile' && part.outer && part.outer.length >= 3) {
    const pts = part.outer;

    if (part.solidOp === 'revolve') {
      return createRevolveGeometry(pts, p.revolveAngle || 360, p.revolveRadius || 0);
    }

    if (part.solidOp === 'loft') {
      const scale = (p.loftScale ?? 50) / 100;
      return createLoftGeometry(pts, p.loftHeight || 40, scale, p.loftTwist || 0);
    }

    const shape = new THREE.Shape();
    shape.moveTo(pts[0].x / 10, pts[0].y / 10);
    for (let i = 1; i < pts.length; i++) {
      shape.lineTo(pts[i].x / 10, pts[i].y / 10);
    }
    shape.closePath();

    const depth = (p.extrudeDepth || 20) / 10;
    const extrude = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: (p.filletR || 0) > 0,
      bevelSize: (p.filletR || 0) / 10,
      bevelThickness: (p.filletR || 0) / 10,
      curveSegments: isSculpt ? 32 : 12,
    });
    
    // Rotate +90 deg around X so 2D profile (u=X, v=Z) sits flat in XZ plane with +X and +Z perfectly preserved without mirroring!
    extrude.rotateX(Math.PI / 2);
    // Center vertically around Y=0
    extrude.translate(0, depth / 2, 0);
    return extrude;
  }

  // 2. Spur Gear Blank with Involute Teeth & Center Bore
  if (kind === 'gear-blank') {
    const teeth = Math.max(8, Math.round(p.teeth || 24));
    const mod = (p.module || 1.5);
    const pitchR = (teeth * mod) / 20;
    const addendum = mod / 10;
    const dedendum = 1.25 * mod / 10;
    const tipR = pitchR + addendum;
    const rootR = Math.max(0.1, pitchR - dedendum);
    const depth = (p.depth || 15) / 10;
    const boreR = Math.min((p.bore || 12) / 20, rootR * 0.7);

    const shape = new THREE.Shape();
    const totalSteps = teeth * 8;
    for (let i = 0; i <= totalSteps; i++) {
      const theta = (i / totalSteps) * Math.PI * 2;
      const cycle = (i / totalSteps) * teeth % 1;
      const r = cycle < 0.45 ? tipR : rootR;
      const x = Math.cos(theta) * r;
      const y = Math.sin(theta) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    if (boreR > 0.1) {
      const hole = new THREE.Path();
      hole.absarc(0, 0, boreR, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }

    const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    geom.center();
    return geom;
  }

  // 3. V-Belt Pulley with Lathe Profile
  if (kind === 'pulley') {
    const dia = (p.diameter || 50) / 10;
    const bore = (p.innerDiameter || p.bore || 12) / 10;
    const grooveD = (p.grooveDepth || 4) / 10;
    const rOuter = dia / 2;
    const rInner = Math.max(0.1, bore / 2);
    const grooveMax = Math.min(grooveD, rOuter - rInner - 0.2);

    const profilePts = [
      new THREE.Vector2(rInner, -0.9),
      new THREE.Vector2(rOuter, -0.9),
      new THREE.Vector2(rOuter - grooveMax, -0.3),
      new THREE.Vector2(rOuter - grooveMax, 0.3),
      new THREE.Vector2(rOuter, 0.9),
      new THREE.Vector2(rInner, 0.9),
    ];
    const lathe = new THREE.LatheGeometry(profilePts, 48);
    lathe.center();
    return lathe;
  }

  // 4. Hex Bolt
  if (kind === 'hex-bolt') {
    const dia = (p.diameter || 10) / 10;
    const len = (p.length || 40) / 10;
    const headSize = (p.headSize || 17) / 20;
    const headH = (p.headHeight || 7) / 10;
    return new THREE.CylinderGeometry(headSize, headSize, headH + len, 6);
  }

  // 5. Hex Nut
  if (kind === 'hex-nut') {
    const headSize = (p.headSize || 17) / 20;
    const innerDia = (p.innerDiameter || 10) / 20;
    const depth = (p.depth || 8) / 10;

    const shape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const x = Math.cos(a) * headSize;
      const y = Math.sin(a) * headSize;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const hole = new THREE.Path();
    hole.absarc(0, 0, Math.max(0.1, innerDia), 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05 });
    geom.center();
    return geom;
  }

  // 6. Deep Groove Ball Bearing Race
  if (kind === 'bearing-race') {
    const diaOuter = (p.diameter || 47) / 20;
    const diaInner = (p.innerDiameter || 20) / 20;
    const depth = (p.depth || 14) / 10;
    const shoulder = (p.shoulder || 2.5) / 10;
    const grooveR = Math.min(shoulder, (diaOuter - diaInner) * 0.35);

    const pts = [
      new THREE.Vector2(diaInner, -depth / 2),
      new THREE.Vector2(diaOuter, -depth / 2),
      new THREE.Vector2(diaOuter, depth / 2),
      new THREE.Vector2(diaInner, depth / 2),
      new THREE.Vector2(diaInner, depth / 2 - grooveR),
      new THREE.Vector2(diaInner + grooveR * 0.6, 0),
      new THREE.Vector2(diaInner, -depth / 2 + grooveR),
    ];
    const lathe = new THREE.LatheGeometry(pts, 48);
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

  // 19. Tube & Washer
  if (kind === 'tube' || kind === 'washer') {
    const rOuter = (p.diameter || 30) / 20;
    const rInner = (p.innerDiameter || (p.diameter ? p.diameter - 2 * (p.wall || 4) : 16)) / 20;
    const h = (p.length || p.depth || 30) / 10;
    const shape = new THREE.Shape();
    shape.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, Math.max(0.1, rInner), 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const geom = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
    geom.center();
    return geom;
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

  return new THREE.BoxGeometry(w, h, d, isSculpt ? 32 : 1, isSculpt ? 32 : 1, isSculpt ? 32 : 1);
}

