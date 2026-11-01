import { BaseCommand } from '../BaseCommand';
import { Point, createLeaderEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';

export class LeaderTool extends BaseCommand {
    public id = 'LEADER';
    public name = 'LEADER';
    public displayName = 'Leader Note';

    private startPoint: Point | null = null;
    private currentPoint: Point | null = null;
    private annotationText = 'ÖLÇÜ NOTU / NOT';

    start(): void {
        this.startPoint = null;
        this.currentPoint = null;
        this.setPrompt(`📌 Lider Ok / Not: Ok ucu konumunu seçin (tıklayın) [Metin: "${this.annotationText}"]:`);
    }

    public setAnnotationText(text: string): void {
        if (text.trim()) {
            this.annotationText = text.trim();
            this.setPrompt(`📌 Lider Ok / Not: [Metin: "${this.annotationText}"]:`);
        }
    }

    public placeLeaderNow(): void {
        const store = useCadStore.getState();
        const center = store.cursorWorld || store.viewport.center;
        const start = { x: center.x - 30, y: center.y - 25 };
        const end = { x: center.x, y: center.y };
        this.startPoint = start;
        this.onPointInput(end);
    }

    onMouseMove(point: Point): void {
        this.currentPoint = point;

        if (this.startPoint) {
            const preview = createLeaderEntity(
                this.startPoint,
                point,
                this.annotationText,
                useCadStore.getState().activeLayerId,
                '#3ad0e6'
            );
            useCadStore.getState().setPreviewEntity(preview);
        }
    }

    onPointInput(point: Point): void {
        if (!this.startPoint) {
            this.startPoint = point;
            this.setPrompt(`📌 Lider iniş noktasını seçin (Not: "${this.annotationText}"):`);
        } else {
            const store = useCadStore.getState();
            store.pushHistory('Leader Note');

            const layerId = store.activeLayerId;
            const activeLayer = store.layers.find(l => l.id === layerId);
            const leader = createLeaderEntity(
                this.startPoint,
                point,
                this.annotationText,
                layerId,
                activeLayer?.color || '#3ad0e6'
            );
            store.addEntity(leader);

            this.startPoint = null;
            this.currentPoint = null;
            store.setPreviewEntity(null);
            this.setPrompt(`✅ Lider not eklendi. Yeni not için ok ucunu seçin (ESC ile çıkış):`);
        }
    }

    onValueInput(value: string): void {
        const trimmed = value.trim();
        if (!trimmed) return;

        const parts = trimmed.split(',');
        if (parts.length === 2) {
            const x = parseFloat(parts[0]);
            const y = parseFloat(parts[1]);
            if (!isNaN(x) && !isNaN(y)) {
                this.onPointInput({ x, y });
                return;
            }
        }

        // Otherwise value is updated annotation text!
        this.setAnnotationText(trimmed);
    }

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        if (!this.startPoint) return;
        const cur = this.currentPoint || useCadStore.getState().cursorWorld;
        if (!cur) return;

        const pStart = transform(this.startPoint);
        const pEnd = transform(cur);

        ctx.save();
        // 1. Leader line
        ctx.strokeStyle = '#3ad0e6'; // Electric cyan
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.lineTo(pEnd.x, pEnd.y);
        // Landing shoulder
        const shoulderLen = 20;
        const shoulderX = pEnd.x >= pStart.x ? pEnd.x + shoulderLen : pEnd.x - shoulderLen;
        ctx.lineTo(shoulderX, pEnd.y);
        ctx.stroke();

        // 2. Arrowhead at start point
        const angle = Math.atan2(pStart.y - pEnd.y, pStart.x - pEnd.x);
        const arrowLen = 12;
        ctx.fillStyle = '#3ad0e6';
        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.lineTo(
            pStart.x - arrowLen * Math.cos(angle - Math.PI / 6),
            pStart.y - arrowLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            pStart.x - arrowLen * Math.cos(angle + Math.PI / 6),
            pStart.y - arrowLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        // 3. Text background badge & label
        ctx.font = 'bold 11px monospace';
        const text = this.annotationText || 'NOTE';
        const tw = ctx.measureText(text).width;
        const textX = pEnd.x >= pStart.x ? pEnd.x + 4 : pEnd.x - tw - 4;
        const textY = pEnd.y - 14;

        ctx.fillStyle = 'rgba(7, 9, 12, 0.9)';
        ctx.fillRect(textX - 2, textY - 2, tw + 8, 16);
        ctx.strokeStyle = '#e6b84a'; // Amber border
        ctx.strokeRect(textX - 2, textY - 2, tw + 8, 16);

        ctx.fillStyle = '#e6b84a';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.fillText(text, textX + 2, textY);

        ctx.restore();
    }

    cancel(): void {
        this.startPoint = null;
        this.currentPoint = null;
        useCadStore.getState().setPreviewEntity(null);
        super.cancel();
    }
}
