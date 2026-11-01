/**
 * AluCAD — Mechanical Engineering Tools Test Suite
 * Tests the 3 mechanical toolbar features:
 * 1. FastenerDrawTool (FASTENER / BOLT / NUT - ISO 4014 / ISO 4032)
 * 2. TSlotInsertTool (TSLOT / ALU_PROFILE - DIN EN 12020 / EN 755)
 * 3. CrossSectionTool (CROSS_SECTION - Green's Theorem & Shoelace)
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { useCadStore } from '../cad/store/cadStore';
import { commandProcessor } from '../cad/commands/CommandProcessor';
import { FastenerDrawTool } from '../cad/commands/tools/FastenerDrawTool';
import { TSlotInsertTool } from '../cad/commands/tools/TSlotInsertTool';
import { CrossSectionTool } from '../cad/commands/tools/CrossSectionTool';
import { GearTool } from '../cad/commands/tools/GearTool';
import { BeltPulleyTool } from '../cad/commands/tools/BeltPulleyTool';
import { RollerChainTool } from '../cad/commands/tools/RollerChainTool';
import { createCircleEntity, createRectangleEntity } from '../cad/kernel/types';
import { Transformer } from '../cad/kernel/Transformer';
import { useAnalysisStore } from '../lib/store/analysisStore';

describe('CAD Mechanical Tools Suite (FASTENER, TSLOT, CROSS_SECTION)', () => {
    beforeEach(() => {
        useCadStore.setState({
            entities: [],
            selectedIds: [],
            activeCommand: null,
            commandState: 'IDLE',
            previewEntity: null,
            cursorWorld: { x: 0, y: 0 },
        });
    });

    describe('1. FastenerDrawTool (FASTENER)', () => {
        it('should start in PLACE mode with default M10 Bolt and prompt', () => {
            const tool = new FastenerDrawTool();
            tool.start();

            const state = useCadStore.getState();
            expect(state.commandState).toBe('AWAITING_POINT');
            expect(state.commandPrompt).toContain('M10×40 Cıvata');
        });

        it('should generate preview entity on mouse move', () => {
            const tool = new FastenerDrawTool();
            tool.start();

            tool.onMouseMove({ x: 25, y: 35 });
            const preview = useCadStore.getState().previewEntity;
            expect(preview).toBeDefined();
            expect(preview?.geometry.type).toBe('FASTENER');
            if (preview && preview.geometry.type === 'FASTENER') {
                expect(preview.geometry.origin.x).toBe(25);
                expect(preview.geometry.origin.y).toBe(35);
                expect(preview.geometry.fastenerType).toBe('BOLT');
                expect(preview.geometry.diameter).toBe(10);
            }
        });

        it('should place fastener on 1-click on canvas', () => {
            const tool = new FastenerDrawTool();
            tool.start();

            tool.onPointInput({ x: 100, y: 150 });
            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            expect(entities[0].geometry.type).toBe('FASTENER');
            if (entities[0].geometry.type === 'FASTENER') {
                expect(entities[0].geometry.origin).toEqual({ x: 100, y: 150 });
                expect(entities[0].geometry.diameter).toBe(10);
                expect(entities[0].geometry.length).toBe(40);
            }
        });

        it('should place directly using placeNow()', () => {
            useCadStore.setState({ cursorWorld: { x: 50, y: 60 } });
            const tool = new FastenerDrawTool();
            tool.start();

            tool.placeNow();
            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            if (entities[0].geometry.type === 'FASTENER') {
                expect(entities[0].geometry.origin).toEqual({ x: 50, y: 60 });
            }
        });

        it('should update params via setParams and support NUT type', () => {
            const tool = new FastenerDrawTool();
            tool.start();

            tool.setParams({ type: 'NUT', diameter: 8 });
            expect(useCadStore.getState().commandPrompt).toContain('M8 Somun');

            tool.onPointInput({ x: 0, y: 0 });
            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            if (entities[0].geometry.type === 'FASTENER') {
                expect(entities[0].geometry.fastenerType).toBe('NUT');
                expect(entities[0].geometry.diameter).toBe(8);
            }
        });

        it('should parse typed shorthand like M12x50 or SOMUN in onValueInput', () => {
            const tool = new FastenerDrawTool();
            tool.start();

            tool.onValueInput('M12x50');
            expect(useCadStore.getState().commandPrompt).toContain('M12×50');

            tool.onValueInput('NUT');
            expect(useCadStore.getState().commandPrompt).toContain('M12 Somun');
        });

        it('should support rotation, view modes, and thread styles in setParams', () => {
            const tool = new FastenerDrawTool();
            tool.start();

            tool.setParams({
                rotation: 0,
                view: 'TOP',
                threadStyle: 'SCHEMATIC'
            });

            const params = tool.getParams();
            expect(params.rotation).toBe(0);
            expect(params.view).toBe('TOP');
            expect(params.threadStyle).toBe('SCHEMATIC');

            tool.onPointInput({ x: 10, y: 20 });
            const entity = useCadStore.getState().entities[0];
            expect(entity.geometry.type).toBe('FASTENER');
            if (entity.geometry.type === 'FASTENER') {
                expect(entity.geometry.rotation).toBe(0);
                expect(entity.geometry.view).toBe('TOP');
                expect(entity.geometry.threadStyle).toBe('SCHEMATIC');
            }
        });

        it('should rotate and mirror fastener correctly via Transformer', () => {
            const tool = new FastenerDrawTool();
            tool.start();
            tool.onPointInput({ x: 0, y: 0 });

            const entity = useCadStore.getState().entities[0];
            // Rotate 90 degrees around origin
            const rotated = Transformer.rotate(entity, { x: 0, y: 0 }, Math.PI / 2);
            if (rotated.geometry.type === 'FASTENER') {
                expect(rotated.geometry.rotation).toBeCloseTo(0, 5);
            }

            // Mirror across X-axis (from (0,0) to (1,0), angle = 0)
            const mirrored = Transformer.mirror(entity, { x: 0, y: 0 }, { x: 1, y: 0 });
            if (mirrored.geometry.type === 'FASTENER') {
                expect(mirrored.geometry.rotation).toBeCloseTo(Math.PI / 2, 5);
            }
        });

        it('should route command via CommandProcessor', () => {
            commandProcessor.startCommand('FASTENER');
            expect(useCadStore.getState().activeCommand).toBe('FASTENER');

            commandProcessor.startCommand('BOLT');
            expect(useCadStore.getState().activeCommand).toBe('FASTENER');

            commandProcessor.startCommand('NUT');
            expect(useCadStore.getState().activeCommand).toBe('FASTENER');
        });
    });

    describe('2. TSlotInsertTool (TSLOT)', () => {
        it('should start in AWAITING_POINT mode with 40×40 default profile', () => {
            const tool = new TSlotInsertTool();
            tool.start();

            const state = useCadStore.getState();
            expect(state.commandState).toBe('AWAITING_POINT');
            expect(state.commandPrompt).toContain('40×40 T-Slot');
            expect(tool.getSize()).toBe(40);
        });

        it('should update preview entity on mouse move', () => {
            const tool = new TSlotInsertTool();
            tool.start();

            tool.onMouseMove({ x: 40, y: 40 });
            const preview = useCadStore.getState().previewEntity;
            expect(preview).toBeDefined();
            expect(preview?.geometry.type).toBe('POLYLINE');
        });

        it('should insert outer polyline and bore circle on point input', () => {
            const tool = new TSlotInsertTool();
            tool.start();

            tool.onPointInput({ x: 100, y: 100 });
            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(2);
            expect(entities.some(e => e.geometry.type === 'POLYLINE')).toBe(true);
            expect(entities.some(e => e.geometry.type === 'CIRCLE')).toBe(true);
        });

        it('should support placeNow() inserting at cursor or origin', () => {
            useCadStore.setState({ cursorWorld: { x: 0, y: 0 } });
            const tool = new TSlotInsertTool();
            tool.start();

            tool.placeNow();
            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(2);
        });

        it('should switch sizes via setParams (20, 30, 40, 45)', () => {
            const tool = new TSlotInsertTool();
            tool.start();

            tool.setParams({ size: 20 });
            expect(tool.getSize()).toBe(20);
            expect(useCadStore.getState().commandPrompt).toContain('20×20 T-Slot');
        });

        it('should parse typed sizes in onValueInput', () => {
            const tool = new TSlotInsertTool();
            tool.start();

            tool.onValueInput('30');
            expect(tool.getSize()).toBe(30);

            tool.onValueInput('4545');
            expect(tool.getSize()).toBe(45);
        });

        it('should route command via CommandProcessor', () => {
            commandProcessor.startCommand('TSLOT');
            expect(useCadStore.getState().activeCommand).toBe('TSLOT');

            commandProcessor.startCommand('PROFILE');
            expect(useCadStore.getState().activeCommand).toBe('TSLOT');
        });
    });

    describe('3. CrossSectionTool (CROSS_SECTION)', () => {
        it('should start without crashing and set prompt', () => {
            const tool = new CrossSectionTool();
            tool.start();

            const state = useCadStore.getState();
            expect(state.commandState).toBe('AWAITING_POINT');
            expect(state.commandPrompt).toContain('Kesit Analizi');
        });

        it('should analyze existing circle entity and update analysis store', () => {
            const circle = createCircleEntity({ x: 0, y: 0 }, 10, 'layer-0', '#3ad0e6');
            useCadStore.setState({ entities: [circle], selectedIds: [circle.id] });

            const tool = new CrossSectionTool();
            tool.start();

            const buckling = useAnalysisStore.getState().bucklingData;
            expect(buckling.area).toBeCloseTo(Math.PI * 100, 2);
            expect(buckling.inertia).toBeCloseTo((Math.PI * 10000) / 4, 1);
            expect(useCadStore.getState().commandPrompt).toContain('✅ Kesit Analizi');
        });

        it('should analyze rectangle profile and compute inertia', () => {
            const rect = createRectangleEntity({ x: 0, y: 0 }, 40, 20, 'layer-0', '#3ad0e6');
            useCadStore.setState({ entities: [rect], selectedIds: [rect.id] });

            const tool = new CrossSectionTool();
            tool.start();

            const buckling = useAnalysisStore.getState().bucklingData;
            expect(buckling.area).toBeCloseTo(800, 1);
            expect(useCadStore.getState().commandPrompt).toContain('Kesit Analizi');
        });

        it('should re-analyze when clicking an entity via onPointInput', () => {
            const circle1 = createCircleEntity({ x: 0, y: 0 }, 5, 'layer-0', '#3ad0e6');
            const circle2 = createCircleEntity({ x: 100, y: 100 }, 20, 'layer-0', '#3ad0e6');
            useCadStore.setState({ entities: [circle1, circle2], selectedIds: [] });

            const tool = new CrossSectionTool();
            tool.start();

            tool.onPointInput({ x: 100, y: 100 });
            expect(useCadStore.getState().selectedIds).toContain(circle2.id);
            const buckling = useAnalysisStore.getState().bucklingData;
            expect(buckling.area).toBeCloseTo(Math.PI * 400, 2);
        });

        it('should route command via CommandProcessor', () => {
            commandProcessor.startCommand('CROSS_SECTION');
            expect(useCadStore.getState().activeCommand).toBe('CROSS_SECTION');

            commandProcessor.startCommand('AREA');
            expect(useCadStore.getState().activeCommand).toBe('CROSS_SECTION');
        });
    });

    describe('4. GearTool (GEAR)', () => {
        it('should start in AWAITING_POINT mode with m=2, z=20 default', () => {
            const tool = new GearTool();
            tool.start();

            const state = useCadStore.getState();
            expect(state.commandState).toBe('AWAITING_POINT');
            expect(state.commandPrompt).toContain('Evolvent Dişli');
            expect(state.commandPrompt).toContain('m=2');
            expect(state.commandPrompt).toContain('z=20');
        });

        it('should generate preview entity on mouse move', () => {
            useCadStore.setState({ cursorWorld: { x: 30, y: 40 } });
            const tool = new GearTool();
            tool.start();

            tool.onMouseMove({ x: 30, y: 40 });
            const preview = useCadStore.getState().previewEntity;
            expect(preview).toBeDefined();
            expect(preview?.geometry.type).toBe('GEAR');
            if (preview && preview.geometry.type === 'GEAR') {
                expect(preview.geometry.center).toEqual({ x: 30, y: 40 });
                expect(preview.geometry.module).toBe(2);
                expect(preview.geometry.teeth).toBe(20);
            }
        });

        it('should place gear entity on 1-click on canvas', () => {
            const tool = new GearTool();
            tool.start();

            tool.onPointInput({ x: 120, y: 80 });
            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            expect(entities[0].geometry.type).toBe('GEAR');
            if (entities[0].geometry.type === 'GEAR') {
                expect(entities[0].geometry.center).toEqual({ x: 120, y: 80 });
                expect(entities[0].geometry.module).toBe(2);
                expect(entities[0].geometry.teeth).toBe(20);
            }
        });

        it('should place gear immediately using placeNow()', () => {
            useCadStore.setState({ cursorWorld: { x: 70, y: 90 } });
            const tool = new GearTool();
            tool.start();

            tool.placeNow();
            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            if (entities[0].geometry.type === 'GEAR') {
                expect(entities[0].geometry.center).toEqual({ x: 70, y: 90 });
            }
        });

        it('should update params via setParams', () => {
            const tool = new GearTool();
            tool.start();

            tool.setParams({ module: 3, teethCount: 32 });
            const params = tool.getParams();
            expect(params.module).toBe(3);
            expect(params.teethCount).toBe(32);
            expect(useCadStore.getState().commandPrompt).toContain('m=3');
            expect(useCadStore.getState().commandPrompt).toContain('z=32');
        });

        it('should route command via CommandProcessor', () => {
            commandProcessor.startCommand('GEAR');
            expect(useCadStore.getState().activeCommand).toBe('GEAR');

            commandProcessor.startCommand('INVOLUTE');
            expect(useCadStore.getState().activeCommand).toBe('GEAR');

            commandProcessor.startCommand('DISLI');
            expect(useCadStore.getState().activeCommand).toBe('GEAR');
        });
    });

    describe('5. BeltPulleyTool (BELT_PULLEY)', () => {
        it('should start in AWAITING_POINT mode with R1=50, R2=30 default', () => {
            const tool = new BeltPulleyTool();
            tool.start();

            const state = useCadStore.getState();
            expect(state.commandState).toBe('AWAITING_POINT');
            expect(state.commandPrompt).toContain('Kayış & Kasnak');
            expect(state.commandPrompt).toContain('R1=50mm');
            expect(state.commandPrompt).toContain('R2=30mm');
        });

        it('should place belt-pulley system on two clicks', () => {
            const tool = new BeltPulleyTool();
            tool.start();

            tool.onPointInput({ x: 0, y: 0 });
            expect(useCadStore.getState().commandPrompt).toContain('2. Kasnak');

            tool.onPointInput({ x: 200, y: 0 });
            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            expect(entities[0].geometry.type).toBe('BELT_PULLEY');
            if (entities[0].geometry.type === 'BELT_PULLEY') {
                expect(entities[0].geometry.center1).toEqual({ x: 0, y: 0 });
                expect(entities[0].geometry.radius1).toBe(50);
                expect(entities[0].geometry.center2).toEqual({ x: 200, y: 0 });
                expect(entities[0].geometry.radius2).toBe(30);
            }
        });

        it('should place belt-pulley immediately using placeNow()', () => {
            useCadStore.setState({ cursorWorld: { x: 50, y: 50 } });
            const tool = new BeltPulleyTool();
            tool.start();

            tool.placeNow();
            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            expect(entities[0].geometry.type).toBe('BELT_PULLEY');
        });

        it('should update params via setParams including CROSSED belt', () => {
            const tool = new BeltPulleyTool();
            tool.start();

            tool.setParams({ radius1: 60, radius2: 40, beltType: 'CROSSED' });
            const params = tool.getParams();
            expect(params.radius1).toBe(60);
            expect(params.radius2).toBe(40);
            expect(params.beltType).toBe('CROSSED');

            tool.placeNow();
            const entity = useCadStore.getState().entities[0];
            expect((entity.geometry as any).beltType).toBe('CROSSED');
        });

        it('should route command via CommandProcessor', () => {
            commandProcessor.startCommand('BELT_PULLEY');
            expect(useCadStore.getState().activeCommand).toBe('BELT_PULLEY');

            commandProcessor.startCommand('BELT');
            expect(useCadStore.getState().activeCommand).toBe('BELT_PULLEY');

            commandProcessor.startCommand('KAYIS_KASNAK');
            expect(useCadStore.getState().activeCommand).toBe('BELT_PULLEY');
        });
    });

    describe('6. RollerChainTool (ROLLER_CHAIN)', () => {
        it('should start in AWAITING_POINT mode with 08B standard and 19 teeth', () => {
            const tool = new RollerChainTool();
            tool.start();

            const state = useCadStore.getState();
            expect(state.commandState).toBe('AWAITING_POINT');
            expect(state.commandPrompt).toContain('ISO 606 Zincir Dişlisi');
            expect(state.commandPrompt).toContain('08B');
            expect(state.commandPrompt).toContain('z=19');
        });

        it('should generate preview entity of type SPROCKET on mouse move', () => {
            useCadStore.setState({ cursorWorld: { x: 45, y: 55 } });
            const tool = new RollerChainTool();
            tool.start();

            tool.onMouseMove({ x: 45, y: 55 });
            const preview = useCadStore.getState().previewEntity;
            expect(preview).toBeDefined();
            expect(preview?.geometry.type).toBe('SPROCKET');
            if (preview && preview.geometry.type === 'SPROCKET') {
                expect(preview.geometry.center).toEqual({ x: 45, y: 55 });
                expect(preview.geometry.teeth).toBe(19);
                expect(preview.geometry.pitch).toBe(12.7);
            }
        });

        it('should place sprocket entity on click', () => {
            const tool = new RollerChainTool();
            tool.start();

            tool.onPointInput({ x: 100, y: 120 });
            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            expect(entities[0].geometry.type).toBe('SPROCKET');
            if (entities[0].geometry.type === 'SPROCKET') {
                expect(entities[0].geometry.center).toEqual({ x: 100, y: 120 });
                expect(entities[0].geometry.teeth).toBe(19);
                expect(entities[0].geometry.pitch).toBe(12.7);
                expect(entities[0].geometry.rollerDiameter).toBe(8.51);
            }
        });

        it('should place sprocket immediately using placeNow()', () => {
            useCadStore.setState({ cursorWorld: { x: 33, y: 44 } });
            const tool = new RollerChainTool();
            tool.start();

            tool.placeNow();
            const entities = useCadStore.getState().entities;
            expect(entities.length).toBe(1);
            if (entities[0].geometry.type === 'SPROCKET') {
                expect(entities[0].geometry.center).toEqual({ x: 33, y: 44 });
            }
        });

        it('should switch standards via setParams (e.g. 12B)', () => {
            const tool = new RollerChainTool();
            tool.start();

            tool.setParams({ standard: '12B', teeth: 24 });
            const params = tool.getParams();
            expect(params.standard).toBe('12B');
            expect(params.teeth).toBe(24);
            expect(params.pitch).toBe(19.05);
            expect(params.rollerDiameter).toBe(12.07);
            expect(useCadStore.getState().commandPrompt).toContain('12B');
            expect(useCadStore.getState().commandPrompt).toContain('z=24');
        });

        it('should route command via CommandProcessor', () => {
            commandProcessor.startCommand('ROLLER_CHAIN');
            expect(useCadStore.getState().activeCommand).toBe('ROLLER_CHAIN');

            commandProcessor.startCommand('SPROCKET');
            expect(useCadStore.getState().activeCommand).toBe('ROLLER_CHAIN');

            commandProcessor.startCommand('CHAIN');
            expect(useCadStore.getState().activeCommand).toBe('ROLLER_CHAIN');

            commandProcessor.startCommand('ZINCIR');
            expect(useCadStore.getState().activeCommand).toBe('ROLLER_CHAIN');
        });
    });
});

