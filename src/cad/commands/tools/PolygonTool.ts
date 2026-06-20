
import { BaseCommand } from '../BaseCommand';
import { Point, createHexagonEntity, CadEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';

/**
 * PolygonTool — Draws a regular N-sided polygon.
 * Supersedes the legacy HexagonTool with full parametric control.
 */
export class PolygonTool extends BaseCommand {
    public id = 'POLYGON';
    public name = 'POLYGON';
    public displayName = 'Polygon';

    private centerPoint: Point | null = null;
    
    // Parameters with defaults
    private params = {
        sides: 6,
        radius: 20,
        rotation: 0
    };

    start(): void {
        this.centerPoint = null;
        this.setPrompt('Specify center point for polygon:');
    }

    /**
     * ToolPropertyPanel calls this when "Apply" or live changes happen.
     */
    setParams(params: any): void {
        this.params = { ...this.params, ...params };
        if (this.centerPoint) {
            this.updatePreview();
        }
    }

    onMouseMove(point: Point): void {
        if (this.centerPoint) {
            const dx = point.x - this.centerPoint.x;
            const dy = point.y - this.centerPoint.y;
            this.params.radius = Math.sqrt(dx * dx + dy * dy);
            this.updatePreview();
        }
    }

    onPointInput(point: Point): void {
        if (!this.centerPoint) {
            this.centerPoint = point;
            this.setPrompt('Specify radius (or click):');
            this.updatePreview();
        } else {
            this.executeCreation();
        }
    }

    onValueInput(value: string): void {
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) {
            this.params.radius = num;
            if (this.centerPoint) {
                this.executeCreation();
            }
        }
    }

    private updatePreview(): void {
        if (!this.centerPoint) return;

        const store = useCadStore.getState();
        const preview = this.createEntity(
            this.centerPoint, 
            this.params.radius, 
            store.activeLayerId, 
            'rgba(0, 229, 255, 0.3)'
        );
        store.setPreviewEntity(preview);
    }

    private executeCreation(): void {
        if (!this.centerPoint) return;

        const store = useCadStore.getState();
        store.pushHistory('Polygon');

        const layer = store.layers.find(l => l.id === store.activeLayerId);
        const entity = this.createEntity(
            this.centerPoint, 
            this.params.radius, 
            store.activeLayerId, 
            layer?.color || '#ffffff'
        );

        store.addEntity(entity);
        
        // Reset
        this.centerPoint = null;
        store.setPreviewEntity(null);
        this.setPrompt('Specify center point for next polygon:');
    }

    /**
     * Maps the parametric polygon to the kernel's HEXAGON type (for now)
     * but injects custom 'sides' property which the RenderPipeline will handle.
     */
    private createEntity(center: Point, radius: number, layerId: string, color: string): CadEntity {
        return {
            id: crypto.randomUUID(),
            layerId,
            color,
            isVisible: true,
            isSelected: false,
            geometry: {
                type: 'HEXAGON' as any, // We reuse the HEXAGON case in RenderPipeline
                center,
                radius,
                rotation: (this.params.rotation * Math.PI) / 180,
                sides: Math.max(3, Math.round(this.params.sides))
            } as any
        };
    }

    cancel(): void {
        this.centerPoint = null;
        useCadStore.getState().setPreviewEntity(null);
        super.cancel();
    }
}
