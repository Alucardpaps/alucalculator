/**
 * ⬡ AluCAD — Parametric Polygon Tool (AutoCAD-grade)
 * 
 * Supports 3 industry-standard polygon construction modes:
 *  1. INSCRIBED: Vertices touch reference circle of radius R.
 *  2. CIRCUMSCRIBED: Midpoints of flat sides touch reference circle (Across Flats / AF).
 *  3. EDGE: Built from two endpoints specifying base edge length and orientation.
 */

import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity } from '../../kernel/types';
import { distance, normalize, sub, add, perpendicular, scale } from '../../kernel/GeometryKernel';
import { useCadStore } from '../../store/cadStore';
import { PolygonMode } from '../../catalog/constructionMethods';

export class PolygonTool extends BaseCommand {
    public id: string;
    public name = 'POLYGON';
    public displayName: string;

    private centerOrFirstPoint: Point | null = null;
    private currentCursor: Point | null = null;

    // Parametric state
    private sides: number = 6;
    private radius: number = 20;
    private rotationRad: number = 0;
    private calculatedCenter: Point | null = null;

    constructor(public readonly mode: PolygonMode = 'INSCRIBED') {
        super();
        this.id = mode === 'INSCRIBED' ? 'POLYGON'
                : mode === 'CIRCUMSCRIBED' ? 'POLYGON_CIRCUMSCRIBED'
                : 'POLYGON_EDGE';
        this.displayName = mode === 'INSCRIBED' ? 'Polygon (Inscribed)'
                         : mode === 'CIRCUMSCRIBED' ? 'Polygon (Circumscribed / AF)'
                         : 'Polygon (Edge)';
    }

    start(): void {
        this.centerOrFirstPoint = null;
        this.currentCursor = null;
        this.calculatedCenter = null;

        if (this.mode === 'INSCRIBED') {
            this.setPrompt(`Specify center of polygon [Sides=${this.sides}] (Inscribed in circle):`);
        } else if (this.mode === 'CIRCUMSCRIBED') {
            this.setPrompt(`Specify center of polygon [Sides=${this.sides}] (Circumscribed about circle / AF):`);
        } else {
            this.setPrompt(`Specify first endpoint of polygon edge [Sides=${this.sides}]:`);
        }
    }

    /**
     * ToolPropertyPanel calls this when sides or rotation are edited.
     */
    setParams(params: { sides?: number; radius?: number; rotation?: number }): void {
        if (params.sides !== undefined && params.sides >= 3) {
            this.sides = Math.round(params.sides);
        }
        if (params.radius !== undefined && params.radius > 0) {
            this.radius = params.radius;
        }
        if (params.rotation !== undefined) {
            this.rotationRad = (params.rotation * Math.PI) / 180;
        }
        if (this.centerOrFirstPoint) {
            this.updatePreview();
        }
    }

    onMouseMove(point: Point): void {
        this.currentCursor = point;
        if (!this.centerOrFirstPoint) return;

        this.solveGeometry(point);
        this.updatePreview();
    }

    onPointInput(point: Point): void {
        if (!this.centerOrFirstPoint) {
            this.centerOrFirstPoint = point;
            if (this.mode === 'INSCRIBED') {
                this.setPrompt('Specify radius to vertex (or click):');
            } else if (this.mode === 'CIRCUMSCRIBED') {
                this.setPrompt('Specify radius to side midpoint (Across Flats):');
            } else {
                this.setPrompt('Specify second endpoint of polygon edge:');
            }
        } else {
            this.solveGeometry(point);
            this.executeCreation();
        }
    }

    onValueInput(value: string): void {
        const trimmed = value.trim();

        // Check if user entered side count, e.g. "8" or "sides=8"
        if (trimmed.toLowerCase().startsWith('sides=') || trimmed.toLowerCase().startsWith('s=')) {
            const parsedSides = parseInt(trimmed.replace(/^[a-z]+=/, ''), 10);
            if (!isNaN(parsedSides) && parsedSides >= 3) {
                this.sides = parsedSides;
                this.setPrompt(`Sides set to ${this.sides}. Proceed with input:`);
                if (this.centerOrFirstPoint) this.updatePreview();
                return;
            }
        }

        // Explicit Across-Flats / Diameter: "D50", "Ø50", "AF 50", "ÇAP 50"
        const diaMatch = trimmed.match(/^(?:D|DIA|DIAMETER|ÇAP|CAP|AF|Ø|⌀)[=\s:]*([0-9.]+)/i);
        if (diaMatch && this.centerOrFirstPoint) {
            const val = parseFloat(diaMatch[1]);
            if (!isNaN(val) && val > 0) {
                if (this.currentCursor) {
                    const dx = this.currentCursor.x - this.centerOrFirstPoint.x;
                    const dy = this.currentCursor.y - this.centerOrFirstPoint.y;
                    this.rotationRad = Math.atan2(dy, dx);
                    if (this.mode === 'CIRCUMSCRIBED') this.rotationRad -= Math.PI / this.sides;
                }
                if (this.mode === 'INSCRIBED') {
                    this.radius = val / 2;
                } else if (this.mode === 'CIRCUMSCRIBED') {
                    // Across Flats is diameter of inscribed circle: AF = 2 * rFlat -> rFlat = val / 2
                    this.radius = (val / 2) / Math.cos(Math.PI / this.sides);
                } else if (this.mode === 'EDGE') {
                    const p2 = { x: this.centerOrFirstPoint.x + val, y: this.centerOrFirstPoint.y };
                    this.solveGeometry(p2);
                }
                this.calculatedCenter = this.centerOrFirstPoint;
                this.executeCreation();
                return;
            }
        }

        // Explicit Radius: "R25", "R=25", "RAD 25", "YARIÇAP 25"
        const radMatch = trimmed.match(/^(?:R|RAD|RADIUS|YARIÇAP|YARICAP)[=\s:]*([0-9.]+)/i);
        if (radMatch && this.centerOrFirstPoint) {
            const val = parseFloat(radMatch[1]);
            if (!isNaN(val) && val > 0) {
                if (this.currentCursor) {
                    const dx = this.currentCursor.x - this.centerOrFirstPoint.x;
                    const dy = this.currentCursor.y - this.centerOrFirstPoint.y;
                    this.rotationRad = Math.atan2(dy, dx);
                    if (this.mode === 'CIRCUMSCRIBED') this.rotationRad -= Math.PI / this.sides;
                }
                if (this.mode === 'INSCRIBED') {
                    this.radius = val;
                } else if (this.mode === 'CIRCUMSCRIBED') {
                    this.radius = val / Math.cos(Math.PI / this.sides);
                } else if (this.mode === 'EDGE') {
                    const p2 = { x: this.centerOrFirstPoint.x + val, y: this.centerOrFirstPoint.y };
                    this.solveGeometry(p2);
                }
                this.calculatedCenter = this.centerOrFirstPoint;
                this.executeCreation();
                return;
            }
        }

        // Explicit Edge Length: "E50", "E=50", "KENAR 50"
        const edgeMatch = trimmed.match(/^(?:E|EDGE|KENAR)[=\s:]*([0-9.]+)/i);
        if (edgeMatch && this.centerOrFirstPoint) {
            const val = parseFloat(edgeMatch[1]);
            if (!isNaN(val) && val > 0) {
                if (this.mode === 'EDGE') {
                    const cur = this.currentCursor;
                    let dx = 1, dy = 0;
                    if (cur) {
                        const len = Math.hypot(cur.x - this.centerOrFirstPoint.x, cur.y - this.centerOrFirstPoint.y);
                        if (len > 0.001) {
                            dx = (cur.x - this.centerOrFirstPoint.x) / len;
                            dy = (cur.y - this.centerOrFirstPoint.y) / len;
                        }
                    }
                    const p2 = { x: this.centerOrFirstPoint.x + dx * val, y: this.centerOrFirstPoint.y + dy * val };
                    this.solveGeometry(p2);
                } else {
                    this.radius = val / (2 * Math.sin(Math.PI / this.sides));
                    this.calculatedCenter = this.centerOrFirstPoint;
                }
                this.executeCreation();
                return;
            }
        }

        const num = parseFloat(trimmed);
        if (!isNaN(num) && num > 0) {
            if (!this.centerOrFirstPoint) {
                // If entered before first click, treat as side count if integer >= 3
                if (Number.isInteger(num) && num >= 3 && num <= 1024) {
                    this.sides = num;
                    this.setPrompt(`Polygon sides set to ${this.sides}. Specify center/start point:`);
                    return;
                }
            } else {
                if (this.currentCursor) {
                    const dx = this.currentCursor.x - this.centerOrFirstPoint.x;
                    const dy = this.currentCursor.y - this.centerOrFirstPoint.y;
                    this.rotationRad = Math.atan2(dy, dx);
                    if (this.mode === 'CIRCUMSCRIBED') this.rotationRad -= Math.PI / this.sides;
                }

                // Numeric radius or edge length
                if (this.mode === 'INSCRIBED') {
                    this.radius = num;
                    this.calculatedCenter = this.centerOrFirstPoint;
                    this.executeCreation();
                } else if (this.mode === 'CIRCUMSCRIBED') {
                    // num is R_flat, R_vertex = R_flat / cos(pi/N)
                    this.radius = num / Math.cos(Math.PI / this.sides);
                    this.calculatedCenter = this.centerOrFirstPoint;
                    this.executeCreation();
                } else if (this.mode === 'EDGE') {
                    const cur = this.currentCursor;
                    let dx = 1, dy = 0;
                    if (cur) {
                        const len = Math.hypot(cur.x - this.centerOrFirstPoint.x, cur.y - this.centerOrFirstPoint.y);
                        if (len > 0.001) {
                            dx = (cur.x - this.centerOrFirstPoint.x) / len;
                            dy = (cur.y - this.centerOrFirstPoint.y) / len;
                        }
                    }
                    const p2 = { x: this.centerOrFirstPoint.x + dx * num, y: this.centerOrFirstPoint.y + dy * num };
                    this.solveGeometry(p2);
                    this.executeCreation();
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // GEOMETRIC SOLVER
    // ═══════════════════════════════════════════════════════════════

    public solveGeometry(point: Point): void {
        if (!this.centerOrFirstPoint) return;

        const N = Math.max(3, this.sides);

        if (this.mode === 'INSCRIBED') {
            const dx = point.x - this.centerOrFirstPoint.x;
            const dy = point.y - this.centerOrFirstPoint.y;
            this.radius = Math.hypot(dx, dy) || 1;
            this.rotationRad = Math.atan2(dy, dx);
            this.calculatedCenter = this.centerOrFirstPoint;
        } else if (this.mode === 'CIRCUMSCRIBED') {
            const dx = point.x - this.centerOrFirstPoint.x;
            const dy = point.y - this.centerOrFirstPoint.y;
            const rFlat = Math.hypot(dx, dy) || 1;
            // Circumradius: R_vertex = R_flat / cos(pi / N)
            this.radius = rFlat / Math.cos(Math.PI / N);
            // Midpoint of first edge is at angle alpha, so vertex 0 is at alpha - pi/N
            this.rotationRad = Math.atan2(dy, dx) - Math.PI / N;
            this.calculatedCenter = this.centerOrFirstPoint;
        } else if (this.mode === 'EDGE') {
            const p1 = this.centerOrFirstPoint;
            const p2 = point;
            const edgeLen = distance(p1, p2);
            if (edgeLen < 1e-4) return;

            // Base edge angle
            const theta = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            // Circumradius: R = S / (2 * sin(pi / N))
            this.radius = edgeLen / (2 * Math.sin(Math.PI / N));
            // Distance from edge midpoint to polygon center
            const dMid = edgeLen / (2 * Math.tan(Math.PI / N));

            // Edge midpoint
            const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
            // Left normal vector
            const nx = -Math.sin(theta);
            const ny = Math.cos(theta);

            // Center is at mid + n * dMid
            const center = { x: mid.x + nx * dMid, y: mid.y + ny * dMid };
            this.calculatedCenter = center;

            // Rotation angle: vector from center to p1
            this.rotationRad = Math.atan2(p1.y - center.y, p1.x - center.x);
        }
    }

    private updatePreview(): void {
        if (!this.calculatedCenter) return;

        const store = useCadStore.getState();
        const preview = this.createEntity(
            this.calculatedCenter,
            this.radius,
            this.rotationRad,
            this.sides,
            store.activeLayerId,
            'rgba(58, 208, 230, 0.4)'
        );
        store.setPreviewEntity(preview);
    }

    private executeCreation(): void {
        if (!this.calculatedCenter) return;

        const store = useCadStore.getState();
        store.pushHistory(`Polygon (${this.mode})`);

        const layer = store.layers.find((l) => l.id === store.activeLayerId);
        const entity = this.createEntity(
            this.calculatedCenter,
            this.radius,
            this.rotationRad,
            this.sides,
            store.activeLayerId,
            layer?.color || '#ffffff'
        );

        store.addEntity(entity);

        // Reset for next polygon
        this.centerOrFirstPoint = null;
        this.currentCursor = null;
        this.calculatedCenter = null;
        store.setPreviewEntity(null);

        this.start();
    }

    private createEntity(
        center: Point,
        radius: number,
        rotation: number,
        sides: number,
        layerId: string,
        color: string
    ): CadEntity {
        return {
            id: crypto.randomUUID(),
            layerId,
            color,
            isVisible: true,
            isSelected: false,
            geometry: {
                type: 'HEXAGON' as const,
                center,
                radius,
                rotation,
                sides: Math.max(3, Math.round(sides)),
            } as any,
        };
    }

    cancel(): void {
        this.centerOrFirstPoint = null;
        this.currentCursor = null;
        this.calculatedCenter = null;
        useCadStore.getState().setPreviewEntity(null);
        super.cancel();
    }

    // ═══════════════════════════════════════════════════════════════
    // INTERACTIVE HUD OVERLAY
    // ═══════════════════════════════════════════════════════════════

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        if (!this.centerOrFirstPoint || !this.currentCursor || !this.calculatedCenter) return;

        ctx.save();
        const sc = transform(this.calculatedCenter);
        const scur = transform(this.currentCursor);

        if (this.mode === 'INSCRIBED') {
            // Dashed reference circumcircle
            const rPx = this.radius * useCadStore.getState().viewport.zoom;
            ctx.strokeStyle = 'rgba(58, 208, 230, 0.35)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(sc.x, sc.y, Math.max(1, rPx), 0, Math.PI * 2);
            ctx.stroke();

            // Line from center to vertex
            ctx.strokeStyle = '#3ad0e6';
            ctx.beginPath();
            ctx.moveTo(sc.x, sc.y);
            ctx.lineTo(scur.x, scur.y);
            ctx.stroke();

            this.drawHudBadge(ctx, scur.x + 14, scur.y - 12, `INSCRIBED | N=${this.sides} | R: ${this.radius.toFixed(1)} mm`);
        } else if (this.mode === 'CIRCUMSCRIBED') {
            // Dashed reference flat circle
            const rFlat = this.radius * Math.cos(Math.PI / this.sides);
            const rFlatPx = rFlat * useCadStore.getState().viewport.zoom;
            ctx.strokeStyle = 'rgba(230, 184, 74, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(sc.x, sc.y, Math.max(1, rFlatPx), 0, Math.PI * 2);
            ctx.stroke();

            // Line from center to flat midpoint
            ctx.strokeStyle = '#e6b84a';
            ctx.beginPath();
            ctx.moveTo(sc.x, sc.y);
            ctx.lineTo(scur.x, scur.y);
            ctx.stroke();

            const af = rFlat * 2;
            this.drawHudBadge(ctx, scur.x + 14, scur.y - 12, `CIRCUMSCRIBED | N=${this.sides} | AF: ${af.toFixed(1)} mm`);
        } else if (this.mode === 'EDGE') {
            const sp1 = transform(this.centerOrFirstPoint);
            // Solid base edge indicator
            ctx.strokeStyle = '#3dd68c';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(sp1.x, sp1.y);
            ctx.lineTo(scur.x, scur.y);
            ctx.stroke();

            // Center marker (+)
            ctx.strokeStyle = '#3ad0e6';
            ctx.lineWidth = 1;
            const cs = 5;
            ctx.beginPath();
            ctx.moveTo(sc.x - cs, sc.y);
            ctx.lineTo(sc.x + cs, sc.y);
            ctx.moveTo(sc.x, sc.y - cs);
            ctx.lineTo(sc.x, sc.y + cs);
            ctx.stroke();

            const edgeLen = distance(this.centerOrFirstPoint, this.currentCursor);
            this.drawHudBadge(ctx, scur.x + 14, scur.y - 12, `EDGE | N=${this.sides} | Len: ${edgeLen.toFixed(1)} mm`);
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
}
