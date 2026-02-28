/**
 * AluCAD Kernel - Global Constants
 * 
 * CAD systems require precision math with tolerance-based comparisons.
 * These constants define the fundamental numerical tolerances.
 */

// ═══════════════════════════════════════════════════════════════
// NUMERICAL TOLERANCE
// ═══════════════════════════════════════════════════════════════

/** Primary epsilon for geometry comparisons */
export const EPSILON = 1e-6;

/** Tolerance for distance comparisons (in world units) */
export const DISTANCE_TOLERANCE = 1e-6;

/** Tolerance for angular comparisons (in radians) */
export const ANGLE_TOLERANCE = 1e-8;

/** Snap distance threshold (in screen pixels) */
export const SNAP_DISTANCE_PX = 15;

// ═══════════════════════════════════════════════════════════════
// WORLD UNITS
// ═══════════════════════════════════════════════════════════════

export type WorldUnit = 'mm' | 'cm' | 'm' | 'inch' | 'ft';

export const UNIT_SCALE: Record<WorldUnit, number> = {
    mm: 1,
    cm: 10,
    m: 1000,
    inch: 25.4,
    ft: 304.8
};

// ═══════════════════════════════════════════════════════════════
// GRID SETTINGS
// ═══════════════════════════════════════════════════════════════

/** Base grid spacing in world units */
export const BASE_GRID_SPACING = 10;

/** Major grid line interval */
export const MAJOR_GRID_INTERVAL = 5;

/** Grid zoom thresholds for adaptive density */
export const GRID_ZOOM_THRESHOLDS = [0.1, 0.25, 0.5, 1, 2, 5, 10, 25, 50];

// ═══════════════════════════════════════════════════════════════
// COLORS (CAD Standards)
// ═══════════════════════════════════════════════════════════════

export const CAD_COLORS = {
    // Standard AutoCAD Color Index (ACI)
    RED: '#FF0000',
    YELLOW: '#FFFF00',
    GREEN: '#00FF00',
    CYAN: '#00FFFF',
    BLUE: '#0000FF',
    MAGENTA: '#FF00FF',
    WHITE: '#FFFFFF',
    GRAY: '#808080',

    // UI Colors
    BACKGROUND: '#1a1a2e',
    GRID_MINOR: '#2a2a4a',
    GRID_MAJOR: '#3a3a5a',
    CROSSHAIR: '#00e5ff',
    SELECTION: '#00ff88',
    SNAP_MARKER: '#ffaa00',
    PREVIEW: '#00e5ff80'
} as const;

// ═══════════════════════════════════════════════════════════════
// LAYER DEFAULTS
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_LAYER = {
    id: 'layer-0',
    name: '0',
    color: CAD_COLORS.WHITE,
    visible: true,
    locked: false,
    frozen: false,
    lineType: 'CONTINUOUS',
    lineWeight: 1
};

// ═══════════════════════════════════════════════════════════════
// TOLERANCE UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Check if two numbers are equal within tolerance
 */
export function isEqual(a: number, b: number, tolerance = EPSILON): boolean {
    return Math.abs(a - b) <= tolerance;
}

/**
 * Check if a number is effectively zero
 */
export function isZero(n: number, tolerance = EPSILON): boolean {
    return Math.abs(n) <= tolerance;
}

/**
 * Clamp a value to a range
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Normalize angle to [0, 2π)
 */
export function normalizeAngle(angle: number): number {
    const twoPi = 2 * Math.PI;
    return ((angle % twoPi) + twoPi) % twoPi;
}

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
}
