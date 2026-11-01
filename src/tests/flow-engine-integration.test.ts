import { describe, it, expect } from 'vitest';
import { FlowEngine } from '@/flow/engine/ExecutionEngine';
import { NODE_REGISTRY, registerNode } from '@/flow/nodes/Registry';
import { AddNode, MultiplyNode, SinNode } from '@/flow/nodes/StandardLibrary/Math';
import { IfNode, GreaterNode } from '@/flow/nodes/StandardLibrary/Logic';
import { PointNode, DistanceNode } from '@/flow/nodes/StandardLibrary/Geometry';
import { Node, Edge } from 'reactflow';

describe('Flow Engine - Visual Engineering Graph System', () => {
  it('initializes registry and registers mathematical and logical nodes', () => {
    registerNode(AddNode);
    registerNode(MultiplyNode);
    registerNode(SinNode);
    registerNode(IfNode);
    registerNode(GreaterNode);
    registerNode(PointNode);
    registerNode(DistanceNode);

    expect(NODE_REGISTRY.has('math-add')).toBe(true);
    expect(NODE_REGISTRY.has('math-multiply')).toBe(true);
    expect(NODE_REGISTRY.has('logic-if')).toBe(true);
    expect(NODE_REGISTRY.has('geo-distance')).toBe(true);
  });

  it('executes a multi-node calculation graph deterministically', () => {
    const nodes: Node[] = [
      { id: 'nodeA', position: { x: 0, y: 0 }, data: { schemaId: 'math-add', a: 10, b: 0 }, type: 'custom' },
      { id: 'nodeB', position: { x: 0, y: 0 }, data: { schemaId: 'math-add', a: 20, b: 0 }, type: 'custom' },
      { id: 'sumNode', position: { x: 0, y: 0 }, data: { schemaId: 'math-add' }, type: 'custom' },
      { id: 'checkNode', position: { x: 0, y: 0 }, data: { schemaId: 'logic-greater', b: 25 }, type: 'custom' },
      { id: 'trueCalc', position: { x: 0, y: 0 }, data: { schemaId: 'math-multiply', b: 2 }, type: 'custom' },
      { id: 'falseCalc', position: { x: 0, y: 0 }, data: { schemaId: 'math-multiply', b: 0.5 }, type: 'custom' },
      { id: 'ifNode', position: { x: 0, y: 0 }, data: { schemaId: 'logic-if' }, type: 'custom' },
    ];

    const edges: Edge[] = [
      { id: 'e1', source: 'nodeA', sourceHandle: 'result', target: 'sumNode', targetHandle: 'a' },
      { id: 'e2', source: 'nodeB', sourceHandle: 'result', target: 'sumNode', targetHandle: 'b' },
      { id: 'e3', source: 'sumNode', sourceHandle: 'result', target: 'checkNode', targetHandle: 'a' },
      { id: 'e4', source: 'sumNode', sourceHandle: 'result', target: 'trueCalc', targetHandle: 'a' },
      { id: 'e5', source: 'sumNode', sourceHandle: 'result', target: 'falseCalc', targetHandle: 'a' },
      { id: 'e6', source: 'checkNode', sourceHandle: 'result', target: 'ifNode', targetHandle: 'condition' },
      { id: 'e7', source: 'trueCalc', sourceHandle: 'result', target: 'ifNode', targetHandle: 'trueVal' },
      { id: 'e8', source: 'falseCalc', sourceHandle: 'result', target: 'ifNode', targetHandle: 'falseVal' },
    ];

    const engine = new FlowEngine(nodes, edges, NODE_REGISTRY);
    const result = engine.execute();

    expect(result.success).toBe(true);
    const ifResult = result.nodeResults.get('ifNode');
    expect(ifResult?.result).toBe(60);
  });

  it('computes 2D point Euclidean distance geometry node pipeline', () => {
    const nodes: Node[] = [
      { id: 'dist', position: { x: 0, y: 0 }, data: { schemaId: 'geo-distance', x1: 0, y1: 0, x2: 3, y2: 4 }, type: 'custom' },
    ];

    const edges: Edge[] = [];

    const engine = new FlowEngine(nodes, edges, NODE_REGISTRY);
    const result = engine.execute();

    expect(result.success).toBe(true);
    const distOutput = result.nodeResults.get('dist');
    expect(distOutput?.result).toBe(5);
  });

  it('detects cyclic dependencies and rejects unstable execution loops', () => {
    const cyclicNodes: Node[] = [
      { id: 'node1', position: { x: 0, y: 0 }, data: { schemaId: 'math-add' }, type: 'custom' },
      { id: 'node2', position: { x: 0, y: 0 }, data: { schemaId: 'math-add' }, type: 'custom' },
    ];

    const cyclicEdges: Edge[] = [
      { id: 'ce1', source: 'node1', sourceHandle: 'result', target: 'node2', targetHandle: 'a' },
      { id: 'ce2', source: 'node2', sourceHandle: 'result', target: 'node1', targetHandle: 'a' },
    ];

    const engine = new FlowEngine(cyclicNodes, cyclicEdges, NODE_REGISTRY);
    const result = engine.execute();

    expect(result.success).toBe(false);
    expect(result.errors.has('GRAPH')).toBe(true);
  });

  it('executes all industrial engineering templates deterministically with valid outputs and DXF', async () => {
    const { ENGINEERING_TEMPLATES } = await import('@/flow/templates/engineeringTemplates');
    expect(ENGINEERING_TEMPLATES.length).toBe(39);

    for (const template of ENGINEERING_TEMPLATES) {
      const engine = new FlowEngine(template.nodes as Node[], template.edges as Edge[], NODE_REGISTRY);
      const result = engine.execute();

      expect(result.success, `Template ${template.title} execution failed: ${Array.from(result.errors.values()).join(', ')}`).toBe(true);
      expect(result.nodeResults.size).toBeGreaterThan(0);

      // Verify specific outputs for spur gear template
      if (template.id === 'template-spur-gear-dxf') {
        const gearResult = result.nodeResults.get('gear-core');
        expect(gearResult).toBeDefined();
        expect(gearResult?.pitch_diameter_mm).toBe(54); // m=3, z1=18 => 54mm
        expect(gearResult?.center_distance_mm).toBe(108); // 3*(18+54)/2 = 108mm
        expect(typeof gearResult?.geometry).toBe('string');
        expect((gearResult?.geometry as string).includes('SECTION')).toBe(true);
      }

      // Verify beam deflection template
      if (template.id === 'template-beam-deflection-sf') {
        const beamResult = result.nodeResults.get('beam-core');
        expect(beamResult).toBeDefined();
        expect(beamResult?.deflection).toBeGreaterThan(0);
        expect(beamResult?.stress).toBeGreaterThan(0);
      }
    }
  });
});

