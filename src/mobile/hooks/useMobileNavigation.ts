'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MobileTab } from '@/mobile/store/mobileStore';

const TAB_ORDER: MobileTab[] = [
  'dashboard',
  'solvers',
  'academy',
  'cad',
  'fieldTools',
  'aegis',
  'settings',
];

export function useMobileNavigation(initial: MobileTab = 'dashboard') {
  const [activeTab, setActiveTab] = useState<MobileTab>(initial);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const goToTab = useCallback((tab: MobileTab) => setActiveTab(tab), []);

  const goNext = useCallback(() => {
    const idx = TAB_ORDER.indexOf(activeTab);
    if (idx < TAB_ORDER.length - 1) setActiveTab(TAB_ORDER[idx + 1]);
  }, [activeTab]);

  const goPrev = useCallback(() => {
    const idx = TAB_ORDER.indexOf(activeTab);
    if (idx > 0) setActiveTab(TAB_ORDER[idx - 1]);
  }, [activeTab]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent, reduceMotion: boolean) => {
      if (reduceMotion || !touchStart.current) return;
      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      const dy = e.changedTouches[0].clientY - touchStart.current.y;
      touchStart.current = null;
      if (Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx)) return;
      if (dx < 0) goNext();
      else goPrev();
    },
    [goNext, goPrev],
  );

  return { activeTab, setActiveTab: goToTab, onTouchStart, onTouchEnd, TAB_ORDER };
}

export function useDeepLinks(onOpenSolver: (slug: string) => void) {
  useEffect(() => {
    const parse = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const solver = params.get('solver') ?? params.get('module');
      const hash = window.location.hash.replace('#', '');
      const target = solver || hash;
      if (target) onOpenSolver(target);
    };
    parse();
    window.addEventListener('hashchange', parse);
    return () => window.removeEventListener('hashchange', parse);
  }, [onOpenSolver]);
}
