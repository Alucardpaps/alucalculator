@echo off
SETLOCAL EnableDelayedExpansion
TITLE AluCalc - CONTROL CENTER

:MENU
cls
echo ============================================================
echo           AluCalc - PROJECT CONTROL CENTER
echo ============================================================
echo.
echo   [1] START DEVELOPMENT (npm run dev)
echo   [2] BUILD PRODUCTION (npm run build)
echo   [3] DEPLOY APP (npm run deploy)
echo   [4] RUN DIAGNOSTICS (lint + tsc)
echo   [5] EXIT
echo.
echo ============================================================
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto DEV
if "%choice%"=="2" goto BUILD
if "%choice%"=="3" goto DEPLOY
if "%choice%"=="4" goto DIAG
if "%choice%"=="5" exit

echo Invalid choice. Try again.
pause
goto MENU

:DEV
cls
echo Starting Dev Mode...
call RUN_DEV.bat
goto MENU

:BUILD
cls
echo Starting Build...
call RUN_BUILD.bat
goto MENU

:DEPLOY
cls
echo Starting Deployment...
call RUN_DEPLOY.bat
goto MENU

:DIAG
cls
echo Starting Diagnostics...
call RUN_DIAGNOSTICS.bat
goto MENU
