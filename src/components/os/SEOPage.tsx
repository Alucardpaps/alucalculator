'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { InteractiveFormula } from './InteractiveFormula';
import { ClusterNav } from '@/components/seo/ClusterNav';
import { History } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { getSeoPage } from '@/locales/seoPageTranslations';

export interface SEOCalculatorData {
  id: string;
  category?: 'mechanical' | 'structural' | 'fluid' | 'electrical' | 'manufacturing' | 'science' | 'civil' | 'software';
  title: string;
  slug: string;
  keyword?: string;
  intent?: string;
  meta: {
    title: string;
    description: string;
  };
  seo: {
    h1: string;
    intro: string;
    formula: string;
    variables: Record<string, string>;
    practical: string;
    example?: string;
    step_by_step?: string;
    technical_data?: { name: string; rows: Record<string, string | number>[] }[];
    checklist?: string[];
    pitfalls?: string[];
    faq?: { q: string; a: string }[];
  };
  technicalSections?: {
    title: string;
    content: string[];
    table?: { headers: string[]; rows: string[][] };
    formulas?: { label: string; latex: string }[];
  }[];
  cta: {
    label: string;
    link: string;
  };
  relatedCalculators?: { title: string; slug: string }[];
  relatedAcademyGuides?: { title: string; slug: string }[];
}

const CalculationHistoryCard = ({ id }: { id: string }) => {
  const { language } = useI18nStore();
  const t = getSeoPage(language);
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = useCallback(() => {
    try {
      const historyKey = `calc_history_${id || 'default'}`;
      const existingRaw = localStorage.getItem(historyKey);
      setHistory(existingRaw ? JSON.parse(existingRaw) : []);
    } catch(e) {}
  }, [id]);

  useEffect(() => {
    loadHistory();
    window.addEventListener('calc-history-updated', loadHistory);
    return () => window.removeEventListener('calc-history-updated', loadHistory);
  }, [loadHistory]);

  const handleRestore = (item: any) => {
    Object.entries(item.inputs).forEach(([k, v]) => {
      window.dispatchEvent(new CustomEvent('set-calculator-input', {
        detail: { name: k, value: v }
      }));
    });
  };

  if (history.length === 0) return null;

  return (
    <div className="p-4 border border-[var(--line)] rounded-[var(--radius-m)] bg-[var(--bg-1)] space-y-3">
      <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2">
        <History size={14} className="text-[var(--cyan)]" />
        <h4 className="text-[10px] font-mono text-[var(--alu-dim)] uppercase tracking-wider font-bold">{t.calculationHistory}</h4>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
        {history.map((item, index) => (
          <button
            key={index}
            onClick={() => handleRestore(item)}
            className="w-full text-left p-2 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] hover:border-[var(--cyan)]/40 transition-colors font-mono text-[10px] text-[var(--alu)] space-y-0.5 block cursor-pointer"
          >
            <div className="flex justify-between items-center text-[8px] text-[var(--alu-dim)]">
              <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
              <span className="text-[var(--cyan)]">{t.load} ↩</span>
            </div>
            <div className="truncate">
              {Object.entries(item.inputs).map(([k, v]) => `${k}=${v}`).join(', ')}
            </div>
            <div className="text-[10px] font-bold text-[var(--ink)]">
              {t.result}: {typeof item.result === 'number' ? item.result.toFixed(4) : String(item.result)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

interface SEOPageProps {
  data: SEOCalculatorData;
}

export const SEOPage: React.FC<SEOPageProps> = ({ data }) => {
  const { language } = useI18nStore();
  const t = getSeoPage(language);
  const steps = data.seo.step_by_step?.split('\n').filter(Boolean) || [];
  const faq = data.seo.faq || [];
  const technicalData = data.seo.technical_data || [];
  const checklist = data.seo.checklist || [];
  const pitfalls = data.seo.pitfalls || [];
  const calcName = data.seo.h1.replace(/ — .*$/, '').replace(/ & Engineering.*$/, '');

  return (
    <main className="min-h-screen bg-transparent text-[var(--alu)] selection:bg-[var(--cyan-glow)] relative overflow-x-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-12 safe-bottom">
        {/* Breadcrumbs */}
        <nav className="flex flex-wrap mb-6 text-[10px] font-mono uppercase tracking-wider text-[var(--alu-dim)]" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--cyan)] transition-colors">AluCalc</Link>
          <span className="mx-2 text-[var(--line)]">/</span>
          <Link href="/academy?tab=calculators" className="hover:text-[var(--cyan)] transition-colors">{t.calculators}</Link>
          <span className="mx-2 text-[var(--line)]">/</span>
          <span className="text-[var(--ink)] font-bold">{data.id}</span>
        </nav>

        {/* Header */}
        <header className="mb-10 space-y-3 font-mono">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-4 bg-[var(--cyan)] rounded-[1px]"></span>
            <span className="text-[10px] font-mono tracking-wider text-[var(--cyan)] uppercase font-bold">{t.engineeringWorkspace}</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-[var(--ink)] uppercase max-w-4xl leading-tight">
            {data.seo.h1}
          </h1>
          <p className="text-xs md:text-sm text-[var(--alu-dim)] font-sans leading-relaxed max-w-3xl pt-1">
            {data.seo.intro}
          </p>
        </header>

        {/* 12-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Calculation & Content Area */}
          <div className="lg:col-span-8 space-y-8">

            {/* Formula Information Panel */}
            <section className="bg-[var(--bg-1)] border border-[var(--line)] p-5 rounded-[var(--radius-m)] relative overflow-hidden" aria-labelledby="formula-heading">
              <h2 id="formula-heading" className="text-[10px] font-mono uppercase tracking-wider text-[var(--cyan)] mb-3 flex items-center font-bold">
                <span className="inline-block w-3 h-[2px] bg-[var(--cyan)] mr-2" />
                {t.mathematicalDefinition}
              </h2>
              <div className="font-mono text-lg md:text-xl text-[var(--ink)] mb-4 tracking-tight bg-[var(--bg-0)] p-3 rounded-[var(--radius-s)] border border-[var(--line)]">{data.seo.formula}</div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {Object.entries(data.seo.variables).map(([key, desc]) => (
                  <div key={key} className="flex items-center gap-2 border border-[var(--line)] bg-[var(--bg-2)] p-2 rounded-[var(--radius-s)]">
                    <span className="font-bold text-[var(--cyan)] bg-[var(--cyan)]/10 px-1.5 py-0.5 rounded-[var(--radius-s)] text-[11px]">{key}</span>
                    <span className="text-[var(--alu-dim)]">=</span>
                    <span className="text-[var(--alu)] truncate">{desc}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Dynamic Formula Calculator Engine */}
            <section className="bg-[var(--bg-1)] border border-[var(--line)] p-5 md:p-6 rounded-[var(--radius-m)] relative" aria-labelledby="calc-heading">
              <h2 id="calc-heading" className="text-[10px] font-mono uppercase tracking-wider text-[var(--cyan)] mb-4 flex items-center font-bold">
                <span className="inline-block w-3 h-[2px] bg-[var(--cyan)] mr-2" />
                {t.realTimeSolver}
              </h2>
              <InteractiveFormula id={data.id} formula={data.seo.formula} variables={data.seo.variables} />
            </section>

            {/* How to Calculate (Step-by-Step) */}
            {steps.length > 0 && (
              <section aria-labelledby="steps-heading" className="space-y-4 font-mono">
                <h2 id="steps-heading" className="text-sm font-bold uppercase text-[var(--ink)] tracking-wider flex items-center gap-2">
                  <span className="h-1.5 w-3 bg-[var(--cyan)] rounded-[1px]"></span>
                  {t.calculationProcedure}
                </h2>
                <ol className="space-y-2 list-none">
                  {steps.map((step, i) => {
                    const text = step.replace(/^\d+\.\s*/, '');
                    return (
                      <li key={i} className="flex gap-3 p-3 bg-[var(--bg-1)] border border-[var(--line)] rounded-[var(--radius-s)] items-center">
                        <span className="flex-shrink-0 w-6 h-6 bg-[var(--cyan)]/10 text-[var(--cyan)] border border-[var(--cyan)]/30 rounded-[var(--radius-s)] flex items-center justify-center text-xs font-mono font-bold">{i + 1}</span>
                        <p className="text-[var(--alu)] leading-relaxed text-xs font-sans">{text}</p>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {/* Why This Matters */}
            <section aria-labelledby="practical-heading" className="space-y-3 font-mono">
              <h2 id="practical-heading" className="text-sm font-bold uppercase text-[var(--ink)] tracking-wider flex items-center gap-2">
                <span className="h-1.5 w-3 bg-[var(--cyan)] rounded-[1px]"></span>
                {t.practicalApplication}
              </h2>
              <p className="text-[var(--alu)] leading-relaxed text-xs font-sans">{data.seo.practical}</p>
            </section>

            {/* Worked Example */}
            {data.seo.example && (
              <section className="border-l-2 border-[var(--cyan)] pl-4 py-1 font-mono" aria-labelledby="example-heading">
                <h2 id="example-heading" className="text-[10px] font-mono uppercase tracking-wider text-[var(--alu-dim)] mb-1">{t.workedReferenceExample}</h2>
                <p className="text-[var(--alu)] leading-relaxed text-xs font-sans">{data.seo.example}</p>
              </section>
            )}

            {/* Technical Reference Tables */}
            {technicalData.length > 0 && technicalData.map((table, idx) => {
              const isKTable = table.name.toLowerCase().includes('nut factor') || table.name.toLowerCase().includes('k-factor') || table.name.toLowerCase().includes('friction');
              return (
                <section key={idx} className="overflow-x-auto space-y-3 font-mono" aria-labelledby={`table-heading-${idx}`}>
                  <h2 id={`table-heading-${idx}`} className="text-xs font-bold text-[var(--ink)] tracking-wider uppercase">
                    {table.name}
                    {isKTable && <span className="text-[10px] text-[var(--cyan)] ml-2 lowercase font-normal">(click row to select factor)</span>}
                  </h2>
                  <div className="rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--bg-2)] text-[10px] font-mono uppercase tracking-wider text-[var(--alu-dim)] border-b border-[var(--line)]">
                        <tr>
                          {Object.keys(table.rows[0] || {}).map((h, i) => (
                            <th key={i} className="px-4 py-2.5 font-bold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--line)] font-mono">
                        {table.rows.map((row, i) => (
                          <tr 
                            key={i} 
                            onClick={() => {
                              if (isKTable && (row.K || row['K'])) {
                                window.dispatchEvent(new CustomEvent('set-calculator-input', {
                                  detail: { name: 'K', value: row.K || row['K'] }
                                }));
                              }
                            }}
                            className={`transition-colors ${isKTable ? 'cursor-pointer hover:bg-[var(--bg-3)]' : 'hover:bg-[var(--bg-2)]'}`}
                          >
                            {Object.values(row).map((cell, j) => (
                              <td key={j} className="px-4 py-2.5 text-[var(--alu)]">{String(cell)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}

            {/* Checklist & Pitfalls */}
            {(checklist.length > 0 || pitfalls.length > 0) && (
              <section className="grid md:grid-cols-2 gap-4 font-mono" aria-labelledby="checks-heading">
                {checklist.length > 0 && (
                  <div className="p-4 bg-[var(--ok)]/10 border border-[var(--ok)]/20 rounded-[var(--radius-s)] space-y-2">
                    <h3 className="text-xs font-bold text-[var(--ok)] uppercase tracking-wider">✓ {t.designChecklist}</h3>
                    <ul className="space-y-1.5">
                      {checklist.map((item, i) => (
                        <li key={i} className="text-xs text-[var(--alu)] flex items-start gap-1.5 font-sans">
                          <span className="text-[var(--ok)] font-mono">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {pitfalls.length > 0 && (
                  <div className="p-4 bg-[var(--bad)]/10 border border-[var(--bad)]/20 rounded-[var(--radius-s)] space-y-2">
                    <h3 className="text-xs font-bold text-[var(--bad)] uppercase tracking-wider">⚠️ {t.commonPitfalls}</h3>
                    <ul className="space-y-1.5">
                      {pitfalls.map((item, i) => (
                        <li key={i} className="text-xs text-[var(--alu)] flex items-start gap-1.5 font-sans">
                          <span className="text-[var(--bad)] font-mono">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* FAQ Accordions */}
            {faq.length > 0 && (
              <section aria-labelledby="faq-heading" className="space-y-3 font-mono">
                <h2 id="faq-heading" className="text-sm font-bold uppercase text-[var(--ink)] tracking-wider flex items-center gap-2">
                  <span className="h-1.5 w-3 bg-[var(--cyan)] rounded-[1px]"></span>
                  {t.faq}
                </h2>
                <div className="space-y-2">
                  {faq.map((item, i) => (
                    <details key={i} className="p-3.5 bg-[var(--bg-1)] border border-[var(--line)] rounded-[var(--radius-s)] group transition-all">
                      <summary className="text-[var(--ink)] font-bold cursor-pointer list-none flex items-center justify-between text-xs select-none">
                        {item.q}
                        <span className="text-[var(--alu-dim)] group-open:rotate-45 transition-transform text-sm">+</span>
                      </summary>
                      <p className="text-[var(--alu)] mt-2 leading-relaxed text-xs font-sans">{item.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* Legacy Technical Sections */}
            {data.technicalSections?.map((section, idx) => (
              <section key={idx} className="space-y-4 pt-6 border-t border-[var(--line)] font-mono">
                <h2 className="text-sm font-bold uppercase text-[var(--ink)] tracking-wider flex items-center gap-2">
                  <span className="text-[var(--cyan)] text-xs font-mono">0{idx + 1}</span>
                  {section.title}
                </h2>
                <div className="space-y-2">
                  {section.content.map((para, pIdx) => (
                    <p key={pIdx} className="text-[var(--alu)] leading-relaxed text-xs font-sans">{para}</p>
                  ))}
                </div>
                {section.table && (
                  <div className="overflow-x-auto rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--bg-2)] text-[10px] font-mono uppercase tracking-wider text-[var(--alu-dim)] border-b border-[var(--line)]">
                        <tr>{section.table.headers.map((h, i) => <th key={i} className="px-4 py-2">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--line)] font-mono">
                        {section.table.rows.map((row, i) => (
                          <tr key={i} className="hover:bg-[var(--bg-2)] transition-colors">
                            {row.map((cell, j) => <td key={j} className="px-4 py-2 text-[var(--alu)]">{cell}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Sidebar Area */}
          <aside className="lg:col-span-4 space-y-4 font-mono">
            <div className="sticky top-16 space-y-4">
              
              {/* App Suite Card */}
              <div className="bg-[var(--bg-1)] border border-[var(--line)] p-5 rounded-[var(--radius-m)] space-y-4">
                <h3 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider">{t.engineeringSuite}</h3>
                <p className="text-[11px] text-[var(--alu-dim)] font-sans leading-relaxed">
                  Access advanced 3D visual CAD modelling, live material databases, and professional datasheet generations inside AluCalc OS.
                </p>
                <Link href={data.cta.link || '/workspace'}
                      className="block w-full bg-[var(--cyan)] hover:bg-[var(--cyan-dim)] text-[var(--bg-0)] hover:text-white font-bold py-2.5 px-3 rounded-[var(--radius-s)] text-xs text-center uppercase tracking-wider transition-colors">
                  {data.cta.label || 'Open Workspace'}
                </Link>
              </div>

              {/* Quick Actions Card */}
              <div className="p-4 border border-[var(--line)] rounded-[var(--radius-m)] bg-[var(--bg-1)] space-y-3">
                <h4 className="text-[10px] font-mono text-[var(--alu-dim)] uppercase tracking-wider font-bold">{t.workspaceShortcuts}</h4>
                <ul className="text-[11px] space-y-2 text-[var(--alu)] font-mono">
                  <li>
                    <button className="flex items-center hover:text-[var(--cyan)] group w-full text-left" onClick={() => window.print()}>
                      <span className="w-1.5 h-1.5 bg-[var(--cyan)] rounded-[1px] mr-2" />
                      Print / Save PDF Specification
                    </button>
                  </li>
                  <li>
                    <Link href={data.cta.link || '/workspace'} className="flex items-center hover:text-[var(--cyan)] group">
                      <span className="w-1.5 h-1.5 bg-[var(--std)] rounded-[1px] mr-2" />
                      Load inside workspace
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Calculation History */}
              <CalculationHistoryCard id={data.id} />
            </div>
          </aside>
        </div>

        {/* Related Calculators */}
        {data.relatedCalculators && data.relatedCalculators.length > 0 && (
          <section className="mt-16 pt-8 border-t border-[var(--line)] font-mono" aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-[10px] font-mono uppercase tracking-wider text-[var(--cyan)] mb-4 flex items-center font-bold">
              <span className="inline-block w-3 h-[2px] bg-[var(--cyan)] mr-2" />
              {t.relatedCalculators}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {data.relatedCalculators.map((related) => (
                <Link
                  key={related.slug}
                  href={`/calculators/${related.slug}`}
                  className="group block p-3.5 bg-[var(--bg-1)] border border-[var(--line)] hover:border-[var(--cyan)] rounded-[var(--radius-s)] transition-colors hover:bg-[var(--bg-2)]"
                >
                  <h3 className="text-[var(--ink)] font-bold group-hover:text-[var(--cyan)] transition-colors mb-1 text-xs truncate uppercase">{related.title}</h3>
                  <div className="flex items-center text-[9px] font-mono text-[var(--alu-dim)] uppercase tracking-wider">
                    {t.analyzeNow} <span className="ml-1.5 group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Academy Guides */}
        {data.relatedAcademyGuides && data.relatedAcademyGuides.length > 0 && (
          <section className="mt-12 pt-12 border-t border-white/5" aria-labelledby="academy-heading">
            <h2 id="academy-heading" className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 mb-10 flex items-center">
              <span className="inline-block w-4 h-[1px] bg-emerald-400 mr-3" />
              {t.relatedAcademyGuides}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.relatedAcademyGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/academy/${guide.slug}`}
                  className="group block p-5 bg-emerald-950/10 border border-white/5 hover:border-emerald-500/40 rounded-xl transition-all hover:bg-emerald-600/5"
                >
                  <h3 className="text-white font-medium group-hover:text-emerald-400 transition-colors mb-2 leading-snug text-xs truncate">{guide.title}</h3>
                  <div className="flex items-center text-[9px] font-mono text-white/30 uppercase tracking-wider">
                    {t.readTheory} <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Semantic Pillar-Spoke Cluster Navigation */}
        <ClusterNav category={data.category as any} currentSlug={data.slug} />

        {/* JSON-LD Schemas */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": data.seo.h1,
              "applicationCategory": "EngineeringApplication",
              "operatingSystem": "Web",
              "description": data.meta.description,
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "AluCalc OS", "item": "https://www.alucalculator.com" },
                { "@type": "ListItem", "position": 2, "name": "Calculators", "item": "https://www.alucalculator.com/academy?tab=calculators" },
                { "@type": "ListItem", "position": 3, "name": calcName, "item": `https://www.alucalculator.com/calculators/${data.slug}` },
              ],
            }),
          }}
        />

        {faq.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": faq.map((item) => ({
                  "@type": "Question",
                  "name": item.q,
                  "acceptedAnswer": { "@type": "Answer", "text": item.a },
                })),
              }),
            }}
          />
        )}

        {steps.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "HowTo",
                "name": `How to Calculate ${calcName}`,
                "step": steps.map((step, i) => ({
                  "@type": "HowToStep",
                  "position": i + 1,
                  "text": step.replace(/^\d+\.\s*/, ''),
                })),
              }),
            }}
          />
        )}

        {/* Footer */}
        <footer className="mt-32 pt-16 border-t border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-white/20 gap-8">
            <p>© 2026 <Link href="/" className="hover:text-white transition-colors">AluCalc OS</Link> — {t.footerTagline}</p>
            <div className="flex gap-8">
              <Link href="/" className="hover:text-white transition-colors">{t.home}</Link>
              <Link href="/academy?tab=calculators" className="hover:text-white transition-colors">{t.allCalculators}</Link>
              <Link href="/academy" className="hover:text-white transition-colors">{t.academy}</Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
};
