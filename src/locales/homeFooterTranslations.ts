import type { Language } from '@/store/i18nStore';

export type FooterLink = { href: string; label: string };
export type FooterColumn = { title: string; links: FooterLink[] };
export type HomeFooterStrings = {
  whatTitle: string;
  whatParagraphs: string[];
  howTitle: string;
  howParagraphs: string[];
  footerColumns: FooterColumn[];
  copyright: string;
};

const FOOTER_LINKS: FooterColumn[] = [
  {
    title: 'Mechanical',
    links: [
      { href: '/bolt-torque', label: 'Bolt Torque Calculator' },
      { href: '/bearings', label: 'Bearing Life (ISO 281)' },
      { href: '/gears', label: 'Gear Ratio Calculator' },
      { href: '/shafts', label: 'Shaft Diameter' },
      { href: '/hooke-law', label: 'Spring Constant' },
      { href: '/motor-selection-std', label: 'Motor Power' },
    ],
  },
  {
    title: 'Structural',
    links: [
      { href: '/beam-deflection', label: 'Beam Deflection' },
      { href: '/concrete-reinforcement', label: 'Concrete Reinforcement' },
      { href: '/simulation-fea', label: 'FEA Analysis' },
      { href: '/topology-optimization', label: 'Topology Optimization' },
      { href: '/machine-assembly', label: 'Machine Assembly' },
    ],
  },
  {
    title: 'Fluid and Thermal',
    links: [
      { href: '/fluid-dynamics', label: 'Pressure Drop' },
      { href: '/thermal-expansion', label: 'Heat Transfer' },
      { href: '/pumps', label: 'Pump Performance' },
      { href: '/reducer-lubrication', label: 'Gearbox Lubrication' },
      { href: '/naval-hydrostatics', label: 'Naval Hydrostatics' },
    ],
  },
  {
    title: 'Electrical',
    links: [
      { href: '/three-phase-power', label: 'Power Calculator' },
      { href: '/ohms-law', label: "Ohm's Law" },
      { href: '/voltage-drop', label: 'Voltage Drop' },
      { href: '/3-phase-power', label: '3-Phase Power' },
      { href: '/filter-design', label: 'Filter Design' },
    ],
  },
  {
    title: 'Science',
    links: [
      { href: '/physics-solver', label: 'Physics CAS Solver' },
      { href: '/failure-prediction', label: 'Failure Prediction' },
      { href: '/failure-diagnosis', label: 'Failure Diagnosis' },
      { href: '/biology-genetics', label: 'Population Genetics' },
      { href: '/digital-logic', label: 'Digital Logic Lab' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { href: '/academy?tab=calculators', label: 'All Calculators' },
      { href: '/workspace', label: 'Open Workspace' },
      { href: '/academy', label: 'Engineering Academy' },
      { href: '/', label: 'Home' },
    ],
  },
];

const EN: HomeFooterStrings = {
  whatTitle: 'What Are Engineering Calculators?',
  whatParagraphs: [
    'Engineering calculators are specialized tools that solve technical equations used in mechanical, structural, electrical, and thermal engineering. Unlike general-purpose calculators, they implement validated formulas from international standards such as ISO 281, VDI 2230, ASME PCC-1, and Euler-Bernoulli beam theory.',
    'These tools are used daily by design engineers, project engineers, manufacturing engineers, and students to verify hand calculations, perform preliminary sizing, and validate simulation results.',
    'Modern browser-based engineering calculators like AluCalc OS eliminate expensive desktop licenses. Engineers can perform accurate calculations from any device with results validated against the same standards used worldwide.',
  ],
  howTitle: 'How Engineers Use These Tools',
  howParagraphs: [
    'Professional engineers integrate online calculators into their design workflow at multiple stages. During conceptual design, quick sizing determines whether a shaft diameter, beam section, or motor rating is in the right ballpark before detailed CAD modeling.',
    'In manufacturing and field engineering, calculators serve as instant reference tools. Engineering students use them to check homework solutions and build intuition for how changing one variable affects the entire system.',
  ],
  footerColumns: FOOTER_LINKS,
  copyright: '\u00a9 2026 AluCalc Advanced Engineering Systems',
};

const TR: HomeFooterStrings = {
  whatTitle: 'M\u00fchendislik Hesaplay\u0131c\u0131lar\u0131 Nedir?',
  whatParagraphs: [
    'M\u00fchendislik hesaplay\u0131c\u0131lar\u0131, mekanik, yap\u0131sal, elektrik ve termal m\u00fchendislikte kullan\u0131lan teknik denklemleri \u00e7\u00f6zen \u00f6zel ara\u00e7lard\u0131r. ISO 281, VDI 2230, ASME PCC-1 ve Euler-Bernoulli kiri\u015f teorisi gibi uluslararas\u0131 standartlara dayan\u0131rlar.',
    'Tasar\u0131m m\u00fchendisleri, proje m\u00fchendisleri, imalat m\u00fchendisleri ve \u00f6\u011frenciler el hesaplar\u0131n\u0131 do\u011frulamak, \u00f6n boyutland\u0131rma yapmak ve sim\u00fclasyon sonu\u00e7lar\u0131n\u0131 kontrol etmek i\u00e7in g\u00fcnl\u00fck kullan\u0131r.',
    'AluCalc OS gibi taray\u0131c\u0131 tabanl\u0131 hesaplay\u0131c\u0131lar pahal\u0131 masa\u00fcst\u00fc lisanslar\u0131 ortadan kald\u0131r\u0131r. M\u00fchendisler her cihazdan, d\u00fcnya \u00e7ap\u0131nda kullan\u0131lan standartlara g\u00f6re do\u011frulanm\u0131\u015f sonu\u00e7lar al\u0131r.',
  ],
  howTitle: 'M\u00fchendisler Bu Ara\u00e7lar\u0131 Nas\u0131l Kullan\u0131r?',
  howParagraphs: [
    'Profesyonel m\u00fchendisler \u00e7evrimi\u00e7i hesaplay\u0131c\u0131lar\u0131 tasar\u0131m s\u00fcrecinin bir\u00e7ok a\u015famas\u0131na entegre eder. Konsept tasar\u0131mda h\u0131zl\u0131 boyutland\u0131rma, mil \u00e7ap\u0131 veya motor g\u00fcc\u00fcn\u00fcn do\u011fru aral\u0131kta olup olmad\u0131\u011f\u0131n\u0131 g\u00f6sterir.',
    'Imalat ve saha m\u00fchendisli\u011finde hesaplay\u0131c\u0131lar anl\u0131k referans arac\u0131d\u0131r. \u00d6\u011frenciler \u00f6dev \u00e7\u00f6z\u00fcmlerini kontrol eder ve de\u011fi\u015fkenlerin sistemi nas\u0131l etkiledi\u011fini \u00f6\u011frenir.',
  ],
  footerColumns: FOOTER_LINKS.map((col, i) => ({
    title: ['Mekanik', 'Yap\u0131sal', 'Ak\u0131\u015fkan ve Termal', 'Elektrik', 'Bilim', 'Platform'][i] ?? col.title,
    links: col.links.map((l, j) => ({
      href: l.href,
      label:
        [
          ['C\u0131vata Tork', 'Rulman \u00d6mr\u00fc', 'Di\u015fli Oran\u0131', 'Mil \u00c7ap\u0131', 'Yay Sabiti', 'Motor G\u00fcc\u00fc'],
          ['Kiri\u015f Sehimi', 'Betonarme', 'FEA Analizi', 'Topoloji Optimizasyonu', 'Makine Montaj\u0131'],
          ['Bas\u0131n\u00e7 D\u00fc\u015f\u00fcm\u00fc', 'Is\u0131 Transferi', 'Pompa', 'Red\u00fckt\u00f6r Ya\u011flama', 'Gemi Hidrostati\u011fi'],
          ['G\u00fc\u00e7', 'Ohm Kanunu', 'Gerilim D\u00fc\u015f\u00fcm\u00fc', '3 Faz G\u00fc\u00e7', 'Filtre Tasar\u0131m\u0131'],
          ['Fizik \u00c7\u00f6z\u00fcc\u00fc', 'Ar\u0131za Tahmini', 'Ar\u0131za Te\u015fhisi', 'Genetik', 'Dijital Mant\u0131k'],
          ['T\u00fcm Hesaplay\u0131c\u0131lar', 'Workspace', 'Akademi', 'Ana Sayfa'],
        ][i]?.[j] ?? l.label,
    })),
  })),
  copyright: '\u00a9 2026 AluCalc Geli\u015fmi\u015f M\u00fchendislik Sistemleri',
};

const MAP: Record<Language, HomeFooterStrings> = {
  en: EN,
  tr: TR,
  de: { ...EN, whatTitle: 'Was sind Ingenieurrechner?', howTitle: 'Wie Ingenieure diese Tools nutzen' },
  es: { ...EN, whatTitle: '\u00bfQu\u00e9 son las calculadoras de ingenier\u00eda?', howTitle: 'C\u00f3mo usan estas herramientas los ingenieros' },
  fr: { ...EN, whatTitle: "Que sont les calculateurs d'ing\u00e9nierie ?", howTitle: 'Comment les ing\u00e9nieurs utilisent ces outils' },
  it: { ...EN, whatTitle: 'Cosa sono i calcolatori ingegneristici?', howTitle: 'Come gli ingegneri usano questi strumenti' },
  pt: { ...EN, whatTitle: 'O que s\u00e3o calculadoras de engenharia?', howTitle: 'Como engenheiros usam estas ferramentas' },
  ru: { ...EN, whatTitle: '\u0427\u0442\u043e \u0442\u0430\u043a\u043e\u0435 \u0438\u043d\u0436\u0435\u043d\u0435\u0440\u043d\u044b\u0435 \u043a\u0430\u043b\u044c\u043a\u0443\u043b\u044f\u0442\u043e\u0440\u044b?', howTitle: '\u041a\u0430\u043a \u0438\u043d\u0436\u0435\u043d\u0435\u0440\u044b \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u044e\u0442 \u044d\u0442\u0438 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u044b' },
  zh: { ...EN, whatTitle: '\u4ec0\u4e48\u662f\u5de5\u7a0b\u8ba1\u7b97\u5668\uff1f', howTitle: '\u5de5\u7a0b\u5e08\u5982\u4f55\u4f7f\u7528\u8fd9\u4e9b\u5de5\u5177' },
  ja: { ...EN, whatTitle: '\u5de5\u5b66\u8a08\u7b97\u6a5f\u3068\u306f\uff1f', howTitle: '\u30a8\u30f3\u30b8\u30cb\u30a2\u306f\u3053\u306e\u30c4\u30fc\u30eb\u3092\u3069\u3046\u4f7f\u3046\u304b' },
  ko: { ...EN, whatTitle: '\uacf5\ud559 \uacc4\uc0b0\uae30\ub780?', howTitle: '\uc5d4\uc9c0\ub2c8\uc5b4\uac00 \uc774 \ub3c4\uad6c\ub97c \uc0ac\uc6a9\ud558\ub294 \ubc29\ubc95' },
  ar: { ...EN, whatTitle: '\u0645\u0627 \u0647\u064a \u062d\u0627\u0633\u0628\u0627\u062a \u0627\u0644\u0647\u0646\u062f\u0633\u0629\u061f', howTitle: '\u0643\u064a\u0641 \u064a\u0633\u062a\u062e\u062f\u0645 \u0627\u0644\u0645\u0647\u0646\u062f\u0633\u0648\u0646 \u0647\u0630\u0647 \u0627\u0644\u0623\u062f\u0648\u0627\u062a' },
};

export function getHomeFooterStrings(locale: string): HomeFooterStrings {
  return MAP[locale as Language] ?? EN;
}
