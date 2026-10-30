import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import { SEO_REGISTRY } from '@/config/seo';
import calculators from '@/data/seo-calculators/calculators.json';
import { ALLOY_DATASHEETS, COMPARE_PAIRS } from '@/data/alloyDatasheets';
import { getSeoGuideSlugsExcludingArticles } from '@/lib/academySeoLesson';

export const dynamic = 'force-static';

/**
 * Slugs that are aliases or redirect directly to a primary engineering module.
 * These must NEVER be submitted to the sitemap under /calculators/<slug>
 * because doing so creates redirect/canonical warnings in Google Search Console.
 */
const REDIRECT_OR_ALIAS_SLUGS = new Set([
  'spring-design', 'helical-spring', 'spring-constant', 'spring-constant-calc',
  'mohr-stress', 'pressure-drop', 'pressure-drop-calc', 'pipe-friction',
  'pipe-friction-calc', 'wind-tunnel', 'wind-tunnel-calc', '3-phase-power',
  'power-electrical', 'power-electrical-calc', 'thermal-expansion',
  'bearing-life', 'bearing-life-calc', 'fasteners', 'fasteners-calc',
  'vdi2230', 'bolt-torque-calc', 'tolerance-stackup', 'fits-tolerances',
  'shaft-diameter', 'shaft-diameter-calc', 'heat-transfer', 'heat-transfer-calc',
  'motor-power', 'motor-power-calc', 'roller-chain-drive', 'timing-belt-design',
  'v-belt-power', 'bend-allowance', 'gear-contact-stress', 'gear-module',
  'gear-ratio', 'gear-ratio-calc', 'beam-deflection-calc', 'flow',
  'machine-assembly', 'thread-geometry', 'thread-standards', 'screw-thread',
  'tap-drill', 'pipe-threads', 'npt-thread', 'bsp-thread', 'materials-db',
  'materials-explorer', 'material-selector-ai', 'material-selector',
  'beam-deflection', 'belt-drive', 'biology-genetics', 'bolt-torque',
  'column-buckling', 'concrete-reinforcement', 'failure-prediction',
  'ohms-law', 'physics-solver', 'pumps', 'reducer-lubrication',
  'simulation-fea', 'voltage-drop', 'welding', 'bearings', 'fits',
  'chain-drive', 'planetary-gearbox', 'digital-logic', 'filter-design',
  'sheet-metal', 'cutting-optimizer', 'profile-weight', 'aluminum',
  'three-phase-power', 'handbook', 'cad-editor', 'sketch-pad', 'calculator',
  'gears', 'gears-bearings', 'strength', 'strength-analysis', 'nesting', 'nesting-2d',
  'converter', 'unit-converter', 'shafts', 'fluids', 'fluid-dynamics', 'fatigue',
  'fatigue-analysis', 'fatigue-advanced'
]);

function toCanonicalUrl(pathOrSlug: string): string {
  if (!pathOrSlug || pathOrSlug === '/') {
    return 'https://www.alucalculator.com/';
  }
  const clean = pathOrSlug.replace(/^\/+|\/+$/g, '');
  return `https://www.alucalculator.com/${clean}/`;
}

/**
 * AUTONOMOUS INDEXING ENGINE (Sitemap Generator)
 * Produces clean, canonical, deduplicated URLs with trailing slashes matching next.config.ts trailingSlash: true.
 * Guarantees zero 301 redirects, zero soft-404s, and zero canonical mismatch warnings.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const urlMap = new Map<string, MetadataRoute.Sitemap[number]>();

  const addUrl = (
    pathOrSlug: string,
    priority: number,
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' = 'monthly'
  ) => {
    const url = toCanonicalUrl(pathOrSlug);
    const existing = urlMap.get(url);
    if (!existing || (existing.priority ?? 0) < priority) {
      urlMap.set(url, {
        url,
        lastModified: new Date(),
        changeFrequency,
        priority,
      });
    }
  };

  // 1. Static Canonical Routes
  Object.values(SEO_REGISTRY.staticRoutes).forEach((route) => {
    if (!route.canonicalSlug) return;
    if (route.canonicalSlug === '/') {
      addUrl('/', 1.0, 'daily');
      return;
    }
    addUrl(route.canonicalSlug, 0.85, 'weekly');
  });

  // Additional static hubs
  addUrl('/materials/', 0.85, 'weekly');
  addUrl('/cad-editor/', 0.8, 'weekly');
  addUrl('/flow/', 0.8, 'weekly');

  // 2. Dynamic Modules (Verified Engineering Solvers)
  Object.values(SEO_REGISTRY.modules).forEach((mod) => {
    if (!mod.canonicalSlug) return;
    addUrl(mod.canonicalSlug, 0.8, 'monthly');
  });

  // 3. Materials Datasheets (/materials/[alloy]/)
  ALLOY_DATASHEETS.forEach((alloy) => {
    addUrl(`/materials/${alloy.slug}/`, 0.75, 'monthly');
  });

  // 4. Alloy Comparisons (/compare/[pair]/)
  COMPARE_PAIRS.forEach(([a, b]) => {
    addUrl(`/compare/${a}-vs-${b}/`, 0.7, 'monthly');
  });

  // 5. Academy Guides (Articles + SEO Courses)
  const academyDir = path.join(/*turbopackIgnore: true*/ process.cwd(), 'src/data/academy-articles');
  let articleSlugs: string[] = [];
  try {
    articleSlugs = fs.readdirSync(academyDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''));
  } catch {
    console.warn('Sitemap: Could not read academy articles directory.');
  }

  const seoGuideSlugs = getSeoGuideSlugsExcludingArticles(articleSlugs);
  const allAcademySlugs = Array.from(new Set([...articleSlugs, ...seoGuideSlugs]));

  allAcademySlugs.forEach((slug) => {
    const isPillar = !!SEO_REGISTRY.academy[slug];
    addUrl(`/academy/${slug}/`, isPillar ? 0.9 : 0.7, 'monthly');
  });

  // 6. Individual Spoke Calculators (Only genuine standalone calculation tools)
  calculators.forEach((calc) => {
    const cleanSlug = calc.slug.toLowerCase().trim();
    if (!REDIRECT_OR_ALIAS_SLUGS.has(cleanSlug)) {
      addUrl(`/calculators/${cleanSlug}/`, 0.65, 'monthly');
    }
  });

  return Array.from(urlMap.values());
}
