import { AuditEventBus } from './auditEventBus';
import { reconstructTrace } from './traceReconstructor';
import { buildCausalityGraph } from './causalityGraph';
import { detectLogicDrift } from './driftAnalyzer';

export interface ObservabilitySnapshot {
  trace: any;
  graph: any;
  drift: any;
}

export const runObservabilityKernel = (bus: AuditEventBus): ObservabilitySnapshot => {
  const events = bus.getAll();

  return {
    trace: reconstructTrace(events),
    graph: buildCausalityGraph(events),
    drift: detectLogicDrift(events),
  };
};
