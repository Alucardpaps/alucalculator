'use client';

import Link from 'next/link';
import { Hexagon } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { getHomeFooterStrings } from '@/locales/homeFooterTranslations';

export function HomeFooterSection() {
  const { language } = useI18nStore();
  const f = getHomeFooterStrings(language);

  return (
    <>
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8">
        <section className="pb-24 max-w-4xl" aria-labelledby="what-heading">
          <h2 id="what-heading" className="text-2xl font-bold text-white mb-6">{f.whatTitle}</h2>
          <div className="text-sm text-slate-400 leading-relaxed space-y-4">
            {f.whatParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        <section className="pb-32 max-w-4xl" aria-labelledby="how-heading">
          <h2 id="how-heading" className="text-2xl font-bold text-white mb-6">{f.howTitle}</h2>
          <div className="text-sm text-slate-400 leading-relaxed space-y-4">
            {f.howParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      </div>

      <footer className="border-t border-white/5 py-16 px-6 md:px-8 bg-[#010204]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
            {f.footerColumns.map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-xs text-slate-600 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/5">
            <div className="flex items-center gap-4 opacity-60">
              <Hexagon size={22} className="text-white" />
              <span className="text-xs font-black tracking-[0.4em] text-white uppercase">AluCalc OS</span>
            </div>
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{f.copyright}</p>
          </div>
        </div>
      </footer>
    </>
  );
}
