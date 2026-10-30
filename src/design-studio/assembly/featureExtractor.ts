/**
 * Feature Extractor for 3D Parametric Parts
 *
 * Extracts exact kinematic mate features from:
 * - T-Slot Extrusions (4 slot channels, center bore axis, end planar caps)
 * - Parametric 2D Profiles & CAD Extrusions (circular hole axes, outer planar caps)
 * - Standard Machine Elements (hex-bolt shaft, hex-nut tapped bore, washer)
 * - Parts with surface HoleItem arrays (tap/clearance/counterbore axes)
 */

import * as THREE from 'three';
import { DesignPart } from '../designStore';
import { getTSlotSpec } from '@/cad/catalog/tSlotProfiles';
import { ISO_METRIC_HOLES } from '../holeStandards';
import {
  MateFeature,
  HoleAxisFeature,
  PlanarFaceFeature,
  SlotChannelFeature,
  Point3D,
  MateKind,
} from './mateTypes';

/**
 * Transforms a local Point3D into world coordinates given part position and rotation.
 */
export function localToWorld(pt: Point3D, part: DesignPart): Point3D {
  const pos = part.position || { x: 0, y: 0, z: 0 };
  const rot = part.rotation || { x: 0, y: 0, z: 0 };

  // Convert rotation angles from degrees to radians
  const rx = ((rot.x || 0) * Math.PI) / 180;
  const ry = ((rot.y || 0) * Math.PI) / 180;
  const rz = ((rot.z || 0) * Math.PI) / 180;

  // Euler XYZ rotation
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const cz = Math.cos(rz), sz = Math.sin(rz);

  // X-rotation
  const y1 = pt.y * cx - pt.z * sx;
  const z1 = pt.y * sx + pt.z * cx;
  const x1 = pt.x;

  // Y-rotation
  const x2 = x1 * cy + z1 * sy;
  const z2 = -x1 * sy + z1 * cy;
  const y2 = y1;

  // Z-rotation
  const x3 = x2 * cz - y2 * sz;
  const y3 = x2 * sz + y2 * cz;
  const z3 = z2;

  return {
    x: x3 + pos.x,
    y: y3 + pos.y,
    z: z3 + pos.z,
  };
}

/**
 * Transforms a directional vector into world coordinates (rotation only).
 */
export function localVecToWorld(vec: Point3D, part: DesignPart): Point3D {
  const rot = part.rotation || { x: 0, y: 0, z: 0 };

  const rx = ((rot.x || 0) * Math.PI) / 180;
  const ry = ((rot.y || 0) * Math.PI) / 180;
  const rz = ((rot.z || 0) * Math.PI) / 180;

  const cx = Math.cos(rx), sx = Math.sin(rx);
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const cz = Math.cos(rz), sz = Math.sin(rz);

  const y1 = vec.y * cx - vec.z * sx;
  const z1 = vec.y * sx + vec.z * cx;
  const x1 = vec.x;

  const x2 = x1 * cy + z1 * sy;
  const z2 = -x1 * sy + z1 * cy;
  const y2 = y1;

  const x3 = x2 * cz - y2 * sz;
  const y3 = x2 * sz + y2 * cz;
  const z3 = z2;

  // Normalize
  const mag = Math.sqrt(x3 * x3 + y3 * y3 + z3 * z3) || 1;
  return { x: x3 / mag, y: y3 / mag, z: z3 / mag };
}

/**
 * Extracts all available mate features from a single DesignPart.
 */
export function extractPartFeatures(part: DesignPart, worldSpace = true): MateFeature[] {
  const features: MateFeature[] = [];
  const p = part.params || {};
  const kind = part.kind;

  // 1. T-Slot Aluminum Profile
  if (kind === 't-slot') {
    const size = p.series || p.width || 40;
    const length = p.length || p.extrudeDepth || 500;
    const spec = getTSlotSpec(size);
    const halfSize = size / 2;
    const halfLength = length / 2;

    // Center bore axis (running through extrusion length Y)
    features.push({
      kind: 'hole-axis',
      id: `${part.id}-center-bore`,
      name: `${part.name} ▸ Merkez Delik Ø${spec.bore}mm`,
      center: { x: 0, y: 0, z: 0 },
      axis: { x: 0, y: 1, z: 0 },
      radius: spec.bore / 2,
      depth: length,
    });

    // 4 Longitudinal Slot Channels
    // Front slot (+Z)
    features.push({
      kind: 'slot-channel',
      id: `${part.id}-slot-front`,
      name: `${part.name} ▸ Ön T-Kanal ${spec.slot}mm`,
      center: { x: 0, y: 0, z: halfSize },
      direction: { x: 0, y: 1, z: 0 },
      normal: { x: 0, y: 0, z: 1 },
      slotWidth: spec.slot,
      slotDepth: spec.headDepth,
    });

    // Back slot (-Z)
    features.push({
      kind: 'slot-channel',
      id: `${part.id}-slot-back`,
      name: `${part.name} ▸ Arka T-Kanal ${spec.slot}mm`,
      center: { x: 0, y: 0, z: -halfSize },
      direction: { x: 0, y: 1, z: 0 },
      normal: { x: 0, y: 0, z: -1 },
      slotWidth: spec.slot,
      slotDepth: spec.headDepth,
    });

    // Right slot (+X)
    features.push({
      kind: 'slot-channel',
      id: `${part.id}-slot-right`,
      name: `${part.name} ▸ Sağ T-Kanal ${spec.slot}mm`,
      center: { x: halfSize, y: 0, z: 0 },
      direction: { x: 0, y: 1, z: 0 },
      normal: { x: 1, y: 0, z: 0 },
      slotWidth: spec.slot,
      slotDepth: spec.headDepth,
    });

    // Left slot (-X)
    features.push({
      kind: 'slot-channel',
      id: `${part.id}-slot-left`,
      name: `${part.name} ▸ Sol T-Kanal ${spec.slot}mm`,
      center: { x: -halfSize, y: 0, z: 0 },
      direction: { x: 0, y: 1, z: 0 },
      normal: { x: -1, y: 0, z: 0 },
      slotWidth: spec.slot,
      slotDepth: spec.headDepth,
    });

    // 4 Outer planar faces (flush contact surface for brackets, plates, accessories)
    features.push(
      { kind: 'planar-face', id: `${part.id}-face-front`, name: `${part.name} ▸ Ön Dış Yüzey (+Z)`, origin: { x: 0, y: 0, z: halfSize }, normal: { x: 0, y: 0, z: 1 }, width: size, height: length },
      { kind: 'planar-face', id: `${part.id}-face-back`, name: `${part.name} ▸ Arka Dış Yüzey (-Z)`, origin: { x: 0, y: 0, z: -halfSize }, normal: { x: 0, y: 0, z: -1 }, width: size, height: length },
      { kind: 'planar-face', id: `${part.id}-face-right`, name: `${part.name} ▸ Sağ Dış Yüzey (+X)`, origin: { x: halfSize, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 }, width: size, height: length },
      { kind: 'planar-face', id: `${part.id}-face-left`, name: `${part.name} ▸ Sol Dış Yüzey (-X)`, origin: { x: -halfSize, y: 0, z: 0 }, normal: { x: -1, y: 0, z: 0 }, width: size, height: length }
    );

    // 2 End planar caps
    features.push({
      kind: 'planar-face',
      id: `${part.id}-end-top`,
      name: `${part.name} ▸ Üst Uç Yüzey (+Y)`,
      origin: { x: 0, y: halfLength, z: 0 },
      normal: { x: 0, y: 1, z: 0 },
      width: size,
      height: size,
    });

    features.push({
      kind: 'planar-face',
      id: `${part.id}-end-bottom`,
      name: `${part.name} ▸ Alt Uç Yüzey (-Y)`,
      origin: { x: 0, y: -halfLength, z: 0 },
      normal: { x: 0, y: -1, z: 0 },
      width: size,
      height: size,
    });
  }

  // 2. Custom 2D CAD Profile with Parametric Holes
  if (kind === 'profile' && part.profileRegion) {
    const depth = p.extrudeDepth || p.length || 20;
    const halfD = depth / 2;

    // End caps
    features.push({
      kind: 'planar-face',
      id: `${part.id}-cap-top`,
      name: `${part.name} ▸ Üst Yüzey (+Y)`,
      origin: { x: 0, y: halfD, z: 0 },
      normal: { x: 0, y: 1, z: 0 },
    });
    features.push({
      kind: 'planar-face',
      id: `${part.id}-cap-bottom`,
      name: `${part.name} ▸ Alt Yüzey (-Y)`,
      origin: { x: 0, y: -halfD, z: 0 },
      normal: { x: 0, y: -1, z: 0 },
    });

    // Extract exact cylindrical holes from ProfileLoop
    part.profileRegion.holes.forEach((holeLoop, hIdx) => {
      const circleEdge = holeLoop.edges.find((e) => e.kind === 'circle');
      if (circleEdge && circleEdge.kind === 'circle') {
        // 2D coords: (x, y) -> 3D coords: (x, 0, y)
        features.push({
          kind: 'hole-axis',
          id: `${part.id}-param-hole-${hIdx}`,
          name: `${part.name} ▸ CAD Deliği Ø${(circleEdge.radius * 2).toFixed(1)}mm`,
          center: { x: circleEdge.center.x, y: 0, z: circleEdge.center.y },
          axis: { x: 0, y: 1, z: 0 },
          radius: circleEdge.radius,
          depth,
        });
      }
    });
  }

  // 3. Hex Bolt Fastener
  if (kind === 'hex-bolt') {
    const dia = p.diameter || 10;
    const length = p.length || 40;
    const headH = dia * 0.65;
    features.push({
      kind: 'hole-axis',
      id: `${part.id}-shaft-axis`,
      name: `${part.name} ▸ Cıvata Şaftı M${dia}×${length}`,
      center: { x: 0, y: -length / 2, z: 0 },
      axis: { x: 0, y: 1, z: 0 },
      radius: dia / 2,
      depth: length,
    });
    // Underhead bearing face (clamps against plate or washer)
    features.push({
      kind: 'planar-face',
      id: `${part.id}-head-face-bottom`,
      name: `${part.name} ▸ Baş Altı Oturma Yüzeyi (-Y)`,
      origin: { x: 0, y: 0, z: 0 },
      normal: { x: 0, y: -1, z: 0 },
    });
    // Legacy alias for compatibility
    features.push({
      kind: 'planar-face',
      id: `${part.id}-head-face`,
      name: `${part.name} ▸ Baş Altı Oturma Yüzeyi`,
      origin: { x: 0, y: 0, z: 0 },
      normal: { x: 0, y: -1, z: 0 },
    });
    // Bolt head top face
    features.push({
      kind: 'planar-face',
      id: `${part.id}-head-face-top`,
      name: `${part.name} ▸ Baş Üst Yüzeyi (+Y)`,
      origin: { x: 0, y: headH, z: 0 },
      normal: { x: 0, y: 1, z: 0 },
    });
    // Bolt shaft tip
    features.push({
      kind: 'planar-face',
      id: `${part.id}-shaft-tip`,
      name: `${part.name} ▸ Şaft Ucu (-Y)`,
      origin: { x: 0, y: -length, z: 0 },
      normal: { x: 0, y: -1, z: 0 },
    });
  }

  // 4. Hex Nut Fastener
  if (kind === 'hex-nut') {
    const dia = p.nominalDiameter || p.innerDiameter || p.diameter || 10;
    const depth = p.depth || p.height || (dia * 0.84) || 8;
    features.push({
      kind: 'hole-axis',
      id: `${part.id}-nut-bore`,
      name: `${part.name} ▸ Somun Diş Deliği M${dia}`,
      center: { x: 0, y: 0, z: 0 },
      axis: { x: 0, y: 1, z: 0 },
      radius: dia / 2,
      depth,
    });
    features.push({
      kind: 'planar-face',
      id: `${part.id}-nut-bearing-face-bottom`,
      name: `${part.name} ▸ Alt Oturma Yüzeyi (-Y)`,
      origin: { x: 0, y: -depth / 2, z: 0 },
      normal: { x: 0, y: -1, z: 0 },
    });
    features.push({
      kind: 'planar-face',
      id: `${part.id}-nut-bearing-face-top`,
      name: `${part.name} ▸ Üst Oturma Yüzeyi (+Y)`,
      origin: { x: 0, y: depth / 2, z: 0 },
      normal: { x: 0, y: 1, z: 0 },
    });
  }

  // 5. Plate with Center Hole
  if (kind === 'plate') {
    const w = p.width || 60;
    const h = p.height || 40;
    const d = p.depth || 6;
    const hr = p.holeRadius || 0;

    if (hr > 0.1) {
      features.push({
        kind: 'hole-axis',
        id: `${part.id}-center-hole`,
        name: `${part.name} ▸ Merkez Delik Ø${(hr * 2).toFixed(1)}mm`,
        center: { x: 0, y: 0, z: 0 },
        axis: { x: 0, y: 0, z: 1 },
        radius: hr,
        depth: d,
      });
    }

    // 6 Planar faces for Plate
    features.push(
      { kind: 'planar-face', id: `${part.id}-face-front`, name: `${part.name} ▸ Ön Yüzey (+Z)`, origin: { x: 0, y: 0, z: d / 2 }, normal: { x: 0, y: 0, z: 1 }, width: w, height: h },
      { kind: 'planar-face', id: `${part.id}-face-back`, name: `${part.name} ▸ Arka Yüzey (-Z)`, origin: { x: 0, y: 0, z: -d / 2 }, normal: { x: 0, y: 0, z: -1 }, width: w, height: h },
      { kind: 'planar-face', id: `${part.id}-face-top`, name: `${part.name} ▸ Üst Yüzey (+Y)`, origin: { x: 0, y: h / 2, z: 0 }, normal: { x: 0, y: 1, z: 0 }, width: w, height: d },
      { kind: 'planar-face', id: `${part.id}-face-bottom`, name: `${part.name} ▸ Alt Yüzey (-Y)`, origin: { x: 0, y: -h / 2, z: 0 }, normal: { x: 0, y: -1, z: 0 }, width: w, height: d },
      { kind: 'planar-face', id: `${part.id}-face-right`, name: `${part.name} ▸ Sağ Yüzey (+X)`, origin: { x: w / 2, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 }, width: d, height: h },
      { kind: 'planar-face', id: `${part.id}-face-left`, name: `${part.name} ▸ Sol Yüzey (-X)`, origin: { x: -w / 2, y: 0, z: 0 }, normal: { x: -1, y: 0, z: 0 }, width: d, height: h }
    );
  }

  // 6. Box / Rectangular Prismatic Body
  if (kind === 'box') {
    const w = p.width || 40;
    const h = p.height || 40;
    const d = p.depth || 20;
    const hw = w / 2, hh = h / 2, hd = d / 2;

    features.push(
      { kind: 'planar-face', id: `${part.id}-face-top`, name: `${part.name} ▸ Üst Yüzey / Top Face (+Y)`, origin: { x: 0, y: hh, z: 0 }, normal: { x: 0, y: 1, z: 0 }, width: w, height: d },
      { kind: 'planar-face', id: `${part.id}-face-bottom`, name: `${part.name} ▸ Alt Yüzey / Bottom Face (-Y)`, origin: { x: 0, y: -hh, z: 0 }, normal: { x: 0, y: -1, z: 0 }, width: w, height: d },
      { kind: 'planar-face', id: `${part.id}-face-front`, name: `${part.name} ▸ Ön Yüzey / Front Face (+Z)`, origin: { x: 0, y: 0, z: hd }, normal: { x: 0, y: 0, z: 1 }, width: w, height: h },
      { kind: 'planar-face', id: `${part.id}-face-back`, name: `${part.name} ▸ Arka Yüzey / Back Face (-Z)`, origin: { x: 0, y: 0, z: -hd }, normal: { x: 0, y: 0, z: -1 }, width: w, height: h },
      { kind: 'planar-face', id: `${part.id}-face-right`, name: `${part.name} ▸ Sağ Yüzey / Right Face (+X)`, origin: { x: hw, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 }, width: d, height: h },
      { kind: 'planar-face', id: `${part.id}-face-left`, name: `${part.name} ▸ Sol Yüzey / Left Face (-X)`, origin: { x: -hw, y: 0, z: 0 }, normal: { x: -1, y: 0, z: 0 }, width: d, height: h }
    );
  }

  // 7. Cylinder
  if (kind === 'cylinder') {
    const dia = p.diameter || 30;
    const len = p.length || 40;
    const r = dia / 2;
    const hl = len / 2;

    features.push(
      { kind: 'hole-axis', id: `${part.id}-cyl-axis`, name: `${part.name} ▸ Silindir Ekseni Ø${dia}mm`, center: { x: 0, y: 0, z: 0 }, axis: { x: 0, y: 1, z: 0 }, radius: r, depth: len },
      { kind: 'planar-face', id: `${part.id}-face-top`, name: `${part.name} ▸ Üst Yüzey (+Y)`, origin: { x: 0, y: hl, z: 0 }, normal: { x: 0, y: 1, z: 0 }, width: dia, height: dia },
      { kind: 'planar-face', id: `${part.id}-face-bottom`, name: `${part.name} ▸ Alt Yüzey (-Y)`, origin: { x: 0, y: -hl, z: 0 }, normal: { x: 0, y: -1, z: 0 }, width: dia, height: dia }
    );
  }

  // 8. Tube
  if (kind === 'tube') {
    const dia = p.diameter || 30;
    const wall = p.wall || 4;
    const len = p.length || 40;
    const innerDia = Math.max(2, dia - 2 * wall);
    const hl = len / 2;

    features.push(
      { kind: 'hole-axis', id: `${part.id}-tube-bore`, name: `${part.name} ▸ Boru İç Deliği Ø${innerDia}mm`, center: { x: 0, y: 0, z: 0 }, axis: { x: 0, y: 1, z: 0 }, radius: innerDia / 2, depth: len },
      { kind: 'hole-axis', id: `${part.id}-tube-outer`, name: `${part.name} ▸ Boru Dış Silindiri Ø${dia}mm`, center: { x: 0, y: 0, z: 0 }, axis: { x: 0, y: 1, z: 0 }, radius: dia / 2, depth: len },
      { kind: 'planar-face', id: `${part.id}-face-top`, name: `${part.name} ▸ Üst Alın Yüzeyi (+Y)`, origin: { x: 0, y: hl, z: 0 }, normal: { x: 0, y: 1, z: 0 }, width: dia, height: dia },
      { kind: 'planar-face', id: `${part.id}-face-bottom`, name: `${part.name} ▸ Alt Alın Yüzeyi (-Y)`, origin: { x: 0, y: -hl, z: 0 }, normal: { x: 0, y: -1, z: 0 }, width: dia, height: dia }
    );
  }

  // 9. Washer
  if (kind === 'washer') {
    const dia = p.diameter || 24;
    const innerDia = p.innerDiameter || 12;
    const d = p.depth || 3;
    const hd = d / 2;

    features.push(
      { kind: 'hole-axis', id: `${part.id}-washer-bore`, name: `${part.name} ▸ Pul İç Deliği Ø${innerDia}mm`, center: { x: 0, y: 0, z: 0 }, axis: { x: 0, y: 1, z: 0 }, radius: innerDia / 2, depth: d },
      { kind: 'planar-face', id: `${part.id}-face-top`, name: `${part.name} ▸ Üst Oturma Yüzeyi (+Y)`, origin: { x: 0, y: hd, z: 0 }, normal: { x: 0, y: 1, z: 0 }, width: dia, height: dia },
      { kind: 'planar-face', id: `${part.id}-face-bottom`, name: `${part.name} ▸ Alt Oturma Yüzeyi (-Y)`, origin: { x: 0, y: -hd, z: 0 }, normal: { x: 0, y: -1, z: 0 }, width: dia, height: dia }
    );
  }

  // 10. Gear Blank (Spur / Helical / Bevel Gear)
  if (kind === 'gear-blank') {
    const dia = p.diameter || (p.module && p.teeth ? p.module * p.teeth : 60);
    const bore = p.bore || p.innerDiameter || 15;
    const len = p.faceWidth || p.length || p.thickness || 20;
    const hl = len / 2;
    features.push(
      { kind: 'hole-axis', id: `${part.id}-center-bore`, name: `${part.name} ▸ Göbek Deliği Ø${bore}mm`, center: { x: 0, y: 0, z: 0 }, axis: { x: 0, y: 1, z: 0 }, radius: bore / 2, depth: len },
      { kind: 'hole-axis', id: `${part.id}-pitch-cylinder`, name: `${part.name} ▸ Dişli Çapı Ø${dia}mm`, center: { x: 0, y: 0, z: 0 }, axis: { x: 0, y: 1, z: 0 }, radius: dia / 2, depth: len },
      { kind: 'planar-face', id: `${part.id}-face-top`, name: `${part.name} ▸ Ön Alın Yüzeyi (+Y)`, origin: { x: 0, y: hl, z: 0 }, normal: { x: 0, y: 1, z: 0 }, width: dia, height: dia },
      { kind: 'planar-face', id: `${part.id}-face-bottom`, name: `${part.name} ▸ Arka Alın Yüzeyi (-Y)`, origin: { x: 0, y: -hl, z: 0 }, normal: { x: 0, y: -1, z: 0 }, width: dia, height: dia }
    );
  }

  // 11. Bearing Race (Deep Groove Ball Bearing / Roller Bearing)
  if (kind === 'bearing-race') {
    const outerDia = p.outerDiameter || p.diameter || 52;
    const innerDia = p.innerDiameter || p.bore || 25;
    const width = p.width || p.thickness || p.length || 15;
    const hw = width / 2;
    features.push(
      { kind: 'hole-axis', id: `${part.id}-bearing-inner`, name: `${part.name} ▸ Rulman İç Çapı Ø${innerDia}mm`, center: { x: 0, y: 0, z: 0 }, axis: { x: 0, y: 1, z: 0 }, radius: innerDia / 2, depth: width },
      { kind: 'hole-axis', id: `${part.id}-bearing-outer`, name: `${part.name} ▸ Rulman Dış Bileziği Ø${outerDia}mm`, center: { x: 0, y: 0, z: 0 }, axis: { x: 0, y: 1, z: 0 }, radius: outerDia / 2, depth: width },
      { kind: 'planar-face', id: `${part.id}-face-top`, name: `${part.name} ▸ Üst Alın (+Y)`, origin: { x: 0, y: hw, z: 0 }, normal: { x: 0, y: 1, z: 0 }, width: outerDia, height: outerDia },
      { kind: 'planar-face', id: `${part.id}-face-bottom`, name: `${part.name} ▸ Alt Alın (-Y)`, origin: { x: 0, y: -hw, z: 0 }, normal: { x: 0, y: -1, z: 0 }, width: outerDia, height: outerDia }
    );
  }

  // 12. Pulley
  if (kind === 'pulley') {
    const dia = p.diameter || 50;
    const bore = p.bore || p.innerDiameter || 12;
    const len = p.length || p.thickness || 25;
    const hl = len / 2;
    features.push(
      { kind: 'hole-axis', id: `${part.id}-pulley-bore`, name: `${part.name} ▸ Kasnak Deliği Ø${bore}mm`, center: { x: 0, y: 0, z: 0 }, axis: { x: 0, y: 1, z: 0 }, radius: bore / 2, depth: len },
      { kind: 'hole-axis', id: `${part.id}-pulley-rim`, name: `${part.name} ▸ Kasnak Dış Çapı Ø${dia}mm`, center: { x: 0, y: 0, z: 0 }, axis: { x: 0, y: 1, z: 0 }, radius: dia / 2, depth: len },
      { kind: 'planar-face', id: `${part.id}-face-top`, name: `${part.name} ▸ Ön Alın (+Y)`, origin: { x: 0, y: hl, z: 0 }, normal: { x: 0, y: 1, z: 0 }, width: dia, height: dia },
      { kind: 'planar-face', id: `${part.id}-face-bottom`, name: `${part.name} ▸ Arka Alın (-Y)`, origin: { x: 0, y: -hl, z: 0 }, normal: { x: 0, y: -1, z: 0 }, width: dia, height: dia }
    );
  }

  // 13. Keyway Shaft & D-Shaft
  if (kind === 'keyway-shaft' || kind === 'd-shaft') {
    const dia = p.diameter || 20;
    const len = p.length || 100;
    const hl = len / 2;
    features.push(
      { kind: 'hole-axis', id: `${part.id}-shaft-axis`, name: `${part.name} ▸ Mil Ekseni Ø${dia}mm`, center: { x: 0, y: 0, z: 0 }, axis: { x: 0, y: 1, z: 0 }, radius: dia / 2, depth: len },
      { kind: 'planar-face', id: `${part.id}-face-top`, name: `${part.name} ▸ Mil Ucu (+Y)`, origin: { x: 0, y: hl, z: 0 }, normal: { x: 0, y: 1, z: 0 }, width: dia, height: dia },
      { kind: 'planar-face', id: `${part.id}-face-bottom`, name: `${part.name} ▸ Mil Ucu (-Y)`, origin: { x: 0, y: -hl, z: 0 }, normal: { x: 0, y: -1, z: 0 }, width: dia, height: dia }
    );
  }

  // 10. Default / Fallback Bounding Planar Faces for ANY solid component (Custom profile, bracket, plate edges, etc.)
  const hasFaceTop = features.some((f) => f.id.endsWith('face-top') || f.id.endsWith('end-top') || f.id.endsWith('cap-top'));
  if (!hasFaceTop) {
    const w = p.width || p.size || (p.radius ? p.radius * 2 : 40);
    const h = p.height || p.extrudeDepth || p.length || 40;
    const d = p.depth || p.length || (p.radius ? p.radius * 2 : 20);
    const hw = w / 2, hh = h / 2, hd = d / 2;

    features.push(
      { kind: 'planar-face', id: `${part.id}-face-top`, name: `${part.name} Üst Yüzey (+Y)`, origin: { x: 0, y: hh, z: 0 }, normal: { x: 0, y: 1, z: 0 }, width: w, height: d },
      { kind: 'planar-face', id: `${part.id}-face-bottom`, name: `${part.name} Alt Yüzey (-Y)`, origin: { x: 0, y: -hh, z: 0 }, normal: { x: 0, y: -1, z: 0 }, width: w, height: d },
      { kind: 'planar-face', id: `${part.id}-face-front`, name: `${part.name} Ön Yüzey (+Z)`, origin: { x: 0, y: 0, z: hd }, normal: { x: 0, y: 0, z: 1 }, width: w, height: h },
      { kind: 'planar-face', id: `${part.id}-face-back`, name: `${part.name} Arka Yüzey (-Z)`, origin: { x: 0, y: 0, z: -hd }, normal: { x: 0, y: 0, z: -1 }, width: w, height: h },
      { kind: 'planar-face', id: `${part.id}-face-right`, name: `${part.name} Sağ Yüzey (+X)`, origin: { x: hw, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 }, width: d, height: h },
      { kind: 'planar-face', id: `${part.id}-face-left`, name: `${part.name} Sol Yüzey (-X)`, origin: { x: -hw, y: 0, z: 0 }, normal: { x: -1, y: 0, z: 0 }, width: d, height: h }
    );
  }

  // 10. Surface Holes attached via part.holes (HoleItem array)
  if (part.holes && part.holes.length > 0) {
    part.holes.forEach((h) => {
      const std = ISO_METRIC_HOLES.find((s) => s.size === h.size);
      const rad = std ? std.nominalDiameter / 2 : 3;
      const face = h.face || 'top';

      const pParams = part.params || {};
      const halfW = (pParams.width || 40) / 2;
      const halfH = (pParams.height || 40) / 2;
      const halfD = (pParams.depth || 20) / 2;

      let axis: Point3D = { x: 0, y: 1, z: 0 };
      let origin: Point3D = { x: h.x, y: halfH, z: h.y };

      if (face === 'top') {
        axis = { x: 0, y: 1, z: 0 };
        origin = { x: h.x, y: halfH, z: h.y };
      } else if (face === 'bottom') {
        axis = { x: 0, y: -1, z: 0 };
        origin = { x: h.x, y: -halfH, z: h.y };
      } else if (face === 'front') {
        axis = { x: 0, y: 0, z: 1 };
        origin = { x: h.x, y: h.y, z: halfD };
      } else if (face === 'back') {
        axis = { x: 0, y: 0, z: -1 };
        origin = { x: -h.x, y: h.y, z: -halfD };
      } else if (face === 'right') {
        axis = { x: 1, y: 0, z: 0 };
        origin = { x: halfW, y: h.y, z: h.x };
      } else if (face === 'left') {
        axis = { x: -1, y: 0, z: 0 };
        origin = { x: -halfW, y: h.y, z: -h.x };
      }

      const typeLabel = h.type === 'tap' ? 'Dişli Delik' : h.type === 'counterbore' ? 'Havşalı Delik' : 'Geçme Deliği';
      const faceLabel = face === 'top' ? 'Üst' : face === 'bottom' ? 'Alt' : face === 'front' ? 'Ön' : face === 'back' ? 'Arka' : face === 'right' ? 'Sağ' : 'Sol';

      features.push({
        kind: 'hole-axis',
        id: `${part.id}-hole-${h.id}`,
        name: `${part.name} ▸ ${h.size} ${typeLabel} (${faceLabel})`,
        center: origin,
        axis,
        radius: rad,
        depth: 30,
      });
    });
  }

  // Transform to World Space if requested
  if (worldSpace) {
    return features.map((f) => {
      if (f.kind === 'hole-axis') {
        return {
          ...f,
          center: localToWorld(f.center, part),
          axis: localVecToWorld(f.axis, part),
        };
      }
      if (f.kind === 'planar-face') {
        return {
          ...f,
          origin: localToWorld(f.origin, part),
          normal: localVecToWorld(f.normal, part),
        };
      }
      if (f.kind === 'slot-channel') {
        return {
          ...f,
          center: localToWorld(f.center, part),
          direction: localVecToWorld(f.direction, part),
          normal: localVecToWorld(f.normal, part),
        };
      }
      return f;
    });
  }

  return features;
}

/**
 * Classifies local normal vector into canonical part surface face ('top' | 'bottom' | 'front' | 'back' | 'right' | 'left').
 * Crucial: operates in LOCAL part coordinates so it is 100% rotation-invariant!
 */
export function classifySurfaceFaceFromLocalNormal(localNorm: { x: number; y: number; z: number }): 'top' | 'bottom' | 'front' | 'back' | 'right' | 'left' {
  const absX = Math.abs(localNorm.x);
  const absY = Math.abs(localNorm.y);
  const absZ = Math.abs(localNorm.z);

  if (absY >= absX && absY >= absZ) {
    return localNorm.y > 0 ? 'top' : 'bottom';
  } else if (absZ >= absX && absZ >= absY) {
    return localNorm.z > 0 ? 'front' : 'back';
  } else {
    return localNorm.x > 0 ? 'right' : 'left';
  }
}

/**
 * Infer recommended SolidWorks-equivalent mate kind from two selected features.
 */
export function inferSmartMateKind(featA?: MateFeature | null, featB?: MateFeature | null): MateKind {
  if (!featA || !featB) return 'coincident';
  const isAxisA = featA.kind === 'hole-axis';
  const isAxisB = featB.kind === 'hole-axis';
  const isPlaneA = featA.kind === 'planar-face';
  const isPlaneB = featB.kind === 'planar-face';
  const isSlotA = featA.kind === 'slot-channel';
  const isSlotB = featB.kind === 'slot-channel';

  // 1. Two Hole/Cylinder Axes -> CONCENTRIC (Eşmerkezli)
  if (isAxisA && isAxisB) return 'concentric';

  // 2. Two Planar Faces -> COINCIDENT (Çakışık)
  if (isPlaneA && isPlaneB) return 'coincident';

  // 3. One Axis + One Planar Face -> TANGENT (Teğet)
  if ((isAxisA && isPlaneB) || (isPlaneA && isAxisB)) return 'tangent';

  // 4. One Slot + One Axis -> CONCENTRIC (groove alignment)
  if ((isSlotA && isAxisB) || (isAxisA && isSlotB)) return 'concentric';

  // 5. One Slot + One Planar Face -> END-TO-SLOT
  if ((isSlotA && isPlaneB) || (isPlaneA && isSlotB)) return 'end-to-slot';

  return 'coincident';
}

/**
 * Returns recommended, compatible, and incompatible mate kinds for two features.
 */
export function getValidMateKinds(featA?: MateFeature | null, featB?: MateFeature | null): {
  recommended: MateKind;
  compatible: MateKind[];
  incompatible: MateKind[];
} {
  const recommended = inferSmartMateKind(featA, featB);
  const isAxisA = featA?.kind === 'hole-axis';
  const isAxisB = featB?.kind === 'hole-axis';
  const isPlaneA = featA?.kind === 'planar-face';
  const isPlaneB = featB?.kind === 'planar-face';
  const isSlotA = featA?.kind === 'slot-channel';
  const isSlotB = featB?.kind === 'slot-channel';

  if (isAxisA && isAxisB) {
    return {
      recommended: 'concentric',
      compatible: ['concentric', 'parallel', 'perpendicular', 'distance'],
      incompatible: ['coincident', 'tangent', 'end-to-slot'],
    };
  }

  if (isPlaneA && isPlaneB) {
    return {
      recommended: 'coincident',
      compatible: ['coincident', 'distance', 'parallel', 'perpendicular'],
      incompatible: ['concentric', 'tangent', 'end-to-slot'],
    };
  }

  if ((isAxisA && isPlaneB) || (isPlaneA && isAxisB)) {
    return {
      recommended: 'tangent',
      compatible: ['tangent', 'distance', 'parallel', 'perpendicular'],
      incompatible: ['concentric', 'coincident', 'end-to-slot'],
    };
  }

  if (isSlotA || isSlotB) {
    return {
      recommended: (isAxisA || isAxisB) ? 'concentric' : 'end-to-slot',
      compatible: ['end-to-slot', 'concentric', 'parallel', 'distance'],
      incompatible: ['perpendicular', 'tangent'],
    };
  }

  return {
    recommended: 'coincident',
    compatible: ['coincident', 'distance', 'parallel', 'perpendicular'],
    incompatible: ['concentric', 'tangent', 'end-to-slot'],
  };
}

/**
 * High-precision CAD Raycast Feature Classifier (SolidWorks / Inventor equivalent)
 * Resolves exact MateFeature from raycast hit point, mesh transform, and triangle normal.
 */
export function classifyFeatureFromRaycast(
  hitPointWorld: { x: number; y: number; z: number },
  faceNormalLocal: { x: number; y: number; z: number },
  mesh: any,
  part: DesignPart
): MateFeature | null {
  const localFeatures = extractPartFeatures(part, false);
  const worldFeatures = extractPartFeatures(part, true);
  if (!worldFeatures || worldFeatures.length === 0) return null;

  // 1. Transform hit point to part's local object space (in mm)
  let localHitX = 0;
  let localHitY = 0;
  let localHitZ = 0;

  if (mesh && typeof mesh.worldToLocal === 'function') {
    const v = new THREE.Vector3(hitPointWorld.x, hitPointWorld.y, hitPointWorld.z);
    mesh.worldToLocal(v);
    localHitX = v.x * 10; // convert Three.js units (cm) to mm
    localHitY = v.y * 10;
    localHitZ = v.z * 10;
  } else {
    localHitX = ((hitPointWorld.x * 10) - (part.position?.x || 0));
    localHitY = ((hitPointWorld.y * 10) - (part.position?.y || 0));
    localHitZ = ((hitPointWorld.z * 10) - (part.position?.z || 0));
  }

  // Normalized local face normal
  const normLen = Math.hypot(faceNormalLocal.x, faceNormalLocal.y, faceNormalLocal.z) || 1;
  const normX = faceNormalLocal.x / normLen;
  const normY = faceNormalLocal.y / normLen;
  const normZ = faceNormalLocal.z / normLen;

  // 2. High-Precision 3D Hole & Cylinder Axis Detection (Surface holes, plate holes, CAD profile holes, bores)
  const holeFeatures = localFeatures.filter((f): f is HoleAxisFeature => f.kind === 'hole-axis');
  let bestHole: HoleAxisFeature | null = null;
  let minHoleDist = Infinity;

  for (const hf of holeFeatures) {
    const vx = localHitX - hf.center.x;
    const vy = localHitY - hf.center.y;
    const vz = localHitZ - hf.center.z;

    const axisDot = vx * hf.axis.x + vy * hf.axis.y + vz * hf.axis.z;
    const perpX = vx - axisDot * hf.axis.x;
    const perpY = vy - axisDot * hf.axis.y;
    const perpZ = vz - axisDot * hf.axis.z;
    const distToAxis = Math.hypot(perpX, perpY, perpZ);

    const maxAxialSpan = (hf.depth || 50) / 2 + 15;
    if (Math.abs(axisDot) > maxAxialSpan) continue;

    // Cylinder normal alignment: normal is orthogonal to cylinder axis
    const normDot = Math.abs(normX * hf.axis.x + normY * hf.axis.y + normZ * hf.axis.z);
    // Bore wall: the surface normal is perpendicular to the axis and the hit lies ON the
    // cylinder (within tessellation tolerance) — not merely within 12 mm of it, which made
    // outer faces next to a hole select the hole instead of the face.
    const boreTol = Math.max(1.0, hf.radius * 0.35);
    const isBoreWall = normDot < 0.85 && Math.abs(distToAxis - hf.radius) <= boreTol;
    // Opening snap: proportional to the hole size (≈ one diameter around the axis). The old
    // fixed 16 mm minimum swallowed clicks on the planar face around small (M3–M8) holes.
    const snapRadius = Math.max(hf.radius * 2, hf.radius + 3);
    const isHoleOpening = normDot >= 0.85 && distToAxis <= snapRadius && Math.abs(axisDot) <= Math.max(2, (hf.depth || 0) / 2 + 2);

    if (isBoreWall || isHoleOpening) {
      if (distToAxis < minHoleDist) {
        minHoleDist = distToAxis;
        bestHole = hf;
      }
    }
  }

  if (bestHole) {
    const matchedWorld = worldFeatures.find((f) => f.id === bestHole!.id);
    if (matchedWorld) return matchedWorld;
  }

  // 3. T-Slot extrusion: check if end cap or one of the 4 longitudinal slots
  if (part.kind === 't-slot') {
    const p = part.params || {};
    const length = p.length || p.extrudeDepth || 500;
    const halfL = length / 2;

    if (Math.abs(localHitY) > halfL - 10 || Math.abs(normY) > 0.75) {
      const endKey = (localHitY > 0 || normY > 0) ? 'top' : 'bottom';
      const endFeature = worldFeatures.find((f) => (f.id.endsWith(`end-${endKey}`) || f.id.endsWith(`face-${endKey}`)) && f.kind === 'planar-face');
      if (endFeature) return endFeature;
    } else {
      const absX = Math.abs(localHitX);
      const absZ = Math.abs(localHitZ);
      let sideKey = 'front';
      if (absX >= absZ) {
        sideKey = localHitX > 0 ? 'right' : 'left';
      } else {
        sideKey = localHitZ > 0 ? 'front' : 'back';
      }

      // Return the slot channel by default for mechanical snap, or fallback to face
      const slotFeature = worldFeatures.find((f) => f.id.endsWith(`slot-${sideKey}`));
      if (slotFeature) return slotFeature;
      const faceFeature = worldFeatures.find((f) => f.id.endsWith(`face-${sideKey}`));
      if (faceFeature) return faceFeature;
    }
  }

  // 4. Cylindrical & Revolve components (Cylinder, Tube, Pulley, Washer, Fasteners, Gears, Bearings, Shafts)
  const isRotational =
    part.kind === 'cylinder' ||
    part.kind === 'tube' ||
    part.kind === 'pulley' ||
    part.kind === 'washer' ||
    part.kind === 'hex-bolt' ||
    part.kind === 'hex-nut' ||
    part.kind === 'gear-blank' ||
    part.kind === 'bearing-race' ||
    part.kind === 'keyway-shaft' ||
    part.kind === 'd-shaft';

  if (isRotational) {
    if (Math.abs(normY) < 0.65) {
      // Cylindrical outer/inner curvature -> Axis mate
      const axisFeature = worldFeatures.find((f) => f.kind === 'hole-axis');
      if (axisFeature) return axisFeature;
    } else {
      // Planar cap or bearing face
      const capKey = (normY > 0 || localHitY > 0) ? 'top' : 'bottom';
      const capFeature = worldFeatures.find(
        (f) =>
          (f.id.endsWith(`face-${capKey}`) ||
            f.id.includes(capKey) ||
            f.id.endsWith('head-face') ||
            f.id.endsWith('head-face-bottom') ||
            f.id.endsWith('head-face-top')) &&
          f.kind === 'planar-face'
      );
      if (capFeature) return capFeature;
    }
  }

  // 5. Best matching planar face based on surface normal vector alignment
  const planarFeatures = localFeatures.filter((f): f is PlanarFaceFeature => f.kind === 'planar-face');
  let bestPlanar: PlanarFaceFeature | null = null;
  let maxNormalDot = 0.55;

  for (const pf of planarFeatures) {
    const dotP = normX * pf.normal.x + normY * pf.normal.y + normZ * pf.normal.z;
    if (dotP > maxNormalDot) {
      maxNormalDot = dotP;
      bestPlanar = pf;
    }
  }

  if (bestPlanar) {
    const matchedWorld = worldFeatures.find((f) => f.id === bestPlanar!.id);
    if (matchedWorld) return matchedWorld;
  }

  // 6. Canonical face classification fallback
  const faceName = classifySurfaceFaceFromLocalNormal({ x: normX, y: normY, z: normZ });
  const matchedCanonical = worldFeatures.find((f) => f.id.endsWith(`face-${faceName}`) || f.id.endsWith(`cap-${faceName}`) || f.id.endsWith(`end-${faceName}`));
  if (matchedCanonical) return matchedCanonical;

  // 7. Guaranteed Fallback to any planar face or first world feature (NEVER return null on valid part click)
  const anyPlanar = worldFeatures.find((f) => f.kind === 'planar-face');
  return anyPlanar || worldFeatures[0] || null;
}

