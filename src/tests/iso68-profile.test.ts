import { describe, expect, it } from 'vitest';
import { iso68Profile, ISO68 } from '@/lib/fastener/iso68';

describe('ISO 68-1 profile', () => {
  it('M12×1.75 basic diameters match ISO 68-1 coefficients', () => {
    const p = iso68Profile(12, 1.75);
    expect(p.H).toBeCloseTo(1.51554, 4);
    expect(p.d2).toBeCloseTo(12 - 0.649519053 * 1.75, 5);
    expect(p.D1).toBeCloseTo(12 - 1.082531755 * 1.75, 5);
    expect(p.d3).toBeCloseTo(12 - 1.226869322 * 1.75, 5);
    expect(p.D2).toBeCloseTo(p.d2, 6);
    expect(p.angleDeg).toBe(60);
    expect(p.crestFlatMale).toBeCloseTo(1.75 / 8, 6);
    expect(p.crestFlatFemale).toBeCloseTo(1.75 / 4, 6);
    expect(p.rootR).toBeCloseTo(p.H / 6, 6);
    expect(p.engagement).toBeCloseTo((5 / 8) * p.H, 6);
  });

  it('H/P is √3/2', () => {
    expect(ISO68.H_over_P).toBeCloseTo(Math.sqrt(3) / 2, 12);
  });
});

describe('Dynamic Thread Contour & Chamfer Lead-in', () => {
  it('thread teeth slide dynamically with turnShift without static freeze', async () => {
    const { getTopToothPoints } = await import('@/components/modules/mechanical/boltMmSvg');
    const d = 12;
    const d3 = 9.853;
    const P = 1.75;
    const c = 1.75;
    const xStart = 20;
    const xEnd = 60;
    const xChamfer = xEnd - c;

    const ptsTurn0 = getTopToothPoints(xStart, xEnd, xChamfer, d, d3, P, 0);
    const ptsTurnQuarter = getTopToothPoints(xStart, xEnd, xChamfer, d, d3, P, 0.25 * P);

    expect(ptsTurn0.length).toBeGreaterThan(15);
    expect(ptsTurnQuarter.length).toBeGreaterThan(15);

    // Points inside the body slide along x by -0.25 * P
    const interiorCrest0 = ptsTurn0.find((pt) => pt.x > 30 && pt.x < 45 && Math.abs(pt.y - (-d / 2)) < 1e-4);
    expect(interiorCrest0).toBeDefined();

    // Verify dynamic shift: corresponding crest in turn 0.25 is shifted by -0.25 * P
    const interiorCrestQuarter = ptsTurnQuarter.find(
      (pt) => Math.abs(pt.x - (interiorCrest0!.x - 0.25 * P)) < 0.01 && Math.abs(pt.y - (-d / 2)) < 1e-4
    );
    expect(interiorCrestQuarter).toBeDefined();
  }, 15000);

  it('thread teeth run continuously to xEnd with 45° chamfer lead-in and zero empty gap', async () => {
    const { getTopToothPoints, getBottomToothPoints } = await import('@/components/modules/mechanical/boltMmSvg');
    const d = 56;
    const d3 = 49.252;
    const P = 5.5;
    const c = 5.5;
    const xStart = 111;
    const xEnd = 235;
    const xChamfer = xEnd - c;

    const topPts = getTopToothPoints(xStart, xEnd, xChamfer, d, d3, P, 0);
    const botPts = getBottomToothPoints(xStart, xEnd, xChamfer, d, d3, P, 0);

    // Verify start and end points
    expect(topPts[0].x).toBe(xStart);
    expect(topPts[topPts.length - 1].x).toBe(xEnd);
    expect(botPts[0].x).toBe(xEnd);
    expect(botPts[botPts.length - 1].x).toBe(xStart);

    // Top and bottom converge at xEnd to the flat bolt end face
    expect(topPts[topPts.length - 1].y).toBeCloseTo(-(d / 2 - c), 2);
    expect(botPts[0].y).toBeCloseTo(+(d / 2 - c), 2);

    // In chamfer zone (xChamfer to xEnd), crests are bounded by 45° envelope
    const chamferPts = topPts.filter((pt) => pt.x >= xChamfer && pt.x <= xEnd);
    expect(chamferPts.length).toBeGreaterThan(4);
    for (const pt of chamferPts) {
      const envelopeY = -(d / 2 - (pt.x - xChamfer));
      expect(pt.y).toBeGreaterThanOrEqual(envelopeY - 1e-4);
    }
  });

  it('stud bolt ends have continuous DIN 78 45° chamfers and smooth contour without broken tips', async () => {
    const { getTopToothPoints, getBottomToothPoints } = await import('@/components/modules/mechanical/boltMmSvg');
    const d = 16;
    const d3 = 13.546;
    const P = 2.0;
    const c = 2.0;
    const bm = 20;

    const tapTop = getTopToothPoints(0, bm, bm, d, d3, P, 0.4 * P, {
      xChamferLeft: c,
      cLeft: c,
      vanishRight: true,
    });
    const tapBot = getBottomToothPoints(0, bm, bm, d, d3, P, 0.4 * P, {
      xChamferLeft: c,
      cLeft: c,
      vanishRight: true,
    });

    const nutTop = getTopToothPoints(35, 65, 63, d, d3, P, 0.4 * P, {
      vanishLeft: true,
      xChamferRight: 63,
    });
    const nutBot = getBottomToothPoints(35, 65, 63, d, d3, P, 0.4 * P, {
      vanishLeft: true,
      xChamferRight: 63,
    });

    // Verify left tip starts cleanly at flat face: x=0, y=-(d/2 - c)
    expect(tapTop[0].x).toBe(0);
    expect(tapTop[0].y).toBeCloseTo(-(d / 2 - c), 2);
    // Verify left tip ends cleanly at flat face: x=0, y=+(d/2 - c)
    expect(tapBot[tapBot.length - 1].x).toBe(0);
    expect(tapBot[tapBot.length - 1].y).toBeCloseTo(+(d / 2 - c), 2);

    // Verify right tip ends cleanly at flat face: x=65, y=-(d/2 - c)
    expect(nutTop[nutTop.length - 1].x).toBe(65);
    expect(nutTop[nutTop.length - 1].y).toBeCloseTo(-(d / 2 - c), 2);
    // Verify right tip starts cleanly at flat face: x=65, y=+(d/2 - c)
    expect(nutBot[0].x).toBe(65);
    expect(nutBot[0].y).toBeCloseTo(+(d / 2 - c), 2);

    // Verify 45° chamfer linearity on tap end
    for (const pt of tapTop.filter((p) => p.x <= c)) {
      expect(pt.y).toBeCloseTo(-(d / 2 - c + pt.x), 2);
    }
    // Verify 45° chamfer linearity on nut end
    for (const pt of nutTop.filter((p) => p.x >= 63)) {
      expect(pt.y).toBeCloseTo(-(d / 2 - (pt.x - 63)), 2);
    }
  });
});


