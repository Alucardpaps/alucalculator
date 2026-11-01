import { describe, it, expect, beforeEach } from 'vitest';
import {
  BLOCK_ENGINEERING_MESH,
  getBlockMeshLink,
  buildCalculatorUrlWithParams,
} from '@/system/blockEngineeringMesh';
import { CrossModuleBridge } from '@/system/crossModuleBridge';
import { useCadStore } from '@/cad/store/cadStore';
import { useFlowStore } from '@/store/flowStore';
import { MODULE_LINK_REGISTRY, getModuleLinkInfo } from '@/flow/core/moduleLinks';
import { INTERCONNECTION_GRAPH, InterconnectionGraphEngine } from '@/system/interconnectionGraph';

describe('Universal Block Engineering Mesh & Interconnected Ecosystem', () => {
  beforeEach(() => {
    useCadStore.getState().clearEntities();
    useFlowStore.setState({ nodes: [], edges: [], selectedNodeId: null });
  });

  // ─── 1. MESH REGISTRY & DETERMINISTIC FORMULAS ───
  describe('Block Engineering Mesh Registry & Metrics', () => {
    it('defines valid normative mesh links for core mechanical and structural blocks', () => {
      const coreBlocks = [
        'dyn_involute_gear',
        'dyn_skf_bearing',
        'dyn_v_belt_pulley',
        'dyn_timing_pulley',
        'dyn_roller_sprocket',
        'dyn_fastener',
        'dyn_steel_beam',
        'dyn_foundation_column',
        'dyn_pipe_flange',
        'dyn_electric_motor',
      ];

      for (const id of coreBlocks) {
        const link = getBlockMeshLink(id);
        expect(link, `Block ${id} should be defined in BLOCK_ENGINEERING_MESH`).toBeDefined();
        expect(link?.calculatorRoute.startsWith('/')).toBe(true);
        expect(link?.flowSchemaId).toBeTruthy();
        expect(link?.standard).toBeTruthy();
        expect(link?.standardTier).toBe(1);
      }
    });

    it('generates fully parameterized URLs for dedicated solvers', () => {
      const gearUrl = buildCalculatorUrlWithParams('dyn_involute_gear', {
        module: 4,
        teeth: 25,
        teeth2: 50,
        pressureAngle: 20,
        helixAngle: 15,
      });
      expect(gearUrl).toContain('/gears/?');
      expect(gearUrl).toContain('m=4');
      expect(gearUrl).toContain('z1=25');
      expect(gearUrl).toContain('z2=50');
      expect(gearUrl).toContain('beta=15');

      const bearingUrl = buildCalculatorUrlWithParams('dyn_skf_bearing', {
        designation: '6205',
      });
      expect(bearingUrl).toContain('/bearings/?');
      expect(bearingUrl).toContain('d=25');
      expect(bearingUrl).toContain('D=52');
      expect(bearingUrl).toContain('desig=6205');
    });

    it('computes live deterministic engineering metrics with formulas', () => {
      const gearLink = getBlockMeshLink('dyn_involute_gear');
      const metrics = gearLink?.computeLiveMetrics({ module: 3, teeth: 20, teeth2: 40, pressureAngle: 20, helixAngle: 0 });
      expect(metrics).toBeDefined();

      const d1 = metrics?.find(m => m.id === 'd1');
      expect(d1?.value).toBe('60.00'); // d = 3 * 20 = 60
      expect(d1?.unit).toBe('mm');

      const da1 = metrics?.find(m => m.id === 'da1');
      expect(da1?.value).toBe('66.00'); // da = 60 + 2*3 = 66

      const a = metrics?.find(m => m.id === 'a');
      expect(a?.value).toBe('90.00'); // a = (60 + 120) / 2 = 90
    });
  });

  // ─── 2. SOLVER / FLOW -> 2D CAD DYNAMIC BLOCK ───
  describe('CrossModuleBridge: Solver to 2D CAD Dynamic Block', () => {
    it('instantiates dynamic gear block into 2D CAD with dynamic metadata and parameters', () => {
      const res = CrossModuleBridge.exportSolverToDynamicBlock('dyn_involute_gear', {
        module: 3.5,
        teeth: 18,
        teeth2: 54,
        pressureAngle: 20,
      });

      expect(res.success).toBe(true);
      expect(res.instanceId).toBeTruthy();

      const entities = useCadStore.getState().entities;
      expect(entities.length).toBeGreaterThan(0);

      // Verify all entities belong to the dynamic block
      for (const ent of entities) {
        expect(ent.isDynamic).toBe(true);
        expect(ent.dynamicBlockId).toBe('dyn_involute_gear');
        expect(ent.blockInstanceId).toBe(res.instanceId);
        expect(ent.dynamicParams?.module).toBe(3.5);
        expect(ent.dynamicParams?.teeth).toBe(18);
      }
    });

    it('instantiates dynamic bearing block into 2D CAD', () => {
      const res = CrossModuleBridge.exportSolverToDynamicBlock('dyn_skf_bearing', {
        designation: '6206',
        bore: 30,
      });

      expect(res.success).toBe(true);
      const entities = useCadStore.getState().entities;
      expect(entities.length).toBeGreaterThan(0);
      expect(entities[0].dynamicBlockId).toBe('dyn_skf_bearing');
      expect(entities[0].dynamicParams?.designation).toBe('6206');
    });

    it('instantiates dynamic metric bolt fastener into 2D CAD', () => {
      const res = CrossModuleBridge.exportSolverToDynamicBlock('dyn_fastener', {
        size: 'M16',
        length: 80,
        headType: 'hex',
      });

      expect(res.success).toBe(true);
      const entities = useCadStore.getState().entities;
      expect(entities.length).toBeGreaterThan(0);
      expect(entities[0].dynamicBlockId).toBe('dyn_fastener');
      expect(entities[0].dynamicParams?.size).toBe('M16');
    });
  });

  // ─── 3. CAD DYNAMIC BLOCK -> FLOW ENGINE ───
  describe('CrossModuleBridge: Dynamic Block to Flow Engine', () => {
    it('creates a connected Flow node directly from a CAD dynamic gear block', () => {
      const res = CrossModuleBridge.exportBlockToFlow('dyn_involute_gear', {
        module: 4.0,
        teeth: 22,
        teeth2: 66,
        pressureAngle: 20,
        helixAngle: 12,
        faceWidth: 45,
      });

      expect(res.success).toBe(true);
      expect(res.nodeId).toBeTruthy();

      const nodes = useFlowStore.getState().nodes;
      expect(nodes.length).toBe(1);

      const node = nodes[0];
      expect(node.id).toBe(res.nodeId);
      expect(node.data.type).toBe('engineering');
      expect((node.data as any).schemaId).toBe('mech-gear-spur');
      expect((node.data as any).module_mm).toBe(4.0);
      expect((node.data as any).pinion_teeth).toBe(22);
      expect((node.data as any).gear_teeth).toBe(66);
      expect((node.data as any).face_width_mm).toBe(45);
    });

    it('creates a Flow bearing life node directly from a CAD bearing block', () => {
      const res = CrossModuleBridge.exportBlockToFlow('dyn_skf_bearing', {
        designation: '6205',
      });

      expect(res.success).toBe(true);
      const nodes = useFlowStore.getState().nodes;
      expect(nodes.length).toBe(1);
      expect((nodes[0].data as any).schemaId).toBe('mech-bearing-life');
      expect((nodes[0].data as any).innerDia).toBe(25);
      expect((nodes[0].data as any).outerDia).toBe(52);
    });
  });

  // ─── 4. FLOW ENGINE NODES EXPORTING CAD DYNAMIC BLOCKS ───
  describe('Flow Engine Module Links: executeExportCadDynamicBlock', () => {
    it('supports CAD dynamic block export on all key mechanical nodes', () => {
      const targetSchemas = [
        'mech-gear-spur',
        'mech-gear-helical',
        'mech-bearing-life',
        'mech-belt-drive',
        'mech-chain-drive',
        'mech-column-buckling',
        'mech-beam-deflection',
        'mech-bolt-stress',
        'mech-power-torque',
        'mech-pressure-vessel-code',
      ];

      for (const schemaId of targetSchemas) {
        const link = MODULE_LINK_REGISTRY[schemaId];
        expect(link, `Schema ${schemaId} should exist in MODULE_LINK_REGISTRY`).toBeDefined();
        expect(link.supportsCadDynamicBlock, `${schemaId} should have supportsCadDynamicBlock = true`).toBe(true);
        expect(link.dynamicBlockId, `${schemaId} should have dynamicBlockId`).toBeTruthy();
        expect(typeof link.executeExportCadDynamicBlock).toBe('function');
      }
    });

    it('executes CAD dynamic block export from Spur Gear Flow node', () => {
      const spurLink = MODULE_LINK_REGISTRY['mech-gear-spur'];
      const res = spurLink.executeExportCadDynamicBlock!({
        module_mm: 5,
        pinion_teeth: 19,
        gear_teeth: 57,
        face_width_mm: 50,
      }, {});

      expect(res.success).toBe(true);
      const entities = useCadStore.getState().entities;
      expect(entities.length).toBeGreaterThan(0);
      expect(entities[0].dynamicParams?.module).toBe(5);
      expect(entities[0].dynamicParams?.teeth).toBe(19);
    });

    it('executes CAD dynamic block export from Belt Drive Flow node', () => {
      const beltLink = MODULE_LINK_REGISTRY['mech-belt-drive'];
      const res = beltLink.executeExportCadDynamicBlock!({
        d1: 180,
      }, {});

      expect(res.success).toBe(true);
      const entities = useCadStore.getState().entities;
      expect(entities.length).toBeGreaterThan(0);
      expect(entities[0].dynamicBlockId).toBe('dyn_v_belt_pulley');
      expect(entities[0].dynamicParams?.pitchDiameter).toBe(180);
    });
  });

  // ─── 5. UNIVERSAL INTERCONNECTION GRAPH ───
  describe('Universal Interconnection Graph Verification', () => {
    it('registers bidirectional links 53-56 connecting CAD blocks, Flow, and Calculators', () => {
      const link53 = INTERCONNECTION_GRAPH.find(e => e.id === 'link-53');
      expect(link53).toBeDefined();
      expect(link53?.sourceModule).toBe('cad-dynamic-blocks');
      expect(link53?.targetModule).toBe('flow-engine');

      const link54 = INTERCONNECTION_GRAPH.find(e => e.id === 'link-54');
      expect(link54).toBeDefined();
      expect(link54?.sourceModule).toBe('flow-engine');
      expect(link54?.targetModule).toBe('cad-dynamic-blocks');

      const link55 = INTERCONNECTION_GRAPH.find(e => e.id === 'link-55');
      expect(link55).toBeDefined();
      expect(link55?.sourceModule).toBe('cad-dynamic-blocks');
      expect(link55?.targetModule).toBe('calculators');

      const link56 = INTERCONNECTION_GRAPH.find(e => e.id === 'link-56');
      expect(link56).toBeDefined();
      expect(link56?.sourceModule).toBe('calculators');
      expect(link56?.targetModule).toBe('cad-dynamic-blocks');

      expect(InterconnectionGraphEngine.totalCount).toBeGreaterThanOrEqual(56);
    });
  });
});
