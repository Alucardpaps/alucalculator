@echo off
SETLOCAL EnableDelayedExpansion
TITLE AluCalc OS v5.0 - Control Center
COLOR 0B

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
echo                       PROJECT CONTROL CENTER v5.0
echo =====================================================================
echo.
echo    [1] START DEVELOPMENT SERVER  (next dev)
echo    [2] BUILD FOR PRODUCTION      (next build)
echo    [3] CLEAN NEXT.JS CACHE       (del .next ^& build)
echo    [4] RUN CODE DIAGNOSTICS      (eslint + tsc check)
echo    [5] RUN TEST SUITE            (vitest unit tests)
echo    [6] DEPLOY APPLICATION        (powershell deploy)
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
echo =====================================================================
echo [DEV] Starting Development Server...
echo =====================================================================
call npm run dev
echo.
echo Server stopped. Press any key to return to menu...
pause >nul
goto MENU

:BUILD
cls
echo =====================================================================
echo [BUILD] Building Production Bundle...
echo =====================================================================
call npm run build
echo.
echo Build complete. Press any key to return to menu...
pause >nul
goto MENU

:CLEAN
cls
echo =====================================================================
echo [CLEAN] Clearing Next.js Caches ^& Rebuilding...
echo =====================================================================
if exist .next (
    echo Deleting .next cache folder...
    rmdir /s /q .next
    echo Cache cleared.
) else (
    echo No .next folder found.
)
echo.
echo Rebuilding project...
call npm run build
echo.
echo Clean build completed. Press any key to return to menu...
pause >nul
goto MENU

:DIAG
cls
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
echo =====================================================================
echo [DEPLOY] Triggering Powershell Deployment Script...
echo =====================================================================
call npm run deploy
echo.
echo Deployment process finished. Press any key to return to menu...
pause >nul
goto MENU

:INSTALL
cls
echo =====================================================================
echo [INSTALL] Installing Packages via npm...
echo =====================================================================
call npm install
echo.
echo Installation complete. Press any key to return to menu...
pause >nul
goto MENU
