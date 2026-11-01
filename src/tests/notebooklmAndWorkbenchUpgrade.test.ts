import { describe, it, expect } from 'vitest';
import {
  DETERMINISTIC_HEADLESS_SOLVERS,
  evaluateHeadlessSolver,
} from '@/components/os/HeadlessCalculatorWindow';
import { computeDeterministicAuditDigest } from '@/components/calculators/CalculationReport';
import {
  solverCount,
  fieldToolCount,
  academyUnitCount,
} from '@/lib/registry/calculatorRegistry';
import {
  STUDIO_ASSEMBLY_TEMPLATES,
  createLinearPartArray,
  createCircularPartArray,
  mirrorSelectedPart,
} from '@/design-studio/v2/QuickDesignStudioTemplates';
import { useDesignStore } from '@/design-studio/designStore';

describe('AluCAD OS — NotebookLM Research & CNC Workbench Upgrade Verification', () => {
  it('verifies all deterministic headless solvers produce finite IEEE 754 outputs across all presets', () => {
    const slugs = Object.keys(DETERMINISTIC_HEADLESS_SOLVERS);
    expect(slugs.length).toBeGreaterThanOrEqual(24);

    for (const slug of slugs) {
      const spec = DETERMINISTIC_HEADLESS_SOLVERS[slug];
      expect(spec.standard).toBeTruthy();
      expect(spec.formulaDisplay).toBeTruthy();
      expect(spec.inputs.length).toBeGreaterThanOrEqual(2);

      // Default inputs evaluation
      const { result: resDefault } = evaluateHeadlessSolver(slug);
      expect(Number.isFinite(resDefault.primary.value)).toBe(true);
      expect(resDefault.secondary.length).toBeGreaterThanOrEqual(1);
      for (const sec of resDefault.secondary) {
        expect(Number.isFinite(sec.value)).toBe(true);
      }
      expect(['PASS', 'WARNING', 'CRITICAL']).toContain(resDefault.status);

      // Scaled preset evaluations (75% Light, 100% Nominal, 125% Peak)
      for (const scale of [0.75, 1.0, 1.25]) {
        const custom: Record<string, number> = {};
        spec.inputs.forEach((inp, idx) => {
          custom[inp.key] = idx === 0 ? inp.defaultValue * scale : inp.defaultValue;
        });
        const { result: resScaled } = evaluateHeadlessSolver(slug, custom);
        expect(Number.isFinite(resScaled.primary.value)).toBe(true);
      }
    }
  });

  it('verifies Hooke Law and Reynolds Number exact analytical values', () => {
    const { result: hooke } = evaluateHeadlessSolver('hooke-law', { k: 50, x: 10, F_max: 800 });
    expect(hooke.primary.value).toBeCloseTo(500, 5); // F = 50 * 10 = 500 N
    expect(hooke.secondary[0].value).toBeCloseTo(2.5, 5); // U = 0.5 * 50 * 100 / 1000 = 2.5 J

    const { result: reynolds } = evaluateHeadlessSolver('reynolds-number', {
      rho: 998,
      v: 2.0,
      D_mm: 50,
      mu_mPas: 1.0,
    });
    // Re = (998 * 2.0 * 0.05) / 0.001 = 99800
    expect(reynolds.primary.value).toBeCloseTo(99800, 1);
  });

  it('verifies ISO 7200 deterministic 256-bit hex audit digest invariance and sensitivity', () => {
    const d1 = computeDeterministicAuditDigest(
      'bolt',
      { d: 12, F_A: 25000, mu: 0.12 },
      { M_A: 84.5, sigma_red: 642.1 }
    );
    const d2 = computeDeterministicAuditDigest(
      'bolt',
      { mu: 0.12, d: 12, F_A: 25000 },
      { sigma_red: 642.1, M_A: 84.5 }
    );
    const d3 = computeDeterministicAuditDigest(
      'bolt',
      { d: 12, F_A: 26000, mu: 0.12 },
      { M_A: 84.5, sigma_red: 642.1 }
    );

    expect(d1).toHaveLength(64);
    expect(d1).toBe(d2); // Key order invariant
    expect(d1).not.toBe(d3); // Value change alters digest
  });

  it('verifies canonical SSOT counts are strictly positive integers', () => {
    expect(solverCount).toBeGreaterThanOrEqual(80);
    expect(fieldToolCount).toBeGreaterThanOrEqual(25);
    expect(academyUnitCount).toBeGreaterThanOrEqual(10);
  });

  it('verifies Design Studio V2 multi-part assembly builders and pattern array cloners', () => {
    expect(STUDIO_ASSEMBLY_TEMPLATES.length).toBe(7);

    for (const tpl of STUDIO_ASSEMBLY_TEMPLATES) {
      tpl.build();
      const parts = useDesignStore.getState().parts;
      expect(parts.length).toBeGreaterThanOrEqual(1);
    }

    // Test pattern array cloners on the last loaded template
    const basePart = useDesignStore.getState().parts[0];
    expect(basePart).toBeDefined();

    const beforeCount = useDesignStore.getState().parts.length;
    createLinearPartArray(basePart, 'x', 3, 60);
    expect(useDesignStore.getState().parts.length).toBe(beforeCount + 2);

    const beforeCirc = useDesignStore.getState().parts.length;
    createCircularPartArray(basePart, 4, 80);
    expect(useDesignStore.getState().parts.length).toBe(beforeCirc + 3);

    const beforeMirror = useDesignStore.getState().parts.length;
    mirrorSelectedPart({ ...basePart, position: { x: 50, y: 10, z: -25 } }, 'x');
    const afterParts = useDesignStore.getState().parts;
    expect(afterParts.length).toBe(beforeMirror + 1);
    expect(afterParts[afterParts.length - 1].position.x).toBe(-50);
  });
});

