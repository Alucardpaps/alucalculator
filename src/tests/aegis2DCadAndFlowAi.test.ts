import { describe, it, expect, beforeEach } from 'vitest';
import {
  generate2DCadFromPrompt,
  addGenerated2DCadToStore,
  type Generated2DCadDrawing,
} from '@/engines/cad/Aegis2DCadEngine';
import {
  generateFlowPipelineFromPrompt,
  loadFlowPipelineIntoStore,
  transferFlowPipelineToCad,
  type GeneratedFlowPipeline,
} from '@/flow/engine/AegisFlowEngine';
import { useCadStore } from '@/cad/store/cadStore';
import { useFlowStore } from '@/store/flowStore';
import { useDesignStore } from '@/design-studio/designStore';

describe('AeGiS 2D CAD Drafting Engine', () => {
  beforeEach(() => {
    useCadStore.getState().clearEntities();
  });

  it('generates a DN50 PN16 flange 2D drawing with circles, bolt holes and dimensions', () => {
    const drawing = generate2DCadFromPrompt('DN50 PN16 Boru Flanşı');
    expect(drawing).toBeDefined();
    expect(drawing.entities.length).toBeGreaterThan(5);

    // Verify circles (OD, ID, PCD)
    const circles = drawing.entities.filter((e) => e.geometry.type === 'CIRCLE');
    expect(circles.length).toBeGreaterThanOrEqual(4);

    // Verify dimensions
    const dimensions = drawing.entities.filter((e) => e.geometry.type === 'DIMENSION');
    expect(dimensions.length).toBeGreaterThanOrEqual(1);

    // Verify centerlines
    const centerlines = drawing.entities.filter((e) => e.layerId === 'CENTER' || e.color === '#ef4444');
    expect(centerlines.length).toBeGreaterThanOrEqual(2);
  });

  it('generates an L-bracket 2D drawing with polyline and fastener holes', () => {
    const drawing = generate2DCadFromPrompt('L-Braket 80x80');
    expect(drawing).toBeDefined();
    expect(drawing.entities.some((e) => e.geometry.type === 'POLYLINE')).toBe(true);
    expect(drawing.standards.length).toBeGreaterThan(0);
  });

  it('loads generated 2D CAD entities directly into useCadStore', () => {
    const drawing = generate2DCadFromPrompt('DN50 PN16 Boru Flanşı');
    addGenerated2DCadToStore(drawing);

    const storeEntities = useCadStore.getState().entities;
    expect(storeEntities.length).toBe(drawing.entities.length);
  });
});

describe('AeGiS Flow Engine & CAD Bridge', () => {
  beforeEach(() => {
    useFlowStore.getState().clearFlow();
    useDesignStore.setState({ parts: [] });
    useCadStore.getState().clearEntities();
  });

  it('generates a powertrain calculation pipeline with motor, gear, shaft, and bearing nodes', () => {
    const pipeline = generateFlowPipelineFromPrompt('11 kW motor redüktör mil ve rulman hesabı');
    expect(pipeline).toBeDefined();
    expect(pipeline.nodes.length).toBeGreaterThan(5);
    expect(pipeline.edges.length).toBeGreaterThan(5);

    // Verify presence of core schemas
    const schemaIds = pipeline.nodes.map((n) => (n.data as any).schemaId);
    expect(schemaIds).toContain('input-constant-power');
    expect(schemaIds).toContain('input-constant-rpm');
    expect(schemaIds).toContain('mech-power-torque');
    expect(schemaIds).toContain('mech-gear-spur');
    expect(schemaIds).toContain('mech-torsion');
    expect(schemaIds).toContain('mech-bearing-life');

    // Verify CAD bridge suggestion
    expect(pipeline.cadBridge.suggestedParts.length).toBeGreaterThan(0);
    expect(pipeline.cadBridge.suggestedParts.some((p) => p.kind === 'gear')).toBe(true);
  });

  it('loads pipeline into useFlowStore and executes computation without throwing', () => {
    const pipeline = generateFlowPipelineFromPrompt('11 kW motor redüktör');
    loadFlowPipelineIntoStore(pipeline);

    const state = useFlowStore.getState();
    expect(state.nodes.length).toBe(pipeline.nodes.length);
    expect(state.edges.length).toBe(pipeline.edges.length);

    // Verify graph execution runs
    const summary = state.executeGraph();
    expect(summary).toBeDefined();
    expect(summary.ranAt).toBeGreaterThan(0);
  });

  it('bridges Flow calculation outputs to 2D CAD entities', () => {
    const pipeline = generateFlowPipelineFromPrompt('11 kW motor redüktör mil hesabı');
    const res = transferFlowPipelineToCad(pipeline, '2D');

    expect(res.success).toBe(true);
    const cadEntities = useCadStore.getState().entities;
    expect(cadEntities.length).toBeGreaterThan(0);

    // Pitch circle and dimension checks
    expect(cadEntities.some((e) => e.geometry.type === 'CIRCLE')).toBe(true);
    expect(cadEntities.some((e) => e.geometry.type === 'DIMENSION')).toBe(true);
  });

  it('bridges Flow calculation outputs to 3D CAD parts', () => {
    const pipeline = generateFlowPipelineFromPrompt('11 kW motor redüktör mil hesabı');
    const res = transferFlowPipelineToCad(pipeline, '3D');

    expect(res.success).toBe(true);
    const designParts = useDesignStore.getState().parts;
    expect(designParts.length).toBeGreaterThan(0);
    expect(designParts.some((p) => p.kind === 'cylinder')).toBe(true);
  });

  it('generates a structural beam deflection pipeline with I-beam profile', () => {
    const pipeline = generateFlowPipelineFromPrompt('IPE 200 çelik kiriş sehim ve eğilme gerilmesi');
    expect(pipeline).toBeDefined();
    const schemaIds = pipeline.nodes.map((n) => (n.data as any).schemaId);
    expect(schemaIds).toContain('geom-i-beam');
    expect(schemaIds).toContain('beam-deflection');

    // Test bridge to 2D
    const res2D = transferFlowPipelineToCad(pipeline, '2D');
    expect(res2D.success).toBe(true);
    expect(useCadStore.getState().entities.some((e) => e.geometry.type === 'POLYLINE')).toBe(true);
  });
});
