
import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { findEntityAtPoint, offsetEntity } from '../../geometry/GeometryUtils';

export class OffsetTool extends BaseCommand {
    public id = 'OFFSET';
    public name = 'OFFSET';
    public displayName = 'Offset';

    private offsetDist: number = 10;
    private state: 'SELECT_ENTITY' | 'SPECIFY_SIDE' | 'ENTER_DISTANCE' = 'ENTER_DISTANCE';
    private sourceEntity: CadEntity | null = null;

    start(): void {
        this.sourceEntity = null;
        const { entities, selectedIds } = useCadStore.getState();
        const selected = entities.find(e => selectedIds.includes(e.id));
        if (selected) {
            this.sourceEntity = selected;
            this.state = 'SPECIFY_SIDE';
            this.setPrompt(`Öteleme yönünü seçmek için tıklayın (Mesafe: ${this.offsetDist}mm):`);
        } else {
            this.state = 'SELECT_ENTITY';
            this.setPrompt(`Ötelenecek şekli seçin (Mesafe: ${this.offsetDist}mm, değiştirmek için yazın):`);
        }
    }

    public setOffsetDistance(dist: number): void {
        if (dist > 0) {
            this.offsetDist = dist;
            this.setPrompt(`Öteleme mesafesi: ${this.offsetDist}mm. Şekli veya yönü tıklayın:`);
        }
    }

    public executeOffset(isOutside: boolean = true): void {
        const store = useCadStore.getState();
        const entity = this.sourceEntity || store.entities.find(e => store.selectedIds.includes(e.id));
        if (!entity) {
            this.setPrompt('Ötelenecek nesneyi seçin:');
            return;
        }
        let refPoint: Point = { x: 0, y: 0 };
        const geom = entity.geometry as any;
        if (geom.type === 'LINE') {
            const v = { x: geom.end.x - geom.start.x, y: geom.end.y - geom.start.y };
            const len = Math.hypot(v.x, v.y) || 1;
            const nx = -v.y / len;
            const ny = v.x / len;
            const mid = { x: (geom.start.x + geom.end.x) / 2, y: (geom.start.y + geom.end.y) / 2 };
            refPoint = { x: mid.x + nx * (isOutside ? 20 : -20), y: mid.y + ny * (isOutside ? 20 : -20) };
        } else if (geom.center) {
            refPoint = { x: geom.center.x + (isOutside ? 9999 : 0), y: geom.center.y };
        } else if (geom.vertices && geom.vertices.length > 0) {
            refPoint = { x: geom.vertices[0].x + (isOutside ? 9999 : 0), y: geom.vertices[0].y };
        }
        const offset = offsetEntity(entity, this.offsetDist, refPoint);
        if (offset) {
            store.addEntity(offset);
            store.setPreviewEntity(null);
            this.setPrompt(`✅ Öteleme uygulandı (${this.offsetDist} mm).`);
        }
    }

    onValueInput(value: string): void {
        const dist = parseFloat(value);
        if (!isNaN(dist) && dist > 0) {
            this.offsetDist = dist;
            if (this.sourceEntity) {
                this.state = 'SPECIFY_SIDE';
                this.setPrompt(`Öteleme yönünü seçin (Mesafe: ${this.offsetDist}mm):`);
            } else {
                this.state = 'SELECT_ENTITY';
                this.setPrompt(`Ötelenecek şekli seçin (Mesafe: ${this.offsetDist}mm):`);
            }
        }
    }

    onKeyInput(key: string): void {
        if (key === 'Escape') {
            this.cancel();
        } else {
            super.onKeyInput(key);
        }
    }

    onMouseMove(point: Point): void {
        if (this.state === 'SPECIFY_SIDE' && this.sourceEntity) {
            // Preview offset
            const offset = offsetEntity(this.sourceEntity, this.offsetDist, point);
            if (offset) {
                useCadStore.getState().setPreviewEntity({
                    ...offset,
                    color: '#cccccc'
                });
            }
        }
    }

    onPointInput(point: Point): void {
        if (this.state === 'ENTER_DISTANCE') {
            // User clicked to set distance (unsupported for now, needs 2 points)
            // Just assume they want to select entity if they click without typing?
            // Typically in CAD, click 1 = start input for distance through points.
            // Let's stick to simple flow: Type distance -> Enter -> Select -> Click Side.
            this.setPrompt('Please type distance and press Enter.');
            return;
        }

        if (this.state === 'SELECT_ENTITY') {
            // Find entity
            const zoom = useCadStore.getState().viewport.zoom;
            const entities = useCadStore.getState().entities;
            const entity = findEntityAtPoint(point, entities, zoom);

            if (entity) {
                this.sourceEntity = entity;
                this.state = 'SPECIFY_SIDE';
                this.setPrompt('Specify point on side to offset:');

                // Highlight source?
                // For now, simpler to just proceed.
            } else {
                // No entity found
            }
        }
        else if (this.state === 'SPECIFY_SIDE' && this.sourceEntity) {
            // Perform Offset
            const offset = offsetEntity(this.sourceEntity, this.offsetDist, point);
            if (offset) {
                useCadStore.getState().addEntity(offset);
            }

            // Loop command: Select object to offset...
            this.sourceEntity = null;
            this.state = 'SELECT_ENTITY';
            this.setPrompt('Select object to offset:');
            useCadStore.getState().setPreviewEntity(null);
        }
    }

    cancel(): void {
        this.sourceEntity = null;
        useCadStore.getState().setPreviewEntity(null);
        super.cancel();
    }
}
