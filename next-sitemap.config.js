/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://www.alucalculator.com',
  generateRobotsTxt: true,
  trailingSlash: true,
  sitemapSize: 7000,
  changefreq: 'weekly',
  priority: 0.7,
  exclude: [
    '/api/*',
    '/dashboard',
    '/dashboard/*',
    '/login',
    '/login/*',
    '/workspace',
    '/workspace/*',
    '/lite',
    '/lite/*',
    '/admin',
    '/admin/*',
    '/mobile',
    '/mobile/*',
    '/widget',
    '/widget/*',
    '/field/widget',
    '/field/widget/*',
    '/split-cad',
    '/split-cad/*',
    '/stem-codex',
    '/stem-codex/*',
    '/engineering-test',
    '/engineering-test/*',
    '/calculators/ai-analysis',
    '/calculators/fasteners/vdi2230',
    '/calculators/machine-elements/bearing-life',
    '/calculators/structural/beam-deflection',
    '/calculators/structural/column-buckling',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/admin', '/api/admin/'],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/llms.txt', '/api/ai-agent/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/', '/llms.txt', '/api/ai-agent/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/llms.txt', '/api/ai-agent/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/llms.txt', '/api/ai-agent/'],
      },
    ],
  },
  transform: async (config, path) => {
    // Ensure all URLs end with trailing slash to match next.config.ts trailingSlash: true
    const normalizedPath = path === '/' ? '/' : (path.endsWith('/') ? path : `${path}/`);

    // Homepage = highest priority
    if (normalizedPath === '/') {
      return {
        loc: normalizedPath,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString(),
      };
    }

    // Material Datasheets & Comparisons = high priority technical references
    if (normalizedPath.startsWith('/materials/') || normalizedPath.startsWith('/compare/')) {
      return {
        loc: normalizedPath,
        changefreq: 'monthly',
        priority: 0.75,
        lastmod: new Date().toISOString(),
      };
    }

    // Calculator pages = high priority (SEO traffic drivers)
    if (normalizedPath.startsWith('/calculators/')) {
      return {
        loc: normalizedPath,
        changefreq: 'weekly',
        priority: 0.85,
        lastmod: new Date().toISOString(),
      };
    }

    // Learn/Academy pages = high priority
    if (normalizedPath.startsWith('/academy/')) {
      return {
        loc: normalizedPath,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      };
    }

    // Default
    return {
      loc: normalizedPath,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    };
  },
};
