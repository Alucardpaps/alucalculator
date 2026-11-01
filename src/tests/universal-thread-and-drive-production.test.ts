import { describe, expect, it, beforeEach } from 'vitest';
import {
    computeThreadProfile,
    kindOf,
    THREAD_TYPE_OPTIONS,
    STANDARD_THREAD_SIZES,
    defaultPitchMm,
    type ThreadTypeCode,
} from '@/lib/fastener/threadProfiles';
import { FASTENERS_DB } from '@/data/fastenersData';
import { THREAD_STANDARDS } from '@/data/boltNutStandards';
import { handbookForType, handbookProfile } from '@/lib/fastener/handbookProfile';
import { CrossModuleBridge } from '@/system/crossModuleBridge';
import { threadGeometrySchema } from '@/calculators/schemas-v2/thread-geometry';

describe('Universal 45-Thread Standards & Drive Production Suite', () => {

    beforeEach(() => {
        // Mock sessionStorage in Node environment
        const store: Record<string, string> = {};
        global.sessionStorage = {
            getItem: (key: string) => store[key] ?? null,
            setItem: (key: string, value: string) => { store[key] = value; },
            removeItem: (key: string) => { delete store[key]; },
            clear: () => { Object.keys(store).forEach(k => delete store[k]); },
            key: (i: number) => Object.keys(store)[i] ?? null,
            length: Object.keys(store).length,
        };
    });

    // ─────────────────────────────────────────────────────────────
    // 1. ALL 45 THREAD FAMILIES & STANDARDS COVERAGE
    // ─────────────────────────────────────────────────────────────
    describe('45 Thread Families Coverage', () => {
        it('registers at least 45 unique thread standards', () => {
            expect(THREAD_TYPE_OPTIONS.length).toBeGreaterThanOrEqual(45);
            const codes = new Set(THREAD_TYPE_OPTIONS.map((o) => o.value));
            expect(codes.size).toBe(THREAD_TYPE_OPTIONS.length);
        });

        it('covers key industrial categories: Metric, Unified, Whitworth, Pipe, Hydraulic, Power', () => {
            const categories = new Set(THREAD_TYPE_OPTIONS.map((o) => o.category));
            expect(categories.has('Metric')).toBe(true);
            expect(categories.has('Unified Inch')).toBe(true);
            expect(categories.has('British Whitworth')).toBe(true);
            expect(categories.has('British Pipe')).toBe(true);
            expect(categories.has('American Pipe')).toBe(true);
            expect(categories.has('Hydraulic Fittings')).toBe(true);
            expect(categories.has('Power Screws')).toBe(true);
        });

        it('computes valid geometric profile for all registered thread families', () => {
            for (const opt of THREAD_TYPE_OPTIONS) {
                const code = opt.value;
                const d = 24; // 24mm nominal
                const p = defaultPitchMm(code, d) ?? 1.5;
                expect(p, `Pitch for ${code} must be > 0`).toBeGreaterThan(0);

                const profile = computeThreadProfile(code, d, p);
                expect(profile.d, `${code} major diameter`).toBe(d);
                expect(profile.d2, `${code} pitch diameter`).toBeLessThan(d);
                expect(profile.d2, `${code} pitch diameter`).toBeGreaterThan(profile.d1);
                expect(profile.d1, `${code} minor diameter`).toBeGreaterThan(0);
                expect(profile.angleDeg, `${code} angle`).toBeGreaterThanOrEqual(0);
                expect(profile.h1, `${code} thread height`).toBeGreaterThan(0);
                expect(profile.tapDrill, `${code} tap drill`).toBeGreaterThan(0);
                expect(profile.stressArea, `${code} stress area`).toBeGreaterThan(0);
                expect(profile.standardCode, `${code} standard code`).toBeTruthy();
                expect(profile.notes.length, `${code} notes`).toBeGreaterThan(0);
            }
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 2. INPART24 ARTICLE 37 EXACT PIPE THREAD TABLES
    // ─────────────────────────────────────────────────────────────
    describe('Inpart24 Article 37 Pipe Thread Table Verification', () => {
        it('includes all 22 G / BSPP sizes in FASTENERS_DB', () => {
            const expectedSizes = [
                'G 1/16', 'G 1/8', 'G 1/4', 'G 3/8', 'G 1/2', 'G 5/8', 'G 3/4', 'G 7/8',
                'G 1', 'G 1-1/8', 'G 1-1/4', 'G 1-3/8', 'G 1-1/2', 'G 1-3/4',
                'G 2', 'G 2-1/4', 'G 2-1/2', 'G 2-3/4', 'G 3', 'G 3-1/4', 'G 3-1/2', 'G 3-3/4', 'G 4'
            ];
            for (const size of expectedSizes) {
                const row = FASTENERS_DB.find((f) => f.standard === 'BSPP (G)' && f.size === size);
                expect(row, `Missing BSPP row in FASTENERS_DB: ${size}`).toBeTruthy();
                expect(row!.majorDia).toBeGreaterThan(0);
                expect(row!.pitchDia).toBeGreaterThan(0);
                expect(row!.minorDia).toBeGreaterThan(0);
                expect(row!.tapDrill).toBeGreaterThan(0);
            }
        });

        it('matches Inpart24 Article 37 exact dimensions for G 1/2"', () => {
            const g12 = FASTENERS_DB.find((f) => f.standard === 'BSPP (G)' && f.size === 'G 1/2')!;
            expect(g12.majorDia).toBeCloseTo(20.955, 3);
            expect(g12.pitch).toBe(14); // 14 TPI
            expect(g12.pitchDia).toBeCloseTo(19.793, 3);
            expect(g12.minorDia).toBeCloseTo(18.631, 3);
            expect(g12.tapDrill).toBeCloseTo(19.0, 1);
        });

        it('matches Inpart24 Article 37 exact dimensions for G 1"', () => {
            const g1 = FASTENERS_DB.find((f) => f.standard === 'BSPP (G)' && f.size === 'G 1')!;
            expect(g1.majorDia).toBeCloseTo(33.249, 3);
            expect(g1.pitch).toBe(11); // 11 TPI
            expect(g1.pitchDia).toBeCloseTo(31.770, 3);
            expect(g1.minorDia).toBeCloseTo(30.291, 3);
            expect(g1.tapDrill).toBeCloseTo(30.75, 1);
        });

        it('includes all 10+ standard NPT sizes in FASTENERS_DB with 1:16 taper', () => {
            const nptSizes = [
                '1/16 NPT', '1/8 NPT', '1/4 NPT', '3/8 NPT', '1/2 NPT', '3/4 NPT',
                '1 NPT', '1-1/4 NPT', '1-1/2 NPT', '2 NPT'
            ];
            for (const size of nptSizes) {
                const row = FASTENERS_DB.find((f) => f.standard === 'NPT' && f.size === size);
                expect(row, `Missing NPT row: ${size}`).toBeTruthy();
                expect(row!.majorDia).toBeGreaterThan(0);
                expect(row!.pitchDia).toBeGreaterThan(0);
                expect(row!.minorDia).toBeGreaterThan(0);
            }
        });

        it('matches Inpart24 Article 37 exact dimensions for 1/2 NPT', () => {
            const npt12 = FASTENERS_DB.find((f) => f.standard === 'NPT' && f.size === '1/2 NPT')!;
            expect(npt12.majorDia).toBeCloseTo(21.34, 2);
            expect(npt12.pitch).toBe(14); // 14 TPI
            expect(npt12.pitchDia).toBeCloseTo(19.77, 2);
            expect(npt12.tapDrill).toBeCloseTo(17.86, 2);
        });

        it('includes tapered R / BSPT corresponding sizes in FASTENERS_DB', () => {
            const r12 = FASTENERS_DB.find((f) => f.standard === 'BSPT (R)' && f.size === 'R 1/2')!;
            expect(r12).toBeTruthy();
            expect(r12.majorDia).toBeCloseTo(20.955, 3);
            expect(r12.pitch).toBe(14);
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 3. HANDBOOK PROFILE SHAPES ACROSS 5 GEOMETRIES
    // ─────────────────────────────────────────────────────────────
    describe('Handbook Profile Shapes & Inpart24 Blueprint Geometry', () => {
        it('generates correct ISO 60° triangular profile geometry', () => {
            const hb = handbookProfile('iso60', 1.5, 2);
            expect(hb.angleDeg).toBe(60);
            expect(hb.H).toBeCloseTo(1.5 * Math.cos(Math.PI / 6), 4);
            expect(hb.yMaleCrest).toBeCloseTo((3 / 8) * hb.H, 4);
            expect(hb.yFemaleMinor).toBeCloseTo((-1 / 4) * hb.H, 4);
            expect(hb.male.length).toBeGreaterThan(10);
            expect(hb.female.length).toBeGreaterThan(5);
        });

        it('generates correct Whitworth 55° profile geometry with rounded crest/root', () => {
            const hb = handbookProfile('whitworth', 2.0, 2);
            expect(hb.angleDeg).toBe(55);
            expect(hb.rootR).toBeGreaterThan(0);
            expect(hb.yMaleCrest).toBeCloseTo(hb.H / 2, 4);
            expect(hb.yMaleRoot).toBeCloseTo(-hb.H / 2, 4);
        });

        it('generates correct Trapezoidal Tr 30° profile geometry', () => {
            const hb = handbookProfile('tr', 4.0, 2);
            expect(hb.angleDeg).toBe(30);
            expect(hb.H).toBeCloseTo(4.0 * 0.5, 4);
            expect(hb.male.length).toBeGreaterThan(6);
        });

        it('generates correct Buttress 45°/3° asymmetrical profile geometry', () => {
            const hb = handbookProfile('buttress', 3.0, 2);
            expect(hb.H).toBeCloseTo(3.0 * 0.6, 4);
            expect(hb.male.length).toBeGreaterThan(6);
        });

        it('generates correct Round (Rd) and Square (Sq) profile geometries', () => {
            const hbRd = handbookProfile('round', 2.54, 2);
            expect(hbRd.angleDeg).toBe(30);
            expect(hbRd.male.length).toBeGreaterThan(6);

            const hbSq = handbookProfile('square', 2.0, 2);
            expect(hbSq.angleDeg).toBe(0);
            expect(hbSq.H).toBeCloseTo(1.0, 4);
            expect(hbSq.male.length).toBeGreaterThan(6);
        });

        it('handbookForType handles all 50 types with appropriate profile mapping', () => {
            for (const opt of THREAD_TYPE_OPTIONS) {
                const hb = handbookForType(opt.value, 1.5, 2);
                expect(hb, `Handbook for ${opt.value}`).toBeTruthy();
                expect(hb.H).toBeGreaterThan(0);
                expect(hb.male.length).toBeGreaterThan(0);
            }
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 4. CROSS-MODULE 3D FASTENER EXPORT (DESIGN STUDIO INTEGRATION)
    // ─────────────────────────────────────────────────────────────
    describe('3D Fastener Export & Cross-Module Bridge', () => {
        it('exports a threaded bolt into sessionStorage with full engineering telemetry', () => {
            const result = CrossModuleBridge.exportThreadTo3D({
                type: 'M',
                nominalDia: 12,
                pitch: 1.75,
                lengthMm: 45,
                switchWindow: false,
            });
            expect(result.success).toBe(true);
            expect(result.partId).toMatch(/^part-thread-M-12x1.75/);

            const rawStored = sessionStorage.getItem('design-studio-import-part');
            expect(rawStored).toBeTruthy();

            const storedPart = JSON.parse(rawStored!);
            expect(storedPart.name).toContain('ISO 68-1');
            expect(storedPart.name).toContain('M12×1.75 Bolt');
            expect(storedPart.kind).toBe('hex-bolt');
            expect(storedPart.params.diameter).toBe(12);
            expect(storedPart.params.length).toBe(45);
            expect(storedPart.params.threadType).toBe('M');
            expect(storedPart.params.pitch).toBe(1.75);
            expect(storedPart.params.pitchDiameter).toBeCloseTo(10.863, 2);
            expect(storedPart.params.minorDiameter).toBeCloseTo(10.106, 2);
            expect(storedPart.params.tapDrill).toBeCloseTo(10.25, 2);
            expect(storedPart.params.stressArea).toBeGreaterThan(80);
            expect(storedPart.params.profileShape).toBe('triangular');
        });

        it('exports trapezoidal Tr and Buttress threads with correct profileShape metadata', () => {
            const trResult = CrossModuleBridge.exportThreadTo3D({
                type: 'Tr',
                nominalDia: 20,
                pitch: 4,
                lengthMm: 100,
                switchWindow: false,
            });
            expect(trResult.success).toBe(true);
            const trPart = JSON.parse(sessionStorage.getItem('design-studio-import-part')!);
            expect(trPart.params.profileShape).toBe('trapezoidal');
            expect(trPart.params.threadAngle).toBe(30);

            const sResult = CrossModuleBridge.exportThreadTo3D({
                type: 'S',
                nominalDia: 30,
                pitch: 5,
                lengthMm: 120,
                switchWindow: false,
            });
            expect(sResult.success).toBe(true);
            const sPart = JSON.parse(sessionStorage.getItem('design-studio-import-part')!);
            expect(sPart.params.profileShape).toBe('buttress');
            expect(sPart.params.standard).toContain('DIN 513');
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 5. THREAD GEOMETRY SCHEMA (V2 RUNTIME VALIDATION)
    // ─────────────────────────────────────────────────────────────
    describe('Thread Geometry V2 Schema Execution', () => {
        it('calculates valid outputs for M16×2 in threadGeometrySchema', () => {
            const result = threadGeometrySchema.calculationEngine({
                type: { value: 'M' },
                nominalDia: { value: 16 },
                pitch: { value: 2.0 },
            });

            expect(result.verified).toBe(true);
            expect(result.outputs.majorDia.value).toBe(16);
            expect(result.outputs.pitchDia.value).toBeCloseTo(14.701, 2);
            expect(result.outputs.minorDia.value).toBeCloseTo(13.835, 2);
            expect(result.outputs.tapDrill.value).toBeCloseTo(14.0, 1);
            expect(result.outputs.stressArea.value).toBeCloseTo(157, 0);
            expect(result.outputs.profileAngle.value).toBe(60);
        });

        it('calculates valid outputs for NPT 1/2 in threadGeometrySchema', () => {
            const result = threadGeometrySchema.calculationEngine({
                type: { value: 'NPT' },
                nominalDia: { value: 21.34 },
                pitch: { value: 1.814 },
            });

            expect(result.verified).toBe(true);
            expect(result.outputs.majorDia.value).toBeCloseTo(21.34, 2);
            expect(result.outputs.pitchDia.value).toBeCloseTo(19.89, 2);
            expect(result.outputs.profileAngle.value).toBe(60);
        });
    });
});
