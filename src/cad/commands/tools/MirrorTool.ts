
import { BaseCommand } from '../BaseCommand';
import { Point } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { Transformer } from '../../kernel/Transformer';

export class MirrorTool extends BaseCommand {
    public id = 'MIRROR';
    public name = 'MIRROR';
    public displayName = 'Mirror';

    private axisStart: Point | null = null;

    start(): void {
        const { selectedIds } = useCadStore.getState();
        if (selectedIds.length === 0) {
            this.setPrompt('Select objects to mirror first');
            this.cancel();
            return;
        }
        this.setPrompt('Specify first point of mirror line');
    }

    onMouseMove(point: Point): void {
        // Preview logic would go here
    }

    onPointInput(point: Point): void {
        if (!this.axisStart) {
            this.axisStart = point;
            this.setPrompt('Specify second point of mirror line');
        } else {
            // Execute Mirror
            const { selectedIds, entities, updateEntity } = useCadStore.getState();
            const toMirror = entities.filter(e => selectedIds.includes(e.id));

            toMirror.forEach(entity => {
                const mirrored = Transformer.mirror(entity, this.axisStart!, point);
                updateEntity(entity.id, mirrored);
            });

            // Note: AutoCAD usually asks "Delete source objects? [Yes/No]"
            // We default to No (Keep both? No, wait. Transformer returns NEW geometry but we updated existing?)
            // updateEntity REPLACES the geometry. So this is a Transformation (Move/Flip), not a Copy Mirror.
            // If they want Copy Mirror, they should Copy first or we need toggle.
            // Standard "Mirror" usually flips the object in place unless copy option used.
            // Wait, AutoCAD defaults to:
            // 1. Select
            // 2. Axis
            // 3. Delete source objects? <N>
            // If N, it Creates Copies. If Y, it Moves.

            // For MVP, let's make it transform (Move/Flip). 
            // If user wants copy, they can copy first.
            // OR we can make it always copy?
            // Let's stick to transform for now to match other tools.

            this.cancel();
        }
    }

    cancel(): void {
        this.axisStart = null;
        super.cancel();
    }
}
