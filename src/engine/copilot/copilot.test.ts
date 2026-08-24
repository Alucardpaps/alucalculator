import { describe, it, expect } from 'vitest';
import { EngineeringCopilot } from './copilot';

describe('EngineeringCopilot', () => {
  const copilot = new EngineeringCopilot();

  it('should parse simple aluminum query and make smart assumptions', () => {
    const query = "Calculate a 2m aluminum beam with 500N force";
    const result = copilot.parseAndAssume(query);

    expect(result.materialType).toBe('aluminum');
    expect(result.length).toBe(2000); // 2m to mm
    expect(result.forceApplied).toBe(500);
    expect(result.alloyOrGrade).toBe('6063-T6'); // Default assumption
    expect(result.assumptionsMade.length).toBeGreaterThan(0);
  });

  it('should handle steel grade S355 and kN units', () => {
    const query = "S355 steel, 10kn load, 150cm length";
    const result = copilot.parseAndAssume(query);

    expect(result.materialType).toBe('steel');
    expect(result.alloyOrGrade).toBe('S355');
    expect(result.forceApplied).toBe(10000); // 10kN to N
    expect(result.length).toBe(1500); // 150cm to mm
  });

  it('should fallback to defaults when data is missing', () => {
    const query = "Just some beam";
    const result = copilot.parseAndAssume(query);

    expect(result.materialType).toBe('aluminum'); // default
    expect(result.length).toBe(1000); // default 1m
    expect(result.forceApplied).toBe(1000); // default 1kN
    expect(result.assumptionsMade).toContain('Material type not specified. Assumed Aluminum as default.');
  });
});
