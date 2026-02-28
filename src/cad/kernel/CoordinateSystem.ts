/**
 * AluCAD Kernel - Coordinate System
 * 
 * Handles transformation between World Coordinate System (WCS)
 * and Screen coordinates. Essential for CAD precision.
 */

import { Point, Viewport } from './types';

// ═══════════════════════════════════════════════════════════════
// COORDINATE TRANSFORMATION
// ═══════════════════════════════════════════════════════════════

/**
 * Transform world coordinates to screen coordinates
 */
export function worldToScreen(worldPoint: Point, viewport: Viewport): Point {
    // Screen center
    const screenCenterX = viewport.width / 2;
    const screenCenterY = viewport.height / 2;

    // Delta from viewport center in world units
    const dx = worldPoint.x - viewport.center.x;
    const dy = worldPoint.y - viewport.center.y;

    // Transform to screen (Y-axis inverted in screen space)
    return {
        x: screenCenterX + dx * viewport.zoom,
        y: screenCenterY - dy * viewport.zoom // Y inverted
    };
}

/**
 * Transform screen coordinates to world coordinates
 */
export function screenToWorld(screenPoint: Point, viewport: Viewport): Point {
    // Screen center
    const screenCenterX = viewport.width / 2;
    const screenCenterY = viewport.height / 2;

    // Delta from screen center in pixels
    const dx = screenPoint.x - screenCenterX;
    const dy = screenPoint.y - screenCenterY;

    // Transform to world (Y-axis inverted)
    return {
        x: viewport.center.x + dx / viewport.zoom,
        y: viewport.center.y - dy / viewport.zoom // Y inverted
    };
}

/**
 * Get world distance from screen pixel distance
 */
export function screenToWorldDistance(screenPixels: number, zoom: number): number {
    return screenPixels / zoom;
}

/**
 * Get screen pixel distance from world distance
 */
export function worldToScreenDistance(worldUnits: number, zoom: number): number {
    return worldUnits * zoom;
}

// ═══════════════════════════════════════════════════════════════
// VIEWPORT MANIPULATION
// ═══════════════════════════════════════════════════════════════

/**
 * Pan the viewport by screen delta
 */
export function panViewport(
    viewport: Viewport,
    screenDeltaX: number,
    screenDeltaY: number
): Viewport {
    return {
        ...viewport,
        center: {
            x: viewport.center.x - screenDeltaX / viewport.zoom,
            y: viewport.center.y + screenDeltaY / viewport.zoom // Y inverted
        }
    };
}

/**
 * Zoom viewport around a screen point
 */
export function zoomViewportAt(
    viewport: Viewport,
    screenPoint: Point,
    zoomFactor: number
): Viewport {
    // World point under cursor before zoom
    const worldBefore = screenToWorld(screenPoint, viewport);

    // Apply zoom
    const newZoom = viewport.zoom * zoomFactor;

    // Clamp zoom to reasonable range
    const clampedZoom = Math.max(0.01, Math.min(1000, newZoom));

    // Calculate new center to keep worldBefore under cursor
    const newViewport: Viewport = { ...viewport, zoom: clampedZoom };
    const worldAfter = screenToWorld(screenPoint, newViewport);

    return {
        ...newViewport,
        center: {
            x: viewport.center.x + (worldBefore.x - worldAfter.x),
            y: viewport.center.y + (worldBefore.y - worldAfter.y)
        }
    };
}

/**
 * Zoom to fit a bounding box
 */
export function zoomToFit(
    viewport: Viewport,
    minWorld: Point,
    maxWorld: Point,
    margin: number = 0.1
): Viewport {
    const worldWidth = maxWorld.x - minWorld.x;
    const worldHeight = maxWorld.y - minWorld.y;

    if (worldWidth <= 0 || worldHeight <= 0) {
        return viewport;
    }

    // Calculate zoom to fit with margin
    const marginFactor = 1 - margin * 2;
    const zoomX = (viewport.width * marginFactor) / worldWidth;
    const zoomY = (viewport.height * marginFactor) / worldHeight;
    const newZoom = Math.min(zoomX, zoomY);

    // Center of bounding box
    const newCenter: Point = {
        x: (minWorld.x + maxWorld.x) / 2,
        y: (minWorld.y + maxWorld.y) / 2
    };

    return {
        ...viewport,
        center: newCenter,
        zoom: newZoom
    };
}

/**
 * Reset viewport to origin with default zoom
 */
export function resetViewport(viewport: Viewport): Viewport {
    return {
        ...viewport,
        center: { x: 0, y: 0 },
        zoom: 1
    };
}

// ═══════════════════════════════════════════════════════════════
// GRID CALCULATION
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate adaptive grid spacing based on zoom level
 */
export function calculateGridSpacing(zoom: number, baseSpacing: number = 10): number {
    // Target ~50-100 pixels between grid lines
    const targetPixelSpacing = 75;
    const worldSpacing = targetPixelSpacing / zoom;

    // Round to nice numbers (1, 2, 5, 10, 20, 50, 100, etc.)
    const magnitude = Math.pow(10, Math.floor(Math.log10(worldSpacing)));
    const normalized = worldSpacing / magnitude;

    let niceSpacing: number;
    if (normalized < 1.5) niceSpacing = 1;
    else if (normalized < 3.5) niceSpacing = 2;
    else if (normalized < 7.5) niceSpacing = 5;
    else niceSpacing = 10;

    return niceSpacing * magnitude;
}

/**
 * Get visible grid lines for current viewport
 */
export function getVisibleGridLines(
    viewport: Viewport,
    spacing: number,
    majorInterval: number = 5
): { vertical: { x: number; isMajor: boolean }[]; horizontal: { y: number; isMajor: boolean }[] } {
    // Calculate visible world bounds
    const halfWidth = viewport.width / 2 / viewport.zoom;
    const halfHeight = viewport.height / 2 / viewport.zoom;

    const minX = viewport.center.x - halfWidth;
    const maxX = viewport.center.x + halfWidth;
    const minY = viewport.center.y - halfHeight;
    const maxY = viewport.center.y + halfHeight;

    // Round to grid
    const startX = Math.floor(minX / spacing) * spacing;
    const startY = Math.floor(minY / spacing) * spacing;

    const vertical: { x: number; isMajor: boolean }[] = [];
    const horizontal: { y: number; isMajor: boolean }[] = [];

    // Safety limit to prevent freeze/black screen on extreme zooms
    const MAX_GRID_LINES = 2000;
    let count = 0;

    // Vertical lines
    for (let x = startX; x <= maxX; x += spacing) {
        if (count++ > MAX_GRID_LINES) break;
        const gridIndex = Math.round(x / spacing);
        vertical.push({ x, isMajor: gridIndex % majorInterval === 0 });
    }

    count = 0;
    // Horizontal lines
    for (let y = startY; y <= maxY; y += spacing) {
        if (count++ > MAX_GRID_LINES) break;
        const gridIndex = Math.round(y / spacing);
        horizontal.push({ y, isMajor: gridIndex % majorInterval === 0 });
    }

    return { vertical, horizontal };
}

// ═══════════════════════════════════════════════════════════════
// CURSOR UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Snap point to grid
 */
export function snapToGrid(worldPoint: Point, gridSpacing: number): Point {
    return {
        x: Math.round(worldPoint.x / gridSpacing) * gridSpacing,
        y: Math.round(worldPoint.y / gridSpacing) * gridSpacing
    };
}

/**
 * Constrain point to ortho (horizontal or vertical from origin)
 */
export function constrainToOrtho(current: Point, origin: Point): Point {
    const dx = Math.abs(current.x - origin.x);
    const dy = Math.abs(current.y - origin.y);

    if (dx > dy) {
        // Horizontal constraint
        return { x: current.x, y: origin.y };
    } else {
        // Vertical constraint
        return { x: origin.x, y: current.y };
    }
}

/**
 * Constrain point to polar angle increments
 */
export function constrainToPolar(
    current: Point,
    origin: Point,
    angleIncrement: number = Math.PI / 4 // 45°
): Point {
    const dx = current.x - origin.x;
    const dy = current.y - origin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.001) return current;

    // Current angle
    const angle = Math.atan2(dy, dx);

    // Snap to nearest increment
    const snappedAngle = Math.round(angle / angleIncrement) * angleIncrement;

    return {
        x: origin.x + dist * Math.cos(snappedAngle),
        y: origin.y + dist * Math.sin(snappedAngle)
    };
}
