
import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { Transformer } from '../../kernel/Transformer';
import { vector } from '../../kernel/GeometryKernel';
import { GhostRenderer } from '../../render/GhostRenderer';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';

export class RotateTool extends BaseCommand {
    public id = 'ROTATE';
    public name = 'ROTATE';
    public displayName = 'Rotate';

    public state: 'SELECT_OBJECTS' | 'PICK_BASE' | 'SPECIFY_ANGLE' = 'SELECT_OBJECTS';
    private centerPoint: Point | null = null;
    private currentPoint: Point | null = null;
    private currentAngleRad: number = 0;
    private ghostEntities: CadEntity[] = [];

    start(): void {
        const { selectedIds } = useCadStore.getState();
        if (selectedIds.length > 0) {
            this.state = 'PICK_BASE';
            this.setPrompt('📍 Adım 2: Döndürme merkez noktasını (Base Point) seçin:');
        } else {
            this.state = 'SELECT_OBJECTS';
            this.setPrompt('🔵 Adım 1: Döndürülecek nesneleri seçin (Tıklayın, bitince Enter\'a basın):');
        }
        this.centerPoint = null;
        this.currentPoint = null;
        this.currentAngleRad = 0;
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
                this.centerPoint = point;
                this.state = 'SPECIFY_ANGLE';
                this.setPrompt('🟡 Adım 3: Döndürme açısını belirleyin (İmleci hareket ettirin veya açı girin):');
            }
        } else if (this.state === 'PICK_BASE') {
            this.centerPoint = point;
            this.state = 'SPECIFY_ANGLE';
            this.setPrompt('🟡 Adım 3: Döndürme açısını belirleyin (İmleci hareket ettirin veya açı girin):');
        } else if (this.state === 'SPECIFY_ANGLE') {
            if (this.centerPoint) {
                const v = vector(this.centerPoint, point);
                const angleRad = Math.atan2(v.y, v.x);
                this.applyRotation(angleRad);
            }
        }
    }

    onMouseMove(point: Point): void {
        this.currentPoint = point;

        if (this.state === 'SPECIFY_ANGLE' && this.centerPoint) {
            const v = vector(this.centerPoint, point);
            this.currentAngleRad = Math.atan2(v.y, v.x);

            // Compute ghost transformed entities
            const { selectedIds, entities } = useCadStore.getState();
            const toRotate = entities.filter(e => selectedIds.includes(e.id));
            this.ghostEntities = toRotate.map(ent =>
                Transformer.rotate(ent, this.centerPoint!, this.currentAngleRad)
            );

            const deg = (this.currentAngleRad * 180 / Math.PI);
            const normDeg = ((deg % 360) + 360) % 360;
            useCadStore.setState({
                commandPrompt: `🟡 Açı: ${normDeg.toFixed(1)}° (${deg >= 0 ? '+' : ''}${deg.toFixed(1)}°) | Tıklayarak onaylayın`
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
                    this.setPrompt('📍 Adım 2: Döndürme merkez noktasını (Base Point) seçin:');
                } else {
                    this.setPrompt('En az 1 nesne seçmelisiniz:');
                }
            } else if (this.state === 'SPECIFY_ANGLE') {
                this.applyRotation(this.currentAngleRad);
            }
        }
    }

    onValueInput(value: string): void {
        const angleDeg = parseFloat(value);
        if (!isNaN(angleDeg)) {
            this.setAngle(angleDeg);
        }
    }

    /**
     * Set exact rotation angle in degrees from property panel or CLI
     */
    public setAngle(angleDeg: number): void {
        const angleRad = (angleDeg * Math.PI) / 180;
        this.currentAngleRad = angleRad;

        // If no base point set yet, pick center of selected entities
        if (!this.centerPoint) {
            const { selectedIds, entities } = useCadStore.getState();
            const toRotate = entities.filter(e => selectedIds.includes(e.id));
            if (toRotate.length > 0) {
                // Approximate center
                let cx = 0, cy = 0;
                toRotate.forEach(e => {
                    if (e.geometry.type === 'LINE') {
                        cx += (e.geometry.start.x + e.geometry.end.x) / 2;
                        cy += (e.geometry.start.y + e.geometry.end.y) / 2;
                    } else if (e.geometry.type === 'CIRCLE' || e.geometry.type === 'ARC' || e.geometry.type === 'RECTANGLE') {
                        cx += e.geometry.center.x;
                        cy += e.geometry.center.y;
                    }
                });
                this.centerPoint = { x: cx / toRotate.length, y: cy / toRotate.length };
            } else {
                this.centerPoint = { x: 0, y: 0 };
            }
        }

        this.applyRotation(angleRad);
    }

    public applyRotation(angleRad: number): void {
        if (!this.centerPoint) return;

        const store = useCadStore.getState();
        const { selectedIds, entities, updateEntity } = store;
        const toRotate = entities.filter(e => selectedIds.includes(e.id));

        if (toRotate.length === 0) {
            this.cancel();
            return;
        }

        store.pushHistory('Rotate');
        toRotate.forEach(entity => {
            const rotated = Transformer.rotate(entity, this.centerPoint!, angleRad);
            updateEntity(entity.id, rotated);
        });

        this.finish();
    }

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        const { viewport, selectedIds, entities } = useCadStore.getState();
        const toRotate = entities.filter(e => selectedIds.includes(e.id));

        // 1. Source entities: Cyan highlight (#3ad0e6)
        if (toRotate.length > 0) {
            GhostRenderer.drawGhostEntities(ctx, toRotate, transform, viewport.zoom, '#3ad0e6');
        }

        // 2. Base point: Crimson bullseye (#e85d5d)
        if (this.centerPoint) {
            GhostRenderer.drawBasePointMarker(ctx, this.centerPoint, transform, 'MERKEZ (BASE)', '#e85d5d');
        }

        // 3. Angle arc & guide: Amber (#e6b84a)
        if (this.state === 'SPECIFY_ANGLE' && this.centerPoint && this.currentPoint) {
            GhostRenderer.drawRotationGuide(
                ctx,
                this.centerPoint,
                this.currentPoint,
                this.currentAngleRad,
                transform,
                '#e6b84a'
            );
        }

        // 4. Transformed preview ghost: Bright Green (#3dd68c)
        if (this.state === 'SPECIFY_ANGLE' && this.ghostEntities.length > 0) {
            GhostRenderer.drawGhostEntities(ctx, this.ghostEntities, transform, viewport.zoom, '#3dd68c');
        }
    }

    cancel(): void {
        this.centerPoint = null;
        this.currentPoint = null;
        this.ghostEntities = [];
        this.state = 'SELECT_OBJECTS';
        super.cancel();
    }
}
