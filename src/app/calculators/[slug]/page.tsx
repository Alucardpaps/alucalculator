import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SEOCalculatorData, SEOPage } from '@/components/os/SEOPage';
import calculators from '@/data/seo-calculators/calculators.json';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Dynamic SEO Page for Engineering Calculators.
 * Pre-renders at build time for maximum speed and SEO performance.
 */
export default async function CalculatorSEOPage({ params }: PageProps) {
  const { slug } = await params;
  const allCalculators = calculators as unknown as SEOCalculatorData[];
  const calculator = allCalculators.find((c) => c.slug === slug);

  if (!calculator) {
    notFound();
  }

  // Programmatic Internal Linking: Find 3 related calculators in same category
  const related = allCalculators
    .filter((c) => c.category === calculator.category && c.slug !== calculator.slug)
    .slice(0, 3)
    .map((c) => ({ title: c.title, slug: c.slug }));

  return <SEOPage data={{ ...calculator, relatedCalculators: related }} />;
}

/**
 * Generate metadata for search engines.
 * Includes Title and Description with dynamic mapping.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const calculator = (calculators as unknown as SEOCalculatorData[]).find((c) => c.slug === slug);

  if (!calculator) {
    return {
      title: 'Calculator Not Found | AluCalc',
    };
  }

  const ogImage = `/images/og/${calculator.category || 'science'}.png`;

  return {
    title: calculator.meta.title,
    description: calculator.meta.description,
    openGraph: {
      title: calculator.meta.title,
      description: calculator.meta.description,
      type: 'website',
      url: `https://alucalculator.com/calculators/${slug}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: calculator.title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: calculator.meta.title,
      description: calculator.meta.description,
      images: [ogImage],
    },
    alternates: {
      canonical: `https://alucalculator.com/calculators/${slug}`,
    }
  };
}

/**
 * Pre-generate all calculator paths during static export.
 * This is critical for the 'output: export' configuration.
 */
export async function generateStaticParams() {
  return calculators.map((c) => ({
    slug: c.slug,
  }));
}
