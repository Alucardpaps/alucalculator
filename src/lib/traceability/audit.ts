/**
 * 🏛️ ALUCALCULATOR TRACEABILITY - AUDIT
 * "The Black Box"
 */

import { EngineeringValue } from "../kernel/types";

export interface ExecutionLogEntry {
    timestamp: string;
    calculatorId: string;
    version: string;
    inputs: Record<string, number>;
    outputs: Record<string, EngineeringValue>;
    standards: ReadonlyArray<string>;
}

class AuditSystem {
    private logs: ExecutionLogEntry[] = [];

    log(entry: ExecutionLogEntry) {
        this.logs.push(entry);
        // In a real OS, this would write to a persistent append-only log
        // console.log(`[AUDIT] ${entry.calculatorId} executed at ${entry.timestamp}`);
    }

    getLogs() {
        return [...this.logs];
    }

    clear() {
        this.logs = [];
    }
}

export const auditLog = new AuditSystem();
