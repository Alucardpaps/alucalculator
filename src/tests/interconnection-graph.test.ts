import { describe, it, expect, beforeEach } from 'vitest';
import { INTERCONNECTION_GRAPH, InterconnectionGraphEngine } from '@/system/interconnectionGraph';
import { CrossModuleBridge } from '@/system/crossModuleBridge';
import { useAssemblyStore } from '@/lib/store/assemblyStore';

describe('Universal Interconnection Graph & Engine (52+ Connections)', () => {
  beforeEach(() => {
    useAssemblyStore.getState().clearWorkspace();
  });

  it('contains at least 52 registered unique cross-module edges', () => {
    const edges = InterconnectionGraphEngine.getAllEdges();
    expect(edges.length).toBeGreaterThanOrEqual(52);

    // Verify all IDs are unique
    const ids = edges.map(e => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(edges.length);
  });

  it('covers all 6 major engineering clusters', () => {
    const power = InterconnectionGraphEngine.getByCategory('power-transmission');
    const structural = InterconnectionGraphEngine.getByCategory('structural-frame');
    const cad = InterconnectionGraphEngine.getByCategory('cad-nesting');
    const fasteners = InterconnectionGraphEngine.getByCategory('fasteners-joints');
    const thermal = InterconnectionGraphEngine.getByCategory('thermal-fluids');
    const chess = InterconnectionGraphEngine.getByCategory('academy-chess');

    expect(power.length).toBeGreaterThanOrEqual(10);
    expect(structural.length).toBeGreaterThanOrEqual(10);
    expect(cad.length).toBeGreaterThanOrEqual(8);
    expect(fasteners.length).toBeGreaterThanOrEqual(8);
    expect(thermal.length).toBeGreaterThanOrEqual(6);
    expect(chess.length).toBeGreaterThanOrEqual(10);
  });

  it('calculates gear forces and recommended shaft diameter', () => {
    const res = CrossModuleBridge.sendGearForcesToShaft(150, 60, 20); // 150 Nm, Rp=60mm
    expect(res.Ft_N).toBe(2500); // 150 / 0.06 = 2500 N
    expect(res.Fr_N).toBeGreaterThan(0);
    expect(res.recommendedShaftDiaMm).toBeGreaterThanOrEqual(15);
  });

  it('calculates beam deflection curve and safety factors', () => {
    const res = CrossModuleBridge.calculateBeamDeflection(1000, 5000, 15, 70);
    expect(res.maxDeflectionMm).toBeGreaterThan(0);
    expect(res.maxBendingStressMPa).toBeGreaterThan(0);
    expect(res.safetyFactor).toBeGreaterThan(0);
  });

  it('calculates thermal preload loss in dissimilar joint (aluminum + steel)', () => {
    const res = CrossModuleBridge.checkThermalPreloadLoss(20000, -80, 30, 8);
    expect(res.preloadLossN).toBeGreaterThan(0);
    expect(res.finalPreloadN).toBeLessThan(20000);
  });

  it('provides 6+ verified Engineering Chess Grandmaster puzzles', () => {
    const puzzles = CrossModuleBridge.getChessPuzzles();
    expect(puzzles.length).toBeGreaterThanOrEqual(6);

    // Test Gear Puzzle Evaluation
    const gearPuzzle = puzzles.find(p => p.id === 'chess-1-gears');
    expect(gearPuzzle).toBeDefined();
    if (gearPuzzle) {
      // Correct input for i = (48/16) * (75/18) = 3 * 4.1667 = 12.50
      const evalPass = gearPuzzle.evaluate({ z1: 16, z2: 48, z3: 18, z4: 75 });
      expect(evalPass.pass).toBe(true);
      expect(evalPass.currentVal).toBe(12.5);

      const evalFail = gearPuzzle.evaluate({ z1: 16, z2: 32, z3: 18, z4: 36 });
      expect(evalFail.pass).toBe(false);
    }

    // Test Bolt Torque Puzzle Evaluation
    const boltPuzzle = puzzles.find(p => p.id === 'chess-4-bolt');
    expect(boltPuzzle).toBeDefined();
    if (boltPuzzle) {
      const evalPass = boltPuzzle.evaluate({ torqueNm: 49 });
      expect(evalPass.pass).toBe(true);
      const evalFail = boltPuzzle.evaluate({ torqueNm: 15 });
      expect(evalFail.pass).toBe(false);
    }
  });
});
