@echo off
echo Starting PM Login Local Backend API...

REM Kiểm tra Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Python không được tìm thấy. Vui lòng cài đặt Python.
    pause
    exit /b 1
)

REM Cài đặt dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Khởi động server
echo Starting FastAPI server on http://127.0.0.1:8000...
python main.py

pause