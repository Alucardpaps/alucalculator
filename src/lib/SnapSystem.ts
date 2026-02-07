/**
 * Snap System - CAD-precision snapping engine
 * Handles grid, endpoint, midpoint, intersection, and perpendicular snaps
 */

import { Point, CADShape, SnapMode, SnapSettings } from '@/store/CADCanvasStore';

// ============================================
// Types
// ============================================

export interface SnapResult {
    snapped: boolean;
    point: Point;
    mode: SnapMode | null;
    sourceId?: string; // ID of the shape that was snapped to
}

export interface SnapIndicator {
    position: Point;
    mode: SnapMode;
}

// ============================================
// Utility Functions
// ============================================

const distance = (p1: Point, p2: Point): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

const getMidpoint = (p1: Point, p2: Point): Point => {
    return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2
    };
};

// ============================================
// Snap Functions
// ============================================

/**
 * Snap to grid
 */
export const snapToGrid = (
    point: Point,
    gridSize: number,
    viewport: { zoom: number; panX: number; panY: number }
): Point => {
    // Convert screen coordinates to world coordinates
    const worldX = (point.x - viewport.panX) / viewport.zoom;
    const worldY = (point.y - viewport.panY) / viewport.zoom;

    // Snap to grid
    const snappedX = Math.round(worldX / gridSize) * gridSize;
    const snappedY = Math.round(worldY / gridSize) * gridSize;

    // Convert back to screen coordinates
    return {
        x: snappedX * viewport.zoom + viewport.panX,
        y: snappedY * viewport.zoom + viewport.panY
    };
};

/**
 * Get all endpoints from shapes
 */
export const getEndpoints = (shapes: CADShape[]): { point: Point; shapeId: string }[] => {
    const endpoints: { point: Point; shapeId: string }[] = [];

    shapes.forEach(shape => {
        if (!shape.visible) return;

        switch (shape.type) {
            case 'line':
                shape.points.forEach(p => endpoints.push({ point: p, shapeId: shape.id }));
                break;
            case 'rectangle':
                // Rectangle stored as two corner points, expand to 4 corners
                if (shape.points.length >= 2) {
                    const [p1, p2] = shape.points;
                    endpoints.push(
                        { point: p1, shapeId: shape.id },
                        { point: { x: p2.x, y: p1.y }, shapeId: shape.id },
                        { point: p2, shapeId: shape.id },
                        { point: { x: p1.x, y: p2.y }, shapeId: shape.id }
                    );
                }
                break;
            case 'circle':
                // Circle center
                if (shape.points.length >= 1) {
                    endpoints.push({ point: shape.points[0], shapeId: shape.id });
                }
                break;
            case 'polyline':
                shape.points.forEach(p => endpoints.push({ point: p, shapeId: shape.id }));
                break;
        }
    });

    return endpoints;
};

/**
 * Get all midpoints from shapes
 */
export const getMidpoints = (shapes: CADShape[]): { point: Point; shapeId: string }[] => {
    const midpoints: { point: Point; shapeId: string }[] = [];

    shapes.forEach(shape => {
        if (!shape.visible) return;

        switch (shape.type) {
            case 'line':
                if (shape.points.length >= 2) {
                    midpoints.push({
                        point: getMidpoint(shape.points[0], shape.points[1]),
                        shapeId: shape.id
                    });
                }
                break;
            case 'rectangle':
                if (shape.points.length >= 2) {
                    const [p1, p2] = shape.points;
                    // Midpoints of all 4 edges
                    midpoints.push(
                        { point: getMidpoint(p1, { x: p2.x, y: p1.y }), shapeId: shape.id },
                        { point: getMidpoint({ x: p2.x, y: p1.y }, p2), shapeId: shape.id },
                        { point: getMidpoint(p2, { x: p1.x, y: p2.y }), shapeId: shape.id },
                        { point: getMidpoint({ x: p1.x, y: p2.y }, p1), shapeId: shape.id }
                    );
                }
                break;
            case 'polyline':
                for (let i = 0; i < shape.points.length - 1; i++) {
                    midpoints.push({
                        point: getMidpoint(shape.points[i], shape.points[i + 1]),
                        shapeId: shape.id
                    });
                }
                break;
        }
    });

    return midpoints;
};

/**
 * Find line-line intersection
 */
const lineLineIntersection = (
    p1: Point, p2: Point,
    p3: Point, p4: Point
): Point | null => {
    const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);

    if (Math.abs(denominator) < 0.0001) return null; // Parallel lines

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;

    // Check if intersection is within both line segments
    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        return {
            x: p1.x + ua * (p2.x - p1.x),
            y: p1.y + ua * (p2.y - p1.y)
        };
    }

    return null;
};

/**
 * Get all intersection points between shapes
 */
export const getIntersections = (shapes: CADShape[]): Point[] => {
    const intersections: Point[] = [];
    const lines: { p1: Point; p2: Point }[] = [];

    // Extract all line segments
    shapes.forEach(shape => {
        if (!shape.visible) return;

        switch (shape.type) {
            case 'line':
                if (shape.points.length >= 2) {
                    lines.push({ p1: shape.points[0], p2: shape.points[1] });
                }
                break;
            case 'rectangle':
                if (shape.points.length >= 2) {
                    const [a, c] = shape.points;
                    const b = { x: c.x, y: a.y };
                    const d = { x: a.x, y: c.y };
                    lines.push(
                        { p1: a, p2: b },
                        { p1: b, p2: c },
                        { p1: c, p2: d },
                        { p1: d, p2: a }
                    );
                }
                break;
            case 'polyline':
                for (let i = 0; i < shape.points.length - 1; i++) {
                    lines.push({ p1: shape.points[i], p2: shape.points[i + 1] });
                }
                break;
        }
    });

    // Find all intersections
    for (let i = 0; i < lines.length; i++) {
        for (let j = i + 1; j < lines.length; j++) {
            const intersection = lineLineIntersection(
                lines[i].p1, lines[i].p2,
                lines[j].p1, lines[j].p2
            );
            if (intersection) {
                intersections.push(intersection);
            }
        }
    }

    return intersections;
};

/**
 * Find the closest perpendicular point on a line segment
 */
const perpendicularPoint = (point: Point, lineStart: Point, lineEnd: Point): Point | null => {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) return null;

    const t = Math.max(0, Math.min(1,
        ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq
    ));

    return {
        x: lineStart.x + t * dx,
        y: lineStart.y + t * dy
    };
};

// ============================================
// Main Snap Engine
// ============================================

export class SnapEngine {
    private shapes: CADShape[];
    private settings: SnapSettings;
    private viewport: { zoom: number; panX: number; panY: number };

    constructor(
        shapes: CADShape[],
        settings: SnapSettings,
        viewport: { zoom: number; panX: number; panY: number }
    ) {
        this.shapes = shapes;
        this.settings = settings;
        this.viewport = viewport;
    }

    /**
     * Find the best snap point for a given cursor position
     */
    snap(cursorPoint: Point): SnapResult {
        if (!this.settings.enabled) {
            return { snapped: false, point: cursorPoint, mode: null };
        }

        const candidates: { point: Point; mode: SnapMode; distance: number; sourceId?: string }[] = [];
        const { snapRadius } = this.settings;

        // Check each enabled snap mode
        if (this.settings.modes.includes('endpoint')) {
            const endpoints = getEndpoints(this.shapes);
            endpoints.forEach(({ point, shapeId }) => {
                const d = distance(cursorPoint, point);
                if (d <= snapRadius) {
                    candidates.push({ point, mode: 'endpoint', distance: d, sourceId: shapeId });
                }
            });
        }

        if (this.settings.modes.includes('midpoint')) {
            const midpoints = getMidpoints(this.shapes);
            midpoints.forEach(({ point, shapeId }) => {
                const d = distance(cursorPoint, point);
                if (d <= snapRadius) {
                    candidates.push({ point, mode: 'midpoint', distance: d, sourceId: shapeId });
                }
            });
        }

        if (this.settings.modes.includes('intersection')) {
            const intersections = getIntersections(this.shapes);
            intersections.forEach(point => {
                const d = distance(cursorPoint, point);
                if (d <= snapRadius) {
                    candidates.push({ point, mode: 'intersection', distance: d });
                }
            });
        }

        // Grid snap (lower priority)
        if (this.settings.modes.includes('grid')) {
            const gridPoint = snapToGrid(cursorPoint, this.settings.gridSize, this.viewport);
            const d = distance(cursorPoint, gridPoint);
            if (d <= snapRadius) {
                candidates.push({ point: gridPoint, mode: 'grid', distance: d + 5 }); // +5 to lower priority
            }
        }

        // Sort by distance and return the closest
        if (candidates.length > 0) {
            candidates.sort((a, b) => a.distance - b.distance);
            const best = candidates[0];
            return {
                snapped: true,
                point: best.point,
                mode: best.mode,
                sourceId: best.sourceId
            };
        }

        return { snapped: false, point: cursorPoint, mode: null };
    }

    /**
     * Get snap indicator for UI display
     */
    getIndicator(cursorPoint: Point): SnapIndicator | null {
        const result = this.snap(cursorPoint);
        if (result.snapped && result.mode) {
            return {
                position: result.point,
                mode: result.mode
            };
        }
        return null;
    }
}

// ============================================
// Snap Indicator Symbols
// ============================================

export const SNAP_SYMBOLS: Record<SnapMode, { symbol: string; color: string }> = {
    'grid': { symbol: '⊞', color: '#888888' },
    'endpoint': { symbol: '□', color: '#00e5ff' },
    'midpoint': { symbol: '△', color: '#00ff88' },
    'intersection': { symbol: '×', color: '#ff8800' },
    'perpendicular': { symbol: '⊥', color: '#ff00ff' }
};
