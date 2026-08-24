import { ExternalRequest } from './integrationInterfaceSchema';

export const routeRequest = (req: ExternalRequest): 'decision' | 'execution' | 'simulation' | 'invalid' => {
  if (!req.payload) return 'invalid';

  if (req.payload.type === 'decision') return 'decision';
  if (req.payload.type === 'execute') return 'execution';
  if (req.payload.type === 'simulate') return 'simulation';

  return 'invalid';
};
