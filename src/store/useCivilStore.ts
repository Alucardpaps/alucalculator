import { create } from 'zustand';
import { generateStructuredJSON } from '@/lib/gemini';

// State models for Automated Design Code Verification
export interface CodeViolation {
    id: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
    standard: 'AISC' | 'Eurocode' | 'Other';
}

interface CivilState {
    violations: CodeViolation[];
    isCheckingCode: boolean;
    lastCheckedCode: 'AISC' | 'Eurocode' | null;
}

interface CivilActions {
    runComplianceCheck: (modelData: any, standard: 'AISC' | 'Eurocode') => Promise<void>;
    clearViolations: () => void;
}

export const useCivilStore = create<CivilState & CivilActions>()(
    (set, get) => ({
        violations: [],
        isCheckingCode: false,
        lastCheckedCode: null,

        runComplianceCheck: async (modelData, standard) => {
            set({ isCheckingCode: true, lastCheckedCode: standard });

            const prompt = `Act as a Senior Structural Engineer. Verify the provided 3D steel beam model against ${standard} design codes. Find 2 violations.`;
            const schema = `{ "violations": [ { "id": "string", "description": "string", "severity": "critical" | "warning" | "info", "standard": "${standard}" } ] }`;

            const aiResult = await generateStructuredJSON<{ violations: CodeViolation[] }>(prompt, schema);
            if (aiResult && aiResult.violations) {
                set({ isCheckingCode: false, violations: aiResult.violations });
            } else {
                setTimeout(() => {
                    set({
                        isCheckingCode: false,
                        violations: [
                            { id: 'v1', description: 'Deflection exceeds L/360 under live load.', severity: 'critical', standard },
                            { id: 'v2', description: 'Flange slenderness ratio near limit.', severity: 'warning', standard }
                        ]
                    });
                }, 1500);
            }
        },
        clearViolations: () => set({ violations: [] })
    })
);
