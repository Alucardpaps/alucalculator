"use client";

import { useEffect, useState } from 'react';
import { NewsService, NewsItem } from '@/services/NewsService';
import { Newspaper, ExternalLink, Calendar, Loader2 } from 'lucide-react';

export const NewsSection = ({ lang, dict }: { lang: string, dict: any }) => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const data = await NewsService.getNews(lang);
                setNews(data);
            } catch (error) {
                console.error("News fetch error", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, [lang]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-slate-300" size={32} />
            </div>
        );
    }

    if (news.length === 0) return null;

    const breaking = news.find(n => n.isBreaking) || news[0];
    const others = news.filter(n => n.id !== breaking.id).slice(0, 4);

    return (
        <section className="py-12 mt-12 border-t border-slate-200 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                        <Newspaper size={20} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">{dict.nav?.news || 'Industry News'}</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Breaking News */}
                    <div className="lg:col-span-2 group cursor-pointer relative overflow-hidden rounded-2xl shadow-xl h-[400px]">
                        <a href={breaking.link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                            <div className="absolute inset-0 bg-slate-900">
                                {breaking.image ? (
                                    <img
                                        src={breaking.image}
                                        alt={breaking.title}
                                        className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500 group-hover:scale-105 transform"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 opacity-60" />
                                )}
                            </div>
                            <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/90 to-transparent">
                                <div className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase rounded mb-3 animate-pulse">
                                    Breaking
                                </div>
                                <h3 className="text-3xl font-black text-white mb-2 leading-tight group-hover:text-blue-300 transition-colors">
                                    {breaking.title}
                                </h3>
                                <div className="flex items-center gap-4 text-slate-300 text-sm">
                                    <span className="flex items-center gap-1"><Calendar size={14} /> {breaking.date}</span>
                                    <span className="font-bold text-blue-400">{breaking.source}</span>
                                </div>
                            </div>
                        </a>
                    </div>

                    {/* Side List */}
                    <div className="flex flex-col gap-4">
                        {others.map((item) => (
                            <a
                                key={item.id}
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex gap-4 p-4 bg-slate-50 hover:bg-white border boundary-slate-100 hover:shadow-md rounded-xl transition-all group"
                            >
                                <div className="w-24 h-24 flex-shrink-0 bg-slate-200 rounded-lg overflow-hidden">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                                                // Show fallback icon by appending it? React way is state, but simpler for this fix:
                                                // Just hide image, the background div will show.
                                                // But we want to show the fallback icon. 
                                                // Let's rely on CSS: if img is hidden, ensure parent has icon.
                                                // Actually, let's just create a reliable fallback URL or better yet, simply use the error event to clear the src and let the fallback render.
                                                // But since we have conditional rendering {item.image ? ... : ...}, changing src to null won't switch branches easily without state.
                                                // Simplest: Set src to a reliable placeholder or hide and rely on a background.
                                                e.currentTarget.src = "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80"; // Industrial fallback
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <Newspaper size={24} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col justify-between py-1">
                                    <h4 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {item.title}
                                    </h4>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">{item.source}</span>
                                        <span className="text-[10px] text-slate-400">{item.date}</span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
