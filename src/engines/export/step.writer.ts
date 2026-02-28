/**
 * AluCalculator Engineering Kernel — STEP Writer
 * 
 * ISO-10303-21 AP214 Compliant STEP File Generator
 * 
 * This produces text-based STEP files compatible with:
 * - SolidWorks
 * - Fusion 360
 * - Inventor
 * - FreeCAD
 * - Any ISO-10303 compliant CAD system
 */

// ============================================
// TYPES
// ============================================

export interface STEPEntity {
    id: number;
    type: string;
    params: (string | number | STEPEntityRef)[];
}

export interface STEPEntityRef {
    ref: number;
}

export interface STEPFileOptions {
    filename: string;
    author?: string;
    organization?: string;
    description?: string;
}

// ============================================
// STEP FILE STRUCTURE
// ============================================

export class STEPWriter {
    private entities: STEPEntity[] = [];
    private nextId: number = 1;
    private options: STEPFileOptions;

    constructor(options: STEPFileOptions) {
        this.options = options;
    }

    /**
     * Add entity and return its ID
     */
    addEntity(type: string, params: (string | number | STEPEntityRef)[]): number {
        const id = this.nextId++;
        this.entities.push({ id, type, params });
        return id;
    }

    /**
     * Create entity reference
     */
    ref(id: number): STEPEntityRef {
        return { ref: id };
    }

    /**
     * Generate complete STEP file content
     */
    generate(): string {
        const header = this.generateHeader();
        const data = this.generateData();

        return `${header}${data}`;
    }

    private generateHeader(): string {
        const now = new Date();
        const timestamp = now.toISOString().split('T')[0];

        return `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('${this.options.description || 'AluCalculator Generated STEP'}'), '2;1');
FILE_NAME('${this.options.filename}.step', '${timestamp}', ('${this.options.author || 'AluCalculator'}'), ('${this.options.organization || 'AluCalculator Engineering Kernel'}'), 'AluCalculator STEP Exporter', 'AluCalculator', '');
FILE_SCHEMA(('AUTOMOTIVE_DESIGN'));
ENDSEC;
`;
    }

    private generateData(): string {
        let data = 'DATA;\n';

        for (const entity of this.entities) {
            data += `#${entity.id} = ${entity.type}(${this.formatParams(entity.params)});\n`;
        }

        data += 'ENDSEC;\nEND-ISO-10303-21;\n';
        return data;
    }

    private formatParams(params: (string | number | STEPEntityRef)[]): string {
        return params.map(p => {
            if (typeof p === 'string') {
                if (p.startsWith('.') && p.endsWith('.')) return p; // Enum
                if (p.startsWith('(') || p === '$' || p === '*') return p;
                return `'${p}'`;
            }
            if (typeof p === 'number') {
                return Number.isInteger(p) ? p.toString() : p.toFixed(6);
            }
            if ('ref' in p) return `#${p.ref}`;
            return '';
        }).join(', ');
    }
}

// ============================================
// GEOMETRIC ENTITIES
// ============================================

export function addCartesianPoint(writer: STEPWriter, x: number, y: number, z: number): number {
    return writer.addEntity('CARTESIAN_POINT', ['', `(${x.toFixed(6)}, ${y.toFixed(6)}, ${z.toFixed(6)})`]);
}

export function addDirection(writer: STEPWriter, x: number, y: number, z: number): number {
    return writer.addEntity('DIRECTION', ['', `(${x.toFixed(6)}, ${y.toFixed(6)}, ${z.toFixed(6)})`]);
}

export function addVector(writer: STEPWriter, directionId: number, magnitude: number): number {
    return writer.addEntity('VECTOR', ['', writer.ref(directionId), magnitude]);
}

export function addAxis2Placement3D(
    writer: STEPWriter,
    locationId: number,
    axisId: number,
    refDirectionId: number
): number {
    return writer.addEntity('AXIS2_PLACEMENT_3D', [
        '', writer.ref(locationId), writer.ref(axisId), writer.ref(refDirectionId)
    ]);
}

export function addPlane(writer: STEPWriter, axis2Id: number): number {
    return writer.addEntity('PLANE', ['', writer.ref(axis2Id)]);
}

export function addCircle(writer: STEPWriter, axis2Id: number, radius: number): number {
    return writer.addEntity('CIRCLE', ['', writer.ref(axis2Id), radius]);
}

export function addLine(writer: STEPWriter, pointId: number, vectorId: number): number {
    return writer.addEntity('LINE', ['', writer.ref(pointId), writer.ref(vectorId)]);
}

// ============================================
// TOPOLOGICAL ENTITIES
// ============================================

export function addVertexPoint(writer: STEPWriter, pointId: number): number {
    return writer.addEntity('VERTEX_POINT', ['', writer.ref(pointId)]);
}

export function addEdgeCurve(
    writer: STEPWriter,
    startVertexId: number,
    endVertexId: number,
    curveId: number,
    sameSense: boolean
): number {
    return writer.addEntity('EDGE_CURVE', [
        '', writer.ref(startVertexId), writer.ref(endVertexId),
        writer.ref(curveId), sameSense ? '.T.' : '.F.'
    ]);
}

export function addOrientedEdge(
    writer: STEPWriter,
    edgeCurveId: number,
    orientation: boolean
): number {
    return writer.addEntity('ORIENTED_EDGE', [
        '', '*', '*', writer.ref(edgeCurveId), orientation ? '.T.' : '.F.'
    ]);
}

export function addEdgeLoop(writer: STEPWriter, orientedEdgeIds: number[]): number {
    const refs = orientedEdgeIds.map(id => `#${id}`).join(', ');
    return writer.addEntity('EDGE_LOOP', ['', `(${refs})`]);
}

export function addFaceOuterBound(writer: STEPWriter, edgeLoopId: number, orientation: boolean): number {
    return writer.addEntity('FACE_OUTER_BOUND', ['', writer.ref(edgeLoopId), orientation ? '.T.' : '.F.']);
}

export function addAdvancedFace(
    writer: STEPWriter,
    boundIds: number[],
    surfaceId: number,
    sameSense: boolean
): number {
    const refs = boundIds.map(id => `#${id}`).join(', ');
    return writer.addEntity('ADVANCED_FACE', ['', `(${refs})`, writer.ref(surfaceId), sameSense ? '.T.' : '.F.']);
}

export function addClosedShell(writer: STEPWriter, faceIds: number[]): number {
    const refs = faceIds.map(id => `#${id}`).join(', ');
    return writer.addEntity('CLOSED_SHELL', ['', `(${refs})`]);
}

export function addManifoldSolidBrep(writer: STEPWriter, shellId: number): number {
    return writer.addEntity('MANIFOLD_SOLID_BREP', ['', writer.ref(shellId)]);
}

// ============================================
// PRODUCT STRUCTURE
// ============================================

export function addProduct(writer: STEPWriter, name: string, description: string): number {
    return writer.addEntity('PRODUCT', [name, name, description, '()']);
}

export function addProductDefinitionFormation(writer: STEPWriter, productId: number): number {
    return writer.addEntity('PRODUCT_DEFINITION_FORMATION', ['', '', writer.ref(productId)]);
}

export function addProductDefinition(writer: STEPWriter, formationId: number): number {
    const contextId = writer.addEntity('PRODUCT_DEFINITION_CONTEXT', ['detailed design', '$']);
    return writer.addEntity('PRODUCT_DEFINITION', ['', '', writer.ref(formationId), writer.ref(contextId)]);
}

export function addShapeDefinitionRepresentation(
    writer: STEPWriter,
    productDefId: number,
    shapeRepId: number
): number {
    const shapeDef = writer.addEntity('PRODUCT_DEFINITION_SHAPE', ['', '', writer.ref(productDefId)]);
    return writer.addEntity('SHAPE_DEFINITION_REPRESENTATION', [writer.ref(shapeDef), writer.ref(shapeRepId)]);
}

export function addShapeRepresentation(writer: STEPWriter, items: number[], contextId: number): number {
    const refs = items.map(id => `#${id}`).join(', ');
    return writer.addEntity('SHAPE_REPRESENTATION', ['', `(${refs})`, writer.ref(contextId)]);
}

export function addGeometricRepresentationContext(writer: STEPWriter): number {
    const dimCount = writer.addEntity('DIMENSIONAL_EXPONENTS', ['0', '0', '0', '0', '0', '0', '0']);
    const lengthUnit = writer.addEntity('SI_UNIT', ['*', '.MILLI.', '.METRE.']);
    const planeUnit = writer.addEntity('SI_UNIT', ['*', '$', '.RADIAN.']);
    const solidUnit = writer.addEntity('SI_UNIT', ['*', '$', '.STERADIAN.']);

    const uncertaintyMeasure = writer.addEntity('UNCERTAINTY_MEASURE_WITH_UNIT', [
        `LENGTH_MEASURE(1.0E-6)`, writer.ref(lengthUnit), 'DISTANCE_ACCURACY_VALUE', ''
    ]);

    return writer.addEntity('GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT', [
        '', '3D', writer.ref(uncertaintyMeasure)
    ]);
}
