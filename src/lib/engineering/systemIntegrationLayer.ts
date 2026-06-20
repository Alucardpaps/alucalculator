import { processExternalRequest } from './systemIntegrationBridge';
import { SystemIntegrationContext, ExternalRequest } from './integrationInterfaceSchema';

export interface IntegrationOutput {
  responses: any[];
}

export const runSystemIntegrationLayer = (
  requests: ExternalRequest[],
  ctx: SystemIntegrationContext
): IntegrationOutput => {

  const responses = requests.map((req) =>
    processExternalRequest(req, ctx)
  );

  return { responses };
};
