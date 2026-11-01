/**
 * ⬭ AluCAD — Parametric Ellipse Tool (AutoCAD-grade)
 * 
 * Supports 3 construction modes:
 *  1. CENTER: Center point, major axis endpoint, and distance to minor axis.
 *  2. AXIS: Endpoints of major axis (center = midpoint), and distance to other axis.
 *  3. ARC: Elliptical arc with major/minor dimensions followed by start and end sweep angles.
 */

import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity, createEllipseEntity } from '../../kernel/types';
import { distance, normalize, sub } from '../../kernel/GeometryKernel';
import { useCadStore } from '../../store/cadStore';
import { EllipseMode } from '../../catalog/constructionMethods';

export class EllipseTool extends BaseCommand {
    public id: string;
    public name = 'ELLIPSE';
    public displayName: string;

    private centerPoint: Point | null = null;
    private axisPoint1: Point | null = null;
    private axisPoint2: Point | null = null;
    private rx: number = 20;
    private ry: number = 10;
    private rotationRad: number = 0;

    // For ARC mode
    private startAngle: number | null = null;
    private endAngle: number | null = null;

    private currentCursor: Point | null = null;

    constructor(public readonly mode: EllipseMode = 'CENTER') {
        super();
        this.id = mode === 'CENTER' ? 'ELLIPSE'
                : mode === 'AXIS' ? 'ELLIPSE_AXIS'
                : 'ELLIPSE_ARC';
        this.displayName = mode === 'CENTER' ? 'Ellipse (Center)'
                         : mode === 'AXIS' ? 'Ellipse (Axis Endpoints)'
                         : 'Ellipse (Arc)';
    }

    start(): void {
        this.reset();
        if (this.mode === 'CENTER') {
            this.setPrompt('Specify center of ellipse:');
        } else if (this.mode === 'AXIS') {
            this.setPrompt('Specify first endpoint of ellipse axis:');
        } else {
            this.setPrompt('Specify center of elliptical arc:');
        }
    }

    private reset(): void {
        this.centerPoint = null;
        this.axisPoint1 = null;
        this.axisPoint2 = null;
        this.rx = 20;
        this.ry = 10;
        this.rotationRad = 0;
        this.startAngle = null;
        this.endAngle = null;
        this.currentCursor = null;
        useCadStore.getState().setPreviewEntity(null);
    }

    onMouseMove(point: Point): void {
        this.currentCursor = point;

        if (this.mode === 'CENTER' || this.mode === 'ARC') {
            if (this.centerPoint && !this.axisPoint1) {
                // Dragging first axis
                const dx = point.x - this.centerPoint.x;
                const dy = point.y - this.centerPoint.y;
                this.rx = Math.hypot(dx, dy) || 1;
                this.ry = this.rx * 0.5;
                this.rotationRad = Math.atan2(dy, dx);
                this.updatePreview();
            } else if (this.centerPoint && this.axisPoint1 && this.ry !== null && this.startAngle === null) {
                // Dragging second axis distance
                this.calculateMinorRadius(point);
                this.updatePreview();
            } else if (this.mode === 'ARC' && this.startAngle !== null && this.endAngle === null && this.centerPoint) {
                // Selecting end angle sweep
                const dx = point.x - this.centerPoint.x;
                const dy = point.y - this.centerPoint.y;
                const sweep = Math.atan2(dy, dx) - this.rotationRad;
                this.updatePreview(this.startAngle, sweep);
            }
        } else if (this.mode === 'AXIS') {
            if (this.axisPoint1 && !this.axisPoint2) {
                // Dragging second endpoint of axis 1
                const c = { x: (this.axisPoint1.x + point.x) / 2, y: (this.axisPoint1.y + point.y) / 2 };
                this.centerPoint = c;
                const d = distance(this.axisPoint1, point);
                this.rx = d / 2 || 1;
                this.ry = this.rx * 0.5;
                this.rotationRad = Math.atan2(point.y - this.axisPoint1.y, point.x - this.axisPoint1.x);
                this.updatePreview();
            } else if (this.axisPoint1 && this.axisPoint2 && this.centerPoint) {
                // Dragging distance to other axis
                this.calculateMinorRadius(point);
                this.updatePreview();
            }
        }
    }

    onPointInput(point: Point): void {
        if (this.mode === 'CENTER') {
            if (!this.centerPoint) {
                this.centerPoint = point;
                this.setPrompt('Specify endpoint of first axis:');
            } else if (!this.axisPoint1) {
                this.axisPoint1 = point;
                const dx = point.x - this.centerPoint.x;
                const dy = point.y - this.centerPoint.y;
                this.rx = Math.hypot(dx, dy) || 1;
                this.rotationRad = Math.atan2(dy, dx);
                this.setPrompt('Specify distance to second axis:');
            } else {
                this.calculateMinorRadius(point);
                this.executeCreation();
            }
        } else if (this.mode === 'AXIS') {
            if (!this.axisPoint1) {
                this.axisPoint1 = point;
                this.setPrompt('Specify second endpoint of first axis:');
            } else if (!this.axisPoint2) {
                this.axisPoint2 = point;
                this.centerPoint = {
                    x: (this.axisPoint1.x + point.x) / 2,
                    y: (this.axisPoint1.y + point.y) / 2
                };
                const d = distance(this.axisPoint1, point);
                this.rx = d / 2 || 1;
                this.rotationRad = Math.atan2(point.y - this.axisPoint1.y, point.x - this.axisPoint1.x);
                this.setPrompt('Specify distance to other axis:');
            } else {
                this.calculateMinorRadius(point);
                this.executeCreation();
            }
        } else if (this.mode === 'ARC') {
            if (!this.centerPoint) {
                this.centerPoint = point;
                this.setPrompt('Specify endpoint of major axis:');
            } else if (!this.axisPoint1) {
                this.axisPoint1 = point;
                const dx = point.x - this.centerPoint.x;
                const dy = point.y - this.centerPoint.y;
                this.rx = Math.hypot(dx, dy) || 1;
                this.rotationRad = Math.atan2(dy, dx);
                this.setPrompt('Specify distance to other axis:');
            } else if (this.startAngle === null) {
                this.calculateMinorRadius(point);
                this.setPrompt('Specify start angle (click or enter degrees):');
                this.startAngle = 0; // Default or await click
            } else if (this.endAngle === null) {
                const dx = point.x - this.centerPoint.x;
                const dy = point.y - this.centerPoint.y;
                this.endAngle = Math.atan2(dy, dx) - this.rotationRad;
                this.executeCreation();
            }
        }
    }

    onValueInput(value: string): void {
        const trimmed = value.trim();

        // 1. Dual axis input: "Rx,Ry", "WxH", "D100,50", "D100x50"
        const isDia = /^(?:D|DIA|DIAMETER|ÇAP|CAP|Ø|⌀)/i.test(trimmed);
        const clean = trimmed.replace(/^(?:D|DIA|DIAMETER|ÇAP|CAP|Ø|⌀)[=\s:]*/i, '');
        const parts = clean.replace(/[xX*\s]+/g, ',').split(',').map(s => parseFloat(s.trim()));

        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[0] > 0 && parts[1] > 0) {
            if (this.centerPoint && (this.mode === 'CENTER' || this.mode === 'ARC')) {
                this.rx = isDia ? parts[0] / 2 : parts[0];
                this.ry = isDia ? parts[1] / 2 : parts[1];
                if (this.mode === 'CENTER') {
                    this.executeCreation();
                } else {
                    this.startAngle = 0;
                    this.setPrompt('Specify sweep angle in degrees:');
                }
                return;
            }
        }

        // 2. Single scalar value (radius or diameter)
        const diaSingle = trimmed.match(/^(?:D|DIA|DIAMETER|ÇAP|CAP|Ø|⌀)[=\s:]*([0-9.]+)/i);
        const radSingle = trimmed.match(/^(?:R|RAD|RADIUS|YARIÇAP|YARICAP)[=\s:]*([0-9.]+)/i);
        let num = NaN;
        if (diaSingle) {
            num = parseFloat(diaSingle[1]) / 2;
        } else if (radSingle) {
            num = parseFloat(radSingle[1]);
        } else {
            num = parseFloat(trimmed);
        }

        if (isNaN(num) || num <= 0) return;

        if (this.mode === 'CENTER' || this.mode === 'ARC') {
            if (this.centerPoint && !this.axisPoint1) {
                // Value is major radius
                this.rx = num;
                this.axisPoint1 = {
                    x: this.centerPoint.x + num * Math.cos(this.rotationRad),
                    y: this.centerPoint.y + num * Math.sin(this.rotationRad),
                };
                this.setPrompt('Specify distance to second axis:');
            } else if (this.centerPoint && this.axisPoint1 && this.startAngle === null) {
                // Value is minor radius
                this.ry = num;
                if (this.mode === 'CENTER') {
                    this.executeCreation();
                } else {
                    this.startAngle = 0;
                    this.setPrompt('Specify sweep angle in degrees:');
                }
            } else if (this.mode === 'ARC' && this.startAngle !== null) {
                // Value is sweep angle in degrees
                this.endAngle = (num * Math.PI) / 180;
                this.executeCreation();
            }
        } else if (this.mode === 'AXIS') {
            if (this.axisPoint1 && this.axisPoint2 && this.centerPoint) {
                this.ry = num;
                this.executeCreation();
            }
        }
    }

    private calculateMinorRadius(cursor: Point): void {
        if (!this.centerPoint) return;
        // Project vector (cursor - center) onto perpendicular axis
        const dx = cursor.x - this.centerPoint.x;
        const dy = cursor.y - this.centerPoint.y;
        const perpAngle = this.rotationRad + Math.PI / 2;
        const perpX = Math.cos(perpAngle);
        const perpY = Math.sin(perpAngle);
        const proj = Math.abs(dx * perpX + dy * perpY);
        this.ry = Math.max(0.5, proj);
    }

    private updatePreview(sAngle?: number, eAngle?: number): void {
        if (!this.centerPoint) return;

        const store = useCadStore.getState();
        const preview = createEllipseEntity(
            this.centerPoint,
            Math.max(1, this.rx),
            Math.max(1, this.ry),
            store.activeLayerId,
            'rgba(58, 208, 230, 0.4)',
            this.rotationRad,
            undefined,
            sAngle,
            eAngle
        );
        store.setPreviewEntity(preview);
    }

    private executeCreation(): void {
        if (!this.centerPoint) return;

        const store = useCadStore.getState();
        store.pushHistory(`Ellipse (${this.mode})`);

        const layer = store.layers.find((l) => l.id === store.activeLayerId);
        const entity = createEllipseEntity(
            this.centerPoint,
            Math.max(1, this.rx),
            Math.max(1, this.ry),
            store.activeLayerId,
            layer?.color || '#ffffff',
            this.rotationRad,
            undefined,
            this.startAngle ?? undefined,
            this.endAngle ?? undefined
        );

        store.addEntity(entity);
        this.reset();
        this.start();
    }

    cancel(): void {
        this.reset();
        super.cancel();
    }

    // ═══════════════════════════════════════════════════════════════
    // INTERACTIVE HUD OVERLAY
    // ═══════════════════════════════════════════════════════════════

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        if (!this.centerPoint || !this.currentCursor) return;

        ctx.save();
        const sc = transform(this.centerPoint);
        const scur = transform(this.currentCursor);

        // Center crosshair (+)
        ctx.strokeStyle = '#e6b84a';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([]);
        const cs = 5;
        ctx.beginPath();
        ctx.moveTo(sc.x - cs, sc.y);
        ctx.lineTo(sc.x + cs, sc.y);
        ctx.moveTo(sc.x, sc.y - cs);
        ctx.lineTo(sc.x, sc.y + cs);
        ctx.stroke();

        // Major axis guideline
        if (this.axisPoint1) {
            const spMaj = transform(this.axisPoint1);
            ctx.strokeStyle = 'rgba(58, 208, 230, 0.6)';
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(sc.x, sc.y);
            ctx.lineTo(spMaj.x, spMaj.y);
            ctx.stroke();
        }

        const rotDeg = ((this.rotationRad * 180) / Math.PI) % 360;
        const normalizedRot = rotDeg < 0 ? rotDeg + 360 : rotDeg;

        this.drawHudBadge(
            ctx,
            scur.x + 14,
            scur.y - 12,
            `Rx: ${this.rx.toFixed(1)} | Ry: ${this.ry.toFixed(1)} mm | ∠${normalizedRot.toFixed(0)}°`
        );

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
}
