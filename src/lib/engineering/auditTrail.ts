import { CalculationTrace } from './calculationReplay';

export interface AuditEntry {
  timestamp: number;
  traceId: string;
  hash: string;
  verified: boolean;
}

/**
 * Engineering audit ledger (trace integrity layer)
 */
export const createAuditEntry = (
  trace: CalculationTrace
): AuditEntry => {
  const hash = generateHash(trace);

  return {
    timestamp: Date.now(),
    traceId: trace.id,
    hash,
    verified: true,
  };
};

/**
 * Deterministic hash for trace integrity validation
 */
const generateHash = (trace: CalculationTrace): string => {
  const raw = JSON.stringify(trace);

  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }

  return `ENG-${Math.abs(hash)}`;
};
