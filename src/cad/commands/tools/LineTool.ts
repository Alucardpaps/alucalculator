/**
 * 📏 AluCAD — Multi-Method Line Tool (AutoCAD-grade)
 * 
 * Supports:
 *  1. 2P: Standard chained line segment.
 *  2. XLINE: Infinite construction/guide line passing through root point.
 *  3. RAY: Semi-infinite ray starting from root point and extending infinitely.
 */

import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity, createLineEntity } from '../../kernel/types';
import { distance, normalize, sub, add, scale } from '../../kernel/GeometryKernel';
import { useCadStore } from '../../store/cadStore';
import { LineMode } from '../../catalog/constructionMethods';

export class LineTool extends BaseCommand {
    public id: string;
    public name: string;
    public displayName: string;

    private rootPoint: Point | null = null;
    private currentPoint: Point | null = null;

    constructor(public readonly mode: LineMode = '2P') {
        super();
        this.id = mode === '2P' ? 'LINE'
                : mode === 'XLINE' ? 'XLINE'
                : 'RAY';
        this.name = 'LINE';
        this.displayName = mode === '2P' ? 'Line'
                         : mode === 'XLINE' ? 'Construction Line (XLine)'
                         : 'Ray (Semi-Infinite)';
    }

    start(): void {
        this.rootPoint = null;
        this.currentPoint = null;
        if (this.mode === '2P') {
            this.setPrompt('Specify first point:');
        } else if (this.mode === 'XLINE') {
            this.setPrompt('Specify root point for construction line (XLINE):');
        } else {
            this.setPrompt('Specify start point for ray:');
        }
    }

    onMouseMove(point: Point): void {
        this.currentPoint = point;

        if (this.rootPoint) {
            let endPt = point;

            // Ortho or Polar Tracking constraint
            const state = useCadStore.getState();
            if (state.orthoEnabled || state.polarTrackingEnabled) {
                endPt = this.constrainToOrthoOrPolar(this.rootPoint, point);
            }

            const { pStart, pEnd } = this.computeEndpoints(this.rootPoint, endPt);

            const previewLine = createLineEntity(
                pStart,
                pEnd,
                state.activeLayerId,
                'rgba(58, 208, 230, 0.6)'
            );
            state.setPreviewEntity(previewLine);
        }
    }

    onPointInput(point: Point): void {
        let finalPoint = point;

        // Ortho or Polar Tracking constraint
        const state = useCadStore.getState();
        if (this.rootPoint && (state.orthoEnabled || state.polarTrackingEnabled)) {
            finalPoint = this.constrainToOrthoOrPolar(this.rootPoint, point);
        }

        if (!this.rootPoint) {
            this.rootPoint = finalPoint;
            if (this.mode === '2P') {
                this.setPrompt('Specify next point (or distance):');
            } else if (this.mode === 'XLINE') {
                this.setPrompt('Specify through point for infinite line:');
            } else {
                this.setPrompt('Specify through point for ray:');
            }
        } else {
            const { pStart, pEnd } = this.computeEndpoints(this.rootPoint, finalPoint);
            const layerId = state.activeLayerId;
            const line = createLineEntity(pStart, pEnd, layerId, '#ffffff');

            state.pushHistory(this.displayName);
            state.addEntity(line);

            if (this.mode === '2P') {
                // Continuous chaining: next segment starts from this endpoint
                this.rootPoint = finalPoint;
                this.setPrompt('Specify next point (or distance):');
            } else {
                // XLINE / RAY keep the same root point for fanning multiple rays
                this.setPrompt(`Created ${this.displayName}. Specify next through point (or Esc):`);
            }
            state.setPreviewEntity(null);
        }
    }

    onValueInput(value: string): void {
        const trimmed = value.trim();

        // Polar relative: [@]distance<angle (degrees)
        if (trimmed.includes('<') && this.rootPoint) {
            const clean = trimmed.startsWith('@') ? trimmed.substring(1) : trimmed;
            const parts = clean.split('<');
            const dist = parseFloat(parts[0].trim());
            const angleDeg = parseFloat(parts[1].trim());
            if (!isNaN(dist) && !isNaN(angleDeg)) {
                const angleRad = (angleDeg * Math.PI) / 180;
                this.onPointInput({
                    x: this.rootPoint.x + dist * Math.cos(angleRad),
                    y: this.rootPoint.y - dist * Math.sin(angleRad),
                });
                return;
            }
        }

        // Relative coordinates: @dx,dy
        if (trimmed.startsWith('@') && this.rootPoint) {
            const parts = trimmed.substring(1).split(',');
            if (parts.length === 2) {
                const dx = parseFloat(parts[0].trim());
                const dy = parseFloat(parts[1].trim());
                if (!isNaN(dx) && !isNaN(dy)) {
                    this.onPointInput({
                        x: this.rootPoint.x + dx,
                        y: this.rootPoint.y + dy,
                    });
                    return;
                }
            }
        }

        // Absolute coordinates: x,y
        const parts = trimmed.split(',');
        if (parts.length === 2) {
            const x = parseFloat(parts[0].trim());
            const y = parseFloat(parts[1].trim());
            if (!isNaN(x) && !isNaN(y)) {
                this.onPointInput({ x, y });
                return;
            }
        }

        // Distance entry: pure number or length prefix (L=100, LEN 100, UZUNLUK 100)
        const lenMatch = trimmed.match(/^(?:L|LEN|UZUNLUK|BOY|DIST)[=\s:]*([0-9.]+)/i);
        const distVal = lenMatch ? parseFloat(lenMatch[1]) : parseFloat(trimmed);

        if (this.rootPoint && !isNaN(distVal) && distVal > 0) {
            const cur = this.currentPoint || useCadStore.getState().cursorWorld;
            let dx = 1;
            let dy = 0;
            if (cur) {
                const diffX = cur.x - this.rootPoint.x;
                const diffY = cur.y - this.rootPoint.y;
                const len = Math.hypot(diffX, diffY);
                if (len > 0.001) {
                    dx = diffX / len;
                    dy = diffY / len;
                }
            }
            const state = useCadStore.getState();
            if (state.orthoEnabled) {
                if (Math.abs(dx) >= Math.abs(dy)) {
                    dx = dx >= 0 ? 1 : -1;
                    dy = 0;
                } else {
                    dx = 0;
                    dy = dy >= 0 ? 1 : -1;
                }
            }
            this.onPointInput({
                x: this.rootPoint.x + dx * distVal,
                y: this.rootPoint.y + dy * distVal,
            });
            return;
        }

        useCadStore.getState().setCommandPrompt(`Invalid: ${value}. Use distance, x,y or dist<angle`);
    }

    public computeEndpoints(p1: Point, p2: Point): { pStart: Point; pEnd: Point } {
        if (this.mode === '2P') {
            return { pStart: p1, pEnd: p2 };
        }

        const d = distance(p1, p2);
        if (d < 1e-4) return { pStart: p1, pEnd: p2 };

        const u = normalize(sub(p2, p1));
        const INFINITY_SPAN = 200000; // 200m in mm CAD workspace

        if (this.mode === 'XLINE') {
            // Extends both backwards and forwards
            const pStart = sub(p1, scale(u, INFINITY_SPAN));
            const pEnd = add(p1, scale(u, INFINITY_SPAN));
            return { pStart, pEnd };
        } else {
            // RAY starts at p1 and extends infinitely forward
            const pStart = p1;
            const pEnd = add(p1, scale(u, INFINITY_SPAN));
            return { pStart, pEnd };
        }
    }

    cancel(): void {
        this.rootPoint = null;
        this.currentPoint = null;
        useCadStore.getState().setPreviewEntity(null);
        super.cancel();
    }

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        if (!this.rootPoint || !this.currentPoint) return;

        const sp1 = transform(this.rootPoint);
        const sp2 = transform(this.currentPoint);

        const d = distance(this.rootPoint, this.currentPoint);
        const angleRad = Math.atan2(this.currentPoint.y - this.rootPoint.y, this.currentPoint.x - this.rootPoint.x);
        let angleDeg = (-angleRad * 180) / Math.PI;
        if (angleDeg < 0) angleDeg += 360;

        ctx.save();
        if (this.mode === '2P') {
            this.drawHudBadge(ctx, sp2.x + 14, sp2.y - 12, `L: ${d.toFixed(1)} mm | ∠${angleDeg.toFixed(1)}°`);
        } else if (this.mode === 'XLINE') {
            this.drawHudBadge(ctx, sp2.x + 14, sp2.y - 12, `XLINE | ∠${angleDeg.toFixed(1)}° (Infinite)`);
        } else {
            this.drawHudBadge(ctx, sp2.x + 14, sp2.y - 12, `RAY | ∠${angleDeg.toFixed(1)}° (Semi-Infinite)`);
        }
        ctx.restore();
    }

    private drawHudBadge(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
        ctx.save();
        ctx.font = '500 10px "JetBrains Mono", monospace';
        const textWidth = ctx.measureText(text).width;
        const padX = 6;
        const boxH = 16;
        const boxW = textWidth + padX * 2;

        ctx.fillStyle = 'rgba(7, 9, 14, 0.88)';
        ctx.strokeStyle = '#3ad0e6';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.rect(x, y - boxH / 2, boxW, boxH);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#3ad0e6';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + padX, y);
        ctx.restore();
    }

    private constrainToOrthoOrPolar(from: Point, to: Point): Point {
        const state = useCadStore.getState();
        if (state.orthoEnabled) {
            const dx = Math.abs(to.x - from.x);
            const dy = Math.abs(to.y - from.y);
            return dx > dy ? { x: to.x, y: from.y } : { x: from.x, y: to.y };
        }
        if (state.polarTrackingEnabled) {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 1e-4) return to;

            const angleRad = Math.atan2(dy, dx);
            let angleDeg = (angleRad * 180) / Math.PI;
            if (angleDeg < 0) angleDeg += 360;

            const increment = state.polarAngleIncrement || 45;
            const snapAngleDeg = Math.round(angleDeg / increment) * increment;
            const snapAngleRad = (snapAngleDeg * Math.PI) / 180;

            const diff = Math.abs(angleDeg - snapAngleDeg);
            if (diff <= 6 || Math.abs(diff - 360) <= 6) {
                return {
                    x: from.x + dist * Math.cos(snapAngleRad),
                    y: from.y + dist * Math.sin(snapAngleRad),
                };
            }
        }
        return to;
    }
}
