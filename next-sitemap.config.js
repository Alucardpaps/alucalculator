/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://www.alucalculator.com',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,
  // Otomatik üretilen dinamik sayfalara öncelik vermek için
  transform: async (config, path) => {
    return {
      loc: path, 
      changefreq: config.changefreq,
      priority: path.includes('/learn/') ? 0.9 : config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    }
  },
}
