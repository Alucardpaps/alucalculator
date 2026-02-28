
import { Point, EntityType, CadEntity } from '../kernel/types';

export interface CommandInput {
    type: 'point' | 'value' | 'key' | 'cancel' | 'finish';
    point?: Point;
    value?: string;
    key?: string;
}

export interface Command {
    id: string;
    name: string;
    displayName: string;

    /**
     * Called when the command is activated
     */
    start(): void;

    /**
     * Called when the command is cancelled/finished
     */
    cancel(): void;

    /**
     * Handle mouse move (for preview)
     */
    onMouseMove(point: Point): void;

    /**
     * Handle point input (click)
     */
    onPointInput(point: Point): void;

    /**
     * Handle text input (from CLI)
     */
    onValueInput(value: string): void;

    /**
     * Handle key input (Escape, Enter, etc.)
     */
    onKeyInput(key: string): void;

    /**
     * Render preview entities (temporary visual feedback)
     */
    renderPreview(ctx: CanvasRenderingContext2D, viewportTransform: (p: Point) => Point): void;
}
