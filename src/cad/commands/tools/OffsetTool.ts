
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
        this.state = 'ENTER_DISTANCE';
        this.setPrompt(`Specify offset distance <${this.offsetDist}>:`);
    }

    onValueInput(value: string): void {
        if (this.state === 'ENTER_DISTANCE') {
            const dist = parseFloat(value);
            if (!isNaN(dist) && dist > 0) {
                this.offsetDist = dist;
                this.state = 'SELECT_ENTITY';
                this.setPrompt('Select object to offset:');
            } else {
                this.setPrompt(`Invalid distance. Specify offset distance <${this.offsetDist}>:`);
            }
        }
    }

    onKeyInput(key: string): void {
        if (key === 'Enter' && this.state === 'ENTER_DISTANCE') {
            // Accept default
            this.state = 'SELECT_ENTITY';
            this.setPrompt('Select object to offset:');
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
