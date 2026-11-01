import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignStore } from '@/design-studio/designStore';

describe('CAD Giants Integration — Autodesk Inventor Design Accelerators Suite', () => {
  beforeEach(() => {
    useDesignStore.setState({ parts: [], selectedId: null });
  });

  describe('1. Bolted Connection Generator (VDI 2230 / ISO 4014 / ISO 7089)', () => {
    it('calculates VDI 2230 preloads and tightening torques across standard thread sizes', () => {
      const calcVdi = (d: number, pitch: number, grade: '8.8' | '10.9' | '12.9', mu: number) => {
        const proofStress = grade === '8.8' ? 640 : grade === '10.9' ? 900 : 1080;
        const As = Math.PI * Math.pow((d - 0.9382 * pitch) / 2, 2);
        const Fm = (proofStress * As * 0.9) / 1000;
        const Ma = Fm * (0.16 * pitch + 0.58 * d * mu);
        return { As, Fm: Number(Fm.toFixed(1)), Ma: Number(Ma.toFixed(1)) };
      };

      // M12 10.9 (pitch 1.75, mu=0.12)
      const m12 = calcVdi(12, 1.75, '10.9', 0.12);
      expect(m12.As).toBeGreaterThan(80);
      expect(m12.Fm).toBeGreaterThan(60);
      expect(m12.Ma).toBeGreaterThan(65);

      // M16 10.9 (pitch 2.0, mu=0.12)
      const m16 = calcVdi(16, 2.0, '10.9', 0.12);
      expect(m16.As).toBeGreaterThan(150);
      expect(m16.Fm).toBeGreaterThan(120);
      expect(m16.Ma).toBeGreaterThan(170);

      // Higher grade 12.9 yields higher preload
      const m16_129 = calcVdi(16, 2.0, '12.9', 0.12);
      expect(m16_129.Fm).toBeGreaterThan(m16.Fm);
    });

    it('generates a complete bolted joint stack (Bolt + 2x Washers + Nut) with correct physical positioning', () => {
      const store = useDesignStore.getState();
      const boltDia = 16;
      const boltLen = 60;
      const clampingMm = 30;
      const washerThick = 3.0;
      const nutThick = 13;

      // 1. Bolt ISO 4014
      const boltId = store.addPart('hex-bolt');
      store.updatePart(boltId, {
        name: `M${boltDia}x${boltLen} ISO 4014 Bolt`,
        position: { x: 0, y: clampingMm / 2 + washerThick, z: 0 },
        rotation: { x: 180, y: 0, z: 0 },
        params: { diameter: boltDia, length: boltLen, grade: '10.9' },
      });

      // 2. Top Washer ISO 7089
      const topWasherId = store.addPart('washer');
      store.updatePart(topWasherId, {
        name: `Washer ISO 7089-d${boltDia} (Top)`,
        position: { x: 0, y: clampingMm / 2 + washerThick / 2, z: 0 },
        params: { innerDiameter: boltDia + 1, outerDiameter: boltDia * 2, thickness: washerThick },
      });

      // 3. Bottom Washer ISO 7089
      const botWasherId = store.addPart('washer');
      store.updatePart(botWasherId, {
        name: `Washer ISO 7089-d${boltDia} (Bottom)`,
        position: { x: 0, y: -clampingMm / 2 - washerThick / 2, z: 0 },
        params: { innerDiameter: boltDia + 1, outerDiameter: boltDia * 2, thickness: washerThick },
      });

      // 4. Hex Nut ISO 4032
      const nutId = store.addPart('hex-nut');
      store.updatePart(nutId, {
        name: `M${boltDia} ISO 4032 Nut`,
        position: { x: 0, y: -clampingMm / 2 - washerThick - nutThick / 2, z: 0 },
        params: { diameter: boltDia, width: boltDia * 1.8, height: nutThick },
      });

      const parts = useDesignStore.getState().parts;
      expect(parts.length).toBe(4);

      // Verify physical ordering along Y axis:
      // Bolt head > Top washer > Ground (0) > Bottom washer > Nut
      const bolt = parts.find((p) => p.id === boltId)!;
      const topW = parts.find((p) => p.id === topWasherId)!;
      const botW = parts.find((p) => p.id === botWasherId)!;
      const nut = parts.find((p) => p.id === nutId)!;

      expect(bolt.position.y).toBeGreaterThan(topW.position.y);
      expect(topW.position.y).toBeGreaterThan(0);
      expect(botW.position.y).toBeLessThan(0);
      expect(botW.position.y).toBeGreaterThan(nut.position.y);
    });
  });

  describe('2. Involute Gearbox Generator (ISO 6336 / DIN 867)', () => {
    it('calculates pitch diameters and exact center distance (a) for spur and helical gears', () => {
      const calcGear = (m: number, z1: number, z2: number, betaDeg = 0) => {
        const cosBeta = Math.cos((betaDeg * Math.PI) / 180);
        const d1 = (m * z1) / cosBeta;
        const d2 = (m * z2) / cosBeta;
        const a = (m * (z1 + z2)) / (2 * cosBeta);
        const ratio = z2 / z1;
        return { d1, d2, a, ratio };
      };

      // Spur Gear: m=2.5, z1=18, z2=36
      const spur = calcGear(2.5, 18, 36);
      expect(spur.d1).toBe(45);
      expect(spur.d2).toBe(90);
      expect(spur.a).toBe(67.5);
      expect(spur.ratio).toBe(2);

      // Helical Gear: m=2.5, z1=18, z2=36, beta=15 deg
      const helical = calcGear(2.5, 18, 36, 15);
      // Helical expands pitch diameters and center distance by 1/cos(15°)
      expect(helical.d1).toBeGreaterThan(45);
      expect(helical.d2).toBeGreaterThan(90);
      expect(helical.a).toBeGreaterThan(67.5);
    });

    it('injects mated gear pair into design store with matching parameters', () => {
      const store = useDesignStore.getState();
      store.addGearPair({
        module: 2.5,
        z1: 20,
        z2: 40,
        faceWidth: 30,
        pressureAngle: 20,
      });

      const parts = useDesignStore.getState().parts;
      expect(parts.length).toBe(2);

      const pinion = parts[0];
      const wheel = parts[1];
      expect(pinion.params.module).toBe(2.5);
      expect(pinion.params.teeth).toBe(20);
      expect(wheel.params.teeth).toBe(40);
      // Center distance a = 2.5 * (20 + 40) / 2 = 75 mm
      expect(Math.abs(wheel.position.x - pinion.position.x)).toBeCloseTo(75, 1);
    });
  });

  describe('3. Helical Spring Generator (DIN EN 13906-1 / DIN 2089)', () => {
    it('calculates Wahl factor, spring rate, and solid length per DIN EN 13906-1', () => {
      const d = 3.5;
      const Dm = 28;
      const n = 7;
      const L0 = 65;
      const G = 81500; // MPa for spring steel

      const C = Dm / d;
      const kw = (4 * C - 1) / (4 * C - 4) + 0.615 / C;
      const R = (G * Math.pow(d, 4)) / (8 * Math.pow(Dm, 3) * n);
      const Lc = (n + 1.5) * d;
      const Fc = (L0 - Lc) * R;

      expect(C).toBe(8.0);
      expect(kw).toBeGreaterThan(1.1);
      expect(kw).toBeLessThan(1.25);
      expect(R).toBeGreaterThan(9);
      expect(R).toBeLessThan(12);
      expect(Lc).toBe(29.75);
      expect(Fc).toBeGreaterThan(300);
    });

    it('spawns a parametric 3D helical coil spring with solidOp helix', () => {
      const store = useDesignStore.getState();
      const id = store.addPart('profile');

      store.updatePart(id, {
        name: 'Spring DIN 13906-1',
        kind: 'profile',
        solidOp: 'helix',
        params: {
          helixPitch: 65 / 7,
          helixTurns: 7,
          helixRadius: 14,
          wireDiameter: 3.5,
          meanDiameter: 28,
          freeLength: 65,
          coils: 7,
          springRate: 10.5,
        },
      });

      const spring = useDesignStore.getState().parts.find((p) => p.id === id);
      expect(spring).toBeDefined();
      expect(spring?.solidOp).toBe('helix');
      expect(spring?.params.helixTurns).toBe(7);
      expect(spring?.params.helixRadius).toBe(14);
    });
  });

  describe('4. Structural Frame & Extrusion Generator (DIN EN 12020 / EN 10025)', () => {
    it('generates standard aluminum T-slot profiles and structural steel beams', () => {
      const store = useDesignStore.getState();

      // 1. Modular Aluminum 40s T-Slot
      store.addTSlotPart(40, 750);

      // 2. Structural Steel IPE 100
      store.addStructuralProfile({
        type: 'I-beam',
        designation: 'IPE 100',
        lengthMm: 1200,
        params: { height: 100, width: 55, webThickness: 4.1, flangeThickness: 5.7 },
        standard: 'EN 10025',
      });

      const parts = useDesignStore.getState().parts;
      expect(parts.length).toBe(2);

      const tslot = parts[0];
      expect(tslot.kind).toBe('t-slot');
      expect(tslot.params.length).toBe(750);

      const beam = parts[1];
      expect(beam.name).toContain('IPE 100');
      expect(beam.params.height).toBe(100);
      expect(beam.params.width).toBe(55);
    });
  });
});
