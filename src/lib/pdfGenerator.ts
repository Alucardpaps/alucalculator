/**
 * Engineering Report PDF Generator
 * 
 * Generates professional engineering calculation reports using jsPDF
 * Supports: Gear analysis, Material specs, Strength calculations
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportSection {
    title: string;
    content?: string;
    table?: {
        headers: string[];
        rows: (string | number)[][];
    };
    keyValues?: { label: string; value: string; unit?: string }[];
    notes?: string[];
    status?: 'pass' | 'warning' | 'fail';
}

export interface ReportConfig {
    title: string;
    subtitle?: string;
    projectName?: string;
    projectNumber?: string;
    author?: string;
    company?: string;
    date?: Date;
    sections: ReportSection[];
    footer?: string;
}

// Color palette
const COLORS = {
    primary: [99, 102, 241] as [number, number, number],      // Indigo
    secondary: [139, 92, 246] as [number, number, number],    // Purple
    success: [16, 185, 129] as [number, number, number],      // Green
    warning: [251, 191, 36] as [number, number, number],      // Amber
    danger: [239, 68, 68] as [number, number, number],        // Red
    text: [30, 30, 46] as [number, number, number],
    textDim: [100, 100, 120] as [number, number, number],
    border: [220, 220, 235] as [number, number, number],
    bg: [250, 250, 252] as [number, number, number],
};

/**
 * Generate PDF engineering report
 */
export function generateEngineeringPDF(config: ReportConfig): jsPDF {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // ===== HEADER =====
    // Background stripe
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(config.title.toUpperCase(), margin, 18);

    // Subtitle
    if (config.subtitle) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(config.subtitle, margin, 26);
    }

    // Date & project info (right side)
    doc.setFontSize(9);
    const dateStr = (config.date || new Date()).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
    doc.text(dateStr, pageWidth - margin, 18, { align: 'right' });

    if (config.projectNumber) {
        doc.text(`Project: ${config.projectNumber}`, pageWidth - margin, 26, { align: 'right' });
    }

    y = 45;

    // ===== PROJECT INFO BOX =====
    if (config.projectName || config.author || config.company) {
        doc.setFillColor(...COLORS.bg);
        doc.setDrawColor(...COLORS.border);
        doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

        doc.setTextColor(...COLORS.text);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');

        let infoX = margin + 5;
        if (config.projectName) {
            doc.text('Project:', infoX, y + 8);
            doc.setFont('helvetica', 'normal');
            doc.text(config.projectName, infoX + 20, y + 8);
            doc.setFont('helvetica', 'bold');
        }

        if (config.author) {
            doc.text('Engineer:', infoX, y + 15);
            doc.setFont('helvetica', 'normal');
            doc.text(config.author, infoX + 22, y + 15);
        }

        if (config.company) {
            doc.setFont('helvetica', 'normal');
            doc.text(config.company, pageWidth - margin - 5, y + 8, { align: 'right' });
        }

        y += 28;
    }

    // ===== SECTIONS =====
    config.sections.forEach((section, sectionIdx) => {
        // Check for page break
        if (y > pageHeight - 50) {
            doc.addPage();
            y = margin;
        }

        // Section header
        doc.setFillColor(...COLORS.primary);
        doc.rect(margin, y, contentWidth, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${sectionIdx + 1}. ${section.title.toUpperCase()}`, margin + 3, y + 5.5);

        // Status badge
        if (section.status) {
            const statusColors = {
                pass: COLORS.success,
                warning: COLORS.warning,
                fail: COLORS.danger,
            };
            const statusText = section.status.toUpperCase();
            doc.setFillColor(...statusColors[section.status]);
            const badgeWidth = doc.getTextWidth(statusText) + 6;
            doc.roundedRect(pageWidth - margin - badgeWidth - 2, y + 1.5, badgeWidth, 5, 1, 1, 'F');
            doc.setFontSize(7);
            doc.text(statusText, pageWidth - margin - badgeWidth / 2 - 2, y + 5, { align: 'center' });
        }

        y += 12;

        // Content paragraph
        if (section.content) {
            doc.setTextColor(...COLORS.text);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(section.content, contentWidth - 4);
            doc.text(lines, margin + 2, y);
            y += lines.length * 4.5 + 4;
        }

        // Key-Value pairs
        if (section.keyValues && section.keyValues.length > 0) {
            const kvCols = 2;
            const kvColWidth = (contentWidth - 4) / kvCols;

            section.keyValues.forEach((kv, idx) => {
                const col = idx % kvCols;
                const row = Math.floor(idx / kvCols);
                const x = margin + 2 + col * kvColWidth;
                const kvY = y + row * 7;

                // Check for page break mid-table
                if (kvY > pageHeight - 30) {
                    doc.addPage();
                    y = margin;
                }

                doc.setTextColor(...COLORS.textDim);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(kv.label + ':', x, kvY);

                doc.setTextColor(...COLORS.text);
                doc.setFont('helvetica', 'bold');
                const valueStr = kv.unit ? `${kv.value} ${kv.unit}` : kv.value;
                doc.text(valueStr, x + kvColWidth * 0.5, kvY);
            });

            const kvRows = Math.ceil(section.keyValues.length / kvCols);
            y += kvRows * 7 + 4;
        }

        // Table
        if (section.table) {
            autoTable(doc, {
                startY: y,
                margin: { left: margin, right: margin },
                head: [section.table.headers],
                body: section.table.rows.map(row => row.map(cell => String(cell))),
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    textColor: COLORS.text,
                },
                headStyles: {
                    fillColor: COLORS.secondary,
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                },
                alternateRowStyles: {
                    fillColor: COLORS.bg,
                },
                theme: 'grid',
            });

            // Get final Y after table
            y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
            y += 6;
        }

        // Notes
        if (section.notes && section.notes.length > 0) {
            doc.setFillColor(...COLORS.bg);
            doc.roundedRect(margin, y, contentWidth, section.notes.length * 5 + 4, 2, 2, 'F');

            doc.setTextColor(...COLORS.textDim);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'italic');

            section.notes.forEach((note, i) => {
                doc.text(`• ${note}`, margin + 3, y + 4 + i * 5);
            });

            y += section.notes.length * 5 + 8;
        }

        y += 6;
    });

    // ===== FOOTER =====
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Footer line
        doc.setDrawColor(...COLORS.border);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        // Footer text
        doc.setTextColor(...COLORS.textDim);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');

        const footerText = config.footer || 'Generated by Engineering Workstation';
        doc.text(footerText, margin, pageHeight - 7);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    }

    return doc;
}

/**
 * Generate and download PDF
 */
export function downloadEngineeringPDF(config: ReportConfig, filename?: string): void {
    const doc = generateEngineeringPDF(config);
    const name = filename || `${config.title.toLowerCase().replace(/\s+/g, '_')}_report.pdf`;
    doc.save(name);
}

/**
 * Generate Gear Analysis Report
 */
export function generateGearReport(
    gearParams: {
        module: number;
        teethPinion: number;
        teethGear: number;
        faceWidth: number;
        pressureAngle: number;
    },
    results: {
        pitchDiameterPinion: number;
        pitchDiameterGear: number;
        centerDistance: number;
        transmissionRatio: number;
        contactStress: number;
        bendingStressPinion: number;
        bendingStressGear: number;
        safetyContact: number;
        safetyBendingPinion: number;
        safetyBendingGear: number;
        status: string;
    },
    projectInfo?: { name?: string; number?: string; author?: string; company?: string }
): void {
    const minSafety = Math.min(results.safetyContact, results.safetyBendingPinion, results.safetyBendingGear);
    const overallStatus = minSafety >= 1.5 ? 'pass' : minSafety >= 1.0 ? 'warning' : 'fail';

    const config: ReportConfig = {
        title: 'Gear Strength Analysis',
        subtitle: 'ISO 6336 / AGMA 2001 Method',
        projectName: projectInfo?.name,
        projectNumber: projectInfo?.number,
        author: projectInfo?.author,
        company: projectInfo?.company,
        date: new Date(),
        footer: 'Generated by AluCalculator Engineering Workstation',
        sections: [
            {
                title: 'Input Parameters',
                keyValues: [
                    { label: 'Module', value: gearParams.module.toString(), unit: 'mm' },
                    { label: 'Pinion Teeth', value: gearParams.teethPinion.toString() },
                    { label: 'Gear Teeth', value: gearParams.teethGear.toString() },
                    { label: 'Face Width', value: gearParams.faceWidth.toString(), unit: 'mm' },
                    { label: 'Pressure Angle', value: gearParams.pressureAngle.toString(), unit: '°' },
                ],
            },
            {
                title: 'Geometry Results',
                keyValues: [
                    { label: 'Pitch Ø Pinion', value: results.pitchDiameterPinion.toFixed(2), unit: 'mm' },
                    { label: 'Pitch Ø Gear', value: results.pitchDiameterGear.toFixed(2), unit: 'mm' },
                    { label: 'Center Distance', value: results.centerDistance.toFixed(2), unit: 'mm' },
                    { label: 'Transmission Ratio', value: results.transmissionRatio.toFixed(3) },
                ],
            },
            {
                title: 'Strength Analysis',
                status: overallStatus,
                table: {
                    headers: ['Parameter', 'Value', 'Unit', 'Safety Factor'],
                    rows: [
                        ['Contact Stress (σH)', results.contactStress.toFixed(1), 'MPa', results.safetyContact.toFixed(2)],
                        ['Bending Stress Pinion (σF1)', results.bendingStressPinion.toFixed(1), 'MPa', results.safetyBendingPinion.toFixed(2)],
                        ['Bending Stress Gear (σF2)', results.bendingStressGear.toFixed(1), 'MPa', results.safetyBendingGear.toFixed(2)],
                    ],
                },
                notes: [
                    'Contact stress calculated per ISO 6336-2 simplified method',
                    'Bending stress calculated per ISO 6336-3 simplified method',
                    'Minimum recommended safety factor: 1.5',
                ],
            },
            {
                title: 'Conclusion',
                content: minSafety >= 1.5
                    ? `Design is ACCEPTABLE. Minimum safety factor is ${minSafety.toFixed(2)}, which exceeds the recommended minimum of 1.5.`
                    : minSafety >= 1.0
                        ? `Design requires REVIEW. Minimum safety factor is ${minSafety.toFixed(2)}, which is below the recommended 1.5 but above 1.0.`
                        : `Design is NOT ACCEPTABLE. Minimum safety factor is ${minSafety.toFixed(2)}, which is below 1.0. Redesign required.`,
            },
        ],
    };

    downloadEngineeringPDF(config, `gear_analysis_${projectInfo?.number || 'report'}.pdf`);
}

/**
 * Generate Material Specification Report
 */
export function generateMaterialReport(
    materials: Array<{
        name: string;
        category: string;
        density: number;
        yield: number;
        tensile: number;
        youngsModulus: number;
        poissonsRatio: number;
        hardness: string;
    }>,
    projectInfo?: { name?: string; number?: string; author?: string }
): void {
    const config: ReportConfig = {
        title: 'Material Specification Sheet',
        subtitle: 'Engineering Material Properties',
        projectName: projectInfo?.name,
        projectNumber: projectInfo?.number,
        author: projectInfo?.author,
        date: new Date(),
        footer: 'Generated by AluCalculator Engineering Workstation',
        sections: [
            {
                title: 'Material Properties Summary',
                table: {
                    headers: ['Material', 'Category', 'Density\n(g/cm³)', 'Yield\n(MPa)', 'Tensile\n(MPa)', 'E\n(GPa)', 'ν', 'Hardness'],
                    rows: materials.map(m => [
                        m.name,
                        m.category,
                        m.density.toFixed(2),
                        m.yield.toString(),
                        m.tensile.toString(),
                        m.youngsModulus.toString(),
                        m.poissonsRatio.toFixed(2),
                        m.hardness,
                    ]),
                },
                notes: [
                    'Properties are typical values for reference',
                    'Actual values may vary by supplier and heat treatment',
                ],
            },
        ],
    };

    downloadEngineeringPDF(config, `material_spec_${projectInfo?.number || 'report'}.pdf`);
}
