/**
 * AluCalc OS — Export Utilities
 * 
 * SVG and DXF export functions for parametric visualizations.
 * Supports download, clipboard copy, and format conversions.
 */

// ============================================
// Types
// ============================================

export interface ExportOptions {
    filename?: string;
    scale?: number;
    backgroundColor?: string;
    includeAnnotations?: boolean;
}

export interface DXFEntity {
    type: 'LINE' | 'CIRCLE' | 'ARC' | 'POLYLINE' | 'TEXT';
    layer?: string;
    color?: number;
    data: Record<string, number | string | number[]>;
}

// ============================================
// SVG Export
// ============================================

/**
 * Download SVG as file
 */
export function downloadSVG(
    svgContent: string,
    filename: string = 'visualization.svg'
): void {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Copy SVG to clipboard
 */
export async function copySVGToClipboard(svgContent: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(svgContent);
        return true;
    } catch (error) {
        console.error('Failed to copy SVG to clipboard:', error);
        return false;
    }
}

/**
 * Convert SVG to PNG and download
 */
export async function downloadPNG(
    svgContent: string,
    options: ExportOptions = {}
): Promise<void> {
    const {
        filename = 'visualization.png',
        scale = 2,
        backgroundColor = '#0a0e14',
    } = options;

    return new Promise((resolve, reject) => {
        // Parse SVG to get dimensions
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');

        if (!svgElement) {
            reject(new Error('Invalid SVG content'));
            return;
        }

        // Get dimensions from viewBox or width/height attributes
        const viewBox = svgElement.getAttribute('viewBox');
        let width = parseFloat(svgElement.getAttribute('width') || '400');
        let height = parseFloat(svgElement.getAttribute('height') || '300');

        if (viewBox) {
            const parts = viewBox.split(' ').map(parseFloat);
            if (parts.length === 4) {
                width = parts[2];
                height = parts[3];
            }
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
        }

        // Fill background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Create image from SVG
        const img = new Image();
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);

            // Download
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Failed to create PNG blob'));
                    return;
                }

                const downloadUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(downloadUrl);

                resolve();
            }, 'image/png');
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load SVG image'));
        };

        img.src = url;
    });
}

// ============================================
// DXF Export
// ============================================

/**
 * DXF Header section
 */
function generateDXFHeader(): string {
    return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
9
$INSUNITS
70
4
0
ENDSEC
`;
}

/**
 * DXF Tables section (minimal)
 */
function generateDXFTables(): string {
    return `0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
1
0
LAYER
2
0
70
0
62
7
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
`;
}

/**
 * DXF Entities section header
 */
function generateDXFEntitiesHeader(): string {
    return `0
SECTION
2
ENTITIES
`;
}

/**
 * Generate DXF LINE entity
 */
function generateDXFLine(
    x1: number, y1: number,
    x2: number, y2: number,
    layer: string = '0'
): string {
    return `0
LINE
8
${layer}
10
${x1.toFixed(6)}
20
${y1.toFixed(6)}
30
0.0
11
${x2.toFixed(6)}
21
${y2.toFixed(6)}
31
0.0
`;
}

/**
 * Generate DXF CIRCLE entity
 */
function generateDXFCircle(
    cx: number, cy: number,
    radius: number,
    layer: string = '0'
): string {
    return `0
CIRCLE
8
${layer}
10
${cx.toFixed(6)}
20
${cy.toFixed(6)}
30
0.0
40
${radius.toFixed(6)}
`;
}

/**
 * Generate DXF ARC entity
 */
function generateDXFArc(
    cx: number, cy: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    layer: string = '0'
): string {
    return `0
ARC
8
${layer}
10
${cx.toFixed(6)}
20
${cy.toFixed(6)}
30
0.0
40
${radius.toFixed(6)}
50
${startAngle.toFixed(6)}
51
${endAngle.toFixed(6)}
`;
}

/**
 * Generate DXF POLYLINE (lightweight)
 */
function generateDXFPolyline(
    points: { x: number; y: number }[],
    closed: boolean = false,
    layer: string = '0'
): string {
    let dxf = `0
LWPOLYLINE
8
${layer}
90
${points.length}
70
${closed ? 1 : 0}
`;

    for (const point of points) {
        dxf += `10
${point.x.toFixed(6)}
20
${point.y.toFixed(6)}
`;
    }

    return dxf;
}

/**
 * DXF Footer
 */
function generateDXFFooter(): string {
    return `0
ENDSEC
0
EOF
`;
}

/**
 * Convert SVG path to DXF polyline points
 * Simplified - handles M, L, and Z commands
 */
function parseSVGPath(pathData: string): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const commands = pathData.match(/[MLHVCAZmlhvcaz][^MLHVCAZmlhvcaz]*/g) || [];

    let currentX = 0;
    let currentY = 0;

    for (const cmd of commands) {
        const type = cmd[0];
        const coords = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));

        switch (type) {
            case 'M':
            case 'L':
                for (let i = 0; i < coords.length; i += 2) {
                    currentX = coords[i];
                    currentY = coords[i + 1];
                    points.push({ x: currentX, y: currentY });
                }
                break;
            case 'm':
            case 'l':
                for (let i = 0; i < coords.length; i += 2) {
                    currentX += coords[i];
                    currentY += coords[i + 1];
                    points.push({ x: currentX, y: currentY });
                }
                break;
            case 'H':
                currentX = coords[0];
                points.push({ x: currentX, y: currentY });
                break;
            case 'h':
                currentX += coords[0];
                points.push({ x: currentX, y: currentY });
                break;
            case 'V':
                currentY = coords[0];
                points.push({ x: currentX, y: currentY });
                break;
            case 'v':
                currentY += coords[0];
                points.push({ x: currentX, y: currentY });
                break;
            case 'Z':
            case 'z':
                // Close path - handled by closed flag
                break;
        }
    }

    return points;
}

/**
 * Convert SVG content to DXF format
 */
export function convertSVGtoDXF(svgContent: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');

    let entities = '';

    // Process circles
    doc.querySelectorAll('circle').forEach(circle => {
        const cx = parseFloat(circle.getAttribute('cx') || '0');
        const cy = parseFloat(circle.getAttribute('cy') || '0');
        const r = parseFloat(circle.getAttribute('r') || '0');

        if (r > 0) {
            entities += generateDXFCircle(cx, cy, r);
        }
    });

    // Process lines
    doc.querySelectorAll('line').forEach(line => {
        const x1 = parseFloat(line.getAttribute('x1') || '0');
        const y1 = parseFloat(line.getAttribute('y1') || '0');
        const x2 = parseFloat(line.getAttribute('x2') || '0');
        const y2 = parseFloat(line.getAttribute('y2') || '0');

        entities += generateDXFLine(x1, y1, x2, y2);
    });

    // Process rects
    doc.querySelectorAll('rect').forEach(rect => {
        const x = parseFloat(rect.getAttribute('x') || '0');
        const y = parseFloat(rect.getAttribute('y') || '0');
        const width = parseFloat(rect.getAttribute('width') || '0');
        const height = parseFloat(rect.getAttribute('height') || '0');

        if (width > 0 && height > 0) {
            const points = [
                { x, y },
                { x: x + width, y },
                { x: x + width, y: y + height },
                { x, y: y + height },
            ];
            entities += generateDXFPolyline(points, true);
        }
    });

    // Process paths
    doc.querySelectorAll('path').forEach(path => {
        const d = path.getAttribute('d');
        if (d) {
            const points = parseSVGPath(d);
            if (points.length >= 2) {
                const isClosed = d.toLowerCase().includes('z');
                entities += generateDXFPolyline(points, isClosed);
            }
        }
    });

    // Process polylines
    doc.querySelectorAll('polyline').forEach(polyline => {
        const pointsStr = polyline.getAttribute('points') || '';
        const coords = pointsStr.trim().split(/[\s,]+/).map(parseFloat);
        const points: { x: number; y: number }[] = [];

        for (let i = 0; i < coords.length; i += 2) {
            if (!isNaN(coords[i]) && !isNaN(coords[i + 1])) {
                points.push({ x: coords[i], y: coords[i + 1] });
            }
        }

        if (points.length >= 2) {
            entities += generateDXFPolyline(points, false);
        }
    });

    // Assemble full DXF
    return generateDXFHeader() +
        generateDXFTables() +
        generateDXFEntitiesHeader() +
        entities +
        generateDXFFooter();
}

/**
 * Download DXF file
 */
export function downloadDXF(
    svgContent: string,
    filename: string = 'visualization.dxf'
): void {
    const dxfContent = convertSVGtoDXF(svgContent);
    const blob = new Blob([dxfContent], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.dxf') ? filename : `${filename}.dxf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

// ============================================
// Export All
// ============================================

export const exportUtils = {
    downloadSVG,
    downloadPNG,
    downloadDXF,
    copySVGToClipboard,
    convertSVGtoDXF,
};

export default exportUtils;
