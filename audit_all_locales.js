const fs = require('fs');
const path = require('path');

const locales = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];
const dictionariesDir = path.join(__dirname, 'src', 'dictionaries');

// Load master English dictionary
const enPath = path.join(dictionariesDir, 'en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

function getFlatKeys(obj, prefix = '') {
    let keys = {};
    Object.keys(obj).forEach(k => {
        const p = prefix ? prefix + '.' + k : k;
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(keys, getFlatKeys(obj[k], p));
        } else {
            keys[p] = obj[k];
        }
    });
    return keys;
}

const enFlat = getFlatKeys(en);
const enKeysList = Object.keys(enFlat);

console.log(`English Master Dictionary: ${enKeysList.length} flat keys.`);

locales.forEach(loc => {
    if (loc === 'en') return;
    const locPath = path.join(dictionariesDir, `${loc}.json`);
    if (!fs.existsSync(locPath)) {
        console.log(`[ERROR] File missing for locale: ${loc}`);
        return;
    }
    
    const data = JSON.parse(fs.readFileSync(locPath, 'utf8'));
    const flat = getFlatKeys(data);
    
    const missing = [];
    const identical = [];
    
    enKeysList.forEach(k => {
        if (!(k in flat)) {
            missing.push(k);
        } else if (flat[k] === enFlat[k] && enFlat[k] && enFlat[k].length > 3 && !enFlat[k].includes('{') && !/^[A-Z0-9_\-\.\s]+$/.test(enFlat[k])) {
            // Check if string matches English and is likely text (more than 3 chars, not a placeholder/formula, not simple uppercase code)
            identical.push(k);
        }
    });
    
    const extra = Object.keys(flat).filter(k => !(k in enFlat));
    
    console.log(`\n--- Locale: ${loc.toUpperCase()} ---`);
    console.log(`Missing Keys: ${missing.length}`);
    if (missing.length > 0) {
        console.log(`  Sample missing: ${missing.slice(0, 10).join(', ')}`);
    }
    console.log(`Identical to EN (Potential Untranslated): ${identical.length}`);
    if (identical.length > 0) {
        console.log(`  Sample identical: ${identical.slice(0, 5).map(k => `${k} ("${enFlat[k]}")`).join(', ')}`);
    }
    if (extra.length > 0) {
        console.log(`Extra keys: ${extra.length} (Sample: ${extra.slice(0, 5).join(', ')})`);
    }
});
