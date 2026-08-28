import * as THREE from 'three';
import type { DesignPart } from './designStore';
import { createCustomGeometry } from './geometryFactory';

/**
 * Generates an ASCII STL file string from 3D design parts with accurate mesh geometry
 */
export function exportPartsToSTL(parts: DesignPart[], name = 'AluDesign'): string {
  let stl = `solid ${name.replace(/\s+/g, '_')}\n`;

  const addFacet = (v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3, normal?: THREE.Vector3) => {
    let n = normal;
    if (!n) {
      const cb = new THREE.Vector3().subVectors(v3, v2);
      const ab = new THREE.Vector3().subVectors(v1, v2);
      cb.cross(ab).normalize();
      n = cb;
    }
    stl += `  facet normal ${n.x.toFixed(5)} ${n.y.toFixed(5)} ${n.z.toFixed(5)}\n    outer loop\n`;
    stl += `      vertex ${(v1.x * 10).toFixed(4)} ${(v1.y * 10).toFixed(4)} ${(v1.z * 10).toFixed(4)}\n`;
    stl += `      vertex ${(v2.x * 10).toFixed(4)} ${(v2.y * 10).toFixed(4)} ${(v2.z * 10).toFixed(4)}\n`;
    stl += `      vertex ${(v3.x * 10).toFixed(4)} ${(v3.y * 10).toFixed(4)} ${(v3.z * 10).toFixed(4)}\n`;
    stl += `    endloop\n  endfacet\n`;
  };

  for (const p of parts) {
    if (!p.visible) continue;

    const geom = createCustomGeometry(p);

    const px = p.position.x / 10;
    const py = p.position.y / 10;
    const pz = p.position.z / 10;

    const rx = (p.rotation.x * Math.PI) / 180;
    const ry = (p.rotation.y * Math.PI) / 180;
    const rz = (p.rotation.z * Math.PI) / 180;

    const sx = p.scale?.x ?? 1;
    const sy = p.scale?.y ?? 1;
    const sz = p.scale?.z ?? 1;

    const matrix = new THREE.Matrix4();
    const posVec = new THREE.Vector3(px, py, pz);
    const rotEuler = new THREE.Euler(rx, ry, rz, 'XYZ');
    const scaleVec = new THREE.Vector3(sx, sy, sz);
    matrix.compose(posVec, new THREE.Quaternion().setFromEuler(rotEuler), scaleVec);

    if (geom && geom.attributes.position) {
      const posAttr = geom.attributes.position;
      const index = geom.getIndex();

      if (index) {
        for (let i = 0; i < index.count; i += 3) {
          const a = index.getX(i);
          const b = index.getX(i + 1);
          const c = index.getX(i + 2);

          const v1 = new THREE.Vector3().fromBufferAttribute(posAttr, a).applyMatrix4(matrix);
          const v2 = new THREE.Vector3().fromBufferAttribute(posAttr, b).applyMatrix4(matrix);
          const v3 = new THREE.Vector3().fromBufferAttribute(posAttr, c).applyMatrix4(matrix);

          addFacet(v1, v2, v3);
        }
      } else {
        for (let i = 0; i < posAttr.count; i += 3) {
          const v1 = new THREE.Vector3().fromBufferAttribute(posAttr, i).applyMatrix4(matrix);
          const v2 = new THREE.Vector3().fromBufferAttribute(posAttr, i + 1).applyMatrix4(matrix);
          const v3 = new THREE.Vector3().fromBufferAttribute(posAttr, i + 2).applyMatrix4(matrix);

          addFacet(v1, v2, v3);
        }
      }
    }
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
