/**
 * 🌿 Quadtree Implementation
 * 
 * High-performance spatial indexing for 2D geometry.
 * Used to optimize hit testing and collision detection.
 */

import { ISpatialIndex, Rect } from './ISpatialIndex';

class QuadtreeNode<T> {
    private children: QuadtreeNode<T>[] = [];
    private items: { id: string, bounds: Rect, data: T }[] = [];
    private capacity: number = 4;
    private maxDepth: number = 6;

    constructor(private bounds: Rect, private depth: number = 0) { }

    private subdivide() {
        const { x, y, width, height } = this.bounds;
        const w2 = width / 2;
        const h2 = height / 2;

        this.children = [
            new QuadtreeNode({ x, y, width: w2, height: h2 }, this.depth + 1),         // NW
            new QuadtreeNode({ x: x + w2, y, width: w2, height: h2 }, this.depth + 1), // NE
            new QuadtreeNode({ x, y: y + h2, width: w2, height: h2 }, this.depth + 1), // SW
            new QuadtreeNode({ x: x + w2, y: y + h2, width: w2, height: h2 }, this.depth + 1) // SE
        ];

        // Move items to children
        const oldItems = this.items;
        this.items = [];
        for (const item of oldItems) {
            this.insert(item.id, item.bounds, item.data);
        }
    }

    private overlaps(a: Rect, b: Rect): boolean {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    insert(id: string, bounds: Rect, data: T): boolean {
        if (!this.overlaps(this.bounds, bounds)) return false;

        if (this.children.length === 0) {
            this.items.push({ id, bounds, data });
            if (this.items.length > this.capacity && this.depth < this.maxDepth) {
                this.subdivide();
            }
            return true;
        }

        let added = false;
        for (const child of this.children) {
            if (child.insert(id, bounds, data)) added = true;
        }
        return added;
    }

    query(bounds: Rect, result: T[] = []) {
        if (!this.overlaps(this.bounds, bounds)) return result;

        for (const item of this.items) {
            if (this.overlaps(item.bounds, bounds)) {
                result.push(item.data);
            }
        }

        for (const child of this.children) {
            child.query(bounds, result);
        }

        return result;
    }
}

export class QuadtreeIndex<T> implements ISpatialIndex<T> {
    private root: QuadtreeNode<T>;
    private itemMap: Map<string, { bounds: Rect, data: T }> = new Map();

    constructor(bounds: Rect = { x: -10000, y: -10000, width: 20000, height: 20000 }) {
        this.root = new QuadtreeNode(bounds);
    }

    insert(id: string, bounds: Rect, data: T): void {
        this.itemMap.set(id, { bounds, data });
        this.root.insert(id, bounds, data);
    }

    remove(id: string): void {
        this.itemMap.delete(id);
        this.rebuild(); // Simple removal for now, real implementation would prune
    }

    update(id: string, bounds: Rect, data: T): void {
        this.remove(id);
        this.insert(id, bounds, data);
    }

    query(bounds: Rect): T[] {
        const results = this.root.query(bounds);
        // Use a Set to unique items that might span multiple nodes
        return Array.from(new Set(results));
    }

    clear(): void {
        this.itemMap.clear();
        this.rebuild();
    }

    private rebuild() {
        const oldItems = Array.from(this.itemMap.entries());
        this.root = new QuadtreeNode({ x: -10000, y: -10000, width: 20000, height: 20000 });
        for (const [id, val] of oldItems) {
            this.root.insert(id, val.bounds, val.data);
        }
    }
}
