import React from 'react';
import Link from 'next/link';
import { Compass, Calculator, Box, Home } from 'lucide-react';

export const metadata = {
  title: '404 - Page Not Found',
  description: 'The requested engineering solver or resource could not be found.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-0)] text-[var(--ink)] p-4 select-none">
      <div className="w-full max-w-md p-6 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] shadow-2xl flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-[var(--radius-s)] border border-[var(--warn)]/40 bg-[var(--warn)]/10 text-[var(--warn)] flex items-center justify-center mb-4">
          <Compass className="w-6 h-6 animate-pulse" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[10px] font-mono text-[var(--alu-dim)] uppercase tracking-wider mb-2">
          HTTP 404 · SOLVER NOT FOUND
        </div>

        <h1 className="text-xl font-bold tracking-tight font-mono text-[var(--ink)] mb-2">
          Page Coordinate Missing
        </h1>
        <p className="text-xs text-[var(--alu-dim)] leading-relaxed mb-6">
          The requested engineering module, standard table, or technical guide has moved or does not exist at this address.
        </p>

        <div className="w-full grid grid-cols-2 gap-2 mb-6 text-xs font-mono">
          <Link
            href="/calculators/"
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] hover:border-[var(--cyan)] hover:text-[var(--cyan)] transition-colors"
          >
            <Calculator className="w-3.5 h-3.5 text-[var(--cyan)]" />
            <span>All Solvers</span>
          </Link>
          <Link
            href="/design-studio/"
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] hover:border-[var(--std)] hover:text-[var(--ink)] transition-colors"
          >
            <Box className="w-3.5 h-3.5 text-[var(--std)]" />
            <span>3D Studio</span>
          </Link>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-s)] bg-[var(--cyan)] text-black font-mono font-bold text-xs hover:bg-[var(--cyan-glow)] transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Return to Workstation</span>
        </Link>
      </div>
    </div>
  );
}
