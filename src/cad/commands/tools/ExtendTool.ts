
import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity, createLineEntity } from '../../kernel/types';
import { distance } from '../../kernel/GeometryKernel';
import { useCadStore } from '../../store/cadStore';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';
import { extendLineToBoundary } from '../../kernel/GeometryKernel';

export class ExtendTool extends BaseCommand {
    public id = 'EXTEND';
    public name = 'EXTEND';
    public displayName = 'Extend';

    private boundaries: CadEntity[] = [];
    private state: 'SELECT_BOUNDARY' | 'SELECT_OBJECT' = 'SELECT_BOUNDARY';

    start(): void {
        this.boundaries = [];
        this.state = 'SELECT_BOUNDARY';
        this.setPrompt('Select boundary edges (Enter to select all):');
    }

    onKeyInput(key: string): void {
        if (key === 'Enter') {
            if (this.state === 'SELECT_BOUNDARY') {
                if (this.boundaries.length === 0) {
                    this.boundaries = [...useCadStore.getState().entities];
                }
                this.state = 'SELECT_OBJECT';
                this.setPrompt('Select object to extend (Shift to Trim):');
            } else {
                this.cancel();
            }
        }
    }

    onPointInput(point: Point): void {
        const { entities, viewport } = useCadStore.getState();
        const entity = findEntityAtPoint(point, entities, viewport.zoom);

        if (this.state === 'SELECT_BOUNDARY') {
            if (entity) {
                if (!this.boundaries.find(e => e.id === entity.id)) {
                    this.boundaries.push(entity);
                }
            } else {
                if (this.boundaries.length > 0) {
                    this.state = 'SELECT_OBJECT';
                    this.setPrompt('Select object to extend:');
                } else {
                    this.boundaries = [...entities];
                    this.state = 'SELECT_OBJECT';
                    this.setPrompt('Select object to extend (All selected):');
                }
            }
        } else if (this.state === 'SELECT_OBJECT') {
            if (entity) {
                this.performExtend(entity, point);
            }
        }
    }

    private performExtend(entity: CadEntity, pickPoint: Point) {
        if (entity.geometry.type !== 'LINE') {
            console.warn("Only LINE extend supported currently");
            return;
        }

        const targetGeo = entity.geometry;

        // Find best extension among all boundaries
        // Only extends to the NEAREST intersection in the direction of extension

        let bestNewGeo: { start: Point, end: Point } | null = null;
        let bestDistChange = Infinity;

        this.boundaries.forEach(boundary => {
            if (boundary.id === entity.id) return;
            if (boundary.geometry.type !== 'LINE') return;

            const extended = extendLineToBoundary(targetGeo, boundary.geometry as any);

            if (extended) {
                // Calculate how much we extended
                const oldLen = distance(targetGeo.start, targetGeo.end);
                const newLen = distance(extended.start, extended.end);
                const diff = newLen - oldLen;

                // If diff is practically 0 or negative, skip
                if (diff < 0.001) return;

                // We want the smallest positive extension (nearest boundary)
                if (diff < bestDistChange) {
                    bestDistChange = diff;
                    bestNewGeo = extended;
                }
            }
        });

        if (bestNewGeo) {
            const finalGeo = bestNewGeo as { start: Point, end: Point };
            useCadStore.getState().pushHistory('Extend');
            useCadStore.getState().removeEntity(entity.id);
            useCadStore.getState().addEntity(
                createLineEntity(finalGeo.start, finalGeo.end, entity.layerId, entity.color)
            );
        }
    }

    onMouseMove(point: Point): void {
        // todo preview
    }
}
