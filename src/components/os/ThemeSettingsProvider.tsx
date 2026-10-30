'use client';

import { useEffect } from 'react';
import { useOSStore } from '@/store/osStore';
import { useThemeSystemSync } from '@/lib/theme/themeStore';
import { useI18nStore } from '@/store/i18nStore';

export function ThemeSettingsProvider() {
    const { fontSize, fontFamily } = useOSStore();
    // Theme classes/attributes are owned by src/lib/theme (data-theme on <html>).
    useThemeSystemSync();
    const { language, setLanguage } = useI18nStore();

    // Sync store translations reactively on client-side mount (with URL parameter support ?lang= or ?locale=)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const queryLang = params.get('lang') || params.get('locale');
            const validLangs = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];
            if (queryLang && validLangs.includes(queryLang)) {
                setLanguage(queryLang as any);
                return;
            }
            if (language) {
                setLanguage(language);
            }
        }
    }, [language, setLanguage]);

    useEffect(() => {
        const doc = document.documentElement;

        // Language & RTL Handling
        doc.lang = language;
        doc.dir = language === 'ar' ? 'rtl' : 'ltr';


        // Map font family
        let mappedFont = 'var(--font-inter, sans-serif)';
        if (fontFamily === 'mono') mappedFont = 'var(--font-jetbrains-mono, monospace)';
        else if (fontFamily === 'serif') mappedFont = 'Georgia, serif';

        // Special case for Japanese/Chinese/Korean fonts if needed
        if (['zh', 'ja', 'ko'].includes(language)) {
            mappedFont = `"Noto Sans CJK SC", "Microsoft YaHei", ${mappedFont}`;
        }

        // Map font scale multiplier
        let fontScale = '1';
        if (fontSize === 'small') {
            fontScale = '0.9';
        } else if (fontSize === 'medium') {
            fontScale = '1.0';
        } else if (fontSize === 'large') {
            fontScale = '1.15';
        } else if (fontSize === 'xlarge') {
            fontScale = '1.3';
        } else if (fontSize === 'auto') {
            // Auto mode: slightly boost on compact laptop screens (e.g. 1366x768, 1280x800)
            if (typeof window !== 'undefined') {
                const w = window.innerWidth;
                const h = window.innerHeight;
                if (w > 640 && w <= 1440 && h <= 900) {
                    fontScale = '1.05';
                } else {
                    fontScale = '1';
                }
            } else {
                fontScale = '1';
            }
        }

        doc.style.setProperty('--app-font', mappedFont);
        doc.style.setProperty('--font-scale', fontScale);
        // Clear any hardcoded inline font-size so CSS calc(var(--base-font-size) * var(--font-scale)) takes effect
        doc.style.removeProperty('font-size');
    }, [fontSize, fontFamily, language]);

    return null; // This component strictly handles side-effects
}
