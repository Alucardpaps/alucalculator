import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import { CadEntity, Layer, Point } from '../kernel/types';
import { RenderPipeline } from '../render/RenderPipeline';

interface TitleBlockData {
    partName?: string;
    designer?: string;
    approver?: string;
    company?: string;
}

interface PlotOptions {
    worldBounds?: { minX: number; minY: number; maxX: number; maxY: number };
    paperSize?: string;
    orientation?: 'LANDSCAPE' | 'PORTRAIT';
    scale?: string;
    showTitleBlock?: boolean;
    titleBlockData?: TitleBlockData;
}

const PAPER_SIZES: Record<string, [number, number]> = {
    'A4': [595.28, 841.89],
    'A3': [841.89, 1190.55],
    'A2': [1190.55, 1683.78],
    'Letter': [612, 792]
};

/**
 * Generate High-Fidelity PDF using Vector Graphics
 * 
 * v7: FINAL COORDINATE FIX - Centering and Scaling
 */
export async function generatePDF(
    entities: CadEntity[],
    layers: Layer[],
    canvasElement: HTMLCanvasElement | null,
    options: PlotOptions = {}
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    
    // 1. Setup Page Size
    const paperKey = options.paperSize || 'A4';
    let [paperW, paperH] = PAPER_SIZES[paperKey] || PAPER_SIZES['A4'];
    if (options.orientation === 'LANDSCAPE') [paperW, paperH] = [paperH, paperW];

    const page = pdfDoc.addPage([paperW, paperH]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const padding = 20;
    const titleBlockHeight = options.showTitleBlock ? 100 : 0;
    
    const plotArea = {
        x: padding,
        y: padding + titleBlockHeight,
        width: width - padding * 2,
        height: height - padding * 2 - titleBlockHeight
    };

    // 2. Viewport Calculation (World Space)
    let minX = options.worldBounds?.minX ?? -100;
    let minY = options.worldBounds?.minY ?? -100;
    let maxX = options.worldBounds?.maxX ?? 100;
    let maxY = options.worldBounds?.maxY ?? 100;

    const worldWidth = maxX - minX;
    const worldHeight = maxY - minY;

    // 3. Scaling
    let scale = 1.0;
    if (options.scale === 'FIT') {
        scale = Math.min(plotArea.width / worldWidth, plotArea.height / worldHeight);
    } else {
        const parts = options.scale?.split(':');
        if (parts?.length === 2) {
            scale = (parseFloat(parts[0]) / parseFloat(parts[1])) * 2.83465; // 1mm = 2.83pt
        }
    }

    // Offset to center the world bounds in the plot area if scaling to fit
    const offsetX = plotArea.x + (plotArea.width - worldWidth * scale) / 2;
    const offsetY = plotArea.y + (plotArea.height - worldHeight * scale) / 2;

    const toPdf = (p: Point): Point => ({
        x: offsetX + (p.x - minX) * scale,
        y: offsetY + (p.y - minY) * scale
    });

    // Draw frame for debugging visibility
    page.drawRectangle({
        x: plotArea.x, y: plotArea.y, width: plotArea.width, height: plotArea.height,
        borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.5
    });

    // 4. Vector Rendering
    for (const ent of entities) {
        if (ent.isVisible === false) continue;
        const g = ent.geometry as any;
        const color = hexToRgb(ent.color || '#000000');

        switch (g.type) {
            case 'LINE':
                page.drawLine({ start: toPdf(g.start), end: toPdf(g.end), color, thickness: 1 });
                break;
            case 'CIRCLE': {
                const c = toPdf(g.center);
                page.drawCircle({ x: c.x, y: c.y, size: g.radius * scale, borderColor: color, borderWidth: 1 });
                break;
            }
            case 'HEXAGON': {
                const sides = g.sides || 6;
                const r = g.radius * scale;
                const rot = g.rotation || 0;
                const c = toPdf(g.center);
                let prev: Point | null = null;
                for (let i = 0; i <= sides; i++) {
                    const a = rot + (Math.PI * 2 / sides) * i;
                    const p = { x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) };
                    if (prev) page.drawLine({ start: prev, end: p, color, thickness: 1 });
                    prev = p;
                }
                break;
            }
            case 'POLYLINE':
                if (g.vertices?.length > 1) {
                    const pts = g.vertices.map(toPdf);
                    for (let i = 0; i < pts.length - 1; i++) {
                        page.drawLine({ start: pts[i], end: pts[i+1], color, thickness: 1 });
                    }
                    if (g.closed) page.drawLine({ start: pts[pts.length-1], end: pts[0], color, thickness: 1 });
                }
                break;
            case 'GEAR': {
                const verts = RenderPipeline.computeGearVertices(g);
                const pts = verts.map(toPdf);
                for (let i = 0; i < pts.length - 1; i++) {
                    page.drawLine({ start: pts[i], end: pts[i+1], color, thickness: 1 });
                }
                page.drawLine({ start: pts[pts.length-1], end: pts[0], color, thickness: 1 });
                break;
            }
        }
    }

    // 5. Title Block
    if (options.showTitleBlock) {
        const d = options.titleBlockData || {};
        const bx = padding, by = padding, bw = width - padding*2, bh = titleBlockHeight - 10;
        page.drawRectangle({ x: bx, y: by, width: bw, height: bh, borderColor: rgb(0,0,0), borderWidth: 1.5 });
        page.drawLine({ start: { x: bx, y: by + bh*0.6 }, end: { x: bx + bw, y: by + bh*0.6 }, color: rgb(0,0,0), thickness: 0.5 });
        
        page.drawText(d.company || 'AluCAD', { x: bx+10, y: by+bh-25, size: 12, font: boldFont });
        page.drawText(d.partName || 'Drawing', { x: bx+10, y: by+bh-40, size: 9, font });

        const drawCell = (lbl: string, val: string, x: number) => {
            page.drawText(lbl, { x: x+5, y: by+25, size: 6, font });
            page.drawText(val || '-', { x: x+5, y: by+10, size: 8, font: boldFont });
        };
        drawCell('DESIGNER', d.designer || 'User', bx);
        drawCell('APPROVER', d.approver || '', bx + bw*0.4);
        drawCell('SCALE', options.scale || 'FIT', bx + bw*0.7);
    }

    return await pdfDoc.save();
}

function hexToRgb(hex: string) {
    if (!hex.startsWith('#')) return rgb(0,0,0);
    const r = parseInt(hex.slice(1,3), 16)/255;
    const g = parseInt(hex.slice(3,5), 16)/255;
    const b = parseInt(hex.slice(5,7), 16)/255;
    return rgb(r||0, g||0, b||0);
}
