const fs = require('fs');
const path = require('path');

// We will read the transpiled or raw TS file? 
// Actually, it's easier to just read the raw file as a string, but replacing strings in a 1400-line TS file via regex is risky.
// Let's use ts-node to import it!
const { execSync } = require('child_process');

// Since we are in the Next.js project, we can run a ts-node script
const scriptContent = `
import { HANDBOOK_DATA } from '../data/handbookData';
import * as fs from 'fs';

const dictEn = {
    "Malzeme Bilimi": "Materials Science",
    "Çelik Sınıfları": "Steel Grades",
    "Genel amaçlı yapısal çelik. Kaynak edilebilirlik: Çok iyi. Kullanım: Yapısal çelik, profiller, borular.": "General purpose structural steel. Weldability: Very good. Use: Structural steel, profiles, pipes.",
    "Özellik": "Property", "Değer": "Value", "Birim": "Unit",
    "Akma Dayanımı (Re)": "Yield Strength (Re)",
    "Çekme Dayanımı (Rm)": "Tensile Strength (Rm)",
    "Uzama (A5)": "Elongation (A5)",
    "Yoğunluk": "Density",
    "Elastisite Modülü": "Elasticity Modulus",
    "Yüksek dayanımlı yapısal çelik. Kaynak edilebilirlik: İyi. Kullanım: Köprüler, vinçler, basınçlı kaplar.": "High-strength structural steel. Weldability: Good. Use: Bridges, cranes, pressure vessels.",
    "Orta karbonlu ıslah çeliği. Sertleştirilebilir. Kullanım: Mil, dişli, pim, cıvata.": "Medium carbon steel. Hardenable. Use: Shafts, gears, pins, bolts.",
    "Sertlik": "Hardness",
    "Karbon İçeriği": "Carbon Content",
    "SAE Çelik Standartları": "SAE Steel Standards",
    "SAE/AISI çelik sınıflandırma sistemi. İlk iki rakam alaşım grubunu, son iki rakam karbon yüzdesini (x100) gösterir.": "SAE/AISI steel classification system. First two digits indicate alloy group, last two digits indicate carbon percentage (x100).",
    "SAE No": "SAE No", "Tip": "Type", "Akma (MPa)": "Yield (MPa)", "Çekme (MPa)": "Tensile (MPa)", "Kullanım": "Usage",
    "Düşük C": "Low C", "Genel makine parçaları": "General machine parts",
    "Orta C": "Medium C", "Mil, dişli": "Shafts, gears",
    "Yüksek C": "High C", "Yay, takım": "Springs, tools",
    "Cr-Mo": "Cr-Mo", "Mil, cıvata, dişli": "Shafts, bolts, gears",
    "Ni-Cr-Mo": "Ni-Cr-Mo", "Uçak parçaları": "Aircraft parts",
    "Sementasyon dişli": "Case-hardened gears",
    "Alüminyum Alaşımları": "Aluminum Alloys",
    "En yaygın yapısal alüminyum. Mükemmel kaynak edilebilirlik ve korozyon direnci.": "Most common structural aluminum. Excellent weldability and corrosion resistance.",
    "Isıl Genleşme": "Thermal Expansion",
    "Isıl İletkenlik": "Thermal Conductivity",
    "Havacılık sınıfı yüksek dayanımlı alüminyum. Kaynak edilemez. Kullanım: Uçak yapıları, hassas parçalar.": "Aerospace grade high-strength aluminum. Non-weldable. Use: Aircraft structures, precision parts.",
    "Özgül Ağırlıklar": "Specific Weights",
    "Metal Yoğunlukları": "Metal Densities",
    "Yaygın kullanılan metallerin yoğunluk değerleri.": "Density values of commonly used metals.",
    "Malzeme": "Material", "Yoğunluk (kg/m³)": "Density (kg/m³)", "Özgül Ağırlık": "Specific Gravity",
    "Alüminyum": "Aluminum", "Bakır": "Copper", "Pirinç": "Brass", "Çelik": "Steel", "Paslanmaz Çelik": "Stainless Steel",
    "Dökme Demir": "Cast Iron", "Titanyum": "Titanium", "Kurşun": "Lead", "Çinko": "Zinc", "Altın": "Gold",
    "Mukavemet": "Strength of Materials",
    "Temel Kavramlar": "Basic Concepts",
    "Gerilme ve Gerinim": "Stress and Strain",
    "Gerilme (σ): Birim alana düşen kuvvet. Gerinim (ε): Birim uzama. Çelik için tipik gerilme-gerinim eğrisi elastik bölge, akma noktası, pekleşme ve kopma aşamalarını içerir.": "Stress (σ): Force per unit area. Strain (ε): Unit elongation. Typical stress-strain curve for steel includes elastic region, yield point, strain hardening, and fracture.",
    "Kavram": "Concept", "Formül": "Formula",
    "Normal Gerilme": "Normal Stress", "Kayma Gerilmesi": "Shear Stress", "Gerinim": "Strain", "Hooke Yasası": "Hooke's Law", "Poisson Oranı": "Poisson's Ratio",
    "Emniyet Katsayısı": "Safety Factor",
    "S = Akma Dayanımı / Çalışma Gerilmesi. Statik yükler: S = 1.5-2.0. Dinamik yükler: S = 2.0-3.0. Darbe yükleri: S = 3.0-5.0.": "S = Yield Strength / Working Stress. Static loads: S = 1.5-2.0. Dynamic loads: S = 2.0-3.0. Impact loads: S = 3.0-5.0.",
    "Eğme Momenti & Atalet Momenti": "Bending Moment & Moment of Inertia",
    "Eğme Gerilmesi": "Bending Stress",
    "Bir kiriş eğildiğinde, üst liflerinde basma, alt liflerinde çekme gerilmesi oluşur. Nötr eksen üzerinde gerilme sıfırdır.": "When a beam bends, compressive stress occurs in the upper fibers and tensile stress in the lower fibers. Stress is zero on the neutral axis.",
    "Sembol": "Symbol", "Tanım": "Definition",
    "Eğme Momenti": "Bending Moment", "Nötr eksene mesafe": "Distance to neutral axis", "Atalet Momenti": "Moment of Inertia", "Mukavemet Momenti (I/y_max)": "Section Modulus (I/y_max)",
    "Atalet Momentleri (I)": "Moments of Inertia (I)",
    "Kesit geometrisine bağlı atalet momenti değerleri.": "Moment of inertia values based on cross-section geometry.",
    "Kesit": "Cross-Section", "Ix Formülü": "Ix Formula", "W Formülü": "W Formula",
    "Dikdörtgen": "Rectangle", "Daire": "Circle", "Boru": "Pipe", "I Profil (IPE)": "I-Profile (IPE)", "Tablo değeri": "Table value", "Üçgen": "Triangle",
    "Burulma (Torsion)": "Torsion",
    "Burulma Formülleri": "Torsion Formulas",
    "Dairesel kesitlerde burulma gerilmesi ve burulma açısı hesabı.": "Torsion stress and angle calculation for circular cross-sections.",
    "J (Polar Atalet)": "J (Polar Inertia)",
    "Dolu Daire": "Solid Circle", "İçi Boş Daire": "Hollow Circle",
    "Burkulma (Buckling)": "Buckling",
    "Euler Burkulma Formülü": "Euler Buckling Formula",
    "İnce uzun çubukların basınç altında burkul dayanımı. Mesnet koşullarına göre K değişir.": "Buckling strength of slender rods under compression. K varies based on support conditions.",
    "Mesnet Durumu": "Support Condition", "K Değeri": "K Value", "Açıklama": "Description",
    "Ankastre-Serbest": "Fixed-Free", "Bayrak direği": "Flagpole",
    "Mafsallı-Mafsallı": "Pinned-Pinned", "Pin-pin": "Pin-pin",
    "Ankastre-Mafsallı": "Fixed-Pinned", "Sabit-pin": "Fixed-pin",
    "Ankastre-Ankastre": "Fixed-Fixed", "Sabit-sabit": "Fixed-fixed",
    "Mohr Dairesi": "Mohr's Circle",
    "Mohr Dairesi Formülleri": "Mohr's Circle Formulas",
    "2 boyutlu gerilme durumunda asal gerilmelerin ve maksimum kayma gerilmesinin hesaplanması. Mohr dairesi üzerinde σ₁, σ₂ asal gerilmeler yatay eksende, τ_max dikey eksende en üst noktada okunur.": "Calculation of principal stresses and maximum shear stress in 2D stress conditions. On Mohr's circle, σ₁, σ₂ principal stresses are read on the horizontal axis, τ_max on the vertical axis at the highest point.",
    "Kiriş Hesapları": "Beam Calculations",
    "Basit Mesnetli Kiriş": "Simply Supported Beam",
    "İki ucundan mesnetlenmiş kiriş formülleri. Tekil yük, yayılı yük ve üçgen yayılı yük durumları için moment ve sehim formülleri.": "Formulas for a beam supported at both ends. Moment and deflection formulas for point load, distributed load, and triangular distributed load cases.",
    "Yükleme": "Loading", "M_max": "M_max", "δ_max (Sehim)": "δ_max (Deflection)",
    "Ortada tekil yük (P)": "Point load at center (P)", "Yayılı yük (q)": "Distributed load (q)", "Üçgen yayılı": "Triangular distributed load",
    "Ankastre Kiriş": "Cantilever Beam",
    "Bir ucu ankastre (gömülü) kiriş formülleri.": "Formulas for a beam fixed at one end.",
    "M_max (Ankastre)": "M_max (Fixed)", "δ_max (Uç)": "δ_max (Tip)",
    "Uçta tekil yük (P)": "Point load at tip (P)",
    "Bağlantı Elemanları": "Fasteners",
    "Vida-Cıvata": "Screws & Bolts",
    "Cıvata Mukavemet Sınıfları": "Bolt Strength Classes",
    "ISO 898-1 standardına göre cıvata sınıfları. İlk sayı: çekme dayanımı/100. İkinci sayı: akma/çekme oranı×10. Örn: 8.8 → 800 MPa çekme, %80 akma oranı = 640 MPa akma.": "Bolt classes according to ISO 898-1 standard. First number: tensile strength/100. Second number: yield/tensile ratio×10. Ex: 8.8 → 800 MPa tensile, 80% yield ratio = 640 MPa yield.",
    "Sınıf": "Class",
    "Düşük C çelik": "Low C steel", "Orta C çelik": "Medium C steel", "Alaşımlı çelik, ıslah": "Alloy steel, quenched & tempered",
    "Cıvata Gerilme Hesabı": "Bolt Stress Calculation",
    "Cıvata çekme ve kayma gerilmesi hesapları.": "Bolt tensile and shear stress calculations.",
    "Metrik": "Metric", "d (mm)": "d (mm)", "Adım (mm)": "Pitch (mm)", "As (mm²)": "As (mm²)",
    "Kaynak Hesapları": "Welding Calculations",
    "Kaynak Türleri ve Hesapları": "Weld Types & Calculations",
    "Köşe kaynağı ve alın kaynağı gerilme hesapları.": "Fillet weld and butt weld stress calculations.",
    "Kaynak Tipi": "Weld Type",
    "Köşe Kaynağı": "Fillet Weld", "a: köşe ölçüsü, L: kaynak boyu": "a: throat size, L: weld length",
    "Alın Kaynağı": "Butt Weld", "t: sackalınlığı": "t: plate thickness",
    "Alın+Eğme": "Butt+Bending", "Birleşik yükleme": "Combined loading",
    "Kama Bağlantıları": "Key Joints",
    "Kama Hesabı": "Key Calculation",
    "Mil-kama bağlantısında ezme ve kesme kontrolü.": "Crushing and shearing check in shaft-key joints.",
    "Mil Çapı (mm)": "Shaft Dia (mm)", "b×h (mm)": "b×h (mm)", "L_min (mm)": "L_min (mm)",
    "Diş Tipleri (Bölüm J)": "Thread Types (Section J)",
    "Diş Tipleri ve Temel Profil": "Thread Types and Basic Profile",
    "Diş açma operasyonlarında kullanılan temel diş profilleri. Metrik (M), Birleştirilmiş (UN), Whitworth (W), Paralel Boru (G), Konik Boru (R/BSPT), NPT ve Trapezoid (Tr) diş tipleri mevcuttur.": "Basic thread profiles used in threading operations. Metric (M), Unified (UN), Whitworth (W), Parallel Pipe (G), Taper Pipe (R/BSPT), NPT, and Trapezoidal (Tr) thread types are available.",
    "Diş Tipi": "Thread Type", "Açı": "Angle", "Profil": "Profile", "Kullanım Alanı": "Application Area",
    "Üçgen (V)": "Triangle (V)", "Genel amaçlı, ISO standardı": "General purpose, ISO standard",
    "Birleştirilmiş (UNC/UNF)": "Unified (UNC/UNF)", "Amerikan/İngiliz standardı": "American/British standard",
    "Whitworth": "Whitworth", "Yuvarlak diş dibi": "Rounded crest/root", "İngiliz standardı (eski)": "British standard (legacy)",
    "Paralel Boru": "Parallel Pipe", "Sabit boru bağlantıları": "Fixed pipe connections",
    "Konik Boru": "Taper Pipe", "55° + 1°47' konik": "55° + 1°47' taper", "Sızdırmaz boru bağlantıları": "Sealed pipe connections",
    "Amerikan Konik Boru": "American Taper Pipe", "60° + 1°47' konik": "60° + 1°47' taper", "Amerikan boru bağlantısı": "American pipe connection",
    "Trapezoid": "Trapezoidal", "Yamuk profil": "Trapezoidal profile", "Hareket vidaları, vida presleri": "Lead screws, screw presses",
    "Metrik Diş Standart Adımları (M)": "Metric Thread Standard Pitches (M)",
    "ISO Metrik vida dişi. 60° diş açısı. Sembol: M (çap × adım). Örnek: M30 = 30mm çap, 3.5mm standart adım. İnce adım versiyonları da mevcuttur.": "ISO Metric screw thread. 60° thread angle. Symbol: M (diameter × pitch). Example: M30 = 30mm diameter, 3.5mm standard pitch. Fine pitch versions are also available.",
    "Diş": "Thread", "Çap d (mm)": "Diameter d (mm)", "Standart Adım P (mm)": "Standard Pitch P (mm)", "İnce Adım P (mm)": "Fine Pitch P (mm)",
    "Birleştirilmiş Diş (UN/UNC/UNF)": "Unified Thread (UN/UNC/UNF)",
    "Amerikan Birleştirilmiş vida dişi sistemi. 60° diş açısı. UNC: kaba diş (Unified National Coarse). UNF: ince diş (Unified National Fine). UNEF: ekstra ince diş. Ölçüler inch cinsinden, adım diş/inch cinsinden ifade edilir.": "American Unified screw thread system. 60° thread angle. UNC: Unified National Coarse. UNF: Unified National Fine. UNEF: extra fine thread. Dimensions are in inches, pitch is expressed in threads/inch.",
    "Boyut": "Size", "UNC (diş/inch)": "UNC (tpi)", "UNF (diş/inch)": "UNF (tpi)", "Dış Çap (mm)": "Outer Dia (mm)", "Dış Çap (inch)": "Outer Dia (inch)",
    "Boru Dişleri (G / R / NPT)": "Pipe Threads (G / R / NPT)",
    "Boru bağlantılarında kullanılan diş tipleri. G (BSP Paralel): Sızdırmaz olmayan bağlantılar, conta gerektirir. R/BSPT (Konik): 1°47' koniklik, sızdırmaz bağlantı sağlar. NPT: Amerikan standardı, 1°47' koniklik, 60° diş açısı.": "Thread types used in pipe connections. G (BSP Parallel): Non-sealing connections, requires gasket. R/BSPT (Taper): 1°47' taper, provides sealed connection. NPT: American standard, 1°47' taper, 60° thread angle.",
    "G/BSP Dış Çap (mm)": "G/BSP Outer Dia (mm)", "Diş/inch": "Threads/inch", "NPT Dış Çap (mm)": "NPT Outer Dia (mm)", "NPT Diş/inch": "NPT Tpi",
    "Whitworth Dişi (BSW)": "Whitworth Thread (BSW)",
    "İngiliz Whitworth standardı. 55° diş açısı, yuvarlak diş dibi profili. Eski İngiliz standardı olmasına rağmen bazı uygulamalarda hâlâ kullanılır. BSW (kaba diş) ve BSF (ince diş) versiyonları mevcuttur.": "British Whitworth standard. 55° thread angle, rounded root profile. Although an old British standard, it is still used in some applications. BSW (coarse thread) and BSF (fine thread) versions are available.",
    "Diş/inch (BSW)": "TPI (BSW)", "Diş/inch (BSF)": "TPI (BSF)",
    "Trapezoid Diş (Tr)": "Trapezoidal Thread (Tr)",
    "30° trapezoid profilli hareket vidası dişi. Yüksek eksenel kuvvet iletimi için tasarlanmıştır. Vida presleri, CNC tezgahları, kaldırma mekanizmaları ve kapı/kapak mekanizmalarında kullanılır. DIN 103 standardı.": "30° trapezoidal profile lead screw thread. Designed for high axial force transmission. Used in screw presses, CNC machines, lifting mechanisms, and door/gate mechanisms. DIN 103 standard.",
    "Dış Çap d (mm)": "Outer Dia d (mm)", "Adım P (mm)": "Pitch P (mm)", "Küçük Çap d3 (mm)": "Minor Dia d3 (mm)", "Profil Yüksekliği": "Profile Height",
    "Toleranslar & Yüzey": "Tolerances & Surface",
    "Geçme Toleransları": "Fit Tolerances",
    "ISO Geçme Sistemi": "ISO Fit System",
    "Delik bazlı geçme sistemi (H sistemi). H7/g6: Kayar geçme (boşluklu). H7/k6: Geçişme (sıfıra yakın). H7/p6: Sıkı geçme (presleme ile). Tolerans bölgesi renk kodlaması: yeşil=boşluk, sarı=geçişme, kırmızı=sıkı.": "Hole-basis fit system (H system). H7/g6: Sliding fit (clearance). H7/k6: Transition fit (near zero). H7/p6: Interference fit (press fit). Tolerance zone color coding: green=clearance, yellow=transition, red=interference.",
    "Geçme Tipi": "Fit Type", "Delik/Mil": "Hole/Shaft",
    "Bol boşluklu": "Loose clearance", "Menteşe, kapak": "Hinge, cover",
    "Boşluklu": "Clearance", "Yatak yatağı": "Bearing housing",
    "Kayar": "Sliding", "Hassas kılavuz": "Precision guide",
    "Geçişme": "Transition", "Dişli-mil": "Gear-shaft",
    "Sıkı": "Interference", "Rulman montajı": "Bearing mounting",
    "Zorlu sıkı": "Force fit", "Kalıcı montaj": "Permanent assembly",
    "Yüzey Pürüzlülüğü": "Surface Roughness",
    "Ra Değerleri ve İşlem Yöntemleri": "Ra Values and Processing Methods",
    "Yüzey pürüzlülüğü Ra değerleri ve bunlara ulaşılan işleme yöntemleri.": "Surface roughness Ra values and processing methods to achieve them.",
    "Ra (µm)": "Ra (µm)", "N Sınıfı": "N Class", "İşleme Yöntemi": "Processing Method",
    "Kum döküm": "Sand casting",
    "Kaba torna": "Rough turning",
    "Frezeleme": "Milling",
    "İnce torna": "Fine turning",
    "Taşlama": "Grinding",
    "İnce taşlama": "Fine grinding",
    "Honlama": "Honing",
    "Lepleme": "Lapping",
    "Süper finiş": "Super finishing",
    "Makine Elemanları": "Machine Elements",
    "Rulman Seçimi": "Bearing Selection",
    "Rulman Ömrü Hesabı": "Bearing Life Calculation",
    "ISO 281 standardına göre nominal ömür hesabı. Rulman, iç bilezik, dış bilezik, bilyalar ve kafes bileşenlerinden oluşur. Ömür hesabı dinamik yük kapasitesi (C) ve eşdeğer yük (P) oranına bağlıdır.": "Nominal life calculation according to ISO 281 standard. A bearing consists of inner ring, outer ring, balls, and cage components. Life calculation depends on the ratio of dynamic load capacity (C) to equivalent load (P).",
    "Dinamik yük kapasitesi": "Dynamic load capacity", "Eşdeğer dinamik yük": "Equivalent dynamic load", "Nominal ömür": "Nominal life", "Nominal ömür (saat)": "Nominal life (hours)", "Dönme hızı": "Rotational speed",
    "Rulman Çeşitleri": "Bearing Types",
    "Yaygın rulman tipleri ve uygulama alanları. Sabit bilyalı, açısal temaslı, silindirik makaralı, konik makaralı, iğne makaralı ve eksenel bilyalı rulman tipleri mevcuttur.": "Common bearing types and application areas. Deep groove ball, angular contact, cylindrical roller, tapered roller, needle roller, and thrust ball bearing types are available.",
    "Radyal": "Radial", "Aksiyel": "Axial", "Hız": "Speed",
    "Sabit bilyalı": "Deep groove ball", "İyi": "Good", "Orta": "Medium", "Yüksek": "High", "Elektrik motoru": "Electric motor",
    "Silindirik makaralı": "Cylindrical roller", "Çok iyi": "Very good", "Yok": "None", "Dişli kutusu": "Gearbox",
    "Konik makaralı": "Tapered roller", "Tekerlek göbeği": "Wheel hub",
    "İğne makaralı": "Needle roller", "Dar alanlarda": "Tight spaces",
    "Eklem yatağı": "Spherical plain", "Düşük": "Low", "Eklemli bağlantı": "Articulated joint"
};

const translateObj = (obj, dict) => {
    if (typeof obj === "string") {
        return dict[obj] || obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => translateObj(item, dict));
    }
    if (typeof obj === "object" && obj !== null) {
        const newObj = {};
        for (const key in obj) {
            if (key === "id" || key === "icon" || key === "image" || key === "formula") {
                newObj[key] = obj[key];
            } else if (key === "tags") {
                newObj[key] = obj[key]; // Keep tags mostly TR/EN generic
            } else {
                newObj[key] = translateObj(obj[key], dict);
            }
        }
        return newObj;
    }
    return obj;
};

const enData = translateObj(HANDBOOK_DATA, dictEn);

const exportString = "import { HandbookChapter } from './handbookData';\\n\\nexport const HANDBOOK_DATA_EN: HandbookChapter[] = " + JSON.stringify(enData, null, 4) + ";\\n";
fs.writeFileSync(path.join(__dirname, '../data/locales/handbook_en.ts'), exportString);
console.log("SUCCESS");
`;

fs.writeFileSync(path.join(__dirname, 'scripts', 'translate_handbook.ts'), scriptContent);
