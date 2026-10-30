
import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { Transformer } from '../../kernel/Transformer';
import { sub } from '../../kernel/GeometryKernel';
import { GhostRenderer } from '../../render/GhostRenderer';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';

export class MoveTool extends BaseCommand {
    public id = 'MOVE';
    public name = 'MOVE';
    public displayName = 'Move';

    public state: 'SELECT_OBJECTS' | 'PICK_BASE' | 'SPECIFY_DESTINATION' = 'SELECT_OBJECTS';
    private basePoint: Point | null = null;
    private currentPoint: Point | null = null;
    private ghostEntities: CadEntity[] = [];

    start(): void {
        const { selectedIds } = useCadStore.getState();
        if (selectedIds.length > 0) {
            this.state = 'PICK_BASE';
            this.setPrompt('📍 Adım 2: Taşıma temel noktasını (Base Point) seçin:');
        } else {
            this.state = 'SELECT_OBJECTS';
            this.setPrompt('🔵 Adım 1: Taşınacak nesneleri seçin (Tıklayın, bitince Enter\'a basın):');
        }
        this.basePoint = null;
        this.currentPoint = null;
        this.ghostEntities = [];
    }

    onPointInput(point: Point): void {
        const store = useCadStore.getState();

        if (this.state === 'SELECT_OBJECTS') {
            const entity = findEntityAtPoint(point, store.entities, store.viewport.zoom);
            if (entity) {
                store.toggleSelection(entity.id);
                const count = useCadStore.getState().selectedIds.length;
                this.setPrompt(`🔵 ${count} nesne seçildi. Bitince Enter'a basın veya temel noktayı seçmek için tıklayın:`);
            } else if (store.selectedIds.length > 0) {
                this.state = 'PICK_BASE';
                this.basePoint = point;
                this.state = 'SPECIFY_DESTINATION';
                this.setPrompt('🟣 Adım 3: Yeni hedef konumu seçin (veya panelden ΔX, ΔY girin):');
            }
        } else if (this.state === 'PICK_BASE') {
            this.basePoint = point;
            this.state = 'SPECIFY_DESTINATION';
            this.setPrompt('🟣 Adım 3: Yeni hedef konumu seçin (veya panelden ΔX, ΔY girin):');
        } else if (this.state === 'SPECIFY_DESTINATION') {
            if (this.basePoint) {
                const vector = sub(point, this.basePoint);
                this.applyMove(vector);
            }
        }
    }

    onMouseMove(point: Point): void {
        this.currentPoint = point;

        if (this.state === 'SPECIFY_DESTINATION' && this.basePoint) {
            const vector = sub(point, this.basePoint);
            const { selectedIds, entities } = useCadStore.getState();
            const toMove = entities.filter(e => selectedIds.includes(e.id));
            this.ghostEntities = toMove.map(ent => Transformer.move(ent, vector));

            const dist = Math.hypot(vector.x, vector.y);
            useCadStore.setState({
                commandPrompt: `🟣 ΔX: ${vector.x >= 0 ? '+' : ''}${vector.x.toFixed(1)}  ΔY: ${vector.y >= 0 ? '+' : ''}${vector.y.toFixed(1)} (L: ${dist.toFixed(1)} mm) | Tıklayarak taşıyın`
            });
        }
    }

    onKeyInput(key: string): void {
        if (key === 'Escape') {
            this.cancel();
        } else if (key === 'Enter') {
            if (this.state === 'SELECT_OBJECTS') {
                const { selectedIds } = useCadStore.getState();
                if (selectedIds.length > 0) {
                    this.state = 'PICK_BASE';
                    this.setPrompt('📍 Adım 2: Taşıma temel noktasını (Base Point) seçin:');
                } else {
                    this.setPrompt('En az 1 nesne seçmelisiniz:');
                }
            } else if (this.state === 'SPECIFY_DESTINATION' && this.basePoint && this.currentPoint) {
                this.applyMove(sub(this.currentPoint, this.basePoint));
            }
        }
    }

    onValueInput(value: string): void {
        const parts = value.split(',');
        if (parts.length >= 2) {
            const dx = parseFloat(parts[0]);
            const dy = parseFloat(parts[1]);
            if (!isNaN(dx) && !isNaN(dy)) {
                this.setDisplacement(dx, dy);
            }
        }
    }

    /**
     * Move by exact delta displacement from property panel or CLI
     */
    public setDisplacement(dx: number, dy: number): void {
        this.applyMove({ x: dx, y: dy });
    }

    private applyMove(vector: Point): void {
        const store = useCadStore.getState();
        const { selectedIds, entities, moveEntities } = store;
        const toMove = entities.filter(e => selectedIds.includes(e.id));

        if (toMove.length === 0) {
            this.cancel();
            return;
        }

        moveEntities(toMove.map(e => e.id), vector);
        this.finish();
    }

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        const { viewport, selectedIds, entities } = useCadStore.getState();
        const toMove = entities.filter(e => selectedIds.includes(e.id));

        // 1. Source entities: Cyan highlight (#3ad0e6)
        if (toMove.length > 0) {
            GhostRenderer.drawGhostEntities(ctx, toMove, transform, viewport.zoom, '#3ad0e6');
        }

        // 2. Base point: Crimson bullseye (#e85d5d)
        if (this.basePoint) {
            GhostRenderer.drawBasePointMarker(ctx, this.basePoint, transform, 'BAŞLANGIÇ (BASE)', '#e85d5d');
        }

        // 3. Displacement vector: Laser Blue (#7aa2ff)
        if (this.state === 'SPECIFY_DESTINATION' && this.basePoint && this.currentPoint) {
            GhostRenderer.drawDisplacementVector(ctx, this.basePoint, this.currentPoint, transform, '#7aa2ff');
        }

        // 4. Moved preview ghost: Bright Green (#3dd68c)
        if (this.state === 'SPECIFY_DESTINATION' && this.ghostEntities.length > 0) {
            GhostRenderer.drawGhostEntities(ctx, this.ghostEntities, transform, viewport.zoom, '#3dd68c');
        }
    }

    cancel(): void {
        this.basePoint = null;
        this.currentPoint = null;
        this.ghostEntities = [];
        this.state = 'SELECT_OBJECTS';
        super.cancel();
    }
}
