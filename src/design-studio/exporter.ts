import type { DesignPart } from './designStore';

/**
 * Generates an ASCII STL file string from 3D design parts
 */
export function exportPartsToSTL(parts: DesignPart[], name = 'AluDesign'): string {
  let stl = `solid ${name.replace(/\s+/g, '_')}\n`;

  for (const p of parts) {
    if (!p.visible) continue;
    const w = (p.params.width || p.params.diameter || 40) / 10;
    const h = (p.params.height || p.params.diameter || 40) / 10;
    const d = (p.params.depth || p.params.length || 20) / 10;
    const px = p.position.x / 10;
    const py = p.position.y / 10;
    const pz = p.position.z / 10;

    const x0 = px - w / 2, x1 = px + w / 2;
    const y0 = py - h / 2, y1 = py + h / 2;
    const z0 = pz - d / 2, z1 = pz + d / 2;

    const addFacet = (v1: number[], v2: number[], v3: number[]) => {
      stl += `  facet normal 0 0 0\n    outer loop\n`;
      stl += `      vertex ${v1[0].toFixed(4)} ${v1[1].toFixed(4)} ${v1[2].toFixed(4)}\n`;
      stl += `      vertex ${v2[0].toFixed(4)} ${v2[1].toFixed(4)} ${v2[2].toFixed(4)}\n`;
      stl += `      vertex ${v3[0].toFixed(4)} ${v3[1].toFixed(4)} ${v3[2].toFixed(4)}\n`;
      stl += `    endloop\n  endfacet\n`;
    };

    // 12 Triangles for bounding prism
    addFacet([x0, y0, z1], [x1, y0, z1], [x1, y1, z1]);
    addFacet([x0, y0, z1], [x1, y1, z1], [x0, y1, z1]);
    addFacet([x1, y0, z0], [x0, y0, z0], [x0, y1, z0]);
    addFacet([x1, y0, z0], [x0, y1, z0], [x1, y1, z0]);
    addFacet([x0, y1, z0], [x0, y1, z1], [x1, y1, z1]);
    addFacet([x0, y1, z0], [x1, y1, z1], [x1, y1, z0]);
    addFacet([x0, y0, z0], [x1, y0, z0], [x1, y0, z1]);
    addFacet([x0, y0, z0], [x1, y0, z1], [x0, y0, z1]);
    addFacet([x1, y0, z0], [x1, y1, z0], [x1, y1, z1]);
    addFacet([x1, y0, z0], [x1, y1, z1], [x1, y0, z1]);
    addFacet([x0, y0, z0], [x0, y0, z1], [x0, y1, z1]);
    addFacet([x0, y0, z0], [x0, y1, z1], [x0, y1, z0]);
  }

  stl += `endsolid ${name.replace(/\s+/g, '_')}\n`;
  return stl;
}

export function downloadFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
