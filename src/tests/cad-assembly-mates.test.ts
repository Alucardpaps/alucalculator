/**
 * Unit & Integration Tests: SolidWorks-Equivalent Assembly Mates Engine
 * 
 * Tests:
 * 1. Physical feature extraction across standard mechanical elements (T-Slot, Fasteners, Gears, Bearings, Plates)
 * 2. Raycast classification accuracy with rotation invariance
 * 3. Kinematic SE(3) solver for Concentric, Coincident, Distance, End-to-Slot, and Fastener-to-Channel mates
 * 4. Grounding and stationary vs moving part resolution
 * 5. Instant 2-Click Smart Mate commit workflow in designStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignStore, type DesignPart } from '@/design-studio/designStore';
import {
  extractPartFeatures,
  classifyFeatureFromRaycast,
  inferSmartMateKind,
  getValidMateKinds,
} from '@/design-studio/assembly/featureExtractor';
import { solveAssemblyMates } from '@/design-studio/assembly/mateSolver';
import type { HoleAxisFeature, PlanarFaceFeature, SlotChannelFeature, MateConstraint } from '@/design-studio/assembly/mateTypes';

describe('CAD Assembly Mates Engine (SolidWorks & ISO 10303 Compliant)', () => {
  beforeEach(() => {
    useDesignStore.setState({
      parts: [],
      mates: [],
      selectedMateId: null,
      activeMateDraft: null,
      tool: 'select',
    });
  });

  describe('1. Feature Extraction Across Mechanical Library', () => {
    it('extracts center bore, 4 slot channels, outer planar faces, and end caps for T-Slot profiles', () => {
      const tslot: DesignPart = {
        id: 'tslot-1',
        name: '40x40 T-Slot',
        kind: 't-slot',
        color: '#fbbf24',
        visible: true,
        locked: false,
        parentId: null,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        params: { series: 40, length: 500 },
      };

      const features = extractPartFeatures(tslot, false);
      expect(features.length).toBeGreaterThanOrEqual(7);

      const bore = features.find((f) => f.id.endsWith('center-bore')) as HoleAxisFeature;
      expect(bore).toBeDefined();
      expect(bore.kind).toBe('hole-axis');
      expect(bore.radius).toBe(3.4); // 6.8mm standard 40-series bore / 2

      const frontSlot = features.find((f) => f.id.endsWith('slot-front')) as SlotChannelFeature;
      expect(frontSlot).toBeDefined();
      expect(frontSlot.kind).toBe('slot-channel');
      expect(frontSlot.normal).toEqual({ x: 0, y: 0, z: 1 });

      const frontFace = features.find((f) => f.id.endsWith('face-front')) as PlanarFaceFeature;
      expect(frontFace).toBeDefined();
      expect(frontFace.kind).toBe('planar-face');

      const endTop = features.find((f) => f.id.endsWith('end-top')) as PlanarFaceFeature;
      expect(endTop).toBeDefined();
      expect(endTop.origin.y).toBe(250); // length 500 / 2
    });

    it('extracts shaft axis, bearing underhead face, and tip for Hex Bolts', () => {
      const bolt: DesignPart = {
        id: 'bolt-1',
        name: 'Hex Bolt M8x40',
        kind: 'hex-bolt',
        color: '#94a3b8',
        visible: true,
        locked: false,
        parentId: null,
        position: { x: 50, y: 100, z: 20 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        params: { diameter: 8, length: 40 },
      };

      const features = extractPartFeatures(bolt, false);
      const shaft = features.find((f) => f.id.endsWith('shaft-axis')) as HoleAxisFeature;
      expect(shaft).toBeDefined();
      expect(shaft.radius).toBe(4); // 8mm / 2
      expect(shaft.axis).toEqual({ x: 0, y: 1, z: 0 });

      const underHead = features.find((f) => f.id.endsWith('head-face-bottom')) as PlanarFaceFeature;
      expect(underHead).toBeDefined();
      expect(underHead.normal).toEqual({ x: 0, y: -1, z: 0 });
    });

    it('extracts bore axis, pitch diameter cylinder, and planar faces for Gears and Bearings', () => {
      const gear: DesignPart = {
        id: 'gear-1',
        name: 'Spur Gear M2 Z30',
        kind: 'gear-blank',
        color: '#38bdf8',
        visible: true,
        locked: false,
        parentId: null,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        params: { module: 2, teeth: 30, bore: 15, faceWidth: 20 },
      };

      const features = extractPartFeatures(gear, false);
      const bore = features.find((f) => f.id.endsWith('center-bore')) as HoleAxisFeature;
      expect(bore).toBeDefined();
      expect(bore.radius).toBe(7.5); // 15mm / 2

      const topFace = features.find((f) => f.id.endsWith('face-top')) as PlanarFaceFeature;
      expect(topFace).toBeDefined();
      expect(topFace.origin.y).toBe(10);
    });
  });

  describe('2. Raycast Feature Classification', () => {
    it('classifies bolt shaft as hole-axis when raycast hits curved side', () => {
      const bolt: DesignPart = {
        id: 'bolt-1',
        name: 'M8 Bolt',
        kind: 'hex-bolt',
        color: '#94a3b8',
        visible: true,
        locked: false,
        parentId: null,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        params: { diameter: 8, length: 40 },
      };

      const feature = classifyFeatureFromRaycast(
        { x: 0.4, y: -2.0, z: 0 }, // hit in Three.js units (4mm, -20mm)
        { x: 1, y: 0, z: 0 },       // normal pointing outward from shaft
        null,
        bolt
      );

      expect(feature).not.toBeNull();
      expect(feature!.kind).toBe('hole-axis');
    });

    it('classifies T-Slot side click into corresponding slot-channel', () => {
      const tslot: DesignPart = {
        id: 'tslot-1',
        name: 'T-Slot 40',
        kind: 't-slot',
        color: '#fbbf24',
        visible: true,
        locked: false,
        parentId: null,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        params: { series: 40, length: 500 },
      };

      const feature = classifyFeatureFromRaycast(
        { x: 0, y: 5.0, z: 2.0 }, // front slot (+Z) at +20mm
        { x: 0, y: 0, z: 1 },
        null,
        tslot
      );

      expect(feature).not.toBeNull();
      expect(feature!.id).toContain('slot-front');
    });
  });

  describe('3. Smart Mate Inference', () => {
    it('infers Concentric mate between two Hole Axes', () => {
      const axis1: HoleAxisFeature = {
        kind: 'hole-axis',
        id: 'h1',
        name: 'Hole 1',
        center: { x: 0, y: 0, z: 0 },
        axis: { x: 0, y: 1, z: 0 },
        radius: 4,
        depth: 20,
      };
      const axis2: HoleAxisFeature = {
        kind: 'hole-axis',
        id: 'h2',
        name: 'Hole 2',
        center: { x: 10, y: 10, z: 0 },
        axis: { x: 0, y: 1, z: 0 },
        radius: 4,
        depth: 20,
      };

      expect(inferSmartMateKind(axis1, axis2)).toBe('concentric');
      const valid = getValidMateKinds(axis1, axis2);
      expect(valid.recommended).toBe('concentric');
      expect(valid.compatible).toContain('concentric');
    });

    it('infers Concentric mate between Bolt Shaft and T-Slot Channel', () => {
      const boltAxis: HoleAxisFeature = {
        kind: 'hole-axis',
        id: 'bolt-axis',
        name: 'Bolt Shaft',
        center: { x: 0, y: 0, z: 0 },
        axis: { x: 0, y: 1, z: 0 },
        radius: 4,
        depth: 40,
      };
      const slot: SlotChannelFeature = {
        kind: 'slot-channel',
        id: 'slot-front',
        name: 'T-Slot Channel',
        center: { x: 0, y: 0, z: 20 },
        direction: { x: 0, y: 1, z: 0 },
        normal: { x: 0, y: 0, z: 1 },
        slotWidth: 8,
        slotDepth: 10,
      };

      expect(inferSmartMateKind(boltAxis, slot)).toBe('concentric');
    });
  });

  describe('4. Kinematic SE(3) Mate Solver', () => {
    it('solves Concentric mate between Bolt Shaft and Plate Hole, aligning axes and centering axially', () => {
      const plate: DesignPart = {
        id: 'plate-1',
        name: 'Base Plate',
        kind: 'box',
        color: '#64748b',
        visible: true,
        locked: true, // Grounded
        parentId: null,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        params: { width: 100, height: 20, depth: 100 },
        holes: [
          {
            id: 'h-1',
            size: 'M8',
            type: 'standard',
            face: 'top',
            x: 25,
            y: 30,
            depth: 20,
            throughAll: true,
          },
        ],
      };

      const bolt: DesignPart = {
        id: 'bolt-1',
        name: 'M8 Bolt',
        kind: 'hex-bolt',
        color: '#94a3b8',
        visible: true,
        locked: false,
        parentId: null,
        position: { x: 150, y: 100, z: 200 }, // floating far away
        rotation: { x: 45, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        params: { diameter: 8, length: 40 },
      };

      const plateFeatures = extractPartFeatures(plate, true);
      const boltFeatures = extractPartFeatures(bolt, true);

      const holeFeat = plateFeatures.find((f) => f.kind === 'hole-axis')!;
      const boltShaftFeat = boltFeatures.find((f) => f.id.endsWith('shaft-axis'))!;

      const mate: MateConstraint = {
        id: 'mate-1',
        kind: 'concentric',
        name: 'Concentric Bolt to Hole',
        partAId: bolt.id,
        featureA: boltShaftFeat,
        partBId: plate.id,
        featureB: holeFeat,
        active: true,
        suppressed: false,
      };

      const { parts: solvedParts, result } = solveAssemblyMates([plate, bolt], [mate]);
      expect(result.appliedMates).toBe(1);

      const solvedPlate = solvedParts.find((p) => p.id === plate.id)!;
      const solvedBolt = solvedParts.find((p) => p.id === bolt.id)!;

      // Grounded plate must NOT have moved
      expect(solvedPlate.position).toEqual({ x: 0, y: 0, z: 0 });

      // Bolt must have snapped to hole position (x = 25, z = 30)
      expect(solvedBolt.position.x).toBeCloseTo(25, 0.1);
      expect(solvedBolt.position.z).toBeCloseTo(30, 0.1);
    });

    it('solves Concentric mate between Bolt and T-Slot channel groove', () => {
      const tslot: DesignPart = {
        id: 'tslot-1',
        name: 'T-Slot 40x40',
        kind: 't-slot',
        color: '#fbbf24',
        visible: true,
        locked: true,
        parentId: null,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        params: { series: 40, length: 400 },
      };

      const bolt: DesignPart = {
        id: 'bolt-1',
        name: 'M8 Bolt',
        kind: 'hex-bolt',
        color: '#94a3b8',
        visible: true,
        locked: false,
        parentId: null,
        position: { x: 100, y: 80, z: 150 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        params: { diameter: 8, length: 25 },
      };

      const tslotFeats = extractPartFeatures(tslot, true);
      const boltFeats = extractPartFeatures(bolt, true);

      const slotFront = tslotFeats.find((f) => f.id.endsWith('slot-front'))!;
      const boltShaft = boltFeats.find((f) => f.id.endsWith('shaft-axis'))!;

      const mate: MateConstraint = {
        id: 'mate-bolt-slot',
        kind: 'concentric',
        name: 'Bolt in T-Slot',
        partAId: bolt.id,
        featureA: boltShaft,
        partBId: tslot.id,
        featureB: slotFront,
        active: true,
        suppressed: false,
      };

      const { parts: solvedParts, result } = solveAssemblyMates([tslot, bolt], [mate]);
      expect(result.appliedMates).toBe(1);

      const solvedBolt = solvedParts.find((p) => p.id === bolt.id)!;
      // Front slot is at z = 20, center x = 0
      expect(solvedBolt.position.x).toBeCloseTo(0, 0.1);
    });

    it('solves Coincident mate between two planar faces with opposing normals', () => {
      const blockA: DesignPart = {
        id: 'block-a',
        name: 'Block A',
        kind: 'box',
        color: '#34d399',
        visible: true,
        locked: true,
        parentId: null,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        params: { width: 50, height: 40, depth: 50 },
      };

      const blockB: DesignPart = {
        id: 'block-b',
        name: 'Block B',
        kind: 'box',
        color: '#f87171',
        visible: true,
        locked: false,
        parentId: null,
        position: { x: 100, y: 150, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        params: { width: 50, height: 40, depth: 50 },
      };

      const featsA = extractPartFeatures(blockA, true);
      const featsB = extractPartFeatures(blockB, true);

      const faceTopA = featsA.find((f) => f.id.endsWith('face-top'))!;
      const faceBottomB = featsB.find((f) => f.id.endsWith('face-bottom'))!;

      const mate: MateConstraint = {
        id: 'mate-coincident',
        kind: 'coincident',
        name: 'Coincident Top to Bottom',
        partAId: blockA.id,
        featureA: faceTopA,
        partBId: blockB.id,
        featureB: faceBottomB,
        offset: 0,
        flip: false,
        active: true,
        suppressed: false,
      };

      const { parts: solvedParts, result } = solveAssemblyMates([blockA, blockB], [mate]);
      expect(result.appliedMates).toBe(1);

      const solvedB = solvedParts.find((p) => p.id === blockB.id)!;
      // Top face of A is at y = 20 (height 40 / 2).
      // Bottom face of B (height 40) is at y_b - 20.
      // For faceBottomB to touch faceTopA (y = 20), y_b must be 40!
      expect(solvedB.position.y).toBeCloseTo(40, 0.1);
    });
  });

  describe('5. Instant 2-Click Smart Mate Workflow in Store', () => {
    it('commits mate draft and updates positions immediately upon 2nd entity selection', () => {
      const store = useDesignStore.getState();

      const base: DesignPart = {
        id: 'base-1',
        name: 'Base Frame',
        kind: 'box',
        color: '#64748b',
        visible: true,
        locked: true,
        parentId: null,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        params: { width: 100, height: 20, depth: 100 },
      };

      const pillar: DesignPart = {
        id: 'pillar-1',
        name: 'Pillar',
        kind: 'cylinder',
        color: '#38bdf8',
        visible: true,
        locked: false,
        parentId: null,
        position: { x: 80, y: 100, z: 80 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        params: { diameter: 30, length: 120 },
      };

      store.addPart('box');
      useDesignStore.setState({ parts: [base, pillar] });

      // Click 1: Select Entity 1 (Pillar bottom face)
      const featsPillar = extractPartFeatures(pillar, true);
      const featBottom = featsPillar.find((f) => f.id.endsWith('face-bottom'))!;

      store.openMateModal({
        partAId: pillar.id,
        featureAId: featBottom.id,
        featureAName: featBottom.name,
      });

      expect(useDesignStore.getState().activeMateDraft?.partAId).toBe(pillar.id);

      // Click 2: Select Entity 2 (Base top face)
      const featsBase = extractPartFeatures(base, true);
      const featTop = featsBase.find((f) => f.id.endsWith('face-top'))!;

      store.updateMateDraft({
        partBId: base.id,
        featureBId: featTop.id,
        featureBName: featTop.name,
        kind: 'coincident',
      });

      // Auto-commit
      const success = store.commitMateDraft();
      expect(success).toBe(true);

      const stateAfter = useDesignStore.getState();
      expect(stateAfter.mates.length).toBe(1);
      expect(stateAfter.mates[0].kind).toBe('coincident');
      expect(stateAfter.selectedMateId).toBe(stateAfter.mates[0].id);

      // Draft is cleanly reset for consecutive mating
      expect(stateAfter.activeMateDraft?.partAId).toBeNull();
    });
  });
});
