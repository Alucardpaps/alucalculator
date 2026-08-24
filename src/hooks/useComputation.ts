import { useState } from 'react';
import { useWorkspace } from '@/store/useWorkspace';
import { ExecutionResult } from '@/lib/utils/contract';

/**
 * Global Computation Hook (v1.1 - Hardened)
 * A generic engine-to-UI bridge for all modular engineering workstations.
 */
export function useComputation(type: string) {
    const { currentProjectId, setUnsavedChanges } = useWorkspace();
    const [isComputing, setIsComputing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [contract, setContract] = useState<ExecutionResult | null>(null);

    const execute = async (payload: any) => {
        setIsComputing(true);
        setError(null);
        setUnsavedChanges(true);

        try {
            // Ensure we use "temp" to bypass DB checks in dev/lite mode
            const projectId = currentProjectId || "temp";

            const response = await fetch('/api/compute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    payload,
                    projectId
                }),
            });

            // Handle HTML responses (crashes)
            const contentType = response.headers.get("content-type");
            if (contentType && !contentType.includes("application/json")) {
                const text = await response.text();
                console.error("ALUCALC_OS::NON_JSON_RESPONSE:", text.substring(0, 200));
                throw new Error("SERVER_CRITICAL_FAULT: The engine returned an invalid response.");
            }

            const result: ExecutionResult = await response.json();
            
            if (!result.success) {
                setError(result.error?.message || "Execution failed");
            }

            setContract(result);
            return result;
        } catch (err: any) {
            console.error(`ALUCALC_OS::EXECUTION_ERROR [${type}]:`, err);
            setError(err.message || "Unknown execution fault");
            return null;
        } finally {
            setIsComputing(false);
        }
    };

    return {
        contract,
        isComputing,
        error,
        execute
    };
}
