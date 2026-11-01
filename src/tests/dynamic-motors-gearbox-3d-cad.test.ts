/**
 * ⚡ Test Suite: 3D CAD Multi-Part Sub-Assemblies & Export for Motors and Gearboxes
 * 
 * Verifies:
 * 1. Gamak AGM3EL IE3 Electric Motor Multi-Part 3D Generation (DIN/IEC standards)
 * 2. Yılmaz Redüktör M/K Series Multi-Part 3D Generation (ISO 6336 / GGG-40)
 * 3. IEC Standard Electric Motor Multi-Part 3D Generation
 * 4. DesignStudio addDynamicBlock3D integration (prevents 30x40 generic cylinder fallback)
 * 5. Parasolid X_T (.x_t) Schema 32001 export
 * 6. ISO 10303-21 STEP (.step) B-Rep solid assembly export
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DynamicBlockRegistry } from '@/cad/blocks/dynamic/registry';
import { useDesignStore } from '@/design-studio/designStore';
import {
  exportDynamicBlockToXT,
  exportDynamicBlockToSTEP,
  exportDynamicBlockToDXF
} from '@/cad/export/cadExportService';

describe('Motors & Gearboxes — 3D CAD Multi-Part Sub-Assemblies & Universal Export', () => {
  beforeEach(() => {
    useDesignStore.setState({ parts: [], subAssemblies: [], selectedId: null });
  });

  describe('1. Gamak AGM3EL IE3 Motor (Gamak Makina Sanayi / IEC 60034)', () => {
    const def = DynamicBlockRegistry.getById('dyn_gamak_motor')!;

    it('generates a rich multi-part CAD assembly with true industrial dimensions', () => {
      const parts = def.generate3D({ gamakModel: 'AGM3EL_100L_4', mountStyle: 'b3_foot' });

      // Must have Stator, Shaft, Key, Shield, Cowl, Terminal Box, Gland, and Feet
      expect(parts.length).toBeGreaterThanOrEqual(8);

      const stator = parts.find(p => p.name.includes('Stator Gövdesi'));
      expect(stator).toBeDefined();
      expect(stator?.kind).toBe('cylinder');
      expect(stator?.params?.diameter).toBe(200); // Ø200 mm
      expect(stator?.params?.length).toBeGreaterThan(150);

      const shaft = parts.find(p => p.name.includes('Tahrik Mili'));
      expect(shaft).toBeDefined();
      expect(shaft?.kind).toBe('cylinder');
      expect(shaft?.params?.diameter).toBe(28); // Ø28 mm DIN 748
      expect(shaft?.params?.length).toBe(60); // l=60 mm

      const key = parts.find(p => p.name.includes('Mil Kaması'));
      expect(key).toBeDefined();
      expect(key?.kind).toBe('box');
      expect(key?.params?.width).toBeGreaterThan(30);

      const terminalBox = parts.find(p => p.name.includes('Klemens Kutusu'));
      expect(terminalBox).toBeDefined();
      expect(terminalBox?.kind).toBe('box');

      const gland = parts.find(p => p.name.includes('Kablo Rakoru'));
      expect(gland).toBeDefined();
      expect(gland?.kind).toBe('cylinder');

      const feet = parts.filter(p => p.name.includes('Montaj Ayağı'));
      expect(feet.length).toBe(2); // Front and rear feet
    });

    it('successfully adds Gamak motor to DesignStudio without falling back to 30x40 cylinder', () => {
      const parts = def.generate3D({ gamakModel: 'AGM3EL_100L_4', mountStyle: 'b3_foot' });
      const store = useDesignStore.getState();
      const createdIds = store.addDynamicBlock3D(parts, 'Gamak AGM3EL 100L');

      expect(createdIds.length).toBe(parts.length);
      const state = useDesignStore.getState();
      expect(state.parts.length).toBe(parts.length);

      // Verify sub-assembly was created
      expect(state.subAssemblies.length).toBe(1);
      expect(state.subAssemblies[0].name).toBe('Gamak AGM3EL 100L');

      // Check stator part in store: MUST have true diameter=200, length > 150, NOT default 30x40!
      const storedStator = state.parts.find(p => p.name.includes('Stator Gövdesi'));
      expect(storedStator).toBeDefined();
      expect(storedStator?.params.diameter).toBe(200);
      expect(storedStator?.params.length).toBeGreaterThan(150);
      expect(storedStator?.params.diameter).not.toBe(30);
      expect(storedStator?.params.length).not.toBe(40);
    });

    it('exports Gamak motor to Siemens Parasolid (.x_t) and ISO STEP (.step)', () => {
      const { xtText, filename: xtName } = exportDynamicBlockToXT(def, { gamakModel: 'AGM3EL_100L_4' });
      expect(xtName).toContain('.x_t');
      expect(xtText).toContain('** PARASOLID ! transmission file');
      expect(xtText).toContain('! schema: 32001');
      expect(xtText).toContain('**END_OF_TRANSMISSION');

      const { stepText, filename: stepName } = exportDynamicBlockToSTEP(def, { gamakModel: 'AGM3EL_100L_4' });
      expect(stepName).toContain('.step');
      expect(stepText).toContain('ISO-10303-21;');
      expect(stepText).toContain('MANIFOLD_SOLID_BREP');
      expect(stepText).toContain('END-ISO-10303-21;');
    });
  });

  describe('2. Yılmaz Redüktör M/K Series (ISO 6336 / DIN 3990)', () => {
    const def = DynamicBlockRegistry.getById('dyn_yilmaz_gearbox')!;

    it('generates a full helical gearbox assembly (housing, cover, gears, shaft, flange, oil plugs)', () => {
      const parts = def.generate3D({ gearboxModel: 'M04', ratio: 20 });

      // Must have Casing, Cover, Helical Gear, Shaft, Key, PAM Flange, 2 Feet, 3 Plugs = 11 parts
      expect(parts.length).toBeGreaterThanOrEqual(9);

      const housing = parts.find(p => p.name.includes('Monoblok Gövde'));
      expect(housing).toBeDefined();
      expect(housing?.kind).toBe('box');
      expect(housing?.params?.width).toBeGreaterThan(250);
      expect(housing?.params?.height).toBeGreaterThan(150);

      const gear = parts.find(p => p.name.includes('Helisel Dişli'));
      expect(gear).toBeDefined();
      expect(gear?.kind).toBe('gear-blank');
      expect(gear?.params?.module).toBeGreaterThanOrEqual(2);

      const shaft = parts.find(p => p.name.includes('Çıkış Mili'));
      expect(shaft).toBeDefined();
      expect(shaft?.kind).toBe('cylinder');
      expect(shaft?.params?.diameter).toBe(35); // dOutput = 35 mm for M04
      expect(shaft?.params?.length).toBe(70);

      const pamFlange = parts.find(p => p.name.includes('IEC PAM B5'));
      expect(pamFlange).toBeDefined();
      expect(pamFlange?.kind).toBe('cylinder');

      const breather = parts.find(p => p.name.includes('Havalandırma'));
      expect(breather).toBeDefined();
    });

    it('adds Yılmaz Redüktör to DesignStudio as an organized sub-assembly', () => {
      const parts = def.generate3D({ gearboxModel: 'M03', ratio: 15 });
      const store = useDesignStore.getState();
      const createdIds = store.addDynamicBlock3D(parts, 'Yılmaz Redüktör M03');

      expect(createdIds.length).toBe(parts.length);
      const state = useDesignStore.getState();
      expect(state.subAssemblies.length).toBe(1);

      const storedShaft = state.parts.find(p => p.name.includes('Çıkış Mili'));
      expect(storedShaft).toBeDefined();
      expect(storedShaft?.params.diameter).toBe(30); // dOutput = 30 mm for M03
      expect(storedShaft?.params.length).toBe(60);
    });

    it('exports Yılmaz Redüktör to Parasolid X_T and ISO STEP solids', () => {
      const { xtText } = exportDynamicBlockToXT(def, { gearboxModel: 'M03' });
      expect(xtText).toContain('** PARASOLID ! transmission file');
      expect(xtText).toContain('! schema: 32001');

      const { stepText } = exportDynamicBlockToSTEP(def, { gearboxModel: 'M03' });
      expect(stepText).toContain('ISO-10303-21;');
      expect(stepText).toContain('CLOSED_SHELL');
    });
  });

  describe('3. Standard IEC Electric Motor (dyn_electric_motor)', () => {
    const def = DynamicBlockRegistry.getById('dyn_electric_motor')!;

    it('generates multi-part assembly with correct Y-up axis placement and dimensions', () => {
      const parts = def.generate3D({ frameSize: 'IEC_100', mountStyle: 'b3_foot' });
      expect(parts.length).toBeGreaterThanOrEqual(6);

      const stator = parts.find(p => p.name.includes('Stator Gövdesi'));
      expect(stator).toBeDefined();
      expect(stator?.params?.diameter).toBe(200); // Frame 100 has dBody=200

      const shaft = parts.find(p => p.name.includes('Çıkış Mili'));
      expect(shaft).toBeDefined();
      expect(shaft?.params?.diameter).toBe(28); // dShaft = 28
      expect(shaft?.params?.length).toBe(60);
    });
  });
});
