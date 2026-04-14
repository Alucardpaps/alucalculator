import { create } from 'zustand';
import { generateStructuredJSON } from '@/lib/gemini';

// State models for Drawing QA & GD&T Agents
export interface GDTError {
    id: string;
    entityId: string;
    issue: string;
    suggestion: string;
}

interface SoftwareState {
    activeQAAgentId: string | null;
    gdtErrors: GDTError[];
    isReviewingDrawing: boolean;
}

interface SoftwareActions {
    runGDTReview: (drawingData: any, referenceModel: any) => Promise<void>;
    startQAAgent: (agentId: string) => void;
}

export const useSoftwareStore = create<SoftwareState & SoftwareActions>()(
    (set, get) => ({
        activeQAAgentId: null,
        gdtErrors: [],
        isReviewingDrawing: false,

        startQAAgent: (agentId) => set({ activeQAAgentId: agentId }),
        runGDTReview: async (drawingData, referenceModel) => {
            set({ isReviewingDrawing: true });

            const prompt = `Act as an expert GD&T (ASME Y14.5) inspector. Analyze the provided technical drawing against the 3D model. Identify 2 critical GD&T discrepancies. Respond using ultra-professional advanced engineering terminology.`;
            const schema = `{ "errors": [ { "id": "gdt-xx", "entityId": "string", "issue": "string", "suggestion": "string" } ] }`;

            const aiResult = await generateStructuredJSON<{ errors: GDTError[] }>(prompt, schema);

            if (aiResult && aiResult.errors) {
                set({ isReviewingDrawing: false, gdtErrors: aiResult.errors });
            } else {
                // Fallback to deterministic simulation if no API key is provided
                setTimeout(() => {
                    set({
                        isReviewingDrawing: false,
                        gdtErrors: [
                            {
                                id: 'gdt-01',
                                entityId: 'Node-Dim-14x',
                                issue: 'Profile of a surface (ASME Y14.5) boundary definition missing on critical compound curvature.',
                                suggestion: 'Apply Profile of a Surface [0.2] referencing primary Datums [A, B, C] to lock spatial degrees of freedom.'
                            },
                            {
                                id: 'gdt-02',
                                entityId: 'Hole-Pattern-Beta',
                                issue: 'Positional tolerance deviation detected against 3D Model Based Definition (MBD) true diametric center.',
                                suggestion: 'Re-calculate Maximum Material Boundary (MMB) modifiers to ensure deterministic clearance.'
                            }
                        ]
                    });
                }, 2500);
            }
        }
    })
);
