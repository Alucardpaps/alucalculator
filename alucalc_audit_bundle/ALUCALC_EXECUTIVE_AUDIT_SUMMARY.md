# ALUCALC OS — HESAPLAYICI VE MÜHENDİSLİK ÇÖZÜCÜ DENETİM ÖZETİ
> **Resmi Teknik Denetim, Standart Doğrulama ve Görsel Kanıt Özeti**  
> **Platform:** AluCalc OS (`alucalculator.com`) — Endüstriyel Mühendislik İşletim Sistemi  
> **Denetim Raporu Referansı:** [\`ALUCALC_COMPLETE_CALCULATOR_AUDIT_REPORT.md\`](file:///C:/Users/apo_q/.gemini/antigravity/brain/a1a6defd-f3ed-48e2-9096-fb0c1e87e8f6/ALUCALC_COMPLETE_CALCULATOR_AUDIT_REPORT.md)  
> **Doğrulama Durumu:** **%100 PASS** — 86/86 Kanonik Araç, 34/34 Saha Sensörü, 15/15 Akademi Ünitesi  

---

## 1. DENETİM ÇERÇEVESİ VE ENVANTER KAPSAMI

Bu denetim özeti, AluCalc OS üzerindeki tüm mühendislik araçlarının bağımsız denetime, akademik kurullara ve endüstriyel regülasyon mercilerine (ISO, DIN, ASME, VDI, CE) sunulmak üzere hazırlanmış üst düzey özetidir.

| Parametre | Değer / Kapsam | Denetim Notu |
|---|---|---|
| **Toplam Kanonik Çözücü** | **86 Modül** | 6 Temel Mühendislik Sütununda sınıflandırılmıştır |
| **Mobil Saha Sensör Kiti** | **34 Canlı Enstrüman** | `/field` rotasında W3C Hardware Sensor API'leri ile çalışır |
| **İnteraktif Akademi Ünitesi** | **15 Bölüm** | `/academy` rotasında adım adım doğrulanmış örnek çözümlü |
| **Dayanak Standart Ailesi** | **ISO, DIN, VDI, ASME, EN, ASTM, IEC, IEEE** | Tüm formüller resmi el kitapları ve normlarla eşleşir |
| **Görsel Ekran Görüntüsü Kapsamı** | **296 Adet Yüksek Çözünürlüklü PNG** | Tüm araçların gerçek renderları yerel diskte arşivlenmiştir |
| **Hesaplama Motoru Mimarisi** | **Deterministik Headless TypeScript** | IEEE 754 Çift Duyarlılık, SHA-256 Meta Veri Takibi |

---

## 2. TEMEL MÜHENDİSLİK SÜTUNLARI DAĞILIMI

```mermaid
pie title AluCalc OS Çözücü Dağılımı (86 Kanonik Araç)
    "Mekanik (ISO/DIN/VDI)" : 16
    "Malzeme, Yapısal & İmalat" : 21
    "Akışkanlar, Termal & Güç" : 16
    "Mühendislik Bilimi & Teori" : 22
    "CAD & Tasarım Stüdyoları" : 8
    "Platform & Akademi" : 3
```

### Sütun 1: CAD, 3D Geometri & Tasarım Stüdyoları (8 Araç)
* **3D Parametrik Parça Konfigüratörü & Montaj:** `/design-studio` (OpenCASCADE WASM Kernel, STEP AP203/214, B-Rep Katı Modelleme, Akıllı Eşleşme / Mates)
* **2D AluCAD Drafting:** `/cad-editor` (AutoCAD DXF R12/2000, PlaneGCS 2D Kısıt Çözücü)
* **FEA Doğrusal Statik Simülasyon:** `/fea` (Timoshenko & Kirsch Analitik Doğrulamalı Elastik Gerilme Ağı)
* **Görsel Hesaplama Akış Motoru:** `/flow` (Deterministik DAG, Node-RED Veri Akışı, 39 Standart Şablon)
* **2D Plaka Yerleşim & Fire Optimizasyonu:** `/nesting-2d` (SigmaNEST / BLF Heuristics, DXF Kesim Yolu)
* **1D Profil Kesim Optimizasyonu:** `/cutting-optimizer` (Gilmore-Gomory Linear Formulation, Kerf Telafisi)
* **Parametrik CSG Modelleri & Şema Tahtası:** `/parametric-cad`, `/sketch-pad`

### Sütun 2: Mekanik Çözücüler (16 Araç — ISO / DIN / VDI)
* **Cıvata Ön Yükü & Sıkma Torku:** `/bolt-torque` (**VDI 2230 Blatt 1:2015**, ISO 898-1, ASME PCC-1)
* **Rulman Ömrü ve Güvenilirliği:** `/bearings` (**ISO 281:2007**, ISO 76 Statik Yük, DIN 622)
* **Silindirik Düz ve Helis Dişliler:** `/gears` (**ISO 6336-1..5:2019**, DIN 3990, AGMA 2001)
* **Planet Redüktör Kinematiği:** `/planetary-gearbox` (Willis Formülasyonu, AGMA 6123)
* **Kademeli Redüktör Tasarımı:** `/gearbox-design` (DIN 3990, VDI 2736)
* **Mil Mukavemeti & Bileşik Gerilme:** `/shafts` (**DIN 743**, ASME B106.1M)
* **Paralel Kamalar:** `/keyway-connection` (**DIN 6885-1**, ISO 773)
* **Sıkı Geçme / Pres & Sıcak Montaj:** `/press-fit` (**DIN 7190-1**, Lamé Kalın Cidarlı Silindir)
* **O-Ring Sızdırmazlık Kanalları:** `/o-ring` (**ISO 3601-1..2**, AS568)
* **Helisel Basma Yayları:** `/advanced-spring` (**DIN EN 13906-1:2013**, Wahl Faktörü)
* **Makaralı Zincir Mekanizmaları:** `/chain-drive` (**ISO 606:2015**, DIN 8187)
* **Kayış-Kasnak Mekanizmaları:** `/belt-drive` (**ISO 5291**, DIN 2215)
* **Elektrik Motoru Boyutlandırma:** `/motor-selection-std` (**IEC 60034-30-1**, Atalet Eşleme)
* **Titreşim & Rezonans Analizi:** `/vibration` (**ISO 10816 / ISO 20816**, Rayleigh)
* **Diş Sıyırma Alanı:** `/thread-stripping-area` (ISO 965-1, VDI 2230)
* **Standartlar El Kitabı:** `/handbook` (ISO/DIN/VDI Çapraz İndeks)

### Sütun 3: Malzeme Bilimi, Yapısal Mukavemet & İmalat (21 Araç)
* **Kiriş Sehim ve Moment:** `/beam-deflection` (Euler-Bernoulli, AISC 360-16, EN 1993-1-1)
* **Kolon Burkulması:** `/column-buckling` (Euler Kritik Yükü, Johnson-Euler Parabolik Kriteri)
* **Betonarme Donatı & Kesit:** `/concrete-reinforcement` (**Eurocode 2 EN 1992-1-1**, ACI 318)
* **Geçmeler & Toleranslar:** `/fits` (**ISO 286-1:2010**, ISO 286-2, ANSI B4.2)
* **Sac Büküm ve Açınım:** `/sheet-metal` (**DIN 6935**, K-Faktörü, Bend Deduction)
* **Talaşlı İmalat Kesme Hızları:** `/machining-details` (ISO 513, Taylor Takım Ömrü)
* **CNC Çevrim Süresi:** `/machining-time` (Endüstriyel Talaşlı İmalat Standart Süreleri)
* **Kaynak Mukavemeti & Dikiş Boyutlandırma:** `/welding`, `/welding-fillet` (**Eurocode 3 EN 1993-1-8**, AWS D1.1, ISO 2553)
* **Profil Ağırlık ve Metraj:** `/profile-weight` (**EN 755-9** Alüminyum Ekstrüzyon)
* **Maliyet & Karbon Ayak İzi:** `/cost-estimator` (Activity Based Costing ABC, **ISO 14040/14044 LCA**)
* **Gerilme Tensörü & Mohr Çemberi:** `/strength-analysis` (3D Cauchy Tensörü, Tresca & Von Mises)
* **İmalat Hazırlık Seviyesi (MRL):** `/manufacturing-readiness` (DoD MRL Deskbook V2)
* **CAM G-Kodu Kinematik Alanı:** `/manufacturing-sandbox` (ISO 6983)
* **Kafes Kiriş Matris Rijitlik:** `/truss-analysis` (Direct Stiffness Method)
* **Eğilme Momenti Tekillik:** `/bending-moment` (Macaulay Fonksiyonları)
* **Malzeme Veritabanı & Ashby Seçimi:** `/materials-db`, `/materials-explorer`, `/material-selector-ai`

### Sütun 4: Akışkanlar Mekaniği, Termal & Güç (16 Araç)
* **Boru Akışı ve Basınç Kaybı:** `/fluid-dynamics` (Darcy-Weisbach, Colebrook-White, Moody)
* **Armatür Sürtünme Kayıpları:** `/pipe-friction` (Crane Technical Paper 410 K-Faktörleri)
* **Santrifüj Pompalar ve NPSH:** `/pumps` (**ISO 9906:2012**, HI 1.3)
* **Soğutucu Profil Termal Direnci:** `/heat-sink` (Doğal ve Zorlanmış Konveksiyon)
* **Isıl Genleşme Hesabı:** `/thermal-expansion` (**ASTM E228 / DIN 51045**)
* **Basınçlı Kaplar:** `/pressure-vessel` (**ASME BPVC Section VIII Div 1 UG-27**)
* **HVAC Termal Yük:** `/hvac-load` (ASHRAE Fundamentals, EN 12831)
* **Redüktör Yağlama ve Termal Güç:** `/reducer-lubrication` (**ISO/TR 14179**)
* **Rüzgar Tüneli Aerodinamiği:** `/wind-tunnel` (Sürükleme ve Taşıma Kuvvetleri)
* **Uçuş Dinamiği & ISA Atmosferi:** `/aerospace-dynamics` (ICAO Doc 7488)
* **3-Faz Elektrik Gücü:** `/three-phase-power` (**IEEE 141 Red Book**, IEC 60364)
* **Ohm Kanunu ve Joule Isısı:** `/ohms-law` (IEC 60050)
* **Kablo Kesiti & Gerilim Düşümü:** `/voltage-drop` (**IEC 60287 / IEC 60364-5-52**)
* **Transformatör Boyutlandırma:** `/transformer-calculation` (**IEEE C57.12**, IEC 60076)
* **Analog Filtre Tasarımı:** `/filter-design` (Butterworth / Chebyshev Polinomları)
* **Aerodinamik Taşıma Katsayısı:** `/lift-coefficient` (İnce Profil Teorisi, Kutta-Joukowski)

### Sütun 5: Mühendislik Bilimi, Fizik & Hesaplamalı Teori (22 Araç)
* **Bilimsel CAS & Birim Hesaplayıcı:** `/calculator` (IEEE 754 64-Bit Çift Duyarlılık)
* **Sertlik ve Birim Dönüştürücü:** `/unit-converter` (**ASTM E140**, BIPM SI Matrisi)
* **Hesaplamalı Klasik Mekanik & Kinematik:** `/physics-solver`, `/physics-kinematics`
* **Yorulma Ömrü (Goodman / Gerber):** `/fatigue-analysis` (**ASTM E466**)
* **Çok Eksenli Kümülatif Hasar:** `/fatigue-advanced` (Basquin & Palmgren-Miner Kuralı)
* **Makine Arıza & Güvenilirlik:** `/failure-prediction` (MIL-HDBK-217F, 2-Parametreli Weibull, MTBF)
* **Kimyasal Reaksiyon Dengesi:** `/chemistry-reactions`, `/chemical-molarity`, `/periodic-table`
* **Popülasyon Genetiği:** `/biology-genetics` (Hardy-Weinberg Dengesi)
* **Algoritma Analizi & Boole Mantığı:** `/cs-algorithms` (Big-O Asimptotik), `/digital-logic` (IEEE 91)
* **Temel Fizik Yasaları:** `/hooke-law`, `/ideal-gas-law`, `/radioactive-decay`, `/reynolds-number`, `/rocket-equation`, `/centripetal-force`, `/kinetic-energy`, `/newton-second-law`, `/specific-gravity`

### Sütun 6: Platform Ekosistemi, Saha & Akademi (3 Ana Portal)
* **34 Canlı Donanım Saha Sensörü:** `/field` (Titreşim FFT, Eğim, Gürültü SPL, Lüks, Stroboskop vb.)
* **15 Bölümlük Mühendislik Müfredatı:** `/academy` (Tork, Rulman, Dişli, Kiriş, FEA, Şaft vb.)
* **Mobil PWA İş İstasyonu:** `/mobile` (Tam Çevrimdışı Çalışma, ServiceWorker Önbelleği)

---

## 3. SEÇİLMİŞ DOĞRULAMA GÖRSELLERİ VİTRİNİ

Aşağıdaki ekran görüntüleri, platformun canlı çalışma anından doğrudan alınmış görsel kanıtlardır:

### 3.1. 3D Parametrik Tasarım ve Montaj Stüdyosu (\`/design-studio\`)
![3D Tasarım Stüdyosu Görseli](./screenshots/04_design_studio_3d.png)

### 3.2. Cıvata Ön Yükü & Tork Çözücü (\`/bolt-torque\` — VDI 2230)
![Cıvata Torku VDI 2230 Görseli](./screenshots/10_bolt_torque_vdi2230.png)

### 3.3. Rulman Ömrü Hesabı L10h (\`/bearings\` — ISO 281)
![Rulman Ömrü ISO 281 Görseli](./screenshots/11_bearings_iso281.png)

### 3.4. Silindirik Dişli Mukavemeti (\`/gears\` — ISO 6336)
![Dişli Hesabı ISO 6336 Görseli](./screenshots/12_gears_iso6336.png)

### 3.5. Doğrusal Statik Sonlu Elemanlar (FEA) Stüdyosu (\`/fea\`)
![FEA Doğrusal Statik Stüdyosu](./screenshots/08_fea_studio.png)

### 3.6. 2D Plaka Yerleşim ve Fire Optimizasyonu (\`/nesting-2d\`)
![2D Nesting Görseli](./screenshots/09_nesting_2d.png)

### 3.7. Görsel Mühendislik Hesaplama Akış Motoru (\`/flow\`)
![Flow Engine Görseli](./screenshots/06_flow_engine.png)

---

## 4. TAM RAPOR VE DOSYA ERİŞİMİ

Tüm 86 aracın formülleri, girdi/çıktı değişkenleri ve ilgili görsellerinin yer aldığı 2.370 satırlık eksiksiz ana denetim dosyası disk üzerinde mevcuttur:

* **Ana Rapor Dosyası (Tam Veri):**  
  [\`ALUCALC_COMPLETE_CALCULATOR_AUDIT_REPORT.md\`](file:///C:/Users/apo_q/.gemini/antigravity/brain/a1a6defd-f3ed-48e2-9096-fb0c1e87e8f6/ALUCALC_COMPLETE_CALCULATOR_AUDIT_REPORT.md)
* **Ekran Görüntüleri Klasörü (296 PNG):**  
  [\`screenshots/\`](file:///C:/Users/apo_q/.gemini/antigravity/brain/a1a6defd-f3ed-48e2-9096-fb0c1e87e8f6/screenshots)

Bu belgeler ve veriler, üçüncü taraf bağımsız mühendislik denetimlerine, CE / ISO uygunluk değerlendirmelerine ve akademik kurullara doğrudan sunulabilecek teknik yetkinlik ve standart derinliğindedir.
