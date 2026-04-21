const fs = require('fs');
const path = require('path');

// This script acts as a bridge to load META_KNOWLEDGE from meta-knowledge.ts in a Node process
const tsPath = path.join(__dirname, '../src/data/seo-calculators/meta-knowledge.ts');
const content = fs.readFileSync(tsPath, 'utf8');

// Extract the META_KNOWLEDGE object using a simple regex/eval
const match = content.match(/export const META_KNOWLEDGE = ([\s\S]*?);/);
const objStr = match ? match[1] : '{}';

module.exports = {
    META_KNOWLEDGE: eval(`(${objStr})`)
};
