import { Metadata } from 'next';

import { getStaticSeo } from '@/config/seo';

const seo = getStaticSeo('calculators');

export const metadata: Metadata = {
  title: seo.title,
  description: seo.description,
  alternates: {
    canonical: `https://www.alucalculator.com${seo.canonicalSlug}`,
  },
  openGraph: {
    title: seo.title,
    description: seo.description,
    type: 'website',
    url: `https://www.alucalculator.com${seo.canonicalSlug}`,
  },
};

export default function CalculatorsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
