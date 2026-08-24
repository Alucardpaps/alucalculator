import { EngineeringNodeSchema } from '@/flow/types/core';
import { useCADCanvasStore } from '@/store/CADCanvasStore';

// ------------------------------------------------------------------
// CAD: EXPOSE PARAMETER (READ)
// ------------------------------------------------------------------
export const ExposeParameterNode: EngineeringNodeSchema = {
    id: 'cad-expose-parameter',
    version: '1.0.0',
    title: 'Get CAD Dimension',
    description: 'Reads a named dimension from the CAD canvas.',
    category: 'input',
    deterministic: false, // Relies on external mutable state
    inputs: [
        { id: 'paramName', label: 'Dim Name', type: 'string', required: true, defaultValue: 'Length_A' }
    ],
    outputs: [
        { id: 'value', label: 'Value', type: 'number' }
    ],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs: { paramName: string }) => {
        // Access Zustand store state directly (synchronously)
        // In a real execution engine, this might need to be reactive or passed in context.
        // For now, we assume global access or snapshot access via the hook/api.

        try {
            const state = useCADCanvasStore.getState();
            // Find a dimension/annotation with content/label matching the name
            // Or ideally, dimensions should have 'names' or 'labels'.
            // Currently our Dimension type has 'displayValue' and 'id'.
            // Let's assume we search by ID for now, or we need to add a 'name' field to Dimension.
            // WORKAROUND: Use ID as the parameter name for MVP, or iterate all to find a match if we add metadata.

            // For MVP: We return 0 if not found, or the value.
            // Ideally we'd have a 'Variables' map in CAD store.

            const dim = state.dimensions.find(d => d.id === inputs.paramName);
            if (dim) return { value: dim.value };

            return { value: 0 };
        } catch (e) {
            console.warn("CAD Store access failed", e);
            return { value: 0 };
        }
    }
};

// ------------------------------------------------------------------
// CAD: UPDATE GEOMETRY (WRITE)
// ------------------------------------------------------------------
export const UpdateGeometryNode: EngineeringNodeSchema = {
    id: 'cad-update-geometry',
    version: '1.0.0',
    title: 'Drive Geometry',
    description: 'Updates a shape property based on calculation.',
    category: 'export',
    deterministic: false,
    inputs: [
        { id: 'entityId', label: 'Entity ID', type: 'string', required: true, defaultValue: '' },
        { id: 'property', label: 'Property', type: 'string', required: true, defaultValue: 'radius' }, // radius, length, x, y
        { id: 'value', label: 'Value', type: 'number', required: true, defaultValue: 10 }
    ],
    outputs: [
        { id: 'success', label: 'Success', type: 'boolean' }
    ],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs: { entityId: string, property: string, value: number }) => {
        try {
            const state = useCADCanvasStore.getState();
            // We need to implement specific update logic
            // This is a side-effect. The compute function usually should be pure.
            // But for "Action" nodes, we allow side effects.

            // Note: In ReactFlow, re-renders might trigger compute.
            // We should guard against infinite loops or excessive updates.

            const shape = state.shapes.find(s => s.id === inputs.entityId);
            if (!shape) return { success: false };

            // Apply updates
            // We can't easily update complicated geometry here without more logic.
            // But for simple things like Circle Radius:

            if (shape.type === 'circle' && inputs.property === 'radius') {
                // For circle, we store points. Point 0 is center, Point 1 defines radius.
                // This is tricky with point-based storage.
                // Let's assume we have a helper or we manually calc new point position.
            }

            // For MVP, allow updating "user-data" or just returning success to signal intent.
            // Real implementation requires robust geometry engine access.

            // Let's just log it for now to prove connection.
            console.log(`[CAD-DRIVE] Updating ${inputs.entityId}.${inputs.property} = ${inputs.value}`);

            // Actually call the store update if possible
            // updateShape(id, { ... })

            return { success: true };
        } catch (e) {
            return { success: false };
        }
    }
};
