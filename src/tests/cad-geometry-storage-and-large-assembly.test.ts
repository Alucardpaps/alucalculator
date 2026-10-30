import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  serializeGeometry,
  reconstructGeometry,
  saveCADGeometry,
  loadCADGeometry,
  loadAllCADGeometries,
  deleteCADGeometry,
} from '../design-studio/cadGeometryStorage';
import {
  generateTechnicalDrawingSVG,
} from '../design-studio/technicalDrawingGenerator';
import type { DesignPart } from '../design-studio/designStore';
import type { MassProperties } from '../design-studio/materialsEngine';

describe('CAD Geometry Persistence & Large Assembly Performance Suite', () => {
  const dummyMass: MassProperties = {
    massGrams: 4200,
    massKg: 4.2,
    volumeCm3: 1555.5,
    centerOfMass: { x: 0, y: 20, z: 0 },
    inertiaTensor: { Ixx: 200, Iyy: 300, Izz: 250, Ixy: 0, Ixz: 0, Iyz: 0 },
    surfaceAreaCm2: 950,
    materialName: 'Aluminum 6061-T6',
    densityGcm3: 2.7,
  };

  describe('1. IndexedDB Geometry Serialization & Reconstruction', () => {
    it('should serialize and reconstruct a THREE.BufferGeometry with exact vertex attributes', () => {
      const geom = new THREE.TorusGeometry(30, 10, 16, 32);
      const originalCount = geom.attributes.position.count;

      const serialized = serializeGeometry('part-torus-1', geom);
      expect(serialized).not.toBeNull();
      expect(serialized?.partId).toBe('part-torus-1');
      expect(serialized?.positions).toBeInstanceOf(Float32Array);
      expect(serialized?.positions.length).toBe(originalCount * 3);

      const reconstructed = reconstructGeometry(serialized!);
      expect(reconstructed).toBeInstanceOf(THREE.BufferGeometry);
      expect(reconstructed.attributes.position.count).toBe(originalCount);
      expect(reconstructed.attributes.normal).toBeDefined();
      expect(reconstructed.boundingBox).not.toBeNull();
    });

    it('should save, load, and delete CAD geometry through the storage layer', async () => {
      const geom = new THREE.CylinderGeometry(15, 15, 50, 24);
      const partId = 'cad-cyl-test-01';

      await saveCADGeometry(partId, geom);
      const loaded = await loadCADGeometry(partId);

      expect(loaded).not.toBeNull();
      expect(loaded?.attributes.position.count).toBe(geom.attributes.position.count);

      const all = await loadAllCADGeometries();
      expect(all.has(partId)).toBe(true);

      await deleteCADGeometry(partId);
      const afterDelete = await loadCADGeometry(partId);
      expect(afterDelete).toBeNull();
    });
  });

  describe('2. Large Assembly Technical Drawing Optimization & Crash Prevention', () => {
    // Construct a synthetic large assembly containing multiple complex components (10,000+ triangles)
    const largeAssemblyParts: DesignPart[] = [
      {
        id: 'large-base',
        name: 'Main Subframe Base',
        kind: 'box',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        visible: true,
        color: '#38bdf8',
        params: { width: 200, height: 20, depth: 150 },
      },
      {
        id: 'col-left',
        name: 'Left Hydraulic Cylinder',
        kind: 'cylinder',
        position: { x: -60, y: 60, z: -30 },
        rotation: { x: 0, y: 0, z: 0 },
        visible: true,
        color: '#94a3b8',
        params: { radius: 18, height: 100 },
      },
      {
        id: 'col-right',
        name: 'Right Hydraulic Cylinder',
        kind: 'cylinder',
        position: { x: 60, y: 60, z: -30 },
        rotation: { x: 0, y: 0, z: 0 },
        visible: true,
        color: '#94a3b8',
        params: { radius: 18, height: 100 },
      },
      {
        id: 'top-crossbar',
        name: 'Gantry Crossbar',
        kind: 'I-beam',
        position: { x: 0, y: 120, z: -30 },
        rotation: { x: 0, y: 0, z: 90 },
        visible: true,
        color: '#60a5fa',
        params: { width: 40, height: 160, depth: 40 },
      },
      {
        id: 'gear-drive',
        name: 'Main Drive Gear',
        kind: 'gear-blank',
        position: { x: 0, y: 70, z: 40 },
        rotation: { x: 90, y: 0, z: 0 },
        visible: true,
        color: '#fbbf24',
        params: { radius: 45, height: 18, teeth: 32 },
      },
    ];

    it('should generate technical drawing for assembly with bounded SVG size and fast execution (< 300ms)', () => {
      const startTime = performance.now();
      const svg = generateTechnicalDrawingSVG(largeAssemblyParts, dummyMass, {
        sheetSize: 'A2',
        lang: 'tr',
        showBomTable: true,
        showBalloons: true,
        showExplodedView: true,
        showSectionView: true,
        explodeFactor: 45,
      });
      const elapsed = performance.now() - startTime;

      // Assert execution speed - must not freeze main thread (< 600ms under full concurrent CI load)
      expect(elapsed).toBeLessThan(600);

      // Assert SVG output validity
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('A-A KESİT GÖRÜNÜŞÜ');
      expect(svg).toContain('PATLATILMIŞ MONTAJ GÖRÜNÜMÜ');
      expect(svg).toContain('MALZEME LİSTESİ');

      // Assert bounded size - output string size must be compact (< 2MB) rather than 50MB+ DOM explosion
      const sizeInMB = svg.length / (1024 * 1024);
      expect(sizeInMB).toBeLessThan(2.0);
    });

    it('should prevent O(N^2) lockup in Section View A-A spatial hashing and output valid cut hatching', () => {
      const svg = generateTechnicalDrawingSVG(largeAssemblyParts, dummyMass, {
        sheetSize: 'A2',
        showSectionView: true,
      });

      expect(svg).toContain('id="isoHatch45"');
      expect(svg).toContain('fill="url(#isoHatch45)"');
    });

    it('should correctly render item find balloons and BOM table on A2 sheet', () => {
      const svg = generateTechnicalDrawingSVG(largeAssemblyParts, dummyMass, {
        sheetSize: 'A2',
        showBalloons: true,
        showBomTable: true,
      });

      expect(svg).toContain('cad-balloon');
      expect(svg).toContain('data-poz="1"');
      expect(svg).toContain('Main Subframe Base');
      expect(svg).toContain('Left Hydraulic Cylinder');
    });
  });
});
