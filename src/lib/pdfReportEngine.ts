import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';

export interface ReportMetadata {
    title: string;
    clientName?: string;
    projectName?: string;
    preparedBy?: string;
    referenceNo?: string;
    notes?: string;
}

export class PDFReportEngine {
    private doc: jsPDF;
    private metadata: ReportMetadata;
    private primaryColor: [number, number, number] = [220, 38, 38]; // Red-600
    private secondaryColor: [number, number, number] = [15, 20, 25]; // Dark slate

    constructor(metadata: ReportMetadata) {
        this.doc = new jsPDF();
        this.metadata = metadata;
        this.doc.setFont("helvetica");

        // Setup base document structure
        this.drawHeader();
        this.drawFooter();
    }

    private drawHeader() {
        const d = this.doc;
        // Background strip
        d.setFillColor(...this.secondaryColor);
        d.rect(0, 0, 210, 40, 'F');

        // Brand Line
        d.setFillColor(...this.primaryColor);
        d.rect(0, 39, 210, 1, 'F');

        // Logo / Title
        d.setTextColor(255, 255, 255);
        d.setFontSize(24);
        d.setFont("helvetica", "bold");
        d.text("AluCalc OS", 14, 20);

        d.setFontSize(10);
        d.setFont("helvetica", "normal");
        d.setTextColor(200, 200, 200);
        d.text("Advanced Engineering Division", 14, 28);

        // Document Info
        d.setFontSize(14);
        d.setFont("helvetica", "bold");
        d.text(this.metadata.title.toUpperCase(), 196, 20, { align: "right" });

        d.setFontSize(9);
        d.setFont("helvetica", "normal");
        const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        d.text(`Date: ${dateStr}`, 196, 28, { align: "right" });
        if (this.metadata.referenceNo) {
            d.text(`Ref: ${this.metadata.referenceNo}`, 196, 33, { align: "right" });
        }
    }

    private drawFooter() {
        const d = this.doc;
        const pageCount = d.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            d.setPage(i);

            // Footer Line
            d.setDrawColor(200, 200, 200);
            d.setLineWidth(0.5);
            d.line(14, 285, 196, 285);

            d.setFontSize(8);
            d.setTextColor(100, 100, 100);
            d.setFont("helvetica", "normal");

            d.text("AluCalc OS - Auto-Generated Engineering Report", 14, 290);

            d.text(`Page ${i} of ${pageCount}`, 196, 290, { align: "right" });
        }
    }

    public addMetadataSection(startY: number = 50): number {
        const d = this.doc;
        d.setFontSize(12);
        d.setTextColor(40, 40, 40);
        d.setFont("helvetica", "bold");
        d.text("PROJECT DETAILS", 14, startY);

        const m = this.metadata;
        const metadataMap: string[][] = [
            ["Client", m.clientName || "N/A", "Prepared By", m.preparedBy || "AluCalc OS Engineer"],
            ["Project", m.projectName || "Standard Protocol", "Document ID", m.referenceNo || `AC-${Date.now().toString().slice(-6)}`]
        ];

        autoTable(d, {
            startY: startY + 5,
            body: metadataMap,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2, textColor: [80, 80, 80] },
            columnStyles: {
                0: { fontStyle: 'bold', textColor: [40, 40, 40], cellWidth: 30 },
                1: { cellWidth: 65 },
                2: { fontStyle: 'bold', textColor: [40, 40, 40], cellWidth: 30 },
                3: { cellWidth: 65 }
            },
            margin: { left: 14 }
        });

        // @ts-ignore - jspdf-autotable adds lastAutoTable to doc
        let finalY = d.lastAutoTable.finalY;

        if (m.notes) {
            d.setFontSize(10);
            d.setFont("helvetica", "bold");
            d.text("Notes:", 14, finalY + 10);
            d.setFont("helvetica", "normal");
            d.setFontSize(9);
            d.setTextColor(100, 100, 100);
            const splitNotes = d.splitTextToSize(m.notes, 180);
            d.text(splitNotes, 14, finalY + 15);
            finalY = finalY + 15 + (splitNotes.length * 4);
        }

        return finalY + 10;
    }

    public addSectionTitle(title: string, yPos: number): number {
        const d = this.doc;

        // Page break logic if needed
        if (yPos > 260) {
            d.addPage();
            yPos = 50;
        }

        d.setFillColor(245, 245, 245);
        d.rect(14, yPos - 5, 182, 8, 'F');

        d.setFontSize(10);
        d.setTextColor(...this.primaryColor);
        d.setFont("helvetica", "bold");
        d.text(title.toUpperCase(), 16, yPos);

        return yPos + 10;
    }

    public addTable(options: UserOptions): number {
        const defaultOptions: UserOptions = {
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 3, font: "helvetica" },
            headStyles: { fillColor: this.secondaryColor, textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            margin: { left: 14, right: 14 }
        };

        autoTable(this.doc, { ...defaultOptions, ...options });

        // @ts-ignore
        return this.doc.lastAutoTable.finalY + 10;
    }

    public async addImageFromCanvas(canvasId: string, yPos: number, title?: string, format: string = 'PNG'): Promise<number> {
        return new Promise((resolve) => {
            const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
            if (!canvas) {
                console.warn(`Canvas with id ${canvasId} not found.`);
                resolve(yPos);
                return;
            }

            if (title) {
                yPos = this.addSectionTitle(title, yPos);
            }

            try {
                const imgData = canvas.toDataURL(`image/${format}`, 1.0);

                // Calculate scale to fit width (182mm available)
                const pdfWidth = 182;
                const ratio = canvas.height / canvas.width;
                const pdfHeight = pdfWidth * ratio;

                // Page break logic
                if (yPos + pdfHeight > 260) {
                    this.doc.addPage();
                    yPos = 50;
                }

                this.doc.addImage(imgData, format, 14, yPos, pdfWidth, pdfHeight);
                resolve(yPos + pdfHeight + 10);
            } catch (err) {
                console.error("Error capturing canvas:", err);
                resolve(yPos);
            }
        });
    }

    // Helper for adding SVG element directly (requires converting to canvas first)
    public async addImageFromSVG(svgElement: SVGSVGElement, yPos: number, title?: string): Promise<number> {
        return new Promise((resolve) => {
            if (!svgElement) {
                resolve(yPos);
                return;
            }

            if (title) {
                yPos = this.addSectionTitle(title, yPos);
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const data = (new XMLSerializer()).serializeToString(svgElement);
            const DOMURL = window.URL || window.webkitURL || window;

            const img = new Image();
            const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
            const url = DOMURL.createObjectURL(svgBlob);

            img.onload = () => {
                // Background color for SVG
                canvas.width = svgElement.clientWidth * 2 || 800;
                canvas.height = svgElement.clientHeight * 2 || 400;

                if (ctx) {
                    // Set white background (PDFs are white)
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                }

                DOMURL.revokeObjectURL(url);

                const imgData = canvas.toDataURL('image/PNG');

                const pdfWidth = 182;
                const ratio = canvas.height / canvas.width;
                const pdfHeight = pdfWidth * ratio;

                if (yPos + pdfHeight > 260) {
                    this.doc.addPage();
                    yPos = 50;
                }

                this.doc.addImage(imgData, 'PNG', 14, yPos, pdfWidth, pdfHeight);
                resolve(yPos + pdfHeight + 10);
            };

            img.onerror = () => {
                console.error("SVG to Canvas conversion failed");
                resolve(yPos);
            }

            img.src = url;
        });
    }

    public addKPIs(kpis: { label: string, value: string }[], yPos: number): number {
        const d = this.doc;

        if (yPos > 240) {
            d.addPage();
            yPos = 50;
        }

        const boxWidth = 182 / kpis.length - 2;

        kpis.forEach((kpi, idx) => {
            const x = 14 + (idx * (boxWidth + 2));

            // Box logic
            d.setDrawColor(220, 220, 220);
            d.setFillColor(250, 250, 250);
            d.rect(x, yPos, boxWidth, 18, 'FD');

            // Label
            d.setFontSize(8);
            d.setTextColor(150, 150, 150);
            d.text(kpi.label.toUpperCase(), x + 2, yPos + 6);

            // Value
            d.setFontSize(12);
            d.setTextColor(40, 40, 40);
            d.setFont("helvetica", "bold");
            d.text(kpi.value, x + 2, yPos + 14);
        });

        return yPos + 25;
    }

    public save(filename?: string) {
        // Redraw footer at the very end to ensure accurate page counts
        this.drawFooter();
        const fname = filename || `AluCalc_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
        this.doc.save(fname);
    }
}
