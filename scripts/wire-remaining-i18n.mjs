/**
 * Wires remaining modules to translation getters via regex replacements.
 * Run: node scripts/wire-remaining-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function patch(file, edits) {
  const p = path.join(root, file);
  let s = fs.readFileSync(p, 'utf8');
  for (const [from, to] of edits) {
    if (!s.includes(from) && !from.startsWith('REGEX:')) {
      console.warn('SKIP (not found):', file, from.slice(0, 60));
      continue;
    }
    if (from.startsWith('REGEX:')) {
      const re = new RegExp(from.slice(6), 'g');
      s = s.replace(re, to);
    } else {
      s = s.replace(from, to);
    }
  }
  fs.writeFileSync(p, s, 'utf8');
  console.log('Patched', file);
}

// Gearbox
patch('src/components/modules/mechanical/GearboxDesignModule.tsx', [
  ["import { useI18nStore } from '@/store/i18nStore';", "import { useI18nStore } from '@/store/i18nStore';\nimport { getGearboxModuleStrings, formatGearboxStage } from '@/locales/gearboxModuleTranslations';"],
  ['const { language } = useI18nStore();', 'const { language } = useI18nStore();\n    const g = getGearboxModuleStrings(language);'],
  ["{language === 'tr' ? \"Şanzıman Oranı Motoru\" : language === 'ja' ? \"ギアボックス比率エンジン\" : \"Gearbox Ratio Engine\"}", '{g.ratioEngine}'],
  ["{language === 'tr' ? \"Çok Kademeli Transmisyon Sentezi\" : language === 'ja' ? \"多段変速機設計\" : \"Multi-Stage Transmission Synthesis\"}", '{g.multiStage}'],
  ["{language === 'tr' ? \"Toplam Genel Oran\" : language === 'ja' ? \"総減速比\" : \"Total Global Ratio\"}", '{g.totalRatio}'],
  ["{language === 'tr' ? \"Motor Parametreleri\" : language === 'ja' ? \"モーター仕様\" : \"Motor Parameters\"}", '{g.motorParams}'],
  ["{language === 'tr' ? \"Motor Gücü (P)\" : language === 'ja' ? \"モーター出力 (P)\" : \"Motor Power (P)\"}", '{g.motorPower}'],
  ["{language === 'tr' ? \"Motor Devri (n1)\" : language === 'ja' ? \"モーター回転数 (n1)\" : \"Motor Speed (n1)\"}", '{g.motorSpeed}'],
  ["{language === 'tr' ? \"Giriş Torku\" : language === 'ja' ? \"初期トルク\" : \"Initial Torque\"}", '{g.initialTorque}'],
  ["{language === 'tr' ? \"Çıkış Mili Değerleri\" : language === 'ja' ? \"出力軸特性\" : \"Output Shaft Metrics\"}", '{g.outputMetrics}'],
  ["{language === 'tr' ? \"Çıkış Devri\" : language === 'ja' ? \"最終回転数\" : \"Final RPM\"}", '{g.finalRpm}'],
  ["{language === 'tr' ? \"Çıkış Torku\" : language === 'ja' ? \"最終トルク\" : \"Final Torque\"}", '{g.finalTorque}'],
  ["{language === 'tr' ? \"Toplam Verim\" : language === 'ja' ? \"総合効率\" : \"Global Efficiency\"}", '{g.globalEfficiency}'],
  ["{language === 'tr' ? \"Aktarım Kademeleri\" : language === 'ja' ? \"トランスミッション列\" : \"Transmission Cascade\"}", '{g.transmissionCascade}'],
  ["{language === 'tr' ? `Kademe ${idx + 1}` : language === 'ja' ? `段 ${idx + 1}` : `Stage ${idx + 1}`}", '{formatGearboxStage(g, idx + 1)}'],
  ["{language === 'tr' ? \"Pinyon (Z1)\" : language === 'ja' ? \"ピニオン (Z1)\" : \"Pinion (Z1)\"}", '{g.pinion}'],
  ["{language === 'tr' ? \"Çark (Z2)\" : language === 'ja' ? \"ギヤ (Z2)\" : \"Gear (Z2)\"}", '{g.gear}'],
  ["{language === 'tr' ? \"Verim (0.1 - 1.0)\" : language === 'ja' ? \"効率 (0.1 - 1.0)\" : \"Efficiency (0.1 - 1.0)\"}", '{g.efficiency}'],
  ["{language === 'tr' ? \"Oran\" : language === 'ja' ? \"ギヤ比\" : \"Ratio\"}", '{g.ratio}'],
  ["{language === 'tr' ? \"Çıkış Devri\" : language === 'ja' ? \"出力回転数\" : \"Out RPM\"}", '{g.outRpm}'],
  ["{language === 'tr' ? \"Çıkış Torku\" : language === 'ja' ? \"出力トルク\" : \"Out Nm\"}", '{g.outNm}'],
]);

// Fatigue
patch('src/components/modules/mechanical/FatigueAnalysisModule.tsx', [
  ["import { useI18nStore } from '@/store/i18nStore';", "import { useI18nStore } from '@/store/i18nStore';\nimport { getFatigueModuleStrings } from '@/locales/fatigueModuleTranslations';"],
  ['const { language } = useI18nStore();', 'const { language } = useI18nStore();\n    const f = getFatigueModuleStrings(language);'],
  ["{language === 'tr' ? \"Yorulma Ömrü\" : language === 'ja' ? \"疲労寿命\" : \"Fatigue Life\"}", '{f.fatigueLife}'],
  ["{language === 'tr' ? \"Yorulma Limiti Analizi\" : language === 'ja' ? \"耐久限度解析\" : \"Endurance Limit Analysis\"}", '{f.enduranceAnalysis}'],
  ["{language === 'tr' ? \"Malzeme & Yük Ayarları\" : language === 'ja' ? \"材料 & 荷重設定\" : \"Material & Load Setup\"}", '{f.materialLoad}'],
  ["label={language === 'tr' ? \"Çekme Mukavemeti (S_ut)\" : language === 'ja' ? \"引張強さ (S_ut)\" : \"Ultimate Tensile (S_ut)\"}", 'label={f.ultimateTensile}'],
  ["label={language === 'tr' ? \"Akma Mukavemeti (S_y)\" : language === 'ja' ? \"降伏強度 (S_y)\" : \"Yield Strength (S_y)\"}", 'label={f.yieldStrength}'],
  ["label={language === 'tr' ? \"Genlik Gerilmesi (σ_a)\" : language === 'ja' ? \"応力振幅 (σ_a)\" : \"Alternating Stress (σ_a)\"}", 'label={f.altStress}'],
  ["label={language === 'tr' ? \"Ortalama Gerilme (σ_m)\" : language === 'ja' ? \"平均応力 (σ_m)\" : \"Mean Stress (σ_m)\"}", 'label={f.meanStress}'],
  ["{language === 'tr' ? \"Marin Düzeltme Katsayıları\" : language === 'ja' ? \"マリン修正係数\" : \"Marin Factors (k_a, k_b, k_c)\"}", '{f.marinFactors}'],
  ["label={language === 'tr' ? \"Yüzey Faktörü (k_a)\" : language === 'ja' ? \"表面状態 (k_a)\" : \"Surface (k_a)\"}", 'label={f.surfaceKa}'],
  ["label={language === 'tr' ? \"Boyut Faktörü (k_b)\" : language === 'ja' ? \"寸法効果 (k_b)\" : \"Size (k_b)\"}", 'label={f.sizeKb}'],
  ["label={language === 'tr' ? \"Yük Faktörü (k_c)\" : language === 'ja' ? \"荷重の種類 (k_c)\" : \"Load (k_c)\"}", 'label={f.loadKc}'],
  ["? (language === 'tr' ? 'SONSUZ ÖMÜR ONAYLANDI' : language === 'ja' ? '無限寿命を確認' : 'INFINITE LIFE CONFIRMED')", '? f.infiniteLife'],
  [": (language === 'tr' ? 'UYARI: YORULMA HASARI BEKLENİYOR' : language === 'ja' ? '警告: 疲労破壊の危険あり' : 'WARNING: FATIGUE FAILURE PREDICTED')", ': f.fatigueWarning'],
  ["{language === 'tr' ? \"Genel Güvenlik Faktörü (En Düşük)\" : language === 'ja' ? \"最小安全率 (FOS)\" : \"Overall Factor of Safety (min)\"}", '{f.overallFos}'],
  ["{language === 'tr' ? \"Yorulma Sınırı (Se)\" : language === 'ja' ? \"耐久限度 (Se)\" : \"Endurance Limit (Se)\"}", '{f.enduranceLimit}'],
  ["<Zap size={14} /> {language === 'tr' ? \"ANLIK MODİFİYE GOODMAN DİYAGRAMI\" : language === 'ja' ? \"修正グッドマン線図 (リアルタイム)\" : \"LIVE MODIFIED GOODMAN DIAGRAM\"}", '<Zap size={14} /> {f.goodmanDiagram}'],
  ["{language === 'tr' ? `Yük (${inputs.sigma_m}, ${inputs.sigma_a})` : `Load (${inputs.sigma_m}, ${inputs.sigma_a})`}", '{`${f.loadPoint} (${inputs.sigma_m}, ${inputs.sigma_a})`}'],
  ["{language === 'tr' ? \"Yorulma Sınırı Aşıldı\" : language === 'ja' ? \"疲労限界領域超過\" : \"Fatigue Envelope Exceeded\"}", '{f.envelopeExceeded}'],
  ['REGEX:\\{language === \'tr\' \\s*\\? \"Çalışma gerilme kombinasyonu Goodman/Langer güvenli bölgesinin dışındadır\\. Sonsuz ömür garanti edilemez\\.\"\\s*: language === \'ja\'\\s*\\? \"動作応力状態がグッドマン/ランガーの安全領域を超えています。無限寿命は保証されません。\"\\s*: \"Operating stress combination lies outside the Goodman/Langer safe zone\\. Infinite life cannot be guaranteed\\.\"\\s*\\}', '{f.envelopeExceededDesc}'],
]);

console.log('Wire script done');

// Bearings OS
patch('src/components/modules/mechanical/BearingsModule.tsx', [
  ["import { useI18nStore } from '@/store/i18nStore';", "import { useI18nStore } from '@/store/i18nStore';\nimport { getBearingsOsModuleStrings, getBearingOsFilterLabel } from '@/locales/bearingsOsModuleTranslations';"],
  ['const { language, t } = useI18nStore();', 'const { language, t } = useI18nStore();\n    const bos = getBearingsOsModuleStrings(language);'],
  ['REGEX:label: language === \'tr\' \\? \'[^\']+\' : language === \'de\' \\? \'[^\']+\' : language === \'ja\' \\? \'[^\']+\' : \'[^\']+\'', 'label: getBearingOsFilterLabel(bos, id)'],
  ["{language === 'tr' ? 'İç Çap: Tümü' : 'Bore: All'}", '{bos.boreAll}'],
  ["{language === 'tr' ? 'Kütle' : 'Mass'}", '{bos.mass}'],
  ["{language === 'tr' ? 'Sapma Bölgeleri (µm)' : 'Deviation Zones (µm)'}", '{bos.deviationZones}'],
  ["<span>{language === 'tr' ? 'Bilezik' : 'Bore'}</span>", '<span>{bos.bore}</span>'],
  ["<span>{language === 'tr' ? 'Mil' : 'Shaft'}</span>", '<span>{bos.shaft}</span>'],
]);
