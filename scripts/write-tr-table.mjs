/**
 * Writes scripts/academy-i18n-tables/tr.json with complete Turkish translations.
 * Run: node scripts/write-tr-table.mjs
 */
import fs from 'fs';
import path from 'path';
import { ACADEMY_ENGINE_WALKTHROUGHS } from '../src/data/academyEngineWalkthroughs.ts';
import { ACADEMY_QUIZZES } from '../src/data/academyQuizzes.ts';

const OUT = path.join('scripts', 'academy-i18n-tables', 'tr.json');

const lessons = {
  'engineering-units-and-standards': {
    meta: {
      title: 'Mühendislik Birimleri ve Standartlar (SI ve İngiliz)',
      description:
        'SI ve İngiliz sistemleri, dönüşüm katsayıları ve ISO/DIN gibi yaygın standartları kapsayan mühendislik birimlerine giriş.',
    },
    hero: {
      h1: 'Mühendislik Birimleri ve Standartlar (SI ve İngiliz)',
      intro:
        'Mühendislik nicel bir disiplindir. Standartlaştırılmış birimler olmadan küresel üretim ve iş birliği mümkün olmazdı. Bu modülde Uluslararası Birim Sistemi (SI) ve İngiliz sistemini, aralarında doğru dönüşümü nasıl yapacağınızı inceliyoruz.\n\nModern tedarik zincirleri kıtaları kapsar — milimetre cinsinden bir çizim, inç kalibre edilmiş takımla uyumlu olmalıdır. SI sistemi (metre, kilogram, saniye) uluslararası referanstır; İngiliz birimleri ABD havacılık ve eski makinelerde hâlâ kullanılır.\n\nBu ders, AluCalc boyunca kullanılan dönüşüm disiplinini kurar: kesin sabitler, tutarlı anlamlı rakamlar ve her ara sonuçta açık birim etiketleri.',
    },
    formula: { variables: { mm: 'Milimetre', inch: 'İnç (İngiliz)' } },
    stepByStep: [
      'Kaynak birimi belirleyin (ör. mm).',
      'Hedef birimi belirleyin (ör. inç).',
      'Dönüşüm katsayısını uygulayın.',
      'Sonucun büyüklüğünü doğrulayın.',
      'Uygun anlamlı rakamlara yuvarlayın.',
      'Hesap çizelgesi başlığına birim sistemini yazın.',
      'Gaz yasaları veya termal genleşmede sıcaklığı kelvine çevirin.',
    ],
    example: {
      inputs: ['Değer: 100 mm', 'Hedef: İnç'],
      calculation: '100 / 25,4 ≈ 3,937 inç',
    },
    whyThisMatters: [
      'Yanlış birim dönüşümü Mars Climate Orbiter kaybına yol açtı.',
      'Üretim toleransları genellikle mikron (μm) cinsinden verilir ve yüksek hassasiyet gerektirir.',
    ],
    commonMistakes: [
      'Farklı bölgelerde ondalık virgül ve nokta kullanımını karıştırmak.',
      'Hesaplamalarda kütle (kg) ve kuvvet (N) birimlerini karıştırmak.',
      'Sıcaklık birimi kaymalarını (Celsius → Kelvin) göz ardı etmek.',
    ],
    engineeringTip:
      'İç hesaplamalarda her zaman SI kullanın; İngiliz birimine yalnızca sunum gerektiğinde dönün.',
    calculatorCta: {
      label: 'Profesyonel dönüşümler için Birim Dönüştürücüyü kullanın',
    },
    faq: [
      { question: 'SI\'de uzunluk temel birimi nedir?', answer: 'Metre (m).' },
      {
        question: '25,4 mm/in neden kesindir?',
        answer: 'İnç 1959\'da 1 in = 25,4 mm olarak yeniden tanımlandı — hassas geçişlerde 25,0 kullanmayın.',
      },
      {
        question: 'kg ve N birbirinin yerine kullanılabilir mi?',
        answer: 'Hayır. kg kütle; N kuvvet (kg·m/s²). Ağırlık newton cinsinden kütle × yerçekimi.',
      },
      {
        question: 'İngiliz birimine ne zaman dönülmeli?',
        answer: 'Yalnızca sunum aşamasında — tüm hesap adımlarında SI kullanın.',
      },
    ],
    learningObjectives: [
      'SI ve İngiliz uzunluk, kütle ve kuvvet birimleri arasında belirsizlik olmadan dönüşüm',
      'Denge denklemlerinde kütle (kg) ile kuvvet (N) yer değiştirmemeyi tanıma',
      'Mikron cinsinden toleranslar için ISO/DIN yuvarlama kurallarını uygulama',
    ],
    keyTakeaways: [
      'Her zaman içeride SI kullanın; dönüşümü yalnızca sunumda yapın',
      '1 in = 25,4 mm kesindir — hassas geçişlerde asla yuvarlamayın',
      'Birim hataları sessizce yayılır ve sahada arızaya dönüşür',
    ],
    supplementalParagraph:
      'Her AluCalc çekirdeği içeride SI varsayar. Bu ders, Mars Orbiter sonrası NASA\'nın talep ettiği disiplinle karışık birim tuzaklarını çizim ve BOM\'a ulaşmadan yakalamanızı öğretir.',
  },
  'fundamentals-of-statics': {
    meta: {
      title: 'Statik Temelleri (Denge Analizi)',
      description:
        'Newton yasaları, kuvvet vektörleri ve statik denge koşulları (ΣF=0, ΣM=0) dahil mühendislik statiğinin temel ilkeleri.',
    },
    hero: {
      h1: 'Statik Temelleri (Denge Analizi)',
      intro:
        'Statik, dengede olan fiziksel sistemleri inceleyen mekanik dalıdır. Kuvvetlerin ve momentlerin etkileşimini anlamak, tüm yapı analizi ve makine tasarımının temelidir.\n\nHer makine gövdesi, bina desteği ve kaldırma düzeneği, eleman boyutlandırmadan önce dengeyi sağlamalıdır. Statik şekil değişimini yok sayar — cisim uygulanan yükler altında hareketsiz kalır mı sorusunu yanıtlar.\n\nKiriş Analizi çekirdeğindeki ΣF = 0 ve ΣM = 0 mantığını kullanacaksınız: cisimi izole edin, her dış etkiyi hesaba katın ve bilinmeyen tepkileri çözün.',
    },
    formula: { variables: { 'ΣF': 'Tüm kuvvetlerin toplamı (N)', 'ΣM': 'Tüm momentlerin toplamı (Nm)' } },
    stepByStep: [
      'Cisme etki eden tüm dış kuvvetleri belirleyin.',
      'Serbest cisim diyagramı (FBD) çizin.',
      'Kuvvetleri X, Y ve Z bileşenlerine ayırın.',
      'Denge denklemlerini uygulayın: ΣFx=0, ΣFy=0.',
      'Bilinmeyenleri bulmak için bir nokta etrafında moment toplayın: ΣM=0.',
      'Bilinmeyen sayısı bağımsız denge denklemlerine eşit mi kontrol edin.',
      'Tepkileri ikinci bir moment merkezine yerleştirip doğrulayın.',
    ],
    example: {
      inputs: ['Kuvvet 1: 100 N (Yukarı)', 'Tepki 1: R1 (Aşağı)'],
      calculation: 'ΣFy = 100 - R1 = 0 → R1 = 100 N',
    },
    whyThisMatters: [
      'Yapıların ve makinelerin hareket etmeden veya kırılmadan yük taşımasını sağlar.',
      'Mesnet tepkilerinin hesaplanmasına olanak verir.',
    ],
    commonMistakes: [
      'FBD\'de tüm kuvvetleri dahil etmeyi unutmak.',
      'Kuvvet veya moment yönünü (işaretini) yanlış belirlemek.',
      'Cisim ağırlığını önemli olduğunda ihmal etmek.',
    ],
    engineeringTip:
      'Moment toplamında en çok bilinmeyen kuvveti olan noktayı seçerek cebiri sadeleştirin.',
    calculatorCta: { label: 'Gelişmiş yapı araçlarımızla kiriş dengesini analiz edin' },
    faq: [
      {
        question: 'Moment nedir?',
        answer: 'Bir kuvvetin cisimi belirli bir nokta veya eksen etrafında döndürme eğiliminin ölçüsüdür.',
      },
      {
        question: 'Serbest cisim diyagramı nedir?',
        answer: 'Tüm dış kuvvet ve momentleri gösteren izole cisim çizimi — her statik çözümün zorunlu ilk adımı.',
      },
      {
        question: 'ΣF = 0 ama ΣM ≠ 0 olursa denge bozulur mu?',
        answer: 'Evet. Her iki koşul gerekli; net kuvvet sıfır olsa bile cisim dönebilir.',
      },
      {
        question: 'Cisim ağırlığı ne zaman dahil edilir?',
        answer: 'Uygulanan yüklerle karşılaştırılabilir olduğunda — özellikle uzun kirişler ve ağır bağlantılarda.',
      },
    ],
    learningObjectives: [
      'Doğru kuvvet yönleriyle eksiksiz serbest cisim diyagramları çizmek',
      'Bilinmeyen tepkileri çözmek için ΣF = 0 ve ΣM = 0 uygulamak',
      'Eğik kuvvetleri dik bileşenlere ayırmak',
    ],
    keyTakeaways: [
      'FBD\'de eksik bir kuvvet tüm sonuçları geçersiz kılar',
      'Cebiri sadeleştirmek için en çok bilinmeyeni olan moment merkezini seçin',
      'Statik, her yapı ve makine tasarım kontrolünün ön koşuludur',
    ],
    supplementalParagraph:
      'Kiriş veya cıvata boyutlandırmadan önce mesnet tepkilerini bilmelisiniz. AluCalc\'teki kiriş ve truss çekirdekleri dengeyi kurduğunuzu varsayar — bu modül o temeli öğretir.',
  },
};

// Walkthroughs & quizzes translated below in full file - truncated for initial write
const walkthroughs = {};
const quizzes = {};
const seoGuides = {};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ lessons, walkthroughs, quizzes, seoGuides }), 'utf8');
console.log('Written tr.json (partial - run full generator)');
