/**
 * AluCalc OS v5.0 — FEA Stress Visualization Utilities
 *
 * Shared utilities for the FEA stress contour overlay system.
 * Used by ProfileMesh, BracketMesh, and BoltMesh to compute
 * deterministic per-component stress values and color ramps.
 */

import * as THREE from 'three';

/**
 * Von Mises rainbow color ramp:
 * Blue(0) → Cyan(0.25) → Green(0.5) → Yellow(0.75) → Red(1.0)
 *
 * @param normalizedStress - Value in [0, 1] representing stress intensity
 * @returns THREE.Color mapped to the stress rainbow
 */
export function stressToColor(normalizedStress: number): THREE.Color {
  const clamped = Math.max(0, Math.min(1, normalizedStress));
  const hue = (1.0 - clamped) * 0.7; // 0.7 = blue, 0.0 = red
  return new THREE.Color().setHSL(hue, 0.9, 0.5);
}

/**
 * Deterministic hash of a component ID to a normalized [0, 1] stress value.
 * Ensures each component gets a consistent but unique simulated stress.
 *
 * @param id - Component identifier string
 * @returns Normalized stress value in [0, 1]
 */
export function idToStress(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash % 1000) / 1000;
}

/** FEA material overrides when stress visualization is active */
export const FEA_MATERIAL_OVERRIDES = {
  metalness: 0.3,
  roughness: 0.6,
  opacity: 0.92,
  wireframeOpacity: 0.15,
  wireframeColor: '#ffffff',
} as const;
