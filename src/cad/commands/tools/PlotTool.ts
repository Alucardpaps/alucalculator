
import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { generatePDF } from '../../export/PdfGenerator';

export class PlotTool extends BaseCommand {
    public id = 'PLOT';
    public name = 'PLOT';
    public displayName = 'Plot (Print)';

    private p1: Point | null = null;
    private p2: Point | null = null;

    // Parameters with defaults
    private params = {
        paperSize: 'A4',
        orientation: 'LANDSCAPE',
        scale: 'FIT', 
        showTitleBlock: true,
        partName: 'Yeni Parça',
        designer: 'AluCAD User',
        approver: '',
        company: 'AluCAD Engineering'
    };

    start(): void {
        this.p1 = null;
        this.p2 = null;
        this.setPrompt('Specify first corner of plot area:');
    }

    onMouseMove(point: Point): void {
        if (this.p1) {
            this.p2 = point;
            
            // Create a temporary rectangle preview for the plot area
            const previewRect: CadEntity = {
                id: 'plot-preview',
                layerId: 'overlay',
                color: '#00e5ff',
                isVisible: true,
                isSelected: false,
                geometry: {
                    type: 'RECTANGLE' as any,
                    center: { x: (this.p1.x + point.x) / 2, y: (this.p1.y + point.y) / 2 },
                    width: Math.abs(point.x - this.p1.x),
                    height: Math.abs(point.y - this.p1.y),
                    rotation: 0
                } as any
            };
            useCadStore.getState().setPreviewEntity(previewRect);
        }
    }

    onPointInput(point: Point): void {
        if (!this.p1) {
            this.p1 = point;
            this.setPrompt('Specify second corner:');
        } else {
            this.p2 = point;
            this.executePlot();
        }
    }

    onParamChange(params: any): void {
        this.params = { ...this.params, ...params };
    }

    private async executePlot(): Promise<void> {
        if (!this.p1 || !this.p2) return;

        const { entities, layers } = useCadStore.getState();
        const canvas = document.getElementById('cad-canvas') as HTMLCanvasElement;
        
        // Define world bounds for the plot
        const worldBounds = {
            minX: Math.min(this.p1.x, this.p2.x),
            minY: Math.min(this.p1.y, this.p2.y),
            maxX: Math.max(this.p1.x, this.p2.x),
            maxY: Math.max(this.p1.y, this.p2.y)
        };

        this.setPrompt('Generating high-fidelity plot...');
        
        try {
            const pdfBytes = await generatePDF(entities, layers, canvas, {
                worldBounds,
                paperSize: this.params.paperSize,
                orientation: this.params.orientation as 'LANDSCAPE' | 'PORTRAIT',
                scale: this.params.scale,
                showTitleBlock: this.params.showTitleBlock,
                titleBlockData: {
                    partName: this.params.partName,
                    designer: this.params.designer,
                    approver: this.params.approver,
                    company: this.params.company
                }
            });

            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Plot_${new Date().getTime()}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.setPrompt('Plot generated successfully.');
        } catch (err) {
            console.error('Plot generation failed:', err);
            this.setPrompt('Plot failed. Check console for details.');
        }

        // Reset tool for next plot
        this.p1 = null;
        this.p2 = null;
        useCadStore.getState().setPreviewEntity(null);
    }

    cancel(): void {
        this.p1 = null;
        this.p2 = null;
        useCadStore.getState().setPreviewEntity(null);
        super.cancel();
    }
}
