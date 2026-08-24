import { AuditEvent } from './auditEventSchema';

export interface CausalEdge {
  from: string;
  to: string;
  reason: string;
}

export const buildCausalityGraph = (events: AuditEvent[]): CausalEdge[] => {
  const edges: CausalEdge[] = [];

  for (let i = 1; i < events.length; i++) {
    edges.push({
      from: events[i - 1].id,
      to: events[i].id,
      reason: 'temporal-sequence'
    });
  }

  return edges;
};
