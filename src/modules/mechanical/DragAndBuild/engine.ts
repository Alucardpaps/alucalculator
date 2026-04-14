/**
 * modules/mechanical/DragAndBuild/engine.ts
 * 
 * Logic for snapping and constraining dragged standard components.
 */

export interface MachineComponent {
    id: string;
    type: 'motor' | 'shaft' | 'bearing' | 'frame' | 'profile' | 'rail';
    name: string;
    connectors: { id: string, type: 'male' | 'female' | 'surface' | 'slot', axis: 'x' | 'y' | 'z', position: { x: number, y: number } }[];
    position: { x: number, y: number };
    rotation?: number; // Added rotation in degrees
}

export interface AssemblyConstraint {
    id: string;
    componentA: string;
    connectorA: string;
    componentB: string;
    connectorB: string;
}

export class AssemblyEngine {
    /**
     * Finds nearest compatible connectors within snap distance.
     */
    static checkSnap(draggingComponent: MachineComponent, allComponents: MachineComponent[], snapDistance: number = 20): MachineComponent | null {
        // Iterate over existing components
        for (const target of allComponents) {
            if (target.id === draggingComponent.id) continue;

            // Check connector compatibility
            for (const c1 of draggingComponent.connectors) {
                for (const c2 of target.connectors) {
                    // Rule 1: Male to Female, or Surface to Surface, or Slot to Slot
                    const compatiblePair =
                        (c1.type === 'male' && c2.type === 'female') ||
                        (c1.type === 'female' && c2.type === 'male') ||
                        (c1.type === 'surface' && c2.type === 'surface') ||
                        (c1.type === 'slot' && c2.type === 'slot') ||
                        (c1.type === 'slot' && c2.type === 'surface') ||
                        (c1.type === 'surface' && c2.type === 'slot');

                    if (!compatiblePair) continue;

                    // Rule 2: Axis alignment check
                    if (c1.axis !== c2.axis) continue;

                    // Calculate global distance
                    const p1x = draggingComponent.position.x + c1.position.x;
                    const p1y = draggingComponent.position.y + c1.position.y;

                    const p2x = target.position.x + c2.position.x;
                    const p2y = target.position.y + c2.position.y;

                    const dist = Math.hypot(p2x - p1x, p2y - p1y);

                    if (dist < snapDistance) {
                        return target; // Found a snap target
                    }
                }
            }
        }
        return null;
    }

    /**
     * Resolves the final position of the dragged component if snapped.
     */
    static applySnap(dragging: MachineComponent, target: MachineComponent): { x: number, y: number } {
        // Find the specific connecting pair that triggered the snap
        let targetC1 = dragging.connectors[0];
        let targetC2 = target.connectors[0];

        // Recalculate which pair was actually closest
        let minDist = Infinity;
        for (const c1 of dragging.connectors) {
            for (const c2 of target.connectors) {
                const compatiblePair =
                    (c1.type === 'male' && c2.type === 'female') ||
                    (c1.type === 'female' && c2.type === 'male') ||
                    (c1.type === 'surface' && c2.type === 'surface') ||
                    (c1.type === 'slot' && c2.type === 'slot') ||
                    (c1.type === 'slot' && c2.type === 'surface') ||
                    (c1.type === 'surface' && c2.type === 'slot');

                if (compatiblePair && c1.axis === c2.axis) {
                    const p1x = dragging.position.x + c1.position.x;
                    const p1y = dragging.position.y + c1.position.y;
                    const p2x = target.position.x + c2.position.x;
                    const p2y = target.position.y + c2.position.y;
                    const dist = Math.hypot(p2x - p1x, p2y - p1y);
                    if (dist < minDist) {
                        minDist = dist;
                        targetC1 = c1;
                        targetC2 = c2;
                    }
                }
            }
        }

        // Align positions so connectors overlap perfectly
        const newX = target.position.x + targetC2.position.x - targetC1.position.x;
        const newY = target.position.y + targetC2.position.y - targetC1.position.y;

        return { x: newX, y: newY };
    }
}
