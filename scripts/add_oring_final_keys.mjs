import fs from 'fs';

const TABLE_PATH = 'src/locales/t12table.json';
const table = JSON.parse(fs.readFileSync(TABLE_PATH, 'utf8'));

const entries = {
  "squeeze": {
    tr: "sıkışma",
    de: "Verpressung",
    zh: "压缩",
    ja: "つぶし",
    ko: "압착",
    fr: "compression",
    es: "compresión",
    it: "compressione",
    pt: "compressão",
    ru: "сжатие",
    ar: "انضغاط"
  },
  "to": {
    tr: "ila",
    de: "bis",
    zh: "至",
    ja: "〜",
    ko: "에서",
    fr: "à",
    es: "a",
    it: "a",
    pt: "a",
    ru: "до",
    ar: "إلى"
  },
  "RPM": {
    tr: "d/dk",
    de: "U/min",
    zh: "转/分",
    ja: "rpm",
    ko: "RPM",
    fr: "tr/min",
    es: "rpm",
    it: "giri/min",
    pt: "rpm",
    ru: "об/мин",
    ar: "دورة/دقيقة"
  }
};

for (const [k, v] of Object.entries(entries)) {
  table[k] = v;
}

fs.writeFileSync(TABLE_PATH, JSON.stringify(table, null, 2), 'utf8');
console.log('Added squeeze, to, RPM to t12table.json');
