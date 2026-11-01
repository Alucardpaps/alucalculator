import { describe, it, expect, beforeEach } from 'vitest';
import { CrossModuleBridge, GearTransferItem } from '@/system/crossModuleBridge';
import { useAssemblyStore } from '@/lib/store/assemblyStore';
import { useDesignStore, type DesignPart } from '@/design-studio/designStore';
import { useCadStore } from '@/cad/store/cadStore';
import { useCutStore } from '@/store/useCutStore';

describe('CrossModuleBridge - Interconnected Ecosystem', () => {
  beforeEach(() => {
    useAssemblyStore.getState().clearWorkspace();
  });

  it('exports single gear pair to 3D Assembly with proper spatial meshing', () => {
    const gears: GearTransferItem[] = [
      { name: 'Pinion', teeth: 20, module: 2, faceWidth: 20 },
      { name: 'Gear', teeth: 40, module: 2, faceWidth: 20 }
    ];

    const result = CrossModuleBridge.exportGearsTo3D(gears, { centerDistance: 60 });
    expect(result.totalGears).toBe(2);
    expect(result.createdIds.length).toBeGreaterThanOrEqual(2);

    const components = Object.values(useAssemblyStore.getState().components);
    const gearComponents = components.filter(c => c.type === 'gear');
    expect(gearComponents.length).toBe(2);

    // Check pinion metadata
    const pinion = gearComponents.find(g => g.metadata.teeth === 20);
    expect(pinion).toBeDefined();
    expect(pinion?.metadata.module).toBe(2);
    expect(pinion?.metadata.width).toBe(20);

    // Check gear metadata in assembly store
    const drivenGear = gearComponents.find(g => g.metadata.teeth === 40);
    expect(drivenGear).toBeDefined();
    expect(drivenGear?.metadata.module).toBe(2);

    // Check 3D CAD Design Studio parts
    const designParts = useDesignStore.getState().parts;
    expect(designParts.length).toBe(2);
    expect(designParts[0].kind).toBe('gear-blank');
    expect(designParts[1].kind).toBe('gear-blank');
  });

  it('exports Helical Gears with helical angle and twist to 3D Design Studio', () => {
    const helicalGears: GearTransferItem[] = [
      { name: 'Helical Pinion', teeth: 20, module: 3, faceWidth: 40, helixAngle: 15, pressureAngle: 20 },
      { name: 'Helical Gear', teeth: 60, module: 3, faceWidth: 40, helixAngle: 15, pressureAngle: 20 },
    ];
    const res = CrossModuleBridge.exportGearsTo3D(helicalGears, { centerDistance: 124.2, clearExisting: true });
    expect(res.totalGears).toBe(2);

    const parts = useDesignStore.getState().parts;
    expect(parts.length).toBe(2);
    expect(parts[0].params?.helixAngle).toBe(15);
    expect(parts[1].params?.helixAngle).toBe(-15);
    expect(parts[0].rotation.y).toBe(0);
    expect(parts[1].rotation.y).toBeCloseTo(180 / 60, 2);
    expect(parts[0].manufacturingFormulas?.some(f => f.label.includes('Helis'))).toBe(true);
  });

  it('exports Internal Ring Gear pair with hollow inward teeth to 3D Design Studio', () => {
    const internalPair: GearTransferItem[] = [
      { name: 'Internal Pinion', teeth: 20, module: 3, faceWidth: 40, helixAngle: 12, isInternal: false },
      { name: 'Internal Ring Gear', teeth: 60, module: 3, faceWidth: 40, helixAngle: 12, isInternal: true, ringOuterDia: 198 },
    ];
    const res = CrossModuleBridge.exportGearsTo3D(internalPair, { centerDistance: 60, meshType: 'internal', clearExisting: true });
    expect(res.totalGears).toBe(2);

    const parts = useDesignStore.getState().parts;
    expect(parts.length).toBe(2);
    expect(parts[0].params?.isInternal).toBe(false);
    expect(parts[1].params?.isInternal).toBe(true);
    expect(parts[1].params?.bore).toBe(0);
    expect(parts[1].params?.ringOuterDia).toBe(198);
    // Pinion and ring gear share same helix angle for internal mesh
    expect(parts[0].params?.helixAngle).toBe(12);
    expect(parts[1].params?.helixAngle).toBe(12);
    // Mating gear has phase rotation offset 180 / z around +Y shaft axis
    expect(parts[1].rotation.y).toBeCloseTo(180 / 60, 2);
    // Separation distance between centers is 60mm (totalSpan)
    expect(Math.abs(parts[1].position.x - parts[0].position.x)).toBe(60);
    expect(parts[1].manufacturingFormulas?.some(f => f.label.includes('Halka Dış Çapı'))).toBe(true);
  });

  it('exports multi-gear compound/planetary train to 3D Assembly', () => {
    const trainGears: GearTransferItem[] = [
      { name: 'Sun G1', teeth: 20, module: 2, faceWidth: 25, shaftId: 1 },
      { name: 'Planet G2', teeth: 30, module: 2, faceWidth: 25, shaftId: 2, isCoaxial: false },
      { name: 'Coaxial G3', teeth: 15, module: 2, faceWidth: 25, shaftId: 2, isCoaxial: true },
      { name: 'Output G4', teeth: 45, module: 2, faceWidth: 25, shaftId: 3, isCoaxial: false },
    ];

    const result = CrossModuleBridge.exportGearsTo3D(trainGears);
    expect(result.totalGears).toBe(4);

    const components = Object.values(useAssemblyStore.getState().components);
    const gearsInStore = components.filter(c => c.type === 'gear');
    expect(gearsInStore.length).toBe(4);
  });

  it('does not double-flip helix when the caller already sent opposite hands', () => {
    const helicalGears: GearTransferItem[] = [
      { name: 'Helical Pinion', teeth: 20, module: 3, faceWidth: 40, helixAngle: 15, pressureAngle: 20 },
      { name: 'Helical Gear', teeth: 60, module: 3, faceWidth: 40, helixAngle: -15, pressureAngle: 20 },
    ];
    CrossModuleBridge.exportGearsTo3D(helicalGears, { centerDistance: 124.2, clearExisting: true });
    const parts = useDesignStore.getState().parts;
    expect(parts[0].params?.helixAngle).toBe(15);
    expect(parts[1].params?.helixAngle).toBe(-15);
  });

  it('exports belt drive pulleys into Design Studio', () => {
    const res = CrossModuleBridge.exportBeltDriveTo3D(100, 250, 500, 13);
    expect(res.totalParts).toBeGreaterThanOrEqual(2);
    const parts = useDesignStore.getState().parts;
    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(parts[0].kind).toBe('pulley');
    expect(parts[1].kind).toBe('pulley');
    expect(parts.some((p) => p.params?.form === 'drive-loop')).toBe(true);
    expect(parts[0].params.diameter).toBe(100);
    expect(parts[1].params.diameter).toBe(250);
    expect(Math.abs(parts[1].position.x - parts[0].position.x)).toBe(500);
  });

  it('exports chain drive sprockets into Design Studio', () => {
    const res = CrossModuleBridge.exportChainDriveTo3D(19, 57, 15.875, 500);
    expect(res.totalParts).toBeGreaterThanOrEqual(2);
    const parts = useDesignStore.getState().parts;
    expect(parts[0].kind).toBe('gear-blank');
    expect(parts[0].params.form).toBe('sprocket');
    expect(parts[0].params.teeth).toBe(19);
    expect(parts[1].params.teeth).toBe(57);
    expect(Math.abs(parts[1].position.x - parts[0].position.x)).toBe(500);
    expect(parts.some((p) => p.params?.form === 'drive-loop')).toBe(true);
  });

  it('exports planetary sun/planets/ring on a carrier circle', () => {
    const res = CrossModuleBridge.exportPlanetaryTo3D({
      sunTeeth: 18,
      planetTeeth: 18,
      ringTeeth: 54,
      planetCount: 3,
      module: 3,
    });
    expect(res.totalGears).toBe(5);
    const parts = useDesignStore.getState().parts;
    expect(parts).toHaveLength(5);
    expect(parts[0].name).toContain('Sun');
    expect(parts[parts.length - 1].params?.isInternal).toBe(true);
    const planets = parts.slice(1, 4);
    const rC = (3 * (18 + 18)) / 2;
    for (const planet of planets) {
      const r = Math.hypot(planet.position.x, planet.position.z);
      expect(r).toBeCloseTo(rC, 5);
    }
  });

  it('exports helical planetary with opposite-hand sun vs planets/ring and mt diameters', () => {
    CrossModuleBridge.exportPlanetaryTo3D({
      sunTeeth: 18,
      planetTeeth: 18,
      ringTeeth: 54,
      planetCount: 3,
      module: 3,
      helixAngle: 15,
      faceWidth: 30,
    });
    const parts = useDesignStore.getState().parts;
    const sun = parts[0];
    const planet = parts[1];
    const ring = parts[parts.length - 1];
    expect(sun.params.helixAngle).toBe(15);
    expect(planet.params.helixAngle).toBe(-15);
    expect(ring.params.helixAngle).toBe(-15);
    const mt = 3 / Math.cos((15 * Math.PI) / 180);
    expect(sun.params.pitchDiameter).toBeCloseTo(mt * 18, 3);
    const rC = (mt * 18) / 2 + (mt * 18) / 2;
    const pr = Math.hypot(planet.position.x, planet.position.z);
    expect(pr).toBeCloseTo(rC, 4);
  });

  it('extracts profiles from 3D Assembly for 1D Cut Optimizer', () => {
    const store = useAssemblyStore.getState();
    const id1 = store.addComponent('profile', [0, 0, 0]);
    store.updateMetadata(id1, { length: 600 });

    const id2 = store.addComponent('profile', [1, 0, 0]);
    store.updateMetadata(id2, { length: 600 });

    const id3 = store.addComponent('profile', [2, 0, 0]);
    store.updateMetadata(id3, { length: 450 });

    const cutItems = CrossModuleBridge.extractProfilesForCutting();
    expect(cutItems.length).toBe(2);

    const row600 = cutItems.find(r => r.length === 600);
    expect(row600?.qty).toBe(2);

    const row450 = cutItems.find(r => r.length === 450);
    expect(row450?.qty).toBe(1);
  });

  it('extracts structural payload for FEA analysis', () => {
    const store = useAssemblyStore.getState();
    const id1 = store.addComponent('profile', [0, 0, 0]);
    store.updateMetadata(id1, { length: 800, weight: 2.16 });

    const payload = CrossModuleBridge.extractAssemblyStructuralAnalysis();
    expect(payload.lengthMm).toBe(800);
    expect(payload.loadN).toBeGreaterThan(0);
    expect(payload.materialKey).toBe('al-6061-t6');
  });

  it('auto-detects fasteners and returns VDI 2230 tightening recommendations', () => {
    const result = CrossModuleBridge.autoDetectAndPrepareFasteners();
    expect(result.recommendedTorqueNm).toBe(9.8);
    expect(result.fastenerSpec).toContain('ISO 4762');
  });

  it('exports stepped shaft and keyway to 3D Design Studio', () => {
    const { partId } = CrossModuleBridge.exportShaftTo3D({
      diameter: 30,
      length: 250,
      keyWidth: 8,
      keyDepth: 4,
      switchWindow: false,
    });
    expect(partId).toBeDefined();
    const parts = useDesignStore.getState().parts;
    const shaft = parts.find(p => p.id === partId);
    expect(shaft).toBeDefined();
    expect(shaft?.kind).toBe('keyway-shaft');
    expect(shaft?.params?.diameter).toBe(30);
    expect(shaft?.params?.length).toBe(250);
  });

  it('exports ISO bearing to 3D Design Studio', () => {
    const { partId } = CrossModuleBridge.exportBearingTo3D({
      innerDiameter: 25,
      outerDiameter: 52,
      depth: 15,
      switchWindow: false,
    });
    expect(partId).toBeDefined();
    const parts = useDesignStore.getState().parts;
    const bearing = parts.find(p => p.id === partId);
    expect(bearing).toBeDefined();
    expect(bearing?.kind).toBe('bearing-race');
    expect(bearing?.params?.innerDiameter).toBe(25);
    expect(bearing?.params?.diameter).toBe(52);
    expect(bearing?.manufacturingFormulas?.length).toBeGreaterThan(0);
    expect(bearing?.manufacturingFormulas?.[0].standard).toBe('ISO 281:2007');
  });

  it('exports Bolt and Nut fastener pair to 3D Design Studio with VDI 2230 formulas', () => {
    const { boltId, nutId } = CrossModuleBridge.exportBoltsTo3D({
      size: 'M10',
      length: 50,
      propertyClass: '10.9',
      switchWindow: false,
    });
    expect(boltId).toBeDefined();
    expect(nutId).toBeDefined();
    const parts = useDesignStore.getState().parts;
    const bolt = parts.find(p => p.id === boltId);
    const nut = parts.find(p => p.id === nutId);
    expect(bolt?.kind).toBe('hex-bolt');
    expect(nut?.kind).toBe('hex-nut');
    expect(bolt?.params?.diameter).toBe(10);
    expect(bolt?.manufacturingFormulas?.length).toBeGreaterThan(0);
    expect(bolt?.manufacturingFormulas?.[1].formula).toContain('FM = 0.75');
  });

  it('exports structural I-Beam and Box Tube to 3D Design Studio with bending formulas', () => {
    const { partId } = CrossModuleBridge.exportBeamTo3D({
      sectionType: 'I-beam',
      width: 60,
      height: 120,
      length: 1500,
      switchWindow: false,
    });
    expect(partId).toBeDefined();
    const parts = useDesignStore.getState().parts;
    const beam = parts.find(p => p.id === partId);
    expect(beam?.kind).toBe('I-beam');
    expect(beam?.params?.depth).toBe(1500);
    expect(beam?.manufacturingFormulas?.length).toBeGreaterThan(0);
    expect(beam?.manufacturingFormulas?.[2].formula).toContain('f_max');
  });

  it('exports profiles directly to 1D Cutting Optimizer store', () => {
    const profiles = [
      { id: 'cut-1', label: 'Beam Top', length: 1200, qty: 4 },
      { id: 'cut-2', label: 'Column Vert', length: 800, qty: 2 },
    ];
    CrossModuleBridge.exportProfilesToCuttingOptimizer(profiles, false);
    const pending = useCutStore.getState().pendingParts;
    expect(pending.length).toBe(2);
    expect(pending[0].length).toBe(1200);
    expect(pending[0].qty).toBe(4);
    expect(pending[1].length).toBe(800);
  });

  it('exports 3D Design Studio part back to 2D CAD Editor with lines and circles', () => {
    const testPart: DesignPart = {
      id: 'test-part-sync',
      kind: 'plate',
      name: 'Drilled Bracket',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 100, length: 60, depth: 15 },
      holes: [
        { id: 'h1', size: 'M8', x: 20, y: 0, type: 'clearance', diameter: 9, isThroughAll: true },
        { id: 'h2', size: 'M8', x: -20, y: 0, type: 'clearance', diameter: 9, isThroughAll: true },
      ],
      color: '#ffffff',
      visible: true,
      locked: false,
      parentId: null,
    };

    const res = CrossModuleBridge.exportDesignStudioToCad(testPart, { clearCanvas: true });
    expect(res.ok).toBe(true);
    expect(res.entityCount).toBe(6); // 4 rectangle boundary lines + 2 hole circles

    const cadStore = useCadStore.getState();
    expect(cadStore.entities.length).toBe(6);
    const lines = cadStore.entities.filter((e) => e.geometry.type === 'LINE');
    const circles = cadStore.entities.filter((e) => e.geometry.type === 'CIRCLE');
    expect(lines.length).toBe(4);
    expect(circles.length).toBe(2);
  });

  it('exports Rack and Pinion pair to 3D Design Studio with DIN 867 trapezoidal profile', () => {
    const res = CrossModuleBridge.exportRackAndPinionTo3D({
      module: 2.5,
      pinionTeeth: 24,
      rackPitchHeight: 25,
      helixAngle: 0,
      profileShift: 0,
      rackLengthMm: 500,
      rackWidthMm: 25,
    });
    expect(res.totalParts).toBe(2);
    expect(res.createdIds.length).toBe(2);

    const parts = useDesignStore.getState().parts;
    const rackPart = parts.find(p => p.id.startsWith('rack-bar'));
    const pinionPart = parts.find(p => p.id.startsWith('rack-pinion'));
    expect(rackPart).toBeDefined();
    expect(pinionPart).toBeDefined();
    expect(rackPart?.params?.form).toBe('rack');
    expect(rackPart?.designStandard).toBe('DIN 867 / KHK 4.6');
  });

  it('exports Gleason Straight Bevel gear pair to 3D Design Studio with cone distance', () => {
    const res = CrossModuleBridge.exportBevelTo3D({
      module: 3,
      z1: 20,
      z2: 40,
      coneDistanceRe: 67.08,
      delta1Deg: 26.57,
      delta2Deg: 63.43,
      bMm: 22,
    });
    expect(res.totalParts).toBe(2);

    const parts = useDesignStore.getState().parts;
    const pinion = parts.find(p => p.id.startsWith('bevel-pinion'));
    expect(pinion).toBeDefined();
    expect(pinion?.params?.form).toBe('bevel');
    expect(pinion?.params?.coneDistance).toBe(67.08);
    expect(pinion?.designStandard).toBe('DIN 3971 / KHK 4.16');
  });

  it('exports Worm & Globoid Wheel pair to 3D Design Studio with DIN 3975 geometry', () => {
    const res = CrossModuleBridge.exportWormTo3D({
      axialModule: 2,
      z1: 2,
      z2: 40,
      q: 10,
      centerDistance: 50,
      leadAngleGammaDeg: 11.31,
      da1: 24,
      df1: 15.2,
      da2: 84,
      df2: 75.2,
      throatRadiusRi: 10,
    });
    expect(res.totalParts).toBe(2);

    const parts = useDesignStore.getState().parts;
    const worm = parts.find(p => p.id.startsWith('worm-screw'));
    const wheel = parts.find(p => p.id.startsWith('worm-wheel'));
    expect(worm).toBeDefined();
    expect(wheel).toBeDefined();
    expect(worm?.params?.form).toBe('worm');
    expect(wheel?.params?.form).toBe('worm-wheel');
    expect(wheel?.params?.throatRadius).toBe(10);
    expect(wheel?.designStandard).toBe('DIN 3975 / KHK 4.22');
  });

  it('exports Crossed Helical / Screw Gears to 3D Design Studio with JIS B 1702 parameters', () => {
    const res = CrossModuleBridge.exportScrewTo3D({
      normalModule: 2,
      z1: 15,
      z2: 30,
      beta1Deg: 45,
      beta2Deg: 45,
      shaftAngleSigmaDeg: 90,
      centerDistance: 63.64,
      d1: 42.42,
      d2: 84.85,
    });
    expect(res.totalParts).toBe(2);

    const parts = useDesignStore.getState().parts;
    const screw1 = parts.find(p => p.id.startsWith('screw-pinion'));
    const screw2 = parts.find(p => p.id.startsWith('screw-gear'));
    expect(screw1).toBeDefined();
    expect(screw2).toBeDefined();
    expect(screw1?.designStandard).toBe('JIS B 1702 / KHK 4.24');
  });

  it('exports 1:1 gear pair with true involute teeth, bores, and centerlines to 2D AluCAD drafting engine', () => {
    const res = CrossModuleBridge.exportGearPairTo2DCad({
      title: 'Precision Gear Pair Test',
      d1: 60,
      d2: 120,
      da1: 66,
      da2: 126,
      centerDistance: 90,
      teeth1: 20,
      teeth2: 40,
      module: 3,
      switchWindow: false,
    });
    expect(res.ok).toBe(true);
    expect(res.entityCount).toBe(13); // 2 gears + 4 circles (pitch+tip) + 2 bores + 5 centerline segments

    const cadStore = useCadStore.getState();
    expect(cadStore.entities.length).toBe(13);
    const gears = cadStore.entities.filter(e => e.geometry.type === 'GEAR');
    const circles = cadStore.entities.filter(e => e.geometry.type === 'CIRCLE');
    const lines = cadStore.entities.filter(e => e.geometry.type === 'LINE');
    expect(gears.length).toBe(2);
    expect(circles.length).toBe(6); // 2 pitch + 2 tip + 2 bores
    expect(lines.length).toBe(5); // 1 shaft connector + 4 cross marks
  });

  it('exports 1:1 Rack and Pinion with trapezoidal teeth to 2D AluCAD drafting engine', () => {
    const res = CrossModuleBridge.exportRackAndPinionTo2DCad({
      title: 'Rack and Pinion 2D Test',
      module: 2,
      pinionTeeth: 20,
      rackPitchHeight: 25,
      rackLengthMm: 300,
      switchWindow: false,
    });
    expect(res.ok).toBe(true);
    expect(res.entityCount).toBeGreaterThan(3);

    const cadStore = useCadStore.getState();
    const polylines = cadStore.entities.filter(e => e.geometry.type === 'POLYLINE');
    const gears = cadStore.entities.filter(e => e.geometry.type === 'GEAR');
    expect(polylines.length).toBeGreaterThan(0); // Trapezoidal rack tooth polyline
    expect(gears.length).toBe(1); // Pinion gear entity
  });

  it('exports 1:1 Gleason Bevel gears to 2D AluCAD drafting engine', () => {
    const res = CrossModuleBridge.exportBevelTo2DCad({
      title: 'Gleason Bevel 2D Test',
      module: 3,
      z1: 20,
      z2: 40,
      coneDistanceRe: 67.08,
      delta1Deg: 26.57,
      delta2Deg: 63.43,
      d1: 60,
      d2: 120,
      da1: 65.37,
      da2: 122.68,
      switchWindow: false,
    });
    expect(res.ok).toBe(true);
    expect(res.entityCount).toBeGreaterThan(4);

    const cadStore = useCadStore.getState();
    const circles = cadStore.entities.filter(e => e.geometry.type === 'CIRCLE');
    expect(circles.length).toBe(4); // 2 pitch circles + 2 tip circles
  });

  it('exports 1:1 Worm and Globoid Wheel to 2D AluCAD drafting engine', () => {
    const res = CrossModuleBridge.exportWormTo2DCad({
      title: 'Worm Pair 2D Test',
      axialModule: 3,
      z1: 2,
      z2: 30,
      q: 10,
      centerDistance: 60,
      leadAngleGammaDeg: 11.31,
      d1: 30,
      d2: 90,
      da1: 36,
      da2: 96,
      throatRadiusRi: 12,
      switchWindow: false,
    });
    expect(res.ok).toBe(true);

    const cadStore = useCadStore.getState();
    const gears = cadStore.entities.filter(e => e.geometry.type === 'GEAR');
    const polylines = cadStore.entities.filter(e => e.geometry.type === 'POLYLINE');
    expect(gears.length).toBe(1); // Worm wheel
    expect(polylines.length).toBe(1); // Worm screw box
  });

  it('exports 1:1 Crossed Helical Screw gears to 2D AluCAD drafting engine', () => {
    const res = CrossModuleBridge.exportScrewTo2DCad({
      title: 'Crossed Helical Screw 2D Test',
      normalModule: 2,
      z1: 15,
      z2: 30,
      beta1Deg: 45,
      beta2Deg: 45,
      shaftAngleSigmaDeg: 90,
      centerDistance: 45,
      d1: 42.43,
      d2: 84.85,
      switchWindow: false,
    });
    expect(res.ok).toBe(true);

    const cadStore = useCadStore.getState();
    const gears = cadStore.entities.filter(e => e.geometry.type === 'GEAR');
    expect(gears.length).toBe(2);
  });
});
