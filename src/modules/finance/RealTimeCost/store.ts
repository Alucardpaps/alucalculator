/**
 * modules/finance/RealTimeCost/store.ts
 */

import { create } from 'zustand';
import { CostInput, CostResult, RealTimeCostEngine } from './engine';
import { EngineMetadata } from '@/engine/project/ProjectSchema';

interface CostState {
    input: CostInput;
    result: CostResult | null;
    metadata: EngineMetadata | null;

    setInput: (updates: Partial<CostInput>) => void;
}

const defaultInput: CostInput = {
    materialVolumeCm3: 500,
    materialDensityGcm3: 2.7, // Alum
    rawMaterialCostPerKg: 4.5, // $ 
    estimatedMachiningHours: 2.5,
    machineHourlyRate: 65,
    weldingLengthMeters: 0,
    weldingCostPerMeter: 12
};

export const useCostStore = create<CostState>((set, get) => ({
    input: defaultInput,
    result: null,
    metadata: null,

    setInput: (updates) => {
        const newInput = { ...get().input, ...updates };
        const { result, metadata } = RealTimeCostEngine.calculate(newInput);

        set({ input: newInput, result, metadata });
    }
}));
