/**
 * AluCAD — Fastener Drawing Tool (Parametric v2)
 * 
 * Supports dynamic configuration via setParams() and live preview.
 */

import { Command } from '../types';
import { Point, createFastenerEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';

type FastenerType = 'BOLT' | 'NUT';

interface FastenerParams {
    type: FastenerType;
    diameter: number;    // Nominal diameter (mm)
    pitch: number;       // Thread pitch (mm)
    length: number;      // Bolt shaft length (mm)
}

const METRIC_TABLE: Record<number, { pitch: number; headH: number; headW: number; nutH: number }> = {
    3:  { pitch: 0.5,  headH: 2,    headW: 5.5,  nutH: 2.4  },
    4:  { pitch: 0.7,  headH: 2.8,  headW: 7,    nutH: 3.2  },
    5:  { pitch: 0.8,  headH: 3.5,  headW: 8,    nutH: 4.7  },
    6:  { pitch: 1.0,  headH: 4,    headW: 10,   nutH: 5.2  },
    8:  { pitch: 1.25, headH: 5.3,  headW: 13,   nutH: 6.8  },
    10: { pitch: 1.5,  headH: 6.4,  headW: 16,   nutH: 8.4  },
    12: { pitch: 1.75, headH: 7.5,  headW: 18,   nutH: 10.8 },
    16: { pitch: 2.0,  headH: 10,   headW: 24,   nutH: 14.8 },
    20: { pitch: 2.5,  headH: 12.5, headW: 30,   nutH: 18   },
    24: { pitch: 3.0,  headH: 15,   headW: 36,   nutH: 21.5 },
};

export class FastenerDrawTool implements Command {
    id = 'FASTENER';
    name = 'Fastener Profile';
    displayName = 'Bolt/Nut';

    private params: FastenerParams = { type: 'BOLT', diameter: 10, pitch: 1.5, length: 40 };
    private step: 'TYPE' | 'DIAMETER' | 'LENGTH' | 'PLACE' = 'TYPE';

    start(): void {
        this.step = 'TYPE';
        useCadStore.setState({
            commandState: 'AWAITING_VALUE',
            commandPrompt: 'Fastener type — enter BOLT or NUT:',
        });
    }

    /**
     * Pre-configure parameters from ToolPropertyPanel.
     */
    setParams(params: Partial<FastenerParams>): void {
        if (params.type) this.params.type = params.type;
        if (params.diameter && METRIC_TABLE[params.diameter]) {
            this.params.diameter = params.diameter;
            this.params.pitch = METRIC_TABLE[params.diameter].pitch;
        }
        if (params.length !== undefined) this.params.length = params.length;

        // Skip to placement
        this.step = 'PLACE';
        useCadStore.setState({
            commandState: 'AWAITING_POINT',
            commandPrompt: `M${this.params.diameter} ${this.params.type} — Click to place:`,
        });
    }

    onValueInput(value: string): void {
        const upper = value.trim().toUpperCase();

        if (this.step === 'TYPE') {
            if (upper === 'BOLT' || upper === 'B') {
                this.params.type = 'BOLT';
            } else if (upper === 'NUT' || upper === 'N') {
                this.params.type = 'NUT';
            } else {
                useCadStore.setState({ commandPrompt: 'Invalid. Enter BOLT or NUT:' });
                return;
            }
            this.step = 'DIAMETER';
            useCadStore.setState({ commandPrompt: `Nominal diameter in mm (3,4,5,6,8,10,12,16,20,24):` });
        } else if (this.step === 'DIAMETER') {
            const d = parseFloat(upper);
            if (!METRIC_TABLE[d]) {
                useCadStore.setState({ commandPrompt: `Size M${upper} not in table. Available: ${Object.keys(METRIC_TABLE).join(', ')}:` });
                return;
            }
            this.params.diameter = d;
            this.params.pitch = METRIC_TABLE[d].pitch;

            if (this.params.type === 'BOLT') {
                this.step = 'LENGTH';
                useCadStore.setState({ commandPrompt: `Bolt length in mm (default: 40):` });
            } else {
                this.step = 'PLACE';
                useCadStore.setState({
                    commandState: 'AWAITING_POINT',
                    commandPrompt: 'Click to place nut profile:',
                });
            }
        } else if (this.step === 'LENGTH') {
            const l = parseFloat(upper);
            if (isNaN(l) || l <= 0) {
                useCadStore.setState({ commandPrompt: 'Invalid length. Enter positive number:' });
                return;
            }
            this.params.length = l;
            this.step = 'PLACE';
            useCadStore.setState({
                commandState: 'AWAITING_POINT',
                commandPrompt: 'Click to place bolt profile:',
            });
        }
    }

    onPointInput(point: Point): void {
        if (this.step === 'PLACE') {
            this.generateFastener(point);
        }
    }

    onMouseMove(point: Point): void {
        if (this.step !== 'PLACE') return;
        
        const store = useCadStore.getState();
        const preview = createFastenerEntity(
            point,
            this.params.type,
            this.params.diameter,
            this.params.length,
            this.params.pitch,
            store.activeLayerId,
            'rgba(0, 229, 255, 0.3)'
        );
        store.setPreviewEntity(preview);
    }

    onKeyInput(key: string): void {
        if (key === 'Escape') this.cancel();
    }

    cancel(): void {
        useCadStore.setState({ previewEntity: null });
    }

    renderPreview(_ctx: CanvasRenderingContext2D, _transform: (p: Point) => Point): void { }

    private generateFastener(origin: Point): void {
        const store = useCadStore.getState();
        store.pushHistory('Fastener');

        const entity = createFastenerEntity(
            origin,
            this.params.type,
            this.params.diameter,
            this.params.length,
            this.params.pitch,
            store.activeLayerId,
            store.layers.find(l => l.id === store.activeLayerId)?.color || '#ffffff'
        );

        store.addEntity(entity);

        useCadStore.setState({
            commandPrompt: `${this.params.type} M${this.params.diameter} placed. Click for next or ESC:`,
            commandState: 'AWAITING_POINT',
            previewEntity: null
        });
    }
}
