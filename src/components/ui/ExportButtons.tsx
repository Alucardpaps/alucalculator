/**
 * AluCalculator V2 — Engineering Report Exporter
 * 
 * Generates:
 * - PDF engineering reports with full traceability
 * - DXF geometry files for CAD/CNC
 */

'use client';

import { jsPDF } from 'jspdf';
import type { CalculationResult } from '@/types/engineering';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';

// ============================================
// PDF REPORT GENERATOR
// ============================================

export interface PDFReportOptions {
    title?: string;
    company?: string;
    engineer?: string;
    projectNumber?: string;
    includeFormulas?: boolean;
    includeAssumptions?: boolean;
}

export function generatePDFReport(
    schema: CalculatorSchemaV2,
    result: CalculationResult,
    inputs: Record<string, number>,
    options: PDFReportOptions = {}
): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // ===== HEADER =====
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(options.title || schema.metadata.title, pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toISOString().split('T')[0]}`, pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Verification badge
    doc.setFontSize(12);
    if (result.verified) {
        doc.setTextColor(0, 128, 0);
        doc.text('✓ VERIFIED', pageWidth / 2, y, { align: 'center' });
    } else {
        doc.setTextColor(255, 0, 0);
        doc.text('⚠ UNVERIFIED', pageWidth / 2, y, { align: 'center' });
    }
    doc.setTextColor(0, 0, 0);
    y += 15;

    // ===== PROJECT INFO =====
    if (options.company || options.engineer || options.projectNumber) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Project Information', 20, y);
        y += 6;
        doc.setFont('helvetica', 'normal');

        if (options.company) {
            doc.text(`Company: ${options.company}`, 20, y);
            y += 5;
        }
        if (options.engineer) {
            doc.text(`Engineer: ${options.engineer}`, 20, y);
            y += 5;
        }
        if (options.projectNumber) {
            doc.text(`Project #: ${options.projectNumber}`, 20, y);
            y += 5;
        }
        y += 5;
    }

    // ===== INPUTS =====
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Input Parameters', 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    schema.inputs.forEach((input) => {
        const value = inputs[input.key] ?? input.defaultValue ?? '-';
        doc.text(`${input.label}: ${value} ${input.unit}`, 25, y);
        y += 5;

        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    });
    y += 10;

    // ===== OUTPUTS =====
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Calculation Results', 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    Object.entries(result.outputs).forEach(([key, val]) => {
        const outputDef = schema.outputs.find((o) => o.key === key);
        const label = outputDef?.label || key;
        const unit = outputDef?.unit || val.unit;

        let displayValue = typeof val.value === 'number'
            ? val.value.toFixed(val.precision ?? 3)
            : String(val.value);

        let line = `${label}: ${displayValue} ${unit}`;

        if (!val.verified) {
            line += ' [UNVERIFIED]';
        }
        if (val.source === 'assumed' && val.assumptionNote) {
            line += ` (${val.assumptionNote})`;
        }

        doc.text(line, 25, y);
        y += 5;

        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    });
    y += 10;

    // ===== WARNINGS =====
    if (result.warnings.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(200, 100, 0);
        doc.text('Warnings', 20, y);
        y += 8;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        result.warnings.forEach((w) => {
            const prefix = w.severity === 'critical' ? '🔴' : w.severity === 'warning' ? '⚠️' : 'ℹ️';
            doc.text(`${prefix} [${w.field}] ${w.message}`, 25, y);
            y += 5;
        });
        doc.setTextColor(0, 0, 0);
        y += 10;
    }

    // ===== FORMULAS =====
    if (options.includeFormulas !== false && result.formulaTrace) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Formulas Applied', 20, y);
        y += 8;

        doc.setFontSize(9);
        doc.setFont('courier', 'normal');

        Object.entries(result.formulaTrace).forEach(([key, latex]) => {
            doc.text(`${key}: ${latex}`, 25, y);
            y += 5;

            if (y > 270) {
                doc.addPage();
                y = 20;
            }
        });
        doc.setFont('helvetica', 'normal');
        y += 10;
    }

    // ===== ASSUMPTIONS =====
    if (options.includeAssumptions !== false) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Assumptions', 20, y);
        y += 8;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        schema.documentation.assumptions.forEach((a) => {
            const impact = a.impact === 'high' ? '⚠️' : a.impact === 'medium' ? '⚡' : '✓';
            doc.text(`${impact} ${a.text}`, 25, y, { maxWidth: pageWidth - 45 });
            y += 8;

            if (y > 270) {
                doc.addPage();
                y = 20;
            }
        });
        y += 10;
    }

    // ===== STANDARDS =====
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Referenced Standards', 20, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    schema.documentation.standards.forEach((std) => {
        doc.text(`• ${std.code}${std.section ? ' §' + std.section : ''}: ${std.title}`, 25, y);
        y += 5;
    });
    y += 10;

    // ===== FOOTER =====
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
        `Generated by AluCalculator v${schema.metadata.version} | ${schema.metadata.verifiedStandards.join(', ')}`,
        pageWidth / 2,
        285,
        { align: 'center' }
    );

    // Save
    const filename = `${schema.id}_report_${Date.now()}.pdf`;
    doc.save(filename);
}

// ============================================
// DXF GEOMETRY EXPORTER
// ============================================

export interface DXFExportOptions {
    scale?: number; // Default 1
    layer?: string;
    color?: number; // AutoCAD color index
}

/**
 * Generate DXF content for gear geometry
 */
export function generateGearDXF(
    pitchDiameter: number,
    tipDiameter: number,
    rootDiameter: number,
    teethCount: number,
    module: number,
    options: DXFExportOptions = {}
): string {
    const scale = options.scale ?? 1;
    const layer = options.layer ?? '0';

    let dxf = `0
SECTION
2
HEADER
0
ENDSEC
0
SECTION
2
ENTITIES
`;

    // Pitch circle
    dxf += generateCircle(0, 0, (pitchDiameter * scale) / 2, layer, 3); // Yellow

    // Tip circle
    dxf += generateCircle(0, 0, (tipDiameter * scale) / 2, layer, 1); // Red

    // Root circle
    dxf += generateCircle(0, 0, (rootDiameter * scale) / 2, layer, 5); // Blue

    // Center mark
    dxf += generateLine(-5, 0, 5, 0, layer, 7);
    dxf += generateLine(0, -5, 0, 5, layer, 7);

    // Add teeth indication lines
    const angleStep = (2 * Math.PI) / teethCount;
    for (let i = 0; i < teethCount; i++) {
        const angle = i * angleStep;
        const x1 = (rootDiameter * scale / 2) * Math.cos(angle);
        const y1 = (rootDiameter * scale / 2) * Math.sin(angle);
        const x2 = (tipDiameter * scale / 2) * Math.cos(angle);
        const y2 = (tipDiameter * scale / 2) * Math.sin(angle);
        dxf += generateLine(x1, y1, x2, y2, layer, 8); // Gray lines for teeth
    }

    dxf += `0
ENDSEC
0
EOF`;

    return dxf;
}

function generateCircle(cx: number, cy: number, radius: number, layer: string, color: number): string {
    return `0
CIRCLE
8
${layer}
62
${color}
10
${cx}
20
${cy}
40
${radius}
`;
}

function generateLine(x1: number, y1: number, x2: number, y2: number, layer: string, color: number): string {
    return `0
LINE
8
${layer}
62
${color}
10
${x1}
20
${y1}
11
${x2}
21
${y2}
`;
}

/**
 * Download DXF file
 */
export function downloadDXF(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.dxf') ? filename : `${filename}.dxf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================
// COMBINED EXPORT COMPONENT
// ============================================

export interface ExportButtonsProps {
    schema: CalculatorSchemaV2;
    result: CalculationResult;
    inputs: Record<string, number>;
    gearData?: {
        pitchDiameter: number;
        tipDiameter: number;
        rootDiameter: number;
        teethCount: number;
        module: number;
    };
}

export function ExportButtons({ schema, result, inputs, gearData }: ExportButtonsProps) {
    const handlePDFExport = () => {
        generatePDFReport(schema, result, inputs, {
            includeFormulas: true,
            includeAssumptions: true,
        });
    };

    const handleDXFExport = () => {
        if (!gearData) {
            alert('DXF export requires geometry data');
            return;
        }

        const dxf = generateGearDXF(
            gearData.pitchDiameter,
            gearData.tipDiameter,
            gearData.rootDiameter,
            gearData.teethCount,
            gearData.module
        );

        downloadDXF(dxf, `${schema.id}_geometry`);
    };

    return (
        <div className="export-buttons">
            <button onClick={handlePDFExport} className="export-btn pdf">
                📄 Export PDF Report
            </button>

            {gearData && (
                <button onClick={handleDXFExport} className="export-btn dxf">
                    📐 Export DXF Geometry
                </button>
            )}

            <style jsx>{`
        .export-buttons {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }
        
        .export-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .export-btn.pdf {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white;
        }
        
        .export-btn.pdf:hover {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          transform: translateY(-1px);
        }
        
        .export-btn.dxf {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
        }
        
        .export-btn.dxf:hover {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          transform: translateY(-1px);
        }
      `}</style>
        </div>
    );
}

export default ExportButtons;
