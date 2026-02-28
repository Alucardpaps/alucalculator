
const fs = require('fs');
const en = JSON.parse(fs.readFileSync('./src/dictionaries/en.json', 'utf8'));
const tr = JSON.parse(fs.readFileSync('./src/dictionaries/tr.json', 'utf8'));

function compare(a, b, path = '') {
    const missing = [];
    Object.keys(a).forEach(k => {
        const currentPath = path ? path + '.' + k : k;
        if (!(k in b)) {
            missing.push('Missing in TR: ' + currentPath);
        } else if (typeof a[k] === 'object' && a[k] !== null && !Array.isArray(a[k])) {
            missing.push(...compare(a[k], b[k], currentPath));
        }
    });
    return missing;
}

const missingInTr = compare(en, tr);
const missingInEn = compare(tr, en);

console.log('--- MISSING IN TR ---');
missingInTr.forEach(m => console.log(m));
console.log('\n--- MISSING IN EN ---');
missingInEn.forEach(m => console.log(m));
