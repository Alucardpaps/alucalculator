/**
 * AluCAD — SCALE tool
 *
 * Select objects → base point → scale factor (typed) or second point
 * whose distance from the base is the factor. Matches AutoCAD SCALE.
 */

import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { Transformer } from '../../kernel/Transformer';
import { distance } from '../../kernel/GeometryKernel';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';

export class ScaleTool extends BaseCommand {
    public id = 'SCALE';
    public name = 'SCALE';
    public displayName = 'Scale';

    public state: 'SELECT_OBJECTS' | 'PICK_BASE' | 'SPECIFY_FACTOR' = 'SELECT_OBJECTS';
    private basePoint: Point | null = null;
    private factor = 2;
    private referenceMode = false;
    private referenceLength: number | null = null;

    start(): void {
        this.basePoint = null;
        this.factor = 2;
        this.referenceMode = false;
        this.referenceLength = null;

        const { selectedIds } = useCadStore.getState();
        if (selectedIds.length > 0) {
            this.state = 'PICK_BASE';
            this.setPrompt('📍 Adım 2: Ölçekleme merkez noktasını (Base Point) seçin (veya doğrudan faktör girin):');
        } else {
            this.state = 'SELECT_OBJECTS';
            this.setPrompt('🔵 Adım 1: Ölçeklenecek nesneyi seçin (Tıklayın):');
        }
    }

    public setScaleFactor(factor: number): void {
        if (!Number.isFinite(factor) || Math.abs(factor) < 1e-9) return;
        this.factor = factor;

        // If basePoint not picked yet, use center of first selected entity or viewport center
        if (!this.basePoint) {
            const { selectedIds, entities, viewport } = useCadStore.getState();
            const target = entities.find(e => selectedIds.includes(e.id));
            if (target) {
                const g = target.geometry as any;
                if (g.center) {
                    this.basePoint = g.center;
                } else if (g.start && g.end) {
                    this.basePoint = { x: (g.start.x + g.end.x) / 2, y: (g.start.y + g.end.y) / 2 };
                } else if (g.vertices && g.vertices.length > 0) {
                    const avgX = g.vertices.reduce((s: number, p: Point) => s + p.x, 0) / g.vertices.length;
                    const avgY = g.vertices.reduce((s: number, p: Point) => s + p.y, 0) / g.vertices.length;
                    this.basePoint = { x: avgX, y: avgY };
                } else {
                    this.basePoint = viewport.center;
                }
            } else {
                this.basePoint = viewport.center;
            }
        }

        this.applyScale(factor);
    }

    onMouseMove(_point: Point): void {}

    onPointInput(point: Point): void {
        const store = useCadStore.getState();

        if (this.state === 'SELECT_OBJECTS') {
            const entity = findEntityAtPoint(point, store.entities, store.viewport.zoom);
            if (entity) {
                store.selectEntity(entity.id, false);
                this.state = 'PICK_BASE';
                this.setPrompt('📍 Adım 2: Ölçekleme merkez noktasını seçin (veya faktör girin):');
            } else {
                this.setPrompt('Nesne bulunamadı. Lütfen ölçeklenecek şekle tıklayın:');
            }
            return;
        }

        if (this.state === 'PICK_BASE' || !this.basePoint) {
            this.basePoint = point;
            this.state = 'SPECIFY_FACTOR';
            this.setPrompt('Ölçek katsayısını girin (Örn: 2 veya 0.5, ya da 2. noktaya tıklayın):');
            store.setCommandState('AWAITING_VALUE');
            return;
        }

        if (this.referenceMode && this.referenceLength === null) {
            this.referenceLength = Math.max(1e-9, distance(this.basePoint, point));
            this.setPrompt('Yeni uzunluğu seçin (tıklayın veya yazın):');
            return;
        }
        if (this.referenceMode && this.referenceLength !== null) {
            const newLen = distance(this.basePoint, point);
            this.applyScale(newLen / this.referenceLength);
            return;
        }

        const d = distance(this.basePoint, point);
        if (d > 1e-9) this.applyScale(d / 50); // Normalized drag distance
    }

    onValueInput(value: string): void {
        const raw = value.trim();
        const upper = raw.toUpperCase();
        if (upper === 'R' || upper === 'REFERENCE' || upper === 'REF') {
            this.referenceMode = true;
            this.setPrompt('Referans uzunluğu belirtin:');
            return;
        }
        const n = parseFloat(raw.replace(',', '.'));
        if (Number.isNaN(n)) {
            useCadStore.getState().setCommandPrompt(`Geçersiz ölçek faktörü: ${raw}`);
            return;
        }
        this.setScaleFactor(n);
    }

    private applyScale(factor: number): void {
        if (!this.basePoint) return;
        if (!Number.isFinite(factor) || Math.abs(factor) < 1e-9) {
            useCadStore.getState().setCommandPrompt('Ölçek faktörü 0 olamaz.');
            return;
        }
        const { selectedIds, entities, updateEntity } = useCadStore.getState();
        const toScale = entities.filter((e) => selectedIds.includes(e.id));
        if (toScale.length === 0) {
            useCadStore.getState().setCommandPrompt('Ölçeklenecek nesne seçilmedi.');
            return;
        }
        toScale.forEach((entity) => {
            const scaled = Transformer.scale(entity, this.basePoint!, factor);
            updateEntity(entity.id, scaled);
        });
        useCadStore.setState({
            commandPrompt: `✅ ${toScale.length} nesne ×${factor.toFixed(2)} oranında ölçeklendi.`,
            commandState: 'IDLE',
            activeCommand: null,
        });
        this.basePoint = null;
        this.referenceMode = false;
        this.referenceLength = null;
    }

    cancel(): void {
        this.basePoint = null;
        this.referenceMode = false;
        this.referenceLength = null;
        super.cancel();
    }
}
