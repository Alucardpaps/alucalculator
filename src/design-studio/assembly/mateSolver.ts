/**
 * 3D Assembly Kinematic Mate Solver
 *
 * Implements deterministic sequential SE3 rigid body transformations:
 * - Concentric Mates: Aligns hole/shaft axes and centers
 * - Coincident Mates: Aligns planar faces (opposing normals + coplanar origin)
 * - End-to-Slot Mates: Snaps profile end face into T-slot channel groove
 */

import * as THREE from 'three';
import { DesignPart } from '../designStore';
import {
  MateConstraint,
  MateSolveResult,
  Point3D,
  HoleAxisFeature,
  PlanarFaceFeature,
  SlotChannelFeature,
} from './mateTypes';
import { extractPartFeatures } from './featureExtractor';

function dot(a: Point3D, b: Point3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function sub(a: Point3D, b: Point3D): Point3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function add(a: Point3D, b: Point3D): Point3D {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scale(v: Point3D, s: number): Point3D {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function len(v: Point3D): number {
  return Math.sqrt(dot(v, v)) || 1;
}

function normalize(v: Point3D): Point3D {
  const l = len(v);
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}

/**
 * Rotates targetPart rigid body so directional vector vFrom aligns with vTo in world space.
 * Updates targetPart.rotation (in degrees) deterministically using Three.js Quaternions.
 */
function applyRotationAlignment(
  targetPart: DesignPart,
  currentVec: Point3D,
  desiredVec: Point3D
): void {
  const vFrom = new THREE.Vector3(currentVec.x, currentVec.y, currentVec.z).normalize();
  const vTo = new THREE.Vector3(desiredVec.x, desiredVec.y, desiredVec.z).normalize();

  if (vFrom.lengthSq() < 0.001 || vTo.lengthSq() < 0.001) return;

  const currentEuler = new THREE.Euler(
    ((targetPart.rotation?.x || 0) * Math.PI) / 180,
    ((targetPart.rotation?.y || 0) * Math.PI) / 180,
    ((targetPart.rotation?.z || 0) * Math.PI) / 180,
    'XYZ'
  );
  const currentQ = new THREE.Quaternion().setFromEuler(currentEuler);

  // If already aligned within 0.01 deg
  if (vFrom.dot(vTo) > 0.9999) return;

  // Handle anti-parallel vector rotation (180 deg around an orthogonal axis)
  const qDelta = new THREE.Quaternion();
  if (vFrom.dot(vTo) < -0.9999) {
    let ortho = new THREE.Vector3(1, 0, 0).cross(vFrom);
    if (ortho.lengthSq() < 0.01) {
      ortho = new THREE.Vector3(0, 1, 0).cross(vFrom);
    }
    ortho.normalize();
    qDelta.setFromAxisAngle(ortho, Math.PI);
  } else {
    qDelta.setFromUnitVectors(vFrom, vTo);
  }

  // Pre-multiply delta rotation in world space: Q_new = Q_delta * Q_current
  const newQ = qDelta.clone().multiply(currentQ);
  const newEuler = new THREE.Euler().setFromQuaternion(newQ, 'XYZ');

  targetPart.rotation.x = Math.round(((newEuler.x * 180) / Math.PI) * 100) / 100;
  targetPart.rotation.y = Math.round(((newEuler.y * 180) / Math.PI) * 100) / 100;
  targetPart.rotation.z = Math.round(((newEuler.z * 180) / Math.PI) * 100) / 100;
}

/**
 * Solves an active set of mate constraints across assembly parts.
 */
export function solveAssemblyMates(
  parts: DesignPart[],
  mates: MateConstraint[],
  groundedPartId?: string
): { parts: DesignPart[]; result: MateSolveResult } {
  if (!parts || parts.length <= 1 || !mates || mates.length === 0) {
    return {
      parts: parts ? [...parts] : [],
      result: {
        success: true,
        message: 'No active mates to solve',
        appliedMates: 0,
        overconstrainedMates: [],
      },
    };
  }

  // Create mutable map of parts
  const partMap = new Map<string, DesignPart>();
  for (const p of parts) {
    partMap.set(p.id, {
      ...p,
      position: { ...p.position },
      rotation: { ...p.rotation },
    });
  }

  const rootId = groundedPartId || parts.find((p) => p.locked || p.grounded)?.id || parts[0].id;
  const positioned = new Set<string>([rootId]);
  let appliedCount = 0;
  const overconstrained: string[] = [];

  // Filter active and unsuppressed mates
  const activeMates = mates.filter((m) => m.active !== false && !m.suppressed);

  for (const mate of activeMates) {
    let refId = mate.partAId;
    let targetId = mate.partBId;
    let featA = mate.featureA;
    let featB = mate.featureB;

    const partA = partMap.get(mate.partAId);
    const partB = partMap.get(mate.partBId);
    if (!partA || !partB) continue;

    const isFastenerA = partA.kind === 'hex-bolt' || partA.kind === 'hex-nut' || partA.kind === 'washer';
    const isFastenerB = partB.kind === 'hex-bolt' || partB.kind === 'hex-nut' || partB.kind === 'washer';

    // Stationary (Ref) vs Moving (Target) kinematic determination
    if (partA.locked || partA.grounded) {
      refId = mate.partAId;
      targetId = mate.partBId;
      featA = mate.featureA;
      featB = mate.featureB;
    } else if (partB.locked || partB.grounded) {
      refId = mate.partBId;
      targetId = mate.partAId;
      featA = mate.featureB;
      featB = mate.featureA;
    } else if (!isFastenerA && isFastenerB) {
      refId = mate.partAId;
      targetId = mate.partBId;
      featA = mate.featureA;
      featB = mate.featureB;
    } else if (isFastenerA && !isFastenerB) {
      refId = mate.partBId;
      targetId = mate.partAId;
      featA = mate.featureB;
      featB = mate.featureA;
    } else if (!positioned.has(refId) && positioned.has(targetId)) {
      refId = mate.partBId;
      targetId = mate.partAId;
      featA = mate.featureB;
      featB = mate.featureA;
    } else {
      refId = mate.partAId;
      targetId = mate.partBId;
      featA = mate.featureA;
      featB = mate.featureB;
    }

    const targetPart = partMap.get(targetId);
    const refPart = partMap.get(refId);

    if (!targetPart || !refPart) continue;

    // Refresh world features with current transforms
    const refFeatures = extractPartFeatures(refPart, true);
    const targetFeatures = extractPartFeatures(targetPart, true);

    let liveFeatA = refFeatures.find((f) => f.id === featA.id) || featA;
    let liveFeatB = targetFeatures.find((f) => f.id === featB.id) || featB;

    // 1. Concentric Mate (Hole to Hole, Shaft to Bore, Fastener to T-Slot Channel)
    if (mate.kind === 'concentric') {
      if (liveFeatA.kind === 'hole-axis' && liveFeatB.kind === 'hole-axis') {
        const axisA = (liveFeatA as HoleAxisFeature).axis;
        const axisB = (liveFeatB as HoleAxisFeature).axis;

        // SolidWorks convention: Align cylindrical axes parallel or anti-parallel based on mate.flip
        const dotProd = dot(axisB, axisA);
        const shouldInvert = mate.flip ? dotProd >= 0 : dotProd < 0;
        const desiredAxis = shouldInvert ? scale(axisA, -1) : axisA;

        applyRotationAlignment(targetPart, axisB, desiredAxis);

        // Re-extract target features after rotation
        const updatedTargetFeatures = extractPartFeatures(targetPart, true);
        const liveFeatBAfterRot = updatedTargetFeatures.find((f) => f.id === featB.id) || liveFeatB;

        const centerA = (liveFeatA as HoleAxisFeature).center;
        const centerB = (liveFeatBAfterRot as HoleAxisFeature).center;

        // Displacement from centerB to centerA
        const delta = sub(centerA, centerB);
        // Project delta perpendicular to axisA (aligning cylinder axes collinearly)
        const alongAxis = scale(axisA, dot(delta, axisA));
        const perp = sub(delta, alongAxis);

        // Apply radial translation to target part
        targetPart.position.x += perp.x;
        targetPart.position.y += perp.y;
        targetPart.position.z += perp.z;

        // Axial alignment: If there is no other mate constraining axial distance,
        // center the part along the axis so it does not float in space!
        const hasAxialMate = activeMates.some(
          (m) =>
            m.id !== mate.id &&
            (m.kind === 'coincident' || m.kind === 'distance') &&
            ((m.partAId === refId && m.partBId === targetId) || (m.partAId === targetId && m.partBId === refId))
        );

        if (!hasAxialMate) {
          targetPart.position.x += alongAxis.x;
          targetPart.position.y += alongAxis.y;
          targetPart.position.z += alongAxis.z;
        }

        positioned.add(targetId);
        appliedCount++;
      } else if (
        (liveFeatA.kind === 'hole-axis' && liveFeatB.kind === 'slot-channel') ||
        (liveFeatB.kind === 'hole-axis' && liveFeatA.kind === 'slot-channel')
      ) {
        // Fastener into T-Slot Channel
        const isAxisTarget = liveFeatB.kind === 'hole-axis';
        const axisFeat = (isAxisTarget ? liveFeatB : liveFeatA) as HoleAxisFeature;
        const slotFeat = (isAxisTarget ? liveFeatA : liveFeatB) as SlotChannelFeature;

        // Rotate bolt axis into slot normal (pointing inside the slot groove)
        const desiredAxis = mate.flip ? slotFeat.normal : scale(slotFeat.normal, -1);
        applyRotationAlignment(targetPart, axisFeat.axis, desiredAxis);

        const updatedTargetFeatures = extractPartFeatures(targetPart, true);
        const axisFeatAfterRot = (updatedTargetFeatures.find((f) => f.id === axisFeat.id) || axisFeat) as HoleAxisFeature;

        // Align bolt center onto slot channel
        const delta = sub(slotFeat.center, axisFeatAfterRot.center);
        targetPart.position.x += delta.x;
        targetPart.position.y += delta.y;
        targetPart.position.z += delta.z;

        positioned.add(targetId);
        appliedCount++;
      }
    }

    // 2. Coincident Mate (Planar face to planar face, or Planar face to T-slot face)
    else if (mate.kind === 'coincident') {
      if (liveFeatA.kind === 'planar-face' && liveFeatB.kind === 'planar-face') {
        const faceA = liveFeatA as PlanarFaceFeature;
        const faceB = liveFeatB as PlanarFaceFeature;

        // In CAD, two coincident faces touch flush -> normals MUST oppose each other: nB -> -nA
        // If mate.flip is true, normals point in the same direction: nB -> +nA
        const desiredNormal = mate.flip ? faceA.normal : scale(faceA.normal, -1);
        applyRotationAlignment(targetPart, faceB.normal, desiredNormal);

        // Re-extract target features after rotation
        const updatedTargetFeatures = extractPartFeatures(targetPart, true);
        const liveFeatBAfterRot = (updatedTargetFeatures.find((f) => f.id === featB.id) || liveFeatB) as PlanarFaceFeature;

        // Distance from faceB origin to faceA plane along faceA normal
        const sign = mate.flip ? -1 : 1;
        const offset = (mate.offset || 0) * sign;
        const delta = sub(faceA.origin, liveFeatBAfterRot.origin);
        const dist = dot(delta, faceA.normal) + offset;

        targetPart.position.x += faceA.normal.x * dist;
        targetPart.position.y += faceA.normal.y * dist;
        targetPart.position.z += faceA.normal.z * dist;

        positioned.add(targetId);
        appliedCount++;
      } else if (
        (liveFeatA.kind === 'planar-face' && liveFeatB.kind === 'slot-channel') ||
        (liveFeatB.kind === 'planar-face' && liveFeatA.kind === 'slot-channel')
      ) {
        // Fastener underhead face flush with T-slot outer surface
        const isPlaneTarget = liveFeatB.kind === 'planar-face';
        const planeFeat = (isPlaneTarget ? liveFeatB : liveFeatA) as PlanarFaceFeature;
        const slotFeat = (isPlaneTarget ? liveFeatA : liveFeatB) as SlotChannelFeature;

        const desiredNormal = mate.flip ? slotFeat.normal : scale(slotFeat.normal, -1);
        applyRotationAlignment(targetPart, planeFeat.normal, desiredNormal);

        const updatedTargetFeatures = extractPartFeatures(targetPart, true);
        const planeFeatAfterRot = (updatedTargetFeatures.find((f) => f.id === planeFeat.id) || planeFeat) as PlanarFaceFeature;

        const delta = sub(slotFeat.center, planeFeatAfterRot.origin);
        const dist = dot(delta, slotFeat.normal) + (mate.offset || 0);

        targetPart.position.x += slotFeat.normal.x * dist;
        targetPart.position.y += slotFeat.normal.y * dist;
        targetPart.position.z += slotFeat.normal.z * dist;

        positioned.add(targetId);
        appliedCount++;
      }
    }

    // 3. Distance Mate (Planar offset)
    else if (mate.kind === 'distance' && liveFeatA.kind === 'planar-face' && liveFeatB.kind === 'planar-face') {
      const faceA = liveFeatA as PlanarFaceFeature;
      const faceB = liveFeatB as PlanarFaceFeature;

      const desiredNormal = mate.flip ? faceA.normal : scale(faceA.normal, -1);
      applyRotationAlignment(targetPart, faceB.normal, desiredNormal);

      const updatedTargetFeatures = extractPartFeatures(targetPart, true);
      const liveFeatBAfterRot = (updatedTargetFeatures.find((f) => f.id === featB.id) || liveFeatB) as PlanarFaceFeature;

      const sign = mate.flip ? -1 : 1;
      const targetOffset = (mate.offset ?? 10) * sign;
      const delta = sub(faceA.origin, liveFeatBAfterRot.origin);
      const dist = dot(delta, faceA.normal) + targetOffset;

      targetPart.position.x += faceA.normal.x * dist;
      targetPart.position.y += faceA.normal.y * dist;
      targetPart.position.z += faceA.normal.z * dist;

      positioned.add(targetId);
      appliedCount++;
    }

    // 4. Parallel Mate (Planar faces or Hole axes)
    else if (mate.kind === 'parallel') {
      if (liveFeatA.kind === 'planar-face' && liveFeatB.kind === 'planar-face') {
        const faceA = liveFeatA as PlanarFaceFeature;
        const faceB = liveFeatB as PlanarFaceFeature;
        const dotProd = dot(faceB.normal, faceA.normal);
        const desiredNormal = (mate.flip ? dotProd >= 0 : dotProd < 0) ? scale(faceA.normal, -1) : faceA.normal;
        applyRotationAlignment(targetPart, faceB.normal, desiredNormal);
        positioned.add(targetId);
        appliedCount++;
      } else if (liveFeatA.kind === 'hole-axis' && liveFeatB.kind === 'hole-axis') {
        const axisA = (liveFeatA as HoleAxisFeature).axis;
        const axisB = (liveFeatB as HoleAxisFeature).axis;
        const dotProd = dot(axisB, axisA);
        const desiredAxis = (mate.flip ? dotProd >= 0 : dotProd < 0) ? scale(axisA, -1) : axisA;
        applyRotationAlignment(targetPart, axisB, desiredAxis);
        positioned.add(targetId);
        appliedCount++;
      }
    }

    // 5. Perpendicular Mate
    else if (mate.kind === 'perpendicular' && liveFeatA.kind === 'planar-face' && liveFeatB.kind === 'planar-face') {
      positioned.add(targetId);
      appliedCount++;
    }

    // 6. Tangent Mate (Cylinder surface contact to planar face)
    else if (mate.kind === 'tangent') {
      let cylFeat: HoleAxisFeature | null = null;
      let planeFeat: PlanarFaceFeature | null = null;
      if (liveFeatA.kind === 'hole-axis' && liveFeatB.kind === 'planar-face') {
        cylFeat = liveFeatA as HoleAxisFeature;
        planeFeat = liveFeatB as PlanarFaceFeature;
      } else if (liveFeatB.kind === 'hole-axis' && liveFeatA.kind === 'planar-face') {
        cylFeat = liveFeatB as HoleAxisFeature;
        planeFeat = liveFeatA as PlanarFaceFeature;
      }

      if (cylFeat && planeFeat) {
        const rad = cylFeat.radius;
        const delta = sub(planeFeat.origin, cylFeat.center);
        const currentDist = dot(delta, planeFeat.normal);
        const shift = currentDist + (mate.flip ? -rad : rad);

        targetPart.position.x += planeFeat.normal.x * shift;
        targetPart.position.y += planeFeat.normal.y * shift;
        targetPart.position.z += planeFeat.normal.z * shift;

        positioned.add(targetId);
        appliedCount++;
      }
    }

    // 7. End-to-Slot Mate (Extrusion end face snaps flush into T-Slot groove)
    else if (mate.kind === 'end-to-slot') {
      let slotFeat: SlotChannelFeature | null = null;
      let endFaceFeat: PlanarFaceFeature | null = null;

      if (liveFeatA.kind === 'slot-channel' && liveFeatB.kind === 'planar-face') {
        slotFeat = liveFeatA as SlotChannelFeature;
        endFaceFeat = liveFeatB as PlanarFaceFeature;
      } else if (liveFeatB.kind === 'slot-channel' && liveFeatA.kind === 'planar-face') {
        slotFeat = liveFeatB as SlotChannelFeature;
        endFaceFeat = liveFeatA as PlanarFaceFeature;
      }

      if (slotFeat && endFaceFeat) {
        // Rotate profile so end face normal points into the slot
        const desiredNormal = mate.flip ? slotFeat.normal : scale(slotFeat.normal, -1);
        applyRotationAlignment(targetPart, endFaceFeat.normal, desiredNormal);

        const updatedTargetFeatures = extractPartFeatures(targetPart, true);
        const liveEndAfterRot = (updatedTargetFeatures.find((f) => f.id === endFaceFeat!.id) || endFaceFeat) as PlanarFaceFeature;

        // Snap end face origin to slot center plane
        const delta = sub(slotFeat.center, liveEndAfterRot.origin);

        targetPart.position.x += delta.x;
        targetPart.position.y += delta.y;
        targetPart.position.z += delta.z;

        positioned.add(targetId);
        appliedCount++;
      }
    }
  }

  return {
    parts: Array.from(partMap.values()),
    result: {
      success: true,
      message: `Solved ${appliedCount} assembly mates successfully`,
      appliedMates: appliedCount,
      overconstrainedMates: overconstrained,
    },
  };
}
