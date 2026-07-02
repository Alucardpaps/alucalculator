/**
 * Generates remaining module locale TS bundles (12 languages).
 * Run: node scripts/generate-remaining-modules-i18n.mjs
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

const mk = (tr, de, es, fr, it, pt, ru, ja, zh, ko, ar) => ({ tr, de, es, fr, it, pt, ru, ja, zh, ko, ar });

// ─── Welding ──────────────────────────────────────────────────────────────────
const WELD_EN = {
  processJoint: 'Process & Joint', electrode: 'Electrode', powerParams: 'Power Parameters',
  weldGeometry: 'Weld Geometry', weldSafe: 'WELD DESIGN — SAFE', weldWarning: 'WARNING: INSUFFICIENT SAFETY',
  safetyFactor: 'Safety Factor', minLeg: 'Min Leg', filler: 'Filler', preheat: 'Preheat', weldPreview: 'WELD JOINT PREVIEW',
};
const WELD_TR = {
  processJoint: 'Yöntem & Birleştirme', electrode: 'Elektrot', powerParams: 'Güç Parametreleri',
  weldGeometry: 'Kaynak Geometrisi', weldSafe: 'KAYNAK BAĞLANTISI — GÜVENLİ', weldWarning: 'UYARI: YETERSİZ GÜVENLİK',
  safetyFactor: 'Güvenlik Faktörü', minLeg: 'Min Dikiş', filler: 'İlave Metal', preheat: 'Ön Isıtma', weldPreview: 'KAYNAK BAĞLANTISI ÖNİZLEMESİ',
};
const WELD_DE = {
  processJoint: 'Verfahren & Naht', electrode: 'Elektrode', powerParams: 'Leistungsparameter',
  weldGeometry: 'Schweißnahtgeometrie', weldSafe: 'SCHWEISSNAHT — SICHER', weldWarning: 'WARNUNG: UNZUREICHENDE SICHERHEIT',
  safetyFactor: 'Sicherheitsfaktor', minLeg: 'Min. Kehlhöhe', filler: 'Zusatzwerkstoff', preheat: 'Vorwärmen', weldPreview: 'SCHWEISSNAHT-VORSCHAU',
};
write('weldingModuleTranslations.ts', 'WeldingModuleStrings', 'getWeldingModuleStrings', WELD_EN,
  mk(WELD_TR, WELD_DE,
    { processJoint: 'Proceso y Junta', electrode: 'Electrodo', powerParams: 'Parámetros de Potencia', weldGeometry: 'Geometría de Soldadura', weldSafe: 'DISEÑO DE SOLDADURA — SEGURO', weldWarning: 'ADVERTENCIA: SEGURIDAD INSUFICIENTE', safetyFactor: 'Factor de Seguridad', minLeg: 'Pierna Mín', filler: 'Aporte', preheat: 'Precalentamiento', weldPreview: 'VISTA PREVIA DE JUNTA' },
    { processJoint: 'Procédé et Joint', electrode: 'Électrode', powerParams: 'Paramètres de Puissance', weldGeometry: 'Géométrie de Soudure', weldSafe: 'SOUDURE — SÛRE', weldWarning: 'AVERTISSEMENT: SÉCURITÉ INSUFFISANTE', safetyFactor: 'Facteur de Sécurité', minLeg: 'Gorge Min', filler: 'Apport', preheat: 'Préchauffage', weldPreview: 'APERÇU DE JOINT' },
    { processJoint: 'Processo e Giunto', electrode: 'Elettrodo', powerParams: 'Parametri di Potenza', weldGeometry: 'Geometria Saldatura', weldSafe: 'SALDATURA — SICURA', weldWarning: 'AVVISO: SICUREZZA INSUFFICIENTE', safetyFactor: 'Fattore di Sicurezza', minLeg: 'Gola Min', filler: 'Apporto', preheat: 'Preriscaldamento', weldPreview: 'ANTEPRIMA GIUNTO' },
    { processJoint: 'Processo e Junta', electrode: 'Eletrodo', powerParams: 'Parâmetros de Potência', weldGeometry: 'Geometria de Solda', weldSafe: 'SOLDA — SEGURA', weldWarning: 'AVISO: SEGURANÇA INSUFICIENTE', safetyFactor: 'Fator de Segurança', minLeg: 'Gargalo Mín', filler: 'Metal de Aporte', preheat: 'Pré-aquecimento', weldPreview: 'PRÉ-VISUALIZAÇÃO DA JUNTA' },
    { processJoint: 'Процесс и Шов', electrode: 'Электрод', powerParams: 'Параметры Мощности', weldGeometry: 'Геометрия Шва', weldSafe: 'ШОВ — БЕЗОПАСНО', weldWarning: 'ПРЕДУПРЕЖДЕНИЕ: НЕДОСТАТОЧНАЯ БЕЗОПАСНОСТЬ', safetyFactor: 'Запас Прочности', minLeg: 'Мин. Катет', filler: 'Присадка', preheat: 'Подогрев', weldPreview: 'ПРЕДПРОСМОТР ШВА' },
    { processJoint: '溶接法 & 継手形状', electrode: '溶接棒', powerParams: '電気パラメータ', weldGeometry: '溶接部形状', weldSafe: '溶接部設計 — 安全領域', weldWarning: '警告: 強度不足', safetyFactor: '安全率', minLeg: '最小脚長', filler: '溶加材', preheat: '予熱', weldPreview: '溶接断面ビジュアライザ' },
    { processJoint: '工艺与接头', electrode: '焊条', powerParams: '功率参数', weldGeometry: '焊缝几何', weldSafe: '焊缝设计 — 安全', weldWarning: '警告：安全系数不足', safetyFactor: '安全系数', minLeg: '最小焊脚', filler: '填充金属', preheat: '预热', weldPreview: '焊缝接头预览' },
    { processJoint: '공정 및 이음', electrode: '전극', powerParams: '전력 매개변수', weldGeometry: '용접 형상', weldSafe: '용접 설계 — 안전', weldWarning: '경고: 안전 계수 부족', safetyFactor: '안전 계수', minLeg: '최소 각장', filler: '용가재', preheat: '예열', weldPreview: '용접 이음 미리보기' },
    { processJoint: 'العملية والوصلة', electrode: 'القطب', powerParams: 'معاملات القدرة', weldGeometry: 'هندسة اللحام', weldSafe: 'تصميم اللحام — آمن', weldWarning: 'تحذير: أمان غير كافٍ', safetyFactor: 'عامل الأمان', minLeg: 'الساق الأدنى', filler: 'مادة الإضافة', preheat: 'التسخين المسبق', weldPreview: 'معاينة وصلة اللحام' },
  ));

// ─── Gearbox ──────────────────────────────────────────────────────────────────
const GB_EN = {
  ratioEngine: 'Gearbox Ratio Engine', multiStage: 'Multi-Stage Transmission Synthesis', totalRatio: 'Total Global Ratio',
  motorParams: 'Motor Parameters', motorPower: 'Motor Power (P)', motorSpeed: 'Motor Speed (n1)', initialTorque: 'Initial Torque',
  outputMetrics: 'Output Shaft Metrics', finalRpm: 'Final RPM', finalTorque: 'Final Torque', globalEfficiency: 'Global Efficiency',
  transmissionCascade: 'Transmission Cascade', stage: 'Stage', pinion: 'Pinion (Z1)', gear: 'Gear (Z2)', efficiency: 'Efficiency (0.1 - 1.0)',
  ratio: 'Ratio', outRpm: 'Out RPM', outNm: 'Out Nm',
};
const GB_TR = {
  ratioEngine: 'Şanzıman Oranı Motoru', multiStage: 'Çok Kademeli Transmisyon Sentezi', totalRatio: 'Toplam Genel Oran',
  motorParams: 'Motor Parametreleri', motorPower: 'Motor Gücü (P)', motorSpeed: 'Motor Devri (n1)', initialTorque: 'Giriş Torku',
  outputMetrics: 'Çıkış Mili Değerleri', finalRpm: 'Çıkış Devri', finalTorque: 'Çıkış Torku', globalEfficiency: 'Toplam Verim',
  transmissionCascade: 'Aktarım Kademeleri', stage: 'Kademe', pinion: 'Pinyon (Z1)', gear: 'Çark (Z2)', efficiency: 'Verim (0.1 - 1.0)',
  ratio: 'Oran', outRpm: 'Çıkış Devri', outNm: 'Çıkış Torku',
};
const GB_DE = {
  ratioEngine: 'Getriebeübersetzungs-Engine', multiStage: 'Mehrstufige Getriebesynthese', totalRatio: 'Gesamtübersetzung',
  motorParams: 'Motorparameter', motorPower: 'Motorleistung (P)', motorSpeed: 'Motordrehzahl (n1)', initialTorque: 'Anfangsdrehmoment',
  outputMetrics: 'Abtriebswellen-Kennwerte', finalRpm: 'Enddrehzahl', finalTorque: 'Enddrehmoment', globalEfficiency: 'Gesamtwirkungsgrad',
  transmissionCascade: 'Übersetzungskaskade', stage: 'Stufe', pinion: 'Ritzel (Z1)', gear: 'Rad (Z2)', efficiency: 'Wirkungsgrad (0.1 - 1.0)',
  ratio: 'Übersetzung', outRpm: 'Abtriebsdrehzahl', outNm: 'Abtriebsdrehmoment',
};
const gbExtra = `
export function formatGearboxStage(s: GearboxModuleStrings, n: number): string {
  return s.stage + ' ' + n;
}
`;
write('gearboxModuleTranslations.ts', 'GearboxModuleStrings', 'getGearboxModuleStrings', GB_EN,
  mk(GB_TR, GB_DE,
    { ratioEngine: 'Motor de Relación de Caja', multiStage: 'Síntesis Multi-Etapa', totalRatio: 'Relación Global Total', motorParams: 'Parámetros del Motor', motorPower: 'Potencia (P)', motorSpeed: 'Velocidad (n1)', initialTorque: 'Par Inicial', outputMetrics: 'Métricas del Eje de Salida', finalRpm: 'RPM Final', finalTorque: 'Par Final', globalEfficiency: 'Eficiencia Global', transmissionCascade: 'Cascada de Transmisión', stage: 'Etapa', pinion: 'Piñón (Z1)', gear: 'Engranaje (Z2)', efficiency: 'Eficiencia (0.1 - 1.0)', ratio: 'Relación', outRpm: 'RPM Salida', outNm: 'Nm Salida' },
    { ratioEngine: 'Moteur de Rapport Boîte', multiStage: 'Synthèse Multi-Étages', totalRatio: 'Rapport Global Total', motorParams: 'Paramètres Moteur', motorPower: 'Puissance (P)', motorSpeed: 'Vitesse (n1)', initialTorque: 'Couple Initial', outputMetrics: 'Métriques Arbre Sortie', finalRpm: 'RPM Final', finalTorque: 'Couple Final', globalEfficiency: 'Rendement Global', transmissionCascade: 'Cascade Transmission', stage: 'Étape', pinion: 'Pignon (Z1)', gear: 'Roue (Z2)', efficiency: 'Rendement (0.1 - 1.0)', ratio: 'Rapport', outRpm: 'RPM Sortie', outNm: 'Nm Sortie' },
    { ratioEngine: 'Motore Rapporto Riduttore', multiStage: 'Sintesi Multi-Stadio', totalRatio: 'Rapporto Globale Totale', motorParams: 'Parametri Motore', motorPower: 'Potenza (P)', motorSpeed: 'Velocità (n1)', initialTorque: 'Coppia Iniziale', outputMetrics: 'Metriche Albero Uscita', finalRpm: 'RPM Finale', finalTorque: 'Coppia Finale', globalEfficiency: 'Efficienza Globale', transmissionCascade: 'Cascata Trasmissione', stage: 'Stadio', pinion: 'Pignone (Z1)', gear: 'Ruota (Z2)', efficiency: 'Efficienza (0.1 - 1.0)', ratio: 'Rapporto', outRpm: 'RPM Uscita', outNm: 'Nm Uscita' },
    { ratioEngine: 'Motor de Relação', multiStage: 'Síntese Multi-Estágio', totalRatio: 'Relação Global Total', motorParams: 'Parâmetros do Motor', motorPower: 'Potência (P)', motorSpeed: 'Velocidade (n1)', initialTorque: 'Torque Inicial', outputMetrics: 'Métricas do Eixo de Saída', finalRpm: 'RPM Final', finalTorque: 'Torque Final', globalEfficiency: 'Eficiência Global', transmissionCascade: 'Cascata de Transmissão', stage: 'Estágio', pinion: 'Pinhão (Z1)', gear: 'Coroa (Z2)', efficiency: 'Eficiência (0.1 - 1.0)', ratio: 'Relação', outRpm: 'RPM Saída', outNm: 'Nm Saída' },
    { ratioEngine: 'Движок Передаточного Числа', multiStage: 'Многоступенчатый Синтез', totalRatio: 'Общее Передаточное Число', motorParams: 'Параметры Двигателя', motorPower: 'Мощность (P)', motorSpeed: 'Скорость (n1)', initialTorque: 'Начальный Момент', outputMetrics: 'Параметры Выходного Вала', finalRpm: 'Конечные об/мин', finalTorque: 'Конечный Момент', globalEfficiency: 'Общий КПД', transmissionCascade: 'Каскад Передачи', stage: 'Ступень', pinion: 'Шестерня (Z1)', gear: 'Колесо (Z2)', efficiency: 'КПД (0.1 - 1.0)', ratio: 'Передаточное Число', outRpm: 'об/мин вых.', outNm: 'Нм вых.' },
    { ratioEngine: 'ギアボックス比率エンジン', multiStage: '多段変速機設計', totalRatio: '総減速比', motorParams: 'モーター仕様', motorPower: 'モーター出力 (P)', motorSpeed: 'モーター回転数 (n1)', initialTorque: '初期トルク', outputMetrics: '出力軸特性', finalRpm: '最終回転数', finalTorque: '最終トルク', globalEfficiency: '総合効率', transmissionCascade: 'トランスミッション列', stage: '段', pinion: 'ピニオン (Z1)', gear: 'ギヤ (Z2)', efficiency: '効率 (0.1 - 1.0)', ratio: 'ギヤ比', outRpm: '出力回転数', outNm: '出力トルク' },
    { ratioEngine: '齿轮箱传动比引擎', multiStage: '多级传动综合', totalRatio: '总传动比', motorParams: '电机参数', motorPower: '电机功率 (P)', motorSpeed: '电机转速 (n1)', initialTorque: '输入扭矩', outputMetrics: '输出轴指标', finalRpm: '最终转速', finalTorque: '最终扭矩', globalEfficiency: '总效率', transmissionCascade: '传动级联', stage: '级', pinion: '小齿轮 (Z1)', gear: '大齿轮 (Z2)', efficiency: '效率 (0.1 - 1.0)', ratio: '传动比', outRpm: '输出转速', outNm: '输出扭矩' },
    { ratioEngine: '기어박스 비율 엔진', multiStage: '다단 변속 합성', totalRatio: '총 감속비', motorParams: '모터 매개변수', motorPower: '모터 출력 (P)', motorSpeed: '모터 속도 (n1)', initialTorque: '초기 토크', outputMetrics: '출력축 지표', finalRpm: '최종 RPM', finalTorque: '최종 토크', globalEfficiency: '전체 효율', transmissionCascade: '변속 캐스케이드', stage: '단계', pinion: '피니언 (Z1)', gear: '기어 (Z2)', efficiency: '효율 (0.1 - 1.0)', ratio: '비율', outRpm: '출력 RPM', outNm: '출력 Nm' },
    { ratioEngine: 'محرك نسبة علبة التروس', multiStage: 'توليف متعدد المراحل', totalRatio: 'النسبة الإجمالية', motorParams: 'معاملات المحرك', motorPower: 'قدرة المحرك (P)', motorSpeed: 'سرعة المحرك (n1)', initialTorque: 'عزم الدوران الأولي', outputMetrics: 'مقاييس عمود الخرج', finalRpm: 'دورة/دقيقة نهائية', finalTorque: 'عزم نهائي', globalEfficiency: 'الكفاءة الإجمالية', transmissionCascade: 'تسلسل النقل', stage: 'مرحلة', pinion: 'ترس صغير (Z1)', gear: 'ترس (Z2)', efficiency: 'الكفاءة (0.1 - 1.0)', ratio: 'النسبة', outRpm: 'RPM خرج', outNm: 'Nm خرج' },
  ), gbExtra);

// ─── Fatigue ──────────────────────────────────────────────────────────────────
const FAT_EN = {
  fatigueLife: 'Fatigue Life', enduranceAnalysis: 'Endurance Limit Analysis', materialLoad: 'Material & Load Setup',
  ultimateTensile: 'Ultimate Tensile (S_ut)', yieldStrength: 'Yield Strength (S_y)', altStress: 'Alternating Stress (σ_a)',
  meanStress: 'Mean Stress (σ_m)', marinFactors: 'Marin Factors (k_a, k_b, k_c)', surfaceKa: 'Surface (k_a)', sizeKb: 'Size (k_b)', loadKc: 'Load (k_c)',
  infiniteLife: 'INFINITE LIFE CONFIRMED', fatigueWarning: 'WARNING: FATIGUE FAILURE PREDICTED',
  overallFos: 'Overall Factor of Safety (min)', enduranceLimit: 'Endurance Limit (Se)',
  goodmanDiagram: 'LIVE MODIFIED GOODMAN DIAGRAM', loadPoint: 'Load', envelopeExceeded: 'Fatigue Envelope Exceeded',
  envelopeExceededDesc: 'Operating stress combination lies outside the Goodman/Langer safe zone. Infinite life cannot be guaranteed.',
};
const FAT_TR = {
  fatigueLife: 'Yorulma Ömrü', enduranceAnalysis: 'Yorulma Limiti Analizi', materialLoad: 'Malzeme & Yük Ayarları',
  ultimateTensile: 'Çekme Mukavemeti (S_ut)', yieldStrength: 'Akma Mukavemeti (S_y)', altStress: 'Genlik Gerilmesi (σ_a)',
  meanStress: 'Ortalama Gerilme (σ_m)', marinFactors: 'Marin Düzeltme Katsayıları', surfaceKa: 'Yüzey Faktörü (k_a)', sizeKb: 'Boyut Faktörü (k_b)', loadKc: 'Yük Faktörü (k_c)',
  infiniteLife: 'SONSUZ ÖMÜR ONAYLANDI', fatigueWarning: 'UYARI: YORULMA HASARI BEKLENİYOR',
  overallFos: 'Genel Güvenlik Faktörü (En Düşük)', enduranceLimit: 'Yorulma Sınırı (Se)',
  goodmanDiagram: 'ANLIK MODİFİYE GOODMAN DİYAGRAMI', loadPoint: 'Yük', envelopeExceeded: 'Yorulma Sınırı Aşıldı',
  envelopeExceededDesc: 'Çalışma gerilme kombinasyonu Goodman/Langer güvenli bölgesinin dışındadır. Sonsuz ömür garanti edilemez.',
};
const FAT_DE = {
  fatigueLife: 'Ermüdungslebensdauer', enduranceAnalysis: 'Dauerfestigkeitsanalyse', materialLoad: 'Material & Lastaufbau',
  ultimateTensile: 'Zugfestigkeit (S_ut)', yieldStrength: 'Streckgrenze (S_y)', altStress: 'Wechselspannung (σ_a)',
  meanStress: 'Mittelspannung (σ_m)', marinFactors: 'Marin-Faktoren (k_a, k_b, k_c)', surfaceKa: 'Oberfläche (k_a)', sizeKb: 'Größe (k_b)', loadKc: 'Last (k_c)',
  infiniteLife: 'UNENDLICHE LEBENSDAUER BESTÄTIGT', fatigueWarning: 'WARNUNG: ERMÜDUNGSBRUCH ERWARTET',
  overallFos: 'Gesamtsicherheitsfaktor (min)', enduranceLimit: 'Dauerfestigkeit (Se)',
  goodmanDiagram: 'MODIFIZIERTES GOODMAN-DIAGRAMM (LIVE)', loadPoint: 'Last', envelopeExceeded: 'Ermüdungsgrenze überschritten',
  envelopeExceededDesc: 'Die Betriebsspannungskombination liegt außerhalb der Goodman/Langer-Sicherheitszone. Unendliche Lebensdauer kann nicht garantiert werden.',
};
write('fatigueModuleTranslations.ts', 'FatigueModuleStrings', 'getFatigueModuleStrings', FAT_EN,
  mk(FAT_TR, FAT_DE,
    { fatigueLife: 'Vida a Fatiga', enduranceAnalysis: 'Análisis de Límite de Resistencia', materialLoad: 'Material y Carga', ultimateTensile: 'Resistencia Última (S_ut)', yieldStrength: 'Límite Elástico (S_y)', altStress: 'Esfuerzo Alternante (σ_a)', meanStress: 'Esfuerzo Medio (σ_m)', marinFactors: 'Factores Marin', surfaceKa: 'Superficie (k_a)', sizeKb: 'Tamaño (k_b)', loadKc: 'Carga (k_c)', infiniteLife: 'VIDA INFINITA CONFIRMADA', fatigueWarning: 'ADVERTENCIA: FALLO POR FATIGA', overallFos: 'Factor de Seguridad Global (mín)', enduranceLimit: 'Límite de Resistencia (Se)', goodmanDiagram: 'DIAGRAMA DE GOODMAN EN VIVO', loadPoint: 'Carga', envelopeExceeded: 'Envolvente de Fatiga Excedida', envelopeExceededDesc: 'La combinación de esfuerzos está fuera de la zona segura Goodman/Langer.' },
    { fatigueLife: 'Durée de Fatigue', enduranceAnalysis: 'Analyse Limite d\'Endurance', materialLoad: 'Matériau & Charge', ultimateTensile: 'Résistance Ultime (S_ut)', yieldStrength: 'Limite Élastique (S_y)', altStress: 'Contrainte Alternée (σ_a)', meanStress: 'Contrainte Moyenne (σ_m)', marinFactors: 'Facteurs Marin', surfaceKa: 'Surface (k_a)', sizeKb: 'Taille (k_b)', loadKc: 'Charge (k_c)', infiniteLife: 'DURÉE INFINIE CONFIRMÉE', fatigueWarning: 'AVERTISSEMENT: RUPTURE PAR FATIGUE', overallFos: 'Facteur de Sécurité Global (min)', enduranceLimit: 'Limite d\'Endurance (Se)', goodmanDiagram: 'DIAGRAMME DE GOODMAN EN DIRECT', loadPoint: 'Charge', envelopeExceeded: 'Enveloppe de Fatigue Dépassée', envelopeExceededDesc: 'La combinaison de contraintes est hors de la zone sûre Goodman/Langer.' },
    { fatigueLife: 'Vita a Fatica', enduranceAnalysis: 'Analisi Limite di Fatica', materialLoad: 'Materiale e Carico', ultimateTensile: 'Resistenza a Trazione (S_ut)', yieldStrength: 'Snervamento (S_y)', altStress: 'Tensione Alternata (σ_a)', meanStress: 'Tensione Media (σ_m)', marinFactors: 'Fattori Marin', surfaceKa: 'Superficie (k_a)', sizeKb: 'Dimensione (k_b)', loadKc: 'Carico (k_c)', infiniteLife: 'VITA INFINITA CONFERMATA', fatigueWarning: 'AVVISO: ROTTURA A FATICA', overallFos: 'Fattore di Sicurezza Globale (min)', enduranceLimit: 'Limite di Fatica (Se)', goodmanDiagram: 'DIAGRAMMA GOODMAN IN TEMPO REALE', loadPoint: 'Carico', envelopeExceeded: 'Inviluppo Fatica Superato', envelopeExceededDesc: 'La combinazione di sollecitazioni è fuori dalla zona sicura Goodman/Langer.' },
    { fatigueLife: 'Vida à Fadiga', enduranceAnalysis: 'Análise de Limite de Resistência', materialLoad: 'Material e Carga', ultimateTensile: 'Resistência à Tração (S_ut)', yieldStrength: 'Tensão de Escoamento (S_y)', altStress: 'Tensão Alternada (σ_a)', meanStress: 'Tensão Média (σ_m)', marinFactors: 'Fatores Marin', surfaceKa: 'Superfície (k_a)', sizeKb: 'Tamanho (k_b)', loadKc: 'Carga (k_c)', infiniteLife: 'VIDA INFINITA CONFIRMADA', fatigueWarning: 'AVISO: FALHA POR FADIGA', overallFos: 'Fator de Segurança Global (mín)', enduranceLimit: 'Limite de Resistência (Se)', goodmanDiagram: 'DIAGRAMA DE GOODMAN AO VIVO', loadPoint: 'Carga', envelopeExceeded: 'Envelope de Fadiga Excedido', envelopeExceededDesc: 'A combinação de tensões está fora da zona segura Goodman/Langer.' },
    { fatigueLife: 'Усталостный Ресурс', enduranceAnalysis: 'Анализ Предела Выносливости', materialLoad: 'Материал и Нагрузка', ultimateTensile: 'Предел Прочности (S_ut)', yieldStrength: 'Предел Текучести (S_y)', altStress: 'Амплитуда Напряжения (σ_a)', meanStress: 'Среднее Напряжение (σ_m)', marinFactors: 'Коэффициенты Марина', surfaceKa: 'Поверхность (k_a)', sizeKb: 'Размер (k_b)', loadKc: 'Нагрузка (k_c)', infiniteLife: 'БЕСКОНЕЧНЫЙ РЕСУРС ПОДТВЕРЖДЁН', fatigueWarning: 'ПРЕДУПРЕЖДЕНИЕ: УСТАЛОСТНОЕ РАЗРУШЕНИЕ', overallFos: 'Общий Запас Прочности (мин)', enduranceLimit: 'Предел Выносливости (Se)', goodmanDiagram: 'ДИАГРАММА ГУДМАНА (LIVE)', loadPoint: 'Нагрузка', envelopeExceeded: 'Предел Усталости Превышен', envelopeExceededDesc: 'Комбинация напряжений вне безопасной зоны Goodman/Langer.' },
    { fatigueLife: '疲労寿命', enduranceAnalysis: '耐久限度解析', materialLoad: '材料 & 荷重設定', ultimateTensile: '引張強さ (S_ut)', yieldStrength: '降伏強度 (S_y)', altStress: '応力振幅 (σ_a)', meanStress: '平均応力 (σ_m)', marinFactors: 'マリン修正係数', surfaceKa: '表面状態 (k_a)', sizeKb: '寸法効果 (k_b)', loadKc: '荷重の種類 (k_c)', infiniteLife: '無限寿命を確認', fatigueWarning: '警告: 疲労破壊の危険あり', overallFos: '最小安全率 (FOS)', enduranceLimit: '耐久限度 (Se)', goodmanDiagram: '修正グッドマン線図 (リアルタイム)', loadPoint: '荷重', envelopeExceeded: '疲労限界領域超過', envelopeExceededDesc: '動作応力状態がグッドマン/ランガーの安全領域を超えています。無限寿命は保証されません。' },
    { fatigueLife: '疲劳寿命', enduranceAnalysis: '耐久极限分析', materialLoad: '材料与载荷设置', ultimateTensile: '抗拉强度 (S_ut)', yieldStrength: '屈服强度 (S_y)', altStress: '交变应力 (σ_a)', meanStress: '平均应力 (σ_m)', marinFactors: 'Marin修正系数', surfaceKa: '表面 (k_a)', sizeKb: '尺寸 (k_b)', loadKc: '载荷 (k_c)', infiniteLife: '无限寿命已确认', fatigueWarning: '警告：预测疲劳失效', overallFos: '总体安全系数 (最小)', enduranceLimit: '耐久极限 (Se)', goodmanDiagram: '实时修正古德曼图', loadPoint: '载荷', envelopeExceeded: '疲劳包络线超出', envelopeExceededDesc: '工作应力组合超出 Goodman/Langer 安全区，无法保证无限寿命。' },
    { fatigueLife: '피로 수명', enduranceAnalysis: '내구 한계 분석', materialLoad: '재료 및 하중 설정', ultimateTensile: '인장 강도 (S_ut)', yieldStrength: '항복 강도 (S_y)', altStress: '교번 응력 (σ_a)', meanStress: '평균 응력 (σ_m)', marinFactors: '마린 계수', surfaceKa: '표면 (k_a)', sizeKb: '크기 (k_b)', loadKc: '하중 (k_c)', infiniteLife: '무한 수명 확인', fatigueWarning: '경고: 피로 파괴 예측', overallFos: '전체 안전 계수 (최소)', enduranceLimit: '내구 한계 (Se)', goodmanDiagram: '실시간 수정 굿맨 다이어그램', loadPoint: '하중', envelopeExceeded: '피로 한계 초과', envelopeExceededDesc: '작동 응력 조합이 Goodman/Langer 안전 영역을 벗어났습니다.' },
    { fatigueLife: 'عمر الإجهاد', enduranceAnalysis: 'تحليل حد التحمل', materialLoad: 'المادة والحمل', ultimateTensile: 'مقاومة الشد (S_ut)', yieldStrength: 'مقاومة الخضوع (S_y)', altStress: 'إجهاد متناوب (σ_a)', meanStress: 'إجهاد متوسط (σ_m)', marinFactors: 'عوامل مارين', surfaceKa: 'السطح (k_a)', sizeKb: 'الحجم (k_b)', loadKc: 'الحمل (k_c)', infiniteLife: 'تم تأكيد العمر اللانهائي', fatigueWarning: 'تحذير: فشل إجهاد متوقع', overallFos: 'عامل الأمان الإجمالي (الأدنى)', enduranceLimit: 'حد التحمل (Se)', goodmanDiagram: 'مخطط جودمان المعدل (مباشر)', loadPoint: 'الحمل', envelopeExceeded: 'تجاوز حد الإجهاد', envelopeExceededDesc: 'مزيج الإجهاد التشغيلي خارج المنطقة الآمنة Goodman/Langer.' },
  ));

// ─── Bearings OS module ───────────────────────────────────────────────────────
const BOS_EN = {
  filter_all: 'All Types', filter_deep_groove_ball: 'Deep Groove Ball (DGB)', filter_angular_contact_ball: 'Angular Contact (ACB)',
  filter_tapered_roller: 'Tapered Roller (TRB)', filter_cylindrical_roller: 'Cylindrical Roller (CRB)',
  filter_needle_roller: 'Needle Roller (NRB)', filter_thrust_ball: 'Thrust Ball (Thrust)',
  boreAll: 'Bore: All', mass: 'Mass', deviationZones: 'Deviation Zones (µm)', bore: 'Bore', shaft: 'Shaft',
};
const BOS_TR = {
  filter_all: 'Tüm Tipler', filter_deep_groove_ball: 'Sabit Bilyalı (DGB)', filter_angular_contact_ball: 'Eğik Bilyalı (ACB)',
  filter_tapered_roller: 'Konik Makaralı (TRB)', filter_cylindrical_roller: 'Silindirik Makaralı (CRB)',
  filter_needle_roller: 'İğneli Makaralı (NRB)', filter_thrust_ball: 'Aksiyal Bilyalı (Thrust)',
  boreAll: 'İç Çap: Tümü', mass: 'Kütle', deviationZones: 'Sapma Bölgeleri (µm)', bore: 'Bilezik', shaft: 'Mil',
};
const BOS_DE = {
  filter_all: 'Alle Typen', filter_deep_groove_ball: 'Rillenkugellager (DGB)', filter_angular_contact_ball: 'Schrägkugellager (ACB)',
  filter_tapered_roller: 'Kegelrollenlager (TRB)', filter_cylindrical_roller: 'Zylinderrollenlager (CRB)',
  filter_needle_roller: 'Nadellager (NRB)', filter_thrust_ball: 'Axialkugellager (Thrust)',
  boreAll: 'Bohrung: Alle', mass: 'Masse', deviationZones: 'Abweichungszonen (µm)', bore: 'Bohrung', shaft: 'Welle',
};
const bosExtra = `
export function getBearingOsFilterLabel(s: BearingsOsModuleStrings, id: string): string {
  const key = ('filter_' + id.replace(/-/g, '_')) as keyof BearingsOsModuleStrings;
  return String(s[key] ?? id);
}
`;
write('bearingsOsModuleTranslations.ts', 'BearingsOsModuleStrings', 'getBearingsOsModuleStrings', BOS_EN,
  mk(BOS_TR, BOS_DE,
    { filter_all: 'Todos los Tipos', filter_deep_groove_ball: 'Bolita Ranura Profunda (DGB)', filter_angular_contact_ball: 'Contacto Angular (ACB)', filter_tapered_roller: 'Rodillo Cónico (TRB)', filter_cylindrical_roller: 'Rodillo Cilíndrico (CRB)', filter_needle_roller: 'Rodillo de Agujas (NRB)', filter_thrust_ball: 'Axial Bolita (Thrust)', boreAll: 'Agujero: Todos', mass: 'Masa', deviationZones: 'Zonas de Desviación (µm)', bore: 'Agujero', shaft: 'Eje' },
    { filter_all: 'Tous les Types', filter_deep_groove_ball: 'Roulement à Billes (DGB)', filter_angular_contact_ball: 'Contact Oblique (ACB)', filter_tapered_roller: 'Roulement Conique (TRB)', filter_cylindrical_roller: 'Roulement Cylindrique (CRB)', filter_needle_roller: 'Roulement à Aiguilles (NRB)', filter_thrust_ball: 'Butée à Billes (Thrust)', boreAll: 'Alésage: Tous', mass: 'Masse', deviationZones: 'Zones de Déviation (µm)', bore: 'Alésage', shaft: 'Arbre' },
    { filter_all: 'Tutti i Tipi', filter_deep_groove_ball: 'Cuscinetto a Sfere (DGB)', filter_angular_contact_ball: 'Contatto Obliquo (ACB)', filter_tapered_roller: 'Rullo Conico (TRB)', filter_cylindrical_roller: 'Rullo Cilindrico (CRB)', filter_needle_roller: 'Rullo a Rullini (NRB)', filter_thrust_ball: 'Assiale a Sfere (Thrust)', boreAll: 'Foro: Tutti', mass: 'Massa', deviationZones: 'Zone di Deviazione (µm)', bore: 'Foro', shaft: 'Albero' },
    { filter_all: 'Todos os Tipos', filter_deep_groove_ball: 'Rolamento Rígido (DGB)', filter_angular_contact_ball: 'Contato Angular (ACB)', filter_tapered_roller: 'Rolamento Cônico (TRB)', filter_cylindrical_roller: 'Rolamento Cilíndrico (CRB)', filter_needle_roller: 'Rolamento de Agulhas (NRB)', filter_thrust_ball: 'Axial de Esferas (Thrust)', boreAll: 'Furo: Todos', mass: 'Massa', deviationZones: 'Zonas de Desvio (µm)', bore: 'Furo', shaft: 'Eixo' },
    { filter_all: 'Все Типы', filter_deep_groove_ball: 'Шариковый (DGB)', filter_angular_contact_ball: 'Угловой Контакт (ACB)', filter_tapered_roller: 'Конический (TRB)', filter_cylindrical_roller: 'Цилиндрический (CRB)', filter_needle_roller: 'Игольчатый (NRB)', filter_thrust_ball: 'Упорный Шариковый (Thrust)', boreAll: 'Отверстие: Все', mass: 'Масса', deviationZones: 'Зоны Отклонения (µm)', bore: 'Отверстие', shaft: 'Вал' },
    { filter_all: '全タイプ', filter_deep_groove_ball: '深溝玉軸受 (DGB)', filter_angular_contact_ball: 'アンギュラ玉軸受 (ACB)', filter_tapered_roller: '円すいころ軸受 (TRB)', filter_cylindrical_roller: '円筒ころ軸受 (CRB)', filter_needle_roller: '針状ころ軸受 (NRB)', filter_thrust_ball: 'スラスト玉軸受 (Thrust)', boreAll: '内径: すべて', mass: '質量', deviationZones: '偏差ゾーン (µm)', bore: '内径', shaft: '軸' },
    { filter_all: '所有类型', filter_deep_groove_ball: '深沟球轴承 (DGB)', filter_angular_contact_ball: '角接触球轴承 (ACB)', filter_tapered_roller: '圆锥滚子轴承 (TRB)', filter_cylindrical_roller: '圆柱滚子轴承 (CRB)', filter_needle_roller: '滚针轴承 (NRB)', filter_thrust_ball: '推力球轴承 (Thrust)', boreAll: '内径: 全部', mass: '质量', deviationZones: '偏差区 (µm)', bore: '内圈', shaft: '轴' },
    { filter_all: '모든 유형', filter_deep_groove_ball: '깊은 홈 볼 베어링 (DGB)', filter_angular_contact_ball: '앵귤러 컨택트 (ACB)', filter_tapered_roller: '테이퍼 롤러 (TRB)', filter_cylindrical_roller: '원통 롤러 (CRB)', filter_needle_roller: '니들 롤러 (NRB)', filter_thrust_ball: '스러스트 볼 (Thrust)', boreAll: '보어: 전체', mass: '질량', deviationZones: '편차 구역 (µm)', bore: '보어', shaft: '축' },
    { filter_all: 'جميع الأنواع', filter_deep_groove_ball: 'كرة أخدود عميق (DGB)', filter_angular_contact_ball: 'اتصال زاوي (ACB)', filter_tapered_roller: 'أسطواني مخروطي (TRB)', filter_cylindrical_roller: 'أسطواني (CRB)', filter_needle_roller: 'إبرة (NRB)', filter_thrust_ball: 'دفع كروي (Thrust)', boreAll: 'الثقب: الكل', mass: 'الكتلة', deviationZones: 'مناطق الانحراف (µm)', bore: 'الثقب', shaft: 'العمود' },
  ), bosExtra);

// ─── Beam deflection ──────────────────────────────────────────────────────────
const BEAM_EN = {
  kinematicSetup: 'Kinematic Setup', simplySupported: 'Simply Supported', cantilever: 'Cantilevered',
  appliedLoad: 'Applied Load (F)', integrityNormal: 'INTEGRITY: NORMAL', limitExceeded: 'WARNING: LIMIT EXCEEDED',
  allowableLimit: 'Allowable Limit (L/300)', liveDeformation: 'LIVE DEFORMATION KINEMATICS',
  criticalWarning: 'Critical Structural Warning',
  criticalWarningDesc: 'Deflection exceeds the structural limit. Consider increasing beam inertia ({inertia} → {suggested}) or utilizing a higher modulus material.',
};
const BEAM_TR = {
  kinematicSetup: 'Sınır Koşulları', simplySupported: 'Basit Mesnet', cantilever: 'Konsol',
  appliedLoad: 'Uygulanan Yük (F)', integrityNormal: 'YAPISAL GÜVENLİK: NORMAL', limitExceeded: 'UYARI: SEHİM LİMİTİ AŞILDI',
  allowableLimit: 'İzin Verilen Limit (L/300)', liveDeformation: 'ANLIK DEFORMASYON KİNEMATİĞİ',
  criticalWarning: 'Kritik Yapısal Sehim Uyarısı',
  criticalWarningDesc: 'Sehim miktarı izin verilen limiti aşıyor. Kiriş atalet momentini artırmayı ({inertia} → {suggested}) veya daha rijit bir malzeme seçmeyi düşünün.',
};
const BEAM_DE = {
  kinematicSetup: 'Randbedingungen', simplySupported: 'Einfach Gelagert', cantilever: 'Kragträger',
  appliedLoad: 'Aufgebrachte Last (F)', integrityNormal: 'INTEGRITÄT: NORMAL', limitExceeded: 'WARNUNG: GRENZWERT ÜBERSCHRITTEN',
  allowableLimit: 'Zulässige Grenze (L/300)', liveDeformation: 'LIVE-VERFORMUNGSKINEMATIK',
  criticalWarning: 'Kritische Strukturwarnung',
  criticalWarningDesc: 'Durchbiegung überschreitet die Grenze. Erwägen Sie eine Erhöhung des Trägheitsmoments ({inertia} → {suggested}) oder ein steiferes Material.',
};
const beamExtra = `
export function formatBeamCriticalWarning(s: BeamDeflectionModuleStrings, inertia: number, suggested: number): string {
  return s.criticalWarningDesc.replace('{inertia}', String(inertia)).replace('{suggested}', String(suggested));
}
`;
write('beamDeflectionModuleTranslations.ts', 'BeamDeflectionModuleStrings', 'getBeamDeflectionModuleStrings', BEAM_EN,
  mk(BEAM_TR, BEAM_DE,
    { kinematicSetup: 'Configuración Cinemática', simplySupported: 'Simplemente Apoyada', cantilever: 'Voladizo', appliedLoad: 'Carga Aplicada (F)', integrityNormal: 'INTEGRIDAD: NORMAL', limitExceeded: 'ADVERTENCIA: LÍMITE EXCEDIDO', allowableLimit: 'Límite Permisible (L/300)', liveDeformation: 'CINEMÁTICA DE DEFORMACIÓN EN VIVO', criticalWarning: 'Advertencia Estructural Crítica', criticalWarningDesc: 'La deflexión excede el límite. Considere aumentar la inercia ({inertia} → {suggested}) o un material más rígido.' },
    { kinematicSetup: 'Configuration Cinématique', simplySupported: 'Simplement Appuyée', cantilever: 'Console', appliedLoad: 'Charge Appliquée (F)', integrityNormal: 'INTÉGRITÉ: NORMALE', limitExceeded: 'AVERTISSEMENT: LIMITE DÉPASSÉE', allowableLimit: 'Limite Admissible (L/300)', liveDeformation: 'CINÉMATIQUE DE DÉFORMATION EN DIRECT', criticalWarning: 'Avertissement Structurel Critique', criticalWarningDesc: 'La flèche dépasse la limite. Envisagez d\'augmenter l\'inertie ({inertia} → {suggested}) ou un matériau plus rigide.' },
    { kinematicSetup: 'Configurazione Cinematica', simplySupported: 'Semplicemente Appoggiata', cantilever: 'Console', appliedLoad: 'Carico Applicato (F)', integrityNormal: 'INTEGRITÀ: NORMALE', limitExceeded: 'AVVISO: LIMITE SUPERATO', allowableLimit: 'Limite Ammissibile (L/300)', liveDeformation: 'CINEMATICA DEFORMAZIONE LIVE', criticalWarning: 'Avviso Strutturale Critico', criticalWarningDesc: 'La freccia supera il limite. Considerare di aumentare l\'inerzia ({inertia} → {suggested}) o un materiale più rigido.' },
    { kinematicSetup: 'Configuração Cinemática', simplySupported: 'Simplesmente Apoiada', cantilever: 'Consola', appliedLoad: 'Carga Aplicada (F)', integrityNormal: 'INTEGRIDADE: NORMAL', limitExceeded: 'AVISO: LIMITE EXCEDIDO', allowableLimit: 'Limite Permitido (L/300)', liveDeformation: 'CINEMÁTICA DE DEFORMAÇÃO AO VIVO', criticalWarning: 'Aviso Estrutural Crítico', criticalWarningDesc: 'A deflexão excede o limite. Considere aumentar a inércia ({inertia} → {suggested}) ou um material mais rígido.' },
    { kinematicSetup: 'Кинематическая Настройка', simplySupported: 'Шарнирно Опёртая', cantilever: 'Консоль', appliedLoad: 'Прикладная Нагрузка (F)', integrityNormal: 'ЦЕЛОСТНОСТЬ: НОРМА', limitExceeded: 'ПРЕДУПРЕЖДЕНИЕ: ПРЕДЕЛ ПРЕВЫШЕН', allowableLimit: 'Допустимый Предел (L/300)', liveDeformation: 'КИНЕМАТИКА ДЕФОРМАЦИИ LIVE', criticalWarning: 'Критическое Структурное Предупреждение', criticalWarningDesc: 'Прогиб превышает предел. Рассмотрите увеличение инерции ({inertia} → {suggested}) или более жёсткий материал.' },
    { kinematicSetup: '境界条件', simplySupported: '単純支持梁', cantilever: '片持ち梁', appliedLoad: '集中荷重 (F)', integrityNormal: '構造健全性: 正常', limitExceeded: '警告: たわみ制限超過', allowableLimit: '許容たわみ量 (L/300)', liveDeformation: '変形解析シミュレーション', criticalWarning: '構造上の危険警告', criticalWarningDesc: 'たわみ量が許容限界を超えています。断面二次モーメントを増やすか（{inertia} → {suggested}）、高剛性の材料をご検討ください。' },
    { kinematicSetup: '运动学设置', simplySupported: '简支梁', cantilever: '悬臂梁', appliedLoad: '施加载荷 (F)', integrityNormal: '结构完整性: 正常', limitExceeded: '警告: 挠度超限', allowableLimit: '允许限值 (L/300)', liveDeformation: '实时变形运动学', criticalWarning: '严重结构警告', criticalWarningDesc: '挠度超过结构限值。考虑增加惯性矩（{inertia} → {suggested}）或使用更高模量材料。' },
    { kinematicSetup: '운동학 설정', simplySupported: '단순 지지', cantilever: '캔틸레버', appliedLoad: '적용 하중 (F)', integrityNormal: '구조 무결성: 정상', limitExceeded: '경고: 한계 초과', allowableLimit: '허용 한계 (L/300)', liveDeformation: '실시간 변형 운동학', criticalWarning: '심각한 구조 경고', criticalWarningDesc: '처짐이 구조 한계를 초과했습니다. 관성 모멘트 증가({inertia} → {suggested}) 또는 더 높은 탄성계수 재료를 고려하세요.' },
    { kinematicSetup: 'الإعداد الحركي', simplySupported: 'مدعوم ببساطة', cantilever: 'كابولي', appliedLoad: 'الحمل المطبق (F)', integrityNormal: 'السلامة: طبيعي', limitExceeded: 'تحذير: تجاوز الحد', allowableLimit: 'الحد المسموح (L/300)', liveDeformation: 'حركة التشوه المباشرة', criticalWarning: 'تحذير إنشائي حرج', criticalWarningDesc: 'الانحراف يتجاوز الحد. فكر في زيادة عزم القصور ({inertia} → {suggested}) أو مادة أكثر صلابة.' },
  ), beamExtra);

// ─── Concrete reinforcement ───────────────────────────────────────────────────
const CONC_EN = {
  beamGeometry: 'Beam Geometry', width: 'Width (b)', height: 'Height (h)', cover: 'Cover (c_nom)',
  propertyMatrix: 'Property Matrix', concreteFck: 'Concrete fck', steelFyk: 'Steel fyk', designVector: 'Design Vector',
  moment: 'Moment (M_ed)', barDiameter: 'Bar Diameter', quantity: 'Quantity', tensionRebar: 'TENSION REBAR',
  percentRatio: '% RATIO', doubleReinforced: 'X-COMP REQ', singleReinforced: 'SINGLE REINFORCED',
  ec2Compliant: 'Compliant with EC2', reinforcementDeficit: 'Reinforcement Deficit',
  profileSection: 'Cast-in-Situ Structural Profile Section', mainTension: 'Main Tension', shearLinks: 'Shear Links',
  designCode: 'Design Code', steelStrain: 'Steel Strain', yielded: 'YIELDED', civilKernel: 'Civil Kernel',
  deficitMsg: 'Reinforcement insufficient: beam cannot carry {moment} kNm design moment.',
  deficitHint: 'Increase bar count or diameter for safe load transfer.',
};
const CONC_TR = {
  beamGeometry: 'Kiriş Geometrisi', width: 'Genişlik (b)', height: 'Yükseklik (h)', cover: 'Paspayı (c_nom)',
  propertyMatrix: 'Malzeme Özellikleri', concreteFck: 'Beton fck', steelFyk: 'Çelik fyk', designVector: 'Tasarım Vektörü',
  moment: 'Moment (M_ed)', barDiameter: 'Donatı Çapı', quantity: 'Donatı Adedi', tensionRebar: 'ÇEKME DONATISI',
  percentRatio: '% ORAN', doubleReinforced: 'ÇİFT DONATILI', singleReinforced: 'TEK DONATILI',
  ec2Compliant: 'EC2 Uyumlu', reinforcementDeficit: 'Yetersiz Donatı',
  profileSection: 'Yerinde Dökme Yapısal Profil Kesiti', mainTension: 'Ana Donatı', shearLinks: 'Etriyeler',
  designCode: 'Tasarım Standardı', steelStrain: 'Çelik Birim Uzaması', yielded: 'AKTI', civilKernel: 'İnşaat Çekirdeği',
  deficitMsg: 'Donatı yetersizliği: Kiriş {moment} kNm tasarım momentini taşıyamıyor.',
  deficitHint: 'Güvenli yük aktarımı için donatı adetini veya çapını artırın.',
};
const CONC_DE = {
  beamGeometry: 'Balkengeometrie', width: 'Breite (b)', height: 'Höhe (h)', cover: 'Betondeckung (c_nom)',
  propertyMatrix: 'Materialeigenschaften', concreteFck: 'Beton fck', steelFyk: 'Stahl fyk', designVector: 'Bemessungsvektor',
  moment: 'Moment (M_ed)', barDiameter: 'Stabdurchmesser', quantity: 'Anzahl Stäbe', tensionRebar: 'ZUGBewehrung',
  percentRatio: '% VERHÄLTNIS', doubleReinforced: 'DOPPELBEMESSUNG', singleReinforced: 'EINFACH BEWEHRT',
  ec2Compliant: 'EC2-konform', reinforcementDeficit: 'Bewehrungsdefizit',
  profileSection: 'Ortbeton-Querschnitt', mainTension: 'Hauptbewehrung', shearLinks: 'Bügel',
  designCode: 'Bemessungsnorm', steelStrain: 'Stahldehnung', yielded: 'FLIESSEN', civilKernel: 'Bau-Kernel',
  deficitMsg: 'Bewehrung unzureichend: Balken trägt {moment} kNm Bemessungsmoment nicht.',
  deficitHint: 'Stabanzahl oder -durchmesser für sichere Lastübertragung erhöhen.',
};
const concExtra = `
export function formatConcreteDeficitMsg(s: ConcreteReinforcementStrings, moment: number): string {
  return s.deficitMsg.replace('{moment}', String(moment));
}
`;
write('concreteReinforcementTranslations.ts', 'ConcreteReinforcementStrings', 'getConcreteReinforcementStrings', CONC_EN,
  mk(CONC_TR, CONC_DE,
    { beamGeometry: 'Geometría de Viga', width: 'Ancho (b)', height: 'Altura (h)', cover: 'Recubrimiento (c_nom)', propertyMatrix: 'Propiedades', concreteFck: 'Hormigón fck', steelFyk: 'Acero fyk', designVector: 'Vector de Diseño', moment: 'Momento (M_ed)', barDiameter: 'Diámetro Barra', quantity: 'Cantidad', tensionRebar: 'ARMADURA A TRACCIÓN', percentRatio: '% RATIO', doubleReinforced: 'DOBLE ARMADO', singleReinforced: 'ARMADO SIMPLE', ec2Compliant: 'Conforme EC2', reinforcementDeficit: 'Déficit de Armadura', profileSection: 'Sección Estructural', mainTension: 'Armadura Principal', shearLinks: 'Estribos', designCode: 'Norma de Diseño', steelStrain: 'Deformación Acero', yielded: 'FLUENCIA', civilKernel: 'Núcleo Civil', deficitMsg: 'Armadura insuficiente: la viga no soporta {moment} kNm.', deficitHint: 'Aumente cantidad o diámetro de barras.' },
    { beamGeometry: 'Géométrie Poutre', width: 'Largeur (b)', height: 'Hauteur (h)', cover: 'Enrobage (c_nom)', propertyMatrix: 'Propriétés', concreteFck: 'Béton fck', steelFyk: 'Acier fyk', designVector: 'Vecteur Conception', moment: 'Moment (M_ed)', barDiameter: 'Diamètre Barre', quantity: 'Quantité', tensionRebar: 'ARMATURE TRACTION', percentRatio: '% RATIO', doubleReinforced: 'DOUBLE ARMATURE', singleReinforced: 'ARMATURE SIMPLE', ec2Compliant: 'Conforme EC2', reinforcementDeficit: 'Déficit Armature', profileSection: 'Section Structurelle', mainTension: 'Armature Principale', shearLinks: 'Cadres', designCode: 'Code de Conception', steelStrain: 'Déformation Acier', yielded: 'PLASTICITÉ', civilKernel: 'Noyau Civil', deficitMsg: 'Armature insuffisante: la poutre ne supporte pas {moment} kNm.', deficitHint: 'Augmentez le nombre ou le diamètre des barres.' },
    { beamGeometry: 'Geometria Trave', width: 'Larghezza (b)', height: 'Altezza (h)', cover: 'Copriferro (c_nom)', propertyMatrix: 'Proprietà', concreteFck: 'Calcestruzzo fck', steelFyk: 'Acciaio fyk', designVector: 'Vettore Progetto', moment: 'Momento (M_ed)', barDiameter: 'Diametro Barra', quantity: 'Quantità', tensionRebar: 'ARMATURA TRAZIONE', percentRatio: '% RAPPORTO', doubleReinforced: 'DOPPIA ARMATURA', singleReinforced: 'ARMATURA SINGOLA', ec2Compliant: 'Conforme EC2', reinforcementDeficit: 'Deficit Armatura', profileSection: 'Sezione Strutturale', mainTension: 'Armatura Principale', shearLinks: 'Staffe', designCode: 'Norma Progetto', steelStrain: 'Deformazione Acciaio', yielded: 'SNERVAMENTO', civilKernel: 'Kernel Civile', deficitMsg: 'Armatura insufficiente: la trave non regge {moment} kNm.', deficitHint: 'Aumentare numero o diametro barre.' },
    { beamGeometry: 'Geometria Viga', width: 'Largura (b)', height: 'Altura (h)', cover: 'Cobrimento (c_nom)', propertyMatrix: 'Propriedades', concreteFck: 'Betão fck', steelFyk: 'Aço fyk', designVector: 'Vetor de Projeto', moment: 'Momento (M_ed)', barDiameter: 'Diâmetro Barra', quantity: 'Quantidade', tensionRebar: 'ARMADURA TRAÇÃO', percentRatio: '% RAZÃO', doubleReinforced: 'DUPLA ARMADURA', singleReinforced: 'ARMADURA SIMPLES', ec2Compliant: 'Conforme EC2', reinforcementDeficit: 'Déficit Armadura', profileSection: 'Secção Estrutural', mainTension: 'Armadura Principal', shearLinks: 'Estribos', designCode: 'Norma de Projeto', steelStrain: 'Deformação Aço', yielded: 'ESCORAMENTO', civilKernel: 'Kernel Civil', deficitMsg: 'Armadura insuficiente: viga não suporta {moment} kNm.', deficitHint: 'Aumente quantidade ou diâmetro das barras.' },
    { beamGeometry: 'Геометрия Балки', width: 'Ширина (b)', height: 'Высота (h)', cover: 'Защитный слой (c_nom)', propertyMatrix: 'Свойства', concreteFck: 'Бетон fck', steelFyk: 'Сталь fyk', designVector: 'Расчётный Вектор', moment: 'Момент (M_ed)', barDiameter: 'Диаметр Стержня', quantity: 'Количество', tensionRebar: 'РАСТЯГИВАЮЩАЯ АРМ.', percentRatio: '% СООТН.', doubleReinforced: 'ДВОЙНОЕ АРМИР.', singleReinforced: 'ОДИНОЧНОЕ АРМИР.', ec2Compliant: 'Соответствует EC2', reinforcementDeficit: 'Недостаток Армирования', profileSection: 'Конструктивное Сечение', mainTension: 'Основная Арматура', shearLinks: 'Хомуты', designCode: 'Норма Проектирования', steelStrain: 'Деформация Стали', yielded: 'ТЕКУЧЕСТЬ', civilKernel: 'Строительное Ядро', deficitMsg: 'Армирования недостаточно: балка не выдерживает {moment} kNm.', deficitHint: 'Увеличьте количество или диаметр стержней.' },
    { beamGeometry: '梁の寸法', width: '幅 (b)', height: '高さ (h)', cover: 'かぶり厚さ (c_nom)', propertyMatrix: '材料強度', concreteFck: 'コンクリート fck', steelFyk: '鉄筋 fyk', designVector: '設計荷重', moment: '設計モーメント (M_ed)', barDiameter: '鉄筋径', quantity: '本数', tensionRebar: '引張鉄筋', percentRatio: '% 比率', doubleReinforced: '複筋', singleReinforced: '単筋梁', ec2Compliant: 'EC2適合', reinforcementDeficit: '鉄筋量不足', profileSection: '構造断面図 (現場打ち)', mainTension: '主筋', shearLinks: 'せん断補強筋', designCode: '設計基準', steelStrain: '鉄筋ひずみ', yielded: '降伏', civilKernel: '計算エンジン', deficitMsg: '設計モーメント {moment} kNm に対する鉄筋の耐力が不足しています。', deficitHint: '本数または鉄筋径を増やしてください。' },
    { beamGeometry: '梁几何', width: '宽度 (b)', height: '高度 (h)', cover: '保护层 (c_nom)', propertyMatrix: '材料属性', concreteFck: '混凝土 fck', steelFyk: '钢筋 fyk', designVector: '设计向量', moment: '弯矩 (M_ed)', barDiameter: '钢筋直径', quantity: '数量', tensionRebar: '受拉钢筋', percentRatio: '% 比率', doubleReinforced: '双筋', singleReinforced: '单筋梁', ec2Compliant: '符合 EC2', reinforcementDeficit: '配筋不足', profileSection: '现浇结构截面', mainTension: '主筋', shearLinks: '箍筋', designCode: '设计规范', steelStrain: '钢筋应变', yielded: '屈服', civilKernel: '土木内核', deficitMsg: '配筋不足：梁无法承受 {moment} kNm 设计弯矩。', deficitHint: '增加钢筋数量或直径以确保安全传力。' },
    { beamGeometry: '보 기하', width: '폭 (b)', height: '높이 (h)', cover: '피복 (c_nom)', propertyMatrix: '재료 특성', concreteFck: '콘크리트 fck', steelFyk: '철근 fyk', designVector: '설계 벡터', moment: '모멘트 (M_ed)', barDiameter: '철근 직경', quantity: '수량', tensionRebar: '인장 철근', percentRatio: '% 비율', doubleReinforced: '복근', singleReinforced: '단근 보', ec2Compliant: 'EC2 준수', reinforcementDeficit: '철근 부족', profileSection: '현장 타설 구조 단면', mainTension: '주철근', shearLinks: '늑근', designCode: '설계 기준', steelStrain: '철근 변형률', yielded: '항복', civilKernel: '토목 커널', deficitMsg: '철근 부족: 보가 {moment} kNm 설계 모멘트를 견디지 못합니다.', deficitHint: '안전한 하중 전달을 위해 철근 수량 또는 직경을 늘리세요.' },
    { beamGeometry: 'هندسة العتبة', width: 'العرض (b)', height: 'الارتفاع (h)', cover: 'الغطاء (c_nom)', propertyMatrix: 'خصائص المواد', concreteFck: 'خرسانة fck', steelFyk: 'فولاذ fyk', designVector: 'متجه التصميم', moment: 'العزم (M_ed)', barDiameter: 'قطر القضيب', quantity: 'الكمية', tensionRebar: 'حديد الشد', percentRatio: '% النسبة', doubleReinforced: 'تسليح مزدوج', singleReinforced: 'تسليح مفرد', ec2Compliant: 'متوافق مع EC2', reinforcementDeficit: 'عجز التسليح', profileSection: 'مقطع إنشائي مصبوب', mainTension: 'التسليح الرئيسي', shearLinks: 'كانات القص', designCode: 'كود التصميم', steelStrain: 'انفعال الفولاذ', yielded: 'خضوع', civilKernel: 'نواة مدنية', deficitMsg: 'التسليح غير كافٍ: العتبة لا تحمل {moment} kNm.', deficitHint: 'زد عدد أو قطر القضبان لنقل آمن للحمل.' },
  ), concExtra);

// ─── Fastener assembly ────────────────────────────────────────────────────────
const FA_EN = {
  highStressWarning: 'High Preload Stress Warning', yieldExceeded: 'Yield capacity exceeded!',
  safeUtilization: 'Safe utilization limits', chartsAnalytics: 'Charts & Analytics', hdBlueprint: 'HD Technical Blueprint',
};
write('fastenerAssemblyModuleTranslations.ts', 'FastenerAssemblyModuleStrings', 'getFastenerAssemblyModuleStrings', FA_EN,
  mk(
    { highStressWarning: 'Aşırı Gerilme Uyarısı', yieldExceeded: 'Akma sınırı aşıldı!', safeUtilization: 'Akma sınırı güvenli bölgede', chartsAnalytics: 'Grafikler ve Analiz', hdBlueprint: 'HD Teknik Resim (PDF)' },
    { highStressWarning: 'Warnung: Hohe Vorspannspannung', yieldExceeded: 'Streckgrenze überschritten!', safeUtilization: 'Sichere Ausnutzungsgrenzen', chartsAnalytics: 'Diagramme & Analyse', hdBlueprint: 'HD Technische Zeichnung' },
    { highStressWarning: 'Advertencia de Precarga Alta', yieldExceeded: '¡Capacidad de fluencia excedida!', safeUtilization: 'Límites de utilización seguros', chartsAnalytics: 'Gráficos y Análisis', hdBlueprint: 'Plano Técnico HD' },
    { highStressWarning: 'Avertissement Précharge Élevée', yieldExceeded: 'Limite élastique dépassée !', safeUtilization: 'Limites d\'utilisation sûres', chartsAnalytics: 'Graphiques & Analytique', hdBlueprint: 'Plan Technique HD' },
    { highStressWarning: 'Avviso Precarico Elevato', yieldExceeded: 'Capacità di snervamento superata!', safeUtilization: 'Limiti di utilizzo sicuri', chartsAnalytics: 'Grafici e Analisi', hdBlueprint: 'Blueprint Tecnico HD' },
    { highStressWarning: 'Aviso de Pré-carga Elevada', yieldExceeded: 'Capacidade de escoamento excedida!', safeUtilization: 'Limites de utilização seguros', chartsAnalytics: 'Gráficos e Análise', hdBlueprint: 'Desenho Técnico HD' },
    { highStressWarning: 'Предупреждение о Преднагрузке', yieldExceeded: 'Предел текучести превышен!', safeUtilization: 'Безопасные пределы использования', chartsAnalytics: 'Графики и Аналитика', hdBlueprint: 'HD Технический Чертёж' },
    { highStressWarning: '高プリロード応力警告', yieldExceeded: '降伏容量を超過！', safeUtilization: '安全な利用率範囲内', chartsAnalytics: 'グラフと分析', hdBlueprint: 'HD技術図面 (PDF)' },
    { highStressWarning: '高预紧应力警告', yieldExceeded: '已超过屈服容量！', safeUtilization: '安全利用率范围内', chartsAnalytics: '图表与分析', hdBlueprint: '高清技术蓝图 (PDF)' },
    { highStressWarning: '높은 예압 응력 경고', yieldExceeded: '항복 용량 초과!', safeUtilization: '안전한 이용률 한계', chartsAnalytics: '차트 및 분석', hdBlueprint: 'HD 기술 도면 (PDF)' },
    { highStressWarning: 'تحذير إجهاد التحميل المسبق', yieldExceeded: 'تم تجاوز سعة الخضوع!', safeUtilization: 'حدود استخدام آمنة', chartsAnalytics: 'الرسوم البيانية والتحليل', hdBlueprint: 'مخطط تقني عالي الدقة' },
  ));

// ─── Fastener metadata ────────────────────────────────────────────────────────
const FM_EN = {
  isoStandardTitle: 'General purpose metric screw threads', uncStandardTitle: 'Unified Inch Screw Threads (UN/UNR)',
  assumption1: 'Tolerance Class: 6g (Bolt) / 6H (Nut)', assumption2: 'Standard Coarse/Fine Pitches only',
  assumption3: 'Tensile Area calculation based on nominal diameter',
};
write('fastenerMetadataTranslations.ts', 'FastenerMetadataStrings', 'getFastenerMetadataStrings', FM_EN,
  mk(
    { isoStandardTitle: 'Genel amaçlı metrik cıvata dişleri', uncStandardTitle: 'Unifiye İnç Vida Dişleri (UN/UNR)', assumption1: 'Tolerans Sınıfı: 6g (Cıvata) / 6H (Somun)', assumption2: 'Yalnızca Standart Kaba/İnce Adımlar', assumption3: 'Gerilme alanı hesabı nominal çapa dayanmaktadır' },
    { isoStandardTitle: 'Metrisches ISO-Gewinde allgemeiner Anwendung', uncStandardTitle: 'Einheitliches Zoll-Gewinde (UN/UNR)', assumption1: 'Toleranzklasse: 6g (Schraube) / 6H (Mutter)', assumption2: 'Nur Standard-Regel-/Feingewinde', assumption3: 'Spannungsquerschnitts-Berechnung basiert auf Nenndurchmesser' },
    { isoStandardTitle: 'Roscas métricas de uso general', uncStandardTitle: 'Roscas UN pulgadas unificadas', assumption1: 'Clase tolerancia: 6g (Perno) / 6H (Tuerca)', assumption2: 'Solo pasos estándar grueso/fino', assumption3: 'Área de tensión basada en diámetro nominal' },
    { isoStandardTitle: 'Filetages métriques usage général', uncStandardTitle: 'Filetages UN pouces unifiés', assumption1: 'Classe: 6g (Boulon) / 6H (Écrou)', assumption2: 'Pas standard gros/fin uniquement', assumption3: 'Section basée sur diamètre nominal' },
    { isoStandardTitle: 'Filettature metriche uso generale', uncStandardTitle: 'Filettature UN pollici unificate', assumption1: 'Classe: 6g (Bullone) / 6H (Dado)', assumption2: 'Solo passi standard', assumption3: 'Area tensione su diametro nominale' },
    { isoStandardTitle: 'Rosca métrica uso geral', uncStandardTitle: 'Rosca UN polegadas unificada', assumption1: 'Classe: 6g (Parafuso) / 6H (Porca)', assumption2: 'Apenas passos padrão', assumption3: 'Área de tensão no diâmetro nominal' },
    { isoStandardTitle: 'Метрическая резьба общего назначения', uncStandardTitle: 'Дюймовая резьба UN (UN/UNR)', assumption1: 'Класс: 6g (Болт) / 6H (Гайка)', assumption2: 'Только стандартные шаги', assumption3: 'Площадь сечения по номинальному диаметру' },
    { isoStandardTitle: '一般用メートルねじ規格', uncStandardTitle: 'ユニファイねじ規格 (UN/UNR)', assumption1: '公差等級: 6g (ボルト) / 6H (ナット)', assumption2: '標準の並目・細目ピッチのみ', assumption3: '有効断面積は基準寸法(呼び径)に基づいて算出' },
    { isoStandardTitle: '通用公制螺纹', uncStandardTitle: '统一英制螺纹 (UN/UNR)', assumption1: '公差等级: 6g (螺栓) / 6H (螺母)', assumption2: '仅标准粗/细牙距', assumption3: '应力面积按公称直径计算' },
    { isoStandardTitle: '범용 미터 나사', uncStandardTitle: '통일 인치 나사 (UN/UNR)', assumption1: '공차 등급: 6g (볼트) / 6H (너트)', assumption2: '표준 조/세 피치만', assumption3: '응력 단면적은 공칭 직경 기준' },
    { isoStandardTitle: 'خيوط مترية للأغراض العامة', uncStandardTitle: 'خيوط بوصة موحدة (UN/UNR)', assumption1: 'فئة التسامح: 6g (برغي) / 6H (صمولة)', assumption2: 'خطوات قياسية فقط', assumption3: 'مساحة الإجهاد على القطر الاسمي' },
  ));

// ─── Engineering notes ──────────────────────────────────────────────────────────
const ENOTES_EN = { title: 'Engineering Scratchpad', placeholder: 'Enter calculation or note... (e.g. L-axis offset 45.2mm)', addNote: 'Add Note', noNotes: 'No saved notes.' };
write('engineeringNotesTranslations.ts', 'EngineeringNotesStrings', 'getEngineeringNotesStrings', ENOTES_EN,
  mk(
    { title: 'Mühendislik Karalama Defteri', placeholder: 'Hesap veya not girin... (Örn: L ekseni offseti 45.2mm)', addNote: 'Not Ekle', noNotes: 'Kayıtlı not bulunmuyor.' },
    { title: 'Ingenieur-Notizblock', placeholder: 'Berechnung oder Notiz eingeben...', addNote: 'Notiz hinzufügen', noNotes: 'Keine gespeicherten Notizen.' },
    { title: 'Bloc de Notas de Ingeniería', placeholder: 'Ingrese cálculo o nota...', addNote: 'Añadir Nota', noNotes: 'No hay notas guardadas.' },
    { title: 'Bloc-notes Ingénierie', placeholder: 'Entrez un calcul ou une note...', addNote: 'Ajouter Note', noNotes: 'Aucune note enregistrée.' },
    { title: 'Blocco Note Ingegneria', placeholder: 'Inserisci calcolo o nota...', addNote: 'Aggiungi Nota', noNotes: 'Nessuna nota salvata.' },
    { title: 'Bloco de Notas de Engenharia', placeholder: 'Digite cálculo ou nota...', addNote: 'Adicionar Nota', noNotes: 'Nenhuma nota salva.' },
    { title: 'Инженерный Блокнот', placeholder: 'Введите расчёт или заметку...', addNote: 'Добавить Заметку', noNotes: 'Нет сохранённых заметок.' },
    { title: 'エンジニアリングメモ', placeholder: '計算またはメモを入力...', addNote: 'メモ追加', noNotes: '保存されたメモはありません。' },
    { title: '工程草稿本', placeholder: '输入计算或备注...', addNote: '添加备注', noNotes: '没有已保存的备注。' },
    { title: '엔지니어링 스크래치패드', placeholder: '계산 또는 메모 입력...', addNote: '메모 추가', noNotes: '저장된 메모가 없습니다.' },
    { title: 'مفكرة الهندسة', placeholder: 'أدخل حساباً أو ملاحظة...', addNote: 'إضافة ملاحظة', noNotes: 'لا توجد ملاحظات محفوظة.' },
  ));

// ─── Planetary title ────────────────────────────────────────────────────────────
const PLAN_EN = { titleBefore: 'Planetary', titleHighlight: 'Multi-Stage' };
write('planetaryTitleTranslations.ts', 'PlanetaryTitleStrings', 'getPlanetaryTitleStrings', PLAN_EN,
  mk(
    { titleBefore: 'Planer', titleHighlight: 'Çok Kademeli' },
    { titleBefore: 'Planeten', titleHighlight: 'Mehrstufig' },
    { titleBefore: 'Planetario', titleHighlight: 'Multi-Etapa' },
    { titleBefore: 'Planétaire', titleHighlight: 'Multi-Étages' },
    { titleBefore: 'Planetario', titleHighlight: 'Multi-Stadio' },
    { titleBefore: 'Planetário', titleHighlight: 'Multi-Estágio' },
    { titleBefore: 'Планетарный', titleHighlight: 'Многоступенчатый' },
    { titleBefore: '遊星', titleHighlight: 'マルチステージ' },
    { titleBefore: '行星', titleHighlight: '多级' },
    { titleBefore: '행성', titleHighlight: '다단' },
    { titleBefore: 'كوكبي', titleHighlight: 'متعدد المراحل' },
  ));

console.log('Generated remaining module translation files in src/locales/');
