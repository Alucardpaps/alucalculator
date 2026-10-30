import React from 'react';
import { Metadata } from 'next';
import ColumnBucklingModule from '@/components/modules/mechanical/ColumnBucklingModule';
import { ModulePageSeoShell } from '@/components/seo/ModulePageSeoShell';
import { getModuleSeo } from '@/config/seo';

export const metadata: Metadata = {
  title: 'Kolon Burkulma Analizi (Euler-Johnson & Eurocode 3)',
  description:
    'Euler elastik burkulma, Johnson parabolik ve Eurocode 3 (EN 1993-1-1) standartlarına göre narinlik oranı, kritik burkulma yükü ve emniyet katsayısı hesabı.',
  alternates: {
    canonical: 'https://www.alucalculator.com/column-buckling/',
  },
};

export default function ColumnBucklingPage() {
  const seo = getModuleSeo('column-buckling');

  return (
    <div className="w-full min-h-[calc(100vh-52px)] flex flex-col bg-[var(--bg-0)] text-[var(--ink)]">
      <ModulePageSeoShell slug="column-buckling" seo={seo} />
      <div className="flex-1 w-full overflow-hidden">
        <ColumnBucklingModule />
      </div>
    </div>
  );
}
