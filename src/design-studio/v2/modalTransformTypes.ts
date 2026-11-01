/**
 * 🎯 BLENDER-STYLE MODAL TRANSFORM TYPES & STATE
 * 
 * Supports Blender-like modal manipulation (Grab, Rotate, Scale)
 * with single-axis lock (X, Y, Z), plane locks (Shift+Z / XY, Shift+Y / XZ, Shift+X / YZ),
 * and direct numeric keyboard entry (e.g. G -> X -> 50 -> Enter).
 */

export type ModalTransformMode = 'translate' | 'rotate' | 'scale';
export type ModalAxisLock = 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz' | null;

export interface ModalTransformSnapshot {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export interface ModalTransformState {
  active: boolean;
  mode: ModalTransformMode | null;
  axisLock: ModalAxisLock;
  numericBuffer: string;
  initialSnapshot: ModalTransformSnapshot | null;
  partId: string | null;
  partName: string;
  currentDelta: number;
}

export const INITIAL_MODAL_TRANSFORM_STATE: ModalTransformState = {
  active: false,
  mode: null,
  axisLock: null,
  numericBuffer: '',
  initialSnapshot: null,
  partId: null,
  partName: '',
  currentDelta: 0,
};

/**
 * Calculates updated 3D transform based on active modal mode, locked axis, and delta value.
 */
export function computeModalTransform(
  snapshot: ModalTransformSnapshot,
  mode: ModalTransformMode,
  axisLock: ModalAxisLock,
  delta: number
): {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
} {
  const pos = { ...snapshot.position };
  const rot = { ...snapshot.rotation };
  const scl = { ...snapshot.scale };

  if (mode === 'translate') {
    switch (axisLock) {
      case 'x':
        pos.x += delta;
        break;
      case 'y':
        pos.y += delta;
        break;
      case 'z':
        pos.z += delta;
        break;
      case 'xy':
        pos.x += delta;
        pos.y += delta;
        break;
      case 'xz':
        pos.x += delta;
        pos.z += delta;
        break;
      case 'yz':
        pos.y += delta;
        pos.z += delta;
        break;
      default:
        // Free translation along X & Y default plane if no axis specified
        pos.x += delta;
        pos.y += delta;
        break;
    }
  } else if (mode === 'rotate') {
    // Default rotation axis is Z if null
    const rotAxis = axisLock === 'x' ? 'x' : axisLock === 'y' ? 'y' : 'z';
    rot[rotAxis] = (rot[rotAxis] + delta) % 360;
  } else if (mode === 'scale') {
    // Delta for scale is multiplicative factor (e.g. delta = 1.5 -> scale = 1.5x)
    const factor = Math.max(0.01, delta);
    if (!axisLock) {
      scl.x = Math.round(snapshot.scale.x * factor * 1000) / 1000;
      scl.y = Math.round(snapshot.scale.y * factor * 1000) / 1000;
      scl.z = Math.round(snapshot.scale.z * factor * 1000) / 1000;
    } else if (axisLock === 'x') {
      scl.x = Math.round(snapshot.scale.x * factor * 1000) / 1000;
    } else if (axisLock === 'y') {
      scl.y = Math.round(snapshot.scale.y * factor * 1000) / 1000;
    } else if (axisLock === 'z') {
      scl.z = Math.round(snapshot.scale.z * factor * 1000) / 1000;
    }
  }

  return { position: pos, rotation: rot, scale: scl };
}
