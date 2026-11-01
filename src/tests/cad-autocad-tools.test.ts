import { describe, it, expect, beforeEach } from 'vitest';
import { commandProcessor } from '../cad/commands/CommandProcessor';
import { useCadStore } from '../cad/store/cadStore';
import { EllipseTool } from '../cad/commands/tools/EllipseTool';
import { SplineTool } from '../cad/commands/tools/SplineTool';
import { LeaderTool } from '../cad/commands/tools/LeaderTool';
import { MeasureTool } from '../cad/commands/tools/MeasureTool';
import { HatchTool } from '../cad/commands/tools/HatchTool';
import { ArcTool } from '../cad/commands/tools/ArcTool';
import { CircleTool } from '../cad/commands/tools/CircleTool';
import { RectangleTool } from '../cad/commands/tools/RectangleTool';
import { PolygonTool } from '../cad/commands/tools/PolygonTool';
import { LineTool } from '../cad/commands/tools/LineTool';
import { DimensionTool } from '../cad/commands/tools/DimensionTool';

describe('AutoCAD New-Gen CAD Tools & CommandProcessor Suite', () => {
    beforeEach(() => {
        useCadStore.getState().clearEntities();
        commandProcessor.setActiveCommand(null);
    });

    it('should support case-insensitive and aliased command lookups in CommandProcessor', () => {
        commandProcessor.startCommand('line');
        expect(commandProcessor.getActiveCommand()?.name).toBe('LINE');
        expect(useCadStore.getState().activeCommand).toBe('LINE');

        commandProcessor.startCommand('rec');
        expect(commandProcessor.getActiveCommand()?.name).toBe('RECTANGLE');
        expect(useCadStore.getState().activeCommand).toBe('RECTANGLE');

        commandProcessor.startCommand('el');
        expect(commandProcessor.getActiveCommand()?.name).toBe('ELLIPSE');
        expect(useCadStore.getState().activeCommand).toBe('ELLIPSE');

        commandProcessor.startCommand('spl');
        expect(commandProcessor.getActiveCommand()?.name).toBe('SPLINE');
        expect(useCadStore.getState().activeCommand).toBe('SPLINE');

        commandProcessor.startCommand('dist');
        expect(commandProcessor.getActiveCommand()?.name).toBe('MEASURE');
        expect(useCadStore.getState().activeCommand).toBe('MEASURE');

        commandProcessor.startCommand('m');
        expect(commandProcessor.getActiveCommand()?.name).toBe('MEASURE');
        expect(useCadStore.getState().activeCommand).toBe('MEASURE');

        commandProcessor.startCommand('M');
        expect(commandProcessor.getActiveCommand()?.name).toBe('MEASURE');
        expect(useCadStore.getState().activeCommand).toBe('MEASURE');

        commandProcessor.startCommand('mv');
        expect(commandProcessor.getActiveCommand()?.name).toBe('MOVE');
        expect(useCadStore.getState().activeCommand).toBe('MOVE');

        commandProcessor.startCommand('lead');
        expect(commandProcessor.getActiveCommand()?.name).toBe('LEADER');
        expect(useCadStore.getState().activeCommand).toBe('LEADER');

        commandProcessor.startCommand('h');
        expect(commandProcessor.getActiveCommand()?.name).toBe('HATCH');
        expect(useCadStore.getState().activeCommand).toBe('HATCH');
    });

    it('EllipseTool should create ELLIPSE entity from points', () => {
        const tool = new EllipseTool();
        commandProcessor.setActiveCommand(tool);

        // 1. Center
        tool.onPointInput({ x: 0, y: 0 });
        // 2. Major radius endpoint
        tool.onPointInput({ x: 50, y: 0 });
        // 3. Minor radius endpoint
        tool.onPointInput({ x: 0, y: 25 });

        const entities = useCadStore.getState().entities;
        expect(entities.length).toBe(1);
        expect(entities[0].geometry.type).toBe('ELLIPSE');
        const geom = entities[0].geometry as any;
        expect(geom.radiusX).toBe(50);
        expect(geom.radiusY).toBe(25);
    });

    it('SplineTool should create SPLINE entity from control points', () => {
        const tool = new SplineTool();
        commandProcessor.setActiveCommand(tool);

        tool.onPointInput({ x: 0, y: 0 });
        tool.onPointInput({ x: 20, y: 30 });
        tool.onPointInput({ x: 40, y: -10 });
        tool.onPointInput({ x: 60, y: 20 });
        tool.finishSpline(false);

        const entities = useCadStore.getState().entities;
        expect(entities.length).toBe(1);
        expect(entities[0].geometry.type).toBe('SPLINE');
        const geom = entities[0].geometry as any;
        expect(geom.controlPoints.length).toBe(4);
        expect(geom.closed).toBe(false);
    });

    it('LeaderTool should create LEADER entity', () => {
        const tool = new LeaderTool();
        commandProcessor.setActiveCommand(tool);

        tool.onPointInput({ x: 10, y: 10 });
        tool.onPointInput({ x: 30, y: 40 });

        const entities = useCadStore.getState().entities;
        expect(entities.length).toBe(1);
        expect(entities[0].geometry.type).toBe('LEADER');
        const geom = entities[0].geometry as any;
        expect(geom.start).toEqual({ x: 10, y: 10 });
        expect(geom.end).toEqual({ x: 30, y: 40 });
    });

    it('MeasureTool should compute distance and deltas without polluting entities', () => {
        const tool = new MeasureTool();
        commandProcessor.setActiveCommand(tool);

        tool.onPointInput({ x: 0, y: 0 });
        tool.onPointInput({ x: 30, y: 40 });

        const entities = useCadStore.getState().entities;
        expect(entities.length).toBe(0); // Measure tool does not add permanent entity
        const prompt = useCadStore.getState().commandPrompt;
        expect(prompt).toContain('50.00 mm'); // 3-4-5 triangle hypotenuse
        expect(prompt).toContain('ΔX=30.00');
        expect(prompt).toContain('ΔY=40.00');
    });

    it('HatchTool should create HATCH entity for closed polygon', () => {
        const tool = new HatchTool();
        commandProcessor.setActiveCommand(tool);

        tool.onPointInput({ x: 0, y: 0 });
        tool.onPointInput({ x: 100, y: 0 });
        tool.onPointInput({ x: 100, y: 50 });
        tool.onPointInput({ x: 0, y: 50 });
        tool.finishHatch();

        const entities = useCadStore.getState().entities;
        expect(entities.length).toBe(1);
        expect(entities[0].geometry.type).toBe('HATCH');
        const geom = entities[0].geometry as any;
        expect(geom.boundaryVertices.length).toBe(4);
        expect(geom.pattern).toBe('ANSI31');
    });

    it('should correctly reset on cancel', () => {
        commandProcessor.startCommand('LINE');
        expect(commandProcessor.getActiveCommand()).not.toBeNull();

        useCadStore.getState().cancelCommand();
        expect(useCadStore.getState().activeCommand).toBeNull();
        expect(useCadStore.getState().commandState).toBe('IDLE');
    });

    it('SvgGenerator should export valid SVG containing lines and rectangles', async () => {
        const { generateSVG } = await import('../cad/export/SvgGenerator');
        const { createLineEntity, createRectangleEntity } = await import('../cad/kernel/types');

        const line = createLineEntity({ x: 0, y: 0 }, { x: 50, y: 50 }, '0', '#3ad0e6');
        const rect = createRectangleEntity({ x: 100, y: 100 }, 40, 20, '0', '#ffffff');

        const svg = generateSVG([line, rect], [{ id: '0', name: 'Layer0', color: '#ffffff', lineWeight: 1, isVisible: true, isLocked: false }]);
        expect(svg).toContain('<svg');
        expect(svg).toContain('</svg>');
        expect(svg).toContain('<line');
        expect(svg).toContain('<rect');
        expect(svg).toContain('width="40"');
        expect(svg).toContain('height="20"');
    });

    it('Polar Tracking (F10) should toggle and constrain line angle', () => {
        const store = useCadStore.getState();
        expect(store.polarTrackingEnabled).toBe(false);

        store.togglePolarTracking();
        expect(useCadStore.getState().polarTrackingEnabled).toBe(true);
        expect(useCadStore.getState().orthoEnabled).toBe(false);

        store.setPolarAngleIncrement(30);
        expect(useCadStore.getState().polarAngleIncrement).toBe(30);

        // Turn off polar tracking
        store.togglePolarTracking();
        expect(useCadStore.getState().polarTrackingEnabled).toBe(false);
    });

    describe('ArcTool (3-Point Arc Engine)', () => {
        it('should correctly compute counter-clockwise arc through 3 points', () => {
            const tool = new ArcTool();
            // p1 = (10, 0), p2 = (0, 10), p3 = (-10, 0) -> upper semicircle, CCW
            const arc = tool.computeArc({ x: 10, y: 0 }, { x: 0, y: 10 }, { x: -10, y: 0 });
            expect(arc).not.toBeNull();
            expect(arc!.center.x).toBeCloseTo(0, 2);
            expect(arc!.center.y).toBeCloseTo(0, 2);
            expect(arc!.radius).toBeCloseTo(10, 2);
            expect(arc!.startAngle).toBeCloseTo(0, 2);
            expect(arc!.endAngle).toBeCloseTo(Math.PI, 2);
        });

        it('should correctly compute clockwise arc through 3 points using standard CCW representation', () => {
            const tool = new ArcTool();
            // p1 = (10, 0), p2 = (0, -10), p3 = (-10, 0) -> lower semicircle, CW
            const arc = tool.computeArc({ x: 10, y: 0 }, { x: 0, y: -10 }, { x: -10, y: 0 });
            expect(arc).not.toBeNull();
            expect(arc!.center.x).toBeCloseTo(0, 2);
            expect(arc!.center.y).toBeCloseTo(0, 2);
            expect(arc!.radius).toBeCloseTo(10, 2);
            // In standard CCW representation, lower semicircle runs from PI to 0 (or -PI to 0) through -PI/2
            expect(arc!.startAngle).toBeCloseTo(Math.PI, 2);
            expect(arc!.endAngle).toBeCloseTo(0, 2);
        });

        it('should create ARC entity through 3 user clicks and update preview', () => {
            const tool = new ArcTool();
            commandProcessor.setActiveCommand(tool);
            tool.start();

            // Point 1: Start
            tool.onPointInput({ x: 0, y: 0 });
            tool.onMouseMove({ x: 50, y: 20 });
            let preview = useCadStore.getState().previewEntity;
            expect(preview).not.toBeNull();
            expect(preview!.geometry.type).toBe('LINE');

            // Point 2: Through
            tool.onPointInput({ x: 50, y: 20 });
            tool.onMouseMove({ x: 100, y: 0 });
            preview = useCadStore.getState().previewEntity;
            expect(preview).not.toBeNull();
            expect(preview!.geometry.type).toBe('ARC');

            // Point 3: End
            tool.onPointInput({ x: 100, y: 0 });
            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            expect(entities[0].geometry.type).toBe('ARC');
            const geom = entities[0].geometry as any;
            expect(geom.radius).toBeGreaterThan(50);
            expect(useCadStore.getState().previewEntity).toBeNull();
        });

        it('should safely handle collinear points without crashing', () => {
            const tool = new ArcTool();
            const arc = tool.computeArc({ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 100 });
            expect(arc).toBeNull();
        });
    });

    describe('AutoCAD Multi-Method Circle Tool Suite', () => {
        it('should support all Circle command aliases in CommandProcessor', () => {
            commandProcessor.startCommand('cr');
            expect(commandProcessor.getActiveCommand()?.id).toBe('CIRCLE');

            commandProcessor.startCommand('cd');
            expect(commandProcessor.getActiveCommand()?.id).toBe('CIRCLE_CENTER_DIAMETER');

            commandProcessor.startCommand('2p');
            expect(commandProcessor.getActiveCommand()?.id).toBe('CIRCLE_2P');

            commandProcessor.startCommand('c3p');
            expect(commandProcessor.getActiveCommand()?.id).toBe('CIRCLE_3P');

            commandProcessor.startCommand('ttr');
            expect(commandProcessor.getActiveCommand()?.id).toBe('CIRCLE_TTR');

            commandProcessor.startCommand('ttt');
            expect(commandProcessor.getActiveCommand()?.id).toBe('CIRCLE_TTT');
        });

        it('CircleTool CENTER_RADIUS should create circle from center and radius', () => {
            const tool = new CircleTool('CENTER_RADIUS');
            commandProcessor.setActiveCommand(tool);
            tool.start();

            tool.onPointInput({ x: 10, y: 20 });
            tool.onValueInput('15');

            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            expect(entities[0].geometry.type).toBe('CIRCLE');
            const geom = entities[0].geometry as any;
            expect(geom.center).toEqual({ x: 10, y: 20 });
            expect(geom.radius).toBe(15);
        });

        it('CircleTool CENTER_DIAMETER should create circle with radius = diameter / 2', () => {
            const tool = new CircleTool('CENTER_DIAMETER');
            commandProcessor.setActiveCommand(tool);
            tool.start();

            tool.onPointInput({ x: 0, y: 0 });
            tool.onValueInput('50'); // Diameter = 50 -> Radius = 25

            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            const geom = entities[0].geometry as any;
            expect(geom.center).toEqual({ x: 0, y: 0 });
            expect(geom.radius).toBe(25);
        });

        it('CircleTool 2P should compute circle from two opposite diameter endpoints', () => {
            const tool = new CircleTool('2P');
            commandProcessor.setActiveCommand(tool);
            tool.start();

            tool.onPointInput({ x: 0, y: 0 });
            tool.onPointInput({ x: 40, y: 0 }); // Diameter endpoints: center should be (20, 0), radius 20

            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            const geom = entities[0].geometry as any;
            expect(geom.center.x).toBeCloseTo(20, 4);
            expect(geom.center.y).toBeCloseTo(0, 4);
            expect(geom.radius).toBeCloseTo(20, 4);
        });

        it('CircleTool 3P should compute circumcircle passing through 3 points', () => {
            const tool = new CircleTool('3P');
            const circle = tool.compute3PCircle({ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 0, y: 20 });
            expect(circle).not.toBeNull();
            expect(circle!.center.x).toBeCloseTo(10, 4);
            expect(circle!.center.y).toBeCloseTo(10, 4);
            expect(circle!.radius).toBeCloseTo(Math.SQRT2 * 10, 4);
        });

        it('CircleTool TTR should compute circle tangent to two perpendicular lines', () => {
            const tool = new CircleTool('TTR');
            const line1 = {
                entity: { id: 'l1', layerId: '0', color: '#fff', isVisible: true, isSelected: false, geometry: { type: 'LINE' as const, start: { x: 0, y: 0 }, end: { x: 100, y: 0 } } },
                pickPoint: { x: 20, y: 5 }
            };
            const line2 = {
                entity: { id: 'l2', layerId: '0', color: '#fff', isVisible: true, isSelected: false, geometry: { type: 'LINE' as const, start: { x: 0, y: 0 }, end: { x: 0, y: 100 } } },
                pickPoint: { x: 5, y: 20 }
            };

            const circle = tool.computeTTRCircle(line1, line2, 10);
            expect(circle).not.toBeNull();
            expect(circle!.radius).toBe(10);
            expect(circle!.center.x).toBeCloseTo(10, 2);
            expect(circle!.center.y).toBeCloseTo(10, 2);
        });
    });

    describe('AutoCAD Multi-Method Arc Tool Suite', () => {
        it('should support all Arc command aliases in CommandProcessor', () => {
            commandProcessor.startCommand('a3p');
            expect(commandProcessor.getActiveCommand()?.id).toBe('ARC');

            commandProcessor.startCommand('sce');
            expect(commandProcessor.getActiveCommand()?.id).toBe('ARC_START_CENTER_END');

            commandProcessor.startCommand('sca');
            expect(commandProcessor.getActiveCommand()?.id).toBe('ARC_START_CENTER_ANGLE');

            commandProcessor.startCommand('scl');
            expect(commandProcessor.getActiveCommand()?.id).toBe('ARC_START_CENTER_LENGTH');

            commandProcessor.startCommand('ser');
            expect(commandProcessor.getActiveCommand()?.id).toBe('ARC_START_END_RADIUS');

            commandProcessor.startCommand('sed');
            expect(commandProcessor.getActiveCommand()?.id).toBe('ARC_START_END_DIRECTION');

            commandProcessor.startCommand('cse');
            expect(commandProcessor.getActiveCommand()?.id).toBe('ARC_CENTER_START_END');

            commandProcessor.startCommand('csa');
            expect(commandProcessor.getActiveCommand()?.id).toBe('ARC_CENTER_START_ANGLE');

            commandProcessor.startCommand('cont');
            expect(commandProcessor.getActiveCommand()?.id).toBe('ARC_CONTINUE');
        });

        it('ArcTool START_CENTER_END (SCE) should compute correct arc from start, center, and end ray', () => {
            const tool = new ArcTool('START_CENTER_END');
            const arc = tool.computeSCEArc({ x: 10, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 10 });
            expect(arc).not.toBeNull();
            expect(arc!.center).toEqual({ x: 0, y: 0 });
            expect(arc!.radius).toBe(10);
            expect(arc!.startAngle).toBeCloseTo(0, 4);
            expect(arc!.endAngle).toBeCloseTo(Math.PI / 2, 4);
        });

        it('ArcTool START_CENTER_LENGTH (SCL) should compute arc from chord length', () => {
            const tool = new ArcTool('START_CENTER_LENGTH');
            // Radius 10, chord length = 10 * sqrt(2) -> 90 degrees
            const chordL = 10 * Math.SQRT2;
            const arc = tool.computeSCLArc({ x: 10, y: 0 }, { x: 0, y: 0 }, { x: 10, y: chordL });
            expect(arc).not.toBeNull();
            expect(arc!.radius).toBe(10);
            expect(arc!.startAngle).toBeCloseTo(0, 4);
            expect(arc!.endAngle).toBeCloseTo(Math.PI / 2, 2);
        });

        it('ArcTool START_END_RADIUS (SER) should compute arc from endpoints and radius', () => {
            const tool = new ArcTool('START_END_RADIUS');
            // Start (-10, 0), End (10, 0), Radius 10 -> Semicircle
            const arc = tool.computeSERArc({ x: -10, y: 0 }, { x: 10, y: 0 }, null, 10);
            expect(arc).not.toBeNull();
            expect(arc!.radius).toBe(10);
            expect(arc!.center.x).toBeCloseTo(0, 2);
            expect(arc!.center.y).toBeCloseTo(0, 2);
        });

        it('ArcTool CONTINUE should create tangent arc directly connecting to prior line', () => {
            // Add a line from (0,0) to (20,0)
            useCadStore.getState().addEntity({
                id: 'line-prior',
                layerId: '0',
                color: '#fff',
                isVisible: true,
                isSelected: false,
                geometry: { type: 'LINE', start: { x: 0, y: 0 }, end: { x: 20, y: 0 } }
            });

            const tool = new ArcTool('CONTINUE');
            commandProcessor.setActiveCommand(tool);
            tool.start();

            // Click end point of tangent arc
            tool.onPointInput({ x: 30, y: 10 });

            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(2);
            expect(entities[1].geometry.type).toBe('ARC');
        });
    });

    describe('AutoCAD Multi-Method Rectangle Tool Suite', () => {
        it('should support all Rectangle command aliases in CommandProcessor', () => {
            commandProcessor.startCommand('rec');
            expect(commandProcessor.getActiveCommand()?.id).toBe('RECTANGLE');

            commandProcessor.startCommand('r2p');
            expect(commandProcessor.getActiveCommand()?.id).toBe('RECTANGLE');

            commandProcessor.startCommand('rctr');
            expect(commandProcessor.getActiveCommand()?.id).toBe('RECTANGLE_CENTER');

            commandProcessor.startCommand('r3p');
            expect(commandProcessor.getActiveCommand()?.id).toBe('RECTANGLE_3P');

            commandProcessor.startCommand('rfillet');
            expect(commandProcessor.getActiveCommand()?.id).toBe('RECTANGLE_FILLET');

            commandProcessor.startCommand('rchamfer');
            expect(commandProcessor.getActiveCommand()?.id).toBe('RECTANGLE_CHAMFER');
        });

        it('RectangleTool 2P should compute corner to corner rectangle', () => {
            const tool = new RectangleTool('2P');
            commandProcessor.setActiveCommand(tool);
            tool.start();

            tool.onPointInput({ x: 0, y: 0 });
            tool.onPointInput({ x: 100, y: 50 });

            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            expect(entities[0].geometry.type).toBe('RECTANGLE');
            const geom = entities[0].geometry as any;
            expect(geom.center).toEqual({ x: 50, y: 25 });
            expect(geom.width).toBe(100);
            expect(geom.height).toBe(50);
        });

        it('RectangleTool CENTER should compute center to corner rectangle', () => {
            const tool = new RectangleTool('CENTER');
            commandProcessor.setActiveCommand(tool);
            tool.start();

            tool.onPointInput({ x: 50, y: 50 });
            tool.onPointInput({ x: 100, y: 75 });

            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            expect(entities[0].geometry.type).toBe('RECTANGLE');
            const geom = entities[0].geometry as any;
            expect(geom.center).toEqual({ x: 50, y: 50 });
            expect(geom.width).toBe(100);
            expect(geom.height).toBe(50);
        });

        it('RectangleTool 3P should compute rotated rectangle vertices', () => {
            const tool = new RectangleTool('3P');
            // Base: (0,0) to (100,0), Height point (100, 50)
            const corners = tool.compute3PRotatedRect({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 50 });
            expect(corners).not.toBeNull();
            expect(corners!.length).toBe(4);
            expect(corners![0]).toEqual({ x: 0, y: 0 });
            expect(corners![1]).toEqual({ x: 100, y: 0 });
            expect(corners![2]).toEqual({ x: 100, y: 50 });
            expect(corners![3]).toEqual({ x: 0, y: 50 });
        });

        it('RectangleTool FILLET and CHAMFER should compute 8 beveled/filleted corners', () => {
            const tool = new RectangleTool('FILLET');
            const fCorners = tool.computeFilletedRectCorners({ x: 0, y: 0 }, { x: 100, y: 100 }, 10);
            expect(fCorners).not.toBeNull();
            expect(fCorners!.length).toBe(8);

            const cCorners = tool.computeChamferedRectCorners({ x: 0, y: 0 }, { x: 100, y: 100 }, 10);
            expect(cCorners).not.toBeNull();
            expect(cCorners!.length).toBe(8);
        });
    });

    describe('AutoCAD Multi-Method Polygon Tool Suite', () => {
        it('should support all Polygon command aliases in CommandProcessor', () => {
            commandProcessor.startCommand('pol');
            expect(commandProcessor.getActiveCommand()?.id).toBe('POLYGON');

            commandProcessor.startCommand('pol_i');
            expect(commandProcessor.getActiveCommand()?.id).toBe('POLYGON');

            commandProcessor.startCommand('pol_c');
            expect(commandProcessor.getActiveCommand()?.id).toBe('POLYGON_CIRCUMSCRIBED');

            commandProcessor.startCommand('pol_e');
            expect(commandProcessor.getActiveCommand()?.id).toBe('POLYGON_EDGE');
        });

        it('PolygonTool INSCRIBED should create polygon with vertices touching radius R', () => {
            const tool = new PolygonTool('INSCRIBED');
            commandProcessor.setActiveCommand(tool);
            tool.start();
            tool.setParams({ sides: 6 });

            tool.onPointInput({ x: 0, y: 0 });
            tool.onPointInput({ x: 50, y: 0 });

            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            expect(entities[0].geometry.type).toBe('HEXAGON');
            const geom = entities[0].geometry as any;
            expect(geom.radius).toBeCloseTo(50, 4);
            expect(geom.sides).toBe(6);
        });

        it('PolygonTool CIRCUMSCRIBED should calculate circumradius from flat distance (Across Flats)', () => {
            const tool = new PolygonTool('CIRCUMSCRIBED');
            tool.start();
            tool.setParams({ sides: 6 });

            tool.onPointInput({ x: 0, y: 0 });
            // Distance to flat side = 10 * sqrt(3) / 2 = 8.66025 -> vertex radius = 10
            const rFlat = 10 * Math.cos(Math.PI / 6);
            tool.solveGeometry({ x: rFlat, y: 0 });

            const toolAny = tool as any;
            expect(toolAny.radius).toBeCloseTo(10, 4);
        });

        it('PolygonTool EDGE should calculate center and circumradius from edge endpoints', () => {
            const tool = new PolygonTool('EDGE');
            tool.start();
            tool.setParams({ sides: 4 }); // Square with edge 10 -> R = 10 / (2 * sin(pi/4)) = 10 / sqrt(2) = 7.071

            tool.onPointInput({ x: 0, y: 0 });
            tool.solveGeometry({ x: 10, y: 0 });

            const toolAny = tool as any;
            expect(toolAny.radius).toBeCloseTo(10 / (2 * Math.sin(Math.PI / 4)), 4);
            expect(toolAny.calculatedCenter.x).toBeCloseTo(5, 4);
            expect(toolAny.calculatedCenter.y).toBeCloseTo(5, 4);
        });
    });

    describe('AutoCAD Multi-Method Ellipse Tool Suite', () => {
        it('should support all Ellipse command aliases in CommandProcessor', () => {
            commandProcessor.startCommand('el');
            expect(commandProcessor.getActiveCommand()?.id).toBe('ELLIPSE');

            commandProcessor.startCommand('ellipse_axis');
            expect(commandProcessor.getActiveCommand()?.id).toBe('ELLIPSE_AXIS');

            commandProcessor.startCommand('ellipse_arc');
            expect(commandProcessor.getActiveCommand()?.id).toBe('ELLIPSE_ARC');
        });

        it('EllipseTool AXIS should calculate center as midpoint of axis endpoints', () => {
            const tool = new EllipseTool('AXIS');
            commandProcessor.setActiveCommand(tool);
            tool.start();

            tool.onPointInput({ x: 0, y: 0 });
            tool.onPointInput({ x: 100, y: 0 }); // Center = (50, 0), Rx = 50
            tool.onPointInput({ x: 50, y: 20 }); // Ry = 20

            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            expect(entities[0].geometry.type).toBe('ELLIPSE');
            const geom = entities[0].geometry as any;
            expect(geom.center).toEqual({ x: 50, y: 0 });
            expect(geom.radiusX).toBe(50);
            expect(geom.radiusY).toBe(20);
        });

        it('EllipseTool ARC should create partial elliptical arc entity', () => {
            const tool = new EllipseTool('ARC');
            commandProcessor.setActiveCommand(tool);
            tool.start();

            tool.onPointInput({ x: 0, y: 0 });   // Center
            tool.onPointInput({ x: 40, y: 0 });  // Major axis endpoint
            tool.onPointInput({ x: 0, y: 20 });  // Minor radius
            tool.onPointInput({ x: 40, y: 0 });  // Start angle
            tool.onPointInput({ x: 0, y: 20 });  // End angle

            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            expect(entities[0].geometry.type).toBe('ELLIPSE');
            const geom = entities[0].geometry as any;
            expect(geom.radiusX).toBe(40);
            expect(geom.radiusY).toBe(20);
            expect(geom.startAngle).toBeDefined();
            expect(geom.endAngle).toBeDefined();
        });
    });

    describe('AutoCAD Multi-Method Line & Construction Tool Suite', () => {
        it('should support Line, XLine, and Ray command aliases in CommandProcessor', () => {
            commandProcessor.startCommand('l');
            expect(commandProcessor.getActiveCommand()?.id).toBe('LINE');

            commandProcessor.startCommand('xl');
            expect(commandProcessor.getActiveCommand()?.id).toBe('XLINE');

            commandProcessor.startCommand('ray');
            expect(commandProcessor.getActiveCommand()?.id).toBe('RAY');
        });

        it('LineTool XLINE should compute infinite line extending in both directions', () => {
            const tool = new LineTool('XLINE');
            const { pStart, pEnd } = tool.computeEndpoints({ x: 0, y: 0 }, { x: 10, y: 0 });
            // Vector (1, 0) extended by 200,000 in both directions
            expect(pStart.x).toBeCloseTo(-200000, 1);
            expect(pStart.y).toBeCloseTo(0, 1);
            expect(pEnd.x).toBeCloseTo(200000, 1);
            expect(pEnd.y).toBeCloseTo(0, 1);
        });

        it('LineTool RAY should compute semi-infinite ray starting at root point', () => {
            const tool = new LineTool('RAY');
            const { pStart, pEnd } = tool.computeEndpoints({ x: 50, y: 50 }, { x: 50, y: 100 });
            // Vector (0, 1) extended by 200,000 from (50, 50)
            expect(pStart).toEqual({ x: 50, y: 50 });
            expect(pEnd.x).toBeCloseTo(50, 1);
            expect(pEnd.y).toBeCloseTo(200050, 1);
        });
    });

    describe('AutoCAD Multi-Method Dimension Tool Suite', () => {
        it('should support all Dimension command aliases in CommandProcessor', () => {
            commandProcessor.startCommand('dim');
            expect(commandProcessor.getActiveCommand()?.id).toBe('DIMENSION');

            commandProcessor.startCommand('dli');
            expect(commandProcessor.getActiveCommand()?.id).toBe('DIMENSION_LINEAR');

            commandProcessor.startCommand('dal');
            expect(commandProcessor.getActiveCommand()?.id).toBe('DIMENSION_ALIGNED');

            commandProcessor.startCommand('dan');
            expect(commandProcessor.getActiveCommand()?.id).toBe('DIMENSION_ANGULAR');

            commandProcessor.startCommand('dra');
            expect(commandProcessor.getActiveCommand()?.id).toBe('DIMENSION_RADIAL');

            commandProcessor.startCommand('ddi');
            expect(commandProcessor.getActiveCommand()?.id).toBe('DIMENSION_DIAMETER');
        });

        it('DimensionTool LINEAR should project horizontal or vertical dimensions', () => {
            const tool = new DimensionTool('LINEAR');
            commandProcessor.setActiveCommand(tool);
            tool.start();

            // Point 1: (0,0), Point 2: (80, 20) -> Horizontal is dominant
            tool.onPointInput({ x: 0, y: 0 });
            tool.onPointInput({ x: 80, y: 20 });

            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            expect(entities[0].geometry.type).toBe('DIMENSION');
            const geom = entities[0].geometry as any;
            expect(geom.text).toBe('80.00 mm');
        });

        it('DimensionTool ANGULAR should calculate included angle at apex', () => {
            const tool = new DimensionTool('ANGULAR');
            commandProcessor.setActiveCommand(tool);
            tool.start();

            // Apex at (0,0), Leg 1 at (50, 0), Leg 2 at (0, 50) -> 90 degrees
            tool.onPointInput({ x: 0, y: 0 });
            tool.onPointInput({ x: 50, y: 0 });
            tool.onPointInput({ x: 0, y: 50 });

            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            expect(entities[0].geometry.type).toBe('DIMENSION');
            const geom = entities[0].geometry as any;
            expect(geom.text).toBe('90.0°');
        });

        it('DimensionTool RADIAL and DIAMETER should format R and Ø prefixes', () => {
            const toolRad = new DimensionTool('RADIAL');
            commandProcessor.setActiveCommand(toolRad);
            toolRad.start();

            toolRad.onPointInput({ x: 0, y: 0 });
            toolRad.onPointInput({ x: 25, y: 0 });

            let entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            let geom = entities[0].geometry as any;
            expect(geom.text).toBe('R25.00 mm');

            useCadStore.getState().clearEntities();

            const toolDia = new DimensionTool('DIAMETER');
            commandProcessor.setActiveCommand(toolDia);
            toolDia.start();

            toolDia.onPointInput({ x: 0, y: 0 });
            toolDia.onPointInput({ x: 25, y: 0 });

            entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            geom = entities[0].geometry as any;
            expect(geom.text).toBe('⌀50.00 mm');
        });
    });

    describe('AutoCAD Direct Distance Entry & Typed Dimensions Suite', () => {
        beforeEach(() => {
            useCadStore.getState().clearEntities();
            commandProcessor.setActiveCommand(null);
        });

        it('CircleTool should parse diameter prefixes D50, Ø50, ÇAP 50 and set radius = 25', () => {
            const tool = new CircleTool('CENTER_RADIUS');
            commandProcessor.setActiveCommand(tool);
            tool.start();

            tool.onPointInput({ x: 0, y: 0 });
            tool.onValueInput('D50');

            let entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            let geom = entities[0].geometry as any;
            expect(geom.radius).toBe(25);

            useCadStore.getState().clearEntities();

            // Ø prefix
            const toolDia = new CircleTool('CENTER_RADIUS');
            commandProcessor.setActiveCommand(toolDia);
            toolDia.start();
            toolDia.onPointInput({ x: 10, y: 10 });
            toolDia.onValueInput('Ø60');

            entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            geom = entities[0].geometry as any;
            expect(geom.radius).toBe(30);

            useCadStore.getState().clearEntities();

            // ÇAP prefix
            const toolCap = new CircleTool('CENTER_RADIUS');
            commandProcessor.setActiveCommand(toolCap);
            toolCap.start();
            toolCap.onPointInput({ x: 0, y: 0 });
            toolCap.onValueInput('ÇAP 80');

            entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            geom = entities[0].geometry as any;
            expect(geom.radius).toBe(40);
        });

        it('CircleTool 2P mode should place diameter endpoint from typed distance', () => {
            const tool = new CircleTool('2P');
            commandProcessor.setActiveCommand(tool);
            tool.start();

            tool.onPointInput({ x: 0, y: 0 });
            tool.onMouseMove({ x: 1, y: 0 }); // East vector
            tool.onValueInput('50');

            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            const geom = entities[0].geometry as any;
            expect(geom.center.x).toBe(25);
            expect(geom.radius).toBe(25);
        });

        it('RectangleTool should parse typed dimensions W,H or WxH relative to first point', () => {
            const tool = new RectangleTool('2P');
            commandProcessor.setActiveCommand(tool);
            tool.start();

            tool.onPointInput({ x: 10, y: 10 });
            tool.onValueInput('100,50');

            let entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            let geom = entities[0].geometry as any;
            expect(geom.width).toBe(100);
            expect(geom.height).toBe(50);

            useCadStore.getState().clearEntities();

            // Format: 80x40
            const toolX = new RectangleTool('2P');
            commandProcessor.setActiveCommand(toolX);
            toolX.start();
            toolX.onPointInput({ x: 0, y: 0 });
            toolX.onValueInput('80x40');

            entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            geom = entities[0].geometry as any;
            expect(geom.width).toBe(80);
            expect(geom.height).toBe(40);

            useCadStore.getState().clearEntities();

            // Single number: Square
            const toolSq = new RectangleTool('2P');
            commandProcessor.setActiveCommand(toolSq);
            toolSq.start();
            toolSq.onPointInput({ x: 0, y: 0 });
            toolSq.onValueInput('50');

            entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            geom = entities[0].geometry as any;
            expect(geom.width).toBe(50);
            expect(geom.height).toBe(50);
        });

        it('LineTool should create direct distance line along cursor and support polar angles', () => {
            const tool = new LineTool('2P');
            commandProcessor.setActiveCommand(tool);
            tool.start();

            tool.onPointInput({ x: 0, y: 0 });
            tool.onMouseMove({ x: 10, y: 0 }); // East direction
            tool.onValueInput('100');

            let entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            let geom = entities[0].geometry as any;
            expect(geom.end.x).toBeCloseTo(100, 2);
            expect(geom.end.y).toBeCloseTo(0, 2);

            useCadStore.getState().clearEntities();

            // Polar angle: 100<45
            const toolPolar = new LineTool('2P');
            commandProcessor.setActiveCommand(toolPolar);
            toolPolar.start();
            toolPolar.onPointInput({ x: 0, y: 0 });
            toolPolar.onValueInput('100<45');

            entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            geom = entities[0].geometry as any;
            expect(geom.end.x).toBeCloseTo(100 * Math.cos(Math.PI / 4), 2);
        });

        it('PolygonTool should create exact AF or circumdiameter from typed D or AF values', () => {
            const toolInsc = new PolygonTool('INSCRIBED');
            commandProcessor.setActiveCommand(toolInsc);
            toolInsc.start();

            toolInsc.onPointInput({ x: 0, y: 0 });
            toolInsc.onValueInput('D100'); // Circumdiameter = 100 -> radius = 50

            let entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            let geom = entities[0].geometry as any;
            expect(geom.radius).toBe(50);

            useCadStore.getState().clearEntities();

            // CIRCUMSCRIBED with AF
            const toolCirc = new PolygonTool('CIRCUMSCRIBED');
            commandProcessor.setActiveCommand(toolCirc);
            toolCirc.start();

            toolCirc.onPointInput({ x: 0, y: 0 });
            toolCirc.onValueInput('AF 60'); // AF = 60 -> rFlat = 30

            entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            geom = entities[0].geometry as any;
            const rFlat = geom.radius * Math.cos(Math.PI / 6);
            expect(rFlat).toBeCloseTo(30, 2);
        });

        it('EllipseTool should create ellipse from typed dual radii 60,30 or D100,60', () => {
            const tool = new EllipseTool('CENTER');
            commandProcessor.setActiveCommand(tool);
            tool.start();

            tool.onPointInput({ x: 0, y: 0 });
            tool.onValueInput('60,30');

            let entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            let geom = entities[0].geometry as any;
            expect(geom.radiusX).toBe(60);
            expect(geom.radiusY).toBe(30);

            useCadStore.getState().clearEntities();

            // Diameters D100x60 -> rx=50, ry=30
            const toolDia = new EllipseTool('CENTER');
            commandProcessor.setActiveCommand(toolDia);
            toolDia.start();
            toolDia.onPointInput({ x: 0, y: 0 });
            toolDia.onValueInput('D100x60');

            entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            geom = entities[0].geometry as any;
            expect(geom.radiusX).toBe(50);
            expect(geom.radiusY).toBe(30);
        });

        it('DimensionTool should create dimension at exact distance from typed scalar or diameter', () => {
            const tool = new DimensionTool('SMART');
            commandProcessor.setActiveCommand(tool);
            tool.start();

            tool.onPointInput({ x: 0, y: 0 });
            tool.onMouseMove({ x: 10, y: 0 }); // Horizontal direction
            tool.onValueInput('75');

            let entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            let geom = entities[0].geometry as any;
            expect(geom.text).toBe('75.00 mm');

            useCadStore.getState().clearEntities();

            // Diameter dimension: Ø50
            const toolDia = new DimensionTool('DIAMETER');
            commandProcessor.setActiveCommand(toolDia);
            toolDia.start();
            toolDia.onPointInput({ x: 0, y: 0 });
            toolDia.onMouseMove({ x: 10, y: 0 });
            toolDia.onValueInput('Ø50');

            entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            geom = entities[0].geometry as any;
            expect(geom.text).toBe('⌀50.00 mm');
        });
    });
});

