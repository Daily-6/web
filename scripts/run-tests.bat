@echo off
cd /d "D:\课程材料\大一暑校\web开发\大作业\webdev-template"
del /f backend\data\course-demo.sqlite 2>nul

start "backend" /B cmd /c "npm run dev --workspace backend > backend.log 2>&1"

echo Waiting for backend to start...
timeout /t 12 /nobreak >nul

echo Running API contract tests...
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test backend/test/api-contract.test.mts

echo Cleaning up...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":7001" ^| findstr "LISTENING"') do taskkill /PID %%a /F 2>nul