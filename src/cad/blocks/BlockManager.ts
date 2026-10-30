/**
 * 🧱 AluCAD — AutoCAD-Grade Block & Reusable Template Engine
 * 
 * Provides:
 * 1. Predefined standard ISO/DIN engineering library (Fasteners, Brackets, NEMA motors, Symbols, Title Block)
 * 2. User custom block CRUD with localStorage persistence (`alucad_user_blocks_v1`)
 * 3. Parametric block instantiation with translation, rotation, scaling, and atomic grouping
 * 4. DXF/JSON library import and export
 */

import { Point, CadEntity, BlockDefinition, createLineEntity, createCircleEntity, createPolylineEntity, createRectangleEntity, createHexagonEntity, createArcEntity } from '../kernel/types';

const STORAGE_KEY = 'alucad_user_blocks_v1';

import { STANDARD_BLOCKS } from './StandardBlocks';
import { DynamicBlockRegistry } from './dynamic/registry';
import { DynamicBlockEngine } from './dynamic/DynamicBlockEngine';

export { STANDARD_BLOCKS, DynamicBlockRegistry, DynamicBlockEngine };

// ═══════════════════════════════════════════════════════════════
// BLOCK MANAGER (CRUD + LOCALSTORAGE)
// ═══════════════════════════════════════════════════════════════

export class BlockManager {
    private static memoryBlocks: BlockDefinition[] = [];

    /**
     * Get all available blocks (Standard Built-in + Dynamic Blocks + User Saved)
     */
    public static getAllBlocks(): BlockDefinition[] {
        const userBlocks = this.loadUserBlocks();
        const dynamicBlocks = DynamicBlockRegistry.getAll().map(def =>
            DynamicBlockEngine.toStandardBlockDefinition(def)
        );
        return [...dynamicBlocks, ...STANDARD_BLOCKS, ...userBlocks];
    }

    /**
     * Get all dynamic blocks
     */
    public static getDynamicBlocks() {
        return DynamicBlockRegistry.getAll();
    }

    /**
     * Load user blocks from localStorage (or memory fallback)
     */
    public static loadUserBlocks(): BlockDefinition[] {
        if (typeof window === 'undefined' || !window.localStorage) {
            return this.memoryBlocks;
        }
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return this.memoryBlocks;
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : this.memoryBlocks;
        } catch (e) {
            console.error('Failed to load user blocks from localStorage:', e);
            return this.memoryBlocks;
        }
    }

    /**
     * Save a new custom block or update an existing one
     */
    public static saveBlock(block: Omit<BlockDefinition, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): BlockDefinition {
        const userBlocks = this.loadUserBlocks();
        const now = Date.now();
        const id = block.id || `usr_blk_${crypto.randomUUID().slice(0, 8)}`;

        const newBlock: BlockDefinition = {
            ...block,
            id,
            category: block.category || 'Custom',
            createdAt: block.id ? (userBlocks.find(b => b.id === block.id)?.createdAt || now) : now,
            updatedAt: now
        };

        const existingIdx = userBlocks.findIndex(b => b.id === id);
        let updated: BlockDefinition[];
        if (existingIdx >= 0) {
            updated = [...userBlocks];
            updated[existingIdx] = newBlock;
        } else {
            updated = [...userBlocks, newBlock];
        }

        this.memoryBlocks = updated;

        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (e) {
                console.error('Failed to save block to localStorage:', e);
            }
        }

        return newBlock;
    }

    /**
     * Delete a custom block by ID
     */
    public static deleteBlock(id: string): boolean {
        // Cannot delete standard blocks
        if (STANDARD_BLOCKS.some(b => b.id === id)) return false;

        const userBlocks = this.loadUserBlocks();
        const filtered = userBlocks.filter(b => b.id !== id);
        this.memoryBlocks = filtered;

        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
                return true;
            } catch (e) {
                console.error('Failed to delete block:', e);
            }
        }
        return true;
    }

    /**
     * Export all custom blocks as a JSON string
     */
    public static exportLibraryJson(): string {
        const blocks = this.loadUserBlocks();
        return JSON.stringify({
            generator: 'AluCAD OS Block Library',
            version: '1.0',
            exportedAt: new Date().toISOString(),
            blocks
        }, null, 2);
    }

    /**
     * Import blocks from JSON string (merges with existing)
     */
    public static importLibraryJson(jsonStr: string): number {
        try {
            const data = JSON.parse(jsonStr);
            const incoming: BlockDefinition[] = Array.isArray(data) ? data : data.blocks;
            if (!Array.isArray(incoming)) return 0;

            const current = this.loadUserBlocks();
            const map = new Map<string, BlockDefinition>();
            current.forEach(b => map.set(b.id, b));
            let addedCount = 0;

            for (const b of incoming) {
                if (b.name && Array.isArray(b.entities)) {
                    const id = b.id || `usr_blk_${crypto.randomUUID().slice(0, 8)}`;
                    map.set(id, {
                        ...b,
                        id,
                        category: b.category || 'Custom',
                        createdAt: b.createdAt || Date.now(),
                        updatedAt: Date.now()
                    });
                    addedCount++;
                }
            }

            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(map.values())));
            }
            return addedCount;
        } catch (e) {
            console.error('Failed to parse block JSON:', e);
            return 0;
        }
    }

    /**
     * Instantiates a block into the drawing at insertPoint with optional scale & rotation.
     * All entities are bound by a common `groupId` and `blockInstanceId`.
     */
    public static instantiateBlock(
        block: BlockDefinition,
        insertPoint: Point,
        scale = 1,
        rotationRad = 0,
        targetLayerId = 'layer-0'
    ): CadEntity[] {
        if (block.isDynamic && block.dynamicBlockId) {
            const def = DynamicBlockRegistry.getById(block.dynamicBlockId);
            if (def) {
                return DynamicBlockEngine.instantiate(
                    def,
                    block.dynamicParams || {},
                    insertPoint,
                    scale,
                    rotationRad,
                    targetLayerId
                );
            }
        }

        const blockInstanceId = `inst_${crypto.randomUUID().slice(0, 8)}`;
        const groupId = `grp_blk_${crypto.randomUUID().slice(0, 8)}`;

        const cos = Math.cos(rotationRad);
        const sin = Math.sin(rotationRad);

        const transformPoint = (p: Point): Point => {
            // Vector relative to block base point
            const rx = (p.x - block.basePoint.x) * scale;
            const ry = (p.y - block.basePoint.y) * scale;
            return {
                x: insertPoint.x + rx * cos - ry * sin,
                y: insertPoint.y + rx * sin + ry * cos
            };
        };

        const result: CadEntity[] = [];

        for (const entity of block.entities) {
            const newId = crypto.randomUUID();
            const g = entity.geometry;
            let newGeometry = { ...g };

            switch (g.type) {
                case 'LINE':
                    newGeometry = {
                        type: 'LINE',
                        start: transformPoint(g.start),
                        end: transformPoint(g.end)
                    };
                    break;

                case 'CIRCLE':
                    newGeometry = {
                        type: 'CIRCLE',
                        center: transformPoint(g.center),
                        radius: g.radius * scale
                    };
                    break;

                case 'ARC':
                    newGeometry = {
                        type: 'ARC',
                        center: transformPoint(g.center),
                        radius: g.radius * scale,
                        startAngle: g.startAngle + rotationRad,
                        endAngle: g.endAngle + rotationRad
                    };
                    break;

                case 'RECTANGLE':
                    newGeometry = {
                        type: 'RECTANGLE',
                        center: transformPoint(g.center),
                        width: g.width * scale,
                        height: g.height * scale,
                        rotation: (g.rotation || 0) + rotationRad
                    };
                    break;

                case 'HEXAGON':
                    newGeometry = {
                        type: 'HEXAGON',
                        center: transformPoint(g.center),
                        radius: g.radius * scale,
                        rotation: (g.rotation || 0) + rotationRad
                    };
                    break;

                case 'POLYLINE': {
                    const anyG = g as any;
                    const pts = g.vertices || anyG.points || [];
                    newGeometry = {
                        type: 'POLYLINE',
                        vertices: pts.map(transformPoint),
                        closed: Boolean(g.closed ?? anyG.isClosed)
                    };
                    break;
                }

                case 'TEXT':
                    newGeometry = {
                        ...g,
                        position: transformPoint(g.position),
                        fontSize: (g.fontSize || 10) * scale,
                        rotation: (g.rotation || 0) + rotationRad
                    };
                    break;

                case 'LEADER':
                    newGeometry = {
                        ...g,
                        start: transformPoint(g.start),
                        end: transformPoint(g.end)
                    };
                    break;

                case 'ELLIPSE':
                    newGeometry = {
                        ...g,
                        center: transformPoint(g.center),
                        radiusX: (g.radiusX || 10) * scale,
                        radiusY: (g.radiusY || 5) * scale,
                        rotation: (g.rotation || 0) + rotationRad
                    };
                    break;

                case 'SPLINE':
                    newGeometry = {
                        ...g,
                        controlPoints: (g.controlPoints || []).map(transformPoint)
                    };
                    break;

                case 'POINT': {
                    const anyG = g as any;
                    const px = g.x !== undefined ? g.x : (anyG.position?.x ?? 0);
                    const py = g.y !== undefined ? g.y : (anyG.position?.y ?? 0);
                    const tp = transformPoint({ x: px, y: py });
                    newGeometry = {
                        type: 'POINT',
                        x: tp.x,
                        y: tp.y
                    };
                    break;
                }

                case 'HATCH':
                    newGeometry = {
                        ...g,
                        boundaryVertices: (g.boundaryVertices || []).map(transformPoint),
                        holes: (g as any).holes ? (g as any).holes.map((hole: any[]) => hole.map(transformPoint)) : undefined
                    };
                    break;

                default:
                    // Keep existing geometry if unhandled
                    break;
            }

            result.push({
                ...entity,
                id: newId,
                layerId: targetLayerId || entity.layerId,
                groupId,
                blockInstanceId,
                isSelected: false,
                geometry: newGeometry as any
            });
        }

        return result;
    }
}
