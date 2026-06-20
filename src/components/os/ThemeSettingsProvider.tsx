'use client';

import { useEffect } from 'react';
import { useOSStore } from '@/store/osStore';
import { useI18nStore } from '@/store/i18nStore';

export function ThemeSettingsProvider() {
    const { theme, fontSize, fontFamily } = useOSStore();
    const { language, setLanguage } = useI18nStore();

    // Sync store translations reactively on client-side mount
    useEffect(() => {
        if (typeof window !== 'undefined' && language) {
            // Force sync and refresh store translations to trigger reactive updates on hydrated load
            setLanguage(language);
        }
    }, [language, setLanguage]);

    useEffect(() => {
        const doc = document.documentElement;

        // Language & RTL Handling
        doc.lang = language;
        doc.dir = language === 'ar' ? 'rtl' : 'ltr';

        // Remove all known theme classes
        doc.classList.remove('dark', 'light', 'sea', 'sky', 'paper');
        doc.classList.add(theme);

        // Map font family
        let mappedFont = 'var(--font-inter, sans-serif)';
        if (fontFamily === 'mono') mappedFont = 'var(--font-jetbrains-mono, monospace)';
        else if (fontFamily === 'serif') mappedFont = 'Georgia, serif';

        // Special case for Japanese/Chinese/Korean fonts if needed
        if (['zh', 'ja', 'ko'].includes(language)) {
            mappedFont = `"Noto Sans CJK SC", "Microsoft YaHei", ${mappedFont}`;
        }

        // Map font size
        let mappedSize = '14px'; // medium default
        if (fontSize === 'small') mappedSize = '12px';
        else if (fontSize === 'large') mappedSize = '16px';

        doc.style.setProperty('--app-font', mappedFont);
        doc.style.fontSize = mappedSize;

    }, [theme, fontSize, fontFamily, language]);

    return null; // This component strictly handles side-effects
}
