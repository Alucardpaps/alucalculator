@echo off
chcp 65001 >nul
setlocal
title AluCalc OS v6 - Gelistirme sunucusu
cd /d "%~dp0"

rem Ilk calistirmada: orijinal projeden eksik dosyalari kopyalar (v6'daki dosyalarin
rem uzerine YAZMAZ), npm install yapar. Sonra gelistirme sunucusunu baslatir.

if not exist "node_modules\next\package.json" (
  echo.
  echo  [1/2] Ilk kurulum: orijinal projeden eksik dosyalar kopyalaniyor...
  if exist "%~dp0..\alucalculator\package.json" (
    robocopy "%~dp0..\alucalculator" "%~dp0." /E /XC /XN /XO /XD ".next" "out" "node_modules" /XF "KURULUM_V6.bat" "GELISTIRME_BASLAT.bat" /NFL /NDL /NJH /NJS /NP
  )
  echo  [2/2] Bagimliliklar kuruluyor - birkac dakika surebilir...
  call npm install --legacy-peer-deps
  if errorlevel 1 (
    echo.
    echo  HATA: npm install basarisiz oldu.
    pause
    exit /b 1
  )
)

echo.
echo  ==========================================================
echo   AluCalc OS v6 gelistirme sunucusu baslatiliyor...
echo   Adres asagida "Local:" satirinda yazar (genelde http://localhost:3000)
echo   Kapatmak icin bu pencereyi kapatin.
echo  ==========================================================
echo.
call npm run dev
pause
