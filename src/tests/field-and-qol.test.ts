import { describe, it, expect } from 'vitest';
import { SIDEBAR_ITEM_LABELS, type SidebarLocale } from '../locales/sidebarTranslations';
import { getModuleHints } from '../locales/moduleHintsTranslations';
import { getFieldToolsStrings } from '../locales/fieldToolsTranslations';
import type { Language } from '../store/i18nStore';

describe('12-Language i18n Completeness Verification', () => {
  const ALL_LANGUAGES: Language[] = [
    'en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'
  ];

  it('verifies all 12 languages have sidebar labels for new mechanical/fluids/manufacturing modules', () => {
    const requiredModules = ['keyway-connection', 'press-fit', 'o-ring'];

    for (const modId of requiredModules) {
      const itemTranslations = SIDEBAR_ITEM_LABELS[modId];
      expect(itemTranslations, `Module ${modId} missing from SIDEBAR_ITEM_LABELS`).toBeDefined();

      for (const lang of ALL_LANGUAGES) {
        const label = itemTranslations[lang];
        expect(label, `Module ${modId} missing translation for ${lang}`).toBeDefined();
        expect(label.length, `Label for ${modId} empty in ${lang}`).toBeGreaterThan(0);
      }
    }
  });

  it('verifies all 12 languages have module hints for command palette and search', () => {
    const requiredModules = ['keyway-connection', 'press-fit', 'o-ring'];

    for (const lang of ALL_LANGUAGES) {
      const hints = getModuleHints(lang);
      expect(hints, `Missing module hints for locale: ${lang}`).toBeDefined();

      for (const modId of requiredModules) {
        const hintText = hints[modId];
        expect(hintText, `Module hint for ${modId} missing in ${lang}`).toBeDefined();
        expect(hintText.length, `Module hint for ${modId} empty in ${lang}`).toBeGreaterThan(0);
      }
    }
  });

  it('verifies field tools translations return valid strings for all 12 languages', () => {
    for (const lang of ALL_LANGUAGES) {
      const ft = getFieldToolsStrings(lang);
      expect(ft, `Missing field tools strings for ${lang}`).toBeDefined();
      expect(ft.boltTorqueScreening).toBeDefined();
      expect(ft.boltTorqueScreening!.length).toBeGreaterThan(0);
      expect(ft.oringCaliperMatcher).toBeDefined();
      expect(ft.oringCaliperMatcher!.length).toBeGreaterThan(0);
      expect(ft.fieldWorkOrderShare).toBeDefined();
      expect(ft.fieldWorkOrderShare!.length).toBeGreaterThan(0);
    }
  });
});

describe('Field Suite - Bolt Torque Screening Calculations', () => {
  // ISO 898-1 screening formulas
  const BOLT_SIZES: Record<string, { nominalDia: number; tensileArea: number }> = {
    M8: { nominalDia: 8, tensileArea: 36.6 },
    M10: { nominalDia: 10, tensileArea: 58.0 },
    M12: { nominalDia: 12, tensileArea: 84.3 },
    M16: { nominalDia: 16, tensileArea: 157.0 },
  };

  const BOLT_CLASSES: Record<string, { yieldMpa: number }> = {
    '4.8': { yieldMpa: 320 },
    '8.8': { yieldMpa: 640 },
    '10.9': { yieldMpa: 940 },
    '12.9': { yieldMpa: 1080 },
  };

  const FRICTION_FACTORS = {
    dry: 0.20,
    oiled: 0.16,
    mos2: 0.13,
  };

  function computeTorque(sizeKey: string, classKey: string, friction: number): number {
    const size = BOLT_SIZES[sizeKey];
    const boltClass = BOLT_CLASSES[classKey];
    const preloadForceN = 0.75 * boltClass.yieldMpa * size.tensileArea;
    const torqueNm = (friction * preloadForceN * size.nominalDia) / 1000;
    return Math.round(torqueNm * 10) / 10;
  }

  it('computes standard tightening torques for M12 grade 8.8 with high accuracy', () => {
    // M12 8.8: As = 84.3 mm^2, Rp0.2 = 640 MPa -> F_preload = 0.75 * 640 * 84.3 = 40464 N
    // Dry (K=0.20): 0.20 * 40464 * 12 / 1000 = 97.1 N*m
    const torqueDry = computeTorque('M12', '8.8', FRICTION_FACTORS.dry);
    expect(torqueDry).toBeCloseTo(97.1, 1);

    // Oiled (K=0.16): 0.16 * 40464 * 12 / 1000 = 77.7 N*m
    const torqueOiled = computeTorque('M12', '8.8', FRICTION_FACTORS.oiled);
    expect(torqueOiled).toBeCloseTo(77.7, 1);

    // MoS2 (K=0.13): 0.13 * 40464 * 12 / 1000 = 63.1 N*m
    const torqueMoS2 = computeTorque('M12', '8.8', FRICTION_FACTORS.mos2);
    expect(torqueMoS2).toBeCloseTo(63.1, 1);
  });

  it('demonstrates significant torque reduction with lubrication to achieve identical preload', () => {
    const dry = computeTorque('M16', '10.9', FRICTION_FACTORS.dry);
    const oiled = computeTorque('M16', '10.9', FRICTION_FACTORS.oiled);
    const mos2 = computeTorque('M16', '10.9', FRICTION_FACTORS.mos2);

    expect(oiled).toBeLessThan(dry);
    expect(mos2).toBeLessThan(oiled);
    expect(mos2 / dry).toBeCloseTo(0.13 / 0.20, 2);
  });
});

describe('Field Suite - O-Ring Caliper & Gland Matcher', () => {
  const STANDARD_CORDS = [1.0, 1.5, 1.78, 2.0, 2.4, 2.5, 2.62, 3.0, 3.53, 4.0, 5.0, 5.33, 5.7, 6.99, 8.0];

  function findClosestCord(measured: number): number {
    return STANDARD_CORDS.reduce((prev, curr) =>
      Math.abs(curr - measured) < Math.abs(prev - measured) ? curr : prev
    );
  }

  it('matches caliper cord measurements to closest ISO 3601 / AS568 standard cords', () => {
    expect(findClosestCord(2.65)).toBe(2.62);
    expect(findClosestCord(3.50)).toBe(3.53);
    expect(findClosestCord(1.80)).toBe(1.78);
    expect(findClosestCord(7.05)).toBe(6.99);
  });

  it('detects swelling or severe wear when measured cord deviates by more than 0.15mm', () => {
    const measuredSwollen = 2.80; // Standard is 2.62 -> diff is 0.18mm (> 0.15mm)
    const closest = findClosestCord(measuredSwollen);
    const diff = Math.abs(measuredSwollen - closest);
    const hasSwellingWarning = diff > 0.15;

    expect(closest).toBe(2.62);
    expect(diff).toBeCloseTo(0.18, 2);
    expect(hasSwellingWarning).toBe(true);
  });

  it('computes recommended static gland depth and width based on matched cord', () => {
    const cord = 3.53;
    const recDepth = Math.round(cord * 0.78 * 100) / 100; // ~2.75 mm
    const recWidth = Math.round(cord * 1.38 * 100) / 100; // ~4.87 mm

    expect(recDepth).toBe(2.75);
    expect(recWidth).toBe(4.87);
    // Verifies 22% squeeze and gland fill clearance
    expect(recDepth).toBeLessThan(cord);
    expect(recWidth).toBeGreaterThan(cord);
  });
});
