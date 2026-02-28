'use client';

/**
 * 📖 Engineering Handbook Module
 * 
 * Interactive, searchable engineering reference with:
 * - Chapter/section tree navigation
 * - Formula display
 * - Data tables
 * - Fuzzy search across all entries
 * - Bento-Box Home Screen for Instant Shortcuts
 */

import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, ChevronDown, BookOpen, X, Sparkles, Database, Ruler, Wrench, Settings2, Sigma } from 'lucide-react';
import { HandbookChapter, HandbookSection, HandbookEntry } from '@/data/handbookData';
import { getLocalizedHandbookData } from '@/data/locales/handbookTranslations';
import { useI18nStore } from '@/store/i18nStore';

export function EngineeringHandbookModule() {
    const { t, language } = useI18nStore();

    // Dynamic Translation Data Provider
    const LOCALIZED_DATA = useMemo(() => getLocalizedHandbookData(language), [language]);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeChapterId, setActiveChapterId] = useState('');
    const [activeSectionId, setActiveSectionId] = useState('');
    const [activeEntryId, setActiveEntryId] = useState('');
    const [expandedChapters, setExpandedChapters] = useState<string[]>([]);

    // Search across all entries
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return null;
        const q = searchQuery.toLowerCase();
        const results: { chapter: HandbookChapter; section: HandbookSection; entry: HandbookEntry }[] = [];

        LOCALIZED_DATA.forEach(chapter => {
            chapter.sections.forEach(section => {
                section.entries.forEach(entry => {
                    const match =
                        entry.title.toLowerCase().includes(q) ||
                        entry.content.toLowerCase().includes(q) ||
                        entry.tags.some(t => t.toLowerCase().includes(q)) ||
                        (entry.formula && entry.formula.toLowerCase().includes(q));
                    if (match) results.push({ chapter, section, entry });
                });
            });
        });
        return results;
    }, [searchQuery, LOCALIZED_DATA]);

    const toggleChapter = (id: string) => {
        setExpandedChapters(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const selectEntry = (chapterId: string, sectionId: string, entryId: string) => {
        setActiveChapterId(chapterId);
        setActiveSectionId(sectionId);
        setActiveEntryId(entryId);
        setSearchQuery('');
        if (!expandedChapters.includes(chapterId)) {
            setExpandedChapters(prev => [...prev, chapterId]);
        }
    };

    const goHome = () => {
        setActiveChapterId('');
        setActiveSectionId('');
        setActiveEntryId('');
        setSearchQuery('');
    };

    // Get current display content
    const currentChapter = LOCALIZED_DATA.find(c => c.id === activeChapterId);
    const currentSection = currentChapter?.sections.find(s => s.id === activeSectionId);
    const currentEntry = currentSection?.entries.find(e => e.id === activeEntryId);

    // If no entry selected, show section overview or chapter overview
    const displayEntries = currentSection?.entries || currentChapter?.sections.flatMap(s => s.entries) || [];

    return (
        <div className="flex h-full bg-[#03070b] text-gray-300 font-sans overflow-hidden select-none">
            {/* ─── LEFT SIDEBAR: NAVIGATION ─── */}
            <div className="w-72 border-r border-[#1a1f26] bg-[#080d13] flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-10 relative">
                {/* Header */}
                <div className="px-5 py-5 border-b border-[#1a1f26] bg-gradient-to-b from-[#0e141a] to-[#080d13]">
                    <div
                        className="flex items-center gap-2 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={goHome}
                    >
                        <div className="p-1.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                            <BookOpen size={16} className="text-emerald-400" />
                        </div>
                        <span className="text-[13px] font-black tracking-widest text-white uppercase">{t.handbook.title}</span>
                    </div>

                    {/* Search */}
                    <div className="relative group">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={t.handbook.searchPlaceholder}
                            className="w-full pl-9 pr-8 py-2.5 bg-black/40 border border-[#1a1f26] rounded-lg text-xs text-white placeholder-gray-600 outline-none focus:border-emerald-500/50 focus:bg-[#0b1219] transition-all shadow-inner"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white bg-[#1a1f26] rounded-md p-0.5">
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Results or Chapter Tree */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {searchResults ? (
                        <div className="p-3">
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2 py-1 mb-2 flex items-center justify-between">
                                <span>{t.handbook.results}</span>
                                <span className="bg-[#1a1f26] px-1.5 py-0.5 rounded text-[9px]">{searchResults.length}</span>
                            </div>
                            {searchResults.map(r => (
                                <button
                                    key={r.entry.id}
                                    onClick={() => selectEntry(r.chapter.id, r.section.id, r.entry.id)}
                                    className="w-full text-left px-3 py-2.5 rounded-lg text-xs hover:bg-emerald-500/10 hover:border-emerald-500/20 border border-transparent transition-all mb-1 group"
                                >
                                    <div className="text-gray-200 font-medium group-hover:text-emerald-400 transition-colors">{r.entry.title}</div>
                                    <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                        <span className="truncate">{r.chapter.title}</span>
                                        <ChevronRight size={8} />
                                        <span className="truncate">{r.section.title}</span>
                                    </div>
                                </button>
                            ))}
                            {searchResults.length === 0 && (
                                <div className="text-xs text-gray-600 text-center py-10 flex flex-col items-center gap-2">
                                    <Search size={24} className="opacity-20" />
                                    <span>{t.handbook.noResults}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-2 px-2">
                            {LOCALIZED_DATA.map(chapter => (
                                <div key={chapter.id} className="mb-0.5">
                                    <button
                                        onClick={() => { toggleChapter(chapter.id); setActiveChapterId(chapter.id); setActiveSectionId(''); setActiveEntryId(''); }}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold transition-all rounded-lg ${activeChapterId === chapter.id && !activeEntryId ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-gray-400 border border-transparent hover:text-white hover:bg-[#121820]'}`}
                                    >
                                        <span className="text-[14px] flex-shrink-0 w-5 text-center">{chapter.icon}</span>
                                        <span className="truncate flex-1 text-left">{chapter.title}</span>
                                        <span className={`transition-transform duration-200 ${expandedChapters.includes(chapter.id) ? 'rotate-90 text-emerald-500' : 'text-gray-600'}`}>
                                            <ChevronRight size={14} />
                                        </span>
                                    </button>

                                    {expandedChapters.includes(chapter.id) && (
                                        <div className="ml-7 mt-1 pl-2 border-l-2 border-[#1a1f26] flex flex-col gap-0.5">
                                            {chapter.sections.map(section => (
                                                <button
                                                    key={section.id}
                                                    onClick={() => { setActiveChapterId(chapter.id); setActiveSectionId(section.id); setActiveEntryId(''); }}
                                                    className={`w-full text-left px-3 py-2 rounded-md text-[11px] font-medium transition-all relative ${activeSectionId === section.id && !activeEntryId ? 'text-emerald-400 bg-emerald-500/5' : 'text-gray-500 hover:text-gray-200 hover:bg-[#121820]'}`}
                                                >
                                                    {activeSectionId === section.id && !activeEntryId && (
                                                        <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    )}
                                                    <span className="mr-1.5 opacity-70">{section.icon}</span> {section.title}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── MAIN CONTENT ─── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-br from-[#060a0f] to-[#020406] relative">

                {/* Ambient Glow */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="p-8 max-w-6xl mx-auto relative z-10 min-h-full">

                    {/* HOME SCREEN (BENTO BOX) */}
                    {!activeChapterId && !searchQuery && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Hero Header */}
                            <div className="mb-10 flex flex-col items-center text-center">
                                <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                                    <BookOpen size={32} className="text-emerald-400" />
                                </div>
                                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight mb-2">
                                    {t.handbook.title}
                                </h1>
                                <p className="text-gray-500 text-sm max-w-md">
                                    {t.handbook.description}
                                </p>
                            </div>

                            {/* Quick Access Grid / Bento Box */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

                                {/* Featured Large Card */}
                                <div
                                    className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-[#0a0e14] rounded-2xl border border-[#1a1f26] p-6 cursor-pointer hover:border-emerald-500/40 hover:bg-[#0d121aa0] transition-all group relative overflow-hidden"
                                    onClick={() => selectEntry('machine-elements', 'bearings', 'skf-dgbb')}
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all" />
                                    <div className="flex flex-col h-full justify-between relative z-10">
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><Settings2 size={18} /></div>
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.handbook.featured}</span>
                                            </div>
                                            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">SKF Deep Groove Ball Bearings</h3>
                                            <p className="text-gray-400 text-sm">Instant access to the complete 6200/6300 series dimensions, capacities, and limits.</p>
                                        </div>
                                        <div className="mt-6 font-mono text-xs text-emerald-500/70 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 flex items-center gap-1">
                                            {t.handbook.openTable} <ChevronRight size={12} />
                                        </div>
                                    </div>
                                </div>

                                {/* Standard Shortcut Cards */}
                                <ShortcutCard
                                    title={t.handbook.shortcuts?.isoTolerances || "ISO Tolerances"}
                                    desc={t.handbook.shortcuts?.isoTolerancesDesc || "Linear dimensions and limits"}
                                    icon={<Ruler size={16} />}
                                    color="blue"
                                    onClick={() => selectEntry('tolerances', 'fit-tolerances', 'iso-fits')}
                                />
                                <ShortcutCard
                                    title={t.handbook.shortcuts?.fasteners || "Fasteners"}
                                    desc={t.handbook.shortcuts?.fastenersDesc || "M, UN, G Series"}
                                    icon={<Wrench size={16} />}
                                    color="orange"
                                    onClick={() => selectEntry('fasteners', 'bolts', 'bolt-stress')}
                                />
                                <ShortcutCard
                                    title={t.handbook.shortcuts?.materials || "Materials"}
                                    desc={t.handbook.shortcuts?.materialsDesc || "Density, Yield Strength"}
                                    icon={<Database size={16} />}
                                    color="purple"
                                    onClick={() => selectEntry('materials', 'steel-grades', 'st37')}
                                />
                                <ShortcutCard
                                    title={t.handbook.shortcuts?.mohr || "Mohr's Circle"}
                                    desc={t.handbook.shortcuts?.mohrDesc || "Principal Stresses"}
                                    icon={<Sigma size={16} />}
                                    color="pink"
                                    onClick={() => selectEntry('strength', 'mohr', 'mohr-circle')}
                                />
                                <ShortcutCard
                                    title={t.handbook.shortcuts?.beams || "Beam Deflection"}
                                    desc={t.handbook.shortcuts?.beamsDesc || "Beam Formulas"}
                                    icon={<Sparkles size={16} />}
                                    color="cyan"
                                    onClick={() => selectEntry('strength', 'beams', 'simple-beam')}
                                />
                                <ShortcutCard
                                    title={t.handbook.shortcuts?.roughness || "Roughness"}
                                    desc={t.handbook.shortcuts?.roughnessDesc || "Ra Values"}
                                    icon={<ChevronDown size={16} />}
                                    color="yellow"
                                    onClick={() => selectEntry('tolerances', 'surface-finish', 'ra-values')}
                                />

                            </div>

                            {/* Section breakdown */}
                            <div className="mt-12 border-t border-[#1a1f26] pt-8">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 text-center">{t.handbook.categories}</h4>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {LOCALIZED_DATA.map(chapter => (
                                        <button
                                            key={chapter.id}
                                            onClick={() => { toggleChapter(chapter.id); setActiveChapterId(chapter.id); }}
                                            className="px-4 py-2 bg-[#0a0e14] border border-[#1a1f26] rounded-full text-xs text-gray-400 hover:text-white hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all flex items-center gap-2"
                                        >
                                            <span>{chapter.icon}</span> {chapter.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CONTENT DISPLAY */}
                    {(activeChapterId || searchQuery) && (
                        <div className="animate-in fade-in duration-300">
                            {/* Breadcrumb */}
                            {!searchQuery && (
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-6 flex items-center gap-1.5 font-bold">
                                    <span className="text-gray-400">{currentChapter?.icon}</span>
                                    <span className="cursor-pointer hover:text-gray-300 transition-colors" onClick={() => { setActiveSectionId(''); setActiveEntryId(''); }}>{currentChapter?.title || 'Kitapçık'}</span>
                                    {currentSection && <><ChevronRight size={10} className="opacity-50" /><span className="cursor-pointer hover:text-gray-300 transition-colors" onClick={() => setActiveEntryId('')}>{currentSection.title}</span></>}
                                    {currentEntry && <><ChevronRight size={10} className="opacity-50" /><span className="text-emerald-400">{currentEntry.title}</span></>}
                                </div>
                            )}

                            {/* Title (Only if not showing single entry) */}
                            {!currentEntry && (
                                <h1 className="text-3xl font-black text-white mb-8 tracking-wide">
                                    {currentSection?.title || currentChapter?.title || (searchQuery ? `Search Results for "${searchQuery}"` : '')}
                                </h1>
                            )}

                            {/* If single entry selected */}
                            {currentEntry ? (
                                <EntryCard entry={currentEntry} />
                            ) : (
                                /* CHAPTER / SECTION OVERVIEW DASHBOARD */
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    {currentSection ? (
                                        /* Display Entries in the selected Section as a Grid */
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {currentSection.entries.map(entry => (
                                                <div
                                                    key={entry.id}
                                                    onClick={() => selectEntry(currentChapter!.id, currentSection.id, entry.id)}
                                                    className="bg-[#0a0e14] border border-[#1a1f26] hover:border-emerald-500/40 p-5 rounded-xl cursor-pointer hover:bg-[#0d121aa0] transition-all group"
                                                >
                                                    <h3 className="text-white font-bold text-lg mb-2 group-hover:text-emerald-400 transition-colors">{entry.title}</h3>
                                                    <p className="text-gray-500 text-sm line-clamp-2">{entry.content}</p>
                                                    <div className="mt-4 text-xs font-mono text-emerald-500/50 group-hover:text-emerald-500 flex items-center gap-1 transition-colors">
                                                        Read Entry <ChevronRight size={14} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : currentChapter ? (
                                        /* Display Sections in the selected Chapter */
                                        <div className="space-y-8">
                                            {currentChapter.sections.map(section => (
                                                <div key={section.id} className="bg-[#060a0f] border border-[#1a1f26] rounded-2xl p-6 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
                                                    <div className="relative z-10 flex items-center justify-between mb-6 cursor-pointer group" onClick={() => { setActiveSectionId(section.id); }}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-[#1a1f26] text-gray-400 rounded-lg group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
                                                                {section.icon}
                                                            </div>
                                                            <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{section.title}</h2>
                                                        </div>
                                                        <div className="text-xs text-emerald-500/50 group-hover:text-emerald-500 flex items-center gap-1">
                                                            {t.handbook.viewAll} <ChevronRight size={14} />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
                                                        {section.entries.map(entry => (
                                                            <button
                                                                key={entry.id}
                                                                onClick={() => selectEntry(currentChapter.id, section.id, entry.id)}
                                                                className="text-left bg-[#0a0e14] border border-[#1a1f26] p-3 rounded-lg hover:bg-[#121820] hover:border-emerald-500/30 transition-all flex flex-col justify-between h-20 group/btn"
                                                            >
                                                                <span className="text-gray-300 font-medium text-sm group-hover/btn:text-white truncate w-full">{entry.title}</span>
                                                                <span className="text-[10px] text-gray-500 uppercase tracking-widest">{entry.tags[0] || 'Reference'}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        /* For Search Results */
                                        <div className="space-y-4">
                                            {displayEntries.map(entry => (
                                                <div key={entry.id} onClick={() => {
                                                    const ch = LOCALIZED_DATA.find(c => c.sections.some(s => s.entries.some(e => e.id === entry.id)));
                                                    const sec = ch?.sections.find(s => s.entries.some(e => e.id === entry.id));
                                                    if (ch && sec) selectEntry(ch.id, sec.id, entry.id);
                                                }} className="cursor-pointer transform hover:-translate-y-0.5 transition-transform duration-200">
                                                    <EntryCard entry={entry} compact />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════

function ShortcutCard({ title, desc, icon, color, onClick }: { title: string, desc: string, icon: React.ReactNode, color: string, onClick: () => void }) {

    // Aesthetic color mapping for avant-garde styling
    const colors: Record<string, { bg: string, text: string, hover: string }> = {
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', hover: 'hover:border-blue-500/50' },
        orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', hover: 'hover:border-orange-500/50' },
        purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', hover: 'hover:border-purple-500/50' },
        pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', hover: 'hover:border-pink-500/50' },
        cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', hover: 'hover:border-cyan-500/50' },
        yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', hover: 'hover:border-yellow-500/50' },
    };

    const c = colors[color] || colors.blue;

    return (
        <div
            className={`bg-[#0a0e14] rounded-xl border border-[#1a1f26] p-5 cursor-pointer transition-all hover:bg-[#0d121a] hover:shadow-lg ${c.hover} group`}
            onClick={onClick}
        >
            <div className={`p-2.5 rounded-lg inline-flex mb-3 ${c.bg} ${c.text} transition-transform group-hover:scale-110 duration-300`}>
                {icon}
            </div>
            <h3 className="text-sm font-bold text-gray-200 mb-1 group-hover:text-white transition-colors">{title}</h3>
            <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
        </div>
    );
}


function EntryCard({ entry, compact = false }: { entry: HandbookEntry; compact?: boolean }) {
    const { t } = useI18nStore();
    return (
        <div className={`bg-[#0a0e14]/80 backdrop-blur-md border border-[#1a1f26] rounded-2xl ${compact ? 'p-5 hover:border-emerald-500/30 hover:bg-[#0c1118] transition-all' : 'p-8 shadow-2xl shadow-black/50'}`}>
            {/* Title */}
            <h3 className={`font-black tracking-tight text-white ${compact ? 'text-lg mb-2' : 'text-3xl mb-4'}`}>
                {entry.title}
            </h3>

            {/* Description */}
            <p className={`text-gray-400 leading-relaxed font-light ${compact ? 'text-sm mb-0' : 'text-base mb-6'}`}>
                {entry.content}
            </p>

            {/* Illustration */}
            {entry.image && !compact && (
                <div className="rounded-xl overflow-hidden border border-[#2a3038] bg-black/40 my-8 shadow-inner p-2 flex justify-center">
                    <img
                        src={entry.image}
                        alt={entry.title}
                        loading="lazy"
                        className="max-h-[400px] object-contain rounded-lg"
                    />
                </div>
            )}

            {/* Formula Area (Avant-Garde styling) */}
            {entry.formula && !compact && (
                <div className="bg-[#05080b] border border-[#1a1f26] rounded-xl p-5 my-6 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-cyan-500 group-hover:w-1.5 transition-all" />
                    <div className="text-[9px] text-gray-500 uppercase tracking-widest pl-2 mb-2 font-bold flex items-center gap-1.5">
                        <Sigma size={12} className="text-emerald-500" /> {t.handbook.mathFormula}
                    </div>
                    <pre className="text-emerald-300 font-mono text-sm whitespace-pre-wrap pl-2 leading-relaxed selection:bg-emerald-500/30">
                        {entry.formula}
                    </pre>
                </div>
            )}

            {/* Table Area */}
            {entry.table && !compact && (
                <div className="overflow-x-auto mt-8 rounded-xl border border-[#1a1f26] bg-[#05080b]">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-[#0b1016]">
                                {entry.table.headers.map((h, i) => (
                                    <th key={i} className={`text-left px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-[#1a1f26] ${i === 0 ? 'bg-[#080d13] sticky left-0 z-10 shadow-[1px_0_0_rgba(26,31,38,1)]' : ''}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {entry.table.rows.map((row, i) => (
                                <tr key={i} className="border-b border-[#1a1f26]/50 hover:bg-[#10161e] transition-colors">
                                    {row.map((cell, j) => (
                                        <td key={j} className={`px-5 py-3 whitespace-nowrap ${j === 0 ? 'text-emerald-400 font-medium bg-[#080d13] sticky left-0 z-10 shadow-[1px_0_0_rgba(26,31,38,1)]' : 'text-gray-300 font-mono text-xs'}`}>
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Tags */}
            {!compact && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-[#1a1f26]">
                    {Array.from(new Set(entry.tags)).map(tag => (
                        <span key={tag} className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest bg-[#1a1f26] text-gray-400 hover:text-white hover:bg-[#2a3038] rounded-full transition-colors cursor-default">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Click CTA for compact mode */}
            {compact && (
                <div className="mt-4 flex items-center gap-1.5 text-[10px] text-emerald-500 uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {t.handbook.viewDetails} <ChevronRight size={10} />
                </div>
            )}
        </div>
    );
}

export default EngineeringHandbookModule;

