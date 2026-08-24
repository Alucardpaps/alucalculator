/**
 * 🧱 ISpatialIndex.ts
 * 
 * Interface for spatial indexing strategies (Quadtree, R-Tree, etc.)
 */

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ISpatialIndex<T> {
    insert(id: string, bounds: Rect, data: T): void;
    remove(id: string): void;
    update(id: string, bounds: Rect, data: T): void;
    query(bounds: Rect): T[];
    clear(): void;
}
