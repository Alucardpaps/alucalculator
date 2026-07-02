/**
 * Generates page-client locale TS bundles.
 * Run: node scripts/generate-page-clients-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'src/locales');
const LANGS = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'ar'];

function emit(typeName, getterName, EN, LOCALES, extra = '') {
  const bundles = { en: EN };
  for (const lang of LANGS) {
    if (lang === 'en') continue;
    bundles[lang] = { ...EN, ...(LOCALES[lang] ?? {}) };
  }
  const typeBody = Object.keys(EN).map((k) => `  ${k}: string;`).join('\n');
  return `import type { Language } from '@/store/i18nStore';

export type ${typeName} = {
${typeBody}
};

const EN: ${typeName} = ${JSON.stringify(EN, null, 2)} as ${typeName};

${LANGS.filter((l) => l !== 'en')
  .map((lang) => `const ${lang.toUpperCase()}: ${typeName} = ${JSON.stringify(bundles[lang], null, 2)} as ${typeName};`)
  .join('\n\n')}

const BY_LOCALE: Record<Language, ${typeName}> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function ${getterName}(locale: string): ${typeName} {
  return BY_LOCALE[locale as Language] ?? EN;
}
${extra}`;
}

function write(name, typeName, getter, EN, LOCALES, extra = '') {
  fs.writeFileSync(path.join(OUT, name), emit(typeName, getter, EN, LOCALES, extra), 'utf8');
}

// ─── Strength ───────────────────────────────────────────────────────────────
const STRENGTH_EN = {
  mode_principal: 'Principal Stress', mode_vonMises: 'Von Mises', mode_fatigue: 'Fatigue', mode_buckling: 'Buckling',
  mode_beam: 'Beam', mode_torsion: 'Torsion', mode_pressure: 'Pressure Vessel', mode_combined: 'Combined',
  shape_box: 'Hollow Box', shape_pipe: 'Pipe/Tube', shape_bar: 'Solid Round', shape_sheet: 'Flat Sheet',
  shape_rectangle: 'Solid Rectangle', shape_ibeam: 'I-Beam', shape_channel: 'C-Channel', shape_angle: 'L-Angle', shape_tee: 'T-Section',
  shapeSelection: 'Shape Selection', manual: 'Manual', fromShape: 'From Shape', profileView: 'Profile View',
  stress2D: '2D Stress State', fatigueLoading: 'Fatigue Loading', altSigma: 'Alternating (σa)', meanSigma: 'Mean (σm)',
  columnParams: 'Column Parameters', lengthL: 'Length (L)', appliedLoad: 'Applied Load', endCondition: 'End Condition',
  beamParams: 'Beam Parameters', shaftParams: 'Shaft Parameters', length: 'Length', outerDia: 'Outer Dia (D)',
  innerDia: 'Inner Dia (d)', solidShaftHint: 'Inner dia 0 = solid shaft', pressureVessel: 'Pressure Vessel',
  internalPressure: 'Internal Pressure (p)', innerRadius: 'Inner Radius (ri)', wallThickness: 'Wall Thickness (t)',
  combinedLoading: 'Combined Loading', axialF: 'Axial (F)', bendingM: 'Bending (M)', safetyFactor: 'Safety Factor',
  criticalLoad: 'Critical Load (Pcr)', maxDeflection: 'Max Deflection', maxStress: 'Max Stress',
  maxShearStress: 'Max Shear Stress', angleOfTwist: 'Angle of Twist', hoopStress: 'Hoop (σh)', axialStress: 'Axial (σa)',
  theory: 'Theory', widthB: 'Width (B)', heightH: 'Height (H)', wallT: 'Wall (t)', diameterD: 'Diameter (D)',
  thicknessT: 'Thickness (t)', flangeWidth: 'Flange Width', flangeThick: 'Flange Thick.', webThick: 'Web Thick.',
  legLength: 'Leg Length',
};

const STRENGTH_TR = {
  mode_principal: 'Asal Gerilme', mode_vonMises: 'Von Mises', mode_fatigue: 'Yorulma', mode_buckling: 'Burkulma',
  mode_beam: 'Kiriş', mode_torsion: 'Burulma', mode_pressure: 'Basınçlı Kap', mode_combined: 'Kombine',
  shape_box: 'Kutu Profil', shape_pipe: 'Boru', shape_bar: 'Masif Çubuk', shape_sheet: 'Levha',
  shape_rectangle: 'Masif Dikdörtgen', shape_ibeam: 'I Profil', shape_channel: 'C Profil', shape_angle: 'Köşebent', shape_tee: 'T Profil',
  shapeSelection: 'Şekil Seçimi', manual: 'Manuel', fromShape: 'Şekilden', profileView: 'Profil Görünümü',
  stress2D: '2B Gerilme Durumu', fatigueLoading: 'Yorulma Yükleri', altSigma: 'Değişken (σa)', meanSigma: 'Ortalama (σm)',
  columnParams: 'Kolon Parametreleri', lengthL: 'Uzunluk (L)', appliedLoad: 'Uygulanan Yük', endCondition: 'Mesnet Koşulu',
  beamParams: 'Kiriş Parametreleri', shaftParams: 'Mil Parametreleri', length: 'Uzunluk', outerDia: 'Dış Çap (D)',
  innerDia: 'İç Çap (d)', solidShaftHint: 'İç çap 0 = masif mil', pressureVessel: 'Basınçlı Kap',
  internalPressure: 'İç Basınç (p)', innerRadius: 'İç Yarıçap (ri)', wallThickness: 'Et Kalınlığı (t)',
  combinedLoading: 'Kombine Yükleme', axialF: 'Eksenel (F)', bendingM: 'Moment (M)', safetyFactor: 'Güvenlik K.',
  criticalLoad: 'Kritik Yük (Pcr)', maxDeflection: 'Maks Sehim', maxStress: 'Maks Gerilme',
  maxShearStress: 'Maks Kayma Ger.', angleOfTwist: 'Burulma Açısı', hoopStress: 'Çevresel (σh)', axialStress: 'Eksenel (σa)',
  theory: 'Teori', widthB: 'Genişlik (B)', heightH: 'Yükseklik (H)', wallT: 'Et Kalınlığı (t)', diameterD: 'Çap (D)',
  thicknessT: 'Kalınlık (t)', flangeWidth: 'Flanş Genişliği', flangeThick: 'Flanş Kalınlığı', webThick: 'Gövde Kalınlığı',
  legLength: 'Bacak Uzunluğu',
};

const STRENGTH_DE = {
  mode_principal: 'Hauptspannung', mode_fatigue: 'Ermüdung', mode_buckling: 'Knickung', mode_beam: 'Balken',
  mode_torsion: 'Torsion', mode_pressure: 'Druckbehälter', mode_combined: 'Kombiniert',
  shape_box: 'Hohlprofil', shape_pipe: 'Rohr', shape_bar: 'Vollrund', shape_sheet: 'Blech',
  shape_rectangle: 'Vollrechteck', shape_ibeam: 'I-Profil', shape_channel: 'U-Profil', shape_angle: 'Winkel', shape_tee: 'T-Profil',
  shapeSelection: 'Profilauswahl', manual: 'Manuell', fromShape: 'Aus Profil', profileView: 'Profilansicht',
  stress2D: '2D-Spannungszustand', fatigueLoading: 'Ermüdungslast', altSigma: 'Wechsel (σa)', meanSigma: 'Mittel (σm)',
  columnParams: 'Stützenparameter', lengthL: 'Länge (L)', appliedLoad: 'Aufgebrachte Last', endCondition: 'Lagerung',
  beamParams: 'Balkenparameter', shaftParams: 'Wellenparameter', length: 'Länge', outerDia: 'Außendurchmesser (D)',
  innerDia: 'Innendurchmesser (d)', solidShaftHint: 'Innendurchmesser 0 = Vollwelle', pressureVessel: 'Druckbehälter',
  internalPressure: 'Innendruck (p)', innerRadius: 'Innenradius (ri)', wallThickness: 'Wandstärke (t)',
  combinedLoading: 'Kombinierte Belastung', axialF: 'Axial (F)', bendingM: 'Biegung (M)', safetyFactor: 'Sicherheit',
  criticalLoad: 'Kritische Last (Pcr)', maxDeflection: 'Max. Durchbiegung', maxStress: 'Max. Spannung',
  maxShearStress: 'Max. Schubspannung', angleOfTwist: 'Verdrehwinkel', hoopStress: 'Umfang (σh)', axialStress: 'Axial (σa)',
  theory: 'Theorie', widthB: 'Breite (B)', heightH: 'Höhe (H)', wallT: 'Wand (t)', diameterD: 'Durchmesser (D)',
  thicknessT: 'Dicke (t)', flangeWidth: 'Flanschbreite', flangeThick: 'Flanschdicke', webThick: 'Stegdicke', legLength: 'Schenkellänge',
};

const mk = (tr, de, es, fr, it, pt, ru, ja, zh, ko, ar) => ({ tr, de, es, fr, it, pt, ru, ja, zh, ko, ar });

// Spread other langs from DE/ES patterns - merge into STRENGTH_LOCALES
const STRENGTH_LOCALES = mk(STRENGTH_TR, STRENGTH_DE, {
  mode_principal: 'Tensión principal', mode_fatigue: 'Fatiga', mode_buckling: 'Pandeo', mode_beam: 'Viga',
  mode_torsion: 'Torsión', mode_pressure: 'Recipiente a presión', mode_combined: 'Combinada',
  shapeSelection: 'Selección de perfil', manual: 'Manual', fromShape: 'Desde perfil', profileView: 'Vista de perfil',
  stress2D: 'Estado de tensiones 2D', fatigueLoading: 'Carga de fatiga', safetyFactor: 'Factor de seguridad',
  theory: 'Teoría',
}, {
  mode_principal: 'Contrainte principale', mode_fatigue: 'Fatigue', mode_buckling: 'Flambement', mode_beam: 'Poutre',
  mode_torsion: 'Torsion', mode_pressure: 'Réservoir sous pression', mode_combined: 'Combinée',
  shapeSelection: 'Sélection de profil', manual: 'Manuel', fromShape: 'Depuis profil', profileView: 'Vue du profil',
  stress2D: 'État de contrainte 2D', fatigueLoading: 'Chargement de fatigue', safetyFactor: 'Facteur de sécurité',
  theory: 'Théorie',
}, {
  mode_principal: 'Tensione principale', mode_fatigue: 'Fatica', mode_buckling: 'Instabilità', mode_beam: 'Trave',
  mode_torsion: 'Torsione', mode_pressure: 'Recipiente a pressione', mode_combined: 'Combinata',
  shapeSelection: 'Selezione profilo', safetyFactor: 'Fattore di sicurezza', theory: 'Teoria',
}, {
  mode_principal: 'Tensão principal', mode_fatigue: 'Fadiga', mode_buckling: 'Flambagem', mode_beam: 'Viga',
  mode_torsion: 'Torção', mode_pressure: 'Vaso sob pressão', mode_combined: 'Combinada',
  shapeSelection: 'Seleção de perfil', safetyFactor: 'Fator de segurança', theory: 'Teoria',
}, {
  mode_principal: 'Главное напряжение', mode_fatigue: 'Усталость', mode_buckling: 'Потеря устойчивости', mode_beam: 'Балка',
  mode_torsion: 'Кручение', mode_pressure: 'Сосуд под давлением', mode_combined: 'Комбинированная',
  shapeSelection: 'Выбор сечения', safetyFactor: 'Запас прочности', theory: 'Теория',
}, {
  mode_principal: '主応力', mode_fatigue: '疲労', mode_buckling: '座屈', mode_beam: 'はり',
  mode_torsion: 'ねじり', mode_pressure: '圧力容器', mode_combined: '複合',
  shapeSelection: '形状選択', manual: '手動', fromShape: '形状から', profileView: 'プロファイル表示',
  stress2D: '2次元応力状態', fatigueLoading: '疲労荷重', safetyFactor: '安全率', theory: '理論',
}, {
  mode_principal: '主应力', mode_fatigue: '疲劳', mode_buckling: '屈曲', mode_beam: '梁',
  mode_torsion: '扭转', mode_pressure: '压力容器', mode_combined: '组合',
  shapeSelection: '截面选择', manual: '手动', fromShape: '从截面', profileView: '截面视图',
  stress2D: '二维应力状态', fatigueLoading: '疲劳载荷', safetyFactor: '安全系数', theory: '理论',
}, {
  mode_principal: '주응력', mode_fatigue: '피로', mode_buckling: '좌굴', mode_beam: '보',
  mode_torsion: '비틀림', mode_pressure: '압력 용기', mode_combined: '복합',
  shapeSelection: '형상 선택', manual: '수동', fromShape: '형상에서', profileView: '프로파일 보기',
  stress2D: '2D 응력 상태', fatigueLoading: '피로 하중', safetyFactor: '안전 계수', theory: '이론',
}, {
  mode_principal: 'الإجهاد الرئيسي', mode_fatigue: 'الإجهاد', mode_buckling: 'الانبعاج', mode_beam: 'العتبة',
  mode_torsion: 'الالتواء', mode_pressure: 'وعاء الضغط', mode_combined: 'مركب',
  shapeSelection: 'اختيار المقطع', manual: 'يدوي', fromShape: 'من المقطع', profileView: 'عرض المقطع',
  stress2D: 'حالة إجهاد ثنائية', fatigueLoading: 'حمل الإجهاد', safetyFactor: 'عامل الأمان', theory: 'النظرية',
});

const strengthExtra = `
export function getStrengthModeLabel(s: StrengthPageStrings, id: string): string {
  const key = ('mode_' + id) as keyof StrengthPageStrings;
  return String(s[key] ?? id);
}
export function getStrengthShapeLabel(s: StrengthPageStrings, shape: string): string {
  const key = ('shape_' + shape) as keyof StrengthPageStrings;
  return String(s[key] ?? shape);
}
`;

write('strengthPageTranslations.ts', 'StrengthPageStrings', 'getStrengthPageStrings', STRENGTH_EN, STRENGTH_LOCALES, strengthExtra);

// ─── Bearings ───────────────────────────────────────────────────────────────
const BEARINGS_EN = {
  searchSkf: 'Search SKF Code', loadingConditions: 'Loading Conditions',
  filter_all: 'All Types', filter_deep_groove_ball: 'Deep Groove', filter_angular_contact_ball: 'Angular Contact',
  filter_tapered_roller: 'Tapered Roller', filter_cylindrical_roller: 'Cylindrical', filter_needle_roller: 'Needle',
  filter_thrust_ball: 'Thrust Ball', life_excellent: 'Excellent', life_good: 'Good', life_acceptable: 'Acceptable',
};
const BEARINGS_TR = {
  searchSkf: 'SKF Kod Ara', loadingConditions: 'Yükleme Koşulları',
  filter_all: 'Tüm Tipler', filter_deep_groove_ball: 'Sabit Bilyalı', filter_angular_contact_ball: 'Açısal Temaslı',
  filter_tapered_roller: 'Konik Makaralı', filter_cylindrical_roller: 'Silindirik', filter_needle_roller: 'İğne Makaralı',
  filter_thrust_ball: 'Eksenel Bilyalı',
};
const BEARINGS_LOCALES = mk(BEARINGS_TR, {
  searchSkf: 'SKF-Code suchen', loadingConditions: 'Belastungsbedingungen',
  filter_all: 'Alle Typen', filter_deep_groove_ball: 'Rillenkugellager', filter_angular_contact_ball: 'Schrägkugellager',
  filter_tapered_roller: 'Kegelrollenlager', filter_cylindrical_roller: 'Zylinderrollenlager',
  filter_needle_roller: 'Nadellager', filter_thrust_ball: 'Axialkugellager',
}, { searchSkf: 'Buscar código SKF', loadingConditions: 'Condiciones de carga', filter_all: 'Todos los tipos' },
{ searchSkf: 'Rechercher code SKF', loadingConditions: 'Conditions de charge', filter_all: 'Tous les types' },
{ searchSkf: 'Cerca codice SKF', loadingConditions: 'Condizioni di carico', filter_all: 'Tutti i tipi' },
{ searchSkf: 'Pesquisar código SKF', loadingConditions: 'Condições de carga', filter_all: 'Todos os tipos' },
{ searchSkf: 'Поиск кода SKF', loadingConditions: 'Условия нагрузки', filter_all: 'Все типы' },
{ searchSkf: 'SKFコード検索', loadingConditions: '荷重条件', filter_all: '全タイプ' },
{ searchSkf: '搜索 SKF 代号', loadingConditions: '载荷条件', filter_all: '所有类型' },
{ searchSkf: 'SKF 코드 검색', loadingConditions: '하중 조건', filter_all: '모든 유형' },
{ searchSkf: 'بحث رمز SKF', loadingConditions: 'ظروف التحميل', filter_all: 'جميع الأنواع' });

const bearingsExtra = `
export function getBearingFilterLabel(s: BearingsPageStrings, id: string): string {
  const key = ('filter_' + id) as keyof BearingsPageStrings;
  return String(s[key] ?? id);
}
`;

write('bearingsPageTranslations.ts', 'BearingsPageStrings', 'getBearingsPageStrings', BEARINGS_EN, BEARINGS_LOCALES, bearingsExtra);

// ─── Handbook ─────────────────────────────────────────────────────────────────
const HANDBOOK_EN = {
  filterPlaceholder: 'Filter...', type: 'Type', width: 'Width', fitGrade: 'Fit / Grade', application: 'Application',
  tableInProgress: 'Table construction in progress...', gCodesTitle: 'G & M Codes',
  material: 'Material', category: 'Category', density: 'Density (g/cm³)', yield: 'Yield (MPa)', tensile: 'Tensile (MPa)', hardness: 'Hardness',
};
const HANDBOOK_TR = {
  filterPlaceholder: 'Ara...', type: 'Tip', width: 'Genişlik', fitGrade: 'Tolerans', application: 'Uygulama',
  tableInProgress: 'Bu tablo hazırlanıyor...',
};
const HANDBOOK_LOCALES = mk(HANDBOOK_TR, {
  filterPlaceholder: 'Filtern...', type: 'Typ', width: 'Breite', fitGrade: 'Passung / Güte', application: 'Anwendung',
  tableInProgress: 'Tabelle wird erstellt...',
}, { filterPlaceholder: 'Filtrar...', type: 'Tipo', width: 'Ancho', fitGrade: 'Ajuste / Grado', application: 'Aplicación', tableInProgress: 'Tabla en construcción...' },
{ filterPlaceholder: 'Filtrer...', type: 'Type', width: 'Largeur', fitGrade: 'Ajustement / Classe', application: 'Application', tableInProgress: 'Table en cours de construction...' },
{ filterPlaceholder: 'Filtra...', type: 'Tipo', width: 'Larghezza', fitGrade: 'Accoppiamento / Classe', application: 'Applicazione', tableInProgress: 'Tabella in costruzione...' },
{ filterPlaceholder: 'Filtrar...', type: 'Tipo', width: 'Largura', fitGrade: 'Ajuste / Classe', application: 'Aplicação', tableInProgress: 'Tabela em construção...' },
{ filterPlaceholder: 'Фильтр...', type: 'Тип', width: 'Ширина', fitGrade: 'Посадка / Класс', application: 'Применение', tableInProgress: 'Таблица в разработке...' },
{ filterPlaceholder: 'フィルター...', type: '形式', width: '幅', fitGrade: 'はめあい / 等級', application: '用途', tableInProgress: 'テーブル準備中...' },
{ filterPlaceholder: '筛选...', type: '类型', width: '宽度', fitGrade: '配合 / 等级', application: '应用', tableInProgress: '表格建设中...' },
{ filterPlaceholder: '필터...', type: '유형', width: '폭', fitGrade: '끼움 / 등급', application: '적용', tableInProgress: '표 구성 중...' },
{ filterPlaceholder: 'تصفية...', type: 'النوع', width: 'العرض', fitGrade: 'المطابقة / الدرجة', application: 'التطبيق', tableInProgress: 'الجدول قيد الإنشاء...' });

write('handbookPageClientTranslations.ts', 'HandbookPageClientStrings', 'getHandbookPageClientStrings', HANDBOOK_EN, HANDBOOK_LOCALES);

// ─── Fits ─────────────────────────────────────────────────────────────────────
const FITS_EN = {
  hole: 'HOLE', shaft: 'SHAFT', fitClass: 'Fit Class', customFit: 'Custom Fit',
  clearanceFits: 'Clearance Fits', transitionFits: 'Transition Fits', interferenceFits: 'Interference Fits',
  holeInternal: 'HOLE (Internal)', shaftExternal: 'SHAFT (External)',
  clearanceFit: 'CLEARANCE FIT', interferenceFit: 'INTERFERENCE FIT', transitionFit: 'TRANSITION FIT',
  minGap: 'Min Gap (μm)', maxInterference: 'Max Interference (μm)', maxGap: 'Max Gap (μm)', minInterference: 'Min Interference (μm)',
  holeTol: 'Hole Tol', shaftTol: 'Shaft Tol', nominal: 'Nominal', maxMm: 'Max (mm)', minMm: 'Min (mm)', tolUm: 'Tol (μm)',
  holeLabel: 'Hole', shaftLabel: 'Shaft',
};
const FITS_TR = {
  hole: 'DELİK', shaft: 'MİL', fitClass: 'Geçme Sınıfı', customFit: 'Özel Geçme',
  clearanceFits: 'Boşluklu Geçmeler', transitionFits: 'Ara Geçmeler', interferenceFits: 'Sıkı Geçmeler',
  holeInternal: 'DELİK (İç Çap)', shaftExternal: 'MİL (Dış Çap)',
  clearanceFit: 'BOŞLUKLU GEÇME', interferenceFit: 'SIKI GEÇME', transitionFit: 'ARA GEÇME',
  minGap: 'Min Boşluk (μm)', maxInterference: 'Maks Sıkılık (μm)', maxGap: 'Maks Boşluk (μm)', minInterference: 'Min Sıkılık (μm)',
  holeTol: 'Delik Tol.', shaftTol: 'Mil Tol.', nominal: 'Nominal', maxMm: 'Maks (mm)', minMm: 'Min (mm)', tolUm: 'Tol (μm)',
  holeLabel: 'Delik', shaftLabel: 'Mil',
};
const FITS_DE = {
  hole: 'BOHRUNG', shaft: 'WELLE', fitClass: 'Passungsklasse', customFit: 'Benutzerdefinierte Passung',
  clearanceFits: 'Spielpassungen', transitionFits: 'Übergangspassungen', interferenceFits: 'Presspassungen',
  holeInternal: 'BOHRUNG (Innen)', shaftExternal: 'WELLE (Außen)',
  clearanceFit: 'SPIELPASSUNG', interferenceFit: 'PRESSPASSUNG', transitionFit: 'ÜBERGANGSPASSUNG',
  minGap: 'Min. Spiel (μm)', maxInterference: 'Max. Pressung (μm)', maxGap: 'Max. Spiel (μm)', minInterference: 'Min. Pressung (μm)',
  holeTol: 'Bohrung Tol.', shaftTol: 'Welle Tol.', nominal: 'Nennmaß', maxMm: 'Max (mm)', minMm: 'Min (mm)', tolUm: 'Tol (μm)',
  holeLabel: 'Bohrung', shaftLabel: 'Welle',
};
const FITS_LOCALES = mk(FITS_TR, FITS_DE,
{ hole: 'AGUJERO', shaft: 'EJE', fitClass: 'Clase de ajuste', customFit: 'Ajuste personalizado',
  clearanceFits: 'Ajustes con holgura', transitionFits: 'Ajustes de transición', interferenceFits: 'Ajustes con interferencia',
  holeInternal: 'AGUJERO (Interno)', shaftExternal: 'EJE (Externo)',
  clearanceFit: 'AJUSTE CON HOLGURA', interferenceFit: 'AJUSTE CON INTERFERENCIA', transitionFit: 'AJUSTE DE TRANSICIÓN',
  minGap: 'Holgura mín (μm)', maxInterference: 'Interferencia máx (μm)', maxGap: 'Holgura máx (μm)', minInterference: 'Interferencia mín (μm)',
  holeTol: 'Tol. agujero', shaftTol: 'Tol. eje', nominal: 'Nominal', maxMm: 'Máx (mm)', minMm: 'Mín (mm)', tolUm: 'Tol (μm)',
  holeLabel: 'Agujero', shaftLabel: 'Eje' },
{ hole: 'TROU', shaft: 'ARBRE', fitClass: 'Classe d\'ajustement', customFit: 'Ajustement personnalisé',
  clearanceFits: 'Ajustements avec jeu', transitionFits: 'Ajustements de transition', interferenceFits: 'Ajustements serrés',
  holeInternal: 'TROU (Interne)', shaftExternal: 'ARBRE (Externe)',
  clearanceFit: 'AJUSTEMENT AVEC JEU', interferenceFit: 'AJUSTEMENT SERRÉ', transitionFit: 'AJUSTEMENT DE TRANSITION',
  minGap: 'Jeu min (μm)', maxInterference: 'Serrage max (μm)', maxGap: 'Jeu max (μm)', minInterference: 'Serrage min (μm)',
  holeTol: 'Tol. trou', shaftTol: 'Tol. arbre', nominal: 'Nominale', maxMm: 'Max (mm)', minMm: 'Min (mm)', tolUm: 'Tol (μm)',
  holeLabel: 'Trou', shaftLabel: 'Arbre' },
{ hole: 'FORO', shaft: 'ALBERO', fitClass: 'Classe di accoppiamento', customFit: 'Accoppiamento personalizzato',
  clearanceFits: 'Accoppiamenti con gioco', transitionFits: 'Accoppiamenti di transizione', interferenceFits: 'Accoppiamenti forzati',
  holeInternal: 'FORO (Interno)', shaftExternal: 'ALBERO (Esterno)',
  clearanceFit: 'ACCOPIAMENTO CON GIOCO', interferenceFit: 'ACCOPIAMENTO FORZATO', transitionFit: 'ACCOPIAMENTO DI TRANSIZIONE',
  minGap: 'Gioco min (μm)', maxInterference: 'Serraggio max (μm)', maxGap: 'Gioco max (μm)', minInterference: 'Serraggio min (μm)',
  holeTol: 'Tol. foro', shaftTol: 'Tol. albero', nominal: 'Nominale', maxMm: 'Max (mm)', minMm: 'Min (mm)', tolUm: 'Tol (μm)',
  holeLabel: 'Foro', shaftLabel: 'Albero' },
{ hole: 'FURO', shaft: 'EIXO', fitClass: 'Classe de ajuste', customFit: 'Ajuste personalizado',
  clearanceFits: 'Ajustes com folga', transitionFits: 'Ajustes de transição', interferenceFits: 'Ajustes com interferência',
  holeInternal: 'FURO (Interno)', shaftExternal: 'EIXO (Externo)',
  clearanceFit: 'AJUSTE COM FOLGA', interferenceFit: 'AJUSTE COM INTERFERÊNCIA', transitionFit: 'AJUSTE DE TRANSIÇÃO',
  minGap: 'Folga mín (μm)', maxInterference: 'Interferência máx (μm)', maxGap: 'Folga máx (μm)', minInterference: 'Interferência mín (μm)',
  holeTol: 'Tol. furo', shaftTol: 'Tol. eixo', nominal: 'Nominal', maxMm: 'Máx (mm)', minMm: 'Mín (mm)', tolUm: 'Tol (μm)',
  holeLabel: 'Furo', shaftLabel: 'Eixo' },
{ hole: 'ОТВЕРСТИЕ', shaft: 'ВАЛ', fitClass: 'Класс посадки', customFit: 'Пользовательская посадка',
  clearanceFits: 'Посадки с зазором', transitionFits: 'Переходные посадки', interferenceFits: 'Натяжные посадки',
  holeInternal: 'ОТВЕРСТИЕ (Внутр.)', shaftExternal: 'ВАЛ (Наруж.)',
  clearanceFit: 'ПОСАДКА С ЗАЗОРОМ', interferenceFit: 'НАТЯЖНАЯ ПОСАДКА', transitionFit: 'ПЕРЕХОДНАЯ ПОСАДКА',
  minGap: 'Мин. зазор (μm)', maxInterference: 'Макс. натяг (μm)', maxGap: 'Макс. зазор (μm)', minInterference: 'Мин. натяг (μm)',
  holeTol: 'Доп. отв.', shaftTol: 'Доп. вал', nominal: 'Номинал', maxMm: 'Макс (mm)', minMm: 'Мин (mm)', tolUm: 'Доп (μm)',
  holeLabel: 'Отверстие', shaftLabel: 'Вал' },
{ hole: '穴', shaft: '軸', fitClass: 'はめあいクラス', customFit: 'カスタムはめあい',
  clearanceFits: 'すきまばめ', transitionFits: '中間ばめ', interferenceFits: 'しまりばめ',
  holeInternal: '穴公差 (内径)', shaftExternal: '軸公差 (外径)',
  clearanceFit: 'すきまばめ', interferenceFit: 'しまりばめ', transitionFit: '中間ばめ',
  minGap: '最小すきま (μm)', maxInterference: '最大しめしろ (μm)', maxGap: '最大すきま (μm)', minInterference: '最小しめしろ (μm)',
  holeTol: '穴公差', shaftTol: '軸公差', nominal: '基準寸法', maxMm: '最大 (mm)', minMm: '最小 (mm)', tolUm: '公差 (μm)',
  holeLabel: '穴', shaftLabel: '軸' },
{ hole: '孔', shaft: '轴', fitClass: '配合等级', customFit: '自定义配合',
  clearanceFits: '间隙配合', transitionFits: '过渡配合', interferenceFits: '过盈配合',
  holeInternal: '孔 (内径)', shaftExternal: '轴 (外径)',
  clearanceFit: '间隙配合', interferenceFit: '过盈配合', transitionFit: '过渡配合',
  minGap: '最小间隙 (μm)', maxInterference: '最大过盈 (μm)', maxGap: '最大间隙 (μm)', minInterference: '最小过盈 (μm)',
  holeTol: '孔公差', shaftTol: '轴公差', nominal: '公称尺寸', maxMm: '最大 (mm)', minMm: '最小 (mm)', tolUm: '公差 (μm)',
  holeLabel: '孔', shaftLabel: '轴' },
{ hole: '구멍', shaft: '축', fitClass: '끼움 등급', customFit: '사용자 정의 끼움',
  clearanceFits: '여유 끼움', transitionFits: '과도 끼움', interferenceFits: '압입 끼움',
  holeInternal: '구멍 (내경)', shaftExternal: '축 (외경)',
  clearanceFit: '여유 끼움', interferenceFit: '압입 끼움', transitionFit: '과도 끼움',
  minGap: '최소 간격 (μm)', maxInterference: '최대 압입 (μm)', maxGap: '최대 간격 (μm)', minInterference: '최소 압입 (μm)',
  holeTol: '구멍 공차', shaftTol: '축 공차', nominal: '공칭', maxMm: '최대 (mm)', minMm: '최소 (mm)', tolUm: '공차 (μm)',
  holeLabel: '구멍', shaftLabel: '축' },
{ hole: 'الثقب', shaft: 'العمود', fitClass: 'فئة المطابقة', customFit: 'مطابقة مخصصة',
  clearanceFits: 'مطابقات بفجوة', transitionFits: 'مطابقات انتقالية', interferenceFits: 'مطابقات ضغط',
  holeInternal: 'الثقب (داخلي)', shaftExternal: 'العمود (خارجي)',
  clearanceFit: 'مطابقة بفجوة', interferenceFit: 'مطابقة ضغط', transitionFit: 'مطابقة انتقالية',
  minGap: 'أدنى فجوة (μm)', maxInterference: 'أقصى ضغط (μm)', maxGap: 'أقصى فجوة (μm)', minInterference: 'أدنى ضغط (μm)',
  holeTol: 'تسامح الثقب', shaftTol: 'تسامح العمود', nominal: 'الاسمي', maxMm: 'الأقصى (mm)', minMm: 'الأدنى (mm)', tolUm: 'التسامح (μm)',
  holeLabel: 'الثقب', shaftLabel: 'العمود' });
write('fitsModuleTranslations.ts', 'FitsModuleStrings', 'getFitsModuleStrings', FITS_EN, FITS_LOCALES);

// ─── Fastener schematic ───────────────────────────────────────────────────────
const FASTENER_EN = {
  pipeNotSupported: 'Pipe thread model illustration not supported.',
  selectMetricUnc: 'Please select metric or UNC bolt sizes for interactive diagram.',
  hoverHint: 'HOVER PARTS TO DEEP-DIVE DIMENSIONS',
  headDesc: 'Head width and thickness', hexSize: 'Hex Size (s)', headHeight: 'Head Height (k)', bearingDia: 'Bearing Dia (dw)',
  shankDesc: 'Smooth unthreaded body section', nominalDia: 'Nominal Dia (d)', shankLength: 'Shank Length',
  threadDesc: 'Threaded zone subject to tensile load', minorDia: 'Minor Dia (d3)', pitchDia: 'Pitch Dia (d2)', pitch: 'Pitch (P)', stressArea: 'Stress Area (As)',
  platesTitle: 'Clamped Joint Plates', platesDesc: 'Total thickness of clamped materials', gripLength: 'Grip Length (LG)', clearanceHole: 'Clearance Hole (dh)',
  nutDesc: 'Threaded female locking element', nutHeight: 'Nut Height (m)', threadClass: 'Thread Class',
  washerDesc: 'Load distributing washers', washerDia: 'Washer Dia (dw)',
};
const FASTENER_TR = {
  pipeNotSupported: 'Boru dişi görseli desteklenmemektedir.', selectMetricUnc: 'Lütfen metrik veya UNC cıvata boyutlarını seçin.',
  hoverHint: 'ÖLÇÜLER İÇİN CIVATA ÜZERİNE GELİN', headDesc: 'Kafa anahtar ağzı ve kalınlığı', hexSize: 'Anahtar Ağzı (s)', headHeight: 'Kafa Yüksekliği (k)', bearingDia: 'Kafa Fatura Çapı (dw)',
  shankDesc: 'Cıvatanın pürüzsüz dişsiz gövdesi', nominalDia: 'Nominal Çap (d)', shankLength: 'Gövde Boyu',
  threadDesc: 'Gerilmeye maruz kalan dişli bölge', minorDia: 'Diş Dibi Çapı (d3)', pitchDia: 'Bölüm Çapı (d2)', pitch: 'Adım (P)', stressArea: 'Gerilme Alanı (As)',
  platesTitle: 'Sıkıştırılan Plakalar', platesDesc: 'Birleştirilen parça kalınlıkları', gripLength: 'Sıkma Boyu (LG)', clearanceHole: 'Geçiş Deliği (dh)',
  nutDesc: 'İç dişli somun elemanı', nutHeight: 'Somun Yüksekliği (m)', threadClass: 'Diş Standardı',
  washerDesc: 'Basınç dağıtıcı rondelalar', washerDia: 'Rondela Çapı (dw)',
};
const FASTENER_LOCALES = mk(FASTENER_TR, {
  pipeNotSupported: 'Rohrgewinde-Darstellung nicht unterstützt.', selectMetricUnc: 'Bitte metrische oder UNC-Schraubengrößen wählen.',
  hoverHint: 'TEILE ANFAHREN FÜR ABMESSUNGEN',
}, { hoverHint: 'PASE EL CURSOR PARA VER DIMENSIONES' }, { hoverHint: 'SURVOLEZ POUR LES COTES' },
{ hoverHint: 'PASSA IL MOUSE PER LE QUOTE' }, { hoverHint: 'PASSE O MOUSE PARA DIMENSÕES' },
{ hoverHint: 'НАВЕДИТЕ ДЛЯ РАЗМЕРОВ' }, { hoverHint: '部品にホバーして寸法を表示' },
{ hoverHint: '悬停查看尺寸' }, { hoverHint: '치수를 보려면 위에 올리세요' }, { hoverHint: 'مرر للأبعاد' });
write('fastenerSchematicTranslations.ts', 'FastenerSchematicStrings', 'getFastenerSchematicStrings', FASTENER_EN, FASTENER_LOCALES);

// ─── Site footer disclaimer ───────────────────────────────────────────────────
const FOOTER_EN = {
  disclaimerStable: 'v4.0.0 Stable',
  disclaimerText: 'This software is v4.0.0 Stable. Calculation results are for reference only. Final production and engineering decisions must be verified by a qualified professional.',
};
const FOOTER_TR = {
  disclaimerText: 'Bu yazılım v4.0.0 Stable sürümüdür. Hesaplama sonuçları referans amaçlıdır. Nihai üretim ve mühendislik kararları öncesinde mutlaka uzman bir profesyonel tarafından kontrol edilmelidir.',
};
const FOOTER_LOCALES = mk(FOOTER_TR, {
  disclaimerText: 'Diese Software ist v4.0.0 Stable. Berechnungsergebnisse dienen nur als Referenz. Endgültige Entscheidungen müssen von Fachpersonal geprüft werden.',
}, { disclaimerText: 'Este software es v4.0.0 Stable. Los resultados son solo de referencia. Deben ser verificados por un profesional cualificado.' },
{ disclaimerText: 'Ce logiciel est v4.0.0 Stable. Les résultats sont indicatifs. Ils doivent être vérifiés par un professionnel qualifié.' },
{ disclaimerText: 'Questo software è v4.0.0 Stable. I risultati sono solo di riferimento. Devono essere verificati da un professionista qualificato.' },
{ disclaimerText: 'Este software é v4.0.0 Stable. Os resultados são apenas referência. Devem ser verificados por um profissional qualificado.' },
{ disclaimerText: 'ПО версии v4.0.0 Stable. Результаты справочные. Решения должны проверять специалисты.' },
{ disclaimerText: '本ソフトウェアは v4.0.0 Stable です。結果は参考値です。最終判断は専門家の確認が必要です。' },
{ disclaimerText: '本软件为 v4.0.0 Stable。计算结果仅供参考，最终决策须由合格专业人员核实。' },
{ disclaimerText: '본 소프트웨어는 v4.0.0 Stable입니다. 결과는 참고용이며 전문가 검증이 필요합니다.' },
{ disclaimerText: 'هذا البرنامج v4.0.0 Stable. النتائج للمرجع فقط ويجب التحقق منها من قبل مختص.' });
write('siteFooterTranslations.ts', 'SiteFooterStrings', 'getSiteFooterStrings', FOOTER_EN, FOOTER_LOCALES);

// ─── Aluminum ─────────────────────────────────────────────────────────────────
const ALU_EN = { manualPrice: 'Manual Price' };
const ALU_LOCALES = mk({ manualPrice: 'Manuel Fiyat' }, { manualPrice: 'Manueller Preis' },
{ manualPrice: 'Precio manual' }, { manualPrice: 'Prix manuel' }, { manualPrice: 'Prezzo manuale' },
{ manualPrice: 'Preço manual' }, { manualPrice: 'Ручная цена' }, { manualPrice: '手動価格' },
{ manualPrice: '手动价格' }, { manualPrice: '수동 가격' }, { manualPrice: 'سعر يدوي' });
write('aluminumPageTranslations.ts', 'AluminumPageStrings', 'getAluminumPageStrings', ALU_EN, ALU_LOCALES);

console.log('Generated page-client translation files in src/locales/');
