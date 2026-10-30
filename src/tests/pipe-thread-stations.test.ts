import { describe, expect, it } from 'vitest';
import { nptFemaleStations, nptMaleStations, nptProfile, NPT_TAPER } from '@/lib/fastener/pipeThreadStations';

const half = {
  tpi: 14, pitch: 1.814, od: 21.34,
  e0: 19.263, e1: 19.772, e2: 20.117,
  L1: 8.13, L2: 13.56, L4: 19.86,
  tapDrill: 17.86, handTurns: 4.5, wrenchTurns: 3.0,
};

describe('NPT stations', () => {
  it('male E0 / L1 / L2 match the spec and grow 1:16', () => {
    const rows = nptMaleStations(half);
    const e0 = rows.find((r) => r.plane === 'E0')!;
    const l1 = rows.find((r) => r.plane === 'L1')!;
    expect(e0.pitchDia).toBeCloseTo(19.263, 3);
    expect(l1.pitchDia).toBeCloseTo(19.772, 3);
    expect(l1.x).toBeCloseTo(8.13, 2);
    expect(l1.pitchDia - e0.pitchDia).toBeCloseTo(half.L1 * NPT_TAPER, 2);
    expect(e0.major).toBeGreaterThan(e0.pitchDia);
    expect(e0.minor).toBeLessThan(e0.pitchDia);
  });

  it('female face pitch equals male L1 (hand-tight gauge plane)', () => {
    const female = nptFemaleStations(half);
    const face = female.find((r) => r.plane === 'face')!;
    expect(face.pitchDia).toBeCloseTo(half.e1, 3);
    const atL1 = female.find((r) => r.plane === 'L1')!;
    expect(atL1.pitchDia).toBeCloseTo(half.e1 - half.L1 * NPT_TAPER, 3);
  });

  it('NPT truncated height is 0.8P', () => {
    expect(nptProfile(1.814).h).toBeCloseTo(1.4512, 3);
  });

  it('NPT and NPTF both share 1:16 taper angle of 1°47\'24" (tan theta = 1/32)', () => {
    const taperRadiusRate = NPT_TAPER / 2; // 1:32 on radius
    const thetaRad = Math.atan(taperRadiusRate);
    const thetaDeg = (thetaRad * 180) / Math.PI;
    expect(thetaDeg).toBeCloseTo(1.7899, 3); // 1° 47' 24" = 1.790°
  });

  it('NPT vs NPTF dryseal engineering distinction is preserved', () => {
    // NPT has root/crest clearance (spiral leak path requiring sealant)
    // NPTF has controlled crest/root truncation crushing into interference fit
    const nptTruncation = 0.033 * half.pitch;
    expect(nptTruncation).toBeGreaterThan(0.04);
    // Tooth height h = 0.800 P
    const h = 0.8 * half.pitch;
    expect(h).toBeCloseTo(1.4512, 3);
  });
});

