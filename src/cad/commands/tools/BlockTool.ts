import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity, BlockDefinition } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { BlockManager } from '../../blocks/BlockManager';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';

export class BlockTool extends BaseCommand {
    public id = 'BLOCK';
    public name = 'BLOCK';
    public displayName = 'Create Block';

    private selectedEntities: CadEntity[] = [];
    private basePoint: Point | null = null;
    private blockName: string = '';
    private step: 'SELECT_ENTITIES' | 'PICK_BASEPOINT' | 'ENTER_NAME' = 'SELECT_ENTITIES';

    start(): void {
        const store = useCadStore.getState();
        if (store.selectedIds.length > 0) {
            this.selectedEntities = store.entities.filter(e => store.selectedIds.includes(e.id));
            this.step = 'PICK_BASEPOINT';
            this.setPrompt('Specify insertion base point for block (or click on canvas):');
        } else {
            this.step = 'SELECT_ENTITIES';
            this.setPrompt('Select entities to convert to block (Press Enter when done):');
        }
    }

    onKeyInput(key: string): void {
        if (key === 'Enter') {
            if (this.step === 'SELECT_ENTITIES') {
                const store = useCadStore.getState();
                if (store.selectedIds.length > 0) {
                    this.selectedEntities = store.entities.filter(e => store.selectedIds.includes(e.id));
                    this.step = 'PICK_BASEPOINT';
                    this.setPrompt('Specify insertion base point for block:');
                } else {
                    this.setPrompt('No entities selected. Select objects first.');
                    this.finish();
                }
            }
        }
    }

    onPointInput(point: Point): void {
        if (this.step === 'SELECT_ENTITIES') {
            const store = useCadStore.getState();
            const entity = findEntityAtPoint(point, store.entities, store.viewport.zoom);
            if (entity) {
                store.selectEntity(entity.id, true);
                this.setPrompt(`${store.selectedIds.length} entities selected. Press Enter when done:`);
            }
        } else if (this.step === 'PICK_BASEPOINT') {
            this.basePoint = point;
            this.step = 'ENTER_NAME';
            this.setPrompt('Type block name in command line and press Enter:');
        }
    }

    onValueInput(value: string | number): void {
        if (this.step === 'ENTER_NAME' && this.basePoint && this.selectedEntities.length > 0) {
            const name = String(value).trim() || `Block_${Date.now().toString().slice(-4)}`;
            const newBlock = BlockManager.saveBlock({
                name,
                category: 'Custom',
                basePoint: this.basePoint,
                entities: this.selectedEntities
            });

            this.setPrompt(`Block "${newBlock.name}" saved to library (${this.selectedEntities.length} entities).`);
            this.finish();
        }
    }
}
