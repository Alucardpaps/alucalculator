/**
 * AluCAD — ISO 7200 / DIN EN ISO 5457 Technical Drawing PDF Generator
 * 
 * Standards Compliance:
 * - DIN EN ISO 5457: Technical Product Documentation — Sizes and layout of drawing sheets
 * - ISO 7200: Technical drawings — Title blocks
 * - ISO 128: Technical drawings — General principles of presentation (Line weights & types)
 * - ISO 5456-2: Technical drawings — Projection methods (First Angle)
 * - ISO 2768-mK: General tolerances for linear and angular dimensions
 * 
 * Generates vector-sharp PDF blueprints with professional title block, grid zones,
 * ISO 128 line weights, and support for all geometric primitives.
 */

import { PDFDocument, rgb, StandardFonts, RGB, degrees, type PDFFont, type PDFPage } from 'pdf-lib';
import type { CadEntity, Layer, Point } from '../kernel/types';
import type { Primitive } from '../kernel/primitiveTypes';
import { geometryPrimitives, primitiveBounds } from '../kernel/primitives';
import { TAU, ccwSweep } from '../kernel/shapes';
import { hatchSegments } from '../kernel/hatchPatterns';
import { LINETYPES, isLayerShown, linetypeName } from '../kernel/layers';
import { bulgeArc } from '@/lib/dxf/dxfGeometry';

export interface TitleBlockData {
    partName?: string;
    drawingNumber?: string;
    revision?: string;
    material?: string;
    designer?: string;
    approver?: string;
    company?: string;
    date?: string;
    sheet?: string;
    generalTolerance?: string;
    scale?: string;
}

export interface PdfPlotOptions {
    worldBounds?: { minX: number; minY: number; maxX: number; maxY: number };
    paperSize?: 'A4' | 'A3' | 'A2' | 'A1' | 'Letter';
    orientation?: 'LANDSCAPE' | 'PORTRAIT';
    scale?: 'FIT' | '1:1' | '1:2' | '1:5' | '1:10' | '2:1' | '5:1' | string;
    showTitleBlock?: boolean;
    showGridBorder?: boolean;
    colorMode?: 'MONOCHROME' | 'COLOR';
    titleBlockData?: TitleBlockData;
    /** unit the canvas shows dimension values in */
    displayUnits?: string;
}

const PAPER_SIZES_PT: Record<string, [number, number]> = {
    'A4': [595.28, 841.89],     // 210 x 297 mm
    'A3': [841.89, 1190.55],    // 297 x 420 mm
    'A2': [1190.55, 1683.78],   // 420 x 594 mm
    'A1': [1683.78, 2383.94],   // 594 x 841 mm
    'Letter': [612, 792]        // 8.5 x 11 inch
};

// 1 mm = 2.834645 points
const MM_TO_PT = 2.834645;

export async function generatePDF(
    entities: CadEntity[],
    layers: Layer[] = [],
    _canvasElement?: HTMLCanvasElement | null,
    options: PdfPlotOptions = {}
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();

    // ─────────────────────────────────────────────────────────────
    // 1. PAGE SETUP & ORIENTATION
    // ─────────────────────────────────────────────────────────────
    const paperKey = options.paperSize || 'A4';
    let [paperW, paperH] = PAPER_SIZES_PT[paperKey] || PAPER_SIZES_PT['A4'];
    const orientation = options.orientation || 'LANDSCAPE';
    if (orientation === 'LANDSCAPE') {
        [paperW, paperH] = [Math.max(paperW, paperH), Math.min(paperW, paperH)];
    } else {
        [paperW, paperH] = [Math.min(paperW, paperH), Math.max(paperW, paperH)];
    }

    const page = pdfDoc.addPage([paperW, paperH]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Margin standard: 20mm left for binding, 10mm top/right/bottom
    const marginL = 20 * MM_TO_PT;
    const marginR = 10 * MM_TO_PT;
    const marginT = 10 * MM_TO_PT;
    const marginB = 10 * MM_TO_PT;

    const showTB = options.showTitleBlock ?? true;
    const showBorder = options.showGridBorder ?? true;
    const colorMode = options.colorMode || 'MONOCHROME';

    // ISO 7200 Title Block dimensions: width 180mm, height 36mm
    const tbW = Math.min(180 * MM_TO_PT, paperW - marginL - marginR);
    const tbH = 36 * MM_TO_PT;

    // Available drawing plot area
    const plotArea = {
        x: marginL,
        y: marginB,
        width: paperW - marginL - marginR,
        height: paperH - marginT - marginB,
    };

    // ─────────────────────────────────────────────────────────────
    // 2. WORLD BOUNDS & SCALE CALCULATION
    // ─────────────────────────────────────────────────────────────
    // everything is plotted from the shared primitive decomposition (exactly as drawn)
    const layerMap = new Map<string, Layer>(layers.map((l) => [l.id, l]));
    const plotted = entities
        .filter((e) => e && e.isVisible !== false && e.geometry && isLayerShown(layerMap.get(e.layerId)))
        .map((e) => ({ e, prims: geometryPrimitives(e.geometry, options.displayUnits ?? 'mm') }));
    const wb = options.worldBounds ?? primitiveBounds(plotted.flatMap((x) => x.prims));
    let minX = wb?.minX ?? Infinity, minY = wb?.minY ?? Infinity, maxX = wb?.maxX ?? -Infinity, maxY = wb?.maxY ?? -Infinity;

    if (!Number.isFinite(minX) || !Number.isFinite(maxX) || minX >= maxX || minY >= maxY) {
        minX = 0; maxX = 100; minY = 0; maxY = 100;
    }

    const worldWidth = Math.max(10, maxX - minX);
    const worldHeight = Math.max(10, maxY - minY);

    // Padding inside drawing area (15mm)
    const innerPad = 15 * MM_TO_PT;
    const availW = plotArea.width - innerPad * 2;
    // Reserved height considering title block at bottom-right
    const availH = plotArea.height - innerPad * 2 - (showTB ? tbH * 0.5 : 0);

    let scalePtPerMm = 1.0;
    let actualScaleRatio = '1:1';

    const reqScale = options.scale || 'FIT';
    if (reqScale === 'FIT') {
        const fitScale = Math.min(availW / worldWidth, availH / worldHeight);
        scalePtPerMm = fitScale;
        actualScaleRatio = `1:${(MM_TO_PT / fitScale).toFixed(1)}`;
    } else {
        const parts = reqScale.split(':');
        if (parts.length === 2) {
            const num = parseFloat(parts[0]);
            const den = parseFloat(parts[1]);
            if (num > 0 && den > 0) {
                scalePtPerMm = (num / den) * MM_TO_PT;
                actualScaleRatio = reqScale;
            }
        }
    }

    const scaledW = worldWidth * scalePtPerMm;
    const scaledH = worldHeight * scalePtPerMm;

    // Centered in drawing sheet
    const originX = plotArea.x + (plotArea.width - scaledW) / 2;
    const originY = plotArea.y + (plotArea.height + (showTB ? tbH * 0.4 : 0) - scaledH) / 2;

    const toPdf = (p: Point): Point => ({
        x: originX + (p.x - minX) * scalePtPerMm,
        y: originY + (p.y - minY) * scalePtPerMm,
    });

    // ─────────────────────────────────────────────────────────────
    // 3. DRAWING SHEET BORDER & GRID ZONES (DIN EN ISO 5457)
    // ─────────────────────────────────────────────────────────────
    if (showBorder) {
        // Outer raw paper boundary
        page.drawRectangle({
            x: 5 * MM_TO_PT,
            y: 5 * MM_TO_PT,
            width: paperW - 10 * MM_TO_PT,
            height: paperH - 10 * MM_TO_PT,
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 0.3,
        });

        // Inner active drawing frame (0.7mm thick border)
        page.drawRectangle({
            x: plotArea.x,
            y: plotArea.y,
            width: plotArea.width,
            height: plotArea.height,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1.5,
        });

        // Grid zone reference letters and numbers (A, B, C, D / 1, 2, 3, 4, 5, 6)
        const cols = 6;
        const rows = 4;
        const colW = plotArea.width / cols;
        const rowH = plotArea.height / rows;

        for (let i = 0; i < cols; i++) {
            const numStr = (i + 1).toString();
            const posX = plotArea.x + colW * i + colW / 2 - 3;
            page.drawText(numStr, { x: posX, y: paperH - marginT + 3, size: 7, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
            page.drawText(numStr, { x: posX, y: marginB - 8, size: 7, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
        }

        const letters = ['A', 'B', 'C', 'D'];
        for (let j = 0; j < rows; j++) {
            const letStr = letters[j] || '';
            const posY = plotArea.y + plotArea.height - (rowH * j + rowH / 2 + 3);
            page.drawText(letStr, { x: marginL - 10, y: posY, size: 7, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
            page.drawText(letStr, { x: paperW - marginR + 3, y: posY, size: 7, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 4. VECTOR ENTITY RENDERING (ISO 128 LINE WEIGHTS)
    // ─────────────────────────────────────────────────────────────
    const contourColor = colorMode === 'COLOR' ? rgb(0.2, 0.4, 0.8) : rgb(0, 0, 0);
    const thinColor = colorMode === 'COLOR' ? rgb(0.4, 0.4, 0.4) : rgb(0.1, 0.1, 0.1);
    const thickWeight = 1.4; // ~0.50 mm (ISO 128 outline)
    const thinWeight = 0.7;  // ~0.25 mm (ISO 128 extension/hatch)

    const plotter = new PdfPlotter(page, toPdf, scalePtPerMm, font, boldFont);
    for (const { e, prims } of plotted) {
        const annotation = e.geometry.type === 'DIMENSION' || e.geometry.type === 'LEADER' || e.geometry.type === 'TEXT';
        const color = colorMode === 'COLOR' ? hexToPdfRgb(e.color || '#000000') : annotation ? thinColor : contourColor;
        const layerLt = layerMap.get(e.layerId)?.lineType;
        for (const p of prims) plotter.draw(p, color, p.style === 'continuous' && !annotation ? thickWeight : thinWeight, layerLt);
    }

    // ─────────────────────────────────────────────────────────────
    // 5. ISO 7200 OFFICIAL TITLE BLOCK (ANTET)
    // ─────────────────────────────────────────────────────────────
    if (showTB) {
        const d = options.titleBlockData || {};
        const bx = plotArea.x + plotArea.width - tbW;
        const by = plotArea.y;

        // Title block boundary box (1.5pt thick border)
        page.drawRectangle({
            x: bx,
            y: by,
            width: tbW,
            height: tbH,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1.5,
            color: rgb(1, 1, 1), // Opaque white background
        });

        // Horizontal dividers
        page.drawLine({ start: { x: bx, y: by + tbH * 0.55 }, end: { x: bx + tbW, y: by + tbH * 0.55 }, color: rgb(0, 0, 0), thickness: 0.8 });
        page.drawLine({ start: { x: bx, y: by + tbH * 0.28 }, end: { x: bx + tbW, y: by + tbH * 0.28 }, color: rgb(0, 0, 0), thickness: 0.5 });

        // Vertical dividers
        page.drawLine({ start: { x: bx + tbW * 0.45, y: by }, end: { x: bx + tbW * 0.45, y: by + tbH * 0.55 }, color: rgb(0, 0, 0), thickness: 0.8 });
        page.drawLine({ start: { x: bx + tbW * 0.72, y: by }, end: { x: bx + tbW * 0.72, y: by + tbH * 0.55 }, color: rgb(0, 0, 0), thickness: 0.5 });
        page.drawLine({ start: { x: bx + tbW * 0.65, y: by + tbH * 0.55 }, end: { x: bx + tbW * 0.65, y: by + tbH }, color: rgb(0, 0, 0), thickness: 0.8 });

        // Top Row: Company Name & Part Title
        page.drawText(cleanPdfText(d.company || 'ALUCAD OS ENGINEERING'), {
            x: bx + 6,
            y: by + tbH - 12,
            size: 8,
            font: boldFont,
            color: rgb(0, 0, 0),
        });
        page.drawText(cleanPdfText(d.partName || 'ALUCAD 2D MECHANICAL DRAFT'), {
            x: bx + 6,
            y: by + tbH - 25,
            size: 10,
            font: boldFont,
            color: rgb(0, 0.2, 0.5),
        });

        // Top Right: Drawing Number & Revision
        page.drawText('DWG NO:', { x: bx + tbW * 0.65 + 6, y: by + tbH - 12, size: 6, font, color: rgb(0.3, 0.3, 0.3) });
        page.drawText(cleanPdfText(d.drawingNumber || 'ALU-2026-001'), { x: bx + tbW * 0.65 + 6, y: by + tbH - 24, size: 8, font: boldFont });
        page.drawText(cleanPdfText(`REV: ${d.revision || 'A.0'}`), { x: bx + tbW - 35, y: by + tbH - 12, size: 6, font: boldFont });

        // Middle Row: Material & General Tolerance
        page.drawText('MATERIAL:', { x: bx + 6, y: by + tbH * 0.55 - 8, size: 5.5, font, color: rgb(0.3, 0.3, 0.3) });
        page.drawText(cleanPdfText(d.material || 'EN AW-6082-T6 (AlSi1MgMn)'), { x: bx + 6, y: by + tbH * 0.28 + 4, size: 7, font: boldFont });

        page.drawText('TOLERANCE:', { x: bx + tbW * 0.45 + 6, y: by + tbH * 0.55 - 8, size: 5.5, font, color: rgb(0.3, 0.3, 0.3) });
        page.drawText(cleanPdfText(d.generalTolerance || 'ISO 2768-mK'), { x: bx + tbW * 0.45 + 6, y: by + tbH * 0.28 + 4, size: 7, font: boldFont });

        page.drawText('SCALE:', { x: bx + tbW * 0.72 + 6, y: by + tbH * 0.55 - 8, size: 5.5, font, color: rgb(0.3, 0.3, 0.3) });
        page.drawText(cleanPdfText(d.scale || actualScaleRatio), { x: bx + tbW * 0.72 + 6, y: by + tbH * 0.28 + 4, size: 8, font: boldFont });

        // Bottom Row: Designer, Date, Projection Symbol & Sheet
        const dateStr = d.date || new Date().toISOString().split('T')[0];
        page.drawText(cleanPdfText(`DESIGNED: ${d.designer || 'ALUCALC USER'}  |  DATE: ${dateStr}`), {
            x: bx + 6,
            y: by + 8,
            size: 6,
            font,
            color: rgb(0.2, 0.2, 0.2),
        });

        // ISO 5456-2 First Angle Projection Symbol (Truncated Cone + Circles)
        const projX = bx + tbW * 0.48;
        const projY = by + 9;
        page.drawRectangle({ x: projX, y: projY - 3, width: 8, height: 6, borderColor: rgb(0.2, 0.2, 0.2), borderWidth: 0.5 });
        page.drawCircle({ x: projX + 13, y: projY, size: 3, borderColor: rgb(0.2, 0.2, 0.2), borderWidth: 0.5 });
        page.drawCircle({ x: projX + 13, y: projY, size: 1.5, borderColor: rgb(0.2, 0.2, 0.2), borderWidth: 0.5 });

        page.drawText(cleanPdfText(`SHEET: ${d.sheet || '1 / 1'}`), {
            x: bx + tbW - 40,
            y: by + 8,
            size: 6,
            font: boldFont,
        });
    }

    return await pdfDoc.save();
}

function hexToPdfRgb(hex: string): RGB {
    const clean = hex.replace('#', '');
    if (clean.length < 6) return rgb(0, 0, 0);
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return rgb(r || 0, g || 0, b || 0);
}

const fmt = (v: number) => (Number.isFinite(v) ? +v.toFixed(3) : 0);

/** Draws world-space primitives on a PDF page (SVG path syntax, y flipped by pdf-lib). */
class PdfPlotter {
    constructor(
        private readonly page: PDFPage,
        private readonly toPdf: (p: Point) => Point,
        private readonly k: number,
        private readonly font: PDFFont,
        private readonly bold: PDFFont,
    ) {}

    /** page point → SVG path coordinates for drawSvgPath at origin (0, 0) */
    private m(p: Point): string {
        const q = this.toPdf(p);
        return `${fmt(q.x)} ${fmt(-q.y)}`;
    }

    private dash(p: Primitive, layerLinetype?: string): number[] | undefined {
        const name = p.style === 'center' ? 'CENTER' : p.style === 'hidden' ? 'HIDDEN' : p.style === 'dashed' ? 'DASHED'
            : p.style === 'continuous' ? linetypeName(layerLinetype) : 'CONTINUOUS';
        const pat = LINETYPES[name].pattern;
        // dash lengths stay readable on paper whatever the plot scale (pt)
        return pat.length ? pat.map((d) => Math.max(1, Math.abs(d) * 2.834645 * 0.6)) : undefined;
    }

    private stroke(path: string, color: RGB, width: number, dash?: number[]) {
        if (!path) return;
        this.page.drawSvgPath(path, { x: 0, y: 0, borderColor: color, borderWidth: width, borderDashArray: dash, borderLineCap: 1 as any });
    }

    private fill(path: string, color: RGB, opacity = 1) {
        if (!path) return;
        this.page.drawSvgPath(path, { x: 0, y: 0, color, opacity, borderWidth: 0 });
    }

    private polylinePath(points: Point[], bulges: number[] | undefined, closed: boolean): string {
        if (points.length === 0) return '';
        let d = `M ${this.m(points[0])}`;
        const n = points.length;
        const segs = closed ? n : n - 1;
        for (let i = 0; i < segs; i++) {
            const a = points[i], b = points[(i + 1) % n];
            const bulge = bulges?.[i] ?? 0;
            const arc = Math.abs(bulge) > 1e-12 ? bulgeArc(a, b, bulge) : null;
            if (arc) {
                const r = fmt(arc.r * this.k);
                d += ` A ${r} ${r} 0 ${Math.abs(arc.sweep) > Math.PI ? 1 : 0} ${arc.sweep > 0 ? 0 : 1} ${this.m(b)}`;
            } else {
                d += ` L ${this.m(b)}`;
            }
        }
        return closed ? `${d} Z` : d;
    }

    draw(p: Primitive, color: RGB, width: number, layerLinetype?: string) {
        const dash = this.dash(p, layerLinetype);
        switch (p.kind) {
            case 'line':
                this.stroke(`M ${this.m(p.a)} L ${this.m(p.b)}`, color, width, dash);
                break;
            case 'circle': {
                const r = fmt(p.r * this.k);
                const a = { x: p.c.x + p.r, y: p.c.y }, b = { x: p.c.x - p.r, y: p.c.y };
                const path = `M ${this.m(a)} A ${r} ${r} 0 1 0 ${this.m(b)} A ${r} ${r} 0 1 0 ${this.m(a)} Z`;
                if (p.fill) this.fill(path, color); else this.stroke(path, color, width, dash);
                break;
            }
            case 'arc': {
                const sweep = ccwSweep(p.start, p.end);
                const s = { x: p.c.x + p.r * Math.cos(p.start), y: p.c.y + p.r * Math.sin(p.start) };
                const e = { x: p.c.x + p.r * Math.cos(p.start + sweep), y: p.c.y + p.r * Math.sin(p.start + sweep) };
                const r = fmt(p.r * this.k);
                this.stroke(`M ${this.m(s)} A ${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 0 ${this.m(e)}`, color, width, dash);
                break;
            }
            case 'ellipse': {
                const at = (t: number) => {
                    const lx = p.rx * Math.cos(t), ly = p.ry * Math.sin(t);
                    return { x: p.c.x + lx * Math.cos(p.rotation) - ly * Math.sin(p.rotation), y: p.c.y + lx * Math.sin(p.rotation) + ly * Math.cos(p.rotation) };
                };
                const rx = fmt(p.rx * this.k), ry = fmt(p.ry * this.k), rot = fmt((-p.rotation * 180) / Math.PI);
                if (p.sweep >= TAU - 1e-9) {
                    const a = at(0), b = at(Math.PI);
                    this.stroke(`M ${this.m(a)} A ${rx} ${ry} ${rot} 1 0 ${this.m(b)} A ${rx} ${ry} ${rot} 1 0 ${this.m(a)} Z`, color, width, dash);
                } else {
                    this.stroke(`M ${this.m(at(p.start))} A ${rx} ${ry} ${rot} ${p.sweep > Math.PI ? 1 : 0} 0 ${this.m(at(p.start + p.sweep))}`, color, width, dash);
                }
                break;
            }
            case 'polyline': {
                const path = this.polylinePath(p.points, p.bulges, p.closed);
                if (p.fill) this.fill(path, color); else this.stroke(path, color, width, dash);
                break;
            }
            case 'spline': {
                if (p.beziers.length === 0) break;
                let d = `M ${this.m(p.beziers[0].p0)}`;
                for (const s of p.beziers) d += ` C ${this.m(s.c1)} ${this.m(s.c2)} ${this.m(s.p1)}`;
                this.stroke(p.closed ? `${d} Z` : d, color, width, dash);
                break;
            }
            case 'text': {
                const text = cleanPdfText(p.content);
                if (!text) break;
                const size = Math.max(3, p.height * this.k);
                const f = p.bold ? this.bold : this.font;
                const w = f.widthOfTextAtSize(text, size);
                // top-anchored text → baseline, then horizontal alignment along the text direction
                const shift = p.align === 'center' ? -w / 2 : p.align === 'right' ? -w : 0;
                const top = this.toPdf(p.position);
                const c = Math.cos(p.rotation), s = Math.sin(p.rotation);
                const capH = size * 0.72;
                const x = top.x + shift * c + capH * s;
                const y = top.y + shift * s - capH * c;
                this.page.drawText(text, { x, y, size, font: f, color, rotate: degrees((p.rotation * 180) / Math.PI) });
                break;
            }
            case 'point': {
                const q = this.toPdf(p.p);
                this.page.drawCircle({ x: q.x, y: q.y, size: 0.8, color });
                break;
            }
            case 'hatch': {
                if (p.pattern === 'SOLID') {
                    this.fill(p.rings.map((r) => this.polylinePath(r, undefined, true)).join(' '), color, 0.35);
                    break;
                }
                const { segments } = hatchSegments(p.rings, p.pattern, p.scale, p.angle);
                // one path per few hundred segments keeps the content stream compact
                for (let i = 0; i < segments.length; i += 400) {
                    const d = segments.slice(i, i + 400).map(([a, b]) => `M ${this.m(a)} L ${this.m(b)}`).join(' ');
                    this.stroke(d, color, Math.min(width, 0.5));
                }
                break;
            }
        }
    }
}

function cleanPdfText(str: string): string {
    if (!str) return '';
    return str
        .replace(/[\r\n]+/g, ' ')
        .replace(/⌀/g, 'Ø')
        .replace(/[^\x20-\x7E\xA0-\xFF]/g, (char) => {
            const map: Record<string, string> = {
                'ı': 'i', 'İ': 'I', 'ş': 's', 'Ş': 'S', 'ğ': 'g', 'Ğ': 'G',
                'ü': 'u', 'Ü': 'U', 'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C',
                '—': '-', '–': '-', '“': '"', '”': '"', '‘': "'", '’': "'",
                '±': '+/-', '°': ' deg', 'µ': 'u'
            };
            return map[char] || '';
        });
}
