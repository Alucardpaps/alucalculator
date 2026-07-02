/**
 * Extracts inline LOCAL_DICTS from components and emits 12-language locale bundles.
 * Run: node scripts/generate-local-dicts-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'src/locales');
const LANGS = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'ar'];

function extractLocalDicts(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const marker = 'const LOCAL_DICTS';
  const start = src.indexOf(marker);
  if (start < 0) return null;
  const eq = src.indexOf('=', start);
  const open = src.indexOf('{', eq);
  let depth = 0;
  let end = open;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  const objSrc = src.slice(open, end);
  // eslint-disable-next-line no-new-func
  return new Function(`return (${objSrc});`)();
}

function emit(typeName, getterName, EN, extracted, overlays = {}, extra = '') {
  const bundles = { en: EN };
  for (const lang of LANGS) {
    if (lang === 'en') continue;
    bundles[lang] = {
      ...EN,
      ...(extracted[lang] ?? {}),
      ...(overlays[lang] ?? {}),
    };
  }
  const typeBody = Object.keys(EN)
    .map((k) => {
      const v = EN[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const inner = Object.keys(v).map((ik) => `    ${ik}: string;`).join('\n');
        return `  ${k}: {\n${inner}\n  };`;
      }
      return `  ${k}: string;`;
    })
    .join('\n');

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

function writeBundle(name, typeName, getter, fileRel, overlays = {}, extra = '') {
  const filePath = path.join(ROOT, fileRel);
  const extracted = extractLocalDicts(filePath);
  if (!extracted?.en) {
    console.warn('Skip (no LOCAL_DICTS):', fileRel);
    return;
  }
  const content = emit(typeName, getter, extracted.en, extracted, overlays, extra);
  fs.writeFileSync(path.join(OUT, name), content, 'utf8');
  console.log('Wrote', name);
}

// ─── Planetary — extra langs not in inline dict ───────────────────────────────
const planetaryOverlay = {
  es: {
    title: 'Planetario Multietapa', subtitle: 'Inteligencia de Ingeniería • Etapas: {stagesLength}',
    systemRatio: 'Relación del Sistema', outputRpm: 'RPM de Salida', totalTorque: 'Par Total',
    systemAdvantage: 'Ventaja del Sistema', lastStageRpm: 'RPM Última Etapa', module: 'Módulo (m)',
    sunTeeth: 'Dientes Sol (zs)', ringTeeth: 'Dientes Anillo (zr)', planetCount: 'Nº Planetas',
    inputRpm: 'RPM de Entrada', inputPower: 'Potencia de Entrada', stageParams: 'Parámetros Etapa {stage}',
    fixedComponent: 'Componente Fijo', ring: 'ANILLO', sun: 'SOL', carrier: 'PORTADOR',
    characteristic: 'Característica del Sistema', infoText: 'Los cálculos multietapa asumen acoplamiento directo. El módulo (m) determina D=m*Z.',
    totalRatio: 'Relación Total', outputSpeed: 'VELOCIDAD DE SALIDA', stage: 'Etapa',
  },
  fr: {
    title: 'Planétaire Multistage', subtitle: 'Intelligence Ingénierie • Étapes: {stagesLength}',
    systemRatio: 'Rapport Système', outputRpm: 'RPM Sortie', totalTorque: 'Couple Total',
    systemAdvantage: 'Avantage Système', lastStageRpm: 'RPM Dernière Étape', module: 'Module (m)',
    sunTeeth: 'Dents Soleil (zs)', ringTeeth: 'Dents Couronne (zr)', planetCount: 'Nb Planètes',
    inputRpm: 'RPM Entrée', inputPower: 'Puissance Entrée', stageParams: 'Paramètres Étape {stage}',
    fixedComponent: 'Composant Fixe', ring: 'COURONNE', sun: 'SOLEIL', carrier: 'PORTE-PLANÈTES',
    characteristic: 'Caractéristique Système', infoText: 'Calculs multistages avec couplage direct. Module (m) détermine D=m*Z.',
    totalRatio: 'Rapport Total', outputSpeed: 'VITESSE SORTIE', stage: 'Étape',
  },
  it: {
    title: 'Planetario Multistadio', subtitle: 'Intelligenza Ingegneristica • Stadi: {stagesLength}',
    systemRatio: 'Rapporto Sistema', outputRpm: 'RPM Uscita', totalTorque: 'Coppia Totale',
    systemAdvantage: 'Vantaggio Sistema', lastStageRpm: 'RPM Ultimo Stadio', module: 'Modulo (m)',
    sunTeeth: 'Denti Sole (zs)', ringTeeth: 'Denti Corona (zr)', planetCount: 'N. Pianeti',
    inputRpm: 'RPM Ingresso', inputPower: 'Potenza Ingresso', stageParams: 'Parametri Stadio {stage}',
    fixedComponent: 'Componente Fisso', ring: 'CORONA', sun: 'SOLE', carrier: 'PORTA-PIANETI',
    characteristic: 'Caratteristica Sistema', infoText: 'Calcoli multistadio con accoppiamento diretto. Modulo (m) determina D=m*Z.',
    totalRatio: 'Rapporto Totale', outputSpeed: 'VELOCITÀ USCITA', stage: 'Stadio',
  },
  pt: {
    title: 'Planetário Multiestágio', subtitle: 'Inteligência de Engenharia • Estágios: {stagesLength}',
    systemRatio: 'Relação do Sistema', outputRpm: 'RPM Saída', totalTorque: 'Torque Total',
    systemAdvantage: 'Vantagem do Sistema', lastStageRpm: 'RPM Último Estágio', module: 'Módulo (m)',
    sunTeeth: 'Dentes Sol (zs)', ringTeeth: 'Dentes Anel (zr)', planetCount: 'Nº Planetas',
    inputRpm: 'RPM Entrada', inputPower: 'Potência Entrada', stageParams: 'Parâmetros Estágio {stage}',
    fixedComponent: 'Componente Fixo', ring: 'ANEL', sun: 'SOL', carrier: 'PORTADOR',
    characteristic: 'Característica do Sistema', infoText: 'Cálculos multiestágio assumem acoplamento direto. Módulo (m) determina D=m*Z.',
    totalRatio: 'Relação Total', outputSpeed: 'VELOCIDADE SAÍDA', stage: 'Estágio',
  },
  ru: {
    title: 'Планетарный Многоступенчатый', subtitle: 'Инженерный интеллект • Ступени: {stagesLength}',
    systemRatio: 'Передаточное Отношение', outputRpm: 'Выходные об/мин', totalTorque: 'Суммарный Момент',
    systemAdvantage: 'Преимущество Системы', lastStageRpm: 'об/мин Последней Ступени', module: 'Модуль (m)',
    sunTeeth: 'Зубья Солнца (zs)', ringTeeth: 'Зубья Кольца (zr)', planetCount: 'Число Планет',
    inputRpm: 'Входные об/мин', inputPower: 'Входная Мощность', stageParams: 'Параметры Ступени {stage}',
    fixedComponent: 'Фиксированный Элемент', ring: 'КОЛЬЦО', sun: 'СОЛНЦЕ', carrier: 'ВОДИЛО',
    characteristic: 'Характеристика Системы', infoText: 'Многоступенчатые расчёты с прямой связью. Модуль (m) определяет D=m*Z.',
    totalRatio: 'Общее Передаточное Число', outputSpeed: 'ВЫХОДНАЯ СКОРОСТЬ', stage: 'Ступень',
  },
  zh: {
    title: '行星多级传动', subtitle: '工程智能 • 级数: {stagesLength}',
    systemRatio: '系统传动比', outputRpm: '输出转速', totalTorque: '总扭矩',
    systemAdvantage: '系统优势', lastStageRpm: '末级转速', module: '模数 (m)',
    sunTeeth: '太阳轮齿数 (zs)', ringTeeth: '齿圈齿数 (zr)', planetCount: '行星轮数量',
    inputRpm: '输入转速', inputPower: '输入功率', stageParams: '第 {stage} 级参数',
    fixedComponent: '固定件', ring: '齿圈', sun: '太阳轮', carrier: '行星架',
    characteristic: '系统总特性', infoText: '多级计算假设直接耦合。模数 (m) 决定 D=m*Z。',
    totalRatio: '总传动比', outputSpeed: '输出速度', stage: '级',
  },
  ko: {
    title: '행성 다단 기어', subtitle: '엔지니어링 인텔리전스 • 단수: {stagesLength}',
    systemRatio: '시스템 기어비', outputRpm: '출력 RPM', totalTorque: '총 토크',
    systemAdvantage: '시스템 이점', lastStageRpm: '최종 단 RPM', module: '모듈 (m)',
    sunTeeth: '태양 기어 잇수 (zs)', ringTeeth: '링 기어 잇수 (zr)', planetCount: '행성 기어 수',
    inputRpm: '입력 RPM', inputPower: '입력 전력', stageParams: '단계 {stage} 매개변수',
    fixedComponent: '고정 부품', ring: '링', sun: '태양', carrier: '캐리어',
    characteristic: '시스템 특성', infoText: '다단 계산은 직접 결합을 가정합니다. 모듈 (m)이 D=m*Z를 결정합니다.',
    totalRatio: '총 기어비', outputSpeed: '출력 속도', stage: '단계',
  },
  ar: {
    title: 'تروس كوكبية متعددة المراحل', subtitle: 'ذكاء هندسي • المراحل: {stagesLength}',
    systemRatio: 'نسبة النظام', outputRpm: 'دورة الخرج', totalTorque: 'عزم الدوران الكلي',
    systemAdvantage: 'ميزة النظام', lastStageRpm: 'دورة المرحلة الأخيرة', module: 'الوحدة (m)',
    sunTeeth: 'أسنان الشمس (zs)', ringTeeth: 'أسنان الحلقة (zr)', planetCount: 'عدد الكواكب',
    inputRpm: 'دورة الدخل', inputPower: 'قدرة الدخل', stageParams: 'معاملات المرحلة {stage}',
    fixedComponent: 'المكون الثابت', ring: 'الحلقة', sun: 'الشمس', carrier: 'الحامل',
    characteristic: 'خصائص النظام', infoText: 'حسابات متعددة المراحل تفترض اقترانًا مباشرًا. الوحدة (m) تحدد D=m*Z.',
    totalRatio: 'النسبة الكلية', outputSpeed: 'سرعة الخرج', stage: 'مرحلة',
  },
};

writeBundle(
  'planetaryCalculatorTranslations.ts',
  'PlanetaryCalculatorStrings',
  'getPlanetaryCalculatorStrings',
  'src/components/calculators/PlanetaryCalculator.tsx',
  planetaryOverlay,
);

// Physics, DigitalLogic, RealTimeCost, SimulationFEA — extract + DE-based EU fallback for missing
for (const [name, type, getter, file] of [
  ['physicsKinematicsTranslations.ts', 'PhysicsKinematicsStrings', 'getPhysicsKinematicsStrings', 'src/modules/science/PhysicsKinematics/index.tsx'],
  ['digitalLogicTranslations.ts', 'DigitalLogicStrings', 'getDigitalLogicStrings', 'src/modules/automation/DigitalLogic/index.tsx'],
  ['realTimeCostTranslations.ts', 'RealTimeCostStrings', 'getRealTimeCostStrings', 'src/modules/finance/RealTimeCost/index.tsx'],
  ['simulationFeaTranslations.ts', 'SimulationFeaStrings', 'getSimulationFeaStrings', 'src/components/modules/mechanical/SimulationFEAModule.tsx'],
  ['machiningDetailsTranslations.ts', 'MachiningDetailsStrings', 'getMachiningDetailsStrings', 'src/components/modules/mechanical/MachiningDetailsModule.tsx'],
  ['bearingsModuleUiTranslations.ts', 'BearingsModuleUiStrings', 'getBearingsModuleUiStrings', 'src/components/modules/mechanical/BearingsModule.tsx'],
  ['fastenersModuleUiTranslations.ts', 'FastenersModuleUiStrings', 'getFastenersModuleUiStrings', 'src/components/modules/mechanical/FastenersModule.tsx'],
]) {
  const extracted = extractLocalDicts(path.join(ROOT, file));
  if (!extracted?.en) {
    console.warn('Skip:', file);
    continue;
  }
  const overlays = {};
  for (const lang of ['es', 'fr', 'it', 'pt', 'ru', 'zh', 'ko', 'ar']) {
    if (!extracted[lang]) {
      overlays[lang] = extracted.de ?? extracted.en;
    }
  }
  const content = emit(type, getter, extracted.en, extracted, overlays);
  fs.writeFileSync(path.join(OUT, name), content, 'utf8');
  console.log('Wrote', name);
}

// Fastener assembly — merge warning keys from legacy bundle
const FA_EXTRA_EN = {
  highStressWarning: 'High Preload Stress Warning',
  yieldExceeded: 'Yield capacity exceeded!',
  safeUtilization: 'Safe utilization limits',
  chartsAnalytics: 'Charts & Analytics',
  hdBlueprint: 'HD Technical Blueprint',
};
const FA_EXTRA_LOCALES = {
  tr: { highStressWarning: 'Aşırı Gerilme Uyarısı', yieldExceeded: 'Akma sınırı aşıldı!', safeUtilization: 'Akma sınırı güvenli bölgede', chartsAnalytics: 'Grafikler ve Analiz', hdBlueprint: 'HD Teknik Resim (PDF)' },
  de: { highStressWarning: 'Warnung: Hohe Vorspannspannung', yieldExceeded: 'Streckgrenze überschritten!', safeUtilization: 'Sichere Ausnutzungsgrenzen', chartsAnalytics: 'Diagramme & Analyse', hdBlueprint: 'HD Technische Zeichnung' },
  ja: { highStressWarning: '高プリロード応力警告', yieldExceeded: '降伏容量を超過！', safeUtilization: '安全な利用率範囲内', chartsAnalytics: 'グラフと分析', hdBlueprint: 'HD技術図面 (PDF)' },
  es: { highStressWarning: 'Advertencia de Precarga Alta', yieldExceeded: '¡Capacidad de fluencia excedida!', safeUtilization: 'Límites de utilización seguros', chartsAnalytics: 'Gráficos y Análisis', hdBlueprint: 'Plano Técnico HD' },
  fr: { highStressWarning: 'Avertissement Précharge Élevée', yieldExceeded: 'Limite élastique dépassée !', safeUtilization: 'Limites d\'utilisation sûres', chartsAnalytics: 'Graphiques & Analytique', hdBlueprint: 'Plan Technique HD' },
  it: { highStressWarning: 'Avviso Precarico Elevato', yieldExceeded: 'Capacità di snervamento superata!', safeUtilization: 'Limiti di utilizzo sicuri', chartsAnalytics: 'Grafici e Analisi', hdBlueprint: 'Blueprint Tecnico HD' },
  pt: { highStressWarning: 'Aviso de Pré-carga Elevada', yieldExceeded: 'Capacidade de escoamento excedida!', safeUtilization: 'Limites de utilização seguros', chartsAnalytics: 'Gráficos e Análise', hdBlueprint: 'Desenho Técnico HD' },
  ru: { highStressWarning: 'Предупреждение о Преднагрузке', yieldExceeded: 'Предел текучести превышен!', safeUtilization: 'Безопасные пределы использования', chartsAnalytics: 'Графики и Аналитика', hdBlueprint: 'HD Технический Чертёж' },
  zh: { highStressWarning: '高预紧应力警告', yieldExceeded: '已超过屈服容量！', safeUtilization: '安全利用率范围内', chartsAnalytics: '图表与分析', hdBlueprint: '高清技术蓝图 (PDF)' },
  ko: { highStressWarning: '높은 예압 응력 경고', yieldExceeded: '항복 용량 초과!', safeUtilization: '안전한 이용률 한계', chartsAnalytics: '차트 및 분석', hdBlueprint: 'HD 기술 도면 (PDF)' },
  ar: { highStressWarning: 'تحذير إجهاد التحميل المسبق', yieldExceeded: 'تم تجاوز سعة الخضوع!', safeUtilization: 'حدود استخدام آمنة', chartsAnalytics: 'الرسوم البيانية والتحليل', hdBlueprint: 'مخطط تقني عالي الدقة' },
};

function parseBundleConst(src, constName) {
  const marker = `const ${constName}: FastenerAssemblyStrings = `;
  const start = src.indexOf(marker);
  if (start < 0) return null;
  const open = src.indexOf('{', start);
  let depth = 0;
  let end = open;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  // eslint-disable-next-line no-new-func
  return new Function(`return (${src.slice(open, end)});`)();
}

function loadFastenerAssemblyExtracted() {
  const existing = path.join(OUT, 'fastenerAssemblyUiTranslations.ts');
  if (!fs.existsSync(existing)) return null;
  const src = fs.readFileSync(existing, 'utf8');
  const out = {};
  const map = { en: 'EN', tr: 'TR', de: 'DE', es: 'ES', fr: 'FR', it: 'IT', pt: 'PT', ru: 'RU', ja: 'JA', zh: 'ZH', ko: 'KO', ar: 'AR' };
  for (const [lang, constName] of Object.entries(map)) {
    const parsed = parseBundleConst(src, constName);
    if (parsed) out[lang] = parsed;
  }
  return out.en ? out : null;
}

const faExtracted = loadFastenerAssemblyExtracted();
if (faExtracted?.en) {
  faExtracted.en = { ...faExtracted.en, ...FA_EXTRA_EN };
  for (const lang of LANGS) {
    if (lang === 'en') continue;
    faExtracted[lang] = { ...(faExtracted[lang] ?? faExtracted.en), ...(FA_EXTRA_LOCALES[lang] ?? {}) };
  }
}
const faOverlays = {};
const faExtra = `
export function formatIntegrityPassDesc(s: FastenerAssemblyStrings, preload: number, utilization: number): string {
  return s.integrityPassDesc.replace('{preload}', String(preload)).replace('{utilization}', String(utilization));
}
`;
const faContent = faExtracted?.en ? emit(
  'FastenerAssemblyStrings',
  'getFastenerAssemblyStrings',
  faExtracted.en,
  faExtracted,
  faOverlays,
  faExtra,
) : null;
if (faContent) {
  fs.writeFileSync(path.join(OUT, 'fastenerAssemblyUiTranslations.ts'), faContent, 'utf8');
  console.log('Wrote fastenerAssemblyUiTranslations.ts');
}

// Copilot module labels for all routes
const routesSrc = fs.readFileSync(path.join(ROOT, 'src/engine/copilot/module-routes.ts'), 'utf8');
const routeBlocks = [...routesSrc.matchAll(/route:\s*'([^']+)'[\s\S]*?en:\s*\{\s*label:\s*'([^']+)'/g)];
const OPEN = {
  de: 'Öffnen', es: 'Abrir', fr: 'Ouvrir', it: 'Apri', pt: 'Abrir', ru: 'Открыть',
  ja: '開く', zh: '打开', ko: '열기', ar: 'فتح', tr: 'Aç',
};
function labelFor(lang, enLabel) {
  if (lang === 'en') return enLabel;
  const m = routeBlocks.find(([, , label]) => label === enLabel);
  if (!m) return enLabel;
  const route = m[1];
  const trMatch = routesSrc.match(new RegExp(`route:\\s*'${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[\\s\\S]*?tr:\\s*\\{\\s*label:\\s*'([^']+)'`));
  if (lang === 'tr' && trMatch) return trMatch[1];
  if (enLabel.startsWith('Open ')) {
    const rest = enLabel.slice(5);
    return `${OPEN[lang] ?? 'Open'} ${rest}`;
  }
  return enLabel;
}
const labels = {};
for (const [, route, enLabel] of routeBlocks) {
  labels[route] = {};
  for (const lang of LANGS) {
    labels[route][lang] = labelFor(lang, enLabel);
  }
}
fs.writeFileSync(
  path.join(OUT, 'copilotModuleLabels.ts'),
  `import type { Language } from '@/store/i18nStore';

export const COPILOT_MODULE_LABELS: Record<string, Partial<Record<Language, string>>> = ${JSON.stringify(labels, null, 2)};

export function getCopilotModuleLabel(route: string, locale: string, fallback: string): string {
  return COPILOT_MODULE_LABELS[route]?.[locale as Language] ?? fallback;
}
`,
  'utf8',
);
console.log('Wrote copilotModuleLabels.ts');
