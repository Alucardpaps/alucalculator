export interface AuditEvent {
  id: string;
  timestamp: number;
  layer: 'decision' | 'execution' | 'constraint' | 'reward' | 'objective' | 'integration';
  type: string;
  payload: any;
}
