@echo off
TITLE AluCalc - DIAGNOSTICS
echo Running Linting...
npm run lint
echo.
echo Running Type Checks...
npx tsc --noEmit
echo.
echo Diagnostics complete.
pause
