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
    <div className="p-6 border border-white/5 rounded-2xl bg-[#0a1018]/15 space-y-4">
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <History size={14} className="text-[#00e5ff]" />
        <h4 className="text-[10px] font-mono text-white/55 uppercase tracking-widest font-bold">{t.calculationHistory}</h4>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
        {history.map((item, index) => (
          <button
            key={index}
            onClick={() => handleRestore(item)}
            className="w-full text-left p-2.5 rounded-lg bg-white/[0.02] hover:bg-[#00e5ff]/10 border border-white/5 hover:border-[#00e5ff]/30 transition-all font-mono text-[9px] text-white/60 space-y-1 block cursor-pointer"
          >
            <div className="flex justify-between items-center text-[8px] text-white/30">
              <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
              <span className="text-[#00e5ff]">{t.load} ↩</span>
            </div>
            <div className="truncate">
              {Object.entries(item.inputs).map(([k, v]) => `${k}=${v}`).join(', ')}
            </div>
            <div className="text-[10px] font-bold text-white">
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
    <main className="min-h-screen bg-transparent text-[#C5C6C7] selection:bg-[#00e5ff]/30 relative overflow-x-hidden">
      {/* Dynamic Grid Overlay */}
      <div className="fixed inset-0 z-0 opacity-5 pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(#00e5ff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-24 safe-bottom">
        {/* Breadcrumbs */}
        <nav className="flex flex-wrap mb-8 text-[10px] font-mono uppercase tracking-widest text-white/30" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#00e5ff] transition-colors">AluCalc OS</Link>
          <span className="mx-2">/</span>
          <Link href="/academy?tab=calculators" className="hover:text-[#00e5ff] transition-colors">{t.calculators}</Link>
          <span className="mx-2">/</span>
          <span className="text-white/60">{data.id}</span>
        </nav>

        {/* Header */}
        <header className="mb-16 space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-6 bg-[#00e5ff] rounded-full"></span>
            <span className="text-[10px] font-mono tracking-[0.3em] text-[#00e5ff] uppercase">{t.engineeringWorkspace}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white uppercase max-w-4xl leading-tight">
            {data.seo.h1}
          </h1>
          <p className="text-sm md:text-base text-white/50 leading-relaxed max-w-3xl pt-2">
            {data.seo.intro}
          </p>
        </header>

        {/* 12-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Calculation & Content Area */}
          <div className="lg:col-span-8 space-y-16">

            {/* Formula Information Panel */}
            <section className="bg-[#0a1018]/20 backdrop-blur-xl border border-white/5 p-6 rounded-2xl relative overflow-hidden" aria-labelledby="formula-heading">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00e5ff]/5 blur-3xl rounded-full pointer-events-none" />
              <h2 id="formula-heading" className="text-[10px] font-mono uppercase tracking-widest text-[#00e5ff] mb-4 flex items-center">
                <span className="inline-block w-4 h-[1px] bg-[#00e5ff] mr-3" />
                {t.mathematicalDefinition}
              </h2>
              <div className="font-mono text-xl md:text-2xl text-white mb-6 tracking-tight bg-black/40 p-4 rounded-xl border border-white/5">{data.seo.formula}</div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                {Object.entries(data.seo.variables).map(([key, desc]) => (
                  <div key={key} className="flex items-center gap-2 border border-white/[0.02] bg-white/[0.01] p-2.5 rounded-lg">
                    <span className="font-bold text-[#00e5ff] bg-[#00e5ff]/10 px-2 py-0.5 rounded">{key}</span>
                    <span className="text-white/40">=</span>
                    <span className="text-white/60 truncate">{desc}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Dynamic Formula Calculator Engine */}
            <section className="bg-[#0a1018]/30 border border-white/5 p-6 md:p-8 rounded-3xl backdrop-blur-xl relative" aria-labelledby="calc-heading">
              <div className="absolute top-0 left-0 w-48 h-48 bg-[#00e5ff]/5 blur-[100px] rounded-full pointer-events-none" />
              <h2 id="calc-heading" className="text-[10px] font-mono uppercase tracking-widest text-[#00e5ff] mb-6 flex items-center">
                <span className="inline-block w-4 h-[1px] bg-[#00e5ff] mr-3" />
                {t.realTimeSolver}
              </h2>
              <InteractiveFormula id={data.id} formula={data.seo.formula} variables={data.seo.variables} />
            </section>

            {/* How to Calculate (Step-by-Step) */}
            {steps.length > 0 && (
              <section aria-labelledby="steps-heading" className="space-y-6">
                <h2 id="steps-heading" className="text-xl font-black uppercase text-white tracking-widest flex items-center gap-2">
                  <span className="h-1.5 w-4 bg-[#00e5ff] rounded-full"></span>
                  {t.calculationProcedure}
                </h2>
                <ol className="space-y-3 list-none">
                  {steps.map((step, i) => {
                    const text = step.replace(/^\d+\.\s*/, '');
                    return (
                      <li key={i} className="flex gap-4 p-4 bg-[#0a1018]/15 border border-white/5 rounded-xl items-center hover:border-white/10 transition-colors">
                        <span className="flex-shrink-0 w-8 h-8 bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20 rounded-lg flex items-center justify-center text-sm font-mono font-bold">{i + 1}</span>
                        <p className="text-white/60 leading-relaxed text-sm">{text}</p>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {/* Why This Matters */}
            <section aria-labelledby="practical-heading" className="space-y-4">
              <h2 id="practical-heading" className="text-xl font-black uppercase text-white tracking-widest flex items-center gap-2">
                <span className="h-1.5 w-4 bg-[#00e5ff] rounded-full"></span>
                {t.practicalApplication}
              </h2>
              <p className="text-white/50 leading-relaxed text-base">{data.seo.practical}</p>
            </section>

            {/* Worked Example */}
            {data.seo.example && (
              <section className="border-l-2 border-[#00e5ff] pl-6 py-1" aria-labelledby="example-heading">
                <h2 id="example-heading" className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">{t.workedReferenceExample}</h2>
                <p className="text-white/50 leading-relaxed text-sm italic">{data.seo.example}</p>
              </section>
            )}

            {/* Technical Reference Tables */}
            {technicalData.length > 0 && technicalData.map((table, idx) => {
              const isKTable = table.name.toLowerCase().includes('nut factor') || table.name.toLowerCase().includes('k-factor') || table.name.toLowerCase().includes('friction');
              return (
                <section key={idx} className="overflow-x-auto space-y-4" aria-labelledby={`table-heading-${idx}`}>
                  <h2 id={`table-heading-${idx}`} className="text-md font-bold text-white tracking-wide">
                    {table.name}
                    {isKTable && <span className="text-[10px] font-mono text-[#00e5ff]/60 ml-3 lowercase font-normal">(click row to select factor)</span>}
                  </h2>
                  <div className="rounded-xl border border-white/5 bg-[#0a1018]/10">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0a1018]/30 text-[10px] font-mono uppercase tracking-wider text-white/40 border-b border-white/5">
                        <tr>
                          {Object.keys(table.rows[0] || {}).map((h, i) => (
                            <th key={i} className="px-6 py-3.5 font-bold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
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
                            className={`transition-colors ${isKTable ? 'cursor-pointer hover:bg-[#00e5ff]/10' : 'hover:bg-[#00e5ff]/5'}`}
                          >
                            {Object.values(row).map((cell, j) => (
                              <td key={j} className="px-6 py-3.5 text-white/60">{String(cell)}</td>
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
              <section className="grid md:grid-cols-2 gap-6" aria-labelledby="checks-heading">
                {checklist.length > 0 && (
                  <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">✓ {t.designChecklist}</h3>
                    <ul className="space-y-2">
                      {checklist.map((item, i) => (
                        <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {pitfalls.length > 0 && (
                  <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-3">
                    <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest font-mono">⚠️ {t.commonPitfalls}</h3>
                    <ul className="space-y-2">
                      {pitfalls.map((item, i) => (
                        <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* FAQ Accordions */}
            {faq.length > 0 && (
              <section aria-labelledby="faq-heading" className="space-y-6">
                <h2 id="faq-heading" className="text-xl font-black uppercase text-white tracking-widest flex items-center gap-2">
                  <span className="h-1.5 w-4 bg-[#00e5ff] rounded-full"></span>
                  {t.faq}
                </h2>
                <div className="space-y-3">
                  {faq.map((item, i) => (
                    <details key={i} className="p-5 bg-[#0a1018]/15 border border-white/5 rounded-2xl group transition-all">
                      <summary className="text-white font-medium cursor-pointer list-none flex items-center justify-between text-sm select-none">
                        {item.q}
                        <span className="text-white/40 group-open:rotate-45 transition-transform text-lg">+</span>
                      </summary>
                      <p className="text-white/50 mt-3 leading-relaxed text-xs font-sans">{item.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* Legacy Technical Sections */}
            {data.technicalSections?.map((section, idx) => (
              <section key={idx} className="space-y-6 pt-8 border-t border-white/5">
                <h2 className="text-xl font-black uppercase text-white tracking-widest flex items-center gap-4">
                  <span className="text-[#00e5ff] text-xs font-mono">0{idx + 1}</span>
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.content.map((para, pIdx) => (
                    <p key={pIdx} className="text-white/50 leading-relaxed text-sm">{para}</p>
                  ))}
                </div>
                {section.table && (
                  <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0a1018]/10">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0a1018]/30 text-[10px] font-mono uppercase tracking-wider text-white/40 border-b border-white/5">
                        <tr>{section.table.headers.map((h, i) => <th key={i} className="px-6 py-3">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {section.table.rows.map((row, i) => (
                          <tr key={i} className="hover:bg-[#00e5ff]/5 transition-colors">
                            {row.map((cell, j) => <td key={j} className="px-6 py-3 text-white/60">{cell}</td>)}
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
          <aside className="lg:col-span-4 space-y-6">
            <div className="sticky top-8 space-y-6">
              
              {/* App Suite Card */}
              <div className="bg-[#0a1018]/30 backdrop-blur-xl border border-white/5 p-6 md:p-8 rounded-2xl relative overflow-hidden space-y-6">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#00e5ff]/5 blur-2xl rounded-full pointer-events-none" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">{t.engineeringSuite}</h3>
                <p className="text-xs text-white/40 leading-relaxed">
                  Access advanced 3D visual CAD modelling, live material databases, and professional datasheet generations inside AluCalc OS.
                </p>
                <Link href={data.cta.link || '/workspace'}
                      className="block w-full bg-[#00e5ff] hover:bg-[#00e5ff]/80 text-black font-extrabold py-3.5 px-4 rounded-xl text-xs text-center transition-all shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:scale-105 active:scale-95">
                  {data.cta.label || 'Open Workspace'}
                </Link>
              </div>

              {/* Quick Actions Card */}
              <div className="p-6 border border-white/5 rounded-2xl bg-[#0a1018]/15 space-y-4">
                <h4 className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{t.workspaceShortcuts}</h4>
                <ul className="text-[10px] space-y-3 text-white/60 font-mono">
                  <li>
                    <button className="flex items-center hover:text-[#00e5ff] group w-full text-left" onClick={() => window.print()}>
                      <span className="w-1.5 h-1.5 bg-[#00e5ff] rounded-full mr-2.5 group-hover:scale-150 transition-transform" />
                      Print / Save PDF Specification
                    </button>
                  </li>
                  <li>
                    <Link href={data.cta.link || '/workspace'} className="flex items-center hover:text-purple-400 group">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2.5 group-hover:scale-150 transition-transform" />
                      Load inside desktop environment
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Calculation History */}
              <CalculationHistoryCard id={data.id} />
            </div>
            
            {/* PDF Print Override Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body, main, #__next {
                  background: #ffffff !important;
                  color: #000000 !important;
                }
                nav, aside, footer, button, .pointer-events-none, input[type="range"], .h-0.5, .bg-white\\/[0.02], select, .bg-\\[\\#0a1018\\]\\/20 {
                  display: none !important;
                }
                section {
                  background: transparent !important;
                  border: 1px solid #e2e8f0 !important;
                  color: #000000 !important;
                  page-break-inside: avoid;
                  margin-bottom: 1.5rem !important;
                  border-radius: 8px !important;
                  padding: 15px !important;
                }
                h1, h2, h3, h4, text, span, p, td, th {
                  color: #000000 !important;
                }
                input[type="number"], input {
                  border: none !important;
                  background: transparent !important;
                  color: #000000 !important;
                  font-weight: bold;
                  text-align: left !important;
                }
              }
            `}} />
          </aside>
        </div>

        {/* Related Calculators */}
        {data.relatedCalculators && data.relatedCalculators.length > 0 && (
          <section className="mt-24 pt-16 border-t border-white/5" aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-[10px] font-mono uppercase tracking-widest text-[#00e5ff] mb-10 flex items-center">
              <span className="inline-block w-4 h-[1px] bg-[#00e5ff] mr-3" />
              {t.relatedCalculators}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {data.relatedCalculators.map((related) => (
                <Link
                  key={related.slug}
                  href={`/calculators/${related.slug}`}
                  className="group block p-5 bg-[#0a1018]/10 border border-white/5 hover:border-[#00e5ff]/40 rounded-xl transition-all hover:bg-[#00e5ff]/5"
                >
                  <h3 className="text-white font-medium group-hover:text-[#00e5ff] transition-colors mb-2 text-xs truncate">{related.title}</h3>
                  <div className="flex items-center text-[9px] font-mono text-white/30 uppercase tracking-wider">
                    {t.analyzeNow} <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
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
