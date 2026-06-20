
import { Command, CommandInput } from './types';
import { useCadStore } from '../store/cadStore';
import { Point } from '../kernel/types';
import { LineTool } from './tools/LineTool';
import { CircleTool } from './tools/CircleTool';
import { ArcTool } from './tools/ArcTool';
import { RectangleTool } from './tools/RectangleTool';
import { PolygonTool } from './tools/PolygonTool';
import { OffsetTool } from './tools/OffsetTool';
import { TrimTool } from './tools/TrimTool';
import { ExtendTool } from './tools/ExtendTool';
import { DimensionTool } from './tools/DimensionTool';
import { MoveTool } from './tools/MoveTool';
import { CopyTool } from './tools/CopyTool';
import { RotateTool } from './tools/RotateTool';
import { MirrorTool } from './tools/MirrorTool';
import { FilletTool } from './tools/FilletTool';
import { ChamferTool } from './tools/ChamferTool';
import { RectArrayTool, CircArrayTool } from './tools/ArrayTools';
import { MohrsCircleTool } from './tools/MohrsCircleTool';
import { CrossSectionTool } from './tools/CrossSectionTool';
import { GearTool } from './tools/GearTool';
import { MatingGearTool } from './tools/MatingGearTool';
import { BeltPulleyTool } from './tools/BeltPulleyTool';
import { PlanetaryGearTool } from './tools/PlanetaryGearTool';
import { FastenerDrawTool } from './tools/FastenerDrawTool';
import { TextTool } from './tools/TextTool';
import { PlotTool } from './tools/PlotTool';
import { findEntityAtPoint } from '../geometry/GeometryUtils';

// ═══════════════════════════════════════════════════════════════
// COMMAND REGISTRY — Factory Map
// ═══════════════════════════════════════════════════════════════

/**
 * Centralized command factory registry.
 * Maps canonical command IDs to factory functions that produce fresh tool instances.
 */
const COMMAND_REGISTRY: ReadonlyMap<string, () => Command> = new Map<string, () => Command>([
    // Drawing
    ['LINE',            () => new LineTool()],
    ['PLINE',           () => new LineTool()],
    ['CIRCLE',          () => new CircleTool()],
    ['ARC',             () => new ArcTool()],
    ['RECTANGLE',       () => new RectangleTool()],
    ['POLYGON',         () => new PolygonTool()],
    ['HEXAGON',         () => new PolygonTool()],
    // Modify
    ['OFFSET',          () => new OffsetTool()],
    ['TRIM',            () => new TrimTool()],
    ['EXTEND',          () => new ExtendTool()],
    ['MOVE',            () => new MoveTool()],
    ['COPY',            () => new CopyTool()],
    ['ROTATE',          () => new RotateTool()],
    ['MIRROR',          () => new MirrorTool()],
    ['FILLET',          () => new FilletTool()],
    ['CHAMFER',         () => new ChamferTool()],
    // Arrays
    ['RECTARRAY',       () => new RectArrayTool()],
    ['CIRCARRAY',       () => new CircArrayTool()],
    // Dimensioning
    ['DIMENSION',       () => new DimensionTool()],
    ['DIMENSION_LINEAR',() => new DimensionTool()],
    // Analysis
    ['MOHR',            () => new MohrsCircleTool()],
    ['CROSS_SECTION',   () => new CrossSectionTool()],
    // Mechanical Engineering
    ['GEAR',            () => new GearTool()],
    ['MATING_GEAR',     () => new MatingGearTool()],
    ['BELT_PULLEY',     () => new BeltPulleyTool()],
    ['PLANETARY_GEAR',  () => new PlanetaryGearTool()],
    ['FASTENER',        () => new FastenerDrawTool()],
    // Annotation
    ['TEXT',            () => new TextTool()],
    // Plotting
    ['PLOT',            () => new PlotTool()],
]);

// ═══════════════════════════════════════════════════════════════
// UNIFIED ALIAS MAP — Single Source of Truth
// ═══════════════════════════════════════════════════════════════

/**
 * Maps user-typed shortcuts and natural-language aliases to canonical command IDs.
 * Used by both CLI (CommandLine.tsx) and this processor's handleValueInput.
 */
export const COMMAND_ALIASES: Readonly<Record<string, string>> = {
    // Drawing
    'L': 'LINE', 'LINE': 'LINE',
    'PL': 'PLINE', 'PLINE': 'PLINE', 'POLYLINE': 'PLINE',
    'C': 'CIRCLE', 'CIRCLE': 'CIRCLE', 'CIRC': 'CIRCLE',
    'A': 'ARC', 'ARC': 'ARC',
    'REC': 'RECTANGLE', 'RECT': 'RECTANGLE', 'RECTANGLE': 'RECTANGLE', 'BOX': 'RECTANGLE', 'R': 'RECTANGLE',
    'HEX': 'POLYGON', 'HEXAGON': 'POLYGON', 'POLYGON': 'POLYGON', 'PGON': 'POLYGON',
    // Modify
    'O': 'OFFSET', 'OF': 'OFFSET', 'OFFSET': 'OFFSET',
    'TR': 'TRIM', 'TRIM': 'TRIM',
    'EX': 'EXTEND', 'EXTEND': 'EXTEND',
    'M': 'MOVE', 'MOVE': 'MOVE',
    'CO': 'COPY', 'COPY': 'COPY', 'CP': 'COPY',
    'RO': 'ROTATE', 'ROTATE': 'ROTATE',
    'MI': 'MIRROR', 'MIRROR': 'MIRROR',
    'SC': 'SCALE', 'SCALE': 'SCALE',
    'F': 'FILLET', 'FL': 'FILLET', 'FILLET': 'FILLET',
    'CHA': 'CHAMFER', 'CH': 'CHAMFER', 'CHAMFER': 'CHAMFER',
    'E': 'ERASE', 'ERASE': 'ERASE', 'DEL': 'ERASE', 'DELETE': 'ERASE',
    // Arrays
    'RECTARRAY': 'RECTARRAY', 'RA': 'RECTARRAY',
    'CIRCARRAY': 'CIRCARRAY', 'CA': 'CIRCARRAY',
    // Dimensioning
    'D': 'DIMENSION', 'DI': 'DIMENSION', 'DIM': 'DIMENSION', 'DIMENSION': 'DIMENSION',
    'SD': 'DIMENSION', 'SMART': 'DIMENSION',
    'DIMLINEAR': 'DIMENSION_LINEAR', 'DIMENSION_LINEAR': 'DIMENSION_LINEAR',
    // Analysis
    'MOHR': 'MOHR', 'MOHRS': 'MOHR',
    'CROSS': 'CROSS_SECTION', 'AREA': 'CROSS_SECTION', 'CROSS_SECTION': 'CROSS_SECTION',
    // Mechanical Engineering
    'G': 'GEAR', 'GEAR': 'GEAR', 'INVOLUTE': 'GEAR',
    'MG': 'MATING_GEAR', 'MATING': 'MATING_GEAR', 'MATING_GEAR': 'MATING_GEAR', 'MESH': 'MATING_GEAR',
    'BELT': 'BELT_PULLEY', 'PULLEY': 'BELT_PULLEY', 'BELT_PULLEY': 'BELT_PULLEY', 'BP': 'BELT_PULLEY',
    'PG': 'PLANETARY_GEAR', 'PLANET': 'PLANETARY_GEAR', 'PLANETARY': 'PLANETARY_GEAR', 'PLANETARY_GEAR': 'PLANETARY_GEAR',
    'BOLT': 'FASTENER', 'NUT': 'FASTENER', 'FASTENER': 'FASTENER', 'SCREW': 'FASTENER',
    // Annotation
    'T': 'TEXT', 'TEXT': 'TEXT', 'MTEXT': 'TEXT',
    // Plotting
    'PLOT': 'PLOT', 'PRINT': 'PLOT',
    // Viewport
    'Z': 'ZOOM', 'ZOOM': 'ZOOM',
    'P': 'PAN', 'PAN': 'PAN',
    'U': 'UNDO', 'UNDO': 'UNDO',
    'REDO': 'REDO',
};

// ═══════════════════════════════════════════════════════════════
// COMMAND PROCESSOR
// ═══════════════════════════════════════════════════════════════

/**
 * Command Processor
 * 
 * Central controller for managing active CAD commands.
 * Uses a Map-based factory registry for O(1) command instantiation.
 * Handles input routing (mouse, keyboard, CLI) to the active command.
 */
export class CommandProcessor {
    private activeCommand: Command | null = null;

    constructor() {
        // Initialize
    }

    /**
     * Start a command by its canonical ID.
     * Looks up the factory in COMMAND_REGISTRY and instantiates a new tool.
     */
    public startCommand(commandId: string) {
        const factory = COMMAND_REGISTRY.get(commandId);

        if (!factory) {
            console.warn(`Unknown command: ${commandId}`);
            useCadStore.setState({ commandPrompt: `Unknown command: ${commandId}` });
            return;
        }

        const command = factory();
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

    /**
     * FIX: Removed auto-MOVE on entity click in select mode.
     * Previously, clicking any entity without an active command would
     * auto-start MOVE, hijacking all subsequent point inputs.
     * Now it only selects the entity — MOVE must be explicitly invoked.
     */
    public handleMouseDown(_point: Point) {
        // Selection is handled by CadCanvas.handleMouseDown directly.
        // No implicit command activation here.
    }

    public handleMouseUp() {
        // No-op — MOVE auto-cancel removed along with auto-start
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
            // CLI command parsing — use the unified alias map
            const cmd = resolvedValue.trim().toUpperCase();
            const resolved = COMMAND_ALIASES[cmd];

            if (resolved) {
                this.startCommand(resolved);
            } else {
                useCadStore.setState({ commandPrompt: `Unknown: ${cmd}` });
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
