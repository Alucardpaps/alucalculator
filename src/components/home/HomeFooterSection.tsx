'use client';

import React from 'react';
import Link from 'next/link';
import { Terminal } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { getHomeFooterStrings } from '@/locales/homeFooterTranslations';
import { APP_VERSION, APP_APK_VERSION } from '@/config/app';
import { solverCount } from '@/lib/registry/calculatorRegistry';
import { AluCalcLogo } from '@/components/ui/AluCalcLogo';

export function HomeFooterSection() {
  const { language } = useI18nStore();
  const f = getHomeFooterStrings(language);

  return (
    <footer className="border-t border-[var(--line)] py-12 px-4 sm:px-6 lg:px-8 bg-[var(--bg-0)]">
      <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
          {f.footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-mono font-bold text-[var(--ink)] uppercase tracking-wider mb-3 pb-1.5 border-b border-[var(--line)]">
                {col.title}
              </h4>
              <ul className="space-y-1.5">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-xs font-mono text-[var(--alu)] hover:text-[var(--cyan)] transition-colors block py-0.5"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-[var(--line)]">
          <div className="flex items-center gap-3">
            <AluCalcLogo size={20} />
            <span className="text-xs font-mono font-bold tracking-widest text-[var(--ink)] uppercase">
              AluCAD OS — Industrial Engineering Workbench
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--ok)]/10 border border-[var(--ok)]/30 text-[10px] font-mono font-bold text-[var(--ok)]">
              <Terminal size={10} />
              {solverCount} SOLVERS ONLINE
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-[var(--alu-dim)]">
            <Link
              href="/about"
              className="font-bold text-[var(--alu)] hover:text-[var(--cyan)] uppercase tracking-wider transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="font-bold text-[var(--alu)] hover:text-[var(--cyan)] uppercase tracking-wider transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/license"
              className="font-bold text-[var(--alu)] hover:text-[var(--cyan)] uppercase tracking-wider transition-colors"
            >
              License
            </Link>
            <Link
              href="/privacy"
              className="font-bold text-[var(--alu)] hover:text-[var(--cyan)] uppercase tracking-wider transition-colors"
            >
              Privacy & KVKK
            </Link>
            <a
              href="mailto:contact@alucalculator.com"
              className="text-[var(--alu-dim)] hover:text-[var(--cyan)] transition-colors"
              title="Machine-readable contact email"
            >
              ✉ contact@alucalculator.com
            </a>
            <a
              href="tel:+905324910000"
              className="text-[var(--alu-dim)] hover:text-[var(--cyan)] transition-colors"
              title="Machine-readable contact telephone"
            >
              ☎ +90 (532) 491-0000
            </a>
            <span className="text-[var(--alu-dim)]">{f.copyright}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default HomeFooterSection;
