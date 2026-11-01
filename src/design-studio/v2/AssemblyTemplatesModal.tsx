'use client';

/**
 * ⚡ ASSEMBLY TEMPLATES MODAL WINDOW (ALUCAD OS 3D STUDIO V2)
 * 
 * Industrial CAD Modal Window for 1-click parametric multi-part assemblies:
 * - Spur Gearbox & Keyway Shaft Assemblies (ISO 6336 / DIN 6885)
 * - T-Slot CNC Aluminum Extrusion Gantry Frames (DIN EN 755-9)
 * - Aerospace Isogrid Pocketed Mounting Plates (VDI 2230 / CNC DFM)
 * - ISO Bolted Flange Assemblies with Smart Socket Cap Fasteners (DIN 912)
 * - ISO 6205 Transmission Shaft & Pillow Block Bearing Units (ISO 15)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  X,
  Layers,
  Search,
  Check,
  ChevronRight,
  ShieldCheck,
  Wrench,
  Boxes,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { STUDIO_ASSEMBLY_TEMPLATES, type StudioAssemblyTemplate } from './QuickDesignStudioTemplates';
import { useDesignStore } from '@/design-studio/designStore';
import { triggerCameraView } from '@/design-studio/cadCameraDispatcher';

interface AssemblyTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotification?: (msg: string) => void;
}

export function AssemblyTemplatesModal({
  isOpen,
  onClose,
  onNotification,
}: AssemblyTemplatesModalProps) {
  const { language } = useI18nStore();
  const isTr = language === 'tr';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return STUDIO_ASSEMBLY_TEMPLATES;
    const q = searchQuery.toLowerCase();
    return STUDIO_ASSEMBLY_TEMPLATES.filter((tpl) => {
      const name = isTr ? tpl.nameTr.toLowerCase() : tpl.nameEn.toLowerCase();
      const desc = isTr ? tpl.descTr.toLowerCase() : tpl.descEn.toLowerCase();
      const std = tpl.standard.toLowerCase();
      const badge = tpl.badge.toLowerCase();
      return name.includes(q) || desc.includes(q) || std.includes(q) || badge.includes(q);
    });
  }, [searchQuery, isTr]);

  if (!isOpen) return null;

  const handleApplyTemplate = (tpl: StudioAssemblyTemplate) => {
    tpl.build();
    onClose();
    if (onNotification) {
      onNotification(isTr ? `⚡ ${tpl.nameTr} başarıyla yüklendi` : `⚡ Loaded ${tpl.nameEn}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-3 pb-6 bg-black/60-[3px] animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[var(--bg-1)] border border-amber-500/40 rounded-[var(--radius-l)] shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden font-mono text-[11px] text-[var(--ink)] select-none animate-in slide-in-from-top-4 duration-200"
      >
        {/* ─── WINDOW HEADER (TITLEBAR) ─── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)] bg-[var(--bg-1)] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-[var(--radius-s)] bg-amber-500/20 border border-amber-500/50 text-amber-400 shrink-0">
              <Sparkles size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-white truncate">
                  {t12(language, 'PARAMETRIC ASSEMBLY TEMPLATES', 'HAZIR MONTAJ ŞABLONLARI')}
                </h2>
                <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold shrink-0">
                  ISO / DIN / VDI
                </span>
              </div>
              <p className="text-[9.5px] text-[var(--alu-dim)] truncate mt-0.5 font-sans">
                {t12(
                  language,
                  '1-Click validated multi-part assemblies with constraints & standards',
                  '1-Tıkla ISO/DIN standartlarında hazır mekanik montaj yükleyin'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-s)] text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={t12(language, 'Close [Esc]', 'Kapat [Esc]')}
          >
            <X size={16} />
          </button>
        </div>

        {/* ─── SEARCH & FILTER BAR ─── */}
        <div className="px-4 py-2 border-b border-[var(--line)] bg-[var(--bg-0)] flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t12(
                language,
                'Search templates: "gearbox", "gantry", "isogrid", "flange"...',
                'Şablon ara: "dişli", "portal", "flanş", "rulman", "isogrid"...'
              )}
              className="w-full h-7 pl-8 pr-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] text-[10.5px] text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-sans"
              autoFocus
            />
          </div>

          <span className="text-[9.5px] text-slate-400 font-bold shrink-0">
            {filteredTemplates.length} {t12(language, 'Templates', 'Şablon')}
          </span>
        </div>

        {/* ─── TEMPLATES LIST ─── */}
        <div className="p-3.5 space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              {t12(language, 'No matching assembly templates found.', 'Eşleşen montaj şablonu bulunamadı.')}
            </div>
          ) : (
            filteredTemplates.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`group relative p-3 rounded-[var(--radius-m)] border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-400/80 '
                      : 'bg-[var(--bg-0)] hover:bg-[var(--bg-1)] border-[var(--line)] hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">
                          {isTr ? tpl.nameTr : tpl.nameEn}
                        </span>

                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-[9px] font-bold text-amber-300">
                          {tpl.badge}
                        </span>

                        <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-[8.5px] text-slate-300 font-mono">
                          {tpl.standard}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-sans">
                        {isTr ? tpl.descTr : tpl.descEn}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyTemplate(tpl);
                      }}
                      className="px-3 py-1.5 rounded-[var(--radius-s)] bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[10px] flex items-center gap-1.5 shrink-0 transition-all shadow-md cursor-pointer active:scale-95"
                    >
                      <span>{t12(language, 'Load Assembly', 'Montajı Yükle')}</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ─── WINDOW FOOTER ─── */}
        <div className="px-4 py-2.5 border-t border-[var(--line)] bg-[var(--bg-1)] flex items-center justify-between text-[9.5px] text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 text-amber-400/90 font-sans">
            <ShieldCheck size={13} className="shrink-0" />
            <span>
              {t12(
                language,
                'Tip: Loaded assemblies are automatically centered & can be exported as STEP/STL.',
                'İpucu: Yüklenen montajlar otomatik odaklanır, STEP ve STL olarak dışa aktarılabilir.'
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-slate-300 hover:text-white font-bold cursor-pointer"
          >
            {t12(language, 'Close', 'Kapat')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssemblyTemplatesModal;
