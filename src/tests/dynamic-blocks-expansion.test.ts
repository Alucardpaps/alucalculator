/**
 * 🧪 Test Suite: Expanded Industrial Dynamic Blocks & Engineering Mesh
 * 
 * Verifies:
 * 1. Aluminum T-Slot (DIN EN 12020)
 * 2. Hollow Box Section SHS/RHS (EN 10219 / EN 10210)
 * 3. Angle Profile L-Section (DIN EN 10056)
 * 4. Structural Aluminum Beam (EN 755 / Eurocode 9)
 * 5. Sheet Metal Plate with Cutouts & Hole Grid (DIN EN 10131 / ISO 9013)
 * 6. Gamak Industrial Electric Motor (Gamak AGM3EL IE3 / IEC 60034)
 * 7. Yılmaz Redüktör Helical Gearbox (Yılmaz M/K Series / ISO 6336)
 */

import { describe, it, expect } from 'vitest';
import { DynamicBlockRegistry } from '@/cad/blocks/dynamic/registry';
import { BLOCK_ENGINEERING_MESH, getBlockMeshLink, buildCalculatorUrlWithParams } from '@/system/blockEngineeringMesh';

describe('Expanded Dynamic Blocks — Normative CAD & Engineering Mesh', () => {
  const newBlockIds = [
    'dyn_tslot_profile',
    'dyn_box_profile',
    'dyn_angle_profile',
    'dyn_aluminum_profile',
    'dyn_sheet_metal_plate',
    'dyn_gamak_motor',
    'dyn_yilmaz_gearbox',
  ];

  it('registers all 7 expanded dynamic blocks in DynamicBlockRegistry', () => {
    for (const id of newBlockIds) {
      const def = DynamicBlockRegistry.getById(id);
      expect(def, `Block definition for ${id} must exist`).toBeDefined();
      expect(def?.id).toBe(id);
      expect(def?.name).toBeTruthy();
      expect(def?.nameTr).toBeTruthy();
      expect(def?.citation.tier).toBe(1);
      expect(def?.citation.standard).toBeTruthy();
    }
  });

  it('links all 7 blocks in BLOCK_ENGINEERING_MESH with tier 1 normative standards', () => {
    for (const id of newBlockIds) {
      const mesh = getBlockMeshLink(id);
      expect(mesh, `Mesh link for ${id} must exist in BLOCK_ENGINEERING_MESH`).toBeDefined();
      expect(mesh?.calculatorRoute.startsWith('/')).toBe(true);
      expect(mesh?.standardTier).toBe(1);
    }
  });

  describe('1. Aluminum T-Slot Extrusion (DIN EN 12020)', () => {
    const def = DynamicBlockRegistry.getById('dyn_tslot_profile')!;
    const mesh = getBlockMeshLink('dyn_tslot_profile')!;

    it('generates 2D cross section and elevation views with true CAD entities', () => {
      const sectionEntities = def.generate2D({ profileId: '4040', visState: 'cross_section' }, { x: 0, y: 0 });
      expect(sectionEntities.length).toBeGreaterThanOrEqual(4);

      const elevEntities = def.generate2D({ profileId: '4040', length: 1200, visState: 'elevation' }, { x: 10, y: 20 });
      expect(elevEntities.length).toBeGreaterThanOrEqual(2);
    });

    it('generates 3D CAD part definition with series and bore dimensions', () => {
      const parts = def.generate3D({ profileId: '4040', length: 1500 });
      expect(parts.length).toBe(1);
      expect(parts[0].kind).toBe('t-slot');
      expect(parts[0].dimensions?.width).toBe(40);
      expect(parts[0].dimensions?.length).toBe(1500);
    });

    it('calculates deterministic live metrics (inertia, mass, deflection under 1kN)', () => {
      const metrics = mesh.computeLiveMetrics({ profileId: '4040', length: 1000 });
      const massMetric = metrics.find(m => m.id === 'mass_tot');
      const deflMetric = metrics.find(m => m.id === 'deflection');
      const tnutMetric = metrics.find(m => m.id === 'tnut');

      expect(massMetric).toBeDefined();
      expect(Number(massMetric?.value)).toBeGreaterThan(1.0); // 4040 mass ~1.75 kg
      expect(deflMetric).toBeDefined();
      expect(Number(deflMetric?.value)).toBeGreaterThan(0);
      expect(tnutMetric?.value).toContain('DIN 508');
    });
  });

  describe('2. Hollow Box Section (SHS / RHS - EN 10219)', () => {
    const def = DynamicBlockRegistry.getById('dyn_box_profile')!;
    const mesh = getBlockMeshLink('dyn_box_profile')!;

    it('generates 2D and 3D tube geometry', () => {
      const entities = def.generate2D({ profileKey: 'SHS 50x50x3', visState: 'section' }, { x: 0, y: 0 });
      expect(entities.length).toBeGreaterThan(1);

      const parts = def.generate3D({ profileKey: 'SHS 50x50x3', length: 2500 });
      expect(parts[0].kind).toBe('tube');
      expect(parts[0].dimensions?.width).toBe(50);
    });

    it('calculates live section modulus and elastic moment capacity', () => {
      const metrics = mesh.computeLiveMetrics({ profileId: 'SHS 50x50x3', length: 1000, material: 'steel' });
      const ix = metrics.find(m => m.id === 'ix');
      const mel = metrics.find(m => m.id === 'mel');

      expect(Number(ix?.value)).toBeGreaterThan(10); // cm4
      expect(Number(mel?.value)).toBeGreaterThan(1.0); // kNm
    });
  });

  describe('3. Angle Profile (DIN EN 10056)', () => {
    const def = DynamicBlockRegistry.getById('dyn_angle_profile')!;
    const mesh = getBlockMeshLink('dyn_angle_profile')!;

    it('generates true L-section polygon and center of gravity marker', () => {
      const entities = def.generate2D({ profileKey: 'L 50x50x5', visState: 'cross_section' }, { x: 0, y: 0 });
      expect(entities.length).toBeGreaterThan(2);

      const parts = def.generate3D({ profileKey: 'L 50x50x5', length: 1800 });
      expect(parts[0].kind).toBe('L-bracket');
    });

    it('calculates centroid coordinates and parallel axis moment of inertia', () => {
      const metrics = mesh.computeLiveMetrics({ profileId: 'L 50x50x5', length: 1000 });
      const cog = metrics.find(m => m.id === 'cog');
      const area = metrics.find(m => m.id === 'area');

      expect(cog?.value).toContain('14.0');
      expect(Number(area?.value)).toBeCloseTo(5.0 * (50 + 50 - 5), 0); // 475 mm2
    });
  });

  describe('4. Sheet Metal Plate with Holes & Cutouts (DIN EN 10131 / ISO 9013)', () => {
    const def = DynamicBlockRegistry.getById('dyn_sheet_metal_plate')!;
    const mesh = getBlockMeshLink('dyn_sheet_metal_plate')!;

    it('generates parametric plate with corner/grid holes and center cutouts', () => {
      const entities = def.generate2D({
        width: 400,
        length: 600,
        holePattern: 'grid',
        gridCols: 3,
        gridRows: 2,
        cutoutType: 'rect',
        cutoutWidth: 150,
        cutoutHeight: 100,
      }, { x: 0, y: 0 });

      expect(entities.length).toBeGreaterThan(6);
    });

    it('computes laser contour cut length, scrap percentage, and DIN 9830 margin safety', () => {
      const metricsSafe = mesh.computeLiveMetrics({
        width: 400,
        length: 500,
        thickness: 4,
        material: 'alu_6061',
        holePattern: '4_corners',
        holeDiameter: 'M8', // dHole = 9.0 mm
        edgeMarginX: 20, // 20 / 9.0 = 2.22 >= 1.5 -> OK
        edgeMarginY: 20,
        cutoutType: 'circle',
        cutoutDia: 80,
      });

      const marginCheck = metricsSafe.find(m => m.id === 'margin_check');
      const cutLength = metricsSafe.find(m => m.id === 'cut_length');
      const scrap = metricsSafe.find(m => m.id === 'scrap_pct');

      expect(marginCheck?.value).toContain('OK');
      expect(Number(cutLength?.value)).toBeGreaterThan(1.5); // meters
      expect(Number(scrap?.value)).toBeGreaterThan(0);
    });

    it('triggers margin warning when edge margins violate DIN 9830 (e < 1.5d)', () => {
      const metricsWarn = mesh.computeLiveMetrics({
        width: 200,
        length: 200,
        thickness: 3,
        holePattern: '4_corners',
        holeDiameter: 'M16', // dHole = 17.5 mm
        edgeMarginX: 10, // 10 / 17.5 = 0.57 < 1.5 -> WARN
        edgeMarginY: 10,
      });

      const marginCheck = metricsWarn.find(m => m.id === 'margin_check');
      expect(marginCheck?.value).toContain('WARN');
    });
  });

  describe('5. Gamak Industrial Motor (Gamak AGM3EL IE3 / IEC 60034)', () => {
    const def = DynamicBlockRegistry.getById('dyn_gamak_motor')!;
    const mesh = getBlockMeshLink('dyn_gamak_motor')!;

    it('generates 2D views and 3D cylinder solid for Gamak motors', () => {
      const entities = def.generate2D({ gamakModel: 'AGM3EL_132M_4', mounting: 'B3' }, { x: 0, y: 0 });
      expect(entities.length).toBeGreaterThan(5);

      const parts = def.generate3D({ gamakModel: 'AGM3EL_132M_4' });
      expect(parts[0].kind).toBe('cylinder');
      expect(parts[0].dimensions?.kw).toBe(7.5);
    });

    it('computes live 400V full load current and nominal torque', () => {
      const metrics = mesh.computeLiveMetrics({ motorModel: 'AGM3EL_132M_4', mounting: 'B3' });
      const torque = metrics.find(m => m.id === 'torque');
      const amps = metrics.find(m => m.id === 'amps');
      const eff = metrics.find(m => m.id === 'eff');

      expect(Number(torque?.value)).toBeCloseTo(49.1, 0); // 7.5kW @ 1460rpm ~ 49.1 Nm
      expect(Number(amps?.value)).toBeCloseTo(15.0, 0); // ~15.0 A
      expect(eff?.value).toContain('90.4%');
    });
  });

  describe('6. Yılmaz Redüktör Gearbox (M / K Series / ISO 6336)', () => {
    const def = DynamicBlockRegistry.getById('dyn_yilmaz_gearbox')!;
    const mesh = getBlockMeshLink('dyn_yilmaz_gearbox')!;

    it('generates casing profile, output shaft, and oil plugs', () => {
      const entities = def.generate2D({ gearboxModel: 'M04', ratio: 20 }, { x: 0, y: 0 });
      expect(entities.length).toBeGreaterThan(5);

      const parts = def.generate3D({ gearboxModel: 'M04', ratio: 20 });
      expect(parts.length).toBeGreaterThanOrEqual(5);
      expect(parts[0].kind).toBe('box');
      expect(parts[0].dimensions?.model).toBe('M04');
    });

    it('computes live output speed, output torque, and service factor', () => {
      const metrics = mesh.computeLiveMetrics({
        gearboxModel: 'M04',
        ratio: 20,
        inputPowerKw: 5.5,
        inputSpeedRpm: 1450,
      });

      const n2 = metrics.find(m => m.id === 'n2');
      const t2 = metrics.find(m => m.id === 't2');
      const sf = metrics.find(m => m.id === 'sf');

      expect(Number(n2?.value)).toBeCloseTo(1450 / 20, 1); // 72.5 rpm
      expect(Number(t2?.value)).toBeGreaterThan(600); // Output torque
      expect(sf?.value).toContain('Safe'); // M04 has max 850 Nm, ~700 Nm gives sf > 1.2
    });
  });

  describe('7. Structural Aluminum Profiles (I, H, T - Eurocode 9)', () => {
    const def = DynamicBlockRegistry.getById('dyn_aluminum_profile')!;
    const mesh = getBlockMeshLink('dyn_aluminum_profile')!;

    it('generates correct 3D kinds (I-beam vs T-beam)', () => {
      const partsI = def.generate3D({ profileKey: 'Alu I 100x50x5', length: 2000 });
      expect(partsI[0].kind).toBe('I-beam');

      const partsT = def.generate3D({ profileKey: 'Alu T 40x40x4', length: 1000 });
      expect(partsT[0].kind).toBe('T-beam');
    });

    it('computes Eurocode 9 allowable bending capacity MRd', () => {
      const metrics = mesh.computeLiveMetrics({ profileId: 'Alu I 100x50x5', length: 1500 });
      const ix = metrics.find(m => m.id === 'ix');
      const mrd = metrics.find(m => m.id === 'mrd');

      expect(Number(ix?.value)).toBeGreaterThan(50); // cm4
      expect(Number(mrd?.value)).toBeGreaterThan(2.0); // kNm
    });

    it('generates ISO 128 / ANSI31 section HATCH entities in cross section view', () => {
      const entities = def.generate2D({ profileKey: 'Alu I 100x50x5', visState: 'cross_section' });
      const hatchEntities = entities.filter(e => e.geometry.type === 'HATCH');
      expect(hatchEntities.length).toBeGreaterThanOrEqual(1);
      const hatchGeom = hatchEntities[0].geometry as any;
      expect(hatchGeom.pattern).toBe('ANSI31');
      expect(hatchGeom.boundaryVertices.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('8. Section Hatching Engine in Dynamic Blocks', () => {
    it('generates cross section HATCH for Box Profile, Steel Beam, SKF Bearing, and Sheet Plate', () => {
      const boxDef = DynamicBlockRegistry.getById('dyn_box_profile')!;
      const boxHatches = boxDef.generate2D({ visState: 'cross_section' }).filter(e => e.geometry.type === 'HATCH');
      expect(boxHatches.length).toBeGreaterThanOrEqual(1); // Continuous hollow section hatch with inner hole

      const steelDef = DynamicBlockRegistry.getById('dyn_steel_beam')!;
      const steelHatches = steelDef.generate2D({ visState: 'cross_section' }).filter(e => e.geometry.type === 'HATCH');
      expect(steelHatches.length).toBeGreaterThanOrEqual(1);

      const bearingDef = DynamicBlockRegistry.getById('dyn_skf_bearing')!;
      const bearingHatches = bearingDef.generate2D({ viewMode: 'axial_section' }).filter(e => e.geometry.type === 'HATCH');
      expect(bearingHatches.length).toBeGreaterThanOrEqual(2); // Outer & inner rings

      const plateDef = DynamicBlockRegistry.getById('dyn_sheet_metal_plate')!;
      const plateHatches = plateDef.generate2D({ state: 'section' }).filter(e => e.geometry.type === 'HATCH');
      expect(plateHatches.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('9. Profile Elevation/Plan Alignment & Dynamic Transformation Tracking', () => {
    it('properly centers outer boundary rectangle along profile length for T-Slot, Box, Angle, and Aluminum Profiles', () => {
      const basePoint = { x: 100, y: 200 };
      const length = 1500;

      // 1. T-Slot
      const tslotDef = DynamicBlockRegistry.getById('dyn_tslot_profile')!;
      const tslotEnts = tslotDef.generate2D({ profileId: '4040', length, visState: 'elevation' }, basePoint);
      const tslotRect = tslotEnts.find(e => e.geometry.type === 'RECTANGLE');
      expect(tslotRect).toBeDefined();
      const tg = tslotRect!.geometry as any;
      expect(tg.center.x).toBe(basePoint.x + length / 2);
      expect(tg.center.y).toBe(basePoint.y);
      expect(tg.width).toBe(length);

      // 2. Box Profile
      const boxDef = DynamicBlockRegistry.getById('dyn_box_profile')!;
      const boxEnts = boxDef.generate2D({ profileKey: 'SHS 50x50x3', length, visState: 'elevation' }, basePoint);
      const boxRect = boxEnts.find(e => e.geometry.type === 'RECTANGLE');
      expect(boxRect).toBeDefined();
      const bg = boxRect!.geometry as any;
      expect(bg.center.x).toBe(basePoint.x + length / 2);
      expect(bg.center.y).toBe(basePoint.y);
      expect(bg.width).toBe(length);

      // 3. Angle Profile
      const angleDef = DynamicBlockRegistry.getById('dyn_angle_profile')!;
      const angleEnts = angleDef.generate2D({ profileKey: 'L 50x50x5', length, visState: 'elevation' }, basePoint);
      const angleRect = angleEnts.find(e => e.geometry.type === 'RECTANGLE');
      expect(angleRect).toBeDefined();
      const ag = angleRect!.geometry as any;
      expect(ag.center.x).toBe(basePoint.x + length / 2);
      expect(ag.width).toBe(length);

      // 4. Aluminum Profile
      const aluDef = DynamicBlockRegistry.getById('dyn_aluminum_profile')!;
      const aluEnts = aluDef.generate2D({ profileKey: 'Alu I 100x50x5', length, visState: 'elevation' }, basePoint);
      const aluRect = aluEnts.find(e => e.geometry.type === 'RECTANGLE');
      expect(aluRect).toBeDefined();
      const alg = aluRect!.geometry as any;
      expect(alg.center.x).toBe(basePoint.x + length / 2);
      expect(alg.center.y).toBe(basePoint.y);
      expect(alg.width).toBe(length);
    });

    it('Transformer.move updates both geometry and dynamicBasePoint', async () => {
      const { Transformer } = await import('@/cad/kernel/Transformer');
      const { createRectangleEntity } = await import('@/cad/kernel/types');

      const entity = createRectangleEntity({ x: 0, y: 0 }, 100, 50);
      entity.isDynamic = true;
      entity.dynamicBlockId = 'dyn_box_profile';
      entity.dynamicBasePoint = { x: 50, y: 60 };

      const moved = Transformer.move(entity, { x: 30, y: -20 });
      expect((moved.geometry as any).center).toEqual({ x: 30, y: -20 });
      expect(moved.dynamicBasePoint).toEqual({ x: 80, y: 40 });
    });

    it('Transformer.rotate and Transformer.scale maintain dynamicBasePoint, rotation, and scale', async () => {
      const { Transformer } = await import('@/cad/kernel/Transformer');
      const { createRectangleEntity } = await import('@/cad/kernel/types');

      const entity = createRectangleEntity({ x: 100, y: 0 }, 100, 50);
      entity.isDynamic = true;
      entity.dynamicBasePoint = { x: 100, y: 0 };
      entity.dynamicRotationRad = 0;
      entity.dynamicScale = 1.0;

      // Rotate 90 deg around (0,0)
      const rotated = Transformer.rotate(entity, { x: 0, y: 0 }, Math.PI / 2);
      expect(Math.round(rotated.dynamicBasePoint!.x)).toBe(0);
      expect(Math.round(rotated.dynamicBasePoint!.y)).toBe(100);
      expect(rotated.dynamicRotationRad).toBeCloseTo(Math.PI / 2);

      // Scale 2x around (0,0)
      const scaled = Transformer.scale(entity, { x: 0, y: 0 }, 2.0);
      expect(scaled.dynamicBasePoint).toEqual({ x: 200, y: 0 });
      expect(scaled.dynamicScale).toBe(2.0);
    });
  });
});
