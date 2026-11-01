import { describe, it, expect } from 'vitest';
import { DynamicBlockRegistry, DYNAMIC_BLOCKS } from '@/cad/blocks/dynamic/registry';
import { DynamicBlockEngine } from '@/cad/blocks/dynamic/DynamicBlockEngine';
import { DYN_DOOR } from '@/cad/blocks/dynamic/definitions/door';
import { DYN_TABLE_CHAIRS } from '@/cad/blocks/dynamic/definitions/tableChairs';
import { DYN_CABINET } from '@/cad/blocks/dynamic/definitions/cabinet';
import { DYN_WINDOW } from '@/cad/blocks/dynamic/definitions/window';
import { DYN_STEEL_BEAM } from '@/cad/blocks/dynamic/definitions/steelBeam';
import { DYN_ROOF_TRUSS } from '@/cad/blocks/dynamic/definitions/roofTruss';
import { DYN_FASTENER } from '@/cad/blocks/dynamic/definitions/fastener';
import { DYN_INVOLUTE_GEAR } from '@/cad/blocks/dynamic/definitions/involuteGear';
import { DYN_ROLLER_CHAIN_SPROCKET } from '@/cad/blocks/dynamic/definitions/rollerSprocket';
import { DYN_TIMING_BELT_PULLEY } from '@/cad/blocks/dynamic/definitions/timingPulley';
import { DYN_PIPE_FLANGE } from '@/cad/blocks/dynamic/definitions/pipeFlange';
import { DYN_SLIDING_DOOR } from '@/cad/blocks/dynamic/definitions/slidingDoor';
import { DYN_STAIRS } from '@/cad/blocks/dynamic/definitions/stairs';
import { DYN_VANITY_SINK } from '@/cad/blocks/dynamic/definitions/vanitySink';
import { DYN_WC_TOILET } from '@/cad/blocks/dynamic/definitions/wcToilet';
import { DYN_VEHICLE_CAR } from '@/cad/blocks/dynamic/definitions/vehicleCar';
import { DYN_TREE_LANDSCAPE } from '@/cad/blocks/dynamic/definitions/treeLandscape';
import { DYN_PALLET_RACK } from '@/cad/blocks/dynamic/definitions/palletRack';
import { DYN_INDUSTRIAL_LADDER } from '@/cad/blocks/dynamic/definitions/industrialLadder';
import { DYN_LIGHTING_TROFFER } from '@/cad/blocks/dynamic/definitions/lightingTroffer';
import { DYN_FOUNDATION_COLUMN } from '@/cad/blocks/dynamic/definitions/foundationColumn';
import { DYN_KITCHEN_UNIT } from '@/cad/blocks/dynamic/definitions/kitchenUnit';
import { DYN_BATHTUB_SHOWER } from '@/cad/blocks/dynamic/definitions/bathtubShower';
import { DYN_ELEVATOR } from '@/cad/blocks/dynamic/definitions/elevator';
import { DYN_SKF_BEARING } from '@/cad/blocks/dynamic/definitions/skfBearing';
import { DYN_V_BELT_PULLEY } from '@/cad/blocks/dynamic/definitions/vBeltPulley';
import { DYN_ELECTRIC_MOTOR } from '@/cad/blocks/dynamic/definitions/electricMotor';
import { DYN_PARKING_BAY } from '@/cad/blocks/dynamic/definitions/parkingBay';
import { DYN_ANNOTATION_SYMBOLS } from '@/cad/blocks/dynamic/definitions/annotationSymbols';
import { BLOCK_CALCULATOR_SHORTCUTS } from '@/cad/components/DynamicBlockConfigurator';
import { CrossModuleBridge } from '@/system/crossModuleBridge';
import { useDesignStore } from '@/design-studio/designStore';

describe('AutoCAD-Grade Dynamic Blocks Engine & 31-Block Library', () => {
    describe('DynamicBlockRegistry', () => {
        it('should register all dynamic blocks including bearings, V-pulleys, motors, kitchen and elevators', () => {
            const all = DynamicBlockRegistry.getAll();
            expect(all.length).toBeGreaterThanOrEqual(49);
            expect(all.map(b => b.id)).toEqual(expect.arrayContaining([
                'dyn_fastener',
                'dyn_skf_bearing',
                'dyn_involute_gear',
                'dyn_roller_sprocket',
                'dyn_timing_pulley',
                'dyn_v_belt_pulley',
                'dyn_electric_motor',
                'dyn_gamak_motor',
                'dyn_yilmaz_gearbox',
                'dyn_sheet_metal_plate',
                'dyn_tslot_profile',
                'dyn_box_profile',
                'dyn_angle_profile',
                'dyn_aluminum_profile',
                'dyn_door',
                'dyn_window',
                'dyn_sliding_door',
                'dyn_elevator',
                'dyn_table_chairs',
                'dyn_cabinet',
                'dyn_kitchen_unit',
                'dyn_seating',
                'dyn_bed',
                'dyn_stairs',
                'dyn_vanity_sink',
                'dyn_wc_toilet',
                'dyn_bathtub_shower',
                'dyn_steel_beam',
                'dyn_roof_truss',
                'dyn_foundation_column',
                'dyn_pipe_flange',
                'dyn_industrial_ladder',
                'dyn_pallet_rack',
                'dyn_lighting_troffer',
                'dyn_parking_bay',
                'dyn_vehicle_car',
                'dyn_tree_landscape',
                'dyn_annotation_symbols'
            ]));
        });

        it('should ensure all 23 blocks have valid engineering citations and methods', () => {
            const all = DynamicBlockRegistry.getAll();
            for (const b of all) {
                expect(b.citation).toBeDefined();
                expect(b.citation.tier).toBeGreaterThanOrEqual(1);
                expect(b.citation.standard.length).toBeGreaterThan(0);
                expect(b.defaultValues).toBeDefined();
                expect(typeof b.generate2D).toBe('function');
                expect(typeof b.getGrips).toBe('function');
                expect(typeof b.generate3D).toBe('function');
            }
        });

        it('should correctly filter blocks by category', () => {
            const arch = DynamicBlockRegistry.getByCategory('Architectural');
            expect(arch.length).toBe(6); // door, window, sliding_door, stairs, elevator, annotation_symbols

            const furniture = DynamicBlockRegistry.getByCategory('Furniture');
            expect(furniture.length).toBe(5); // table, cabinet, seating, bed, kitchen_unit

            const structural = DynamicBlockRegistry.getByCategory('Structural');
            expect(structural.length).toBe(8); // beam, truss, foundation, pallet_rack, tslot, box, angle, alu_profile

            const mechanical = DynamicBlockRegistry.getByCategory('Mechanical');
            expect(mechanical.length).toBeGreaterThanOrEqual(10); // gear, sprocket, timing_pulley, ladder, skf_bearing, v_belt_pulley, electric_motor, gamak, yilmaz, sheet_metal, etc.

            const fasteners = DynamicBlockRegistry.getByCategory('Fasteners');
            expect(fasteners.length).toBe(1); // universal fastener

            const sanitary = DynamicBlockRegistry.getByCategory('Sanitary');
            expect(sanitary.length).toBe(3); // vanity_sink, wc_toilet, bathtub_shower

            const civil = DynamicBlockRegistry.getByCategory('Civil');
            expect(civil.length).toBe(3); // vehicle_car, tree_landscape, parking_bay
        });

        it('should search by Turkish and English keywords', () => {
            const searchGear = DynamicBlockRegistry.search('dişli');
            expect(searchGear.length).toBeGreaterThan(0);
            expect(searchGear.some(b => b.id === 'dyn_involute_gear')).toBe(true);

            const searchZincir = DynamicBlockRegistry.search('zincir');
            expect(searchZincir.length).toBeGreaterThan(0);
            expect(searchZincir.some(b => b.id === 'dyn_roller_sprocket')).toBe(true);

            const searchTriger = DynamicBlockRegistry.search('triger');
            expect(searchTriger.length).toBeGreaterThan(0);
            expect(searchTriger[0].id).toBe('dyn_timing_pulley');

            const searchCivata = DynamicBlockRegistry.search('cıvata');
            expect(searchCivata.length).toBeGreaterThan(0);
            expect(searchCivata[0].id).toBe('dyn_fastener');
        });
    });

    describe('Manufacturing-Grade Dynamic Cabinet (DYN_CABINET)', () => {
        it('should generate DIN 68858 System 32 hole grid in cross section view', () => {
            const sectionEntities = DYN_CABINET.generate2D({
                width: 1200,
                height: 2100,
                depth: 600,
                visState: 'section'
            });

            // Count circle entities representing System 32 5mm peg drill holes
            const pegHoles = sectionEntities.filter(e => e.geometry.type === 'CIRCLE' && (e.geometry as any).radius === 2.5);
            expect(pegHoles.length).toBeGreaterThan(20);

            // Verify hat shelf and internal drawers exist
            const rects = sectionEntities.filter(e => e.geometry.type === 'RECTANGLE');
            expect(rects.length).toBeGreaterThan(5);
        });

        it('should generate front elevation with recessed plinth kick and bar handles', () => {
            const elevEntities = DYN_CABINET.generate2D({
                width: 1200,
                height: 2100,
                depth: 600,
                visState: 'elevation'
            });

            expect(elevEntities.length).toBeGreaterThan(10);
            // Verify handles and plinth exist
            const plinth = elevEntities.find(e => e.geometry.type === 'RECTANGLE' && (e.geometry as any).height === 80);
            expect(plinth).toBeDefined();
        });

        it('should generate top plan view with door leaf thickness and swing arcs', () => {
            const planEntities = DYN_CABINET.generate2D({
                width: 1000,
                height: 2100,
                depth: 600,
                visState: 'plan'
            });

            const arcs = planEntities.filter(e => e.geometry.type === 'ARC');
            expect(arcs.length).toBe(2); // 2 doors for 1000mm width
        });

        it('should generate 3D solid parts including carcass, doors, and handles', () => {
            const parts3D = DYN_CABINET.generate3D({ width: 1200, height: 2100, depth: 600 });
            expect(parts3D.length).toBeGreaterThan(6);
            expect(parts3D.some(p => p.name.includes('Sol Yan Panel'))).toBe(true);
            expect(parts3D.some(p => p.name.includes('Kapak') || p.name.includes('Kapağ'))).toBe(true);
            expect(parts3D.some(p => p.name.includes('Kulp'))).toBe(true);
        });
    });

    describe('Universal Dynamic Fastener (DYN_FASTENER)', () => {
        it('should generate ISO 4014 hex bolt side view with thread root lines and washer/nut', () => {
            const entities = DYN_FASTENER.generate2D({
                size: 'M12',
                length: 60,
                headType: 'hex_iso4014',
                nutOption: 'washer_nut',
                visState: 'side_detailed'
            });

            expect(entities.length).toBeGreaterThan(8);
            // Verify center line
            const centerLine = entities.find(e => e.color === '#ef4444');
            expect(centerLine).toBeDefined();
        });

        it('should support DIN 912 socket cap head (İmbus) with allen socket', () => {
            const topEntities = DYN_FASTENER.generate2D({
                size: 'M8',
                headType: 'socket_din912',
                visState: 'top_head'
            });

            // Outer head circle + inner hex allen key
            const circle = topEntities.find(e => e.geometry.type === 'CIRCLE');
            const hex = topEntities.find(e => e.geometry.type === 'HEXAGON');
            expect(circle).toBeDefined();
            expect(hex).toBeDefined();
        });

        it('should support ISO 4032 regular nut top view with 3/4 thread crest arc', () => {
            const nutEntities = DYN_FASTENER.generate2D({
                size: 'M16',
                visState: 'top_nut'
            });

            const arc = nutEntities.find(e => e.geometry.type === 'ARC');
            const hex = nutEntities.find(e => e.geometry.type === 'HEXAGON');
            expect(arc).toBeDefined();
            expect(hex).toBeDefined();
        });

        it('should strictly render ONLY nut when nut_only mode is selected (zero bolt shank/head)', () => {
            // 2D Check
            const nutOnlyEntities = DYN_FASTENER.generate2D({
                size: 'M12',
                componentMode: 'nut_only',
                visState: 'side_detailed'
            });

            // Must NOT have a long shank rectangle of length 60
            const shankRect = nutOnlyEntities.find(e => e.geometry.type === 'RECTANGLE' && (e.geometry as any).width >= 50);
            expect(shankRect).toBeUndefined();

            // 3D Check: Must produce ONLY 1 solid part (the nut), zero bolt parts!
            const parts3D = DYN_FASTENER.generate3D({
                size: 'M12',
                componentMode: 'nut_only'
            });

            expect(parts3D.length).toBe(1);
            expect(parts3D[0].kind).toBe('hex-nut');
            expect(parts3D[0].name).toContain('Somun');
            expect(parts3D.some(p => p.name.includes('Cıvata') || p.name.includes('Gövde'))).toBe(false);
        });

        it('should generate ISO 128 compliant 45-degree cross-hatching in side_section view for nuts', () => {
            const sectionEntities = DYN_FASTENER.generate2D({
                size: 'M16',
                componentMode: 'nut_only',
                visState: 'side_section'
            });

            // Hatch lines have color #64748b
            const hatchLines = sectionEntities.filter(e => e.geometry.type === 'LINE' && e.color === '#64748b');
            expect(hatchLines.length).toBeGreaterThan(6);

            // Must have thread crest (amber #f59e0b) and bore root lines (cyan #3ad0e6)
            const threadCrest = sectionEntities.find(e => e.color === '#f59e0b');
            const boreLine = sectionEntities.find(e => e.color === '#3ad0e6');
            expect(threadCrest).toBeDefined();
            expect(boreLine).toBeDefined();
        });

        it('should support tapped blind hole with 118-degree drill cone and 45-degree surrounding plate hatching', () => {
            const tappedEntities = DYN_FASTENER.generate2D({
                size: 'M10',
                componentMode: 'hole_tapped',
                holeType: 'tapped_blind',
                holeDepth: 30,
                tapDepth: 22,
                visState: 'side_section'
            });

            // Must have hatch lines
            const hatchLines = tappedEntities.filter(e => e.geometry.type === 'LINE' && e.color === '#64748b');
            expect(hatchLines.length).toBeGreaterThan(10);

            // Must have thread lines (amber #f59e0b) up to tap depth
            const threadLines = tappedEntities.filter(e => e.color === '#f59e0b');
            expect(threadLines.length).toBeGreaterThanOrEqual(2);

            // Top view must have 3/4 thread arc
            const topEntities = DYN_FASTENER.generate2D({
                size: 'M10',
                componentMode: 'hole_tapped',
                visState: 'top_hole'
            });
            const arc = topEntities.find(e => e.geometry.type === 'ARC');
            expect(arc).toBeDefined();
        });

        it('should support DIN 974 counterbore hole with stepped bore', () => {
            const cbEntities = DYN_FASTENER.generate2D({
                size: 'M12',
                componentMode: 'hole_clearance',
                holeType: 'counterbore_din974',
                plateThickness: 30,
                visState: 'side_section'
            });

            expect(cbEntities.length).toBeGreaterThan(10);
            const hatchLines = cbEntities.filter(e => e.color === '#64748b');
            expect(hatchLines.length).toBeGreaterThan(6);
        });

        it('should support custom thread pitch and custom thread length with on-canvas grip', () => {
            const grips = DYN_FASTENER.getGrips({
                size: 'M12',
                length: 80,
                threadLengthMode: 'custom',
                threadLength: 45,
                componentMode: 'assembly'
            });

            // Length grip at x = 80
            const lenGrip = grips.find(g => g.paramId === 'length');
            expect(lenGrip).toBeDefined();
            expect(lenGrip!.position.x).toBe(80);

            // Thread length grip at x = 80 - 45 = 35
            const threadGrip = grips.find(g => g.paramId === 'threadLength');
            expect(threadGrip).toBeDefined();
            expect(threadGrip!.position.x).toBe(35);
        });

        it('should support full range M3 to M36 without error', () => {
            const sizes = ['M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12', 'M16', 'M20', 'M24', 'M30', 'M36'];
            for (const s of sizes) {
                const res = DYN_FASTENER.generate2D({ size: s, length: 50 });
                expect(res.length).toBeGreaterThan(0);
            }
        });
    });

    describe('Dynamic Involute Gear (DYN_INVOLUTE_GEAR)', () => {
        it('should generate mathematically exact involute closed polyline and pitch circle in single mode', () => {
            const entities = DYN_INVOLUTE_GEAR.generate2D({
                gearMode: 'single',
                module: 2.0,
                teeth: 24,
                boreDiameter: 20,
                visState: 'front_detailed'
            });

            // Must have closed polyline for gear teeth
            const polylines = entities.filter(e => e.geometry.type === 'POLYLINE' && (e.geometry as any).closed);
            expect(polylines.length).toBeGreaterThanOrEqual(1);
            expect((polylines[0]?.geometry as any).vertices.length).toBeGreaterThan(50);

            // Pitch circle with d = 2.0 * 24 = 48 mm (radius 24 mm)
            const pitchCircle = entities.find(e => e.geometry.type === 'CIRCLE' && Math.abs((e.geometry as any).radius - 24) < 0.01);
            expect(pitchCircle).toBeDefined();
        });

        it('should generate 2-gear meshed pair with working center distance (aw) and conjugate mating', () => {
            const entities = DYN_INVOLUTE_GEAR.generate2D({
                gearMode: 'pair',
                module: 3.0,
                teeth: 20,
                teeth2: 60,
                boreDiameter: 20,
                boreDiameter2: 35,
                helixAngle: 0,
                profileShift: 0,
                profileShift2: 0,
                visState: 'front_detailed'
            });

            // Must have two gear contours
            const toothPolylines = entities.filter(e => e.geometry.type === 'POLYLINE' && (e.color === '#3ad0e6' || e.color === '#00e5ff'));
            expect(toothPolylines.length).toBe(2);

            // Standard center distance a0 = 3.0 * (20 + 60) / 2 = 120 mm
            // Pitch circles: pinion r = 30 mm, gear r = 90 mm
            const pitchCircles = entities.filter(e => e.geometry.type === 'CIRCLE' && e.color === '#22c55e');
            expect(pitchCircles.length).toBe(2);
            expect(pitchCircles.some(c => Math.abs((c.geometry as any).radius - 30) < 0.1)).toBe(true);
            expect(pitchCircles.some(c => Math.abs((c.geometry as any).radius - 90) < 0.1)).toBe(true);

            // Center distance dimension callout line
            const dimLine = entities.find(e => e.color === '#f59e0b');
            expect(dimLine).toBeDefined();
        });

        it('should calculate modified working center distance (aw) when x1 and x2 profile shifts are applied', () => {
            // Unshifted a0 = 3 * (20 + 40) / 2 = 90 mm
            const entitiesShifted = DYN_INVOLUTE_GEAR.generate2D({
                gearMode: 'pair',
                module: 3.0,
                teeth: 20,
                teeth2: 40,
                profileShift: 0.4,
                profileShift2: 0.2,
                kFactor: -0.1
            });

            // Positive sumX means operating center distance aw > standard a0
            const grips = DYN_INVOLUTE_GEAR.getGrips({
                gearMode: 'pair',
                module: 3.0,
                teeth: 20,
                teeth2: 40,
                profileShift: 0.4,
                profileShift2: 0.2,
                kFactor: -0.1
            }, { x: 0, y: 0 });

            const centerGrip = grips.find(g => g.id === 'grip_gear_center_dist');
            expect(centerGrip).toBeDefined();
            expect(centerGrip?.position.x).toBeGreaterThan(90); // aw > 90 mm
        });

        it('should provide dynamic stretch grips on pitch circles for both pinion and driven gear in pair mode', () => {
            const grips = DYN_INVOLUTE_GEAR.getGrips({
                gearMode: 'pair',
                module: 3.0,
                teeth: 20,
                teeth2: 60
            }, { x: 0, y: 0 });

            const gripZ1 = grips.find(g => g.paramId === 'teeth');
            const gripZ2 = grips.find(g => g.paramId === 'teeth2');
            expect(gripZ1).toBeDefined();
            expect(gripZ2).toBeDefined();
            expect(gripZ1?.position.x).toBeCloseTo(30, 2);
            // Gear 2 center is at 120 mm, radius 90 mm -> position x = 210 mm
            expect(gripZ2?.position.x).toBeCloseTo(210, 1);
        });

        it('should generate 3D solid parts for single (2 parts) and pair (4 parts) configurations', () => {
            const partsSingle = DYN_INVOLUTE_GEAR.generate3D({ gearMode: 'single', module: 2.0, teeth: 24 });
            expect(partsSingle.length).toBe(2);

            const partsPair = DYN_INVOLUTE_GEAR.generate3D({ gearMode: 'pair', module: 2.0, teeth: 20, teeth2: 50 });
            expect(partsPair.length).toBe(4);
            expect(partsPair.some(p => p.name.includes('Pinyon'))).toBe(true);
            expect(partsPair.some(p => p.name.includes('Çark'))).toBe(true);
        });

        it('should generate side cross section with rim, web, and hub in both single and pair modes', () => {
            const sectionSingle = DYN_INVOLUTE_GEAR.generate2D({
                gearMode: 'single',
                module: 2.0,
                teeth: 30,
                visState: 'side_section'
            });
            expect(sectionSingle.length).toBeGreaterThan(6);

            const sectionPair = DYN_INVOLUTE_GEAR.generate2D({
                gearMode: 'pair',
                module: 2.0,
                teeth: 20,
                teeth2: 40,
                visState: 'side_section'
            });
            expect(sectionPair.length).toBeGreaterThan(12);
        });
    });

    describe('Dynamic Roller Chain Sprocket (DYN_ROLLER_CHAIN_SPROCKET)', () => {
        it('should generate ISO 606 seating contour and pitch circle in single mode', () => {
            const entities = DYN_ROLLER_CHAIN_SPROCKET.generate2D({
                driveMode: 'single',
                chainSize: '08B',
                teeth: 19,
                boreDiameter: 25,
                visState: 'front_detailed'
            });

            const poly = entities.find(e => e.geometry.type === 'POLYLINE' && (e.geometry as any).closed);
            expect(poly).toBeDefined();
            expect((poly?.geometry as any).vertices.length).toBeGreaterThan(50);

            // Pitch circle radius r = 12.7 / (2 * sin(pi / 19)) ≈ 38.6 mm
            const expectedR = 12.7 / (2 * Math.sin(Math.PI / 19));
            const pitchCircle = entities.find(e => e.geometry.type === 'CIRCLE' && Math.abs((e.geometry as any).radius - expectedR) < 0.1);
            expect(pitchCircle).toBeDefined();
        });

        it('should generate full 2-sprocket chain drive in pair mode with tangent chain lines and dimension callout', () => {
            const pairEntities = DYN_ROLLER_CHAIN_SPROCKET.generate2D({
                driveMode: 'pair',
                chainSize: '08B',
                teeth: 19,
                teeth2: 38,
                centerDistance: 350,
                visState: 'front_detailed'
            });

            // 2 sprocket contours
            const contours = pairEntities.filter(e => e.geometry.type === 'POLYLINE' && (e.geometry as any).closed);
            expect(contours.length).toBeGreaterThanOrEqual(2);

            // Pitch circles for both sprockets (green #22c55e)
            const pitchCircles = pairEntities.filter(e => e.geometry.type === 'CIRCLE' && e.color === '#22c55e');
            expect(pitchCircles.length).toBe(2);

            // Tangent chain pitch lines (green #22c55e) and outer clearance lines (amber #f59e0b)
            const chainLines = pairEntities.filter(e => e.geometry.type === 'LINE' && (e.color === '#22c55e' || e.color === '#f59e0b'));
            expect(chainLines.length).toBeGreaterThanOrEqual(4);

            // Center distance dimension callout
            const dimLines = pairEntities.filter(e => e.geometry.type === 'LINE' && e.color === '#f59e0b');
            expect(dimLines.length).toBeGreaterThanOrEqual(2);
        });

        it('should provide dynamic grips for z1, z2, center distance, and dual bores in pair mode', () => {
            const grips = DYN_ROLLER_CHAIN_SPROCKET.getGrips({
                driveMode: 'pair',
                chainSize: '08B',
                teeth: 19,
                teeth2: 38,
                centerDistance: 350,
                boreDiameter: 25,
                boreDiameter2: 35
            }, { x: 0, y: 0 });

            const gripZ1 = grips.find(g => g.paramId === 'teeth');
            const gripZ2 = grips.find(g => g.paramId === 'teeth2');
            const gripA = grips.find(g => g.paramId === 'centerDistance');
            const gripBore1 = grips.find(g => g.paramId === 'boreDiameter');
            const gripBore2 = grips.find(g => g.paramId === 'boreDiameter2');

            expect(gripZ1).toBeDefined();
            expect(gripZ2).toBeDefined();
            expect(gripA).toBeDefined();
            expect(gripBore1).toBeDefined();
            expect(gripBore2).toBeDefined();

            expect(gripA?.position.x).toBe(350);
            expect(gripZ2?.position.x).toBeGreaterThan(350);
        });

        it('should generate 3D solids for single (2 parts) and pair (4 parts: driver + driven with hubs)', () => {
            const solidsSingle = DYN_ROLLER_CHAIN_SPROCKET.generate3D({
                driveMode: 'single',
                chainSize: '08B',
                teeth: 19
            });
            expect(solidsSingle.length).toBe(2);

            const solidsPair = DYN_ROLLER_CHAIN_SPROCKET.generate3D({
                driveMode: 'pair',
                chainSize: '08B',
                teeth: 19,
                teeth2: 38,
                centerDistance: 350
            });
            expect(solidsPair.length).toBe(4);
            expect(solidsPair.some(p => p.name.includes('Tahrik'))).toBe(true);
            expect(solidsPair.some(p => p.name.includes('Çark'))).toBe(true);
        });
    });

    describe('Dynamic Timing Belt Pulley (DYN_TIMING_BELT_PULLEY)', () => {
        it('should generate ISO 13050 curvilinear tooth pocket rim and flange circle in single mode', () => {
            const entities = DYN_TIMING_BELT_PULLEY.generate2D({
                driveMode: 'single',
                profileType: 'HTD_5M',
                teeth: 30,
                boreDiameter: 15,
                flangeOption: 'with_flange',
                visState: 'front_detailed'
            });

            const poly = entities.find(e => e.geometry.type === 'POLYLINE' && (e.geometry as any).closed);
            expect(poly).toBeDefined();

            // Flange circle and pitch circle
            const circles = entities.filter(e => e.geometry.type === 'CIRCLE');
            expect(circles.length).toBeGreaterThanOrEqual(2);
        });

        it('should generate full 2-pulley timing belt drive in pair mode with tangent belt lines and dimension callout', () => {
            const pairEntities = DYN_TIMING_BELT_PULLEY.generate2D({
                driveMode: 'pair',
                profileType: 'HTD_5M',
                teeth: 24,
                teeth2: 48,
                centerDistance: 250,
                flangeOption: 'with_flange',
                visState: 'front_detailed'
            });

            // 2 pulley rim contours
            const contours = pairEntities.filter(e => e.geometry.type === 'POLYLINE' && (e.geometry as any).closed);
            expect(contours.length).toBeGreaterThanOrEqual(2);

            // Pitch circles for both pulleys
            const pitchCircles = pairEntities.filter(e => e.geometry.type === 'CIRCLE' && e.color === '#22c55e');
            expect(pitchCircles.length).toBe(2);

            // Tangent belt pitch lines and outer belt backing lines
            const beltLines = pairEntities.filter(e => e.geometry.type === 'LINE' && (e.color === '#22c55e' || e.color === '#f59e0b'));
            expect(beltLines.length).toBeGreaterThanOrEqual(4);

            // Center distance dimension callout
            const dimLines = pairEntities.filter(e => e.geometry.type === 'LINE' && e.color === '#f59e0b');
            expect(dimLines.length).toBeGreaterThanOrEqual(2);
        });

        it('should provide dynamic grips for z1, z2, center distance, and dual bores in pair mode', () => {
            const grips = DYN_TIMING_BELT_PULLEY.getGrips({
                driveMode: 'pair',
                profileType: 'HTD_5M',
                teeth: 24,
                teeth2: 48,
                centerDistance: 250,
                boreDiameter: 15,
                boreDiameter2: 25
            }, { x: 0, y: 0 });

            const gripZ1 = grips.find(g => g.paramId === 'teeth');
            const gripZ2 = grips.find(g => g.paramId === 'teeth2');
            const gripA = grips.find(g => g.paramId === 'centerDistance');
            const gripBore1 = grips.find(g => g.paramId === 'boreDiameter');
            const gripBore2 = grips.find(g => g.paramId === 'boreDiameter2');

            expect(gripZ1).toBeDefined();
            expect(gripZ2).toBeDefined();
            expect(gripA).toBeDefined();
            expect(gripBore1).toBeDefined();
            expect(gripBore2).toBeDefined();

            expect(gripA?.position.x).toBe(250);
            expect(gripZ2?.position.x).toBeGreaterThan(250);
        });

        it('should generate 3D solids for single (4 parts with flanges) and pair (8 parts)', () => {
            const solidsSingle = DYN_TIMING_BELT_PULLEY.generate3D({
                driveMode: 'single',
                profileType: 'HTD_5M',
                teeth: 24,
                flangeOption: 'with_flange'
            });
            expect(solidsSingle.length).toBe(4);

            const solidsPair = DYN_TIMING_BELT_PULLEY.generate3D({
                driveMode: 'pair',
                profileType: 'HTD_5M',
                teeth: 24,
                teeth2: 48,
                centerDistance: 250,
                flangeOption: 'with_flange'
            });
            expect(solidsPair.length).toBe(8);
            expect(solidsPair.some(p => p.name.includes('Tahrik'))).toBe(true);
            expect(solidsPair.some(p => p.name.includes('Çark'))).toBe(true);
        });
    });

    describe('BLOCK_CALCULATOR_SHORTCUTS (Sayfaya Uğra)', () => {
        it('should map gear, chain sprocket, timing pulley and other dynamic blocks to canonical calculator routes', () => {
            expect(BLOCK_CALCULATOR_SHORTCUTS['dyn_involute_gear'].route).toBe('/gearbox-design/');
            expect(BLOCK_CALCULATOR_SHORTCUTS['dyn_roller_sprocket'].route).toBe('/chain-drive/');
            expect(BLOCK_CALCULATOR_SHORTCUTS['dyn_timing_pulley'].route).toBe('/belt-drive/');
            expect(BLOCK_CALCULATOR_SHORTCUTS['dyn_fastener'].route).toBe('/bolt-torque/');
            expect(BLOCK_CALCULATOR_SHORTCUTS['dyn_steel_beam'].route).toBe('/beam-deflection/');
            expect(BLOCK_CALCULATOR_SHORTCUTS['dyn_pipe_flange'].route).toBe('/pipe-friction/');
            expect(BLOCK_CALCULATOR_SHORTCUTS['dyn_hydraulic_cylinder'].route).toBe('/cylinders/');
            expect(BLOCK_CALCULATOR_SHORTCUTS['dyn_electric_motor'].route).toBe('/motor-selection-std/');
            expect(BLOCK_CALCULATOR_SHORTCUTS['dyn_shaft_coupling'].route).toBe('/shafts/');
            expect(BLOCK_CALCULATOR_SHORTCUTS['dyn_helical_spring'].route).toBe('/advanced-spring/');
            expect(BLOCK_CALCULATOR_SHORTCUTS['dyn_ball_screw'].route).toBe('/motor-selection-std/');
            expect(BLOCK_CALCULATOR_SHORTCUTS['dyn_tslot_profile'].route).toBe('/beam-deflection/');
            expect(BLOCK_CALCULATOR_SHORTCUTS['dyn_box_profile'].route).toBe('/beam-deflection/');
            expect(BLOCK_CALCULATOR_SHORTCUTS['dyn_gamak_motor'].route).toBe('/three-phase-power/');
            expect(BLOCK_CALCULATOR_SHORTCUTS['dyn_yilmaz_gearbox'].route).toBe('/gears/');
        });
    });

    describe('Dynamic Sliding Glass Door (DYN_SLIDING_DOOR)', () => {
        it('should generate plan view with 2 panels by default and track rails', () => {
            const entities = DYN_SLIDING_DOOR.generate2D({ width: 2400, height: 2100, panelCount: 2, visState: 'plan' });
            expect(entities.length).toBeGreaterThan(6);

            const rects = entities.filter(e => e.geometry.type === 'RECTANGLE');
            expect(rects.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Dynamic Pipe Spool & Flange (DYN_PIPE_FLANGE)', () => {
        it('should generate EN 1092-1 flange spool with pipe body and flanges', () => {
            const dn100 = DYN_PIPE_FLANGE.generate2D({ dnSize: 'DN100', visState: 'detailed_section', length: 1000 });
            expect(dn100.length).toBeGreaterThan(5);
            const rects = dn100.filter(e => e.geometry.type === 'RECTANGLE');
            expect(rects.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Dynamic Engine Coordinate Transforms & Grips', () => {
        it('should accurately transform linear stretch grips in world space', () => {
            const grips = DynamicBlockEngine.getGripsWorld(
                DYN_CABINET,
                { width: 1200, height: 2100 },
                { x: 50, y: 50 },
                1.0,
                0
            );

            const widthGrip = grips.find(g => g.paramId === 'width');
            expect(widthGrip).toBeDefined();
            expect(widthGrip?.type).toBe('stretch');
            expect(widthGrip?.position.x).toBe(50 + 1200);
            expect(widthGrip?.position.y).toBe(50 + 1050);

            const heightGrip = grips.find(g => g.paramId === 'height');
            expect(heightGrip).toBeDefined();
            expect(heightGrip?.type).toBe('stretch');
            expect(heightGrip?.position.x).toBe(50 + 600);
            expect(heightGrip?.position.y).toBe(50 + 2100);
        });

        it('should convert dynamic block to standard BlockDefinition for BlockManager', () => {
            const blockDef = DynamicBlockEngine.toStandardBlockDefinition(DYN_DOOR, { width: 900 });
            expect(blockDef.id).toBe('dyn_blk_dyn_door');
            expect(blockDef.isDynamic).toBe(true);
            expect(blockDef.entities.length).toBeGreaterThan(0);
        });
    });

    describe('Dynamic 3D Solid Generation & CrossModuleBridge Transfer', () => {
        it('should generate high-fidelity 3D solid parts for mechanical elements (gears, sprockets, pulleys, fasteners, beams)', () => {
            // 1. Involute Gear
            const gearParts = DYN_INVOLUTE_GEAR.generate3D({ gearMode: 'single', module: 3, teeth: 24, faceWidth: 35 });
            expect(gearParts[0].kind).toBe('gear-blank');
            expect(gearParts[0].rotation).toEqual({ x: 90, y: 0, z: 0 });
            expect(gearParts[0].params?.module).toBe(3);
            expect(gearParts[0].params?.teeth).toBe(24);
            expect(gearParts[0].params?.depth).toBe(35);

            // 2. Roller Chain Sprocket
            const sprocketParts = DYN_ROLLER_CHAIN_SPROCKET.generate3D({ driveMode: 'single', chainSize: '08B', teeth: 19 });
            expect(sprocketParts[0].kind).toBe('gear-blank');
            expect(sprocketParts[0].rotation).toEqual({ x: 90, y: 0, z: 0 });
            expect(sprocketParts[0].params?.form).toBe('sprocket');
            expect(sprocketParts[0].params?.teeth).toBe(19);

            // 3. Timing Belt Pulley
            const pulleyParts = DYN_TIMING_BELT_PULLEY.generate3D({ driveMode: 'single', profileType: 'HTD_5M', teeth: 28 });
            expect(pulleyParts[0].kind).toBe('pulley');
            expect(pulleyParts[0].rotation).toEqual({ x: 90, y: 0, z: 0 });
            expect(pulleyParts[0].params?.form).toBe('timing');
            expect(pulleyParts[0].params?.teeth).toBe(28);

            // 4. Fastener Assembly
            const fastParts = DYN_FASTENER.generate3D({ size: 'M16', length: 70, componentMode: 'bolt_nut_washer' });
            expect(fastParts.length).toBe(3); // bolt, washer, nut
            const bolt = fastParts.find(p => p.kind === 'hex-bolt');
            const nut = fastParts.find(p => p.kind === 'hex-nut');
            const washer = fastParts.find(p => p.kind === 'washer');
            expect(bolt).toBeDefined();
            expect(nut).toBeDefined();
            expect(washer).toBeDefined();
            expect(bolt?.rotation).toEqual({ x: 0, y: 0, z: 90 });
            expect(nut?.rotation).toEqual({ x: 0, y: 0, z: 90 });
            expect(washer?.rotation).toEqual({ x: 0, y: 0, z: 90 });

            // 5. Pipe Flange & Steel Beam
            const flangeParts = DYN_PIPE_FLANGE.generate3D({ dnSize: 'DN100', length: 800 });
            expect(flangeParts[0].kind).toBe('tube');
            expect(flangeParts[0].rotation).toEqual({ x: 0, y: 90, z: 0 });

            const beamParts = DYN_STEEL_BEAM.generate3D({ profile: 'HEA_200', length: 3000 });
            expect(beamParts[0].kind).toBe('I-beam');
            expect(beamParts[0].rotation).toEqual({ x: 0, y: 90, z: 0 });
        });

        it('should generate upright architectural & furniture 3D parts in true millimeters', () => {
            // Cabinet: upright along Y elevation
            const cabParts = DYN_CABINET.generate3D({ width: 1200, height: 2100, depth: 600 });
            expect(cabParts.length).toBeGreaterThan(5);
            for (const cp of cabParts) {
                expect(cp.position.y).toBeGreaterThanOrEqual(0);
                expect(cp.rotation).toEqual({ x: 0, y: 0, z: 0 });
            }

            // Door: upright elevation along Y
            const doorParts = DYN_DOOR.generate3D({ width: 900, wallThickness: 150 });
            expect(doorParts.length).toBeGreaterThanOrEqual(3);
            const doorLeaf = doorParts.find(p => p.name.includes('Kanad') || p.name.includes('Kapı'));
            expect(doorLeaf).toBeDefined();
            expect(doorLeaf?.params?.height).toBeGreaterThan(2000);

            // Window: upright elevation
            const winParts = DYN_WINDOW.generate3D({ width: 1200, height: 1400 });
            expect(winParts.length).toBeGreaterThanOrEqual(2);
            for (const wp of winParts) {
                expect(wp.position.y).toBeGreaterThanOrEqual(0);
            }

            // Stairs: millimeter scale box treads
            const stairParts = DYN_STAIRS.generate3D({ width: 1000, stepCount: 16 });
            expect(stairParts.length).toBe(17); // 16 steps + 1 handrail
            expect(stairParts[0].kind).toBe('box');
            expect(stairParts[0].params?.depth).toBe(1000);
            expect(stairParts[0].params?.width).toBe(280);
        });

        it('should seamlessly export dynamic block instances from 2D CAD to 3D DesignStudio via CrossModuleBridge', () => {
            // Clear design store
            useDesignStore.getState().clearScene();

            // Instantiate a dynamic gear block into 2D CAD entities
            const gearEntities = DynamicBlockEngine.instantiate(
                DYN_INVOLUTE_GEAR,
                { gearMode: 'single', module: 4, teeth: 20, faceWidth: 40 },
                { x: 100, y: 150 }
            );

            expect(gearEntities.length).toBeGreaterThan(0);
            expect(gearEntities[0].isDynamic).toBe(true);
            expect(gearEntities[0].dynamicBlockId).toBe('dyn_involute_gear');

            // Export to 3D Design Studio
            const exportResult = CrossModuleBridge.exportCadToDesignStudio(gearEntities, 100, { switchWindow: false });
            expect(exportResult.ok).toBe(true);
            expect(exportResult.partCount).toBeGreaterThan(0);

            // Verify parts in Design Store
            const store = useDesignStore.getState();
            expect(store.parts.length).toBeGreaterThan(0);
            const gearPart = store.parts.find(p => p.kind === 'gear-blank');
            expect(gearPart).toBeDefined();
            expect(gearPart?.params.module).toBe(4);
            expect(gearPart?.params.teeth).toBe(20);
            expect(gearPart?.position.x).toBe(100);
            expect(gearPart?.position.y).toBe(150);
            expect(gearPart?.rotation.x).toBe(90);
        });

        it('should generate valid 2D entities and 3D parts for SKF Bearings, V-Pulleys, Motors, Kitchen and Elevators', () => {
            // 1. SKF Bearing
            const bearing2D = DYN_SKF_BEARING.generate2D({ d: 25, D: 52, B: 15, viewMode: 'axial_section' });
            expect(bearing2D.length).toBeGreaterThan(0);
            const bearing3D = DYN_SKF_BEARING.generate3D({ d: 25, D: 52, B: 15 });
            expect(bearing3D[0].kind).toBe('tube');
            expect(bearing3D[0].params?.diameter).toBe(52);
            expect(bearing3D[0].params?.innerDiameter).toBe(25);
            expect(bearing3D[0].params?.length).toBe(15);
            expect(DYN_SKF_BEARING.citation.standard).toContain('ISO 15');

            // 2. V-Belt Pulley (DIN 2211)
            const vPulley2D = DYN_V_BELT_PULLEY.generate2D({ profileType: 'SPA', grooves: 3, datumDiameter: 180, boreDiameter: 32 });
            expect(vPulley2D.length).toBeGreaterThan(0);
            const vPulley3D = DYN_V_BELT_PULLEY.generate3D({ profileType: 'SPA', grooves: 3, datumDiameter: 180, boreDiameter: 32 });
            expect(vPulley3D[0].kind).toBe('pulley');
            expect(vPulley3D[0].params?.form).toBe('v-belt');
            expect(vPulley3D[0].params?.grooves).toBe(3);
            expect(vPulley3D[0].params?.pitchDiameter).toBe(180);

            // 3. Electric Motor (IEC 60034)
            const motor2D = DYN_ELECTRIC_MOTOR.generate2D({ frameSize: 'IEC_90S', mountStyle: 'b3_foot' });
            expect(motor2D.length).toBeGreaterThan(0);
            const motor3D = DYN_ELECTRIC_MOTOR.generate3D({ frameSize: 'IEC_90S' });
            expect(motor3D.length).toBeGreaterThanOrEqual(2);
            expect(motor3D[0].name).toContain('IEC 90S');

            // 4. Kitchen Unit (ISO 3055)
            const kitchen2D = DYN_KITCHEN_UNIT.generate2D({ length: 2400, visState: 'full_suite' });
            expect(kitchen2D.length).toBeGreaterThan(0);
            const kitchen3D = DYN_KITCHEN_UNIT.generate3D({ length: 2400 });
            expect(kitchen3D.length).toBe(3); // plinth, carcass, worktop

            // 5. Bathtub & Shower (DIN EN 14516)
            const tub2D = DYN_BATHTUB_SHOWER.generate2D({ length: 1700, width: 750, visState: 'rect_tub' });
            expect(tub2D.length).toBeGreaterThan(0);
            const tub3D = DYN_BATHTUB_SHOWER.generate3D({ length: 1700, width: 750 });
            expect(tub3D[0].params?.width).toBe(1700);
            expect(tub3D[0].params?.height).toBe(750);

            // 6. Elevator (EN 81-20)
            const lift2D = DYN_ELEVATOR.generate2D({ carWidth: 1100, carDepth: 1400 });
            expect(lift2D.length).toBeGreaterThan(0);
            const lift3D = DYN_ELEVATOR.generate3D({ carWidth: 1100, carDepth: 1400 });
            expect(lift3D.length).toBe(2); // cabin and counterweight

            // 7. Parking Bay (TSE 10551)
            const park2D = DYN_PARKING_BAY.generate2D({ bays: 6, bayWidth: 2500, bayType: 'perp_90' });
            expect(park2D.length).toBeGreaterThan(0);
            const park3D = DYN_PARKING_BAY.generate3D({ bays: 6, bayWidth: 2500 });
            expect(park3D.length).toBe(7); // slab + 6 curbs

            // 8. Annotation Symbols (ISO 128)
            const sym2D = DYN_ANNOTATION_SYMBOLS.generate2D({ symbolType: 'north_arrow' });
            expect(sym2D.length).toBeGreaterThan(0);
        });
    });
});
