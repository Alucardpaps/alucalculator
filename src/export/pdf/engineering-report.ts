/**
 * Deterministic engineering PDF (no wall-clock, no jsPDF metadata).
 * Single-page Courier text report for the flow export-pdf-report node.
 */

export interface EngineeringReportInput {
    title: string;
    standard?: string;
    engineVersion: string;
    nodeId?: string;
    validation: { valid: boolean; errors: string[]; warnings: string[] };
    results?: Record<string, unknown>;
    assumptions?: string[];
    formulaTrace?: string[];
    unitsNote?: string;
    hasDxf?: boolean;
    issued?: string;
}

function pdfEscape(text: string): string {
    return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapLine(text: string, width = 86): string[] {
    const raw = text.replace(/\s+/g, ' ').trim();
    if (raw.length <= width) return [raw];
    const out: string[] = [];
    let rest = raw;
    while (rest.length > width) {
        let cut = rest.lastIndexOf(' ', width);
        if (cut < width * 0.5) cut = width;
        out.push(rest.slice(0, cut).trim());
        rest = rest.slice(cut).trim();
    }
    if (rest) out.push(rest);
    return out;
}

function formatValue(value: unknown): string {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Number.isInteger(value) ? String(value) : value.toFixed(4);
    }
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string') return value.length > 80 ? `${value.slice(0, 77)}...` : value;
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

export function buildReportLines(input: EngineeringReportInput): string[] {
    const status = input.validation.valid ? 'PASS' : 'FAIL';
    const lines: string[] = [
        'AluCalculator OS — Engineering Report',
        input.title,
        `Standard: ${input.standard || '—'}`,
        `Engine version: ${input.engineVersion}`,
        input.nodeId ? `Node: ${input.nodeId}` : '',
        input.issued ? `Issued: ${input.issued}` : 'Issued: (deterministic, no wall-clock)',
        `Status: ${status}`,
        '',
        'Units: mm, N, MPa, N·m unless noted.',
        input.unitsNote || '',
        '',
        '— Validation —',
    ];
    if (input.validation.errors.length) {
        input.validation.errors.forEach((e) => lines.push(`ERROR: ${e}`));
    } else {
        lines.push('No errors.');
    }
    if (input.validation.warnings.length) {
        input.validation.warnings.forEach((w) => lines.push(`WARN: ${w}`));
    }
    if (input.assumptions?.length) {
        lines.push('', '— Assumptions —');
        input.assumptions.forEach((a) => lines.push(`• ${a}`));
    }
    if (input.formulaTrace?.length) {
        lines.push('', '— Formula trace —');
        input.formulaTrace.forEach((f) => lines.push(f));
    }
    if (input.results && Object.keys(input.results).length) {
        lines.push('', '— Results —');
        for (const [k, v] of Object.entries(input.results)) {
            if (k === 'geometry' || k === 'dxf_file' || k === 'pdf_file') continue;
            if (typeof v === 'object' && v !== null && !Array.isArray(v) && !('valid' in (v as object))) continue;
            lines.push(`${k} = ${formatValue(v)}`);
        }
    }
    lines.push('', `DXF attached: ${input.hasDxf ? 'yes' : 'no'}`);
    return lines.filter((l, i, arr) => !(l === '' && arr[i - 1] === ''));
}

export function buildEngineeringReportPdf(input: EngineeringReportInput): string {
    const wrapped: string[] = [];
    for (const line of buildReportLines(input)) {
        wrapped.push(...wrapLine(line || ' '));
    }
    const maxLines = 52;
    const used = wrapped.slice(0, maxLines);

    const contentParts = ['BT', '/F1 10 Tf', '50 800 Td'];
    used.forEach((line, idx) => {
        if (idx === 0) {
            contentParts.push(`(${pdfEscape(line)}) Tj`);
        } else {
            contentParts.push('0 -14 Td', `(${pdfEscape(line)}) Tj`);
        }
    });
    contentParts.push('ET');
    const stream = contentParts.join('\n');

    const objects: string[] = [
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
        `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
        '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n',
    ];

    let offset = '%PDF-1.4\n'.length;
    const xref: number[] = [0];
    let body = '';
    for (const obj of objects) {
        xref.push(offset);
        body += obj;
        offset += obj.length;
    }

    let xrefTable = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i < xref.length; i++) {
        xrefTable += `${String(xref[i]).padStart(10, '0')} 00000 n \n`;
    }
    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`;
    return `%PDF-1.4\n${body}${xrefTable}${trailer}`;
}
