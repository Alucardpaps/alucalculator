import fs from 'fs';

const miss = JSON.parse(fs.readFileSync('scripts/i18n-complete/_locale_ts_missing.json', 'utf8'));
const all = new Set();
for (const lang of Object.keys(miss)) {
  for (const v of Object.values(miss[lang])) {
    if (typeof v === 'string') all.add(v);
  }
}
const dictEn = JSON.parse(fs.readFileSync('scripts/i18n-complete/_en_need_koar.json', 'utf8'));
const dictSet = new Set(dictEn);
const extra = [...all].filter((s) => !dictSet.has(s)).sort();
console.log('locale unique EN', all.size, 'extra vs dictionary', extra.length);
fs.writeFileSync('scripts/i18n-complete/_locale_extra_en.json', JSON.stringify(extra, null, 2));
console.log(extra.join('\n'));
