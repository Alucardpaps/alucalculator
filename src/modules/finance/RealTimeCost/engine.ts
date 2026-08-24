/**
 * modules/finance/RealTimeCost/engine.ts
 * 
 * Interactive cost estimation engine running off geometric properties and standard rates.
 */

import { EngineMetadata } from '@/engine/project/ProjectSchema';

export interface CostInput {
    materialVolumeCm3: number;
    materialDensityGcm3: number;
    rawMaterialCostPerKg: number;
    estimatedMachiningHours: number;
    machineHourlyRate: number;
    weldingLengthMeters: number;
    weldingCostPerMeter: number;
}

export interface CostResult {
    materialCost: number;
    machiningCost: number;
    weldingCost: number;
    totalCost: number;
    weightKg: number;
}

export class RealTimeCostEngine {
    static readonly VERSION = '1.0.0';

    static calculate(input: CostInput): { result: CostResult, metadata: EngineMetadata } {
        // 1. Material
        const weightKg = (input.materialVolumeCm3 * input.materialDensityGcm3) / 1000;
        const materialCost = weightKg * input.rawMaterialCostPerKg;

        // 2. Machining
        const machiningCost = input.estimatedMachiningHours * input.machineHourlyRate;

        // 3. Welding
        const weldingCost = input.weldingLengthMeters * input.weldingCostPerMeter;

        // Total
        const totalCost = materialCost + machiningCost + weldingCost;

        const result: CostResult = {
            materialCost: Number(materialCost.toFixed(2)),
            machiningCost: Number(machiningCost.toFixed(2)),
            weldingCost: Number(weldingCost.toFixed(2)),
            totalCost: Number(totalCost.toFixed(2)),
            weightKg: Number(weightKg.toFixed(3))
        };

        const metadata: EngineMetadata = {
            calculationId: `COST-${Date.now()}`,
            engineVersion: this.VERSION,
            moduleName: 'RealTimeCost',
            timestamp: Date.now(),
            inputSnapshot: input as any,
            validationStatus: 'success',
            calculationHash: btoa(JSON.stringify({ i: input, r: result }))
        };

        return { result, metadata };
    }
}
