const fs = require('fs');
const path = require('path');

// Dynamically loading the meta-knowledge from the TS file by parsing it simply 
// In a real environment, we'd use a bundler, but for this local script we'll use a direct reference
const META_PATH = path.join(process.cwd(), 'src/data/seo-calculators/meta-knowledge.ts');
const DATA_DIR = path.join(process.cwd(), 'src/data/seo-calculators');
const OUTPUT_JSON = path.join(DATA_DIR, 'calculators.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Mocking the import for the script context based on the file we just wrote
const { META_KNOWLEDGE } = require('./meta-knowledge-proxy'); 

function slugify(text) {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+|-+$/g, '');
}

function generatePage(slug, knowledge) {
    const title = `${knowledge.topic} Calculator & Engineering Guide - AluCalc`;

    return {
        id: slug,
        title,
        slug,
        keyword: `${knowledge.topic.toLowerCase()} calculator`,
        category: knowledge.domain.toLowerCase(),
        intent: "professional_handbook",
        meta: {
            title: `${title} | Professional Handbook`,
            description: `Professional ${knowledge.topic} guide with ${knowledge.standard || 'standard'} formulas, technical tables, and design checklists.`
        },
        seo: {
            h1: title,
            intro: knowledge.description,
            formula: knowledge.formula,
            variables: knowledge.variables,
            technical_data: knowledge.tables || [],
            checklist: knowledge.checks || [],
            pitfalls: knowledge.pitfalls || [],
            step_by_step: `1. Define system parameters for ${knowledge.topic}.\n2. Consult the technical reference table for material constants.\n3. Apply the ${knowledge.standard || 'industry'} formula.\n4. Run the post-calculation design checks.`,
            practical: `In ${knowledge.domain} applications, accurate ${knowledge.topic} analysis is vital for safety and performance.`
        },
        cta: { label: "Open in AluCalc OS", link: `/os?module=calculator` }
    };
}

function main() {
    console.log('🚀 Generating MASSIVE Professional Engineering Library...');
    let count = 0;
    const allPages = [];

    for (const [slug, knowledge] of Object.entries(META_KNOWLEDGE)) {
        const page = generatePage(slug, knowledge);
        fs.writeFileSync(path.join(DATA_DIR, `${slug}.json`), JSON.stringify(page, null, 2));
        allPages.push(page);
        count++;
    }

    // Write the registry file required for the build
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(allPages, null, 2));

    console.log(`\n✅ Success: Generated ${count} HIGH-DEPTH unique professional guides.`);
    console.log(`✅ Registry synchronized at: ${OUTPUT_JSON}`);
}

main();


