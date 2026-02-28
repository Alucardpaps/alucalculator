/**
 * 🏗️ AluDraw Transform System
 * 
 * Handles geometric mutations:
 * - Dragging (Translation)
 * - Resizing (Scaling)
 * - Rotating
 */

import { Scene } from '../core/Scene';
import { SelectionSystem } from './SelectionSystem';

export class TransformSystem {
    scene: Scene;
    selection: SelectionSystem;

    // Drag State
    isDragging: boolean = false;
    startX: number = 0;
    startY: number = 0;
    initialPositions: Map<string, { x: number, y: number }> = new Map();

    constructor(scene: Scene, selection: SelectionSystem) {
        this.scene = scene;
        this.selection = selection;
    }

    startDrag(startX: number, startY: number) {
        this.isDragging = true;
        this.startX = startX;
        this.startY = startY;

        // Snapshot positions
        this.initialPositions.clear();
        this.selection.getSelectedShapes().forEach(shape => {
            this.initialPositions.set(shape.id, { x: shape.x, y: shape.y });
        });
    }

    updateDrag(currentX: number, currentY: number) {
        if (!this.isDragging) return;

        const dx = currentX - this.startX;
        const dy = currentY - this.startY;

        this.initialPositions.forEach((pos, id) => {
            this.scene.updateShape(id, {
                x: pos.x + dx,
                y: pos.y + dy
            });
        });
    }

    endDrag() {
        this.isDragging = false;
        this.initialPositions.clear();
    }
}
