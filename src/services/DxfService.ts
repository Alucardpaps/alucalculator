
import { MetalShape } from "@/hooks/useWeightCalculator";

export const DxfService = {
    generate: (shape: MetalShape, input: any): string => {
        let dxf = `0
SECTION
2
HEADER
0
ENDSEC
0
SECTION
2
TABLES
0
ENDSEC
0
SECTION
2
BLOCKS
0
ENDSEC
0
SECTION
2
ENTITIES
`;

        const addLine = (x1: number, y1: number, x2: number, y2: number) => {
            dxf += `0
LINE
8
0
10
${x1}
20
${y1}
30
0.0
11
${x2}
21
${y2}
31
0.0
`;
        };

        const addCircle = (cx: number, cy: number, r: number) => {
            dxf += `0
CIRCLE
8
0
10
${cx}
20
${cy}
30
0.0
40
${r}
`;
        };

        // Convert inputs to numbers
        const w = parseFloat(input.width || '0');
        const h = parseFloat(input.height || '0');
        const d = parseFloat(input.diameter || '0');
        // const t = parseFloat(input.thickness || '0'); 
        // wall thickness is complex to represent in simple 2D wireframe without boolean ops, 
        // so we'll draw the outer profile for now, maybe inner if pipe.

        switch (shape) {
            case 'box':
                // Draw Rectangle
                addLine(0, 0, w, 0);
                addLine(w, 0, w, h);
                addLine(w, h, 0, h);
                addLine(0, h, 0, 0);
                break;
            case 'sheet':
                // Draw Rectangle (Top View)
                addLine(0, 0, w, 0);
                addLine(w, 0, w, h); // Assuming length for sheet visualization in 2D
                addLine(w, h, 0, h);
                addLine(0, h, 0, 0);
                break;
            case 'pipe':
                // Draw Circle
                addCircle(0, 0, d / 2);
                // Inner circle if wall thickness exists
                if (input.wallThickness) {
                    const wall = parseFloat(input.wallThickness);
                    if (wall < d / 2) {
                        addCircle(0, 0, (d / 2) - wall);
                    }
                }
                break;
            case 'bar':
                // Draw Circle
                addCircle(0, 0, d / 2);
                break;
        }

        dxf += `0
ENDSEC
0
EOF
`;
        return dxf;
    },

    download: (filename: string, content: string) => {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
};
