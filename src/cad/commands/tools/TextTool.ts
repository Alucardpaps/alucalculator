/**
 * AluCAD — Text Tool
 * 
 * Adds vektörel text annotations to the CAD environment.
 * Supports font size, justification, bold, italic.
 * 
 * Flow:
 *   1. Click to place text position
 *   2. Type the text content
 *   3. (Optional) Type font size or press Enter for default
 */

import { Command } from '../types';
import { Point, CadEntity, TextGeometry } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';

export class TextTool implements Command {
    id = 'TEXT';
    name = 'Text';
    displayName = 'Text';

    private position: Point | null = null;
    private content = '';
    private fontSize = 12;
    private fontFamily = 'Arial';
    private justification: 'left' | 'center' | 'right' = 'left';
    private bold = false;
    private italic = false;
    private step: 'PLACE' | 'CONTENT' | 'SIZE' = 'PLACE';

    start(): void {
        this.step = 'PLACE';
        useCadStore.setState({
            commandState: 'AWAITING_POINT',
            commandPrompt: 'Click to place text position:',
        });
    }

    onPointInput(point: Point): void {
        if (this.step === 'PLACE') {
            this.position = point;
            this.step = 'CONTENT';
            useCadStore.setState({
                commandState: 'AWAITING_VALUE',
                commandPrompt: 'Enter text content:',
            });
        }
    }

    onValueInput(value: string): void {
        if (this.step === 'CONTENT') {
            if (!value.trim()) {
                useCadStore.setState({ commandPrompt: 'Text cannot be empty. Enter text:' });
                return;
            }

            // Parse formatting commands
            let text = value;
            if (text.startsWith('/b ')) { this.bold = true; text = text.slice(3); }
            if (text.startsWith('/i ')) { this.italic = true; text = text.slice(3); }
            if (text.startsWith('/bi ') || text.startsWith('/ib ')) {
                this.bold = true; this.italic = true; text = text.slice(4);
            }

            this.content = text;
            this.step = 'SIZE';
            useCadStore.setState({
                commandPrompt: `Font size (current: ${this.fontSize}, or Enter for default). Options: /l=left /c=center /r=right:`,
            });
        } else if (this.step === 'SIZE') {
            const trimmed = value.trim();

            // Check for justification commands
            if (trimmed === '/l') { this.justification = 'left'; }
            else if (trimmed === '/c') { this.justification = 'center'; }
            else if (trimmed === '/r') { this.justification = 'right'; }
            else {
                const size = parseFloat(trimmed);
                if (!isNaN(size) && size > 0) {
                    this.fontSize = size;
                }
            }

            this.createText();
        }
    }

    onKeyInput(key: string): void {
        if (key === 'Escape') {
            this.cancel();
        } else if (key === 'Enter' && this.step === 'SIZE') {
            this.createText();
        }
    }

    onMouseMove(_point: Point): void { }

    cancel(): void {
        this.position = null;
        this.content = '';
    }

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        if (this.step !== 'PLACE') return;

        const cursor = useCadStore.getState().cursorWorld;
        const pos = transform(cursor);

        ctx.save();
        ctx.fillStyle = 'rgba(0, 229, 255, 0.5)';
        ctx.font = '12px Arial';
        ctx.fillText('T', pos.x - 4, pos.y + 4);

        // Crosshair
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(pos.x - 10, pos.y);
        ctx.lineTo(pos.x + 10, pos.y);
        ctx.moveTo(pos.x, pos.y - 10);
        ctx.lineTo(pos.x, pos.y + 10);
        ctx.stroke();
        ctx.restore();
    }

    private createText(): void {
        if (!this.position || !this.content) return;

        const store = useCadStore.getState();
        store.pushHistory('Text');

        const textGeometry: TextGeometry = {
            type: 'TEXT',
            position: this.position,
            content: this.content,
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
            rotation: 0,
            justification: this.justification,
            bold: this.bold,
            italic: this.italic,
        };

        const entity: CadEntity = {
            id: crypto.randomUUID(),
            layerId: store.activeLayerId,
            color: store.layers.find(l => l.id === store.activeLayerId)?.color || '#ffffff',
            isVisible: true,
            isSelected: false,
            geometry: textGeometry,
        };

        store.addEntity(entity);

        // Ready for next text
        this.position = null;
        this.content = '';
        this.bold = false;
        this.italic = false;
        this.step = 'PLACE';

        useCadStore.setState({
            commandState: 'AWAITING_POINT',
            commandPrompt: 'Click to place next text or ESC:',
        });
    }
}
