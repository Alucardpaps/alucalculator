import { describe, it, expect } from 'vitest';
import {
  computeModalTransform,
  type ModalTransformSnapshot,
} from '@/design-studio/v2/modalTransformTypes';
import { parseAegis3DCommand } from '@/design-studio/directModelingEngine';
import type { DesignPart } from '@/design-studio/designStore';

describe('CAD Giants Integration — Blender Modal Transforms & SolidWorks Shortcuts', () => {
  const dummySnapshot: ModalTransformSnapshot = {
    position: { x: 100, y: 50, z: 25 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  };

  const dummyPart: DesignPart = {
    id: 'test-part-1',
    name: 'Aluminum Mounting Flange',
    kind: 'box',
    params: { width: 100, height: 20, depth: 80 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#60a5fa',
    visible: true,
    locked: false,
    parentId: null,
    holes: [],
    cuts: [],
  };

  describe('1. Blender Modal Transforms (computeModalTransform)', () => {
    it('translates along single locked axis (X, Y, Z)', () => {
      // X axis translation
      const posX = computeModalTransform(dummySnapshot, 'translate', 'x', 50);
      expect(posX.position.x).toBe(150);
      expect(posX.position.y).toBe(50);
      expect(posX.position.z).toBe(25);

      // Y axis translation (negative)
      const posY = computeModalTransform(dummySnapshot, 'translate', 'y', -30);
      expect(posY.position.x).toBe(100);
      expect(posY.position.y).toBe(20);
      expect(posY.position.z).toBe(25);

      // Z axis translation
      const posZ = computeModalTransform(dummySnapshot, 'translate', 'z', 15.5);
      expect(posZ.position.z).toBe(40.5);
    });

    it('translates along locked planes (XY, XZ, YZ)', () => {
      // XY Plane lock (Shift+Z in Blender)
      const posXY = computeModalTransform(dummySnapshot, 'translate', 'xy', 25);
      expect(posXY.position.x).toBe(125);
      expect(posXY.position.y).toBe(75);
      expect(posXY.position.z).toBe(25);

      // XZ Plane lock
      const posXZ = computeModalTransform(dummySnapshot, 'translate', 'xz', -10);
      expect(posXZ.position.x).toBe(90);
      expect(posXZ.position.y).toBe(50);
      expect(posXZ.position.z).toBe(15);
    });

    it('rotates along active axis (Z default or specified axis)', () => {
      // Default Z rotation
      const rotZ = computeModalTransform(dummySnapshot, 'rotate', 'z', 90);
      expect(rotZ.rotation.z).toBe(90);
      expect(rotZ.rotation.x).toBe(0);

      // X rotation with angle wrap
      const rotX = computeModalTransform(dummySnapshot, 'rotate', 'x', 450);
      expect(rotX.rotation.x).toBe(90); // 450 % 360 = 90
    });

    it('scales multiplicatively across axes or along a locked axis', () => {
      // Uniform 1.5x scale
      const sclUniform = computeModalTransform(dummySnapshot, 'scale', null, 1.5);
      expect(sclUniform.scale.x).toBe(1.5);
      expect(sclUniform.scale.y).toBe(1.5);
      expect(sclUniform.scale.z).toBe(1.5);

      // Single Z axis scale
      const sclZ = computeModalTransform(dummySnapshot, 'scale', 'z', 2.0);
      expect(sclZ.scale.x).toBe(1);
      expect(sclZ.scale.y).toBe(1);
      expect(sclZ.scale.z).toBe(2);
    });
  });

  describe('2. AeGiS Natural Language & Operator Palette (parseAegis3DCommand)', () => {
    it('recognizes SolidWorks S-Bar shortcut commands', () => {
      const res1 = parseAegis3DCommand('s-bar', dummyPart);
      expect(res1.recognized).toBe(true);
      expect(res1.action).toBe('operator');
      expect(res1.details?.operator).toBe('s-bar');

      const res2 = parseAegis3DCommand('kısayol', dummyPart);
      expect(res2.recognized).toBe(true);
      expect(res2.details?.operator).toBe('s-bar');

      const res3 = parseAegis3DCommand('shortcut', dummyPart);
      expect(res3.recognized).toBe(true);
      expect(res3.details?.operator).toBe('s-bar');
    });

    it('recognizes Blender modal transform triggers (grab, rotate, scale)', () => {
      const grabRes = parseAegis3DCommand('grab', dummyPart);
      expect(grabRes.recognized).toBe(true);
      expect(grabRes.action).toBe('operator');
      expect(grabRes.details?.operator).toBe('grab');

      const rotateRes = parseAegis3DCommand('döndür', dummyPart);
      expect(rotateRes.recognized).toBe(true);
      expect(rotateRes.details?.operator).toBe('rotate');

      const scaleRes = parseAegis3DCommand('ölçekle', dummyPart);
      expect(scaleRes.recognized).toBe(true);
      expect(scaleRes.details?.operator).toBe('scale');
    });

    it('recognizes CAD engineering operations (mate, pcd, clash, bom, section)', () => {
      const mateRes = parseAegis3DCommand('montaj ilişkisi', dummyPart);
      expect(mateRes.recognized).toBe(true);
      expect(mateRes.details?.operator).toBe('mate');

      const pcdRes = parseAegis3DCommand('bolt circle', dummyPart);
      expect(pcdRes.recognized).toBe(true);
      expect(pcdRes.details?.operator).toBe('pcd');

      const bomRes = parseAegis3DCommand('malzeme listesi', dummyPart);
      expect(bomRes.recognized).toBe(true);
      expect(bomRes.details?.operator).toBe('bom');

      const clashRes = parseAegis3DCommand('çakışma', dummyPart);
      expect(clashRes.recognized).toBe(true);
      expect(clashRes.details?.operator).toBe('clash');

      const sectionRes = parseAegis3DCommand('kesit', dummyPart);
      expect(sectionRes.recognized).toBe(true);
      expect(sectionRes.details?.operator).toBe('section');
    });
  });
});
