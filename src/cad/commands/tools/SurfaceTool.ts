/**
 * 🧱 AluCAD — ISO 1302 / DIN EN ISO 1302 Surface Finish & Leader Tool
 * 
 * Complies with AGENTS.md:
 * - Industrial Instrument visual tokens (#3ad0e6 electric cyan, #e7edf4 text, JetBrains Mono)
 * - Exact ISO 1302:2002 geometry with apex and 60-degree vectors
 * - Dual modes:
 *   1. LEADER (Default): Arrowhead at surface -> landing shoulder -> ISO 1302 symbol
 *   2. DIRECT: Single-click placement on face or drawing sheet
 * - Direct distance/scalar value typing (e.g. "1.6", "0.8", "Ra 3.2")
 * - Seamless grouping so symbol + leader can be moved/selected together.
 * 
 * Standards Cited:
 * - ISO 1302:2002 (Geometrical Product Specifications - Indication of surface texture)
 * - DIN EN ISO 1302 (Oberflächenbeschaffenheit in der technischen Produktdokumentation)
 * - ASME Y14.36M-1996 (Surface Texture Symbols)
 */

import { BaseCommand } from '../BaseCommand';
import {
    Point,
    CadEntity,
    createLineEntity,
} from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import {
    SurfaceSymbolType,
    SurfaceLayDirection,
    createIso1302SurfaceTextureEntities
} from '../../blocks/SurfaceFinishGenerator';

export type SurfaceToolPlacementMode = 'LEADER' | 'DIRECT';

export interface SurfaceToolPreset {
    param?: 'Ra' | 'Rz' | 'Rmax' | 'Rq';
    value?: string;
    symbolType?: SurfaceSymbolType;
    lay?: SurfaceLayDirection;
    method?: string;
}

export interface SurfaceLineCandidate {
    entityId?: string;
    segmentStart: Point;
    segmentEnd: Point;
    snapPoint: Point;
    tangentAngle: number;
    normalAngle: number;
    normalVector: Point;
    distanceToLine: number;
    rotationRad: number;
}

export class SurfaceTool extends BaseCommand {
    public id = 'SURFACE';
    public name = 'SURFACE';
    public displayName = 'Surface Finish (ISO 1302)';

    private mode: SurfaceToolPlacementMode = 'LEADER';
    private roughnessParam: 'Ra' | 'Rz' | 'Rmax' | 'Rq' = 'Ra';
    private roughnessValue = '3.2';
    private symbolType: SurfaceSymbolType = 'machining_required';
    private layDirection: SurfaceLayDirection = 'none';
    private method = '';
    private allAround = false;

    private startPoint: Point | null = null;
    private currentPoint: Point | null = null;

    constructor(
        initialMode: SurfaceToolPlacementMode = 'LEADER',
        preset?: SurfaceToolPreset
    ) {
        super();
        this.mode = initialMode;
        if (preset) {
            if (preset.param) this.roughnessParam = preset.param;
            if (preset.value) this.roughnessValue = preset.value;
            if (preset.symbolType) this.symbolType = preset.symbolType;
            if (preset.lay) this.layDirection = preset.lay;
            if (preset.method) this.method = preset.method;
        }
    }

    start(): void {
        this.startPoint = null;
        this.currentPoint = null;
        this.updatePrompt();
    }

    public setMode(mode: SurfaceToolPlacementMode): void {
        this.mode = mode;
        this.startPoint = null;
        this.updatePrompt();
    }

    public getMode(): SurfaceToolPlacementMode {
        return this.mode;
    }

    public setRoughness(param: 'Ra' | 'Rz' | 'Rmax' | 'Rq', val: string): void {
        this.roughnessParam = param;
        this.roughnessValue = val.trim();
        this.updatePrompt();
    }

    public setSymbolType(type: SurfaceSymbolType): void {
        this.symbolType = type;
        this.updatePrompt();
    }

    public setMethod(method: string): void {
        this.method = method;
    }

    public setLayDirection(lay: SurfaceLayDirection): void {
        this.layDirection = lay;
    }

    public setAllAround(allAround: boolean): void {
        this.allAround = allAround;
    }

    private updatePrompt(): void {
        const spec = `${this.roughnessParam} ${this.roughnessValue} μm`;
        if (this.mode === 'LEADER') {
            if (!this.startPoint) {
                this.setPrompt(`📌 Yüzey İşareti Lideri [${spec}]: Ok ucu için yüzey/kenar seçin (tıklayın) [L: Mod, R: Parametre]:`);
            } else {
                this.setPrompt(`📌 Yüzey İşareti [${spec}]: İniş / sembol konumunu seçin:`);
            }
        } else {
            this.setPrompt(`🎯 Yüzey İşareti Doğrudan Yerleşim [${spec}]: Yüzey çizgisi seçin / tıklayın [L: Lider Modu]:`);
        }
    }

    /**
     * Searches for the closest linear edge or segment in the CAD canvas to determine surface orientation.
     */
    public findLineCandidate(point: Point): SurfaceLineCandidate | null {
        const store = useCadStore.getState();
        const entities = store.entities;
        const selectedIds = store.selectedIds;
        const zoom = store.viewport?.zoom || 1;
        const tolerance = Math.max(25, 40 / zoom);

        let bestCandidate: SurfaceLineCandidate | null = null;
        let minEffectiveDist = Infinity;

        const processSegment = (p1: Point, p2: Point, entityId: string, isSelected: boolean) => {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const l2 = dx * dx + dy * dy;
            if (l2 < 0.0001) return;

            // Project point onto segment
            let t = ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / l2;
            t = Math.max(0, Math.min(1, t));

            const snapPoint: Point = {
                x: p1.x + t * dx,
                y: p1.y + t * dy
            };

            const dist = Math.hypot(point.x - snapPoint.x, point.y - snapPoint.y);
            const maxTol = isSelected ? tolerance * 4 : tolerance;
            if (dist > maxTol) return;

            const effectiveDist = isSelected ? dist * 0.25 : dist;
            if (effectiveDist >= minEffectiveDist) return;

            const len = Math.sqrt(l2);
            const ux = dx / len;
            const uy = dy / len;
            const tangentAngle = Math.atan2(uy, ux);

            // Two normal vector choices:
            // n1 = (-uy, ux) (+90 deg)
            // n2 = (uy, -ux) (-90 deg)
            const n1: Point = { x: -uy, y: ux };
            const n2: Point = { x: uy, y: -ux };

            const wx = point.x - snapPoint.x;
            const wy = point.y - snapPoint.y;
            const dot1 = wx * n1.x + wy * n1.y;

            let normalVector: Point;
            if (Math.abs(wx) < 0.0001 && Math.abs(wy) < 0.0001) {
                normalVector = n1;
            } else {
                normalVector = dot1 >= 0 ? n1 : n2;
            }

            const normalAngle = Math.atan2(normalVector.y, normalVector.x);
            let rotationRad = normalAngle - Math.PI / 2;

            while (rotationRad > Math.PI) rotationRad -= 2 * Math.PI;
            while (rotationRad < -Math.PI) rotationRad += 2 * Math.PI;

            minEffectiveDist = effectiveDist;
            bestCandidate = {
                entityId,
                segmentStart: p1,
                segmentEnd: p2,
                snapPoint,
                tangentAngle,
                normalAngle,
                normalVector,
                distanceToLine: dist,
                rotationRad
            };
        };

        // 1. Check selected entities first with priority
        if (selectedIds && selectedIds.length > 0) {
            for (const id of selectedIds) {
                const ent = entities.find(e => e.id === id);
                if (!ent || !ent.isVisible) continue;
                this.extractSegments(ent, (p1, p2) => processSegment(p1, p2, ent.id, true));
            }
        }

        // 2. Check all other visible entities
        for (const ent of entities) {
            if (!ent.isVisible) continue;
            if (selectedIds.includes(ent.id)) continue;
            this.extractSegments(ent, (p1, p2) => processSegment(p1, p2, ent.id, false));
        }

        return bestCandidate;
    }

    private extractSegments(entity: CadEntity, callback: (p1: Point, p2: Point) => void): void {
        const g = entity.geometry;
        if (g.type === 'LINE') {
            callback(g.start, g.end);
        } else if (g.type === 'RECTANGLE') {
            const rect = g as any;
            const hw = rect.width / 2;
            const hh = rect.height / 2;
            const cx = rect.center.x;
            const cy = rect.center.y;
            const c0 = { x: cx - hw, y: cy - hh };
            const c1 = { x: cx + hw, y: cy - hh };
            const c2 = { x: cx + hw, y: cy + hh };
            const c3 = { x: cx - hw, y: cy + hh };
            callback(c0, c1);
            callback(c1, c2);
            callback(c2, c3);
            callback(c3, c0);
        } else if (g.type === 'POLYLINE') {
            const poly = g as any;
            if (poly.vertices && poly.vertices.length >= 2) {
                for (let i = 0; i < poly.vertices.length - 1; i++) {
                    callback(poly.vertices[i], poly.vertices[i + 1]);
                }
                if (poly.closed) {
                    callback(poly.vertices[poly.vertices.length - 1], poly.vertices[0]);
                }
            }
        } else if (g.type === 'HEXAGON') {
            const hex = g as any;
            const verts: Point[] = [];
            for (let i = 0; i < 6; i++) {
                const ang = (Math.PI / 3) * i + (hex.rotation || 0);
                verts.push({
                    x: hex.center.x + hex.radius * Math.cos(ang),
                    y: hex.center.y + hex.radius * Math.sin(ang)
                });
            }
            for (let i = 0; i < 6; i++) {
                callback(verts[i], verts[(i + 1) % 6]);
            }
        }
    }

    public placeNow(): void {
        const store = useCadStore.getState();
        let cur = this.currentPoint;
        if (!cur && store.selectedIds && store.selectedIds.length > 0) {
            const selEnt = store.entities.find(e => store.selectedIds.includes(e.id));
            if (selEnt && selEnt.geometry.type === 'LINE') {
                cur = {
                    x: (selEnt.geometry.start.x + selEnt.geometry.end.x) / 2,
                    y: (selEnt.geometry.start.y + selEnt.geometry.end.y) / 2
                };
            }
        }
        if (!cur) {
            cur = store.cursorWorld || store.viewport?.center || { x: 0, y: 0 };
        }

        if (this.mode === 'LEADER') {
            if (!this.startPoint) {
                const cand = this.findLineCandidate(cur);
                if (cand) {
                    this.startPoint = cand.snapPoint;
                    const offsetLen = 25;
                    const endPt: Point = {
                        x: cand.snapPoint.x + cand.normalVector.x * offsetLen,
                        y: cand.snapPoint.y + cand.normalVector.y * offsetLen
                    };
                    this.onPointInput(endPt);
                    return;
                } else {
                    this.startPoint = { x: cur.x - 25, y: cur.y - 20 };
                }
            }
            this.onPointInput(cur);
        } else {
            // DIRECT MODE: zero leader protrusion! Snaps directly to line if present
            const cand = this.findLineCandidate(cur);
            if (cand) {
                this.onPointInput(cand.snapPoint);
            } else {
                this.onPointInput(cur);
            }
        }
    }

    onMouseMove(point: Point): void {
        this.currentPoint = point;
    }

    onPointInput(point: Point): void {
        const store = useCadStore.getState();
        const layerId = store.activeLayerId;
        const activeLayer = store.layers.find(l => l.id === layerId);
        const color = activeLayer?.color || '#3ad0e6';
        const groupId = `grp_surf_${crypto.randomUUID().slice(0, 8)}`;

        if (this.mode === 'DIRECT') {
            store.pushHistory(`Surface Finish ${this.roughnessParam} ${this.roughnessValue}`);
            const cand = this.findLineCandidate(point);
            let entities: CadEntity[];
            if (cand) {
                entities = this.buildTransformedEntities(cand.snapPoint, cand.rotationRad, layerId, color, groupId);
            } else {
                entities = this.buildTransformedEntities(point, 0, layerId, color, groupId);
            }
            store.addEntities(entities);

            this.updatePrompt();
            this.setPrompt(`✅ Yüzey işareti (${this.roughnessParam} ${this.roughnessValue}) doğrudan yerleştirildi. Yeni yerleşim için tıklayın (ESC ile çıkış):`);
            return;
        }

        // LEADER MODE
        if (!this.startPoint) {
            const cand = this.findLineCandidate(point);
            this.startPoint = cand ? cand.snapPoint : point;
            this.updatePrompt();
        } else {
            store.pushHistory(`Surface Finish Leader ${this.roughnessParam} ${this.roughnessValue}`);

            const pStart = this.startPoint;
            const pEnd = point;
            const isRight = pEnd.x >= pStart.x;
            const shoulderLen = 14;
            const shoulderEnd: Point = {
                x: pEnd.x + (isRight ? shoulderLen : -shoulderLen),
                y: pEnd.y
            };

            const createdEntities: CadEntity[] = [];

            // 1. Leader stem line: pStart -> pEnd
            const stemLine = createLineEntity(pStart, pEnd, layerId, color);
            stemLine.groupId = groupId;
            createdEntities.push(stemLine);

            // 2. Horizontal landing shoulder: pEnd -> shoulderEnd
            const shoulderLine = createLineEntity(pEnd, shoulderEnd, layerId, color);
            shoulderLine.groupId = groupId;
            createdEntities.push(shoulderLine);

            // 3. Arrowhead at pStart pointing towards pStart
            const angle = Math.atan2(pStart.y - pEnd.y, pStart.x - pEnd.x);
            const arrowLen = 3.5;
            const arrowWing1: Point = {
                x: pStart.x - arrowLen * Math.cos(angle - Math.PI / 6),
                y: pStart.y - arrowLen * Math.sin(angle - Math.PI / 6)
            };
            const arrowWing2: Point = {
                x: pStart.x - arrowLen * Math.cos(angle + Math.PI / 6),
                y: pStart.y - arrowLen * Math.sin(angle + Math.PI / 6)
            };
            const w1 = createLineEntity(pStart, arrowWing1, layerId, color);
            const w2 = createLineEntity(pStart, arrowWing2, layerId, color);
            const barb = createLineEntity(arrowWing1, arrowWing2, layerId, color);
            w1.groupId = groupId;
            w2.groupId = groupId;
            barb.groupId = groupId;
            createdEntities.push(w1, w2, barb);

            // 4. ISO 1302 Surface Symbol geometry placed at shoulderEnd
            const symbolOrigin: Point = isRight
                ? { x: shoulderEnd.x - 2.0, y: shoulderEnd.y }
                : { x: shoulderEnd.x + 2.0, y: shoulderEnd.y };

            const symbolEntities = this.buildTransformedEntities(symbolOrigin, 0, layerId, color, groupId);
            createdEntities.push(...symbolEntities);

            store.addEntities(createdEntities);

            this.startPoint = null;
            this.currentPoint = null;
            this.updatePrompt();
            this.setPrompt(`✅ Lider yüzey işareti eklendi (${this.roughnessParam} ${this.roughnessValue}). Yeni ok ucu için tıklayın (ESC ile çıkış):`);
        }
    }

    public buildTransformedEntities(
        origin: Point,
        rotationRad: number = 0,
        layerId: string,
        color: string,
        groupId: string
    ): CadEntity[] {
        const rawEntities = createIso1302SurfaceTextureEntities({
            symbolType: this.symbolType,
            allAround: this.allAround,
            roughnessParameter: this.roughnessParam,
            roughnessValue: this.roughnessValue,
            manufacturingMethod: this.method,
            layDirection: this.layDirection,
            layerId,
            symbolColor: color,
            textColor: '#e7edf4'
        });

        const cos = Math.cos(rotationRad);
        const sin = Math.sin(rotationRad);

        const rotateAndTranslate = (p: Point): Point => ({
            x: origin.x + (p.x * cos - p.y * sin),
            y: origin.y + (p.x * sin + p.y * cos)
        });

        return rawEntities.map(ent => {
            const copy: CadEntity = { ...ent, id: crypto.randomUUID(), groupId };
            const g = ent.geometry;

            if (g.type === 'LINE') {
                copy.geometry = {
                    ...g,
                    start: rotateAndTranslate(g.start),
                    end: rotateAndTranslate(g.end)
                };
            } else if (g.type === 'CIRCLE') {
                copy.geometry = {
                    ...g,
                    center: rotateAndTranslate(g.center)
                };
            } else if (g.type === 'TEXT') {
                copy.geometry = {
                    ...g,
                    position: rotateAndTranslate(g.position),
                    rotation: rotationRad
                };
            }
            return copy;
        });
    }

    private buildTranslatedEntities(origin: Point, layerId: string, color: string, groupId: string): CadEntity[] {
        return this.buildTransformedEntities(origin, 0, layerId, color, groupId);
    }

    onValueInput(value: string): void {
        const trimmed = value.trim();
        if (!trimmed) {
            this.placeNow();
            return;
        }

        // Coordinate check: x,y
        const parts = trimmed.split(',');
        if (parts.length === 2) {
            const x = parseFloat(parts[0]);
            const y = parseFloat(parts[1]);
            if (!isNaN(x) && !isNaN(y)) {
                this.onPointInput({ x, y });
                return;
            }
        }

        // Mode toggling
        const upper = trimmed.toUpperCase();
        if (upper === 'L' || upper === 'LEAD' || upper === 'LEADER') {
            this.setMode('LEADER');
            return;
        }
        if (upper === 'D' || upper === 'DIR' || upper === 'DIRECT') {
            this.setMode('DIRECT');
            return;
        }
        if (upper === 'R' || upper === 'PARAM') {
            const nextParam = this.roughnessParam === 'Ra' ? 'Rz' : this.roughnessParam === 'Rz' ? 'Rmax' : 'Ra';
            this.setRoughness(nextParam, this.roughnessValue);
            return;
        }

        // Parameter + Value: e.g. "Ra 1.6", "Rz 6.3", "1.6"
        const match = trimmed.match(/^(RA|RZ|RMAX|RQ)?\s*([0-9]+(?:\.[0-9]+)?)$/i);
        if (match) {
            let p: 'Ra' | 'Rz' | 'Rmax' | 'Rq' = this.roughnessParam;
            if (match[1]) {
                const u = match[1].toUpperCase();
                p = u === 'RA' ? 'Ra' : u === 'RZ' ? 'Rz' : u === 'RMAX' ? 'Rmax' : 'Rq';
            }
            const v = match[2];
            this.setRoughness(p, v);
            return;
        }

        // Otherwise treat as roughness value directly
        const num = parseFloat(trimmed);
        if (!isNaN(num) && num > 0) {
            this.setRoughness(this.roughnessParam, String(num));
        }
    }

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        const cur = this.currentPoint || useCadStore.getState().cursorWorld;
        if (!cur) return;

        ctx.save();

        if (this.mode === 'LEADER') {
            if (this.startPoint) {
                const pStart = transform(this.startPoint);
                const pEnd = transform(cur);
                const isRight = pEnd.x >= pStart.x;
                const shoulderPx = 22;
                const pShoulderEnd = {
                    x: pEnd.x + (isRight ? shoulderPx : -shoulderPx),
                    y: pEnd.y
                };

                // 1. Leader Line
                ctx.strokeStyle = '#3ad0e6';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(pStart.x, pStart.y);
                ctx.lineTo(pEnd.x, pEnd.y);
                ctx.lineTo(pShoulderEnd.x, pShoulderEnd.y);
                ctx.stroke();

                // 2. Arrowhead at pStart pointing to pStart
                const angle = Math.atan2(pStart.y - pEnd.y, pStart.x - pEnd.x);
                const arrowLen = 12;
                ctx.fillStyle = '#3ad0e6';
                ctx.beginPath();
                ctx.moveTo(pStart.x, pStart.y);
                ctx.lineTo(
                    pStart.x - arrowLen * Math.cos(angle - Math.PI / 6),
                    pStart.y - arrowLen * Math.sin(angle - Math.PI / 6)
                );
                ctx.lineTo(
                    pStart.x - arrowLen * Math.cos(angle + Math.PI / 6),
                    pStart.y - arrowLen * Math.sin(angle + Math.PI / 6)
                );
                ctx.closePath();
                ctx.fill();

                // 3. Render ISO 1302 Surface Symbol preview sitting on shoulder
                const symApex = isRight
                    ? { x: pShoulderEnd.x - 4, y: pShoulderEnd.y }
                    : { x: pShoulderEnd.x + 4, y: pShoulderEnd.y };

                this.renderSymbolGraphic(ctx, symApex, 1.0, 0);
            } else {
                // Subtle ghost preview on cursor before clicking start point
                const cand = this.findLineCandidate(cur);
                if (cand) {
                    const p1 = transform(cand.segmentStart);
                    const p2 = transform(cand.segmentEnd);
                    ctx.strokeStyle = '#e6b84a';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();

                    const pSnap = transform(cand.snapPoint);
                    ctx.fillStyle = '#3dd68c';
                    ctx.beginPath();
                    ctx.arc(pSnap.x, pSnap.y, 4, 0, Math.PI * 2);
                    ctx.fill();

                    this.renderSymbolGraphic(ctx, pSnap, 0.95, cand.rotationRad);
                } else {
                    const pCur = transform(cur);
                    ctx.globalAlpha = 0.55;
                    this.renderSymbolGraphic(ctx, pCur, 0.9, 0);
                }
            }
        } else {
            // DIRECT MODE: zero leader protrusion! Snaps directly to line if present
            const cand = this.findLineCandidate(cur);
            if (cand) {
                // 1. Highlight line segment in laser amber
                const p1 = transform(cand.segmentStart);
                const p2 = transform(cand.segmentEnd);
                ctx.strokeStyle = '#e6b84a';
                ctx.lineWidth = 2.5;
                ctx.setLineDash([6, 3]);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
                ctx.setLineDash([]);

                // 2. Snap contact point
                const pSnap = transform(cand.snapPoint);
                ctx.fillStyle = '#3dd68c';
                ctx.beginPath();
                ctx.arc(pSnap.x, pSnap.y, 4.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#07090c';
                ctx.lineWidth = 1;
                ctx.stroke();

                // 3. Ghost symbol oriented strictly to the surface normal
                ctx.globalAlpha = 0.95;
                this.renderSymbolGraphic(ctx, pSnap, 1.0, cand.rotationRad);
            } else {
                const pCur = transform(cur);
                ctx.globalAlpha = 0.85;
                this.renderSymbolGraphic(ctx, pCur, 1.0, 0);
            }
        }

        ctx.restore();
    }

    private renderSymbolGraphic(ctx: CanvasRenderingContext2D, apex: Point, scale = 1.0, rotationRad = 0): void {
        const s = scale * 1.8; // Screen preview factor

        ctx.save();
        ctx.translate(apex.x, apex.y);
        ctx.rotate(-rotationRad); // Canvas screen Y is inverted

        const pShort = { x: -2.0 * s, y: -3.464 * s };
        const pLong = { x: 4.0 * s, y: -6.928 * s };

        ctx.strokeStyle = '#3ad0e6';
        ctx.lineWidth = 1.75;
        ctx.beginPath();
        // Short leg
        ctx.moveTo(pShort.x, pShort.y);
        ctx.lineTo(0, 0);
        // Long leg
        ctx.lineTo(pLong.x, pLong.y);

        // Bar / Overbar
        if (this.symbolType === 'machining_required') {
            ctx.moveTo(pShort.x, pShort.y);
            ctx.lineTo(2.0 * s, pShort.y);
        }

        // Shelf line
        const shelfW = Math.max(24, (this.roughnessValue.length + 4) * 8 * scale);
        ctx.moveTo(pLong.x, pLong.y);
        ctx.lineTo(pLong.x + shelfW, pLong.y);
        ctx.stroke();

        // Inscribed circle for prohibited
        if (this.symbolType === 'machining_prohibited') {
            ctx.beginPath();
            ctx.arc(0, -2.309 * s, 1.155 * s, 0, Math.PI * 2);
            ctx.stroke();
        }

        // All-Around circle
        if (this.allAround) {
            ctx.beginPath();
            ctx.arc(0, 0, 1.25 * s, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Roughness label
        const labelText = `${this.roughnessParam} ${this.roughnessValue}`;
        ctx.font = 'bold 11px "JetBrains Mono", monospace';

        // Badge background for clarity
        const tw = ctx.measureText(labelText).width;
        ctx.fillStyle = 'rgba(12, 16, 22, 0.85)';
        ctx.fillRect(pLong.x + 2, pLong.y - 15, tw + 6, 13);
        ctx.fillStyle = '#3ad0e6';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(labelText, pLong.x + 4, pLong.y - 3);

        ctx.restore();
    }

    cancel(): void {
        this.startPoint = null;
        this.currentPoint = null;
        super.cancel();
    }
}
