/**
 * CORE SEO CONTRACTS
 * Bu dosya sistemdeki hiçbir sayfanın eksik SEO verisiyle derlenmemesini sağlar.
 */

export interface BaseSeoProps {
  title: string;
  description: string;
  canonicalSlug?: string; // Sadece domain sonrasını alır (örn: '/academy/bolt-torque')
  keywords?: string[];
}

export interface ModuleSeoRecord extends BaseSeoProps {
  // Gelecekte eklenecek Schema.org JSON-LD verileri için altyapı
  schemaType?: 'WebApplication' | 'TechArticle' | 'FAQPage';
  category?: 'mechanical' | 'structural' | 'fluid' | 'electrical' | 'manufacturing' | 'science' | 'software' | 'civil';
}

export interface SeoRegistryMap {
  global: {
    siteName: string;
    baseUrl: string; // sitemap.ts için kritik (örn: 'https://www.alucalculator.com')
    defaultDescription: string;
    themeColor: string;
  };
  staticRoutes: Record<string, BaseSeoProps>;
  modules: Record<string, ModuleSeoRecord>; // /app/[module]/page.tsx buraya bakar
  academy: Record<string, ModuleSeoRecord>; // /app/academy/[slug]/page.tsx buraya bakar
}
