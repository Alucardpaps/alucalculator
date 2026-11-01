import { t12 } from '@/locales/t12';
import type { Language } from '@/store/i18nStore';

export const CAD_I18N_MAP: Record<string, { en: string; tr: string }> = {
  "Line": {
    "en": "Line",
    "tr": "Çizgi"
  },
  "Parameters": {
    "en": "Parameters",
    "tr": "Parametreler"
  },
  "Polyline": {
    "en": "Polyline",
    "tr": "Bileşik Çizgi"
  },
  "Circle": {
    "en": "Circle",
    "tr": "Çember"
  },
  "Rectangle": {
    "en": "Rectangle",
    "tr": "Dikdörtgen"
  },
  "Geometri": {
    "en": "Geometry",
    "tr": "Geometri"
  },
  "Polygon": {
    "en": "Polygon",
    "tr": "Çokgen"
  },
  "Poligon Ayarları": {
    "en": "Polygon Settings",
    "tr": "Poligon Ayarları"
  },
  "Arc": {
    "en": "Arc",
    "tr": "Yay"
  },
  "Trim (Budama)": {
    "en": "Trim",
    "tr": "Trim (Budama)"
  },
  "Canlı Çit Budama": {
    "en": "Live Fence Trim",
    "tr": "Canlı Çit Budama"
  },
  "Fillet (Radyus)": {
    "en": "Fillet",
    "tr": "Fillet (Radyus)"
  },
  "Radyus Parametreleri": {
    "en": "Fillet Parameters",
    "tr": "Radyus Parametreleri"
  },
  "Chamfer (Pah Kırma)": {
    "en": "Chamfer",
    "tr": "Chamfer (Pah Kırma)"
  },
  "Pah Mesafeleri": {
    "en": "Chamfer Distances",
    "tr": "Pah Mesafeleri"
  },
  "Offset (Ötele)": {
    "en": "Offset",
    "tr": "Offset (Ötele)"
  },
  "Öteleme Mesafesi": {
    "en": "Offset Distance",
    "tr": "Öteleme Mesafesi"
  },
  "Scale (Ölçekle)": {
    "en": "Scale",
    "tr": "Scale (Ölçekle)"
  },
  "Ölçek Faktörü": {
    "en": "Scale Factor",
    "tr": "Ölçek Faktörü"
  },
  "Join (Birleştir)": {
    "en": "Join",
    "tr": "Join (Birleştir)"
  },
  "Polyline Birleştirme": {
    "en": "Polyline Join",
    "tr": "Polyline Birleştirme"
  },
  "Group (Grupla)": {
    "en": "Group",
    "tr": "Group (Grupla)"
  },
  "Grup Özellikleri": {
    "en": "Group Properties",
    "tr": "Grup Özellikleri"
  },
  "Ungroup (Grubu Çöz)": {
    "en": "Ungroup",
    "tr": "Ungroup (Grubu Çöz)"
  },
  "Grup Çözme": {
    "en": "Ungrouping",
    "tr": "Grup Çözme"
  },
  "Explode (Patlat)": {
    "en": "Explode",
    "tr": "Explode (Patlat)"
  },
  "Parçalama": {
    "en": "Explode",
    "tr": "Parçalama"
  },
  "Linear Dimension": {
    "en": "Linear Dimension",
    "tr": "Doğrusal Ölçülendirme"
  },
  "Tolerans (GD&T)": {
    "en": "Tolerance (GD&T)",
    "tr": "Tolerans (GD&T)"
  },
  "Measure (Mesafe Ölç)": {
    "en": "Measure",
    "tr": "Measure (Mesafe Ölç)"
  },
  "Canlı Ölçüm Bilgisi": {
    "en": "Live Measurement Info",
    "tr": "Canlı Ölçüm Bilgisi"
  },
  "Leader Note (Lider Not)": {
    "en": "Leader Note",
    "tr": "Leader Note (Lider Not)"
  },
  "Not Metni": {
    "en": "Note Text",
    "tr": "Not Metni"
  },
  "Surface Finish (Yüzey İşareti)": {
    "en": "Surface Finish",
    "tr": "Surface Finish (Yüzey İşareti)"
  },
  "Parametreler": {
    "en": "Parameters",
    "tr": "Parametreler"
  },
  "Surface Leader (Yüzey Lideri)": {
    "en": "Surface Leader",
    "tr": "Surface Leader (Yüzey Lideri)"
  },
  "Direct Surface Finish (Doğrudan)": {
    "en": "Direct Surface Finish",
    "tr": "Direct Surface Finish (Doğrudan)"
  },
  "Ellipse (Elips)": {
    "en": "Ellipse",
    "tr": "Ellipse (Elips)"
  },
  "Eksen Boyutları": {
    "en": "Axis Dimensions",
    "tr": "Eksen Boyutları"
  },
  "Spline Curve (Eğri)": {
    "en": "Spline Curve",
    "tr": "Spline Curve (Eğri)"
  },
  "Eğri Durumu": {
    "en": "Curve Status",
    "tr": "Eğri Durumu"
  },
  "Hatch (Tarama)": {
    "en": "Hatch",
    "tr": "Hatch (Tarama)"
  },
  "Desen ve Ölçek": {
    "en": "Pattern & Scale",
    "tr": "Desen ve Ölçek"
  },
  "Text Annotation (Not)": {
    "en": "Text Annotation",
    "tr": "Text Annotation (Not)"
  },
  "Metin İçeriği": {
    "en": "Text Content",
    "tr": "Metin İçeriği"
  },
  "Yazı Boyutu ve Stil": {
    "en": "Font Size & Style",
    "tr": "Yazı Boyutu ve Stil"
  },
  "Move (Taşı)": {
    "en": "Move",
    "tr": "Move (Taşı)"
  },
  "Öteleme Vektörü": {
    "en": "Translation Vector",
    "tr": "Öteleme Vektörü"
  },
  "Copy (Kopyala)": {
    "en": "Copy",
    "tr": "Copy (Kopyala)"
  },
  "Öteleme ve Adet": {
    "en": "Offset & Count",
    "tr": "Öteleme ve Adet"
  },
  "Rotate (Döndür)": {
    "en": "Rotate",
    "tr": "Rotate (Döndür)"
  },
  "Dönme Açısı": {
    "en": "Rotation Angle",
    "tr": "Dönme Açısı"
  },
  "Mirror (Aynala)": {
    "en": "Mirror",
    "tr": "Mirror (Aynala)"
  },
  "Aynalama Seçenekleri": {
    "en": "Mirror Options",
    "tr": "Aynalama Seçenekleri"
  },
  "Extend (Uzat)": {
    "en": "Extend",
    "tr": "Extend (Uzat)"
  },
  "Options": {
    "en": "Options",
    "tr": "Seçenekler"
  },
  "Evolvent Dişli (ISO 53 / DIN 867)": {
    "en": "Involute Gear (ISO 53 / DIN 867)",
    "tr": "Evolvent Dişli (ISO 53 / DIN 867)"
  },
  "Dişli Parametreleri": {
    "en": "Gear Parameters",
    "tr": "Dişli Parametreleri"
  },
  "Hesaplanan Ölçüler (DIN)": {
    "en": "Calculated Dimensions (DIN)",
    "tr": "Hesaplanan Ölçüler (DIN)"
  },
  "Karşılık Dişli (Mating Gear)": {
    "en": "Mating Gear",
    "tr": "Karşılık Dişli (Mating Gear)"
  },
  "Karşılık Dişli Parametreleri": {
    "en": "Mating Gear Parameters",
    "tr": "Karşılık Dişli Parametreleri"
  },
  "Kayış & Kasnak (ISO 5296 / DIN 7721)": {
    "en": "Belt & Pulley (ISO 5296 / DIN 7721)",
    "tr": "Kayış & Kasnak (ISO 5296 / DIN 7721)"
  },
  "Kasnak Ölçüleri": {
    "en": "Pulley Dimensions",
    "tr": "Kasnak Ölçüleri"
  },
  "Planet Dişli Grubu (Epicyclic)": {
    "en": "Planetary Gear Set (Epicyclic)",
    "tr": "Planet Dişli Grubu (Epicyclic)"
  },
  "Rulo Zincir Dişlisi (ISO 606 / DIN 8187)": {
    "en": "Roller Chain Sprocket (ISO 606 / DIN 8187)",
    "tr": "Rulo Zincir Dişlisi (ISO 606 / DIN 8187)"
  },
  "Zincir ve Dişli Parametreleri": {
    "en": "Chain & Sprocket Parameters",
    "tr": "Zincir ve Dişli Parametreleri"
  },
  "Hesaplanan Ölçüler (ISO 606)": {
    "en": "Calculated Dimensions (ISO 606)",
    "tr": "Hesaplanan Ölçüler (ISO 606)"
  },
  "Çizim ve Yazdırma (Plot)": {
    "en": "Drawing & Plotting",
    "tr": "Çizim ve Yazdırma (Plot)"
  },
  "Kağıt ve Yerleşim": {
    "en": "Paper & Layout",
    "tr": "Kağıt ve Yerleşim"
  },
  "Antet Bilgileri": {
    "en": "Title Block Info",
    "tr": "Antet Bilgileri"
  },
  "Fastener / Cıvata & Somun (ISO/DIN)": {
    "en": "Fastener / Bolt & Nut (ISO/DIN)",
    "tr": "Fastener / Cıvata & Somun (ISO/DIN)"
  },
  "Eleman ve Standart": {
    "en": "Element & Standard",
    "tr": "Eleman ve Standart"
  },
  "Görünüş ve Yön": {
    "en": "View & Orientation",
    "tr": "Görünüş ve Yön"
  },
  "Standart Ölçüleri (ISO 4014 / 4032)": {
    "en": "Standard Dimensions (ISO 4014 / 4032)",
    "tr": "Standart Ölçüleri (ISO 4014 / 4032)"
  },
  "T-Slot Alüminyum Profil (Wellste / EN 12020)": {
    "en": "T-Slot Aluminum Profile (Wellste / EN 12020)",
    "tr": "T-Slot Alüminyum Profil (Wellste / EN 12020)"
  },
  "Profil Modeli (Wellste Kataloğu)": {
    "en": "Profile Model (Wellste Catalog)",
    "tr": "Profil Modeli (Wellste Kataloğu)"
  },
  "Kesit & Atalet Analizi (DIN EN 1993)": {
    "en": "Cross Section Analysis (DIN EN 1993)",
    "tr": "Kesit & Atalet Analizi (DIN EN 1993)"
  },
  "Analiz Durumu": {
    "en": "Analysis Status",
    "tr": "Analiz Durumu"
  },
  "X1 (Başlangıç)": {
    "en": "X1 (Start)",
    "tr": "X1 (Başlangıç)"
  },
  "Y1 (Başlangıç)": {
    "en": "Y1 (Start)",
    "tr": "Y1 (Başlangıç)"
  },
  "X2 (Bitiş)": {
    "en": "X2 (End)",
    "tr": "X2 (Bitiş)"
  },
  "Y2 (Bitiş)": {
    "en": "Y2 (End)",
    "tr": "Y2 (Bitiş)"
  },
  "Uzunluk": {
    "en": "Length",
    "tr": "Uzunluk"
  },
  "Açı": {
    "en": "Angle",
    "tr": "Açı"
  },
  "Closed": {
    "en": "Closed",
    "tr": "Kapalı"
  },
  "Vertices": {
    "en": "Vertices",
    "tr": "Köşeler"
  },
  "Center X": {
    "en": "Center X",
    "tr": "Merkez X"
  },
  "Center Y": {
    "en": "Center Y",
    "tr": "Merkez Y"
  },
  "Radius": {
    "en": "Radius",
    "tr": "Yarıçap"
  },
  "Diameter": {
    "en": "Diameter",
    "tr": "Çap"
  },
  "Genişlik (w)": {
    "en": "Width (w)",
    "tr": "Genişlik (w)"
  },
  "Yükseklik (h)": {
    "en": "Height (h)",
    "tr": "Yükseklik (h)"
  },
  "Kenar Sayısı (N)": {
    "en": "Sides (N)",
    "tr": "Kenar Sayısı (N)"
  },
  "Yarıçap (R)": {
    "en": "Radius (R)",
    "tr": "Yarıçap (R)"
  },
  "Start Angle": {
    "en": "Start Angle",
    "tr": "Başlangıç Açısı"
  },
  "End Angle": {
    "en": "End Angle",
    "tr": "Bitiş Açısı"
  },
  "🖱️ Sürükle-Kes (Fence Trail)": {
    "en": "🖱️ Drag-Cut (Fence Trail)",
    "tr": "🖱️ Sürükle-Kes (Fence Trail)"
  },
  "Tüm Kesişimleri Seç (Enter)": {
    "en": "Select All Intersections (Enter)",
    "tr": "Tüm Kesişimleri Seç (Enter)"
  },
  "⚡ Tüm Köşeleri Yuvarlat (All)": {
    "en": "⚡ Fillet All Corners (All)",
    "tr": "⚡ Tüm Köşeleri Yuvarlat (All)"
  },
  "R1": {
    "en": "R1",
    "tr": "R1"
  },
  "R2": {
    "en": "R2",
    "tr": "R2"
  },
  "R5": {
    "en": "R5",
    "tr": "R5"
  },
  "R10": {
    "en": "R10",
    "tr": "R10"
  },
  "R20": {
    "en": "R20",
    "tr": "R20"
  },
  "Mesafe 1 (d1)": {
    "en": "Distance 1 (d1)",
    "tr": "Mesafe 1 (d1)"
  },
  "Mesafe 2 (d2)": {
    "en": "Distance 2 (d2)",
    "tr": "Mesafe 2 (d2)"
  },
  "⚡ Tüm Köşelere Pah Kır (All)": {
    "en": "⚡ Chamfer All Corners (All)",
    "tr": "⚡ Tüm Köşelere Pah Kır (All)"
  },
  "1×45°": {
    "en": "1×45°",
    "tr": "1×45°"
  },
  "2×45°": {
    "en": "2×45°",
    "tr": "2×45°"
  },
  "5×45°": {
    "en": "5×45°",
    "tr": "5×45°"
  },
  "10×45°": {
    "en": "10×45°",
    "tr": "10×45°"
  },
  "Mesafe": {
    "en": "Distance",
    "tr": "Mesafe"
  },
  "Dışa Ötele (+10mm)": {
    "en": "Offset Outward (+10mm)",
    "tr": "Dışa Ötele (+10mm)"
  },
  "İçe Ötele (-10mm)": {
    "en": "Offset Inward (-10mm)",
    "tr": "İçe Ötele (-10mm)"
  },
  "Uygula (Enter)": {
    "en": "Apply (Enter)",
    "tr": "Uygula (Enter)"
  },
  "Faktör": {
    "en": "Factor",
    "tr": "Faktör"
  },
  "2x Büyüt": {
    "en": "Scale 2x",
    "tr": "2x Büyüt"
  },
  "0.5x Küçült (Yarıya İndir)": {
    "en": "Scale 0.5x (Halve)",
    "tr": "0.5x Küçült (Yarıya İndir)"
  },
  "3x Büyüt": {
    "en": "Scale 3x",
    "tr": "3x Büyüt"
  },
  "Durum": {
    "en": "Status",
    "tr": "Durum"
  },
  "Seçilenleri Birleştir (Enter)": {
    "en": "Join Selected (Enter)",
    "tr": "Seçilenleri Birleştir (Enter)"
  },
  "Grup Oluştur (G)": {
    "en": "Create Group (G)",
    "tr": "Grup Oluştur (G)"
  },
  "Grubu Çöz (UNG)": {
    "en": "Ungroup (UNG)",
    "tr": "Grubu Çöz (UNG)"
  },
  "Patlat / Parçala (X)": {
    "en": "Explode (X)",
    "tr": "Patlat / Parçala (X)"
  },
  "Tolerans": {
    "en": "Tolerance",
    "tr": "Tolerans"
  },
  "Yok": {
    "en": "None",
    "tr": "Yok"
  },
  "Simetrik (±)": {
    "en": "Symmetric (±)",
    "tr": "Simetrik (±)"
  },
  "Asimetrik (+/-)": {
    "en": "Asymmetric (+/-)",
    "tr": "Asimetrik (+/-)"
  },
  "Üst (+)": {
    "en": "Upper (+)",
    "tr": "Üst (+)"
  },
  "Alt (-)": {
    "en": "Lower (-)",
    "tr": "Alt (-)"
  },
  "📐 Hemen Yerleştir (Enter)": {
    "en": "📐 Place Now (Enter)",
    "tr": "📐 Hemen Yerleştir (Enter)"
  },
  "±0.05 Tolerans Ekle": {
    "en": "Add ±0.05 Tolerance",
    "tr": "±0.05 Tolerans Ekle"
  },
  "📐 Kalıcı Ölçüye Dönüştür (Enter)": {
    "en": "📐 Convert to Permanent Dim (Enter)",
    "tr": "📐 Kalıcı Ölçüye Dönüştür (Enter)"
  },
  "Metin": {
    "en": "Text",
    "tr": "Metin"
  },
  "📌 Lider Notu Hemen Ekle": {
    "en": "📌 Insert Leader Note Now",
    "tr": "📌 Lider Notu Hemen Ekle"
  },
  "R0.5 TÜM KÖŞELER": {
    "en": "R0.5 ALL CORNERS",
    "tr": "R0.5 TÜM KÖŞELER"
  },
  "ÇAPAKLARI TEMİZLEYİN": {
    "en": "DEBURR ALL EDGES",
    "tr": "ÇAPAKLARI TEMİZLEYİN"
  },
  "KAYNAK DİKİŞİ 5mm": {
    "en": "WELD SEAM 5mm",
    "tr": "KAYNAK DİKİŞİ 5mm"
  },
  "▽ Ra 3.2 GENEL TALAŞLI": {
    "en": "▽ Ra 3.2 GENERAL MACHINED",
    "tr": "▽ Ra 3.2 GENEL TALAŞLI"
  },
  "▽ Ra 1.6 RULMAN YATAĞI": {
    "en": "▽ Ra 1.6 BEARING SEAT",
    "tr": "▽ Ra 1.6 RULMAN YATAĞI"
  },
  "▽ Ra 0.8 TAŞLAMA": {
    "en": "▽ Ra 0.8 GROUND",
    "tr": "▽ Ra 0.8 TAŞLAMA"
  },
  "Yerleşim Modu": {
    "en": "Placement Mode",
    "tr": "Yerleşim Modu"
  },
  "📌 Lider Ok İle (Leader)": {
    "en": "📌 With Leader Arrow",
    "tr": "📌 Lider Ok İle (Leader)"
  },
  "🎯 Doğrudan Yerleştir (Direct)": {
    "en": "🎯 Direct Placement",
    "tr": "🎯 Doğrudan Yerleştir (Direct)"
  },
  "Parametre": {
    "en": "Parameter",
    "tr": "Parametre"
  },
  "Ra (Aritmetik Ortalama)": {
    "en": "Ra (Roughness Average)",
    "tr": "Ra (Aritmetik Ortalama)"
  },
  "Rz (Ortalama Tepe/Vadi)": {
    "en": "Rz (Mean Roughness Depth)",
    "tr": "Rz (Ortalama Tepe/Vadi)"
  },
  "Rmax (Maksimum Tepe)": {
    "en": "Rmax (Maximum Roughness)",
    "tr": "Rmax (Maksimum Tepe)"
  },
  "Pürüzlülük (μm)": {
    "en": "Roughness (μm)",
    "tr": "Pürüzlülük (μm)"
  },
  "İmalat Türü": {
    "en": "Manufacturing Process",
    "tr": "İmalat Türü"
  },
  "Talaşlı (Kapalı Bar)": {
    "en": "Machined (Closed Bar)",
    "tr": "Talaşlı (Kapalı Bar)"
  },
  "Serbest (Açık V)": {
    "en": "Material Removal Optional (Open V)",
    "tr": "Serbest (Açık V)"
  },
  "Talaşsız (Daireli)": {
    "en": "Non-machined (Enclosed Circle)",
    "tr": "Talaşsız (Daireli)"
  },
  "📌 Yüzey İşaretini Hemen Ekle": {
    "en": "📌 Insert Surface Symbol Now",
    "tr": "📌 Yüzey İşaretini Hemen Ekle"
  },
  "Ra 3.2 (Genel Talaşlı)": {
    "en": "Ra 3.2 (General Machined)",
    "tr": "Ra 3.2 (Genel Talaşlı)"
  },
  "Ra 1.6 (Rulman Yatağı)": {
    "en": "Ra 1.6 (Bearing Seat)",
    "tr": "Ra 1.6 (Rulman Yatağı)"
  },
  "Ra 0.8 (Yüzey Taşlama)": {
    "en": "Ra 0.8 (Surface Ground)",
    "tr": "Ra 0.8 (Yüzey Taşlama)"
  },
  "Ra 0.4 (Hassas Taşlama)": {
    "en": "Ra 0.4 (Fine Ground)",
    "tr": "Ra 0.4 (Hassas Taşlama)"
  },
  "Ra 0.2 (Honlama)": {
    "en": "Ra 0.2 (Honed)",
    "tr": "Ra 0.2 (Honlama)"
  },
  "Ra 12.5 (Döküm / Talaşsız)": {
    "en": "Ra 12.5 (Cast / Unmachined)",
    "tr": "Ra 12.5 (Döküm / Talaşsız)"
  },
  "🛠️ Ayrıntılı Oluşturucu Aç": {
    "en": "🛠️ Open Detailed Builder",
    "tr": "🛠️ Ayrıntılı Oluşturucu Aç"
  },
  "📌 Lider İşareti Hemen Ekle": {
    "en": "📌 Insert Leader Symbol Now",
    "tr": "📌 Lider İşareti Hemen Ekle"
  },
  "Ra": {
    "en": "Ra",
    "tr": "Ra"
  },
  "Rz": {
    "en": "Rz",
    "tr": "Rz"
  },
  "📌 Doğrudan Ekle": {
    "en": "📌 Insert Directly",
    "tr": "📌 Doğrudan Ekle"
  },
  "Ra 3.2 (Genel)": {
    "en": "Ra 3.2 (General)",
    "tr": "Ra 3.2 (Genel)"
  },
  "Ra 1.6 (Rulman)": {
    "en": "Ra 1.6 (Bearing)",
    "tr": "Ra 1.6 (Rulman)"
  },
  "Ra 0.8 (Taşlama)": {
    "en": "Ra 0.8 (Grinding)",
    "tr": "Ra 0.8 (Taşlama)"
  },
  "🛠️ Oluşturucu Aç": {
    "en": "🛠️ Open Builder",
    "tr": "🛠️ Oluşturucu Aç"
  },
  "Eksen 1 (Rx)": {
    "en": "Axis 1 (Rx)",
    "tr": "Eksen 1 (Rx)"
  },
  "Eksen 2 (Ry)": {
    "en": "Axis 2 (Ry)",
    "tr": "Eksen 2 (Ry)"
  },
  "Eğriyi Tamamla (Enter)": {
    "en": "Complete Curve (Enter)",
    "tr": "Eğriyi Tamamla (Enter)"
  },
  "Eğriyi Kapat (C)": {
    "en": "Close Curve (C)",
    "tr": "Eğriyi Kapat (C)"
  },
  "Desen": {
    "en": "Pattern",
    "tr": "Desen"
  },
  "ANSI31 (45° Çizgili)": {
    "en": "ANSI31 (45° Lines)",
    "tr": "ANSI31 (45° Çizgili)"
  },
  "SOLID (Dolu Dolgu)": {
    "en": "SOLID (Solid Fill)",
    "tr": "SOLID (Dolu Dolgu)"
  },
  "CROSS (Kare Izgara)": {
    "en": "CROSS (Grid)",
    "tr": "CROSS (Kare Izgara)"
  },
  "HONEYCOMB (Balpeteği)": {
    "en": "HONEYCOMB (Hex)",
    "tr": "HONEYCOMB (Balpeteği)"
  },
  "Ölçek": {
    "en": "Scale",
    "tr": "Ölçek"
  },
  "Kapalı Şekle Uygula (Enter)": {
    "en": "Apply to Closed Shape (Enter)",
    "tr": "Kapalı Şekle Uygula (Enter)"
  },
  "Boyut (pt)": {
    "en": "Size (pt)",
    "tr": "Boyut (pt)"
  },
  "Kalın (Bold)": {
    "en": "Bold",
    "tr": "Kalın (Bold)"
  },
  "İtalik": {
    "en": "Italic",
    "tr": "İtalik"
  },
  "Hizala": {
    "en": "Align",
    "tr": "Hizala"
  },
  "Sol": {
    "en": "Left",
    "tr": "Sol"
  },
  "Orta": {
    "en": "Center",
    "tr": "Orta"
  },
  "Sağ": {
    "en": "Right",
    "tr": "Sağ"
  },
  "📌 Çizime Yerleştir / Ekle": {
    "en": "📌 Insert / Place into Drawing",
    "tr": "📌 Çizime Yerleştir / Ekle"
  },
  "TOLERANS ±0.05": {
    "en": "TOLERANCE ±0.05",
    "tr": "TOLERANS ±0.05"
  },
  "MALZEME: 6082-T6": {
    "en": "MATERIAL: 6082-T6",
    "tr": "MALZEME: 6082-T6"
  },
  "Delta X": {
    "en": "Delta X",
    "tr": "Delta X"
  },
  "Delta Y": {
    "en": "Delta Y",
    "tr": "Delta Y"
  },
  "→ +50mm Sağa Taşı": {
    "en": "→ Move +50mm Right",
    "tr": "→ +50mm Sağa Taşı"
  },
  "↑ +50mm Yukarı Taşı": {
    "en": "↑ Move +50mm Up",
    "tr": "↑ +50mm Yukarı Taşı"
  },
  "Adet": {
    "en": "Count",
    "tr": "Adet"
  },
  "→ +50mm Sağa Kopyala": {
    "en": "→ Copy +50mm Right",
    "tr": "→ +50mm Sağa Kopyala"
  },
  "↑ +50mm Yukarı Kopyala": {
    "en": "↑ Copy +50mm Up",
    "tr": "↑ +50mm Yukarı Kopyala"
  },
  "⟳ +90° Çevir": {
    "en": "⟳ Rotate +90°",
    "tr": "⟳ +90° Çevir"
  },
  "⟲ -90° Çevir": {
    "en": "⟲ Rotate -90°",
    "tr": "⟲ -90° Çevir"
  },
  "↻ +45° Çevir": {
    "en": "↻ Rotate +45°",
    "tr": "↻ +45° Çevir"
  },
  "↺ 180° Ters Çevir": {
    "en": "↺ Reverse 180°",
    "tr": "↺ 180° Ters Çevir"
  },
  "Kaynak Şekli Sil": {
    "en": "Delete Source Shape",
    "tr": "Kaynak Şekli Sil"
  },
  "↕ Dikey Eksen (Vertical)": {
    "en": "↕ Vertical Axis",
    "tr": "↕ Dikey Eksen (Vertical)"
  },
  "↔ Yatay Eksen (Horizontal)": {
    "en": "↔ Horizontal Axis",
    "tr": "↔ Yatay Eksen (Horizontal)"
  },
  "Mode": {
    "en": "Mode",
    "tr": "Mod"
  },
  "To Boundary": {
    "en": "To Boundary",
    "tr": "Sınıra Kadar"
  },
  "Modül (m)": {
    "en": "Module (m)",
    "tr": "Modül (m)"
  },
  "Diş Sayısı (z)": {
    "en": "Teeth Count (z)",
    "tr": "Diş Sayısı (z)"
  },
  "Kavrama Açısı (α)": {
    "en": "Pressure Angle (α)",
    "tr": "Kavrama Açısı (α)"
  },
  "20° (Standart ISO/DIN)": {
    "en": "20° (Standard ISO/DIN)",
    "tr": "20° (Standart ISO/DIN)"
  },
  "14.5° (Eski / ANSI)": {
    "en": "14.5° (Obsolete / ANSI)",
    "tr": "14.5° (Eski / ANSI)"
  },
  "25° (Ağır Hizmet)": {
    "en": "25° (Heavy Duty)",
    "tr": "25° (Ağır Hizmet)"
  },
  "Taksimat Çapı (d)": {
    "en": "Pitch Diameter (d)",
    "tr": "Taksimat Çapı (d)"
  },
  "Dişüstü Çapı (da)": {
    "en": "Tip Diameter (da)",
    "tr": "Dişüstü Çapı (da)"
  },
  "Dişdibi Çapı (df)": {
    "en": "Root Diameter (df)",
    "tr": "Dişdibi Çapı (df)"
  },
  "📌 Çizime Yerleştir": {
    "en": "📌 Insert to Drawing",
    "tr": "📌 Çizime Yerleştir"
  },
  "🔗 Karşılık Dişli (Mating)": {
    "en": "🔗 Mating Gear",
    "tr": "🔗 Karşılık Dişli (Mating)"
  },
  "🪐 Planet Dişli Grubu": {
    "en": "🪐 Planetary Gear Set",
    "tr": "🪐 Planet Dişli Grubu"
  },
  "m=1.5 z=24 (d=36mm)": {
    "en": "m=1.5 z=24 (d=36mm)",
    "tr": "m=1.5 z=24 (d=36mm)"
  },
  "m=2.0 z=20 (d=40mm)": {
    "en": "m=2.0 z=20 (d=40mm)",
    "tr": "m=2.0 z=20 (d=40mm)"
  },
  "m=2.5 z=30 (d=75mm)": {
    "en": "m=2.5 z=30 (d=75mm)",
    "tr": "m=2.5 z=30 (d=75mm)"
  },
  "m=3.0 z=40 (d=120mm)": {
    "en": "m=3.0 z=40 (d=120mm)",
    "tr": "m=3.0 z=40 (d=120mm)"
  },
  "m=4.0 z=25 (d=100mm)": {
    "en": "m=4.0 z=25 (d=100mm)",
    "tr": "m=4.0 z=25 (d=100mm)"
  },
  "Diş Sayısı (z2)": {
    "en": "Teeth Count (z2)",
    "tr": "Diş Sayısı (z2)"
  },
  "z=20 Karşılık": {
    "en": "z=20 Mating",
    "tr": "z=20 Karşılık"
  },
  "z=30 Karşılık": {
    "en": "z=30 Mating",
    "tr": "z=30 Karşılık"
  },
  "z=40 Karşılık": {
    "en": "z=40 Mating",
    "tr": "z=40 Karşılık"
  },
  "z=60 Karşılık (1:3)": {
    "en": "z=60 Mating (1:3)",
    "tr": "z=60 Karşılık (1:3)"
  },
  "1. Kasnak Yarıçapı (R1)": {
    "en": "1st Pulley Radius (R1)",
    "tr": "1. Kasnak Yarıçapı (R1)"
  },
  "2. Kasnak Yarıçapı (R2)": {
    "en": "2nd Pulley Radius (R2)",
    "tr": "2. Kasnak Yarıçapı (R2)"
  },
  "Kayış Tipi": {
    "en": "Belt Type",
    "tr": "Kayış Tipi"
  },
  "Düz Kayış (Open Belt)": {
    "en": "Open Belt",
    "tr": "Düz Kayış (Open Belt)"
  },
  "Çapraz Kayış (Crossed)": {
    "en": "Crossed Belt",
    "tr": "Çapraz Kayış (Crossed)"
  },
  "R50 / R30 (1.67:1 İndirgeme)": {
    "en": "R50 / R30 (1.67:1 Reduction)",
    "tr": "R50 / R30 (1.67:1 İndirgeme)"
  },
  "R40 / R40 (1:1 Birebir)": {
    "en": "R40 / R40 (1:1 Ratio)",
    "tr": "R40 / R40 (1:1 Birebir)"
  },
  "R30 / R60 (1:2 Hızlandırma)": {
    "en": "R30 / R60 (1:2 Overdrive)",
    "tr": "R30 / R60 (1:2 Hızlandırma)"
  },
  "R80 / R40 (2:1 Redüksiyon)": {
    "en": "R80 / R40 (2:1 Reduction)",
    "tr": "R80 / R40 (2:1 Redüksiyon)"
  },
  "Güneş Dişli (Zs)": {
    "en": "Sun Gear (Zs)",
    "tr": "Güneş Dişli (Zs)"
  },
  "Planet Dişli (Zp)": {
    "en": "Planet Gear (Zp)",
    "tr": "Planet Dişli (Zp)"
  },
  "m=1.5 Zs=18 Zp=18": {
    "en": "m=1.5 Zs=18 Zp=18",
    "tr": "m=1.5 Zs=18 Zp=18"
  },
  "m=2.0 Zs=20 Zp=20": {
    "en": "m=2.0 Zs=20 Zp=20",
    "tr": "m=2.0 Zs=20 Zp=20"
  },
  "m=2.5 Zs=24 Zp=24": {
    "en": "m=2.5 Zs=24 Zp=24",
    "tr": "m=2.5 Zs=24 Zp=24"
  },
  "Zincir Standardı": {
    "en": "Chain Standard",
    "tr": "Zincir Standardı"
  },
  "06B (3/8": {
    "en": "06B (3/8",
    "tr": "06B (3/8"
  },
  "08B (1/2": {
    "en": "08B (1/2",
    "tr": "08B (1/2"
  },
  "10B (5/8": {
    "en": "10B (5/8",
    "tr": "10B (5/8"
  },
  "12B (3/4": {
    "en": "12B (3/4",
    "tr": "12B (3/4"
  },
  "16B (1": {
    "en": "16B (1",
    "tr": "16B (1"
  },
  "Mil Göbek Çapı (mm)": {
    "en": "Hub Bore Diameter (mm)",
    "tr": "Mil Göbek Çapı (mm)"
  },
  "Dış Tepe Çapı (da)": {
    "en": "Outer Tip Diameter (da)",
    "tr": "Dış Tepe Çapı (da)"
  },
  "08B z=17 (d=69.1mm)": {
    "en": "08B z=17 (d=69.1mm)",
    "tr": "08B z=17 (d=69.1mm)"
  },
  "08B z=19 (d=77.2mm)": {
    "en": "08B z=19 (d=77.2mm)",
    "tr": "08B z=19 (d=77.2mm)"
  },
  "08B z=25 (d=101.3mm)": {
    "en": "08B z=25 (d=101.3mm)",
    "tr": "08B z=25 (d=101.3mm)"
  },
  "08B z=38 (d=153.8mm)": {
    "en": "08B z=38 (d=153.8mm)",
    "tr": "08B z=38 (d=153.8mm)"
  },
  "06B z=21 (d=63.9mm)": {
    "en": "06B z=21 (d=63.9mm)",
    "tr": "06B z=21 (d=63.9mm)"
  },
  "10B z=19 (d=96.5mm)": {
    "en": "10B z=19 (d=96.5mm)",
    "tr": "10B z=19 (d=96.5mm)"
  },
  "Sayfa Boyutu": {
    "en": "Page Size",
    "tr": "Sayfa Boyutu"
  },
  "A4 (210x297)": {
    "en": "A4 (210x297)",
    "tr": "A4 (210x297)"
  },
  "A3 (297x420)": {
    "en": "A3 (297x420)",
    "tr": "A3 (297x420)"
  },
  "A2 (420x594)": {
    "en": "A2 (420x594)",
    "tr": "A2 (420x594)"
  },
  "Letter (ANSI A)": {
    "en": "Letter (ANSI A)",
    "tr": "Letter (ANSI A)"
  },
  "Oryantasyon": {
    "en": "Orientation",
    "tr": "Oryantasyon"
  },
  "Yatay (Landscape)": {
    "en": "Landscape",
    "tr": "Yatay (Landscape)"
  },
  "Dikey (Portrait)": {
    "en": "Portrait",
    "tr": "Dikey (Portrait)"
  },
  "Sığdır (Fit to Paper)": {
    "en": "Fit to Paper",
    "tr": "Sığdır (Fit to Paper)"
  },
  "Gerçek Ölçek (1:1)": {
    "en": "Full Scale (1:1)",
    "tr": "Gerçek Ölçek (1:1)"
  },
  "Yarım Ölçek (1:2)": {
    "en": "Half Scale (1:2)",
    "tr": "Yarım Ölçek (1:2)"
  },
  "Mühendislik (1:5)": {
    "en": "Engineering Scale (1:5)",
    "tr": "Mühendislik (1:5)"
  },
  "Plan Ölçeği (1:10)": {
    "en": "Plan Scale (1:10)",
    "tr": "Plan Ölçeği (1:10)"
  },
  "Teknik Antet Ekle": {
    "en": "Add Title Block",
    "tr": "Teknik Antet Ekle"
  },
  "Parça İsmi": {
    "en": "Part Name",
    "tr": "Parça İsmi"
  },
  "Tasarımcı": {
    "en": "Designer",
    "tr": "Tasarımcı"
  },
  "Onaylayan": {
    "en": "Approved By",
    "tr": "Onaylayan"
  },
  "Firma Adı": {
    "en": "Company Name",
    "tr": "Firma Adı"
  },
  "Bağlantı Türü": {
    "en": "Fastener Type",
    "tr": "Bağlantı Türü"
  },
  "🔩 Cıvata (ISO 4014 / DIN 931)": {
    "en": "🔩 Hex Bolt (ISO 4014 / DIN 931)",
    "tr": "🔩 Cıvata (ISO 4014 / DIN 931)"
  },
  "⬡ Altıköşe Somun (ISO 4032)": {
    "en": "⬡ Hex Nut (ISO 4032)",
    "tr": "⬡ Altıköşe Somun (ISO 4032)"
  },
  "Metrik Çap (M)": {
    "en": "Metric Diameter (M)",
    "tr": "Metrik Çap (M)"
  },
  "M3 (Adım 0.5 mm)": {
    "en": "M3 (Pitch 0.5 mm)",
    "tr": "M3 (Adım 0.5 mm)"
  },
  "M4 (Adım 0.7 mm)": {
    "en": "M4 (Pitch 0.7 mm)",
    "tr": "M4 (Adım 0.7 mm)"
  },
  "M5 (Adım 0.8 mm)": {
    "en": "M5 (Pitch 0.8 mm)",
    "tr": "M5 (Adım 0.8 mm)"
  },
  "M6 (Adım 1.0 mm)": {
    "en": "M6 (Pitch 1.0 mm)",
    "tr": "M6 (Adım 1.0 mm)"
  },
  "M8 (Adım 1.25 mm)": {
    "en": "M8 (Pitch 1.25 mm)",
    "tr": "M8 (Adım 1.25 mm)"
  },
  "M10 (Adım 1.5 mm)": {
    "en": "M10 (Pitch 1.5 mm)",
    "tr": "M10 (Adım 1.5 mm)"
  },
  "M12 (Adım 1.75 mm)": {
    "en": "M12 (Pitch 1.75 mm)",
    "tr": "M12 (Adım 1.75 mm)"
  },
  "M16 (Adım 2.0 mm)": {
    "en": "M16 (Pitch 2.0 mm)",
    "tr": "M16 (Adım 2.0 mm)"
  },
  "M20 (Adım 2.5 mm)": {
    "en": "M20 (Pitch 2.5 mm)",
    "tr": "M20 (Adım 2.5 mm)"
  },
  "M24 (Adım 3.0 mm)": {
    "en": "M24 (Pitch 3.0 mm)",
    "tr": "M24 (Adım 3.0 mm)"
  },
  "Gövde Boyu (L)": {
    "en": "Shank Length (L)",
    "tr": "Gövde Boyu (L)"
  },
  "Çizim Görünüşü": {
    "en": "Drawing View",
    "tr": "Çizim Görünüşü"
  },
  "📐 Yan / Profil (ISO 4014)": {
    "en": "📐 Side / Profile (ISO 4014)",
    "tr": "📐 Yan / Profil (ISO 4014)"
  },
  "⬡ Üst / Eksenel (ISO 6410)": {
    "en": "⬡ Top / Axial (ISO 6410)",
    "tr": "⬡ Üst / Eksenel (ISO 6410)"
  },
  "Yerleşim Yönü": {
    "en": "Placement Direction",
    "tr": "Yerleşim Yönü"
  },
  "⬇️ Aşağı (-90°, Standart)": {
    "en": "⬇️ Down (-90°, Standard)",
    "tr": "⬇️ Aşağı (-90°, Standart)"
  },
  "➡️ Sağa (0° Yatay)": {
    "en": "➡️ Right (0° Horizontal)",
    "tr": "➡️ Sağa (0° Yatay)"
  },
  "⬆️ Yukarı (90° Dikey)": {
    "en": "⬆️ Up (90° Vertical)",
    "tr": "⬆️ Yukarı (90° Dikey)"
  },
  "⬅️ Sola (180° Ters)": {
    "en": "⬅️ Left (180° Inverted)",
    "tr": "⬅️ Sola (180° Ters)"
  },
  "Diş Çizim Stili": {
    "en": "Thread Drawing Style",
    "tr": "Diş Çizim Stili"
  },
  "⚙️ Detaylı (Helis & Dişler)": {
    "en": "⚙️ Detailed (Helix & Teeth)",
    "tr": "⚙️ Detaylı (Helis & Dişler)"
  },
  "📐 Şematik (ISO 6410 Resim)": {
    "en": "📐 Schematic (ISO 6410)",
    "tr": "📐 Şematik (ISO 6410 Resim)"
  },
  "Anahtar Ağzı (s)": {
    "en": "Width Across Flats (s)",
    "tr": "Anahtar Ağzı (s)"
  },
  "Baş / Somun Boyu (k/m)": {
    "en": "Head / Nut Height (k/m)",
    "tr": "Baş / Somun Boyu (k/m)"
  },
  "Diş Adımı (P)": {
    "en": "Thread Pitch (P)",
    "tr": "Diş Adımı (P)"
  },
  "Dişdibi Çapı (d1)": {
    "en": "Minor Diameter (d1)",
    "tr": "Dişdibi Çapı (d1)"
  },
  "🔄 Yönü Döndür (90°)": {
    "en": "🔄 Rotate Direction (90°)",
    "tr": "🔄 Yönü Döndür (90°)"
  },
  "M6×25 Cıvata (ISO 4014)": {
    "en": "M6×25 Bolt (ISO 4014)",
    "tr": "M6×25 Cıvata (ISO 4014)"
  },
  "M8×30 Cıvata (ISO 4014)": {
    "en": "M8×30 Bolt (ISO 4014)",
    "tr": "M8×30 Cıvata (ISO 4014)"
  },
  "M10×40 Cıvata (ISO 4014)": {
    "en": "M10×40 Bolt (ISO 4014)",
    "tr": "M10×40 Cıvata (ISO 4014)"
  },
  "M12×50 Cıvata (ISO 4014)": {
    "en": "M12×50 Bolt (ISO 4014)",
    "tr": "M12×50 Cıvata (ISO 4014)"
  },
  "M8 Somun (ISO 4032)": {
    "en": "M8 Nut (ISO 4032)",
    "tr": "M8 Somun (ISO 4032)"
  },
  "M10 Somun (ISO 4032)": {
    "en": "M10 Nut (ISO 4032)",
    "tr": "M10 Somun (ISO 4032)"
  },
  "Profil Seçin": {
    "en": "Select Profile",
    "tr": "Profil Seçin"
  },
  "20×20 (Slot 6, 0.65 kg/m)": {
    "en": "20×20 (Slot 6, 0.65 kg/m)",
    "tr": "20×20 (Slot 6, 0.65 kg/m)"
  },
  "20×40 (Slot 6, 1.10 kg/m)": {
    "en": "20×40 (Slot 6, 1.10 kg/m)",
    "tr": "20×40 (Slot 6, 1.10 kg/m)"
  },
  "20×60 (Slot 6, 1.45 kg/m)": {
    "en": "20×60 (Slot 6, 1.45 kg/m)",
    "tr": "20×60 (Slot 6, 1.45 kg/m)"
  },
  "20×80 (Slot 6, 1.98 kg/m)": {
    "en": "20×80 (Slot 6, 1.98 kg/m)",
    "tr": "20×80 (Slot 6, 1.98 kg/m)"
  },
  "30×30 (Slot 8, 1.05 kg/m)": {
    "en": "30×30 (Slot 8, 1.05 kg/m)",
    "tr": "30×30 (Slot 8, 1.05 kg/m)"
  },
  "30×60 (Slot 8, 1.85 kg/m)": {
    "en": "30×60 (Slot 8, 1.85 kg/m)",
    "tr": "30×60 (Slot 8, 1.85 kg/m)"
  },
  "30×90 (Slot 8, 2.85 kg/m)": {
    "en": "30×90 (Slot 8, 2.85 kg/m)",
    "tr": "30×90 (Slot 8, 2.85 kg/m)"
  },
  "30×120 (Slot 8, 3.98 kg/m)": {
    "en": "30×120 (Slot 8, 3.98 kg/m)",
    "tr": "30×120 (Slot 8, 3.98 kg/m)"
  },
  "30×150 (Slot 8, 4.50 kg/m)": {
    "en": "30×150 (Slot 8, 4.50 kg/m)",
    "tr": "30×150 (Slot 8, 4.50 kg/m)"
  },
  "60×60 (Slot 8 30s, 3.20 kg/m)": {
    "en": "60×60 (Slot 8 30s, 3.20 kg/m)",
    "tr": "60×60 (Slot 8 30s, 3.20 kg/m)"
  },
  "40×40 (Slot 8, 1.75 kg/m)": {
    "en": "40×40 (Slot 8, 1.75 kg/m)",
    "tr": "40×40 (Slot 8, 1.75 kg/m)"
  },
  "40×40 Ağır (Slot 10, 2.10 kg/m)": {
    "en": "40×40 Heavy (Slot 10, 2.10 kg/m)",
    "tr": "40×40 Ağır (Slot 10, 2.10 kg/m)"
  },
  "40×60 (Slot 8, 2.45 kg/m)": {
    "en": "40×60 (Slot 8, 2.45 kg/m)",
    "tr": "40×60 (Slot 8, 2.45 kg/m)"
  },
  "40×80 (Slot 8, 3.25 kg/m)": {
    "en": "40×80 (Slot 8, 3.25 kg/m)",
    "tr": "40×80 (Slot 8, 3.25 kg/m)"
  },
  "40×120 (Slot 8, 4.90 kg/m)": {
    "en": "40×120 (Slot 8, 4.90 kg/m)",
    "tr": "40×120 (Slot 8, 4.90 kg/m)"
  },
  "40×160 (Slot 8, 7.20 kg/m)": {
    "en": "40×160 (Slot 8, 7.20 kg/m)",
    "tr": "40×160 (Slot 8, 7.20 kg/m)"
  },
  "80×80 (Slot 8 40s, 5.80 kg/m)": {
    "en": "80×80 (Slot 8 40s, 5.80 kg/m)",
    "tr": "80×80 (Slot 8 40s, 5.80 kg/m)"
  },
  "45×45 (Slot 10, 2.20 kg/m)": {
    "en": "45×45 (Slot 10, 2.20 kg/m)",
    "tr": "45×45 (Slot 10, 2.20 kg/m)"
  },
  "45×45 Ağır (Slot 10, 2.50 kg/m)": {
    "en": "45×45 Heavy (Slot 10, 2.50 kg/m)",
    "tr": "45×45 Ağır (Slot 10, 2.50 kg/m)"
  },
  "45×60 (Slot 10, 2.80 kg/m)": {
    "en": "45×60 (Slot 10, 2.80 kg/m)",
    "tr": "45×60 (Slot 10, 2.80 kg/m)"
  },
  "45×90 (Slot 10, 4.50 kg/m)": {
    "en": "45×90 (Slot 10, 4.50 kg/m)",
    "tr": "45×90 (Slot 10, 4.50 kg/m)"
  },
  "90×90 (Slot 10 45s, 7.80 kg/m)": {
    "en": "90×90 (Slot 10 45s, 7.80 kg/m)",
    "tr": "90×90 (Slot 10 45s, 7.80 kg/m)"
  },
  "50×50 (Slot 10, 2.95 kg/m)": {
    "en": "50×50 (Slot 10, 2.95 kg/m)",
    "tr": "50×50 (Slot 10, 2.95 kg/m)"
  },
  "50×100 (Slot 10, 4.90 kg/m)": {
    "en": "50×100 (Slot 10, 4.90 kg/m)",
    "tr": "50×100 (Slot 10, 4.90 kg/m)"
  },
  "60×60 (Slot 10, 3.80 kg/m)": {
    "en": "60×60 (Slot 10, 3.80 kg/m)",
    "tr": "60×60 (Slot 10, 3.80 kg/m)"
  },
  "60×120 (Slot 10, 6.80 kg/m)": {
    "en": "60×120 (Slot 10, 6.80 kg/m)",
    "tr": "60×120 (Slot 10, 6.80 kg/m)"
  },
  "80×80 (Slot 10, 5.80 kg/m)": {
    "en": "80×80 (Slot 10, 5.80 kg/m)",
    "tr": "80×80 (Slot 10, 5.80 kg/m)"
  },
  "80×160 (Slot 10, 12.60 kg/m)": {
    "en": "80×160 (Slot 10, 12.60 kg/m)",
    "tr": "80×160 (Slot 10, 12.60 kg/m)"
  },
  "Alaşım Standardı": {
    "en": "Alloy Standard",
    "tr": "Alaşım Standardı"
  },
  "🎯 Orijine Yerleştir (0,0)": {
    "en": "🎯 Place at Origin (0,0)",
    "tr": "🎯 Orijine Yerleştir (0,0)"
  },
  "40×40 Standart (Kanal 8)": {
    "en": "40×40 Standard (Slot 8)",
    "tr": "40×40 Standart (Kanal 8)"
  },
  "40×80 Dikdörtgen (Kanal 8)": {
    "en": "40×80 Rectangular (Slot 8)",
    "tr": "40×80 Dikdörtgen (Kanal 8)"
  },
  "20×20 Kompakt (Kanal 6)": {
    "en": "20×20 Compact (Slot 6)",
    "tr": "20×20 Kompakt (Kanal 6)"
  },
  "20×40 Dikdörtgen (Kanal 6)": {
    "en": "20×40 Rectangular (Slot 6)",
    "tr": "20×40 Dikdörtgen (Kanal 6)"
  },
  "30×30 Standart (Kanal 8)": {
    "en": "30×30 Standard (Slot 8)",
    "tr": "30×30 Standart (Kanal 8)"
  },
  "30×60 Dikdörtgen (Kanal 8)": {
    "en": "30×60 Rectangular (Slot 8)",
    "tr": "30×60 Dikdörtgen (Kanal 8)"
  },
  "45×45 Standart (Kanal 10)": {
    "en": "45×45 Standard (Slot 10)",
    "tr": "45×45 Standart (Kanal 10)"
  },
  "45×90 Ağır Dikdörtgen": {
    "en": "45×90 Heavy Rectangular",
    "tr": "45×90 Ağır Dikdörtgen"
  },
  "80×80 Ağır Şasi (Kanal 10)": {
    "en": "80×80 Heavy Chassis (Slot 10)",
    "tr": "80×80 Ağır Şasi (Kanal 10)"
  },
  "80×160 Dev Kolon (Kanal 10)": {
    "en": "80×160 Giant Column (Slot 10)",
    "tr": "80×160 Dev Kolon (Kanal 10)"
  },
  "📋 Analiz Raporunu Kopyala": {
    "en": "📋 Copy Analysis Report",
    "tr": "📋 Analiz Raporunu Kopyala"
  },
  "📥 CSV Olarak İndir": {
    "en": "📥 Download as CSV",
    "tr": "📥 CSV Olarak İndir"
  },
  "🔍 Seçili Profili Analiz Et": {
    "en": "🔍 Analyze Selected Profile",
    "tr": "🔍 Seçili Profili Analiz Et"
  },
  "📊 Tüm Çizimi Analiz Et": {
    "en": "📊 Analyze All Profiles",
    "tr": "📊 Tüm Çizimi Analiz Et"
  },
  "Apply": {
    "en": "Apply",
    "tr": "Uygula"
  },
  "Shape": {
    "en": "Shape",
    "tr": "Şekil"
  },
  "Pivot": {
    "en": "Pivot",
    "tr": "Pivot"
  },
  "Angle/Guide": {
    "en": "Angle/Guide",
    "tr": "Açı/Kılavuz"
  },
  "Preview": {
    "en": "Preview",
    "tr": "Önizleme"
  },
  "Şekil": {
    "en": "Shape",
    "tr": "Şekil"
  },
  "Açı/Kılavuz": {
    "en": "Angle/Guide",
    "tr": "Açı/Kılavuz"
  },
  "Önizleme": {
    "en": "Preview",
    "tr": "Önizleme"
  },
  "Enter text...": {
    "en": "Enter text...",
    "tr": "Metin girin..."
  },
  "Metin girin...": {
    "en": "Enter text...",
    "tr": "Metin girin..."
  },
  "Noktalara tıklayın, Enter veya Çift Tık ile bitirin": {
    "en": "Click points, finish with Enter or Double-Click",
    "tr": "Noktalara tıklayın, Enter veya Çift Tık ile bitirin"
  },
  "Click points, finish with Enter or Double-Click": {
    "en": "Click points, finish with Enter or Double-Click",
    "tr": "Noktalara tıklayın, Enter veya Çift Tık ile bitirin"
  },
  "Kapalı profile tıklayın veya sağ paneldeki kesit özelliklerini inceleyin.": {
    "en": "Click on closed profile or inspect section properties in right panel.",
    "tr": "Kapalı profile tıklayın veya sağ paneldeki kesit özelliklerini inceleyin."
  },
  "Click on closed profile or inspect section properties in right panel.": {
    "en": "Click on closed profile or inspect section properties in right panel.",
    "tr": "Kapalı profile tıklayın veya sağ paneldeki kesit özelliklerini inceleyin."
  },
  "Seçili nesneler bir grupta değil.": {
    "en": "Selected entities are not in a group.",
    "tr": "Seçili nesneler bir grupta değil."
  },
  "Selected entities are not in a group.": {
    "en": "Selected entities are not in a group.",
    "tr": "Seçili nesneler bir grupta değil."
  },
  "Patlatılacak nesne bulunamadı.": {
    "en": "No objects found to explode.",
    "tr": "Patlatılacak nesne bulunamadı."
  },
  "No objects found to explode.": {
    "en": "No objects found to explode.",
    "tr": "Patlatılacak nesne bulunamadı."
  },
  "Kopyalanacak geçerli bir kapalı profil bulunamadı.": {
    "en": "No valid closed profile found to copy.",
    "tr": "Kopyalanacak geçerli bir kapalı profil bulunamadı."
  },
  "No valid closed profile found to copy.": {
    "en": "No valid closed profile found to copy.",
    "tr": "Kopyalanacak geçerli bir kapalı profil bulunamadı."
  },
  "✅ Kesit analiz raporu panoya kopyalandı.": {
    "en": "✅ Section analysis report copied to clipboard.",
    "tr": "✅ Kesit analiz raporu panoya kopyalandı."
  },
  "✅ Section analysis report copied to clipboard.": {
    "en": "✅ Section analysis report copied to clipboard.",
    "tr": "✅ Kesit analiz raporu panoya kopyalandı."
  },
  "✅ CSV kesit raporu indirildi.": {
    "en": "✅ CSV section report downloaded.",
    "tr": "✅ CSV kesit raporu indirildi."
  },
  "✅ CSV section report downloaded.": {
    "en": "✅ CSV section report downloaded.",
    "tr": "✅ CSV kesit raporu indirildi."
  },
  "Yeni Parça": {
    "en": "New Part",
    "tr": "Yeni Parça"
  },
  "New Part": {
    "en": "New Part",
    "tr": "Yeni Parça"
  },
  "Başlangıç / Bitiş": {
    "en": "Başlangıç / Bitiş",
    "tr": "Başlangıç / Bitiş"
  },
  "Start / End": {
    "en": "Start / End",
    "tr": "Start / End"
  },
  "Ölçüler": {
    "en": "Ölçüler",
    "tr": "Ölçüler"
  },
  "Dimensions": {
    "en": "Dimensions",
    "tr": "Dimensions"
  },
  "Ayarlar": {
    "en": "Ayarlar",
    "tr": "Ayarlar"
  },
  "Settings": {
    "en": "Settings",
    "tr": "Settings"
  }
};

export function trCad(text: string | undefined, lang: Language | string | undefined): string {
  if (!text) return '';
  const item = CAD_I18N_MAP[text];
  if (item) {
    return t12(lang, item.en, item.tr);
  }
  return t12(lang, text);
}
