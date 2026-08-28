'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { NavigationHeader } from '@/components/os/NavigationHeader';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';

/** Routes where top navigation header is hidden to maximize viewport */
const TOP_HEADER_EXCLUDED = ['/dashboard', '/engineering-test'];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const showTopHeader = !TOP_HEADER_EXCLUDED.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return (
    <div className="min-h-screen flex flex-col pb-20 lg:pb-0 bg-[var(--bg-0)] text-[var(--ink)]">
      {showTopHeader && <NavigationHeader />}
      
      <div className="relative z-10 flex-1 flex flex-row min-w-0">
        {/* Omnipresent Desktop PC Sidebar with independent sticky viewport lock */}
        <DesktopSidebar topOffsetClass={showTopHeader ? 'top-[52px] h-[calc(100vh-52px)]' : 'top-0 h-screen'} />
        
        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 flex flex-col min-h-0">
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}

export default SiteChrome;
