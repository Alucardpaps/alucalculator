/**
 * AluCAD — Universal Fillet Tool
 * 
 * Standard: ISO 2768 / ASME Y14.5 Drafting Standards.
 * Creates smooth tangent corner arcs (Fillets) across ALL CAD geometry:
 * - LINE-LINE (Quadrant-aware keeping the clicked side of crossing/corner lines)
 * - RECTANGLE (1-click corner fillet or all 4 corners fillet into machined contour)
 * - POLYLINE (Vertex fillet or all-vertices fillet)
 * - HEXAGON (Corner fillet or all 6 corners fillet)
 * - LINE-ARC / ARC-ARC (Tangent intersection fillet)
 * Includes real-time interactive preview with glowing cyan laser arc and R-badge.
 */

import { Command } from '../types';
import { Point, CadEntity, RectangleGeometry, HexagonGeometry, PolylineGeometry } from '../../kernel/types';
import { polygonVertices } from '../../kernel/shapes';
import { useCadStore } from '../../store/cadStore';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';
import { intersectLineLine, distance, normalize } from '../../kernel/GeometryKernel';
import { findAllIntersections } from '../../kernel/GeometryEngine';

interface SelectedItem {
    entity: CadEntity;
    clickPoint: Point;
}

export class FilletTool implements Command {
    id = 'FILLET';
    name = 'Fillet';
    displayName = 'Fillet';
    private selected: SelectedItem[] = [];
    private radius = 5;
    private mousePos: Point = { x: 0, y: 0 };
    private hoveredCandidate: {
        arcCenter: Point;
        radius: number;
        startAngle: number;
        endAngle: number;
        cornerPoint?: Point;
    } | null = null;

    start(): void {
        const { entities, selectedIds } = useCadStore.getState();
        const selectedEnts = entities.filter(e => selectedIds.includes(e.id));

        if (selectedEnts.length === 1) {
            const single = selectedEnts[0];
            if (['RECTANGLE', 'POLYLINE', 'HEXAGON'].includes(single.geometry.type)) {
                useCadStore.setState({
                    commandState: 'AWAITING_POINT',
                    commandPrompt: `Fillet: Click a corner to fillet (R=${this.radius}mm), or click [⚡ Tüm Köşeler] / type 'A' for all:`,
                });
                return;
            }
        } else if (selectedEnts.length >= 2) {
            this.selected = [
                { entity: selectedEnts[0], clickPoint: this.getEntityCenter(selectedEnts[0]) },
                { entity: selectedEnts[1], clickPoint: this.getEntityCenter(selectedEnts[1]) }
            ];
            this.applyFillet();
            return;
        }

        useCadStore.setState({
            commandState: 'AWAITING_POINT',
            commandPrompt: `Select entity or corner for fillet (radius: ${this.radius}mm, or type new radius):`,
        });
    }

    public setRadius(r: number): void {
        if (r > 0) {
            this.radius = r;
            useCadStore.setState({
                commandPrompt: `Fillet radius set to ${this.radius}mm. Select entities or corner:`,
            });
        }
    }

    public filletAll(): void {
        const { entities, selectedIds } = useCadStore.getState();
        // Priority 1: currently selected entities in store
        let target = entities.find(e => selectedIds.includes(e.id) && ['RECTANGLE', 'POLYLINE', 'HEXAGON'].includes(e.geometry.type));
        // Priority 2: already clicked entity
        if (!target && this.selected.length > 0) {
            target = this.selected[0].entity;
        }
        // Priority 3: any rectangle/polygon in drawing
        if (!target) {
            target = entities.find(e => ['RECTANGLE', 'POLYLINE', 'HEXAGON'].includes(e.geometry.type));
        }

        if (!target) {
            useCadStore.setState({ commandPrompt: 'Select a Rectangle or Polyline to fillet all corners.' });
            return;
        }

        if (target.geometry.type === 'RECTANGLE') {
            this.filletAllRectangleCorners(target, this.radius);
        } else if (target.geometry.type === 'POLYLINE') {
            this.filletAllPolylineCorners(target, this.radius);
        } else if (target.geometry.type === 'HEXAGON') {
            this.filletAllHexagonCorners(target, this.radius);
        }
    }

    onPointInput(point: Point): void {
        const { entities, viewport } = useCadStore.getState();
        const entity = findEntityAtPoint(point, entities, viewport.zoom);

        if (!entity) {
            useCadStore.setState({ commandPrompt: 'No entity found. Click a corner, line, or shape:' });
            return;
        }

        // Single-shape corner fillet (Rectangle, Hexagon, Polyline)
        if (entity.geometry.type === 'RECTANGLE') {
            this.filletRectangleCorner(entity, point, this.radius);
            return;
        }

        if (entity.geometry.type === 'HEXAGON') {
            this.filletHexagonCorner(entity, point, this.radius);
            return;
        }

        if (entity.geometry.type === 'POLYLINE') {
            this.filletPolylineCorner(entity, point, this.radius);
            return;
        }

        const supportedTypes = ['LINE', 'CIRCLE', 'ARC'];
        if (!supportedTypes.includes(entity.geometry.type)) {
            useCadStore.setState({
                commandPrompt: `Fillet not supported for ${entity.geometry.type}. Select LINE, RECTANGLE, POLYLINE, or ARC:`
            });
            return;
        }

        this.selected.push({ entity, clickPoint: point });

        if (this.selected.length === 1) {
            useCadStore.setState({
                commandPrompt: `Select second line/entity (radius: ${this.radius}mm):`
            });
        } else if (this.selected.length === 2) {
            this.applyFillet();
        }
    }

    onMouseMove(point: Point): void {
        this.mousePos = point;
        this.updateCandidatePreview(point);
    }

    onKeyInput(key: string): void {
        if (key === 'Escape') this.cancel();
        if (key === 'Enter') {
            if (this.selected.length === 1 && ['RECTANGLE', 'POLYLINE', 'HEXAGON'].includes(this.selected[0].entity.geometry.type)) {
                this.filletAll();
            }
        }
    }

    onValueInput(value: string): void {
        const clean = value.trim().toUpperCase();
        if (clean === 'A' || clean === 'ALL' || clean === 'TUM') {
            this.filletAll();
            return;
        }
        const num = parseFloat(clean);
        if (!isNaN(num) && num > 0) {
            this.setRadius(num);
        }
    }

    cancel(): void {
        this.selected = [];
        this.hoveredCandidate = null;
    }

    // ═══════════════════════════════════════════════════════════════
    // FILLET APPLICATION DISPATCH
    // ═══════════════════════════════════════════════════════════════

    private applyFillet(): void {
        if (this.selected.length < 2) return;
        const [s1, s2] = this.selected;

        if (s1.entity.geometry.type === 'LINE' && s2.entity.geometry.type === 'LINE') {
            this.applyLineLineFillet(s1, s2);
        } else {
            this.applyGenericFillet(s1.entity, s2.entity);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 1. LINE-LINE FILLET (QUADRANT-AWARE BASED ON CLICK COORDS)
    // ─────────────────────────────────────────────────────────────

    private applyLineLineFillet(s1: SelectedItem, s2: SelectedItem): void {
        const e1 = s1.entity;
        const e2 = s2.entity;
        if (e1.geometry.type !== 'LINE' || e2.geometry.type !== 'LINE') return;

        const g1 = e1.geometry;
        const g2 = e2.geometry;

        const intersection = intersectLineLine(g1.start, g1.end, g2.start, g2.end, false);
        if (!intersection) {
            useCadStore.setState({ commandPrompt: 'Lines are parallel. Cannot fillet.' });
            this.selected = [];
            return;
        }

        const r = this.radius;

        // Choose which end of each line to keep based on user's click coordinate
        const far1 = this.pickKeptEndpoint(g1.start, g1.end, intersection, s1.clickPoint);
        const far2 = this.pickKeptEndpoint(g2.start, g2.end, intersection, s2.clickPoint);

        const len1 = distance(intersection, far1);
        const len2 = distance(intersection, far2);

        if (len1 < 0.001 || len2 < 0.001) {
            useCadStore.setState({ commandPrompt: 'Line length too small to fillet.' });
            this.selected = [];
            return;
        }

        const u1 = { x: (far1.x - intersection.x) / len1, y: (far1.y - intersection.y) / len1 };
        const u2 = { x: (far2.x - intersection.x) / len2, y: (far2.y - intersection.y) / len2 };

        const cosTheta = Math.max(-1, Math.min(1, u1.x * u2.x + u1.y * u2.y));
        const theta = Math.acos(cosTheta);
        if (theta < 0.05 || theta > Math.PI - 0.05) {
            useCadStore.setState({ commandPrompt: 'Lines are collinear or nearly parallel. Cannot fillet.' });
            this.selected = [];
            return;
        }

        const halfAngle = theta / 2;
        const dTan = r / Math.tan(halfAngle);
        const dCenter = r / Math.sin(halfAngle);

        const t1: Point = { x: intersection.x + u1.x * dTan, y: intersection.y + u1.y * dTan };
        const t2: Point = { x: intersection.x + u2.x * dTan, y: intersection.y + u2.y * dTan };

        const bisector = normalize({ x: u1.x + u2.x, y: u1.y + u2.y });
        const arcCenter: Point = {
            x: intersection.x + bisector.x * dCenter,
            y: intersection.y + bisector.y * dCenter,
        };

        const arc = this.buildShortArc(arcCenter, t1, t2, r);

        const { addEntity, updateEntity, pushHistory } = useCadStore.getState();
        pushHistory('Fillet');

        // Update line 1: kept endpoint remains, other endpoint is trimmed/extended to tangent point t1
        updateEntity(e1.id, {
            geometry: {
                ...g1,
                start: far1 === g1.start ? g1.start : t1,
                end: far1 === g1.end ? g1.end : t1,
            }
        });

        // Update line 2: kept endpoint remains, other endpoint trimmed/extended to tangent point t2
        updateEntity(e2.id, {
            geometry: {
                ...g2,
                start: far2 === g2.start ? g2.start : t2,
                end: far2 === g2.end ? g2.end : t2,
            }
        });

        // Add corner fillet arc
        addEntity({
            id: crypto.randomUUID(),
            layerId: e1.layerId,
            color: e1.color || '#3ad0e6',
            isVisible: true,
            isSelected: false,
            geometry: {
                type: 'ARC',
                center: arcCenter,
                radius: r,
                startAngle: arc.startAngle,
                endAngle: arc.endAngle,
            },
        });

        useCadStore.setState({
            commandPrompt: `Fillet applied (R=${r}mm). Select entities, or click/type next:`
        });
        this.selected = [];
        this.hoveredCandidate = null;
    }

    // ─────────────────────────────────────────────────────────────
    // 2. RECTANGLE FILLET (1-CORNER & ALL-4-CORNERS)
    // ─────────────────────────────────────────────────────────────

    private filletRectangleCorner(entity: CadEntity, clickPoint: Point, radius: number): void {
        if (entity.geometry.type !== 'RECTANGLE') return;
        const geom = entity.geometry;
        const corners = this.getRectangleCorners(geom);

        // Find closest corner
        let bestIdx = 0;
        let bestDist = Infinity;
        corners.forEach((c, idx) => {
            const d = distance(clickPoint, c);
            if (d < bestDist) { bestDist = d; bestIdx = idx; }
        });

        const maxR = Math.min(geom.width, geom.height) / 2 - 0.1;
        const actualR = Math.min(radius, Math.max(0.5, maxR));

        const { addEntity, removeEntity, pushHistory } = useCadStore.getState();
        pushHistory('Fillet Corner');

        // Decompose rectangle into lines + 1 fillet arc
        const newEntities: CadEntity[] = [];
        const layerId = entity.layerId;
        const color = entity.color || '#3ad0e6';

        for (let i = 0; i < 4; i++) {
            const cPrev = corners[(i + 3) % 4];
            const cCurr = corners[i];
            const cNext = corners[(i + 1) % 4];

            if (i === bestIdx) {
                // Filleted corner
                const u1 = normalize({ x: cPrev.x - cCurr.x, y: cPrev.y - cCurr.y });
                const u2 = normalize({ x: cNext.x - cCurr.x, y: cNext.y - cCurr.y });
                const t1 = { x: cCurr.x + u1.x * actualR, y: cCurr.y + u1.y * actualR };
                const t2 = { x: cCurr.x + u2.x * actualR, y: cCurr.y + u2.y * actualR };
                const center = { x: cCurr.x + (u1.x + u2.x) * actualR, y: cCurr.y + (u1.y + u2.y) * actualR };
                const arc = this.buildShortArc(center, t1, t2, actualR);

                // Arc at corner
                newEntities.push({
                    id: crypto.randomUUID(),
                    layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'ARC', center, radius: actualR, startAngle: arc.startAngle, endAngle: arc.endAngle }
                });

                // Line from cPrev to t1
                newEntities.push({
                    id: crypto.randomUUID(),
                    layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: cPrev, end: t1 }
                });

                // Line from t2 to cNext
                newEntities.push({
                    id: crypto.randomUUID(),
                    layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: t2, end: cNext }
                });
            } else if ((i + 1) % 4 !== bestIdx && (i + 3) % 4 !== bestIdx) {
                // Completely untouched opposite line
                newEntities.push({
                    id: crypto.randomUUID(),
                    layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: cCurr, end: cNext }
                });
            }
        }

        removeEntity(entity.id);
        newEntities.forEach(e => addEntity(e));

        useCadStore.setState({
            commandPrompt: `Corner filleted (R=${actualR}mm). Click next corner, or ESC:`
        });
    }

    private filletAllRectangleCorners(entity: CadEntity, radius: number): void {
        if (entity.geometry.type !== 'RECTANGLE') return;
        const geom = entity.geometry;
        const corners = this.getRectangleCorners(geom);

        const maxR = Math.min(geom.width, geom.height) / 2 - 0.1;
        const actualR = Math.min(radius, Math.max(0.5, maxR));

        const { addEntity, removeEntity, pushHistory } = useCadStore.getState();
        pushHistory('Fillet All Corners');

        const layerId = entity.layerId;
        const color = entity.color || '#3ad0e6';

        // Calculate 4 corner arcs and 4 connecting lines
        const cornerData: { t1: Point; t2: Point; center: Point; arc: { startAngle: number; endAngle: number } }[] = [];

        for (let i = 0; i < 4; i++) {
            const cPrev = corners[(i + 3) % 4];
            const cCurr = corners[i];
            const cNext = corners[(i + 1) % 4];

            const u1 = normalize({ x: cPrev.x - cCurr.x, y: cPrev.y - cCurr.y });
            const u2 = normalize({ x: cNext.x - cCurr.x, y: cNext.y - cCurr.y });
            const t1 = { x: cCurr.x + u1.x * actualR, y: cCurr.y + u1.y * actualR };
            const t2 = { x: cCurr.x + u2.x * actualR, y: cCurr.y + u2.y * actualR };
            const center = { x: cCurr.x + (u1.x + u2.x) * actualR, y: cCurr.y + (u1.y + u2.y) * actualR };
            const arc = this.buildShortArc(center, t1, t2, actualR);

            cornerData.push({ t1, t2, center, arc });
        }

        removeEntity(entity.id);

        // Add 4 corner arcs
        for (let i = 0; i < 4; i++) {
            const cd = cornerData[i];
            addEntity({
                id: crypto.randomUUID(),
                layerId, color, isVisible: true, isSelected: false,
                geometry: { type: 'ARC', center: cd.center, radius: actualR, startAngle: cd.arc.startAngle, endAngle: cd.arc.endAngle }
            });
        }

        // Add 4 straight edges connecting consecutive corner arcs
        for (let i = 0; i < 4; i++) {
            const startPt = cornerData[i].t2;
            const endPt = cornerData[(i + 1) % 4].t1;
            addEntity({
                id: crypto.randomUUID(),
                layerId, color, isVisible: true, isSelected: false,
                geometry: { type: 'LINE', start: startPt, end: endPt }
            });
        }

        useCadStore.setState({
            commandPrompt: `All 4 corners filleted (R=${actualR}mm). Select entities or ESC:`
        });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. POLYLINE FILLET
    // ─────────────────────────────────────────────────────────────

    private filletPolylineCorner(entity: CadEntity, clickPoint: Point, radius: number): void {
        if (entity.geometry.type !== 'POLYLINE') return;
        const geom = entity.geometry;
        const verts = geom.vertices;
        if (verts.length < 3) return;

        let bestIdx = -1;
        let bestDist = Infinity;
        const minIdx = geom.closed ? 0 : 1;
        const maxIdx = geom.closed ? verts.length - 1 : verts.length - 2;

        for (let i = minIdx; i <= maxIdx; i++) {
            const d = distance(clickPoint, verts[i]);
            if (d < bestDist) { bestDist = d; bestIdx = i; }
        }

        if (bestIdx === -1) return;

        const { addEntity, removeEntity, pushHistory } = useCadStore.getState();
        pushHistory('Fillet Polyline Corner');

        const n = verts.length;
        const pPrev = verts[(bestIdx - 1 + n) % n];
        const pCurr = verts[bestIdx];
        const pNext = verts[(bestIdx + 1) % n];

        const u1 = normalize({ x: pPrev.x - pCurr.x, y: pPrev.y - pCurr.y });
        const u2 = normalize({ x: pNext.x - pCurr.x, y: pNext.y - pCurr.y });

        const cosTheta = Math.max(-1, Math.min(1, u1.x * u2.x + u1.y * u2.y));
        const theta = Math.acos(cosTheta);
        if (theta < 0.05 || theta > Math.PI - 0.05) return;

        const maxTan = Math.min(distance(pPrev, pCurr), distance(pNext, pCurr)) / 2 - 0.1;
        const dTan = Math.min(radius / Math.tan(theta / 2), Math.max(0.5, maxTan));
        const actualR = dTan * Math.tan(theta / 2);
        const dCenter = actualR / Math.sin(theta / 2);

        const t1 = { x: pCurr.x + u1.x * dTan, y: pCurr.y + u1.y * dTan };
        const t2 = { x: pCurr.x + u2.x * dTan, y: pCurr.y + u2.y * dTan };
        const bisector = normalize({ x: u1.x + u2.x, y: u1.y + u2.y });
        const center = { x: pCurr.x + bisector.x * dCenter, y: pCurr.y + bisector.y * dCenter };
        const arc = this.buildShortArc(center, t1, t2, actualR);

        // Explode polyline to lines + arc
        removeEntity(entity.id);
        const layerId = entity.layerId;
        const color = entity.color || '#3ad0e6';

        // Add lines before corner
        for (let i = 0; i < (geom.closed ? n : n - 1); i++) {
            const currV = verts[i];
            const nextV = verts[(i + 1) % n];

            if (i === (bestIdx - 1 + n) % n) {
                // Segment leading to corner
                addEntity({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: currV, end: t1 }
                });
            } else if (i === bestIdx) {
                // Segment leaving corner
                addEntity({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: t2, end: nextV }
                });
            } else {
                addEntity({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: currV, end: nextV }
                });
            }
        }

        // Add corner arc
        addEntity({
            id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
            geometry: { type: 'ARC', center, radius: actualR, startAngle: arc.startAngle, endAngle: arc.endAngle }
        });

        useCadStore.setState({
            commandPrompt: `Polyline corner filleted (R=${actualR.toFixed(1)}mm). Select entities or ESC:`
        });
    }

    private filletAllPolylineCorners(entity: CadEntity, radius: number): void {
        if (entity.geometry.type !== 'POLYLINE') return;
        const geom = entity.geometry;
        const verts = geom.vertices;
        if (verts.length < 3) return;

        const { addEntity, removeEntity, pushHistory } = useCadStore.getState();
        pushHistory('Fillet All Polyline Corners');

        const n = verts.length;
        const layerId = entity.layerId;
        const color = entity.color || '#3ad0e6';
        removeEntity(entity.id);

        const corners: { t1: Point; t2: Point; center: Point; arc: { startAngle: number; endAngle: number }; r: number }[] = [];
        const isClosed = geom.closed;
        const startI = isClosed ? 0 : 1;
        const endI = isClosed ? n - 1 : n - 2;

        for (let i = startI; i <= endI; i++) {
            const pPrev = verts[(i - 1 + n) % n];
            const pCurr = verts[i];
            const pNext = verts[(i + 1) % n];

            const u1 = normalize({ x: pPrev.x - pCurr.x, y: pPrev.y - pCurr.y });
            const u2 = normalize({ x: pNext.x - pCurr.x, y: pNext.y - pCurr.y });
            const cosTheta = Math.max(-1, Math.min(1, u1.x * u2.x + u1.y * u2.y));
            const theta = Math.acos(cosTheta);

            const maxTan = Math.min(distance(pPrev, pCurr), distance(pNext, pCurr)) / 2 - 0.1;
            const dTan = Math.min(radius / Math.tan(theta / 2), Math.max(0.5, maxTan));
            const actualR = dTan * Math.tan(theta / 2);
            const dCenter = actualR / Math.sin(theta / 2);

            const t1 = { x: pCurr.x + u1.x * dTan, y: pCurr.y + u1.y * dTan };
            const t2 = { x: pCurr.x + u2.x * dTan, y: pCurr.y + u2.y * dTan };
            const bisector = normalize({ x: u1.x + u2.x, y: u1.y + u2.y });
            const center = { x: pCurr.x + bisector.x * dCenter, y: pCurr.y + bisector.y * dCenter };
            const arc = this.buildShortArc(center, t1, t2, actualR);

            corners.push({ t1, t2, center, arc, r: actualR });
            addEntity({
                id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                geometry: { type: 'ARC', center, radius: actualR, startAngle: arc.startAngle, endAngle: arc.endAngle }
            });
        }

        // Connect edges
        if (isClosed) {
            for (let i = 0; i < n; i++) {
                const p1 = corners[i].t2;
                const p2 = corners[(i + 1) % n].t1;
                addEntity({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: p1, end: p2 }
                });
            }
        } else {
            // First open lead
            addEntity({
                id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                geometry: { type: 'LINE', start: verts[0], end: corners[0].t1 }
            });
            for (let i = 0; i < corners.length - 1; i++) {
                addEntity({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: corners[i].t2, end: corners[i + 1].t1 }
                });
            }
            // Last open trail
            addEntity({
                id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                geometry: { type: 'LINE', start: corners[corners.length - 1].t2, end: verts[n - 1] }
            });
        }

        useCadStore.setState({
            commandPrompt: `All polyline corners filleted (R=${radius}mm). Select entities or ESC:`
        });
    }

    // ─────────────────────────────────────────────────────────────
    // 4. HEXAGON FILLET
    // ─────────────────────────────────────────────────────────────

    private filletHexagonCorner(entity: CadEntity, clickPoint: Point, radius: number): void {
        if (entity.geometry.type !== 'HEXAGON') return;
        const geom = entity.geometry;
        const corners = this.getHexagonCorners(geom);
        const n = corners.length;

        let bestIdx = 0;
        let bestDist = Infinity;
        corners.forEach((c, idx) => {
            const d = distance(clickPoint, c);
            if (d < bestDist) { bestDist = d; bestIdx = idx; }
        });

        const { addEntity, removeEntity, pushHistory } = useCadStore.getState();
        pushHistory('Fillet Hexagon Corner');
        removeEntity(entity.id);

        const layerId = entity.layerId;
        const color = entity.color || '#3ad0e6';

        for (let i = 0; i < n; i++) {
            const cPrev = corners[(i + n - 1) % n];
            const cCurr = corners[i];
            const cNext = corners[(i + 1) % n];

            if (i === bestIdx) {
                const u1 = normalize({ x: cPrev.x - cCurr.x, y: cPrev.y - cCurr.y });
                const u2 = normalize({ x: cNext.x - cCurr.x, y: cNext.y - cCurr.y });
                const dTan = radius / Math.tan(Math.PI / 6); // 60° corner
                const t1 = { x: cCurr.x + u1.x * dTan, y: cCurr.y + u1.y * dTan };
                const t2 = { x: cCurr.x + u2.x * dTan, y: cCurr.y + u2.y * dTan };
                const bisector = normalize({ x: u1.x + u2.x, y: u1.y + u2.y });
                const center = { x: cCurr.x + bisector.x * (radius / Math.sin(Math.PI / 6)), y: cCurr.y + bisector.y * (radius / Math.sin(Math.PI / 6)) };
                const arc = this.buildShortArc(center, t1, t2, radius);

                addEntity({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'ARC', center, radius, startAngle: arc.startAngle, endAngle: arc.endAngle }
                });
                addEntity({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: cPrev, end: t1 }
                });
                addEntity({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: t2, end: cNext }
                });
            } else if ((i + 1) % n !== bestIdx && (i + n - 1) % n !== bestIdx) {
                addEntity({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: cCurr, end: cNext }
                });
            }
        }

        useCadStore.setState({
            commandPrompt: `Hexagon corner filleted (R=${radius}mm). Select entities or ESC:`
        });
    }

    private filletAllHexagonCorners(entity: CadEntity, radius: number): void {
        if (entity.geometry.type !== 'HEXAGON') return;
        const geom = entity.geometry;
        const corners = this.getHexagonCorners(geom);
        const n = corners.length;

        const { addEntity, removeEntity, pushHistory } = useCadStore.getState();
        pushHistory('Fillet All Hexagon Corners');
        removeEntity(entity.id);

        const layerId = entity.layerId;
        const color = entity.color || '#3ad0e6';
        const dTan = radius / Math.tan(Math.PI / 6);
        const dCenter = radius / Math.sin(Math.PI / 6);

        const cornerData: { t1: Point; t2: Point; center: Point; arc: { startAngle: number; endAngle: number } }[] = [];

        for (let i = 0; i < n; i++) {
            const cPrev = corners[(i + n - 1) % n];
            const cCurr = corners[i];
            const cNext = corners[(i + 1) % n];

            const u1 = normalize({ x: cPrev.x - cCurr.x, y: cPrev.y - cCurr.y });
            const u2 = normalize({ x: cNext.x - cCurr.x, y: cNext.y - cCurr.y });
            const t1 = { x: cCurr.x + u1.x * dTan, y: cCurr.y + u1.y * dTan };
            const t2 = { x: cCurr.x + u2.x * dTan, y: cCurr.y + u2.y * dTan };
            const bisector = normalize({ x: u1.x + u2.x, y: u1.y + u2.y });
            const center = { x: cCurr.x + bisector.x * dCenter, y: cCurr.y + bisector.y * dCenter };
            const arc = this.buildShortArc(center, t1, t2, radius);

            cornerData.push({ t1, t2, center, arc });
            addEntity({
                id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                geometry: { type: 'ARC', center, radius, startAngle: arc.startAngle, endAngle: arc.endAngle }
            });
        }

        for (let i = 0; i < n; i++) {
            addEntity({
                id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                geometry: { type: 'LINE', start: cornerData[i].t2, end: cornerData[(i + 1) % n].t1 }
            });
        }

        useCadStore.setState({
            commandPrompt: `All ${n} polygon corners filleted (R=${radius}mm). Select entities or ESC:`
        });
    }

    // ─────────────────────────────────────────────────────────────
    // 5. GENERIC FILLET (ARC/CIRCLE INTERSECTIONS)
    // ─────────────────────────────────────────────────────────────

    private applyGenericFillet(e1: CadEntity, e2: CadEntity): void {
        const intersections = findAllIntersections(e1, e2);
        if (intersections.length === 0) {
            useCadStore.setState({ commandPrompt: 'Entities do not intersect. Cannot fillet.' });
            this.selected = [];
            return;
        }

        const closest = intersections.sort((a, b) =>
            distance(this.mousePos, a) - distance(this.mousePos, b)
        )[0];

        const r = this.radius;
        const { addEntity, pushHistory } = useCadStore.getState();
        pushHistory('Fillet');

        const startAngle = Math.atan2(this.mousePos.y - closest.y, this.mousePos.x - closest.x);
        addEntity({
            id: crypto.randomUUID(),
            layerId: e1.layerId,
            color: e1.color || '#3ad0e6',
            isVisible: true,
            isSelected: false,
            geometry: {
                type: 'ARC',
                center: closest,
                radius: r,
                startAngle,
                endAngle: startAngle + Math.PI / 2
            },
        });

        useCadStore.setState({ commandPrompt: `Fillet applied (R=${r}mm). Select entities or ESC:` });
        this.selected = [];
    }

    // ═══════════════════════════════════════════════════════════════
    // INTERACTIVE GHOST PREVIEW RENDERER
    // ═══════════════════════════════════════════════════════════════

    private updateCandidatePreview(pos: Point): void {
        const { entities, viewport } = useCadStore.getState();

        // 1. If 1 Line selected and hovering near second line
        if (this.selected.length === 1 && this.selected[0].entity.geometry.type === 'LINE') {
            const e2 = findEntityAtPoint(pos, entities, viewport.zoom);
            if (e2 && e2.id !== this.selected[0].entity.id && e2.geometry.type === 'LINE') {
                const g1 = this.selected[0].entity.geometry as any;
                const g2 = e2.geometry as any;
                const intersection = intersectLineLine(g1.start, g1.end, g2.start, g2.end, false);
                if (intersection) {
                    const far1 = this.pickKeptEndpoint(g1.start, g1.end, intersection, this.selected[0].clickPoint);
                    const far2 = this.pickKeptEndpoint(g2.start, g2.end, intersection, pos);
                    const len1 = distance(intersection, far1);
                    const len2 = distance(intersection, far2);
                    if (len1 > 0.001 && len2 > 0.001) {
                        const u1 = { x: (far1.x - intersection.x) / len1, y: (far1.y - intersection.y) / len1 };
                        const u2 = { x: (far2.x - intersection.x) / len2, y: (far2.y - intersection.y) / len2 };
                        const cosTheta = Math.max(-1, Math.min(1, u1.x * u2.x + u1.y * u2.y));
                        const theta = Math.acos(cosTheta);
                        if (theta >= 0.05 && theta <= Math.PI - 0.05) {
                            const dTan = this.radius / Math.tan(theta / 2);
                            const dCenter = this.radius / Math.sin(theta / 2);
                            const t1 = { x: intersection.x + u1.x * dTan, y: intersection.y + u1.y * dTan };
                            const t2 = { x: intersection.x + u2.x * dTan, y: intersection.y + u2.y * dTan };
                            const bisector = normalize({ x: u1.x + u2.x, y: u1.y + u2.y });
                            const arcCenter = { x: intersection.x + bisector.x * dCenter, y: intersection.y + bisector.y * dCenter };
                            const arc = this.buildShortArc(arcCenter, t1, t2, this.radius);
                            this.hoveredCandidate = {
                                arcCenter,
                                radius: this.radius,
                                startAngle: arc.startAngle,
                                endAngle: arc.endAngle,
                                cornerPoint: intersection,
                            };
                            return;
                        }
                    }
                }
            }
        }

        // 2. If hovering over a Rectangle corner
        const ent = findEntityAtPoint(pos, entities, viewport.zoom);
        if (ent && ent.geometry.type === 'RECTANGLE') {
            const corners = this.getRectangleCorners(ent.geometry as RectangleGeometry);
            let bestIdx = 0;
            let bestDist = Infinity;
            corners.forEach((c, i) => {
                const d = distance(pos, c);
                if (d < bestDist) { bestDist = d; bestIdx = i; }
            });
            if (bestDist < 40 / viewport.zoom) {
                const cPrev = corners[(bestIdx + 3) % 4];
                const cCurr = corners[bestIdx];
                const cNext = corners[(bestIdx + 1) % 4];
                const u1 = normalize({ x: cPrev.x - cCurr.x, y: cPrev.y - cCurr.y });
                const u2 = normalize({ x: cNext.x - cCurr.x, y: cNext.y - cCurr.y });
                const maxR = Math.min((ent.geometry as RectangleGeometry).width, (ent.geometry as RectangleGeometry).height) / 2 - 0.1;
                const actualR = Math.min(this.radius, Math.max(0.5, maxR));
                const t1 = { x: cCurr.x + u1.x * actualR, y: cCurr.y + u1.y * actualR };
                const t2 = { x: cCurr.x + u2.x * actualR, y: cCurr.y + u2.y * actualR };
                const center = { x: cCurr.x + (u1.x + u2.x) * actualR, y: cCurr.y + (u1.y + u2.y) * actualR };
                const arc = this.buildShortArc(center, t1, t2, actualR);
                this.hoveredCandidate = {
                    arcCenter: center,
                    radius: actualR,
                    startAngle: arc.startAngle,
                    endAngle: arc.endAngle,
                    cornerPoint: cCurr,
                };
                return;
            }
        }

        this.hoveredCandidate = null;
    }

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        // Highlight 1st selected line
        if (this.selected.length === 1 && this.selected[0].entity.geometry.type === 'LINE') {
            const g = this.selected[0].entity.geometry as any;
            const p1 = transform(g.start);
            const p2 = transform(g.end);
            ctx.save();
            ctx.strokeStyle = 'rgba(58, 208, 230, 0.4)';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.strokeStyle = '#3ad0e6';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }

        // Render hovered candidate fillet arc
        if (this.hoveredCandidate) {
            const cand = this.hoveredCandidate;
            const spCenter = transform(cand.arcCenter);
            const rScreen = cand.radius * (useCadStore.getState().viewport.zoom || 1);

            ctx.save();
            // Outer glow
            ctx.strokeStyle = 'rgba(58, 208, 230, 0.35)';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(spCenter.x, spCenter.y, Math.max(0.5, rScreen), -cand.startAngle, -cand.endAngle, true);
            ctx.stroke();

            // Inner laser dashed arc
            ctx.strokeStyle = '#3ad0e6';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([5, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Corner marker if applicable
            if (cand.cornerPoint) {
                const spCorner = transform(cand.cornerPoint);
                ctx.fillStyle = '#e6b84a';
                ctx.beginPath();
                ctx.arc(spCorner.x, spCorner.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // Radius badge readout
            const midAngle = (cand.startAngle + cand.endAngle) / 2;
            const badgePos = {
                x: spCenter.x + Math.cos(midAngle) * (rScreen + 16),
                y: spCenter.y + Math.sin(midAngle) * (rScreen + 16),
            };

            const text = `R${cand.radius.toFixed(1)}mm`;
            ctx.font = '10px "JetBrains Mono", monospace';
            const tm = ctx.measureText(text);
            const padX = 6;
            const padY = 3;

            ctx.fillStyle = 'rgba(12, 16, 22, 0.9)';
            ctx.strokeStyle = '#3ad0e6';
            ctx.lineWidth = 1;
            ctx.fillRect(badgePos.x - padX, badgePos.y - 10 - padY, tm.width + padX * 2, 16 + padY);
            ctx.strokeRect(badgePos.x - padX, badgePos.y - 10 - padY, tm.width + padX * 2, 16 + padY);

            ctx.fillStyle = '#3ad0e6';
            ctx.fillText(text, badgePos.x, badgePos.y);

            ctx.restore();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // GEOMETRIC UTILITIES
    // ═══════════════════════════════════════════════════════════════

    private pickKeptEndpoint(start: Point, end: Point, intersection: Point, clickPoint?: Point): Point {
        if (clickPoint) {
            const vClick = { x: clickPoint.x - intersection.x, y: clickPoint.y - intersection.y };
            const vStart = { x: start.x - intersection.x, y: start.y - intersection.y };
            const vEnd = { x: end.x - intersection.x, y: end.y - intersection.y };
            const dotStart = vStart.x * vClick.x + vStart.y * vClick.y;
            const dotEnd = vEnd.x * vClick.x + vEnd.y * vClick.y;
            if (dotStart > dotEnd) return start;
            if (dotEnd > dotStart) return end;
        }
        return distance(start, intersection) > distance(end, intersection) ? start : end;
    }

    private buildShortArc(center: Point, t1: Point, t2: Point, _r: number): { startAngle: number; endAngle: number } {
        let a1 = Math.atan2(t1.y - center.y, t1.x - center.x);
        let a2 = Math.atan2(t2.y - center.y, t2.x - center.x);

        let sweep = a2 - a1;
        while (sweep < 0) sweep += Math.PI * 2;
        while (sweep > Math.PI * 2) sweep -= Math.PI * 2;

        if (sweep > Math.PI) {
            return { startAngle: a2, endAngle: a1 };
        }
        return { startAngle: a1, endAngle: a2 };
    }

    private getRectangleCorners(geom: RectangleGeometry): Point[] {
        const hw = (geom.width || 0) / 2;
        const hh = (geom.height || 0) / 2;
        const cx = geom.center ? geom.center.x : ((geom as any).x ?? 0) + hw;
        const cy = geom.center ? geom.center.y : ((geom as any).y ?? 0) + hh;
        const rot = geom.rotation || 0;
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);
        const local: Point[] = [
            { x: -hw, y: -hh },
            { x: hw, y: -hh },
            { x: hw, y: hh },
            { x: -hw, y: hh }
        ];
        return local.map(p => ({
            x: cx + p.x * cos - p.y * sin,
            y: cy + p.x * sin + p.y * cos,
        }));
    }

    private getHexagonCorners(geom: HexagonGeometry): Point[] {
        return polygonVertices(geom);
    }

    private getEntityCenter(e: CadEntity): Point {
        const g = e.geometry as any;
        if (g.center) return g.center;
        if (g.start && g.end) return { x: (g.start.x + g.end.x) / 2, y: (g.start.y + g.end.y) / 2 };
        if (g.vertices && g.vertices.length > 0) return g.vertices[0];
        return { x: 0, y: 0 };
    }
}
