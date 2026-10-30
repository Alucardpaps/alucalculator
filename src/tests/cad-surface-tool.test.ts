import { describe, it, expect, beforeEach } from 'vitest';
import { SurfaceTool } from '../cad/commands/tools/SurfaceTool';
import { commandProcessor } from '../cad/commands/CommandProcessor';
import { useCadStore } from '../cad/store/cadStore';
import { createLineEntity } from '../cad/kernel/types';

describe('AutoCAD Surface Finish & Leader Tool Suite (SURFACE / SURF_LEADER)', () => {
    beforeEach(() => {
        useCadStore.setState({
            entities: [],
            layers: [{ id: 'layer-0', name: '0', color: '#3ad0e6', isVisible: true, isLocked: false, opacity: 1, lineWeight: 1, isDeleted: false }],
            activeLayerId: 'layer-0',
            activeCommand: null,
            commandPrompt: '',
            history: []
        });
    });

    describe('SurfaceTool Initialization & Modes', () => {
        it('should initialize in LEADER mode by default with Ra 3.2', () => {
            const tool = new SurfaceTool();
            expect(tool.id).toBe('SURFACE');
            expect(tool.getMode()).toBe('LEADER');
            tool.start();
            expect(useCadStore.getState().commandPrompt).toContain('Yüzey İşareti Lideri');
            expect(useCadStore.getState().commandPrompt).toContain('Ra 3.2');
        });

        it('should initialize in DIRECT mode with preset values', () => {
            const tool = new SurfaceTool('DIRECT', {
                param: 'Ra',
                value: '1.6',
                symbolType: 'machining_required',
            });
            expect(tool.getMode()).toBe('DIRECT');
            tool.start();
            expect(useCadStore.getState().commandPrompt).toContain('Doğrudan Yerleşim');
            expect(useCadStore.getState().commandPrompt).toContain('Ra 1.6');
        });

        it('should switch modes cleanly using setMode', () => {
            const tool = new SurfaceTool();
            tool.start();
            tool.setMode('DIRECT');
            expect(tool.getMode()).toBe('DIRECT');
            expect(useCadStore.getState().commandPrompt).toContain('Doğrudan Yerleşim');

            tool.setMode('LEADER');
            expect(tool.getMode()).toBe('LEADER');
            expect(useCadStore.getState().commandPrompt).toContain('Lideri');
        });
    });

    describe('Interactive Point Placement (LEADER & DIRECT)', () => {
        it('should place ISO 1302 entities directly in DIRECT mode upon 1 click', () => {
            const tool = new SurfaceTool('DIRECT', { param: 'Ra', value: '0.8' });
            tool.start();

            expect(useCadStore.getState().entities.length).toBe(0);
            tool.onPointInput({ x: 50, y: 50 });

            const entities = useCadStore.getState().entities;
            expect(entities.length).toBeGreaterThan(2);

            // Verify lines & text are placed around (50, 50)
            const textEnt = entities.find(e => e.geometry.type === 'TEXT');
            expect(textEnt).toBeDefined();
            if (textEnt && textEnt.geometry.type === 'TEXT') {
                expect(textEnt.geometry.content).toContain('Ra 0.8');
            }

            // Verify common groupId
            const firstGroupId = entities[0].groupId;
            expect(firstGroupId).toBeDefined();
            expect(firstGroupId).toContain('grp_surf_');
            expect(entities.every(e => e.groupId === firstGroupId)).toBe(true);
        });

        it('should require 2 clicks in LEADER mode: 1st for arrowhead, 2nd for landing', () => {
            const tool = new SurfaceTool('LEADER', { param: 'Ra', value: '3.2' });
            tool.start();

            // 1st click: arrowhead position on part surface
            tool.onPointInput({ x: 10, y: 10 });
            expect(useCadStore.getState().entities.length).toBe(0);
            expect(useCadStore.getState().commandPrompt).toContain('İniş');

            // 2nd click: landing position where symbol sits
            tool.onPointInput({ x: 40, y: 30 });
            const entities = useCadStore.getState().entities;
            expect(entities.length).toBeGreaterThan(4); // stem line + shoulder + arrowhead wings + symbol

            // Must include leader stem line from (10,10) to (40,30)
            const stem = entities.find(e =>
                e.geometry.type === 'LINE' &&
                e.geometry.start.x === 10 && e.geometry.start.y === 10 &&
                e.geometry.end.x === 40 && e.geometry.end.y === 30
            );
            expect(stem).toBeDefined();

            // Must include text with Ra 3.2
            const textEnt = entities.find(e => e.geometry.type === 'TEXT');
            expect(textEnt).toBeDefined();
            if (textEnt && textEnt.geometry.type === 'TEXT') {
                expect(textEnt.geometry.content).toContain('Ra 3.2');
            }

            // All entities must share the same groupId for group transformation
            const groupId = entities[0].groupId;
            expect(groupId).toContain('grp_surf_');
            expect(entities.every(e => e.groupId === groupId)).toBe(true);
        });
    });

    describe('Direct Value & Keyboard Entry', () => {
        it('should update roughness from typed string values like "1.6" or "Ra 0.4"', () => {
            const tool = new SurfaceTool('LEADER');
            tool.start();

            tool.onValueInput('1.6');
            expect(useCadStore.getState().commandPrompt).toContain('Ra 1.6');

            tool.onValueInput('Rz 6.3');
            expect(useCadStore.getState().commandPrompt).toContain('Rz 6.3');

            tool.onValueInput('0.2');
            expect(useCadStore.getState().commandPrompt).toContain('Rz 0.2');
        });

        it('should toggle modes when typing "D" or "L"', () => {
            const tool = new SurfaceTool('LEADER');
            tool.start();

            tool.onValueInput('D');
            expect(tool.getMode()).toBe('DIRECT');

            tool.onValueInput('L');
            expect(tool.getMode()).toBe('LEADER');
        });

        it('should toggle roughness parameter with "R"', () => {
            const tool = new SurfaceTool('LEADER');
            tool.start();

            tool.onValueInput('R');
            expect(useCadStore.getState().commandPrompt).toContain('Rz');

            tool.onValueInput('R');
            expect(useCadStore.getState().commandPrompt).toContain('Rmax');
        });
    });

    describe('CommandProcessor Routing & Presets', () => {
        it('should route "SURFACE", "SURF", and "YUZEY" to SurfaceTool', () => {
            commandProcessor.startCommand('SURFACE');
            expect(commandProcessor.getActiveCommand()?.id).toBe('SURFACE');
            useCadStore.getState().cancelCommand();

            commandProcessor.startCommand('SURF');
            expect(commandProcessor.getActiveCommand()?.id).toBe('SURFACE');
            useCadStore.getState().cancelCommand();

            commandProcessor.startCommand('YUZEY');
            expect(commandProcessor.getActiveCommand()?.id).toBe('SURFACE');
            useCadStore.getState().cancelCommand();
        });

        it('should route standard presets SURF_RA_16, SURF_RA_08, and SURF_RA_125', () => {
            commandProcessor.startCommand('SURF_RA_16');
            expect(commandProcessor.getActiveCommand()?.id).toBe('SURFACE');
            expect(useCadStore.getState().commandPrompt).toContain('Ra 1.6');
            useCadStore.getState().cancelCommand();

            commandProcessor.startCommand('SURF_RA_08');
            expect(commandProcessor.getActiveCommand()?.id).toBe('SURFACE');
            expect(useCadStore.getState().commandPrompt).toContain('Ra 0.8');
            useCadStore.getState().cancelCommand();

            commandProcessor.startCommand('SURF_RA_125');
            expect(commandProcessor.getActiveCommand()?.id).toBe('SURFACE');
            expect(useCadStore.getState().commandPrompt).toContain('Ra 12.5');
            useCadStore.getState().cancelCommand();
        });

        it('should route "SURF_LEADER" and "SURFACE_DIRECT"', () => {
            commandProcessor.startCommand('SURF_LEADER');
            const leadTool = commandProcessor.getActiveCommand() as SurfaceTool;
            expect(leadTool.getMode()).toBe('LEADER');
            useCadStore.getState().cancelCommand();

            commandProcessor.startCommand('SURFACE_DIRECT');
            const dirTool = commandProcessor.getActiveCommand() as SurfaceTool;
            expect(dirTool.getMode()).toBe('DIRECT');
            useCadStore.getState().cancelCommand();
        });
    });

    describe('Line-Directed Surface Placement & Normal Orientation (ISO 1302)', () => {
        it('should detect horizontal line and orient symbol upward with ZERO leader protrusion', () => {
            // Draw a horizontal line at Y = 50 from X = 0 to 100
            const line = createLineEntity({ x: 0, y: 50 }, { x: 100, y: 50 }, 'layer-0', '#3ad0e6');
            useCadStore.setState({ entities: [line] });

            const tool = new SurfaceTool('DIRECT', { param: 'Ra', value: '3.2' });
            tool.start();

            // Click slightly above the line at (50, 55)
            tool.onPointInput({ x: 50, y: 55 });

            const entities = useCadStore.getState().entities.filter(e => e.id !== line.id);
            expect(entities.length).toBeGreaterThan(0);

            // Verify ZERO leader lines: no stem, no arrowhead barbs
            const leaderStem = entities.find(e =>
                e.geometry.type === 'LINE' &&
                ((e.geometry.start.x === 50 && e.geometry.start.y === 55) ||
                 (e.geometry.end.x === 50 && e.geometry.end.y === 55))
            );
            expect(leaderStem).toBeUndefined();

            // Verify symbol apex touches the line at (50, 50)
            const lineLegs = entities.filter(e => e.geometry.type === 'LINE');
            const touchesApex = lineLegs.some(e =>
                (e.geometry.type === 'LINE' && Math.abs(e.geometry.start.x - 50) < 0.01 && Math.abs(e.geometry.start.y - 50) < 0.01) ||
                (e.geometry.type === 'LINE' && Math.abs(e.geometry.end.x - 50) < 0.01 && Math.abs(e.geometry.end.y - 50) < 0.01)
            );
            expect(touchesApex).toBe(true);

            // Verify text is positioned above the line (Y > 50)
            const textEnt = entities.find(e => e.geometry.type === 'TEXT');
            expect(textEnt).toBeDefined();
            if (textEnt && textEnt.geometry.type === 'TEXT') {
                expect(textEnt.geometry.position.y).toBeGreaterThan(50);
            }
        });

        it('should detect horizontal line and orient symbol downward when clicking below the line', () => {
            const line = createLineEntity({ x: 0, y: 50 }, { x: 100, y: 50 }, 'layer-0', '#3ad0e6');
            useCadStore.setState({ entities: [line] });

            const tool = new SurfaceTool('DIRECT', { param: 'Ra', value: '1.6' });
            tool.start();

            // Click below the line at (50, 45)
            tool.onPointInput({ x: 50, y: 45 });

            const entities = useCadStore.getState().entities.filter(e => e.id !== line.id);
            // Apex must touch the line at (50, 50)
            const touchesApex = entities.some(e =>
                e.geometry.type === 'LINE' &&
                ((Math.abs(e.geometry.start.x - 50) < 0.01 && Math.abs(e.geometry.start.y - 50) < 0.01) ||
                 (Math.abs(e.geometry.end.x - 50) < 0.01 && Math.abs(e.geometry.end.y - 50) < 0.01))
            );
            expect(touchesApex).toBe(true);

            // Legs must extend downward (Y < 50)
            const textEnt = entities.find(e => e.geometry.type === 'TEXT');
            expect(textEnt).toBeDefined();
            if (textEnt && textEnt.geometry.type === 'TEXT') {
                expect(textEnt.geometry.position.y).toBeLessThan(50);
            }
        });

        it('should detect vertical line and orient symbol rightward', () => {
            const line = createLineEntity({ x: 50, y: 0 }, { x: 50, y: 100 }, 'layer-0', '#3ad0e6');
            useCadStore.setState({ entities: [line] });

            const tool = new SurfaceTool('DIRECT', { param: 'Ra', value: '0.8' });
            tool.start();

            // Click to the right of the vertical line at (55, 50)
            tool.onPointInput({ x: 55, y: 50 });

            const entities = useCadStore.getState().entities.filter(e => e.id !== line.id);
            // Apex must touch vertical line at (50, 50)
            const touchesApex = entities.some(e =>
                e.geometry.type === 'LINE' &&
                ((Math.abs(e.geometry.start.x - 50) < 0.01 && Math.abs(e.geometry.start.y - 50) < 0.01) ||
                 (Math.abs(e.geometry.end.x - 50) < 0.01 && Math.abs(e.geometry.end.y - 50) < 0.01))
            );
            expect(touchesApex).toBe(true);

            // Body must extend to the right (X > 50)
            const textEnt = entities.find(e => e.geometry.type === 'TEXT');
            expect(textEnt).toBeDefined();
            if (textEnt && textEnt.geometry.type === 'TEXT') {
                expect(textEnt.geometry.position.x).toBeGreaterThan(50);
            }
        });

        it('should place directly on a selected line with placeNow()', () => {
            const line = createLineEntity({ x: 10, y: 20 }, { x: 90, y: 20 }, 'layer-0', '#3ad0e6');
            useCadStore.setState({ entities: [line], selectedIds: [line.id] });

            const tool = new SurfaceTool('DIRECT', { param: 'Ra', value: '0.4' });
            tool.start();

            // placeNow() should snap directly to selected line midpoint (50, 20)
            tool.placeNow();

            const entities = useCadStore.getState().entities.filter(e => e.id !== line.id);
            expect(entities.length).toBeGreaterThan(0);

            // Verify apex touches (50, 20)
            const touchesApex = entities.some(e =>
                e.geometry.type === 'LINE' &&
                ((Math.abs(e.geometry.start.x - 50) < 0.01 && Math.abs(e.geometry.start.y - 20) < 0.01) ||
                 (Math.abs(e.geometry.end.x - 50) < 0.01 && Math.abs(e.geometry.end.y - 20) < 0.01))
            );
            expect(touchesApex).toBe(true);
        });
    });
});
