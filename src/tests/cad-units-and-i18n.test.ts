import { describe, it, expect, beforeEach } from 'vitest';
import { CAD_TRANSLATIONS, CadTranslations } from '../locales/cadTranslations';
import { useCadStore } from '../cad/store/cadStore';
import { CAD_LANGUAGES } from '../cad/components/AluCAD';
import { DimensionTool } from '../cad/commands/tools/DimensionTool';
import { DimensionSystem, dimensionSystem } from '../cad/kernel/DimensionSystem';
import { createLineEntity, createCircleEntity } from '../cad/kernel/types';

describe('CAD Units & 12-Language Integration Suite', () => {
  beforeEach(() => {
    useCadStore.setState({
      entities: [],
      layers: [{ id: 'layer-0', name: '0', color: '#3ad0e6', isVisible: true, isLocked: false, opacity: 1, lineWeight: 1, isDeleted: false }],
      activeLayerId: 'layer-0',
      activeCommand: null,
      commandPrompt: '',
      history: [],
      units: 'mm',
    });
  });

  describe('12-Language Translations Integrity', () => {
    const EXPECTED_LANGUAGES = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];

    it('should have all 12 languages registered in CAD_TRANSLATIONS', () => {
      EXPECTED_LANGUAGES.forEach((lang) => {
        expect(CAD_TRANSLATIONS[lang as any]).toBeDefined();
      });
    });

    it('should have all 12 languages listed in CAD_LANGUAGES component catalog', () => {
      expect(CAD_LANGUAGES.length).toBe(12);
      const catalogIds = CAD_LANGUAGES.map((l) => l.id);
      EXPECTED_LANGUAGES.forEach((lang) => {
        expect(catalogIds).toContain(lang);
      });
    });

    it('should have valid units translations for all 12 languages', () => {
      EXPECTED_LANGUAGES.forEach((lang) => {
        const t = CAD_TRANSLATIONS[lang as any] as CadTranslations;
        expect(t.units).toBeDefined();
        expect(t.units?.mm).toBeTruthy();
        expect(t.units?.inch).toBeTruthy();
        expect(t.units?.unitLabel).toBeTruthy();
        expect(t.units?.toggleUnit).toBeTruthy();
        expect(t.units?.convertDrawing).toBeTruthy();
        expect(t.units?.convertPrompt).toBeTruthy();
        expect(t.units?.scaledSuccess).toBeTruthy();
      });
    });

    it('should have valid languageSelector translations for all 12 languages', () => {
      EXPECTED_LANGUAGES.forEach((lang) => {
        const t = CAD_TRANSLATIONS[lang as any] as CadTranslations;
        expect(t.languageSelector).toBeDefined();
        expect(t.languageSelector?.title).toBeTruthy();
        expect(t.languageSelector?.selectLanguage).toBeTruthy();
      });
    });

    it('should have surfaceFinish tool translation for all 12 languages', () => {
      EXPECTED_LANGUAGES.forEach((lang) => {
        const t = CAD_TRANSLATIONS[lang as any] as CadTranslations;
        expect(t.tools).toBeDefined();
        expect(t.tools.surfaceFinish).toBeTruthy();
      });
    });
  });

  describe('CadStore Unit Management & Geometry Scaling', () => {
    it('should default to mm units', () => {
      expect(useCadStore.getState().units).toBe('mm');
    });

    it('should switch units cleanly between mm and in', () => {
      useCadStore.getState().setUnits('in');
      expect(useCadStore.getState().units).toBe('in');

      useCadStore.getState().setUnits('mm');
      expect(useCadStore.getState().units).toBe('mm');
    });

    it('should scale all entities accurately using scaleAllEntities', () => {
      const line = createLineEntity({ x: 0, y: 0 }, { x: 100, y: 0 }, 'layer-0', '#ffffff');
      const circle = createCircleEntity({ x: 50, y: 50 }, 20, 'layer-0', '#ffffff');
      useCadStore.getState().addEntities([line, circle]);

      expect(useCadStore.getState().entities.length).toBe(2);

      // Scale up by factor 2 with origin at (0,0)
      useCadStore.getState().scaleAllEntities(2, { x: 0, y: 0 });

      const scaled = useCadStore.getState().entities;
      const scaledLine = scaled.find((e) => e.geometry.type === 'LINE') as any;
      const scaledCircle = scaled.find((e) => e.geometry.type === 'CIRCLE') as any;

      expect(scaledLine.geometry.start).toEqual({ x: 0, y: 0 });
      expect(scaledLine.geometry.end).toEqual({ x: 200, y: 0 });

      expect(scaledCircle.geometry.center).toEqual({ x: 100, y: 100 });
      expect(scaledCircle.geometry.radius).toBe(40);
    });

    it('should support inch to mm scaling (25.4x) and inverse', () => {
      const line = createLineEntity({ x: 0, y: 0 }, { x: 1, y: 0 }, 'layer-0', '#ffffff');
      useCadStore.getState().addEntity(line);

      // Scale 1 inch geometry to mm
      useCadStore.getState().scaleAllEntities(25.4, { x: 0, y: 0 });
      let currentLine = useCadStore.getState().entities[0] as any;
      expect(currentLine.geometry.end.x).toBeCloseTo(25.4, 4);

      // Scale back to inches
      useCadStore.getState().scaleAllEntities(1 / 25.4, { x: 0, y: 0 });
      currentLine = useCadStore.getState().entities[0] as any;
      expect(currentLine.geometry.end.x).toBeCloseTo(1, 4);
    });
  });

  describe('DimensionTool Dynamic Keyboard Input Parsing', () => {
    it('should parse explicit inch inputs with double quote (e.g. 2")', () => {
      const tool = new DimensionTool();
      tool.start();

      // In mm mode, 2" should be converted to 50.8 mm
      const parsed = tool.parseDimensionInput('2"');
      expect(parsed).toBeCloseTo(50.8, 4);

      const parsedDecimal = tool.parseDimensionInput('1.5"');
      expect(parsedDecimal).toBeCloseTo(38.1, 4);
    });

    it('should parse explicit inch inputs with in suffix (e.g. 2in, 3.25in)', () => {
      const tool = new DimensionTool();
      tool.start();

      const parsed = tool.parseDimensionInput('2in');
      expect(parsed).toBeCloseTo(50.8, 4);

      const parsedWithSpace = tool.parseDimensionInput('3 in');
      expect(parsedWithSpace).toBeCloseTo(76.2, 4);
    });

    it('should parse explicit mm inputs (e.g. 50mm, 100 mm)', () => {
      const tool = new DimensionTool();
      tool.start();

      const parsed = tool.parseDimensionInput('50mm');
      expect(parsed).toBe(50);

      const parsedWithSpace = tool.parseDimensionInput('120 mm');
      expect(parsedWithSpace).toBe(120);
    });

    it('should interpret bare numbers based on store units', () => {
      const tool = new DimensionTool();
      tool.start();

      // When store is in mm mode
      useCadStore.getState().setUnits('mm');
      expect(tool.parseDimensionInput('50')).toBe(50);

      // When store is in inch mode
      useCadStore.getState().setUnits('in');
      expect(tool.parseDimensionInput('2')).toBeCloseTo(50.8, 4);
      expect(tool.parseDimensionInput('0.5')).toBeCloseTo(12.7, 4);
    });
  });

  describe('DimensionSystem Dynamic Text Rendering for Units', () => {
    it('should render linear dimension in mm when units is mm', () => {
      const dimEntity = dimensionSystem.createLinearDimension(
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 25, y: 15 },
        'layer-0'
      );
      const dim = dimEntity.geometry as any;
      expect(dim.value).toBe(50);
      expect(dim.text).toBe('50.00 mm');
    });

    it('should convert and format dimension text dynamically for inch units', () => {
      // DimensionSystem.formatDimensionText converts text or value to inches when units === 'in'
      const formattedMm = DimensionSystem.formatDimensionText('50.00 mm', 50, 'mm');
      expect(formattedMm).toBe('50.00 mm');

      const formattedIn = DimensionSystem.formatDimensionText('50.00 mm', 50, 'in');
      // 50 / 25.4 = 1.9685... -> 1.97"
      expect(formattedIn).toBe('1.97"');

      const formattedDiamIn = DimensionSystem.formatDimensionText('⌀25.40 mm', 25.4, 'in');
      expect(formattedDiamIn).toBe('⌀1.00"');

      const formattedRadiusIn = DimensionSystem.formatDimensionText('R12.70 mm', 12.7, 'in');
      expect(formattedRadiusIn).toBe('R0.500"');
    });
  });
});
