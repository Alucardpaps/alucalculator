export interface Point2D { x: number; y: number; }

export interface EngineeringGeometry {
    type: 'profile' | 'assembly';
    metadata: {
        title: string;
        description?: string;
    };
    // 2D Data for SVG
    technical2D: {
        outline: Point2D[]; // The main shape
        circles: Array<{ cx: number; cy: number; r: number; style: 'solid' | 'dashed' | 'center' }>;
        lines: Array<{ x1: number; y1: number; x2: number; y2: number; style: 'solid' | 'dashed' | 'center' }>;
        dimensions: Array<{
            x1: number; y1: number;
            x2: number; y2: number;
            label: string;
            offset?: number;
        }>;
    };
    // 3D Data for Three.js
    model3D?: {
        type: 'extrusion' | 'revolution' | 'mesh';
        path?: Point2D[];
        thickness?: number;
    };
}
