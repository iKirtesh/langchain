@echo off
title LangChain Showcase App Launcher
color 0B

echo =====================================================================
echo              LANGCHAIN SHOWCASE APPLICATION LAUNCHER
echo =====================================================================
echo.

:: Check if Python virtual environment exists
if not exist ".venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment '.venv' not found in this directory.
    echo.
    echo Please make sure you have:
    echo  1. Installed Python 3.10+
    echo  2. Created the environment: 'python -m venv .venv'
    echo  3. Installed dependencies: '.venv\Scripts\pip install -r requirements.txt'
    echo.
    pause
    exit /b 1
)

echo [INFO] Activating virtual environment (.venv)...
call .venv\Scripts\activate.bat
echo [SUCCESS] Virtual environment active.
echo.

echo [INFO] Launching FastAPI backend server...
echo [INFO] Direct your browser to: http://127.0.0.1:8000
echo.
python main.py

if %ERRORLEVEL% neq 0 (
    echo.
    echo [WARNING] Application stopped with exit code %ERRORLEVEL%.
    pause
)
