
const fs = require('fs');
const path = require('path');

const files = ['en', 'de', 'tr', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'zh'];
let hasError = false;

files.forEach(f => {
    const p = path.join('src', 'dictionaries', `${f}.json`);
    try {
        const content = fs.readFileSync(p, 'utf8');
        JSON.parse(content);
        console.log(`${f}.json: OK`);
    } catch (e) {
        console.error(`${f}.json: ERROR`);
        console.error(e.message);
        hasError = true;
    }
});

if (hasError) process.exit(1);
