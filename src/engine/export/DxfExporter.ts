/**
 * engine/export/DxfExporter.ts
 * 
 * Standardized DXF exporter utilizing the makerjs library.
 * Converts internal geometry entities to standard DXF representation,
 * respecting Layer definitions.
 */

import makerjs from 'makerjs';
import { LayerManager } from '../layer/LayerManager';

export interface ExportEntity {
    type: 'line' | 'circle' | 'arc';
    layerId?: string;
    points?: { x: number, y: number }[]; // For lines
    center?: { x: number, y: number }; // For circles/arcs
    radius?: number; // For circles/arcs
    startAngle?: number; // For arcs
    endAngle?: number; // For arcs
}

export class DxfExporter {
    /**
     * Converts an array of abstract entities to a DXF string.
     */
    static exportEntities(entities: ExportEntity[], layerManager: LayerManager): string {
        const model: makerjs.IModel = { paths: {}, models: {} };

        let pathCounter = 0;

        // Group entities by layer for Maker.js to handle dxf layer mapping
        entities.forEach(entity => {
            const layerId = entity.layerId || '0';
            const layerDef = layerManager.getLayer(layerId);
            const layerName = layerDef ? layerDef.name : '0';

            // Ensure a sub-model exists for the layer
            if (!model.models![layerName]) {
                model.models![layerName] = { paths: {} };
                // Maker.js layer meta-data can be injected here via layerOptions during export
            }

            const layerModel = model.models![layerName];
            const pathId = `p${pathCounter++}`;

            if (entity.type === 'line' && entity.points && entity.points.length === 2) {
                layerModel.paths![pathId] = new makerjs.paths.Line(
                    [entity.points[0].x, entity.points[0].y],
                    [entity.points[1].x, entity.points[1].y]
                );
            } else if (entity.type === 'circle' && entity.center && entity.radius) {
                layerModel.paths![pathId] = new makerjs.paths.Circle(
                    [entity.center.x, entity.center.y],
                    entity.radius
                );
            } else if (entity.type === 'arc' && entity.center && entity.radius && entity.startAngle !== undefined && entity.endAngle !== undefined) {
                layerModel.paths![pathId] = new makerjs.paths.Arc(
                    [entity.center.x, entity.center.y],
                    entity.radius,
                    entity.startAngle,
                    entity.endAngle
                );
            }
        });

        // Create layer options for DXF export
        const layerOptions: { [layerId: string]: makerjs.exporter.IDXFLayerOptions } = {};
        layerManager.getAllLayers().forEach((layer: any) => {
            layerOptions[layer.name] = { color: this.hexToAutoCadColor(layer.color) };
        });

        const dxf = makerjs.exporter.toDXF(model, { layerOptions });
        return dxf;
    }

    /**
     * Highly simplified AutoCad index color mapping.
     */
    private static hexToAutoCadColor(hex: string): number {
        // Fallback or rough map - real impl would use a full ACI lookup table
        if (hex === '#FF0000') return 1; // Red
        if (hex === '#FFFF00') return 2; // Yellow
        if (hex === '#00FF00') return 3; // Green
        if (hex === '#00FFFF') return 4; // Cyan
        if (hex === '#0000FF') return 5; // Blue
        if (hex === '#FF00FF') return 6; // Magenta
        return 7; // White/Black standard
    }
}
