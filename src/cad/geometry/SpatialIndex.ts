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
            const rw = (g.width || 0) / 2;
            const rh = (g.height || 0) / 2;
            const cx = g.center ? g.center.x : ((g as any).x ?? 0) + rw;
            const cy = g.center ? g.center.y : ((g as any).y ?? 0) + rh;
            const maxR = Math.sqrt(rw * rw + rh * rh); 
            return {
                minX: cx - maxR,
                minY: cy - maxR,
                maxX: cx + maxR,
                maxY: cy + maxR,
            };
        }

        case 'HEXAGON': {
            const cx = g.center ? g.center.x : ((g as any).x ?? 0);
            const cy = g.center ? g.center.y : ((g as any).y ?? 0);
            const r = g.radius || 10;
            return {
                minX: cx - r,
                minY: cy - r,
                maxX: cx + r,
                maxY: cy + r,
            };
        }

        case 'GEAR': {
            const gAny = g as any;
            if (!gAny.center) return null;
            const mod = gAny.module || 2;
            const teeth = gAny.teeth || 20;
            const rOuter = (mod * (teeth + 2)) / 2;
            return {
                minX: gAny.center.x - rOuter,
                minY: gAny.center.y - rOuter,
                maxX: gAny.center.x + rOuter,
                maxY: gAny.center.y + rOuter,
            };
        }

        case 'FASTENER': {
            const gFast = g as any;
            const reach = Math.max(gFast.diameter * 2.2, (gFast.length || gFast.diameter) + gFast.diameter * 1.5);
            return {
                minX: gFast.origin.x - reach,
                minY: gFast.origin.y - reach,
                maxX: gFast.origin.x + reach,
                maxY: gFast.origin.y + reach,
            };
        }

        case 'BELT_PULLEY': {
            const gBelt = g as any;
            const allX = [gBelt.center1.x - gBelt.radius1, gBelt.center1.x + gBelt.radius1, gBelt.center2.x - gBelt.radius2, gBelt.center2.x + gBelt.radius2];
            const allY = [gBelt.center1.y - gBelt.radius1, gBelt.center1.y + gBelt.radius1, gBelt.center2.y - gBelt.radius2, gBelt.center2.y + gBelt.radius2];
            return {
                minX: Math.min(...allX),
                minY: Math.min(...allY),
                maxX: Math.max(...allX),
                maxY: Math.max(...allY),
            };
        }

        case 'PLANETARY_GEAR': {
            const gPlan = g as any;
            const ringTeeth = gPlan.sunTeeth + 2 * gPlan.planetTeeth;
            const rRing = (gPlan.module * (ringTeeth + 2)) / 2;
            return {
                minX: gPlan.center.x - rRing,
                minY: gPlan.center.y - rRing,
                maxX: gPlan.center.x + rRing,
                maxY: gPlan.center.y + rRing,
            };
        }

        case 'SPROCKET': {
            const gSprocket = g as any;
            if (!gSprocket.center) return null;
            const z = Math.max(6, gSprocket.teeth || 19);
            const p = Math.max(2, gSprocket.pitch || 12.7);
            const pitchRadius = (p / Math.sin(Math.PI / z)) / 2;
            const rOuter = pitchRadius + p * 0.6;
            return {
                minX: gSprocket.center.x - rOuter,
                minY: gSprocket.center.y - rOuter,
                maxX: gSprocket.center.x + rOuter,
                maxY: gSprocket.center.y + rOuter,
            };
        }

        case 'TEXT': {
            const gText = g as any;
            if (!gText.position) return null;
            const fontSize = Math.max(12, gText.fontSize || 14);
            const textLen = Math.max(8, (gText.content?.length || 8));
            const span = Math.max(fontSize * textLen, 80);
            return {
                minX: gText.position.x - span,
                minY: gText.position.y - span,
                maxX: gText.position.x + span,
                maxY: gText.position.y + span,
            };
        }

        case 'LEADER': {
            const gLead = g as any;
            if (!gLead.start || !gLead.end) return null;
            const minX = Math.min(gLead.start.x, gLead.end.x) - 50;
            const minY = Math.min(gLead.start.y, gLead.end.y) - 50;
            const maxX = Math.max(gLead.start.x, gLead.end.x) + 150;
            const maxY = Math.max(gLead.start.y, gLead.end.y) + 50;
            return { minX, minY, maxX, maxY };
        }

        case 'ELLIPSE': {
            const gEl = g as any;
            const maxR = Math.max(gEl.radiusX || 10, gEl.radiusY || 10);
            return {
                minX: gEl.center.x - maxR,
                minY: gEl.center.y - maxR,
                maxX: gEl.center.x + maxR,
                maxY: gEl.center.y + maxR,
            };
        }

        case 'SPLINE': {
            const gSpl = g as any;
            if (!gSpl.controlPoints || gSpl.controlPoints.length === 0) return null;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const p of gSpl.controlPoints) {
                if (p.x < minX) minX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.x > maxX) maxX = p.x;
                if (p.y > maxY) maxY = p.y;
            }
            return { minX: minX - 5, minY: minY - 5, maxX: maxX + 5, maxY: maxY + 5 };
        }

        case 'HATCH': {
            const gHatch = g as any;
            if (!gHatch.boundaryVertices || gHatch.boundaryVertices.length === 0) return null;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const p of gHatch.boundaryVertices) {
                if (p.x < minX) minX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.x > maxX) maxX = p.x;
                if (p.y > maxY) maxY = p.y;
            }
            return { minX, minY, maxX, maxY };
        }

        case 'DIMENSION': {
            const gDim = g as any;
            if (!gDim.start || !gDim.end) return null;
            const minX = Math.min(gDim.start.x, gDim.end.x, gDim.textPoint?.x ?? gDim.start.x) - 40;
            const minY = Math.min(gDim.start.y, gDim.end.y, gDim.textPoint?.y ?? gDim.start.y) - 40;
            const maxX = Math.max(gDim.start.x, gDim.end.x, gDim.textPoint?.x ?? gDim.end.x) + 40;
            const maxY = Math.max(gDim.start.y, gDim.end.y, gDim.textPoint?.y ?? gDim.end.y) + 40;
            return { minX, minY, maxX, maxY };
        }

        default:
            return null;
    }
}

// ============================================
// SINGLETON
// ============================================

export const spatialIndex = new SpatialIndex();
