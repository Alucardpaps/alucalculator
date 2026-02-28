/**
 * 🏛️ ALUCALCULATOR ENGINE - EXPORT - DXF
 * "The Digital Blueprint"
 * AutoCAD R12 ASCII Format
 */

import { Point } from "../math/involute";

export class DxfExporter {
    private content: string[] = [];

    constructor() {
        this.header();
    }

    private header() {
        this.content.push(
            "  0", "SECTION",
            "  2", "HEADER",
            "  0", "ENDSEC"
        );
    }

    private startEntities() {
        this.content.push(
            "  0", "SECTION",
            "  2", "ENTITIES"
        );
    }

    private endEntities() {
        this.content.push(
            "  0", "ENDSEC"
        );
    }

    addPolyline(points: Point[], layer: string = "0") {
        this.content.push(
            "  0", "POLYLINE",
            "  8", layer,
            " 66", "1" // Vertices follow
        );

        points.forEach(p => {
            this.content.push(
                "  0", "VERTEX",
                "  8", layer,
                " 10", p.x.toFixed(6),
                " 20", p.y.toFixed(6),
                " 30", "0.0" // Z
            );
        });

        this.content.push(
            "  0", "SEQEND"
        );
    }

    addLine(p1: Point, p2: Point, layer: string = "0") {
        this.content.push(
            "  0", "LINE",
            "  8", layer,
            " 10", p1.x.toFixed(6),
            " 20", p1.y.toFixed(6),
            " 11", p2.x.toFixed(6),
            " 21", p2.y.toFixed(6)
        );
    }

    build(): string {
        this.startEntities();
        // In a real usage, methods would insert into a buffer between start/end
        // For this simple class, we assume specific call order or we'd restructure.
        // However, to keep it simple, we'll just append EOF.
        // *Correction*: The user wants to generate it. 
        // We should probably structure this so the user calls 'add' then 'getBlob'.
        // Requires 'ENTITIES' to wrap the adds.
        // Let's refactor slightly to be safe.

        // Actually, simple array join is fine if we respect order. 
        // But entities need to be inside SECTION ENTITIES.

        const header = [
            "  0", "SECTION",
            "  2", "HEADER",
            "  0", "ENDSEC"
        ].join('\n');

        const body = [
            "  0", "SECTION",
            "  2", "ENTITIES",
            ...this.content, // The entities added via methods
            "  0", "ENDSEC"
        ].join('\n');

        return `${header}\n${body}\n  0\nEOF`;
    }

    // Method to clear content buffer if needed (not strict requirement)
    // Re-implementing addPolyline to PUSH to a separate buffer

    private entitiesBuffer: string[] = [];

    addPolylineSmart(points: Point[], layer: string) {
        this.entitiesBuffer.push(
            "  0", "POLYLINE",
            "  8", layer,
            " 66", "1"
        );

        points.forEach(p => {
            this.entitiesBuffer.push(
                "  0", "VERTEX",
                "  8", layer,
                " 10", p.x.toFixed(6),
                " 20", p.y.toFixed(6),
                " 30", "0.0"
            );
        });

        this.entitiesBuffer.push("  0", "SEQEND");
    }

    getOutput(): string {
        return [
            "  0", "SECTION",
            "  2", "HEADER",
            "  0", "ENDSEC",
            "  0", "SECTION",
            "  2", "ENTITIES",
            ...this.entitiesBuffer,
            "  0", "ENDSEC",
            "  0", "EOF"
        ].join('\n');
    }
}
