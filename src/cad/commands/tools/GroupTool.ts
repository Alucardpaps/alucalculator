import { BaseCommand } from '../BaseCommand';
import { Point } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';

export class GroupTool extends BaseCommand {
    public id = 'GROUP';
    public name = 'GROUP';
    public displayName = 'Group';

    start(): void {
        const store = useCadStore.getState();
        if (store.selectedIds.length >= 2) {
            const gid = store.groupSelectedEntities();
            if (gid) {
                this.setPrompt(`Group created (${store.selectedIds.length} entities bound).`);
            }
            this.finish();
        } else {
            this.setPrompt('Select entities to group (Press Enter when done):');
        }
    }

    onKeyInput(key: string): void {
        if (key === 'Enter') {
            const store = useCadStore.getState();
            if (store.selectedIds.length >= 2) {
                const gid = store.groupSelectedEntities();
                if (gid) {
                    this.setPrompt(`Group created (${store.selectedIds.length} entities bound).`);
                }
            } else {
                this.setPrompt('Need at least 2 entities to create a group.');
            }
            this.finish();
        }
    }

    onPointInput(point: Point): void {
        const { entities, viewport, selectEntity, selectedIds } = useCadStore.getState();
        const entity = findEntityAtPoint(point, entities, viewport.zoom);
        if (entity) {
            selectEntity(entity.id, true);
            const count = selectedIds.includes(entity.id) ? selectedIds.length : selectedIds.length + 1;
            this.setPrompt(`${count} entities selected. Press Enter to group:`);
        }
    }
}
