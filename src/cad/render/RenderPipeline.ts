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

import type { Point, Viewport, CadEntity, Layer, SnapResult as SnapIndicator, CadUnit } from '../kernel/types';
import { isEntityShown, layerOf, screenDash } from '../kernel/layers';
import { SpatialIndex } from '../geometry/SpatialIndex';
import { worldToScreen, calculateGridSpacing } from '../kernel/CoordinateSystem';
import * as parametric from './parametricDraw';
import { DynamicBlockEngine } from '../blocks/dynamic/DynamicBlockEngine';
import { DynamicBlockRegistry } from '../blocks/dynamic/registry';
import { pathEllipse, pathPolygon, pathRectangle, pathSpline, drawHatch } from './shapePaths';
import { canvasPalette, displayColor } from './canvasTheme';

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
    units?: CadUnit;
    /** layer table (flags and linetypes); a change redraws the geometry */
    layers?: Layer[];
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
        const safeW = Math.max(1, Math.floor(width));
        const safeH = Math.max(1, Math.floor(height));
        if (this.canvas) {
            this.canvas.width = safeW;
            this.canvas.height = safeH;
        }
        this.dirty = true;
    }

    /**
     * Render to the compositing target.
     * If cached, renders to internal OffscreenCanvas first, then composites.
     */
    renderTo(targetCtx: CanvasRenderingContext2D, ctx: RenderContext): void {
        if (this.canvas) {
            if (this.canvas.width <= 0 || this.canvas.height <= 0) {
                return;
            }
            if (!this.dirty) {
                // Use cached bitmap
                targetCtx.drawImage(this.canvas, 0, 0);
                return;
            }

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
        ctx.strokeStyle = canvasPalette().gridMinor;
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

        ctx.strokeStyle = canvasPalette().gridMajor;
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
        ctx.strokeStyle = canvasPalette().axisX;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, originScreen.y);
        ctx.lineTo(width, originScreen.y);
        ctx.stroke();

        // Y axis (green)
        ctx.strokeStyle = canvasPalette().axisY;
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

        // Viewport culling: For moderate drawings (<=500 entities), render directly from entities
        // to guarantee zero-latency visibility and prevent any culling or bounding box edge cases.
        // For large industrial layouts (>500 entities), cull with spatial index.
        const targetEntities: CadEntity[] = entities.length <= 500
            ? entities
            : renderCtx.spatialIndex.queryBBox(viewBBox)
                .map(id => renderCtx.entityMap.get(id))
                .filter((e): e is CadEntity => Boolean(e && e.isVisible));

        // Batch rendering by type for performance
        const normalLineWidth = Math.max(1, 1.5 / zoom * zoom); // Zoom-normalized
        const drawnDynamicBlockGrips = new Set<string>();

        for (const entity of targetEntities) {
            if (!entity || !isEntityShown(entity)) continue;
            if (entity.geometry.type === 'DIMENSION') continue;

            const isSelected = selectedIds.has(entity.id);
            const color = isSelected ? canvasPalette().selection : displayColor(entity.color);

            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = isSelected ? 2 : 1;
            // layer linetype (CENTER, HIDDEN, …) at drawing scale
            ctx.setLineDash(screenDash(layerOf(entity.layerId)?.lineType, zoom));

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
                    ctx.beginPath();
                    pathRectangle(ctx, g, worldToScreen);
                    ctx.stroke();
                    break;
                }

                case 'HEXAGON': {
                    ctx.beginPath();
                    pathPolygon(ctx, g, worldToScreen);
                    ctx.stroke();
                    break;
                }

                case 'GEAR': {
                    parametric.drawGear(ctx, g, worldToScreen, zoom);
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

                case 'SPROCKET': {
                    const gSpr = g as any;
                    RenderPipeline.drawSprocket(ctx, gSpr, worldToScreen, zoom);
                    break;
                }

                case 'ELLIPSE': {
                    ctx.beginPath();
                    pathEllipse(ctx, g, worldToScreen, zoom);
                    ctx.stroke();
                    break;
                }

                case 'SPLINE': {
                    const gSpl = g as any;
                    if (!gSpl.controlPoints || gSpl.controlPoints.length < 2) break;
                    ctx.beginPath();
                    pathSpline(ctx, gSpl.controlPoints, Boolean(gSpl.closed), worldToScreen);
                    ctx.stroke();
                    break;
                }

                case 'LEADER': {
                    const gLead = g as any;
                    const pStart = worldToScreen(gLead.start);
                    const pEnd = worldToScreen(gLead.end);
                    ctx.save();
                    ctx.strokeStyle = color;
                    ctx.fillStyle = color;
                    ctx.lineWidth = isSelected ? 2 : 1.5;

                    // 1. Leader Line & Shoulder
                    ctx.beginPath();
                    ctx.moveTo(pStart.x, pStart.y);
                    ctx.lineTo(pEnd.x, pEnd.y);
                    const shoulderLen = 18;
                    const shoulderX = pEnd.x >= pStart.x ? pEnd.x + shoulderLen : pEnd.x - shoulderLen;
                    ctx.lineTo(shoulderX, pEnd.y);
                    ctx.stroke();

                    // 2. Arrowhead at start point
                    const angle = Math.atan2(pStart.y - pEnd.y, pStart.x - pEnd.x);
                    const arrowLen = 11;
                    ctx.beginPath();
                    ctx.moveTo(pStart.x, pStart.y);
                    ctx.lineTo(pStart.x - arrowLen * Math.cos(angle - Math.PI / 6), pStart.y - arrowLen * Math.sin(angle - Math.PI / 6));
                    ctx.lineTo(pStart.x - arrowLen * Math.cos(angle + Math.PI / 6), pStart.y - arrowLen * Math.sin(angle + Math.PI / 6));
                    ctx.closePath();
                    ctx.fill();

                    // 3. Text with high-contrast badge
                    const text = gLead.text || 'NOTE';
                    ctx.font = 'bold 11px monospace';
                    const tw = ctx.measureText(text).width;
                    const textX = pEnd.x >= pStart.x ? pEnd.x + 4 : pEnd.x - tw - 4;
                    const textY = pEnd.y - 14;

                    ctx.fillStyle = canvasPalette().labelBg;
                    ctx.fillRect(textX - 3, textY - 2, tw + 6, 16);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(textX - 3, textY - 2, tw + 6, 16);

                    ctx.fillStyle = color;
                    ctx.textBaseline = 'top';
                    ctx.textAlign = 'left';
                    ctx.fillText(text, textX, textY);
                    ctx.restore();
                    break;
                }

                case 'HATCH': {
                    drawHatch(ctx, g, worldToScreen, zoom, color, {
                        selected: isSelected,
                        tint: canvasPalette().isLight ? 'rgba(2, 132, 199, 0.07)' : 'rgba(56, 189, 248, 0.08)',
                        border: (g as any).strokeBorder !== false,
                    });
                    break;
                }

                case 'TEXT': {
                    const gText = g as any;
                    const pos = worldToScreen(gText.position);
                    const fontSize = Math.max(10, (gText.fontSize || 14) * zoom);
                    const fontWeight = gText.bold ? 'bold' : 'normal';
                    const fontStyle = gText.italic ? 'italic' : 'normal';
                    ctx.save();
                    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${gText.fontFamily || '"JetBrains Mono", Arial, monospace'}`;
                    
                    const textStr = gText.content || 'Text';
                    const metrics = ctx.measureText(textStr);
                    const textW = metrics.width;
                    const textH = fontSize;

                    // backing plate and text share the text's own (rotated) frame
                    ctx.translate(pos.x, pos.y);
                    if (gText.rotation) ctx.rotate(-gText.rotation);
                    const plateX = gText.justification === 'center' ? -textW / 2 - 3 : gText.justification === 'right' ? -textW - 3 : -3;
                    ctx.fillStyle = canvasPalette().labelBg;
                    ctx.fillRect(plateX, -2, textW + 6, textH + 4);

                    ctx.fillStyle = color;
                    ctx.textAlign = gText.justification || 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillText(textStr, 0, 0);
                    ctx.restore();
                    break;
                }

                // DIMENSION rendered in overlay layer
                default:
                    break;
            }


            ctx.setLineDash([]);

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
            if (entity.isDynamic && entity.dynamicBlockId && entity.blockInstanceId) {
                if (!drawnDynamicBlockGrips.has(entity.blockInstanceId)) {
                    drawnDynamicBlockGrips.add(entity.blockInstanceId);
                    this.drawDynamicBlockGrips(ctx, entity, worldToScreen);
                }
            } else {
                this.drawGrips(ctx, entity, worldToScreen, zoom);
            }
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
        ctx.fillStyle = canvasPalette().gripFill;
        ctx.strokeStyle = gripColor;
        ctx.lineWidth = 1;

        points.forEach(p => {
            const sp = worldToScreen(p);
            ctx.fillRect(sp.x - gripSize, sp.y - gripSize, gripSize * 2, gripSize * 2);
            ctx.strokeRect(sp.x - gripSize, sp.y - gripSize, gripSize * 2, gripSize * 2);
        });
        ctx.restore();
    }

    private drawDynamicBlockGrips(
        ctx: CanvasRenderingContext2D,
        entity: CadEntity,
        worldToScreen: (p: Point) => Point
    ) {
        if (!entity.dynamicBlockId) return;
        const blockDef = DynamicBlockRegistry.getById(entity.dynamicBlockId);
        if (!blockDef) return;

        const grips = DynamicBlockEngine.getGripsWorld(
            blockDef,
            entity.dynamicParams || {},
            entity.dynamicBasePoint || { x: 0, y: 0 },
            entity.dynamicScale ?? 1,
            entity.dynamicRotationRad ?? 0
        );

        ctx.save();
        for (const grip of grips) {
            const sp = worldToScreen(grip.position);

            if (grip.type === 'point') {
                // AutoCAD Base Point Grip: Solid Cyan Square
                ctx.fillStyle = '#00e5ff';
                ctx.strokeStyle = canvasPalette().gripStroke;
                ctx.lineWidth = 1.5;
                const sq = 4.5;
                ctx.fillRect(sp.x - sq, sp.y - sq, sq * 2, sq * 2);
                ctx.strokeRect(sp.x - sq, sp.y - sq, sq * 2, sq * 2);
            } else if (grip.type === 'stretch' || grip.type === 'linear') {
                // AutoCAD Stretch Grip: Cyan Arrowhead in grip.direction
                ctx.fillStyle = '#00e5ff';
                ctx.strokeStyle = canvasPalette().gripStroke;
                ctx.lineWidth = 1.5;

                const arrowSize = 10;
                let dir = grip.direction;
                if (!dir || (dir.x === 0 && dir.y === 0)) {
                    dir = { x: 1, y: 0 };
                }
                const len = Math.hypot(dir.x, dir.y) || 1;
                // CAD Y is inverted in screen space:
                const nx = dir.x / len;
                const ny = -dir.y / len;
                const px = -ny;
                const py = nx;

                const tipX = sp.x + nx * arrowSize;
                const tipY = sp.y + ny * arrowSize;
                const b1X = sp.x - nx * arrowSize * 0.4 + px * arrowSize * 0.7;
                const b1Y = sp.y - ny * arrowSize * 0.4 + py * arrowSize * 0.7;
                const b2X = sp.x - nx * arrowSize * 0.4 - px * arrowSize * 0.7;
                const b2Y = sp.y - ny * arrowSize * 0.4 - py * arrowSize * 0.7;

                ctx.beginPath();
                ctx.moveTo(tipX, tipY);
                ctx.lineTo(b1X, b1Y);
                ctx.lineTo(b2X, b2Y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (grip.type === 'flip') {
                // Amber Flip Circle with swap arrows
                ctx.fillStyle = '#f59e0b';
                ctx.strokeStyle = canvasPalette().gripStroke;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = canvasPalette().gripStroke;
                ctx.font = 'bold 9px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('⇄', sp.x, sp.y);
            } else if (grip.type === 'visibility' || grip.type === 'lookup') {
                // Magenta / Purple Downward Inverted Triangle (AutoCAD lookup glyph)
                ctx.fillStyle = '#c084fc';
                ctx.strokeStyle = canvasPalette().gripStroke;
                ctx.lineWidth = 1.5;

                const size = 6;
                ctx.beginPath();
                ctx.moveTo(sp.x - size, sp.y - size * 0.6);
                ctx.lineTo(sp.x + size, sp.y - size * 0.6);
                ctx.lineTo(sp.x, sp.y + size * 0.9);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        }
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

    customPreview: ((ctx: CanvasRenderingContext2D, worldToScreen: (p: Point) => Point) => void) | null = null;

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
            ctx.strokeStyle = canvasPalette().preview;
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
                    ctx.beginPath();
                    // Screen Y is inverted, so world CCW is screen CCW if we invert angles and set anticlockwise to true
                    ctx.arc(c.x, c.y, Math.max(0.1, r), -(g as any).startAngle, -(g as any).endAngle, true);
                    ctx.stroke();
                    break;
                }
                case 'HEXAGON': {
                    ctx.beginPath();
                    pathPolygon(ctx, g, worldToScreen);
                    ctx.stroke();
                    break;
                }
                case 'RECTANGLE': {
                    ctx.beginPath();
                    pathRectangle(ctx, g, worldToScreen);
                    ctx.stroke();
                    break;
                }
                case 'POLYLINE': {
                    const gPoly = g as any;
                    if (!gPoly.vertices || gPoly.vertices.length < 2) break;
                    ctx.beginPath();
                    const first = worldToScreen(gPoly.vertices[0]);
                    ctx.moveTo(first.x, first.y);
                    for (let i = 1; i < gPoly.vertices.length; i++) {
                        const p = worldToScreen(gPoly.vertices[i]);
                        ctx.lineTo(p.x, p.y);
                    }
                    if (gPoly.closed) ctx.closePath();
                    ctx.stroke();
                    break;
                }
                case 'POINT': {
                    const gp = worldToScreen({ x: (g as any).x, y: (g as any).y });
                    ctx.beginPath();
                    ctx.arc(gp.x, gp.y, 4, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }
                case 'GEAR': {
                    parametric.drawGear(ctx, g, worldToScreen, viewport.zoom);
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
                case 'SPROCKET': {
                    RenderPipeline.drawSprocket(ctx, g, worldToScreen, viewport.zoom);
                    break;
                }
                case 'ELLIPSE': {
                    ctx.beginPath();
                    pathEllipse(ctx, g, worldToScreen, viewport.zoom);
                    ctx.stroke();
                    break;
                }
                case 'SPLINE': {
                    const gSpl = g as any;
                    if (!gSpl.controlPoints || gSpl.controlPoints.length < 2) break;
                    ctx.beginPath();
                    pathSpline(ctx, gSpl.controlPoints, Boolean(gSpl.closed), worldToScreen);
                    ctx.stroke();
                    break;
                }
                case 'LEADER': {
                    const gLead = g as any;
                    const pStart = worldToScreen(gLead.start);
                    const pEnd = worldToScreen(gLead.end);
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(pStart.x, pStart.y);
                    ctx.lineTo(pEnd.x, pEnd.y);
                    ctx.stroke();

                    // Arrowhead
                    const angle = Math.atan2(pStart.y - pEnd.y, pStart.x - pEnd.x);
                    const arrowLen = 10;
                    ctx.beginPath();
                    ctx.moveTo(pStart.x, pStart.y);
                    ctx.lineTo(pStart.x - arrowLen * Math.cos(angle - Math.PI / 6), pStart.y - arrowLen * Math.sin(angle - Math.PI / 6));
                    ctx.lineTo(pStart.x - arrowLen * Math.cos(angle + Math.PI / 6), pStart.y - arrowLen * Math.sin(angle + Math.PI / 6));
                    ctx.closePath();
                    ctx.fill();

                    // Text
                    ctx.font = '11px monospace';
                    ctx.fillText(gLead.text || 'NOTE', pEnd.x + 5, pEnd.y);
                    ctx.restore();
                    break;
                }
                case 'HATCH': {
                    ctx.setLineDash([]);
                    drawHatch(ctx, g, worldToScreen, viewport.zoom, canvasPalette().preview, { border: false });
                    ctx.setLineDash([5, 3]);
                    break;
                }
                case 'TEXT': {
                    const gText = g as any;
                    if (!gText.position) break;
                    const pos = worldToScreen(gText.position);
                    const fontSize = Math.max(10, (gText.fontSize || 12) * viewport.zoom);
                    const content = gText.content || 'Text';
                    ctx.save();
                    ctx.translate(pos.x, pos.y);
                    if (gText.rotation) ctx.rotate(-gText.rotation);
                    // same anchor as the final text: top edge, horizontal justification
                    ctx.font = `${gText.bold ? 'bold ' : ''}${fontSize}px ${gText.fontFamily || '"JetBrains Mono", Arial, monospace'}`;
                    ctx.textBaseline = 'top';
                    ctx.textAlign = gText.justification || 'left';
                    ctx.fillText(content, 0, 0);
                    const w = ctx.measureText(content).width;
                    const x0 = gText.justification === 'center' ? -w / 2 : gText.justification === 'right' ? -w : 0;
                    ctx.strokeRect(x0 - 2, -2, w + 4, fontSize + 4);
                    ctx.restore();
                    break;
                }
                case 'DIMENSION': {
                    const gDim = g as any;
                    if (!gDim.start || !gDim.end) break;
                    const p1 = worldToScreen(gDim.start);
                    const p2 = worldToScreen(gDim.end);
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                    ctx.restore();
                    break;
                }
            }
            ctx.setLineDash([]);
        }

        // --- Dimension entities ---
        for (const entity of entities) {
            if (!isEntityShown(entity) || entity.geometry.type !== 'DIMENSION') continue;

            const g = entity.geometry as any;
            if (!g.start || !g.end) continue;

            const p1 = worldToScreen(g.start);
            const p2 = worldToScreen(g.end);

            const isSelected = renderCtx.selectedIds.has(entity.id);
            const dimColor = isSelected ? canvasPalette().selection : canvasPalette().dimension;
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
            let offset = 30; // default pixels
            if (g.textPoint) {
                const pt = worldToScreen(g.textPoint);
                const proj = (pt.x - p1.x) * nx + (pt.y - p1.y) * ny;
                if (Math.abs(proj) > 5) {
                    offset = proj;
                }
            }

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
            const unit = renderCtx.units || 'mm';
            const isInch = unit === 'in';
            let text = g.text;

            if (isInch) {
                if (text && typeof text === 'string') {
                    const match = text.match(/^([^\d.-]*)([-+]?\d*\.?\d+)(\s*(?:mm|in|")?)?$/);
                    if (match) {
                        const prefix = match[1] || '';
                        const valNum = parseFloat(match[2]);
                        if (!Number.isNaN(valNum)) {
                            const isAlreadyInch = match[3] && (match[3].includes('in') || match[3].includes('"'));
                            const valIn = isAlreadyInch ? valNum : valNum / 25.4;
                            text = `${prefix}${valIn.toFixed(valIn < 1 ? 3 : 2)}"`;
                        }
                    }
                } else {
                    const mmVal = g.value ?? (dist / viewport.zoom);
                    const inVal = mmVal / 25.4;
                    text = `${inVal.toFixed(inVal < 1 ? 3 : 2)}"`;
                }
            } else {
                if (!text) {
                    text = g.value ? `${g.value.toFixed(2)} mm` : `${(dist / viewport.zoom).toFixed(2)} mm`;
                }
            }

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
                const scaleTol = isInch ? 1 / 25.4 : 1;
                const tolDecimals = isInch ? 4 : 3;
                const tolUnitSuffix = isInch ? '"' : '';

                // Text background (wider for tolerance)
                const nomWidth = ctx.measureText(text).width;
                const tolText = `+${Math.abs(tolU * scaleTol).toFixed(tolDecimals)}`;
                ctx.font = '8px monospace';
                const tolWidth = ctx.measureText(tolText).width;
                const totalWidth = nomWidth + tolWidth + 8;

                ctx.font = '11px monospace';
                ctx.fillStyle = canvasPalette().labelBg;
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
                const upperVal = tolU * scaleTol;
                const upperText = upperVal >= 0 ? `+${upperVal.toFixed(tolDecimals)}${tolUnitSuffix}` : `${upperVal.toFixed(tolDecimals)}${tolUnitSuffix}`;
                ctx.fillText(upperText, tolX, textCenterY - 5);

                // Lower tolerance (subscript)
                const lowerVal = tolL * scaleTol;
                const lowerText = lowerVal >= 0 ? `+${lowerVal.toFixed(tolDecimals)}${tolUnitSuffix}` : `${lowerVal.toFixed(tolDecimals)}${tolUnitSuffix}`;
                ctx.fillText(lowerText, tolX, textCenterY + 5);
            } else {
                // Text Background
                ctx.font = 'bold 11px monospace';
                const textWidth = ctx.measureText(text).width;
                ctx.fillStyle = canvasPalette().labelBg;
                ctx.fillRect(textCenterX - textWidth / 2 - 4, textCenterY - 8, textWidth + 8, 16);
                ctx.strokeStyle = dimColor;
                ctx.lineWidth = 0.8;
                ctx.strokeRect(textCenterX - textWidth / 2 - 4, textCenterY - 8, textWidth + 8, 16);

                ctx.fillStyle = dimColor;
                ctx.fillText(text, textCenterX, textCenterY);
            }
        }

        // --- Snap indicator ---
        if (this.overlayState.snapIndicator) {
            const sp = worldToScreen(this.overlayState.snapIndicator.point);
            const size = 6;

            ctx.strokeStyle = canvasPalette().snap;
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

        // --- Custom command previews (transforms, fence trim, measure, etc.) ---
        if (this.customPreview) {
            try {
                this.customPreview(ctx, worldToScreen);
            } catch (err) {
                console.error('Error rendering command custom preview:', err);
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
            ctx.strokeStyle = canvasPalette().cursor;
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
            ctx.fillStyle = canvasPalette().labelBg;
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
        return parametric.computeGearVertices(g);
    }

    public static drawGear(ctx: CanvasRenderingContext2D, g: any, worldToScreen: (p: Point) => Point, zoom: number) {
        parametric.drawGear(ctx, g, worldToScreen, zoom);
    }

    public static drawFastener(ctx: CanvasRenderingContext2D, g: any, worldToScreen: (p: Point) => Point, zoom: number) {
        parametric.drawFastener(ctx, g, worldToScreen, zoom);
    }

    public static drawBeltPulley(ctx: CanvasRenderingContext2D, g: any, worldToScreen: (p: Point) => Point, zoom: number) {
        parametric.drawBeltPulley(ctx, g, worldToScreen, zoom);
    }

    public static drawPlanetaryGear(ctx: CanvasRenderingContext2D, g: any, worldToScreen: (p: Point) => Point, zoom: number) {
        parametric.drawPlanetaryGear(ctx, g, worldToScreen, zoom);
    }

    public static drawSprocket(ctx: CanvasRenderingContext2D, g: any, worldToScreen: (p: Point) => Point, zoom: number) {
        parametric.drawSprocket(ctx, g, worldToScreen, zoom);
    }

    public static strokeVertices(ctx: CanvasRenderingContext2D, vertices: Point[], worldToScreen: (p: Point) => Point) {
        parametric.strokeVertices(ctx, vertices, worldToScreen);
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
        if (width <= 0 || height <= 0) return;

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

    /** Set custom preview render callback (active command previews) */
    setCustomPreview(cb: ((ctx: CanvasRenderingContext2D, worldToScreen: (p: Point) => Point) => void) | null): void {
        this.overlayLayer.customPreview = cb;
    }

    /** Force full redraw of all layers */
    forceFullRedraw(): void {
        this.layers.forEach(l => l.markDirty());
    }
}
