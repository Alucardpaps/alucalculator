@echo off
chcp 65001 >nul
setlocal
title AluCalc OS v6 - Hostinger icin derleme
cd /d "%~dp0"
rem ---------------------------------------------------------------------------
rem Siteyi Hostinger'a yuklenecek hale getirir:
rem   1) npm run build  ->  out\ klasoru (statik site)
rem   2) out\ icerigini tek zip'e paketler: ..\alucalc-v6-site.zip
rem Android (TWA) derlemesi atlanir (CI modu); hazir APK'lar out\app'e kopyalanir.
rem Tum cikti derleme.log dosyasina da yazilir.
rem ---------------------------------------------------------------------------
set "ZIP=%~dp0..\alucalc-v6-site.zip"
set "CI=true"
if exist "derleme.TAMAM.txt" del /q "derleme.TAMAM.txt"
if exist "derleme.HATA.txt" del /q "derleme.HATA.txt"

if not exist "node_modules\next\package.json" (
  echo.
  echo  Bagimliliklar kuruluyor ^(npm install^)...
  call npm install --legacy-peer-deps
  if errorlevel 1 goto :fail
)

if exist "out" rmdir /s /q "out"
echo.
echo  ==========================================================
echo   Derleniyor... 5-15 dakika surebilir, pencereyi kapatmayin.
echo  ==========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "cmd /c 'npm run build 2>&1' | Tee-Object -FilePath 'derleme.log'; exit $LASTEXITCODE"

if not exist "out\index.html" (
  echo.
  echo  Iki asamali derleme out klasorunu uretmedi; tek asamali derleme deneniyor...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "cmd /c 'node --max-old-space-size=8192 node_modules\next\dist\bin\next build --webpack 2>&1' | Tee-Object -FilePath 'derleme.log' -Append; exit $LASTEXITCODE"
  if exist "out\index.html" (
    call npx next-sitemap
    call node scripts\build_app.js
  )
)
if not exist "out\index.html" goto :fail

echo.
echo  Site paketleniyor: %ZIP%
if exist "%ZIP%" del /q "%ZIP%"
tar -a -c -f "%ZIP%" -C out .
> "derleme.TAMAM.txt" echo ok
echo.
echo  ==========================================================
echo   TAMAM. Site hazir:  %~dp0out
echo   Tek dosya:          %ZIP%
echo.
echo   Hostinger'a yukleme:
echo    - hPanel ^> Dosya Yoneticisi ^> public_html: zip'i yukleyip "Ayikla" deyin
echo      ^(dosyalar dogrudan public_html icine cikar^), veya
echo    - FTP ile out klasorunun ICINDEKILERI public_html'e yukleyin.
echo   .htaccess dosyasi da yuklenmeli ^(gizli dosya^).
echo  ==========================================================
echo.
pause
exit /b 0

:fail
> "derleme.HATA.txt" echo hata
echo.
echo  HATA: derleme tamamlanamadi. Ayrintilar: %~dp0derleme.log
echo.
pause
exit /b 1
