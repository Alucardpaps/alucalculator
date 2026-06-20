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
                    const gPoly = g as any;
                    const c = worldToScreen(gPoly.center);
                    const r = gPoly.radius * viewport.zoom;
                    const sides = gPoly.sides || 6;
                    const rotation = gPoly.rotation || 0;
                    ctx.beginPath();
                    for (let i = 0; i < sides; i++) {
                        const angle = rotation + (Math.PI * 2 / sides) * i;
                        const px = c.x + r * Math.cos(angle);
                        const py = c.y + r * Math.sin(angle);
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.stroke();
                    break;
                }

                case 'GEAR': {
                    const gGear = g as any;
                    const c = worldToScreen(gGear.center);
                    const vertices = RenderPipeline.computeGearVertices(gGear);
                    RenderPipeline.strokeVertices(ctx, vertices, worldToScreen);

                    // Pitch circle (reference)
                    const rPitch = (gGear.module * gGear.teeth) / 2 * zoom;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.arc(c.x, c.y, rPitch, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                    break;
                }

                case 'FASTENER': {
                    const gFast = g as any;
                    RenderPipeline.drawFastener(ctx, gFast, worldToScreen, zoom);
                    break;
                }

                case 'BELT_PULLEY': {
                    const gBelt = g as any;
                    RenderPipeline.drawBeltPulley(ctx, gBelt, worldToScreen, zoom);
                    break;
                }

                case 'PLANETARY_GEAR': {
                    const gPlan = g as any;
                    RenderPipeline.drawPlanetaryGear(ctx, gPlan, worldToScreen, zoom);
                    break;
                }

                case 'TEXT': {
                    const gText = g as any;
                    const pos = worldToScreen(gText.position);
                    const fontSize = Math.max(8, gText.fontSize * zoom);
                    const fontWeight = gText.bold ? 'bold' : 'normal';
                    const fontStyle = gText.italic ? 'italic' : 'normal';
                    ctx.save();
                    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${gText.fontFamily || 'Arial'}`;
                    ctx.fillStyle = color;
                    ctx.textAlign = gText.justification || 'left';
                    ctx.textBaseline = 'top';

                    if (gText.rotation) {
                        ctx.translate(pos.x, pos.y);
                        ctx.rotate(-gText.rotation);
                        ctx.fillText(gText.content, 0, 0);
                    } else {
                        ctx.fillText(gText.content, pos.x, pos.y);
                    }
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

        // --- DRAW GRIPS FOR SELECTED ENTITIES ---
        if (isSelected) {
            this.drawGrips(ctx, entity, worldToScreen, zoom);
        }
        }
    }

    private drawGrips(ctx: CanvasRenderingContext2D, entity: CadEntity, worldToScreen: (p: Point) => Point, zoom: number) {
        const g = entity.geometry;
        const gripSize = 3; // Screen pixels half-size
        const gripColor = '#3b82f6'; // Professional Blue
        
        let points: Point[] = [];

        switch (g.type) {
            case 'LINE':
                points = [g.start, g.end];
                break;
            case 'CIRCLE':
            case 'ARC':
            case 'RECTANGLE':
            case 'HEXAGON':
            case 'GEAR':
                points = [(g as any).center];
                break;
            case 'POINT':
                points = [{ x: g.x, y: g.y }];
                break;
            case 'POLYLINE':
                points = g.vertices;
                break;
            case 'FASTENER':
                points = [(g as any).origin];
                break;
        }

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = gripColor;
        ctx.lineWidth = 1;

        points.forEach(p => {
            const sp = worldToScreen(p);
            ctx.fillRect(sp.x - gripSize, sp.y - gripSize, gripSize * 2, gripSize * 2);
            ctx.strokeRect(sp.x - gripSize, sp.y - gripSize, gripSize * 2, gripSize * 2);
        });
        ctx.restore();
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
                case 'HEXAGON': {
                    const gPoly = g as any;
                    const c = worldToScreen(gPoly.center);
                    const r = gPoly.radius * viewport.zoom;
                    const sides = gPoly.sides || 6;
                    const rotation = gPoly.rotation || 0;
                    ctx.beginPath();
                    for (let i = 0; i < sides; i++) {
                        const a = rotation + (Math.PI * 2 / sides) * i;
                        const px = c.x + r * Math.cos(a);
                        const py = c.y + r * Math.sin(a);
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.stroke();
                    break;
                }
                case 'GEAR': {
                    const verts = RenderPipeline.computeGearVertices(g);
                    RenderPipeline.strokeVertices(ctx, verts, worldToScreen);
                    break;
                }
                case 'FASTENER': {
                    RenderPipeline.drawFastener(ctx, g, worldToScreen, viewport.zoom);
                    break;
                }
                case 'BELT_PULLEY': {
                    RenderPipeline.drawBeltPulley(ctx, g, worldToScreen, viewport.zoom);
                    break;
                }
                case 'PLANETARY_GEAR': {
                    RenderPipeline.drawPlanetaryGear(ctx, g, worldToScreen, viewport.zoom);
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

            const textCenterX = (p1Ext.x + p2Ext.x) / 2;
            const textCenterY = (p1Ext.y + p2Ext.y) / 2;

            // Check for tolerance
            const hasTol = g.tolUpper !== undefined || g.tolLower !== undefined;

            if (hasTol) {
                const tolU = g.tolUpper ?? 0;
                const tolL = g.tolLower ?? 0;

                // Text background (wider for tolerance)
                const nomWidth = ctx.measureText(text).width;
                const tolText = `+${Math.abs(tolU).toFixed(3)}`;
                ctx.font = '8px monospace';
                const tolWidth = ctx.measureText(tolText).width;
                const totalWidth = nomWidth + tolWidth + 8;

                ctx.font = '11px monospace';
                ctx.fillStyle = '#080c12';
                ctx.fillRect(textCenterX - totalWidth / 2 - 2, textCenterY - 10, totalWidth + 4, 20);

                // Nominal value
                const nomX = textCenterX - tolWidth / 2 - 2;
                ctx.fillStyle = dimColor;
                ctx.textAlign = 'center';
                ctx.fillText(text, nomX, textCenterY);

                // Upper tolerance (superscript)
                ctx.font = '8px monospace';
                ctx.textAlign = 'left';
                const tolX = nomX + nomWidth / 2 + 3;
                const upperText = tolU >= 0 ? `+${tolU.toFixed(3)}` : tolU.toFixed(3);
                ctx.fillText(upperText, tolX, textCenterY - 5);

                // Lower tolerance (subscript)
                const lowerText = tolL >= 0 ? `+${tolL.toFixed(3)}` : tolL.toFixed(3);
                ctx.fillText(lowerText, tolX, textCenterY + 5);
            } else {
                // Text Background
                const textWidth = ctx.measureText(text).width;
                ctx.fillStyle = '#080c12';
                ctx.fillRect(textCenterX - textWidth / 2 - 2, textCenterY - 7, textWidth + 4, 14);

                ctx.fillStyle = dimColor;
                ctx.fillText(text, textCenterX, textCenterY);
            }
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
    public static computeGearVertices(g: any): Point[] {
        const { module: m, teeth: z, pressureAngle, center } = g;
        const phi = (pressureAngle || 20) * (Math.PI / 180);

        const rPitch = (m * z) / 2;
        const rBase = rPitch * Math.cos(phi);
        const rAddendum = rPitch + m;
        const rDedendum = rPitch - 1.25 * m;
        const rRoot = Math.max(rDedendum, rBase * 0.9);

        const toothThickAngle = Math.PI / (2 * z);
        const invPhi = Math.tan(phi) - phi;
        const halfToothAngle = toothThickAngle + invPhi;

        const vertices: Point[] = [];
        const rightProfile: { angle: number; radius: number }[] = [];
        const steps = 10;
        for (let i = 0; i <= steps; i++) {
            const r = rBase + (rAddendum - rBase) * (i / steps);
            if (r < rBase) continue;
            const alpha = Math.acos(rBase / r);
            const invAlpha = Math.tan(alpha) - alpha;
            rightProfile.push({ angle: invAlpha, radius: r });
        }

        for (let tooth = 0; tooth < z; tooth++) {
            const toothCenterAngle = (2 * Math.PI / z) * tooth + (g.rotation || 0);

            // Right flank
            for (let i = 0; i < rightProfile.length; i++) {
                const { angle: invAngle, radius: r } = rightProfile[i];
                const a = toothCenterAngle + halfToothAngle - invAngle;
                vertices.push({ x: center.x + r * Math.cos(a), y: center.y + r * Math.sin(a) });
            }

            // Tip
            const tipRight = toothCenterAngle + halfToothAngle - rightProfile[rightProfile.length - 1].angle;
            const tipLeft = toothCenterAngle - halfToothAngle + rightProfile[rightProfile.length - 1].angle;
            for (let i = 1; i <= 2; i++) {
                const a = tipRight + (tipLeft - tipRight) * (i / 3);
                vertices.push({ x: center.x + rAddendum * Math.cos(a), y: center.y + rAddendum * Math.sin(a) });
            }

            // Left flank
            for (let i = rightProfile.length - 1; i >= 0; i--) {
                const { angle: invAngle, radius: r } = rightProfile[i];
                const a = toothCenterAngle - halfToothAngle + invAngle;
                vertices.push({ x: center.x + r * Math.cos(a), y: center.y + r * Math.sin(a) });
            }

            // Root
            const nextToothAngle = (2 * Math.PI / z) * (tooth + 1) + (g.rotation || 0);
            const rootStart = toothCenterAngle - halfToothAngle + rightProfile[0].angle;
            const rootEnd = nextToothAngle + halfToothAngle - rightProfile[0].angle;
            for (let i = 1; i <= 2; i++) {
                const a = rootStart + (rootEnd - rootStart) * (i / 3);
                vertices.push({ x: center.x + rRoot * Math.cos(a), y: center.y + rRoot * Math.sin(a) });
            }
        }
        return vertices;
    }

    public static drawFastener(ctx: CanvasRenderingContext2D, g: any, worldToScreen: (p: Point) => Point, zoom: number) {
        const { origin, fastenerType, diameter: d, length: len, pitch: p } = g;
        
        const METRIC_TABLE: Record<number, { headH: number; headW: number }> = {
            3: { headH: 2, headW: 5.5 }, 4: { headH: 2.8, headW: 7 }, 5: { headH: 3.5, headW: 8 },
            6: { headH: 4, headW: 10 }, 8: { headH: 5.3, headW: 13 }, 10: { headH: 6.4, headW: 16 },
            12: { headH: 7.5, headW: 18 }, 16: { headH: 10, headW: 24 }, 20: { headH: 12.5, headW: 30 },
            24: { headH: 15, headW: 36 }
        };
        const meta = METRIC_TABLE[d] || { headH: d * 0.7, headW: d * 1.6 };

        if (fastenerType === 'BOLT') {
            const hH = meta.headH; const hW = meta.headW; const r = d / 2;
            const headPts = [
                { x: origin.x - hW / 2, y: origin.y }, { x: origin.x + hW / 2, y: origin.y },
                { x: origin.x + hW / 2, y: origin.y + hH }, { x: origin.x - hW / 2, y: origin.y + hH }
            ].map(worldToScreen);
            
            ctx.beginPath(); ctx.moveTo(headPts[0].x, headPts[0].y);
            headPts.forEach(p => ctx.lineTo(p.x, p.y)); ctx.closePath(); ctx.stroke();

            const shaftTop = origin.y + hH; const shaftBottom = origin.y + hH + len;
            const sL = worldToScreen({ x: origin.x - r, y: shaftTop });
            const sLE = worldToScreen({ x: origin.x - r, y: shaftBottom });
            const sR = worldToScreen({ x: origin.x + r, y: shaftTop });
            const sRE = worldToScreen({ x: origin.x + r, y: shaftBottom });

            ctx.beginPath(); ctx.moveTo(sL.x, sL.y); ctx.lineTo(sLE.x, sLE.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(sR.x, sR.y); ctx.lineTo(sRE.x, sRE.y); ctx.stroke();
            
            // Threads
            const threadH = 0.866 * p; const threadLen = len * 0.7; const threadStart = shaftBottom - threadLen;
            ctx.beginPath();
            let y = threadStart;
            const startP = worldToScreen({ x: origin.x - r, y });
            ctx.moveTo(startP.x, startP.y);
            while (y < shaftBottom - p) {
                const p1 = worldToScreen({ x: origin.x - r - threadH * 0.5, y: y + p / 4 });
                const p2 = worldToScreen({ x: origin.x - r, y: y + p / 2 });
                ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
                y += p / 2;
            }
            ctx.stroke();
        } else {
            // Nut
            const r = meta.headW / 2;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI / 3) * i;
                const p = worldToScreen({ x: origin.x + r * Math.cos(a), y: origin.y + r * Math.sin(a) });
                if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
            }
            ctx.closePath(); ctx.stroke();
            const c = worldToScreen(origin); ctx.beginPath(); ctx.arc(c.x, c.y, (d/2)*zoom, 0, Math.PI*2); ctx.stroke();
        }
    }

    public static drawBeltPulley(ctx: CanvasRenderingContext2D, g: any, worldToScreen: (p: Point) => Point, zoom: number) {
        const { center1: c1, radius1: r1, center2: c2, radius2: r2, beltType } = g;
        const p1 = worldToScreen(c1);
        const p2 = worldToScreen(c2);
        const sr1 = r1 * zoom;
        const sr2 = r2 * zoom;

        // Draw Pulleys
        ctx.beginPath(); ctx.arc(p1.x, p1.y, sr1, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(p2.x, p2.y, sr2, 0, Math.PI * 2); ctx.stroke();

        // Calculate Tangents
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < Math.abs(sr1 - sr2)) return; // One inside another

        const angleBase = Math.atan2(dy, dx);
        
        ctx.save();
        ctx.setLineDash([5, 3]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        
        if (beltType === 'OPEN') {
            const angleOffset = Math.acos((sr1 - sr2) / d);
            const t1_1 = { x: p1.x + sr1 * Math.cos(angleBase + angleOffset), y: p1.y + sr1 * Math.sin(angleBase + angleOffset) };
            const t2_1 = { x: p2.x + sr2 * Math.cos(angleBase + angleOffset), y: p2.y + sr2 * Math.sin(angleBase + angleOffset) };
            const t1_2 = { x: p1.x + sr1 * Math.cos(angleBase - angleOffset), y: p1.y + sr1 * Math.sin(angleBase - angleOffset) };
            const t2_2 = { x: p2.x + sr2 * Math.cos(angleBase - angleOffset), y: p2.y + sr2 * Math.sin(angleBase - angleOffset) };

            ctx.beginPath(); ctx.moveTo(t1_1.x, t1_1.y); ctx.lineTo(t2_1.x, t2_1.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(t1_2.x, t1_2.y); ctx.lineTo(t2_2.x, t2_2.y); ctx.stroke();
        } else {
            const angleOffset = Math.acos((sr1 + sr2) / d);
            const t1_1 = { x: p1.x + sr1 * Math.cos(angleBase + angleOffset), y: p1.y + sr1 * Math.sin(angleBase + angleOffset) };
            const t2_1 = { x: p2.x + sr2 * Math.cos(angleBase + angleOffset + Math.PI), y: p2.y + sr2 * Math.sin(angleBase + angleOffset + Math.PI) };
            const t1_2 = { x: p1.x + sr1 * Math.cos(angleBase - angleOffset), y: p1.y + sr1 * Math.sin(angleBase - angleOffset) };
            const t2_2 = { x: p2.x + sr2 * Math.cos(angleBase - angleOffset + Math.PI), y: p2.y + sr2 * Math.sin(angleBase - angleOffset + Math.PI) };

            ctx.beginPath(); ctx.moveTo(t1_1.x, t1_1.y); ctx.lineTo(t2_1.x, t2_1.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(t1_2.x, t1_2.y); ctx.lineTo(t2_2.x, t2_2.y); ctx.stroke();
        }
        ctx.restore();
    }

    public static drawPlanetaryGear(ctx: CanvasRenderingContext2D, g: any, worldToScreen: (p: Point) => Point, zoom: number) {
        const { center, module: m, sunTeeth, planetTeeth, planetCount } = g;
        const ringTeeth = sunTeeth + 2 * planetTeeth;
        const orbitRadius = m * (sunTeeth + planetTeeth) / 2;

        // 1. Draw Sun Gear
        const sunGeom = { center, module: m, teeth: sunTeeth, rotation: g.rotationSun || 0 };
        const sunVerts = this.computeGearVertices(sunGeom);
        this.strokeVertices(ctx, sunVerts, worldToScreen);

        // 2. Draw Planets
        for (let i = 0; i < planetCount; i++) {
            const angle = (2 * Math.PI / planetCount) * i + (g.rotationCarrier || 0);
            const pCenter = {
                x: center.x + orbitRadius * Math.cos(angle),
                y: center.y + orbitRadius * Math.sin(angle)
            };
            // Planet rotation: linked to sun rotation for visual sync
            // Ratio = sun / planet
            const pRotation = (g.rotationSun || 0) * (-sunTeeth / planetTeeth) - angle * (1 + sunTeeth/planetTeeth);
            
            const pGeom = { center: pCenter, module: m, teeth: planetTeeth, rotation: pRotation };
            const pVerts = this.computeGearVertices(pGeom);
            this.strokeVertices(ctx, pVerts, worldToScreen);
        }

        // 3. Draw Ring Gear (Internal)
        // For internal gear, we draw a circle for now, or reversed involute
        const ringRadius = (m * ringTeeth / 2) * zoom;
        const c = worldToScreen(center);
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath(); ctx.arc(c.x, c.y, ringRadius, 0, Math.PI * 2); ctx.stroke();
        // Outer housing
        ctx.beginPath(); ctx.arc(c.x, c.y, ringRadius + 10 * zoom, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }

    public static strokeVertices(ctx: CanvasRenderingContext2D, vertices: Point[], worldToScreen: (p: Point) => Point) {
        if (vertices.length === 0) return;
        ctx.beginPath();
        const first = worldToScreen(vertices[0]);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < vertices.length; i++) {
            const p = worldToScreen(vertices[i]);
            ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.stroke();
    }

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
