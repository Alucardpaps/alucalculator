/**
 * Dimension Tool
 * 
 * Interactive tool for creating linear dimensions.
 * Step 1: Select start point
 * Step 2: Select end point
 * Step 3: Place text position
 */

import { Command } from '../types';
import { useCadStore } from '../../store/cadStore';
import { Point } from '../../kernel/types';
import { dimensionSystem } from '../../kernel/DimensionSystem';

export class DimensionTool implements Command {
    id = 'DIMENSION';
    name = 'Smart Dimension';
    displayName = 'Dimension'; // Added to satisfy Command interface

    private startPoint: Point | null = null;
    private endPoint: Point | null = null;

    start() {
        useCadStore.setState({
            commandPrompt: 'Select first point',
            commandState: 'AWAITING_POINT'
        });
    }

    onMouseMove(point: Point) {
        // Preview logic could go here
    }

    onPointInput(point: Point) {
        if (!this.startPoint) {
            this.startPoint = point;
            useCadStore.setState({
                commandPrompt: 'Select second point',
                commandPoints: [point]
            });
        } else if (!this.endPoint) {
            this.endPoint = point;
            useCadStore.setState({
                commandPrompt: 'Place dimension text',
                commandPoints: [this.startPoint, point]
            });
        } else {
            // Finalize
            this.createDimension(point);
        }
    }

    onValueInput(value: string) {
        // Could handle typing distance manually
    }

    onKeyInput(key: string) {
        if (key === 'Escape') {
            this.cancel();
        }
    }

    cancel() {
        useCadStore.setState({
            commandPoints: [],
            previewEntity: null
        });
    }

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point) {
        const { commandPoints, cursorWorld } = useCadStore.getState();

        // Render preview of dimension
        if (this.startPoint && !this.endPoint) {
            // Dragging to second point - show rubber line
            const p1 = transform(this.startPoint);
            const p2 = transform(cursorWorld);

            ctx.beginPath();
            ctx.strokeStyle = '#666';
            ctx.setLineDash([5, 5]);
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (this.startPoint && this.endPoint) {
            // Dragging text position - show full dimension preview
            const tempDim = dimensionSystem.createLinearDimension(
                this.startPoint,
                this.endPoint,
                cursorWorld,
                'preview-layer'
            );

            // Override color for preview
            tempDim.color = '#ffff00';

            dimensionSystem.renderDimension(ctx, tempDim, transform, 1);
        }
    }

    private createDimension(textPoint: Point) {
        if (!this.startPoint || !this.endPoint) return;

        const entity = dimensionSystem.createLinearDimension(
            this.startPoint,
            this.endPoint,
            textPoint,
            useCadStore.getState().activeLayerId
        );

        useCadStore.getState().addEntity(entity);

        // Restart command for next dimension
        this.startPoint = null;
        this.endPoint = null;
        useCadStore.setState({
            commandPrompt: 'Select first point',
            commandPoints: []
        });
    }
}
