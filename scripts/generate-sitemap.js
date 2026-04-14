const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'https://www.alucalculator.com';
const DATA_PATH = path.join(__dirname, '../src/data/seo-calculators/calculators.json');
const PUBLIC_PATH = path.join(__dirname, '../public/sitemap.xml');

/**
 * Robust Sitemap Generator for Static Export.
 * Standardizes the 100+ engineering tool index for Google.
 */
function generateSitemap() {
  console.log('🚀 Generating Global Sitemap for 100+ Engineering Calculators and Academy Guides...');

  try {
    const rawData = fs.readFileSync(DATA_PATH, 'utf8');
    const calculators = JSON.parse(rawData);

    // Load newly created guides database
    const guidesDataPath = path.join(__dirname, '../src/data/seo-calculators/guides.json');
    let guides = [];
    if(fs.existsSync(guidesDataPath)) {
        const rawGuides = fs.readFileSync(guidesDataPath, 'utf8');
        guides = JSON.parse(rawGuides);
    }

    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // 1. Root
    sitemap += `  <url>\n    <loc>${BASE_URL}/</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

    // 2. Calculators
    calculators.forEach((c) => {
      sitemap += `  <url>\n    <loc>${BASE_URL}/calculators/${c.slug}/</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    // 3. Learn / Pillar Articles
    guides.forEach((g) => {
      sitemap += `  <url>\n    <loc>${BASE_URL}/learn/${g.slug}/</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    });

    sitemap += '</urlset>';

    fs.writeFileSync(PUBLIC_PATH, sitemap);
    console.log(`✅ Success: ${calculators.length + guides.length} paths indexed at ${PUBLIC_PATH} (Calculators: ${calculators.length}, Guides: ${guides.length})`);
  } catch (err) {
    console.error('❌ Failed to generate sitemap:', err.message);
    process.exit(1);
  }
}

generateSitemap();
