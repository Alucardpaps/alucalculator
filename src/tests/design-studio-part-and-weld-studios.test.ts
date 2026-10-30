import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignStore, type DesignPart } from '@/design-studio/designStore';
import { usePartStore } from '@/cad/part/partStore';
import { createOrGetPartDoc, openPartInPartStudio } from '@/cad/part/partDocBridge';
import { calculateWeldProperties } from '@/design-studio/weldments/weldmentEngine';
import type { WeldBead } from '@/design-studio/weldments/weldmentTypes';

describe('Design Studio: Part Studio & Weld Studio Architecture', () => {
  beforeEach(() => {
    useDesignStore.setState({
      parts: [],
      weldBeads: [],
      cadMode: 'assembly',
      activeWorkbench: 'assembly',
      isPartStudioOpen: false,
      isWeldStudioOpen: false,
    });
    usePartStore.getState().newPart();
  });

  it('synthesizes a parametric PartDoc for box parts', () => {
    const boxPart: DesignPart = {
      id: 'box-test-1',
      kind: 'box',
      name: 'Box 1',
      color: '#60a5fa',
      visible: true,
      locked: false,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 60, height: 40, depth: 30 },
    };

    const doc = createOrGetPartDoc(boxPart);
    expect(doc).toBeDefined();
    expect(doc.name).toBe('Box 1');
    expect(doc.features.length).toBe(2);

    const sketch = doc.features[0];
    const extrude = doc.features[1];
    expect(sketch.type).toBe('sketch');
    expect(extrude.type).toBe('extrude');
    if (extrude.type === 'extrude') {
      expect(extrude.distance).toBe(40);
    }
  });

  it('synthesizes a parametric PartDoc for cylinder parts', () => {
    const cylPart: DesignPart = {
      id: 'cyl-test-1',
      kind: 'cylinder',
      name: 'Shaft 1',
      color: '#cbd5e1',
      visible: true,
      locked: false,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { radius: 15, height: 80 },
    };

    const doc = createOrGetPartDoc(cylPart);
    expect(doc.features.length).toBe(2);
    expect(doc.features[0].type).toBe('sketch');
    const extrude = doc.features[1];
    if (extrude.type === 'extrude') {
      expect(extrude.distance).toBe(80);
    }
  });

  it('opens assembly part in Part Studio and links the partId', () => {
    const part: DesignPart = {
      id: 'part-to-edit',
      kind: 'box',
      name: 'Bracket A',
      color: '#10b981',
      visible: true,
      locked: false,
      position: { x: 10, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 50, height: 25, depth: 35 },
    };

    useDesignStore.setState({ parts: [part] });

    openPartInPartStudio('part-to-edit');

    const partState = usePartStore.getState();
    const designState = useDesignStore.getState();

    expect(partState.linkedPartId).toBe('part-to-edit');
    expect(partState.doc.name).toBe('Bracket A');
    expect(designState.isPartStudioOpen).toBe(true);
    expect(designState.isWeldStudioOpen).toBe(false);
  });

  it('calculates deterministic Eurocode 3 weld properties for Weld Studio', () => {
    const bead: WeldBead = {
      id: 'weld-1',
      name: 'Fillet Joint 1',
      type: 'fillet',
      standard: 'ISO 2553',
      partAId: 'part-1',
      partBId: 'part-2',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      legSizeMm: 6,
      lengthMm: 100,
      material: 'ER70S-6',
      createdAt: Date.now(),
    };

    const rep = calculateWeldProperties(bead);
    // a = 6 * 0.7071 ~ 4.2mm
    expect(rep.throatThicknessMm).toBeCloseTo(4.2, 1);
    // Leff = L - 2a = 100 - 8.4 = 91.6mm
    expect(rep.effectiveLengthMm).toBeCloseTo(91.6, 1);
    expect(rep.designResistanceKn).toBeGreaterThan(0);
    expect(rep.weldMassKg).toBeGreaterThan(0);
  });

  it('sets assembly mode strictly for mating without part modeling clutter', () => {
    const ds = useDesignStore.getState();
    ds.setCadMode('assembly');

    const state = useDesignStore.getState();
    expect(state.cadMode).toBe('assembly');
    expect(state.activeWorkbench).toBe('assembly');
    expect(state.isPartStudioOpen).toBe(false);
    expect(state.isWeldStudioOpen).toBe(false);
  });
});
