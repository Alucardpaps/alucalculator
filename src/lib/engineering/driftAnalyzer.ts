import { AuditEvent } from './auditEventSchema';

export const detectLogicDrift = (events: AuditEvent[]) => {
  const decisions = events.filter(e => e.layer === 'decision');

  const variance = decisions.length
    ? decisions.reduce((sum, e, i) => sum + (e.timestamp - (decisions[i - 1]?.timestamp || e.timestamp)), 0) / decisions.length
    : 0;

  return {
    driftIndex: Math.min(1, variance / 10000),
    stability: 1 - Math.min(1, variance / 10000)
  };
};
