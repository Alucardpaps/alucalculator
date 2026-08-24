/**
 * AluCalc OS - Belt Drive Visualizer (legacy fallback)
 */

export interface BeltVisualizerParams {
    d1: number;
    d2: number;
    centerDist: number;
    beltType?: string;
}

export interface BeltVisualizerOutput {
    svg: string;
    viewBox: string;
    width: number;
    height: number;
}

function polar(cx: number, cy: number, r: number, a: number) {
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
}

function openBeltPath(cx1: number, cy: number, r1: number, cx2: number, r2: number): string {
    const dx = cx2 - cx1;
    const C = Math.abs(dx);
    if (C <= 0 || r1 <= 0 || r2 <= 0) return '';
    if (C <= Math.abs(r2 - r1)) return '';

    const base = dx >= 0 ? 0 : Math.PI;
    const theta = Math.acos((r1 - r2) / C);

    const aTop = base + theta;
    const aBot = base - theta;

    const p1t = polar(cx1, cy, r1, aTop);
    const p2t = polar(cx2, cy, r2, aTop);
    const p2b = polar(cx2, cy, r2, aBot);
    const p1b = polar(cx1, cy, r1, aBot);

    const largeArc1 = r1 >= r2 ? 1 : 0;
    const largeArc2 = r2 >= r1 ? 1 : 0;

    return [
        `M ${p1t.x.toFixed(1)} ${p1t.y.toFixed(1)}`,
        `L ${p2t.x.toFixed(1)} ${p2t.y.toFixed(1)}`,
        `A ${r2} ${r2} 0 ${largeArc2} 1 ${p2b.x.toFixed(1)} ${p2b.y.toFixed(1)}`,
        `L ${p1b.x.toFixed(1)} ${p1b.y.toFixed(1)}`,
        `A ${r1} ${r1} 0 ${largeArc1} 1 ${p1t.x.toFixed(1)} ${p1t.y.toFixed(1)}`,
        'Z',
    ].join(' ');
}

export function generateBeltSVG(params: BeltVisualizerParams): BeltVisualizerOutput {
    const d1 = Math.max(10, params.d1 || 100);
    const d2 = Math.max(10, params.d2 || 250);
    const C = Math.max((d1 + d2) / 2, params.centerDist || 500);
    const isV = (params.beltType || 'classical-v').includes('v');

    const r1 = d1 / 2;
    const r2 = d2 / 2;
    const scale = 280 / (r1 + C + r2);
    const sr1 = r1 * scale;
    const sr2 = r2 * scale;
    const gap = C * scale;
    const cx1 = 60 + sr1;
    const cy = 100;
    const cx2 = cx1 + gap;
    const width = cx2 + sr2 + 60;
    const height = Math.max(sr1, sr2) * 2 + 80;

    const beltPath = openBeltPath(cx1, cy, sr1, cx2, sr2);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#0a0e14"/>
  <circle cx="${cx1}" cy="${cy}" r="${sr1}" fill="#1a2a3a" stroke="#00e5ff" stroke-width="1.2"/>
  <circle cx="${cx2}" cy="${cy}" r="${sr2}" fill="#1a2a3a" stroke="#8b5cf6" stroke-width="1.2"/>
  ${isV ? `<circle cx="${cx1}" cy="${cy}" r="${sr1 * 0.62}" fill="none" stroke="#f59e0b" stroke-width="0.8" stroke-dasharray="3,2"/>` : ''}
  ${isV ? `<circle cx="${cx2}" cy="${cy}" r="${sr2 * 0.62}" fill="none" stroke="#f59e0b" stroke-width="0.8" stroke-dasharray="3,2"/>` : ''}
  <path d="${beltPath}" fill="rgba(120,53,15,0.3)" stroke="#fbbf24" stroke-width="2"/>
  <text x="${cx1}" y="${cy - sr1 - 8}" text-anchor="middle" font-family="monospace" font-size="9" fill="#00e5ff">d1=${d1}</text>
  <text x="${cx2}" y="${cy - sr2 - 8}" text-anchor="middle" font-family="monospace" font-size="9" fill="#a78bfa">d2=${d2}</text>
  <text x="${(cx1 + cx2) / 2}" y="${cy + Math.max(sr1, sr2) + 20}" text-anchor="middle" font-family="monospace" font-size="9" fill="#f59e0b">C = ${C.toFixed(0)} mm</text>
</svg>`;

    return { svg, viewBox: `0 0 ${width} ${height}`, width, height };
}

export default generateBeltSVG;
