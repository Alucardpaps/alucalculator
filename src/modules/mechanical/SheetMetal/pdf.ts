/**
 * modules/mechanical/SheetMetal/pdf.ts
 * 
 * Generates standard reports for the Sheet Metal Engine, including its metadata.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SheetMetalInput, SheetMetalResult } from './engine';
import { EngineMetadata } from '@/engine/project/ProjectSchema';
import { drawApprovalBlock, drawBrandedFooters, drawBrandedHeader, pdfSafe } from '@/lib/report/pdfBranding';

export const generateSheetMetalPDF = async (
    input: SheetMetalInput,
    result: SheetMetalResult,
    metadata: EngineMetadata
) => {
    const doc = new jsPDF();

    // Header — company logo/name from Settings → Reports
    const y0 = drawBrandedHeader(doc, 'Sheet Metal Bending Analysis', new Date().toLocaleString());

    // Metadata block
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Report Date: ${new Date().toLocaleString()}`, 14, y0);
    doc.text(`Engine Version: ${metadata.engineVersion}`, 14, y0 + 5);
    doc.text(`Status: ${metadata.validationStatus.toUpperCase()}`, 14, y0 + 10);
    doc.text(`Calculation ID: ${metadata.calculationId}`, 14, y0 + 15);

    // Inputs Table
    autoTable(doc, {
        startY: y0 + 24,
        head: [['Parameter', 'Value', 'Unit']],
        body: [
            ['Material', pdfSafe(String(input.material)), '-'],
            ['Thickness', input.thickness.toString(), 'mm'],
            ['Bend Angle', input.bendAngle.toString(), 'deg'],
            ['Inner Radius', input.innerRadius.toString(), 'mm'],
            ['K-Factor', input.kFactor.toString(), '-'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [60, 64, 72] }
    });

    // Results Table
    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 15,
        head: [['Result', 'Value', 'Unit']],
        body: [
            ['Bend Allowance (BA)', result.bendAllowance.toString(), 'mm'],
            ['Bend Deduction (BD)', result.bendDeduction.toString(), 'mm'],
            ['Outside Setback (OSSB)', result.outsideSetback.toString(), 'mm'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [24, 110, 140] }
    });

    // Hash & Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.text(`Validation Hash: ${metadata.calculationHash}`, 14, finalY);

    if (metadata.warnings && metadata.warnings.length > 0) {
        doc.setTextColor(200, 0, 0);
        doc.text('Warnings:', 14, finalY + 10);
        metadata.warnings.forEach((w, i) => {
            doc.text(`- ${pdfSafe(w)}`, 14, finalY + 15 + (i * 5));
        });
    }

    const warnH = metadata.warnings?.length ? 15 + metadata.warnings.length * 5 : 0;
    drawApprovalBlock(doc, finalY + 6 + warnH, typeof document !== 'undefined' ? document.documentElement.lang : 'en');
    drawBrandedFooters(doc);

    doc.save(`SheetMetal_Report_${metadata.calculationId}.pdf`);
};
