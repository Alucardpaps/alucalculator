/**
 * AluCAD — Layered Rendering Pipeline
 * 
 * 4-layer compositing architecture for 60 FPS canvas rendering.
 * 
 * Layers (bottom to top):
 *   1. Grid Layer     — static, cached OffscreenCanvas, redrawn on zoom/pan
 *   2. Geometry Layer — entities, redrawn on entity mutations
 *   3. Overlay Layer  — snaps, dimensions, constraint icons, selection highlight
 *   4. UI Layer       — cursor crosshair, selection box, dynamic input
 * 
 * Key principles:
 *   - Mouse move → only redraw Overlay + UI (no entity repaint)
 *   - Entity change → mark Geometry dirty
 *   - Pan/zoom → mark Grid + Geometry dirty
 *   - Never trigger React re-renders from mouse movement
 */

import type { Point, Viewport, CadEntity, SnapResult as SnapIndicator } from '../kernel/types';
import { SpatialIndex } from '../geometry/SpatialIndex';
import { worldToScreen, calculateGridSpacing } from '../kernel/CoordinateSystem';

// ============================================
// TYPES
// ============================================

export interface RenderLayerConfig {
    id: string;
    order: number;
    /** If true, uses OffscreenCanvas for caching (only redrawn when dirty) */
    cached: boolean;
}

export interface RenderContext {
    viewport: Viewport;
    zoom: number;
    entities: CadEntity[];
    entityMap: Map<string, CadEntity>;
    selectedIds: Set<string>;
    spatialIndex: SpatialIndex;
    /** World → screen transform */
    worldToScreen: (p: Point) => Point;
    /** Screen → world transform */
    screenToWorld: (p: Point) => Point;
}

// ============================================
// RENDER LAYER BASE
// ============================================

abstract class RenderLayer {
    readonly id: string;
    readonly order: number;
    protected dirty = true;
    protected canvas: OffscreenCanvas | null = null;

    constructor(config: RenderLayerConfig) {
        this.id = config.id;
        this.order = config.order;
        if (config.cached && typeof OffscreenCanvas !== 'undefined') {
            this.canvas = new OffscreenCanvas(1, 1);
        }
    }

    markDirty(): void {
        this.dirty = true;
    }

    resize(width: number, height: number): void {
        if (this.canvas) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
        this.dirty = true;
    }

    /**
     * Render to the compositing target.
     * If cached, renders to internal OffscreenCanvas first, then composites.
     */
    renderTo(targetCtx: CanvasRenderingContext2D, ctx: RenderContext): void {
        if (this.canvas && !this.dirty) {
            // Use cached bitmap
            targetCtx.drawImage(this.canvas, 0, 0);
            return;
        }

        if (this.canvas) {
            const offCtx = this.canvas.getContext('2d');
            if (offCtx) {
                offCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.draw(offCtx as unknown as CanvasRenderingContext2D, ctx);
                targetCtx.drawImage(this.canvas, 0, 0);
            }
        } else {
            this.draw(targetCtx, ctx);
        }

        this.dirty = false;
    }

    /** Subclass implements actual drawing logic */
    abstract draw(ctx: CanvasRenderingContext2D, renderCtx: RenderContext): void;
}

// ============================================
// GRID LAYER
// ============================================

class GridLayer extends RenderLayer {
    constructor() {
        super({ id: 'grid', order: 0, cached: true });
    }

    draw(ctx: CanvasRenderingContext2D, renderCtx: RenderContext): void {
        const { viewport } = renderCtx;
        const { width, height, zoom, center } = viewport;

        const gridSpacing = calculateGridSpacing(zoom);
        const screenGridSize = gridSpacing * zoom;

        // Calculate visible world bounds
        const halfW = width / (2 * zoom);
        const halfH = height / (2 * zoom);
        const startX = Math.floor((center.x - halfW) / gridSpacing) * gridSpacing;
        const startY = Math.floor((center.y - halfH) / gridSpacing) * gridSpacing;
        const endX = Math.ceil((center.x + halfW) / gridSpacing) * gridSpacing;
        const endY = Math.ceil((center.y + halfH) / gridSpacing) * gridSpacing;

        // Minor grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();

        for (let x = startX; x <= endX; x += gridSpacing) {
            const sx = renderCtx.worldToScreen({ x, y: 0 }).x;
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, height);
        }
        for (let y = startY; y <= endY; y += gridSpacing) {
            const sy = renderCtx.worldToScreen({ x: 0, y }).y;
            ctx.moveTo(0, sy);
            ctx.lineTo(width, sy);
        }
        ctx.stroke();

        // Major grid (every 5 minor lines)
        const majorSpacing = gridSpacing * 5;
        const majorStartX = Math.floor((center.x - halfW) / majorSpacing) * majorSpacing;
        const majorStartY = Math.floor((center.y - halfH) / majorSpacing) * majorSpacing;
        const majorEndX = Math.ceil((center.x + halfW) / majorSpacing) * majorSpacing;
        const majorEndY = Math.ceil((center.y + halfH) / majorSpacing) * majorSpacing;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();

        for (let x = majorStartX; x <= majorEndX; x += majorSpacing) {
            const sx = renderCtx.worldToScreen({ x, y: 0 }).x;
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, height);
        }
        for (let y = majorStartY; y <= majorEndY; y += majorSpacing) {
            const sy = renderCtx.worldToScreen({ x: 0, y }).y;
            ctx.moveTo(0, sy);
            ctx.lineTo(width, sy);
        }
        ctx.stroke();

        // Origin axes
        const originScreen = renderCtx.worldToScreen({ x: 0, y: 0 });

        // X axis (red)
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, originScreen.y);
        ctx.lineTo(width, originScreen.y);
        ctx.stroke();

        // Y axis (green)
        ctx.strokeStyle = 'rgba(50, 255, 50, 0.4)';
        ctx.beginPath();
        ctx.moveTo(originScreen.x, 0);
        ctx.lineTo(originScreen.x, height);
        ctx.stroke();
    }
}

// ============================================
// GEOMETRY LAYER
// ============================================

class GeometryLayer extends RenderLayer {
    constructor() {
        super({ id: 'geometry', order: 1, cached: true });
    }

    draw(ctx: CanvasRenderingContext2D, renderCtx: RenderContext): void {
        const { viewport, entities, selectedIds, worldToScreen } = renderCtx;
        const zoom = viewport.zoom;

        // Viewport culling via spatial index
        const halfW = viewport.width / (2 * zoom);
        const halfH = viewport.height / (2 * zoom);
        const viewBBox = {
            minX: viewport.center.x - halfW,
            minY: viewport.center.y - halfH,
            maxX: viewport.center.x + halfW,
            maxY: viewport.center.y + halfH,
        };

        const visibleIds = renderCtx.spatialIndex.queryBBox(viewBBox);

        // Batch rendering by type for performance
        const normalLineWidth = Math.max(1, 1.5 / zoom * zoom); // Zoom-normalized

        for (const id of visibleIds) {
            const entity = renderCtx.entityMap.get(id);
            if (!entity || !entity.isVisible) continue;
            if (entity.geometry.type === 'DIMENSION') continue;

            const isSelected = selectedIds.has(entity.id);
            const color = isSelected ? '#00e5ff' : (entity.color || '#ffffff');

            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = isSelected ? 2 : 1;

            const g = entity.geometry;

            switch (g.type) {
                case 'LINE': {
                    const p1 = worldToScreen(g.start);
                    const p2 = worldToScreen(g.end);
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                    break;
                }

                case 'CIRCLE': {
                    const c = worldToScreen(g.center);
                    const r = g.radius * zoom;
                    ctx.beginPath();
                    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                }

                case 'ARC': {
                    const c = worldToScreen(g.center);
                    const r = g.radius * zoom;
                    ctx.beginPath();
                    // Screen Y is inverted, so world CCW is screen CCW if we invert angles
                    ctx.arc(c.x, c.y, r, -g.startAngle, -g.endAngle, true);
                    ctx.stroke();
                    break;
                }

                case 'POLYLINE': {
                    if (g.vertices.length < 2) break;
                    ctx.beginPath();
                    const first = worldToScreen(g.vertices[0]);
                    ctx.moveTo(first.x, first.y);
                    for (let i = 1; i < g.vertices.length; i++) {
                        const p = worldToScreen(g.vertices[i]);
                        ctx.lineTo(p.x, p.y);
                    }
                    if (g.closed) ctx.closePath();
                    ctx.stroke();
                    break;
                }

                case 'POINT': {
                    const p = worldToScreen({ x: g.x, y: g.y });
                    const crossSize = 4;
                    ctx.beginPath();
                    ctx.moveTo(p.x - crossSize, p.y);
                    ctx.lineTo(p.x + crossSize, p.y);
                    ctx.moveTo(p.x, p.y - crossSize);
                    ctx.lineTo(p.x, p.y + crossSize);
                    ctx.stroke();
                    break;
                }

                case 'RECTANGLE': {
                    const gRect = g as any;
                    const c = worldToScreen(gRect.center);
                    const rw = gRect.width * zoom;
                    const rh = gRect.height * zoom;
                    ctx.save();
                    ctx.translate(c.x, c.y);
                    if (gRect.rotation) ctx.rotate(gRect.rotation);
                    ctx.strokeRect(-rw / 2, -rh / 2, rw, rh);
                    ctx.restore();
                    break;
                }

                case 'HEXAGON': {
                    const gHex = g as any;
                    const c = worldToScreen(gHex.center);
                    const r = gHex.radius * zoom;
                    ctx.save();
                    ctx.translate(c.x, c.y);
                    if (gHex.rotation) ctx.rotate(gHex.rotation);
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const angle = (Math.PI / 3) * i;
                        const px = r * Math.cos(angle);
                        const py = r * Math.sin(angle);
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.stroke();
                    ctx.restore();
                    break;
                }

                // DIMENSION rendered in overlay layer
                default:
                    break;
            }

            // Render Modifiers (Holes, Welds, Milling)
            if (entity.modifiers && entity.modifiers.length > 0) {
                for (const mod of entity.modifiers) {
                    // For visualization, assume hole positions are absolute if x,y are given, else fallback to center 
                    // Actually, if drawing from center of entity context, we can derive a bounding center 
                    let cx = 0, cy = 0;
                    if (mod.x !== undefined && mod.y !== undefined) {
                        const p = worldToScreen({ x: mod.x, y: mod.y });
                        cx = p.x; cy = p.y;
                    } else if (g.type === 'RECTANGLE' || g.type === 'HEXAGON' || g.type === 'CIRCLE') {
                        const c = worldToScreen((g as any).center);
                        cx = c.x; cy = c.y;
                    }

                    if (mod.type === 'HOLE' || mod.type === 'THREADED') {
                        const hr = ((mod.diameter || 10) / 2) * zoom;
                        ctx.strokeStyle = mod.type === 'THREADED' ? '#f59e0b' : '#3b82f6';
                        ctx.beginPath();
                        ctx.arc(cx, cy, hr, 0, Math.PI * 2);
                        ctx.stroke();
                        // Crosshair for hole
                        ctx.lineWidth = 0.5;
                        ctx.setLineDash([5, 5]);
                        ctx.beginPath();
                        ctx.moveTo(cx - hr - 5, cy); ctx.lineTo(cx + hr + 5, cy);
                        ctx.moveTo(cx, cy - hr - 5); ctx.lineTo(cx, cy + hr + 5);
                        ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.lineWidth = isSelected ? 2 : 1;
                    } else if (mod.type === 'WELDED') {
                         ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
                         ctx.strokeStyle = '#ef4444';
                         const wr = (mod.weldSize || 5) * zoom;
                         ctx.beginPath();
                         // Draw triangle to denote weld fillet
                         ctx.moveTo(cx, cy - wr);
                         ctx.lineTo(cx + wr, cy + wr);
                         ctx.lineTo(cx - wr, cy + wr);
                         ctx.closePath();
                         ctx.fill();
                         ctx.stroke();
                    } else if (mod.type === 'SURFACE_MILLED') {
                         ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
                         ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
                         const mw = 30 * zoom; 
                         ctx.fillRect(cx - mw/2, cy - mw/2, mw, mw);
                         ctx.strokeRect(cx - mw/2, cy - mw/2, mw, mw);
                         ctx.beginPath(); ctx.moveTo(cx - mw/2, cy - mw/2); ctx.lineTo(cx + mw/2, cy + mw/2); ctx.stroke();
                         ctx.beginPath(); ctx.moveTo(cx + mw/2, cy - mw/2); ctx.lineTo(cx - mw/2, cy + mw/2); ctx.stroke();
                    }
                }
            }
        }
    }
}

// ============================================
// OVERLAY LAYER
// ============================================

export interface OverlayState {
    snapIndicator: SnapIndicator | null;
    selectionBox: { start: Point; end: Point } | null;
    constraintGlyphs: Array<{ position: Point; type: string; entityIds: string[] }>;
    sketchState: 'under-defined' | 'fully-defined' | 'over-defined';
    previewEntity: CadEntity | null;
}

class OverlayLayer extends RenderLayer {
    overlayState: OverlayState = {
        snapIndicator: null,
        selectionBox: null,
        constraintGlyphs: [],
        sketchState: 'under-defined',
        previewEntity: null,
    };

    constructor() {
        // Never cached — redrawn every frame
        super({ id: 'overlay', order: 2, cached: false });
    }

    draw(ctx: CanvasRenderingContext2D, renderCtx: RenderContext): void {
        const { worldToScreen, viewport, entities } = renderCtx;

        // --- Preview Entity ---
        if (this.overlayState.previewEntity) {
            const ent = this.overlayState.previewEntity;
            const g = ent.geometry;
            ctx.strokeStyle = '#ffff00'; // Preview yellow
            ctx.fillStyle = ctx.strokeStyle;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 3]);

            switch (g.type) {
                case 'LINE': {
                    const p1 = worldToScreen((g as any).start);
                    const p2 = worldToScreen((g as any).end);
                    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                    break;
                }
                case 'CIRCLE': {
                    const c = worldToScreen((g as any).center);
                    const r = (g as any).radius * viewport.zoom;
                    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
                    break;
                }
                case 'ARC': {
                    const c = worldToScreen((g as any).center);
                    const r = (g as any).radius * viewport.zoom;
                    ctx.beginPath(); ctx.arc(c.x, c.y, r, (g as any).startAngle, (g as any).endAngle); ctx.stroke();
                    break;
                }
            }
            ctx.setLineDash([]);
        }

        // --- Dimension entities ---
        for (const entity of entities) {
            if (!entity.isVisible || entity.geometry.type !== 'DIMENSION') continue;

            const g = entity.geometry as any;
            if (!g.start || !g.end) continue;

            const p1 = worldToScreen(g.start);
            const p2 = worldToScreen(g.end);

            const isSelected = renderCtx.selectedIds.has(entity.id);
            const dimColor = isSelected ? '#00e5ff' : '#ffcc00';
            ctx.strokeStyle = dimColor;
            ctx.fillStyle = dimColor;
            ctx.lineWidth = 1;

            // Calculate offset direction
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 1) continue;

            const nx = -dy / dist;
            const ny = dx / dist;
            const offset = 30; // pixels

            const p1Ext = { x: p1.x + nx * offset, y: p1.y + ny * offset };
            const p2Ext = { x: p2.x + nx * offset, y: p2.y + ny * offset };

            // Extension lines
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p1Ext.x, p1Ext.y);
            ctx.moveTo(p2.x, p2.y);
            ctx.lineTo(p2Ext.x, p2Ext.y);
            ctx.strokeStyle = dimColor;
            ctx.globalAlpha = 0.6;
            ctx.stroke();

            // Dimension line
            ctx.beginPath();
            ctx.moveTo(p1Ext.x, p1Ext.y);
            ctx.lineTo(p2Ext.x, p2Ext.y);
            ctx.globalAlpha = 1.0;
            ctx.stroke();

            // Arrowheads
            const arrowSize = 8;
            const angle = Math.atan2(p2Ext.y - p1Ext.y, p2Ext.x - p1Ext.x);

            const drawArrow = (px: number, py: number, ang: number) => {
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px + arrowSize * Math.cos(ang + 0.5), py + arrowSize * Math.sin(ang + 0.5));
                ctx.lineTo(px + arrowSize * Math.cos(ang - 0.5), py + arrowSize * Math.sin(ang - 0.5));
                ctx.closePath();
                ctx.fill();
            };

            drawArrow(p1Ext.x, p1Ext.y, angle);
            drawArrow(p2Ext.x, p2Ext.y, angle + Math.PI);

            // Value text
            const text = g.text || (g.value ? g.value.toFixed(2) : (dist / viewport.zoom).toFixed(2));
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Text Background
            const textWidth = ctx.measureText(text).width;
            ctx.fillStyle = '#080c12';
            ctx.fillRect((p1Ext.x + p2Ext.x) / 2 - textWidth / 2 - 2, (p1Ext.y + p2Ext.y) / 2 - 7, textWidth + 4, 14);

            ctx.fillStyle = dimColor;
            ctx.fillText(text, (p1Ext.x + p2Ext.x) / 2, (p1Ext.y + p2Ext.y) / 2);
        }

        // --- Snap indicator ---
        if (this.overlayState.snapIndicator) {
            const sp = worldToScreen(this.overlayState.snapIndicator.point);
            const size = 6;

            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 1.5;

            switch (this.overlayState.snapIndicator.mode) {
                case 'END':
                    ctx.strokeRect(sp.x - size, sp.y - size, size * 2, size * 2);
                    break;
                case 'MID':
                    ctx.beginPath();
                    ctx.moveTo(sp.x, sp.y - size);
                    ctx.lineTo(sp.x + size, sp.y + size);
                    ctx.lineTo(sp.x - size, sp.y + size);
                    ctx.closePath();
                    ctx.stroke();
                    break;
                case 'CEN':
                    ctx.beginPath();
                    ctx.arc(sp.x, sp.y, size, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                case 'INT':
                    ctx.beginPath();
                    ctx.moveTo(sp.x - size, sp.y - size);
                    ctx.lineTo(sp.x + size, sp.y + size);
                    ctx.moveTo(sp.x + size, sp.y - size);
                    ctx.lineTo(sp.x - size, sp.y + size);
                    ctx.stroke();
                    break;
                case 'PER':
                    ctx.beginPath();
                    ctx.moveTo(sp.x - size, sp.y);
                    ctx.lineTo(sp.x, sp.y);
                    ctx.lineTo(sp.x, sp.y - size);
                    ctx.stroke();
                    break;
                default:
                    ctx.beginPath();
                    ctx.moveTo(sp.x, sp.y - size);
                    ctx.lineTo(sp.x + size, sp.y);
                    ctx.lineTo(sp.x, sp.y + size);
                    ctx.lineTo(sp.x - size, sp.y);
                    ctx.closePath();
                    ctx.stroke();
            }
        }

        // --- Selection box ---
        if (this.overlayState.selectionBox) {
            const { start, end } = this.overlayState.selectionBox;
            const s1 = worldToScreen(start);
            const s2 = worldToScreen(end);
            const x = Math.min(s1.x, s2.x);
            const y = Math.min(s1.y, s2.y);
            const w = Math.abs(s2.x - s1.x);
            const h = Math.abs(s2.y - s1.y);

            const isWindow = s2.x >= s1.x;
            ctx.strokeStyle = isWindow ? 'rgba(0, 120, 255, 0.8)' : 'rgba(0, 255, 120, 0.8)';
            ctx.fillStyle = isWindow ? 'rgba(0, 120, 255, 0.1)' : 'rgba(0, 255, 120, 0.1)';
            ctx.lineWidth = 1;

            if (!isWindow) {
                ctx.setLineDash([4, 3]);
            }

            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);
            ctx.setLineDash([]);
        }

        // --- Constraint glyphs ---
        for (const glyph of this.overlayState.constraintGlyphs) {
            const sp = worldToScreen(glyph.position);
            const type = glyph.type.toUpperCase();
            const size = 6;

            const isGeo = ['HORIZONTAL', 'VERTICAL', 'PARALLEL', 'PERPENDICULAR', 'TANGENT', 'FIXED'].includes(type);
            ctx.fillStyle = isGeo ? '#3b82f6' : '#f59e0b';
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = 1.5;

            switch (type) {
                case 'HORIZONTAL':
                    ctx.beginPath();
                    ctx.moveTo(sp.x - size, sp.y + size + 4);
                    ctx.lineTo(sp.x + size, sp.y + size + 4);
                    ctx.stroke();
                    break;
                case 'VERTICAL':
                    ctx.beginPath();
                    ctx.moveTo(sp.x + size + 4, sp.y - size);
                    ctx.lineTo(sp.x + size + 4, sp.y + size);
                    ctx.stroke();
                    break;
                case 'COINCIDENT':
                    ctx.beginPath();
                    ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                case 'PARALLEL':
                    ctx.beginPath();
                    ctx.moveTo(sp.x + size + 4, sp.y - 5);
                    ctx.lineTo(sp.x + size + 4, sp.y + 5);
                    ctx.moveTo(sp.x + size + 7, sp.y - 5);
                    ctx.lineTo(sp.x + size + 7, sp.y + 5);
                    ctx.stroke();
                    break;
                case 'PERPENDICULAR':
                    ctx.beginPath();
                    ctx.moveTo(sp.x + size + 4, sp.y - 5);
                    ctx.lineTo(sp.x + size + 4, sp.y + 5);
                    ctx.lineTo(sp.x + size + 12, sp.y + 5);
                    ctx.stroke();
                    break;
                case 'FIXED':
                    ctx.beginPath();
                    ctx.moveTo(sp.x, sp.y + size + 4);
                    ctx.lineTo(sp.x - 4, sp.y + size + 10);
                    ctx.lineTo(sp.x + 4, sp.y + size + 10);
                    ctx.closePath();
                    ctx.fill();
                    break;
                case 'DISTANCE':
                case 'RADIUS':
                case 'DIAMETER':
                case 'ANGLE':
                    ctx.font = '10px monospace';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    const label = type === 'DIAMETER' ? '⌀' : type === 'RADIUS' ? 'R' : '';
                    const suffix = type === 'ANGLE' ? '°' : '';
                    const val = (glyph as any).value !== undefined ? (glyph as any).value.toFixed(1) : '';
                    ctx.fillText(`${label}${val}${suffix}`, sp.x + size + 8, sp.y);
                    break;
                default:
                    ctx.font = '10px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(type[0], sp.x, sp.y);
            }
        }
    }
}

// ============================================
// UI INTERACTION LAYER
// ============================================

export interface UIState {
    cursorWorld: Point | null;
    crosshairEnabled: boolean;
    dynamicInputText: string | null;
    dynamicInputPosition: Point | null;
}

class UIInteractionLayer extends RenderLayer {
    uiState: UIState = {
        cursorWorld: null,
        crosshairEnabled: true,
        dynamicInputText: null,
        dynamicInputPosition: null,
    };

    constructor() {
        // Never cached — redrawn every frame
        super({ id: 'ui', order: 3, cached: false });
    }

    draw(ctx: CanvasRenderingContext2D, renderCtx: RenderContext): void {
        const { worldToScreen, viewport } = renderCtx;

        // --- Cursor crosshair ---
        if (this.uiState.cursorWorld && this.uiState.crosshairEnabled) {
            const sp = worldToScreen(this.uiState.cursorWorld);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 0.5;
            ctx.setLineDash([2, 4]);
            ctx.beginPath();
            ctx.moveTo(sp.x, 0);
            ctx.lineTo(sp.x, viewport.height);
            ctx.moveTo(0, sp.y);
            ctx.lineTo(viewport.width, sp.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // --- Dynamic coordinate input ---
        if (this.uiState.dynamicInputText && this.uiState.cursorWorld) {
            const sp = worldToScreen(this.uiState.cursorWorld);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            const textWidth = ctx.measureText(this.uiState.dynamicInputText).width;
            ctx.fillRect(sp.x + 15, sp.y - 10, textWidth + 12, 20);
            ctx.fillStyle = '#00e5ff';
            ctx.font = '11px monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.uiState.dynamicInputText, sp.x + 21, sp.y);
        }
    }
}

// ============================================
// RENDER PIPELINE (Orchestrator)
// ============================================

export class RenderPipeline {
    private layers: RenderLayer[];
    private gridLayer: GridLayer;
    private geometryLayer: GeometryLayer;
    private overlayLayer: OverlayLayer;
    private uiLayer: UIInteractionLayer;

    private animFrameId: number | null = null;
    private running = false;

    private targetCanvas: HTMLCanvasElement | null = null;
    private targetCtx: CanvasRenderingContext2D | null = null;

    private renderContext: RenderContext | null = null;

    constructor() {
        this.gridLayer = new GridLayer();
        this.geometryLayer = new GeometryLayer();
        this.overlayLayer = new OverlayLayer();
        this.uiLayer = new UIInteractionLayer();

        this.layers = [
            this.gridLayer,
            this.geometryLayer,
            this.overlayLayer,
            this.uiLayer,
        ].sort((a, b) => a.order - b.order);
    }

    // -------------------------------------------
    // LIFECYCLE
    // -------------------------------------------

    attach(canvas: HTMLCanvasElement): void {
        this.targetCanvas = canvas;
        this.targetCtx = canvas.getContext('2d');
        this.resize(canvas.width, canvas.height);
    }

    detach(): void {
        this.stopLoop();
        this.targetCanvas = null;
        this.targetCtx = null;
    }

    resize(width: number, height: number): void {
        this.layers.forEach(l => l.resize(width, height));
    }

    // -------------------------------------------
    // RENDER LOOP
    // -------------------------------------------

    startLoop(): void {
        if (this.running) return;
        this.running = true;
        this.tick();
    }

    stopLoop(): void {
        this.running = false;
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }

    private tick = (): void => {
        if (!this.running) return;
        this.compose();
        this.animFrameId = requestAnimationFrame(this.tick);
    };

    private compose(): void {
        if (!this.targetCtx || !this.renderContext || !this.targetCanvas) return;

        const { width, height } = this.targetCanvas;
        this.targetCtx.clearRect(0, 0, width, height);

        for (const layer of this.layers) {
            layer.renderTo(this.targetCtx, this.renderContext);
        }
    }

    // -------------------------------------------
    // STATE UPDATES (called from outside)
    // -------------------------------------------

    setRenderContext(ctx: RenderContext): void {
        this.renderContext = ctx;
    }

    /** Call when viewport changes (pan/zoom) */
    onViewportChanged(): void {
        this.gridLayer.markDirty();
        this.geometryLayer.markDirty();
    }

    /** Call when entities change (add/remove/modify) */
    onEntitiesChanged(): void {
        this.geometryLayer.markDirty();
    }

    /** Update snap indicator (called on mouse move) */
    setSnapIndicator(snap: SnapIndicator | null): void {
        this.overlayLayer.overlayState.snapIndicator = snap;
    }

    /** Update selection box (called during drag-select) */
    setSelectionBox(box: { start: Point; end: Point } | null): void {
        this.overlayLayer.overlayState.selectionBox = box;
    }

    /** Update cursor position (called on mouse move) */
    setCursorWorld(point: Point | null): void {
        this.uiLayer.uiState.cursorWorld = point;
    }

    /** Update constraint glyph positions */
    setConstraintGlyphs(glyphs: OverlayState['constraintGlyphs']): void {
        this.overlayLayer.overlayState.constraintGlyphs = glyphs;
    }

    /** Update sketch definition state */
    setSketchState(state: OverlayState['sketchState']): void {
        this.overlayLayer.overlayState.sketchState = state;
    }

    /** Update dynamic coordinate input */
    setDynamicInput(text: string | null): void {
        this.uiLayer.uiState.dynamicInputText = text;
    }

    /** Update preview entity (shown while drawing) */
    setPreviewEntity(entity: CadEntity | null): void {
        this.overlayLayer.overlayState.previewEntity = entity;
    }

    /** Force full redraw of all layers */
    forceFullRedraw(): void {
        this.layers.forEach(l => l.markDirty());
    }
}
