import { describe, it, expect } from 'vitest';
import { chainAndResolveSketchContours, getContourDiagnosticMessages } from '../design-studio/sketchContourEngine';
import type { SketchEntity } from '../design-studio/designStore';

describe('Sketch Contour Resolution, Gap Healing & Open Profile Engine', () => {
  it('1. should resolve closed primitives (Circle and Polygon as in screenshot)', () => {
    const circleEnt: SketchEntity = {
      id: 'ent-circle-1',
      type: 'circle',
      center: { x: 0, y: 0 },
      radius: 25,
      points: [
        { x: 25, y: 0 },
        { x: 0, y: 25 },
        { x: -25, y: 0 },
        { x: 0, y: -25 },
        { x: 25, y: 0 },
      ],
      isClosed: true,
      isConstruction: false,
      name: 'Daire Ø50',
    };

    const polyEnt: SketchEntity = {
      id: 'ent-poly-1',
      type: 'polygon',
      points: [
        { x: 0, y: 0 },
        { x: 60, y: 15 },
        { x: 60, y: -50 },
        { x: 0, y: -50 },
        { x: 0, y: 0 },
      ],
      isClosed: true,
      isConstruction: false,
      name: 'Çokgen (4 kenar)',
    };

    const contours = chainAndResolveSketchContours([circleEnt, polyEnt]);
    expect(contours.length).toBe(2);
    expect(contours[0].isClosed).toBe(true);
    expect(contours[1].isClosed).toBe(true);
    expect(contours[0].isOpenProfile).toBe(false);
    expect(contours[1].isOpenProfile).toBe(false);
  });

  it('2. should chain multiple individual 2-point line segments into a single closed loop', () => {
    const line1: SketchEntity = {
      id: 'l1',
      type: 'line',
      points: [{ x: 0, y: 0 }, { x: 50, y: 0 }],
      isClosed: false,
      isConstruction: false,
    };
    const line2: SketchEntity = {
      id: 'l2',
      type: 'line',
      points: [{ x: 50, y: 0 }, { x: 50, y: 40 }],
      isClosed: false,
      isConstruction: false,
    };
    const line3: SketchEntity = {
      id: 'l3',
      type: 'line',
      points: [{ x: 50, y: 40 }, { x: 0, y: 40 }],
      isClosed: false,
      isConstruction: false,
    };
    const line4: SketchEntity = {
      id: 'l4',
      type: 'line',
      points: [{ x: 0, y: 40 }, { x: 0, y: 0 }],
      isClosed: false,
      isConstruction: false,
    };

    const contours = chainAndResolveSketchContours([line1, line2, line3, line4]);
    expect(contours.length).toBe(1);
    expect(contours[0].isClosed).toBe(true);
    expect(contours[0].points.length).toBeGreaterThanOrEqual(4);
  });

  it('3. should auto-heal small gaps (e.g. 10mm opening) and provide warning message', () => {
    // 3 lines leaving a 10mm gap between (0, 30) and (0, 0)
    const line1: SketchEntity = {
      id: 'l1',
      type: 'line',
      points: [{ x: 0, y: 0 }, { x: 40, y: 0 }],
      isClosed: false,
      isConstruction: false,
    };
    const line2: SketchEntity = {
      id: 'l2',
      type: 'line',
      points: [{ x: 40, y: 0 }, { x: 40, y: 30 }],
      isClosed: false,
      isConstruction: false,
    };
    const line3: SketchEntity = {
      id: 'l3',
      type: 'line',
      points: [{ x: 40, y: 30 }, { x: 0, y: 10 }], // gap = 10mm to (0, 0)
      isClosed: false,
      isConstruction: false,
    };

    const contours = chainAndResolveSketchContours([line1, line2, line3], [], { gapHealTol: 30 });
    expect(contours.length).toBe(1);
    expect(contours[0].isClosed).toBe(true);
    expect(contours[0].wasGapHealed).toBe(true);
    expect(contours[0].gapSize).toBeCloseTo(10, 0);

    const msgs = getContourDiagnosticMessages(contours, 'tr');
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0]).toContain('açıklık tespit edildi');
  });

  it('4. should convert open profiles (single line or open curve) into Thin Feature ribbons so solids can ALWAYS form', () => {
    const singleOpenLine: SketchEntity = {
      id: 'open-1',
      type: 'line',
      points: [{ x: 0, y: 0 }, { x: 100, y: 50 }],
      isClosed: false,
      isConstruction: false,
      name: 'Açık Çizgi',
    };

    const contours = chainAndResolveSketchContours([singleOpenLine], [], { defaultWallThicknessMm: 3 });
    expect(contours.length).toBe(1);
    expect(contours[0].isOpenProfile).toBe(true);
    // Ribbon is a closed 2D polygon with at least 4 vertices (left and right offsets)
    expect(contours[0].points.length).toBeGreaterThanOrEqual(4);

    const msgs = getContourDiagnosticMessages(contours, 'tr');
    expect(msgs.some((m) => m.includes('Thin Feature') || m.includes('Açık profil'))).toBe(true);
  });
});
