import { describe, it, expect } from 'vitest';
import { detectAndAssembleFasteners, findMatchingBolt, vec3Distance } from '@/lib/engine/autoAssemblyEngine';
import type { WorkspaceComponent } from '@/lib/types/v5-types';

describe('AI-Assisted Fastener Auto-Detection Protocol', () => {
  it('correctly matches standard ISO 4014 bolts by hole diameter and span length', () => {
    const boltM6 = findMatchingBolt(6, 20);
    expect(boltM6.name).toBe('M6x25');
    expect(boltM6.diameter).toBe(6);

    const boltM8 = findMatchingBolt(8, 30);
    expect(boltM8.name).toBe('M8x35');
    expect(boltM8.diameter).toBe(8);

    const boltM10 = findMatchingBolt(10, 45);
    expect(boltM10.name).toBe('M10x50');
    expect(boltM10.diameter).toBe(10);
  });

  it('calculates 3D Euclidean vector distance accurately', () => {
    const p1: [number, number, number] = [0, 0, 0];
    const p2: [number, number, number] = [3, 4, 0];
    expect(vec3Distance(p1, p2)).toBe(5);
  });

  it('detects mating joint between profile and bracket and inserts standard bolt', () => {
    const profile: WorkspaceComponent = {
      id: 'profile-1',
      type: 'profile',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      connections: [],
      metadata: { length: 500 },
      modifiers: [],
      isValid: false,
      validationErrors: []
    };

    const bracket: WorkspaceComponent = {
      id: 'bracket-1',
      type: 'bracket',
      position: [0.1, 0, 0], // adjacent to profile
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      connections: [],
      metadata: {},
      modifiers: [],
      isValid: false,
      validationErrors: []
    };

    const components: Record<string, WorkspaceComponent> = {
      'profile-1': profile,
      'bracket-1': bracket
    };

    const result = detectAndAssembleFasteners(components);

    expect(result.fastenersAdded).toBe(1);
    expect(result.newComponents.length).toBe(1);
    expect(result.newComponents[0].type).toBe('bolt');
    expect(result.newComponents[0].connections).toContain('bracket-1');
    expect(result.newComponents[0].connections).toContain('profile-1');
    expect(result.suggestions[0].sizeName).toContain('ISO 4014');
  });

  it('detects aligned cylindrical holes across two components and inserts bolt', () => {
    const compA: WorkspaceComponent = {
      id: 'plate-1',
      type: 'profile',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      connections: [],
      metadata: {},
      modifiers: [
        { id: 'hole-1', type: 'HOLE', x: 50, y: 0, diameter: 8, depth: 10 }
      ],
      isValid: true,
      validationErrors: []
    };

    const compB: WorkspaceComponent = {
      id: 'plate-2',
      type: 'profile',
      position: [0.05, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      connections: [],
      metadata: {},
      modifiers: [
        { id: 'hole-2', type: 'HOLE', x: 50, y: 0, diameter: 8, depth: 10 }
      ],
      isValid: true,
      validationErrors: []
    };

    const components = {
      'plate-1': compA,
      'plate-2': compB
    };

    const result = detectAndAssembleFasteners(components);
    expect(result.fastenersAdded).toBeGreaterThanOrEqual(1);
    expect(result.newComponents[0].type).toBe('bolt');
    expect(result.newComponents[0].metadata.material).toBe('Steel 8.8');
  });
});
