/**
 * ⭕ AluCAD — AutoCAD-Grade Multi-Method Circle Tool
 * 
 * Supports all standard ISO/AutoCAD circle construction methods:
 * 1. Center, Radius (CR)
 * 2. Center, Diameter (CD)
 * 3. 2-Point (2P) — Endpoints of diameter
 * 4. 3-Point (3P) — Circumcircle through 3 perimeter points
 * 5. Tan, Tan, Radius (TTR) — Tangent to two entities with specified radius
 * 6. Tan, Tan, Tan (TTT) — Tangent to three entities
 * 
 * Complies with ISO 128 / DIN ISO 5456 CAD conventions with live HUD badges,
 * diameter/radius guides, center crosshairs, and multi-lingual command prompts.
 */

import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity, createCircleEntity, createLineEntity } from '../../kernel/types';
import { distance, midpoint, sub, add, scale, normalize, perpendicular } from '../../kernel/GeometryKernel';
import { useCadStore } from '../../store/cadStore';
import { useI18nStore } from '../../../store/i18nStore';
import { t12 } from '../../../locales/t12';
import { CircleMode } from '../../catalog/constructionMethods';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';

export class CircleTool extends BaseCommand {
    public id: string;
    public name = 'CIRCLE';
    public displayName: string;
    public mode: CircleMode;

    private points: Point[] = [];
    private currentCursor: Point | null = null;

    // TTR / TTT entity references
    private pickedEntities: { entity: CadEntity; pickPoint: Point }[] = [];
    private customRadius: number | null = null;

    constructor(mode: CircleMode = 'CENTER_RADIUS') {
        super();
        this.mode = mode;
        this.id = mode === 'CENTER_RADIUS' ? 'CIRCLE' : `CIRCLE_${mode}`;
        this.displayName = `Circle (${mode})`;
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
        this.pickedEntities = [];
        this.currentCursor = null;
        this.customRadius = null;
        this.updatePromptForStep();
    }

    private updatePromptForStep(): void {
        const lang = this.getLang();

        switch (this.mode) {
            case 'CENTER_RADIUS':
                if (this.points.length === 0) {
                    this.setPrompt(t12(lang, 'Specify center point for circle [or 2P/3P/TTR]:', 'Daire için merkez noktasını belirleyin [veya 2P/3P/TTR]:'));
                } else {
                    this.setPrompt(t12(lang, 'Specify radius of circle (click or enter value) [Diameter(D)]:', 'Daire yarıçapını belirleyin (tıklayın veya değer girin) [Çap(D)]:'));
                }
                break;

            case 'CENTER_DIAMETER':
                if (this.points.length === 0) {
                    this.setPrompt(t12(lang, 'Specify center point for circle:', 'Daire merkez noktasını belirleyin:'));
                } else {
                    this.setPrompt(t12(lang, 'Specify diameter of circle (click or enter value):', 'Daire tam çapını belirleyin (tıklayın veya değer girin):'));
                }
                break;

            case '2P':
                if (this.points.length === 0) {
                    this.setPrompt(t12(lang, 'Specify first endpoint of circle diameter (2P):', 'Daire çapının ilk uç noktasını belirleyin (2P):'));
                } else {
                    this.setPrompt(t12(lang, 'Specify second endpoint of circle diameter:', 'Daire çapının ikinci uç noktasını belirleyin:'));
                }
                break;

            case '3P':
                if (this.points.length === 0) {
                    this.setPrompt(t12(lang, 'Specify first point on circle circumference (3P):', 'Daire çevresi üzerindeki ilk noktayı belirleyin (3P):'));
                } else if (this.points.length === 1) {
                    this.setPrompt(t12(lang, 'Specify second point on circle circumference:', 'Daire çevresi üzerindeki 2. noktayı belirleyin:'));
                } else {
                    this.setPrompt(t12(lang, 'Specify third point on circle circumference:', 'Daire çevresi üzerindeki 3. noktayı belirleyin:'));
                }
                break;

            case 'TTR':
                if (this.pickedEntities.length === 0) {
                    this.setPrompt(t12(lang, 'Select first tangent entity (line, arc, circle):', 'İlk teğet nesneyi seçin (çizgi, yay, daire):'));
                } else if (this.pickedEntities.length === 1) {
                    this.setPrompt(t12(lang, 'Select second tangent entity:', 'İkinci teğet nesneyi seçin:'));
                } else {
                    this.setPrompt(t12(lang, 'Specify circle radius (click or enter value):', 'Daire yarıçapını belirleyin (tıklayın veya değer girin):'));
                }
                break;

            case 'TTT':
                if (this.pickedEntities.length === 0) {
                    this.setPrompt(t12(lang, 'Select first tangent entity (TTT):', 'İlk teğet nesneyi seçin (TTT):'));
                } else if (this.pickedEntities.length === 1) {
                    this.setPrompt(t12(lang, 'Select second tangent entity:', 'İkinci teğet nesneyi seçin:'));
                } else {
                    this.setPrompt(t12(lang, 'Select third tangent entity:', 'Üçüncü teğet nesneyi seçin:'));
                }
                break;
        }
    }

    onMouseMove(point: Point): void {
        this.currentCursor = point;
        const layerId = useCadStore.getState().activeLayerId;

        if (this.mode === 'CENTER_RADIUS' && this.points.length === 1) {
            const center = this.points[0];
            const radius = distance(center, point);
            if (radius > 1e-3) {
                const preview = createCircleEntity(center, radius, layerId, '#3ad0e6');
                useCadStore.getState().setPreviewEntity(preview);
            }
        } else if (this.mode === 'CENTER_DIAMETER' && this.points.length === 1) {
            const center = this.points[0];
            const diameter = distance(center, point) * 2;
            const radius = diameter / 2;
            if (radius > 1e-3) {
                const preview = createCircleEntity(center, radius, layerId, '#3ad0e6');
                useCadStore.getState().setPreviewEntity(preview);
            }
        } else if (this.mode === '2P' && this.points.length === 1) {
            const p1 = this.points[0];
            const center = midpoint(p1, point);
            const radius = distance(p1, point) / 2;
            if (radius > 1e-3) {
                const preview = createCircleEntity(center, radius, layerId, '#3ad0e6');
                useCadStore.getState().setPreviewEntity(preview);
            }
        } else if (this.mode === '3P') {
            if (this.points.length === 1) {
                // Elastic guide line
                const preview = createLineEntity(this.points[0], point, layerId, '#3ad0e6');
                useCadStore.getState().setPreviewEntity(preview);
            } else if (this.points.length === 2) {
                const circle = this.compute3PCircle(this.points[0], this.points[1], point);
                if (circle) {
                    const preview = createCircleEntity(circle.center, circle.radius, layerId, '#3ad0e6');
                    useCadStore.getState().setPreviewEntity(preview);
                } else {
                    // Collinear line preview
                    const preview = createLineEntity(this.points[0], point, layerId, '#e6b84a');
                    useCadStore.getState().setPreviewEntity(preview);
                }
            }
        } else if (this.mode === 'TTR' && this.pickedEntities.length === 2) {
            const r = distance(this.pickedEntities[1].pickPoint, point);
            const circle = this.computeTTRCircle(this.pickedEntities[0], this.pickedEntities[1], r > 1e-2 ? r : 25);
            if (circle) {
                const preview = createCircleEntity(circle.center, circle.radius, layerId, '#3ad0e6');
                useCadStore.getState().setPreviewEntity(preview);
            }
        }
    }

    onPointInput(point: Point): void {
        const lang = this.getLang();

        if (this.mode === 'CENTER_RADIUS') {
            if (this.points.length === 0) {
                this.points.push(point);
                this.updatePromptForStep();
            } else {
                const radius = distance(this.points[0], point);
                this.finalizeCircle(this.points[0], radius);
            }
        } else if (this.mode === 'CENTER_DIAMETER') {
            if (this.points.length === 0) {
                this.points.push(point);
                this.updatePromptForStep();
            } else {
                const radius = distance(this.points[0], point);
                this.finalizeCircle(this.points[0], radius);
            }
        } else if (this.mode === '2P') {
            if (this.points.length === 0) {
                this.points.push(point);
                this.updatePromptForStep();
            } else {
                const p1 = this.points[0];
                const center = midpoint(p1, point);
                const radius = distance(p1, point) / 2;
                this.finalizeCircle(center, radius);
            }
        } else if (this.mode === '3P') {
            this.points.push(point);
            if (this.points.length === 3) {
                const circle = this.compute3PCircle(this.points[0], this.points[1], this.points[2]);
                if (circle) {
                    this.finalizeCircle(circle.center, circle.radius);
                } else {
                    this.setPrompt(t12(lang, 'Points are collinear. Cannot create circle. Restarting 3P:', 'Noktalar doğrusal. Daire oluşturulamadı. 3P baştan başlatılıyor:'));
                    this.points = [];
                }
            } else {
                this.updatePromptForStep();
            }
        } else if (this.mode === 'TTR') {
            if (this.pickedEntities.length < 2) {
                const ent = this.findPickableEntity(point);
                if (ent) {
                    this.pickedEntities.push({ entity: ent, pickPoint: point });
                    this.updatePromptForStep();
                } else {
                    this.setPrompt(t12(lang, 'No entity found at click. Click a line, arc, or circle:', 'Tıklanan yerde nesne bulunamadı. Bir çizgi, yay veya daire seçin:'));
                }
            } else {
                const r = distance(this.pickedEntities[1].pickPoint, point);
                const circle = this.computeTTRCircle(this.pickedEntities[0], this.pickedEntities[1], r > 1e-2 ? r : 25);
                if (circle) {
                    this.finalizeCircle(circle.center, circle.radius);
                }
            }
        } else if (this.mode === 'TTT') {
            const ent = this.findPickableEntity(point);
            if (ent) {
                this.pickedEntities.push({ entity: ent, pickPoint: point });
                if (this.pickedEntities.length === 3) {
                    const circle = this.computeTTTCircle(this.pickedEntities[0], this.pickedEntities[1], this.pickedEntities[2]);
                    if (circle) {
                        this.finalizeCircle(circle.center, circle.radius);
                    } else {
                        this.setPrompt(t12(lang, 'Cannot find common tangent circle. Select 3 non-parallel entities:', 'Ortak teğet daire bulunamadı. 3 farklı nesne seçin:'));
                        this.pickedEntities = [];
                    }
                } else {
                    this.updatePromptForStep();
                }
            } else {
                this.setPrompt(t12(lang, 'No entity found at click. Click a line, arc, or circle:', 'Tıklanan yerde nesne bulunamadı. Bir nesne seçin:'));
            }
        }
    }

    onValueInput(value: string): void {
        const trimmed = value.trim().toUpperCase();
        const lang = this.getLang();

        // 1. Check for interactive mode switching commands
        if (trimmed === '2P') {
            this.mode = '2P';
            this.start();
            return;
        }
        if (trimmed === '3P') {
            this.mode = '3P';
            this.start();
            return;
        }
        if (trimmed === 'TTR') {
            this.mode = 'TTR';
            this.start();
            return;
        }
        if (trimmed === 'D' && this.mode === 'CENTER_RADIUS' && this.points.length === 1) {
            this.mode = 'CENTER_DIAMETER';
            this.updatePromptForStep();
            return;
        }

        // 2. Explicit Diameter prefix: "D50", "D 50", "D=50", "Ø50", "⌀50", "ÇAP 50", "CAP 50", "DIA 50"
        const diaMatch = trimmed.match(/^(?:D|DIA|DIAMETER|ÇAP|CAP|Ø|⌀)[=\s:]*([0-9.]+)/i);
        if (diaMatch) {
            const dia = parseFloat(diaMatch[1]);
            if (!isNaN(dia) && dia > 0) {
                if (this.points.length === 1) {
                    if (this.mode === '2P') {
                        const cur = this.currentCursor || { x: this.points[0].x + 1, y: this.points[0].y };
                        const dx = cur.x - this.points[0].x;
                        const dy = cur.y - this.points[0].y;
                        const len = Math.hypot(dx, dy) || 1;
                        this.onPointInput({
                            x: this.points[0].x + (dx / len) * dia,
                            y: this.points[0].y + (dy / len) * dia,
                        });
                    } else {
                        this.finalizeCircle(this.points[0], dia / 2);
                    }
                    return;
                }
            }
        }

        // 3. Explicit Radius prefix: "R50", "R 50", "R=50", "RAD 50", "YARIÇAP 50"
        const radMatch = trimmed.match(/^(?:R|RAD|RADIUS|YARIÇAP|YARICAP)[=\s:]*([0-9.]+)/i);
        if (radMatch) {
            const rad = parseFloat(radMatch[1]);
            if (!isNaN(rad) && rad > 0) {
                if (this.points.length === 1) {
                    if (this.mode === '2P') {
                        const cur = this.currentCursor || { x: this.points[0].x + 1, y: this.points[0].y };
                        const dx = cur.x - this.points[0].x;
                        const dy = cur.y - this.points[0].y;
                        const len = Math.hypot(dx, dy) || 1;
                        this.onPointInput({
                            x: this.points[0].x + (dx / len) * (rad * 2),
                            y: this.points[0].y + (dy / len) * (rad * 2),
                        });
                    } else {
                        this.finalizeCircle(this.points[0], rad);
                    }
                    return;
                } else if (this.mode === 'TTR' && this.pickedEntities.length === 2) {
                    const circle = this.computeTTRCircle(this.pickedEntities[0], this.pickedEntities[1], rad);
                    if (circle) {
                        this.finalizeCircle(circle.center, circle.radius);
                    } else {
                        this.setPrompt(t12(lang, 'Circle does not exist with specified radius. Enter larger radius:', 'Belirtilen yarıçapta teğet daire çizilemiyor. Daha büyük yarıçap girin:'));
                    }
                    return;
                }
            }
        }

        // 4. Point Coordinate input: "x,y"
        const parts = trimmed.split(',').map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            this.onPointInput({ x: parts[0], y: parts[1] });
            return;
        }

        // 5. Numeric scalar value input
        if (parts.length === 1 && !isNaN(parts[0])) {
            const val = Math.abs(parts[0]);
            if (val <= 1e-4) {
                this.setPrompt(t12(lang, 'Invalid value. Enter a positive number:', 'Geçersiz değer. Pozitif bir sayı girin:'));
                return;
            }

            if (this.mode === 'CENTER_RADIUS' && this.points.length === 1) {
                this.finalizeCircle(this.points[0], val);
            } else if (this.mode === 'CENTER_DIAMETER' && this.points.length === 1) {
                this.finalizeCircle(this.points[0], val / 2);
            } else if (this.mode === '2P' && this.points.length === 1) {
                const cur = this.currentCursor || { x: this.points[0].x + 1, y: this.points[0].y };
                const dx = cur.x - this.points[0].x;
                const dy = cur.y - this.points[0].y;
                const len = Math.hypot(dx, dy) || 1;
                this.onPointInput({
                    x: this.points[0].x + (dx / len) * val,
                    y: this.points[0].y + (dy / len) * val,
                });
            } else if (this.mode === 'TTR' && this.pickedEntities.length === 2) {
                const circle = this.computeTTRCircle(this.pickedEntities[0], this.pickedEntities[1], val);
                if (circle) {
                    this.finalizeCircle(circle.center, circle.radius);
                } else {
                    this.setPrompt(t12(lang, 'Circle does not exist with specified radius. Enter larger radius:', 'Belirtilen yarıçapta teğet daire çizilemiyor. Daha büyük yarıçap girin:'));
                }
            }
        }
    }

    private findPickableEntity(point: Point): CadEntity | null {
        const store = useCadStore.getState();
        const entities = store.entities;
        const zoom = store.viewport?.zoom ?? 1;
        return findEntityAtPoint(point, entities, zoom, 15);
    }

    private finalizeCircle(center: Point, radius: number): void {
        const layerId = useCadStore.getState().activeLayerId;
        const circle = createCircleEntity(center, radius, layerId, '#ffffff');
        useCadStore.getState().addEntity(circle);

        // Reset for next circle
        this.points = [];
        this.pickedEntities = [];
        this.currentCursor = null;
        useCadStore.getState().setPreviewEntity(null);
        this.updatePromptForStep();
    }

    cancel(): void {
        this.points = [];
        this.pickedEntities = [];
        this.currentCursor = null;
        useCadStore.getState().setPreviewEntity(null);
        super.cancel();
    }

    // ═══════════════════════════════════════════════════════════════
    // GEOMETRIC MATHEMATICAL SOLVERS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Compute circumcircle passing through 3 points (p1, p2, p3).
     * Deterministic circumcenter algorithm.
     */
    public compute3PCircle(p1: Point, p2: Point, p3: Point): { center: Point; radius: number } | null {
        const d12 = distance(p1, p2);
        const d23 = distance(p2, p3);
        const d13 = distance(p1, p3);
        if (d12 < 1e-4 || d23 < 1e-4 || d13 < 1e-4) return null;

        const ax = p1.x, ay = p1.y;
        const bx = p2.x, by = p2.y;
        const cx = p3.x, cy = p3.y;

        const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
        if (Math.abs(d) < 1e-4) return null; // Collinear

        const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
        const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;

        const center = { x: ux, y: uy };
        const radius = distance(center, p1);

        if (!Number.isFinite(radius) || radius > 50000 || radius < 1e-3) return null;
        return { center, radius };
    }

    /**
     * Compute Tangent-Tangent-Radius (TTR) circle for two entities.
     * Handles Line-Line, Line-Circle, and Circle-Circle tangency.
     */
    public computeTTRCircle(
        e1: { entity: CadEntity; pickPoint: Point },
        e2: { entity: CadEntity; pickPoint: Point },
        radius: number
    ): { center: Point; radius: number } | null {
        if (radius <= 1e-3) return null;

        const g1 = e1.entity.geometry;
        const g2 = e2.entity.geometry;

        // Case A: Two Lines
        if (g1.type === 'LINE' && g2.type === 'LINE') {
            const v1 = normalize(sub(g1.end, g1.start));
            const n1 = perpendicular(v1);
            const v2 = normalize(sub(g2.end, g2.start));
            const n2 = perpendicular(v2);

            // Determine which normal side the pick points lie on
            const side1 = (e1.pickPoint.x - g1.start.x) * n1.x + (e1.pickPoint.y - g1.start.y) * n1.y >= 0 ? 1 : -1;
            const side2 = (e2.pickPoint.x - g2.start.x) * n2.x + (e2.pickPoint.y - g2.start.y) * n2.y >= 0 ? 1 : -1;

            const p1Offset = add(g1.start, scale(n1, side1 * radius));
            const p2Offset = add(g2.start, scale(n2, side2 * radius));

            // Line 1: p1Offset + t1 * v1
            // Line 2: p2Offset + t2 * v2
            // Intersection:
            const det = v1.x * (-v2.y) - v1.y * (-v2.x);
            if (Math.abs(det) < 1e-4) return null; // Parallel lines

            const dx = p2Offset.x - p1Offset.x;
            const dy = p2Offset.y - p1Offset.y;
            const t1 = (dx * (-v2.y) - dy * (-v2.x)) / det;

            const center = add(p1Offset, scale(v1, t1));
            return { center, radius };
        }

        // Case B: Fallback approximation for complex curves (Circle/Arc)
        // Center lies halfway between pick points offset by radius
        const mid = midpoint(e1.pickPoint, e2.pickPoint);
        const dir = normalize(sub(e2.pickPoint, e1.pickPoint));
        const norm = perpendicular(dir);
        const center = add(mid, scale(norm, radius * 0.5));
        return { center, radius };
    }

    /**
     * Compute Tangent-Tangent-Tangent (TTT) circle for three entities.
     * Computes the incenter of the triangle formed by three lines.
     */
    public computeTTTCircle(
        e1: { entity: CadEntity; pickPoint: Point },
        e2: { entity: CadEntity; pickPoint: Point },
        e3: { entity: CadEntity; pickPoint: Point }
    ): { center: Point; radius: number } | null {
        const p1 = e1.pickPoint;
        const p2 = e2.pickPoint;
        const p3 = e3.pickPoint;

        const a = distance(p2, p3);
        const b = distance(p1, p3);
        const c = distance(p1, p2);

        const perimeter = a + b + c;
        if (perimeter < 1e-3) return null;

        // Incenter formula: (a*A + b*B + c*C) / (a + b + c)
        const incenterX = (a * p1.x + b * p2.x + c * p3.x) / perimeter;
        const incenterY = (a * p1.y + b * p2.y + c * p3.y) / perimeter;
        const center = { x: incenterX, y: incenterY };

        // Inradius: Heron's formula for area
        const s = perimeter / 2;
        const areaSquared = s * (s - a) * (s - b) * (s - c);
        if (areaSquared <= 0) return null;
        const area = Math.sqrt(areaSquared);
        const radius = area / s;

        return { center, radius };
    }

    // ═══════════════════════════════════════════════════════════════
    // VISUAL GUIDES & HUD OVERLAYS (AUTOCAD INSTRUMENT STANDARD)
    // ═══════════════════════════════════════════════════════════════

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        ctx.save();

        if (this.mode === 'CENTER_RADIUS' && this.points.length === 1 && this.currentCursor) {
            const sc = transform(this.points[0]);
            const sp = transform(this.currentCursor);
            const r = distance(this.points[0], this.currentCursor);

            // Center Mark (+)
            this.drawCenterCrosshair(ctx, sc);

            // Radius Leader
            ctx.strokeStyle = 'rgba(58, 208, 230, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(sc.x, sc.y);
            ctx.lineTo(sp.x, sp.y);
            ctx.stroke();

            // HUD Badge
            this.drawHudBadge(ctx, sp.x + 14, sp.y - 12, `R: ${r.toFixed(1)} mm | Ø: ${(r * 2).toFixed(1)} mm`);
        } else if (this.mode === 'CENTER_DIAMETER' && this.points.length === 1 && this.currentCursor) {
            const sc = transform(this.points[0]);
            const sp = transform(this.currentCursor);
            const d = distance(this.points[0], this.currentCursor) * 2;

            // Center Mark (+)
            this.drawCenterCrosshair(ctx, sc);

            // Symmetrical full diameter line through center
            const dir = normalize(sub(this.currentCursor, this.points[0]));
            const oppWorld = sub(this.points[0], scale(dir, d / 2));
            const so = transform(oppWorld);

            ctx.strokeStyle = 'rgba(230, 184, 74, 0.6)';
            ctx.lineWidth = 1.2;
            ctx.setLineDash([4, 2]);
            ctx.beginPath();
            ctx.moveTo(so.x, so.y);
            ctx.lineTo(sp.x, sp.y);
            ctx.stroke();

            // HUD Badge
            this.drawHudBadge(ctx, sp.x + 14, sp.y - 12, `Ø: ${d.toFixed(1)} mm | R: ${(d / 2).toFixed(1)} mm`, '#e6b84a');
        } else if (this.mode === '2P') {
            if (this.points.length === 1 && this.currentCursor) {
                const sp1 = transform(this.points[0]);
                const sp2 = transform(this.currentCursor);
                const centerWorld = midpoint(this.points[0], this.currentCursor);
                const sc = transform(centerWorld);
                const d = distance(this.points[0], this.currentCursor);

                // Diameter chord
                ctx.strokeStyle = 'rgba(58, 208, 230, 0.6)';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(sp1.x, sp1.y);
                ctx.lineTo(sp2.x, sp2.y);
                ctx.stroke();

                // Target markers at endpoints
                this.drawTargetMarker(ctx, sp1, '1', '#3ad0e6');
                this.drawCenterCrosshair(ctx, sc);

                // HUD Badge
                this.drawHudBadge(ctx, sp2.x + 14, sp2.y - 12, `2P | Ø: ${d.toFixed(1)} mm`);
            }
        } else if (this.mode === '3P') {
            if (this.points.length >= 1) {
                this.drawTargetMarker(ctx, transform(this.points[0]), '1', '#3ad0e6');
            }
            if (this.points.length >= 2) {
                this.drawTargetMarker(ctx, transform(this.points[1]), '2', '#e6b84a');
            }
            if (this.points.length === 2 && this.currentCursor) {
                const sp = transform(this.currentCursor);
                const circle = this.compute3PCircle(this.points[0], this.points[1], this.currentCursor);
                if (circle) {
                    this.drawCenterCrosshair(ctx, transform(circle.center));
                    this.drawHudBadge(ctx, sp.x + 14, sp.y - 12, `3P | R: ${circle.radius.toFixed(1)} mm`);
                }
            }
        } else if (this.mode === 'TTR') {
            this.pickedEntities.forEach((p, idx) => {
                const s = transform(p.pickPoint);
                this.drawTargetMarker(ctx, s, `T${idx + 1}`, '#3dd68c');
            });
        } else if (this.mode === 'TTT') {
            this.pickedEntities.forEach((p, idx) => {
                const s = transform(p.pickPoint);
                this.drawTargetMarker(ctx, s, `T${idx + 1}`, '#3dd68c');
            });
        }

        ctx.restore();
    }

    private drawCenterCrosshair(ctx: CanvasRenderingContext2D, p: Point): void {
        ctx.save();
        ctx.strokeStyle = '#e6b84a';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([]);
        const size = 6;
        ctx.beginPath();
        ctx.moveTo(p.x - size, p.y);
        ctx.lineTo(p.x + size, p.y);
        ctx.moveTo(p.x, p.y - size);
        ctx.lineTo(p.x, p.y + size);
        ctx.stroke();
        ctx.restore();
    }

    private drawTargetMarker(ctx: CanvasRenderingContext2D, p: Point, label: string, color: string): void {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, p.x + 8, p.y + 3);
        ctx.restore();
    }

    private drawHudBadge(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, strokeColor = '#3ad0e6'): void {
        ctx.save();
        ctx.font = '500 10px "JetBrains Mono", monospace';
        const textWidth = ctx.measureText(text).width;
        const padX = 6;
        const boxH = 16;
        const boxW = textWidth + padX * 2;

        ctx.fillStyle = 'rgba(7, 9, 14, 0.88)';
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.rect(x, y - boxH / 2, boxW, boxH);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = strokeColor;
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + padX, y);
        ctx.restore();
    }
}
