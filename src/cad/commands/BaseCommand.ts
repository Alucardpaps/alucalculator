
import { Command } from './types';
import { Point } from '../kernel/types';
import { useCadStore } from '../store/cadStore';

export abstract class BaseCommand implements Command {
    public abstract id: string;
    public abstract name: string;
    public abstract displayName: string;

    constructor() { }

    start(): void {
        // Default start behavior
        console.log(`Command ${this.displayName} started`);
    }

    cancel(): void {
        // Default cancel behavior
        useCadStore.getState().setCommandState('IDLE');
        useCadStore.getState().setCommandPrompt('Type a command');
    }

    abstract onMouseMove(point: Point): void;
    abstract onPointInput(point: Point): void;

    onValueInput(value: string): void {
        // Try to parse "x,y" coordinates
        const parts = value.split(',');
        if (parts.length === 2) {
            const x = parseFloat(parts[0].trim());
            const y = parseFloat(parts[1].trim());

            if (!isNaN(x) && !isNaN(y)) {
                // Success! Treat as a point click
                this.onPointInput({ x, y });
                return;
            }
        }

        console.warn('Invalid coordinate format:', value);
        // We could also notify the user via a toaster or the command prompt state
        useCadStore.getState().setCommandPrompt(`Invalid point: ${value}`);
    }

    onKeyInput(key: string): void {
        if (key === 'Escape') {
            this.cancel();
        }
    }

    renderPreview(_ctx: CanvasRenderingContext2D, _transform: (p: Point) => Point): void {
        // Default: no preview
    }

    protected setPrompt(prompt: string): void {
        useCadStore.getState().setCommandState('AWAITING_POINT');
        useCadStore.getState().setCommandPrompt(prompt);
    }
}
