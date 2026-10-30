/**
 * 📐 AluCAD — AutoCAD-Grade Multi-Method Arc Tool
 * 
 * Supports all 9 ISO/AutoCAD arc construction methods:
 * 1. 3-Point (3P) — Start, Through, End
 * 2. Start, Center, End (SCE)
 * 3. Start, Center, Angle (SCA)
 * 4. Start, Center, Chord Length (SCL)
 * 5. Start, End, Radius (SER)
 * 6. Start, End, Direction (SED)
 * 7. Center, Start, End (CSE)
 * 8. Center, Start, Angle (CSA)
 * 9. Continue (Tangent Arc from last line or arc)
 * 
 * Complies with ISO 128 / DIN ISO 5456 CAD standards with CCW orientation resolution,
 * collinear line fallbacks, live HUD badges, center marks, and radial chord guides.
 */

import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity, createLineEntity } from '../../kernel/types';
import { distance, midpoint, sub, add, scale, normalize, perpendicular } from '../../kernel/GeometryKernel';
import { useCadStore } from '../../store/cadStore';
import { useI18nStore } from '../../../store/i18nStore';
import { t12 } from '../../../locales/t12';
import { ArcMode } from '../../catalog/constructionMethods';

export class ArcTool extends BaseCommand {
    public id: string;
    public name = 'ARC';
    public displayName: string;
    public mode: ArcMode;

    private points: Point[] = [];
    private currentCursor: Point | null = null;
    private initialTangentDir: Point | null = null;

    constructor(mode: ArcMode = '3P') {
        super();
        this.mode = mode;
        this.id = mode === '3P' ? 'ARC' : `ARC_${mode}`;
        this.displayName = `Arc (${mode})`;
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
        this.initialTangentDir = null;

        // Special initialization for CONTINUE mode
        if (this.mode === 'CONTINUE') {
            this.initContinueMode();
        }

        this.updatePromptForStep();
    }

    private initContinueMode(): void {
        const entities = useCadStore.getState().entities;
        const last = entities[entities.length - 1];

        if (last && last.geometry.type === 'LINE') {
            const line = last.geometry;
            this.points.push({ ...line.end });
            this.initialTangentDir = normalize(sub(line.end, line.start));
        } else if (last && last.geometry.type === 'ARC') {
            const arc = last.geometry;
            const endPt = {
                x: arc.center.x + arc.radius * Math.cos(arc.endAngle),
                y: arc.center.y + arc.radius * Math.sin(arc.endAngle),
            };
            this.points.push(endPt);
            // Tangent vector is perpendicular to radial vector in CCW direction
            const radDir = { x: Math.cos(arc.endAngle), y: Math.sin(arc.endAngle) };
            this.initialTangentDir = { x: -radDir.y, y: radDir.x };
        }
    }

    private updatePromptForStep(): void {
        const lang = this.getLang();

        switch (this.mode) {
            case '3P':
                if (this.points.length === 0) {
                    this.setPrompt(t12(lang, 'Specify start point of arc (3P):', 'Yayın başlangıç noktasını belirleyin (3P):'));
                } else if (this.points.length === 1) {
                    this.setPrompt(t12(lang, 'Specify second point (through point) of arc:', 'Yayın 2. noktasını (yay üzerinden geçen nokta) belirleyin:'));
                } else {
                    this.setPrompt(t12(lang, 'Specify end point of arc:', 'Yayın bitiş noktasını belirleyin:'));
                }
                break;

            case 'START_CENTER_END':
                if (this.points.length === 0) {
                    this.setPrompt(t12(lang, 'Specify start point of arc:', 'Yayın başlangıç noktasını belirleyin:'));
                } else if (this.points.length === 1) {
                    this.setPrompt(t12(lang, 'Specify center point of arc:', 'Yayın merkez noktasını belirleyin:'));
                } else {
                    this.setPrompt(t12(lang, 'Specify end point of arc (or chord angle):', 'Yayın bitiş doğrultusunu belirleyin:'));
                }
                break;

            case 'START_CENTER_ANGLE':
                if (this.points.length === 0) {
                    this.setPrompt(t12(lang, 'Specify start point of arc:', 'Yayın başlangıç noktasını belirleyin:'));
                } else if (this.points.length === 1) {
                    this.setPrompt(t12(lang, 'Specify center point of arc:', 'Yayın merkez noktasını belirleyin:'));
                } else {
                    this.setPrompt(t12(lang, 'Specify included sweep angle (deg) [click or type]:', 'Taranacak yay açısını belirleyin (derece) [tıklayın veya yazın]:'));
                }
                break;

            case 'START_CENTER_LENGTH':
                if (this.points.length === 0) {
                    this.setPrompt(t12(lang, 'Specify start point of arc:', 'Yayın başlangıç noktasını belirleyin:'));
                } else if (this.points.length === 1) {
                    this.setPrompt(t12(lang, 'Specify center point of arc:', 'Yayın merkez noktasını belirleyin:'));
                } else {
                    this.setPrompt(t12(lang, 'Specify chord length (L <= 2R) [click or type]:', 'Kiriş uzunluğunu belirleyin (L <= 2R) [tıklayın veya yazın]:'));
                }
                break;

            case 'START_END_RADIUS':
                if (this.points.length === 0) {
                    this.setPrompt(t12(lang, 'Specify start point of arc:', 'Yayın başlangıç noktasını belirleyin:'));
                } else if (this.points.length === 1) {
                    this.setPrompt(t12(lang, 'Specify end point of arc:', 'Yayın bitiş noktasını belirleyin:'));
                } else {
                    this.setPrompt(t12(lang, 'Specify radius of arc (R >= chord/2):', 'Yay yarıçapını belirleyin (R >= kiriş/2):'));
                }
                break;

            case 'START_END_DIRECTION':
                if (this.points.length === 0) {
                    this.setPrompt(t12(lang, 'Specify start point of arc:', 'Yayın başlangıç noktasını belirleyin:'));
                } else if (this.points.length === 1) {
                    this.setPrompt(t12(lang, 'Specify end point of arc:', 'Yayın bitiş noktasını belirleyin:'));
                } else {
                    this.setPrompt(t12(lang, 'Specify tangent direction vector at start point:', 'Başlangıç noktasındaki teğet yönünü belirleyin:'));
                }
                break;

            case 'CENTER_START_END':
                if (this.points.length === 0) {
                    this.setPrompt(t12(lang, 'Specify center point of arc:', 'Yayın merkez noktasını belirleyin:'));
                } else if (this.points.length === 1) {
                    this.setPrompt(t12(lang, 'Specify start point of arc:', 'Yayın başlangıç noktasını belirleyin:'));
                } else {
                    this.setPrompt(t12(lang, 'Specify end point of arc:', 'Yayın bitiş doğrultusunu belirleyin:'));
                }
                break;

            case 'CENTER_START_ANGLE':
                if (this.points.length === 0) {
                    this.setPrompt(t12(lang, 'Specify center point of arc:', 'Yayın merkez noktasını belirleyin:'));
                } else if (this.points.length === 1) {
                    this.setPrompt(t12(lang, 'Specify start point of arc:', 'Yayın başlangıç noktasını belirleyin:'));
                } else {
                    this.setPrompt(t12(lang, 'Specify included sweep angle (deg):', 'Taranacak yay açısını belirleyin (derece):'));
                }
                break;

            case 'CONTINUE':
                if (this.points.length === 0) {
                    this.setPrompt(t12(lang, 'No previous entity found. Specify start point of tangent arc:', 'Önceki nesne bulunamadı. Teğet yayın başlangıç noktasını belirleyin:'));
                } else {
                    this.setPrompt(t12(lang, 'Specify end point of tangent arc:', 'Teğet yayın bitiş noktasını belirleyin:'));
                }
                break;
        }
    }

    onMouseMove(point: Point): void {
        this.currentCursor = point;
        const layerId = useCadStore.getState().activeLayerId;

        if (this.mode === '3P') {
            if (this.points.length === 1) {
                const preview = createLineEntity(this.points[0], point, layerId, '#3ad0e6');
                useCadStore.getState().setPreviewEntity(preview);
            } else if (this.points.length === 2) {
                const arc = this.compute3PArc(this.points[0], this.points[1], point);
                if (arc) {
                    useCadStore.getState().setPreviewEntity({
                        id: 'preview-arc',
                        layerId,
                        color: '#3ad0e6',
                        isVisible: true,
                        isSelected: false,
                        geometry: { type: 'ARC', ...arc }
                    });
                } else {
                    const preview = createLineEntity(this.points[0], point, layerId, '#e6b84a');
                    useCadStore.getState().setPreviewEntity(preview);
                }
            }
        } else if (this.mode === 'START_CENTER_END') {
            if (this.points.length === 1) {
                const preview = createLineEntity(this.points[0], point, layerId, '#3ad0e6');
                useCadStore.getState().setPreviewEntity(preview);
            } else if (this.points.length === 2) {
                const arc = this.computeSCEArc(this.points[0], this.points[1], point);
                if (arc) {
                    useCadStore.getState().setPreviewEntity({
                        id: 'preview-arc',
                        layerId,
                        color: '#3ad0e6',
                        isVisible: true,
                        isSelected: false,
                        geometry: { type: 'ARC', ...arc }
                    });
                }
            }
        } else if (this.mode === 'START_CENTER_ANGLE' || this.mode === 'START_CENTER_LENGTH') {
            if (this.points.length === 1) {
                const preview = createLineEntity(this.points[0], point, layerId, '#3ad0e6');
                useCadStore.getState().setPreviewEntity(preview);
            } else if (this.points.length === 2) {
                const arc = this.mode === 'START_CENTER_ANGLE'
                    ? this.computeSCAArc(this.points[0], this.points[1], point)
                    : this.computeSCLArc(this.points[0], this.points[1], point);
                if (arc) {
                    useCadStore.getState().setPreviewEntity({
                        id: 'preview-arc',
                        layerId,
                        color: '#3ad0e6',
                        isVisible: true,
                        isSelected: false,
                        geometry: { type: 'ARC', ...arc }
                    });
                }
            }
        } else if (this.mode === 'START_END_RADIUS') {
            if (this.points.length === 1) {
                const preview = createLineEntity(this.points[0], point, layerId, '#3ad0e6');
                useCadStore.getState().setPreviewEntity(preview);
            } else if (this.points.length === 2) {
                const arc = this.computeSERArc(this.points[0], this.points[1], point);
                if (arc) {
                    useCadStore.getState().setPreviewEntity({
                        id: 'preview-arc',
                        layerId,
                        color: '#3ad0e6',
                        isVisible: true,
                        isSelected: false,
                        geometry: { type: 'ARC', ...arc }
                    });
                }
            }
        } else if (this.mode === 'START_END_DIRECTION') {
            if (this.points.length === 1) {
                const preview = createLineEntity(this.points[0], point, layerId, '#3ad0e6');
                useCadStore.getState().setPreviewEntity(preview);
            } else if (this.points.length === 2) {
                const arc = this.computeSEDArc(this.points[0], this.points[1], point);
                if (arc) {
                    useCadStore.getState().setPreviewEntity({
                        id: 'preview-arc',
                        layerId,
                        color: '#3ad0e6',
                        isVisible: true,
                        isSelected: false,
                        geometry: { type: 'ARC', ...arc }
                    });
                }
            }
        } else if (this.mode === 'CENTER_START_END' || this.mode === 'CENTER_START_ANGLE') {
            if (this.points.length === 1) {
                const preview = createLineEntity(this.points[0], point, layerId, '#3ad0e6');
                useCadStore.getState().setPreviewEntity(preview);
            } else if (this.points.length === 2) {
                const arc = this.mode === 'CENTER_START_END'
                    ? this.computeSCEArc(this.points[1], this.points[0], point)
                    : this.computeSCAArc(this.points[1], this.points[0], point);
                if (arc) {
                    useCadStore.getState().setPreviewEntity({
                        id: 'preview-arc',
                        layerId,
                        color: '#3ad0e6',
                        isVisible: true,
                        isSelected: false,
                        geometry: { type: 'ARC', ...arc }
                    });
                }
            }
        } else if (this.mode === 'CONTINUE' && this.points.length === 1 && this.initialTangentDir) {
            const arc = this.computeTangentArc(this.points[0], this.initialTangentDir, point);
            if (arc) {
                useCadStore.getState().setPreviewEntity({
                    id: 'preview-arc',
                    layerId,
                    color: '#3ad0e6',
                    isVisible: true,
                    isSelected: false,
                    geometry: { type: 'ARC', ...arc }
                });
            }
        }
    }

    onPointInput(point: Point): void {
        const lang = this.getLang();

        if (this.mode === 'CONTINUE' && this.points.length === 1 && this.initialTangentDir) {
            const arc = this.computeTangentArc(this.points[0], this.initialTangentDir, point);
            if (arc) {
                this.finalizeArc(arc);
            }
            return;
        }

        this.points.push(point);

        if (this.mode === '3P') {
            if (this.points.length === 3) {
                const arc = this.compute3PArc(this.points[0], this.points[1], this.points[2]);
                if (arc) {
                    this.finalizeArc(arc);
                } else {
                    this.setPrompt(t12(lang, 'Points are collinear. Cannot create arc. Restarting 3P:', 'Noktalar doğrusal. Yay oluşturulamadı. 3P baştan başlatılıyor:'));
                    this.points = [];
                }
            } else {
                this.updatePromptForStep();
            }
        } else if (this.mode === 'START_CENTER_END') {
            if (this.points.length === 3) {
                const arc = this.computeSCEArc(this.points[0], this.points[1], this.points[2]);
                if (arc) {
                    this.finalizeArc(arc);
                } else {
                    this.points = [];
                }
            } else {
                this.updatePromptForStep();
            }
        } else if (this.mode === 'START_CENTER_ANGLE') {
            if (this.points.length === 3) {
                const arc = this.computeSCAArc(this.points[0], this.points[1], this.points[2]);
                if (arc) this.finalizeArc(arc);
                else this.points = [];
            } else {
                this.updatePromptForStep();
            }
        } else if (this.mode === 'START_CENTER_LENGTH') {
            if (this.points.length === 3) {
                const arc = this.computeSCLArc(this.points[0], this.points[1], this.points[2]);
                if (arc) this.finalizeArc(arc);
                else this.points = [];
            } else {
                this.updatePromptForStep();
            }
        } else if (this.mode === 'START_END_RADIUS') {
            if (this.points.length === 3) {
                const arc = this.computeSERArc(this.points[0], this.points[1], this.points[2]);
                if (arc) this.finalizeArc(arc);
                else this.points = [];
            } else {
                this.updatePromptForStep();
            }
        } else if (this.mode === 'START_END_DIRECTION') {
            if (this.points.length === 3) {
                const arc = this.computeSEDArc(this.points[0], this.points[1], this.points[2]);
                if (arc) this.finalizeArc(arc);
                else this.points = [];
            } else {
                this.updatePromptForStep();
            }
        } else if (this.mode === 'CENTER_START_END') {
            if (this.points.length === 3) {
                const arc = this.computeSCEArc(this.points[1], this.points[0], this.points[2]);
                if (arc) this.finalizeArc(arc);
                else this.points = [];
            } else {
                this.updatePromptForStep();
            }
        } else if (this.mode === 'CENTER_START_ANGLE') {
            if (this.points.length === 3) {
                const arc = this.computeSCAArc(this.points[1], this.points[0], this.points[2]);
                if (arc) this.finalizeArc(arc);
                else this.points = [];
            } else {
                this.updatePromptForStep();
            }
        }
    }

    onValueInput(value: string): void {
        const trimmed = value.trim();
        const lang = this.getLang();

        // 1. Coordinate input: "x,y"
        const parts = trimmed.split(',').map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            this.onPointInput({ x: parts[0], y: parts[1] });
            return;
        }

        // Explicit Radius or Diameter prefixes: "R50", "D100", "Ø100", "ÇAP 100"
        const diaMatch = trimmed.match(/^(?:D|DIA|DIAMETER|ÇAP|CAP|Ø|⌀)[=\s:]*([0-9.]+)/i);
        const radMatch = trimmed.match(/^(?:R|RAD|RADIUS|YARIÇAP|YARICAP)[=\s:]*([0-9.]+)/i);
        const angMatch = trimmed.match(/^(?:A|ANG|ANGLE|AÇI|ACI)[=\s:]*([0-9.]+)/i) || trimmed.match(/^([0-9.]+)°/);

        let parsedVal: number | null = null;
        if (diaMatch) {
            parsedVal = parseFloat(diaMatch[1]) / 2; // Convert diameter to radius
        } else if (radMatch) {
            parsedVal = parseFloat(radMatch[1]);
        } else if (angMatch) {
            parsedVal = parseFloat(angMatch[1]);
        }

        // 2. Numeric scalar input (Angle, Radius, Chord length, or direct distance)
        const val = parsedVal ?? (parts.length === 1 && !isNaN(parts[0]) ? parts[0] : null);

        if (val !== null && !isNaN(val) && val > 0) {
            // Direct distance entry for first segment in 3P / CONTINUE
            if ((this.mode === '3P' || this.mode === 'CONTINUE') && this.points.length === 1 && !radMatch && !diaMatch) {
                const cur = this.currentCursor || { x: this.points[0].x + 1, y: this.points[0].y };
                const dx = cur.x - this.points[0].x;
                const dy = cur.y - this.points[0].y;
                const len = Math.hypot(dx, dy) || 1;
                this.onPointInput({
                    x: this.points[0].x + (dx / len) * val,
                    y: this.points[0].y + (dy / len) * val,
                });
                return;
            }

            // Radius input for 3P mode with 2 points placed
            if (this.mode === '3P' && this.points.length === 2 && (radMatch || diaMatch)) {
                const p1 = this.points[0];
                const p2 = this.points[1];
                const d = distance(p1, p2);
                const r = Math.max(val, d / 2 + 1e-3);
                const arc = this.computeSERArc(p1, p2, this.currentCursor, r);
                if (arc) this.finalizeArc(arc);
                return;
            }

            if ((this.mode === 'START_CENTER_ANGLE' || this.mode === 'CENTER_START_ANGLE') && this.points.length === 2) {
                const startPt = this.mode === 'START_CENTER_ANGLE' ? this.points[0] : this.points[1];
                const centerPt = this.mode === 'START_CENTER_ANGLE' ? this.points[1] : this.points[0];
                const r = distance(startPt, centerPt);
                const startAngle = Math.atan2(startPt.y - centerPt.y, startPt.x - centerPt.x);
                const sweepRad = (val * Math.PI) / 180;
                const endAngle = startAngle + sweepRad;
                this.finalizeArc({ center: centerPt, radius: r, startAngle, endAngle });
                return;
            }

            if (this.mode === 'START_CENTER_LENGTH' && this.points.length === 2) {
                const startPt = this.points[0];
                const centerPt = this.points[1];
                const r = distance(startPt, centerPt);
                const chordL = Math.min(Math.abs(val), 2 * r);
                const sweep = 2 * Math.asin(chordL / (2 * r));
                const startAngle = Math.atan2(startPt.y - centerPt.y, startPt.x - centerPt.x);
                const endAngle = startAngle + sweep;
                this.finalizeArc({ center: centerPt, radius: r, startAngle, endAngle });
                return;
            }

            if (this.mode === 'START_END_RADIUS' && this.points.length === 2) {
                const p1 = this.points[0];
                const p2 = this.points[1];
                const d = distance(p1, p2);
                const r = Math.max(Math.abs(val), d / 2 + 1e-3);
                const arc = this.computeSERArc(p1, p2, null, r);
                if (arc) this.finalizeArc(arc);
                return;
            }
        }

        this.setPrompt(t12(lang, 'Invalid input. Enter coordinates (x,y) or valid number:', 'Geçersiz giriş. Koordinat (x,y) veya geçerli bir sayı girin:'));
    }

    private finalizeArc(arc: { center: Point; radius: number; startAngle: number; endAngle: number }): void {
        const entity: CadEntity = {
            id: crypto.randomUUID(),
            layerId: useCadStore.getState().activeLayerId,
            color: '#ffffff',
            isVisible: true,
            isSelected: false,
            geometry: { type: 'ARC', ...arc }
        };

        useCadStore.getState().addEntity(entity);

        // Reset
        this.points = [];
        this.currentCursor = null;
        useCadStore.getState().setPreviewEntity(null);

        if (this.mode === 'CONTINUE') {
            this.initContinueMode();
        }

        this.updatePromptForStep();
    }

    cancel(): void {
        this.points = [];
        this.currentCursor = null;
        useCadStore.getState().setPreviewEntity(null);
        super.cancel();
    }

    // ═══════════════════════════════════════════════════════════════
    // GEOMETRIC ARCS SOLVERS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Compute 3P circumscribed arc passing through p1, p2, and p3.
     */
    public computeArc(p1: Point, p2: Point, p3: Point): { center: Point; radius: number; startAngle: number; endAngle: number } | null {
        return this.compute3PArc(p1, p2, p3);
    }

    public compute3PArc(p1: Point, p2: Point, p3: Point): { center: Point; radius: number; startAngle: number; endAngle: number } | null {
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

        const a1 = Math.atan2(p1.y - uy, p1.x - ux);
        const a2 = Math.atan2(p2.y - uy, p2.x - ux);
        const a3 = Math.atan2(p3.y - uy, p3.x - ux);

        let sweep1to2 = a2 - a1;
        while (sweep1to2 < 0) sweep1to2 += 2 * Math.PI;
        while (sweep1to2 >= 2 * Math.PI) sweep1to2 -= 2 * Math.PI;

        let sweep1to3 = a3 - a1;
        while (sweep1to3 < 0) sweep1to3 += 2 * Math.PI;
        while (sweep1to3 >= 2 * Math.PI) sweep1to3 -= 2 * Math.PI;

        let startAngle: number;
        let endAngle: number;

        if (sweep1to2 < sweep1to3) {
            startAngle = a1;
            endAngle = a3;
        } else {
            startAngle = a3;
            endAngle = a1;
        }

        return { center, radius, startAngle, endAngle };
    }

    /**
     * Start, Center, End (SCE)
     */
    public computeSCEArc(start: Point, center: Point, endPoint: Point): { center: Point; radius: number; startAngle: number; endAngle: number } | null {
        const radius = distance(center, start);
        if (radius < 1e-3) return null;

        const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
        const endAngle = Math.atan2(endPoint.y - center.y, endPoint.x - center.x);

        return { center, radius, startAngle, endAngle };
    }

    /**
     * Start, Center, Angle (SCA)
     */
    public computeSCAArc(start: Point, center: Point, cursor: Point): { center: Point; radius: number; startAngle: number; endAngle: number } | null {
        const radius = distance(center, start);
        if (radius < 1e-3) return null;

        const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
        const cursorAngle = Math.atan2(cursor.y - center.y, cursor.x - center.x);

        let sweep = cursorAngle - startAngle;
        while (sweep < 0) sweep += 2 * Math.PI;
        if (sweep < 1e-3) sweep = 2 * Math.PI;

        return { center, radius, startAngle, endAngle: startAngle + sweep };
    }

    /**
     * Start, Center, Length (SCL)
     */
    public computeSCLArc(start: Point, center: Point, cursor: Point): { center: Point; radius: number; startAngle: number; endAngle: number } | null {
        const radius = distance(center, start);
        if (radius < 1e-3) return null;

        const chordL = Math.min(distance(start, cursor), 2 * radius);
        const sweep = 2 * Math.asin(chordL / (2 * radius));
        const startAngle = Math.atan2(start.y - center.y, start.x - center.x);

        return { center, radius, startAngle, endAngle: startAngle + sweep };
    }

    /**
     * Start, End, Radius (SER)
     */
    public computeSERArc(start: Point, end: Point, cursor: Point | null, explicitRadius?: number): { center: Point; radius: number; startAngle: number; endAngle: number } | null {
        const d = distance(start, end);
        if (d < 1e-4) return null;

        const minR = d / 2;
        let radius = explicitRadius ?? Math.max(minR, cursor ? distance(midpoint(start, end), cursor) : minR * 1.5);
        if (radius < minR) radius = minR;

        const mid = midpoint(start, end);
        const h = Math.sqrt(Math.max(0, radius * radius - (d / 2) * (d / 2)));
        const dir = normalize(sub(end, start));
        const norm = perpendicular(dir);

        // Pick side based on cursor
        let side = 1;
        if (cursor) {
            const sideCheck = (cursor.x - start.x) * norm.x + (cursor.y - start.y) * norm.y;
            side = sideCheck >= 0 ? 1 : -1;
        }

        const center = add(mid, scale(norm, side * h));
        const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
        const endAngle = Math.atan2(end.y - center.y, end.x - center.x);

        return { center, radius, startAngle, endAngle };
    }

    /**
     * Start, End, Direction (SED)
     */
    public computeSEDArc(start: Point, end: Point, cursor: Point): { center: Point; radius: number; startAngle: number; endAngle: number } | null {
        const d = distance(start, end);
        if (d < 1e-4) return null;

        const tangentDir = normalize(sub(cursor, start));
        return this.computeTangentArc(start, tangentDir, end);
    }

    /**
     * Tangent Arc to Given Direction Vector
     */
    public computeTangentArc(start: Point, tangentDir: Point, end: Point): { center: Point; radius: number; startAngle: number; endAngle: number } | null {
        const d = distance(start, end);
        if (d < 1e-4) return null;

        const N = perpendicular(tangentDir);
        const mid = midpoint(start, end);
        const chordDir = sub(end, start);
        const V = perpendicular(chordDir);

        // Intersection of line (start + t*N) and (mid + u*V)
        const det = -N.x * V.y + N.y * V.x;
        if (Math.abs(det) < 1e-5) return null;

        const dx = mid.x - start.x;
        const dy = mid.y - start.y;
        const t = (-dx * V.y + dy * V.x) / det;

        const center = add(start, scale(N, t));
        const radius = distance(center, start);

        if (!Number.isFinite(radius) || radius > 50000 || radius < 1e-3) return null;

        const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
        const endAngle = Math.atan2(end.y - center.y, end.x - center.x);

        return { center, radius, startAngle, endAngle };
    }

    // ═══════════════════════════════════════════════════════════════
    // VISUAL GUIDES & HUD READOUTS
    // ═══════════════════════════════════════════════════════════════

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        if (this.points.length === 0) return;

        ctx.save();

        const sp1 = transform(this.points[0]);
        this.drawTargetMarker(ctx, sp1, '1', '#3ad0e6');

        if (this.points.length === 1 && this.currentCursor) {
            const sc = transform(this.currentCursor);
            const dist = distance(this.points[0], this.currentCursor);
            const angleDeg = ((Math.atan2(this.currentCursor.y - this.points[0].y, this.currentCursor.x - this.points[0].x) * 180) / Math.PI + 360) % 360;

            ctx.strokeStyle = 'rgba(58, 208, 230, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(sp1.x, sp1.y);
            ctx.lineTo(sc.x, sc.y);
            ctx.stroke();

            this.drawHudBadge(ctx, sc.x + 12, sc.y - 12, `L: ${dist.toFixed(1)} mm | ${angleDeg.toFixed(1)}°`);
        } else if (this.points.length === 2 && this.currentCursor) {
            const sp2 = transform(this.points[1]);
            this.drawTargetMarker(ctx, sp2, '2', '#e6b84a');

            const sc = transform(this.currentCursor);
            let arcPreview: { center: Point; radius: number; startAngle: number; endAngle: number } | null = null;

            if (this.mode === '3P') {
                arcPreview = this.compute3PArc(this.points[0], this.points[1], this.currentCursor);
            } else if (this.mode === 'START_CENTER_END') {
                arcPreview = this.computeSCEArc(this.points[0], this.points[1], this.currentCursor);
            } else if (this.mode === 'START_CENTER_ANGLE') {
                arcPreview = this.computeSCAArc(this.points[0], this.points[1], this.currentCursor);
            } else if (this.mode === 'START_CENTER_LENGTH') {
                arcPreview = this.computeSCLArc(this.points[0], this.points[1], this.currentCursor);
            } else if (this.mode === 'START_END_RADIUS') {
                arcPreview = this.computeSERArc(this.points[0], this.points[1], this.currentCursor);
            } else if (this.mode === 'START_END_DIRECTION') {
                arcPreview = this.computeSEDArc(this.points[0], this.points[1], this.currentCursor);
            } else if (this.mode === 'CENTER_START_END') {
                arcPreview = this.computeSCEArc(this.points[1], this.points[0], this.currentCursor);
            } else if (this.mode === 'CENTER_START_ANGLE') {
                arcPreview = this.computeSCAArc(this.points[1], this.points[0], this.currentCursor);
            }

            if (arcPreview) {
                const spCenter = transform(arcPreview.center);

                // Center mark (+)
                ctx.strokeStyle = '#e6b84a';
                ctx.lineWidth = 1.2;
                ctx.setLineDash([]);
                const cSize = 6;
                ctx.beginPath();
                ctx.moveTo(spCenter.x - cSize, spCenter.y);
                ctx.lineTo(spCenter.x + cSize, spCenter.y);
                ctx.moveTo(spCenter.x, spCenter.y - cSize);
                ctx.lineTo(spCenter.x, spCenter.y + cSize);
                ctx.stroke();

                // Radial leader
                ctx.strokeStyle = 'rgba(58, 208, 230, 0.3)';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 2]);
                ctx.beginPath();
                ctx.moveTo(spCenter.x, spCenter.y);
                ctx.lineTo(sc.x, sc.y);
                ctx.stroke();

                let sweep = arcPreview.endAngle - arcPreview.startAngle;
                while (sweep < 0) sweep += 2 * Math.PI;
                const sweepDeg = (sweep * 180) / Math.PI;

                this.drawHudBadge(
                    ctx,
                    sc.x + 14,
                    sc.y - 14,
                    `R: ${arcPreview.radius.toFixed(1)} mm | ∠ ${sweepDeg.toFixed(1)}°`
                );
            }
        }

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

    private drawHudBadge(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
        ctx.save();
        ctx.font = '500 10px "JetBrains Mono", monospace';
        const textWidth = ctx.measureText(text).width;
        const padX = 6;
        const boxH = 16;
        const boxW = textWidth + padX * 2;

        ctx.fillStyle = 'rgba(7, 9, 14, 0.88)';
        ctx.strokeStyle = 'rgba(58, 208, 230, 0.5)';
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
