'use client';

import React from 'react';
import Link from 'next/link';
import { InteractiveFormula } from './InteractiveFormula';

export interface SEOCalculatorData {
  id: string;
  category?: 'mechanical' | 'structural' | 'fluid' | 'electrical' | 'manufacturing' | 'science' | 'civil' | 'software';
  title: string;
  slug: string;
  keyword?: string;
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

interface SEOPageProps {
  data: SEOCalculatorData;
}

/**
 * SEOPage - Production-grade, SEO-optimized engineering calculator landing page.
 * Includes structured data (FAQ, HowTo, Breadcrumb), rich content sections,
 * and 30+ internal links for maximum search engine visibility.
 */
export const SEOPage: React.FC<SEOPageProps> = ({ data }) => {
  const steps = data.seo.step_by_step?.split('\n').filter(Boolean) || [];
  const faq = data.seo.faq || [];
  const technicalData = data.seo.technical_data || [];
  const checklist = data.seo.checklist || [];
  const pitfalls = data.seo.pitfalls || [];
  const calcName = data.seo.h1.replace(/ — .*$/, '').replace(/ & Engineering.*$/, '');

  return (
    <main className="min-h-screen bg-[#0a0e14] text-slate-300 selection:bg-blue-500/30">
      {/* Engineering Grid Background */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-24">
        {/* Breadcrumbs */}
        <nav className="flex flex-wrap mb-8 text-xs font-mono uppercase tracking-widest text-slate-500" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-blue-400 transition-colors">AluCalc OS</Link>
          <span className="mx-2">/</span>
          <Link href="/calculators" className="hover:text-blue-400 transition-colors">Calculators</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-400">{data.id}</span>
        </nav>

        {/* Header */}
        <header className="mb-16">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
            {data.seo.h1}
          </h1>
          <div className="h-1 w-20 bg-blue-600 mb-8" />
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-3xl">
            {data.seo.intro}
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-16">

            {/* Formula Summary Box */}
            <section className="bg-[#050914] border border-blue-500/20 p-6 rounded-xl" aria-labelledby="formula-heading">
              <h2 id="formula-heading" className="text-sm font-mono uppercase tracking-widest text-blue-400 mb-4 flex items-center">
                <span className="inline-block w-4 h-[1px] bg-blue-400 mr-3" />
                Formula
              </h2>
              <div className="font-mono text-xl md:text-2xl text-blue-300 mb-4">{data.seo.formula}</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(data.seo.variables).map(([key, desc]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-blue-400 font-bold">{key}</span>
                    <span className="text-slate-500">= {desc}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Interactive Calculator */}
            <section className="bg-slate-900/50 border border-slate-800 p-8 rounded-xl backdrop-blur-sm" aria-labelledby="calc-heading">
              <h2 id="calc-heading" className="text-sm font-mono uppercase tracking-widest text-blue-400 mb-6 flex items-center">
                <span className="inline-block w-4 h-[1px] bg-blue-400 mr-3" />
                Quick Calculation Result
              </h2>
              <InteractiveFormula formula={data.seo.formula} variables={data.seo.variables} />
            </section>

            {/* How to Calculate (Step-by-Step) */}
            {steps.length > 0 && (
              <section aria-labelledby="steps-heading">
                <h2 id="steps-heading" className="text-2xl font-bold text-white mb-6">
                  How to Calculate {calcName} (Step-by-Step)
                </h2>
                <ol className="space-y-4 list-none counter-reset-steps">
                  {steps.map((step, i) => {
                    const text = step.replace(/^\d+\.\s*/, '');
                    return (
                      <li key={i} className="flex gap-4 p-4 bg-slate-900/30 border border-slate-800/50 rounded-xl">
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-600/20 text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">{i + 1}</span>
                        <p className="text-slate-400 leading-relaxed text-sm">{text}</p>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {/* Why This Matters */}
            <section aria-labelledby="practical-heading">
              <h2 id="practical-heading" className="text-2xl font-bold text-white mb-4">Why This Matters</h2>
              <p className="text-slate-400 leading-relaxed text-lg">{data.seo.practical}</p>
            </section>

            {/* Numerical Example */}
            {data.seo.example && (
              <section className="border-l-2 border-blue-600 pl-8 py-2" aria-labelledby="example-heading">
                <h2 id="example-heading" className="text-sm font-mono uppercase tracking-widest text-slate-500 mb-4">Worked Example</h2>
                <p className="text-slate-400 leading-relaxed text-lg">{data.seo.example}</p>
              </section>
            )}

            {/* Technical Data Tables */}
            {technicalData.length > 0 && technicalData.map((table, idx) => (
              <section key={idx} className="overflow-x-auto" aria-labelledby={`table-heading-${idx}`}>
                <h2 id={`table-heading-${idx}`} className="text-lg font-bold text-white mb-4">{table.name}</h2>
                <div className="rounded-xl border border-slate-800 bg-slate-900/40">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-800/80 text-xs font-mono uppercase tracking-wider text-slate-500">
                      <tr>
                        {Object.keys(table.rows[0] || {}).map((h, i) => (
                          <th key={i} className="px-6 py-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {table.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-blue-600/5 transition-colors">
                          {Object.values(row).map((cell, j) => (
                            <td key={j} className="px-6 py-4 text-slate-300">{String(cell)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}

            {/* Design Checklist & Pitfalls */}
            {(checklist.length > 0 || pitfalls.length > 0) && (
              <section className="grid md:grid-cols-2 gap-6" aria-labelledby="checks-heading">
                {checklist.length > 0 && (
                  <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4">✓ Design Checklist</h3>
                    <ul className="space-y-2">
                      {checklist.map((item, i) => (
                        <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {pitfalls.length > 0 && (
                  <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-xl">
                    <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-4">⚠ Common Pitfalls</h3>
                    <ul className="space-y-2">
                      {pitfalls.map((item, i) => (
                        <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* FAQ Section */}
            {faq.length > 0 && (
              <section aria-labelledby="faq-heading">
                <h2 id="faq-heading" className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {faq.map((item, i) => (
                    <details key={i} className="p-5 bg-slate-900/30 border border-slate-800 rounded-xl group">
                      <summary className="text-white font-medium cursor-pointer list-none flex items-center justify-between">
                        {item.q}
                        <span className="text-slate-600 group-open:rotate-45 transition-transform text-lg">+</span>
                      </summary>
                      <p className="text-slate-400 mt-3 leading-relaxed text-sm">{item.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* Legacy Technical Sections (backward compat) */}
            {data.technicalSections?.map((section, idx) => (
              <section key={idx} className="space-y-8 pt-8 border-t border-slate-900">
                <h2 className="text-2xl font-bold text-white flex items-center gap-4">
                  <span className="text-blue-500 text-xs font-mono">0{idx + 1}</span>
                  {section.title}
                </h2>
                <div className="space-y-6">
                  {section.content.map((para, pIdx) => (
                    <p key={pIdx} className="text-slate-400 leading-relaxed text-lg">{para}</p>
                  ))}
                </div>
                {section.table && (
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-800/80 text-xs font-mono uppercase tracking-wider text-slate-500">
                        <tr>{section.table.headers.map((h, i) => <th key={i} className="px-6 py-4">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {section.table.rows.map((row, i) => (
                          <tr key={i} className="hover:bg-blue-600/5 transition-colors">
                            {row.map((cell, j) => <td key={j} className="px-6 py-4 text-slate-300">{cell}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Sidebar */}
          <aside className="relative">
            <div className="sticky top-8 space-y-8">
              <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-2xl">
                <h3 className="text-white font-semibold mb-4">Precision Engineering Suite</h3>
                <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                  Access the full capabilities of AluCalc OS with advanced 3D visualization, material databases, and technical report generation.
                </p>
                <Link href={data.cta.link || '/workspace'}
                      className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-lg text-center transition-all shadow-lg shadow-blue-900/20 active:scale-95">
                  {data.cta.label || 'Open in AluCalc OS'}
                </Link>
              </div>

              <div className="p-6 border border-slate-800 rounded-xl bg-slate-900/20">
                <h4 className="text-xs font-mono text-slate-500 uppercase mb-4 tracking-widest">Quick Actions</h4>
                <ul className="text-xs space-y-4 text-slate-300 font-mono">
                  <li>
                    <button className="flex items-center hover:text-blue-400 group w-full text-left" onClick={() => window.print()}>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 group-hover:scale-150 transition-transform" />
                      Save / Print PDF Report
                    </button>
                  </li>
                  <li>
                    <Link href={data.cta.link || '/workspace'} className="flex items-center hover:text-purple-400 group">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 group-hover:scale-150 transition-transform" />
                      Continue in Native App
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>

        {/* Related Calculators (Cross-Category) */}
        {data.relatedCalculators && data.relatedCalculators.length > 0 && (
          <section className="mt-24 pt-16 border-t border-slate-900" aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-xs font-mono uppercase tracking-widest text-blue-400 mb-12 flex items-center">
              <span className="inline-block w-4 h-[1px] bg-blue-400 mr-3" />
              Related Engineering Calculators
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {data.relatedCalculators.map((related) => (
                <Link
                  key={related.slug}
                  href={`/calculators/${related.slug}`}
                  className="group block p-6 bg-slate-900/30 border border-slate-800 hover:border-blue-500/50 rounded-xl transition-all hover:bg-blue-600/5"
                >
                  <h3 className="text-white font-medium group-hover:text-blue-400 transition-colors mb-2 text-sm">{related.title}</h3>
                  <div className="flex items-center text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                    Calculate Now <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Academy Guides (Content Graph Layer 1 Backlinks) */}
        {data.relatedAcademyGuides && data.relatedAcademyGuides.length > 0 && (
          <section className="mt-16 pt-16 border-t border-slate-900" aria-labelledby="academy-heading">
            <h2 id="academy-heading" className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-12 flex items-center">
              <span className="inline-block w-4 h-[1px] bg-emerald-400 mr-3" />
              Related Engineering Academy Guides
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.relatedAcademyGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/academy/${guide.slug}`}
                  className="group block p-6 bg-emerald-900/10 border border-slate-800 hover:border-emerald-500/50 rounded-xl transition-all hover:bg-emerald-600/5"
                >
                  <h3 className="text-white font-medium group-hover:text-emerald-400 transition-colors mb-3 leading-snug">{guide.title}</h3>
                  <div className="flex items-center text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                    Read the Theory <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Structured Data: JSON-LD */}
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

        {/* Breadcrumb Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "AluCalc OS", "item": "https://www.alucalculator.com" },
                { "@type": "ListItem", "position": 2, "name": "Calculators", "item": "https://www.alucalculator.com/calculators" },
                { "@type": "ListItem", "position": 3, "name": calcName, "item": `https://www.alucalculator.com/calculators/${data.slug}` },
              ],
            }),
          }}
        />

        {/* FAQ Schema */}
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

        {/* HowTo Schema */}
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

        {/* Footer with Homepage Backlink */}
        <footer className="mt-32 pt-16 border-t border-slate-900">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs font-mono text-slate-600 gap-8">
            <p>© 2026 <Link href="/" className="hover:text-white transition-colors">AluCalc OS</Link> — Engineering Intelligence Platform</p>
            <div className="flex gap-8">
              <Link href="/" className="hover:text-white">Home</Link>
              <Link href="/calculators" className="hover:text-white">All Calculators</Link>
              <Link href="/learn" className="hover:text-white">Academy</Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
};
