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

const DE_MODULES: Record<CalcModuleId, ModuleEntry> = {
    profileWeight: {
        name: "Profilgewicht",
        description: "Aluminiumgewicht und Legierungsdatenbank",
    },
    gearDesign: {
        name: "Zahnradkonstruktion",
        description: "Zahnräder, Lager und Getriebekonstruktion",
    },
    planetaryGear: {
        name: "Planetengetriebe",
        description: "Mehrstufiger Willis-Gleichungslöser",
    },
    iso281Bearings: {
        name: "ISO 281 Lager",
        description: "Lagerlebensdauerberechnung und -auswahl",
    },
    fastenerEngineering: {
        name: "Verbindungstechnik",
        description: "VDI 2230 Drehmoment, Vorspannung und Schraubenverbindungsanalyse",
    },
    strengthAnalysis: {
        name: "Festigkeitsanalyse",
        description: "Spannung, Dehnung, Mohr-Kreis und Ermüdung",
    },
    beamDeflection: {
        name: "Balkendurchbiegung",
        description: "Strukturelle Balkenanalyse und Auflager",
    },
    concreteReinf: {
        name: "Stahlbeton",
        description: "Stahlbeton-Suite: Träger und Decken",
    },
    fatigueLife: {
        name: "Ermüdungslebensdauer",
        description: "Goodman-Diagramme und S-N-Kurven",
    },
    advFatigue: {
        name: "Erweit. Ermüdung",
        description: "Erweiterte Ermüdungslebensdaueranalyse",
    },
    fitsTolerances: {
        name: "Passungen & Toleranzen",
        description: "ISO 286 Toleranzanalyse",
    },
    reducerLube: {
        name: "Getriebe-Schmierung",
        description: "Getriebe-Thermik und Schmierung",
    },
    gearboxEngine: {
        name: "Getriebemotor",
        description: "Getriebesynthese und Leistung",
    },
    rollerChainDrive: {
        name: "Rollenkettentrieb",
        description: "ISO 606 Kettenradverhältnis, Kettenlänge und Spannung",
    },
    beltDrive: {
        name: "Riemenantrieb",
        description: "Flach- und Keilriemenlänge, Umschlingungswinkel und Spannung",
    },
    machiningDetails: {
        name: "Bearbeitungsdetails",
        description: "Imbus, Sicherungsringe, Passfedern und Freistiche",
    },
    nesting2d: {
        name: "2D-Nesting",
        description: "DXF-Nesting und Materialminimierung",
    },
    cuttingOptimizer: {
        name: "Schnittoptimierer",
        description: "Industrielle Werkzeugbahnoptimierung",
    },
    cadEditor: {
        name: "CAD-Editor",
        description: "Parametrische CAD-Umgebung",
    },
    weldCalculator: {
        name: "Schweißrechner",
        description: "AWS D1.1 Schweißnahtfestigkeit und Wärmeeintrag",
    },
    mfgReadiness: {
        name: "Fertigungsreife",
        description: "Manufacturing Readiness Level (MRL) Analyse",
    },
    mfgSandbox: {
        name: "Fertigungs-Sandbox",
        description: "Produktionssimulations-Sandbox",
    },
    topologyOpt: {
        name: "Topologie-Opt.",
        description: "Generative Topologie-Design-Engine",
    },
    machineAssembly: {
        name: "Maschinenbaugruppe",
        description: "3D-Maschinenkonstruktion und Layout",
    },
    simulationFEA: {
        name: "FEA-Simulation",
        description: "Finite-Elemente-Analyse-Arbeitsbereich",
    },
    engSelection: {
        name: "Konstruktionsauswahl",
        description: "Teile- und Materialauswahl-Logik",
    },
    sketchPad: {
        name: "Skizzenblock",
        description: "Technisches Skizzieren und Layout",
    },
    sheetMetalBending: {
        name: "Blechbiegen",
        description: "Biegezugabe, Abzug und K-Faktor-Löser",
    },
    costEstimator: {
        name: "Kostenschätzer",
        description: "Echtzeit-Produktionskostenschätzung",
    },
    pumpSuite: {
        name: "Pumpen-Suite",
        description: "Durchfluss, Druckverlust und NPSH-Analyse",
    },
    fluidDynamics: {
        name: "Strömungsmechanik",
        description: "Reynolds-Zahl und Rohrströmungslöser",
    },
    aerospaceDynamics: {
        name: "Luftfahrtdynamik",
        description: "Flugbereich und Orbitalmechanik",
    },
    navalHydro: {
        name: "Schiffshydro.",
        description: "Schiffstechnik und Hydrostatik",
    },
    kinematics: {
        name: "Kinematik",
        description: "Technische Bewegungs- und Geschwindigkeitslöser",
    },
    thermalExpansion: {
        name: "Thermische Ausdehnung",
        description: "Materialexpansion und thermische Spannung",
    },
    physicsSolver: {
        name: "Physiklöser",
        description: "Symbolischer Physik-CAS-Löser",
    },
    materialsDB: {
        name: "Materialdatenbank",
        description: "Globales Materialinformationssystem",
    },
    materialsIntelligence: {
        name: "Materialintelligenz",
        description: "KI-gestützter Material-Explorer",
    },
    materialSelectorAI: {
        name: "Materialauswahl KI",
        description: "KI-Empfehlung für Legierungen",
    },
    failurePrediction: {
        name: "Ausfallvorhersage",
        description: "KI-Ausfallvorhersagesystem",
    },
    failureAnalysis: {
        name: "Ausfallanalyse",
        description: "Diagnose mechanischer Ausfallmodi",
    },
    chemistryLab: {
        name: "Chemielabor",
        description: "Stöchiometrie und Reaktionsberechnung",
    },
    biologyGenetics: {
        name: "Biologie & Genetik",
        description: "Genetik- und Bioinformatik-Löser",
    },
    unitConverter: {
        name: "Einheitenumrechner",
        description: "Standardtechnische Einheitenumrechnungen",
    },
    periodicTable: {
        name: "Periodensystem",
        description: "Interaktive chemische Datenbank",
    },
    algorithms: {
        name: "Algorithmen",
        description: "Informatik-Algorithmus-Visualisierer",
    },
    digitalLogicLab: {
        name: "Digitallogik-Lab",
        description: "Interaktiver Digitallogik-Gatter-Simulator",
    },
    engineeringNotes: {
        name: "Ingenieur-Notizen",
        description: "Notizblock für technische Berechnungen",
    },
    motorSelect: {
        name: "Motorauswahl",
        description: "Motorauswahl-Engine",
    },
    ohmsLaw: {
        name: "Ohmsches Gesetz",
        description: "Grundlegende elektrische Berechnungen",
    },
    voltageDrop: {
        name: "Spannungsabfall",
        description: "Kabeldimensionierung und Leistungsverlust",
    },
    threePhasePower: {
        name: "Drehstrom",
        description: "Drehstrom-Arbeitsstation",
    },
    filterDesign: {
        name: "Filterdesign",
        description: "Elektronischer Filterentwurf und Bode-Engine",
    },
    scientificCalc: {
        name: "Wissenschaftl. Rechner",
        description: "Wissenschaftliches Arbeitsstations-Dashboard",
    },
};

const ES_MODULES: Record<CalcModuleId, ModuleEntry> = {
    profileWeight: {
        name: "Peso de Perfil",
        description: "Peso de aluminio y base de datos de aleaciones",
    },
    gearDesign: {
        name: "Diseño de Engranajes",
        description: "Engranajes, rodamientos y diseño de transmisión",
    },
    planetaryGear: {
        name: "Engranaje Planetario",
        description: "Solucionador de ecuación de Willis multietapa",
    },
    iso281Bearings: {
        name: "Rodamientos ISO 281",
        description: "Cálculo y selección de vida útil de rodamientos",
    },
    fastenerEngineering: {
        name: "Elementos de Fijación",
        description: "VDI 2230 par, precarga y análisis de ensamblaje de pernos",
    },
    strengthAnalysis: {
        name: "Análisis de Resistencia",
        description: "Tensión, deformación, círculo de Mohr y fatiga",
    },
    beamDeflection: {
        name: "Deflexión de Viga",
        description: "Análisis estructural de vigas y apoyos",
    },
    concreteReinf: {
        name: "Hormigón Armado",
        description: "Suite HA: Vigas y losas",
    },
    fatigueLife: {
        name: "Vida a Fatiga",
        description: "Diagramas de Goodman y curvas S-N",
    },
    advFatigue: {
        name: "Fatiga Avanzada",
        description: "Análisis avanzado de vida a fatiga",
    },
    fitsTolerances: {
        name: "Ajustes y Tolerancias",
        description: "Análisis de tolerancias ISO 286",
    },
    reducerLube: {
        name: "Lubricación Reductor",
        description: "Térmica y lubricación de reductor",
    },
    gearboxEngine: {
        name: "Motor de Caja",
        description: "Síntesis y rendimiento de caja de cambios",
    },
    rollerChainDrive: {
        name: "Cadena de Rodillos",
        description: "ISO 606 relación de piñón, longitud de cadena y tensión",
    },
    beltDrive: {
        name: "Transmisión por Correa",
        description: "Longitud de correa plana y en V, ángulo de abrazamiento y tensión",
    },
    machiningDetails: {
        name: "Detalles de Mecanizado",
        description: "Imbus, anillos elásticos, chavetas y rebajes",
    },
    nesting2d: {
        name: "Nesting 2D",
        description: "Nesting DXF y minimización de material",
    },
    cuttingOptimizer: {
        name: "Optimizador de Corte",
        description: "Optimización industrial de trayectorias de herramienta",
    },
    cadEditor: {
        name: "Editor CAD",
        description: "Entorno CAD paramétrico",
    },
    weldCalculator: {
        name: "Calculadora de Soldadura",
        description: "AWS D1.1 resistencia de soldadura y aporte de calor",
    },
    mfgReadiness: {
        name: "Preparación Mfg.",
        description: "Análisis de Manufacturing Readiness Level (MRL)",
    },
    mfgSandbox: {
        name: "Sandbox Mfg.",
        description: "Sandbox de simulación de producción",
    },
    topologyOpt: {
        name: "Optim. Topología",
        description: "Motor de diseño topológico generativo",
    },
    machineAssembly: {
        name: "Ensamblaje de Máquina",
        description: "Diseño y disposición de máquinas 3D",
    },
    simulationFEA: {
        name: "Simulación FEA",
        description: "Espacio de trabajo de análisis de elementos finitos",
    },
    engSelection: {
        name: "Selección Ing.",
        description: "Lógica de selección de piezas y materiales",
    },
    sketchPad: {
        name: "Bloc de Bocetos",
        description: "Bocetado técnico y diseño",
    },
    sheetMetalBending: {
        name: "Plegado de Chapa",
        description: "Desarrollo de plegado, deducción y solucionador de factor K",
    },
    costEstimator: {
        name: "Estimador de Costes",
        description: "Estimador de coste de producción en tiempo real",
    },
    pumpSuite: {
        name: "Suite de Bombas",
        description: "Caudal, pérdida de carga y análisis NPSH",
    },
    fluidDynamics: {
        name: "Dinámica de Fluidos",
        description: "Número de Reynolds y solucionador de flujo en tuberías",
    },
    aerospaceDynamics: {
        name: "Dinámica Aeroespacial",
        description: "Envolvente de vuelo y mecánica orbital",
    },
    navalHydro: {
        name: "Hidro. Naval",
        description: "Ingeniería naval e hidrostática",
    },
    kinematics: {
        name: "Cinemática",
        description: "Solucionadores de movimiento y velocidad de ingeniería",
    },
    thermalExpansion: {
        name: "Expansión Térmica",
        description: "Expansión de material y tensión térmica",
    },
    physicsSolver: {
        name: "Solucionador Físico",
        description: "Solucionador CAS de física simbólica",
    },
    materialsDB: {
        name: "Base de Materiales",
        description: "Sistema global de información de materiales",
    },
    materialsIntelligence: {
        name: "Inteligencia de Materiales",
        description: "Explorador de materiales impulsado por IA",
    },
    materialSelectorAI: {
        name: "Selector de Material IA",
        description: "Recomendación IA para aleaciones",
    },
    failurePrediction: {
        name: "Predicción de Fallo",
        description: "Sistema de predicción de fallos con IA",
    },
    failureAnalysis: {
        name: "Análisis de Fallo",
        description: "Diagnóstico de modos de fallo mecánico",
    },
    chemistryLab: {
        name: "Laboratorio de Química",
        description: "Estequiometría y cálculo de reacciones",
    },
    biologyGenetics: {
        name: "Biología y Genética",
        description: "Solucionador de genética y bioinformática",
    },
    unitConverter: {
        name: "Conversor de Unidades",
        description: "Conversiones estándar de unidades de ingeniería",
    },
    periodicTable: {
        name: "Tabla Periódica",
        description: "Base de datos química interactiva",
    },
    algorithms: {
        name: "Algoritmos",
        description: "Visualizador de algoritmos de informática",
    },
    digitalLogicLab: {
        name: "Lab. Lógica Digital",
        description: "Simulador interactivo de puertas lógicas digitales",
    },
    engineeringNotes: {
        name: "Notas de Ingeniería",
        description: "Bloc de notas para cálculos de ingeniería",
    },
    motorSelect: {
        name: "Selección de Motor",
        description: "Motor de selección de motores",
    },
    ohmsLaw: {
        name: "Ley de Ohm",
        description: "Cálculos eléctricos básicos",
    },
    voltageDrop: {
        name: "Caída de Tensión",
        description: "Dimensionado de cables y caída de potencia",
    },
    threePhasePower: {
        name: "Potencia Trifásica",
        description: "Estación de trabajo de potencia trifásica",
    },
    filterDesign: {
        name: "Diseño de Filtros",
        description: "Diseño de filtros electrónicos y motor Bode",
    },
    scientificCalc: {
        name: "Calc. Científica",
        description: "Panel de estación de trabajo científica",
    },
};

const FR_MODULES: Record<CalcModuleId, ModuleEntry> = {
    profileWeight: {
        name: "Poids de Profilé",
        description: "Poids aluminium et base de données d’alliages",
    },
    gearDesign: {
        name: "Conception d’Engrenages",
        description: "Engrenages, roulements et conception de transmission",
    },
    planetaryGear: {
        name: "Engrenage Planétaire",
        description: "Solveur d’équation de Willis multi-étages",
    },
    iso281Bearings: {
        name: "Roulements ISO 281",
        description: "Calcul et sélection de durée de vie des roulements",
    },
    fastenerEngineering: {
        name: "Éléments de Fixation",
        description: "VDI 2230 couple, précharge et analyse d’assemblage boulonné",
    },
    strengthAnalysis: {
        name: "Analyse de Résistance",
        description: "Contrainte, déformation, cercle de Mohr et fatigue",
    },
    beamDeflection: {
        name: "Flèche de Poutre",
        description: "Analyse structurale de poutres et appuis",
    },
    concreteReinf: {
        name: "Béton Armé",
        description: "Suite BA : Poutres et dalles",
    },
    fatigueLife: {
        name: "Durée de Vie en Fatigue",
        description: "Diagrammes de Goodman et courbes S-N",
    },
    advFatigue: {
        name: "Fatigue Avancée",
        description: "Analyse avancée de durée de vie en fatigue",
    },
    fitsTolerances: {
        name: "Ajustements & Tolérances",
        description: "Analyse de tolérances ISO 286",
    },
    reducerLube: {
        name: "Lubrification Réducteur",
        description: "Thermique et lubrification de réducteur",
    },
    gearboxEngine: {
        name: "Moteur de Boîte",
        description: "Synthèse et performance de boîte de vitesses",
    },
    rollerChainDrive: {
        name: "Chaîne à Rouleaux",
        description: "ISO 606 rapport de pignon, longueur de chaîne et tension",
    },
    beltDrive: {
        name: "Transmission par Courroie",
        description: "Longueur courroie plate et trapézoïdale, angle d’enroulement et tension",
    },
    machiningDetails: {
        name: "Détails d’Usinage",
        description: "Imbus, circlips, clavettes et dégagements",
    },
    nesting2d: {
        name: "Nesting 2D",
        description: "Nesting DXF et minimisation de matière",
    },
    cuttingOptimizer: {
        name: "Optimiseur de Découpe",
        description: "Optimisation industrielle de trajectoires d’outil",
    },
    cadEditor: {
        name: "Éditeur CAO",
        description: "Environnement CAO paramétrique",
    },
    weldCalculator: {
        name: "Calculateur de Soudure",
        description: "AWS D1.1 résistance de soudure et apport de chaleur",
    },
    mfgReadiness: {
        name: "Préparation Fab.",
        description: "Analyse Manufacturing Readiness Level (MRL)",
    },
    mfgSandbox: {
        name: "Sandbox Fab.",
        description: "Sandbox de simulation de production",
    },
    topologyOpt: {
        name: "Optim. Topologie",
        description: "Moteur de conception topologique générative",
    },
    machineAssembly: {
        name: "Assemblage Machine",
        description: "Conception et disposition de machines 3D",
    },
    simulationFEA: {
        name: "Simulation FEA",
        description: "Espace de travail d’analyse par éléments finis",
    },
    engSelection: {
        name: "Sélection Ing.",
        description: "Logique de sélection de pièces et matériaux",
    },
    sketchPad: {
        name: "Bloc-Croquis",
        description: "Esquisse technique et mise en page",
    },
    sheetMetalBending: {
        name: "Pliage Tôle",
        description: "Développé de pliage, déduction et solveur facteur K",
    },
    costEstimator: {
        name: "Estimateur de Coût",
        description: "Estimateur de coût de production en temps réel",
    },
    pumpSuite: {
        name: "Suite Pompes",
        description: "Débit, perte de charge et analyse NPSH",
    },
    fluidDynamics: {
        name: "Dynamique des Fluides",
        description: "Nombre de Reynolds et solveur d’écoulement en conduite",
    },
    aerospaceDynamics: {
        name: "Dynamique Aérospatiale",
        description: "Enveloppe de vol et mécanique orbitale",
    },
    navalHydro: {
        name: "Hydro. Navale",
        description: "Ingénierie navale et hydrostatique",
    },
    kinematics: {
        name: "Cinématique",
        description: "Solveurs de mouvement et vitesse en ingénierie",
    },
    thermalExpansion: {
        name: "Expansion Thermique",
        description: "Expansion matériau et contrainte thermique",
    },
    physicsSolver: {
        name: "Solveur Physique",
        description: "Solveur CAS de physique symbolique",
    },
    materialsDB: {
        name: "Base Matériaux",
        description: "Système mondial d’information sur les matériaux",
    },
    materialsIntelligence: {
        name: "Intelligence Matériaux",
        description: "Explorateur de matériaux piloté par IA",
    },
    materialSelectorAI: {
        name: "Sélecteur Matériau IA",
        description: "Recommandation IA pour alliages",
    },
    failurePrediction: {
        name: "Prédiction de Défaillance",
        description: "Système de prédiction de défaillance par IA",
    },
    failureAnalysis: {
        name: "Analyse de Défaillance",
        description: "Diagnostic des modes de défaillance mécanique",
    },
    chemistryLab: {
        name: "Laboratoire de Chimie",
        description: "Stœchiométrie et calcul de réactions",
    },
    biologyGenetics: {
        name: "Biologie & Génétique",
        description: "Solveur de génétique et bioinformatique",
    },
    unitConverter: {
        name: "Convertisseur d’Unités",
        description: "Conversions standard d’unités d’ingénierie",
    },
    periodicTable: {
        name: "Tableau Périodique",
        description: "Base de données chimique interactive",
    },
    algorithms: {
        name: "Algorithmes",
        description: "Visualiseur d’algorithmes informatiques",
    },
    digitalLogicLab: {
        name: "Lab. Logique Numérique",
        description: "Simulateur interactif de portes logiques numériques",
    },
    engineeringNotes: {
        name: "Notes d’Ingénierie",
        description: "Bloc-notes pour calculs d’ingénierie",
    },
    motorSelect: {
        name: "Sélection Moteur",
        description: "Moteur de sélection de moteurs",
    },
    ohmsLaw: {
        name: "Loi d’Ohm",
        description: "Calculs électriques de base",
    },
    voltageDrop: {
        name: "Chute de Tension",
        description: "Dimensionnement de câbles et perte de puissance",
    },
    threePhasePower: {
        name: "Puissance Triphasée",
        description: "Poste de travail puissance triphasée",
    },
    filterDesign: {
        name: "Conception de Filtres",
        description: "Conception de filtres électroniques et moteur Bode",
    },
    scientificCalc: {
        name: "Calc. Scientifique",
        description: "Tableau de bord de poste scientifique",
    },
};

const IT_MODULES: Record<CalcModuleId, ModuleEntry> = {
    profileWeight: {
        name: "Peso Profilo",
        description: "Peso alluminio e database leghe",
    },
    gearDesign: {
        name: "Progettazione Ingranaggi",
        description: "Ingranaggi, cuscinetti e progettazione trasmissioni",
    },
    planetaryGear: {
        name: "Ingranaggio Planetario",
        description: "Risolutore equazione di Willis multistadio",
    },
    iso281Bearings: {
        name: "Cuscinetti ISO 281",
        description: "Calcolo e selezione vita utile cuscinetti",
    },
    fastenerEngineering: {
        name: "Elementi di Fissaggio",
        description: "VDI 2230 coppia, precarico e analisi assemblaggio bulloni",
    },
    strengthAnalysis: {
        name: "Analisi di Resistenza",
        description: "Tensione, deformazione, cerchio di Mohr e fatica",
    },
    beamDeflection: {
        name: "Freccia Trave",
        description: "Analisi strutturale travi e appoggi",
    },
    concreteReinf: {
        name: "Cemento Armato",
        description: "Suite CA: Travi e solai",
    },
    fatigueLife: {
        name: "Vita a Fatica",
        description: "Diagrammi di Goodman e curve S-N",
    },
    advFatigue: {
        name: "Fatica Avanzata",
        description: "Analisi avanzata vita a fatica",
    },
    fitsTolerances: {
        name: "Accoppiamenti & Tolleranze",
        description: "Analisi tolleranze ISO 286",
    },
    reducerLube: {
        name: "Lubrificazione Riduttore",
        description: "Termica e lubrificazione riduttore",
    },
    gearboxEngine: {
        name: "Motore Cambio",
        description: "Sintesi e prestazioni cambio",
    },
    rollerChainDrive: {
        name: "Catena a Rulli",
        description: "ISO 606 rapporto pignone, lunghezza catena e tensione",
    },
    beltDrive: {
        name: "Trasmissione a Cinghia",
        description: "Lunghezza cinghia piatta e trapezoidale, angolo avvolgimento e tensione",
    },
    machiningDetails: {
        name: "Dettagli di Lavorazione",
        description: "Imbus, anelli elastici, chiavette e sottosquadri",
    },
    nesting2d: {
        name: "Nesting 2D",
        description: "Nesting DXF e minimizzazione materiale",
    },
    cuttingOptimizer: {
        name: "Ottimizzatore Taglio",
        description: "Ottimizzazione industriale percorsi utensile",
    },
    cadEditor: {
        name: "Editor CAD",
        description: "Ambiente CAD parametrico",
    },
    weldCalculator: {
        name: "Calcolatore Saldatura",
        description: "AWS D1.1 resistenza saldatura e apporto termico",
    },
    mfgReadiness: {
        name: "Prontezza Prod.",
        description: "Analisi Manufacturing Readiness Level (MRL)",
    },
    mfgSandbox: {
        name: "Sandbox Prod.",
        description: "Sandbox simulazione produzione",
    },
    topologyOpt: {
        name: "Ottim. Topologia",
        description: "Motore progettazione topologica generativa",
    },
    machineAssembly: {
        name: "Assemblaggio Macchina",
        description: "Progettazione e layout macchine 3D",
    },
    simulationFEA: {
        name: "Simulazione FEA",
        description: "Area di lavoro analisi agli elementi finiti",
    },
    engSelection: {
        name: "Selezione Ing.",
        description: "Logica selezione componenti e materiali",
    },
    sketchPad: {
        name: "Blocco Schizzi",
        description: "Schizzo tecnico e layout",
    },
    sheetMetalBending: {
        name: "Piegatura Lamiera",
        description: "Sviluppo piega, deduzione e risolutore fattore K",
    },
    costEstimator: {
        name: "Stimatore Costi",
        description: "Stimatore costo produzione in tempo reale",
    },
    pumpSuite: {
        name: "Suite Pompe",
        description: "Portata, perdita di carico e analisi NPSH",
    },
    fluidDynamics: {
        name: "Dinamica dei Fluidi",
        description: "Numero di Reynolds e risolutore flusso in tubi",
    },
    aerospaceDynamics: {
        name: "Dinamica Aerospaziale",
        description: "Inviluppo di volo e meccanica orbitale",
    },
    navalHydro: {
        name: "Idro. Navale",
        description: "Ingegneria navale e idrostatica",
    },
    kinematics: {
        name: "Cinematica",
        description: "Risolutori movimento e velocità ingegneristici",
    },
    thermalExpansion: {
        name: "Espansione Termica",
        description: "Espansione materiale e tensione termica",
    },
    physicsSolver: {
        name: "Risolutore Fisico",
        description: "Risolutore CAS fisica simbolica",
    },
    materialsDB: {
        name: "Database Materiali",
        description: "Sistema globale informazioni materiali",
    },
    materialsIntelligence: {
        name: "Intelligenza Materiali",
        description: "Esploratore materiali guidato da IA",
    },
    materialSelectorAI: {
        name: "Selettore Materiale IA",
        description: "Raccomandazione IA per leghe",
    },
    failurePrediction: {
        name: "Previsione Guasti",
        description: "Sistema previsione guasti con IA",
    },
    failureAnalysis: {
        name: "Analisi Guasti",
        description: "Diagnosi modalità di guasto meccanico",
    },
    chemistryLab: {
        name: "Laboratorio Chimica",
        description: "Stechiometria e calcolo reazioni",
    },
    biologyGenetics: {
        name: "Biologia & Genetica",
        description: "Risolutore genetica e bioinformatica",
    },
    unitConverter: {
        name: "Convertitore Unità",
        description: "Conversioni standard unità ingegneristiche",
    },
    periodicTable: {
        name: "Tavola Periodica",
        description: "Database chimico interattivo",
    },
    algorithms: {
        name: "Algoritmi",
        description: "Visualizzatore algoritmi informatici",
    },
    digitalLogicLab: {
        name: "Lab. Logica Digitale",
        description: "Simulatore interattivo porte logiche digitali",
    },
    engineeringNotes: {
        name: "Note di Ingegneria",
        description: "Blocco note per calcoli ingegneristici",
    },
    motorSelect: {
        name: "Selezione Motore",
        description: "Motore selezione motori",
    },
    ohmsLaw: {
        name: "Legge di Ohm",
        description: "Calcoli elettrici di base",
    },
    voltageDrop: {
        name: "Caduta di Tensione",
        description: "Dimensionamento cavi e caduta di potenza",
    },
    threePhasePower: {
        name: "Potenza Trifase",
        description: "Postazione potenza trifase",
    },
    filterDesign: {
        name: "Progettazione Filtri",
        description: "Progettazione filtri elettronici e motore Bode",
    },
    scientificCalc: {
        name: "Calc. Scientifica",
        description: "Dashboard postazione scientifica",
    },
};

const PT_MODULES: Record<CalcModuleId, ModuleEntry> = {
    profileWeight: {
        name: "Peso de Perfil",
        description: "Peso de alumínio e base de dados de ligas",
    },
    gearDesign: {
        name: "Projeto de Engrenagens",
        description: "Engrenagens, rolamentos e projeto de transmissão",
    },
    planetaryGear: {
        name: "Engrenagem Planetária",
        description: "Solucionador de equação de Willis multiestágio",
    },
    iso281Bearings: {
        name: "Rolamentos ISO 281",
        description: "Cálculo e seleção de vida útil de rolamentos",
    },
    fastenerEngineering: {
        name: "Elementos de Fixação",
        description: "VDI 2230 torque, pré-carga e análise de montagem de parafusos",
    },
    strengthAnalysis: {
        name: "Análise de Resistência",
        description: "Tensão, deformação, círculo de Mohr e fadiga",
    },
    beamDeflection: {
        name: "Deflexão de Viga",
        description: "Análise estrutural de vigas e apoios",
    },
    concreteReinf: {
        name: "Concreto Armado",
        description: "Suite CA: Vigas e lajes",
    },
    fatigueLife: {
        name: "Vida à Fadiga",
        description: "Diagramas de Goodman e curvas S-N",
    },
    advFatigue: {
        name: "Fadiga Avançada",
        description: "Análise avançada de vida à fadiga",
    },
    fitsTolerances: {
        name: "Ajustes e Tolerâncias",
        description: "Análise de tolerâncias ISO 286",
    },
    reducerLube: {
        name: "Lubrificação Redutor",
        description: "Térmica e lubrificação de redutor",
    },
    gearboxEngine: {
        name: "Motor de Caixa",
        description: "Síntese e desempenho de caixa de engrenagens",
    },
    rollerChainDrive: {
        name: "Corrente de Rolos",
        description: "ISO 606 relação de pinhão, comprimento de corrente e tensão",
    },
    beltDrive: {
        name: "Transmissão por Correia",
        description: "Comprimento de correia plana e em V, ângulo de abraçamento e tensão",
    },
    machiningDetails: {
        name: "Detalhes de Usinagem",
        description: "Imbus, anéis elásticos, chavetas e rebaixos",
    },
    nesting2d: {
        name: "Nesting 2D",
        description: "Nesting DXF e minimização de material",
    },
    cuttingOptimizer: {
        name: "Otimizador de Corte",
        description: "Otimização industrial de trajetórias de ferramenta",
    },
    cadEditor: {
        name: "Editor CAD",
        description: "Ambiente CAD paramétrico",
    },
    weldCalculator: {
        name: "Calculadora de Solda",
        description: "AWS D1.1 resistência de solda e aporte de calor",
    },
    mfgReadiness: {
        name: "Prontidão Mfg.",
        description: "Análise de Manufacturing Readiness Level (MRL)",
    },
    mfgSandbox: {
        name: "Sandbox Mfg.",
        description: "Sandbox de simulação de produção",
    },
    topologyOpt: {
        name: "Otim. Topologia",
        description: "Motor de projeto topológico generativo",
    },
    machineAssembly: {
        name: "Montagem de Máquina",
        description: "Projeto e layout de máquinas 3D",
    },
    simulationFEA: {
        name: "Simulação FEA",
        description: "Área de trabalho de análise por elementos finitos",
    },
    engSelection: {
        name: "Seleção Eng.",
        description: "Lógica de seleção de peças e materiais",
    },
    sketchPad: {
        name: "Bloco de Esboços",
        description: "Esboço técnico e layout",
    },
    sheetMetalBending: {
        name: "Dobra de Chapa",
        description: "Desenvolvimento de dobra, dedução e solucionador de fator K",
    },
    costEstimator: {
        name: "Estimador de Custos",
        description: "Estimador de custo de produção em tempo real",
    },
    pumpSuite: {
        name: "Suite de Bombas",
        description: "Vazão, perda de carga e análise NPSH",
    },
    fluidDynamics: {
        name: "Dinâmica dos Fluidos",
        description: "Número de Reynolds e solucionador de fluxo em tubos",
    },
    aerospaceDynamics: {
        name: "Dinâmica Aeroespacial",
        description: "Envelope de voo e mecânica orbital",
    },
    navalHydro: {
        name: "Hidro. Naval",
        description: "Engenharia naval e hidrostática",
    },
    kinematics: {
        name: "Cinemática",
        description: "Solucionadores de movimento e velocidade de engenharia",
    },
    thermalExpansion: {
        name: "Expansão Térmica",
        description: "Expansão de material e tensão térmica",
    },
    physicsSolver: {
        name: "Solucionador Físico",
        description: "Solucionador CAS de física simbólica",
    },
    materialsDB: {
        name: "Base de Materiais",
        description: "Sistema global de informação de materiais",
    },
    materialsIntelligence: {
        name: "Inteligência de Materiais",
        description: "Explorador de materiais orientado por IA",
    },
    materialSelectorAI: {
        name: "Seletor de Material IA",
        description: "Recomendação IA para ligas",
    },
    failurePrediction: {
        name: "Previsão de Falha",
        description: "Sistema de previsão de falhas com IA",
    },
    failureAnalysis: {
        name: "Análise de Falha",
        description: "Diagnóstico de modos de falha mecânica",
    },
    chemistryLab: {
        name: "Laboratório de Química",
        description: "Estequiometria e cálculo de reações",
    },
    biologyGenetics: {
        name: "Biologia e Genética",
        description: "Solucionador de genética e bioinformática",
    },
    unitConverter: {
        name: "Conversor de Unidades",
        description: "Conversões padrão de unidades de engenharia",
    },
    periodicTable: {
        name: "Tabela Periódica",
        description: "Base de dados química interativa",
    },
    algorithms: {
        name: "Algoritmos",
        description: "Visualizador de algoritmos de informática",
    },
    digitalLogicLab: {
        name: "Lab. Lógica Digital",
        description: "Simulador interativo de portas lógicas digitais",
    },
    engineeringNotes: {
        name: "Notas de Engenharia",
        description: "Bloco de notas para cálculos de engenharia",
    },
    motorSelect: {
        name: "Seleção de Motor",
        description: "Motor de seleção de motores",
    },
    ohmsLaw: {
        name: "Lei de Ohm",
        description: "Cálculos elétricos básicos",
    },
    voltageDrop: {
        name: "Queda de Tensão",
        description: "Dimensionamento de cabos e queda de potência",
    },
    threePhasePower: {
        name: "Potência Trifásica",
        description: "Estação de trabalho de potência trifásica",
    },
    filterDesign: {
        name: "Projeto de Filtros",
        description: "Projeto de filtros eletrônicos e motor Bode",
    },
    scientificCalc: {
        name: "Calc. Científica",
        description: "Painel de estação de trabalho científica",
    },
};

const RU_MODULES: Record<CalcModuleId, ModuleEntry> = {
    profileWeight: {
        name: "Вес Профиля",
        description: "Вес алюминия и база данных сплавов",
    },
    gearDesign: {
        name: "Проектирование Шестерён",
        description: "Шестерни, подшипники и проектирование передач",
    },
    planetaryGear: {
        name: "Планетарная Передача",
        description: "Многоступенчатый решатель уравнения Уиллиса",
    },
    iso281Bearings: {
        name: "Подшипники ISO 281",
        description: "Расчёт и выбор ресурса подшипников",
    },
    fastenerEngineering: {
        name: "Крепёжная Техника",
        description: "VDI 2230 момент, преднатяг и анализ болтового соединения",
    },
    strengthAnalysis: {
        name: "Анализ Прочности",
        description: "Напряжение, деформация, круг Мора и усталость",
    },
    beamDeflection: {
        name: "Прогиб Балки",
        description: "Структурный анализ балок и опор",
    },
    concreteReinf: {
        name: "Железобетон",
        description: "Комплекс ЖБ: Балки и плиты",
    },
    fatigueLife: {
        name: "Усталостный Ресурс",
        description: "Диаграммы Гудмана и кривые S-N",
    },
    advFatigue: {
        name: "Расш. Усталость",
        description: "Расширенный анализ усталостного ресурса",
    },
    fitsTolerances: {
        name: "Посадки и Допуски",
        description: "Анализ допусков ISO 286",
    },
    reducerLube: {
        name: "Смазка Редуктора",
        description: "Тепловой режим и смазка редуктора",
    },
    gearboxEngine: {
        name: "Движок Редуктора",
        description: "Синтез и характеристики коробки передач",
    },
    rollerChainDrive: {
        name: "Роликовая Цепь",
        description: "ISO 606 передаточное число, длина цепи и натяжение",
    },
    beltDrive: {
        name: "Ременная Передача",
        description: "Длина плоского и клинового ремня, угол обхвата и натяжение",
    },
    machiningDetails: {
        name: "Детали Обработки",
        description: "Имбус, стопорные кольца, шпонки и подрезы",
    },
    nesting2d: {
        name: "2D-Раскрой",
        description: "DXF-раскрой и минимизация отходов",
    },
    cuttingOptimizer: {
        name: "Оптимизатор Резки",
        description: "Промышленная оптимизация траекторий инструмента",
    },
    cadEditor: {
        name: "CAD-Редактор",
        description: "Параметрическая CAD-среда",
    },
    weldCalculator: {
        name: "Сварочный Калькулятор",
        description: "AWS D1.1 прочность шва и тепловложение",
    },
    mfgReadiness: {
        name: "Готовность Произв.",
        description: "Анализ Manufacturing Readiness Level (MRL)",
    },
    mfgSandbox: {
        name: "Песочница Произв.",
        description: "Песочница моделирования производства",
    },
    topologyOpt: {
        name: "Топол. Оптим.",
        description: "Генеративный движок топологической оптимизации",
    },
    machineAssembly: {
        name: "Сборка Машины",
        description: "3D-проектирование и компоновка машин",
    },
    simulationFEA: {
        name: "FEA-Симуляция",
        description: "Рабочая область метода конечных элементов",
    },
    engSelection: {
        name: "Инж. Выбор",
        description: "Логика выбора деталей и материалов",
    },
    sketchPad: {
        name: "Блокнот Эскизов",
        description: "Техническое эскизирование и компоновка",
    },
    sheetMetalBending: {
        name: "Гибка Листового Металла",
        description: "Развёртка гибки, вычет и решатель K-фактора",
    },
    costEstimator: {
        name: "Оценщик Стоимости",
        description: "Оценка производственной стоимости в реальном времени",
    },
    pumpSuite: {
        name: "Комплекс Насосов",
        description: "Расход, потери напора и анализ NPSH",
    },
    fluidDynamics: {
        name: "Гидродинамика",
        description: "Число Рейнольдса и решатель трубопроводного потока",
    },
    aerospaceDynamics: {
        name: "Аэрокосмическая Динамика",
        description: "Лётный диапазон и орбитальная механика",
    },
    navalHydro: {
        name: "Судовая Гидро.",
        description: "Судостроение и гидростатика",
    },
    kinematics: {
        name: "Кинематика",
        description: "Инженерные решатели движения и скорости",
    },
    thermalExpansion: {
        name: "Тепловое Расширение",
        description: "Расширение материала и термонапряжение",
    },
    physicsSolver: {
        name: "Физический Решатель",
        description: "Символьный CAS-решатель физики",
    },
    materialsDB: {
        name: "База Материалов",
        description: "Глобальная информационная система материалов",
    },
    materialsIntelligence: {
        name: "Интеллект Материалов",
        description: "ИИ-исследователь материалов",
    },
    materialSelectorAI: {
        name: "ИИ Выбора Материала",
        description: "ИИ-рекомендации по сплавам",
    },
    failurePrediction: {
        name: "Прогноз Отказов",
        description: "ИИ-система прогнозирования отказов",
    },
    failureAnalysis: {
        name: "Анализ Отказов",
        description: "Диагностика механических режимов отказа",
    },
    chemistryLab: {
        name: "Химическая Лаборатория",
        description: "Стехиометрия и расчёт реакций",
    },
    biologyGenetics: {
        name: "Биология и Генетика",
        description: "Решатель генетики и биоинформатики",
    },
    unitConverter: {
        name: "Конвертер Единиц",
        description: "Стандартные инженерные преобразования единиц",
    },
    periodicTable: {
        name: "Периодическая Таблица",
        description: "Интерактивная химическая база данных",
    },
    algorithms: {
        name: "Алгоритмы",
        description: "Визуализатор алгоритмов информатики",
    },
    digitalLogicLab: {
        name: "Лаб. Цифровой Логики",
        description: "Интерактивный симулятор цифровых логических вентилей",
    },
    engineeringNotes: {
        name: "Инженерные Заметки",
        description: "Блокнот для инженерных расчётов",
    },
    motorSelect: {
        name: "Выбор Двигателя",
        description: "Движок выбора двигателей",
    },
    ohmsLaw: {
        name: "Закон Ома",
        description: "Базовые электрические расчёты",
    },
    voltageDrop: {
        name: "Падение Напряжения",
        description: "Подбор сечения кабеля и потери мощности",
    },
    threePhasePower: {
        name: "Трёхфазная Мощность",
        description: "Рабочая станция трёхфазной мощности",
    },
    filterDesign: {
        name: "Проектирование Фильтров",
        description: "Проектирование электронных фильтров и движок Боде",
    },
    scientificCalc: {
        name: "Научный Калькулятор",
        description: "Панель научной рабочей станции",
    },
};

const JA_MODULES: Record<CalcModuleId, ModuleEntry> = {
    profileWeight: {
        name: "プロファイル重量",
        description: "アルミ重量と合金データベース",
    },
    gearDesign: {
        name: "歯車設計",
        description: "歯車、ベアリング、伝動設計",
    },
    planetaryGear: {
        name: "遊星歯車",
        description: "多段ウィリス方程式ソルバー",
    },
    iso281Bearings: {
        name: "ISO 281 ベアリング",
        description: "ベアリング寿命計算と選定",
    },
    fastenerEngineering: {
        name: "締結部品工学",
        description: "VDI 2230 トルク、予荷重、ボルト締結解析",
    },
    strengthAnalysis: {
        name: "強度解析",
        description: "応力、ひずみ、モール円、疲労",
    },
    beamDeflection: {
        name: "はりたわみ",
        description: "構造はり解析と支持条件",
    },
    concreteReinf: {
        name: "鉄筋コンクリート",
        description: "RCスイート：はりとスラブ",
    },
    fatigueLife: {
        name: "疲労寿命",
        description: "グッドマン線図とS-N曲線",
    },
    advFatigue: {
        name: "高度疲労解析",
        description: "高度疲労寿命解析",
    },
    fitsTolerances: {
        name: "はめあいと公差",
        description: "ISO 286 公差解析",
    },
    reducerLube: {
        name: "減速機潤滑",
        description: "減速機の熱と潤滑",
    },
    gearboxEngine: {
        name: "ギアボックスエンジン",
        description: "ギアボックス合成と性能",
    },
    rollerChainDrive: {
        name: "ローラーチェーン駆動",
        description: "ISO 606 スプロケット比、チェーン長、張力",
    },
    beltDrive: {
        name: "ベルト駆動",
        description: "平ベルト・Vベルト長、巻き付け角、張力",
    },
    machiningDetails: {
        name: "加工詳細",
        description: "インバス、止め輪、キー、下穴",
    },
    nesting2d: {
        name: "2Dネスティング",
        description: "DXFネスティングと材料最小化",
    },
    cuttingOptimizer: {
        name: "切削最適化",
        description: "産業用ツールパス最適化",
    },
    cadEditor: {
        name: "CADエディタ",
        description: "パラメトリックCAD環境",
    },
    weldCalculator: {
        name: "溶接計算機",
        description: "AWS D1.1 溶接強度と熱入力",
    },
    mfgReadiness: {
        name: "製造準備度",
        description: "Manufacturing Readiness Level (MRL) 解析",
    },
    mfgSandbox: {
        name: "製造サンドボックス",
        description: "生産シミュレーションサンドボックス",
    },
    topologyOpt: {
        name: "トポロジー最適化",
        description: "ジェネレーティブトポロジー設計エンジン",
    },
    machineAssembly: {
        name: "機械アセンブリ",
        description: "3D機械設計とレイアウト",
    },
    simulationFEA: {
        name: "FEAシミュレーション",
        description: "有限要素解析ワークスペース",
    },
    engSelection: {
        name: "設計選定",
        description: "部品と材料選定ロジック",
    },
    sketchPad: {
        name: "スケッチパッド",
        description: "技術スケッチとレイアウト",
    },
    sheetMetalBending: {
        name: "板金曲げ",
        description: "曲げ展開、控除、K係数ソルバー",
    },
    costEstimator: {
        name: "コスト見積",
        description: "リアルタイム生産コスト見積",
    },
    pumpSuite: {
        name: "ポンプスイート",
        description: "流量、圧力損失、NPSH解析",
    },
    fluidDynamics: {
        name: "流体力学",
        description: "レイノルズ数と配管流れソルバー",
    },
    aerospaceDynamics: {
        name: "航空宇宙力学",
        description: "飛行包絡線と軌道力学",
    },
    navalHydro: {
        name: "船舶静水",
        description: "船舶工学と静水力学",
    },
    kinematics: {
        name: "運動学",
        description: "工学運動・速度ソルバー",
    },
    thermalExpansion: {
        name: "熱膨張",
        description: "材料膨張と熱応力",
    },
    physicsSolver: {
        name: "物理ソルバー",
        description: "記号物理CASソルバー",
    },
    materialsDB: {
        name: "材料データベース",
        description: "グローバル材料情報システム",
    },
    materialsIntelligence: {
        name: "材料インテリジェンス",
        description: "AI駆動材料エクスプローラー",
    },
    materialSelectorAI: {
        name: "材料選定AI",
        description: "合金推奨AI",
    },
    failurePrediction: {
        name: "故障予測",
        description: "AI故障予測システム",
    },
    failureAnalysis: {
        name: "故障解析",
        description: "機械的故障モード診断",
    },
    chemistryLab: {
        name: "化学ラボ",
        description: "化学量論と反応計算",
    },
    biologyGenetics: {
        name: "生物学・遺伝学",
        description: "遺伝学・バイオインフォマティクスソルバー",
    },
    unitConverter: {
        name: "単位変換",
        description: "標準工学単位変換",
    },
    periodicTable: {
        name: "周期表",
        description: "インタラクティブ化学データベース",
    },
    algorithms: {
        name: "アルゴリズム",
        description: "CSアルゴリズムビジュアライザー",
    },
    digitalLogicLab: {
        name: "デジタル論理ラボ",
        description: "インタラクティブデジタル論理ゲートシミュレーター",
    },
    engineeringNotes: {
        name: "工学ノート",
        description: "工学計算用スクラッチパッド",
    },
    motorSelect: {
        name: "モーター選定",
        description: "モーター選定エンジン",
    },
    ohmsLaw: {
        name: "オームの法則",
        description: "基本電気計算",
    },
    voltageDrop: {
        name: "電圧降下",
        description: "配線サイズと電力損失",
    },
    threePhasePower: {
        name: "三相電力",
        description: "三相電力ワークステーション",
    },
    filterDesign: {
        name: "フィルタ設計",
        description: "電子フィルタ設計とボードエンジン",
    },
    scientificCalc: {
        name: "関数電卓",
        description: "科学ワークステーションダッシュボード",
    },
};

const ZH_MODULES: Record<CalcModuleId, ModuleEntry> = {
    profileWeight: {
        name: "型材重量",
        description: "铝材重量与合金数据库",
    },
    gearDesign: {
        name: "齿轮设计",
        description: "齿轮、轴承与传动设计",
    },
    planetaryGear: {
        name: "行星齿轮",
        description: "多级威利斯方程求解器",
    },
    iso281Bearings: {
        name: "ISO 281 轴承",
        description: "轴承寿命计算与选型",
    },
    fastenerEngineering: {
        name: "紧固件工程",
        description: "VDI 2230 扭矩、预紧力与螺栓装配分析",
    },
    strengthAnalysis: {
        name: "强度分析",
        description: "应力、应变、莫尔圆与疲劳",
    },
    beamDeflection: {
        name: "梁挠度",
        description: "结构梁分析与支座",
    },
    concreteReinf: {
        name: "钢筋混凝土",
        description: "RC套件：梁与板",
    },
    fatigueLife: {
        name: "疲劳寿命",
        description: "古德曼图与S-N曲线",
    },
    advFatigue: {
        name: "高级疲劳",
        description: "高级疲劳寿命分析",
    },
    fitsTolerances: {
        name: "配合与公差",
        description: "ISO 286 公差分析",
    },
    reducerLube: {
        name: "减速器润滑",
        description: "减速器热学与润滑",
    },
    gearboxEngine: {
        name: "变速箱引擎",
        description: "变速箱综合与性能",
    },
    rollerChainDrive: {
        name: "滚子链传动",
        description: "ISO 606 链轮比、链长与张力",
    },
    beltDrive: {
        name: "皮带传动",
        description: "平带与V带长度、包角与张力",
    },
    machiningDetails: {
        name: "加工细节",
        description: "内六角、挡圈、键槽与退刀槽",
    },
    nesting2d: {
        name: "二维排料",
        description: "DXF排料与材料最小化",
    },
    cuttingOptimizer: {
        name: "切削优化器",
        description: "工业刀具路径优化",
    },
    cadEditor: {
        name: "CAD编辑器",
        description: "参数化CAD环境",
    },
    weldCalculator: {
        name: "焊接计算器",
        description: "AWS D1.1 焊缝强度与热输入",
    },
    mfgReadiness: {
        name: "制造就绪度",
        description: "制造就绪等级(MRL)分析",
    },
    mfgSandbox: {
        name: "制造沙盒",
        description: "生产仿真沙盒",
    },
    topologyOpt: {
        name: "拓扑优化",
        description: "生成式拓扑设计引擎",
    },
    machineAssembly: {
        name: "机器装配",
        description: "三维机械设计与布局",
    },
    simulationFEA: {
        name: "FEA仿真",
        description: "有限元分析工作区",
    },
    engSelection: {
        name: "工程选型",
        description: "零件与材料选型逻辑",
    },
    sketchPad: {
        name: "草图板",
        description: "技术草图与布局",
    },
    sheetMetalBending: {
        name: "钣金折弯",
        description: "折弯展开、扣除与K因子求解器",
    },
    costEstimator: {
        name: "成本估算",
        description: "实时生产成本估算",
    },
    pumpSuite: {
        name: "泵组套件",
        description: "流量、扬程损失与NPSH分析",
    },
    fluidDynamics: {
        name: "流体动力学",
        description: "雷诺数与管道流动求解器",
    },
    aerospaceDynamics: {
        name: "航空航天动力学",
        description: "飞行包线与轨道力学",
    },
    navalHydro: {
        name: "船舶水力学",
        description: "船舶工程与静水力学",
    },
    kinematics: {
        name: "运动学",
        description: "工程运动与速度求解器",
    },
    thermalExpansion: {
        name: "热膨胀",
        description: "材料膨胀与热应力",
    },
    physicsSolver: {
        name: "物理求解器",
        description: "符号物理CAS求解器",
    },
    materialsDB: {
        name: "材料数据库",
        description: "全球材料信息系统",
    },
    materialsIntelligence: {
        name: "材料智能",
        description: "AI驱动材料探索器",
    },
    materialSelectorAI: {
        name: "材料选型AI",
        description: "合金推荐AI",
    },
    failurePrediction: {
        name: "故障预测",
        description: "AI故障预测系统",
    },
    failureAnalysis: {
        name: "故障分析",
        description: "机械失效模式诊断",
    },
    chemistryLab: {
        name: "化学实验室",
        description: "化学计量与反应计算",
    },
    biologyGenetics: {
        name: "生物遗传学",
        description: "遗传学与生物信息学求解器",
    },
    unitConverter: {
        name: "单位换算",
        description: "标准工程单位换算",
    },
    periodicTable: {
        name: "元素周期表",
        description: "交互式化学数据库",
    },
    algorithms: {
        name: "算法",
        description: "计算机科学算法可视化",
    },
    digitalLogicLab: {
        name: "数字逻辑实验室",
        description: "交互式数字逻辑门仿真器",
    },
    engineeringNotes: {
        name: "工程笔记",
        description: "工程计算草稿本",
    },
    motorSelect: {
        name: "电机选型",
        description: "电机选型引擎",
    },
    ohmsLaw: {
        name: "欧姆定律",
        description: "基础电气计算",
    },
    voltageDrop: {
        name: "电压降",
        description: "线缆选型与功率损耗",
    },
    threePhasePower: {
        name: "三相功率",
        description: "三相功率工作站",
    },
    filterDesign: {
        name: "滤波器设计",
        description: "电子滤波器设计与波特引擎",
    },
    scientificCalc: {
        name: "科学计算器",
        description: "科学工作站仪表板",
    },
};

const KO_MODULES: Record<CalcModuleId, ModuleEntry> = {
    profileWeight: {
        name: "프로필 중량",
        description: "알루미늄 중량 및 합금 데이터베이스",
    },
    gearDesign: {
        name: "기어 설계",
        description: "기어, 베어링 및 동력전달 설계",
    },
    planetaryGear: {
        name: "유성 기어",
        description: "다단 윌리스 방정식 솔버",
    },
    iso281Bearings: {
        name: "ISO 281 베어링",
        description: "베어링 수명 계산 및 선정",
    },
    fastenerEngineering: {
        name: "체결 부품 공학",
        description: "VDI 2230 토크, 예압 및 볼트 체결 분석",
    },
    strengthAnalysis: {
        name: "강도 해석",
        description: "응력, 변형률, 모어 원 및 피로",
    },
    beamDeflection: {
        name: "보 처짐",
        description: "구조 보 해석 및 지지 조건",
    },
    concreteReinf: {
        name: "철근 콘크리트",
        description: "RC 스위트: 보 및 슬래브",
    },
    fatigueLife: {
        name: "피로 수명",
        description: "굿맨 선도 및 S-N 곡선",
    },
    advFatigue: {
        name: "고급 피로",
        description: "고급 피로 수명 해석",
    },
    fitsTolerances: {
        name: "끼움 및 공차",
        description: "ISO 286 공차 해석",
    },
    reducerLube: {
        name: "감속기 윤활",
        description: "감속기 열 및 윤활",
    },
    gearboxEngine: {
        name: "기어박스 엔진",
        description: "기어박스 합성 및 성능",
    },
    rollerChainDrive: {
        name: "롤러 체인 구동",
        description: "ISO 606 스프로킷 비, 체인 길이 및 장력",
    },
    beltDrive: {
        name: "벨트 구동",
        description: "평벨트 및 V벨트 길이, 감김각 및 장력",
    },
    machiningDetails: {
        name: "가공 세부사항",
        description: "임버스, 스냅링, 키 및 언더컷",
    },
    nesting2d: {
        name: "2D 네스팅",
        description: "DXF 네스팅 및 재료 최소화",
    },
    cuttingOptimizer: {
        name: "절삭 최적화",
        description: "산업용 공구 경로 최적화",
    },
    cadEditor: {
        name: "CAD 편집기",
        description: "파라메트릭 CAD 환경",
    },
    weldCalculator: {
        name: "용접 계산기",
        description: "AWS D1.1 용접 강도 및 열입력",
    },
    mfgReadiness: {
        name: "제조 준비도",
        description: "Manufacturing Readiness Level (MRL) 분석",
    },
    mfgSandbox: {
        name: "제조 샌드박스",
        description: "생산 시뮬레이션 샌드박스",
    },
    topologyOpt: {
        name: "토폴로지 최적화",
        description: "생성형 토폴로지 설계 엔진",
    },
    machineAssembly: {
        name: "기계 조립",
        description: "3D 기계 설계 및 배치",
    },
    simulationFEA: {
        name: "FEA 시뮬레이션",
        description: "유한요소 해석 작업 공간",
    },
    engSelection: {
        name: "설계 선정",
        description: "부품 및 재료 선정 로직",
    },
    sketchPad: {
        name: "스케치 패드",
        description: "기술 스케치 및 레이아웃",
    },
    sheetMetalBending: {
        name: "판금 절곡",
        description: "절곡 전개, 공제 및 K계수 솔버",
    },
    costEstimator: {
        name: "비용 추정",
        description: "실시간 생산 비용 추정",
    },
    pumpSuite: {
        name: "펌프 스위트",
        description: "유량, 압력 손실 및 NPSH 분석",
    },
    fluidDynamics: {
        name: "유체 역학",
        description: "레이놀즈 수 및 배관 유동 솔버",
    },
    aerospaceDynamics: {
        name: "항공우주 역학",
        description: "비행 포락선 및 궤도 역학",
    },
    navalHydro: {
        name: "선박 정수",
        description: "조선 공학 및 정수역학",
    },
    kinematics: {
        name: "운동학",
        description: "공학 운동 및 속도 솔버",
    },
    thermalExpansion: {
        name: "열팽창",
        description: "재료 팽창 및 열응력",
    },
    physicsSolver: {
        name: "물리 솔버",
        description: "기호 물리 CAS 솔버",
    },
    materialsDB: {
        name: "재료 데이터베이스",
        description: "글로벌 재료 정보 시스템",
    },
    materialsIntelligence: {
        name: "재료 인텔리전스",
        description: "AI 기반 재료 탐색기",
    },
    materialSelectorAI: {
        name: "재료 선정 AI",
        description: "합금 추천 AI",
    },
    failurePrediction: {
        name: "고장 예측",
        description: "AI 고장 예측 시스템",
    },
    failureAnalysis: {
        name: "고장 분석",
        description: "기계적 고장 모드 진단",
    },
    chemistryLab: {
        name: "화학 실험실",
        description: "화학량론 및 반응 계산",
    },
    biologyGenetics: {
        name: "생물학 및 유전학",
        description: "유전학 및 생물정보학 솔버",
    },
    unitConverter: {
        name: "단위 변환기",
        description: "표준 공학 단위 변환",
    },
    periodicTable: {
        name: "주기율표",
        description: "대화형 화학 데이터베이스",
    },
    algorithms: {
        name: "알고리즘",
        description: "컴퓨터 과학 알고리즘 시각화",
    },
    digitalLogicLab: {
        name: "디지털 논리 랩",
        description: "대화형 디지털 논리 게이트 시뮬레이터",
    },
    engineeringNotes: {
        name: "공학 노트",
        description: "공학 계산용 메모장",
    },
    motorSelect: {
        name: "모터 선정",
        description: "모터 선정 엔진",
    },
    ohmsLaw: {
        name: "옴의 법칙",
        description: "기본 전기 계산",
    },
    voltageDrop: {
        name: "전압 강하",
        description: "배선 선정 및 전력 손실",
    },
    threePhasePower: {
        name: "3상 전력",
        description: "3상 전력 워크스테이션",
    },
    filterDesign: {
        name: "필터 설계",
        description: "전자 필터 설계 및 보드 엔진",
    },
    scientificCalc: {
        name: "공학용 계산기",
        description: "과학 워크스테이션 대시보드",
    },
};

const AR_MODULES: Record<CalcModuleId, ModuleEntry> = {
    profileWeight: {
        name: "وزن المقطع",
        description: "وزن الألومنيوم وقاعدة بيانات السبائك",
    },
    gearDesign: {
        name: "تصميم التروس",
        description: "التروس والمحامل وتصميم نقل الحركة",
    },
    planetaryGear: {
        name: "ترس كوكبي",
        description: "حلّال معادلة ويليس متعدد المراحل",
    },
    iso281Bearings: {
        name: "محامل ISO 281",
        description: "حساب واختيار عمر المحامل",
    },
    fastenerEngineering: {
        name: "هندسة المثبتات",
        description: "VDI 2230 عزم الدوران والإجهاد المسبق وتحليل تجميع البراغي",
    },
    strengthAnalysis: {
        name: "تحليل القوة",
        description: "الإجهاد والانفعال ودائرة موهر والإجهاد",
    },
    beamDeflection: {
        name: "انحراف العارضة",
        description: "تحليل العوارض الإنشائية والدعامات",
    },
    concreteReinf: {
        name: "الخرسانة المسلحة",
        description: "حزمة RC: العوارض والبلاطات",
    },
    fatigueLife: {
        name: "عمر الإجهاد",
        description: "مخططات جودمان ومنحنيات S-N",
    },
    advFatigue: {
        name: "إجهاد متقدم",
        description: "تحليل متقدم لعمر الإجهاد",
    },
    fitsTolerances: {
        name: "المطابقات والتسامحات",
        description: "تحليل التسامحات ISO 286",
    },
    reducerLube: {
        name: "تزييت المخفض",
        description: "الحرارة والتزييت في علبة التروس",
    },
    gearboxEngine: {
        name: "محرك علبة التروس",
        description: "توليف وأداء علبة التروس",
    },
    rollerChainDrive: {
        name: "سلسلة دوارة",
        description: "ISO 606 نسبة الطارة وطول السلسلة والشد",
    },
    beltDrive: {
        name: "نقل بالأحزمة",
        description: "طول الحزام المسطح والV وزاوية الالتفاف والشد",
    },
    machiningDetails: {
        name: "تفاصيل التشغيل",
        description: "إمبوس وحلقات تثبيت ومفاتيح وخدوش",
    },
    nesting2d: {
        name: "تداخل ثنائي الأبعاد",
        description: "تداخل DXF وتقليل الهدر",
    },
    cuttingOptimizer: {
        name: "محسّن القطع",
        description: "تحسين مسار الأداة الصناعي",
    },
    cadEditor: {
        name: "محرر CAD",
        description: "بيئة CAD بارامترية",
    },
    weldCalculator: {
        name: "حاسبة اللحام",
        description: "AWS D1.1 قوة اللحام ومدخلات الحرارة",
    },
    mfgReadiness: {
        name: "جاهزية التصنيع",
        description: "تحليل مستوى جاهزية التصنيع (MRL)",
    },
    mfgSandbox: {
        name: "صندوق رمل التصنيع",
        description: "صندوق رمل محاكاة الإنتاج",
    },
    topologyOpt: {
        name: "تحسين الطوبولوجيا",
        description: "محرك تصميم طوبولوجي توليدي",
    },
    machineAssembly: {
        name: "تجميع الآلة",
        description: "تصميم وترتيب الآلات ثلاثي الأبعاد",
    },
    simulationFEA: {
        name: "محاكاة FEA",
        description: "مساحة عمل تحليل العناصر المحدودة",
    },
    engSelection: {
        name: "اختيار هندسي",
        description: "منطق اختيار الأجزاء والمواد",
    },
    sketchPad: {
        name: "لوحة الرسم",
        description: "الرسم الفني والتخطيط",
    },
    sheetMetalBending: {
        name: "ثني الصفائح",
        description: "بدل الثني والخصم وحلّال معامل K",
    },
    costEstimator: {
        name: "مقدّر التكلفة",
        description: "تقدير تكلفة الإنتاج في الوقت الفعلي",
    },
    pumpSuite: {
        name: "حزمة المضخات",
        description: "معدل التدفق وفقد الضغط وتحليل NPSH",
    },
    fluidDynamics: {
        name: "ديناميكا الموائع",
        description: "رقم رينولدز وحلّال تدفق الأنابيب",
    },
    aerospaceDynamics: {
        name: "ديناميكا الفضاء",
        description: "مغلف الطيران وميكانيكا المدار",
    },
    navalHydro: {
        name: "هيدرو. بحرية",
        description: "الهندسة البحرية والإستاتيكا المائية",
    },
    kinematics: {
        name: "الحركيات",
        description: "حلّالات الحركة والسرعة الهندسية",
    },
    thermalExpansion: {
        name: "التمدد الحراري",
        description: "تمدد المادة والإجهاد الحراري",
    },
    physicsSolver: {
        name: "حلّال الفيزياء",
        description: "حلّال CAS فيزيائي رمزي",
    },
    materialsDB: {
        name: "قاعدة المواد",
        description: "نظام معلومات المواد العالمي",
    },
    materialsIntelligence: {
        name: "ذكاء المواد",
        description: "مستكشف مواد مدعوم بالذكاء الاصطناعي",
    },
    materialSelectorAI: {
        name: "محدد المواد AI",
        description: "توصيات الذكاء الاصطناعي للسبائك",
    },
    failurePrediction: {
        name: "تنبؤ الأعطال",
        description: "نظام تنبؤ الأعطال بالذكاء الاصطناعي",
    },
    failureAnalysis: {
        name: "تحليل الأعطال",
        description: "تشخيص أنماط الأعطال الميكانيكية",
    },
    chemistryLab: {
        name: "مختبر الكيمياء",
        description: "القياس الكيميائي وحساب التفاعلات",
    },
    biologyGenetics: {
        name: "البيولوجيا والوراثة",
        description: "حلّال الوراثة والمعلوماتية الحيوية",
    },
    unitConverter: {
        name: "محوّل الوحدات",
        description: "تحويلات وحدات هندسية قياسية",
    },
    periodicTable: {
        name: "الجدول الدوري",
        description: "قاعدة بيانات كيميائية تفاعلية",
    },
    algorithms: {
        name: "الخوارزميات",
        description: "مصوّر خوارزميات علوم الحاسوب",
    },
    digitalLogicLab: {
        name: "مختبر المنطق الرقمي",
        description: "محاكي تفاعلي لبوابات المنطق الرقمي",
    },
    engineeringNotes: {
        name: "ملاحظات هندسية",
        description: "مفكرة لحسابات الهندسة",
    },
    motorSelect: {
        name: "اختيار المحرك",
        description: "محرك اختيار المحركات",
    },
    ohmsLaw: {
        name: "قانون أوم",
        description: "حسابات كهربائية أساسية",
    },
    voltageDrop: {
        name: "انخفاض الجهد",
        description: "تحديد حجم الأسلاك وفقد القدرة",
    },
    threePhasePower: {
        name: "قدرة ثلاثية الأطوار",
        description: "محطة عمل القدرة ثلاثية الأطوار",
    },
    filterDesign: {
        name: "تصميم المرشحات",
        description: "تصميم المرشحات الإلكترونية ومحرك بود",
    },
    scientificCalc: {
        name: "حاسبة علمية",
        description: "لوحة محطة العمل العلمية",
    },
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
  const modules = locale === 'tr' ? TR_MODULES : locale === 'en' ? EN_MODULES : locale === 'de' ? DE_MODULES : locale === 'es' ? ES_MODULES : locale === 'fr' ? FR_MODULES : locale === 'it' ? IT_MODULES : locale === 'pt' ? PT_MODULES : locale === 'ru' ? RU_MODULES : locale === 'ja' ? JA_MODULES : locale === 'zh' ? ZH_MODULES : locale === 'ko' ? KO_MODULES : locale === 'ar' ? AR_MODULES : EN_MODULES;
  CALCULATORS_PAGE[locale] = { ...page, modules };
}

export function getCalculatorsPage(locale: string): PageLocale {
  return CALCULATORS_PAGE[locale] || CALCULATORS_PAGE.en;
}
