import fs from 'fs';
import path from 'path';

/**
 * AluCalc OS v5.0 — Registry Sync
 * 
 * Synchronizes individual SEO calculator JSON files into a master calculators.json registry.
 * This ensures generateStaticParams() always has the full list of slugs for pre-rendering.
 */

const DATA_DIR = path.join(process.cwd(), 'src/data/seo-calculators');
const MASTER_FILE = path.join(DATA_DIR, 'calculators.json');

function syncRegistry() {
    console.log('🚀 Synchronizing AluCalc SEO Registry...');

    const files = fs.readdirSync(DATA_DIR);
    const registry: any[] = [];

    // Skip the master file itself
    const contentFiles = files.filter(f => f.endsWith('.json') && f !== 'calculators.json');

    console.log(`🔍 Found ${contentFiles.length} individual calculator files.`);

    contentFiles.forEach(file => {
        try {
            const filePath = path.join(DATA_DIR, file);
            const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            
            // Basic validation
            if (content.slug && content.title) {
                registry.push(content);
            }
        } catch (err) {
            console.error(`❌ Error parsing ${file}:`, err);
        }
    });

    // Sort by id for stability
    registry.sort((a, b) => a.id.localeCompare(b.id));

    fs.writeFileSync(MASTER_FILE, JSON.stringify(registry, null, 2));
    console.log(`✅ Successfully updated ${MASTER_FILE} with ${registry.length} entries.`);
}

syncRegistry();
