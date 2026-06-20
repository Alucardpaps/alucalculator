/**
 * AluCAD — Belt & Pulley Tool (v2)
 * 
 * Draws two pulleys and calculates tangent belt path.
 * Added setParams support for property panel.
 */

import { Command } from '../types';
import { Point, createBeltPulleyEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';

interface BeltPulleyParams {
    radius1: number;
    radius2: number;
}

export class BeltPulleyTool implements Command {
    id = 'BELT_PULLEY';
    name = 'Belt & Pulley';
    displayName = 'Belt/Pulley';

    private c1: Point | null = null;
    private c2: Point | null = null;
    private params: BeltPulleyParams = { radius1: 50, radius2: 30 };
    private step: 'CENTER1' | 'CENTER2' = 'CENTER1';

    start(): void {
        this.step = 'CENTER1';
        useCadStore.setState({
            commandState: 'AWAITING_POINT',
            commandPrompt: 'Click for first pulley center:',
        });
    }

    /**
     * Pre-configure parameters from ToolPropertyPanel.
     */
    setParams(params: Partial<BeltPulleyParams>): void {
        if (params.radius1 !== undefined && params.radius1 > 0) this.params.radius1 = params.radius1;
        if (params.radius2 !== undefined && params.radius2 > 0) this.params.radius2 = params.radius2;
    }

    onPointInput(point: Point): void {
        if (this.step === 'CENTER1') {
            this.c1 = point;
            this.step = 'CENTER2';
            useCadStore.setState({
                commandState: 'AWAITING_POINT',
                commandPrompt: `r1=${this.params.radius1} set. Click for second pulley center:`,
            });
        } else if (this.step === 'CENTER2') {
            this.c2 = point;
            this.generate();
        }
    }

    onValueInput(value: string): void {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
            useCadStore.setState({ commandPrompt: 'Invalid radius. Enter a positive number:' });
            return;
        }

        // CLI sequence fallback
        if (this.step === 'CENTER1') {
            this.params.radius1 = num;
            useCadStore.setState({ commandPrompt: 'Radius 1 set. Click for center 1:' });
        } else {
            this.params.radius2 = num;
            useCadStore.setState({ commandPrompt: 'Radius 2 set. Click for center 2:' });
        }
    }

    onMouseMove(point: Point): void {
        const store = useCadStore.getState();
        if (this.step === 'CENTER1') {
            // Preview only pulley 1
            store.setPreviewEntity(createBeltPulleyEntity(point, this.params.radius1, {x: point.x + 10, y: point.y}, 1, store.activeLayerId, 'rgba(0, 229, 255, 0.3)'));
        } else if (this.step === 'CENTER2' && this.c1) {
            // Preview full system
            store.setPreviewEntity(createBeltPulleyEntity(this.c1, this.params.radius1, point, this.params.radius2, store.activeLayerId, 'rgba(0, 229, 255, 0.3)'));
        }
    }

    onKeyInput(key: string): void {
        if (key === 'Escape') this.cancel();
    }

    cancel(): void {
        this.c1 = null;
        this.c2 = null;
        useCadStore.setState({ previewEntity: null });
    }

    renderPreview(): void { }

    private generate(): void {
        if (!this.c1 || !this.c2) return;
        const store = useCadStore.getState();
        store.pushHistory('Belt & Pulley');

        const entity = createBeltPulleyEntity(
            this.c1, this.params.radius1, this.c2, this.params.radius2,
            store.activeLayerId, 
            store.layers.find(l => l.id === store.activeLayerId)?.color || '#ffffff'
        );

        store.addEntity(entity);
        useCadStore.setState({ 
            previewEntity: null, 
            commandState: 'AWAITING_POINT', 
            commandPrompt: 'Belt system created. Click for next start center or ESC:' 
        });
        this.c1 = null;
        this.c2 = null;
        this.step = 'CENTER1';
    }
}
