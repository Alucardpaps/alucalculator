/**
 * AluCAD — Roller Chain Sprocket Tool (ISO 606 / DIN 8187 / ANSI B29.1)
 * 
 * Generates parametric roller chain sprockets with live preview,
 * DIN standard pitch/roller calculations, and 1-click placement.
 */

import { Command } from '../types';
import { Point, createSprocketEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';

export const ISO_606_CHAINS: Record<string, { pitch: number; rollerDiameter: number; name: string }> = {
    '06B': { pitch: 9.525,  rollerDiameter: 6.35,  name: '06B (3/8")' },
    '08B': { pitch: 12.700, rollerDiameter: 8.51,  name: '08B (1/2")' },
    '10B': { pitch: 15.875, rollerDiameter: 10.16, name: '10B (5/8")' },
    '12B': { pitch: 19.050, rollerDiameter: 12.07, name: '12B (3/4")' },
    '16B': { pitch: 25.400, rollerDiameter: 15.88, name: '16B (1")' },
};

export interface SprocketParams {
    standard: string;
    teeth: number;
    pitch: number;
    rollerDiameter: number;
    boreDiameter: number;
}

export class RollerChainTool implements Command {
    id = 'ROLLER_CHAIN';
    name = 'Roller Chain Sprocket';
    displayName = 'Sprocket';

    private params: SprocketParams = {
        standard: '08B',
        teeth: 19,
        pitch: 12.700,
        rollerDiameter: 8.51,
        boreDiameter: 20,
    };
    private centerPoint: Point | null = null;
    private step: 'CENTER' = 'CENTER';

    start(): void {
        this.step = 'CENTER';
        this.centerPoint = null;
        this.updatePrompt();
    }

    public getParams(): SprocketParams {
        return { ...this.params };
    }

    private updatePrompt(): void {
        const d = (this.params.pitch / Math.sin(Math.PI / Math.max(6, this.params.teeth))).toFixed(1);
        const newPrompt = `⛓️ ISO 606 Zincir Dişlisi (${this.params.standard}, z=${this.params.teeth}, d=${d}mm) — Yerleştirmek için tıklayın (ESC ile çıkış):`;
        const current = useCadStore.getState();
        if (current.commandPrompt !== newPrompt || current.commandState !== 'AWAITING_POINT') {
            useCadStore.setState({
                commandState: 'AWAITING_POINT',
                commandPrompt: newPrompt,
            });
        }
    }

    setParams(params: Partial<SprocketParams>): void {
        if (params.standard && ISO_606_CHAINS[params.standard]) {
            this.params.standard = params.standard;
            this.params.pitch = ISO_606_CHAINS[params.standard].pitch;
            this.params.rollerDiameter = ISO_606_CHAINS[params.standard].rollerDiameter;
        }
        if (params.pitch !== undefined && params.pitch > 0) this.params.pitch = params.pitch;
        if (params.rollerDiameter !== undefined && params.rollerDiameter > 0) this.params.rollerDiameter = params.rollerDiameter;
        if (params.teeth !== undefined && params.teeth >= 6) this.params.teeth = Math.round(params.teeth);
        if (params.boreDiameter !== undefined && params.boreDiameter >= 0) this.params.boreDiameter = params.boreDiameter;

        this.step = 'CENTER';
        this.updatePrompt();
    }

    public placeNow(): void {
        const store = useCadStore.getState();
        const pt = store.cursorWorld || { x: 0, y: 0 };
        this.centerPoint = pt;
        this.generateSprocket();
    }

    onPointInput(point: Point): void {
        this.centerPoint = point;
        this.generateSprocket();
    }

    onValueInput(value: string): void {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
            useCadStore.setState({ commandPrompt: 'Geçersiz değer. Pozitif diş sayısı girin:' });
            return;
        }
        this.params.teeth = Math.max(6, Math.round(num));
        this.updatePrompt();
    }

    onMouseMove(_point: Point): void {
        if (this.step !== 'CENTER') return;
        const cursor = useCadStore.getState().cursorWorld;
        if (!cursor) return;

        const store = useCadStore.getState();
        const preview = createSprocketEntity(
            cursor,
            this.params.teeth,
            this.params.pitch,
            this.params.rollerDiameter,
            this.params.boreDiameter,
            store.activeLayerId,
            'rgba(0, 229, 255, 0.35)'
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

    private generateSprocket(): void {
        if (!this.centerPoint) return;

        const store = useCadStore.getState();
        store.pushHistory('ISO 606 Sprocket');

        const layer = store.layers.find(l => l.id === store.activeLayerId);
        const color = layer?.color || '#ffffff';

        const entity = createSprocketEntity(
            this.centerPoint,
            this.params.teeth,
            this.params.pitch,
            this.params.rollerDiameter,
            this.params.boreDiameter,
            store.activeLayerId,
            color
        );

        store.addEntity(entity);

        useCadStore.setState({
            commandPrompt: `✅ Zincir Dişlisi (${this.params.standard}, z=${this.params.teeth}) yerleştirildi. Yeni dişli için tıklayın veya ESC:`,
            commandState: 'AWAITING_POINT',
            previewEntity: null,
        });

        this.centerPoint = null;
    }
}
