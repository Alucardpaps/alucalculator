import { AuditEventBus } from './auditEventBus';
import { runObservabilityKernel } from './observabilityKernel';

export interface AuditSystemOutput {
  snapshot: any;
}

export const runAuditIntelligenceSystem = (bus: AuditEventBus): AuditSystemOutput => {
  const snapshot = runObservabilityKernel(bus);
  return { snapshot };
};
