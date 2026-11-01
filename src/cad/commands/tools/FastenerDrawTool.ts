/**
 * AluCAD — Fastener Drawing Tool (Parametric v2)
 * 
 * Supports dynamic configuration via setParams() and live preview.
 */

import { Command } from '../types';
import { Point, createFastenerEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { RenderPipeline } from '../../render/RenderPipeline';

type FastenerType = 'BOLT' | 'NUT';

export interface FastenerParams {
    type: FastenerType;
    diameter: number;    // Nominal diameter (mm)
    pitch: number;       // Thread pitch (mm)
    length: number;      // Bolt shaft length (mm)
    rotation?: number;   // Angle in radians (default -Math.PI / 2 for downward)
    view?: 'SIDE' | 'TOP';
    threadStyle?: 'SCHEMATIC' | 'DETAILED';
}

export const METRIC_TABLE: Record<number, { pitch: number; headH: number; headW: number; nutH: number }> = {
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
    30: { pitch: 3.5,  headH: 18.7, headW: 46,   nutH: 25.6 },
    36: { pitch: 4.0,  headH: 22.5, headW: 55,   nutH: 31.0 },
};

export class FastenerDrawTool implements Command {
    id = 'FASTENER';
    name = 'Fastener Profile';
    displayName = 'Bolt/Nut';

    private params: FastenerParams = {
        type: 'BOLT',
        diameter: 10,
        pitch: 1.5,
        length: 40,
        rotation: -Math.PI / 2,
        view: 'SIDE',
        threadStyle: 'DETAILED',
    };
    private step: 'TYPE' | 'DIAMETER' | 'LENGTH' | 'PLACE' = 'PLACE';
    private currentPoint: Point | null = null;

    start(): void {
        this.step = 'PLACE';
        this.currentPoint = null;
        this.updatePrompt();
    }

    public getParams(): FastenerParams {
        return { ...this.params };
    }

    private updatePrompt(): void {
        const desc = this.params.type === 'BOLT'
            ? `M${this.params.diameter}×${this.params.length} Cıvata (ISO 4014)`
            : `M${this.params.diameter} Somun (ISO 4032)`;
        const newPrompt = `🔩 ${desc} — Yerleştirmek için tıklayın (ESC ile çıkış):`;
        const current = useCadStore.getState();
        if (current.commandPrompt !== newPrompt || current.commandState !== 'AWAITING_POINT') {
            useCadStore.setState({
                commandState: 'AWAITING_POINT',
                commandPrompt: newPrompt,
            });
        }
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
        if (params.length !== undefined && params.length > 0) {
            this.params.length = params.length;
        }
        if (params.rotation !== undefined) {
            this.params.rotation = params.rotation;
        }
        if (params.view) {
            this.params.view = params.view;
        }
        if (params.threadStyle) {
            this.params.threadStyle = params.threadStyle;
        }

        this.step = 'PLACE';
        this.updatePrompt();
    }

    public placeNow(): void {
        const store = useCadStore.getState();
        const cur = this.currentPoint || store.cursorWorld || store.viewport?.center || { x: 0, y: 0 };
        this.generateFastener(cur);
    }

    onValueInput(value: string): void {
        const trimmed = value.trim();
        const upper = trimmed.toUpperCase();

        if (upper === 'BOLT' || upper === 'B' || upper === 'CIVATA') {
            this.params.type = 'BOLT';
            this.step = 'PLACE';
            this.updatePrompt();
            return;
        }
        if (upper === 'NUT' || upper === 'N' || upper === 'SOMUN') {
            this.params.type = 'NUT';
            this.step = 'PLACE';
            this.updatePrompt();
            return;
        }
        if (upper === 'DOWN' || upper === 'ASAGI') {
            this.params.rotation = -Math.PI / 2;
            this.updatePrompt();
            return;
        }
        if (upper === 'UP' || upper === 'YUKARI') {
            this.params.rotation = Math.PI / 2;
            this.updatePrompt();
            return;
        }
        if (upper === 'RIGHT' || upper === 'SAGA') {
            this.params.rotation = 0;
            this.updatePrompt();
            return;
        }
        if (upper === 'LEFT' || upper === 'SOLA') {
            this.params.rotation = Math.PI;
            this.updatePrompt();
            return;
        }

        // Match M8x30, M10x40, 8x30, M10, 10
        const mMatch = trimmed.match(/^M?(\d+)(?:[xX×](\d+))?$/i);
        if (mMatch) {
            const d = parseInt(mMatch[1], 10);
            if (METRIC_TABLE[d]) {
                this.params.diameter = d;
                this.params.pitch = METRIC_TABLE[d].pitch;
                if (mMatch[2]) {
                    this.params.length = parseFloat(mMatch[2]);
                }
                this.step = 'PLACE';
                this.updatePrompt();
                return;
            }
        }

        const num = parseFloat(trimmed);
        if (!isNaN(num)) {
            if (METRIC_TABLE[num]) {
                this.params.diameter = num;
                this.params.pitch = METRIC_TABLE[num].pitch;
            } else if (num > 0) {
                this.params.length = num;
            }
            this.step = 'PLACE';
            this.updatePrompt();
        }
    }

    onPointInput(point: Point): void {
        this.generateFastener(point);
    }

    onMouseMove(point: Point): void {
        this.currentPoint = point;
        const store = useCadStore.getState();
        const preview = createFastenerEntity(
            point,
            this.params.type,
            this.params.diameter,
            this.params.length,
            this.params.pitch,
            store.activeLayerId,
            'rgba(0, 229, 255, 0.4)',
            this.params.rotation ?? -Math.PI / 2,
            this.params.view ?? 'SIDE',
            this.params.threadStyle ?? 'DETAILED'
        );
        store.setPreviewEntity(preview);
    }

    onKeyInput(key: string): void {
        if (key === 'Escape') this.cancel();
    }

    cancel(): void {
        this.currentPoint = null;
        useCadStore.setState({ previewEntity: null });
    }

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        const cur = this.currentPoint || useCadStore.getState().cursorWorld;
        if (!cur) return;
        const zoom = useCadStore.getState().viewport?.zoom || 1;
        ctx.save();
        ctx.strokeStyle = '#3ad0e6';
        ctx.lineWidth = 1.5;
        RenderPipeline.drawFastener(ctx, {
            origin: cur,
            fastenerType: this.params.type,
            diameter: this.params.diameter,
            length: this.params.length,
            pitch: this.params.pitch,
            rotation: this.params.rotation ?? -Math.PI / 2,
            view: this.params.view ?? 'SIDE',
            threadStyle: this.params.threadStyle ?? 'DETAILED'
        }, transform, zoom);
        ctx.restore();
    }

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
            store.layers.find(l => l.id === store.activeLayerId)?.color || '#38bdf8',
            this.params.rotation ?? -Math.PI / 2,
            this.params.view ?? 'SIDE',
            this.params.threadStyle ?? 'DETAILED'
        );

        store.addEntity(entity);

        const desc = this.params.type === 'BOLT'
            ? `M${this.params.diameter}×${this.params.length} Cıvata`
            : `M${this.params.diameter} Somun`;

        useCadStore.setState({
            commandPrompt: `✅ ${desc} eklendi (${origin.x.toFixed(1)}, ${origin.y.toFixed(1)}). Yeni eleman için tıklayın (ESC ile çıkış):`,
            commandState: 'AWAITING_POINT',
            previewEntity: null,
            selectedIds: [entity.id]
        });
    }
}
