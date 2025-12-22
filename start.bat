@echo off
echo ========================================
echo   PMLogin Electron - Starting App
echo ========================================
echo.
echo [*] Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)

echo [*] Checking dependencies...
if not exist "node_modules" (
    echo [*] Installing dependencies...
    npm install
)

echo [*] Starting PMLogin Electron...
echo.
echo ========================================
echo   DEMO MODE INSTRUCTIONS
echo ========================================
echo   Email: demo@pmlogin.com
echo   Password: any password (demo mode)
echo ========================================
echo.

npm start

pause