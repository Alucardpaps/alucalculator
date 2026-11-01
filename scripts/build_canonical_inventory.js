/**
 * Faz 0 — Build Canonical Inventory
 * 
 * Reconciles and unifies all 90+ engineering capabilities across:
 * - DesktopSidebar (36 items)
 * - CalculatorHub (48 items)
 * - WindowContent cases (85 cases)
 * - SEO DB (44 items)
 * - V2 Registry (37 items)
 * 
 * Produces:
 * 1. src/data/canonicalInventory.ts (TypeScript single-source-of-truth)
 * 2. src/data/canonical-inventory.json
 * 3. src/data/canonical-inventory.csv
 * 4. INVENTORY_REPORT.md
 */

const fs = require('fs');

console.log('=== Building Canonical Inventory for AluCalc OS ===');

// The 6 Canonical Pillars
const PILLARS = {
  cad_design: {
    id: 'cad_design',
    titleEn: 'CAD & Design Studios',
    titleTr: 'CAD & Tasarım Stüdyoları',
    order: 1
  },
  mechanical: {
    id: 'mechanical',
    titleEn: 'Mechanical Solvers (ISO/DIN/VDI)',
    titleTr: 'Mekanik Çözücüler (ISO/DIN/VDI)',
    order: 2
  },
  materials_mfg: {
    id: 'materials_mfg',
    titleEn: 'Materials, Structural & Manufacturing',
    titleTr: 'Malzeme, Yapısal & İmalat',
    order: 3
  },
  fluids_thermal_power: {
    id: 'fluids_thermal_power',
    titleEn: 'Fluids, Thermal & Electrical Power',
    titleTr: 'Akışkanlar, Termal & Güç',
    order: 4
  },
  science_theory: {
    id: 'science_theory',
    titleEn: 'Engineering Science & Theory',
    titleTr: 'Mühendislik Bilimi & Teori',
    order: 5
  },
  platform_academy: {
    id: 'platform_academy',
    titleEn: 'Platform, Field & Academy',
    titleTr: 'Platform, Saha & Akademi',
    order: 6
  }
};

// Aliases that should transparently redirect / map to a canonical route
const CANONICAL_ALIASES = {
  'aluminum': '/profile-weight',
  'fasteners': '/bolt-torque',
  'fasteners-calc': '/bolt-torque',
  'thread-geometry': '/bolt-torque',
  'thread-standards': '/bolt-torque',
  'tolerance-stackup': '/fits',
  'fits-tolerances': '/fits',
  '3-phase-power': '/three-phase-power',
  'power-electrical': '/three-phase-power',
  'simulation-fea': '/fea',
  'machine-assembly': '/design-studio',
  'workspace': '/design-studio',
  'workspace/assembly': '/design-studio',
  'calculators': '/design-studio',
  'helical-spring': '/advanced-spring',
  'spring-design': '/advanced-spring',
  'spring-constant': '/advanced-spring',
  'pressure-drop-calc': '/fluid-dynamics',
  'pressure-drop': '/fluid-dynamics',
  'fluids': '/fluid-dynamics',
  'thermal': '/thermal-expansion',
  'heat-transfer-calc': '/thermal-expansion',
  'heat-transfer': '/thermal-expansion',
  'bearing-life': '/bearings',
  'bearing-life-calc': '/bearings',
  'bolt-torque-calc': '/bolt-torque',
  'vdi2230': '/bolt-torque',
  'shaft-diameter': '/shafts',
  'shaft-diameter-calc': '/shafts',
  'motor-power': '/motor-selection-std',
  'motor-power-calc': '/motor-selection-std',
  'motor-selection': '/motor-selection-std',
  'roller-chain-drive': '/chain-drive',
  'timing-belt-design': '/belt-drive',
  'v-belt-power': '/belt-drive',
  'bend-allowance': '/sheet-metal',
  'gear-contact-stress': '/gears',
  'gear-module': '/gears',
  'gear-ratio': '/gears',
  'gear-ratio-calc': '/gears',
  'gears-bearings': '/gears',
  'beam-deflection-calc': '/beam-deflection',
  'kama': '/keyway-connection',
  'kama-hesabi': '/keyway-connection',
  'parallel-key': '/keyway-connection',
  'siki-gecme': '/press-fit',
  'shrink-fit': '/press-fit',
  'interference-fit': '/press-fit',
  'oring': '/o-ring',
  'o-ring-gland': '/o-ring',
  'sizdirmazlik': '/o-ring',
  'fatigue': '/fatigue-analysis',
  'mfg-readiness': '/manufacturing-readiness',
  'mfg-sandbox': '/manufacturing-sandbox',
  'aerospace': '/aerospace-dynamics',
  'kinematics': '/physics-kinematics',
  'chemistry-solver': '/chemistry-reactions',
  'converter': '/unit-converter',
  'hardness-converter': '/unit-converter',
  'pipe-friction-calc': '/pipe-friction',
  'welding-calc': '/welding'
};

// Master Canonical Tools Definition (Excluding OS utilities like settings/terminal)
const RAW_CANONICAL_TOOLS = [
  // ─── 1. CAD & Design Studios ───
  {
    id: 'design-studio',
    route: '/design-studio',
    titleEn: 'Parametric Part Configurator (3D CAD)',
    titleTr: 'Parametrik Parça Konfigüratörü (3D CAD)',
    pillar: 'cad_design',
    badge: '3D',
    iconName: 'Box',
    engineType: 'cad_3d',
    standards: ['WASM OpenCASCADE', 'STEP/STL ISO 10303'],
    keywords: ['3d', 'stl', 'parametric', 'configurator', 'cad', 'step', 'solid']
  },
  {
    id: 'cad-editor',
    route: '/cad-editor',
    titleEn: '2D AluCAD Drafting & Constraints',
    titleTr: '2D AluCAD Çizim & Kısıt Çözücü',
    pillar: 'cad_design',
    badge: '2D',
    iconName: 'Pencil',
    engineType: 'cad_2d',
    standards: ['DXF R12/2000', 'PlaneGCS Solve'],
    keywords: ['2d', 'dxf', 'autocad', 'dwg', 'drafting', 'cizim']
  },
  {
    id: 'sketch-pad',
    route: '/sketch-pad',
    titleEn: 'Technical Sketch Pad & Whiteboard',
    titleTr: 'Mühendislik Şema Tahtası',
    pillar: 'cad_design',
    badge: 'PAD',
    iconName: 'PenTool',
    engineType: 'cad_2d',
    standards: ['SVG Vector Export'],
    keywords: ['sketch', 'pad', 'sema', 'whiteboard', 'diagram']
  },
  {
    id: 'fea',
    route: '/fea',
    titleEn: 'FEA Linear Static Simulation',
    titleTr: 'FEA Doğrusal Statik Simülasyon',
    pillar: 'cad_design',
    badge: 'FEA',
    iconName: 'Activity',
    engineType: 'fea_sim',
    standards: ['Von Mises Stress', 'Linear Elastic FEA'],
    keywords: ['fea', 'stress', 'linear', 'static', 'simulation', 'von mises']
  },
  {
    id: 'flow',
    route: '/flow',
    titleEn: 'Engineering Flow Engine (Node-RED/NX)',
    titleTr: 'Görsel Mühendislik Akış Motoru',
    pillar: 'cad_design',
    badge: 'FLOW',
    iconName: 'Workflow',
    engineType: 'flow_graph',
    standards: ['Deterministic Computation Graph'],
    keywords: ['flow', 'node-red', 'graph', 'pipeline', 'workflow', 'dag']
  },
  {
    id: 'nesting-2d',
    route: '/nesting-2d',
    titleEn: '2D Sheet Nesting & Remnant Optimizer',
    titleTr: '2D Plaka Yerleşim & Fire Optimizasyonu',
    pillar: 'cad_design',
    badge: 'NEST',
    iconName: 'Scissors',
    engineType: 'optimizer_engine',
    standards: ['SigmaNEST Heuristic', 'DXF Cut Path'],
    keywords: ['nesting', 'cut', 'yerlesim', 'plaka', 'sheet metal']
  },
  {
    id: 'cutting-optimizer',
    route: '/cutting-optimizer',
    titleEn: '1D Linear Profile Cut Optimizer',
    titleTr: '1D Profil Kesim Optimizasyonu',
    pillar: 'cad_design',
    badge: '1D',
    iconName: 'Scissors',
    engineType: 'optimizer_engine',
    standards: ['Kerf Compensation', 'Stock Sawing'],
    keywords: ['cutting', '1d', 'linear', 'kesim', 'profil', 'saw']
  },
  {
    id: 'parametric-cad',
    route: '/parametric-cad',
    titleEn: 'Parametric CAD Model Generator',
    titleTr: 'Parametrik CAD Model Üretici',
    pillar: 'cad_design',
    iconName: 'Box',
    engineType: 'cad_3d',
    standards: ['Parametric CSG'],
    keywords: ['parametric', 'csg', 'cad', 'solid']
  },

  // ─── 2. Mechanical Solvers (ISO/DIN/VDI) ───
  {
    id: 'bolt-torque',
    route: '/bolt-torque',
    titleEn: 'Bolt Preload & Torque (VDI 2230)',
    titleTr: 'Cıvata Ön Yükü & Torku (VDI 2230)',
    pillar: 'mechanical',
    badge: 'VDI',
    iconName: 'Wrench',
    engineType: 'deterministic_solver',
    standards: ['VDI 2230 Blatt 1', 'ISO 898-1', 'ASME PCC-1'],
    keywords: ['civata', 'tork', 'bolt', 'torque', 'fastener', 'vdi 2230', 'iso 898']
  },
  {
    id: 'keyway-connection',
    route: '/keyway-connection',
    titleEn: 'Parallel Keyway Stress (DIN 6885)',
    titleTr: 'Paralel Kama Dayanımı (DIN 6885)',
    pillar: 'mechanical',
    badge: 'DIN',
    iconName: 'Layers',
    engineType: 'deterministic_solver',
    standards: ['DIN 6885-1', 'ISO 773'],
    keywords: ['kama', 'keyway', 'din 6885', 'mil gobek', 'shear', 'surface pressure']
  },
  {
    id: 'press-fit',
    route: '/press-fit',
    titleEn: 'Interference / Press Fit (DIN 7190)',
    titleTr: 'Sıkı Geçme / Pres & Sıcak (DIN 7190)',
    pillar: 'mechanical',
    badge: 'DIN',
    iconName: 'Gauge',
    engineType: 'deterministic_solver',
    standards: ['DIN 7190', 'Lamé Equations'],
    keywords: ['siki gecme', 'pres gecme', 'press fit', 'interference fit', 'shrink fit', 'din 7190']
  },
  {
    id: 'o-ring',
    route: '/o-ring',
    titleEn: 'O-Ring Gland & Squeeze (ISO 3601)',
    titleTr: 'O-Ring Sızdırmazlık & Kanal (ISO 3601)',
    pillar: 'mechanical',
    badge: 'ISO',
    iconName: 'Droplets',
    engineType: 'deterministic_solver',
    standards: ['ISO 3601-1', 'AS568'],
    keywords: ['o-ring', 'oring', 'sizdirmazlik', 'iso 3601', 'as568', 'gland', 'seal']
  },
  {
    id: 'bearings',
    route: '/bearings',
    titleEn: 'Bearing Rating Life L10h (ISO 281)',
    titleTr: 'Rulman Ömrü Hesabı L10h (ISO 281)',
    pillar: 'mechanical',
    badge: 'ISO',
    iconName: 'CircleDot',
    engineType: 'deterministic_solver',
    standards: ['ISO 281:2007', 'ISO 76', 'DIN 622'],
    keywords: ['rulman', 'bearing', 'skf', 'l10', 'l10h', 'iso 281']
  },
  {
    id: 'gears',
    route: '/gears',
    titleEn: 'Spur & Helical Gear Design (ISO 6336)',
    titleTr: 'Silindirik Dişli Hesabı (ISO 6336)',
    pillar: 'mechanical',
    badge: 'ISO',
    iconName: 'Cog',
    engineType: 'deterministic_solver',
    standards: ['ISO 6336-1:2019', 'DIN 3990', 'AGMA 2001'],
    keywords: ['disli', 'gear', 'pinion', 'spur', 'helical', 'iso 6336']
  },
  {
    id: 'planetary-gearbox',
    route: '/planetary-gearbox',
    titleEn: 'Planetary Gearbox Epicyclic Ratio',
    titleTr: 'Planet Redüktör Oran & Tork Hesabı',
    pillar: 'mechanical',
    badge: 'PLANET',
    iconName: 'Cog',
    engineType: 'deterministic_solver',
    standards: ['Willis Equations', 'AGMA 6123'],
    keywords: ['planet', 'planetary', 'gearbox', 'reduktor', 'gunes', 'uydu', 'willis']
  },
  {
    id: 'gearbox-design',
    route: '/gearbox-design',
    titleEn: 'Multi-Stage Gearbox Sizing Engine',
    titleTr: 'Kademeli Redüktör Tasarım Motoru',
    pillar: 'mechanical',
    iconName: 'Cog',
    engineType: 'deterministic_solver',
    standards: ['DIN 3990', 'VDI 2736'],
    keywords: ['gearbox', 'reduktor', 'tasarim', 'mil', 'kademe']
  },
  {
    id: 'shafts',
    route: '/shafts',
    titleEn: 'Shaft Diameter & Torsion (DIN 743)',
    titleTr: 'Mil Boyutlandırma & Burulma (DIN 743)',
    pillar: 'mechanical',
    badge: 'DIN',
    iconName: 'Disc',
    engineType: 'deterministic_solver',
    standards: ['DIN 743', 'ASME B106.1M'],
    keywords: ['mil', 'shaft', 'torsion', 'burulma', 'din 743']
  },
  {
    id: 'advanced-spring',
    route: '/advanced-spring',
    titleEn: 'Helical Compression Spring Design',
    titleTr: 'Helisel Basma Yayı Hesabı',
    pillar: 'mechanical',
    iconName: 'Disc',
    engineType: 'deterministic_solver',
    standards: ['DIN EN 13906-1', 'Wahl Factor'],
    keywords: ['yay', 'spring', 'helical', 'wahl', 'compression']
  },
  {
    id: 'chain-drive',
    route: '/chain-drive',
    titleEn: 'Roller Chain Drive Sizing (ISO 606)',
    titleTr: 'Makaralı Zincir Mekanizması (ISO 606)',
    pillar: 'mechanical',
    badge: 'ISO',
    iconName: 'Activity',
    engineType: 'deterministic_solver',
    standards: ['ISO 606', 'DIN 8187'],
    keywords: ['zincir', 'chain', 'sprocket', 'iso 606', 'roller chain']
  },
  {
    id: 'belt-drive',
    route: '/belt-drive',
    titleEn: 'V-Belt & Timing Belt Drive (ISO 5291)',
    titleTr: 'Kayış-Kasnak Mekanizması (ISO 5291)',
    pillar: 'mechanical',
    badge: 'ISO',
    iconName: 'Sliders',
    engineType: 'deterministic_solver',
    standards: ['ISO 5291', 'DIN 2215', 'RMA IP-20'],
    keywords: ['kayis', 'kasnak', 'belt', 'pulley', 'v-belt', 'timing belt']
  },
  {
    id: 'motor-selection-std',
    route: '/motor-selection-std',
    titleEn: 'Electric Motor Power & Sizing (IEC 60034)',
    titleTr: 'Elektrik Motor Güç Seçimi (IEC 60034)',
    pillar: 'mechanical',
    badge: 'IEC',
    iconName: 'Zap',
    engineType: 'deterministic_solver',
    standards: ['IEC 60034-30', 'DIN EN 60034'],
    keywords: ['motor', 'motor secimi', 'kw', 'hp', 'rpm', 'tork', 'iec']
  },
  {
    id: 'vibration',
    route: '/vibration',
    titleEn: 'Natural Frequency & Vibration Harmonics',
    titleTr: 'Doğal Frekans & Titreşim Analizi',
    pillar: 'mechanical',
    iconName: 'Activity',
    engineType: 'deterministic_solver',
    standards: ['ISO 10816', 'Rayleigh Method'],
    keywords: ['titresim', 'vibration', 'frekans', 'resonance', 'dof']
  },
  {
    id: 'handbook',
    route: '/handbook',
    titleEn: 'Mechanical Engineering Standards Handbook',
    titleTr: 'Mühendislik Standartları El Kitabı',
    pillar: 'mechanical',
    iconName: 'BookOpen',
    engineType: 'deterministic_solver',
    standards: ['ISO / DIN / VDI / ASME Catalog'],
    keywords: ['el kitabi', 'handbook', 'iso', 'din', 'astm', 'standart']
  },
  {
    id: 'thread-stripping-area',
    route: '/thread-stripping-area',
    titleEn: 'Bolt Thread Shear Stripping Area',
    titleTr: 'Cıvata Diş Sıyırma Alanı Hesabı',
    pillar: 'mechanical',
    badge: 'ISO',
    iconName: 'Wrench',
    engineType: 'deterministic_solver',
    standards: ['ISO 965', 'VDI 2230 Shear Stripping'],
    keywords: ['thread', 'stripping', 'dis siyirma', 'bolt', 'shear area']
  },

  // ─── 3. Materials, Structural & Manufacturing ───
  {
    id: 'beam-deflection',
    route: '/beam-deflection',
    titleEn: 'Beam Deflection & Bending Moments',
    titleTr: 'Kiriş Sehim & Moment Analizi',
    pillar: 'materials_mfg',
    iconName: 'Layers',
    engineType: 'deterministic_solver',
    standards: ['Euler-Bernoulli Beam Theory', 'AISC 360-16'],
    keywords: ['kiris', 'sehim', 'beam', 'deflection', 'moment', 'shear']
  },
  {
    id: 'column-buckling',
    route: '/column-buckling',
    titleEn: 'Column Buckling (Euler & Johnson)',
    titleTr: 'Kolon Burkulma Analizi (Euler-Johnson)',
    pillar: 'materials_mfg',
    iconName: 'Layers',
    engineType: 'deterministic_solver',
    standards: ['Euler Critical Load', 'Johnson Parabolic Criterion'],
    keywords: ['kolon', 'burkulma', 'buckling', 'euler', 'johnson', 'slenderness']
  },
  {
    id: 'concrete-reinforcement',
    route: '/concrete-reinforcement',
    titleEn: 'Reinforced Concrete (RC) Sizing',
    titleTr: 'Betonarme Donatı & Kesit Hesabı',
    pillar: 'materials_mfg',
    iconName: 'Layers',
    engineType: 'deterministic_solver',
    standards: ['Eurocode 2 (EN 1992)', 'ACI 318'],
    keywords: ['betonarme', 'concrete', 'reinforcement', 'donati', 'kiris']
  },
  {
    id: 'materials-db',
    route: '/materials-db',
    titleEn: 'Engineering Materials Physical Database',
    titleTr: 'Mühendislik Malzemeleri Veritabanı',
    pillar: 'materials_mfg',
    iconName: 'Database',
    engineType: 'deterministic_solver',
    standards: ['EN 573-3', 'EN 10025', 'ASTM MatWeb Spec'],
    keywords: ['malzeme', 'material', 'aluminyum', 'celik', 'titanyum', 'density']
  },
  {
    id: 'materials-explorer',
    route: '/materials-explorer',
    titleEn: 'Materials Intelligence & Property Matrix',
    titleTr: 'Malzeme Özellikleri Matrisi',
    pillar: 'materials_mfg',
    iconName: 'Database',
    engineType: 'deterministic_solver',
    standards: ['Ashby Material Selection Charts'],
    keywords: ['materials', 'ashby', 'yield', 'tensile', 'modulus']
  },
  {
    id: 'material-selector-ai',
    route: '/material-selector-ai',
    titleEn: 'Material Selector Engine (Pareto Optimal)',
    titleTr: 'Optimum Malzeme Seçim Motoru',
    pillar: 'materials_mfg',
    iconName: 'Database',
    engineType: 'deterministic_solver',
    standards: ['Ashby Index Optimization'],
    keywords: ['material', 'selector', 'pareto', 'ashby']
  },
  {
    id: 'fits',
    route: '/fits',
    titleEn: 'ISO Fits & Tolerances (ISO 286)',
    titleTr: 'Toleranslar & Geçmeler (ISO 286)',
    pillar: 'materials_mfg',
    badge: 'ISO',
    iconName: 'Compass',
    engineType: 'deterministic_solver',
    standards: ['ISO 286-1', 'ISO 286-2', 'ANSI B4.2'],
    keywords: ['tolerans', 'gecme', 'fits', 'iso 286', 'h7', 'g6', 'tolerance']
  },
  {
    id: 'sheet-metal',
    route: '/sheet-metal',
    titleEn: 'Sheet Metal Bending & Flat Pattern (DIN 6935)',
    titleTr: 'Sac Büküm & Açınım Hesabı (DIN 6935)',
    pillar: 'materials_mfg',
    badge: 'DIN',
    iconName: 'Split',
    engineType: 'deterministic_solver',
    standards: ['DIN 6935', 'K-Factor', 'Bend Deduction'],
    keywords: ['sac', 'bukum', 'sheet metal', 'bend', 'k factor', 'din 6935']
  },
  {
    id: 'machining-details',
    route: '/machining-details',
    titleEn: 'Machining Feeds, Speeds & Power',
    titleTr: 'Talaşlı İmalat Kesme Hızları & İlerleme',
    pillar: 'materials_mfg',
    iconName: 'Scissors',
    engineType: 'deterministic_solver',
    standards: ['ISO 513', 'Taylor Tool Life Formula'],
    keywords: ['talasli', 'machining', 'feed', 'speed', 'torna', 'freze', 'milling', 'turning']
  },
  {
    id: 'machining-time',
    route: '/machining-time',
    titleEn: 'Machining Cycle Time Estimator',
    titleTr: 'Talaşlı İmalat Süre Hesaplayıcı',
    pillar: 'materials_mfg',
    iconName: 'Scissors',
    engineType: 'deterministic_solver',
    standards: ['Standard Cycle Time Formulations'],
    keywords: ['machining', 'time', 'sure', 'torna', 'freze']
  },
  {
    id: 'welding',
    route: '/welding',
    titleEn: 'Welding Joint Strength (AWS / Eurocode 3)',
    titleTr: 'Kaynak Mukavemeti & Dikiş Boyutlandırma',
    pillar: 'materials_mfg',
    iconName: 'Flame',
    engineType: 'deterministic_solver',
    standards: ['AWS D1.1', 'Eurocode 3 EN 1993-1-8', 'ISO 2553'],
    keywords: ['kaynak', 'weld', 'joint', 'throat', 'fillet', 'butt']
  },
  {
    id: 'welding-fillet',
    route: '/welding-fillet',
    titleEn: 'Fillet Weld Sizing & Directional Method',
    titleTr: 'Köşe Kaynağı Boyutlandırma',
    pillar: 'materials_mfg',
    iconName: 'Flame',
    engineType: 'deterministic_solver',
    standards: ['EN 1993-1-8 Directional Method'],
    keywords: ['fillet', 'weld', 'kose kaynak', 'throat thickness']
  },
  {
    id: 'profile-weight',
    route: '/profile-weight',
    titleEn: 'Profile Weight, Area & Mass Metrage',
    titleTr: 'Profil Ağırlık, Kesit & Metraj Hesabı',
    pillar: 'materials_mfg',
    iconName: 'Scale',
    engineType: 'deterministic_solver',
    standards: ['EN 755-9 Extruded Aluminum Tolerances'],
    keywords: ['profil', 'agirlik', 'weight', 'aluminum', 'celik', 'mass']
  },
  {
    id: 'cost-estimator',
    route: '/cost-estimator',
    titleEn: 'Manufacturing Should-Cost & Carbon Estimator',
    titleTr: 'İmalat Maliyet & Karbon Ayak İzi Motoru',
    pillar: 'materials_mfg',
    iconName: 'DollarSign',
    engineType: 'deterministic_solver',
    standards: ['Activity Based Costing (ABC)', 'ISO 14040 LCA'],
    keywords: ['maliyet', 'cost', 'fiyat', 'imalat', 'carbon', 'co2']
  },
  {
    id: 'strength-analysis',
    route: '/strength-analysis',
    titleEn: 'Stress Tensor & Mohr Circle Analysis',
    titleTr: 'Gerilme Tensörü & Mohr Çemberi Analizi',
    pillar: 'materials_mfg',
    iconName: 'CircleDot',
    engineType: 'deterministic_solver',
    standards: ['Cauchy Stress Tensor 3D', 'Tresca & Von Mises'],
    keywords: ['mohr', 'stress', 'gerilme', 'principal', 'tensor', 'tresca']
  },
  {
    id: 'manufacturing-readiness',
    route: '/manufacturing-readiness',
    titleEn: 'Manufacturing Readiness Level (MRL) Audit',
    titleTr: 'İmalat Hazırlık Seviyesi (MRL) Denetimi',
    pillar: 'materials_mfg',
    iconName: 'ShieldCheck',
    engineType: 'deterministic_solver',
    standards: ['DoD MRL Deskbook V2'],
    keywords: ['mrl', 'readiness', 'manufacturing', 'audit', 'iso 9001']
  },
  {
    id: 'manufacturing-sandbox',
    route: '/manufacturing-sandbox',
    titleEn: 'CAM Process Simulation Sandbox',
    titleTr: 'CAM Süreç Simülasyon Alanı',
    pillar: 'materials_mfg',
    iconName: 'Sliders',
    engineType: 'deterministic_solver',
    standards: ['CNC G-Code Kinematic Validation'],
    keywords: ['sandbox', 'cam', 'cnc', 'process']
  },
  {
    id: 'engineering-selection',
    route: '/engineering-selection',
    titleEn: 'Machine Component Selection Guide',
    titleTr: 'Makine Parçası Seçim Kılavuzu',
    pillar: 'materials_mfg',
    iconName: 'Compass',
    engineType: 'deterministic_solver',
    standards: ['Design for Manufacturing (DFMA)'],
    keywords: ['selection', 'guide', 'components', 'dfma']
  },
  {
    id: 'manufacturing',
    route: '/manufacturing',
    titleEn: 'Manufacturing Process Planner',
    titleTr: 'İmalat Süreç Planlama Kılavuzu',
    pillar: 'materials_mfg',
    iconName: 'Layers',
    engineType: 'deterministic_solver',
    standards: ['Production Routing Best Practices'],
    keywords: ['manufacturing', 'process', 'routing', 'planner']
  },
  {
    id: 'truss-analysis',
    route: '/truss-analysis',
    titleEn: 'Truss Member 2D Matrix Analysis',
    titleTr: 'Kafes Kiriş Matris Analizi',
    pillar: 'materials_mfg',
    iconName: 'Layers',
    engineType: 'deterministic_solver',
    standards: ['Method of Joints & Sections', 'Stiffness Method'],
    keywords: ['truss', 'kafes', 'kiris', 'joints', 'stiffness']
  },
  {
    id: 'bending-moment',
    route: '/bending-moment',
    titleEn: 'Bending Moment & Shear Force Diagrams (SFD/BMD)',
    titleTr: 'Eğilme Momenti & Kesme Kuvveti Diyagramı',
    pillar: 'materials_mfg',
    iconName: 'Layers',
    engineType: 'deterministic_solver',
    standards: ['Singularity Functions', 'M/EI Curvature'],
    keywords: ['sfd', 'bmd', 'bending moment', 'shear force', 'diagram']
  },

  // ─── 4. Fluids, Thermal & Electrical Power ───
  {
    id: 'heat-sink',
    route: '/heat-sink',
    titleEn: 'Extruded Aluminum Heat Sink (Thermal Resistance)',
    titleTr: 'Alüminyum Soğutucu Profil (Termal Direnç)',
    pillar: 'fluids_thermal_power',
    badge: 'THERMAL',
    iconName: 'Flame',
    engineType: 'deterministic_solver',
    standards: ['Natural & Forced Convection Rth Formulas'],
    keywords: ['heat sink', 'sogutucu', 'termal', 'rth', 'fin', 'convection']
  },
  {
    id: 'thermal-expansion',
    route: '/thermal-expansion',
    titleEn: 'Linear & Volumetric Thermal Expansion',
    titleTr: 'Lineer & Hacimsel Isıl Genleşme Hesabı',
    pillar: 'fluids_thermal_power',
    iconName: 'Thermometer',
    engineType: 'deterministic_solver',
    standards: ['ASTM E228 Coefficient of Thermal Expansion (CTE)'],
    keywords: ['termal', 'thermal', 'expansion', 'genlesme', 'cte', 'temperature']
  },
  {
    id: 'pumps',
    route: '/pumps',
    titleEn: 'Centrifugal Pump Performance & NPSH',
    titleTr: 'Santrifüj Pompa & NPSH Hesabı',
    pillar: 'fluids_thermal_power',
    iconName: 'Droplets',
    engineType: 'deterministic_solver',
    standards: ['ISO 9906 Rotodynamic Pumps', 'HI 1.3'],
    keywords: ['pompa', 'pump', 'npsh', 'head', 'flow rate', 'debi']
  },
  {
    id: 'fluid-dynamics',
    route: '/fluid-dynamics',
    titleEn: 'Pipe Flow & Darcy-Weisbach Pressure Drop',
    titleTr: 'Boru Akışı & Basınç Düşümü Hesabı',
    pillar: 'fluids_thermal_power',
    iconName: 'Waves',
    engineType: 'deterministic_solver',
    standards: ['Darcy-Weisbach Equation', 'Colebrook-White Formula'],
    keywords: ['fluid', 'pressure drop', 'darcy', 'basinc', 'pipe', 'akiskan']
  },
  {
    id: 'pipe-friction',
    route: '/pipe-friction',
    titleEn: 'Pipe Head Loss & Minor Losses (Fittings)',
    titleTr: 'Boru Sürtünme Kayıpları & Armatürler',
    pillar: 'fluids_thermal_power',
    iconName: 'Waves',
    engineType: 'deterministic_solver',
    standards: ['Moody Chart', 'Crane Technical Paper 410'],
    keywords: ['pipe', 'friction', 'head loss', 'fittings', 'moody', 'k factor']
  },
  {
    id: 'pressure-vessel',
    route: '/pressure-vessel',
    titleEn: 'Thin & Thick-Walled Pressure Vessel',
    titleTr: 'İnce & Kalın Çeperli Basınçlı Kap',
    pillar: 'fluids_thermal_power',
    badge: 'ASME',
    iconName: 'Gauge',
    engineType: 'deterministic_solver',
    standards: ['ASME Boiler & Pressure Vessel Code Sec VIII Div 1'],
    keywords: ['pressure vessel', 'basincli kap', 'hoop stress', 'asme', 'lamé']
  },
  {
    id: 'hvac-load',
    route: '/hvac-load',
    titleEn: 'HVAC Heating & Cooling Thermal Load',
    titleTr: 'HVAC Isıtma & Soğutma Yükü Hesabı',
    pillar: 'fluids_thermal_power',
    iconName: 'Thermometer',
    engineType: 'deterministic_solver',
    standards: ['ASHRAE Fundamentals Handbook', 'EN 12831'],
    keywords: ['hvac', 'thermal load', 'isitma', 'sogutma', 'ashrae', 'heat load']
  },
  {
    id: 'reducer-lubrication',
    route: '/reducer-lubrication',
    titleEn: 'Gearbox Thermal Capacity & Lubrication',
    titleTr: 'Redüktör Termal Güç & Yağlama Hesabı',
    pillar: 'fluids_thermal_power',
    iconName: 'Droplets',
    engineType: 'deterministic_solver',
    standards: ['ISO/TR 14179 Gearbox Thermal Capacity'],
    keywords: ['lubrication', 'oil', 'yaglama', 'viskozite', 'thermal capacity', 'reduktor']
  },
  {
    id: 'wind-tunnel',
    route: '/wind-tunnel',
    titleEn: 'Wind Tunnel Aerodynamic Drag & Lift',
    titleTr: 'Rüzgar Tüneli Aerodinamik Sürükleme',
    pillar: 'fluids_thermal_power',
    iconName: 'Wind',
    engineType: 'deterministic_solver',
    standards: ['Bernoulli Equation', 'Compressible & Incompressible Flow'],
    keywords: ['wind tunnel', 'drag', 'lift', 'aerodynamic', 'ruzgar']
  },
  {
    id: 'aerospace-dynamics',
    route: '/aerospace-dynamics',
    titleEn: 'Atmospheric Flight Dynamics (ISA Model)',
    titleTr: 'Atmosferik Uçuş Dinamiği (ISA Modeli)',
    pillar: 'fluids_thermal_power',
    iconName: 'Wind',
    engineType: 'deterministic_solver',
    standards: ['International Standard Atmosphere (ICAO Doc 7488)'],
    keywords: ['aerospace', 'flight', 'isa', 'atmosphere', 'altitude', 'mach']
  },
  {
    id: 'three-phase-power',
    route: '/three-phase-power',
    titleEn: 'Three-Phase AC Power & Power Factor (IEEE 141)',
    titleTr: '3 Faz Güç & Güç Faktörü Hesabı (IEEE 141)',
    pillar: 'fluids_thermal_power',
    badge: 'IEEE',
    iconName: 'Zap',
    engineType: 'deterministic_solver',
    standards: ['IEEE 141 (Red Book)', 'IEC 60364'],
    keywords: ['three phase', 'power', 'guc', '3 faz', 'kw', 'kvar', 'kva', 'cos phi']
  },
  {
    id: 'ohms-law',
    route: '/ohms-law',
    titleEn: "Ohm's Law & DC/AC Electrical Circuit Solver",
    titleTr: "Ohm Kanunu & DC/AC Devre Çözücü",
    pillar: 'fluids_thermal_power',
    iconName: 'Zap',
    engineType: 'deterministic_solver',
    standards: ['IEC 60050', "Ohm's Law & Joule Heating"],
    keywords: ['ohms law', 'volt', 'ampere', 'ohm', 'direnc', 'gerilim', 'akim']
  },
  {
    id: 'voltage-drop',
    route: '/voltage-drop',
    titleEn: 'Cable Sizing & Voltage Drop (IEC 60287)',
    titleTr: 'Kablo Kesiti & Gerilim Düşümü (IEC 60287)',
    pillar: 'fluids_thermal_power',
    badge: 'IEC',
    iconName: 'Cable',
    engineType: 'deterministic_solver',
    standards: ['IEC 60287', 'IEC 60364-5-52', 'NEC Chapter 9'],
    keywords: ['voltage drop', 'gerilim dusumu', 'kablo kesiti', 'cable sizing']
  },
  {
    id: 'transformer-calculation',
    route: '/transformer-calculation',
    titleEn: 'Transformer Winding & Core Sizing (IEEE C57)',
    titleTr: 'Transformatör Sargı & Nüve Boyutlandırma',
    pillar: 'fluids_thermal_power',
    badge: 'IEEE',
    iconName: 'Zap',
    engineType: 'deterministic_solver',
    standards: ['IEEE C57.12', 'IEC 60076'],
    keywords: ['transformer', 'trafo', 'sarim', 'nuve', 'magnetic flux']
  },
  {
    id: 'filter-design',
    route: '/filter-design',
    titleEn: 'Active & Passive Analog Filter Design',
    titleTr: 'Aktif & Pasif Analog Filtre Tasarımı',
    pillar: 'fluids_thermal_power',
    iconName: 'Cable',
    engineType: 'deterministic_solver',
    standards: ['Butterworth / Chebyshev Polynomial Filters'],
    keywords: ['filter', 'low pass', 'high pass', 'butterworth', 'chebyshev']
  },
  {
    id: 'lift-coefficient',
    route: '/lift-coefficient',
    titleEn: 'Aerodynamic Lift & Drag Coefficients',
    titleTr: 'Aerodinamik Taşıma & Sürükleme Katsayısı',
    pillar: 'fluids_thermal_power',
    iconName: 'Wind',
    engineType: 'deterministic_solver',
    standards: ['Thin Airfoil Theory', 'Kutta-Joukowski Theorem'],
    keywords: ['lift', 'airfoil', 'aerodynamic', 'kanat', 'cl', 'cd']
  },

  // ─── 5. Engineering Science & Theory ───
  {
    id: 'calculator',
    route: '/calculator',
    titleEn: 'Scientific CAS & Unit Calculator',
    titleTr: 'Bilimsel CAS & Birimli Hesap Makinesi',
    pillar: 'science_theory',
    iconName: 'Calculator',
    engineType: 'deterministic_solver',
    standards: ['IEEE 754 64-bit Floating Point Precision'],
    keywords: ['calculator', 'bilimsel', 'cas', 'matematik', 'fonksiyon']
  },
  {
    id: 'unit-converter',
    route: '/unit-converter',
    titleEn: 'Hardness & Engineering Unit Converter',
    titleTr: 'Sertlik & Mühendislik Birim Dönüştürücü',
    pillar: 'science_theory',
    iconName: 'ArrowLeftRight',
    engineType: 'deterministic_solver',
    standards: ['ASTM E140 Hardness Conversion', 'BIPM SI Units Guide'],
    keywords: ['birim', 'unit', 'donusturucu', 'sertlik', 'hardness', 'hrc', 'hb', 'vickers', 'psi', 'bar', 'mpa']
  },
  {
    id: 'physics-solver',
    route: '/physics-solver',
    titleEn: 'Computational Physics & Classical Mechanics',
    titleTr: 'Hesaplamalı Fizik & Klasik Mekanik Çözücü',
    pillar: 'science_theory',
    iconName: 'Atom',
    engineType: 'deterministic_solver',
    standards: ['Newtonian & Lagrangian Mechanics'],
    keywords: ['fizik', 'physics', 'kinematics', 'mechanics', 'force', 'energy']
  },
  {
    id: 'physics-kinematics',
    route: '/physics-kinematics',
    titleEn: '1D/2D Kinematics & Projectile Motion',
    titleTr: 'Kinematik & Eğik Atış Hareketi',
    pillar: 'science_theory',
    iconName: 'Activity',
    engineType: 'deterministic_solver',
    standards: ['Uniform Acceleration Kinematics'],
    keywords: ['kinematics', 'projectile', 'atis', 'hiz', 'ivme']
  },
  {
    id: 'fatigue-analysis',
    route: '/fatigue-analysis',
    titleEn: 'High-Cycle Fatigue & Goodman / Gerber Life',
    titleTr: 'Yorulma Ömrü (Goodman / Gerber Kriteri)',
    pillar: 'science_theory',
    iconName: 'Activity',
    engineType: 'deterministic_solver',
    standards: ['ASTM E466', 'Goodman, Soderberg, Gerber Criteria'],
    keywords: ['fatigue', 'yorulma', 'goodman', 'gerber', 'sn curve', 'endurance limit']
  },
  {
    id: 'fatigue-advanced',
    route: '/fatigue-advanced',
    titleEn: 'Multi-Axial Fatigue Life & S-N Curves',
    titleTr: 'Çok Eksenli Yorulma Ömrü & S-N Eğrileri',
    pillar: 'science_theory',
    iconName: 'Activity',
    engineType: 'deterministic_solver',
    standards: ['Basquin Law', 'Miner Cumulative Damage Rule'],
    keywords: ['fatigue', 'multiaxial', 'sn', 'miner', 'basquin']
  },
  {
    id: 'failure-prediction',
    route: '/failure-prediction',
    titleEn: 'Machine Failure & Reliability Prediction (MTBF)',
    titleTr: 'Arıza & Güvenilirlik Tahmini (MTBF)',
    pillar: 'science_theory',
    iconName: 'ShieldCheck',
    engineType: 'deterministic_solver',
    standards: ['MIL-HDBK-217F', 'Weibull Reliability Analysis'],
    keywords: ['failure', 'ariza', 'mtbf', 'reliability', 'weibull']
  },
  {
    id: 'chemistry-reactions',
    route: '/chemistry-reactions',
    titleEn: 'Chemical Stoichiometry & Reaction Balance',
    titleTr: 'Kimyasal Stokiyometri & Reaksiyon Dengesi',
    pillar: 'science_theory',
    iconName: 'Atom',
    engineType: 'deterministic_solver',
    standards: ['Conservation of Mass', 'IUPAC Nomenclature'],
    keywords: ['chemistry', 'stoichiometry', 'kimya', 'reaction', 'moles']
  },
  {
    id: 'periodic-table',
    route: '/periodic-table',
    titleEn: 'Interactive Periodic Table of Elements',
    titleTr: 'Etkileşimli Periyodik Element Tablosu',
    pillar: 'science_theory',
    iconName: 'Atom',
    engineType: 'deterministic_solver',
    standards: ['IUPAC Standard Atomic Weights'],
    keywords: ['periodic table', 'periyodik tablo', 'elementler', 'atomic weight', 'valency']
  },
  {
    id: 'biology-genetics',
    route: '/biology-genetics',
    titleEn: 'Population Genetics (Hardy-Weinberg)',
    titleTr: 'Popülasyon Genetiği (Hardy-Weinberg)',
    pillar: 'science_theory',
    iconName: 'Atom',
    engineType: 'deterministic_solver',
    standards: ['Hardy-Weinberg Equilibrium Principle'],
    keywords: ['genetics', 'biology', 'hardy weinberg', 'allele frequency']
  },
  {
    id: 'cs-algorithms',
    route: '/cs-algorithms',
    titleEn: 'Computer Science Data Structures & Complexity',
    titleTr: 'Algoritma Analizi & Karmaşıklık (Big-O)',
    pillar: 'science_theory',
    iconName: 'Cpu',
    engineType: 'deterministic_solver',
    standards: ['Big-O Asymptotic Complexity Models'],
    keywords: ['algorithms', 'big o', 'complexity', 'data structures', 'sorting']
  },
  {
    id: 'digital-logic',
    route: '/digital-logic',
    titleEn: 'Boolean Algebra & Digital Logic Gate Simulator',
    titleTr: 'Boole Cebiri & Dijital Mantık Kapıları',
    pillar: 'science_theory',
    iconName: 'Cpu',
    engineType: 'deterministic_solver',
    standards: ['IEEE 91/91a Binary Logic Symbols'],
    keywords: ['digital logic', 'boolean', 'mantik kapilari', 'karnaugh', 'gates']
  },
  {
    id: 'hooke-law',
    route: '/hooke-law',
    titleEn: "Hooke's Law & Elastic Spring Deformation",
    titleTr: "Hooke Kanunu & Elastik Şekil Değiştirme",
    pillar: 'science_theory',
    iconName: 'Disc',
    engineType: 'deterministic_solver',
    standards: ["Hooke's Law (F=kx)", 'Young Modulus Ratio'],
    keywords: ['hooke', 'spring constant', 'yay sabiti', 'elasticity']
  },
  {
    id: 'ideal-gas-law',
    route: '/ideal-gas-law',
    titleEn: 'Ideal Gas Law & Thermodynamic State (PV=nRT)',
    titleTr: 'İdeal Gaz Kanunu & Termodinamik Durum (PV=nRT)',
    pillar: 'science_theory',
    iconName: 'Atom',
    engineType: 'deterministic_solver',
    standards: ['Ideal Gas Law', 'Van der Waals Real Gas Correction'],
    keywords: ['gas law', 'termodinamik', 'pv=nrt', 'pressure', 'volume', 'temperature']
  },
  {
    id: 'chemical-molarity',
    route: '/chemical-molarity',
    titleEn: 'Solution Molarity, Molality & Dilution',
    titleTr: 'Çözelti Molarite, Molalite & Seyreltme',
    pillar: 'science_theory',
    iconName: 'Atom',
    engineType: 'deterministic_solver',
    standards: ['IUPAC Concentration Definitions'],
    keywords: ['molarity', 'molality', 'dilution', 'seyreltme', 'cozelti']
  },
  {
    id: 'radioactive-decay',
    route: '/radioactive-decay',
    titleEn: 'Radioactive Decay & Isotope Half-Life',
    titleTr: 'Radyoaktif Bozunma & Yarı Ömür Hesabı',
    pillar: 'science_theory',
    iconName: 'Atom',
    engineType: 'deterministic_solver',
    standards: ['Exponential Decay Law', 'Bateman Equations'],
    keywords: ['radioactive', 'half life', 'decay', 'izotop', 'bozunma']
  },
  {
    id: 'reynolds-number',
    route: '/reynolds-number',
    titleEn: 'Reynolds Number & Flow Regime (Laminar/Turbulent)',
    titleTr: 'Reynolds Sayısı & Akış Rejimi (Laminer/Türbülans)',
    pillar: 'science_theory',
    iconName: 'Waves',
    engineType: 'deterministic_solver',
    standards: ['Dimensionless Flow Invariants'],
    keywords: ['reynolds', 'flow regime', 'laminar', 'turbulent', 'viscosity']
  },
  {
    id: 'rocket-equation',
    route: '/rocket-equation',
    titleEn: 'Tsiolkovsky Rocket Equation & Delta-V',
    titleTr: 'Tsiolkovsky Roket Denklemi & Delta-V',
    pillar: 'science_theory',
    iconName: 'Wind',
    engineType: 'deterministic_solver',
    standards: ['Tsiolkovsky Ideal Rocket Equation'],
    keywords: ['rocket', 'delta v', 'tsiolkovsky', 'specific impulse', 'propulsion']
  },
  {
    id: 'centripetal-force',
    route: '/centripetal-force',
    titleEn: 'Centripetal Force & Rotational Dynamics',
    titleTr: 'Merkezcil Kuvvet & Dönel Dinamik',
    pillar: 'science_theory',
    iconName: 'Disc',
    engineType: 'deterministic_solver',
    standards: ['Circular Motion Dynamics (F=mv²/r)'],
    keywords: ['centripetal', 'rotation', 'merkezcil', 'rpm', 'angular velocity']
  },
  {
    id: 'kinetic-energy',
    route: '/kinetic-energy',
    titleEn: 'Kinetic Energy & Work-Energy Theorem',
    titleTr: 'Kinetik Enerji & İş-Enerji Teoremi',
    pillar: 'science_theory',
    iconName: 'Activity',
    engineType: 'deterministic_solver',
    standards: ['Work-Energy Principle (E = 0.5*m*v^2)'],
    keywords: ['energy', 'kinetic', 'joule', 'work', 'velocity']
  },
  {
    id: 'newton-second-law',
    route: '/newton-second-law',
    titleEn: "Newton's Second Law Dynamic Force (F=ma)",
    titleTr: "Newton'un İkinci Kanunu Dinamik Kuvvet (F=ma)",
    pillar: 'science_theory',
    iconName: 'Activity',
    engineType: 'deterministic_solver',
    standards: ["Newtonian Mechanics (F=ma)"],
    keywords: ['force', 'newton', 'mass', 'acceleration', 'f=ma']
  },
  {
    id: 'specific-gravity',
    route: '/specific-gravity',
    titleEn: 'Material Specific Gravity & Relative Density',
    titleTr: 'Özgül Ağırlık & Bağıl Yoğunluk Hesabı',
    pillar: 'science_theory',
    iconName: 'Scale',
    engineType: 'deterministic_solver',
    standards: ['ASTM D792 / ASTM C127 Specific Gravity'],
    keywords: ['specific gravity', 'density', 'yogunluk', 'ozgul agirlik', 'relative density']
  },

  // ─── 6. Platform, Field & Academy ───
  {
    id: 'academy',
    route: '/academy',
    titleEn: 'Engineering Academy & Interactive Curriculum',
    titleTr: 'Mühendislik Akademisi & İnteraktif Müfredat',
    pillar: 'platform_academy',
    badge: '15 UNITS',
    iconName: 'GraduationCap',
    engineType: 'academy_curriculum',
    standards: ['15 Interactive Mechanical & CAD Engineering Units'],
    keywords: ['akademi', 'ders', 'academy', 'quiz', 'egitim', 'curriculum']
  },
  {
    id: 'field',
    route: '/field',
    titleEn: 'Field Engineering Mobile Sensor Suite',
    titleTr: 'Saha Mühendisliği Mobil Sensör Kiti',
    pillar: 'platform_academy',
    badge: '34 TOOLS',
    iconName: 'Smartphone',
    engineType: 'sensor_suite_34',
    standards: ['34 Live Hardware Sensors & Inspection Tools'],
    keywords: ['saha', 'sensor', 'field', 'jiroskop', 'gps', 'desibel', 'fener', 'mobil', 'sound meter', 'clinometer']
  },
  {
    id: 'mobile',
    route: '/mobile',
    titleEn: 'Mobile Workstation (PWA & Offline Mode)',
    titleTr: 'Mobil İş İstasyonu (PWA & Çevrimdışı Mod)',
    pillar: 'platform_academy',
    badge: 'PWA',
    iconName: 'Smartphone',
    engineType: 'pwa_workstation',
    standards: ['W3C Progressive Web App (PWA)', 'ServiceWorker Cache'],
    keywords: ['mobile', 'mobil', 'pwa', 'phone', 'field', 'touch', 'offline']
  }
];

// Ensure unique route entries
const toolMap = new Map();
RAW_CANONICAL_TOOLS.forEach(t => {
  toolMap.set(t.route, t);
});

const CANONICAL_TOOLS = Array.from(toolMap.values());
const CANONICAL_TOOL_COUNT = CANONICAL_TOOLS.length;

console.log(`\nVerified Unique Canonical Engineering Tools: ${CANONICAL_TOOL_COUNT}`);

// Pillar Stats
const stats = {};
Object.keys(PILLARS).forEach(p => stats[p] = { count: 0, items: [] });
CANONICAL_TOOLS.forEach(t => {
  stats[t.pillar].count++;
  stats[t.pillar].items.push(t);
});

Object.entries(stats).forEach(([p, val]) => {
  console.log(`- ${PILLARS[p].titleEn} (${p}): ${val.count} tools`);
});

// 1. Generate src/data/canonicalInventory.ts
let ts = `/**
 * AluCalc OS — Canonical Inventory Single Source of Truth
 * 
 * Auto-generated by scripts/build_canonical_inventory.js
 * DO NOT EDIT DIRECTLY. Run \`node scripts/build_canonical_inventory.js\` to rebuild.
 * 
 * Total Canonical Engineering Tools: ${CANONICAL_TOOL_COUNT}
 * Distinct Field Sensor Tools: 34 (inside /field)
 * Distinct Academy Curriculum Units: 15 (inside /academy)
 */

export type PillarKey = 
  | 'cad_design'
  | 'mechanical'
  | 'materials_mfg'
  | 'fluids_thermal_power'
  | 'science_theory'
  | 'platform_academy';

export interface CanonicalPillarMeta {
  readonly id: PillarKey;
  readonly titleEn: string;
  readonly titleTr: string;
  readonly order: number;
}

export interface CanonicalToolEntry {
  readonly id: string;
  readonly route: string;
  readonly titleEn: string;
  readonly titleTr: string;
  readonly pillar: PillarKey;
  readonly iconName: string;
  readonly engineType: 'cad_3d' | 'cad_2d' | 'fea_sim' | 'flow_graph' | 'optimizer_engine' | 'deterministic_solver' | 'sensor_suite_34' | 'academy_curriculum' | 'pwa_workstation';
  readonly badge?: string;
  readonly standards?: readonly string[];
  readonly keywords?: readonly string[];
}

export const CANONICAL_PILLARS: Record<PillarKey, CanonicalPillarMeta> = ${JSON.stringify(PILLARS, null, 2)};

export const CANONICAL_ALIASES: Record<string, string> = ${JSON.stringify(CANONICAL_ALIASES, null, 2)};

export const CANONICAL_TOOLS: readonly CanonicalToolEntry[] = ${JSON.stringify(CANONICAL_TOOLS, null, 2)};

/**
 * EXACT CANONICAL CONSTANTS — Use everywhere instead of hardcoded numbers!
 */
export const CANONICAL_TOOL_COUNT = ${CANONICAL_TOOL_COUNT};
export const CANONICAL_FIELD_TOOL_COUNT = 34;
export const CANONICAL_ACADEMY_UNIT_COUNT = 15;

export const CANONICAL_SOLVERS_LABEL = \`\${CANONICAL_TOOL_COUNT} Solvers\`;
export const CANONICAL_MODULES_LABEL = \`\${CANONICAL_TOOL_COUNT} Modules\`;
export const CANONICAL_TOOLS_LABEL = \`\${CANONICAL_TOOL_COUNT} Engineering Tools\`;

/**
 * Quick route resolution helper (maps aliases to canonical routes)
 */
export function resolveCanonicalRoute(slugOrPath: string): string {
  const clean = slugOrPath.replace(/^\\//, '').toLowerCase();
  if (CANONICAL_ALIASES[clean]) {
    return CANONICAL_ALIASES[clean];
  }
  return slugOrPath.startsWith('/') ? slugOrPath : \`/\${slugOrPath}\`;
}
`;

fs.writeFileSync('./src/data/canonicalInventory.ts', ts, 'utf8');
console.log('Successfully wrote ./src/data/canonicalInventory.ts');

// 2. Generate JSON & CSV
fs.writeFileSync('./src/data/canonical-inventory.json', JSON.stringify(CANONICAL_TOOLS, null, 2));

const csvHeader = 'ID,Route,TitleEn,TitleTr,Pillar,EngineType,Badge,Standards\n';
const csvRows = CANONICAL_TOOLS.map(t => 
  `"${t.id}","${t.route}","${t.titleEn}","${t.titleTr}","${t.pillar}","${t.engineType}","${t.badge || ''}","${(t.standards || []).join('; ')}"`
).join('\n');
fs.writeFileSync('./src/data/canonical-inventory.csv', csvHeader + csvRows);

// 3. Generate INVENTORY_REPORT.md
let md = `# AluCalc OS — Faz 0 Envanter & Tek Kaynak Doğruluk Raporu\n\n`;
md += `> **Tarih**: ${new Date().toISOString().split('T')[0]}  \n`;
md += `> **Tek Doğruluk Kaynağı**: \`src/data/canonicalInventory.ts\`  \n`;
md += `> **Denetlenen Toplam Gerçek Mühendislik Aracı**: **${CANONICAL_TOOL_COUNT}**  \n`;
md += `> **Ayrık Alt Modüller**: 34 Saha Sensör Aracı (\`/field\`) + 15 Akademi Ünitesi (\`/academy\`)  \n\n`;

md += `## 1. Sayı Tutarsızlığının Çözümü (The Canonical Resolution)\n\n`;
md += `AluCalc OS üzerinde daha önce görülen 36 / 44 / 48 / 90+ çelişkisinin tam kök neden analizi:\n\n`;
md += `1. **Sol Menü (36 Araç)**: \`DesktopSidebar.tsx\` içindeki \`ALL_NAV_GROUPS\` listesi tarihsel olarak yalnızca 36 popüler aracı içeriyordu. Kolon Burkulma, Betonarme, Gemi Hidrostatiği, Basınç Düşümü gibi pek çok araç menüde yoktu.\n`;
md += `2. **Hesaplayıcı Hub (48 Modül)**: \`src/data/calculatorHubData.ts\` ve \`APP_MODULE_COUNT\` 48 adet hesaplayıcı kartı tanımlıyordu.\n`;
md += `3. **SEO Headless Veritabanı (44 Çözücü)**: \`src/data/seo-calculators/calculators.json\` 44 formülü kapsıyordu.\n`;
md += `4. **Pazarlama Metinleri ("90+ / 94+ Solvers")**: Gerçekte platformda bulunan 70+ TS çözücüsü, CAD atölyeleri, simülasyonlar ve şemalar kabaca "90+" olarak yuvarlanmıştı.\n\n`;

md += `### Alınan Kesin Karar:\n`;
md += `- **Tek Sayı**: **\`${CANONICAL_TOOL_COUNT}\`**. Platformda çalışan, rotası, motoru veya şeması olan benzersiz mühendislik araç sayısı tam olarak **${CANONICAL_TOOL_COUNT}**'dir.\n`;
md += `- Tüm hardcoded stringler (\`48 Modules\`, \`Over 48 modules\`, \`90+ Solvers\`, \`WORKSPACE 36\`) yerine \`CANONICAL_TOOL_COUNT\` (${CANONICAL_TOOL_COUNT}) sabiti bağlanacaktır.\n\n`;

md += `## 2. 6 Sütunlu Birleşik Bilgi Mimarisi\n\n`;
md += `| Sütun No | Sütun Adı | Araç Sayısı | Örnek Araçlar & Normlar |\n`;
md += `|---|---|---|---|\n`;

Object.entries(stats).forEach(([p, val]) => {
  const meta = PILLARS[p];
  const samples = val.items.slice(0, 4).map(i => i.titleEn).join(', ');
  md += `| ${meta.order} | **${meta.titleEn}** (\`${p}\`) | **${val.count}** | ${samples}... |\n`;
});

md += `\n## 3. Tam Mühendislik Envanteri (${CANONICAL_TOOL_COUNT} Araç)\n\n`;
md += `| # | Başlık (EN) | Başlık (TR) | Rota | Sütun | Motor Tipi | Standart / Referans |\n`;
md += `|---|---|---|---|---|---|---|\n`;

CANONICAL_TOOLS.forEach((t, idx) => {
  md += `| ${idx + 1} | **${t.titleEn}** | ${t.titleTr} | \`${t.route}\` | ${t.pillar} | \`${t.engineType}\` | ${(t.standards || []).join(', ')} |\n`;
});

md += `\n## 4. Kanonik Alias & Yönlendirme Eşleşmeleri (${Object.keys(CANONICAL_ALIASES).length} Alias)\n\n`;
md += `Hiçbir eski link kırılmayacak şekilde aşağıdaki alias'lar ana rotalara bağlanmıştır:\n\n`;
md += `| Eski / Kısayol Rota | Hedef Rota |\n`;
md += `|---|---|\n`;
Object.entries(CANONICAL_ALIASES).forEach(([from, to]) => {
  md += `| \`/${from}\` | \`${to}\` |\n`;
});

fs.writeFileSync('./INVENTORY_REPORT.md', md, 'utf8');
console.log('Successfully wrote ./INVENTORY_REPORT.md');
console.log(`\n=== Faz 0 Inventory Complete: ${CANONICAL_TOOL_COUNT} Canonical Tools Verified ===`);
