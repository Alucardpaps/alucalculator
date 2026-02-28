/**
 * AluCAD - Dimension System
 * 
 * Manages the creation, rendering, and updating of dimension entities.
 * Supports: Linear, Aligned, Radial (future), Angular (future).
 */

import { CadEntity, Point, DimensionGeometry } from './types';
import { distance, vector, normalize, scale, add, perpendicular } from './GeometryKernel';
import { useCadStore } from '../store/cadStore';
import { v4 as uuidv4 } from 'uuid';
import { EngineeringValue } from '../../lib/kernel/types';

export class DimensionSystem {

    /**
     * Create a linear dimension entity
     */
    public createLinearDimension(
        start: Point,
        end: Point,
        textPoint: Point,
        layerId: string = 'layer-0'
    ): CadEntity {
        const id = uuidv4();

        // Calculate geometry based on text position
        // For linear, we project start/end to the axis defined by textPoint
        // Simple version: Aligned dimension for now

        const dim: DimensionGeometry = {
            type: 'DIMENSION',
            start,
            end,
            textPoint,
            value: distance(start, end),
            text: distance(start, end).toFixed(2),
            offset: 20 // Default offset
        };

        const entity: CadEntity = {
            id,
            layerId,
            color: '#ffffff', // scalable default
            isVisible: true,
            isSelected: false,
            geometry: dim
        };

        return entity;
    }

    /**
     * Render a dimension entity to the canvas context
     */
    public renderDimension(
        ctx: CanvasRenderingContext2D,
        entity: CadEntity,
        transform: (p: Point) => Point,
        scaleFactor: number // zoom level for text scaling
    ) {
        if (entity.geometry.type !== 'DIMENSION') return;

        const dim = entity.geometry as DimensionGeometry;
        const p1 = transform(dim.start);
        const p2 = transform(dim.end);
        const pt = transform(dim.textPoint);

        const dist = distance(dim.start, dim.end);
        const textStr = dist.toFixed(2);

        ctx.save();
        ctx.strokeStyle = entity.isSelected ? '#00e5ff' : (entity.color || '#white');
        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = 1;
        ctx.font = `12px sans-serif`;

        // 1. Draw Extension Lines
        // Vector from start/end to text line
        // Simple implementation: Draw lines from start->offset and end->offset

        // Calculate offset vector
        const v = vector(dim.start, dim.end);
        const n = normalize(perpendicular(v));

        // Determine side based on textPoint
        const vText = vector(dim.start, dim.textPoint);
        const side = (n.x * vText.x + n.y * vText.y) > 0 ? 1 : -1;

        const offsetVec = scale(n, 30 * side); // Fixed pixel offset for now, should be world units

        const p1Ext = { x: p1.x + offsetVec.x, y: p1.y + offsetVec.y };
        const p2Ext = { x: p2.x + offsetVec.x, y: p2.y + offsetVec.y };

        // Extension lines
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p1Ext.x, p1Ext.y);
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p2Ext.x, p2Ext.y);
        ctx.stroke();

        // Dimension Line
        ctx.beginPath();
        ctx.moveTo(p1Ext.x, p1Ext.y);
        ctx.lineTo(p2Ext.x, p2Ext.y);
        ctx.stroke();

        // Arrows
        this.drawArrow(ctx, p1Ext, p2Ext);
        this.drawArrow(ctx, p2Ext, p1Ext);

        // Text
        const textCenter = {
            x: (p1Ext.x + p2Ext.x) / 2,
            y: (p1Ext.y + p2Ext.y) / 2 - 5 * side
        };

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(textStr, textCenter.x, textCenter.y);

        ctx.restore();
    }

    private drawArrow(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
        const headLen = 10;
        const angle = Math.atan2(to.y - from.y, to.x - from.x);

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(from.x + headLen * Math.cos(angle + Math.PI / 6), from.y + headLen * Math.sin(angle + Math.PI / 6));
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(from.x + headLen * Math.cos(angle - Math.PI / 6), from.y + headLen * Math.sin(angle - Math.PI / 6));
        ctx.stroke();
    }

    /**
     * Update the geometry of a constrained entity based on a new dimension value
     */
    public updateGeometryByDimension(entity: CadEntity, newValue: EngineeringValue | number): { type: string, target: string, dx: number, dy: number } | null {
        if (entity.geometry.type !== 'DIMENSION') return null;

        const dim = entity.geometry as DimensionGeometry;

        // Check if dimension is bound to an object (this would require a link in the entity)
        // For now, we assume the dimension controls the entity it measures if passed explicitly

        const currentDist = distance(dim.start, dim.end);
        const targetVal = typeof newValue === 'number' ? newValue : newValue.value;
        const delta = targetVal - currentDist;

        if (Math.abs(delta) < 0.0001) return null; // No change

        const dx = dim.end.x - dim.start.x;
        const dy = dim.end.y - dim.start.y;
        const length = Math.hypot(dx, dy);

        if (length === 0) return null;

        const ux = dx / length;
        const uy = dy / length;

        // Return a transformation instruction
        // The system handling this return value should apply the transform to the underlying geometry
        return {
            type: 'TRANSFORM',
            target: 'LINKED_ENTITY_ID', // Placeholder, creates a pattern for the consumer
            dx: ux * delta,
            dy: uy * delta
        };
    }
}

export const dimensionSystem = new DimensionSystem();
