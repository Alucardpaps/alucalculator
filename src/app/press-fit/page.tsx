import React from 'react';
import { Metadata } from 'next';
import PressFitModule from '@/components/modules/mechanical/PressFitModule';
import { ModulePageSeoShell } from '@/components/seo/ModulePageSeoShell';
import { getModuleSeo } from '@/config/seo';

export const metadata: Metadata = {
  title: 'DIN 7190 Sıkı Geçme & Pres/Sıcak Geçme Hesabı',
  description:
    'DIN 7190-1 ve ISO 286 standartlarına göre Lamé kalın cidarlı silindirler teorisi ile temas basıncı, iletilebilen tork, von Mises gerilmesi ve montaj ısıtma sıcaklığı hesabı.',
  alternates: {
    canonical: 'https://www.alucalculator.com/press-fit/',
  },
};

export default function PressFitPage() {
  const seo = getModuleSeo('press-fit');

  return (
    <div className="w-full min-h-screen flex flex-col bg-[var(--bg-0)] text-[var(--ink)]">
      <ModulePageSeoShell slug="press-fit" seo={seo} />
      <div className="flex-1 w-full overflow-hidden">
        <PressFitModule />
      </div>
    </div>
  );
}
