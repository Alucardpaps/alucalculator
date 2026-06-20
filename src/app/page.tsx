import React from 'react';
import { Metadata } from 'next';
import { HomePageContent } from '@/components/home/HomePageContent';
import { HomeFooterSection } from '@/components/home/HomeFooterSection';
import calculatorsData from '@/data/seo-calculators/calculators.json';
import { getStaticSeo } from '@/config/seo';

const seo = getStaticSeo('home');

export const metadata: Metadata = {
  title: seo.title,
  description: seo.description,
  alternates: {
    canonical: 'https://www.alucalculator.com',
  },
  openGraph: {
    title: seo.title,
    description: seo.description,
    url: 'https://www.alucalculator.com',
    type: 'website',
  },
};

export default function HomePage() {
  const recentCalculators = (calculatorsData as any[]).slice(-5).reverse();

  return (
    <div className="min-h-screen bg-transparent text-white overflow-hidden font-sans">
      <HomePageContent recentCalculators={recentCalculators} />
      <HomeFooterSection />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "AluCalc OS",
            "url": "https://www.alucalculator.com",
            "applicationCategory": "EngineeringApplication",
            "operatingSystem": "Web",
            "description": "Free online engineering calculators for mechanical, structural, electrical, and thermal analysis. 88+ precision solvers.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is AluCalc OS?",
                "acceptedAnswer": { "@type": "Answer", "text": "AluCalc OS is a free, browser-based engineering platform with 88+ precision calculators for mechanical, structural, electrical, and thermal analysis. All formulas are validated against ISO, DIN, ASME, and ANSI standards." }
              },
              {
                "@type": "Question",
                "name": "Is AluCalc OS free to use?",
                "acceptedAnswer": { "@type": "Answer", "text": "Yes, AluCalc OS is completely free. No registration, no installation, and no license fees. All calculators work directly in your browser." }
              },
              {
                "@type": "Question",
                "name": "What engineering calculators are available?",
                "acceptedAnswer": { "@type": "Answer", "text": "AluCalc OS includes calculators for bolt torque, bearing life (ISO 281), beam deflection, shaft design, gear ratios, electrical power, pressure drop, heat transfer, motor sizing, spring constants, and 78+ more engineering tools." }
              }
            ]
          }),
        }}
      />
    </div>
  );
}
