import { AuditEvent } from './auditEventSchema';

export interface TraceNode {
  eventId: string;
  summary: string;
}

export const reconstructTrace = (events: AuditEvent[]): TraceNode[] => {
  return events.map(e => ({
    eventId: e.id,
    summary: `[${e.layer}] ${e.type}`
  }));
};
