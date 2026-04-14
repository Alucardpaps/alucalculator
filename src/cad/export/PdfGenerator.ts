import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { CadEntity, Layer, Point } from '../kernel/types';

/**
 * Generate PDF Sheet from CAD Sketch
 */
export async function generatePDF(entities: CadEntity[], layers: Layer[], canvasElement: HTMLCanvasElement | null): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([841.89, 595.28]); // A4 Landscape
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // ─────────────────────────────────────────────────────────────
    // TITLE BLOCK (Bottom Right)
    // ─────────────────────────────────────────────────────────────
    const blockWidth = 250;
    const blockHeight = 60;
    const padding = 20;

    const tx = width - blockWidth - padding;
    const ty = padding;

    // Outer Rectangle
    page.drawRectangle({
        x: tx, y: ty, width: blockWidth, height: blockHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
    });

    // Content
    page.drawText('AluCAD Professional Sheet', { x: tx + 10, y: ty + 40, size: 12, font: boldFont, color: rgb(0, 0, 0) });
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: tx + 10, y: ty + 20, size: 10, font: font });
    page.drawText(`Entities: ${entities.length}`, { x: tx + 10, y: ty + 5, size: 10, font: font });

    // ─────────────────────────────────────────────────────────────
    // VIEWPORT IMAGE
    // ─────────────────────────────────────────────────────────────
    // Embed the visible canvas content as an image
    if (canvasElement) {
        try {
            // Get data URL from canvas
            const dataUrl = canvasElement.toDataURL('image/png');
            const pngImageBytes = Uint8Array.from(atob(dataUrl.split(',')[1]), c => c.charCodeAt(0));

            const image = await pdfDoc.embedPng(pngImageBytes);
            const imgDims = image.scaleToFit(width - padding * 2, height - blockHeight - padding * 3);

            // Center image
            const imgX = (width - imgDims.width) / 2;
            const imgY = height - imgDims.height - padding;

            page.drawImage(image, {
                x: imgX,
                y: imgY,
                width: imgDims.width,
                height: imgDims.height,
            });

            // Viewport Box
            page.drawRectangle({
                x: imgX, y: imgY, width: imgDims.width, height: imgDims.height,
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
            });
        } catch (e) {
            console.error("Failed to embed viewport image in PDF:", e);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // BOM TABLE (Left Side Placeholder)
    // ─────────────────────────────────────────────────────────────
    const bomX = padding;
    const bomY = height - padding - 20;
    page.drawText('BILL OF MATERIALS', { x: bomX, y: bomY, size: 10, font: boldFont });

    // List Layers and counts
    let currentY = bomY - 15;
    layers.forEach(layer => {
        const count = entities.filter(e => e.layerId === layer.id).length;
        if (count > 0) {
            page.drawText(`Layer: ${layer.name} - ${count} items`, { x: bomX, y: currentY, size: 8, font });
            currentY -= 12;
        }
    });

    return await pdfDoc.save();
}
