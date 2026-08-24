import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src/modules/civil/ConcreteReinforcement/index.tsx');
let s = fs.readFileSync(p, 'utf8');

if (!s.includes('getConcreteReinforcementStrings')) {
  s = s.replace(
    "import { useOSStore } from '@/store/osStore';",
    "import { useOSStore } from '@/store/osStore';\nimport { getConcreteReinforcementStrings, formatConcreteDeficitMsg } from '@/locales/concreteReinforcementTranslations';"
  );
  s = s.replace(
    'const civilDict = dict?.civil || {};',
    'const civilDict = dict?.civil || {};\n    const c = getConcreteReinforcementStrings(language);'
  );
}

const pairs = [
  [`{language === 'tr' ? "Kiriş Geometrisi" : language === 'ja' ? "梁の寸法" : "Beam Geometry"}`, '{c.beamGeometry}'],
  [`label={language === 'tr' ? "Genişlik (b)" : language === 'ja' ? "幅 (b)" : "Width (b)"}`, 'label={c.width}'],
  [`label={language === 'tr' ? "Yükseklik (h)" : language === 'ja' ? "高さ (h)" : "Height (h)"}`, 'label={c.height}'],
  [`label={language === 'tr' ? "Paspayı (c_nom)" : language === 'ja' ? "かぶり厚さ (c_nom)" : "Cover (c_nom)"}`, 'label={c.cover}'],
  [`{language === 'tr' ? "Malzeme Özellikleri" : language === 'ja' ? "材料強度" : "Property Matrix"}`, '{c.propertyMatrix}'],
  [`label={language === 'tr' ? "Beton fck" : language === 'ja' ? "コンクリート fck" : "Concrete fck"}`, 'label={c.concreteFck}'],
  [`label={language === 'tr' ? "Çelik fyk" : language === 'ja' ? "鉄筋 fyk" : "Steel fyk"}`, 'label={c.steelFyk}'],
  [`{language === 'tr' ? "Tasarım Vektörü" : language === 'ja' ? "設計荷重" : "Design Vector"}`, '{c.designVector}'],
  [`label={language === 'tr' ? "Moment (M_ed)" : language === 'ja' ? "設計モーメント (M_ed)" : "Moment (M_ed)"}`, 'label={c.moment}'],
  [`label={language === 'tr' ? "Donatı Çapı" : language === 'ja' ? "鉄筋径" : "Bar Diameter"}`, 'label={c.barDiameter}'],
  [`label={language === 'tr' ? "Donatı Adedi" : language === 'ja' ? "本数" : "Quantity"}`, 'label={c.quantity}'],
  [`sub={language === 'tr' ? "ÇEKME DONATISI" : language === 'ja' ? "引張鉄筋" : "TENSION REBAR"}`, 'sub={c.tensionRebar}'],
  [`(language === 'tr' ? '% ORAN' : language === 'ja' ? '% 比率' : '% RATIO')`, 'c.percentRatio'],
  [`stats.K > 0.167 ? (language === 'tr' ? 'ÇİFT DONATILI' : 'X-COMP REQ') : (language === 'tr' ? 'TEK DONATILI' : language === 'ja' ? '単筋梁' : 'SINGLE REINFORCED')`, 'stats.K > 0.167 ? c.doubleReinforced : c.singleReinforced'],
  [`{stats.isSafe ? (language === 'tr' ? "EC2 Uyumlu" : language === 'ja' ? "EC2適合" : "Compliant with EC2") : (language === 'tr' ? "Yetersiz Donatı" : language === 'ja' ? "鉄筋量不足" : "Reinforcement Deficit")}`, '{stats.isSafe ? c.ec2Compliant : c.reinforcementDeficit}'],
  [`{language === 'tr' ? "Yerinde Dökme Yapısal Profil Kesiti" : language === 'ja' ? "構造断面図 (現場打ち)" : "Cast-in-Situ Structural Profile Section"}`, '{c.profileSection}'],
  [`{language === 'tr' ? "Ana Donatı" : language === 'ja' ? "主筋" : "Main Tension"}`, '{c.mainTension}'],
  [`{language === 'tr' ? "Etriyeler" : language === 'ja' ? "せん断補強筋" : "Shear Links"}`, '{c.shearLinks}'],
  [`{language === 'tr' ? "Tasarım Standardı" : language === 'ja' ? "設計基準" : "Design Code"}`, '{c.designCode}'],
  [`{language === 'tr' ? "Çelik Birim Uzaması" : language === 'ja' ? "鉄筋ひずみ" : "Steel Strain"}`, '{c.steelStrain}'],
  [`3.5‰ ({language === 'tr' ? "AKTI" : language === 'ja' ? "降伏" : "YIELDED"})`, `3.5‰ ({c.yielded})`],
  [`{language === 'tr' ? "İnşaat Çekirdeği" : language === 'ja' ? "計算エンジン" : "Civil Kernel"}`, '{c.civilKernel}'],
];

for (const [from, to] of pairs) {
  if (s.includes(from)) s = s.replace(from, to);
  else console.warn('missing:', from.slice(0, 50));
}

s = s.replace(
  /\{language === 'tr' \? `Donatı yetersizliği:[\s\S]*?`Reinforcement insufficient: beam cannot carry \$\{M_ed\} kNm design moment\.`\}/,
  '{formatConcreteDeficitMsg(c, M_ed)}'
);
s = s.replace(
  /\{language === 'tr' \? "Güvenli yük aktarımı için donatı adetini veya çapını artırın\."[\s\S]*?"Increase bar count or diameter for safe load transfer\."\}/,
  '{c.deficitHint}'
);

fs.writeFileSync(p, s);
console.log('concrete patched');
