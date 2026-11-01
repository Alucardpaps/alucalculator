
import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { Transformer } from '../../kernel/Transformer';
import { GhostRenderer } from '../../render/GhostRenderer';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';

export class MirrorTool extends BaseCommand {
    public id = 'MIRROR';
    public name = 'MIRROR';
    public displayName = 'Mirror';

    public state: 'SELECT_OBJECTS' | 'PICK_AXIS_START' | 'PICK_AXIS_END' = 'SELECT_OBJECTS';
    private axisStart: Point | null = null;
    private currentPoint: Point | null = null;
    private ghostEntities: CadEntity[] = [];
    public deleteSource: boolean = false;

    start(): void {
        const { selectedIds } = useCadStore.getState();
        if (selectedIds.length > 0) {
            this.state = 'PICK_AXIS_START';
            this.setPrompt('📍 Adım 2: Simetri (Ayna) ekseninin 1. noktasını seçin:');
        } else {
            this.state = 'SELECT_OBJECTS';
            this.setPrompt('🔵 Adım 1: Aynalanacak nesneleri seçin (Tıklayın, bitince Enter\'a basın):');
        }
        this.axisStart = null;
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
                this.setPrompt(`🔵 ${count} nesne seçildi. Bitince Enter'a basın veya ayna eksenini seçmek için tıklayın:`);
            } else if (store.selectedIds.length > 0) {
                this.state = 'PICK_AXIS_START';
                this.axisStart = point;
                this.state = 'PICK_AXIS_END';
                this.setPrompt('🔵 Adım 3: Simetri ekseninin 2. noktasını seçin:');
            }
        } else if (this.state === 'PICK_AXIS_START') {
            this.axisStart = point;
            this.state = 'PICK_AXIS_END';
            this.setPrompt('🔵 Adım 3: Simetri ekseninin 2. noktasını seçin:');
        } else if (this.state === 'PICK_AXIS_END') {
            if (this.axisStart) {
                this.applyMirror(this.axisStart, point);
            }
        }
    }

    onMouseMove(point: Point): void {
        this.currentPoint = point;

        if (this.state === 'PICK_AXIS_END' && this.axisStart) {
            const { selectedIds, entities } = useCadStore.getState();
            const toMirror = entities.filter(e => selectedIds.includes(e.id));
            this.ghostEntities = toMirror.map(ent =>
                Transformer.mirror(ent, this.axisStart!, point)
            );

            useCadStore.setState({
                commandPrompt: '⑂ Eksen belirlendi. Tıklayarak aynalamayı onaylayın.'
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
                    this.state = 'PICK_AXIS_START';
                    this.setPrompt('📍 Adım 2: Simetri ekseninin 1. noktasını seçin:');
                } else {
                    this.setPrompt('En az 1 nesne seçmelisiniz:');
                }
            } else if (this.state === 'PICK_AXIS_END' && this.axisStart && this.currentPoint) {
                this.applyMirror(this.axisStart, this.currentPoint);
            }
        }
    }

    onValueInput(value: string): void {
        const val = value.trim().toUpperCase();
        if (val === 'Y' || val === 'YES' || val === 'EVET') {
            this.deleteSource = true;
        } else if (val === 'N' || val === 'NO' || val === 'HAYIR') {
            this.deleteSource = false;
        }
    }

    /**
     * Apply preset mirror axis (Vertical Y or Horizontal X)
     */
    public applyPresetAxis(preset: 'VERTICAL' | 'HORIZONTAL', deleteSource: boolean = false): void {
        this.deleteSource = deleteSource;
        const { selectedIds, entities } = useCadStore.getState();
        const toMirror = entities.filter(e => selectedIds.includes(e.id));
        if (toMirror.length === 0) return;

        // Find bounding center
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        toRotatePoints:
        for (const e of toMirror) {
            if (e.geometry.type === 'LINE') {
                minX = Math.min(minX, e.geometry.start.x, e.geometry.end.x);
                maxX = Math.max(maxX, e.geometry.start.x, e.geometry.end.x);
                minY = Math.min(minY, e.geometry.start.y, e.geometry.end.y);
                maxY = Math.max(maxY, e.geometry.start.y, e.geometry.end.y);
            } else if (e.geometry.type === 'CIRCLE' || e.geometry.type === 'ARC' || e.geometry.type === 'RECTANGLE') {
                const r = (e.geometry as any).radius || (e.geometry as any).width / 2 || 10;
                minX = Math.min(minX, e.geometry.center.x - r);
                maxX = Math.max(maxX, e.geometry.center.x + r);
                minY = Math.min(minY, e.geometry.center.y - r);
                maxY = Math.max(maxY, e.geometry.center.y + r);
            }
        }

        const cx = (minX + maxX) / 2 || 0;
        const cy = (minY + maxY) / 2 || 0;

        if (preset === 'VERTICAL') {
            this.applyMirror({ x: cx, y: cy - 50 }, { x: cx, y: cy + 50 });
        } else {
            this.applyMirror({ x: cx - 50, y: cy }, { x: cx + 50, y: cy });
        }
    }

    private applyMirror(axisStart: Point, axisEnd: Point): void {
        const store = useCadStore.getState();
        const { selectedIds, entities, updateEntity, addEntity } = store;
        const toMirror = entities.filter(e => selectedIds.includes(e.id));

        if (toMirror.length === 0) {
            this.cancel();
            return;
        }

        store.pushHistory('Mirror');
        toMirror.forEach(entity => {
            const mirrored = Transformer.mirror(entity, axisStart, axisEnd);
            if (this.deleteSource) {
                updateEntity(entity.id, mirrored);
            } else {
                addEntity({
                    ...mirrored,
                    id: crypto.randomUUID()
                });
            }
        });

        this.finish();
    }

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        const { viewport, selectedIds, entities } = useCadStore.getState();
        const toMirror = entities.filter(e => selectedIds.includes(e.id));

        // 1. Source entities: Cyan highlight (#3ad0e6)
        if (toMirror.length > 0) {
            GhostRenderer.drawGhostEntities(ctx, toMirror, transform, viewport.zoom, '#3ad0e6');
        }

        // 2. Axis start point: Crimson bullseye (#e85d5d)
        if (this.axisStart) {
            GhostRenderer.drawBasePointMarker(ctx, this.axisStart, transform, 'EKSEN 1 (START)', '#e85d5d');
        }

        // 3. Mirror axis: Laser Blue (#7aa2ff)
        if (this.state === 'PICK_AXIS_END' && this.axisStart && this.currentPoint) {
            GhostRenderer.drawMirrorAxis(ctx, this.axisStart, this.currentPoint, transform, '#7aa2ff');
        }

        // 4. Mirrored preview ghost: Bright Green (#3dd68c)
        if (this.state === 'PICK_AXIS_END' && this.ghostEntities.length > 0) {
            GhostRenderer.drawGhostEntities(ctx, this.ghostEntities, transform, viewport.zoom, '#3dd68c');
        }
    }

    cancel(): void {
        this.axisStart = null;
        this.currentPoint = null;
        this.ghostEntities = [];
        this.state = 'SELECT_OBJECTS';
        super.cancel();
    }
}
