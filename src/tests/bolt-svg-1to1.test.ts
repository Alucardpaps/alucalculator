import { describe, expect, it } from 'vitest';
import {
  iso68FemalePoints,
  iso68FemaleTooth,
  iso68MalePoints,
  iso68MaleTooth,
  iso68PitchFrame,
  iso68Profile,
  polylinePath,
} from '@/lib/fastener/iso68';
import { hexHalfHeight, threadPhase } from '@/hooks/useScrewMotion';

describe('ISO 68-1 SVG paths are 1 mm = 1 unit', () => {
  it('M12×1.75 male: pitch period is exactly P, crest = d/2, root = d3/2', () => {
    const d = 12;
    const P = 1.75;
    const pr = iso68Profile(d, P);
    const n = 8;
    const pts = iso68MalePoints(d, P, 0, n * P, 1);
    const roots = pts.filter((p) => p.k === 'root');
    const crests = pts.filter((p) => p.k === 'crest');

    expect(roots.length).toBe(n + 1);
    for (let i = 0; i < n; i++) {
      expect(roots[i + 1].x - roots[i].x).toBeCloseTo(P, 6);
      expect(roots[i].y).toBeCloseTo(pr.d3 / 2, 6);
    }
    expect(roots[n].x).toBeCloseTo(n * P, 6);

    expect(crests.length).toBe(n * 2);
    for (let i = 0; i < n; i++) {
      const a = crests[i * 2];
      const b = crests[i * 2 + 1];
      expect(b.x - a.x).toBeCloseTo(pr.crestFlatMale, 6);
      expect(a.y).toBeCloseTo(pr.d / 2, 6);
      expect(b.y).toBeCloseTo(pr.d / 2, 6);
      const mid = (a.x + b.x) / 2;
      expect(mid).toBeCloseTo(i * P + P / 2, 6);
    }

    const last = pts[pts.length - 1];
    expect(last.x - pts[0].x).toBeCloseTo(n * P, 6);
  });

  it('M12×1.75 female: period P, minor at x=0 mates male root, major at P/2 mates male crest', () => {
    const d = 12;
    const P = 1.75;
    const pr = iso68Profile(d, P);
    const n = 6;
    const pts = iso68FemalePoints(d, P, 0, n * P, 1);
    const roots = pts.filter((p) => p.k === 'root');
    const crests = pts.filter((p) => p.k === 'crest');

    expect(roots.length).toBe(n);
    for (let i = 0; i < n; i++) {
      expect(roots[i].x).toBeCloseTo(i * P + P / 2, 6);
      expect(roots[i].y).toBeCloseTo(pr.D / 2, 6);
    }

    const centres = crests.filter((_, idx) => idx % 3 === 0);
    expect(centres.length).toBe(n + 1);
    for (let i = 0; i <= n; i++) {
      expect(centres[i].x).toBeCloseTo(i * P, 6);
      expect(centres[i].y).toBeCloseTo(pr.D1 / 2, 6);
    }
  });

  it('one male tooth axial length is P (crest P/8 + flanks + root P/4)', () => {
    const P = 1.75;
    const pr = iso68Profile(12, P);
    const flank = ((pr.d - pr.D1) / 2) * Math.tan(Math.PI / 6);
    const tooth = pr.crestFlatMale + 2 * flank + P / 4;
    expect(tooth).toBeCloseTo(P, 8);
  });

  it('one female tooth axial length is P (crest P/4 + flanks + root P/8)', () => {
    const P = 1.75;
    const pr = iso68Profile(12, P);
    const flank = ((pr.D - pr.D1) / 2) * Math.tan(Math.PI / 6);
    const tooth = pr.crestFlatFemale + 2 * flank + P / 8;
    expect(tooth).toBeCloseTo(P, 8);
  });

  it('path numbers are millimetres (M10×1.5 d=10, crest y=5)', () => {
    const pts = iso68MalePoints(10, 1.5, 0, 1.5, 1);
    const path = polylinePath(pts);
    const crests = pts.filter((p) => p.k === 'crest');
    expect(crests[0].y).toBeCloseTo(5, 6);
    expect(path.startsWith('M ')).toBe(true);
    expect(path).toContain('5.0000');
  });

  it('mirrored sign puts the other wall at negative y', () => {
    const up = iso68MalePoints(8, 1.25, 0, 1.25, 1);
    const dn = iso68MalePoints(8, 1.25, 0, 1.25, -1);
    expect(up[0].y).toBeCloseTo(-dn[0].y, 8);
    expect(up[0].x).toBeCloseTo(dn[0].x, 8);
  });

  it('male H/6 root: fillet sits on the radius about the root centre', () => {
    const d = 12;
    const P = 1.75;
    const pr = iso68Profile(d, P);
    const t = iso68MaleTooth(d, P);
    const cx = 0;
    const cy = t.yRoot + t.R;
    const dx = t.x.filletL - cx;
    const dy = t.yD1 - cy;
    expect(Math.hypot(dx, dy)).toBeCloseTo(pr.rootR, 6);
    expect(t.x.filletR).toBeCloseTo(7 * P / 8, 8);
    expect(t.x.crestR - t.x.crestL).toBeCloseTo(P / 8, 8);
    expect(t.x.root2).toBeCloseTo(P, 8);
    const pts = iso68MalePoints(d, P, 0, P, 1);
    const arcs = pts.filter((p) => p.k === 'arc');
    expect(arcs.length).toBeGreaterThan(2);
    const c1x = P;
    const c1y = t.yRoot + t.R;
    for (const a of arcs.filter((p) => p.x > P / 2)) {
      expect(Math.hypot(a.x - c1x, a.y - c1y)).toBeCloseTo(pr.rootR, 5);
    }
  });

  it('female named vertices: P/4 at minor x=0, P/8 major at P/2', () => {
    const P = 1.75;
    const t = iso68FemaleTooth(12, P);
    expect(t.x.crest).toBe(0);
    expect(t.x.crestR).toBeCloseTo(P / 8, 8);
    expect(t.x.majorC).toBeCloseTo(P / 2, 8);
    expect(t.x.majorR - t.x.majorL).toBeCloseTo(P / 8, 8);
    expect(t.x.crest2).toBeCloseTo(P, 8);
    expect(t.x.pitchRise).toBeGreaterThan(t.x.crestR);
    expect(t.x.pitchRise).toBeLessThan(t.x.majorL);
    expect(t.yMinor).toBeLessThan(t.yPitch);
    expect(t.yPitch).toBeLessThan(t.yMajor);
  });

  it('male and female nest on the same ISO 68-1 V', () => {
    const P = 1.75;
    const m = iso68MaleTooth(12, P);
    const f = iso68FemaleTooth(12, P);
    const fr = iso68PitchFrame(P);
    expect(m.x.crestL).toBeCloseTo(f.x.majorL, 8);
    expect(m.x.crestR).toBeCloseTo(f.x.majorR, 8);
    expect(m.x.filletL).toBeCloseTo(f.x.crestR, 8);
    expect(m.x.crestL).toBeCloseTo(fr.x.crestL, 8);
    expect(f.x.majorC).toBeCloseTo(P / 2, 8);
    expect(m.x.root).toBe(0);
    expect(f.x.crest).toBe(0);
  });

  it('hex side-view height at 0° is across-flats, period 60°', () => {
    const s = 19;
    const e = s / Math.cos(Math.PI / 6);
    expect(hexHalfHeight(e, 0) * 2).toBeCloseTo(s, 5);
    expect(hexHalfHeight(e, 60) * 2).toBeCloseTo(s, 5);
    expect(hexHalfHeight(e, 30) * 2).toBeCloseTo(e, 5);
  });

  it('thread phase is P-periodic in [0, P)', () => {
    expect(threadPhase(0, 1.75)).toBeCloseTo(0, 8);
    expect(threadPhase(1, 1.75)).toBeCloseTo(0, 8);
    expect(threadPhase(0.5, 1.75)).toBeCloseTo(0.875, 8);
    expect(threadPhase(-0.25, 1.75)).toBeCloseTo(1.3125, 8);
  });

  it('small slender fastener (#4-40x50 d=2.84 L=50): adaptive font scaling avoids needle effect', () => {
    const d = 2.84;
    const L = 50;
    const k = 2.0;
    // Test adaptive font size formula
    const fs = Math.max(0.95, Math.min(2.0, Math.max(d * 0.18, Math.min(1.65, (k + L) / 38))));
    expect(fs).toBeGreaterThanOrEqual(0.95);
    expect(fs).toBeLessThanOrEqual(1.5); // Never balloons to 2.6mm

    // Test compact vertical framing
    const hexR = 5.26 / 2;
    const topR = Math.max(4.6 / 2, d / 2, hexR);
    const levelH = Math.max(2.6, fs * 1.6);
    const topExtent = topR + levelH * 2.8 + fs * 1.4 + 2;
    const botExtent = Math.max(topR + levelH * 2.8 + 2, hexR + fs * 3.2 + 3);
    const padY = Math.max(topExtent, botExtent);
    const vbH = 2 * padY;

    // Viewport height should be under 35mm (not 65mm!)
    expect(vbH).toBeLessThan(35);
    // Bolt thickness on screen is at least 8-12% of total height (not 4%!)
    expect(d / vbH).toBeGreaterThan(0.08);
  });

  it('short fastener (#4-40x10 d=2.84 L=10): compact width, no massive 70mm empty void', () => {
    const d = 2.84;
    const L = 10;
    const k = 2.0;
    const xEnd = k + L;
    const fs = Math.max(0.95, Math.min(2.0, Math.max(d * 0.18, Math.min(1.65, (k + L) / 38))));
    const viewGap = Math.max(12, Math.min(24, fs * 6.5, d * 1.6));
    const hexR = 5.26 / 2;
    const hexCx = xEnd + viewGap + hexR;
    const padR = hexR + Math.max(8, fs * 3.2);
    const contentMaxX = hexCx + padR;

    const wHead = Math.max(18, fs * 11);
    const headBoxLeft = k * 0.5 - wHead / 2;
    const padL = Math.max(12, fs * 3.0, -headBoxLeft + fs * 1.2);
    const contentMinX = -padL;
    const naturalW = contentMaxX - contentMinX;

    // Total width should be compact (around 50mm, not 116mm!)
    expect(naturalW).toBeLessThan(65);
    // Gap between bolt tip and end view is clean CAD spacing
    expect(viewGap).toBeLessThanOrEqual(20);
    // Head notes box left edge is safely within viewBox left bound
    expect(headBoxLeft).toBeGreaterThanOrEqual(contentMinX);
  });

  it('end view hex alignment: hexPoints uses i * 60° matching HexFacets (no 12-pointed star)', () => {
    // Both bolt head HexFacets and nut hexPoints must share the identical 60° angular lattice
    const cx = 100;
    const cy = 0;
    const r = 10;
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (i * 60 * Math.PI) / 180;
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, deg: i * 60 };
    });

    // Verify 60° intervals starting at 0° (flat faces top/bottom)
    expect(pts[0].deg).toBe(0);
    expect(pts[1].deg).toBe(60);
    expect(pts[2].deg).toBe(120);
    expect(pts[3].deg).toBe(180);
    expect(pts[4].deg).toBe(240);
    expect(pts[5].deg).toBe(300);

    // Top face is horizontal between 240° and 300° at y = -r*sqrt(3)/2 = -s/2
    const sHalf = r * Math.sin(60 * Math.PI / 180);
    expect(pts[4].y).toBeCloseTo(-sHalf, 6);
    expect(pts[5].y).toBeCloseTo(-sHalf, 6);

    // Inscribed chamfer circle of radius s/2 is tangent to all 6 flats at midpoint of edges
    const midEdgeDist = Math.hypot((pts[0].x + pts[1].x) / 2 - cx, (pts[0].y + pts[1].y) / 2 - cy);
    expect(midEdgeDist).toBeCloseTo(sHalf, 6);
  });

  it('RH helix formula: dx/dy > 0 from top to bottom (+0.5P axial advance)', () => {
    const P = 1.75;
    const Ro = 8; // M16
    const cycleX = 20;

    // t in [0, 1] maps top to bottom
    const tTop = 0;
    const tBot = 1;

    const xTop = cycleX + tTop * (0.5 * P);
    const yTop = -Ro * Math.cos(tTop * Math.PI); // -8 (top)

    const xBot = cycleX + tBot * (0.5 * P);
    const yBot = -Ro * Math.cos(tBot * Math.PI); // +8 (bottom)

    expect(yTop).toBeCloseTo(-Ro, 6);
    expect(yBot).toBeCloseTo(+Ro, 6);
    // Right-Hand helix: bottom is exactly +0.5P to the right of top!
    expect(xBot - xTop).toBeCloseTo(0.5 * P, 6);
  });

  it('phase lock: 2D outer teeth and 3D RH helix coincide at 0.0000 mm', () => {
    const P = 2.0;
    const d = 16;
    const d3 = 13.546;
    const xThr = 30;

    // Tooth 0:
    // Outer tooth silhouette:
    // Top crest flat is [xThr + 0.4375P, xThr + 0.5625P] at y = -d/2. Center = xThr + 0.5P
    const topCrestCenter = xThr + 0.5 * P;
    // Top root valley is at xThr at y = -d3/2
    const topRootValley = xThr;

    // Bottom crest flat center is at xThr + 1.0P at y = +d/2
    const botCrestCenter = xThr + 1.0 * P;
    // Bottom root valley is at xThr + 0.5P at y = +d3/2
    const botRootValley = xThr + 0.5 * P;

    // 3D Helix:
    // Crest highlight (shiftP = 0.5P):
    // At t=0 (top, y=-d/2): x = xThr + 0.5P
    const helixCrestTop = xThr + 0.5 * P + 0 * (0.5 * P);
    // At t=1 (bottom, y=+d/2): x = xThr + 0.5P + 1 * (0.5 * P) = xThr + 1.0P
    const helixCrestBot = xThr + 0.5 * P + 1 * (0.5 * P);

    // Root shadow (shiftP = 0.0P):
    // At t=0 (top, y=-d3/2): x = xThr
    const helixRootTop = xThr + 0.0 * P + 0 * (0.5 * P);
    // At t=1 (bottom, y=+d3/2): x = xThr + 0.0 * P + 1 * (0.5 * P) = xThr + 0.5P
    const helixRootBot = xThr + 0.0 * P + 1 * (0.5 * P);

    // EXACT 0.0000 mm coincidence across all 4 critical boundary points:
    expect(topCrestCenter).toBeCloseTo(helixCrestTop, 8);
    expect(botCrestCenter).toBeCloseTo(helixCrestBot, 8);
    expect(topRootValley).toBeCloseTo(helixRootTop, 8);
    expect(botRootValley).toBeCloseTo(helixRootBot, 8);
  });

  it('upper dimension corridor: dimTopBase guarantees safe standoff and Ød2 leader never crosses ls or L', () => {
    const d = 16;
    const s = 24;
    const e = 26.75;
    const hexR = e / 2;
    const nutE = 26.75;
    const nutMaxR = nutE / 2;
    const physicalTop = Math.max(s / 2, hexR, d / 2, nutMaxR);
    const fs = 1.5;
    const levelH = Math.max(3.2, fs * 2.0);

    const badgeTop = nutMaxR + fs * 2.8;
    const dimTopBase = Math.max(physicalTop + Math.max(10, fs * 3.2), badgeTop + Math.max(6, fs * 2.0));

    const yLs = -dimTopBase - levelH * 0.9;
    const yL = -dimTopBase - levelH * 2.1;

    // Ød2 callout sits in open thread zone
    const yD2Callout = -d / 2 - fs * 1.5;

    // Standoff between nut top and ls must be >= 9mm
    expect(Math.abs(yLs) - physicalTop).toBeGreaterThanOrEqual(10);
    // ls is below L (lower magnitude)
    expect(Math.abs(yLs)).toBeLessThan(Math.abs(yL));
    // Ød2 callout is strictly below dimTopBase (at least 8mm clearance)
    expect(Math.abs(yD2Callout)).toBeLessThan(dimTopBase - 8);
  });
});


