# ALUCALC OS — RELEASE SIGN-OFF CORRECTION REPORT V4

**Tarih:** 30 Ekim 2026  
**Doküman:** `ALUCALC_RELEASE_SIGNOFF_V4.md`  
**Referans Şartname:** `ALUCALC OS — RELEASE SIGN-OFF CORRECTION V4`  
**Platform Sürümü:** AluCalc OS v6.0.0 (Web) / APK v6.0  
**Yayın Durumu:** **READY FOR DEPLOYMENT (LOCAL BUILD VALIDATED — LIVE DEPLOY PENDING FTP PUSH)**

---

## 1. Yönetici Özeti ve Karar Matrisi

Kullanıcı denetiminde tespit edilen 6 kritik madde (**ISO 6336 screening kapsamı**, **Girdi güvenliği/validasyonu**, **PDF metin taşması**, **Koşullu/boş testlerin kaldırılması**, **Manifest SSOT zorunluluğu** ve **Canlı yayın dürüstlüğü**) kaynak kodda eksiksiz düzeltilmiş, deterministik testlerle doğrulanmış ve `tsc --noEmit` ile sıfır hata seviyesinde derlenmiştir.

| Madde | Kapsam | Önceki Hata / Risk | Uygulanan Düzeltme | Nihai Durum |
|---|---|---|---|---|
| **P0-01** | ISO 6336 Emniyet & Kapsam Modeli | Tek $S_H$, evrensel 1.20/1.40 iddiası, sessiz clamp (`Math.max(4, z1)`) | Pinyon ($S_{H1}$) ve dişli ($S_{H2}$) teması ayrıldı; hedefler konfigüre edilebilir yapıldı; sessiz clamp kaldırıldı; `screening` ve `targetMet` modelleri eklendi | **DÜZELTİLDİ & VERIFIED** |
| **P0-02** | Mühendislik Girdi Güvenliği | $Z=0$ veya negatif ilerlemede `verified: true` dönebiliyordu | $V_c, D, Z, f_z, a_e, a_p, k_c$ tam doğrulaması eklendi; $Z<1$, $f_z \le 0$ vb. durumlarda `verified: false` ve kritik uyarılar üretildi | **DÜZELTİLDİ & VERIFIED** |
| **P0-03** | PDF Yerleşim ve Taşma Sorunu | Step 7 (606.9 pt) ve yeşil özet (609.5 pt) A4 (595.28 pt) dışına taşıyordu | Step 7 sağ sütun daraltıldı ($545\text{ pt} \le 558\text{ pt}$); yeşil özet 4 satırlık güvenli grid'e dönüştürüldü ($<450\text{ pt}$); çelişkili `VERIFIED` etiketi kaldırıldı | **DÜZELTİLDİ & VERIFIED** |
| **P0-04** | Kabul Testlerinin Determinizmi | `if (result.safetyContact < 1.20)` koşulu boş geçebiliyordu | Koşullu testler kaldırıldı; $S_H = 1.10, 1.19, 1.20, 1.21$ sınırları, asimetrik malzeme ve geçersiz girdiler ayrı ayrı test edildi (13/13 test) | **DÜZELTİLDİ & VERIFIED** |
| **P1-01** | Release Manifest SSOT | Okunamazsa 86'ya düşen sessiz fallback vardı | Dosya/sabit bulunamazsa build'i durduran sıkı kontrol eklendi; Web (`production_ready`) ile Android/Wear (`pending_device_testing`) ayrıldı | **DÜZELTİLDİ & VERIFIED** |
| **P1-02** | Canlı Yayın Statüsü | Yerel build ile canlı sunucu durumu birbirine karışabiliyordu | "VERIFIED LIVE" iddiası kaldırıldı; "READY FOR DEPLOYMENT (LOCAL BUILD VALIDATED, LIVE DEPLOY PENDING)" olarak resmileştirildi | **NETLEŞTİRİLDİ** |

---

## 2. Detaylı Teknik Çözümler ve Kod Değişiklikleri

### 2.1 P0-01: ISO 6336 Screening Modeli ve Ayrı Temas Emniyeti

#### Tespit Edilen Problem
`src/lib/iso6336.ts` motoru basitleştirilmiş bir Screening (Method B) motoru olmasına rağmen, raporlarda tam ISO sertifikasyonu izlenimi veriliyordu. Ayrıca ISO 6336-2 standardı pinyon ve çarkın temas gerilmelerini ayrı izin verilen limitlerle ($S_{H1}, S_{H2}$) değerlendirirken kodda tek bir $S_H$ bulunuyordu. Üstelik $z_1 < 4$ veya $b \le 0$ gibi geçersiz girdiler `Math.max(4, z1)` ile sessizce dönüştürülüyor ve $T=0$ durumunda gerilme sıfır olduğundan emniyet katsayısı 99 atanıp `status: 'safe'` üretiliyordu.

#### Uygulanan Çözüm
1. **Sessiz Clamp Kaldırıldı & Giriş Güvenliği:**
   ```ts
   // src/lib/iso6336.ts
   const validationErrors: string[] = [];
   if (!Number.isFinite(input.mn) || input.mn <= 0) validationErrors.push('Normal module (mn) must be strictly positive.');
   if (!Number.isFinite(input.z1) || input.z1 < 5 || !Number.isInteger(input.z1)) validationErrors.push('Pinion teeth count (z1) must be an integer >= 5.');
   if (!Number.isFinite(input.z2) || input.z2 < 5 || !Number.isInteger(input.z2)) validationErrors.push('Gear teeth count (z2) must be an integer >= 5.');
   if (!Number.isFinite(input.b) || input.b <= 0) validationErrors.push('Face width (b) must be strictly positive.');
   if (!Number.isFinite(input.torqueNm) || input.torqueNm <= 0) validationErrors.push('Operating torque (torqueNm) must be strictly positive.');
   if (!Number.isFinite(input.rpmPinion) || input.rpmPinion <= 0) validationErrors.push('Pinion speed (rpmPinion) must be strictly positive.');

   if (validationErrors.length > 0) {
       return {
           valid: false,
           validationErrors,
           verificationLevel: 'screening',
           methodScope: 'ISO 6336-2:2019 Simplified Method B (Screening)',
           detailedVerificationRequired: true,
           targetMet: false,
           SH: 0, SH1: 0, SH2: 0, SF1: 0, SF2: 0,
           status: 'invalid',
           ...
       };
   }
   ```
2. **Konfigüre Edilebilir Tasarım Hedefleri ve Ayrı Temas Emniyeti:**
   ```ts
   const targetSH = input.targetSH ?? 1.20;
   const targetSF = input.targetSF ?? 1.40;
   const sigmaHlim1 = input.sigmaHlim1 ?? input.sigmaHlim ?? 1500;
   const sigmaHlim2 = input.sigmaHlim2 ?? input.sigmaHlim ?? 1500;

   const SH1 = sigmaH > 1e-6 ? sigmaHlim1 / sigmaH : 0;
   const SH2 = sigmaH > 1e-6 ? sigmaHlim2 / sigmaH : 0;
   const SH = Math.min(SH1, SH2);

   const targetMet = SH1 >= targetSH && SH2 >= targetSH && SF1 >= targetSF && SF2 >= targetSF;
   let status: Iso6336MeshResult['status'];
   if (targetMet) status = 'safe';
   else if (SH1 >= 1.0 && SH2 >= 1.0 && SF1 >= 1.0 && SF2 >= 1.0) status = 'marginal';
   else status = 'unsafe';
   ```

---

### 2.2 P0-02: Frezeleme Talaş Kaldırma Girdi Validasyonu

#### Tespit Edilen Problem
`src/calculators/schemas-v2/machining-milling.tsx` dosyasında `verified` statüsü yalnızca `D > 0 && ae > 0 && ap > 0` şartına bağlıydı. Kesici diş sayısı $Z=0$ girildiğinde veya negatif ilerleme verildiğinde kullanıcıya geçerli ve doğrulanmış sonuç gösteriliyordu.

#### Uygulanan Çözüm
`machiningMillingSchema.calculationEngine` içine 7 temel parametrenin tamamı için sıkı kontroller eklendi:
```ts
// src/calculators/schemas-v2/machining-milling.tsx
if (!Number.isFinite(Vc) || Vc <= 0) warnings.push({ field: 'cuttingSpeed', message: 'Cutting speed (Vc) must be strictly positive.', severity: 'critical' });
if (!Number.isFinite(D) || D <= 0) warnings.push({ field: 'diameter', message: 'Cutter diameter (D) must be strictly greater than zero.', severity: 'critical' });
if (!Number.isFinite(Z) || Z < 1 || !Number.isInteger(Z)) warnings.push({ field: 'teeth', message: 'Flute count (Z) must be an integer >= 1.', severity: 'critical' });
if (!Number.isFinite(fz) || fz <= 0) warnings.push({ field: 'feedPerTooth', message: 'Feed per tooth (fz) must be strictly positive.', severity: 'critical' });
if (!Number.isFinite(ae) || ae <= 0) warnings.push({ field: 'radialDepth', message: 'Radial depth of cut (ae) must be strictly positive.', severity: 'critical' });
if (!Number.isFinite(ap) || ap <= 0) warnings.push({ field: 'axialDepth', message: 'Axial depth of cut (ap) must be strictly positive.', severity: 'critical' });
if (!Number.isFinite(kc) || kc <= 0) warnings.push({ field: 'specificCuttingForce', message: 'Specific cutting force (kc) must be strictly positive.', severity: 'critical' });

const isInputValid = warnings.filter(w => w.severity === 'critical').length === 0;

return {
    outputs: { ... },
    verified: isInputValid, // Geçersiz girdide asla true dönmez
    warnings,
    timestamp: Date.now()
};
```

---

### 2.3 P0-03: PDF Metin Taşmasının Giderilmesi ve Dürüstlük

#### Tespit Edilen Problem
- A4 sayfası $595.28\text{ pt}$ genişliğindedir. Kenar payı $28\text{ pt}$, dış teknik çerçeve $567.28\text{ pt}$ sınırındadır.
- Önceki `scripts/generate_vdi_sample_pdf.js` dosyasında:
  - Step 7 sağ sütun: $x = 382.28\text{ pt}$'den başlayıp 54 karakter tek satır basılarak **606.9 pt**'ye ulaşıyor ve sayfa dışına taşıyordu.
  - Yeşil özet kutusu von Mises satırı: $x = 363\text{ pt}$'den başlayıp **609.5 pt**'ye ulaşıyor ve sayfa dışına taşıyordu.
  - Belgede aynı anda hem `SAMPLE BENCHMARK - VERIFIED` hem de `NOT CERTIFIED` ifadeleri bulunuyordu.

#### Uygulanan Çözüm
1. **Step 7 Metin Düzeni:**
   - Sonuç metni `sigma_eq = 513.1 MPa (FoS = 1.25 >= 1.05)` olarak sadeleştirildi (41 karakter).
   - Font boyutu 6.5 pt CourierBold olarak ayarlandı.
   - Başlangıç $x = \text{width} - \text{margin} - 170 = 397.28\text{ pt}$.
   - Bitiş koordinatı: $397.28 + 41 \times 3.6\text{ pt} \approx \mathbf{545\text{ pt}} \le 558\text{ pt}$ (Çerçevenin $22\text{ pt}$, sayfanın $50\text{ pt}$ içinde!).
2. **Yeşil Özet Kutusu (Grid / Satır Düzeni):**
   - Kutu yüksekliği $42\text{ pt}$'den $50\text{ pt}$'ye çıkarıldı.
   - Satır 1: Başlık (`SAMPLE BENCHMARK RECORD — VDI 2230-1 / ISO 898-1 (ILLUSTRATIVE)`).
   - Satır 2: Sıkma momenti (`MA = 76.8 N.m`) ve ön yük dispersiyonu (`FM = 34.2 kN (FM,min = 28.5 kN, alphaA = 1.20)`). Bitiş: $444\text{ pt} < 567\text{ pt}$.
   - Satır 3: von Mises gerilmesi (`STRESS: sigma_eq = 513.1 MPa <= 640.0 MPa (FoS = 1.25 >= 1.05)`). Bitiş: $311\text{ pt} < 567\text{ pt}$.
   - Satır 4: Açık uyarı (`Illustrative sample benchmark generated by AluCalc OS VDI 2230 engine. Not independently certified.`). Bitiş: $400\text{ pt} < 567\text{ pt}$.
3. **Çelişkili İfadelerin Kaldırılması:**
   - İmza kutusundaki `[SAMPLE BENCHMARK - VERIFIED]` ibaresi kaldırıldı; yerine `[SAMPLE BENCHMARK - UNREVIEWED]` konuldu.
   - PDF boyutu: **5.804 byte**.

---

### 2.4 P0-04: Gerçek Deterministik Kabul Testleri (Koşullu Testlerin Kaldırılması)

#### Tespit Edilen Problem
Eski testte `if (result.safetyContact < 1.20) { expect(result.status).not.toBe('safe'); }` kullanılmıştı. `safetyContact >= 1.20` olduğunda `if` bloğu çalışmadan test boş geçiyordu.

#### Uygulanan Çözüm
`src/tests/report-p0-acceptance.test.ts` tamamen yenilendi:
1. **Unconditional Boundary Testing ($S_H = 1.10, 1.19, 1.20, 1.21$):**
   - $S_H = 1.10 < 1.20 \implies$ `targetMet = false`, `status = 'marginal'`
   - $S_H = 1.19 < 1.20 \implies$ `targetMet = false`, `status = 'marginal'`
   - $S_H = 1.20 \ge 1.20 \implies$ `targetMet = true`, `status = 'safe'` ($S_F \ge 1.40$)
   - $S_H = 1.21 \ge 1.20 \implies$ `targetMet = true`, `status = 'safe'`
2. **Pinyon vs Çark Ayrı Temas Emniyeti Testi:**
   - Pinyon $\sigma_{H\lim,1} = 1500\text{ MPa}$, Çark $\sigma_{H\lim,2} = 900\text{ MPa}$ girilerek $S_{H1} > S_{H2}$ ve $S_H = S_{H2}$ olduğu, kritik faktörün çark teması olduğu doğrulandı.
3. **Geçersiz Girdi Testi:**
   - $T=0$, $m_n=-2$, $z_1=0$, $b=-10$ senaryolarında `valid = false`, `status = 'invalid'`, `SH = 0` olduğu ve asla `safe` üretilmediği doğrulandı.
4. **PDF Koordinat & Taşma Testi:**
   - Script içerisindeki koordinatların matematiksel olarak $\le 560\text{ pt}$ kaldığı doğrulandı.

---

### 2.5 P1-01: Release Manifest Tek Kaynak Zorunluluğu

`scripts/generate_release_manifest.js` dosyasında sabit fallback kaldırıldı. `canonicalInventory.ts` dosyası bulunamazsa veya `CANONICAL_TOOL_COUNT` ayrıştırılamazsa işlem derhal hata vererek sonlanıyor (`process.exit(1)`).

Üretilen `public/release-manifest.json`:
```json
{
  "appName": "AluCalc OS",
  "appVersion": "6.0.0",
  "buildId": "7d1e669",
  "commitSha": "7d1e66938a425f190eec26040685ee223ff785cf",
  "builtAt": "2026-10-30T09:15:58.749Z",
  "toolCount": 86,
  "distribution": {
    "web": {
      "status": "production_ready",
      "architecture": "static_export",
      "runtime": "client_side_wasm_worker",
      "canonicalUrl": "https://www.alucalculator.com/"
    },
    "android": {
      "status": "pending_device_testing",
      "packageGenerator": "@bubblewrap/cli",
      "version": "6.0"
    },
    "wearOs": {
      "status": "pending_device_testing",
      "packageGenerator": "@bubblewrap/cli",
      "version": "6.0"
    }
  },
  "platforms": ["web", "android", "wear"],
  "standards": ["ISO 281", "ISO 6336", "VDI 2230", "DIN 743", "DIN 6885", "DIN 7190", "ISO 286", "EN 1993"]
}
```

---

## 3. Gerçek Test Komutları ve Terminal Kanıtları

```bash
# 1. Tam Statik Tip Kontrolü
$ npm run typecheck
> alucalculator@6.0.0 typecheck
> tsc --noEmit
# Exit Code: 0 (HATA YOK)

# 2. P0 Kabul Testleri (13/13 PASS)
$ npx vitest run src/tests/report-p0-acceptance.test.ts
 ✓ src/tests/report-p0-acceptance.test.ts (13 tests) 17ms
 Test Files: 1 passed (1) | Tests: 13 passed (13)

# 3. Çekirdek Regresyon Paketleri (78/78 PASS)
$ npx vitest run src/tests/report-p0-acceptance.test.ts \
                 src/tests/gear-strength.test.ts \
                 src/tests/ground-truth-provenance.test.ts \
                 src/tests/canonical-r12-pipeline.test.ts \
                 src/tests/industrial-templates.test.ts \
                 src/tests/cross-module-bridge.test.ts

 ✓ src/tests/gear-strength.test.ts (5 tests) 7ms
 ✓ src/tests/report-p0-acceptance.test.ts (13 tests) 17ms
 ✓ src/tests/ground-truth-provenance.test.ts (15 tests) 13ms
 ✓ src/tests/industrial-templates.test.ts (10 tests) 47ms
 ✓ src/tests/canonical-r12-pipeline.test.ts (8 tests) 78ms
 ✓ src/tests/cross-module-bridge.test.ts (27 tests) 26ms
 Test Files: 6 passed (6) | Tests: 78 passed (78)
 Duration: 3.60s

# 4. Prebuild Pipeline
$ npm run prebuild
> alucalculator@6.0.0 prebuild
> node scripts/generate_release_manifest.js && node scripts/generate_vdi_sample_pdf.js && node scripts/copy_calculators.js && node scripts/build_t12_chunks.mjs
[Release Manifest] Successfully generated SSOT manifest at public/release-manifest.json with toolCount: 86
Saved sample PDF to: public/reports/sample-vdi-2230-bolt-torque.pdf Size: 5804 bytes
[Build Hook] Successfully copied calculators.json to public API directory.
t12 chunks written (5453 keys × 11 languages)
```

---

## 4. Yayın Durumu ve Dağıtım Ayrımı

- **Yerel Üretim Derlemesi:** `out/` dizininde 389 static/SSG rota hatasız derlenmiştir (`task-470`).
- **Web Durumu:** `production_ready` (Yerel kod ve derleme tüm mühendislik kriterlerini sağlamıştır).
- **Canlı Dağıtım:** Canlı `alucalculator.com` sitesi GitHub Actions / Hostinger FTP pipeline'ı ile beslendiğinden, yerel düzeltmeler git push sonrasında canlı ortama yansıyacaktır. Bu nedenle durum **`READY FOR DEPLOYMENT`** olarak işaretlenmiştir; canlı testler yapılmadan asla `VERIFIED LIVE` iddiasında bulunulmamaktadır.
- **Mobil/Wear OS:** Paket şablonları hazır olmakla birlikte, gerçek cihaz testleri tamamlanana kadar manifestte `pending_device_testing` olarak sınıflandırılmıştır.
