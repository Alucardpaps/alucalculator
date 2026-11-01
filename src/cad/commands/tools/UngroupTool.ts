import { BaseCommand } from '../BaseCommand';
import { Point } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';

export class UngroupTool extends BaseCommand {
    public id = 'UNGROUP';
    public name = 'UNGROUP';
    public displayName = 'Ungroup';

    start(): void {
        const store = useCadStore.getState();
        if (store.selectedIds.length > 0) {
            const count = store.ungroupSelectedEntities();
            this.setPrompt(count > 0 ? `Ungrouped ${count} entities.` : 'Selected entities are not grouped.');
            this.finish();
        } else {
            this.setPrompt('Select group to ungroup:');
        }
    }

    onPointInput(point: Point): void {
        const store = useCadStore.getState();
        const entity = findEntityAtPoint(point, store.entities, store.viewport.zoom);
        if (entity) {
            store.selectEntity(entity.id, false);
            const count = store.ungroupSelectedEntities();
            this.setPrompt(count > 0 ? `Ungrouped ${count} entities.` : 'Entity is not in a group.');
            this.finish();
        }
    }
}
