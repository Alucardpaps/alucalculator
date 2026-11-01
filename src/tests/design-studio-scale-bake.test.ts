import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignStore, DEFAULT_DEMO_PART } from '../design-studio/designStore';

describe('Design Studio Scale Baking & Instant3D Dimensions', () => {
  beforeEach(() => {
    useDesignStore.getState().clearScene();
  });

  it('bakes scale into box/plate params and resets scale to (1, 1, 1)', () => {
    const store = useDesignStore.getState();
    const partId = store.addPart('plate');
    const initialPart = useDesignStore.getState().parts.find((p) => p.id === partId)!;

    // Default plate: width: 60, height: 40, depth: 6
    expect(initialPart.params.width).toBe(60);
    expect(initialPart.params.height).toBe(40);
    expect(initialPart.params.depth).toBe(6);
    expect(initialPart.scale).toEqual({ x: 1, y: 1, z: 1 });

    // Simulate Gizmo scaling by 2x on X and 1.5x on Y
    store.updateSelectedTransform({
      scale: { x: 2, y: 1.5, z: 1 },
    });

    const scaledPart = useDesignStore.getState().parts.find((p) => p.id === partId)!;
    expect(scaledPart.scale).toEqual({ x: 2, y: 1.5, z: 1 });

    // Bake scale to parameters
    store.bakeScaleToParams(partId);

    const bakedPart = useDesignStore.getState().parts.find((p) => p.id === partId)!;
    expect(bakedPart.params.width).toBe(120);
    expect(bakedPart.params.height).toBe(60);
    expect(bakedPart.params.depth).toBe(6);
    expect(bakedPart.scale).toEqual({ x: 1, y: 1, z: 1 });
  });

  it('updates dimension labels in the part name when baked', () => {
    const store = useDesignStore.getState();
    const demoPart = { ...DEFAULT_DEMO_PART };
    useDesignStore.setState({ parts: [demoPart], selectedId: demoPart.id });

    expect(demoPart.name).toContain('80x40x10');

    // Scale 2x uniformly
    store.updateSelectedTransform({
      scale: { x: 2, y: 2, z: 2 },
    });

    store.bakeScaleToParams(demoPart.id);

    const bakedPart = useDesignStore.getState().parts.find((p) => p.id === demoPart.id)!;
    expect(bakedPart.params.width).toBe(160);
    expect(bakedPart.params.height).toBe(80);
    expect(bakedPart.params.depth).toBe(20);
    expect(bakedPart.name).toContain('160x80x20');
    expect(bakedPart.scale).toEqual({ x: 1, y: 1, z: 1 });

    // Holes should also have scaled relative positions
    expect(bakedPart.holes?.[0].x).toBe(80); // was 40
    expect(bakedPart.holes?.[0].y).toBe(40); // was 20
    expect(bakedPart.holes?.[0].depth).toBe(20); // was 10
  });

  it('bakes scale for cylinders accurately', () => {
    const store = useDesignStore.getState();
    const partId = store.addPart('cylinder');
    store.updatePartParams(partId, { diameter: 30, length: 50 });

    store.updateSelectedTransform({
      scale: { x: 1.5, y: 2, z: 1.5 },
    });

    store.bakeScaleToParams(partId);

    const bakedPart = useDesignStore.getState().parts.find((p) => p.id === partId)!;
    expect(bakedPart.params.diameter).toBe(45);
    expect(bakedPart.params.length).toBe(100);
    expect(bakedPart.scale).toEqual({ x: 1, y: 1, z: 1 });
  });
});
