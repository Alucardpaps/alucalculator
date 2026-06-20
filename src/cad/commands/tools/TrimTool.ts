/**
 * AluCAD — Universal Trim Tool
 * 
 * Trims ANY entity type (Line, Circle, Arc, Rectangle) at intersection
 * points with cutting edges. Uses the GeometryEngine for all calculations.
 */

import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';
import { universalTrim } from '../../kernel/GeometryEngine';

export class TrimTool extends BaseCommand {
    public id = 'TRIM';
    public name = 'TRIM';
    public displayName = 'Trim';

    private cuttingEdges: CadEntity[] = [];
    private state: 'SELECT_CUTTING' | 'SELECT_OBJECT' = 'SELECT_CUTTING';

    start(): void {
        this.cuttingEdges = [];
        this.state = 'SELECT_CUTTING';
        this.setPrompt('Select cutting edges (Enter to select all):');
    }

    onKeyInput(key: string): void {
        if (key === 'Enter') {
            if (this.state === 'SELECT_CUTTING') {
                if (this.cuttingEdges.length === 0) {
                    this.cuttingEdges = [...useCadStore.getState().entities];
                }
                this.state = 'SELECT_OBJECT';
                this.setPrompt('Select object to trim:');
            } else {
                this.cancel();
            }
        }
    }

    onPointInput(point: Point): void {
        const { entities, viewport } = useCadStore.getState();
        const entity = findEntityAtPoint(point, entities, viewport.zoom);

        if (this.state === 'SELECT_CUTTING') {
            if (entity) {
                if (!this.cuttingEdges.find(e => e.id === entity.id)) {
                    this.cuttingEdges.push(entity);
                    this.setPrompt(`${this.cuttingEdges.length} cutting edge(s) selected. Enter to finish:`);
                }
            } else {
                if (this.cuttingEdges.length > 0) {
                    this.state = 'SELECT_OBJECT';
                    this.setPrompt('Select object to trim:');
                } else {
                    this.cuttingEdges = [...entities];
                    this.state = 'SELECT_OBJECT';
                    this.setPrompt('Select object to trim (All selected):');
                }
            }
        } else if (this.state === 'SELECT_OBJECT') {
            if (entity) {
                this.performTrim(entity, point);
            }
        }
    }

    private performTrim(entity: CadEntity, pickPoint: Point) {
        const result = universalTrim(entity, this.cuttingEdges, pickPoint);

        if (!result) {
            this.setPrompt('Cannot trim this entity. Select another:');
            return;
        }

        const store = useCadStore.getState();
        store.pushHistory('Trim');
        store.removeEntity(entity.id);

        for (const newEntity of result) {
            store.addEntity(newEntity);
        }

        this.setPrompt('Trimmed. Select next object to trim:');
    }

    onMouseMove(_point: Point): void {
        // Future: highlight segment that would be removed
    }
}
