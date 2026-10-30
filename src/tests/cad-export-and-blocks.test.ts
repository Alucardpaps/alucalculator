import { describe, it, expect } from 'vitest';
import { DynamicBlockRegistry } from '@/cad/blocks/dynamic/registry';
import {
    exportDynamicBlockToDXF,
    exportDynamicBlockToSTEP,
    exportDynamicBlockToXT
} from '@/cad/export/cadExportService';

describe('CAD Export Service & Dynamic Blocks Coordinate Alignment', () => {
    it('should generate aligned sheet metal plate coordinates with holes and cutouts', () => {
        const plate = DynamicBlockRegistry.getById('dyn_sheet_metal_plate')!;
        expect(plate).toBeDefined();

        const params = {
            width: 400,
            length: 600,
            thickness: 3.0,
            marginEdgeX: 30,
            marginEdgeY: 30,
            holePattern: '4_corners',
            cutoutType: 'rect',
            cutoutWidth: 150,
            cutoutHeight: 200,
            cornerStyle: 'fillet',
            cornerSize: 10,
            visState: 'plan'
        };

        const entities = plate.generate2D(params, { x: 0, y: 0 });
        expect(entities.length).toBeGreaterThan(0);

        // Verify holes are inside the [0, 400] x [0, 600] domain
        const circles = entities.filter(e => e.geometry.type === 'CIRCLE');
        expect(circles.length).toBe(4);
        for (const c of circles) {
            const g = c.geometry as any;
            expect(g.center.x).toBeGreaterThanOrEqual(25);
            expect(g.center.x).toBeLessThanOrEqual(375);
            expect(g.center.y).toBeGreaterThanOrEqual(25);
            expect(g.center.y).toBeLessThanOrEqual(575);
        }

        // Verify cutout rectangle is centered at (200, 300)
        const rects = entities.filter(e => e.geometry.type === 'RECTANGLE');
        const cutout = rects.find(r => (r.geometry as any).width === 150 && (r.geometry as any).height === 200);
        expect(cutout).toBeDefined();
        expect((cutout!.geometry as any).center.x).toBe(200);
        expect((cutout!.geometry as any).center.y).toBe(300);
    });

    it('should export Gamak motor to 2D DXF with proper layers and valid geometry', () => {
        const motor = DynamicBlockRegistry.getById('dyn_gamak_motor')!;
        expect(motor).toBeDefined();

        const params = {
            gamakModel: 'AGM3EL_100L_4',
            mountStyle: 'b3_foot'
        };

        const { dxfText, filename } = exportDynamicBlockToDXF(motor, params);
        expect(filename).toContain('gamak_motor');
        expect(filename.endsWith('.dxf')).toBe(true);
        expect(dxfText).toContain('SECTION');
        expect(dxfText).toContain('ENTITIES');
        expect(dxfText).toContain('EOF');
    });

    it('should export Yılmaz gearbox to 3D Parasolid X_T format', () => {
        const gearbox = DynamicBlockRegistry.getById('dyn_yilmaz_gearbox')!;
        expect(gearbox).toBeDefined();

        const params = {
            gearboxModel: 'M03',
            ratio: 15.0
        };

        const { xtText, filename } = exportDynamicBlockToXT(gearbox, params);
        expect(filename).toContain('yilmaz_gearbox');
        expect(filename.endsWith('.x_t')).toBe(true);
        expect(xtText).toContain('** PARASOLID ! transmission file');
        expect(xtText).toContain('schema: 32001');
        expect(xtText).toContain('**END_OF_HEADER');
        expect(xtText).toContain('**END_OF_TRANSMISSION');
    });

    it('should export dynamic blocks to ISO 10303-21 STEP Solid format', () => {
        const motor = DynamicBlockRegistry.getById('dyn_gamak_motor')!;
        const { stepText, filename } = exportDynamicBlockToSTEP(motor, { gamakModel: 'AGM3EL_90S_4' });
        expect(filename.endsWith('.step')).toBe(true);
        expect(stepText).toContain('ISO-10303-21');
        expect(stepText).toContain('HEADER');
        expect(stepText).toContain('FILE_SCHEMA');
        expect(stepText).toContain('END-ISO-10303-21');
    });
});
