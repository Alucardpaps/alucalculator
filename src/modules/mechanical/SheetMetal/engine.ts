/**
 * modules/mechanical/SheetMetal/engine.ts
 * 
 * Core calculation logic for Sheet Metal bending parameters.
 * Returns the standardized EngineMetadata.
 */

import { EngineMetadata } from '@/engine/project/ProjectSchema';

export interface SheetMetalInput {
    thickness: number; // mm
    bendAngle: number; // degrees
    innerRadius: number; // mm
    kFactor: number; // derived or input
    material: string;
}

export interface SheetMetalResult {
    bendAllowance: number;
    bendDeduction: number;
    outsideSetback: number;
}

export class SheetMetalEngine {
    static readonly VERSION = '1.0.0';

    /**
     * Calculates bend parameters and returns Engine Metadata
     */
    static calculate(input: SheetMetalInput): { result: SheetMetalResult, metadata: EngineMetadata } {
        const { thickness, bendAngle, innerRadius, kFactor, material } = input;

        // Convert angle to radians for calculations
        const angleRad = bendAngle * (Math.PI / 180);

        // 1. Outside Setback (OSSB)
        const tanHalfAngle = Math.tan(angleRad / 2);
        const outsideSetback = (innerRadius + thickness) * tanHalfAngle;

        // 2. Bend Allowance (BA)
        const bendAllowance = angleRad * (innerRadius + kFactor * thickness);

        // 3. Bend Deduction (BD)
        const bendDeduction = (2 * outsideSetback) - bendAllowance;

        const result: SheetMetalResult = {
            bendAllowance: Number(bendAllowance.toFixed(3)),
            bendDeduction: Number(bendDeduction.toFixed(3)),
            outsideSetback: Number(outsideSetback.toFixed(3))
        };

        const metadata: EngineMetadata = {
            calculationId: `SM-${Date.now()}`,
            engineVersion: this.VERSION,
            moduleName: 'SheetMetal',
            timestamp: Date.now(),
            inputSnapshot: input,
            standardReference: 'DIN 6935',
            assumptions: ['Neutral axis remains constant', 'Isotropic material properties'],
            safetyFactors: { yield: 1.0 },
            validationStatus: bendAngle > 180 ? 'warning' : 'success',
            warnings: bendAngle > 180 ? ['Bend angle exceeds typical press brake limits'] : [],
            calculationHash: this._generateHash(input, result) // Mock hash for now
        };

        return { result, metadata };
    }

    private static _generateHash(input: any, result: any): string {
        // In reality, use WebCrypto or a library for SHA-256
        return `sha256-${btoa(JSON.stringify({ input, result }))}`;
    }
}
