'use client';

import { useState, useEffect, useMemo } from 'react';
import { useI18nStore } from '@/store/i18nStore';
import { dictionary } from '@/locales/dictionary';
import { extractLocale, type SupportedLocale } from '@/locales/types';
import { getNewsFeedCatalog } from '@/locales/newsFeedCatalog';

type NewsCategory = 'Standards' | 'Materials' | 'Manufacturing' | 'Automotive' | 'Sustainability' | 'Regulations' | 'Software';

interface NewsItem {
    id: number;
    title: string;
    source: string;
    date: string;
    category: NewsCategory;
    url?: string;
}

const FILTER_CATEGORIES: Array<NewsCategory | 'All'> = ['All', 'Standards', 'Materials', 'Manufacturing', 'Automotive', 'Sustainability'];

export default function NewsModule() {
    const { language } = useI18nStore();
    const newsT = useMemo(
        () => extractLocale(dictionary, language as SupportedLocale).news,
        [language],
    );

    const categoryLabels: Record<string, string> = useMemo(() => ({
        All: newsT.catAll,
        Standards: newsT.catStandards,
        Materials: newsT.catMaterials,
        Manufacturing: newsT.catManufacturing,
        Automotive: newsT.catAutomotive,
        Sustainability: newsT.catSustainability,
    }), [newsT]);

    const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'All'>('All');
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    const localizedNews = useMemo(() => getNewsFeedCatalog(language), [language]);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            const filtered = selectedCategory === 'All'
                ? localizedNews
                : localizedNews.filter(n => n.category === selectedCategory);
            setNews(filtered);
            setLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [selectedCategory, localizedNews]);

    return (
        <div className="flex flex-col gap-3 h-full">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase" style={{ color: 'var(--color-os-text-secondary)' }}>
                    📰 {newsT.title}
                </span>
                <span className="text-[9px]" style={{ color: 'var(--color-os-text-secondary)' }}>
                    {new Date().toLocaleDateString(language)}
                </span>
            </div>

            <div className="flex gap-1 flex-wrap">
                {FILTER_CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className="px-2 py-1 rounded text-[9px] font-medium transition-all"
                        style={{
                            backgroundColor: selectedCategory === cat ? 'var(--color-os-accent)' : 'var(--color-os-header)',
                            color: selectedCategory === cat ? 'var(--color-os-canvas)' : 'var(--color-os-text-secondary)',
                        }}
                    >
                        {categoryLabels[cat]}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-auto space-y-2">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-pulse" style={{ color: 'var(--color-os-text-secondary)' }}>{newsT.loading}</div>
                    </div>
                ) : news.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--color-os-text-secondary)' }}>
                        {newsT.emptyCategory}
                    </div>
                ) : (
                    news.map(item => (
                        <div
                            key={item.id}
                            className="p-2 rounded-lg transition-all hover:opacity-90 cursor-pointer"
                            style={{ backgroundColor: 'var(--color-os-header)' }}
                        >
                            <div className="flex items-start gap-2">
                                <span className="text-lg">{getCategoryEmoji(item.category)}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium leading-tight mb-1" style={{ color: 'var(--color-os-text-primary)' }}>
                                        {item.title}
                                    </div>
                                    <div className="flex items-center gap-2 text-[9px]" style={{ color: 'var(--color-os-text-secondary)' }}>
                                        <span>{item.source}</span>
                                        <span>•</span>
                                        <span>{item.date}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-2 rounded-lg text-[9px] text-center" style={{ backgroundColor: 'var(--color-os-panel)', color: 'var(--color-os-text-secondary)' }}>
                💡 {newsT.simulatedNote}
            </div>
        </div>
    );
}

function getCategoryEmoji(category: string): string {
    const emojis: Record<string, string> = {
        Standards: '📋',
        Materials: '🧪',
        Manufacturing: '🔧',
        Automotive: '🚗',
        Sustainability: '🌱',
        Regulations: '⚖️',
        Software: '💻',
    };
    return emojis[category] || '📰';
}
