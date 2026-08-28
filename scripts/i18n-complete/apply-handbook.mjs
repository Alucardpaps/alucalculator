import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/locales/en_dict.json'), 'utf8'));

const G = {
  fr: [
    ['Materials Science', 'Science des matériaux'], ['Steel Grades', 'Nuances d’acier'],
    ['Steel', 'Acier'], ['Aluminum', 'Aluminium'], ['Bearing', 'Roulement'],
    ['Weldability', 'Soudabilité'], ['Usage', 'Usage'], ['Very good', 'Très bon'],
    ['Good', 'Bon'], ['Excellent', 'Excellent'], ['Poor', 'Faible'],
    ['Structural steel', 'Acier de construction'], ['profiles', 'profilés'], ['pipes', 'tubes'],
    ['General-purpose', 'Usage général'], ['high-strength', 'haute résistance'],
    ['Non-weldable', 'Non soudable'], ['Aircraft structures', 'Structures aéronautiques'],
    ['precision parts', 'pièces de précision'], ['Density', 'Masse volumique'],
    ['Yield', 'Limite d’élasticité'], ['Tensile', 'Traction'], ['Hardness', 'Dureté'],
    ['Formula', 'Formule'], ['Standard', 'Norme'], ['Thread', 'Filetage'],
    ['Diameter', 'Diamètre'], ['Length', 'Longueur'], ['Width', 'Largeur'],
    ['Height', 'Hauteur'], ['Thickness', 'Épaisseur'], ['Angle', 'Angle'],
    ['Force', 'Force'], ['Torque', 'Couple'], ['Pressure', 'Pression'],
    ['Stress', 'Contrainte'], ['Strain', 'Déformation'], ['Safety', 'Sécurité'],
    ['Calculation', 'Calcul'], ['Table', 'Tableau'], ['Reference', 'Référence'],
    ['Used in', 'Utilisé dans'], ['Suitable for', 'Convient à'],
    ['Higher load capacity', 'Capacité de charge supérieure'],
    ['series', 'série'], ['bearings', 'roulements'],
  ],
  it: [
    ['Materials Science', 'Scienza dei materiali'], ['Steel Grades', 'Classi di acciaio'],
    ['Steel', 'Acciaio'], ['Aluminum', 'Alluminio'], ['Bearing', 'Cuscinetto'],
    ['Weldability', 'Saldabilità'], ['Usage', 'Uso'], ['Very good', 'Molto buona'],
    ['Good', 'Buona'], ['Excellent', 'Eccellente'], ['Poor', 'Scarsa'],
    ['Structural steel', 'Acciaio strutturale'], ['profiles', 'profilati'], ['pipes', 'tubi'],
    ['General-purpose', 'Uso generale'], ['high-strength', 'alta resistenza'],
    ['Non-weldable', 'Non saldabile'], ['Aircraft structures', 'Strutture aeronautiche'],
    ['precision parts', 'parti di precisione'], ['Density', 'Densità'],
    ['Yield', 'Snervamento'], ['Tensile', 'Trazione'], ['Hardness', 'Durezza'],
    ['Formula', 'Formula'], ['Standard', 'Norma'], ['Thread', 'Filettatura'],
    ['Diameter', 'Diametro'], ['Length', 'Lunghezza'], ['Width', 'Larghezza'],
    ['Height', 'Altezza'], ['Thickness', 'Spessore'], ['Angle', 'Angolo'],
    ['Force', 'Forza'], ['Torque', 'Coppia'], ['Pressure', 'Pressione'],
    ['Stress', 'Sforzo'], ['Strain', 'Deformazione'], ['Safety', 'Sicurezza'],
    ['Calculation', 'Calcolo'], ['Table', 'Tabella'], ['Reference', 'Riferimento'],
    ['Used in', 'Usato in'], ['Suitable for', 'Adatto a'],
    ['Higher load capacity', 'Maggiore capacità di carico'],
    ['series', 'serie'], ['bearings', 'cuscinetti'],
  ],
  pt: [
    ['Materials Science', 'Ciência dos materiais'], ['Steel Grades', 'Graus de aço'],
    ['Steel', 'Aço'], ['Aluminum', 'Alumínio'], ['Bearing', 'Rolamento'],
    ['Weldability', 'Soldabilidade'], ['Usage', 'Uso'], ['Very good', 'Muito boa'],
    ['Good', 'Boa'], ['Excellent', 'Excelente'], ['Poor', 'Fraca'],
    ['Structural steel', 'Aço estrutural'], ['profiles', 'perfis'], ['pipes', 'tubos'],
    ['General-purpose', 'Uso geral'], ['high-strength', 'alta resistência'],
    ['Non-weldable', 'Não soldável'], ['Aircraft structures', 'Estruturas aeronáuticas'],
    ['precision parts', 'peças de precisão'], ['Density', 'Densidade'],
    ['Yield', 'Escoamento'], ['Tensile', 'Tração'], ['Hardness', 'Dureza'],
    ['Formula', 'Fórmula'], ['Standard', 'Norma'], ['Thread', 'Rosca'],
    ['Diameter', 'Diâmetro'], ['Length', 'Comprimento'], ['Width', 'Largura'],
    ['Height', 'Altura'], ['Thickness', 'Espessura'], ['Angle', 'Ângulo'],
    ['Force', 'Força'], ['Torque', 'Torque'], ['Pressure', 'Pressão'],
    ['Stress', 'Tensão'], ['Strain', 'Deformação'], ['Safety', 'Segurança'],
    ['Calculation', 'Cálculo'], ['Table', 'Tabela'], ['Reference', 'Referência'],
    ['Used in', 'Usado em'], ['Suitable for', 'Adequado para'],
    ['Higher load capacity', 'Maior capacidade de carga'],
    ['series', 'série'], ['bearings', 'rolamentos'],
  ],
  ru: [
    ['Materials Science', 'Материаловедение'], ['Steel Grades', 'Марки стали'],
    ['Steel', 'Сталь'], ['Aluminum', 'Алюминий'], ['Bearing', 'Подшипник'],
    ['Weldability', 'Свариваемость'], ['Usage', 'Применение'], ['Very good', 'Очень хорошая'],
    ['Good', 'Хорошая'], ['Excellent', 'Отличная'], ['Poor', 'Плохая'],
    ['Structural steel', 'Конструкционная сталь'], ['profiles', 'профили'], ['pipes', 'трубы'],
    ['General-purpose', 'Общего назначения'], ['high-strength', 'высокопрочный'],
    ['Non-weldable', 'Несвариваемый'], ['Aircraft structures', 'Авиационные конструкции'],
    ['precision parts', 'прецизионные детали'], ['Density', 'Плотность'],
    ['Yield', 'Текучесть'], ['Tensile', 'Разрыв'], ['Hardness', 'Твёрдость'],
    ['Formula', 'Формула'], ['Standard', 'Стандарт'], ['Thread', 'Резьба'],
    ['Diameter', 'Диаметр'], ['Length', 'Длина'], ['Width', 'Ширина'],
    ['Height', 'Высота'], ['Thickness', 'Толщина'], ['Angle', 'Угол'],
    ['Force', 'Сила'], ['Torque', 'Момент'], ['Pressure', 'Давление'],
    ['Stress', 'Напряжение'], ['Strain', 'Деформация'], ['Safety', 'Безопасность'],
    ['Calculation', 'Расчёт'], ['Table', 'Таблица'], ['Reference', 'Справка'],
    ['Used in', 'Применяется в'], ['Suitable for', 'Подходит для'],
    ['Higher load capacity', 'Более высокая грузоподъёмность'],
    ['series', 'серия'], ['bearings', 'подшипники'],
  ],
};

function translateValue(text, lang) {
  if (!text) return text;
  let out = String(text);
  const pairs = G[lang] || [];
  const sorted = [...pairs].sort((a, b) => b[0].length - a[0].length);
  for (const [a, b] of sorted) {
    const re = new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    out = out.replace(re, b);
  }
  return out;
}

for (const lang of ['fr', 'it', 'pt', 'ru']) {
  const dict = {};
  for (const [k, v] of Object.entries(en)) {
    dict[k] = translateValue(v, lang);
  }
  const file = path.join(ROOT, `src/data/locales/${lang}_dict.json`);
  fs.writeFileSync(file, JSON.stringify(dict, null, 2) + '\n');
  console.log('wrote', lang, Object.keys(dict).length);
}
