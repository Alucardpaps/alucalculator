export const lessons = {
  "engineering-units-and-standards": {
    "meta": {
      "title": "Mühendislik Birimleri ve Standartlar (SI ve İngiliz)",
      "description": "SI ve İngiliz sistemleri, dönüşüm katsayıları ve ISO/DIN gibi yaygın standartları kapsayan mühendislik birimlerine giriş."
    },
    "hero": {
      "h1": "Mühendislik Birimleri ve Standartlar (SI ve İngiliz)",
      "intro": "Mühendislik nicel bir disiplindir. Standartlaştırılmış birimler olmadan küresel üretim ve iş birliği mümkün olmazdı. Bu modülde Uluslarararası Birim Sistemi (SI) ve İngiliz sistemini inceliyoruz.\n\nModern tedarik zincirleri kıtaları kapsar. SI sistemi uluslarararası referanstır; İngiliz birimleri ABD havacılık ve eski makinelerde hâlâ kullanılır.\n\nBu ders AluCalc dönüşüm disiplinini kurar: kesin sabitler, tutarlı anlamlı rakamlar ve her ara sonuçta açık birim etiketleri."
    },
    "formula": {
      "variables": {
        "mm": "Milimetre",
        "inch": "İnç (İngiliz)"
      }
    },
    "stepByStep": [
      "Kaynak birimi belirleyin (ör. mm).",
      "Hedef birimi belirleyin (ör. inç).",
      "Dönüşüm katsayısını uygulayın.",
      "Sonucun büyüklüğünü doğrulayın.",
      "Uygun anlamlı rakamlara yuvarlayın.",
      "Hesap çizelgesi başlığına birim sistemini yazın.",
      "Gaz yasalarında sıcaklığı kelvine çevirin."
    ],
    "example": {
      "inputs": [
        "Değer: 100 mm",
        "Hedef: İnç"
      ],
      "calculation": "100 / 25,4 ≈ 3,937 inç"
    },
    "whyThisMatters": [
      "Yanlış birim dönüşümü Mars Climate Orbiter kaybına yol açtı.",
      "Üretim toleransları genellikle mikron (μm) cinsinden verilir."
    ],
    "commonMistakes": [
      "Ondalık virgül ve nokta kullanımını karıştırmak.",
      "Kütle (kg) ve kuvvet (N) birimlerini karıştırmak.",
      "Sıcaklık birimi kaymalarını göz ardı etmek."
    ],
    "engineeringTip": "İç hesaplamalarda her zaman SI kullanın; İngiliz birimine yalnızca sunum gerektiğinde dönün.",
    "calculatorCta": {
      "label": "Profesyonel dönüşümler için Birim Dönüştürücüyü kullanın"
    },
    "faq": [
      {
        "question": "SI'de uzunluk temel birimi nedir?",
        "answer": "Metre (m)."
      },
      {
        "question": "25,4 mm/in neden kesindir?",
        "answer": "İnç 1959'da 1 in = 25,4 mm olarak tanımlandı."
      },
      {
        "question": "kg ve N birbirinin yerine kullanılabilir mi?",
        "answer": "Hayır. kg kütle; N kuvvet (kg·m/s²)."
      },
      {
        "question": "İngiliz birimine ne zaman dönülmeli?",
        "answer": "Yalnızca sunum aşamasında — hesap adımlarında SI kullanın."
      }
    ],
    "learningObjectives": [
      "SI ve İngiliz birimleri arasında belirsizlik olmadan dönüşüm",
      "Denge denklemlerinde kg ile N yer değiştirmemeyi tanıma",
      "Mikron toleranslar için ISO/DIN yuvarlama kuralları"
    ],
    "keyTakeaways": [
      "Her zaman içeride SI kullanın",
      "1 in = 25,4 mm kesindir",
      "Birim hataları sessizce yayılır"
    ],
    "supplementalParagraph": "Her AluCalc çekirdeği içeride SI varsayar. Bu ders karışık birim tuzaklarını çizim ve BOM'a ulaşmadan yakalamanızı öğretir."
  },
  "fundamentals-of-statics": {
    "meta": {
      "title": "Statik Temelleri (Denge Analizi)",
      "description": "Learn the core principles of engineering statics, including Newton's laws, force vectors, and the conditions for static equilibrium (ΣF=0, ΣM=0)."
    },
    "hero": {
      "h1": "Statik Temelleri (Denge Analizi)",
      "intro": "Statik, dengede olan sistemleri inceler. Kuvvet ve moment etkilesimini anlamak yapı ve makine tasariminin temelidir.\n\nHer govde boyutlandirmadan once dengeyi saglamalidir. Bu modul SigmaF=0 ve SigmaM=0 mantigini ogretir."
    }
  },
  "introduction-to-machine-elements": {
    "meta": {
      "title": "Makine Elemanlarına Giriş",
      "description": "An overview of common machine elements including fasteners, bearings, gears, and shafts. Learn why we use them and the basic design constraints."
    },
    "hero": {
      "h1": "Makine Elemanlarına Giriş",
      "intro": "Makineler standart yapı taslarindan olusur. Bu modul cıvata, rulman, disli ve kayis ailelerini AluCalc hesaplayicilarina baglar."
    }
  },
  "thread-geometry-standards": {
    "meta": {
      "title": "Diş Geometrisi ve Standartlar",
      "description": "A comprehensive guide to thread profiles, angles, and tolerances used in modern manufacturing. Covers ISO Metric, Unified National, Whitworth, and Trapezoidal standards."
    },
    "hero": {
      "h1": "Diş Geometrisi ve Standartlar",
      "intro": "Dis standartlari helis geometrisini kodlar. M16x1.5-6g bir tornaci icin cap, adim ve tolerans bandini tanimlar."
    }
  },
  "how-to-calculate-bolt-torque": {
    "meta": {
      "title": "Cıvata Torku Nasıl Hesaplanır",
      "description": "Learn how to calculate bolt torque for mechanical assembly using preload force, friction coefficient, and bolt diameter. Includes formula, examples, and VDI 2230 methodology."
    },
    "hero": {
      "h1": "Cıvata Torku Nasıl Hesaplanır",
      "intro": "Civata torku montajin kritik parametresidir. On yuk (clamp force) tasarim ciktisidir; tork atölye girdisidir."
    }
  },
  "bearing-life-calculation-explained": {
    "meta": {
      "title": "Rulman Ömrü Hesabı (ISO 281 L10)",
      "description": "Comprehensive guide to calculating bearing life using the ISO 281 L10 formula. Learn about dynamic load ratings, equivalent loads, and reliability factors."
    },
    "hero": {
      "h1": "Rulman Ömrü Hesabı (ISO 281 L10)",
      "intro": "L10 omru ISO 281'e gore %90 guvenilirlikte %10 arıza oranini tanimlar. (C/P)^p iliskisi AluCalc rulman cekirdegiyle aynidir."
    }
  },
  "motor-power-calculation": {
    "meta": {
      "title": "Motor Gücü Hesaplama",
      "description": "Learn how to calculate the power required for an electric motor based on torque and angular velocity. Includes efficiency and unit conversion guide."
    },
    "hero": {
      "h1": "Motor Gücü Hesaplama",
      "intro": "Motor boyutlandirmada P = T*n/9550 (kW) her katalogda kullanilir. Aktarim kayiplarini eklemeyi unutmayin."
    }
  },
  "mechanics-of-materials-fundamentals": {
    "meta": {
      "title": "Malzeme Mukavemeti Temelleri",
      "description": "An introductory course to Mechanics of Materials (Strength of Materials). Learn about axial loading, normal stress, shear stress, and Hooke's Law."
    },
    "hero": {
      "h1": "Malzeme Mukavemeti Temelleri",
      "intro": "Statik dis kuvvetleri verir; malzeme mukavemeti ic direnci inceler. sigma=F/A ve epsilon=sigma/E temelidir."
    }
  },
  "mohrs-circle-stress-analysis": {
    "meta": {
      "title": "Mohr Çemberi Gerilme Analizi",
      "description": "Learn how to use Mohr's Circle to determine principal stresses and maximum shear stress in a material. Essential for advanced structural engineering and failure analysis."
    },
    "hero": {
      "h1": "Mohr Çemberi Gerilme Analizi",
      "intro": "Mohr cemberi duzlem gerilme durumlarinda asal gerilmeleri bulur. sigma1, sigma2 ve tau_max tasarim kontrollerinde kullanilir."
    }
  },
  "torsion-and-buckling-mechanics": {
    "meta": {
      "title": "Burulma ve Burkulma Mekaniği",
      "description": "An analysis of rotational twisting (torsion) in shafts and sudden failure in columns (buckling) under compressive loads. Based on Euler's formula."
    },
    "hero": {
      "h1": "Burulma ve Burkulma Mekaniği",
      "intro": "Mil burulma ve ince kolon burkulma kararliligi analizidir. Euler Pcr = pi^2*E*I/(K*L)^2 formulu kritik."
    }
  },
  "beam-deflection-formula-explained": {
    "meta": {
      "title": "Kiriş Sehimi Formülleri",
      "description": "Understand the Euler-Bernoulli beam theory and how to calculate deflection for various loading conditions. Includes UDL, point load, and cantilever examples."
    },
    "hero": {
      "h1": "Kiriş Sehimi Formülleri",
      "intro": "Servis sinirlari cogu zaman verim sinirindan once gelir. Euler-Bernoulli formulleri AluCalc kiris motorunda kullanilir."
    }
  },
  "pressure-drop-calculation-guide": {
    "meta": {
      "title": "Borularda Basınç Düşümü",
      "description": "Learn how to calculate pressure loss in fluid systems using the Darcy-Weisbach equation. Understand the roles of friction factor and Reynolds number."
    },
    "hero": {
      "h1": "Borularda Basınç Düşümü",
      "intro": "Darcy-Weisbach boru kayiplarini hesaplar. Pompa basinc basligi ve debi boyutlandirmasinin temelidir."
    }
  },
  "chip-breaker-logic": {
    "meta": {
      "title": "Talaş Kırıcı Mantığı",
      "description": "An advanced machining module exploring chip control in threading. Learn about asymmetric point design, radial feed vs. modified flank feed, and cutting force reduction."
    },
    "hero": {
      "h1": "Talaş Kırıcı Mantığı",
      "intro": "CNC tornada talas kontrolu yuzey ve takim omrunu belirler. TQ geometrileri kesme kuvvetini %15-21 azaltabilir."
    }
  }
};

export { walkthroughs, quizzes, practice } from './tr-academy-extras.mjs';

export const seoGuides = {};
