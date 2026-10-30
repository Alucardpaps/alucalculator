/**
 * AluCAD — Involute Gear Tool (v5 — Direct Interactive Placement)
 * 
 * Standard: ISO 53 / DIN 867 / AGMA 2001
 * Supports:
 *   1. Direct 1-Click placement with live cursor ghost preview
 *   2. ToolPropertyPanel instant configuration via setParams() and placeNow()
 *   3. CLI parameter sequence fallback
 */

import { Command } from '../types';
import { Point, createGearEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';

export interface GearParams {
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
    private step: 'MODULE' | 'TEETH' | 'CENTER' = 'CENTER';

    start(): void {
        this.step = 'CENTER';
        this.centerPoint = null;
        this.updatePrompt();
    }

    public getParams(): GearParams {
        return { ...this.params };
    }

    private updatePrompt(): void {
        const newPrompt = `⚙️ Evolvent Dişli (m=${this.params.module}, z=${this.params.teethCount}) — Yerleştirmek için tıklayın (ESC ile çıkış):`;
        const current = useCadStore.getState();
        if (current.commandPrompt !== newPrompt || current.commandState !== 'AWAITING_POINT') {
            useCadStore.setState({
                commandState: 'AWAITING_POINT',
                commandPrompt: newPrompt,
            });
        }
    }

    /**
     * Pre-configure all parameters at once (used by ToolPropertyPanel Apply).
     * Skips the CLI step-by-step workflow and jumps directly to placement mode.
     */
    setParams(params: Partial<GearParams>): void {
        if (params.module !== undefined && params.module > 0) this.params.module = params.module;
        if (params.teethCount !== undefined && params.teethCount >= 6) this.params.teethCount = Math.round(params.teethCount);
        if (params.pressureAngle !== undefined) this.params.pressureAngle = params.pressureAngle;

        this.step = 'CENTER';
        this.updatePrompt();
    }

    /**
     * Place gear immediately at the current cursor location or viewport center.
     */
    public placeNow(): void {
        const store = useCadStore.getState();
        const pt = store.cursorWorld || { x: 0, y: 0 };
        this.centerPoint = pt;
        this.generateGear();
    }

    onValueInput(value: string): void {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
            useCadStore.setState({ commandPrompt: 'Geçersiz değer. Pozitif bir sayı girin:' });
            return;
        }

        if (this.step === 'MODULE') {
            this.params.module = num;
            this.step = 'TEETH';
            useCadStore.setState({
                commandPrompt: `Diş Sayısı (z, mevcut: ${this.params.teethCount}):`,
            });
        } else if (this.step === 'TEETH') {
            this.params.teethCount = Math.max(6, Math.round(num));
            this.step = 'CENTER';
            this.updatePrompt();
        } else {
            // In center mode, entering a number adjusts module
            this.params.module = num;
            this.updatePrompt();
        }
    }

    onPointInput(point: Point): void {
        this.centerPoint = point;
        this.generateGear();
    }

    onMouseMove(_point: Point): void {
        if (this.step !== 'CENTER') return;
        
        const cursor = useCadStore.getState().cursorWorld;
        if (!cursor) return;
        const store = useCadStore.getState();
        const preview = createGearEntity(
            cursor, this.params.module, this.params.teethCount,
            store.activeLayerId, 'rgba(0, 229, 255, 0.35)'
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
        // Handled via onMouseMove → setPreviewEntity
    }

    private generateGear(): void {
        if (!this.centerPoint) return;

        const store = useCadStore.getState();
        store.pushHistory('Involute Gear');

        const layer = store.layers.find(l => l.id === store.activeLayerId);
        const color = layer?.color || '#ffffff';

        const entity = createGearEntity(
            this.centerPoint, 
            this.params.module, 
            this.params.teethCount, 
            store.activeLayerId, 
            color
        );

        store.addEntity(entity);

        useCadStore.setState({
            commandPrompt: `✅ Dişli (m=${this.params.module}, z=${this.params.teethCount}) yerleştirildi. Yeni dişli için tıklayın veya ESC:`,
            commandState: 'AWAITING_POINT',
            previewEntity: null
        });

        this.centerPoint = null;
    }
}
