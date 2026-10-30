
import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { Transformer } from '../../kernel/Transformer';
import { sub } from '../../kernel/GeometryKernel';
import { GhostRenderer } from '../../render/GhostRenderer';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';

export class CopyTool extends BaseCommand {
    public id = 'COPY';
    public name = 'COPY';
    public displayName = 'Copy';

    public state: 'SELECT_OBJECTS' | 'PICK_BASE' | 'SPECIFY_DESTINATION' = 'SELECT_OBJECTS';
    private basePoint: Point | null = null;
    private currentPoint: Point | null = null;
    private ghostEntities: CadEntity[] = [];

    start(): void {
        const { selectedIds } = useCadStore.getState();
        if (selectedIds.length > 0) {
            this.state = 'PICK_BASE';
            this.setPrompt('📍 Adım 2: Kopyalama temel noktasını (Base Point) seçin:');
        } else {
            this.state = 'SELECT_OBJECTS';
            this.setPrompt('🔵 Adım 1: Kopyalanacak nesneleri seçin (Tıklayın, bitince Enter\'a basın):');
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
                this.setPrompt('🟣 Adım 3: Hedef konumu seçin (veya panelden ΔX, ΔY girin):');
            }
        } else if (this.state === 'PICK_BASE') {
            this.basePoint = point;
            this.state = 'SPECIFY_DESTINATION';
            this.setPrompt('🟣 Adım 3: Hedef konumu seçin (veya panelden ΔX, ΔY girin):');
        } else if (this.state === 'SPECIFY_DESTINATION') {
            if (this.basePoint) {
                const vector = sub(point, this.basePoint);
                this.applyCopy(vector);
            }
        }
    }

    onMouseMove(point: Point): void {
        this.currentPoint = point;

        if (this.state === 'SPECIFY_DESTINATION' && this.basePoint) {
            const vector = sub(point, this.basePoint);
            const { selectedIds, entities } = useCadStore.getState();
            const toCopy = entities.filter(e => selectedIds.includes(e.id));
            this.ghostEntities = toCopy.map(ent => Transformer.copy(ent, vector));

            const dist = Math.hypot(vector.x, vector.y);
            useCadStore.setState({
                commandPrompt: `🟣 ΔX: ${vector.x >= 0 ? '+' : ''}${vector.x.toFixed(1)}  ΔY: ${vector.y >= 0 ? '+' : ''}${vector.y.toFixed(1)} (L: ${dist.toFixed(1)} mm) | Tıklayarak kopyalayın`
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
                    this.setPrompt('📍 Adım 2: Kopyalama temel noktasını (Base Point) seçin:');
                } else {
                    this.setPrompt('En az 1 nesne seçmelisiniz:');
                }
            } else if (this.state === 'SPECIFY_DESTINATION' && this.basePoint && this.currentPoint) {
                this.applyCopy(sub(this.currentPoint, this.basePoint));
            }
        }
    }

    onValueInput(value: string): void {
        const parts = value.split(',');
        if (parts.length >= 2) {
            const dx = parseFloat(parts[0]);
            const dy = parseFloat(parts[1]);
            const count = parts.length >= 3 ? parseInt(parts[2], 10) : 1;
            if (!isNaN(dx) && !isNaN(dy)) {
                this.setDisplacement(dx, dy, count);
            }
        }
    }

    /**
     * Copy by exact delta displacement from property panel or CLI
     */
    public setDisplacement(dx: number, dy: number, count: number = 1): void {
        const safeCount = Math.max(1, Math.min(count || 1, 50));
        const store = useCadStore.getState();
        const { selectedIds, entities, addEntity } = store;
        const toCopy = entities.filter(e => selectedIds.includes(e.id));

        if (toCopy.length === 0) {
            this.cancel();
            return;
        }

        store.pushHistory('Copy');
        for (let i = 1; i <= safeCount; i++) {
            const vec = { x: dx * i, y: dy * i };
            toCopy.forEach(entity => {
                const copy = Transformer.copy(entity, vec);
                addEntity(copy);
            });
        }

        this.finish();
    }

    private applyCopy(vector: Point): void {
        const store = useCadStore.getState();
        const { selectedIds, entities, addEntity } = store;
        const toCopy = entities.filter(e => selectedIds.includes(e.id));

        if (toCopy.length === 0) {
            this.cancel();
            return;
        }

        store.pushHistory('Copy');
        toCopy.forEach(entity => {
            const copy = Transformer.copy(entity, vector);
            addEntity(copy);
        });

        this.finish();
    }

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        const { viewport, selectedIds, entities } = useCadStore.getState();
        const toCopy = entities.filter(e => selectedIds.includes(e.id));

        // 1. Source entities: Cyan highlight (#3ad0e6)
        if (toCopy.length > 0) {
            GhostRenderer.drawGhostEntities(ctx, toCopy, transform, viewport.zoom, '#3ad0e6');
        }

        // 2. Base point: Crimson bullseye (#e85d5d)
        if (this.basePoint) {
            GhostRenderer.drawBasePointMarker(ctx, this.basePoint, transform, 'BAŞLANGIÇ (BASE)', '#e85d5d');
        }

        // 3. Displacement vector: Laser Blue (#7aa2ff)
        if (this.state === 'SPECIFY_DESTINATION' && this.basePoint && this.currentPoint) {
            GhostRenderer.drawDisplacementVector(ctx, this.basePoint, this.currentPoint, transform, '#7aa2ff');
        }

        // 4. Copied preview ghost: Bright Green (#3dd68c)
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
