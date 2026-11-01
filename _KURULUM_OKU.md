# Bu paket nedir?

AluCalc OS reposu (github.com/Alucardpaps/alucalculator) ve canlı site (alucalculator.com) incelenerek, Antigravity için hazırlanmış tam bir ajan/kural/skill/persona seti. Google'ın güncel Antigravity dokümantasyonundaki (antigravity.google/docs) resmi format ve klasör konumları esas alınmıştır.

## Nasıl kurulur

1. Bu paketin içindeki `AGENTS.md` dosyasını ve `.agents/` klasörünü **repo kök dizinine** kopyala (`alucalculator/AGENTS.md`, `alucalculator/.agents/...`).
2. Mevcut `.agent/` (tekil) klasörünü SİLME — Antigravity geriye dönük uyumluluk için hâlâ okuyor, ama artık asıl kaynak `.agents/` (çoğul). İçindeki 7 skill zaten yeni konuma taşınıp `name:` alanı eksikliği düzeltilerek kopyalandı; birebir aynı mühendislik içeriği korundu.
3. Antigravity IDE içinde Customizations panelinden (Rules / Skills) yeni dosyaların göründüğünü doğrula. Rule dosyalarındaki "Suggested activation" satırına göre her kuralın aktivasyon modunu (Always On / Glob / Model Decision) panelden seç — bu bilgi şu an sadece dosya içinde not olarak duruyor, Antigravity'nin kendi UI'ından ayrıca ayarlanması gerekebilir.
4. `.agents/agents/` altındaki persona dosyaları (agent.md) şu an Google'ın kendi ekibine göre Antigravity IDE'de değil, Antigravity CLI/AGY tarafında native destekleniyor. IDE hâlâ bunları native dispatch etmiyor olabilir — yine de commit etmeye değer: hem CLI/agy kullanınca çalışır, hem de IDE sohbetinde "@calculator-engineer/agent.md dosyasını oku ve ona göre davran" diyerek manuel referans verilebilir.

## Öncelik sırasına göre gerçek bulgular (dosyaları yazarken kullanıldı)

1. **[GÜVENLİK — ACİL]** `android/alucalc-release.keystore` ve `android-wear/alucalc-release.keystore` public repoya commit edilmiş, gerçek imzalama anahtarı (git geçmişinde de var). Detay ve düzeltme adımları: `.agents/rules/security-hardening.md`.
2. Rakam tutarsızlığı: ana sayfa "91 modül" diyor, `calculators.json` 44 kayıt, `calculatorHubData.ts` ~48, `README.md` "250+", `ALUCALC_AGENT_PLAN.md` "100+". Detay: `.agents/skills/content-integrity-audit/`.
3. `DEPLOYMENT_GUIDE.md` Vercel/Supabase anlatıyor ama gerçek CI/CD (`.github/workflows/deploy.yml`) Hostinger'a FTP ile basıyor — doküman güncel değil.
4. `CONTRIBUTING.md` ile `MODULE_AUTHOR_GUIDE.md` iki farklı modül mimarisi tarif ediyor (biri `src/components/calculators/`, diğeri `src/modules/` + UDA/ModuleRegistry) — birbirine referans vermiyorlar. Detay: `.agents/rules/module-architecture.md`.
5. `_zip_extracted/` (~106MB), `_live_extract/` (~3MB), `deploy-out.zip` (~56MB), `reference_archive/faculty-resources/` (~147MB) hepsi git'e commit edilmiş durumda, repo'yu şişiriyor. Detay: `.agents/skills/repo-hygiene-cleanup/`.
6. `INTEGRATION_REPORT.md`'ye göre `feaWorker.ts` şu an mock (gerçek FEA değil) ve `ConstraintSolver.ts` iskelet halinde — pazarlama/ürün metninde "FEA simulation kernel" gibi ifadeler varsa gerçek duruma göre gözden geçirilmeli.
7. Önceki bir Antigravity kapanış raporunun LMS auth ve 3D workspace'i gerçekten test etmeden "tamam" dediği not edilmişti — bunu kalıcı olarak engellemek için `.agents/skills/qa-verification-protocol/` ve `qa-verifier` ajanı eklendi (repodaki `.mcp.json`'da zaten kurulu olan Playwright MCP'yi kullanıyor).

## Klasör haritası

```
AGENTS.md                          — kök: her ajanın önce okuyacağı özet + index
.agents/rules/                     — her zaman (veya glob/karar bazlı) uygulanan kısıtlar (6 dosya)
.agents/skills/                    — ihtiyaç anında çağrılan prosedürler (13 dosya: 7'si mevcut .agent/skills'ten taşındı+düzeltildi, 6'sı yeni)
.agents/agents/                    — özel persona tanımları (4 dosya)
.agents/workflows/                 — /new-calculator ve /site-audit slash-komutları (2 dosya)
```
