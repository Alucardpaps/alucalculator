/**
 * 🏛️ ALUCALCULATOR TRACEABILITY - REPORT
 * "The Paperwork"
 */

import { auditLog } from './audit';

export interface EngineeringReport {
    generatedAt: string;
    summary: string;
    steps: {
        calculator: string;
        inputs: Record<string, any>; // Simplified for display
        outputs: Record<string, string>; // Formatted strings
        standards: string[];
    }[];
}

export class ReportGenerator {
    static generateFullTrace(): EngineeringReport {
        const logs = auditLog.getLogs();

        return {
            generatedAt: new Date().toISOString(),
            summary: `Trace of ${logs.length} execution steps.`,
            steps: logs.map(log => ({
                calculator: `${log.calculatorId} (v${log.version})`,
                inputs: log.inputs,
                outputs: Object.fromEntries(
                    Object.entries(log.outputs).map(([k, v]) => [k, `${v.value.toFixed(4)} ${v.unit}`])
                ),
                standards: [...log.standards]
            }))
        };
    }
}
