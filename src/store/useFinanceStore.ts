import { create } from 'zustand';
import { generateStructuredJSON } from '@/lib/gemini';

// State models for 3D-Driven Cost & Carbon Factory Engine
export interface ShouldCostModel {
    id: string;
    materialCost: number;
    manufacturingCost: number;
    overheadCost: number;
    totalCost: number;
    currency: string;
}

export interface CarbonFootprintModel {
    primaryCO2: number; // kg CO2
    energyCO2: number;  // kg CO2
    totalCO2: number;   // kg CO2
}

interface FinanceState {
    activeCostModel: ShouldCostModel | null;
    activeCarbonModel: CarbonFootprintModel | null;
    isSimulatingFactory: boolean;
}

interface FinanceActions {
    analyze3DGeometry: (geometryNodeId: string, materialDensity: number) => Promise<void>;
}

export const useFinanceStore = create<FinanceState & FinanceActions>()(
    (set, get) => ({
        activeCostModel: null,
        activeCarbonModel: null,
        isSimulatingFactory: false,

        analyze3DGeometry: async (geometryNodeId, materialDensity) => {
            set({ isSimulatingFactory: true });

            const prompt = `Act as an aPriori Cost & Carbon Factory Engine. Analyze the 3D geometry node (${geometryNodeId}) with density ${materialDensity}. Calculate 'Should-Cost' and 'Carbon Footprint' dynamically.`;
            const schema = `{ "activeCostModel": { "id": "cost-123", "materialCost": number, "manufacturingCost": number, "overheadCost": number, "totalCost": number, "currency": "USD" }, "activeCarbonModel": { "primaryCO2": number, "energyCO2": number, "totalCO2": number } }`;

            const aiResult = await generateStructuredJSON<{ activeCostModel: ShouldCostModel, activeCarbonModel: CarbonFootprintModel }>(prompt, schema);

            if (aiResult && aiResult.activeCostModel && aiResult.activeCarbonModel) {
                set({
                    isSimulatingFactory: false,
                    activeCostModel: aiResult.activeCostModel,
                    activeCarbonModel: aiResult.activeCarbonModel
                });
            } else {
                setTimeout(() => {
                    const simulatedMass = 12.5; // kg
                    const carbon = simulatedMass * 6.6;

                    set({
                        isSimulatingFactory: false,
                        activeCostModel: {
                            id: `cost-${Date.now()}`,
                            materialCost: 45.20,
                            manufacturingCost: 120.50,
                            overheadCost: 15.00,
                            totalCost: 180.70,
                            currency: 'USD'
                        },
                        activeCarbonModel: {
                            primaryCO2: carbon,
                            energyCO2: carbon * 0.2, // Rough energy equivalent
                            totalCO2: carbon * 1.2
                        }
                    });
                }, 2000);
            }
        }
    })
);
