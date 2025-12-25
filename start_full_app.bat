@echo off
echo Starting PM Login Full Application...
echo.

echo [1/2] Starting Python Backend...
cd pmlogin-back
start "PM Login Backend" cmd /k "python start.py"
echo Backend starting on http://localhost:8000
echo.

echo [2/2] Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Electron Frontend...
cd ..\pmlogin-app_v2
start "PM Login Frontend" cmd /k "npm start"
echo.

echo ✅ Both backend and frontend are starting!
echo 🌐 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo 🖥️ Frontend: Electron app will open automatically
echo.
echo Press any key to exit this window...
pause > nul