export type CalcModuleId =
  | 'profileWeight' | 'gearDesign' | 'planetaryGear' | 'iso281Bearings' | 'fastenerEngineering'
  | 'strengthAnalysis' | 'beamDeflection' | 'concreteReinf' | 'fatigueLife' | 'advFatigue'
  | 'fitsTolerances' | 'reducerLube' | 'gearboxEngine' | 'rollerChainDrive' | 'beltDrive'
  | 'machiningDetails' | 'nesting2d' | 'cuttingOptimizer' | 'cadEditor' | 'weldCalculator'
  | 'mfgReadiness' | 'mfgSandbox' | 'topologyOpt' | 'machineAssembly' | 'simulationFEA'
  | 'engSelection' | 'sketchPad' | 'sheetMetalBending' | 'costEstimator'
  | 'pumpSuite' | 'fluidDynamics' | 'aerospaceDynamics' | 'navalHydro' | 'kinematics'
  | 'thermalExpansion' | 'physicsSolver'
  | 'materialsDB' | 'materialsIntelligence' | 'materialSelectorAI' | 'failurePrediction'
  | 'failureAnalysis' | 'chemistryLab' | 'biologyGenetics' | 'unitConverter' | 'periodicTable'
  | 'algorithms' | 'digitalLogicLab' | 'engineeringNotes'
  | 'motorSelect' | 'ohmsLaw' | 'voltageDrop' | 'threePhasePower' | 'filterDesign' | 'scientificCalc';

export type CalcGroupKey =
  | 'mechanicalStructural' | 'manufacturingProduction' | 'fluidAerospace'
  | 'intelligenceScience' | 'electricalPower';

type ModuleEntry = { name: string; description: string };

type PageLocale = {
  searchPlaceholder: string;
  engineeringRegistry: string;
  workstationNodes: string;
  groups: Record<CalcGroupKey, string>;
  knowledgeBaseTitle: string;
  knowledgeBaseHighlight: string;
  iso9001Doc: string;
  allDomains: string;
  filterMechanical: string;
  filterStructural: string;
  filterFluid: string;
  filterManufacturing: string;
  filterElectrical: string;
  filterScience: string;
  platformBuild: string;
  enterpriseStable: string;
  footerTitle: string;
  footerSubtitle: string;
  footerCopyright: string;
  modules: Record<CalcModuleId, ModuleEntry>;
};

const EN_MODULES: Record<CalcModuleId, ModuleEntry> = {
  profileWeight: { name: 'Profile Weight', description: 'Aluminum weight & alloy database' },
  gearDesign: { name: 'Gear Design', description: 'Gears, bearings & transmission design' },
  planetaryGear: { name: 'Planetary Gear', description: 'Multi-stage Willis Equation solver' },
  iso281Bearings: { name: 'ISO 281 Bearings', description: 'Bearing life calculation & selection' },
  fastenerEngineering: { name: 'Fastener Engineering', description: 'VDI 2230 torque, preload & bolt assembly analysis' },
  strengthAnalysis: { name: 'Strength Analysis', description: 'Stress, strain, Mohr circle & fatigue' },
  beamDeflection: { name: 'Beam Deflection', description: 'Structural beam analysis & supports' },
  concreteReinf: { name: 'Concrete Reinf.', description: 'RC Suite: Beams & Slabs' },
  fatigueLife: { name: 'Fatigue Life', description: 'Goodman diagrams & S-N curves' },
  advFatigue: { name: 'Adv. Fatigue', description: 'Advanced Fatigue Life Analysis' },
  fitsTolerances: { name: 'Fits & Tolerances', description: 'ISO 286 tolerance analysis' },
  reducerLube: { name: 'Reducer Lube', description: 'Gearbox thermal and lubrication' },
  gearboxEngine: { name: 'Gearbox Engine', description: 'Gearbox Synthesis & Performance' },
  rollerChainDrive: { name: 'Roller Chain Drive', description: 'ISO 606 sprocket ratio, chain length & tension' },
  beltDrive: { name: 'Belt Drive', description: 'Flat & V-belt length, wrap angle & tension' },
  machiningDetails: { name: 'Machining Details', description: 'Imbus, Circlips, Keys & Undercuts' },
  nesting2d: { name: '2D Nesting', description: 'DXF nesting & stock minimization' },
  cuttingOptimizer: { name: 'Cutting Optimizer', description: 'Industrial toolpath optimization' },
  cadEditor: { name: 'CAD Editor', description: 'Parametric CAD Environment' },
  weldCalculator: { name: 'Weld Calculator', description: 'AWS D1.1 weld strength & heat input' },
  mfgReadiness: { name: 'Mfg. Readiness', description: 'Manufacturing Readiness (MRL) Analysis' },
  mfgSandbox: { name: 'Mfg. Sandbox', description: 'Production Simulation Sandbox' },
  topologyOpt: { name: 'Topology Opt.', description: 'Generative Topology Design Engine' },
  machineAssembly: { name: 'Machine Assembly', description: '3D Machine Design & Layout' },
  simulationFEA: { name: 'Simulation FEA', description: 'Finite Element Analysis Workspace' },
  engSelection: { name: 'Eng. Selection', description: 'Part and material selection logic' },
  sketchPad: { name: 'Sketch Pad', description: 'Technical sketching & layout' },
  sheetMetalBending: { name: 'Sheet Metal Bending', description: 'Bending allowance, deduction & K-factor solver' },
  costEstimator: { name: 'Cost Estimator', description: 'Real-time production cost estimator' },
  pumpSuite: { name: 'Pump Suite', description: 'Flow rate, head loss & NPSH analysis' },
  fluidDynamics: { name: 'Fluid Dynamics', description: 'Reynolds number & pipe flow solver' },
  aerospaceDynamics: { name: 'Aerospace Dynamics', description: 'Flight envelope & orbital mechanics' },
  navalHydro: { name: 'Naval Hydro.', description: 'Naval Engineering & Hydrostatics' },
  kinematics: { name: 'Kinematics', description: 'Engineering motion & velocity solvers' },
  thermalExpansion: { name: 'Thermal Expansion', description: 'Material expansion & thermal stress' },
  physicsSolver: { name: 'Physics Solver', description: 'Symbolic Physics CAS Solver' },
  materialsDB: { name: 'Materials DB', description: 'Global Materials Information System' },
  materialsIntelligence: { name: 'Materials Intelligence', description: 'AI-driven Material Explorer' },
  materialSelectorAI: { name: 'Material Selector AI', description: 'AI recommendation for alloys' },
  failurePrediction: { name: 'Failure Prediction', description: 'AI Failure Prediction System' },
  failureAnalysis: { name: 'Failure Analysis', description: 'Diagnosis of mechanical failure modes' },
  chemistryLab: { name: 'Chemistry Lab', description: 'Stoichiometry & Reaction Computing' },
  biologyGenetics: { name: 'Biology Genetics', description: 'Genetics & Bioinformatics Solver' },
  unitConverter: { name: 'Unit Converter', description: 'Standard engineering unit conversions' },
  periodicTable: { name: 'Periodic Table', description: 'Interactive chemical database' },
  algorithms: { name: 'Algorithms', description: 'CS Algorithm Visualizer' },
  digitalLogicLab: { name: 'Digital Logic Lab', description: 'Interactive digital logic gate simulator' },
  engineeringNotes: { name: 'Engineering Notes', description: 'Scratchpad for engineering calculations' },
  motorSelect: { name: 'Motor Select', description: 'Motor Selection Engine' },
  ohmsLaw: { name: "Ohm's Law", description: 'Basic Electrical Computing' },
  voltageDrop: { name: 'Voltage Drop', description: 'Wire sizing and power drop' },
  threePhasePower: { name: '3-Phase Power', description: '3-Phase Power Workstation' },
  filterDesign: { name: 'Filter Design', description: 'Electronic filter design and Bode engine' },
  scientificCalc: { name: 'Scientific Calc', description: 'Scientific Workstation Dashboard' },
};

const TR_MODULES: Record<CalcModuleId, ModuleEntry> = {
  profileWeight: { name: 'Profil Ağırlığı', description: 'Alüminyum ağırlık ve alaşım veritabanı' },
  gearDesign: { name: 'Dişli Tasarımı', description: 'Dişli, rulman ve güç aktarım tasarımı' },
  planetaryGear: { name: 'Planet Dişli', description: 'Çok kademeli Willis denklemi çözücü' },
  iso281Bearings: { name: 'ISO 281 Rulman', description: 'Rulman ömrü hesabı ve seçimi' },
  fastenerEngineering: { name: 'Bağlantı Elemanları', description: 'VDI 2230 tork, ön yük ve cıvata montaj analizi' },
  strengthAnalysis: { name: 'Mukavemet Analizi', description: 'Gerilme, şekil değiştirme, Mohr dairesi ve yorulma' },
  beamDeflection: { name: 'Kiriş Sehimi', description: 'Yapısal kiriş analizi ve mesnetler' },
  concreteReinf: { name: 'Betonarme Donatı', description: 'Betonarme paketi: Kirişler ve döşemeler' },
  fatigueLife: { name: 'Yorulma Ömrü', description: 'Goodman diyagramları ve S-N eğrileri' },
  advFatigue: { name: 'İleri Yorulma', description: 'Gelişmiş yorulma ömrü analizi' },
  fitsTolerances: { name: 'Geçmeler & Tolerans', description: 'ISO 286 tolerans analizi' },
  reducerLube: { name: 'Redüktör Yağlama', description: 'Redüktör termal ve yağlama analizi' },
  gearboxEngine: { name: 'Şanzıman Motoru', description: 'Şanzıman sentezi ve performans' },
  rollerChainDrive: { name: 'Zincir Dişli', description: 'ISO 606 dişli oranı, zincir uzunluğu ve gerilme' },
  beltDrive: { name: 'Kayış Aktarımı', description: 'Düz ve V-kayış uzunluğu, sarım açısı ve gerilme' },
  machiningDetails: { name: 'Talaşlı İmalat Detay', description: 'İmbus, segman, kama ve oyuklar' },
  nesting2d: { name: '2D Nesting', description: 'DXF nesting ve fire minimizasyonu' },
  cuttingOptimizer: { name: 'Kesim Optimizasyonu', description: 'Endüstriyel takım yolu optimizasyonu' },
  cadEditor: { name: 'CAD Editör', description: 'Parametrik CAD ortamı' },
  weldCalculator: { name: 'Kaynak Hesaplayıcı', description: 'AWS D1.1 kaynak mukavemeti ve ısı girdisi' },
  mfgReadiness: { name: 'Üretim Hazırlığı', description: 'Üretim hazırlık seviyesi (MRL) analizi' },
  mfgSandbox: { name: 'Üretim Sandbox', description: 'Üretim simülasyon sandbox' },
  topologyOpt: { name: 'Topoloji Optim.', description: 'Generatif topoloji tasarım motoru' },
  machineAssembly: { name: 'Makine Montajı', description: '3B makine tasarımı ve yerleşim' },
  simulationFEA: { name: 'FEA Simülasyon', description: 'Sonlu elemanlar analiz çalışma alanı' },
  engSelection: { name: 'Mühendislik Seçimi', description: 'Parça ve malzeme seçim mantığı' },
  sketchPad: { name: 'Eskiz Defteri', description: 'Teknik eskiz ve yerleşim' },
  sheetMetalBending: { name: 'Sac Metal Büküm', description: 'Büküm payı, indirgeme ve K-faktör çözücü' },
  costEstimator: { name: 'Maliyet Tahmini', description: 'Gerçek zamanlı üretim maliyeti tahmini' },
  pumpSuite: { name: 'Pompa Paketi', description: 'Debi, basınç kaybı ve NPSH analizi' },
  fluidDynamics: { name: 'Akışkanlar Mekaniği', description: 'Reynolds sayısı ve boru akış çözücü' },
  aerospaceDynamics: { name: 'Havacılık Dinamiği', description: 'Uçuş zarfı ve yörünge mekaniği' },
  navalHydro: { name: 'Denizcilik Hidro.', description: 'Deniz mühendisliği ve hidrostatik' },
  kinematics: { name: 'Kinematik', description: 'Mühendislik hareket ve hız çözücüleri' },
  thermalExpansion: { name: 'Termal Genleşme', description: 'Malzeme genleşmesi ve termal gerilme' },
  physicsSolver: { name: 'Fizik Çözücü', description: 'Sembolik fizik CAS çözücü' },
  materialsDB: { name: 'Malzeme Veritabanı', description: 'Küresel malzeme bilgi sistemi' },
  materialsIntelligence: { name: 'Malzeme Zekası', description: 'Yapay zeka destekli malzeme keşfi' },
  materialSelectorAI: { name: 'Malzeme Seçici AI', description: 'Alaşım önerisi için yapay zeka' },
  failurePrediction: { name: 'Arıza Tahmini', description: 'Yapay zeka arıza tahmin sistemi' },
  failureAnalysis: { name: 'Arıza Analizi', description: 'Mekanik arıza modu teşhisi' },
  chemistryLab: { name: 'Kimya Laboratuvarı', description: 'Stokiyometri ve reaksiyon hesabı' },
  biologyGenetics: { name: 'Biyoloji Genetiği', description: 'Genetik ve biyoinformatik çözücü' },
  unitConverter: { name: 'Birim Dönüştürücü', description: 'Standart mühendislik birim dönüşümleri' },
  periodicTable: { name: 'Periyodik Tablo', description: 'Etkileşimli kimyasal veritabanı' },
  algorithms: { name: 'Algoritmalar', description: 'Bilgisayar bilimi algoritma görselleştirici' },
  digitalLogicLab: { name: 'Dijital Mantık Lab', description: 'Etkileşimli dijital mantık kapı simülatörü' },
  engineeringNotes: { name: 'Mühendislik Notları', description: 'Mühendislik hesapları için taslak defteri' },
  motorSelect: { name: 'Motor Seçimi', description: 'Motor seçim motoru' },
  ohmsLaw: { name: 'Ohm Yasası', description: 'Temel elektrik hesaplamaları' },
  voltageDrop: { name: 'Voltaj Düşüşü', description: 'Kablo boyutlandırma ve güç kaybı' },
  threePhasePower: { name: '3 Fazlı Güç', description: '3 fazlı güç çalışma istasyonu' },
  filterDesign: { name: 'Filtre Tasarımı', description: 'Elektronik filtre tasarımı ve Bode motoru' },
  scientificCalc: { name: 'Bilimsel Hesap', description: 'Bilimsel çalışma istasyonu paneli' },
};

const EN_PAGE: Omit<PageLocale, 'modules'> = {
  searchPlaceholder: 'Search workspaces...',
  engineeringRegistry: 'Engineering Registry',
  workstationNodes: '{count} Unique Workstation Nodes // Deterministic Interface',
  groups: {
    mechanicalStructural: 'Mechanical & Structural',
    manufacturingProduction: 'Manufacturing & Production',
    fluidAerospace: 'Fluid & Aerospace',
    intelligenceScience: 'Intelligence & Science',
    electricalPower: 'Electrical & Power',
  },
  knowledgeBaseTitle: 'Engineering',
  knowledgeBaseHighlight: 'Knowledge Base',
  iso9001Doc: 'ISO 9001 Standardized Documentation',
  allDomains: 'All Domains',
  filterMechanical: 'Mechanical',
  filterStructural: 'Structural',
  filterFluid: 'Fluid',
  filterManufacturing: 'Manufacturing',
  filterElectrical: 'Electrical',
  filterScience: 'Science',
  platformBuild: 'Industrial Platform Build 5.25.x',
  enterpriseStable: 'Enterprise // Stable',
  footerTitle: 'AluCalc OS Neural Core',
  footerSubtitle: 'Hyper-Deterministic Industrial Interface // Build 5.25.0',
  footerCopyright: '© 2026 AluCalc Intelligence Engineering. All rights reserved. Secure terminal session active.',
};

const TR_PAGE: Omit<PageLocale, 'modules'> = {
  searchPlaceholder: 'Çalışma alanlarında ara...',
  engineeringRegistry: 'Mühendislik Kayıt Defteri',
  workstationNodes: '{count} Benzersiz İstasyon Düğümü // Deterministik Arayüz',
  groups: {
    mechanicalStructural: 'Mekanik & Yapısal',
    manufacturingProduction: 'Üretim & İmalat',
    fluidAerospace: 'Akışkan & Havacılık',
    intelligenceScience: 'Zeka & Bilim',
    electricalPower: 'Elektrik & Güç',
  },
  knowledgeBaseTitle: 'Mühendislik',
  knowledgeBaseHighlight: 'Bilgi Bankası',
  iso9001Doc: 'ISO 9001 Standart Dokümantasyon',
  allDomains: 'Tüm Alanlar',
  filterMechanical: 'Mekanik',
  filterStructural: 'Yapısal',
  filterFluid: 'Akışkan',
  filterManufacturing: 'İmalat',
  filterElectrical: 'Elektrik',
  filterScience: 'Bilim',
  platformBuild: 'Endüstriyel Platform Sürüm 5.25.x',
  enterpriseStable: 'Kurumsal // Kararlı',
  footerTitle: 'AluCalc OS Sinir Merkezi',
  footerSubtitle: 'Hiper-Deterministik Endüstriyel Arayüz // Sürüm 5.25.0',
  footerCopyright: '© 2026 AluCalc Intelligence Engineering. Tüm hakları saklıdır. Güvenli terminal oturumu aktif.',
};

const ALL_LOCALES = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'] as const;

export function formatWorkstationNodes(template: string, count: number): string {
  return template.replace('{count}', String(count));
}

/** Maps calculators registry ids to i18nStore module keys (all 12 locale files) */
export const CALC_MODULE_I18N_KEYS: Partial<Record<CalcModuleId, string>> = {
  profileWeight: 'profile-weight',
  gearDesign: 'gears-bearings',
  planetaryGear: 'planetary-gearbox',
  iso281Bearings: 'bearings',
  fastenerEngineering: 'bolt-torque',
  strengthAnalysis: 'strength-analysis',
  beamDeflection: 'beam-deflection',
  fatigueLife: 'fatigue-advanced',
  advFatigue: 'fatigue-advanced',
  fitsTolerances: 'fits-tolerances',
  reducerLube: 'reducer-lubrication',
  gearboxEngine: 'gearbox-design',
  rollerChainDrive: 'chain-drive',
  beltDrive: 'belt-drive',
  machiningDetails: 'machining-details',
  nesting2d: 'nesting-2d',
  cuttingOptimizer: 'cutting-optimizer',
  cadEditor: 'cad-editor',
  weldCalculator: 'welding',
  mfgReadiness: 'manufacturing-readiness',
  mfgSandbox: 'manufacturing-sandbox',
  topologyOpt: 'topology-optimization',
  machineAssembly: 'machine-assembly',
  simulationFEA: 'simulation-fea',
  engSelection: 'engineering-selection',
  sketchPad: 'sketch-pad',
  sheetMetalBending: 'sheet-metal',
  costEstimator: 'cost-estimator',
  pumpSuite: 'pumps',
  fluidDynamics: 'fluid-dynamics',
  aerospaceDynamics: 'aerospace-dynamics',
  navalHydro: 'naval-hydrostatics',
  kinematics: 'physics-kinematics',
  thermalExpansion: 'thermal-expansion',
  physicsSolver: 'physics-solver',
  materialsDB: 'materials-db',
  materialsIntelligence: 'materials-explorer',
  materialSelectorAI: 'material-selector-ai',
  failurePrediction: 'failure-prediction',
  failureAnalysis: 'failure-diagnosis',
  chemistryLab: 'chemistry-reactions',
  biologyGenetics: 'biology-genetics',
  unitConverter: 'unit-converter',
  periodicTable: 'periodic-table',
  algorithms: 'cs-algorithms',
  digitalLogicLab: 'digital-logic',
  engineeringNotes: 'engineering-notes',
  motorSelect: 'motor-selection-std',
  ohmsLaw: 'ohms-law',
  voltageDrop: 'voltage-drop',
  threePhasePower: 'three-phase-power',
  filterDesign: 'filter-design',
  scientificCalc: 'calculator',
};

const DE_PAGE: Omit<PageLocale, 'modules'> = {
  searchPlaceholder: 'Workspaces durchsuchen...',
  engineeringRegistry: 'Ingenieur-Register',
  workstationNodes: '{count} Einzigartige Workstation-Knoten // Deterministische Oberfläche',
  groups: {
    mechanicalStructural: 'Maschinenbau & Statik',
    manufacturingProduction: 'Fertigung & Produktion',
    fluidAerospace: 'Fluid & Luftfahrt',
    intelligenceScience: 'Intelligenz & Wissenschaft',
    electricalPower: 'Elektrik & Leistung',
  },
  knowledgeBaseTitle: 'Ingenieur',
  knowledgeBaseHighlight: 'Wissensdatenbank',
  iso9001Doc: 'ISO 9001 Standarddokumentation',
  allDomains: 'Alle Bereiche',
  filterMechanical: 'Maschinenbau',
  filterStructural: 'Statik',
  filterFluid: 'Fluid',
  filterManufacturing: 'Fertigung',
  filterElectrical: 'Elektrik',
  filterScience: 'Wissenschaft',
  platformBuild: 'Industrielle Plattform Build 5.25.x',
  enterpriseStable: 'Enterprise // Stabil',
  footerTitle: 'AluCalc OS Neural Core',
  footerSubtitle: 'Hyper-deterministische Industrieoberfläche // Build 5.25.0',
  footerCopyright: '© 2026 AluCalc Intelligence Engineering. Alle Rechte vorbehalten.',
};

const ES_PAGE: Omit<PageLocale, 'modules'> = {
  searchPlaceholder: 'Buscar espacios de trabajo...',
  engineeringRegistry: 'Registro de Ingeniería',
  workstationNodes: '{count} Nodos de estación únicos // Interfaz determinista',
  groups: {
    mechanicalStructural: 'Mecánica y Estructural',
    manufacturingProduction: 'Manufactura y Producción',
    fluidAerospace: 'Fluidos y Aeroespacial',
    intelligenceScience: 'Inteligencia y Ciencia',
    electricalPower: 'Eléctrica y Potencia',
  },
  knowledgeBaseTitle: 'Ingeniería',
  knowledgeBaseHighlight: 'Base de Conocimiento',
  iso9001Doc: 'Documentación estandarizada ISO 9001',
  allDomains: 'Todos los dominios',
  filterMechanical: 'Mecánica',
  filterStructural: 'Estructural',
  filterFluid: 'Fluidos',
  filterManufacturing: 'Manufactura',
  filterElectrical: 'Eléctrica',
  filterScience: 'Ciencia',
  platformBuild: 'Plataforma industrial Build 5.25.x',
  enterpriseStable: 'Enterprise // Estable',
  footerTitle: 'AluCalc OS Neural Core',
  footerSubtitle: 'Interfaz industrial hiper-determinista // Build 5.25.0',
  footerCopyright: '© 2026 AluCalc Intelligence Engineering. Todos los derechos reservados.',
};

const FR_PAGE: Omit<PageLocale, 'modules'> = {
  searchPlaceholder: 'Rechercher des espaces de travail...',
  engineeringRegistry: 'Registre d\'Ingénierie',
  workstationNodes: '{count} Nœuds de poste uniques // Interface déterministe',
  groups: {
    mechanicalStructural: 'Mécanique & Structure',
    manufacturingProduction: 'Fabrication & Production',
    fluidAerospace: 'Fluides & Aérospatial',
    intelligenceScience: 'Intelligence & Science',
    electricalPower: 'Électrique & Puissance',
  },
  knowledgeBaseTitle: 'Ingénierie',
  knowledgeBaseHighlight: 'Base de Connaissances',
  iso9001Doc: 'Documentation normalisée ISO 9001',
  allDomains: 'Tous les domaines',
  filterMechanical: 'Mécanique',
  filterStructural: 'Structure',
  filterFluid: 'Fluides',
  filterManufacturing: 'Fabrication',
  filterElectrical: 'Électrique',
  filterScience: 'Science',
  platformBuild: 'Plateforme industrielle Build 5.25.x',
  enterpriseStable: 'Enterprise // Stable',
  footerTitle: 'AluCalc OS Neural Core',
  footerSubtitle: 'Interface industrielle hyper-déterministe // Build 5.25.0',
  footerCopyright: '© 2026 AluCalc Intelligence Engineering. Tous droits réservés.',
};

const IT_PAGE: Omit<PageLocale, 'modules'> = {
  searchPlaceholder: 'Cerca workspace...',
  engineeringRegistry: 'Registro Ingegneristico',
  workstationNodes: '{count} Nodi workstation unici // Interfaccia deterministica',
  groups: {
    mechanicalStructural: 'Meccanica & Strutturale',
    manufacturingProduction: 'Produzione & Manifattura',
    fluidAerospace: 'Fluidi & Aerospaziale',
    intelligenceScience: 'Intelligenza & Scienza',
    electricalPower: 'Elettrica & Potenza',
  },
  knowledgeBaseTitle: 'Ingegneria',
  knowledgeBaseHighlight: 'Base di Conoscenza',
  iso9001Doc: 'Documentazione standard ISO 9001',
  allDomains: 'Tutti i domini',
  filterMechanical: 'Meccanica',
  filterStructural: 'Strutturale',
  filterFluid: 'Fluidi',
  filterManufacturing: 'Manifattura',
  filterElectrical: 'Elettrica',
  filterScience: 'Scienza',
  platformBuild: 'Piattaforma industriale Build 5.25.x',
  enterpriseStable: 'Enterprise // Stabile',
  footerTitle: 'AluCalc OS Neural Core',
  footerSubtitle: 'Interfaccia industriale iper-deterministica // Build 5.25.0',
  footerCopyright: '© 2026 AluCalc Intelligence Engineering. Tutti i diritti riservati.',
};

const PT_PAGE: Omit<PageLocale, 'modules'> = {
  searchPlaceholder: 'Pesquisar workspaces...',
  engineeringRegistry: 'Registro de Engenharia',
  workstationNodes: '{count} Nós de estação únicos // Interface determinística',
  groups: {
    mechanicalStructural: 'Mecânica & Estrutural',
    manufacturingProduction: 'Manufatura & Produção',
    fluidAerospace: 'Fluidos & Aeroespacial',
    intelligenceScience: 'Inteligência & Ciência',
    electricalPower: 'Elétrica & Potência',
  },
  knowledgeBaseTitle: 'Engenharia',
  knowledgeBaseHighlight: 'Base de Conhecimento',
  iso9001Doc: 'Documentação padronizada ISO 9001',
  allDomains: 'Todos os domínios',
  filterMechanical: 'Mecânica',
  filterStructural: 'Estrutural',
  filterFluid: 'Fluidos',
  filterManufacturing: 'Manufatura',
  filterElectrical: 'Elétrica',
  filterScience: 'Ciência',
  platformBuild: 'Plataforma industrial Build 5.25.x',
  enterpriseStable: 'Enterprise // Estável',
  footerTitle: 'AluCalc OS Neural Core',
  footerSubtitle: 'Interface industrial hiper-determinística // Build 5.25.0',
  footerCopyright: '© 2026 AluCalc Intelligence Engineering. Todos os direitos reservados.',
};

const RU_PAGE: Omit<PageLocale, 'modules'> = {
  searchPlaceholder: 'Поиск рабочих областей...',
  engineeringRegistry: 'Инженерный реестр',
  workstationNodes: '{count} Уникальных узлов // Детерминированный интерфейс',
  groups: {
    mechanicalStructural: 'Механика и конструкции',
    manufacturingProduction: 'Производство',
    fluidAerospace: 'Жидкости и авиация',
    intelligenceScience: 'Интеллект и наука',
    electricalPower: 'Электрика и мощность',
  },
  knowledgeBaseTitle: 'Инженерия',
  knowledgeBaseHighlight: 'База знаний',
  iso9001Doc: 'Стандартизированная документация ISO 9001',
  allDomains: 'Все области',
  filterMechanical: 'Механика',
  filterStructural: 'Конструкции',
  filterFluid: 'Жидкости',
  filterManufacturing: 'Производство',
  filterElectrical: 'Электрика',
  filterScience: 'Наука',
  platformBuild: 'Промышленная платформа Build 5.25.x',
  enterpriseStable: 'Enterprise // Стабильно',
  footerTitle: 'AluCalc OS Neural Core',
  footerSubtitle: 'Гипер-детерминированный промышленный интерфейс // Build 5.25.0',
  footerCopyright: '© 2026 AluCalc Intelligence Engineering. Все права защищены.',
};

const ZH_PAGE: Omit<PageLocale, 'modules'> = {
  searchPlaceholder: '搜索工作区...',
  engineeringRegistry: '工程注册表',
  workstationNodes: '{count} 个独特工作站节点 // 确定性界面',
  groups: {
    mechanicalStructural: '机械与结构',
    manufacturingProduction: '制造与生产',
    fluidAerospace: '流体与航空',
    intelligenceScience: '智能与科学',
    electricalPower: '电气与电力',
  },
  knowledgeBaseTitle: '工程',
  knowledgeBaseHighlight: '知识库',
  iso9001Doc: 'ISO 9001 标准化文档',
  allDomains: '所有领域',
  filterMechanical: '机械',
  filterStructural: '结构',
  filterFluid: '流体',
  filterManufacturing: '制造',
  filterElectrical: '电气',
  filterScience: '科学',
  platformBuild: '工业平台 Build 5.25.x',
  enterpriseStable: 'Enterprise // 稳定',
  footerTitle: 'AluCalc OS Neural Core',
  footerSubtitle: '超确定性工业界面 // Build 5.25.0',
  footerCopyright: '© 2026 AluCalc Intelligence Engineering. 保留所有权利。',
};

const JA_PAGE: Omit<PageLocale, 'modules'> = {
  searchPlaceholder: 'ワークスペースを検索...',
  engineeringRegistry: 'エンジニアリングレジストリ',
  workstationNodes: '{count} 個のユニークなワークステーションノード // 決定論的インターフェース',
  groups: {
    mechanicalStructural: '機械・構造',
    manufacturingProduction: '製造・生産',
    fluidAerospace: '流体・航空',
    intelligenceScience: 'インテリジェンス・科学',
    electricalPower: '電気・電力',
  },
  knowledgeBaseTitle: 'エンジニアリング',
  knowledgeBaseHighlight: 'ナレッジベース',
  iso9001Doc: 'ISO 9001 標準ドキュメント',
  allDomains: 'すべての領域',
  filterMechanical: '機械',
  filterStructural: '構造',
  filterFluid: '流体',
  filterManufacturing: '製造',
  filterElectrical: '電気',
  filterScience: '科学',
  platformBuild: '産業プラットフォーム Build 5.25.x',
  enterpriseStable: 'Enterprise // 安定',
  footerTitle: 'AluCalc OS Neural Core',
  footerSubtitle: 'ハイパー決定論的産業インターフェース // Build 5.25.0',
  footerCopyright: '© 2026 AluCalc Intelligence Engineering. All rights reserved.',
};

const KO_PAGE: Omit<PageLocale, 'modules'> = {
  searchPlaceholder: '워크스페이스 검색...',
  engineeringRegistry: '엔지니어링 레지스트리',
  workstationNodes: '{count}개의 고유 워크스테이션 노드 // 결정론적 인터페이스',
  groups: {
    mechanicalStructural: '기계 및 구조',
    manufacturingProduction: '제조 및 생산',
    fluidAerospace: '유체 및 항공',
    intelligenceScience: '지능 및 과학',
    electricalPower: '전기 및 전력',
  },
  knowledgeBaseTitle: '엔지니어링',
  knowledgeBaseHighlight: '지식 베이스',
  iso9001Doc: 'ISO 9001 표준 문서',
  allDomains: '모든 도메인',
  filterMechanical: '기계',
  filterStructural: '구조',
  filterFluid: '유체',
  filterManufacturing: '제조',
  filterElectrical: '전기',
  filterScience: '과학',
  platformBuild: '산업 플랫폼 Build 5.25.x',
  enterpriseStable: 'Enterprise // 안정',
  footerTitle: 'AluCalc OS Neural Core',
  footerSubtitle: '초결정론적 산업 인터페이스 // Build 5.25.0',
  footerCopyright: '© 2026 AluCalc Intelligence Engineering. All rights reserved.',
};

const AR_PAGE: Omit<PageLocale, 'modules'> = {
  searchPlaceholder: 'البحث في مساحات العمل...',
  engineeringRegistry: 'سجل الهندسة',
  workstationNodes: '{count} عقد محطة فريدة // واجهة حتمية',
  groups: {
    mechanicalStructural: 'الميكانيكا والهياكل',
    manufacturingProduction: 'التصنيع والإنتاج',
    fluidAerospace: 'السوائل والطيران',
    intelligenceScience: 'الذكاء والعلوم',
    electricalPower: 'الكهرباء والطاقة',
  },
  knowledgeBaseTitle: 'الهندسة',
  knowledgeBaseHighlight: 'قاعدة المعرفة',
  iso9001Doc: 'توثيق معياري ISO 9001',
  allDomains: 'جميع المجالات',
  filterMechanical: 'ميكانيكا',
  filterStructural: 'هياكل',
  filterFluid: 'سوائل',
  filterManufacturing: 'تصنيع',
  filterElectrical: 'كهرباء',
  filterScience: 'علوم',
  platformBuild: 'منصة صناعية Build 5.25.x',
  enterpriseStable: 'Enterprise // مستقر',
  footerTitle: 'AluCalc OS Neural Core',
  footerSubtitle: 'واجهة صناعية حتمية فائقة // Build 5.25.0',
  footerCopyright: '© 2026 AluCalc Intelligence Engineering. جميع الحقوق محفوظة.',
};

const PAGE_BY_LOCALE: Record<string, Omit<PageLocale, 'modules'>> = {
  en: EN_PAGE,
  tr: TR_PAGE,
  de: DE_PAGE,
  es: ES_PAGE,
  fr: FR_PAGE,
  it: IT_PAGE,
  pt: PT_PAGE,
  ru: RU_PAGE,
  zh: ZH_PAGE,
  ja: JA_PAGE,
  ko: KO_PAGE,
  ar: AR_PAGE,
};

export const CALCULATORS_PAGE: Record<string, PageLocale> = {};

for (const locale of ALL_LOCALES) {
  const page = PAGE_BY_LOCALE[locale] ?? EN_PAGE;
  const modules = locale === 'tr' ? TR_MODULES : EN_MODULES;
  CALCULATORS_PAGE[locale] = { ...page, modules };
}

export function getCalculatorsPage(locale: string): PageLocale {
  return CALCULATORS_PAGE[locale] || CALCULATORS_PAGE.en;
}
