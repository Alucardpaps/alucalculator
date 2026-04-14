/**
 * engine/snap/SnapStrategy.ts
 * 
 * Defines OSNAP (Object Snap) strategies as plugins.
 * The CAD editor cycles through active strategies to find the closest geometric snap point.
 */

export interface Point2D {
    x: number;
    y: number;
}

export interface SnapResult {
    point: Point2D;
    type: 'endpoint' | 'midpoint' | 'center' | 'intersection' | 'perpendicular' | 'tangent' | 'quadrant' | 'nearest';
    distance: number;
    entityId: string;
}

export interface SnapStrategy {
    id: string;
    isActive: boolean;
    findSnap(mousePos: Point2D, entities: any[], searchRadius: number): SnapResult | null;
}

/**
 * Example Endpoint Strategy.
 * In a full implementation, iterates through lines/arcs to find nearest endpoint.
 */
export class EndpointSnap implements SnapStrategy {
    id = 'endpoint';
    isActive = true;

    findSnap(mousePos: Point2D, entities: any[], searchRadius: number): SnapResult | null {
        let bestSnap: SnapResult | null = null;
        let minDistance = searchRadius;

        for (const entity of entities) {
            if (entity.type === 'line' && entity.points) {
                for (const pt of entity.points) {
                    const dist = Math.hypot(pt.x - mousePos.x, pt.y - mousePos.y);
                    if (dist < minDistance) {
                        minDistance = dist;
                        bestSnap = {
                            point: { x: pt.x, y: pt.y },
                            type: 'endpoint',
                            distance: dist,
                            entityId: entity.id
                        };
                    }
                }
            }
            // ... similar logic for arcs
        }

        return bestSnap;
    }
}
