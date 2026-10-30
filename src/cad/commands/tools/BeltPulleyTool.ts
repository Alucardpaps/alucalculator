/**
 * AluCAD — Belt & Pulley Tool (v3 — Interactive Parametric)
 * 
 * Standard: ISO 5296 / DIN 7721
 * Draws two pulleys and calculates tangent belt track paths.
 * Supports live mouse preview, ToolPropertyPanel configuration, and 1-click placeNow.
 */

import { Command } from '../types';
import { Point, createBeltPulleyEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';

export interface BeltPulleyParams {
    radius1: number;
    radius2: number;
    beltType?: 'OPEN' | 'CROSSED';
}

export class BeltPulleyTool implements Command {
    id = 'BELT_PULLEY';
    name = 'Belt & Pulley';
    displayName = 'Belt/Pulley';

    private c1: Point | null = null;
    private c2: Point | null = null;
    private params: BeltPulleyParams = { radius1: 50, radius2: 30, beltType: 'OPEN' };
    private step: 'CENTER1' | 'CENTER2' = 'CENTER1';

    start(): void {
        this.step = 'CENTER1';
        this.c1 = null;
        this.c2 = null;
        const pText = `🔄 Kayış & Kasnak (R1=${this.params.radius1}mm, R2=${this.params.radius2}mm) — 1. Kasnak merkezini seçin:`;
        const current = useCadStore.getState();
        if (current.commandPrompt !== pText || current.commandState !== 'AWAITING_POINT') {
            useCadStore.setState({
                commandState: 'AWAITING_POINT',
                commandPrompt: pText,
            });
        }
    }

    public getParams(): BeltPulleyParams {
        return { ...this.params };
    }

    /**
     * Pre-configure parameters from ToolPropertyPanel.
     */
    setParams(params: Partial<BeltPulleyParams>): void {
        if (params.radius1 !== undefined && params.radius1 > 0) this.params.radius1 = params.radius1;
        if (params.radius2 !== undefined && params.radius2 > 0) this.params.radius2 = params.radius2;
        if (params.beltType) this.params.beltType = params.beltType;

        const p1Text = this.c1 ? `R1=${this.params.radius1}mm belirlendi. 2. Kasnak merkezini seçin:` : `🔄 Kayış & Kasnak (R1=${this.params.radius1}mm, R2=${this.params.radius2}mm) — 1. Kasnak merkezini seçin:`;
        const current = useCadStore.getState();
        if (current.commandPrompt !== p1Text || current.commandState !== 'AWAITING_POINT') {
            useCadStore.setState({
                commandState: 'AWAITING_POINT',
                commandPrompt: p1Text,
            });
        }
    }

    /**
     * Instantly places a belt-pulley transmission centered at current cursor or viewport center.
     */
    public placeNow(): void {
        const store = useCadStore.getState();
        const center = store.cursorWorld || { x: 0, y: 0 };
        const dist = Math.max(140, (this.params.radius1 + this.params.radius2) * 1.5);
        this.c1 = { x: center.x - dist / 2, y: center.y };
        this.c2 = { x: center.x + dist / 2, y: center.y };
        this.generate();
    }

    onPointInput(point: Point): void {
        if (this.step === 'CENTER1') {
            this.c1 = point;
            this.step = 'CENTER2';
            useCadStore.setState({
                commandState: 'AWAITING_POINT',
                commandPrompt: `R1=${this.params.radius1}mm belirlendi. 2. Kasnak merkezini seçin (veya mesafe girin):`,
            });
        } else if (this.step === 'CENTER2') {
            this.c2 = point;
            this.generate();
        }
    }

    onValueInput(value: string): void {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
            useCadStore.setState({ commandPrompt: 'Geçersiz değer. Pozitif bir sayı girin:' });
            return;
        }

        // CLI sequence fallback
        if (this.step === 'CENTER1') {
            this.params.radius1 = num;
            useCadStore.setState({ commandPrompt: `R1=${this.params.radius1}mm ayarlandı. 1. Kasnak merkezini tıklayın:` });
        } else {
            this.params.radius2 = num;
            useCadStore.setState({ commandPrompt: `R2=${this.params.radius2}mm ayarlandı. 2. Kasnak merkezini tıklayın:` });
        }
    }

    onMouseMove(point: Point): void {
        const store = useCadStore.getState();
        if (this.step === 'CENTER1') {
            // Preview only pulley 1
            store.setPreviewEntity(createBeltPulleyEntity(point, this.params.radius1, { x: point.x + 10, y: point.y }, 1, store.activeLayerId, 'rgba(0, 229, 255, 0.35)'));
        } else if (this.step === 'CENTER2' && this.c1) {
            // Preview full system
            const preview = createBeltPulleyEntity(this.c1, this.params.radius1, point, this.params.radius2, store.activeLayerId, 'rgba(0, 229, 255, 0.35)');
            (preview.geometry as any).beltType = this.params.beltType || 'OPEN';
            store.setPreviewEntity(preview);
        }
    }

    onKeyInput(key: string): void {
        if (key === 'Escape') this.cancel();
    }

    cancel(): void {
        this.c1 = null;
        this.c2 = null;
        this.step = 'CENTER1';
        useCadStore.setState({ previewEntity: null });
    }

    renderPreview(): void { }

    private generate(): void {
        if (!this.c1 || !this.c2) return;
        const store = useCadStore.getState();
        store.pushHistory('Belt & Pulley');

        const layer = store.layers.find(l => l.id === store.activeLayerId);
        const color = layer?.color || '#ffffff';

        const entity = createBeltPulleyEntity(
            this.c1, this.params.radius1, this.c2, this.params.radius2,
            store.activeLayerId, 
            color
        );
        (entity.geometry as any).beltType = this.params.beltType || 'OPEN';

        store.addEntity(entity);
        useCadStore.setState({ 
            previewEntity: null, 
            commandState: 'AWAITING_POINT', 
            commandPrompt: '✅ Kayış & Kasnak yerleştirildi. Yeni sistem için 1. kasnak merkezini tıklayın veya ESC:' 
        });
        this.c1 = null;
        this.c2 = null;
        this.step = 'CENTER1';
    }
}
