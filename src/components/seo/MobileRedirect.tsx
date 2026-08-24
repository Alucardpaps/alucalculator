'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function MobileRedirect({
  target = '/workspace',
  query = {},
  breakpoint = 768,
}: {
  target?: string;
  query?: Record<string, string>;
  breakpoint?: number;
}) {
  const router = useRouter();
  const qs = new URLSearchParams(query).toString();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < breakpoint) {
      router.replace(qs ? `${target}?${qs}` : target);
    }
  }, [router, target, breakpoint, qs]);
  return null;
}
