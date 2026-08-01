@echo off
title Aura Medical Center Management System (MCMS)
color 0b

echo =====================================================================
echo    Aura Medical Center Management System (MCMS) Launcher
echo =====================================================================
echo.
echo Checking environment status...

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not added to your PATH environment variable.
    echo Please download and install Node.js from https://nodejs.org/ before running this system.
    echo.
    pause
    exit /b
)

echo [OK] Node.js environment detected.
echo.
echo Starting MCMS backend database server and frontend interface...
echo (The web portal will open automatically in your browser shortly)
echo.
echo Press Ctrl+C in this console window to terminate the system at any time.
echo ---------------------------------------------------------------------
echo.

:: Navigate to the directory containing the batch script
cd /d "%~dp0"

:: Start concurrently dev environment
npm run dev

pause
