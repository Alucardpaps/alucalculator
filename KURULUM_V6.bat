@echo off
chcp 65001 >nul
setlocal
title AluCalc OS v6 kurulum

rem Bu dosya alucalculator-v6 klasorunun icinde calisir.
rem Orijinal "alucalculator" klasorune DOKUNMAZ; sadece oradan, v6'da olmayan dosyalari kopyalar
rem (.git gecmisi dahil - boylece VS Code'da tum degisiklikleri gorebilirsin).

set "SRC=%~dp0..\alucalculator"
set "DST=%~dp0"

echo.
echo  AluCalc OS v6 kurulumu
echo  ----------------------
if not exist "%SRC%\package.json" (
  echo  HATA: Orijinal proje bulunamadi: %SRC%
  echo  Bu klasoru "alucalculator" klasorunun yanina koyun.
  pause
  exit /b 1
)

echo  [1/3] Orijinal projeden eksik dosyalar kopyalaniyor...
echo        (v6'daki yeni/degisen dosyalarin uzerine yazilmaz)
robocopy "%SRC%" "%DST%." /E /XC /XN /XO /XD ".next" "out" "node_modules" /XF "KURULUM_V6.bat" /NFL /NDL /NJH /NJS /NP
if %ERRORLEVEL% GEQ 8 (
  echo  HATA: Kopyalama basarisiz oldu.
  pause
  exit /b 1
)

echo  [2/3] Bagimliliklar kuruluyor (npm install)...
call npm install --legacy-peer-deps
if errorlevel 1 (
  echo  HATA: npm install basarisiz oldu.
  pause
  exit /b 1
)

echo  [3/3] Testler calistiriliyor...
call npx vitest run src/tests/theme-and-ai.test.ts

echo.
echo  Hazir. Gelistirme sunucusu icin:  npm run dev
echo  Uretim derlemesi icin:            npm run build
echo.
pause
