"use client";

import { useEffect, useState } from 'react';
import { NewsService, NewsItem } from '@/logic/NewsService';
import { Newspaper, ExternalLink } from 'lucide-react';

export default function NewsPageClient({ lang, dict }: { lang: string, dict: any }) {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        NewsService.getNews(lang)
            .then(setNews)
            .finally(() => setLoading(false));
    }, [lang]);

    const breakingNews = news.find(n => n.isBreaking);
    const otherNews = news.filter(n => !n.isBreaking);

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 lg:p-12 font-sans">
            <header className="max-w-6xl mx-auto flex items-center gap-4 mb-12">
                <div className="w-16 h-16 bg-ind-orange rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3 hover:rotate-6 transition-transform">
                    <Newspaper size={32} />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
                        {dict.news.title}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        {dict.news.subtitle}
                    </p>
                </div>
            </header>

            <div className="max-w-6xl mx-auto space-y-12">

                {/* HERO SECTION (Breaking) */}
                {breakingNews && (
                    <div className="group relative bg-slate-900 rounded-3xl overflow-hidden shadow-2xl min-h-[400px] flex items-end">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-10"></div>

                        {breakingNews.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={breakingNews.image}
                                alt={breakingNews.title}
                                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                            />
                        )}

                        <div className="relative z-20 p-8 lg:p-12 max-w-3xl">
                            <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase rounded mb-4 animate-pulse">
                                {dict.news.breaking}
                            </span>
                            <h2 className="text-3xl lg:text-5xl font-black text-white mb-4 leading-tight">
                                <a href={breakingNews.link} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-ind-orange decoration-4 underline-offset-4">
                                    {breakingNews.title}
                                </a>
                            </h2>
                            <p className="text-slate-300 text-lg mb-6 line-clamp-2">
                                {breakingNews.summary}
                            </p>
                            <div className="flex items-center gap-4 text-sm font-bold text-slate-400">
                                <span>{breakingNews.source}</span>
                                <span>•</span>
                                <span>{breakingNews.date}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* GRID SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {otherNews.map((item) => (
                        <article key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col h-full">
                            {/* Image for Grid Item */}
                            {item.image && (
                                <div className="h-48 overflow-hidden relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                                    <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-widest text-white bg-blue-600 px-2 py-1 rounded shadow-sm">
                                        {item.source}
                                    </span>
                                </div>
                            )}

                            <div className="p-6 flex-1 flex flex-col">
                                {!item.image && (
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                                            {item.source}
                                        </span>
                                        <span className="text-xs text-slate-400">{item.date}</span>
                                    </div>
                                )}

                                {item.image && (
                                    <div className="flex justify-end items-start mb-2">
                                        <span className="text-xs text-slate-400">{item.date}</span>
                                    </div>
                                )}

                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3 group-hover:text-ind-orange transition-colors">
                                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                                        {item.title}
                                    </a>
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3">
                                    {item.summary}
                                </p>

                                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors"
                                    >
                                        {dict.news.readMore} <ExternalLink size={14} />
                                    </a>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                {loading && (
                    <div className="text-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{dict.news.loading}</p>
                    </div>
                )}
            </div>
        </main>
    );
}
