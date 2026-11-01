/**
 * 🏭 CUTTABLE WELD GEOMETRY FACTORY (CSG BOOLEAN VOID SUBTRACTION)
 *
 * Implements 3D physical solid meshes for ISO 2553 weld beads.
 * Key User Requirement: "2. DEKİ KAYNAKLAR KESİLEBİLİR KAYNAK OLSUN"
 * (Welds in Mode 2 are authentic 3D solid bodies cut by post-weld machining,
 * holes, and pocket milling via three-bvh-csg boolean subtraction).
 */

import * as THREE from 'three';
import { Evaluator, Brush, SUBTRACTION } from 'three-bvh-csg';
import type { WeldBead } from './weldmentTypes';
import type { SurfaceCutItem, HoleItem } from '../holeStandards';
import { ISO_METRIC_HOLES } from '../holeStandards';

/**
 * Builds the base 3D solid geometry for a weld bead before CSG cuts.
 * All units are converted to Three.js world scale (1 unit = 10 mm).
 */
export function buildBaseWeldGeometry(bead: WeldBead): THREE.BufferGeometry {
  const leg = Math.max(0.1, (bead.legSizeMm || 5) / 10); // scale to scene units
  const len = Math.max(0.5, (bead.lengthMm || 80) / 10);

  // If intermittent, build segmented geometry
  if (bead.intermittent && bead.segmentLengthMm && bead.pitchMm) {
    const segL = Math.max(0.2, bead.segmentLengthMm / 10);
    const pitch = Math.max(segL + 0.1, bead.pitchMm / 10);
    const numSegments = Math.max(1, Math.floor(len / pitch));

    const groupGeom = new THREE.BufferGeometry();
    const segmentGeometries: THREE.BufferGeometry[] = [];

    for (let i = 0; i < numSegments; i++) {
      const zOffset = -len / 2 + (i * pitch) + segL / 2;
      const singleSeg = createSingleBeadShape(bead.type, leg, segL);
      singleSeg.translate(0, 0, zOffset);
      segmentGeometries.push(singleSeg);
    }

    if (segmentGeometries.length === 1) {
      return segmentGeometries[0];
    }
    // Merge segments together
    return mergeGeometries(segmentGeometries);
  }

  return createSingleBeadShape(bead.type, leg, len);
}

/**
 * Creates single continuous weld cross-section extruded along length.
 */
function createSingleBeadShape(type: string, leg: number, len: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();

  if (type === 'butt' || type === 'bevel') {
    // V-Groove cap profile: slightly crowned trapezoid
    const w = leg * 1.6;
    const h = leg * 0.9;
    shape.moveTo(-w / 2, 0);
    shape.quadraticCurveTo(0, h * 0.4, w / 2, 0);
    shape.lineTo(w * 0.35, -h);
    shape.lineTo(-w * 0.35, -h);
    shape.closePath();
  } else {
    // Fillet Weld (Köşe Kaynağı): Concave/convex fillet with throat reinforcement
    shape.moveTo(0, 0);
    shape.lineTo(leg, 0);
    // Slight concave/mitre contour realistic of high quality TIG/MIG bead
    shape.quadraticCurveTo(leg * 0.35, leg * 0.35, 0, leg);
    shape.closePath();
  }

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: len,
    bevelEnabled: false,
    steps: 1,
  });

  // Center extrusion along Z axis
  geom.center();
  geom.computeVertexNormals();
  return geom;
}

/**
 * Merges multiple BufferGeometries into a single unified geometry.
 */
function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geometries.length === 0) return new THREE.BufferGeometry();
  if (geometries.length === 1) return geometries[0];

  let totalVertices = 0;
  let totalIndices = 0;

  for (const g of geometries) {
    totalVertices += g.attributes.position ? g.attributes.position.count : 0;
    totalIndices += g.index ? g.index.count : 0;
  }

  const positions = new Float32Array(totalVertices * 3);
  const normals = new Float32Array(totalVertices * 3);
  const indices: number[] = [];

  let vertOffset = 0;
  for (const g of geometries) {
    const pos = g.attributes.position;
    const norm = g.attributes.normal;
    if (pos) {
      positions.set(pos.array as Float32Array, vertOffset * 3);
      if (norm) {
        normals.set(norm.array as Float32Array, vertOffset * 3);
      }
      if (g.index) {
        for (let i = 0; i < g.index.count; i++) {
          indices.push(g.index.getX(i) + vertOffset);
        }
      }
      vertOffset += pos.count;
    }
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  if (indices.length > 0) {
    merged.setIndex(indices);
  }
  merged.computeVertexNormals();
  return merged;
}

/**
 * Physical Cuttable Weld Evaluator:
 * Applies CSG boolean subtraction to the 3D weld bead geometry so post-weld
 * machining (holes, surface cuts, slots, slicing) cleanly cuts through the weld.
 */
export function createCuttableWeldGeometry(
  bead: WeldBead,
  globalCuts: SurfaceCutItem[] = [],
  globalHoles: HoleItem[] = []
): THREE.BufferGeometry {
  const baseGeom = buildBaseWeldGeometry(bead);

  // Combine cuts and holes assigned specifically to this bead or intersecting it
  const beadCuts = bead.cuts || [];
  const beadHoles = bead.holes || [];
  const allCuts = [...beadCuts, ...globalCuts];
  const allHoles = [...beadHoles, ...globalHoles];

  if (allCuts.length === 0 && allHoles.length === 0) {
    return baseGeom;
  }

  baseGeom.computeBoundingBox();
  const bbox = baseGeom.boundingBox || new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));

  try {
    const evaluator = new Evaluator();
    evaluator.useGroups = false;
    let weldBrush = new Brush(baseGeom);
    weldBrush.updateMatrixWorld();

    // 1. Process Holes intersecting weld bead
    for (const h of allHoles) {
      const std = ISO_METRIC_HOLES.find((s) => s.size === h.size) || {
        nominalDiameter: 8,
        clearanceMedium: 9,
      };
      const dia = (h.type === 'clearance' ? std.clearanceMedium : std.nominalDiameter) / 10;
      const r = dia / 2;
      const depth = Math.max(bbox.max.y - bbox.min.y, bbox.max.z - bbox.min.z, 2.0) + 1.0;

      const drillGeom = new THREE.CylinderGeometry(r, r, depth, 32);
      const drillBrush = new Brush(drillGeom);

      // Position drill cutter in local bead space
      const hx = (h.x || 0) / 10;
      const hz = (h.y || 0) / 10;
      drillBrush.position.set(hx, 0, hz);
      drillBrush.updateMatrixWorld();

      weldBrush = evaluator.evaluate(weldBrush, drillBrush, SUBTRACTION);
    }

    // 2. Process Surface Cuts & Milling Pockets intersecting weld bead
    for (const c of allCuts) {
      const cutW = Math.max(0.2, (c.width || 30) / 10);
      const cutL = Math.max(0.2, (c.length || 40) / 10);
      const cutD = Math.max(0.2, (c.depth || 20) / 10);

      let cutterGeom: THREE.BufferGeometry;
      if (c.type === 'circle') {
        const dia = Math.max(0.2, (c.diameter || 25) / 10);
        cutterGeom = new THREE.CylinderGeometry(dia / 2, dia / 2, cutD * 2, 32);
      } else {
        cutterGeom = new THREE.BoxGeometry(cutW, cutD * 2, cutL);
      }

      const cutterBrush = new Brush(cutterGeom);
      const cx = (c.x || 0) / 10;
      const cz = (c.y || 0) / 10;
      cutterBrush.position.set(cx, 0, cz);
      cutterBrush.updateMatrixWorld();

      weldBrush = evaluator.evaluate(weldBrush, cutterBrush, SUBTRACTION);
    }

    const cutGeom = weldBrush.geometry;
    cutGeom.computeVertexNormals();
    return cutGeom;
  } catch (err) {
    console.warn('[Cuttable Weld CSG Error, using base geometry]:', err);
    return baseGeom;
  }
}
