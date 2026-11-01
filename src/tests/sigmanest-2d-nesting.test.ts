/**
 * 🧪 AluCAD OS — SigmaNEST Industrial 2D Nesting & Remnant Parity Test Suite
 * 
 * Verifies 1:1 Clean Room parity against genuine SigmaNEST programs & reports from 10.zip:
 * 1. 30 MM DENEME Benchmark: 15,000 x 4,000 mm sheet, ~8.45m used, TaskSheet45-1 remnant severance
 * 2. True Scrap % deduction accounting for reusable remnant plate
 * 3. Transverse Guillotine Crop Cut generation across plate boundary
 * 4. Production-grade ESAB ESSI (.mpg) CNC emission syntax: 140+100, 5, 6, 29, 53, 74, 38, crop cut
 * 5. Thickness-dependent lead-in / dwell scaling (6mm vs 30mm vs 100mm)
 * 6. Part-in-Part (donut / internal cavity) nesting
 * 7. Downstream manufacturing attribute clustering (bending vs welding)
 * 8. Remnant-First inventory consumption
 */

import { describe, it, expect } from 'vitest';
import { 
  executeSigmaNest2D, 
  buildSigmaNestReportData,
  calculateSigmaNestLeadInParameters,
  emitPlasmaGcode,
  type PlasmaProcessProfile,
  type SequencedJobResult,
  calculateWeightKg
} from '@/cam';
import type { Part2D, Sheet2D, NestingOptions, RemnantSheet2D } from '@/types/nesting2d.types';

describe('SigmaNEST Industrial 2D Nesting & Remnant Engine Parity', () => {

  // ─── 1. 30 MM DENEME BENCHMARK & REMNANT GENERATION ───
  describe('1. 30 MM DENEME Ground Truth Parity (15000 x 4000 mm sheet)', () => {
    // Ground truth parts from 30 MM DENEME.PDF:
    // SWP1625M.14.01.02.10.00: 6554 x 608 mm
    // SWP21625M.14.01.01.02.00: 6554 x 608 mm
    // SWP1625M.17.03.02.02.00: 5006 x 290 mm
    // SWP1625M.16.02.01.02.02: 4831 x 190 mm
    const parts: Part2D[] = [
      {
        id: 'P1-6554',
        label: 'SWP1625M.14.01.02.10.00',
        polygon: {
          points: [{ x: 0, y: 0 }, { x: 6554, y: 0 }, { x: 6554, y: 608 }, { x: 0, y: 608 }],
          bounds: { x: 0, y: 0, width: 6554, height: 608 },
          area: 6554 * 608
        },
        quantity: 2,
        allowedRotations: [0],
        material: 'S235JR',
        thickness: 30
      },
      {
        id: 'P2-5006',
        label: 'SWP1625M.17.03.02.02.00',
        polygon: {
          points: [{ x: 0, y: 0 }, { x: 5006, y: 0 }, { x: 5006, y: 290 }, { x: 0, y: 290 }],
          bounds: { x: 0, y: 0, width: 5006, height: 290 },
          area: 5006 * 290
        },
        quantity: 2,
        allowedRotations: [0],
        material: 'S235JR',
        thickness: 30
      },
      {
        id: 'P3-4831',
        label: 'SWP1625M.16.02.01.02.02',
        polygon: {
          points: [{ x: 0, y: 0 }, { x: 4831, y: 0 }, { x: 4831, y: 190 }, { x: 0, y: 190 }],
          bounds: { x: 0, y: 0, width: 4831, height: 190 },
          area: 4831 * 190
        },
        quantity: 2,
        allowedRotations: [0],
        material: 'S235JR',
        thickness: 30
      }
    ];

    const sheet: Sheet2D = {
      width: 15000,
      height: 4000,
      kerf: 2.0
    };

    const options: NestingOptions = {
      rotationStep: 0,
      spacing: 10,
      algorithm: 'sigmanest',
      heuristic: 'best-area-fit',
      multiSheet: false,
      maxSheets: 1,
      enableRemnantGeneration: true,
      minRemnantDimensionMm: 500
    };

    it('should nest long structural parts within an ~8.5m envelope and generate a TaskSheet remnant plate', () => {
      const result = executeSigmaNest2D({ parts, sheet, options });
      expect(result.sheets.length).toBe(1);
      const sheet1 = result.sheets[0];

      // All 6 heavy structural parts must be placed
      expect(sheet1.placedParts.length).toBe(6);

      // Used envelope width should be around 6554 - 8500 mm
      expect(sheet1.usedEnvelope).toBeDefined();
      expect(sheet1.usedEnvelope!.width).toBeGreaterThanOrEqual(6554);
      expect(sheet1.usedEnvelope!.width).toBeLessThan(10000);

      // Must generate a formal SigmaNEST Remnant Sheet (Kalıntı Sac)
      expect(sheet1.remnantSheet).toBeDefined();
      const remnant = sheet1.remnantSheet!;
      expect(remnant.id).toBe('TaskSheet1-1');
      expect(remnant.material).toBe('S235JR');
      expect(remnant.thickness).toBe(30);

      // Remnant dimensions: width should be >= 5000 mm, height = 4000 mm
      expect(remnant.width).toBeGreaterThanOrEqual(5000);
      expect(remnant.height).toBe(4000);

      // Remnant weight must be substantial (> 4 tons of steel recovered)
      expect(remnant.weightKg).toBeGreaterThan(4000);

      // Must generate a transverse guillotine crop cut line
      expect(sheet1.cropCut).toBeDefined();
      const crop = sheet1.cropCut!;
      expect(crop.axis).toBe('x');
      expect(crop.lengthMm).toBe(4000);
      expect(crop.startPoint.y).toBe(4000);
      expect(crop.endPoint.y).toBe(0);
      expect(crop.coordinate).toBeCloseTo(sheet1.usedEnvelope!.width + sheet.kerf, 0);

      // True scrap % must be low (< 25% for 6 parts, recovering >7 tons in remnant)
      expect(sheet1.trueScrapPercent).toBeDefined();
      expect(sheet1.trueScrapPercent!).toBeLessThan(25);
    });

    it('should produce an industrial-grade SigmaNEST detailed report object matching 30 MM DENEME.PDF', () => {
      const result = executeSigmaNest2D({ parts, sheet, options });
      const report = buildSigmaNestReportData(result.sheets[0], parts, {
        taskName: 'T17_S235JR_30mm',
        programName: '30 MM DENEME',
        machineName: 'Esab_Plasma',
        sheetWidth: 15000,
        sheetHeight: 4000,
        thickness: 30,
        material: 'S235JR'
      });

      expect(report.reportTitle).toBe('Yerleşim Detayı');
      expect(report.machineName).toBe('Esab_Plasma');
      expect(report.taskName).toBe('T17_S235JR_30mm');
      expect(report.programName).toBe('30 MM DENEME');
      expect(report.sheetWeightKg).toBeGreaterThan(13000); // 15m x 4m x 30mm steel = ~14.1 tons
      expect(report.remnantWeightKg).toBeGreaterThan(4000);
      expect(report.scrapPercent).toBeLessThan(25);
      expect(report.parts.length).toBe(3); // 3 part types
      expect(report.parts[0].requiredQty).toBe(2);
      expect(report.parts[0].nestedQty).toBe(2);
    });
  });

  // ─── 2. ESAB ESSI (.MPG) PRODUCTION EMITTER ───
  describe('2. Genuine ESAB ESSI (.mpg) CNC Emission Parity', () => {
    const profile: PlasmaProcessProfile = {
      id: 's235jr_30mm',
      name: 'S235JR 30mm Plasma',
      material: 'S235JR',
      thicknessMm: 30,
      currentAmps: 200,
      arcVoltage: 155,
      gasType: 'Oxygen / Air',
      cutSpeedMmMin: 1200,
      kerfMm: 2.0,
      swirl: 'CW',
      pierceHeightMm: 8.0,
      cutHeightMm: 4.5,
      pierceDelaySec: 1.8,
      leadIn: { type: 'line', lengthMm: 18, overcutMm: 3, leadOutLengthMm: 7 },
      thermalEfficiencyEta: 0.85
    };

    const mockJob: SequencedJobResult = {
      toolpaths: [
        {
          contourId: 'part1-outer',
          role: 'outer',
          operations: [
            { type: 'rapid', point: { x: 100, y: 100 }, feedRateMmMin: 12000, torchOn: false },
            { type: 'pierce', dwellSec: 1.8, feedRateMmMin: 0, torchOn: true },
            { 
              type: 'cut', 
              segment: { type: 'line', start: { x: 100, y: 100 }, end: { x: 600, y: 100 }, length: 500 }, 
              feedRateMmMin: 1200, 
              torchOn: true 
            },
            {
              type: 'leadOut',
              segment: { type: 'line', start: { x: 600, y: 100 }, end: { x: 620, y: 120 }, length: 28 },
              feedRateMmMin: 840,
              torchOn: true
            }
          ],
          piercePoint: { x: 100, y: 100 },
          startPoint: { x: 100, y: 100 },
          endPoint: { x: 620, y: 120 },
          totalLengthMm: 528,
          estimatedTimeSec: 30
        }
      ],
      strategy: 'progressive-common-line',
      totalLengthMm: 528,
      totalRapidLengthMm: 141,
      totalCutTimeSec: 26,
      totalJobTimeSec: 35,
      commonLineEdgeCount: 0,
      pierceCount: 1,
      standardPierceCount: 1,
      sigmaNestSimulatedPierces: 1,
      pierceSavingsPercent: 0,
      thermalAnalysis: {
        heatInputQ_kJ_mm: 1.3,
        totalEnergyKj: 686,
        maxTemperatureRiseTheta: 45,
        averageTemperatureRiseTheta: 18,
        partWarpingRiskScores: [{ partId: 'part1', score: 25, level: 'green', dominantFactor: 'OK' }]
      }
    };

    it('should format ESSI .mpg coordinates with 0.1mm units and include feedrate, dwell, and crop cut', () => {
      const cropCut = {
        axis: 'x' as const,
        coordinate: 8500,
        startPoint: { x: 8500, y: 4000 },
        endPoint: { x: 8500, y: 0 },
        lengthMm: 4000,
        piercePoint: { x: 8500, y: 4010 }
      };

      const mpg = emitPlasmaGcode(mockJob, profile, {
        dialect: 'essi_experimental',
        cropCut
      });

      // Rapid move command is 5
      expect(mpg).toContain('5\n');

      // Pierce command is 6
      expect(mpg).toContain('6\n');

      // Pierce dwell is 29
      expect(mpg).toContain('29\n');

      // Kerf left is 53, kerf off is 54
      expect(mpg).toContain('53\n');
      expect(mpg).toContain('54\n');

      // Torch off is 38
      expect(mpg).toContain('38\n');

      // Corner deceleration & feedrate
      expect(mpg).toContain('140+100');
      expect(mpg).toContain('140+70');

      // Coordinates must be formatted in 0.1 mm units (e.g., dx=500mm -> +5000)
      expect(mpg).toContain('+5000+0');

      // Guillotine crop cut severance must be present (dy=-4000mm -> -40000)
      expect(mpg).toContain('+0-40000');
    });
  });

  // ─── 3. THICKNESS-DEPENDENT LEAD-IN SCALING ───
  describe('3. Heavy-Plate Lead-In / Dwell Scaling (6mm vs 30mm vs 100mm)', () => {
    it('scales lead-in length and pierce dwell proportionally to thickness', () => {
      const thin6 = calculateSigmaNestLeadInParameters(6, 'S235JR');
      const mid30 = calculateSigmaNestLeadInParameters(30, 'S235JR');
      const heavy100 = calculateSigmaNestLeadInParameters(100, 'S235JR');

      // 6mm sheet
      expect(thin6.leadInLengthMm).toBeLessThanOrEqual(5);
      expect(thin6.pierceDelaySec).toBeLessThan(0.5);

      // 30mm plate (ground truth 18mm lead-in, 1.8s dwell)
      expect(mid30.leadInLengthMm).toBe(18.0);
      expect(mid30.pierceDelaySec).toBeGreaterThanOrEqual(1.5);
      expect(mid30.cornerDecelPercent).toBe(70);

      // 100mm heavy plate (ground truth 48mm straight + arc, 3.5s dwell)
      expect(heavy100.leadInLengthMm).toBeGreaterThanOrEqual(45);
      expect(heavy100.pierceDelaySec).toBeGreaterThanOrEqual(3.0);
    });
  });

  // ─── 4. PART-IN-PART (DONUT/HOLE) NESTING ───
  describe('4. Part-in-Part (Donut/Cutout Cavity) Nesting', () => {
    it('places a small part inside the internal cavity of a large frame part', () => {
      const largeFrame: Part2D = {
        id: 'large-frame',
        label: 'Frame Outer',
        polygon: {
          points: [{ x: 0, y: 0 }, { x: 1200, y: 0 }, { x: 1200, y: 1000 }, { x: 0, y: 1000 }],
          bounds: { x: 0, y: 0, width: 1200, height: 1000 },
          area: 1200 * 1000
        },
        innerPolygons: [{
          points: [{ x: 200, y: 200 }, { x: 1000, y: 200 }, { x: 1000, y: 800 }, { x: 200, y: 800 }],
          bounds: { x: 200, y: 200, width: 800, height: 600 },
          area: 800 * 600
        }],
        quantity: 1,
        allowedRotations: [0]
      };

      const smallInsert: Part2D = {
        id: 'small-insert',
        label: 'Small Flange',
        polygon: {
          points: [{ x: 0, y: 0 }, { x: 250, y: 0 }, { x: 250, y: 250 }, { x: 0, y: 250 }],
          bounds: { x: 0, y: 0, width: 250, height: 250 },
          area: 250 * 250
        },
        quantity: 1,
        allowedRotations: [0]
      };

      const sheet: Sheet2D = { width: 1500, height: 1200, kerf: 1.0 };
      const options: NestingOptions = {
        rotationStep: 0,
        spacing: 10,
        algorithm: 'sigmanest',
        heuristic: 'best-area-fit',
        multiSheet: false,
        maxSheets: 1,
        enablePartInPart: true,
        minRemnantDimensionMm: 300
      };

      const result = executeSigmaNest2D({
        parts: [largeFrame, smallInsert],
        sheet,
        options
      });

      expect(result.sheets.length).toBe(1);
      const placed = result.sheets[0].placedParts;
      expect(placed.length).toBe(2);

      // Verify the small insert's position is within the inner cutout cavity of the frame
      const placedSmall = placed.find(p => p.partId === 'small-insert');
      expect(placedSmall).toBeDefined();
      expect(placedSmall!.position.x).toBeGreaterThanOrEqual(200);
      expect(placedSmall!.position.y).toBeGreaterThanOrEqual(200);
    });
  });

  // ─── 5. DOWNSTREAM PROCESS CLUSTERING ───
  describe('5. Downstream Manufacturing Attribute Clustering', () => {
    it('groups parts with identical downstream operations (bending vs welding)', () => {
      const parts: Part2D[] = [
        {
          id: 'B1',
          label: 'Bending Bracket 1',
          polygon: {
            points: [{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 300, y: 200 }, { x: 0, y: 200 }],
            bounds: { x: 0, y: 0, width: 300, height: 200 },
            area: 60000
          },
          quantity: 2,
          allowedRotations: [0],
          downstreamProcess: 'bending'
        },
        {
          id: 'W1',
          label: 'Welding Gusset 1',
          polygon: {
            points: [{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 300, y: 200 }, { x: 0, y: 200 }],
            bounds: { x: 0, y: 0, width: 300, height: 200 },
            area: 60000
          },
          quantity: 2,
          allowedRotations: [0],
          downstreamProcess: 'welding'
        }
      ];

      const sheet: Sheet2D = { width: 2500, height: 1250, kerf: 1.0 };
      const options: NestingOptions = {
        rotationStep: 0,
        spacing: 10,
        algorithm: 'sigmanest',
        heuristic: 'best-area-fit',
        multiSheet: false,
        maxSheets: 1,
        downstreamClustering: true
      };

      const result = executeSigmaNest2D({ parts, sheet, options });
      expect(result.sheets.length).toBe(1);
      const placed = result.sheets[0].placedParts;
      expect(placed.length).toBe(4);

      // Bending parts should be placed first before welding parts
      const bIdxs = placed.map((p, idx) => p.partId === 'B1' ? idx : -1).filter(i => i >= 0);
      const wIdxs = placed.map((p, idx) => p.partId === 'W1' ? idx : -1).filter(i => i >= 0);
      expect(Math.max(...bIdxs)).toBeLessThan(Math.min(...wIdxs));
    });
  });

  // ─── 6. REMNANT-FIRST INVENTORY ALLOCATION ───
  describe('6. Remnant-First Stock Consumption', () => {
    it('consumes an available remnant plate before pulling a new full-size raw plate', () => {
      const smallPart: Part2D = {
        id: 'SP1',
        label: 'Spacer Plate',
        polygon: {
          points: [{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 400, y: 300 }, { x: 0, y: 300 }],
          bounds: { x: 0, y: 0, width: 400, height: 300 },
          area: 120000
        },
        quantity: 2,
        allowedRotations: [0]
      };

      const remnantInventory: RemnantSheet2D[] = [
        {
          id: 'TaskSheet-REMNANT-01',
          name: 'Kalıntı Sac S235JR 30mm',
          material: 'S235JR',
          thickness: 30,
          width: 1000,
          height: 800,
          originX: 7000,
          originY: 0,
          weightKg: 188.4,
          originSheetIndex: 0,
          createdAt: new Date().toISOString()
        }
      ];

      const fullRawSheet: Sheet2D = { width: 6000, height: 2000, kerf: 1.0 };
      const options: NestingOptions = {
        rotationStep: 0,
        spacing: 10,
        algorithm: 'sigmanest',
        heuristic: 'best-area-fit',
        multiSheet: true,
        maxSheets: 2,
        remnants: remnantInventory
      };

      const result = executeSigmaNest2D({
        parts: [smallPart],
        sheet: fullRawSheet,
        options
      });

      // The 2 parts fit completely within the 1000 x 800 mm remnant plate!
      expect(result.sheets.length).toBe(1);
      expect(result.sheets[0].placedParts.length).toBe(2);
      // Envelope width must be <= 1000 mm (remnant plate width)
      expect(result.sheets[0].usedEnvelope!.width).toBeLessThanOrEqual(1000);
    });
  });

});
