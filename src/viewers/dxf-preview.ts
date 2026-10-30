/**
 * DXF → SVG thumbnail. Rendering only — does not recompute geometry.
 * Layer: viewers.
 */

const LAYER_STROKE: Record<string, string> = {
    PART_CONTOUR: '#e2e8f0',
    HOLES: '#f87171',
    BEND: '#fbbf24',
    PITCH_CIRCLE: '#22d3ee',
    BASE_CIRCLE: '#34d399',
    ADDENDUM_CIRCLE: '#fbbf24',
    DEDENDUM_CIRCLE: '#f87171',
    REFERENCE: '#64748b',
    DIMENSIONS: '#c084fc',
    SHEET: '#475569',
    '0': '#94a3b8',
};

interface Seg {
    kind: 'line' | 'circle' | 'poly' | 'text';
    layer: string;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    cx?: number;
    cy?: number;
    r?: number;
    points?: { x: number; y: number }[];
    closed?: boolean;
    text?: string;
    h?: number;
}

function groupPairs(dxf: string): { code: number; value: string }[] {
    const lines = dxf.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const pairs: { code: number; value: string }[] = [];
    for (let i = 0; i + 1 < lines.length; i += 2) {
        const code = Number(lines[i].trim());
        if (!Number.isFinite(code)) continue;
        pairs.push({ code, value: lines[i + 1] });
    }
    return pairs;
}

export function parseDxfEntities(dxf: string): Seg[] {
    const pairs = groupPairs(dxf);
    const segs: Seg[] = [];
    let i = 0;
    while (i < pairs.length) {
        if (pairs[i].code !== 0) {
            i++;
            continue;
        }
        const type = pairs[i].value.trim();
        i++;
        const fields: Record<number, string[]> = {};
        const pushField = (code: number, value: string) => {
            (fields[code] ??= []).push(value);
        };
        while (i < pairs.length && pairs[i].code !== 0) {
            pushField(pairs[i].code, pairs[i].value);
            i++;
        }
        const layer = (fields[8]?.[0] ?? '0').trim();
        const num = (code: number, idx = 0) => Number(fields[code]?.[idx] ?? 0);

        if (type === 'LINE') {
            segs.push({ kind: 'line', layer, x1: num(10), y1: num(20), x2: num(11), y2: num(21) });
        } else if (type === 'CIRCLE') {
            segs.push({ kind: 'circle', layer, cx: num(10), cy: num(20), r: num(40) });
        } else if (type === 'TEXT') {
            segs.push({
                kind: 'text',
                layer,
                x1: num(10),
                y1: num(20),
                h: num(40) || 2,
                text: (fields[1]?.[0] ?? '').trim(),
            });
        } else if (type === 'POLYLINE') {
            const points: { x: number; y: number }[] = [];
            const closed = ((Number(fields[70]?.[0] ?? 0) & 1) === 1);
            while (i < pairs.length) {
                if (pairs[i].code !== 0) {
                    i++;
                    continue;
                }
                const t = pairs[i].value.trim();
                if (t === 'SEQEND') {
                    i++;
                    break;
                }
                if (t === 'VERTEX') {
                    i++;
                    const vf: Record<number, string> = {};
                    while (i < pairs.length && pairs[i].code !== 0) {
                        vf[pairs[i].code] = pairs[i].value;
                        i++;
                    }
                    points.push({ x: Number(vf[10] ?? 0), y: Number(vf[20] ?? 0) });
                    continue;
                }
                break;
            }
            if (points.length >= 2) segs.push({ kind: 'poly', layer, points, closed });
        }
    }
    return segs;
}

export function dxfToSvgPreview(dxf: string, width = 280, height = 160): string {
    if (!dxf || !dxf.includes('SECTION')) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><text x="12" y="84" fill="#64748b" font-size="11" font-family="monospace">No DXF</text></svg>`;
    }
    const segs = parseDxfEntities(dxf);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const touch = (x: number, y: number) => {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
    };
    for (const s of segs) {
        if (s.kind === 'line') {
            touch(s.x1!, s.y1!);
            touch(s.x2!, s.y2!);
        } else if (s.kind === 'circle') {
            touch(s.cx! - s.r!, s.cy! - s.r!);
            touch(s.cx! + s.r!, s.cy! + s.r!);
        } else if (s.kind === 'poly' && s.points) {
            for (const p of s.points) touch(p.x, p.y);
        } else if (s.kind === 'text') {
            touch(s.x1!, s.y1!);
        }
    }
    if (!Number.isFinite(minX)) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><text x="12" y="84" fill="#64748b" font-size="11" font-family="monospace">Empty DXF</text></svg>`;
    }
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    const pad = 0.08;
    const vbX = minX - spanX * pad;
    const vbY = minY - spanY * pad;
    const vbW = spanX * (1 + pad * 2);
    const vbH = spanY * (1 + pad * 2);
    const strokeW = Math.max(spanX, spanY) * 0.006;

    const parts: string[] = [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${vbX} ${-vbY - vbH} ${vbW} ${vbH}" preserveAspectRatio="xMidYMid meet">`,
        `<rect x="${vbX}" y="${-vbY - vbH}" width="${vbW}" height="${vbH}" fill="#080d14"/>`,
        `<g transform="scale(1,-1)">`,
    ];
    for (const s of segs) {
        const stroke = LAYER_STROKE[s.layer] ?? '#94a3b8';
        if (s.kind === 'line') {
            parts.push(`<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="${stroke}" stroke-width="${strokeW}" fill="none"/>`);
        } else if (s.kind === 'circle') {
            parts.push(`<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" stroke="${stroke}" stroke-width="${strokeW}" fill="none"/>`);
        } else if (s.kind === 'poly' && s.points) {
            const d = s.points.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ') + (s.closed ? ' Z' : '');
            parts.push(`<path d="${d}" stroke="${stroke}" stroke-width="${strokeW}" fill="none"/>`);
        }
    }
    parts.push('</g>');
    for (const s of segs) {
        if (s.kind !== 'text' || !s.text) continue;
        const stroke = LAYER_STROKE[s.layer] ?? '#c084fc';
        const h = s.h ?? 2;
        parts.push(`<text x="${s.x1}" y="${-(s.y1 ?? 0)}" fill="${stroke}" font-size="${h}" font-family="ui-monospace,monospace">${escapeXml(s.text)}</text>`);
    }
    parts.push('</svg>');
    return parts.join('');
}

function escapeXml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
