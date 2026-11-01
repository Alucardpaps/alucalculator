import { describe, expect, it } from 'vitest';
import { computeBoltAssembly } from '@/lib/fastener/sharedEngine';
import { getFastenerGeometry, getNutDimension } from '@/data/boltNutStandards';
import { CrossModuleBridge } from '@/system/crossModuleBridge';
import { useDesignStore } from '@/design-studio/designStore';
import { createCustomGeometry } from '@/design-studio/geometryFactory';

describe('bolt CAD geometry', () => {
  it('returns ISO 4017 / ISO 4032 dimensions for M12 and previously missing M14', () => {
    const r = computeBoltAssembly({
      threadStandard: 'Metric Coarse',
      size: 'M12',
      grade: '8.8',
      muThread: 0.14,
      muHead: 0.14,
      yieldUtilization: 70,
      length: 50,
    });
    expect(r.boltDim.s).toBe(18); // ISO 4017 (DIN 933 would be 19)
    expect(r.boltDim.k).toBe(7.5);
    expect(r.nutDim.height).toBe(10.8);
    expect(r.MA).toBeGreaterThan(70);
    expect(r.MA).toBeLessThan(95);
    expect(r.d3).toBeGreaterThan(9.5);
    expect(r.d3).toBeLessThan(10.3);
    expect(r.threadLengthB).toBe(2 * 12 + 6);

    const r14 = computeBoltAssembly({
      threadStandard: 'Metric Coarse',
      size: 'M14',
      grade: '8.8',
      muThread: 0.14,
      muHead: 0.14,
      yieldUtilization: 70,
      length: 60,
    });
    expect(r14.boltDim.s).toBe(21); // ISO 4017 (DIN 933 would be 22)
    expect(r14.nutDim.height).toBe(12.8);
    expect(r14.d3).toBeGreaterThan(11);
    expect(r14.d3).toBeLessThan(12.5);
  });

  it('maps fine pitch sizes like M12x1.5 to M12 head/nut tables', () => {
    const r = computeBoltAssembly({
      threadStandard: 'Metric Fine',
      size: 'M12x1.5',
      grade: '10.9',
      muThread: 0.1,
      muHead: 0.1,
      yieldUtilization: 70,
      length: 40,
    });
    expect(r.boltDim.s).toBe(18);
    expect(r.nutDim.height).toBe(10.8);
    expect(r.pitchVal).toBe(1.5);
  });

  it('covers full ISO hex range used on the torque page', () => {
    expect(getFastenerGeometry('M36').s).toBe(55);
    expect(getNutDimension('M24').height).toBe(21.5);
    expect(getNutDimension('M48').width).toBe(75);
  });

  it('exports 3D Fastener Assembly (bolt + nut) with coordinated concentric position', () => {
    const res = CrossModuleBridge.exportThreadTo3D({
      type: 'M',
      nominalDia: 12,
      pitch: 1.75,
      lengthMm: 50,
      role: 'assembly',
      switchWindow: false,
    });

    expect(res.success).toBe(true);
    const parts = useDesignStore.getState().parts;
    const boltPart = parts.find((p: any) => p.kind === 'hex-bolt' && p.params.diameter === 12);
    const nutPart = parts.find((p: any) => p.kind === 'hex-nut' && p.params.innerDiameter);

    expect(boltPart).toBeDefined();
    expect(nutPart).toBeDefined();
    expect(boltPart.params.pitch).toBe(1.75);
    expect(nutPart.params.pitch).toBe(1.75);
    // Nut should be positioned concentrically on the bolt shank
    expect(nutPart.position.y).toBeLessThan(0);
  });

  it('generates physical 3D helical thread geometry for hex-bolt and hex-nut', () => {
    const boltGeom = createCustomGeometry({
      id: 'test-bolt-1',
      kind: 'hex-bolt',
      name: 'M12 Bolt',
      color: '#f59e0b',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: {
        diameter: 12,
        length: 50,
        pitch: 1.75,
        threadLength: 35,
        headSize: 19,
        headHeight: 7.5,
      },
    });

    expect(boltGeom).toBeDefined();
    const boltPos = boltGeom.getAttribute('position');
    expect(boltPos).toBeDefined();
    // A true helical threaded bolt has substantial vertex count (> 500 vertices)
    expect(boltPos.count).toBeGreaterThan(300);

    const nutGeom = createCustomGeometry({
      id: 'test-nut-1',
      kind: 'hex-nut',
      name: 'M12 Nut',
      color: '#06b6d4',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: {
        diameter: 12,
        headSize: 19,
        innerDiameter: 10.1,
        depth: 10.8,
        pitch: 1.75,
      },
    });

    expect(nutGeom).toBeDefined();
    const nutPos = nutGeom.getAttribute('position');
    expect(nutPos).toBeDefined();
    // Internal helical threads add vertex complexity to the nut
    expect(nutPos.count).toBeGreaterThan(200);
  });

  it('supports fully threaded bolts (ISO 4017 / DIN 933) and custom thread length b', () => {
    // 1. Fully threaded bolt: b = length = 60
    const fullBolt = computeBoltAssembly({
      threadStandard: 'Metric Coarse',
      size: 'M12',
      grade: '8.8',
      muThread: 0.14,
      muHead: 0.14,
      yieldUtilization: 70,
      length: 60,
      threadLengthB: 60,
    });
    expect(fullBolt.threadLengthB).toBe(60);

    // 2. Custom thread length: b = 45 on 70mm bolt
    const customBolt = computeBoltAssembly({
      threadStandard: 'Metric Coarse',
      size: 'M16',
      grade: '8.8',
      muThread: 0.14,
      muHead: 0.14,
      yieldUtilization: 70,
      length: 70,
      threadLengthB: 45,
    });
    expect(customBolt.threadLengthB).toBe(45);

    // 3. Clamping when custom thread length exceeds total bolt length
    const clampedBolt = computeBoltAssembly({
      threadStandard: 'Metric Coarse',
      size: 'M16',
      grade: '8.8',
      muThread: 0.14,
      muHead: 0.14,
      yieldUtilization: 70,
      length: 50,
      threadLengthB: 120, // exceeds 50
    });
    expect(clampedBolt.threadLengthB).toBe(50);
  });

  it('calculates correct physical pitch and diameters for Gas Cylinder (W)', () => {
    const gas = computeBoltAssembly({
      threadStandard: 'Gas Cylinder (W)',
      size: 'W 19.8x1/14"',
      grade: '12.9',
      muThread: 0.14,
      muHead: 0.14,
      yieldUtilization: 70,
      length: 185,
    });
    expect(gas.pitchVal).toBeCloseTo(1.814, 2);
    expect(gas.d_nom).toBeCloseTo(19.8, 1);
    expect(gas.d2).toBeGreaterThan(gas.d3);
    expect(gas.d2).toBeCloseTo(18.64, 1);
    expect(gas.d3).toBeCloseTo(17.48, 1);
  });

  it('exports tapered pipe thread (NPT / BSPT) with taperSlope and conical manufacturing formulas to 3D Design Studio', () => {
    const nptExport = CrossModuleBridge.exportThreadTo3D({
      type: 'NPT',
      nominalDia: 21.34,
      pitch: 1.814,
      lengthMm: 45,
      role: 'assembly',
      switchWindow: false,
    });

    expect(nptExport.success).toBe(true);
    const parts = useDesignStore.getState().parts;
    const nptBolt = parts.find((p: any) => p.kind === 'hex-bolt' && p.params.isTapered);
    const nptNut = parts.find((p: any) => p.kind === 'hex-nut' && p.params.isTapered);

    expect(nptBolt).toBeDefined();
    expect(nptNut).toBeDefined();
    expect(nptBolt.params.tapered).toBe(true);
    expect(nptBolt.params.isTapered).toBe(true);
    expect(nptBolt.params.taperSlope).toBeCloseTo(1 / 16, 4);
    expect(nptBolt.name).toContain('Taper Pipe Nipple');
    expect(nptNut.name).toContain('Taper Coupling / Port');

    expect(nptBolt.params.isPipe).toBe(true);
    expect(nptBolt.params.threadLength).toBe(45);
    expect(nptBolt.params.shankLength).toBe(0);
    // Gauge plane engagement position for NPT coupling:
    expect(nptNut.position.y).toBeLessThan(-20);
    expect(nptNut.position.y).toBeGreaterThan(-40);

    // Generates valid 3D Conical BufferGeometry for hex-bolt and hex-nut
    const conicalBoltGeom = createCustomGeometry(nptBolt);
    expect(conicalBoltGeom).toBeDefined();
    const cBoltPos = conicalBoltGeom.getAttribute('position');
    expect(cBoltPos).toBeDefined();
    expect(cBoltPos.count).toBeGreaterThan(300);

    const conicalNutGeom = createCustomGeometry(nptNut);
    expect(conicalNutGeom).toBeDefined();
    const cNutPos = conicalNutGeom.getAttribute('position');
    expect(cNutPos).toBeDefined();
    expect(cNutPos.count).toBeGreaterThan(200);
  });

  it('accurately positions nut near the thread tip without colliding with bolt head', () => {
    // 100mm bolt assembly
    const res100 = CrossModuleBridge.exportThreadTo3D({
      type: 'M',
      nominalDia: 16,
      pitch: 2.0,
      lengthMm: 100,
      role: 'assembly',
      switchWindow: false,
    });
    expect(res100.success).toBe(true);
    const parts = useDesignStore.getState().parts;
    const nut100 = parts.find((p: any) => p.kind === 'hex-nut' && p.params.nominalDia === 16 && p.params.lengthMm === 100);
    expect(nut100).toBeDefined();
    // Nut depth is ~14mm. Nut center is at -(100 - 14*0.5 - 2*2) = -89mm.
    // It should be positioned near the tip (-100mm), NOT near the head (0 to -10mm).
    expect(nut100.position.y).toBeLessThan(-80);
    expect(nut100.position.y).toBeGreaterThan(-95);
  });

  it('adaptively scales mesh resolution for extra long bolts without polygonal aliasing', () => {
    // 200mm bolt with 1.5mm pitch -> ~133 turns!
    const longBoltGeom = createCustomGeometry({
      id: 'test-long-bolt-200',
      kind: 'hex-bolt',
      name: 'M10x200 Long Bolt',
      color: '#f59e0b',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: {
        diameter: 10,
        length: 200,
        pitch: 1.5,
        threadLength: 160,
        headSize: 17,
        headHeight: 7,
      },
    });

    expect(longBoltGeom).toBeDefined();
    const posAttr = longBoltGeom.getAttribute('position');
    expect(posAttr).toBeDefined();
    // 160mm / 1.5mm = 106.6 turns * 24 steps = 2560 steps * 4 vertices = ~10,240 vertices
    // With adaptive scaling, vertex count is > 5,000 vertices, preventing polygonal aliasing
    expect(posAttr.count).toBeGreaterThan(5000);
  });

  it('computes accurate dimensional geometry and VDI 2230 formulas for all 11 bolt types', () => {
    const boltTypes = [
      'hex_bolt',
      'socket_cap',
      'countersunk',
      'button_head',
      'flange_hex',
      'low_head_socket',
      'heavy_hex',
      'stud_bolt',
      'set_screw',
      'carriage_bolt',
      'eye_bolt',
    ] as const;

    for (const bType of boltTypes) {
      const res = computeBoltAssembly({
        threadStandard: 'Metric Coarse',
        size: 'M12',
        grade: '8.8',
        muThread: 0.14,
        muHead: 0.14,
        yieldUtilization: 70,
        length: 50,
        boltType: bType,
      });

      expect(res.boltType).toBe(bType);
      expect(res.headDim).toBeDefined();
      expect(res.MA).toBeGreaterThan(0);
      expect(res.Fm_max).toBeGreaterThan(0);
      expect(res.pM).toBeGreaterThan(0);
      expect(res.mCrit).toBeGreaterThan(0);
      expect(res.strippingSafety).toBeGreaterThan(0);
      expect(res.M1 + res.M2 + res.M3).toBeCloseTo(res.MA, 1);
    }
  });

  it('verifies Countersunk DIN 7991 conical friction and 90 degree geometry', () => {
    const cs = computeBoltAssembly({
      threadStandard: 'Metric Coarse',
      size: 'M10',
      grade: '10.9',
      muThread: 0.12,
      muHead: 0.12,
      yieldUtilization: 80,
      length: 40,
      boltType: 'countersunk',
    });

    expect(cs.headDim.coneAngle).toBe(90);
    expect(cs.headDim.dk).toBe(20);
    expect(cs.headDim.k).toBe(5.5);
    expect(cs.headDim.s).toBe(6);
    expect(cs.spec.boltCurrent).toContain('DIN 7991');
  });

  it('verifies Socket Cap DIN 912 DIN 974-1 counterbore dimensions', () => {
    const cap = computeBoltAssembly({
      threadStandard: 'Metric Coarse',
      size: 'M12',
      grade: '8.8',
      muThread: 0.14,
      muHead: 0.14,
      yieldUtilization: 70,
      length: 60,
      boltType: 'socket_cap',
    });

    expect(cap.headDim.dk).toBe(18);
    expect(cap.headDim.k).toBe(12);
    expect(cap.headDim.s).toBe(10);
    expect(cap.headDim.cbDia).toBe(20);
    expect(cap.headDim.cbDepth).toBe(12.6);
  });

  it('verifies Flange Bolt DIN 6921 bearing area lowers surface pressure vs standard hex', () => {
    const hex = computeBoltAssembly({
      threadStandard: 'Metric Coarse',
      size: 'M12',
      grade: '10.9',
      muThread: 0.12,
      muHead: 0.12,
      yieldUtilization: 90,
      length: 50,
      boltType: 'hex_bolt',
      clampedMaterialId: 'alu_6061',
    });

    const flange = computeBoltAssembly({
      threadStandard: 'Metric Coarse',
      size: 'M12',
      grade: '10.9',
      muThread: 0.12,
      muHead: 0.12,
      yieldUtilization: 90,
      length: 50,
      boltType: 'flange_hex',
      clampedMaterialId: 'alu_6061',
    });

    // Flange has dc = 26mm vs hex dw = ~17mm, giving wider contact area and lower pressure pM
    expect(flange.headDim.dc).toBe(26);
    expect(flange.pM).toBeLessThan(hex.pM);
    expect(flange.surfaceSafety).toBeGreaterThan(hex.surfaceSafety);
  });

  it('verifies Stud Bolt DIN 939 tap end engagement bm and headless drawing spec', () => {
    const stud = computeBoltAssembly({
      threadStandard: 'Metric Coarse',
      size: 'M16',
      grade: '8.8',
      muThread: 0.14,
      muHead: 0.14,
      yieldUtilization: 70,
      length: 70,
      boltType: 'stud_bolt',
    });

    // DIN 939 tap end is bm = 1.25 * d = 20mm
    expect(stud.headDim.bm).toBe(20);
    expect(stud.headDim.k).toBe(0);
    expect(stud.spec.boltCurrent).toContain('DIN 939');
  });

  it('exports 1-to-1 exact dimensions from 2D bolt solver into 3D design store', () => {
    // Partially threaded M12x70 DIN 931 bolt (b=30mm, ls=40mm, s=18mm, k=7.5mm)
    const exportResult = CrossModuleBridge.exportThreadTo3D({
      type: 'M',
      nominalDia: 12,
      pitch: 1.75,
      lengthMm: 70,
      threadLength: 30,
      shankLength: 40,
      headWidth: 18,
      headHeight: 7.5,
      cornerWidth: 20.78,
      boltType: 'hex_bolt',
      nutWidth: 18,
      nutHeight: 10.8,
      nutPositionMm: 45, // Nut engaged 45mm down from head base
      grade: '8.8',
      standard: 'ISO 4014',
      nutStandard: 'ISO 4032',
      title: 'ISO 4014 M12×70 8.8 Bolt',
      role: 'assembly',
      switchWindow: false,
    });

    expect(exportResult.success).toBe(true);
    const parts = useDesignStore.getState().parts;
    const boltPart = parts.find((p: any) => p.id === exportResult.partId);
    expect(boltPart).toBeDefined();
    expect(boltPart.name).toBe('ISO 4014 M12×70 8.8 Bolt');
    expect(boltPart.params.diameter).toBe(12);
    expect(boltPart.params.length).toBe(70);
    expect(boltPart.params.threadLength).toBe(30);
    expect(boltPart.params.shankLength).toBe(40);
    expect(boltPart.params.headWidth).toBe(18);
    expect(boltPart.params.headSize).toBe(18);
    expect(boltPart.params.headHeight).toBe(7.5);
    expect(boltPart.params.cornerWidth).toBe(20.78);
    expect(boltPart.params.grade).toBe('8.8');
    expect(boltPart.params.standard).toBe('ISO 4014');

    const nutPart = parts.find((p: any) => p.kind === 'hex-nut' && p.parentId === boltPart.id);
    expect(nutPart).toBeDefined();
    expect(nutPart.params.headSize).toBe(18);
    expect(nutPart.params.depth).toBe(10.8);
    // Nut center positioned at -(nutPositionMm + nutHeight/2) = -(45 + 5.4) = -50.4mm
    expect(nutPart.position.y).toBeCloseTo(-50.4, 1);

    // Verify 3D BufferGeometry generated with these exact dimensions
    const bolt3DGeom = createCustomGeometry(boltPart);
    expect(bolt3DGeom).toBeDefined();
    bolt3DGeom.computeBoundingBox();
    const boltBox = bolt3DGeom.boundingBox!;
    expect(boltBox).toBeDefined();
    // Bolt head height on +Y should be k = 7.5mm (approx 0.75-0.78 units in 3D)
    expect(boltBox.max.y).toBeGreaterThan(0.70);
    expect(boltBox.max.y).toBeLessThan(0.85);
    // Bolt shank + thread extends down along -Y to -70mm (-7.14 with chamfer)
    expect(boltBox.min.y).toBeLessThan(-7.0);

    const nut3DGeom = createCustomGeometry(nutPart);
    expect(nut3DGeom).toBeDefined();
    nut3DGeom.computeBoundingBox();
    const nutBox = nut3DGeom.boundingBox!;
    expect(nutBox).toBeDefined();
    // Nut bore MUST be coaxial along Y axis: thickness is along Y (approx 1.08-1.22 with bevels)
    const nutYThickness = nutBox.max.y - nutBox.min.y;
    expect(nutYThickness).toBeGreaterThan(1.0);
    expect(nutYThickness).toBeLessThan(1.35);
    // Across flats and corners in X and Z plane
    const nutXSpan = nutBox.max.x - nutBox.min.x;
    const nutZSpan = nutBox.max.z - nutBox.min.z;
    expect(nutXSpan).toBeGreaterThan(1.8);
    expect(nutZSpan).toBeGreaterThan(1.8);
  });

  it('generates distinct authentic 3D geometries for Socket Cap, Countersunk, and Flange Hex screws', () => {
    // 1. Socket Cap (DIN 912)
    const capPart: DesignPart = {
      id: 'test-socket-cap',
      kind: 'hex-bolt',
      name: 'DIN 912 M10x40 Socket Cap',
      color: '#f59e0b',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: {
        diameter: 10,
        length: 40,
        threadLength: 26,
        shankLength: 14,
        headWidth: 16,
        headDiameter: 16,
        headHeight: 10,
        boltType: 'socket_cap',
        socketSize: 8,
        socketDepth: 5,
        pitch: 1.5,
      },
    };
    const capGeom = createCustomGeometry(capPart);
    expect(capGeom).toBeDefined();
    expect(capGeom.getAttribute('position').count).toBeGreaterThan(300);

    // 2. Countersunk (DIN 7991)
    const cskPart: DesignPart = {
      id: 'test-csk-screw',
      kind: 'hex-bolt',
      name: 'DIN 7991 M10x40 Countersunk',
      color: '#f59e0b',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: {
        diameter: 10,
        length: 40,
        threadLength: 30,
        shankLength: 10,
        headWidth: 20,
        headDiameter: 20,
        headHeight: 5.5,
        boltType: 'countersunk',
        socketSize: 6,
        pitch: 1.5,
      },
    };
    const cskGeom = createCustomGeometry(cskPart);
    expect(cskGeom).toBeDefined();
    expect(cskGeom.getAttribute('position').count).toBeGreaterThan(200);

    // 3. Hex Flange Bolt (DIN 6921)
    const flangePart: DesignPart = {
      id: 'test-flange-bolt',
      kind: 'hex-bolt',
      name: 'DIN 6921 M10x40 Flange Bolt',
      color: '#f59e0b',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: {
        diameter: 10,
        length: 40,
        threadLength: 26,
        shankLength: 14,
        headWidth: 15,
        headHeight: 9.2,
        flangeDiameter: 22.3,
        flangeThickness: 2.1,
        boltType: 'flange_hex',
        pitch: 1.5,
      },
    };
    const flangeGeom = createCustomGeometry(flangePart);
    expect(flangeGeom).toBeDefined();
    expect(flangeGeom.getAttribute('position').count).toBeGreaterThan(250);
  });
});



