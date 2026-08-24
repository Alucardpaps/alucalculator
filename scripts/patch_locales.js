const fs = require('fs');
const path = require('path');

const dictDir = path.join(__dirname, '../src/dictionaries');
const enPath = path.join(dictDir, 'en.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const keysToSync = ['projectList', 'costData', 'engineering', 'simulation', 'export'];

fs.readdirSync(dictDir).forEach(file => {
    if (file === 'en.json') return;

    const filePath = path.join(dictDir, file);
    const lang = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!lang.aluminum) {
        console.log(`[${file}] No aluminum key found. Initializing...`);
        lang.aluminum = {};
    }

    let updated = false;
    keysToSync.forEach(key => {
        if (!lang.aluminum[key]) {
            console.log(`[${file}] Adding missing key: aluminum.${key}`);
            lang.aluminum[key] = en.aluminum[key];
            updated = true;
        }
    });

    if (updated) {
        fs.writeFileSync(filePath, JSON.stringify(lang, null, 4), 'utf8');
        console.log(`[${file}] Updated.`);
    } else {
        console.log(`[${file}] Already up to date.`);
    }
});
