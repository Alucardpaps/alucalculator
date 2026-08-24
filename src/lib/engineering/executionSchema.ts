export interface ExecutionAction {
  id: string;
  type: 'compute' | 'write' | 'api_call' | 'ui_update' | 'simulation';
  payload: any;
  riskLevel: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
}

export interface ExecutionResult {
  actionId: string;
  success: boolean;
  output?: any;
  blocked?: boolean;
  reason?: string;
}
