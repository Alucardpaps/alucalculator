/**
 * 🎬 AluDraw Scene
 * 
 * The Single Source of Truth for all shapes on the canvas.
 * Manages spatial indexing and shape registry.
 */

import { QuadtreeIndex } from './QuadtreeIndex';
import { Rect } from './ISpatialIndex';

export interface Shape {
    id: string;
    type: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    rotation?: number;
    selected?: boolean;
    [key: string]: any; // Flexible props
}

export class Scene {
    private shapes: Map<string, Shape> = new Map();
    private spatialIndex: QuadtreeIndex<string>;

    // Z-Index order (array of IDs)
    private order: string[] = [];

    constructor() {
        this.spatialIndex = new QuadtreeIndex();
    }

    private getBounds(shape: Shape): Rect {
        return {
            x: shape.x,
            y: shape.y,
            width: shape.width || 100,
            height: shape.height || 100
        };
    }

    addShape(shape: Shape) {
        this.shapes.set(shape.id, shape);
        this.order.push(shape.id);
        this.spatialIndex.insert(shape.id, this.getBounds(shape), shape.id);
    }

    removeShape(id: string) {
        this.shapes.delete(id);
        this.order = this.order.filter(oid => oid !== id);
        this.spatialIndex.remove(id);
    }

    updateShape(id: string, updates: Partial<Shape>) {
        const shape = this.shapes.get(id);
        if (shape) {
            Object.assign(shape, updates);
            this.spatialIndex.update(id, this.getBounds(shape), id);
        }
    }

    getShape(id: string) {
        return this.shapes.get(id);
    }

    /**
     * Hit Test Optimized via Quadtree
     * Returns top-most shape at world coordinates
     */
    hitTest(x: number, y: number): Shape | null {
        // 1. Query spatial index for candidate shapes in a 1x1 area
        const candidates = this.spatialIndex.query({ x, y, width: 1, height: 1 });
        
        if (candidates.length === 0) return null;

        // 2. Resolve z-index priority (highest index in order array is top)
        let topShape: Shape | null = null;
        let maxIndex = -1;

        for (const id of candidates) {
            const index = this.order.indexOf(id);
            if (index > maxIndex) {
                maxIndex = index;
                topShape = this.shapes.get(id) || null;
            }
        }

        return topShape;
    }

    getAllShapes() {
        return this.order.map(id => this.shapes.get(id)!);
    }
}
