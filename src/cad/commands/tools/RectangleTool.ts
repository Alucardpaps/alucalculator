/**
 * 🔲 AluCAD — AutoCAD-Grade Multi-Method Rectangle Tool
 * 
 * Supports standard ISO/AutoCAD rectangle construction methods:
 * 1. 2-Point Corner-to-Corner (REC / 2P)
 * 2. Center, Corner (REC_CENTER)
 * 3. 3-Point Rotated (REC_3P)
 * 4. Filleted Corners (REC_FILLET)
 * 5. Chamfered Corners (REC_CHAMFER)
 * 
 * Features live HUD dimension telemetry (W & H), center crosshair (+),
 * and rotated polyline construction.
 */

import { BaseCommand } from '../BaseCommand';
import {
    Point,
    CadEntity,
    createRectangleEntity,
    createPolylineEntity,
    createLineEntity
} from '../../kernel/types';
import { distance, sub, add, scale, normalize, perpendicular } from '../../kernel/GeometryKernel';
import { useCadStore } from '../../store/cadStore';
import { useI18nStore } from '../../../store/i18nStore';
import { t12 } from '../../../locales/t12';
import { RectangleMode } from '../../catalog/constructionMethods';

export class RectangleTool extends BaseCommand {
    public id: string;
    public name = 'RECTANGLE';
    public displayName: string;
    public mode: RectangleMode;

    private points: Point[] = [];
    private currentCursor: Point | null = null;
    private filletRadius: number = 5;
    private chamferDist: number = 5;

    constructor(mode: RectangleMode = '2P') {
        super();
        this.mode = mode;
        this.id = mode === '2P' ? 'RECTANGLE' : `RECTANGLE_${mode}`;
        this.displayName = `Rectangle (${mode})`;
    }

    private getLang(): string {
        try {
            return useI18nStore.getState().language || 'en';
        } catch {
            return 'en';
        }
    }

    start(): void {
        this.points = [];
        this.currentCursor = null;
        this.updatePromptForStep();
    }

    private updatePromptForStep(): void {
        const lang = this.getLang();

        switch (this.mode) {
            case '2P':
                if (this.points.length === 0) {
                    this.setPrompt(t12(lang, 'Specify first corner point of rectangle:', 'Dikdörtgenin ilk köşe noktasını belirleyin:'));
                } else {
                    this.setPrompt(t12(lang, 'Specify other diagonal corner point:', 'Karşıt çapraz köşe noktasını belirleyin:'));
                }
                break;

            case 'CENTER':
                if (this.points.length === 0) {
                    this.setPrompt(t12(lang, 'Specify center point of rectangle:', 'Dikdörtgenin merkez noktasını belirleyin:'));
                } else {
                    this.setPrompt(t12(lang, 'Specify corner point:', 'Köşe noktasını belirleyin:'));
                }
                break;

            case '3P':
                if (this.points.length === 0) {
                    this.setPrompt(t12(lang, 'Specify first baseline point (3P Rotated):', 'Taban doğrusunun ilk noktasını belirleyin (3 Nokta):'));
                } else if (this.points.length === 1) {
                    this.setPrompt(t12(lang, 'Specify second baseline endpoint:', 'Taban doğrusunun bitiş noktasını belirleyin:'));
                } else {
                    this.setPrompt(t12(lang, 'Specify height / opposite side offset:', 'Yükseklik / karşı kenar mesafesini belirleyin:'));
                }
                break;

            case 'FILLET':
                if (this.points.length === 0) {
                    this.setPrompt(t12(lang, 'Specify first corner point (Filleted Rect):', 'İlk köşe noktasını belirleyin (Radyuslu Dikdörtgen):'));
                } else {
                    this.setPrompt(t12(lang, `Specify other corner point [Fillet R=${this.filletRadius}]:`, `Karşıt köşeyi belirleyin [Radyus R=${this.filletRadius}]:`));
                }
                break;

            case 'CHAMFER':
                if (this.points.length === 0) {
                    this.setPrompt(t12(lang, 'Specify first corner point (Chamfered Rect):', 'İlk köşe noktasını belirleyin (Pahlı Dikdörtgen):'));
                } else {
                    this.setPrompt(t12(lang, `Specify other corner point [Chamfer C=${this.chamferDist}]:`, `Karşıt köşeyi belirleyin [Pah C=${this.chamferDist}]:`));
                }
                break;
        }
    }

    onMouseMove(point: Point): void {
        this.currentCursor = point;
        const layerId = useCadStore.getState().activeLayerId;

        if (this.mode === '2P' && this.points.length === 1) {
            const p1 = this.points[0];
            const width = Math.abs(point.x - p1.x);
            const height = Math.abs(point.y - p1.y);
            const center = { x: (p1.x + point.x) / 2, y: (p1.y + point.y) / 2 };

            if (width > 0.1 && height > 0.1) {
                const preview = createRectangleEntity(center, width, height, layerId, '#3ad0e6');
                useCadStore.getState().setPreviewEntity(preview);
            }
        } else if (this.mode === 'CENTER' && this.points.length === 1) {
            const c = this.points[0];
            const width = Math.abs(point.x - c.x) * 2;
            const height = Math.abs(point.y - c.y) * 2;

            if (width > 0.1 && height > 0.1) {
                const preview = createRectangleEntity(c, width, height, layerId, '#3ad0e6');
                useCadStore.getState().setPreviewEntity(preview);
            }
        } else if (this.mode === '3P') {
            if (this.points.length === 1) {
                // Baseline guide line
                const preview = createLineEntity(this.points[0], point, layerId, '#3ad0e6');
                useCadStore.getState().setPreviewEntity(preview);
            } else if (this.points.length === 2) {
                const poly = this.compute3PRotatedRect(this.points[0], this.points[1], point);
                if (poly) {
                    const preview = createPolylineEntity(poly, true, layerId, '#3ad0e6');
                    useCadStore.getState().setPreviewEntity(preview);
                }
            }
        } else if ((this.mode === 'FILLET' || this.mode === 'CHAMFER') && this.points.length === 1) {
            const p1 = this.points[0];
            const pts = this.mode === 'FILLET'
                ? this.computeFilletedRectCorners(p1, point, this.filletRadius)
                : this.computeChamferedRectCorners(p1, point, this.chamferDist);

            if (pts && pts.length >= 4) {
                const preview = createPolylineEntity(pts, true, layerId, '#3ad0e6');
                useCadStore.getState().setPreviewEntity(preview);
            }
        }
    }

    onPointInput(point: Point): void {
        this.points.push(point);

        if (this.mode === '2P' || this.mode === 'CENTER') {
            if (this.points.length === 2) {
                const [p1, p2] = this.points;
                const width = this.mode === 'CENTER' ? Math.abs(p2.x - p1.x) * 2 : Math.abs(p2.x - p1.x);
                const height = this.mode === 'CENTER' ? Math.abs(p2.y - p1.y) * 2 : Math.abs(p2.y - p1.y);
                const center = this.mode === 'CENTER' ? p1 : { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

                if (width > 0.1 && height > 0.1) {
                    const layerId = useCadStore.getState().activeLayerId;
                    const entity = createRectangleEntity(center, width, height, layerId, '#ffffff');
                    useCadStore.getState().addEntity(entity);
                }

                this.resetCycle();
            } else {
                this.updatePromptForStep();
            }
        } else if (this.mode === '3P') {
            if (this.points.length === 3) {
                const poly = this.compute3PRotatedRect(this.points[0], this.points[1], this.points[2]);
                if (poly) {
                    const layerId = useCadStore.getState().activeLayerId;
                    const entity = createPolylineEntity(poly, true, layerId, '#ffffff');
                    useCadStore.getState().addEntity(entity);
                }
                this.resetCycle();
            } else {
                this.updatePromptForStep();
            }
        } else if (this.mode === 'FILLET' || this.mode === 'CHAMFER') {
            if (this.points.length === 2) {
                const [p1, p2] = this.points;
                const pts = this.mode === 'FILLET'
                    ? this.computeFilletedRectCorners(p1, p2, this.filletRadius)
                    : this.computeChamferedRectCorners(p1, p2, this.chamferDist);

                if (pts && pts.length >= 4) {
                    const layerId = useCadStore.getState().activeLayerId;
                    const entity = createPolylineEntity(pts, true, layerId, '#ffffff');
                    useCadStore.getState().addEntity(entity);
                }
                this.resetCycle();
            } else {
                this.updatePromptForStep();
            }
        }
    }

    onValueInput(value: string): void {
        const trimmed = value.trim();

        // 1. Check for interactive corner modification radius "R=10" or "C=10"
        if (trimmed.toUpperCase().startsWith('R=')) {
            const r = parseFloat(trimmed.slice(2));
            if (!isNaN(r) && r > 0) {
                this.filletRadius = r;
                this.updatePromptForStep();
                return;
            }
        }
        if (trimmed.toUpperCase().startsWith('C=')) {
            const c = parseFloat(trimmed.slice(2));
            if (!isNaN(c) && c > 0) {
                this.chamferDist = c;
                this.updatePromptForStep();
                return;
            }
        }

        // 2. Coordinate / Dimension parsing: "W,H", "WxH", "W*H", "W H", "@W,H", or single "W" (Square)
        let raw = trimmed;
        if (raw.startsWith('@')) raw = raw.slice(1).trim();

        // Support formats: "100,50", "100x50", "100X50", "100*50", "100 50"
        const parts = raw.replace(/[xX*\s]+/g, ',').split(',').map(s => parseFloat(s.trim()));

        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            if (this.points.length === 0) {
                this.onPointInput({ x: parts[0], y: parts[1] });
            } else if (this.points.length === 1) {
                const p1 = this.points[0];
                const rawW = parts[0];
                const rawH = parts[1];
                const cur = this.currentCursor;
                const signX = (cur && cur.x < p1.x) ? -1 : 1;
                const signY = (cur && cur.y < p1.y) ? -1 : 1;
                const wSigned = raw.includes('-') && rawW < 0 ? rawW : signX * Math.abs(rawW);
                const hSigned = raw.includes('-') && rawH < 0 ? rawH : signY * Math.abs(rawH);

                if (this.mode === 'CENTER') {
                    this.onPointInput({ x: p1.x + wSigned / 2, y: p1.y + hSigned / 2 });
                } else {
                    this.onPointInput({ x: p1.x + wSigned, y: p1.y + hSigned });
                }
            }
            return;
        }

        // Single dimension: Square of size S (e.g. "50")
        if (parts.length === 1 && !isNaN(parts[0]) && parts[0] > 0) {
            if (this.points.length === 1) {
                const p1 = this.points[0];
                const val = Math.abs(parts[0]);
                const cur = this.currentCursor;
                const signX = (cur && cur.x < p1.x) ? -1 : 1;
                const signY = (cur && cur.y < p1.y) ? -1 : 1;

                if (this.mode === 'CENTER') {
                    this.onPointInput({ x: p1.x + (signX * val) / 2, y: p1.y + (signY * val) / 2 });
                } else {
                    this.onPointInput({ x: p1.x + signX * val, y: p1.y + signY * val });
                }
            }
        }
    }

    private resetCycle(): void {
        this.points = [];
        this.currentCursor = null;
        useCadStore.getState().setPreviewEntity(null);
        this.updatePromptForStep();
    }

    cancel(): void {
        this.points = [];
        this.currentCursor = null;
        useCadStore.getState().setPreviewEntity(null);
        super.cancel();
    }

    // ═══════════════════════════════════════════════════════════════
    // GEOMETRIC MATHEMATICAL SOLVERS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Compute 3-Point Rotated Rectangle.
     * Baseline P1 -> P2 defines width and rotation angle. P3 defines perpendicular height.
     */
    public compute3PRotatedRect(p1: Point, p2: Point, p3: Point): Point[] | null {
        const d = distance(p1, p2);
        if (d < 1e-4) return null;

        const u = normalize(sub(p2, p1)); // Unit vector along baseline
        const n = perpendicular(u);       // Perpendicular normal vector

        // Height is scalar projection of (p3 - p1) onto normal n
        const h = (p3.x - p1.x) * n.x + (p3.y - p1.y) * n.y;

        const c1 = { ...p1 };
        const c2 = { ...p2 };
        const c3 = add(p2, scale(n, h));
        const c4 = add(p1, scale(n, h));

        return [c1, c2, c3, c4];
    }

    /**
     * Compute Filleted Rectangle Corners (8 points approximating rounded corners)
     */
    public computeFilletedRectCorners(p1: Point, p2: Point, r: number): Point[] | null {
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);

        const w = maxX - minX;
        const h = maxY - minY;
        if (w < 1e-3 || h < 1e-3) return null;

        const rad = Math.min(r, Math.min(w, h) / 2);

        return [
            { x: minX + rad, y: minY },
            { x: maxX - rad, y: minY },
            { x: maxX, y: minY + rad },
            { x: maxX, y: maxY - rad },
            { x: maxX - rad, y: maxY },
            { x: minX + rad, y: maxY },
            { x: minX, y: maxY - rad },
            { x: minX, y: minY + rad },
        ];
    }

    /**
     * Compute Chamfered Rectangle Corners (8 beveled points)
     */
    public computeChamferedRectCorners(p1: Point, p2: Point, c: number): Point[] | null {
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);

        const w = maxX - minX;
        const h = maxY - minY;
        if (w < 1e-3 || h < 1e-3) return null;

        const dist = Math.min(c, Math.min(w, h) / 2);

        return [
            { x: minX + dist, y: minY },
            { x: maxX - dist, y: minY },
            { x: maxX, y: minY + dist },
            { x: maxX, y: maxY - dist },
            { x: maxX - dist, y: maxY },
            { x: minX + dist, y: maxY },
            { x: minX, y: maxY - dist },
            { x: minX, y: minY + dist },
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // VISUAL GUIDES & HUD BADGES
    // ═══════════════════════════════════════════════════════════════

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        if (this.points.length === 0 || !this.currentCursor) return;

        ctx.save();

        if (this.mode === '2P' && this.points.length === 1) {
            const sp1 = transform(this.points[0]);
            const sp2 = transform(this.currentCursor);
            const w = Math.abs(this.currentCursor.x - this.points[0].x);
            const h = Math.abs(this.currentCursor.y - this.points[0].y);

            // Diagonal dashed guide
            ctx.strokeStyle = 'rgba(58, 208, 230, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(sp1.x, sp1.y);
            ctx.lineTo(sp2.x, sp2.y);
            ctx.stroke();

            this.drawHudBadge(ctx, sp2.x + 14, sp2.y - 12, `W: ${w.toFixed(1)} mm | H: ${h.toFixed(1)} mm`);
        } else if (this.mode === 'CENTER' && this.points.length === 1) {
            const sc = transform(this.points[0]);
            const sp2 = transform(this.currentCursor);
            const w = Math.abs(this.currentCursor.x - this.points[0].x) * 2;
            const h = Math.abs(this.currentCursor.y - this.points[0].y) * 2;

            // Center mark (+)
            ctx.strokeStyle = '#e6b84a';
            ctx.lineWidth = 1.2;
            ctx.setLineDash([]);
            const cSize = 6;
            ctx.beginPath();
            ctx.moveTo(sc.x - cSize, sc.y);
            ctx.lineTo(sc.x + cSize, sc.y);
            ctx.moveTo(sc.x, sc.y - cSize);
            ctx.lineTo(sc.x, sc.y + cSize);
            ctx.stroke();

            this.drawHudBadge(ctx, sp2.x + 14, sp2.y - 12, `CTR | W: ${w.toFixed(1)} mm | H: ${h.toFixed(1)} mm`);
        } else if (this.mode === '3P') {
            if (this.points.length === 1) {
                const sp1 = transform(this.points[0]);
                const sp2 = transform(this.currentCursor);
                const d = distance(this.points[0], this.currentCursor);
                this.drawHudBadge(ctx, sp2.x + 14, sp2.y - 12, `Base L: ${d.toFixed(1)} mm`);
            } else if (this.points.length === 2) {
                const sp2 = transform(this.currentCursor);
                const poly = this.compute3PRotatedRect(this.points[0], this.points[1], this.currentCursor);
                if (poly) {
                    const w = distance(poly[0], poly[1]);
                    const h = distance(poly[1], poly[2]);
                    this.drawHudBadge(ctx, sp2.x + 14, sp2.y - 12, `Rotated | ${w.toFixed(1)} × ${h.toFixed(1)} mm`);
                }
            }
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
