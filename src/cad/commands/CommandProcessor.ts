
import { Command, CommandInput } from './types';
import { useCadStore } from '../store/cadStore';
import { Point } from '../kernel/types';
import { LineTool } from './tools/LineTool';
import { CircleTool } from './tools/CircleTool';
import { RectangleTool } from './tools/RectangleTool';
import { OffsetTool } from './tools/OffsetTool';
import { TrimTool } from './tools/TrimTool';
import { ExtendTool } from './tools/ExtendTool';
import { DimensionTool } from './tools/DimensionTool';
import { MoveTool } from './tools/MoveTool';
import { CopyTool } from './tools/CopyTool';
import { RotateTool } from './tools/RotateTool';
import { MirrorTool } from './tools/MirrorTool';
import { findEntityAtPoint } from '../geometry/GeometryUtils';

/**
 * Command Processor
 * 
 * Central controller for managing active CAD commands.
 * Handles input routing (mouse, keyboard, CLI) to the active command.
 */
export class CommandProcessor {
    private activeCommand: Command | null = null;

    constructor() {
        // Initialize
    }

    public startCommand(commandId: string) {
        let command: Command | null = null;

        if (commandId === 'LINE') {
            command = new LineTool();
        } else if (commandId === 'CIRCLE') {
            command = new CircleTool();
        } else if (commandId === 'RECTANGLE') {
            command = new RectangleTool();
        } else if (commandId === 'OFFSET') {
            command = new OffsetTool();
        } else if (commandId === 'TRIM') {
            command = new TrimTool();
        } else if (commandId === 'EXTEND') {
            command = new ExtendTool();
        } else if (commandId === 'DIMENSION' || commandId === 'DIMENSION_LINEAR') {
            command = new DimensionTool();
        } else if (commandId === 'MOVE') {
            command = new MoveTool();
        } else if (commandId === 'COPY') {
            command = new CopyTool();
        } else if (commandId === 'ROTATE') {
            command = new RotateTool();
        } else if (commandId === 'MIRROR') {
            command = new MirrorTool();
        } else {
            console.warn(`Unknown command: ${commandId}`);
            // Don't clear current command if unknown
            return;
        }

        this.setActiveCommand(command);
    }

    public setActiveCommand(command: Command | null) {
        if (this.activeCommand) {
            this.activeCommand.cancel();
        }

        this.activeCommand = command;

        if (this.activeCommand) {
            console.log(`Command started: ${this.activeCommand.name}`);
            this.activeCommand.start();
            // Sync with store
            useCadStore.setState({ activeCommand: this.activeCommand.id });
        } else {
            // Reset store command state prompt
            useCadStore.setState({
                activeCommand: null,
                commandState: 'IDLE',
                commandPrompt: 'Type a command',
                commandPoints: [],
                previewEntity: null
            });
        }
    }

    public getActiveCommand(): Command | null {
        return this.activeCommand;
    }

    public handleMouseMove(point: Point) {
        if (this.activeCommand) {
            this.activeCommand.onMouseMove(point);
        }
    }

    public handleMouseDown(point: Point) {
        if (!this.activeCommand) {
            const { entities, viewport, selectEntity } = useCadStore.getState();
            const entity = findEntityAtPoint(point, entities, viewport.zoom);
            if (entity) {
                selectEntity(entity.id);
                this.startCommand('MOVE');
            }
        }
    }

    public handleMouseUp() {
        if (this.activeCommand?.id === 'MOVE') {
            this.handleCancel();
        }
    }

    public handlePointInput(point: Point) {
        if (this.activeCommand) {
            this.activeCommand.onPointInput(point);
        } else {
            const { entities, viewport, toggleSelection, deselectAll } = useCadStore.getState();
            const entity = findEntityAtPoint(point, entities, viewport.zoom);

            if (entity) {
                toggleSelection(entity.id);
            } else {
                deselectAll();
            }
        }
    }

    public handleCancel() {
        this.setActiveCommand(null);
    }

    private variableProvider: ((name: string) => number | undefined) | null = null;

    public setVariableProvider(provider: (name: string) => number | undefined) {
        this.variableProvider = provider;
    }

    private resolveVariables(input: string): string {
        if (!input.includes('$') || !this.variableProvider) return input;

        return input.replace(/\$([a-zA-Z0-9_]+)/g, (match, varName) => {
            const val = this.variableProvider!(varName);
            return val !== undefined ? val.toString() : match;
        });
    }

    public handleValueInput(value: string) {
        // Resolve variables first (e.g. "$width, 0" -> "100, 0")
        const resolvedValue = this.resolveVariables(value);

        if (this.activeCommand) {
            this.activeCommand.onValueInput(resolvedValue);
        } else {
            // CLI command parsing
            const cmd = resolvedValue.trim().toUpperCase();

            // Check for variable assignment (e.g. "$x = 10") - Future feature

            if (cmd === 'L' || cmd === 'LINE') {
                this.startCommand('LINE');
            } else if (cmd === 'PL' || cmd === 'PLINE') {
                this.startCommand('PLINE');
            } else if (cmd === 'C' || cmd === 'CIRCLE') {
                this.startCommand('CIRCLE');
            } else if (cmd === 'REC' || cmd === 'RECTANGLE') {
                this.startCommand('RECTANGLE');
            } else if (cmd === 'D' || cmd === 'DIM') {
                this.startCommand('DIMENSION');
            } else {
                // If it's just a number or point command without active tool?
                // For now, warn
                console.warn('Unknown command:', cmd);
                // But if we resolved a variable, maybe show it?
                if (value !== resolvedValue) {
                    useCadStore.setState({ commandPrompt: `Resolved: ${resolvedValue}` });
                } else {
                    useCadStore.setState({ commandPrompt: 'Unknown command' });
                }
            }
        }
    }

    public renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point) {
        if (this.activeCommand) {
            this.activeCommand.renderPreview(ctx, transform);
        }
    }
}

// Singleton instance
export const commandProcessor = new CommandProcessor();
