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
    <div className="min-h-screen flex flex-col pb-20 lg:pb-0 bg-[#020408] text-slate-200">
      {showTopHeader && <NavigationHeader />}
      
      <div className="relative z-10 flex-1 flex flex-row min-h-0 overflow-hidden">
        {/* Omnipresent Desktop PC Sidebar */}
        <DesktopSidebar />
        
        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}

export default SiteChrome;
