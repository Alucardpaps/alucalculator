/**
 * AluCalculator Engineering Kernel — DIN/ISO Test Suite
 * 
 * Verification tests against known-good values from standards.
 * This ensures kernel produces correct, auditable results.
 */

import {
    involuteFunction,
    inverseInvolute,
    calculateGearGeometry,
    validateGearParameters,
    DEFAULT_GEAR_PARAMS,
} from '../math/involute';

import {
    analyzeGearPair,
    createStandardGearPair,
    minTeethNoUndercut,
} from '../math/gear.geometry';

// ============================================
// TEST TYPES
// ============================================

export interface TestCase {
    id: string;
    name: string;
    standard: string;
    input: Record<string, unknown>;
    expected: Record<string, unknown>;
    tolerance?: number;
}

export interface TestResult {
    id: string;
    name: string;
    passed: boolean;
    expected: unknown;
    actual: unknown;
    deviation?: number;
    message?: string;
}

export interface TestSuiteResult {
    suiteName: string;
    passed: number;
    failed: number;
    total: number;
    results: TestResult[];
    timestamp: Date;
}

// ============================================
// INVOLUTE FUNCTION TESTS (DIN 3960)
// ============================================

export const involuteTests: TestCase[] = [
    {
        id: 'INV-001',
        name: 'Involute at 20° pressure angle',
        standard: 'DIN 3960',
        input: { angleDeg: 20 },
        expected: { invAlpha: 0.014904 },
        tolerance: 0.000001,
    },
    {
        id: 'INV-002',
        name: 'Involute at 14.5° pressure angle',
        standard: 'DIN 3960',
        input: { angleDeg: 14.5 },
        expected: { invAlpha: 0.005467 },
        tolerance: 0.000001,
    },
    {
        id: 'INV-003',
        name: 'Involute at 25° pressure angle',
        standard: 'DIN 3960',
        input: { angleDeg: 25 },
        expected: { invAlpha: 0.029521 },
        tolerance: 0.000001,
    },
    {
        id: 'INV-004',
        name: 'Inverse involute recovery',
        standard: 'Mathematical',
        input: { invAlpha: 0.014904 },
        expected: { angleDeg: 20 },
        tolerance: 0.01,
    },
];

export function runInvoluteTests(): TestSuiteResult {
    const results: TestResult[] = [];

    for (const test of involuteTests) {
        if ('angleDeg' in test.input) {
            const angleRad = (test.input.angleDeg as number) * Math.PI / 180;
            const actual = involuteFunction(angleRad);
            const expected = test.expected.invAlpha as number;
            const deviation = Math.abs(actual - expected);
            const passed = deviation <= (test.tolerance || 0.0001);

            results.push({
                id: test.id,
                name: test.name,
                passed,
                expected,
                actual,
                deviation,
                message: passed ? 'OK' : `Deviation ${deviation} exceeds tolerance ${test.tolerance}`,
            });
        } else if ('invAlpha' in test.input) {
            const actual = inverseInvolute(test.input.invAlpha as number) * 180 / Math.PI;
            const expected = test.expected.angleDeg as number;
            const deviation = Math.abs(actual - expected);
            const passed = deviation <= (test.tolerance || 0.01);

            results.push({
                id: test.id,
                name: test.name,
                passed,
                expected,
                actual,
                deviation,
                message: passed ? 'OK' : `Deviation ${deviation} exceeds tolerance ${test.tolerance}`,
            });
        }
    }

    return {
        suiteName: 'Involute Function Tests',
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length,
        total: results.length,
        results,
        timestamp: new Date(),
    };
}

// ============================================
// GEAR GEOMETRY TESTS (ISO 21771)
// ============================================

export const gearGeometryTests: TestCase[] = [
    {
        id: 'GEO-001',
        name: 'Standard gear m=2, z=20, α=20°',
        standard: 'ISO 21771',
        input: { module: 2, teeth: 20, pressureAngle: 20, profileShift: 0 },
        expected: {
            pitchDiameter: 40,
            baseDiameter: 37.588,
            tipDiameter: 44,
            rootDiameter: 35,
        },
        tolerance: 0.01,
    },
    {
        id: 'GEO-002',
        name: 'Large gear m=3, z=50, α=20°',
        standard: 'ISO 21771',
        input: { module: 3, teeth: 50, pressureAngle: 20, profileShift: 0 },
        expected: {
            pitchDiameter: 150,
            baseDiameter: 140.954,
            tipDiameter: 156,
            rootDiameter: 142.5,
        },
        tolerance: 0.01,
    },
    {
        id: 'GEO-003',
        name: 'Profile shifted gear x=0.3',
        standard: 'DIN 3960',
        input: { module: 2, teeth: 15, pressureAngle: 20, profileShift: 0.3 },
        expected: {
            pitchDiameter: 30,
            tipDiameter: 34 + 2 * 2 * 0.3, // d + 2m(1+x)
        },
        tolerance: 0.01,
    },
];

export function runGearGeometryTests(): TestSuiteResult {
    const results: TestResult[] = [];

    for (const test of gearGeometryTests) {
        const params = {
            ...DEFAULT_GEAR_PARAMS,
            module: test.input.module as number,
            teethCount: test.input.teeth as number,
            pressureAngle: test.input.pressureAngle as number,
            profileShift: test.input.profileShift as number,
        };

        const geometry = calculateGearGeometry(params);
        const tolerance = test.tolerance || 0.01;

        // Test pitch diameter
        if ('pitchDiameter' in test.expected) {
            const expected = test.expected.pitchDiameter as number;
            const actual = geometry.pitchRadius * 2;
            const deviation = Math.abs(actual - expected);
            results.push({
                id: `${test.id}-pitch`,
                name: `${test.name} - Pitch Diameter`,
                passed: deviation <= tolerance,
                expected,
                actual,
                deviation,
            });
        }

        // Test base diameter
        if ('baseDiameter' in test.expected) {
            const expected = test.expected.baseDiameter as number;
            const actual = geometry.baseRadius * 2;
            const deviation = Math.abs(actual - expected);
            results.push({
                id: `${test.id}-base`,
                name: `${test.name} - Base Diameter`,
                passed: deviation <= tolerance,
                expected,
                actual,
                deviation,
            });
        }

        // Test tip diameter
        if ('tipDiameter' in test.expected) {
            const expected = test.expected.tipDiameter as number;
            const actual = geometry.addendumRadius * 2;
            const deviation = Math.abs(actual - expected);
            results.push({
                id: `${test.id}-tip`,
                name: `${test.name} - Tip Diameter`,
                passed: deviation <= tolerance,
                expected,
                actual,
                deviation,
            });
        }

        // Test root diameter
        if ('rootDiameter' in test.expected) {
            const expected = test.expected.rootDiameter as number;
            const actual = geometry.dedendumRadius * 2;
            const deviation = Math.abs(actual - expected);
            results.push({
                id: `${test.id}-root`,
                name: `${test.name} - Root Diameter`,
                passed: deviation <= tolerance,
                expected,
                actual,
                deviation,
            });
        }
    }

    return {
        suiteName: 'Gear Geometry Tests',
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length,
        total: results.length,
        results,
        timestamp: new Date(),
    };
}

// ============================================
// UNDERCUT DETECTION TESTS (DIN 3960)
// ============================================

export const undercutTests: TestCase[] = [
    {
        id: 'UND-001',
        name: 'z=12 at α=20° should undercut',
        standard: 'DIN 3960',
        input: { teeth: 12, pressureAngle: 20, profileShift: 0 },
        expected: { undercutRisk: true },
    },
    {
        id: 'UND-002',
        name: 'z=17 at α=20° borderline',
        standard: 'DIN 3960',
        input: { teeth: 17, pressureAngle: 20, profileShift: 0 },
        expected: { undercutRisk: false },
    },
    {
        id: 'UND-003',
        name: 'z=25 at α=20° safe',
        standard: 'DIN 3960',
        input: { teeth: 25, pressureAngle: 20, profileShift: 0 },
        expected: { undercutRisk: false },
    },
    {
        id: 'UND-004',
        name: 'z=12 with x=0.4 should be safe',
        standard: 'DIN 3960',
        input: { teeth: 12, pressureAngle: 20, profileShift: 0.4 },
        expected: { undercutRisk: false },
    },
];

export function runUndercutTests(): TestSuiteResult {
    const results: TestResult[] = [];

    for (const test of undercutTests) {
        const params = {
            ...DEFAULT_GEAR_PARAMS,
            teethCount: test.input.teeth as number,
            pressureAngle: test.input.pressureAngle as number,
            profileShift: test.input.profileShift as number,
        };

        const geometry = calculateGearGeometry(params);
        const expected = test.expected.undercutRisk;
        const actual = geometry.undercutRisk;

        results.push({
            id: test.id,
            name: test.name,
            passed: expected === actual,
            expected,
            actual,
            message: expected === actual ? 'OK' : `Expected ${expected}, got ${actual}`,
        });
    }

    return {
        suiteName: 'Undercut Detection Tests',
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length,
        total: results.length,
        results,
        timestamp: new Date(),
    };
}

// ============================================
// GEAR MESH TESTS (ISO 21771)
// ============================================

export const meshTests: TestCase[] = [
    {
        id: 'MESH-001',
        name: 'Standard mesh m=2, z1=18, z2=54',
        standard: 'ISO 21771',
        input: { module: 2, pinion: 18, gear: 54 },
        expected: {
            centerDistance: 72,
            contactRatio: 1.6, // Approximate
        },
        tolerance: 0.1,
    },
];

export function runMeshTests(): TestSuiteResult {
    const results: TestResult[] = [];

    for (const test of meshTests) {
        const pair = createStandardGearPair(
            test.input.module as number,
            test.input.pinion as number,
            test.input.gear as number,
            20
        );

        const mesh = analyzeGearPair(pair);
        const tolerance = test.tolerance || 0.1;

        if ('centerDistance' in test.expected) {
            const expected = test.expected.centerDistance as number;
            const actual = mesh.standardCenterDistance;
            const deviation = Math.abs(actual - expected);
            results.push({
                id: `${test.id}-cd`,
                name: `${test.name} - Center Distance`,
                passed: deviation <= tolerance,
                expected,
                actual,
                deviation,
            });
        }

        if ('contactRatio' in test.expected) {
            const expected = test.expected.contactRatio as number;
            const actual = mesh.contactRatio;
            const deviation = Math.abs(actual - expected);
            results.push({
                id: `${test.id}-cr`,
                name: `${test.name} - Contact Ratio`,
                passed: deviation <= tolerance * 0.5, // Tighter tolerance for contact ratio
                expected,
                actual,
                deviation,
            });
        }
    }

    return {
        suiteName: 'Gear Mesh Tests',
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length,
        total: results.length,
        results,
        timestamp: new Date(),
    };
}

// ============================================
// RUN ALL TESTS
// ============================================

export function runAllTests(): TestSuiteResult[] {
    return [
        runInvoluteTests(),
        runGearGeometryTests(),
        runUndercutTests(),
        runMeshTests(),
    ];
}

export function printTestResults(suites: TestSuiteResult[]): void {
    console.log('\n========================================');
    console.log('ALUCALCULATOR KERNEL TEST RESULTS');
    console.log('========================================\n');

    let totalPassed = 0;
    let totalFailed = 0;

    for (const suite of suites) {
        console.log(`📋 ${suite.suiteName}`);
        console.log(`   ✅ Passed: ${suite.passed}/${suite.total}`);
        if (suite.failed > 0) {
            console.log(`   ❌ Failed: ${suite.failed}`);
            suite.results.filter(r => !r.passed).forEach(r => {
                console.log(`      - ${r.name}: expected ${r.expected}, got ${r.actual}`);
            });
        }
        console.log('');
        totalPassed += suite.passed;
        totalFailed += suite.failed;
    }

    console.log('========================================');
    console.log(`TOTAL: ${totalPassed}/${totalPassed + totalFailed} tests passed`);
    console.log('========================================\n');
}
