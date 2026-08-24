import type { Language } from '@/store/i18nStore';

export type SheetMetalModuleStrings = {
  standardsSubtitle: string;
  bendingProfile: string;
  kTable: string;
  materialGeneral: string;
  firstFlange: string;
  firstFlangeLength: string;
  bendSequence: string;
  add: string;
  bend: string;
  angleTheta: string;
  radiusR: string;
  flangeLength: string;
  direction: string;
  totalFlatPattern: string;
  dinStandard: string;
  kFactorHint: string;
  rtMin: string;
  rtMax: string;
  resetDefault: string;
  rtKPreview: string;
  totalFlatLength: string;
  totalDeduction: string;
  bendCount: string;
  maxTonnage: string;
  crackingRisk: string;
  safe: string;
};

const EN: SheetMetalModuleStrings = {
  "standardsSubtitle": "DIN 6935 / ASME Y14.5 Standards",
  "bendingProfile": "Bending Profile",
  "kTable": "K Table",
  "materialGeneral": "Material & General",
  "firstFlange": "First Flange",
  "firstFlangeLength": "F₀ — first flange length",
  "bendSequence": "Bend Sequence",
  "add": "Add",
  "bend": "Bend",
  "angleTheta": "Angle θ",
  "radiusR": "Radius R",
  "flangeLength": "Flange Length",
  "direction": "Direction",
  "totalFlatPattern": "Total Flat Length (Flat Pattern)",
  "dinStandard": "DIN 6935 Standard",
  "kFactorHint": "Adjust K-factor values based on material/process. Automatically chosen based on R/t ratio.",
  "rtMin": "R/t Min",
  "rtMax": "R/t Max",
  "resetDefault": "Reset to Default (DIN 6935)",
  "rtKPreview": "R/t → K Preview",
  "totalFlatLength": "Total Flat Length",
  "totalDeduction": "Total Deduction",
  "bendCount": "Bend Count",
  "maxTonnage": "Max Tonnage",
  "crackingRisk": "⚠ Cracking Risk",
  "safe": "✓ Safe"
} as SheetMetalModuleStrings;

const TR: SheetMetalModuleStrings = {
  "standardsSubtitle": "DIN 6935 / ASME Y14.5 Standartları",
  "bendingProfile": "Büküm Profili",
  "kTable": "K Tablosu",
  "materialGeneral": "Malzeme & Genel",
  "firstFlange": "İlk Kanat",
  "firstFlangeLength": "F₀ — ilk kanat uzunluğu",
  "bendSequence": "Büküm Sırası",
  "add": "Ekle",
  "bend": "Büküm",
  "angleTheta": "Açı θ",
  "radiusR": "Yarıçap R",
  "flangeLength": "Kanat Boyu",
  "direction": "Yön",
  "totalFlatPattern": "Toplam Açılım (Flat Pattern)",
  "dinStandard": "DIN 6935 Standardı",
  "kFactorHint": "K değerlerini malzeme/proses'e göre düzenleyin. R/t oranına göre otomatik seçilir.",
  "rtMin": "R/t Min",
  "rtMax": "R/t Max",
  "resetDefault": "Varsayılana Dön (DIN 6935)",
  "rtKPreview": "R/t → K Önizleme",
  "totalFlatLength": "Toplam Açınım",
  "totalDeduction": "Toplam Düşüm",
  "bendCount": "Büküm Sayısı",
  "maxTonnage": "Maks. Tonnaj",
  "crackingRisk": "⚠ Çatlama Riski",
  "safe": "✓ Güvenli"
} as SheetMetalModuleStrings;

const DE: SheetMetalModuleStrings = {
  "standardsSubtitle": "DIN 6935 / ASME Y14.5 Normen",
  "bendingProfile": "Biegeprofil",
  "kTable": "K-Tabelle",
  "materialGeneral": "Material & Allgemein",
  "firstFlange": "Erster Schenkel",
  "firstFlangeLength": "F₀ — Länge erster Schenkel",
  "bendSequence": "Biegefolge",
  "add": "Hinzufügen",
  "bend": "Biegung",
  "angleTheta": "Winkel θ",
  "radiusR": "Radius R",
  "flangeLength": "Schenkellänge",
  "direction": "Richtung",
  "totalFlatPattern": "Gesamtlänge (Abwicklung)",
  "dinStandard": "DIN 6935 Standard",
  "kFactorHint": "K-Faktoren nach Material/Prozess anpassen. Automatisch nach R/t-Verhältnis.",
  "rtMin": "R/t Min",
  "rtMax": "R/t Max",
  "resetDefault": "Auf Standard zurücksetzen (DIN 6935)",
  "rtKPreview": "R/t → K Vorschau",
  "totalFlatLength": "Gesamtlänge",
  "totalDeduction": "Gesamtabzug",
  "bendCount": "Biegeanzahl",
  "maxTonnage": "Max. Tonnage",
  "crackingRisk": "⚠ Rissrisiko",
  "safe": "✓ Sicher"
} as SheetMetalModuleStrings;

const ES: SheetMetalModuleStrings = {
  "standardsSubtitle": "DIN 6935 / ASME Y14.5 Standards",
  "bendingProfile": "Perfil de Doblado",
  "kTable": "Tabla K",
  "materialGeneral": "Material y General",
  "firstFlange": "Primer Brida",
  "firstFlangeLength": "F₀ — longitud primer brida",
  "bendSequence": "Secuencia de Doblado",
  "add": "Añadir",
  "bend": "Doblado",
  "angleTheta": "Ángulo θ",
  "radiusR": "Radio R",
  "flangeLength": "Longitud Brida",
  "direction": "Dirección",
  "totalFlatPattern": "Longitud Total (Desarrollo)",
  "dinStandard": "Norma DIN 6935",
  "kFactorHint": "Ajuste valores K según material/proceso. Se elige automáticamente por R/t.",
  "rtMin": "R/t Min",
  "rtMax": "R/t Max",
  "resetDefault": "Restablecer predeterminado (DIN 6935)",
  "rtKPreview": "Vista previa R/t → K",
  "totalFlatLength": "Longitud Total",
  "totalDeduction": "Deducción Total",
  "bendCount": "Nº de Doblados",
  "maxTonnage": "Tonelaje Máx.",
  "crackingRisk": "⚠ Riesgo de Grieta",
  "safe": "✓ Seguro"
} as SheetMetalModuleStrings;

const FR: SheetMetalModuleStrings = {
  "standardsSubtitle": "DIN 6935 / ASME Y14.5 Standards",
  "bendingProfile": "Profil de Pliage",
  "kTable": "Table K",
  "materialGeneral": "Matériau & Général",
  "firstFlange": "Premier Pli",
  "firstFlangeLength": "F₀ — longueur premier pli",
  "bendSequence": "Séquence de Pliage",
  "add": "Ajouter",
  "bend": "Pli",
  "angleTheta": "Angle θ",
  "radiusR": "Rayon R",
  "flangeLength": "Longueur Pli",
  "direction": "Direction",
  "totalFlatPattern": "Longueur Totale (Dépliage)",
  "dinStandard": "Norme DIN 6935",
  "kFactorHint": "Ajustez les K selon matériau/procédé. Choix auto selon R/t.",
  "rtMin": "R/t Min",
  "rtMax": "R/t Max",
  "resetDefault": "Réinitialiser (DIN 6935)",
  "rtKPreview": "Aperçu R/t → K",
  "totalFlatLength": "Longueur Totale",
  "totalDeduction": "Déduction Totale",
  "bendCount": "Nb de Pliages",
  "maxTonnage": "Tonnage Max",
  "crackingRisk": "⚠ Risque de Fissure",
  "safe": "✓ Sûr"
} as SheetMetalModuleStrings;

const IT: SheetMetalModuleStrings = {
  "standardsSubtitle": "DIN 6935 / ASME Y14.5 Standards",
  "bendingProfile": "Profilo Piegatura",
  "kTable": "Tabella K",
  "materialGeneral": "Materiale & Generale",
  "firstFlange": "Prima Flangia",
  "firstFlangeLength": "F₀ — lunghezza prima flangia",
  "bendSequence": "Sequenza Piegatura",
  "add": "Aggiungi",
  "bend": "Piegatura",
  "angleTheta": "Angolo θ",
  "radiusR": "Raggio R",
  "flangeLength": "Lunghezza Flangia",
  "direction": "Direzione",
  "totalFlatPattern": "Lunghezza Totale (Sviluppo)",
  "dinStandard": "Standard DIN 6935",
  "kFactorHint": "Regola i K in base a materiale/processo. Scelta auto da R/t.",
  "rtMin": "R/t Min",
  "rtMax": "R/t Max",
  "resetDefault": "Ripristina predefinito (DIN 6935)",
  "rtKPreview": "Anteprima R/t → K",
  "totalFlatLength": "Lunghezza Totale",
  "totalDeduction": "Deduzione Totale",
  "bendCount": "Nº Piegature",
  "maxTonnage": "Tonnellaggio Max",
  "crackingRisk": "⚠ Rischio Crepa",
  "safe": "✓ Sicuro"
} as SheetMetalModuleStrings;

const PT: SheetMetalModuleStrings = {
  "standardsSubtitle": "DIN 6935 / ASME Y14.5 Standards",
  "bendingProfile": "Perfil de Dobra",
  "kTable": "Tabela K",
  "materialGeneral": "Material & Geral",
  "firstFlange": "Primeira Aba",
  "firstFlangeLength": "F₀ — comprimento primeira aba",
  "bendSequence": "Sequência de Dobra",
  "add": "Adicionar",
  "bend": "Dobra",
  "angleTheta": "Ângulo θ",
  "radiusR": "Raio R",
  "flangeLength": "Comprimento Aba",
  "direction": "Direção",
  "totalFlatPattern": "Comprimento Total (Desenvolvimento)",
  "dinStandard": "Norma DIN 6935",
  "kFactorHint": "Ajuste valores K por material/processo. Escolha automática por R/t.",
  "rtMin": "R/t Min",
  "rtMax": "R/t Max",
  "resetDefault": "Restaurar padrão (DIN 6935)",
  "rtKPreview": "Pré-visualização R/t → K",
  "totalFlatLength": "Comprimento Total",
  "totalDeduction": "Dedução Total",
  "bendCount": "Nº de Dobras",
  "maxTonnage": "Tonelagem Máx.",
  "crackingRisk": "⚠ Risco de Fissura",
  "safe": "✓ Seguro"
} as SheetMetalModuleStrings;

const RU: SheetMetalModuleStrings = {
  "standardsSubtitle": "DIN 6935 / ASME Y14.5 Standards",
  "bendingProfile": "Профиль гибки",
  "kTable": "Таблица K",
  "materialGeneral": "Материал и общее",
  "firstFlange": "Первая полка",
  "firstFlangeLength": "F₀ — длина первой полки",
  "bendSequence": "Последовательность гибов",
  "add": "Добавить",
  "bend": "Гиб",
  "angleTheta": "Угол θ",
  "radiusR": "Радиус R",
  "flangeLength": "Длина полки",
  "direction": "Направление",
  "totalFlatPattern": "Общая длина (развёртка)",
  "dinStandard": "Стандарт DIN 6935",
  "kFactorHint": "Настройте K по материалу/процессу. Автовыбор по R/t.",
  "rtMin": "R/t Min",
  "rtMax": "R/t Max",
  "resetDefault": "Сбросить по умолчанию (DIN 6935)",
  "rtKPreview": "Предпросмотр R/t → K",
  "totalFlatLength": "Общая длина",
  "totalDeduction": "Общий вычет",
  "bendCount": "Число гибов",
  "maxTonnage": "Макс. тоннаж",
  "crackingRisk": "⚠ Риск трещин",
  "safe": "✓ Безопасно"
} as SheetMetalModuleStrings;

const JA: SheetMetalModuleStrings = {
  "standardsSubtitle": "DIN 6935 / ASME Y14.5 Standards",
  "bendingProfile": "曲げプロファイル",
  "kTable": "Kテーブル",
  "materialGeneral": "材料と一般",
  "firstFlange": "最初のフランジ",
  "firstFlangeLength": "F₀ — 最初のフランジ長",
  "bendSequence": "曲げ順序",
  "add": "追加",
  "bend": "曲げ",
  "angleTheta": "角度 θ",
  "radiusR": "半径 R",
  "flangeLength": "フランジ長",
  "direction": "方向",
  "totalFlatPattern": "総展開長 (フラットパターン)",
  "dinStandard": "DIN 6935 規格",
  "kFactorHint": "材料/工程に応じてK値を調整。R/t比で自動選択。",
  "rtMin": "R/t Min",
  "rtMax": "R/t Max",
  "resetDefault": "デフォルトに戻す (DIN 6935)",
  "rtKPreview": "R/t → K プレビュー",
  "totalFlatLength": "総展開長",
  "totalDeduction": "総控除",
  "bendCount": "曲げ数",
  "maxTonnage": "最大トン数",
  "crackingRisk": "⚠ 亀裂リスク",
  "safe": "✓ 安全"
} as SheetMetalModuleStrings;

const ZH: SheetMetalModuleStrings = {
  "standardsSubtitle": "DIN 6935 / ASME Y14.5 Standards",
  "bendingProfile": "折弯轮廓",
  "kTable": "K 表",
  "materialGeneral": "材料与常规",
  "firstFlange": "第一翼板",
  "firstFlangeLength": "F₀ — 第一翼板长度",
  "bendSequence": "折弯顺序",
  "add": "添加",
  "bend": "折弯",
  "angleTheta": "角度 θ",
  "radiusR": "半径 R",
  "flangeLength": "翼板长度",
  "direction": "方向",
  "totalFlatPattern": "总展开长 (平板图案)",
  "dinStandard": "DIN 6935 标准",
  "kFactorHint": "根据材料/工艺调整 K 值。按 R/t 比自动选择。",
  "rtMin": "R/t Min",
  "rtMax": "R/t Max",
  "resetDefault": "恢复默认 (DIN 6935)",
  "rtKPreview": "R/t → K 预览",
  "totalFlatLength": "总展开长",
  "totalDeduction": "总扣除",
  "bendCount": "折弯数",
  "maxTonnage": "最大吨位",
  "crackingRisk": "⚠ 开裂风险",
  "safe": "✓ 安全"
} as SheetMetalModuleStrings;

const KO: SheetMetalModuleStrings = {
  "standardsSubtitle": "DIN 6935 / ASME Y14.5 Standards",
  "bendingProfile": "절곡 프로파일",
  "kTable": "K 테이블",
  "materialGeneral": "재료 및 일반",
  "firstFlange": "첫 플랜지",
  "firstFlangeLength": "F₀ — 첫 플랜지 길이",
  "bendSequence": "절곡 순서",
  "add": "추가",
  "bend": "절곡",
  "angleTheta": "각도 θ",
  "radiusR": "반경 R",
  "flangeLength": "플랜지 길이",
  "direction": "방향",
  "totalFlatPattern": "총 전개 길이 (플랫 패턴)",
  "dinStandard": "DIN 6935 표준",
  "kFactorHint": "재료/공정에 따라 K값 조정. R/t 비율로 자동 선택.",
  "rtMin": "R/t Min",
  "rtMax": "R/t Max",
  "resetDefault": "기본값 복원 (DIN 6935)",
  "rtKPreview": "R/t → K 미리보기",
  "totalFlatLength": "총 전개 길이",
  "totalDeduction": "총 공제",
  "bendCount": "절곡 수",
  "maxTonnage": "최대 톤수",
  "crackingRisk": "⚠ 균열 위험",
  "safe": "✓ 안전"
} as SheetMetalModuleStrings;

const AR: SheetMetalModuleStrings = {
  "standardsSubtitle": "DIN 6935 / ASME Y14.5 Standards",
  "bendingProfile": "ملف الثني",
  "kTable": "جدول K",
  "materialGeneral": "المادة والعام",
  "firstFlange": "الجناح الأول",
  "firstFlangeLength": "F₀ — طول الجناح الأول",
  "bendSequence": "تسلسل الثني",
  "add": "إضافة",
  "bend": "ثني",
  "angleTheta": "زاوية θ",
  "radiusR": "نصف قطر R",
  "flangeLength": "طول الجناح",
  "direction": "الاتجاه",
  "totalFlatPattern": "الطول الكلي (النمط المسطح)",
  "dinStandard": "معيار DIN 6935",
  "kFactorHint": "اضبط قيم K حسب المادة/العملية. يُختار تلقائياً حسب نسبة R/t.",
  "rtMin": "R/t Min",
  "rtMax": "R/t Max",
  "resetDefault": "إعادة التعيين (DIN 6935)",
  "rtKPreview": "معاينة R/t → K",
  "totalFlatLength": "الطول الكلي",
  "totalDeduction": "الخصم الكلي",
  "bendCount": "عدد الثنيات",
  "maxTonnage": "أقصى طن",
  "crackingRisk": "⚠ خطر التشقق",
  "safe": "✓ آمن"
} as SheetMetalModuleStrings;

const BY_LOCALE: Record<Language, SheetMetalModuleStrings> = {
  en: EN,
  tr: TR,
  de: DE,
  es: ES,
  fr: FR,
  it: IT,
  pt: PT,
  ru: RU,
  ja: JA,
  zh: ZH,
  ko: KO,
  ar: AR,
};

export function getSheetMetalModuleStrings(locale: string): SheetMetalModuleStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}
