import { BaseCommand } from '../BaseCommand';
import { Point } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';

export class ExplodeTool extends BaseCommand {
    public id = 'EXPLODE';
    public name = 'EXPLODE';
    public displayName = 'Explode';

    start(): void {
        const store = useCadStore.getState();
        if (store.selectedIds.length > 0) {
            const count = store.explodeSelectedEntities();
            this.setPrompt(count > 0 ? `Exploded ${count} compound objects into primitive elements.` : 'No compound entities selected to explode.');
            this.finish();
        } else {
            this.setPrompt('Select compound entity (polyline, rectangle, block) to explode:');
        }
    }

    onPointInput(point: Point): void {
        const store = useCadStore.getState();
        const entity = findEntityAtPoint(point, store.entities, store.viewport.zoom);
        if (entity) {
            store.selectEntity(entity.id, false);
            const count = store.explodeSelectedEntities();
            this.setPrompt(count > 0 ? `Exploded ${count} compound objects.` : 'Entity cannot be exploded.');
            this.finish();
        }
    }
}
