import React from 'react';
import { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';
import { SeoCalculatorPage } from '@/schemas/seo-page';
import Link from 'next/link';

// Path to compiled JSONs
const DATA_DIR = path.join(process.cwd(), 'src/data/seo-calculators');

// 1. Static Paths Generation (SSG for all 1000+ pages)
export async function generateStaticParams() {
    try {
        const files = await fs.readdir(DATA_DIR);
        return files.filter(f => f.endsWith('.json') && !['guides.json', 'calculators.json'].includes(f)).map(file => ({
            slug: file.replace('.json', '')
        }));
    } catch (e) {
        console.warn("Could not read SEO calculators directory. Initializing empty params.");
        return [];
    }
}

// 2. Dynamic Metadata Injection
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    try {
        const filePath = path.join(DATA_DIR, `${slug}.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data: SeoCalculatorPage = JSON.parse(fileContent);

        return {
            title: data.meta.title,
            description: data.meta.description,
            alternates: {
                canonical: `https://alucalculator.com/learn/${slug}`
            },
            openGraph: {
                title: data.meta.title,
                description: data.meta.description,
                type: 'article',
            }
        };
    } catch (e) {
        return {
            title: 'Not Found | AluCalc',
            description: 'Engineering resource not found.'
        };
    }
}

// 3. Dynamic Page Component
export default async function SeoEngineeringPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let data: SeoCalculatorPage | null = null;
    
    try {
        const filePath = path.join(DATA_DIR, `${slug}.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        data = JSON.parse(fileContent);
    } catch (e) {
        // Handle 404 naturally via notFound() or similar in production
    }

    if (!data) {
        return <div className="min-h-screen bg-[#05090e] text-white flex items-center justify-center">Resource not found.</div>;
    }

    // JSON-LD Schema.org Injection for Google Rich Snippets
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": ["SoftwareApplication", "HowTo"],
        "name": data.meta.title,
        "operatingSystem": "Web",
        "applicationCategory": "EngineeringApplication",
        "description": data.meta.description,
        "step": [
            {
                "@type": "HowToStep",
                "text": data.seo.step_by_step || "Check formula and variables below."
            }
        ]
    };

    return (
        <div className="min-h-screen bg-[#000000] text-gray-100 font-sans selection:bg-blue-500/30">
            {/* JSON-LD snippet */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Premium Header / Navigation */}
            <header className="border-b border-white/10 bg-[#05090e]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
                            <span className="text-xs text-white">A</span>
                        </div>
                        AluCalc OS
                    </div>
                    <nav className="hidden sm:flex gap-6 text-sm font-medium text-gray-400">
                        <Link href="/os" className="hover:text-white transition-colors">Launch Workspace</Link>
                        <Link href="/learn" className="hover:text-white transition-colors">Engineering Library</Link>
                    </nav>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-16 sm:py-24 space-y-16">
                
                {/* Hero Section */}
                <section className="space-y-6">
                    <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400 mb-2">
                        <span className="flex w-2 h-2 rounded-full bg-blue-500 mr-2 blink"></span>
                        {(data.intent || 'CALCULATION').toUpperCase()} ENGINE
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                        {data.seo.h1}
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-3xl">
                        {data.seo.intro}
                    </p>
                    <div className="pt-4">
                        <Link href={data.cta.link} className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all hover:scale-105 active:scale-95">
                            {data.cta.label}
                        </Link>
                    </div>
                </section>

                {/* Formula Box */}
                <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
                        <span className="text-blue-500 font-serif italic text-3xl leading-none">f(x)</span> Governing Formula
                    </h2>
                    <div className="bg-[#05090e] rounded-xl p-6 border border-white/5 overflow-x-auto shadow-inner relative z-10">
                        <code className="text-xl sm:text-2xl text-blue-300 font-mono block whitespace-nowrap">
                            {data.seo.formula}
                        </code>
                    </div>
                    {data.seo.variables && Object.keys(data.seo.variables).length > 0 && (
                        <div className="mt-6 relative z-10">
                            <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4">Variables</h3>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.entries(data.seo.variables).map(([key, value]) => (
                                    <li key={key} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                                        <span className="text-blue-400 font-mono font-bold w-8 shrink-0">{key}</span>
                                        <span className="text-gray-300 text-sm">{value as string}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>

                {/* Step by Step Guide & Example Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4">Calculation Example</h2>
                        <div className="prose prose-invert prose-blue max-w-none">
                            <p className="text-gray-400 leading-relaxed bg-[#05090e] p-6 rounded-2xl border border-white/5 h-full">
                                {data.seo.example}
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4">Step-by-Step Guide</h2>
                        <div className="prose prose-invert prose-blue max-w-none">
                            <div className="text-gray-400 leading-relaxed bg-[#05090e] p-6 rounded-2xl border border-white/5 whitespace-pre-line h-full">
                                {data.seo.step_by_step}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Practical Applications */}
                <section className="bg-gradient-to-r from-blue-900/20 to-transparent p-8 rounded-3xl border border-blue-500/20">
                    <h2 className="text-2xl font-bold text-white mb-4">Practical Engineering Use</h2>
                    <p className="text-gray-300 leading-relaxed">
                        {data.seo.practical}
                    </p>
                </section>

                {/* Internal Linking / Related Topics (THE SEO MULTIPLIER) */}
                {data.related && data.related.length > 0 && (
                    <section className="pt-8 border-t border-white/10">
                        <h2 className="text-xl font-bold text-white mb-6">Related Engineering Topics</h2>
                        <div className="flex flex-wrap gap-3">
                            {data.related.map((relSlug) => (
                                <Link 
                                    key={relSlug} 
                                    href={`/learn/${relSlug}`}
                                    className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/10 transition-colors"
                                >
                                    {relSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

            </main>

            <footer className="border-t border-white/10 bg-[#05090e] mt-24">
                <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} AluCalc Engineering Knowledge Base. All rights reserved.
                    </div>
                    <div className="flex gap-4">
                        <Link href="/" className="text-gray-500 hover:text-white transition-colors">Home</Link>
                        <Link href="/os" className="text-gray-500 hover:text-white transition-colors">Workspace</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
