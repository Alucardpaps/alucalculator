'use client';

import { useState } from 'react';
import { FileDown, Camera } from 'lucide-react';
import { toPng } from 'html-to-image';
import { drawApprovalBlock, drawBrandedFooters, drawBrandedHeader, pdfSafe } from '@/lib/report/pdfBranding';

interface PDFGeneratorProps {
    filename: string;
    title: string;
    // Data sections
    inputs: Record<string, any>;
    results: Record<string, any>;
    // Visual capture target
    visualElementId?: string;
    // Additional notes
    notes?: string[];
}

export function PDFGenerator({ filename, title, inputs, results, visualElementId, notes }: PDFGeneratorProps) {
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            // dynamic imports
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF();

            // 1. Header — company logo/name (Settings → Reports)
            const startY = drawBrandedHeader(doc, title.toUpperCase(), new Date().toLocaleString());

            let currentY = startY;

            // 2. Visual Capture (2D/3D)
            if (visualElementId) {
                const element = document.getElementById(visualElementId);
                if (element) {
                    try {
                        // Use html-to-image which supports modern CSS (like oklab) better than html2canvas
                        const imgData = await toPng(element, {
                            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-1').trim() || '#16181c',
                            cacheBust: true,
                            pixelRatio: 2, // High res for PDF
                        });

                        // Calculate aspect ratio to fit PDF width (max 180mm)
                        const imgProps = doc.getImageProperties(imgData);
                        let pdfWidth = 180;
                        let pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                        if (pdfHeight > 140) { pdfWidth *= 140 / pdfHeight; pdfHeight = 140; }

                        doc.addImage(imgData, 'PNG', 15 + (180 - pdfWidth) / 2, currentY, pdfWidth, pdfHeight);
                        currentY += pdfHeight + 10;
                    } catch (captureErr) {
                        console.error("Visual capture failed:", captureErr);
                        doc.setTextColor(255, 0, 0);
                        doc.text("[Visual Capture Failed - Check Console]", 15, currentY);
                        currentY += 10;
                    }
                }
            }

            // 3. Inputs Table
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text("Design Parameters", 14, currentY);
            currentY += 5;

            const inputRows = Object.entries(inputs).map(([k, v]) => [pdfSafe(String(k)), pdfSafe(String(v))]);
            autoTable(doc, {
                startY: currentY,
                head: [['Parameter', 'Value']],
                body: inputRows,
                theme: 'grid',
                headStyles: { fillColor: [60, 64, 72] },
                styles: { fontSize: 10 },
                margin: { bottom: 18 }
            });
            currentY = (doc as any).lastAutoTable.finalY + 15;

            // 4. Results Table
            doc.setFontSize(14);
            doc.text("Analysis Results", 14, currentY);
            currentY += 5;

            const resultRows = Object.entries(results).map(([k, v]) => [pdfSafe(String(k)), pdfSafe(String(v))]);
            autoTable(doc, {
                startY: currentY,
                head: [['Result', 'Value']],
                body: resultRows,
                theme: 'grid',
                headStyles: { fillColor: [24, 110, 140] },
                styles: { fontSize: 10, fontStyle: 'bold' },
                margin: { bottom: 18 }
            });
            currentY = (doc as any).lastAutoTable.finalY + 15;

            // 5. Notes / Production Info
            if (notes && notes.length > 0) {
                doc.setFontSize(14);
                doc.text("Production Notes", 14, currentY);
                currentY += 5;

                doc.setFontSize(10);
                doc.setTextColor(80, 80, 80);
                notes.forEach(note => {
                    const lines = doc.splitTextToSize(`- ${pdfSafe(note)}`, 182);
                    if (currentY + lines.length * 5 > 275) { doc.addPage(); currentY = 20; }
                    doc.text(lines, 14, currentY);
                    currentY += lines.length * 5 + 1;
                });
            }

            // Designed / Checked / Approved block + footers
            drawApprovalBlock(doc, currentY + 4, document.documentElement.lang);
            drawBrandedFooters(doc, 'Authorized engineering document - verify before manufacturing');

            doc.save(`${filename}.pdf`);

        } catch (e) {
            console.error(e);
            alert("Failed to generate PDF. See console.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3 bg-[var(--bg-2)] hover:bg-[var(--hover)] text-[var(--ink)] rounded border border-[var(--line)] flex items-center justify-center gap-2 transition-all active:scale-95 text-xs font-bold uppercase tracking-wider"
        >
            {generating ? (
                <span className="animate-pulse">Generating...</span>
            ) : (
                <>
                    <FileDown size={14} />
                    Export PDF Report
                </>
            )}
        </button>
    );
}
