/**
 * modules/mechanical/FailurePrediction/engine.ts
 * 
 * Heuristics engine to determine engineering risk factors from abstracted geometry inputs.
 */

import { EngineMetadata } from '@/engine/project/ProjectSchema';

export interface FailureInput {
    geometryType: 'plate' | 'shaft' | 'bracket';
    hasSharpInternalCorners: boolean;
    hasSuddenCrossSecChange: boolean;
    appliedLoadType: 'static' | 'dynamic' | 'impact';
    yieldStrengthMpa: number;
    estimatedMaxStressMpa: number;
}

export interface FailureResult {
    stressConcentrationFactor: number; // Kt
    fatigueRisk: 'low' | 'medium' | 'high';
    safetyFactor: number; // FoS
    suggestedFilletRadius: number | null; // mm
    analysisLog: string[];
}

export class FailurePredictionEngine {
    static readonly VERSION = '1.0.0';

    static analyze(input: FailureInput): { result: FailureResult, metadata: EngineMetadata } {
        const log: string[] = [];
        let kt = 1.0;
        let fatigueRisk: 'low' | 'medium' | 'high' = 'low';
        let sf = input.yieldStrengthMpa / Math.max(0.1, input.estimatedMaxStressMpa);
        let suggestedFillet: number | null = null;

        // 1. Stress Concentration (sharp corners & geometry shifts)
        if (input.hasSharpInternalCorners) {
            kt += 1.8;
            log.push('CRITICAL: Sharp internal corners detected. Severe stress concentration multiplier applied.');
            suggestedFillet = Math.max(3.0, input.estimatedMaxStressMpa / 50); // Heuristic
        }

        if (input.hasSuddenCrossSecChange) {
            kt += 0.5;
            log.push('WARNING: Sudden cross-section change noted. Adds to local stress.');
        }

        // Apply Kt
        const peakStress = input.estimatedMaxStressMpa * kt;
        sf = input.yieldStrengthMpa / peakStress;

        // 2. Fatigue Risk Evaluation
        if (input.appliedLoadType !== 'static') {
            if (kt > 2.0) {
                fatigueRisk = 'high';
                log.push('CRITICAL FATIGUE RISK: Dynamic/Impact loads combined with high stress concentrations.');
            } else if (input.appliedLoadType === 'impact') {
                fatigueRisk = 'high';
            } else {
                fatigueRisk = 'medium';
            }
        }

        const result: FailureResult = {
            stressConcentrationFactor: Number(kt.toFixed(2)),
            fatigueRisk,
            safetyFactor: Number(sf.toFixed(2)),
            suggestedFilletRadius: suggestedFillet ? Number(suggestedFillet.toFixed(1)) : null,
            analysisLog: log
        };

        const isSafe = sf >= 1.5 && fatigueRisk !== 'high';

        const metadata: EngineMetadata = {
            calculationId: `FAIL-${Date.now()}`,
            engineVersion: this.VERSION,
            moduleName: 'FailurePrediction',
            timestamp: Date.now(),
            inputSnapshot: input as any,
            validationStatus: isSafe ? 'success' : 'error',
            warnings: log,
            calculationHash: btoa(`FPE-${kt}-${sf}-${fatigueRisk}`)
        };

        return { result, metadata };
    }
}
