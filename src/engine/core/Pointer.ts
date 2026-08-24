/**
 * 👆 AluDraw Pointer
 * 
 * Normalizes Mouse, Touch, and Pen inputs into a unified event system.
 * Handles:
 * - Coordinates (Screen vs World)
 * - Pressure (for pen)
 * - Buttons (Left, Middle, Right)
 * - Dragging state
 */

import { Camera } from './Camera';

export interface PointerState {
    x: number;      // Screen X
    y: number;      // Screen Y
    worldX: number; // World X
    worldY: number; // World Y
    isDown: boolean;
    button: number; // 0=Left, 1=Middle, 2=Right
    pressure: number;
}

export class Pointer {
    x: number = 0;
    y: number = 0;
    isDown: number = 0; // 0 = false, >0 = true (can track multi-touch count)

    // Last down position for drag calculations
    lastDownX: number = 0;
    lastDownY: number = 0;

    constructor() { }

    update(e: PointerEvent | MouseEvent | TouchEvent, camera: Camera): PointerState {
        // Normalize coordinates
        let cx = 0, cy = 0;
        let pressure = 0.5;
        let button = 0;

        if (e instanceof MouseEvent || e instanceof PointerEvent) {
            cx = e.clientX;
            cy = e.clientY;
            button = e.button;
            if (e instanceof PointerEvent) pressure = e.pressure;
        } else if (window.TouchEvent && e instanceof TouchEvent && e.touches.length > 0) {
            cx = e.touches[0].clientX;
            cy = e.touches[0].clientY;
            pressure = 1.0;
        }

        this.x = cx;
        this.y = cy;

        const world = camera.screenToWorld(cx, cy);

        return {
            x: cx,
            y: cy,
            worldX: world.x,
            worldY: world.y,
            isDown: this.isDown > 0,
            button,
            pressure
        };
    }

    down() {
        this.isDown++;
        this.lastDownX = this.x;
        this.lastDownY = this.y;
    }

    up() {
        this.isDown = Math.max(0, this.isDown - 1);
    }
}
