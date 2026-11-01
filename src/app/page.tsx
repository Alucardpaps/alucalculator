import React from 'react';
import { Metadata } from 'next';
import { HomePageContent } from '@/components/home/HomePageContent';
import { HomeFooterSection } from '@/components/home/HomeFooterSection';

export const metadata: Metadata = {
  title: 'AluCAD OS — VDI/ISO/DIN mechanical engineering solvers & reports',
  description: 'Deterministic engineering calculators (VDI 2230, ISO 281, ISO 6336), 3D Parametric Part Configurator, 2D AluCAD drafting, and verified engineering tools.',
  applicationName: 'AluCAD OS',
  authors: [{ name: 'AluCAD OS', url: 'https://www.alucalculator.com' }],
  keywords: [
    'AluCAD OS',
    'engineering calculator',
    'bolt torque calculator',
    'bearing life ISO 281',
    'shaft diameter calculator',
    'beam deflection',
    'gear calculator',
    'VDI 2230',
    'fits and tolerances ISO 286',
    'mechanical design',
    '3D CAD browser'
  ],
  alternates: {
    canonical: 'https://www.alucalculator.com/',
  },
  openGraph: {
    title: 'AluCAD OS — VDI/ISO/DIN mechanical engineering solvers & reports',
    description: 'Deterministic engineering calculators (VDI 2230, ISO 281, ISO 6336), 3D Parametric Part Configurator, 2D AluCAD drafting, and verified engineering tools.',
    url: 'https://www.alucalculator.com/',
    type: 'website',
    images: [
      {
        url: 'https://www.alucalculator.com/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AluCAD OS — VDI/ISO/DIN mechanical engineering solvers & reports'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@alucalc',
    title: 'AluCAD OS — VDI/ISO/DIN mechanical engineering solvers & reports',
    description: 'Deterministic engineering solvers and 3D CAD in your browser.',
    images: ['https://www.alucalculator.com/images/og-image.png'],
  },
};

export default function HomePage() {
  return (
    <div className="w-full min-h-full shrink-0 bg-transparent text-white font-sans flex flex-col justify-between">
      <HomePageContent />
      <HomeFooterSection />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://www.alucalculator.com/#organization",
                "name": "AluCalc OS",
                "legalName": "AluCalc Engineering Technologies Inc.",
                "url": "https://www.alucalculator.com",
                "logo": "https://www.alucalculator.com/icon.svg",
                "description": "Industrial Engineering Operating System hosting 90+ deterministic ISO, DIN, VDI, and ASME engineering solvers.",
                "email": "contact@alucalculator.com",
                "telephone": "+90-532-491-0000",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Maslak Mah. Buyukdere Cad.",
                  "addressLocality": "Istanbul",
                  "addressCountry": "TR"
                },
                "contactPoint": [
                  {
                    "@type": "ContactPoint",
                    "telephone": "+90-532-491-0000",
                    "contactType": "customer support",
                    "email": "contact@alucalculator.com",
                    "availableLanguage": ["English", "Turkish", "German"]
                  }
                ],
                "sameAs": [
                  "https://github.com/alucalculator",
                  "https://www.linkedin.com/company/alucalculator",
                  "https://x.com/alucalculator",
                  "https://twitter.com/alucalculator",
                  "https://www.youtube.com/@alucalculator"
                ]
              },
              {
                "@type": "WebSite",
                "@id": "https://www.alucalculator.com/#website",
                "url": "https://www.alucalculator.com",
                "name": "AluCalc OS",
                "publisher": { "@id": "https://www.alucalculator.com/#organization" },
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://www.alucalculator.com/calculators?q={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              },
              {
                "@type": "WebApplication",
                "@id": "https://www.alucalculator.com/#webapp",
                "name": "AluCAD OS",
                "url": "https://www.alucalculator.com",
                "applicationCategory": "EngineeringApplication",
                "operatingSystem": "Web, Android, Windows, macOS, Linux",
                "softwareVersion": "6.0.0",
                "description": "Deterministic engineering platform for mechanical, structural, and CAD analysis. ISO, DIN, VDI compliant.",
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                "provider": { "@id": "https://www.alucalculator.com/#organization" }
              },
              {
                "@type": "Product",
                "@id": "https://www.alucalculator.com/#product",
                "name": "AluCalc OS Engineering Suite",
                "category": "Engineering Software",
                "description": "Deterministic ISO/DIN engineering solver workstation with real-time 3D parametric CAD.",
                "brand": { "@type": "Brand", "name": "AluCalc" },
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
              },
              {
                "@type": "Service",
                "@id": "https://www.alucalculator.com/#service",
                "name": "Deterministic Engineering Calculation & CAD Solvers",
                "serviceType": "Engineering Computation & Simulation",
                "provider": { "@id": "https://www.alucalculator.com/#organization" }
              },
              {
                "@type": "FAQPage",
                "@id": "https://www.alucalculator.com/#faq",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "Which engineering standards does AluCalc OS support?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "AluCalc OS supports official international standards including VDI 2230 for bolted joints, ISO 281 for rolling bearings, ISO 6336 for gears, DIN 743 for shafts, DIN 6885 for keys, and ISO 286 for fits and tolerances."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Are AluCalc OS engineering solvers free to use?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes, all core mechanical, structural, and electrical calculation engines are permanently free with transparent formulas and equations."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Does AluCalc OS offer 3D parametric CAD in the browser?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes, AluCalc OS includes a full 3D parametric Part Studio with extrude, revolve, hole wizard, 2D geometric constraint solving, and STL/DXF export."
                    }
                  }
                ]
              }
            ]
          }),
        }}
      />
    </div>
  );
}
