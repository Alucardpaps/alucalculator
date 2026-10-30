'use client';

import { useEffect, useState, useMemo } from 'react';
import { toggleThemeKind } from '@/lib/theme/themeStore';
import { useRouter, usePathname } from 'next/navigation';
import { Command } from 'cmdk';
import { useOSStore } from '@/store/osStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { solverCount } from '@/lib/registry/calculatorRegistry';
import { MODULE_REGISTRY } from '@/config/modules';
import { ALL_NAV_GROUPS } from '@/components/layout/DesktopSidebar';
import { ENGINEERING_CONSTANTS, EngineeringConstant } from '@/data/engineering-constants';
import {
  Search,
  Monitor,
  Terminal,
  Settings,
  Zap,
  X,
  Eye,
  Focus,
  Volume2,
  VolumeX,
  AlertTriangle,
  Code,
  Clock,
  Lightbulb,
  Calculator,
  Star,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  Box,
  Workflow,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AegisIcon } from '@/components/copilot/AegisIcon';

function evaluateMathExpression(expr: string): string | null {
  const trimmed = expr.trim();
  if (trimmed.length < 2) return null;
  // Check if it looks like math: contains digits and at least one math operator or function
  if (!/^[\d\s+\-*/%^().,a-z]+$/i.test(trimmed)) return null;
  if (!/[+\-*/^%]/.test(trimmed) && !/\b(sqrt|sin|cos|tan|abs|pi)\b/i.test(trimmed)) return null;

  try {
    const sanitized = trimmed
      .replace(/\bpi\b/gi, String(Math.PI))
      .replace(/\be\b/gi, String(Math.E))
      .replace(/\bsqrt\(([^)]+)\)/gi, 'Math.sqrt($1)')
      .replace(/\bsin\(([^)]+)\)/gi, 'Math.sin($1)')
      .replace(/\bcos\(([^)]+)\)/gi, 'Math.cos($1)')
      .replace(/\btan\(([^)]+)\)/gi, 'Math.tan($1)')
      .replace(/\babs\(([^)]+)\)/gi, 'Math.abs($1)')
      .replace(/\^/g, '**');

    if (!/^[\d\s+\-*/%().,Math.sqrtincosabPIE*]+$/.test(sanitized)) return null;
    // eslint-disable-next-line no-new-func
    const fn = new Function(`"use strict"; return (${sanitized});`);
    const val = fn();
    if (typeof val === 'number' && !Number.isNaN(val) && Number.isFinite(val)) {
      return Number.isInteger(val) ? val.toString() : Number(val.toFixed(6)).toString();
    }
  } catch {
    return null;
  }
  return null;
}

export function GlobalCommandPalette() {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const { language } = useI18nStore();

  const [localOpen, setLocalOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState('');

  const {
    isCommandPaletteOpen,
    commandPaletteQuery,
    openCommandPalette,
    closeCommandPalette,
    setCommandPaletteQuery,
    openWindow,
    isChaosMode,
    toggleChaosMode,
    isFocusMode,
    toggleFocusMode,
    isAudioEnabled,
    toggleAudio,
    initiateSelfDestruct,
    setTheme,
    theme,
    closeAllWindows,
  } = useOSStore();

  const isOpen = localOpen || isCommandPaletteOpen;
  const currentQuery = localQuery || commandPaletteQuery;

  const handleClose = () => {
    setLocalOpen(false);
    setLocalQuery('');
    closeCommandPalette();
  };

  const handleOpen = (q?: string) => {
    setLocalOpen(true);
    if (q !== undefined) setLocalQuery(q);
    openCommandPalette(q || '');
  };

  const handleSetQuery = (q: string) => {
    setLocalQuery(q);
    setCommandPaletteQuery(q);
  };

  const { favorites, recents, toggleFavorite, isFavorite, addRecent, init } = useFavoritesStore();

  const [instantAnswer, setInstantAnswer] = useState<EngineeringConstant | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  // Initialize favorites on mount
  useEffect(() => {
    init();
  }, [init]);

  // Ensure command palette is strictly closed whenever pathname changes (prevents covering /fea or other studios on landing)
  useEffect(() => {
    setLocalOpen(false);
    setLocalQuery('');
    closeCommandPalette();
  }, [pathname, closeCommandPalette]);

  // Evaluate instant math result
  const mathResult = useMemo(() => evaluateMathExpression(currentQuery), [currentQuery]);

  // Instant Engineering Constant Answer Logic
  useEffect(() => {
    if (!currentQuery || currentQuery.length < 2) {
      setInstantAnswer(null);
      return;
    }

    const q = currentQuery.toLowerCase().trim();
    const match = ENGINEERING_CONSTANTS.find((c) =>
      c.keywords.some((k) => q.includes(k.toLowerCase()) || k.toLowerCase().includes(q)),
    );
    setInstantAnswer(match || null);
  }, [currentQuery]);

  // Universal Keyboard Shortcuts: Ctrl+K, Cmd+K, Alt+S, /, Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          handleClose();
        } else {
          handleOpen();
        }
        return;
      }

      // Alt+S
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (isOpen) {
          handleClose();
        } else {
          handleOpen();
        }
        return;
      }

      // Enter key copies math result if active
      if (e.key === 'Enter' && mathResult && isOpen) {
        e.preventDefault();
        handleCopy(mathResult);
        setTimeout(() => handleClose(), 300);
        return;
      }

      // Escape
      if (e.key === 'Escape' && isOpen) {
        handleClose();
        return;
      }

      // '/' when not in input
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        handleOpen();
        return;
      }
    };

    const handleCustomOpen = (e?: any) => {
      handleOpen(e?.detail !== undefined ? String(e.detail) : '');
    };

    const handleCustomSetQuery = (e: any) => {
      if (e?.detail !== undefined) {
        handleSetQuery(String(e.detail));
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('alucalc:open-command-palette', handleCustomOpen);
    window.addEventListener('alucalc:close-command-palette', handleClose);
    window.addEventListener('alucalc:set-command-palette-query', handleCustomSetQuery);

    if (typeof window !== 'undefined') {
      (window as any).__openPalette = (q?: string) => handleOpen(q);
      (window as any).__setPaletteQuery = (q: string) => handleSetQuery(q);
      (window as any).__closePalette = () => handleClose();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('alucalc:open-command-palette', handleCustomOpen);
      window.removeEventListener('alucalc:close-command-palette', handleClose);
      window.removeEventListener('alucalc:set-command-palette-query', handleCustomSetQuery);
      if (typeof window !== 'undefined') {
        delete (window as any).__openPalette;
        delete (window as any).__setPaletteQuery;
        delete (window as any).__closePalette;
      }
    };
  }, [isOpen]);

  const handleCopy = (val: string) => {
    navigator.clipboard?.writeText(val);
    setCopiedValue(val);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  // Flattened list of tools from ALL_NAV_GROUPS
  const allNavItems = useMemo(() => {
    return ALL_NAV_GROUPS.flatMap((g) => g.items);
  }, []);

  const handleSelectTool = (item: { id: string; href: string; labelEn: string; labelTr: string }) => {
    addRecent({ id: item.id, href: item.href, labelEn: item.labelEn, labelTr: item.labelTr });
    handleClose();

    // If on /desktop or OS runtime, open window
    if (pathname.startsWith('/desktop') || pathname.startsWith('/workspace')) {
      openWindow(item.id as any);
    } else {
      router.push(item.href);
    }
  };

  const handleSelectModuleType = (type: string) => {
    const navMatch = allNavItems.find((n) => n.id === type || n.href === `/${type}`);
    const label = MODULE_REGISTRY[type]?.title || type;
    const href = navMatch ? navMatch.href : `/${type}`;

    addRecent({ id: type, href, labelEn: label, labelTr: label });
    handleClose();

    if (pathname.startsWith('/desktop') || pathname.startsWith('/workspace')) {
      openWindow(type as any);
    } else {
      router.push(href);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] px-3 sm:px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80"
            onClick={() => handleClose()}
          />

          {/* Command Palette Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`relative w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl border ${
              isChaosMode ? 'border-red-500/50 ' : 'border-cyan-500/30'
            }`}
            style={{
              backgroundColor: 'rgba(5, 9, 14, 0.98)',
            }}
          >
            <Command className="flex flex-col w-full h-full text-cyan-50" loop>
              {/* Search Header */}
              <div className="flex items-center px-4 py-3 border-b border-cyan-900/40 gap-3">
                <Search className="w-5 h-5 text-cyan-400 shrink-0" />
                <Command.Input
                  autoFocus
                  value={currentQuery}
                  onValueChange={handleSetQuery}
                  placeholder={t12(language, 'Search solvers or evaluate math (e.g. sqrt(144), bolt, 250*1.5)...', 'Çözücü ara veya formül yaz (örn: sqrt(144), civata, 250*1.5)...')}
                  className="flex-1 bg-transparent outline-none placeholder:text-cyan-800 text-base sm:text-lg font-mono text-white"
                />
                <button
                  type="button"
                  onClick={() => handleClose()}
                  className="p-1.5 rounded-lg bg-cyan-900/30 text-cyan-400 hover:bg-cyan-900/50 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* 🧮 Live Math Evaluator Result Card */}
              <AnimatePresence>
                {mathResult && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b border-emerald-500/30"
                  >
                    <div className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[var(--cyan-glow)] flex items-center justify-center text-[var(--cyan)] shrink-0">
                          <Calculator size={18} />
                        </div>
                        <div>
                          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                            {t12(language, 'Live Math Result', 'Canlı Matematik Sonucu')}
                          </div>
                          <div className="text-xl font-black text-emerald-300 font-mono tracking-tight">
                            {mathResult}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(mathResult)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold transition-all"
                      >
                        {copiedValue === mathResult ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>{copiedValue === mathResult ? (t12(language, 'Copied', 'Kopyalandı')) : (t12(language, 'Copy', 'Kopyala'))}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 💡 Instant AI Engineering Constant Answer */}
              <AnimatePresence>
                {instantAnswer && !mathResult && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b border-amber-500/30"
                  >
                    <div className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[var(--cyan-glow)] flex items-center justify-center text-[var(--cyan)] shrink-0 mt-0.5">
                          <Lightbulb size={18} className="animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-lg font-black text-amber-400 font-mono tracking-tighter">
                              {instantAnswer.value}
                            </span>
                            <span className="text-xs font-bold text-amber-500 uppercase italic">
                              {instantAnswer.unit}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300 font-medium">
                            {instantAnswer.description}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(String(instantAnswer.value))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold transition-all shrink-0"
                      >
                        {copiedValue === String(instantAnswer.value) ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedValue === String(instantAnswer.value) ? (t12(language, 'Copied', 'Kopyalandı')) : (t12(language, 'Copy', 'Kopyala'))}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results List */}
              <Command.List className="max-h-[55vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent">
                <Command.Empty className="py-8 text-center font-mono text-sm">
                  {mathResult ? (
                    <span className="text-emerald-400/80 font-mono text-xs">
                      {t12(language, '↵ Press Enter or click Copy to copy calculation result', '↵ Sonucu kopyalamak için Enter\'a basın veya Kopyala\'ya tıklayın')}
                    </span>
                  ) : (
                    <span className="text-cyan-700">
                      {t12(language, 'No results found. Try "bolt", "beam", "cad", or "fea".', 'Sonuç bulunamadı. "civata", "kiris", "cad" veya "fea" deneyin.')}
                    </span>
                  )}
                </Command.Empty>

                {/* ★ Favorites Group */}
                {favorites.length > 0 && !commandPaletteQuery && (
                  <Command.Group
                    heading={t12(language, '★ Favorite Calculators', '★ Sık Kullanılanlar')}
                    className="px-2 py-2 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider border-b border-cyan-900/20 mb-1"
                  >
                    {favorites.map((fav) => (
                      <Command.Item
                        key={`fav-${fav.id}`}
                        onSelect={() => handleSelectTool(fav)}
                        className="flex items-center px-3 py-2 mt-1 rounded-lg cursor-pointer hover:bg-amber-500/10 aria-selected:bg-amber-500/20 transition-colors group"
                      >
                        <Star className="w-4 h-4 mr-3 text-amber-400 fill-amber-400 shrink-0" />
                        <span className="font-medium text-sm text-amber-100 flex-1">
                          {t12(language, fav.labelEn, fav.labelTr)}
                        </span>
                        {fav.badge && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 mr-2">
                            {fav.badge}
                          </span>
                        )}
                        <ExternalLink size={12} className="text-amber-500/40 group-hover:text-amber-400" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* 🕒 Recents Group */}
                {recents.length > 0 && !commandPaletteQuery && (
                  <Command.Group
                    heading={t12(language, 'Recent Calculators', 'Son Ziyaret Edilenler')}
                    className="px-2 py-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider border-b border-cyan-900/20 mb-1"
                  >
                    {recents.map((item) => (
                      <Command.Item
                        key={`recent-${item.id}`}
                        onSelect={() => handleSelectTool(item)}
                        className="flex items-center px-3 py-2 mt-1 rounded-lg cursor-pointer hover:bg-cyan-900/20 aria-selected:bg-cyan-900/30 transition-colors group"
                      >
                        <Clock className="w-4 h-4 mr-3 text-cyan-500 shrink-0" />
                        <span className="font-medium text-sm text-cyan-100 flex-1">
                          {t12(language, item.labelEn, item.labelTr)}
                        </span>
                        <ExternalLink size={12} className="text-cyan-500/40 group-hover:text-cyan-400" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* ⚙️ All Nav Tools */}
                <Command.Group
                  heading={t12(language, 'Engineering Solvers & Tools', 'Mühendislik Araçları & Hesaplayıcılar')}
                  className="px-2 py-2 text-xs font-mono text-cyan-600 font-bold uppercase tracking-wider"
                >
                  {allNavItems.map((item) => {
                    const isFav = isFavorite(item.id);
                    return (
                      <Command.Item
                        key={`tool-${item.id}`}
                        onSelect={() => handleSelectTool(item)}
                        className="flex items-center px-3 py-2 mt-1 rounded-lg cursor-pointer hover:bg-cyan-900/30 aria-selected:bg-cyan-900/40 transition-colors group"
                      >
                        <Monitor className="w-4 h-4 mr-3 text-cyan-400 shrink-0" />
                        <span className="font-medium text-sm text-slate-200 flex-1 truncate">
                          {t12(language, item.labelEn, item.labelTr)}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item);
                          }}
                          className={`p-1 rounded hover:bg-white/10 mr-1.5 transition-colors ${
                            isFav ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'
                          }`}
                          title={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                        >
                          <Star size={13} className={isFav ? 'fill-amber-400' : ''} />
                        </button>

                        {item.badge && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-800/40">
                            {item.badge}
                          </span>
                        )}
                      </Command.Item>
                    );
                  })}
                </Command.Group>

                {/* ⚡ System Quick Actions */}
                <Command.Group
                  heading={t12(language, 'System Actions', 'Sistem & Kısayollar')}
                  className="px-2 py-2 text-xs font-mono text-cyan-600 font-bold uppercase tracking-wider border-t border-cyan-900/20 mt-2"
                >
                  <Command.Item
                    onSelect={() => {
                      router.push('/calculators');
                      closeCommandPalette();
                    }}
                    className="flex items-center px-3 py-2 mt-1 rounded-lg cursor-pointer hover:bg-cyan-900/30 aria-selected:bg-cyan-900/40 transition-colors"
                  >
                    <Calculator className="w-4 h-4 mr-3 text-cyan-400" />
                    <span className="font-medium text-sm text-cyan-100 flex-1">
                      {t12(language, `Engineering Solvers Directory (${solverCount})`, `Mühendislik Çözücüler Kataloğu (${solverCount})`)}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400/70 uppercase">/calculators</span>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => {
                      closeCommandPalette();
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('alucalc:open-navigator'));
                      }, 50);
                    }}
                    className="flex items-center px-3 py-2 mt-1 rounded-lg cursor-pointer hover:bg-cyan-900/30 aria-selected:bg-cyan-900/40 transition-colors"
                  >
                    <Compass className="w-4 h-4 mr-3 text-cyan-400" />
                    <span className="font-medium text-sm text-cyan-100 flex-1">
                      {t12(language, 'Engineering Navigator & Decision Guide', 'Mühendislik Rehberi & Karar Ağacı')}
                    </span>
                    <kbd className="px-1.5 py-0.5 rounded bg-cyan-900/40 text-[10px] text-cyan-300 font-mono">Alt+M</kbd>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => {
                      router.push('/design-studio');
                      closeCommandPalette();
                    }}
                    className="flex items-center px-3 py-2 mt-1 rounded-lg cursor-pointer hover:bg-cyan-900/30 aria-selected:bg-cyan-900/40 transition-colors"
                  >
                    <Box className="w-4 h-4 mr-3 text-cyan-400" />
                    <span className="font-medium text-sm text-cyan-100">3D Design Studio</span>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => {
                      router.push('/flow');
                      closeCommandPalette();
                    }}
                    className="flex items-center px-3 py-2 mt-1 rounded-lg cursor-pointer hover:bg-cyan-900/30 aria-selected:bg-cyan-900/40 transition-colors"
                  >
                    <Workflow className="w-4 h-4 mr-3 text-cyan-400" />
                    <span className="font-medium text-sm text-cyan-100">Engineering Flow Engine</span>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => {
                      toggleFocusMode();
                      closeCommandPalette();
                    }}
                    className={`flex items-center px-3 py-2 mt-1 rounded-lg cursor-pointer transition-colors ${
                      isFocusMode
                        ? 'hover:bg-purple-900/30 aria-selected:bg-purple-900/40 text-purple-400'
                        : 'hover:bg-cyan-900/30 aria-selected:bg-cyan-900/40 text-slate-300'
                    }`}
                  >
                    <Focus className={`w-4 h-4 mr-3 ${isFocusMode ? 'text-purple-500' : 'text-slate-400'}`} />
                    <span className="font-medium text-sm">
                       {isFocusMode ? 'Disable Focus Mode' : 'Enable Focus Mode (Zen)'}
                    </span>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => {
                      toggleAudio();
                      closeCommandPalette();
                    }}
                    className="flex items-center px-3 py-2 mt-1 rounded-lg cursor-pointer hover:bg-blue-900/30 aria-selected:bg-blue-900/40 transition-colors text-blue-100"
                  >
                    {isAudioEnabled ? (
                      <Volume2 className="w-4 h-4 mr-3 text-blue-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 mr-3 text-slate-500" />
                    )}
                    <span className="font-medium text-sm">
                      {isAudioEnabled ? 'Mute Cyber-Audio' : 'Enable Cyber-Audio'}
                    </span>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => {
                      toggleThemeKind();
                      closeCommandPalette();
                    }}
                    className="flex items-center px-3 py-2 mt-1 rounded-lg cursor-pointer hover:bg-cyan-900/30 aria-selected:bg-cyan-900/40 transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-3 text-cyan-500" />
                    <span className="font-medium text-sm">Toggle Color Theme</span>
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>

            {/* Footer Shortcut Hints */}
            <div className="px-4 py-2 border-t border-cyan-900/40 text-[10px] text-cyan-600 font-mono flex items-center justify-between bg-black/60">
              <span className="hidden sm:inline">AluCalc Universal Command Palette</span>
              <div className="flex items-center gap-2.5 ml-auto">
                <span>
                  <kbd className="bg-cyan-950/80 border border-cyan-800/40 px-1.5 py-0.5 rounded text-cyan-300">↑↓</kbd> navigate
                </span>
                <span>
                  <kbd className="bg-cyan-950/80 border border-cyan-800/40 px-1.5 py-0.5 rounded text-cyan-300">↵</kbd> select
                </span>
                <span>
                  <kbd className="bg-cyan-950/80 border border-cyan-800/40 px-1.5 py-0.5 rounded text-cyan-300">esc</kbd> close
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Global CSS for CMDK to remove default styles
if (typeof document !== 'undefined') {
  const styleId = 'cmdk-custom-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      [cmdk-root] { width: 100%; }
      [cmdk-item][aria-selected="true"] { background-color: rgba(0, 229, 255, 0.12); }
    `;
    document.head.appendChild(style);
  }
}
