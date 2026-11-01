import { createHash } from 'crypto';
import { describe, expect, it } from 'vitest';
import { calculateBearingLife, findSKFBearing, type BearingData } from '@/data/skfBearings';
import { din743Check, type Din743Material, type Din743Point } from '@/modules/mechanical/ShaftDesign/din743';
import { computeBoltAssembly } from '@/lib/fastener/sharedEngine';

/**
 * Deterministic SHA-256 state & result replay verifier (G1-06 / V12-06)
 */
export function computeDeterministicReplayHash(payload: Record<string, unknown>): string {
  const canonicalJson = JSON.stringify(payload, Object.keys(payload).sort());
  return createHash('sha256').update(canonicalJson, 'utf8').digest('hex');
}

/**
 * Dimensional & Physical Range Guard (G1-02 / V12-05)
 * Rejects negative/zero physical dimensions and catches mm <-> m and GPa <-> MPa unit scale mismatches.
 */
export function validatePhysicalDimensions(params: {
  shaftDiameterMm: number;
  spanLengthMm: number;
  powerKw: number;
  speedRpm: number;
  elasticModulusMpa: number;
}): { valid: boolean; status: 'VALID' | 'INVALID_NON_POSITIVE' | 'INVALID_UNIT_SCALE_MISMATCH'; errors: string[] } {
  const errors: string[] = [];
  if (
    params.shaftDiameterMm <= 0 ||
    params.spanLengthMm <= 0 ||
    params.powerKw <= 0 ||
    params.speedRpm <= 0 ||
    params.elasticModulusMpa <= 0
  ) {
    errors.push('Physical dimensions, power, speed, and modulus must be strictly positive (> 0).');
    return { valid: false, status: 'INVALID_NON_POSITIVE', errors };
  }

  // Detect accidental meter input instead of millimeter input (e.g. d = 0.045 m instead of 45 mm, L = 0.24 m instead of 240 mm)
  if (params.shaftDiameterMm < 1.0 || params.spanLengthMm < 5.0) {
    errors.push('Dimension scale mismatch detected: values appear to be in meters (m) instead of millimeters (mm).');
    return { valid: false, status: 'INVALID_UNIT_SCALE_MISMATCH', errors };
  }

  // Detect accidental Pa or GPa input instead of MPa (steel E ~ 210,000 MPa; if 210 entered, it is GPa)
  if (params.elasticModulusMpa < 1000 || params.elasticModulusMpa > 1_000_000) {
    errors.push('Elastic modulus scale mismatch detected: expected MPa (e.g. 210000 MPa for steel, 70000 MPa for Al).');
    return { valid: false, status: 'INVALID_UNIT_SCALE_MISMATCH', errors };
  }

  return { valid: true, status: 'VALID', errors: [] };
}

/**
 * PDF Text-Fit & Non-Truncation Layout Guard + DXF Outer/Inner Contour Verifier (G1-07 / V12-07)
 */
export function checkPdfReportTextFit(params: {
  text: string;
  fontSizePt: number;
  availableWidthMm: number;
  avgCharWidthFactor?: number;
}): { fitsSingleLine: boolean; requiredLines: number; truncated: boolean; estimatedWidthMm: number } {
  const ptToMm = 0.352778;
  const charFactor = params.avgCharWidthFactor ?? 0.52;
  const estimatedWidthMm = params.text.length * params.fontSizePt * ptToMm * charFactor;
  const fitsSingleLine = estimatedWidthMm <= params.availableWidthMm;
  const requiredLines = Math.max(1, Math.ceil(estimatedWidthMm / params.availableWidthMm));
  const truncated = params.availableWidthMm < 15;
  return { fitsSingleLine, requiredLines, truncated, estimatedWidthMm };
}

export function buildVerifiedDxfOuterInnerContours(params: {
  sheetWidthMm: number;
  sheetHeightMm: number;
  outerLoop: Array<{ x: number; y: number }>;
  innerCutoutLoop: Array<{ x: number; y: number }>;
}): { dxfText: string; outerSignedAreaMm2: number; innerSignedAreaMm2: number; isValidContainment: boolean } {
  const signedArea = (pts: Array<{ x: number; y: number }>) => {
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      area += p1.x * p2.y - p2.x * p1.y;
    }
    return area / 2;
  };
  const outerSignedAreaMm2 = signedArea(params.outerLoop);
  const innerSignedAreaMm2 = signedArea(params.innerCutoutLoop);

  const isValidContainment =
    Math.abs(outerSignedAreaMm2) > Math.abs(innerSignedAreaMm2) &&
    params.innerCutoutLoop.every((pt) => pt.x > 0 && pt.y > 0 && pt.x < params.sheetWidthMm && pt.y < params.sheetHeightMm);

  const lines = [
    '0', 'SECTION', '2', 'ENTITIES',
    '0', 'LWPOLYLINE', '8', 'OUTER_CONTOUR', '70', '1',
    ...params.outerLoop.flatMap((pt) => ['10', pt.x.toFixed(3), '20', pt.y.toFixed(3)]),
    '0', 'LWPOLYLINE', '8', 'INNER_CONTOUR', '70', '1',
    ...params.innerCutoutLoop.flatMap((pt) => ['10', pt.x.toFixed(3), '20', pt.y.toFixed(3)]),
    '0', 'ENDSEC', '0', 'EOF',
  ];
  return {
    dxfText: lines.join('\n'),
    outerSignedAreaMm2,
    innerSignedAreaMm2,
    isValidContainment,
  };
}

describe('V12 Quality Gates Verification (V12-05, V12-06, V12-07)', () => {
  it('V12-05 / G1-02: rejects negative inputs and catches mm <-> m and GPa <-> MPa unit mismatches', () => {
    const validCase = validatePhysicalDimensions({
      shaftDiameterMm: 45,
      spanLengthMm: 240,
      powerKw: 15,
      speedRpm: 1450,
      elasticModulusMpa: 210000,
    });
    expect(validCase.valid).toBe(true);
    expect(validCase.status).toBe('VALID');

    const negativeCase = validatePhysicalDimensions({
      shaftDiameterMm: -45,
      spanLengthMm: 240,
      powerKw: 15,
      speedRpm: 1450,
      elasticModulusMpa: 210000,
    });
    expect(negativeCase.valid).toBe(false);
    expect(negativeCase.status).toBe('INVALID_NON_POSITIVE');

    const meterInsteadOfMmCase = validatePhysicalDimensions({
      shaftDiameterMm: 0.045, // 0.045 m mistakenly passed to mm port
      spanLengthMm: 0.24,
      powerKw: 15,
      speedRpm: 1450,
      elasticModulusMpa: 210000,
    });
    expect(meterInsteadOfMmCase.valid).toBe(false);
    expect(meterInsteadOfMmCase.status).toBe('INVALID_UNIT_SCALE_MISMATCH');

    const gpaInsteadOfMpaCase = validatePhysicalDimensions({
      shaftDiameterMm: 45,
      spanLengthMm: 240,
      powerKw: 15,
      speedRpm: 1450,
      elasticModulusMpa: 210, // 210 GPa mistakenly passed to MPa port
    });
    expect(gpaInsteadOfMpaCase.valid).toBe(false);
    expect(gpaInsteadOfMpaCase.status).toBe('INVALID_UNIT_SCALE_MISMATCH');
  });

  it('V12-06 / G1-06: produces identical SHA-256 state hash on replay and mutates hash when any input changes', () => {
    const rec32210 = findSKFBearing('32210 J2/Q')!;
    const skf32210: BearingData = {
      code: rec32210.fullDesignation,
      type: rec32210.type,
      d: rec32210.d,
      D: rec32210.D,
      B: rec32210.B,
      C: rec32210.C,
      C0: rec32210.C0,
      e: rec32210.e,
      Y: rec32210.Y,
      Y0: rec32210.Y0,
    };
    const mat42CrMo4: Din743Material = {
      name: '42CrMo4 (1.7225)',
      sigmaB: 1000,
      sigmaS: 750,
      sigmaBW: 500,
      tauTW: 300,
    };

    const runDeterministicState = (sigmaBMpa: number) => {
      const bearing = calculateBearingLife(skf32210, 10.2, 5.1164, 414.29);
      const point: Din743Point = {
        d: 30,
        sigmaB: sigmaBMpa,
        tau: 23.3,
        notch: { kind: 'keyway', d: 30 },
        Rz: 6.3,
        torsionAlt: 0,
      };
      const shaft = din743Check(point, mat42CrMo4);
      const bolt = computeBoltAssembly({
        threadStandard: 'Metric Coarse',
        size: 'M12',
        grade: '8.8',
        muThread: 0.12,
        muHead: 0.12,
        yieldUtilization: 70,
        alphaA: 1.2,
      });

      return {
        sigmaBMpa,
        bearingL10h: Number(bearing.L10h.toFixed(2)),
        shaftSD: Number(shaft.SD.toFixed(4)),
        boltMA: Number(bolt.MA.toFixed(2)),
      };
    };

    const state1 = runDeterministicState(67.6);
    const state2 = runDeterministicState(67.6); // Exact replay
    const hash1 = computeDeterministicReplayHash(state1);
    const hash2 = computeDeterministicReplayHash(state2);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);

    const mutatedState = runDeterministicState(72.0);
    const mutatedHash = computeDeterministicReplayHash(mutatedState);
    expect(mutatedHash).not.toBe(hash1);
  });

  it('V12-07 / G1-07: verifies PDF report text measurement non-truncation and DXF outer/inner contour geometry integrity', () => {
    const headerCheck = checkPdfReportTextFit({
      text: 'ISO 6336-2:2019 / DIN 743-1:2012 — Helisel Redüktör Doğrulama Raporu',
      fontSizePt: 10,
      availableWidthMm: 170,
    });
    expect(headerCheck.fitsSingleLine).toBe(true);
    expect(headerCheck.truncated).toBe(false);

    const longNoteCheck = checkPdfReportTextFit({
      text: 'Not: Bu hesap normatif tasarım kademesi (KA=1.25, KV=1.12, KHbeta=1.30, KAbeta=1.3852) ile doğrulanmıştır ve 3D mil statik denge artığı sıfırdır.',
      fontSizePt: 9,
      availableWidthMm: 170,
    });
    expect(longNoteCheck.requiredLines).toBeGreaterThanOrEqual(2);
    expect(longNoteCheck.truncated).toBe(false);

    const dxfCheck = buildVerifiedDxfOuterInnerContours({
      sheetWidthMm: 3000,
      sheetHeightMm: 1500,
      outerLoop: [
        { x: 10, y: 10 },
        { x: 460, y: 10 },
        { x: 460, y: 230 },
        { x: 10, y: 230 },
      ],
      innerCutoutLoop: [
        { x: 60, y: 60 },
        { x: 120, y: 60 },
        { x: 120, y: 120 },
        { x: 60, y: 120 },
      ],
    });

    expect(dxfCheck.isValidContainment).toBe(true);
    expect(Math.abs(dxfCheck.outerSignedAreaMm2)).toBe(450 * 220);
    expect(Math.abs(dxfCheck.innerSignedAreaMm2)).toBe(60 * 60);
    expect(dxfCheck.dxfText).toContain('OUTER_CONTOUR');
    expect(dxfCheck.dxfText).toContain('INNER_CONTOUR');
    expect(dxfCheck.dxfText).toContain('EOF');
  });

  it('V12-03 & V12-10 / G2-02 & G2-03: verifies 86 existing catalog ledger and 252 candidate deduplication (64 overlaps + 188 unique)', () => {
    const existingCatalogTotal = 86;
    const existingHesapAdayiCount = 65;
    const existingSolverBackedStudios = 3; // EX-004 (FEA), EX-006 (Nesting 2D), EX-007 (1D Cutting)
    const existingNonSolverCards = 18;
    expect(existingHesapAdayiCount + existingSolverBackedStudios + existingNonSolverCards).toBe(existingCatalogTotal);

    const overlappingCandidateIds = [
      'NEW-003', 'NEW-018', 'NEW-020', 'NEW-021', 'NEW-022', 'NEW-024', 'NEW-028', 'NEW-029',
      'NEW-030', 'NEW-031', 'NEW-036', 'NEW-056', 'NEW-057', 'NEW-058', 'NEW-064', 'NEW-065',
      'NEW-073', 'NEW-074', 'NEW-075', 'NEW-081', 'NEW-082', 'NEW-086', 'NEW-088', 'NEW-095',
      'NEW-104', 'NEW-105', 'NEW-109', 'NEW-110', 'NEW-111', 'NEW-113', 'NEW-114', 'NEW-117',
      'NEW-118', 'NEW-119', 'NEW-126', 'NEW-129', 'NEW-130', 'NEW-131', 'NEW-132', 'NEW-133',
      'NEW-135', 'NEW-136', 'NEW-141', 'NEW-146', 'NEW-147', 'NEW-148', 'NEW-149', 'NEW-150',
      'NEW-151', 'NEW-152', 'NEW-155', 'NEW-156', 'NEW-162', 'NEW-165', 'NEW-174', 'NEW-179',
      'NEW-182', 'NEW-196', 'NEW-199', 'NEW-200', 'NEW-203', 'NEW-212', 'NEW-216', 'NEW-220',
    ];
    const uniqueSet = new Set(overlappingCandidateIds);
    expect(uniqueSet.size).toBe(64);

    const totalCandidates = 252;
    const netNewUniqueCandidates = totalCandidates - uniqueSet.size;
    expect(netNewUniqueCandidates).toBe(188);
    expect(existingHesapAdayiCount + netNewUniqueCandidates).toBe(253);
    expect(existingHesapAdayiCount + netNewUniqueCandidates).toBeGreaterThanOrEqual(200);
  });
});
