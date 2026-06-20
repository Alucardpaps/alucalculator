import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import { SEO_REGISTRY } from '@/config/seo';
import calculators from '@/data/seo-calculators/calculators.json';

export const dynamic = 'force-static';

/**
 * AUTONOMOUS INDEXING ENGINE
 * Sitedeki tüm dinamik ve statik sayfaları Google için otomatik olarak haritalandırır.
 * Yeni bir modül veya hesaplayıcı eklendiğinde sıfır müdahale ile güncellenir.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SEO_REGISTRY.global.baseUrl;

  // 1. Static Routes (Home, Workspace, Dashboard, etc.)
  const staticPaths = Object.values(SEO_REGISTRY.staticRoutes).map((route) => ({
    url: `${baseUrl}${route.canonicalSlug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route.canonicalSlug === '/' ? 1.0 : 0.8,
  }));

  // 2. Dynamic Modules (50+ Solvers)
  const modulePaths = Object.values(SEO_REGISTRY.modules).map((mod) => ({
    url: `${baseUrl}${mod.canonicalSlug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // 3. Academy Guides (Dynamic from Filesystem)
  const academyDir = path.join(process.cwd(), 'src/data/academy-articles');
  let academySlugs: string[] = [];
  try {
    academySlugs = fs.readdirSync(academyDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  } catch (e) {
    console.warn("Sitemap: Could not read academy articles directory.");
  }

  const academyPaths = academySlugs.map((slug) => {
    // Check if it's a pillar in the registry for higher priority
    const isPillar = !!SEO_REGISTRY.academy[slug];
    return {
      url: `${baseUrl}/academy/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: isPillar ? 0.9 : 0.7,
    };
  });

  // 4. Individual Calculators (100+ Spokes)
  const calculatorPaths = calculators.map((calc) => ({
    url: `${baseUrl}/calculators/${calc.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    ...staticPaths,
    ...modulePaths,
    ...academyPaths,
    ...calculatorPaths,
  ];
}
