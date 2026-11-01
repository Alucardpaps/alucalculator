import { BaseCommand } from '../BaseCommand';
import { Point, BlockDefinition } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { BlockManager } from '../../blocks/BlockManager';

export class InsertTool extends BaseCommand {
    public id = 'INSERT';
    public name = 'INSERT';
    public displayName = 'Insert Block';

    private activeBlock: BlockDefinition | null = null;
    private scale = 1;
    private rotation = 0; // in radians
    private currentPoint: Point | null = null;

    constructor(initialBlock?: BlockDefinition) {
        super();
        if (initialBlock) {
            this.activeBlock = initialBlock;
        }
    }

    public setBlock(block: BlockDefinition) {
        this.activeBlock = block;
        this.setPrompt(`🧱 Blok Yerleştir "${block.name}": Konumlandırmak için tıklayın (R: Döndür, S: Ölçekle):`);
    }

    public setScale(scale: number) {
        if (scale > 0) this.scale = scale;
    }

    public setRotation(rotationRad: number) {
        this.rotation = rotationRad;
    }

    start(): void {
        this.currentPoint = null;
        if (!this.activeBlock) {
            const all = BlockManager.getAllBlocks();
            if (all.length > 0) {
                this.activeBlock = all[0];
            }
        }

        if (this.activeBlock) {
            this.setPrompt(`🧱 Blok Yerleştir "${this.activeBlock.name}": Konumlandırmak için tıklayın:`);
        } else {
            this.setPrompt('Blok kütüphanesi boş. Yeni blok oluşturmak için B tuşuna basın.');
            this.finish();
        }
    }

    onMouseMove(point: Point): void {
        this.currentPoint = point;
    }

    public placeNow(): void {
        const store = useCadStore.getState();
        const pt = this.currentPoint || store.cursorWorld || store.viewport.center;
        this.onPointInput(pt);
    }

    onPointInput(point: Point): void {
        if (!this.activeBlock) return;

        const store = useCadStore.getState();
        const entities = BlockManager.instantiateBlock(
            this.activeBlock,
            point,
            this.scale,
            this.rotation,
            store.activeLayerId
        );

        store.pushHistory(`Insert Block ${this.activeBlock.name}`);
        store.addEntities(entities);

        this.setPrompt(`✅ "${this.activeBlock.name}" bloku eklendi (${entities.length} nesne). Yeni yerleşim için tıklayın veya ESC ile kapatın:`);
    }

    onKeyInput(key: string): void {
        if (key === 'Enter') {
            this.placeNow();
        } else if (key === 'Escape') {
            this.cancel();
        }
    }

    cancel(): void {
        this.currentPoint = null;
        useCadStore.setState({ previewEntity: null });
        super.cancel();
    }

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        if (!this.activeBlock) return;
        const cur = this.currentPoint || useCadStore.getState().cursorWorld;
        if (!cur) return;

        const pOrigin = transform(cur);

        ctx.save();
        ctx.strokeStyle = '#3ad0e6';
        ctx.fillStyle = 'rgba(58, 208, 230, 0.2)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 3]);

        // Draw crosshair at anchor
        ctx.strokeStyle = '#e85d5d';
        ctx.beginPath();
        ctx.moveTo(pOrigin.x - 8, pOrigin.y);
        ctx.lineTo(pOrigin.x + 8, pOrigin.y);
        ctx.moveTo(pOrigin.x, pOrigin.y - 8);
        ctx.lineTo(pOrigin.x, pOrigin.y + 8);
        ctx.stroke();

        // Render block entities preview
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        const bp = this.activeBlock.basePoint;

        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 1.5;

        for (const ent of this.activeBlock.entities) {
            const g = ent.geometry;
            if (g.type === 'LINE') {
                const tr = (pt: Point): Point => {
                    const dx = (pt.x - bp.x) * this.scale;
                    const dy = (pt.y - bp.y) * this.scale;
                    return transform({
                        x: cur.x + dx * cos - dy * sin,
                        y: cur.y + dx * sin + dy * cos,
                    });
                };
                const s = tr(g.start);
                const e = tr(g.end);
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(e.x, e.y);
                ctx.stroke();
            } else if (g.type === 'CIRCLE') {
                const trC = transform({
                    x: cur.x + (g.center.x - bp.x) * this.scale * cos - (g.center.y - bp.y) * this.scale * sin,
                    y: cur.y + (g.center.x - bp.x) * this.scale * sin + (g.center.y - bp.y) * this.scale * cos,
                });
                const zoom = useCadStore.getState().viewport.zoom;
                ctx.beginPath();
                ctx.arc(trC.x, trC.y, g.radius * this.scale * zoom, 0, Math.PI * 2);
                ctx.stroke();
            } else if (g.type === 'ARC') {
                const trC = transform({
                    x: cur.x + (g.center.x - bp.x) * this.scale * cos - (g.center.y - bp.y) * this.scale * sin,
                    y: cur.y + (g.center.x - bp.x) * this.scale * sin + (g.center.y - bp.y) * this.scale * cos,
                });
                const zoom = useCadStore.getState().viewport.zoom;
                ctx.beginPath();
                ctx.arc(
                    trC.x,
                    trC.y,
                    Math.max(0.5, g.radius * this.scale * zoom),
                    -(g.startAngle + this.rotation),
                    -(g.endAngle + this.rotation),
                    true
                );
                ctx.stroke();
            } else if (g.type === 'RECTANGLE') {
                const trC = transform({
                    x: cur.x + (g.center.x - bp.x) * this.scale * cos - (g.center.y - bp.y) * this.scale * sin,
                    y: cur.y + (g.center.x - bp.x) * this.scale * sin + (g.center.y - bp.y) * this.scale * cos,
                });
                const zoom = useCadStore.getState().viewport.zoom;
                const rw = g.width * this.scale * zoom;
                const rh = g.height * this.scale * zoom;
                ctx.strokeRect(trC.x - rw / 2, trC.y - rh / 2, rw, rh);
            }
        }

        // HUD badge
        const badgeText = `🧱 ${this.activeBlock.name} (${(this.scale).toFixed(1)}x)`;
        ctx.font = 'bold 10px monospace';
        const tw = ctx.measureText(badgeText).width;
        ctx.fillStyle = 'rgba(8, 12, 18, 0.9)';
        ctx.fillRect(pOrigin.x + 10, pOrigin.y - 18, tw + 10, 18);
        ctx.strokeStyle = '#3ad0e6';
        ctx.strokeRect(pOrigin.x + 10, pOrigin.y - 18, tw + 10, 18);
        ctx.fillStyle = '#3ad0e6';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, pOrigin.x + 15, pOrigin.y - 9);

        ctx.restore();
    }

    onValueInput(value: string | number): void {
        const valStr = String(value).trim().toUpperCase();
        if (valStr.startsWith('R') || valStr.startsWith('ROT')) {
            const deg = parseFloat(valStr.replace(/[^0-9.-]/g, ''));
            if (!isNaN(deg)) {
                this.rotation = (deg * Math.PI) / 180;
                this.setPrompt(`Döndürme açısı: ${deg}°. Yerleşim için tıklayın:`);
            }
        } else if (valStr.startsWith('S') || valStr.startsWith('SCALE')) {
            const sc = parseFloat(valStr.replace(/[^0-9.-]/g, ''));
            if (!isNaN(sc) && sc > 0) {
                this.scale = sc;
                this.setPrompt(`Ölçek: ${sc}x. Yerleşim için tıklayın:`);
            }
        }
    }
}
