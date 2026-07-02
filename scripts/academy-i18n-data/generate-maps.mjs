/**
 * Generates desc-map.json, intro-map.json, seo-title-map.json, seo-intro-map.json
 * and TR body override JSON files from title-map + EN articles.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INTRO_DESC } from './seed-data-sources/intro-desc.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const ARTICLES = path.join(ROOT, 'src/data/academy-articles');
const BODIES_TR = path.join(__dirname, 'bodies/tr');

const titleMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'title-map.json'), 'utf8'));
const seoIntroI18n = JSON.parse(fs.readFileSync(path.join(__dirname, 'seo-intro-i18n.json'), 'utf8'));
const calcs = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/data/seo-calculators/calculators.json'), 'utf8'),
);

const TR_DESC = {
  'engineering-units-and-standards':
    'SI ve İngiliz sistemleri, dönüşüm katsayıları ve ISO/DIN gibi yaygın standartlara giriş.',
  'fundamentals-of-statics':
    "Newton yasaları, kuvvet vektörleri ve statik denge koşulları (ΣF=0, ΣM=0).",
  'introduction-to-machine-elements':
    'Cıvata, rulman, dişli ve millerin temel tasarım kısıtları ve seçim mantığı.',
  'thread-geometry-standards':
    'ISO metrik, UN, Whitworth ve trapez profiller; tolerans sınıfları ve stress alanı.',
  'how-to-calculate-bolt-torque':
    'Ön yük, sürtünme katsayısı ve çap ile cıvata torku; VDI 2230 metodolojisi.',
  'bearing-life-calculation-explained':
    'ISO 281 L10 formülü, dinamik yük derecesi C ve eşdeger yük P.',
  'motor-power-calculation':
    'Tork ve açısal hızdan motor gücü; verim ve birim dönüşümü.',
  'mechanics-of-materials-fundamentals':
    'Eksenel yük, normal ve kayma gerilmesi, Hooke yasası.',
  'mohrs-circle-stress-analysis':
    'Asal gerilmeler ve maksimum kayma gerilmesi; Mohr çemberi yöntemi.',
  'torsion-and-buckling-mechanics':
    'Mil burulması ve Euler burkulma formülü ile stabilite.',
  'beam-deflection-formula-explained':
    'Euler-Bernoulli kiriş teorisi, sehim limitleri ve servis kontrolleri.',
  'pressure-drop-calculation-guide':
    'Darcy-Weisbach ile boru basınç düşümü ve Reynolds sayısı.',
  'chip-breaker-logic':
    'Tornalama ve diş açmada talaş kontrolü, TQ geometrileri ve kesme kuvveti.',
};

const TR_INTRO = {
  'engineering-units-and-standards':
    'Mühendislik nicel bir disiplindir. Standartlaştırılmış birimler olmadan küresel üretim ve iş birliği mümkün olmazdı. Bu modülde Uluslararası Birim Sistemi (SI) ve İngiliz sistemini inceliyoruz.\n\nModern tedarik zincirleri kıtaları kapsar. SI uluslararası referanstır; İngiliz birimleri ABD havacılık ve eski makinelerde hâlâ kullanılır.\n\nBu ders AluCalc dönüşüm disiplinini kurar: kesin sabitler, tutarlı anlamlı rakamlar ve her ara sonuçta açık birim etiketleri.',
  'fundamentals-of-statics':
    'Statik, dengede kalan sistemleri inceler. Kuvvet ve moment etkileşimini anlamak tüm yapısal analiz ve makine tasarımının temelidir.\n\nHer makine gövdesi, bina mesneti ve kaldırma düzeneği eleman boyutlandırmadan önce dengeyi sağlamalıdır. Statik şekil değişimini ihmal eder — uygulanan yükler altında cisim hareketsiz kalır mı sorusunu yanıtlar.\n\nKafes Analizi motorunun kullandığı ΣF = 0 ve ΣM = 0 mantığını burada öğrenirsiniz: cismi izole edin, tüm dış etkileri hesaba katın, bilinmeyen tepkileri çözün.',
  'introduction-to-machine-elements':
    'Makineler standart yapı taşlarından oluşur: birleştirme, güç aktarımı, destekleme ve sızdırmazlık.\n\nBu modül cıvata, rulman, dişli ve kayış ailelerini AluCalc hesaplayıcılarına bağlar — her biri ISO/DIN tabanlıdır.\n\nÖzel parça icat etmeden önce katalog elemanı seçmeyi öğrenirsiniz; bu endüstriyel tasarımın verimlilik ilkesidir.',
  'thread-geometry-standards':
    'Diş standartları helis geometrisini kodlar. M16×1,5-6g bir tornacı için çap, adım ve tolerans bandını tanımlar.\n\nProfil açısı uyumsuzluğu (60° vs 55°) montajda diş yırtılmasına yol açar.\n\nBu ders Thread Geometry motoru ile VDI 2230 cıvata motoru arasındaki ortak parametreleri hizalar.',
  'how-to-calculate-bolt-torque':
    'Cıvata torku montajın kritik girdisidir; tasarım çıktısı ön yüktür (clamp force).\n\nT = K·F·d kısa yolu atölyede kullanılır; VDI 2230 tam sürtünme modelini uygular.\n\nAşırı tork akma veya diş yırtılmasına, yetersiz tork ise gevşemeye neden olur.',
  'bearing-life-calculation-explained':
    'L10 ömrü ISO 281\'e göre %90 güvenilirlikte %10 arıza oranını tanımlar.\n\n(C/P)^p ilişkisi AluCalc rulman çekirdeğiyle birebir aynıdır — topu yuvarlak için p=3.\n\nP > C durumu kritik uyarıdır: eşdeger yük katalog derecesini aşıyor.',
  'motor-power-calculation':
    'Motor boyutlandırmada P = T·n/9550 (kW) endüstride standarttır.\n\nAktarım kayıplarını (η) hesaba katmadan seçilen motor yetersiz kalır.\n\nBu ders güç aktarımı zincirinde motor, kayış ve mil boyutlandırmasını birbirine bağlar.',
  'mechanics-of-materials-fundamentals':
    'Statik dış kuvvetleri verir; malzeme mukavemeti iç direnci inceler.\n\nσ = F/A ve ε = σ/E ilişkisi tüm yapısal kontrollerin temelidir.\n\nElastik sınırın ötesi plastik bölgeye girer — bu ders lineer elastik aralıkta kalır.',
  'mohrs-circle-stress-analysis':
    'Mohr çemberi düzlem gerilme durumlarında asal gerilmeleri ve τ_max değerini bulur.\n\nσ₁, σ₂ ve kayma gerilmesi yorulma ve akma kontrollerinde kullanılır.\n\nAluCalc Mohr Circle Lab aynı geometrik inşayı interaktif uygular.',
  'torsion-and-buckling-mechanics':
    'Mil burulma τ = T·r/J ile; kolon burkulma Euler formülü P_cr = π²EI/(KL)² ile analiz edilir.\n\nBurkulma ani ve tehlikelidir — gerilme limitinin altında bile oluşabilir.\n\nEfektif uzunluk K·L seçimi mesnet koşullarına bağlıdır.',
  'beam-deflection-formula-explained':
    'Servis limitleri çoğu zaman akma limitinden önce devreye girer (L/360 vb.).\n\nEuler-Bernoulli formülleri AluCalc kiriş motorunda kullanılır.\n\nI ve E seçimi sehime en çok etki eden parametrelerdir.',
  'pressure-drop-calculation-guide':
    'Darcy-Weisbach boru kayıplarını hesaplar: ΔP = f·(L/D)·(ρV²/2).\n\nPompa basınç başlığı ve debi boyutlandırmasının temelidir.\n\nReynolds sayısı akış rejimini (laminer/türbülans) belirler.',
  'chip-breaker-logic':
    'CNC tornada talaş kontrolü yüzey kalitesi ve takım ömrünü belirler.\n\nAsimetrik uç ve radyal/ flanksal besleme kesme kuvvetini %15–21 azaltabilir.\n\nTQ geometrileri diş açmada talaş kırılmasını optimize eder.',
};

const SEO_TR = {
  '3-phase-power': '3 Fazlı Güç',
  'beam-deflection': 'Kiriş Sehimi',
  'belt-drive': 'Kayış Aktarımı',
  'bend-allowance': 'Sac Bükme Payı',
  'bending-moment': 'Eğilme Momenti',
  'biology-genetics': 'Populasyon Genetiği',
  'bolt-torque': 'Cıvata Torku',
  'centripetal-force': 'Merkezcil Kuvvet',
  'chemical-molarity': 'Molarite Hesabı',
  'column-buckling': 'Kolon Burkulması',
  'concrete-reinforcement': 'Betonarme Tasarım',
  'failure-diagnosis': 'Arıza Teşhisi',
  'failure-prediction': 'Yorulma Tahmini',
  'gear-contact-stress': 'Dişli Temas Gerilmesi',
  'gear-module': 'Dişli Modülü',
  'gear-ratio': 'Dişli Oranı',
  'heat-transfer-conduction': 'Isı İletimi',
  'hooke-law': 'Hooke Yasası',
  'ideal-gas-law': 'İdeal Gaz Yasası',
  'kinetic-energy': 'Kinetik Enerji',
  'lift-coefficient': 'Kaldırma Katsayısı',
  'machine-assembly': 'Makine Montajı',
  'machining-time': 'İşleme Süresi',
  'naval-hydrostatics': 'Denizcilik Hidrostatik',
  'newton-second-law': 'Newton 2. Yasası',
  'ohms-law': 'Ohm Yasası',
  'physics-solver': 'Fizik CAS Çözücü',
  'pressure-drop': 'Basınç Düşümü',
  pumps: 'Pompa Boyutlandırma',
  'radioactive-decay': 'Radyoaktif Bozunma',
  'reducer-lubrication': 'Redüktör Yağlama',
  'reynolds-number': 'Reynolds Sayısı',
  'rocket-equation': 'Roket Denklemi',
  'roller-chain-drive': 'Rulo Zincir Aktarımı',
  'simulation-fea': 'FEA Simülasyonu',
  'specific-gravity': 'Özgül Ağırlık',
  'thermal-expansion': 'Termal Genleşme',
  'thread-stripping-area': 'Diş Yırtılma Alanı',
  'timing-belt-design': 'Zaman Kayışı Tasarımı',
  'tolerance-stackup': 'Tolerans Yığını',
  'topology-optimization': 'Topoloji Optimizasyonu',
  'transformer-calculation': 'Trafo Hesabı',
  'truss-analysis': 'Kafes Analizi',
  'v-belt-power': 'V-Kayış Gücü',
  'voltage-drop': 'Gerilim Düşümü',
};

function cleanTitle(t) {
  return t.replace(/\s*&\s*Engineering Guide\s*-\s*AluCalc\s*$/i, '').replace(/\s*Calculator\s*$/i, '').trim();
}

const slugs = fs.readdirSync(ARTICLES).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));

const descMap = {};
const introMap = {};

for (const lang of Object.keys(titleMap)) {
  descMap[lang] = {};
  introMap[lang] = {};
  for (const slug of slugs) {
    const en = JSON.parse(fs.readFileSync(path.join(ARTICLES, `${slug}.json`), 'utf8'));
    if (lang === 'tr') {
      descMap.tr[slug] = TR_DESC[slug] ?? en.meta.description;
      introMap.tr[slug] = TR_INTRO[slug] ?? en.hero.intro;
    } else if (INTRO_DESC[lang]?.[slug]) {
      descMap[lang][slug] = INTRO_DESC[lang][slug].description;
      introMap[lang][slug] = INTRO_DESC[lang][slug].intro;
    } else {
      descMap[lang][slug] = en.meta.description;
      introMap[lang][slug] = en.hero.intro;
    }
  }
}

const seoTitleMap = { tr: SEO_TR };
const seoIntroMap = {};

function localizedSeoIntro(slug, lang, enIntro) {
  return seoIntroI18n[slug]?.[lang] ?? enIntro;
}

for (const lang of Object.keys(titleMap)) {
  seoTitleMap[lang] = lang === 'tr' ? SEO_TR : {};
  seoIntroMap[lang] = {};
  for (const c of calcs) {
    if (c.category === 'utilities') continue;
    const enIntro = c.seo?.intro ?? c.meta?.description ?? '';
    if (lang === 'tr' && !SEO_TR[c.slug]) {
      seoTitleMap.tr[c.slug] = cleanTitle(c.title ?? c.slug);
    }
    if (lang !== 'tr') {
      seoTitleMap[lang][c.slug] = cleanTitle(c.title ?? c.slug);
    }
    seoIntroMap[lang][c.slug] = localizedSeoIntro(c.slug, lang, enIntro);
  }
}

fs.writeFileSync(path.join(__dirname, 'desc-map.json'), JSON.stringify(descMap, null, 2), 'utf8');
fs.writeFileSync(path.join(__dirname, 'intro-map.json'), JSON.stringify(introMap, null, 2), 'utf8');
fs.writeFileSync(path.join(__dirname, 'seo-title-map.json'), JSON.stringify(seoTitleMap, null, 2), 'utf8');
fs.writeFileSync(path.join(__dirname, 'seo-intro-map.json'), JSON.stringify(seoIntroMap, null, 2), 'utf8');

fs.mkdirSync(BODIES_TR, { recursive: true });

const TR_BODIES = {
  'fundamentals-of-statics': {
    formula: { variables: { 'ΣF': 'Tüm kuvvetlerin toplamı (N)', 'ΣM': 'Tüm momentlerin toplamı (Nm)' } },
    stepByStep: [
      'Cisme etki eden tüm dış kuvvetleri belirleyin.',
      'Serbest cisim diyagramı (FBD) çizin.',
      'Kuvvetleri X, Y ve Z bileşenlerine ayırın.',
      'Denge denklemlerini uygulayın: ΣFx=0, ΣFy=0.',
      'Bilinmeyenleri bulmak için bir nokta etrafında moment alın: ΣM=0.',
      'Bilinmeyen sayısının bağımsız denge denklemlerine eşit olduğunu kontrol edin.',
      'Tepkileri ikinci bir moment merkezine koyarak doğrulayın.',
    ],
    whyThisMatters: [
      'Yapıların ve makinelerin hareket etmeden yük taşımasını garanti eder.',
      'Mesnet tepkilerinin hesaplanmasını sağlar.',
    ],
    commonMistakes: [
      'FBD\'de tüm kuvvetleri dahil etmemek.',
      'Kuvvet/moment yönünü (işaret) yanlış seçmek.',
      'Cisim ağırlığını önemsiz sanmak.',
    ],
    engineeringTip: 'Moment toplamında en çok bilinmeyenin olduğu noktayı seçin.',
    faq: [
      { question: 'Moment nedir?', answer: 'Bir kuvvetin cismi belirli bir nokta etrafında döndürme eğiliminin ölçüsüdür.' },
      { question: 'Serbest cisim diyagramı nedir?', answer: 'Tüm dış kuvvet ve momentlerin gösterildiği izole cisim çizimidir.' },
      { question: 'ΣF=0 iken ΣM≠0 olabilir mi?', answer: 'Evet. Her iki koşul da gerekli; aksi halde cisim döner.' },
      { question: 'Cisim ağırlığı ne zaman dahil edilir?', answer: 'Uygulanan yüklerle kıyaslanabilir olduğunda.' },
    ],
    learningObjectives: [
      'Doğru yönlü tam serbest cisim diyagramı çizmek',
      'ΣF = 0 ve ΣM = 0 ile bilinmeyen tepkileri çözmek',
      'Eğik kuvvetleri bileşenlerine ayırmak',
    ],
    keyTakeaways: [
      'FBD\'de eksik kuvvet tüm sonuçları geçersiz kılar',
      'En çok bilinmeyenin olduğu moment merkezini seçin',
      'Statik, tüm yapısal tasarımın ön koşuludur',
    ],
  },
};

for (const [slug, body] of Object.entries(TR_BODIES)) {
  fs.writeFileSync(path.join(BODIES_TR, `${slug}.json`), JSON.stringify(body, null, 2), 'utf8');
}

console.log('Generated maps and', Object.keys(TR_BODIES).length, 'TR body files');
