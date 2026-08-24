/**
 * ENGINEERING ERROR INTELLIGENCE ENGINE
 * GLOBAL LOGIC LAYER - PHASE 3B
 */

export interface EngineeringValidationResult {
  status: 'success' | 'warning' | 'critical';
  message: string;
  utilizationRatio: number; // [%]
  actionableAdvice?: string;
}

/**
 * Evaluates the structural integrity of a mechanical joint based on 
 * applied load vs material capacity.
 * 
 * @param appliedLoad The calculated load (e.g., Preload force)
 * @param capacity The material limit (e.g., Yield strength or Proof load)
 */
export function validateStructuralIntegrity(
  appliedLoad: number, 
  capacity: number
): EngineeringValidationResult {
  if (capacity <= 0) {
    return {
      status: 'critical',
      message: 'Invalid capacity value detected.',
      utilizationRatio: 0,
      actionableAdvice: 'Check material parameters and units.'
    };
  }

  const utilizationRatio = (appliedLoad / capacity) * 100;

  if (utilizationRatio >= 100) {
    return {
      status: 'critical',
      message: `MECHANICAL FAILURE: Load (${appliedLoad.toFixed(1)}) exceeds capacity (${capacity.toFixed(1)}).`,
      utilizationRatio,
      actionableAdvice: 'CRITICAL: Increase component size, use a higher material grade, or reduce the applied load immediately.'
    };
  }

  if (utilizationRatio >= 90) {
    return {
      status: 'warning',
      message: 'DANGER: Approaching material yield limit.',
      utilizationRatio,
      actionableAdvice: 'High risk detected. Recommended maximum utilization for static loads is 90%.'
    };
  }

  if (utilizationRatio >= 75) {
    return {
      status: 'warning',
      message: 'Caution: Moderate stress levels.',
      utilizationRatio,
      actionableAdvice: 'Ensure safety factors are verified for dynamic loading conditions.'
    };
  }

  return {
    status: 'success',
    message: 'Safe Operating Range',
    utilizationRatio,
    actionableAdvice: 'The assembly is structurally sound for the specified static load.'
  };
}
