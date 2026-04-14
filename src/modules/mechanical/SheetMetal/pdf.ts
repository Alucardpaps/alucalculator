/**
 * modules/mechanical/SheetMetal/pdf.ts
 * 
 * Generates standard reports for the Sheet Metal Engine, including its metadata.
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { SheetMetalInput, SheetMetalResult } from './engine';
import { EngineMetadata } from '@/engine/project/ProjectSchema';

export const generateSheetMetalPDF = async (
    input: SheetMetalInput,
    result: SheetMetalResult,
    metadata: EngineMetadata
) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.text('AluCalc Engineering Report', 14, 22);

    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text('Sheet Metal Bending Analysis', 14, 30);

    // Metadata block
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Report Date: ${new Date().toLocaleString()}`, 14, 45);
    doc.text(`Engine Version: ${metadata.engineVersion}`, 14, 50);
    doc.text(`Status: ${metadata.validationStatus.toUpperCase()}`, 14, 55);
    doc.text(`Calculation ID: ${metadata.calculationId}`, 14, 60);

    // Inputs Table
    (doc as any).autoTable({
        startY: 70,
        head: [['Parameter', 'Value', 'Unit']],
        body: [
            ['Material', input.material, '-'],
            ['Thickness', input.thickness.toString(), 'mm'],
            ['Bend Angle', input.bendAngle.toString(), 'deg'],
            ['Inner Radius', input.innerRadius.toString(), 'mm'],
            ['K-Factor', input.kFactor.toString(), '-'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }
    });

    // Results Table
    (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 15,
        head: [['Result', 'Value', 'Unit']],
        body: [
            ['Bend Allowance (BA)', result.bendAllowance.toString(), 'mm'],
            ['Bend Deduction (BD)', result.bendDeduction.toString(), 'mm'],
            ['Outside Setback (OSSB)', result.outsideSetback.toString(), 'mm'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [39, 174, 96] }
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
            doc.text(`- ${w}`, 14, finalY + 15 + (i * 5));
        });
    }

    doc.save(`SheetMetal_Report_${metadata.calculationId}.pdf`);
};
