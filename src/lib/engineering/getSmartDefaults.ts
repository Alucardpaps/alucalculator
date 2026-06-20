export interface EngineeringContext {
  material: 'steel' | 'aluminum' | 'titanium';
  useCase: 'structural' | 'mechanical' | 'lightweight';
}

export interface SmartDefaults {
  frictionCoefficient: number;
  safetyFactor: number;
  youngModulus: number;
}

/**
 * Deterministic engineering defaults (NO GUESSING OUTSIDE DOMAIN)
 */
export const getSmartDefaults = (
  ctx: EngineeringContext
): SmartDefaults => {
  switch (ctx.material) {

    case 'steel':
      return {
        frictionCoefficient: 0.15,
        safetyFactor: 2.5,
        youngModulus: 210e9,
      };

    case 'aluminum':
      return {
        frictionCoefficient: 0.25,
        safetyFactor: 2.8,
        youngModulus: 69e9,
      };

    case 'titanium':
      return {
        frictionCoefficient: 0.3,
        safetyFactor: 3.0,
        youngModulus: 116e9,
      };

    default:
      // HARD FAIL SAFE: never guess silently
      throw new Error('Unsupported engineering material context');
  }
};
