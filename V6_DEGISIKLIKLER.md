# AluCalc OS v6 — 1. Aşama: Tema + Ortak Bileşenler + AI Altyapısı

Bu klasör, `alucalculator` projesinin değiştirilmiş kopyasıdır. Orijinal klasöre dokunulmadı.

## Kurulum (bir kez)

1. `alucalculator-v6` klasörü, `alucalculator` klasörünün yanında (Belgeler) olmalı. Teslimatta zaten oraya yazıldı.
2. `KURULUM_V6.bat` dosyasına çift tıkla. Betik şunları yapar:
   - Orijinal projede olup v6'da olmayan her şeyi kopyalar: `.git` geçmişi, referans PDF'ler, görseller, `android/`, `.env.local` vb.
   - v6'daki yeni veya değişmiş dosyaların **üzerine yazmaz**. Orijinal klasöre hiç dokunmaz.
   - `npm install` çalıştırır ve yeni testleri koşturur.
3. `npm run dev` ile siteyi aç.
4. **Değişiklikleri incelemek için:** v6 klasörünü VS Code'da aç. `.git` kopyalandığı için Kaynak Denetimi (Source Control) panelinde her değişen dosya, eski hâliyle yan yana görünür.
5. Beğenirsen v6'dan normal şekilde commit + push yapıp yayınlayabilirsin.

---

## 1. Çoklu tema sistemi (varsayılan koyu)

| Tema | Tür | Açıklama |
|---|---|---|
| **Grafit** (varsayılan) | Koyu | Nötr grafit, sakin cyan vurgu |
| Gece Mavisi | Koyu | Lacivert tonlar, mavi vurgu |
| OLED Siyah | Koyu | Saf siyah, klasik neon cyan |
| Açık | Açık | Temiz beyaz ofis teması |
| Teknik Kağıt | Açık | Sıcak kağıt zemin, mavi mürekkep |
| Sistem | — | Cihazın açık/koyu ayarını takip eder |

- **Nereden seçilir:** üst bardaki tema düğmesi, Ayarlar modülü, şerit (ribbon) menüsü, mobil ayarlar ve mobil menü.
- **Titreme yok:** Seçilen tema sayfa çizilmeden önce uygulanır.
- **Mevcut tüm sayfalar açık temada da çalışır.** Sayfaları tek tek yeniden yazmak yerine Tailwind paleti tema değişkenlerine bağlandı (`text-white`, `bg-white/5`, `slate-*`, `cyan-*` …). 80'den fazla modül otomatik olarak uyum sağlıyor.
- Eski `osStore.setTheme('dark' | 'light' | 'sea' …)` çağrıları çalışmaya devam ediyor; yeni sisteme yönlendiriliyor.
- Yazdırmada her temada siyah yazı / beyaz kâğıt kullanılır.

## 2. Görsel tutarlılık (tüm sayfalarda tek dil)

İki otomatik dönüşüm betiği çalıştırıldı (tekrar çalıştırılabilir, `scripts/theme/`):

- **`codemod_colors.py`:** 299 dosyada yaklaşık 3.800 sabit renk (`bg-[#0a0e14]`, `text-[#00e5ff]` …) tema değişkenlerine çevrildi.
- **`codemod_calm.py`:** 215 dosyada:
  - 388 cam efekti (`backdrop-blur`) kaldırıldı.
  - 77 aşırı yuvarlak köşe (32–48 px) sadeleştirildi.
  - 87 "italik + çok kalın" başlık sakinleştirildi.
- Butonlar, girişler ve kartlar (`btn-primary`, `input-tech`, `card-tech`, `hud-*`, `work-*`) neon gradyan/parlama olmadan temaya bağlandı.
- Sayfa arka planındaki ızgara deseni kaldırıldı. İstenen yüzeylerde `.bg-drafting-grid` sınıfıyla kullanılabilir.
- Odak halkası (klavye erişilebilirliği) ve "hareketi azalt" tercihi tüm sitede geçerli.

## 3. Yeni üst menü (NavigationHeader)

- Kalabalık 10'dan fazla düğme yerine: Çözücüler · 3D CAD · 2D CAD · Flow · Akademi · **Daha fazla** menüsü.
- Ortada tek arama kutusu (⌘K).
- Sağda şunlar var:
  - **AeGiS** AI düğmesi; bağlantı durumunu yeşil/gri noktayla gösterir.
  - İçe aktar ve geri bildirim.
  - Tema seçici.
  - Görünüm ayarları: yazı boyutu, ondalık hassasiyet, AI bağlantısı.
  - Dil seçici.
- Mobil menü: büyük dokunma alanları ve tema seçimi.

## 4. Yazı tipleri (gerçek hata düzeltmesi)

- Önceden Inter/JetBrains Mono yalnızca `latin` alt kümesiyle yükleniyordu. Bu yüzden **ş, ğ, ı, İ gibi Türkçe harfler yedek fontla görünüyordu.**
- Fontlar artık projeye gömülü (`@fontsource-variable/*`). Türkçe için latin-ext, Rusça için kiril desteği var.
- Derleme sırasında Google Fonts'a bağlanma gereği kalmadı.

## 5. AI altyapısı — sunucusuz, sana maliyetsiz

**Bulgu:** Site `output: export` ile statik yayınlandığı için `/api/ai/copilot`, `/api/ai-agent` gibi rotalar canlı sitede hiç çalışmıyordu. AeGiS her zaman yerel yedek motora düşüyordu.

**Yeni yapı:** Tüm AI istekleri kullanıcının tarayıcısından doğrudan sağlayıcıya gider. Sitenin sunucusu anahtarı hiç görmez.

| Sağlayıcı | Kullanıcı ne yapar? |
|---|---|
| **Puter (varsayılan)** | Anahtar yok. Ücretsiz Puter hesabıyla açılır pencereden giriş yapar. Kullanım kendi hesabından düşer. |
| **OpenRouter** | "OpenRouter ile giriş yap" düğmesi (OAuth, anahtar kopyalamak yok) veya anahtar yapıştırma. Yüzlerce model. |
| Google Gemini | AI Studio anahtarı (ücretsiz kota var) |
| OpenAI | API anahtarı |
| Anthropic Claude | API anahtarı |
| Ollama | Kendi bilgisayarındaki yerel model, tamamen ücretsiz ve çevrimdışı |

- **Ayar sayfası:** `/ai-connect`. Ayrıca Ayarlar modülünün içinde ve üst bardaki görünüm menüsünde de var.
- **Anahtar gizliliği:** Anahtar yalnızca o tarayıcıda saklanır. "Hatırlama" kapatılırsa sekme kapanınca silinir.
- **Model listesi:** Sağlayıcıdan canlı çekilir, böylece eskimez.
- **AeGiS copilot:**
  - Yanıtlar yazılırken akış halinde görünür.
  - 86 aracın tamamını tanır ve doğru sayfaya yönlendirir.
  - Formülleri birimleriyle yazar ve hangi standarda dayandığını belirtir.
  - Bağlantı yoksa kullanıcıyı `/ai-connect`'e yönlendirir. Bağlantı hatasında eski yerel motor yedek olarak devreye girer.
- **Geliştirici kancaları:**
  - `useAIChat()`: herhangi bir modüle sohbet eklemek için.
  - `registerPageContext()`: hesaplayıcı, girdilerini ve sonuçlarını AeGiS'e verir. Böylece "bu sonucu yorumla" denebilir.

## 6. Sürüm ve önbellek

- Uygulama sürümü **6.0.0** oldu: `package.json` ve service worker `CACHE_VERSION`.
- Böylece siteyi daha önce ziyaret etmiş kullanıcıların tarayıcısındaki eski 5.2.3 önbelleği otomatik temizlenir ve yeni tema hemen görünür.

## 7. Küçük UX düzeltmeleri

- "Oyun turu" artık her sayfada kendiliğinden açılıp aracı kapatmıyor. Yalnızca ana sayfada, masaüstünde ve bir kez gösteriliyor. Diğer sayfalarda **Daha fazla → Sayfa turu** ile açılıyor.

## 8. Antigravity için kurallar güncellendi

`AGENTS.md`, `GEMINI.md` ve `.agents/rules/design-system-instrument.md` yeni tema ve AI kurallarını içeriyor:

- Sabit hex renk yasak.
- Cam efekti yasak.
- `<html>` üzerinde light/dark sınıfıyla oynamak yasak.
- Sunucu AI rotası ve sabit API anahtarı yasak.
- Her UI değişikliği hem koyu hem açık temada kontrol edilmeli.

Böylece Antigravity sonraki çalışmalarda temayı tekrar bozmaz.

## Doğrulama

- **Üretim derlemesi (`next build`):** başarılı, **385 statik sayfa** üretildi. `/ai-connect/` dahil.
- **`tsc --noEmit`:** tüm projede 0 hata.
- **`vitest`:** 1.301 testin 1.299'u geçti.
  - Kalan 2 hata orijinal projede de birebir aynı (flow katalog sayısı: 102 bekleniyor). Bu değişikliklerle ilgisi yok.
- **Yeni testler** (`src/tests/theme-and-ai.test.ts`, 14 test), şunları kontrol ediyor:
  - her temada eksiksiz token seti,
  - ön boyama betiği,
  - palet eşlemesi,
  - copilot JSON ayrıştırma (dış URL'ye yönlendirme engelli),
  - OpenAI/OpenRouter ve Anthropic akışı,
  - hata mesajları.
- **Gerçek tarayıcı testi** (derlenmiş site üzerinde): üst bardaki AeGiS düğmesi asistanı açıyor. AI bağlı değilken soru sorulunca kullanıcı açıklamayla `/ai-connect`'e yönlendiriliyor.
- **Ekran görüntüsüyle kontrol edildi:**
  - Sayfalar: ana sayfa, çözücü kataloğu, 3-faz güç, cıvata torku, 3D stüdyo, akademi, AI bağlantı sayfası.
  - Temalar: Grafit, Gece Mavisi, OLED, Açık, Kağıt.
  - Genişlikler: masaüstü (1440 px) ve telefon (390 px).
- **Doğrulanamayan:** Puter ve OpenRouter girişi ile gerçek model yanıtı. Test ortamım bu sitelere erişemiyor. Canlıda bir kez denemen gerekiyor: `/ai-connect` → "Puter hesabıyla giriş yap" → "Bağlantıyı test et".
- **Not:** Derleme sırasında `/[module]` rotası çok bellek kullanıyor. 8 GB'lık test makinesinde ilk denemede bellek yetmedi, `NODE_OPTIONS=--max-old-space-size=3200` ile geçti. Senin bilgisayarında sorun çıkarsa aynı ayarı kullan.

## Değişen dosyalar

Tam liste: `V6_DOSYA_LISTESI.txt`

---

## Sonraki aşamalar (öneri)

1. **Hesaplayıcı şablonu:** 80'den fazla modül için ortak "girdi paneli + sonuç kartları + güvenlik katsayısı + rapor" iskeleti. Modüller sırayla bu iskelete taşınır. Her modüle şunlar eklenir:
   - kaydet/karşılaştır,
   - birim sistemi (SI/İmparatorluk),
   - PDF rapor.
2. **AI özellikleri:**
   - Her hesaplayıcıda "Sonucu yorumla / Neden güvensiz? / Optimize et" düğmeleri (`registerPageContext` hazır).
   - Doğal dilde hesap: "M12 8.8 cıvata 85 Nm yeterli mi?" yazınca doğru modül açılır ve alanlar dolar.
   - Teknik resim veya fotoğraftan ölçü okuma (görsel destekli modellerle).
3. **3D stüdyo:**
   - Araç çubuğunu sadeleştirme (şu an 40'tan fazla düğme var).
   - 3D sahne arka planını temaya bağlama.
4. **Akademi:** AI ile kişiselleştirilmiş soru üretimi ve yanlış cevaba açıklama.
5. **Performans:** `/[module]` rotası derlemede çok fazla bellek kullanıyor. Modül başına ayrı parçalara bölünmeli.
