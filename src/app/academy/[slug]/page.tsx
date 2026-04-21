import React from 'react';
import { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';
import Link from 'next/link';
import { AcademyArticle } from '@/schemas/academy-article';
import { Calculator, ArrowRight, CheckCircle2, AlertTriangle, Lightbulb, GraduationCap } from 'lucide-react';

// Path to compiled JSONs
const DATA_DIR = path.join(process.cwd(), 'src/data/academy-articles');

// 1. Static Paths Generation
export async function generateStaticParams() {
    try {
        const files = await fs.readdir(DATA_DIR);
        return files.filter(f => f.endsWith('.json')).map(file => ({
            slug: file.replace('.json', '')
        }));
    } catch (e) {
        console.warn("Could not read academy articles directory. Initializing empty params.");
        return [];
    }
}

// 2. Dynamic Metadata Injection
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    try {
        const filePath = path.join(DATA_DIR, `${slug}.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data: AcademyArticle = JSON.parse(fileContent);

        return {
            title: data.meta.title,
            description: data.meta.description,
            alternates: {
                canonical: `https://www.alucalculator.com/academy/${slug}`
            },
            openGraph: {
                title: data.meta.title,
                description: data.meta.description,
                type: 'article',
            }
        };
    } catch (e) {
        return {
            title: 'Article Not Found | AluCalc Academy',
            description: 'Engineering resource not found.'
        };
    }
}

// 3. Dynamic Page Component
export default async function AcademyArticlePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let data: AcademyArticle | null = null;
    
    try {
        const filePath = path.join(DATA_DIR, `${slug}.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        data = JSON.parse(fileContent);
    } catch (e) {
        // Handle 404 naturally via notFound() or similar in production
    }

    if (!data) {
        return <div className="min-h-screen bg-[#020408] text-slate-200 flex items-center justify-center">Article not found.</div>;
    }

    // JSON-LD Schema.org Injection for Google Rich Snippets
    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": data.meta.title,
        "description": data.meta.description,
        "author": {
            "@type": "Organization",
            "name": "AluCalc Engineering"
        }
    };

    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": data.meta.title,
        "description": data.meta.description,
        "step": data.stepByStep.map((step, index) => ({
            "@type": "HowToStep",
            "text": step
        }))
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": data.faq.map(f => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": f.answer
            }
        }))
    };

    return (
        <div className="min-h-screen bg-[#020408] text-slate-200 font-sans selection:bg-blue-500/30">
            {/* JSON-LD snippets */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            {/* Premium Header */}
            <header className="border-b border-white/5 bg-[#020408]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
                            <GraduationCap size={14} className="text-white" />
                        </div>
                        AluCalc <span className="font-light text-slate-400">Academy</span>
                    </Link>
                    <nav className="hidden sm:flex gap-6 text-sm font-medium text-slate-400">
                        <Link href="/calculators" className="hover:text-white transition-colors">Calculators</Link>
                        <Link href="/academy" className="hover:text-white transition-colors">All Articles</Link>
                    </nav>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24 space-y-16">
                
                {/* Hero Section */}
                <section className="space-y-6">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                        {data.hero.h1}
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-400 leading-relaxed">
                        {data.hero.intro}
                    </p>
                </section>

                {/* Formula Section */}
                <section className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.02] p-8">
                    <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        Governing Formula
                    </h2>
                    <div className="bg-[#010204] rounded-xl p-6 border border-white/5 overflow-x-auto shadow-inner mb-6">
                        <code className="text-2xl text-white font-mono block whitespace-nowrap text-center">
                            {data.formula.equation}
                        </code>
                    </div>
                    {data.formula.variables && Object.keys(data.formula.variables).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(data.formula.variables).map(([key, value]) => (
                                <div key={key} className="flex gap-3 text-sm">
                                    <span className="text-blue-400 font-mono font-bold w-6 shrink-0">{key}</span>
                                    <span className="text-slate-300">{value as string}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Interactive CTA */}
                <section>
                    <Link href={`/calculators/${data.calculatorCta.targetSlug}`} className="group relative w-full flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 p-6 sm:p-8 rounded-2xl overflow-hidden shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99]">
                        <div className="relative z-10">
                            <h3 className="text-white font-bold text-lg sm:text-xl flex items-center gap-3">
                                <Calculator className="text-white/80" />
                                Interactive Engineering Tool
                            </h3>
                            <p className="text-blue-100 text-sm sm:text-base mt-2 max-w-md">
                                {data.calculatorCta.label}
                            </p>
                        </div>
                        <div className="relative z-10 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                            <ArrowRight className="text-white" />
                        </div>
                        {/* Background pattern */}
                        <div className="absolute top-0 right-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4 scale-150">
                            <Calculator size={200} />
                        </div>
                    </Link>
                </section>

                {/* Step by Step Guide */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-white border-b border-white/5 pb-4">Step-by-Step Calculation</h2>
                    <ol className="space-y-4">
                        {data.stepByStep.map((step, idx) => (
                            <li key={idx} className="flex gap-4 items-start bg-white/[0.02] p-4 rounded-xl border border-white/5">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-mono text-sm shrink-0">
                                    {idx + 1}
                                </span>
                                <span className="text-slate-300 leading-relaxed text-sm">{step}</span>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* Example */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-white border-b border-white/5 pb-4">Worked Example</h2>
                    <div className="bg-[#05090e] border border-white/5 rounded-2xl p-6 sm:p-8">
                        <div className="mb-6">
                            <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">Input Parameters</h3>
                            <ul className="space-y-2">
                                {data.example.inputs.map((input, idx) => (
                                    <li key={idx} className="text-sm text-slate-300 font-mono bg-white/5 px-3 py-2 rounded">
                                        {input}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">Calculation</h3>
                            <div className="text-base sm:text-lg text-emerald-400 font-mono bg-emerald-500/10 px-4 py-3 rounded-lg border border-emerald-500/20">
                                {data.example.calculation}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Engineering Insight Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <CheckCircle2 className="text-emerald-500" size={20} /> Why This Matters
                        </h2>
                        <ul className="space-y-3">
                            {data.whyThisMatters.map((point, idx) => (
                                <li key={idx} className="text-sm text-slate-400 leading-relaxed pl-4 border-l-2 border-white/10">
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </section>
                    
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <AlertTriangle className="text-red-500" size={20} /> Common Mistakes
                        </h2>
                        <ul className="space-y-3">
                            {data.commonMistakes.map((point, idx) => (
                                <li key={idx} className="text-sm text-slate-400 leading-relaxed pl-4 border-l-2 border-white/10">
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>

                {data.engineeringTip && (
                    <section className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 flex gap-4 items-start">
                        <Lightbulb className="text-yellow-500 shrink-0 mt-1" />
                        <div>
                            <h3 className="text-sm font-bold text-yellow-500 mb-1">Engineering Pro-Tip</h3>
                            <p className="text-sm text-yellow-500/80 leading-relaxed">{data.engineeringTip}</p>
                        </div>
                    </section>
                )}

                {/* FAQ Section */}
                {data.faq && data.faq.length > 0 && (
                    <section className="space-y-6 pt-8 border-t border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            {data.faq.map((faq, idx) => (
                                <details key={idx} className="group bg-white/[0.02] border border-white/5 rounded-xl [&_summary::-webkit-details-marker]:hidden">
                                    <summary className="flex cursor-pointer items-center justify-between gap-1.5 p-4 text-white font-medium">
                                        <h3 className="text-sm sm:text-base">{faq.question}</h3>
                                        <span className="shrink-0 rounded-full bg-white/5 p-1.5 text-slate-400 group-open:-rotate-180 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    </summary>
                                    <p className="p-4 pt-0 text-sm text-slate-400 leading-relaxed border-t border-white/5 mt-2">
                                        {faq.answer}
                                    </p>
                                </details>
                            ))}
                        </div>
                    </section>
                )}

                {/* Related Topics (Content Graph Layer 3) */}
                {data.relatedArticles && data.relatedArticles.length > 0 && (
                    <section className="pt-8 border-t border-white/5">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Related Engineering Topics</h2>
                        <div className="flex flex-wrap gap-3">
                            {data.relatedArticles.map((relSlug) => (
                                <Link 
                                    key={relSlug} 
                                    href={`/academy/${relSlug}`}
                                    className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-400 hover:text-white hover:border-white/30 hover:bg-white/10 transition-colors"
                                >
                                    {relSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

            </main>

            <footer className="border-t border-white/5 bg-[#010204] py-12 text-center text-xs text-slate-600">
                <p>© {new Date().getFullYear()} AluCalc Engineering Knowledge Base. All rights reserved.</p>
            </footer>
        </div>
    );
}
