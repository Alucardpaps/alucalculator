import fs from 'fs';

const en = JSON.parse(fs.readFileSync('src/data/locales/en_dict.json', 'utf8'));
const values = [...new Set(Object.values(en).map(String))];
console.log('unique values', values.length);
const short = values.filter((v) => v.length <= 40);
const long = values.filter((v) => v.length > 40);
console.log('short', short.length, 'long', long.length);
fs.writeFileSync('scripts/i18n-complete/_handbook_unique.json', JSON.stringify({ short: short.sort(), long: long.sort() }, null, 2));
console.log('long samples:\n', long.slice(0, 15).join('\n'));