/**
 * AluCAD — Spatial Index (Grid-Based Partitioning)
 * 
 * O(1) spatial lookups for snap engine, viewport culling, and entity selection.
 * Uses a uniform grid hash map — simpler and faster than R-tree for 2D CAD.
 * 
 * Usage:
 *   spatialIndex.rebuild(entities);
 *   const nearbyIds = spatialIndex.queryRadius(cursorWorld, snapTolerance);
 *   const visibleIds = spatialIndex.queryBBox(viewportBBox);
 */

import type { Point, CadEntity } from '../kernel/types';

// ============================================
// TYPES
// ============================================

export interface BBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

// ============================================
// SPATIAL INDEX
// ============================================

export class SpatialIndex {
    private cellSize: number;
    private grid = new Map<string, Set<string>>();
    private entityBBoxes = new Map<string, BBox>();

    constructor(cellSize = 100) {
        this.cellSize = cellSize;
    }

    // -------------------------------------------
    // CELL KEY HELPERS
    // -------------------------------------------

    private cellKey(cx: number, cy: number): string {
        return `${cx},${cy}`;
    }

    private worldToCell(x: number, y: number): [number, number] {
        return [
            Math.floor(x / this.cellSize),
            Math.floor(y / this.cellSize),
        ];
    }

    // -------------------------------------------
    // INSERT / REMOVE
    // -------------------------------------------

    insert(id: string, bbox: BBox): void {
        this.entityBBoxes.set(id, bbox);
        const [minCX, minCY] = this.worldToCell(bbox.minX, bbox.minY);
        const [maxCX, maxCY] = this.worldToCell(bbox.maxX, bbox.maxY);

        for (let cx = minCX; cx <= maxCX; cx++) {
            for (let cy = minCY; cy <= maxCY; cy++) {
                const key = this.cellKey(cx, cy);
                if (!this.grid.has(key)) {
                    this.grid.set(key, new Set());
                }
                this.grid.get(key)!.add(id);
            }
        }
    }

    remove(id: string): void {
        const bbox = this.entityBBoxes.get(id);
        if (!bbox) return;

        const [minCX, minCY] = this.worldToCell(bbox.minX, bbox.minY);
        const [maxCX, maxCY] = this.worldToCell(bbox.maxX, bbox.maxY);

        for (let cx = minCX; cx <= maxCX; cx++) {
            for (let cy = minCY; cy <= maxCY; cy++) {
                const key = this.cellKey(cx, cy);
                const cell = this.grid.get(key);
                if (cell) {
                    cell.delete(id);
                    if (cell.size === 0) this.grid.delete(key);
                }
            }
        }

        this.entityBBoxes.delete(id);
    }

    // -------------------------------------------
    // QUERIES
    // -------------------------------------------

    /**
     * Query all entity IDs whose bounding boxes overlap the given bbox.
     * Used for viewport culling and window/crossing selection.
     */
    queryBBox(bbox: BBox): string[] {
        const result = new Set<string>();
        const [minCX, minCY] = this.worldToCell(bbox.minX, bbox.minY);
        const [maxCX, maxCY] = this.worldToCell(bbox.maxX, bbox.maxY);

        for (let cx = minCX; cx <= maxCX; cx++) {
            for (let cy = minCY; cy <= maxCY; cy++) {
                const cell = this.grid.get(this.cellKey(cx, cy));
                if (cell) {
                    cell.forEach(id => {
                        // Fine-grained bbox overlap check
                        const eBBox = this.entityBBoxes.get(id);
                        if (eBBox && bboxOverlap(eBBox, bbox)) {
                            result.add(id);
                        }
                    });
                }
            }
        }

        return Array.from(result);
    }

    /**
     * Query all entity IDs within a circular radius of a point.
     * Used for snap lookups.
     */
    queryRadius(center: Point, radius: number): string[] {
        return this.queryBBox({
            minX: center.x - radius,
            minY: center.y - radius,
            maxX: center.x + radius,
            maxY: center.y + radius,
        });
    }

    // -------------------------------------------
    // BULK OPERATIONS
    // -------------------------------------------

    /**
     * Rebuild entire index from scratch.
     * Call after major entity changes or undo/redo.
     */
    rebuild(entities: CadEntity[]): void {
        this.clear();
        for (const entity of entities) {
            if (!entity.isVisible) continue;
            const bbox = computeEntityBBox(entity);
            if (bbox) {
                this.insert(entity.id, bbox);
            }
        }
    }

    /**
     * Clear all entries.
     */
    clear(): void {
        this.grid.clear();
        this.entityBBoxes.clear();
    }

    /**
     * Get total number of indexed entities.
     */
    get size(): number {
        return this.entityBBoxes.size;
    }

    /**
     * Update cell size (useful for dynamic zoom adaptation).
     */
    setCellSize(size: number): void {
        this.cellSize = size;
    }
}

// ============================================
// BBOX HELPERS
// ============================================

function bboxOverlap(a: BBox, b: BBox): boolean {
    return a.minX <= b.maxX && a.maxX >= b.minX &&
        a.minY <= b.maxY && a.maxY >= b.minY;
}

/**
 * Compute the axis-aligned bounding box for a CadEntity.
 */
export function computeEntityBBox(entity: CadEntity): BBox | null {
    const g = entity.geometry;

    switch (g.type) {
        case 'LINE':
            return {
                minX: Math.min(g.start.x, g.end.x),
                minY: Math.min(g.start.y, g.end.y),
                maxX: Math.max(g.start.x, g.end.x),
                maxY: Math.max(g.start.y, g.end.y),
            };

        case 'CIRCLE':
            return {
                minX: g.center.x - g.radius,
                minY: g.center.y - g.radius,
                maxX: g.center.x + g.radius,
                maxY: g.center.y + g.radius,
            };

        case 'ARC':
            // Conservative bbox — full circle extent
            return {
                minX: g.center.x - g.radius,
                minY: g.center.y - g.radius,
                maxX: g.center.x + g.radius,
                maxY: g.center.y + g.radius,
            };

        case 'POLYLINE': {
            if (g.vertices.length === 0) return null;
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;
            for (const v of g.vertices) {
                if (v.x < minX) minX = v.x;
                if (v.y < minY) minY = v.y;
                if (v.x > maxX) maxX = v.x;
                if (v.y > maxY) maxY = v.y;
            }
            return { minX, minY, maxX, maxY };
        }

        case 'POINT':
            return {
                minX: g.x - 1,
                minY: g.y - 1,
                maxX: g.x + 1,
                maxY: g.y + 1,
            };

        case 'DIMENSION':
            return {
                minX: Math.min(g.start.x, g.end.x, g.textPoint.x) - 20,
                minY: Math.min(g.start.y, g.end.y, g.textPoint.y) - 20,
                maxX: Math.max(g.start.x, g.end.x, g.textPoint.x) + 20,
                maxY: Math.max(g.start.y, g.end.y, g.textPoint.y) + 20,
            };

        case 'RECTANGLE': {
            // Simplified bounding box ignoring rotation for spatial index purposes (conservative)
            const rw = g.width / 2;
            const rh = g.height / 2;
            const maxR = Math.sqrt(rw * rw + rh * rh); 
            return {
                minX: g.center.x - maxR,
                minY: g.center.y - maxR,
                maxX: g.center.x + maxR,
                maxY: g.center.y + maxR,
            };
        }

        case 'HEXAGON':
            return {
                minX: g.center.x - g.radius,
                minY: g.center.y - g.radius,
                maxX: g.center.x + g.radius,
                maxY: g.center.y + g.radius,
            };

        default:
            return null;
    }
}

// ============================================
// SINGLETON
// ============================================

export const spatialIndex = new SpatialIndex();
