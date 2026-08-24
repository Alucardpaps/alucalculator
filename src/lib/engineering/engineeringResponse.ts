export interface EngineeringResponse<T> {
  status: 'success' | 'warning' | 'error';
  message: string;
  data?: T;
  recommendation?: string;
  severityScore?: number;
}

/**
 * Converts raw failures into engineering-readable feedback
 */
export const createEngineeringResponse = <T>(
  status: EngineeringResponse<T>['status'],
  message: string,
  data?: T,
  context?: {
    safetyFactor?: number;
  }
): EngineeringResponse<T> => {

  if (status === 'warning' && context?.safetyFactor !== undefined) {
    return {
      status,
      message,
      data,
      severityScore: Math.max(0, 10 - context.safetyFactor),
      recommendation:
        context.safetyFactor < 1.5
          ? 'Increase structural safety factor or upgrade material grade.'
          : 'System is operational but near lower safety threshold.',
    };
  }

  if (status === 'error') {
    return {
      status,
      message,
      recommendation:
        'Review input parameters or consult engineering constraints.',
    };
  }

  return {
    status,
    message,
    data,
  };
};
