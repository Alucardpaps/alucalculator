/**
 * AluCAD — Universal Chamfer Tool
 * 
 * Standard: ISO 2768 / ASME Y14.5 Drafting Standards.
 * Creates clean beveled angled cuts (Pah Kırma / Chamfer) across ALL CAD geometry:
 * - LINE-LINE (Quadrant-aware keeping the clicked side of crossing/corner lines)
 * - RECTANGLE (1-click corner chamfer or all 4 corners chamfer into 8-sided beveled plate)
 * - POLYLINE (Vertex chamfer or all-vertices chamfer)
 * - HEXAGON (Corner chamfer or all 6 corners chamfer)
 * Includes real-time interactive preview with glowing amber cut line and size badge.
 */

import { Command } from '../types';
import { Point, CadEntity, RectangleGeometry, HexagonGeometry, PolylineGeometry } from '../../kernel/types';
import { polygonVertices } from '../../kernel/shapes';
import { useCadStore } from '../../store/cadStore';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';
import { intersectLineLine, distance, normalize } from '../../kernel/GeometryKernel';

interface SelectedItem {
    entity: CadEntity;
    clickPoint: Point;
}

export class ChamferTool implements Command {
    id = 'CHAMFER';
    name = 'Chamfer';
    displayName = 'Chamfer';
    private selected: SelectedItem[] = [];
    private dist1 = 5;
    private dist2 = 5;
    private mousePos: Point = { x: 0, y: 0 };
    private hoveredCandidate: {
        c1: Point;
        c2: Point;
        cornerPoint?: Point;
        d1: number;
        d2: number;
    } | null = null;

    start(): void {
        const { entities, selectedIds } = useCadStore.getState();
        const selectedEnts = entities.filter(e => selectedIds.includes(e.id));

        if (selectedEnts.length === 1) {
            const single = selectedEnts[0];
            if (['RECTANGLE', 'POLYLINE', 'HEXAGON'].includes(single.geometry.type)) {
                useCadStore.setState({
                    commandState: 'AWAITING_POINT',
                    commandPrompt: `Chamfer: Click a corner to chamfer (${this.dist1}×${this.dist2}mm), or click [⚡ Tüm Köşeler] / type 'A' for all:`,
                });
                return;
            }
        } else if (selectedEnts.length >= 2) {
            this.selected = [
                { entity: selectedEnts[0], clickPoint: this.getEntityCenter(selectedEnts[0]) },
                { entity: selectedEnts[1], clickPoint: this.getEntityCenter(selectedEnts[1]) }
            ];
            this.applyChamfer();
            return;
        }

        useCadStore.setState({
            commandState: 'AWAITING_POINT',
            commandPrompt: `Select line or corner for chamfer (distances: ${this.dist1}mm, ${this.dist2}mm):`,
        });
    }

    public setDistances(d1: number, d2?: number): void {
        if (d1 > 0) {
            this.dist1 = d1;
            this.dist2 = d2 && d2 > 0 ? d2 : d1;
            useCadStore.setState({
                commandPrompt: `Chamfer distances: ${this.dist1}mm, ${this.dist2}mm. Select entities or corner:`,
            });
        }
    }

    public chamferAll(): void {
        const { entities, selectedIds } = useCadStore.getState();
        let target = entities.find(e => selectedIds.includes(e.id) && ['RECTANGLE', 'POLYLINE', 'HEXAGON'].includes(e.geometry.type));
        if (!target && this.selected.length > 0) {
            target = this.selected[0].entity;
        }
        if (!target) {
            target = entities.find(e => ['RECTANGLE', 'POLYLINE', 'HEXAGON'].includes(e.geometry.type));
        }

        if (!target) {
            useCadStore.setState({ commandPrompt: 'Select a Rectangle or Polyline to chamfer all corners.' });
            return;
        }

        if (target.geometry.type === 'RECTANGLE') {
            this.chamferAllRectangleCorners(target, this.dist1, this.dist2);
        } else if (target.geometry.type === 'POLYLINE') {
            this.chamferAllPolylineCorners(target, this.dist1, this.dist2);
        } else if (target.geometry.type === 'HEXAGON') {
            this.chamferAllHexagonCorners(target, this.dist1, this.dist2);
        }
    }

    onPointInput(point: Point): void {
        const { entities, viewport } = useCadStore.getState();
        const entity = findEntityAtPoint(point, entities, viewport.zoom);

        if (!entity) {
            useCadStore.setState({ commandPrompt: 'No entity found. Click a corner, line, or shape:' });
            return;
        }

        // Single-shape corner chamfer (Rectangle, Hexagon, Polyline)
        if (entity.geometry.type === 'RECTANGLE') {
            this.chamferRectangleCorner(entity, point, this.dist1, this.dist2);
            return;
        }

        if (entity.geometry.type === 'HEXAGON') {
            this.chamferHexagonCorner(entity, point, this.dist1, this.dist2);
            return;
        }

        if (entity.geometry.type === 'POLYLINE') {
            this.chamferPolylineCorner(entity, point, this.dist1, this.dist2);
            return;
        }

        if (entity.geometry.type !== 'LINE') {
            useCadStore.setState({
                commandPrompt: `Chamfer not supported for ${entity.geometry.type}. Select LINE, RECTANGLE, or POLYLINE:`
            });
            return;
        }

        this.selected.push({ entity, clickPoint: point });

        if (this.selected.length === 1) {
            useCadStore.setState({
                commandPrompt: `Select second line (distance: ${this.dist2}mm):`
            });
        } else if (this.selected.length === 2) {
            this.applyChamfer();
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
                this.chamferAll();
            }
        }
    }

    onValueInput(value: string): void {
        const clean = value.trim().toUpperCase();
        if (clean === 'A' || clean === 'ALL' || clean === 'TUM') {
            this.chamferAll();
            return;
        }

        const parts = value.split(',').map(s => parseFloat(s.trim()));
        if (parts.length >= 1 && !isNaN(parts[0]) && parts[0] > 0) {
            const d1 = parts[0];
            const d2 = parts.length >= 2 && !isNaN(parts[1]) ? parts[1] : d1;
            this.setDistances(d1, d2);
        }
    }

    cancel(): void {
        this.selected = [];
        this.hoveredCandidate = null;
    }

    // ═══════════════════════════════════════════════════════════════
    // CHAMFER APPLICATION DISPATCH
    // ═══════════════════════════════════════════════════════════════

    private applyChamfer(): void {
        if (this.selected.length < 2) return;
        const [s1, s2] = this.selected;

        if (s1.entity.geometry.type === 'LINE' && s2.entity.geometry.type === 'LINE') {
            this.applyLineLineChamfer(s1, s2);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 1. LINE-LINE CHAMFER (QUADRANT-AWARE BASED ON CLICK COORDS)
    // ─────────────────────────────────────────────────────────────

    private applyLineLineChamfer(s1: SelectedItem, s2: SelectedItem): void {
        const e1 = s1.entity;
        const e2 = s2.entity;
        if (e1.geometry.type !== 'LINE' || e2.geometry.type !== 'LINE') return;

        const g1 = e1.geometry;
        const g2 = e2.geometry;

        const intersection = intersectLineLine(g1.start, g1.end, g2.start, g2.end, false);
        if (!intersection) {
            useCadStore.setState({ commandPrompt: 'Lines are parallel. Cannot chamfer.' });
            this.selected = [];
            return;
        }

        // Choose which end of each line to keep based on user's click coordinate
        const far1 = this.pickKeptEndpoint(g1.start, g1.end, intersection, s1.clickPoint);
        const far2 = this.pickKeptEndpoint(g2.start, g2.end, intersection, s2.clickPoint);

        const len1 = distance(intersection, far1);
        const len2 = distance(intersection, far2);

        if (len1 < 0.001 || len2 < 0.001) {
            useCadStore.setState({ commandPrompt: 'Line length too small to chamfer.' });
            this.selected = [];
            return;
        }

        const u1 = { x: (far1.x - intersection.x) / len1, y: (far1.y - intersection.y) / len1 };
        const u2 = { x: (far2.x - intersection.x) / len2, y: (far2.y - intersection.y) / len2 };

        const c1: Point = { x: intersection.x + u1.x * this.dist1, y: intersection.y + u1.y * this.dist1 };
        const c2: Point = { x: intersection.x + u2.x * this.dist2, y: intersection.y + u2.y * this.dist2 };

        const { addEntity, updateEntity, pushHistory } = useCadStore.getState();
        pushHistory('Chamfer');

        // Update line 1: kept endpoint remains, other endpoint trimmed/extended to c1
        updateEntity(e1.id, {
            geometry: {
                ...g1,
                start: far1 === g1.start ? g1.start : c1,
                end: far1 === g1.end ? g1.end : c1,
            }
        });

        // Update line 2: kept endpoint remains, other endpoint trimmed/extended to c2
        updateEntity(e2.id, {
            geometry: {
                ...g2,
                start: far2 === g2.start ? g2.start : c2,
                end: far2 === g2.end ? g2.end : c2,
            }
        });

        // Add angled chamfer line
        addEntity({
            id: crypto.randomUUID(),
            layerId: e1.layerId,
            color: e1.color || '#e6b84a',
            isVisible: true,
            isSelected: false,
            geometry: { type: 'LINE', start: c1, end: c2 },
        });

        const label = this.dist1 === this.dist2 ? `${this.dist1}×45°` : `${this.dist1}×${this.dist2}mm`;
        useCadStore.setState({
            commandPrompt: `Chamfer applied (${label}). Select lines, or ESC:`
        });
        this.selected = [];
        this.hoveredCandidate = null;
    }

    // ─────────────────────────────────────────────────────────────
    // 2. RECTANGLE CHAMFER (1-CORNER & ALL-4-CORNERS)
    // ─────────────────────────────────────────────────────────────

    private chamferRectangleCorner(entity: CadEntity, clickPoint: Point, d1: number, d2: number): void {
        if (entity.geometry.type !== 'RECTANGLE') return;
        const geom = entity.geometry;
        const corners = this.getRectangleCorners(geom);

        let bestIdx = 0;
        let bestDist = Infinity;
        corners.forEach((c, idx) => {
            const d = distance(clickPoint, c);
            if (d < bestDist) { bestDist = d; bestIdx = idx; }
        });

        const maxD = Math.min(geom.width, geom.height) / 2 - 0.1;
        const actD1 = Math.min(d1, Math.max(0.5, maxD));
        const actD2 = Math.min(d2, Math.max(0.5, maxD));

        const { addEntity, removeEntity, pushHistory } = useCadStore.getState();
        pushHistory('Chamfer Corner');

        const newEntities: CadEntity[] = [];
        const layerId = entity.layerId;
        const color = entity.color || '#e6b84a';

        for (let i = 0; i < 4; i++) {
            const cPrev = corners[(i + 3) % 4];
            const cCurr = corners[i];
            const cNext = corners[(i + 1) % 4];

            if (i === bestIdx) {
                const u1 = normalize({ x: cPrev.x - cCurr.x, y: cPrev.y - cCurr.y });
                const u2 = normalize({ x: cNext.x - cCurr.x, y: cNext.y - cCurr.y });
                const pt1 = { x: cCurr.x + u1.x * actD1, y: cCurr.y + u1.y * actD1 };
                const pt2 = { x: cCurr.x + u2.x * actD2, y: cCurr.y + u2.y * actD2 };

                // Chamfer cut line
                newEntities.push({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: pt1, end: pt2 }
                });

                // Line leading to cut
                newEntities.push({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: cPrev, end: pt1 }
                });

                // Line leaving cut
                newEntities.push({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: pt2, end: cNext }
                });
            } else if ((i + 1) % 4 !== bestIdx && (i + 3) % 4 !== bestIdx) {
                newEntities.push({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: cCurr, end: cNext }
                });
            }
        }

        removeEntity(entity.id);
        newEntities.forEach(e => addEntity(e));

        const label = actD1 === actD2 ? `${actD1}×45°` : `${actD1}×${actD2}mm`;
        useCadStore.setState({
            commandPrompt: `Corner chamfered (${label}). Click next corner, or ESC:`
        });
    }

    private chamferAllRectangleCorners(entity: CadEntity, d1: number, d2: number): void {
        if (entity.geometry.type !== 'RECTANGLE') return;
        const geom = entity.geometry;
        const corners = this.getRectangleCorners(geom);

        const maxD = Math.min(geom.width, geom.height) / 2 - 0.1;
        const actD1 = Math.min(d1, Math.max(0.5, maxD));
        const actD2 = Math.min(d2, Math.max(0.5, maxD));

        const { addEntity, removeEntity, pushHistory } = useCadStore.getState();
        pushHistory('Chamfer All Corners');

        const layerId = entity.layerId;
        const color = entity.color || '#e6b84a';

        const cutPoints: { pt1: Point; pt2: Point }[] = [];

        for (let i = 0; i < 4; i++) {
            const cPrev = corners[(i + 3) % 4];
            const cCurr = corners[i];
            const cNext = corners[(i + 1) % 4];

            const u1 = normalize({ x: cPrev.x - cCurr.x, y: cPrev.y - cCurr.y });
            const u2 = normalize({ x: cNext.x - cCurr.x, y: cNext.y - cCurr.y });
            const pt1 = { x: cCurr.x + u1.x * actD1, y: cCurr.y + u1.y * actD1 };
            const pt2 = { x: cCurr.x + u2.x * actD2, y: cCurr.y + u2.y * actD2 };

            cutPoints.push({ pt1, pt2 });
        }

        removeEntity(entity.id);

        // Add 4 chamfer cut lines
        for (let i = 0; i < 4; i++) {
            addEntity({
                id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                geometry: { type: 'LINE', start: cutPoints[i].pt1, end: cutPoints[i].pt2 }
            });
        }

        // Add 4 connecting straight edges
        for (let i = 0; i < 4; i++) {
            addEntity({
                id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                geometry: { type: 'LINE', start: cutPoints[i].pt2, end: cutPoints[(i + 1) % 4].pt1 }
            });
        }

        const label = actD1 === actD2 ? `${actD1}×45°` : `${actD1}×${actD2}mm`;
        useCadStore.setState({
            commandPrompt: `All 4 corners chamfered (${label}). Select entities or ESC:`
        });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. POLYLINE CHAMFER
    // ─────────────────────────────────────────────────────────────

    private chamferPolylineCorner(entity: CadEntity, clickPoint: Point, d1: number, d2: number): void {
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
        pushHistory('Chamfer Polyline Corner');

        const n = verts.length;
        const pPrev = verts[(bestIdx - 1 + n) % n];
        const pCurr = verts[bestIdx];
        const pNext = verts[(bestIdx + 1) % n];

        const u1 = normalize({ x: pPrev.x - pCurr.x, y: pPrev.y - pCurr.y });
        const u2 = normalize({ x: pNext.x - pCurr.x, y: pNext.y - pCurr.y });

        const maxD1 = distance(pPrev, pCurr) / 2 - 0.1;
        const maxD2 = distance(pNext, pCurr) / 2 - 0.1;
        const actD1 = Math.min(d1, Math.max(0.5, maxD1));
        const actD2 = Math.min(d2, Math.max(0.5, maxD2));

        const pt1 = { x: pCurr.x + u1.x * actD1, y: pCurr.y + u1.y * actD1 };
        const pt2 = { x: pCurr.x + u2.x * actD2, y: pCurr.y + u2.y * actD2 };

        removeEntity(entity.id);
        const layerId = entity.layerId;
        const color = entity.color || '#e6b84a';

        for (let i = 0; i < (geom.closed ? n : n - 1); i++) {
            const currV = verts[i];
            const nextV = verts[(i + 1) % n];

            if (i === (bestIdx - 1 + n) % n) {
                addEntity({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: currV, end: pt1 }
                });
            } else if (i === bestIdx) {
                addEntity({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: pt2, end: nextV }
                });
            } else {
                addEntity({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: currV, end: nextV }
                });
            }
        }

        // Add chamfer cut line
        addEntity({
            id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
            geometry: { type: 'LINE', start: pt1, end: pt2 }
        });

        useCadStore.setState({
            commandPrompt: `Polyline corner chamfered (${actD1}×${actD2}mm). Select entities or ESC:`
        });
    }

    private chamferAllPolylineCorners(entity: CadEntity, d1: number, d2: number): void {
        if (entity.geometry.type !== 'POLYLINE') return;
        const geom = entity.geometry;
        const verts = geom.vertices;
        if (verts.length < 3) return;

        const { addEntity, removeEntity, pushHistory } = useCadStore.getState();
        pushHistory('Chamfer All Polyline Corners');

        const n = verts.length;
        const layerId = entity.layerId;
        const color = entity.color || '#e6b84a';
        removeEntity(entity.id);

        const cuts: { pt1: Point; pt2: Point }[] = [];
        const isClosed = geom.closed;
        const startI = isClosed ? 0 : 1;
        const endI = isClosed ? n - 1 : n - 2;

        for (let i = startI; i <= endI; i++) {
            const pPrev = verts[(i - 1 + n) % n];
            const pCurr = verts[i];
            const pNext = verts[(i + 1) % n];

            const u1 = normalize({ x: pPrev.x - pCurr.x, y: pPrev.y - pCurr.y });
            const u2 = normalize({ x: pNext.x - pCurr.x, y: pNext.y - pCurr.y });

            const maxD1 = distance(pPrev, pCurr) / 2 - 0.1;
            const maxD2 = distance(pNext, pCurr) / 2 - 0.1;
            const actD1 = Math.min(d1, Math.max(0.5, maxD1));
            const actD2 = Math.min(d2, Math.max(0.5, maxD2));

            const pt1 = { x: pCurr.x + u1.x * actD1, y: pCurr.y + u1.y * actD1 };
            const pt2 = { x: pCurr.x + u2.x * actD2, y: pCurr.y + u2.y * actD2 };

            cuts.push({ pt1, pt2 });
            addEntity({
                id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                geometry: { type: 'LINE', start: pt1, end: pt2 }
            });
        }

        // Connect edges
        if (isClosed) {
            for (let i = 0; i < n; i++) {
                addEntity({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: cuts[i].pt2, end: cuts[(i + 1) % n].pt1 }
                });
            }
        } else {
            addEntity({
                id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                geometry: { type: 'LINE', start: verts[0], end: cuts[0].pt1 }
            });
            for (let i = 0; i < cuts.length - 1; i++) {
                addEntity({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: cuts[i].pt2, end: cuts[i + 1].pt1 }
                });
            }
            addEntity({
                id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                geometry: { type: 'LINE', start: cuts[cuts.length - 1].pt2, end: verts[n - 1] }
            });
        }

        useCadStore.setState({
            commandPrompt: `All polyline corners chamfered (${d1}×${d2}mm). Select entities or ESC:`
        });
    }

    // ─────────────────────────────────────────────────────────────
    // 4. HEXAGON CHAMFER
    // ─────────────────────────────────────────────────────────────

    private chamferHexagonCorner(entity: CadEntity, clickPoint: Point, d1: number, d2: number): void {
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
        pushHistory('Chamfer Hexagon Corner');
        removeEntity(entity.id);

        const layerId = entity.layerId;
        const color = entity.color || '#e6b84a';

        for (let i = 0; i < n; i++) {
            const cPrev = corners[(i + n - 1) % n];
            const cCurr = corners[i];
            const cNext = corners[(i + 1) % n];

            if (i === bestIdx) {
                const u1 = normalize({ x: cPrev.x - cCurr.x, y: cPrev.y - cCurr.y });
                const u2 = normalize({ x: cNext.x - cCurr.x, y: cNext.y - cCurr.y });
                const pt1 = { x: cCurr.x + u1.x * d1, y: cCurr.y + u1.y * d1 };
                const pt2 = { x: cCurr.x + u2.x * d2, y: cCurr.y + u2.y * d2 };

                addEntity({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: pt1, end: pt2 }
                });
                addEntity({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: cPrev, end: pt1 }
                });
                addEntity({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: pt2, end: cNext }
                });
            } else if ((i + 1) % n !== bestIdx && (i + n - 1) % n !== bestIdx) {
                addEntity({
                    id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                    geometry: { type: 'LINE', start: cCurr, end: cNext }
                });
            }
        }

        useCadStore.setState({
            commandPrompt: `Hexagon corner chamfered (${d1}×${d2}mm). Select entities or ESC:`
        });
    }

    private chamferAllHexagonCorners(entity: CadEntity, d1: number, d2: number): void {
        if (entity.geometry.type !== 'HEXAGON') return;
        const geom = entity.geometry;
        const corners = this.getHexagonCorners(geom);
        const n = corners.length;

        const { addEntity, removeEntity, pushHistory } = useCadStore.getState();
        pushHistory('Chamfer All Hexagon Corners');
        removeEntity(entity.id);

        const layerId = entity.layerId;
        const color = entity.color || '#e6b84a';

        const cutPoints: { pt1: Point; pt2: Point }[] = [];

        for (let i = 0; i < n; i++) {
            const cPrev = corners[(i + n - 1) % n];
            const cCurr = corners[i];
            const cNext = corners[(i + 1) % n];

            const u1 = normalize({ x: cPrev.x - cCurr.x, y: cPrev.y - cCurr.y });
            const u2 = normalize({ x: cNext.x - cCurr.x, y: cNext.y - cCurr.y });
            const pt1 = { x: cCurr.x + u1.x * d1, y: cCurr.y + u1.y * d1 };
            const pt2 = { x: cCurr.x + u2.x * d2, y: cCurr.y + u2.y * d2 };

            cutPoints.push({ pt1, pt2 });
            addEntity({
                id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                geometry: { type: 'LINE', start: pt1, end: pt2 }
            });
        }

        for (let i = 0; i < n; i++) {
            addEntity({
                id: crypto.randomUUID(), layerId, color, isVisible: true, isSelected: false,
                geometry: { type: 'LINE', start: cutPoints[i].pt2, end: cutPoints[(i + 1) % n].pt1 }
            });
        }

        useCadStore.setState({
            commandPrompt: `All ${n} polygon corners chamfered (${d1}×${d2}mm). Select entities or ESC:`
        });
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
                        const c1: Point = { x: intersection.x + u1.x * this.dist1, y: intersection.y + u1.y * this.dist1 };
                        const c2: Point = { x: intersection.x + u2.x * this.dist2, y: intersection.y + u2.y * this.dist2 };
                        this.hoveredCandidate = {
                            c1,
                            c2,
                            cornerPoint: intersection,
                            d1: this.dist1,
                            d2: this.dist2,
                        };
                        return;
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
                const maxD = Math.min((ent.geometry as RectangleGeometry).width, (ent.geometry as RectangleGeometry).height) / 2 - 0.1;
                const actD1 = Math.min(this.dist1, Math.max(0.5, maxD));
                const actD2 = Math.min(this.dist2, Math.max(0.5, maxD));
                const c1 = { x: cCurr.x + u1.x * actD1, y: cCurr.y + u1.y * actD1 };
                const c2 = { x: cCurr.x + u2.x * actD2, y: cCurr.y + u2.y * actD2 };
                this.hoveredCandidate = {
                    c1,
                    c2,
                    cornerPoint: cCurr,
                    d1: actD1,
                    d2: actD2,
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
            ctx.strokeStyle = 'rgba(230, 184, 74, 0.4)';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.strokeStyle = '#e6b84a';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }

        // Render candidate cut line
        if (this.hoveredCandidate) {
            const cand = this.hoveredCandidate;
            const sp1 = transform(cand.c1);
            const sp2 = transform(cand.c2);

            ctx.save();
            // Outer glow
            ctx.strokeStyle = 'rgba(230, 184, 74, 0.35)';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(sp1.x, sp1.y);
            ctx.lineTo(sp2.x, sp2.y);
            ctx.stroke();

            // Inner laser dashed cut line
            ctx.strokeStyle = '#e6b84a';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([5, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Corner marker if applicable
            if (cand.cornerPoint) {
                const spCorner = transform(cand.cornerPoint);
                ctx.fillStyle = '#e85d5d';
                ctx.beginPath();
                ctx.arc(spCorner.x, spCorner.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // Measurement readout badge
            const mid = { x: (sp1.x + sp2.x) / 2, y: (sp1.y + sp2.y) / 2 };
            const badgePos = { x: mid.x + 12, y: mid.y - 12 };

            const text = cand.d1 === cand.d2 ? `${cand.d1.toFixed(1)}×45°` : `${cand.d1.toFixed(1)}×${cand.d2.toFixed(1)}mm`;
            ctx.font = '10px "JetBrains Mono", monospace';
            const tm = ctx.measureText(text);
            const padX = 6;
            const padY = 3;

            ctx.fillStyle = 'rgba(12, 16, 22, 0.9)';
            ctx.strokeStyle = '#e6b84a';
            ctx.lineWidth = 1;
            ctx.fillRect(badgePos.x - padX, badgePos.y - 10 - padY, tm.width + padX * 2, 16 + padY);
            ctx.strokeRect(badgePos.x - padX, badgePos.y - 10 - padY, tm.width + padX * 2, 16 + padY);

            ctx.fillStyle = '#e6b84a';
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
