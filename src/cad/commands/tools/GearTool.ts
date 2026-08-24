/**
 * AluCAD — Involute Gear Tool (v4 — Robust Parametric)
 * 
 * Generates a parametric gear entity.
 * Supports two workflows:
 *   1. CLI: Module → Teeth → Click to place
 *   2. Panel Apply: setParams() pre-configures → Click to place
 */

import { Command } from '../types';
import { Point, createGearEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';

interface GearParams {
    module: number;
    teethCount: number;
    pressureAngle: number;
}

export class GearTool implements Command {
    id = 'GEAR';
    name = 'Involute Gear';
    displayName = 'Gear';

    private params: GearParams = { module: 2, teethCount: 20, pressureAngle: 20 };
    private centerPoint: Point | null = null;
    private step: 'MODULE' | 'TEETH' | 'CENTER' = 'MODULE';

    start(): void {
        this.step = 'MODULE';
        useCadStore.setState({
            commandState: 'AWAITING_VALUE',
            commandPrompt: `Gear Module (current: ${this.params.module}):`,
        });
    }

    /**
     * Pre-configure all parameters at once (used by ToolPropertyPanel Apply).
     * Skips the CLI step-by-step workflow and jumps directly to placement mode.
     */
    setParams(params: Partial<GearParams>): void {
        if (params.module !== undefined && params.module > 0) this.params.module = params.module;
        if (params.teethCount !== undefined && params.teethCount >= 6) this.params.teethCount = Math.round(params.teethCount);
        if (params.pressureAngle !== undefined) this.params.pressureAngle = params.pressureAngle;

        // Jump directly to placement
        this.step = 'CENTER';
        useCadStore.setState({
            commandState: 'AWAITING_POINT',
            commandPrompt: `m=${this.params.module}, z=${this.params.teethCount} — Click to place gear:`,
        });
    }

    onValueInput(value: string): void {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
            useCadStore.setState({ commandPrompt: 'Invalid value. Enter a positive number:' });
            return;
        }

        if (this.step === 'MODULE') {
            this.params.module = num;
            this.step = 'TEETH';
            useCadStore.setState({
                commandPrompt: `Number of teeth (current: ${this.params.teethCount}):`,
            });
        } else if (this.step === 'TEETH') {
            this.params.teethCount = Math.round(num);
            this.step = 'CENTER';
            useCadStore.setState({
                commandState: 'AWAITING_POINT',
                commandPrompt: 'Click to place gear center:',
            });
        }
    }

    onPointInput(point: Point): void {
        if (this.step === 'CENTER') {
            this.centerPoint = point;
            this.generateGear();
        }
    }

    onMouseMove(_point: Point): void {
        // Live preview while in CENTER placement mode
        if (this.step !== 'CENTER') return;
        
        const cursor = useCadStore.getState().cursorWorld;
        const store = useCadStore.getState();
        const preview = createGearEntity(
            cursor, this.params.module, this.params.teethCount,
            store.activeLayerId, 'rgba(0, 229, 255, 0.3)'
        );
        store.setPreviewEntity(preview);
    }

    onKeyInput(key: string): void {
        if (key === 'Escape') this.cancel();
    }

    cancel(): void {
        this.centerPoint = null;
        useCadStore.setState({ previewEntity: null });
    }

    renderPreview(_ctx: CanvasRenderingContext2D, _transform: (p: Point) => Point): void {
        // Preview handled via onMouseMove → setPreviewEntity
    }

    private generateGear(): void {
        if (!this.centerPoint) return;

        const store = useCadStore.getState();
        store.pushHistory('Gear');

        const entity = createGearEntity(
            this.centerPoint, 
            this.params.module, 
            this.params.teethCount, 
            store.activeLayerId, 
            store.layers.find(l => l.id === store.activeLayerId)?.color || '#ffffff'
        );

        store.addEntity(entity);

        useCadStore.setState({
            commandPrompt: `Gear m=${this.params.module}, z=${this.params.teethCount} placed. Click for next or ESC:`,
            commandState: 'AWAITING_POINT',
            previewEntity: null
        });

        this.centerPoint = null;
    }
}
