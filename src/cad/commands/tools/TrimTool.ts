import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';
import { universalTrim, findSegmentEntityIntersections } from '../../kernel/GeometryEngine';
import { distance } from '../../kernel/GeometryKernel';

export class TrimTool extends BaseCommand {
    public id = 'TRIM';
    public name = 'TRIM';
    public displayName = 'Trim';

    private cuttingEdges: CadEntity[] = [];
    private isDragging: boolean = false;
    private trailPoints: Point[] = [];
    private trimmedEntityIds: Set<string> = new Set();

    start(): void {
        // AutoCAD Quick Trim mode: All entities are automatically cutting edges
        this.cuttingEdges = [...useCadStore.getState().entities];
        this.isDragging = false;
        this.trailPoints = [];
        this.trimmedEntityIds.clear();

        this.setPrompt('✂️ Budama (Trim): Çizgileri kesmek için farenin sol tuşunu basılı tutup sürükleyin veya tıklayın');
    }

    onMouseDown(point: Point): void {
        this.isDragging = true;
        this.trailPoints = [point];
        this.trimmedEntityIds.clear();
        this.cuttingEdges = [...useCadStore.getState().entities];
    }

    onMouseMove(point: Point): void {
        if (!this.isDragging) return;

        if (this.trailPoints.length === 0) {
            this.trailPoints.push(point);
            return;
        }

        const lastPt = this.trailPoints[this.trailPoints.length - 1];
        if (distance(lastPt, point) < 0.5) return;

        // Keep trail points bounded for rendering performance
        if (this.trailPoints.length > 80) {
            this.trailPoints.shift();
        }
        this.trailPoints.push(point);

        // Check for intersections between segment (lastPt -> point) and entities
        const store = useCadStore.getState();
        const currentEntities = [...store.entities];

        for (const entity of currentEntities) {
            if (this.trimmedEntityIds.has(entity.id)) continue;

            const intersections = findSegmentEntityIntersections(lastPt, point, entity);
            if (intersections.length > 0) {
                // Intersected! Trim at the intersection point
                const cutPoint = intersections[0];
                const result = universalTrim(entity, this.cuttingEdges, cutPoint);

                if (result) {
                    store.pushHistory('Fence Trim');
                    store.removeEntity(entity.id);

                    for (const newEntity of result) {
                        store.addEntity(newEntity);
                    }

                    // Update cutting edges for subsequent cuts in this gesture
                    this.cuttingEdges = this.cuttingEdges.filter(e => e.id !== entity.id);
                    this.cuttingEdges.push(...result);
                    this.trimmedEntityIds.add(entity.id);

                    this.setPrompt('✂️ Çizgi budandı. Sürüklemeye devam edebilir veya tıklayabilirsiniz.');
                }
            }
        }
    }

    onMouseUp(_point?: Point): void {
        this.isDragging = false;
        this.trailPoints = [];
        this.trimmedEntityIds.clear();
    }

    onPointInput(point: Point): void {
        // Fallback for single click trim
        const { entities, viewport } = useCadStore.getState();
        const entity = findEntityAtPoint(point, entities, viewport.zoom);

        if (entity) {
            this.cuttingEdges = [...entities];
            this.performTrim(entity, point);
        }
    }

    onKeyInput(key: string): void {
        if (key === 'Escape') {
            this.cancel();
        } else if (key === 'Enter') {
            // Re-sync all cutting edges
            this.cuttingEdges = [...useCadStore.getState().entities];
            this.setPrompt('✂️ Tüm kenarlar budayıcı olarak güncellendi. Çizgi üzerine tıklayın veya sürükleyin:');
        }
    }

    private performTrim(entity: CadEntity, pickPoint: Point) {
        const result = universalTrim(entity, this.cuttingEdges, pickPoint);

        if (!result) {
            this.setPrompt('Bu nesne kesişim noktasına sahip değil. Başka bir nesne seçin:');
            return;
        }

        const store = useCadStore.getState();
        store.pushHistory('Trim');
        store.removeEntity(entity.id);

        for (const newEntity of result) {
            store.addEntity(newEntity);
        }

        this.cuttingEdges = [...store.entities];
        this.setPrompt('Budandı. Sonraki çizgiyi seçin veya sürükleyin:');
    }

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        if (!this.isDragging || this.trailPoints.length < 2) return;

        const screenPts = this.trailPoints.map(transform);

        ctx.save();
        // 1. Glowing outer trail line
        ctx.strokeStyle = 'rgba(58, 208, 230, 0.4)';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(screenPts[0].x, screenPts[0].y);
        for (let i = 1; i < screenPts.length; i++) {
            ctx.lineTo(screenPts[i].x, screenPts[i].y);
        }
        ctx.stroke();

        // 2. Crisp laser inner core
        ctx.strokeStyle = '#3ad0e6';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 3. Cutting head indicator at tip
        const tip = screenPts[screenPts.length - 1];
        ctx.strokeStyle = '#e85d5d'; // Target crimson
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 7, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#3ad0e6';
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Badge
        ctx.font = 'bold 9px monospace';
        const label = '✂️ BUDAMA (FENCE TRIM)';
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(tip.x + 12, tip.y - 10, tw + 8, 18);
        ctx.strokeStyle = '#3ad0e6';
        ctx.lineWidth = 1;
        ctx.strokeRect(tip.x + 12, tip.y - 10, tw + 8, 18);
        ctx.fillStyle = '#3ad0e6';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, tip.x + 16, tip.y - 1);

        ctx.restore();
    }

    cancel(): void {
        this.isDragging = false;
        this.trailPoints = [];
        this.trimmedEntityIds.clear();
        super.cancel();
    }
}
