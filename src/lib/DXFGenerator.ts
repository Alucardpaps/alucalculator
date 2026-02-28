import { CADShape, Dimension, Annotation } from '@/store/CADCanvasStore';

export class DXFGenerator {
    private content: string[] = [];

    constructor() {
        this.header();
        this.tables();
        this.blocks();
        this.entitiesStart();
    }

    private add(line: string) {
        this.content.push(line);
    }

    private pair(code: number, value: string | number) {
        this.add(code.toString());
        this.add(value.toString());
    }

    private header() {
        this.add('0'); this.add('SECTION');
        this.add('2'); this.add('HEADER');
        this.add('9'); this.add('$ACADVER');
        this.add('1'); this.add('AC1015'); // AutoCAD 2000
        this.add('9'); this.add('$INSUNITS');
        this.add('70'); this.add('4'); // 4 = mm
        this.add('9'); this.add('$DIMTXT'); // Text height default
        this.add('40'); this.add('2.5');
        this.add('0'); this.add('ENDSEC');
    }

    private tables() {
        this.add('0'); this.add('SECTION');
        this.add('2'); this.add('TABLES');
        this.add('0'); this.add('TABLE');
        this.add('2'); this.add('LAYER');
        this.add('70'); this.add('1');
        this.add('0'); this.add('LAYER');
        this.add('2'); this.add('0');
        this.add('70'); this.add('0');
        this.add('62'); this.add('7'); // Color white/black
        this.add('6'); this.add('CONTINUOUS');
        this.add('0'); this.add('ENDTAB');
        this.add('0'); this.add('ENDSEC');
    }

    private blocks() {
        this.add('0'); this.add('SECTION');
        this.add('2'); this.add('BLOCKS');
        this.add('0'); this.add('ENDSEC');
    }

    private entitiesStart() {
        this.add('0'); this.add('SECTION');
        this.add('2'); this.add('ENTITIES');
    }

    public addLine(x1: number, y1: number, x2: number, y2: number, layer: string = '0', color: number = 7) {
        this.add('0'); this.add('LINE');
        this.pair(8, layer);    // Layer
        this.pair(62, color);   // Color
        this.pair(10, x1); this.pair(20, y1); this.pair(30, 0); // Start
        this.pair(11, x2); this.pair(21, y2); this.pair(31, 0); // End
    }

    public addCircle(cx: number, cy: number, r: number, layer: string = '0', color: number = 7) {
        this.add('0'); this.add('CIRCLE');
        this.pair(8, layer);
        this.pair(62, color);
        this.pair(10, cx); this.pair(20, cy); this.pair(30, 0);
        this.pair(40, r);
    }

    public addPolyline(points: { x: number, y: number }[], closed: boolean = false, layer: string = '0', color: number = 7) {
        // Use LWPOLYLINE for 2D polyline which is more modern/compact than POLYLINE
        this.add('0'); this.add('LWPOLYLINE');
        this.add('5'); this.add('200'); // Handle (arbitrary)
        this.add('100'); this.add('AcDbEntity');
        this.pair(8, layer);
        this.pair(62, color);
        this.add('100'); this.add('AcDbPolyline');
        this.pair(90, points.length); // Number of vertices
        this.pair(70, closed ? 1 : 0); // 1 = Closed
        this.pair(43, 0.0); // Constant width (optional but good for compatibility)

        points.forEach(p => {
            this.pair(10, p.x);
            this.pair(20, p.y);
        });
    }

    public addText(text: string, x: number, y: number, height: number, layer: string = '0', color: number = 7) {
        this.add('0'); this.add('TEXT');
        this.pair(8, layer);
        this.pair(62, color);
        this.pair(10, x); this.pair(20, y); this.pair(30, 0);
        this.pair(40, height);
        this.pair(1, text);
    }

    public generate(): string {
        this.add('0'); this.add('ENDSEC'); // End ENTITIES
        this.add('0'); this.add('EOF');
        return this.content.join('\n');
    }
}

export function generateDXF(shapes: CADShape[], dimensions: Dimension[], annotations: Annotation[]): string {
    const dxf = new DXFGenerator();

    // Shapes
    shapes.forEach(shape => {
        if (!shape.visible) return;

        // Flip Y coordinate because screen Y is down, CAD Y is up
        // We will neglect exact coordinate mapping for now and just invert Y

        const color = 7; // Default white

        switch (shape.type) {
            case 'line':
                if (shape.points.length >= 2) {
                    dxf.addLine(shape.points[0].x, -shape.points[0].y, shape.points[1].x, -shape.points[1].y, 'Shapes', color);
                }
                break;
            case 'rectangle':
            case 'polyline':
                const pts = shape.points.map(p => ({ x: p.x, y: -p.y }));
                // Rectangle needs explicit closure if it's stored as 2 corner points in 'rectangle' type, 
                // but usually stored as 4-5 points or 2 diagonal. 
                // Assuming 'rectangle' shape has 2 points (diagonal), we need to generate 4 points.
                if (shape.type === 'rectangle' && shape.points.length === 2) {
                    const p1 = shape.points[0];
                    const p2 = shape.points[1];
                    const rectPts = [
                        { x: p1.x, y: -p1.y },
                        { x: p2.x, y: -p1.y },
                        { x: p2.x, y: -p2.y },
                        { x: p1.x, y: -p2.y }
                    ];
                    dxf.addPolyline(rectPts, true, 'Shapes', color);
                } else {
                    dxf.addPolyline(pts, shape.type === 'rectangle', 'Shapes', color);
                }
                break;
            case 'circle':
                if (shape.points.length >= 2) {
                    const radius = Math.sqrt(Math.pow(shape.points[1].x - shape.points[0].x, 2) + Math.pow(shape.points[1].y - shape.points[0].y, 2));
                    dxf.addCircle(shape.points[0].x, -shape.points[0].y, radius, 'Shapes', color);
                }
                break;
        }
    });

    // Dimensions (Explode to lines and text for simplicity)
    dimensions.forEach(dim => {
        const color = 3; // Greenish
        // Dimension line
        dxf.addLine(dim.startPoint.x, -dim.startPoint.y, dim.endPoint.x, -dim.endPoint.y, 'Dimensions', color);
        // Text
        const midX = (dim.startPoint.x + dim.endPoint.x) / 2;
        const midY = (dim.startPoint.y + dim.endPoint.y) / 2;
        dxf.addText(dim.displayValue, midX, -midY, 12, 'Dimensions', color); // Height 12
    });

    // Annotations
    annotations.forEach(ann => {
        if (ann.type === 'text') {
            dxf.addText(ann.content, ann.position.x, -ann.position.y, ann.style.fontSize || 12, 'Annotations', 5); // Blueish
        }
    });

    return dxf.generate();
}
