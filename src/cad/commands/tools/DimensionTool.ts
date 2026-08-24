/**
 * AluCAD — Dimension Tool with Tolerance Support
 * 
 * Interactive tool for creating linear dimensions with optional GD&T tolerances.
 * Flow: 
 *   1. Select start point
 *   2. Select end point  
 *   3. Place text position
 *   4. (Optional) Enter tolerance: "+0.05,-0.01" or "±0.05"
 */

import { Command } from '../types';
import { useCadStore } from '../../store/cadStore';
import { Point, DimensionGeometry } from '../../kernel/types';
import { dimensionSystem } from '../../kernel/DimensionSystem';

export class DimensionTool implements Command {
    id = 'DIMENSION';
    name = 'Smart Dimension';
    displayName = 'Dimension';

    private startPoint: Point | null = null;
    private endPoint: Point | null = null;
    private textPoint: Point | null = null;
    private awaitingTolerance = false;

    start() {
        useCadStore.setState({
            commandPrompt: 'Select first point',
            commandState: 'AWAITING_POINT'
        });
    }

    onMouseMove(_point: Point) { }

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
        } else if (!this.awaitingTolerance) {
            this.textPoint = point;
            this.awaitingTolerance = true;
            useCadStore.setState({
                commandState: 'AWAITING_VALUE',
                commandPrompt: 'Tolerance (e.g. "+0.05,-0.01" or "±0.05" or Enter to skip):',
            });
        }
    }

    onValueInput(value: string) {
        if (this.awaitingTolerance) {
            const trimmed = value.trim();
            let tolUpper: number | undefined;
            let tolLower: number | undefined;

            if (trimmed === '' || trimmed.toLowerCase() === 'skip') {
                // No tolerance — create plain dimension
            } else if (trimmed.startsWith('±') || trimmed.startsWith('+-')) {
                // Bilateral symmetric: ±0.05
                const val = parseFloat(trimmed.replace('±', '').replace('+-', ''));
                if (!isNaN(val)) {
                    tolUpper = val;
                    tolLower = -val;
                }
            } else if (trimmed.includes(',')) {
                // Bilateral asymmetric: +0.05,-0.01
                const parts = trimmed.split(',');
                const u = parseFloat(parts[0]);
                const l = parseFloat(parts[1]);
                if (!isNaN(u)) tolUpper = u;
                if (!isNaN(l)) tolLower = l;
            } else {
                // Try single value as symmetric
                const val = parseFloat(trimmed);
                if (!isNaN(val)) {
                    tolUpper = Math.abs(val);
                    tolLower = -Math.abs(val);
                }
            }

            this.createDimension(this.textPoint!, tolUpper, tolLower);
            return;
        }
    }

    onKeyInput(key: string) {
        if (key === 'Escape') {
            this.cancel();
        } else if (key === 'Enter' && this.awaitingTolerance) {
            // Skip tolerance
            this.createDimension(this.textPoint!);
        }
    }

    cancel() {
        useCadStore.setState({
            commandPoints: [],
            previewEntity: null
        });
        this.reset();
    }

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point) {
        const { cursorWorld } = useCadStore.getState();

        if (this.startPoint && !this.endPoint) {
            const p1 = transform(this.startPoint);
            const p2 = transform(cursorWorld);

            ctx.beginPath();
            ctx.strokeStyle = '#666';
            ctx.setLineDash([5, 5]);
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (this.startPoint && this.endPoint && !this.awaitingTolerance) {
            const tempDim = dimensionSystem.createLinearDimension(
                this.startPoint,
                this.endPoint,
                cursorWorld,
                'preview-layer'
            );
            tempDim.color = '#ffff00';
            dimensionSystem.renderDimension(ctx, tempDim, transform, 1);
        }
    }

    private createDimension(textPoint: Point, tolUpper?: number, tolLower?: number) {
        if (!this.startPoint || !this.endPoint) return;

        const entity = dimensionSystem.createLinearDimension(
            this.startPoint,
            this.endPoint,
            textPoint,
            useCadStore.getState().activeLayerId
        );

        // Inject tolerance into geometry
        if (tolUpper !== undefined || tolLower !== undefined) {
            const dimGeom = entity.geometry as DimensionGeometry;
            dimGeom.tolUpper = tolUpper;
            dimGeom.tolLower = tolLower;
        }

        useCadStore.getState().addEntity(entity);

        useCadStore.setState({
            commandPrompt: 'Select first point',
            commandPoints: [],
            commandState: 'AWAITING_POINT'
        });
        this.reset();
    }

    private reset() {
        this.startPoint = null;
        this.endPoint = null;
        this.textPoint = null;
        this.awaitingTolerance = false;
    }
}
