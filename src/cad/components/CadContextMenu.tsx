'use client';

import React, { useEffect } from 'react';
import {
  X, Check, RotateCcw, Scissors, ArrowRight, CornerUpRight,
  Maximize2, Download, Trash2, Copy, Move, RotateCw, FlipHorizontal,
  Scale, Layers, Box, Wrench, CircleDot, Grid, Ruler, Sparkles
} from 'lucide-react';
import { t12 } from '@/locales/t12';

export interface CadContextMenuProps {
  x: number;
  y: number;
  selectedCount: number;
  activeCommand: string | null;
  lastCommandId: string | null;
  language: string;
  onClose: () => void;
  onStartCommand: (commandId: string) => void;
  onCancelCommand: () => void;
  onEnterCommand: () => void;
  onRepeatLastCommand: () => void;
  onZoomExtents: () => void;
  onOpenExportModal: (format?: string) => void;
  onOpenSectionAnalysis?: () => void;
  onTransferTo3D?: () => void;
  onDeleteSelected: () => void;
}

/**
 * 📐 CadContextMenu — Precision 2D CAD Right-Click Marking / Context Menu
 * Complies with AluCalc Instrument tokens, AutoCAD / SolidWorks shortcuts & keyboard hints.
 */
export function CadContextMenu({
  x,
  y,
  selectedCount,
  activeCommand,
  lastCommandId,
  language,
  onClose,
  onStartCommand,
  onCancelCommand,
  onEnterCommand,
  onRepeatLastCommand,
  onZoomExtents,
  onOpenExportModal,
  onOpenSectionAnalysis,
  onTransferTo3D,
  onDeleteSelected,
}: CadContextMenuProps) {
  useEffect(() => {
    const handleGlobalClick = () => onClose();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const menuWidth = 240;
  const menuHeight = selectedCount > 0 ? 460 : 380;
  const left = typeof window !== 'undefined' ? Math.max(10, Math.min(x, window.innerWidth - menuWidth - 12)) : x;
  const top = typeof window !== 'undefined' ? Math.max(10, Math.min(y, window.innerHeight - menuHeight - 12)) : y;

  return (
    <div
      className="fixed z-50 py-1 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line-strong)] shadow-[0_12px_45px_rgba(0,0,0,0.9)] text-xs font-sans select-none overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-[92vh] overflow-y-auto custom-scrollbar"
      style={{
        left,
        top,
        width: menuWidth,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ─── HEADER / ACTIVE STATE ─── */}
      <div className="px-3 py-1.5 border-b border-[var(--line)] bg-[var(--bg-2)] flex items-center justify-between text-[11px] font-mono">
        <span className="font-bold text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)]" />
          <span>AluCAD 2D</span>
        </span>
        {activeCommand ? (
          <span className="px-1.5 py-0.5 rounded-[var(--radius-s)] bg-[var(--cyan)]/15 border border-[var(--cyan)]/30 text-[var(--cyan)] font-bold text-[9px] uppercase">
            {activeCommand}
          </span>
        ) : selectedCount > 0 ? (
          <span className="px-1.5 py-0.5 rounded-[var(--radius-s)] bg-[var(--warn)]/15 border border-[var(--warn)]/30 text-[var(--warn)] font-bold text-[9px]">
            {selectedCount} {t12(language, 'SEL', 'SEÇİLİ')}
          </span>
        ) : (
          <span className="text-[10px] text-[var(--alu-dim)] font-mono">READY</span>
        )}
      </div>

      {/* ─── 1. COMMAND CONTROL / REPEAT ─── */}
      {lastCommandId && (
        <button
          type="button"
          onClick={() => {
            onRepeatLastCommand();
            onClose();
          }}
          className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--cyan)] flex items-center justify-between group transition-colors text-[var(--ink)]"
        >
          <span className="flex items-center gap-2">
            <RotateCcw size={13} className="text-[var(--cyan)]" />
            <span className="font-medium">{t12(language, 'Repeat', 'Tekrarla')}: {lastCommandId}</span>
          </span>
          <span className="text-[10px] font-mono text-[var(--alu-dim)] group-hover:text-[var(--cyan)]">Space</span>
        </button>
      )}

      {activeCommand ? (
        <>
          <button
            type="button"
            onClick={() => {
              onEnterCommand();
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--ok)]/15 hover:text-[var(--ok)] flex items-center justify-between text-[var(--ok)] transition-colors"
          >
            <span className="flex items-center gap-2 font-medium">
              <Check size={13} />
              <span>{t12(language, 'Finish / Enter', 'Enter / Bitir')}</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--ok)]/70">Enter</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onCancelCommand();
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-white flex items-center justify-between text-[var(--alu-dim)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <X size={13} />
              <span>{t12(language, 'Cancel Command', 'Komutu İptal Et')}</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--alu-dim)]">Esc</span>
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => {
            onCancelCommand();
            onClose();
          }}
          className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-white flex items-center justify-between text-[var(--alu-dim)] transition-colors"
        >
          <span className="flex items-center gap-2">
            <X size={13} />
            <span>{t12(language, 'Clear Selection', 'Seçimi Temizle')}</span>
          </span>
          <span className="text-[10px] font-mono text-[var(--alu-dim)]">Esc</span>
        </button>
      )}

      {/* ─── 2. SELECTION SPECIFIC ACTIONS (IF OBJECTS SELECTED) ─── */}
      {selectedCount > 0 && (
        <>
          <div className="h-px bg-[var(--line)] my-1" />
          <div className="px-3 py-0.5 text-[9px] font-mono font-bold uppercase text-[var(--alu-dim)] tracking-wider">
            {t12(language, 'Selection Tools', 'Seçim Araçları')} ({selectedCount})
          </div>

          <button
            type="button"
            onClick={() => {
              onDeleteSelected();
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--bad)]/20 hover:text-[var(--bad)] flex items-center justify-between text-[var(--bad)] transition-colors"
          >
            <span className="flex items-center gap-2 font-semibold">
              <Trash2 size={13} />
              <span>{t12(language, 'Delete Selected', 'Seçilenleri Sil')}</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--bad)]/70">Del</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onStartCommand('COPY');
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--ink)] flex items-center justify-between text-[var(--alu)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Copy size={13} className="text-[var(--cyan)]" />
              <span>{t12(language, 'Copy Selection', 'Kopyala')}</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--alu-dim)]">CO</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onStartCommand('MOVE');
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--ink)] flex items-center justify-between text-[var(--alu)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Move size={13} className="text-[var(--std)]" />
              <span>{t12(language, 'Move Selection', 'Taşı')}</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--alu-dim)]">M</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onStartCommand('ROTATE');
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--ink)] flex items-center justify-between text-[var(--alu)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <RotateCw size={13} className="text-[var(--warn)]" />
              <span>{t12(language, 'Rotate Selection', 'Döndür')}</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--alu-dim)]">RO</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onStartCommand('MIRROR');
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--ink)] flex items-center justify-between text-[var(--alu)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <FlipHorizontal size={13} className="text-[var(--ok)]" />
              <span>{t12(language, 'Mirror Selection', 'Aynala')}</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--alu-dim)]">MI</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onStartCommand('GROUP');
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--ink)] flex items-center justify-between text-[var(--alu)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Layers size={13} className="text-purple-400" />
              <span>{t12(language, 'Group / Block', 'Grup Yap / Blok')}</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--alu-dim)]">G</span>
          </button>

          {onTransferTo3D && (
            <button
              type="button"
              onClick={() => {
                onTransferTo3D();
                onClose();
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-[var(--cyan)]/20 hover:text-[var(--cyan)] flex items-center justify-between text-[var(--cyan)] font-medium transition-colors"
            >
              <span className="flex items-center gap-2">
                <Box size={13} />
                <span>{t12(language, 'Extrude to 3D Solid', '3D Katıya Dönüştür')}</span>
              </span>
              <span className="text-[10px] font-mono text-[var(--cyan)]/70">3D</span>
            </button>
          )}
        </>
      )}

      {/* ─── 3. QUICK MODIFY & PRECISION CAD TOOLS ─── */}
      <div className="h-px bg-[var(--line)] my-1" />
      <div className="px-3 py-0.5 text-[9px] font-mono font-bold uppercase text-[var(--alu-dim)] tracking-wider">
        {t12(language, 'Modify & Dimension', 'Düzenleme & Ölçü')}
      </div>

      <button
        type="button"
        onClick={() => {
          onStartCommand('DIMENSION');
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--cyan)] flex items-center justify-between text-[var(--alu)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Ruler size={13} className="text-[var(--cyan)]" />
          <span>{t12(language, 'Dimension', 'Ölçülendir')}</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--alu-dim)]">DIM</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onStartCommand('OFFSET');
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--std)] flex items-center justify-between text-[var(--alu)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <CornerUpRight size={13} className="text-[var(--std)]" />
          <span>{t12(language, 'Offset Parallel', 'Paralel Ötele')}</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--alu-dim)]">O</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onStartCommand('TRIM');
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--warn)] flex items-center justify-between text-[var(--alu)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Scissors size={13} className="text-[var(--warn)]" />
          <span>{t12(language, 'Trim', 'Buda (Trim)')}</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--alu-dim)]">TR</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onStartCommand('EXTEND');
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--ok)] flex items-center justify-between text-[var(--alu)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <ArrowRight size={13} className="text-[var(--ok)]" />
          <span>{t12(language, 'Extend', 'Uzat (Extend)')}</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--alu-dim)]">EX</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onStartCommand('FILLET');
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--cyan)] flex items-center justify-between text-[var(--alu)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <CircleDot size={13} className="text-[var(--cyan)]" />
          <span>{t12(language, 'Fillet (Radius R5)', 'Radyus (Fillet R5)')}</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--alu-dim)]">F</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onStartCommand('CHAMFER');
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--warn)] flex items-center justify-between text-[var(--alu)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-[var(--warn)] text-xs">📐</span>
          <span>{t12(language, 'Chamfer (Bevel 5×45°)', 'Pah (Chamfer 5×45°)')}</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--alu-dim)]">CHA</span>
      </button>

      {/* ─── 4. MECHANICAL & VIEWPORT TOOLS ─── */}
      <div className="h-px bg-[var(--line)] my-1" />
      <div className="px-3 py-0.5 text-[9px] font-mono font-bold uppercase text-[var(--alu-dim)] tracking-wider">
        {t12(language, 'Mechanical & View', 'Mekanik & Görünüm')}
      </div>

      <button
        type="button"
        onClick={() => {
          onStartCommand('TSLOT');
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--cyan)] flex items-center justify-between text-[var(--alu)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Grid size={13} className="text-[var(--cyan)]" />
          <span>{t12(language, 'Insert T-Slot Profile', 'T-Kanal Profil Ekle')}</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--alu-dim)]">TSLOT</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onStartCommand('SURFACE');
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--std)] flex items-center justify-between text-[var(--alu)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Wrench size={13} className="text-[var(--std)]" />
          <span>{t12(language, 'Surface Finish (ISO 1302)', 'Yüzey İşleme (ISO 1302)')}</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--alu-dim)]">SURF</span>
      </button>

      {onOpenSectionAnalysis && (
        <button
          type="button"
          onClick={() => {
            onOpenSectionAnalysis();
            onClose();
          }}
          className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-[var(--ok)] flex items-center justify-between text-[var(--alu)] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Scale size={13} className="text-[var(--ok)]" />
            <span>{t12(language, 'Section Moment Ix, Iy', 'Kesit Atalet Momenti')}</span>
          </span>
          <span className="text-[10px] font-mono text-[var(--alu-dim)]">SEC</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          onZoomExtents();
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-2)] hover:text-white flex items-center justify-between text-[var(--alu-dim)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Maximize2 size={13} />
          <span>{t12(language, 'Zoom Extents', 'Tümünü Gör (Zoom Extents)')}</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--alu-dim)]">Z+E</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onOpenExportModal();
          onClose();
        }}
        className="w-full px-3 py-2 text-left bg-[var(--cyan)]/10 hover:bg-[var(--cyan)]/20 text-[var(--cyan)] flex items-center justify-between font-medium transition-colors border-t border-[var(--line)]"
      >
        <span className="flex items-center gap-2">
          <Download size={13} />
          <span>{t12(language, 'Export Center (DXF/SVG/PDF)', 'Dışa Aktarma Merkezi')}</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--cyan)]/70">Ctrl+E</span>
      </button>
    </div>
  );
}

export default CadContextMenu;
