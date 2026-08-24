/**
 * Engineering Handbook - Structured Reference Data
 * Comprehensive engineering reference for mechanical engineers.
 */

// ???????????????????????????????????????????????????????????????
// TYPES
// ???????????????????????????????????????????????????????????????

export interface HandbookEntry {
    id: string;
    title: string;
    content: string; // Markdown-like text
    formula?: string;
    table?: { headers: string[]; rows: string[][] };
    tags: string[];
    image?: string; // Path to illustration
}

export interface HandbookSection {
    id: string;
    title: string;
    icon: string;
    entries: HandbookEntry[];
    image?: string; // Section illustration
}

export interface HandbookChapter {
    id: string;
    title: string;
    icon: string;
    sections: HandbookSection[];
}

// ???????????????????????????????????????????????????????????????
// DATA
// ???????????????????????????????????????????????????????????????

import { CHEMICAL_COMPOUNDS } from './chemicalCompounds';

// Auto-generate handbook entries from chemical compounds
const chemicalEntries: HandbookEntry[] = CHEMICAL_COMPOUNDS.map(c => {
    let content = c.description;
    if (c.synthesis) content += `\n\n**Sentez / Üretim:**\n${c.synthesis}`;
    if (c.applications) content += `\n\n**Endüstriyel Kullanım:**\n${c.applications}`;

    return {
        id: c.id,
        title: `${c.name} (${c.formula})`,
        content: content,
        tags: ['kimya', c.category.toLowerCase(), c.name.toLowerCase(), c.formula.toLowerCase()],
        table: {
            headers: ['Özellik', 'Değer'],
            rows: [
                ['Kategori', c.category],
                ['Bağ Tipi', c.bondType || 'Bilinmiyor'],
                ['Molar Kütle', c.properties.molarMass ? `${c.properties.molarMass} g/mol` : 'N/A'],
                ['Yoğunluk', c.properties.density ? `${c.properties.density} g/cm³` : 'N/A'],
                ['STP Durumu', c.properties.stateAtSTP || 'N/A']
            ]
        }
    }
});

const chemistryChapter: HandbookChapter = {
    id: 'chemistry',
    title: 'Kimya Veritabanı',
    icon: '🧪',
    sections: [
        {
            id: 'compounds-database',
            title: 'Kimyasal Bileşikler & Özellikleri',
            icon: '⚗️',
            entries: chemicalEntries
        }
    ]
};

export const HANDBOOK_DATA: HandbookChapter[] = [
    chemistryChapter,
    // --- CHAPTER 1: MALZEME BILIMI ---
    {
        id: 'materials',
        title: 'Malzeme Bilimi',
        icon: '🔬',
        sections: [
            {
                id: 'steel-grades',
                title: 'Çelik Sınıfları',
                icon: '🏗️',
                entries: [
                    {
                        id: 'st37',
                        title: 'St37 (S235JR)',
                        content: 'Genel amaçlı yapısal çelik. Kaynak edilebilirlik: Çok iyi. Kullanım: Yapısal çelik, profiller, borular.',
                        tags: ['çelik', 'st37', 's235', 'yapısal'],
                        table: {
                            headers: ['Özellik', 'Değer', 'Birim'],
                            rows: [
                                ['Akma Dayanımı (Re)', '235', 'MPa'],
                                ['Çekme Dayanımı (Rm)', '360-510', 'MPa'],
                                ['Uzama (A5)', '26', '%'],
                                ['Yoğunluk', '7850', 'kg/m^3'],
                                ['Elastisite Modülü', '210', 'GPa'],
                            ]
                        }
                    },
                    {
                        id: 'st52',
                        title: 'St52 (S355JR)',
                        content: 'Yüksek dayanımlı yapısal çelik. Kaynak edilebilirlik: İyi. Kullanım: Köprüler, vinçler, basınçlı kaplar.',
                        tags: ['çelik', 'st52', 's355', 'yüksek dayanım'],
                        table: {
                            headers: ['Özellik', 'Değer', 'Birim'],
                            rows: [
                                ['Akma Dayanımı (Re)', '355', 'MPa'],
                                ['Çekme Dayanımı (Rm)', '490-630', 'MPa'],
                                ['Uzama (A5)', '22', '%'],
                                ['Yoğunluk', '7850', 'kg/m^3'],
                            ]
                        }
                    },
                    {
                        id: 'ck45',
                        title: 'Ck45 (C45)',
                        content: 'Orta karbonlu ıslah çeliği. Sertleştirilebilir. Kullanım: Mil, dişli, pim, cıvata.',
                        tags: ['çelik', 'ck45', 'c45', 'ıslah'],
                        table: {
                            headers: ['Özellik', 'Değer', 'Birim'],
                            rows: [
                                ['Akma Dayanımı', '370-490', 'MPa'],
                                ['Çekme Dayanımı', '650-800', 'MPa'],
                                ['Sertlik', '207', 'HB'],
                                ['Karbon İçeriği', '0.42-0.50', '%'],
                            ]
                        }
                    },
                    {
                        id: 'sae-steels',
                        title: 'SAE Çelik Standartları',
                        content: 'SAE/AISI çelik sınıflandırma sistemi. İlk iki rakam alaşım grubunu, son iki rakam karbon yüzdesini (x100) gösterir.',
                        tags: ['sae', 'aisi', 'çelik', 'standart'],
                        table: {
                            headers: ['SAE No', 'Tip', 'Akma (MPa)', 'Çekme (MPa)', 'Kullanım'],
                            rows: [
                                ['1020', 'Düşük C', '245', '395', 'Genel makine parçaları'],
                                ['1040', 'Orta C', '355', '620', 'Mil, dişli'],
                                ['1060', 'Yüksek C', '485', '815', 'Yay, takım'],
                                ['4140', 'Cr-Mo', '655', '1020', 'Mil, cıvata, dişli'],
                                ['4340', 'Ni-Cr-Mo', '860', '1080', 'Uçak parçaları'],
                                ['8620', 'Ni-Cr-Mo', '360', '530', 'Sementasyon dişli'],
                            ]
                        }
                    }
                ]
            },
            {
                id: 'aluminum',
                title: 'Alüminyum Alaşımları',
                icon: '🧪',
                entries: [
                    {
                        id: 'al-6061',
                        title: '6061-T6',
                        content: 'En yaygın yapısal alüminyum. Mükemmel kaynak edilebilirlik ve korozyon direnci.',
                        tags: ['alüminyum', '6061', 'yapısal'],
                        table: {
                            headers: ['Özellik', 'Değer', 'Birim'],
                            rows: [
                                ['Akma Dayanımı', '276', 'MPa'],
                                ['Çekme Dayanımı', '310', 'MPa'],
                                ['Elastisite Modülü', '69', 'GPa'],
                                ['Yoğunluk', '2700', 'kg/m^3'],
                                ['Isıl Genleşme', '23.6', 'm/m^3C'],
                                ['Isıl İletkenlik', '167', 'W/m^3K'],
                            ]
                        }
                    },
                    {
                        id: 'al-7075',
                        title: '7075-T6',
                        content: 'Havacılık sınıfı yüksek dayanımlı alüminyum. Kaynak edilemez. Kullanım: Uçak yapıları, hassas parçalar.',
                        tags: ['alüminyum', '7075', 'havacılık'],
                        table: {
                            headers: ['Özellik', 'Değer', 'Birim'],
                            rows: [
                                ['Akma Dayanımı', '503', 'MPa'],
                                ['Çekme Dayanımı', '572', 'MPa'],
                                ['Elastisite Modülü', '72', 'GPa'],
                                ['Yoğunluk', '2810', 'kg/m^3'],
                            ]
                        }
                    }
                ]
            },
            {
                id: 'density',
                title: 'Özgül Ağırlıklar',
                icon: '⚖️',
                entries: [
                    {
                        id: 'metal-densities',
                        title: 'Metal Yoğunlukları',
                        content: 'Yaygın kullanılan metallerin yoğunluk değerleri.',
                        tags: ['yoğunluk', 'özgül ağırlık', 'metal'],
                        table: {
                            headers: ['Malzeme', 'Yoğunluk (kg/m^3)', 'Özgül Ağırlık'],
                            rows: [
                                ['Alüminyum', '2700', '2.70'],
                                ['Bakır', '8960', '8.96'],
                                ['Pirinç', '8500', '8.50'],
                                ['Çelik', '7850', '7.85'],
                                ['Paslanmaz Çelik', '7900', '7.90'],
                                ['Dökme Demir', '7200', '7.20'],
                                ['Titanyum', '4500', '4.50'],
                                ['Kurşun', '11340', '11.34'],
                                ['Çinko', '7130', '7.13'],
                                ['Altın', '19300', '19.30'],
                            ]
                        }
                    }
                ]
            }
        ]
    },

    // ─── CHAPTER 2: MUKAVEMET ───
    {
        id: 'strength',
        title: 'Mukavemet',
        icon: '💪',
        sections: [
            {
                id: 'basic-concepts',
                title: 'Temel Kavramlar',
                icon: '📐',
                entries: [
                    {
                        id: 'stress-strain',
                        title: 'Gerilme ve Gerinim',
                        content: 'Gerilme (σ): Birim alana düşen kuvvet. Gerinim (ε): Birim uzama. Çelik için tipik gerilme-gerinim eğrisi elastik bölge, akma noktası, pekleşme ve kopma aşamalarını içerir.',
                        formula: 'σ = F / A    |    ε = ΔL / L₀    |    σ = E × ε',
                        image: '/handbook/stress_strain.png',
                        tags: ['gerilme', 'gerinim', 'stress', 'strain', 'elastisite'],
                        table: {
                            headers: ['Kavram', 'Formül', 'Birim'],
                            rows: [
                                ['Normal Gerilme', 'σ = F / A', 'MPa (N/mm²)'],
                                ['Kayma Gerilmesi', 'τ = V / A', 'MPa'],
                                ['Gerinim', 'ε = ΔL / L₀', 'mm/mm'],
                                ['Hooke Yasası', 'σ = E × ε', 'MPa'],
                                ['Poisson Oranı', 'ν = -ε_lateral / ε_axial', '-'],
                            ]
                        }
                    },
                    {
                        id: 'safety-factor',
                        title: 'Emniyet Katsayısı',
                        content: 'S = Akma Dayanımı / Çalışma Gerilmesi. Statik yükler: S = 1.5-2.0. Dinamik yükler: S = 2.0-3.0. Darbe yükleri: S = 3.0-5.0.',
                        formula: 'S = σ_akma / σ_çalışma',
                        tags: ['emniyet', 'güvenlik', 'katsayı', 'safety factor'],
                    }
                ]
            },
            {
                id: 'bending',
                title: 'Eğme Momenti & Atalet Momenti',
                icon: '↕️',
                entries: [
                    {
                        id: 'bending-stress',
                        title: 'Eğme Gerilmesi',
                        content: 'Bir kiriş eğildiğinde, üst liflerinde basma, alt liflerinde çekme gerilmesi oluşur. Nötr eksen üzerinde gerilme sıfırdır.',
                        formula: 'σ = M · y / I    |    σ_max = M / W',
                        tags: ['eğme', 'kiriş', 'bending', 'moment'],
                        table: {
                            headers: ['Sembol', 'Tanım', 'Birim'],
                            rows: [
                                ['M', 'Eğme Momenti', 'N·mm'],
                                ['y', 'Nötr eksene mesafe', 'mm'],
                                ['I', 'Atalet Momenti', 'mm⁴'],
                                ['W', 'Mukavemet Momenti (I/y_max)', 'mm³'],
                            ]
                        }
                    },
                    {
                        id: 'inertia-moments',
                        title: 'Atalet Momentleri (I)',
                        content: 'Kesit geometrisine bağlı atalet momenti değerleri (nötr eksen/centroidal eksen için).',
                        tags: ['atalet', 'moment', 'inertia', 'kesit'],
                        table: {
                            headers: ['Kesit', 'Ix Formülü', 'W Formülü'],
                            rows: [
                                ['Dikdörtgen', 'b·h³/12', 'b·h²/6'],
                                ['Daire', 'π·d⁴/64', 'π·d³/32'],
                                ['Boru', 'π(D⁴-d⁴)/64', 'π(D⁴-d⁴)/(32D)'],
                                ['I Profil (IPE)', 'Tablo değeri', 'I/y_max'],
                                ['Üçgen (centroid)', 'b·h³/36', 'b·h²/24'],
                                ['Üçgen (tabana göre)', 'b·h³/12', 'b·h²/6'],
                            ]
                        }
                    }
                ]
            },
            {
                id: 'torsion',
                title: 'Burulma (Torsion)',
                icon: '🔄',
                entries: [
                    {
                        id: 'torsion-formulas',
                        title: 'Burulma Formülleri',
                        content: 'Dairesel kesitlerde burulma gerilmesi ve burulma açısı hesabı.',
                        formula: 'τ = T · r / J    |    φ = T · L / (G · J)',
                        tags: ['burulma', 'torsion', 'mil', 'şaft'],
                        table: {
                            headers: ['Kesit', 'J (Polar Atalet)', 'τ_max'],
                            rows: [
                                ['Dolu Daire', 'π·d⁴/32', '16T/(π·d³)'],
                                ['İçi Boş Daire', 'π(D⁴-d⁴)/32', '16T·D/(π(D⁴-d⁴))'],
                            ]
                        }
                    }
                ]
            },
            {
                id: 'buckling',
                title: 'Burkulma (Buckling)',
                icon: '📏',
                entries: [
                    {
                        id: 'euler-buckling',
                        title: 'Euler Burkulma Formülü',
                        content: 'İnce uzun çubukların basınç altında burkul dayanımı. Mesnet koşullarına göre K değişir.',
                        formula: 'F_cr = π² · E · I / (K · L)²',
                        tags: ['burkulma', 'euler', 'basınç', 'kolon'],
                        table: {
                            headers: ['Mesnet Durumu', 'K Değeri', 'Açıklama'],
                            rows: [
                                ['Ankastre-Serbest', '2.0', 'Bayrak direği'],
                                ['Mafsallı-Mafsallı', '1.0', 'Pin-pin'],
                                ['Ankastre-Mafsallı', '0.7', 'Sabit-pin'],
                                ['Ankastre-Ankastre', '0.5', 'Sabit-sabit'],
                            ]
                        }
                    }
                ]
            },
            {
                id: 'mohr',
                title: 'Mohr Dairesi',
                icon: '⭕',
                entries: [
                    {
                        id: 'mohr-circle',
                        title: 'Mohr Dairesi Formülleri',
                        content: '2 boyutlu gerilme durumunda asal gerilmelerin ve maksimum kayma gerilmesinin hesaplanması. Mohr dairesi üzerinde σ₁, σ₂ asal gerilmeler yatay eksende, τ_max dikey eksende en üst noktada okunur.',
                        formula: 'σ₁,₂ = (σx+σy)/2 ± √[((σx-σy)/2)² + τxy²]\nτ_max = √[((σx-σy)/2)² + τxy²]',
                        image: '/handbook/mohr_circle.png',
                        tags: ['mohr', 'asal gerilme', 'kayma', 'principal stress'],
                    }
                ]
            },
            {
                id: 'fatigue',
                title: 'Yorulma ve Hasar (Fatigue & Failure)',
                icon: '⚡',
                entries: [
                    {
                        id: 'failure-theories',
                        title: 'Kırılma / Hasar Teorileri (Failure)',
                        content: 'Sünek ve gevrek malzemelerin 3 eksenli kompleks gerilme altında akmasını (veya kırılmasını) öngören teoriler.',
                        tags: ['von-mises', 'tresca', 'hasar', 'kırılma', 'failure'],
                        table: {
                            headers: ['Teori', 'Kullanım', 'Açıklama / Formül Özeti'],
                            rows: [
                                ['Von-Mises (Maximum Distortion Energy)', 'Sünek Malzemeler (Çelik, Alüminyum)', 'Eşdeğer gerilme, distorsiyon enerjisi akma enerjisini aştığında akma başlar.'],
                                ['Tresca (Maximum Shear Stress)', 'Sünek Malzemeler (Daha muhafazakar)', 'Maksimum kayma gerilmesi akma noktasındaki kaymaya ulaşınca başlar (τ_max = σ_y / 2).'],
                                ['Rankine (Maximum Normal Stress)', 'Gevrek Malzemeler (Dökme Demir)', 'En büyük asal gerilme malzemenin çekme/basma dayanımını aştığında kırılır.'],
                            ]
                        }
                    },
                    {
                        id: 'fatigue-soderberg',
                        title: 'Yorulma Teorileri (Soderberg / Goodman)',
                        content: 'Titreşimli veya periyodik değişken gerilmelere maruz kalan hareketli parçaların (miller, krank gibi) sonsuz ömür dizaynı. Ortalama gerilme (σ_m) ve Alternatif gerilme (σ_a) koordinat sisteminde çizilir.',
                        image: '/handbook/fatigue_theories.png',
                        tags: ['yorulma', 'fatigue', 'soderberg', 'goodman', 'gerber'],
                        table: {
                            headers: ['Kriter', 'Eğri / Formül Yapısı', 'Karakteristik'],
                            rows: [
                                ['Soderberg Eğrisi', 'σ_a/S_e + σ_m/S_y = 1/n', 'En güvenli (muhafazakar) teori. Akma çizgisine sınırlar.'],
                                ['Goodman Eğrisi', 'σ_a/S_e + σ_m/S_ut = 1/n', 'Kırılma (Ultimate) çizgisine gider. Daha az muhafazakar.'],
                                ['Gerber Parabolü', 'σ_a/S_e + (σ_m/S_ut)² = 1/n', 'Sünek malzemelerdeki yorulma deneylerine en yakın eğri.'],
                            ]
                        }
                    }
                ]
            },
            {
                id: 'beams',
                title: 'Kiriş Hesapları',
                icon: '🏗️',
                entries: [
                    {
                        id: 'simple-beam',
                        title: 'Basit Mesnetli Kiriş',
                        content: 'İki ucundan mesnetlenmiş kiriş formülleri. Tekil yük, yayılı yük ve üçgen yayılı yük (0→q) için moment ve sehim formülleri.',
                        image: '/handbook/beam_loading.png',
                        tags: ['kiriş', 'basit mesnet', 'beam'],
                        table: {
                            headers: ['Yükleme', 'M_max', 'δ_max (Sehim)'],
                            rows: [
                                ['Ortada tekil yük (P)', 'P·L/4', 'P·L³/(48·E·I)'],
                                ['Yayılı yük (q)', 'q·L²/8', '5·q·L⁴/(384·E·I)'],
                                ['Üçgen yayılı (0→q)', 'q·L²/(9√3)', '0.00652·q·L⁴/(E·I)'],
                            ]
                        }
                    },
                    {
                        id: 'cantilever-beam',
                        title: 'Ankastre Kiriş',
                        content: 'Bir ucu ankastre (gömülü) kiriş formülleri.',
                        tags: ['ankastre', 'konsol', 'cantilever'],
                        table: {
                            headers: ['Yükleme', 'M_max (Ankastre)', 'δ_max (Uç)'],
                            rows: [
                                ['Uçta tekil yük (P)', 'P·L', 'P·L³/(3·E·I)'],
                                ['Yayılı yük (q)', 'q·L²/2', 'q·L⁴/(8·E·I)'],
                            ]
                        }
                    }
                ]
            }
        ]
    },

    // --- CHAPTER 3: BAGLANTI ELEMANLARI ---
    {
        id: 'fasteners',
        title: 'Bağlantı Elemanları',
        icon: '🔩',
        sections: [
            {
                id: 'bolts',
                title: 'Vida-Cıvata',
                icon: '🔩',
                entries: [
                    {
                        id: 'bolt-classes',
                        title: 'Cıvata Mukavemet Sınıfları',
                        content: 'ISO 898-1 standardına göre cıvata sınıfları. İlk sayı: çekme dayanımı/100. İkinci sayı: akma/çekme oranı*10. Örn: 8.8 -> 800 MPa çekme, %80 akma oranı = 640 MPa akma.',
                        image: '/handbook/bolt_grades.png',
                        tags: ['civata', 'mukavemet sinifi', 'bolt grade'],
                        table: {
                            headers: ['Sinif', 'Rm (MPa)', 'Re (MPa)', 'Malzeme'],
                            rows: [
                                ['4.6', '400', '240', 'Düşük C çelik'],
                                ['5.8', '500', '400', 'Orta C çelik'],
                                ['8.8', '800', '640', 'Alaşımlı çelik, ıslah'],
                                ['10.9', '1000', '900', 'Alaşımlı çelik, ıslah'],
                                ['12.9', '1200', '1080', 'Alaşımlı çelik, ıslah'],
                            ]
                        }
                    },
                    {
                        id: 'bolt-stress',
                        title: 'Cıvata Gerilme Hesabı',
                        content: 'Cıvata çekme ve kayma gerilmesi hesapları.',
                        formula: 'sigma_cekme = F / A_s\ntau_kayma = F / (n * A_s)\nA_s = pi/4 * d^2 (gerilme kesit alani)',
                        tags: ['cıvata', 'gerilme', 'hesap'],
                        table: {
                            headers: ['Metrik', 'd (mm)', 'Adım (mm)', 'As (mm^2)'],
                            rows: [
                                ['M6', '6', '1.0', '20.1'],
                                ['M8', '8', '1.25', '36.6'],
                                ['M10', '10', '1.5', '58.0'],
                                ['M12', '12', '1.75', '84.3'],
                                ['M16', '16', '2.0', '157'],
                                ['M20', '20', '2.5', '245'],
                                ['M24', '24', '3.0', '353'],
                            ]
                        }
                    }
                ]
            },
            {
                id: 'welding',
                title: 'Kaynak Hesapları',
                icon: '👨‍🏭',
                entries: [
                    {
                        id: 'weld-types',
                        title: 'Kaynak Türleri ve Hesapları',
                        content: 'Köşe kaynağı ve alın kaynağı gerilme hesapları.',
                        formula: 'Kose: tau = F / (0.707 * a * L)\nAlin: sigma = F / (t * L)',
                        tags: ['kaynak', 'köşe', 'alın'],
                        table: {
                            headers: ['Kaynak Tipi', 'Formül', 'Açıklama'],
                            rows: [
                                ['Köşe Kaynağı', 'tau = F / (0.707 * a * L)', 'a: köşe ölçüsü, L: kaynak boyu'],
                                ['Alın Kaynağı', 'sigma = F / (t * L)', 't: sac kalınlığı'],
                                ['Alın+Eğme', 'sigma = F/A + M/W', 'Birleşik yükleme'],
                            ]
                        }
                    },
                    {
                        id: 'weld-electrodes',
                        title: 'Kaynak Klasifikasyonu (Elektrot Seçimi)',
                        content: 'Örtülü Elektrot Ark Kaynağı (SMAW) için AWS A5.1 klasifikasyon örneği: E7018. E = Elektrot, 70 = çekme mukavemeti (70,000 psi / 480 MPa), 1 = Tüm pozisyonlar (Düz, Yatay, Dikey, Tavan), 8 = Kaplama tipi (Düşük hidrojenli, potasyum/demir tozu).',
                        tags: ['elektrot', 'kaynak', 'E7018', 'AWS', 'SMAW', 'seçim'],
                        table: {
                            headers: ['Elektrot', 'cekme Dayanimi', 'Kullanim Alani', 'Pozisyon'],
                            rows: [
                                ['E6010', '430 MPa', 'Derin nüfuziyet, boru kaynakları', 'Tüm'],
                                ['E6011', '430 MPa', 'Kirli/paslı yüzeyler (AC ve DC)', 'Tüm'],
                                ['E6013', '430 MPa', 'Sac kaynağı, düzgün dikiş (AC ve DC)', 'Tüm'],
                                ['E7014', '480 MPa', 'Yüksek dolgu hızı (demir tozlu)', 'Tüm'],
                                ['E7018', '480 MPa', 'Düşük hidrojen, ağır şase ve çatlak riski', 'Tüm'],
                                ['E7024', '480 MPa', 'Çok yüksek dolgu, düz kaynaklar', 'Düz/Yatay'],
                            ]
                        }
                    },
                    {
                        id: 'weld-symbols',
                        title: 'Kaynak Sembolleri (AWS/ISO)',
                        content: 'Teknik resimlerde kullanılan kaynak sembollerinin temel anlamları. Referans çizgisinin "Altındaki" sembol Ok Tarafını (Arrow Side), "üstündeki" sembol Diğer Tarafi (Other Side) temsil eder.',
                        tags: ['kaynak', 'sembol', 'symbol', 'teknik resim'],
                        table: {
                            headers: ['Kaynak Türü', 'Sembol', 'Açıklama'],
                            rows: [
                                ['Köşe Kaynağı (Fillet)', '△', 'Dik açılı birleşimler'],
                                ['V-Alın (V-Groove)', 'V', 'Pah açılmış uca iki yönlü'],
                                ['U-Alın (U-Groove)', 'U', 'Kalın malzemelerde kavisli pah'],
                                ['Boru/Çevre Kaynağı', '◯ (Bayrak kökünde)', 'Bütün birleşik çevre boyunca kaynak'],
                                ['Şantiye/Saha Kaynağı', '⚐ (Bayrak)', 'Atölyede değil, sahada yapılacak'],
                            ]
                        }
                    }
                ]
            },
            {
                id: 'keys',
                title: 'Kama Bağlantıları',
                icon: '🔑',
                entries: [
                    {
                        id: 'key-stress',
                        title: 'Kama Hesabı',
                        content: 'Mil-kama bağlantısında ezme ve kesme kontrolü.',
                        formula: 'τ = 2T / (d · b · L)\nσ_ezme = 4T / (d · h · L)',
                        tags: ['kama', 'key', 'mil', 'saft'],
                        table: {
                            headers: ['Mil çapı (mm)', 'b x h (mm)', 'L_min (mm)'],
                            rows: [
                                ['17-22', '6x6', '18-27'],
                                ['22-30', '8x7', '22-36'],
                                ['30-38', '10x8', '28-45'],
                                ['38-44', '12x8', '36-50'],
                                ['44-50', '14x9', '42-56'],
                                ['50-58', '16x10', '50-63'],
                            ]
                        }
                    }
                ]
            },
            {
                id: 'thread-types',
                title: 'Dis Tipleri (Blm J)',
                icon: '',
                entries: [
                    {
                        id: 'thread-overview',
                        title: 'Dis Tipleri ve Temel Profil',
                        content: 'Dis ama operasyonlarinda kullanilan temel dis profilleri. Metrik (M), Birlestirilmis (UN), Whitworth (W), Paralel Boru (G), Konik Boru (R/BSPT), NPT ve Trapezoid (Tr) dis tipleri mevcuttur.',
                        image: '/handbook/thread_types.png',
                        tags: ['dis', 'vida', 'metrik', 'UN', 'whitworth', 'BSP', 'NPT', 'trapezoid', 'thread'],
                        table: {
                            headers: ['Dis Tipi', 'Sembol', 'Ai', 'Profil', 'Kullanim Alani'],
                            rows: [
                                ['Metrik', 'M', '60 derece', 'ucgen (V)', 'Genel amali, ISO standardi'],
                                ['Birlestirilmis (UNC/UNF)', 'UN', '60 derece', 'ucgen (V)', 'Amerikan/Ingiliz standardi'],
                                ['Whitworth', 'W (BSW)', '55 derece', 'Yuvarlak dis dibi', 'Ingiliz standardi (eski)'],
                                ['Paralel Boru', 'G (PF/BSP)', '55 derece', 'Yuvarlak dis dibi', 'Sabit boru baglantilari'],
                                ['Konik Boru', 'R (BSPT/PT)', "55 derece + 1 derece 47' konik", 'Yuvarlak dis dibi', 'Sizdirmaz boru baglantilari'],
                                ['Amerikan Konik Boru', 'NPT', "60 derece + 1 derece 47' konik", 'ucgen (V)', 'Amerikan boru baglantisi'],
                                ['Trapezoid', 'Tr', '30 derece', 'Yamuk profil', 'Hareket vidalari, vida presleri'],
                            ]
                        }
                    },
                    {
                        id: 'metric-threads',
                        title: 'Metrik Dis Standart Adimlari (M)',
                        content: 'ISO Metrik vida disi. 60 derece dis aisi. Sembol: M (cap  adim). Ornek: M30 = 30mm cap, 3.5mm standart adim. Ince adim versiyonlari da mevcuttur.',
                        tags: ['metrik', 'M', 'ISO', 'vida', 'dis', 'adim'],
                        table: {
                            headers: ['Dis', 'cap d (mm)', 'Standart Adim P (mm)', 'Ince Adim P (mm)', 'As (mm^2)'],
                            rows: [
                                ['M3', '3', '0.5', '0.35', '5.03'],
                                ['M4', '4', '0.7', '0.5', '8.78'],
                                ['M5', '5', '0.8', '0.5', '14.2'],
                                ['M6', '6', '1.0', '0.75', '20.1'],
                                ['M8', '8', '1.25', '1.0', '36.6'],
                                ['M10', '10', '1.5', '1.25', '58.0'],
                                ['M12', '12', '1.75', '1.25/1.5', '84.3'],
                                ['M14', '14', '2.0', '1.5', '115'],
                                ['M16', '16', '2.0', '1.5', '157'],
                                ['M18', '18', '2.5', '1.5/2.0', '192'],
                                ['M20', '20', '2.5', '1.5/2.0', '245'],
                                ['M22', '22', '2.5', '1.5/2.0', '303'],
                                ['M24', '24', '3.0', '2.0', '353'],
                                ['M27', '27', '3.0', '2.0', '459'],
                                ['M30', '30', '3.5', '2.0', '561'],
                                ['M36', '36', '4.0', '3.0', '817'],
                            ]
                        }
                    },
                    {
                        id: 'unified-threads',
                        title: 'Birlestirilmis Dis (UN/UNC/UNF)',
                        content: 'Amerikan Birlestirilmis vida disi sistemi. 60 derece dis aisi. UNC: kaba dis (Unified National Coarse). UNF: ince dis (Unified National Fine). UNEF: ekstra ince dis. ller inch cinsinden, adim dis/inch cinsinden ifade edilir.',
                        tags: ['UN', 'UNC', 'UNF', 'UNEF', 'Unified', 'inch', 'Amerikan'],
                        table: {
                            headers: ['Boyut', 'UNC (dis/inch)', 'UNF (dis/inch)', 'Dis cap (mm)', 'Dis cap (inch)'],
                            rows: [
                                ['#6', '32', '40', '3.51', '0.138'],
                                ['#8', '32', '36', '4.17', '0.164'],
                                ['#10', '24', '32', '4.83', '0.190'],
                                ['1/4"', '20', '28', '6.35', '0.250'],
                                ['5/16"', '18', '24', '7.94', '0.313'],
                                ['3/8"', '16', '24', '9.53', '0.375'],
                                ['7/16"', '14', '20', '11.11', '0.438'],
                                ['1/2"', '13', '20', '12.70', '0.500'],
                                ['5/8"', '11', '18', '15.88', '0.625'],
                                ['3/4"', '10', '16', '19.05', '0.750'],
                                ['7/8"', '9', '14', '22.23', '0.875'],
                                ['1"', '8', '12', '25.40', '1.000'],
                            ]
                        }
                    },
                    {
                        id: 'pipe-threads',
                        title: 'Boru Disleri (G / R / NPT)',
                        content: "Boru baglantilarinda kullanilan dis tipleri. G (BSP Paralel): Sizdirmaz olmayan baglantilar, conta gerektirir. R/BSPT (Konik): 1 derece 47' koniklik, sizdirmaz baglanti saglar. NPT: Amerikan standardi, 1 derece 47' koniklik, 60 derece dis aisi.",
                        tags: ['boru', 'pipe', 'BSP', 'G', 'R', 'BSPT', 'NPT', 'konik', 'paralel'],
                        table: {
                            headers: ['Boyut', 'G/BSP Dis cap (mm)', 'Dis/inch', 'NPT Dis cap (mm)', 'NPT Dis/inch'],
                            rows: [
                                ['1/8"', '9.728', '28', '10.287', '27'],
                                ['1/4"', '13.157', '19', '13.716', '18'],
                                ['3/8"', '16.662', '19', '17.145', '18'],
                                ['1/2"', '20.955', '14', '21.336', '14'],
                                ['3/4"', '26.441', '14', '26.670', '14'],
                                ['1"', '33.249', '11', '33.401', '11.5'],
                                ['1 1/4"', '41.910', '11', '42.164', '11.5'],
                                ['1 1/2"', '47.803', '11', '48.260', '11.5'],
                                ['2"', '59.614', '11', '60.325', '11.5'],
                            ]
                        }
                    },
                    {
                        id: 'whitworth-threads',
                        title: 'Whitworth Disi (BSW)',
                        content: 'Ingiliz Whitworth standardi. 55 derece dis aisi, yuvarlak dis dibi profili. Eski Ingiliz standardi olmasina ragmen bazi uygulamalarda hl kullanilir. BSW (kaba dis) ve BSF (ince dis) versiyonlari mevcuttur.',
                        tags: ['Whitworth', 'BSW', 'BSF', 'Ingiliz', 'W'],
                        table: {
                            headers: ['Boyut', 'Dis cap (mm)', 'Dis/inch (BSW)', 'Dis/inch (BSF)'],
                            rows: [
                                ['W 1/4"', '6.35', '20', '26'],
                                ['W 5/16"', '7.94', '18', '22'],
                                ['W 3/8"', '9.53', '16', '20'],
                                ['W 7/16"', '11.11', '14', '18'],
                                ['W 1/2"', '12.70', '12', '16'],
                                ['W 5/8"', '15.88', '11', '14'],
                                ['W 3/4"', '19.05', '10', '12'],
                                ['W 7/8"', '22.23', '9', '11'],
                                ['W 1"', '25.40', '8', '10'],
                            ]
                        }
                    },
                    {
                        id: 'trapezoidal-threads',
                        title: 'Trapezoid Dis (Tr)',
                        content: '30 derece trapezoid profilli hareket vidasi disi. Yuksek eksenel kuvvet iletimi iin tasarlanmistir. Vida presleri, CNC tezgâhları, kaldirma mekanizmalari ve kapi/kapak mekanizmalarinda kullanilir. DIN 103 standardi.',
                        tags: ['trapezoid', 'Tr', 'hareket vidasi', 'vida presi', 'DIN 103'],
                        table: {
                            headers: ['Dis', 'Dis cap d (mm)', 'Adim P (mm)', 'Kk cap d3 (mm)', 'Profil Yuksekligi'],
                            rows: [
                                ['Tr 10x2', '10', '2', '7.5', '1.0'],
                                ['Tr 12x3', '12', '3', '8.5', '1.5'],
                                ['Tr 14x3', '14', '3', '10.5', '1.5'],
                                ['Tr 16x4', '16', '4', '11.5', '2.0'],
                                ['Tr 18x4', '18', '4', '13.5', '2.0'],
                                ['Tr 20x4', '20', '4', '15.5', '2.0'],
                                ['Tr 24x5', '24', '5', '18.5', '2.5'],
                                ['Tr 26x5', '26', '5', '20.5', '2.5'],
                                ['Tr 28x5', '28', '5', '22.5', '2.5'],
                                ['Tr 30 derece6', '30', '6', '23.0', '3.0'],
                                ['Tr 36x6', '36', '6', '29.0', '3.0'],
                                ['Tr 40 derece7', '40', '7', '32.0', '3.5'],
                            ]
                        }
                    }
                ]
            }
        ]
    },

    // --- CHAPTER 4: TOLERANSLAR ---
    {
        id: 'tolerances',
        title: 'Toleranslar & Yüzey',
        icon: '📏',
        sections: [
            {
                id: 'fit-tolerances',
                title: 'Geçme Toleransları',
                icon: '🤝',
                entries: [
                    {
                        id: 'iso-fits',
                        title: 'ISO Geçme Sistemi',
                        content: 'Delik bazlı geçme sistemi (H sistemi). H7/g6: Kayar geçme (boşluklu). H7/k6: Geçişme (sıfıra yakın). H7/p6: Sıkı geçme (presleme ile). Tolerans bölgesi renk kodlaması: yeşil=boşluk, sarı=geçişme, kırmızı=sıkı.',
                        image: '/handbook/tolerance_fit.png',
                        tags: ['tolerans', 'geçme', 'ISO', 'fit'],
                        table: {
                            headers: ['Geçme Tipi', 'Delik/Mil', 'Kullanım'],
                            rows: [
                                ['Bol boşluklu', 'H11/d11', 'Menteşe, kapak'],
                                ['Boşluklu', 'H8/f7', 'Yatak yatağı'],
                                ['Kayar', 'H7/g6', 'Hassas kılavuz'],
                                ['Geçişme', 'H7/k6', 'Dişli-mil'],
                                ['Sıkı', 'H7/p6', 'Rulman montaji'],
                                ['Zorlu sıkı', 'H7/s6', 'Kalici montaj'],
                            ]
                        }
                    }
                ]
            },
            {
                id: 'gdt',
                title: 'Geometrik Toleranslar (GD&T)',
                icon: '??',
                entries: [
                    {
                        id: 'gdt-symbols',
                        title: 'GD&T Sembolleri ve Toleranslar',
                        content: 'Geometrik Boyutlandirma ve Toleranslandirma (GD&T), imalatta parca geometrisini kontrol etmek icin kullanilan sistemdir.',
                        tags: ['gdt', 'tolerans', 'geometrik', 'sembol', 'diklik', 'paralellik'],
                        table: {
                            headers: ['Kategori', 'ozellik', 'Sembol', 'Açıklama'],
                            rows: [
                                ['Sekil', 'Dogrusallik', '?', 'Bir cizginin duz olma derecesi'],
                                ['Sekil', 'Duzlemsellik', '?', 'Bir yzeyin tam duz olma derecesi'],
                                ['Sekil', 'Dairesellik', '?', 'Dairesel kesitin tam daireye uygunlugu'],
                                ['Sekil', 'Silindiriklik', '?', 'Parcanin kusursuz silindire uygunlugu'],
                                ['Profil', 'cizgi Profili', '?', '2B yzey sinirinin ideal profile sadakati'],
                                ['Profil', 'Yuzey Profili', '?', '3B yzeyin ideal (CAD) modele sadakati'],
                                ['Yonelim', 'Diklik', '?', 'Yuzey veya eksenin referansa gore 90 dikligi'],
                                ['Yonelim', 'Aisal', '?', 'Yuzeyin referansa gore spesifik aci beklentisi'],
                                ['Yonelim', 'Paralellik', '?', 'Yuzeyin referansa gore paralellik farki'],
                                ['Konum', 'Pozisyon (True Pos)', '?', 'ozelligin CAD datasina gore tam konumu'],
                                ['Konum', 'Esmerkezlilik', '?', 'Iki veya daha fazla parcacigin eksen kacagi'],
                                ['Yalpalama', 'Dairesel Yalpalama', '?', 'Mil donerken 1 turdaki eksenel kacagi (Salgi)'],
                                ['Yalpalama', 'Toplam Yalpalama', '?', 'Mil boyunca hareket edildigindeki toplam salgi']
                            ]
                        }
                    }
                ]
            },
            {
                id: 'surface-finish',
                title: 'Yüzey Pürüzlülüğü',
                icon: '✨',
                entries: [
                    {
                        id: 'ra-values',
                        title: 'Ra Değerleri ve İşlem Yöntemleri',
                        content: 'Yüzey pürüzlülüğü Ra değerleri ve bunlara ulaşılan işleme yöntemleri.',
                        tags: ['yüzey', 'pürüzlülük', 'Ra', 'işleme'],
                        table: {
                            headers: ['Ra (um)', 'N Sınıfı', 'İşleme Yöntemi'],
                            rows: [
                                ['50', 'N12', 'Kum döküm'],
                                ['25', 'N11', 'Alevle kesme'],
                                ['12.5', 'N10', 'Kaba torna'],
                                ['6.3', 'N9', 'Frezeleme'],
                                ['3.2', 'N8', 'İnce torna'],
                                ['1.6', 'N7', 'Taşlama'],
                                ['0.8', 'N6', 'İnce taşlama'],
                                ['0.4', 'N5', 'Honlama'],
                                ['0.2', 'N4', 'Lepleme'],
                                ['0.1', 'N3', 'Süper finiş'],
                            ]
                        }
                    }
                ]
            }
        ]
    },

    // --- CHAPTER 5: MAKINE ELEMANLARI ---
    {
        id: 'machine-elements',
        title: 'Makine Elemanları',
        icon: '⚙️',
        sections: [
            {
                id: 'bearings',
                title: 'Rulman Seçimi',
                icon: '⭕',
                entries: [
                    {
                        id: 'bearing-life',
                        title: 'Rulman Omur Hesabı',
                        content: 'ISO 281 standardina gore nominal omur hesabi. Rulman, ic bilezik, dis bilezik, bilyalar ve kafes bilesenlerinden olusur. omur hesabi dinamik yuk kapasitesi (C) ve esdeger yuk (P) oranina baglidir.',
                        formula: 'L10 = (C/P)^p * 10^6 devir\np = 3 (bilyalı), p = 10/3 (makaralı)\nL10h = L10 / (60 * n)',
                        image: '/handbook/bearing_section.png',
                        tags: ['rulman', 'omur', 'L10'],
                        table: {
                            headers: ['Sembol', 'Tanim', 'Birim'],
                            rows: [
                                ['C', 'Dinamik yuk kapasitesi', 'kN'],
                                ['P', 'Esdeger dinamik yuk', 'kN'],
                                ['L10', 'Nominal omur', 'devir'],
                                ['L10h', 'Nominal omur (saat)', 'saat'],
                                ['n', 'Donme hizi', 'dev/dk'],
                            ]
                        }
                    },
                    {
                        id: 'bearing-types',
                        title: 'Rulman cesitleri',
                        content: 'Yaygin rulman tipleri ve uygulama alanlari. Sabit bilyali, açısal temaslı, silindirik makarali, konik makarali, igne makaralı ve eksenel bilyalı rulman tipleri mevcuttur.',
                        image: '/handbook/bearing_types.png',
                        tags: ['rulman', 'tip', 'secim'],
                        table: {
                            headers: ['Tip', 'Radyal', 'Aksiyel', 'Hiz', 'Kullanim'],
                            rows: [
                                ['Sabit bilyalı', 'Iyi', 'Orta', 'Yuksek', 'Elektrik motoru'],
                                ['Silindirik makaralı', 'Cok iyi', 'Yok', 'Yuksek', 'Disli kutusu'],
                                ['Konik makaralı', 'Iyi', 'Iyi', 'Orta', 'Tekerlek gobegi'],
                                ['Igne makaralı', 'Cok iyi', 'Yok', 'Orta', 'Dar alanlarda'],
                                ['Eklem yatagi', 'Iyi', 'Iyi', 'Dusuk', 'Eklemli baglanti'],
                            ]
                        }
                    },
                    {
                        id: 'skf-dgbb',
                        title: 'SKF Sabit Bilyali Rulman Katalogu (6200 Serisi)',
                        content: 'SKF marka sabit bilyalı rulmanlar (Deep Groove Ball Bearings). En yaygin kullanilan rulman tipidir. Yuksek hiz kapasitesi, düşük surtunme, hem radyal hem aksiyel yuk tasir. Kapakli (2RS/2Z) ve acik versiyonlari bulunur.',
                        image: '/handbook/deep_groove_ball.png',
                        tags: ['SKF', 'rulman', 'sabit bilyalı', '6200', '6201', '6202', '6203', '6204', '6205', '6206', '6208', '6210', 'deep groove'],
                        table: {
                            headers: ['SKF No', 'd (mm)', 'D (mm)', 'B (mm)', 'C dyn (kN)', 'C0 stat (kN)', 'n_max (rpm)'],
                            rows: [
                                ['6200', '10', '30', '9', '5.07', '2.36', '30000'],
                                ['6201', '12', '32', '10', '6.89', '3.10', '28000'],
                                ['6202', '15', '35', '11', '7.80', '3.75', '26000'],
                                ['6203', '17', '40', '12', '9.56', '4.75', '22000'],
                                ['6204', '20', '47', '14', '12.7', '6.55', '18000'],
                                ['6205', '25', '52', '15', '14.8', '7.80', '16000'],
                                ['6206', '30', '62', '16', '19.5', '11.2', '14000'],
                                ['6207', '35', '72', '17', '25.5', '15.3', '12000'],
                                ['6208', '40', '80', '18', '29.1', '17.8', '10000'],
                                ['6209', '45', '85', '19', '31.9', '19.5', '9500'],
                                ['6210', '50', '90', '20', '35.1', '21.6', '9000'],
                                ['6211', '55', '100', '21', '43.6', '28.0', '8500'],
                                ['6212', '60', '110', '22', '52.0', '36.0', '7500'],
                                ['6213', '65', '120', '23', '57.2', '40.0', '7000'],
                                ['6214', '70', '125', '24', '61.8', '44.0', '6700'],
                                ['6215', '75', '130', '25', '66.3', '48.0', '6300'],
                                ['6216', '80', '140', '26', '72.0', '52.0', '5600'],
                            ]
                        }
                    },
                    {
                        id: 'skf-6300',
                        title: 'SKF Sabit Bilyali Rulman (6300 Serisi - Ağır)',
                        content: '6300 serisi, 6200 serisine gore daha yüksek yuk kapasitesine sahiptir. Daha genis ve daha buyuk bilyalar kullanir. Ağır yukleme kosullari icin uygundur.',
                        image: '/handbook/deep_groove_ball.png',
                        tags: ['SKF', 'rulman', '6300', '6301', '6302', '6303', '6304', '6305', '6306', '6308', '6310', 'agir seri'],
                        table: {
                            headers: ['SKF No', 'd (mm)', 'D (mm)', 'B (mm)', 'C dyn (kN)', 'C0 stat (kN)', 'n_max (rpm)'],
                            rows: [
                                ['6300', '10', '35', '11', '8.06', '3.40', '26000'],
                                ['6301', '12', '37', '12', '9.75', '4.15', '24000'],
                                ['6302', '15', '42', '13', '11.4', '5.40', '20000'],
                                ['6303', '17', '47', '14', '13.5', '6.55', '18000'],
                                ['6304', '20', '52', '15', '15.9', '7.80', '16000'],
                                ['6305', '25', '62', '17', '22.5', '11.4', '13000'],
                                ['6306', '30', '72', '19', '28.1', '14.6', '11000'],
                                ['6307', '35', '80', '21', '33.2', '18.0', '9500'],
                                ['6308', '40', '90', '23', '41.0', '24.0', '8500'],
                                ['6309', '45', '100', '25', '52.7', '31.5', '7500'],
                                ['6310', '50', '110', '27', '61.8', '38.0', '6700'],
                            ]
                        }
                    },
                    {
                        id: 'skf-bearing-fits',
                        title: 'SKF Rulman Montaj Gecmeleri',
                        content: 'Rulman ic bilezigini mile, dis bilezigini yatağa monte ederken kullanilan ISO toleranslari. Donen bilezik sıkı gecme, duran bilezik kayar geçme almalıdır.',
                        tags: ['SKF', 'rulman', 'montaj', 'geçme', 'tolerans'],
                        table: {
                            headers: ['Kosul', 'Mil Toleransi', 'Yuva Toleransi', 'Açıklama'],
                            rows: [
                                ['Normal radyal yuk, donen mil', 'k5-m5', 'J7', 'Sabit bilyalı, kucuk boyut'],
                                ['Normal radyal yuk, donen mil', 'k6-m6', 'J7', 'Orta boyut'],
                                ['Agir radyal yuk, donen mil', 'm6-n6', 'K7', 'Ağır kosullar'],
                                ['Eksenel yuk, donen mil', 'j5-j6', 'H7', 'Sıkı geçme gerekmez'],
                                ['Normal yuk, donen yuva', 'g6-h6', 'M7-N7', 'Donen dis bilezik'],
                            ]
                        }
                    },
                    {
                        id: 'skf-7200',
                        title: 'SKF Acisal Temasli Bilyali Rulman (7200 Serisi)',
                        content: 'Acisal temaslı bilyalı rulmanlar (Angular Contact Ball Bearings). Temas acisi 40 derece. Yuksek aksiyel ve radyal kombine yuklere uygun. Genellikle çiftli (tandem, O veya X duzeni) monte edilir. Takim tezgâhları ve pompalar icin idealdir.',
                        image: '/handbook/angular_contact_ball.png',
                        tags: ['SKF', 'rulman', 'açısal temaslı', '7200', '7201', '7202', '7203', '7204', '7205', '7206', 'angular contact'],
                        table: {
                            headers: ['SKF No', 'd (mm)', 'D (mm)', 'B (mm)', 'C dyn (kN)', 'C0 stat (kN)', 'n_max (rpm)'],
                            rows: [
                                ['7200 BEP', '10', '30', '9', '5.07', '2.65', '28000'],
                                ['7201 BEP', '12', '32', '10', '6.89', '3.45', '26000'],
                                ['7202 BEP', '15', '35', '11', '7.80', '4.15', '24000'],
                                ['7203 BEP', '17', '40', '12', '10.1', '5.30', '20000'],
                                ['7204 BEP', '20', '47', '14', '13.3', '7.50', '17000'],
                                ['7205 BEP', '25', '52', '15', '15.9', '9.30', '15000'],
                                ['7206 BEP', '30', '62', '16', '22.1', '14.0', '13000'],
                                ['7207 BEP', '35', '72', '17', '29.1', '19.3', '11000'],
                                ['7208 BEP', '40', '80', '18', '33.8', '23.2', '10000'],
                                ['7210 BEP', '50', '90', '20', '36.4', '26.5', '8500'],
                            ]
                        }
                    },
                    {
                        id: 'skf-nu',
                        title: 'SKF Silindirik Makarali Rulman (NU Serisi)',
                        content: 'Silindirik makaralı rulmanlar (Cylindrical Roller Bearings). Cok yüksek radyal yuk kapasitesi. Aksiyel yuk tasimaz (NU tipi). Ic ve dis bilezikler ayrılabilir. Disli kutulari, elektrik motorlari, hadde makineleri icin idealdir.',
                        image: '/handbook/cylindrical_roller.png',
                        tags: ['SKF', 'rulman', 'silindirik makaralı', 'NU', 'NU205', 'NU206', 'NU208', 'NU210', 'cylindrical roller'],
                        table: {
                            headers: ['SKF No', 'd (mm)', 'D (mm)', 'B (mm)', 'C dyn (kN)', 'C0 stat (kN)', 'n_max (rpm)'],
                            rows: [
                                ['NU 204 ECP', '20', '47', '14', '16.8', '12.2', '16000'],
                                ['NU 205 ECP', '25', '52', '15', '21.6', '16.0', '14000'],
                                ['NU 206 ECP', '30', '62', '16', '31.9', '25.0', '12000'],
                                ['NU 207 ECP', '35', '72', '17', '41.8', '34.0', '10000'],
                                ['NU 208 ECP', '40', '80', '18', '48.5', '41.5', '9000'],
                                ['NU 209 ECP', '45', '85', '19', '50.0', '44.0', '8500'],
                                ['NU 210 ECP', '50', '90', '20', '56.1', '50.0', '8000'],
                                ['NU 212 ECP', '60', '110', '22', '81.9', '76.5', '6700'],
                                ['NU 214 ECP', '70', '125', '24', '99.0', '98.0', '5600'],
                                ['NU 216 ECP', '80', '140', '26', '117', '120', '5000'],
                            ]
                        }
                    },
                    {
                        id: 'skf-30200',
                        title: 'SKF Konik Makarali Rulman (30200 Serisi)',
                        content: 'Konik makaralı rulmanlar (Tapered Roller Bearings). Hem radyal hem aksiyel birleşik yukleri tasir. Ayrilabilir yapi. Tekerlek gobegi, disli kutusu reduktorleri, konveyor silindirleri icin idealdir. Genellikle çiftli kullanilir.',
                        image: '/handbook/tapered_roller.png',
                        tags: ['SKF', 'rulman', 'konik makaralı', '30200', '30202', '30204', '30205', '30206', '30208', 'tapered roller'],
                        table: {
                            headers: ['SKF No', 'd (mm)', 'D (mm)', 'T (mm)', 'C dyn (kN)', 'C0 stat (kN)', 'n_max (rpm)'],
                            rows: [
                                ['30202 J2/Q', '15', '35', '11.75', '16.4', '12.5', '18000'],
                                ['30203 J2/Q', '17', '40', '13.25', '21.1', '16.3', '16000'],
                                ['30204 J2/Q', '20', '47', '15.25', '27.5', '22.4', '14000'],
                                ['30205 J2/Q', '25', '52', '16.25', '33.9', '28.5', '13000'],
                                ['30206 J2/Q', '30', '62', '17.25', '43.6', '38.0', '11000'],
                                ['30207 J2/Q', '35', '72', '18.25', '57.4', '50.0', '9000'],
                                ['30208 J2/Q', '40', '80', '19.75', '64.4', '58.5', '8000'],
                                ['30210 J2/Q', '50', '90', '21.75', '73.5', '70.0', '7000'],
                                ['30212 J2/Q', '60', '110', '23.75', '100', '100', '5600'],
                            ]
                        }
                    },
                    {
                        id: 'skf-needle',
                        title: 'SKF Igne Makarali Rulman (NK/RNA Serisi)',
                        content: 'Igne makaralı rulmanlar (Needle Roller Bearings). Cok dar radyal kesit yüksekliği ile kompakt tasarim. Yuksek radyal yuk kapasitesi. Salinimli hareketler ve sinirli alan uygulamalarinda tercih edilir.',
                        image: '/handbook/needle_roller.png',
                        tags: ['SKF', 'rulman', 'igne makaralı', 'NK', 'RNA', 'needle roller'],
                        table: {
                            headers: ['SKF No', 'd (mm)', 'D (mm)', 'B (mm)', 'C dyn (kN)', 'C0 stat (kN)'],
                            rows: [
                                ['NK 12/16', '12', '19', '16', '10.4', '10.6'],
                                ['NK 14/16', '14', '22', '16', '12.5', '14.3'],
                                ['NK 16/16', '16', '24', '16', '14.3', '16.6'],
                                ['NK 17/16', '17', '25', '16', '14.6', '17.3'],
                                ['NK 20/16', '20', '28', '16', '15.5', '20.0'],
                                ['NK 25/16', '25', '33', '16', '17.3', '24.5'],
                                ['NK 30/20', '30', '40', '20', '27.1', '38.0'],
                                ['NK 35/20', '35', '45', '20', '28.6', '42.5'],
                                ['NK 40/20', '40', '50', '20', '32.0', '49.0'],
                            ]
                        }
                    },
                    {
                        id: 'skf-thrust',
                        title: 'SKF Eksenel Bilyali Rulman (51100 Serisi)',
                        content: 'Eksenel (aksiyel) bilyalı rulmanlar (Thrust Ball Bearings). Tek yonlu eksenel yuk tasir. Radyal yuk tasimaz. Dusuk-orta hiz uygulamaları. Dik miller, vida presleri, döner tablalar icin idealdir.',
                        image: '/handbook/thrust_ball.png',
                        tags: ['SKF', 'rulman', 'eksenel bilyalı', '51100', '51102', '51104', '51105', '51106', '51108', 'thrust ball'],
                        table: {
                            headers: ['SKF No', 'd (mm)', 'D (mm)', 'H (mm)', 'C dyn (kN)', 'C0 stat (kN)', 'n_max (rpm)'],
                            rows: [
                                ['51100', '10', '24', '9', '6.89', '10.0', '9000'],
                                ['51101', '12', '26', '9', '7.61', '11.2', '8500'],
                                ['51102', '15', '28', '9', '7.61', '11.6', '8000'],
                                ['51103', '17', '30', '9', '7.80', '12.2', '7500'],
                                ['51104', '20', '35', '10', '10.2', '16.6', '6700'],
                                ['51105', '25', '42', '11', '14.8', '25.0', '5600'],
                                ['51106', '30', '47', '11', '14.8', '26.0', '5300'],
                                ['51107', '35', '52', '12', '18.0', '32.0', '4800'],
                                ['51108', '40', '60', '13', '24.9', '46.5', '4300'],
                                ['51110', '50', '70', '14', '26.9', '53.0', '3600'],
                                ['51112', '60', '85', '17', '38.0', '78.0', '3000'],
                            ]
                        }
                    },
                    {
                        id: 'skf-6000',
                        title: 'SKF Sabit Bilyali Rulman (6000 Serisi - Hafif)',
                        content: '6000 serisi, 6200 serisine gore daha dar ve hafiftir. Dusuk-orta yukler ve kompakt uygulamalar icin uygundur. Yuksek hiz kapasitesi saglar.',
                        image: '/handbook/deep_groove_ball.png',
                        tags: ['SKF', 'rulman', '6000', '6001', '6002', '6003', '6004', '6005', '6006', '6007', '6008', 'hafif seri'],
                        table: {
                            headers: ['SKF No', 'd (mm)', 'D (mm)', 'B (mm)', 'C dyn (kN)', 'C0 stat (kN)', 'n_max (rpm)'],
                            rows: [
                                ['6000', '10', '26', '8', '4.62', '1.96', '34000'],
                                ['6001', '12', '28', '8', '5.07', '2.36', '32000'],
                                ['6002', '15', '32', '9', '5.59', '2.85', '28000'],
                                ['6003', '17', '35', '10', '6.37', '3.25', '26000'],
                                ['6004', '20', '42', '12', '9.36', '5.00', '20000'],
                                ['6005', '25', '47', '12', '10.1', '5.85', '18000'],
                                ['6006', '30', '55', '13', '13.3', '8.30', '16000'],
                                ['6007', '35', '62', '14', '15.9', '10.2', '14000'],
                                ['6008', '40', '68', '15', '16.8', '11.6', '13000'],
                                ['6009', '45', '75', '16', '21.6', '15.3', '11000'],
                                ['6010', '50', '80', '16', '21.8', '16.0', '10000'],
                                ['6012', '60', '95', '18', '29.6', '23.2', '8500'],
                                ['6014', '70', '110', '20', '37.1', '30.5', '7500'],
                                ['6016', '80', '125', '22', '43.6', '36.5', '6300'],
                            ]
                        }
                    },
                    {
                        id: 'skf-6400',
                        title: 'SKF Sabit Bilyali Rulman (6400 Serisi - Ekstra Ağır)',
                        content: 'En yüksek yuk kapasiteli sabit bilyalı rulman serisi. Buyuk bilyalar ve genis kesit. Ağır endustriyel uygulamalar, maden makineleri, cimento ve kagit fabrikalari icin uygundur.',
                        image: '/handbook/deep_groove_ball.png',
                        tags: ['SKF', 'rulman', '6400', '6403', '6404', '6405', '6406', '6407', '6408', 'ekstra agir'],
                        table: {
                            headers: ['SKF No', 'd (mm)', 'D (mm)', 'B (mm)', 'C dyn (kN)', 'C0 stat (kN)', 'n_max (rpm)'],
                            rows: [
                                ['6403', '17', '62', '17', '18.6', '9.50', '14000'],
                                ['6404', '20', '72', '19', '24.6', '13.7', '12000'],
                                ['6405', '25', '80', '21', '30.7', '18.0', '10000'],
                                ['6406', '30', '90', '23', '39.7', '24.0', '8500'],
                                ['6407', '35', '100', '25', '48.5', '30.5', '7500'],
                                ['6408', '40', '110', '27', '55.3', '36.0', '6700'],
                                ['6409', '45', '120', '29', '63.7', '43.0', '6000'],
                                ['6410', '50', '130', '31', '72.1', '50.0', '5300'],
                                ['6411', '55', '140', '33', '80.9', '58.5', '5000'],
                                ['6412', '60', '150', '35', '90.4', '67.0', '4500'],
                                ['6413', '65', '160', '37', '100', '78.0', '4300'],
                                ['6414', '70', '175', '40', '114', '96.5', '3800'],
                                ['6416', '80', '200', '48', '146', '118', '3200'],
                            ]
                        }
                    },
                    {
                        id: 'skf-thin-section',
                        title: 'SKF Ince Kesit Rulman (618xx / 619xx / 68xx / 69xx)',
                        content: 'Ince kesit (thin section) sabit bilyalı rulmanlar. Cok dar radyal kesit yüksekliği ile kompakt tasarim. Robot bilekleri, optik cihazlar, medikal ekipman ve hassas olcum cihazlari icin idealdir.',
                        image: '/handbook/deep_groove_ball.png',
                        tags: ['SKF', 'rulman', 'ince kesit', 'thin section', '618', '619', '68', '69', '6800', '6900'],
                        table: {
                            headers: ['SKF No', 'd (mm)', 'D (mm)', 'B (mm)', 'C dyn (kN)', 'C0 stat (kN)', 'n_max (rpm)'],
                            rows: [
                                ['61800', '10', '19', '5', '1.43', '0.56', '43000'],
                                ['61801', '12', '21', '5', '1.43', '0.60', '38000'],
                                ['61802', '15', '24', '5', '1.56', '0.73', '34000'],
                                ['61803', '17', '26', '5', '1.56', '0.78', '32000'],
                                ['61804', '20', '32', '7', '3.12', '1.60', '26000'],
                                ['61805', '25', '37', '7', '3.12', '1.73', '22000'],
                                ['61806', '30', '42', '7', '3.12', '1.86', '20000'],
                                ['61808', '40', '52', '7', '3.12', '2.12', '16000'],
                                ['61810', '50', '65', '7', '4.49', '3.25', '13000'],
                                ['61900', '10', '22', '6', '2.34', '0.95', '40000'],
                                ['61901', '12', '24', '6', '2.34', '1.02', '36000'],
                                ['61902', '15', '28', '7', '3.45', '1.63', '30000'],
                                ['61903', '17', '30', '7', '3.45', '1.73', '28000'],
                                ['61904', '20', '37', '9', '6.37', '3.25', '22000'],
                                ['61905', '25', '42', '9', '6.37', '3.45', '20000'],
                                ['61906', '30', '47', '9', '6.37', '3.65', '18000'],
                                ['61908', '40', '62', '12', '9.56', '6.20', '14000'],
                                ['61910', '50', '72', '12', '10.6', '7.35', '11000'],
                            ]
                        }
                    },
                    {
                        id: 'skf-7300',
                        title: 'SKF Acisal Temasli Bilyali Rulman (7300 Serisi - Ağır)',
                        content: '7300 serisi açısal temaslı bilyalı rulmanlar. 40 derece temas acisi. 7200 serisine gore daha yüksek yuk kapasitesi. Ağır kombine yukler icin idealdir. Pompa, kompresor ve takim tezgahlarinda kullanilir.',
                        image: '/handbook/angular_contact_ball.png',
                        tags: ['SKF', 'rulman', 'açısal temaslı', '7300', '7302', '7304', '7305', '7306', '7308', '7310', 'agir angular'],
                        table: {
                            headers: ['SKF No', 'd (mm)', 'D (mm)', 'B (mm)', 'C dyn (kN)', 'C0 stat (kN)', 'n_max (rpm)'],
                            rows: [
                                ['7300 BEP', '10', '35', '11', '8.52', '3.65', '24000'],
                                ['7301 BEP', '12', '37', '12', '10.1', '4.55', '22000'],
                                ['7302 BEP', '15', '42', '13', '12.4', '5.85', '19000'],
                                ['7303 BEP', '17', '47', '14', '14.8', '7.35', '17000'],
                                ['7304 BEP', '20', '52', '15', '17.8', '9.30', '15000'],
                                ['7305 BEP', '25', '62', '17', '25.7', '14.6', '12000'],
                                ['7306 BEP', '30', '72', '19', '33.5', '20.4', '10000'],
                                ['7307 BEP', '35', '80', '21', '42.3', '27.0', '8500'],
                                ['7308 BEP', '40', '90', '23', '51.4', '34.5', '7500'],
                                ['7309 BEP', '45', '100', '25', '64.4', '45.0', '6700'],
                                ['7310 BEP', '50', '110', '27', '75.6', '55.0', '6000'],
                                ['7312 BEP', '60', '130', '31', '94.0', '73.5', '5000'],
                            ]
                        }
                    },
                    {
                        id: 'skf-nj',
                        title: 'SKF Silindirik Makarali Rulman (NJ Serisi)',
                        content: 'NJ tipi silindirik makaralı rulmanlar. Dis bilezik iki flansli, ic bilezik tek flansli. Hem radyal hem tek yonlu aksiyel yuk tasir. Aksiyel konum belirleme (locating) ozelligi sunar. Disli kutusu, elektrik motoru ve fan uygulamalarinda tercih edilir.',
                        image: '/handbook/cylindrical_roller.png',
                        tags: ['SKF', 'rulman', 'silindirik makaralı', 'NJ', 'NJ204', 'NJ205', 'NJ206', 'NJ210', 'locating'],
                        table: {
                            headers: ['SKF No', 'd (mm)', 'D (mm)', 'B (mm)', 'C dyn (kN)', 'C0 stat (kN)', 'n_max (rpm)'],
                            rows: [
                                ['NJ 204 ECP', '20', '47', '14', '16.8', '12.2', '16000'],
                                ['NJ 205 ECP', '25', '52', '15', '21.6', '16.0', '14000'],
                                ['NJ 206 ECP', '30', '62', '16', '31.9', '25.0', '12000'],
                                ['NJ 207 ECP', '35', '72', '17', '41.8', '34.0', '10000'],
                                ['NJ 208 ECP', '40', '80', '18', '48.5', '41.5', '9000'],
                                ['NJ 209 ECP', '45', '85', '19', '50.0', '44.0', '8500'],
                                ['NJ 210 ECP', '50', '90', '20', '56.1', '50.0', '8000'],
                                ['NJ 212 ECP', '60', '110', '22', '81.9', '76.5', '6700'],
                                ['NJ 214 ECP', '70', '125', '24', '99.0', '98.0', '5600'],
                                ['NJ 216 ECP', '80', '140', '26', '117', '120', '5000'],
                                ['NJ 218 ECP', '90', '160', '30', '160', '170', '4300'],
                                ['NJ 220 ECP', '100', '180', '34', '200', '220', '3800'],
                            ]
                        }
                    },
                    {
                        id: 'skf-1200',
                        title: 'SKF Kendinden Ayarli Bilyali Rulman (1200 Serisi)',
                        content: 'Kendinden ayarli (self-aligning) bilyalı rulmanlar. Iki sira bilya, küresel dis bilezik yolu. +-2 eksen sapmasini (misalignment) kompanse eder. Uzun mil uygulamaları, tarim ve tekstil makinelerinde kullanilir.',
                        image: '/handbook/spherical_roller.png',
                        tags: ['SKF', 'rulman', 'kendinden ayarli', 'self-aligning', '1200', '1201', '1202', '1203', '1204', '1205', '1206', '1208'],
                        table: {
                            headers: ['SKF No', 'd (mm)', 'D (mm)', 'B (mm)', 'C dyn (kN)', 'C0 stat (kN)', 'n_max (rpm)'],
                            rows: [
                                ['1200 ETN9', '10', '30', '9', '5.07', '1.18', '28000'],
                                ['1201 ETN9', '12', '32', '10', '6.05', '1.43', '24000'],
                                ['1202 ETN9', '15', '35', '11', '7.28', '1.83', '22000'],
                                ['1203 ETN9', '17', '40', '12', '9.36', '2.20', '19000'],
                                ['1204 ETN9', '20', '47', '14', '12.1', '3.10', '16000'],
                                ['1205 ETN9', '25', '52', '15', '14.3', '3.90', '14000'],
                                ['1206 ETN9', '30', '62', '16', '16.0', '5.10', '12000'],
                                ['1207 ETN9', '35', '72', '17', '20.8', '6.95', '10000'],
                                ['1208 ETN9', '40', '80', '18', '22.9', '8.30', '9000'],
                                ['1209 ETN9', '45', '85', '19', '25.5', '9.65', '8500'],
                                ['1210 ETN9', '50', '90', '20', '26.7', '10.8', '8000'],
                            ]
                        }
                    },
                    {
                        id: 'skf-2200',
                        title: 'SKF Kendinden Ayarli Bilyali Rulman (2200 Serisi)',
                        content: '2200 serisi, 1200 serisine gore daha genis ve yüksek yuk kapasiteli kendinden ayarli bilyalı rulmanlardir. Daha buyuk bilyalar kullanir. Ağır yuk ve eksen sapmasi kosullarinda tercih edilir.',
                        image: '/handbook/spherical_roller.png',
                        tags: ['SKF', 'rulman', 'kendinden ayarli', '2200', '2201', '2204', '2205', '2206', '2208', '2210', 'agir self-aligning'],
                        table: {
                            headers: ['SKF No', 'd (mm)', 'D (mm)', 'B (mm)', 'C dyn (kN)', 'C0 stat (kN)', 'n_max (rpm)'],
                            rows: [
                                ['2200 ETN9', '10', '30', '14', '5.53', '1.29', '22000'],
                                ['2201 ETN9', '12', '32', '14', '6.37', '1.53', '20000'],
                                ['2202 ETN9', '15', '35', '14', '7.61', '1.96', '18000'],
                                ['2203 ETN9', '17', '40', '16', '11.2', '2.75', '16000'],
                                ['2204 ETN9', '20', '47', '18', '14.3', '3.80', '14000'],
                                ['2205 ETN9', '25', '52', '18', '14.8', '4.15', '12000'],
                                ['2206 ETN9', '30', '62', '20', '19.5', '6.20', '10000'],
                                ['2207 ETN9', '35', '72', '23', '28.1', '9.30', '8500'],
                                ['2208 ETN9', '40', '80', '23', '32.5', '11.4', '8000'],
                                ['2209 ETN9', '45', '85', '23', '33.2', '12.5', '7500'],
                                ['2210 ETN9', '50', '90', '23', '33.8', '13.2', '7000'],
                            ]
                        }
                    },
                    {
                        id: 'skf-22200',
                        title: 'SKF Kuresel Makarali Rulman (222xx Serisi)',
                        content: 'Kuresel makaralı rulmanlar (Spherical Roller Bearings). Iki sira fici sekilli makara, küresel dis bilezik yolu. Cok yüksek radyal yuk kapasitesi. +-2 eksen sapmasini kompanse eder. Ağır endustriyel uygulamalar, konveyor, kirici, fan, disli kutusu ve kagit makinelerinde yaygin kullanilir.',
                        image: '/handbook/spherical_roller.png',
                        tags: ['SKF', 'rulman', 'küresel makaralı', 'spherical roller', '22205', '22206', '22208', '22210', '22212', '22216', '22220'],
                        table: {
                            headers: ['SKF No', 'd (mm)', 'D (mm)', 'B (mm)', 'C dyn (kN)', 'C0 stat (kN)', 'n_max (rpm)'],
                            rows: [
                                ['22205 E', '25', '52', '18', '36.4', '26.5', '12000'],
                                ['22206 E', '30', '62', '20', '48.8', '37.5', '10000'],
                                ['22207 E', '35', '72', '23', '63.7', '49.0', '8500'],
                                ['22208 E', '40', '80', '23', '76.1', '60.0', '7500'],
                                ['22209 E', '45', '85', '23', '79.2', '64.0', '7000'],
                                ['22210 EK', '50', '90', '23', '83.2', '71.0', '6700'],
                                ['22211 EK', '55', '100', '25', '100', '88.0', '6000'],
                                ['22212 EK', '60', '110', '28', '125', '108', '5300'],
                                ['22213 EK', '65', '120', '31', '146', '132', '5000'],
                                ['22214 EK', '70', '125', '31', '149', '137', '4800'],
                                ['22215 EK', '75', '130', '31', '153', '143', '4500'],
                                ['22216 EK', '80', '140', '33', '183', '176', '4300'],
                                ['22218 EK', '90', '160', '40', '240', '228', '3600'],
                                ['22220 EK', '100', '180', '46', '310', '300', '3200'],
                                ['22224 EK', '120', '215', '58', '425', '415', '2600'],
                                ['22228 CCK/W33', '140', '250', '68', '530', '530', '2200'],
                            ]
                        }
                    },
                    {
                        id: 'skf-23200',
                        title: 'SKF Kuresel Makarali Rulman (232xx Serisi - Ağır)',
                        content: '23200 serisi küresel makaralı rulmanlar, 22200 serisine gore daha genis ve daha yüksek yuk kapasiteli. Ağır sok yukleri ve titresim kosullari icin tasarlanmistir. Madencilik, celik endustrisi, buyuk fanlar ve ezici makineler icin tercih edilir.',
                        image: '/handbook/spherical_roller.png',
                        tags: ['SKF', 'rulman', 'küresel makaralı', '23200', '23204', '23206', '23208', '23210', '23212', '23220', 'agir spherical'],
                        table: {
                            headers: ['SKF No', 'd (mm)', 'D (mm)', 'B (mm)', 'C dyn (kN)', 'C0 stat (kN)', 'n_max (rpm)'],
                            rows: [
                                ['23205 CC/W33', '25', '52', '18', '40.5', '31.0', '10000'],
                                ['23206 CC/W33', '30', '62', '20', '55.3', '44.0', '8500'],
                                ['23207 CC/W33', '35', '72', '23', '73.5', '60.0', '7500'],
                                ['23208 CC/W33', '40', '80', '23', '85.2', '72.0', '6700'],
                                ['23210 CC/W33', '50', '90', '23', '96.5', '85.0', '6000'],
                                ['23212 CC/W33', '60', '110', '28', '143', '125', '5000'],
                                ['23214 CC/W33', '70', '125', '31', '166', '155', '4300'],
                                ['23216 CC/W33', '80', '140', '33', '204', '200', '3800'],
                                ['23218 CC/W33', '90', '160', '40', '265', '260', '3200'],
                                ['23220 CC/W33', '100', '180', '46', '340', '340', '2800'],
                                ['23224 CC/W33', '120', '215', '58', '475', '475', '2200'],
                                ['23228 CC/W33', '140', '250', '68', '600', '615', '1900'],
                            ]
                        }
                    },
                    {
                        id: 'skf-32200',
                        title: 'SKF Konik Makarali Rulman (32200 Serisi)',
                        content: '32200 serisi konik makaralı rulmanlar. 30200 serisine gore daha genis ve daha yüksek yuk kapasiteli. Ağır birleşik radyal-aksiyel yukler icin uygundur. Otomotiv diferansiyeli, endustriyel reduktorler ve konveyor sistemlerinde kullanilir.',
                        image: '/handbook/tapered_roller.png',
                        tags: ['SKF', 'rulman', 'konik makaralı', '32200', '32204', '32205', '32206', '32208', '32210', '32212', 'agir tapered'],
                        table: {
                            headers: ['SKF No', 'd (mm)', 'D (mm)', 'T (mm)', 'C dyn (kN)', 'C0 stat (kN)', 'n_max (rpm)'],
                            rows: [
                                ['32204 J2/Q', '20', '47', '19.25', '34.1', '28.0', '13000'],
                                ['32205 J2/Q', '25', '52', '19.25', '38.0', '32.5', '12000'],
                                ['32206 J2/Q', '30', '62', '21.25', '53.9', '48.0', '10000'],
                                ['32207 J2/Q', '35', '72', '24.25', '72.3', '66.0', '8500'],
                                ['32208 J2/Q', '40', '80', '24.75', '80.9', '78.0', '7500'],
                                ['32209 J2/Q', '45', '85', '24.75', '83.2', '80.0', '7000'],
                                ['32210 J2/Q', '50', '90', '24.75', '87.1', '85.0', '6700'],
                                ['32211 J2/Q', '55', '100', '26.75', '110', '108', '6000'],
                                ['32212 J2/Q', '60', '110', '29.75', '130', '132', '5300'],
                                ['32213 J2/Q', '65', '120', '32.75', '161', '170', '4800'],
                                ['32214 J2/Q', '70', '125', '33.25', '166', '176', '4500'],
                                ['32216 J2/Q', '80', '140', '35.25', '195', '220', '3800'],
                            ]
                        }
                    },
                    {
                        id: 'skf-51200',
                        title: 'SKF Eksenel Bilyali Rulman (51200 Serisi - Ağır)',
                        content: '51200 serisi eksenel bilyalı rulmanlar. 51100 serisine gore daha genis ve daha yüksek eksenel yuk kapasiteli. Tek yonlu eksenel yuk tasir. Vida presleri, döner tablalar ve dik mil uygulamalarinda kullanilir.',
                        image: '/handbook/thrust_ball.png',
                        tags: ['SKF', 'rulman', 'eksenel bilyalı', '51200', '51202', '51204', '51205', '51206', '51208', '51210', 'agir thrust'],
                        table: {
                            headers: ['SKF No', 'd (mm)', 'D (mm)', 'H (mm)', 'C dyn (kN)', 'C0 stat (kN)', 'n_max (rpm)'],
                            rows: [
                                ['51200', '10', '26', '11', '7.61', '12.2', '8000'],
                                ['51201', '12', '28', '11', '7.80', '13.2', '7500'],
                                ['51202', '15', '32', '12', '10.2', '18.3', '6700'],
                                ['51203', '17', '35', '12', '13.1', '24.5', '6300'],
                                ['51204', '20', '40', '14', '17.8', '35.5', '5600'],
                                ['51205', '25', '47', '15', '22.1', '46.5', '5000'],
                                ['51206', '30', '52', '16', '24.9', '53.0', '4500'],
                                ['51207', '35', '62', '18', '35.1', '76.5', '4000'],
                                ['51208', '40', '68', '19', '38.0', '85.0', '3600'],
                                ['51209', '45', '73', '20', '40.5', '93.0', '3400'],
                                ['51210', '50', '78', '22', '45.5', '104', '3200'],
                                ['51212', '60', '95', '26', '62.4', '150', '2600'],
                                ['51214', '70', '105', '27', '64.4', '160', '2400'],
                                ['51216', '80', '115', '28', '66.3', '170', '2200'],
                            ]
                        }
                    }
                ]
            },
            {
                id: 'gears',
                title: 'Dişli Hesabı',
                icon: '⚙️',
                entries: [
                    {
                        id: 'spur-gear',
                        title: 'Duz Disli Temel Formulleri',
                        content: 'Duz disli cark geometrisi ve mukavemet hesabi. Iki disli carkin kavramasi sirasinda bolme dairesi, bas dairesi ve taban dairesi boyutlari modul (m) bazinda hesaplanir.',
                        formula: 'd = m * z\ni = z2/z1 = n1/n2 = d2/d1',
                        image: '/handbook/gear_mesh.png',
                        tags: ['disli', 'modul', 'dis sayisi'],
                        table: {
                            headers: ['Parametre', 'Formul', 'Birim'],
                            rows: [
                                ['Bolme dairesi çapı', 'd = m * z', 'mm'],
                                ['Bas dairesi çapı', 'da = m  (z + 2)', 'mm'],
                                ['Taban dairesi çapı', 'df = m  (z - 2.5)', 'mm'],
                                ['Dis adimi', 'p = ?  m', 'mm'],
                                ['Eksen mesafesi', 'a = m * (z1 + z2) / 2', 'mm'],
                                ['cevresel kuvvet', 'Ft = 2T/d', 'N'],
                            ]
                        }
                    }
                ]
            },
            {
                id: 'belts',
                title: 'Kayış-Kasnak',
                icon: '➰',
                entries: [
                    {
                        id: 'belt-calc',
                        title: 'V-Kayis Hesabı',
                        content: 'V-kayis guc aktarim hesabi.',
                        formula: 'v = ?  d  n / 60000\nP = (F? - F?)  v / 1000',
                        tags: ['kayis', 'kasnak', 'guc aktarimi'],
                    }
                ]
            }
        ]
    },

    // --- CHAPTER 6: AKISKANLAR ---
    {
        id: 'fluids',
        title: 'Akışkanlar & Termodinamik',
        icon: '🌊',
        sections: [
            {
                id: 'pressure-loss',
                title: 'Basınç Kaybı',
                icon: '📉',
                entries: [
                    {
                        id: 'darcy',
                        title: 'Darcy-Weisbach Formulu',
                        content: 'Boru ici akista surtunme basinc kaybi hesabi.',
                        formula: '?P = f * (L/D) * (? * v^2 / 2)\nRe = ? * v * D / ?',
                        tags: ['basinc kaybi', 'darcy', 'reynolds', 'boru'],
                    }
                ]
            },
            {
                id: 'heat-transfer',
                title: 'Isı Transferi',
                icon: '🔥',
                entries: [
                    {
                        id: 'heat-formulas',
                        title: 'Isi Transfer Formulleri',
                        content: 'Uc temel isi transfer mekanizmasi formulleri.',
                        tags: ['isi', 'iletim', 'tasinim', 'isinim'],
                        table: {
                            headers: ['Mekanizma', 'Formul', 'Açıklama'],
                            rows: [
                                ['Iletim', 'Q = k * A * ?T / L', 'Fourier yasasi'],
                                ['Tasinim', 'Q = h * A * ?T', 'Newton soguma'],
                                ['Isinim', 'Q = ? * ? * A * T^4', 'Stefan-Boltzmann'],
                                ['Isil Genlesme', '?L = ? * L0 * ?T', 'Lineer genlesme'],
                            ]
                        }
                    }
                ]
            }
        ]
    },

    // --- CHAPTER 7: FORMUL & BIRIM REFERANSI ---
    {
        id: 'formulas',
        title: 'Formül & Birim Referansı',
        icon: '📝',
        sections: [
            {
                id: 'unit-conversion',
                title: 'Birim Donusum',
                icon: '',
                entries: [
                    {
                        id: 'length-units',
                        title: 'Uzunluk Birimleri',
                        content: 'Temel uzunluk birim donusumleri.',
                        tags: ['birim', 'donusum', 'uzunluk'],
                        table: {
                            headers: ['Birim', 'mm', 'cm', 'm', 'inch', 'ft'],
                            rows: [
                                ['1 mm', '1', '0.1', '0.001', '0.03937', '0.00328'],
                                ['1 cm', '10', '1', '0.01', '0.3937', '0.03281'],
                                ['1 m', '1000', '100', '1', '39.37', '3.281'],
                                ['1 inch', '25.4', '2.54', '0.0254', '1', '0.08333'],
                                ['1 ft', '304.8', '30.48', '0.3048', '12', '1'],
                            ]
                        }
                    },
                    {
                        id: 'force-units',
                        title: 'Kuvvet & Basinc Birimleri',
                        content: 'Kuvvet ve basinc birim donusumleri.',
                        tags: ['birim', 'kuvvet', 'basinc'],
                        table: {
                            headers: ['Birim', 'Pa', 'bar', 'atm', 'psi'],
                            rows: [
                                ['1 Pa', '1', '1e-5', '9.87e-6', '1.45e-4'],
                                ['1 bar', '100000', '1', '0.9869', '14.504'],
                                ['1 atm', '101325', '1.0133', '1', '14.696'],
                                ['1 MPa', '1e6', '10', '9.869', '145.04'],
                                ['1 psi', '6895', '0.0689', '0.068', '1'],
                            ]
                        }
                    }
                ]
            },
            {
                id: 'constants',
                title: 'Fiziksel Sabitler',
                icon: '',
                entries: [
                    {
                        id: 'physics-constants',
                        title: 'Onemli Sabitler',
                        content: 'Muhendislikte sik kullanilan fiziksel sabitler.',
                        tags: ['sabit', 'constant', 'fizik'],
                        table: {
                            headers: ['Sabit', 'Sembol', 'Deger', 'Birim'],
                            rows: [
                                ['Yercekimi ivmesi', 'g', '9.81', 'm/s^2'],
                                ['Stefan-Boltzmann', 'sigma', '5.67e-8', 'W/(m^2 K^4)'],
                                ['Boltzmann', 'k', '1.38e-23', 'J/K'],
                                ['Avogadro', 'NA', '6.022e23', '1/mol'],
                                ['Evrensel gaz', 'R', '8.314', 'J/(mol K)'],
                                ['Atmosfer basinci', 'atm', '101325', 'Pa'],
                                ['Su yogunlugu', '', '1000', 'kg/m^3'],
                            ]
                        }
                    }
                ]
            },
            {
                id: 'area-volume',
                title: 'Alan & Hacim',
                icon: '',
                entries: [
                    {
                        id: 'geometry-formulas',
                        title: 'Geometri Formulleri',
                        content: 'Temel geometrik sekillerin alan ve hacim formulleri.',
                        tags: ['alan', 'hacim', 'geometri', 'formul'],
                        table: {
                            headers: ['Sekil', 'Alan', 'Hacim'],
                            rows: [
                                ['Daire', 'r', '-'],
                                ['Silindir', '2r(r+h)', 'rpih'],
                                ['Kre', '4r', '4/3r^2'],
                                ['Koni', 'r(r+l)', '1/3r^2h'],
                                ['Dikdrtgen Prizma', '2(ab+bc+ac)', 'abc'],
                            ]
                        }
                    }
                ]
            }
        ]
    },

    // --- CHAPTER 8: PROFIL VERILERI ---
    {
        id: 'profiles',
        title: 'Profil & Kesit Verileri',
        icon: '🏗️',
        sections: [
            {
                id: 'ipe-profiles',
                title: 'IPE Profilleri',
                icon: '👷',
                entries: [
                    {
                        id: 'ipe-table',
                        title: 'IPE Profil Tablosu',
                        content: 'Avrupa standardi I profil boyutlari ve kesit degerleri. IPE profilinin kesit gorunumu h (yukseklik), b (baslik genişliği), tw (govde kalinligi), tf (baslik kalınlığı) ve r (kaynak yari çapı) ölçüleriyle tanımlanır.',
                        image: '/handbook/ipe_profile.png',
                        tags: ['IPE', 'profil', 'I kesit', 'celik'],
                        table: {
                            headers: ['Profil', 'h (mm)', 'b (mm)', 'A(cm^2)', 'Ix(cm^4)', 'Wx(cm^3)', 'kg/m'],
                            rows: [
                                ['IPE 80', '80', '46', '7.64', '80.1', '20.0', '6.0'],
                                ['IPE 100', '100', '55', '10.3', '171', '34.2', '8.1'],
                                ['IPE 120', '120', '64', '13.2', '318', '53.0', '10.4'],
                                ['IPE 140', '140', '73', '16.4', '541', '77.3', '12.9'],
                                ['IPE 160', '160', '82', '20.1', '869', '109', '15.8'],
                                ['IPE 180', '180', '91', '23.9', '1317', '146', '18.8'],
                                ['IPE 200', '200', '100', '28.5', '1943', '194', '22.4'],
                                ['IPE 220', '220', '110', '33.4', '2772', '252', '26.2'],
                                ['IPE 240', '240', '120', '39.1', '3892', '324', '30.7'],
                                ['IPE 270', '270', '135', '45.9', '5790', '429', '36.1'],
                                ['IPE 300', '300', '150', '53.8', '8356', '557', '42.2'],
                                ['IPE 360', '360', '170', '72.7', '16270', '904', '57.1'],
                            ]
                        }
                    }
                ]
            },
            {
                id: 'pipe-profiles',
                title: 'Boru Profilleri',
                icon: '⭕',
                entries: [
                    {
                        id: 'steel-pipes',
                        title: 'celik Boru Boyutlari',
                        content: 'Standart celik boru boyutlari (DIN 2440/2441).',
                        tags: ['boru', 'pipe', 'celik'],
                        table: {
                            headers: ['DN', 'Dis cap (mm)', 'Et (mm)', 'kg/m'],
                            rows: [
                                ['DN 15', '21.3', '2.65', '1.22'],
                                ['DN 20', '26.9', '2.65', '1.58'],
                                ['DN 25', '33.7', '3.25', '2.44'],
                                ['DN 32', '42.4', '3.25', '3.14'],
                                ['DN 40', '48.3', '3.25', '3.61'],
                                ['DN 50', '60.3', '3.65', '5.10'],
                                ['DN 65', '76.1', '3.65', '6.54'],
                                ['DN 80', '88.9', '4.05', '8.47'],
                                ['DN 100', '114.3', '4.50', '12.2'],
                            ]
                        }
                    }
                ]
            }
        ]
    },

    // --- CHAPTER 9: GUC AKTARIMI ---
    {
        id: 'transmission',
        title: 'Güç Aktarımı',
        icon: '⚙️',
        sections: [
            {
                id: 'belts',
                title: 'Kayislar ve Kasnaklar',
                icon: '',
                entries: [
                    {
                        id: 'v-belts',
                        title: 'V-Kayis Profilleri',
                        content: 'Genel endustriyel kullanim icin klasik V-kayislari ve dar V-kayislari standart olculeri.',
                        tags: ['kayis', 'kasnak', 'power', 'v-belt', 'transmission'],
                        table: {
                            headers: ['Profil', 'Genislik W (mm)', 'Yukseklik H (mm)', 'Aci', 'Min Kasnak çapı (mm)'],
                            rows: [
                                ['Z', '10.0', '6.0', '40 derece', '50'],
                                ['A', '13.0', '8.0', '40 derece', '75'],
                                ['B', '17.0', '11.0', '40 derece', '125'],
                                ['C', '22.0', '14.0', '40 derece', '200'],
                                ['D', '32.0', '19.0', '40 derece', '355'],
                                ['SPZ (Dar)', '9.7', '8.0', '40 derece', '63'],
                                ['SPA (Dar)', '12.7', '10.0', '40 derece', '90'],
                                ['SPB (Dar)', '16.3', '13.0', '40 derece', '140'],
                                ['SPC (Dar)', '22.0', '18.0', '40 derece', '224'],
                            ]
                        }
                    },
                    {
                        id: 'belt-length-formula',
                        title: 'Kayis Boyu Hesabı',
                        content: 'Iki kasnakli bir sistemde yaklasik kayis boyu hesaplama formul.',
                        formula: 'L = 2C + (pi/2)(D + d) + (D - d)^2 / (4C)\n\nL = Kayis Boyu\nC = Eksenler arasi mesafe\nD = Buyuk kasnak capi\nd = Kucuk kasnak çapı',
                        tags: ['kayis', 'boy', 'formul']
                    }
                ]
            },
            {
                id: 'gears',
                title: 'Disliler ve Standartlar',
                icon: '',
                entries: [
                    {
                        id: 'gear-terminology',
                        title: 'Duz Disli Temelleri (Spur Gears)',
                        content: 'Duz disliler icin temel AGMA/ISO terimleri. Modul (m) metrik dislilerin standardidir. Formul: Bolum Dairesi çapı (d) = Modul (m)  Dis Sayisi (z).',
                        tags: ['disli', 'modul', 'AGMA', 'ISO'],
                        table: {
                            headers: ['Terim', 'Sembol/Formul', 'Açıklama'],
                            rows: [
                                ['Modul', 'm', 'Dis byklg ölçüsü (Standart seriler: 1, 1.25, 1.5, 2, 2.5, 3 ...)'],
                                ['Bolum Dairesi', 'd = m * z', 'Teorik yuvarlanma çapı (Pitch diameter)'],
                                ['Dis cap', 'd_a = m * (z + 2)', 'Disli taslaginin en dis çapı'],
                                ['Dis Dibi capi', 'd_f = m * (z - 2.5)', 'Kucuk çapı (Standart dis derinligi)'],
                                ['Eksenler Arasi', 'a = m(z1+z2)/2', 'Iki disli arasi merkez mesafesi'],
                            ]
                        }
                    },
                    {
                        id: 'gear-lewis',
                        title: 'Lewis Formul ve Dis Mukavemeti',
                        content: 'Lewis formul, dis dibindeki egilme gerilmesini hesaplar. F_t: Tegetsel kuvvet, b: Yuzey genişliği, Y: Lewis form faktor. Formul: sigma = F_t / (b * m * Y)',
                        formula: 'sigma_bending = F_t / (b * m * Y)',
                        tags: ['disli', 'lewis', 'gerilme', 'mukavemet']
                    }
                ]
            },
            {
                id: 'springs',
                title: 'Yay Tasarimi (Springs)',
                icon: '',
                entries: [
                    {
                        id: 'compression-springs',
                        title: 'Baski Yaylari ve Wahl Faktor',
                        content: 'Helezon basi yaylarinin hesaplanmasi. Yay Teli capi (d), Ortalama Yay çapı (D), Yay Indeksi (C = D/d). Sertlik: k = (G * d^4) / (8 * D^3 * N_a). Kayma gerilmesi formulune ayrica kesme ve egrilik etkisini katan Wahl Faktor (K_w) eklenir.',
                        formula: 'k = (G * d^4) / (8 * D^3 * N_a)\n\ntau = K_w * (8 * F * D) / (pi * d^3)\nK_w = (4C - 1)/(4C - 4) + 0.615/C',
                        tags: ['yay', 'spring', 'Wahl', 'yay katsayisi', 'kayma gerilmesi']
                    }
                ]
            },
            {
                id: 'bearings',
                title: 'Rulmanlar (Bearings)',
                icon: '',
                entries: [
                    {
                        id: 'skf-deep-groove',
                        title: 'Sabit Bilyali Rulman Standart Serisi',
                        content: 'Endustride en yaygin kullanilan sabit bilyalı (Deep groove ball bearing) rulmanlarin i cap (Mil) ve dis cap referanslari (Orn: SKF 6000 Serisi). Son iki hane  5 = Ic cap (20mm ve uzeri icin). Orn: 6204 = 045 = 20mm i cap.',
                        tags: ['rulman', 'SKF', 'yatak', 'bilyalı'],
                        table: {
                            headers: ['Rulman Kodu', 'Ic cap (d)', 'Dis cap (D)', 'Genislik (B)'],
                            rows: [
                                ['6200', '10 mm', '30 mm', '9 mm'],
                                ['6201', '12 mm', '32 mm', '10 mm'],
                                ['6202', '15 mm', '35 mm', '11 mm'],
                                ['6203', '17 mm', '40 mm', '12 mm'],
                                ['6204', '20 mm', '47 mm', '14 mm'],
                                ['6205', '25 mm', '52 mm', '15 mm'],
                                ['6206', '30 mm', '62 mm', '16 mm'],
                                ['6208', '40 mm', '80 mm', '18 mm'],
                                ['6210', '50 mm', '90 mm', '20 mm'],
                            ]
                        }
                    }
                ]
            },
            {
                id: 'motors',
                title: 'Elektrik Motorlari',
                icon: '',
                entries: [
                    {
                        id: 'iec-motors',
                        title: 'IEC Elektrik Motoru Govde (Frame) olculeri',
                        content: 'Standart asenkron elektrik motorlari (IEC standartlari). H = Mil Eksen Yuksekligi.',
                        tags: ['motor', 'IEC', 'elektrik', 'govde', 'frame'],
                        table: {
                            headers: ['Govde (H)', 'Mil capi (d)', 'Mil Uzunlugu (l)', 'Ayak Delik çapı (K)'],
                            rows: [
                                ['56', '9 mm', '20 mm', '5.8 mm'],
                                ['63', '11 mm', '23 mm', '7.0 mm'],
                                ['71', '14 mm', '30 mm', '7.0 mm'],
                                ['80', '19 mm', '40 mm', '10.0 mm'],
                                ['90', '24 mm', '50 mm', '10.0 mm'],
                                ['100', '28 mm', '60 mm', '12.0 mm'],
                                ['112', '28 mm', '60 mm', '12.0 mm'],
                                ['132', '38 mm', '80 mm', '12.0 mm'],
                                ['160', '42 mm', '110 mm', '14.5 mm'],
                                ['180', '48 mm', '110 mm', '14.5 mm'],
                            ]
                        }
                    }
                ]
            }
        ]
    },

    // --- CHAPTER 10: ATOLYE PRATIK STANDARTLARI (SHOP-FLOOR) ---
    {
        id: 'shop-floor',
        title: 'Atölye Pratik Standartları',
        icon: '🏭',
        sections: [
            {
                id: 'tapping',
                title: 'Diş Çekme (Tapping)',
                icon: '🔧',
                entries: [
                    {
                        id: 'tap-drill-sizes',
                        title: 'Kilavuz Cekme Matkap Caplari (Metrik)',
                        content: 'Metrik standart (M) vidalar iin kilavuz oncesi delinecek matkap capi tablosu. Formul: Matkap capi = Dis çapı - Adim (d = D - P). Veriler atolye imalat operasyonlari iin %75 dis derinligine gre optimize edilmistir.',
                        formula: 'Matkap çapı = M_D - Adim',
                        tags: ['matkap', 'kilavuz', 'dis acma', 'tap drill', 'atolye', 'CNC'],
                        table: {
                            headers: ['Metrik Dis', 'Adim (mm)', 'Matkap çapı (mm)'],
                            rows: [
                                ['M3', '0.50', '2.50'],
                                ['M4', '0.70', '3.30'],
                                ['M5', '0.80', '4.20'],
                                ['M6', '1.00', '5.00'],
                                ['M8', '1.25', '6.80'],
                                ['M10', '1.50', '8.50'],
                                ['M12', '1.75', '10.20'],
                                ['M14', '2.00', '12.00'],
                                ['M16', '2.00', '14.00'],
                                ['M20', '2.50', '17.50'],
                                ['M24', '3.00', '21.00'],
                            ]
                        }
                    }
                ]
            },
            {
                id: 'sheet-metal',
                title: 'Sac Metal (Sheet Metal)',
                icon: '✂️',
                entries: [
                    {
                        id: 'sheet-gauges',
                        title: 'Standart Sac Kalinliklari ve Agirliklari',
                        content: 'Endustride sik kullanilan standart dkp ve siyah sac kalinlik olculeri ve 1 m^2 plaka (7.85 g/cm^2) iin yaklasik agirliklari.',
                        tags: ['sac', 'kalinlik', 'sheet metal', 'gauge', 'agirlik', 'dkp'],
                        table: {
                            headers: ['Kalinlik (mm)', '1 m^2 Agirligi (kg)', 'Açıklama'],
                            rows: [
                                ['0.50', '3.93', 'Ince formaj'],
                                ['1.00', '7.85', 'Genel kullanim'],
                                ['1.20', '9.42', 'Pano / Kutu'],
                                ['1.50', '11.78', 'Sase yan paneli'],
                                ['2.00', '15.70', 'Tasiyici braket'],
                                ['3.00', '23.55', 'Hafif sase'],
                                ['4.00', '31.40', 'Makine govdesi'],
                                ['5.00', '39.25', 'Yapisal plaka'],
                                ['10.0', '78.50', 'Ağır sanayi tabani'],
                            ]
                        }
                    },
                    {
                        id: 'bend-allowance',
                        title: 'Abkant Bükme (K-Faktr Uygulamasi)',
                        content: 'Abkant preslerde sac bukulurken uzayan kismin hesabi (Acinim Boyu). K-Faktr malzemenin notr ekseninin kayma miktarini belirtir. Genel celikler iin endustri standardi K = 0.33 ila 0.44 arasindadir.',
                        formula: 'Bend Allowance (BA) = Aci  (?/180)  (R + K  T)\n\nR = Bükme I Yari çapı\nT = Sac Kalinligi\nK = K-Faktr',
                        tags: ['bkm', 'abkant', 'bend allowance', 'k-factor', 'acinim'],
                    }
                ]
            }
        ]
    }
];
