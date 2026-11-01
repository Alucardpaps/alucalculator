'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { NavigationHeader } from '@/components/os/NavigationHeader';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { useI18nStore, Language } from '@/store/i18nStore';

/** Routes where top navigation header is hidden to maximize viewport */
const TOP_HEADER_EXCLUDED = ['/dashboard', '/engineering-test', '/admin'];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const isAdminPage = pathname.startsWith('/admin');
  const isHomePage = pathname === '/';
  const { setLanguage } = useI18nStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const lang = params.get('lang') as Language | null;
      const validLangs: Language[] = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];
      if (lang && validLangs.includes(lang)) {
        setLanguage(lang);
      }
    } catch {}
  }, [pathname, setLanguage]);

  const showTopHeader = !isAdminPage && !TOP_HEADER_EXCLUDED.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  const isWidgetPage = pathname.startsWith('/field/widget') || pathname.startsWith('/widget');

  if (isWidgetPage) {
    return (
      <div className="min-h-screen w-full bg-[var(--bg-0)] text-[var(--ink)] overflow-y-auto flex flex-col items-center justify-start p-2 sm:p-4">
        {children}
      </div>
    );
  }

  if (isAdminPage) {
    return (
      <div className="h-screen w-screen flex flex-col bg-[var(--bg-0)] text-[var(--ink)] overflow-hidden">
        {children}
      </div>
    );
  }

  const isStudioRoute = [
    '/cad-editor',
    '/design-studio',
    '/flow',
    '/fea',
    '/sketch-pad',
    '/nesting-2d',
    '/flow-world',
    '/split-cad',
    '/parametric-cad',
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  return (
    <div className="h-screen w-screen flex flex-col bg-[var(--bg-0)] text-[var(--ink)] overflow-hidden">
      {showTopHeader && (
        <div className="flex-none z-50">
          <NavigationHeader />
        </div>
      )}
      
      <div className="relative z-10 flex-1 flex flex-row min-w-0 min-h-0 overflow-hidden">
        {/* Desktop Sidebar is shown on inner tool/workbench routes, but excluded on Home and full-screen CAD/3D/Flow Studio routes */}
        {!isHomePage && !isStudioRoute && <DesktopSidebar />}
        
        {/* Main Content Viewport with independent scroll */}
        <main
          className={`flex-1 min-w-0 min-h-0 flex flex-col ${
            isStudioRoute
              ? 'overflow-hidden p-0 h-full w-full'
              : 'overflow-y-auto custom-scrollbar pb-20 sm:pb-0'
          }`}
        >
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}

export default SiteChrome;
