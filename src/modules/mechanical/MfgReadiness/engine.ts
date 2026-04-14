/**
 * modules/mechanical/MfgReadiness/engine.ts
 * 
 * Analyzes geometry against manufacturing constraints (CNC, Bending, 3D Printing).
 * Returns a score (0-100) and actionable warnings in the standard Engine Metadata format.
 */

import { EngineMetadata } from '@/engine/project/ProjectSchema';

export interface MfgGeometryInput {
    entityCount: number;
    minInnerRadius: number;
    hasUndercuts: boolean;
    hasTightPockets: boolean;
    wallThicknessMin: number;
    processTarget: 'cnc' | '3d-print' | 'sheet-metal';
}

export interface MfgResult {
    score: number;
    breakdown: {
        machinability: number;
        accessibility: number;
        structural: number;
    };
    criticalWarnings: string[];
    suggestions: string[];
}

export class MfgReadinessEngine {
    static readonly VERSION = '1.0.0';

    static analyze(input: MfgGeometryInput): { result: MfgResult, metadata: EngineMetadata } {
        let score = 100;
        const warnings: string[] = [];
        const suggestions: string[] = [];

        const breakdown = { machinability: 100, accessibility: 100, structural: 100 };

        // --- CNC Specific Checks ---
        if (input.processTarget === 'cnc') {
            if (input.minInnerRadius < 3.0) {
                breakdown.machinability -= 20;
                score -= 20;
                warnings.push("Inner radius < 3mm is difficult/expensive for standard endmills.");
                suggestions.push("Increase inner fillets to at least 3mm (preferably > R5) for faster machining.");
            }
            if (input.hasUndercuts) {
                breakdown.accessibility -= 30;
                score -= 30;
                warnings.push("Undercuts detected. Requires 5-axis CNC or specialized tooling.");
                suggestions.push("Redesign to remove undercuts if possible, or split into two parts.");
            }
            if (input.hasTightPockets) {
                breakdown.machinability -= 10;
                score -= 10;
                warnings.push("Deep, tight pockets increase tool deflection limit risk.");
            }
        }

        // --- 3D Printing Specific ---
        if (input.processTarget === '3d-print') {
            if (input.wallThicknessMin < 1.2) {
                breakdown.structural -= 25;
                score -= 25;
                warnings.push("Wall thickness < 1.2mm may cause FDM printing failures or fragililty.");
                suggestions.push("Thicken critical walls to at least 1.5mm.");
            }
            if (input.hasUndercuts) { // Interpreted as overhangs here
                breakdown.accessibility -= 15;
                score -= 15;
                warnings.push("Overhangs detected. Will require support material.");
                suggestions.push("Chamfer overhangs at 45 degrees to avoid supports.");
            }
        }

        // Clamp score
        score = Math.max(0, Math.min(100, score));

        const result: MfgResult = {
            score,
            breakdown,
            criticalWarnings: warnings,
            suggestions
        };

        const metadata: EngineMetadata = {
            calculationId: `MFG-${Date.now()}`,
            engineVersion: this.VERSION,
            moduleName: 'MfgReadiness',
            timestamp: Date.now(),
            inputSnapshot: input as any,
            validationStatus: score >= 80 ? 'success' : (score >= 50 ? 'warning' : 'error'),
            warnings: warnings, // Standard metadata propagation
            calculationHash: btoa(JSON.stringify({ i: input, s: score }))
        };

        return { result, metadata };
    }
}
