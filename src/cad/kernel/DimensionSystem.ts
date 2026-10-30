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
            text: `${distance(start, end).toFixed(2)} mm`,
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
    /**
     * Convert and format dimension text dynamically for inch or mm units
     */
    public static formatDimensionText(
        textOrDist: string | number | undefined,
        distMm: number,
        units: 'mm' | 'in' = 'mm'
    ): string {
        if (units === 'in') {
            if (typeof textOrDist === 'string') {
                const match = textOrDist.match(/^([^\d.-]*)([-+]?\d*\.?\d+)(\s*(?:mm|in|")?)?$/);
                if (match) {
                    const prefix = match[1] || '';
                    const valNum = parseFloat(match[2]);
                    if (!Number.isNaN(valNum)) {
                        const isAlreadyInch = match[3] && (match[3].includes('in') || match[3].includes('"'));
                        const valIn = isAlreadyInch ? valNum : valNum / 25.4;
                        return `${prefix}${valIn.toFixed(valIn < 1 ? 3 : 2)}"`;
                    }
                }
            }
            const inVal = distMm / 25.4;
            return `${inVal.toFixed(inVal < 1 ? 3 : 2)}"`;
        }
        if (typeof textOrDist === 'string' && textOrDist.length > 0) {
            return textOrDist;
        }
        return `${distMm.toFixed(2)} mm`;
    }

    public renderDimension(
        ctx: CanvasRenderingContext2D,
        entity: CadEntity,
        transform: (p: Point) => Point,
        zoom: number
    ): void {
        const dim = entity.geometry as DimensionGeometry;
        const p1 = transform(dim.start);
        const p2 = transform(dim.end);
        const pt = transform(dim.textPoint);

        const dist = distance(dim.start, dim.end);
        const isInch = useCadStore.getState().units === 'in';
        const textStr = DimensionSystem.formatDimensionText(dim.text, dist, isInch ? 'in' : 'mm');

        ctx.save();
        ctx.strokeStyle = entity.isSelected ? '#00e5ff' : (entity.color || '#white');
        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = 1;
        ctx.font = `12px sans-serif`;

        // 1. Draw Extension Lines
        // Vector from start/end to text line
        // Simple implementation: Draw lines from start->offset and end->offset

        // Calculate screen-space offset vector
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const screenDist = Math.sqrt(dx * dx + dy * dy);
        if (screenDist < 1) {
            ctx.restore();
            return;
        }

        const nx = -dy / screenDist;
        const ny = dx / screenDist;
        let offset = 30;
        if (dim.textPoint) {
            const proj = (pt.x - p1.x) * nx + (pt.y - p1.y) * ny;
            if (Math.abs(proj) > 5) {
                offset = proj;
            }
        }

        const p1Ext = { x: p1.x + nx * offset, y: p1.y + ny * offset };
        const p2Ext = { x: p2.x + nx * offset, y: p2.y + ny * offset };

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
            y: (p1Ext.y + p2Ext.y) / 2
        };

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Check for tolerance values
        const hasTolerance = dim.tolUpper !== undefined || dim.tolLower !== undefined;

        if (hasTolerance) {
            const tolU = dim.tolUpper ?? 0;
            const tolL = dim.tolLower ?? 0;

            ctx.font = '12px monospace';
            const nominalText = textStr;
            const nominalWidth = ctx.measureText(nominalText).width;
            const tolWidth = 36;
            const totalWidth = nominalWidth + tolWidth + 8;

            ctx.fillStyle = '#080c12';
            ctx.fillRect(textCenter.x - totalWidth / 2 - 2, textCenter.y - 10, totalWidth + 4, 20);

            // Draw nominal value slightly left
            ctx.fillStyle = ctx.strokeStyle;
            const nomX = textCenter.x - tolWidth / 2 - 2;
            ctx.fillText(nominalText, nomX, textCenter.y);

            // Draw tolerance stack (superscript/subscript) to the right
            ctx.font = '8px monospace';
            ctx.textAlign = 'left';
            const tolX = nomX + nominalWidth / 2 + 3;

            const upperText = tolU >= 0 ? `+${tolU.toFixed(3)}` : tolU.toFixed(3);
            ctx.fillText(upperText, tolX, textCenter.y - 5);

            const lowerText = tolL >= 0 ? `+${tolL.toFixed(3)}` : tolL.toFixed(3);
            ctx.fillText(lowerText, tolX, textCenter.y + 5);
        } else {
            ctx.font = '12px monospace';
            const tw = ctx.measureText(textStr).width;
            ctx.fillStyle = '#080c12';
            ctx.fillRect(textCenter.x - tw / 2 - 4, textCenter.y - 8, tw + 8, 16);

            ctx.fillStyle = ctx.strokeStyle;
            ctx.fillText(textStr, textCenter.x, textCenter.y);
        }

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
