# ALUCALC OS — G2 Çok Disiplinli Katalog, Çakışma Denetimi ve 200+ Motor Defteri (Ledger)

> **Kapı Durumu:** `Baslama_Izinleri!C5 = BAŞLAT` (Kullanıcı tarafından G2 envanter aşaması için başlatıldı) · `Kapilar!G7 = GEÇTİ` · `Kapilar!H7 = BEKLİYOR` (Kullanıcı kabul onayı bekleniyor) · **G3–G9 KİLİTLİ (`BEKLİYOR`)**

---

## 1. G2-01 & G2-07 — 14 Disiplinli Ürün Taksonomisi, Menü/Filtre ve SEO Route Mimarisi

AluCalc OS'un mevcut 5 üst kümesi (`CAD & Tasarım`, `Makine Mühendisliği`, `Malzeme Yapı ve Üretim`, `Akışkan Termal Elektrik`, `Bilim ve Teori`) korunarak, çok disiplinli 200+ motor hedefi için **14 taranabilir mühendislik disiplini** ve canonical URL/filtre taksonomisi tanımlanmıştır:

| # | Disiplin Kodu | Disiplin Adı (TR / EN) | Canonical Kategori Hub Route | Mevcut Motor (`Hesap adayı`) | Aday Havuzu (`Aday_252`) | Çakışan (`EX-xxx`) | Net Yeni (`BENZERSİZ`) | Hedef Kapı |
|---|---|---|---|---|---|---|---|---|
| 1 | `ARCH-BIM` | Mimarlık / BIM | `/calculators/?discipline=architecture-bim` | 0 | 18 | 2 | **16** | G3 |
| 2 | `CIVIL-STR` | İnşaat / Yapı | `/calculators/?discipline=civil-structural` | 5 (`EX-025..027, 044..045`) | 18 | 9 | **9** | G3 |
| 3 | `GEO-SURV` | Geoteknik / Harita / Altyapı | `/calculators/?discipline=geotechnical-surveying` | 0 | 18 | 0 | **18** | G3 |
| 4 | `ELEC-PWR` | Elektrik / Güç | `/calculators/?discipline=electrical-power` | 4 (`EX-056..059`) | 18 | 5 | **13** | G5 |
| 5 | `ELEC-CTRL` | Elektronik / Kontrol | `/calculators/?discipline=electronics-control` | 1 (`EX-060`) | 18 | 6 | **12** | G5 |
| 6 | `IND-LOG` | Endüstri / Lojistik | `/calculators/?discipline=industrial-logistics` | 0 | 18 | 3 | **15** | G5 |
| 7 | `CNC-CAM` | CNC / CAM | `/calculators/?discipline=cnc-cam` | 2 (`EX-033..034`) | 18 | 9 | **9** | G4 |
| 8 | `LASER-SHEET` | Lazer / Plazma / Sac | `/calculators/?discipline=laser-plasma-sheet` | 1 (`EX-032` + `EX-006` Stüdyo) | 18 | 8 | **10** | G4 |
| 9 | `MECH-PWR` | Mekanik / Güç Aktarım | `/calculators/?discipline=mechanical-powertrain` | 15 (`EX-009..022, 024`) | 18 | 10 | **8** | G6 |
| 10 | `HVAC-NRG` | HVAC / Enerji | `/calculators/?discipline=hvac-energy` | 3 (`EX-046..047, 052`) | 18 | 3 | **15** | G5 |
| 11 | `FLUID-PROC` | Akışkan / Proses / Kimya | `/calculators/?discipline=fluid-process-chemical` | 5 (`EX-048..051, 053`) | 18 | 2 | **16** | G5 |
| 12 | `MAT-QUAL` | Malzeme / Kalite / Üretim | `/calculators/?discipline=materials-quality` | 7 (`EX-030..031, 035..039`) | 18 | 5 | **13** | G4 |
| 13 | `AERO-TRANS` | Ulaşım / Havacılık / Deniz | `/calculators/?discipline=transport-aerospace-marine` | 3 (`EX-054..055, 061`) | 18 | 2 | **16** | G6 |
| 14 | `SCI-MATH` | Bilim / Matematik / Veri | `/calculators/?discipline=science-math-data` | 19 (`EX-062..069, 071, 074..083`) | 18 | 0 | **18** | G5 |
| **TOPLAM** | **14 Disiplin** | **Tüm Mühendislik Alanları** | `https://www.alucalculator.com/calculators/` | **65** (`+3` Stüdyo solver = 68) | **252** | **64** | **188** | **G3–G6** |

### SEO & Navigasyon Kuralları (`G2-07`)
1. **Trailing-Slash Statik Rota Uyumu:** `next.config.ts` (`output: 'export'`, `trailingSlash: true`) uyarınca her yeni hesap motoru `/<slug>/` altında statik HTML + JSON-LD (`SoftwareApplication` + `TechArticle`) üretir.
2. **Canonical Tekillik:** Mevcut 64 çakışan aday için yeni mükerrer URL açılmaz; mevcut canonical URL (`/bearings/`, `/shafts/`, `/gears/`, `/nesting-2d/`, `/machining-details/` vb.) korunur ve alt modül/sekme olarak genişletilir.
3. **188 Benzersiz Aday İçin Taranabilir Route Şablonu:** `src/config/seo.ts` ve `src/app/sitemap.ts` içine yalnızca geliştirilip QA'den geçen (`DOĞRULANDI`) benzersiz motorlar eklenir; boş/placeholder sayfa yayınlamak yasaktır.

---

## 2. G2-02 & V12-10 — 252 Adayın Mevcut 86 Envanterle Bire Bir Çakışma Denetimi (64 Çakışma / 188 Benzersiz)

`Aday_252` sayfasındaki 252 adayın tamamı `Mevcut_86` (`EX-001`..`EX-086`) ile fonksiyon, standart ve girdi/çıktı sözleşmesi düzeyinde karşılaştırılmıştır:
- **64 Aday (`ÇAKIŞMA: EX-xxx`):** Mevcut 86 katalog öğesindeki bir hesap motoru veya solver-destekli stüdyo ile aynı çekirdek problemi çözmektedir. Bu 64 aday `Aday_252!I` sütununda `"ÇAKIŞMA: EX-xxx (...)"` olarak işaretlenmiştir ve `N` sütunundaki formül (`I="BENZERSİZ"`) gereği **200+ yeni motor sayacına asla dahil edilmez (`0` sayılır)**.
- **188 Aday (`BENZERSİZ`):** Mevcut 86 araçta karşılığı olmayan, tamamen yeni mühendislik hesap motorlarıdır.

### 64 Çakışan Adayın Tam Eşleme Listesi (`NEW-xxx ↔ EX-xxx`)

| # | Aday ID | Disiplin | Aday Adı | Çakıştığı Mevcut Kayıt (`Mevcut_86`) | Karar / Aksiyon |
|---|---|---|---|---|---|
| 1 | `NEW-003` | Mimarlık / BIM | Cephe Paneli Metrajı | `EX-037` (Profile Weight, Area & Mass Metrage) | Mevcut `EX-037` metraj motorunun alt şablonu |
| 2 | `NEW-018` | Mimarlık / BIM | Mahal Malzeme Metraj ve Yaklaşık Maliyet | `EX-038` (Manufacturing Should-Cost & Carbon Estimator) | Mevcut `EX-038` maliyet motoruyla birleştirilir |
| 3 | `NEW-020` | İnşaat / Yapı | Çelik Kesit Sınıflandırması | `EX-026` (Column Buckling Euler & Johnson) | Mevcut `EX-026` çelik kolon modülünde kesit sınıfı |
| 4 | `NEW-021` | İnşaat / Yapı | Çelik Kolon N-M Etkileşim Ön Kontrolü | `EX-026` (Column Buckling Euler & Johnson) | Mevcut `EX-026` eksenel+eğilme uzantısı |
| 5 | `NEW-022` | İnşaat / Yapı | Yanal Burulmalı Burkulma Ön Kontrolü | `EX-025` (Beam Deflection & Bending Moments) | Mevcut `EX-025` kiriş tasarım motoru uzantısı |
| 6 | `NEW-024` | İnşaat / Yapı | Betonarme Tek Yönlü Döşeme | `EX-027` (Reinforced Concrete RC Sizing) | Mevcut `EX-027` betonarme kesit motoru kapsamında |
| 7 | `NEW-028` | İnşaat / Yapı | Betonarme Kesme Donatısı | `EX-027` (Reinforced Concrete RC Sizing) | Mevcut `EX-027` etriye/kesme hesabı kapsamında |
| 8 | `NEW-029` | İnşaat / Yapı | Döşeme Sehim ve Çatlak Ön Kontrolü | `EX-025` (Beam Deflection & Bending Moments) | Mevcut `EX-025` sehim motoru kapsamında |
| 9 | `NEW-030` | İnşaat / Yapı | 2D Çerçeve Rijitlik Matrisi | `EX-044` (Truss Member 2D Matrix Analysis) | Mevcut `EX-044` 2D matris çözücüsüyle ortak |
| 10 | `NEW-031` | İnşaat / Yapı | 3D Kafes Sistem Çözümü | `EX-044` (Truss Member 2D Matrix Analysis) | Mevcut `EX-044` kafes matris çözücüsü uzantısı |
| 11 | `NEW-036` | İnşaat / Yapı | Çelik Birleşim Cıvata Grubu | `EX-009` (Bolt Preload & Torque VDI 2230) | Mevcut `EX-009` cıvata motoru kapsamında |
| 12 | `NEW-056` | Elektrik / Güç | Tek Fazlı Yük Akışı | `EX-057` (Ohm's Law & DC/AC Circuit Solver) | Mevcut `EX-057` AC/DC devre çözücüsü kapsamında |
| 13 | `NEW-057` | Elektrik / Güç | Üç Fazlı Yük Akışı | `EX-056` (Three-Phase AC Power & Power Factor) | Mevcut `EX-056` üç faz güç motoruyla bire bir aynı |
| 14 | `NEW-058` | Elektrik / Güç | Kablo Akım Taşıma Kapasitesi | `EX-058` (Cable Sizing & Voltage Drop) | Mevcut `EX-058` kablo kesit/akım motoruyla aynı |
| 15 | `NEW-064` | Elektrik / Güç | Trafo Kayıpları ve Verimi | `EX-059` (Transformer Winding & Core Sizing) | Mevcut `EX-059` trafo hesap motoru kapsamında |
| 16 | `NEW-065` | Elektrik / Güç | Motor Kalkış Akımı ve Gerilim Düşümü | `EX-058` (Cable Sizing & Voltage Drop) | Mevcut `EX-058` + `EX-021` ortak kapsamında |
| 17 | `NEW-073` | Elektronik / Kontrol | RC Geçici Rejim | `EX-060` (Active & Passive Analog Filter Design) | Mevcut `EX-060` RC devre/filtre motoru kapsamında |
| 18 | `NEW-074` | Elektronik / Kontrol | RLC Rezonans ve Q | `EX-060` (Active & Passive Analog Filter Design) | Mevcut `EX-060` RLC rezonans/filtre motoru kapsamında |
| 19 | `NEW-075` | Elektronik / Kontrol | Op-Amp Kazanç ve Bant Genişliği | `EX-060` (Active & Passive Analog Filter Design) | Mevcut `EX-060` aktif filtre/op-amp motoru kapsamında |
| 20 | `NEW-081` | Elektronik / Kontrol | Step Motor Adım ve Tork | `EX-021` (Electric Motor Power & Sizing) | Mevcut `EX-021` motor boyutlandırma kapsamında |
| 21 | `NEW-082` | Elektronik / Kontrol | Servo Motor İvme/Tork | `EX-021` (Electric Motor Power & Sizing) | Mevcut `EX-021` motor tork/atalet kapsamında |
| 22 | `NEW-086` | Elektronik / Kontrol | Elektronik Soğutucu Termal Direnç | `EX-046` (Extruded Aluminum Heat Sink) | Mevcut `EX-046` soğutucu Rth motoruyla bire bir aynı |
| 23 | `NEW-088` | Elektronik / Kontrol | Filtre Faz ve Kararlılık Marjı | `EX-060` (Active & Passive Analog Filter Design) | Mevcut `EX-060` Bode/faz marjı motoru kapsamında |
| 24 | `NEW-095` | Endüstri / Lojistik | Üretim Kapasite Planı | `EX-043` (Manufacturing Process Planner) | Mevcut `EX-043` üretim planlama modülü kapsamında |
| 25 | `NEW-104` | Endüstri / Lojistik | Ürün Başı Katkı Payı ve Başabaş | `EX-038` (Manufacturing Should-Cost & Carbon Estimator) | Mevcut `EX-038` parça maliyet motoru kapsamında |
| 26 | `NEW-105` | Endüstri / Lojistik | Ürün Başına Enerji Maliyeti | `EX-038` (Manufacturing Should-Cost & Carbon Estimator) | Mevcut `EX-038` enerji/karbon maliyet motoru kapsamında |
| 27 | `NEW-109` | CNC / CAM | Frezeleme Diş Temas Açısı | `EX-033` (Machining Feeds, Speeds & Power) | Mevcut `EX-033` talaşlı imalat motoru kapsamında |
| 28 | `NEW-110` | CNC / CAM | Gerçek Talaş Kalınlığı Düzeltmesi | `EX-033` (Machining Feeds, Speeds & Power) | Mevcut `EX-033` chip thinning hesabı kapsamında |
| 29 | `NEW-111` | CNC / CAM | Spindle Güç-Tork Eğrisi | `EX-033` (Machining Feeds, Speeds & Power) | Mevcut `EX-033` kesme gücü/tork motoru kapsamında |
| 30 | `NEW-113` | CNC / CAM | Tornalama Kesme Parametreleri | `EX-033` (Machining Feeds, Speeds & Power) | Mevcut `EX-033` tornalama/frezeleme motoruyla aynı |
| 31 | `NEW-114` | CNC / CAM | Delme Çevrim Süresi | `EX-034` (Machining Cycle Time Estimator) | Mevcut `EX-034` çevrim süresi motoruyla aynı |
| 32 | `NEW-117` | CNC / CAM | Kaba İşleme Talaş Hacmi | `EX-033` (Machining Feeds, Speeds & Power) | Mevcut `EX-033` MRR ($Q = a_p \cdot a_e \cdot v_f$) hesabı |
| 33 | `NEW-118` | CNC / CAM | İvme/Jerk Dahil Çevrim Süresi | `EX-034` (Machining Cycle Time Estimator) | Mevcut `EX-034` çevrim süresi motoru kapsamında |
| 34 | `NEW-119` | CNC / CAM | Hızlı Hareket Süresi | `EX-034` (Machining Cycle Time Estimator) | Mevcut `EX-034` G00/G01 süre motoru kapsamında |
| 35 | `NEW-126` | CNC / CAM | Parça Başı CNC İşleme Maliyeti | `EX-038` (Manufacturing Should-Cost & Carbon Estimator) | Mevcut `EX-038` + `EX-034` ortak kapsamında |
| 36 | `NEW-129` | Lazer / Plazma / Sac | Kerf Telafili Kontur Ofseti | `EX-006` (2D Sheet Nesting & Remnant Optimizer) | Mevcut `EX-006` `src/cam/nesting/kerfOffset.ts` içinde var |
| 37 | `NEW-130` | Lazer / Plazma / Sac | Pierce Zamanı ve Nokta Sayısı | `EX-006` (2D Sheet Nesting & Remnant Optimizer) | Mevcut `EX-006` `leadInOut.ts` (`pierceDelaySec`) içinde var |
| 38 | `NEW-131` | Lazer / Plazma / Sac | Lead-in/Lead-out Geometrisi | `EX-006` (2D Sheet Nesting & Remnant Optimizer) | Mevcut `EX-006` `src/cam/nesting/leadInOut.ts` içinde var |
| 39 | `NEW-132` | Lazer / Plazma / Sac | Mikrobağ Tasarımı | `EX-006` (2D Sheet Nesting & Remnant Optimizer) | Mevcut `EX-006` `microJoints` parametresi içinde var |
| 40 | `NEW-133` | Lazer / Plazma / Sac | Ortak Kenar Kesim Uygunluğu | `EX-006` (2D Sheet Nesting & Remnant Optimizer) | Mevcut `EX-006` `commonLineCutting.ts` içinde var |
| 41 | `NEW-135` | Lazer / Plazma / Sac | Levha Kullanılabilir Alan | `EX-006` (2D Sheet Nesting & Remnant Optimizer) | Mevcut `EX-006` `remnantDetector.ts` içinde var |
| 42 | `NEW-136` | Lazer / Plazma / Sac | Nesting Fire ve Verim Karşılaştırması | `EX-006` (2D Sheet Nesting & Remnant Optimizer) | Mevcut `EX-006` `utilization` / `scrapPercentage` ile aynı |
| 43 | `NEW-141` | Lazer / Plazma / Sac | Tab ve Köprü Konumlandırma | `EX-006` (2D Sheet Nesting & Remnant Optimizer) | Mevcut `EX-006` mikrobağ/köprü motoru kapsamında |
| 44 | `NEW-146` | Mekanik / Güç Aktarım | Kombine Eğilme-Burulma Mil Ön Kontrolü | `EX-017` (Shaft Diameter & Torsion DIN 743) | Mevcut `EX-017` `din743.ts` motoruyla bire bir aynı |
| 45 | `NEW-147` | Mekanik / Güç Aktarım | İçi Boş Mil Burulma | `EX-017` (Shaft Diameter & Torsion DIN 743) | Mevcut `EX-017` mil mukavemet motoru kapsamında |
| 46 | `NEW-148` | Mekanik / Güç Aktarım | Sıcaklıkla Mil-Rulman Genleşme | `EX-047` (Linear & Volumetric Thermal Expansion) | Mevcut `EX-047` + `EX-011` ortak kapsamında |
| 47 | `NEW-149` | Mekanik / Güç Aktarım | Kamalı Mil/Spline Ön Kontrol | `EX-010` (Parallel Keyway Stress DIN 6885) | Mevcut `EX-010` DIN 6885/ISO 14 motoru kapsamında |
| 48 | `NEW-150` | Mekanik / Güç Aktarım | Dişli Kavrama Oranı | `EX-014` (Spur & Helical Gear Design ISO 6336) | Mevcut `EX-014` $\varepsilon_\alpha, \varepsilon_\beta$ hesabı içinde var |
| 49 | `NEW-151` | Mekanik / Güç Aktarım | Dişli Backlash Senaryo Hesabı | `EX-014` (Spur & Helical Gear Design ISO 6336) | Mevcut `EX-014` dişli geometri motoru kapsamında |
| 50 | `NEW-152` | Mekanik / Güç Aktarım | Millerde Çentik Etkisi | `EX-017` (Shaft Diameter & Torsion DIN 743) | Mevcut `EX-017` `din743.ts` ($\beta_\sigma, \beta_\tau$) içinde var |
| 51 | `NEW-155` | Mekanik / Güç Aktarım | Kayış Başlangıç Gerginliği | `EX-020` (V-Belt & Timing Belt Drive) | Mevcut `EX-020` kayış-kasnak motoru kapsamında |
| 52 | `NEW-156` | Mekanik / Güç Aktarım | Zincir Poligonal Hız Dalgalanması | `EX-019` (Roller Chain Drive Sizing ISO 606) | Mevcut `EX-019` zincir tahrik motoru kapsamında |
| 53 | `NEW-162` | Mekanik / Güç Aktarım | Rulman Yerleşimi Eksenel Boşluk | `EX-013` (Bearing Rating Life ISO 281) | Mevcut `EX-013` `skfBearings.ts` O/X dizilimi kapsamında |
| 54 | `NEW-165` | HVAC / Enerji | Klima Batarya Isıl Yükü | `EX-052` (HVAC Heating & Cooling Thermal Load) | Mevcut `EX-052` HVAC ısıl yük motoru kapsamında |
| 55 | `NEW-174` | HVAC / Enerji | Bina Isı Kaybı Mahalleri | `EX-052` (HVAC Heating & Cooling Thermal Load) | Mevcut `EX-052` HVAC ısı kaybı motoruyla aynı |
| 56 | `NEW-179` | HVAC / Enerji | Pompa-Sistem Eğrisi Kesişimi | `EX-048` (Centrifugal Pump Performance & NPSH) | Mevcut `EX-048` pompa çalışma noktası motoru kapsamında |
| 57 | `NEW-182` | Akışkan / Proses / Kimya | NPSH Kullanılabilir Marj | `EX-048` (Centrifugal Pump Performance & NPSH) | Mevcut `EX-048` NPSHa/NPSHr motoruyla bire bir aynı |
| 58 | `NEW-196` | Akışkan / Proses / Kimya | Kimyasal Reaksiyon Sınırlayıcı Reaktif | `EX-069` (Chemical Stoichiometry & Reaction Balance) | Mevcut `EX-069` stokiyometri motoruyla bire bir aynı |
| 59 | `NEW-199` | Malzeme / Kalite / Üretim | Sertlik-Dayanım Yaklaşık Korelasyonu | `EX-063` (Hardness & Engineering Unit Converter) | Mevcut `EX-063` HRC/HB/HV–Rm dönüşüm motoruyla aynı |
| 60 | `NEW-200` | Malzeme / Kalite / Üretim | S-N Eğrisi Veri Fit | `EX-067` (Multi-Axial Fatigue Life & S-N Curves) | Mevcut `EX-067` S-N yorulma motoruyla aynı |
| 61 | `NEW-203` | Malzeme / Kalite / Üretim | Kaynak Dikişi Grup Eksantrisitesi | `EX-035` (Welding Joint Strength) | Mevcut `EX-035` + `EX-036` kaynak mukavemeti kapsamında |
| 62 | `NEW-212` | Malzeme / Kalite / Üretim | Termal Montaj Geçme | `EX-011` (Interference / Press Fit DIN 7190) | Mevcut `EX-011` sıkı geçme $\Delta T$ motoruyla bire bir aynı |
| 63 | `NEW-216` | Malzeme / Kalite / Üretim | Malzeme Karbon Ayak İzi | `EX-038` (Manufacturing Should-Cost & Carbon Estimator) | Mevcut `EX-038` CO2 ayak izi motoruyla bire bir aynı |
| 64 | `NEW-220` | Ulaşım / Havacılık / Deniz | Süspansiyon Doğal Frekans | `EX-022` (Natural Frequency & Vibration Harmonics) | Mevcut `EX-022` doğal frekans motoru kapsamında |

---

## 3. G2-03 & V12-03 — 200+ Gerçek Motor Sayma Politikası ve Envanter Defteri (Ledger)

Excel'deki `Mevcut_86!L5:L90` (`IF(AND(E="Hesap adayı",K="☑",I<>"",J="DOĞRULANDI"),1,0)`) ve `Aday_252!N5:N256` (`IF(AND(K="☑",L<>"",M="DOĞRULANDI",I="BENZERSİZ"),1,0)`) formülleriyle **%100 uyumlu** motor sayım politikası:

| Envanter Grubu | Kayıt Sayısı | Excel `Motor sayısı` (`L` / `N`) | Açıklama ve Kanıt Durumu |
|---|---|---|---|
| **1. Mevcut Doğrulanmış `Hesap adayı` Motorları (`Mevcut_86`)** | **65** | **65** (`Panel!B8 = 65`) | `E="Hesap adayı"` olan 65 aracın tamamı Git kaynak kodu (`G`), motor/test yolu (`H`), Vitest kanıtı (`I`), `J="DOĞRULANDI"` ve `K="☑"` ile belgelendi. |
| **2. Mevcut Solver-Destekli Stüdyolar (`EX-004`, `EX-006`, `EX-007`)** | **3** | **0** *(Stüdyo kuralı)* | `FEA`, `2D Sheet Nesting` ve `1D Cutting Optimizer` gerçek hesap çekirdeğine sahiptir (`65 + 3 = 68` toplam çekirdek), ancak `E="Stüdyo"` kuralı gereği 200 motor sayacına eklenmez (`L=0`). |
| **3. Mevcut Stüdyo / Referans / Veritabanı / Eğitim Kartları** | **18** | **0** *(Kapsam dışı)* | `EX-001..003, 005, 008, 023, 028..029, 040..043, 070, 072..073, 084..086` (`18` kart) 200 motor sayacına dahil edilmez (`L=0`). |
| **4. `Aday_252` İçindeki Mevcutla Çakışan Adaylar** | **64** | **0** (`I <> "BENZERSİZ"`) | Mevcut `EX-xxx` araçlarıyla çakıştığı için elenen 64 aday (`I="ÇAKIŞMA: EX-xxx"`). |
| **5. `Aday_252` İçindeki Net Yeni `BENZERSİZ` Aday Havuzu** | **188** | **0** *(Henüz kodlanmadı)* | `I="BENZERSİZ"` olan 188 yeni motor adayı. G3–G6 kapıları açılıp geliştirildikçe ve QA'den geçtikçe `Panel!B9` sayacını artıracaktır. |
| **TOPLAM POTANSİYEL BENZERSİZ MOTOR HAVUZU (`65 + 188`)** | **253** *(+3 Stüdyo = 256)* | **Hedef: $\ge 200$** | Mevcut **65** kanıtlı `Hesap adayı` motorun üzerine **188** benzersiz adaydan en az **135** adedi G3–G6'da tamamlandığında **200+** doğrulanmış benzersiz motor hedefi kesin olarak aşılır. |

---

## 4. G2-04 — Çok Disiplinli Persona ve Uçtan Uca İş Akışı Haritası (Her Persona İçin $\ge 3$ Akış)

| Persona | Hedef Disiplinler | İş Akışı 1 (Tasarım / Giriş) | İş Akışı 2 (Analiz / Doğrulama) | İş Akışı 3 (Üretim / Rapor Çıktısı) |
|---|---|---|---|---|
| **1. Mimar & BIM Uzmanı** | `Mimarlık / BIM`, `HVAC / Enerji` | **Akış 1.1:** IFC/DXF mahal listesi → Brüt/Net kat alanı (`NEW-001`) → Emsal/TAKS/KAKS kontrolü (`NEW-002`) | **Akış 1.2:** Merdiven rıht/basamak (`NEW-010`) + Erişilebilir rampa (`NEW-011`) + Kaçış yolu ön kontrolü (`NEW-013`) | **Akış 1.3:** Katmanlı duvar U-değeri (`NEW-163`) + Günışığı/RT60 (`NEW-006/009`) → PDF Mimari Ön Kontrol Raporu |
| **2. İnşaat / Statik & Geoteknik Mühendisi** | `İnşaat / Yapı`, `Geoteknik / Harita` | **Akış 2.1:** Yük kombinasyonları (`NEW-019`) + Deprem spektrumu (`NEW-033`) → Kiriş/Kolon ön boyutlandırma (`EX-025/026`) | **Akış 2.2:** Betonarme çift yönlü döşeme (`NEW-025`) + Zımbalama (`NEW-026`) + Ankraj boyu (`NEW-027`) | **Akış 2.3:** Aktif/pasif toprak basıncı (`NEW-037`) → İstinat duvarı (`NEW-035`) + Temel taşıma gücü (`NEW-039`) → Statik Ön Rapor |
| **3. Elektrik & Otomasyon Mühendisi** | `Elektrik / Güç`, `Elektronik / Kontrol` | **Akış 3.1:** Talep/eşzamanlılık (`NEW-070`) → Üç faz güç (`EX-056`) → Kablo kesiti & gerilim düşümü (`EX-058`) | **Akış 3.2:** IEC 60909 kısa devre (`NEW-055`) → Hata döngü empedansı (`NEW-060`) → Koruma seçicilik (`NEW-061`) | **Akış 3.3:** 4–20 mA sensör ölçekleme (`NEW-083`) + ADC çözünürlük (`NEW-076`) + PID ilk kazanç (`NEW-079`) → Pano/PLC Özeti |
| **4. Endüstri & Üretim Planlama Mühendisi** | `Endüstri / Lojistik`, `Malzeme / Kalite` | **Akış 4.1:** Takt time & hat dengeleme (`NEW-092`) + Little yasası WIP (`NEW-093`) + Darboğaz analizi (`NEW-101`) | **Akış 4.2:** OEE kayıp ağacı (`NEW-091`) + M/M/1 kuyruk (`NEW-094`) + Monte Carlo teslim tarihi (`NEW-103`) | **Akış 4.3:** EOQ (`NEW-096`) + Güvenlik stoku (`NEW-097`) + Proses yeterlilik Cp/Cpk (`NEW-108`) → ERP/CSV Planlama Çıktısı |
| **5. CNC / CAM Programcısı** | `CNC / CAM`, `Malzeme / Kalite` | **Akış 5.1:** Kesme hızı/ilerleme (`EX-033`) + Taylor takım ömrü (`NEW-112`) + Kılavuz senkronu (`NEW-115`) | **Akış 5.2:** 3D Scallop yüksekliği (`NEW-116`) + Takım yarıçap telafisi (`NEW-123`) + G2/G3 ark kontrolü (`NEW-121`) | **Akış 5.3:** G-kod emniyet kontrolü (`NEW-120`) + Çevrim süresi (`EX-034`) → CNC Operasyon Kartı PDF |
| **6. Lazer / Plazma / Sac Operatörü** | `Lazer / Plazma / Sac` | **Akış 6.1:** DXF kontur kapalılık analizi (`NEW-142`) + Sac büküm açılımı (`EX-032`) → 2D Nesting (`EX-006`) | **Akış 6.2:** Lazer hız-kalınlık (`NEW-127`) / Plazma akım-kalınlık (`NEW-128`) + Kesim ısı girdisi (`NEW-134`) | **Akış 6.3:** Köşe yavaşlatma (`NEW-140`) + Gaz tüketimi/süre (`NEW-143`) + Remnant sac kaydı → Kesim İş Emri |
| **7. Makine / Proses / Ar-Ge Mühendisi** | `Mekanik`, `Akışkan / Proses`, `Bilim` | **Akış 7.1:** Motor (`EX-021`) → Helisel dişli (`EX-014`) → 3D Mil/DIN 743 (`EX-017`) → SKF Rulman (`EX-013`) → Cıvata (`EX-009`) | **Akış 7.2:** Boru hattı Darcy-Weisbach (`EX-049`) + Hardy-Cross ağ (`NEW-181`) + Kontrol vanası Kv/Cv (`NEW-183`) | **Akış 7.3:** RK4 diferansiyel çözücü (`NEW-239`) + Belirsizlik yayılımı (`NEW-242`) + SHA-256 izlenebilir PDF rapor |

---

## 5. G2-06 — Kullanıcı Onayına Sunulan İlk Öncelik Paketi (Dalga 1 / P0–P1 Seçim Önerisi)

G2 kapısı onaylandıktan sonra (`G3`, `G4`, `G5` için ayrı `BAŞLAT` izni verildiğinde) ilk uygulanması önerilen **28 Benzersiz P0/P1 Motor Paketi**:

### A. G3 İlk Onay Paketi Önerisi (Mimarlık, İnşaat, Geoteknik — 10 Benzersiz Motor)
1. `NEW-001` — Brüt-Net Kat Alanı ve Kullanım Oranı (`Mimarlık / BIM`, ISO 9836 / Planlı Alanlar İmar Yön. Screening)
2. `NEW-002` — Emsal / TAKS / KAKS Senaryo Hesabı (`Mimarlık / BIM`, İmar Mevzuatı Screening)
3. `NEW-010` — Merdiven Rıht-Basamak Geometrisi (`Mimarlık / BIM`, Blondel $2h + b = 600\text{–}640\text{ mm}$ & Mevzuat Kontrolü)
4. `NEW-011` — Erişilebilir Rampa Eğimi ve Sahanlık Kontrolü (`Mimarlık / BIM`, TS 9111 / ADA Ön Kontrol)
5. `NEW-019` — Yapısal Yük Kombinasyonları Oluşturucu (`İnşaat / Yapı`, TS EN 1990 / TBDY 2018 ELU/ELS)
6. `NEW-025` — Betonarme Çift Yönlü Döşeme Ön Hesabı (`İnşaat / Yapı`, TS 500 / EN 1992-1-1 Screening)
7. `NEW-026` — Temel ve Döşeme Zımbalama Kesmesi Ön Kontrolü (`İnşaat / Yapı`, TS 500 / EN 1992-1-1 Clause 6.4 Screening)
8. `NEW-037` — Aktif-Pasif Toprak Basıncı Rankine/Coulomb (`Geoteknik`, EN 1997-1 Screening)
9. `NEW-039` — Yüzeysel Temel Taşıma Gücü Terzaghi/Meyerhof (`Geoteknik`, EN 1997-1 Annex D Screening)
10. `NEW-042` — Şev Stabilitesi Bishop Basitleştirilmiş Dilim Yöntemi (`Geoteknik`, Limit Denge Screening)

### B. G4 İlk Onay Paketi Önerisi (CNC, CAM, Lazer/Plazma, Kalite — 8 Benzersiz Motor)
11. `NEW-112` — Taylor Takım Ömrü ve Ekonomik Kesme Hızı (`CNC / CAM`, ISO 3685 $V_c \cdot T^n = C$)
12. `NEW-115` — Rijit Kılavuz Çekme (Rigid Tapping) İlerleme ve Tork Senkronu (`CNC / CAM`, DIN 13 / ISO)
13. `NEW-116` — 3D Küre Uçlu Freze Scallop (Adım İz) Yüksekliği (`CNC / CAM`, $h = R - \sqrt{R^2 - (a_e/2)^2}$)
14. `NEW-120` — G-Kod Satır ve Emniyet Ön Kontrolü (`CNC / CAM`, ISO 6983 Modal/Sınır Denetimi)
15. `NEW-127` — Lazer Kesme Hız-Kalınlık-Güç Tahmin Motoru (`Lazer / Plazma / Sac`, Enerji Dengesi & Kalibrasyon)
16. `NEW-128` — Plazma Kesim Akım-Kalınlık-Ark Gerilimi Eşlemesi (`Lazer / Plazma / Sac`, ISO 9013 Screening)
17. `NEW-142` — DXF Kontur Kapalılık, Açık Uç ve Öz-Kesişim Analizi (`Lazer / Plazma / Sac`, Topolojik Geometri Denetimi)
18. `NEW-205` — Worst-Case ve RSS Boyutsal Tolerans Zinciri (`Malzeme / Kalite`, ASME Y14.5 / ISO 8015)

### C. G5 İlk Onay Paketi Önerisi (Elektrik, Elektronik, Endüstri, HVAC, Proses, Bilim — 10 Benzersiz Motor)
19. `NEW-055` — IEC 60909 Üç Faz ve Faz-Toprak Kısa Devre Ön Hesabı (`Elektrik / Güç`, IEC 60909-0 Screening)
20. `NEW-059` — Topraklama Elektrod ve Ağ Direnci Ön Hesabı (`Elektrik / Güç`, IEEE 80 / IEC 60364-5-54)
21. `NEW-076` — ADC Çözünürlük, Kuantalama Hatası, SNR ve ENOB (`Elektronik / Kontrol`, IEEE 1241)
22. `NEW-079` — Ziegler-Nichols / Cohen-Coon PID İlk Kazanç Tahmini (`Elektronik / Kontrol`, Proses Kontrol)
23. `NEW-091` — OEE (Kullanılabilirlik × Performans × Kalite) ve 6 Büyük Kayıp Ağacı (`Endüstri / Lojistik`, ISO 22400)
24. `NEW-092` — Takt Time, Çevrim Süresi ve İstasyon Hat Dengeleme (`Endüstri / Lojistik`, Yalın Üretim)
25. `NEW-163` — Çok Katmanlı Duvar/Çatı Isıl Geçirgenlik ($U$-Değeri) ve Yoğuşma Ön Kontrolü (`HVAC / Enerji`, TS 825 / ISO 6946)
26. `NEW-167` — Hava Kanalı Eşit Sürtünme ve Hız Düşürme Boyutlandırma (`HVAC / Enerji`, ASHRAE Fundamentals)
27. `NEW-183` — Kontrol Vanası $K_v / C_v$ ve Kavitasyon/Boğulmuş Akış Ön Boyutlandırma (`Akışkan / Proses`, IEC 60534-2-1)
28. `NEW-239` — ODE Runge-Kutta 4 (RK4) Başlangıç Değer Problemi Çözücüsü (`Bilim / Matematik`, Sayısal Analiz)
