/**
 * AluCAD — Instant Text Tool with Live Floating Preview
 * 
 * Adds vector text annotations to the CAD environment.
 * Standardized to ISO 3098 / ASME Y14.2 technical lettering.
 * 
 * Flow:
 *   - Hover/move: live floating preview shows the text and bounding box at cursor
 *   - 1-click on canvas: immediately creates and places the text entity
 *   - Parameters (content, fontSize, bold, italic) configurable from ToolPropertyPanel or CLI
 */

import { Command } from '../types';
import { Point, CadEntity, TextGeometry } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';

export class TextTool implements Command {
    id = 'TEXT';
    name = 'Text';
    displayName = 'Text';

    private content = 'Not / Metin';
    private fontSize = 14;
    private fontFamily = 'Arial';
    private justification: 'left' | 'center' | 'right' = 'left';
    private bold = false;
    private italic = false;
    private rotation = 0;
    private currentCursor: Point | null = null;

    start(): void {
        this.currentCursor = null;
        useCadStore.setState({
            commandState: 'AWAITING_POINT',
            commandPrompt: `📝 Metin Ekle: Konumlandırmak için tıklayın (İçerik: "${this.content}", Boyut: ${this.fontSize}pt):`,
        });
    }

    public setTextParams(params: {
        content?: string;
        fontSize?: number;
        bold?: boolean;
        italic?: boolean;
        justification?: 'left' | 'center' | 'right';
        rotation?: number;
    }): void {
        if (params.content !== undefined) this.content = params.content;
        if (params.fontSize !== undefined && params.fontSize > 0) this.fontSize = params.fontSize;
        if (params.bold !== undefined) this.bold = params.bold;
        if (params.italic !== undefined) this.italic = params.italic;
        if (params.justification !== undefined) this.justification = params.justification;
        if (params.rotation !== undefined) this.rotation = params.rotation;

        useCadStore.setState({
            commandPrompt: `📝 Metin Ekle: Konumlandırmak için tıklayın (İçerik: "${this.content}", Boyut: ${this.fontSize}pt):`,
        });
    }

    public placeTextNow(): void {
        const store = useCadStore.getState();
        const pos = this.currentCursor || store.cursorWorld || store.viewport.center;
        this.createTextAt(pos);
    }

    onMouseMove(point: Point): void {
        this.currentCursor = point;
    }

    onPointInput(point: Point): void {
        this.createTextAt(point);
    }

    onValueInput(value: string): void {
        const trimmed = value.trim();
        if (!trimmed) return;

        // Check if formatting prefix
        let text = trimmed;
        if (text.startsWith('/b ')) { this.bold = true; text = text.slice(3); }
        if (text.startsWith('/i ')) { this.italic = true; text = text.slice(3); }
        if (text.startsWith('/bi ') || text.startsWith('/ib ')) {
            this.bold = true; this.italic = true; text = text.slice(4);
        }

        const numeric = parseFloat(text);
        if (!isNaN(numeric) && numeric > 0 && text === String(numeric)) {
            this.fontSize = numeric;
        } else {
            this.content = text;
        }

        if (this.currentCursor) {
            this.createTextAt(this.currentCursor);
        } else {
            useCadStore.setState({
                commandPrompt: `📝 Metin güncellendi: "${this.content}". Konumlandırmak için tıklayın:`,
            });
        }
    }

    onKeyInput(key: string): void {
        if (key === 'Escape') {
            this.cancel();
        }
    }

    cancel(): void {
        this.currentCursor = null;
        useCadStore.setState({
            previewEntity: null,
        });
    }

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        const cursor = this.currentCursor || useCadStore.getState().cursorWorld;
        if (!cursor) return;

        const pos = transform(cursor);
        const zoom = useCadStore.getState().viewport.zoom;
        const screenFontSize = Math.max(10, this.fontSize * zoom);

        ctx.save();
        const fontStyle = this.italic ? 'italic ' : '';
        const fontWeight = this.bold ? 'bold ' : '';
        ctx.font = `${fontStyle}${fontWeight}${screenFontSize}px ${this.fontFamily}`;

        const textMetrics = ctx.measureText(this.content || 'Text');
        const textWidth = textMetrics.width;
        const textHeight = screenFontSize;

        // 1. Floating anchor crosshair
        ctx.strokeStyle = '#e85d5d'; // Pivot red
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pos.x - 6, pos.y);
        ctx.lineTo(pos.x + 6, pos.y);
        ctx.moveTo(pos.x, pos.y - 6);
        ctx.lineTo(pos.x, pos.y + 6);
        ctx.stroke();

        // 2. Bounding indicator box
        ctx.fillStyle = 'rgba(7, 9, 12, 0.85)';
        ctx.strokeStyle = '#3ad0e6'; // Electric cyan
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);

        const boxX = pos.x - 4;
        const boxY = pos.y - textHeight - 2;
        const boxW = textWidth + 8;
        const boxH = textHeight + 8;

        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeRect(boxX, boxY, boxW, boxH);
        ctx.setLineDash([]);

        // 3. Live text preview
        ctx.fillStyle = '#3ad0e6';
        ctx.textAlign = this.justification;
        ctx.textBaseline = 'top';

        if (this.rotation) {
            ctx.translate(pos.x, pos.y);
            ctx.rotate(-this.rotation);
            ctx.fillText(this.content || 'Text', 0, -textHeight);
        } else {
            ctx.fillText(this.content || 'Text', pos.x, pos.y - textHeight);
        }

        ctx.restore();
    }

    private createTextAt(point: Point): void {
        const store = useCadStore.getState();
        store.pushHistory('Text Annotation');

        const textGeometry: TextGeometry = {
            type: 'TEXT',
            position: point,
            content: this.content || 'Not / Metin',
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
            rotation: this.rotation,
            justification: this.justification,
            bold: this.bold,
            italic: this.italic,
        };

        const activeLayer = store.layers.find(l => l.id === store.activeLayerId);
        const entity: CadEntity = {
            id: crypto.randomUUID(),
            layerId: store.activeLayerId,
            color: activeLayer?.color || '#3ad0e6',
            isVisible: true,
            isSelected: false,
            geometry: textGeometry,
        };

        store.addEntity(entity);

        useCadStore.setState({
            commandState: 'AWAITING_POINT',
            commandPrompt: `✅ Metin eklendi. Yeni metin için tıklayın veya ESC ile tamamlayın:`,
        });
    }
}
