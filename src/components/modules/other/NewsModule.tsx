'use client';

import { useState, useEffect } from 'react';

// News Module - Engineering & Industry News
interface NewsItem {
    id: number;
    title: string;
    source: string;
    date: string;
    category: string;
    url?: string;
}

// Simulated engineering news feed
const MOCK_NEWS: NewsItem[] = [
    { id: 1, title: 'New ISO Standards for Aluminum Alloy Specifications Released', source: 'ISO Updates', date: '2026-02-05', category: 'Standards' },
    { id: 2, title: 'Breakthrough in Lightweight Composite Materials for Aerospace', source: 'Materials Today', date: '2026-02-04', category: 'Materials' },
    { id: 3, title: 'CNC Machining Accuracy Reaches New Precision Levels', source: 'Manufacturing Weekly', date: '2026-02-03', category: 'Manufacturing' },
    { id: 4, title: 'Electric Vehicle Battery Technology Advances', source: 'Tech News', date: '2026-02-02', category: 'Automotive' },
    { id: 5, title: 'Sustainable Steel Production Methods Gain Traction', source: 'Green Engineering', date: '2026-02-01', category: 'Sustainability' },
    { id: 6, title: '3D Metal Printing Cost Reduced by 40%', source: 'Additive Manufacturing', date: '2026-01-30', category: 'Manufacturing' },
    { id: 7, title: 'EU Releases New Machinery Directive Guidelines', source: 'EU Commission', date: '2026-01-28', category: 'Regulations' },
    { id: 8, title: 'AI Integration in CAD/CAM Software Accelerates', source: 'Design World', date: '2026-01-25', category: 'Software' },
];

const CATEGORIES = ['All', 'Standards', 'Materials', 'Manufacturing', 'Automotive', 'Sustainability', 'Regulations', 'Software'];

export default function NewsModule() {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API fetch
        setLoading(true);
        const timer = setTimeout(() => {
            const filtered = selectedCategory === 'All'
                ? MOCK_NEWS
                : MOCK_NEWS.filter(n => n.category === selectedCategory);
            setNews(filtered);
            setLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [selectedCategory]);

    return (
        <div className="flex flex-col gap-3 h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase" style={{ color: 'var(--color-os-text-secondary)' }}>
                    📰 Industry News
                </span>
                <span className="text-[9px]" style={{ color: 'var(--color-os-text-secondary)' }}>
                    {new Date().toLocaleDateString()}
                </span>
            </div>

            {/* Category Filter */}
            <div className="flex gap-1 flex-wrap">
                {CATEGORIES.slice(0, 6).map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className="px-2 py-1 rounded text-[9px] font-medium transition-all"
                        style={{
                            backgroundColor: selectedCategory === cat ? 'var(--color-os-accent)' : 'var(--color-os-header)',
                            color: selectedCategory === cat ? 'var(--color-os-canvas)' : 'var(--color-os-text-secondary)',
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* News List */}
            <div className="flex-1 overflow-auto space-y-2">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-pulse" style={{ color: 'var(--color-os-text-secondary)' }}>Loading...</div>
                    </div>
                ) : news.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--color-os-text-secondary)' }}>
                        No news in this category
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

            {/* Footer */}
            <div className="p-2 rounded-lg text-[9px] text-center" style={{ backgroundColor: 'var(--color-os-panel)', color: 'var(--color-os-text-secondary)' }}>
                💡 News updates are simulated. Connect to a real API for live data.
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
