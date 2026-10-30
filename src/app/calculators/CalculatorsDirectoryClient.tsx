'use client';

/**
 * Solvers directory — every solver gets a technical glyph of what it computes, the six
 * pillars are shown as visual overview tiles, and the "All" view is grouped by pillar so
 * the page can be scanned instead of read. Counts come from CANONICAL_TOOLS (never typed).
 */
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ArrowRight,
  Star,
  LayoutGrid,
  Table2,
  Headphones,
  Compass,
  ShieldCheck,
  X,
} from 'lucide-react';
import { CANONICAL_TOOLS, CANONICAL_PILLARS, type PillarKey, type CanonicalToolEntry } from '@/data/canonicalInventory';
import { solverCount } from '@/lib/registry/calculatorRegistry';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { openNotebookLMStudio } from '@/components/notebooklm/NotebookLMStudioModal';
import { SolverGlyph } from '@/components/directory/SolverGlyph';

const PINNED_FAVORITES_STORAGE_KEY = 'alucalc:pinned_solvers_v1';
const VIEW_STORAGE_KEY = 'alucalc:solver_directory_view_v1';
type Selection = PillarKey | 'all' | 'favorites';

/** one representative glyph per pillar for the overview tiles */
const PILLAR_GLYPH: Record<PillarKey, string> = {
  cad_design: 'design-studio',
  mechanical: 'gears',
  materials_mfg: 'beam-deflection',
  fluids_thermal_power: 'pumps',
  science_theory: 'physics-kinematics',
  platform_academy: 'academy',
};

const ENGINE_LABEL: Record<CanonicalToolEntry['engineType'], { en: string; tr: string }> = {
  cad_3d: { en: '3D CAD', tr: '3D CAD' },
  cad_2d: { en: '2D CAD', tr: '2D CAD' },
  fea_sim: { en: 'FEA', tr: 'FEA' },
  flow_graph: { en: 'Node graph', tr: 'Düğüm grafiği' },
  optimizer_engine: { en: 'Optimizer', tr: 'Optimizasyon' },
  deterministic_solver: { en: 'Solver', tr: 'Çözücü' },
  sensor_suite_34: { en: 'Sensors', tr: 'Sensörler' },
  academy_curriculum: { en: 'Course', tr: 'Eğitim' },
  pwa_workstation: { en: 'App', tr: 'Uygulama' },
};

const POPULAR_STANDARDS = ['ISO', 'DIN', 'VDI', 'ASME', 'IEC', 'AISC', 'IEEE'];

const chip =
  'inline-flex items-center rounded-[var(--radius-s)] border px-2 py-1 font-mono text-[11px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]';
const chipOn = 'border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--cyan)] font-semibold';
const chipOff = 'border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-[var(--ink)] hover:border-[var(--line-strong)]';

export function CalculatorsDirectoryClient() {
  const { language } = useI18nStore();
  const isTr = language === 'tr';
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<Selection>('all');
  const [standardFilter, setStandardFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [pinnedIds, setPinnedIds] = useState<string[]>(['bolt-torque', 'gears', 'bearings', 'shafts', 'beam-deflection', 'fits']);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PINNED_FAVORITES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setPinnedIds(parsed.filter((x) => typeof x === 'string'));
      }
      const v = localStorage.getItem(VIEW_STORAGE_KEY);
      if (v === 'grid' || v === 'table') setViewMode(v);
    } catch {}
  }, []);

  const setView = (v: 'grid' | 'table') => {
    setViewMode(v);
    try { localStorage.setItem(VIEW_STORAGE_KEY, v); } catch {}
  };

  const togglePin = (id: string) => {
    setPinnedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem(PINNED_FAVORITES_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const title = (t: CanonicalToolEntry) => (isTr ? t.titleTr : t.titleEn);

  const filteredTools = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return CANONICAL_TOOLS.filter((tool) => {
      if (selected === 'favorites') {
        if (!pinnedIds.includes(tool.id)) return false;
      } else if (selected !== 'all' && tool.pillar !== selected) return false;
      if (standardFilter !== 'all' && !tool.standards?.some((s) => s.toLowerCase().includes(standardFilter.toLowerCase()))) return false;
      if (!q) return true;
      const hay = [tool.titleEn, tool.titleTr, tool.route, tool.id, ...(tool.keywords ?? []), ...(tool.standards ?? [])].join(' ').toLowerCase();
      return q.split(/\s+/).every((w) => hay.includes(w));
    });
  }, [searchQuery, selected, standardFilter, pinnedIds]);

  const pillarCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tool of CANONICAL_TOOLS) counts[tool.pillar] = (counts[tool.pillar] || 0) + 1;
    return counts;
  }, []);

  const pillarKeys = useMemo(
    () => (Object.keys(CANONICAL_PILLARS) as PillarKey[]).sort((a, b) => CANONICAL_PILLARS[a].order - CANONICAL_PILLARS[b].order),
    [],
  );

  // grouped view only when browsing everything without a search
  const grouped = selected === 'all' && !searchQuery.trim() && standardFilter === 'all';
  const sections = useMemo(() => {
    if (!grouped) return [{ key: 'flat', tools: filteredTools }];
    return pillarKeys
      .map((k) => ({ key: k, tools: filteredTools.filter((t) => t.pillar === k) }))
      .filter((s) => s.tools.length > 0);
  }, [grouped, filteredTools, pillarKeys]);

  const favorites = useMemo(() => CANONICAL_TOOLS.filter((t) => pinnedIds.includes(t.id)), [pinnedIds]);
  const clearAll = () => { setSearchQuery(''); setStandardFilter('all'); setSelected('all'); };

  return (
    <div className="w-full min-h-screen bg-[var(--bg-0)] text-[var(--ink)] font-sans">
      {/* ═══ HEADER ═══ */}
      <header className="border-b border-[var(--line)] bg-[var(--bg-1)]">
        <div className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4 flex flex-wrap items-center gap-3 font-mono text-xs">
            <Link href="/" className="text-[var(--alu-dim)] hover:text-[var(--cyan)]">AluCAD OS</Link>
            <span className="text-[var(--muted)]">/</span>
            <span className="font-semibold uppercase tracking-wider text-[var(--ink)]">{t12(language, 'Solvers Directory', 'Çözücüler Dizini')}</span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('alucalc:open-navigator'))} className={`${chip} ${chipOff} gap-1.5`} title={t12(language, 'Decision tree & navigator (Alt+M)', 'Karar ağacı & modül rehberi (Alt+M)')}>
                <Compass size={13} /> {t12(language, 'Which solver do I need?', 'Hangi çözücü lazım?')}
              </button>
              <button type="button" onClick={() => openNotebookLMStudio()} className={`${chip} ${chipOff} gap-1.5`}>
                <Headphones size={13} /> {t12(language, 'Audio briefings', 'Sesli brifingler')}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="font-tech text-2xl font-bold tracking-tight sm:text-3xl">
                {t12(language, 'Engineering solvers', 'Mühendislik çözücüleri')}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[var(--alu)]">
                {t12(
                  language,
                  `${solverCount} deterministic tools built on ISO, DIN, VDI, ASME and IEC — every result traceable to its formula and standard. Pick a field below or search by name, standard or symbol.`,
                  `ISO, DIN, VDI, ASME ve IEC tabanlı ${solverCount} deterministik araç — her sonuç formülüne ve standardına izlenebilir. Aşağıdan bir alan seçin ya da ad, standart veya sembolle arayın.`,
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs text-[var(--alu-dim)]">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-[var(--ok)]" />{solverCount} {t12(language, 'standard-referenced', 'standart referanslı')}</span>
              <div className="flex items-center gap-1 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] p-1" role="tablist" aria-label={t12(language, 'View', 'Görünüm')}>
                {(['grid', 'table'] as const).map((v) => (
                  <button key={v} type="button" role="tab" aria-selected={viewMode === v} onClick={() => setView(v)}
                    className={`inline-flex items-center gap-1.5 rounded-[var(--radius-s)] px-2.5 py-1.5 text-[11px] font-semibold cursor-pointer ${viewMode === v ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'}`}>
                    {v === 'grid' ? <LayoutGrid size={13} /> : <Table2 size={13} />}
                    {v === 'grid' ? t12(language, 'Cards', 'Kartlar') : t12(language, 'Table', 'Tablo')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* search + standard filter */}
          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="group relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--alu-dim)] group-focus-within:text-[var(--cyan)]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setSearchQuery(''); }}
                placeholder={t12(language, "Search: 'bolt', 'VDI 2230', 'ISO 281', 'buckling'…", "Ara: 'cıvata', 'VDI 2230', 'ISO 281', 'burkulma'…")}
                aria-label={t12(language, 'Search solvers', 'Çözücü ara')}
                className="h-11 w-full rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-0)] pl-10 pr-10 font-mono text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--cyan)] focus:outline-none"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} aria-label={t12(language, 'Clear search', 'Aramayı temizle')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--alu-dim)] hover:text-[var(--ink)]">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <span className="mr-1 shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{t12(language, 'Standard', 'Norm')}</span>
              <button type="button" onClick={() => setStandardFilter('all')} className={`${chip} ${standardFilter === 'all' ? chipOn : chipOff}`}>{t12(language, 'All', 'Tümü')}</button>
              {POPULAR_STANDARDS.map((std) => (
                <button key={std} type="button" onClick={() => setStandardFilter(std === standardFilter ? 'all' : std)} className={`${chip} ${standardFilter === std ? chipOn : chipOff}`}>{std}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1720px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {/* ═══ PILLAR OVERVIEW TILES (also the category filter) ═══ */}
        <nav aria-label={t12(language, 'Fields', 'Alanlar')} className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8">
          <PillarTile
            active={selected === 'all'}
            onClick={() => setSelected('all')}
            glyphId="calculator"
            label={t12(language, 'All tools', 'Tüm araçlar')}
            count={CANONICAL_TOOLS.length}
          />
          <PillarTile
            active={selected === 'favorites'}
            onClick={() => setSelected('favorites')}
            icon={<Star size={30} className={selected === 'favorites' ? 'fill-[var(--warn)] text-[var(--warn)]' : 'text-[var(--warn)]'} />}
            label={t12(language, 'Favourites', 'Favorilerim')}
            count={pinnedIds.length}
            tone="warn"
          />
          {pillarKeys.map((k) => (
            <PillarTile
              key={k}
              active={selected === k}
              onClick={() => setSelected(selected === k ? 'all' : k)}
              glyphId={PILLAR_GLYPH[k]}
              pillar={k}
              label={isTr ? CANONICAL_PILLARS[k].titleTr : CANONICAL_PILLARS[k].titleEn}
              count={pillarCounts[k] || 0}
            />
          ))}
        </nav>

        {/* quick favourites row */}
        {grouped && favorites.length > 0 && (
          <section className="mt-6" aria-label={t12(language, 'Favourites', 'Favoriler')}>
            <h2 className="mb-2 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--alu-dim)]">
              <Star size={12} className="fill-[var(--warn)] text-[var(--warn)]" /> {t12(language, 'Your pinned solvers', 'Sabitlediğiniz çözücüler')}
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {favorites.map((t) => (
                <Link key={t.id} href={t.route} className="group flex shrink-0 items-center gap-2.5 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] py-1.5 pl-1.5 pr-3 hover:border-[var(--cyan)]">
                  <span className="rounded-[var(--radius-s)] bg-[var(--bg-2)] p-0.5"><SolverGlyph id={t.id} pillar={t.pillar} className="h-8 w-[54px]" /></span>
                  <span className="max-w-[200px] truncate text-[13px] font-semibold group-hover:text-[var(--cyan)]">{title(t)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* result line */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2 font-mono text-xs text-[var(--alu-dim)]">
          <span>
            {filteredTools.length} / {CANONICAL_TOOLS.length} {t12(language, 'tools', 'araç')}
            {searchQuery && <> · “{searchQuery}”</>}
            {standardFilter !== 'all' && <> · {standardFilter}</>}
          </span>
          {(searchQuery || standardFilter !== 'all' || selected !== 'all') && (
            <button type="button" onClick={clearAll} className="text-[var(--cyan)] hover:underline cursor-pointer">{t12(language, 'Clear filters', 'Filtreleri temizle')}</button>
          )}
        </div>

        {filteredTools.length === 0 ? (
          <div className="mt-6 rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--bg-1)] p-12 text-center">
            <Search size={22} className="mx-auto text-[var(--muted)]" />
            <h3 className="mt-3 font-tech text-base font-bold">{t12(language, 'No solver matches', 'Eşleşen çözücü yok')}</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--alu-dim)]">{t12(language, 'Try a shorter term, a standard number, or clear the filters.', 'Daha kısa bir terim, bir standart numarası deneyin veya filtreleri temizleyin.')}</p>
            <button type="button" onClick={clearAll} className={`${chip} ${chipOn} mt-4`}>{t12(language, 'Clear filters', 'Filtreleri temizle')}</button>
          </div>
        ) : viewMode === 'grid' ? (
          sections.map((sec) => (
            <section key={sec.key} className="mt-7" aria-labelledby={`sec-${sec.key}`}>
              {sec.key !== 'flat' && (
                <div className="mb-3 flex items-baseline gap-3">
                  <h2 id={`sec-${sec.key}`} className="font-tech text-lg font-bold tracking-tight">
                    {isTr ? CANONICAL_PILLARS[sec.key as PillarKey].titleTr : CANONICAL_PILLARS[sec.key as PillarKey].titleEn}
                  </h2>
                  <span className="font-mono text-xs text-[var(--muted)]">{sec.tools.length}</span>
                  <span className="h-px flex-1 bg-[var(--line)]" />
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[1800px]:grid-cols-5">
                {sec.tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} lang={language} isTr={isTr} pinned={pinnedIds.includes(tool.id)} onPin={() => togglePin(tool.id)} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="mt-6 overflow-hidden rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--bg-1)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--bg-2)] font-mono text-[10px] uppercase tracking-wider text-[var(--alu-dim)]">
                    <th className="w-10 px-3 py-2.5"><span className="sr-only">{t12(language, 'Pinned', 'Sabit')}</span>★</th>
                    <th className="px-3 py-2.5">{t12(language, 'Solver', 'Çözücü')}</th>
                    <th className="px-3 py-2.5">{t12(language, 'Field', 'Alan')}</th>
                    <th className="px-3 py-2.5">{t12(language, 'Standards', 'Standartlar')}</th>
                    <th className="px-3 py-2.5">{t12(language, 'Type', 'Tür')}</th>
                    <th className="px-3 py-2.5 text-right"><span className="sr-only">{t12(language, 'Open', 'Aç')}</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {filteredTools.map((tool) => {
                    const pinned = pinnedIds.includes(tool.id);
                    return (
                      <tr key={tool.id} className="hover:bg-[var(--hover)]">
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => togglePin(tool.id)} aria-pressed={pinned} aria-label={pinned ? t12(language, 'Unpin', 'Sabitlemeyi kaldır') : t12(language, 'Pin', 'Sabitle')} className={`cursor-pointer ${pinned ? 'text-[var(--warn)]' : 'text-[var(--muted)] hover:text-[var(--ink)]'}`}>
                            <Star size={14} className={pinned ? 'fill-[var(--warn)]' : ''} />
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <Link href={tool.route} className="flex items-center gap-3 font-semibold hover:text-[var(--cyan)]">
                            <span className="shrink-0 rounded-[var(--radius-s)] bg-[var(--bg-2)] p-0.5"><SolverGlyph id={tool.id} pillar={tool.pillar} className="h-7 w-12" /></span>
                            {title(tool)}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-[12px] text-[var(--alu)]">{isTr ? CANONICAL_PILLARS[tool.pillar].titleTr : CANONICAL_PILLARS[tool.pillar].titleEn}</td>
                        <td className="px-3 py-2 font-mono text-[11px] text-[var(--std)]">{(tool.standards ?? []).slice(0, 2).join(' · ') || '—'}</td>
                        <td className="px-3 py-2 font-mono text-[11px] text-[var(--alu-dim)]">{isTr ? ENGINE_LABEL[tool.engineType].tr : ENGINE_LABEL[tool.engineType].en}</td>
                        <td className="px-3 py-2 text-right">
                          <Link href={tool.route} className="inline-flex items-center gap-1 rounded-[var(--radius-s)] bg-[var(--cyan)] px-2.5 py-1 font-mono text-[11px] font-bold text-[var(--accent-ink)] hover:opacity-90">
                            {t12(language, 'Open', 'Aç')} <ArrowRight size={11} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function PillarTile({
  active, onClick, glyphId, pillar, icon, label, count, tone,
}: {
  active: boolean; onClick: () => void; glyphId?: string; pillar?: string; icon?: React.ReactNode; label: string; count: number; tone?: 'warn';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group flex flex-col items-start gap-1 rounded-[var(--radius-l)] border p-2.5 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)] ${
        active
          ? tone === 'warn' ? 'border-[var(--warn)] bg-[var(--warn-soft)]' : 'border-[var(--accent-line)] bg-[var(--accent-soft)]'
          : 'border-[var(--line)] bg-[var(--bg-1)] hover:border-[var(--line-strong)]'
      }`}
    >
      <span className="flex h-11 w-full items-center justify-center rounded-[var(--radius-s)] bg-[var(--bg-2)]">
        {icon ?? <SolverGlyph id={glyphId!} pillar={pillar} className="h-10 w-[66px]" />}
      </span>
      <span className="flex w-full items-baseline justify-between gap-2">
        <span className={`text-[12px] font-semibold leading-tight ${active ? (tone === 'warn' ? 'text-[var(--warn)]' : 'text-[var(--cyan)]') : 'text-[var(--ink)]'}`}>{label}</span>
        <span className="font-mono text-[11px] tabular-nums text-[var(--muted)]">{count}</span>
      </span>
    </button>
  );
}

function ToolCard({ tool, lang, isTr, pinned, onPin }: { tool: CanonicalToolEntry; lang: string; isTr: boolean; pinned: boolean; onPin: () => void }) {
  const name = isTr ? tool.titleTr : tool.titleEn;
  const std = tool.standards ?? [];
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--bg-1)] transition-colors hover:border-[var(--cyan)] focus-within:border-[var(--cyan)]">
      {/* visual */}
      <div
        className="relative flex h-[104px] items-center justify-center border-b border-[var(--line)] bg-[var(--bg-2)]"
        style={{
          backgroundImage:
            'linear-gradient(var(--line-faint, rgba(127,127,127,.12)) 1px, transparent 1px), linear-gradient(90deg, var(--line-faint, rgba(127,127,127,.12)) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      >
        <SolverGlyph id={tool.id} pillar={tool.pillar} className="h-[84px] w-[140px]" title={name} />
        <span className="absolute left-2 top-2 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--alu-dim)]">
          {isTr ? ENGINE_LABEL[tool.engineType].tr : ENGINE_LABEL[tool.engineType].en}
          {tool.badge && <span className="ml-1 text-[var(--ok)]">· {tool.badge}</span>}
        </span>
        <button
          type="button"
          onClick={onPin}
          aria-pressed={pinned}
          aria-label={pinned ? t12(lang, 'Unpin', 'Sabitlemeyi kaldır') : t12(lang, 'Pin to favourites', 'Favorilere sabitle')}
          className={`absolute right-1.5 top-1.5 z-10 rounded p-1.5 cursor-pointer ${pinned ? 'text-[var(--warn)]' : 'text-[var(--muted)] opacity-70 hover:text-[var(--ink)] hover:opacity-100'}`}
        >
          <Star size={15} className={pinned ? 'fill-[var(--warn)]' : ''} />
        </button>
      </div>
      {/* text */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="font-tech text-[15px] font-semibold leading-snug">
          <Link href={tool.route} className="after:absolute after:inset-0 group-hover:text-[var(--cyan)] focus-visible:outline-none">
            {name}
          </Link>
        </h3>
        {std.length > 0 && (
          <div className="flex flex-wrap gap-1 font-mono">
            {std.slice(0, 3).map((s) => (
              <span key={s} className="rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] px-1.5 py-0.5 text-[10.5px] text-[var(--std)]">{s}</span>
            ))}
            {std.length > 3 && <span className="px-1 py-0.5 text-[10.5px] text-[var(--muted)]">+{std.length - 3}</span>}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-1 font-mono text-[11px]">
          <span className="inline-flex items-center gap-1 text-[var(--cyan)]">
            {t12(lang, 'Open', 'Aç')} <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
          </span>
          <button
            type="button"
            onClick={() => openNotebookLMStudio(tool.id)}
            className="relative z-10 inline-flex items-center gap-1 rounded px-1.5 py-1 text-[var(--muted)] hover:text-[var(--ok)] cursor-pointer"
            title={t12(lang, 'Audio briefing', 'Sesli brifing')}
            aria-label={t12(lang, 'Audio briefing', 'Sesli brifing')}
          >
            <Headphones size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}
