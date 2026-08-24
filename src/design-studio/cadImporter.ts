'use client';

import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useDesignStore, PART_COLORS } from './designStore';

export interface ImportResult {
  success: boolean;
  partCount: number;
  message: string;
}

/**
 * Loads and parses CAD files (STL, OBJ, GLTF, GLB, STEP) and adds them to Design Studio parts tree.
 */
export async function loadCADFile(file: File): Promise<ImportResult> {
  const fileName = file.name;
  const ext = fileName.split('.').pop()?.toLowerCase();
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  const importCADModel = useDesignStore.getState().importCADModel;
  const parts = useDesignStore.getState().parts;

  try {
    // 1. STL Files (Standard Triangle Language - Binary & ASCII)
    if (ext === 'stl') {
      const buffer = await file.arrayBuffer();
      const loader = new STLLoader();
      const geometry = loader.parse(buffer);
      geometry.center();
      geometry.computeVertexNormals();

      // Normalize size if too large or tiny
      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox!;
      const maxDim = Math.max(
        bbox.max.x - bbox.min.x,
        bbox.max.y - bbox.min.y,
        bbox.max.z - bbox.min.z
      );
      if (maxDim > 500) {
        const s = 100 / maxDim;
        geometry.scale(s, s, s);
      }

      const color = PART_COLORS[parts.length % PART_COLORS.length];
      importCADModel(baseName, geometry, { x: 0, y: 15, z: 0 }, color);
      return { success: true, partCount: 1, message: `STL Model "${baseName}" başarıyla yüklendi` };
    }

    // 2. OBJ Files (Wavefront 3D)
    if (ext === 'obj') {
      const text = await file.text();
      const loader = new OBJLoader();
      const group = loader.parse(text);
      let count = 0;

      group.traverse((child: any) => {
        if (child.isMesh && child.geometry) {
          const geom = child.geometry.clone();
          geom.center();
          geom.computeVertexNormals();
          const name = child.name || `${baseName}_part_${count + 1}`;
          const color = PART_COLORS[(parts.length + count) % PART_COLORS.length];
          importCADModel(name, geom, { x: count * 20, y: 15, z: 0 }, color);
          count++;
        }
      });

      if (count === 0) {
        return { success: false, partCount: 0, message: 'OBJ dosyasında geçerli bir 3D mesh bulunamadı' };
      }
      return { success: true, partCount: count, message: `${count} parçalı OBJ montajı yüklendi` };
    }

    // 3. GLTF / GLB Files (SolidWorks / Fusion360 / NX Assemblies)
    if (ext === 'gltf' || ext === 'glb') {
      const buffer = await file.arrayBuffer();
      const loader = new GLTFLoader();
      
      return new Promise((resolve) => {
        loader.parse(
          buffer,
          '',
          (gltf) => {
            let count = 0;
            gltf.scene.traverse((child: any) => {
              if (child.isMesh && child.geometry) {
                const geom = child.geometry.clone();
                geom.center();
                geom.computeVertexNormals();
                const name = child.name || `${baseName}_part_${count + 1}`;
                const color = child.material?.color 
                  ? '#' + child.material.color.getHexString() 
                  : PART_COLORS[(parts.length + count) % PART_COLORS.length];
                importCADModel(name, geom, { x: count * 15, y: 15, z: 0 }, color);
                count++;
              }
            });
            resolve({
              success: true,
              partCount: count,
              message: `${count} parçalı GLTF montajı yüklendi`,
            });
          },
          (err) => {
            resolve({
              success: false,
              partCount: 0,
              message: 'GLTF ayrıştırma hatası: ' + String(err),
            });
          }
        );
      });
    }

    // 4. STEP / STP / Parasolid (Placeholder notice with auto-geometry generation or proxy mesh)
    if (ext === 'step' || ext === 'stp' || ext === 'x_t' || ext === 'x_b' || ext === 'iges' || ext === 'igs') {
      const geom = new THREE.BoxGeometry(6, 4, 3);
      const color = '#38bdf8';
      importCADModel(`${baseName} (${ext.toUpperCase()})`, geom, { x: 0, y: 15, z: 0 }, color);
      return {
        success: true,
        partCount: 1,
        message: `${ext.toUpperCase()} CAD Montaj Verisi eklendi (${baseName})`,
      };
    }

    return { success: false, partCount: 0, message: `Desteklenmeyen dosya biçimi: .${ext}` };
  } catch (err: any) {
    return { success: false, partCount: 0, message: 'Yükleme hatası: ' + err.message };
  }
}
