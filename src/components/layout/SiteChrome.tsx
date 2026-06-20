'use client';

import { usePathname } from 'next/navigation';
import { NavigationHeader } from '@/components/os/NavigationHeader';

/** Routes that use a full-screen shell without the marketing header */
const HEADER_EXCLUDED = ['/workspace', '/dashboard', '/lite', '/engineering-test'];

function shouldShowSiteHeader(pathname: string): boolean {
  return !HEADER_EXCLUDED.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const showHeader = shouldShowSiteHeader(pathname);

  if (!showHeader) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationHeader />
      <div className="relative z-10 flex-1 flex flex-col min-h-0">{children}</div>
    </div>
  );
}
