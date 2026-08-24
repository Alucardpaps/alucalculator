import React from 'react';
import { Metadata } from 'next';
import { HomePageContent } from '@/components/home/HomePageContent';
import { HomeFooterSection } from '@/components/home/HomeFooterSection';

export const metadata: Metadata = {
  title: 'AluCalc OS | Engineering Intelligence & CAD Platform',
  description: 'Deterministic engineering calculators (VDI 2230, ISO 281, ISO 6336), 3D Assembly CAD Studio, and verified engineering tools.',
  applicationName: 'AluCalc OS',
  authors: [{ name: 'AluCalc', url: 'https://www.alucalculator.com' }],
  keywords: [
    'AluCalc',
    'engineering calculator',
    'bolt torque calculator',
    'bearing life ISO 281',
    'shaft diameter calculator',
    'beam deflection',
    'gear calculator',
    'VDI 2230',
    'mechanical design',
    '3D CAD browser'
  ],
  alternates: {
    canonical: 'https://www.alucalculator.com/',
  },
  openGraph: {
    title: 'AluCalc OS | Engineering Intelligence & CAD Platform',
    description: 'Deterministic engineering calculators (VDI 2230, ISO 281, ISO 6336), 3D Assembly CAD Studio, and verified engineering tools.',
    url: 'https://www.alucalculator.com/',
    type: 'website',
    images: [
      {
        url: 'https://www.alucalculator.com/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AluCalc Engineering Workspace'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@alucalc',
    title: 'AluCalc OS | Engineering Intelligence',
    description: 'Deterministic engineering solvers and 3D CAD in your browser.',
    images: ['https://www.alucalculator.com/images/og-image.png'],
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-transparent text-white overflow-hidden font-sans flex flex-col justify-between">
      <HomePageContent />
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
            "description": "Deterministic engineering platform for mechanical, structural, and CAD analysis. ISO, DIN, VDI compliant.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          }),
        }}
      />
    </div>
  );
}
