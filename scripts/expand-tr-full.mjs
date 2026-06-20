import fs from 'fs';
import path from 'path';

const articlesDir = 'src/data/academy-articles';
const slugs = [
  'engineering-units-and-standards','fundamentals-of-statics','introduction-to-machine-elements',
  'thread-geometry-standards','how-to-calculate-bolt-torque','bearing-life-calculation-explained',
  'motor-power-calculation','mechanics-of-materials-fundamentals','mohrs-circle-stress-analysis',
  'torsion-and-buckling-mechanics','beam-deflection-formula-explained','pressure-drop-calculation-guide','chip-breaker-logic'
];

const trBundle = JSON.parse(
  fs.readFileSync('src/locales/academyLessonI18n/locales/tr.ts','utf8')
    .replace(/^[\s\S]*?=\s*/,'').replace(/\s+as AcademyLessonLocaleBundle;\s*$/,'')
);

const engUnits = trBundle.lessons['engineering-units-and-standards'];
const titles = JSON.parse(fs.readFileSync('scripts/academy-i18n-data/title-map.json','utf8')).tr;

const TR_INTROS = {
  'fundamentals-of-statics':
    'Statik, dengede olan sistemleri inceler. Kuvvet ve moment etkilesimini anlamak yap\u0131 ve makine tasariminin temelidir.\n\nHer govde boyutlandirmadan once dengeyi saglamalidir. Bu modul SigmaF=0 ve SigmaM=0 mantigini ogretir.',
  'introduction-to-machine-elements':
    'Makineler standart yap\u0131 taslarindan olusur. Bu modul c\u0131vata, rulman, disli ve kayis ailelerini AluCalc hesaplayicilarina baglar.',
  'thread-geometry-standards':
    'Dis standartlari helis geometrisini kodlar. M16x1.5-6g bir tornaci icin cap, adim ve tolerans bandini tanimlar.',
  'how-to-calculate-bolt-torque':
    'Civata torku montajin kritik parametresidir. On yuk (clamp force) tasarim ciktisidir; tork at\u00f6lye girdisidir.',
  'bearing-life-calculation-explained':
    'L10 omru ISO 281\'e gore %90 guvenilirlikte %10 ar\u0131za oranini tanimlar. (C/P)^p iliskisi AluCalc rulman cekirdegiyle aynidir.',
  'motor-power-calculation':
    'Motor boyutlandirmada P = T*n/9550 (kW) her katalogda kullanilir. Aktarim kayiplarini eklemeyi unutmayin.',
  'mechanics-of-materials-fundamentals':
    'Statik dis kuvvetleri verir; malzeme mukavemeti ic direnci inceler. sigma=F/A ve epsilon=sigma/E temelidir.',
  'mohrs-circle-stress-analysis':
    'Mohr cemberi duzlem gerilme durumlarinda asal gerilmeleri bulur. sigma1, sigma2 ve tau_max tasarim kontrollerinde kullanilir.',
  'torsion-and-buckling-mechanics':
    'Mil burulma ve ince kolon burkulma kararliligi analizidir. Euler Pcr = pi^2*E*I/(K*L)^2 formulu kritik.',
  'beam-deflection-formula-explained':
    'Servis sinirlari cogu zaman verim sinirindan once gelir. Euler-Bernoulli formulleri AluCalc kiris motorunda kullanilir.',
  'pressure-drop-calculation-guide':
    'Darcy-Weisbach boru kayiplarini hesaplar. Pompa basinc basligi ve debi boyutlandirmasinin temelidir.',
  'chip-breaker-logic':
    'CNC tornada talas kontrolu yuzey ve takim omrunu belirler. TQ geometrileri kesme kuvvetini %15-21 azaltabilir.',
};

const lessons = { ...trBundle.lessons };

for (const slug of slugs) {
  if (slug === 'engineering-units-and-standards') continue;
  const a = JSON.parse(fs.readFileSync(path.join(articlesDir, slug+'.json'),'utf8'));
  const title = titles[slug];
  lessons[slug] = {
    meta: { title, description: a.meta.description },
    hero: { h1: title, intro: TR_INTROS[slug] ?? a.hero.intro },
  };
}

const content = `export const lessons = ${JSON.stringify(lessons, null, 2)};

export const walkthroughs = {};

export const quizzes = {};

export const seoGuides = {};
`;

fs.writeFileSync('scripts/academy-i18n-data/langs/tr.mjs', content, 'utf8');
console.log('expanded tr.mjs');
