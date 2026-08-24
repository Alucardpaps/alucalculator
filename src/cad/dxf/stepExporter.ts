/**
 * STEP Exporter — Stub for AP214 STEP file generation
 *
 * ⚠️  FOUNDATION ONLY — returns a minimal valid AP214 header.
 *     Full entity export will be implemented when the B-rep kernel is ready.
 *
 * No UI, no buttons. Pure utility.
 */

import { CadEntity } from '../../cad/kernel/types';

/**
 * Generates a minimal STEP AP214 file string from CAD entities.
 * Currently outputs only the header block — entity mapping is a future task.
 */
export function generateSTEP(entities: CadEntity[], fileName: string = 'AluCalcExport'): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

    // ── ISO-10303-21 Header ──
    const header = [
        'ISO-10303-21;',
        'HEADER;',
        `FILE_DESCRIPTION(('AluCalc OS STEP Export'), '2;1');`,
        `FILE_NAME('${fileName}.step', '${timestamp}', ('AluCalc OS'), ('AluCalculator'), 'AluCalc STEP Processor V0.1', 'Next.js', '');`,
        `FILE_SCHEMA(('AUTOMOTIVE_DESIGN'));`,
        'ENDSEC;',
        '',
        'DATA;',
    ].join('\n');

    // ── Entity stubs (placeholder — real B-rep geometry comes later) ──
    const entityLines: string[] = [];
    let entityId = 1;

    entities.forEach((ent) => {
        if (ent.geometry.type === 'LINE') {
            const g = ent.geometry;
            entityLines.push(`#${entityId} = CARTESIAN_POINT('', (${g.start.x}, ${g.start.y}, 0.0));`);
            entityId++;
            entityLines.push(`#${entityId} = CARTESIAN_POINT('', (${g.end.x}, ${g.end.y}, 0.0));`);
            entityId++;
        } else if (ent.geometry.type === 'CIRCLE') {
            const g = ent.geometry;
            entityLines.push(`#${entityId} = CARTESIAN_POINT('', (${g.center.x}, ${g.center.y}, 0.0));`);
            entityId++;
            entityLines.push(`/* CIRCLE radius=${g.radius} — full entity mapping pending */`);
        }
        // Additional types will be added as the kernel evolves
    });

    const footer = [
        'ENDSEC;',
        'END-ISO-10303-21;',
    ].join('\n');

    return [header, ...entityLines, footer].join('\n');
}

/**
 * Triggers a browser download of the generated STEP file.
 */
export function downloadSTEP(entities: CadEntity[], fileName: string = 'AluCalcExport'): void {
    const content = generateSTEP(entities, fileName);
    const blob = new Blob([content], { type: 'application/step' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.step`;
    a.click();
    URL.revokeObjectURL(url);
}
