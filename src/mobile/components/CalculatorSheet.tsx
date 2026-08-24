'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Share2, FileText, Star, Download } from 'lucide-react';
import { WindowContent } from '@/components/os/WindowContent';
import type { ModuleType } from '@/config/modules';
import type { MobileStrings } from '@/locales/mobileTranslations';
import type { LiteCategoryKey } from '@/locales/liteTranslations';
import { hapticLight } from '@/mobile/services/haptics';

type Props = {
  activeModule: ModuleType;
  moduleTitle: string;
  categoryLabel: string;
  m: MobileStrings;
  isFavorite: boolean;
  onClose: () => void;
  onShare: () => void;
  onExportJson: () => void;
  onToggleFavorite: () => void;
  onPdf: () => void;
};

export function CalculatorSheet({
  activeModule,
  moduleTitle,
  categoryLabel,
  m,
  isFavorite,
  onClose,
  onShare,
  onExportJson,
  onToggleFavorite,
  onPdf,
}: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="fixed inset-0 z-50 bg-[#020408] flex flex-col"
      >
        <header className="flex-none h-14 border-b border-cyan-950/30 flex items-center justify-between px-4 bg-slate-950/80 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                hapticLight();
                onClose();
              }}
              className="w-8 h-8 shrink-0 flex items-center justify-center rounded-xl bg-slate-900 border border-white/5 active:bg-slate-800 text-slate-400"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] font-mono font-bold text-cyan-400 uppercase tracking-widest truncate">
                {categoryLabel}
              </span>
              <span className="font-bold text-xs text-white truncate leading-none mt-0.5">{moduleTitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onToggleFavorite}
              className={`w-8 h-8 flex items-center justify-center rounded-xl border border-white/5 transition-all ${isFavorite ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-900 text-slate-400'}`}
              title={isFavorite ? m.unfavorite : m.favorite}
            >
              <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button onClick={onExportJson} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 border border-white/5 text-slate-400 active:text-cyan-400" title={m.exportJson}>
              <Download size={14} />
            </button>
            <button onClick={onShare} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 border border-white/5 text-slate-400 active:text-cyan-400" title={m.share}>
              <Share2 size={14} />
            </button>
            <button onClick={onPdf} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 border border-white/5 text-slate-400 active:text-cyan-400" title={m.pdfReport}>
              <FileText size={14} />
            </button>
          </div>
        </header>
        <div className="flex-grow w-full relative overflow-y-auto px-4 py-6 pb-12 custom-scrollbar bg-[#020408]">
          <div className="min-h-full w-full relative select-text">
            <WindowContent type={activeModule} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
