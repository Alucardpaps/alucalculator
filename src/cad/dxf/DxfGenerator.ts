
import { CadEntity, Layer, Point } from '../kernel/types';

/**
 * Generate DXF content from CAD entities
 */
export function generateDXF(entities: CadEntity[], layers: Layer[]): string {
    let dxf = '';
    const N = '\r\n'; // AutoCAD prefers CRLF

    // ─────────────────────────────────────────────────────────────
    // HEADER
    // ─────────────────────────────────────────────────────────────
    dxf += `0${N}SECTION${N}2${N}HEADER${N}`;
    dxf += `9${N}$ACADVER${N}1${N}AC1015${N}`; // AutoCAD 2000 (Required for LWPOLYLINE)
    dxf += `0${N}ENDSEC${N}`;

    // ─────────────────────────────────────────────────────────────
    // TABLES (Layers)
    // ─────────────────────────────────────────────────────────────
    dxf += `0${N}SECTION${N}2${N}TABLES${N}`;

    // Layers Table
    dxf += `0${N}TABLE${N}2${N}LAYER${N}`;

    for (const layer of layers) {
        dxf += `0${N}LAYER${N}`;
        dxf += `2${N}${layer.name}${N}`; // Name
        dxf += `70${N}0${N}`; // Flags

        // Color
        const colorIndex = mapHexToDxfColor(layer.color);
        dxf += `62${N}${colorIndex}${N}`;

        dxf += `6${N}CONTINUOUS${N}`; // Linetype
        dxf += `0${N}`; // End Layer
    }

    dxf += `0${N}ENDTAB${N}`; // End LAYER Table
    dxf += `0${N}ENDSEC${N}`; // End TABLES Section

    // ─────────────────────────────────────────────────────────────
    // ENTITIES
    // ─────────────────────────────────────────────────────────────
    dxf += `0${N}SECTION${N}2${N}ENTITIES${N}`;

    for (const entity of entities) {
        if (!entity.isVisible) continue;

        const layer = layers.find(l => l.id === entity.layerId);
        const layerName = layer ? layer.name : '0';

        switch (entity.geometry.type) {
            case 'LINE':
                dxf += `0${N}LINE${N}`;
                dxf += `8${N}${layerName}${N}`;
                dxf += `10${N}${entity.geometry.start.x}${N}`;
                dxf += `20${N}${entity.geometry.start.y}${N}`;
                dxf += `30${N}0.0${N}`; // Z start
                dxf += `11${N}${entity.geometry.end.x}${N}`;
                dxf += `21${N}${entity.geometry.end.y}${N}`;
                dxf += `31${N}0.0${N}`; // Z end
                break;

            case 'CIRCLE':
                dxf += `0${N}CIRCLE${N}`;
                dxf += `8${N}${layerName}${N}`;
                dxf += `10${N}${entity.geometry.center.x}${N}`;
                dxf += `20${N}${entity.geometry.center.y}${N}`;
                dxf += `30${N}0.0${N}`;
                dxf += `40${N}${entity.geometry.radius}${N}`;
                break;

            case 'POLYLINE':
                // AC1009 POLYLINE (Old style, universally supported)
                // LWPOLYLINE is newer, but POLYLINE is safer for R12.
                // However, R12 POLYLINE requires VERTEX entities and SEQEND.
                // LWPOLYLINE is cleaner if viewer supports >R12.
                // Let's stick to LWPOLYLINE (R14+) as it's standard since 1997.
                // If it fails old AutoCAD, we'd need full POLYLINE/VERTEX/SEQEND structure.

                dxf += `0${N}LWPOLYLINE${N}`;
                dxf += `8${N}${layerName}${N}`;
                dxf += `100${N}AcDbEntity${N}`;
                dxf += `100${N}AcDbPolyline${N}`;
                dxf += `90${N}${entity.geometry.vertices.length}${N}`; // Num vertices
                dxf += `70${N}${entity.geometry.closed ? 1 : 0}${N}`; // Closed flag

                for (const v of entity.geometry.vertices) {
                    dxf += `10${N}${v.x}${N}`;
                    dxf += `20${N}${v.y}${N}`;
                }
                break;

            case 'ARC':
                dxf += `0${N}ARC${N}`;
                dxf += `8${N}${layerName}${N}`;
                dxf += `10${N}${entity.geometry.center.x}${N}`;
                dxf += `20${N}${entity.geometry.center.y}${N}`;
                dxf += `30${N}0.0${N}`;
                dxf += `40${N}${entity.geometry.radius}${N}`;
                // Convert radians to degrees for DXF
                dxf += `50${N}${entity.geometry.startAngle * (180 / Math.PI)}${N}`;
                dxf += `51${N}${entity.geometry.endAngle * (180 / Math.PI)}${N}`;
                break;

            case 'POINT':
                dxf += `0${N}POINT${N}`;
                dxf += `8${N}${layerName}${N}`;
                dxf += `10${N}${entity.geometry.x}${N}`;
                dxf += `20${N}${entity.geometry.y}${N}`;
                dxf += `30${N}0.0${N}`;
                break;

            // case 'TEXT': 
            //    // Not fully supported in types.ts yet
            //    break;


            case 'DIMENSION':
                // Dimensions are complex in DXF (BLOCK + INSERT + DIMENSION entity).
                // Simplified generic DIMENSION for now.
                dxf += `0${N}DIMENSION${N}`;
                dxf += `8${N}${layerName}${N}`;
                dxf += `2${N}*D${entity.id}${N}`; // Block name (pseudo)
                dxf += `10${N}${entity.geometry.start.x}${N}`; // Def point
                dxf += `20${N}${entity.geometry.start.y}${N}`;
                dxf += `30${N}0.0${N}`;
                dxf += `11${N}${entity.geometry.textPoint.x}${N}`; // Text middle point
                dxf += `21${N}${entity.geometry.textPoint.y}${N}`;
                dxf += `31${N}0.0${N}`;
                dxf += `70${N}32${N}`; // Aligned dimension
                dxf += `1${N}${entity.geometry.text}${N}`; // Override text
                break;
        }
    }

    dxf += `0${N}ENDSEC${N}`;
    dxf += `0${N}EOF${N}`;

    return dxf;
}

function mapHexToDxfColor(hex: string): number {
    // Simple mapping for standard colors
    const map: Record<string, number> = {
        '#ff0000': 1, // Red
        '#ffff00': 2, // Yellow
        '#00ff00': 3, // Green
        '#00ffff': 4, // Cyan
        '#0000ff': 5, // Blue
        '#ff00ff': 6, // Magenta
        '#ffffff': 7, // White
        '#000000': 0  // Black/White depending on bg
    };

    // Normalize hex
    const h = hex.toLowerCase();
    if (map[h] !== undefined) return map[h];

    return 7; // Default to white
}
