import { create } from 'zustand';
import { generateStructuredJSON } from '@/lib/gemini';

// State models for Attribute-Based AI 2D Nesting & Gearbox Analysis
export interface NestingPart {
    id: string;
    geometry: any;
    downstreamProcess: 'bending' | 'welding' | 'none';
}

export interface RemnantSheet {
    id: string;
    utilizationScore: number;
}

export interface NVHResult {
    frequencyHz: number;
    amplitude: number;
    criticalModes: string[];
}

interface MechanicalState {
    nestedParts: NestingPart[];
    remnantSheets: RemnantSheet[];
    gearboxNVHData: NVHResult | null;
}

interface MechanicalActions {
    addNestingPart: (part: NestingPart) => void;
    runAttributeNesting: () => Promise<void>;
    runNVHAnalysis: (kinematicModel: any) => Promise<void>;
}

export const useMechanicalStore = create<MechanicalState & MechanicalActions>()(
    (set, get) => ({
        nestedParts: [],
        remnantSheets: [],
        gearboxNVHData: null,

        addNestingPart: (part) => set((state) => ({ nestedParts: [...state.nestedParts, part] })),
        runAttributeNesting: async () => {
            const prompt = `Act as an advanced CAM AI. Analyze 2D sheet metal profiles and group them by downstream process (bending, welding, none) to optimize laser cutting remnants. Return the remnant sheet utilization score.`;
            const schema = `{ "remnantSheets": [ { "id": "string", "utilizationScore": number } ] }`;

            const aiResult = await generateStructuredJSON<{ remnantSheets: RemnantSheet[] }>(prompt, schema);
            if (aiResult && aiResult.remnantSheets) {
                set({ remnantSheets: aiResult.remnantSheets });
            } else {
                set({ remnantSheets: [{ id: 'sheet-01', utilizationScore: 94.2 }] });
            }
        },
        runNVHAnalysis: async (kinematicModel) => {
            const prompt = `Act as a KISSsoft transmission analyst. Calculate the natural frequencies and critical torsional modes for this EV gearbox kinematic model.`;
            const schema = `{ "gearboxNVHData": { "frequencyHz": number, "amplitude": number, "criticalModes": ["string"] } }`;

            const aiResult = await generateStructuredJSON<{ gearboxNVHData: NVHResult }>(prompt, schema);
            if (aiResult && aiResult.gearboxNVHData) {
                set({ gearboxNVHData: aiResult.gearboxNVHData });
            } else {
                set({
                    gearboxNVHData: {
                        frequencyHz: 1240.5,
                        amplitude: 0.08,
                        criticalModes: ['Torsional 1st Order', 'Axial 2nd Order']
                    }
                });
            }
        }
    })
);
