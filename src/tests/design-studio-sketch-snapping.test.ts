import { describe, expect, it, beforeEach } from 'vitest';
import { useDesignStore } from '../design-studio/designStore';

// Pure modular angle difference helper replicating the algorithm in InteractiveSketchPlane
function diffDeg(a: number, b: number): number {
  return Math.abs(((a - b + 180) % 360 + 360) % 360 - 180);
}

describe('3D Sketch Plane Geometric Snapping Math', () => {
  it('correctly calculates angular differences across 0° / 360° boundaries', () => {
    // 359° and 1° should be 2° apart
    expect(diffDeg(359, 1)).toBe(2);
    expect(diffDeg(1, 359)).toBe(2);

    // 355° and 0° should be 5° apart
    expect(diffDeg(355, 0)).toBe(5);
    expect(diffDeg(0, 355)).toBe(5);

    // Exact opposite angles (180°)
    expect(diffDeg(0, 180)).toBe(180);
    expect(diffDeg(90, 270)).toBe(180);

    // Perpendicular angles (90°)
    expect(diffDeg(45, 135)).toBe(90);
    expect(diffDeg(350, 80)).toBe(90);
  });

  it('correctly snaps to Ortho cardinal axes within 7 degrees', () => {
    const orthoSnap = (deg: number): { snappedDeg: number; badge: string } | null => {
      if (diffDeg(deg, 0) < 7) return { snappedDeg: 0, badge: '⟷ YATAY (0°)' };
      if (diffDeg(deg, 90) < 7) return { snappedDeg: 90, badge: '↕ DİKEY (90°)' };
      if (diffDeg(deg, 180) < 7) return { snappedDeg: 180, badge: '⟷ YATAY (180°)' };
      if (diffDeg(deg, 270) < 7) return { snappedDeg: 270, badge: '↕ DİKEY (270°)' };
      return null;
    };

    expect(orthoSnap(358)).toEqual({ snappedDeg: 0, badge: '⟷ YATAY (0°)' });
    expect(orthoSnap(4)).toEqual({ snappedDeg: 0, badge: '⟷ YATAY (0°)' });
    expect(orthoSnap(93)).toEqual({ snappedDeg: 90, badge: '↕ DİKEY (90°)' });
    expect(orthoSnap(177)).toEqual({ snappedDeg: 180, badge: '⟷ YATAY (180°)' });
    expect(orthoSnap(268)).toEqual({ snappedDeg: 270, badge: '↕ DİKEY (270°)' });

    // Beyond 7 degrees, should not snap
    expect(orthoSnap(15)).toBeNull();
    expect(orthoSnap(45)).toBeNull();
  });

  it('correctly calculates perpendicular snapping relative to previous segment', () => {
    const prevAngle = 45; // Previous segment drawn at 45°
    const perp1 = (prevAngle + 90) % 360;  // 135°
    const perp2 = (prevAngle + 270) % 360; // 315°

    const checkPerp = (deg: number) => {
      if (diffDeg(deg, perp1) < 6) return perp1;
      if (diffDeg(deg, perp2) < 6) return perp2;
      return null;
    };

    expect(checkPerp(138)).toBe(135);
    expect(checkPerp(133)).toBe(135);
    expect(checkPerp(317)).toBe(315);
    expect(checkPerp(120)).toBeNull();
  });
});

describe('DesignStore Sketch State & Loop Closure', () => {
  beforeEach(() => {
    useDesignStore.setState({
      parts: [],
      selectedId: null,
      activeFace: null,
      sketchEntities: [],
      sketchPoints: [],
      sketchClosed: false,
      tool: 'sketch-add',
      pendingOp: 'extrude',
      extrudeDepth: 20,
    });
  });

  it('adds sketch points and snaps to grid', () => {
    const { addSketchPoint } = useDesignStore.getState();
    addSketchPoint({ x: 12.3, y: 34.7 }); // snap is 5 by default

    const pts = useDesignStore.getState().sketchPoints;
    expect(pts).toHaveLength(1);
    expect(pts[0].x).toBe(10);
    expect(pts[0].y).toBe(35);
  });

  it('automatically closes a 3-sided triangle when clicking near start point', () => {
    const { addSketchPoint } = useDesignStore.getState();
    addSketchPoint({ x: 0, y: 0 });       // Point 0
    addSketchPoint({ x: 50, y: 0 });      // Point 1
    addSketchPoint({ x: 25, y: 40 });     // Point 2

    expect(useDesignStore.getState().sketchClosed).toBe(false);
    expect(useDesignStore.getState().sketchPoints).toHaveLength(3);

    // Click near Point 0 (x: 2, y: 3 -> distance < 15 mm)
    addSketchPoint({ x: 2, y: 3 });

    expect(useDesignStore.getState().sketchClosed).toBe(true);
    expect(useDesignStore.getState().sketchPoints).toHaveLength(3); // Popped the duplicate closing point
  });

  it('automatically closes a 4-sided rectangle when clicking near start point', () => {
    const { addSketchPoint } = useDesignStore.getState();
    addSketchPoint({ x: 0, y: 0 });
    addSketchPoint({ x: 100, y: 0 });
    addSketchPoint({ x: 100, y: 50 });
    addSketchPoint({ x: 0, y: 50 });

    expect(useDesignStore.getState().sketchClosed).toBe(false);
    expect(useDesignStore.getState().sketchPoints).toHaveLength(4);

    // Click near Point 0 to close
    addSketchPoint({ x: 0, y: 0 });

    expect(useDesignStore.getState().sketchClosed).toBe(true);
    expect(useDesignStore.getState().sketchPoints).toHaveLength(4);
  });

  it('commits extrude into a 3D solid part centered at centroid', () => {
    const { addSketchPoint, commitExtrude } = useDesignStore.getState();
    addSketchPoint({ x: 0, y: 0 });
    addSketchPoint({ x: 40, y: 0 });
    addSketchPoint({ x: 40, y: 30 });
    addSketchPoint({ x: 0, y: 30 });
    useDesignStore.getState().closeSketch();

    const partId = commitExtrude();
    expect(partId).toBeTruthy();

    const parts = useDesignStore.getState().parts;
    const profilePart = parts.find((p) => p.id === partId);
    expect(profilePart).toBeDefined();
    expect(profilePart?.kind).toBe('profile');
    // Centroid of (0,0) to (40, 30) is x: 20, z: -15 in Three.js ground space (Z = -Y)
    expect(profilePart?.position.x).toBe(20);
    expect(profilePart?.position.z).toBe(-15);
    // Extruded depth is 20, y is depth / 2 = 10
    expect(profilePart?.position.y).toBe(10);
    // Sketch points reset after commit
    expect(useDesignStore.getState().sketchPoints).toHaveLength(0);
    expect(useDesignStore.getState().sketchClosed).toBe(false);
    expect(useDesignStore.getState().tool).toBe('select');
  });
});
