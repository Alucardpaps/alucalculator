/**
 * AluCalc OS - Chain Drive Visualizer
 */

export interface ChainVisualizerParams {
    z1: number;
    z2: number;
    pitch: number;
    centerDist: number;
}

export interface ChainVisualizerOutput {
    svg: string;
    viewBox: string;
    width: number;
    height: number;
}

function pitchDiameter(p: number, z: number): number {
    return p / Math.sin(Math.PI / z);
}

function polar(cx: number, cy: number, r: number, a: number) {
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
}

function openChainPath(cx1: number, cy: number, r1: number, cx2: number, r2: number): string {
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

function sprocketPath(cx: number, cy: number, rPitch: number, rOuter: number, teeth: number): string {
    const points: string[] = [];
    for (let i = 0; i < teeth; i++) {
        const a = (2 * Math.PI * i) / teeth - Math.PI / 2;
        const r = i % 2 === 0 ? rOuter : rPitch * 0.92;
        const p = polar(cx, cy, r, a);
        points.push(`${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`);
    }
    return `${points.join(' ')} Z`;
}

export function generateChainSVG(params: ChainVisualizerParams): ChainVisualizerOutput {
    const z1 = Math.max(11, params.z1 || 19);
    const z2 = Math.max(11, params.z2 || 57);
    const p = Math.max(4, params.pitch || 15.875);
    const C = Math.max(50, params.centerDist || 500);

    const d1 = pitchDiameter(p, z1);
    const d2 = pitchDiameter(p, z2);
    const r1 = d1 / 2;
    const r2 = d2 / 2;
    const r1o = r1 * 1.08;
    const r2o = r2 * 1.08;

    const scale = 280 / Math.max(C + r1o + r2o, 1);
    const cx1 = 60 + r1o * scale;
    const cy = 90;
    const cx2 = cx1 + C * scale;
    const sr1 = r1 * scale;
    const sr2 = r2 * scale;
    const sr1o = r1o * scale;
    const sr2o = r2o * scale;

    const width = cx2 + sr2o + 60;
    const height = Math.max(sr1o, sr2o) * 2 + 80;

    const chainPath = openChainPath(cx1, cy, sr1o, cx2, sr2o);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#0a0e14"/>
  <path d="${chainPath}" fill="none" stroke="#00e5ff" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.7"/>
  <path d="${sprocketPath(cx1, cy, sr1, sr1o, z1)}" fill="#1a2a3a" stroke="#00e5ff" stroke-width="1.2"/>
  <circle cx="${cx1}" cy="${cy}" r="${sr1 * 0.35}" fill="#0a1a2a" stroke="#3a4a5a"/>
  <path d="${sprocketPath(cx2, cy, sr2, sr2o, z2)}" fill="#1a2a3a" stroke="#8b5cf6" stroke-width="1.2"/>
  <circle cx="${cx2}" cy="${cy}" r="${sr2 * 0.35}" fill="#0a1a2a" stroke="#3a4a5a"/>
  <line x1="${cx1}" y1="${cy}" x2="${cx2}" y2="${cy}" stroke="#00e5ff" stroke-width="0.5" stroke-dasharray="4,3" opacity="0.5"/>
  <text x="${cx1}" y="${cy + sr1o + 14}" text-anchor="middle" font-family="monospace" font-size="9" fill="#a0aab4">z1=${z1}</text>
  <text x="${cx2}" y="${cy + sr2o + 14}" text-anchor="middle" font-family="monospace" font-size="9" fill="#a0aab4">z2=${z2}</text>
  <text x="${(cx1 + cx2) / 2}" y="${cy - sr1o - 8}" text-anchor="middle" font-family="monospace" font-size="9" fill="#00e5ff">C = ${C.toFixed(0)} mm</text>
</svg>`;

    return { svg, viewBox: `0 0 ${width} ${height}`, width, height };
}

export default generateChainSVG;
