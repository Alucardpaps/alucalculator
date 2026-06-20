export interface ExternalRequest {
  id: string;
  source: 'ui' | 'api' | 'system' | 'simulation';
  payload: any;
  timestamp: number;
}

export interface ExternalResponse {
  requestId: string;
  success: boolean;
  data?: any;
  error?: string;
  executionTrace?: any;
}

export interface SystemIntegrationContext {
  kernel: any;
  constraintKernel: any;
  executionKernel: any;
  decisionEngine: any;
}
