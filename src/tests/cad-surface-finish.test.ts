/**
 * 🧪 AluCAD — ISO 1302 / DIN EN ISO 1302 / ISO 21920 Surface Texture Test Suite
 * 
 * Verifies:
 * 1. ISO 1302 exact mathematical proportions:
 *    - Short leg 4mm (120°), Long leg 8mm (60°)
 *    - Machining Required horizontal closing bar at y = 3.464mm
 *    - Material Removal Prohibited tangent inscribed circle at (0, 2.309mm) r = 1.155mm
 *    - All-Around circle at apex (0, 0) r = 1.25mm
 *    - Text baseline clearance above shelf line
 * 2. 65 Standard Surface Blocks catalog in BlockManager
 * 3. Collective drawing header callouts & legacy DIN 140 / JIS triangles
 * 4. Command aliases & InsertTool integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    createIso1302SurfaceTextureEntities,
    createSurfaceFinishBlock,
    createCollectiveCalloutEntities,
    createLegacyTriangleEntities
} from '../cad/blocks/SurfaceFinishGenerator';
import { BlockManager } from '../cad/blocks/BlockManager';
import { COMMAND_ALIASES, commandProcessor } from '../cad/commands/CommandProcessor';
import { InsertTool } from '../cad/commands/tools/InsertTool';
import { useCadStore } from '../cad/store/cadStore';

describe('ISO 1302 Surface Texture Mathematical Engine', () => {
    it('should generate basic open checkmark tick with exact 60 degree geometry', () => {
        const entities = createIso1302SurfaceTextureEntities({
            symbolType: 'any_process',
            roughnessParameter: 'Ra',
            roughnessValue: '3.2'
        });

        // 1. Short leg
        const shortLeg = entities.find(e =>
            e.geometry.type === 'LINE' &&
            Math.abs(e.geometry.start.x - (-2.0)) < 0.05 &&
            Math.abs(e.geometry.start.y - 3.464) < 0.05
        );
        expect(shortLeg).toBeDefined();

        // 2. Long leg
        const longLeg = entities.find(e =>
            e.geometry.type === 'LINE' &&
            Math.abs(e.geometry.end.x - 4.0) < 0.05 &&
            Math.abs(e.geometry.end.y - 6.928) < 0.05
        );
        expect(longLeg).toBeDefined();

        // 3. No closing bar for any_process
        const closingBar = entities.find(e =>
            e.geometry.type === 'LINE' &&
            Math.abs(e.geometry.start.x - (-2.0)) < 0.05 &&
            Math.abs(e.geometry.end.x - 2.0) < 0.05
        );
        expect(closingBar).toBeUndefined();

        // 4. Shelf line
        const shelf = entities.find(e =>
            e.geometry.type === 'LINE' &&
            Math.abs(e.geometry.start.x - 4.0) < 0.05 &&
            Math.abs(e.geometry.start.y - 6.928) < 0.05 &&
            e.geometry.end.x > 14.0
        );
        expect(shelf).toBeDefined();

        // 5. Text clearance: baseline must be at y >= 8.5 (above shelf at 6.928)
        const textEnt = entities.find(e => e.geometry.type === 'TEXT');
        expect(textEnt).toBeDefined();
        if (textEnt && textEnt.geometry.type === 'TEXT') {
            expect(textEnt.geometry.content).toContain('Ra 3.2');
            expect(textEnt.geometry.position.y).toBeGreaterThan(6.928 + 1.5);
        }
    });

    it('should generate Machining Required closing bar from (-2, 3.464) to (2, 3.464)', () => {
        const entities = createIso1302SurfaceTextureEntities({
            symbolType: 'machining_required',
            roughnessParameter: 'Ra',
            roughnessValue: '1.6'
        });

        const closingBar = entities.find(e =>
            e.geometry.type === 'LINE' &&
            Math.abs(e.geometry.start.x - (-2.0)) < 0.05 &&
            Math.abs(e.geometry.start.y - 3.464) < 0.05 &&
            Math.abs(e.geometry.end.x - 2.0) < 0.05 &&
            Math.abs(e.geometry.end.y - 3.464) < 0.05
        );
        expect(closingBar).toBeDefined();
    });

    it('should generate Material Removal Prohibited inscribed circle tangent to both 60° legs', () => {
        const entities = createIso1302SurfaceTextureEntities({
            symbolType: 'machining_prohibited'
        });

        const circleEnt = entities.find(e => e.geometry.type === 'CIRCLE');
        expect(circleEnt).toBeDefined();
        if (circleEnt && circleEnt.geometry.type === 'CIRCLE') {
            // Center must be (0, 2.309) and radius 1.155
            expect(Math.abs(circleEnt.geometry.center.x)).toBeLessThan(0.01);
            expect(Math.abs(circleEnt.geometry.center.y - 2.309)).toBeLessThan(0.01);
            expect(Math.abs(circleEnt.geometry.radius - 1.155)).toBeLessThan(0.01);

            // Verify tangency to 60 deg leg (line y = sqrt(3)*x)
            // Distance from (0, Yc) to sqrt(3)*x - y = 0: |-Yc| / sqrt(3 + 1) = Yc / 2 = 2.309 / 2 = 1.1545
            const distToLeg = circleEnt.geometry.center.y / 2.0;
            expect(Math.abs(distToLeg - circleEnt.geometry.radius)).toBeLessThan(0.005);

            // Verify top apex reaches y = 3.464 (exact short leg height)
            const topY = circleEnt.geometry.center.y + circleEnt.geometry.radius;
            expect(Math.abs(topY - 3.464)).toBeLessThan(0.01);
        }
    });

    it('should generate All-Around apex circle with radius 1.25mm', () => {
        const entities = createIso1302SurfaceTextureEntities({
            symbolType: 'machining_required',
            allAround: true,
            roughnessParameter: 'Ra',
            roughnessValue: '3.2'
        });

        const apexCircle = entities.find(e =>
            e.geometry.type === 'CIRCLE' &&
            Math.abs(e.geometry.center.x) < 0.01 &&
            Math.abs(e.geometry.center.y) < 0.01
        );
        expect(apexCircle).toBeDefined();
        if (apexCircle && apexCircle.geometry.type === 'CIRCLE') {
            expect(apexCircle.geometry.radius).toBe(1.25);
        }
    });

    it('should format dual limits, lay direction, and machining allowance at correct positions', () => {
        const entities = createIso1302SurfaceTextureEntities({
            symbolType: 'machining_required',
            roughnessParameter: 'Ra',
            roughnessValue: '3.2 max',
            lowerRoughnessValue: '1.6 min',
            layDirection: 'X',
            machiningAllowance: '2.0',
            manufacturingMethod: 'Honed'
        });

        // 1. Upper limit text (y = 10.4)
        const upperText = entities.find(e => e.geometry.type === 'TEXT' && e.geometry.content.includes('3.2 max'));
        expect(upperText).toBeDefined();
        if (upperText && upperText.geometry.type === 'TEXT') {
            expect(upperText.geometry.position.y).toBeGreaterThan(10.0);
        }

        // 2. Lower limit text (y = 8.4)
        const lowerText = entities.find(e => e.geometry.type === 'TEXT' && e.geometry.content.includes('1.6 min'));
        expect(lowerText).toBeDefined();

        // 3. Lay direction below shelf (y = 4.7)
        const layText = entities.find(e => e.geometry.type === 'TEXT' && e.geometry.content === 'X');
        expect(layText).toBeDefined();
        if (layText && layText.geometry.type === 'TEXT') {
            expect(layText.geometry.position.y).toBeLessThan(6.928);
        }

        // 4. Machining allowance left of short leg (x = -3.0)
        const allowanceText = entities.find(e => e.geometry.type === 'TEXT' && e.geometry.content === '2.0');
        expect(allowanceText).toBeDefined();
        if (allowanceText && allowanceText.geometry.type === 'TEXT') {
            expect(allowanceText.geometry.position.x).toBeLessThan(0);
        }
    });
});

describe('ISO 1302 Standard Blocks Library Catalog', () => {
    it('should include all 65 surface texture blocks in BlockManager', () => {
        const allBlocks = BlockManager.getAllBlocks();
        const surfaceBlocks = allBlocks.filter(b => b.category === 'Symbols' && b.subcategory === 'Surface Texture');

        expect(surfaceBlocks.length).toBeGreaterThanOrEqual(65);

        // Verify key IDs are present
        const expectedIds = [
            'std_surface_ra005', 'std_surface_ra01', 'std_surface_ra02', 'std_surface_ra04',
            'std_surface_ra08', 'std_surface_ra16', 'std_surface_ra32', 'std_surface_ra63',
            'std_surface_ra125', 'std_surface_ra25',
            'std_surface_rz16', 'std_surface_rz40', 'std_surface_rz63', 'std_surface_rz16_m',
            'std_surface_rz25', 'std_surface_rz63_m',
            'std_surface_basic', 'std_surface_basic_ra08', 'std_surface_basic_ra16',
            'std_surface_basic_ra32', 'std_surface_basic_ra63', 'std_surface_basic_ra125',
            'std_surface_prohibited', 'std_surface_cast_ra125', 'std_surface_cast_ra63',
            'std_surface_extruded_ra63', 'std_surface_colddrawn_ra32', 'std_surface_sheet_ra16',
            'std_surface_lay_parallel', 'std_surface_lay_perpendicular', 'std_surface_lay_crossed',
            'std_surface_lay_multidirectional', 'std_surface_lay_circular', 'std_surface_lay_radial',
            'std_surface_lay_particulate',
            'std_surface_ground_ra04', 'std_surface_ground_ra08', 'std_surface_milled_ra16',
            'std_surface_turned_ra32', 'std_surface_honed_ra02', 'std_surface_polished_ra005',
            'std_surface_lapped_ra01', 'std_surface_reamed_ra08', 'std_surface_edm_ra16',
            'std_surface_hardanodized_ra16', 'std_surface_chrome_ra04', 'std_surface_shotpeened_ra32',
            'std_surface_dual_32_16', 'std_surface_dual_16_08', 'std_surface_dual_08_04',
            'std_surface_allowance_15', 'std_surface_allowance_20', 'std_surface_allowance_30', 'std_surface_allowance_50',
            'std_surface_allaround_ra16', 'std_surface_allaround_ra32',
            'std_surface_header_ra32_root', 'std_surface_header_ra16_root', 'std_surface_header_multi', 'std_surface_header_ascast',
            'std_surface_legacy_1tri', 'std_surface_legacy_2tri', 'std_surface_legacy_3tri', 'std_surface_legacy_4tri', 'std_surface_legacy_wave'
        ];

        for (const id of expectedIds) {
            const found = surfaceBlocks.find(b => b.id === id);
            expect(found, `Expected surface block ${id} to exist`).toBeDefined();
            expect(found?.entities.length).toBeGreaterThan(0);
        }
    });

    it('should generate collective drawing header callouts with mini symbols', () => {
        const headerEnts = createCollectiveCalloutEntities('Ra 3.2', 'machining_required');
        expect(headerEnts.length).toBeGreaterThan(4);

        const leftParen = headerEnts.find(e => e.geometry.type === 'TEXT' && e.geometry.content === '(');
        const rightParen = headerEnts.find(e => e.geometry.type === 'TEXT' && e.geometry.content === ')');
        expect(leftParen).toBeDefined();
        expect(rightParen).toBeDefined();
    });

    it('should generate legacy DIN 140 triangles and unmachined wave', () => {
        const tri3 = createLegacyTriangleEntities(3, '▽▽▽ Ra 1.6');
        // 3 triangles * 3 lines = 9 lines + 1 text = 10 entities
        const lines = tri3.filter(e => e.geometry.type === 'LINE');
        expect(lines.length).toBe(9);

        const wave = createLegacyTriangleEntities('wave', '~ (Unmachined)');
        expect(wave.filter(e => e.geometry.type === 'LINE').length).toBe(4);
    });
});

describe('AutoCAD Command Processor & InsertTool Integration', () => {
    beforeEach(() => {
        useCadStore.setState({ entities: [], selectedIds: [], activeCommand: null });
    });

    it('should map SURF, SURFFINISH, YUZEY aliases to SURFACE command', () => {
        expect(COMMAND_ALIASES['SURF']).toBe('SURFACE');
        expect(COMMAND_ALIASES['SURFFINISH']).toBe('SURFACE');
        expect(COMMAND_ALIASES['SURFACETEXTURE']).toBe('SURFACE');
        expect(COMMAND_ALIASES['YUZEY']).toBe('SURFACE');
        expect(COMMAND_ALIASES['ROUGHNESS']).toBe('SURFACE');
    });

    it('should insert surface texture block at specified point using InsertTool', () => {
        const block = createSurfaceFinishBlock({
            id: 'test_surface_ra32',
            name: 'Test Ra 3.2',
            description: 'Test block',
            symbolType: 'machining_required',
            roughnessParameter: 'Ra',
            roughnessValue: '3.2'
        });

        const tool = new InsertTool(block);
        tool.start();
        tool.onPointInput({ x: 50, y: 100 });

        const storeEntities = useCadStore.getState().entities;
        expect(storeEntities.length).toBe(block.entities.length);

        // Verify entities were translated by (50, 100)
        const firstLine = storeEntities.find(e => e.geometry.type === 'LINE');
        expect(firstLine).toBeDefined();
        if (firstLine && firstLine.geometry.type === 'LINE') {
            // Apex (0, 0) translated to (50, 100)
            const touchesTranslatedApex =
                (Math.abs(firstLine.geometry.start.x - 50) < 0.05 && Math.abs(firstLine.geometry.start.y - 100) < 0.05) ||
                (Math.abs(firstLine.geometry.end.x - 50) < 0.05 && Math.abs(firstLine.geometry.end.y - 100) < 0.05);
            expect(touchesTranslatedApex).toBe(true);
        }
    });
});
