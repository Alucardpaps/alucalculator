import { AuditEvent } from './auditEventSchema';

export class AuditEventBus {
  private events: AuditEvent[] = [];

  emit(event: AuditEvent) {
    this.events.push(event);
  }

  query(filter?: Partial<AuditEvent>) {
    return this.events.filter(e =>
      Object.entries(filter || {}).every(([k, v]) => (e as any)[k] === v)
    );
  }

  getAll() {
    return this.events;
  }
}
