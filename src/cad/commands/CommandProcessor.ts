
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
import { ScaleTool } from './tools/ScaleTool';
import { MohrsCircleTool } from './tools/MohrsCircleTool';
import { CrossSectionTool } from './tools/CrossSectionTool';
import { TSlotInsertTool } from './tools/TSlotInsertTool';
import { GearTool } from './tools/GearTool';
import { MatingGearTool } from './tools/MatingGearTool';
import { BeltPulleyTool } from './tools/BeltPulleyTool';
import { PlanetaryGearTool } from './tools/PlanetaryGearTool';
import { FastenerDrawTool } from './tools/FastenerDrawTool';
import { RollerChainTool } from './tools/RollerChainTool';
import { TextTool } from './tools/TextTool';
import { PlotTool } from './tools/PlotTool';
import { EllipseTool } from './tools/EllipseTool';
import { SplineTool } from './tools/SplineTool';
import { LeaderTool } from './tools/LeaderTool';
import { MeasureTool } from './tools/MeasureTool';
import { HatchTool } from './tools/HatchTool';
import { JoinTool } from './tools/JoinTool';
import { GroupTool } from './tools/GroupTool';
import { UngroupTool } from './tools/UngroupTool';
import { ExplodeTool } from './tools/ExplodeTool';
import { EraseTool } from './tools/EraseTool';
import { BlockTool } from './tools/BlockTool';
import { InsertTool } from './tools/InsertTool';
import { SurfaceTool } from './tools/SurfaceTool';
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
    ['LINE',                  () => new LineTool('2P')],
    ['XLINE',                 () => new LineTool('XLINE')],
    ['RAY',                   () => new LineTool('RAY')],
    ['PLINE',                 () => new LineTool('2P')],
    ['CIRCLE',                () => new CircleTool('CENTER_RADIUS')],
    ['CIRCLE_RADIUS',         () => new CircleTool('CENTER_RADIUS')],
    ['CIRCLE_DIAMETER',       () => new CircleTool('CENTER_DIAMETER')],
    ['CIRCLE_2P',             () => new CircleTool('2P')],
    ['CIRCLE_3P',             () => new CircleTool('3P')],
    ['CIRCLE_TTR',            () => new CircleTool('TTR')],
    ['CIRCLE_TTT',            () => new CircleTool('TTT')],
    ['ARC',                   () => new ArcTool('3P')],
    ['ARC_3P',                () => new ArcTool('3P')],
    ['ARC_SCE',               () => new ArcTool('START_CENTER_END')],
    ['ARC_SCA',               () => new ArcTool('START_CENTER_ANGLE')],
    ['ARC_SCL',               () => new ArcTool('START_CENTER_LENGTH')],
    ['ARC_SER',               () => new ArcTool('START_END_RADIUS')],
    ['ARC_SED',               () => new ArcTool('START_END_DIRECTION')],
    ['ARC_CSE',               () => new ArcTool('CENTER_START_END')],
    ['ARC_CSA',               () => new ArcTool('CENTER_START_ANGLE')],
    ['ARC_CONTINUE',          () => new ArcTool('CONTINUE')],
    ['RECTANGLE',             () => new RectangleTool('2P')],
    ['RECTANGLE_2P',          () => new RectangleTool('2P')],
    ['RECTANGLE_CENTER',      () => new RectangleTool('CENTER')],
    ['RECTANGLE_3P',          () => new RectangleTool('3P')],
    ['RECTANGLE_FILLET',      () => new RectangleTool('FILLET')],
    ['RECTANGLE_CHAMFER',     () => new RectangleTool('CHAMFER')],
    ['POLYGON',               () => new PolygonTool('INSCRIBED')],
    ['POLYGON_INSCRIBED',     () => new PolygonTool('INSCRIBED')],
    ['POLYGON_CIRCUMSCRIBED', () => new PolygonTool('CIRCUMSCRIBED')],
    ['POLYGON_EDGE',          () => new PolygonTool('EDGE')],
    ['HEXAGON',               () => new PolygonTool('INSCRIBED')],
    ['ELLIPSE',               () => new EllipseTool('CENTER')],
    ['ELLIPSE_CENTER',        () => new EllipseTool('CENTER')],
    ['ELLIPSE_AXIS',          () => new EllipseTool('AXIS')],
    ['ELLIPSE_ARC',           () => new EllipseTool('ARC')],
    ['SPLINE',                () => new SplineTool()],
    ['HATCH',                 () => new HatchTool()],
    ['LEADER',                () => new LeaderTool()],
    ['MEASURE',               () => new MeasureTool()],
    ['DIST',                  () => new MeasureTool()],
    // Modify
    ['OFFSET',                () => new OffsetTool()],
    ['TRIM',                  () => new TrimTool()],
    ['EXTEND',                () => new ExtendTool()],
    ['MOVE',                  () => new MoveTool()],
    ['COPY',                  () => new CopyTool()],
    ['ROTATE',                () => new RotateTool()],
    ['MIRROR',                () => new MirrorTool()],
    ['SCALE',                 () => new ScaleTool()],
    ['FILLET',                () => new FilletTool()],
    ['CHAMFER',               () => new ChamferTool()],
    ['JOIN',                  () => new JoinTool()],
    ['GROUP',                 () => new GroupTool()],
    ['UNGROUP',               () => new UngroupTool()],
    ['EXPLODE',               () => new ExplodeTool()],
    // Blocks & Templates
    ['BLOCK',                 () => new BlockTool()],
    ['INSERT',                () => new InsertTool()],
    // Arrays
    ['RECTARRAY',             () => new RectArrayTool()],
    ['CIRCARRAY',             () => new CircArrayTool()],
    ['ARRAY',                 () => new RectArrayTool()],
    // Dimensioning
    ['DIMENSION',             () => new DimensionTool('SMART')],
    ['DIMENSION_SMART',       () => new DimensionTool('SMART')],
    ['DIMENSION_LINEAR',      () => new DimensionTool('LINEAR')],
    ['DIMENSION_ALIGNED',     () => new DimensionTool('ALIGNED')],
    ['DIMENSION_ANGULAR',     () => new DimensionTool('ANGULAR')],
    ['DIMENSION_RADIAL',      () => new DimensionTool('RADIAL')],
    ['DIMENSION_DIAMETER',    () => new DimensionTool('DIAMETER')],
    // Analysis
    ['MOHR',            () => new MohrsCircleTool()],
    ['CROSS_SECTION',   () => new CrossSectionTool()],
    ['TSLOT',           () => new TSlotInsertTool()],
    // Mechanical Engineering
    ['GEAR',            () => new GearTool()],
    ['MATING_GEAR',     () => new MatingGearTool()],
    ['BELT_PULLEY',     () => new BeltPulleyTool()],
    ['PLANETARY_GEAR',  () => new PlanetaryGearTool()],
    ['FASTENER',        () => new FastenerDrawTool()],
    ['ROLLER_CHAIN',    () => new RollerChainTool()],
    ['SPROCKET',        () => new RollerChainTool()],
    // Annotation & Symbols
    ['TEXT',            () => new TextTool()],
    ['SURFACE',         () => new SurfaceTool('LEADER')],
    ['SURF_LEADER',     () => new SurfaceTool('LEADER')],
    ['SURFACE_DIRECT',  () => new SurfaceTool('DIRECT')],
    ['SURF_RA_32',      () => new SurfaceTool('LEADER', { param: 'Ra', value: '3.2' })],
    ['SURF_RA_16',      () => new SurfaceTool('LEADER', { param: 'Ra', value: '1.6' })],
    ['SURF_RA_08',      () => new SurfaceTool('LEADER', { param: 'Ra', value: '0.8' })],
    ['SURF_RA_04',      () => new SurfaceTool('LEADER', { param: 'Ra', value: '0.4' })],
    ['SURF_RA_02',      () => new SurfaceTool('LEADER', { param: 'Ra', value: '0.2' })],
    ['SURF_RA_63',      () => new SurfaceTool('LEADER', { param: 'Ra', value: '6.3' })],
    ['SURF_RA_125',     () => new SurfaceTool('LEADER', { param: 'Ra', value: '12.5', symbolType: 'machining_prohibited' })],
    // Plotting
    ['PLOT',            () => new PlotTool()],
]);

/** Commands that act at once instead of starting an interactive tool. */
const INSTANT_COMMANDS: ReadonlySet<string> = new Set(['ERASE', 'UNDO', 'REDO', 'ZOOM', 'PAN']);

/**
 * Words that are options of a running command (AutoCAD keywords) — typed while a
 * command waits for input they go to that command, never start another one.
 */
const OPTION_WORDS: ReadonlySet<string> = new Set([
    'C', 'CLOSE', 'U', 'UNDO', 'A', 'ARC', 'L', 'LENGTH', 'W', 'WIDTH', 'H', 'HALFWIDTH',
    'D', 'DIAMETER', 'R', 'RADIUS', 'T', 'TTR', 'TTT', '2P', '3P', 'COPY', 'REFERENCE',
    'MULTIPLE', 'M', 'E', 'EDGE', 'I', 'INSCRIBED', 'CIRCUMSCRIBED', 'X', 'EXIT', 'Y', 'N',
    'YES', 'NO', 'CENTER', 'ANGLE', 'P', 'POINT', 'F', 'FIT', 'O', 'OBJECT', 'S', 'SIDES',
    'B', 'BASE', 'DISTANCE', 'THROUGH', 'ERASE', 'LAYER', 'ALL', 'LAST', 'PREVIOUS',
]);

/** Coordinates, distances, angles, polar/relative input or variables. */
const VALUE_LIKE = /^[@$<+\-.\d]|^\d|,/;

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
    'XL': 'XLINE', 'XLINE': 'XLINE',
    'RAY': 'RAY',
    'PL': 'PLINE', 'PLINE': 'PLINE', 'POLYLINE': 'PLINE',
    'C': 'CIRCLE', 'CIRCLE': 'CIRCLE', 'CIRC': 'CIRCLE',
    'CR': 'CIRCLE_RADIUS', 'CIRCLE_RADIUS': 'CIRCLE_RADIUS',
    'CD': 'CIRCLE_DIAMETER', 'CIRCLE_DIAMETER': 'CIRCLE_DIAMETER',
    '2P': 'CIRCLE_2P', 'CIRCLE_2P': 'CIRCLE_2P',
    'C3P': 'CIRCLE_3P', 'CIRCLE_3P': 'CIRCLE_3P',
    'TTR': 'CIRCLE_TTR', 'CIRCLE_TTR': 'CIRCLE_TTR',
    'TTT': 'CIRCLE_TTT', 'CIRCLE_TTT': 'CIRCLE_TTT',
    'A': 'ARC', 'ARC': 'ARC',
    'A3P': 'ARC_3P', 'ARC_3P': 'ARC_3P',
    'SCE': 'ARC_SCE', 'ARC_SCE': 'ARC_SCE',
    'SCA': 'ARC_SCA', 'ARC_SCA': 'ARC_SCA',
    'SCL': 'ARC_SCL', 'ARC_SCL': 'ARC_SCL',
    'SER': 'ARC_SER', 'ARC_SER': 'ARC_SER',
    'SED': 'ARC_SED', 'ARC_SED': 'ARC_SED',
    'CSE': 'ARC_CSE', 'ARC_CSE': 'ARC_CSE',
    'CSA': 'ARC_CSA', 'ARC_CSA': 'ARC_CSA',
    'CONT': 'ARC_CONTINUE', 'CONTINUE': 'ARC_CONTINUE', 'ARC_CONTINUE': 'ARC_CONTINUE',
    'REC': 'RECTANGLE_2P', 'RECT': 'RECTANGLE_2P', 'RECTANGLE': 'RECTANGLE', 'BOX': 'RECTANGLE', 'R': 'RECTANGLE',
    'RECTANGLE_2P': 'RECTANGLE_2P', 'R2P': 'RECTANGLE_2P',
    'RECTANGLE_CENTER': 'RECTANGLE_CENTER', 'RC': 'RECTANGLE_CENTER', 'RCTR': 'RECTANGLE_CENTER',
    'RECTANGLE_3P': 'RECTANGLE_3P', 'R3P': 'RECTANGLE_3P',
    'RECTANGLE_FILLET': 'RECTANGLE_FILLET', 'RFILLET': 'RECTANGLE_FILLET',
    'RECTANGLE_CHAMFER': 'RECTANGLE_CHAMFER', 'RCHAMFER': 'RECTANGLE_CHAMFER',
    'HEX': 'POLYGON', 'HEXAGON': 'POLYGON', 'POLYGON': 'POLYGON', 'PGON': 'POLYGON', 'POL': 'POLYGON',
    'POLYGON_INSCRIBED': 'POLYGON_INSCRIBED', 'POL_I': 'POLYGON_INSCRIBED',
    'POLYGON_CIRCUMSCRIBED': 'POLYGON_CIRCUMSCRIBED', 'POL_C': 'POLYGON_CIRCUMSCRIBED',
    'POLYGON_EDGE': 'POLYGON_EDGE', 'POL_E': 'POLYGON_EDGE',
    'EL': 'ELLIPSE', 'ELLIPSE': 'ELLIPSE',
    'ELLIPSE_CENTER': 'ELLIPSE_CENTER',
    'ELLIPSE_AXIS': 'ELLIPSE_AXIS',
    'ELLIPSE_ARC': 'ELLIPSE_ARC',
    'SPL': 'SPLINE', 'SPLINE': 'SPLINE',
    'H': 'HATCH', 'HATCH': 'HATCH',
    // Modify
    'O': 'OFFSET', 'OF': 'OFFSET', 'OFFSET': 'OFFSET',
    'TR': 'TRIM', 'TRIM': 'TRIM',
    'EX': 'EXTEND', 'EXTEND': 'EXTEND',
    'MOVE': 'MOVE', 'MV': 'MOVE',
    'CO': 'COPY', 'COPY': 'COPY', 'CP': 'COPY',
    'RO': 'ROTATE', 'ROTATE': 'ROTATE',
    'MI': 'MIRROR', 'MIRROR': 'MIRROR',
    'SC': 'SCALE', 'SCALE': 'SCALE',
    'F': 'FILLET', 'FL': 'FILLET', 'FILLET': 'FILLET',
    'CHA': 'CHAMFER', 'CH': 'CHAMFER', 'CHAMFER': 'CHAMFER',
    'E': 'ERASE', 'ERASE': 'ERASE', 'DEL': 'ERASE', 'DELETE': 'ERASE',
    'J': 'JOIN', 'JOIN': 'JOIN',
    'G': 'GROUP', 'GRP': 'GROUP', 'GROUP': 'GROUP',
    'UNG': 'UNGROUP', 'UNGROUP': 'UNGROUP',
    'X': 'EXPLODE', 'EXP': 'EXPLODE', 'EXPLODE': 'EXPLODE',
    // Blocks & Templates
    'B': 'BLOCK', 'BLOCK': 'BLOCK', 'WBLOCK': 'BLOCK', 'W': 'BLOCK',
    'I': 'INSERT', 'INSERT': 'INSERT', 'INS': 'INSERT',
    // Arrays
    'RECTARRAY': 'RECTARRAY', 'RA': 'RECTARRAY', 'ARRAY': 'RECTARRAY', 'AR': 'RECTARRAY',
    'CIRCARRAY': 'CIRCARRAY', 'CA': 'CIRCARRAY', 'POLAR': 'CIRCARRAY',
    // Dimensioning
    'D': 'DIMENSION', 'DI': 'DIMENSION', 'DIM': 'DIMENSION', 'DIMENSION': 'DIMENSION',
    'SD': 'DIMENSION', 'SMART': 'DIMENSION',
    'DIMENSION_SMART': 'DIMENSION_SMART',
    'DLI': 'DIMENSION_LINEAR', 'DIMLINEAR': 'DIMENSION_LINEAR', 'DIMENSION_LINEAR': 'DIMENSION_LINEAR',
    'DAL': 'DIMENSION_ALIGNED', 'DIMALIGNED': 'DIMENSION_ALIGNED', 'DIMENSION_ALIGNED': 'DIMENSION_ALIGNED',
    'DAN': 'DIMENSION_ANGULAR', 'DIMANGULAR': 'DIMENSION_ANGULAR', 'DIMENSION_ANGULAR': 'DIMENSION_ANGULAR',
    'DRA': 'DIMENSION_RADIAL', 'DIMRADIUS': 'DIMENSION_RADIAL', 'DIMENSION_RADIAL': 'DIMENSION_RADIAL',
    'DDI': 'DIMENSION_DIAMETER', 'DIMDIAMETER': 'DIMENSION_DIAMETER', 'DIMENSION_DIAMETER': 'DIMENSION_DIAMETER',
    'LEAD': 'LEADER', 'LEADER': 'LEADER', 'MLEADER': 'LEADER',
    'M': 'MEASURE', 'MEASURE': 'MEASURE', 'DIST': 'MEASURE', 'OLCU': 'MEASURE', 'CALIPER': 'MEASURE',
    // Analysis
    'MOHR': 'MOHR', 'MOHRS': 'MOHR',
    'CROSS': 'CROSS_SECTION', 'AREA': 'CROSS_SECTION', 'CROSS_SECTION': 'CROSS_SECTION', 'SECTION': 'CROSS_SECTION',
    'TSLOT': 'TSLOT', 'TS': 'TSLOT', 'PROFILE': 'TSLOT', 'TSLOT20': 'TSLOT', 'TSLOT30': 'TSLOT', 'TSLOT40': 'TSLOT', 'TSLOT45': 'TSLOT',
    '2020': 'TSLOT', '2040': 'TSLOT', '2060': 'TSLOT', '2080': 'TSLOT',
    '3030': 'TSLOT', '3060': 'TSLOT', '3090': 'TSLOT', '30120': 'TSLOT',
    '4040': 'TSLOT', '4060': 'TSLOT', '4080': 'TSLOT', '40120': 'TSLOT', '40160': 'TSLOT',
    '4545': 'TSLOT', '4560': 'TSLOT', '4590': 'TSLOT',
    '5050': 'TSLOT', '50100': 'TSLOT',
    '6060': 'TSLOT', '60120': 'TSLOT',
    '8080': 'TSLOT', '80160': 'TSLOT',
    // Mechanical Engineering
    'GEAR': 'GEAR', 'INVOLUTE': 'GEAR', 'GE': 'GEAR', 'DISLI': 'GEAR',
    'MG': 'MATING_GEAR', 'MATING': 'MATING_GEAR', 'MATING_GEAR': 'MATING_GEAR', 'MESH': 'MATING_GEAR',
    'BELT': 'BELT_PULLEY', 'PULLEY': 'BELT_PULLEY', 'BELT_PULLEY': 'BELT_PULLEY', 'BP': 'BELT_PULLEY', 'KAYIS': 'BELT_PULLEY', 'KASNAK': 'BELT_PULLEY', 'KAYIS_KASNAK': 'BELT_PULLEY',
    'PG': 'PLANETARY_GEAR', 'PLANET': 'PLANETARY_GEAR', 'PLANETARY': 'PLANETARY_GEAR', 'PLANETARY_GEAR': 'PLANETARY_GEAR',
    'BOLT': 'FASTENER', 'NUT': 'FASTENER', 'FASTENER': 'FASTENER', 'SCREW': 'FASTENER',
    'CHAIN': 'ROLLER_CHAIN', 'ROLLER_CHAIN': 'ROLLER_CHAIN', 'SPROCKET': 'ROLLER_CHAIN', 'ZINCIR': 'ROLLER_CHAIN', 'DISLI_CARK': 'ROLLER_CHAIN',
    // Annotation & Symbols
    'T': 'TEXT', 'TEXT': 'TEXT', 'MTEXT': 'TEXT',
    'SURF': 'SURFACE', 'SURFACE': 'SURFACE', 'SURFFINISH': 'SURFACE', 'SURFACETEXTURE': 'SURFACE', 'YUZEY': 'SURFACE', 'ROUGHNESS': 'SURFACE', 'SURFACE_FINISH': 'SURFACE',
    'SURFLEAD': 'SURF_LEADER', 'SURF_LEADER': 'SURF_LEADER', 'SLEAD': 'SURF_LEADER', 'SURFACELEADER': 'SURF_LEADER', 'YUZEYLIDER': 'SURF_LEADER',
    'SURFDIR': 'SURFACE_DIRECT', 'SURFACE_DIRECT': 'SURFACE_DIRECT',
    'RA32': 'SURF_RA_32', 'RA16': 'SURF_RA_16', 'RA08': 'SURF_RA_08', 'RA04': 'SURF_RA_04', 'RA02': 'SURF_RA_02', 'RA63': 'SURF_RA_63', 'RA125': 'SURF_RA_125',
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
    private lastCommandId: string | null = null;

    constructor() {
        // Initialize
    }

    /**
     * Start a command by its canonical ID.
     * Looks up the factory in COMMAND_REGISTRY and instantiates a new tool.
     */
    public startCommand(commandId: string) {
        const trimmed = (commandId || '').trim();
        if (!trimmed) return;

        // Resolve alias if not a direct canonical ID
        const resolved = COMMAND_ALIASES[trimmed.toUpperCase()] || trimmed.toUpperCase();

        if (INSTANT_COMMANDS.has(resolved)) {
            this.runInstant(resolved);
            return;
        }

        const factory = COMMAND_REGISTRY.get(resolved);
        if (!factory) {
            console.warn(`Command not found: ${commandId} (resolved: ${resolved})`);
            useCadStore.setState({
                commandPrompt: `Unknown command "${commandId}". Type HELP for available commands.`,
                commandState: 'IDLE',
            });
            return;
        }

        const command = factory();
        this.setActiveCommand(command);
    }

    /** Canonical command id for a typed word (alias or id), or null when it is not a command. */
    public resolveCommandId(word: string): string | null {
        const w = (word || '').trim().toUpperCase();
        if (!w) return null;
        const id = COMMAND_ALIASES[w] || w;
        return COMMAND_REGISTRY.has(id) || INSTANT_COMMANDS.has(id) ? id : null;
    }

    /**
     * Command-line text while a command is running: a command name switches to that
     * command (unless it is one of the running command's option keywords or a value).
     */
    public commandToSwitchTo(text: string): string | null {
        const t = (text || '').trim().toUpperCase();
        if (!t || VALUE_LIKE.test(t) || OPTION_WORDS.has(t) || /\s/.test(t)) return null;
        return this.resolveCommandId(t);
    }

    private runInstant(id: string): void {
        const store = useCadStore.getState();
        switch (id) {
            case 'ERASE': {
                const n = store.selectedIds.length;
                if (n > 0) {
                    this.setActiveCommand(null);
                    store.deleteSelected();
                    useCadStore.setState({ commandPrompt: `Erased ${n} object${n === 1 ? '' : 's'}` });
                } else {
                    this.setActiveCommand(new EraseTool());
                }
                return;
            }
            case 'UNDO':
                store.undo();
                useCadStore.setState({ commandPrompt: 'Undo' });
                return;
            case 'REDO':
                store.redo();
                useCadStore.setState({ commandPrompt: 'Redo' });
                return;
            case 'ZOOM':
                store.zoomExtents();
                useCadStore.setState({ commandPrompt: 'Zoom extents' });
                return;
            case 'PAN':
                useCadStore.setState({ commandPrompt: 'Pan: drag with the middle mouse button or Alt + drag' });
                return;
        }
    }

    public setActiveTool(command: Command | null) {
        this.setActiveCommand(command);
    }

    public setActiveCommand(command: Command | null) {
        if (this.activeCommand) {
            this.activeCommand.cancel();
        }

        this.activeCommand = command;

        if (this.activeCommand) {
            if (this.activeCommand.id !== 'SELECT') {
                this.lastCommandId = this.activeCommand.id;
            }
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

    public repeatLastCommand(): boolean {
        if (this.lastCommandId) {
            this.startCommand(this.lastCommandId);
            return true;
        }
        return false;
    }

    public getLastCommandId(): string | null {
        return this.lastCommandId;
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
    public handleMouseDown(point: Point) {
        if (this.activeCommand && this.activeCommand.onMouseDown) {
            this.activeCommand.onMouseDown(point);
        }
    }

    public handleMouseUp(point?: Point) {
        if (this.activeCommand && this.activeCommand.onMouseUp) {
            this.activeCommand.onMouseUp(point);
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

    public handleKeyInput(key: string) {
        if (this.activeCommand && this.activeCommand.onKeyInput) {
            this.activeCommand.onKeyInput(key);
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
            const fullTrimmed = resolvedValue.trim();
            const parts = fullTrimmed.split(/\s+/);
            const baseCmd = parts[0]?.toUpperCase() || '';
            const arg = parts.slice(1).join(' ');
            const resolved = this.resolveCommandId(fullTrimmed) || this.resolveCommandId(baseCmd);

            if (resolved) {
                this.startCommand(resolved);
                const active = this.getActiveCommand();
                if (arg && active) {
                    active.onValueInput(arg);
                } else if (COMMAND_ALIASES[fullTrimmed.toUpperCase()] === 'TSLOT' && fullTrimmed.length >= 4 && !isNaN(Number(fullTrimmed))) {
                    active?.onValueInput(fullTrimmed);
                }
            } else {
                useCadStore.setState({ commandPrompt: `Unknown: ${baseCmd}` });
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
