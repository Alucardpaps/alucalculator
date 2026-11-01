'use client';

import { useEffect } from 'react';

/** Dedicated /mobile workstation is retired. Responsive site is the mobile UI. */
export default function MobileRetired() {
  useEffect(() => {
    window.location.replace('/');
  }, []);
  return (
    <p className="p-6 font-mono text-sm text-[var(--alu-dim)]">
      Redirecting to AluCalc…
    </p>
  );
}
