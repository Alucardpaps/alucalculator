/**
 * 📐 AluCAD — Multi-Method Dimension Tool (AutoCAD-grade)
 * 
 * Supports:
 *  1. SMART: Auto-detection of lines, circles, arcs, boxes or 2 clicked points.
 *  2. LINEAR: Forces strictly horizontal or vertical projected dimension.
 *  3. ALIGNED: True distance parallel to the tilted axis between two points.
 *  4. ANGULAR: Measures included angle between 3 points or intersecting entities.
 *  5. RADIAL: Radius dimension with "R..." leader text.
 *  6. DIAMETER: Diametral dimension with "⌀..." leader text.
 */

import { Command } from '../types';
import { useCadStore } from '../../store/cadStore';
import { Point, DimensionGeometry, CadEntity } from '../../kernel/types';
import { dimensionSystem } from '../../kernel/DimensionSystem';
import { distance } from '../../kernel/GeometryKernel';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';
import { DimensionMode } from '../../catalog/constructionMethods';

export class DimensionTool implements Command {
    public id: string;
    public name: string;
    public displayName: string;

    private startPoint: Point | null = null;
    private endPoint: Point | null = null;
    private apexPoint: Point | null = null; // For ANGULAR
    private currentPoint: Point | null = null;
    private tolUpper?: number;
    private tolLower?: number;

    constructor(public readonly mode: DimensionMode = 'SMART') {
        this.id = mode === 'SMART' ? 'DIMENSION'
                : mode === 'LINEAR' ? 'DIMENSION_LINEAR'
                : mode === 'ALIGNED' ? 'DIMENSION_ALIGNED'
                : mode === 'ANGULAR' ? 'DIMENSION_ANGULAR'
                : mode === 'RADIAL' ? 'DIMENSION_RADIAL'
                : 'DIMENSION_DIAMETER';
        this.name = 'DIMENSION';
        this.displayName = mode === 'SMART' ? 'Smart Dimension'
                         : mode === 'LINEAR' ? 'Linear Dimension (H/V)'
                         : mode === 'ALIGNED' ? 'Aligned Dimension'
                         : mode === 'ANGULAR' ? 'Angular Dimension'
                         : mode === 'RADIAL' ? 'Radius Dimension (R)'
                         : 'Diameter Dimension (Ø)';
    }

    start() {
        this.reset();
        const store = useCadStore.getState();

        if (this.mode === 'SMART') {
            const selected = store.entities.filter((e) => store.selectedIds.includes(e.id));
            if (selected.length === 1) {
                if (this.dimensionEntity(selected[0])) return;
            }
            useCadStore.setState({
                commandPrompt: '📐 Ölçülendirme: 1. noktayı veya şekli seçin:',
                commandState: 'AWAITING_POINT',
            });
        } else if (this.mode === 'LINEAR') {
            useCadStore.setState({
                commandPrompt: '📐 Doğrusal Ölçü (Yatay/Dikey): 1. uzantı noktasını seçin:',
                commandState: 'AWAITING_POINT',
            });
        } else if (this.mode === 'ALIGNED') {
            useCadStore.setState({
                commandPrompt: '📐 Hizalı Ölçü (Gerçek Boy): 1. noktayı seçin:',
                commandState: 'AWAITING_POINT',
            });
        } else if (this.mode === 'ANGULAR') {
            useCadStore.setState({
                commandPrompt: '📐 Açısal Ölçü: Köşe (Tepe) noktasını seçin:',
                commandState: 'AWAITING_POINT',
            });
        } else if (this.mode === 'RADIAL') {
            useCadStore.setState({
                commandPrompt: '📐 Yarıçap Ölçüsü (R): Daire veya yayı tıklayın:',
                commandState: 'AWAITING_POINT',
            });
        } else if (this.mode === 'DIAMETER') {
            useCadStore.setState({
                commandPrompt: '📐 Çap Ölçüsü (Ø): Daireyi tıklayın:',
                commandState: 'AWAITING_POINT',
            });
        }
    }

    public dimensionEntity(entity: CadEntity): boolean {
        const g = entity.geometry;
        if (g.type === 'LINE') {
            const p1 = g.start;
            const p2 = g.end;
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.hypot(dx, dy) || 1;
            const nx = -dy / dist;
            const ny = dx / dist;
            const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
            const textPoint = { x: mid.x + nx * 20, y: mid.y + ny * 20 };
            this.startPoint = p1;
            this.endPoint = p2;
            this.createDimension(textPoint, this.tolUpper, this.tolLower);
            return true;
        } else if (g.type === 'CIRCLE') {
            const isInch = useCadStore.getState().units === 'in';
            const r = g.radius;
            const p1 = { x: g.center.x - r, y: g.center.y };
            const p2 = { x: g.center.x + r, y: g.center.y };
            const textPoint = { x: g.center.x, y: g.center.y + 20 };
            this.startPoint = p1;
            this.endPoint = p2;
            const prefix = this.mode === 'RADIAL'
                ? (isInch ? `R${(r / 25.4).toFixed(3)}"` : `R${r.toFixed(2)} mm`)
                : (isInch ? `⌀${((2 * r) / 25.4).toFixed(3)}"` : `⌀${(2 * r).toFixed(2)} mm`);
            this.createDimension(textPoint, this.tolUpper, this.tolLower, prefix);
            return true;
        } else if (g.type === 'RECTANGLE') {
            const halfW = g.width / 2;
            const halfH = g.height / 2;
            const p1 = { x: g.center.x - halfW, y: g.center.y + halfH };
            const p2 = { x: g.center.x + halfW, y: g.center.y + halfH };
            const textPoint = { x: g.center.x, y: g.center.y + halfH + 20 };
            this.startPoint = p1;
            this.endPoint = p2;
            this.createDimension(textPoint, this.tolUpper, this.tolLower);
            return true;
        } else if (g.type === 'HEXAGON') {
            const isInch = useCadStore.getState().units === 'in';
            const r = g.radius;
            const p1 = { x: g.center.x - r, y: g.center.y };
            const p2 = { x: g.center.x + r, y: g.center.y };
            const textPoint = { x: g.center.x, y: g.center.y + 20 };
            this.startPoint = p1;
            this.endPoint = p2;
            const afMm = r * Math.sqrt(3);
            const prefix = isInch ? `AF ${(afMm / 25.4).toFixed(3)}"` : `AF ${afMm.toFixed(2)} mm`;
            this.createDimension(textPoint, this.tolUpper, this.tolLower, prefix);
            return true;
        } else if (g.type === 'ARC') {
            const isInch = useCadStore.getState().units === 'in';
            const r = g.radius;
            const p1 = { x: g.center.x, y: g.center.y };
            const p2 = {
                x: g.center.x + r * Math.cos(g.startAngle),
                y: g.center.y + r * Math.sin(g.startAngle),
            };
            const textPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 + 15 };
            this.startPoint = p1;
            this.endPoint = p2;
            const prefix = isInch ? `R${(r / 25.4).toFixed(3)}"` : `R${r.toFixed(2)} mm`;
            this.createDimension(textPoint, this.tolUpper, this.tolLower, prefix);
            return true;
        }
        return false;
    }

    public formatDist(valMm: number): string {
        const isInch = useCadStore.getState().units === 'in';
        if (isInch) {
            const inVal = valMm / 25.4;
            return `${inVal.toFixed(inVal < 1 ? 3 : 2)}"`;
        }
        return `${valMm.toFixed(2)} mm`;
    }

    onMouseMove(point: Point) {
        this.currentPoint = point;

        if (this.startPoint && !this.endPoint) {
            const d = distance(this.startPoint, point);
            useCadStore.setState({
                commandPrompt: `📐 Ölçü: ${this.formatDist(d)} | 2. noktaya tıklayarak yerleştirin:`,
            });
        }
    }

    onPointInput(point: Point) {
        const { entities, viewport } = useCadStore.getState();

        // 1. Check if clicked directly on an entity for RADIAL, DIAMETER or SMART
        if (!this.startPoint && (this.mode === 'SMART' || this.mode === 'RADIAL' || this.mode === 'DIAMETER')) {
            const clicked = findEntityAtPoint(point, entities, viewport.zoom);
            if (clicked) {
                if (this.dimensionEntity(clicked)) return;
            }
        }

        // 2. ANGULAR mode requires 3 points: Apex, Leg 1, Leg 2
        if (this.mode === 'ANGULAR') {
            if (!this.apexPoint) {
                this.apexPoint = point;
                useCadStore.setState({
                    commandPrompt: '📐 Açısal Ölçü: 1. kol noktasını seçin:',
                    commandPoints: [point],
                });
            } else if (!this.startPoint) {
                this.startPoint = point;
                useCadStore.setState({
                    commandPrompt: '📐 Açısal Ölçü: 2. kol noktasını seçin:',
                    commandPoints: [this.apexPoint, point],
                });
            } else {
                this.endPoint = point;
                // Calculate angle at apex
                const a1 = Math.atan2(this.startPoint.y - this.apexPoint.y, this.startPoint.x - this.apexPoint.x);
                const a2 = Math.atan2(this.endPoint.y - this.apexPoint.y, this.endPoint.x - this.apexPoint.x);
                let diffRad = Math.abs(a2 - a1);
                if (diffRad > Math.PI) diffRad = 2 * Math.PI - diffRad;
                const deg = (diffRad * 180) / Math.PI;

                const textPt = {
                    x: (this.startPoint.x + this.endPoint.x) / 2,
                    y: (this.startPoint.y + this.endPoint.y) / 2,
                };
                this.createDimension(textPt, this.tolUpper, this.tolLower, `${deg.toFixed(1)}°`);
            }
            return;
        }

        // 3. 2-Point modes: SMART, LINEAR, ALIGNED, RADIAL, DIAMETER
        if (!this.startPoint) {
            this.startPoint = point;
            useCadStore.setState({
                commandPrompt: '📐 2. ölçüm noktasını seçin (tıklayınca hemen yerleşir):',
                commandPoints: [point],
            });
        } else if (!this.endPoint) {
            this.endPoint = point;
            const p1 = this.startPoint;
            const p2 = point;

            if (this.mode === 'LINEAR') {
                const dx = Math.abs(p2.x - p1.x);
                const dy = Math.abs(p2.y - p1.y);
                if (dx >= dy) {
                    // Strictly horizontal dimension
                    const s = { x: p1.x, y: p1.y };
                    const e = { x: p2.x, y: p1.y };
                    const textPt = { x: (p1.x + p2.x) / 2, y: p1.y + 20 };
                    this.startPoint = s;
                    this.endPoint = e;
                    this.createDimension(textPt, this.tolUpper, this.tolLower, `${dx.toFixed(2)} mm`);
                } else {
                    // Strictly vertical dimension
                    const s = { x: p1.x, y: p1.y };
                    const e = { x: p1.x, y: p2.y };
                    const textPt = { x: p1.x + 20, y: (p1.y + p2.y) / 2 };
                    this.startPoint = s;
                    this.endPoint = e;
                    this.createDimension(textPt, this.tolUpper, this.tolLower, `${dy.toFixed(2)} mm`);
                }
                return;
            }

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.hypot(dx, dy) || 1;
            const nx = -dy / dist;
            const ny = dx / dist;
            const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
            const textPoint = { x: mid.x + nx * 20, y: mid.y + ny * 20 };

            let label: string | undefined;
            if (this.mode === 'RADIAL') {
                label = `R${dist.toFixed(2)} mm`;
            } else if (this.mode === 'DIAMETER') {
                label = `⌀${(2 * dist).toFixed(2)} mm`;
            }

            this.createDimension(textPoint, this.tolUpper, this.tolLower, label);
        } else {
            this.createDimension(point, this.tolUpper, this.tolLower);
        }
    }

    public placeAtDefaultOffset(): void {
        if (!this.startPoint || !this.endPoint) return;
        const p1 = this.startPoint;
        const p2 = this.endPoint;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy) || 1;
        const nx = -dy / dist;
        const ny = dx / dist;
        const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        const textPoint = { x: mid.x + nx * 25, y: mid.y + ny * 25 };
        this.createDimension(textPoint, this.tolUpper, this.tolLower);
    }

    onValueInput(value: string) {
        const trimmed = value.trim();
        if (trimmed.startsWith('±') || trimmed.startsWith('+-')) {
            const val = parseFloat(trimmed.replace('±', '').replace('+-', ''));
            if (!isNaN(val)) {
                this.tolUpper = val;
                this.tolLower = -val;
            }
            return;
        } else if (trimmed.includes(',')) {
            const parts = trimmed.split(',');
            const u = parseFloat(parts[0]);
            const l = parseFloat(parts[1]);
            if (!isNaN(u) && !isNaN(l)) {
                this.tolUpper = u;
                this.tolLower = l;
                return;
            }
        }

        // Direct distance / dimension entry: "50", "50mm", "2\"", "2.5in", "⌀50", "D50", "R25", "⌀2\""
        const isInchStore = useCadStore.getState().units === 'in';
        const isExplicitInch = /in$|"$/i.test(trimmed);
        const isExplicitMm = /mm$/i.test(trimmed);

        const cleanVal = trimmed.replace(/\s*(?:mm|in|")$/i, '');
        const diaMatch = cleanVal.match(/^(?:D|DIA|DIAMETER|ÇAP|CAP|Ø|⌀)[=\s:]*([0-9.]+)/i);
        const radMatch = cleanVal.match(/^(?:R|RAD|RADIUS|YARIÇAP|YARICAP)[=\s:]*([0-9.]+)/i);
        const numMatch = cleanVal.match(/^([0-9.]+)/);

        if (this.startPoint && !this.endPoint && (diaMatch || radMatch || numMatch)) {
            let val = 0;
            let label: string | undefined;

            let parsedScalar = 0;
            let kind: 'DIA' | 'RAD' | 'NORMAL' = 'NORMAL';

            if (diaMatch) {
                parsedScalar = parseFloat(diaMatch[1]);
                kind = 'DIA';
            } else if (radMatch) {
                parsedScalar = parseFloat(radMatch[1]);
                kind = 'RAD';
            } else if (numMatch) {
                parsedScalar = parseFloat(numMatch[1]);
                kind = this.mode === 'DIAMETER' ? 'DIA' : this.mode === 'RADIAL' ? 'RAD' : 'NORMAL';
            }

            const isInputInch = isExplicitInch || (!isExplicitMm && isInchStore);
            if (isInputInch) {
                val = parsedScalar * 25.4;
                const formattedIn = `${parsedScalar.toFixed(parsedScalar < 1 ? 3 : 2)}"`;
                label = kind === 'DIA' ? `⌀${formattedIn}` : kind === 'RAD' ? `R${formattedIn}` : formattedIn;
            } else {
                val = parsedScalar;
                const formattedMm = `${parsedScalar.toFixed(2)} mm`;
                label = kind === 'DIA' ? `⌀${formattedMm}` : kind === 'RAD' ? `R${formattedMm}` : formattedMm;
            }

            if (val > 0) {
                const cur = this.currentPoint || useCadStore.getState().cursorWorld;
                let dx = 1;
                let dy = 0;
                if (cur) {
                    const diffX = cur.x - this.startPoint.x;
                    const diffY = cur.y - this.startPoint.y;
                    const len = Math.hypot(diffX, diffY);
                    if (len > 0.001) {
                        dx = diffX / len;
                        dy = diffY / len;
                    }
                }
                const state = useCadStore.getState();
                if (state.orthoEnabled || this.mode === 'LINEAR') {
                    if (Math.abs(dx) >= Math.abs(dy)) {
                        dx = dx >= 0 ? 1 : -1;
                        dy = 0;
                    } else {
                        dx = 0;
                        dy = dy >= 0 ? 1 : -1;
                    }
                }

                const p1 = this.startPoint;
                const targetDist = kind === 'DIA' ? val / 2 : val;
                const p2 = { x: p1.x + dx * targetDist, y: p1.y + dy * targetDist };
                this.endPoint = p2;

                const nx = -dy;
                const ny = dx;
                const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
                const textPoint = { x: mid.x + nx * 20, y: mid.y + ny * 20 };
                this.createDimension(textPoint, this.tolUpper, this.tolLower, label);
            }
        }
    }

    public setTolerance(upper?: number, lower?: number): void {
        this.tolUpper = upper;
        this.tolLower = lower;
    }

    onKeyInput(key: string) {
        if (key === 'Enter') {
            this.placeAtDefaultOffset();
        } else if (key === 'Escape') {
            this.cancel();
        }
    }

    cancel() {
        useCadStore.setState({
            commandPoints: [],
            previewEntity: null,
        });
        this.reset();
    }

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point) {
        const cur = this.currentPoint || useCadStore.getState().cursorWorld;

        if (this.startPoint && !this.endPoint && cur) {
            const p1 = transform(this.startPoint);
            const p2 = transform(cur);

            ctx.save();
            ctx.strokeStyle = '#e6b84a';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Start point marker
            ctx.fillStyle = '#e85d5d';
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
            ctx.fill();

            // Distance readout
            const d = distance(this.startPoint, cur);
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            ctx.font = 'bold 10px monospace';
            ctx.fillStyle = '#0a0e14';
            const prefix = this.mode === 'RADIAL' ? `R${d.toFixed(2)} mm`
                         : this.mode === 'DIAMETER' ? `⌀${(2 * d).toFixed(2)} mm`
                         : `${d.toFixed(2)} mm`;
            const tw = ctx.measureText(prefix).width;
            ctx.fillRect(midX - tw / 2 - 4, midY - 14, tw + 8, 16);
            ctx.strokeStyle = '#e6b84a';
            ctx.strokeRect(midX - tw / 2 - 4, midY - 14, tw + 8, 16);
            ctx.fillStyle = '#e6b84a';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillText(prefix, midX, midY - 6);
            ctx.restore();
        } else if (this.startPoint && this.endPoint && cur) {
            const tempDim = dimensionSystem.createLinearDimension(
                this.startPoint,
                this.endPoint,
                cur,
                'preview-layer'
            );
            tempDim.color = '#3ad0e6';
            dimensionSystem.renderDimension(ctx, tempDim, transform, 1);
        }
    }

    private createDimension(textPoint: Point, tolUpper?: number, tolLower?: number, customText?: string) {
        if (!this.startPoint || !this.endPoint) return;

        const store = useCadStore.getState();
        store.pushHistory('Dimension');

        const entity = dimensionSystem.createLinearDimension(
            this.startPoint,
            this.endPoint,
            textPoint,
            store.activeLayerId
        );

        const dimGeom = entity.geometry as DimensionGeometry;
        if (customText) {
            dimGeom.text = customText;
        }
        if (tolUpper !== undefined || tolLower !== undefined) {
            dimGeom.tolUpper = tolUpper;
            dimGeom.tolLower = tolLower;
        }

        store.addEntity(entity);

        const d = distance(this.startPoint, this.endPoint);
        useCadStore.setState({
            commandPrompt: `✅ Ölçülendirme eklendi (${customText || this.formatDist(d)}). Sıradaki ölçüm için tıklayın:`,
            commandPoints: [],
            commandState: 'AWAITING_POINT',
        });
        this.reset();
    }

    public parseDimensionInput(input: string): number {
        const clean = input.trim();
        const storeUnits = useCadStore.getState().units;

        // Check diameter or radius prefix: e.g. Ø50, ⌀50, D50, R25, ÇAP 50
        const diaMatch = clean.match(/^(?:[Ø⌀Dd]|ÇAP|çap)\s*([0-9.]+)(.*)$/i);
        if (diaMatch) {
            const num = parseFloat(diaMatch[1]);
            if (!Number.isNaN(num)) {
                const rest = diaMatch[2].trim();
                const isExplicitIn = rest.endsWith('"') || rest.toLowerCase().endsWith('in');
                return (isExplicitIn || storeUnits === 'in') ? num * 25.4 : num;
            }
        }
        const radMatch = clean.match(/^[Rr]\s*([0-9.]+)(.*)$/i);
        if (radMatch) {
            const num = parseFloat(radMatch[1]);
            if (!Number.isNaN(num)) {
                const rest = radMatch[2].trim();
                const isExplicitIn = rest.endsWith('"') || rest.toLowerCase().endsWith('in');
                return (isExplicitIn || storeUnits === 'in') ? num * 25.4 : num;
            }
        }

        // Explicit inch input: e.g. 2", 1.5", 2in, 3.25 in
        if (clean.endsWith('"')) {
            const num = parseFloat(clean.slice(0, -1));
            return Number.isNaN(num) ? 0 : num * 25.4;
        }
        if (/^\d*\.?\d+\s*in$/i.test(clean)) {
            const num = parseFloat(clean.replace(/in$/i, '').trim());
            return Number.isNaN(num) ? 0 : num * 25.4;
        }
        // Explicit mm input: e.g. 50mm, 120 mm
        if (/^\d*\.?\d+\s*mm$/i.test(clean)) {
            const num = parseFloat(clean.replace(/mm$/i, '').trim());
            return Number.isNaN(num) ? 0 : num;
        }
        // Bare numbers: interpreted based on store units
        const num = parseFloat(clean);
        if (Number.isNaN(num)) return 0;
        if (storeUnits === 'in') {
            return num * 25.4;
        }
        return num;
    }

    private reset() {
        this.startPoint = null;
        this.endPoint = null;
        this.apexPoint = null;
        this.currentPoint = null;
    }
}
