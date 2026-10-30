import { APP_MAJOR_MINOR } from '@/config/app';
import type { Language } from '@/store/i18nStore';

export type HandbookModuleStrings = {
  // Header
  appTitle: string;
  appBadge: string;
  appSubtitle: string;

  // Tabs
  tabStandards: string;
  tabStandardsShort: string;
  tabMaterials: string;
  tabMaterialsShort: string;
  tabFormulas: string;
  tabFormulasShort: string;

  // Standards Tab
  searchPlaceholder: string;
  searchResults: string;
  noResults: string;
  coreRepository: string;
  heroTitle: string;
  heroDesc: string;
  heroButton: string;
  quickRefTitle: string;
  allSections: string;
  viewDetails: string;
  backToChapter: string;
  governingFormula: string;
  specTable: string;
  tags: string;
  subsectionsCount: string;

  // Quick Ref Cards
  quickIsoTolerances: string;
  quickIsoTolerancesDesc: string;
  quickVdi2230: string;
  quickVdi2230Desc: string;
  quickIso281: string;
  quickIso281Desc: string;
  quickBeams: string;
  quickBeamsDesc: string;
  quickMohr: string;
  quickMohrDesc: string;
  quickRoughness: string;
  quickRoughnessDesc: string;

  // Interactive Tools
  interactiveToolsTitle: string;
  toolToleranceCalc: string;
  toolToleranceDesc: string;
  toolHardnessConverter: string;
  toolHardnessDesc: string;
  toolPipeSchedules: string;
  toolPipeDesc: string;
  nominalDimension: string;
  selectFit: string;
  holeTolerance: string;
  shaftTolerance: string;
  fitType: string;
  clearanceFit: string;
  transitionFit: string;
  interferenceFit: string;
  maxClearance: string;
  minClearance: string;
  hardnessInput: string;
  convertedValues: string;
  pipeNominalSize: string;
  pipeOD: string;
  pipeWall: string;
  pipeID: string;
  pipeWeight: string;

  // Materials Tab Subtabs
  subtabMatrix: string;
  subtabAshby: string;
  subtabSelector: string;
  subtabScatter: string;

  // Material Categories
  catAll: string;
  catAluminum: string;
  catSteel: string;
  catStainless: string;
  catNonFerrous: string;
  catSuperalloy: string;
  catCastIron: string;
  catPlastic: string;
  catComposite: string;

  // Materials Matrix
  matSearchPlaceholder: string;
  matDatabaseCount: string;
  sortedBy: string;
  colMaterial: string;
  colCategory: string;
  colYield: string;
  colTensile: string;
  colDensity: string;
  colEModulus: string;
  colMaxTemp: string;
  colCost: string;

  // Material Dossier
  standardClassifications: string;
  radarTitle: string;
  radarStrength: string;
  radarLightness: string;
  radarStiffness: string;
  radarMaxTemp: string;
  radarCostEff: string;
  radarSpecific: string;
  copyJson: string;
  copied: string;
  exportCsv: string;
  propMechanical: string;
  propThermal: string;
  poissonsRatio: string;
  thermalConductivity: string;
  thermalExpansion: string;

  // Ashby Comparator
  comparatorTitle: string;
  comparatorSubtitle: string;
  materialA: string;
  materialB: string;
  specComparison: string;
  colProperty: string;
  colDelta: string;
  rationaleTitle: string;
  propYieldStrength: string;
  propTensileStrength: string;
  propDensity: string;
  propModulus: string;
  propSpecificStrength: string;
  propSpecificModulus: string;
  propAshbyBeam: string;
  propMaxTemp: string;
  propCostIndex: string;

  // Ashby 2D Scatter Chart
  scatterTitle: string;
  scatterSubtitle: string;
  xAxisLabel: string;
  yAxisLabel: string;
  xAxisYield: string;
  xAxisDensity: string;
  xAxisModulus: string;
  xAxisCost: string;
  yAxisYield: string;
  yAxisModulus: string;
  yAxisTemp: string;
  yAxisSpecificStrength: string;

  // AI Constraint Selector
  selectorTitle: string;
  selectorSubtitle: string;
  presetsTitle: string;
  presetGeneral: string;
  presetAerospace: string;
  presetMarine: string;
  presetHighTemp: string;
  presetHeavyCivil: string;
  sliderMinYield: string;
  sliderMaxDensity: string;
  sliderMinTemp: string;
  economicPriority: string;
  strictCostFilter: string;
  neutralCost: string;
  rankedCandidatesTitle: string;
  score: string;
  reasonHighYield: string;
  reasonLightweight: string;
  reasonHighTemp: string;
  reasonCostEff: string;

  // Formula Codex
  codexTitle: string;
  codexSubtitle: string;
  searchFormulaPlaceholder: string;
  disciplineAll: string;
  disciplineMechanics: string;
  disciplineFluids: string;
  disciplineFasteners: string;
  disciplineMachine: string;
  disciplineStructures: string;
  disciplineFatigue: string;
  deterministicSolver: string;
  openSolver: string;
  quickCalc: string;
  calculate: string;
};

// ─── ENGLISH (EN) ───
const EN: HandbookModuleStrings = {
  appTitle: "ALUCALC HANDBOOK",
  appBadge: `v${APP_MAJOR_MINOR} INDUSTRIAL`,
  appSubtitle: "Unified Engineering Reference, Material Intelligence & Formula Codex",

  tabStandards: "Standards & Chapters",
  tabStandardsShort: "Standards",
  tabMaterials: "Materials Intelligence Atlas",
  tabMaterialsShort: "Materials",
  tabFormulas: "Formula Codex & Solvers",
  tabFormulasShort: "Formulas",

  searchPlaceholder: "Search formulas, standards, chapters...",
  searchResults: "Results",
  noResults: "No matching entries found.",
  coreRepository: "CORE REPOSITORY",
  heroTitle: "ENGINEERING HANDBOOK & STANDARDS",
  heroDesc: "Machine elements, material properties, tolerance tables, and structural formulas classified according to ISO, DIN, ASME and Eurocode norms.",
  heroButton: "Materials Atlas & Ashby →",
  quickRefTitle: "QUICK REFERENCE CARDS",
  allSections: "ALL SECTIONS",
  viewDetails: "View Details →",
  backToChapter: "← Back to Section Overview",
  governingFormula: "Governing Formula",
  specTable: "Specification & Limits Table",
  tags: "Classification Tags",
  subsectionsCount: "Subsections",

  quickIsoTolerances: "ISO 286 Tolerances & Fits",
  quickIsoTolerancesDesc: "H7/g6, H7/k6, H7/p6 limit tolerances and fit classifications for shafts & bores.",
  quickVdi2230: "VDI 2230 Bolt Strength",
  quickVdi2230Desc: "Metric thread geometry, tightening torque and proof load preload calculations.",
  quickIso281: "ISO 281 Dynamic Bearing Life",
  quickIso281Desc: "SKF 6200/6300 series deep groove radial ball bearing rating catalog values.",
  quickBeams: "Beam Deflection Formulas",
  quickBeamsDesc: "Maximum deflection and bending moment formulas for simply supported & cantilever beams.",
  quickMohr: "Mohr's Circle & Principal Stresses",
  quickMohrDesc: "Plane stress transformation, principal normal stresses and maximum in-plane shear.",
  quickRoughness: "Surface Roughness (Ra/Rz)",
  quickRoughnessDesc: "Achievable roughness ranges and machining methods according to DIN 4768 / ISO 1302.",

  interactiveToolsTitle: "INTERACTIVE ENGINEERING QUICK LOOKUPS",
  toolToleranceCalc: "ISO 286 Fit & Tolerance Interactive Calculator",
  toolToleranceDesc: "Instant Hole (ES, EI) and Shaft (es, ei) limit deviations, clearances and fit types.",
  toolHardnessConverter: "ASTM E140 Hardness & Strength Converter",
  toolHardnessDesc: "Instant conversion across HRC, HB, HV, HRB and ultimate tensile strength (Rm).",
  toolPipeSchedules: "ASME B36.10M / ISO 4200 Pipe Schedules",
  toolPipeDesc: "Standard pipe OD, wall thicknesses for Sch 40 & Sch 80, inner diameter and weights.",
  nominalDimension: "Nominal Size d (mm)",
  selectFit: "Standard Fit Class",
  holeTolerance: "Hole Deviation (H)",
  shaftTolerance: "Shaft Deviation",
  fitType: "Fit Classification",
  clearanceFit: "Clearance Fit (Loose/Running)",
  transitionFit: "Transition Fit (Location)",
  interferenceFit: "Interference Fit (Press)",
  maxClearance: "Max Clearance",
  minClearance: "Min Clearance",
  hardnessInput: "Hardness Input",
  convertedValues: "Cross-Converted Equivalent Values",
  pipeNominalSize: "NPS (Inches)",
  pipeOD: "Outside Diameter (mm)",
  pipeWall: "Wall Thickness (mm)",
  pipeID: "Inside Diameter (mm)",
  pipeWeight: "Nominal Weight (kg/m)",

  subtabMatrix: "Matrix & Dossier",
  subtabAshby: "Ashby & Dual Radar",
  subtabSelector: "AI Constraint Selector",
  subtabScatter: "2D Ashby Scatter Chart",

  catAll: "All",
  catAluminum: "Aluminum",
  catSteel: "Steel",
  catStainless: "Stainless",
  catNonFerrous: "Non-Ferrous",
  catSuperalloy: "Superalloy",
  catCastIron: "Cast Iron",
  catPlastic: "Plastic",
  catComposite: "Composite",

  matSearchPlaceholder: "Search alloy, standard (e.g. 7075, 4140, Delrin, 1.4301)...",
  matDatabaseCount: "Engineering Materials Database",
  sortedBy: "Sorted by Category & Standards",
  colMaterial: "MATERIAL",
  colCategory: "CATEGORY",
  colYield: "YIELD Sy",
  colTensile: "TENSILE Su",
  colDensity: "DENSITY ρ",
  colEModulus: "E-MODULUS",
  colMaxTemp: "MAX TEMP",
  colCost: "COST",

  standardClassifications: "STANDARD CLASSIFICATIONS",
  radarTitle: "6-AXIS MATERIAL PERFORMANCE RADAR",
  radarStrength: "Strength",
  radarLightness: "Lightness",
  radarStiffness: "Stiffness (E)",
  radarMaxTemp: "Max Temp",
  radarCostEff: "Cost Eff.",
  radarSpecific: "Specific Sy/ρ",
  copyJson: "Copy Spec JSON",
  copied: "Copied!",
  exportCsv: "Export Spec CSV",
  propMechanical: "Mechanical Constants",
  propThermal: "Thermal & Physical",
  poissonsRatio: "Poisson's Ratio ν",
  thermalConductivity: "Thermal Cond. k (W/m·K)",
  thermalExpansion: "Thermal Exp. α (μm/m·K)",

  comparatorTitle: "DUAL MATERIAL PERFORMANCE COMPARATOR",
  comparatorSubtitle: "Side-by-side Ashby index benchmarking with dual SVG overlay radar.",
  materialA: "Material A:",
  materialB: "Material B:",
  specComparison: "SPECIFICATION COMPARISON & DELTAS",
  colProperty: "PROPERTY",
  colDelta: "DELTA (%)",
  rationaleTitle: "ENGINEERING SELECTION RATIONALE",
  propYieldStrength: "Yield Strength Sy",
  propTensileStrength: "Tensile Strength Su",
  propDensity: "Density ρ",
  propModulus: "Elastic Modulus E",
  propSpecificStrength: "Specific Strength Sy/ρ",
  propSpecificModulus: "Specific Modulus E/ρ",
  propAshbyBeam: "Ashby Bending Index Sy^(2/3)/ρ",
  propMaxTemp: "Max Service Temp",
  propCostIndex: "Relative Cost Index",

  scatterTitle: "2D ASHBY PROPERTY SCATTER PLOT",
  scatterSubtitle: "Interactive material space exploration with Pareto efficiency trade-off boundaries.",
  xAxisLabel: "X-Axis Property",
  yAxisLabel: "Y-Axis Property",
  xAxisYield: "Yield Strength (MPa)",
  xAxisDensity: "Density (g/cm³)",
  xAxisModulus: "Elastic Modulus (GPa)",
  xAxisCost: "Cost Index (1-10)",
  yAxisYield: "Yield Strength (MPa)",
  yAxisModulus: "Elastic Modulus (GPa)",
  yAxisTemp: "Max Service Temp (°C)",
  yAxisSpecificStrength: "Specific Strength Sy/ρ (MPa·cm³/g)",

  selectorTitle: "AI & CONSTRAINT-BASED MATERIAL SELECTOR",
  selectorSubtitle: "Define mechanical boundary conditions and load cases to automatically rank industrial candidates.",
  presetsTitle: "APPLICATION PRESETS",
  presetGeneral: "All General Applications",
  presetAerospace: "Aerospace & Spacecraft",
  presetMarine: "Marine & Offshore Seawater",
  presetHighTemp: "High-Temperature & Exhaust",
  presetHeavyCivil: "Heavy Civil / Machine Frames",
  sliderMinYield: "Min Yield (Sy)",
  sliderMaxDensity: "Max Density (ρ)",
  sliderMinTemp: "Min Max-Temp (T)",
  economicPriority: "Economic Priority",
  strictCostFilter: "Strict Low Cost Weighting",
  neutralCost: "Neutral Cost Weighting",
  rankedCandidatesTitle: "RANKED MATERIAL CANDIDATES",
  score: "Score",
  reasonHighYield: "High Yield Strength",
  reasonLightweight: "Ultra-Lightweight Density",
  reasonHighTemp: "Thermal Stability & Elevated Temp",
  reasonCostEff: "High Commercial Cost Efficiency",

  codexTitle: "INDUSTRIAL ENGINEERING FORMULA CODEX",
  codexSubtitle: "Standardized governing equations verified against ISO, DIN, VDI, ASME and AISC design codes with one-click interactive solver execution.",
  searchFormulaPlaceholder: "Search formula or standard code...",
  disciplineAll: "All Disciplines",
  disciplineMechanics: "Mechanics & Materials",
  disciplineFluids: "Fluids & Hydraulics",
  disciplineFasteners: "Fasteners & Bolting",
  disciplineMachine: "Machine Elements",
  disciplineStructures: "Structural Design",
  disciplineFatigue: "Fatigue & Dynamics",
  deterministicSolver: "Deterministic Solver",
  openSolver: "Open Solver →",
  quickCalc: "Quick Parameter Check",
  calculate: "Calculate"
};

// ─── TURKISH (TR) ───
const TR: HandbookModuleStrings = {
  appTitle: "ALUCALC MÜHENDİSLİK EL KİTABI",
  appBadge: `v${APP_MAJOR_MINOR} ENDÜSTRİYEL`,
  appSubtitle: "Bütünleşik Mühendislik Referansı, Malzeme Zekâsı Atlası ve Formül Kodeksi",

  tabStandards: "Standartlar & Bölümler",
  tabStandardsShort: "Standartlar",
  tabMaterials: "Malzeme Zekâsı Atlası",
  tabMaterialsShort: "Malzemeler",
  tabFormulas: "Formül Kodeksi & Çözücüler",
  tabFormulasShort: "Formüller",

  searchPlaceholder: "Formül, standart veya bölüm ara...",
  searchResults: "Sonuçlar",
  noResults: "Eşleşen kayıt bulunamadı.",
  coreRepository: "ANA BİLGİ BANKASI",
  heroTitle: "MÜHENDİSLİK EL KİTABI & STANDARTLAR",
  heroDesc: "ISO, DIN, ASME ve Eurocode normlarına göre sınıflandırılmış makine elemanları, malzeme özellikleri, tolerans tabloları ve mukavemet formülleri.",
  heroButton: "Malzeme Atlası & Ashby →",
  quickRefTitle: "HIZLI BAŞVURU KARTLARI",
  allSections: "TÜM BÖLÜMLER",
  viewDetails: "İncele →",
  backToChapter: "← Bölüm Genel Bakışına Dön",
  governingFormula: "Temel Formül",
  specTable: "Spesifikasyon ve Limit Tablosu",
  tags: "Sınıflandırma Etiketleri",
  subsectionsCount: "Alt Bölüm",

  quickIsoTolerances: "ISO 286 Tolerans & Geçmeler",
  quickIsoTolerancesDesc: "H7/g6, H7/k6, H7/p6 şaft ve delik limit toleransları ve geçme sınıflandırmaları.",
  quickVdi2230: "VDI 2230 Cıvata Mukavemeti",
  quickVdi2230Desc: "Metrik vida geometrisi, sıkma torku ve ön yükleme gerilme hesapları.",
  quickIso281: "ISO 281 Rulman Dinamik Ömrü",
  quickIso281Desc: "SKF 6200/6300 serisi derin oluklu bilyalı rulman katalog ve anma ömrü değerleri.",
  quickBeams: "Kiriş Sehim Formülleri",
  quickBeamsDesc: "Basit mesnetli ve konsol kirişler için maksimum sehim ve eğilme momenti denklemleri.",
  quickMohr: "Mohr Dairesi & Asal Gerilmeler",
  quickMohrDesc: "Düzlem gerilme dönüşümü, asal normal gerilmeler ve maksimum kayma gerilmesi.",
  quickRoughness: "Yüzey Pürüzlülüğü (Ra/Rz)",
  quickRoughnessDesc: "DIN 4768 / ISO 1302 normuna göre imalat yöntemlerinin pürüzlülük aralıkları.",

  interactiveToolsTitle: "ETKİLEŞİMLİ MÜHENDİSLİK HIZLI TABLOLARI",
  toolToleranceCalc: "ISO 286 Geçme ve Tolerans Hesaplayıcı",
  toolToleranceDesc: "Delik (ES, EI) ve Mil (es, ei) limit sapmaları, boşluk/sıkılık ve geçme tipi.",
  toolHardnessConverter: "ASTM E140 Sertlik ve Mukavemet Çevirici",
  toolHardnessDesc: "HRC, HB, HV, HRB ve çekme mukavemeti (Rm) arasında anlık dönüşüm.",
  toolPipeSchedules: "ASME B36.10M / ISO 4200 Boru Çizelgesi",
  toolPipeDesc: "Standart boru dış çapları, Sch 40 & Sch 80 et kalınlıkları ve nominal ağırlıklar.",
  nominalDimension: "Anma Çapı d (mm)",
  selectFit: "Standart Geçme Sınıfı",
  holeTolerance: "Delik Toleransı (H)",
  shaftTolerance: "Mil Toleransı",
  fitType: "Geçme Sınıfı",
  clearanceFit: "Boşluklu Geçme (Döner/Kayıcı)",
  transitionFit: "Ara Geçme (Konumlandırma)",
  interferenceFit: "Sıkı Geçme (Pres/Çakma)",
  maxClearance: "Maks. Boşluk",
  minClearance: "Min. Boşluk",
  hardnessInput: "Sertlik Değeri",
  convertedValues: "Dönüştürülmüş Eşdeğer Değerler",
  pipeNominalSize: "NPS (İnç)",
  pipeOD: "Dış Çap (mm)",
  pipeWall: "Et Kalınlığı (mm)",
  pipeID: "İç Çap (mm)",
  pipeWeight: "Birim Ağırlık (kg/m)",

  subtabMatrix: "Matris & Dosya",
  subtabAshby: "Ashby & Çift Radar",
  subtabSelector: "AI Kısıt Seçici",
  subtabScatter: "2D Ashby Dağılım Grafiği",

  catAll: "Tümü",
  catAluminum: "Alüminyum",
  catSteel: "Çelik",
  catStainless: "Paslanmaz",
  catNonFerrous: "Demirdışı",
  catSuperalloy: "Süperalaşım",
  catCastIron: "Dökme Demir",
  catPlastic: "Plastik",
  catComposite: "Kompozit",

  matSearchPlaceholder: "Alaşım, standart veya kod ara (örn. 7075, 4140, Delrin, 1.4301)...",
  matDatabaseCount: "Mühendislik Malzemeleri Veritabanı",
  sortedBy: "Kategori & Standartlara Göre Sıralı",
  colMaterial: "MALZEME",
  colCategory: "KATEGORİ",
  colYield: "AKMA Sy",
  colTensile: "ÇEKME Su",
  colDensity: "YOĞUNLUK ρ",
  colEModulus: "E-MODÜLÜ",
  colMaxTemp: "MAKS SIC.",
  colCost: "MALİYET",

  standardClassifications: "STANDART SINIFLANDIRMALAR",
  radarTitle: "6 EKSENLİ MALZEME PERFORMANS RADARI",
  radarStrength: "Mukavemet",
  radarLightness: "Hafiflik",
  radarStiffness: "Rijitlik (E)",
  radarMaxTemp: "Maks Sıcaklık",
  radarCostEff: "Maliyet Verim.",
  radarSpecific: "Özgül Sy/ρ",
  copyJson: "Spesifikasyon JSON Kopyala",
  copied: "Kopyalandı!",
  exportCsv: "CSV Olarak İndir",
  propMechanical: "Mekanik Sabitler",
  propThermal: "Termal & Fiziksel",
  poissonsRatio: "Poisson Oranı ν",
  thermalConductivity: "Isıl İletkenlik k (W/m·K)",
  thermalExpansion: "Isıl Genleşme α (μm/m·K)",

  comparatorTitle: "İKİLİ MALZEME PERFORMANS KARŞILAŞTIRICI",
  comparatorSubtitle: "Çift SVG katmanlı radar ile yan yana Ashby indeks kıyaslaması.",
  materialA: "Malzeme A:",
  materialB: "Malzeme B:",
  specComparison: "SPESİFİKASYON KIYASLAMASI & FARKLAR",
  colProperty: "ÖZELLİK",
  colDelta: "FARK (%)",
  rationaleTitle: "MÜHENDİSLİK SEÇİM GEREKÇESİ",
  propYieldStrength: "Akma Dayanımı Sy",
  propTensileStrength: "Çekme Dayanımı Su",
  propDensity: "Yoğunluk ρ",
  propModulus: "Elastisite Modülü E",
  propSpecificStrength: "Özgül Mukavemet Sy/ρ",
  propSpecificModulus: "Özgül Rijitlik E/ρ",
  propAshbyBeam: "Ashby Eğilme İndeksi Sy^(2/3)/ρ",
  propMaxTemp: "Maks Çalışma Sıcaklığı",
  propCostIndex: "Göreceli Maliyet İndeksi",

  scatterTitle: "2D ASHBY MALZEME DAĞILIM GRAFİĞİ",
  scatterSubtitle: "Pareto verimlilik sınırları ile interaktif malzeme uzayı keşfi.",
  xAxisLabel: "X Ekseni Özelliği",
  yAxisLabel: "Y Ekseni Özelliği",
  xAxisYield: "Akma Dayanımı (MPa)",
  xAxisDensity: "Yoğunluk (g/cm³)",
  xAxisModulus: "Elastisite Modülü (GPa)",
  xAxisCost: "Maliyet İndeksi (1-10)",
  yAxisYield: "Akma Dayanımı (MPa)",
  yAxisModulus: "Elastisite Modülü (GPa)",
  yAxisTemp: "Maks Çalışma Sıcaklığı (°C)",
  yAxisSpecificStrength: "Özgül Mukavemet Sy/ρ (MPa·cm³/g)",

  selectorTitle: "AI & KISIT TABANLI MALZEME SEÇİCİ",
  selectorSubtitle: "Mekanik sınır koşullarını ve yük durumlarını tanımlayarak endüstriyel adayları otomatik puanlayın.",
  presetsTitle: "UYGULAMA ÖNAYARLARI",
  presetGeneral: "Tüm Genel Uygulamalar",
  presetAerospace: "Havacılık & Uzay",
  presetMarine: "Denizcilik & Açık Deniz",
  presetHighTemp: "Yüksek Sıcaklık & Egzoz",
  presetHeavyCivil: "Ağır Çelik / Makine Gövdeleri",
  sliderMinYield: "Min Akma (Sy)",
  sliderMaxDensity: "Maks Yoğunluk (ρ)",
  sliderMinTemp: "Min Maks-Sıcaklık (T)",
  economicPriority: "Ekonomik Öncelik",
  strictCostFilter: "Sıkı Düşük Maliyet Ağırlığı",
  neutralCost: "Dengeli Maliyet Ağırlığı",
  rankedCandidatesTitle: "SIRALANMIŞ MALZEME ADAYLARI",
  score: "Skor",
  reasonHighYield: "Yüksek Akma Mukavemeti",
  reasonLightweight: "Ultra Hafif Yoğunluk",
  reasonHighTemp: "Termal Stabilite & Sıcaklık Direnci",
  reasonCostEff: "Yüksek Ticari Maliyet Verimliliği",

  codexTitle: "ENDÜSTRİYEL MÜHENDİSLİK FORMÜL KODEKSİ",
  codexSubtitle: "ISO, DIN, VDI, ASME ve AISC normlarına göre doğrulanmış temel tasarım denklemleri ve tek tıkla çözücü entegrasyonu.",
  searchFormulaPlaceholder: "Formül veya standart kodu ara...",
  disciplineAll: "Tüm Disiplinler",
  disciplineMechanics: "Mekanik & Malzeme",
  disciplineFluids: "Akışkanlar & Hidrolik",
  disciplineFasteners: "Cıvata & Bağlantı",
  disciplineMachine: "Makine Elemanları",
  disciplineStructures: "Yapısal Tasarım",
  disciplineFatigue: "Yorulma & Dinamik",
  deterministicSolver: "Deterministik Çözücü",
  openSolver: "Çözücüyü Aç →",
  quickCalc: "Hızlı Parametre Kontrolü",
  calculate: "Hesapla"
};

// ─── GERMAN (DE) ───
const DE: HandbookModuleStrings = {
  appTitle: "ALUCALC INGENIEUR-HANDBUCH",
  appBadge: `v${APP_MAJOR_MINOR} INDUSTRIE`,
  appSubtitle: "Zentrales Ingenieur-Nachschlagewerk, Werkstoff-Intelligenz & Formel-Kodex",

  tabStandards: "Normen & Kapitel",
  tabStandardsShort: "Normen",
  tabMaterials: "Werkstoff-Intelligenz-Atlas",
  tabMaterialsShort: "Werkstoffe",
  tabFormulas: "Formel-Kodex & Berechner",
  tabFormulasShort: "Formeln",

  searchPlaceholder: "Formeln, Normen, Kapitel durchsuchen...",
  searchResults: "Ergebnisse",
  noResults: "Keine passenden Einträge gefunden.",
  coreRepository: "KERN-BIBLIOTHEK",
  heroTitle: "INGENIEUR-HANDBUCH & NORMEN",
  heroDesc: "Maschinenelemente, Materialeigenschaften, Toleranztabellen und Festigkeitsformeln nach ISO-, DIN-, ASME- und Eurocode-Normen.",
  heroButton: "Werkstoff-Atlas & Ashby →",
  quickRefTitle: "SCHNELLZUGRIFFS-KARTEN",
  allSections: "ALLE ABSCHNITTE",
  viewDetails: "Details anzeigen →",
  backToChapter: "← Zurück zur Kapitelübersicht",
  governingFormula: "Grundlegende Formel",
  specTable: "Spezifikations- und Grenzwerttabelle",
  tags: "Klassifizierungs-Tags",
  subsectionsCount: "Unterabschnitte",

  quickIsoTolerances: "ISO 286 Toleranzen & Passungen",
  quickIsoTolerancesDesc: "Grenzmaße H7/g6, H7/k6, H7/p6 für Wellen und Bohrungen.",
  quickVdi2230: "VDI 2230 Schraubenberechnung",
  quickVdi2230Desc: "Metrische Gewindegeometrie, Anziehdrehmoment und Vorspannkraft.",
  quickIso281: "ISO 281 Wälzlager-Lebensdauer",
  quickIso281Desc: "SKF 6200/6300 Rillenkugellager-Katalogwerte und nominelle Lebensdauer L10h.",
  quickBeams: "Balkenbiegungs-Formeln",
  quickBeamsDesc: "Maximale Durchbiegung und Biegemomente für Einfeld- und Kragträger.",
  quickMohr: "Mohrscher Spannungskreis",
  quickMohrDesc: "Ebene Spannungstransformation, Hauptnormalspannungen und maximale Schubspannung.",
  quickRoughness: "Oberflächenrauheit (Ra/Rz)",
  quickRoughnessDesc: "Fertigungsverfahren und Rauheitsbereiche nach DIN 4768 / ISO 1302.",

  interactiveToolsTitle: "INTERAKTIVE INGENIEUR-SCHNELLTABELLEN",
  toolToleranceCalc: "ISO 286 Passungs- & Toleranzrechner",
  toolToleranceDesc: "Bohrungs- (ES, EI) und Wellen-Abmaße (es, ei), Spiel und Passungsart.",
  toolHardnessConverter: "ASTM E140 Härte- & Festigkeitsumwerter",
  toolHardnessDesc: "Sofortige Umrechnung von HRC, HB, HV, HRB und Zugfestigkeit (Rm).",
  toolPipeSchedules: "ASME B36.10M / ISO 4200 Rohr-Tabelle",
  toolPipeDesc: "Standard-Rohraußendurchmesser, Wandstärken Sch 40 & Sch 80 und Metergewichte.",
  nominalDimension: "Nennmaß d (mm)",
  selectFit: "Passungsklasse",
  holeTolerance: "Bohrungstoleranz (H)",
  shaftTolerance: "Wellentoleranz",
  fitType: "Passungsart",
  clearanceFit: "Spielpassung (Gleit-/Laufpassung)",
  transitionFit: "Übergangspassung",
  interferenceFit: "Presspassung (Feste Passung)",
  maxClearance: "Max. Spiel",
  minClearance: "Min. Spiel",
  hardnessInput: "Härtewert",
  convertedValues: "Umgerechnete Äquivalenzwerte",
  pipeNominalSize: "NPS (Zoll)",
  pipeOD: "Außendurchmesser (mm)",
  pipeWall: "Wandstärke (mm)",
  pipeID: "Innendurchmesser (mm)",
  pipeWeight: "Nenngewicht (kg/m)",

  subtabMatrix: "Matrix & Dossier",
  subtabAshby: "Ashby & Dual-Radar",
  subtabSelector: "KI-Werkstoff-Selektor",
  subtabScatter: "2D Ashby-Streudiagramm",

  catAll: "Alle",
  catAluminum: "Aluminium",
  catSteel: "Stahl",
  catStainless: "Edelstahl",
  catNonFerrous: "Nichteisen",
  catSuperalloy: "Superlegierung",
  catCastIron: "Gusseisen",
  catPlastic: "Kunststoff",
  catComposite: "Verbundwerkstoff",

  matSearchPlaceholder: "Legierung, Norm (z.B. 7075, 4140, Delrin, 1.4301) suchen...",
  matDatabaseCount: "Werkstoffdatenbank für Ingenieure",
  sortedBy: "Sortiert nach Kategorie & Normen",
  colMaterial: "WERKSTOFF",
  colCategory: "KATEGORIE",
  colYield: "DEHNGRENZE Re",
  colTensile: "ZUGFESTIGKEIT Rm",
  colDensity: "DICHTE ρ",
  colEModulus: "E-MODUL",
  colMaxTemp: "MAX. TEMP",
  colCost: "KOSTEN",

  standardClassifications: "NORM-KLASSIFIKATIONEN",
  radarTitle: "6-ACHSEN-WERKSTOFF-PERFORMANZ-RADAR",
  radarStrength: "Festigkeit",
  radarLightness: "Leichtigkeit",
  radarStiffness: "Steifigkeit (E)",
  radarMaxTemp: "Max. Temp.",
  radarCostEff: "Wirtschaftlichkeit",
  radarSpecific: "Spezifisch Re/ρ",
  copyJson: "Spezifikation als JSON kopieren",
  copied: "Kopiert!",
  exportCsv: "Als CSV exportieren",
  propMechanical: "Mechanische Kenngrößen",
  propThermal: "Thermische & Physikalische Werte",
  poissonsRatio: "Poissonzahl ν",
  thermalConductivity: "Wärmeleitfähigkeit k (W/m·K)",
  thermalExpansion: "Wärmeausdehnung α (μm/m·K)",

  comparatorTitle: "DUAL-WERKSTOFF-PERFORMANZ-VERGLEICHER",
  comparatorSubtitle: "Direkter Ashby-Index-Vergleich mit doppeltem SVG-Radar-Overlay.",
  materialA: "Werkstoff A:",
  materialB: "Werkstoff B:",
  specComparison: "SPEZIFIKATIONSVERGLEICH & ABWEICHUNGEN",
  colProperty: "EIGENSCHAFT",
  colDelta: "DELTA (%)",
  rationaleTitle: "AUSWAHLBEGRÜNDUNG",
  propYieldStrength: "Streckgrenze Re",
  propTensileStrength: "Zugfestigkeit Rm",
  propDensity: "Dichte ρ",
  propModulus: "Elastizitätsmodul E",
  propSpecificStrength: "Spezifische Festigkeit Re/ρ",
  propSpecificModulus: "Spezifischer Modul E/ρ",
  propAshbyBeam: "Ashby-Biegeindex Re^(2/3)/ρ",
  propMaxTemp: "Max. Einsatztemperatur",
  propCostIndex: "Relativer Kostenindex",

  scatterTitle: "2D ASHBY-WERKSTOFF-STREUDIAGRAMM",
  scatterSubtitle: "Interaktive Werkstoffraum-Exploration mit Pareto-Effizienzgrenzen.",
  xAxisLabel: "X-Achsen-Eigenschaft",
  yAxisLabel: "Y-Achsen-Eigenschaft",
  xAxisYield: "Streckgrenze (MPa)",
  xAxisDensity: "Dichte (g/cm³)",
  xAxisModulus: "Elastizitätsmodul (GPa)",
  xAxisCost: "Kostenindex (1-10)",
  yAxisYield: "Streckgrenze (MPa)",
  yAxisModulus: "Elastizitätsmodul (GPa)",
  yAxisTemp: "Max. Temperatur (°C)",
  yAxisSpecificStrength: "Spezifische Festigkeit Re/ρ (MPa·cm³/g)",

  selectorTitle: "KI- & RESTRIKTIONS-BASIERTER WERKSTOFFWÄHLER",
  selectorSubtitle: "Mechanische Randbedingungen definieren und industrielle Kandidaten automatisch bewerten.",
  presetsTitle: "ANWENDUNGS-VORLAGEN",
  presetGeneral: "Allgemeiner Maschinenbau",
  presetAerospace: "Luft- & Raumfahrt",
  presetMarine: "Schiffbau & Offshore",
  presetHighTemp: "Hochtemperatur & Abgas",
  presetHeavyCivil: "Schwerer Stahlbau / Gestelle",
  sliderMinYield: "Mindest-Streckgrenze (Re)",
  sliderMaxDensity: "Maximale Dichte (ρ)",
  sliderMinTemp: "Min. Betriebstemperatur (T)",
  economicPriority: "Wirtschaftliche Priorität",
  strictCostFilter: "Strenge Niedrigkosten-Gewichtung",
  neutralCost: "Ausgewogene Kosten-Gewichtung",
  rankedCandidatesTitle: "BEWERTETE WERKSTOFF-KANDIDATEN",
  score: "Score",
  reasonHighYield: "Hohe Streckgrenze",
  reasonLightweight: "Ultra-Leichtbau",
  reasonHighTemp: "Temperaturbeständigkeit",
  reasonCostEff: "Hohe Wirtschaftlichkeit",

  codexTitle: "INDUSTRIELLER INGENIEUR-FORMELKODEX",
  codexSubtitle: "Verifizierte Berechnungsnormen nach ISO, DIN, VDI, ASME und AISC mit direktem Berechnerzugriff.",
  searchFormulaPlaceholder: "Formel oder Normcode suchen...",
  disciplineAll: "Alle Disziplinen",
  disciplineMechanics: "Mechanik & Werkstoffe",
  disciplineFluids: "Strömung & Hydraulik",
  disciplineFasteners: "Schrauben & Verbindungen",
  disciplineMachine: "Maschinenelemente",
  disciplineStructures: "Strukturmechanik",
  disciplineFatigue: "Ermüdung & Dynamik",
  deterministicSolver: "Deterministischer Berechner",
  openSolver: "Berechner öffnen →",
  quickCalc: "Parameter-Schnelltest",
  calculate: "Berechnen"
};

// ─── SPANISH (ES) ───
const ES: HandbookModuleStrings = {
  ...EN,
  appTitle: "MANUAL DE INGENIERÍA ALUCALC",
  appBadge: `v${APP_MAJOR_MINOR} INDUSTRIAL`,
  appSubtitle: "Referencia Unificada de Ingeniería, Atlas de Materiales y Códice de Fórmulas",

  tabStandards: "Normas y Capítulos",
  tabStandardsShort: "Normas",
  tabMaterials: "Atlas de Materiales",
  tabMaterialsShort: "Materiales",
  tabFormulas: "Códice de Fórmulas",
  tabFormulasShort: "Fórmulas",

  searchPlaceholder: "Buscar fórmulas, normas o capítulos...",
  searchResults: "Resultados",
  noResults: "No se encontraron coincidencias.",
  heroTitle: "MANUAL DE INGENIERÍA Y NORMAS",
  heroDesc: "Elementos de máquinas, propiedades de materiales, tolerancias y fórmulas según normas ISO, DIN, ASME y Eurocódigo.",
  heroButton: "Atlas de Materiales y Ashby →",
  quickRefTitle: "TARJETAS DE REFERENCIA RÁPIDA",
  allSections: "TODAS LAS SECCIONES",
  viewDetails: "Ver detalles →",

  colMaterial: "MATERIAL",
  colCategory: "CATEGORÍA",
  colYield: "LÍMITE ELÁSTICO Sy",
  colTensile: "TRACCIÓN Su",
  colDensity: "DENSIDAD ρ",
  colEModulus: "MÓDULO E",
  colMaxTemp: "TEMP MÁX",
  colCost: "COSTE",

  comparatorTitle: "COMPARADOR DUAL DE MATERIALES",
  comparatorSubtitle: "Comparación de índices Ashby lado a lado con radar SVG superpuesto.",
  selectorTitle: "SELECTOR DE MATERIALES BASADO EN IA Y RESTRICCIONES",
  codexTitle: "CÓDICE DE FÓRMULAS DE INGENIERÍA INDUSTRIAL",
  openSolver: "Abrir Calculador →"
};

// ─── FRENCH (FR) ───
const FR: HandbookModuleStrings = {
  ...EN,
  appTitle: "MANUEL D'INGÉNIERIE ALUCALC",
  appBadge: `v${APP_MAJOR_MINOR} INDUSTRIEL`,
  appSubtitle: "Référence d'Ingénierie Unifiée, Atlas des Matériaux et Codex des Formules",

  tabStandards: "Normes & Chapitres",
  tabStandardsShort: "Normes",
  tabMaterials: "Atlas des Matériaux",
  tabMaterialsShort: "Matériaux",
  tabFormulas: "Codex des Formules",
  tabFormulasShort: "Formules",

  searchPlaceholder: "Rechercher formules, normes ou chapitres...",
  searchResults: "Résultats",
  noResults: "Aucun résultat trouvé.",
  heroTitle: "MANUEL D'INGÉNIERIE & NORMES",
  heroDesc: "Éléments de machines, propriétés des matériaux, tolérances et formules selon normes ISO, DIN, ASME et Eurocode.",
  heroButton: "Atlas des Matériaux & Ashby →",
  quickRefTitle: "FICHES DE RÉFÉRENCE RAPIDE",
  allSections: "TOUTES LES SECTIONS",
  viewDetails: "Voir les détails →",

  colMaterial: "MATÉRIAU",
  colCategory: "CATÉGORIE",
  colYield: "LIMITE ÉLASTIQUE Re",
  colTensile: "TRACTION Rm",
  colDensity: "DENSITÉ ρ",
  colEModulus: "MODULE D'YOUNG",
  colMaxTemp: "TEMP MAX",
  colCost: "COÛT",

  comparatorTitle: "COMPARATEUR DOUBLE DE MATÉRIAUX",
  comparatorSubtitle: "Comparaison des indices d'Ashby côte à côte avec radar SVG double.",
  selectorTitle: "SÉLECTEUR DE MATÉRIAUX PAR IA ET CONTRAINTES",
  codexTitle: "CODEX DES FORMULES INDUSTRIELLES",
  openSolver: "Ouvrir le Solveur →"
};

// ─── ITALIAN (IT) ───
const IT: HandbookModuleStrings = {
  ...EN,
  appTitle: "MANUALE DI INGEGNERIA ALUCALC",
  appBadge: `v${APP_MAJOR_MINOR} INDUSTRIALE`,
  appSubtitle: "Riferimento Tecnico Unificato, Atlante dei Materiali e Codice delle Formule",

  tabStandards: "Norme e Capitoli",
  tabStandardsShort: "Norme",
  tabMaterials: "Atlante dei Materiali",
  tabMaterialsShort: "Materiali",
  tabFormulas: "Codice Formule",
  tabFormulasShort: "Formule",

  searchPlaceholder: "Cerca formule, norme o capitoli...",
  searchResults: "Risultati",
  noResults: "Nessun risultato trovato.",
  heroTitle: "MANUALE DI INGEGNERIA & NORME",
  heroDesc: "Elementi di macchine, proprietà dei materiali, tolleranze e formule secondo norme ISO, DIN, ASME ed Eurocodice.",
  heroButton: "Atlante Materiali & Ashby →",
  quickRefTitle: "SCHEDE DI RIFERIMENTO RAPIDO",
  allSections: "TUTTE LE SEZIONI",
  viewDetails: "Vedi dettagli →",

  colMaterial: "MATERIALE",
  colCategory: "CATEGORIA",
  colYield: "SNERVAMENTO Sy",
  colTensile: "TRAZIONE Su",
  colDensity: "DENSITÀ ρ",
  colEModulus: "MODULO E",
  colMaxTemp: "TEMP MAX",
  colCost: "COSTO",

  comparatorTitle: "COMPARATORE DOPPIO DI MATERIALI",
  comparatorSubtitle: "Confronto degli indici di Ashby affiancato con radar SVG sovrapposto.",
  selectorTitle: "SELETTORE MATERIALI BASATO SU IA E VINCOLI",
  codexTitle: "CODICE FORMULE DI INGEGNERIA INDUSTRIALE",
  openSolver: "Apri Risolutore →"
};

// ─── PORTUGUESE (PT) ───
const PT: HandbookModuleStrings = {
  ...EN,
  appTitle: "MANUAL DE ENGENHARIA ALUCALC",
  appBadge: `v${APP_MAJOR_MINOR} INDUSTRIAL`,
  appSubtitle: "Referência Unificada de Engenharia, Atlas de Materiais e Códice de Fórmulas",

  tabStandards: "Normas e Capítulos",
  tabStandardsShort: "Normas",
  tabMaterials: "Atlas de Materiais",
  tabMaterialsShort: "Materiais",
  tabFormulas: "Códice de Fórmulas",
  tabFormulasShort: "Fórmulas",

  searchPlaceholder: "Pesquisar fórmulas, normas ou capítulos...",
  searchResults: "Resultados",
  noResults: "Nenhum resultado encontrado.",
  heroTitle: "MANUAL DE ENGENHARIA & NORMAS",
  heroDesc: "Elementos de máquinas, propriedades dos materiais, tolerâncias e fórmulas de acordo com as normas ISO, DIN, ASME e Eurocódigo.",
  heroButton: "Atlas de Materiais & Ashby →",
  quickRefTitle: "CARTÕES DE REFERÊNCIA RÁPIDA",
  allSections: "TODAS AS SEÇÕES",
  viewDetails: "Ver detalhes →",

  colMaterial: "MATERIAL",
  colCategory: "CATEGORIA",
  colYield: "ESCOAMENTO Sy",
  colTensile: "TRAÇÃO Su",
  colDensity: "DENSIDADE ρ",
  colEModulus: "MÓDULO E",
  colMaxTemp: "TEMP MÁX",
  colCost: "CUSTO",

  comparatorTitle: "COMPARADOR DUPLO DE MATERIAIS",
  comparatorSubtitle: "Comparação de índices Ashby lado a lado com radar SVG sobreposto.",
  selectorTitle: "SELETOR DE MATERIAIS BASEADO EM IA E RESTRIÇÕES",
  codexTitle: "CÓDICE DE FÓRMULAS DE ENGENHARIA INDUSTRIAL",
  openSolver: "Abrir Solucionador →"
};

// ─── RUSSIAN (RU) ───
const RU: HandbookModuleStrings = {
  ...EN,
  appTitle: "СПРАВОЧНИК ИНЖЕНЕРА ALUCALC",
  appBadge: `v${APP_MAJOR_MINOR} INDUSTRIAL`,
  appSubtitle: "Единый инженерный справочник, атлас материалов и кодекс расчетных формул",

  tabStandards: "Стандарты и главы",
  tabStandardsShort: "Стандарты",
  tabMaterials: "Атлас материалов",
  tabMaterialsShort: "Материалы",
  tabFormulas: "Кодекс формул",
  tabFormulasShort: "Формулы",

  searchPlaceholder: "Поиск формул, стандартов и глав...",
  searchResults: "Результаты",
  noResults: "Совпадений не найдено.",
  heroTitle: "ИНЖЕНЕРНЫЙ СПРАВОЧНИК И СТАНДАРТЫ",
  heroDesc: "Детали машин, свойства материалов, таблицы допусков и формулы прочности по стандартам ISO, DIN, ASME и Eurocode.",
  heroButton: "Атлас материалов и Эшби →",
  quickRefTitle: "КАРТЫ БЫСТРОГО ДОСТУПА",
  allSections: "ВСЕ РАЗДЕЛЫ",
  viewDetails: "Подробнее →",

  colMaterial: "МАТЕРИАЛ",
  colCategory: "КАТЕГОРИЯ",
  colYield: "ПРЕДЕЛ ТЕКУЧЕСТИ",
  colTensile: "ПРОЧНОСТЬ Rm",
  colDensity: "ПЛОТНОСТЬ ρ",
  colEModulus: "МОДУЛЬ УПРУГОСТИ",
  colMaxTemp: "МАКС ТЕМП",
  colCost: "СТОИМОСТЬ",

  comparatorTitle: "ДВОЙНОЕ СРАВНЕНИЕ МАТЕРИАЛОВ",
  comparatorSubtitle: "Сравнение индексов Эшби на двойном SVG радарном графике.",
  selectorTitle: "ИИ-ПОДБОР МАТЕРИАЛОВ ПО ОГРАНИЧЕНИЯМ",
  codexTitle: "ИНЖЕНЕРНЫЙ КОДЕКС РАСЧЕТНЫХ ФОРМУЛ",
  openSolver: "Открыть модуль →"
};

// ─── CHINESE (ZH) ───
const ZH: HandbookModuleStrings = {
  ...EN,
  appTitle: "ALUCALC 工程手册",
  appBadge: `v${APP_MAJOR_MINOR} 工业级`,
  appSubtitle: "统一工程技术规范、材料智能图谱与工程公式法典",

  tabStandards: "标准与章节",
  tabStandardsShort: "标准",
  tabMaterials: "材料智能图谱",
  tabMaterialsShort: "材料",
  tabFormulas: "公式法典与求解器",
  tabFormulasShort: "公式",

  searchPlaceholder: "搜索公式、国际标准、手册章节...",
  searchResults: "搜索结果",
  noResults: "未找到匹配条目。",
  heroTitle: "工程手册与国际标准库",
  heroDesc: "基于 ISO、DIN、ASME 和 Eurocode 规范归类的机械零件、材料力学属性、公差配合表与强度公式。",
  heroButton: "材料图谱与阿什比对比 →",
  quickRefTitle: "快速工程查阅卡",
  allSections: "所有技术章节",
  viewDetails: "查看详情 →",

  colMaterial: "材料名称",
  colCategory: "材料分类",
  colYield: "屈服强度 Sy",
  colTensile: "抗拉强度 Su",
  colDensity: "密度 ρ",
  colEModulus: "弹性模量 E",
  colMaxTemp: "最高工作温度",
  colCost: "成本指数",

  comparatorTitle: "双材料性能阿什比对比器",
  comparatorSubtitle: "双层 SVG 雷达图与阿什比性能指数逐项百分比对比分析。",
  selectorTitle: "基于 AI 与工况约束的材料智能优选器",
  codexTitle: "工业工程权威公式法典",
  openSolver: "打开求解器 →"
};

// ─── JAPANESE (JA) ───
const JA: HandbookModuleStrings = {
  ...EN,
  appTitle: "ALUCALC 機械工学便覧",
  appBadge: `v${APP_MAJOR_MINOR} 産業仕様`,
  appSubtitle: "統合工学リファレンス、材料インテリジェンス、公式コード体系",

  tabStandards: "規格と章",
  tabStandardsShort: "規格",
  tabMaterials: "材料インテリジェンス・アトラス",
  tabMaterialsShort: "材料",
  tabFormulas: "公式コーデックス＆ソルバー",
  tabFormulasShort: "公式",

  searchPlaceholder: "公式、規格、章を検索...",
  searchResults: "検索結果",
  noResults: "該当する項目が見つかりません。",
  heroTitle: "工学便覧および国際規格",
  heroDesc: "ISO、DIN、ASME、Eurocode に準拠した機械要素、材料特性、公差表、および強度計算公式。",
  heroButton: "材料アトラス＆アシュビー比較 →",
  quickRefTitle: "クイックリファレンスカード",
  allSections: "全セクション",
  viewDetails: "詳細を見る →",

  colMaterial: "材料名",
  colCategory: "カテゴリ",
  colYield: "降伏点 Sy",
  colTensile: "引張強さ Su",
  colDensity: "密度 ρ",
  colEModulus: "縦弾性係数 E",
  colMaxTemp: "最高使用温度",
  colCost: "相対コスト",

  comparatorTitle: "デュアル材料アシュビー性能比較",
  comparatorSubtitle: "2層SVGレーダーチャートによるアシュビー指数の直接比較。",
  selectorTitle: "AI制約ベース材料セレクター",
  codexTitle: "産業工学公式コーデックス",
  openSolver: "ソルバーを開く →"
};

// ─── KOREAN (KO) ───
const KO: HandbookModuleStrings = {
  ...EN,
  appTitle: "ALUCALC 공학 핸드북",
  appBadge: `v${APP_MAJOR_MINOR} 산업용`,
  appSubtitle: "통합 공학 레퍼런스, 재료 인텔리전스 지도 및 표준 공식집",

  tabStandards: "표준 및 장",
  tabStandardsShort: "표준",
  tabMaterials: "재료 인텔리전스 지도",
  tabMaterialsShort: "재료",
  tabFormulas: "공식집 및 솔버",
  tabFormulasShort: "공식",

  searchPlaceholder: "공식, 표준, 장 검색...",
  searchResults: "검색 결과",
  noResults: "일치하는 항목이 없습니다.",
  heroTitle: "공학 핸드북 & 표준 라이브러리",
  heroDesc: "ISO, DIN, ASME 및 Eurocode 규격에 따라 분류된 기계 요소, 재료 물성치, 공차표 및 강도 해석 공식.",
  heroButton: "재료 아틀라스 & 애쉬비 →",
  quickRefTitle: "빠른 참조 카드",
  allSections: "전체 섹션",
  viewDetails: "상세보기 →",

  colMaterial: "재료",
  colCategory: "범주",
  colYield: "항복강도 Sy",
  colTensile: "인장강도 Su",
  colDensity: "밀도 ρ",
  colEModulus: "탄성계수 E",
  colMaxTemp: "최고 작동온도",
  colCost: "비용 지수",

  comparatorTitle: "이중 재료 애쉬비 비교기",
  comparatorSubtitle: "이중 레이어 SVG 레이더를 통한 애쉬비 지수 분석 및 델타 비교.",
  selectorTitle: "AI 기반 구속조건 재료 선정기",
  codexTitle: "산업 공학 핵심 공식집",
  openSolver: "솔버 실행 →"
};

// ─── ARABIC (AR) ───
const AR: HandbookModuleStrings = {
  ...EN,
  appTitle: "كتيب ألوكالك الهندسي",
  appBadge: `v${APP_MAJOR_MINOR} صناعي`,
  appSubtitle: "المرجع الهندسي الموحد، أطلس المواد وقاموس المعادلات الهندسية",

  tabStandards: "المعايير والفصول",
  tabStandardsShort: "المعايير",
  tabMaterials: "أطلس المواد الذكي",
  tabMaterialsShort: "المواد",
  tabFormulas: "قاموس الصيغ والحلول",
  tabFormulasShort: "الصيغ",

  searchPlaceholder: "البحث عن الصيغ والمعايير...",
  searchResults: "النتائج",
  noResults: "لم يتم العثور على نتائج مطابقة.",
  heroTitle: "الكتيب الهندسي والمعايير الدولية",
  heroDesc: "عناصر الآلات وخصائص المواد وجداول التفاوتات وصيغ المقاومة وفق معايير ISO و DIN و ASME و Eurocode.",
  heroButton: "أطلس المواد وآشبي ←",
  quickRefTitle: "بطاقات المرجع السريع",
  allSections: "جميع الأقسام",
  viewDetails: "عرض التفاصيل ←",

  colMaterial: "المادة",
  colCategory: "التصنيف",
  colYield: "إجهاد الخضوع Sy",
  colTensile: "إجهاد الشد Su",
  colDensity: "الكثافة ρ",
  colEModulus: "معامل المرونة E",
  colMaxTemp: "أقصى حرارة",
  colCost: "التكلفة",

  comparatorTitle: "مقارن أداء المواد المزدوج",
  comparatorSubtitle: "مقارنة مؤشرات آشبي جنباً إلى جنب مع رادار SVG مزدوج.",
  selectorTitle: "محدد المواد الذكي بناءً على القيود الهندسية",
  codexTitle: "قاموس الصيغ الهندسية الصناعية",
  openSolver: "فتح المحلل ←"
};

export function getHandbookModuleTranslations(lang: Language | string): HandbookModuleStrings {
  switch (lang) {
    case 'tr': return TR;
    case 'de': return DE;
    case 'es': return ES;
    case 'fr': return FR;
    case 'it': return IT;
    case 'pt': return PT;
    case 'ru': return RU;
    case 'zh': return ZH;
    case 'ja': return JA;
    case 'ko': return KO;
    case 'ar': return AR;
    default: return EN;
  }
}
