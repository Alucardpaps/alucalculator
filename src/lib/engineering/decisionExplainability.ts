import { AuditEvent } from './auditEventSchema';

export const explainDecision = (events: AuditEvent[], decisionId: string) => {
  const related = events.filter(e => e.type.includes(decisionId));

  return {
    decisionId,
    factors: related.map(r => r.payload),
    confidenceTrail: related.map(r => r.timestamp)
  };
};
