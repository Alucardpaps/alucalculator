# 2D Nesting → Plazma CAM: Kapsamlı Keşif ve Durum Analizi Raporu

**Tarih:** 17 Ekim 2026  
**Kapsam:** AluCalc OS (`alucalculator.com`) — 2D Yerleşim, CAD/CAM Boru Hattı, Plazma Takım Yolu ve Isıl Analiz  
**Referans Doküman:** `AluCalc Nesting-2D → Plazma CAM: Antigravity Promptu.pdf` & `fixtures/nested_parts.dxf`

---

## 1. Dosya Haritası

| Bileşen / Sorumluluk | Dosya Yolu | Açıklama |
|---|---|---|
| **Sayfa / Rota Girişi** | [`src/app/[module]/page.tsx`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/app/[module]/page.tsx#L54-L55) | `/nesting` ve `/nesting-2d` rotalarını karşılar. |
| **Pencere Yöneticisi** | [`src/components/os/WindowContent.tsx`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/components/os/WindowContent.tsx#L199) | `nesting-2d` modülünü dinamik olarak yükler. |
| **Modül Kabuğu** | [`src/components/modules/mechanical/Nesting2DModule.tsx`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/components/modules/mechanical/Nesting2DModule.tsx#L8-L16) | `dynamic(() => import('@/components/Nesting2D'), { ssr: false })` ile sarmalar. |
| **Ana UI Bileşeni** | [`src/components/Nesting2D.tsx`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/components/Nesting2D.tsx#L29-L43) | Sac boyutları, parça listesi, seçenekler ve optimizasyon butonunu yönetir. |
| **Tuval / Çizim Alanı** | [`src/components/NestingCanvas.tsx`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/components/NestingCanvas.tsx#L24-L71) | SVG tabanlı yerleşim görselleştiricisi (Y ekseni dönüşümünü içerir). |
| **İçe Aktarma / Yükleyici** | [`src/components/DxfUploader.tsx`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/components/DxfUploader.tsx#L10-L12) | DXF ve SVG dosyalarını okur, parça önizleme kanvasını çizer. |
| **DXF Ayrıştırıcı** | [`src/utils/dxfParser.ts`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/utils/dxfParser.ts#L6-L19) | `dxf-parser` kütüphanesini kullanarak DXF varlıklarını poligonlara dönüştürür. |
| **SVG Ayrıştırıcı** | [`src/utils/svgParser.ts`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/utils/svgParser.ts) | SVG path ve poligonlarını ayrıştırır. |
| **Web Worker Kancası** | [`src/hooks/useNestingWorker.ts`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/hooks/useNestingWorker.ts) | Worker yaşam döngüsünü (`progress`, `complete`, `error`, `cancel`) yönetir. |
| **Yerleşim Motoru (Worker)** | [`src/workers/nesting.worker.ts`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/workers/nesting.worker.ts#L22-L42) | Arka planda 2D giyotin/kutu yerleşimi hesaplar. |
| **DXF Dışa Aktarıcı** | [`src/utils/dxfExporter.ts`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/utils/dxfExporter.ts#L17-L95) | Yerleşen parçaları AutoCAD AC1015 formatında DXF olarak dışa aktarır. |
| **Veri Tipleri** | [`src/types/nesting2d.types.ts`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/types/nesting2d.types.ts) | `Point2D`, `Polygon`, `Part2D`, `Sheet2D`, `PlacedPart`, `NestingOptions` tanımları. |
| **Mevcut CAM Çekirdekleri** | [`src/components/cam/CamWindow.tsx`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/components/cam/CamWindow.tsx), [`src/components/modules/mechanical/CamToolpathGenerator.ts`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/components/modules/mechanical/CamToolpathGenerator.ts) | İzole 2.5D frezeleme CAM aracı (plazma özelliklerinden yoksun). |

---

## 2. Veri Modelleri (Part, Contour, Placement, Sheet)

- **Mevcut Model ([`src/types/nesting2d.types.ts`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/types/nesting2d.types.ts#L22-L50)):**
  - `Polygon`: `{ points: Point2D[], bounds: BoundingBox, area: number }`. Yay (arc, bulge, center/radius) tutulmamaktadır; tamamen düz çizgi segmentlerinden oluşan nokta dizisidir.
  - `Part2D`: `{ id, label, polygon: Polygon, quantity, allowedRotations, source, holeCount?, innerPolygons? }`.
- **Yayların Durumu:**
  - Yaylar DXF ayrıştırma aşamasında (`src/utils/dxfParser.ts:45, 96, 138-140`) `ARC_TOLERANCE = 0.1 mm` toleransı ile çokgen çizgilerine (line segments) bölünmektedir.
  - Daireler `approximateCircle` ile 360 segmente kadar (~80-120 kenarlı poligon) bölünerek saklanmakta; orijinal analitik eğrilik, merkez ve yarıçap bilgisi kaybolmaktadır.
  - Bu durum G-kod üretiminde yüzlerce `G01` interpolasyonuna, fasetli yüzeylere ve plazmada pürüzlü/yanık kenarlara yol açmaktadır.
- **Toleranslar:**
  - `ARC_TOLERANCE = 0.1 mm` (`src/utils/dxfParser.ts:45`).
  - Minimum poligon nokta sayısı: `MIN_POLYGON_POINTS = 3` (`src/utils/dxfParser.ts:48`).
  - Dışa aktarma koordinat hassasiyeti: `toFixed(4)` (`src/utils/dxfExporter.ts:133`).

---

## 3. İçe Aktarma Mantığı ve Kapsamı

- **Desteklenen DXF Varlıkları ([`src/utils/dxfParser.ts:333-334`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/utils/dxfParser.ts#L333-L334)):**
  - Desteklenenler: `LINE`, `ARC`, `CIRCLE`, `LWPOLYLINE`, `POLYLINE`.
  - Atlananlar: `TEXT`, `MTEXT`, `DIMENSION`, `LEADER`, `ATTDEF`, `ATTRIB` (uyarı logu üretilmektedir).
  - Desteklenmeyenler: `SPLINE`, `ELLIPSE`, `INSERT` (blok referansları), `HATCH`.
- **Açık Konturlar ve Birleştirme:**
  - `src/utils/dxfParser.ts:300` satırında açıkça `// TODO: Chain LINEs and ARCs into connected paths` notu yer almaktadır. Birbirine uç uca eklenmiş serbest LINE ve ARC varlıkları kapalı poligon zincirine dönüştürülmemektedir.
- **İç Konturlar (Delikler / Bores):**
  - `buildPolygonChains` fonksiyonunda (`src/utils/dxfParser.ts:264-280`) her bir `CIRCLE` veya kapalı `LWPOLYLINE` bağımsız bir `Part2D` olarak listeye eklenmektedir. Bir parçanın dış sınırı ile içerisindeki delik arasında hiyerarşik (outer/hole parent-child) ilişki kurulmamaktadır. Kasnakların göbek delikleri ayrı birer yuvarlak parça olarak algılanmaktadır.
- **`$INSUNITS` ve Ölçekleme:**
  - Header'daki `$INSUNITS` okunmamakta; tüm koordinatlar doğrudan birimsiz ham sayı olarak alınmaktadır.

---

## 4. Koordinat Sistemi ve Y Ekseni Tutarsızlığı

- **İç Model ve DXF:**
  - AutoCAD / DXF standardında Kartezyen koordinat sistemi geçerlidir: `(0,0)` sol-alt köşedir, **Y ekseni yukarı doğrudur (+Y yukarı)**.
- **Arayüzdeki Durum ([`src/components/NestingCanvas.tsx:40-70`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/components/NestingCanvas.tsx#L40-L70)):**
  - SVG standart koordinat sisteminde `(0,0)` sol-üst köşedir ve **Y ekseni aşağı doğrudur (+Y aşağı)**.
  - `NestingCanvas.tsx` içinde parça koordinatları doğrudan SVG `path` dizesine (`y += offsetY`) eklenmekte, Y ekseni ters çevrilmemektedir (`scale(1, -1)` veya `y = sheet.height - y` yapılmamaktadır).
  - **Sonuç:** DXF'te üstte olan parçalar arayüzde altta, tırnaklar yukarı bakması gerekirken aşağı bakmaktadır. Bu ayna görüntüsü (mirroring) plazma kesim yönünü (CW/CCW) tersine çevirmekte; kerf'in dik olan "iyi yüzü" hurda tarafına, eğik olan "kötü yüzü" mamul parçaya düşmektedir!

---

## 5. Algoritmalar: Vaat Edilen vs. Gerçekte Çalışan

- **Arayüz Seçenekleri ([`src/components/Nesting2D.tsx:36-37`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/components/Nesting2D.tsx#L36-L37)):**
  - UI'da `algorithm: 'guillotine'`, `heuristic: 'best-area-fit'` varsayılan olarak seçilmektedir.
- **Gerçekte Çalışan ([`src/workers/nesting.worker.ts:251-287`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/workers/nesting.worker.ts#L251-L287)):**
  - Yalnızca **Sınırlayıcı Kutu Tabanlı Giyotin Yerleşim (Bounding Box Guillotine)** çalışmaktadır.
  - `splitRectangle` fonksiyonu parçanın dış sınırlayıcı kutusunu (`polygon.bounds`) alıp boş dikdörtgenleri yatay/dikey bölmektedir.
- **Eksik veya Sahte Olanlar:**
  - Sayfa metinlerinde veya tanıtımlarda geçen "Genetik Algoritma (GA)" ve "Bottom-Left-Fill (BLF)" kod içinde **yoktur**.
  - **Gerçek Çokgen Çakışma Testi (No-Fit Polygon / SAT / Clipper):** Yoktur; parçalar poligon olarak değil, kutu olarak yerleştirilmektedir.
  - **Part-in-Part:** Deliklerin içine küçük parçaların yerleştirilmesi kodu mevcut değildir.
  - **Dairesel / Altıgen (Hexagonal) Dizilim:** Yoktur; daireler kare/dikdörtgen kutu gibi davranmakta, bu da doluluk oranını büyük ölçüde düşürmektedir (%90.7 yerine %78.5 teorik sınır).

---

## 6. Kerf ve Minimum Boşluk Uygulaması

- **Mevcut Durum ([`src/workers/nesting.worker.ts:198-209`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/workers/nesting.worker.ts#L198-L209)):**
  - `kerfOffset = sheet.kerf / 2` hesaplanmakta ve `offsetPolygon` fonksiyonu ile poligon noktaları miter ofsetiyle dışarı ötelenmektedir.
  - Ancak yerleşim `findBestPlacement` fonksiyonunda sınırlayıcı kutu (`polygon.bounds.width + options.spacing`) üzerinden yapıldığı için, gerçek parça sınırları arasındaki boşluk poligon geometrisine göre değil, eksenel kutulara göre oluşmaktadır.
  - Plazma lead-in giriş yayları ve delme noktaları hesaba katılmamaktadır.

---

## 7. Doluluk Oranı (%) ve Sac Boyutu Dönüşümü

- **Mevcut Doluluk Formülü ([`src/workers/nesting.worker.ts:348-350`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/workers/nesting.worker.ts#L348-L350)):**
  - `efficiency: (usedArea / sheetArea) * 100`
  - Pay (`usedArea`): Yerleşen parçaların poligon alanları toplamı ($0.412\text{ m}^2$).
  - Payda (`sheetArea`): `sheet.width * sheet.height`. Sac $2500 \times 1250\text{ mm}$ ($3.125\text{ m}^2$) olduğunda gerçek doluluk $\%13.18$'dir.
- **Neden Ekranda %45–46 Görünüyor ve 1510×594'e Dönüşüyor?**
  - DXF dışa aktarıldığında (`nested_parts.dxf`), `SHEET` katmanında $2500 \times 1250$ yerine parçaların kapladığı sınırlayıcı kutu ($1510 \times 594\text{ mm} = 0.897\text{ m}^2$) yazılmıştır.
  - Arayüz veya hesaplama doluluğu tüm saca göre değil, kullanılan dikdörtgen bölgeye göre hesaplamakta: $0.412 / 0.897 \approx \%45.9$.
  - **Gereksinim:** İki ayrı metrik sunulmalıdır:
    1. **Gerçek Sac Doluluğu:** $A_{parçalar} / A_{brüt\_sac}$
    2. **Kullanılan Bölge Verimi:** $A_{parçalar} / A_{kullanılan\_dikdörtgen}$ (Geriye kalan artık plaka `remnant` olarak kaydedilmelidir).

---

## 8. Dışa Aktarma, Maliyet ve Raporlama

- **DXF Dışa Aktarma ([`src/utils/dxfExporter.ts`](file:///c:/Users/apo_q/OneDrive/Documents/alucalculator/src/utils/dxfExporter.ts)):**
  - `exportToDXF`: `AC1015` başlığı, `0`, `PARTS`, `SHEET` katmanları ve kapalı `LWPOLYLINE` varlıkları üretir.
  - Yaylar (`bulge`) desteklenmemektedir; tüm eğriler fasetli noktalar olarak yazılmaktadır.
- **SVG / PDF Dışa Aktarma:**
  - `NestingCanvas` SVG olarak render edilir ancak bağımsız SVG dosyası veya PDF raporu indirme fonksiyonu eksiktir.
- **Maliyet Hesabı:**
  - `materialCostPerM2` değişkeni (`Nesting2D.tsx:42`) mevcuttur ancak detaylı sarf gaz, kesim süresi, delme maliyeti ve elektrik tüketimi entegre edilmemiştir.

---

## 9. Bağımlılıklar ve Worker Mimarisi

- **Mevcut Bağımlılıklar:**
  - `dxf-parser`: DXF okuma için mevcut.
  - `framer-motion`, `lucide-react`, `canvas-confetti`.
- **Eksik Olanlar:**
  - Güçlü bir poligon kırpma/ofset motoru (`Clipper2` veya WASM portu). Mevcut el yapımı `offsetPolygon` karmaşık içbükey şekillerde kendini kesme (self-intersection) ve sivri tepe hataları yapmaktadır.
- **Worker İlerleme ve İptal:**
  - `worker.postMessage({ type: 'progress', payload: { percent, currentPart, totalParts } })` mevcuttur.
  - İptal mekanizması mesajı almaktadır ancak döngüyü anında kıran bir abort-controller/token henüz bağlanmamıştır.

---

## 10. Çok Dilli Yapı (i18n) ve Durum Yönetimi

- Uygulama `src/locales/` ve `dict` prop'u üzerinden iki dilli (`tr` / `en`) çalışmaktadır.
- Yeni CAM ve plazma terimleri:
  - `src/locales/cadTranslations.ts` ve sayfa içi sözlük objelerine eklenecektir.
- Durum yönetimi:
  - Yerleşim sonuçları `useNestingWorker` içinde tutulmakta; 3D Assembly ile `useAssemblyStore` üzerinden köprü kurulmaktadır.

---

## 11. Fixture Testi: `nested_parts.dxf` Mevcut Ayrıştırıcı Analizi

`C:\Users\apo_q\Downloads\nested_parts.dxf` (`fixtures/nested_parts.dxf`) mevcut `parseDxfContent` fonksiyonundan geçirildiğinde:

| Parametre | Fixture Değeri (Gerçek) | Mevcut Ayrıştırıcı Çıktısı | Durum / Hata |
|---|---|---|---|
| **Varlık Sayısı** | 16 LWPOLYLINE (1 SHEET + 15 PARTS) | 16 parça algılanır | **HATA:** `SHEET` dikdörtgeni de parça sanılmaktadır! |
| **Büyük Kasnaklar** | $7 \times \varnothing \approx 248\text{ mm}$ kasnak | 7 kapalı poligon (her biri 80 nokta) | Yaylar kayıp, 80 kenarlı poligon. |
| **Orta Kasnak** | $1 \times \varnothing \approx 234\text{ mm}$ kasnak | 1 kapalı poligon (80 nokta) | Yaylar kayıp, 80 kenarlı poligon. |
| **Küçük Parçalar** | $7 \times \varnothing \approx 68\text{ mm}$ (tırnaklı) | 7 kapalı poligon | Tırnaklı parçalar algılanır. |
| **Göbek Delikleri (Bore)** | Kasnak milleri / delikler | 0 delik | **HATA:** İç kontur algılanmamaktadır. |
| **Toplam Alan** | $\approx 0.412\text{ m}^2$ | $\approx 0.412\text{ m}^2$ (+ SHEET alanı) | Parça/sac ayrımı yapılmalıdır. |
| **Uyarılar** | Yok | Boş liste | $INSUNITS veya katman filtresi uyarısı verilmemektedir. |

---

## 12. Hatalar, Riskler ve CAM Mimari Önerisi

### Kritik Hatalar ve Riskler (Öncelik Sırasıyla):
1. **Y Ekseni Tersliği (Mirroring):** Arayüzün Y eksenini ters çizmesi, CW/CCW kesim yönlerini tersine çevirerek plazmanın eğik kenarını mamule vermektedir. *(Kritik Üretim Hatası)*
2. **Yayların Poligona Dönüşmesi (Arc Loss):** Dairelerin 80 çizgili poligona bölünmesi CNC tezgâhında sarsıntıya, yüksek satır sayısına ve kalitesiz kesime sebep olur. Arc-fitting (yay uydurma) şarttır.
3. **İç Deliklerin (Bores) Kaybı:** Kasnak iç delikleri dış konturdan ayrılamamakta veya atlanmaktadır. Even-Odd kontur hiyerarşisi zorunludur.
4. **Sınırlayıcı Kutu Yerleşimi (Kötü Doluluk):** Dairesel parçaların kutu gibi yerleştirilmesi %20–30 gereksiz sac israfına neden olmaktadır.
5. **Plazma Proses Verisi Eksikliği:** Lead-in/lead-out, pierce gecikmesi, torç girdap yönü (swirl) ve kerf kompanzasyonu olmadan üretilen G-kod plazmada çalıştırılamaz.

### Önerilen CAM Modül Mimarisi (`src/cam/`):
```
src/cam/
├── core/
│   ├── geometry.ts         # Contour, Segment (Line/Arc), BoundingBox, Orientation
│   ├── arcFitting.ts       # En küçük kareler çember/yay uydurma (poligon -> G02/G03)
│   ├── processProfile.ts   # Plazma kesim parametreleri (amper, hız, kerf, voltaj, gecikme)
│   └── hierarchy.ts        # Even-Odd iç/dış kontur ağacı (outer vs hole)
├── nesting/
│   ├── trueShapeNest.ts    # Poligon ofseti, NFP / Hexagonal dairesel paketleme
│   └── remnantTracker.ts   # Artık sac tespiti ve yönetimi
├── toolpath/
│   ├── leadInGenerator.ts  # Teğetsel yay ve çizgisel lead-in/lead-out + çarpışma testi
│   ├── thermalSequence.ts  # Q ısı girdisi, mesafe/soğuma optimizasyonu (hopping), 2-opt
│   └── cutOrder.ts         # Önce iç delikler (küçükten büyüğe), en son dış çevre
├── post/
│   ├── gcodeEmitter.ts     # G00/G01/G02/G03 standart G-kod üretici
│   ├── backplotter.ts      # Üretilen G-kodu geri okuyup doğrulayan simülatör
│   └── dialects/           # Mach3, LinuxCNC PlasmaC, Generic ISO, ESAB ESSI
└── ui/
    ├── PlasmaControlPanel.tsx # Plazma proses girdi formu
    └── ToolpathViewer.tsx     # Yön okları, iyi taraf gölgesi ve simülasyon
```

---

## 13. Doğrulanamayanlar
- `fixtures/nested_parts.dxf` içindeki kasnakların orijinal çiziminde delik bulunup bulunmadığı (orijinal DXF'in kendisinde sadece 15 adet dış LWPOLYLINE mevcut, delik katmanı DXF'e aktarılmamış olabilir).
- Kullanıcının plazma tezgâhındaki torcun sağ girdaplı mı (standart Hypertherm/Thermal Dynamics) yoksa sol girdaplı mı olduğu (arayüze kullanıcı seçimi `swirl: 'CW' | 'CCW'` eklenecektir).
