/**
 * 📷 AluDraw Camera
 * 
 * Manages the infinite canvas viewport.
 * Handles coordinate systems: Screen <-> World.
 */

export class Camera {
    x: number = 0;
    y: number = 0;
    zoom: number = 1;

    // Viewport bounds (screen size)
    width: number = 0;
    height: number = 0;

    constructor() { }

    /**
     * Update viewport dimensions
     */
    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    /**
     * Pan the camera by specific delta (screen pixels)
     */
    pan(dx: number, dy: number) {
        this.x -= dx / this.zoom;
        this.y -= dy / this.zoom;
    }

    /**
     * Zoom at a specific screen point
     */
    zoomAt(screenX: number, screenY: number, delta: number) {
        // 1. Get world point under mouse before zoom
        const worldBefore = this.screenToWorld(screenX, screenY);

        // 2. Apply zoom clamp
        const newZoom = Math.min(Math.max(this.zoom * (1 - delta * 0.001), 0.1), 10);

        // 3. Update zoom
        this.zoom = newZoom;

        // 4. Calculate world point after zoom (if we didn't move camera)
        // We want worldBefore to represent the same screen point, so we adjust Camera x/y
        // screenX = (worldX - camX) * zoom + width/2
        // => camX = worldX - (screenX - width/2) / zoom

        this.x = worldBefore.x - (screenX - this.width / 2) / this.zoom;
        this.y = worldBefore.y - (screenY - this.height / 2) / this.zoom;
    }

    /**
     * Convert Screen Coordinates (Pixels) -> World Coordinates (Units)
     */
    screenToWorld(sx: number, sy: number) {
        return {
            x: (sx - this.width / 2) / this.zoom + this.x,
            y: (sy - this.height / 2) / this.zoom + this.y
        };
    }

    /**
     * Convert World Coordinates (Units) -> Screen Coordinates (Pixels)
     */
    worldToScreen(wx: number, wy: number) {
        return {
            x: (wx - this.x) * this.zoom + this.width / 2,
            y: (wy - this.y) * this.zoom + this.height / 2
        };
    }

    /**
     * Get visible world bounds
     */
    getVisibleBounds() {
        const tl = this.screenToWorld(0, 0);
        const br = this.screenToWorld(this.width, this.height);
        return {
            x: tl.x,
            y: tl.y,
            width: br.x - tl.x,
            height: br.y - tl.y
        };
    }
}
