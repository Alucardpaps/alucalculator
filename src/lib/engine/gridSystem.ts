/**
 * AluCalc OS v5.0 — Grid System
 *
 * Grid-based snapping and axis constraint utilities.
 * Pure functions — no state, no React.
 */

import type { Vec3 } from '@/lib/types/v5-types';

// ════════════════════════════════════════════
// Grid Presets
// ════════════════════════════════════════════

export const GRID_PRESETS = {
  fine: 0.05,     // 50mm precision (for detail work)
  standard: 0.25, // 250mm precision (default)
  coarse: 0.5,    // 500mm precision (large structures)
  metric: 1.0,    // 1m precision (architectural)
} as const;

export type GridPreset = keyof typeof GRID_PRESETS;

// ════════════════════════════════════════════
// Grid Snap
// ════════════════════════════════════════════

/**
 * Snap a 3D position to the nearest grid point.
 */
export function snapToGrid(position: Vec3, gridSize: number): Vec3 {
  if (gridSize <= 0) return position;

  return [
    Math.round(position[0] / gridSize) * gridSize,
    Math.round(position[1] / gridSize) * gridSize,
    Math.round(position[2] / gridSize) * gridSize,
  ];
}

/**
 * Snap only the XZ plane (keep Y unchanged — useful for ground-plane work).
 */
export function snapToGridXZ(position: Vec3, gridSize: number): Vec3 {
  if (gridSize <= 0) return position;

  return [
    Math.round(position[0] / gridSize) * gridSize,
    position[1],
    Math.round(position[2] / gridSize) * gridSize,
  ];
}

// ════════════════════════════════════════════
// Axis Lock
// ════════════════════════════════════════════

/**
 * Lock movement to a single axis from an origin point.
 */
export function lockToAxis(
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

/**
 * Lock movement to a plane defined by two axes.
 */
export function lockToPlane(
  position: Vec3,
  origin: Vec3,
  plane: 'xy' | 'xz' | 'yz'
): Vec3 {
  switch (plane) {
    case 'xy':
      return [position[0], position[1], origin[2]];
    case 'xz':
      return [position[0], origin[1], position[2]];
    case 'yz':
      return [origin[0], position[1], position[2]];
  }
}

// ════════════════════════════════════════════
// Grid Visual Helpers
// ════════════════════════════════════════════

/**
 * Generate grid line positions for rendering.
 * Returns arrays of start/end points for grid lines.
 */
export function generateGridLines(
  size: number,
  divisions: number
): { horizontal: Vec3[][]; vertical: Vec3[][] } {
  const step = size / divisions;
  const halfSize = size / 2;
  const horizontal: Vec3[][] = [];
  const vertical: Vec3[][] = [];

  for (let i = 0; i <= divisions; i++) {
    const pos = -halfSize + i * step;

    // Horizontal lines (along X)
    horizontal.push([
      [-halfSize, 0, pos],
      [halfSize, 0, pos],
    ]);

    // Vertical lines (along Z)
    vertical.push([
      [pos, 0, -halfSize],
      [pos, 0, halfSize],
    ]);
  }

  return { horizontal, vertical };
}

// ════════════════════════════════════════════
// Distance Utilities
// ════════════════════════════════════════════

/**
 * Calculate the distance from a point to the nearest grid point.
 */
export function distanceToGrid(position: Vec3, gridSize: number): number {
  const snapped = snapToGrid(position, gridSize);
  const dx = position[0] - snapped[0];
  const dy = position[1] - snapped[1];
  const dz = position[2] - snapped[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
