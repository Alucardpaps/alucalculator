'use client';

/**
 * 🎛️ WORKBENCH HEADER (V2 UNIFIED 3D STUDIO)
 * Fusion 360 / Siemens NX style horizontal workbench switcher.
 * Hosts: CAD | ASSEMBLY | FEA | CAM | FACTORY | COST | 2D DRAFTING
 */

import React from 'react';
import Link from 'next/link';
import {
  Box,
  Layers,
  Activity,
  Scissors,
  Factory,
  DollarSign,
  Pencil,
  Download,
  Share2,
  Undo2,
  Redo2,
  Grid,
  Eye,
  Maximize2,
  ChevronDown,
  Sparkles,
  Monitor,
  MousePointer,
  Move,
  RotateCw,
  Scale as ScaleIcon,
  FileSpreadsheet,
  ShieldAlert,
  Terminal,
  Flame,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useDesignStore, type DesignTool } from '@/design-studio/designStore';
import { SaveStatusIndicator } from '@/cad/components/SaveStatusIndicator';

export type V2WorkbenchId =
  | 'cad'
  | 'weldment'
  | 'assembly'
  | 'fea'
  | 'cam'
  | 'factory'
  | 'cost'
  | 'drawing'
  | 'sculpt';

interface WorkbenchHeaderProps {
  currentWorkbench: V2WorkbenchId;
  onSelectWorkbench: (wb: V2WorkbenchId) => void;
  onToggleV1Classic: () => void;
  onExportSTL: () => void;
  onExportSTEP: () => void;
  onOpenBom?: () => void;
  onCheckInterference?: () => void;
  onOpenCommandBar?: () => void;
  onOpenTextToCad?: () => void;
}

export function WorkbenchHeader({
  currentWorkbench,
  onSelectWorkbench,
  onToggleV1Classic,
  onExportSTL,
  onExportSTEP,
  onOpenBom,
  onCheckInterference,
  onOpenCommandBar,
  onOpenTextToCad,
}: WorkbenchHeaderProps) {
  const { language } = useI18nStore();
  const projectName = useDesignStore((s) => s.projectName);
  const setProjectName = useDesignStore((s) => s.setProjectName);
  const tool = useDesignStore((s) => s.tool);
  const setTool = useDesignStore((s) => s.setTool);
  const parts = useDesignStore((s) => s.parts);
  const undo = useDesignStore((s) => s.undo);
  const redo = useDesignStore((s) => s.redo);

  const workbenches: {
    id: V2WorkbenchId;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    nameEn: string;
    nameTr: string;
    color: string;
  }[] = [
    { id: 'cad', icon: Box, nameEn: '1. PART', nameTr: '1. PARÇA', color: 'text-[var(--cyan)]' },
    { id: 'weldment', icon: Flame, nameEn: '2. WELDMENT', nameTr: '2. KAYNAK & ÇATMA', color: 'text-amber-400' },
    { id: 'assembly', icon: Layers, nameEn: '3. ASSEMBLY', nameTr: '3. MONTAJ', color: 'text-emerald-400' },
    { id: 'fea', icon: Activity, nameEn: 'FEA', nameTr: 'FEA', color: 'text-rose-400' },
    { id: 'cam', icon: Scissors, nameEn: 'CAM', nameTr: 'CAM', color: 'text-teal-400' },
    { id: 'factory', icon: Factory, nameEn: 'FACTORY', nameTr: 'FABRİKA', color: 'text-emerald-400' },
    { id: 'cost', icon: DollarSign, nameEn: 'COST & ESG', nameTr: 'MALİYET & ESG', color: 'text-sky-400' },
    { id: 'drawing', icon: Pencil, nameEn: '2D DRAWING', nameTr: '2D ÇİZİM', color: 'text-purple-400' },
    { id: 'sculpt', icon: Sparkles, nameEn: 'SCULPT & SURFACE', nameTr: 'HEYKEL & YÜZEY', color: 'text-fuchsia-400' },
  ];

  return (
    <header className="flex flex-col shrink-0 border-b border-[var(--line)] bg-[var(--bg-1)] z-40 select-none font-mono text-[11px]">
      {/* Top Tier: Title, Project Name, Workbench Selector, Quick Actions */}
      <div className="flex h-11 items-center justify-between px-3 gap-2 border-b border-white/5">
        {/* Brand & Project Info (never squeezed: overlapping text was the result) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-s)] bg-[var(--cyan)]/15 border border-[var(--cyan)]/40 text-[var(--cyan)] font-bold text-xs shrink-0">
            <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-pulse" />
            <span>ALUCALC 3D V2</span>
          </div>

          <div className="hidden sm:flex w-[140px] items-center bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)] px-2 py-0.5 focus-within:border-[var(--cyan)] transition-colors">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Untitled Project"
              className="w-full bg-transparent text-[10.5px] font-bold text-white placeholder-slate-500 outline-none truncate"
            />
          </div>

          <span className="hidden md:inline-block text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--alu-dim)]">
            {parts.length} {t12(language, 'Parts', 'Parça')}
          </span>

          <SaveStatusIndicator compact />
        </div>

        {/* Center: Workbench Switcher (Fusion 360 / NX Style) */}
        <div className="flex min-w-[132px] flex-1 items-center gap-0.5 bg-[var(--bg-0)] p-0.5 rounded-[var(--radius-m)] border border-[var(--line)] overflow-x-auto no-scrollbar">
          {workbenches.map((wb) => {
            const Icon = wb.icon;
            const isActive = currentWorkbench === wb.id;
            const label = t12(language, wb.nameEn, wb.nameTr);
            return (
              <button
                key={wb.id}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => onSelectWorkbench(wb.id)}
                className={`px-2.5 py-1 rounded-[var(--radius-s)] font-bold text-[10px] flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--bg-2)] text-white border border-[var(--cyan)] '
                    : 'text-[var(--alu-dim)] hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon size={12} className={isActive ? wb.color : 'text-slate-400'} />
                {/* below 2xl only the active workbench shows its name; the rest are icons */}
                <span className={isActive ? 'whitespace-nowrap' : 'hidden whitespace-nowrap 2xl:inline'}>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Transform Gizmo Mode Selector (Q, W, E, R) */}
        <div className="hidden md:flex items-center gap-0.5 bg-[var(--bg-0)] p-0.5 rounded-[var(--radius-m)] border border-[var(--line)] shrink-0">
          <button
            type="button"
            onClick={() => setTool('select')}
            className={`px-2 py-1 rounded-[var(--radius-s)] font-bold text-[9.5px] flex items-center gap-1 transition-all cursor-pointer ${
              tool === 'select'
                ? 'bg-[var(--cyan)] text-black font-extrabold '
                : 'text-[var(--alu-dim)] hover:text-white hover:bg-white/5'
            }`}
            title="Seçim Modu (Q)"
          >
            <MousePointer size={11} />
            <span className="hidden 2xl:inline">Seç</span>
            <span className="text-[8px] opacity-60">Q</span>
          </button>
          <button
            type="button"
            onClick={() => setTool('move')}
            className={`px-2 py-1 rounded-[var(--radius-s)] font-bold text-[9.5px] flex items-center gap-1 transition-all cursor-pointer ${
              tool === 'move'
                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-extrabold '
                : 'text-[var(--alu-dim)] hover:text-white hover:bg-white/5'
            }`}
            title="Taşı / Ötele 3D Gizmo (W)"
          >
            <Move size={11} />
            <span className="hidden 2xl:inline">Taşı</span>
            <span className="text-[8px] opacity-60">W</span>
          </button>
          <button
            type="button"
            onClick={() => setTool('rotate')}
            className={`px-2 py-1 rounded-[var(--radius-s)] font-bold text-[9.5px] flex items-center gap-1 transition-all cursor-pointer ${
              tool === 'rotate'
                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-extrabold '
                : 'text-[var(--alu-dim)] hover:text-white hover:bg-white/5'
            }`}
            title="Döndür 3D Gizmo (E)"
          >
            <RotateCw size={11} />
            <span className="hidden 2xl:inline">Döndür</span>
            <span className="text-[8px] opacity-60">E</span>
          </button>
          <button
            type="button"
            onClick={() => setTool('scale')}
            className={`px-2 py-1 rounded-[var(--radius-s)] font-bold text-[9.5px] flex items-center gap-1 transition-all cursor-pointer ${
              tool === 'scale'
                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-extrabold '
                : 'text-[var(--alu-dim)] hover:text-white hover:bg-white/5'
            }`}
            title="Ölçeklendir 3D Gizmo (R)"
          >
            <ScaleIcon size={11} />
            <span className="hidden 2xl:inline">Ölçek</span>
            <span className="text-[8px] opacity-60">R</span>
          </button>
        </div>

        {/* AeGiS Text-to-CAD Studio Modal Trigger */}
        {onOpenTextToCad && (
          <button
            type="button"
            onClick={onOpenTextToCad}
            className="shrink-0 whitespace-nowrap px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 border border-[var(--cyan)]/50 text-[var(--cyan)] font-extrabold text-[10px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-95"
            title={t12(language, 'Open AeGiS Text-to-CAD Studio', 'AeGiS Metinden 3B CAD Stüdyosunu Aç')}
          >
            <Sparkles size={12} className="text-[var(--cyan)]" />
            <span className="hidden 2xl:inline">{t12(language, 'Text-to-CAD', 'Metinden CAD')}</span>
          </button>
        )}

        {/* AeGiS 3D Natural Language Command Palette Trigger */}
        {onOpenCommandBar && (
          <button
            type="button"
            onClick={onOpenCommandBar}
            className="shrink-0 whitespace-nowrap px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 border border-[var(--cyan)]/40 text-[var(--cyan)] font-extrabold text-[10px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            title={t12(language, 'Open AeGiS 3D Command Console (Ctrl+K)', 'AeGiS 3D Doğal Komut Konsolunu Aç (Ctrl+K)')}
          >
            <Terminal size={12} className="text-[var(--cyan)]" />
            <span className="hidden 2xl:inline">{t12(language, 'Command Console', 'AeGiS Komut')}</span>
            <kbd className="text-[8px] px-1 py-0.2 bg-black/40 rounded border border-white/10 text-slate-300">Ctrl+K</kbd>
          </button>
        )}

        {/* Quick Engineering Tools: BOM & Interference */}
        <div className="flex items-center gap-1 shrink-0">
          {onOpenBom && (
            <button
              type="button"
              onClick={onOpenBom}
              className="px-2 py-1 rounded-[var(--radius-s)] bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
              title="Montaj Ürün Ağacı (BOM), Maliyet ve Karbon Denetimi"
            >
              <FileSpreadsheet size={11} className="text-teal-400" />
              <span className="hidden sm:inline">BOM</span>
            </button>
          )}

          {onCheckInterference && (
            <button
              type="button"
              onClick={onCheckInterference}
              className="px-2 py-1 rounded-[var(--radius-s)] bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
              title="Çakışma ve Girişim Denetimi (Interference Check)"
            >
              <ShieldAlert size={11} className="text-rose-400" />
              <span className="hidden sm:inline">{t12(language, 'Check', 'Çakışma')}</span>
            </button>
          )}
        </div>

        {/* Right Actions: Undo/Redo, Export, V1 Switcher */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden lg:flex items-center gap-1 border-r border-[var(--line)] pr-1.5 mr-1">
            <button
              onClick={() => undo()}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
              title={t12(language, 'Undo (Ctrl+Z)', 'Geri Al (Ctrl+Z)')}
            >
              <Undo2 size={13} />
            </button>
            <button
              onClick={() => redo()}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
              title={t12(language, 'Redo (Ctrl+Y)', 'Yinele (Ctrl+Y)')}
            >
              <Redo2 size={13} />
            </button>
          </div>

          {/* Quick Export Dropdown */}
          <button
            onClick={onExportSTEP}
            className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-white font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
            title="Download ISO 10303 STEP B-Rep"
          >
            <Download size={11} className="text-[var(--cyan)]" />
            <span>STEP</span>
          </button>

          <button
            onClick={onExportSTL}
            className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-white font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
            title="Download STL 3D Mesh"
          >
            <span>STL</span>
          </button>

          {/* V1 Classic Desktop Toggle */}
          <button
            type="button"
            onClick={onToggleV1Classic}
            className="px-2.5 py-1 rounded-[var(--radius-s)] bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 font-bold text-[10px] flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t12(language, 'Switch to V1 Classic Multi-Window Desktop', 'V1 Klasik Çoklu Pencere Masaüstüne Dön')}
          >
            <Monitor size={12} className="text-purple-400" />
            <span className="hidden xl:inline">{t12(language, 'V1 Desktop', 'V1 Masaüstü')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
