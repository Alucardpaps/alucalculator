'use client';

import React from 'react';
import Link from 'next/link';
import { InteractiveFormula } from './InteractiveFormula';

export interface SEOCalculatorData {
  id: string;
  category?: 'mechanical' | 'structural' | 'fluid' | 'electrical' | 'manufacturing' | 'science';
  title: string;
  slug: string;
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
    example: string;
    step_by_step?: string;
  };
  technicalSections?: {
    title: string;
    content: string[];
    table?: {
      headers: string[];
      rows: string[][];
    };
    formulas?: {
      label: string;
      latex: string;
    }[];
  }[];
  cta: {
    label: string;
    link: string;
  };
  relatedCalculators?: { title: string; slug: string }[];
}

interface SEOPageProps {
  data: SEOCalculatorData;
}

/**
 * SEOPage - A production-grade, engineering-standard landing page template.
 * Designed for maximum search engine indexability and user conversion.
 */
export const SEOPage: React.FC<SEOPageProps> = ({ data }) => {
  return (
    <main className="min-h-screen bg-[#0a0e14] text-slate-300 selection:bg-blue-500/30">
      {/* Engineering Grid Background */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-24">
        {/* Breadcrumbs for SEO */}
        <nav className="flex mb-8 text-xs font-mono uppercase tracking-widest text-slate-500" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-blue-400 transition-colors">ALUCALC OS</Link>
          <span className="mx-2">/</span>
          <Link href="/calculators" className="hover:text-blue-400 transition-colors">CALCULATORS</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-400">{data.id}</span>
        </nav>

        {/* Header Section */}
        <header className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
            {data.seo.h1}
          </h1>
          <div className="h-1 w-20 bg-blue-600 mb-8"></div>
          <p className="text-xl text-slate-400 leading-relaxed max-w-3xl">
            {data.seo.intro}
          </p>
        </header>

        {/* Tactical Content Grid */}
        <div className="grid md:grid-cols-3 gap-12">
          {/* Main Content Column */}
          <div className="md:col-span-2 space-y-16">
            
            {/* Formula Section & Interactive Calculator */}
            <section className="bg-slate-900/50 border border-slate-800 p-8 rounded-xl backdrop-blur-sm">
              <h2 className="text-sm font-mono uppercase tracking-widest text-blue-400 mb-6 flex items-center">
                <span className="inline-block w-4 h-[1px] bg-blue-400 mr-3"></span>
                Interactive Technical Calculator
              </h2>
              
              <InteractiveFormula 
                formula={data.seo.formula} 
                variables={data.seo.variables} 
              />
            </section>

            {/* Practical Application */}
            <section>
              <h2 className="text-sm font-mono uppercase tracking-widest text-blue-400 mb-6 flex items-center">
                <span className="inline-block w-4 h-[1px] bg-blue-400 mr-3"></span>
                Practical Engineering Use
              </h2>
              <p className="text-slate-400 leading-relaxed text-lg">
                {data.seo.practical}
              </p>
            </section>

            {/* Numerical Example */}
            <section className="border-l-2 border-slate-800 pl-8 py-2">
              <h2 className="text-sm font-mono uppercase tracking-widest text-slate-500 mb-4">Numerical Example</h2>
              <p className="text-slate-400 font-serif italic text-lg leading-relaxed">
                "{data.seo.example}"
              </p>
            </section>

            {/* HIGH-FIDELITY TECHNICAL SECTIONS (NEW) */}
            {data.technicalSections && data.technicalSections.map((section, idx) => (
              <section key={idx} className="space-y-8 pt-8 border-t border-slate-900">
                <h2 className="text-2xl font-bold text-white flex items-center gap-4">
                  <span className="text-blue-500 text-xs font-mono">0{idx + 1}</span>
                  {section.title}
                </h2>
                
                <div className="space-y-6">
                  {section.content.map((para, pIdx) => (
                    <p key={pIdx} className="text-slate-400 leading-relaxed text-lg">
                      {para}
                    </p>
                  ))}
                </div>

                {section.table && (
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-800/80 text-xs font-mono uppercase tracking-wider text-slate-500">
                        <tr>
                          {section.table.headers.map((h, i) => (
                            <th key={i} className="px-6 py-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {section.table.rows.map((row, i) => (
                          <tr key={i} className="hover:bg-blue-600/5 transition-colors">
                            {row.map((cell, j) => (
                              <td key={j} className="px-6 py-4 text-slate-300">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {section.formulas && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {section.formulas.map((f, i) => (
                      <div key={i} className="p-6 rounded-xl bg-[#05090e] border border-white/5">
                        <div className="text-[10px] font-mono text-slate-500 uppercase mb-3">{f.label}</div>
                        <div className="text-lg font-mono text-blue-300">{f.latex}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Sidebar Sidebar/CTA */}
          <aside className="relative">
            <div className="sticky top-8 space-y-8">
              <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-2xl">
                <h3 className="text-white font-semibold mb-4">Precision Engineering Suite</h3>
                <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                  Access the full capabilities of AluCalc OS with advanced 3D visualization, material databases, and technical report generation.
                </p>
                <Link href={data.cta.link || '/workspace'} 
                      className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-lg text-center transition-all shadow-lg shadow-blue-900/20 active:scale-95">
                  {data.cta.label || 'Open OS Module'}
                </Link>
                <p className="text-[10px] text-center text-slate-500 mt-4 font-mono uppercase tracking-tighter">
                  RUNNING BUILD V5.0.0 — 2026
                </p>
              </div>

              <div className="p-6 border border-slate-800 rounded-xl bg-slate-900/20">
                <h4 className="text-xs font-mono text-slate-500 uppercase mb-4 tracking-widest">Ecosystem Bridges</h4>
                <ul className="text-xs space-y-4 text-slate-300 font-mono">
                  <li>
                    <button className="flex items-center hover:text-blue-400 group w-full text-left" onClick={() => window.print()}>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 group-hover:scale-150 transition-transform"></span> 
                      Save / Print PDF Report
                    </button>
                  </li>
                  <li>
                    <Link href={data.cta.link || '/workspace'} className="flex items-center hover:text-purple-400 group">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 group-hover:scale-150 transition-transform"></span> 
                      Continue in Native App Module
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="p-6 border border-slate-800 rounded-xl bg-slate-900/10">
                <h4 className="text-xs font-mono text-slate-500 uppercase mb-4 tracking-widest">System Specs</h4>
                <ul className="text-[10px] space-y-2 text-slate-500 font-mono">
                  <li>ENGINE: AluEngine v4.0</li>
                  <li>ACCURACY: High-Precision IEEE 754</li>
                  <li>COMPLIANCE: ISO/DIN/ANSI</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>

        {/* Related Calculators (Indexing Domination) */}
        {data.relatedCalculators && data.relatedCalculators.length > 0 && (
          <section className="mt-24 pt-16 border-t border-slate-900">
            <h2 className="text-xs font-mono uppercase tracking-widest text-blue-400 mb-12 flex items-center">
              <span className="inline-block w-4 h-[1px] bg-blue-400 mr-3"></span>
              Engineering Knowledge Graph / Related Tools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.relatedCalculators.map((related) => (
                <Link 
                  key={related.slug} 
                  href={`/calculators/${related.slug}`}
                  className="group block p-6 bg-slate-900/30 border border-slate-800 hover:border-blue-500/50 rounded-xl transition-all hover:bg-blue-600/5"
                >
                  <h3 className="text-white font-medium group-hover:text-blue-400 transition-colors mb-2">
                    {related.title}
                  </h3>
                  <div className="flex items-center text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                    Analyze Now <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* JSON-LD for Search Engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": data.seo.h1,
              "applicationCategory": "EngineeringApplication",
              "operatingSystem": "Web, iOS, Android",
              "description": data.meta.description,
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />

        {/* Footer Navigation */}
        <footer className="mt-32 pt-16 border-t border-slate-900">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs font-mono text-slate-600 gap-8">
            <p>© 2026 ALUCALC INDUSTRIAL ENGINEERING</p>
            <div className="flex gap-8">
              <Link href="/privacy" className="hover:text-white">PRIVACY</Link>
              <Link href="/terms" className="hover:text-white">TERMS</Link>
              <Link href="/contact" className="hover:text-white">CONTACT</Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
};
