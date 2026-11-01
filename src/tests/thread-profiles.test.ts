import { describe, expect, it } from 'vitest';
import { FASTENERS_DB } from '@/data/fastenersData';
import { THREAD_STANDARDS } from '@/data/boltNutStandards';
import {
  computeThreadProfile,
  kindOf,
  threadProfilePath,
  THREAD_TYPE_OPTIONS,
  unStressAreaMm2,
} from '@/lib/fastener/threadProfiles';
import {
  getThreadGeometryFromPage,
  getThreadGeometryFromTorquePage,
  GEOMETRY_STANDARDS_LIST,
  TORQUE_STANDARDS_LIST,
} from '@/lib/fastener/sharedEngine';
import { handbookProfile, polyClosed } from '@/lib/fastener/handbookProfile';

describe('thread profile engine', () => {
  it('ISO 68-1 M10×1.5 matches the catalog row', () => {
    const p = computeThreadProfile('M', 10, 1.5);
    const row = FASTENERS_DB.find((f) => f.standard === 'ISO Metric' && f.size === 'M10')!;
    expect(p.d2).toBeCloseTo(row.pitchDia, 3);
    expect(p.d1).toBeCloseTo(row.minorDia, 3);
    expect(p.angleDeg).toBe(60);
    expect(p.stressArea).toBeCloseTo(row.stressArea, 0);
  });

  it('Whitworth G 1/8 55° matches ISO 228 catalog diameters', () => {
    const row = FASTENERS_DB.find((f) => f.size === 'G 1/8')!;
    const P = 25.4 / 28;
    const p = computeThreadProfile('G', row.majorDia, P);
    expect(p.angleDeg).toBe(55);
    expect(p.d2).toBeCloseTo(row.pitchDia, 3);
    expect(p.d1).toBeCloseTo(row.minorDia, 3);
  });

  it('Metric Fine M16×1.5 tensile area is ~167 mm²', () => {
    const p = computeThreadProfile('MF', 16, 1.5);
    expect(p.stressArea).toBeCloseTo(167, 0);
    const row = FASTENERS_DB.find((f) => f.size === 'M16x1.5' && f.standard === 'ISO Metric Fine');
    expect(row).toBeTruthy();
    expect(row!.pitch).toBe(1.5);
  });

  it('UNEF 1/4-32 is in the catalog and uses ASME As', () => {
    const row = FASTENERS_DB.find((f) => f.standard === 'UNEF' && f.size === '1/4-32');
    expect(row).toBeTruthy();
    expect(row!.pitch).toBe(32);
    expect(row!.stressArea).toBeCloseTo(unStressAreaMm2(0.25, 32), 1);
  });

  it('BSW 1/2 is 12 TPI and BSF 1/4 is 26 TPI', () => {
    const bsw = FASTENERS_DB.find((f) => f.standard === 'BSW' && f.size === 'W 1/2')!;
    const bsf = FASTENERS_DB.find((f) => f.standard === 'BSF' && f.size === 'BSF 1/4')!;
    expect(bsw.pitch).toBe(12);
    expect(bsf.pitch).toBe(26);
    expect(bsw.majorDia).toBeCloseTo(12.7, 2);
    expect(kindOf('W')).toBe('whitworth');
    expect(kindOf('BSF')).toBe('whitworth');
  });

  it('BSPP extra sizes include G 5/8 and G 4 (ISO 228-1)', () => {
    expect(FASTENERS_DB.some((f) => f.size === 'G 5/8')).toBe(true);
    expect(FASTENERS_DB.some((f) => f.size === 'G 4')).toBe(true);
    const g58 = FASTENERS_DB.find((f) => f.size === 'G 5/8')!;
    expect(g58.majorDia).toBeCloseTo(22.911, 3);
    expect(g58.pitch).toBe(14);
  });

  it('NPTF shares the NPT 1/2 gauge OD', () => {
    const npt = FASTENERS_DB.find((f) => f.size === '1/2 NPT')!;
    const nptf = FASTENERS_DB.find((f) => f.size === '1/2 NPTF')!;
    expect(nptf.majorDia).toBeCloseTo(npt.majorDia, 3);
    expect(nptf.pitch).toBe(14);
    const g = getThreadGeometryFromPage('NPTF', '1/2 NPTF');
    expect(g?.isTapered).toBe(true);
  });

  it('every visualizer family produces a closed SVG path', () => {
    for (const opt of THREAD_TYPE_OPTIONS) {
      const path = threadProfilePath(kindOf(opt.value), 100, 50, 250, 2);
      expect(path.startsWith('M')).toBe(true);
      expect(path.trim().endsWith('Z')).toBe(true);
    }
  });

  it('Whitworth / pipe profile uses crest-root arcs, not a polyline hack', () => {
    const w = threadProfilePath('whitworth', 100, 50, 250, 3);
    expect(w).toMatch(/A\d/);
    const rd = threadProfilePath('round', 100, 50, 250, 3);
    expect(rd).toMatch(/A\d/);
  });

  it('handbook ISO 60 nested profile has male crest at 3H/8 and female minor at −H/4', () => {
    const hb = handbookProfile('iso60', 1.5, 2);
    expect(hb.H).toBeCloseTo(1.5 * Math.sqrt(3) / 2, 6);
    expect(hb.yMaleCrest).toBeCloseTo((3 * hb.H) / 8, 6);
    expect(hb.yFemaleMinor).toBeCloseTo(-hb.H / 4, 6);
    expect(hb.male.length).toBeGreaterThan(8);
    expect(hb.female.length).toBeGreaterThan(4);
    const fill = polyClosed(hb.male, hb.yMaleRoot, (y) => -y);
    expect(fill.startsWith('M')).toBe(true);
    expect(fill.trim().endsWith('Z')).toBe(true);
  });

  it('handbook Whitworth has equal rounded crest and root', () => {
    const hb = handbookProfile('whitworth', 1.814, 2);
    expect(hb.angleDeg).toBe(55);
    expect(hb.yMaleCrest).toBeCloseTo(-hb.yMaleRoot, 6);
    expect(hb.rootR).toBeGreaterThan(0.2);
  });

  it('buttress / ACME / square / pipe families return positive nested diameters', () => {
    for (const type of ['S', 'Acme', 'Sq', 'Rd', 'NPT', 'BSPT', 'UNEF', 'MF']) {
      const out = computeThreadProfile(type, 20, 4);
      expect(out.d).toBe(20);
      expect(out.d1).toBeGreaterThan(0);
      expect(out.d1).toBeLessThan(20);
      expect(out.d2).toBeGreaterThan(out.d1);
      expect(out.d2).toBeLessThan(20);
    }
  });

  it('THREAD_STANDARDS exposes BSW / UNEF / Metric Fine extras for the torque page', () => {
    expect(THREAD_STANDARDS.some((t) => t.type === 'BSW' && t.size === 'W 1/2')).toBe(true);
    expect(THREAD_STANDARDS.some((t) => t.type === 'UNEF')).toBe(true);
    expect(THREAD_STANDARDS.some((t) => t.type === 'Metric Fine' && t.size === 'M16x1.5')).toBe(true);
    expect(THREAD_STANDARDS.some((t) => t.type === 'BSF')).toBe(true);
  });

  it('geometry page can resolve every non-custom standard', () => {
    for (const std of GEOMETRY_STANDARDS_LIST.filter((s) => s !== 'Custom')) {
      const row = FASTENERS_DB.find((f) => f.standard === std);
      expect(row, `missing catalog rows for ${std}`).toBeTruthy();
      const g = getThreadGeometryFromPage(std, row!.size);
      expect(g?.majorDia).toBeGreaterThan(0);
      expect(g?.pitchDia).toBeGreaterThan(0);
    }
  });

  it('torque page can resolve every non-custom standard with non-empty sizes from THREAD_STANDARDS', () => {
    for (const std of TORQUE_STANDARDS_LIST.filter((s) => s !== 'Custom')) {
      const rows = std === 'Pipe'
        ? THREAD_STANDARDS.filter(
            (t) =>
              t.type === 'Pipe' ||
              t.type === 'BSPP (G)' ||
              t.type === 'BSPT (R)' ||
              t.type === 'NPT' ||
              t.type === 'NPTF',
          )
        : THREAD_STANDARDS.filter((t) => t.type === std);
      expect(rows.length, `Standard "${std}" must NOT be empty in THREAD_STANDARDS!`).toBeGreaterThan(0);
      const g = getThreadGeometryFromTorquePage(std, rows[0].size);
      expect(g.majorDia, `majorDia for ${std} size ${rows[0].size}`).toBeGreaterThan(0);
      expect(g.pitchDia, `pitchDia for ${std} size ${rows[0].size}`).toBeGreaterThan(0);
    }
  });
});
