import React from 'react';
import { Metadata } from 'next';
import CylinderDesignModule from '@/modules/mechanical/CylinderDesign';
import { ModulePageSeoShell } from '@/components/seo/ModulePageSeoShell';
import { getModuleSeo } from '@/config/seo';

export const metadata: Metadata = {
  title: 'ISO 6020 Hidrolik & Pnömatik Silindir Tasarımı (1:1 CAD & Sızdırmazlık)',
  description:
    'ISO 6020-2, ISO 3320, DIN 2413 ve ISO 3601 standartlarına göre 1:1 komple silindir bileşen tasarımı (honed boru, mil, piston, boğaz takozu, Kastaş sızdırmazlık seti), Euler burkulma ve boyuna kesit 2D CAD teknik resmi.',
  alternates: {
    canonical: 'https://www.alucalculator.com/cylinders/',
  },
};

export default function CylindersPage() {
  const seo = getModuleSeo('cylinders');

  return (
    <div className="w-full h-full min-h-0 flex-1 flex flex-col bg-[var(--bg-0)] text-[var(--ink)] overflow-hidden">
      <ModulePageSeoShell slug="cylinders" seo={seo} />
      <CylinderDesignModule />
    </div>
  );
}
