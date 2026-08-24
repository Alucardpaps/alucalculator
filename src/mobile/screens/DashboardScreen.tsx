'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Star, History, Zap, CircleDot, Layers, Ruler } from 'lucide-react';
import { MODULE_REGISTRY, ModuleType, getModuleIcon } from '@/config/modules';
import type { MobileStrings } from '@/locales/mobileTranslations';
import { SkeletonGrid } from '@/mobile/components/SkeletonLoader';
import { getAllCalcHistories, listenCalcHistoryUpdates } from '@/mobile/services/calcHistoryService';
import type { UnifiedCalcEntry } from '@/mobile/services/calcHistoryService';

const POPULAR = [
  { slug: 'bolt-torque' as ModuleType, icon: Zap, color: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
  { slug: 'bearings' as ModuleType, icon: CircleDot, color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' },
  { slug: 'beam-deflection' as ModuleType, icon: Layers, color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' },
  { slug: 'profile-weight' as ModuleType, icon: Ruler, color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
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
        <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3">{m.quickActions}</h3>
        <div className="grid grid-cols-2 gap-3">
          {POPULAR.map((pop) => {
            const DynamicIcon = pop.icon;
            return (
              <button
                key={pop.slug}
                onClick={() => onLaunch(pop.slug)}
                className={`flex items-center gap-3 p-4 rounded-xl border bg-slate-900/30 text-left transition-all active:scale-95 ${pop.color}`}
              >
                <div className="p-2 rounded-lg bg-black/40">
                  <DynamicIcon size={18} />
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
            <Star size={12} className="text-amber-400" /> {m.favorites}
          </h3>
          <div className="space-y-2">
            {favoriteModules.slice(0, 6).map((slug) => {
              const mod = MODULE_REGISTRY[slug];
              if (!mod) return null;
              const IconNode = getModuleIcon(mod.iconName);
              return (
                <button
                  key={slug}
                  onClick={() => onLaunch(slug)}
                  className="w-full flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                      <IconNode size={16} />
                    </div>
                    <span className="font-bold text-xs text-slate-200">{getModuleTitle(slug)}</span>
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
              const IconNode = getModuleIcon(mod.iconName);
              return (
                <button
                  key={slug}
                  onClick={() => onLaunch(slug)}
                  className="w-full flex items-center justify-between p-3 bg-slate-950/20 border border-white/5 rounded-xl hover:border-cyan-500/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                      <IconNode size={16} />
                    </div>
                    <span className="font-bold text-xs text-slate-200">{getModuleTitle(slug)}</span>
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
            <History size={12} /> {m.calcHistory}
          </h3>
          <div className="space-y-2">
            {calcHistories.map((entry, i) => (
              <button
                key={`${entry.calcId}-${entry.timestamp}-${i}`}
                onClick={() => {
                  const mod = Object.values(MODULE_REGISTRY).find(
                    (m) => m.type === entry.calcId || m.type.includes(entry.calcId),
                  );
                  if (mod) onLaunch(mod.type);
                }}
                className="w-full p-3 bg-slate-950/20 border border-white/5 rounded-xl text-left"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-200">{entry.calcId}</span>
                  <span className="text-[9px] font-mono text-slate-600">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
                {entry.result != null && (
                  <span className="text-[10px] text-cyan-400 font-mono mt-1 block truncate">
                    {m.reopenCalc}: {String(entry.result)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
