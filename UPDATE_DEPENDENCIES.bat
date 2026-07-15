@echo off
setlocal
:: // Launch the PowerShell updater that targets the same private runtime as the Full installer.
set "SCRIPT_DIR=%~dp0"
set "UPDATER=%SCRIPT_DIR%UPDATE_DEPENDENCIES_WINDOWS.ps1"

title YouTube Downloader - Dependency Updater
echo.
echo ========================================
echo YouTube Downloader - Dependency Updater
echo ========================================
echo.

if exist "%UPDATER%" goto :run
echo [ERROR] Missing updater: "%UPDATER%"
set "EXIT_CODE=1"
goto :finish

:run
powershell -NoProfile -ExecutionPolicy Bypass -File "%UPDATER%"
set "EXIT_CODE=%ERRORLEVEL%"

:finish
echo.
if not "%EXIT_CODE%"=="0" (
    echo Dependency update failed with code %EXIT_CODE%.
) else (
    echo All dependency checks completed successfully.
)
echo.
echo Press any key to exit...
pause >nul
exit /b %EXIT_CODE%
