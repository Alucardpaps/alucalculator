export interface SimulationResult {
  safe: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  message: string;
}

/**
 * Pre-calculation safety simulation layer
 */
export const simulateSafety = (
  inputs: Record<string, number>
): SimulationResult => {
  const stress = inputs.force / (inputs.area || 1);

  if (stress > 250) {
    return {
      safe: false,
      riskLevel: 'high',
      message: 'Critical stress threshold exceeded. Structural failure likely.',
    };
  }

  if (stress > 150) {
    return {
      safe: true,
      riskLevel: 'medium',
      message: 'Approaching material yield limit. Reinforcement recommended.',
    };
  }

  return {
    safe: true,
    riskLevel: 'low',
    message: 'System within safe operational limits.',
  };
};
