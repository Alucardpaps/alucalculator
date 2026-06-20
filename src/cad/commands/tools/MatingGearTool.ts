/**
 * AluCAD — Mating Gear Tool (v2)
 * 
 * Automatically calculates center distance and meshing angle.
 * Added setParams support for property panel.
 */

import { Command } from '../types';
import { Point, createGearEntity, CadEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';

interface MatingParams {
    targetTeeth: number;
}

export class MatingGearTool implements Command {
    id = 'MATING_GEAR';
    name = 'Mating Gear';
    displayName = 'Mating Gear';

    private sourceGear: CadEntity | null = null;
    private params: MatingParams = { targetTeeth: 30 };
    private step: 'SELECT_SOURCE' | 'PLACE' = 'SELECT_SOURCE';

    start(): void {
        this.step = 'SELECT_SOURCE';
        useCadStore.setState({
            commandState: 'AWAITING_POINT',
            commandPrompt: 'Select a gear to mesh with:',
        });
    }

    /**
     * Pre-configure parameters from ToolPropertyPanel.
     */
    setParams(params: Partial<MatingParams>): void {
        if (params.targetTeeth !== undefined && params.targetTeeth >= 6) {
            this.params.targetTeeth = Math.round(params.targetTeeth);
        }
        
        // If we already have a source gear, jump to placement
        if (this.sourceGear) {
            this.step = 'PLACE';
            useCadStore.setState({
                commandState: 'AWAITING_POINT',
                commandPrompt: `z=${this.params.targetTeeth} — Click to set meshing angle:`,
            });
        }
    }

    onPointInput(point: Point): void {
        const store = useCadStore.getState();

        if (this.step === 'SELECT_SOURCE') {
            const entity = store.entities.find(e => 
                e.geometry.type === 'GEAR' && 
                this.isPointInGear(point, e.geometry as any)
            );

            if (entity) {
                this.sourceGear = entity;
                this.step = 'PLACE';
                useCadStore.setState({
                    commandState: 'AWAITING_POINT',
                    commandPrompt: `Source gear found (z=${(entity.geometry as any).teeth}). Click to place mating gear:`,
                });
            } else {
                useCadStore.setState({ commandPrompt: 'No gear found. Click a gear center or body:' });
            }
        } else if (this.step === 'PLACE') {
            this.generateMatingGear(point);
        }
    }

    onValueInput(value: string): void {
        const num = parseInt(value);
        if (isNaN(num) || num <= 0) {
            useCadStore.setState({ commandPrompt: 'Invalid teeth count. Enter a positive integer:' });
            return;
        }

        this.params.targetTeeth = num;
        if (this.sourceGear) {
            this.step = 'PLACE';
            useCadStore.setState({
                commandState: 'AWAITING_POINT',
                commandPrompt: 'Click to place mating gear:',
            });
        }
    }

    onMouseMove(point: Point): void {
        if (this.step === 'PLACE' && this.sourceGear) {
            const g1 = this.sourceGear.geometry as any;
            const m = g1.module;
            const z1 = g1.teeth;
            const z2 = this.params.targetTeeth;
            const a = m * (z1 + z2) / 2; // Center distance

            const dx = point.x - g1.center.x;
            const dy = point.y - g1.center.y;
            const angle = Math.atan2(dy, dx);

            const c2 = {
                x: g1.center.x + a * Math.cos(angle),
                y: g1.center.y + a * Math.sin(angle)
            };

            const store = useCadStore.getState();
            const preview = createGearEntity(c2, m, z2, store.activeLayerId, 'rgba(0, 229, 255, 0.5)');
            (preview.geometry as any).rotation = angle + Math.PI + (Math.PI / z2); 
            
            store.setPreviewEntity(preview);
        }
    }

    onKeyInput(key: string): void {
        if (key === 'Escape') this.cancel();
    }

    cancel(): void {
        this.sourceGear = null;
        useCadStore.setState({ previewEntity: null });
    }

    renderPreview(): void { }

    private isPointInGear(p: Point, g: any): boolean {
        const dx = p.x - g.center.x;
        const dy = p.y - g.center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const rOuter = (g.module * (g.teeth + 2)) / 2;
        return dist <= rOuter + 5;
    }

    private generateMatingGear(point: Point): void {
        if (!this.sourceGear) return;
        const g1 = this.sourceGear.geometry as any;
        const m = g1.module;
        const z1 = g1.teeth;
        const z2 = this.params.targetTeeth;
        const a = m * (z1 + z2) / 2;

        const dx = point.x - g1.center.x;
        const dy = point.y - g1.center.y;
        const angle = Math.atan2(dy, dx);

        const c2 = {
            x: g1.center.x + a * Math.cos(angle),
            y: g1.center.y + a * Math.sin(angle)
        };

        const store = useCadStore.getState();
        store.pushHistory('Mating Gear');

        const entity = createGearEntity(
            c2, m, z2, 
            store.activeLayerId, 
            store.layers.find(l => l.id === store.activeLayerId)?.color || '#ffffff'
        );
        (entity.geometry as any).rotation = angle + Math.PI + (Math.PI / z2);

        store.addEntity(entity);
        useCadStore.setState({ 
            previewEntity: null, 
            commandState: 'AWAITING_POINT', 
            commandPrompt: 'Mating gear created. Select another gear or ESC:' 
        });
        this.sourceGear = null;
        this.step = 'SELECT_SOURCE';
    }
}
