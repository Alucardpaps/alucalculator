import React from 'react';
import { Metadata } from 'next';
import { KeywayConnectionClient } from './KeywayConnectionClient';
import { ModulePageSeoShell } from '@/components/seo/ModulePageSeoShell';
import { getModuleSeo } from '@/config/seo';

export const metadata: Metadata = {
  title: 'DIN 6885 Paralel Kama ve Mil-Göbek Bağlantısı Hesabı',
  description:
    'DIN 6885-1 ve ISO 3912 standartlarına göre paralel kama ve mil-göbek bağlantı dayanımı, yüzey basıncı, kesme gerilmesi ve emniyet katsayısı hesabı.',
  alternates: {
    canonical: 'https://www.alucalculator.com/keyway-connection/',
  },
};

export default function KeywayConnectionPage() {
  const seo = getModuleSeo('keyway-connection');

  return (
    <div className="w-full min-h-screen flex flex-col bg-[var(--bg-0)] text-[var(--ink)]">
      <ModulePageSeoShell slug="keyway-connection" seo={seo} />
      <div className="flex-1 w-full overflow-hidden">
        <KeywayConnectionClient />
      </div>
    </div>
  );
}

