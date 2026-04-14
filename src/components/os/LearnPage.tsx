'use client';
import React from 'react';
import Link from 'next/link';
import MathJax from 'react-mathjax2';

export interface GuideArticleData {
  id: string;
  slug: string;
  category: string;
  meta: {
    title: string;
    description: string;
  };
  article: {
    h1: string;
    author: string;
    datePublished: string;
    readTime: string;
    intro: string;
    sections: {
      heading: string;
      content: string;
    }[];
  };
  cta: {
    text: string;
    link: string;
    internalId: string;
  };
}

interface LearnPageProps {
  data: GuideArticleData;
}

/**
 * TextRenderer automatically parses $$ latex $$ blocks.
 */
const TextRenderer = ({ content }: { content: string }) => {
  // Split by $$ ... $$ block
  const parts = content.split(/(\$\$[\s\S]*?\$\$)/g);

  return (
    <MathJax.Context>
      <div className="leading-relaxed text-slate-300 font-serif text-lg">
        {parts.map((part, index) => {
          if (part.startsWith('$$') && part.endsWith('$$')) {
            const math = part.substring(2, part.length - 2);
            return (
              <div key={index} className="my-8 py-6 rounded-xl bg-black/40 border border-slate-800 flex justify-center overflow-x-auto shadow-inner text-blue-200">
                <MathJax.Node>{math}</MathJax.Node>
              </div>
            );
          }
          
          // Split by bold text **text** 
          const subParts = part.split(/(\*\*.*?\*\*)/g);
          return (
             <span key={index}>
               {subParts.map((sub, i) => {
                 if(sub.startsWith('**') && sub.endsWith('**')) {
                    return <strong key={i} className="text-white font-bold">{sub.substring(2, sub.length - 2)}</strong>
                 }
                 // Convert new lines to br
                 return sub.split('\n').map((line, j) => (
                    <React.Fragment key={`${index}-${i}-${j}`}>
                      {line}
                      {j < sub.split('\n').length - 1 && <br/>}
                    </React.Fragment>
                 ));
               })}
             </span>
          );
        })}
      </div>
    </MathJax.Context>
  );
};

export const LearnPage: React.FC<LearnPageProps> = ({ data }) => {
  return (
    <main className="min-h-screen bg-[#06080b] text-slate-300">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 mb-12 text-[10px] font-mono uppercase tracking-widest text-slate-500">
          <Link href="/" className="hover:text-blue-400 transition-colors">ALUCALC</Link>
          <span>/</span>
          <Link href="/learn" className="hover:text-blue-400 transition-colors">ACADEMY</Link>
          <span>/</span>
          <span className="text-blue-400/50">{data.category}</span>
        </nav>

        {/* Article Header */}
        <header className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-8 leading-snug">
            {data.article.h1}
          </h1>
          
          <div className="flex items-center gap-6 text-xs font-mono uppercase tracking-widest text-slate-400 border-y border-slate-800 py-4">
            <span>BY {data.article.author}</span>
            <span>•</span>
            <span>{data.article.datePublished}</span>
            <span>•</span>
            <span>{data.article.readTime}</span>
          </div>
        </header>

        {/* Intro */}
        <div className="text-xl leading-relaxed text-slate-400 mb-16 font-serif italic border-l-4 border-blue-500 pl-6">
          {data.article.intro}
        </div>

        {/* Dynamic Sections */}
        <article className="space-y-12">
          {data.article.sections.map((section, idx) => (
            <section key={idx}>
              <h2 className="text-2xl font-semibold text-white mb-6 tracking-tight">
                {section.heading}
              </h2>
              <TextRenderer content={section.content} />
            </section>
          ))}
        </article>

        {/* CTA Bridge to Workstation */}
        <div className="mt-24 bg-gradient-to-br from-blue-600/20 to-purple-600/10 border border-blue-500/20 rounded-2xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px]"></div>
           <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Ready to verify these numbers?</h3>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                Stop calculating by hand. Open this module directly within the AluCalc Engineering OS to gain access to dynamic sliders, real-time 3D models, and ISO validation.
              </p>
              <Link 
                href={data.cta.link}
                className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-xl transition-all hover:scale-105 shadow-xl shadow-blue-500/20 focus:ring-4 focus:ring-blue-500/50"
              >
                {data.cta.text}
              </Link>
           </div>
        </div>

      </div>
    </main>
  );
};
