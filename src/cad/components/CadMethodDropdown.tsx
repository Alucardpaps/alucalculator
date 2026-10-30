/**
 * 🎛️ AluCAD — Construction Method Extending Window (Uzayan Pencere)
 * 
 * Renders an AutoCAD/SolidWorks-grade vertical extending panel directly below
 * the clicked tool button via createPortal, completely eliminating overflow clipping
 * and unwanted toolbar scrolling.
 * 
 * Supports:
 *  - Circle (6 methods)
 *  - Arc (9 methods)
 *  - Rectangle (5 methods)
 *  - Polygon (3 methods)
 *  - Ellipse (3 methods)
 *  - Line & Construction (3 methods)
 *  - Dimensioning (6 methods)
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CIRCLE_METHODS,
  ARC_METHODS,
  RECTANGLE_METHODS,
  POLYGON_METHODS,
  ELLIPSE_METHODS,
  LINE_METHODS,
  DIMENSION_METHODS,
  SURFACE_METHODS,
  ConstructionMethodDef,
} from '../catalog/constructionMethods';
import { Check } from 'lucide-react';
import { t12 } from '../../locales/t12';

export type CadDropdownType =
  | 'circle'
  | 'arc'
  | 'rectangle'
  | 'polygon'
  | 'ellipse'
  | 'line'
  | 'dimension'
  | 'surface';

interface CadMethodDropdownProps {
  type: CadDropdownType;
  isOpen: boolean;
  onClose: () => void;
  activeCommand: string | null;
  onSelectMethod: (commandId: string) => void;
  language: string;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export const CadMethodDropdown: React.FC<CadMethodDropdownProps> = ({
  type,
  isOpen,
  onClose,
  activeCommand,
  onSelectMethod,
  language,
  anchorRef,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const panelWidth =
    type === 'arc' || type === 'rectangle' || type === 'dimension' || type === 'surface' ? 330 : 290;

  // Calculate position directly beneath the anchor button
  useEffect(() => {
    if (!isOpen || !anchorRef.current) return;

    const updatePos = () => {
      if (!anchorRef.current) return;
      const rect = anchorRef.current.getBoundingClientRect();

      // Align left with button, ensure doesn't overflow screen right edge
      const left = Math.max(10, Math.min(rect.left, window.innerWidth - panelWidth - 12));
      const top = rect.bottom + 6;

      setPosition({ top, left });
    };

    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [isOpen, anchorRef, type, panelWidth]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  if (!mounted || !isOpen || !position) return null;

  const methods: ConstructionMethodDef<string>[] = (
    type === 'circle' ? CIRCLE_METHODS :
    type === 'arc' ? ARC_METHODS :
    type === 'rectangle' ? RECTANGLE_METHODS :
    type === 'polygon' ? POLYGON_METHODS :
    type === 'ellipse' ? ELLIPSE_METHODS :
    type === 'line' ? LINE_METHODS :
    type === 'dimension' ? DIMENSION_METHODS :
    SURFACE_METHODS
  ) as ConstructionMethodDef<string>[];

  const headerTitle =
    type === 'circle' ? t12(language, 'CIRCLE CONSTRUCTION METHODS', 'DAİRE OLUŞTURMA YÖNTEMLERİ') :
    type === 'arc' ? t12(language, 'ARC CONSTRUCTION METHODS', 'YAY OLUŞTURMA YÖNTEMLERİ') :
    type === 'rectangle' ? t12(language, 'RECTANGLE CONSTRUCTION METHODS', 'DİKDÖRTGEN OLUŞTURMA YÖNTEMLERİ') :
    type === 'polygon' ? t12(language, 'POLYGON CONSTRUCTION METHODS', 'ÇOKGEN OLUŞTURMA YÖNTEMLERİ') :
    type === 'ellipse' ? t12(language, 'ELLIPSE CONSTRUCTION METHODS', 'ELİPS OLUŞTURMA YÖNTEMLERİ') :
    type === 'line' ? t12(language, 'LINE & CONSTRUCTION METHODS', 'ÇİZGİ VE KILAVUZ YÖNTEMLERİ') :
    type === 'dimension' ? t12(language, 'DIMENSIONING METHODS', 'ÖLÇÜLENDİRME YÖNTEMLERİ') :
    t12(language, 'ISO 1302 SURFACE TEXTURE & LEADER', 'ISO 1302 YÜZEY İŞARETİ VE LİDERİ');

  // Categories
  const categories = Array.from(
    new Set(methods.map((m) => t12(language, m.category.en, m.category.tr)))
  );

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, scaleY: 0.85, y: -6 }}
        animate={{ opacity: 1, scaleY: 1, y: 0 }}
        exit={{ opacity: 0, scaleY: 0.85, y: -6 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          width: panelWidth,
          transformOrigin: 'top left',
          zIndex: 99999,
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.92), 0 0 0 1px rgba(58, 208, 230, 0.25)',
        }}
        className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)]/98 p-1.5 select-none text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar with Accent Indicator */}
        <div className="flex items-center justify-between px-2 py-1 border-b border-[var(--line)] mb-1 bg-[var(--bg-0)]/60 rounded-t-lg">
          <span className="font-mono text-[9px] font-bold tracking-wider text-[var(--cyan)] uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] " />
            {headerTitle}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--alu-dim)] hover:text-white text-xs px-1 hover:bg-white/10 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Methods List — Natural Auto-Height (No Scrollbar, No Clipping) */}
        <div className="space-y-1">
          {categories.map((catName) => {
            const catMethods = methods.filter(
              (m) => t12(language, m.category.en, m.category.tr) === catName
            );

            return (
              <div key={catName} className="space-y-0.5">
                {/* Category Subheader */}
                <div className="px-2 pt-0.5 pb-0 text-[8.5px] font-mono font-semibold uppercase tracking-widest text-[var(--alu-dim)]/70 flex items-center gap-1.5">
                  <span>{catName}</span>
                  <div className="flex-1 h-[1px] bg-[var(--line-strong)]/60" />
                </div>

                {/* Items */}
                {catMethods.map((m) => {
                  const IconComponent = m.icon;
                  const isSelected =
                    activeCommand === m.commandId ||
                    (type === 'circle' && m.id === 'CENTER_RADIUS' && activeCommand === 'CIRCLE') ||
                    (type === 'arc' && m.id === '3P' && activeCommand === 'ARC') ||
                    (type === 'rectangle' && m.id === '2P' && activeCommand === 'RECTANGLE') ||
                    (type === 'polygon' && m.id === 'INSCRIBED' && (activeCommand === 'POLYGON' || activeCommand === 'HEXAGON')) ||
                    (type === 'ellipse' && m.id === 'CENTER' && activeCommand === 'ELLIPSE') ||
                    (type === 'line' && m.id === '2P' && activeCommand === 'LINE') ||
                    (type === 'dimension' && m.id === 'SMART' && activeCommand === 'DIMENSION') ||
                    (type === 'surface' && m.id === 'LEADER' && (activeCommand === 'SURFACE' || activeCommand === 'SURF_LEADER'));

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onSelectMethod(m.commandId);
                        onClose();
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg transition-all flex items-center gap-2.5 group border ${
                        isSelected
                          ? 'bg-[var(--bg-3)] border-[var(--cyan)]/60 '
                          : 'border-transparent hover:border-[var(--line)] hover:bg-[var(--bg-2)]'
                      }`}
                    >
                      {/* CAD Vector Icon Box */}
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-[var(--cyan)]/20 border-[var(--cyan)]/60 text-[var(--cyan)] '
                            : 'bg-[var(--bg-0)] border-[var(--line)] text-[var(--alu)] group-hover:border-[var(--cyan)]/50 group-hover:text-white'
                        }`}
                      >
                        <IconComponent size={16} />
                      </div>

                      {/* Title & Descriptive Subtitle (Alt Başlık) */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-xs font-semibold leading-tight truncate ${
                              isSelected ? 'text-[var(--cyan)]' : 'text-[var(--ink)] group-hover:text-white'
                            }`}
                          >
                            {m.getTitle(language)}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="px-1 py-0.2 rounded text-[8.5px] font-mono bg-[var(--bg-0)] border border-[var(--line)] text-[var(--alu-dim)] group-hover:text-[var(--alu)]">
                              {m.shortcut}
                            </span>
                            {isSelected && <Check size={11} className="text-[var(--cyan)]" />}
                          </div>
                        </div>

                        {/* Alt Başlık */}
                        <p className="text-[9.5px] text-[var(--alu-dim)] leading-tight truncate group-hover:text-[var(--alu)] mt-0.5">
                          {m.getDescription(language)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Surface Finish Custom Builder Modal Launcher */}
        {type === 'surface' && (
          <div className="pt-1.5 mt-1.5 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('alucad:open-surface-builder'));
                }
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg bg-[var(--cyan)]/10 hover:bg-[var(--cyan)]/20 border border-[var(--cyan)]/30 text-[var(--cyan)] transition-colors flex items-center justify-between text-xs font-mono font-bold"
            >
              <span>🛠️ {t12(language, 'Advanced Surface Builder...', 'Ayrıntılı Yüzey Oluşturucuyu Aç...')}</span>
              <span className="text-[9px] text-[var(--alu-dim)] font-normal">ISO 1302</span>
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
