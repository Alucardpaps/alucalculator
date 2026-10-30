import { BaseCommand } from '../BaseCommand';
import { Point } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';

/**
 * ERASE — with a selection it erases at once (handled by the processor); without one it
 * stays active: every picked object is erased, Enter or Escape ends the command.
 */
export class EraseTool extends BaseCommand {
    public id = 'ERASE';
    public name = 'ERASE';
    public displayName = 'Erase';
    private erased = 0;

    start(): void {
        this.setPrompt('Select objects to erase (Enter to finish):');
    }

    onPointInput(point: Point): void {
        const store = useCadStore.getState();
        const entity = findEntityAtPoint(point, store.entities, store.viewport.zoom);
        if (!entity) return;
        store.removeEntity(entity.id);
        this.erased++;
        this.setPrompt(`Erased ${this.erased} object${this.erased === 1 ? '' : 's'}. Select more or press Enter:`);
    }

    onValueInput(value: string): void {
        if (!value.trim()) this.finish();
        else super.onValueInput(value);
    }

    onKeyInput(key: string): void {
        if (key === 'Enter' || key === 'Escape') {
            this.finish();
            useCadStore.getState().setCommandPrompt(this.erased ? `Erased ${this.erased} object${this.erased === 1 ? '' : 's'}` : 'Type a command');
            return;
        }
        super.onKeyInput(key);
    }
}
