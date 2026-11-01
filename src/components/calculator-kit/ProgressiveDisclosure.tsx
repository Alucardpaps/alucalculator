'use client';

import React, { useState } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { ProgressiveDisclosureProps, DisclosureLevelSection } from './types';

export const ProgressiveDisclosure: React.FC<ProgressiveDisclosureProps> = ({
  sections,
  activeSections: controlledActive,
  onToggleSection,
  className = '',
}) => {
  // Default to keeping the first section open if uncontrolled
  const [internalActive, setInternalActive] = useState<string[]>(['basic']);

  const activeList = controlledActive !== undefined ? controlledActive : internalActive;

  const handleToggle = (id: string) => {
    if (onToggleSection) {
      onToggleSection(id);
    } else {
      setInternalActive((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {sections.map((section: DisclosureLevelSection) => {
        const isOpen = activeList.includes(section.id);

        return (
          <div
            key={section.id}
            className={`rounded-xl border transition-all duration-200 overflow-hidden ${
              isOpen
                ? 'border-[var(--line)] bg-[var(--bg-1)] shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
                : 'border-[var(--line)]/70 bg-[var(--bg-1)]/60 hover:border-[var(--line-strong)]'
            }`}
          >
            {/* Header Accordion Bar */}
            <div
              onClick={() => handleToggle(section.id)}
              className="flex items-center justify-between px-3.5 py-3 cursor-pointer select-none group transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Level Kicker Tag */}
                <span
                  className={`text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border transition-colors ${
                    section.id === 'basic'
                      ? 'border-[var(--cyan)]/40 bg-[var(--cyan)]/10 text-[var(--cyan)]'
                      : section.id === 'assembly'
                      ? 'border-[var(--std)]/40 bg-[var(--std)]/10 text-[var(--std)]'
                      : 'border-[var(--alu-dim)]/40 bg-[#8a96a6]/10 text-[var(--alu-dim)]'
                  }`}
                >
                  {section.kicker}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-[var(--ink)] group-hover:text-[var(--ink)] truncate">
                      {section.title}
                    </h3>

                    {/* Dirty State (Non-default parameter indicator) */}
                    {section.isDirty && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border border-[var(--warn)]/50 bg-[var(--warn)]/15 text-[var(--warn)] "
                        title="Bu kademedeki bazı parametreler standart varsayılandan farklıdır"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)] animate-pulse" />
                        <span>Özelleştirildi</span>
                      </span>
                    )}
                  </div>

                  {/* Collapsed Active Summary Chips */}
                  {!isOpen && section.activeSummary && section.activeSummary.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {section.activeSummary.map((summary, idx) => (
                        <span
                          key={idx}
                          className="font-mono text-[10px] text-[var(--alu-dim)] bg-[var(--bg-2)] px-1.5 py-0.5 rounded border border-[var(--line)]"
                        >
                          {summary}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right side controls: Reset to Default + Expand Chevron */}
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {section.isDirty && section.onResetToDefaults && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      section.onResetToDefaults?.();
                    }}
                    className="p-1 rounded text-[var(--alu-dim)] hover:text-[var(--warn)] hover:bg-[var(--bg-2)] transition-colors border border-transparent hover:border-[var(--line)]"
                    title="Standart fabrika normlarına sıfırla"
                  >
                    <RotateCcw size={12} />
                  </button>
                )}
                <div
                  className={`text-[var(--alu-dim)] group-hover:text-[var(--ink)] transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-[var(--cyan)]' : ''
                  }`}
                >
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* Expanded Content Body */}
            {isOpen && (
              <div className="border-t border-[var(--line)] p-3.5 bg-[var(--bg-0)]/40 space-y-3">
                {section.children}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
