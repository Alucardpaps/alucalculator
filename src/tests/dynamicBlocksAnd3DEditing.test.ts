import { describe, it, expect, beforeEach } from 'vitest';
import { DynamicBlockRegistry } from '../cad/blocks/dynamic/registry';
import {
  applyPushPull,
  applyCornerBoltPattern,
  applyCenterBore,
  applyCenterSlot,
  applyLightweightIsogrid,
} from '../design-studio/directModelingEngine';
import { useDesignStore } from '../design-studio/designStore';
import { useGameTourStore } from '../store/useGameTourStore';
import { resolvePageTourForPathname } from '../data/pageGameTours';

describe('Dynamic Block Registry & 49+ Industrial Blocks (ISO/DIN/HIWIN/igus)', () => {
  it('registers all 49+ dynamic blocks including hydraulic, linear guide, ball screw, pillow block, coupling, conveyor roller, gripper, valve, drag chain, spring, and caster', () => {
    const all = DynamicBlockRegistry.getAll();
    expect(all.length).toBeGreaterThanOrEqual(49);

    const newIds = [
      'dyn_hydraulic_cylinder',
      'dyn_linear_guide',
      'dyn_ball_screw',
      'dyn_pillow_block',
      'dyn_shaft_coupling',
      'dyn_pipe_flange',
      'dyn_conveyor_roller',
      'dyn_pneumatic_gripper',
      'dyn_industrial_valve',
      'dyn_cable_drag_chain',
      'dyn_helical_spring',
      'dyn_heavy_caster_wheel',
    ];

    for (const id of newIds) {
      const def = DynamicBlockRegistry.getById(id);
      expect(def, `Block ${id} should be registered`).toBeDefined();
      if (!def) continue;

      const entities2D = def.generate2D(def.defaultValues, { x: 0, y: 0 });
      expect(entities2D.length).toBeGreaterThan(3);

      // Verify section views include ISO 128 HATCH entities
      const hasHatch = entities2D.some((e) => e.geometry.type === 'HATCH');
      if (id !== 'dyn_linear_guide') {
        expect(hasHatch, `Block ${id} default section should contain HATCH entities`).toBe(true);
      }

      if (def.generate3D) {
        const parts3D = def.generate3D(def.defaultValues, { x: 0, y: 0, z: 0 });
        expect(parts3D.length).toBeGreaterThan(0);
      }

      const grips = def.getGrips(def.defaultValues, { x: 0, y: 0 });
      expect(grips.length).toBeGreaterThan(0);
    }
  });

  it('supports end_section hatch view on dyn_linear_guide, cross_section on dyn_cable_drag_chain, and flange_face view on dyn_pipe_flange', () => {
    const guide = DynamicBlockRegistry.getById('dyn_linear_guide')!;
    const endSecEntities = guide.generate2D({ ...guide.defaultValues, viewMode: 'end_section' }, { x: 0, y: 0 });
    expect(endSecEntities.some((e) => e.geometry.type === 'HATCH')).toBe(true);

    const chain = DynamicBlockRegistry.getById('dyn_cable_drag_chain')!;
    const chainSec = chain.generate2D({ ...chain.defaultValues, viewMode: 'cross_section' }, { x: 0, y: 0 });
    expect(chainSec.some((e) => e.geometry.type === 'HATCH')).toBe(true);

    const flange = DynamicBlockRegistry.getById('dyn_pipe_flange')!;
    const faceEntities = flange.generate2D({ ...flange.defaultValues, visState: 'flange_face' }, { x: 0, y: 0 });
    expect(faceEntities.filter((e) => e.geometry.type === 'CIRCLE').length).toBeGreaterThanOrEqual(8);
  });
});

describe('PC-Game Style Interactive Demo Tour Store & Per-Page Route Resolution', () => {
  beforeEach(() => {
    useGameTourStore.getState().resetAllTours();
    useGameTourStore.getState().skipCurrentPageTour();
  });

  it('resolves tailored game tour steps for Home, 3D Studio, 2D CAD, Calculators, Flow, Materials, and individual Solver routes', () => {
    expect(resolvePageTourForPathname('/')?.pageKey).toBe('home');
    expect(resolvePageTourForPathname('/design-studio')?.pageKey).toBe('design-studio');
    expect(resolvePageTourForPathname('/cad-editor')?.pageKey).toBe('cad-editor');
    expect(resolvePageTourForPathname('/calculators')?.pageKey).toBe('calculators');
    expect(resolvePageTourForPathname('/flow')?.pageKey).toBe('flow');
    expect(resolvePageTourForPathname('/materials')?.pageKey).toBe('materials');
    expect(resolvePageTourForPathname('/bolt-torque')?.pageKey).toBe('solver-detail');
  });

  it('auto-triggers on first visit to a page, awards XP on step completion, and respects permanent opt-out (skip)', () => {
    const store = useGameTourStore.getState();
    store.checkAndTriggerFirstVisit('design-studio');

    let state = useGameTourStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.activePageKey).toBe('design-studio');
    expect(state.stepIndex).toBe(0);

    const initialXp = state.tourXp;
    store.nextStep();
    state = useGameTourStore.getState();
    expect(state.stepIndex).toBe(1);
    expect(state.tourXp).toBeGreaterThan(initialXp);

    // User chooses to permanently opt out of auto tours ("İstemiyorum")
    store.disableAllAutoTours();
    state = useGameTourStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.autoTourOptOut).toBe(true);

    // Visiting a new page should NOT auto-open when opted out
    store.checkAndTriggerFirstVisit('cad-editor');
    expect(useGameTourStore.getState().isOpen).toBe(false);
  });
});

describe('3D Part Editing Engine & Inline Hole/Cut Store Operations', () => {
  beforeEach(() => {
    const store = useDesignStore.getState();
    store.clearScene();
  });

  it('applies direct Push/Pull along face normals and updates part dimensions deterministically', () => {
    const store = useDesignStore.getState();
    store.addPart('box');
    const part = useDesignStore.getState().getSelected()!;
    expect(part).toBeDefined();

    const initialH = Number(part.params.height);
    const resTop = applyPushPull(part, 'top', 15);
    expect(resTop.axisKey).toBe('height');
    expect(resTop.newVal).toBe(initialH + 15);

    const initialW = Number(part.params.width);
    const resRight = applyPushPull(part, 'right', -10);
    expect(resRight.axisKey).toBe('width');
    expect(resRight.newVal).toBe(initialW - 10);
  });

  it('allows adding and inline-editing Holes (size, type, face, x, y, depth) and Cuts (type, width, length, depth, x, y)', () => {
    const store = useDesignStore.getState();
    store.addPart('plate');
    const selected = useDesignStore.getState().getSelected()!;

    store.addHole(selected.id, {
      size: 'M6',
      type: 'counterbore',
      face: 'top',
      x: 12,
      y: -8,
      depth: 20,
      throughAll: true,
    });

    let updatedPart = useDesignStore.getState().getSelected()!;
    expect(updatedPart.holes?.length).toBe(1);
    const holeId = updatedPart.holes![0].id;
    expect(updatedPart.holes![0].size).toBe('M6');
    expect(updatedPart.holes![0].x).toBe(12);

    useDesignStore.getState().updateHole(selected.id, holeId, {
      size: 'M10',
      type: 'tap',
      x: 25,
      y: 10,
      depth: 15,
    });

    updatedPart = useDesignStore.getState().getSelected()!;
    expect(updatedPart.holes![0].size).toBe('M10');
    expect(updatedPart.holes![0].type).toBe('tap');
    expect(updatedPart.holes![0].x).toBe(25);
    expect(updatedPart.holes![0].y).toBe(10);
    expect(updatedPart.holes![0].depth).toBe(15);

    useDesignStore.getState().addCut(selected.id, {
      type: 'slot',
      face: 'top',
      width: 12,
      length: 35,
      depth: 5,
      x: 0,
      y: 0,
    });

    updatedPart = useDesignStore.getState().getSelected()!;
    expect(updatedPart.cuts?.length).toBe(1);
    const cutId = updatedPart.cuts![0].id;

    useDesignStore.getState().updateCut(selected.id, cutId, {
      type: 'rect',
      width: 24,
      length: 50,
      depth: 8,
      x: -5,
      y: 5,
    });

    updatedPart = useDesignStore.getState().getSelected()!;
    expect(updatedPart.cuts![0].type).toBe('rect');
    expect(updatedPart.cuts![0].width).toBe(24);
    expect(updatedPart.cuts![0].length).toBe(50);
    expect(updatedPart.cuts![0].depth).toBe(8);
    expect(updatedPart.cuts![0].x).toBe(-5);
  });

  it('stamps 4x corner bolts, center bore, center slot, and isogrid pockets on a part face', () => {
    const store = useDesignStore.getState();
    store.addPart('box');
    const selected = useDesignStore.getState().getSelected()!;
    store.updatePartParams(selected.id, { width: 80, height: 30, depth: 80 });
    const part = useDesignStore.getState().getSelected()!;

    const bolts = applyCornerBoltPattern(part, 'top', 'M6');
    expect(bolts.length).toBe(4);

    const bore = applyCenterBore(part, 'top', 16, 'clearance');
    expect(bore.diameter).toBe(16);

    const slot = applyCenterSlot(part, 'top', 14, 40, 6);
    expect(slot.type).toBe('slot');
    expect(slot.width).toBe(14);

    const pockets = applyLightweightIsogrid(part, 'top', 4, 5);
    expect(pockets.length).toBeGreaterThanOrEqual(4);
  });

  it('manages Right-Click Context Menu and Properties modal state for Sheet Metal & Dynamic Blocks', () => {
    const store = useDesignStore.getState();

    // 1. Sheet Metal Modal Triggers
    const mockSheetSpec: any = {
      thickness: 2.5,
      materialId: 'alu-6082-t6',
      firstFlange: { length: 150, width: 80 },
      bends: [{ id: 'b1', angleDeg: 90, innerRadius: 2.5, length: 40 }],
      cutouts: [{ id: 'c1', type: 'circle', x: 20, y: 30, diameter: 8, fromBendIndex: 0 }]
    };

    store.openSheetMetalModal('part-sm-1', mockSheetSpec, 'pressbrake');
    let state = useDesignStore.getState();
    expect(state.showSheetMetalModal).toBe(true);
    expect(state.sheetMetalEditingPartId).toBe('part-sm-1');
    expect(state.sheetMetalInitialTab).toBe('pressbrake');
    expect(state.sheetMetalInitialSpec?.thickness).toBe(2.5);

    store.openSheetMetalModal('part-sm-1', mockSheetSpec, 'cutouts');
    state = useDesignStore.getState();
    expect(state.sheetMetalInitialTab).toBe('cutouts');

    store.closeSheetMetalModal();
    state = useDesignStore.getState();
    expect(state.showSheetMetalModal).toBe(false);
    expect(state.sheetMetalEditingPartId).toBeNull();
    expect(state.sheetMetalInitialSpec).toBeNull();

    // 2. Dynamic Block Modal Triggers
    store.openDynamicBlockModal('part-dyn-1', 'dyn_gamak_motor', { frameSize: '100L', kw: 3.0 });
    state = useDesignStore.getState();
    expect(state.showDynamicBlockModal).toBe(true);
    expect(state.dynamicBlockEditingPartId).toBe('part-dyn-1');
    expect(state.dynamicBlockId).toBe('dyn_gamak_motor');
    expect(state.dynamicBlockInitialParams?.frameSize).toBe('100L');

    store.closeDynamicBlockModal();
    state = useDesignStore.getState();
    expect(state.showDynamicBlockModal).toBe(false);
    expect(state.dynamicBlockEditingPartId).toBeNull();
    expect(state.dynamicBlockId).toBeNull();
  });
});

