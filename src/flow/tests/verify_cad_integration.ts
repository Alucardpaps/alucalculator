
import { FlowEngine } from '../engine/ExecutionEngine';
import { NODE_REGISTRY, registerNode } from '../nodes/Registry';
import { ExposeParameterNode, UpdateGeometryNode } from '../nodes/StandardLibrary/CADIntegration';
import { useCADCanvasStore } from '@/store/CADCanvasStore';
import { Node, Edge } from 'reactflow';

// Mock the store for testing environment (where zustand/react might not be fully active)
// We need to hijack the 'getState' method of useCADCanvasStore if running in tsx without DOM.
// However, tsx runs in node, so 'useCADCanvasStore' (which uses persist/localStorage) might fail or be empty.
// Let's rely on standard mocking via direct assignment if possible, or just try-catch the execution.

// Function to setup mock state
const setupMockCAD = () => {
    // Create a mock state manually 
    useCADCanvasStore.setState({
        dimensions: [
            { id: 'Length_A', value: 150, type: 'linear', displayValue: '150 mm' } as any
        ],
        shapes: [
            { id: 'circle-1', type: 'circle', points: [] } as any
        ]
    });
};

async function verifyCADIntegration() {
    console.log("=========================================");
    console.log("🔗 Verifying CAD <-> Flow Integration");
    console.log("=========================================");

    // 1. Setup Mock Data
    try {
        setupMockCAD();
        console.log("✅ Mock CAD Store Initialized");
    } catch (e) {
        console.warn("⚠️ Could not init mock store (environment issue?):", e);
    }

    // 2. Register Nodes
    registerNode(ExposeParameterNode);
    registerNode(UpdateGeometryNode);

    // 3. Build Graph
    // Scenario: Read 'Length_A' (150) -> Drive 'circle-1' Radius
    const nodes: Node[] = [
        { id: 'readParam', position: { x: 0, y: 0 }, data: { schemaId: 'cad-expose-parameter', paramName: 'Length_A' }, type: 'custom' },
        { id: 'driveGeo', position: { x: 0, y: 0 }, data: { schemaId: 'cad-update-geometry', entityId: 'circle-1', property: 'radius' }, type: 'custom' }
    ];

    const edges: Edge[] = [
        { id: 'e1', source: 'readParam', sourceHandle: 'value', target: 'driveGeo', targetHandle: 'value' }
    ];

    // 4. Execute
    const engine = new FlowEngine(nodes, edges, NODE_REGISTRY);
    const result = engine.execute();

    if (!result.success) {
        console.error("❌ Execution Failed:", result.errors);
        return;
    }

    // 5. Verify Output
    const readVal = result.nodeResults.get('readParam')?.value;
    const writeSuccess = result.nodeResults.get('driveGeo')?.success;

    console.log(`Read Value: ${readVal} (Expected 150)`);
    console.log(`Write Success: ${writeSuccess} (Expected true)`);

    if (readVal === 150 && writeSuccess === true) {
        console.log("✅ CAD Integration PASSED");
    } else {
        console.error("❌ CAD Integration FAILED");
    }
}

verifyCADIntegration().catch(console.error);
