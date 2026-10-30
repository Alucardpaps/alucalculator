/**
 * AluCAD — Transform Ghost & Visual Guide Renderer
 * 
 * Renders distinct color-coded CAD transform previews:
 *  - Source entities: Electric Cyan (#3ad0e6)
 *  - Transform base point: Crimson Red (#e85d5d)
 *  - Guides & reference axes (angle, vector, mirror): Laser Amber (#e6b84a) / Laser Blue (#7aa2ff)
 *  - Transformed preview / ghost shape: Vibrant Spring Green (#3dd68c)
 */

import { canvasPalette } from './canvasTheme';
import { strokePrimitives } from './shapePaths';
import { geometryPrimitives } from '../kernel/primitives';
import { Point, CadEntity } from '../kernel/types';

export class GhostRenderer {
    /**
     * Draw transformed ghost entities in bright dashed green
     */
    static drawGhostEntities(
        ctx: CanvasRenderingContext2D,
        entities: CadEntity[],
        worldToScreen: (p: Point) => Point,
        zoom: number,
        color: string = '#3dd68c'
    ) {
        if (!entities || entities.length === 0) return;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 3]);

        for (const ent of entities) {
            // every entity type previews exactly as it will be drawn
            strokePrimitives(ctx, geometryPrimitives(ent.geometry), worldToScreen, zoom);
        }
        ctx.restore();
    }

    /**
     * Draw base point marker with crimson bullseye & crosshair
     */
    static drawBasePointMarker(
        ctx: CanvasRenderingContext2D,
        point: Point,
        worldToScreen: (p: Point) => Point,
        label: string = 'TEMEL NOKTA (BASE)',
        color: string = '#e85d5d'
    ) {
        const sp = worldToScreen(point);

        ctx.save();
        // Glow
        ctx.strokeStyle = 'rgba(232, 93, 93, 0.4)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 10, 0, Math.PI * 2);
        ctx.stroke();

        // Sharp outer ring
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 7, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(sp.x - 12, sp.y); ctx.lineTo(sp.x - 3, sp.y);
        ctx.moveTo(sp.x + 3, sp.y); ctx.lineTo(sp.x + 12, sp.y);
        ctx.moveTo(sp.x, sp.y - 12); ctx.lineTo(sp.x, sp.y - 3);
        ctx.moveTo(sp.x, sp.y + 3); ctx.lineTo(sp.x, sp.y + 12);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Coordinate Badge
        const text = `${label} [${point.x.toFixed(1)}, ${point.y.toFixed(1)}]`;
        ctx.font = 'bold 9px monospace';
        const tw = ctx.measureText(text).width;
        ctx.fillStyle = canvasPalette().labelBg;
        ctx.fillRect(sp.x + 14, sp.y - 10, tw + 10, 18);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(sp.x + 14, sp.y - 10, tw + 10, 18);
        ctx.fillStyle = color;
        ctx.textBaseline = 'middle';
        ctx.fillText(text, sp.x + 19, sp.y - 1);

        ctx.restore();
    }

    /**
     * Draw displacement vector with arrow and delta badge
     */
    static drawDisplacementVector(
        ctx: CanvasRenderingContext2D,
        start: Point,
        end: Point,
        worldToScreen: (p: Point) => Point,
        color: string = '#7aa2ff'
    ) {
        const p1 = worldToScreen(start);
        const p2 = worldToScreen(end);
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.hypot(dx, dy);

        ctx.save();
        // Dashed vector line
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrowhead at p2
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const arrowSize = 9;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p2.x - arrowSize * Math.cos(angle - Math.PI / 6), p2.y - arrowSize * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(p2.x - arrowSize * Math.cos(angle + Math.PI / 6), p2.y - arrowSize * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        // Measurement badge
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const badgeText = `ΔX: ${dx >= 0 ? '+' : ''}${dx.toFixed(1)}  ΔY: ${dy >= 0 ? '+' : ''}${dy.toFixed(1)}  |  L: ${dist.toFixed(1)} mm`;
        ctx.font = 'bold 9px monospace';
        const bw = ctx.measureText(badgeText).width;
        ctx.fillStyle = canvasPalette().labelBg;
        ctx.fillRect(midX - bw / 2 - 5, midY - 18, bw + 10, 18);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(midX - bw / 2 - 5, midY - 18, bw + 10, 18);
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, midX, midY - 9);

        ctx.restore();
    }

    /**
     * Draw rotation guide arc and angle readout
     */
    static drawRotationGuide(
        ctx: CanvasRenderingContext2D,
        center: Point,
        currentPoint: Point,
        angleRad: number,
        worldToScreen: (p: Point) => Point,
        color: string = '#e6b84a'
    ) {
        const c = worldToScreen(center);
        const p = worldToScreen(currentPoint);

        ctx.save();
        // Radial arm from center to cursor
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // Baseline (0 deg reference or initial click)
        const baseRadius = 40;
        ctx.strokeStyle = 'rgba(230, 184, 74, 0.4)';
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(c.x + baseRadius + 20, c.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Circular arc showing angle
        const curAngle = Math.atan2(p.y - c.y, p.x - c.x);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, baseRadius, 0, curAngle, curAngle < 0);
        ctx.stroke();

        // Angle badge
        const deg = (angleRad * 180 / Math.PI);
        const normDeg = ((deg % 360) + 360) % 360;
        const badge = `∠ ${normDeg.toFixed(1)}° (${deg >= 0 ? '+' : ''}${deg.toFixed(1)}°)`;
        const midAngle = curAngle / 2;
        const bx = c.x + (baseRadius + 25) * Math.cos(midAngle);
        const by = c.y + (baseRadius + 25) * Math.sin(midAngle);

        ctx.font = 'bold 10px monospace';
        const tw = ctx.measureText(badge).width;
        ctx.fillStyle = canvasPalette().labelBg;
        ctx.fillRect(bx - tw / 2 - 4, by - 9, tw + 8, 18);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx - tw / 2 - 4, by - 9, tw + 8, 18);
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badge, bx, by);

        ctx.restore();
    }

    /**
     * Draw mirror axis line with symmetry indicator
     */
    static drawMirrorAxis(
        ctx: CanvasRenderingContext2D,
        axisStart: Point,
        axisEnd: Point,
        worldToScreen: (p: Point) => Point,
        color: string = '#7aa2ff'
    ) {
        const p1 = worldToScreen(axisStart);
        const p2 = worldToScreen(axisEnd);
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        if (len < 1) return;

        ctx.save();
        // Extended infinite-looking axis
        const ext = 800;
        const ux = dx / len;
        const uy = dy / len;
        const startExt = { x: p1.x - ux * ext, y: p1.y - uy * ext };
        const endExt = { x: p2.x + ux * ext, y: p2.y + uy * ext };

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 4, 2, 4]); // AutoCAD center/axis line pattern
        ctx.beginPath();
        ctx.moveTo(startExt.x, startExt.y);
        ctx.lineTo(endExt.x, endExt.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Axis point handles
        ctx.fillStyle = '#e85d5d'; // 1st point Crimson
        ctx.beginPath(); ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = color;     // 2nd point Laser Blue
        ctx.beginPath(); ctx.arc(p2.x, p2.y, 4, 0, Math.PI * 2); ctx.fill();

        // Badge
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        const badge = '⑂ AYNA EKSENİ (MIRROR AXIS)';
        ctx.font = 'bold 9px monospace';
        const bw = ctx.measureText(badge).width;
        ctx.fillStyle = canvasPalette().labelBg;
        ctx.fillRect(mx - bw / 2 - 5, my - 22, bw + 10, 18);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(mx - bw / 2 - 5, my - 22, bw + 10, 18);
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badge, mx, my - 13);

        ctx.restore();
    }
}
