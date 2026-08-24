import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'mobile-i18n-data/field-tools');
const extra = {
  de: { accXAxis: 'Beschl. X', accYAxis: 'Beschl. Y', accZAxis: 'Beschl. Z', grade88SteelDefault: 'Klasse 8.8', grade109SteelDefault: 'Klasse 10.9' },
  es: { accXAxis: 'Acel. X', accYAxis: 'Acel. Y', accZAxis: 'Acel. Z', grade88SteelDefault: 'Grado 8.8', grade109SteelDefault: 'Grado 10.9' },
  fr: { accXAxis: 'Acc. X', accYAxis: 'Acc. Y', accZAxis: 'Acc. Z', grade88SteelDefault: 'Classe 8.8', grade109SteelDefault: 'Classe 10.9' },
  it: { accXAxis: 'Acc. X', accYAxis: 'Acc. Y', accZAxis: 'Acc. Z', grade88SteelDefault: 'Classe 8.8', grade109SteelDefault: 'Classe 10.9' },
  pt: { accXAxis: 'Acel. X', accYAxis: 'Acel. Y', accZAxis: 'Acel. Z', grade88SteelDefault: 'Classe 8.8', grade109SteelDefault: 'Classe 10.9' },
  ru: { accXAxis: 'Уск. X', accYAxis: 'Уск. Y', accZAxis: 'Уск. Z', grade88SteelDefault: 'Класс 8.8', grade109SteelDefault: 'Класс 10.9' },
  ja: { accXAxis: '加速度 X', accYAxis: '加速度 Y', accZAxis: '加速度 Z', grade88SteelDefault: 'グレード 8.8', grade109SteelDefault: 'グレード 10.9' },
  zh: { accXAxis: '加速度 X', accYAxis: '加速度 Y', accZAxis: '加速度 Z', grade88SteelDefault: '8.8 级', grade109SteelDefault: '10.9 级' },
  ko: { accXAxis: '가속도 X', accYAxis: '가속도 Y', accZAxis: '가속도 Z', grade88SteelDefault: '8.8 등급', grade109SteelDefault: '10.9 등급' },
  ar: { accXAxis: 'تسارع X', accYAxis: 'تسارع Y', accZAxis: 'تسارع Z', grade88SteelDefault: 'درجة 8.8', grade109SteelDefault: 'درجة 10.9' },
};

for (const [lang, keys] of Object.entries(extra)) {
  const p = path.join(dir, `${lang}.mjs`);
  let s = fs.readFileSync(p, 'utf8');
  for (const [k, v] of Object.entries(keys)) {
    if (s.includes(`${k}:`)) continue;
    const line = `  ${k}: ${JSON.stringify(v)},`;
    s = s.replace(/\n\};\s*$/, `\n${line}\n};\n`);
  }
  fs.writeFileSync(p, s);
}
console.log('done');
