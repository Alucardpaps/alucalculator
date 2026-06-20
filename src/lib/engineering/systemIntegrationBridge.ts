import { ExternalRequest, ExternalResponse, SystemIntegrationContext } from './integrationInterfaceSchema';
import { normalizeRequest } from './requestNormalizer';
import { routeRequest } from './systemRouter';

export const processExternalRequest = (
  request: ExternalRequest,
  ctx: SystemIntegrationContext
): ExternalResponse => {

  const normalized = normalizeRequest(request);
  const route = routeRequest(normalized);

  try {
    switch (route) {
      case 'decision': {
        const decision = ctx.decisionEngine(normalized.payload);
        return { requestId: request.id, success: true, data: decision };
      }

      case 'execution': {
        const execution = ctx.executionKernel(normalized.payload);
        return { requestId: request.id, success: true, data: execution };
      }

      case 'simulation': {
        const sim = ctx.kernel.simulate?.(normalized.payload);
        return { requestId: request.id, success: true, data: sim };
      }

      default:
        return {
          requestId: request.id,
          success: false,
          error: 'INVALID_REQUEST_TYPE'
        };
    }
  } catch (err: any) {
    return {
      requestId: request.id,
      success: false,
      error: err.message
    };
  }
};
