/**
 * Collect DXF + PDF + .aluflow payloads already produced by the graph.
 * Does not recompute math.
 */

import type { ZipEntry } from './zip-builder';

export interface BundleNode {
    id: string;
    data?: {
        schemaId?: string;
        outputs?: Record<string, unknown>;
    };
}

function safeName(id: string): string {
    return id.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

export function collectEngineeringBundle(args: {
    aluflowJson: string;
    nodes: BundleNode[];
}): ZipEntry[] {
    const entries: ZipEntry[] = [
        { name: 'project.aluflow', data: args.aluflowJson },
    ];
    let dxfIndex = 0;
    let pdfIndex = 0;
    for (const node of args.nodes) {
        const outputs = node.data?.outputs ?? {};
        const schemaId = node.data?.schemaId ?? node.id;
        for (const [key, value] of Object.entries(outputs)) {
            if (typeof value !== 'string' || value.length < 8) continue;
            if (value.includes('SECTION') && value.includes('EOF')) {
                dxfIndex += 1;
                entries.push({
                    name: `dxf/${String(dxfIndex).padStart(2, '0')}-${safeName(schemaId)}-${safeName(node.id)}-${safeName(key)}.dxf`,
                    data: value,
                });
            } else if (value.startsWith('%PDF')) {
                pdfIndex += 1;
                entries.push({
                    name: `pdf/${String(pdfIndex).padStart(2, '0')}-${safeName(schemaId)}-${safeName(node.id)}.pdf`,
                    data: value,
                });
            }
        }
    }
    entries.push({
        name: 'MANIFEST.txt',
        data: [
            'AluCalculator OS — Complete Bundle',
            `DXF files: ${dxfIndex}`,
            `PDF reports: ${pdfIndex}`,
            'project.aluflow: graph (nodes, edges, typed ports)',
            'Deterministic payloads only — no wall-clock in engineering files.',
        ].join('\n'),
    });
    return entries;
}
