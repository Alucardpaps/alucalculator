'use client';

/**
 * 🎮 PC-GAME STYLE INTERACTIVE GUIDED DEMO TOUR HUD
 *
 * Features:
 * - Automatic first-time visitor tour per page (`/` Home, `/design-studio` 3D CAD,
 *   `/cad-editor` 2D CAD & Dynamic Blocks, `/calculators` Solvers, `/flow`, `/materials`, etc.)
 * - Real-time DOM element spotlight cutout + pulsing tactical reticle + "ŞUNU TIKLA / ŞUNU YAP" arrow badge
 * - Non-blocking cutout (`pointer-events-none`) so users can genuinely click the highlighted UI controls
 * - Instant Skip ("Bu Sayfayı Atla [ESC]") & Permanent Opt-Out ("Turları Tamamen Kapat / İstemiyorum")
 * - Cross-page campaign progression ("Sonraki Sayfa Turuna Geç →")
 */

import React, { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Gamepad2,
  ArrowRight,
  ArrowLeft,
  X,
  SkipForward,
  EyeOff,
  CheckCircle2,
  Sparkles,
  Crosshair,
} from 'lucide-react';
import { useGameTourStore } from '@/store/useGameTourStore';
import {
  PAGE_GAME_TOURS,
  resolvePageTourForPathname,
  type PageGameTourConfig,
} from '@/data/pageGameTours';
import { AegisMascot, playMascotChirp } from '@/components/copilot/AegisMascot';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function findVisibleElement(selectorList: string): HTMLElement | null {
  if (typeof document === 'undefined' || !selectorList) return null;
  const selectors = selectorList
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const sel of selectors) {
    try {
      const nodes = document.querySelectorAll<HTMLElement>(sel);
      for (const el of Array.from(nodes)) {
        const r = el.getBoundingClientRect();
        if (r.width > 16 && r.height > 16) {
          return el;
        }
      }
    } catch {
      // Ignore invalid selector
    }
  }
  return null;
}

export function InteractiveGameTour() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { language } = useI18nStore();
  const isTr = language === 'tr';

  const {
    isOpen,
    activePageKey,
    stepIndex,
    tourXp,
    startPageTour,
    nextStep,
    prevStep,
    skipCurrentPageTour,
    disableAllAutoTours,
    checkAndTriggerFirstVisit,
  } = useGameTourStore();

  const [mounted, setMounted] = useState(false);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [xpToast, setXpToast] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Automatically trigger the page's demo tour on first visit to that page
  useEffect(() => {
    if (!mounted) return;
    if (pathname.startsWith('/widget') || pathname.startsWith('/field/widget') || pathname.startsWith('/admin')) {
      return;
    }
    // Only the homepage offers a tour automatically (once). Every other page's tour is
    // opt-in via the header "More → Page tour" entry so it never covers a tool on arrival.
    if (pathname !== '/' || window.innerWidth < 1024) return;
    const resolved = resolvePageTourForPathname(pathname);
    if (!resolved) return;

    const timer = setTimeout(() => {
      checkAndTriggerFirstVisit(resolved.pageKey);
    }, 700);
    return () => clearTimeout(timer);
  }, [mounted, pathname, checkAndTriggerFirstVisit]);

  // Listen for custom global event so any button in the app can summon the current page tour
  useEffect(() => {
    if (!mounted) return;
    const handleSummon = () => {
      const resolved = resolvePageTourForPathname(pathname) || PAGE_GAME_TOURS.home;
      startPageTour(resolved.pageKey, 0);
      playMascotChirp(880, 'ping');
    };
    window.addEventListener('alucalc:start-game-tour', handleSummon);
    return () => window.removeEventListener('alucalc:start-game-tour', handleSummon);
  }, [mounted, pathname, startPageTour]);

  const activeTour: PageGameTourConfig | null = activePageKey
    ? PAGE_GAME_TOURS[activePageKey]
    : resolvePageTourForPathname(pathname);

  const currentStep = activeTour?.steps[stepIndex] || activeTour?.steps[0] || null;

  // Measure target DOM element and keep spotlight aligned on resize/scroll
  const updateTargetMeasurement = useCallback((shouldScroll = false) => {
    if (!isOpen || !currentStep) {
      setTargetRect(null);
      return;
    }
    const el = findVisibleElement(currentStep.selector);
    if (!el) {
      setTargetRect(null);
      return;
    }
    if (shouldScroll) {
      try {
        const initialRect = el.getBoundingClientRect();
        if (initialRect.top < 50 || initialRect.bottom > window.innerHeight - 60) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch {
        // Ignore scroll errors
      }
    }
    const r = el.getBoundingClientRect();
    const pad = 6;
    setTargetRect({
      top: Math.max(4, r.top - pad),
      left: Math.max(4, r.left - pad),
      width: Math.min(window.innerWidth - 8, r.width + pad * 2),
      height: Math.min(window.innerHeight - 8, r.height + pad * 2),
    });
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (!isOpen || !currentStep) return;
    updateTargetMeasurement(true);
    const t1 = setTimeout(() => updateTargetMeasurement(false), 320);

    const onLayoutChange = () => updateTargetMeasurement(false);
    window.addEventListener('resize', onLayoutChange);
    window.addEventListener('scroll', onLayoutChange, true);
    return () => {
      clearTimeout(t1);
      window.removeEventListener('resize', onLayoutChange);
      window.removeEventListener('scroll', onLayoutChange, true);
    };
  }, [isOpen, currentStep, stepIndex, pathname, updateTargetMeasurement]);

  // Keyboard shortcuts: Escape to skip, Right Arrow / Enter to advance
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipCurrentPageTour();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, skipCurrentPageTour]);

  if (!mounted || !isOpen || !activeTour || !currentStep) return null;

  const totalSteps = activeTour.steps.length;
  const isLastStep = stepIndex + 1 >= totalSteps;

  const handleAdvanceStep = () => {
    playMascotChirp(isLastStep ? 1040 : 880, isLastStep ? 'solve' : 'ping');
    setXpToast(currentStep.xpReward);
    setTimeout(() => setXpToast(null), 900);
    nextStep();
  };

  const handleGoToNextPageTour = () => {
    const nextHref = activeTour.nextPageHref;
    playMascotChirp(1040, 'overdrive');
    nextStep();
    if (nextHref) {
      const nextResolved = resolvePageTourForPathname(nextHref);
      router.push(nextHref);
      if (nextResolved) {
        setTimeout(() => {
          startPageTour(nextResolved.pageKey, 0);
        }, 450);
      }
    }
  };

  // Decide whether to dock the Commander HUD card on bottom-right, bottom-left, or top-right so it never blocks targetRect
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 900;
  const overlapsBottomRight =
    targetRect &&
    targetRect.left + targetRect.width > winW - 460 &&
    targetRect.top + targetRect.height > winH - 340;

  const hudPositionClass = overlapsBottomRight
    ? 'bottom-4 left-4'
    : 'bottom-4 right-4';

  // Position of the floating "👇 ŞUNU TIKLA" arrow badge near the target element
  const badgeTop = targetRect
    ? targetRect.top > 56
      ? targetRect.top - 38
      : Math.min(winH - 44, targetRect.top + targetRect.height + 8)
    : 0;
  const badgeLeft = targetRect
    ? Math.max(12, Math.min(winW - 280, targetRect.left + 8))
    : 0;

  return (
    <div
      className="fixed inset-0 z-[120] pointer-events-none select-none font-mono"
      aria-live="polite"
    >
      {/* ─── 1. SVG SPOTLIGHT MASK (Non-blocking so user can click real UI underneath!) ─── */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="alucalc-game-tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="6"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(4, 7, 12, 0.62)"
          mask="url(#alucalc-game-tour-mask)"
        />
      </svg>

      {/* ─── 2. PULSING TACTICAL TARGET RETICLE & "ŞUNU TIKLA / ŞUNU YAP" CALLOUT ─── */}
      {targetRect && (
        <>
          <div
            className="fixed pointer-events-none rounded-[6px] border-2 border-[var(--cyan)] transition-all duration-300"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
              boxShadow: '0 0 0 4px rgba(0, 229, 255, 0.22), 0 0 28px rgba(0, 229, 255, 0.45)',
            }}
          >
            {/* 4 Tactical Corner Reticle Brackets */}
            <span className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[var(--warn)]" />
            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[var(--warn)]" />
            <span className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[var(--warn)]" />
            <span className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[var(--warn)]" />
          </div>

          {/* Imperative Game Action Callout Pill right on the target */}
          <div
            className="fixed pointer-events-auto z-[125] flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-s)] bg-[var(--warn)] text-[var(--bg-0)] font-extrabold text-[11px] uppercase tracking-wider shadow-2xl border border-white/30 animate-bounce cursor-pointer"
            style={{
              top: badgeTop,
              left: badgeLeft,
            }}
            onClick={handleAdvanceStep}
            title={t12(language, 'Click to complete this step', 'Adımı tamamlamak için tıklayın')}
          >
            <Crosshair size={13} />
            <span>{isTr ? currentStep.actionBadgeTr : currentStep.actionBadgeEn}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded bg-black/20 text-[9.5px]">
              +{currentStep.xpReward} XP
            </span>
          </div>
        </>
      )}

      {/* ─── 3. PC-GAME COMMANDER HUD DIALOG CARD ─── */}
      <div
        className={`fixed ${hudPositionClass} z-[130] w-[calc(100vw-2rem)] sm:w-[440px] max-w-[440px] pointer-events-auto rounded-[var(--radius-m)] bg-[var(--bg-0)] border-2 border-[var(--cyan)] shadow-2xl overflow-hidden transition-all duration-200`}
      >
        {/* Top Tactical Header Bar */}
        <div className="px-3.5 py-2 bg-[var(--bg-2)] border-b border-[var(--line-strong)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-1.5 py-0.5 rounded-[2px] bg-[var(--cyan)] text-[var(--bg-0)] text-[9.5px] font-extrabold uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Gamepad2 size={11} />
              {t12(language, 'DEMO TOUR', 'DEMO TURU')}
            </span>
            <span className="text-[10.5px] font-bold text-[var(--ink)] truncate">
              {isTr ? activeTour.questTitleTr : activeTour.questTitleEn}
            </span>
          </div>

          {/* Instant Skip Button (ESC) */}
          <button
            type="button"
            onClick={skipCurrentPageTour}
            className="px-2 py-0.5 rounded-[2px] bg-[var(--bg-0)] hover:bg-[var(--bad)]/20 border border-[var(--line)] hover:border-[var(--bad)] text-[10px] font-bold text-[var(--alu)] hover:text-[var(--bad)] flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
            title={t12(language, 'Skip Tour (ESC)', 'Turu Atla (ESC)')}
          >
            <SkipForward size={11} />
            <span>{t12(language, 'Skip (ESC)', 'Atla (ESC)')}</span>
          </button>
        </div>

        {/* Step Progress Strip */}
        <div className="w-full h-1.5 bg-[var(--bg-1)] flex">
          {activeTour.steps.map((st, idx) => (
            <div
              key={st.id}
              className={`flex-1 h-full border-r border-[var(--bg-0)] transition-colors ${
                idx <= stepIndex ? 'bg-[var(--cyan)]' : 'bg-[var(--bg-3)]'
              }`}
            />
          ))}
        </div>

        {/* Main Commander Briefing Body */}
        <div className="p-3.5 sm:p-4 space-y-3 bg-[var(--bg-1)]">
          <div className="flex items-start gap-3">
            {/* AeGiS Commander Avatar */}
            <div className="relative p-1 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line-strong)] shrink-0">
              <AegisMascot size={62} variant="compact" pose={currentStep.pose} />
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded bg-[var(--warn)] text-[var(--bg-0)] text-[8.5px] font-extrabold uppercase">
                AEGIS
              </span>
            </div>

            {/* Step Title & Action Instruction */}
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <span className="text-[var(--cyan)] font-bold uppercase">
                  {t12(
                    language,
                    `QUEST STEP ${stepIndex + 1} / ${totalSteps}`,
                    `GÖREV ADIMI ${stepIndex + 1} / ${totalSteps}`
                  )}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[var(--warn)]/15 border border-[var(--warn)]/40 text-[var(--warn)] font-bold">
                  +{currentStep.xpReward} XP · {t12(language, 'Total', 'Toplam')} {tourXp} XP
                </span>
              </div>

              <h3 className="text-xs sm:text-[13px] font-bold font-tech text-white leading-snug">
                {isTr ? currentStep.titleTr : currentStep.titleEn}
              </h3>

              <p className="text-[11px] text-[var(--ink)]/90 leading-relaxed font-sans">
                {isTr ? currentStep.instructionTr : currentStep.instructionEn}
              </p>
            </div>
          </div>

          {/* Pro-Tip Callout Box */}
          <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[10.5px] text-[var(--alu)] flex items-start gap-2">
            <Sparkles size={13} className="text-[var(--warn)] shrink-0 mt-0.5" />
            <span>{isTr ? currentStep.proTipTr : currentStep.proTipEn}</span>
          </div>

          {/* Floating XP Reward Toast */}
          {xpToast !== null && (
            <div className="px-2.5 py-1 rounded bg-[var(--ok)]/20 border border-[var(--ok)] text-[var(--ok)] text-[10.5px] font-bold flex items-center justify-center gap-1.5">
              <CheckCircle2 size={12} />
              <span>
                +{xpToast} XP {t12(language, 'Quest Step Completed!', 'Görev Adımı Tamamlandı!')}
              </span>
            </div>
          )}

          {/* Action Footer: Prev / Next / Next Page Campaign / Permanent Opt-out */}
          <div className="pt-1 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={prevStep}
                disabled={stepIndex === 0}
                className="px-2.5 py-1.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] hover:bg-[var(--bg-2)] disabled:opacity-35 border border-[var(--line)] text-[10.5px] font-bold text-[var(--alu)] hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={12} />
                <span>{t12(language, 'Back', 'Geri')}</span>
              </button>

              {!isLastStep ? (
                <button
                  type="button"
                  onClick={handleAdvanceStep}
                  className="flex-1 py-1.5 px-3 rounded-[var(--radius-s)] bg-[var(--cyan)] hover:brightness-110 text-[var(--bg-0)] font-extrabold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <span>{t12(language, 'Next Quest Step', 'Sonraki Görev Adımı')}</span>
                  <ArrowRight size={13} />
                </button>
              ) : (
                <div className="flex-1 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleAdvanceStep}
                    className="px-3 py-1.5 rounded-[var(--radius-s)] bg-[var(--ok)] hover:brightness-110 text-[var(--bg-0)] font-extrabold text-[10.5px] uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 size={12} />
                    <span>{t12(language, 'Finish', 'Bitir')}</span>
                  </button>

                  {activeTour.nextPageHref && (
                    <button
                      type="button"
                      onClick={handleGoToNextPageTour}
                      className="flex-1 py-1.5 px-2.5 rounded-[var(--radius-s)] bg-[var(--warn)] hover:brightness-110 text-[var(--bg-0)] font-extrabold text-[10.5px] uppercase flex items-center justify-center gap-1 cursor-pointer truncate"
                    >
                      <span className="truncate">
                        {isTr ? activeTour.nextPageLabelTr : activeTour.nextPageLabelEn}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Secondary Opt-Out Row ("İSTEMESE ATLAYABİLSİN") */}
            <div className="flex items-center justify-between pt-1 border-t border-[var(--line)] text-[9.5px] text-[var(--muted)]">
              <button
                type="button"
                onClick={skipCurrentPageTour}
                className="hover:text-[var(--ink)] transition-colors cursor-pointer"
              >
                {t12(language, 'Skip this page only', 'Sadece bu sayfayı atla')}
              </button>

              <button
                type="button"
                onClick={disableAllAutoTours}
                className="flex items-center gap-1 text-[var(--alu-dim)] hover:text-[var(--bad)] transition-colors cursor-pointer"
              >
                <EyeOff size={10} />
                <span>
                  {t12(
                    language,
                    "Don't auto-show tours again",
                    'Otomatik turları tamamen kapat (İstemiyorum)'
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InteractiveGameTour;
