/**
 * 🎬 AluDraw Scene
 * 
 * The Single Source of Truth for all shapes on the canvas.
 * Manages spatial indexing and shape registry.
 */

export interface Shape {
    id: string;
    type: string;
    x: number;
    y: number;
    rotation?: number;
    selected?: boolean;
    [key: string]: any; // Flexible props
}

export class Scene {
    shapes: Map<string, Shape> = new Map();

    // Z-Index order (array of IDs)
    order: string[] = [];

    constructor() { }

    addShape(shape: Shape) {
        this.shapes.set(shape.id, shape);
        this.order.push(shape.id);
    }

    removeShape(id: string) {
        this.shapes.delete(id);
        this.order = this.order.filter(oid => oid !== id);
    }

    updateShape(id: string, updates: Partial<Shape>) {
        const shape = this.shapes.get(id);
        if (shape) {
            Object.assign(shape, updates);
        }
    }

    getShape(id: string) {
        return this.shapes.get(id);
    }

    /**
     * Hit Test (Simple bounding box for now)
     * Returns top-most shape at world coordinates
     */
    hitTest(x: number, y: number): Shape | null {
        // Iterate in reverse order (top to bottom)
        for (let i = this.order.length - 1; i >= 0; i--) {
            const shape = this.shapes.get(this.order[i]);
            if (!shape) continue;

            // Simple Box hit test logic (assumes width/height exist on shape)
            // Real engine usage would delegate to ShapeType.hitTest
            const w = shape.width || 100; // Default or prop
            const h = shape.height || 100;

            if (x >= shape.x && x <= shape.x + w &&
                y >= shape.y && y <= shape.y + h) {
                return shape;
            }
        }
        return null;
    }

    getAllShapes() {
        return this.order.map(id => this.shapes.get(id)!);
    }
}
