/**
 * 🎯 AluDraw Selection System
 * 
 * Manages the set of selected shapes.
 */

import { Scene, Shape } from '../core/Scene';

export class SelectionSystem {
    selectedIds: Set<string> = new Set();
    scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    /**
     * Set selection to a single shape
     */
    select(id: string) {
        this.clear();
        this.add(id);
    }

    /**
     * Add a shape to selection (Multi-select)
     */
    add(id: string) {
        const shape = this.scene.getShape(id);
        if (shape) {
            this.selectedIds.add(id);
            shape.selected = true; // fast visual flag
        }
    }

    /**
     * Toggle selection of a shape
     */
    toggle(id: string) {
        if (this.selectedIds.has(id)) {
            this.remove(id);
        } else {
            this.add(id);
        }
    }

    /**
     * Remove a shape from selection
     */
    remove(id: string) {
        const shape = this.scene.getShape(id);
        if (shape) {
            this.selectedIds.delete(id);
            shape.selected = false;
        }
    }

    /**
     * Clear all selections
     */
    clear() {
        this.selectedIds.forEach(id => {
            const shape = this.scene.getShape(id);
            if (shape) shape.selected = false;
        });
        this.selectedIds.clear();
    }

    /**
     * Get all selected shapes
     */
    getSelectedShapes(): Shape[] {
        return Array.from(this.selectedIds)
            .map(id => this.scene.getShape(id))
            .filter((s): s is Shape => !!s);
    }

    /**
     * Hit Test Wrapper
     */
    hitTest(x: number, y: number): Shape | null {
        return this.scene.hitTest(x, y);
    }

    // --- BRUSH SELECTION ---
    isBrushing: boolean = false;
    brushStart: { x: number, y: number } | null = null;
    brushEnd: { x: number, y: number } | null = null;

    startBrush(x: number, y: number) {
        this.isBrushing = true;
        this.brushStart = { x, y };
        this.brushEnd = { x, y };
    }

    updateBrush(x: number, y: number) {
        if (!this.isBrushing || !this.brushStart) return;
        this.brushEnd = { x, y };

        // Real-time selection update
        this.updateSelectionFromBrush();
    }

    endBrush() {
        this.isBrushing = false;
        this.brushStart = null;
        this.brushEnd = null;
    }

    updateSelectionFromBrush() {
        if (!this.brushStart || !this.brushEnd) return;

        // Calculate Box
        const x = Math.min(this.brushStart.x, this.brushEnd.x);
        const y = Math.min(this.brushStart.y, this.brushEnd.y);
        const w = Math.abs(this.brushEnd.x - this.brushStart.x);
        const h = Math.abs(this.brushEnd.y - this.brushStart.y);

        // Simple AABB overlap
        this.scene.getAllShapes().forEach(shape => {
            const shapeW = shape.width || 100;
            const shapeH = shape.height || 100;

            // Check overlap
            const isOverlapping = (
                shape.x < x + w &&
                shape.x + shapeW > x &&
                shape.y < y + h &&
                shape.y + shapeH > y
            );

            if (isOverlapping) {
                this.add(shape.id);
            } else {
                // Only deselect if it was not previously selected? 
                // For simple behavior, we adhere strictly to the brush
                this.remove(shape.id);
            }
        });
    }

    getBrushBox() {
        if (!this.isBrushing || !this.brushStart || !this.brushEnd) return null;
        return {
            x: Math.min(this.brushStart.x, this.brushEnd.x),
            y: Math.min(this.brushStart.y, this.brushEnd.y),
            width: Math.abs(this.brushEnd.x - this.brushStart.x),
            height: Math.abs(this.brushEnd.y - this.brushStart.y)
        };
    }
    getSelectionBounds() {
        if (this.selectedIds.size === 0) return null;

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        this.getSelectedShapes().forEach(shape => {
            const w = shape.width || 0;
            const h = shape.height || 0;
            minX = Math.min(minX, shape.x);
            minY = Math.min(minY, shape.y);
            maxX = Math.max(maxX, shape.x + w);
            maxY = Math.max(maxY, shape.y + h);
        });

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
}
