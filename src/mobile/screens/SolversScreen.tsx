'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { MODULE_REGISTRY, ModuleType, getModuleIcon } from '@/config/modules';
import type { MobileStrings } from '@/locales/mobileTranslations';
import { getLitePage, type LiteCategoryKey } from '@/locales/liteTranslations';
import type { Language } from '@/store/i18nStore';
import { SkeletonGrid } from '@/mobile/components/SkeletonLoader';

const CATEGORIES: LiteCategoryKey[] = [
  'mechanical', 'manufacturing', 'civil', 'electrical', 'finance', 'science', 'software', 'other',
];

const EXCLUDED = new Set([
  'settings', 'terminal', 'browser', 'media-player', 'image-viewer', 'pdf-viewer',
  'spreadsheet-viewer', 'file-explorer', 'project-vault', 'project-variables', 'ai-copilot',
]);

type Props = {
  m: MobileStrings;
  language: Language;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: LiteCategoryKey | 'all';
  onCategoryChange: (c: LiteCategoryKey | 'all') => void;
  getModuleTitle: (type: ModuleType | string) => string;
  onLaunch: (type: ModuleType) => void;
  isLoading?: boolean;
};

export function SolversScreen({
  m,
  language,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  getModuleTitle,
  onLaunch,
  isLoading,
}: Props) {
  const tLite = getLitePage(language);

  const filteredModules = useMemo(() => {
    const list = Object.values(MODULE_REGISTRY).filter((mod) => !EXCLUDED.has(mod.type));
    return list.filter((mod) => {
      const title = getModuleTitle(mod.type);
      const matchesSearch =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'all' || mod.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory, getModuleTitle]);

  if (isLoading) {
    return (
      <div className="p-4">
        <SkeletonGrid count={6} />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-900/60" />
          <input
            type="text"
            placeholder={m.searchSolvers}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-950/40 border border-cyan-900/30 rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:border-cyan-500/70 text-white placeholder:text-cyan-900/50"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => onCategoryChange('all')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase border shrink-0 ${selectedCategory === 'all' ? 'bg-cyan-50 border-cyan-500 text-black' : 'bg-slate-950/40 border-cyan-950/30 text-cyan-50/50'}`}
          >
            {m.allCategories}
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase border shrink-0 ${selectedCategory === cat ? 'bg-cyan-50 border-cyan-500 text-black' : 'bg-slate-950/40 border-cyan-950/30 text-cyan-50/50'}`}
            >
              {tLite.categories[cat] || cat}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 pb-8">
        {filteredModules.length === 0 ? (
          <div className="col-span-2 text-center py-20 text-slate-500 text-xs">{tLite.emptyState}</div>
        ) : (
          filteredModules.map((mod) => {
            const IconNode = getModuleIcon(mod.iconName);
            return (
              <button
                key={mod.type}
                onClick={() => onLaunch(mod.type)}
                className="flex flex-col items-start p-4 bg-slate-950/30 border border-white/5 rounded-2xl hover:border-cyan-500/30 text-left active:bg-slate-900/40"
              >
                <div className="w-9 h-9 rounded-xl bg-cyan-500/5 text-cyan-400 flex items-center justify-center border border-cyan-500/10 mb-3">
                  <IconNode size={16} />
                </div>
                <span className="font-bold text-xs text-white line-clamp-2 leading-tight">
                  {getModuleTitle(mod.type)}
                </span>
              </button>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
