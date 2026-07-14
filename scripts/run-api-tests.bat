@echo off
cd /d "%~dp0.."
echo === Cleaning old database ===
del /f backend\data\course-demo.sqlite 2>nul

echo === Starting backend ===
start "backend-test" /B cmd /c "npm run dev --workspace backend > backend-test.log 2>&1"

echo === Waiting for backend (15s) ===
timeout /t 15 /nobreak >nul

echo === Running API contract tests ===
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test backend/test/api-contract.test.mts

echo === Cleaning up ===
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":7001" ^| findstr "LISTENING"') do taskkill /PID %%a /F 2>nul
del /f backend-test.log 2>nul