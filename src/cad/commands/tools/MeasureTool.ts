import { BaseCommand } from '../BaseCommand';
import { Point } from '../../kernel/types';
import { distance } from '../../kernel/GeometryKernel';
import { useCadStore } from '../../store/cadStore';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';
import { dimensionSystem } from '../../kernel/DimensionSystem';

interface MeasureData {
    start: Point;
    end: Point;
    dist: number;
    dx: number;
    dy: number;
    angleDeg: number;
}

export class MeasureTool extends BaseCommand {
    public id = 'MEASURE';
    public name = 'MEASURE';
    public displayName = 'Measure / Dist';

    private startPoint: Point | null = null;
    private currentPoint: Point | null = null;
    private activeMeasurement: MeasureData | null = null;

    start(): void {
        this.startPoint = null;
        this.currentPoint = null;
        this.activeMeasurement = null;
        const store = useCadStore.getState();
        const selected = store.entities.filter(e => store.selectedIds.includes(e.id));
        if (selected.length === 1) {
            if (this.measureEntity(selected[0])) {
                return;
            }
        }
        this.setPrompt('📏 Ölçü Alma: Şekle veya 1. ölçüm noktasına tıklayın (Kalıcı eklemek için Enter):');
    }

    public measureEntity(ent: any): boolean {
        const g = ent.geometry;
        if (!g) return false;
        if (g.type === 'LINE') {
            const dist = distance(g.start, g.end);
            const dx = Math.abs(g.end.x - g.start.x);
            const dy = Math.abs(g.end.y - g.start.y);
            const angleDeg = (Math.atan2(g.end.y - g.start.y, g.end.x - g.start.x) * 180 / Math.PI + 360) % 360;
            this.activeMeasurement = { start: g.start, end: g.end, dist, dx, dy, angleDeg };
            useCadStore.getState().setCommandPrompt(
                `📏 Çizgi Ölçümü: ${dist.toFixed(2)} mm (ΔX=${dx.toFixed(2)}, ΔY=${dy.toFixed(2)}, ∠=${angleDeg.toFixed(1)}°) | Çizime kalıcı eklemek için [Enter]`
            );
            return true;
        } else if (g.type === 'CIRCLE') {
            const r = g.radius;
            const d = r * 2;
            const p1 = { x: g.center.x - r, y: g.center.y };
            const p2 = { x: g.center.x + r, y: g.center.y };
            this.activeMeasurement = { start: p1, end: p2, dist: d, dx: d, dy: 0, angleDeg: 0 };
            useCadStore.getState().setCommandPrompt(
                `📏 Çember: Çap ⌀=${d.toFixed(2)} mm, Yarıçap R=${r.toFixed(2)} mm, Çevre=${(2 * Math.PI * r).toFixed(2)} mm | Çizime eklemek için [Enter]`
            );
            return true;
        } else if (g.type === 'RECTANGLE') {
            const w = g.width;
            const h = g.height;
            const diag = Math.hypot(w, h);
            const p1 = { x: g.center.x - w / 2, y: g.center.y - h / 2 };
            const p2 = { x: g.center.x + w / 2, y: g.center.y + h / 2 };
            this.activeMeasurement = { start: p1, end: p2, dist: diag, dx: w, dy: h, angleDeg: (Math.atan2(h, w) * 180 / Math.PI) };
            useCadStore.getState().setCommandPrompt(
                `📏 Dikdörtgen: ${w.toFixed(2)} × ${h.toFixed(2)} mm (Köşegen=${diag.toFixed(2)} mm, Alan=${(w * h).toFixed(1)} mm²) | [Enter] ile ekle`
            );
            return true;
        }
        return false;
    }

    onMouseMove(point: Point): void {
        this.currentPoint = point;

        if (this.startPoint) {
            const dist = distance(this.startPoint, point);
            const dx = Math.abs(point.x - this.startPoint.x);
            const dy = Math.abs(point.y - this.startPoint.y);
            const angleDeg = (Math.atan2(point.y - this.startPoint.y, point.x - this.startPoint.x) * 180 / Math.PI + 360) % 360;

            this.activeMeasurement = {
                start: this.startPoint,
                end: point,
                dist,
                dx,
                dy,
                angleDeg
            };

            useCadStore.getState().setCommandPrompt(
                `📏 Mesafe: ${dist.toFixed(2)} mm | ΔX: ${dx.toFixed(2)} mm | ΔY: ${dy.toFixed(2)} mm | Açı: ${angleDeg.toFixed(1)}°`
            );
        }
    }

    onPointInput(point: Point): void {
        const { entities, viewport } = useCadStore.getState();

        if (!this.startPoint) {
            // Check if user clicked directly on an entity
            const clicked = findEntityAtPoint(point, entities, viewport.zoom);
            if (clicked) {
                if (clicked.geometry.type === 'LINE') {
                    const line = clicked.geometry as any;
                    const dist = distance(line.start, line.end);
                    const dx = Math.abs(line.end.x - line.start.x);
                    const dy = Math.abs(line.end.y - line.start.y);
                    const angleDeg = (Math.atan2(line.end.y - line.start.y, line.end.x - line.start.x) * 180 / Math.PI + 360) % 360;
                    this.activeMeasurement = { start: line.start, end: line.end, dist, dx, dy, angleDeg };
                    useCadStore.getState().setCommandPrompt(
                        `📏 Çizgi Ölçümü: ${dist.toFixed(2)} mm (ΔX=${dx.toFixed(2)}, ΔY=${dy.toFixed(2)}, ∠=${angleDeg.toFixed(1)}°)`
                    );
                    return;
                } else if (clicked.geometry.type === 'CIRCLE') {
                    const circ = clicked.geometry as any;
                    const r = circ.radius;
                    const d = r * 2;
                    const c = 2 * Math.PI * r;
                    const p1 = { x: circ.center.x - r, y: circ.center.y };
                    const p2 = { x: circ.center.x + r, y: circ.center.y };
                    this.activeMeasurement = { start: p1, end: p2, dist: d, dx: d, dy: 0, angleDeg: 0 };
                    useCadStore.getState().setCommandPrompt(
                        `📏 Çember: Çap ⌀=${d.toFixed(2)} mm, Yarıçap R=${r.toFixed(2)} mm, Çevre=${c.toFixed(2)} mm`
                    );
                    return;
                }
            }

            this.startPoint = point;
            this.activeMeasurement = null;
            this.setPrompt('📏 2. ölçüm noktasını seçin:');
        } else {
            const dist = distance(this.startPoint, point);
            const dx = Math.abs(point.x - this.startPoint.x);
            const dy = Math.abs(point.y - this.startPoint.y);
            const angleDeg = (Math.atan2(point.y - this.startPoint.y, point.x - this.startPoint.x) * 180 / Math.PI + 360) % 360;

            this.activeMeasurement = {
                start: this.startPoint,
                end: point,
                dist,
                dx,
                dy,
                angleDeg
            };

            const summary = `📏 Ölçüm: ${dist.toFixed(2)} mm (ΔX=${dx.toFixed(2)}, ΔY=${dy.toFixed(2)}, ∠=${angleDeg.toFixed(1)}°) | Yeni ölçüm için tıklayın veya ESC ile kapatın`;
            useCadStore.getState().setCommandPrompt(summary);

            // Reset startPoint so next click can start a new measurement, but KEEP activeMeasurement visible!
            this.startPoint = null;
        }
    }

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        const m = this.activeMeasurement;
        if (!m) return;

        const p1 = transform(m.start);
        const p2 = transform(m.end);

        ctx.save();
        // 1. Measurement leader line
        ctx.strokeStyle = '#e6b84a'; // Laser Amber
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // 2. Start marker (Red)
        ctx.fillStyle = '#e85d5d';
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // 3. End marker (Amber)
        ctx.fillStyle = '#e6b84a';
        ctx.beginPath();
        ctx.arc(p2.x, p2.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // 4. Floating HUD Readout Banner
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        const titleText = `📏 L: ${m.dist.toFixed(2)} mm`;
        const subText = `ΔX: ${m.dx.toFixed(2)} mm  ΔY: ${m.dy.toFixed(2)} mm  ∠ ${m.angleDeg.toFixed(1)}°`;

        ctx.font = 'bold 11px monospace';
        const w1 = ctx.measureText(titleText).width;
        ctx.font = '9px monospace';
        const w2 = ctx.measureText(subText).width;
        const boxW = Math.max(w1, w2) + 20;
        const boxH = 34;

        ctx.fillStyle = 'rgba(10, 14, 20, 0.92)';
        ctx.fillRect(midX - boxW / 2, midY - boxH - 10, boxW, boxH);
        ctx.strokeStyle = '#e6b84a';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(midX - boxW / 2, midY - boxH - 10, boxW, boxH);

        ctx.fillStyle = '#3ad0e6';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(titleText, midX, midY - boxH - 6);

        ctx.fillStyle = '#c5cdd6';
        ctx.font = '9px monospace';
        ctx.fillText(subText, midX, midY - boxH + 9);

        ctx.restore();
    }

    public getActiveMeasurement(): MeasureData | null {
        return this.activeMeasurement;
    }

    public convertToDimension(): boolean {
        const m = this.activeMeasurement;
        if (!m) return false;

        const store = useCadStore.getState();
        store.pushHistory('Create Dimension from Measure');

        // Text offset 30mm perpendicular
        const dx = m.end.x - m.start.x;
        const dy = m.end.y - m.start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = len > 0 ? -dy / len : 0;
        const ny = len > 0 ? dx / len : 1;
        const textPoint = {
            x: (m.start.x + m.end.x) / 2 + nx * 20,
            y: (m.start.y + m.end.y) / 2 + ny * 20,
        };

        const dimEntity = {
            id: crypto.randomUUID(),
            layerId: store.activeLayerId,
            color: '#ffcc00',
            isVisible: true,
            isSelected: false,
            geometry: {
                type: 'DIMENSION' as const,
                start: m.start,
                end: m.end,
                textPoint,
                value: m.dist,
                text: `${m.dist.toFixed(2)} mm`,
                offset: 20,
            },
        };

        store.addEntity(dimEntity);
        useCadStore.setState({
            commandPrompt: `✅ Ölçülendirme çizime eklendi (${m.dist.toFixed(2)} mm).`,
        });
        return true;
    }

    onKeyInput(key: string): void {
        if (key === 'Enter') {
            if (this.activeMeasurement) {
                this.convertToDimension();
            }
        } else if (key === 'Escape') {
            this.cancel();
        }
    }

    onValueInput(value: string): void {
        const upper = value.trim().toUpperCase();
        if (upper === 'D' || upper === 'DIM' || upper === 'ENTER' || upper === 'OK') {
            if (this.activeMeasurement) {
                this.convertToDimension();
            }
        }
    }

    cancel(): void {
        this.startPoint = null;
        this.currentPoint = null;
        this.activeMeasurement = null;
        super.cancel();
    }
}
