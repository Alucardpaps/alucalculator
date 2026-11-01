'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Command, Search, Calculator, Sliders, Eye, Compass } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);
  const { language } = useI18nStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Trigger on '?' when not typing in an input
      if (
        (e.key === '?' || (e.shiftKey && e.key === '/')) &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    const handleCustomOpen = () => setOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('alucalc:open-shortcuts', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('alucalc:open-shortcuts', handleCustomOpen);
    };
  }, [open]);

  if (!open) return null;

  const SHORTCUTS = [
    {
      keys: ['Ctrl / ⌘', 'K'],
      labelTr: 'Evrensel Komut Paleti & Hesaplayıcı Arama',
      labelEn: 'Universal Command Palette & Tool Search',
      icon: Search,
    },
    {
      keys: ['Ctrl / ⌘', 'Shift', 'C'],
      labelTr: 'Kayan Hızlı Hesaplayıcı & Karalama Notları',
      labelEn: 'Floating Quick Calculator & Scratchpad',
      icon: Calculator,
    },
    {
      keys: ['/'],
      labelTr: 'Hızlı Arama Girişi',
      labelEn: 'Quick Focus Search Bar',
      icon: Command,
    },
    {
      keys: ['Alt', 'S'],
      labelTr: 'Yan Menüyü Genişlet / Daralt',
      labelEn: 'Toggle Desktop Sidebar (Expand/Collapse)',
      icon: Sliders,
    },
    {
      keys: ['Alt', 'M'],
      labelTr: 'Mühendislik Rehberi & Karar Ağacı',
      labelEn: 'Engineering Navigator & Decision Guide',
      icon: Compass,
    },
    {
      keys: ['?'],
      labelTr: 'Bu Kısayol Yardım Penceresini Aç',
      labelEn: 'Show Keyboard Shortcuts HUD',
      icon: Keyboard,
    },
    {
      keys: ['Esc'],
      labelTr: 'Açık Modalı / Paneli Kapat',
      labelEn: 'Dismiss / Close Active Overlay',
      icon: X,
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70"
            onClick={() => setOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            className="relative w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-[var(--bg-0)]/95 p-5 shadow-2xl font-mono text-white"
          >
            <div className="flex items-center justify-between pb-3 border-b border-cyan-900/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)]">
                  <Keyboard size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {t12(language, 'Keyboard Shortcuts', 'Klavye Kısayolları')}
                  </h3>
                  <p className="text-[10px] text-cyan-400/70">
                    {t12(language, 'Speed up your engineering workflow', 'Hızlı mühendislik navigasyonu')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-3 space-y-2">
              {SHORTCUTS.map((sc, i) => {
                const Icon = sc.icon;
                return (
                  <div
                    key={`sc-${i}`}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-950/20 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <Icon size={14} className="text-cyan-400 shrink-0" />
                      <span className="text-xs text-slate-300 truncate">
                        {t12(language, sc.labelEn, sc.labelTr)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {sc.keys.map((k, ki) => (
                        <kbd
                          key={`k-${ki}`}
                          className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-800/50 text-[10px] text-cyan-300 font-bold shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-cyan-900/30 flex items-center justify-between text-[10px] text-slate-500">
              <span>AluCAD Engineering Platform</span>
              <span>Press <kbd className="text-cyan-400">Esc</kbd> to close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
