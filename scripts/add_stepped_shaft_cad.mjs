import fs from 'fs';

const TABLE_PATH = 'src/locales/t12table.json';
const table = JSON.parse(fs.readFileSync(TABLE_PATH, 'utf8'));

table["STEPPED SHAFT CAD"] = {
  tr: "KADEMELİ MİL CAD",
  de: "ABSATZWELLE CAD",
  zh: "阶梯轴 CAD 交互工作区",
  ja: "段付き軸 CAD",
  ko: "단차축 CAD",
  fr: "ARBRE ÉPAULÉ CAD",
  es: "EJE ESCALONADO CAD",
  it: "ALBERO A GRADINI CAD",
  pt: "EIXO ESCALONADO CAD",
  ru: "СТУПЕНЧАТЫЙ ВАЛ CAD",
  ar: "عمود متدرج CAD"
};

fs.writeFileSync(TABLE_PATH, JSON.stringify(table, null, 2), 'utf8');
console.log('Added STEPPED SHAFT CAD to t12table.json');
