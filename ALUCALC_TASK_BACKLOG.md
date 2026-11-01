# AluCalc OS — Universal Task Backlog & Gate Execution Matrix

> **Document ID:** `ALUCALC_TASK_BACKLOG.md`  
> **Target Release:** AluCalc OS v6.x $\to$ NextGen Connected Engineering Platform  
> **Execution Governance:** Controlled strictly by Approval Gates (`G0` – `G9`), Evidence Checkboxes, and Explicit User Sign-Off.  
> **Timeline Policy:** Zero arbitrary calendar or duration guarantees. Progress is measured solely by verified Definition of Done (DoD).  
> **Source Mapping:** Aligned with 10 Approval Gates (`G0` – `G9`) and 80 Tasks from `ALUCALC_EVRENSEL_MASTER_PLAN_G0_SPRINT0_DENETIM_V3.xlsx`.

---

## 1. Governance Architecture: 10 Approval Gates (G0 – G9)

Progress is locked between gates. An agent may provide evidence and set task ticks (`Tik = ✓`), but the gate transition is **LOCKED** until explicit user sign-off is recorded in the master ledger.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      G0: Canlı Git & Envanter Eşleme                     │
│    (Commit SHA, 86 Kanonik Araç, Gerçek Motorlar, Nesting 2D Denetimi) │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Kullanıcı Onayı Zorunlu)
┌────────────────────────────────────▼────────────────────────────────────┐
│                      G1: Kalite ve Güven Katmanı                         │
│       (Birim Tipleri, INVALID/CALCULATED/TARGET_MET, Golden Vectors)    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Kullanıcı Onayı Zorunlu)
┌────────────────────────────────────▼────────────────────────────────────┐
│                      G2: Çok Disiplinli Katalog                          │
│     (14 Alan Taksonomisi, 252 Aday Çakışma Analizi, 200+ Motor Hedefi)   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Kullanıcı Onayı Zorunlu)
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
┌────────▼──────────┐       ┌────────▼──────────┐       ┌────────▼──────────┐
│ G3: Mimarlık & BIM│       │ G4: İmalat & CAM  │       │ G5: Elektrik &    │
│   (IFC/DXF,       │       │   (Lazer/Plazma,  │       │     Endüstri      │
│    Statik, Zemin) │       │    Nesting, Kerf) │       │   (Motor, HVAC)   │
└────────┬──────────┘       └────────┬──────────┘       └────────┬──────────┘
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     │ (Kullanıcı Onayı Zorunlu)
┌────────────────────────────────────▼────────────────────────────────────┐
│              G6: Connected Engineering Workflow (WF-11)                 │
│      (15 kW Redüktör: Motor → Dişli → Mil → Rulman → CAD → PDF)         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Kullanıcı Onayı Zorunlu)
┌────────────────────────────────────▼────────────────────────────────────┐
│                    G7: Rust / WebAssembly (WASM) Pilot                  │
│       (Nesting / FEA Ölçümlü Hotspot Benchmark, Worker vs WASM)         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Kullanıcı Onayı Zorunlu)
┌────────────────────────────────────▼────────────────────────────────────┐
│                    G8: Gerçek Mühendis Pilotları & UX                   │
│       (Mimar, Statikçi, CNC/Lazer Operatörü Gerçek Senaryo Testleri)   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Kullanıcı Onayı Zorunlu)
┌────────────────────────────────────▼────────────────────────────────────┐
│                    G9: Release & Canlı Yayın Doğrulama                  │
│       (Tam Build, E2E, Performans, Canlı HTTP Duman Testi, Manifest)   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Gate-by-Gate Task Inventory & Verification Evidence

### Gate G0: Canlı Git & Envanter Eşleme (AKTİF İNCELEME)
* **Kapsam:** Depo kimliği, 86 kanonik araç, tekil hesap motorları, Nesting 2D gerçek işlev denetimi ve 252 aday çakışma analizi.
* **Çıkış Kriteri:** Tüm G0-01…G0-08 ve NEST-00…NEST-12 maddelerinde somut kod/ekran/test kanıtı sunulması ve kullanıcının yazılı onayı.
* **Görevler:**
  * `G0-01`: Kamuya açık Git deposunun doğru URL (`https://github.com/Alucardpaps/alucalculator.git`), `master` dalı ve commit SHA (`c3d892d`) kimliğinin tespiti.
  * `G0-02`: Canlı 86 katalog öğesinin (`src/data/canonicalInventory.ts`) URL, tip ve görüntüleme sınıfı olarak kayıt altına alınması.
  * `G0-03`: Stüdyo, referans kartı ve tekil deterministik hesap motorlarının birbirinden ayrılması.
  * `G0-04`: Mevcut 86 motorun 252 adayla eşleştirilerek tekrarların (duplicate) elenmesi ve 200+ tekil motor yol haritasının çıkarılması.
  * `G0-05`: Üretim çıktısı (`./out/`), sürüm manifesti (`release-manifest.json`) ve canlı HTTP dağıtım eşlemesi.
  * `G0-06`: CI derleme ve test komutlarının gerçek günlüklerinin (`npm run typecheck`, `npx vitest run`, `npm run build`) sunulması.
  * `G0-07`: 7 temel disiplin personasının (Mimar, Statikçi, Elektrikçi, İmalatçı, CAM/Lazer Operatörü, CAD Tasarımcısı, Araştırmacı) kontrol matrisi.
  * `NEST-01` – `NEST-12`: Nesting 2D modülünün gerçek kod yeteneklerinin (`AttributeNesting.tsx`, `Nesting2D.tsx`, Web Worker, plasma CAM, kerf, remnant) denetlenmesi.
  * `G0-08`: G0 Kanıt Paketinin kullanıcıya sunulması ve G1 için açık onay istenmesi.

---

### Gate G1: Kalite ve Güven Katmanı (KİLİTLİ)
* **Kapsam:** Tip güvenliği, hata sınırları, hesap durumu ayrımı, golden test vektörleri.
* **Önkoşul:** Gate G0 kullanıcı onayı (`Kapilar!H5 = ONAY`).
* **Görevler:**
  * `G1-01`: Motor sözleşmesinde durum ayrımı: `INVALID` | `CALCULATED` | `TARGET_MET` | `VERIFIED`.
  * `G1-02`: Semantik fiziksel port tiplerinin (`power_kw`, `rpm`, `torque_nm`, `module_mm`, `force_n`) zorunlu kılınması.
  * `G1-03`: Normatif yöntem vs. screening ayrımının standartlaştırılması (`ISO 6336 Method B Screening`).
  * `G1-04`: Bağımsız referans kaynak şablonunun (`EngineMetadata`) tüm motorlara entegrasyonu.
  * `G1-05`: Çekirdek regresyon testlerinin üretim motorlarını doğrudan çağırması.
  * `G1-06`: Deterministik yeniden çalıştırma ve SHA-256 durum özeti (`sha256Hash`) doğrulaması.
  * `G1-07`: Vektör PDF sınır testinin ($x \le 567.28\text{ pt}$) tüm sayfalarda işletilmesi.
  * `G1-08`: G1 kanıt paketinin kullanıcıya sunulup G2 onayı istenmesi.

---

### Gate G2: Çok Disiplinli Katalog & Taksonomi (KİLİTLİ)
* **Kapsam:** 14 alan menü yapısı, 252 adayın elenmesi, 200+ doğrulanmış motor hedefi.
* **Önkoşul:** Gate G1 kullanıcı onayı (`Kapilar!H6 = ONAY`).
* **Görevler:**
  * `G2-01`: 14 mühendislik disiplini için çok disiplinli ürün taksonomisinin kurulması.
  * `G2-02`: 252 adayın mevcut envanterle çakışma denetiminin kodlanması.
  * `G2-03`: 200 gerçek motor sayma politikasının ve ledger defterinin oluşturulması.
  * `G2-04`: Her disiplin personası için en az 3 gerçek iş akışının tanımlanması.
  * `G2-05`: Yeni adaylara standart sürümü, geçerli girdi aralığı ve risk etiketlerinin eklenmesi.

---

### Gate G3: Mimarlık / İnşaat / BIM (KİLİTLİ)
* **Kapsam:** Alan, metraj, yapı elemanı, geoteknik ve IFC/DXF iş akışları (`WF-01`, `WF-02`, `WF-03`, `WF-04`).
* **Önkoşul:** Gate G2 kullanıcı onayı.

---

### Gate G4: Üretim / CNC / CAM / Lazer (KİLİTLİ)
* **Kapsam:** Lazer/plazma CAM, sac büküm, nesting, kerf ve G-kod doğrulaması (`WF-08`, `WF-09`, `WF-10`).
* **Önkoşul:** Gate G2 kullanıcı onayı.

---

### Gate G5: Elektrik / Endüstri / Bilim (KİLİTLİ)
* **Kapsam:** Pano yükü, kısa devre, motor/sürücü, HVAC, boru ağı (`WF-05`, `WF-06`, `WF-07`, `WF-14`).
* **Önkoşul:** Gate G2 kullanıcı onayı.

---

### Gate G6: Connected Engineering Workflow — WF-11 Redüktör (KİLİTLİ)
* **Kapsam:** 15 kW, 1450 rpm $\to$ 60 rpm redüktörün uçtan uca dijital ipliği (`WF-11`).
* **Önkoşul:** Gate G1 ve G2 kullanıcı onayı.
* **Görevler:**
  * `G6-01`: Motor $\to$ Kademe 1 $\to$ Kademe 2 bileşik `TwoStageReducerNode` düğümünün yazılması.
  * `G6-02`: Diş kuvvetlerinin ($F_t, F_r, F_a$) dinamik olarak hesaplanıp millere aktarılması.
  * `G6-03`: Ara mil üzerindeki çift dişli mekânsal yüklerinin DIN 743 yorulma motoruna bağlanması.
  * `G6-04`: Rulman tepki kuvvetlerinin hesaplanıp ISO 281 ömür motoruna iletilmesi ($L_{10h} \ge 25.000\text{ h}$).
  * `G6-05`: DIN 6885 paralel kama yüzey basınçlarının ($p \le p_{\text{perm}}$) hesaplanması.
  * `G6-06`: VDI 2230 gövde ayrım hattı cıvata ön yük ve sıkma torkunun bağlanması.
  * `G6-07`: Eksen mesafelerini ($a_1, a_2$) hesap sonuçlarından okuyan 3D CAD parametrik montaj görünümü.
  * `G6-08`: 5 sayfalık vektör PDF tasarım doğrulama dosyasının üretilmesi.

---

### Gate G7: Rust / WebAssembly (WASM) Pilot (KİLİTLİ)
* **Kapsam:** Ölçümlü Nesting veya FEA darboğazı üzerinde WebAssembly pilot çalışması; benchmark ve kullanıcı onaylı GO/NO-GO kararı.

---

### Gate G8: Pilot Müşteriler & UX Doğrulama (KİLİTLİ)
* **Kapsam:** Mimar, statikçi, elektrikçi, CNC ve lazer operatörü senaryolarında gerçek kullanıcı testleri.

---

### Gate G9: Production Release & Canlı Yayın (KİLİTLİ)
* **Kapsam:** Tam build, e2e testler, güvenlik denetimi, manifest onayı, canlı HTTP duman testi ve nihai kabul.
