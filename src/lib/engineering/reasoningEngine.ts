export interface ReasoningOutput {
  insight: string;
  confidence: number;
  factors: string[];
}

/**
 * Provides deterministic engineering reasoning based on inputs
 */
export const generateEngineeringInsight = (
  inputs: Record<string, number>
): ReasoningOutput => {
  const stress = inputs.force / (inputs.area || 1);
  const safetyFactor = inputs.safetyFactor || 1;

  const factors: string[] = [];

  if (stress > 200) factors.push('high-stress-zone');
  if (safetyFactor < 2) factors.push('low-safety-factor');

  let insight = 'System stable under current load conditions.';
  let confidence = 0.9;

  if (stress > 200 && safetyFactor < 2) {
    insight =
      'High-risk structural condition detected. Immediate redesign recommended.';
    confidence = 0.7;
  } else if (stress > 150) {
    insight =
      'Approaching material stress threshold. Monitor load distribution.';
    confidence = 0.8;
  }

  return {
    insight,
    confidence,
    factors,
  };
};
