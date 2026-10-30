import React from 'react';
import { Metadata } from 'next';
import ORingModule from '@/components/modules/mechanical/ORingModule';
import { ModulePageSeoShell } from '@/components/seo/ModulePageSeoShell';
import { getModuleSeo } from '@/config/seo';

export const metadata: Metadata = {
  title: 'ISO 3601 O-Ring Sızdırmazlık & Kanal Tasarımı Hesabı',
  description:
    'ISO 3601-1, ISO 3601-2 ve AS568 standartlarına göre O-Ring kanal boyutlandırma, sıkışma oranı, kanal doluluk yüzdesi ve ekstrüzyon boşluğu hesabı.',
  alternates: {
    canonical: 'https://www.alucalculator.com/o-ring/',
  },
};

export default function ORingPage() {
  const seo = getModuleSeo('o-ring');

  return (
    <div className="w-full min-h-screen flex flex-col bg-[var(--bg-0)] text-[var(--ink)]">
      <ModulePageSeoShell slug="o-ring" seo={seo} />
      <div className="flex-1 w-full overflow-hidden">
        <ORingModule />
      </div>
    </div>
  );
}
