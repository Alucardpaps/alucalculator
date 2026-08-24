/**
 * AluCalc OS v5.0 — Deterministic Snap Engine
 *
 * Pure math functions. Zero React. Zero side effects.
 * Given a dragged component + workspace state → returns corrected position.
 *
 * RULES:
 *   profile ↔ profile/bracket (end-to-end alignment)
 *   bracket ↔ profile (perpendicular mount)
 *   bolt ↔ profile/bracket (hole alignment)
 */

import type {
  WorkspaceComponent,
  ComponentType,
  Vec3,
  SnapResult,
  SnapConfig,
  ConnectionRule,
} from '@/lib/types/v5-types';

// ════════════════════════════════════════════
// Vector Math (minimal, inlined for zero deps)
// ════════════════════════════════════════════

function vec3Distance(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function vec3Sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function vec3Normalize(v: Vec3): Vec3 {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

function vec3Scale(v: Vec3, s: number): Vec3 {
  return [v[0] * s, v[1] * s, v[2] * s];
}

// ════════════════════════════════════════════
// Connection Point Calculation
// ════════════════════════════════════════════

/**
 * Returns the anchor points where a component can connect to others.
 * These are the faces/ends of the geometry depending on type.
 */
function getConnectionPoints(component: WorkspaceComponent): Vec3[] {
  const { position, type, metadata } = component;
  const halfLength = ((metadata.length ?? 200) / 1000) * 0.5; // Convert mm → world units (m/200 scale)

  switch (type) {
    case 'profile': {
      // Two endpoints along X axis
      return [
        [position[0] - halfLength, position[1], position[2]],
        [position[0] + halfLength, position[1], position[2]],
      ];
    }
    case 'bracket': {
      // Four faces of L-bracket
      return [
        [position[0], position[1] + 0.15, position[2]], // top
        [position[0], position[1] - 0.15, position[2]], // bottom
        [position[0] + 0.15, position[1], position[2]], // right
        [position[0] - 0.15, position[1], position[2]], // left
      ];
    }
    case 'bolt': {
      // Single point (tip of bolt)
      return [
        [position[0], position[1], position[2] - 0.1],
        [position[0], position[1], position[2] + 0.1],
      ];
    }
    default:
      return [position];
  }
}

// ════════════════════════════════════════════
// Core Snap Algorithm
// ════════════════════════════════════════════

/**
 * The main snap function. Called on every drag frame.
 *
 * @param draggedComponent - The component being dragged
 * @param dragPosition - Current mouse/pointer world position
 * @param allComponents - All components in workspace (excludes dragged)
 * @param rules - Connection rules (which types can connect)
 * @param config - Snap thresholds and settings
 * @returns SnapResult with corrected position
 */
export function calculateSnap(
  draggedComponent: WorkspaceComponent,
  dragPosition: Vec3,
  allComponents: WorkspaceComponent[],
  rules: ConnectionRule[],
  config: SnapConfig
): SnapResult {
  // If snapping is disabled, return raw position
  if (!config.enabled) {
    return {
      isSnapped: false,
      position: dragPosition,
      rotation: draggedComponent.rotation,
      targetId: null,
      distance: Infinity,
    };
  }

  // Find applicable rules for dragged type
  const applicableRule = rules.find((r) => r.source === draggedComponent.type);
  if (!applicableRule) {
    return {
      isSnapped: false,
      position: snapToGrid(dragPosition, config.gridSize),
      rotation: draggedComponent.rotation,
      targetId: null,
      distance: Infinity,
    };
  }

  // Exclude self and already-connected components
  const candidates = allComponents.filter(
    (c) =>
      c.id !== draggedComponent.id &&
      applicableRule.targets.includes(c.type)
  );

  // Find closest snap point
  let bestSnap: {
    distance: number;
    position: Vec3;
    rotation: Vec3;
    targetId: string;
  } | null = null;

  // Virtual dragged component at drag position for connection point calculation
  const virtualDragged: WorkspaceComponent = {
    ...draggedComponent,
    position: dragPosition,
  };
  const dragPoints = getConnectionPoints(virtualDragged);

  for (const candidate of candidates) {
    const candidatePoints = getConnectionPoints(candidate);

    for (const dragPt of dragPoints) {
      for (const candPt of candidatePoints) {
        const dist = vec3Distance(dragPt, candPt);

        if (dist < config.threshold && (!bestSnap || dist < bestSnap.distance)) {
          // Calculate the offset to snap the dragged component's connection point
          // to the candidate's connection point
          const offset = vec3Sub(candPt, dragPt);
          const snappedPosition = vec3Add(dragPosition, offset);

          // Calculate snap rotation based on axis alignment
          const snapRotation = calculateSnapRotation(
            draggedComponent,
            candidate,
            applicableRule.snapAxis
          );

          bestSnap = {
            distance: dist,
            position: snappedPosition,
            rotation: snapRotation,
            targetId: candidate.id,
          };
        }
      }
    }
  }

  if (bestSnap) {
    return {
      isSnapped: true,
      position: bestSnap.position,
      rotation: bestSnap.rotation,
      targetId: bestSnap.targetId,
      distance: bestSnap.distance,
    };
  }

  // No snap found — fall back to grid snap
  return {
    isSnapped: false,
    position: snapToGrid(dragPosition, config.gridSize),
    rotation: draggedComponent.rotation,
    targetId: null,
    distance: Infinity,
  };
}

// ════════════════════════════════════════════
// Snap Rotation
// ════════════════════════════════════════════

/**
 * Calculate the rotation needed for proper alignment when snapping.
 */
function calculateSnapRotation(
  source: WorkspaceComponent,
  target: WorkspaceComponent,
  snapAxis: 'x' | 'y' | 'z' | 'any'
): Vec3 {
  switch (snapAxis) {
    case 'x':
      // Align along X axis (profiles end-to-end)
      return target.rotation;

    case 'y':
      // Perpendicular mount
      return [target.rotation[0], target.rotation[1] + Math.PI / 2, target.rotation[2]];

    case 'z':
      // Bolt alignment (face the surface)
      return [Math.PI / 2, target.rotation[1], target.rotation[2]];

    case 'any':
    default:
      // Find the closest axis and align
      return target.rotation;
  }
}

// ════════════════════════════════════════════
// Grid Snap (fallback)
// ════════════════════════════════════════════

/**
 * Snap a position to the nearest grid point.
 */
export function snapToGrid(position: Vec3, gridSize: number): Vec3 {
  if (gridSize <= 0) return position;

  return [
    Math.round(position[0] / gridSize) * gridSize,
    Math.round(position[1] / gridSize) * gridSize,
    Math.round(position[2] / gridSize) * gridSize,
  ];
}

// ════════════════════════════════════════════
// Axis Constraint
// ════════════════════════════════════════════

/**
 * Constrain movement to a single axis.
 */
export function constrainToAxis(
  position: Vec3,
  origin: Vec3,
  axis: 'x' | 'y' | 'z'
): Vec3 {
  switch (axis) {
    case 'x':
      return [position[0], origin[1], origin[2]];
    case 'y':
      return [origin[0], position[1], origin[2]];
    case 'z':
      return [origin[0], origin[1], position[2]];
  }
}

// ════════════════════════════════════════════
// Proximity Check (for UI indicators)
// ════════════════════════════════════════════

/**
 * Check which components are within snap range of a position.
 * Used for visual feedback (glow, highlights).
 */
export function findNearbyComponents(
  position: Vec3,
  allComponents: WorkspaceComponent[],
  threshold: number
): Array<{ component: WorkspaceComponent; distance: number }> {
  const results: Array<{ component: WorkspaceComponent; distance: number }> = [];

  for (const comp of allComponents) {
    const dist = vec3Distance(position, comp.position);
    if (dist <= threshold) {
      results.push({ component: comp, distance: dist });
    }
  }

  // Sort by distance (closest first)
  results.sort((a, b) => a.distance - b.distance);
  return results;
}
