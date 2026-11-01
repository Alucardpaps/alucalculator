'use client';

/**
 * 🛠️ SOLIDWORKS 'S' SHORTCUT BAR (CONTEXT HUD)
 * 
 * Pops up right at the operator's mouse cursor when pressing 'S'.
 * Context-aware quick grid for rapid 1-click execution without navigating menus:
 * - Part Mode: Push/Pull Face, Hole Wizard, PCD Bolt Circle, Fasteners, Pocket, Measure, Duplicate, Delete
 * - Assembly Mode: Insert Component, Mates & Joints, Fasteners, Interference Check, BOM, Section View
 */

import React, { useEffect, useRef } from 'react';
import {
  Layers,
  CircleDot,
  Wrench,
  Scissors,
  Ruler,
  Copy,
  Trash2,
  Sparkles,
  Box,
  Compass,
  FileSpreadsheet,
  ShieldCheck,
  Maximize2,
  X,
  Move,
  RotateCw,
  Eye,
  Sliders,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import type { DesignPart } from '@/design-studio/designStore';

export interface SolidWorksShortcutAction {
  id: string;
  labelEn: string;
  labelTr: string;
  hotkey?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color?: string;
  category: 'feature' | 'assembly' | 'tool' | 'danger';
  onClick: () => void;
}

interface SolidWorksShortcutHudProps {
  isOpen: boolean;
  position: { x: number; y: number };
  selectedPart: DesignPart | null;
  onClose: () => void;
  // Handler callbacks
  onOpenDirectModeling: () => void;
  onOpenHoleWizard: () => void;
  onOpenBoltCircle: () => void;
  onOpenSmartFasteners: () => void;
  onOpenSurfaceCut: () => void;
  onOpenShapeCatalog: () => void;
  onOpenMates: () => void;
  onOpenBom: () => void;
  onCheckInterference: () => void;
  onOpenCommandBar: () => void;
  onToggleMeasure: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onStartGrab: () => void;
  onStartRotate: () => void;
  onCameraFit: () => void;
  onToggleSection: () => void;
}

export function SolidWorksShortcutHud({
  isOpen,
  position,
  selectedPart,
  onClose,
  onOpenDirectModeling,
  onOpenHoleWizard,
  onOpenBoltCircle,
  onOpenSmartFasteners,
  onOpenSurfaceCut,
  onOpenShapeCatalog,
  onOpenMates,
  onOpenBom,
  onCheckInterference,
  onOpenCommandBar,
  onToggleMeasure,
  onDuplicate,
  onDelete,
  onStartGrab,
  onStartRotate,
  onCameraFit,
  onToggleSection,
}: SolidWorksShortcutHudProps) {
  const { language } = useI18nStore();
  const hudRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      if (hudRef.current && !hudRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Clamp popup inside window bounds
  const width = 320;
  const height = 260;
  const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

  const left = Math.min(Math.max(16, position.x - width / 2), screenW - width - 16);
  const top = Math.min(Math.max(64, position.y - 20), screenH - height - 16);

  // Build context actions
  const actions: SolidWorksShortcutAction[] = selectedPart
    ? [
        {
          id: 'direct-modeling',
          labelEn: 'Push/Pull Face',
          labelTr: 'Yüzey İt/Çek (NX)',
          hotkey: 'P',
          icon: Move,
          color: 'var(--cyan)',
          category: 'feature',
          onClick: () => {
            onOpenDirectModeling();
            onClose();
          },
        },
        {
          id: 'grab-modal',
          labelEn: 'Modal Grab',
          labelTr: 'Modal Taşı (G)',
          hotkey: 'G',
          icon: Move,
          color: 'var(--cyan)',
          category: 'tool',
          onClick: () => {
            onStartGrab();
            onClose();
          },
        },
        {
          id: 'rotate-modal',
          labelEn: 'Modal Rotate',
          labelTr: 'Modal Döndür (R)',
          hotkey: 'R',
          icon: RotateCw,
          color: '#f59e0b',
          category: 'tool',
          onClick: () => {
            onStartRotate();
            onClose();
          },
        },
        {
          id: 'hole-wizard',
          labelEn: 'Hole Wizard',
          labelTr: 'Delik Sihirbazı',
          hotkey: 'H',
          icon: CircleDot,
          color: 'var(--ok)',
          category: 'feature',
          onClick: () => {
            onOpenHoleWizard();
            onClose();
          },
        },
        {
          id: 'bolt-circle',
          labelEn: 'Bolt Circle (PCD)',
          labelTr: 'Flanş Cıvata Dairesi',
          icon: CircleDot,
          color: '#38bdf8',
          category: 'feature',
          onClick: () => {
            onOpenBoltCircle();
            onClose();
          },
        },
        {
          id: 'fasteners',
          labelEn: 'Smart Fasteners',
          labelTr: 'Akıllı Bağlantı Elemanı',
          icon: Wrench,
          color: 'var(--alu)',
          category: 'assembly',
          onClick: () => {
            onOpenSmartFasteners();
            onClose();
          },
        },
        {
          id: 'pocket-cut',
          labelEn: 'Pocket / Cut',
          labelTr: 'Yüzey Havuzu / Kesim',
          icon: Scissors,
          color: '#f97316',
          category: 'feature',
          onClick: () => {
            onOpenSurfaceCut();
            onClose();
          },
        },
        {
          id: 'measure',
          labelEn: 'Measure / Ruler',
          labelTr: 'Ölçüm / Cetvel',
          hotkey: 'M',
          icon: Ruler,
          color: 'var(--alu)',
          category: 'tool',
          onClick: () => {
            onToggleMeasure();
            onClose();
          },
        },
        {
          id: 'duplicate',
          labelEn: 'Duplicate',
          labelTr: 'Çoğalt',
          hotkey: 'D',
          icon: Copy,
          color: 'var(--alu)',
          category: 'tool',
          onClick: () => {
            onDuplicate();
            onClose();
          },
        },
        {
          id: 'spotlight',
          labelEn: 'AeGiS Spotlight',
          labelTr: 'AeGiS 3D Konsol',
          hotkey: 'Ctrl+K',
          icon: Sparkles,
          color: 'var(--cyan)',
          category: 'tool',
          onClick: () => {
            onOpenCommandBar();
            onClose();
          },
        },
        {
          id: 'delete',
          labelEn: 'Delete Part',
          labelTr: 'Parçayı Sil',
          hotkey: 'Del',
          icon: Trash2,
          color: 'var(--bad)',
          category: 'danger',
          onClick: () => {
            onDelete();
            onClose();
          },
        },
      ]
    : [
        {
          id: 'shape-catalog',
          labelEn: 'Insert Part',
          labelTr: 'Parça / Profil Ekle',
          hotkey: 'I',
          icon: Box,
          color: 'var(--cyan)',
          category: 'assembly',
          onClick: () => {
            onOpenShapeCatalog();
            onClose();
          },
        },
        {
          id: 'mates',
          labelEn: 'Assembly Mates',
          labelTr: 'Montaj İlişkileri',
          hotkey: 'J',
          icon: Compass,
          color: 'var(--ok)',
          category: 'assembly',
          onClick: () => {
            onOpenMates();
            onClose();
          },
        },
        {
          id: 'fasteners',
          labelEn: 'Smart Fasteners',
          labelTr: 'Akıllı Bağlantılar',
          icon: Wrench,
          color: 'var(--alu)',
          category: 'assembly',
          onClick: () => {
            onOpenSmartFasteners();
            onClose();
          },
        },
        {
          id: 'clash',
          labelEn: 'Interference Check',
          labelTr: 'Çakışma Kontrolü',
          icon: ShieldCheck,
          color: '#eab308',
          category: 'tool',
          onClick: () => {
            onCheckInterference();
            onClose();
          },
        },
        {
          id: 'bom',
          labelEn: 'Assembly BOM',
          labelTr: 'Malzeme Listesi (BOM)',
          icon: FileSpreadsheet,
          color: 'var(--alu)',
          category: 'tool',
          onClick: () => {
            onOpenBom();
            onClose();
          },
        },
        {
          id: 'section',
          labelEn: 'Section Slicer',
          labelTr: 'Kesit Düzlemi (X/Y/Z)',
          icon: Scissors,
          color: '#f97316',
          category: 'tool',
          onClick: () => {
            onToggleSection();
            onClose();
          },
        },
        {
          id: 'fit',
          labelEn: 'Zoom to Fit',
          labelTr: 'Sığdır (Fit)',
          hotkey: 'F',
          icon: Maximize2,
          color: 'var(--alu)',
          category: 'tool',
          onClick: () => {
            onCameraFit();
            onClose();
          },
        },
        {
          id: 'spotlight',
          labelEn: 'AeGiS Spotlight',
          labelTr: 'AeGiS 3D Konsol',
          hotkey: 'Ctrl+K',
          icon: Sparkles,
          color: 'var(--cyan)',
          category: 'tool',
          onClick: () => {
            onOpenCommandBar();
            onClose();
          },
        },
      ];

  return (
    <div
      ref={hudRef}
      data-testid="solidworks-shortcut-hud"
      className="fixed z-50 flex flex-col rounded border bg-[var(--bg-0)] text-[var(--ink)] shadow-2xl select-none"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        borderColor: 'var(--line)',
        borderTop: '2px solid var(--cyan)',
        filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.85))',
      }}
    >
      {/* HUD Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[var(--line)] bg-[var(--bg-1)]">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)]" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-[var(--ink)] uppercase">
            {selectedPart
              ? t12(language, 'PART SHORTCUTS [S]', 'PARÇA KISAYOLLARI [S]')
              : t12(language, 'ASSEMBLY SHORTCUTS [S]', 'MONTAJ KISAYOLLARI [S]')}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-0.5 text-[var(--alu)] hover:text-white rounded transition-colors"
          title="Close [Esc]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid of Contextual Tools */}
      <div className="p-1.5 grid grid-cols-2 gap-1 max-h-[320px] overflow-y-auto">
        {actions.map((act) => {
          const Icon = act.icon;
          const isDanger = act.category === 'danger';
          return (
            <button
              key={act.id}
              type="button"
              onClick={act.onClick}
              className={`flex items-center justify-between p-2 rounded text-left transition-colors border group ${
                isDanger
                  ? 'bg-[var(--bad)]/10 hover:bg-[var(--bad)]/20 border-[var(--bad)]/30 text-[var(--bad)]'
                  : 'bg-[var(--bg-1)] hover:bg-[var(--bg-2)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--alu)]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon
                  className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110"
                  style={{ color: act.color || 'var(--alu)' }}
                />
                <span className="text-[11px] font-mono font-medium truncate">
                  {t12(language, act.labelEn, act.labelTr)}
                </span>
              </div>
              {act.hotkey && (
                <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[var(--bg-0)] text-[var(--alu)] border border-[var(--line)] ml-1 shrink-0">
                  {act.hotkey}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Hotkey Guide */}
      <div className="px-2.5 py-1 border-t border-[var(--line)] bg-[var(--bg-1)] flex items-center justify-between text-[10px] font-mono text-[var(--alu)]">
        <span>{t12(language, 'SolidWorks S-Menu & Blender Modals', 'SolidWorks S-Menüsü & Blender Modalleri')}</span>
        <span className="text-[9px] text-[var(--cyan)]">AluCalc CAD</span>
      </div>
    </div>
  );
}
