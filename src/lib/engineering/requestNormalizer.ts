import { ExternalRequest } from './integrationInterfaceSchema';

export const normalizeRequest = (req: ExternalRequest): ExternalRequest => {
  return {
    ...req,
    payload: req.payload ?? {},
    timestamp: req.timestamp ?? Date.now(),
  };
};
