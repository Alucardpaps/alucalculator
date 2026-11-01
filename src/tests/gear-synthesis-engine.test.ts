import { describe, it, expect } from 'vitest';
import {
    computeTipShorteningData,
    matchCenterDistanceForGearPair,
    searchBestGearsForCenterDistance,
    synthesizeGearAutonomous,
} from '@/engines/math/gearSynthesisEngine';
import { calculateInvoluteGearSpecs } from '@/engines/math/gear-involute-factory';

describe('Gear Synthesis & Tip Shortening Engine (DIN 3960 / ISO 21771 / ISO 6336)', () => {
    describe('Kafa Kısaltma (+/- k) according to DIN 3960 and Yavuzlar Dişli', () => {
        it('calculates zero tip shortening for standard unshifted gear pairs at reference center distance', () => {
            const data = computeTipShorteningData({
                mn: 3,
                z1: 20,
                z2: 40,
                alphaDeg: 20,
                betaDeg: 0,
                x1: 0,
                x2: 0,
            });

            expect(data.k_din).toBeCloseTo(0, 4);
            expect(data.effectiveK).toBeCloseTo(0, 4);
            expect(data.k_mm).toBeCloseTo(0, 4);
            // da1 = d1 + 2 * mn = 3 * 20 + 6 = 66
            expect(data.da1).toBeCloseTo(66, 3);
            // da2 = d2 + 2 * mn = 3 * 40 + 6 = 126
            expect(data.da2).toBeCloseTo(126, 3);
            expect(data.isCrestSharp1).toBe(false);
            expect(data.isCrestSharp2).toBe(false);
        });

        it('computes DIN 3960 theoretical tip shortening k = (x1 + x2) - y when profile shift is applied', () => {
            const data = computeTipShorteningData({
                mn: 3,
                z1: 18,
                z2: 36,
                alphaDeg: 20,
                betaDeg: 0,
                x1: 0.4,
                x2: 0.2,
                kFactorMode: 'auto',
            });

            // sumX = 0.6 > 0
            expect(data.sumX).toBeCloseTo(0.6, 5);
            // Operating center distance modifier y should be positive
            expect(data.y).toBeGreaterThan(0);
            // k_din = sumX - y
            expect(data.k_din).toBeCloseTo(data.sumX - data.y, 5);
            // Effective k in auto mode is k_din
            expect(data.effectiveK).toBeCloseTo(data.k_din, 5);
            expect(data.k_mm).toBeCloseTo(data.effectiveK * 3, 5);
            // Shortened da1 = d1 + 2*mn*(1 + x1 - k)
            const expectedDa1 = 3 * 18 + 2 * 3 * (1 + 0.4 - data.effectiveK);
            expect(data.da1).toBeCloseTo(expectedDa1, 4);
        });

        it('respects manual user override for +/- k factor', () => {
            const manualK = 0.085;
            const data = computeTipShorteningData({
                mn: 4,
                z1: 22,
                z2: 44,
                alphaDeg: 20,
                betaDeg: 15,
                x1: 0.3,
                x2: 0.1,
                kFactorMode: 'custom',
                customK: manualK,
            });

            expect(data.effectiveK).toBeCloseTo(manualK, 5);
            expect(data.k_mm).toBeCloseTo(manualK * 4, 5);
            // Tip diameter with manual k
            const d1 = (4 * 22) / Math.cos(15 * Math.PI / 180);
            const expectedDa1 = d1 + 2 * 4 * (1 + 0.3 - manualK);
            expect(data.da1).toBeCloseTo(expectedDa1, 3);
        });

        it('integrates tip shortening directly into calculateInvoluteGearSpecs', () => {
            const specsWithoutK = calculateInvoluteGearSpecs({
                module: 2.5,
                teeth: 25,
                pressureAngle: 20,
                profileShift: 0.3,
                tipShortening: 0,
            });

            const specsWithK = calculateInvoluteGearSpecs({
                module: 2.5,
                teeth: 25,
                pressureAngle: 20,
                profileShift: 0.3,
                tipShortening: 0.05,
            });

            // da reduction is 2 * module * k = 2 * 2.5 * 0.05 = 0.25 mm
            expect(specsWithoutK.outsideDiameter - specsWithK.outsideDiameter).toBeCloseTo(0.25, 4);
        });

        it('flags sharp crest warning when sa < 0.25 * mn', () => {
            // Extreme profile shift to induce tip pointing
            const data = computeTipShorteningData({
                mn: 2,
                z1: 12,
                z2: 24,
                alphaDeg: 20,
                betaDeg: 0,
                x1: 0.95,
                x2: 0.0,
                kFactorMode: 'custom',
                customK: -0.2, // negative shortening expands tip, making crest razor thin
            });

            expect(data.isCrestSharp1).toBe(true);
        });
    });

    describe('Sistem 2: Center Distance Matching & En Makul Dişli Search', () => {
        it('matches target center distance using helical angle beta', () => {
            // Target center distance 100 mm, mn = 2.5, z1 = 25, z2 = 50
            // Reference center distance at beta=0 is mn*(z1+z2)/2 = 2.5 * 75 / 2 = 93.75 mm
            // For a = 100 mm > 93.75 mm:
            // cos(beta) = 93.75 / 100 = 0.9375 -> beta = arccos(0.9375) ~ 20.364 deg
            const match = matchCenterDistanceForGearPair({
                mn: 2.5,
                z1: 25,
                z2: 50,
                targetCenterDistance: 100,
                alphaDeg: 20,
            });

            expect(match.helicalMatch.possible).toBe(true);
            expect(match.helicalMatch.betaDeg).toBeCloseTo(20.364, 2);
            expect(match.helicalMatch.resultingCenterDistance).toBeCloseTo(100, 3);
        });

        it('matches target center distance using profile shift and tip shortening for spur gears', () => {
            const match = matchCenterDistanceForGearPair({
                mn: 3,
                z1: 20,
                z2: 40,
                targetCenterDistance: 92, // a0 = 3*60/2 = 90 mm, so a_target = 92 mm
                alphaDeg: 20,
            });

            expect(match.profileShiftMatch.possible).toBe(true);
            expect(match.profileShiftMatch.sumX).toBeGreaterThan(0);
            expect(match.profileShiftMatch.resultingCenterDistance).toBeCloseTo(92, 3);
            expect(match.profileShiftMatch.k_din).toBeDefined();
        });

        it('finds and ranks candidate gears, marking the top candidate as ★ EN MAKUL DİŞLİ', () => {
            const candidates = searchBestGearsForCenterDistance({
                targetCenterDistance: 120,
                speedRatio: 2.0,
                maxBetaDeg: 30,
            });

            expect(candidates.length).toBeGreaterThan(0);
            const topCandidate = candidates[0];
            expect(topCandidate.isRecommended).toBe(true);
            expect(topCandidate.recommendationBadge).toContain('EN MAKUL DİŞLİ');
            expect(topCandidate.score).toBeGreaterThan(0);
            expect(topCandidate.centerDistance).toBeCloseTo(120, 2);
            expect(topCandidate.totalContactRatio).toBeGreaterThan(1.2);
        });
    });

    describe('Sistem 3: Autonomous Sizing Engine (ISO 6336 / Lewis)', () => {
        it('calculates optimal module and tooth counts from power and RPM', () => {
            const result = synthesizeGearAutonomous({
                powerKw: 7.5,
                inputRpm: 1450,
                outputRpm: 483.33, // ratio ~ 3.0
                targetCenterDistance: 100,
                material: '16MnCr5',
                serviceFactor: 1.25,
            });

            expect(result.pinionTeeth).toBeGreaterThanOrEqual(17); // Undercut free
            expect(result.actualRatio).toBeCloseTo(3.0, 1);
            expect(result.recommendedModule).toBeGreaterThanOrEqual(1.5);
            expect(result.safetyBending).toBeGreaterThanOrEqual(1.4);
            expect(result.safetyContact).toBeGreaterThanOrEqual(1.0);
            expect(result.centerDistance).toBeCloseTo(100, 1);
        });

        it('handles case when target center distance is not specified', () => {
            const result = synthesizeGearAutonomous({
                powerKw: 15,
                inputRpm: 1500,
                outputRpm: 500, // ratio 3.0
                material: '42CrMo4',
                serviceFactor: 1.3,
            });

            expect(result.pinionTeeth).toBeGreaterThanOrEqual(17);
            expect(result.recommendedModule).toBeGreaterThan(0);
            expect(result.centerDistance).toBeGreaterThan(0);
            expect(result.safetyBending).toBeGreaterThan(1.2);
        });
    });

    describe('Turkish Workshop (Yavuzlar) vs DIN 3960 / KHK Benchmark', () => {
        it('verifies Turkish workshop convention da = d + 2m(1 + x + k) where negative k shortens tip', () => {
            const data = computeTipShorteningData({
                mn: 2.5,
                z1: 25,
                z2: 48,
                alphaDeg: 20,
                betaDeg: 12,
                x1: 0.2337,
                x2: 0.4940,
                kMode: 'workshop',
                customK: -0.107,
            });

            // d1 = 25 * (2.5 / cos(12 deg)) = 63.8967 mm
            const d1 = 25 * (2.5 / Math.cos(12 * Math.PI / 180));
            // da1 = d1 + 2 * 2.5 * (1 + 0.2337 - 0.107) = d1 + 5 * (1.1267) = d1 + 5.6335 mm
            const expectedDa1 = d1 + 2 * 2.5 * (1 + 0.2337 - 0.107);
            expect(data.da1).toBeCloseTo(expectedDa1, 4);
            expect(data.effectiveK).toBeCloseTo(-0.107, 4);
            // In workshop mode, entering negative k decreases da1
            const unshortenedDa1 = d1 + 2 * 2.5 * (1 + 0.2337);
            expect(data.da1).toBeLessThan(unshortenedDa1);
            expect(unshortenedDa1 - data.da1).toBeCloseTo(2 * 2.5 * 0.107, 4);
        });

        it('verifies KHK Gears Table 4.9 standard calculation values exactly', () => {
            // KHK Gears Table 4.9: Helical Gear Pair with Center Distance Alteration
            // mn = 3, alpha = 20 deg, beta = 30 deg, z1 = 12, z2 = 60, x1 = +0.09809, x2 = 0
            const data = computeTipShorteningData({
                mn: 3,
                z1: 12,
                z2: 60,
                alphaDeg: 20,
                betaDeg: 30,
                x1: 0.09809,
                x2: 0,
                kMode: 'auto',
            });

            expect(data.a_standard).toBeCloseTo(124.7077, 3);
            expect(data.a_wt).toBeCloseTo(125.0000, 3);
            expect(data.y).toBeCloseTo(0.0974, 3);
            expect(data.k_din).toBeCloseTo(0.00065, 4);
            expect(data.da1).toBeCloseTo(48.154, 2);
            expect(data.da2).toBeCloseTo(213.842, 2);
        });
    });
});
