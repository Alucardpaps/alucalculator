'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Star, History } from 'lucide-react';
import { MODULE_REGISTRY, ModuleType } from '@/config/modules';
import { SidebarAnimatedIcon } from '@/components/ui/SidebarAnimatedIcon';
import type { MobileStrings } from '@/locales/mobileTranslations';
import { SkeletonGrid } from '@/mobile/components/SkeletonLoader';
import { getAllCalcHistories, listenCalcHistoryUpdates } from '@/mobile/services/calcHistoryService';
import type { UnifiedCalcEntry } from '@/mobile/services/calcHistoryService';

const POPULAR: { slug: ModuleType; color: string }[] = [
  { slug: 'bolt-torque', color: 'border-amber-500/30 bg-amber-950/20 text-amber-300' },
  { slug: 'bearings', color: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300' },
  { slug: 'beam-deflection', color: 'border-indigo-500/30 bg-indigo-950/20 text-indigo-300' },
  { slug: 'profile-weight', color: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300' },
];

type Props = {
  m: MobileStrings;
  projectName: string;
  bomCount: number;
  totalWeight: number;
  totalCost: number;
  recentModules: ModuleType[];
  favoriteModules: ModuleType[];
  getModuleTitle: (type: ModuleType | string) => string;
  onLaunch: (type: ModuleType) => void;
  isLoading?: boolean;
};

export function DashboardScreen({
  m,
  projectName,
  bomCount,
  totalWeight,
  totalCost,
  recentModules,
  favoriteModules,
  getModuleTitle,
  onLaunch,
  isLoading,
}: Props) {
  const [calcHistories, setCalcHistories] = useState<UnifiedCalcEntry[]>([]);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setCalcHistories(getAllCalcHistories().slice(0, 5));
    refresh();
    return listenCalcHistoryUpdates(refresh);
  }, []);

  if (isLoading) {
    return (
      <div className="p-4">
        <SkeletonGrid count={4} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-6"
    >
      <div className="relative p-5 rounded-2xl border border-cyan-950/40 bg-slate-950/30 backdrop-blur-xl overflow-hidden shadow-xl">
        <h3 className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest mb-1">{m.activeProject}</h3>
        <h2 className="text-xl font-bold text-white truncate">{projectName}</h2>
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5">
          <div>
            <span className="block text-[8px] font-mono text-slate-500 uppercase">{m.bomCount}</span>
            <span className="text-md font-mono font-bold text-cyan-300">{bomCount}</span>
          </div>
          <div>
            <span className="block text-[8px] font-mono text-slate-500 uppercase">{m.totalWeight}</span>
            <span className="text-md font-mono font-bold text-purple-300">{totalWeight.toFixed(1)} kg</span>
          </div>
          <div>
            <span className="block text-[8px] font-mono text-slate-500 uppercase">{m.totalCost}</span>
            <span className="text-md font-mono font-bold text-emerald-300">${totalCost.toFixed(0)}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3">{m.quickActions || 'QUICK ACTIONS'}</h3>
        <div className="grid grid-cols-2 gap-3">
          {POPULAR.map((pop) => {
            const isHovered = hoveredSlug === pop.slug;
            return (
              <button
                key={pop.slug}
                onClick={() => onLaunch(pop.slug)}
                onMouseEnter={() => setHoveredSlug(pop.slug)}
                onMouseLeave={() => setHoveredSlug(null)}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all active:scale-95 ${pop.color}`}
              >
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <SidebarAnimatedIcon
                    id={pop.slug}
                    size={22}
                    isHovered={isHovered}
                  />
                </div>
                <span className="font-bold text-xs leading-snug">{getModuleTitle(pop.slug)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {favoriteModules.length > 0 && (
        <div>
          <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
            <Star size={12} className="text-amber-400" /> {m.favorites || 'FAVORITES'}
          </h3>
          <div className="space-y-2">
            {favoriteModules.slice(0, 6).map((slug) => {
              const mod = MODULE_REGISTRY[slug];
              if (!mod) return null;
              const isHovered = hoveredSlug === slug;
              return (
                <button
                  key={slug}
                  onClick={() => onLaunch(slug)}
                  onMouseEnter={() => setHoveredSlug(slug)}
                  onMouseLeave={() => setHoveredSlug(null)}
                  className="w-full flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl active:scale-98 transition-transform"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 flex items-center justify-center shrink-0">
                      <SidebarAnimatedIcon
                        id={slug}
                        size={20}
                        isHovered={isHovered}
                      />
                    </div>
                    <span className="font-bold text-xs text-slate-200 truncate">{getModuleTitle(slug)}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-600" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3">{m.recentSolvers}</h3>
        <div className="space-y-2">
          {recentModules.length === 0 ? (
            <p className="text-xs text-slate-600 italic py-4">{m.noRecentCalculations}</p>
          ) : (
            recentModules.map((slug) => {
              const mod = MODULE_REGISTRY[slug];
              if (!mod) return null;
              const isHovered = hoveredSlug === slug;
              return (
                <button
                  key={slug}
                  onClick={() => onLaunch(slug)}
                  onMouseEnter={() => setHoveredSlug(slug)}
                  onMouseLeave={() => setHoveredSlug(null)}
                  className="w-full flex items-center justify-between p-3 bg-slate-950/30 border border-white/5 rounded-xl hover:border-cyan-500/30 active:scale-98 transition-transform"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 flex items-center justify-center shrink-0">
                      <SidebarAnimatedIcon
                        id={slug}
                        size={20}
                        isHovered={isHovered}
                      />
                    </div>
                    <span className="font-bold text-xs text-slate-200 truncate">{getModuleTitle(slug)}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-600" />
                </button>
              );
            })
          )}
        </div>
      </div>

      {calcHistories.length > 0 && (
        <div>
          <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
            <History size={12} className="text-cyan-400" /> {m.recentSolvers}
          </h3>
          <div className="space-y-2">
            {calcHistories.map((entry, idx) => (
              <div
                key={`${entry.calcId}-${entry.timestamp}-${idx}`}
                className="p-3 bg-slate-950/20 border border-white/5 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="min-w-0">
                  <span className="font-bold text-white block truncate">{getModuleTitle(entry.calcId)}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
                {Boolean(entry.result && typeof entry.result === 'object' && 'status' in (entry.result as Record<string, unknown>)) && (
                  <span className="font-mono text-cyan-300 font-bold ml-2 shrink-0">
                    {String((entry.result as Record<string, unknown>).status)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default DashboardScreen;
