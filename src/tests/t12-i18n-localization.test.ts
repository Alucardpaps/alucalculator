/**
 * src/tests/t12-i18n-localization.test.ts
 *
 * Verifies t12 resolution across all 12 supported languages:
 * 'en' | 'tr' | 'de' | 'es' | 'fr' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko' | 'ar'
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { t12, loadT12 } from '@/locales/t12';
import type { Language } from '@/store/i18nStore';

describe('t12 Multi-Language Engineering Localization', () => {
    const ALL_LANGUAGES: Language[] = [
        'en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'
    ];

    // tables load on demand (one chunk per language), as in the app
    beforeAll(async () => {
        await Promise.all(ALL_LANGUAGES.map((l) => loadT12(l)));
    });

    const testKeys = [
        'Column Buckling',
        'Euler governs',
        'EC3 Design Stress',
        'Slenderness Ratio (λ)',
        'Transitional Flow (2300 < Re < 4000)',
        'Water (20°C)',
        'Air (20°C, 1 atm)',
        'Stepped Shaft CAD & DIN 743',
        'Static Shaft Sizing & Stress',
        'Basic Rating Life L10',
        'Rating Life L10h',
        'Static Safety S0',
        'Safe Design (DIN 743 PASSED)',
        'Overstressed (FoS Violation)'
    ];

    it('T12-ALL-LANGS-RESOLVED: ensures every key produces valid non-empty translation for all 12 languages', () => {
        for (const key of testKeys) {
            for (const lang of ALL_LANGUAGES) {
                const res = t12(lang, key);
                expect(res).toBeTruthy();
                expect(res.length).toBeGreaterThan(0);
            }
        }
    });

    it('T12-SPECIFIC-TERMS: verifies exact translations for Column Buckling and Pipe Friction', () => {
        // German
        expect(t12('de', 'Euler governs')).toBe('Euler maßgebend');
        expect(t12('de', 'Column Buckling')).toBe('Stabknicken');
        expect(t12('de', 'Water (20°C)')).toBe('Wasser (20°C)');

        // French
        expect(t12('fr', 'Euler governs')).toBe('Euler régit');
        expect(t12('fr', 'Column Buckling')).toBe('Flambement des Poteaux');

        // Spanish
        expect(t12('es', 'Euler governs')).toBe('Rige Euler');
        expect(t12('es', 'Column Buckling')).toBe('Pandeo de Columnas');

        // Turkish
        expect(t12('tr', 'Euler governs')).toBe('Euler geçerli');
        expect(t12('tr', 'Column Buckling')).toBe('Kolon Burkulması');

        // Japanese
        expect(t12('ja', 'Euler governs')).toBe('オイラー座屈支配');
        expect(t12('ja', 'Column Buckling')).toBe('柱の座屈解析');

        // Chinese
        expect(t12('zh', 'Euler governs')).toBe('欧拉弹性屈曲控制');
        expect(t12('zh', 'Column Buckling')).toBe('压杆稳定与屈曲分析');

        // Russian
        expect(t12('ru', 'Euler governs')).toBe('Преобладает Эйлер');
        expect(t12('ru', 'Column Buckling')).toBe('Продольный изгиб колонн');

        // Arabic
        expect(t12('ar', 'Euler governs')).toBe('أويلر هو الحاكم');
        expect(t12('ar', 'Column Buckling')).toBe('انبعاج الأعمدة');
    });

    it('T12-SHAFTS-AND-BEARINGS: verifies shaft and bearing localized terms', () => {
        expect(t12('de', 'Stepped Shaft CAD & DIN 743')).toBe('Absatzwelle CAD & DIN 743');
        expect(t12('fr', 'Stepped Shaft CAD & DIN 743')).toBe('Arbre Épaulé CAD & DIN 743');
        expect(t12('tr', 'Basic Rating Life L10')).toBe('Temel Nominal Ömür L10');
        expect(t12('de', 'Basic Rating Life L10')).toBe('Nominelle Lebensdauer L10');
        expect(t12('es', 'Static Safety S0')).toBe('Factor de Seguridad Estático S0');
    });

    it('T12-CAD-LANGUAGES-INTEGRITY: verifies all 12 CAD languages have full translation sets', async () => {
        const { CAD_LANGUAGES, getCadTranslations } = await import('@/locales/cadTranslations');

        expect(CAD_LANGUAGES.length).toBe(12);

        for (const langObj of CAD_LANGUAGES) {
            const cadT = getCadTranslations(langObj.id);
            expect(cadT).toBeDefined();
            expect(cadT.tools.line).toBeTruthy();
            expect(cadT.tools.circle).toBeTruthy();
            expect(cadT.tools.dimension).toBeTruthy();
            expect(cadT.menu.file).toBeTruthy();
            expect(cadT.units?.mm).toBeTruthy();
        }
    });

    it('T12-DYNAMIC-BLOCKS-LOCALIZATION: verifies dynamic blocks terminology resolution', () => {
        // Turkish fallback & table lookup
        expect(t12('tr', 'Scale', 'Ölçek (Scale)')).toBe('Ölçek (Scale)');
        expect(t12('tr', 'Insert 2D CAD', '2D Çizime Ekle')).toBe('2D Çizime Ekle');
        expect(t12('tr', 'Dynamic Grips', 'AutoCAD Dinamik Tutamaklar')).toBe('AutoCAD Dinamik Tutamaklar');

        // English baseline
        expect(t12('en', 'Scale', 'Ölçek (Scale)')).toBe('Scale');
        expect(t12('en', 'Insert 2D CAD', '2D Çizime Ekle')).toBe('Insert 2D CAD');

        // German / French / Spanish fallback to en when key not in table, or localized
        expect(t12('de', 'Scale')).toBeTruthy();
        expect(t12('fr', 'Scale')).toBeTruthy();
        expect(t12('es', 'Scale')).toBeTruthy();
    });
});

