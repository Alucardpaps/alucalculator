import { describe, it, expect } from 'vitest';
import {
  lookupSheetMetalKFactor,
  calcSheetMetalBA,
  calcSheetMetalOSSB,
  calcSheetMetalBD,
  calcPressBrakeTonnage,
  calculateSheetMetalAnalysis,
  computeSheetMetalContour2D,
  buildSheetMetal3DGeometry,
  exportSheetMetalFlatPatternDXF,
  analyzeHoleDeformation,
  analyzeAllCutoutsDeformation,
  calculatePressBrakeFeasibility,
  SHEET_METAL_PRESETS,
  DEFAULT_DIN6935_K_TABLE,
  SheetMetalSpec,
  SheetMetalCutout,
  getFlangeAvailableEdgeLength,
  applyReliefSlitRemedy,
  offsetCutoutSafeRemedy,
  togglePreCompensationRemedy,
  togglePostBendRemedy,
  parseDxfOrSvgCutoutContent,
  applySheetMetalCutoutsCSG,
} from '@/design-studio/sheetMetalEngine';

describe('DIN 6935 Sheet Metal 3D Parametric Engine', () => {
  it('correctly looks up DIN 6935 K-factor by R/t ratio', () => {
    expect(lookupSheetMetalKFactor(0.5, DEFAULT_DIN6935_K_TABLE)).toBe(0.33);
    expect(lookupSheetMetalKFactor(1.5, DEFAULT_DIN6935_K_TABLE)).toBe(0.40);
    expect(lookupSheetMetalKFactor(3.5, DEFAULT_DIN6935_K_TABLE)).toBe(0.45);
    expect(lookupSheetMetalKFactor(6.0, DEFAULT_DIN6935_K_TABLE)).toBe(0.50);
  });

  it('verifies DIN 6935 mathematical identity: BD = 2 * OSSB - BA', () => {
    const angle = 90;
    const r = 3;
    const t = 2;
    const k = lookupSheetMetalKFactor(r / t);

    const ba = calcSheetMetalBA(angle, r, k, t);
    const ossb = calcSheetMetalOSSB(angle, r, t);
    const bd = calcSheetMetalBD(angle, r, k, t);

    expect(bd).toBeCloseTo(2 * ossb - ba, 4);
    expect(ba).toBeGreaterThan(0);
    expect(ossb).toBeGreaterThan(0);
    expect(bd).toBeGreaterThan(0);
  });

  it('calculates press-brake air-bending force (tonnage) according to VDI 3389', () => {
    const t = 2; // mm
    const L = 1000; // mm (1 meter)
    const V = 16; // mm die opening (8*t)
    const Rm = 300; // MPa

    const ton = calcPressBrakeTonnage(t, L, V, Rm);
    expect(ton).toBeGreaterThan(5);
    expect(ton).toBeLessThan(20);

    // Doubling length doubles required force
    const ton2m = calcPressBrakeTonnage(t, 2000, V, Rm);
    expect(ton2m).toBeCloseTo(ton * 2, 2);
  });

  it('calculates full DIN 6935 analysis and preserves flat pattern blank length: L_flat = Sum(F) - Sum(BD)', () => {
    const testSpec: SheetMetalSpec = {
      name: 'Test Z-Bracket',
      materialName: 'EN AW-5052 H32',
      yieldStrengthMpa: 195,
      densityGcm3: 2.68,
      thickness: 2,
      length: 120,
      firstFlange: 40,
      bends: [
        { id: 'b1', angle: 90, radius: 2, flange: 50, direction: 'down' },
        { id: 'b2', angle: 90, radius: 2, flange: 30, direction: 'up' },
      ],
    };

    const analysis = calculateSheetMetalAnalysis(testSpec);

    expect(analysis.rows.length).toBe(2);
    expect(analysis.totalOutsideSumMm).toBe(40 + 50 + 30); // 120 mm
    expect(analysis.totalBendDeductionMm).toBeGreaterThan(0);

    // Total flat blank length must equal outside sum minus total bend deductions
    const expectedFlat = analysis.totalOutsideSumMm - analysis.totalBendDeductionMm;
    expect(analysis.totalFlatLengthMm).toBeCloseTo(expectedFlat, 2);

    // Bend lines must be monotonically increasing from left edge
    expect(analysis.rows[0].bendLineMm).toBeGreaterThan(0);
    expect(analysis.rows[1].bendLineMm).toBeGreaterThan(analysis.rows[0].bendLineMm);
    expect(analysis.rows[1].bendLineMm).toBeLessThan(analysis.totalFlatLengthMm);

    // Since R=2 and t=2, no cracking risk
    expect(analysis.hasCrackingRisk).toBe(false);
  });

  it('flags cracking risk when any bend radius R < thickness t', () => {
    const crackSpec: SheetMetalSpec = {
      name: 'Crack Risk Part',
      materialName: 'Steel',
      yieldStrengthMpa: 250,
      densityGcm3: 7.85,
      thickness: 3,
      length: 100,
      firstFlange: 30,
      bends: [
        { id: 'b1', angle: 90, radius: 1.5, flange: 40, direction: 'up' }, // R < t (1.5 < 3)
      ],
    };

    const analysis = calculateSheetMetalAnalysis(crackSpec);
    expect(analysis.hasCrackingRisk).toBe(true);
    expect(analysis.rows[0].isCrackingRisk).toBe(true);
  });

  it('computes 2D contour polygon for folded and unfolded states', () => {
    const spec = SHEET_METAL_PRESETS[0].spec; // L-bracket 60x50x3

    // 1. Folded state (unfoldProgress01 = 0)
    const foldedContour = computeSheetMetalContour2D(spec, 0);
    expect(foldedContour.closedPolygon.length).toBeGreaterThan(10);
    expect(foldedContour.bounds.width).toBeGreaterThan(0);
    expect(foldedContour.bounds.height).toBeGreaterThan(0);

    // 2. Unfolded flat pattern (unfoldProgress01 = 1)
    const unfoldedContour = computeSheetMetalContour2D(spec, 1);
    const analysis = calculateSheetMetalAnalysis(spec);

    // In flat state, width should match total flat blank length
    expect(unfoldedContour.bounds.width).toBeCloseTo(analysis.totalFlatLengthMm, 0);
    // In flat state, height should equal thickness t
    expect(unfoldedContour.bounds.height).toBeCloseTo(spec.thickness, 1);
  });

  it('builds a valid Three.js BufferGeometry with normals and bounding box', () => {
    const spec = SHEET_METAL_PRESETS[1].spec; // U-channel
    const geom = buildSheetMetal3DGeometry(spec, 0);

    expect(geom.getAttribute('position')).toBeDefined();
    expect(geom.getAttribute('normal')).toBeDefined();
    expect(geom.getAttribute('position').count).toBeGreaterThan(50);

    geom.computeBoundingBox();
    const box = geom.boundingBox!;
    expect(box.max.z - box.min.z).toBeCloseTo(spec.length, 1);

    geom.dispose();
  });

  it('exports valid AutoCAD R12 DXF flat pattern containing all layers and bend callouts', () => {
    const spec = SHEET_METAL_PRESETS[2].spec; // Z-bracket
    const dxf = exportSheetMetalFlatPatternDXF(spec);

    expect(dxf).toContain('SECTION');
    expect(dxf).toContain('HEADER');
    expect(dxf).toContain('ENTITIES');
    expect(dxf).toContain('0_CUT_OUTLINE');
    expect(dxf).toContain('1_BEND_UP');
    expect(dxf).toContain('2_BEND_DOWN');
    expect(dxf).toContain('3_BEND_TANGENT');
    expect(dxf).toContain('4_ANNOTATION');
    expect(dxf).toContain('EOF');
  });

  it('successfully computes all 5 standard industrial presets without errors', () => {
    for (const preset of SHEET_METAL_PRESETS) {
      const analysis = calculateSheetMetalAnalysis(preset.spec);
      expect(analysis.totalFlatLengthMm).toBeGreaterThan(0);
      expect(analysis.maxTonnage).toBeGreaterThan(0);

      const geom = buildSheetMetal3DGeometry(preset.spec, 0);
      expect(geom.getAttribute('position').count).toBeGreaterThan(20);
      geom.dispose();
    }
  });

  it('accurately evaluates hole distortion ("sünme") and necking near the bend tangent line', () => {
    const spec: SheetMetalSpec = {
      name: 'Hole Distortion Test Spec',
      materialName: 'EN AW-5052 H32',
      yieldStrengthMpa: 195,
      densityGcm3: 2.68,
      thickness: 2,
      length: 100,
      firstFlange: 40,
      bends: [
        { id: 'b1', angle: 90, radius: 2, flange: 40, direction: 'up' },
      ],
      cutouts: [
        // Cutout 1: Far away on F0 (safe, >= 2t)
        { id: 'c_safe', name: 'Safe Hole', type: 'round_hole', flangeIndex: 0, posU: 10, posV: 50, diameter: 8 },
        // Cutout 2: Very close to bend tangent line (severe distortion / tearing)
        { id: 'c_distorted', name: 'Close Hole', type: 'round_hole', flangeIndex: 0, posU: 38, posV: 50, diameter: 8 },
      ],
    };

    const deformations = analyzeAllCutoutsDeformation(spec);
    expect(deformations.length).toBe(2);

    // Safe hole
    const safeDef = deformations[0];
    expect(safeDef.riskLevel).toBe('SAFE');
    expect(safeDef.elongationPercent).toBe(0);
    expect(safeDef.deformedMajorMm).toBe(8);
    expect(safeDef.deformedMinorMm).toBe(8);

    // Distorted hole near bend
    const distDef = deformations[1];
    expect(distDef.riskLevel).not.toBe('SAFE');
    expect(distDef.elongationPercent).toBeGreaterThan(0);
    expect(distDef.deformedMajorMm).toBeGreaterThan(8);
    expect(distDef.deformedMinorMm).toBeLessThan(8); // transverse Poisson necking
    expect(distDef.dfmAdviceTr).toContain('büküm');
  });

  it('determines press brake feasibility, optimal outer-to-inner sequence and flags collisions', () => {
    // 1. Feasible Hat Omega profile
    const hatPreset = SHEET_METAL_PRESETS.find((p) => p.id === 'hat_omega')!;
    const feasibility = calculatePressBrakeFeasibility(hatPreset.spec);

    expect(feasibility.recommendedDieV).toBeGreaterThan(0);
    expect(feasibility.optimalSequence.length).toBe(hatPreset.spec.bends.length);
    // Outer-to-inner sequence: for 4 bends, outer bends (1 and 4) come first
    expect([1, 4]).toContain(feasibility.optimalSequence[0]);

    // 2. Unbendable collision part (flange length F < 0.7*V)
    const unbendableSpec: SheetMetalSpec = {
      name: 'Unbendable Flange Spec',
      materialName: 'Steel',
      yieldStrengthMpa: 250,
      densityGcm3: 7.85,
      thickness: 3,
      length: 100,
      firstFlange: 5, // V = 24mm, 0.7*V = 16.8mm -> 5mm is far too short!
      bends: [
        { id: 'b1', angle: 90, radius: 3, flange: 40, direction: 'up' },
      ],
    };

    const unbFeas = calculatePressBrakeFeasibility(unbendableSpec);
    expect(unbFeas.isFeasible).toBe(false);
    expect(unbFeas.collisions.length).toBeGreaterThan(0);
    expect(unbFeas.collisions[0].type).toBe('min_flange');
    expect(unbFeas.collisions[0].severity).toBe('error');
    expect(unbFeas.collisions[0].messageTr).toContain('BÜKÜLEMEZ');
  });

  it('exports cutouts, deformed hole warnings and layer 5_CUTOUTS to DXF', () => {
    const lSpec = SHEET_METAL_PRESETS[0].spec; // has round hole & slot
    const dxf = exportSheetMetalFlatPatternDXF(lSpec);

    expect(dxf).toContain('5_CUTOUTS');
    expect(dxf).toContain('CIRCLE');
    expect(dxf).toContain('4_ANNOTATION');
  });

  it('supports edge-selected bends (side_a, side_b, end, start) and computes available edge lengths', () => {
    const spec: SheetMetalSpec = {
      name: 'Channel Profile',
      materialName: 'EN AW-6060',
      yieldStrengthMpa: 150,
      densityGcm3: 2.7,
      thickness: 2,
      length: 200,
      firstFlange: 60,
      bends: [
        { id: 'b1', angle: 90, radius: 2, flange: 40, direction: 'up', edge: 'end' },
      ],
    };

    // End edge of Flange 0 (between F0 and F1)
    expect(getFlangeAvailableEdgeLength(spec, 0, 'end')).toBe(200);
    // Transverse side edges of Flange 0 (front edge as in user Image 1)
    expect(getFlangeAvailableEdgeLength(spec, 0, 'side_a')).toBe(60);
    expect(getFlangeAvailableEdgeLength(spec, 0, 'side_b')).toBe(60);

    // Flange 1 (flange length 40)
    expect(getFlangeAvailableEdgeLength(spec, 1, 'end')).toBe(200);
    expect(getFlangeAvailableEdgeLength(spec, 1, 'side_a')).toBe(40);
  });

  it('calculates partial width bend (y, z, x) and scales air-bending press tonnage to effective width', () => {
    const specFull: SheetMetalSpec = {
      name: 'Full Width Bend',
      materialName: 'Steel',
      yieldStrengthMpa: 250,
      densityGcm3: 7.85,
      thickness: 2,
      length: 200,
      firstFlange: 50,
      bends: [
        { id: 'b1', angle: 90, radius: 2, flange: 40, direction: 'up', widthMode: 'full' },
      ],
    };

    const specPartial: SheetMetalSpec = {
      name: 'Partial Width Bend (y, z, x)',
      materialName: 'Steel',
      yieldStrengthMpa: 250,
      densityGcm3: 7.85,
      thickness: 2,
      length: 200,
      firstFlange: 50,
      bends: [
        {
          id: 'b1',
          angle: 90,
          radius: 2,
          flange: 40,
          direction: 'up',
          widthMode: 'partial',
          offsetStart: 30, // y = 30 mm
          flangeWidth: 80, // z = 80 mm
          offsetEnd: 90,   // x = 90 mm (30 + 80 + 90 = 200mm)
        },
      ],
    };

    const analysisFull = calculateSheetMetalAnalysis(specFull);
    const analysisPartial = calculateSheetMetalAnalysis(specPartial);

    expect(analysisFull.rows[0].effectiveBendLengthMm).toBe(200);
    expect(analysisPartial.rows[0].effectiveBendLengthMm).toBe(80);

    // Tonnage required for 80mm partial tab is 80/200 (40%) of full width tonnage
    expect(analysisPartial.rows[0].tonnage).toBeCloseTo(analysisFull.rows[0].tonnage * (80 / 200), 2);

    // 3D Geometry generation produces valid watertight BufferGeometry
    const geom = buildSheetMetal3DGeometry(specPartial, 0);
    expect(geom.getAttribute('position').count).toBeGreaterThan(0);
    geom.computeBoundingBox();
    expect(geom.boundingBox).toBeDefined();

    // DXF export contains localized partial bend callout and coordinates
    const dxf = exportSheetMetalFlatPatternDXF(specPartial);
    expect(dxf).toContain('Kısmi');
    expect(dxf).toContain('y=30.0');
    expect(dxf).toContain('z=80.0');
  });

  it('performs true 3D boolean void CSG subtraction for holes, pockets, tabs and slots', () => {
    const specWithCutouts: SheetMetalSpec = {
      name: 'Cutout Void Test Spec',
      materialName: 'EN AW-5052 H32',
      yieldStrengthMpa: 195,
      densityGcm3: 2.68,
      thickness: 2,
      length: 120,
      firstFlange: 50,
      bends: [
        { id: 'b1', angle: 90, radius: 2, flange: 40, direction: 'up' },
      ],
      cutouts: [
        { id: 'c1', name: 'Round Void Hole', type: 'round_hole', flangeIndex: 0, posU: 25, posV: 60, diameter: 10 },
        { id: 'c2', name: 'Pocket Window', type: 'pocket', flangeIndex: 0, posU: 25, posV: 25, width: 14, length: 20, cornerRadius: 2 },
        { id: 'c3', name: 'Edge Tab Balcony', type: 'tab', flangeIndex: 1, posU: 20, posV: 60, width: 15, length: 15 },
      ],
    };

    const geom = buildSheetMetal3DGeometry(specWithCutouts, 0);
    expect(geom.getAttribute('position')).toBeDefined();
    expect(geom.getAttribute('position').count).toBeGreaterThan(50);
    geom.computeBoundingBox();
    expect(geom.boundingBox).toBeDefined();
    geom.dispose();
  });

  it('verifies 4 proactive engineering remedies for bend-adjacent sünme (deformation)', () => {
    const rawSpec: SheetMetalSpec = {
      name: 'Remedy Test Spec',
      materialName: 'Steel',
      yieldStrengthMpa: 250,
      densityGcm3: 7.85,
      thickness: 2,
      length: 100,
      firstFlange: 40,
      bends: [
        { id: 'b1', angle: 90, radius: 2, flange: 40, direction: 'up' },
      ],
      cutouts: [
        { id: 'c_vuln', name: 'Vuln Hole', type: 'round_hole', flangeIndex: 0, posU: 38, posV: 50, diameter: 8 },
      ],
    };

    // Initial check: hole is in severe distortion zone
    const initDef = analyzeHoleDeformation(rawSpec, rawSpec.cutouts![0]);
    expect(initDef.riskLevel).not.toBe('SAFE');
    expect(initDef.elongationPercent).toBeGreaterThan(0);

    // Remedy 1: Laser Relief Slit (absorbs strain)
    const slitSpec = applyReliefSlitRemedy(rawSpec, 'c_vuln');
    const slitDef = analyzeHoleDeformation(slitSpec, slitSpec.cutouts![0]);
    expect(slitDef.riskLevel).toBe('SAFE');
    expect(slitDef.elongationPercent).toBe(0);
    expect(slitDef.activeRemedy).toBe('relief_slit');
    expect(slitDef.dfmAdviceTr).toContain('KORUMALI');

    // Remedy 2: Offset to Safe Zone (moves posU outside deformation zone)
    const offsetSpec = offsetCutoutSafeRemedy(rawSpec, 'c_vuln');
    const offsetDef = analyzeHoleDeformation(offsetSpec, offsetSpec.cutouts![0]);
    expect(offsetDef.riskLevel).toBe('SAFE');

    // Remedy 3: Pre-Compensated Oval (inversely compresses on blank)
    const preCompSpec = togglePreCompensationRemedy(rawSpec, 'c_vuln');
    const preDef = analyzeHoleDeformation(preCompSpec, preCompSpec.cutouts![0]);
    expect(preDef.riskLevel).toBe('SAFE');
    expect(preDef.activeRemedy).toBe('pre_compensated');

    // Remedy 4: Post-Bend Operation (drilled after press brake)
    const postBendSpec = togglePostBendRemedy(rawSpec, 'c_vuln');
    const postDef = analyzeHoleDeformation(postBendSpec, postBendSpec.cutouts![0]);
    expect(postDef.riskLevel).toBe('SAFE');
    expect(postDef.activeRemedy).toBe('post_bend');
  });

  it('detects curved/radius edge bends and issues deep drawing mould warning', () => {
    const mouldSpec: SheetMetalSpec = {
      name: 'Curved Bowl Flange Spec',
      materialName: 'EN AW-5052 H32',
      yieldStrengthMpa: 195,
      densityGcm3: 2.68,
      thickness: 1.5,
      length: 150,
      firstFlange: 60,
      bends: [
        {
          id: 'b_curved',
          angle: 60,
          radius: 3,
          flange: 35,
          direction: 'up',
          edge: 'radius_curved',
          curvedRadiusMm: 45,
        },
      ],
    };

    const feasibility = calculatePressBrakeFeasibility(mouldSpec);
    const mouldCol = feasibility.collisions.find((c) => c.type === 'mould_required');
    expect(mouldCol).toBeDefined();
    expect(mouldCol?.messageTr).toContain('Kavisli / Radius Kenar Bükümü');
    expect(mouldCol?.messageTr).toContain('Derin Çekme Pres Kalıbı');

    // DXF export contains the mould warning annotation
    const dxf = exportSheetMetalFlatPatternDXF(mouldSpec);
    expect(dxf).toContain('KALIP GEREKTİRİR');

    // 3D Geometry builds curved dish flange without error
    const geom = buildSheetMetal3DGeometry(mouldSpec, 0);
    expect(geom.getAttribute('position').count).toBeGreaterThan(0);
    geom.dispose();
  });

  it('parses SVG and DXF contours into custom 2D cutout profiles', () => {
    const sampleSvg = `
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <polygon points="0,0 40,0 40,30 0,30" />
      </svg>
    `;
    const parsedSvg = parseDxfOrSvgCutoutContent(sampleSvg, 'bracket_slot.svg');
    expect(parsedSvg).toBeDefined();
    expect(parsedSvg?.name).toBe('bracket_slot');
    expect(parsedSvg?.profile.length).toBe(4);
    expect(parsedSvg?.width).toBe(40);
    expect(parsedSvg?.length).toBe(30);
  });
});
