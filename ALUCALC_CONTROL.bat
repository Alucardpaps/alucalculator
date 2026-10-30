@echo off
SETLOCAL EnableDelayedExpansion
TITLE AluCalc OS v5.2 - Control Center
COLOR 0B

:: Her zaman guncel ana proje dizinine gec
cd /d "C:\Users\apo_q\OneDrive\Documents\alucalculator"

:MENU
cls
echo =====================================================================
echo.
echo    db       db      db    db  .o88b.  .d8b.  db       .o88b. 
echo    88       88      88    88 d8P  Y8 d8' `8b 88      d8P  Y8 
echo    88       88      88    88 8P      88ooo88 88      8P      
echo    88       88      88    88 8b      88~~~88 88      8b      
echo    88booo.  88booo. `8b  d8' Y8b  d8 88   88 88booo. Y8b  d8 
echo    Y88888P  Y88888P  `Y88P'   `Y88P' YP   YP Y88888P  `Y88P' 
echo.
echo =====================================================================
echo           ALUCALC OS CONTROL CENTER v5.2 - LIVE PROD
echo    Root Directory: C:\Users\apo_q\OneDrive\Documents\alucalculator
echo =====================================================================
echo.
echo    [1] START DEVELOPMENT SERVER  (next dev -> localhost:3000)
echo    [2] BUILD FOR PRODUCTION      (next build -> ./out/)
echo    [3] CLEAN NEXT.JS CACHE       (del .next, out ^& rebuild)
echo    [4] RUN CODE DIAGNOSTICS      (eslint + tsc check)
echo    [5] RUN TEST SUITE            (vitest unit tests)
echo    [6] DEPLOY TO HOSTINGER       (powershell deploy -> FTP)
echo    [7] INSTALL/UPDATE PACKAGES   (npm install)
echo    [8] EXIT
echo.
echo =====================================================================
set /p choice="Enter option (1-8): "

if "%choice%"=="1" goto DEV
if "%choice%"=="2" goto BUILD
if "%choice%"=="3" goto CLEAN
if "%choice%"=="4" goto DIAG
if "%choice%"=="5" goto TEST
if "%choice%"=="6" goto DEPLOY
if "%choice%"=="7" goto INSTALL
if "%choice%"=="8" exit

echo.
echo [!] Invalid option. Press any key to try again...
pause >nul
goto MENU

:DEV
cls
cd /d "C:\Users\apo_q\OneDrive\Documents\alucalculator"
echo =====================================================================
echo [DEV] Starting Development Server at http://localhost:3000 ...
echo =====================================================================
call npm run dev
echo.
echo Server stopped. Press any key to return to menu...
pause >nul
goto MENU

:BUILD
cls
cd /d "C:\Users\apo_q\OneDrive\Documents\alucalculator"
echo =====================================================================
echo [BUILD] Building Production Bundle to ./out/ ...
echo =====================================================================
call npm run build
echo.
echo Build complete. Files exported to C:\Users\apo_q\OneDrive\Documents\alucalculator\out\
echo Press any key to return to menu...
pause >nul
goto MENU

:CLEAN
cls
cd /d "C:\Users\apo_q\OneDrive\Documents\alucalculator"
echo =====================================================================
echo [CLEAN] Clearing Next.js Caches (.next ^& out) ^& Rebuilding Fresh...
echo =====================================================================
if exist .next (
    echo Deleting .next cache folder...
    rmdir /s /q .next
)
if exist out (
    echo Deleting out folder...
    rmdir /s /q out
)
echo Cache cleared. Rebuilding project from scratch...
echo.
call npm run build
echo.
echo Clean build completed. Press any key to return to menu...
pause >nul
goto MENU

:DIAG
cls
cd /d "C:\Users\apo_q\OneDrive\Documents\alucalculator"
echo =====================================================================
echo [DIAG] Running ESLint ^& TypeScript Compiler Check...
echo =====================================================================
echo Running: npm run lint
call npm run lint
echo.
echo Running: tsc --noEmit
call npx tsc --noEmit
echo.
echo Diagnostics complete. Press any key to return to menu...
pause >nul
goto MENU

:TEST
cls
cd /d "C:\Users\apo_q\OneDrive\Documents\alucalculator"
echo =====================================================================
echo [TEST] Running Unit Tests (Vitest)...
echo =====================================================================
call npx vitest run
echo.
echo Tests completed. Press any key to return to menu...
pause >nul
goto MENU

:DEPLOY
cls
cd /d "C:\Users\apo_q\OneDrive\Documents\alucalculator"
echo =====================================================================
echo [DEPLOY] Triggering Deployment Pipeline to Hostinger...
echo =====================================================================
call npm run deploy
echo.
echo Deployment process finished. Press any key to return to menu...
pause >nul
goto MENU

:INSTALL
cls
cd /d "C:\Users\apo_q\OneDrive\Documents\alucalculator"
echo =====================================================================
echo [INSTALL] Installing Packages via npm...
echo =====================================================================
call npm install
echo.
echo Installation complete. Press any key to return to menu...
pause >nul
goto MENU
