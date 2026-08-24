'use client';

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, TransformControls, Edges, Line, Html } from '@react-three/drei';
import {
  useDesignStore,
  type DesignPart,
  type RenderMode,
  type SectionAxis,
  type Point2D,
  type Point3D,
  type SculptBrush
} from './designStore';
import { loadCADFile } from './cadImporter';
import { calculateAssemblyMassProperties } from './materialsEngine';
import { checkHoleInterferences, ISO_METRIC_HOLES, type HoleItem } from './holeStandards';

// Revolve Solid Generator for Arbitrary 2D Sketch Profiles
function createRevolveGeometry(pts: Point2D[], angleDeg = 360, radiusOffset = 0): THREE.BufferGeometry {
  const angle = (Math.min(360, Math.max(15, angleDeg)) * Math.PI) / 180;
  const segments = Math.max(16, Math.round((angleDeg / 360) * 48));
  const N = pts.length;
  if (N < 3) return new THREE.BufferGeometry();

  let minX = Infinity;
  pts.forEach((p) => { if (p.x < minX) minX = p.x; });
  const rShift = Math.max(0.5, -minX / 10 + 0.5 + radiusOffset / 10);

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let s = 0; s <= segments; s++) {
    const theta = (s / segments) * angle;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    for (let i = 0; i < N; i++) {
      const r = pts[i].x / 10 + rShift;
      const y = pts[i].y / 10;
      const x = r * cosT;
      const z = r * sinT;

      positions.push(x, y, z);
      uvs.push(s / segments, i / N);
    }
  }

  for (let s = 0; s < segments; s++) {
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

  if (angle < Math.PI * 2 - 0.01) {
    const shape = new THREE.Shape();
    shape.moveTo(pts[0].x / 10 + rShift, pts[0].y / 10);
    for (let i = 1; i < N; i++) {
      shape.lineTo(pts[i].x / 10 + rShift, pts[i].y / 10);
    }
    shape.closePath();
    const capGeom = new THREE.ShapeGeometry(shape);
    const capPos = capGeom.attributes.position;
    const capIndices = capGeom.index?.array || [];

    const baseOffset = positions.length / 3;
    for (let i = 0; i < capPos.count; i++) {
      positions.push(capPos.getX(i), capPos.getY(i), 0);
      uvs.push(0, 0);
    }
    for (let i = 0; i < capIndices.length; i += 3) {
      indices.push(baseOffset + capIndices[i], baseOffset + capIndices[i + 2], baseOffset + capIndices[i + 1]);
    }

    const endOffset = positions.length / 3;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    for (let i = 0; i < capPos.count; i++) {
      const r = capPos.getX(i);
      const y = capPos.getY(i);
      positions.push(r * cosA, y, r * sinA);
      uvs.push(1, 1);
    }
    for (let i = 0; i < capIndices.length; i += 3) {
      indices.push(endOffset + capIndices[i], endOffset + capIndices[i + 1], endOffset + capIndices[i + 2]);
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
function createLoftGeometry(pts: Point2D[], heightMm = 40, topScale = 0.5, twistDeg = 0): THREE.BufferGeometry {
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

// Helper to construct parametric 3D geometries for all 27 CAD shapes
function createCustomGeometry(part: DesignPart, isSculpt = false): THREE.BufferGeometry {
  const p = part.params;
  const kind = part.kind;

  // 0. Imported CAD Model (STL, OBJ, GLTF, STEP)
  if (kind === 'imported-model') {
    if (part.customGeometry) return part.customGeometry;
    const cache = useDesignStore.getState().customGeometries;
    if (cache[part.id]) return cache[part.id];
    return new THREE.BoxGeometry(4, 4, 4);
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
    return new THREE.TorusGeometry(r, tube, isSculpt ? 32 : 20, isSculpt ? 64 : 36);
  }

  // 13. Pyramid
  if (kind === 'pyramid') {
    const r = (p.width || 40) / 20;
    const h = (p.height || p.length || 40) / 10;
    return new THREE.ConeGeometry(r * 1.414, h, 4, isSculpt ? 16 : 1);
  }

  // 14. Wedge
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
    const rInner = (p.innerDiameter || p.diameter ? (p.diameter - 2 * (p.wall || 4)) : 16) / 20;
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

  // 24. Trapezoid
  if (kind === 'trapezoid') {
    const wTop = (p.widthTop || 25) / 10;
    const wBot = (p.widthBottom || 45) / 10;
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

// ─── BLENDER-STYLE 3D SCULPTING MESH COMPONENT ───
function SolidMesh({ 
  part, 
  renderMode, 
  clippingPlanes,
  isSculptMode,
  onSculptStroke
}: { 
  part: DesignPart; 
  renderMode: RenderMode; 
  clippingPlanes: THREE.Plane[];
  isSculptMode: boolean;
  onSculptStroke: () => void;
}) {
  const select = useDesignStore((s) => s.select);
  const selectedId = useDesignStore((s) => s.selectedId);
  const isSelected = selectedId === part.id;
  const sculptBrush = useDesignStore((s) => s.sculptBrush);
  const sculptRadius = useDesignStore((s) => s.sculptRadius);
  const sculptStrength = useDesignStore((s) => s.sculptStrength);
  const sculptDirection = useDesignStore((s) => s.sculptDirection);
  const sculptSymmetry = useDesignStore((s) => s.sculptSymmetry);
  const sculptVersion = useDesignStore((s) => s.sculptVersion);

  const explodeFactor = useDesignStore((s) => s.explodeFactor);
  const isolatedPartId = useDesignStore((s) => s.isolatedPartId);
  const ghostIsolated = useDesignStore((s) => s.ghostIsolated);
  const tool = useDesignStore((s) => s.tool);
  const studioMode = useDesignStore((s) => s.studioMode);
  const activeMeasureStart = useDesignStore((s) => s.activeMeasureStart);
  const addMeasurement = useDesignStore((s) => s.addMeasurement);
  const setActiveMeasureStart = useDesignStore((s) => s.setActiveMeasureStart);

  const isGhost = isolatedPartId ? isolatedPartId !== part.id : false;

  const meshRef = useRef<THREE.Mesh>(null);
  const isPointerDownRef = useRef(false);

  if (!part.visible && !isGhost) return null;
  if (isGhost && !ghostIsolated) return null;

  // Generate base geometry (with dense subdivision if sculpt mode is active)
  const geom = useMemo(() => {
    return createCustomGeometry(part, isSculptMode);
  }, [part.kind, part.params, part.outer, part.solidOp, isSculptMode, sculptVersion, part.customGeometry]);

  // Exploded View offset
  let finalPos: [number, number, number] = [part.position.x / 10, part.position.y / 10, part.position.z / 10];
  if (explodeFactor > 0) {
    const f = explodeFactor / 100;
    finalPos = [
      (part.position.x / 10) * (1 + f * 0.75),
      (part.position.y / 10) * (1 + f * 0.75),
      (part.position.z / 10) * (1 + f * 0.75),
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
      onSculptStroke();
    }
  }, [sculptBrush, sculptRadius, sculptStrength, sculptDirection, sculptSymmetry, onSculptStroke]);

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
        <Edges scale={1.001} color="#64748b" threshold={20} />
      </mesh>
    );
  }

  return (
    <mesh
      ref={meshRef}
      geometry={geom}
      position={finalPos}
      rotation={rot}
      scale={scale}
      onClick={(e) => {
        if (tool === 'measure' || studioMode === 'inspect') {
          e.stopPropagation();
          const pt = {
            x: Math.round(e.point.x * 10),
            y: Math.round(e.point.y * 10),
            z: Math.round(e.point.z * 10),
          };
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
          threshold={15}
          color={isSelected ? '#00e5ff' : '#ffffff'}
        />
      )}
    </mesh>
  );
}

// ─── 3D CALIPER & DIMENSION MEASUREMENTS LAYER ───
function MeasurementLayer() {
  const measurements = useDesignStore((s) => s.measurements);
  const activeMeasureStart = useDesignStore((s) => s.activeMeasureStart);
  const removeMeasurement = useDesignStore((s) => s.removeMeasurement);

  return (
    <group>
      {/* Active Measurement Start Pin */}
      {activeMeasureStart && (
        <group>
          <mesh position={[activeMeasureStart.x / 10, activeMeasureStart.y / 10, activeMeasureStart.z / 10]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>

          <Html position={[activeMeasureStart.x / 10, activeMeasureStart.y / 10 + 0.5, activeMeasureStart.z / 10]} center>
            <div className="rounded bg-amber-500/95 text-slate-950 font-mono text-[9px] font-black px-2 py-0.5 shadow-xl border border-amber-300 pointer-events-none select-none animate-bounce">
              📍 P1 (Ölçü Başlangıcı) · İkinci yüzeye/noktaya tıklayın
            </div>
          </Html>
        </group>
      )}

      {/* Saved 3D Measurements */}
      {measurements.map((m) => {
        const p1: [number, number, number] = [m.p1.x / 10, m.p1.y / 10, m.p1.z / 10];
        const p2: [number, number, number] = [m.p2.x / 10, m.p2.y / 10, m.p2.z / 10];
        const mid: [number, number, number] = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2 + 0.3, (p1[2] + p2[2]) / 2];

        return (
          <group key={m.id}>
            {/* End Point Pins */}
            <mesh position={p1}>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
            <mesh position={p2}>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>

            {/* Glowing 3D Dimension Line */}
            <Line points={[p1, p2]} color="#00e5ff" lineWidth={3.5} />

            {/* Floating Dimension Callout Badge */}
            <Html position={mid} center>
              <div className="flex items-center gap-1.5 rounded-xl bg-slate-950/95 px-2.5 py-1 font-mono text-[10px] font-bold text-white border border-cyan-400/60 shadow-2xl backdrop-blur-md select-none animate-in fade-in">
                <span className="text-cyan-300 font-black">📏 {m.distance} mm</span>
                <span className="text-slate-400 text-[8px]">
                  (ΔX: {m.dx} · ΔY: {m.dy} · ΔZ: {m.dz})
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMeasurement(m.id);
                  }}
                  className="ml-1 text-rose-400 hover:text-rose-200 font-bold"
                  title="Ölçüyü Sil"
                >
                  ✕
                </button>
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
  const halfH = ((p.height || 40) / 10) / 2;
  const partW = p.width || 60;
  const partH = p.length || p.depth || 40;

  const issues = checkHoleInterferences(holes, { width: partW, height: partH });

  const partPos: [number, number, number] = [
    selectedPart.position.x / 10,
    selectedPart.position.y / 10 + halfH + 0.02,
    selectedPart.position.z / 10,
  ];

  return (
    <group position={partPos}>
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

        return (
          <group key={h.id} position={[h.x / 10, 0, h.y / 10]}>
            {/* Outer Bore Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[r * 0.9, r, 32]} />
              <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.9} />
            </mesh>

            {/* Counterbore Outer Ring if applicable */}
            {h.type === 'counterbore' && (
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[cbR * 0.95, cbR, 32]} />
                <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.5} />
              </mesh>
            )}

            {/* Crosshair */}
            <Line points={[[-r * 1.5, 0, 0], [r * 1.5, 0, 0]]} color={color} lineWidth={1.5} />
            <Line points={[[0, 0, -r * 1.5], [0, 0, r * 1.5]]} color={color} lineWidth={1.5} />

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
        camera={{ position: isSketchMode ? [0, 22, 0.001] : [12, 10, 14], fov: 40 }}
        gl={{ localClippingEnabled: true }}
        onPointerMissed={() => !isSketchMode && !isSculptMode && select(null)}
        style={{ width: '100%', height: '100%', background: bgMap[bg] || '#070b10' }}
      >
        <ambientLight intensity={lightIntensity * 0.5} />
        <directionalLight position={[10, 15, 8]} intensity={lightIntensity} castShadow />
        <directionalLight position={[-10, -5, -8]} intensity={lightIntensity * 0.3} />
        <hemisphereLight args={['#9bbdff', '#1a1f2a', 0.35]} />

        {/* Grid Floor */}
        {showGrid && (
          <Grid
            infiniteGrid
            fadeDistance={50}
            cellSize={0.5}
            sectionSize={2.5}
            sectionColor="#00e5ff"
            cellColor="#1e293b"
            position={[0, -0.01, 0]}
          />
        )}

        {/* Interactive 2D Sketch Plane */}
        <InteractiveSketchPlane />

        {/* 3D Meshes with Solid Backface Double-Sided Clipping & Real-Time Sculpt Engine */}
        {parts.map((p) => (
          <SolidMesh
            key={p.id}
            part={p}
            renderMode={renderMode}
            clippingPlanes={clippingPlanes}
            isSculptMode={isSculptMode}
            onSculptStroke={incrementSculptVersion}
          />
        ))}

        {/* 3D Caliper & Dimension Measuring Layer */}
        <MeasurementLayer />

        {/* 3D Center of Gravity Plumb Line & Target Layer */}
        <CenterOfGravityLayer />

        {/* 3D Fastener Holes & Collision Visualization Layer */}
        <FastenerHolesLayer />

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

        <OrbitControls makeDefault enableDamping dampingFactor={0.05} enabled={!isSketchMode} />
      </Canvas>
    </div>
  );
}

export default DesignViewport;
