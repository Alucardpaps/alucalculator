import { describe, it, expect } from 'vitest';
import {
  generateSolidFromPrompt,
  exportGeneratedSolidToStep,
  exportGeneratedSolidToStl,
  mapToValidDesignKind,
  normalizePartParams,
  robustParseAiJson,
  cleanNumber,
  VALID_KINDS,
} from '@/engines/cad/AegisGenerativeEngine';
import {
  MASTER_AI_CAD_TRAINING_PROMPT,
  FEW_SHOT_CAD_TRAINING_EXAMPLES,
  CANONICAL_CAD_PRIMITIVE_DICTIONARY,
  getAiCadTrainingDocumentation,
} from '@/engines/cad/training/AegisCadTrainingKnowledge';
import { groundAndAlignAssembly } from '@/engines/cad/AegisSpatialGrounding';
import { type DesignPart } from '@/design-studio/designStore';

describe('⚡ AeGiS Autonomous Text-to-CAD Synthesizer & DFM Engine', () => {
  it('synthesizes NEMA 23 stepper motor mount with pilot bore and 4x M5 holes', () => {
    const solid = generateSolidFromPrompt('NEMA 23 step motor montaj plakası 8mm kalınlık 6061 alüminyum');

    expect(solid.kind).toBe('plate');
    expect(solid.params.width).toBe(57);
    expect(solid.params.height).toBe(57);
    expect(solid.params.depth).toBe(8);
    expect(solid.materialId).toBe('al-6061-t6');
    expect(solid.holes).toHaveLength(4);
    expect(solid.holes[0].size).toBe('M5');
    expect(solid.cuts).toBeDefined();
    expect(solid.cuts?.[0].diameter).toBe(38.1); // NEMA 23 pilot bore
    expect(solid.standards).toContain('NEMA ICS 16-2001');
    expect(solid.dfm?.isMachinable).toBe(true);
    expect(solid.dfm?.score).toBeGreaterThanOrEqual(80);
    expect(solid.estimatedMassKg).toBeGreaterThan(0);
  });

  it('synthesizes DN50 PN16 Pipe Flange conforming to ISO 7005 with PCD bolt pattern', () => {
    const solid = generateSolidFromPrompt('DN50 PN16 boru flanşı 4xM16 PCD 125 paslanmaz çelik');

    expect(solid.kind).toBe('pulley');
    expect(solid.params.diameter).toBe(165);
    expect(solid.params.height).toBe(18);
    expect(solid.params.bore).toBeCloseTo(60.3, 1);
    expect(solid.holes.length).toBe(4);
    expect(solid.holes[0].size).toBe('M16');
    expect(solid.standards).toContain('ISO 7005-1:2011');
    expect(solid.materialId).toBe('steel-304');
    expect(solid.dfm?.score).toBeGreaterThanOrEqual(80);
  });

  it('synthesizes DIN 6885 Keyway Transmission Shaft with automatic key sizing', () => {
    const solid = generateSolidFromPrompt('DIN 6885 kamalı transmisyon mili Ø35x180mm 4140 çelik');

    expect(solid.kind).toBe('keyway-shaft');
    expect(solid.params.diameter).toBe(35);
    expect(solid.params.length).toBe(180);
    expect(solid.params.keyWidth).toBe(10); // Standard key width for Ø35
    expect(solid.params.keyDepth).toBe(8); // Standard key depth for Ø35
    expect(solid.standards).toContain('DIN 6885-1:1968 (Paralel Kama)');
    expect(solid.standards).toContain('ISO 286-2:2010 (h6 Tolerans)');
    expect(solid.materialId).toBe('steel-4140');
  });

  it('synthesizes DIN 1028 Structural L-Bracket with dual-face fastener holes', () => {
    const solid = generateSolidFromPrompt('L-braket 100x100x50mm 8mm et kalınlığı 3 delikli M8');

    expect(solid.kind).toBe('L-bracket');
    expect(solid.params.width).toBe(100);
    expect(solid.params.height).toBe(100);
    expect(solid.params.depth).toBe(50);
    expect(solid.params.thickness).toBe(8);
    expect(solid.holes).toHaveLength(3);
    expect(solid.standards).toContain('DIN 1028:1994');
  });

  it('synthesizes ISO 53 / DIN 867 Involute Spur Gear with module and teeth formulas', () => {
    const solid = generateSolidFromPrompt('Z28 M2.5 düz dişli çark 25mm genişlik 4140 çelik');

    expect(solid.kind).toBe('gear-blank');
    expect(solid.params.teeth).toBe(28);
    expect(solid.params.module).toBe(2.5);
    expect(solid.params.depth).toBe(25);
    expect(solid.params.diameter).toBeCloseTo((28 + 2) * 2.5, 1); // Tip diameter = (z + 2) * m
    expect(solid.standards).toContain('ISO 53:1998 (Temel Profil)');
  });

  it('synthesizes Electronics Enclosure with cavity pocket and corner screw holes', () => {
    const solid = generateSolidFromPrompt('Elektronik muhafaza kutusu 140x90x45mm 3mm et kalınlığı alüminyum');

    expect(solid.kind).toBe('box');
    expect(solid.params.width).toBe(140);
    expect(solid.params.height).toBe(90);
    expect(solid.params.depth).toBe(45);
    expect(solid.cuts).toBeDefined();
    expect(solid.cuts?.[0].type).toBe('rect');
    expect(solid.cuts?.[0].width).toBe(140 - 6);
    expect(solid.holes).toHaveLength(4);
    expect(solid.holes[0].size).toBe('M3');
  });

  it('detects DFM manufacturing issues and warns on sub-1.5mm wall thickness', () => {
    const solid = generateSolidFromPrompt('kutu profil 40x40x100 1mm et kalınlığı');

    expect(solid.dfm?.minWallThicknessMm).toBeLessThanOrEqual(3);
    expect(solid.dfm?.warnings.length).toBeGreaterThan(0);
  });

  it('directly serializes generated solid into mathematically exact ISO 10303-21 STEP B-Rep file', () => {
    const solid = generateSolidFromPrompt('120x80x15mm fikstür plakası 4xM8 havşa');
    const stepContent = exportGeneratedSolidToStep(solid, 'FixturePlateTest');

    expect(stepContent).toContain('ISO-10303-21;');
    expect(stepContent).toContain('HEADER;');
    expect(stepContent).toContain('FILE_SCHEMA');
    expect(stepContent).toContain('DATA;');
    expect(stepContent).toContain('ADVANCED_BREP_SHAPE_REPRESENTATION');
    expect(stepContent).toContain('MANIFOLD_SOLID_BREP');
    expect(stepContent).toContain('ENDSEC;');
    expect(stepContent).toContain('END-ISO-10303-21;');
  });

  it('directly serializes generated solid into valid ASCII 3D STL file', () => {
    const solid = generateSolidFromPrompt('DN50 PN16 boru flanşı');
    const stlContent = exportGeneratedSolidToStl(solid, 'FlangeTest');

    expect(stlContent.startsWith('solid ')).toBe(true);
    expect(stlContent).toContain('facet normal');
    expect(stlContent).toContain('outer loop');
    expect(stlContent).toContain('vertex');
    expect(stlContent).toContain('endloop');
    expect(stlContent).toContain('endfacet');
  });

  it('synthesizes 6-axis articulated industrial robot assembly when prompted with "robot çiz"', () => {
    const solid = generateSolidFromPrompt('robot çiz');

    expect(solid.name).toContain('Robot');
    expect(solid.assemblyParts).toBeDefined();
    expect(solid.assemblyParts!.length).toBeGreaterThanOrEqual(8);

    // Verify key anatomical robotic components are present
    const partNames = solid.assemblyParts!.map((p) => p.name.toLowerCase());
    expect(partNames.some((n) => n.includes('taban') || n.includes('kaide'))).toBe(true);
    expect(partNames.some((n) => n.includes('turret') || n.includes('döner'))).toBe(true);
    expect(partNames.some((n) => n.includes('omuz') || n.includes('j2'))).toBe(true);
    expect(partNames.some((n) => n.includes('kol') || n.includes('boom'))).toBe(true);
    expect(partNames.some((n) => n.includes('dirsek') || n.includes('j3'))).toBe(true);
    expect(partNames.some((n) => n.includes('bilek') || n.includes('wrist'))).toBe(true);
    expect(partNames.some((n) => n.includes('flanş') || n.includes('flange'))).toBe(true);
    expect(partNames.some((n) => n.includes('tutucu') || n.includes('gripper'))).toBe(true);

    // Verify standards cite ISO 9409-1
    expect(solid.standards.some((s) => s.includes('9409'))).toBe(true);

    // Verify multi-part STEP export succeeds for the robotic assembly
    const stepOutput = exportGeneratedSolidToStep(solid, 'RobotAssembly');
    expect(stepOutput).toContain('ISO-10303-21;');
    expect(stepOutput).toContain('ADVANCED_BREP_SHAPE_REPRESENTATION');
    expect(stepOutput).toContain('END-ISO-10303-21;');
  });

  it('validates AI CAD training prompt, floor grounding axioms, and modern office workstation exemplar', () => {
    expect(MASTER_AI_CAD_TRAINING_PROMPT).toContain('Y = 0 is the GROUND / FLOOR PLANE');
    expect(MASTER_AI_CAD_TRAINING_PROMPT).toContain('OFFICE FURNITURE & ERGONOMIC CAD AXIOMS');
    expect(MASTER_AI_CAD_TRAINING_PROMPT).toContain('Complete modern office workstation');
    expect(FEW_SHOT_CAD_TRAINING_EXAMPLES.length).toBeGreaterThanOrEqual(2);

    const officePod = FEW_SHOT_CAD_TRAINING_EXAMPLES.find((ex) => ex.prompt.includes('ofis') || ex.prompt.includes('office'));
    expect(officePod).toBeDefined();
    expect(officePod?.output.parts.length).toBeGreaterThanOrEqual(15);

    const doc = getAiCadTrainingDocumentation();
    expect(doc).toContain('AluCalc OS — AeGiS CAD AI');
    expect(doc).toContain('Training & Knowledge Base');
  });

  it('groundAndAlignAssembly heals floating slabs and snaps surface accessories flush to tabletops', () => {
    // Floating tabletop with no legs
    const floatingTable: DesignPart = {
      id: 'table-1',
      name: 'Çalışma Masası',
      kind: 'box',
      params: { width: 1200, depth: 700, height: 25 },
      position: { x: 0, y: 727.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#e2cbaf',
      visible: true,
      locked: false,
      parentId: null,
    };

    // Monitor floating slightly above table
    const floatingMonitor: DesignPart = {
      id: 'mon-1',
      name: 'Masaüstü Monitör',
      kind: 'box',
      params: { width: 450, depth: 30, height: 300 },
      position: { x: 0, y: 1050, z: 0 }, // improperly elevated
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#1e293b',
      visible: true,
      locked: false,
      parentId: null,
    };

    const healed = groundAndAlignAssembly([floatingTable, floatingMonitor]);

    // An auto-generated floor leg must be created to ground the floating table
    expect(healed.length).toBeGreaterThan(2);
    const generatedLeg = healed.find((p) => p.id.includes('auto-leg'));
    expect(generatedLeg).toBeDefined();
    // Leg bottom touches Y=0
    expect(generatedLeg!.position.y - generatedLeg!.params.height / 2).toBeCloseTo(0, 1);

    // Monitor must be snapped flush to top of table: table top is 727.5 + 12.5 = 740, monitor center = 740 + 150 = 890
    const alignedMonitor = healed.find((p) => p.id === 'mon-1');
    expect(alignedMonitor?.position.y).toBeCloseTo(890, 1);
  });

  it('synthesizes comprehensive modern office suite with desks, chairs, cabinets, and PCs', () => {
    const solid = generateSolidFromPrompt('BİR OFİS. MASALAR SANDALYELER DOLAPLAR PCLER OLAN GÜZEL BİR OFİS.');

    expect(solid.assemblyParts).toBeDefined();
    expect(solid.assemblyParts!.length).toBeGreaterThanOrEqual(25);

    // Verify presence of office desks with legs
    const desks = solid.assemblyParts!.filter((p) => p.name.includes('Masa') || p.name.includes('Desk'));
    expect(desks.length).toBeGreaterThanOrEqual(2);

    // Verify tall archive/file cabinet
    const cabinet = solid.assemblyParts!.find((p) => p.name.includes('Dolap') || p.name.includes('Cabinet'));
    expect(cabinet).toBeDefined();

    // Verify articulated ergonomic chairs (base, piston, seat at Y=450, backrest)
    const chairs = solid.assemblyParts!.filter((p) => p.name.includes('Sandalye') || p.name.includes('Chair'));
    expect(chairs.length).toBeGreaterThanOrEqual(4);
    const seatCushion = solid.assemblyParts!.find((p) => p.name.includes('Oturak'));
    expect(seatCushion).toBeDefined();
    expect(seatCushion!.position.y).toBeCloseTo(450, 10);

    // Verify under-desk drawer pedestals
    const pedestals = solid.assemblyParts!.filter((p) => p.name.includes('Keson'));
    expect(pedestals.length).toBeGreaterThanOrEqual(2);
    // Pedestal is tucked under the desk (height 640mm, resting on floor Y=0)
    expect(pedestals[0].position.y - pedestals[0].params.height / 2).toBeCloseTo(0, 1);

    // Verify computers and widescreen monitors
    const pcs = solid.assemblyParts!.filter((p) => p.name.includes('PC') || p.name.includes('Monitör'));
    expect(pcs.length).toBeGreaterThanOrEqual(4);

    // Verify acoustic divider
    const divider = solid.assemblyParts!.find((p) => p.name.includes('Bölücü') || p.name.includes('Paravan'));
    expect(divider).toBeDefined();

    expect(solid.standards).toContain('DIN EN 527-1 (Ofis Çalışma Masaları)');
    expect(solid.standards).toContain('DIN EN 1335 (Ergonomik Ofis Sandalyeleri)');
  });

  it('maps LLM kind aliases correctly to native 27 DesignKinds without box fallback', () => {
    expect(mapToValidDesignKind('shaft')).toBe('cylinder');
    expect(mapToValidDesignKind('drive-shaft')).toBe('cylinder');
    expect(mapToValidDesignKind('pipe')).toBe('tube');
    expect(mapToValidDesignKind('gear')).toBe('gear-blank');
    expect(mapToValidDesignKind('spur-gear')).toBe('gear-blank');
    expect(mapToValidDesignKind('bearing')).toBe('bearing-race');
    expect(mapToValidDesignKind('ball-bearing')).toBe('bearing-race');
    expect(mapToValidDesignKind('pulley')).toBe('pulley');
    expect(mapToValidDesignKind('bolt')).toBe('hex-bolt');
    expect(mapToValidDesignKind('nut')).toBe('hex-nut');
    expect(mapToValidDesignKind('washer')).toBe('washer');
    expect(mapToValidDesignKind('bracket')).toBe('L-bracket');
    expect(mapToValidDesignKind('channel')).toBe('U-channel');
    expect(mapToValidDesignKind('i-beam')).toBe('I-beam');
    expect(mapToValidDesignKind('t-slot')).toBe('t-slot');
    expect(mapToValidDesignKind('flange')).toBe('plate');
    expect(mapToValidDesignKind('tabletop')).toBe('plate');
    expect(mapToValidDesignKind('profile')).toBe('profile');
    expect(mapToValidDesignKind('revolve')).toBe('profile');
  });

  it('normalizes parameter aliases and strips stringified units for physical CAD realism', () => {
    // Cylinder: LLM outputs height: "250mm" and diameter: "45mm"
    const cylParams = normalizePartParams('cylinder', { height: '250mm', diameter: '45mm' });
    expect(cylParams.length).toBe(250);
    expect(cylParams.diameter).toBe(45);

    // Plate: LLM outputs thickness: "12mm", width: "300mm", length: "150mm"
    const plateParams = normalizePartParams('plate', { thickness: '12mm', width: '300mm', length: '150mm' });
    expect(plateParams.depth).toBe(12);
    expect(plateParams.width).toBe(300);
    expect(plateParams.height).toBe(150);

    // Gear blank: LLM outputs m: 3, z: 36, faceWidth: "30mm"
    const gearParams = normalizePartParams('gear-blank', { m: 3, z: 36, faceWidth: '30mm' });
    expect(gearParams.module).toBe(3);
    expect(gearParams.teeth).toBe(36);
    expect(gearParams.depth).toBe(30);

    // Bearing race: LLM outputs od: "62mm", id: "30mm", width: "16mm"
    const brgParams = normalizePartParams('bearing-race', { od: '62mm', id: '30mm', width: '16mm' });
    expect(brgParams.outerDiameter).toBe(62);
    expect(brgParams.innerDiameter).toBe(30);
    expect(brgParams.width).toBe(16);
  });

  it('robustParseAiJson safely extracts and parses JSON with comments, trailing commas, and units', () => {
    const rawAiOutput = `
    Here is the requested CAD solid:
    \`\`\`json
    {
      // Main robot base
      "name": "Robot Base Plaka",
      "kind": "plate",
      "params": {
        "width": "200mm",
        "height": "200mm",
        "depth": "15mm", /* standard aluminum base */
      },
      "holes": [
        { "size": "M8", "x": 80, "y": 80, "type": "counterbore" },
      ]
    }
    \`\`\`
    This solid conforms to ISO 9409-1.
    `;

    const parsed = robustParseAiJson(rawAiOutput);
    expect(parsed.name).toBe('Robot Base Plaka');
    expect(parsed.kind).toBe('plate');
    expect(parsed.params.width).toBe(200);
    expect(parsed.params.depth).toBe(15);
    expect(parsed.holes).toHaveLength(1);
    expect(parsed.holes[0].size).toBe('M8');
  });

  it('groundAndAlignAssembly automatically levels floating assemblies to Y=0 floor while preserving drones', () => {
    // Floating machine base at Y=200
    const floatingMachine: DesignPart = {
      id: 'm-1',
      name: 'CNC Base Frame',
      kind: 'box',
      params: { width: 500, height: 100, depth: 500 },
      position: { x: 0, y: 250, z: 0 }, // bottom is at 250 - 50 = 200
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#475569',
      visible: true,
      locked: false,
      parentId: null,
    };

    const leveled = groundAndAlignAssembly([floatingMachine]);
    // Base bottom must now sit exactly on Y=0 floor: center y = 50
    expect(leveled[0].position.y).toBeCloseTo(50, 1);

    // Airborne drone quadcopter
    const droneArm: DesignPart = {
      id: 'd-1',
      name: 'Drone Frame Arm with Propeller',
      kind: 'cylinder',
      params: { diameter: 16, length: 220 },
      position: { x: 0, y: 350, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#0f172a',
      visible: true,
      locked: false,
      parentId: null,
    };

    const droneLeveled = groundAndAlignAssembly([droneArm]);
    // Drone altitude must be preserved (not slammed to ground)
    expect(droneLeveled[0].position.y).toBe(350);
  });

  it('verifies encyclopedic CAD primitive dictionary and all 6 training exemplars', () => {
    expect(VALID_KINDS.size).toBe(28);
    expect(CANONICAL_CAD_PRIMITIVE_DICTIONARY).toContain('gear-blank');
    expect(CANONICAL_CAD_PRIMITIVE_DICTIONARY).toContain('keyway-shaft');
    expect(CANONICAL_CAD_PRIMITIVE_DICTIONARY).toContain('profile');

    expect(FEW_SHOT_CAD_TRAINING_EXAMPLES.length).toBe(6);
    const exemplarPrompts = FEW_SHOT_CAD_TRAINING_EXAMPLES.map((e) => e.prompt);
    expect(exemplarPrompts.some((p) => p.includes('ofis'))).toBe(true);
    expect(exemplarPrompts.some((p) => p.includes('robot'))).toBe(true);
    expect(exemplarPrompts.some((p) => p.includes('drivetrain') || p.includes('motor'))).toBe(true);
    expect(exemplarPrompts.some((p) => p.includes('drone') || p.includes('quadcopter'))).toBe(true);
    expect(exemplarPrompts.some((p) => p.includes('şişe') || p.includes('bottle'))).toBe(true);
    expect(exemplarPrompts.some((p) => p.includes('flanş') || p.includes('bracket'))).toBe(true);
  });
});
