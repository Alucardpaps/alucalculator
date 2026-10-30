@echo off
chcp 65001 >nul
title AluCalc OS v6 - kaynak paketi
rem ---------------------------------------------------------------------------
rem Claude'un bulut calisma alanina proje kaynagini aktarmak icin 3 parca halinde
rem paketler (Belgeler klasorune):
rem   alucalc-v6-src.tgz     -> src klasoru
rem   alucalc-v6-public.tgz  -> public klasoru (hazir APK/AAB'ler haric)
rem   alucalc-v6-diger.tgz   -> geri kalan kaynak ve ayar dosyalari
rem node_modules, .next, out, .git, zip/7z/tgz dosyalari, ekran goruntusu
rem klasorleri, android derlemeleri ve .env.local (gizli anahtarlar) DAHIL EDILMEZ.
rem Projede hicbir dosyayi degistirmez. Paketler isiniz bitince silinebilir.
rem ---------------------------------------------------------------------------
cd /d "%~dp0"
set "D=%~dp0.."
for %%F in (alucalc-v6-kaynak.tgz alucalc-v6-src.tgz alucalc-v6-public.tgz alucalc-v6-diger.tgz alucalc-v6-kaynak.TAMAM.txt alucalc-v6-kaynak.HATA.txt) do if exist "%D%\%%F" del /q "%D%\%%F"
echo.
echo  Kaynak paketleniyor, lutfen bekleyin...
tar -czf "%D%\alucalc-v6-src.tgz" src
if errorlevel 1 goto :fail
tar -czf "%D%\alucalc-v6-public.tgz" --exclude=public/app/*.apk --exclude=public/app/*.aab --exclude=*.zip public
if errorlevel 1 goto :fail
tar -czf "%D%\alucalc-v6-diger.tgz" ^
  --exclude=./src --exclude=./public ^
  --exclude=node_modules --exclude=./.next --exclude=./out --exclude=./.git ^
  --exclude=.env.local --exclude=*.zip --exclude=*.7z --exclude=*.tgz --exclude=*.png ^
  --exclude=./screenshots --exclude=./site_screenshots --exclude=./alucalc_audit_bundle ^
  --exclude=./.tmp_chrome_audit --exclude=./.tmp_chrome_screens --exclude=./graphify-out ^
  --exclude=./android --exclude=./android-wear --exclude=./scratch --exclude=./reference_archive ^
  --exclude=tsconfig.tsbuildinfo --exclude=./extracted_pdf_streams.txt --exclude=./derleme.log ^
  .
if errorlevel 1 goto :fail
> "%D%\alucalc-v6-kaynak.TAMAM.txt" echo ok
echo  Tamam.
timeout /t 4 >nul
exit /b 0
:fail
> "%D%\alucalc-v6-kaynak.HATA.txt" echo hata
echo  HATA: paketleme basarisiz oldu.
timeout /t 15 >nul
exit /b 1
