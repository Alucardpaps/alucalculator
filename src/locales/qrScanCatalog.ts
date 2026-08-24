import type { Language } from '@/store/i18nStore';

export type ScanCatalogItem = {
  code: string;
  name: string;
  type: 'profile' | 'fastener' | 'bearing';
  category: string;
  h?: number;
  b?: number;
  t?: number;
  mass: number;
  alloy?: string;
  yieldStrength?: number;
  costPerUnit: number;
  size?: string;
  length?: number;
  innerDiam?: number;
  outerDiam?: number;
  width?: number;
  dynamicLoad?: number;
};

type CatalogLocale = {
  items: Record<string, { name: string; category: string }>;
  gradeFallback: string;
};

const EN: CatalogLocale = {
  items: {
    'ALU-I2515': { name: 'I 25×15 Profile', category: 'I-Section' },
    'ALU-I4025': { name: 'I 40×25 Profile', category: 'I-Section' },
    'ALU-B2020': { name: 'Box 20×20×2 Profile', category: 'Box-Section' },
    'ALU-B4040': { name: 'Box 40×40×3 Profile', category: 'Box-Section' },
    'FAST-M8-88': { name: 'M8 Hex Bolt Grade 8.8', category: 'Fastener' },
    'FAST-M12-109': { name: 'M12 Cap Screw Grade 10.9', category: 'Fastener' },
    'BRG-608ZZ': { name: '608ZZ Radial Ball Bearing', category: 'Bearing' },
  },
  gradeFallback: 'Grade 8.8',
};

const TR: CatalogLocale = {
  items: {
    'ALU-I2515': { name: 'I 25×15 Profil', category: 'I Kesit' },
    'ALU-I4025': { name: 'I 40×25 Profil', category: 'I Kesit' },
    'ALU-B2020': { name: 'Kutu 20×20×2 Profil', category: 'Kutu Kesit' },
    'ALU-B4040': { name: 'Kutu 40×40×3 Profil', category: 'Kutu Kesit' },
    'FAST-M8-88': { name: 'M8 Altıköşe Cıvata 8.8', category: 'Bağlantı Elemanı' },
    'FAST-M12-109': { name: 'M12 Başlı Vida 10.9', category: 'Bağlantı Elemanı' },
    'BRG-608ZZ': { name: '608ZZ Radyal Bilyalı Rulman', category: 'Rulman' },
  },
  gradeFallback: '8.8 Kalite',
};

const DE: CatalogLocale = {
  items: {
    'ALU-I2515': { name: 'I 25×15 Profil', category: 'I-Profil' },
    'ALU-I4025': { name: 'I 40×25 Profil', category: 'I-Profil' },
    'ALU-B2020': { name: 'Kasten 20×20×2 Profil', category: 'Kastenprofil' },
    'ALU-B4040': { name: 'Kasten 40×40×3 Profil', category: 'Kastenprofil' },
    'FAST-M8-88': { name: 'M8 Sechskantschraube 8.8', category: 'Befestigung' },
    'FAST-M12-109': { name: 'M12 Zylinderschraube 10.9', category: 'Befestigung' },
    'BRG-608ZZ': { name: '608ZZ Rillenkugellager', category: 'Lager' },
  },
  gradeFallback: 'Klasse 8.8',
};

const ES: CatalogLocale = {
  items: {
    'ALU-I2515': { name: 'Perfil I 25×15', category: 'Perfil I' },
    'ALU-I4025': { name: 'Perfil I 40×25', category: 'Perfil I' },
    'ALU-B2020': { name: 'Perfil caja 20×20×2', category: 'Perfil caja' },
    'ALU-B4040': { name: 'Perfil caja 40×40×3', category: 'Perfil caja' },
    'FAST-M8-88': { name: 'Tornillo M8 grado 8.8', category: 'Fijación' },
    'FAST-M12-109': { name: 'Tornillo M12 grado 10.9', category: 'Fijación' },
    'BRG-608ZZ': { name: 'Rodamiento 608ZZ', category: 'Rodamiento' },
  },
  gradeFallback: 'Grado 8.8',
};

const FR: CatalogLocale = {
  items: {
    'ALU-I2515': { name: 'Profilé I 25×15', category: 'Profilé I' },
    'ALU-I4025': { name: 'Profilé I 40×25', category: 'Profilé I' },
    'ALU-B2020': { name: 'Profilé tube 20×20×2', category: 'Profilé tube' },
    'ALU-B4040': { name: 'Profilé tube 40×40×3', category: 'Profilé tube' },
    'FAST-M8-88': { name: 'Vis M8 classe 8.8', category: 'Fixation' },
    'FAST-M12-109': { name: 'Vis M12 classe 10.9', category: 'Fixation' },
    'BRG-608ZZ': { name: 'Roulement 608ZZ', category: 'Roulement' },
  },
  gradeFallback: 'Classe 8.8',
};

const IT: CatalogLocale = {
  items: {
    'ALU-I2515': { name: 'Profilo I 25×15', category: 'Profilo I' },
    'ALU-I4025': { name: 'Profilo I 40×25', category: 'Profilo I' },
    'ALU-B2020': { name: 'Profilo scatola 20×20×2', category: 'Profilo scatola' },
    'ALU-B4040': { name: 'Profilo scatola 40×40×3', category: 'Profilo scatola' },
    'FAST-M8-88': { name: 'Vite M8 classe 8.8', category: 'Fissaggio' },
    'FAST-M12-109': { name: 'Vite M12 classe 10.9', category: 'Fissaggio' },
    'BRG-608ZZ': { name: 'Cuscinetto 608ZZ', category: 'Cuscinetto' },
  },
  gradeFallback: 'Classe 8.8',
};

const PT: CatalogLocale = {
  items: {
    'ALU-I2515': { name: 'Perfil I 25×15', category: 'Perfil I' },
    'ALU-I4025': { name: 'Perfil I 40×25', category: 'Perfil I' },
    'ALU-B2020': { name: 'Perfil caixa 20×20×2', category: 'Perfil caixa' },
    'ALU-B4040': { name: 'Perfil caixa 40×40×3', category: 'Perfil caixa' },
    'FAST-M8-88': { name: 'Parafuso M8 classe 8.8', category: 'Fixação' },
    'FAST-M12-109': { name: 'Parafuso M12 classe 10.9', category: 'Fixação' },
    'BRG-608ZZ': { name: 'Rolamento 608ZZ', category: 'Rolamento' },
  },
  gradeFallback: 'Classe 8.8',
};

const RU: CatalogLocale = {
  items: {
    'ALU-I2515': { name: 'Профиль I 25×15', category: 'I-профиль' },
    'ALU-I4025': { name: 'Профиль I 40×25', category: 'I-профиль' },
    'ALU-B2020': { name: 'Коробчатый профиль 20×20×2', category: 'Коробчатый профиль' },
    'ALU-B4040': { name: 'Коробчатый профиль 40×40×3', category: 'Коробчатый профиль' },
    'FAST-M8-88': { name: 'Болт M8 класс 8.8', category: 'Крепёж' },
    'FAST-M12-109': { name: 'Винт M12 класс 10.9', category: 'Крепёж' },
    'BRG-608ZZ': { name: 'Подшипник 608ZZ', category: 'Подшипник' },
  },
  gradeFallback: 'Класс 8.8',
};

const JA: CatalogLocale = {
  items: {
    'ALU-I2515': { name: 'I形 25×15 プロファイル', category: 'I形材' },
    'ALU-I4025': { name: 'I形 40×25 プロファイル', category: 'I形材' },
    'ALU-B2020': { name: '角管 20×20×2 プロファイル', category: '角管材' },
    'ALU-B4040': { name: '角管 40×40×3 プロファイル', category: '角管材' },
    'FAST-M8-88': { name: 'M8 六角ボルト 8.8', category: '締結部品' },
    'FAST-M12-109': { name: 'M12 キャップスクリュー 10.9', category: '締結部品' },
    'BRG-608ZZ': { name: '608ZZ 深溝玉軸受', category: '軸受' },
  },
  gradeFallback: 'グレード 8.8',
};

const ZH: CatalogLocale = {
  items: {
    'ALU-I2515': { name: 'I型 25×15 型材', category: 'I型截面' },
    'ALU-I4025': { name: 'I型 40×25 型材', category: 'I型截面' },
    'ALU-B2020': { name: '方管 20×20×2 型材', category: '方管截面' },
    'ALU-B4040': { name: '方管 40×40×3 型材', category: '方管截面' },
    'FAST-M8-88': { name: 'M8 六角螺栓 8.8级', category: '紧固件' },
    'FAST-M12-109': { name: 'M12 内六角螺钉 10.9级', category: '紧固件' },
    'BRG-608ZZ': { name: '608ZZ 深沟球轴承', category: '轴承' },
  },
  gradeFallback: '8.8 级',
};

const KO: CatalogLocale = {
  items: {
    'ALU-I2515': { name: 'I형 25×15 프로필', category: 'I형 단면' },
    'ALU-I4025': { name: 'I형 40×25 프로필', category: 'I형 단면' },
    'ALU-B2020': { name: '각관 20×20×2 프로필', category: '각관 단면' },
    'ALU-B4040': { name: '각관 40×40×3 프로필', category: '각관 단면' },
    'FAST-M8-88': { name: 'M8 육각볼트 8.8', category: '체결부품' },
    'FAST-M12-109': { name: 'M12 캡스크류 10.9', category: '체결부품' },
    'BRG-608ZZ': { name: '608ZZ 볼베어링', category: '베어링' },
  },
  gradeFallback: '8.8 등급',
};

const AR: CatalogLocale = {
  items: {
    'ALU-I2515': { name: 'مقطع I 25×15', category: 'مقطع I' },
    'ALU-I4025': { name: 'مقطع I 40×25', category: 'مقطع I' },
    'ALU-B2020': { name: 'مقطع صندوقي 20×20×2', category: 'مقطع صندوقي' },
    'ALU-B4040': { name: 'مقطع صندوقي 40×40×3', category: 'مقطع صندوقي' },
    'FAST-M8-88': { name: 'برغي M8 درجة 8.8', category: 'مثبت' },
    'FAST-M12-109': { name: 'برغي M12 درجة 10.9', category: 'مثبت' },
    'BRG-608ZZ': { name: 'محمل 608ZZ', category: 'محمل' },
  },
  gradeFallback: 'درجة 8.8',
};

const LOCALE_MAP: Record<Language, CatalogLocale> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

const BASE_ITEMS: Omit<ScanCatalogItem, 'name' | 'category'>[] = [
  { code: 'ALU-I2515', type: 'profile', h: 25, b: 15, t: 2, mass: 0.23, alloy: '6063-T5', yieldStrength: 170, costPerUnit: 4.5 },
  { code: 'ALU-I4025', type: 'profile', h: 40, b: 25, t: 3, mass: 0.58, alloy: '6061-T6', yieldStrength: 275, costPerUnit: 9.8 },
  { code: 'ALU-B2020', type: 'profile', h: 20, b: 20, t: 2, mass: 0.39, alloy: '6063-T6', yieldStrength: 170, costPerUnit: 5.2 },
  { code: 'ALU-B4040', type: 'profile', h: 40, b: 40, t: 3, mass: 1.20, alloy: '6082-T6', yieldStrength: 310, costPerUnit: 14.5 },
  { code: 'FAST-M8-88', type: 'fastener', size: 'M8', length: 40, mass: 0.03, yieldStrength: 640, costPerUnit: 0.75 },
  { code: 'FAST-M12-109', type: 'fastener', size: 'M12', length: 60, mass: 0.08, yieldStrength: 940, costPerUnit: 1.95 },
  { code: 'BRG-608ZZ', type: 'bearing', innerDiam: 8, outerDiam: 22, width: 7, mass: 0.012, dynamicLoad: 3.3, costPerUnit: 1.20 },
];

export function getQRScanCatalog(locale: string): { items: ScanCatalogItem[]; gradeFallback: string } {
  const loc = LOCALE_MAP[locale as Language] ?? EN;
  const items = BASE_ITEMS.map((base) => ({
    ...base,
    name: loc.items[base.code]?.name ?? EN.items[base.code].name,
    category: loc.items[base.code]?.category ?? EN.items[base.code].category,
  }));
  return { items, gradeFallback: loc.gradeFallback };
}
