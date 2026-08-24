import type { Language } from '@/store/i18nStore';

export type BearingsOsModuleStrings = {
  filter_all: string;
  filter_deep_groove_ball: string;
  filter_angular_contact_ball: string;
  filter_tapered_roller: string;
  filter_cylindrical_roller: string;
  filter_needle_roller: string;
  filter_thrust_ball: string;
  boreAll: string;
  mass: string;
  deviationZones: string;
  bore: string;
  shaft: string;
};

const EN: BearingsOsModuleStrings = {
  "filter_all": "All Types",
  "filter_deep_groove_ball": "Deep Groove Ball (DGB)",
  "filter_angular_contact_ball": "Angular Contact (ACB)",
  "filter_tapered_roller": "Tapered Roller (TRB)",
  "filter_cylindrical_roller": "Cylindrical Roller (CRB)",
  "filter_needle_roller": "Needle Roller (NRB)",
  "filter_thrust_ball": "Thrust Ball (Thrust)",
  "boreAll": "Bore: All",
  "mass": "Mass",
  "deviationZones": "Deviation Zones (µm)",
  "bore": "Bore",
  "shaft": "Shaft"
} as BearingsOsModuleStrings;

const TR: BearingsOsModuleStrings = {
  "filter_all": "Tüm Tipler",
  "filter_deep_groove_ball": "Sabit Bilyalı (DGB)",
  "filter_angular_contact_ball": "Eğik Bilyalı (ACB)",
  "filter_tapered_roller": "Konik Makaralı (TRB)",
  "filter_cylindrical_roller": "Silindirik Makaralı (CRB)",
  "filter_needle_roller": "İğneli Makaralı (NRB)",
  "filter_thrust_ball": "Aksiyal Bilyalı (Thrust)",
  "boreAll": "İç Çap: Tümü",
  "mass": "Kütle",
  "deviationZones": "Sapma Bölgeleri (µm)",
  "bore": "Bilezik",
  "shaft": "Mil"
} as BearingsOsModuleStrings;

const DE: BearingsOsModuleStrings = {
  "filter_all": "Alle Typen",
  "filter_deep_groove_ball": "Rillenkugellager (DGB)",
  "filter_angular_contact_ball": "Schrägkugellager (ACB)",
  "filter_tapered_roller": "Kegelrollenlager (TRB)",
  "filter_cylindrical_roller": "Zylinderrollenlager (CRB)",
  "filter_needle_roller": "Nadellager (NRB)",
  "filter_thrust_ball": "Axialkugellager (Thrust)",
  "boreAll": "Bohrung: Alle",
  "mass": "Masse",
  "deviationZones": "Abweichungszonen (µm)",
  "bore": "Bohrung",
  "shaft": "Welle"
} as BearingsOsModuleStrings;

const ES: BearingsOsModuleStrings = {
  "filter_all": "Todos los Tipos",
  "filter_deep_groove_ball": "Bolita Ranura Profunda (DGB)",
  "filter_angular_contact_ball": "Contacto Angular (ACB)",
  "filter_tapered_roller": "Rodillo Cónico (TRB)",
  "filter_cylindrical_roller": "Rodillo Cilíndrico (CRB)",
  "filter_needle_roller": "Rodillo de Agujas (NRB)",
  "filter_thrust_ball": "Axial Bolita (Thrust)",
  "boreAll": "Agujero: Todos",
  "mass": "Masa",
  "deviationZones": "Zonas de Desviación (µm)",
  "bore": "Agujero",
  "shaft": "Eje"
} as BearingsOsModuleStrings;

const FR: BearingsOsModuleStrings = {
  "filter_all": "Tous les Types",
  "filter_deep_groove_ball": "Roulement à Billes (DGB)",
  "filter_angular_contact_ball": "Contact Oblique (ACB)",
  "filter_tapered_roller": "Roulement Conique (TRB)",
  "filter_cylindrical_roller": "Roulement Cylindrique (CRB)",
  "filter_needle_roller": "Roulement à Aiguilles (NRB)",
  "filter_thrust_ball": "Butée à Billes (Thrust)",
  "boreAll": "Alésage: Tous",
  "mass": "Masse",
  "deviationZones": "Zones de Déviation (µm)",
  "bore": "Alésage",
  "shaft": "Arbre"
} as BearingsOsModuleStrings;

const IT: BearingsOsModuleStrings = {
  "filter_all": "Tutti i Tipi",
  "filter_deep_groove_ball": "Cuscinetto a Sfere (DGB)",
  "filter_angular_contact_ball": "Contatto Obliquo (ACB)",
  "filter_tapered_roller": "Rullo Conico (TRB)",
  "filter_cylindrical_roller": "Rullo Cilindrico (CRB)",
  "filter_needle_roller": "Rullo a Rullini (NRB)",
  "filter_thrust_ball": "Assiale a Sfere (Thrust)",
  "boreAll": "Foro: Tutti",
  "mass": "Massa",
  "deviationZones": "Zone di Deviazione (µm)",
  "bore": "Foro",
  "shaft": "Albero"
} as BearingsOsModuleStrings;

const PT: BearingsOsModuleStrings = {
  "filter_all": "Todos os Tipos",
  "filter_deep_groove_ball": "Rolamento Rígido (DGB)",
  "filter_angular_contact_ball": "Contato Angular (ACB)",
  "filter_tapered_roller": "Rolamento Cônico (TRB)",
  "filter_cylindrical_roller": "Rolamento Cilíndrico (CRB)",
  "filter_needle_roller": "Rolamento de Agulhas (NRB)",
  "filter_thrust_ball": "Axial de Esferas (Thrust)",
  "boreAll": "Furo: Todos",
  "mass": "Massa",
  "deviationZones": "Zonas de Desvio (µm)",
  "bore": "Furo",
  "shaft": "Eixo"
} as BearingsOsModuleStrings;

const RU: BearingsOsModuleStrings = {
  "filter_all": "Все Типы",
  "filter_deep_groove_ball": "Шариковый (DGB)",
  "filter_angular_contact_ball": "Угловой Контакт (ACB)",
  "filter_tapered_roller": "Конический (TRB)",
  "filter_cylindrical_roller": "Цилиндрический (CRB)",
  "filter_needle_roller": "Игольчатый (NRB)",
  "filter_thrust_ball": "Упорный Шариковый (Thrust)",
  "boreAll": "Отверстие: Все",
  "mass": "Масса",
  "deviationZones": "Зоны Отклонения (µm)",
  "bore": "Отверстие",
  "shaft": "Вал"
} as BearingsOsModuleStrings;

const JA: BearingsOsModuleStrings = {
  "filter_all": "全タイプ",
  "filter_deep_groove_ball": "深溝玉軸受 (DGB)",
  "filter_angular_contact_ball": "アンギュラ玉軸受 (ACB)",
  "filter_tapered_roller": "円すいころ軸受 (TRB)",
  "filter_cylindrical_roller": "円筒ころ軸受 (CRB)",
  "filter_needle_roller": "針状ころ軸受 (NRB)",
  "filter_thrust_ball": "スラスト玉軸受 (Thrust)",
  "boreAll": "内径: すべて",
  "mass": "質量",
  "deviationZones": "偏差ゾーン (µm)",
  "bore": "内径",
  "shaft": "軸"
} as BearingsOsModuleStrings;

const ZH: BearingsOsModuleStrings = {
  "filter_all": "所有类型",
  "filter_deep_groove_ball": "深沟球轴承 (DGB)",
  "filter_angular_contact_ball": "角接触球轴承 (ACB)",
  "filter_tapered_roller": "圆锥滚子轴承 (TRB)",
  "filter_cylindrical_roller": "圆柱滚子轴承 (CRB)",
  "filter_needle_roller": "滚针轴承 (NRB)",
  "filter_thrust_ball": "推力球轴承 (Thrust)",
  "boreAll": "内径: 全部",
  "mass": "质量",
  "deviationZones": "偏差区 (µm)",
  "bore": "内圈",
  "shaft": "轴"
} as BearingsOsModuleStrings;

const KO: BearingsOsModuleStrings = {
  "filter_all": "모든 유형",
  "filter_deep_groove_ball": "깊은 홈 볼 베어링 (DGB)",
  "filter_angular_contact_ball": "앵귤러 컨택트 (ACB)",
  "filter_tapered_roller": "테이퍼 롤러 (TRB)",
  "filter_cylindrical_roller": "원통 롤러 (CRB)",
  "filter_needle_roller": "니들 롤러 (NRB)",
  "filter_thrust_ball": "스러스트 볼 (Thrust)",
  "boreAll": "보어: 전체",
  "mass": "질량",
  "deviationZones": "편차 구역 (µm)",
  "bore": "보어",
  "shaft": "축"
} as BearingsOsModuleStrings;

const AR: BearingsOsModuleStrings = {
  "filter_all": "جميع الأنواع",
  "filter_deep_groove_ball": "كرة أخدود عميق (DGB)",
  "filter_angular_contact_ball": "اتصال زاوي (ACB)",
  "filter_tapered_roller": "أسطواني مخروطي (TRB)",
  "filter_cylindrical_roller": "أسطواني (CRB)",
  "filter_needle_roller": "إبرة (NRB)",
  "filter_thrust_ball": "دفع كروي (Thrust)",
  "boreAll": "الثقب: الكل",
  "mass": "الكتلة",
  "deviationZones": "مناطق الانحراف (µm)",
  "bore": "الثقب",
  "shaft": "العمود"
} as BearingsOsModuleStrings;

const BY_LOCALE: Record<Language, BearingsOsModuleStrings> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getBearingsOsModuleStrings(locale: string): BearingsOsModuleStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}

export function getBearingOsFilterLabel(s: BearingsOsModuleStrings, id: string): string {
  const key = ('filter_' + id.replace(/-/g, '_')) as keyof BearingsOsModuleStrings;
  return String(s[key] ?? id);
}
